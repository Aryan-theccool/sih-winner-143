# 🌊 OriginTrace — AI-Powered Oil Spill Attribution System
**SIH-26143 (PS 26143)** | Smart India Hackathon 2025

> **SAR Detection** → **Backward Drift Tracking** → **Vessel Ranking** → **UNCLOS-Grade Evidence**

---

## 🎯 Overview

OriginTrace is an end-to-end system for **identifying and attributing illegal oil dumping** in Indian waters. While existing systems (EMSA CleanSeaNet, INCOIS OOSA) detect spills and forecast drift, OriginTrace uniquely **runs time backward** from the detected slick to pinpoint the origin location and identify likely culprit vessels through multi-evidence ranking.

**The Innovation:** Combining SAR imagery analysis, Lagrangian particle backtracking, AIS trajectory reconstruction, and machine learning to produce **legally defensible tip-and-cue evidence** under UNCLOS Article 220(3).

### Key Capabilities
- 🛰️ **SAR Dark-Spot Detection** – U-Net + classical physics-based detection with wind-validity masking
- ⏮️ **24-Hour Backward Drift** – Particle backtracking with KDE origin cloud (p10/50/90 percentiles)
- ⚓ **Vessel Trajectory Analysis** – Real-time AIS path playback with gap detection and speed analysis
- 🤖 **LightGBM Ranking + SHAP** – 15+ environmental & behavioral features with explainable reasoning
- 📋 **Evidence Report** – SHA-256 sealed PDF chain-of-custody for legal proceedings
- 🌐 **Offline-Capable UI** – React + Deck.gl interactive map (fully functional offline)

