import React from 'react'
import DetectionPanel from './panels/DetectionPanel'
import OriginPanel from './panels/OriginPanel'
import VesselsPanel from './panels/VesselsPanel'
import EvidencePanel from './panels/EvidencePanel'
import CaseReportPanel from './panels/CaseReportPanel'
import VesselIntelCard from './VesselIntelCard'
import ExplainAttribution from './ExplainAttribution'
import EvidentiaryLadder from './EvidentiaryLadder'
import EvidenceBanner from './EvidenceBanner'

const TABS = [
  { id: 'detection', label: 'DETECTION' },
  { id: 'origin', label: 'ORIGIN' },
  { id: 'vessels', label: 'VESSELS' },
  { id: 'evidence', label: 'EVIDENCE' },
  { id: 'report', label: 'REPORT' },
]

export default function IntelligenceSidebar(props) {
  const {
    view, setView, mapFocus, selectedMmsi, ranking, vessels, simTime,
    manifest, showExplain, setShowExplain,
  } = props

  const tab = view === 'map' ? 'detection' : view
  const selectedVessel = selectedMmsi && ranking?.ranking?.find((r) => r.mmsi === selectedMmsi)
  const vesselData = vessels?.find((v) => v.mmsi === selectedMmsi)

  return (
    <aside className="sn-panel">
      <EvidenceBanner manifest={manifest} />

      <div className="sn-panel-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? 'active' : ''}
            onClick={() => setView(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <EvidentiaryLadder ranking={ranking} compact={tab !== 'evidence'} />

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
        />
      )}

      {showExplain && selectedVessel && (
        <ExplainAttribution candidate={selectedVessel} onClose={() => setShowExplain(false)} />
      )}

      <div className="sn-panel-body panel-enter" key={tab}>
        {tab === 'detection' && <DetectionPanel {...props} />}
        {tab === 'origin' && <OriginPanel {...props} />}
        {tab === 'vessels' && <VesselsPanel {...props} />}
        {tab === 'evidence' && <EvidencePanel {...props} />}
        {tab === 'report' && <CaseReportPanel {...props} />}
      </div>
    </aside>
  )
}
