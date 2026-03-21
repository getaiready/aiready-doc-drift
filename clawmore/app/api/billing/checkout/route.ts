import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { createPlatformSubscriptionSession } from '../../../../lib/billing';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const host =
      process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.get('host')}`;

    // In a real scenario, you'd lookup their stripeCustomerId from DynamoDB first.
    // If they have one, you pass it here. If not, Stripe creates a new customer.

    const checkoutSession = await createPlatformSubscriptionSession({
      userEmail: session.user.email,
      successUrl: `${host}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${host}/dashboard`,
    });

    if (!checkoutSession.url) {
      throw new Error('Failed to create checkout session url');
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Error creating platform checkout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
