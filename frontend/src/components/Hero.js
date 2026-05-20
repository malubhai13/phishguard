import React from 'react';
import './Hero.css';

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-glow" />
      <div className="hero-inner">
        <div className="hero-badge">🤖 Powered by Random Forest + SHAP Explainability</div>
        <h1 className="hero-title">
          Detect Phishing URLs<br />
          <span className="hero-accent">Instantly & Intelligently</span>
        </h1>
        <p className="hero-desc">
          PhishGuard uses a machine learning model trained on 25 URL features
          to classify threats in real-time — and explains <em>why</em> it flagged each URL.
        </p>
        <div className="hero-pills">
          <span className="pill">93% Accuracy</span>
          <span className="pill">25 Features</span>
          <span className="pill">SHAP Explanations</span>
          <span className="pill">REST API</span>
          <span className="pill">Batch Support</span>
        </div>
      </div>
    </section>
  );
}
