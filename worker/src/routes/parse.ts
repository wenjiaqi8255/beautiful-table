import { Hono } from 'hono'
import { parseTable } from '../lib/parsers'
import type { TableData } from '../lib/parsers/types'

export const parseRoute = new Hono()

/**
 * POST /api/parse
 * Parses table data and returns structured TableData
 *
 * Request body:
 * {
 *   "data": "raw table data string"
 * }
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "headers": ["Header1", "Header2"],
 *     "rows": [["row1col1", "row1col2"], ["row2col1", "row2col2"]]
 *   }
 * }
 *
 * Response (400):
 * {
 *   "success": false,
 *   "error": "error message"
 * }
 */
parseRoute.post('/api/parse', async (c) => {
  try {
    const body = await c.req.json<{ data?: string }>()

    // Validate request body
    if (!body.data) {
      return c.json(
        {
          success: false,
          error: 'Missing required field: data'
        },
        400
      )
    }

    // Validate data type
    if (typeof body.data !== 'string') {
      return c.json(
        {
          success: false,
          error: 'Field "data" must be a string'
        },
        400
      )
    }

    // Validate data is not empty
    const trimmedData = body.data.trim()
    if (trimmedData === '') {
      return c.json(
        {
          success: false,
          error: 'Field "data" cannot be empty or contain only whitespace'
        },
        400
      )
    }

    // Parse the table data
    const result: TableData = parseTable(body.data)

    // Return success response
    return c.json({
      success: true,
      data: result
    })
  } catch (error) {
    // Handle JSON parsing errors and other exceptions
    if (error instanceof SyntaxError) {
      return c.json(
        {
          success: false,
          error: 'Invalid JSON in request body'
        },
        400
      )
    }

    // Handle unexpected errors
    console.error('Error parsing table data:', error)
    return c.json(
      {
        success: false,
        error: 'Internal server error while parsing table data'
      },
      500
    )
  }
})
