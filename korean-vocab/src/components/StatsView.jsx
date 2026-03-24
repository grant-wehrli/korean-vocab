import { useMemo } from 'react';

export default function StatsView({ store, onBack }) {
  const stats = useMemo(() => store.getStats(), [store]);

  const statRows = [
    { label: 'Total tracked', value: stats.total, color: 'var(--text)' },
    { label: 'Due today', value: stats.due, color: stats.due > 0 ? 'var(--yellow)' : 'var(--green)' },
    { label: 'Mature (21d+)', value: stats.mature, color: 'var(--green)' },
    { label: 'Young', value: stats.young, color: 'var(--accent)' },
    { label: 'Unseen', value: stats.total - stats.mature - stats.young, color: 'var(--text3)' },
  ];

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px 24px 0' }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ padding: '8px 12px', fontSize: '0.8rem', marginBottom: 20 }}>
          ← back
        </button>
        <h2 className="display" style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>Stats</h2>
        <p style={{ fontSize: '0.78rem', color: 'var(--text3)', marginBottom: 24 }}>Your learning progress</p>
      </div>

      <div className="container">
        {stats.total === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: '0.88rem', color: 'var(--text3)' }}>No study data yet.</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginTop: 6 }}>Complete a session to see stats.</div>
          </div>
        ) : (
          <>
            {/* Summary numbers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 24 }}>
              {statRows.map(row => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 0',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>{row.label}</span>
                  <span style={{ fontSize: '1.1rem', fontFamily: "'Syne', sans-serif", fontWeight: 700, color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Ease factor distribution */}
            {stats.hardest.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: '0.72rem', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 12, textTransform: 'uppercase' }}>
                  Hardest Cards
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {stats.hardest.map(c => (
                    <div key={c.kr} className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '1.1rem', fontFamily: "'Noto Sans KR', sans-serif" }}>{c.kr}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 2 }}>{c.en}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--red)' }}>EF {c.ef}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 2 }}>next: {c.nextReview}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
