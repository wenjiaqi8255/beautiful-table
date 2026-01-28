const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface User {
  id: string;
  email: string;
  credits: number;
  total_purchased: number;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Register a new user with email and password
 */
export async function register(email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new AuthError(data.error || 'Registration failed');
    }

    setToken(data.token);
    return data;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError(error instanceof Error ? error.message : 'Registration failed');
  }
}

/**
 * Login with email and password
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new AuthError(data.error || 'Login failed');
    }

    setToken(data.token);
    return data;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError(error instanceof Error ? error.message : 'Login failed');
  }
}

/**
 * Get Google OAuth URL
 */
export async function getGoogleOAuthUrl(): Promise<{ url: string; state: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/oauth/google`, {
      method: 'GET',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new AuthError(data.error || 'Failed to get OAuth URL');
    }

    return data;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError(error instanceof Error ? error.message : 'Failed to get OAuth URL');
  }
}

/**
 * Handle OAuth callback
 */
export async function handleOAuthCallback(
  code: string,
  state: string
): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/oauth/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, state }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new AuthError(data.error || 'OAuth authentication failed');
    }

    setToken(data.token);
    return data;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError(
      error instanceof Error ? error.message : 'OAuth authentication failed'
    );
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const token = getToken();

    if (!token) {
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // Clear invalid token
      removeToken();
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    // On error, clear token and return null
    removeToken();
    return null;
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  try {
    const token = getToken();

    if (token) {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    // Continue to remove local token even if API call fails
    console.error('Sign out error:', error);
  } finally {
    removeToken();
  }
}

/**
 * Get stored token from localStorage
 */
export function getToken(): string | null {
  try {
    return localStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

/**
 * Store token in localStorage
 */
export function setToken(token: string): void {
  try {
    localStorage.setItem('auth_token', token);
  } catch (error) {
    console.error('Failed to store token:', error);
  }
}

/**
 * Remove token from localStorage
 */
function removeToken(): void {
  try {
    localStorage.removeItem('auth_token');
  } catch (error) {
    console.error('Failed to remove token:', error);
  }
}

/**
 * Initiate Google OAuth sign-in
 */
export async function signInWithGoogle(): Promise<void> {
  try {
    const { url } = await getGoogleOAuthUrl();
    window.location.href = url;
  } catch (error) {
    throw new AuthError(
      error instanceof Error ? error.message : 'Failed to initiate Google sign-in'
    );
  }
}
