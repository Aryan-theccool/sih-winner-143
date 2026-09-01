import React, { useState } from 'react'
import EvidenceGraph from '../EvidenceGraph'
import RegulatoryPanel from '../RegulatoryPanel'
import { fmtUtc } from '../../utils/caseAnalytics'
import { EVIDENCE_CHECKLIST } from '../../utils/workflow'

const STATUS_ICON = { ok: '✓', warn: '⚠', fail: '○' }

export default function EvidencePanel({ caseInfo, manifest, ranking, detection, onGenerateDossier, userMode }) {
  const [activeNode, setActiveNode] = useState(null)
  const top = ranking?.ranking?.[0]

  const nodes = {
    satellite: { source: 'Sentinel-1 SAR', time: fmtUtc(caseInfo?.t0_utc), conf: '77%', dataset: 'S1A_IW_GRDH', model: 'det-v1.0', hash: manifest?.input_sha256?.sar_scene?.slice(0, 20) },
    slick: { source: 'Detection pipeline', time: fmtUtc(manifest?.detection_time_utc), conf: '77%', dataset: 'slick_geojson', model: 'seg-v1.0', hash: manifest?.input_sha256?.slick_polygons?.slice(0, 20) },
    age: { source: 'Morphology + hindcast', time: fmtUtc(manifest?.detection_time_utc), conf: '68%', dataset: 'age_model', model: 'age-v1.0', hash: '—' },
    origin: { source: 'Lagrangian hindcast', time: fmtUtc(manifest?.origin_estimate?.estimated_release_window_utc?.[0]), conf: '81%', dataset: 'CMEMS+ERA5', model: 'drift-v1.0', hash: manifest?.input_sha256?.wind_nc?.slice(0, 20) },
    vessel: { source: 'AIS reconstruction', time: '48 h window', conf: top ? `${Math.round(top.score * 100)}%` : '—', dataset: 'AIS synthetic', model: 'rank-v1.0', hash: 'ais-bundle' },
    ais: { source: 'AIS continuity', time: '48 h', conf: '76%', dataset: 'AIS', model: 'gap-v1.0', hash: '—' },
    corroboration: { source: 'Pending ORB/chemical', time: '—', conf: '—', dataset: '—', model: '—', hash: '—' },
    regulatory: { source: 'Framework mapping', time: fmtUtc(manifest?.detection_time_utc), conf: 'Advisory', dataset: 'legal-ref', model: '—', hash: '—' },
  }

  return (
    <div className="panel">
      <h3 className="panel-hero-title">CASE EVIDENCE</h3>

      <ul className="evidence-checklist">
        {EVIDENCE_CHECKLIST.map((item) => (
          <li key={item.id} className={`check-${item.status}`}>
            <span className="check-num mono">{String(item.id).padStart(2, '0')}</span>
            <span className="check-label">{item.label}</span>
            <span className="check-icon">{STATUS_ICON[item.status]}</span>
          </li>
        ))}
      </ul>

      <EvidenceGraph onSelect={setActiveNode} active={activeNode} />

      {activeNode && nodes[activeNode] && (
        <div className="evidence-detail">
          <h4>{activeNode.toUpperCase()}</h4>
          <dl className="meta-list mono">
            <div><dt>Source</dt><dd>{nodes[activeNode].source}</dd></div>
            <div><dt>Timestamp</dt><dd>{nodes[activeNode].time}</dd></div>
            <div><dt>Confidence</dt><dd>{nodes[activeNode].conf}</dd></div>
            <div><dt>Dataset</dt><dd>{nodes[activeNode].dataset}</dd></div>
            <div><dt>Model version</dt><dd>{nodes[activeNode].model}</dd></div>
            <div><dt>Hash</dt><dd>{nodes[activeNode].hash}…</dd></div>
          </dl>
        </div>
      )}

      <RegulatoryPanel />

      <button type="button" className="btn-primary export" onClick={onGenerateDossier}>
        REQUEST PSC INFORMATION · EXPORT DOSSIER
      </button>
    </div>
  )
}
