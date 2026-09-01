import React from 'react'

const fmt = (epoch) => {
  const d = new Date(epoch * 1000)
  return d.toISOString().slice(0, 16).replace('T', ' ') + 'Z'
}

export default function TimeBar({
  simTime, tMin, tMax, playing, speed, driftHour, driftMax,
  onPlay, onSpeed, onSimTime, onDriftHour, onSync,
}) {
  return (
    <div className="timebar">
      <div className="tgroup">
        <button className="playbtn" onClick={onPlay}>{playing ? '⏸' : '▶'}</button>
        {[60, 600, 3600].map((s, i) => (
          <button key={s} className={`speedbtn ${speed === s ? 'active' : ''}`}
            onClick={() => onSpeed(s)}>{['1×', '10×', '60×'][i]}</button>
        ))}
      </div>
      <div className="tgroup" style={{ flex: 1 }}>
        <span className="tlabel">AIS REPLAY</span>
        <input type="range" min={tMin} max={tMax} step={60} value={simTime}
          onChange={(e) => onSimTime(parseInt(e.target.value, 10))} />
      </div>
      <div className="tgroup">
        <span className="tclock">{fmt(simTime)}</span>
      </div>
      <div className="tgroup" style={{ gridColumn: '1 / span 2' }}>
        <span className="tlabel">BACKWARD DRIFT</span>
        <input className="drift" type="range" min={0} max={driftMax} step={1}
          value={driftHour} onChange={(e) => onDriftHour(parseInt(e.target.value, 10))} />
      </div>
      <div className="tgroup">
        <span className="drift-read">T−{driftHour} h</span>
        <button className="minibtn syncbtn" onClick={onSync}>sync ships ⇄ cloud</button>
      </div>
    </div>
  )
}
