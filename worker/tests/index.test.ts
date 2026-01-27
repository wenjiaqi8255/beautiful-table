import { describe, it, expect } from 'vitest'
import worker from '../src/index'

describe('Worker', () => {
  it('should export a default export (the Hono app)', () => {
    expect(worker).toBeDefined()
    expect(typeof worker).toBe('object')
  })

  it('should have a fetch method', () => {
    expect(worker.fetch).toBeDefined()
    expect(typeof worker.fetch).toBe('function')
  })
})
