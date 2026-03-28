import { useState, useMemo, useEffect } from 'react';
import { BUILTIN_VOCAB } from '../data/vocab';
import AccountButton from './AccountButton';

const MODES = [
  { id: 'recall', label: 'Recall' },
  { id: 'mcq', label: 'MCQ' },
  { id: 'reverse', label: 'Reverse' },
];

export default function HomeView({ store, allSets, auth, streak, defaultMode, onSignIn, onSettings, onStart, onStats, onLearn }) {
  const [tab, setTab] = useState('study');
  const [selected, setSelected] = useState(() => new Set());
  const [mode, setMode] = useState(defaultMode || 'recall');

  useEffect(() => { setMode(defaultMode || 'recall'); }, [defaultMode]);

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
      {/* Nav bar */}
      <div className="anim-fade-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 8px', animationDelay: '0ms' }}>
        <div style={{ fontSize: '1.3rem', fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>
          단어
        </div>
        {auth && <AccountButton auth={auth} onSignIn={onSignIn} onSettings={onSettings} />}
      </div>

      {/* Tab bar */}
      <div className="anim-fade-up container" style={{ animationDelay: '40ms', paddingBottom: 0, paddingTop: 0 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          {[{ id: 'study', label: 'Study' }, { id: 'learn', label: 'Learn' }].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                padding: '8px 0',
                background: tab === t.id ? 'rgba(0,199,190,0.12)' : 'var(--surface)',
                border: `1px solid ${tab === t.id ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)',
                color: tab === t.id ? 'var(--accent)' : 'var(--text3)',
                fontSize: '0.85rem',
                fontWeight: tab === t.id ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'study' && (
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
            {streak > 0 && (
              <>
                <span style={{ margin: '0 8px' }}>·</span>
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{streak} day streak</span>
              </>
            )}
          </div>
        </div>
      )}

      <div className="container anim-fade-up" style={{ animationDelay: '100ms', flex: 1 }}>
        {tab === 'study' && (
          <>
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
              style={{ marginBottom: 16, opacity: (selected.size === 0 || dueCount === 0) ? 0.4 : 1 }}
            >
              {startLabel}
            </button>
          </>
        )}

        {tab === 'learn' && (
          <button
            className="btn btn-primary btn-full btn-lg"
            onClick={() => onLearn({ words: selectedWords })}
            disabled={selected.size === 0 || selectedWords.length === 0}
            style={{ marginBottom: 16, opacity: (selected.size === 0 || selectedWords.length === 0) ? 0.4 : 1 }}
          >
            {selected.size === 0 ? 'Select a set' : `Start Learning — ${selectedWords.length} word${selectedWords.length !== 1 ? 's' : ''}`}
          </button>
        )}

        {/* Set selection */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
          <button
            onClick={() => setSelected(
              selected.size === Object.keys(allSets).length
                ? new Set()
                : new Set(Object.keys(allSets))
            )}
            style={{ fontSize: '0.75rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}
          >
            {selected.size === Object.keys(allSets).length ? 'Deselect all' : 'Select all'}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {Object.entries(allSets).map(([name, words]) => {
            const isSelected = selected.has(name);
            const isCustom = !(name in BUILTIN_VOCAB);
            const studied = words.filter(w => store.cards[w.kr]).length;
            return (
              <button
                key={name}
                onClick={() => toggle(name)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '9px 12px',
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
                      {words.length} terms · {studied} studied
                    </div>
                  </div>
                </div>
                {isCustom && <span className="tag tag-yellow">custom</span>}
              </button>
            );
          })}
        </div>

        {tab === 'study' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
            {selectedWords.length > 0 && (
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={handleStudyAgain}>↺ Again</button>
            )}
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onStats}>↗ Stats</button>
          </div>
        )}
      </div>
    </div>
  );
}
