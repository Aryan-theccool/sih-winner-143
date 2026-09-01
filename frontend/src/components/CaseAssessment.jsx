import React from 'react'
import { caseAssessment } from '../utils/caseAnalytics'

function Bar({ label, value, color }) {
  return (
    <div className="assess-row">
      <span className="assess-label">{label}</span>
      <div className="assess-bar">
        <div className={`assess-fill ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="assess-pct">{value}%</span>
    </div>
  )
}

export default function CaseAssessment({ detection, manifest, ranking }) {
  const a = caseAssessment(detection, manifest, ranking)
  return (
    <div className="case-assessment">
      <div className="assess-title">CASE ASSESSMENT</div>
      <Bar label="Detection" value={a.detection} color="red" />
      <Bar label="Origin inference" value={a.origin} color="purple" />
      <Bar label="Vessel attribution" value={a.attribution} color="cyan" />
      <Bar label="Corroboration" value={a.corroboration} color="green" />
      <div className="assess-status">{a.status}</div>
      <div className="assess-note">Stages shown separately — not a single combined AI confidence</div>
    </div>
  )
}
