import { describe, it, expect } from 'vitest'
import { parseCSV } from './csvParser'

describe('CSV Parser', () => {
  describe('basic parsing', () => {
    it('should parse simple CSV with commas', () => {
      const input = 'Name,Age,City\nAlice,30,NYC\nBob,25,London'
      const result = parseCSV(input)
      expect(result).toEqual({
        headers: ['Name', 'Age', 'City'],
        rows: [
          ['Alice', '30', 'NYC'],
          ['Bob', '25', 'London']
        ]
      })
    })

    it('should handle quoted fields with commas', () => {
      const input = 'Name,Description\nAlice,"Project Manager, Lead"\nBob,"Developer, Senior"'
      const result = parseCSV(input)
      expect(result).toEqual({
        headers: ['Name', 'Description'],
        rows: [
          ['Alice', 'Project Manager, Lead'],
          ['Bob', 'Developer, Senior']
        ]
      })
    })

    it('should handle quoted fields with quotes inside', () => {
      const input = 'Name,Note\nAlice,"She said ""hello"""'
      const result = parseCSV(input)
      expect(result).toEqual({
        headers: ['Name', 'Note'],
        rows: [
          ['Alice', 'She said "hello"']
        ]
      })
    })

    it('should parse CSV without headers', () => {
      const input = 'Alice,30,NYC\nBob,25,London'
      const result = parseCSV(input)
      expect(result).toEqual({
        headers: ['Alice', '30', 'NYC'],
        rows: [
          ['Bob', '25', 'London']
        ]
      })
    })
  })

  describe('quoted fields', () => {
    it('should handle fully quoted fields', () => {
      const input = '"Name","Age","City"\n"Alice","30","NYC"'
      const result = parseCSV(input)
      expect(result).toEqual({
        headers: ['Name', 'Age', 'City'],
        rows: [
          ['Alice', '30', 'NYC']
        ]
      })
    })

    it('should handle mixed quoted and unquoted fields', () => {
      const input = 'Name,"Age",City\nAlice,30,NYC'
      const result = parseCSV(input)
      expect(result).toEqual({
        headers: ['Name', 'Age', 'City'],
        rows: [
          ['Alice', '30', 'NYC']
        ]
      })
    })

    it('should handle empty quoted fields', () => {
      const input = 'Name,Description\nAlice,""\nBob,"note"'
      const result = parseCSV(input)
      expect(result).toEqual({
        headers: ['Name', 'Description'],
        rows: [
          ['Alice', ''],
          ['Bob', 'note']
        ]
      })
    })

    it('should handle quotes at start and end of field', () => {
      const input = 'Name,Note\nAlice,"""test"""'
      const result = parseCSV(input)
      expect(result).toEqual({
        headers: ['Name', 'Note'],
        rows: [
          ['Alice', '"test"']
        ]
      })
    })
  })

  describe('edge cases', () => {
    it('should handle empty input', () => {
      const result = parseCSV('')
      expect(result).toEqual({
        headers: [],
        rows: []
      })
    })

    it('should handle only headers', () => {
      const input = 'Name,Age,City'
      const result = parseCSV(input)
      expect(result).toEqual({
        headers: [],
        rows: [['Name', 'Age', 'City']]
      })
    })

    it('should handle single row without headers', () => {
      const input = 'Alice,30'
      const result = parseCSV(input)
      expect(result).toEqual({
        headers: [],
        rows: [['Alice', '30']]
      })
    })

    it('should handle trailing commas', () => {
      const input = 'Name,Age,\nAlice,30,'
      const result = parseCSV(input)
      expect(result).toEqual({
        headers: ['Name', 'Age', ''],
        rows: [
          ['Alice', '30', '']
        ]
      })
    })

    it('should handle consecutive commas', () => {
      const input = 'Name,,Age\nAlice,,30'
      const result = parseCSV(input)
      expect(result).toEqual({
        headers: ['Name', '', 'Age'],
        rows: [
          ['Alice', '', '30']
        ]
      })
    })
  })

  describe('whitespace handling', () => {
    it('should preserve spaces within unquoted fields', () => {
      const input = 'Name, Description\nAlice, Project Manager'
      const result = parseCSV(input)
      expect(result).toEqual({
        headers: ['Name', ' Description'],
        rows: [
          ['Alice', ' Project Manager']
        ]
      })
    })

    it('should preserve spaces within quoted fields', () => {
      const input = 'Name,Description\nAlice," Project Manager "'
      const result = parseCSV(input)
      expect(result).toEqual({
        headers: ['Name', 'Description'],
        rows: [
          ['Alice', ' Project Manager ']
        ]
      })
    })
  })

  describe('special characters', () => {
    it('should handle newlines in quoted fields', () => {
      const input = 'Name,Description\nAlice,"Line1\nLine2"'
      const result = parseCSV(input)
      expect(result).toEqual({
        headers: ['Name', 'Description'],
        rows: [
          ['Alice', 'Line1\nLine2']
        ]
      })
    })

    it('should handle tabs in quoted fields', () => {
      const input = 'Name,Description\nAlice,"Col1\tCol2"'
      const result = parseCSV(input)
      expect(result).toEqual({
        headers: ['Name', 'Description'],
        rows: [
          ['Alice', 'Col1\tCol2']
        ]
      })
    })

    it('should handle unicode characters', () => {
      const input = 'Name,City\nAlice,北京市\nBob,São Paulo'
      const result = parseCSV(input)
      expect(result).toEqual({
        headers: ['Name', 'City'],
        rows: [
          ['Alice', '北京市'],
          ['Bob', 'São Paulo']
        ]
      })
    })

    it('should handle special symbols', () => {
      const input = 'Name,Email\nAlice,test@example.com\nBob,bob+test@co.uk'
      const result = parseCSV(input)
      expect(result).toEqual({
        headers: ['Name', 'Email'],
        rows: [
          ['Alice', 'test@example.com'],
          ['Bob', 'bob+test@co.uk']
        ]
      })
    })
  })

  describe('inconsistent columns', () => {
    it('should handle inconsistent column counts', () => {
      const input = 'Name,Age,City\nAlice,30\nBob,25,London'
      const result = parseCSV(input)
      expect(result).toEqual({
        headers: ['Name', 'Age', 'City'],
        rows: [
          ['Alice', '30', ''],
          ['Bob', '25', 'London']
        ]
      })
    })

    it('should handle rows with more columns than headers', () => {
      const input = 'Name,Age\nAlice,30,extra\nBob,25'
      const result = parseCSV(input)
      expect(result).toEqual({
        headers: ['Name', 'Age'],
        rows: [
          ['Alice', '30'],
          ['Bob', '25']
        ]
      })
    })
  })

  describe('large datasets', () => {
    it('should handle large number of rows', () => {
      const headers = 'Name,Age,City'
      const rows = Array.from({ length: 1000 }, (_, i) =>
        `Person${i},${20 + (i % 50)},City${i % 10}`
      ).join('\n')
      const input = `${headers}\n${rows}`

      const result = parseCSV(input)
      expect(result.headers).toEqual(['Name', 'Age', 'City'])
      expect(result.rows.length).toBe(1000)
      expect(result.rows[0]).toEqual(['Person0', '20', 'City0'])
      expect(result.rows[999]).toEqual(['Person999', '69', 'City9'])
    })
  })

  describe('complex real-world scenarios', () => {
    it('should handle CSV with empty lines', () => {
      const input = 'Name,Age\n\nAlice,30\n\nBob,25'
      const result = parseCSV(input)
      expect(result).toEqual({
        headers: ['Name', 'Age'],
        rows: [
          ['', ''],
          ['Alice', '30'],
          ['', ''],
          ['Bob', '25']
        ]
      })
    })

    it('should handle comma at end of field', () => {
      const input = 'Name,Value\nAlice,100,\nBob,200'
      const result = parseCSV(input)
      expect(result).toEqual({
        headers: ['Name', 'Value'],
        rows: [
          ['Alice', '100'],
          ['Bob', '200']
        ]
      })
    })
  })
})
