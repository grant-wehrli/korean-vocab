import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HomeView from '../components/HomeView';
import { BUILTIN_VOCAB } from '../data/vocab';

const word1 = { kr: '안녕', rom: 'annyeong', en: 'hello' };
const word2 = { kr: '감사', rom: 'gamsa', en: 'thanks' };

const allSets = {
  Transportation: [word1],
  'Work & Office': [word2],
};

function makeStore(overrides = {}) {
  return {
    getStats: () => ({ total: 0, due: 0, mature: 0, young: 0, hardest: [] }),
    cards: {},
    customSets: {},
    getDueCards: (words) => words,  // all cards due by default
    ...overrides,
  };
}

const defaultProps = {
  store: makeStore(),
  allSets,
  onStart: vi.fn(),
  onStats: vi.fn(),
};

describe('HomeView', () => {
  it('renders the app title 단어', () => {
    render(<HomeView {...defaultProps} />);
    expect(screen.getByText('단어')).toBeInTheDocument();
  });

  it('shows all sets deselected by default', () => {
    render(<HomeView {...defaultProps} />);
    // Both sets appear as toggle buttons
    expect(screen.getByText('Transportation')).toBeInTheDocument();
    expect(screen.getByText('Work & Office')).toBeInTheDocument();
    // Start is disabled because nothing is selected
    expect(screen.getByRole('button', { name: /select a set/i })).toBeDisabled();
  });

  it('lists all available sets', () => {
    render(<HomeView {...defaultProps} />);
    Object.keys(allSets).forEach(name => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  it('toggling a set on then off disables Start', () => {
    render(<HomeView {...defaultProps} />);
    fireEvent.click(screen.getByText('Transportation')); // select
    fireEvent.click(screen.getByText('Transportation')); // deselect again
    expect(screen.getByRole('button', { name: /select a set/i })).toBeDisabled();
  });

  it('toggling a set on then off then on re-enables it', () => {
    render(<HomeView {...defaultProps} />);
    fireEvent.click(screen.getByText('Transportation')); // select
    fireEvent.click(screen.getByText('Transportation')); // deselect
    fireEvent.click(screen.getByText('Transportation')); // reselect
    expect(screen.getByRole('button', { name: /start/i })).not.toBeDisabled();
  });

  it('shows "No cards due" when no due cards and forceAll off', () => {
    const store = makeStore({ getDueCards: () => [] });
    render(<HomeView {...defaultProps} store={store} />);
    fireEvent.click(screen.getByText('Transportation')); // select a set
    expect(screen.getByRole('button', { name: /no cards due/i })).toBeDisabled();
  });

  it('mode pills: clicking MCQ switches mode', () => {
    const onStart = vi.fn();
    render(<HomeView {...defaultProps} onStart={onStart} />);
    fireEvent.click(screen.getByText('Transportation')); // select a set
    fireEvent.click(screen.getByRole('button', { name: 'MCQ' }));
    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ mode: 'mcq' }));
  });

  it('mode pills: clicking Reverse switches mode', () => {
    const onStart = vi.fn();
    render(<HomeView {...defaultProps} onStart={onStart} />);
    fireEvent.click(screen.getByText('Transportation')); // select a set
    fireEvent.click(screen.getByRole('button', { name: 'Reverse' }));
    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ mode: 'reverse' }));
  });

  it('default mode is recall', () => {
    const onStart = vi.fn();
    render(<HomeView {...defaultProps} onStart={onStart} />);
    fireEvent.click(screen.getByText('Transportation')); // select a set
    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ mode: 'recall' }));
  });

  it('onStart is called with correct words config', () => {
    const onStart = vi.fn();
    render(<HomeView {...defaultProps} onStart={onStart} />);
    fireEvent.click(screen.getByText('Transportation')); // select set 1
    fireEvent.click(screen.getByText('Work & Office'));   // select set 2
    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    const { words } = onStart.mock.calls[0][0];
    expect(words).toContainEqual(word1);
    expect(words).toContainEqual(word2);
  });

  it('"Again" button starts with forceAll=true', () => {
    const onStart = vi.fn();
    render(<HomeView {...defaultProps} onStart={onStart} />);
    fireEvent.click(screen.getByText('Transportation')); // select a set so Again appears
    fireEvent.click(screen.getByRole('button', { name: /again/i }));
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ forceAll: true }));
  });

  it('calls onStats when Stats button is clicked', () => {
    const onStats = vi.fn();
    render(<HomeView {...defaultProps} onStats={onStats} />);
    fireEvent.click(screen.getByRole('button', { name: /stats/i }));
    expect(onStats).toHaveBeenCalledOnce();
  });

  it('shows due count in stats line', () => {
    const store = makeStore({
      getStats: () => ({ total: 5, due: 3, mature: 2, young: 1, hardest: [] }),
      getDueCards: (words) => words,
    });
    render(<HomeView {...defaultProps} store={store} />);
    expect(screen.getByText('3 studied')).toBeInTheDocument();
  });

  it('shows "custom" tag for custom sets', () => {
    const customSets = { ...allSets, 'My Set': [{ kr: '테스트', rom: 'test', en: 'test' }] };
    render(<HomeView {...defaultProps} allSets={customSets} />);
    expect(screen.getByText('custom')).toBeInTheDocument();
  });

  it('renders AccountButton when auth is provided', () => {
    const auth = { user: { id: '1', email: 'a@b.com' }, loading: false, signOut: vi.fn() };
    render(<HomeView {...defaultProps} auth={auth} onSignIn={vi.fn()} />);
    // AccountButton renders the first letter of the email
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('does not crash when auth is not provided', () => {
    render(<HomeView {...defaultProps} />);
    expect(screen.getByText('단어')).toBeInTheDocument();
  });

  it('shows streak when streak > 0', () => {
    render(<HomeView {...defaultProps} streak={5} />);
    expect(screen.getByText('5 day streak')).toBeInTheDocument();
  });

  describe('Learn tab', () => {
    it('switching to Learn tab shows "Start Learning" button', () => {
      render(<HomeView {...defaultProps} onLearn={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: 'Learn' }));
      fireEvent.click(screen.getByText('Transportation')); // select a set
      expect(screen.getByRole('button', { name: /start learning/i })).toBeInTheDocument();
    });

    it('Learn tab hides mode pills', () => {
      render(<HomeView {...defaultProps} onLearn={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: 'Learn' }));
      expect(screen.queryByRole('button', { name: 'Recall' })).not.toBeInTheDocument();
    });

    it('calls onLearn with selected words when Start Learning is clicked', () => {
      const onLearn = vi.fn();
      render(<HomeView {...defaultProps} onLearn={onLearn} />);
      fireEvent.click(screen.getByRole('button', { name: 'Learn' }));
      fireEvent.click(screen.getByText('Transportation')); // select a set
      fireEvent.click(screen.getByRole('button', { name: /start learning/i }));
      expect(onLearn).toHaveBeenCalledWith(expect.objectContaining({ words: expect.arrayContaining([word1]) }));
    });

    it('Start Learning is disabled when no sets selected', () => {
      render(<HomeView {...defaultProps} onLearn={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: 'Learn' }));
      // Nothing selected by default
      expect(screen.getByRole('button', { name: /select a set/i })).toBeDisabled();
    });
  });
});
