import React, { useMemo } from 'react'

const SPEEDS = [
  { v: 60, label: '1×' },
  { v: 300, label: '5×' },
  { v: 600, label: '10×' },
  { v: 1800, label: '30×' },
]

const fmtDay = (epoch) =>
  new Date(epoch * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase()

export default function TimeBar({ simTime, tMin, tMax, playing, speed, onPlay, onSpeed, onSimTime, t0, releaseWindow }) {
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

  const pct = ((simTime - tMin) / (tMax - tMin)) * 100
  const clockStr = new Date(simTime * 1000).toISOString().slice(0, 16).replace('T', ' ')

  return (
    <footer className="sn-timeline">
      <div className="sn-tl-left">
        <button type="button" className="sn-tl-play" onClick={onPlay} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? '⏸' : '▶'}
        </button>
        {SPEEDS.map((s) => (
          <button key={s.v} type="button" className={`sn-tl-speed ${speed === s.v ? 'active' : ''}`} onClick={() => onSpeed(s.v)}>
            {s.label}
          </button>
        ))}
        <span className="sn-tl-mode"><span className="sn-dot live" /> AIS REPLAY</span>
      </div>

      <div className="sn-tl-track">
        <div className="sn-tl-days">
          {days.map((ep, i) => (
            <React.Fragment key={ep}>
              {i > 0 && <span className="sn-tl-sep">─────</span>}
              <span className="mono">{fmtDay(ep)}</span>
            </React.Fragment>
          ))}
        </div>
        <div className="sn-tl-rail">
          <div className="sn-tl-playhead" style={{ left: `${pct}%` }}>
            <span className="mono">{clockStr} UTC</span>
          </div>
          <input
            className="sn-tl-slider"
            type="range"
            min={tMin}
            max={tMax}
            step={60}
            value={simTime}
            onChange={(e) => onSimTime(+e.target.value)}
            aria-label="AIS replay timeline"
          />
        </div>
      </div>

      <div className="sn-tl-utils">
        <button type="button" title="Bookmark">🔖</button>
        <button type="button" title="Screenshot">📷</button>
        <button type="button" title="Expand">⛶</button>
      </div>
    </footer>
  )
}
