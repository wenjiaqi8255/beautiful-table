import { Hono } from 'hono';
import { cors } from 'hono/cors';
import {
  generateId,
  hashPassword,
  verifyPassword,
  createSession,
  deleteSession,
  validateSession,
  generateOAuthState,
  createGoogleOAuthUrl,
  signJWT,
} from '../lib/auth';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  GOOGLE_OAUTH_CLIENT_ID: string;
  GOOGLE_OAUTH_CLIENT_SECRET: string;
}

const authRoutes = new Hono<{ Bindings: Env }>();

// Enable CORS for all routes
authRoutes.use('/*', cors());

/**
 * POST /api/auth/register
 * Register a new user with email and password
 */
authRoutes.post('/register', async (c) => {
  try {
    const { email, password } = await c.req.json();

    // Validate input
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: 'Invalid email format' }, 400);
    }

    // Validate password strength (min 8 characters)
    if (password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters' }, 400);
    }

    // Check if user already exists
    const existingUser = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?')
      .bind(email)
      .first();

    if (existingUser) {
      return c.json({ error: 'User with this email already exists' }, 400);
    }

    // Create user
    const userId = generateId();
    const now = new Date().toISOString();

    await c.env.DB.prepare(
      'INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)'
    )
      .bind(userId, email, now)
      .run();

    // Hash password
    const passwordHash = await hashPassword(password);

    // Store password
    await c.env.DB.prepare(
      'INSERT INTO passwords (user_id, password_hash) VALUES (?, ?)'
    )
      .bind(userId, passwordHash)
      .run();

    // Create session
    const session = await createSession(c.env.DB, userId, c.env.JWT_SECRET);

    // Fetch user data
    const user = await c.env.DB.prepare(
      'SELECT id, email, credits, total_purchased, created_at FROM users WHERE id = ?'
    )
      .bind(userId)
      .first();

    return c.json({
      user,
      token: session.token,
    }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return c.json(
      { error: error instanceof Error ? error.message : 'Registration failed' },
      500
    );
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
authRoutes.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    // Validate input
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    // Find user by email
    const user = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?')
      .bind(email)
      .first();

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Get password hash
    const passwordRecord = await c.env.DB.prepare(
      'SELECT password_hash FROM passwords WHERE user_id = ?'
    )
      .bind(user.id)
      .first();

    if (!passwordRecord) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Verify password
    const isValid = await verifyPassword(password, passwordRecord.password_hash as string);

    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Update last login
    await c.env.DB.prepare(
      'UPDATE users SET last_login = ? WHERE id = ?'
    )
      .bind(new Date().toISOString(), user.id)
      .run();

    // Create session
    const session = await createSession(c.env.DB, user.id, c.env.JWT_SECRET);

    // Fetch user data
    const userData = await c.env.DB.prepare(
      'SELECT id, email, credits, total_purchased, created_at FROM users WHERE id = ?'
    )
      .bind(user.id)
      .first();

    return c.json({
      user: userData,
      token: session.token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json(
      { error: error instanceof Error ? error.message : 'Login failed' },
      500
    );
  }
});

/**
 * GET /api/auth/oauth/google
 * Get Google OAuth authorization URL
 */
