import { Hono } from 'hono'
import { cors } from 'hono/cors'

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

// Export the fetch handler for Cloudflare Workers
export default app
