import React, { useEffect, useState } from 'react'

export default function DossierModal({ open, onClose, caseId }) {
  const [step, setStep] = useState(0)
  const steps = [
    'Compiling SAR detection records…',
    'Embedding drift reconstruction…',
    'Attaching vessel attribution…',
    'Sealing evidence hashes…',
    'Generating PDF dossier…',
  ]

  useEffect(() => {
    if (!open) { setStep(0); return undefined }
    const iv = setInterval(() => setStep((s) => Math.min(s + 1, steps.length)), 600)
    return () => clearInterval(iv)
  }, [open, steps.length])

  if (!open) return null

  const done = step >= steps.length

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>GENERATING CASE DOSSIER</h3>
        <p className="modal-case">{caseId}</p>
        <div className="modal-steps">
          {steps.map((s, i) => (
            <div key={s} className={`modal-step ${i < step ? 'done' : i === step ? 'active' : ''}`}>
              {i < step ? '✓' : i === step && !done ? '◉' : '○'} {s}
            </div>
          ))}
        </div>
        {done && (
          <div className="modal-done">
            <a href="/api/evidence/pdf" download className="action-btn export">
              ⬇ DOWNLOAD PDF DOSSIER
            </a>
            <button className="action-btn" onClick={onClose}>CLOSE</button>
          </div>
        )}
      </div>
    </div>
  )
}
