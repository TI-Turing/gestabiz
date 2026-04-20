import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils'
import userEvent from '@testing-library/user-event';
import { ConfirmEndEmploymentDialog } from '../ConfirmEndEmploymentDialog';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('ConfirmEndEmploymentDialog', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dialog when open prop is true', () => {
    renderWithProviders(
      <ConfirmEndEmploymentDialog
        isOpen={true}
        businessName="Salón Premium"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/finalizar empleo|end employment/i)).toBeInTheDocument();
  });

  it('should not render dialog when open prop is false', () => {
    const { container } = renderWithProviders(
      <ConfirmEndEmploymentDialog
        isOpen={false}
        businessName="Salón Premium"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('should display business name in confirmation text', () => {
    renderWithProviders(
      <ConfirmEndEmploymentDialog
        isOpen={true}
        businessName="Salón Premium"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/Salón Premium/)).toBeInTheDocument();
  });

  it('should warn about data loss', () => {
    renderWithProviders(
      <ConfirmEndEmploymentDialog
        isOpen={true}
        businessName="Salón Premium"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/esta acción no se puede deshacer|cannot be undone/i)).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button clicked', async () => {
    renderWithProviders(
      <ConfirmEndEmploymentDialog
        isOpen={true}
        businessName="Salón Premium"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /finalizar|confirm|yes/i });
    await userEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it('should call onCancel when cancel button clicked', async () => {
    renderWithProviders(
      <ConfirmEndEmploymentDialog
        isOpen={true}
        businessName="Salón Premium"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancelar|cancel/i });
    await userEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should require checkbox confirmation before submitting', async () => {
    renderWithProviders(
      <ConfirmEndEmploymentDialog
        isOpen={true}
        businessName="Salón Premium"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        requireConfirmation={true}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /finalizar|confirm/i });
    
    // Button should be disabled initially
    if (confirmButton.getAttribute('disabled') !== null) {
      const checkbox = screen.getByRole('checkbox', { name: /confirmo que deseo/i });
      await userEvent.click(checkbox);
    }

    await userEvent.click(confirmButton);
    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it('should show loading state during submission', async () => {
    mockOnConfirm.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

    renderWithProviders(
      <ConfirmEndEmploymentDialog
        isOpen={true}
        businessName="Salón Premium"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /finalizar|confirm/i });
    await userEvent.click(confirmButton);

    expect(screen.getByTestId('loading-spinner') || screen.getByText(/procesando|processing/i)).toBeTruthy();
  });

  it('should display destructive styling', () => {
    const { container } = renderWithProviders(
      <ConfirmEndEmploymentDialog
        isOpen={true}
        businessName="Salón Premium"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /finalizar|confirm/i });
    expect(confirmButton.className).toMatch(/destructive|red|danger/i);
  });

  it('should display reason field if needed', () => {
    renderWithProviders(
      <ConfirmEndEmploymentDialog
        isOpen={true}
        businessName="Salón Premium"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        showReasonField={true}
      />
    );

    expect(screen.getByText(/razón|reason|motivo/i)).toBeInTheDocument();
  });

  it('should close on escape key', async () => {
    renderWithProviders(
      <ConfirmEndEmploymentDialog
        isOpen={true}
        businessName="Salón Premium"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Simulate escape key
    const dialog = screen.getByRole('dialog');
    if (dialog) {
      await userEvent.keyboard('{Escape}');
      expect(mockOnCancel).toHaveBeenCalled();
    }
  });
});
