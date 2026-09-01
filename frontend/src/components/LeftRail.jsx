import React from 'react'

const ITEMS = [
  { id: 'map', icon: '⊕', label: 'Map' },
  { id: 'detection', icon: '◎', label: 'Detection' },
  { id: 'origin', icon: '↶', label: 'Origin' },
  { id: 'vessels', icon: '⛵', label: 'Vessels' },
  { id: 'evidence', icon: '⬡', label: 'Evidence' },
  { id: 'report', icon: '▤', label: 'Report' },
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
          <span className="sn-rail-icon">{item.icon}</span>
          <span className="sn-rail-lbl">{item.label}</span>
        </button>
      ))}
      <div className="sn-rail-spacer" />
      <button type="button" className="sn-rail-btn" title="Settings" aria-label="Settings">
        <span className="sn-rail-icon">⚙</span>
        <span className="sn-rail-lbl">Settings</span>
      </button>
    </nav>
  )
}
