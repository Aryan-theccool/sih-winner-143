import React, { useMemo } from 'react'
import { slickCharacterisation } from '../utils/caseAnalytics'
import { originConfidence } from '../utils/terminology'

export default function CaseStoryFlow({
  caseInfo, detection, manifest, ranking,
  activeStep, onStep,
}) {
  const char = slickCharacterisation(detection, manifest)
  const top = ranking?.ranking?.[0]
  const score = top ? Math.round(top.score * 100) : '—'
  const originProb = originConfidence(manifest)

  const steps = useMemo(() => [
    {
      id: 'case',
      question: 'CASE',
      answer: caseInfo?.case_id?.replace('KERALA_', 'KER_') || '—',
      view: 'map',
    },
    {
      id: 'what',
      question: 'WHAT HAPPENED?',
      answer: char ? `Possible oil spill · ${char.probability}%` : 'Possible oil spill',
      view: 'detection',
    },
    {
      id: 'when',
      question: 'WHEN DID IT START?',
      answer: char?.ageRange || '28–42 hours',
      sub: 'Estimated spill age',
      view: 'detection',
    },
    {
      id: 'where',
      question: 'WHERE DID IT START?',
      answer: 'Probable origin cloud',
      sub: `${originProb}% · ~42 km²`,
      view: 'origin',
    },
    {
      id: 'who',
      question: 'WHO WAS THERE?',
      answer: 'AIS replay',
      sub: `${ranking?.n_vessels || 20} vessels tracked`,
      view: 'map',
    },
    {
      id: 'which',
      question: 'WHICH VESSEL FITS?',
      answer: top ? `Candidate #1` : '—',
      sub: top ? `${top.name.split(' ').slice(-2).join(' ')} · ${score}%` : null,
      view: 'vessels',
    },
    {
      id: 'why',
      question: 'WHY THIS VESSEL?',
      answer: 'Evidence chain',
      sub: 'SHAP · AIS · SAR',
      view: 'evidence',
    },
    {
      id: 'prove',
      question: 'WHAT CAN WE PROVE?',
      answer: 'Regulatory mapping',
      sub: 'UNCLOS · MARPOL',
      view: 'evidence',
    },
    {
      id: 'dossier',
      question: 'CASE DOSSIER',
      answer: 'Export bundle',
      sub: 'Hash-verified PDF',
      view: 'report',
    },
  ], [caseInfo, char, originProb, top, score, ranking])

  return (
    <nav className="case-story" aria-label="Investigation narrative">
      <div className="case-story-title">INVESTIGATION FLOW</div>
      {steps.map((step, i) => (
        <React.Fragment key={step.id}>
          <button
            type="button"
            className={`story-step ${activeStep === step.id ? 'active' : ''} ${i <= steps.findIndex((s) => s.id === activeStep) ? 'visited' : ''}`}
            onClick={() => onStep(step)}
          >
            <span className="story-q">{step.question}</span>
            <span className="story-a">{step.answer}</span>
            {step.sub && <span className="story-sub">{step.sub}</span>}
          </button>
          {i < steps.length - 1 && <div className="story-arrow">↓</div>}
        </React.Fragment>
      ))}
    </nav>
  )
}
