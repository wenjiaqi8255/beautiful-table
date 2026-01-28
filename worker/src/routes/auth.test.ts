import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authRoutes } from './auth';
import { generateId, hashPassword, signJWT } from '../lib/auth';

describe('Auth API Routes', () => {
  let mockDb: D1Database;
  let mockEnv: any;
  let mockJwtSecret: string;

  beforeEach(() => {
    mockJwtSecret = 'test-jwt-secret';

    // Mock D1 database
    mockDb = {
      prepare: vi.fn().mockReturnThis(),
      bind: vi.fn().mockReturnThis(),
      first: vi.fn(),
      run: vi.fn(),
      all: vi.fn(),
      batch: vi.fn(),
    } as any;

    // Mock environment
    mockEnv = {
      DB: mockDb,
      JWT_SECRET: mockJwtSecret,
      GOOGLE_OAUTH_CLIENT_ID: 'test-client-id',
      GOOGLE_OAUTH_CLIENT_SECRET: 'test-client-secret',
    };

    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: generateId(),
        email: 'test@example.com',
        credits: 10,
        total_purchased: 0,
        created_at: new Date().toISOString(),
      };

      mockDb.first
        .mockResolvedValueOnce(null) // Email not found
        .mockResolvedValueOnce(mockUser); // Created user

      mockDb.run.mockResolvedValue({ success: true } as any);

      const app = authRoutes();
      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await app.fetch(request, mockEnv);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('test@example.com');
      expect(data.token).toBeDefined();
    });

    it('should reject registration with existing email', async () => {
      mockDb.first.mockResolvedValueOnce({
        id: 'existing-user',
        email: 'test@example.com',
      });

      const app = authRoutes();
      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await app.fetch(request, mockEnv);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('already exists');
    });

    it('should reject registration with invalid email', async () => {
      const app = authRoutes();
      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'invalid-email', password: 'password123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await app.fetch(request, mockEnv);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should reject registration with weak password', async () => {
      const app = authRoutes();
      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: '123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await app.fetch(request, mockEnv);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('password');
    });

    it('should reject registration without password', async () => {
      const app = authRoutes();
      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await app.fetch(request, mockEnv);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const userId = generateId();
      const passwordHash = await hashPassword('password123');

      mockDb.first
        .mockResolvedValueOnce({
          id: userId,
          email: 'test@example.com',
        })
        .mockResolvedValueOnce({ password_hash: passwordHash })
        .mockResolvedValueOnce({
          id: userId,
          email: 'test@example.com',
          credits: 10,
          total_purchased: 0,
          last_login: new Date().toISOString(),
        });

      mockDb.run.mockResolvedValue({ success: true } as any);

      const app = authRoutes();
      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await app.fetch(request, mockEnv);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('test@example.com');
      expect(data.token).toBeDefined();
    });

    it('should reject login with incorrect password', async () => {
      const userId = generateId();
      const passwordHash = await hashPassword('correctpassword');

      mockDb.first
        .mockResolvedValueOnce({
          id: userId,
          email: 'test@example.com',
        })
        .mockResolvedValueOnce({ password_hash: passwordHash });

      const app = authRoutes();
      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'wrongpassword' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await app.fetch(request, mockEnv);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('credentials');
    });

    it('should reject login for non-existent user', async () => {
      mockDb.first.mockResolvedValueOnce(null);

      const app = authRoutes();
      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'nonexistent@example.com', password: 'password123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await app.fetch(request, mockEnv);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });
  });

  describe('GET /api/auth/oauth/google', () => {
    it('should return Google OAuth URL', async () => {
      const app = authRoutes();
      const request = new Request('http://localhost/api/auth/oauth/google', {
        method: 'GET',
      });

      const response = await app.fetch(request, mockEnv);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.url).toBeDefined();
      expect(data.url).toContain('accounts.google.com');
      expect(data.state).toBeDefined();
    });

    it('should include state parameter for CSRF protection', async () => {
      const app = authRoutes();
      const request = new Request('http://localhost/api/auth/oauth/google', {
        method: 'GET',
      });

      const response = await app.fetch(request, mockEnv);
      const data = await response.json();

      expect(data.state).toBeDefined();
      expect(data.url).toContain(`state=${data.state}`);
    });

    it('should use correct redirect URI from origin', async () => {
      const app = authRoutes();
      const request = new Request('http://localhost:3000/api/auth/oauth/google', {
        method: 'GET',
        headers: { Origin: 'http://localhost:3000' },
      });

      const response = await app.fetch(request, mockEnv);
      const data = await response.json();

      expect(data.url).toContain('redirect_uri=');
      expect(data.url).toContain('localhost:3000');
    });
  });

  describe('POST /api/auth/oauth/callback', () => {
    it('should handle Google OAuth callback successfully', async () => {
      const userId = generateId();
      const oauthAccountId = generateId();

      // Mock OAuth token exchange
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'google-access-token',
          refresh_token: 'google-refresh-token',
          expires_in: 3600,
        }),
      } as Response);

      // Mock user info fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'google-user-123',
          email: 'oauth@example.com',
          name: 'OAuth User',
          picture: 'https://example.com/avatar.png',
        }),
      });

      mockDb.first
        .mockResolvedValueOnce(null) // No existing OAuth account
        .mockResolvedValueOnce(null) // No existing user with email
        .mockResolvedValueOnce({
          id: userId,
          email: 'oauth@example.com',
        }); // Created user

      mockDb.run.mockResolvedValue({ success: true } as any);

      const app = authRoutes();
      const state = generateId();
      const request = new Request(`http://localhost/api/auth/oauth/callback?code=auth-code&state=${state}`, {
        method: 'POST',
      });

      const response = await app.fetch(request, mockEnv);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.token).toBeDefined();
    });

    it('should reject callback with invalid state', async () => {
      const app = authRoutes();
      const request = new Request('http://localhost/api/auth/oauth/callback?code=auth-code&state=invalid', {
        method: 'POST',
        headers: {
          Cookie: 'oauth_state=correct-state',
        },
      });

      const response = await app.fetch(request, mockEnv);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid state');
    });

    it('should reject callback without code', async () => {
      const app = authRoutes();
      const request = new Request('http://localhost/api/auth/oauth/callback?state=valid-state', {
        method: 'POST',
      });

      const response = await app.fetch(request, mockEnv);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user data for valid token', async () => {
      const userId = generateId();
      const token = await signJWT({ userId, sessionId: generateId() }, mockJwtSecret);

      mockDb.first.mockResolvedValue({
        user_id: userId,
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      });

      const app = authRoutes();
      const request = new Request('http://localhost/api/auth/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await app.fetch(request, mockEnv);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toBeDefined();
    });

    it('should reject request without token', async () => {
      const app = authRoutes();
      const request = new Request('http://localhost/api/auth/me', {
        method: 'GET',
      });

      const response = await app.fetch(request, mockEnv);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should reject request with invalid token', async () => {
      const app = authRoutes();
      const request = new Request('http://localhost/api/auth/me', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      const response = await app.fetch(request, mockEnv);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      const userId = generateId();
      const sessionId = generateId();
      const token = await signJWT({ userId, sessionId }, mockJwtSecret);

      mockDb.first.mockResolvedValue({
        user_id: userId,
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      });

      mockDb.run.mockResolvedValue({ success: true, meta: { rows_read: 1 } } as any);

      const app = authRoutes();
      const request = new Request('http://localhost/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await app.fetch(request, mockEnv);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBeDefined();
      expect(mockDb.run).toHaveBeenCalled();
    });

    it('should reject logout without token', async () => {
      const app = authRoutes();
      const request = new Request('http://localhost/api/auth/logout', {
        method: 'POST',
      });

      const response = await app.fetch(request, mockEnv);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should handle logout of already expired session gracefully', async () => {
      const token = await signJWT({ userId: generateId(), sessionId: generateId() }, mockJwtSecret);

      mockDb.first.mockResolvedValue({
        user_id: 'user-123',
        expires_at: new Date(Date.now() - 3600000).toISOString(),
      });

      const app = authRoutes();
      const request = new Request('http://localhost/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await app.fetch(request, mockEnv);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('expired');
    });
  });
});
