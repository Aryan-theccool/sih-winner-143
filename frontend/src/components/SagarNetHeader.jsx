import React from 'react'
import { caseAssessment } from '../utils/caseAnalytics'

export default function SagarNetHeader({
  caseInfo, detection, manifest, ranking,
  reducedMotion, setReducedMotion, aisLive = true,
}) {
  const assess = caseAssessment(detection, manifest, ranking)

  return (
    <header className="sn-header">
      <div className="sn-brand">
        <h1 className="sn-logo">SAGAR-NET</h1>
        <p className="sn-tagline">Satellite-based Marine Oil Spill Detection, Origin Reconstruction &amp; Vessel Attribution</p>
      </div>

      <div className="sn-case">
        <div className="sn-case-box">
          <span className="sn-lbl">CASE</span>
          <span className="sn-val mono">{caseInfo?.case_id}</span>
        </div>
        <div className="sn-case-box">
          <span className="sn-lbl">STATUS</span>
          <span className="sn-val sn-warn">{assess.status}</span>
        </div>
      </div>

      <div className="sn-status">
        <span className={`sn-ais ${aisLive ? 'live' : ''}`}>
          <span className="sn-dot" /> AIS LIVE
        </span>
        <button type="button" className="sn-icon-btn" title="Connectivity" aria-label="Connectivity">📡</button>
        <button type="button" className="sn-icon-btn" title="Notifications" aria-label="Notifications">🔔</button>
        <button type="button" className="sn-icon-btn" title="Settings" aria-label="Settings">⚙</button>
        <div className="sn-user">
          <span className="sn-user-role">Analyst</span>
          <span className="sn-user-org">Coast Guard</span>
        </div>
        <label className="sn-motion">
          <input type="checkbox" checked={reducedMotion} onChange={(e) => setReducedMotion(e.target.checked)} />
          Reduced motion
        </label>
      </div>
    </header>
  )
}
