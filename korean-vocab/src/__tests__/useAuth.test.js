import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock supabase before importing useAuth
vi.mock('../lib/supabase', () => {
  const mockUnsubscribe = vi.fn();
  const mockAuth = {
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    }),
    signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn().mockResolvedValue({ error: null }),
    signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  };
  return { supabase: { auth: mockAuth } };
});

import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

beforeEach(() => {
  vi.clearAllMocks();
  supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
  supabase.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
});

describe('useAuth', () => {
  it('starts with loading=true, then loading=false after getSession resolves', async () => {
    const { result } = renderHook(() => useAuth());
    // loading starts true
    expect(result.current.loading).toBe(true);
    // after the async getSession resolves
    await act(async () => {});
    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('sets user from active session on mount', async () => {
    const fakeUser = { id: 'user-1', email: 'test@example.com' };
    supabase.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: fakeUser } },
    });
    const { result } = renderHook(() => useAuth());
    await act(async () => {});
    expect(result.current.user).toEqual(fakeUser);
    expect(result.current.loading).toBe(false);
  });

  it('updates user via onAuthStateChange when sign-in event fires', async () => {
    const fakeUser = { id: 'user-2', email: 'other@example.com' };
    let capturedCallback;
    supabase.auth.onAuthStateChange.mockImplementation((cb) => {
      capturedCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const { result } = renderHook(() => useAuth());
    await act(async () => {});
    expect(result.current.user).toBeNull();

    // Simulate sign-in event from Supabase
    act(() => capturedCallback('SIGNED_IN', { user: fakeUser }));
    expect(result.current.user).toEqual(fakeUser);
  });

  it('clears user via onAuthStateChange when sign-out event fires', async () => {
    const fakeUser = { id: 'user-3', email: 'bye@example.com' };
    supabase.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: fakeUser } },
    });

    let capturedCallback;
    supabase.auth.onAuthStateChange.mockImplementation((cb) => {
      capturedCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const { result } = renderHook(() => useAuth());
    await act(async () => {});
    expect(result.current.user).toEqual(fakeUser);

    act(() => capturedCallback('SIGNED_OUT', null));
    expect(result.current.user).toBeNull();
  });

  it('signIn calls supabase.auth.signInWithPassword', async () => {
    const { result } = renderHook(() => useAuth());
    await act(async () => {});
    await act(async () => {
      await result.current.signIn('a@b.com', 'password');
    });
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'password',
    });
  });

  it('signUp calls supabase.auth.signUp', async () => {
    const { result } = renderHook(() => useAuth());
    await act(async () => {});
    await act(async () => {
      await result.current.signUp('new@user.com', 'secret');
    });
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'new@user.com',
      password: 'secret',
    });
  });

  it('signInWithGoogle calls supabase.auth.signInWithOAuth', async () => {
    const { result } = renderHook(() => useAuth());
    await act(async () => {});
    await act(async () => {
      await result.current.signInWithGoogle();
    });
    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'google' }),
    );
  });

  it('signOut calls supabase.auth.signOut', async () => {
    const { result } = renderHook(() => useAuth());
    await act(async () => {});
    await act(async () => {
      await result.current.signOut();
    });
    expect(supabase.auth.signOut).toHaveBeenCalledOnce();
  });

  it('signIn returns error when Supabase returns error', async () => {
    const fakeError = new Error('Invalid credentials');
    supabase.auth.signInWithPassword.mockResolvedValueOnce({ error: fakeError });
    const { result } = renderHook(() => useAuth());
    await act(async () => {});
    let err;
    await act(async () => { err = await result.current.signIn('bad@bad.com', 'wrong'); });
    expect(err).toBe(fakeError);
  });
});
