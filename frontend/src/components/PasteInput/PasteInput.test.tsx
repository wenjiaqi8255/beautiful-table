import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import PasteInput from './index';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('PasteInput', () => {
  const mockOnDataParsed = vi.fn();

  beforeEach(() => {
    mockOnDataParsed.mockClear();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render textarea with placeholder', () => {
    render(<PasteInput onDataParsed={mockOnDataParsed} />);

    const textarea = screen.getByPlaceholderText(/paste your data/i);
    expect(textarea).toBeInTheDocument();
  });

  it('should render empty textarea initially', () => {
    render(<PasteInput onDataParsed={mockOnDataParsed} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('');
  });

  it('should allow typing in textarea', async () => {
    const user = userEvent.setup();
    render(<PasteInput onDataParsed={mockOnDataParsed} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Some text');

    expect(textarea).toHaveValue('Some text');
  });

  it('should detect paste event and call API', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      success: true,
      data: {
        headers: ['Name', 'Age'],
        rows: [['John', '30'], ['Jane', '25']]
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<PasteInput onDataParsed={mockOnDataParsed} />);

    const textarea = screen.getByRole('textbox');
    await user.click(textarea);
    await user.paste('Name\tAge\nJohn\t30\nJane\t25');

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: 'Name\tAge\nJohn\t30\nJane\t25' }),
      });
    });
  });

  it('should show loading state during API call', async () => {
    const user = userEvent.setup();
    let resolveFetch: (value: any) => void;

    mockFetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    render(<PasteInput onDataParsed={mockOnDataParsed} />);

    const textarea = screen.getByRole('textbox');
    await user.click(textarea);
    await user.paste('Some data');

    // Check for loading indicator
    await waitFor(() => {
      expect(screen.getByText(/parsing/i)).toBeInTheDocument();
    });

    // Resolve the fetch
    resolveFetch!({
      ok: true,
      json: async () => ({ success: true, data: { headers: [], rows: [] } }),
    });

    await waitFor(() => {
      expect(screen.queryByText(/parsing/i)).not.toBeInTheDocument();
    });
  });

  it('should call onDataParsed with table data on successful parse', async () => {
    const user = userEvent.setup();
    const mockTableData = {
      headers: ['Name', 'Age'],
      rows: [['John', '30'], ['Jane', '25']]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockTableData,
      }),
    });

    render(<PasteInput onDataParsed={mockOnDataParsed} />);

    const textarea = screen.getByRole('textbox');
    await user.click(textarea);
    await user.paste('Name\tAge\nJohn\t30\nJane\t25');

    await waitFor(() => {
      expect(mockOnDataParsed).toHaveBeenCalledWith(mockTableData);
      expect(mockOnDataParsed).toHaveBeenCalledTimes(1);
    });
  });

  it('should show error message on API failure', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' }),
    });

    render(<PasteInput onDataParsed={mockOnDataParsed} />);

    const textarea = screen.getByRole('textbox');
    await user.click(textarea);
    await user.paste('Some data');

    await waitFor(() => {
      expect(screen.getByText('Internal server error')).toBeInTheDocument();
    });
  });

  it('should show error message on network error', async () => {
    const user = userEvent.setup();
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<PasteInput onDataParsed={mockOnDataParsed} />);

    const textarea = screen.getByRole('textbox');
    await user.click(textarea);
    await user.paste('Some data');

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should clear error on new paste', async () => {
    const user = userEvent.setup();
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<PasteInput onDataParsed={mockOnDataParsed} />);

    const textarea = screen.getByRole('textbox');

    // First paste - error
    await user.click(textarea);
    await user.paste('Bad data');

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    // Second paste - success
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { headers: [], rows: [] } }),
    });

    await user.click(textarea);
    await user.paste('Good data');

    await waitFor(() => {
      expect(screen.queryByText(/failed to parse/i)).not.toBeInTheDocument();
    });
  });

  it('should clear textarea after successful parse', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { headers: ['Name'], rows: [['John']] },
      }),
    });

    render(<PasteInput onDataParsed={mockOnDataParsed} />);

    const textarea = screen.getByRole('textbox');
    await user.click(textarea);
    await user.paste('Some data');

    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });
  });

  it('should handle empty API response gracefully', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<PasteInput onDataParsed={mockOnDataParsed} />);

    const textarea = screen.getByRole('textbox');
    await user.click(textarea);
    await user.paste('Some data');

    await waitFor(() => {
      expect(mockOnDataParsed).not.toHaveBeenCalled();
    });
  });

  it('should handle API response with error field', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, error: 'Parse error' }),
    });

    render(<PasteInput onDataParsed={mockOnDataParsed} />);

    const textarea = screen.getByRole('textbox');
    await user.click(textarea);
    await user.paste('Some data');

    await waitFor(() => {
      expect(screen.getByText(/parse error/i)).toBeInTheDocument();
      expect(mockOnDataParsed).not.toHaveBeenCalled();
    });
  });
});
