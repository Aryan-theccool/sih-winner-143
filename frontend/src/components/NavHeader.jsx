import React from 'react'
import { caseAssessment, fmtUtc } from '../utils/caseAnalytics'

const NAV = [
  { id: 'overview', label: 'OVERVIEW' },
  { id: 'detection', label: 'DETECTION' },
  { id: 'origin', label: 'ORIGIN' },
  { id: 'vessels', label: 'VESSELS' },
  { id: 'evidence', label: 'EVIDENCE' },
  { id: 'report', label: 'CASE REPORT' },
]

export default function NavHeader({ view, setView, caseInfo, ranking, detection, manifest, replayMode, setReplayMode }) {
  const assess = caseAssessment(detection, manifest, ranking)

  return (
    <header className="nav-header">
      <div className="nav-left">
        <div className="brand">
          <span className="brand-main">ORIGIN<b>TRACE</b></span>
          <span className="brand-sub">SAGAR-NETRA · MARINE INTELLIGENCE</span>
        </div>
        <nav className="main-nav">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={view === n.id ? 'active' : ''}
              onClick={() => setView(n.id)}
            >
              {n.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="nav-center">
        <span className="case-pill">{caseInfo?.case_id}</span>
        <span className="principle">
          We do not ask which ship is near the oil <em>now</em> — we ask which ship was where the oil
          <em> began</em>, when it began.
        </span>
      </div>

      <div className="status-rail">
        <div className="status-item">
          <span className="status-label">CASE STATUS</span>
          <span className="status-val warn">{assess.status}</span>
        </div>
        <div className="status-item">
          <span className="status-label">DATA HEALTH</span>
          <span className="status-val ok">NOMINAL</span>
        </div>
        <div className="status-item">
          <span className="status-label">AIS FEED</span>
          <span className="status-val ok">LIVE / REPLAY</span>
        </div>
        <div className="status-item">
          <span className="status-label">MODEL</span>
          <span className="status-val">v1.0</span>
        </div>
        <button
          className={`replay-toggle ${replayMode ? 'active' : ''}`}
          onClick={() => setReplayMode((r) => !r)}
        >
          {replayMode ? '◉ REPLAY' : '○ LIVE'}
        </button>
        <div className="status-item">
          <span className="status-label">DETECTION</span>
          <span className="status-val accent">{fmtUtc(caseInfo?.t0_utc, { timeOnly: true })}</span>
        </div>
      </div>
    </header>
  )
}
