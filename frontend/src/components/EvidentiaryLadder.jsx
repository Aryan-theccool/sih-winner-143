import React from 'react'
import { EVIDENCE_TIERS } from '../utils/terminology'

export default function EvidentiaryLadder({ ranking, compact = false }) {
  const top = ranking?.ranking?.[0]
  let activeTier = 1
  if (top?.score >= 0.4) activeTier = 2
  if (top?.features?.gap_overlap_h > 2 || top?.features?.origin_mass > 0.7) activeTier = 3

  return (
    <div className={`evidence-ladder ${compact ? 'compact' : ''}`}>
      <div className="ladder-head">
        <span className="ladder-title">EVIDENTIARY LADDER</span>
        <span className="ladder-note">Intelligence — not automatic legal findings</span>
      </div>
      <div className="ladder-track">
        {EVIDENCE_TIERS.map((t) => (
          <div
            key={t.tier}
            className={`ladder-tier tier-${t.color} ${t.tier <= activeTier ? 'active' : ''}`}
          >
            <div className="ladder-tier-num">T{t.tier}</div>
            <div className="ladder-tier-body">
              <div className="ladder-tier-title">{t.title}</div>
              {!compact && <div className="ladder-tier-action">{t.action}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
