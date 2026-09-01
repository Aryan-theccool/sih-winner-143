import React, { useState } from 'react'
import EvidenceGraph from '../EvidenceGraph'
import RegulatoryPanel from '../RegulatoryPanel'
import CaseAssessment from '../CaseAssessment'
import { fmtUtc } from '../../utils/caseAnalytics'

export default function EvidencePanel({ caseInfo, manifest, ranking, detection, onGenerateDossier }) {
  const [activeNode, setActiveNode] = useState(null)
  const top = ranking?.ranking?.[0]

  const nodes = {
    satellite: { source: 'Sentinel-1 SAR', time: fmtUtc(caseInfo?.t0_utc), conf: '77%', hash: manifest?.input_sha256?.sar_scene?.slice(0, 16) },
    slick: { source: 'Detection pipeline', time: fmtUtc(manifest?.detection_time_utc), conf: '77%', hash: manifest?.input_sha256?.slick_polygons?.slice(0, 16) },
    origin: { source: 'Lagrangian hindcast', time: fmtUtc(manifest?.origin_estimate?.estimated_release_window_utc?.[0]), conf: '81%', hash: manifest?.input_sha256?.wind_nc?.slice(0, 16) },
    vessel: { source: 'AIS reconstruction', time: '48 h window', conf: top ? `${Math.round(top.score * 100)}%` : '—', hash: 'ais-synthetic' },
  }

  return (
    <div className="panel-scroll">
      <div className="panel-head">
        <h2>EVIDENCE CORRELATION</h2>
        <span className="tag tag-observed">TRACEABLE CHAIN</span>
      </div>

      <EvidenceGraph onSelect={setActiveNode} active={activeNode} />

      {activeNode && nodes[activeNode] && (
        <div className="glass-card node-detail">
          <div className="card-label">{activeNode.toUpperCase()}</div>
          <div className="metric-row"><span>Source</span><b>{nodes[activeNode].source}</b></div>
          <div className="metric-row"><span>Timestamp</span><b>{nodes[activeNode].time}</b></div>
          <div className="metric-row"><span>Confidence</span><b>{nodes[activeNode].conf}</b></div>
          <div className="metric-row"><span>Hash</span><b className="mono">{nodes[activeNode].hash}…</b></div>
          <div className="metric-row"><span>Processing</span><b>v1.0</b></div>
        </div>
      )}

      <CaseAssessment detection={detection} manifest={manifest} ranking={ranking} />
      <RegulatoryPanel />

      <button className="action-btn export" onClick={onGenerateDossier}>
        REQUEST PSC INFORMATION · EXPORT DOSSIER
      </button>
    </div>
  )
}
