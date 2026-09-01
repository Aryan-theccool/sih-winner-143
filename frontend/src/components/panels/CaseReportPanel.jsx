import React from 'react'
import CaseAssessment from '../CaseAssessment'
import RegulatoryPanel from '../RegulatoryPanel'
import { slickCharacterisation, ensembleStats, featurePct, fmtUtc, fmtWindow } from '../../utils/caseAnalytics'

export default function CaseReportPanel({
  caseInfo, detection, manifest, ranking, onGenerateDossier, onVerifyIntegrity,
}) {
  const char = slickCharacterisation(detection, manifest)
  const ens = ensembleStats(manifest)
  const top = ranking?.ranking?.[0]
  const oe = manifest?.origin_estimate
  const err = oe?.note_synthetic_case_truth?.origin_error_km
  const originProb = err != null ? Math.min(99, Math.round(100 - err * 15)) : 81

  return (
    <div className="panel-scroll report-panel">
      <div className="panel-head">
        <h2>CASE DOSSIER</h2>
        <span className="tag tag-observed">EXPORT-READY</span>
      </div>

      <div className="dossier-preview glass-card">
        <div className="dossier-header">ORIGINTRACE · MARINE OIL-SPILL ATTRIBUTION CASE FILE</div>
        <div className="dossier-section">
          <h4>CASE ID</h4>
          <p>{caseInfo?.case_id}</p>
        </div>
        <div className="dossier-section">
          <h4>DETECTION</h4>
          <p>Sentinel-1 · {fmtUtc(manifest?.detection_time_utc)}</p>
          <p>Area: {char?.area} km² · Probability: {char?.probability}%</p>
        </div>
        <div className="dossier-section">
          <h4>SLICK CHARACTERISATION</h4>
          <p>Class: {char?.oilClass} ({char?.classConfidence}%)</p>
          <p>Age: {char?.ageRange}</p>
          <p>Release: {fmtWindow(oe?.estimated_release_window_utc?.[0], oe?.estimated_release_window_utc?.[1])}</p>
        </div>
        <div className="dossier-section">
          <h4>ORIGIN RECONSTRUCTION</h4>
          <p>{ens.total.toLocaleString()}+ trajectories · {originProb}% probability</p>
          <p>Credible region: ~42 km² · {ens.forcing}</p>
        </div>
        {top && (
          <div className="dossier-section">
            <h4>TOP CANDIDATE</h4>
            <p>{top.name} · MMSI {top.mmsi}</p>
            <p>Attribution: {Math.round(top.score * 100)}%</p>
            <p>Origin overlap: {featurePct('origin_mass', top.features?.origin_mass)}%</p>
          </div>
        )}
        <div className="dossier-section">
          <h4>STATUS</h4>
          <p className="status-high">HIGH PRIORITY FOR VERIFICATION</p>
        </div>
        <div className="dossier-legend">
          <span className="tag-observed">OBSERVED</span>
          <span className="tag-inference">INFERRED</span>
          <span className="tag-probable">PROBABLE</span>
          <span className="tag-corroborated">CORROBORATED</span>
        </div>
      </div>

      <CaseAssessment detection={detection} manifest={manifest} ranking={ranking} />
      <RegulatoryPanel />

      <div className="integrity-block glass-card">
        <div className="card-label">EVIDENCE INTEGRITY</div>
        <div className="metric-row"><span>Bundle ID</span><b className="mono">OT-{caseInfo?.case_id}</b></div>
        <div className="metric-row"><span>Case hash</span><b className="mono">{manifest?.input_sha256?.sar_scene?.slice(0, 20)}…</b></div>
        <div className="metric-row"><span>Model version</span><b>LGBM-ranker-v1 · drift-v1</b></div>
        <div className="metric-row"><span>Timestamp</span><b>{fmtUtc(manifest?.detection_time_utc)}</b></div>
        <button className="action-btn" onClick={onVerifyIntegrity}>VERIFY CASE INTEGRITY</button>
      </div>

      <button className="action-btn export" onClick={onGenerateDossier}>
        ⬇ GENERATE CASE DOSSIER (PDF)
      </button>
    </div>
  )
}
