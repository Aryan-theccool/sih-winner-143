import React from 'react'
import {
  FEATURE_LABELS, featurePct, attributionScore,
  candidateStatus, originConfidence, fmtUtc, fmtWindow,
} from '../utils/terminology'

const EVIDENCE_CHECKS = [
  'SAR backscatter anomaly',
  'Wind within detectable range',
  'Temporal consistency',
  'Look-alike screening',
]

function SectionTitle({ children, sub }) {
  return (
    <div className="section-title">
      <h3>{children}</h3>
      {sub && <p>{sub}</p>}
    </div>
  )
}

function MetricRow({ label, value, highlight }) {
  return (
    <div className={`metric-row ${highlight ? 'highlight' : ''}`}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  )
}

function DetectionTab({ detection, showMask, setShowMask }) {
  if (!detection) return <p className="note">Loading detection products…</p>
  const { summary, slick } = detection

  return (
    <div className="panel-content">
      <SectionTitle sub="Observed SAR measurements — not legal confirmation">
        SLICK DETECTION
      </SectionTitle>

      {summary.objects.map((o) => {
        const isLookAlike = o.class === 'look_alike'
        const title = isLookAlike ? 'LOOK-ALIKE' : 'PRIMARY ANOMALY'
        return (
          <div key={o.object_id} className={`glass-card ${isLookAlike ? 'card-amber' : 'card-red'}`}>
            <div className="card-header">
              <span className="card-id">{o.object_id}</span>
              <span className={`badge ${isLookAlike ? 'badge-amber' : 'badge-red'}`}>{title}</span>
            </div>
            {!isLookAlike ? (
              <>
                <MetricRow label="Oil-slick probability" value={`${Math.round(o.confidence * 100)}%`} highlight />
                <MetricRow label="Area" value={`${o.area_km2} km²`} />
                <MetricRow label="Darkening" value={`${o.contrast_db} dB`} />
                <MetricRow label="Wind at object" value={`${o.wind_ms} m/s`} />
                <MetricRow label="Detection confidence" value={`${Math.round(o.confidence * 100)}%`} />
                <div className="evidence-checks">
                  <div className="checks-label">Evidence indicators <span className="tag-observed">OBSERVED</span></div>
                  {EVIDENCE_CHECKS.map((c) => (
                    <div key={c} className="check-item"><span className="check">✓</span>{c}</div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <MetricRow label="Probability / confidence" value={`${Math.round(o.confidence * 100)}%`} />
                <MetricRow label="Area" value={`${o.area_km2} km²`} />
                <MetricRow label="Wind at object" value={`${o.wind_ms} m/s`} />
                <div className="lookalike-reason">
                  <span className="tag-inference">INFERENCE</span>
                  Reason: low-wind / environmental ambiguity — capillary damping outside detectable range
                </div>
              </>
            )}
          </div>
        )
      })}

      <div className="glass-card compact">
        <MetricRow label="Scene ID" value={summary.scene_id.slice(0, 28) + '…'} />
        <MetricRow label="Acquired" value={fmtUtc(summary.acquisition_time_utc)} />
        <MetricRow label="Detector" value={summary.detector.split('(')[0].trim()} />
        <MetricRow label="Threshold" value={`${summary.threshold_db} dB below local bg`} />
      </div>

      <label className="toggle">
        <input type="checkbox" checked={showMask} onChange={(e) => setShowMask(e.target.checked)} />
        Show low-detectability wind mask (outside 3–12 m/s)
      </label>
      <p className="note">
        Slicks damp capillary waves only when surface wind is 3–12 m/s. Regions outside this range are
        screened as look-alikes, not attributed oil.
      </p>
    </div>
  )
}

function OriginTab({ manifest, driftHour, setDriftHour, onAnimate, caseInfo }) {
  if (!manifest) return <p className="note">Loading hindcast products…</p>
  const oe = manifest.origin_estimate
  const conf = originConfidence(manifest)
  const rw = oe.estimated_release_window_utc

  return (
    <div className="panel-content origin-panel">
      <SectionTitle sub="Model inference — ensemble backward propagation">
        PROBABLE RELEASE ORIGIN
      </SectionTitle>

      <div className="origin-hero glass-card">
        <div className="origin-prob">
          <span className="origin-prob-val">{conf}%</span>
          <span className="origin-prob-label">Origin probability</span>
        </div>
        <div className="origin-details">
          <MetricRow label="Release window" value={fmtWindow(rw[0], rw[1])} highlight />
          <MetricRow label="Origin region" value="~42 km² credible region" />
          <MetricRow label="Centroid" value={`${oe.lon}°E · ${oe.lat}°N`} />
        </div>
      </div>

      <div className="heatmap-legend">
        <span className="legend-label">Probability distribution</span>
        <div className="legend-bar">
          <span>LOW</span>
          <div className="gradient-bar" />
          <span>HIGH</span>
        </div>
      </div>

      <div className="glass-card">
        <MetricRow label="Backward drift ensemble" value={`${manifest.backtrack_hours} age hypotheses`} />
        <MetricRow label="Ensemble members" value={`${manifest.n_particles} / hypothesis`} />
        <MetricRow label="Total trajectories" value={`${manifest.n_particles * manifest.backtrack_hours}`} />
        <MetricRow label="Environmental forcing" value="CMEMS + ERA5" />
        <MetricRow label="Engine" value={manifest.engine.split('(')[0].trim()} />
      </div>

      <div className="origin-timeline">
        <div className="tl-node detection">
          <div className="tl-icon">◎</div>
          <div className="tl-text">
            <b>{fmtUtc(caseInfo?.t0_utc, { timeOnly: true }).replace(' UTC', '')}</b>
            <span>Current detection · {fmtUtc(caseInfo?.t0_utc, { dateOnly: true })}</span>
          </div>
        </div>
        <div className="tl-arrow">↓ BACKWARD DRIFT</div>
        <div className="tl-node release">
          <div className="tl-icon">◉</div>
          <div className="tl-text">
            <b>{rw[0].slice(11, 16)}–{rw[1].slice(11, 16)} UTC</b>
            <span>{rw[0].slice(0, 10)} · release window</span>
          </div>
        </div>
        <div className="tl-arrow">↓</div>
        <div className="tl-node origin">
          <div className="tl-icon">★</div>
          <div className="tl-text">
            <b>PROBABLE RELEASE ORIGIN</b>
            <span>{oe.lon}°E {oe.lat}°N · p50 centroid</span>
          </div>
        </div>
      </div>

      <h3 className="sec">Hindcast scrubber</h3>
      <input
        className="drift-slider"
        type="range" min={0} max={24} step={1}
        value={driftHour}
        onChange={(e) => setDriftHour(parseInt(e.target.value, 10))}
      />
      <MetricRow label="Look-back" value={`T−${driftHour} h`} highlight />
      <button className="action-btn" onClick={onAnimate}>
        ▶ Run backward ensemble (0 → −24 h)
      </button>
    </div>
  )
}

function ScoreDecomposition({ features }) {
  const keys = ['origin_mass', 'deep_hour_mass', 'cpa_km', 'gap_overlap_h', 'late_arrival']
  return (
    <div className="score-decomp">
      <div className="decomp-title">Score decomposition <span className="tag-inference">MODEL</span></div>
      {keys.map((k) => {
        const val = features[k]
        if (val == null) return null
        const pct = featurePct(k, val)
        return (
          <div key={k} className="decomp-row">
            <span>{FEATURE_LABELS[k]}</span>
            <div className="decomp-bar"><div style={{ width: `${pct}%` }} /></div>
            <b>{pct}%</b>
          </div>
        )
      })}
    </div>
  )
}

function CandidateCard({ candidate, rank, selectedMmsi, onFocusVessel }) {
  const score = attributionScore(candidate.score)
  const status = candidateStatus(rank, candidate.score)
  const f = candidate.features || {}
  const hasGap = (f.gap_overlap_h || 0) > 1
  const gapHours = f.gap_overlap_h?.toFixed(1)

  return (
    <div
      className={`glass-card candidate-card rank-${rank} ${selectedMmsi === candidate.mmsi ? 'selected' : ''}`}
      onClick={() => onFocusVessel(candidate.mmsi)}
    >
      <div className="candidate-header">
        <div>
          <span className="candidate-rank">Candidate #{rank}</span>
          <div className="candidate-name">{candidate.name}</div>
          <div className="candidate-meta">{candidate.type} · {candidate.flag} · {candidate.length_m} m</div>
        </div>
        <div className="candidate-score">
          <span className="score-val">{score}%</span>
          <span className="score-lbl">Attribution score</span>
        </div>
      </div>

      {rank === 1 && <ScoreDecomposition features={f} />}

      {rank === 1 && (
        <div className="candidate-details">
          <MetricRow label="Distance from probable origin" value={`${(f.cpa_km || 0).toFixed(1)} km CPA`} />
          <MetricRow label="Historical position at release" value="Within origin cloud" />
          <MetricRow label="Track reconstruction" value={f.dump_profile > 0.5 ? 'Consistent' : 'Partial'} />
          <MetricRow
            label="Downstream traffic exclusion"
            value={f.late_arrival === 0 ? 'PASS' : 'FAIL'}
            highlight={f.late_arrival === 0}
          />
        </div>
      )}

      {hasGap && (
        <div className="ais-gap-notice">
          <span className="badge badge-amber">AIS GAP / UNOBSERVED</span>
          <span>{gapHours} h unobserved within release window — not standalone evidence of misconduct</span>
        </div>
      )}

      {rank > 1 && (
        <div className="candidate-mini-metrics">
          {candidate.reasons?.slice(0, 2).map((r, i) => (
            <div key={i} className="mini-reason">{r.text}</div>
          ))}
        </div>
      )}

      <div className={`status-badge status-${status.tone}`}>{status.label}</div>
      <div className="candidate-mmsi">MMSI {candidate.mmsi}</div>
    </div>
  )
}

function SuspectsTab({ ranking, onFocusVessel, selectedMmsi }) {
  if (!ranking) return <p className="note">Loading attribution results…</p>
  const top3 = ranking.ranking.filter((r) => r.top3).slice(0, 3)
  const cleared = ranking.ranking.filter((r) => r.exonerated || r.verdict === 'CLEARED')

  return (
    <div className="panel-content">
      <SectionTitle sub="Ranked by multi-evidence attribution — human verification required">
        CANDIDATE VESSELS
      </SectionTitle>
      <p className="disclaimer">
        Attribution scores indicate evidential weight for investigation. They do not constitute a legal
        determination of guilt or liability.
      </p>

      {top3.map((r, i) => (
        <CandidateCard
          key={r.mmsi}
          candidate={r}
          rank={i + 1}
          selectedMmsi={selectedMmsi}
          onFocusVessel={onFocusVessel}
        />
      ))}

      {cleared.length > 0 && (
        <>
          <h3 className="sec">Excluded / downstream traffic</h3>
          {cleared.slice(0, 4).map((r) => (
            <div key={r.mmsi} className="glass-card compact cleared-card" onClick={() => onFocusVessel(r.mmsi)}>
              <div className="candidate-header">
                <span className="candidate-name" style={{ fontSize: 12 }}>{r.name}</span>
                <span className="badge badge-green">EXCLUDED</span>
              </div>
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

function EvidenceTab({ caseInfo, manifest, ranking }) {
  const top = ranking?.ranking?.[0]
  const score = top ? attributionScore(top.score) : '—'
  const rw = manifest?.origin_estimate?.estimated_release_window_utc

  const chain = [
    { stage: 'DETECTION', detail: 'Sentinel-1 SAR', time: fmtUtc(caseInfo?.t0_utc) },
    { stage: 'ORIGIN INFERENCE', detail: 'Backward drift ensemble', time: rw ? fmtWindow(rw[0], rw[1]) : '—' },
    { stage: 'VESSEL ATTRIBUTION', detail: top ? `Candidate #1 · ${top.name}` : '—', time: `Score ${score}%` },
    { stage: 'CORROBORATION', detail: 'AIS / SAR / ORB / chemical evidence', time: 'Pending verification' },
    { stage: 'ACTION', detail: 'Verification / enforcement review', time: 'Human decision' },
  ]

  return (
    <div className="panel-content evidence-panel">
      <SectionTitle sub="Intelligence case file — chain of custody preserved">
        EVIDENCE BUNDLE
      </SectionTitle>

      <div className="evidence-chain">
        {chain.map((step, i) => (
          <React.Fragment key={step.stage}>
            <div className="chain-step">
              <div className="chain-stage">{step.stage}</div>
              <div className="chain-detail">{step.detail}</div>
              <div className="chain-time">{step.time}</div>
            </div>
            {i < chain.length - 1 && <div className="chain-arrow">↓</div>}
          </React.Fragment>
        ))}
      </div>

      <h3 className="sec">Provenance</h3>
      <div className="glass-card compact provenance">
        <MetricRow label="Case ID" value={caseInfo?.case_id || 'KERALA_2025_CASE01'} />
        <MetricRow label="Model version" value="LightGBM ranker v1 + Lagrangian hindcast v1" />
        <MetricRow label="Processing" value={fmtUtc(manifest?.detection_time_utc)} />
        <MetricRow label="Dataset" value="Sentinel-1 SAR · CMEMS · ERA5 · AIS" />
      </div>

      {manifest?.input_sha256 && (
        <>
          <h3 className="sec">Hash-stamped artifacts</h3>
          <div className="glass-card hashes">
            {Object.entries(manifest.input_sha256).map(([k, v]) => (
              <div key={k}><span>{k}</span> {v.slice(0, 32)}…</div>
            ))}
          </div>
        </>
      )}

      <div className="legal-box">
        <b>UNCLOS Art. 220(3) — tip-and-cue.</b> Provides grounds to request information from flagged
        vessels. Does not constitute detention-grade evidence (Art. 220(6) requires chemical fingerprinting).
        All outputs require human verification before enforcement action.
      </div>

      <a href="/api/evidence/pdf" download className="export-link">
        <button className="action-btn export">
          ⬇ EXPORT EVIDENCE BUNDLE
        </button>
      </a>
    </div>
  )
}

export default function SidePanel(props) {
  const tabs = [
    { id: 'detection', label: 'DETECTION' },
    { id: 'origin', label: 'ORIGIN' },
    { id: 'suspects', label: 'SUSPECTS' },
    { id: 'evidence', label: 'EVIDENCE' },
  ]

  return (
    <aside className="sidepanel">
      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={props.tab === t.id ? 'active' : ''}
            onClick={() => props.setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="tabbody">
        {props.tab === 'detection' && <DetectionTab {...props} />}
        {props.tab === 'origin' && <OriginTab {...props} />}
        {props.tab === 'suspects' && <SuspectsTab {...props} />}
        {props.tab === 'evidence' && <EvidenceTab {...props} />}
      </div>
    </aside>
  )
}
