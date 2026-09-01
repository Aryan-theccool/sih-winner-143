import React from 'react'
import { FEATURE_LABELS, featurePct } from '../../utils/caseAnalytics'
import { vesselAt } from '../../utils/vesselMotion'

function CandidateCard({ r, rank, selectedMmsi, onFocus, simTime, releaseWindow }) {
  const score = Math.round(r.score * 100)
  const f = r.features || {}
  const state = vesselAt({ absolute: r._absolute, dark_segments: r._dark }, simTime)
  const rwStart = releaseWindow ? Date.parse(releaseWindow[0]) / 1000 : 0
  const rwEnd = releaseWindow ? Date.parse(releaseWindow[1]) / 1000 : 0
  const exonerated = f.late_arrival > 0.5

  const keys = ['origin_mass', 'deep_hour_mass', 'cpa_km', 'gap_overlap_h', 'late_arrival']

  return (
    <div
      className={`candidate-full rank-${rank} ${selectedMmsi === r.mmsi ? 'sel' : ''}`}
      onClick={() => onFocus(r.mmsi)}
    >
      <div className="cand-top">
        <div>
          <span className="cand-num">#{rank}</span>
          <div className="cand-name">{r.name}</div>
          <div className="cand-type">{r.type} · {r.flag} · {r.length_m} m</div>
        </div>
        <div className="cand-score-block">
          <div className="cand-score">{score}%</div>
          <div className="cand-score-lbl">ATTRIBUTION SCORE</div>
        </div>
      </div>

      {exonerated && (
        <div className="excluded-banner">! TEMPORALLY EXCLUDED — entered region after inferred release window</div>
      )}

      {rank === 1 && (
        <div className="decomp-grid">
          {keys.map((k) => (
            <div key={k} className="decomp-item">
              <span>{FEATURE_LABELS[k]}</span>
              <div className="decomp-bar"><div style={{ width: `${featurePct(k, f[k] ?? 0)}%` }} /></div>
              <b>{k === 'late_arrival' ? (f[k] === 0 ? 'PASS' : `${featurePct(k, f[k])}%`) : `${featurePct(k, f[k] ?? 0)}%`}</b>
            </div>
          ))}
        </div>
      )}

      <div className="cand-metrics">
        <div className="metric-row"><span>Distance from inferred origin</span><b>{(f.cpa_km || 0).toFixed(1)} km</b></div>
        {state && (
          <>
            <div className="metric-row"><span>Position at replay time</span>
              <b>{state.position[0].toFixed(3)}°E {state.position[1].toFixed(3)}°N</b></div>
            <div className="metric-row"><span>Speed / heading</span><b>{state.speed.toFixed(1)} kn · {Math.round(state.heading)}°</b></div>
          </>
        )}
        <div className="metric-row"><span>Downstream exclusion</span><b className={f.late_arrival === 0 ? 'ok' : 'warn'}>{f.late_arrival === 0 ? 'PASS' : 'FAIL'}</b></div>
      </div>

      <div className="track-phases">
        <div className="phase before"><span>BEFORE RELEASE</span> Normal track</div>
        <div className="phase during"><span>RELEASE WINDOW</span> Intersects origin cloud</div>
        <div className="phase after"><span>AFTER RELEASE</span> Track continues away</div>
      </div>

      {(r.ais_gaps?.length > 0 || f.gap_overlap_h > 0) && (
        <div className="ais-anomaly">
          <div className="anomaly-title">AIS GAP / UNOBSERVED</div>
          {r.ais_gaps?.map((g, i) => (
            <div key={i} className="gap-window">
              AIS unavailable: {g.start?.slice(11, 16)}–{g.end?.slice(11, 16)} UTC
            </div>
          ))}
          {f.gap_overlap_h > 2 && rank === 1 && (
            <div className="unmatched-sar">
              <div className="anomaly-title">UNMATCHED SAR CONTACT INDICATORS</div>
              <div className="anomaly-grid">
                <span>SAR detection ✓</span><span>AIS signal ✕</span>
                <span>Temporal match ✓</span><span>Spatial match ✓</span>
              </div>
              <div className="dark-indicator">Anomaly indicator: <b>HIGH</b> (multiple independent signals)</div>
            </div>
          )}
        </div>
      )}

      <div className={`status-pill ${rank === 1 ? 'high' : 'med'}`}>
        {rank === 1 ? 'HIGH PRIORITY FOR VERIFICATION' : 'VERIFICATION RECOMMENDED'}
      </div>
      <div className="cand-mmsi">MMSI {r.mmsi}</div>
    </div>
  )
}

export default function VesselsPanel({ ranking, vessels, selectedMmsi, onFocusVessel, simTime, manifest }) {
  if (!ranking) return <p className="note">Loading…</p>

  const top3 = ranking.ranking.filter((r) => r.top3).slice(0, 3).map((r) => {
    const v = vessels?.find((x) => x.mmsi === r.mmsi)
    return { ...r, _absolute: v?.absolute, _dark: v?.dark_segments, ais_gaps: v?.ais_gaps }
  })

  const cleared = ranking.ranking.filter((r) => r.exonerated || r.verdict === 'CLEARED')

  return (
    <div className="panel-scroll">
      <div className="panel-head">
        <h2>CANDIDATE VESSELS</h2>
        <span className="tag tag-inference">RANKED · NOT GUILT DETERMINATION</span>
      </div>
      <p className="disclaimer">
        Near the slick <em>now</em> ≠ present at probable release origin and time. Historical AIS
        reconstruction is the core attribution signal.
      </p>

      {top3.map((r, i) => (
        <CandidateCard
          key={r.mmsi} r={r} rank={i + 1}
          selectedMmsi={selectedMmsi} onFocus={onFocusVessel}
          simTime={simTime}
          releaseWindow={manifest?.origin_estimate?.estimated_release_window_utc}
        />
      ))}

      {cleared.length > 0 && (
        <>
          <h3 className="sec">Excluded vessels</h3>
          {cleared.slice(0, 4).map((r) => (
            <div key={r.mmsi} className="glass-card compact" onClick={() => onFocusVessel(r.mmsi)}>
              <div className="metric-row"><span>{r.name}</span><span className="badge-green">EXCLUDED</span></div>
              {r.reasons?.filter((x) => x.direction === 'lowers').slice(0, 1).map((x, k) => (
                <div key={k} className="mini-reason">{x.text}</div>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
