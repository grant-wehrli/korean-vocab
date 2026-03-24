import { useMemo } from 'react';
import { BUILTIN_VOCAB } from '../data/vocab';
import AccountButton from './AccountButton';

export default function HomeView({ store, allSets, auth, onSignIn, onStudy, onStats, onImport }) {
  const stats = useMemo(() => store.getStats(), [store]);
  const totalWords = useMemo(() =>
    Object.values(allSets).reduce((s, w) => s + w.length, 0), [allSets]);

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '48px 24px 24px', textAlign: 'center', position: 'relative' }}>
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
          }}>한국어</div>
          <div className="display" style={{
            fontSize: '0.78rem',
            letterSpacing: '0.18em',
            color: 'var(--accent)',
            marginTop: 6,
            textTransform: 'uppercase',
          }}>Vocabulary Trainer</div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="anim-fade-up container" style={{ animationDelay: '80ms', paddingBottom: 8 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          marginBottom: 24,
        }}>
          {[
            { label: 'total', value: totalWords, color: 'var(--text2)' },
            { label: 'tracked', value: stats.total, color: 'var(--accent)' },
            { label: 'due now', value: stats.due, color: stats.due > 0 ? 'var(--yellow)' : 'var(--green)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center', padding: '14px 10px' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color, fontFamily: "'Syne', sans-serif" }}>{s.value}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text3)', letterSpacing: '0.06em', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {stats.total > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>mastery</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text2)' }}>{stats.mature} / {stats.total} mature</span>
            </div>
            <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(stats.mature / Math.max(stats.total, 1)) * 100}%`,
                background: 'linear-gradient(90deg, var(--accent), var(--green))',
                borderRadius: 999,
                animation: 'progressFill 0.8s ease 0.3s both',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Main actions */}
      <div className="container anim-fade-up" style={{ animationDelay: '140ms', flex: 1 }}>
        <button className="btn btn-primary btn-full btn-lg" onClick={onStudy} style={{ marginBottom: 10 }}>
          <span>▶</span>
          <span>{stats.due > 0 ? `Study (${stats.due} due)` : 'Study'}</span>
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          <button className="btn btn-ghost" onClick={onStats}>
            ↗ Stats
          </button>
          <button className="btn btn-ghost" onClick={onImport}>
            + Import
          </button>
        </div>

        {/* Vocab sets overview */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: '0.72rem', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 12, textTransform: 'uppercase' }}>
            Available Sets
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(allSets).map(([name, words]) => {
              const isCustom = !(name in BUILTIN_VOCAB);
              return (
                <div key={name} className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem' }}>{name}</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span className={`tag ${isCustom ? 'tag-yellow' : 'tag-dim'}`}>
                      {isCustom ? 'custom' : 'built-in'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>{words.length}w</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
