import React from 'react';
import './HowItWorks.css';

const steps = [
  {
    icon: '🔗',
    title: 'URL Input',
    desc: 'You paste any URL. The system accepts single URLs or batches of up to 100.',
  },
  {
    icon: '⚙️',
    title: 'Feature Extraction',
    desc: '25 features are extracted instantly — URL length, dots, hyphens, suspicious words, IP usage, entropy, and more.',
  },
  {
    icon: '🌳',
    title: 'Random Forest Model',
    desc: '200 decision trees each vote on the URL. The majority vote + probability gives the risk score.',
  },
  {
    icon: '🔍',
    title: 'SHAP Explanation',
    desc: 'SHAP (SHapley Additive exPlanations) identifies which 3 features drove the decision most.',
  },
  {
    icon: '📊',
    title: 'Result + Risk Level',
    desc: 'You get: label (phishing/legitimate), risk score (0–100%), risk level, and feature explanations.',
  },
];

const features = [
  { name: 'URL Length',           why: 'Phishing URLs tend to be longer to hide the real domain' },
  { name: 'Has IP Address',       why: 'Legit sites use domain names; phishing often uses raw IPs' },
  { name: 'Suspicious Words',     why: 'Words like "login", "verify", "secure" are phishing red flags' },
  { name: 'Has HTTPS',            why: 'Legitimate sites almost always use HTTPS' },
  { name: 'Domain Entropy',       why: 'Random-looking domains like xk92pq.xyz signal phishing' },
  { name: 'Subdomain Count',      why: 'Phishers use many subdomains to fake legitimacy' },
  { name: 'Number of @ Symbols',  why: '@ in URLs is a classic trick to spoof the displayed domain' },
  { name: 'Digit Ratio',          why: 'High digit ratio often means auto-generated phishing URLs' },
];

export default function HowItWorks() {
  return (
    <section className="hiw-section">
      <div className="hiw-inner">
        <div className="hiw-heading">
          <h2 className="hiw-title">How It Works</h2>
          <p className="hiw-sub">The full ML pipeline — from URL to prediction — in under 80ms</p>
        </div>

        {/* Pipeline steps */}
        <div className="pipeline">
          {steps.map((s, i) => (
            <React.Fragment key={i}>
              <div className="pipeline-step">
                <div className="ps-icon">{s.icon}</div>
                <div className="ps-title">{s.title}</div>
                <div className="ps-desc">{s.desc}</div>
              </div>
              {i < steps.length - 1 && <div className="pipeline-arrow">→</div>}
            </React.Fragment>
          ))}
        </div>

        {/* Feature table */}
        <div className="feature-table-wrap">
          <div className="hiw-sub-head">Key URL Features the Model Uses</div>
          <div className="feature-grid">
            {features.map((f, i) => (
              <div className="feature-row" key={i}>
                <div className="feat-name">{f.name}</div>
                <div className="feat-why">{f.why}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech stack */}
        <div className="tech-stack">
          <div className="hiw-sub-head">Built With</div>
          <div className="tech-pills">
            {['Python 3.11','FastAPI','scikit-learn','SHAP','Docker','AWS EC2','GitHub Actions','Prometheus','Grafana','React'].map(t => (
              <span className="tech-pill" key={t}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
