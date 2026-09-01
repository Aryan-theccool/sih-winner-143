import {
  BitmapLayer, PathLayer, PolygonLayer, ScatterplotLayer,
} from '@deck.gl/layers'
import { TripsLayer } from '@deck.gl/geo-layers'
import { PathStyleExtension } from '@deck.gl/extensions'
import { posAt } from '../api.js'

export const CLASS_COLORS = {
  oil_confirmed: [255, 71, 87],
  look_alike: [255, 176, 32],
  ambiguous: [150, 160, 175],
}
export const SUSPECT_COLORS = [
  [255, 71, 87], [255, 176, 32], [46, 213, 255],
]
const SHIP_GREY = [139, 155, 180]
const CLOUD_RGB = [255, 96, 72]

const LEVEL_OPACITY = { p90: 26, p50: 62, p10: 120 }

function featToPolygonList(fc) {
  const out = []
  for (const f of fc.features) {
    const g = f.geometry
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates
    for (const poly of polys) {
      out.push({ polygon: poly, props: f.properties })
    }
  }
  return out
}

export function buildLayers({
  caseInfo, detection, backtrack, forecast, manifest,
  vessels, ranking, simTime, driftHour, pulse,
  show, tMin, selectedMmsi, hoverInfo,
}) {
  const layers = []
  if (!caseInfo) return layers

  // ---- 1. SAR scene bitmap ----
  if (show.sar && caseInfo.scene) {
    const b = caseInfo.scene.bounds
    layers.push(new BitmapLayer({
      id: 'sar',
      image: '/api/scene.png',
      bounds: [b.lon_min, b.lat_min, b.lon_max, b.lat_max],
      opacity: 0.5,
      desaturate: 0.4,
      tintColor: [200, 220, 255],
      pickable: false,
    }))
  }

  // ---- 2. land mass (offline context, no internet needed) ----
  const landFeat = caseInfo.coastline.features.find((f) => f.properties.kind === 'land')
  layers.push(new PolygonLayer({
    id: 'land',
    data: [landFeat.geometry.coordinates],
    getPolygon: (d) => d,
    getFillColor: [22, 32, 43, 230],
    getLineColor: [52, 75, 99, 255],
    getLineWidth: 1.5,
    lineWidthUnits: 'pixels',
    pickable: false,
  }))

  // ---- 3. wind detectability mask ----
  if (show.mask && detection) {
    layers.push(new PolygonLayer({
      id: 'mask',
      data: featToPolygonList(detection.detectability),
      getPolygon: (d) => d.polygon[0],
      getFillColor: [156, 163, 175, 36],
      getLineColor: [156, 163, 175, 110],
      getLineWidth: 1,
      lineWidthUnits: 'pixels',
      stroked: true,
      filled: true,
      pickable: true,
      getTooltip: () => 'Low detectability: wind outside 3–12 m/s',
    }))
  }

  // ---- 4. slick polygons ----
  if (detection) {
    layers.push(new PolygonLayer({
      id: 'slicks',
      data: featToPolygonList(detection.slick),
      getPolygon: (d) => d.polygon[0],
      getFillColor: (d) => [...CLASS_COLORS[d.props.class] || CLASS_COLORS.ambiguous, 64],
      getLineColor: (d) => [...CLASS_COLORS[d.props.class] || CLASS_COLORS.ambiguous, 255],
      getLineWidth: 2,
      lineWidthUnits: 'pixels',
      stroked: true,
      filled: true,
      pickable: true,
      getTooltip: ({ object }) => object &&
        `${object.props.object_id} · ${object.props.class}\n` +
        `${object.props.area_km2} km² · conf ${object.props.confidence} · wind ${object.props.wind_ms} m/s`,
    }))
  }

  // ---- 5. origin cloud at the selected look-back hour ----
  if (backtrack && show.backtrack) {
    const feats = backtrack.features.filter(
      (f) => f.properties.t_hours === -driftHour && LEVEL_OPACITY[f.properties.level])
    const order = { p90: 0, p50: 1, p10: 2 }
    feats.sort((a, b) => order[a.properties.level] - order[b.properties.level])
    const cloudPolys = feats.flatMap((f) => {
      const g = f.geometry
      const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates
      return polys.map((p) => ({ polygon: p[0], level: f.properties.level }))
    })
    layers.push(new PolygonLayer({
      id: 'origin-cloud',
      data: cloudPolys,
      getPolygon: (d) => d.polygon,
      getFillColor: (d) => [...CLOUD_RGB, LEVEL_OPACITY[d.level]],
      getLineColor: (d) => [...CLOUD_RGB, d.level === 'p50' ? 220 : 90],
      getLineWidth: (d) => (d.level === 'p50' ? 2 : 1),
      lineWidthUnits: 'pixels',
      stroked: true,
      filled: true,
      pickable: false,
    }))
    // centroid track of the cloud
    const ct = backtrack.features.find((f) => f.properties.kind === 'centroid_track')
    if (ct) {
      layers.push(new PathLayer({
        id: 'cloud-track',
        data: [ct],
        getPath: (d) => d.geometry.coordinates,
        getColor: [255, 255, 255, 150],
        getWidth: 2,
        widthUnits: 'pixels',
        pickable: false,
      }))
      const c = ct.geometry.coordinates[Math.min(driftHour, ct.geometry.coordinates.length - 1)]
      layers.push(new ScatterplotLayer({
        id: 'cloud-centroid',
        data: [c],
        getPosition: (d) => d,
        getRadius: 900,
        radiusUnits: 'meters',
        getFillColor: [255, 255, 255, 40],
        getLineColor: [255, 255, 255, 200],
        lineWidthUnits: 'pixels',
        getLineWidth: 1.5,
        stroked: true,
        pickable: false,
      }))
    }
    // estimated origin star
    if (manifest) {
      const oe = manifest.origin_estimate
      layers.push(new ScatterplotLayer({
        id: 'origin-star',
        data: [[oe.lon, oe.lat]],
        getPosition: (d) => d,
        getRadius: 2600 + 900 * Math.sin(pulse / 2.2),
        radiusUnits: 'meters',
        getFillColor: [255, 176, 32, 30],
        getLineColor: [255, 176, 32, 255],
        lineWidthUnits: 'pixels',
        getLineWidth: 2,
        stroked: true,
        pickable: true,
        getTooltip: () => `Estimated origin ${oe.lon}E ${oe.lat}N\n` +
          `release window ${oe.estimated_release_window_utc[0].slice(11, 16)}–` +
          `${oe.estimated_release_window_utc[1].slice(11, 16)}Z`,
      }))
    }
  }

  // ---- 6. forward forecast cloud (p50 at +6h and +12h) ----
  if (forecast && show.forecast) {
    const feats = forecast.features.filter(
      (f) => (f.properties.t_hours === 6 || f.properties.t_hours === 12)
        && f.properties.level === 'p50')
    const polys = feats.flatMap((f) => {
      const g = f.geometry
      const ps = g.type === 'Polygon' ? [g.coordinates] : g.coordinates
      return ps.map((p) => ({ polygon: p[0], t: f.properties.t_hours }))
    })
    layers.push(new PolygonLayer({
      id: 'forecast',
      data: polys,
      getPolygon: (d) => d.polygon,
      getFillColor: (d) => [46, 213, 255, d.t === 6 ? 40 : 24],
      getLineColor: [46, 213, 255, 160],
      getLineWidth: 1.5,
      lineWidthUnits: 'pixels',
      stroked: true,
      pickable: true,
      getTooltip: ({ object }) => object && `forecast drift cloud +${object.t}h (p50)`,
    }))
  }

  // ---- 7. vessels: animated trips ----
  if (vessels && show.ships) {
    const rel = vessels.map((v) => v)
    const rankOf = {}
    if (ranking) ranking.ranking.slice(0, 3).forEach((r, i) => { rankOf[r.mmsi] = i })
    layers.push(new TripsLayer({
      id: 'trips',
      data: rel,
      getPath: (d) => d.path,
      getTimestamps: (d) => d.timestamps,
      getColor: (d) => (rankOf[d.mmsi] !== undefined ? SUSPECT_COLORS[rankOf[d.mmsi]] : SHIP_GREY),
      currentTime: simTime - tMin,
      trailLength: 5 * 3600,
      capRounded: true,
      jointRounded: true,
      fadeTrail: true,
      opacity: 0.85,
      widthMinPixels: 3,
      getWidth: (d) => (rankOf[d.mmsi] !== undefined ? 4 : 2.5),
    }))
    // dark (AIS-gap) segments as dashed paths
    const dashes = rel.flatMap((v) => (v.dark_segments || [])
      .filter((s) => s.length >= 2)
      .map((s) => ({ coords: s.map((p) => [p[0], p[1]]), mmsi: v.mmsi })))
    layers.push(new PathLayer({
      id: 'dark-gaps',
      data: dashes,
      getPath: (d) => d.coords,
      getColor: (d) => {
        const i = rankOf[d.mmsi]
        return i !== undefined ? [...SUSPECT_COLORS[i], 235] : [255, 176, 32, 200]
      },
      getWidth: (d) => (rankOf[d.mmsi] !== undefined ? 3.5 : 2.5),
      widthUnits: 'pixels',
      getDashArray: [8, 4],
      dashJustified: true,
      extensions: [new PathStyleExtension({ dash: true })],
      pickable: false,
    }))

    // instantaneous dots + pulsing suspect rings
    const heads = []
    for (const v of rel) {
      const p = posAt(v, simTime)
      if (p) heads.push({ ...v, position: p })
    }
    layers.push(new ScatterplotLayer({
      id: 'heads',
      data: heads,
      getPosition: (d) => d.position,
      getRadius: (d) => (rankOf[d.mmsi] !== undefined ? 420 : 300),
      radiusUnits: 'meters',
      getFillColor: (d) => {
        const i = rankOf[d.mmsi]
        return i !== undefined ? [...SUSPECT_COLORS[i], 255] : [199, 210, 223, 235]
      },
      getLineColor: [5, 11, 20, 255],
      getLineWidth: 1,
      lineWidthUnits: 'pixels',
      stroked: true,
      pickable: true,
      onClick: hoverInfo.onClickVessel,
      getTooltip: ({ object }) => object &&
        `${object.name} (${object.mmsi})\n${object.type} · ${object.flag}`,
    }))
    layers.push(new ScatterplotLayer({
      id: 'suspect-pulse',
      data: heads.filter((d) => rankOf[d.mmsi] !== undefined),
      getPosition: (d) => d.position,
      getRadius: 1600 + 900 * (0.5 + 0.5 * Math.sin(pulse / 2.2)),
      radiusUnits: 'meters',
      radiusMinPixels: 8,
      getFillColor: [0, 0, 0, 0],
      getLineColor: (d) => [...SUSPECT_COLORS[rankOf[d.mmsi]], 170],
      getLineWidth: 2,
      lineWidthUnits: 'pixels',
      stroked: true,
      pickable: false,
    }))
    // selection highlight
    if (selectedMmsi) {
      const sel = heads.find((d) => d.mmsi === selectedMmsi)
      if (sel) {
        layers.push(new ScatterplotLayer({
          id: 'sel-ring',
          data: [sel],
          getPosition: (d) => d.position,
          getRadius: 2600,
          radiusUnits: 'meters',
          getFillColor: [0, 0, 0, 0],
          getLineColor: [255, 255, 255, 220],
          getLineWidth: 1.5,
          lineWidthUnits: 'pixels',
          stroked: true,
          pickable: false,
        }))
      }
    }
  }
  return layers
}
