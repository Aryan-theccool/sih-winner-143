import React from 'react'
import { MAP_MODES, FLOW_NL } from '../utils/mapModes'

export default function MapModeControl({
  mapMode, setMapMode, coords, flowPlaying, onFlowPlay, onPredict24h,
}) {
  return (
    <>
      <div className="map-mode-bar" role="tablist" aria-label="Map mode">
        {MAP_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mapMode === m.id}
            className={`map-mode-btn ${mapMode === m.id ? 'active' : ''}`}
            onClick={() => setMapMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mapMode === 'oil_flow' && (
        <div className="flow-controls">
          <p className="flow-nl">{FLOW_NL}</p>
          <div className="flow-btns">
            <button type="button" className="flow-btn" onClick={onFlowPlay}>
              {flowPlaying ? '⏸ PAUSE FLOW' : '▶ PLAY FLOW'}
            </button>
            <button type="button" className="flow-btn secondary" onClick={onPredict24h}>
              PREDICT +24H
            </button>
          </div>
        </div>
      )}

      <div className="map-loc-card">
        <div className="mlc-title">KERALA SECTOR · Arabian Sea</div>
        <div className="mlc-coords mono">{coords || '9.35°N · 75.85°E'}</div>
        <div className="mlc-ref mono">WGS84 · Indian EEZ</div>
      </div>
    </>
  )
}
