import React, { useEffect, useRef, useState } from 'react'

const LAYERS = [
  {
    id: 'ingest',
    label: 'DATA INGESTION',
    nodes: [
      { id: 'sar', label: 'SENTINEL-1 SAR', sub: 'C-BAND' },
      { id: 'ais', label: 'AIS STREAM', sub: 'REAL-TIME' },
      { id: 'currents', label: 'OCEAN CURRENTS', sub: 'HYCOM' },
      { id: 'wind', label: 'WIND FIELD', sub: 'ECMWF' },
      { id: 'waves', label: 'WAVE MODEL', sub: 'SWAN' },
      { id: 'optical', label: 'OPTICAL IMAGERY', sub: 'SENTINEL-2' },
      { id: 'orb', label: 'OIL RECORD BOOK', sub: 'PORT LOGS' },
      { id: 'chemical', label: 'CHEMICAL SAMPLES', sub: 'LAB' },
    ],
  },
]

const PIPELINES = [
  {
    id: 'detection',
    label: 'DETECTION ENGINE',
    color: '#22d3ee',
    steps: ['SAR SLICK DETECTION', 'MORPHOLOGY & AREA', 'SPILL AGE ESTIMATION'],
    feeds: ['sar', 'optical'],
  },
  {
    id: 'origin',
    label: 'ORIGIN ENGINE',
    color: '#9d4edd',
    steps: ['OCEAN FORCING', 'BACKWARD DRIFT', 'RELEASE WINDOW', 'PROBABILITY CLOUD'],
    feeds: ['currents', 'wind', 'waves'],
  },
  {
    id: 'attribution',
    label: 'ATTRIBUTION ENGINE',
    color: '#22c55e',
    steps: ['AIS VESSEL REPLAY', 'CANDIDATE RANKING', 'SHAP SCORING', 'ANOMALY FLAG'],
    feeds: ['ais'],
  },
]

const FUSION = [
  { id: 'correlate', label: 'MULTI-SOURCE CORRELATION' },
  { id: 'provenance', label: 'EVIDENCE PROVENANCE' },
  { id: 'explain', label: 'SHAP EXPLAINABILITY' },
]

const LADDER = [
  { id: 'observed', label: 'OBSERVED', desc: 'Sensor measurements' },
  { id: 'inferred', label: 'INFERRED', desc: 'Model estimates' },
  { id: 'probable', label: 'PROBABLE', desc: 'Weighted likelihood' },
  { id: 'corroborated', label: 'CORROBORATED', desc: 'Independent support' },
]

const OUTPUTS = [
  { id: 'regulatory', label: 'REGULATORY MAPPING', sub: 'UNCLOS · MARPOL' },
  { id: 'integrity', label: 'INTEGRITY SEAL', sub: 'SHA-256 VERIFIED' },
  { id: 'dossier', label: 'CASE DOSSIER', sub: 'AUDITABLE BUNDLE' },
]

function useArchVisible(threshold = 0.12) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

function ArchNode({ label, sub, color, className = '', delay = 0, visible, small }) {
  return (
    <div
      className={`lp-arch-node ${visible ? 'visible' : ''} ${className}`}
      style={{ '--node-accent': color || 'var(--lp-cyan)', transitionDelay: `${delay}ms` }}
    >
      <span className={`lp-arch-node-label ${small ? 'small' : ''}`}>{label}</span>
      {sub && <span className="lp-arch-node-sub">{sub}</span>}
    </div>
  )
}

