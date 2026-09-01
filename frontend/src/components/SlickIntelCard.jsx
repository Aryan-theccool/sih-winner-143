import React from 'react'
import { slickCharacterisation } from '../utils/caseAnalytics'

export default function SlickIntelCard({ detection, manifest }) {
  const char = slickCharacterisation(detection, manifest)
  if (!char) return null

  return (
    <div className="intel-card slick-intel">
      <div className="ic-header">
        <span className="ic-rank">SLICK ANALYSIS</span>
        <span className="ic-badge warn">SELECTED</span>
      </div>
      <div className="ic-score">
        <span className="ic-score-val red">{char.probability}%</span>
        <span className="ic-score-lbl">OIL-SLICK PROBABILITY</span>
      </div>
      <div className="ic-grid">
        <div><span>Area</span><b className="mono">{char.area} km²</b></div>
        <div><span>Darkening</span><b className="mono">{char.darkening} dB</b></div>
        <div><span>Wind</span><b className="mono">{char.wind} m/s</b></div>
        <div><span>Age (est.)</span><b className="mono">{char.ageRange}</b></div>
        <div><span>Class (est.)</span><b>{char.oilClass}</b></div>
      </div>
      <p className="ic-note">Satellite-derived classification — requires corroboration for forensic identification.</p>
      <button className="ic-action-single">TRACE BACKWARD →</button>
    </div>
  )
}
