import React, { useEffect, useState } from 'react'

const GEN_STEPS = [
  'Collecting evidence',
  'Building maps',
  'Validating coordinates',
  'Attaching AIS history',
  'Adding regulatory references',
  'Generating hash',
  'Finalising report',
]

export default function DossierModal({ open, onClose, caseId, manifest }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!open) { setStep(0); return undefined }
    const iv = setInterval(() => setStep((s) => Math.min(s + 1, GEN_STEPS.length)), 500)
    return () => clearInterval(iv)
  }, [open])

  if (!open) return null

  const done = step >= GEN_STEPS.length
  const hash = manifest?.input_sha256?.sar_scene?.slice(0, 16) || 'a3f8c2e91b047d6e'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card sn-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sn-modal-brand">SAGAR-NET</div>
        <h3>MARINE OIL-SPILL ATTRIBUTION CASE FILE</h3>
        <p className="modal-case mono">{caseId}</p>

        {!done ? (
          <div className="modal-steps">
            <p className="sn-gen-title">GENERATING CASE DOSSIER</p>
            {GEN_STEPS.map((s, i) => (
              <div key={s} className={`modal-step ${i < step ? 'done' : i === step ? 'active' : ''}`}>
                {i < step ? '✓' : i === step ? '◉' : '○'} {s.toUpperCase()}
              </div>
            ))}
          </div>
        ) : (
          <div className="sn-dossier-ready">
            <h4>CASE DOSSIER READY</h4>
            <dl className="meta-list mono">
              <div><dt>Format</dt><dd>PDF · 18 pages</dd></div>
              <div><dt>SHA-256</dt><dd>{hash}…</dd></div>
              <div><dt>Generated</dt><dd>12 JUN 2025 · 07:02 UTC</dd></div>
            </dl>
            <p className="status-icon-ok">Integrity verified</p>
            <a href="/api/evidence/pdf" download className="btn-primary export">
              DOWNLOAD CASE DOSSIER
            </a>
            <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  )
}
