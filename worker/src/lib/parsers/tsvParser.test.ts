import { describe, it, expect } from 'vitest'
import { parseTSV } from './tsvParser'

describe('TSV Parser', () => {
  describe('basic parsing', () => {
    it('should parse simple TSV with two columns', () => {
      const input = 'Name\tAge\nAlice\t30\nBob\t25'
      const result = parseTSV(input)
      expect(result).toEqual({
        headers: ['Name', 'Age'],
        rows: [
          ['Alice', '30'],
          ['Bob', '25']
        ]
      })
    })

    it('should parse TSV with multiple columns', () => {
      const input = 'Name\tAge\tCity\tCountry\nAlice\t30\tNYC\tUSA\nBob\t25\tLondon\tUK'
      const result = parseTSV(input)
      expect(result).toEqual({
        headers: ['Name', 'Age', 'City', 'Country'],
        rows: [
          ['Alice', '30', 'NYC', 'USA'],
          ['Bob', '25', 'London', 'UK']
        ]
      })
    })

    it('should parse TSV without headers', () => {
      const input = 'Alice\t30\nBob\t25'
      const result = parseTSV(input)
      expect(result).toEqual({
        headers: ['Alice', '30'],
        rows: [
          ['Bob', '25']
        ]
      })
    })
  })

  describe('empty values and inconsistent columns', () => {
    it('should handle empty cells', () => {
      const input = 'Name\tAge\nAlice\t\n\t30\nBob\t25'
      const result = parseTSV(input)
      expect(result).toEqual({
        headers: ['Name', 'Age'],
        rows: [
          ['Alice', ''],
          ['', '30'],
          ['Bob', '25']
        ]
      })
    })

    it('should handle inconsistent column counts', () => {
      const input = 'Name\tAge\tCity\nAlice\t30\nBob\t25\tLondon'
      const result = parseTSV(input)
      expect(result).toEqual({
        headers: ['Name', 'Age', 'City'],
        rows: [
          ['Alice', '30', ''],
          ['Bob', '25', 'London']
        ]
      })
    })

    it('should handle rows with more columns than headers', () => {
      const input = 'Name\tAge\nAlice\t30\tNYC\nBob\t25'
      const result = parseTSV(input)
      expect(result).toEqual({
        headers: ['Name', 'Age'],
        rows: [
          ['Alice', '30'],
          ['Bob', '25']
        ]
      })
    })
  })

  describe('whitespace handling', () => {
    it('should preserve spaces within cells', () => {
      const input = 'Name\tDescription\nAlice\tProject Manager\nBob\t  Developer  '
      const result = parseTSV(input)
      expect(result).toEqual({
        headers: ['Name', 'Description'],
        rows: [
          ['Alice', 'Project Manager'],
          ['Bob', '  Developer  ']
        ]
      })
    })

    it('should trim trailing tabs', () => {
      const input = 'Name\tAge\t\nAlice\t30\t\nBob\t25\t'
      const result = parseTSV(input)
      expect(result).toEqual({
        headers: ['Name', 'Age', ''],
        rows: [
          ['Alice', '30', ''],
          ['Bob', '25', '']
        ]
      })
    })
  })

  describe('edge cases', () => {
    it('should handle empty input', () => {
      const result = parseTSV('')
      expect(result).toEqual({
        headers: [],
        rows: []
      })
    })

    it('should handle only headers', () => {
      const input = 'Name\tAge\tCity'
      const result = parseTSV(input)
      expect(result).toEqual({
        headers: [],
        rows: [['Name', 'Age', 'City']]
      })
    })

    it('should handle single row without headers', () => {
      const input = 'Alice\t30'
      const result = parseTSV(input)
      expect(result).toEqual({
        headers: [],
        rows: [
          ['Alice', '30']
        ]
      })
    })

    it('should handle tabs at start of line', () => {
      const input = 'Name\tAge\n\t30\nAlice\t30'
      const result = parseTSV(input)
      expect(result).toEqual({
        headers: ['Name', 'Age'],
        rows: [
          ['', '30'],
          ['Alice', '30']
        ]
      })
    })

    it('should handle multiple consecutive tabs', () => {
      const input = 'Name\t\tAge\nAlice\t\t30'
      const result = parseTSV(input)
      expect(result).toEqual({
        headers: ['Name', '', 'Age'],
        rows: [
          ['Alice', '', '30']
        ]
      })
    })
  })

  describe('special characters', () => {
    it('should handle special characters in cells', () => {
      const input = 'Name\tEmail\nAlice\talice@example.com\nBob\tbob@test.co'
      const result = parseTSV(input)
      expect(result).toEqual({
        headers: ['Name', 'Email'],
        rows: [
          ['Alice', 'alice@example.com'],
          ['Bob', 'bob@test.co']
        ]
      })
    })

    it('should handle unicode characters', () => {
      const input = 'Name\tCity\nAlice\t北京市\nBob\tSão Paulo'
      const result = parseTSV(input)
      expect(result).toEqual({
        headers: ['Name', 'City'],
        rows: [
          ['Alice', '北京市'],
          ['Bob', 'São Paulo']
        ]
      })
    })

    it('should handle newlines within quoted values (treat as literal)', () => {
      const input = 'Name\tDescription\nAlice\tLine1\nLine2'
      const result = parseTSV(input)
      expect(result).toEqual({
        headers: ['Name', 'Description'],
        rows: [
          ['Alice', 'Line1'],
          ['Line2', '']
        ]
      })
    })
  })

  describe('large datasets', () => {
    it('should handle large number of rows', () => {
      const headers = 'Name\tAge\tCity'
      const rows = Array.from({ length: 1000 }, (_, i) =>
        `Person${i}\t${20 + (i % 50)}\tCity${i % 10}`
      ).join('\n')
      const input = `${headers}\n${rows}`

      const result = parseTSV(input)
      expect(result.headers).toEqual(['Name', 'Age', 'City'])
      expect(result.rows.length).toBe(1000)
      expect(result.rows[0]).toEqual(['Person0', '20', 'City0'])
      expect(result.rows[999]).toEqual(['Person999', '69', 'City9'])
    })
  })
})
