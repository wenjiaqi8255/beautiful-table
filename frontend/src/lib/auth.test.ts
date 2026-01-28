import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

describe('Auth Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default fetch mock
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        credits: 10,
        total_purchased: 0,
      };
      const mockToken = 'mock-jwt-token';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser, token: mockToken }),
      });

      const { register } = await import('./auth');
      const result = await register('test@example.com', 'password123');

      expect(result.user).toEqual(mockUser);
      expect(result.token).toBe(mockToken);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/register'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('test@example.com'),
        })
      );
    });

    it('should handle registration errors', async () => {
      const localStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Email already exists' }),
        status: 400,
      });

      const { register, AuthError } = await import('./auth');

      await expect(register('test@example.com', 'password123')).rejects.toThrow(AuthError);
      await expect(register('test@example.com', 'password123')).rejects.toThrow('Email already exists');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const { register, AuthError } = await import('./auth');

      await expect(register('test@example.com', 'password123')).rejects.toThrow(AuthError);
    });
  });

  describe('login', () => {
    it('should login with correct credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        credits: 10,
        total_purchased: 0,
      };
      const mockToken = 'mock-jwt-token';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser, token: mockToken }),
      });

      const { login } = await import('./auth');
      const result = await login('test@example.com', 'password123');

      expect(result.user).toEqual(mockUser);
      expect(result.token).toBe(mockToken);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should handle login errors with incorrect credentials', async () => {
      const localStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' }),
        status: 401,
      });

      const { login, AuthError } = await import('./auth');

      await expect(login('test@example.com', 'wrongpassword')).rejects.toThrow(AuthError);
      await expect(login('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid credentials');
    });

    it('should handle network errors during login', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const { login, AuthError } = await import('./auth');

      await expect(login('test@example.com', 'password123')).rejects.toThrow(AuthError);
    });
  });

  describe('getGoogleOAuthUrl', () => {
    it('should return Google OAuth URL and state', async () => {
      const mockUrl = 'https://accounts.google.com/o/oauth2/v2/auth?...';
      const mockState = 'random-state-123';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: mockUrl, state: mockState }),
      });

      const { getGoogleOAuthUrl } = await import('./auth');
      const result = await getGoogleOAuthUrl();

      expect(result.url).toBe(mockUrl);
      expect(result.state).toBe(mockState);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/oauth/google'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle OAuth URL generation errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Configuration error' }),
        status: 500,
      });

      const { getGoogleOAuthUrl, AuthError } = await import('./auth');

      await expect(getGoogleOAuthUrl()).rejects.toThrow(AuthError);
    });
  });

  describe('handleOAuthCallback', () => {
    it('should handle OAuth callback successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'oauth@example.com',
        credits: 10,
      };
      const mockToken = 'oauth-jwt-token';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser, token: mockToken }),
      });

      const { handleOAuthCallback } = await import('./auth');
      const result = await handleOAuthCallback('auth-code-123', 'state-123');

      expect(result.user).toEqual(mockUser);
      expect(result.token).toBe(mockToken);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/oauth/callback'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('auth-code-123'),
        })
      );
    });

    it('should handle OAuth callback errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid OAuth code' }),
        status: 400,
      });

      const { handleOAuthCallback, AuthError } = await import('./auth');

      await expect(handleOAuthCallback('invalid-code', 'state-123')).rejects.toThrow(AuthError);
    });

    it('should handle OAuth callback with missing state', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'State parameter is required' }),
        status: 400,
      });

      const { handleOAuthCallback, AuthError } = await import('./auth');

      await expect(handleOAuthCallback('auth-code-123', '')).rejects.toThrow(AuthError);
    });
  });

  describe('getCurrentUser', () => {
    it('should return user data when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        credits: 10,
      };

      // Mock localStorage
      const localStorageMock = {
        getItem: vi.fn().mockReturnValue('valid-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser }),
      });

      const { getCurrentUser } = await import('./auth');
      const user = await getCurrentUser();

      expect(user).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/me'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer valid-token',
          }),
        })
      );
    });

    it('should return null when no token in localStorage', async () => {
      const localStorageMock = {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });

      const { getCurrentUser } = await import('./auth');
      const user = await getCurrentUser();

      expect(user).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return null when authentication fails', async () => {
      const localStorageMock = {
        getItem: vi.fn().mockReturnValue('invalid-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const { getCurrentUser } = await import('./auth');
      const user = await getCurrentUser();

      expect(user).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
    });

    it('should handle network errors gracefully', async () => {
      const localStorageMock = {
        getItem: vi.fn().mockReturnValue('valid-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });

      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const { getCurrentUser } = await import('./auth');
      const user = await getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      const localStorageMock = {
        getItem: vi.fn().mockReturnValue('valid-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Logged out successfully' }),
      });

      const { signOut } = await import('./auth');
      await expect(signOut()).resolves.not.toThrow();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/logout'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer valid-token',
          }),
        })
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
    });

    it('should remove token even when API call fails', async () => {
      const localStorageMock = {
        getItem: vi.fn().mockReturnValue('valid-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });

      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const { signOut } = await import('./auth');

      await expect(signOut()).resolves.not.toThrow();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
    });

    it('should handle sign out when no token exists', async () => {
      const localStorageMock = {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });

      const { signOut } = await import('./auth');
      await expect(signOut()).resolves.not.toThrow();

      expect(global.fetch).not.toHaveBeenCalled();
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

  describe('getToken and setToken', () => {
    it('should get token from localStorage', async () => {
      const localStorageMock = {
        getItem: vi.fn().mockReturnValue('stored-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });

      const { getToken } = await import('./auth');
      const token = getToken();

      expect(token).toBe('stored-token');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('auth_token');
    });

    it('should set token in localStorage', async () => {
      const localStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });

      const { setToken } = await import('./auth');
      setToken('new-token');

      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'new-token');
    });
  });
});
