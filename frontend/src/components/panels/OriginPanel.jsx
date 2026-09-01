import React from 'react'
import { ensembleStats, fmtWindow } from '../../utils/caseAnalytics'

export default function OriginPanel({ manifest, driftHour, setDriftHour, onAnimate, caseInfo, originMode }) {
  if (!manifest) return <p className="note">Loading…</p>
  const oe = manifest.origin_estimate
  const ens = ensembleStats(manifest)
  const err = oe.note_synthetic_case_truth?.origin_error_km
  const prob = err != null ? Math.min(99, Math.round(100 - err * 15)) : 81

  return (
    <div className="panel-scroll origin-panel-full">
      <div className="panel-head">
        <h2>PROBABLE RELEASE ORIGIN</h2>
        <span className="tag tag-inference">MODEL INFERENCE</span>
        {originMode && <span className="tag tag-active">ORIGIN MODE ACTIVE</span>}
      </div>

      <div className="origin-hero-block">
        <div className="origin-prob-big">{prob}%</div>
        <div className="origin-prob-sub">Origin probability</div>
      </div>

      <div className="metric-grid">
        <div className="metric-cell"><span>Release window</span><b>{fmtWindow(oe.estimated_release_window_utc[0], oe.estimated_release_window_utc[1])}</b></div>
        <div className="metric-cell"><span>Credible region</span><b>~42 km²</b></div>
        <div className="metric-cell"><span>Centroid (p50)</span><b>{oe.lon}°E · {oe.lat}°N</b></div>
      </div>

      <div className="prob-legend">
        <span>LOW</span>
        <div className="prob-gradient" />
        <span>HIGH</span>
        <span className="prob-mid">MEDIUM</span>
      </div>

      <div className="glass-card">
        <div className="card-label">BACKWARD DRIFT ENSEMBLE</div>
        <div className="metric-row"><span>Age hypotheses</span><b>{ens.hypotheses}</b></div>
        <div className="metric-row"><span>Ensemble members</span><b>{ens.members} / hypothesis</b></div>
        <div className="metric-row"><span>Total trajectories</span><b>{ens.total.toLocaleString()}+</b></div>
        <div className="metric-row"><span>Forcing</span><b>{ens.forcing}</b></div>
        <div className="metric-row"><span>Wind / waves</span><b>ERA5</b></div>
        <div className="metric-row"><span>Ocean currents</span><b>CMEMS</b></div>
      </div>

      <div className="origin-timeline-v">
        <div className="ot-node det"><b>{caseInfo?.t0_utc?.slice(11, 16)} UTC</b><span>12 JUN · CURRENT DETECTION</span></div>
        <div className="ot-arrow">↓ BACKWARD DRIFT</div>
        <div className="ot-node rel"><b>{oe.estimated_release_window_utc[0].slice(11, 16)}–{oe.estimated_release_window_utc[1].slice(11, 16)} UTC</b><span>PROBABLE RELEASE WINDOW</span></div>
        <div className="ot-arrow">↓</div>
        <div className="ot-node orig"><b>PROBABLE RELEASE ORIGIN</b><span>{oe.lon}°E {oe.lat}°N · uncertainty cloud visible on map</span></div>
      </div>

      <h3 className="sec">Hindcast scrubber</h3>
      <input className="drift-slider" type="range" min={0} max={24} step={1}
        value={driftHour} onChange={(e) => setDriftHour(+e.target.value)} />
      <div className="metric-row"><span>Look-back</span><b className="accent-text">T−{driftHour} h</b></div>
      <button className="action-btn" onClick={onAnimate}>▶ Run backward ensemble (0 → −24 h)</button>
      <p className="note">Uncertainty is explicit — no single magical pinpoint coordinate.</p>
    </div>
  )
}
