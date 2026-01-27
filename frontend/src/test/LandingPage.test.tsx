import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LandingPage from '../pages/LandingPage';

describe('LandingPage', () => {
  it('should render the main heading', () => {
    render(<LandingPage />);
    const heading = screen.getByText('Beautiful Table');
    expect(heading).toBeInTheDocument();
  });

  it('should render the tagline', () => {
    render(<LandingPage />);
    const tagline = screen.getByText(/Transform your data into stunning/);
    expect(tagline).toBeInTheDocument();
  });

  it('should render the upload button', () => {
    render(<LandingPage />);
    const button = screen.getByText('Upload File');
    expect(button).toBeInTheDocument();
  });

  it('should render feature cards', () => {
    render(<LandingPage />);
    expect(screen.getByText('Easy Upload')).toBeInTheDocument();
    expect(screen.getByText('Smart Parsing')).toBeInTheDocument();
    expect(screen.getByText('Beautiful Design')).toBeInTheDocument();
  });
});
