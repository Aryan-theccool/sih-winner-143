import React from 'react'

function Icon({ name }) {
  const p = { viewBox: '0 0 24 24', width: 18, height: 18, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 }
  switch (name) {
    case 'map':
      return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="1" /><path d="M3 9h18M9 3v18" /></svg>
    case 'detection':
      return <svg {...p}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></svg>
    case 'origin':
      return <svg {...p}><path d="M12 4v4M8 8l3 3M16 8l-3 3M12 20v-4" /><circle cx="12" cy="12" r="3" /></svg>
    case 'vessels':
      return <svg {...p}><path d="M4 18l4-10h8l4 10H4zM8 8V6M16 8V6" /></svg>
    case 'evidence':
      return <svg {...p}><path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" /></svg>
    case 'report':
      return <svg {...p}><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M9 7h6M9 11h6M9 15h4" /></svg>
    case 'settings':
      return <svg {...p}><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
    default:
      return null
  }
}

const ITEMS = [
  { id: 'map', label: 'Map' },
  { id: 'detection', label: 'Detection' },
  { id: 'origin', label: 'Origin' },
  { id: 'vessels', label: 'Vessels' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'report', label: 'Report' },
]

export default function LeftRail({ view, setView }) {
  return (
    <nav className="sn-rail" aria-label="Primary navigation">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`sn-rail-btn ${view === item.id ? 'active' : ''}`}
          onClick={() => setView(item.id)}
          title={item.label}
          aria-current={view === item.id ? 'page' : undefined}
        >
          <span className="sn-rail-icon"><Icon name={item.id} /></span>
          <span className="sn-rail-lbl">{item.label}</span>
        </button>
      ))}
      <div className="sn-rail-spacer" />
      <button type="button" className="sn-rail-btn" title="Settings" aria-label="Settings">
        <span className="sn-rail-icon"><Icon name="settings" /></span>
        <span className="sn-rail-lbl">Settings</span>
      </button>
    </nav>
  )
}
