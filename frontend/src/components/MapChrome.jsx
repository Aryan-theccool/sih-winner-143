import React, { useState } from 'react'
import { slickCharacterisation } from '../utils/caseAnalytics'
import { originConfidence } from '../utils/terminology'
import { MAP_MODES, FLOW_NL } from '../utils/mapModes'

const FORECAST_H = [6, 12, 24, 48]

const LAYER_TOGGLES = [
  { key: 'sar', label: 'SAR raster' },
  { key: 'oil', label: 'Detection' },
  { key: 'backtrack', label: 'Origin cloud' },
  { key: 'ships', label: 'Vessel radar' },
  { key: 'gaps', label: 'Dark-vessel flags' },
  { key: 'mask', label: 'Detectability mask' },
]

export default function MapChrome({
  caseInfo, detection, manifest, mapMode, setMapMode,
  viewState, flowPlaying, onFlowPlay, flowHour, setFlowHour,
  show, setShow,
}) {
  const [showLayers, setShowLayers] = useState(false)
  const [showLegend, setShowLegend] = useState(true)
  const char = slickCharacterisation(detection, manifest)
  const originPct = originConfidence(manifest)
  const scene = caseInfo?.scene

  const lat = viewState?.latitude?.toFixed(4) ?? '—'
  const lon = viewState?.longitude?.toFixed(4) ?? '—'

  const toggleLayer = (key) => {
    setShow?.((s) => ({ ...s, [key]: !s[key] }))
  }

  return (
    <>
      <div className="mc-sensor">
        <div className="mc-sensor-row"><span>SENSOR</span><b className="mono">Sentinel-1 IW GRDH</b></div>
        <div className="mc-sensor-row mono">
          <span>DATE</span><b>{caseInfo?.t0_utc?.slice(0, 10).replace(/-/g, ' ').toUpperCase()}</b>
        </div>
        <div className="mc-sensor-row"><span>Orbit</span><b>DESCENDING</b></div>
        <div className="mc-sensor-row"><span>Resolution</span><b className="mono">{scene?.resolution_m ?? 10} m</b></div>
      </div>

      {char && mapMode !== 'origin' && (
        <div className="mc-callout mc-callout-slick">
          <span className="mc-callout-val mono">
            Detected Slick | {char.area} km² | P: {char.probability}%
          </span>
        </div>
      )}

      {(mapMode === 'investigation' || mapMode === 'origin') && (
        <div className="mc-callout mc-callout-origin">
          <span className="mc-callout-val mono">
            Probable Origin | P: {originPct}% | Area: 42 km²
          </span>
        </div>
      )}

      <div className="mc-coords">
        <span className="mono">{lat}° N, {lon}° E</span>
        <div className="mc-scale">
          <div className="mc-scale-bar" />
          <span className="mono">20 km</span>
        </div>
      </div>

      {showLegend && (
        <div className="mc-legend">
          <div className="mc-legend-title">LEGEND</div>
          <div><span className="lg-slick lg-dash" /> Detected slick</div>
          <div><span className="lg-origin" /> Probable origin</div>
          <div><span className="lg-vessel" /> Vessel</div>
          <div><span className="lg-drift" /> AIS track</div>
          <div><span className="lg-gap" /> Dark-vessel gap</div>
        </div>
      )}

      {showLayers && show && (
        <div className="mc-layers-pop panel-enter">
          <div className="mc-layers-title">LAYER TOGGLE</div>
          {LAYER_TOGGLES.map((l) => (
            <label key={l.key}>
              <input type="checkbox" checked={!!show[l.key]} onChange={() => toggleLayer(l.key)} />
              {l.label}
            </label>
          ))}
        </div>
      )}

      <div className="mc-toolbar" role="tablist">
        <button type="button" className={showLayers ? 'active' : ''} onClick={() => setShowLayers((l) => !l)}>LAYERS</button>
        <button type="button" className={showLegend ? 'active' : ''} onClick={() => setShowLegend((l) => !l)}>LEGEND</button>
        <span className="mc-toolbar-sep" />
        {MAP_MODES.filter((m) => m.id !== 'evidence').map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mapMode === m.id}
            className={mapMode === m.id ? 'active' : ''}
            onClick={() => setMapMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mapMode === 'oil_flow' && (
        <div className="mc-flow-panel panel-enter">
          <p className="mc-flow-nl">{FLOW_NL}</p>
          <div className="mc-flow-row">
            <button type="button" className="mc-flow-btn" onClick={onFlowPlay}>
              {flowPlaying ? '⏸ PAUSE' : '▶ FLOW'}
            </button>
            <span className="mc-flow-lbl">FLOW FORECAST</span>
            {FORECAST_H.map((h) => (
              <button
                key={h}
                type="button"
                className={`mc-forecast ${flowHour === h ? 'active' : ''}`}
                onClick={() => setFlowHour?.(h)}
              >
                +{h}H
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
