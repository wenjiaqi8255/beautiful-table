import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

describe('Auth Client - Better Auth Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default fetch mock
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
  });

  describe('Better Auth Client Initialization', () => {
    it('should export authClient', async () => {
      const { authClient } = await import('./auth');
      expect(authClient).toBeDefined();
    });

    it('should export signIn, signOut, signUp hooks', async () => {
      const { signIn, signOut, signUp } = await import('./auth');
      expect(signIn).toBeDefined();
      expect(signOut).toBeDefined();
      expect(signUp).toBeDefined();
    });
  });

  describe('AuthError', () => {
    it('should create AuthError with message', async () => {
      const { AuthError } = await import('./auth');
      const error = new AuthError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.name).toBe('AuthError');
    });

    it('should be instanceof Error', async () => {
      const { AuthError } = await import('./auth');
      const error = new AuthError('Test error');

      expect(error instanceof Error).toBe(true);
    });
  });

  describe('getCurrentUser', () => {
    it('should return user data from Better Auth session', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        credits: 10,
        totalPurchased: 0,
        createdAt: Date.now(),
      };

      // Mock Better Auth getSession
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            user: mockUser,
          },
        }),
      });

      const { getCurrentUser } = await import('./auth');
      const user = await getCurrentUser();

      expect(user).toEqual(mockUser);
    });

    it('should return null when no session exists', async () => {
      // Mock Better Auth getSession with no session
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: null,
        }),
      });

      const { getCurrentUser } = await import('./auth');
      const user = await getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe('login', () => {
    it('should call Better Auth signIn.email', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        credits: 10,
        totalPurchased: 0,
        createdAt: Date.now(),
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: { user: mockUser, token: 'test-token' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: { user: mockUser },
          }),
        });

      const { login } = await import('./auth');
      const result = await login('test@example.com', 'password123');

      expect(result.user).toEqual(mockUser);
      expect(result.token).toBeDefined();
    });

    it('should handle login errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          error: { message: 'Invalid credentials' },
        }),
      });

      const { login, AuthError } = await import('./auth');

      await expect(login('test@example.com', 'wrongpassword')).rejects.toThrow(AuthError);
    });
  });

  describe('register', () => {
    it('should call Better Auth signUp.email', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        credits: 10,
        totalPurchased: 0,
        createdAt: Date.now(),
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: { user: mockUser, token: 'test-token' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: { user: mockUser },
          }),
        });

      const { register } = await import('./auth');
      const result = await register('test@example.com', 'password123');

      expect(result.user).toEqual(mockUser);
      expect(result.token).toBeDefined();
    });

    it('should handle registration errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          error: { message: 'Email already exists' },
        }),
      });

      const { register, AuthError } = await import('./auth');

      await expect(register('test@example.com', 'password123')).rejects.toThrow(AuthError);
    });
  });

  describe('signInWithGoogle', () => {
    it('should call Better Auth signIn.social', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { url: 'https://accounts.google.com/...' },
        }),
      });

      const { signInWithGoogle } = await import('./auth');
      await expect(signInWithGoogle()).resolves.not.toThrow();
    });

    it('should handle OAuth errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('OAuth failed'));

      const { signInWithGoogle, AuthError } = await import('./auth');

      await expect(signInWithGoogle()).rejects.toThrow(AuthError);
    });
  });

  describe('signOutUser', () => {
    it('should call Better Auth signOut', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const { signOutUser } = await import('./auth');
      await expect(signOutUser()).resolves.not.toThrow();
    });

    it('should handle sign out errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const { signOutUser, AuthError } = await import('./auth');

      await expect(signOutUser()).rejects.toThrow(AuthError);
    });
  });
});