function PipelineBox({ pipeline, visible, baseDelay }) {
  return (
    <div
      className={`lp-arch-pipeline ${visible ? 'visible' : ''}`}
      style={{ '--pipe-color': pipeline.color, transitionDelay: `${baseDelay}ms` }}
    >
      <div className="lp-arch-pipeline-header">{pipeline.label}</div>
      <div className="lp-arch-pipeline-steps">
        {pipeline.steps.map((step, i) => (
          <React.Fragment key={step}>
            <div
              className={`lp-arch-step ${visible ? 'visible' : ''}`}
              style={{ transitionDelay: `${baseDelay + 80 + i * 60}ms` }}
            >
              {step}
            </div>
            {i < pipeline.steps.length - 1 && (
              <div className={`lp-arch-step-link ${visible ? 'visible' : ''}`} style={{ transitionDelay: `${baseDelay + 110 + i * 60}ms` }} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

export default function EvidencePipeline() {
  const [ref, visible] = useArchVisible()

  return (
    <div className="lp-arch" ref={ref}>
      {/* SVG connection layer */}
      <svg className="lp-arch-svg" viewBox="0 0 1200 680" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <linearGradient id="lp-flow-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#9d4edd" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.6" />
          </linearGradient>
          <filter id="lp-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Source → Pipeline fan-in */}
        <g className={`lp-arch-paths ${visible ? 'visible' : ''}`}>
          {/* SAR → Detection */}
          <path d="M 95,72 C 95,130 200,130 200,168" className="lp-arch-path" style={{ animationDelay: '0ms' }} />
          <path d="M 530,72 C 530,130 600,130 600,168" className="lp-arch-path" style={{ animationDelay: '80ms' }} />
          <path d="M 680,72 C 680,130 600,130 600,168" className="lp-arch-path" style={{ animationDelay: '120ms' }} />
          <path d="M 830,72 C 830,130 600,130 600,168" className="lp-arch-path" style={{ animationDelay: '160ms' }} />
          {/* AIS → Attribution */}
          <path d="M 230,72 C 230,130 1000,130 1000,168" className="lp-arch-path" style={{ animationDelay: '200ms' }} />
          {/* Optical → Detection */}
          <path d="M 980,72 C 980,130 200,130 200,168" className="lp-arch-path lp-arch-path--dim" style={{ animationDelay: '240ms' }} />
          {/* ORB/Chemical → Fusion (cross-link) */}
          <path d="M 1080,72 C 1080,200 600,200 600,340" className="lp-arch-path lp-arch-path--dash" style={{ animationDelay: '400ms' }} />
          <path d="M 1180,72 C 1180,220 650,220 650,340" className="lp-arch-path lp-arch-path--dash" style={{ animationDelay: '440ms' }} />

          {/* Pipelines → Fusion hub */}
          <path d="M 200,310 C 200,340 400,340 400,368" className="lp-arch-path" style={{ animationDelay: '300ms' }} />
          <path d="M 600,330 C 600,355 600,355 600,368" className="lp-arch-path" style={{ animationDelay: '340ms' }} />
          <path d="M 1000,310 C 1000,340 800,340 800,368" className="lp-arch-path" style={{ animationDelay: '380ms' }} />

          {/* Fusion → Ladder */}
          <path d="M 400,420 C 400,450 200,450 200,478" className="lp-arch-path" style={{ animationDelay: '480ms' }} />
          <path d="M 600,420 L 600,478" className="lp-arch-path" style={{ animationDelay: '500ms' }} />
          <path d="M 800,420 C 800,450 1000,450 1000,478" className="lp-arch-path" style={{ animationDelay: '520ms' }} />

          {/* Ladder internal flow */}
          <path d="M 200,520 L 400,520" className="lp-arch-path lp-arch-path--ladder" style={{ animationDelay: '560ms' }} />
          <path d="M 400,520 L 600,520" className="lp-arch-path lp-arch-path--ladder" style={{ animationDelay: '580ms' }} />
          <path d="M 600,520 L 800,520" className="lp-arch-path lp-arch-path--ladder" style={{ animationDelay: '600ms' }} />
          <path d="M 800,520 L 1000,520" className="lp-arch-path lp-arch-path--ladder" style={{ animationDelay: '620ms' }} />

          {/* Ladder → Outputs */}
          <path d="M 600,560 C 600,590 200,590 200,618" className="lp-arch-path" style={{ animationDelay: '640ms' }} />
          <path d="M 600,560 L 600,618" className="lp-arch-path" style={{ animationDelay: '660ms' }} />
          <path d="M 600,560 C 600,590 1000,590 1000,618" className="lp-arch-path" style={{ animationDelay: '680ms' }} />

          {/* Cross-links between pipelines */}
          <path d="M 200,280 C 350,280 450,280 600,290" className="lp-arch-path lp-arch-path--cross" style={{ animationDelay: '720ms' }} />
          <path d="M 600,290 C 750,280 850,280 1000,280" className="lp-arch-path lp-arch-path--cross" style={{ animationDelay: '760ms' }} />
        </g>

        {/* Animated flow dots */}
        {visible && (
          <g className="lp-arch-flow-dots">
            <circle r="3" fill="#22d3ee" className="lp-arch-dot">
              <animateMotion dur="4s" repeatCount="indefinite" path="M 95,72 C 95,130 200,130 200,168 L 200,310 C 200,340 400,340 400,368 L 400,420 C 400,450 200,450 200,478" />
            </circle>
            <circle r="3" fill="#9d4edd" className="lp-arch-dot">
              <animateMotion dur="5s" repeatCount="indefinite" path="M 600,72 C 600,130 600,130 600,168 L 600,330 C 600,355 600,355 600,368 L 600,420 L 600,478 L 600,520 L 600,560 L 600,618" />
            </circle>
            <circle r="3" fill="#22c55e" className="lp-arch-dot">
              <animateMotion dur="4.5s" repeatCount="indefinite" path="M 230,72 C 230,130 1000,130 1000,168 L 1000,310 C 1000,340 800,340 800,368 L 800,420 C 800,450 1000,450 1000,478" />
            </circle>
          </g>
        )}
      </svg>

      {/* Layer 1: Data Ingestion */}
      <div className="lp-arch-row lp-arch-row--sources">
        <div className={`lp-arch-layer-tag ${visible ? 'visible' : ''}`}>01 · DATA INGESTION</div>
        <div className="lp-arch-source-grid">
          {LAYERS[0].nodes.map((node, i) => (
            <ArchNode
              key={node.id}
              label={node.label}
              sub={node.sub}
              visible={visible}
              delay={i * 40}
              small
            />
          ))}
        </div>
      </div>

      {/* Layer 2: Analytical Engines */}
      <div className="lp-arch-row lp-arch-row--engines">
        <div className={`lp-arch-layer-tag ${visible ? 'visible' : ''}`} style={{ transitionDelay: '200ms' }}>
          02 · ANALYTICAL ENGINES
        </div>
        <div className="lp-arch-pipeline-grid">
          {PIPELINES.map((pipe, i) => (
            <PipelineBox key={pipe.id} pipeline={pipe} visible={visible} baseDelay={280 + i * 100} />
          ))}
        </div>
      </div>

      {/* Layer 3: Fusion Hub */}
      <div className="lp-arch-row lp-arch-row--fusion">
        <div className={`lp-arch-layer-tag ${visible ? 'visible' : ''}`} style={{ transitionDelay: '500ms' }}>
          03 · EVIDENCE FUSION
        </div>
        <div className="lp-arch-fusion-grid">
          {FUSION.map((node, i) => (
            <ArchNode
              key={node.id}
              label={node.label}
              visible={visible}
              delay={560 + i * 60}
              className="lp-arch-fusion-node"
            />
          ))}
        </div>
      </div>

      {/* Layer 4: Evidentiary Ladder */}
      <div className="lp-arch-row lp-arch-row--ladder">
        <div className={`lp-arch-layer-tag ${visible ? 'visible' : ''}`} style={{ transitionDelay: '650ms' }}>
          04 · EVIDENTIARY LADDER
        </div>
        <div className="lp-arch-ladder-grid">
          {LADDER.map((step, i) => (
            <div
              key={step.id}
              className={`lp-arch-ladder-step ${visible ? 'visible' : ''}`}
              style={{ transitionDelay: `${700 + i * 70}ms` }}
            >
              <span className="lp-arch-ladder-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="lp-arch-ladder-label">{step.label}</span>
              <span className="lp-arch-ladder-desc">{step.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Layer 5: Outputs */}
      <div className="lp-arch-row lp-arch-row--outputs">
        <div className={`lp-arch-layer-tag ${visible ? 'visible' : ''}`} style={{ transitionDelay: '900ms' }}>
          05 · CASE OUTPUT
        </div>
        <div className="lp-arch-output-grid">
          {OUTPUTS.map((out, i) => (
            <ArchNode
              key={out.id}
              label={out.label}
              sub={out.sub}
              visible={visible}
              delay={960 + i * 60}
              className="lp-arch-output-node"
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className={`lp-arch-legend ${visible ? 'visible' : ''}`} style={{ transitionDelay: '1100ms' }}>
        <span><i className="solid" /> Primary data flow</span>
        <span><i className="cross" /> Cross-pipeline correlation</span>
        <span><i className="dash" /> Corroborating inputs</span>
      </div>
    </div>
  )
}
