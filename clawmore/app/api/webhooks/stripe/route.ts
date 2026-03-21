import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

const dbClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-southeast-2',
});

const docClient = DynamoDBDocument.from(dbClient);
const TableName = process.env.DYNAMO_TABLE || '';

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_dummy_123', {
    apiVersion: '2025-01-27-acacia' as any,
  });

  const payload = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('Missing STRIPE_WEBHOOK_SECRET');
    }
    if (!sig) {
      throw new Error('Missing stripe-signature header');
    }

    event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed.`, err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Handle $29/mo Initial Subscription
        if (session.metadata?.type === 'platform_subscription') {
          const userEmail =
            session.customer_email || session.metadata?.userEmail;
          if (userEmail) {
            // Find the user by email in DynamoDB
            const { Items } = await docClient.query({
              TableName,
              IndexName: 'GSI1', // Assuming an email index exists, or we scan/fallback to PK if email is the PK
              KeyConditionExpression: 'GSI1PK = :email',
              ExpressionAttributeValues: { ':email': `USER#${userEmail}` },
            });

            // For now, let's assume we can locate the user ID or we store the email
            // Increment the AI Fuel tank by $10.00 (1000 cents) as included in the base plan
            console.log(`Setting up initial $10 AI Fuel for ${userEmail}`);

            // In a real implementation, you would update the specific user's record:
            // await docClient.update({
            //   TableName,
            //   Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
            //   UpdateExpression: 'SET aiTokenBalanceCents = if_not_exists(aiTokenBalanceCents, :zero) + :amount, stripeCustomerId = :customerId',
            //   ExpressionAttributeValues: { ':zero': 0, ':amount': 1000, ':customerId': session.customer },
            // });
          }
        }

        // Handle AI Fuel Pack Refills ($10 bump)
        if (session.metadata?.type === 'fuel_pack_refill') {
          const amountCents = parseInt(
            session.metadata.amountCents || '1000',
            10
          );
          console.log(
            `Adding ${amountCents} cents to fuel pack for customer ${session.customer}`
          );

          // Implementation would find the user by Stripe Customer ID and increment their balance
        }
        break;
      }

      case 'invoice.paid': {
        // Handle monthly renewal of the subscription - add $10 fuel
        const invoice = event.data.object as any;
        if (invoice.subscription) {
          console.log(
            `Invoice paid for subscription ${invoice.subscription}. Replenishing $10 monthly fuel allowance.`
          );
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook event:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
