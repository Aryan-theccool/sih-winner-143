import React from 'react'
import { FEATURE_LABELS, featurePct } from '../utils/caseAnalytics'
import { vesselAt } from '../utils/vesselMotion'

export default function VesselIntelCard({
  candidate, vessel, simTime, manifest, rank, onViewTrack, onViewEvidence, onWhy,
}) {
  const score = Math.round(candidate.score * 100)
  const f = candidate.features || {}
  const st = vessel ? vesselAt(vessel, simTime) : null
  const exonerated = f.late_arrival > 0.5
  const rw = manifest?.origin_estimate?.estimated_release_window_utc
  const gap = vessel?.ais_gaps?.[0]

  return (
    <div className="vessel-card">
      <div className="vc-header">
        <span className="vc-rank">CANDIDATE VESSEL #{rank || candidate.rank}</span>
        {exonerated ? (
          <span className="status-badge excluded">! TEMPORALLY EXCLUDED</span>
        ) : (
          <span className="status-badge priority">! HIGH PRIORITY</span>
        )}
      </div>

      <h3 className="vc-name">{candidate.name}</h3>
      <p className="vc-type">{candidate.type}</p>

      {exonerated && (
        <p className="vc-exonerate">
          Vessel entered the affected region after the inferred release window.
        </p>
      )}

      {st && (
        <div className="vc-motion">
          <span>{st.speed.toFixed(1)} kn</span>
          <span>{Math.round(st.heading)}°</span>
        </div>
      )}

      <dl className="vc-ids mono">
        <div><dt>MMSI</dt><dd>{candidate.mmsi}</dd></div>
        <div><dt>IMO</dt><dd>{candidate.imo || '—'}</dd></div>
      </dl>

      {!exonerated && (
        <>
          <div className="vc-score-block">
            <span className="vc-score">{score}%</span>
            <span className="vc-score-lbl">ATTRIBUTION SCORE</span>
          </div>

          <div className="vc-features">
            {['origin_mass', 'deep_hour_mass', 'cpa_km', 'gap_overlap_h', 'late_arrival'].map((k) => (
              <div key={k} className="vc-feat">
                <span>{FEATURE_LABELS[k]}</span>
                <b>{k === 'late_arrival' ? (f[k] === 0 ? 'PASS' : `${featurePct(k, f[k])}%`) : `${featurePct(k, f[k] ?? 0)}%`}</b>
              </div>
            ))}
          </div>

          <button type="button" className="btn-primary" onClick={onWhy}>
            WHY THIS VESSEL?
          </button>
        </>
      )}

      {gap && (
        <div className="ais-gap-card">
          <div className="gap-title">AIS GAP</div>
          <p className="mono">AIS unavailable · {gap.start?.slice(11, 16)}–{gap.end?.slice(11, 16)} UTC</p>
          {f.gap_overlap_h > 2 && (
            <>
              <div className="gap-title warn">UNMATCHED SAR CONTACT</div>
              <p className="mono">SAR contact · 10 Jun · 05:11 UTC</p>
              <p>Dark-vessel indicator · <b>HIGH</b></p>
            </>
          )}
        </div>
      )}

      {rw && !exonerated && (
        <div className="vc-release mono">
          <span>Probable position at release</span>
          <b>{rw[0].slice(11, 16)}–{rw[1].slice(11, 16)} UTC</b>
        </div>
      )}

      <div className="vc-actions">
        <button type="button" onClick={onViewTrack}>View track</button>
        <button type="button" onClick={onViewEvidence}>View evidence</button>
      </div>
    </div>
  )
}
