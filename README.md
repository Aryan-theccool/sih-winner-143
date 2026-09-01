# OriginTrace — SIH-26143 (PS 26143)
### SAR oil-spill detection → **backward origin attribution** → vessel ranking → UNCLOS evidence

> "Oil spill dekha → Time machine chalao peeche → Culprit ship dhundho → Proof nikalo"

Existing operational systems stop at detection (EMSA CleanSeaNet matches *current*
ships; INCOIS OOSA only forecasts forward). **This system runs time BACKWARD from the
slick, reconstructs a probabilistic origin cloud, and ranks every ship that crossed
it.** That backward step is the novelty.

---

## Architecture (what lives where)

```
casefiles/KERALA_2025_CASE01/
  inputs/   sar/scene.tif            Sentinel-1-like GRD scene (synthetic fallback)
            sar/metadata.json        scene id, bounds, mode, pol
            wind/era5_subset.nc      ERA5-like hourly 10 m wind (synthetic)
            currents/cmems_subset.nc CMEMS-like hourly surface currents (synthetic)
            ais/synthetic_48h.csv    20 vessels × 48 h × 5-min pings
            ais/vessels.json         registry meta + declared AIS gaps
  outputs/  detection/  slick_polygons.geojson · detectability_mask.geojson · summary
            drift/      backtrack_hourly.geojson · forecast_hourly.geojson ·
                        manifest.json · kde_grids.npz
            ranking/    suspects.json · lgbm_ranker.txt
            evidence/   evidence.pdf · frames/
backend/    FastAPI — serves every artifact + the built UI (+ /api/pipeline/run)
ml/         U-Net (PyTorch, auto-GPU path) + physics-based detector (CPU baseline)
drift/      Lagrangian backward/forward engine (OpenDrift-compatible, see notes)
ranking/    feature engine → LightGBM ranker → TreeSHAP explanations
evidence/   PIL map frames + ReportLab legal PDF
frontend/   React 18 + deck.gl v9 + maplibre (CARTO tiles; offline land fallback)
docker-compose.yml, Dockerfile   single-container offline demo
```

## One-command demo

```bash
docker compose up --build          # -> http://localhost:8000  (offline-capable)
```

Bare metal:

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m pipeline.run_all                     # builds case + runs F1→F5
cd frontend && npm install && npm run build    # UI build (once)
cd .. && uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

## Features → demo checkpoints

| # | What | Module | Output |
|---|------|--------|--------|
| F1 | SAR dark-spot detection + wind-validity gate (3–12 m/s) | `ml/unet_inference.py` (+`classical_detect.py`) | slick classes 🔴🟡⚫ |
| F2 | **Backward drift 0→−24 h, KDE origin cloud (p10/50/90)** | `drift/opendrift_run.py` | origin ~1 km from truth |
| F3 | Vessel radar: replay 1×/10×/60×, dark-vessel dashed trails | frontend + `backend` | animated map |
| F4 | LightGBM ranking + TreeSHAP reason bullets | `ranking/` | suspects.json |
| F5 | UNCLOS 220(3) PDF, SHA-256 chain-of-custody | `evidence/make_pdf.py` | evidence.pdf |

**Demo case result:** top suspect = `MT KAVERI STAR` (MMSI 419000001) — crossed the
reconstructed origin at the reconstructed time, slow & straight, AIS dark for 6.2 h
inside the release window. A look-alike slick in a 1.7 m/s low-wind patch is
correctly *not* flagged as oil; a tanker arriving after detection is exonerated.

## Data policy

The demo case is **synthetic by construction** (document Option B fallback): the SAR
scene is generated from the wind field; the slicks are forward-simulated plumes; AIS
is scripted with known ground truth. Swap real data in `casefiles/*/inputs/`
(Sentinel-1 GRD from Copernicus Data Space, ERA5 from CDS, CMEMS currents, real AIS)
and re-run `python -m pipeline.run_all --no-casegen` — the chain is identical.

GPU path: `pip install -r requirements-ml-gpu.txt && python -m ml.train_unet
--synthetic` (or plug a Zenodo SAR/oil-spill dataset) — when `ml/weights/unet_sar.pt`
exists, F1 automatically uses the U-Net.

## Legal framing (deliberate)

The package closes at **UNCLOS Art. 220(3) tip-and-cue**: grounds to request
information from a vessel. Boarding (220(5)) and detention (220(6), MARPOL sampling)
are explicitly out of scope — stated inside the PDF. Knowing where the legal line is
*is* the product feature.

## Repo hygiene

`casefiles/` ships the small deterministic synthetic case (fully offline demo).
Real 1 GB scenes are git-ignored. `frontend/dist/` and `node_modules/` ignored.
