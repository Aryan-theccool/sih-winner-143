"""
Generate the synthetic Sentinel-1 GRD-like SAR scene (GeoTIFF + preview PNG).

Physics-driven: the true oil slick in the image is produced by FORWARD
simulating an oil particle plume from the ground-truth release point
(2025-06-11 12:30Z, lon 75.62 / lat 9.35) up to the detection time.
That guarantees F2 backward attribution recovers a sensible "origin cloud".

Scene content:
  * ocean NRCS modulated by the ERA5-like wind field (Bragg scattering proxy)
  * multiplicative speckle (gamma) + swell streaks
  * land (east of coastline): bright + texture
  * bright ship targets (AIS positions nearest T0)
  * true oil slick (dark, wind-damped) + a look-alike dark patch in the
    low-wind convergence zone (the classic false alarm)
"""
import json
import datetime as dt
import numpy as np
import rasterio
from rasterio.transform import from_bounds
from scipy.ndimage import gaussian_filter
from PIL import Image

from common import config as C
from common.geo import is_land, coast_lon_at, deg_per_meter
from drift.fields import FieldSet


def _plume_positions(fs: FieldSet, n=900):
    """Forward-simulate oil particles from the true release to T0."""
    rng = np.random.default_rng(7)
    lon = np.full(n, C.TRUE_ORIGIN_LON) + rng.normal(0, 0.004, n)
    lat = np.full(n, C.TRUE_ORIGIN_LAT) + rng.normal(0, 0.004, n)
    t = C.TRUE_RELEASE_TIME.timestamp()
    t_end = C.T0.timestamp()
    while t < t_end:
        u, v = fs.oil_drift_velocity(lon, lat, t)
        dl_deg, dlon_deg = deg_per_meter(lat)
        # diffusion kick (m) -> deg
        kick = np.sqrt(2 * C.DIFFUSION_KH * C.DRIFT_DT_SECONDS)
        lon += (u * C.DRIFT_DT_SECONDS + rng.normal(0, kick, n)) * dlon_deg
        lat += (v * C.DRIFT_DT_SECONDS + rng.normal(0, kick, n)) * dl_deg
        t += C.DRIFT_DT_SECONDS
    return lon, lat


