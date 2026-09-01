import React from 'react'
import { REGULATORY } from '../utils/caseAnalytics'
import { Term } from './Glossary'

/** Maps the case onto real instruments, and states what each one still needs. */
export default function RegulatoryPanel() {
  return (
    <div className="sn-reg">
      <p className="sn-reg-intro">
        Potential relevance only. A <Term k="unclos">human authority</Term> decides whether it applies — the
        platform never states that an offence occurred.
      </p>
      {REGULATORY.map((r) => (
        <article key={r.id} className={`sn-reg-item rel-${r.relevance.toLowerCase()}`}>
          <header className="sn-reg-head">
            <h4>{r.framework}</h4>
            <span className="sn-reg-badge">
              {r.relevance === 'YES' ? 'SUPPORTED NOW' : r.relevance === 'ADVISORY' ? 'ADVISORY' : 'POSSIBLE'}
            </span>
          </header>
          <p className="sn-reg-cond">{r.condition}</p>
          <div className="sn-reg-cols">
            <div>
              <span className="sn-reg-col mono">HAVE</span>
              {r.supporting.map((s) => <div key={s} className="sn-reg-line ok">✓ {s}</div>)}
            </div>
            <div>
              <span className="sn-reg-col mono">NEED</span>
              {r.missing.map((m) => <div key={m} className="sn-reg-line warn">! {m}</div>)}
            </div>
          </div>
          <p className="sn-reg-act">
            <span className="mono">NEXT ACTION</span> {r.action}
          </p>
        </article>
      ))}
    </div>
  )
}
