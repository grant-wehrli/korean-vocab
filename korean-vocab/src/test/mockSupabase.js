import { vi } from 'vitest';

// Reusable mock for @supabase/supabase-js and src/lib/supabase.
// Import this file in tests that render components importing supabase.

export const mockFrom = vi.fn(() => ({
  select: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnValue({ then: vi.fn() }),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockResolvedValue({ data: null }),
}));

export const mockAuth = {
  getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
  onAuthStateChange: vi.fn().mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  }),
  signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
  signUp: vi.fn().mockResolvedValue({ error: null }),
  signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
};

export const mockSupabase = {
  auth: mockAuth,
  from: mockFrom,
};