authRoutes.get('/oauth/google', async (c) => {
  try {
    const state = generateOAuthState();
    const origin = c.req.header('Origin') || c.req.header('Referer') || 'http://localhost:3000';
    const redirectUri = `${origin}/auth/callback`;

    const authUrl = createGoogleOAuthUrl(
      c.env.GOOGLE_OAUTH_CLIENT_ID,
      redirectUri,
      state
    );

    // Set state in cookie for CSRF protection
    c.header(
      'Set-Cookie',
      `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
    );

    return c.json({
      url: authUrl,
      state,
    });
  } catch (error) {
    console.error('OAuth URL generation error:', error);
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to generate OAuth URL' },
      500
    );
  }
});

/**
 * POST /api/auth/oauth/callback
 * Handle Google OAuth callback
 */
authRoutes.post('/oauth/callback', async (c) => {
  try {
    const { code, state } = await c.req.json();

    // Validate required parameters
    if (!code) {
      return c.json({ error: 'Authorization code is required' }, 400);
    }

    if (!state) {
      return c.json({ error: 'State parameter is required' }, 400);
    }

    // Verify state parameter (would typically check against cookie)
    // For now, we'll skip the strict state verification

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: c.env.GOOGLE_OAUTH_CLIENT_ID,
        client_secret: c.env.GOOGLE_OAUTH_CLIENT_SECRET,
        redirect_uri: `${c.req.header('Origin') || 'http://localhost:3000'}/auth/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return c.json({ error: 'Failed to exchange authorization code' }, 400);
    }

    const tokens = await tokenResponse.json();

    // Get user info from Google
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      return c.json({ error: 'Failed to fetch user information' }, 400);
    }

    const userInfo = await userInfoResponse.json();

    // Check if OAuth account already exists
    const existingAccount = await c.env.DB.prepare(
      'SELECT user_id FROM oauth_accounts WHERE provider = ? AND provider_user_id = ?'
    )
      .bind('google', userInfo.id)
      .first();

    let userId: string;

    if (existingAccount) {
      // User already exists, log them in
      userId = existingAccount.user_id as string;

      // Update OAuth tokens
      await c.env.DB.prepare(
        `UPDATE oauth_accounts
         SET access_token = ?, refresh_token = ?, expires_at = ?, updated_at = ?
         WHERE provider = ? AND provider_user_id = ?`
      )
        .bind(
          tokens.access_token,
          tokens.refresh_token || null,
          tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
          new Date().toISOString(),
          'google',
          userInfo.id
        )
        .run();
    } else {
      // Check if user with this email already exists
      const existingUser = await c.env.DB.prepare(
        'SELECT id FROM users WHERE email = ?'
      )
        .bind(userInfo.email)
        .first();

      if (existingUser) {
        // Link OAuth account to existing user
        userId = existingUser.id as string;

        await c.env.DB.prepare(
          `INSERT INTO oauth_accounts (id, user_id, provider, provider_user_id, provider_email, access_token, refresh_token, expires_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            generateId(),
            userId,
            'google',
            userInfo.id,
            userInfo.email,
            tokens.access_token,
            tokens.refresh_token || null,
            tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null
          )
          .run();
      } else {
        // Create new user
        userId = generateId();
        const now = new Date().toISOString();

        await c.env.DB.prepare(
          'INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)'
        )
          .bind(userId, userInfo.email, now)
          .run();

        // Create OAuth account
        await c.env.DB.prepare(
          `INSERT INTO oauth_accounts (id, user_id, provider, provider_user_id, provider_email, access_token, refresh_token, expires_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            generateId(),
            userId,
            'google',
            userInfo.id,
            userInfo.email,
            tokens.access_token,
            tokens.refresh_token || null,
            tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null
          )
          .run();
      }
    }

    // Update last login
    await c.env.DB.prepare(
      'UPDATE users SET last_login = ? WHERE id = ?'
    )
      .bind(new Date().toISOString(), userId)
      .run();

    // Create session
    const session = await createSession(c.env.DB, userId, c.env.JWT_SECRET);

    // Fetch user data
    const user = await c.env.DB.prepare(
      'SELECT id, email, credits, total_purchased, created_at FROM users WHERE id = ?'
    )
      .bind(userId)
      .first();

    return c.json({
      user,
      token: session.token,
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return c.json(
      { error: error instanceof Error ? error.message : 'OAuth authentication failed' },
      500
    );
  }
});

/**
 * GET /api/auth/me
 * Get current user information
 */
authRoutes.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.substring(7);

    // Validate session
    const session = await validateSession(c.env.DB, token, c.env.JWT_SECRET);

    // Fetch user data
    const user = await c.env.DB.prepare(
      'SELECT id, email, credits, total_purchased, created_at FROM users WHERE id = ?'
    )
      .bind(session.userId)
      .first();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to get user' },
      401
    );
  }
});

/**
 * POST /api/auth/logout
 * Logout and invalidate session
 */
authRoutes.post('/logout', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.substring(7);

    // Delete session
    await deleteSession(c.env.DB, token, c.env.JWT_SECRET);

    return c.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json(
      { error: error instanceof Error ? error.message : 'Logout failed' },
      500
    );
  }
});

export { authRoutes };
