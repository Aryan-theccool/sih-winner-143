"""
F2 — Backward attribution + forward forecast (the "time machine").

Self-contained Lagrangian particle engine with the exact physics an
OpenDrift OpenOil backward run uses:
    dx/dt = u_current + windage * U10      (advection)
          + sqrt(2*Kh*dt) * N(0,1)         (turbulent diffusion)
integrated BACKWARD from the detected slick polygon, hour by hour up to
-24 h, plus a +12 h forward forecast. Each hourly snapshot is converted
to a probability cloud with a 2-D KDE, and p10/p50/p90 probability-mass
contours are exported to GeoJSON for the UI and the ranker.

To switch to real OpenDrift on an ops machine, see drift/OPENDRIFT_NOTES.md —
the reader/model interface mirrors this module.

    python -m drift.opendrift_run
"""
import json
import hashlib
import datetime as dt
import numpy as np
from scipy.stats import gaussian_kde
from skimage import measure
from shapely.geometry import Polygon, MultiPolygon, mapping, shape

from common import config as C
from common.geo import is_land, deg_per_meter
from drift.fields import FieldSet

# KDE evaluation window (covers slick + plausible origins)
KDE_BOX = dict(lon_min=75.30, lon_max=76.10, lat_min=8.95, lat_max=9.75)
GRID_NX, GRID_NY = 161, 161
LEVELS = {"p10": 0.10, "p50": 0.50, "p90": 0.90}


# ---------------------------------------------------------------- seeding
def load_seed_polygon():
    fc = json.loads(C.SLICK_GEOJSON.read_text())
    cands = [f for f in fc["features"] if f["properties"]["class"] == "oil_confirmed"]
    if not cands:                                  # fallback: biggest object
        cands = fc["features"]
    f = max(cands, key=lambda f_: f_["properties"]["area_km2"])
    return f["properties"]["object_id"], shape(f["geometry"])


def seed_particles(poly, n, rng):
    minx, miny, maxx, maxy = poly.bounds
    pts = []
    while len(pts) < n:
        xs = rng.uniform(minx, maxx, n)
        ys = rng.uniform(miny, maxy, n)
        from shapely import points as shp_points
        inside = poly.contains(shp_points(np.stack([xs, ys], 1)))
        pts.extend(zip(xs[inside], ys[inside]))
    pts = np.array(pts[:n])
    return pts[:, 0], pts[:, 1]


# ---------------------------------------------------------------- advection
def integrate(fs, lon, lat, t0_epoch, hours, direction, rng):
    """direction=-1 backward, +1 forward. Returns (n_hours+1, N, 2) snapshots."""
    snapshots = [(lon.copy(), lat.copy())]
    n_steps = C.DRIFT_DT_SECONDS
    steps_per_hour = 3600 // n_steps
    t = t0_epoch
    for h in range(hours):
        for _ in range(steps_per_hour):
            # RK2 midpoint
            u1, v1 = fs.oil_drift_velocity(lon, lat, t)
            dlat1, dlon1 = deg_per_meter(lat)[0], deg_per_meter(lat)[1]
            mx = lon + direction * u1 * n_steps / 2 * dlon1
            my = lat + direction * v1 * n_steps / 2 * dlat1
            u2, v2 = fs.oil_drift_velocity(mx, my, t + direction * n_steps / 2)
            kick = np.sqrt(2 * C.DIFFUSION_KH * n_steps)
            lon = lon + direction * u2 * n_steps * dlon1 + rng.normal(0, kick, len(lon)) * dlon1
            lat = lat + direction * v2 * n_steps * dlat1 + rng.normal(0, kick, len(lat)) * dlat1
            on_land = is_land(lon, lat)
            lon[on_land] -= direction * 2 * (lon - mx)[on_land]  # crude coast bounce
            t += direction * n_steps
        snapshots.append((lon.copy(), lat.copy()))
    return snapshots


# ---------------------------------------------------------------- KDE clouds
def kde_cloud(lon, lat, gx, gy):
    """Density grid + p10/50/90 probability-mass contour polygons."""
    bx, by = deg_per_meter(lat.mean())[1], deg_per_meter(lat.mean())[0]
    pts = np.stack([(lon - KDE_BOX["lon_min"]) / bx, (lat - KDE_BOX["lat_min"]) / by])
    kde = gaussian_kde(pts, bw_method=0.18)
    GX, GY = np.meshgrid(
        (gx - KDE_BOX["lon_min"]) / bx, (gy - KDE_BOX["lat_min"]) / by)
    dens = kde(np.stack([GX.ravel(), GY.ravel()])).reshape(GX.shape)
    dens /= dens.sum() + 1e-12
    # mass thresholds
    srt = np.sort(dens.ravel())[::-1]
    cum = np.cumsum(srt)
    thrs = {}
    for name, frac in LEVELS.items():
        thrs[name] = srt[min(np.searchsorted(cum, frac), len(srt) - 1)]
    polys = {}
    for name, thr in thrs.items():
        rings = measure.find_contours(dens, thr)
        ps = []
        for r in rings:
            if len(r) < 5:
                continue
            coords = [(gx[0] + c[1] * (gx[1] - gx[0]),
                       gy[0] + c[0] * (gy[1] - gy[0])) for c in r]
            p = Polygon(coords)
            if p.is_valid and p.area > 1e-5:
                ps.append(p)
        ps.sort(key=lambda p: -p.area)
        keep = [p.simplify(0.002, preserve_topology=True) for p in ps[:2]]
        polys[name] = MultiPolygon(keep) if len(keep) > 1 else (keep[0] if keep else None)
    return dens, polys


