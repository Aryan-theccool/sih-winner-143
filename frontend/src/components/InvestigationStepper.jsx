import React from 'react'
import { WORKFLOW_STAGES } from '../utils/workflow'

export default function InvestigationStepper({ activeStage, onStage, maxReached }) {
  const reachedIdx = WORKFLOW_STAGES.findIndex((s) => s.id === maxReached)

  return (
    <nav className="investigation-stepper" aria-label="Investigation workflow">
      {WORKFLOW_STAGES.map((stage, i) => {
        const isActive = stage.id === activeStage
        const isPast = i <= reachedIdx
        const isFuture = i > reachedIdx + 1
        return (
          <React.Fragment key={stage.id}>
            {i > 0 && <span className="step-arrow" aria-hidden="true">→</span>}
            <button
              type="button"
              className={`step-btn ${isActive ? 'active' : ''} ${isPast ? 'visited' : ''} ${isFuture ? 'future' : ''}`}
              onClick={() => onStage(stage)}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className="step-num">{stage.num}</span>
              <span className="step-label">{stage.label}</span>
            </button>
          </React.Fragment>
        )
      })}
    </nav>
  )
}
