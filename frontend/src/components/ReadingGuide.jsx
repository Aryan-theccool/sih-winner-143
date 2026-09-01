import React, { useEffect, useState } from 'react'
import { GLOSSARY_LIST } from '../utils/glossary'
import { STEPS } from '../utils/stepGuide'

const COLOR_KEY = [
  { cls: 'k-slick', name: 'Detected slick', note: 'Dark, low-backscatter area the classifier reads as oil.' },
  { cls: 'k-origin', name: 'Probable origin', note: 'Where the backward drift run puts the release.' },
  { cls: 'k-track', name: 'AIS track', note: 'Positions the ship broadcast, reconstructed minute by minute.' },
  { cls: 'k-gap', name: 'AIS gap', note: 'Transmitter off while the ship kept moving.' },
  { cls: 'k-mask', name: 'Not assessable', note: 'Wind outside 3–12 m/s — the sensor is effectively blind.' },
]

const KEYS = [
  ['1 – 5', 'Jump to a pipeline step'],
  ['0', 'Case overview map'],
  ['Space', 'Play / pause the AIS replay'],
  ['← →', 'Nudge the replay one hour'],
  ['G', 'Toggle the detectability mask'],
  ['?', 'Open this guide'],
  ['Esc', 'Close'],
]

const NOT_CLAIMS = [
  'No finding of guilt — a ranking is a request to verify, nothing more.',
  'No detention-grade evidence — that needs an oil sample or the ship’s Oil Record Book.',
  'No claim about water the radar could not assess — blind spots are shown, not hidden.',
]

export default function ReadingGuide({ open, onClose }) {
  const [tab, setTab] = useState('flow')
  useEffect(() => {
    if (!open) return undefined
    const h = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open) return null

  const TABS = [
    { id: 'flow', label: 'How it works' },
    { id: 'map', label: 'Reading the map' },
    { id: 'words', label: 'Glossary' },
    { id: 'limits', label: 'Limits' },
  ]

  return (
    <div className="rg-overlay" role="dialog" aria-modal="true" aria-label="Reading the dashboard" onClick={onClose}>
      <div className="rg-card" onClick={(e) => e.stopPropagation()}>
        <header className="rg-head">
          <div>
            <p className="rg-eyebrow mono">SAGAR-NET · USER GUIDE</p>
            <h2 className="rg-title">READING THE DASHBOARD</h2>
            <p className="rg-sub">Five screens, one question each. Nothing here asks you to trust a black box.</p>
          </div>
          <button type="button" className="rg-close" onClick={onClose} aria-label="Close guide">×</button>
        </header>

        <nav className="rg-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={tab === t.id ? 'active' : ''}
              onClick={() => setTab(t.id)}
            >
              {t.label.toUpperCase()}
            </button>
          ))}
        </nav>

        <div className="rg-body">
          {tab === 'flow' && (
            <ol className="rg-steps">
              {STEPS.map((s) => (
                <li key={s.id}>
                  <span className="rg-step-num mono">{s.num}</span>
                  <div>
                    <b>{s.name.toUpperCase()}</b>
                    <p className="rg-q">{s.question}</p>
                    <p className="rg-d">{s.plain}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {tab === 'map' && (
            <div className="rg-two">
              <div>
                <h3 className="rg-h mono">WHAT THE COLOURS MEAN</h3>
                <ul className="rg-key">
                  {COLOR_KEY.map((c) => (
                    <li key={c.name}>
                      <span className={`rg-swatch ${c.cls}`} />
                      <div>
                        <b>{c.name}</b>
                        <p>{c.note}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="rg-h mono">HOW CONFIDENCE IS LABELLED</h3>
                <ul className="rg-tags">
                  <li><span className="sn-tag tone-observed">OBSERVED</span> A sensor measured it.</li>
                  <li><span className="sn-tag tone-inferred">MODEL-INFERRED</span> A model estimated it from the observation.</li>
                  <li><span className="sn-tag tone-probable">PROBABLE</span> Most likely of the options the model could see.</li>
                  <li><span className="sn-tag tone-corroborated">CORROBORATED</span> A second, independent source agrees.</li>
                  <li><span className="sn-tag tone-recommend">RECOMMENDATION</span> A suggested next human action.</li>
                </ul>
                <h3 className="rg-h mono">MAP MODES</h3>
                <p className="rg-d">
                  The bar along the bottom of the map changes which layers are drawn, so a view never shows
                  you something you did not ask for. <b>Investigation</b> is everything at once,
                  <b> Oil flow</b> looks forward, <b>Origin reconstruction</b> looks backward,
                  <b> Vessel replay</b> animates AIS.
                </p>
              </div>
            </div>
          )}

          {tab === 'words' && (
            <dl className="rg-gloss">
              {GLOSSARY_LIST.map((g) => (
                <div key={g.term} className="rg-gloss-item">
                  <dt>
                    <b>{g.term}</b>
                    <span>{g.full}</span>
                  </dt>
                  <dd>{g.plain}</dd>
                </div>
              ))}
            </dl>
          )}

          {tab === 'limits' && (
            <div className="rg-limits">
              <h3 className="rg-h mono">WHAT SAGAR-NET DOES NOT SAY</h3>
              <ul className="rg-nots">
                {NOT_CLAIMS.map((n) => <li key={n}>{n}</li>)}
              </ul>
              <h3 className="rg-h mono">KEYBOARD</h3>
              <div className="rg-keys">
                {KEYS.map(([k, v]) => (
                  <div key={k} className="rg-keyrow">
                    <kbd>{k}</kbd><span>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <footer className="rg-foot">
          <span className="mono">EVERY NUMBER ON SCREEN COMES FROM A SEALED CASE FILE — NOTHING IS COMPUTED IN THE BROWSER</span>
          <button type="button" className="sn-btn sn-btn-primary" onClick={onClose}>Got it</button>
        </footer>
      </div>
    </div>
  )
}
