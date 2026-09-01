import React from 'react'

function Chip({ c }) {
  return <span className={`chip ${c}`}>{c.replace('_', ' ')}</span>
}

const VERDICT_STYLE = {
  'PRIMARY SUSPECT': { color: '#ff4757' },
  'SUSPECT — CORROBORATE': { color: '#ff8c42' },
  'POSSIBLE · ADVISORY ONLY': { color: '#ffb020' },
  'CLEARED': { color: '#3cdc8c' },
  'EXONERATED': { color: '#3cdc8c' },
}

function VerdictBadge({ verdict }) {
  const s = VERDICT_STYLE[verdict] || { color: '#c7d2df' }
  return (
    <span className="chip" style={{ color: s.color, border: `1px solid ${s.color}`,
      background: `${s.color}18`, whiteSpace: 'nowrap' }}>{verdict}</span>
  )
}

function DetectionTab({ detection, showMask, setShowMask }) {
  if (!detection) return <p className="note">loading…</p>
  const { summary, slick } = detection
  return (
    <div>
      <h3 className="sec">SAR scene</h3>
      <div className="card">
        <div className="kv"><span>scene</span><b>{summary.scene_id.slice(0, 26)}…</b></div>
        <div className="kv"><span>acquired</span><b>{summary.acquisition_time_utc.slice(0, 16)}Z</b></div>
        <div className="kv"><span>detector</span><b>{summary.detector.split(' ')[0]}</b></div>
        <div className="kv"><span>threshold</span><b>{summary.threshold_db} dB below local bg</b></div>
      </div>
      <h3 className="sec">Detected objects ({slick.features.length})</h3>
      {summary.objects.map((o) => (
        <div className="card" key={o.object_id}>
          <div className="suspect-head">
            <span className="nm" style={{ fontSize: 12 }}>{o.object_id}</span>
            <span style={{ marginLeft: 'auto' }}><Chip c={o.class} /></span>
          </div>
          <div className="kv"><span>area</span><b>{o.area_km2} km²</b></div>
          <div className="kv"><span>darkening</span><b>{o.contrast_db} dB</b></div>
          <div className="kv"><span>wind at object</span><b>{o.wind_ms} m/s</b></div>
          <div className="kv"><span>confidence</span><b>{Math.round(o.confidence * 100)}%</b></div>
        </div>
      ))}
      <label className="toggle">
        <input type="checkbox" checked={showMask} onChange={(e) => setShowMask(e.target.checked)} />
        show low-detectability wind mask (outside 3–12 m/s)
      </label>
      <p className="note">
        Slicks only damp capillary waves when surface wind is 3–12 m/s — objects in
        the low-wind zone are typed as look-alikes, not oil.
      </p>
    </div>
  )
}

function OriginTab({ manifest, driftHour, setDriftHour, onAnimate }) {
  if (!manifest) return <p className="note">loading…</p>
  const oe = manifest.origin_estimate
  return (
    <div>
      <h3 className="sec">Backward attribution</h3>
      <div className="card">
        <div className="kv"><span>engine</span><b>{manifest.engine.split('(')[0]}</b></div>
        <div className="kv"><span>particles</span><b>{manifest.n_particles}</b></div>
        <div className="kv"><span>horizon</span><b>−{manifest.backtrack_hours} h</b></div>
        <div className="kv"><span>seed object</span><b>{manifest.seed_object}</b></div>
      </div>
      <div className="card">
        <div className="kv"><span>estimated origin</span><b>{oe.lon}°E {oe.lat}°N</b></div>
        <div className="kv"><span>release window</span>
          <b>{oe.estimated_release_window_utc[0].slice(11, 16)}–{oe.estimated_release_window_utc[1].slice(11, 16)}Z</b></div>
        <div className="kv"><span>window date</span><b>{oe.estimated_release_window_utc[0].slice(0, 10)}</b></div>
        {oe.note_synthetic_case_truth && (
          <div className="kv"><span>ground truth err</span>
            <b>{oe.note_synthetic_case_truth.origin_error_km} km</b></div>
        )}
      </div>
      <h3 className="sec">time machine</h3>
      <input
        className="drift" type="range" min={0} max={24} step={1}
        value={driftHour} onChange={(e) => setDriftHour(parseInt(e.target.value, 10))}
      />
      <div className="kv"><span>look-back</span><b style={{ color: '#ff6048' }}>T−{driftHour} h</b></div>
      <button className="minibtn" style={{ marginTop: 8 }} onClick={onAnimate}>
        ▶ run the time machine (0 → −24 h)
      </button>
      <p className="note">
        The slick is advected <i>backward</i> hour by hour; the probability cloud spreads
        with uncertainty, and shrinks to the most probable release zone. No operational
        system (EMSA CleanSeaNet, INCOIS OOSA) performs this backward attribution —
        that is the novelty.
      </p>
    </div>
  )
}

