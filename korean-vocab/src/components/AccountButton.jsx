import { useState, useRef, useEffect } from 'react';

export default function AccountButton({ auth, onSignIn, onSettings }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!auth.user) {
    return (
      <button className="btn btn-ghost" onClick={onSignIn} style={{ fontSize: '0.78rem', padding: '6px 12px' }}>
        Sign in
      </button>
    );
  }

  const initial = auth.user.email?.[0]?.toUpperCase() ?? '?';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: 'var(--accent)',
          border: 'none',
          color: '#000',
          fontWeight: 700,
          fontSize: '0.88rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {initial}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 42,
          right: 0,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: 12,
          minWidth: 200,
          zIndex: 100,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text2)', marginBottom: 12, wordBreak: 'break-all' }}>
            {auth.user.email}
          </div>
          <button
            className="btn btn-ghost btn-full"
            style={{ fontSize: '0.82rem', marginBottom: 6 }}
            onClick={() => { setOpen(false); onSettings?.(); }}
          >
            Settings
          </button>
          <button
            className="btn btn-ghost btn-full"
            style={{ fontSize: '0.82rem' }}
            onClick={async () => { setOpen(false); await auth.signOut(); }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
