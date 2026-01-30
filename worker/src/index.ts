import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { parseRoute } from './routes/parse'
import { userRoutes } from './routes/users'
import { paymentRoutes } from './routes/payment'
import { usage } from './routes/usage'
import { createAuth } from './lib/better-auth'

type Bindings = {
  DATABASE_URL: string
  BETTER_AUTH_SECRET: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET?: string
  APP_URL: string
  ENVIRONMENT?: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for all routes - must specify origin for credentials
app.use('*', cors({
  origin: (origin) => {
    // Allow requests from Cloudflare Pages deployments
    if (origin && origin.endsWith('.beautiful-table.pages.dev')) {
      return origin;
    }
    // Allow requests from worker itself
    if (origin && origin.includes('beautiful-table-worker.aries10011.workers.dev')) {
      return origin;
    }
    // Allow localhost for development
    if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return origin;
    }
    return origin; // Allow any origin in development
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Root route
app.get('/', (c) => {
  return c.json({
    message: 'Beautiful Table API',
    version: '0.0.1',
  })
})

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  })
})

// Mount parse route
app.route('/', parseRoute)

// Mount user routes
app.route('/', userRoutes)

// Mount payment routes
app.route('/', paymentRoutes)

// Mount usage routes
app.route('/', usage)

// Mount Better Auth handler - handles all /api/auth/* routes
// Based on official Better Auth Hono integration docs
app.on(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], '/api/auth/*', (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

// Export the fetch handler for Cloudflare Workers
export default app
