import React, { useMemo, useState, useCallback } from 'react'
import DeckGL from '@deck.gl/react'
import { Map as MapLibre } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { buildLayers } from './layers'

const BASEMAP = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

export default function MapView(props) {
  const [basemapOk, setBasemapOk] = useState(true)
  const [popup, setPopup] = useState(null)

  const onClickVessel = useCallback((info) => {
    if (info.object) {
      setPopup({ x: info.x, y: info.y, vessel: info.object })
      props.onSelectVessel?.(info.object.mmsi)
    } else {
      setPopup(null)
      props.onSelectVessel?.(null)
    }
  }, [props])

  const layers = useMemo(
    () => buildLayers({ ...props, hoverInfo: { onClickVessel } }),
    [props.caseInfo, props.detection, props.backtrack, props.forecast,
     props.manifest, props.vessels, props.ranking, props.simTime,
     props.driftHour, props.pulse, props.show, props.tMin, props.selectedMmsi],
  )

  return (
    <div className="mapwrap">
      <DeckGL
        initialViewState={{ longitude: 75.9, latitude: 9.35, zoom: 7.7, pitch: 0, bearing: 0 }}
        controller={true}
        layers={layers}
        style={{ background: '#050b14' }}
        onClick={(info) => !info.object && setPopup(null)}
      >
        {basemapOk && (
          <MapLibre
            mapStyle={BASEMAP}
            attributionControl={false}
            onError={() => setBasemapOk(false)}
          />
        )}
      </DeckGL>

      <div className="legend">
        <div className="li"><span className="sw" style={{ background: 'rgba(255,71,87,.5)', border: '1px solid #ff4757' }} /> oil confirmed</div>
        <div className="li"><span className="sw" style={{ background: 'rgba(255,176,32,.4)', border: '1px solid #ffb020' }} /> look-alike</div>
        <div className="li"><span className="sw" style={{ background: 'rgba(255,96,72,.35)' }} /> origin cloud</div>
        <div className="li"><span className="sw" style={{ border: '1px dashed #ffb020' }} /> AIS dark interval</div>
        <div className="li"><span className="sw" style={{ background: 'rgba(156,163,175,.3)' }} /> low-detectability (wind)</div>
      </div>

      {popup && (
        <div className="vpopup" style={{ left: popup.x + 14, top: popup.y - 10 }}>
          <div className="t">{popup.vessel.name}</div>
          <div className="kv"><span>MMSI</span><b>{popup.vessel.mmsi}</b></div>
          <div className="kv"><span>type</span><b>{popup.vessel.type}</b></div>
          <div className="kv"><span>flag</span><b>{popup.vessel.flag}</b></div>
          <div className="kv"><span>length</span><b>{popup.vessel.length_m} m</b></div>
        </div>
      )}
    </div>
  )
}
