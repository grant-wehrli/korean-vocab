import { useState, useEffect } from 'react';
import { useSpeech } from '../hooks/useSpeech';

export default function LearnView({ words, onDone }) {
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const { speak } = useSpeech();

  const card = words[idx];

  useEffect(() => {
    if (card) speak(card.kr);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  function handleNext() {
    if (idx < words.length - 1) {
      setIdx(idx + 1);
    } else {
      setDone(true);
    }
  }

  function handleBack() {
    if (idx > 0) setIdx(idx - 1);
  }

  if (done) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', gap: 24, textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }}>🎉</div>
        <div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
            You've seen all {words.length} words!
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>
            Ready to test yourself?
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
          <button
            className="btn btn-primary btn-full btn-lg"
            onClick={() => onDone({ studyNow: true })}
          >
            Study now →
          </button>
          <button
            className="btn btn-ghost btn-full"
            onClick={() => onDone({ studyNow: false })}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
        <button
          onClick={() => onDone({ studyNow: false })}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: '1.1rem', padding: '4px 8px' }}
          aria-label="exit"
        >
          ✕
        </button>
        <span style={{ fontSize: '0.85rem', color: 'var(--text3)', fontWeight: 500 }}>
          {idx + 1} / {words.length}
        </span>
        <div style={{ width: 40 }} />
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: 'var(--border)', margin: '0 20px' }}>
        <div style={{
          height: '100%',
          width: `${((idx + 1) / words.length) * 100}%`,
          background: 'var(--accent)',
          borderRadius: 2,
          transition: 'width 0.2s',
        }} />
      </div>

      {/* Card */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', gap: 12, textAlign: 'center' }}>
        <div style={{ fontSize: '2.8rem', fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
          {card.kr}
        </div>
        <div style={{ fontSize: '1rem', color: 'var(--text3)', letterSpacing: '0.02em' }}>
          {card.rom}
        </div>
        <div style={{ fontSize: '1.25rem', color: 'var(--text2)', marginTop: 8, fontWeight: 500 }}>
          {card.en}
        </div>
        <button
          onClick={() => speak(card.kr)}
          style={{ marginTop: 16, background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text3)', fontSize: '1rem', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 6 }}
          aria-label="pronounce"
        >
          ♪ Pronounce
        </button>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 12, padding: '16px 24px 32px' }}>
        <button
          className="btn btn-ghost"
          style={{ flex: 1 }}
          onClick={handleBack}
          disabled={idx === 0}
        >
          ← Back
        </button>
        <button
          className="btn btn-primary"
          style={{ flex: 2 }}
          onClick={handleNext}
        >
          {idx === words.length - 1 ? 'Done ✓' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
