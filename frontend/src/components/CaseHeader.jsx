import React from 'react'
import { slickCharacterisation, caseAssessment, fmtWindow } from '../utils/caseAnalytics'
import { originConfidence } from '../utils/terminology'

export default function CaseHeader({
  caseInfo, detection, manifest, ranking,
  userMode, setUserMode, reducedMotion, setReducedMotion,
}) {
  const char = slickCharacterisation(detection, manifest)
  const assess = caseAssessment(detection, manifest, ranking)
  const top = ranking?.ranking?.[0]
  const rw = manifest?.origin_estimate?.estimated_release_window_utc
  const originPct = originConfidence(manifest)

  return (
    <header className="case-header">
      <div className="ch-brand">
        <div className="ch-title">ORIGIN<b>TRACE</b></div>
        <div className="ch-sub">SAGAR-NETRA</div>
      </div>

      <div className="ch-case-block">
        <span className="ch-label">CASE</span>
        <span className="ch-case-id mono">{caseInfo?.case_id || '—'}</span>
      </div>

      <div className="ch-status-block">
        <span className="ch-label">CASE STATUS</span>
        <span className="ch-status status-icon-warn">{assess.status}</span>
      </div>

      <div className="ch-metrics">
        <div className="ch-metric">
          <span className="ch-label">DETECTION</span>
          <span className="ch-value">{char?.probability ?? '—'}%</span>
          <span className="ch-meta">Oil-slick probability</span>
        </div>
        <div className="ch-metric">
          <span className="ch-label">ORIGIN</span>
          <span className="ch-value ch-value-text">HIGH CONFIDENCE</span>
          <span className="ch-meta mono">{rw ? fmtWindow(rw[0], rw[1]) : '—'}</span>
        </div>
        <div className="ch-metric">
          <span className="ch-label">ATTRIBUTION</span>
          <span className="ch-value">CANDIDATE #1</span>
          <span className="ch-meta">{top ? `${Math.round(top.score * 100)}%` : '—'} · {originPct}% origin</span>
        </div>
        <div className="ch-metric">
          <span className="ch-label">CORROBORATION</span>
          <span className="ch-value ch-value-text">PARTIAL</span>
          <span className="ch-meta status-icon-warn">ORB / chemical pending</span>
        </div>
      </div>

      <div className="ch-controls">
        <div className="mode-toggle" role="group" aria-label="User mode">
          <button
            type="button"
            className={userMode === 'command' ? 'active' : ''}
            onClick={() => setUserMode('command')}
          >
            COMMAND
          </button>
          <button
            type="button"
            className={userMode === 'analyst' ? 'active' : ''}
            onClick={() => setUserMode('analyst')}
          >
            ANALYST
          </button>
        </div>
        <label className="motion-toggle">
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(e) => setReducedMotion(e.target.checked)}
          />
          Reduced motion
        </label>
      </div>
    </header>
  )
}
