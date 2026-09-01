import React, { useEffect, useMemo, useRef, useState } from 'react'
import MapView from './map/MapView'
import SidePanel from './components/SidePanel'
import TimeBar from './components/TimeBar'
import { api, prepVessels } from './api'

const SPEEDS = { 60: '1×', 600: '10×', 3600: '60×' }

export default function App() {
  const [caseInfo, setCaseInfo] = useState(null)
  const [detection, setDetection] = useState(null)
  const [backtrack, setBacktrack] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [manifest, setManifest] = useState(null)
  const [ranking, setRanking] = useState(null)
  const [vesselsRaw, setVesselsRaw] = useState(null)

  const [tab, setTab] = useState('detection')
  const [simTime, setSimTime] = useState(0)
  const [driftHour, setDriftHour] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(600)
  const [pulse, setPulse] = useState(0)
  const [show, setShow] = useState({ sar: true, mask: false, backtrack: true, forecast: false, ships: true })
  const [selectedMmsi, setSelectedMmsi] = useState(null)
  const raf = useRef(null)

  // ---------------- data load ----------------
  useEffect(() => {
    ;(async () => {
      const [c, d, b, f, m, v, r] = await Promise.all([
        api.case(), api.detection(), api.backtrack(), api.forecast(),
        api.manifest(), api.vessels(), api.ranking(),
      ])
      setCaseInfo(c); setDetection(d); setBacktrack(b); setForecast(f)
      setManifest(m); setVesselsRaw(v); setRanking(r)
      setSimTime(v.t_min)
    })().catch((e) => alert(`backend not ready: ${e.message}\nstart with: uvicorn backend.main:app --port 8000`))
  }, [])

  const t0 = useMemo(() => (caseInfo ? Date.parse(caseInfo.t0_utc) / 1000 : 0), [caseInfo])
  const vessels = useMemo(() => (vesselsRaw ? prepVessels(vesselsRaw) : null), [vesselsRaw])

  // ---------------- clocks ----------------
  useEffect(() => {
    let last = performance.now()
    const tick = (now) => {
      const dtSec = (now - last) / 1000
      last = now
      setPulse((p) => p + dtSec * 3)
      if (playing && vesselsRaw) {
        setSimTime((t) => {
          const nt = t + dtSec * speed
          return nt > vesselsRaw.t_max ? vesselsRaw.t_min : nt
        })
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [playing, speed, vesselsRaw])

  // ---------------- interactions ----------------
  const onDriftHour = (h) => { setDriftHour(h); setTab('origin') }
  const onSync = () => setSimTime(t0 - driftHour * 3600)
  const onAnimate = () => {
    setTab('origin')
    let h = 0
    const step = () => {
      setDriftHour(h)
      setSimTime(t0 - h * 3600)
      h += 1
      if (h <= 24) setTimeout(step, 700)
    }
    step()
  }
  const onFocusVessel = (mmsi) => {
    setSelectedMmsi(mmsi)
    setTab('suspects')
    setPlaying(true)
  }

  if (!caseInfo || !vessels || !ranking) return <div className="loading">ORIGINTRACE // LOADING CASEFILE…</div>

  return (
    <div className="app">
      <div className="topbar">
        <div className="logo">ORIGIN<b>TRACE</b> ∷ OIL-SPILL ATTRIBUTION</div>
        <div className="case-tag">CASE KERALA_2025_CASE01 · SENTINEL-1 SAR</div>
        <div className="badge-legal">UNCLOS 220(3) · TIP-AND-CUE</div>
        <div className="clock">
          <small>DETECTION</small>{caseInfo.t0_utc.slice(0, 16).replace('T', ' ')}Z
        </div>
      </div>

      <div className="workspace">
        <MapView
          caseInfo={caseInfo} detection={detection} backtrack={backtrack}
          forecast={forecast} manifest={manifest} vessels={vessels}
          ranking={ranking} simTime={simTime} driftHour={driftHour}
          pulse={pulse} show={show} tMin={vesselsRaw.t_min}
          selectedMmsi={selectedMmsi} onSelectVessel={setSelectedMmsi}
        />
        <SidePanel
          tab={tab} setTab={setTab} detection={detection} manifest={manifest}
          ranking={ranking} driftHour={driftHour} setDriftHour={onDriftHour}
          onAnimate={onAnimate} caseInfo={caseInfo}
          showMask={show.mask}
          setShowMask={(v) => setShow((s) => ({ ...s, mask: v }))}
          onFocusVessel={onFocusVessel} selectedMmsi={selectedMmsi}
        />
      </div>

      <TimeBar
        simTime={simTime} tMin={vesselsRaw.t_min} tMax={vesselsRaw.t_max}
        playing={playing} speed={speed} driftHour={driftHour} driftMax={24}
        onPlay={() => setPlaying((p) => !p)} onSpeed={setSpeed}
        onSimTime={setSimTime} onDriftHour={onDriftHour} onSync={onSync}
      />
    </div>
  )
}
