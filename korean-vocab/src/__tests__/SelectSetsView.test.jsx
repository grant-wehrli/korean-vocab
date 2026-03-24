import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SelectSetsView from '../components/SelectSetsView';

const word1 = { kr: '안녕', rom: 'annyeong', en: 'hello' };
const word2 = { kr: '감사', rom: 'gamsa', en: 'thanks' };

const allSets = {
  Greetings: [word1],
  Numbers: [word2],
};

function makeStore(overrides = {}) {
  return {
    cards: {},
    getDueCards: (words) => words, // all due by default
    ...overrides,
  };
}

describe('SelectSetsView', () => {
  it('renders all set names', () => {
    render(<SelectSetsView allSets={allSets} store={makeStore()} onStart={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Greetings')).toBeInTheDocument();
    expect(screen.getByText('Numbers')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn();
    render(<SelectSetsView allSets={allSets} store={makeStore()} onStart={vi.fn()} onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('Start button is disabled when no set is selected', () => {
    render(<SelectSetsView allSets={allSets} store={makeStore()} onStart={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByRole('button', { name: /select a set/i })).toBeDisabled();
  });

  it('Start button shows due count after selecting a set', () => {
    render(<SelectSetsView allSets={allSets} store={makeStore()} onStart={vi.fn()} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText('Greetings'));
    expect(screen.getByRole('button', { name: /start — 1 card/i })).toBeInTheDocument();
  });

  it('Start button is disabled when selected set has no due cards', () => {
    const store = makeStore({ getDueCards: () => [] });
    render(<SelectSetsView allSets={allSets} store={store} onStart={vi.fn()} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText('Greetings'));
    expect(screen.getByRole('button', { name: /no cards due/i })).toBeDisabled();
  });

  it('selecting a set then clicking again deselects it', () => {
    render(<SelectSetsView allSets={allSets} store={makeStore()} onStart={vi.fn()} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText('Greetings'));
    fireEvent.click(screen.getByText('Greetings'));
    expect(screen.getByRole('button', { name: /select a set/i })).toBeDisabled();
  });

  it('calls onStart with correct config when Start is clicked', () => {
    const onStart = vi.fn();
    render(<SelectSetsView allSets={allSets} store={makeStore()} onStart={onStart} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText('Greetings'));
    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    expect(onStart).toHaveBeenCalledWith({
      words: [word1],
      mode: 'recall',
      forceAll: false,
    });
  });

  it('mode selection changes active mode', () => {
    render(<SelectSetsView allSets={allSets} store={makeStore()} onStart={vi.fn()} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText('Multiple Choice'));
    fireEvent.click(screen.getByText('Greetings'));
    fireEvent.click(screen.getByRole('button', { name: /start/i }));
  });

  it('forceAll toggle changes start count to include all words', () => {
    const store = makeStore({ getDueCards: () => [] }); // no cards due
    render(<SelectSetsView allSets={allSets} store={store} onStart={vi.fn()} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText('Greetings'));
    // Without forceAll: no cards due
    expect(screen.getByRole('button', { name: /no cards due/i })).toBeDisabled();

    fireEvent.click(screen.getByText(/study all cards/i));
    // With forceAll: 1 card available
    expect(screen.getByRole('button', { name: /start — 1 card/i })).not.toBeDisabled();
  });

  it('shows correct plural for multiple cards', () => {
    render(<SelectSetsView allSets={allSets} store={makeStore()} onStart={vi.fn()} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText('Greetings'));
    fireEvent.click(screen.getByText('Numbers'));
    expect(screen.getByRole('button', { name: /start — 2 cards/i })).toBeInTheDocument();
  });
});
