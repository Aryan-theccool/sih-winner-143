import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import LeftRail from './components/LeftRail'
import SagarNetHeader from './components/SagarNetHeader'
import IntelligenceSidebar from './components/IntelligenceSidebar'
import MapView from './map/MapView'
import TimeBar from './components/TimeBar'
import DossierModal from './components/DossierModal'
import ReadingGuide from './components/ReadingGuide'
import { GlossaryProvider } from './components/Glossary'
import { api, prepVessels } from './api'
import { layersForMode, modesForMode } from './utils/mapModes'
import { STEPS } from './utils/stepGuide'

const VIEW_MODE = {
  map: 'investigation',
  detection: 'investigation',
  origin: 'origin',
  vessels: 'vessel_replay',
  evidence: 'evidence',
  report: 'investigation',
}

export default function Dashboard() {
  const [caseInfo, setCaseInfo] = useState(null)
  const [detection, setDetection] = useState(null)
  const [backtrack, setBacktrack] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [manifest, setManifest] = useState(null)
  const [ranking, setRanking] = useState(null)
  const [vesselsRaw, setVesselsRaw] = useState(null)
  const [loadError, setLoadError] = useState(null)

  const [view, setView] = useState('map')
  const [mapMode, setMapMode] = useState('investigation')
  const [reducedMotion, setReducedMotion] = useState(false)
  const [mapFocus, setMapFocus] = useState(null)
  const [simTime, setSimTime] = useState(0)
  const [driftHour, setDriftHour] = useState(12)
  const [flowHour, setFlowHour] = useState(24)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(600)
  const [pulse, setPulse] = useState(0)
  const [flowPlaying, setFlowPlaying] = useState(false)
  const [show, setShow] = useState(layersForMode('investigation'))
  const [originMode, setOriginMode] = useState(false)
  const [flowMode, setFlowMode] = useState(false)
  const [selectedMmsi, setSelectedMmsi] = useState(null)
  const [dossierOpen, setDossierOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [showExplain, setShowExplain] = useState(false)
  const [slickProps, setSlickProps] = useState(null)
  const [originPlaying, setOriginPlaying] = useState(false)
  const raf = useRef(null)
  const originTimer = useRef(null)
  const toastTimer = useRef(null)

  useEffect(() => {
    document.body.classList.add('dashboard-active')
    return () => document.body.classList.remove('dashboard-active')
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const h = (e) => setReducedMotion(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])

  const load = useCallback(() => {
    setLoadError(null)
    ;(async () => {
      try {
        const [c, d, b, f, m, v, r] = await Promise.all([
          api.case(), api.detection(), api.backtrack(), api.forecast(),
          api.manifest(), api.vessels(), api.ranking(),
        ])
        setCaseInfo(c); setDetection(d); setBacktrack(b); setForecast(f)
        setManifest(m); setVesselsRaw(v); setRanking(r)
        setSimTime(v.t_min)
      } catch (e) {
        setLoadError(e.message)
      }
    })()
  }, [])

  useEffect(() => { load() }, [load])

  const notify = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 4200)
  }, [])

  const t0 = useMemo(() => (caseInfo ? Date.parse(caseInfo.t0_utc) / 1000 : 0), [caseInfo])
  const vessels = useMemo(() => (vesselsRaw ? prepVessels(vesselsRaw) : null), [vesselsRaw])

  const applyMapMode = useCallback((modeId) => {
    setShow(layersForMode(modeId))
    const modes = modesForMode(modeId)
    setOriginMode(modes.originMode)
    setFlowMode(modes.flowMode)
    if (modeId === 'oil_flow') setFlowPlaying(!reducedMotion)
    else setFlowPlaying(false)
    if (modeId === 'vessel_replay') setPlaying(!reducedMotion)
    if (modeId === 'origin') {
      setOriginMode(true)
      setDriftHour(12)
    }
  }, [reducedMotion])

  useEffect(() => { applyMapMode(mapMode) }, [mapMode, applyMapMode])

  useEffect(() => {
    if (reducedMotion || !originPlaying || mapMode !== 'origin') {
      if (originTimer.current) clearInterval(originTimer.current)
      return undefined
    }
    originTimer.current = setInterval(() => {
      setDriftHour((h) => (h <= 0 ? 24 : h - 1))
    }, 1000)
    return () => clearInterval(originTimer.current)
  }, [originPlaying, reducedMotion, mapMode])

  useEffect(() => {
    if (mapMode !== 'origin') setOriginPlaying(false)
  }, [mapMode])

  useEffect(() => {
    if (reducedMotion) {
      setPlaying(false)
      setFlowPlaying(false)
      setOriginPlaying(false)
    }
  }, [reducedMotion])

  useEffect(() => {
    let last = performance.now()
    const tick = (now) => {
      const dtSec = (now - last) / 1000
      last = now
      if (!reducedMotion) setPulse((p) => p + dtSec * 2)
      if (playing && vesselsRaw && !reducedMotion) {
        setSimTime((t) => {
          const nt = t + dtSec * speed
          return nt > vesselsRaw.t_max ? vesselsRaw.t_min : nt
        })
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [playing, speed, vesselsRaw, reducedMotion])

  const navigate = (v) => {
    setView(v)
    if (VIEW_MODE[v]) setMapMode(VIEW_MODE[v])
  }

  const onDriftHour = (h) => {
    setDriftHour(h)
    setView('origin')
    setMapMode('origin')
    setSimTime(t0 - h * 3600)
  }

  const onSelectVessel = (mmsi) => {
    setSelectedMmsi(mmsi)
    setMapFocus(mmsi ? 'vessel' : null)
    setShowExplain(false)
    if (mmsi) { setView('vessels'); setMapMode('vessel_replay') }
  }

  const onSelectSlick = (props) => {
    if (!props) { setMapFocus(null); setSlickProps(null); return }
    setSlickProps(props)
    setMapFocus('slick')
    setView('detection')
    setMapMode('investigation')
    setShow((s) => ({ ...s, oil: true, sar: true }))
  }

  const onTraceOrigin = () => { setView('origin'); setMapMode('origin'); setDriftHour(12) }
  const onViewOilFlow = () => { setMapMode('oil_flow'); setFlowPlaying(true) }

  const shared = {
    caseInfo, detection, manifest, ranking, vessels, vesselsRaw,
    driftHour, setDriftHour: (h) => {
      setDriftHour(h)
      if (mapMode === 'origin') setSimTime(t0 - h * 3600)
    }, onDriftHour,
    originPlaying, setOriginPlaying,
    onAnimate: onTraceOrigin, simTime,
    selectedMmsi, onFocusVessel: (m) => { onSelectVessel(m); setPlaying(true) },
    onClearVessel: () => onSelectVessel(null),
    showMask: show.mask, setShowMask: (v) => setShow((s) => ({ ...s, mask: v })),
    onGenerateDossier: () => setDossierOpen(true),
    onVerifyIntegrity: () => notify('Integrity verified — every hash matches the sealed case file.'),
    originMode, mapFocus, setView: navigate, showExplain, setShowExplain,
    onTraceOrigin, onViewOilFlow, slickProps, show, setShow,
    mapMode, setMapMode,
  }

  /* Keyboard: the dashboard should be explorable without hunting for buttons. */
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key
      if (k === '?' || (k === '/' && e.shiftKey)) { e.preventDefault(); setGuideOpen((o) => !o); return }
      if (k === 'Escape') { setGuideOpen(false); setDossierOpen(false); return }
      if (k === ' ') { e.preventDefault(); setPlaying((p) => !p); return }
      if (k === 'ArrowRight') { e.preventDefault(); setSimTime((t) => Math.min(vesselsRaw?.t_max ?? t, t + 3600)); return }
      if (k === 'ArrowLeft') { e.preventDefault(); setSimTime((t) => Math.max(vesselsRaw?.t_min ?? t, t - 3600)); return }
      if (k.toLowerCase() === 'g') { setShow((s) => ({ ...s, mask: !s.mask })); return }
      const n = Number(k)
      if (n === 0) { e.preventDefault(); navigate('map'); return }
      if (n >= 1 && n <= STEPS.length) { e.preventDefault(); navigate(STEPS[n - 1].id) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (loadError && !caseInfo) {
    return (
      <div className="sn-boot tone-error">
        <div className="sn-boot-inner">
          <p className="mono sn-boot-eyebrow">SAGAR-NET · CASE FILE LOADER</p>
          <h1 className="sn-boot-title">The case file is not reachable</h1>
          <p className="sn-boot-sub">
            The dashboard reads a sealed, pre-computed case bundle from <code>/api</code>. Nothing is computed in
            the browser, so the API has to be running for the map to have anything to draw.
          </p>
          <pre className="sn-boot-code mono">$ uvicorn backend.main:app --host 0.0.0.0 --port 8000</pre>
          <p className="sn-boot-err mono">{loadError}</p>
          <button type="button" className="sn-btn sn-btn-primary" onClick={load}>Try again</button>
        </div>
      </div>
    )
  }

  if (!caseInfo || !vessels || !ranking) {
    return (
      <div className="sn-boot">
        <div className="sn-boot-inner">
          <div className="sn-boot-logo">SAGAR<b>-NET</b></div>
          <p className="sn-boot-sub">
            Loading the sealed case file — satellite scene, drift ensemble, AIS history and vessel ranking.
          </p>
          <div className="sn-boot-bar"><div /></div>
          <ul className="sn-boot-steps mono">
            <li>SAR SCENE</li><li>DETECTION</li><li>BACKWARD DRIFT</li><li>AIS 48H</li><li>RANKING</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <GlossaryProvider>
      <div className="sn-shell">
        <LeftRail view={view} setView={navigate} onHelp={() => setGuideOpen(true)} />

        <div className="sn-main">
          <SagarNetHeader
            caseInfo={caseInfo} detection={detection} manifest={manifest} ranking={ranking}
            onHelp={() => setGuideOpen(true)}
          />

          <div className="sn-workspace">
            <MapView
              caseInfo={caseInfo} detection={detection} backtrack={backtrack}
              forecast={forecast} manifest={manifest} vessels={vessels}
              ranking={ranking} simTime={simTime} driftHour={driftHour} flowHour={flowHour}
              pulse={pulse} show={show} tMin={vesselsRaw.t_min}
              selectedMmsi={selectedMmsi} onSelectVessel={onSelectVessel}
              onSelectSlick={onSelectSlick} mapFocus={mapFocus}
              originMode={originMode} flowMode={flowMode}
              mapMode={mapMode} setMapMode={setMapMode}
              flowPlaying={flowPlaying} onFlowPlay={() => setFlowPlaying((p) => !p)}
              setFlowHour={setFlowHour}
              onTraceOrigin={onTraceOrigin} onViewOilFlow={onViewOilFlow}
              reducedMotion={reducedMotion} setShow={setShow}
            />

            <IntelligenceSidebar view={view} setView={navigate} {...shared} />
          </div>

          <TimeBar
            simTime={simTime} tMin={vesselsRaw.t_min} tMax={vesselsRaw.t_max}
            playing={playing} speed={speed} t0={t0}
            releaseWindow={manifest?.origin_estimate?.estimated_release_window_utc}
            onPlay={() => setPlaying((p) => !p)} onSpeed={setSpeed}
            onSimTime={setSimTime}
          />
        </div>

        {toast && <div className="sn-toast panel-enter"><span className="mono">✓</span>{toast}</div>}
      </div>

      <DossierModal open={dossierOpen} onClose={() => setDossierOpen(false)} caseId={caseInfo.case_id} manifest={manifest} />
      <ReadingGuide open={guideOpen} onClose={() => setGuideOpen(false)} />
    </GlossaryProvider>
  )
}