def build_scene(fs: FieldSet):
    s = C.SCENE
    nx, ny = s["nx"], s["ny"]
    lons = np.linspace(s["lon_min"], s["lon_max"], nx)
    lats = np.linspace(s["lat_max"], s["lat_min"], ny)   # row 0 = north
    LON, LAT = np.meshgrid(lons, lats)
    rng = np.random.default_rng(42)

    land = is_land(LON, LAT)

    # ---- ocean backscatter: Bragg proxy, brightens with wind speed ----
    t0 = C.T0.timestamp()
    uw, vw = fs.wind(LON.ravel(), LAT.ravel(), t0)
    wspd = np.sqrt(uw ** 2 + vw ** 2).reshape(LON.shape)
    nrcs = 0.16 + 0.045 * wspd                       # linear-ish NRCS vs U10
    # swell streaks (low-freq structure)
    nrcs += 0.02 * np.sin((LON * 9.1 + LAT * 7.3) * np.pi)
    nrcs += 0.012 * np.cos((LON * 3.7 - LAT * 11.2) * np.pi)
    # multiplicative speckle (post multi-looking, moderate)
    nrcs *= rng.gamma(5.0, 1.0 / 5.0, LON.shape)

    # ---- true oil slick: forward-evolved plume damps capillary waves ----
    pl, pt = _plume_positions(fs)
    slick = np.zeros_like(nrcs)
    ix = ((pl - s["lon_min"]) / (s["lon_max"] - s["lon_min"]) * nx).astype(int)
    iy = ((s["lat_max"] - pt) / (s["lat_max"] - s["lat_min"]) * ny).astype(int)
    ok = (ix >= 0) & (ix < nx) & (iy >= 0) & (iy < ny)
    np.add.at(slick, (iy[ok], ix[ok]), 1)
    slick = gaussian_filter(slick, sigma=2.2)
    damp = np.clip(slick / (slick.max() + 1e-9), 0, 1) ** 0.8
    nrcs *= (1.0 - 0.68 * damp)                       # up to -68% damping

    # ---- oil look-alike: low-wind dark patch (false alarm) ----
    al = np.exp(-(((LON - 76.30) / 0.052) ** 2 + ((LAT - 8.80) / 0.030) ** 2))
    # wobbly shape
    al *= 0.85 + 0.15 * np.sin(LON * 40) * np.cos(LAT * 40)
    nrcs *= (1.0 - 0.78 * np.clip(al, 0, 1))

    # ---- bright ship targets near T0 ----
    try:
        import pandas as pd
        ais = pd.read_csv(C.AIS_CSV, parse_dates=["timestamp"])
        near = ais[(ais.timestamp >= C.T0 - dt.timedelta(minutes=30)) &
                   (ais.timestamp <= C.T0)]
        for _, r in near.iterrows():
            sx = int((r.lon - s["lon_min"]) / (s["lon_max"] - s["lon_min"]) * nx)
            sy = int((s["lat_max"] - r.lat) / (s["lat_max"] - s["lat_min"]) * ny)
            if 1 <= sx < nx - 1 and 1 <= sy < ny - 1:
                nrcs[sy - 1:sy + 2, sx - 1:sx + 2] += rng.uniform(1.5, 3.0)
    except Exception as e:  # AIS not built yet -> skip ships
        print("  (ships skipped in scene: {e})".format(e=e))

    # ---- land: bright, textured ----
    nrcs[land] = 0.55 + 0.25 * rng.random(int(land.sum()))
    nrcs = gaussian_filter(nrcs, sigma=0.6)

    return nrcs.astype("float32"), lons, lats


def main():
    C.ensure_dirs()
    fs = FieldSet()
    nrcs, lons, lats = build_scene(fs)
    s = C.SCENE

    transform = from_bounds(s["lon_min"], s["lat_min"], s["lon_max"], s["lat_max"],
                            s["nx"], s["ny"])
    with rasterio.open(
        C.SAR_TIF, "w", driver="GTiff", height=s["ny"], width=s["nx"], count=1,
        dtype="float32", crs="EPSG:4326", transform=transform, compress="deflate",
    ) as dst:
        dst.write(nrcs, 1)

    # 8-bit preview PNG (dB-scaled)
    db = 10 * np.log10(np.clip(nrcs, 1e-3, None))
    lo, hi = np.percentile(db[~is_land(*np.meshgrid(lons, lats)[::-1])], [2, 99])
    img8 = np.clip((db - lo) / (hi - lo) * 255, 0, 255).astype("uint8")
    Image.fromarray(img8).save(C.SAR_PREVIEW)

    meta = {
        "scene_id": "S1A_IW_GRDH_1SDV_20250612T063000_KERALA_SYNTH",
        "platform": "Sentinel-1A (synthetic fallback scene — Zenodo-mode)",
        "note": "Physics-driven synthetic SAR stand-in for the Copernicus Data "
                "Space Sentinel-1 GRD IW scene; replace with a real scene for ops.",
        "acquisition_time_utc": C.T0.isoformat(),
        "mode": "IW",
        "polarization": "VV+VH",
        "pass": "descending",
        "bounds": {"lon_min": s["lon_min"], "lon_max": s["lon_max"],
                    "lat_min": s["lat_min"], "lat_max": s["lat_max"]},
        "shape": {"nx": s["nx"], "ny": s["ny"]},
        "resolution_m": 500,
        "preview_png": "scene_preview.png",
    }
    C.SAR_META.write_text(json.dumps(meta, indent=2))
    print(f"sar   -> {C.SAR_TIF}  ({C.SAR_TIF.stat().st_size/1e6:.2f} MB)")


if __name__ == "__main__":
    main()
