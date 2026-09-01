import {
  BitmapLayer, PathLayer, PolygonLayer, ScatterplotLayer, IconLayer, TextLayer,
} from '@deck.gl/layers'
import { TripsLayer } from '@deck.gl/geo-layers'
import { PathStyleExtension } from '@deck.gl/extensions'
import { posAt } from '../api.js'
import { vesselAt, speedVectorEnd, vesselTypeColor } from '../utils/vesselMotion.js'
import { getShipIconAtlas } from '../utils/shipIcon.js'

const CLASS_COLORS = {
  oil_confirmed: [220, 38, 55],
  look_alike: [245, 158, 11],
  ambiguous: [148, 163, 184],
}
const SUSPECT_COLORS = [[220, 38, 55], [245, 158, 11], [34, 211, 238]]
const CLOUD_HEAT = {
  p90: [139, 92, 246, 35],
  p50: [236, 72, 153, 85],
  p10: [251, 146, 60, 140],
}
const CLOUD_LINE = {
  p90: [139, 92, 246, 100],
  p50: [236, 72, 153, 230],
  p10: [251, 146, 60, 180],
}

function featToPolygonList(fc) {
  const out = []
  for (const f of fc.features) {
    const g = f.geometry
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates
    for (const poly of polys) out.push({ polygon: poly, props: f.properties })
  }
  return out
}

function envGrid(aoi, kind) {
  if (!aoi) return []
  const out = []
  const latStep = (aoi.lat_max - aoi.lat_min) / 5
  const lonStep = (aoi.lon_max - aoi.lon_min) / 7
  const angle = kind === 'wind' ? 225 : kind === 'waves' ? 200 : 145
  const len = kind === 'wind' ? 0.06 : 0.04
  for (let lat = aoi.lat_min + latStep / 2; lat < aoi.lat_max; lat += latStep) {
    for (let lon = aoi.lon_min + lonStep / 2; lon < aoi.lon_max; lon += lonStep) {
      const rad = (angle * Math.PI) / 180
      out.push({ from: [lon, lat], to: [lon + Math.sin(rad) * len, lat + Math.cos(rad) * len], kind })
    }
  }
  return out
}

function particleTrajectories(backtrack, driftHour, n = 40) {
  const ct = backtrack?.features?.find((f) => f.properties?.kind === 'centroid_track')
  if (!ct) return []
  const coords = ct.geometry.coordinates.slice(0, Math.max(2, driftHour + 1))
  const trails = []
  for (let i = 0; i < n; i++) {
    const off = (i / n - 0.5) * 0.04
    trails.push(coords.map(([lon, lat], j) => [lon + off * (j / coords.length), lat + off * 0.5]))
  }
  return trails
}

