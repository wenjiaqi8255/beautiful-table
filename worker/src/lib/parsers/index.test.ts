import { describe, it, expect } from 'vitest'
import { parseTable, detectFormat } from './index'
import { TableFormat } from './types'

describe('Smart Auto-Detection Parser', () => {
  describe('format detection', () => {
    it('should detect TSV format', () => {
      const input = 'Name\tAge\nAlice\t30\nBob\t25'
      const format = detectFormat(input)
      expect(format).toBe(TableFormat.TSV)
    })

    it('should detect CSV format', () => {
      const input = 'Name,Age\nAlice,30\nBob,25'
      const format = detectFormat(input)
      expect(format).toBe(TableFormat.CSV)
    })

    it('should detect CSV with quoted fields', () => {
      const input = 'Name,Description\nAlice,"Project, Manager"\nBob,"Developer"'
      const format = detectFormat(input)
      expect(format).toBe(TableFormat.CSV)
    })

    it('should detect Space-delimited format (2+ spaces)', () => {
      const input = 'Name  Age\nAlice  30\nBob  25'
      const format = detectFormat(input)
      expect(format).toBe(TableFormat.SPACE)
    })

    it('should detect Markdown format', () => {
      const input = '| Name | Age |\n| --- | --- |\n| Alice | 30 |'
      const format = detectFormat(input)
      expect(format).toBe(TableFormat.MARKDOWN)
    })

    it('should default to TSV for empty input', () => {
      const format = detectFormat('')
      expect(format).toBe(TableFormat.TSV)
    })

    it('should default to TSV for ambiguous input', () => {
      const input = 'single line'
      const format = detectFormat(input)
      expect(format).toBe(TableFormat.TSV)
    })
  })

  describe('auto-parse with detected format', () => {
    it('should auto-parse TSV data', () => {
      const input = 'Name\tAge\nAlice\t30\nBob\t25'
      const result = parseTable(input)
      expect(result).toEqual({
        headers: ['Name', 'Age'],
        rows: [
          ['Alice', '30'],
          ['Bob', '25']
        ]
      })
    })

    it('should auto-parse CSV data', () => {
      const input = 'Name,Age\nAlice,30\nBob,25'
      const result = parseTable(input)
      expect(result).toEqual({
        headers: ['Name', 'Age'],
        rows: [
          ['Alice', '30'],
          ['Bob', '25']
        ]
      })
    })

    it('should auto-parse CSV with quotes', () => {
      const input = 'Name,Note\nAlice,"Value, with commas"\nBob,Simple'
      const result = parseTable(input)
      expect(result).toEqual({
        headers: ['Name', 'Note'],
        rows: [
          ['Alice', 'Value, with commas'],
          ['Bob', 'Simple']
        ]
      })
    })

    it('should auto-parse space-delimited data', () => {
      const input = 'Name  Age  City\nAlice  30  NYC\nBob  25  London'
      const result = parseTable(input)
      expect(result).toEqual({
        headers: ['Name', 'Age', 'City'],
        rows: [
          ['Alice', '30', 'NYC'],
          ['Bob', '25', 'London']
        ]
      })
    })

    it('should auto-parse markdown table', () => {
      const input = '| Name | Age |\n| --- | --- |\n| Alice | 30 |\n| Bob | 25 |'
      const result = parseTable(input)
      expect(result).toEqual({
        headers: ['Name', 'Age'],
        rows: [
          ['Alice', '30'],
          ['Bob', '25']
        ]
      })
    })
  })

  describe('detection edge cases', () => {
    it('should prefer CSV over TSV when both commas and tabs present', () => {
      const input = 'Name,Age,City\tExtra\nAlice,30,NYC\tData'
      const format = detectFormat(input)
      expect(format).toBe(TableFormat.CSV)
    })

    it('should prefer Space over CSV when multiple spaces dominate', () => {
      const input = 'Name    Age\nAlice    30\nBob      25'
      const format = detectFormat(input)
      expect(format).toBe(TableFormat.SPACE)
    })

    it('should detect markdown by pipe presence', () => {
      const input = '| Name | Age |\n| --- | --- |'
      const format = detectFormat(input)
      expect(format).toBe(TableFormat.MARKDOWN)
    })

    it('should handle single row with tabs as TSV', () => {
      const input = 'Alice\t30\tNYC'
      const format = detectFormat(input)
      expect(format).toBe(TableFormat.TSV)
    })

    it('should handle single row with commas as CSV', () => {
      const input = 'Alice,30,NYC'
      const format = detectFormat(input)
      expect(format).toBe(TableFormat.CSV)
    })

    it('should handle single row with spaces as Space', () => {
      const input = 'Alice  30  NYC'
      const format = detectFormat(input)
      expect(format).toBe(TableFormat.SPACE)
    })
  })

  describe('accuracy tests', () => {
    it('should correctly identify 95%+ of formats', () => {
      const testCases = [
        { input: 'Name\tAge\nAlice\t30', expected: TableFormat.TSV },
        { input: 'Name,Age\nAlice,30', expected: TableFormat.CSV },
        { input: 'Name  Age\nAlice  30', expected: TableFormat.SPACE },
        { input: '| Name | Age |\n| --- | --- |', expected: TableFormat.MARKDOWN },
        { input: 'A\tB\tC\n1\t2\t3', expected: TableFormat.TSV },
        { input: 'A,B,C\n1,2,3', expected: TableFormat.CSV },
        { input: 'A  B  C\n1  2  3', expected: TableFormat.SPACE },
        { input: 'One  Two\nA  B', expected: TableFormat.SPACE },
        { input: '"A","B"\n"1","2"', expected: TableFormat.CSV },
        { input: '| A | B |\n| - | - |', expected: TableFormat.MARKDOWN },
        { input: 'Name\tAge\tCity\nAlice\t30\tNYC\nBob\t25\tLondon', expected: TableFormat.TSV },
        { input: 'Name,Note\nAlice,"quoted, value"', expected: TableFormat.CSV },
      ]

      let correct = 0
      testCases.forEach(({ input, expected }) => {
        const detected = detectFormat(input)
        if (detected === expected) correct++
      })

      const accuracy = (correct / testCases.length) * 100
      expect(accuracy).toBeGreaterThanOrEqual(95)
    })
  })

  describe('error handling', () => {
    it('should handle empty input gracefully', () => {
      const result = parseTable('')
      expect(result).toEqual({
        headers: [],
        rows: []
      })
    })

    it('should handle whitespace-only input', () => {
      const result = parseTable('   \n  \n  ')
      expect(result).toEqual({
        headers: [],
        rows: []
      })
    })

    it('should handle single value', () => {
      const result = parseTable('Alice')
      expect(result.headers.length).toBeGreaterThanOrEqual(0)
      expect(result.rows.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('real-world examples', () => {
    it('should parse Excel-exported TSV', () => {
      const input = 'Name\tAge\tCity\nAlice\t30\tNew York\nBob\t25\tLos Angeles'
      const result = parseTable(input)
      expect(result.headers).toEqual(['Name', 'Age', 'City'])
      expect(result.rows.length).toBe(2)
    })

    it('should parse CSV from data export', () => {
      const input = 'id,name,value\n1,item1,100\n2,item2,200\n3,item3,300'
      const result = parseTable(input)
      expect(result.headers).toEqual(['id', 'name', 'value'])
      expect(result.rows.length).toBe(3)
    })

    it('should parse console output spaces', () => {
      const input = 'NAME    PID    CPU\nchrome  1234   5.2\nnode    5678   2.1'
      const result = parseTable(input)
      expect(result.headers).toEqual(['NAME', 'PID', 'CPU'])
      expect(result.rows.length).toBe(2)
    })

    it('should parse GitHub readme markdown table', () => {
      const input = '| Feature | Status |\n| --- | --- |\n| TSV | ✅ |\n| CSV | ✅ |'
      const result = parseTable(input)
      expect(result.headers).toEqual(['Feature', 'Status'])
      expect(result.rows.length).toBe(2)
    })
  })
})
