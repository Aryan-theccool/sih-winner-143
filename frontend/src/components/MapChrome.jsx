import React, { useState } from 'react'
import { slickCharacterisation } from '../utils/caseAnalytics'
import { originConfidence } from '../utils/terminology'
import { MAP_MODES, FLOW_NL, modeById } from '../utils/mapModes'

const FORECAST_H = [6, 12, 24, 48]

const LAYER_TOGGLES = [
  { key: 'sar', label: 'SAR image', plain: 'The radar backscatter the case was built from' },
  { key: 'oil', label: 'Detected slick', plain: 'Dark patches classified as oil' },
  { key: 'backtrack', label: 'Origin cloud', plain: 'Where the backward drift run puts the release' },
  { key: 'tracks', label: 'AIS tracks', plain: 'Reconstructed ship positions over 48 hours' },
  { key: 'ships', label: 'Vessels now', plain: 'Ship positions at the replay time' },
  { key: 'gaps', label: 'Beacon gaps', plain: 'Intervals where a ship stopped broadcasting' },
  { key: 'mask', label: 'Blind spots', plain: 'Wind outside the readable band — not assessable' },
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
  const mode = modeById(mapMode)

  const lat = viewState?.latitude?.toFixed(4) ?? '—'
  const lon = viewState?.longitude?.toFixed(4) ?? '—'

  const toggleLayer = (key) => setShow?.((s) => ({ ...s, [key]: !s[key] }))

  return (
    <>
      <div className="mc-card mc-sensor">
        <div className="mc-card-head mono">
          <span>SENSOR</span>
          <b>SENTINEL-1 {scene?.mode || 'IW'} · {scene?.polarization || 'VV+VH'}</b>
        </div>
        <div className="mc-rows">
          <div><span>Scene</span><b className="mono">{caseInfo?.t0_utc?.slice(0, 10)}</b></div>
          <div><span>Incidence</span><b className="mono">{scene?.incidence_angle_deg ?? 34.2}°</b></div>
          <div><span>Resolution</span><b className="mono">{scene?.resolution_m ?? 10} m</b></div>
          <div><span>Pass</span><b className="mono">{scene?.pass || 'descending'}</b></div>
          <div><span>Wind here</span><b className="mono">{char?.wind ?? '—'} m/s</b></div>
        </div>
      </div>

      {char && mapMode !== 'origin' && (
        <div className="mc-pin mc-pin-slick">
          <span className="mc-pin-dot" />
          <span>
            <b>Detected slick</b>
            <em className="mono">{char.area} km² · {char.probability}% oil</em>
          </span>
        </div>
      )}

      {(mapMode === 'investigation' || mapMode === 'origin') && (
        <div className="mc-pin mc-pin-origin">
          <span className="mc-pin-dot" />
          <span>
            <b>Probable origin</b>
            <em className="mono">{originPct}% confidence · ~42 km²</em>
          </span>
        </div>
      )}

      <div className="mc-card mc-legend">
        <div className="mc-card-head mono">
          <button type="button" onClick={() => setShowLegend((v) => !v)} className="mc-toggle">
            <span>LEGEND</span>{showLegend ? '—' : '+'}
          </button>
        </div>
        {showLegend && (
          <ul>
            <li><i className="k-slick" /> Detected slick <em>radar-dark, classified as oil</em></li>
            <li><i className="k-origin" /> Probable origin <em>backward drift, p50</em></li>
            <li><i className="k-track" /> AIS track <em>48 h of broadcasts</em></li>
            <li><i className="k-ship" /> Vessel at replay time</li>
            <li><i className="k-gap" /> Beacon gap <em>transmitter off</em></li>
            <li><i className="k-mask" /> Not assessable <em>wind outside 3–12 m/s</em></li>
          </ul>
        )}
      </div>

      <div className="mc-card mc-layers">
        <div className="mc-card-head mono">
          <button type="button" onClick={() => setShowLayers((v) => !v)} className="mc-toggle">
            <span>LAYERS</span>{showLayers ? '—' : '+'}
          </button>
        </div>
        {showLayers && (
          <ul className="mc-layers-list">
            {LAYER_TOGGLES.map((l) => (
              <li key={l.key}>
                <label title={l.plain}>
                  <input type="checkbox" checked={!!show?.[l.key]} onChange={() => toggleLayer(l.key)} />
                  <span className="mc-box" aria-hidden="true" />
                  <span className="mc-lbl">{l.label}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mc-coords mono">
        <span>{lat}° N · {lon}° E</span>
        <span className="mc-scale"><i />20 km</span>
      </div>

      {mapMode === 'oil_flow' && (
        <div className="mc-card mc-flow panel-enter">
          <div className="mc-card-head mono"><span>OIL FLOW FORECAST</span></div>
          <p className="mc-flow-nl">{FLOW_NL}</p>
          <div className="mc-flow-row">
            <button type="button" className="mc-play" onClick={onFlowPlay}>
              {flowPlaying ? '❙❙ PAUSE' : '▶ PLAY'}
            </button>
            {FORECAST_H.map((h) => (
              <button
                key={h}
                type="button"
                className={`mc-h ${flowHour === h ? 'active' : ''}`}
                onClick={() => setFlowHour?.(h)}
              >
                +{h}H
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mc-dock">
        <p className="mc-dock-desc">{mode.desc}</p>
        <div className="mc-toolbar" role="tablist" aria-label="Map view mode">
          {MAP_MODES.filter((m) => m.id !== 'evidence').map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={mapMode === m.id}
              className={mapMode === m.id ? 'active' : ''}
              onClick={() => setMapMode(m.id)}
              title={m.desc}
            >
              {m.short}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
