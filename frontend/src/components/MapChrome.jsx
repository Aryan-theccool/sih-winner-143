import React, { useState } from 'react'
import { slickCharacterisation } from '../utils/caseAnalytics'
import { originConfidence } from '../utils/terminology'
import { MAP_MODES, FLOW_NL } from '../utils/mapModes'

const FORECAST_H = [6, 12, 24, 48]

export default function MapChrome({
  caseInfo, detection, manifest, mapMode, setMapMode,
  viewState, flowPlaying, onFlowPlay, flowHour, setFlowHour,
  onTraceOrigin, onViewOilFlow,
}) {
  const [showLegend, setShowLegend] = useState(false)
  const char = slickCharacterisation(detection, manifest)
  const originPct = originConfidence(manifest)
  const rw = manifest?.origin_estimate?.estimated_release_window_utc
  const scene = caseInfo?.scene

  const lat = viewState?.latitude?.toFixed(4) ?? '—'
  const lon = viewState?.longitude?.toFixed(4) ?? '—'

  return (
    <>
      {/* Sensor metadata — top left */}
      <div className="mc-sensor">
        <div className="mc-sensor-row"><span>SENSOR</span><b className="mono">Sentinel-1 IW GRDH</b></div>
        <div className="mc-sensor-row mono">
          {caseInfo?.t0_utc?.slice(0, 10).replace(/-/g, ' ').toUpperCase().replace('2025', '2025')} · {caseInfo?.t0_utc?.slice(11, 16)} UTC
        </div>
        <div className="mc-sensor-row"><span>Orbit</span><b>DESCENDING</b></div>
        <div className="mc-sensor-row"><span>Resolution</span><b className="mono">{scene?.resolution_m ?? 10} m</b></div>
      </div>

      {/* Slick callout */}
      {char && mapMode !== 'origin' && (
        <div className="mc-callout mc-callout-slick">
          <span className="mc-callout-title">Detected Slick</span>
          <span className="mc-callout-val mono">{char.area} km² · P: {char.probability}%</span>
        </div>
      )}

      {/* Origin callout */}
      {rw && (mapMode === 'investigation' || mapMode === 'origin') && (
        <div className="mc-callout mc-callout-origin">
          <span className="mc-callout-title">Probable Origin</span>
          <span className="mc-callout-val mono">
            {rw[0].slice(8, 10)} JUN 2025 · {rw[0].slice(11, 16)}–{rw[1].slice(11, 16)} UTC
          </span>
          <span className="mc-callout-sub mono">P: {originPct}% · 42 km²</span>
        </div>
      )}

      {/* Coordinates + scale — bottom left */}
      <div className="mc-coords">
        <span className="mono">{lat}° N, {lon}° E</span>
        <div className="mc-scale">
          <div className="mc-scale-bar" />
          <span className="mono">20 km</span>
        </div>
        <div className="mc-map-tools">
          <button type="button" onClick={() => setShowLegend((l) => !l)}>LAYERS</button>
          <button type="button" className={showLegend ? 'on' : ''} onClick={() => setShowLegend((l) => !l)}>LEGEND</button>
        </div>
      </div>

      {showLegend && (
        <div className="mc-legend">
          <div><span className="lg-slick" /> SAR detected slick</div>
          <div><span className="lg-origin" /> Probable origin (model)</div>
          <div><span className="lg-vessel" /> AIS vessel track</div>
          <div><span className="lg-drift" /> Back-traced trajectory</div>
        </div>
      )}

      {/* Mode selector — bottom center on map */}
      <div className="mc-modes" role="tablist">
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
        <div className="mc-flow-panel">
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
