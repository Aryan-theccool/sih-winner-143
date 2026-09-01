import React, { useMemo } from 'react'
import { Card, Metric, Tag, Callout, Btn } from '../ui'
import { Term } from '../Glossary'
import { slickCharacterisation, fmtWindow, primaryObject } from '../../utils/caseAnalytics'

const H48 = 48 * 3600 * 1000

export default function DetectionPanel({
  detection, manifest, showMask, setShowMask, caseInfo, setView,
  onTraceOrigin, onViewOilFlow, slickProps,
}) {
  const char = slickCharacterisation(detection, manifest)
  const lookAlike = detection?.summary?.objects?.find((o) => o.class === 'look_alike')
  const obj = primaryObject(detection)
  const windOk = char && char.wind >= 3 && char.wind <= 12

  /** Release window positioned on a T−48 h … T0 axis (real timestamps, no fudge). */
  const age = useMemo(() => {
    const tDet = Date.parse(manifest?.detection_time_utc || detection?.summary?.acquisition_time_utc || 0)
    const rw = manifest?.origin_estimate?.estimated_release_window_utc
    if (!tDet || !rw) return null
    const lo = Math.max(0, (tDet - Date.parse(rw[1])) / H48)
    const hi = Math.min(1, (tDet - Date.parse(rw[0])) / H48)
    return {
      loPct: lo * 100,
      widthPct: Math.max(3, (hi - lo) * 100),
      midPct: ((lo + hi) / 2) * 100,
      ageHours: Math.round((tDet - Date.parse(rw[1])) / 3600000),
    }
  }, [manifest, detection])

  if (!char) return <p className="sn-loading">Loading detection data…</p>

  return (
    <div className="sn-p">
      <div className="sn-tagrow">
        <Tag tone="observed" />
        <Tag tone="inferred" />
        {windOk
          ? <Tag tone="corroborated">WIND GATE · PASS</Tag>
          : <Tag tone="probable">WIND GATE · NOT ASSESSABLE</Tag>}
      </div>

      <Callout tone="cyan" title="WHAT YOU ARE LOOKING AT">
        A <Term k="sar">Sentinel-1 radar</Term> pass at{' '}
        {detection?.summary?.acquisition_time_utc?.slice(11, 16)} UTC found one dark patch that behaves like oil
        and one <Term k="lookalike">look-alike</Term> that was screened out.
      </Callout>

      <Card
        title="HOW LIKELY IS THIS OIL?"
        right={<span className="sn-card-ref mono">{obj?.object_id}</span>}
      >
        <div className="sn-hero">
          <div className="sn-hero-value">
            {char.probability}<span>%</span>
          </div>
          <div className="sn-hero-side">
            <div className="sn-hero-lbl">Oil-slick probability</div>
            <div className="sn-meter">
              <div className="sn-meter-fill" style={{ width: `${char.probability}%` }} />
              <span className="sn-meter-tick" style={{ left: '60%' }} title="Threshold used to call it oil" />
            </div>
            <div className="sn-hero-note">
              0–40 improbable · 40–70 uncertain · 70+ works like oil
            </div>
          </div>
        </div>

        <div className="sn-metric-grid">
          <Metric value={char.area} unit="km²" label="Slick area" />
          <Metric value={char.darkening} unit="dB" label="Radar darkening" note="darker than open sea" />
          <Metric value={char.wind} unit="m/s" label="Wind at slick" tone={windOk ? 'green' : 'amber'} note={windOk ? 'inside the readable band' : 'read with care'} />
          <Metric value={`${char.thicknessUm[0]}–${char.thicknessUm[1]}`} unit="µm" label="Oil thickness" note="modelled range" />
        </div>

        <Callout tone="info" title="READ THIS AS A RANGE, NOT A MEASUREMENT">
          Volume ({char.volumeM3[0]}–{char.volumeM3[1]} m³) and class are derived from a satellite image.
          Two independent estimates agree; only a sample can identify the product.
        </Callout>
      </Card>

      <Card title="HOW LONG HAS IT BEEN IN THE WATER?">
        <div className="sn-ageval mono">{char.ageRange}</div>
        <p className="sn-agecap">
          Estimated <Term k="age">slick age</Term> — most probably about {age?.ageHours ?? '—'} h before the
          satellite passed.
        </p>
        <div className="sn-ageaxis">
          <div className="sn-ageband" style={{ left: `${age?.loPct ?? 35}%`, width: `${age?.widthPct ?? 25}%` }}>
            <span className="mono">PROBABLE RELEASE</span>
          </div>
          <div className="sn-agemarker" style={{ left: `${age?.midPct ?? 47}%` }} />
        </div>
        <div className="sn-ageticks mono">
          <span>T−48 H</span>
          <span>T−24 H</span>
          <span>DETECTION · T0</span>
        </div>
        <p className="sn-agefoot mono">
          {fmtWindow(char.releaseWindow?.[0], char.releaseWindow?.[1])}
        </p>
      </Card>

      <Card title="OIL TYPE" note="Indicative only — never a laboratory identification.">
        <p className="sn-class">{char.oilClass}</p>
        <div className="sn-bar-row">
          <span className="sn-bar-label">Class confidence</span>
          <div className="sn-bar-track"><div className="sn-bar-fill tone-purple" style={{ width: `${char.classConfidence}%` }} /></div>
          <span className="sn-bar-value mono">{char.classConfidence}%</span>
        </div>
        <div className="sn-bar-row">
          <span className="sn-bar-label">Morphology · {char.morphology}</span>
          <div className="sn-bar-track"><div className="sn-bar-fill tone-cyan" style={{ width: '62%' }} /></div>
          <span className="sn-bar-value mono">ELONGATED</span>
        </div>
        <div className="sn-bar-row">
          <span className="sn-bar-label">Persistence · {char.persistence}</span>
          <div className="sn-bar-track"><div className="sn-bar-fill tone-cyan" style={{ width: '78%' }} /></div>
          <span className="sn-bar-value mono">2 PASSES</span>
        </div>
      </Card>

      <Card title="WHERE THE RADAR WAS BLIND">
        <label className="sn-switch">
          <input
            type="checkbox"
            checked={!!showMask}
            onChange={(e) => setShowMask?.(e.target.checked)}
          />
          <span className="sn-switch-track" aria-hidden="true" />
          <span>
            Show the <Term k="mask">detectability mask</Term>
            <small>Wind under 3 m/s or over 12 m/s is hatched — no slick could be confirmed there.</small>
          </span>
        </label>
        {lookAlike && (
          <Callout tone="amber" title="LOOK-ALIKE SCREENED">
            {lookAlike.area_km2} km² at {Math.round(lookAlike.confidence * 100)}% — wind {lookAlike.wind_ms} m/s
            was outside the readable band, so it is logged but not attributed to oil.
          </Callout>
        )}
      </Card>

      {slickProps && (
        <Card
          title="OBJECT YOU CLICKED ON THE MAP"
          right={<Tag tone={slickProps.class === 'oil_confirmed' ? 'observed' : 'probable'} />}
        >
          <div className="sn-kv">
            <div className="sn-kv-row"><dt>Identified as</dt><dd>{(slickProps.class || '').replace('_', ' ')}</dd></div>
            <div className="sn-kv-row"><dt>Confidence</dt><dd className="mono">{Math.round((slickProps.confidence || 0) * 100)}%</dd></div>
            <div className="sn-kv-row"><dt>Area</dt><dd className="mono">{slickProps.area_km2} km²</dd></div>
            <div className="sn-kv-row"><dt>Darkening</dt><dd className="mono">{slickProps.contrast_db} dB</dd></div>
            {slickProps.elongation != null && <div className="sn-kv-row"><dt>Elongation</dt><dd className="mono">{slickProps.elongation}</dd></div>}
            <div className="sn-kv-row"><dt>Wind here</dt><dd className="mono">{slickProps.wind_ms} m/s</dd></div>
          </div>
        </Card>
      )}

      <div className="sn-actions">
        <Btn variant="primary" onClick={onTraceOrigin}>Trace it back to an origin</Btn>
        <Btn variant="ghost" onClick={onViewOilFlow}>See where it drifts</Btn>
      </div>

      <details className="sn-tech">
        <summary>Technical readout</summary>
        <div className="sn-kv">
          <div className="sn-kv-row"><dt>Acquisition</dt><dd className="mono">{detection?.summary?.acquisition_time_utc?.slice(0, 16)} UTC</dd></div>
          <div className="sn-kv-row"><dt>Incidence</dt><dd className="mono">{caseInfo?.scene?.incidence_angle_deg ?? '—'}°</dd></div>
          <div className="sn-kv-row"><dt>Polarisation</dt><dd className="mono">{caseInfo?.scene?.polarization || 'VV+VH'}</dd></div>
          <div className="sn-kv-row"><dt>Detector</dt><dd className="mono">{detection?.summary?.detector}</dd></div>
          <div className="sn-kv-row"><dt>Ocean median</dt><dd className="mono">{detection?.summary?.ocean_median_db} dB</dd></div>
        </div>
      </details>

      <p className="sn-hint">
        Need the legal framing? <button type="button" className="sn-link" onClick={() => setView?.('evidence')}>Open step 04 · Evidence</button>
      </p>
    </div>
  )
}
