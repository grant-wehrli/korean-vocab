import { useState, useRef } from 'react';
import { BUILTIN_VOCAB } from '../data/vocab';

const TEMPLATE = {
  "My Custom Set": [
    { kr: "한국어", rom: "hangugeo", en: "Korean language" },
    { kr: "공부", rom: "gongbu", en: "studying" },
    { kr: "단어", rom: "daneo", en: "vocabulary / word" },
  ]
};

export default function ImportView({ store, onBack }) {
  const [status, setStatus] = useState(null); // { type: 'success'|'error', msg }
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  function processFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target.result);
        const sets = Array.isArray(raw) ? { Imported: raw } : raw;
        let count = 0;
        for (const [name, words] of Object.entries(sets)) {
          store.importSet(name, words);
          count += words.length;
        }
        setStatus({ type: 'success', msg: `Imported ${count} words across ${Object.keys(sets).length} set(s).` });
      } catch (err) {
        setStatus({ type: 'error', msg: `Parse error: ${err.message}` });
      }
    };
    reader.readAsText(file);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  }

  function downloadTemplate() {
    const blob = new Blob([JSON.stringify(TEMPLATE, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'vocab_template.json'; a.click();
    URL.revokeObjectURL(url);
  }

  const customSets = Object.keys(store.customSets);

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px 24px 0' }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ padding: '8px 12px', fontSize: '0.8rem', marginBottom: 20 }}>
          ← back
        </button>
        <h2 className="display" style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>Import</h2>
        <p style={{ fontSize: '0.78rem', color: 'var(--text3)', marginBottom: 24 }}>Add custom vocabulary sets</p>
      </div>

      <div className="container">
        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border2)'}`,
            borderRadius: 'var(--radius)',
            padding: '40px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? 'rgba(0,199,190,0.05)' : 'transparent',
            transition: 'all 0.2s',
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>⤓</div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text2)', marginBottom: 4 }}>Drop JSON file here</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>or click to browse</div>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={e => processFile(e.target.files[0])}
          />
        </div>

        {/* Status message */}
        {status && (
          <div className="anim-slide-down" style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background: status.type === 'success' ? 'rgba(61,220,151,0.08)' : 'rgba(255,77,106,0.08)',
            border: `1px solid ${status.type === 'success' ? 'rgba(61,220,151,0.3)' : 'rgba(255,77,106,0.3)'}`,
            color: status.type === 'success' ? 'var(--green)' : 'var(--red)',
            fontSize: '0.82rem',
            marginBottom: 16,
          }}>
            {status.msg}
          </div>
        )}

        {/* Download template */}
        <button className="btn btn-ghost btn-full" onClick={downloadTemplate} style={{ marginBottom: 24 }}>
          ↓ Download template JSON
        </button>

        {/* JSON format hint */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '0.72rem', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 10, textTransform: 'uppercase' }}>
            Expected Format
          </div>
          <pre style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: 16,
            fontSize: '0.72rem',
            color: 'var(--text2)',
            overflowX: 'auto',
            lineHeight: 1.6,
          }}>{`{
  "Set Name": [
    {
      "kr": "한국어",
      "rom": "hangugeo",
      "en": "Korean language"
    }
  ]
}`}</pre>
        </div>

        {/* Custom sets management */}
        {customSets.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: '0.72rem', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 10, textTransform: 'uppercase' }}>
              Custom Sets
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {customSets.map(name => (
                <div key={name} className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.88rem' }}>{name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 2 }}>
                      {store.customSets[name].length} words
                    </div>
                  </div>
                  <button
                    className="btn btn-danger"
                    onClick={() => store.deleteCustomSet(name)}
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  >
                    remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
