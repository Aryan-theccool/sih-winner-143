import React from 'react'
import { ensembleStats, fmtWindow, slickCharacterisation } from '../../utils/caseAnalytics'
import { originConfidence } from '../../utils/terminology'

export default function OriginPanel({ manifest, detection, driftHour, setDriftHour, onAnimate, caseInfo, originMode, userMode }) {
  if (!manifest) return <p className="loading">Loading origin estimate…</p>
  const oe = manifest.origin_estimate
  const ens = ensembleStats(manifest)
  const prob = originConfidence(manifest)
  const char = slickCharacterisation(detection, manifest)

  return (
    <div className="panel">
        <h3 className="panel-hero-title">ORIGIN RECONSTRUCTION</h3>

      <section className="panel-section">
        <h4>ESTIMATED SPILL AGE</h4>
        <p className="section-value large">{char?.ageRange || '28–42 hours'}</p>
      </section>

      <section className="panel-section">
        <h4>MOST PROBABLE RELEASE WINDOW</h4>
        <p className="section-value mono">{fmtWindow(oe.estimated_release_window_utc[0], oe.estimated_release_window_utc[1])}</p>
      </section>

      <div className="hero-metric purple">
        <span className="hero-value">{prob}%</span>
        <span className="hero-label">Probable origin confidence</span>
      </div>

      <div className="stat-grid">
        <div className="stat"><span className="stat-val">~42 km²</span><span className="stat-lbl">Credible region</span></div>
        <div className="stat"><span className="stat-val">{ens.total.toLocaleString()}+</span><span className="stat-lbl">Trajectories</span></div>
      </div>

      <section className="panel-section">
        <h4>ENSEMBLE</h4>
        <dl className="meta-list">
          <div><dt>Age hypotheses</dt><dd>{ens.hypotheses}</dd></div>
          <div><dt>Ensemble members</dt><dd>{ens.members} / hypothesis</dd></div>
          <div><dt>Environmental forcing</dt><dd>CMEMS · ERA5 · Wind · Current · Waves</dd></div>
        </dl>
      </section>

      <div className="prob-legend-bar">
        <span>LOW</span>
        <div className="prob-gradient" />
        <span>HIGH</span>
      </div>
      <p className="disclaimer">No single point is absolute truth — probability regions shown on map.</p>

      {originMode && <span className="tag tag-active">ORIGIN RECONSTRUCTION ACTIVE</span>}

      <section className="panel-section">
        <h4>HINDCAST SCRUBBER</h4>
        <input
          className="range-input"
          type="range"
          min={0}
          max={24}
          step={1}
          value={driftHour}
          onChange={(e) => setDriftHour(+e.target.value)}
          aria-label="Backward drift hours"
        />
        <p className="section-meta">Look-back · T−{driftHour} h</p>
      <button type="button" className="btn-secondary" onClick={() => props.setView?.('vessels')}>
        VIEW CANDIDATE VESSELS
      </button>
      </section>

      {userMode === 'analyst' && (
        <dl className="meta-list mono">
          <div><dt>Centroid (p50)</dt><dd>{oe.lon}°E · {oe.lat}°N</dd></div>
          <div><dt>Detection time</dt><dd>{caseInfo?.t0_utc?.slice(0, 16)} UTC</dd></div>
        </dl>
      )}
    </div>
  )
}
