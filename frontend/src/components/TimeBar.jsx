import React, { useMemo } from 'react'

const SPEEDS = [
  { v: 60, label: '1×' },
  { v: 300, label: '5×' },
  { v: 600, label: '10×' },
  { v: 1800, label: '30×' },
]

const fmtDay = (epoch) =>
  new Date(epoch * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase()

export default function TimeBar({ simTime, tMin, tMax, playing, speed, t0, releaseWindow, onPlay, onSpeed, onSimTime }) {
  const span = tMax - tMin || 1

  const days = useMemo(() => {
    const out = []
    const d0 = new Date(tMin * 1000)
    for (let i = 0; i < 3; i++) {
      const d = new Date(d0)
      d.setDate(d.getDate() + i)
      const ep = Math.floor(d.getTime() / 1000)
      if (ep <= tMax) out.push(ep)
    }
    return out
  }, [tMin, tMax])

  const pct = ((simTime - tMin) / span) * 100
  const d = new Date(simTime * 1000)
  const clockStr = `${String(d.getUTCDate()).padStart(2, '0')} ${d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()} ${d.toISOString().slice(11, 16)} UTC`

  const rwBand = useMemo(() => {
    if (!releaseWindow) return null
    const a = Date.parse(releaseWindow[0]) / 1000
    const b = Date.parse(releaseWindow[1]) / 1000
    const left = ((a - tMin) / span) * 100
    const width = ((b - a) / span) * 100
    if (!Number.isFinite(left) || !Number.isFinite(width)) return null
    return { left: Math.max(0, left), width: Math.min(100, Math.max(1.5, width)) }
  }, [releaseWindow, tMin, span])

  const t0Pct = t0 ? ((t0 - tMin) / span) * 100 : null

  return (
    <footer className="sn-timeline">
      <div className="sn-tl-left">
        <div className="sn-tl-caption mono">
          <span>TIME MACHINE</span>
          <b>AIS REPLAY · 48 H BEFORE DETECTION</b>
        </div>
        <div className="sn-tl-controls">
          <button
            type="button"
            className="sn-tl-play"
            onClick={onPlay}
            aria-label={playing ? 'Pause replay' : 'Play replay'}
            title="Play / pause the vessel replay (space)"
          >
            {playing ? '❙❙' : '▶'}
          </button>
          <div className="sn-tl-speeds" role="group" aria-label="Playback speed">
            {SPEEDS.map((s) => (
              <button
                key={s.v}
                type="button"
                className={`sn-tl-speed ${speed === s.v ? 'active' : ''}`}
                onClick={() => onSpeed(s.v)}
                title={`Replay at ${s.label} real time`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="sn-tl-track">
        <div className="sn-tl-days mono">
          {days.map((ep, i) => (
            <React.Fragment key={ep}>
              {i > 0 && <span className="sn-tl-sep" />}
              <span>{fmtDay(ep)}</span>
            </React.Fragment>
          ))}
          {rwBand && (
            <span className="sn-tl-rw mono" style={{ left: `${rwBand.left + rwBand.width / 2}%` }}>
              RELEASE WINDOW
            </span>
          )}
        </div>

        <div className="sn-tl-rail">
          <div className="sn-tl-band" style={{ left: `${rwBand?.left ?? 0}%`, width: `${rwBand?.width ?? 0}%` }} />
          {t0Pct != null && (
            <div className={`sn-tl-t0 ${t0Pct > 96 ? 'end' : ''}`} style={{ left: `${Math.min(100, t0Pct)}%` }} title="SAR detection (T0)">
              <span className="mono">T0</span>
            </div>
          )}
          <div className="sn-tl-playhead" style={{ left: `${pct}%` }}>
            <span className="mono">{clockStr}</span>
          </div>
          <input
            className="sn-tl-slider"
            type="range"
            min={tMin}
            max={tMax}
            step={60}
            value={simTime}
            onChange={(e) => onSimTime(+e.target.value)}
            aria-label="Replay time"
            title="Drag to move every ship and forecast layer to this moment"
          />
        </div>

        <p className="sn-tl-hint mono">DRAG — EVERY SHIP, ORIGIN CLOUD AND FORECAST FOLLOWS THIS CLOCK</p>
      </div>

      <div className="sn-tl-utils">
        <button type="button" onClick={() => onSimTime(t0)} title="Jump to the moment the satellite passed">
          AT DETECTION
        </button>
        <button type="button" onClick={() => onSimTime(tMin)} title="Rewind to the start of the AIS window">
          RESET
        </button>
      </div>
    </footer>
  )
}
