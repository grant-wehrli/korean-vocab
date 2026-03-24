import { useState, useMemo } from 'react';
import { BUILTIN_VOCAB } from '../data/vocab';

const MODES = [
  { id: 'recall', label: 'Recall', desc: 'See Korean → type English' },
  { id: 'mcq', label: 'Multiple Choice', desc: 'See Korean → pick English' },
  { id: 'reverse', label: 'Reverse', desc: 'See English → type Korean' },
];

export default function SelectSetsView({ allSets, store, onStart, onBack }) {
  const [selected, setSelected] = useState(new Set());
  const [mode, setMode] = useState('recall');
  const [forceAll, setForceAll] = useState(false);

  const toggle = (name) => setSelected(prev => {
    const next = new Set(prev);
    next.has(name) ? next.delete(name) : next.add(name);
    return next;
  });

  const selectedWords = useMemo(() =>
    [...selected].flatMap(name => allSets[name] || []),
    [selected, allSets]);

  const dueCount = useMemo(() =>
    forceAll ? selectedWords.length : store.getDueCards(selectedWords).length,
    [selectedWords, store, forceAll]);

  function handleStart() {
    if (selectedWords.length === 0) return;
    onStart({ words: selectedWords, mode, forceAll });
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px 24px 0' }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ padding: '8px 12px', fontSize: '0.8rem', marginBottom: 20 }}>
          ← back
        </button>
        <h2 className="display" style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>Select Sets</h2>
        <p style={{ fontSize: '0.78rem', color: 'var(--text3)', marginBottom: 20 }}>Choose what to study</p>
      </div>

      <div className="container" style={{ flex: 1 }}>
        {/* Set selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
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
                  padding: '14px 16px',
                  background: isSelected ? 'rgba(124,106,255,0.12)' : 'var(--surface)',
                  border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 20, height: 20,
                    borderRadius: 5,
                    border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border2)'}`,
                    background: isSelected ? 'var(--accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', color: '#fff', flexShrink: 0,
                    transition: 'all 0.15s',
                  }}>
                    {isSelected && '✓'}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text)' }}>{name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 1 }}>
                      {words.length} words · {due} due
                    </div>
                  </div>
                </div>
                {isCustom && <span className="tag tag-yellow">custom</span>}
              </button>
            );
          })}
        </div>

        {/* Mode selection */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '0.72rem', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 10, textTransform: 'uppercase' }}>Mode</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {MODES.map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                style={{
                  padding: '12px 16px',
                  background: mode === m.id ? 'rgba(124,106,255,0.12)' : 'var(--surface)',
                  border: `1px solid ${mode === m.id ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text)', fontFamily: "'DM Mono', monospace" }}>{m.label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 2 }}>{m.desc}</div>
                </div>
                {mode === m.id && <span style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>●</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Force all option */}
        <button
          onClick={() => setForceAll(p => !p)}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: forceAll ? 'rgba(255,209,102,0.08)' : 'var(--surface)',
            border: `1px solid ${forceAll ? 'var(--yellow)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 20,
            transition: 'all 0.15s',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--text)', fontFamily: "'DM Mono', monospace" }}>Study all cards</span>
          <span style={{ fontSize: '0.78rem', color: forceAll ? 'var(--yellow)' : 'var(--text3)' }}>
            {forceAll ? 'on' : 'off — due only'}
          </span>
        </button>

        {/* Start */}
        <button
          className="btn btn-primary btn-full btn-lg"
          onClick={handleStart}
          disabled={selected.size === 0 || dueCount === 0}
          style={{ marginBottom: 32, opacity: (selected.size === 0 || dueCount === 0) ? 0.4 : 1 }}
        >
          {selected.size === 0
            ? 'Select a set'
            : dueCount === 0
            ? 'No cards due'
            : `Start — ${dueCount} card${dueCount !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}
