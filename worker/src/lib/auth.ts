import { Context, Next } from 'hono';

interface Env {
  DB: D1Database;
  SUPABASE_JWT_SECRET: string;
}

export async function verifyAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  if (!authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Invalid authorization format' }, 401);
  }

  const token = authHeader.substring(7);

  // TODO: Implement actual JWT verification with Supabase JWT secret
  // For now, we'll do basic validation and extract user ID
  if (!token || token.length < 10) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  try {
    // Extract user ID from token (simplified - in production, verify JWT signature)
    const userId = token.split('-').pop() || token;

    c.set('userId', userId);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
}
