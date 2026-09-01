import React, { useState } from 'react'
import { slickCharacterisation, fmtWindow } from '../../utils/caseAnalytics'

export default function DetectionPanel({
  detection, manifest, showMask, setShowMask, caseInfo, userMode,
  onTraceOrigin, onViewOilFlow,
}) {
  const [showTechnical, setShowTechnical] = useState(false)
  const char = slickCharacterisation(detection, manifest)
  const lookAlike = detection?.summary?.objects?.find((o) => o.class === 'look_alike')

  if (!char) return <p className="loading">Loading detection data…</p>

  const ageMid = 34

  return (
    <div className="panel sn-panel">
      <section className="sn-section">
        <h3 className="sn-section-title">SLICK SUMMARY</h3>
        <div className="sn-prob-block">
          <span className="sn-prob-val">{char.probability}%</span>
          <span className="sn-prob-lbl">Oil-slick probability</span>
        </div>
        <div className="sn-metric-grid">
          <div><span>Area</span><b className="mono">{char.area} km²</b></div>
          <div><span>SAR darkening</span><b className="mono">{char.darkening} dB</b></div>
          <div><span>Wind @ slick</span><b className="mono">{char.wind} m/s</b></div>
          <div><span>Thickness est.</span><b className="mono">{char.thicknessUm[0]}–{char.thicknessUm[1]} µm</b></div>
          <div><span>Volume est.</span><b className="mono">{char.volumeM3[0]}–{char.volumeM3[1]} m³</b></div>
          <div><span>Morphology</span><b>Elongated</b></div>
          <div><span>Persistence</span><b>Bi-temporal</b></div>
        </div>
      </section>

      <section className="sn-section">
        <h3 className="sn-section-title">ESTIMATED AGE <span className="tag tag-inference">MODEL-INFERRED</span></h3>
        <div className="sn-age-val">{char.ageRange.replace(' hours', ' HOURS')}</div>
        <p className="sn-age-sub">Most probable ~{ageMid} h</p>
        <div className="sn-age-bar">
          <div className="sn-age-fill" style={{ left: '35%', width: '25%' }} />
        </div>
        <div className="sn-age-timeline">
          <span className="mono">10 JUN 04:00</span>
          <span className="sn-age-window">PROBABLE RELEASE WINDOW</span>
          <span className="mono">12 JUN 06:30</span>
        </div>
        <p className="sn-meta mono">Probable release: {fmtWindow(char.releaseWindow?.[0], char.releaseWindow?.[1])}</p>
      </section>

      <section className="sn-section">
        <h3 className="sn-section-title">ESTIMATED OIL CLASS <span className="tag tag-inference">INFERRED</span></h3>
        <p className="sn-oil-class">{char.oilClass}</p>
        <p className="sn-meta">Confidence: {char.classConfidence}%</p>
        <p className="disclaimer">Satellite-derived classification. Requires corroboration for forensic ID.</p>
        <span className="tag tag-inference">SATELLITE-DERIVED INFERENCE</span>
      </section>

      <div className="sn-actions">
        <button type="button" className="btn-secondary" onClick={onTraceOrigin}>Trace to Origin</button>
        <button type="button" className="btn-secondary" onClick={onViewOilFlow}>View in Oil Flow</button>
      </div>

      <button type="button" className="btn-link" onClick={() => setShowTechnical((s) => !s)}>
        {showTechnical ? 'Hide technical measurements ↑' : 'Technical measurements →'}
      </button>

      {(showTechnical || userMode === 'analyst') && (
        <dl className="meta-list mono technical-block">
          <div><dt>Acquisition</dt><dd>{detection?.summary?.acquisition_time_utc?.slice(0, 16)} UTC</dd></div>
          <div><dt>Incidence</dt><dd>{caseInfo?.scene?.incidence_angle_deg ?? '—'}°</dd></div>
          <div><dt>Polarization</dt><dd>{caseInfo?.scene?.polarization || 'VV+VH'}</dd></div>
        </dl>
      )}

      {lookAlike && (
        <div className="alert-card"><span className="status-icon-warn">⚠ LOOK-ALIKE</span> {Math.round(lookAlike.confidence * 100)}%</div>
      )}
    </div>
  )
}
