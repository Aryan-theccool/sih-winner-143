# OriginTrace — Changes & Improvements

**Branch:** `feature/intelligence-dashboard-ui`  
**Date:** September 2025  
**Project:** SIH-26143 (PS 26143) — Oil Spill Detection & Vessel Attribution

---

## Executive Summary

This release transforms OriginTrace from a functional pipeline demo into a **judge-ready intelligence dashboard**. The UI now follows a unified map shell with multi-panel navigation, a guided case story flow, and court-aware evidence framing — directly aligned with the SIH26143 Product Requirements Document.

---

## 1. Frontend — Intelligence Dashboard Overhaul

### 1.1 New Navigation Architecture

| Before | After |
|--------|-------|
| Single `SidePanel` with tabs | **Left rail** navigation (Map, Detection, Origin, Vessels, Evidence, Report) |
| Flat tab switching | **Intelligence sidebar** with context-aware panels |
| No status context | **Top status bar** with live case metrics |

**New components:**
- `LeftRail.jsx` — Primary navigation with dossier export shortcut
- `TopStatusBar.jsx` — Case ID, sync status, playback controls
- `IntelligenceSidebar.jsx` — Tabbed intelligence panels docked to the map
- `PanelRouter.jsx` — Routes views to the correct panel content

### 1.2 Guided Case Story Flow

A new **CaseStoryFlow** component walks judges through the attribution narrative in six steps:

1. **CASE** — Which incident?
2. **WHAT HAPPENED?** — SAR detection confidence
3. **WHEN DID IT START?** — Estimated spill age range
4. **WHERE DID IT START?** — Probable origin cloud
5. **WHO WAS THERE?** — AIS vessel replay
6. **WHICH VESSEL FITS?** — Top-ranked suspect

Each step is clickable and navigates to the relevant map/panel view — making the core innovation (probabilistic backward attribution) legible within seconds.

### 1.3 Specialised Intelligence Panels

| Panel | Purpose |
|-------|---------|
| `DetectionPanel` | SAR scene metadata, wind gate, BAOAC volume bands, detectability mask |
| `OriginPanel` | Backward drift ensemble stats, KDE contour readout, release window |
| `VesselsPanel` | Top-3 ranked suspects with SHAP feature breakdown |
| `EvidencePanel` | UNCLOS-tiered evidence ladder, export controls |
| `CaseReportPanel` | Full case dossier summary |

### 1.4 Vessel Radar & Dark-Vessel Rendering

- **Animated ship icons** with heading rotation via `TripsLayer` + custom `IconLayer`
- **Dark-vessel ghost trails** — dotted interpolated paths through AIS gaps (>30 min)
- **Pulsing suspect rings** on top-3 ranked vessels
- **VesselIntelCard** — click/hover info: name, MMSI, type, speed, course, rank score
- **Layer toggles** for SAR, oil polygons, tracks, flow, current, wind, waves, ships, backtrack, gaps, mask

### 1.5 Map Enhancements

- **Backward drift animation mode** — time runs in reverse while origin cloud expands
- **Origin mode / Flow mode** — dedicated visual states for backtrack vs forward forecast
- **MapChrome** overlay — layer control, radar sweep cosmetic, focus controls
- **Enhanced `layers.js`** — refactored deck.gl layer stack with improved styling and z-ordering

### 1.6 Evidence & Legal Framing

- **EvidentiaryLadder** — Three-tier UNCLOS compliance display (Tip-and-cue → Verification → Boarding request)
- **EvidenceGraph** — Visual chain-of-custody from detection to export
- **RegulatoryPanel** — Art. 220(3)/(6) framing with honest uncertainty labels
- **DossierModal** — One-click evidence package generation trigger

### 1.7 Utility Modules

