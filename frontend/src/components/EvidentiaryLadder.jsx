import React from 'react'
import { EVIDENCE_TIERS } from '../utils/terminology'

const TIER_HELP = {
  1: 'A satellite saw something. Worth logging and watching.',
  2: 'A model puts a specific ship in the right place at the right time. Worth asking questions.',
  3: 'A second, independent signal agrees (an AIS gap, an unmatched radar contact). Worth inspecting.',
  4: 'Physical evidence matches (oil sample or logbook). Enforcement review.',
}

export default function EvidentiaryLadder({ ranking, compact = false }) {
  const top = ranking?.ranking?.[0]
  let activeTier = 1
  if (top?.score >= 0.4) activeTier = 2
  if (top?.features?.gap_overlap_h > 2 || top?.features?.origin_mass > 0.7) activeTier = 3

  return (
    <div className={`sn-ladder ${compact ? 'compact' : ''}`}>
      <div className="sn-ladder-head">
        <span className="sn-ladder-title mono">EVIDENCE STRENGTH</span>
        <span className="sn-ladder-note">
          {activeTier === 4 ? 'Enforcement grade' : `Tier ${activeTier} of 4 · ${EVIDENCE_TIERS[activeTier - 1].action}`}
        </span>
      </div>
      <div className="sn-ladder-track">
        {EVIDENCE_TIERS.map((t) => (
          <div
            key={t.tier}
            className={`sn-ladder-tier tier-${t.color} ${t.tier <= activeTier ? 'active' : ''}`}
            title={`T${t.tier} · ${t.title} — ${TIER_HELP[t.tier]}`}
          >
            <span className="sn-ladder-num mono">T{t.tier}</span>
            <span className="sn-ladder-txt">{t.title}</span>
            {!compact && <span className="sn-ladder-act">{t.action}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
