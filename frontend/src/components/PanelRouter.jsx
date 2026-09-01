import React from 'react'
import DetectionPanel from './panels/DetectionPanel'
import OriginPanel from './panels/OriginPanel'
import VesselsPanel from './panels/VesselsPanel'
import EvidencePanel from './panels/EvidencePanel'
import CaseReportPanel from './panels/CaseReportPanel'
import CaseAssessment from './CaseAssessment'

export default function PanelRouter(props) {
  const { view } = props

  if (view === 'overview') {
    return (
      <aside className="sidepanel overview-side">
        <CaseAssessment detection={props.detection} manifest={props.manifest} ranking={props.ranking} />
        <p className="note">Select a navigation tab or click items in the overview lists to drill into case analysis.</p>
      </aside>
    )
  }

  return (
    <aside className="sidepanel">
      {view === 'detection' && <DetectionPanel {...props} />}
      {view === 'origin' && <OriginPanel {...props} />}
      {view === 'vessels' && <VesselsPanel {...props} />}
      {view === 'evidence' && <EvidencePanel {...props} />}
      {view === 'report' && <CaseReportPanel {...props} />}
    </aside>
  )
}
