import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { parseRoute } from './routes/parse'
import { userRoutes } from './routes/users'
import { paymentRoutes } from './routes/payment'

type Bindings = {
  DB: D1Database
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

// Export the fetch handler for Cloudflare Workers
export default app
