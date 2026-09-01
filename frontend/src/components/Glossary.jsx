import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { glossaryFor } from '../utils/glossary'

/**
 * Hover/focus any underlined term in the dashboard and its plain-language
 * definition appears in the strip pinned to the bottom of the sidebar — no
 * floating tooltip to be clipped by the scrolling panel.
 */

const GlossaryCtx = createContext({
  active: null,
  showTerm: () => {},
  clearTerm: () => {},
})

export function GlossaryProvider({ children }) {
  const [active, setActive] = useState(null)
  const showTerm = useCallback((key) => setActive(key), [])
  const clearTerm = useCallback(() => setActive(null), [])
  const value = useMemo(() => ({ active, showTerm, clearTerm }), [active, showTerm, clearTerm])
  return <GlossaryCtx.Provider value={value}>{children}</GlossaryCtx.Provider>
}

export function useGlossary() {
  return useContext(GlossaryCtx)
}

/** Inline jargon marker. `<Term k="sar">SAR</Term>` */
export function Term({ k, children, className = '' }) {
  const { active, showTerm, clearTerm } = useGlossary()
  const entry = glossaryFor(k)
  if (!entry) return <>{children}</>
  return (
    <button
      type="button"
      className={`sn-term ${active === k ? 'on' : ''} ${className}`}
      onMouseEnter={() => showTerm(k)}
      onMouseLeave={clearTerm}
      onFocus={() => showTerm(k)}
      onBlur={clearTerm}
      title={`${entry.term} — ${entry.plain}`}
    >
      {children ?? entry.term}
    </button>
  )
}

/** Persistent definition strip at the foot of the sidebar. */
export function DefinitionBar({ hint = 'Hover an underlined word at any time — the plain-English meaning appears here.' }) {
  const { active } = useGlossary()
  const entry = glossaryFor(active)
  return (
    <div className={`sn-defbar ${entry ? 'on' : ''}`} aria-live="polite">
      {entry ? (
        <>
          <span className="sn-defbar-key mono">{entry.term}</span>
          <span className="sn-defbar-body">
            <b>{entry.full}</b>
            <span>{entry.plain}</span>
          </span>
        </>
      ) : (
        <span className="sn-defbar-idle">{hint}</span>
      )}
    </div>
  )
}
export default GlossaryProvider
