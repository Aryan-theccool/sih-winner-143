# Product Requirements Document
## Satellite Oil Spill Detection & Vessel Attribution System
**Smart India Hackathon 2026 — Problem Statement 26143 (NTRO)**

| | |
|---|---|
| **Status** | Draft v1 |
| **Team size** | 6 |
| **Build window** | 7 days |
| **Demo format** | Staged (pre-computed data, live UI) |
| **Author** | Team (compiled from research dossier `SIH26143_Oil_Spill_Attribution_Research_Dossier.md`) |

---

## 1. Problem Statement

Illegal operational discharge (bilge/sludge dumping) along Indian shipping lanes goes largely undetected and unattributed. Existing systems solve pieces of this:

- **Cerulean (SkyTruth)** and **EMSA CleanSeaNet** detect slicks from SAR and geometrically match them to nearby AIS traffic — but only look at *where ships are now*, within ~8 hours of the image.
- **INCOIS OOSA** runs forward oil-drift forecasts for spill response — but requires manual input, has no detection front-end, and never runs backward.
- **No system, anywhere, does probabilistic backward attribution**: given a slick of unknown age, work out *where and when it started*, and use that space-time origin — not current proximity — to rank which vessel is responsible.

That gap is this project.

---

## 2. Goals

**Hackathon goals (this week):**
1. Demonstrate detection → backward attribution → ranked suspects → evidence export as one coherent, visually compelling pipeline on real or realistic data.
2. Make the core novelty (probabilistic space-time backtracking) immediately legible to non-technical judges within seconds of seeing it.
3. Ground every claim honestly — no invented accuracy numbers, explicit uncertainty everywhere, correct legal framing (tip-and-cue, not detention-grade evidence).

**Product goals (if taken further):**
- Plug into INCOIS OOSA as the missing detection + attribution front/back end.
- Produce evidence packages usable in the UNCLOS Art. 220 enforcement ladder and PSC boarding workflow.

## 3. Non-Goals (explicit scope cuts for this week)
- No real-time production ingestion pipeline — one pre-selected scene is enough.
- No forward spill-response forecasting (that's OOSA's job already).
- No live, authenticated Indian AIS feed (NAIS/IMAC are closed) — aisstream.io + synthetic fixture only.
- No claim of detention-grade legal evidence — system output is explicitly a *tip*, not a verdict.
- No mobile app — desktop web demo only.

---

## 4. Users / Audience

| User | What they need from the demo |
|---|---|
| SIH judges (primary) | A clear "before this didn't exist, now it does" moment within 60–90 seconds |
| ICG / DG Shipping (framed persona) | Evidence they could plausibly act on — tiered by legal confidence |
| Future deployment (INCOIS) | Visible integration points with OOSA |

---

## 5. Competitive Landscape (from research)

| System | Detects | Matches to AIS | Backward attribution | Legal packaging |
|---|---|---|---|---|
| Cerulean (SkyTruth) | ✅ SAR, open-source | ✅ proximity/parity/temporality | ❌ | ❌ |
| EMSA CleanSeaNet | ✅ SAR, human-assisted | ✅ manual | ❌ | Partial (EU only) |
| INCOIS OOSA | ❌ | ❌ | Forward only, manual seed | ❌ |
| **This project** | ✅ | ✅ | ✅ probabilistic, age-marginalized | ✅ UNCLOS-tiered |

---

## 6. Feature Requirements

### F1 — SAR Detection & Segmentation
**What it does:** Ingests a Sentinel-1 (VV+VH) scene, segments it into oil / look-alike / no-oil / land / ambiguous, and computes a detectability mask from wind speed.

**Requirements:**
- Render SAR amplitude as a base raster layer.
- Overlay segmentation as colored GeoJSON polygons (oil = red, look-alike = amber, ambiguous = grey).
- Show BAOAC-referenced volume band (a range, explicitly labeled "indicative," never a single number).
- Show detectability mask (wind < 3 m/s or > 12 m/s = "not assessable," rendered as hatched overlay, not blank).
- Info panel: acquisition timestamp, incidence angle, wind speed/direction at capture.

**Acceptance criteria:** Toggling "mask" on/off visibly changes confidence framing; no slick claim is shown without its wind-gate context.

---

### F2 — Probabilistic Backward Attribution ("Origin Cloud")
**What it does:** Runs an ensemble of backward Lagrangian drift simulations (age marginalized 1–24h) and renders the resulting space-time origin probability as an animated cloud.