| File | Purpose |
|------|---------|
| `utils/caseAnalytics.js` | Derived metrics: slick characterisation, case assessment scores, ensemble stats |
| `utils/terminology.js` | Scientific/legal label mappings, evidence tiers, attribution status |
| `utils/glossary.js` | Plain-English definitions for every acronym shown in the UI (hover-to-learn strip + guide) |
| `utils/stepGuide.js` | One question, one plain-language summary and a next-step pointer per sidebar tab |
| `utils/mapModes.js` | Map presets plus the sentence explaining what each mode is showing |
| `utils/shipIcon.js` | Vessel type → icon mapping for map markers |
| `utils/vesselMotion.js` | Position interpolation and heading calculation |

### 1.8 Dashboard brought onto the landing page's design system

The marketing page and the investigation view had drifted apart: the landing page
ran on the `#030508 → #0a1018` surface ramp, cyan accents and Syne display type,
while the dashboard kept an older green-on-`#0A0D12` theme with ~250 class names that
had no stylesheet rule at all (unstyled candidate cards, evidence chain, regulatory
blocks, dossier modal). `styles.css` was rewritten end to end:

- **One design language** — landing tokens (`--lp-*`) are consumed directly with
  identical fallbacks, so surfaces, cyan accent, 2 px radii, 14 px blur glass and the
  Syne / Inter / IBM Plex Mono type ramp now match shot-for-shot.
- **One question per screen** — the sidebar header states `STEP 0n / 05`, the question
  it answers and the evidence tier reached; a `NEXT · STEP 0n+1` pointer closes each panel.
- **No unexplained jargon** — SAR, look-alike, hindcast, credible region, CPA, ORB,
  UNCLOS Art. 220(3), SHA-256 … are dotted-inline terms whose plain-English definition
  appears in a strip pinned to the sidebar footer, plus a four-tab Reading Guide
  (`?`) covering pipeline, map colours, confidence labels and limits.
- **Honest data framing** — normalised model scores are labelled "model fit · 0–100",
  release-window bars are computed from real timestamps instead of hard-coded offsets,
  excluded vessels are shown as *ruled out*, and blind spots are labelled
  "not assessable", never "clean".
- **Real states** — boot screen, keyboard navigation (0–5 / space / ←→ / G / ?),
  toasts instead of `alert()`, an actionable "API not reachable" screen, and
  responsive rules down to phone width (the map + panel stack, the rail goes horizontal).
- `frontend/scripts/ssr-preview.mjs` renders every panel against the live API and fails
  if any rendered class has no CSS rule — the regression that broke the dashboard before.

---

## 2. Backend Improvements

### 2.1 Vessel API Enrichment (`backend/main.py`)

The `/api/vessels` endpoint now returns:

- **Speed over ground (SOG)** and **course over ground (COG)** per track point
- **AIS gap metadata** from vessel manifest (`ais_gaps` array)
- Extended path format: `[lon, lat, timestamp, sog, cog]`

This enables the frontend to render vessel heading, speed readouts, and dark-vessel gap visualisation without additional API calls.

### 2.2 Evidence PDF — BSA 2023 §63 Section (`evidence/make_pdf.py`)

Added a new section to the evidence PDF:

> **5 · Electronic Evidence — Bharatiya Sakshya Adhiniyam 2023 §63**

Documents the SHA-256 hash chain, generation timestamps, and processing chain for electronic evidence admissibility under Indian law. Includes explicit note that this demo supplies the certificate *template* and hash chain only.

---

## 3. Data & Metadata

- Updated `casefiles/KERALA_2025_CASE01/inputs/sar/metadata.json` with additional scene metadata fields

---

## 4. Documentation

- Added **`SIH26143 PRD.md`** — Full Product Requirements Document covering:
  - Problem statement and competitive landscape
  - Feature requirements F1–F5 (Detection, Backward Attribution, Vessel Radar, Ranking, Evidence Export)
  - Frontend architecture decision (unified map shell)
  - Team ownership (RACI), timeline, and risk mitigations

---

## 5. Architecture Decisions

### Unified Map Shell (per PRD Section 7)

All spatial features (SAR, detection, origin cloud, vessel radar) share **one deck.gl canvas** with a layer-toggle panel. This:

