import { createPlatformSubscriptionSession } from '../lib/billing';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { Resource } from 'sst';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: any) => {
  const { userId, userEmail, coEvolutionOptIn, successUrl, cancelUrl } =
    JSON.parse(event.body || '{}');

  if (!userEmail) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing userEmail' }),
    };
  }

  try {
    // 1. Fetch existing customer ID if available
    const userRes = await ddb.send(
      new GetCommand({
        TableName: Resource.ClawMoreTable.name,
        Key: { PK: `USER#${userEmail}`, SK: 'METADATA' },
      })
    );

    const customerId = userRes.Item?.stripeCustomerId;

    // 2. Create the $29/mo Subscription Session with off-session authorization
    const session = await createPlatformSubscriptionSession({
      userId,
      customerId,
      userEmail,
      coEvolutionOptIn: !!coEvolutionOptIn,
      successUrl:
        successUrl || `${Resource.ClawMoreSite.url}/dashboard?checkout=success`,
      cancelUrl:
        cancelUrl ||
        `${Resource.ClawMoreSite.url}/dashboard?checkout=cancelled`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error: any) {
    console.error('Error creating subscription session:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
