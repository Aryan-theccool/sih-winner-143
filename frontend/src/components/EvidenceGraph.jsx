import React from 'react'

/** The audit chain: what produced the finding, in order, with its gaps visible. */
const GROUPS = [
  {
    id: 'sensor',
    label: 'WHAT WAS MEASURED',
    nodes: [
      { id: 'satellite', label: 'Satellite pass' },
      { id: 'slick', label: 'Slick polygon' },
      { id: 'age', label: 'Slick age' },
    ],
  },
  {
    id: 'model',
    label: 'WHAT WAS MODELLED',
    nodes: [
      { id: 'origin', label: 'Origin cloud' },
      { id: 'timewin', label: 'Release window' },
    ],
  },
  {
    id: 'vessel',
    label: 'WHO WAS THERE',
    nodes: [
      { id: 'vessel', label: 'Candidate vessel' },
      { id: 'ais', label: 'AIS continuity' },
      { id: 'position', label: 'Position at release' },
    ],
  },
  {
    id: 'human',
    label: 'WHAT A HUMAN MUST ADD',
    pending: true,
    nodes: [
      { id: 'orb', label: 'Oil record book' },
      { id: 'chemical', label: 'Chemical fingerprint' },
      { id: 'corroboration', label: 'Corroboration' },
      { id: 'regulatory', label: 'Legal framework' },
    ],
  },
]

export default function EvidenceGraph({ onSelect, active }) {
  return (
    <div className="sn-chain">
      {GROUPS.map((g, gi) => (
        <div key={g.id} className="sn-chain-group">
          <div className="sn-chain-label mono">
            {g.label}
            {g.pending && <em>outstanding</em>}
          </div>
          <div className="sn-chain-nodes">
            {g.nodes.map((n) => (
              <button
                key={n.id}
                type="button"
                className={`sn-chain-node ${active === n.id ? 'active' : ''} ${g.pending && ['orb', 'chemical', 'corroboration'].includes(n.id) ? 'pending' : ''}`}
                onClick={() => onSelect(n.id)}
                title={g.pending ? 'Not collected yet — recorded as a gap in the dossier' : 'Show provenance for this stage'}
              >
                <span className="sn-chain-dot" />
                {n.label}
              </button>
            ))}
          </div>
          {gi < GROUPS.length - 1 && <div className="sn-chain-arrow" aria-hidden="true">↓</div>}
        </div>
      ))}
    </div>
  )
}
