import React from 'react'
import { Link } from 'react-router-dom'
import { STEPS, OVERVIEW_STEP } from '../utils/stepGuide'

function Icon({ name }) {
  const p = {
    viewBox: '0 0 24 24', width: 18, height: 18, fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.5, strokeLinejoin: 'round', strokeLinecap: 'round',
  }
  switch (name) {
    case 'map':
      return <svg {...p}><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></svg>
    case 'detection':
      return <svg {...p}><path d="M3 8c3-2 6 1 9-1s6 0 9-2v11c-3 2-6-1-9 1s-6 0-9 2V8z" /><circle cx="13" cy="13" r="2.5" /></svg>
    case 'origin':
      return <svg {...p}><path d="M12 21s-6-5.4-6-10a6 6 0 1112 0c0 4.6-6 10-6 10z" /><circle cx="12" cy="11" r="2.2" /></svg>
    case 'vessels':
      return <svg {...p}><path d="M4 18l3.2-8.4a2 2 0 011.9-1.3h5.8a2 2 0 011.9 1.3L20 18" /><path d="M3 18c1.6 0 2.4 1.6 4.5 1.6S10.4 18 12 18s2.4 1.6 4.5 1.6S19.4 18 21 18" /><path d="M12 8.3V5M9 5h6" /></svg>
    case 'evidence':
      return <svg {...p}><path d="M12 3l7 3.2v5.3c0 4.4-2.9 8.1-7 9.2-4.1-1.1-7-4.8-7-9.2V6.2L12 3z" /><path d="M9.2 12.1l2 2 3.6-4" /></svg>
    case 'report':
      return <svg {...p}><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></svg>
    case 'help':
      return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M9.6 9.2A2.5 2.5 0 0112 7.5c1.4 0 2.5 1 2.5 2.3 0 1.7-2.5 1.9-2.5 3.6" /><path d="M12 17h.01" /></svg>
    case 'exit':
      return <svg {...p}><path d="M14 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4" /><path d="M10 8l-4 4 4 4M6 12h11" /></svg>
    default:
      return null
  }
}

const ITEMS = [
  { id: OVERVIEW_STEP.id, num: OVERVIEW_STEP.num, label: OVERVIEW_STEP.rail, icon: 'map', tip: OVERVIEW_STEP.question },
  ...STEPS.map((s) => ({ id: s.id, num: s.num, label: s.rail, icon: s.id, tip: s.question })),
]

export default function LeftRail({ view, setView, onHelp }) {
  return (
    <nav className="sn-rail" aria-label="Investigation steps">
      <div className="sn-rail-brand" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.6 2.6 2.6 14.4 0 17-2.6-2.6-2.6-14.4 0-17z" />
        </svg>
      </div>

      <div className="sn-rail-label mono">PIPELINE</div>

      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`sn-rail-btn ${view === item.id ? 'active' : ''}`}
          onClick={() => setView(item.id)}
          title={item.tip}
          aria-current={view === item.id ? 'page' : undefined}
        >
          <span className="sn-rail-icon"><Icon name={item.icon} /></span>
          <span className="sn-rail-num mono">{item.num}</span>
          <span className="sn-rail-lbl">{item.label}</span>
          <span className="sn-rail-tip" role="tooltip">{item.tip}</span>
        </button>
      ))}

      <div className="sn-rail-spacer" />

      <button type="button" className="sn-rail-btn" onClick={onHelp} title="How to read this dashboard">
        <span className="sn-rail-icon"><Icon name="help" /></span>
        <span className="sn-rail-lbl">Guide</span>
      </button>
      <Link to="/" className="sn-rail-btn" title="Back to the SAGAR-NET overview">
        <span className="sn-rail-icon"><Icon name="exit" /></span>
        <span className="sn-rail-lbl">Exit</span>
      </Link>
    </nav>
  )
}
