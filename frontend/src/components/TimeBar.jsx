import React, { useMemo } from 'react'

const SPEEDS = [
  { v: 60, label: '1×' },
  { v: 300, label: '5×' },
  { v: 600, label: '10×' },
  { v: 1800, label: '30×' },
]

const fmtDay = (epoch) =>
  new Date(epoch * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase()

export default function TimeBar({ simTime, tMin, tMax, playing, speed, onPlay, onSpeed, onSimTime }) {
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
  const d = new Date(simTime * 1000)
  const clockStr = `${String(d.getUTCDate()).padStart(2, '0')} ${d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()} ${d.toISOString().slice(11, 16)} UTC`

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
            aria-label="AIS replay timeline"
          />
        </div>
      </div>

      <div className="sn-tl-utils">
        <button type="button" title="Bookmark" aria-label="Bookmark">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>
        </button>
        <button type="button" title="Screenshot" aria-label="Screenshot">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>
        </button>
        <button type="button" title="Fullscreen" aria-label="Fullscreen">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3" /></svg>
        </button>
        <button type="button" title="Layout" aria-label="Layout">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="18" /><rect x="14" y="3" width="7" height="8" /><rect x="14" y="13" width="7" height="8" /></svg>
        </button>
      </div>
    </footer>
  )
}
