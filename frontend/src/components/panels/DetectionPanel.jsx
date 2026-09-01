import React from 'react'
import { slickCharacterisation, fmtUtc, fmtWindow } from '../../utils/caseAnalytics'

export default function DetectionPanel({ detection, manifest, showMask, setShowMask, caseInfo }) {
  const char = slickCharacterisation(detection, manifest)
  const lookAlike = detection?.summary?.objects?.find((o) => o.class === 'look_alike')

  if (!char) return <p className="note">Loading…</p>

  return (
    <div className="panel-scroll">
      <div className="panel-head">
        <h2>SLICK CHARACTERISATION</h2>
        <span className="tag tag-observed">OBSERVED + INFERRED</span>
      </div>

      <div className="metric-hero">
        <div className="metric-big">
          <span className="val">{char.probability}%</span>
          <span className="lbl">Oil-slick probability</span>
        </div>
      </div>

      <div className="metric-grid">
        <div className="metric-cell"><span>Area</span><b>{char.area} km²</b></div>
        <div className="metric-cell"><span>SAR darkening</span><b>{char.darkening} dB</b></div>
        <div className="metric-cell"><span>Surface wind</span><b>{char.wind} m/s</b></div>
        <div className="metric-cell"><span>Thickness (est.)</span><b>{char.thicknessUm[0]}–{char.thicknessUm[1]} µm</b></div>
        <div className="metric-cell"><span>Volume (BAOAC-indicative)</span><b>{char.volumeM3[0]}–{char.volumeM3[1]} m³</b></div>
        <div className="metric-cell"><span>Morphology</span><b>{char.morphology}</b></div>
        <div className="metric-cell"><span>Persistence</span><b>{char.persistence}</b></div>
      </div>

      <div className="glass-card compact">
        <div className="card-label">SCENE METADATA <span className="tag tag-observed">OBSERVED</span></div>
        <div className="metric-row"><span>Acquisition</span><b className="mono">{fmtUtc(detection?.summary?.acquisition_time_utc)}</b></div>
        <div className="metric-row"><span>Incidence angle</span><b className="mono">{caseInfo?.scene?.incidence_angle_deg ?? '—'}°</b></div>
        <div className="metric-row"><span>Wind at capture</span><b className="mono">{char.wind} m/s @ {caseInfo?.scene?.wind_direction_deg ?? '—'}°</b></div>
        <div className="metric-row"><span>Polarization</span><b>{caseInfo?.scene?.polarization || 'VV+VH'}</b></div>
      </div>

      <div className="glass-card">
        <div className="card-label">ESTIMATED OIL CLASS <span className="tag tag-inference">INFERRED</span></div>
        <div className="oil-class">{char.oilClass}</div>
        <div className="oil-class-conf">Confidence: {char.classConfidence}%</div>
        <p className="disclaimer-sm">
          Satellite-derived classification — requires corroboration for forensic identification.
        </p>
      </div>

      <div className="glass-card age-card">
        <div className="card-label">ESTIMATED SPILL AGE <span className="tag tag-inference">INFERRED</span></div>
        <div className="age-hero">{char.ageRange}</div>
        <p className="disclaimer-sm">Probable release window — not an exact occurrence time</p>
        <div className="age-factors">
          {['Slick morphology', 'SAR backscatter evolution', 'Wind history', 'Ocean currents',
            'Drift reconstruction', 'Multi-temporal imagery'].map((f) => (
            <div key={f} className="factor">• {f}</div>
          ))}
        </div>
      </div>

      <div className="age-timeline">
        <div className="at-node"><b>{fmtUtc(manifest?.detection_time_utc, { timeOnly: true })}</b><span>CURRENT DETECTION</span></div>
        <div className="at-arrow">↓</div>
        <div className="at-node"><b>11 JUN</b><span>SLICK EVOLUTION</span></div>
        <div className="at-arrow">↓</div>
        <div className="at-node"><b>{fmtWindow(char.releaseWindow?.[0], char.releaseWindow?.[1])}</b><span>PROBABLE RELEASE WINDOW</span></div>
        <div className="at-arrow">↓</div>
        <div className="at-node"><b>10 JUN</b><span>CANDIDATE VESSELS</span></div>
      </div>

      {lookAlike && (
        <div className="glass-card card-amber">
          <div className="card-label">LOOK-ALIKE · {lookAlike.object_id}</div>
          <div className="metric-row"><span>Probability</span><b>{Math.round(lookAlike.confidence * 100)}%</b></div>
          <div className="metric-row"><span>Reason</span><b>Low-wind / environmental ambiguity</b></div>
        </div>
      )}

      <label className="toggle">
        <input type="checkbox" checked={showMask} onChange={(e) => setShowMask(e.target.checked)} />
        Low-detectability region (wind outside 3–12 m/s)
      </label>
    </div>
  )
}
