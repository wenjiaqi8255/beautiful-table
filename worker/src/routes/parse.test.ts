import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { parseRoute } from './parse'
import { parseTable } from '../lib/parsers'

// Mock the parser
vi.mock('../lib/parsers', () => ({
  parseTable: vi.fn(),
}))

describe('POST /api/parse', () => {
  let app: Hono
  let mockParseTable: ReturnType<typeof vi.fn>

  beforeEach(() => {
    app = new Hono()
    app.route('/', parseRoute)
    mockParseTable = vi.mocked(parseTable)
    vi.clearAllMocks()
  })

  describe('successful parsing', () => {
    it('should return 200 with parsed table data', async () => {
      const mockData = {
        headers: ['Name', 'Age'],
        rows: [['Alice', '30'], ['Bob', '25']]
      }
      mockParseTable.mockReturnValue(mockData)

      const requestBody = {
        data: 'Name\tAge\nAlice\t30\nBob\t25'
      }

      const response = await app.request('/api/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json).toEqual({
        success: true,
        data: mockData
      })
      expect(mockParseTable).toHaveBeenCalledWith(requestBody.data)
    })

    it('should handle CSV data', async () => {
      const mockData = {
        headers: ['Name', 'Age'],
        rows: [['Alice', '30']]
      }
      mockParseTable.mockReturnValue(mockData)

      const requestBody = {
        data: 'Name,Age\nAlice,30'
      }

      const response = await app.request('/api/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.success).toBe(true)
      expect(json.data).toEqual(mockData)
    })

    it('should handle markdown tables', async () => {
      const mockData = {
        headers: ['Name', 'Age'],
        rows: [['Alice', '30']]
      }
      mockParseTable.mockReturnValue(mockData)

      const requestBody = {
        data: '| Name | Age |\n| --- | --- |\n| Alice | 30 |'
      }

      const response = await app.request('/api/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.success).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should return 400 for missing data field', async () => {
      const requestBody = {}

      const response = await app.request('/api/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.success).toBe(false)
      expect(json.error).toBeDefined()
    })

    it('should return 400 for empty data string', async () => {
      const requestBody = {
        data: ''
      }

      const response = await app.request('/api/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.success).toBe(false)
      expect(json.error).toBeDefined()
    })

    it('should return 400 for whitespace-only data', async () => {
      const requestBody = {
        data: '   \n  \n  '
      }

      const response = await app.request('/api/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.success).toBe(false)
      expect(json.error).toBeDefined()
    })

    it('should return 400 for invalid JSON', async () => {
      const response = await app.request('/api/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      })

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.success).toBe(false)
      expect(json.error).toBeDefined()
    })

    it('should return 400 for non-string data field', async () => {
      const requestBody = {
        data: 12345
      }

      const response = await app.request('/api/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.success).toBe(false)
      expect(json.error).toBeDefined()
    })
  })

  describe('request validation', () => {
    it('should require POST method', async () => {
      const response = await app.request('/api/parse', {
        method: 'GET',
      })

      // Hono returns 404 for undefined routes, not 405
      expect(response.status).toBe(404)
    })

    it('should require Content-Type: application/json', async () => {
      const response = await app.request('/api/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: 'data',
      })

      // Accept the request but might fail parsing
      expect(response.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('integration', () => {
    it('should parse TSV data end-to-end', async () => {
      // Use actual parser in integration test
      vi.doUnmock('../lib/parsers')
      const { parseTable: realParseTable } = await import('../lib/parsers')

      const requestBody = {
        data: 'Name\tAge\nAlice\t30\nBob\t25'
      }

      const response = await app.request('/api/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.success).toBe(true)
      expect(json.data.headers).toEqual(['Name', 'Age'])
      // First line is treated as headers, so we have 1 data row
      expect(json.data.rows.length).toBeGreaterThanOrEqual(1)

      // Re-mock for subsequent tests
      vi.doMock('../lib/parsers', () => ({
        parseTable: vi.fn(),
      }))
    })
  })
})
