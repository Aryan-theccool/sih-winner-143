import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import EvidencePipeline from './EvidencePipeline'
import './landing.css'

const ASSETS = {
  heroVideo: '/landing/hero-video.mp4',
  scene1: '/landing/scene-1.jpg',
  scene2: '/landing/scene-2.gif',
  scene3card1: '/landing/scene3-card1.jpg',
  scene3card2: '/landing/scene3-card2.jpg',
  scene3card4: '/landing/scene3-card4.jpg',
  scene4: '/landing/scene-4.jpg',
  sceneAlt: '/landing/scene-alt.jpg',
}

const NAV_LINKS = [
  { label: 'Platform', href: '#platform' },
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'Intelligence', href: '#intelligence' },
  { label: 'Evidence', href: '#evidence' },
  { label: 'Technology', href: '#technology' },
  { label: 'About', href: '#about' },
]

const PROCESS_STEPS = [
  { num: '01', name: 'DETECT', desc: 'Satellite SAR identifies possible oil-slick signatures.', img: ASSETS.scene3card1 },
  { num: '02', name: 'CHARACTERISE', desc: 'Analyse morphology, area, environmental conditions and persistence.', img: ASSETS.scene3card2 },
  { num: '03', name: 'RECONSTRUCT', desc: 'Propagate the slick backward through ocean and atmospheric conditions.', img: ASSETS.sceneAlt },
  { num: '04', name: 'ATTRIBUTE', desc: 'Cross-reference the probable origin with historical AIS vessel tracks.', img: ASSETS.scene2 },
  { num: '05', name: 'EVIDENCE', desc: 'Combine satellite, vessel, environmental and corroborating evidence into an auditable case.', img: ASSETS.scene3card4 },
]

const CAPABILITIES = [
  { title: 'SATELLITE OIL-SPILL DETECTION', desc: 'Detect potential slicks from SAR observations.' },
  { title: 'OIL FLOW MODELLING', desc: 'Model transport using ocean currents, wind and waves.' },
  { title: 'SPILL AGE ESTIMATION', desc: 'Estimate the probable age and release window of a detected slick.' },
  { title: 'ORIGIN RECONSTRUCTION', desc: 'Run backward drift ensembles to estimate the probable release region.' },
  { title: 'AIS VESSEL REPLAY', desc: 'Reconstruct historical vessel positions around the release window.' },
  { title: 'VESSEL ATTRIBUTION', desc: 'Rank candidate vessels using spatial, temporal and trajectory compatibility.' },
  { title: 'AIS ANOMALY DETECTION', desc: 'Identify SAR contacts that cannot be reconciled with available AIS data.' },
  { title: 'EVIDENCE MANAGEMENT', desc: 'Preserve imagery, coordinates, tracks, model outputs and provenance.' },
  { title: 'REGULATORY MAPPING', desc: 'Map available evidence to relevant maritime regulations and identify missing evidence.' },
  { title: 'CASE DOSSIER GENERATION', desc: 'Automatically create a structured evidence report.' },
]

const SOURCES = [
  'SENTINEL-1 SAR', 'AIS', 'OCEAN CURRENTS', 'WIND', 'WAVES',
  'SATELLITE IMAGERY', 'VESSEL TRACKS', 'OIL RECORD BOOK', 'CHEMICAL EVIDENCE',
]

const SCIENTIFIC_LEVELS = [
  { name: 'OBSERVED', desc: 'What sensors directly measured.' },
  { name: 'INFERRED', desc: 'What the models estimate.' },
  { name: 'PROBABLE', desc: 'What the evidence-weighted model considers most likely.' },
  { name: 'CORROBORATED', desc: 'What independent evidence supports.' },
]

const AUTHORITIES = [
  'Indian Coast Guard', 'Environmental Authorities', 'Port Authorities', 'Maritime Security',
  'Pollution Response Teams', 'Shipping Regulators', 'Research Institutions',
]

const HERO_PHASES = ['PLANETARY VIEW', 'INDIAN OCEAN', 'ARABIAN SEA', 'DETECTED OIL SLICK']

function useInView(threshold = 0.15) {
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

function useCounter(target, active, duration = 1800) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!active) return undefined
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - p) ** 3
      setValue(Math.round(target * eased))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, active, duration])
  return value
}

