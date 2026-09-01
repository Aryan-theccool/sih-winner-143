import React from 'react'

const SPEEDS = [
  { v: 60, label: '1×' },
  { v: 600, label: '10×' },
  { v: 3600, label: '60×' },
]

const fmtDay = (epoch) => new Date(epoch * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase()
const fmtTime = (epoch) => new Date(epoch * 1000).toISOString().slice(11, 16)

export default function TimeBar({
  simTime, tMin, tMax, playing, speed, driftHour, driftMax,
  onPlay, onSpeed, onSimTime, onDriftHour, onSync, t0,
  backwardActive, setBackwardActive,
}) {
  const days = []
  const d0 = new Date(tMin * 1000)
  for (let i = 0; i < 3; i++) {
    const d = new Date(d0)
    d.setDate(d.getDate() + i)
    const ep = Math.floor(d.getTime() / 1000)
    if (ep <= tMax) days.push(ep)
  }

  const hours = []
  for (let h = 0; h <= 24; h += 4) {
    const ep = t0 - h * 3600
    if (ep >= tMin) hours.push({ h, ep })
  }

  return (
    <footer className="timeline-bar">
      <div className="tl-row tl-controls">
        <div className="tl-section-label">AIS REPLAY</div>
        <button className="tl-play" onClick={onPlay}>{playing ? '⏸' : '▶'}</button>
        {SPEEDS.map((s) => (
          <button key={s.v} className={`tl-speed ${speed === s.v ? 'on' : ''}`} onClick={() => onSpeed(s.v)}>
            {s.label}
          </button>
        ))}
        <button className="tl-sync" onClick={onSync}>⇄ SYNC</button>
        <span className="tl-clock mono">{new Date(simTime * 1000).toISOString().slice(0, 16).replace('T', ' ')}Z</span>
      </div>

      <div className="tl-row tl-days">
        {days.map((ep, i) => (
          <React.Fragment key={ep}>
            {i > 0 && <span className="tl-dash">─────</span>}
            <button className="tl-day" onClick={() => onSimTime(ep)}>{fmtDay(ep)}</button>
          </React.Fragment>
        ))}
        <div className="tl-slider-wrap">
          <input
            className="tl-slider ais"
            type="range" min={tMin} max={tMax} step={60} value={simTime}
            onChange={(e) => onSimTime(+e.target.value)}
          />
        </div>
      </div>

      <div className="tl-row tl-drift">
        <div className="tl-section-label drift">BACKWARD DRIFT</div>
        <button
          className={`tl-backward ${backwardActive ? 'on' : ''}`}
          onClick={() => setBackwardActive?.((b) => !b)}
        >
          ↶ RUN BACKWARD
        </button>
        <input
          className="tl-slider drift"
          type="range" min={0} max={driftMax} step={1} value={driftHour}
          onChange={(e) => onDriftHour(+e.target.value)}
        />
        <div className="tl-markers">
          {[{ h: 0, l: '06:30' }, { h: 6, l: 'T−6h' }, { h: 12, l: 'T−12h' }, { h: 24, l: 'T−24h' }].map((m) => (
            <button
              key={m.h}
              className={driftHour === m.h ? 'on' : ''}
              style={{ left: `${(m.h / driftMax) * 100}%` }}
              onClick={() => onDriftHour(m.h)}
            >
              {m.l}
            </button>
          ))}
        </div>
      </div>
    </footer>
  )
}
