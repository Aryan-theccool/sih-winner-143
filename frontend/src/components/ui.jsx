import React from 'react'
import { Term } from './Glossary'

/** Small shared primitives so every sidebar panel reads the same way. */

export function Card({ title, note, right, children, className = '' }) {
  return (
    <section className={`sn-card ${className}`}>
      {(title || right) && (
        <header className="sn-card-head">
          {title && <h4 className="sn-card-title">{title}</h4>}
          {right && <div className="sn-card-right">{right}</div>}
        </header>
      )}
      {note && <p className="sn-card-note">{note}</p>}
      <div className="sn-card-body">{children}</div>
    </section>
  )
}

export function Metric({ value, unit, label, tone = '', glossary, note }) {
  return (
    <div className={`sn-metric ${tone ? `tone-${tone}` : ''}`}>
      <div className="sn-metric-value">
        {value}
        {unit && <span className="sn-metric-unit">{unit}</span>}
      </div>
      <div className="sn-metric-label">
        {glossary ? <Term k={glossary}>{label}</Term> : label}
      </div>
      {note && <div className="sn-metric-note">{note}</div>}
    </div>
  )
}

export function Bar({ pct = 0, tone = '', label, value, stagger = 0 }) {
  const w = Math.max(0, Math.min(100, pct))
  return (
    <div className="sn-bar-row panel-stagger" style={{ '--stagger': stagger }}>
      {label && <span className="sn-bar-label">{label}</span>}
      <div className="sn-bar-track">
        <div className={`sn-bar-fill ${tone ? `tone-${tone}` : ''} anim-bar`} style={{ width: `${w}%` }} />
      </div>
      {value != null && <span className="sn-bar-value mono">{value}</span>}
    </div>
  )
}

const TAG_TONE = {
  observed: 'OBSERVED',
  inferred: 'MODEL-INFERRED',
  probable: 'PROBABLE',
  corroborated: 'CORROBORATED',
  recommend: 'RECOMMENDATION',
  active: 'ACTIVE',
}

export function Tag({ tone = 'recommend', children, glossary }) {
  const body = children ?? TAG_TONE[tone] ?? tone
  return <span className={`sn-tag tone-${tone}`}>{glossary ? <Term k={glossary}>{body}</Term> : body}</span>
}

/** Framed note — the caveat, the reassurance, or the next action. */

export function Callout({ tone = 'info', title, children }) {
  return (
    <div className={`sn-callout tone-${tone}`}>
      {title && <b className="sn-callout-title">{title}</b>}
      <div className="sn-callout-body">{children}</div>
    </div>
  )
}

export function Btn({ variant = 'ghost', size, children, onClick, href, title, disabled }) {
  const cls = `sn-btn sn-btn-${variant} ${size === 'sm' ? 'sn-btn-sm' : ''}`
  if (href) {
    return (
      <a className={cls} href={href} title={title} download>
        {children}
      </a>
    )
  }
  return (
    <button type="button" className={cls} onClick={onClick} title={title} disabled={disabled}>
      {children}
    </button>
  )
}

