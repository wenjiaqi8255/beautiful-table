import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ExportButton from './index';
import type { ExportFormat } from '../types';

describe('ExportButton', () => {
  const mockOnExport = vi.fn();

  beforeEach(() => {
    mockOnExport.mockClear();
  });

  it('should show remaining credits', () => {
    render(<ExportButton creditsRemaining={5} hasData={true} onExport={mockOnExport} />);

    expect(screen.getByText(/5 credits remaining/i)).toBeInTheDocument();
  });

  it('should show 1 credit in singular form', () => {
    render(<ExportButton creditsRemaining={1} hasData={true} onExport={mockOnExport} />);

    expect(screen.getByText(/1 credit remaining/i)).toBeInTheDocument();
  });

  it('should show no credits message when zero', () => {
    render(<ExportButton creditsRemaining={0} hasData={true} onExport={mockOnExport} />);

    expect(screen.getByText(/no credits remaining/i)).toBeInTheDocument();
  });

  it('should disable button when no data', () => {
    render(<ExportButton creditsRemaining={5} hasData={false} onExport={mockOnExport} />);

    const pngButton = screen.getByRole('button', { name: /export as png/i });
    const jpgButton = screen.getByRole('button', { name: /export as jpg/i });

    expect(pngButton).toBeDisabled();
    expect(jpgButton).toBeDisabled();
  });

  it('should disable button when no credits', () => {
    render(<ExportButton creditsRemaining={0} hasData={true} onExport={mockOnExport} />);

    const pngButton = screen.getByRole('button', { name: /export as png/i });
    const jpgButton = screen.getByRole('button', { name: /export as jpg/i });

    expect(pngButton).toBeDisabled();
    expect(jpgButton).toBeDisabled();
  });

  it('should enable buttons when has data and credits', () => {
    render(<ExportButton creditsRemaining={5} hasData={true} onExport={mockOnExport} />);

    const pngButton = screen.getByRole('button', { name: /export as png/i });
    const jpgButton = screen.getByRole('button', { name: /export as jpg/i });

    expect(pngButton).not.toBeDisabled();
    expect(jpgButton).not.toBeDisabled();
  });

  it('should call onExport with png format when png button clicked', async () => {
    const user = userEvent.setup();
    render(<ExportButton creditsRemaining={5} hasData={true} onExport={mockOnExport} />);

    const pngButton = screen.getByRole('button', { name: /export as png/i });
    await user.click(pngButton);

    expect(mockOnExport).toHaveBeenCalledTimes(1);
    expect(mockOnExport).toHaveBeenCalledWith('png' as ExportFormat);
  });

  it('should call onExport with jpg format when jpg button clicked', async () => {
    const user = userEvent.setup();
    render(<ExportButton creditsRemaining={5} hasData={true} onExport={mockOnExport} />);

    const jpgButton = screen.getByRole('button', { name: /export as jpg/i });
    await user.click(jpgButton);

    expect(mockOnExport).toHaveBeenCalledTimes(1);
    expect(mockOnExport).toHaveBeenCalledWith('jpg' as ExportFormat);
  });

  it('should show loading state during export', async () => {
    const user = userEvent.setup();
    mockOnExport.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<ExportButton creditsRemaining={5} hasData={true} onExport={mockOnExport} />);

    const pngButton = screen.getByRole('button', { name: /export as png/i });
    await user.click(pngButton);

    expect(screen.getAllByText(/exporting/i)).toHaveLength(2);
    expect(pngButton).toBeDisabled();
  });

  it('should clear loading state after export completes', async () => {
    const user = userEvent.setup();
    mockOnExport.mockResolvedValue(undefined);

    render(<ExportButton creditsRemaining={5} hasData={true} onExport={mockOnExport} />);

    const pngButton = screen.getByRole('button', { name: /export as png/i });
    await user.click(pngButton);

    // Wait for loading to clear
    await expect(await screen.findByText(/export as png/i)).toBeInTheDocument();
  });

  it('should display export format buttons', () => {
    render(<ExportButton creditsRemaining={5} hasData={true} onExport={mockOnExport} />);

    expect(screen.getByRole('button', { name: /export as png/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export as jpg/i })).toBeInTheDocument();
  });

  it('should handle export error gracefully', async () => {
    const user = userEvent.setup();
    mockOnExport.mockRejectedValue(new Error('Export failed'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<ExportButton creditsRemaining={5} hasData={true} onExport={mockOnExport} />);

    const pngButton = screen.getByRole('button', { name: /export as png/i });
    await user.click(pngButton);

    // Wait for error to be handled
    await expect(await screen.queryByText(/exporting/i)).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
