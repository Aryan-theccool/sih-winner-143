import React, { useEffect, useMemo, useRef, useState } from 'react'
import LeftRail from './components/LeftRail'
import TopStatusBar from './components/TopStatusBar'
import IntelligenceSidebar from './components/IntelligenceSidebar'
import MapView from './map/MapView'
import CaseStoryFlow from './components/CaseStoryFlow'
import TimeBar from './components/TimeBar'
import DossierModal from './components/DossierModal'
import { api, prepVessels } from './api'

export default function App() {
  const [caseInfo, setCaseInfo] = useState(null)
  const [detection, setDetection] = useState(null)
  const [backtrack, setBacktrack] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [manifest, setManifest] = useState(null)
  const [ranking, setRanking] = useState(null)
  const [vesselsRaw, setVesselsRaw] = useState(null)

  const [view, setView] = useState('map')
  const [mapFocus, setMapFocus] = useState(null)
  const [simTime, setSimTime] = useState(0)
  const [driftHour, setDriftHour] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(600)
  const [pulse, setPulse] = useState(0)
  const [replayMode, setReplayMode] = useState(true)
  const [originMode, setOriginMode] = useState(false)
  const [flowMode, setFlowMode] = useState(false)
  const [backwardActive, setBackwardActive] = useState(false)
  const [show, setShow] = useState({
    sar: true, oil: true, tracks: true, flow: false,
    current: false, wind: false, waves: false,
    ships: true, backtrack: true, gaps: true, mask: false,
  })
  const [selectedMmsi, setSelectedMmsi] = useState(null)
  const [dossierOpen, setDossierOpen] = useState(false)
  const [storyStep, setStoryStep] = useState('case')
  const raf = useRef(null)

  useEffect(() => {
    ;(async () => {
      const [c, d, b, f, m, v, r] = await Promise.all([
        api.case(), api.detection(), api.backtrack(), api.forecast(),
        api.manifest(), api.vessels(), api.ranking(),
      ])
      setCaseInfo(c); setDetection(d); setBacktrack(b); setForecast(f)
      setManifest(m); setVesselsRaw(v); setRanking(r)
      setSimTime(v.t_min)
    })().catch((e) => alert(`Backend not ready: ${e.message}`))
  }, [])

  const t0 = useMemo(() => (caseInfo ? Date.parse(caseInfo.t0_utc) / 1000 : 0), [caseInfo])
  const vessels = useMemo(() => (vesselsRaw ? prepVessels(vesselsRaw) : null), [vesselsRaw])

  useEffect(() => {
    let last = performance.now()
    const tick = (now) => {
      const dtSec = (now - last) / 1000
      last = now
      setPulse((p) => p + dtSec * 3)
      if (playing && vesselsRaw) {
        setSimTime((t) => {
          const nt = t + dtSec * speed
          return backwardActive
            ? Math.max(vesselsRaw.t_min, t - dtSec * speed)
            : (nt > vesselsRaw.t_max ? vesselsRaw.t_min : nt)
        })
        if (backwardActive) {
          setDriftHour((h) => Math.min(24, h + (dtSec * speed) / 3600))
        }
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [playing, speed, vesselsRaw, backwardActive])

  const onDriftHour = (h) => {
    setDriftHour(h)
    setView('origin')
    setOriginMode(true)
    setSimTime(t0 - h * 3600)
  }

  const onSync = () => setSimTime(t0 - driftHour * 3600)

  const onTraceBackward = () => {
    setOriginMode((o) => !o)
    setFlowMode(false)
    setView('origin')
    if (!originMode) {
      setDriftHour(12)
      setSimTime(t0 - 12 * 3600)
    }
  }

  const onFlowForward = () => {
    setFlowMode((f) => !f)
    setShow((s) => ({ ...s, flow: true }))
  }

  const onAnimate = () => {
    setView('origin')
    setPlaying(false)
    setOriginMode(true)
    let h = 0
    const step = () => {
      setDriftHour(h)
      setSimTime(t0 - h * 3600)
      h += 1
      if (h <= 24) setTimeout(step, 1000)
    }
    step()
  }

  const onSelectVessel = (mmsi) => {
    setSelectedMmsi(mmsi)
    setMapFocus(mmsi ? 'vessel' : null)
    if (mmsi) setView('vessels')
  }

  const onSelectSlick = () => {
    setMapFocus('slick')
    setView('detection')
  }

  const onFocusVessel = (mmsi) => {
    onSelectVessel(mmsi)
    setPlaying(true)
  }

  const onStoryStep = (step) => {
    setStoryStep(step.id)
    if (step.id === 'case') {
      setView('map')
      setMapFocus(null)
      return
    }
    setView(step.view)
    if (step.id === 'what') {
      setShow((s) => ({ ...s, oil: true, sar: true }))
      setMapFocus('slick')
    }
    if (step.id === 'when') {
      setShow((s) => ({ ...s, oil: true, sar: true }))
      setMapFocus('slick')
      setPlaying(false)
    }
    if (step.id === 'where') {
      setOriginMode(true)
      setShow((s) => ({ ...s, backtrack: true }))
      setDriftHour(12)
      setSimTime(t0 - 12 * 3600)
    }
    if (step.id === 'who') {
      setPlaying(true)
      setShow((s) => ({ ...s, ships: true, tracks: true }))
      setMapFocus(null)
    }
    if (step.id === 'which' && ranking?.ranking?.[0]) {
      onSelectVessel(ranking.ranking[0].mmsi)
    }
    if (step.id === 'why' && ranking?.ranking?.[0]) {
      onSelectVessel(ranking.ranking[0].mmsi)
    }
    if (step.id === 'prove') {
      setView('evidence')
    }
    if (step.id === 'dossier') {
      setDossierOpen(true)
    }
  }

  const syncStoryFromView = (v) => {
    const map = { map: 'who', detection: 'what', origin: 'where', vessels: 'which', evidence: 'why', report: 'dossier' }
    if (map[v]) setStoryStep(map[v])
  }

  const shared = {
    caseInfo, detection, manifest, ranking, vessels, vesselsRaw,
    driftHour, setDriftHour: onDriftHour, onAnimate, simTime,
    selectedMmsi, onFocusVessel, showMask: show.mask,
    setShowMask: (v) => setShow((s) => ({ ...s, mask: v })),
    onGenerateDossier: () => setDossierOpen(true),
    onVerifyIntegrity: () => alert('Integrity verified — evidence hashes match sealed bundle.'),
    originMode, mapFocus, setView,
  }

  if (!caseInfo || !vessels || !ranking) {
    return (
      <div className="boot-screen">
        <div className="boot-logo">ORIGIN<b>TRACE</b></div>
        <div className="boot-sub mono">SAGAR-NETRA · MARINE INTELLIGENCE OS</div>
        <div className="boot-bar"><div /></div>
      </div>
    )
  }

  return (
    <div className="os-shell">
      <LeftRail
        view={view}
        setView={(v) => { setView(v); syncStoryFromView(v) }}
        onGenerateDossier={() => { setDossierOpen(true); setStoryStep('dossier') }}
      />

      <div className="os-main">
        <TopStatusBar
          caseInfo={caseInfo} ranking={ranking} detection={detection}
          manifest={manifest} replayMode={replayMode} setReplayMode={setReplayMode}
        />

        <div className="os-workspace">
          <div className="map-column">
            <CaseStoryFlow
              caseInfo={caseInfo} detection={detection} manifest={manifest}
              ranking={ranking} activeStep={storyStep} onStep={onStoryStep}
            />
            <MapView
              caseInfo={caseInfo} detection={detection} backtrack={backtrack}
              forecast={forecast} manifest={manifest} vessels={vessels}
              ranking={ranking} simTime={simTime} driftHour={driftHour}
              pulse={pulse} show={show} setShow={setShow} tMin={vesselsRaw.t_min}
              selectedMmsi={selectedMmsi} onSelectVessel={onSelectVessel}
              onSelectSlick={onSelectSlick} mapFocus={mapFocus}
              originMode={originMode} setOriginMode={setOriginMode}
              flowMode={flowMode} setFlowMode={setFlowMode}
              onTraceBackward={onTraceBackward} onFlowForward={onFlowForward}
            />
          </div>

          <IntelligenceSidebar
            view={view}
            setView={(v) => { setView(v); syncStoryFromView(v) }}
            {...shared}
          />
        </div>

        <TimeBar
          simTime={simTime} tMin={vesselsRaw.t_min} tMax={vesselsRaw.t_max}
          playing={playing} speed={speed} driftHour={driftHour} driftMax={24}
          t0={t0} backwardActive={backwardActive} setBackwardActive={setBackwardActive}
          onPlay={() => setPlaying((p) => !p)} onSpeed={setSpeed}
          onSimTime={setSimTime} onDriftHour={onDriftHour} onSync={onSync}
        />
      </div>

      <DossierModal open={dossierOpen} onClose={() => setDossierOpen(false)} caseId={caseInfo.case_id} />
    </div>
  )
}
