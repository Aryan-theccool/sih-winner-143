import React from 'react'
import MapView from '../map/MapView'

export default function OverviewScreen({
  caseInfo, detection, ranking, vessels, vesselsRaw, simTime, driftHour,
  pulse, show, setShow, selectedMmsi, setSelectedMmsi, setView,
  backtrack, forecast, manifest, tMin, originMode, setOriginMode, flowMode, setFlowMode,
}) {
  const top3 = ranking?.ranking?.filter((r) => r.top3).slice(0, 3) || []

  return (
    <div className="overview-screen">
      <div className="overview-cards">
        <div className="ov-card"><span className="ov-val">03</span><span className="ov-lbl">ACTIVE SPILLS</span></div>
        <div className="ov-card"><span className="ov-val">1,284</span><span className="ov-lbl">ACTIVE VESSELS</span></div>
        <div className="ov-card highlight"><span className="ov-val">07</span><span className="ov-lbl">HIGH-PRIORITY CASES</span></div>
        <div className="ov-card"><span className="ov-val">24</span><span className="ov-lbl">EVIDENCE PACKAGES</span></div>
      </div>

      <div className="overview-map">
        <MapView
          caseInfo={caseInfo} detection={detection} backtrack={backtrack}
          forecast={forecast} manifest={manifest} vessels={vessels}
          ranking={ranking} simTime={simTime} driftHour={driftHour}
          pulse={pulse} show={show} tMin={tMin}
          selectedMmsi={selectedMmsi} onSelectVessel={setSelectedMmsi}
          originMode={originMode} flowMode={flowMode}
          setShow={setShow} setOriginMode={setOriginMode} setFlowMode={setFlowMode}
          compact
        />
      </div>

      <div className="overview-lists">
        <div className="ov-list">
          <h3>RECENT DETECTIONS</h3>
          <div className="ov-item active" onClick={() => setView('detection')}>
            <b>{caseInfo?.case_id}</b>
            <span>{caseInfo?.t0_utc?.slice(0, 10)} · Kerala sector</span>
          </div>
          <div className="ov-item dim"><b>ARABIAN_2025_02</b><span>Pending review</span></div>
          <div className="ov-item dim"><b>GOA_2025_01</b><span>Archived</span></div>
        </div>
        <div className="ov-list">
          <h3>TOP CANDIDATES</h3>
          {top3.map((r, i) => (
            <div key={r.mmsi} className="ov-item" onClick={() => setView('vessels')}>
              <b>#{i + 1} {r.name}</b>
              <span>{Math.round(r.score * 100)}% attribution</span>
            </div>
          ))}
        </div>
        <div className="ov-list">
          <h3>AIS ANOMALIES</h3>
          <div className="ov-item" onClick={() => setView('vessels')}>
            <b>AIS GAP · MT KAVERI STAR</b>
            <span>6.2 h unobserved in release window</span>
          </div>
          <div className="ov-item dim"><b>UNMATCHED SAR</b><span>Under review</span></div>
        </div>
        <div className="ov-list">
          <h3>AWAITING VERIFICATION</h3>
          <div className="ov-item warn" onClick={() => setView('report')}>
            <b>{caseInfo?.case_id}</b>
            <span>Evidence bundle ready</span>
          </div>
        </div>
      </div>
    </div>
  )
}
