// headless smoke test: api transforms + layer construction
import { prepVessels, posAt } from '../frontend/src/api.js'
import { buildLayers } from '../frontend/src/map/layers.js'

const base = 'http://localhost:8000'
const j = (p) => fetch(base + p).then(r => r.json())
const [caseInfo, detection, backtrack, forecast, manifest, vesselsRaw, ranking] =
  await Promise.all([j('/api/case'), j('/api/detection'), j('/api/drift/backtrack'),
    j('/api/drift/forecast'), j('/api/drift/manifest'), j('/api/vessels'), j('/api/ranking')])

const vessels = prepVessels(vesselsRaw)
console.log('vessels prepped:', vessels.length,
  'trips timestamps monotonic:', vessels.every(v =>
    v.timestamps.every((t, i) => i === 0 || t >= v.timestamps[i - 1])))

const mid = (vesselsRaw.t_min + vesselsRaw.t_max) / 2
const probe = posAt(vessels[0], mid)
console.log('posAt mid:', probe && probe.map(x => +x.toFixed(3)))

for (const h of [0, 6, 18, 24]) {
  const layers = buildLayers({
    caseInfo, detection, backtrack, forecast, manifest, vessels, ranking,
    simTime: mid, driftHour: h, pulse: 1.2,
    show: { sar: true, mask: true, backtrack: true, forecast: true, ships: true },
    tMin: vesselsRaw.t_min, selectedMmsi: vessels[0].mmsi,
    hoverInfo: { onClickVessel: () => {} },
  })
  const ids = layers.map(l => l.id)
  console.log(`driftHour=${h}: ${layers.length} layers ->`, ids.join(','))
}
// confirm cloud polygons actually exist at selected hours
for (const h of [0, 6, 12, 18, 24]) {
  const n = backtrack.features.filter(f => f.properties.t_hours === -h).length
  console.log(`cloud features @T-${h}h:`, n)
}