function Reveal({ children, className = '', delay = 0 }) {
  const [ref, visible] = useInView()
  return (
    <div
      ref={ref}
      className={`lp-reveal ${visible ? 'visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

export default function LandingPage() {
  const [navScrolled, setNavScrolled] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [heroProgress, setHeroProgress] = useState(0)
  const [heroPhase, setHeroPhase] = useState(0)
  const heroWrapRef = useRef(null)
  const [statsRef, statsVisible] = useInView(0.3)
  const [sourcesRef, sourcesVisible] = useInView(0.2)

  const vessels = useCounter(1284, statsVisible)
  const anomalies = useCounter(3, statsVisible)
  const cases = useCounter(7, statsVisible)
  const packages = useCounter(24, statsVisible)

  useEffect(() => {
    document.body.classList.add('landing-active')
    return () => document.body.classList.remove('landing-active')
  }, [])

  const onScroll = useCallback(() => {
    setNavScrolled(window.scrollY > 40)

    const wrap = heroWrapRef.current
    if (wrap) {
      const rect = wrap.getBoundingClientRect()
      const total = wrap.offsetHeight - window.innerHeight
      const scrolled = Math.max(0, -rect.top)
      const progress = total > 0 ? Math.min(scrolled / total, 1) : 0
      setHeroProgress(progress)
      setHeroPhase(Math.min(Math.floor(progress * 4), 3))
    }
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [onScroll])

  const heroScale = 1 + heroProgress * 0.35

  return (
    <div className="lp-page">
      {/* ── NAVIGATION ── */}
      <nav className={`lp-nav ${navScrolled ? 'scrolled' : ''}`}>
        <Link to="/" className="lp-nav-logo">SAGAR<span>-NET</span></Link>
        <ul className={`lp-nav-links ${navOpen ? 'open' : ''}`}>
          {NAV_LINKS.map((l) => (
            <li key={l.href}><a href={l.href} onClick={() => setNavOpen(false)}>{l.label}</a></li>
          ))}
        </ul>
        <div className="lp-nav-actions">
          <a href="#login" className="lp-nav-login">Login</a>
          <Link to="/dashboard" className="lp-btn lp-btn-primary">Open SAGAR-NET</Link>
          <button type="button" className="lp-nav-toggle" aria-label="Menu" onClick={() => setNavOpen((o) => !o)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div className="lp-hero-wrap" ref={heroWrapRef} id="platform">
        <div className="lp-hero-sticky">
          <div className="lp-hero-media" style={{ transform: `scale(${heroScale})` }}>
            <video autoPlay muted loop playsInline poster={ASSETS.scene1}>
              <source src={ASSETS.heroVideo} type="video/mp4" />
            </video>
          </div>
          <div className="lp-hero-overlay" />
          {HERO_PHASES.map((phase, i) => (
            <div key={phase} className={`lp-hero-phase ${heroPhase === i ? 'visible' : ''}`}>
              {phase}
            </div>
          ))}
          <div className="lp-hero-content">
            <p className="lp-hero-eyebrow">FROM SPACE TO EVIDENCE.</p>
            <h1 className="lp-hero-title lp-display">SAGAR-NET</h1>
            <p className="lp-hero-tagline">MARITIME INTELLIGENCE FROM SPACE</p>
            <div className="lp-hero-desc">
              <p>Detect marine oil spills.</p>
              <p>Reconstruct their origin.</p>
              <p>Trace vessel activity.</p>
              <p>Build evidence for action.</p>
            </div>
            <div className="lp-hero-actions">
              <Link to="/dashboard" className="lp-btn lp-btn-primary">Open SAGAR-NET</Link>
              <a href="#capabilities" className="lp-btn lp-btn-outline">Explore the Platform</a>
            </div>
          </div>
          <div className="lp-scroll-indicator">
            <span>SCROLL</span>
            <div className="lp-scroll-line" />
          </div>
        </div>
      </div>

      {/* ── SECTION 2: SEE THE OCEAN ── */}
      <section className="lp-section lp-section-dark lp-section-after-hero lp-section-visual" id="technology">
        <Reveal>
          <p className="lp-section-label">SATELLITE OBSERVATION</p>
          <h2 className="lp-section-title lp-display">SEE THE OCEAN DIFFERENTLY</h2>
          <p className="lp-section-text">
            SAGAR-NET combines satellite observation, ocean modelling, vessel tracking and explainable AI
            to transform a detected marine anomaly into a traceable investigation.
          </p>
        </Reveal>
        <Reveal>
          <div className="lp-ocean-visual">
            <img src={ASSETS.scene1} alt="Satellite view of Indian Ocean coastline" loading="lazy" />
            <div className="lp-ocean-labels">
              <span className="lp-ocean-label">SENTINEL-1</span>
              <span className="lp-ocean-label">SAR</span>
              <span className="lp-ocean-label">INDIAN EEZ</span>
              <span className="lp-ocean-label">06:30 UTC</span>
              <span className="lp-ocean-label">9.05° N · 75.63° E</span>
              <span className="lp-ocean-label">ACQUISITION PASS</span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── SECTION 3: PROCESS ── */}
      <section className="lp-section lp-section-navy lp-section-compact" id="capabilities">
        <Reveal>
          <p className="lp-section-label">INVESTIGATION PIPELINE</p>
          <h2 className="lp-section-title lp-display">FROM DETECTION TO ATTRIBUTION</h2>
        </Reveal>
        <div className="lp-process">
          {PROCESS_STEPS.map((step) => (
            <div key={step.num} className="lp-process-card">
              <div className="lp-process-card-bg">
                <img src={step.img} alt="" loading="lazy" />
              </div>
              <div className="lp-process-card-overlay" />
              <span className="lp-process-num">{step.num}</span>
              <h3 className="lp-process-name">{step.name}</h3>
              <p className="lp-process-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 4: MAP ── */}
      <section className="lp-map-section" id="intelligence" ref={statsRef}>
        <div className="lp-map-visual">
          <img src={ASSETS.scene4} alt="Arabian Sea maritime intelligence map" loading="lazy" />
          <div className="lp-map-overlay">
            <div className="lp-map-panel">
              <Reveal>
                <h2 className="lp-section-title lp-display" style={{ fontSize: 'clamp(24px, 3vw, 36px)', marginBottom: 8 }}>
                  A COMPLETE VIEW OF THE MARITIME DOMAIN
                </h2>
              </Reveal>
              <h3>LIVE MARITIME INTELLIGENCE</h3>
              <div className="lp-stat-grid">
                <div className="lp-stat-item">
                  <div className="lp-stat-value">{vessels.toLocaleString()}</div>
                  <div className="lp-stat-label">VESSELS TRACKED</div>
                </div>
                <div className="lp-stat-item">
                  <div className="lp-stat-value">{String(anomalies).padStart(2, '0')}</div>
                  <div className="lp-stat-label">ACTIVE ANOMALIES</div>
                </div>
                <div className="lp-stat-item">
                  <div className="lp-stat-value">{String(cases).padStart(2, '0')}</div>
                  <div className="lp-stat-label">HIGH-PRIORITY CASES</div>
                </div>
                <div className="lp-stat-item">
                  <div className="lp-stat-value">{String(packages).padStart(2, '0')}</div>
                  <div className="lp-stat-label">EVIDENCE PACKAGES</div>
                </div>
              </div>
              <Link to="/dashboard" className="lp-btn lp-btn-primary">Enter the Live Platform →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: ORIGIN ── */}
      <section className="lp-section lp-section-dark">
        <Reveal>
          <p className="lp-section-label">ORIGIN RECONSTRUCTION</p>
          <h2 className="lp-section-title lp-display">UNDERSTAND WHERE THE SPILL BEGAN</h2>
          <p className="lp-section-text">
            We do not simply detect where the oil is. We reconstruct where it most probably began.
          </p>
        </Reveal>
        <div className="lp-origin-grid">
          <div className="lp-origin-visual">
            <img src={ASSETS.scene3card1} alt="Oil slick backward drift reconstruction" loading="lazy" />
            <div className="lp-origin-particles">
              {Array.from({ length: 12 }, (_, i) => (
                <div
                  key={i}
                  className="lp-origin-particle"
                  style={{
                    left: `${20 + (i * 6) % 60}%`,
                    bottom: `${15 + (i * 8) % 40}%`,
                    animationDelay: `${i * 0.25}s`,
                  }}
                />
              ))}
            </div>
          </div>
          <div>
            <div className="lp-origin-flow">
              {['CURRENT SLICK', 'BACKWARD DRIFT', 'PROBABLE ORIGIN', 'RELEASE WINDOW'].map((label, i, arr) => (
                <React.Fragment key={label}>
                  <div className="lp-origin-step">
                    <span className="lp-origin-step-label">{label}</span>
                  </div>
                  {i < arr.length - 1 && <div className="lp-origin-arrow">↓</div>}
                </React.Fragment>
              ))}
            </div>
            <div className="lp-origin-metrics">
              <div className="lp-origin-metric-row">
                <span>PROBABLE RELEASE</span>
                <span>11 JUN 2025 · 08:30–16:30 UTC</span>
              </div>
              <div className="lp-origin-metric-row">
                <span>ORIGIN PROBABILITY</span>
                <span>84%</span>
              </div>
              <div className="lp-origin-metric-row">
                <span>CREDIBLE REGION</span>
                <span>42 km²</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: VESSELS ── */}
      <section className="lp-vessel-section">
        <div className="lp-vessel-visual">
          <img src={ASSETS.scene2} alt="Maritime vessel tracking visualization" loading="lazy" />
          <div className="lp-vessel-overlay" />
          <div className="lp-vessel-header">
            <Reveal>
              <p className="lp-section-label">VESSEL ATTRIBUTION</p>
              <h2 className="lp-section-title lp-display">FOLLOW THE VESSELS</h2>
            </Reveal>
          </div>
          <div className="lp-vessel-card">
            <div className="lp-vessel-card-header">CANDIDATE #1</div>
            <div className="lp-vessel-name">MT EXAMPLE</div>
            <div className="lp-vessel-type">CRUDE OIL TANKER</div>
            <div className="lp-vessel-metrics">
              {[
                ['ATTRIBUTION', '84%'],
                ['ORIGIN OVERLAP', '91%'],
                ['TIME COMPATIBILITY', '88%'],
                ['TRACK CONSISTENCY', '84%'],
              ].map(([k, v]) => (
                <div key={k} className="lp-vessel-metric">
                  <span>{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
            <Link to="/dashboard" className="lp-vessel-link">WHY THIS VESSEL →</Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 7: EVIDENCE PIPELINE ── */}
      <section className="lp-section lp-section-navy lp-section--arch" id="evidence">
        <Reveal>
          <p className="lp-section-label">EVIDENCE PIPELINE</p>
          <h2 className="lp-section-title lp-display">FROM SIGNAL TO EVIDENCE</h2>
          <p className="lp-section-text">
            A multi-layer intelligence architecture — parallel analytical engines, cross-pipeline
            correlation, and an evidentiary ladder from raw sensor data to audit-ready case output.
          </p>
        </Reveal>
        <EvidencePipeline />
      </section>

      {/* ── SECTION 8: CAPABILITIES ── */}
      <section className="lp-section lp-section-dark">
        <Reveal>
          <p className="lp-section-label">PLATFORM CAPABILITIES</p>
          <h2 className="lp-section-title lp-display">BUILT FOR REAL-WORLD MARITIME OPERATIONS</h2>
        </Reveal>
        <div className="lp-cap-grid">
          {CAPABILITIES.map((cap) => (
            <div key={cap.title} className="lp-cap-card">
              <h3 className="lp-cap-title">{cap.title}</h3>
              <p className="lp-cap-desc">{cap.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 9: MULTI-SOURCE ── */}
      <section className="lp-section lp-section-black" ref={sourcesRef}>
        <Reveal>
          <p className="lp-section-label">MULTI-SOURCE FUSION</p>
          <h2 className="lp-section-title lp-display">ONE INCIDENT. MULTIPLE SOURCES OF TRUTH.</h2>
        </Reveal>
        <div className="lp-sources-wrap">
          <div className="lp-sources-list">
            {SOURCES.map((src, i) => (
              <span
                key={src}
                className={`lp-source-tag ${sourcesVisible ? 'visible' : ''}`}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                {src}
              </span>
            ))}
          </div>
          <div className="lp-correlated-box">
            <h4>CORRELATED EVIDENCE</h4>
            <p>
              SAGAR-NET does not depend on one AI model or one data source.
              Independent observations converge into a single auditable intelligence picture.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 10: SCIENTIFIC LEVELS ── */}
      <section className="lp-section lp-section-navy">
        <Reveal>
          <p className="lp-section-label">EVIDENTIARY FRAMEWORK</p>
          <h2 className="lp-section-title lp-display">SCIENTIFICALLY CAUTIOUS. OPERATIONALLY USEFUL.</h2>
        </Reveal>
        <div className="lp-levels">
          {SCIENTIFIC_LEVELS.map((level) => (
            <div key={level.name} className="lp-level-card">
              <h3 className="lp-level-name">{level.name}</h3>
              <p className="lp-level-desc">{level.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 11: DOSSIER ── */}
      <section className="lp-section lp-section-dark">
        <Reveal>
          <p className="lp-section-label">CASE MANAGEMENT</p>
          <h2 className="lp-section-title lp-display">BUILT FOR EVIDENCE</h2>
        </Reveal>
        <div className="lp-dossier-wrap">
          <div className="lp-dossier">
            <div className="lp-dossier-brand">SAGAR-NET</div>
            <div className="lp-dossier-type">MARINE OIL-SPILL ATTRIBUTION CASE FILE</div>
            {[
              ['CASE ID', 'KERALA_2025_CASE01'],
              ['DETECTION', '12 JUN 2025 · 06:30 UTC'],
              ['COORDINATES', '09.0537° N · 75.6345° E'],
              ['SLICK AREA', '11.0 km²'],
              ['ESTIMATED AGE', '28–42 HOURS'],
              ['PROBABLE RELEASE', '11 JUN · 08:30–16:30 UTC'],
              ['ORIGIN PROBABILITY', '84%'],
              ['TOP CANDIDATE', 'MT EXAMPLE'],
              ['ATTRIBUTION', '84%'],
              ['REGULATORY RELEVANCE', 'UNCLOS / MARPOL'],
              ['EVIDENCE INTEGRITY', 'SHA-256 VERIFIED'],
            ].map(([k, v]) => (
              <div key={k} className="lp-dossier-row">
                <span>{k}</span>
                <span>{v}</span>
              </div>
            ))}
            <div className="lp-dossier-cta">
              <Link to="/dashboard" className="lp-btn lp-btn-primary">Generate Case Dossier →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 12: AUTHORITIES ── */}
      <section className="lp-section lp-section-black" id="about">
        <Reveal>
          <p className="lp-section-label">STAKEHOLDERS</p>
          <h2 className="lp-section-title lp-display">DESIGNED FOR MARITIME AUTHORITIES</h2>
        </Reveal>
        <div className="lp-authority-grid">
          {AUTHORITIES.map((name) => (
            <div key={name} className="lp-authority-card">
              <div className="lp-authority-label">DESIGNED FOR</div>
              <div className="lp-authority-name">{name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 13: FINAL CTA ── */}
      <section className="lp-final-cta">
        <div className="lp-final-cta-bg">
          <img src={ASSETS.sceneAlt} alt="Satellite ocean imagery" loading="lazy" />
        </div>
        <div className="lp-final-cta-overlay" />
        <div className="lp-final-cta-content">
          <h2 className="lp-display">THE OCEAN LEAVES A TRACE.</h2>
          <p>SAGAR-NET HELPS YOU FOLLOW IT.</p>
          <div className="lp-final-cta-actions">
            <Link to="/dashboard" className="lp-btn lp-btn-primary">Open SAGAR-NET</Link>
            <a href="#technology" className="lp-btn lp-btn-ghost">Explore the Technology</a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-top">
          <div>
            <div className="lp-footer-brand">SAGAR-NET</div>
            <p className="lp-footer-tagline">
              Satellite-based Marine Oil Spill Detection, Origin Reconstruction &amp; Vessel Attribution
            </p>
          </div>
          <div className="lp-footer-col">
            <h4>NAVIGATION</h4>
            <ul>
              {['Platform', 'Capabilities', 'Technology', 'Evidence', 'About', 'Contact'].map((l) => (
                <li key={l}><a href={`#${l.toLowerCase()}`}>{l}</a></li>
              ))}
            </ul>
          </div>
          <div className="lp-footer-col">
            <h4>LEGAL</h4>
            <ul>
              <li><a href="#privacy">Privacy</a></li>
              <li><a href="#terms">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span>© 2026 SAGAR-NET</span>
          <span className="lp-mono" style={{ fontSize: 10, letterSpacing: '0.1em' }}>FROM SPACE TO EVIDENCE.</span>
        </div>
      </footer>
    </div>
  )
}
