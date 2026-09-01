import React from 'react'
import { Card, Tag, Callout, Btn, Metric } from '../ui'
import { Term } from '../Glossary'
import { ensembleStats, fmtWindow, slickCharacterisation } from '../../utils/caseAnalytics'
import { originConfidence } from '../../utils/terminology'

const CONTOURS = [
  { id: 'p10', label: 'Core', color: '#fb923c', note: 'Middle 10% of trajectories — the most likely strip.' },
  { id: 'p50', label: 'Credible', color: '#ec4899', note: 'Middle 50% — the area a report would quote.' },
  { id: 'p90', label: 'Plausible', color: '#8b5cf6', note: 'Middle 90% — everything the model cannot rule out.' },
]

export default function OriginPanel({
  manifest, detection, driftHour, setDriftHour, setView,
  caseInfo, originMode, originPlaying, setOriginPlaying,
}) {
  if (!manifest) return <p className="sn-loading">Loading origin estimate…</p>
  const oe = manifest.origin_estimate
  const ens = ensembleStats(manifest)
  const prob = originConfidence(manifest)
  const char = slickCharacterisation(detection, manifest)
  const hours = ens.hypotheses

  return (
    <div className="sn-p">
      <div className="sn-tagrow">
        <Tag tone="inferred" />
        <Tag tone="probable" />
      </div>

      <Callout tone="purple" title="WHAT THIS SCREEN DOES">
        It plays the ocean backwards. Thousands of virtual oil parcels are pushed upstream through the same
        currents and wind that moved the slick, until they converge on the place the discharge most plausibly
        happened. That area is a <Term k="credible">probability cloud</Term>, never a pin.
      </Callout>

      <Card title="MOST PROBABLE RELEASE WINDOW" right={<span className="sn-card-ref mono">T−{driftHour} H</span>}>
        <div className="sn-hero col">
          <div className="sn-hero-value tone-purple">
            {fmtWindow(oe.estimated_release_window_utc[0], oe.estimated_release_window_utc[1])}
          </div>
          <div className="sn-hero-side">
            <div className="sn-hero-lbl">
              <Term k="release">Release window</Term> · derived, not reported
            </div>
            <div className="sn-metric-grid">
              <Metric value={`${prob}`} unit="%" label="Origin confidence" tone="purple" />
              <Metric value={`~42`} unit="km²" label="Credible region (p50)" />
            </div>
          </div>
        </div>
        <div className="sn-facts">
          <div className="sn-fact"><span className="mono">ESTIMATED SPILL AGE</span><b className="mono">{char?.ageRange || '—'}</b></div>
          <div className="sn-fact"><span className="mono">ORIGIN CENTRE</span><b className="mono">{oe.lon}°E · {oe.lat}°N</b></div>
          <div className="sn-fact"><span className="mono">SAR DETECTED</span><b className="mono">{caseInfo?.t0_utc?.slice(0, 16).replace('T', ' ')} UTC</b></div>
        </div>
      </Card>

      <Card title="SCRUB THE HINDCAST" note="Fewer hours back = where the oil was recently. More hours = where it came from.">
        <div className="sn-scrub">
          <div className="sn-scrub-head">
            <span className="sn-scrub-big mono">T−{String(driftHour).padStart(2, '0')}<small>h</small></span>
            <button
              type="button"
              className={`sn-scrub-play ${originPlaying ? 'active' : ''}`}
              onClick={() => setOriginPlaying?.((p) => !p)}
            >
              {originPlaying ? '❙❙ PAUSE' : '▶ AUTO-PLAY'}
            </button>
          </div>
          <input
            className="sn-range"
            type="range"
            min={0}
            max={hours}
            step={1}
            value={driftHour}
            onChange={(e) => setDriftHour?.(+e.target.value)}
            aria-label="Hours before detection"
          />
          <div className="sn-scrub-ticks mono">
            {[0, 6, 12, 18, 24].filter((h) => h <= hours).map((h) => (
              <button type="button" key={h} className={driftHour === h ? 'active' : ''} onClick={() => setDriftHour?.(h)}>
                {h}h
              </button>
            ))}
          </div>
          <p className="sn-scrub-note">
            {driftHour <= 2
              ? 'Almost no time has passed — the cloud still matches the slick you saw.'
              : driftHour >= hours - 2
                ? 'Fully reversed: this is the tightest the model can get, around the probable release area.'
                : `Rewinding ${driftHour} hours — the cloud is narrowing as trajectories that cannot reach the slick are dropped.`}
          </p>
        </div>
        {originMode && <span className="sn-tag tone-active pulse-tag">HINDCAST ACTIVE ON THE MAP</span>}
      </Card>

      <Card title="HOW TO READ THE CLOUD">
        <ul className="sn-contours">
          {CONTOURS.map((c) => (
            <li key={c.id}>
              <span className="sn-contour-swatch" style={{ background: `${c.color}33`, borderColor: c.color }} />
              <div>
                <b>{c.label} <span className="mono">{c.id}</span></b>
                <p>{c.note}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="BEHIND THE NUMBERS">
        <div className="sn-kv">
          <div className="sn-kv-row"><dt>Ensemble members</dt><dd className="mono">{ens.total.toLocaleString()}+ trajectories</dd></div>
          <div className="sn-kv-row"><dt>Age hypotheses</dt><dd className="mono">{ens.hypotheses} h, marginalised</dd></div>
          <div className="sn-kv-row"><dt>Members / hypothesis</dt><dd className="mono">{ens.members}</dd></div>
          <div className="sn-kv-row"><dt>Ocean forcing</dt><dd className="mono">{ens.forcing}</dd></div>
          <div className="sn-kv-row"><dt>Windage</dt><dd className="mono">{Math.round((manifest.physics?.windage || 0.03) * 100)}% of U10</dd></div>
          <div className="sn-kv-row"><dt>Diffusion Kh</dt><dd className="mono">{manifest.physics?.diffusion_kh_m2s} m²/s</dd></div>
          <div className="sn-kv-row"><dt>Engine</dt><dd className="mono">{manifest.engine}</dd></div>
        </div>
        <Callout tone="info" title="WHY IT IS NEVER ONE POINT">
          Currents are sampled, wind is gridded and the slick edge is fuzzy. The honest answer is an area with
          odds attached — a single coordinate would imply precision the data cannot support.
        </Callout>
      </Card>

      <div className="sn-actions">
        <Btn variant="primary" onClick={() => setView?.('vessels')}>Who was there at that time?</Btn>
      </div>
    </div>
  )
}
