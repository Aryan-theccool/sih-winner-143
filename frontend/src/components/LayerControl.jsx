import React from 'react'
import { fmtUtc } from '../utils/caseAnalytics'

export default function LayerControl({ show, setShow, originMode, setOriginMode, flowMode, setFlowMode }) {
  const layers = [
    { key: 'oil', label: 'OIL' },
    { key: 'current', label: 'CURRENT' },
    { key: 'wind', label: 'WIND' },
    { key: 'waves', label: 'WAVES' },
    { key: 'ships', label: 'AIS' },
    { key: 'backtrack', label: 'ORIGIN' },
    { key: 'mask', label: 'DETECTABILITY' },
  ]

  return (
    <div className="layer-control">
      <div className="layer-title">MAP LAYERS</div>
      <div className="layer-btns">
        {layers.map((l) => (
          <button
            key={l.key}
            className={show[l.key] ? 'on' : ''}
            onClick={() => setShow((s) => ({ ...s, [l.key]: !s[l.key] }))}
          >
            {l.label}
          </button>
        ))}
      </div>
      <div className="layer-modes">
        <button className={originMode ? 'on' : ''} onClick={() => setOriginMode((o) => !o)}>
          ORIGIN MODE
        </button>
        <button className={flowMode ? 'on' : ''} onClick={() => setFlowMode((f) => !f)}>
          FLOW
        </button>
      </div>
      {flowMode && (
        <div className="flow-chain">
          <span>CURRENT</span><span>→</span>
          <span>WIND</span><span>→</span>
          <span>OIL TRANSPORT</span><span>→</span>
          <span>OBSERVED SLICK</span>
        </div>
      )}
    </div>
  )
}
