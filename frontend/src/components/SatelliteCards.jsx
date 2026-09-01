import React from 'react'
import { fmtUtc } from '../utils/caseAnalytics'

export default function SatelliteCards({ detection, caseInfo }) {
  const summary = detection?.summary
  if (!summary) return null

  const cards = [
    {
      id: 'sar-primary',
      label: 'SAR SCENE',
      sat: 'Sentinel-1 IW',
      time: fmtUtc(summary.acquisition_time_utc),
      scene: summary.scene_id?.slice(0, 22) + '…',
      thumb: '/api/scene.png',
    },
    {
      id: 'sar-detect',
      label: 'DETECTION',
      sat: 'SAR-OBJ-01',
      time: fmtUtc(caseInfo?.t0_utc),
      scene: `${summary.objects?.[0]?.area_km2 || '—'} km² · ${Math.round((summary.objects?.[0]?.confidence || 0) * 100)}%`,
      thumb: '/api/evidence/frames/frame1_detection',
    },
  ]

  return (
    <div className="sat-cards">
      <div className="sat-cards-title">VISUAL INTELLIGENCE</div>
      {cards.map((c) => (
        <div key={c.id} className="sat-card">
          <div className="sat-thumb" style={{ backgroundImage: `url(${c.thumb})` }} />
          <div className="sat-meta">
            <span className="sat-label">{c.label}</span>
            <span className="sat-sat mono">{c.sat}</span>
            <span className="sat-time mono">{c.time}</span>
            <span className="sat-scene mono">{c.scene}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
