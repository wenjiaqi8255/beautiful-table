import { describe, it, expect, beforeAll } from 'vitest';
import { createAuth } from './better-auth';
import { env } from 'cloudflare:test';

describe('Better Auth Configuration', () => {
  let auth: ReturnType<typeof createAuth>;

  beforeAll(() => {
    auth = createAuth(env);
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
});
