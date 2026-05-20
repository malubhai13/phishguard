import React, { useState } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import './ResultCard.css';

const RISK_CONFIG = {
  low:      { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',    border: 'rgba(34,197,94,0.25)',    icon: '✅', label: 'LOW RISK' },
  medium:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',   border: 'rgba(245,158,11,0.25)',   icon: '⚠️', label: 'MEDIUM RISK' },
  high:     { color: '#f97316', bg: 'rgba(249,115,22,0.08)',   border: 'rgba(249,115,22,0.25)',   icon: '🚨', label: 'HIGH RISK' },
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',    border: 'rgba(239,68,68,0.25)',    icon: '💀', label: 'CRITICAL' },
};

const FEATURE_DESC = {
  url_length:            'Total length of the URL',
  domain_length:         'Length of the domain part',
  path_length:           'Length of the URL path',
  num_dots:              'Number of dots in the URL',
  num_hyphens:           'Number of hyphens (-) in URL',
  num_underscores:       'Number of underscores (_)',
  num_slashes:           'Number of forward slashes',
  num_at:                'Number of @ symbols (suspicious in URLs)',
  num_question:          'Number of question marks',
  num_ampersand:         'Number of & symbols',
  num_equals:            'Number of = signs',
  num_digits:            'Count of digit characters',
  num_special:           'Count of special characters',
  has_ip:                'Uses raw IP address instead of domain',
  has_https:             'Whether URL uses HTTPS',
  domain_entropy:        'Randomness of characters in domain',
  url_entropy:           'Overall randomness of URL string',
  subdomain_count:       'Number of subdomains',
  path_depth:            'Depth of URL directory structure',
  query_length:          'Length of query parameters',
  has_suspicious_word:   'Contains words like login, verify, secure',
  suspicious_word_count: 'Count of suspicious keywords found',
  digit_ratio:           'Proportion of digits in the URL',
  special_ratio:         'Proportion of special characters',
  domain_digit_count:    'Number of digits in the domain',
};

function RiskGauge({ score, config }) {
  const pct = Math.round(score * 100);
  const data = [{ value: pct, fill: config.color }];
  return (
    <div className="gauge-wrap">
      <ResponsiveContainer width={180} height={180}>
        <RadialBarChart
          innerRadius="65%" outerRadius="100%"
          startAngle={225} endAngle={-45}
          data={data}
          barSize={14}
        >
          <RadialBar background={{ fill: 'rgba(148,163,184,0.08)' }} dataKey="value" cornerRadius={8} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="gauge-center">
        <div className="gauge-pct" style={{ color: config.color }}>{pct}%</div>
        <div className="gauge-sub">Risk Score</div>
      </div>
    </div>
  );
}

function ShapBar({ name, value, shap, direction }) {
  const absShap = Math.abs(shap);
  const barPct  = Math.min(100, absShap * 300);
  const isRisk  = direction === 'increases_risk';
  const color   = isRisk ? '#ef4444' : '#22c55e';
  const desc    = FEATURE_DESC[name] || name;
  return (
    <div className="shap-row">
      <div className="shap-left">
        <div className="shap-name">{name.replace(/_/g, ' ')}</div>
        <div className="shap-desc">{desc}</div>
      </div>
      <div className="shap-right">
        <div className="shap-val-row">
          <span className="shap-feature-val">val: {value}</span>
          <span className="shap-impact" style={{ color }}>
            {isRisk ? '↑ risk' : '↓ risk'} ({shap > 0 ? '+' : ''}{shap.toFixed(3)})
          </span>
        </div>
        <div className="shap-track">
          <div className="shap-fill" style={{ width: `${barPct}%`, background: color }} />
        </div>
      </div>
    </div>
  );
}

export default function ResultCard({ result, compact }) {
  const [showAll, setShowAll] = useState(false);
  const cfg = RISK_CONFIG[result.risk_level] || RISK_CONFIG.low;
  const isPhish = result.label === 'phishing';

  if (compact) {
    return (
      <div className="result-compact" style={{ borderColor: cfg.border }}>
        <span className="rc-icon">{cfg.icon}</span>
        <span className="rc-url">{result.url.slice(0, 60)}{result.url.length > 60 ? '…' : ''}</span>
        <span className="rc-label" style={{ color: cfg.color }}>{cfg.label}</span>
        <span className="rc-score" style={{ color: cfg.color }}>{Math.round(result.risk_score * 100)}%</span>
      </div>
    );
  }

  return (
    <div className="result-card" style={{ borderColor: cfg.border, '--r-color': cfg.color }}>

      {/* ── Header ── */}
      <div className="result-header" style={{ background: cfg.bg }}>
        <div className="rh-left">
          <div className="rh-icon">{cfg.icon}</div>
          <div>
            <div className="rh-verdict" style={{ color: cfg.color }}>
              {isPhish ? 'Phishing / Malicious' : 'Legitimate'}
            </div>
            <div className="rh-risk-label" style={{ color: cfg.color }}>{cfg.label}</div>
          </div>
        </div>
        <div className="rh-latency">⚡ {result.latency_ms}ms</div>
      </div>

      {/* ── URL ── */}
      <div className="result-url-row">
        <span className="result-url-label">URL</span>
        <code className="result-url">{result.url}</code>
      </div>

      {/* ── Gauge + summary ── */}
      <div className="result-body">
        <RiskGauge score={result.risk_score} config={cfg} />
        <div className="result-summary">
          <div className="rs-row">
            <span className="rs-label">Classification</span>
            <span className="rs-val" style={{ color: cfg.color, textTransform: 'capitalize' }}>{result.label}</span>
          </div>
          <div className="rs-row">
            <span className="rs-label">Risk Level</span>
            <span className="rs-val" style={{ color: cfg.color }}>{result.risk_level.toUpperCase()}</span>
          </div>
          <div className="rs-row">
            <span className="rs-label">Confidence</span>
            <span className="rs-val">{Math.round(result.risk_score * 100)}%</span>
          </div>
          <div className="rs-row">
            <span className="rs-label">Response time</span>
            <span className="rs-val">{result.latency_ms} ms</span>
          </div>
          <div className="result-advice" style={{ borderColor: cfg.border, background: cfg.bg }}>
            {isPhish
              ? '⚠️  Do not visit this URL. It shows characteristics of a phishing or malicious site.'
              : '✅  This URL appears legitimate. Always stay cautious with unfamiliar links.'}
          </div>
        </div>
      </div>

      {/* ── SHAP Explanation ── */}
      <div className="shap-section">
        <div className="section-label">🔍 Why the AI made this decision — Top Influencing Features</div>
        {result.explanation.map((ex, i) => (
          <ShapBar key={i} name={ex.feature} value={ex.value} shap={ex.shap_value} direction={ex.direction} />
        ))}
      </div>

      {/* ── Raw JSON toggle ── */}
      <div className="raw-section">
        <button className="raw-toggle" onClick={() => setShowAll(v => !v)}>
          {showAll ? '▲ Hide' : '▼ Show'} raw API response
        </button>
        {showAll && (
          <pre className="raw-json">{JSON.stringify(result, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
