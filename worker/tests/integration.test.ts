import { describe, it, expect } from 'vitest'
import worker from '../src/index'

describe('Worker Integration Tests', () => {
  it('should respond to GET / with API info', async () => {
    const res = await worker.fetch(new Request('http://localhost/'))
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json).toMatchObject({
      message: 'Beautiful Table API',
      version: '0.0.1',
    })
  })

  it('should respond to GET /api/health with 200', async () => {
    const res = await worker.fetch(new Request('http://localhost/api/health'))
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json).toMatchObject({
      status: 'healthy',
    })
    expect(json.timestamp).toBeDefined()
  })

  it('should handle CORS preflight requests', async () => {
    const res = await worker.fetch(
      new Request('http://localhost/api/health', {
        method: 'OPTIONS',
        headers: {
          'Access-Control-Request-Method': 'GET',
          Origin: 'http://example.com',
        },
      })
    )

    // CORS should be handled
    expect(res.headers.get('access-control-allow-origin')).toBe('*')
  })
})
