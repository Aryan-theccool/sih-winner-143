import React from 'react'
import { Card, Tag, Callout, Btn, Bar } from '../ui'
import { Term } from '../Glossary'
import { FEATURE_LABELS, featurePct } from '../../utils/caseAnalytics'
import { vesselAt } from '../../utils/vesselMotion'
import ShapWaterfall from '../ShapWaterfall'

/** Bar = how much that factor moved the ranking. Number = the measurement itself. */
const FEATURES = [
  { key: 'origin_mass', plain: 'Was it inside the probable origin area?', show: (v) => `${Math.round(v * 100)}% of the cloud` },
  { key: 'deep_hour_mass', plain: 'Was it there during the release window?', show: (v) => `${Math.round(v * 100)}% of the hours` },
  { key: 'cpa_km', plain: 'How close did it come to the release point?', show: (v) => `${(v || 0).toFixed(1)} km` },
  { key: 'gap_overlap_h', plain: 'Was its position beacon switched off?', show: (v) => (v > 0 ? `${v.toFixed(1)} h dark` : 'never dark') },
  { key: 'late_arrival', plain: 'Did it arrive only after the spill?', show: (v) => (v === 0 ? 'no, timing fits' : `arrived ${v.toFixed(1)} h late`) },
]

function CandidateCard({ r, rank, selectedMmsi, onFocus, simTime, releaseWindow }) {
  const score = Math.round(r.score * 100)
  const f = r.features || {}
  const state = vesselAt({ absolute: r._absolute, dark_segments: r._dark }, simTime)
  const exonerated = f.late_arrival > 0.5
  const topReason = r.reasons?.find((x) => x.direction === 'raises')
  const gap = r.ais_gaps?.[0]

  return (
    <div
      className={`sn-cand rank-${rank} ${selectedMmsi === r.mmsi ? 'sel' : ''}`}
      onClick={() => onFocus(r.mmsi)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onFocus(r.mmsi) }}
    >
      <header className="sn-cand-head">
        <div className="sn-cand-id">
          <span className="sn-cand-rank mono">#{rank}</span>
          <div>
            <h4 className="sn-cand-name">{r.name}</h4>
            <p className="sn-cand-type">{r.type} · {r.flag} · {r.length_m} m · MMSI {r.mmsi}</p>
          </div>
        </div>
        <div className="sn-cand-score">
          <b>{score}%</b>
          <span className="mono"><Term k="score">FIT</Term></span>
        </div>
      </header>

      <div className="sn-cand-meter">
        <div className="sn-cand-meter-fill" style={{ width: `${score}%` }} />
      </div>

      {exonerated ? (
        <Callout tone="green" title="RULED OUT ON TIMING">
          This ship reached the affected area after the release window closed, so it cannot explain the slick.
        </Callout>
      ) : (
        <>
          <div className="sn-cand-feats">
            {FEATURES.map((feat, i) => {
              const v = f[feat.key] ?? 0
              const pct = featurePct(feat.key, v)
              const shown = feat.show(v)
              return (
                <div key={feat.key} className="sn-feat" title={feat.plain}>
                  <Bar
                    label={FEATURE_LABELS[feat.key]}
                    pct={pct}
                    value={shown}
                    tone={pct >= 70 ? 'green' : pct >= 40 ? 'cyan' : 'dim'}
                    stagger={i}
                  />
                  <span className="sn-feat-q">{feat.plain}</span>
                </div>
              )
            })}
          </div>

          {topReason && (
            <p className="sn-cand-why">
              <span className="mono">STRONGEST SIGNAL</span> {topReason.text}.
            </p>
          )}
        </>
      )}

      {rank <= 3 && r.shap && <ShapWaterfall candidate={r} compact={rank > 1} />}

      <div className="sn-phases">
        {[
          { k: 'before', t: 'Before the window', d: 'Steady traffic, normal course' },
          { k: 'during', t: 'Release window', d: exonerated ? 'Not in the area' : 'Inside the origin cloud' },
          { k: 'after', t: 'After the window', d: 'Course continues away, unremarkable' },
        ].map((p) => (
          <div key={p.k} className={`sn-phase ${p.k} ${p.k === 'during' && !exonerated ? 'hot' : ''}`}>
            <b>{p.t}</b>
            <span>{p.d}</span>
          </div>
        ))}
      </div>

      {gap && (
        <div className="sn-gap">
          <div className="sn-gap-head mono">
            <span><Term k="amsgap">AIS GAP</Term> · UNACCOUNTED TIME</span>
            <b className="warn">{gap.start?.slice(11, 16)}–{gap.end?.slice(11, 16)} UTC</b>
          </div>
          {f.gap_overlap_h > 2 && rank === 1 && (
            <div className="sn-gap-note">
              {f.gap_overlap_h.toFixed(1)} h of that silence falls inside the release window — a ship that
              stopped reporting while drifting through the origin area. Corroborating, not conclusive.
            </div>
          )}
        </div>
      )}

      <div className="sn-cand-foot">
        <span className={`sn-verdict ${rank === 1 && !exonerated ? 'high' : exonerated ? 'cleared' : 'med'}`}>
          {exonerated ? 'EXCLUDED · NO ACTION' : rank === 1 ? 'VERIFY FIRST' : 'CORROBORATE'}
        </span>
        {state && (
          <span className="sn-cand-motion mono">
            {state.speed.toFixed(1)} kn · {Math.round(state.heading)}° ·{' '}
            {state.position[0].toFixed(3)}°E {state.position[1].toFixed(3)}°N
          </span>
        )}
        {releaseWindow && !exonerated && (
          <span className="sn-cand-rw mono">
            AT RELEASE {releaseWindow[0].slice(11, 16)}–{releaseWindow[1].slice(11, 16)} UTC
          </span>
        )}
      </div>
    </div>
  )
}

