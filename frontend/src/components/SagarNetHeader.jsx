import React from 'react'
import { Link } from 'react-router-dom'
import { caseAssessment, fmtUtc, primaryObject } from '../utils/caseAnalytics'

function Chip({ label, value, tone = '' }) {
  return (
    <div className={`sn-chip ${tone ? `tone-${tone}` : ''}`}>
      <span className="sn-chip-lbl mono">{label}</span>
      <span className="sn-chip-val">{value}</span>
    </div>
  )
}

export default function SagarNetHeader({ caseInfo, detection, manifest, ranking, aisLive = true, onHelp }) {
  const assess = caseAssessment(detection, manifest, ranking)
  const obj = primaryObject(detection)
  const top = ranking?.ranking?.[0]

  return (
    <header className="sn-header">
      <Link to="/" className="sn-brand" title="Back to the SAGAR-NET overview">
        <span className="sn-brand-mark">SAGAR<b>-NET</b></span>
        <span className="sn-brand-sub">Maritime Intelligence From Space</span>
      </Link>

      <div className="sn-hdr-case">
        <Chip label="CASE" value={caseInfo?.case_id} />
        <Chip label="SAR SCENE" value={fmtUtc(caseInfo?.t0_utc)} />
        <Chip
          label="SLICK"
          value={obj ? `${obj.area_km2} km² · ${Math.round(obj.confidence * 100)}% oil` : '—'}
        />
        <Chip
          label="TOP CANDIDATE"
          value={top ? `${top.name} · #${top.rank || 1} of ${ranking?.n_vessels ?? '—'} screened` : '—'}
          tone="cyan"
        />
      </div>

      <div className="sn-hdr-right">
        <span className="sn-status-pill tone-amber">
          <span className="sn-status-dot" />
          {assess.status}
        </span>
        <span className={`sn-live ${aisLive ? 'live' : ''}`} title="Synthetic AIS stream, 48 h window">
          <span className="sn-live-dot" /> AIS 48H
        </span>
        <button type="button" className="sn-help-btn" onClick={onHelp} title="How to read this dashboard (?)">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="12" cy="12" r="9" />
            <path d="M9.6 9.2A2.5 2.5 0 0112 7.5c1.4 0 2.5 1 2.5 2.3 0 1.7-2.5 1.9-2.5 3.6" />
            <path d="M12 17h.01" />
          </svg>
          Guide
        </button>
        <div className="sn-user">
          <span className="sn-avatar" aria-hidden="true">CG</span>
          <span className="sn-user-meta">
            <span className="sn-user-role">Analyst</span>
            <span className="sn-user-org">Indian Coast Guard</span>
          </span>
        </div>
      </div>
    </header>
  )
}
