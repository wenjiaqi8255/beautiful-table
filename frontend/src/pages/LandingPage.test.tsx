import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LandingPage from './LandingPage';

// Mock signInWithGoogle
vi.mock('../lib/auth', () => ({
  signInWithGoogle: vi.fn(),
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

  it('should call signInWithGoogle when button clicked', async () => {
    const { signInWithGoogle } = await import('../lib/auth');
    render(<LandingPage />);

    const button = screen.getByText(/sign in with google/i);
    fireEvent.click(button);

    expect(signInWithGoogle).toHaveBeenCalled();
  });

  it('should render feature sections', () => {
    render(<LandingPage />);
    expect(screen.getByText(/easy upload/i)).toBeInTheDocument();
    expect(screen.getByText(/smart parsing/i)).toBeInTheDocument();
    expect(screen.getByText(/beautiful design/i)).toBeInTheDocument();
  });
});
