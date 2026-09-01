"""
OriginTrace — shared configuration for the whole pipeline.

Single source of truth for the case timeline, AOI, and file layout.
Every stage (casegen / detection / drift / ranking / evidence / backend)
imports from here so integration is by fixed paths + fixed filenames.
"""
from pathlib import Path
import datetime as dt

# ---------------------------------------------------------------- paths
ROOT = Path(__file__).resolve().parents[1]
CASE = ROOT / "casefiles" / "KERALA_2025_CASE01"

IN_DIR = CASE / "inputs"
IN_SAR = IN_DIR / "sar"
IN_WIND = IN_DIR / "wind"
IN_CURRENTS = IN_DIR / "currents"
IN_AIS = IN_DIR / "ais"

OUT_DIR = CASE / "outputs"
OUT_DET = OUT_DIR / "detection"
OUT_DRIFT = OUT_DIR / "drift"
OUT_RANK = OUT_DIR / "ranking"
OUT_EVI = OUT_DIR / "evidence"

SAR_TIF = IN_SAR / "scene.tif"
SAR_META = IN_SAR / "metadata.json"
SAR_PREVIEW = IN_SAR / "scene_preview.png"
WIND_NC = IN_WIND / "era5_subset.nc"
CURR_NC = IN_CURRENTS / "cmems_subset.nc"
AIS_CSV = IN_AIS / "synthetic_48h.csv"
VESSELS_JSON = IN_AIS / "vessels.json"

SLICK_GEOJSON = OUT_DET / "slick_polygons.geojson"
MASK_GEOJSON = OUT_DET / "detectability_mask.geojson"
DET_SUMMARY = OUT_DET / "detection_summary.json"

BACKTRACK_GEOJSON = OUT_DRIFT / "backtrack_hourly.geojson"
FORECAST_GEOJSON = OUT_DRIFT / "forecast_hourly.geojson"
DRIFT_MANIFEST = OUT_DRIFT / "manifest.json"
DRIFT_KDE_NPZ = OUT_DRIFT / "kde_grids.npz"          # used by the ranker
DRIFT_PARTICLES = OUT_DRIFT / "particles_hourly.npz"

SUSPECTS_JSON = OUT_RANK / "suspects.json"
RANKER_MODEL = OUT_RANK / "lgbm_ranker.txt"

EVIDENCE_PDF = OUT_EVI / "evidence.pdf"
EVIDENCE_FRAMES = OUT_EVI / "frames"

FRONTEND_DIST = ROOT / "frontend" / "dist"

# ---------------------------------------------------------------- case timeline (UTC)
T0 = dt.datetime(2025, 6, 12, 6, 30, tzinfo=dt.timezone.utc)   # SAR detection time
TRUE_RELEASE_TIME = T0 - dt.timedelta(hours=18)                 # ground truth (synthetic case)
TRUE_ORIGIN_LON = 75.62                                          # ground truth (synthetic case)
TRUE_ORIGIN_LAT = 9.35
AIS_START = T0 - dt.timedelta(hours=48)
AIS_END = T0
BACK_HOURS = 24          # backward attribution horizon
FWD_HOURS = 12           # forward forecast horizon
RELEASE_WINDOW = (T0 - dt.timedelta(hours=24), T0 - dt.timedelta(hours=4))  # scoring window

# ---------------------------------------------------------------- geography
# ~Kerala coast AOI (offshore Kochi)
AOI = dict(lon_min=74.9, lon_max=77.6, lat_min=8.3, lat_max=10.7)
SCENE = dict(lon_min=75.0, lon_max=77.3, lat_min=8.5, lat_max=10.5, nx=460, ny=400)

# simplified Kerala coastline, (lat, lon) south -> north, east of line = land
COASTLINE = [
    (8.30, 77.06), (8.48, 76.95), (8.65, 76.83), (8.88, 76.62),
    (9.05, 76.53), (9.22, 76.42), (9.42, 76.30), (9.60, 76.26),
    (9.80, 76.24), (9.97, 76.24), (10.15, 76.19), (10.35, 76.14),
    (10.55, 76.10), (10.70, 76.08),
]

# ---------------------------------------------------------------- physics / algorithmic constants
WIND_VALID_MIN = 3.0     # m/s — below this SAR slick detection unreliable
WIND_VALID_MAX = 12.0    # m/s — above this slicks disperse
WINDAGE = 0.030          # leeway fraction of 10 m wind applied to slick
DIFFUSION_KH = 8.0       # m^2/s horizontal diffusion of oil particles
N_PARTICLES = 350
DRIFT_DT_SECONDS = 600   # 10 min integration sub-step

M_PER_DEG_LAT = 110574.0

def m_per_deg_lon(lat):
    import numpy as np
    return 111320.0 * np.cos(np.radians(lat))

def ensure_dirs():
    for p in (IN_SAR, IN_WIND, IN_CURRENTS, IN_AIS,
              OUT_DET, OUT_DRIFT, OUT_RANK, OUT_EVI, EVIDENCE_FRAMES):
        p.mkdir(parents=True, exist_ok=True)
