import { Context, Next } from 'hono';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  GOOGLE_OAUTH_CLIENT_ID?: string;
  GOOGLE_OAUTH_CLIENT_SECRET?: string;
}

interface JWTPayload {
  userId: string;
  email?: string;
  iat?: number;
  exp?: number;
  [key: string]: any;
}

interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
}

/**
 * Generate a unique ID using random bytes
 */
export function generateId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a password with a random salt using SHA-256
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = generateId();
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashBase64 = btoa(String.fromCharCode(...hashArray));

  return `${salt}.${hashBase64}`;
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  try {
    const parts = passwordHash.split('.');
    if (parts.length !== 2) {
      return false;
    }

    const [salt, storedHash] = parts;
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const computedHash = btoa(String.fromCharCode(...hashArray));

    return computedHash === storedHash;
  } catch (error) {
    return false;
  }
}

/**
 * Create a JWT token
 */
export async function signJWT(
  payload: JWTPayload,
  secret: string,
  expiresIn: number = 7 * 24 * 60 * 60 // 7 days default
): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn,
  };

  const encoder = new TextEncoder();
  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(tokenPayload));
  const data = `${headerEncoded}.${payloadEncoded}`;

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  );

  const signatureEncoded = base64UrlEncode(
    String.fromCharCode(...Array.from(new Uint8Array(signature)))
  );

  return `${data}.${signatureEncoded}`;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyJWT(
  token: string,
  secret: string
): Promise<JWTPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const [headerEncoded, payloadEncoded, signatureEncoded] = parts;
  const data = `${headerEncoded}.${payloadEncoded}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signature = base64UrlDecode(signatureEncoded);
  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    signature,
    encoder.encode(data)
  );

  if (!isValid) {
    throw new Error('Invalid token signature');
  }

  const payload: JWTPayload = JSON.parse(base64UrlDecode(payloadEncoded));

  // Check expiration
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }

  return payload;
}

/**
 * Create a session and return the JWT token
 */
export async function createSession(
  db: D1Database,
  userId: string,
  secret: string,
  expiresIn: number = 7 * 24 * 60 * 60 // 7 days
): Promise<Session> {
  const sessionId = generateId();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresIn * 1000);

  const payload = {
    userId,
    sessionId,
  };

  const token = await signJWT(payload, secret, expiresIn);

  // Hash the token for storage
  const tokenHash = await hashToken(token);

  // Store session in database
  await db
    .prepare(
      'INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)'
    )
    .bind(sessionId, userId, tokenHash, expiresAt.toISOString())
    .run();

  return {
    id: sessionId,
    userId,
    token,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Delete a session by token
 */
export async function deleteSession(
  db: D1Database,
  token: string,
  secret: string
): Promise<void> {
  const tokenHash = await hashToken(token);

  await db
    .prepare('DELETE FROM sessions WHERE token_hash = ?')
    .bind(tokenHash)
    .run();
}

/**
 * Validate a session and return user info
 */
export async function validateSession(
  db: D1Database,
  token: string,
  secret: string
): Promise<{ userId: string; sessionId: string }> {
  // Verify JWT
  const payload = await verifyJWT(token, secret);

  if (!payload.sessionId) {
    throw new Error('Invalid session token');
  }

  // Check if session exists in database
  const tokenHash = await hashToken(token);
  const session = await db
    .prepare('SELECT user_id, expires_at FROM sessions WHERE id = ? AND token_hash = ?')
    .bind(payload.sessionId, tokenHash)
    .first();

  if (!session) {
    throw new Error('Session not found');
  }

  // Check if session is expired
  const expiresAt = new Date(session.expires_at as string);
  if (expiresAt < new Date()) {
    throw new Error('Session expired');
  }

  return {
    userId: session.user_id as string,
    sessionId: payload.sessionId,
  };
}

/**
 * Hash a token for storage (SHA-256)
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Base64URL encode a string
 */
function base64UrlEncode(str: string): string {
  const base64 = btoa(str);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64URL decode a string
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

/**
 * Middleware to verify authentication
 */
export async function verifyAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  if (!authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Invalid authorization format' }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const session = await validateSession(c.env.DB, token, c.env.JWT_SECRET);
    c.set('userId', session.userId);
    c.set('sessionId', session.sessionId);
    await next();
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Invalid token' },
      401
    );
  }
}

/**
 * Generate OAuth state parameter for CSRF protection
 */
export function generateOAuthState(): string {
  return generateId();
}

/**
 * Create OAuth authorization URL
 */
export function createGoogleOAuthUrl(
  clientId: string,
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    state,
    access_type: 'offline',
    prompt: 'consent',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
