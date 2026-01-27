import { Hono } from 'hono';
import { verifyAuth } from '../lib/auth';
import { createPaymentIntent, handleWebhook, PRICING_TIERS } from '../lib/stripe';

type Bindings = {
  DB: D1Database;
};

const paymentRoutes = new Hono<{ Bindings: Bindings }>();

// GET /api/payment/pricing - Get pricing tiers
paymentRoutes.get('/pricing', async (c) => {
  return c.json(PRICING_TIERS);
});

// POST /api/payment/create-intent - Create payment intent
paymentRoutes.post('/create-intent', verifyAuth, async (c) => {
  const userId = c.get('userId');

  try {
    const body = await c.req.json();
    const { amount } = body;

    if (!amount || typeof amount !== 'number') {
      return c.json({ error: 'Missing or invalid amount' }, 400);
    }

    // Validate amount matches pricing tier
    const validAmounts = [900, 3900, 9900]; // cents
    if (!validAmounts.includes(amount)) {
      return c.json({ error: 'Invalid amount' }, 400);
    }

    const intent = await createPaymentIntent(amount, userId);
    return c.json(intent);
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return c.json({ error: 'Failed to create payment intent' }, 500);
  }
});

// POST /api/payment/webhook - Handle Stripe webhooks
paymentRoutes.post('/webhook', async (c) => {
  try {
    const body = await c.req.json();
    const { type, data } = body;

    const result = await handleWebhook(type, data.object);
    return c.json({ received: true, ...result });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return c.json({ error: 'Webhook handler failed' }, 500);
  }
});

export { paymentRoutes };