**Requirements:**
- Time slider, 0–24 hours (back from detection time).
- At each hour, render 90% / 50% / 10% KDE contours of the backward ensemble.
- Auto-play mode: 1 frame/sec, pause/resume.
- Mark slick position (t=0, red star) and current 50%-contour centroid (moving blue marker) as the slider moves.
- Stats readout: "Most likely origin window: X–Y hours ago, within [bounding region]."

**Acceptance criteria:** The uncertainty visibly *shrinks toward a plausible origin* as the animation runs — this is the single most important visual in the whole demo.

---

### F3 — Vessel Traffic Radar *(new this round)*
**What it does:** A FlightRadar24-style live map of vessel traffic in the AOI, replaying the 48-hour AIS fixture, so judges get an instantly familiar mental model for "we're tracking ships" before the attribution logic is even explained.

**Why it's worth building:** Zero technical risk (20 vessels is trivial load), high recognizability, and it reuses data already produced for Workstream A/D — this is almost pure UI effort, not new pipeline work.

**Requirements:**
- Animated ship icons on the map, rotated to heading, moving along real timestamped tracks.
- Playback control: 1×, 10×, 60× speed (compress 48h into a ~60–90s loop for demo).
- Color coding by vessel type (cargo / tanker / fishing / unknown).
- **Dark-vessel rendering:** when a vessel's AIS track has a gap overlapping the inferred release window, render its trail as a fading dotted "ghost" line through the gap, with a pulsing marker where the signal dropped and where it reappeared.
- Top-3 ranked suspects (from F4) get a distinct pulsing red ring, visible on the radar even before you open the ranking panel.
- Optional decorative touch: a rotating radar-sweep overlay (CSS conic-gradient) anchored on the AOI — cosmetic, reinforces the "radar" framing, not functionally necessary.
- Click/hover a vessel → info card: name, MMSI, type, speed, course, last AIS timestamp, rank score if scored.

**Data contract:**
```json
// One record per vessel, feeds deck.gl TripsLayer directly
{
  "mmsi": 123456789,
  "name": "Suspect A",
  "vessel_type": "tanker",
  "path": [[lon, lat, timestamp_unix], ...],
  "ais_gaps": [{"start": ts, "end": ts}],
  "flagged": true
}
```

**Technical approach:** `deck.gl` `TripsLayer` for animated trails (built for exactly this — timestamped position arrays with a trail-length window) + `IconLayer` for the ship markers themselves. Reuses `ais_fixture_48h.csv` from the data workstream with no new backend work — just a JS transform into the TripsLayer format.

**Acceptance criteria:** Runs smoothly at 60× speed with 20 vessels; dark-vessel gaps are visually obvious without needing narration.

---

### F4 — AIS Attribution & Ranking
**What it does:** Scores every vessel in the AOI against the origin-cloud + behavioral features, ranks top-3, explains why.

**Requirements:**
- LightGBM ranker over: origin-probability-mass-along-track, speed/course stability, AIS-gap-during-release-window, special-area boundary crossing, nocturnal flag, MMSI–IMO consistency.
- Top-3 card list: confidence score, mini-track map, SHAP waterfall (which features pushed the score up/down).
- "Request PSC boarding" button → triggers evidence export (F5).

**Acceptance criteria:** Each of the top-3 has a SHAP explanation a non-technical judge can read in one glance ("AIS gap during release window: +0.31").

---

### F5 — Evidence Package Export
**What it does:** Produces a PDF bundling everything above into a UNCLOS-tiered, auditable artifact.

**Requirements:**
- Sections: Detection, Backtrack, AIS Attribution, UNCLOS Compliance Tier, Audit Trail.
- UNCLOS tier badge: explicitly labeled "Tip-and-cue quality — supports Art. 220(3) request for information; detention-grade evidence (Art. 220(6)) requires ORB reconciliation and EN 15522 chemical fingerprinting at next port."
- Audit trail: SHA-256 hashes of the SAR granule, model weights, and forcing-data versions; BSA 2023 §63 certificate template for electronic evidence.

**Acceptance criteria:** The PDF never overstates legal certainty — this is a differentiator judges with any legal literacy will notice and reward.

---

## 7. Frontend Architecture Decision

**Recommendation: single unified map shell, not four separate tabs.**

F1 (detection overlay), F2 (origin cloud), and F3 (vessel radar) are all spatial layers over the *same* AOI and can share one `deck.gl` canvas with a layer-toggle panel, rather than four disconnected screens. This:
- Cuts frontend engineering effort (one map instance, one camera, one basemap).
- Produces a stronger demo — judges see detection, backtrack, and traffic converge in the same view instead of context-switching between tabs.
- F4 (ranked suspects) and F5 (export) become a side panel docked to the same shell.

