import React, { useMemo, useState, useCallback, useEffect } from 'react'
import DeckGL from '@deck.gl/react'
import { Map as MapLibre } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { buildLayers } from './layers'
import MapChrome from '../components/MapChrome'
import { loadShipIconAtlas } from '../utils/shipIcon.js'

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

const DEFAULT_VIEW = { longitude: 75.727, latitude: 9.357, zoom: 9.2, pitch: 0, bearing: 0, transitionDuration: 0 }

export default function MapView(props) {
  const {
    caseInfo, detection, manifest, mapMode, setMapMode,
    flowPlaying, onFlowPlay, flowHour, setFlowHour,
    onSelectVessel, onSelectSlick, mapFocus,
    onTraceOrigin, onViewOilFlow,
  } = props

  const [basemapOk, setBasemapOk] = useState(true)
  const [viewState, setViewState] = useState(DEFAULT_VIEW)
  const [shipIconsReady, setShipIconsReady] = useState(false)

  useEffect(() => {
    loadShipIconAtlas().then(() => setShipIconsReady(true)).catch(() => {})
  }, [])

  useEffect(() => {
    const obj = detection?.summary?.objects?.find((o) => o.class === 'oil_confirmed')
    if (obj?.centroid) {
      setViewState((v) => ({
        ...v, longitude: obj.centroid[0], latitude: obj.centroid[1],
        zoom: 9.4, transitionDuration: 900,
      }))
    }
  }, [detection])

  const onClickSlick = useCallback((info) => {
    onSelectSlick?.(info.object?.props ?? null)
  }, [onSelectSlick])

  const onClick = useCallback((info) => {
    if (info.layer?.id === 'ship-icons' && info.object) {
      onSelectVessel?.(info.object.mmsi)
    } else if (info.layer?.id === 'slick-core' || info.layer?.id === 'slick-halo') {
      onClickSlick(info)
    } else if (!info.object) {
      onSelectVessel?.(null)
    }
  }, [onSelectVessel, onClickSlick])

  const layers = useMemo(
    () => buildLayers({ ...props, hoverInfo: { onClickVessel: onClick, onClickSlick, mapFocus } }),
    [props.caseInfo, props.detection, props.backtrack, props.forecast,
     props.manifest, props.vessels, props.ranking, props.simTime,
     props.driftHour, props.pulse, props.show, props.tMin, props.selectedMmsi,
     props.originMode, props.flowMode, props.reducedMotion, props.flowHour, mapFocus, shipIconsReady],
  )

  return (
    <div className="map-stage">
      {mapMode === 'vessel_replay' && !props.reducedMotion && (
        <div className="mc-radar-sweep" aria-hidden="true" />
      )}
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: vs }) => setViewState(vs)}
        controller
        layers={layers}
        style={{ background: 'transparent' }}
        onClick={onClick}
      >
        {basemapOk && (
          <MapLibre mapStyle={BASEMAP} attributionControl={false} onError={() => setBasemapOk(false)} />
        )}
      </DeckGL>

      <MapChrome
        caseInfo={caseInfo}
        detection={detection}
        manifest={manifest}
        mapMode={mapMode}
        setMapMode={setMapMode}
        viewState={viewState}
        flowPlaying={flowPlaying}
        onFlowPlay={onFlowPlay}
        flowHour={flowHour}
        setFlowHour={setFlowHour}
        show={props.show}
        setShow={props.setShow}
      />
    </div>
  )
}
