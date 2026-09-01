import React from 'react'
import DetectionPanel from './panels/DetectionPanel'
import OriginPanel from './panels/OriginPanel'
import VesselsPanel from './panels/VesselsPanel'
import EvidencePanel from './panels/EvidencePanel'
import CaseReportPanel from './panels/CaseReportPanel'
import SatelliteCards from './SatelliteCards'
import VesselIntelCard from './VesselIntelCard'
import SlickIntelCard from './SlickIntelCard'

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
    detection, manifest, caseInfo,
  } = props

  const tab = ['map', 'detection', 'origin', 'vessels', 'evidence', 'report'].includes(view)
    ? (view === 'map' ? 'detection' : view)
    : 'detection'

  const selectedVessel = selectedMmsi && ranking?.ranking?.find((r) => r.mmsi === selectedMmsi)
  const vesselData = vessels?.find((v) => v.mmsi === selectedMmsi)

  return (
    <aside className="intel-sidebar">
      <div className="is-header">
        <span className="is-title">INTELLIGENCE</span>
        <span className="is-case mono">{caseInfo?.case_id}</span>
      </div>

      <div className="is-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'active' : ''}
            onClick={() => setView(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <SatelliteCards detection={detection} caseInfo={caseInfo} />

      {mapFocus === 'vessel' && selectedVessel && (
        <VesselIntelCard
          candidate={selectedVessel}
          vessel={vesselData}
          simTime={simTime}
          manifest={manifest}
          rank={selectedVessel.rank}
          onViewTrack={() => setView('vessels')}
          onViewEvidence={() => setView('evidence')}
        />
      )}

      {mapFocus === 'slick' && (
        <SlickIntelCard detection={detection} manifest={manifest} />
      )}

      <div className="is-body">
        {tab === 'detection' && <DetectionPanel {...props} />}
        {tab === 'origin' && <OriginPanel {...props} />}
        {tab === 'vessels' && !selectedVessel && <VesselsPanel {...props} />}
        {tab === 'evidence' && <EvidencePanel {...props} />}
        {tab === 'report' && <CaseReportPanel {...props} />}
      </div>
    </aside>
  )
}
