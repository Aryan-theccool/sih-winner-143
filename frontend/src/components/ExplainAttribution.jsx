import React, { useState } from 'react'
import { FEATURE_LABELS, featurePct } from '../utils/caseAnalytics'

const REASONS = [
  { key: 'origin_mass', text: 'Present inside probable origin region' },
  { key: 'deep_hour_mass', text: 'Present during probable release window' },
  { key: 'cpa_km', text: 'Historical track compatible with origin' },
  { key: 'dump_profile', text: 'Vessel trajectory consistent with drift' },
  { key: 'gap_overlap_h', text: 'AIS history available for analysis' },
  { key: 'late_arrival', text: 'No temporal exclusion detected', pass: true },
]

export default function ExplainAttribution({ candidate, onClose }) {
  const [open, setOpen] = useState(true)
  if (!candidate || !open) return null

  const score = Math.round(candidate.score * 100)
  const f = candidate.features || {}

  return (
    <div className="explain-panel" role="dialog" aria-label="Attribution explanation">
      <div className="explain-head">
        <h3>WHY THIS VESSEL?</h3>
        <button type="button" className="explain-close" onClick={() => { setOpen(false); onClose?.() }}>×</button>
      </div>
      <ul className="explain-list">
        {REASONS.map((r) => {
          const val = f[r.key] ?? 0
          const ok = r.pass ? val === 0 : val > 0.3
          return (
            <li key={r.key} className={ok ? 'ok' : 'fail'}>
              <span className="status-icon">{ok ? '✓' : '○'}</span>
              {r.text}
            </li>
          )
        })}
      </ul>
      <div className="explain-score">
        <span className="explain-score-val">{score}%</span>
        <span className="explain-score-lbl">ATTRIBUTION SCORE</span>
      </div>
      <div className="explain-decomp">
        {Object.keys(FEATURE_LABELS).map((k) => (
          <div key={k} className="explain-bar-row">
            <span>{FEATURE_LABELS[k]}</span>
            <div className="explain-bar">
              <div style={{ width: `${featurePct(k, f[k] ?? 0)}%` }} />
            </div>
            <b>{k === 'late_arrival' ? (f[k] === 0 ? 'PASS' : `${featurePct(k, f[k])}%`) : `${featurePct(k, f[k] ?? 0)}%`}</b>
          </div>
        ))}
      </div>
    </div>
  )
}
