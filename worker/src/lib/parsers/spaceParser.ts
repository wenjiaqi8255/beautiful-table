import { TableData } from './types'

/**
 * Parses space-delimited table text (2+ consecutive spaces as delimiter)
 * Preserves single spaces within cell values
 * @param input - Raw space-delimited string
 * @returns Parsed table data with headers and rows
 */
export function parseSpace(input: string): TableData {
  // Handle empty input
  if (!input || input.trim() === '') {
    return { headers: [], rows: [] }
  }

  // Split into lines and parse each line
  const lines = input.split('\n').filter((line, index, arr) => {
    // Remove trailing empty lines
    if (index === arr.length - 1 && line.trim() === '') return false
    return true
  })

  if (lines.length === 0) {
    return { headers: [], rows: [] }
  }

  const parsedLines = lines.map((line) => splitLineByMultipleSpaces(line))

  // Determine if first line is headers
  const hasHeaders = parsedLines.length > 1

  let headers: string[] = []
  let rows: string[][] = []

  if (hasHeaders) {
    headers = parsedLines[0] || []
    rows = parsedLines.slice(1)
  } else {
    headers = []
    rows = parsedLines
  }

  // Trim rows to match header count
  const maxCols = hasHeaders ? headers.length : Math.max(...rows.map((row) => row.length))

  rows = rows.map((row) => {
    while (row.length < maxCols) {
      row.push('')
    }
    return row.slice(0, maxCols)
  })

  return { headers, rows }
}

/**
 * Splits a line by 2 or more consecutive spaces
 * Preserves single spaces within field values
 */
function splitLineByMultipleSpaces(line: string): string[] {
  // Use regex to split by 2+ spaces, but preserve the delimiters to trim trailing spaces
  const parts = line.split(/( {2,})/)
  const fields: string[] = []
  let currentField = ''

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]

    // Check if this part is a delimiter (2+ spaces)
    if (part && /^ {2,}$/.test(part)) {
      // This is a delimiter
      // Trim trailing spaces from current field
      fields.push(currentField.trimRight())
      currentField = ''
    } else {
      // This is content (may have single spaces)
      currentField += part
    }
  }

  // Add the last field, trimming trailing spaces
  const lastField = currentField.trimRight()
  if (lastField !== '' || fields.length > 0) {
    fields.push(lastField)
  }

  // Filter out empty fields at the very end (from trailing delimiters)
  while (fields.length > 0 && fields[fields.length - 1] === '') {
    fields.pop()
  }

  return fields
}
