import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span>🛡️ PhishGuard</span>
          <span className="footer-sep">·</span>
          <span>ML-powered phishing detection</span>
        </div>
        <div className="footer-links">
          <a href="/docs" target="_blank" rel="noreferrer">API Docs</a>
          <a href="/health" target="_blank" rel="noreferrer">Health</a>
          <a href="https://github.com/malubhai13/phishguard-api" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://linkedin.com/in/anish-malu13" target="_blank" rel="noreferrer">LinkedIn</a>
        </div>
        <div className="footer-credit">
          Built by <strong>Anish Malu</strong> · AIR 67 Amazon ML Challenge 2025
        </div>
      </div>
    </footer>
  );
}
