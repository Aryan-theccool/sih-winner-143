import React from 'react'
import { WORKFLOW_STEPS } from '../utils/terminology'

const STEP_INDEX = {
  detection: 1,
  origin: 3,
  suspects: 4,
  evidence: 5,
}

export default function WorkflowStrip({ activeTab, driftHour }) {
  let active = STEP_INDEX[activeTab] ?? 1
  if (driftHour > 0 && activeTab === 'origin') active = 3

  return (
    <div className="workflow-strip">
      {WORKFLOW_STEPS.map((step, i) => (
        <React.Fragment key={step}>
          <div className={`wf-step ${i <= active ? 'active' : ''} ${i === active ? 'current' : ''}`}>
            <span className="wf-dot" />
            <span className="wf-label">{step}</span>
          </div>
          {i < WORKFLOW_STEPS.length - 1 && <div className={`wf-connector ${i < active ? 'active' : ''}`} />}
        </React.Fragment>
      ))}
    </div>
  )
}
