export interface PricingTier {
  name: string;
  credits: number;
  price: number; // in dollars
  description: string;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    name: 'Basic',
    credits: 10,
    price: 9,
    description: 'Perfect for occasional use',
  },
  {
    name: 'Pro',
    credits: 50,
    price: 39,
    description: 'Best value for regular users',
  },
  {
    name: 'Enterprise',
    credits: 200,
    price: 99,
    description: 'For power users and teams',
  },
];

/**
 * Get credits for a given payment amount (in cents)
 */
export function getCreditsForAmount(amount: number): number {
  const priceMap: Record<number, number> = {
    900: 10,   // $9
    3900: 50,  // $39
    9900: 200, // $99
  };

  return priceMap[amount] || 0;
}

/**
 * Calculate price in cents for a given number of credits
 */
export function calculatePrice(credits: number): number {
  const creditMap: Record<number, number> = {
    10: 900,    // $9
    50: 3900,   // $39
    200: 9900,  // $99
  };

  return creditMap[credits] || 0;
}

/**
 * Create a payment intent with Stripe
 * TODO: Implement actual Stripe integration
 */
export async function createPaymentIntent(amount: number, userId: string) {
  // Placeholder for Stripe payment intent creation
  return {
    id: `pi_${Date.now()}`,
    amount,
    currency: 'usd',
    status: 'requires_payment_method' as const,
    clientSecret: `pi_${Date.now()}_secret_${userId}`,
  };
}

/**
 * Handle Stripe webhook events
 * TODO: Implement actual webhook handling
 */
export async function handleWebhook(event: string, data: any) {
  switch (event) {
    case 'payment_intent.succeeded':
      return handlePaymentSucceeded(data);
    case 'payment_intent.failed':
      return handlePaymentFailed(data);
    default:
      return { received: true };
  }
}

async function handlePaymentSucceeded(data: any) {
  const { id, amount, metadata } = data;
  const userId = metadata?.userId;

  if (!userId) {
    throw new Error('Missing userId in payment metadata');
  }

  const credits = getCreditsForAmount(amount);

  // TODO: Add credits to user in D1 database
  // TODO: Record transaction

  return {
    userId,
    creditsAdded: credits,
    paymentIntentId: id,
  };
}

async function handlePaymentFailed(data: any) {
  const { id, last_payment_error } = data;
  return {
    paymentIntentId: id,
    error: last_payment_error?.message || 'Payment failed',
  };
}
