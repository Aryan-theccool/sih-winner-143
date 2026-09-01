import React from 'react'
import { slickCharacterisation } from '../utils/caseAnalytics'

const STEPS = [
  { id: 'location', label: 'LOCATION', title: 'Spill coordinates' },
  { id: 'area', label: 'AREA', title: 'Affected region' },
  { id: 'detection', label: 'DETECTION', title: 'SAR detection layer' },
  { id: 'identify', label: 'IDENTIFY', title: 'Slick characterisation' },
  { id: 'report', label: 'REPORT', title: 'Case dossier' },
]

export default function SlickInvestigationOverlay({
  step, slickProps, detection, manifest, caseInfo,
  onStep, onClose, onReport,
}) {
  const char = slickCharacterisation(detection, manifest)
  const centroid = slickProps?.centroid || char?.centroid
  const lon = centroid?.[0] ?? caseInfo?.aoi?.lon_min
  const lat = centroid?.[1] ?? caseInfo?.aoi?.lat_min

  const stepIdx = STEPS.findIndex((s) => s.id === step)
  const current = STEPS[stepIdx] || STEPS[0]

  return (
    <div className="slick-flow" role="dialog" aria-label="Oil slick investigation">
      <div className="slick-flow-head">
        <span className="slick-flow-badge">POSSIBLE OIL SLICK</span>
        <button type="button" className="slick-flow-close" onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className="slick-flow-steps">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`sf-step ${i <= stepIdx ? 'done' : ''} ${s.id === step ? 'active' : ''}`}
            onClick={() => onStep(s.id)}
          >
            {i + 1}. {s.label}
          </button>
        ))}
      </div>

      <div className="slick-flow-body">
        <h3>{current.title}</h3>

        {step === 'location' && (
          <>
            <dl className="sf-data mono">
              <div><dt>Latitude</dt><dd>{lat?.toFixed(4)}°N</dd></div>
              <div><dt>Longitude</dt><dd>{lon?.toFixed(4)}°E</dd></div>
              <div><dt>Object ID</dt><dd>{slickProps?.object_id || 'SAR-OBJ-01'}</dd></div>
            </dl>
            <p className="sf-hint">Satellite-detected dark feature in Arabian Sea · Kerala sector</p>
          </>
        )}

        {step === 'area' && (
          <>
            <div className="sf-hero">{slickProps?.area_km2 || char?.area} km²</div>
            <p className="sf-label">Detected slick area</p>
            <dl className="sf-data">
              <div><dt>SAR darkening</dt><dd>{slickProps?.contrast_db ?? char?.darkening} dB</dd></div>
              <div><dt>Surface wind</dt><dd>{slickProps?.wind_ms ?? char?.wind} m/s</dd></div>
            </dl>
          </>
        )}

        {step === 'detection' && (
          <>
            <p className="sf-status status-icon-ok">✓ SAR detection layer active</p>
            <p className="sf-hint">Sentinel-1 scene overlay enabled on map. Review backscatter signature against open ocean.</p>
            <div className="sf-metric">{char?.probability ?? Math.round((slickProps?.confidence || 0.77) * 100)}%</div>
            <p className="sf-label">Oil-slick probability</p>
          </>
        )}

        {step === 'identify' && (
          <>
            <div className="sf-metric">{char?.probability ?? 77}%</div>
            <p className="sf-label">Oil-slick probability · {char?.oilClass || 'Heavy oil / bunker-like'}</p>
            <p className="sf-hint">Estimated age {char?.ageRange}. Satellite-derived inference — requires corroboration.</p>
            <span className="tag tag-inference">SATELLITE-DERIVED INFERENCE</span>
          </>
        )}

        {step === 'report' && (
          <>
            <p className="sf-hint">Evidence chain ready for export. Regulatory mapping and vessel attribution available in sidebar.</p>
            <button type="button" className="btn-primary" onClick={onReport}>
              GENERATE CASE DOSSIER
            </button>
            <button type="button" className="btn-secondary" onClick={() => onStep('location')}>
              Review from start
            </button>
          </>
        )}
      </div>

      {step !== 'report' && (
        <button type="button" className="btn-primary sf-next" onClick={() => onStep(STEPS[stepIdx + 1]?.id || 'report')}>
          Continue → {STEPS[stepIdx + 1]?.label || 'REPORT'}
        </button>
      )}
    </div>
  )
}
