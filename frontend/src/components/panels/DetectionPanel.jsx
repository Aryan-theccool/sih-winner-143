import React, { useState } from 'react'
import { slickCharacterisation, fmtWindow } from '../../utils/caseAnalytics'

export default function DetectionPanel({
  detection, manifest, showMask, setShowMask, caseInfo,
  onTraceOrigin, onViewOilFlow,
}) {
  const char = slickCharacterisation(detection, manifest)
  const lookAlike = detection?.summary?.objects?.find((o) => o.class === 'look_alike')
  const windOk = char && char.wind >= 3 && char.wind <= 12

  if (!char) return <p className="loading">Loading detection data…</p>

  const ageMid = 34
  const ageDisplay = char.ageRange.replace('–', ' - ')

  return (
    <div className="panel">
      <div className="evidence-tags">
        <span className="tag tag-observed">OBSERVED · SAR</span>
        <span className="tag tag-inference">MODEL-INFERRED</span>
        {windOk
          ? <span className="tag tag-corroborated">WIND GATE · PASS</span>
          : <span className="tag tag-probable">WIND GATE · NOT ASSESSABLE</span>}
      </div>

      <section className="sn-section sn-section-first">
        <div className="sn-prob-block">
          <span className="sn-prob-val">{char.probability}%</span>
          <span className="sn-prob-lbl">Oil-slick probability</span>
        </div>
        <div className="sn-metric-grid">
          <div><span>Area</span><b className="mono">{char.area} km²</b></div>
          <div><span>SAR darkening</span><b className="mono">{char.darkening} dB</b></div>
          <div><span>Wind @ slick</span><b className="mono">{char.wind} m/s</b></div>
          <div><span>Thickness (est.)</span><b className="mono">{char.thicknessUm[0]} - {char.thicknessUm[1]} µm</b></div>
          <div><span>Volume (est.)</span><b className="mono">{char.volumeM3[0]} - {char.volumeM3[1]} m³</b></div>
          <div><span>Morphology</span><b>Elongated</b></div>
          <div><span>Persistence</span><b>Bi-temporal</b></div>
        </div>
      </section>

      <section className="sn-section">
        <h3 className="sn-section-title">ESTIMATED AGE</h3>
        <div className="sn-age-val">{ageDisplay}</div>
        <p className="sn-age-sub">Most probable ~{ageMid} h</p>
        <div className="sn-age-bar">
          <div className="sn-age-fill anim-bar" style={{ left: '35%', width: '25%' }} />
          <div className="sn-age-marker" style={{ left: '47%' }} />
        </div>
        <div className="sn-age-timeline">
          <span className="mono">10 JUN 04:00</span>
          <span className="sn-age-window">PROBABLE RELEASE WINDOW</span>
          <span className="mono">12 JUN 06:30</span>
        </div>
        <p className="sn-meta mono sn-release-line">
          {fmtWindow(char.releaseWindow?.[0], char.releaseWindow?.[1])}
        </p>
      </section>

      <section className="sn-section">
        <h3 className="sn-section-title">ESTIMATED OIL CLASS</h3>
        <p className="sn-oil-class">{char.oilClass}</p>
        <p className="sn-meta">Confidence: {char.classConfidence}% · BAOAC indicative band</p>
      </section>

      <label className="mask-toggle">
        <input type="checkbox" checked={showMask} onChange={(e) => setShowMask(e.target.checked)} />
        Show detectability mask (wind &lt; 3 or &gt; 12 m/s = hatched, not assessable)
      </label>

      <p className="disclaimer evidence-disclaimer">
        All volumes and classes are satellite-derived ranges — corroboration required for forensic ID.
      </p>

      <div className="sn-actions">
        <button type="button" className="btn-secondary" onClick={onTraceOrigin}>Trace to Origin</button>
        <button type="button" className="btn-secondary" onClick={onViewOilFlow}>View in Oil Flow</button>
      </div>

      {lookAlike && (
        <div className="alert-card"><span className="status-icon-warn">⚠ LOOK-ALIKE</span> {Math.round(lookAlike.confidence * 100)}% — screened, not attributed oil</div>
      )}

      <dl className="meta-list mono technical-block">
        <div><dt>Acquisition</dt><dd>{detection?.summary?.acquisition_time_utc?.slice(0, 16)} UTC</dd></div>
        <div><dt>Incidence</dt><dd>{caseInfo?.scene?.incidence_angle_deg ?? '—'}°</dd></div>
        <div><dt>Polarization</dt><dd>{caseInfo?.scene?.polarization || 'VV+VH'}</dd></div>
      </dl>
    </div>
  )
}
