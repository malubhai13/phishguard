import React, { useState } from 'react';
import './Scanner.css';

const EXAMPLE_URLS = [
  { url: 'http://secure-paypal-login.xyz/verify?id=123', label: 'Phishing example' },
  { url: 'https://github.com/scikit-learn/scikit-learn', label: 'Legit example' },
  { url: 'http://192.168.1.1/banking/signin.php?user=update', label: 'IP-based phish' },
  { url: 'https://docs.python.org/3/library/os.html', label: 'Legit example' },
];

export default function Scanner({ onScan, loading }) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) onScan(url.trim());
  };

  const handleExample = (exUrl) => {
    setUrl(exUrl);
    onScan(exUrl);
  };

  return (
    <div className="scanner-wrap">
      <form className="scanner-form" onSubmit={handleSubmit}>
        <div className="input-row">
          <span className="input-icon">🔗</span>
          <input
            className="url-input"
            type="text"
            placeholder="Paste any URL to analyse... e.g. http://suspicious-login.xyz/verify"
            value={url}
            onChange={e => setUrl(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <button className="scan-btn" type="submit" disabled={loading || !url.trim()}>
            {loading
              ? <><span className="spinner" /> Scanning…</>
              : <><span>⚡</span> Scan URL</>
            }
          </button>
        </div>
      </form>

      <div className="examples-row">
        <span className="examples-label">Try an example:</span>
        {EXAMPLE_URLS.map((ex, i) => (
          <button key={i} className="example-chip" onClick={() => handleExample(ex.url)} disabled={loading}>
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  );
}
