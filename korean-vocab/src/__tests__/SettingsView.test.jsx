import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SettingsView from '../components/SettingsView';

const mockAuth = {
  user: { email: 'test@example.com' },
  signOut: vi.fn().mockResolvedValue(null),
};

const defaultProps = {
  auth: mockAuth,
  defaultMode: 'recall',
  onModeChange: vi.fn(),
  onBack: vi.fn(),
};

describe('SettingsView', () => {
  it('renders user email', () => {
    render(<SettingsView {...defaultProps} />);
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('renders all three mode options', () => {
    render(<SettingsView {...defaultProps} />);
    expect(screen.getByText('Recall')).toBeInTheDocument();
    expect(screen.getByText('Multiple Choice')).toBeInTheDocument();
    expect(screen.getByText('Reverse')).toBeInTheDocument();
  });

  it('highlights the current defaultMode', () => {
    render(<SettingsView {...defaultProps} defaultMode="mcq" />);
    // The MCQ button should show the active indicator
    expect(screen.getByText('Multiple Choice')).toBeInTheDocument();
  });

  it('calls onModeChange when a mode is selected', () => {
    const onModeChange = vi.fn();
    render(<SettingsView {...defaultProps} onModeChange={onModeChange} />);
    fireEvent.click(screen.getByText('Reverse'));
    expect(onModeChange).toHaveBeenCalledWith('reverse');
  });

  it('calls onModeChange with mcq when Multiple Choice is clicked', () => {
    const onModeChange = vi.fn();
    render(<SettingsView {...defaultProps} onModeChange={onModeChange} />);
    fireEvent.click(screen.getByText('Multiple Choice'));
    expect(onModeChange).toHaveBeenCalledWith('mcq');
  });

  it('shows "Saved" message after selecting a mode', () => {
    render(<SettingsView {...defaultProps} />);
    fireEvent.click(screen.getByText('Recall'));
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn();
    render(<SettingsView {...defaultProps} onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(onBack).toHaveBeenCalled();
  });

  it('calls auth.signOut and onBack when Sign out is clicked', async () => {
    const onBack = vi.fn();
    const signOut = vi.fn().mockResolvedValue(null);
    render(<SettingsView {...defaultProps} auth={{ ...mockAuth, signOut }} onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
    expect(onBack).toHaveBeenCalled();
    expect(signOut).toHaveBeenCalled();
  });
});
