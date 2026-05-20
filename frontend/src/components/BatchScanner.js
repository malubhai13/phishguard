import React, { useState } from 'react';
import './BatchScanner.css';

const PLACEHOLDER = `http://secure-paypal-login.xyz/verify?id=123
https://github.com/scikit-learn
http://192.168.1.1/banking/signin.php
https://docs.python.org/3/library/os.html
http://amazon-offer-free.tk/click-here`;

const RISK_COLOR = { low:'#22c55e', medium:'#f59e0b', high:'#f97316', critical:'#ef4444' };
const RISK_ICON  = { low:'✅', medium:'⚠️', high:'🚨', critical:'💀' };

export default function BatchScanner() {
  const [text, setText]       = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [progress, setProgress] = useState(0);

  const handleScan = async () => {
    const urls = text.split('\n').map(u => u.trim()).filter(Boolean);
    if (!urls.length) return;
    if (urls.length > 100) { setError('Maximum 100 URLs per batch.'); return; }

    setLoading(true); setError(''); setResults([]); setProgress(0);

    try {
      const res = await fetch('/predict/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });
      if (!res.ok) throw new Error('Batch prediction failed');
      const data = await res.json();
      // animate results in one by one
      for (let i = 0; i < data.length; i++) {
        await new Promise(r => setTimeout(r, 60));
        setResults(prev => [...prev, data[i]]);
        setProgress(Math.round(((i + 1) / data.length) * 100));
      }
    } catch (e) {
      setError('Could not reach the API. Make sure the backend is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => { setText(''); setResults([]); setError(''); setProgress(0); };

  const summary = results.reduce((acc, r) => {
    acc[r.risk_level] = (acc[r.risk_level] || 0) + 1;
    return acc;
  }, {});

  const downloadCSV = () => {
    const header = 'URL,Label,Risk Level,Risk Score,Latency (ms)\n';
    const rows = results.map(r =>
      `"${r.url}",${r.label},${r.risk_level},${r.risk_score},${r.latency_ms}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'phishguard_results.csv'; a.click();
  };

  return (
    <div className="batch-wrap">
      <div className="batch-input-card">
        <div className="batch-header">
          <div>
            <div className="batch-title">Batch URL Scanner</div>
            <div className="batch-sub">Paste up to 100 URLs — one per line</div>
          </div>
          <div className="batch-actions">
            {results.length > 0 && (
              <button className="btn-secondary" onClick={downloadCSV}>⬇ Export CSV</button>
            )}
            <button className="btn-secondary" onClick={handleClear} disabled={loading}>Clear</button>
            <button className="btn-primary" onClick={handleScan} disabled={loading || !text.trim()}>
              {loading ? <><span className="spinner-sm" /> Scanning…</> : '⚡ Scan All'}
            </button>
          </div>
        </div>
        <textarea
          className="batch-textarea"
          placeholder={PLACEHOLDER}
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={loading}
          rows={8}
        />
        <div className="batch-footer-row">
          <span className="url-count">{text.split('\n').filter(u => u.trim()).length} URLs</span>
          {loading && (
            <div className="progress-wrap">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="progress-pct">{progress}%</span>
            </div>
          )}
        </div>
      </div>

      {error && <div className="error-box" style={{marginTop:'1rem'}}>{error}</div>}

      {results.length > 0 && (
        <>
          {/* Summary pills */}
          <div className="batch-summary">
            {Object.entries(summary).map(([level, count]) => (
              <div className="summary-pill" key={level} style={{ borderColor: RISK_COLOR[level], background: `${RISK_COLOR[level]}14` }}>
                <span>{RISK_ICON[level]}</span>
                <span style={{ color: RISK_COLOR[level], fontWeight: 600 }}>{count}</span>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>{level}</span>
              </div>
            ))}
            <div className="summary-pill" style={{ borderColor: '#334155' }}>
              <span style={{ fontWeight: 600 }}>{results.length}</span>
              <span style={{ color: '#94a3b8', fontSize: 12 }}>total</span>
            </div>
          </div>

          {/* Results table */}
          <div className="batch-table-wrap">
            <table className="batch-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>URL</th>
                  <th>Label</th>
                  <th>Risk</th>
                  <th>Score</th>
                  <th>ms</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="table-row-in">
                    <td className="td-num">{i + 1}</td>
                    <td className="td-url" title={r.url}>
                      {r.url.length > 55 ? r.url.slice(0, 55) + '…' : r.url}
                    </td>
                    <td>
                      <span className="label-chip" style={{ color: RISK_COLOR[r.risk_level], background: `${RISK_COLOR[r.risk_level]}14`, borderColor: `${RISK_COLOR[r.risk_level]}40` }}>
                        {RISK_ICON[r.risk_level]} {r.label}
                      </span>
                    </td>
                    <td style={{ color: RISK_COLOR[r.risk_level], fontWeight: 600, fontSize: 12, textTransform:'uppercase' }}>
                      {r.risk_level}
                    </td>
                    <td>
                      <div className="score-cell">
                        <div className="score-mini-track">
                          <div className="score-mini-fill" style={{ width: `${Math.round(r.risk_score*100)}%`, background: RISK_COLOR[r.risk_level] }} />
                        </div>
                        <span style={{ color: RISK_COLOR[r.risk_level], fontWeight:600, fontSize:13, minWidth:36, textAlign:'right' }}>
                          {Math.round(r.risk_score * 100)}%
                        </span>
                      </div>
                    </td>
                    <td style={{ color:'#64748b', fontSize:12 }}>{r.latency_ms}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
