import React, { useState } from 'react'
import { FEATURE_LABELS, featurePct } from '../utils/caseAnalytics'
import { Bar } from './ui'
import { Term } from './Glossary'

const REASONS = [
  { key: 'origin_mass', text: 'Was inside the probable origin area', plain: 'the drift model puts the release here and this ship was here' },
  { key: 'deep_hour_mass', text: 'Was inside it during the release window', plain: 'the timing matches, not just the place' },
  { key: 'cpa_km', text: 'Track passes close to the release point', plain: 'the closest approach is small' },
  { key: 'gap_overlap_h', text: 'Position beacon history is complete enough to test', plain: 'we can actually verify where it was' },
  { key: 'late_arrival', text: 'Did not arrive after the spill', plain: 'it cannot be excluded on timing' },
]

export default function ExplainAttribution({ candidate, onClose }) {
  const [open, setOpen] = useState(true)
  if (!candidate || !open) return null

  const score = Math.round(candidate.score * 100)
  const f = candidate.features || {}

  return (
    <div className="sn-explain" role="dialog" aria-label="Why this vessel was ranked">
      <header className="sn-explain-head">
        <div>
          <span className="mono sn-explain-kicker">EXPLAINING THE RANK</span>
          <h3>Why {candidate.name}?</h3>
        </div>
        <button type="button" className="sn-explain-close" onClick={() => { setOpen(false); onClose?.() }} aria-label="Close">×</button>
      </header>

      <p className="sn-explain-sub">
        Each bar is one independent test. A ship ranks high only when several point the same way —
        a <Term k="shap">model explanation</Term>, not a verdict.
      </p>

      <ul className="sn-explain-list">
        {REASONS.map((r, i) => {
          const val = f[r.key] ?? 0
          const ok = r.key === 'late_arrival' ? val === 0 : val > 0.3
          return (
            <li key={r.key} className={ok ? 'ok' : 'no'}>
              <span className="sn-explain-mark">{ok ? '✓' : '—'}</span>
              <div>
                <b>{r.text}</b>
                <span>{r.plain}</span>
              </div>
              <em className="mono">{r.key === 'late_arrival' ? (val === 0 ? 'CLEAR' : `${featurePct(r.key, val)}%`) : `${featurePct(r.key, val)}%`}</em>
            </li>
          )
        })}
      </ul>

      <div className="sn-explain-bars">
        {Object.keys(FEATURE_LABELS).map((k, i) => (
          <Bar
            key={k}
            label={FEATURE_LABELS[k]}
            pct={featurePct(k, f[k] ?? 0)}
            value={`${featurePct(k, f[k] ?? 0)}%`}
            tone={k === 'late_arrival' && f[k] === 0 ? 'green' : 'cyan'}
            stagger={i}
          />
        ))}
      </div>

      <footer className="sn-explain-foot">
        <span className="sn-explain-score mono">{score}%</span>
        <span>overall model fit · {FEATURE_LABELS.dump_profile} and {FEATURE_LABELS.cpa_km} carry most of it</span>
        <button type="button" onClick={() => { setOpen(false); onClose?.() }}>Dismiss</button>
      </footer>
    </div>
  )
}
