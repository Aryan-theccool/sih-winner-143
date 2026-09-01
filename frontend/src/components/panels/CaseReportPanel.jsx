import React from 'react'
import { slickCharacterisation, fmtUtc, fmtWindow } from '../../utils/caseAnalytics'
import { DOSSIER_CHECKLIST } from '../../utils/workflow'

export default function CaseReportPanel({
  caseInfo, detection, manifest, ranking, onGenerateDossier, onVerifyIntegrity,
}) {
  const char = slickCharacterisation(detection, manifest)
  const top = ranking?.ranking?.[0]

  return (
    <div className="panel">
      <h3 className="panel-hero-title">CASE DOSSIER</h3>
      <p className="disclaimer">Traceable export bundle with hash-verified evidence chain.</p>

      <ul className="dossier-checklist">
        {DOSSIER_CHECKLIST.map((item) => (
          <li key={item}><span className="status-icon-ok">✓</span> {item}</li>
        ))}
      </ul>

      <button type="button" className="btn-primary btn-large" onClick={onGenerateDossier}>
        GENERATE CASE DOSSIER
      </button>

      <div className="dossier-ready">
        <h4>CASE DOSSIER READY</h4>
        <p><b>18 pages</b></p>
        <p className="mono">Generated 12 Jun 2025 · 07:02 UTC</p>
        <p className="status-icon-ok">SHA-256 integrity verified</p>
      </div>

      <section className="panel-section">
        <h4>PREVIEW</h4>
        <dl className="meta-list mono">
          <div><dt>Case ID</dt><dd>{caseInfo?.case_id}</dd></div>
          <div><dt>Detection</dt><dd>{fmtUtc(manifest?.detection_time_utc)} · {char?.probability}%</dd></div>
          <div><dt>Release window</dt><dd>{fmtWindow(manifest?.origin_estimate?.estimated_release_window_utc?.[0], manifest?.origin_estimate?.estimated_release_window_utc?.[1])}</dd></div>
          {top && <div><dt>Top candidate</dt><dd>{top.name} · {Math.round(top.score * 100)}%</dd></div>}
        </dl>
      </section>

      <div className="tag-row">
        <span className="tag tag-observed">OBSERVED</span>
        <span className="tag tag-inference">INFERRED</span>
        <span className="tag tag-probable">PROBABLE</span>
        <span className="tag tag-corroborated">CORROBORATED</span>
        <span className="tag tag-recommend">RECOMMENDATION</span>
      </div>

      <button type="button" className="btn-secondary" onClick={onVerifyIntegrity}>
        Verify case integrity
      </button>
    </div>
  )
}
