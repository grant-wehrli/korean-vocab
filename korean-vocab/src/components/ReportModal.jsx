import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ReportModal({ card, userAnswer, quizMode, onClose }) {
  const [suggestedFix, setSuggestedFix] = useState(userAnswer || '');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | done | error

  async function submit() {
    if (status !== 'idle') return;
    setStatus('sending');

    const { data: { session } } = await supabase.auth.getSession();

    const payload = {
      card_kr: card.kr,
      card_rom: card.rom,
      card_en: card.en,
      user_answer: userAnswer || null,
      quiz_mode: quizMode,
      suggested_fix: suggestedFix.trim() || null,
      notes: notes.trim() || null,
      user_id: session?.user?.id ?? null,
    };

    const { error } = await supabase.from('reports').insert(payload);

    if (error) {
      // Fallback: queue in localStorage so nothing is lost
      try {
        const existing = JSON.parse(localStorage.getItem('korean_vocab_reports') || '[]');
        existing.push({ ...payload, created_at: new Date().toISOString() });
        localStorage.setItem('korean_vocab_reports', JSON.stringify(existing));
      } catch {}
      setStatus('error');
      setTimeout(onClose, 1500);
      return;
    }

    setStatus('done');
    setTimeout(onClose, 800);
  }

  const overlay = {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.72)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 24,
  };

  const modal = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: 24,
    width: '100%', maxWidth: 400,
    display: 'flex', flexDirection: 'column', gap: 16,
  };

  const label = { fontSize: '0.72rem', color: 'var(--text3)', marginBottom: 4 };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text)',
    fontFamily: "'DM Mono', monospace",
    fontSize: '0.88rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modal}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)' }}>
            Report an issue
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: '1rem', padding: '2px 6px' }}
          >✕</button>
        </div>

        {/* Card info — read only */}
        <div style={{
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 12px',
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          <div style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>
            {card.kr}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text3)', fontStyle: 'italic' }}>{card.rom}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text2)', marginTop: 2 }}>
            Current answer: <span style={{ color: 'var(--text)' }}>{card.en}</span>
          </div>
          {userAnswer && (
            <div style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>
              You typed: <span style={{ color: 'var(--yellow)' }}>{userAnswer}</span>
            </div>
          )}
        </div>

        {/* Suggested fix */}
        <div>
          <div style={label}>What answer should be accepted?</div>
          <input
            value={suggestedFix}
            onChange={e => setSuggestedFix(e.target.value)}
            placeholder="e.g. it's ok, okay, that's fine..."
            style={inputStyle}
            disabled={status !== 'idle'}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* Notes */}
        <div>
          <div style={label}>Notes (optional)</div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any extra context..."
            rows={2}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            disabled={status !== 'idle'}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-ghost"
            onClick={onClose}
            disabled={status === 'sending'}
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={status !== 'idle'}
            style={{ flex: 2 }}
          >
            {status === 'idle' && 'Submit report'}
            {status === 'sending' && 'Sending…'}
            {status === 'done' && '✓ Sent'}
            {status === 'error' && 'Saved locally'}
          </button>
        </div>
      </div>
    </div>
  );
}
