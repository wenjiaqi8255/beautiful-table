import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ThemeSelector from './index';
import type { Theme } from '../types';

describe('ThemeSelector', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  it('should render three theme buttons', () => {
    render(<ThemeSelector selectedTheme="dark" onSelect={mockOnSelect} />);

    expect(screen.getByText(/dark/i)).toBeInTheDocument();
    expect(screen.getByText(/light/i)).toBeInTheDocument();
    expect(screen.getByText(/business/i)).toBeInTheDocument();
  });

  it('should highlight the selected theme', () => {
    render(<ThemeSelector selectedTheme="dark" onSelect={mockOnSelect} />);

    const darkButton = screen.getByRole('button', { name: /dark theme/i });
    expect(darkButton).toHaveClass('theme-selector-button-selected');
  });

  it('should highlight light theme when selected', () => {
    render(<ThemeSelector selectedTheme="light" onSelect={mockOnSelect} />);

    const lightButton = screen.getByRole('button', { name: /light theme/i });
    expect(lightButton).toHaveClass('theme-selector-button-selected');
  });

  it('should highlight business theme when selected', () => {
    render(<ThemeSelector selectedTheme="business" onSelect={mockOnSelect} />);

    const businessButton = screen.getByRole('button', { name: /business theme/i });
    expect(businessButton).toHaveClass('theme-selector-button-selected');
  });

  it('should not highlight non-selected themes', () => {
    render(<ThemeSelector selectedTheme="dark" onSelect={mockOnSelect} />);

    const lightButton = screen.getByRole('button', { name: /light theme/i });
    const businessButton = screen.getByRole('button', { name: /business theme/i });

    expect(lightButton).not.toHaveClass('theme-selector-button-selected');
    expect(businessButton).not.toHaveClass('theme-selector-button-selected');
  });

  it('should call onSelect with dark theme when dark button clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeSelector selectedTheme="light" onSelect={mockOnSelect} />);

    const darkButton = screen.getByRole('button', { name: /dark theme/i });
    await user.click(darkButton);

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenCalledWith('dark' as Theme);
  });

  it('should call onSelect with light theme when light button clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeSelector selectedTheme="dark" onSelect={mockOnSelect} />);

    const lightButton = screen.getByRole('button', { name: /light theme/i });
    await user.click(lightButton);

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenCalledWith('light' as Theme);
  });

  it('should call onSelect with business theme when business button clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeSelector selectedTheme="dark" onSelect={mockOnSelect} />);

    const businessButton = screen.getByRole('button', { name: /business theme/i });
    await user.click(businessButton);

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenCalledWith('business' as Theme);
  });

  it('should show visual preview for each theme', () => {
    render(<ThemeSelector selectedTheme="dark" onSelect={mockOnSelect} />);

    const previews = screen.getAllByRole('generic').filter(
      (el) => el.className === 'theme-selector-preview'
    );

    expect(previews).toHaveLength(3);
  });

  it('should not call onSelect when clicking already selected theme', async () => {
    const user = userEvent.setup();
    render(<ThemeSelector selectedTheme="dark" onSelect={mockOnSelect} />);

    const darkButton = screen.getByRole('button', { name: /dark theme/i });
    await user.click(darkButton);

    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it('should have accessible button labels', () => {
    render(<ThemeSelector selectedTheme="dark" onSelect={mockOnSelect} />);

    expect(screen.getByRole('button', { name: /dark theme/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /light theme/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /business theme/i })).toBeInTheDocument();
  });

  it('should display theme names correctly', () => {
    render(<ThemeSelector selectedTheme="dark" onSelect={mockOnSelect} />);

    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Business')).toBeInTheDocument();
  });
});