- Reduces frontend complexity (one map instance, one camera)
- Produces a stronger demo — judges see detection, backtrack, and traffic converge in the same view
- Keeps F4 (ranking) and F5 (export) as a docked side panel

### Honest Uncertainty Throughout

Every number is ranged or labeled "indicative":
- Detectability mask gates slick claims by wind speed
- BAOAC volume shown as a band, never a single number
- UNCLOS tier badge explicitly states what the system does *not* prove
- Evidentiary ladder frames output as "intelligence & recommendations — not automatic legal findings"

---

## 6. Files Changed

### Modified (11 files)
```
backend/main.py                          +5 lines (SOG/COG/ais_gaps)
casefiles/.../sar/metadata.json          +2 fields
evidence/make_pdf.py                       +8 lines (BSA §63 section)
frontend/index.html                      +2 lines
frontend/src/App.jsx                     major restructure (~220 lines changed)
frontend/src/api.js                      SOG/COG support in prepVessels
frontend/src/components/SidePanel.jsx    enhanced (retained, refactored)
frontend/src/components/TimeBar.jsx      backward mode, improved controls
frontend/src/map/MapView.jsx             new props, layer integration
frontend/src/map/layers.js               refactored layer stack
frontend/src/styles.css                  complete visual redesign
```

### Added (26 new component/utility files)
```
SIH26143 PRD.md
frontend/src/components/CaseAssessment.jsx
frontend/src/components/CaseStoryFlow.jsx
frontend/src/components/DossierModal.jsx
frontend/src/components/EvidenceGraph.jsx
frontend/src/components/EvidentiaryLadder.jsx
frontend/src/components/Header.jsx
frontend/src/components/IntelligenceSidebar.jsx
frontend/src/components/LayerControl.jsx
frontend/src/components/LeftRail.jsx
frontend/src/components/MapChrome.jsx
frontend/src/components/NavHeader.jsx
frontend/src/components/OverviewScreen.jsx
frontend/src/components/PanelRouter.jsx
frontend/src/components/RegulatoryPanel.jsx
frontend/src/components/SatelliteCards.jsx
frontend/src/components/SlickIntelCard.jsx
frontend/src/components/TopStatusBar.jsx
frontend/src/components/VesselIntelCard.jsx
frontend/src/components/WorkflowStrip.jsx
frontend/src/components/panels/DetectionPanel.jsx
frontend/src/components/panels/OriginPanel.jsx
frontend/src/components/panels/VesselsPanel.jsx
frontend/src/components/panels/EvidencePanel.jsx
frontend/src/components/panels/CaseReportPanel.jsx
frontend/src/utils/caseAnalytics.js
frontend/src/utils/terminology.js
frontend/src/utils/shipIcon.js
frontend/src/utils/vesselMotion.js
```

---

## 7. How to Test

```bash
# Start backend
uvicorn backend.main:app --host 0.0.0.0 --port 8000

# Build frontend (if not already built)
cd frontend && npm install && npm run build && cd ..

# Open http://localhost:8000
```

**Demo walkthrough** (the dashboard is the same five beats as the landing page):
1. Land on **00 Overview** — four numbers, the five steps, and the map-mode explainer
2. **01 Detection** — oil probability, size, age band, and what the radar could not see
3. **02 Origin** — scrub the backward hindcast (T−0 h → T−24 h) and read the p10/p50/p90 cloud
4. **03 Vessels** — top-3 candidates with per-factor bars, SHAP explanation and AIS-gap anomaly
5. **04 Evidence** — checklist, clickable provenance chain, what is still missing, regulatory floor
6. **05 Report** — generate and download the hash-verified dossier

---

## 8. What's Next

- [ ] Rehearse full demo flow 3× with offline fallback
- [ ] Fine-tune backward drift animation timing for 60–90 second judge window
- [ ] Add radar-sweep cosmetic overlay (CSS conic-gradient)
- [ ] Performance profiling under 20-vessel load at 60× speed
