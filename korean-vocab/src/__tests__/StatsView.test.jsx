import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StatsView from '../components/StatsView';

function makeStore(statsOverrides = {}) {
  return {
    getStats: () => ({
      total: 0,
      due: 0,
      mature: 0,
      young: 0,
      hardest: [],
      ...statsOverrides,
    }),
  };
}

describe('StatsView', () => {
  it('shows empty state message when no cards tracked', () => {
    render(<StatsView store={makeStore()} onBack={vi.fn()} />);
    expect(screen.getByText('No study data yet.')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn();
    render(<StatsView store={makeStore()} onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('shows stat rows when total > 0', () => {
    const store = makeStore({ total: 10, due: 3, mature: 4, young: 5 });
    render(<StatsView store={store} onBack={vi.fn()} />);
    expect(screen.getByText('Total tracked')).toBeInTheDocument();
    expect(screen.getByText('Due today')).toBeInTheDocument();
    expect(screen.getByText('Mature (21d+)')).toBeInTheDocument();
    expect(screen.getByText('Young')).toBeInTheDocument();
    expect(screen.getByText('Unseen')).toBeInTheDocument();
  });

  it('shows correct stat values', () => {
    const store = makeStore({ total: 10, due: 3, mature: 4, young: 5 });
    render(<StatsView store={store} onBack={vi.fn()} />);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows hardest cards section when hardest.length > 0', () => {
    const hardest = [
      { kr: '어렵다', en: 'difficult', ef: 1.3, nextReview: '2026-03-25' },
    ];
    const store = makeStore({ total: 5, hardest });
    render(<StatsView store={store} onBack={vi.fn()} />);
    expect(screen.getByText('Hardest Cards')).toBeInTheDocument();
    expect(screen.getByText('어렵다')).toBeInTheDocument();
    expect(screen.getByText('EF 1.3')).toBeInTheDocument();
  });

  it('does not show hardest cards section when no cards', () => {
    render(<StatsView store={makeStore({ total: 5, hardest: [] })} onBack={vi.fn()} />);
    expect(screen.queryByText('Hardest Cards')).not.toBeInTheDocument();
  });
});
