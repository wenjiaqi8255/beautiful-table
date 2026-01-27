import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LandingPage from './LandingPage';

// Mock signIn
vi.mock('../lib/supabase', () => ({
  signIn: vi.fn(),
}));

describe('LandingPage', () => {
  it('should render heading', () => {
    render(<LandingPage />);
    expect(screen.getByText('Beautiful Table')).toBeInTheDocument();
  });

  it('should render sign-in button', () => {
    render(<LandingPage />);
    expect(screen.getByText(/sign in with google/i)).toBeInTheDocument();
  });

  it('should call signIn when button clicked', async () => {
    const { signIn } = await import('../lib/supabase');
    render(<LandingPage />);

    const button = screen.getByText(/sign in with google/i);
    fireEvent.click(button);

    expect(signIn).toHaveBeenCalled();
  });

  it('should render feature sections', () => {
    render(<LandingPage />);
    expect(screen.getByText(/easy upload/i)).toBeInTheDocument();
    expect(screen.getByText(/smart parsing/i)).toBeInTheDocument();
    expect(screen.getByText(/beautiful design/i)).toBeInTheDocument();
  });
});
