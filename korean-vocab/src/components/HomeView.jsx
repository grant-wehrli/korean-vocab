import { useState, useMemo } from 'react';
import { BUILTIN_VOCAB } from '../data/vocab';
import AccountButton from './AccountButton';

const MODES = [
  { id: 'recall', label: 'Recall' },
  { id: 'mcq', label: 'MCQ' },
  { id: 'reverse', label: 'Reverse' },
];

export default function HomeView({ store, allSets, auth, onSignIn, onStart, onStats, onImport }) {
  const [selected, setSelected] = useState(() => new Set(Object.keys(allSets)));
  const [mode, setMode] = useState('recall');

  const stats = useMemo(() => store.getStats(), [store]);

  const selectedWords = useMemo(
    () => [...selected].flatMap(name => allSets[name] || []),
    [selected, allSets],
  );

  const dueCount = useMemo(
    () => store.getDueCards(selectedWords).length,
    [selectedWords, store],
  );

  function toggle(name) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  function handleStart() {
    if (selectedWords.length === 0 || dueCount === 0) return;
    onStart({ words: selectedWords, mode, forceAll: false });
  }

  function handleStudyAgain() {
    onStart({ words: selectedWords, mode, forceAll: true });
  }

  const startLabel = selected.size === 0
    ? 'Select a set'
    : dueCount === 0
    ? 'No cards due'
    : `▶  Start — ${dueCount} card${dueCount !== 1 ? 's' : ''}`;

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '32px 24px 16px', textAlign: 'center', position: 'relative' }}>
        {auth && (
          <div style={{ position: 'absolute', top: 16, right: 16 }}>
            <AccountButton auth={auth} onSignIn={onSignIn} />
          </div>
        )}
        <div className="anim-fade-up" style={{ animationDelay: '0ms' }}>
          <div style={{
            fontSize: '2.6rem',
            fontFamily: "'Noto Sans KR', sans-serif",
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--text)',
            lineHeight: 1,
          }}>단어</div>
          <div className="display" style={{
            fontSize: '0.78rem',
            letterSpacing: '0.18em',
            color: 'var(--accent)',
            marginTop: 6,
            textTransform: 'uppercase',
          }}>Vocabulary Trainer</div>
        </div>
      </div>

      {/* Compact stats */}
      <div className="anim-fade-up container" style={{ animationDelay: '60ms', paddingBottom: 0 }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text3)', textAlign: 'center', marginBottom: 20 }}>
          <span style={{ color: stats.due > 0 ? 'var(--yellow)' : 'var(--green)', fontWeight: 600 }}>
            {stats.due} studied
          </span>
          {stats.total > 0 && (
            <>
              <span style={{ margin: '0 8px' }}>·</span>
              <span style={{ color: 'var(--text2)' }}>{stats.mature} / {stats.total} mature</span>
            </>
          )}
        </div>
      </div>

      <div className="container anim-fade-up" style={{ animationDelay: '100ms', flex: 1 }}>
        {/* Set selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {Object.entries(allSets).map(([name, words]) => {
            const isSelected = selected.has(name);
            const isCustom = !(name in BUILTIN_VOCAB);
            const due = store.getDueCards(words).length;
            return (
              <button
                key={name}
                onClick={() => toggle(name)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  background: isSelected ? 'rgba(0,199,190,0.10)' : 'var(--surface)',
                  border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 18, height: 18,
                    borderRadius: 4,
                    border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border2)'}`,
                    background: isSelected ? 'var(--accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', color: '#000', flexShrink: 0,
                    transition: 'all 0.12s',
                  }}>
                    {isSelected && '✓'}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginTop: 1 }}>
                      {words.length}w · {due} studied
                    </div>
                  </div>
                </div>
                {isCustom && <span className="tag tag-yellow">custom</span>}
              </button>
            );
          })}
        </div>

        {/* Mode pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                flex: 1,
                padding: '9px 0',
                background: mode === m.id ? 'rgba(0,199,190,0.12)' : 'var(--surface)',
                border: `1px solid ${mode === m.id ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)',
                color: mode === m.id ? 'var(--accent)' : 'var(--text3)',
                fontSize: '0.78rem',
                fontWeight: mode === m.id ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.12s',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Start */}
        <button
          className="btn btn-primary btn-full btn-lg"
          onClick={handleStart}
          disabled={selected.size === 0 || dueCount === 0}
          style={{ marginBottom: 10, opacity: (selected.size === 0 || dueCount === 0) ? 0.4 : 1 }}
        >
          {startLabel}
        </button>

        {/* Study again */}
        {selectedWords.length > 0 && (
          <button
            className="btn btn-ghost btn-full"
            onClick={handleStudyAgain}
            style={{ marginBottom: 14 }}
          >
            ↺ Study again
          </button>
        )}

        {/* Secondary links */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 32 }}>
          <button className="btn btn-ghost" onClick={onStats}>↗ Stats</button>
          <button className="btn btn-ghost" onClick={onImport}>+ Import</button>
        </div>
      </div>
    </div>
  );
}
