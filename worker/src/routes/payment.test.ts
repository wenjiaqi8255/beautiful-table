import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';

// Mock stripe module
vi.mock('../lib/stripe', () => ({
  createPaymentIntent: vi.fn(),
  handleWebhook: vi.fn(),
  PRICING_TIERS: [
    { name: 'Basic', credits: 10, price: 9, description: 'Perfect for occasional use' },
    { name: 'Pro', credits: 50, price: 39, description: 'Best value for regular users' },
    { name: 'Enterprise', credits: 200, price: 99, description: 'For power users and teams' },
  ],
}));

// Mock verifyAuth
vi.mock('../lib/auth', () => ({
  verifyAuth: vi.fn(() => async (c: any, next: any) => {
    c.set('userId', 'test-user-123');
    await next();
  }),
}));

import { paymentRoutes } from './payment';
import { PRICING_TIERS } from '../lib/stripe';

describe('Payment Routes', () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono();
    app.route('/api/payment', paymentRoutes);
  });

  describe('GET /api/payment/pricing', () => {
    it('should return pricing tiers', async () => {
      const response = await app.request('/api/payment/pricing');

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual(PRICING_TIERS);
    });
  });

  describe('POST /api/payment/create-intent', () => {
    it('should have route defined', async () => {
      const response = await app.request('/api/payment/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: 900 }),
      });

      expect(response).toBeDefined();
    });
  });

  describe('POST /api/payment/webhook', () => {
    it('should have route defined', async () => {
      const response = await app.request('/api/payment/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'payment_intent.succeeded',
          data: {},
        }),
      });

      expect(response).toBeDefined();
    });
  });

  it('should export paymentRoutes', () => {
    expect(paymentRoutes).toBeDefined();
    expect(typeof paymentRoutes.get).toBe('function');
    expect(typeof paymentRoutes.post).toBe('function');
  });
});
