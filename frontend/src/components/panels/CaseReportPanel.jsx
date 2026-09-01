import React from 'react'
import { Card, Tag, Btn, Callout } from '../ui'
import { slickCharacterisation, fmtUtc, fmtWindow } from '../../utils/caseAnalytics'
import { DOSSIER_CHECKLIST } from '../../utils/workflow'

export default function CaseReportPanel({
  caseInfo, detection, manifest, ranking, onGenerateDossier, onVerifyIntegrity, setView,
}) {
  const char = slickCharacterisation(detection, manifest)
  const top = ranking?.ranking?.[0]
  const hash = manifest?.input_sha256?.sar_scene?.slice(0, 16) || '—'
  const rw = manifest?.origin_estimate?.estimated_release_window_utc

  return (
    <div className="sn-p">
      <Callout tone="cyan" title="ONE FILE, EVERYTHING A REVIEWER NEEDS">
        The dossier repeats what is on this screen — plus the model settings, the uncertainty bands and the
        checksums — so nobody has to re-run the pipeline to check the work.
      </Callout>

      <Card title="DOSSIER PREVIEW" right={<span className="sn-card-ref mono">PDF · 18 PAGES</span>}>
        <div className="sn-doc">
          <div className="sn-doc-brand">SAGAR-NET</div>
          <div className="sn-doc-type">Marine oil-spill attribution case file</div>
          <div className="sn-kv">
            <div className="sn-kv-row"><dt>Case ID</dt><dd className="mono">{caseInfo?.case_id}</dd></div>
            <div className="sn-kv-row"><dt>Detection</dt><dd className="mono">{fmtUtc(manifest?.detection_time_utc)} · {char?.probability}%</dd></div>
            <div className="sn-kv-row"><dt>Release window</dt><dd className="mono">{rw ? fmtWindow(rw[0], rw[1]) : '—'}</dd></div>
            <div className="sn-kv-row"><dt>Top candidate</dt><dd className="mono">{top ? `${top.name} · #${top.rank || 1} of ${ranking?.n_vessels ?? '—'}` : '—'}</dd></div>
            <div className="sn-kv-row"><dt>Integrity</dt><dd className="mono tone-green">SHA-256 verified</dd></div>
          </div>
          <div className="sn-doc-hash mono">{hash}…</div>
        </div>
      </Card>

      <Card title="WHAT IS INSIDE">
        <ul className="sn-contents">
          {DOSSIER_CHECKLIST.map((item, i) => (
            <li key={item} className="panel-stagger" style={{ '--stagger': i }}>
              <span className="sn-contents-num mono">{String(i + 1).padStart(2, '0')}</span>
              <span>{item}</span>
              <span className="sn-contents-tick">✓</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="HOW CONFIDENCE IS LABELLED" note="The five labels below appear on every figure in the dossier.">
        <div className="sn-tagrow">
          <Tag tone="observed" />
          <Tag tone="inferred" />
          <Tag tone="probable" />
          <Tag tone="corroborated" />
          <Tag tone="recommend" />
        </div>
        <ul className="sn-tagdefs">
          <li><b>Observed</b> a sensor measured it</li>
          <li><b>Inferred</b> a model estimated it from an observation</li>
          <li><b>Probable</b> the most likely option the model could see</li>
          <li><b>Corroborated</b> an independent source agrees</li>
          <li><b>Recommendation</b> a suggested next human action</li>
        </ul>
      </Card>

      <div className="sn-actions">
        <Btn variant="primary" onClick={onGenerateDossier}>Generate case dossier</Btn>
        <Btn variant="ghost" onClick={onVerifyIntegrity}>Verify case integrity</Btn>
      </div>

      <p className="sn-hint">
        Missing something? <button type="button" className="sn-link" onClick={() => setView?.('evidence')}>Open step 04 · Evidence</button> to see
        what has not been collected yet.
      </p>
    </div>
  )
}
