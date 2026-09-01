import React from 'react'

const FEATURE_SHORT = {
  origin_mass: 'Origin overlap',
  deep_hour_mass: 'Release window',
  gap_overlap_h: 'AIS gap in window',
  dump_profile: 'Track profile',
  cpa_km: 'Closest approach',
  late_arrival: 'Temporal exclusion',
}

export default function ShapWaterfall({ candidate, compact = false }) {
  const reasons = candidate?.reasons?.filter((r) => r.direction === 'raises')?.slice(0, 5)
    || Object.entries(candidate?.shap || {})
      .filter(([, v]) => Math.abs(v) > 0.05)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 5)
      .map(([feature, weight]) => ({
        feature,
        weight: Math.abs(weight),
        direction: 'raises',
        text: FEATURE_SHORT[feature] || feature,
      }))

  if (!reasons?.length) return null

  const maxW = Math.max(...reasons.map((r) => r.weight), 0.01)

  return (
    <div className={`shap-waterfall ${compact ? 'compact' : ''}`}>
      <div className="shap-head">
        <span className="shap-title">SHAP EXPLANATION</span>
        <span className="tag tag-inference">MODEL · INDICATIVE</span>
      </div>
      <ul className="shap-list">
        {reasons.map((r, i) => {
          const pct = Math.round((r.weight / maxW) * 100)
          const label = FEATURE_SHORT[r.feature] || r.text?.split(' ').slice(0, 4).join(' ') || r.feature
          return (
            <li key={r.feature} className="shap-row panel-stagger" style={{ '--stagger': i }}>
              <span className="shap-label">{label}</span>
              <div className="shap-bar-track">
                <div
                  className={`shap-bar-fill ${r.direction === 'raises' ? 'raise' : 'lower'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="shap-val mono">+{r.weight.toFixed(2)}</span>
            </li>
          )
        })}
      </ul>
      <p className="shap-note">Non-technical readout — supports verification, not a verdict.</p>
    </div>
  )
}
