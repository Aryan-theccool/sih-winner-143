import React from 'react'
import { Term } from './Glossary'

/** What the case can and cannot legally support right now. */
export default function EvidenceBanner({ manifest }) {
  const hash = manifest?.input_sha256?.sar_scene?.slice(0, 12) || '—'

  return (
    <div className="sn-integrity" role="note">
      <div className="sn-integrity-head">
        <span className="mono">LEGAL FLOOR</span>
        <b>UNCLOS Art. 220(3) · tip-and-cue</b>
      </div>
      <p className="sn-integrity-copy">
        Strong enough to <Term k="unclos">request information</Term> from the flagged vessel. Not yet
        detention grade — that needs <Term k="orb">ORB</Term> or EN&nbsp;15522 chemical fingerprinting, which
        no satellite can supply.
      </p>
      <div className="sn-integrity-chain">
        <span className="mono">SOURCE SEALED</span>
        <span className="sn-integrity-hash" title={manifest?.input_sha256?.sar_scene}>
          <Term k="hash">SHA-256</Term> {hash}…
        </span>
      </div>
    </div>
  )
}
