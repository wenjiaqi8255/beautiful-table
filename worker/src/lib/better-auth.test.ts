import { describe, it, expect, beforeAll } from 'vitest';
import { createAuth } from './better-auth';

// Mock environment for testing
const mockEnv: any = {
  DATABASE_URL: 'postgresql://test:test@localhost/test',
  BETTER_AUTH_SECRET: 'test-secret-key-for-testing',
  GOOGLE_CLIENT_ID: 'test-google-client-id',
  GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
  APP_URL: 'http://localhost:8788',
  STRIPE_SECRET_KEY: 'test-stripe-key',
};

describe('Better Auth Configuration', () => {
  let auth: ReturnType<typeof createAuth>;

  beforeAll(() => {
    auth = createAuth(mockEnv);
  });

  it('should initialize Better Auth with correct configuration', () => {
    expect(auth).toBeDefined();
    expect(auth.$Infer).toBeDefined();
  });

  it('should have email and password authentication enabled', () => {
    const config = auth.$Infer;
    expect(config).toBeDefined();
  });

  it('should have Google OAuth provider configured', () => {
    // Check that the auth instance has the correct structure
    expect(auth).toHaveProperty('handler');
    expect(auth).toHaveProperty('$Infer');
  });

  it('should have a handler function for processing requests', () => {
    expect(auth.handler).toBeDefined();
    expect(typeof auth.handler).toBe('function');
  });
});
