import { TableData, TableFormat, ParserFunction } from './types'
import { parseTSV } from './tsvParser'
import { parseCSV } from './csvParser'
import { parseSpace } from './spaceParser'
import { parseMarkdown } from './markdownParser'

/**
 * Detects the format of table data from the input string
 * @param input - Raw table data string
 * @returns Detected format
 */
export function detectFormat(input: string): TableFormat {
  if (!input || input.trim() === '') {
    return TableFormat.TSV // Default
  }

  const lines = input.split('\n').filter((line) => line.trim() !== '')

  if (lines.length === 0) {
    return TableFormat.TSV
  }

  // Check for markdown format first (pipes with separators)
  if (isMarkdownTable(input)) {
    return TableFormat.MARKDOWN
  }

  // Analyze the first few lines to determine format
  const sampleLines = lines.slice(0, Math.min(5, lines.length))

  let tabCount = 0
  let commaCount = 0
  let quoteCount = 0
  let multiSpaceCount = 0
  let totalLines = sampleLines.length

  for (const line of sampleLines) {
    // Count tabs
    tabCount += (line.match(/\t/g) || []).length

    // Count commas
    commaCount += (line.match(/,/g) || []).length

    // Count quotes (for CSV with quoted fields)
    quoteCount += (line.match(/"/g) || []).length

    // Count multiple consecutive spaces (2+)
    const multiSpaces = line.match(/ {2,}/g)
    if (multiSpaces) {
      multiSpaceCount += multiSpaces.length
    }
  }

  // Decision logic
  const avgTabs = tabCount / totalLines
  const avgCommas = commaCount / totalLines
  const avgMultiSpaces = multiSpaceCount / totalLines
  const hasQuotedFields = quoteCount > 0 && quoteCount % 2 === 0

  // Priority 1: CSV with quoted fields (most distinctive)
  if (hasQuotedFields && avgCommas > 0) {
    return TableFormat.CSV
  }

  // Priority 2: Multiple spaces (very distinctive)
  if (avgMultiSpaces >= avgTabs && avgMultiSpaces >= avgCommas && avgMultiSpaces > 0) {
    return TableFormat.SPACE
  }

  // Priority 3: Tabs vs Commas
  if (avgTabs >= avgCommas && avgTabs > 0) {
    return TableFormat.TSV
  }

  if (avgCommas > 0) {
    return TableFormat.CSV
  }

  // Priority 4: Check for spaces in first line
  if (lines[0] && / {2,}/.test(lines[0])) {
    return TableFormat.SPACE
  }

  // Default to TSV
  return TableFormat.TSV
}

/**
 * Parses table data by auto-detecting the format
 * @param input - Raw table data string
 * @returns Parsed table data
 */
export function parseTable(input: string): TableData {
  const format = detectFormat(input)

  switch (format) {
    case TableFormat.TSV:
      return parseTSV(input)
    case TableFormat.CSV:
      return parseCSV(input)
    case TableFormat.SPACE:
      return parseSpace(input)
    case TableFormat.MARKDOWN:
      return parseMarkdown(input)
    default:
      return parseTSV(input)
  }
}

// Export all parsers
export { parseTSV } from './tsvParser'
export { parseCSV } from './csvParser'
export { parseSpace } from './spaceParser'
export { parseMarkdown } from './markdownParser'
export { TableData, TableFormat, ParserFunction } from './types'

/**
 * Checks if the input appears to be a markdown table
 */
function isMarkdownTable(input: string): boolean {
  const lines = input.split('\n').filter((line) => line.trim() !== '')

  if (lines.length < 2) {
    return false
  }

  // Check for pipes in first line
  const firstLineHasPipes = lines[0].includes('|')

  // Check for separator line (dashes between pipes)
  let hasSeparator = false
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (/^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?$/.test(line)) {
      hasSeparator = true
      break
    }
  }

  return firstLineHasPipes && hasSeparator
}
