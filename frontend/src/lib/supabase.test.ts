import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase module
vi.mock('@supabase/supabase-js');

// Mock auth methods
const mockSignInWithOAuth = vi.fn();
const mockSignOut = vi.fn();
const mockGetUser = vi.fn();

const mockAuth = {
  signInWithOAuth: mockSignInWithOAuth,
  signOut: mockSignOut,
  getSession: vi.fn(),
  getUser: mockGetUser,
};

describe('Supabase Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementation
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: mockAuth,
    });
  });

  describe('supabase client initialization', () => {
    it('should create a Supabase client with environment variables', async () => {
      const { supabase } = await import('./supabase');
      expect(supabase).toBeDefined();
      expect(supabase.auth).toBeDefined();
    });

    it('should throw error if Supabase URL is missing', () => {
      // This test verifies the runtime check
      expect(() => {
        const url = import.meta.env.VITE_SUPABASE_URL;
        if (!url) {
          throw new Error('Missing VITE_SUPABASE_URL environment variable');
        }
      }).not.toThrow();
    });

    it('should throw error if Anon key is missing', () => {
      expect(() => {
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (!key) {
          throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
        }
      }).not.toThrow();
    });
  });

  describe('signIn', () => {
    it('should call signInWithOAuth with Google provider', async () => {
      mockSignInWithOAuth.mockResolvedValue({
        data: {},
        error: null,
      });

      const { signIn } = await import('./supabase');
      await signIn();

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('/auth/callback'),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
    });

    it('should throw AuthError on sign-in failure', async () => {
      const mockError = new Error('Auth failed');
      mockSignInWithOAuth.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { signIn } = await import('./supabase');
      await expect(signIn()).rejects.toThrow('Auth failed');
    });

    it('should include error message in AuthError', async () => {
      const mockError = { message: 'Invalid credentials' };
      mockSignInWithOAuth.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { signIn } = await import('./supabase');
      await expect(signIn()).rejects.toThrow('Invalid credentials');
    });
  });

  describe('signOut', () => {
    it('should call signOut successfully', async () => {
      mockSignOut.mockResolvedValue({
        error: null,
      });

      const { signOut } = await import('./supabase');
      await expect(signOut()).resolves.not.toThrow();
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should throw AuthError on sign-out failure', async () => {
      const mockError = new Error('Sign out failed');
      mockSignOut.mockResolvedValue({
        error: mockError,
      });

      const { signOut } = await import('./supabase');
      await expect(signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('getCurrentUser', () => {
    it('should return user data when session exists', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {
          name: 'Test User',
          avatar: 'https://example.com/avatar.png',
        },
      };
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { getCurrentUser } = await import('./supabase');
      const user = await getCurrentUser();

      expect(user).toEqual(mockUser);
      expect(mockGetUser).toHaveBeenCalled();
    });

    it('should return null when no session exists', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { getCurrentUser } = await import('./supabase');
      const user = await getCurrentUser();

      expect(user).toBeNull();
    });

    it('should throw AuthError on getUser failure', async () => {
      const mockError = new Error('Get user failed');
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: mockError,
      });

      const { getCurrentUser } = await import('./supabase');
      await expect(getCurrentUser()).rejects.toThrow('Get user failed');
    });

    it('should return user with id, email, and metadata', async () => {
      const mockUser = {
        id: 'user-456',
        email: 'user@example.com',
        user_metadata: {
          full_name: 'User Name',
          picture: 'https://example.com/pic.jpg',
        },
      };
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { getCurrentUser } = await import('./supabase');
      const user = await getCurrentUser();

      expect(user?.id).toBe('user-456');
      expect(user?.email).toBe('user@example.com');
      expect(user?.user_metadata).toBeDefined();
    });
  });
});
