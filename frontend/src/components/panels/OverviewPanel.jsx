import React from 'react'
import { Card, Metric, Callout } from '../ui'
import { Term } from '../Glossary'
import { STEPS } from '../../utils/stepGuide'
import { MAP_MODES } from '../../utils/mapModes'
import { slickCharacterisation, ensembleStats, fmtWindow } from '../../utils/caseAnalytics'
import { originConfidence } from '../../utils/terminology'

export default function OverviewPanel({
  caseInfo, detection, manifest, ranking, setView, setMapMode, mapMode,
}) {
  const char = slickCharacterisation(detection, manifest)
  const ens = ensembleStats(manifest)
  const top = ranking?.ranking?.[0]
  const prob = originConfidence(manifest)
  const rw = manifest?.origin_estimate?.estimated_release_window_utc

  return (
    <div className="sn-p">
      <Callout tone="cyan" title="START HERE">
        Five steps take you from the radar pixel to a named ship. Pick one below, or read the four
        numbers first — every figure is the model’s estimate, never a measurement of the oil itself.
      </Callout>

      <Card title="THE CASE IN FOUR NUMBERS" note={caseInfo?.title}>
        <div className="sn-metric-grid">
          <Metric
            value={char ? `${char.probability}` : '—'}
            unit="%"
            label="Oil probability"
            tone="red"
            note="OBSERVED + CLASSIFIER"
          />
          <Metric
            value={char ? `${char.area}` : '—'}
            unit="km²"
            label="Slick area"
            note="SAR DARKENING 2.5 dB"
          />
          <Metric value={`${prob}`} unit="%" label="Origin confidence" tone="purple" note="24 H BACKWARD ENSEMBLE" />
          <Metric
            value={top ? `#${top.rank || 1}` : '—'}
            unit={`of ${ranking?.n_vessels ?? '—'}`}
            label="Top candidate"
            tone="cyan"
            note="RANKING, NOT A VERDICT"
          />
        </div>
        <div className="sn-facts">
          <div className="sn-fact">
            <span className="mono">RELEASE WINDOW</span>
            <b className="mono">{rw ? fmtWindow(rw[0], rw[1]) : '—'}</b>
          </div>
          <div className="sn-fact">
            <span className="mono">TOP CANDIDATE</span>
            <b>{top ? `${top.name} · ${top.flag} · ${top.type}` : '—'}</b>
          </div>
          <div className="sn-fact">
            <span className="mono">DRIFT MEMBERS</span>
            <b className="mono">{ens.total.toLocaleString()}+ · {ens.forcing}</b>
          </div>
        </div>
      </Card>

      <Card title="THE FIVE STEPS" note="Each screen answers one question. You can move in any order.">
        <ol className="sn-steplist">
          {STEPS.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => setView(s.id)}>
                <span className="sn-steplist-num mono">{s.num}</span>
                <span className="sn-steplist-body">
                  <b>{s.name}</b>
                  <span>{s.question}</span>
                </span>
                <span className="sn-steplist-go" aria-hidden="true">→</span>
              </button>
            </li>
          ))}
        </ol>
      </Card>

      <Card title="MAP MODES" note="The map only draws what the current question needs.">
        <div className="sn-modestyle">
          {MAP_MODES.filter((m) => m.id !== 'evidence').map((m) => (
            <button
              key={m.id}
              type="button"
              className={`sn-modechip ${mapMode === m.id ? 'active' : ''}`}
              onClick={() => setMapMode?.(m.id)}
            >
              <b>{m.short}</b>
              <span>{m.desc}</span>
            </button>
          ))}
        </div>
      </Card>

      <p className="sn-hint">
        <Term k="mask">Blind spots</Term> are drawn as hatched areas — a blank sea there means
        “not assessable”, not “clean”.
      </p>
    </div>
  )
}
