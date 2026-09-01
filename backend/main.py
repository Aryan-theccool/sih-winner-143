"""
OriginTrace backend — FastAPI over the precomputed casefile.

    uvicorn backend.main:app --host 0.0.0.0 --port 8000

Serves every artifact the UI needs (the UI never re-computes; the whole
demo runs offline from casefiles/), plus the static frontend build.
"""
import datetime as dt
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from common import config as C
from common.geo import coastline_geojson

app = FastAPI(title="OriginTrace API", version="1.0",
              description="SAR oil-spill detection + backward attribution + "
                          "vessel ranking + UNCLOS evidence")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"],
                   allow_headers=["*"])


def _read(path: Path):
    if not path.exists():
        raise HTTPException(404, f"{path.name} not computed yet — run the pipeline")
    return json.loads(path.read_text())


# ------------------------------------------------------------------ case meta
@app.get("/api/case")
def case():
    meta = _read(C.SAR_META)
    return {
        "case_id": "KERALA_2025_CASE01",
        "title": "Illegal discharge attribution — Kerala coast sector",
        "scene": meta,
        "t0_utc": C.T0.isoformat(),
        "ais_window_utc": [C.AIS_START.isoformat(), C.AIS_END.isoformat()],
        "release_window_utc": [C.RELEASE_WINDOW[0].isoformat(),
                               C.RELEASE_WINDOW[1].isoformat()],
        "wind_valid_range": [C.WIND_VALID_MIN, C.WIND_VALID_MAX],
        "aoi": C.AOI,
        "kde_box": __import__("drift.opendrift_run", fromlist=["KDE_BOX"]).KDE_BOX,
        "coastline": coastline_geojson(),
        "unclos": {"tier": "Art. 220(3) — tip-and-cue / request-for-information",
                   "not": "NOT detention-grade (220(6) needs chemical fingerprinting)"},
    }


@app.get("/api/scene.png")
def scene_png():
    if not C.SAR_PREVIEW.exists():
        raise HTTPException(404, "scene preview missing")
    return FileResponse(C.SAR_PREVIEW, media_type="image/png")


# ------------------------------------------------------------------ F1 + F2 artifacts
@app.get("/api/detection")
def detection():
    return {"slick": _read(C.SLICK_GEOJSON),
            "detectability": _read(C.MASK_GEOJSON),
            "summary": _read(C.DET_SUMMARY)}


@app.get("/api/drift/backtrack")
def backtrack():
    return _read(C.BACKTRACK_GEOJSON)


@app.get("/api/drift/forecast")
def forecast():
    return _read(C.FORECAST_GEOJSON)


@app.get("/api/drift/manifest")
def manifest():
    return _read(C.DRIFT_MANIFEST)


# ------------------------------------------------------------------ F3 vessels
@app.get("/api/vessels")
def vessels():
    df = pd.read_csv(C.AIS_CSV, parse_dates=["timestamp"])
    meta = {v["mmsi"]: v for v in _read(C.VESSELS_JSON)["vessels"]}
    out = []
    for mmsi, g in df.groupby("mmsi"):
        mmsi = str(mmsi)
        g = g.sort_values("timestamp")
        t = g.timestamp.map(lambda x: x.timestamp()).values
        lon, lat = g.lon.values, g.lat.values
        path, ghosts, in_dark = [], [], False
        for i in range(len(g)):
            if i and t[i] - t[i - 1] > 1800:          # dark interval begins
                in_dark = True
                ghosts.append([[round(float(lon[i - 1]), 5), round(float(lat[i - 1]), 5), int(t[i - 1])]])
            path.append([round(float(lon[i]), 5), round(float(lat[i]), 5), int(t[i])])
            if in_dark:
                ghosts[-1].append(path[-1])
            if in_dark and i + 1 < len(g) and t[i + 1] - t[i] <= 1800:
                in_dark = False                       # lights back on
        out.append({"mmsi": mmsi,
                    "name": meta.get(mmsi, {}).get("name", mmsi),
                    "type": meta.get(mmsi, {}).get("type", "?"),
                    "flag": meta.get(mmsi, {}).get("flag", "?"),
                    "length_m": meta.get(mmsi, {}).get("length_m"),
                    "path": path,
                    "dark_segments": ghosts})
    return {"t_min": int(df.timestamp.min().timestamp()),
            "t_max": int(df.timestamp.max().timestamp()),
            "vessels": out}


# ------------------------------------------------------------------ F4 + F5
@app.get("/api/ranking")
def ranking():
    return _read(C.SUSPECTS_JSON)


@app.get("/api/evidence/pdf")
def evidence_pdf():
    if not C.EVIDENCE_PDF.exists():
        raise HTTPException(404, "evidence.pdf not computed yet")
    return FileResponse(C.EVIDENCE_PDF, media_type="application/pdf",
                        filename="evidence_KERALA_2025_CASE01.pdf")


@app.get("/api/evidence/frames/{name}")
def evidence_frame(name: str):
    p = C.EVIDENCE_FRAMES / f"{name}.png"
    if not p.exists():
        raise HTTPException(404, name)
    return FileResponse(p, media_type="image/png")


@app.post("/api/pipeline/run")
def pipeline_run():
    """Re-run the full compute chain (blocks; used for live re-generation)."""
    r = subprocess.run([sys.executable, "-m", "pipeline.run_all", "--no-casegen"],
                       cwd=C.ROOT, capture_output=True, text=True, timeout=1200)
    return {"ok": r.returncode == 0, "log": (r.stdout + r.stderr)[-4000:]}


# ------------------------------------------------------------------ frontend build
if C.FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(C.FRONTEND_DIST), html=True),
              name="ui")
