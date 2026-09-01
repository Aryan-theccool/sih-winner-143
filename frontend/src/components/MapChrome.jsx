import React from 'react'

const LAYERS = [
  { key: 'ships', label: 'AIS' },
  { key: 'tracks', label: 'TRACKS' },
  { key: 'oil', label: 'OIL' },
  { key: 'flow', label: 'FLOW' },
  { key: 'current', label: 'CURRENT' },
  { key: 'wind', label: 'WIND' },
  { key: 'waves', label: 'WAVES' },
  { key: 'backtrack', label: 'ORIGIN' },
  { key: 'gaps', label: 'AIS GAPS' },
  { key: 'mask', label: 'DETECT' },
  { key: 'sar', label: 'SAR' },
]

export default function MapChrome({
  show, setShow, originMode, setOriginMode, flowMode, setFlowMode,
  onTraceBackward, onFlowForward, caseInfo, coords,
}) {
  return (
    <>
      <div className="map-toolbar">
        <button className={`mt-btn ${originMode ? 'on' : ''}`} onClick={onTraceBackward}>
          ↶ TRACE BACKWARD
        </button>
        <button className={`mt-btn ${flowMode ? 'on' : ''}`} onClick={onFlowForward}>
          → FLOW FORWARD
        </button>
      </div>

      <div className="map-loc-card">
        <div className="mlc-title">KERALA SECTOR</div>
        <div className="mlc-coords mono">{coords || '9.35°N · 75.85°E'}</div>
        <div className="mlc-ref mono">WGS84 · INDIAN EEZ</div>
      </div>

      <div className="map-layer-bar">
        {LAYERS.map((l) => (
          <button
            key={l.key}
            className={show[l.key] ? 'on' : ''}
            onClick={() => setShow((s) => ({ ...s, [l.key]: !s[l.key] }))}
          >
            {l.label}
          </button>
        ))}
      </div>
    </>
  )
}
