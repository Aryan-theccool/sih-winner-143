import React from 'react'
import { EVIDENCE_TIERS } from '../utils/terminology'

export default function EvidentiaryLadder({ ranking }) {
  const top = ranking?.ranking?.[0]
  let activeTier = 1
  if (top?.score >= 0.4) activeTier = 2
  if (top?.features?.gap_overlap_h > 2 || top?.features?.origin_mass > 0.7) activeTier = 3

  return (
    <div className="evidence-ladder">
      <div className="ladder-title">EVIDENTIARY LADDER</div>
      <div className="ladder-note">Intelligence &amp; recommendations — not automatic legal findings</div>
      {EVIDENCE_TIERS.map((t) => (
        <div
          key={t.tier}
          className={`ladder-tier tier-${t.color} ${t.tier <= activeTier ? 'active' : ''}`}
        >
          <div className="ladder-tier-num">TIER {t.tier}</div>
          <div className="ladder-tier-body">
            <div className="ladder-tier-title">{t.title}</div>
            <div className="ladder-tier-action">{t.action}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
