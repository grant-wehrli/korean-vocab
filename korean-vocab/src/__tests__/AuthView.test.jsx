import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import AuthView from '../components/AuthView';

function makeAuth(overrides = {}) {
  return {
    signIn: vi.fn().mockResolvedValue(null),
    signUp: vi.fn().mockResolvedValue(null),
    signInWithGoogle: vi.fn().mockResolvedValue(null),
    signOut: vi.fn(),
    user: null,
    loading: false,
    ...overrides,
  };
}

describe('AuthView', () => {
  it('renders the app title', () => {
    render(<AuthView auth={makeAuth()} onGuest={vi.fn()} />);
    expect(screen.getByText('단어')).toBeInTheDocument();
    expect(screen.getByText('Vocabulary Trainer')).toBeInTheDocument();
  });

  it('shows Sign in and Create account tab buttons', () => {
    render(<AuthView auth={makeAuth()} onGuest={vi.fn()} />);
    // Both tab buttons exist
    expect(screen.getAllByText('Sign in').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Create account').length).toBeGreaterThanOrEqual(1);
  });

  it('shows the submit button with Sign in text by default', () => {
    render(<AuthView auth={makeAuth()} onGuest={vi.fn()} />);
    const form = screen.getByPlaceholderText('Email').closest('form');
    expect(within(form).getByRole('button', { name: 'Sign in' })).toHaveAttribute('type', 'submit');
  });

  it('switches to Create account tab and shows create account submit button', () => {
    render(<AuthView auth={makeAuth()} onGuest={vi.fn()} />);
    fireEvent.click(screen.getAllByText('Create account')[0]);
    const form = screen.getByPlaceholderText('Email').closest('form');
    expect(within(form).getByRole('button', { name: 'Create account' })).toHaveAttribute('type', 'submit');
  });

  it('calls auth.signIn on sign-in form submit', async () => {
    const auth = makeAuth();
    render(<AuthView auth={auth} onGuest={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'secret' } });
    fireEvent.submit(screen.getByPlaceholderText('Email').closest('form'));
    await vi.waitFor(() => {
      expect(auth.signIn).toHaveBeenCalledWith('a@b.com', 'secret');
    });
  });

  it('calls auth.signUp on create account form submit', async () => {
    const auth = makeAuth();
    render(<AuthView auth={auth} onGuest={vi.fn()} />);
    fireEvent.click(screen.getAllByText('Create account')[0]);
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'new@user.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass123' } });
    fireEvent.submit(screen.getByPlaceholderText('Email').closest('form'));
    await vi.waitFor(() => {
      expect(auth.signUp).toHaveBeenCalledWith('new@user.com', 'pass123');
    });
  });

  it('shows error message when signIn fails', async () => {
    const auth = makeAuth({ signIn: vi.fn().mockResolvedValue({ message: 'Invalid credentials' }) });
    render(<AuthView auth={auth} onGuest={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'x@y.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'bad' } });
    fireEvent.submit(screen.getByPlaceholderText('Email').closest('form'));
    await vi.waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('shows success message after sign-up', async () => {
    const auth = makeAuth({ signUp: vi.fn().mockResolvedValue(null) });
    render(<AuthView auth={auth} onGuest={vi.fn()} />);
    fireEvent.click(screen.getAllByText('Create account')[0]);
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'new@user.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass123' } });
    fireEvent.submit(screen.getByPlaceholderText('Email').closest('form'));
    await vi.waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
  });

  it('calls auth.signInWithGoogle when Google button clicked', async () => {
    const auth = makeAuth();
    render(<AuthView auth={auth} onGuest={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));
    await vi.waitFor(() => {
      expect(auth.signInWithGoogle).toHaveBeenCalledOnce();
    });
  });

  it('calls onGuest when "Continue without account" is clicked', () => {
    const onGuest = vi.fn();
    render(<AuthView auth={makeAuth()} onGuest={onGuest} />);
    fireEvent.click(screen.getByText('Continue without account'));
    expect(onGuest).toHaveBeenCalledOnce();
  });
});
