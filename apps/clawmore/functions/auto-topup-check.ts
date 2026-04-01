import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { chargeAutoTopup } from '../lib/billing';
import { addCredits } from '../lib/db';
import {
  sendAutoTopupSuccessEmail,
  sendAutoTopupFailedEmail,
  sendLowBalanceWarningEmail,
} from '../lib/email';
import { Resource } from 'sst';

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

/**
 * Hourly cron that checks all users with auto-topup enabled.
 * If their AI token balance drops below their refill threshold,
 * charges their saved payment method and adds credits.
 *
 * Also sends low-balance warnings when balance drops below 2x threshold.
 */
export const handler = async (_event: any) => {
  console.log('Starting auto-topup check...');

  // Scan all user metadata records with autoTopupEnabled
  const scanResult = await docClient.send(
    new ScanCommand({
      TableName: Resource.ClawMoreTable.name,
      FilterExpression: 'EntityType = :type AND autoTopupEnabled = :enabled',
      ExpressionAttributeValues: {
        ':type': 'UserMetadata',
        ':enabled': true,
      },
    })
  );

  const users = scanResult.Items || [];
  console.log(`Found ${users.length} users with auto-topup enabled`);

  let toppedUp = 0;
  let warned = 0;
  let failed = 0;

  for (const user of users) {
    const email = user.PK.replace('USER#', '');
    const balance = user.aiTokenBalanceCents || 0;
    const threshold = user.aiRefillThresholdCents || 100; // $1.00
    const topupAmount = user.aiTopupAmountCents || 1000; // $10.00
    const customerId = user.stripeCustomerId;

    // Check if balance is below threshold — needs top-up
    if (balance < threshold) {
      if (!customerId) {
        console.warn(
          `User ${email} has auto-topup enabled but no Stripe customer ID`
        );
        failed++;
        continue;
      }

      console.log(
        `User ${email} balance $${(balance / 100).toFixed(2)} < threshold $${(threshold / 100).toFixed(2)} — charging $${(topupAmount / 100).toFixed(2)}`
      );

      const success = await chargeAutoTopup(
        customerId,
        topupAmount,
        `ClawMore Auto Top-Up ($${(topupAmount / 100).toFixed(2)})`
      );

      if (success) {
        // Add credits to user's balance
        const result = await addCredits(email, topupAmount);
        console.log(
          `Auto-topup succeeded for ${email}: $${(result.newBalance / 100).toFixed(2)} (was suspended: ${result.wasSuspended})`
        );

        sendAutoTopupSuccessEmail(email, topupAmount, result.newBalance).catch(
          (err) =>
            console.error('Failed to send auto-topup success email:', err)
        );

        toppedUp++;
      } else {
        console.warn(`Auto-topup failed for ${email}`);
        sendAutoTopupFailedEmail(email, topupAmount).catch((err) =>
          console.error('Failed to send auto-topup failed email:', err)
        );
        failed++;
      }
    }
    // Low-balance warning (between 1x and 2x threshold)
    else if (balance < threshold * 2) {
      // Check if we already sent a warning recently (within 24h)
      const lastWarning = user.lastLowBalanceWarningAt;
      const now = new Date();
      const shouldWarn =
        !lastWarning ||
        now.getTime() - new Date(lastWarning).getTime() > 24 * 60 * 60 * 1000;

      if (shouldWarn) {
        console.log(
          `Sending low-balance warning to ${email} ($${(balance / 100).toFixed(2)} remaining)`
        );

        sendLowBalanceWarningEmail(email, balance, threshold).catch((err) =>
          console.error('Failed to send low-balance warning:', err)
        );

        // Mark warning as sent
        await docClient
          .send(
            new (await import('@aws-sdk/lib-dynamodb')).UpdateCommand({
              TableName: Resource.ClawMoreTable.name,
              Key: { PK: user.PK, SK: user.SK },
              UpdateExpression: 'SET lastLowBalanceWarningAt = :now',
              ExpressionAttributeValues: {
                ':now': now.toISOString(),
              },
            })
          )
          .catch(console.error);

        warned++;
      }
    }
  }

  console.log(
    `Auto-topup check complete: ${toppedUp} topped up, ${warned} warned, ${failed} failed`
  );
};