export default function VesselsPanel({ ranking, vessels, selectedMmsi, onFocusVessel, simTime, manifest, setView }) {
  if (!ranking) return <p className="sn-loading">Loading candidate vessels…</p>

  const top3 = ranking.ranking.filter((r) => r.top3).slice(0, 3).map((r) => {
    const v = vessels?.find((x) => x.mmsi === r.mmsi)
    return { ...r, _absolute: v?.absolute, _dark: v?.dark_segments, ais_gaps: v?.ais_gaps }
  })
  const cleared = ranking.ranking.filter((r) => r.exonerated || r.verdict === 'CLEARED')

  return (
    <div className="sn-p">
      <Callout tone="amber" title="A RANKING IS NOT AN ACCUSATION">
        Being close to the slick now means nothing. What matters is whether the ship’s reconstructed track put it
        inside the probable origin area during the probable release window — which is what these scores measure.
      </Callout>

      <Card
        title="CANDIDATE VESSELS"
        note={`${ranking.n_vessels} ships screened · ${top3.length} survive the timing test · bar = weight in the ranking, number = the measurement itself`}
        right={<Tag tone="inferred" />}
      >
        {top3.map((r, i) => (
          <CandidateCard
            key={r.mmsi} r={r} rank={i + 1}
            selectedMmsi={selectedMmsi} onFocus={onFocusVessel}
            simTime={simTime}
            releaseWindow={manifest?.origin_estimate?.estimated_release_window_utc}
          />
        ))}
      </Card>

      {cleared.length > 0 && (
        <Card title={`RULED OUT (${cleared.length})`} note="Ships the model can positively exclude — kept visible so the screening is auditable.">
          <ul className="sn-cleared">
            {cleared.slice(0, 6).map((r) => (
              <li key={r.mmsi}>
                <button type="button" onClick={() => onFocusVessel(r.mmsi)}>
                  <b>{r.name}</b>
                  <span>{r.reasons?.find((x) => x.direction === 'lowers')?.text || 'arrived after the release window'}</span>
                  <em className="mono">EXCLUDED</em>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="sn-actions">
        <Btn variant="primary" onClick={() => setView?.('evidence')}>Check the evidence chain</Btn>
      </div>
    </div>
  )
}
