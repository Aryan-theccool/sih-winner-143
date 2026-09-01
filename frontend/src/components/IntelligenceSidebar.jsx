import React from 'react'
import DetectionPanel from './panels/DetectionPanel'
import OriginPanel from './panels/OriginPanel'
import VesselsPanel from './panels/VesselsPanel'
import EvidencePanel from './panels/EvidencePanel'
import CaseReportPanel from './panels/CaseReportPanel'
import OverviewPanel from './panels/OverviewPanel'
import VesselIntelCard from './VesselIntelCard'
import ExplainAttribution from './ExplainAttribution'
import EvidentiaryLadder from './EvidentiaryLadder'
import { DefinitionBar } from './Glossary'
import { STEPS, OVERVIEW_STEP, stepFor, stepIndex } from '../utils/stepGuide'

const TABS = [{ id: 'map', num: OVERVIEW_STEP.num, label: 'OVERVIEW' },
  ...STEPS.map((s) => ({ id: s.id, num: s.num, label: s.tab }))]

export default function IntelligenceSidebar(props) {
  const {
    view, setView, mapFocus, selectedMmsi, ranking, vessels, simTime,
    manifest, showExplain, setShowExplain, onClearVessel,
  } = props

  const step = stepFor(view)
  const idx = stepIndex(view)
  const isOverview = view === 'map'
  const tab = isOverview ? 'map' : view
  const selectedVessel = selectedMmsi && ranking?.ranking?.find((r) => r.mmsi === selectedMmsi)
  const vesselData = vessels?.find((v) => v.mmsi === selectedMmsi)
  const nextStep = STEPS.find((s) => s.id === step.next)

  return (
    <aside className="sn-panel">
      <header className="sn-step-head">
        <div className="sn-step-top">
          <span className="sn-step-num mono">
            {isOverview ? 'ORIENTATION' : `STEP ${step.num} / 05`}
          </span>
          <div className="sn-step-dots" aria-hidden="true">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={`sn-step-dot ${s.id === view ? 'active' : ''} ${!isOverview && i <= idx ? 'done' : ''}`}
                onClick={() => setView(s.id)}
                title={`${s.num} · ${s.name} — ${s.question}`}
                aria-label={s.name}
              />
            ))}
          </div>
        </div>
        <h2 className="sn-step-name">{step.name}</h2>
        <p className="sn-step-q">{step.question}</p>
        <EvidentiaryLadder ranking={ranking} compact={tab !== 'evidence'} />
      </header>

      <nav className="sn-panel-tabs" role="tablist" aria-label="Investigation steps">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`sn-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setView(t.id)}
            title={t.id === 'map' ? OVERVIEW_STEP.question : STEPS.find((s) => s.id === t.id)?.question}
          >
            <span className="sn-tab-num mono">{t.num}</span>
            <span className="sn-tab-lbl">{t.label}</span>
          </button>
        ))}
      </nav>

      <div className="sn-panel-scroll">
        {mapFocus === 'vessel' && selectedVessel && (
          <VesselIntelCard
            candidate={selectedVessel}
            vessel={vesselData}
            simTime={simTime}
            manifest={manifest}
            rank={selectedVessel.rank}
            onViewTrack={() => setView('vessels')}
            onViewEvidence={() => setView('evidence')}
            onWhy={() => setShowExplain(true)}
            onClear={() => onClearVessel?.()}
          />
        )}

        {showExplain && selectedVessel && (
          <ExplainAttribution candidate={selectedVessel} onClose={() => setShowExplain(false)} />
        )}

        <div className="sn-panel-body panel-enter" key={tab}>
          {tab === 'map' && <OverviewPanel {...props} />}
          {tab === 'detection' && <DetectionPanel {...props} />}
          {tab === 'origin' && <OriginPanel {...props} />}
          {tab === 'vessels' && <VesselsPanel {...props} />}
          {tab === 'evidence' && <EvidencePanel {...props} />}
          {tab === 'report' && <CaseReportPanel {...props} />}
        </div>
      </div>

      <footer className="sn-panel-foot">
        <DefinitionBar />
        {step.next ? (
          <button type="button" className="sn-next" onClick={() => setView(step.next)}>
            <span className="sn-next-lbl mono">
              {isOverview ? 'NEXT · STEP 01' : `NEXT · STEP ${nextStep?.num ?? '01'}`}
            </span>
            <span className="sn-next-txt">{isOverview ? OVERVIEW_STEP.nextLabel : step.nextLabel}</span>
            <span className="sn-next-arrow" aria-hidden="true">→</span>
          </button>
        ) : (
          <button type="button" className="sn-next" onClick={() => setView('map')}>
            <span className="sn-next-lbl">CASE FILE COMPLETE · ADVISORY OUTPUT</span>
            <span className="sn-next-txt">Back to the case overview</span>
            <span className="sn-next-arrow" aria-hidden="true">↑</span>
          </button>
        )}
      </footer>
    </aside>
  )
}