Layer toggle panel: `[ SAR raster ] [ Detection mask ] [ Origin cloud ] [ Vessel radar ] [ Dark-vessel flags ]`

---

## 8. Non-Functional Requirements
- **Demo reliability over live robustness:** all data pre-computed and cached; no live API calls during the actual judging slot. aisstream.io/CMEMS/ERA5 calls happen at build time, not demo time.
- **Offline fallback:** full demo must run with no internet (local GeoJSON/CSV fixtures, no live tile dependency beyond a cached basemap style).
- **Load target:** map interactions (slider drag, layer toggle) must stay under ~200ms perceived latency with pre-computed frames — no live inference in the loop.

---

## 9. Technical Stack

| Layer | Choice |
|---|---|
| Detection ML | PyTorch + `segmentation_models_pytorch` (U-Net) |
| Drift ensemble | OpenDrift / OpenOil, CMEMS + ERA5 forcing |
| Ranking | LightGBM + SHAP |
| Backend | FastAPI |
| Frontend | React + `deck.gl` (TripsLayer, IconLayer, GeoJsonLayer) + Mapbox GL |
| Data | GeoJSON + CSV fixtures (PostGIS optional, not required for 1 week) |
| Deployment | Docker + Render/Railway (free tier), fully offline-capable fallback |

---

## 10. Team Ownership (RACI, 6 people)

| Owner | Lane | Key deliverables |
|---|---|---|
| **P1** | Data & Forcing Pipeline | SAR scene, OpenDrift ensemble run, CMEMS/ERA5 pulls, synthetic AIS fixture |
| **P2** | Detection ML + Backend | U-Net inference, `/api/detect`, BAOAC volume calc, detectability mask |
| **P3** | Backtrack Processing | KDE contours per hour, drift manifest JSON, age-marginalization logic |
| **P4** | Ranking + Evidence (backend) | LightGBM ranker, SHAP, `/api/score`, PDF evidence export, UNCLOS tier logic |
| **P5** | Frontend Lead — Map Shell | deck.gl base map, SAR + detection + origin-cloud layers, time-slider |
| **P6** | Frontend — Vessel Radar + Attribution Panel | TripsLayer ship radar, dark-vessel ghost trails, ranked-suspect side panel, export button |

---

## 11. Timeline

| Day | Milestone |
|---|---|
| 1 | Workstream kickoff; P1 starts data pull; scaffold repo (backend + frontend skeleton) |
| 2 | P1 delivers scene + drift ensemble + AIS fixture; P2 starts detection model |
| 3 | P5 has base map shell rendering SAR raster; P2 detection overlay wired in |
| 4 | P3 delivers KDE contours; origin-cloud animation live on map shell |
| 5 | P6 delivers vessel radar + dark-vessel flags; P4 delivers ranking + SHAP panel |
| 6 | Integration day: all layers on one map, evidence export working end-to-end |
| 7 | Rehearse demo 3×, offline fallback tested, ship |

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| OpenDrift ensemble too slow to iterate on | Run once, cache all outputs as static GeoJSON by Day 2 — no live drift calls in demo |
| Detection model underperforms on chosen scene | Pick scene with a known, visually obvious slick (MSC ELSA 3 era); fall back to Zenodo test-set image if needed |
| Live AIS/API dependencies fail during judging | All fixtures cached locally; zero live calls during the demo window |
| Judges challenge legal/accuracy claims | Every number is ranged/labeled "indicative"; UNCLOS tier badge is explicit about what the system does *not* prove |
| Frontend scope creep (radar + shell + 4 layers) | Single map shell (Section 7) keeps this to one canvas, not four separate UIs |

---

## 13. Appendix

Full technical/legal/data-source research: `SIH26143_Oil_Spill_Attribution_Research_Dossier.md` (same output folder).

Key differentiators to keep repeating in the pitch:
1. Probabilistic space-time backtracking with age marginalization (the core novelty — no existing system does this).
2. AIS traffic density as a Bayesian prior on source location.
3. Court-aware evidence packaging (UNCLOS tiers, BSA §63 certificates).
4. Multi-modal, India-domain-adapted detection (VV+VH+wind+bi-temporal).
5. Honest uncertainty reporting throughout — detectability mask, ranged volumes, tiered confidence.
