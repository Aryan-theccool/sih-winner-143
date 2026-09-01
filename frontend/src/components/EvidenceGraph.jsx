import React from 'react'

const CHAIN = [
  { id: 'satellite', label: 'SATELLITE' },
  { id: 'slick', label: 'SLICK' },
  { id: 'origin', label: 'ORIGIN' },
  { id: 'timewin', label: 'TIME WINDOW' },
  { id: 'vessel', label: 'VESSEL' },
  { id: 'ais', label: 'AIS TRACK' },
  { id: 'position', label: 'SHIP POSITION' },
  { id: 'orb', label: 'ORB' },
  { id: 'chemical', label: 'CHEMICAL' },
  { id: 'legal', label: 'LEGAL FRAMEWORK' },
]

export default function EvidenceGraph({ onSelect, active }) {
  return (
    <div className="evidence-graph">
      {CHAIN.map((node, i) => (
        <React.Fragment key={node.id}>
          <button
            className={`eg-node ${active === node.id ? 'active' : ''} ${['orb', 'chemical'].includes(node.id) ? 'pending' : ''}`}
            onClick={() => onSelect(node.id)}
          >
            {node.label}
          </button>
          {i < CHAIN.length - 1 && <div className="eg-arrow">↓</div>}
        </React.Fragment>
      ))}
    </div>
  )
}
