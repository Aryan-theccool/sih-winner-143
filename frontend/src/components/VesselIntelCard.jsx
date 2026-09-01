import React from 'react'
import { FEATURE_LABELS, featurePct } from '../utils/caseAnalytics'
import { vesselAt } from '../utils/vesselMotion'

export default function VesselIntelCard({
  candidate, vessel, simTime, manifest, rank, onViewTrack, onViewEvidence,
}) {
  const score = Math.round(candidate.score * 100)
  const f = candidate.features || {}
  const st = vessel ? vesselAt(vessel, simTime) : null
  const exonerated = f.late_arrival > 0.5
  const rw = manifest?.origin_estimate?.estimated_release_window_utc

  return (
    <div className="intel-card vessel-intel">
      <div className="ic-header">
        <span className="ic-rank mono">CANDIDATE #{rank || candidate.rank}</span>
        {!exonerated && <span className="ic-badge high">VERIFY</span>}
        {exonerated && <span className="ic-badge excluded">TEMPORALLY EXCLUDED</span>}
      </div>
      <div className="ic-name">{candidate.name}</div>
      <div className="ic-type">{candidate.type} · {candidate.flag}</div>

      {exonerated && (
        <p className="ic-exonerate">
          Vessel entered the affected region after the inferred release window.
        </p>
      )}

      <div className="ic-grid mono">
        <div><span>MMSI</span><b>{candidate.mmsi}</b></div>
        {st && (
          <>
            <div><span>SPEED</span><b>{st.speed.toFixed(1)} kn</b></div>
            <div><span>HEADING</span><b>{Math.round(st.heading)}°</b></div>
            <div><span>POS</span><b>{st.position[1].toFixed(3)}°N {st.position[0].toFixed(3)}°E</b></div>
          </>
        )}
      </div>

      <div className="ic-score">
        <span className="ic-score-val">{score}%</span>
        <span className="ic-score-lbl">ATTRIBUTION SCORE</span>
      </div>

      {!exonerated && rank === 1 && (
        <div className="ic-decomp">
          {['origin_mass', 'deep_hour_mass', 'cpa_km', 'gap_overlap_h', 'late_arrival'].map((k) => (
            <div key={k} className="ic-decomp-row">
              <span>{FEATURE_LABELS[k]}</span>
              <b>{k === 'late_arrival' ? (f[k] === 0 ? 'PASS' : `${featurePct(k, f[k])}%`) : `${featurePct(k, f[k] ?? 0)}%`}</b>
            </div>
          ))}
        </div>
      )}

      {rw && !exonerated && (
        <div className="ic-release mono">
          <span>PROBABLE POSITION AT RELEASE</span>
          <b>{rw[0].slice(11, 16)}–{rw[1].slice(11, 16)} UTC</b>
        </div>
      )}

      <div className="ic-actions">
        <button onClick={onViewTrack}>VIEW FULL TRACK</button>
        <button onClick={onViewEvidence}>VIEW EVIDENCE</button>
      </div>
    </div>
  )
}