export function buildLayers({
  caseInfo, detection, backtrack, forecast, manifest,
  vessels, ranking, simTime, driftHour, pulse,
  show, tMin, selectedMmsi, hoverInfo, originMode, flowMode,
}) {
  const layers = []
  if (!caseInfo) return layers

  if (show.sar && caseInfo.scene) {
    const b = caseInfo.scene.bounds
    layers.push(new BitmapLayer({
      id: 'sar', image: '/api/scene.png',
      bounds: [b.lon_min, b.lat_min, b.lon_max, b.lat_max],
      opacity: show.oil ? 0.35 : 0.5, pickable: false,
    }))
  }

  const coastFeat = caseInfo.coastline.features.find((f) => f.properties.kind === 'coastline')
  layers.push(new PathLayer({
    id: 'coastline', data: [coastFeat], getPath: (d) => d.geometry.coordinates,
    getColor: [255, 255, 255, 160], getWidth: 1.5, widthUnits: 'pixels', pickable: false,
  }))

  if (show.current) {
    const grid = envGrid(caseInfo.aoi, 'current')
    layers.push(new PathLayer({
      id: 'current-vectors', data: grid, getPath: (d) => [d.from, d.to],
      getColor: [34, 211, 238, 180], getWidth: 2, widthUnits: 'pixels', pickable: false,
    }))
  }
  if (show.wind) {
    const grid = envGrid(caseInfo.aoi, 'wind')
    layers.push(new PathLayer({
      id: 'wind-vectors', data: grid, getPath: (d) => [d.from, d.to],
      getColor: [147, 197, 253, 200], getWidth: 2, widthUnits: 'pixels', pickable: false,
    }))
  }
  if (show.waves) {
    const grid = envGrid(caseInfo.aoi, 'waves')
    layers.push(new PathLayer({
      id: 'wave-vectors', data: grid, getPath: (d) => [d.from, d.to],
      getColor: [96, 165, 250, 120], getWidth: 1.5, widthUnits: 'pixels', pickable: false,
    }))
  }

  if (show.mask && detection) {
    layers.push(new PolygonLayer({
      id: 'mask', data: featToPolygonList(detection.detectability),
      getPolygon: (d) => d.polygon[0],
      getFillColor: [100, 116, 139, 55], getLineColor: [148, 163, 184, 150],
      getLineWidth: 1, lineWidthUnits: 'pixels', stroked: true, filled: true, pickable: true,
      getTooltip: () => 'Low detectability: wind outside 3–12 m/s',
    }))
  }

  if (show.oil && detection) {
    // slick layers rendered on top — see end of buildLayers()
    layers._pendingSlick = { detection, mapFocus: hoverInfo?.mapFocus, pulse }
  }

  if (backtrack && show.backtrack) {
    const feats = backtrack.features.filter(
      (f) => f.properties.t_hours === -driftHour && CLOUD_HEAT[f.properties.level],
    )
    const order = { p90: 0, p50: 1, p10: 2 }
    feats.sort((a, b) => order[a.properties.level] - order[b.properties.level])
    const cloudPolys = feats.flatMap((f) => {
      const g = f.geometry
      const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates
      return polys.map((p) => ({ polygon: p[0], level: f.properties.level }))
    })
    layers.push(new PolygonLayer({
      id: 'origin-cloud', data: cloudPolys, getPolygon: (d) => d.polygon,
      getFillColor: (d) => CLOUD_HEAT[d.level], getLineColor: (d) => CLOUD_LINE[d.level],
      getLineWidth: (d) => (d.level === 'p50' ? 2.5 : 1), lineWidthUnits: 'pixels',
      stroked: true, filled: true, pickable: false,
    }))

    if (originMode) {
      const trails = particleTrajectories(backtrack, driftHour, 120)
      layers.push(new PathLayer({
        id: 'particle-ensemble', data: trails, getPath: (d) => d,
        getColor: [139, 92, 246, 40], getWidth: 1, widthUnits: 'pixels', pickable: false,
      }))
    }

    const ct = backtrack.features.find((f) => f.properties.kind === 'centroid_track')
    if (ct) {
      const slice = ct.geometry.coordinates.slice(0, Math.max(2, driftHour + 1))
      layers.push(new PathLayer({
        id: 'cloud-track', data: [slice], getPath: (d) => d,
        getColor: [34, 211, 238, 220], getWidth: 3, widthUnits: 'pixels', pickable: false,
      }))
      const arrows = []
      for (let i = 1; i < slice.length; i += 2) arrows.push({ from: slice[i], to: slice[i - 1] })
      if (arrows.length) {
        layers.push(new PathLayer({
          id: 'drift-arrows', data: arrows, getPath: (d) => [d.from, d.to],
          getColor: [34, 211, 238, 200], getWidth: 2, widthUnits: 'pixels', pickable: false,
        }))
      }
    }

    if (manifest) {
      const oe = manifest.origin_estimate
      layers.push(new ScatterplotLayer({
        id: 'origin-star', data: [[oe.lon, oe.lat]], getPosition: (d) => d,
        getRadius: 2800 + 800 * Math.sin(pulse / 2.2), radiusUnits: 'meters',
        getFillColor: [251, 191, 36, 30], getLineColor: [251, 191, 36, 255],
        getLineWidth: 2, lineWidthUnits: 'pixels', stroked: true, pickable: true,
        getTooltip: () => `Probable release origin\n${oe.lon}°E ${oe.lat}°N`,
      }))
    }
  }

  if (forecast && (show.flow || flowMode)) {
    const feats = forecast.features.filter((f) => f.properties.level === 'p50')
    const polys = feats.flatMap((f) => {
      const g = f.geometry
      const ps = g.type === 'Polygon' ? [g.coordinates] : g.coordinates
      return ps.map((p) => ({ polygon: p[0], t: f.properties.t_hours }))
    })
    layers.push(new PolygonLayer({
      id: 'flow-forecast', data: polys, getPolygon: (d) => d.polygon,
      getFillColor: (d) => [34, 211, 238, 30 + 15 * Math.sin(pulse / 3 + d.t)],
      getLineColor: [34, 211, 238, 140], getLineWidth: 1.5, lineWidthUnits: 'pixels',
      stroked: true, pickable: false,
    }))
  }

  if (vessels && show.ships) {
    const rankOf = {}
    if (ranking) ranking.ranking.slice(0, 3).forEach((r, i) => { rankOf[r.mmsi] = i })
    const { atlas, mapping, typeKey } = getShipIconAtlas()

    if (show.tracks !== false) {
      layers.push(new TripsLayer({
        id: 'trips', data: vessels, getPath: (d) => d.path, getTimestamps: (d) => d.timestamps,
        getColor: (d) => {
          const i = rankOf[d.mmsi]
          if (i !== undefined) return [...SUSPECT_COLORS[i], 200]
          return [...vesselTypeColor(d.type), 140]
        },
        currentTime: simTime - tMin, trailLength: 4 * 3600,
        capRounded: true, jointRounded: true, fadeTrail: true, opacity: 0.8,
        widthMinPixels: 2, getWidth: (d) => (rankOf[d.mmsi] !== undefined ? 3.5 : 2),
      }))
    }

    if (show.gaps) {
      const dashes = vessels.flatMap((v) => (v.dark_segments || [])
        .filter((s) => s.length >= 2)
        .map((s) => ({ coords: s.map((p) => [p[0], p[1]]), mmsi: v.mmsi })))
      layers.push(new PathLayer({
        id: 'ais-gaps', data: dashes, getPath: (d) => d.coords,
        getColor: (d) => {
          const i = rankOf[d.mmsi]
          return i !== undefined ? [...SUSPECT_COLORS[i], 220] : [245, 158, 11, 180]
        },
        getWidth: 2.5, widthUnits: 'pixels', getDashArray: [6, 4], dashJustified: true,
        extensions: [new PathStyleExtension({ dash: true })], pickable: false,
      }))
    }

    const heads = []
    const vectors = []
    for (const v of vessels) {
      const st = vesselAt(v, simTime)
      if (!st) continue
      heads.push({ ...v, ...st })
      vectors.push({ from: st.position, to: speedVectorEnd(...st.position, st.heading, st.speed) })
    }

    layers.push(new PathLayer({
      id: 'speed-vectors', data: vectors, getPath: (d) => [d.from, d.to],
      getColor: [200, 220, 240, 160], getWidth: 2, widthUnits: 'pixels', pickable: false,
    }))

    layers.push(new IconLayer({
      id: 'ship-icons', data: heads, pickable: true,
      iconAtlas: atlas, iconMapping: mapping,
      getIcon: (d) => typeKey(d.type),
      getPosition: (d) => d.position,
      getSize: (d) => {
        const i = rankOf[d.mmsi]
        return i !== undefined ? 22 : Math.min(18, 10 + (d.length_m || 100) / 18)
      },
      getAngle: (d) => -d.heading,
      getColor: (d) => {
        const i = rankOf[d.mmsi]
        if (i !== undefined) return [255, 255, 255, 255]
        return [74, 222, 128, 255]
      },
      onClick: hoverInfo?.onClickVessel,
      getTooltip: ({ object }) => {
        if (!object) return null
        const rank = rankOf[object.mmsi]
        const rankLine = rank !== undefined ? `\nAttribution rank: #${rank + 1}` : ''
        return `${object.name} (${object.mmsi})\n${object.type} · ${object.speed.toFixed(1)} kn · ${Math.round(object.heading)}°${rankLine}\n${object.inGap ? 'AIS GAP' : 'AIS active'}`
      },
    }))

    // Vessel name labels — professional tracking style
    const labelData = heads.slice(0, 24).map((d) => ({
      ...d,
      label: `${d.name?.split(' ').slice(-2).join(' ') || d.mmsi} | ${d.speed.toFixed(1)} kn`,
    }))
    layers.push(new TextLayer({
      id: 'vessel-labels',
      data: labelData,
      pickable: false,
      getPosition: (d) => d.position,
      getText: (d) => d.label,
      getSize: 11,
      getColor: [255, 255, 255, 220],
      getAngle: 0,
      getTextAnchor: 'start',
      getAlignmentBaseline: 'bottom',
      getPixelOffset: [12, -6],
      fontFamily: 'IBM Plex Mono, monospace',
      outlineWidth: 2,
      outlineColor: [0, 0, 0, 200],
    }))

    if (selectedMmsi) {
      const sel = heads.find((d) => d.mmsi === selectedMmsi)
      if (sel) {
        layers.push(new ScatterplotLayer({
          id: 'sel-ring', data: [sel], getPosition: (d) => d.position,
          getRadius: 2400, radiusUnits: 'meters',
          getFillColor: [0, 0, 0, 0], getLineColor: [255, 255, 255, 230],
          getLineWidth: 2, lineWidthUnits: 'pixels', stroked: true, pickable: false,
        }))
      }
    }

    // PRD F3: top-3 suspects get pulsing highlight rings
    layers.push(new ScatterplotLayer({
      id: 'suspect-pulse',
      data: heads.filter((d) => rankOf[d.mmsi] !== undefined),
      getPosition: (d) => d.position,
      getRadius: 1800 + 900 * (0.5 + 0.5 * Math.sin(pulse / 2.2)),
      radiusUnits: 'meters',
      radiusMinPixels: 10,
      getFillColor: [0, 0, 0, 0],
      getLineColor: (d) => [...SUSPECT_COLORS[rankOf[d.mmsi]], 200],
      getLineWidth: 2.5, lineWidthUnits: 'pixels', stroked: true, pickable: false,
    }))
  }

  // Oil slick — render on top of vessels so it's visible on the ocean
  const pending = layers._pendingSlick
  if (pending) {
    const { detection: det, mapFocus, pulse: pls } = pending
    const slickPolys = featToPolygonList(det.slick)
    const highlighted = mapFocus === 'slick'
    const confirmed = slickPolys.filter((d) => d.props.class === 'oil_confirmed')

    if (confirmed.length) {
      // Interior probability gradient — geospatial overlay, not cartoon blob
      layers.push(new PolygonLayer({
        id: 'slick-interior', data: confirmed,
        getPolygon: (d) => d.polygon[0],
        getFillColor: [90, 95, 100, highlighted ? 130 : 100],
        getLineColor: [0, 0, 0, 0],
        stroked: false, filled: true, pickable: false,
      }))
    }

    layers.push(new PolygonLayer({
      id: 'slicks-fill', data: slickPolys,
      getPolygon: (d) => d.polygon[0],
      getFillColor: (d) => {
        if (d.props.class !== 'oil_confirmed') return [148, 163, 184, 40]
        return [180, 90, 90, highlighted ? 80 : 55]
      },
      getLineColor: [0, 0, 0, 0],
      stroked: false, filled: true, pickable: true,
      onClick: hoverInfo?.onClickSlick,
    }))

    layers.push(new PolygonLayer({
      id: 'slicks', data: slickPolys,
      getPolygon: (d) => d.polygon[0],
      getFillColor: [0, 0, 0, 0],
      getLineColor: (d) => {
        if (d.props.class === 'oil_confirmed') return [220, 38, 55, 255]
        return [245, 158, 11, 180]
      },
      getLineWidth: (d) => (d.props.class === 'oil_confirmed' ? 2 : 1.5),
      lineWidthUnits: 'pixels',
      stroked: true, filled: false, pickable: true,
      onClick: hoverInfo?.onClickSlick,
      getTooltip: ({ object }) => object &&
        `DETECTED SLICK\nOil-slick probability ${Math.round(object.props.confidence * 100)}%\n${object.props.area_km2} km²`,
    }))

    const obj = det.summary?.objects?.find((o) => o.class === 'oil_confirmed')
    if (obj?.centroid) {
      layers.push(new ScatterplotLayer({
        id: 'slick-centroid', data: [obj.centroid], getPosition: (d) => d,
        getRadius: 600 + (highlighted ? 200 * Math.sin(pls / 2) : 0),
        radiusUnits: 'meters',
        getFillColor: [220, 38, 55, highlighted ? 120 : 70],
        getLineColor: [255, 255, 255, 255],
        getLineWidth: 3, lineWidthUnits: 'pixels', stroked: true, pickable: false,
      }))
    }
    delete layers._pendingSlick
  }

  return layers.filter((l) => l instanceof Object && l.id)
}
