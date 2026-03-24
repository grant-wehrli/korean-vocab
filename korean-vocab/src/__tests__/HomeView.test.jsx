import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HomeView from '../components/HomeView';
import { BUILTIN_VOCAB } from '../data/vocab';

function makeStore(overrides = {}) {
  return {
    getStats: () => ({ total: 0, due: 0, mature: 0, young: 0, hardest: [] }),
    cards: {},
    customSets: {},
    ...overrides,
  };
}

describe('HomeView', () => {
  const allSets = BUILTIN_VOCAB;

  it('renders the app title', () => {
    render(
      <HomeView
        store={makeStore()}
        allSets={allSets}
        onStudy={vi.fn()}
        onStats={vi.fn()}
        onImport={vi.fn()}
      />
    );
    expect(screen.getByText('한국어')).toBeInTheDocument();
    expect(screen.getByText('Vocabulary Trainer')).toBeInTheDocument();
  });

  it('shows total word count', () => {
    const total = Object.values(allSets).reduce((s, w) => s + w.length, 0);
    render(
      <HomeView
        store={makeStore()}
        allSets={allSets}
        onStudy={vi.fn()}
        onStats={vi.fn()}
        onImport={vi.fn()}
      />
    );
    expect(screen.getByText(String(total))).toBeInTheDocument();
  });

  it('shows "due now" stat', () => {
    const store = makeStore({ getStats: () => ({ total: 5, due: 3, mature: 1, young: 2, hardest: [] }) });
    render(
      <HomeView store={store} allSets={allSets} onStudy={vi.fn()} onStats={vi.fn()} onImport={vi.fn()} />
    );
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('does not show mastery bar when total is 0', () => {
    render(
      <HomeView store={makeStore()} allSets={allSets} onStudy={vi.fn()} onStats={vi.fn()} onImport={vi.fn()} />
    );
    expect(screen.queryByText('mastery')).not.toBeInTheDocument();
  });

  it('shows mastery bar when total > 0', () => {
    const store = makeStore({ getStats: () => ({ total: 10, due: 2, mature: 3, young: 5, hardest: [] }) });
    render(
      <HomeView store={store} allSets={allSets} onStudy={vi.fn()} onStats={vi.fn()} onImport={vi.fn()} />
    );
    expect(screen.getByText('mastery')).toBeInTheDocument();
  });

  it('lists all available sets', () => {
    render(
      <HomeView store={makeStore()} allSets={allSets} onStudy={vi.fn()} onStats={vi.fn()} onImport={vi.fn()} />
    );
    Object.keys(allSets).forEach(name => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  it('calls onStudy when Study button is clicked', () => {
    const onStudy = vi.fn();
    render(
      <HomeView store={makeStore()} allSets={allSets} onStudy={onStudy} onStats={vi.fn()} onImport={vi.fn()} />
    );
    fireEvent.click(screen.getByRole('button', { name: /study/i }));
    expect(onStudy).toHaveBeenCalledOnce();
  });

  it('calls onStats when Stats button is clicked', () => {
    const onStats = vi.fn();
    render(
      <HomeView store={makeStore()} allSets={allSets} onStudy={vi.fn()} onStats={onStats} onImport={vi.fn()} />
    );
    fireEvent.click(screen.getByRole('button', { name: /stats/i }));
    expect(onStats).toHaveBeenCalledOnce();
  });

  it('calls onImport when Import button is clicked', () => {
    const onImport = vi.fn();
    render(
      <HomeView store={makeStore()} allSets={allSets} onStudy={vi.fn()} onStats={vi.fn()} onImport={onImport} />
    );
    fireEvent.click(screen.getByRole('button', { name: /import/i }));
    expect(onImport).toHaveBeenCalledOnce();
  });

  it('shows due count in Study button when due > 0', () => {
    const store = makeStore({ getStats: () => ({ total: 5, due: 7, mature: 0, young: 3, hardest: [] }) });
    render(
      <HomeView store={store} allSets={allSets} onStudy={vi.fn()} onStats={vi.fn()} onImport={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: /study \(7 due\)/i })).toBeInTheDocument();
  });

  it('shows "custom" tag for custom sets', () => {
    const customSets = { ...allSets, 'My Custom Set': [{ kr: '테스트', rom: 'teseuteu', en: 'test' }] };
    render(
      <HomeView store={makeStore()} allSets={customSets} onStudy={vi.fn()} onStats={vi.fn()} onImport={vi.fn()} />
    );
    expect(screen.getByText('custom')).toBeInTheDocument();
  });
});
