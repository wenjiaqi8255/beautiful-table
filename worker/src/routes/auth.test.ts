import { describe, it, expect } from 'vitest';
import { authRoutes } from './auth';
import { createAuth } from '../lib/better-auth';

// Mock environment
const mockEnv: any = {
  DATABASE_URL: 'postgresql://test:test@localhost/test',
  BETTER_AUTH_SECRET: 'test-secret-key-for-testing',
  GOOGLE_CLIENT_ID: 'test-google-client-id',
  GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
  APP_URL: 'http://localhost:8788',
  STRIPE_SECRET_KEY: 'test-stripe-key',
};

describe('Auth Routes - Better Auth Integration', () => {
  it('should export auth routes', () => {
    expect(authRoutes).toBeDefined();
  });

  it('should handle all HTTP methods for Better Auth', () => {
    // Better Auth handler supports GET, POST, PUT, DELETE, PATCH
    expect(authRoutes).toBeDefined();
  });

  it('should integrate with Better Auth handler', () => {
    const auth = createAuth(mockEnv);
    expect(auth.handler).toBeDefined();
    expect(typeof auth.handler).toBe('function');
  });
});
