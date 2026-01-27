/**
 * Represents parsed table data
 */
export interface TableData {
  headers: string[]
  rows: string[][]
}

/**
 * Parser function that takes raw text input and returns structured table data
 */
export type ParserFunction = (input: string) => TableData

/**
 * Supported table formats
 */
export enum TableFormat {
  TSV = 'tsv',
  CSV = 'csv',
  SPACE = 'space',
  MARKDOWN = 'markdown',
}
