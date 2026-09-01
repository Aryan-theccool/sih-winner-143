import React, { useState } from 'react'
import { Term } from './Glossary'
import { FEATURE_LABELS, featurePct } from '../utils/caseAnalytics'
import { vesselAt } from '../utils/vesselMotion'

/** Pinned when an analyst clicks a ship on the map — the short answer, with a way in. */
export default function VesselIntelCard({
  candidate, vessel, simTime, manifest, rank,
  onViewTrack, onViewEvidence, onWhy, onClear,
}) {
  const score = Math.round(candidate.score * 100)
  const f = candidate.features || {}
  const st = vessel ? vesselAt(vessel, simTime) : null
  const exonerated = f.late_arrival > 0.5
  const rw = manifest?.origin_estimate?.estimated_release_window_utc
  const gap = vessel?.ais_gaps?.[0]
  const [open, setOpen] = useState(true)

  return (
    <div className={`sn-pin ${exonerated ? 'cleared' : 'hot'} ${open ? '' : 'min'}`}>
      <header className="sn-pin-head">
        <span className="sn-pin-rank mono">CANDIDATE #{rank || candidate.rank || 1}</span>
        <span className="sn-pin-badge">{exonerated ? 'RULED OUT' : 'VERIFY FIRST'}</span>
        <button
          type="button"
          className="sn-pin-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          title={open ? 'Collapse' : 'Expand'}
        >
          {open ? '▾' : '▸'}
        </button>
        <button type="button" className="sn-pin-close" onClick={onClear} aria-label="Clear selection" title="Clear selection">×</button>
      </header>

      <button type="button" className="sn-pin-title" onClick={() => setOpen((o) => !o)}>
        <h3>{candidate.name}</h3>
        <p>{candidate.type} · {candidate.flag} · {candidate.length_m} m</p>
        {!open && (
          <span className="sn-pin-summary mono">
            {score}% model fit{exonerated ? ' · excluded on timing' : gap ? ' · beacon gap in window' : ''}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="sn-pin-score">
            <b>{score}<small>%</small></b>
            <div>
              <span className="sn-pin-score-lbl"><Term k="score">Model fit</Term> · normalised 0–100</span>
              <div className="sn-pin-meter"><div style={{ width: `${score}%` }} /></div>
            </div>
          </div>

          {exonerated ? (
            <p className="sn-pin-note">
              Entered the affected area after the release window closed — the model can exclude it.
            </p>
          ) : (
            <ul className="sn-pin-feats">
              {['origin_mass', 'deep_hour_mass', 'cpa_km', 'gap_overlap_h'].map((k) => (
                <li key={k}>
                  <span>{FEATURE_LABELS[k]}</span>
                  <b className="mono">{featurePct(k, f[k] ?? 0)}%</b>
                </li>
              ))}
            </ul>
          )}

          {st && (
            <div className="sn-pin-motion mono">
              <span>{st.speed.toFixed(1)} kn</span>
              <span>{Math.round(st.heading)}°</span>
              <span>{st.position[0].toFixed(3)}°E {st.position[1].toFixed(3)}°N</span>
            </div>
          )}

          {rw && !exonerated && (
            <div className="sn-pin-release">
              <span className="mono">AT RELEASE</span>
              <b>{rw[0].slice(11, 16)}–{rw[1].slice(11, 16)} UTC</b>
              {gap && <em className="mono">AIS off {gap.start?.slice(11, 16)}–{gap.end?.slice(11, 16)}</em>}
            </div>
          )}

          <div className="sn-pin-actions">
            {!exonerated && <button type="button" onClick={onWhy}>Why this ship?</button>}
            <button type="button" onClick={onViewTrack}>Track</button>
            <button type="button" onClick={onViewEvidence}>Evidence</button>
          </div>
        </>
      )}
    </div>
  )
}
