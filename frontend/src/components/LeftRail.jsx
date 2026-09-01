import React from 'react'

const ITEMS = [
  { id: 'map', icon: '◉', label: 'Map' },
  { id: 'detection', icon: '◎', label: 'Detection' },
  { id: 'origin', icon: '↶', label: 'Origin' },
  { id: 'vessels', icon: '⚓', label: 'Vessels' },
  { id: 'evidence', icon: '⬡', label: 'Evidence' },
  { id: 'report', icon: '▤', label: 'Report' },
]

export default function LeftRail({ view, setView, onGenerateDossier }) {
  return (
    <nav className="left-rail">
      <div className="rail-brand">OT</div>
      {ITEMS.map((item) => (
        <button
          key={item.id}
          className={`rail-btn ${view === item.id || (view === 'map' && item.id === 'map') ? 'active' : ''}`}
          onClick={() => setView(item.id === 'map' ? 'map' : item.id)}
          title={item.label}
        >
          <span className="rail-icon">{item.icon}</span>
          <span className="rail-label">{item.label}</span>
        </button>
      ))}
      <div className="rail-spacer" />
      <button className="rail-btn rail-export" onClick={onGenerateDossier} title="Generate dossier">
        <span className="rail-icon">⬇</span>
        <span className="rail-label">Dossier</span>
      </button>
    </nav>
  )
}
