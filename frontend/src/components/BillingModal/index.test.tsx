import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BillingModal from './index';

describe('BillingModal', () => {
  const mockOnClose = vi.fn();
  const mockOnPurchase = vi.fn();

  it('should render when open', () => {
    render(
      <BillingModal
        isOpen={true}
        onClose={mockOnClose}
        onPurchase={mockOnPurchase}
      />
    );

    expect(screen.getByText('Purchase Credits')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <BillingModal
        isOpen={false}
        onClose={mockOnClose}
        onPurchase={mockOnPurchase}
      />
    );

    expect(screen.queryByText('Purchase Credits')).not.toBeInTheDocument();
  });

  it('should display all pricing tiers', () => {
    render(
      <BillingModal
        isOpen={true}
        onClose={mockOnClose}
        onPurchase={mockOnPurchase}
      />
    );

    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('should call onClose when close button clicked', () => {
    render(
      <BillingModal
        isOpen={true}
        onClose={mockOnClose}
        onPurchase={mockOnPurchase}
      />
    );

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onPurchase when tier selected', () => {
    render(
      <BillingModal
        isOpen={true}
        onClose={mockOnClose}
        onPurchase={mockOnPurchase}
      />
    );

    const buttons = screen.getAllByText('Purchase');
    fireEvent.click(buttons[0]);
    expect(mockOnPurchase).toHaveBeenCalledWith(10, 9);
  });
});
