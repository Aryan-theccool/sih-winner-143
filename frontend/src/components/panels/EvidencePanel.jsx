import React, { useState } from 'react'
import { Card, Tag, Btn, Callout } from '../ui'
import { Term } from '../Glossary'
import EvidenceGraph from '../EvidenceGraph'
import RegulatoryPanel from '../RegulatoryPanel'
import EvidenceBanner from '../EvidenceBanner'
import { fmtUtc } from '../../utils/caseAnalytics'
import { EVIDENCE_CHECKLIST } from '../../utils/workflow'

const STATUS_ICON = { ok: '✓', warn: '!', fail: '—' }
const STATUS_TEXT = { ok: 'Captured', warn: 'Outstanding', fail: 'Not available' }

export default function EvidencePanel({ caseInfo, manifest, ranking, detection, onGenerateDossier }) {
  const [activeNode, setActiveNode] = useState(null)
  const top = ranking?.ranking?.[0]

  const nodes = {
    satellite: { source: 'Sentinel-1 SAR', time: fmtUtc(caseInfo?.t0_utc), conf: '77%', dataset: 'S1A_IW_GRDH', model: 'det-v1.0', hash: manifest?.input_sha256?.sar_scene?.slice(0, 20) },
    slick: { source: 'Detection pipeline', time: fmtUtc(manifest?.detection_time_utc), conf: '77%', dataset: 'slick_polygons.geojson', model: 'seg-v1.0', hash: manifest?.input_sha256?.slick_polygons?.slice(0, 20) },
    age: { source: 'Morphology + hindcast', time: fmtUtc(manifest?.detection_time_utc), conf: '68%', dataset: 'age model', model: 'age-v1.0', hash: '—' },
    origin: { source: 'Lagrangian hindcast', time: fmtUtc(manifest?.origin_estimate?.estimated_release_window_utc?.[0]), conf: '81%', dataset: 'CMEMS + ERA5', model: 'drift-v1.0', hash: manifest?.input_sha256?.wind_nc?.slice(0, 20) },
    vessel: { source: 'AIS reconstruction', time: '48 h window', conf: top ? `${Math.round(top.score * 100)}%` : '—', dataset: 'synthetic AIS', model: 'rank-v1.0', hash: 'ais-bundle' },
    ais: { source: 'AIS continuity check', time: '48 h', conf: '76%', dataset: 'AIS gaps', model: 'gap-v1.0', hash: '—' },
    corroboration: { source: 'Awaiting ORB / sample', time: '—', conf: '—', dataset: '—', model: '—', hash: '—' },
    regulatory: { source: 'Framework mapping', time: fmtUtc(manifest?.detection_time_utc), conf: 'Advisory', dataset: 'legal reference', model: '—', hash: '—' },
  }

  const outstanding = EVIDENCE_CHECKLIST.filter((i) => i.status !== 'ok')

  return (
    <div className="sn-p">
      <Callout tone="cyan" title="EVERY STEP IS TIED TO A FILE">
        Click any stage of the chain to see which source file produced it, when it was captured and the checksum
        that freezes it. {outstanding.length} item{outstanding.length === 1 ? ' is' : 's are'} still outstanding,
        and listed rather than hidden.
      </Callout>

      <Card title="WHAT THE CASE CONTAINS" right={<Tag tone="corroborated" />}>
        <ul className="sn-checks">
          {EVIDENCE_CHECKLIST.map((item) => (
            <li key={item.id} className={`tone-${item.status}`}>
              <span className="sn-check-num mono">{String(item.id).padStart(2, '0')}</span>
              <span className="sn-check-label">{item.label}</span>
              <span className="sn-check-mark" title={STATUS_TEXT[item.status]}>{STATUS_ICON[item.status]}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="EVIDENCE CHAIN" note="Select a stage to inspect its provenance.">
        <EvidenceGraph onSelect={setActiveNode} active={activeNode} />
        {activeNode && nodes[activeNode] && (
          <div className="sn-prov panel-enter">
            <h4>{activeNode.toUpperCase()}</h4>
            <div className="sn-kv">
              <div className="sn-kv-row"><dt>Source</dt><dd>{nodes[activeNode].source}</dd></div>
              <div className="sn-kv-row"><dt>Timestamp</dt><dd className="mono">{nodes[activeNode].time}</dd></div>
              <div className="sn-kv-row"><dt>Confidence</dt><dd className="mono">{nodes[activeNode].conf}</dd></div>
              <div className="sn-kv-row"><dt>Dataset</dt><dd className="mono">{nodes[activeNode].dataset}</dd></div>
              <div className="sn-kv-row"><dt>Model</dt><dd className="mono">{nodes[activeNode].model}</dd></div>
              <div className="sn-kv-row"><dt>Hash</dt><dd className="mono">{nodes[activeNode].hash}…</dd></div>
            </div>
          </div>
        )}
      </Card>

      <Card title="WHAT IS STILL MISSING" note="What a follow-up has to collect before this becomes evidence a court can use.">
        <ul className="sn-missing">
          <li><Term k="orb">Oil Record Book</Term> for the candidate, covering {fmtUtc(manifest?.origin_estimate?.estimated_release_window_utc?.[0])}</li>
          <li>Sample or fingerprint of the spilled product</li>
          <li>On-scene observation or aircraft confirmation</li>
          <li>Flag-State notification record</li>
        </ul>
      </Card>

      <Card title="REGULATORY POSITION">
        <EvidenceBanner manifest={manifest} />
        <RegulatoryPanel />
      </Card>

      <div className="sn-actions">
        <Btn variant="primary" onClick={onGenerateDossier}>Generate the case dossier</Btn>
      </div>
    </div>
  )
}
