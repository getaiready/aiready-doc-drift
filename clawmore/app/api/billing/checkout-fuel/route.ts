import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { createFuelPackCheckout } from '../../../../lib/billing';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

const dbClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-southeast-2',
});
const docClient = DynamoDBDocument.from(dbClient);
const TableName = process.env.DYNAMO_TABLE || '';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Lookup Stripe Customer ID from DynamoDB
    const { Items } = await docClient.query({
      TableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :email',
      ExpressionAttributeValues: { ':email': `USER#${session.user.email}` },
    });

    // In a real app, ensure you properly map how next-auth stores the user and how you store the stripe id.
    const stripeCustomerId = Items?.[0]?.stripeCustomerId || 'cus_placeholder'; // fallback for demo

    if (
      stripeCustomerId === 'cus_placeholder' &&
      process.env.NODE_ENV === 'production'
    ) {
      return NextResponse.json(
        {
          error:
            'No billing account found. Please subscribe to the platform first.',
        },
        { status: 400 }
      );
    }

    const host =
      process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.get('host')}`;

    const checkoutSession = await createFuelPackCheckout(
      stripeCustomerId,
      `${host}/dashboard?refill=success`,
      `${host}/dashboard?refill=cancelled`
    );

    if (!checkoutSession.url) {
      throw new Error('Failed to create fuel pack checkout url');
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Error creating fuel pack checkout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
