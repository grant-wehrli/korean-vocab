import { useState } from 'react';

export default function AuthView({ auth, onGuest }) {
  const [tab, setTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (tab === 'signin') {
      const err = await auth.signIn(email, password);
      if (err) setError(err.message);
    } else {
      const err = await auth.signUp(email, password);
      if (err) setError(err.message);
      else setMessage('Check your email to confirm your account.');
    }

    setLoading(false);
  }

  async function handleGoogle() {
    setError('');
    const err = await auth.signInWithGoogle();
    if (err) setError(err.message);
  }

  const tabStyle = (active) => ({
    flex: 1,
    padding: '10px 0',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
    color: active ? 'var(--text)' : 'var(--text3)',
    fontSize: '0.88rem',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    transition: 'color 0.15s, border-color 0.15s',
  });

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '0 24px',
    }}>
      <div className="anim-fade-up" style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          fontSize: '2.4rem',
          fontFamily: "'Noto Sans KR', sans-serif",
          fontWeight: 700,
          color: 'var(--text)',
          lineHeight: 1,
        }}>한국어</div>
        <div className="display" style={{
          fontSize: '0.78rem',
          letterSpacing: '0.18em',
          color: 'var(--accent)',
          marginTop: 6,
          textTransform: 'uppercase',
        }}>Vocabulary Trainer</div>
      </div>

      <div className="anim-fade-up card" style={{ padding: '0 0 24px' }}>
        {/* Tab toggle */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
          <button style={tabStyle(tab === 'signin')} onClick={() => { setTab('signin'); setError(''); setMessage(''); }}>
            Sign in
          </button>
          <button style={tabStyle(tab === 'signup')} onClick={() => { setTab('signup'); setError(''); setMessage(''); }}>
            Create account
          </button>
        </div>

        <div style={{ padding: '0 20px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '13px 14px',
                color: 'var(--text)',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '13px 14px',
                color: 'var(--text)',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />

            {error && (
              <div style={{ fontSize: '0.82rem', color: 'var(--red)', textAlign: 'center' }}>
                {error}
              </div>
            )}
            {message && (
              <div style={{ fontSize: '0.82rem', color: 'var(--green)', textAlign: 'center' }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
              style={{ marginTop: 4 }}
            >
              {loading ? '...' : tab === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <button className="btn btn-ghost btn-full" onClick={handleGoogle}>
            Continue with Google
          </button>

          <button
            onClick={onGuest}
            style={{
              width: '100%',
              marginTop: 16,
              background: 'none',
              border: 'none',
              color: 'var(--text3)',
              fontSize: '0.82rem',
              cursor: 'pointer',
              padding: '8px 0',
            }}
          >
            Continue without account
          </button>
        </div>
      </div>
    </div>
  );
}
