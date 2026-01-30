import { eq, sql } from 'drizzle-orm';
import { getDb } from '../db';
import { user, transactions } from '../db/schema';

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
export async function handleWebhook(event: string, data: any, env: any) {
  switch (event) {
    case 'payment_intent.succeeded':
      return await handlePaymentSucceeded(data, env);
    case 'payment_intent.failed':
      return handlePaymentFailed(data);
    default:
      return { received: true };
  }
}

async function handlePaymentSucceeded(data: any, env: any) {
  const { id, amount, metadata } = data;
  const userId = metadata?.userId;

  if (!userId) {
    throw new Error('Missing userId in payment metadata');
  }

  const credits = getCreditsForAmount(amount);
  const db = getDb(env.DATABASE_URL);

  // Add credits to user
  await db
    .update(user)
    .set({
      credits: sql`${user.credits} + ${credits}`,
      totalPurchased: sql`${user.totalPurchased} + ${credits}`,
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(user.id, userId));

  // Record transaction
  const transactionId = crypto.randomUUID();
  await db.insert(transactions).values({
    id: transactionId,
    userId,
    amount,
    creditsPurchased: credits,
    stripePaymentIntentId: id,
    status: 'completed',
    createdAt: Math.floor(Date.now() / 1000),
  });

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
