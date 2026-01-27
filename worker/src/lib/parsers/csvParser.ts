import { TableData } from './types'

/**
 * Parses CSV (Comma-Separated Values) formatted text with support for quoted fields
 * @param input - Raw CSV string
 * @returns Parsed table data with headers and rows
 */
export function parseCSV(input: string): TableData {
  // Handle empty input
  if (!input || input.trim() === '') {
    return { headers: [], rows: [] }
  }

  // Parse CSV lines handling quoted fields
  const lines = parseCSVLines(input)

  if (lines.length === 0) {
    return { headers: [], rows: [] }
  }

  // Determine if first line is headers
  const hasHeaders = lines.length > 1

  let headers: string[] = []
  let rows: string[][] = []

  if (hasHeaders) {
    headers = lines[0] || []
    rows = lines.slice(1)
  } else {
    headers = []
    rows = lines
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
 * Parse CSV text into lines of fields, handling quoted fields with commas and newlines
 */
function parseCSVLines(input: string): string[][] {
  const lines: string[][] = []
  const currentLine: string[] = []
  let currentField = ''
  let inQuotes = false
  let i = 0

  while (i < input.length) {
    const char = input[i]
    const nextChar = input[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote ("")
        currentField += '"'
        i += 2
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes
        i++
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      currentLine.push(currentField)
      currentField = ''
      i++
    } else if ((char === '\r' && nextChar === '\n') || (char === '\n' && !inQuotes)) {
      // Line ending
      currentLine.push(currentField)
      if (currentLine.length > 0 || currentField !== '') {
        lines.push([...currentLine])
      }
      currentLine.length = 0
      currentField = ''
      i += char === '\r' ? 2 : 1
    } else if (char === '\r' && !inQuotes) {
      // Line ending (old Mac)
      currentLine.push(currentField)
      if (currentLine.length > 0 || currentField !== '') {
        lines.push([...currentLine])
      }
      currentLine.length = 0
      currentField = ''
      i++
    } else {
      // Regular character
      currentField += char
      i++
    }
  }

  // Don't forget the last field/line
  if (currentField || inQuotes) {
    currentLine.push(currentField)
  }
  if (currentLine.length > 0) {
    lines.push(currentLine)
  }

  return lines
}
