import React from 'react'
import { REGULATORY } from '../utils/caseAnalytics'

export default function RegulatoryPanel() {
  return (
    <div className="regulatory-panel">
      <div className="panel-head compact">
        <h2>REGULATORY ASSESSMENT</h2>
        <span className="tag tag-inference">POTENTIAL RELEVANCE</span>
      </div>
      <p className="disclaimer-sm">Does not state legal violation — maps evidence to applicable frameworks.</p>
      {REGULATORY.map((r) => (
        <div key={r.id} className="reg-card">
          <div className="reg-header">
            <span className="reg-framework">{r.framework}</span>
            <span className={`reg-rel ${r.relevance === 'YES' ? 'yes' : 'pot'}`}>{r.relevance}</span>
          </div>
          <div className="reg-condition">{r.condition}</div>
          <div className="reg-evidence">
            <div className="reg-col">
              <span>Supporting</span>
              {r.supporting.map((s) => <div key={s} className="reg-ok">✓ {s}</div>)}
            </div>
            <div className="reg-col">
              <span>Missing</span>
              {r.missing.map((m) => <div key={m} className="reg-warn">⚠ {m}</div>)}
            </div>
          </div>
          <div className="reg-action">→ {r.action}</div>
        </div>
      ))}
    </div>
  )
}
