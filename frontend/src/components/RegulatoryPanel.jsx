import React from 'react'
import { REGULATORY } from '../utils/caseAnalytics'

export default function RegulatoryPanel() {
  return (
    <section className="regulatory-section">
      <h3 className="panel-hero-title">REGULATORY RELEVANCE</h3>
      <p className="disclaimer">Potential regulatory relevance — human authority review required. Does not state legal violation.</p>
      {REGULATORY.map((r) => (
        <article key={r.id} className="reg-item">
          <header className="reg-head">
            <h4>{r.framework}</h4>
            <span className={`reg-badge ${r.relevance === 'YES' ? 'yes' : 'pot'}`}>{r.relevance}</span>
          </header>
          <p className="reg-condition">{r.condition}</p>
          <div className="reg-cols">
            <div>
              <span className="reg-col-lbl">Supporting evidence</span>
              {r.supporting.map((s) => <div key={s} className="status-icon-ok">✓ {s}</div>)}
            </div>
            <div>
              <span className="reg-col-lbl">Missing evidence</span>
              {r.missing.map((m) => <div key={m} className="status-icon-warn">⚠ {m}</div>)}
            </div>
          </div>
          <p className="reg-action">Recommended action · {r.action}</p>
        </article>
      ))}
    </section>
  )
}
