import React from 'react'

const IconSat = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="7" width="18" height="10" rx="1" />
    <path d="M7 7V5M12 7V3M17 7V5" />
    <path d="M3 12h18" />
  </svg>
)

export default function Header({ caseInfo, ranking }) {
  const topScore = ranking?.ranking?.[0]?.score
  const evidenceStatus = topScore >= 0.7 ? 'BUNDLE READY' : topScore >= 0.4 ? 'PENDING REVIEW' : 'PRELIMINARY'

  return (
    <header className="header">
      <div className="header-brand">
        <div className="header-logo">
          ORIGIN<b>TRACE</b>
          <span className="header-sub">:: OIL-SPILL ATTRIBUTION</span>
        </div>
        <div className="header-principle">
          We do not ask which ship is near the oil <em>now</em>. We ask which ship was where the oil
          <em> began</em>, when it began.
        </div>
      </div>

      <div className="header-meta">
        <div className="meta-chip case-id">
          <span className="meta-label">CASE</span>
          <span className="meta-value">{caseInfo?.case_id || 'KERALA_2025_CASE01'}</span>
        </div>
        <div className="meta-chip">
          <IconSat />
          <span className="meta-value">Sentinel-1 SAR</span>
        </div>
        <div className="meta-chip">
          <span className="meta-label">DETECTION</span>
          <span className="meta-value accent">{caseInfo?.t0_utc?.slice(0, 16).replace('T', ' ')}Z</span>
        </div>
        <div className="meta-chip">
          <span className="meta-label">EVIDENCE</span>
          <span className={`meta-value status-${evidenceStatus === 'BUNDLE READY' ? 'ok' : 'warn'}`}>
            {evidenceStatus}
          </span>
        </div>
        <div className="meta-chip legal">
          <span className="meta-value">UNCLOS 220(3) · TIP-AND-CUE</span>
        </div>
      </div>
    </header>
  )
}
