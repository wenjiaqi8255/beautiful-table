import { TableData } from './types'

/**
 * Parses TSV (Tab-Separated Values) formatted text
 * @param input - Raw TSV string
 * @returns Parsed table data with headers and rows
 */
export function parseTSV(input: string): TableData {
  // Handle empty input
  if (!input || input.trim() === '') {
    return { headers: [], rows: [] }
  }

  // Split into lines, preserving empty lines but trimming overall input
  const lines = input.split('\n').filter((line, index, arr) => {
    // Keep all lines that have content or are between content lines
    // Remove trailing empty lines
    if (index === arr.length - 1 && line.trim() === '') return false
    return true
  })

  if (lines.length === 0) {
    return { headers: [], rows: [] }
  }

  // Parse all lines
  const parsedLines = lines.map((line) => line.split('\t'))

  // Determine if first line is headers (if there are multiple lines)
  // If only one line, treat it as a row without headers
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

  // For rows with more columns than headers, don't expand headers
  // Only trim rows that are too long
  const maxCols = hasHeaders ? headers.length : Math.max(...rows.map((row) => row.length))

  // Trim rows to match column count (don't pad headers)
  rows = rows.map((row) => {
    // Pad with empty strings if row is too short
    while (row.length < maxCols) {
      row.push('')
    }
    // Trim if row is too long (ignore extra columns)
    return row.slice(0, maxCols)
  })

  return { headers, rows }
}