function SuspectsTab({ ranking, onFocusVessel, selectedMmsi }) {
  if (!ranking) return <p className="note">loading…</p>
  return (
    <div>
      <h3 className="sec">Top suspects — LightGBM + TreeSHAP</h3>
      {ranking.ranking.slice(0, 3).map((r, i) => (
        <div
          key={r.mmsi}
          className={`card suspect-card rank${i + 1} ${selectedMmsi === r.mmsi ? 'sel' : ''}`}
          style={{ cursor: 'pointer', background: selectedMmsi === r.mmsi ? 'rgba(46,213,255,.08)' : undefined }}
          onClick={() => onFocusVessel(r.mmsi)}
        >
          <div className="suspect-head">
            <span className="nm">#{r.rank} {r.name}</span>
            <span className="mmsi">{r.mmsi}</span>
            <span className="score">{r.score.toFixed(3)}</span>
          </div>
          <div style={{ margin: '6px 0 2px' }}><VerdictBadge verdict={r.verdict || 'CLEARED'} /></div>
          <div className="scorebar"><div style={{ width: `${Math.max(4, r.score * 100)}%` }} /></div>
          <div className="kv"><span>{r.type}</span><b>{r.flag} · {r.length_m} m</b></div>
          <div className="reasons">
            {(() => {
              const mx = Math.max(...r.reasons.map((x) => Math.abs(x.weight)), 0.01)
              return r.reasons.slice(0, 4).map((x, k) => (
                <div key={k} className="shaprow" title={`SHAP contribution ${x.weight >= 0 ? '+' : ''}${x.weight}`}>
                  <div className="shapbar">
                    <div
                      className={x.direction === 'lowers' ? 'shapfill down' : 'shapfill'}
                      style={{ width: `${Math.round((Math.abs(x.weight) / mx) * 100)}%` }}
                    />
                  </div>
                  <div className={`reason ${x.direction === 'lowers' ? 'down' : ''}`}>
                    {x.text}
                    <span className="shapw">{x.direction === 'lowers' ? '−' : '+'}{Math.abs(x.weight).toFixed(2)}</span>
                  </div>
                </div>
              ))
            })()}
          </div>
        </div>
      ))}
      <h3 className="sec">exonerated / cleared</h3>
      {ranking.ranking.filter((r) => (r.exonerated || (r.verdict === 'CLEARED')) && !r.top3).map((r) => (
        <div className="card" key={r.mmsi} style={{ cursor: 'pointer' }} onClick={() => onFocusVessel(r.mmsi)}>
          <div className="suspect-head">
            <span className="nm" style={{ fontSize: 12 }}>{r.name}</span>
            <span style={{ marginLeft: 'auto' }}><VerdictBadge verdict={r.verdict || 'EXONERATED'} /></span>
          </div>
          {r.reasons.filter((x) => x.feature === 'late_arrival' || x.direction === 'lowers').slice(0, 2).map((x, k) => (
            <div key={k} className="reason down">{x.text}</div>
          ))}
          <div className="kv"><span>score</span><b>{r.score}</b></div>
        </div>
      ))}
      <h3 className="sec">fleet ({ranking.n_vessels})</h3>
      {ranking.ranking.slice(3).filter((r) => !r.exonerated).map((r) => (
        <div key={r.mmsi} className="kv" style={{ cursor: 'pointer' }} onClick={() => onFocusVessel(r.mmsi)}>
          <span>#{r.rank} {r.name}</span><b>{r.score.toFixed(3)}</b>
        </div>
      ))}
    </div>
  )
}

function EvidenceTab({ caseInfo, manifest }) {
  return (
    <div>
      <h3 className="sec">Legal framing</h3>
      <div className="legal-box">
        <b>UNCLOS Art. 220(3) — tip-and-cue.</b> Clear grounds to request information
        from the flagged vessels. <b>Not</b> detention-grade: physical inspection
        220(5) and detention 220(6) remain with the Indian Coast Guard.
      </div>
      <h3 className="sec">Package</h3>
      <img className="frame" src="/api/evidence/frames/frame1_detection" alt="F1 frame" />
      <img className="frame" src="/api/evidence/frames/frame2_origin" alt="F2 frame" />
      <img className="frame" src="/api/evidence/frames/frame3_suspects" alt="F4 frame" />
      <h3 className="sec">integrity</h3>
      {manifest && (
        <div className="card hashes">
          <div>scene·tif {manifest.input_sha256.sar_scene.slice(0, 24)}…</div>
          <div>backtrack·geojson {manifest.input_sha256.backtrack_hourly ? manifest.input_sha256.backtrack_hourly.slice(0, 24) : '…'}</div>
          <div>suspects·json {manifest.input_sha256.slick_polygons ? manifest.input_sha256.slick_polygons.slice(0, 24) : '…'}</div>
        </div>
      )}
      <a href="/api/evidence/pdf" download style={{ textDecoration: 'none' }}>
        <button className="minibtn warn" style={{ width: '100%', padding: 10, marginTop: 8 }}>
          ⬇ download evidence.pdf (UNCLOS 220(3) package)
        </button>
      </a>
    </div>
  )
}

export default function SidePanel(props) {
  const tabs = ['detection', 'origin', 'suspects', 'evidence']
  return (
    <div className="sidepanel">
      <div className="tabs">
        {tabs.map((t) => (
          <button key={t} className={props.tab === t ? 'active' : ''}
            onClick={() => props.setTab(t)}>{t}</button>
        ))}
      </div>
      <div className="tabbody">
        {props.tab === 'detection' && <DetectionTab {...props} />}
        {props.tab === 'origin' && <OriginTab {...props} />}
        {props.tab === 'suspects' && <SuspectsTab {...props} />}
        {props.tab === 'evidence' && <EvidenceTab {...props} />}
      </div>
    </div>
  )
}
