import {
  CostExplorerClient,
  GetCostAndUsageCommand,
} from '@aws-sdk/client-cost-explorer';
import { putMetric } from '../lib/metrics';
import { format, startOfMonth } from 'date-fns';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { reportOverageCharge } from '../lib/billing';
import { sendCloudCostWarningEmail } from '../lib/email';
import { Resource } from 'sst';
import { BILLING_CONFIG, getPlanConfig } from '../lib/constants/billing';

const ceClient = new CostExplorerClient({ region: 'us-east-1' });
const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

export const handler = async (_event: any) => {
  console.log('Starting Managed Account Cost Sync...');

  const today = new Date();
  const start = format(startOfMonth(today), 'yyyy-MM-dd');
  const end = format(today, 'yyyy-MM-dd'); // AWS requires exclusive end date or today for MTD

  if (start === end) {
    console.log(
      'First day of month, skipping sync until tomorrow to avoid AWS CE errors.'
    );
    return;
  }

  const command = new GetCostAndUsageCommand({
    TimePeriod: { Start: start, End: end },
    Granularity: 'MONTHLY',
    Metrics: ['UnblendedCost'],
    GroupBy: [{ Type: 'DIMENSION', Key: 'LINKED_ACCOUNT' }],
  });

  try {
    const response = await ceClient.send(command);
    const results = response.ResultsByTime?.[0]?.Groups || [];

    // 1. Fetch all ManagedAccounts from DynamoDB
    const accountsScan = await docClient.send(
      new ScanCommand({
        TableName: Resource.ClawMoreTable.name,
        FilterExpression: 'begins_with(PK, :pk_prefix) AND EntityType = :type',
        ExpressionAttributeValues: {
          ':pk_prefix': 'ACCOUNT#',
          ':type': 'ManagedAccount',
        },
      })
    );

    const managedAccounts = accountsScan.Items || [];

    for (const res of results) {
      const awsAccountId = res.Keys?.[0];
      const costCents = Math.floor(
        parseFloat(res.Metrics?.UnblendedCost?.Amount || '0') * 100
      );

      const account = managedAccounts.find(
        (a) => a.awsAccountId === awsAccountId
      );
      if (!account) continue;

      // Determine inclusion based on user plan
      const planId = (account.plan || 'starter').split('_').pop();
      const plan = getPlanConfig(planId);
      const inclusionCents = plan.AWS_INCLUSION_CENTS;

      console.log(
        `Account ${awsAccountId} (Plan: ${plan.ID}) spent $${(costCents / 100).toFixed(2)} MTD / $${(inclusionCents / 100).toFixed(2)}`
      );

      // Update DynamoDB with latest spend
      await docClient.send(
        new UpdateCommand({
          TableName: Resource.ClawMoreTable.name,
          Key: { PK: account.PK, SK: account.SK },
          UpdateExpression:
            'SET currentMonthlySpendCents = :spend, lastCostSync = :now',
          ExpressionAttributeValues: {
            ':spend': costCents,
            ':now': new Date().toISOString(),
          },
        })
      );

      // 2. Check for low-balance warning (80% of inclusion)
      const warningThreshold =
        inclusionCents * BILLING_CONFIG.COST_WARNING_THRESHOLD;
      const hasSentWarning = account.costWarningSent || false;

      if (
        costCents >= warningThreshold &&
        costCents <= inclusionCents &&
        !hasSentWarning
      ) {
        console.log(
          `Sending cost warning for account ${awsAccountId} ($${(costCents / 100).toFixed(2)} / $${(inclusionCents / 100).toFixed(2)})`
        );

        const ownerEmail = account.ownerEmail;
        if (ownerEmail) {
          sendCloudCostWarningEmail(
            ownerEmail,
            costCents,
            inclusionCents
          ).catch((err) =>
            console.error('Failed to send cost warning email:', err)
          );
        }

        // Mark warning as sent
        await docClient.send(
          new UpdateCommand({
            TableName: Resource.ClawMoreTable.name,
            Key: { PK: account.PK, SK: account.SK },
            UpdateExpression: 'SET costWarningSent = :sent',
            ExpressionAttributeValues: {
              ':sent': true,
            },
          })
        );
      }

      // Reset warning flag on new month (when cost drops back below threshold)
      if (costCents < warningThreshold && hasSentWarning) {
        await docClient.send(
          new UpdateCommand({
            TableName: Resource.ClawMoreTable.name,
            Key: { PK: account.PK, SK: account.SK },
            UpdateExpression: 'REMOVE costWarningSent',
          })
        );
      }

      // 3. Check for overage
      if (costCents > inclusionCents && account.stripeCustomerId) {
        const totalOverage = costCents - inclusionCents;
        const previouslyReportedOverage = account.reportedOverageCents || 0;

        if (totalOverage > previouslyReportedOverage) {
          const delta = totalOverage - previouslyReportedOverage;
          console.log(
            `Reporting $${(delta / 100).toFixed(2)} compute overage for customer ${account.stripeCustomerId}`
          );

          await reportOverageCharge(
            account.stripeCustomerId,
            delta,
            `AWS Compute Overage (MTD: $${(costCents / 100).toFixed(2)})`
          );

          // Update reported status
          await docClient.send(
            new UpdateCommand({
              TableName: Resource.ClawMoreTable.name,
              Key: { PK: account.PK, SK: account.SK },
              UpdateExpression: 'SET reportedOverageCents = :reported',
              ExpressionAttributeValues: {
                ':reported': totalOverage,
              },
            })
          );
        }
      }
    }

    await putMetric({
      name: 'CostSyncAccountsProcessed',
      value: results.length,
      unit: 'Count',
    });

    console.log(
      'Cost sync completed successfully.',
      results.length,
      'accounts processed.'
    );
  } catch (error) {
    await putMetric({
      name: 'CostSyncErrors',
      value: 1,
      unit: 'Count',
    });
    console.error('Error during cost sync:', error);
    throw error;
  }
};
