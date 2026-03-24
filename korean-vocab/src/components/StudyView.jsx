import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { shuffle, buildQueue, flexMatch } from '../utils/quizHelpers';

// ── Sub-components ────────────────────────────────────────────────────────────

function RecallQuiz({ card, onResult }) {
  const [answer, setAnswer] = useState('');
  const [phase, setPhase] = useState('input'); // input | correct | wrong
  const [animKey, setAnimKey] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    setAnswer('');
    setPhase('input');
    setAnimKey(k => k + 1);
  }, [card.kr]);

  function submit() {
    if (!answer.trim()) return;
    const ok = flexMatch(answer, card.en);
    setPhase(ok ? 'correct' : 'wrong');
    setAnimKey(k => k + 1);
  }

  function handleKey(e) {
    if (e.key === 'Enter' && phase === 'input') submit();
  }

  return (
    <div>
      <div key={`kr-${animKey}`} className="anim-pop" style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{
          fontSize: 'var(--korean-size)',
          fontFamily: "'Noto Sans KR', sans-serif",
          fontWeight: 700,
          color: 'var(--text)',
          lineHeight: 1.1,
        }}>{card.kr}</div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text3)', marginTop: 8, fontStyle: 'italic' }}>
          {card.rom}
        </div>
      </div>

      {phase === 'input' && (
        <div className="anim-fade-up" style={{ marginTop: 32 }}>
          <input
            ref={inputRef}
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={handleKey}
            placeholder="English meaning..."
            style={{
              width: '100%',
              padding: '14px 16px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text)',
              fontFamily: "'DM Mono', monospace",
              fontSize: '16px',
              outline: 'none',
              transition: 'border-color 0.15s',
              marginBottom: 12,
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <button className="btn btn-primary btn-full" onClick={submit} disabled={!answer.trim()}>
            Check
          </button>
        </div>
      )}

      {phase === 'correct' && (
        <div key={`correct-${animKey}`} className="anim-pop" style={{ marginTop: 32 }}>
          <div style={{
            background: 'rgba(61,220,151,0.08)',
            border: '1px solid rgba(61,220,151,0.3)',
            borderRadius: 'var(--radius)',
            padding: '16px',
            marginBottom: 16,
          }}>
            <div style={{ color: 'var(--green)', fontSize: '0.78rem', marginBottom: 4 }}>✓ Correct</div>
            <div style={{ color: 'var(--text)', fontSize: '0.92rem' }}>{card.en}</div>
          </div>
          <div style={{ marginBottom: 8, fontSize: '0.78rem', color: 'var(--text3)' }}>How confident were you?</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {[
              { q: 3, label: 'Guessed', color: 'var(--yellow)' },
              { q: 4, label: 'Knew it', color: 'var(--green)' },
              { q: 5, label: 'Instant', color: 'var(--accent)' },
            ].map(({ q, label, color }) => (
              <button
                key={q}
                className="btn"
                onClick={() => onResult(q)}
                style={{ border: `1px solid ${color}`, color, background: 'transparent', fontFamily: "'DM Mono', monospace" }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'wrong' && (
        <div key={`wrong-${animKey}`} className="anim-shake" style={{ marginTop: 32 }}>
          <div style={{
            background: 'rgba(255,77,106,0.08)',
            border: '1px solid rgba(255,77,106,0.3)',
            borderRadius: 'var(--radius)',
            padding: '16px',
            marginBottom: 16,
          }}>
            <div style={{ color: 'var(--red)', fontSize: '0.78rem', marginBottom: 4 }}>✗ Incorrect</div>
            <div style={{ color: 'var(--text2)', fontSize: '0.82rem', marginBottom: 6 }}>
              You: <span style={{ color: 'var(--text)' }}>{answer}</span>
            </div>
            <div style={{ color: 'var(--text2)', fontSize: '0.82rem' }}>
              Answer: <span style={{ color: 'var(--text)' }}>{card.en}</span>
            </div>
          </div>
          <div style={{ marginBottom: 8, fontSize: '0.78rem', color: 'var(--text3)' }}>How close were you?</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {[
              { q: 0, label: 'Blank', color: 'var(--red)' },
              { q: 1, label: 'Way off', color: 'var(--red)' },
              { q: 2, label: 'Close', color: 'var(--yellow)' },
            ].map(({ q, label, color }) => (
              <button
                key={q}
                className="btn"
                onClick={() => onResult(q)}
                style={{ border: `1px solid ${color}`, color, background: 'transparent', fontFamily: "'DM Mono', monospace" }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MCQQuiz({ card, allCards, onResult }) {
  const [chosen, setChosen] = useState(null);
  const [animKey, setAnimKey] = useState(0);

  const choices = useMemo(() => {
    const others = allCards.filter(c => c.en !== card.en).map(c => c.en);
    const shuffledOthers = shuffle(others).slice(0, 3);
    return shuffle([...shuffledOthers, card.en]);
  }, [card.kr, allCards]);

  useEffect(() => {
    setChosen(null);
    setAnimKey(k => k + 1);
  }, [card.kr]);

  function pick(en) {
    if (chosen !== null) return;
    setChosen(en);
    setTimeout(() => onResult(en === card.en ? 4 : 1), 900);
  }

  return (
    <div>
      <div key={`kr-${animKey}`} className="anim-pop" style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{
          fontSize: 'var(--korean-size)',
          fontFamily: "'Noto Sans KR', sans-serif",
          fontWeight: 700,
          color: 'var(--text)',
        }}>{card.kr}</div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text3)', marginTop: 8, fontStyle: 'italic' }}>{card.rom}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 32 }}>
        {choices.map((en, i) => {
          const isCorrect = en === card.en;
          const isChosen = en === chosen;
          let bg = 'var(--surface)';
          let borderColor = 'var(--border)';
          let textColor = 'var(--text)';

          if (chosen !== null) {
            if (isCorrect) { bg = 'rgba(61,220,151,0.1)'; borderColor = 'var(--green)'; textColor = 'var(--green)'; }
            else if (isChosen) { bg = 'rgba(255,77,106,0.1)'; borderColor = 'var(--red)'; textColor = 'var(--red)'; }
          }

          return (
            <button
              key={i}
              onClick={() => pick(en)}
              style={{
                padding: '14px 16px',
                minHeight: 52,
                background: bg,
                border: `1px solid ${borderColor}`,
                borderRadius: 'var(--radius-sm)',
                color: textColor,
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.88rem',
                textAlign: 'left',
                cursor: chosen !== null ? 'default' : 'pointer',
                transition: 'background 0.18s ease, border-color 0.18s ease, color 0.18s ease',
                touchAction: 'manipulation',
                userSelect: 'none',
              }}
            >
              {en}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ReverseQuiz({ card, onResult }) {
  const [answer, setAnswer] = useState('');
  const [phase, setPhase] = useState('input');
  const [animKey, setAnimKey] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    setAnswer('');
    setPhase('input');
    setAnimKey(k => k + 1);
  }, [card.kr]);

  function submit() {
    if (!answer.trim()) return;
    const a = answer.trim().toLowerCase();
    const ok = a === card.kr || a === card.rom.toLowerCase();
    setPhase(ok ? 'correct' : 'wrong');
    setAnimKey(k => k + 1);
  }

  return (
    <div>
      <div key={`en-${animKey}`} className="anim-pop" style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{
          fontSize: 'clamp(1.4rem, 6vw, 2rem)',
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          color: 'var(--yellow)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>{card.en}</div>
      </div>

      {phase === 'input' && (
        <div className="anim-fade-up" style={{ marginTop: 32 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginBottom: 8 }}>Korean or romanization</div>
          <input
            ref={inputRef}
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="한국어 or romanization..."
            style={{
              width: '100%',
              padding: '14px 16px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text)',
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: '16px',
              outline: 'none',
              marginBottom: 12,
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <button className="btn btn-primary btn-full" onClick={submit} disabled={!answer.trim()}>Check</button>
        </div>
      )}

      {(phase === 'correct' || phase === 'wrong') && (
        <div key={`result-${animKey}`} className={phase === 'correct' ? 'anim-pop' : 'anim-shake'} style={{ marginTop: 32 }}>
          <div style={{
            background: phase === 'correct' ? 'rgba(61,220,151,0.08)' : 'rgba(255,77,106,0.08)',
            border: `1px solid ${phase === 'correct' ? 'rgba(61,220,151,0.3)' : 'rgba(255,77,106,0.3)'}`,
            borderRadius: 'var(--radius)',
            padding: '16px',
            marginBottom: 16,
          }}>
            <div style={{ color: phase === 'correct' ? 'var(--green)' : 'var(--red)', fontSize: '0.78rem', marginBottom: 8 }}>
              {phase === 'correct' ? '✓ Correct' : '✗ Incorrect'}
            </div>
            <div style={{ fontSize: '1.6rem', fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 700 }}>{card.kr}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text3)', marginTop: 4, fontStyle: 'italic' }}>{card.rom}</div>
          </div>
          <button className="btn btn-primary btn-full" onClick={() => onResult(phase === 'correct' ? 4 : 1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main StudyView ────────────────────────────────────────────────────────────

export default function StudyView({ config, store, allSets, onDone }) {
  const { words, mode, forceAll } = config;
  const [queue, setQueue] = useState(() => {
    if (forceAll) {
      store.forceAllDue(words);
    }
    return buildQueue(words, store, forceAll);
  });
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState({ correct: 0, wrong: 0 });
  const [done, setDone] = useState(false);
  const [cardKey, setCardKey] = useState(0);

  const card = queue[idx];
  const allCards = useMemo(() =>
    Object.values(store.cards).length >= 4
      ? Object.values(store.cards)
      : words.map(w => ({ kr: w.kr, rom: w.rom, en: w.en })),
    [store.cards, words]);

  function handleResult(quality) {
    store.reviewCard(card.kr, quality);
    if (quality >= 3) setResults(r => ({ ...r, correct: r.correct + 1 }));
    else setResults(r => ({ ...r, wrong: r.wrong + 1 }));

    if (idx + 1 >= queue.length) {
      setDone(true);
    } else {
      setIdx(i => i + 1);
      setCardKey(k => k + 1);
    }
  }

  if (done) {
    const total = results.correct + results.wrong;
    const pct = Math.round((results.correct / total) * 100);
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="anim-pop" style={{ textAlign: 'center', maxWidth: 360, width: '100%' }}>
          <div style={{
            fontSize: '5rem',
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            color: pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--yellow)' : 'var(--red)',
            lineHeight: 1,
          }}>{pct}%</div>
          <div style={{ color: 'var(--text3)', fontSize: '0.82rem', marginTop: 8, marginBottom: 32 }}>
            {results.correct} / {total} correct
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div className="card" style={{ textAlign: 'center', padding: '12px' }}>
              <div style={{ fontSize: '1.6rem', color: 'var(--green)', fontFamily: "'Syne',sans-serif", fontWeight: 700 }}>{results.correct}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>correct</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '12px' }}>
              <div style={{ fontSize: '1.6rem', color: 'var(--red)', fontFamily: "'Syne',sans-serif", fontWeight: 700 }}>{results.wrong}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>missed</div>
            </div>
          </div>
          <button className="btn btn-primary btn-full btn-lg" onClick={onDone}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          className="btn btn-ghost"
          onClick={onDone}
          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
        >✕</button>

        <div style={{ flex: 1, margin: '0 16px' }}>
          <div style={{ height: 3, background: 'var(--surface2)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(idx / queue.length) * 100}%`,
              background: 'var(--accent)',
              borderRadius: 999,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>

        <span style={{ fontSize: '0.78rem', color: 'var(--text3)', minWidth: 40, textAlign: 'right' }}>
          {idx + 1}/{queue.length}
        </span>
      </div>

      {/* Mode badge */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <span className="tag tag-dim" style={{ fontSize: '0.68rem', letterSpacing: '0.08em' }}>
          {mode === 'recall' ? 'recall' : mode === 'mcq' ? 'multiple choice' : 'reverse'}
        </span>
      </div>

      {/* Quiz card */}
      <div className="container" style={{ flex: 1, paddingTop: 32, paddingBottom: 48 }}>
        <div key={cardKey}>
          {mode === 'recall' && (
            <RecallQuiz card={store.cards[card.kr] || card} onResult={handleResult} />
          )}
          {mode === 'mcq' && (
            <MCQQuiz card={store.cards[card.kr] || card} allCards={allCards} onResult={handleResult} />
          )}
          {mode === 'reverse' && (
            <ReverseQuiz card={store.cards[card.kr] || card} onResult={handleResult} />
          )}
        </div>
      </div>
    </div>
  );
}