def _sha256(path):
    import pathlib
    p = pathlib.Path(path)
    return hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else None


def run():
    C.ensure_dirs()
    fs = FieldSet()
    rng = np.random.default_rng(20250612)
    obj_id, poly = load_seed_polygon()
    lon0, lat0 = seed_particles(poly, C.N_PARTICLES, rng)
    t0 = C.T0.timestamp()

    gx = np.linspace(KDE_BOX["lon_min"], KDE_BOX["lon_max"], GRID_NX)
    gy = np.linspace(KDE_BOX["lat_min"], KDE_BOX["lat_max"], GRID_NY)

    out = {}
    for name, hours, direction in (("backtrack", C.BACK_HOURS, -1),
                                   ("forecast", C.FWD_HOURS, +1)):
        snaps = integrate(fs, lon0, lat0, t0, hours, direction, rng)
        features, centroids, grids = [], [], []
        for h, (ln, lt) in enumerate(snaps):
            dens, polys = kde_cloud(ln, lt, gx, gy)
            grids.append(dens.astype("float32"))
            centroids.append((float(ln.mean()), float(lt.mean())))
            for lvl, p in polys.items():
                if p is None:
                    continue
                features.append({
                    "type": "Feature",
                    "properties": {"t_hours": h if direction > 0 else -h,
                                   "hour_index": h,
                                   "level": lvl,
                                   "valid_time_utc": (C.T0 + dt.timedelta(
                                       hours=h if direction > 0 else -h)).isoformat()},
                    "geometry": mapping(p)})
        # centroid line feature
        features.append({
            "type": "Feature",
            "properties": {"kind": "centroid_track", "direction": name},
            "geometry": {"type": "LineString",
                         "coordinates": [[round(x, 5), round(y, 5)]
                                         for x, y in centroids]}})
        fc = {"type": "FeatureCollection", "features": features}
        path = C.BACKTRACK_GEOJSON if name == "backtrack" else C.FORECAST_GEOJSON
        path.write_text(json.dumps(fc, indent=1))
        out[name] = dict(centroids=centroids, grids=np.array(grids), path=path)
        print(f"F2 {name:9s}: {hours}h simulated, {len(features)-1} cloud contours -> {path.name}")

    np.savez_compressed(C.DRIFT_KDE_NPZ, gx=gx.astype("float32"),
                        gy=gy.astype("float32"),
                        back=out["backtrack"]["grids"],
                        fwd=out["forecast"]["grids"])

    # ---- origin estimate: where the 14-22 h backtrack clouds concentrate ----
    back_g = out["backtrack"]["grids"]
    focus = back_g[14:23].mean(axis=0)
    iy, ix = np.unravel_index(np.argmax(focus), focus.shape)
    est_lon, est_lat = float(gx[ix]), float(gy[iy])
    err_km = float(np.hypot((est_lon - C.TRUE_ORIGIN_LON) * 109.8,
                            (est_lat - C.TRUE_ORIGIN_LAT) * 110.6))
    manifest = {
        "engine": "OriginTrace Lagrangian Engine v1.0 (OpenDrift-compatible)",
        "physics": {"advection": "current + windage*U10 (RK2)",
                    "windage": C.WINDAGE, "diffusion_kh_m2s": C.DIFFUSION_KH,
                    "dt_seconds": C.DRIFT_DT_SECONDS},
        "seed_object": obj_id,
        "n_particles": C.N_PARTICLES,
        "detection_time_utc": C.T0.isoformat(),
        "backtrack_hours": C.BACK_HOURS, "forecast_hours": C.FWD_HOURS,
        "origin_estimate": {
            "lon": round(est_lon, 4), "lat": round(est_lat, 4),
            "estimated_release_window_utc": [
                (C.T0 - dt.timedelta(hours=22)).isoformat(),
                (C.T0 - dt.timedelta(hours=14)).isoformat()],
            "note_synthetic_case_truth": {
                "true_origin": [C.TRUE_ORIGIN_LON, C.TRUE_ORIGIN_LAT],
                "true_release": C.TRUE_RELEASE_TIME.isoformat(),
                "origin_error_km": round(err_km, 1)}},
        "input_sha256": {
            "sar_scene": _sha256(C.SAR_TIF), "wind_nc": _sha256(C.WIND_NC),
            "currents_nc": _sha256(C.CURR_NC),
            "slick_polygons": _sha256(C.SLICK_GEOJSON)},
    }
    C.DRIFT_MANIFEST.write_text(json.dumps(manifest, indent=2))
    print(f"F2 origin estimate: ({est_lon:.4f}, {est_lat:.4f})  "
          f"[synthetic truth err {err_km:.1f} km]")


if __name__ == "__main__":
    run()
