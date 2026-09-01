import React from 'react'
import { ensembleStats, fmtWindow, slickCharacterisation } from '../../utils/caseAnalytics'
import { originConfidence } from '../../utils/terminology'

export default function OriginPanel({
  manifest, detection, driftHour, setDriftHour, setView,
  caseInfo, originMode, originPlaying, setOriginPlaying,
}) {
  if (!manifest) return <p className="loading">Loading origin estimate…</p>
  const oe = manifest.origin_estimate
  const ens = ensembleStats(manifest)
  const prob = originConfidence(manifest)
  const char = slickCharacterisation(detection, manifest)

  return (
    <div className="panel">
      <div className="evidence-tags">
        <span className="tag tag-inference">MODEL · ENSEMBLE</span>
        <span className="tag tag-probable">PROBABLE ORIGIN</span>
      </div>

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
        <span className="hero-value anim-count">{prob}%</span>
        <span className="hero-label">Probable origin confidence</span>
      </div>

      <div className="stat-grid">
        <div className="stat"><span className="stat-val">~42 km²</span><span className="stat-lbl">Credible region (p50)</span></div>
        <div className="stat"><span className="stat-val">{ens.total.toLocaleString()}+</span><span className="stat-lbl">Trajectories</span></div>
      </div>

      <section className="panel-section">
        <h4>ENSEMBLE READOUT</h4>
        <dl className="meta-list">
          <div><dt>Age hypotheses</dt><dd>{ens.hypotheses} h marginalized</dd></div>
          <div><dt>Members / hypothesis</dt><dd>{ens.members}</dd></div>
          <div><dt>Forcing</dt><dd>{ens.forcing}</dd></div>
        </dl>
      </section>

      <p className="origin-readout mono">
        Most likely origin window: <strong>{driftHour}–{Math.min(24, driftHour + 4)} h</strong> before detection
      </p>

      {originMode && <span className="tag tag-active pulse-tag">ORIGIN RECONSTRUCTION ACTIVE</span>}

      <section className="panel-section">
        <div className="origin-controls">
          <h4>HINDCAST SCRUBBER · T−{driftHour} h</h4>
          <button
            type="button"
            className={`btn-play-origin ${originPlaying ? 'active' : ''}`}
            onClick={() => setOriginPlaying?.((p) => !p)}
          >
            {originPlaying ? '⏸ PAUSE HINDCAST' : '▶ AUTO-PLAY HINDCAST'}
          </button>
        </div>
        <input
          className="range-input anim-range"
          type="range"
          min={0}
          max={24}
          step={1}
          value={driftHour}
          onChange={(e) => setDriftHour(+e.target.value)}
          aria-label="Backward drift hours"
        />
        <div className="range-ticks">
          <span>0 h</span><span>12 h</span><span>24 h</span>
        </div>
        <button type="button" className="btn-secondary" onClick={() => setView?.('vessels')}>
          View Candidate Vessels
        </button>
      </section>

      <p className="disclaimer evidence-disclaimer">
        Uncertainty shrinks toward a plausible origin as the hindcast runs — no single point is ground truth.
      </p>

      <dl className="meta-list mono">
        <div><dt>Centroid (p50)</dt><dd>{oe.lon}°E · {oe.lat}°N</dd></div>
        <div><dt>Detection time</dt><dd>{caseInfo?.t0_utc?.slice(0, 16)} UTC</dd></div>
      </dl>
    </div>
  )
}
