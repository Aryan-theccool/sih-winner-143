import React from 'react'
import { caseAssessment } from '../utils/caseAnalytics'

export default function SagarNetHeader({ caseInfo, detection, manifest, ranking, aisLive = true }) {
  const assess = caseAssessment(detection, manifest, ranking)

  return (
    <header className="sn-header">
      <div className="sn-brand">
        <h1 className="sn-logo">
          <span className="sn-logo-main">SAGAR-NET</span>
        </h1>
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
          <span className="sn-dot live" /> AIS LIVE
        </span>
        <button type="button" className="sn-icon-btn" title="Connectivity" aria-label="Connectivity">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12.55a11 11 0 0114.08 0M8.53 16.11a6 6 0 016.95 0M12 20h.01" /><circle cx="12" cy="12" r="1" fill="currentColor" /></svg>
        </button>
        <button type="button" className="sn-icon-btn" title="Notifications" aria-label="Notifications">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /></svg>
        </button>
        <button type="button" className="sn-icon-btn" title="Settings" aria-label="Settings">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
        </button>
        <div className="sn-user">
          <div className="sn-avatar" aria-hidden="true">A</div>
          <div>
            <span className="sn-user-role">Analyst</span>
            <span className="sn-user-org">Coast Guard</span>
          </div>
        </div>
      </div>
    </header>
  )
}
