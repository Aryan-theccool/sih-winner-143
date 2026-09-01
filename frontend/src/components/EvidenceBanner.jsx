import React from 'react'

export default function EvidenceBanner({ manifest }) {
  const hash = manifest?.input_sha256?.sar_scene?.slice(0, 12) || '—'

  return (
    <div className="evidence-banner" role="note">
      <div className="eb-tier">
        <span className="eb-tier-label">UNCLOS TIER</span>
        <strong>TIP-AND-CUE</strong>
      </div>
      <p className="eb-copy">
        Supports Art.&nbsp;220(3) information request — not detention-grade evidence (Art.&nbsp;220(6)
        requires ORB + EN&nbsp;15522 fingerprinting).
      </p>
      <div className="eb-chain mono">
        <span>CHAIN</span>
        <span className="eb-hash" title={manifest?.input_sha256?.sar_scene}>SHA-256 · {hash}…</span>
      </div>
    </div>
  )
}
