import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Mock pages
vi.mock('./pages/LandingPage', () => ({
  default: () => <div data-testid="landing-page">Landing Page</div>,
}));

vi.mock('./pages/AuthCallback', () => ({
  default: () => <div data-testid="auth-callback">Auth Callback</div>,
}));

vi.mock('./pages/DashboardPage/index', () => ({
  default: () => <div data-testid="dashboard-page">Dashboard Page</div>,
}));

// Mock Supabase - define inline
vi.mock('./lib/supabase', () => ({
  getCurrentUser: vi.fn(),
}));

import App from './App';
import { getCurrentUser } from './lib/supabase';

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderApp = () => {
    return render(<App />);
  };

  it('should render loading state initially', () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));

    renderApp();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should render landing page after user loaded', async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    renderApp();

    await waitFor(() => {
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });
  });

  it('should have router configured', async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    renderApp();

    await waitFor(() => {
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });
  });
});
