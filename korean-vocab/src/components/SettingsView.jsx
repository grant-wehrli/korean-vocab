import { useState } from 'react';

const MODES = [
  { id: 'recall', label: 'Recall', desc: 'See Korean → type English' },
  { id: 'mcq', label: 'Multiple Choice', desc: 'See Korean → pick English' },
  { id: 'reverse', label: 'Reverse', desc: 'See English → type Korean' },
];

export default function SettingsView({ auth, defaultMode, onModeChange, onBack }) {
  const [mode, setMode] = useState(defaultMode || 'recall');
  const [saved, setSaved] = useState(false);

  function handleModeSelect(id) {
    setMode(id);
    onModeChange(id);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px 24px 0' }}>
        <button
          className="btn btn-ghost"
          onClick={onBack}
          style={{ padding: '8px 12px', fontSize: '0.8rem', marginBottom: 20 }}
        >
          ← back
        </button>
        <h2 className="display" style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>Settings</h2>
        <p style={{ fontSize: '0.78rem', color: 'var(--text3)', marginBottom: 24 }}>
          {auth.user?.email}
        </p>
      </div>

      <div className="container">
        <div style={{ fontSize: '0.72rem', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 10, textTransform: 'uppercase' }}>
          Default quiz mode
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => handleModeSelect(m.id)}
              style={{
                padding: '12px 16px',
                background: mode === m.id ? 'rgba(0,199,190,0.12)' : 'var(--surface)',
                border: `1px solid ${mode === m.id ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
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

        {saved && (
          <div style={{ fontSize: '0.78rem', color: 'var(--green)', textAlign: 'center', marginBottom: 20 }}>
            Saved
          </div>
        )}

        <button
          className="btn btn-ghost btn-full"
          style={{ fontSize: '0.85rem' }}
          onClick={async () => { onBack(); await auth.signOut(); }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
