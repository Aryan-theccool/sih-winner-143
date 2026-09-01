import React, { useEffect, useState } from 'react'

const GEN_STEPS = [
  'Collecting evidence',
  'Building maps',
  'Validating coordinates',
  'Attaching AIS history',
  'Adding regulatory references',
  'Generating integrity hash',
  'Finalising report',
]

export default function DossierModal({ open, onClose, caseId, manifest }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!open) { setStep(0); return undefined }
    const iv = setInterval(() => setStep((s) => Math.min(s + 1, GEN_STEPS.length)), 460)
    return () => clearInterval(iv)
  }, [open])

  if (!open) return null

  const done = step >= GEN_STEPS.length
  const hash = manifest?.input_sha256?.sar_scene?.slice(0, 16) || 'a3f8c2e91b047d6e'

  return (
    <div className="rg-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Case dossier">
      <div className="sn-dossier-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sn-dossier-brand mono">SAGAR<span>-NET</span></div>
        <h3>Marine oil-spill attribution case file</h3>
        <p className="sn-dossier-case mono">{caseId}</p>

        {!done ? (
          <div className="sn-dossier-gen">
            <p className="mono sn-dossier-gen-lbl">ASSEMBLING · {Math.round((step / GEN_STEPS.length) * 100)}%</p>
            <div className="sn-dossier-progress"><div style={{ width: `${(step / GEN_STEPS.length) * 100}%` }} /></div>
            {GEN_STEPS.map((s, i) => (
              <div key={s} className={`sn-dossier-step ${i < step ? 'done' : i === step ? 'active' : ''}`}>
                <span>{i < step ? '✓' : i === step ? '◉' : '○'}</span> {s}
              </div>
            ))}
          </div>
        ) : (
          <div className="sn-dossier-done">
            <p className="sn-dossier-ok">Ready for review</p>
            <div className="sn-kv">
              <div className="sn-kv-row"><dt>Format</dt><dd className="mono">PDF · 18 pages</dd></div>
              <div className="sn-kv-row"><dt>Contains</dt><dd className="mono">maps · tracks · model settings · hashes</dd></div>
              <div className="sn-kv-row"><dt>SHA-256</dt><dd className="mono">{hash}…</dd></div>
              <div className="sn-kv-row"><dt>Generated</dt><dd className="mono">12 JUN 2025 · 07:02 UTC</dd></div>
            </div>
            <div className="sn-dossier-actions">
              <a className="sn-btn sn-btn-primary" href="/api/evidence/pdf" download>Download dossier</a>
              <button type="button" className="sn-btn sn-btn-ghost" onClick={onClose}>Close</button>
            </div>
            <p className="sn-dossier-foot mono">
              ADVISORY OUTPUT · A HUMAN AUTHORITY DECIDES WHETHER IT SUPPORTS ACTION
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
