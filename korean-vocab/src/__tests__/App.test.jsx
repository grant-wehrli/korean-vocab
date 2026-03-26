import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

// Mock Supabase so createClient doesn't throw and sync calls are no-ops
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnValue({ then: vi.fn() }),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    })),
  },
}));

// Mock useAuth to skip async session load (returns no user, not loading)
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    loading: false,
    signIn: vi.fn().mockResolvedValue(null),
    signUp: vi.fn().mockResolvedValue(null),
    signInWithGoogle: vi.fn().mockResolvedValue(null),
    signOut: vi.fn().mockResolvedValue(null),
  })),
}));

// Mock Supabase data helpers used in App's useEffect
vi.mock('../hooks/useVocabStore', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    loadFromSupabase: vi.fn().mockResolvedValue({ cards: {}, customSets: {} }),
    migrateGuestData: vi.fn().mockResolvedValue(),
  };
});

// Helper: render App and skip auth screen (guest mode)
function renderApp() {
  render(<App />);
  fireEvent.click(screen.getByText('Continue without account'));
}

describe('App', () => {
  it('renders AuthView by default (no user)', () => {
    render(<App />);
    expect(screen.getByText('Continue without account')).toBeInTheDocument();
  });

  it('renders HomeView after choosing guest mode', () => {
    renderApp();
    expect(screen.getByText('단어')).toBeInTheDocument();
  });

  it('navigates to StatsView when Stats button is clicked', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /stats/i }));
    expect(screen.getByText('Stats')).toBeInTheDocument();
  });

  it('navigates to ImportView when Import button is clicked', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /import/i }));
    expect(screen.getByText('Import')).toBeInTheDocument();
  });

  it('navigates back to HomeView from StatsView', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /stats/i }));
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByText('단어')).toBeInTheDocument();
  });

  it('navigates back to HomeView from ImportView', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /import/i }));
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByText('단어')).toBeInTheDocument();
  });

  it('startSession transitions to StudyView; endSession returns to HomeView', () => {
    renderApp();
    // Select a set first (sets are deselected by default)
    fireEvent.click(screen.getAllByRole('button').find(b => b.textContent.includes('Greetings')));
    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    // StudyView should be visible (shows counter like "1/N")
    expect(screen.getByText(/\d+\/\d+/)).toBeInTheDocument();
    // Exit the study session — calls endSession
    fireEvent.click(screen.getByRole('button', { name: /✕/i }));
    expect(screen.getByText('단어')).toBeInTheDocument();
  });
});
