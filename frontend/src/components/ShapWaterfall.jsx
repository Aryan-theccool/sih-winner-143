import React from 'react'
import { Bar } from './ui'
import { Term } from './Glossary'

const FEATURE_SHORT = {
  origin_mass: 'Origin overlap',
  deep_hour_mass: 'Release window',
  gap_overlap_h: 'Beacon switched off',
  dump_profile: 'Track profile',
  cpa_km: 'Closest approach',
  late_arrival: 'Timing exclusion',
}

/** Which inputs pushed the score up or down — the model showing its work. */
export default function ShapWaterfall({ candidate, compact = false }) {
  const reasons = candidate?.reasons?.filter((r) => r.direction === 'raises')?.slice(0, 4)
    || Object.entries(candidate?.shap || {})
      .filter(([, v]) => Math.abs(v) > 0.05)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 4)
      .map(([feature, weight]) => ({
        feature,
        weight: Math.abs(weight),
        direction: 'raises',
        text: FEATURE_SHORT[feature] || feature,
      }))

  if (!reasons?.length) return null
  const maxW = Math.max(...reasons.map((r) => r.weight), 0.01)

  return (
    <div className={`sn-shap ${compact ? 'compact' : ''}`}>
      <div className="sn-shap-head">
        <span className="mono"><Term k="shap">WHY THE SCORE</Term></span>
        <span className="sn-tag tone-inferred">INDICATIVE</span>
      </div>
      <div className="sn-shap-rows">
        {reasons.map((r, i) => (
          <Bar
            key={r.feature}
            label={FEATURE_SHORT[r.feature] || r.text?.split(' ').slice(0, 4).join(' ')}
            pct={Math.round((r.weight / maxW) * 100)}
            value={`+${r.weight.toFixed(1)}`}
            tone={r.direction === 'raises' ? 'purple' : 'dim'}
            stagger={i}
          />
        ))}
      </div>
      {!compact && <p className="sn-shap-note">Longer bar = that factor pushed the ranking up more.</p>}
    </div>
  )
}
