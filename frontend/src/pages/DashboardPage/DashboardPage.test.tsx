import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import DashboardPage from './index';
import { useStore } from '../../components/useStore';

// Mock the store
vi.mock('../../components/useStore');

// Mock html2canvas
vi.mock('html2canvas', () => ({
  default: vi.fn(() =>
    Promise.resolve({
      toDataURL: vi.fn(() => 'data:image/png;base64,mockdata'),
    })
  ),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock createElement and link download
const mockLink = {
  click: vi.fn(),
  style: {},
};
const originalCreateElement = document.createElement;
document.createElement = vi.fn((tagName) => {
  if (tagName === 'a') {
    return mockLink as any;
  }
  return originalCreateElement.call(document, tagName) as any;
});

describe('DashboardPage', () => {
  const mockSetTableData = vi.fn();
  const mockSetTheme = vi.fn();
  const mockDecrementCredits = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useStore as any).mockReturnValue({
      tableData: null,
      selectedTheme: 'dark',
      isLoading: false,
      error: null,
      creditsRemaining: 5,
      hasCredits: true,
      setTableData: mockSetTableData,
      setTheme: mockSetTheme,
      setLoading: vi.fn(),
      setError: vi.fn(),
      decrementCredits: mockDecrementCredits,
      setCredits: vi.fn(),
      reset: vi.fn(),
    });
  });

  it('should render page title', () => {
    render(<DashboardPage />);

    expect(screen.getByText(/beautiful table/i)).toBeInTheDocument();
  });

  it('should render PasteInput component', () => {
    render(<DashboardPage />);

    expect(screen.getByPlaceholderText(/paste your data/i)).toBeInTheDocument();
  });

  it('should render ThemeSelector component', () => {
    (useStore as any).mockReturnValue({
      tableData: {
        headers: ['Name'],
        rows: [['John']]
      },
      selectedTheme: 'dark',
      isLoading: false,
      error: null,
      creditsRemaining: 5,
      hasCredits: true,
      setTableData: mockSetTableData,
      setTheme: mockSetTheme,
      setLoading: vi.fn(),
      setError: vi.fn(),
      decrementCredits: mockDecrementCredits,
      setCredits: vi.fn(),
      reset: vi.fn(),
    });

    render(<DashboardPage />);

    expect(screen.getByText(/dark/i)).toBeInTheDocument();
    expect(screen.getByText(/light/i)).toBeInTheDocument();
    expect(screen.getByText(/business/i)).toBeInTheDocument();
  });

  it('should render ExportButton component', () => {
    (useStore as any).mockReturnValue({
      tableData: {
        headers: ['Name'],
        rows: [['John']]
      },
      selectedTheme: 'dark',
      isLoading: false,
      error: null,
      creditsRemaining: 5,
      hasCredits: true,
      setTableData: mockSetTableData,
      setTheme: mockSetTheme,
      setLoading: vi.fn(),
      setError: vi.fn(),
      decrementCredits: mockDecrementCredits,
      setCredits: vi.fn(),
      reset: vi.fn(),
    });

    render(<DashboardPage />);

    expect(screen.getByText(/credits remaining/i)).toBeInTheDocument();
  });

  it('should show empty state when no data', () => {
    render(<DashboardPage />);

    expect(screen.getByText(/paste your data above to get started/i)).toBeInTheDocument();
  });

  it('should call setTableData when data is parsed', async () => {
    const user = userEvent.setup();
    const mockTableData = {
      headers: ['Name', 'Age'],
      rows: [['John', '30']]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockTableData,
      }),
    });

    (useStore as any).mockReturnValue({
      tableData: null,
      selectedTheme: 'dark',
      isLoading: false,
      error: null,
      creditsRemaining: 5,
      hasCredits: true,
      setTableData: mockSetTableData,
      setTheme: mockSetTheme,
      setLoading: vi.fn(),
      setError: vi.fn(),
      decrementCredits: mockDecrementCredits,
      setCredits: vi.fn(),
      reset: vi.fn(),
    });

    render(<DashboardPage />);

    const textarea = screen.getByPlaceholderText(/paste your data/i);
    await user.click(textarea);
    await user.paste('Name\tAge\nJohn\t30');

    await waitFor(() => {
      expect(mockSetTableData).toHaveBeenCalledWith(mockTableData);
    });
  });

  it('should call setTheme when theme is selected', async () => {
    const user = userEvent.setup();

    (useStore as any).mockReturnValue({
      tableData: {
        headers: ['Name'],
        rows: [['John']]
      },
      selectedTheme: 'dark',
      isLoading: false,
      error: null,
      creditsRemaining: 5,
      hasCredits: true,
      setTableData: mockSetTableData,
      setTheme: mockSetTheme,
      setLoading: vi.fn(),
      setError: vi.fn(),
      decrementCredits: mockDecrementCredits,
      setCredits: vi.fn(),
      reset: vi.fn(),
    });

    render(<DashboardPage />);

    const lightButton = screen.getByRole('button', { name: /light theme/i });
    await user.click(lightButton);

    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('should call decrementCredits when export is triggered', async () => {
    const user = userEvent.setup();
    const html2canvas = (await import('html2canvas')).default;

    (useStore as any).mockReturnValue({
      tableData: {
        headers: ['Name'],
        rows: [['John']]
      },
      selectedTheme: 'dark',
      isLoading: false,
      error: null,
      creditsRemaining: 5,
      hasCredits: true,
      setTableData: mockSetTableData,
      setTheme: mockSetTheme,
      setLoading: vi.fn(),
      setError: vi.fn(),
      decrementCredits: mockDecrementCredits,
      setCredits: vi.fn(),
      reset: vi.fn(),
    });

    render(<DashboardPage />);

    const pngButton = screen.getByRole('button', { name: /export as png/i });
    await user.click(pngButton);

    await waitFor(() => {
      expect(mockDecrementCredits).toHaveBeenCalled();
      expect(html2canvas).toHaveBeenCalled();
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  it('should not show export buttons when no data', () => {
    render(<DashboardPage />);

    const pngButton = screen.queryByRole('button', { name: /export as png/i });
    expect(pngButton).not.toBeInTheDocument();
  });

  it('should disable export when no credits', () => {
    (useStore as any).mockReturnValue({
      tableData: {
        headers: ['Name'],
        rows: [['John']]
      },
      selectedTheme: 'dark',
      isLoading: false,
      error: null,
      creditsRemaining: 0,
      hasCredits: false,
      setTableData: mockSetTableData,
      setTheme: mockSetTheme,
      setLoading: vi.fn(),
      setError: vi.fn(),
      decrementCredits: mockDecrementCredits,
      setCredits: vi.fn(),
      reset: vi.fn(),
    });

    render(<DashboardPage />);

    const pngButton = screen.getByRole('button', { name: /export as png/i });
    expect(pngButton).toBeDisabled();
  });

  it('should render table preview when data exists', () => {
    (useStore as any).mockReturnValue({
      tableData: {
        headers: ['Name', 'Age'],
        rows: [['John', '30']]
      },
      selectedTheme: 'dark',
      isLoading: false,
      error: null,
      creditsRemaining: 5,
      hasCredits: true,
      setTableData: mockSetTableData,
      setTheme: mockSetTheme,
      setLoading: vi.fn(),
      setError: vi.fn(),
      decrementCredits: mockDecrementCredits,
      setCredits: vi.fn(),
      reset: vi.fn(),
    });

    render(<DashboardPage />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });
});
