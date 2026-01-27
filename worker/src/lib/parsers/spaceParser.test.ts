import { describe, it, expect } from 'vitest'
import { parseSpace } from './spaceParser'

describe('Space Parser', () => {
  describe('basic parsing', () => {
    it('should parse space-delimited table with 2 spaces', () => {
      const input = 'Name  Age  City\nAlice  30  NYC\nBob  25  London'
      const result = parseSpace(input)
      expect(result).toEqual({
        headers: ['Name', 'Age', 'City'],
        rows: [
          ['Alice', '30', 'NYC'],
          ['Bob', '25', 'London']
        ]
      })
    })

    it('should parse space-delimited table with 3 spaces', () => {
      const input = 'Name   Age   City\nAlice   30   NYC\nBob   25   London'
      const result = parseSpace(input)
      expect(result).toEqual({
        headers: ['Name', 'Age', 'City'],
        rows: [
          ['Alice', '30', 'NYC'],
          ['Bob', '25', 'London']
        ]
      })
    })

    it('should parse space-delimited table with 4 spaces', () => {
      const input = 'Name    Age    City\nAlice    30    NYC\nBob    25    London'
      const result = parseSpace(input)
      expect(result).toEqual({
        headers: ['Name', 'Age', 'City'],
        rows: [
          ['Alice', '30', 'NYC'],
          ['Bob', '25', 'London']
        ]
      })
    })

    it('should parse space-delimited table without headers', () => {
      const input = 'Alice  30  NYC\nBob  25  London'
      const result = parseSpace(input)
      expect(result).toEqual({
        headers: ['Alice', '30', 'NYC'],
        rows: [
          ['Bob', '25', 'London']
        ]
      })
    })
  })

  describe('single space preservation', () => {
    it('should preserve single spaces within cells', () => {
      const input = 'Name  Description\nAlice  Project Manager\nBob  Software Engineer'
      const result = parseSpace(input)
      expect(result).toEqual({
        headers: ['Name', 'Description'],
        rows: [
          ['Alice', 'Project Manager'],
          ['Bob', 'Software Engineer']
        ]
      })
    })

    it('should preserve multiple single spaces within cells', () => {
      const input = 'Name  Note\nAlice  test data here\nBob  more info'
      const result = parseSpace(input)
      expect(result).toEqual({
        headers: ['Name', 'Note'],
        rows: [
          ['Alice', 'test data here'],
          ['Bob', 'more info']
        ]
      })
    })

    it('should preserve single spaces at cell boundaries', () => {
      const input = 'Name  Value\nAlice  text \nBob  data'
      const result = parseSpace(input)
      expect(result).toEqual({
        headers: ['Name', 'Value'],
        rows: [
          ['Alice', 'text'],
          ['Bob', 'data']
        ]
      })
    })
  })

  describe('edge cases', () => {
    it('should handle empty input', () => {
      const result = parseSpace('')
      expect(result).toEqual({
        headers: [],
        rows: []
      })
    })

    it('should handle only headers', () => {
      const input = 'Name  Age  City'
      const result = parseSpace(input)
      expect(result).toEqual({
        headers: [],
        rows: [['Name', 'Age', 'City']]
      })
    })

    it('should handle single row without headers', () => {
      const input = 'Alice  30'
      const result = parseSpace(input)
      expect(result).toEqual({
        headers: [],
        rows: [['Alice', '30']]
      })
    })

    it('should handle leading spaces in cells', () => {
      const input = 'Name  Age\n Alice  30\nBob  25'
      const result = parseSpace(input)
      expect(result).toEqual({
        headers: ['Name', 'Age'],
        rows: [
          [' Alice', '30'],
          ['Bob', '25']
        ]
      })
    })

    it('should handle trailing delimiter spaces', () => {
      const input = 'Name  Age  \nAlice  30  \nBob  25'
      const result = parseSpace(input)
      expect(result).toEqual({
        headers: ['Name', 'Age'],
        rows: [
          ['Alice', '30'],
          ['Bob', '25']
        ]
      })
    })
  })

  describe('empty cells and inconsistent columns', () => {
    it('should handle empty cells', () => {
      const input = 'Name  Age  City\nAlice     \n  30  NYC'
      const result = parseSpace(input)
      expect(result).toEqual({
        headers: ['Name', 'Age', 'City'],
        rows: [
          ['Alice', '', ''],
          ['', '30', 'NYC']
        ]
      })
    })

    it('should handle inconsistent column counts', () => {
      const input = 'Name  Age  City\nAlice  30\nBob  25  London'
      const result = parseSpace(input)
      expect(result).toEqual({
        headers: ['Name', 'Age', 'City'],
        rows: [
          ['Alice', '30', ''],
          ['Bob', '25', 'London']
        ]
      })
    })

    it('should handle rows with more columns than headers', () => {
      const input = 'Name  Age\nAlice  30  NYC\nBob  25'
      const result = parseSpace(input)
      expect(result).toEqual({
        headers: ['Name', 'Age'],
        rows: [
          ['Alice', '30'],
          ['Bob', '25']
        ]
      })
    })
  })

  describe('special characters', () => {
    it('should handle tabs (treat as single character)', () => {
      const input = 'Name  Value\nAlice  test\tvalue\nBob  data'
      const result = parseSpace(input)
      expect(result).toEqual({
        headers: ['Name', 'Value'],
        rows: [
          ['Alice', 'test\tvalue'],
          ['Bob', 'data']
        ]
      })
    })

    it('should handle unicode characters', () => {
      const input = 'Name  City\nAlice  北京市\nBob  São Paulo'
      const result = parseSpace(input)
      expect(result).toEqual({
        headers: ['Name', 'City'],
        rows: [
          ['Alice', '北京市'],
          ['Bob', 'São Paulo']
        ]
      })
    })

    it('should handle special symbols', () => {
      const input = 'Name  Email\nAlice  test@example.com\nBob  user+tag@domain.co'
      const result = parseSpace(input)
      expect(result).toEqual({
        headers: ['Name', 'Email'],
        rows: [
          ['Alice', 'test@example.com'],
          ['Bob', 'user+tag@domain.co']
        ]
      })
    })
  })

  describe('variable spacing', () => {
    it('should handle mixed 2 and 3 space delimiters', () => {
      const input = 'Name  Age   City\nAlice  30    NYC\nBob   25  London'
      const result = parseSpace(input)
      expect(result).toEqual({
        headers: ['Name', 'Age', 'City'],
        rows: [
          ['Alice', '30', 'NYC'],
          ['Bob', '25', 'London']
        ]
      })
    })

    it('should not split on single spaces', () => {
      const input = 'Name  Description\nAlice  Project Manager Lead'
      const result = parseSpace(input)
      expect(result).toEqual({
        headers: ['Name', 'Description'],
        rows: [
          ['Alice', 'Project Manager Lead']
        ]
      })
    })
  })

  describe('large datasets', () => {
    it('should handle large number of rows', () => {
      const headers = 'Name  Age  City'
      const rows = Array.from({ length: 1000 }, (_, i) =>
        `Person${i}  ${20 + (i % 50)}  City${i % 10}`
      ).join('\n')
      const input = `${headers}\n${rows}`

      const result = parseSpace(input)
      expect(result.headers).toEqual(['Name', 'Age', 'City'])
      expect(result.rows.length).toBe(1000)
      expect(result.rows[0]).toEqual(['Person0', '20', 'City0'])
      expect(result.rows[999]).toEqual(['Person999', '69', 'City9'])
    })
  })

  describe('alignment scenarios', () => {
    it('should handle right-aligned columns with leading spaces', () => {
      const input = 'Name    Age  City\nAlice    30   NYC\n  Bob    25   London'
      const result = parseSpace(input)
      expect(result).toEqual({
        headers: ['Name', 'Age', 'City'],
        rows: [
          ['Alice', '30', 'NYC'],
          ['', 'Bob', '25']
        ]
      })
    })
  })
})
