import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TablePreview from './index';
import type { TableData } from '../types';

describe('TablePreview', () => {
  it('should render empty state when no data', () => {
    render(<TablePreview data={null} theme="dark" />);

    expect(screen.getByText(/no data to display/i)).toBeInTheDocument();
  });

  it('should render table with headers', () => {
    const data: TableData = {
      headers: ['Name', 'Age', 'City'],
      rows: [['John', '30', 'NYC'], ['Jane', '25', 'LA']]
    };

    render(<TablePreview data={data} theme="dark" />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(screen.getByText('City')).toBeInTheDocument();
  });

  it('should render all rows', () => {
    const data: TableData = {
      headers: ['Name', 'Age'],
      rows: [['John', '30'], ['Jane', '25'], ['Bob', '35']]
    };

    render(<TablePreview data={data} theme="dark" />);

    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('should show row count', () => {
    const data: TableData = {
      headers: ['Name'],
      rows: [['John'], ['Jane'], ['Bob']]
    };

    render(<TablePreview data={data} theme="dark" />);

    expect(screen.getByText(/3 rows/i)).toBeInTheDocument();
  });

  it('should show column count', () => {
    const data: TableData = {
      headers: ['Name', 'Age', 'City'],
      rows: [['John', '30', 'NYC']]
    };

    render(<TablePreview data={data} theme="dark" />);

    expect(screen.getByText(/3 columns/i)).toBeInTheDocument();
  });

  it('should apply dark theme styles', () => {
    const data: TableData = {
      headers: ['Name'],
      rows: [['John']]
    };

    const { container } = render(<TablePreview data={data} theme="dark" />);

    const table = container.querySelector('.table-preview-table');
    expect(table).toHaveStyle({
      backgroundColor: '#1a1a1a',
      color: '#e5e5e5',
    });
  });

  it('should apply light theme styles', () => {
    const data: TableData = {
      headers: ['Name'],
      rows: [['John']]
    };

    const { container } = render(<TablePreview data={data} theme="light" />);

    const table = container.querySelector('.table-preview-table');
    expect(table).toHaveStyle({
      backgroundColor: '#ffffff',
      color: '#333333',
    });
  });

  it('should apply business theme styles', () => {
    const data: TableData = {
      headers: ['Name'],
      rows: [['John']]
    };

    const { container } = render(<TablePreview data={data} theme="business" />);

    const table = container.querySelector('.table-preview-table');
    expect(table).toHaveStyle({
      backgroundColor: '#f8fafc',
      color: '#1e293b',
    });
  });

  it('should render header with business theme background', () => {
    const data: TableData = {
      headers: ['Name'],
      rows: [['John']]
    };

    const { container } = render(<TablePreview data={data} theme="business" />);

    const header = container.querySelector('th');
    expect(header).toHaveStyle({
      backgroundColor: '#0f172a',
    });
  });

  it('should handle empty rows array', () => {
    const data: TableData = {
      headers: ['Name', 'Age'],
      rows: []
    };

    render(<TablePreview data={data} theme="dark" />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(screen.getByText(/0 rows/i)).toBeInTheDocument();
  });

  it('should handle special characters in cell data', () => {
    const data: TableData = {
      headers: ['Text', 'Special'],
      rows: [['Hello World', '<>&"\'']]
    };

    render(<TablePreview data={data} theme="dark" />);

    expect(screen.getByText('Hello World')).toBeInTheDocument();
    expect(screen.getByText('<>&"\'')).toBeInTheDocument();
  });

  it('should handle long text in cells', () => {
    const longText = 'a'.repeat(1000);
    const data: TableData = {
      headers: ['Long Text'],
      rows: [[longText]]
    };

    render(<TablePreview data={data} theme="dark" />);

    expect(screen.getByText(longText)).toBeInTheDocument();
  });

  it('should render table with single column', () => {
    const data: TableData = {
      headers: ['Name'],
      rows: [['John'], ['Jane']]
    };

    render(<TablePreview data={data} theme="dark" />);

    expect(screen.getByText(/1 column/i)).toBeInTheDocument();
  });

  it('should render table with single row', () => {
    const data: TableData = {
      headers: ['Name', 'Age'],
      rows: [['John', '30']]
    };

    render(<TablePreview data={data} theme="dark" />);

    expect(screen.getByText(/1 row/i)).toBeInTheDocument();
  });
});
