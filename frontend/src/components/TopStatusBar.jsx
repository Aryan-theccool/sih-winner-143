import React from 'react'
import { primaryObject } from '../utils/caseAnalytics'

export default function TopStatusBar({ caseInfo, ranking, manifest, detection, replayMode, setReplayMode }) {
  const obj = primaryObject(detection)
  const top = ranking?.ranking?.[0]

  const chips = [
    { label: 'CASE', value: caseInfo?.case_id?.replace('KERALA_', 'KER_') || '—', tone: 'neutral' },
    { label: 'DETECTION', value: obj ? 'PROBABLE' : '—', tone: 'amber' },
    { label: 'ORIGIN', value: 'HIGH CONFIDENCE', tone: 'purple' },
    { label: 'ATTRIBUTION', value: top ? 'CANDIDATE ID' : '—', tone: 'cyan' },
    { label: 'CORROBORATION', value: 'PARTIAL', tone: 'muted' },
    { label: 'ACTION', value: 'VERIFY', tone: 'green' },
  ]

  return (
    <header className="top-status">
      <div className="ts-brand">
        <span className="ts-title">ORIGIN<b>TRACE</b></span>
        <span className="ts-sub">SAGAR-NETRA</span>
      </div>

      <div className="ts-chips">
        {chips.map((c) => (
          <div key={c.label} className={`ts-chip tone-${c.tone}`}>
            <span className="ts-chip-lbl">{c.label}</span>
            <span className="ts-chip-val">{c.value}</span>
          </div>
        ))}
      </div>

      <div className="ts-right">
        <div className="ts-sync">
          <span className="dot ok" />
          <span>AIS FEED</span>
          <span className="mono">{replayMode ? 'REPLAY' : 'LIVE'}</span>
        </div>
        <div className="ts-sync">
          <span className="dot ok" />
          <span>MODEL</span>
          <span className="mono">v1.0</span>
        </div>
        <button
          className={`ts-replay ${replayMode ? 'on' : ''}`}
          onClick={() => setReplayMode((r) => !r)}
        >
          {replayMode ? '◉ REPLAY' : '○ LIVE'}
        </button>
        <div className="ts-time mono">
          {caseInfo?.t0_utc?.slice(0, 16).replace('T', ' ')}Z
        </div>
      </div>
    </header>
  )
}
