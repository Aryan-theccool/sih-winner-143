/* eslint-disable */
/**
 * SSR preview harness (dev only, not part of the app bundle).
 *
 *   node --experimental-vm-modules ../scripts/ssr-preview.mjs
 *
 * Renders every dashboard panel against the live API so we can assert that
 * nothing throws and that every class in the markup has a stylesheet rule.
 */
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'

import SagarNetHeader from '../components/SagarNetHeader'
import LeftRail from '../components/LeftRail'
import IntelligenceSidebar from '../components/IntelligenceSidebar'
import TimeBar from '../components/TimeBar'
import MapChrome from '../components/MapChrome'
import DossierModal from '../components/DossierModal'
import ReadingGuide from '../components/ReadingGuide'
import EvidentiaryLadder from '../components/EvidentiaryLadder'
import VesselIntelCard from '../components/VesselIntelCard'
import ExplainAttribution from '../components/ExplainAttribution'
import { GlossaryProvider } from '../components/Glossary'

const BASE = process.env.API || 'http://localhost:8000'
const j = (p) => fetch(BASE + p).then((r) => r.json())

const [caseInfo, detection, backtrack, forecast, manifest, vesselsRaw, ranking] = await Promise.all([
  j('/api/case'), j('/api/detection'), j('/api/drift/backtrack'), j('/api/drift/forecast'),
  j('/api/drift/manifest'), j('/api/vessels'), j('/api/ranking'),
])

const t0 = Date.parse(caseInfo.t0_utc) / 1000

const props = {
  caseInfo, detection, manifest, ranking,
  vessels: vesselsRaw.vessels, vesselsRaw,
  driftHour: 12, setDriftHour: () => {}, onDriftHour: () => {},
  originPlaying: false, setOriginPlaying: () => {},
  simTime: (vesselsRaw.t_min + vesselsRaw.t_max) / 2, t0,
  selectedMmsi: ranking.ranking[0].mmsi, onFocusVessel: () => {}, onClearVessel: () => {},
  showMask: true, setShowMask: () => {},
  onGenerateDossier: () => {}, onVerifyIntegrity: () => {},
  originMode: true, mapFocus: 'vessel', setView: () => {},
  showExplain: true, setShowExplain: () => {},
  onTraceOrigin: () => {}, onViewOilFlow: () => {},
  slickProps: detection.summary.objects[0],
  show: { sar: true, oil: true, tracks: true, ships: true, backtrack: true, gaps: true, mask: true, flow: false, current: false, wind: false, waves: false },
  mapMode: 'investigation', setMapMode: () => {},
}

const VIEWS = ['map', 'detection', 'origin', 'vessels', 'evidence', 'report']
const out = {}

const wrap = (node) => renderToStaticMarkup(
  <MemoryRouter><GlossaryProvider>{node}</GlossaryProvider></MemoryRouter>,
)

out.header = wrap(<SagarNetHeader {...props} onHelp={() => {}} />)
out.rail = wrap(<LeftRail view="origin" setView={() => {}} onHelp={() => {}} />)
out.timeline = wrap((
  <TimeBar
    simTime={props.simTime} tMin={vesselsRaw.t_min} tMax={vesselsRaw.t_max}
    playing speed={600} t0={t0} releaseWindow={manifest.origin_estimate.estimated_release_window_utc}
    onPlay={() => {}} onSpeed={() => {}} onSimTime={() => {}}
  />
))
out.mapchrome = wrap((
  <MapChrome
    caseInfo={caseInfo} detection={detection} manifest={manifest}
    mapMode="oil_flow" setMapMode={() => {}} viewState={{ latitude: 9.35, longitude: 75.7 }}
    flowPlaying flowHour={12} setFlowHour={() => {}} onFlowPlay={() => {}}
    show={props.show} setShow={() => {}}
  />
))
out.ladder = wrap(<EvidentiaryLadder ranking={ranking} compact={false} />)
out.pin = wrap((
  <VesselIntelCard
    candidate={ranking.ranking[0]} vessel={vesselsRaw.vessels[0]}
    simTime={props.simTime} manifest={manifest} rank={1}
    onViewTrack={() => {}} onViewEvidence={() => {}} onWhy={() => {}} onClear={() => {}}
  />
))
out.explain = wrap(<ExplainAttribution candidate={ranking.ranking[0]} onClose={() => {}} />)
out.dossier = wrap(<DossierModal open caseId={caseInfo.case_id} manifest={manifest} onClose={() => {}} />)
out.guide = wrap(<ReadingGuide open onClose={() => {}} />)

for (const v of VIEWS) {
  out[`panel_${v}`] = wrap(<IntelligenceSidebar view={v} setView={() => {}} {...props} />)
}

const html = Object.entries(out).map(([k, v]) => `<!-- ==== ${k} ==== -->\n${v}`).join('\n\n')
process.stdout.write(html)
