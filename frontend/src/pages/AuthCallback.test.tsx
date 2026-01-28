import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as object,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams({ code: 'test-code', state: 'test-state' })],
  };
});

// Mock auth - must be defined inline to avoid hoisting issues
vi.mock('../lib/auth', () => ({
  handleOAuthCallback: vi.fn(),
}));

// Import after mocking
import AuthCallback from './AuthCallback';
import { handleOAuthCallback } from '../lib/auth';

describe('AuthCallback Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it('should render loading state', () => {
    (handleOAuthCallback as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: 'user-123' },
      token: 'test-token',
    });

    renderWithRouter(<AuthCallback />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.getByText(/signing you in/i)).toBeInTheDocument();
  });

  it('should redirect to /app when OAuth callback succeeds', async () => {
    (handleOAuthCallback as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: 'user-123' },
      token: 'test-token',
    });

    renderWithRouter(<AuthCallback />);

    await waitFor(() => {
      expect(handleOAuthCallback).toHaveBeenCalledWith('test-code', 'test-state');
      expect(mockNavigate).toHaveBeenCalledWith('/app', { replace: true });
    });
  });

  it('should redirect to / when no code in URL', async () => {
    // Override useSearchParams mock for this test
    (mockNavigate as any).mockImplementationOnce(() => ({
      get: (param: string) => {
        if (param === 'code') return null;
        if (param === 'state') return 'test-state';
        return null;
      },
    }));

    // Re-import to use updated mock
    const { useSearchParams } = await import('react-router-dom');
    (useSearchParams as any).mockReturnValueOnce([new URLSearchParams({ state: 'test-state' })]);

    renderWithRouter(<AuthCallback />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('should redirect to / on error', async () => {
    (handleOAuthCallback as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('OAuth failed')
    );

    renderWithRouter(<AuthCallback />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('should show loading spinner or indicator', () => {
    (handleOAuthCallback as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: 'user-123' },
      token: 'test-token',
    });

    renderWithRouter(<AuthCallback />);

    const loadingElement = screen.getByText(/loading/i).closest('div');
    expect(loadingElement).toHaveClass(/flex|center/);
  });
});