---

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Usage](#usage)
5. [Pipeline Workflow](#pipeline-workflow)
6. [Data Formats](#data-formats)
7. [Configuration](#configuration)
8. [API Reference](#api-reference)
9. [Case Study](#case-study)
10. [Deployment](#deployment)
11. [FAQ & Troubleshooting](#faq--troubleshooting)
12. [License & Legal](#license--legal)

---

## 🚀 Quick Start

### Docker (Recommended – 2 minutes)
```bash
docker compose up --build
# Opens at http://localhost:8000 (fully offline-capable)
```

### Bare Metal (Linux/Mac/Windows)
```bash
# 1. Environment setup
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run the full pipeline (30–60 seconds on CPU)
python -m pipeline.run_all

# 4. Build frontend (once)
cd frontend && npm install && npm run build && cd ..

# 5. Start API server
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

**Visit:** http://localhost:8000

---

## 🏗️ Architecture

### Directory Structure
```
OriginTrace/
├── backend/                      # FastAPI server
│   └── main.py                  # API endpoints + static file serving
├── frontend/                    # React + Deck.gl UI
│   ├── src/
│   │   ├── App.jsx             # Main app shell
│   │   ├── api.js              # API client
│   │   ├── map/                # Map & layer logic
│   │   └── components/         # UI components (SidePanel, TimeBar)
│   ├── package.json
│   └── vite.config.js
├── casegen/                     # Case generation (synthetic data creation)
│   ├── make_ais.py             # Vessel trajectory generation
│   ├── make_met.py             # Wind/current field generation
│   └── make_sar.py             # SAR scene simulation
├── ml/                          # Machine learning
│   ├── unet_model.py           # U-Net architecture
│   ├── train_unet.py           # Training script
│   ├── unet_inference.py       # Inference pipeline
│   ├── classical_detect.py     # Physics-based detector
│   └── vectorize.py            # Polygon extraction
├── drift/                       # Lagrangian transport modeling
│   ├── opendrift_run.py        # Backward/forward particle tracking
│   ├── fields.py               # Wind/current field adapters
│   └── OPENDRIFT_NOTES.md      # Integration details
├── ranking/                     # Vessel ranking engine
│   ├── features.py             # 15+ feature extraction
│   ├── train_ranker.py         # LightGBM training
│   └── rank.py                 # Inference + SHAP
├── evidence/                    # Report generation
│   ├── frames.py               # Visualization frames
│   └── make_pdf.py             # PDF + SHA-256 sealing
├── pipeline/                    # End-to-end orchestration
│   └── run_all.py              # Executes F1 → F5 chain
├── common/                      # Shared utilities
│   ├── config.py               # Path & constant definitions
│   └── geo.py                  # Geographic utilities
├── casefiles/                   # Test case data (deterministic synthetic)
│   └── KERALA_2025_CASE01/
│       ├── inputs/             # SAR, wind, currents, AIS
│       └── outputs/            # Detection, drift, ranking, evidence
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── requirements-ml-gpu.txt     # Optional GPU dependencies
└── README.md
```

### Data Flow Diagram
```
Inputs (SAR, Wind, Currents, AIS)
    ↓
F1: Detection (U-Net + Classical)
    ↓ [slick_polygons.geojson]
F2: Backward Drift (OpenDrift backtrack)
    ↓ [backtrack_hourly.geojson, origin cloud]
F3: Vessel Replay (AIS trajectory playback)
    ↓ [vessel paths + dark segments]
F4: Ranking (LightGBM + SHAP features)
    ↓ [suspects.json with scores + reasons]
F5: Evidence (PDF report + frames)
    ↓ [evidence.pdf, SHA-256 sealed]
Output: Static artifact bundle
```

---

## 💾 Installation

### Requirements
- **Python:** 3.9+
- **Node.js:** 18+
- **Docker:** (optional, for containerized deployment)
- **GPU:** Optional (CUDA 11.8+ for U-Net training; demo runs on CPU)

### Step 1: Clone & Navigate
```bash
git clone https://github.com/Aryan-theccool/sih-winner-143.git
cd sih-winner-143/SIH143
```

### Step 2: Python Environment
```bash
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# or
.venv\Scripts\activate     # Windows
```

### Step 3: Install Dependencies
**For demo (CPU-only):**
```bash
pip install -r requirements.txt
```

**For ML training with GPU:**
```bash
pip install -r requirements-ml-gpu.txt
```

### Step 4: (Optional) Frontend Dev Environment
```bash
cd frontend
npm install
npm run dev  # Starts Vite dev server on http://localhost:5173
cd ..
```

---

## 📖 Usage

### Running the Pipeline
Execute the full analysis from SAR image to evidence PDF:

```bash
# Full pipeline (case generation + all stages)
python -m pipeline.run_all

# Skip case generation (use existing inputs)
python -m pipeline.run_all --no-casegen

# Stage-by-stage (manual control)
python -m ml.unet_inference       # F1: Detection
python -m drift.opendrift_run     # F2: Backward drift
python -m ranking.rank            # F4: Ranking
python -m evidence.make_pdf       # F5: PDF report
```

### Starting the Server
```bash
# Production mode
uvicorn backend.main:app --host 0.0.0.0 --port 8000

# Development mode (auto-reload)
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### Accessing the UI
- **Local:** http://localhost:8000
- **Remote:** http://<your-server-ip>:8000

---

## 🔄 Pipeline Workflow

### Feature 1: SAR Detection (F1)
**Module:** `ml/unet_inference.py` + `ml/classical_detect.py`

Detects oil slicks in SAR imagery using:
- **U-Net CNN** (trained on synthetic oil-slick dataset) – primary pathway
- **Classical detector** (Otsu + morphology) – CPU fallback
- **Wind gate:** Masks low-wind (< 3 m/s, Bragg damping) and high-wind (> 12 m/s, capillary smoothing) regions as low-detectability

**Output:** `detection/slick_polygons.geojson` (classes: 🔴 Oil, 🟡 Ambiguous, ⚫ Look-alike)

---

### Feature 2: Backward Drift (F2)
**Module:** `drift/opendrift_run.py` (OpenDrift backend)

Releases 350 particles at the detected slick centroid and advects them **backward 24 hours** using:
- **Wind field:** ERA5 10 m/s wind (3-hourly)
- **Surface currents:** CMEMS ocean currents (hourly)
- **Diffusion:** Stochastic diffusion (D = 0.1 m²/s)

Computes **KDE origin cloud** (p10/50/90 percentiles) and **forward forecast** (for comparison).

**Output:** 
- `drift/backtrack_hourly.geojson` (particle trails, hourly snapshots)
- `drift/kde_grids.npz` (KDE density grids for UI rendering)
- `drift/manifest.json` (metadata: particle count, diffusion coeff, time range)

---

### Feature 3: Vessel Playback (F3)
**Module:** `backend/main.py` + `frontend/src/map/`

Streams AIS trajectories from the casefile:
- **Normal segments** (light: on-line, < 30 min gap)
- **Dark segments** (dashed: off-line, > 30 min gap, potential deliberate AIS silence)
- **Speed coloring** (red: slow < 2 kn, green: cruise 6–8 kn, blue: fast > 12 kn)

Allows **time scrubbing** (1×, 10×, 60× speed) and **sync** with the origin cloud for visual correlation.

**Output:** Animated overlay on map; no file output

---

### Feature 4: Vessel Ranking (F4)
**Module:** `ranking/features.py` + `ranking/rank.py`

Extracts 15+ features for each vessel:
- **Origin match:** Distance from vessel path to KDE p50
- **Temporal match:** Time of AIS position closest to release window
- **Behavioral:** Speed pattern, heading steadiness, AIS dark duration, flag
- **Environmental:** Wind strength, sea state during dark period

**Model:** LightGBM classifier (trained on synthetic labeled cases)

**Explainability:** TreeSHAP values for each feature contribution (shown as "reason bullets" in UI)

**Output:** `ranking/suspects.json`
```json
{
  "suspects": [
    {
      "mmsi": "419000001",
      "name": "MT KAVERI STAR",
      "score": 0.92,
      "features": {...},
      "shap_values": [...],
      "reasons": [
        "+0.42: Origin-cloud match (0.8 km)",
        "+0.31: AIS dark during release window (6.2 h)",
        "+0.15: Low speed (2.1 kn) + steady course"
      ]
    },
    ...
  ]
}
```

---

### Feature 5: Evidence Report (F5)
**Module:** `evidence/make_pdf.py`

Generates a legally structured PDF document:
1. **Executive Summary** – Case ID, date, location
2. **Detection Frame** – SAR scene with slick polygons and wind mask
3. **Origin Frame** – Backward drift cloud with KDE contours
4. **Suspects Frame** – AIS paths + top 3 suspects highlighted
5. **Ranking Table** – Scores + SHAP explanations
6. **Legal Clause** – UNCLOS Art. 220(3) scope (tip-and-cue; NOT detention-grade)
7. **Chain of Custody** – SHA-256 hash of all artifacts, timestamp, seal

**Output:** `evidence/evidence.pdf` (sealed, ready for ICG / legal proceedings)

---

## 📊 Data Formats

### Input Data

#### SAR Scene
- **Format:** GeoTIFF (Sentinel-1 GRD-compatible)
- **Location:** `casefiles/*/inputs/sar/scene.tif`
- **Metadata:** `casefiles/*/inputs/sar/metadata.json`
```json
{
  "scene_id": "S1B_EW_GRDH_1SDV_20250118T180000_20250118T180100_034567_045E12_1234",
  "bounds": {"north": 10.2, "south": 9.8, "east": 76.8, "west": 76.2},
  "mode": "EW",
  "polarization": "VV"
}
```

#### Wind Field
- **Format:** NetCDF (CF-compliant)
- **Source:** ERA5 10 m wind (or synthetic)
- **Location:** `casefiles/*/inputs/wind/era5_subset.nc`
- **Variables:** `u10`, `v10` (hourly, on lat/lon grid)

#### Ocean Currents
- **Format:** NetCDF (CF-compliant)
- **Source:** CMEMS ocean currents (or synthetic)
- **Location:** `casefiles/*/inputs/currents/cmems_subset.nc`
- **Variables:** `u`, `v` (hourly surface, on lat/lon grid)

#### AIS Trajectories
- **Format:** CSV (5-minute pings)
- **Location:** `casefiles/*/inputs/ais/synthetic_48h.csv`
```csv
timestamp,mmsi,lon,lat,sog_kn,cog_deg,ais_class
2025-01-18T12:00:00,419000001,76.45,10.05,2.1,45,A
...
```

- **Vessel Registry:** `casefiles/*/inputs/ais/vessels.json`
```json
{
  "vessels": [
    {
      "mmsi": "419000001",
      "name": "MT KAVERI STAR",
      "type": "Tanker",
      "flag": "IN",
      "length_m": 228
    },
    ...
  ]
}
```

### Output Data

#### Detection Output
- **Slick Polygons:** `outputs/detection/slick_polygons.geojson` (MultiPolygon features with class)
- **Detectability Mask:** `outputs/detection/detectability_mask.geojson` (low-wind zones)
- **Summary:** `outputs/detection/detection_summary.json`

#### Drift Output
- **Backtrack Trails:** `outputs/drift/backtrack_hourly.geojson` (LineString per hour)
- **Forecast Trails:** `outputs/drift/forecast_hourly.geojson` (forward simulation)
- **KDE Grids:** `outputs/drift/kde_grids.npz` (numpy arrays, hourly density)
- **Manifest:** `outputs/drift/manifest.json` (metadata)

#### Ranking Output
- **Suspects JSON:** `outputs/ranking/suspects.json` (full ranking with SHAP)
- **Model Card:** `outputs/ranking/lgbm_ranker.txt` (model summary)

#### Evidence Output
- **PDF Report:** `outputs/evidence/evidence.pdf` (sealed, SHA-256)
- **Frame Images:** `outputs/evidence/frames/` (frame1_detection.png, etc.)

---

## ⚙️ Configuration

### config.py
All hardcoded paths and constants are centralized in `common/config.py`:

```python
# Case location
CASE_ID = "KERALA_2025_CASE01"
CASE_ROOT = Path(__file__).parent.parent / "casefiles" / CASE_ID
INPUTS = CASE_ROOT / "inputs"
OUTPUTS = CASE_ROOT / "outputs"

# Time windows
T0 = datetime(2025, 1, 18, 12, 0, 0, tzinfo=timezone.utc)
RELEASE_WINDOW = (T0 - timedelta(hours=2), T0 + timedelta(hours=1))
AIS_WINDOW = (T0 - timedelta(hours=24), T0 + timedelta(hours=24))

# Detection parameters
WIND_VALID_MIN, WIND_VALID_MAX = 3.0, 12.0  # m/s

# Drift parameters
DRIFT_PARTICLES = 350
DRIFT_HOURS_BACK = 24
DIFFUSION_COEFF = 0.1  # m²/s

# Ranking
TOP_K_SUSPECTS = 10
```

### Environment Variables
```bash
export ORIGINTRACE_CASEFILE="/path/to/case"  # Override case location
export ORIGINTRACE_GPU=1                      # Force GPU for ML
```

---

## 🌐 API Reference

### Base URL
```
http://localhost:8000/api
```

### Endpoints

#### Case Metadata
```
GET /api/case
```
Returns: Case ID, title, SAR bounds, time windows, wind validity range, UNCLOS tier

#### Detection
```
GET /api/detection
```
Returns: Slick polygons, detectability mask, summary stats

#### Drift
```
GET /api/drift/backtrack
GET /api/drift/forecast
GET /api/drift/manifest
```
Returns: Particle trails (hourly), KDE metadata

#### Vessels
```
GET /api/vessels
```
Returns: AIS paths, dark segments, vessel metadata, time range

#### Ranking
```
GET /api/ranking
```
Returns: Suspects with scores, features, SHAP values, reason bullets

#### Evidence
```
GET /api/evidence/pdf
GET /api/evidence/frames/{name}
```
Returns: PDF file, frame images (detection, origin, suspects)

#### Pipeline Control (Dev Only)
```
POST /api/pipeline/run
```
Re-runs full pipeline (blocks ~5 min); returns JSON with log

#### UI
```
GET /
```
Serves static frontend build (React + Deck.gl)

---

## 📍 Case Study: Kerala 2025 Case 01

### Scenario
A Sentinel-1 SAR scene detects an oil slick near the **Kerala coast** (Jan 18, 2025, 12:00 UTC). The system must determine:
- Where did this slick originate?
- Which vessel is most likely responsible?
- Is the evidence legally defensible?

### Ground Truth (Known to System)
- **True source:** MT KAVERI STAR, dumping at T0 − 18 h
- **Release volume:** ~200 m³
- **True coordinates:** (76.45°E, 10.05°N)

### System Results
| Step | Result | Accuracy |
|------|--------|----------|
| F1 Detection | Slick detected, wind-masked correctly | 100% |
| F2 Backtrack Origin | Reconstructed to 1.2 km of truth | ✓ Good |
| F3 Vessel Replay | 20 vessels tracked, 3 AIS dark events identified | ✓ Complete |
| F4 Ranking | MT KAVERI STAR scored 0.92 (1st place) | ✓ Correct |
| F5 Evidence | PDF sealed, ready for legal filing | ✓ Valid |

### Why MT KAVERI STAR Ranked First
1. **Origin match:** Path passed within 0.8 km of KDE p50
2. **Temporal alignment:** AIS position at T0 − 18 h coincided with release window
3. **Behavioral red flags:** 6.2 h AIS dark during suspect period
4. **Low speed:** 2.1 kn (consistent with dumping, not steaming)
5. **Heading steady:** 45° course held for 12 hours (deliberate, not maneuvering)

### Evidence PDF (5 pages)
- Page 1: Executive summary + SAR scene
- Page 2: Backward drift cloud + origin marker
- Page 3: Suspect map with AIS trails
- Page 4: Ranking table + SHAP explanations
- Page 5: Legal clause (Art. 220(3)) + SHA-256 seal

---

## 🐳 Deployment

### Docker Compose (Production)
```yaml
services:
  origintrace:
    build: .
    ports:
      - "8000:8000"
    environment:
      - PYTHONUNBUFFERED=1
    volumes:
      - ./casefiles:/app/casefiles  # Persist case data
      - ./models:/app/ml/weights     # Persist trained models
    restart: unless-stopped
```

```bash
docker compose up -d
docker compose logs -f
```

### Kubernetes Deployment (Helm)
```bash
helm install origintrace ./helm
kubectl port-forward svc/origintrace 8000:8000
```

### Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name origintrace.example.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### AWS Deployment (Lambda + S3)
- Static UI → CloudFront + S3
- API → ALB + ECS task + RDS for case storage
- Precomputed artifacts → S3 + CloudFront

---

## ❓ FAQ & Troubleshooting

### Q: The UI shows "pipeline not computed yet"
**A:** Run `python -m pipeline.run_all` in the project root to generate artifacts.

### Q: Can I use real SAR data?
**A:** Yes! Replace files in `casefiles/*/inputs/` with real Sentinel-1 GRD scenes and run `python -m pipeline.run_all --no-casegen`.

### Q: Does this work offline?
**A:** Yes, fully offline. The Docker image includes all precomputed artifacts. UI falls back to local coastline if CARTO tiles unavailable.

### Q: How do I train the U-Net on custom SAR data?
**A:** Prepare a labeled dataset (slick=1, non-slick=0) and run:
```bash
python -m ml.train_unet --data your_data.npz --epochs 50
```

### Q: What's the UNCLOS scope?
**A:** This system provides **Article 220(3) tip-and-cue** evidence (reasonable grounds to request information from vessel). It does NOT provide **detention-grade** evidence (Art. 220(6)), which requires chemical fingerprinting and MARPOL sampling by authorized personnel.

### Q: Can I change the detection threshold?
**A:** Edit `common/config.py` (WIND_VALID_MIN/MAX) and re-run `python -m pipeline.run_all --no-casegen`.

### Q: How long does the pipeline take?
**A:** ~30–60 sec on CPU (ML inference + drift + ranking). GPU (V100): ~10–15 sec.

### Q: Can I run multiple cases simultaneously?
**A:** Each case is isolated in `casefiles/*/`. Create new case folders and run separately or parallelize.

### Q: Is GPU required?
**A:** No, demo runs on CPU. GPU optional for U-Net training or large batches.

---

## 📜 License & Legal

### Software License
[MIT License](LICENSE) – Free to use, modify, and distribute.

### Legal Disclaimer
- **Scope:** UNCLOS Article 220(3) tip-and-cue only. NOT detention-grade (Art. 220(6)).
- **Data:** Demo case is synthetic. Real case results depend on data quality (SAR calibration, AIS coverage, ocean model accuracy).
- **Responsibility:** Operators must verify evidence, consult legal experts, follow national maritime law.
- **Liability:** No warranty. Use at own risk.

### Data Attribution
- **SAR:** Sentinel-1 (ESA / Copernicus)
- **Wind:** ERA5 (ECMWF / CDS)
- **Currents:** CMEMS (Copernicus)
- **AIS:** Real AIS data is tracked by MarineTraffic / ShipTraffic / FleetMon
- **Demo case:** 100% synthetic (no real vessels or incidents)

### References
1. **SAR Oil Spill Detection:** Brekke & Solberg, IEEE TGARS (2005)
2. **OpenDrift:** Dagestad et al., GRL (2018)
3. **UNCLOS Article 220:** UN Law of the Sea (1982)
4. **LightGBM:** Ke et al., NIPS (2017)
5. **TreeSHAP:** Lundberg et al., NeurIPS (2020)

---

## 🤝 Contributing

Found a bug? Have a feature idea? Open an issue or submit a PR:

```bash
git checkout -b feature/your-feature
git commit -m "Add your feature"
git push origin feature/your-feature
```

---

## 📞 Support & Contact

- **Issues:** [GitHub Issues](https://github.com/Aryan-theccool/sih-winner-143/issues)
- **Email:** origintrace@example.com
- **Documentation:** Full API docs at http://localhost:8000/docs (Swagger UI)

---

## 📈 Roadmap

- [ ] Real-time SAR ingestion (AWS/GCP buckets)
- [ ] Multi-modal detection (SAR + optical + thermal)
- [ ] Graph-based vessel fleet clustering
- [ ] Integration with ICG MRCC systems
- [ ] Mobile app for field teams

---

**Happy tracing! 🚀**
