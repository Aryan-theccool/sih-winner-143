// Animation & interaction smoke test — the demo's money shots, headless-verified
import { prepVessels, posAt } from '../frontend/src/api.js'
import { buildLayers } from '../frontend/src/map/layers.js'

const base = 'http://localhost:8000'
const j = (p) => fetch(base + p).then(r => { if (!r.ok) throw new Error(p + ' ' + r.status); return r.json() })
const [caseInfo, detection, backtrack, forecast, manifest, vesselsRaw, ranking] =
  await Promise.all([j('/api/case'), j('/api/detection'), j('/api/drift/backtrack'),
    j('/api/drift/forecast'), j('/api/drift/manifest'), j('/api/vessels'), j('/api/ranking')])
const vessels = prepVessels(vesselsRaw)
const T0 = Date.parse(caseInfo.t0_utc) / 1000
let pass = 0, fail = 0
const check = (name, ok, extra='') => { ok ? pass++ : fail++; console.log(`${ok?'✅':'❌'} ${name}${extra?'  ['+extra+']':''}`) }

// 1) origin cloud exists & grows for EVERY look-back hour (animation frames)
let allHours = true, areas = []
for (let h = 0; h <= 24; h++) {
  const feats = backtrack.features.filter(f => f.properties.t_hours === -h && f.properties.level === 'p90')
  if (!feats.length) allHours = false
  const g = feats[0]?.geometry
  const ring = g ? (g.type === 'Polygon' ? g.coordinates[0] : g.coordinates[0][0]) : null
  areas.push(ring ? ring.length : 0)
}
check('origin cloud frame for every hour T-0..T-24', allHours, 'points p90/h: ' + areas.slice(0,8).join(','))

// 2) cloud grows going back (uncertainty spread) — p90 ring size at 24h vs 0h
check('cloud spreads backward (uncertainty growth)', areas[24] > areas[0], `${areas[0]} -> ${areas[24]} ring pts`)

// 3) ships actually move at replay speeds (position delta over 2 sim hours)
const mover = vessels.find(v => v.mmsi === '419000002')
const t1 = T0 - 14*3600, t2 = T0 - 12*3600
const p1 = posAt(mover, t1), p2 = posAt(mover, t2)
const dkm = Math.hypot((p2[0]-p1[0])*111.3, (p2[1]-p1[1])*110.6)
check('vessels move during replay', dkm > 5, `V2 moved ${dkm.toFixed(1)} km in 2 h`)

// 4) dark vessel stays continuous through AIS gap (ghost interpolation)
const dark = vessels.find(v => v.mmsi === '419000001')
const inGap = posAt(dark, T0 - 18*3600)     // exact release time, inside dark window
check('dark vessel has ghost position inside gap', !!inGap, `pos at T-18h: ${inGap && inGap.map(x=>x.toFixed(2))}`)

// 5) MONEY SHOT: polluter sync-check — at T-18h, V1 is within the release zone
const dOrigin = Math.hypot((inGap[0]-75.62)*111.3, (inGap[1]-9.35)*110.6)
check('suspect #1 at reconstructed origin at T-18h', dOrigin < 8, `${dOrigin.toFixed(1)} km off`)

// 6) all 24 drift-hour layer builds succeed with ships animating
let buildOK = true
for (let h = 0; h <= 24; h += 1) {
  const layers = buildLayers({ caseInfo, detection, backtrack, forecast, manifest, vessels, ranking,
    simTime: T0 - h*3600, driftHour: h, pulse: h, show: { sar:true, mask:true, backtrack:true, forecast:true, ships:true },
    tMin: vesselsRaw.t_min, selectedMmsi: dark.mmsi, hoverInfo: { onClickVessel: () => {} } })
  if (layers.length < 12) buildOK = false
}
check('layer builds OK for all 24 drift hours', buildOK)

// 7) suspect pulse layer has targets (top3 with live positions)
const top3 = ranking.ranking.slice(0,3).map(r => r.mmsi)
const headsNow = vessels.filter(v => top3.includes(v.mmsi)).map(v => posAt(v, T0 - 8*3600)).filter(Boolean)
check('top-3 pulsing rings have live positions', headsNow.length === 3)

// 8) panel data for all 4 tabs
check('detection tab: objects typed', detection.summary.objects.length >= 2 && detection.summary.objects.some(o=>o.class==='oil_confirmed') && detection.summary.objects.some(o=>o.class==='look_alike'))
check('suspects tab: SHAP reasons present', ranking.ranking[0].reasons.length >= 4, ranking.ranking[0].reasons[0].text)
check('evidence tab: origin estimate + hashes', !!manifest.origin_estimate.lon && !!manifest.input_sha256.sar_scene)
for (const f of ['frame1_detection','frame2_origin','frame3_suspects']) {
  const r = await fetch(base + '/api/evidence/frames/' + f)
  check(`evidence frame ${f}`, r.ok)
}
const pdf = await fetch(base + '/api/evidence/pdf')
check('evidence.pdf downloads', pdf.ok && (await pdf.arrayBuffer()).byteLength > 500000)

// 9) vessels endpoint time range == 48h replay window
check('replay window = 48 h', Math.round((vesselsRaw.t_max - vesselsRaw.t_min)/3600) === 48)

console.log(`\n==== ${pass} passed, ${fail} failed ====`)
process.exit(fail ? 1 : 0)
