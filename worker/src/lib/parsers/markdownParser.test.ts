import { describe, it, expect } from 'vitest'
import { parseMarkdown } from './markdownParser'

describe('Markdown Parser', () => {
  describe('basic parsing', () => {
    it('should parse simple markdown table with pipes', () => {
      const input = '| Name | Age | City |\n| --- | --- | --- |\n| Alice | 30 | NYC |\n| Bob | 25 | London |'
      const result = parseMarkdown(input)
      expect(result).toEqual({
        headers: ['Name', 'Age', 'City'],
        rows: [
          ['Alice', '30', 'NYC'],
          ['Bob', '25', 'London']
        ]
      })
    })

    it('should parse markdown table without spaces around pipes', () => {
      const input = '|Name|Age|City|\n|---|---|---|\n|Alice|30|NYC|\n|Bob|25|London|'
      const result = parseMarkdown(input)
      expect(result).toEqual({
        headers: ['Name', 'Age', 'City'],
        rows: [
          ['Alice', '30', 'NYC'],
          ['Bob', '25', 'London']
        ]
      })
    })

    it('should skip separator row', () => {
      const input = '| Name | Age |\n| --- | --- |\n| Alice | 30 |'
      const result = parseMarkdown(input)
      expect(result).toEqual({
        headers: ['Name', 'Age'],
        rows: [
          ['Alice', '30']
        ]
      })
    })

    it('should handle tables without data rows', () => {
      const input = '| Name | Age |\n| --- | --- |'
      const result = parseMarkdown(input)
      expect(result).toEqual({
        headers: ['Name', 'Age'],
        rows: []
      })
    })
  })

  describe('alignment indicators', () => {
    it('should handle left alignment (:---)', () => {
      const input = '| Name | Age |\n| :--- | :--- |\n| Alice | 30 |'
      const result = parseMarkdown(input)
      expect(result).toEqual({
        headers: ['Name', 'Age'],
        rows: [
          ['Alice', '30']
        ]
      })
    })

    it('should handle right alignment (---:)', () => {
      const input = '| Name | Age |\n| ---: | ---: |\n| Alice | 30 |'
      const result = parseMarkdown(input)
      expect(result).toEqual({
        headers: ['Name', 'Age'],
        rows: [
          ['Alice', '30']
        ]
      })
    })

    it('should handle center alignment (:-:)', () => {
      const input = '| Name | Age |\n| :--: | :--: |\n| Alice | 30 |'
      const result = parseMarkdown(input)
      expect(result).toEqual({
        headers: ['Name', 'Age'],
        rows: [
          ['Alice', '30']
        ]
      })
    })

    it('should handle mixed alignments', () => {
      const input = '| Name | Age | City |\n| :--- | :--: | ---: |\n| Alice | 30 | NYC |'
      const result = parseMarkdown(input)
      expect(result).toEqual({
        headers: ['Name', 'Age', 'City'],
        rows: [
          ['Alice', '30', 'NYC']
        ]
      })
    })
  })

  describe('whitespace handling', () => {
    it('should trim spaces around cells', () => {
      const input = '|  Name  |  Age  |\n|  ---  |  ---  |\n|  Alice  |  30  |'
      const result = parseMarkdown(input)
      expect(result).toEqual({
        headers: ['Name', 'Age'],
        rows: [
          ['Alice', '30']
        ]
      })
    })

    it('should preserve spaces within cells', () => {
      const input = '| Name | Description |\n| --- | --- |\n| Alice | Project Manager |'
      const result = parseMarkdown(input)
      expect(result).toEqual({
        headers: ['Name', 'Description'],
        rows: [
          ['Alice', 'Project Manager']
        ]
      })
    })

    it('should handle empty cells', () => {
      const input = '| Name | Age |\n| --- | --- |\n| Alice | |\n| | 25 |'
      const result = parseMarkdown(input)
      expect(result).toEqual({
        headers: ['Name', 'Age'],
        rows: [
          ['Alice', ''],
          ['', '25']
        ]
      })
    })
  })

  describe('edge cases', () => {
    it('should handle empty input', () => {
      const result = parseMarkdown('')
      expect(result).toEqual({
        headers: [],
        rows: []
      })
    })

    it('should handle missing separator row', () => {
      const input = '| Name | Age |\n| Alice | 30 |'
      const result = parseMarkdown(input)
      expect(result).toEqual({
        headers: ['Name', 'Age'],
        rows: [
          ['Alice', '30']
        ]
      })
    })

    it('should handle inconsistent column counts', () => {
      const input = '| Name | Age | City |\n| --- | --- | --- |\n| Alice | 30 |\n| Bob | 25 | London |'
      const result = parseMarkdown(input)
      expect(result).toEqual({
        headers: ['Name', 'Age', 'City'],
        rows: [
          ['Alice', '30', ''],
          ['Bob', '25', 'London']
        ]
      })
    })

    it('should handle leading/trailing pipes', () => {
      const input = '| Name | Age |\n| --- | --- |\n| Alice | 30 |'
      const result = parseMarkdown(input)
      expect(result).toEqual({
        headers: ['Name', 'Age'],
        rows: [
          ['Alice', '30']
        ]
      })
    })
  })

  describe('special characters', () => {
    it('should handle unicode characters', () => {
      const input = '| Name | City |\n| --- | --- |\n| Alice | 北京市 |\n| Bob | São Paulo |'
      const result = parseMarkdown(input)
      expect(result).toEqual({
        headers: ['Name', 'City'],
        rows: [
          ['Alice', '北京市'],
          ['Bob', 'São Paulo']
        ]
      })
    })

    it('should handle special symbols', () => {
      const input = '| Name | Email |\n| --- | --- |\n| Alice | test@example.com |\n| Bob | user+tag@domain.co |'
      const result = parseMarkdown(input)
      expect(result).toEqual({
        headers: ['Name', 'Email'],
        rows: [
          ['Alice', 'test@example.com'],
          ['Bob', 'user+tag@domain.co']
        ]
      })
    })
  })

  describe('markdown format variations', () => {
    it('should handle tables with newlines at end', () => {
      const input = '| Name | Age |\n| --- | --- |\n| Alice | 30 |\n| Bob | 25 |\n'
      const result = parseMarkdown(input)
      expect(result).toEqual({
        headers: ['Name', 'Age'],
        rows: [
          ['Alice', '30'],
          ['Bob', '25']
        ]
      })
    })

    it('should handle tables without trailing pipes on all lines', () => {
      const input = '| Name | Age\n| --- | ---\n| Alice | 30\n| Bob | 25'
      const result = parseMarkdown(input)
      expect(result).toEqual({
        headers: ['Name', 'Age'],
        rows: [
          ['Alice', '30'],
          ['Bob', '25']
        ]
      })
    })

    it('should handle inconsistent trailing pipes', () => {
      const input = '| Name | Age |\n| --- | ---\n| Alice | 30\n| Bob | 25 |'
      const result = parseMarkdown(input)
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
      const headers = '| Name | Age | City |'
      const sep = '| --- | --- | --- |'
      const rows = Array.from({ length: 1000 }, (_, i) =>
        `| Person${i} | ${20 + (i % 50)} | City${i % 10} |`
      ).join('\n')
      const input = `${headers}\n${sep}\n${rows}`

      const result = parseMarkdown(input)
      expect(result.headers).toEqual(['Name', 'Age', 'City'])
      expect(result.rows.length).toBe(1000)
      expect(result.rows[0]).toEqual(['Person0', '20', 'City0'])
      expect(result.rows[999]).toEqual(['Person999', '69', 'City9'])
    })
  })
})
