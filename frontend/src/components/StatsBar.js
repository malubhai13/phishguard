import React from 'react';
import './StatsBar.css';

const stats = [
  { value: '93%',   label: 'Model Accuracy' },
  { value: '25',    label: 'URL Features' },
  { value: '<80ms', label: 'p95 Latency' },
  { value: '200',   label: 'Decision Trees' },
  { value: '8K+',   label: 'Training Samples' },
  { value: 'SHAP',  label: 'Explainability' },
];

export default function StatsBar() {
  return (
    <div className="stats-bar">
      <div className="stats-inner">
        {stats.map((s, i) => (
          <div className="stat-item" key={i}>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
