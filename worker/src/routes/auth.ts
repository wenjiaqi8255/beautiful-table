import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createAuth } from '../lib/better-auth';

const authRoutes = new Hono<{ Bindings: Env }>();

// Enable CORS for all routes
authRoutes.use('/*', cors());

/**
 * Better Auth handler
 * This handles all authentication endpoints automatically
 */
authRoutes.all('/*', async (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

export { authRoutes };
