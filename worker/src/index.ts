import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { parseRoute } from './routes/parse'
import { userRoutes } from './routes/users'
import { paymentRoutes } from './routes/payment'
import { usage } from './routes/usage'
import { authRoutes } from './routes/auth'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
  GOOGLE_OAUTH_CLIENT_ID: string
  GOOGLE_OAUTH_CLIENT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for all routes
app.use('*', cors())

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

// Mount auth routes
app.route('/api/auth', authRoutes)

// Export the fetch handler for Cloudflare Workers
export default app
