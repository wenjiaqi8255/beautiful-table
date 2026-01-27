import { TableData } from './types'

/**
 * Parses Markdown table format with pipes (|) as delimiters
 * Skips the separator row (e.g., | --- | --- |)
 * @param input - Raw Markdown table string
 * @returns Parsed table data with headers and rows
 */
export function parseMarkdown(input: string): TableData {
  // Handle empty input
  if (!input || input.trim() === '') {
    return { headers: [], rows: [] }
  }

  // Split into lines and remove empty lines
  const lines = input.split('\n').filter((line) => line.trim() !== '')

  if (lines.length === 0) {
    return { headers: [], rows: [] }
  }

  // Parse each line
  const parsedLines = lines.map((line) => parseMarkdownLine(line))

  // First line is always headers in markdown tables
  const headers = parsedLines[0] || []

  // Find separator row (starts with | and contains ---)
  let separatorIndex = -1
  for (let i = 1; i < parsedLines.length; i++) {
    const line = parsedLines[i]
    if (line.length === headers.length && line.every((cell) => isSeparatorCell(cell))) {
      separatorIndex = i
      break
    }
  }

  // Get data rows (skip headers and separator)
  let rows: string[][]
  if (separatorIndex >= 0) {
    // Remove separator row
    rows = parsedLines.slice(1).filter((_, i) => i !== separatorIndex - 1)
  } else {
    // No separator row found, treat all rows after header as data
    rows = parsedLines.slice(1)
  }

  // Pad rows to match header count
  const maxCols = headers.length
  rows = rows.map((row) => {
    while (row.length < maxCols) {
      row.push('')
    }
    return row.slice(0, maxCols)
  })

  return { headers, rows }
}

/**
 * Parses a single markdown table line
 */
function parseMarkdownLine(line: string): string[] {
  // Remove leading and trailing pipes if present
  let trimmedLine = line.trim()
  if (trimmedLine.startsWith('|')) {
    trimmedLine = trimmedLine.slice(1)
  }
  if (trimmedLine.endsWith('|')) {
    trimmedLine = trimmedLine.slice(0, -1)
  }

  // Split by pipe and trim each cell
  const cells = trimmedLine.split('|').map((cell) => cell.trim())

  return cells
}

/**
 * Checks if a cell is a separator cell (contains dashes/colons for alignment)
 */
function isSeparatorCell(cell: string): boolean {
  const trimmed = cell.trim()
  // Check if it contains only dashes, colons, and spaces (for alignment)
  return /^:?-+:?$|^ *:?:-+:?:? *$/.test(trimmed)
}
