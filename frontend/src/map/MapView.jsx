import React, { useMemo, useState, useCallback } from 'react'
import DeckGL from '@deck.gl/react'
import { Map as MapLibre } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { buildLayers } from './layers'
import MapChrome from '../components/MapChrome'

const BASEMAP = {
  version: 8,
  sources: {
    satellite: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
    },
  },
  layers: [{ id: 'satellite', type: 'raster', source: 'satellite', minzoom: 0, maxzoom: 22 }],
}

export default function MapView(props) {
  const {
    caseInfo, show, setShow, originMode, setOriginMode, flowMode, setFlowMode,
    onTraceBackward, onFlowForward, onSelectVessel, onSelectSlick,
    selectedMmsi, mapFocus,
  } = props

  const [basemapOk, setBasemapOk] = useState(true)

  const onClick = useCallback((info) => {
    if (info.layer?.id === 'ship-icons' && info.object) {
      props.onSelectVessel?.(info.object.mmsi)
    } else if (info.layer?.id === 'slicks') {
      props.onSelectSlick?.()
    } else if (!info.object) {
      props.onSelectVessel?.(null)
    }
  }, [props])

  const layers = useMemo(
    () => buildLayers({ ...props, hoverInfo: { onClickVessel: onClick } }),
    [props.caseInfo, props.detection, props.backtrack, props.forecast,
     props.manifest, props.vessels, props.ranking, props.simTime,
     props.driftHour, props.pulse, props.show, props.tMin, props.selectedMmsi,
     props.originMode, props.flowMode],
  )

  const coords = caseInfo?.aoi
    ? `${((caseInfo.aoi.lat_min + caseInfo.aoi.lat_max) / 2).toFixed(2)}°N · ${((caseInfo.aoi.lon_min + caseInfo.aoi.lon_max) / 2).toFixed(2)}°E`
    : null

  return (
    <div className="map-stage">
      <DeckGL
        initialViewState={{ longitude: 75.85, latitude: 9.35, zoom: 8.1, pitch: 0, bearing: 0 }}
        controller
        layers={layers}
        style={{ background: '#060a10' }}
        onClick={onClick}
      >
        {basemapOk && (
          <MapLibre mapStyle={BASEMAP} attributionControl={false} onError={() => setBasemapOk(false)} />
        )}
      </DeckGL>

      <MapChrome
        show={show} setShow={setShow}
        originMode={originMode} setOriginMode={setOriginMode}
        flowMode={flowMode} setFlowMode={setFlowMode}
        onTraceBackward={onTraceBackward}
        onFlowForward={onFlowForward}
        caseInfo={caseInfo}
        coords={coords}
      />

    </div>
  )
}
