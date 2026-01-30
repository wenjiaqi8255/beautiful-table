import { createAuthClient } from 'better-auth/react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
} = authClient;

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  credits: number;
  totalPurchased: number;
  createdAt: number;
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
 * Get current authenticated user using Better Auth
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const session = await authClient.getSession();

    if (!session.data) {
      return null;
    }

    return session.data.user as unknown as User;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Sign in with email and password
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await signIn.email({
      email,
      password,
    });

    if (response.error) {
      throw new AuthError(response.error.message || 'Login failed');
    }

    // Fetch user data after successful login
    const user = await getCurrentUser();

    if (!user) {
      throw new AuthError('Failed to fetch user data');
    }

    return {
      user,
      token: response.data?.token || '',
    };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError(error instanceof Error ? error.message : 'Login failed');
  }
}

/**
 * Register a new user with email and password
 */
export async function register(email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await signUp.email({
      email,
      password,
      name: email.split('@')[0], // Use email username as display name
    });

    if (response.error) {
      throw new AuthError(response.error.message || 'Registration failed');
    }

    // Fetch user data after successful registration
    const user = await getCurrentUser();

    if (!user) {
      throw new AuthError('Failed to fetch user data');
    }

    return {
      user,
      token: response.data?.token || '',
    };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError(error instanceof Error ? error.message : 'Registration failed');
  }
}

/**
 * Initiate Google OAuth sign-in
 */
export async function signInWithGoogle(): Promise<void> {
  try {
    // Better Auth handles OAuth automatically
    await signIn.social({
      provider: 'google',
      callbackURL: '/auth/callback',
    });
  } catch (error) {
    throw new AuthError(
      error instanceof Error ? error.message : 'Failed to initiate Google sign-in'
    );
  }
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  try {
    await signOut();
  } catch (error) {
    console.error('Sign out error:', error);
    throw new AuthError('Failed to sign out');
  }
}
