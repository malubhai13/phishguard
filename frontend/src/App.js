import React, { useState, useEffect } from 'react';
import Hero from './components/Hero';
import Scanner from './components/Scanner';
import ResultCard from './components/ResultCard';
import BatchScanner from './components/BatchScanner';
import StatsBar from './components/StatsBar';
import HowItWorks from './components/HowItWorks';
import Footer from './components/Footer';
import './App.css';

export default function App() {
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [history, setHistory]       = useState([]);
  const [activeTab, setActiveTab]   = useState('single');
  const [apiStatus, setApiStatus]   = useState('checking');

  // Check API health on load
  useEffect(() => {
    fetch('/health')
      .then(r => r.json())
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'));
  }, []);

  const handleScan = async (url) => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error('Prediction failed');
      const data = await res.json();
      setResult(data);
      setHistory(prev => [data, ...prev].slice(0, 10));
    } catch (e) {
      setError('Could not reach the API. Make sure the backend is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">
          <span className="nav-logo">🛡️</span>
          <span className="nav-title">PhishGuard</span>
          <span className="nav-sub">AI Security</span>
        </div>
        <div className="nav-right">
          <div className={`status-dot ${apiStatus}`}>
            <span className="dot" />
            <span className="status-label">
              {apiStatus === 'online' ? 'API Online' : apiStatus === 'offline' ? 'API Offline' : 'Checking…'}
            </span>
          </div>
          <a href="/docs" target="_blank" rel="noreferrer" className="nav-link">API Docs</a>
        </div>
      </nav>

      <Hero />
      <StatsBar />

      <main className="main-content">
        <div className="tab-row">
          <button className={`tab-btn ${activeTab === 'single' ? 'active' : ''}`} onClick={() => setActiveTab('single')}>
            Single URL
          </button>
          <button className={`tab-btn ${activeTab === 'batch' ? 'active' : ''}`} onClick={() => setActiveTab('batch')}>
            Batch Scan
          </button>
          <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            History {history.length > 0 && <span className="badge">{history.length}</span>}
          </button>
        </div>

        {activeTab === 'single' && (
          <>
            <Scanner onScan={handleScan} loading={loading} />
            {error && <div className="error-box">{error}</div>}
            {result && <ResultCard result={result} />}
          </>
        )}

        {activeTab === 'batch' && <BatchScanner />}

        {activeTab === 'history' && (
          <div className="history-section">
            {history.length === 0
              ? <div className="empty-state">No scans yet. Go to Single URL to start.</div>
              : history.map((r, i) => <ResultCard key={i} result={r} compact />)
            }
          </div>
        )}
      </main>

      <HowItWorks />
      <Footer />
    </div>
  );
}
