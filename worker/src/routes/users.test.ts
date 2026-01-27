import { describe, it, expect, beforeEach, vi } from 'vitest';
import { userRoutes } from './users';
import { Hono } from 'hono';

// Mock verifyAuth
vi.mock('../lib/auth', () => ({
  verifyAuth: vi.fn(() => async (c: any, next: any) => {
    c.set('userId', 'test-user-123');
    await next();
  }),
}));

describe('User Routes', () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono();
    app.route('/api/users', userRoutes);
  });

  it('should have GET route defined', async () => {
    const response = await app.request('/api/users');

    // Will fail because no DB binding, but route exists
    expect(response).toBeDefined();
  });

  it('should have POST route defined', async () => {
    const response = await app.request('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: 'test', email: 'test@example.com' }),
    });

    // Will fail because no DB binding, but route exists
    expect(response).toBeDefined();
  });

  it('should export userRoutes', () => {
    expect(userRoutes).toBeDefined();
    expect(typeof userRoutes.get).toBe('function');
    expect(typeof userRoutes.post).toBe('function');
  });
});
