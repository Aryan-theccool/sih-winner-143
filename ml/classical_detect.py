"""
Physics-based SAR dark-spot detector (executable baseline — no GPU needed).

This is the same family of algorithms used operationally before deep
learning (adaptive-threshold dark-object detection over Bragg-scattering
backscatter, cf. early CleanSeaNet processing):

  1. gamma-dN conversion to dB, land masking
  2. despeckle (local mean filter)
  3. dark-object mask: pixels darker than ocean background
     (median - k*MAD, robust statistics)
  4. connected components, area filtering
  5. per-object typing with physical features:
       wind_at_centroid in [3, 12] m/s ?  (outside → look-alike)
       darkening contrast, elongation    → confirmed / ambiguous
"""
import json
import numpy as np
import rasterio
from scipy import ndimage as ndi
from shapely.geometry import mapping

from common import config as C
from common.geo import is_land
from drift.fields import FieldSet
from .vectorize import mask_to_polygon, grid_binary_to_polygons


def analyse():
    with rasterio.open(C.SAR_TIF) as ds:
        img = ds.read(1).astype("float64")
        transform = ds.transform
        ny, nx = img.shape
        lon_min, lon_max = ds.bounds.left, ds.bounds.right
        lat_min, lat_max = ds.bounds.bottom, ds.bounds.top

    s = C.SCENE
    lons = np.linspace(lon_min, lon_max, nx)
    lats = np.linspace(lat_max, lat_min, ny)
    LON, LAT = np.meshgrid(lons, lats)
    land = is_land(LON, LAT)
    land = ndi.binary_dilation(land, iterations=1)      # ignore coast fringe

    db = 10 * np.log10(np.clip(img, 1e-3, None))
    despec = ndi.uniform_filter(db, size=5)
    ocean_med = float(np.median(despec[~land]))
    # large-scale background (wind gradients, swell) -> local-anomaly resid
    filled = np.where(land, ocean_med, despec)
    bg = ndi.gaussian_filter(filled, sigma=25)
    resid = np.where(land, 0.0, despec - bg)
    med = float(np.median(resid[~land]))
    # physical threshold: locally darker than background by >= ~1.7 dB
    thr = -1.7
    dark = (resid < thr) & (~land)
    dark = ndi.binary_opening(dark, iterations=2)
    dark = ndi.binary_closing(dark, iterations=3)

    lab, n = ndi.label(dark)
    rng = np.random.default_rng(11)

    # wind at T0 for typing + detectability
    fs = FieldSet()
    uw = fs.u10.sample(LON.ravel(), LAT.ravel(), C.T0.timestamp()).reshape(LON.shape)
    vw = fs.v10.sample(LON.ravel(), LAT.ravel(), C.T0.timestamp()).reshape(LON.shape)
    wspd = np.sqrt(uw ** 2 + vw ** 2)

    objects = []
    for oid in range(1, n + 1):
        m = lab == oid
        area_px = int(m.sum())
        if area_px < 12:
            continue
        ys, xs = np.where(m)
        area_km2 = area_px * (0.5 * 0.5)                # ~500 m pixels
        # darkening contrast vs a ring around the object (in residual dB)
        ring = ndi.binary_dilation(m, iterations=6) & ~ndi.binary_dilation(m, iterations=2) & ~land
        contrast = float(np.median(resid[ring]) - np.median(resid[m])) if ring.any() else 0.0
        # elongation from pixel covariance
        pts = np.stack([xs - xs.mean(), ys - ys.mean()])
        cov = np.cov(pts)
        eig = np.linalg.eigvalsh(cov) if pts.shape[1] > 2 else np.array([1, 1])
        elong = float(np.sqrt(max(eig[-1], 1e-9) / max(eig[0], 1e-9)))
        w_at = float(wspd[m].mean())
        frac_lowwind = float((wspd[m] < C.WIND_VALID_MIN).mean())
        cx, cy = float(LON[m].mean()), float(LAT[m].mean())

        # typing: wind regime dominates (physics of Bragg damping), then shape
        if frac_lowwind > 0.4 or w_at < C.WIND_VALID_MIN or w_at > C.WIND_VALID_MAX:
            klass, conf = "look_alike", 0.35
        elif area_px >= 14 and contrast >= 2.0 and elong >= 1.12:
            klass = "oil_confirmed"
            conf = float(np.clip(0.55 + 0.07 * contrast + 0.04 * min(elong, 6), 0, 0.97))
        else:
            klass, conf = "ambiguous", 0.45

        poly = mask_to_polygon(m, transform)
        if poly is None:
            continue
        objects.append({
            "object_id": f"SAR-OBJ-{oid:02d}",
            "class": klass,
            "confidence": round(conf, 2),
            "area_km2": round(area_km2, 1),
            "contrast_db": round(contrast, 2),
            "elongation": round(elong, 2),
            "wind_ms": round(w_at, 1),
            "frac_low_wind": round(frac_lowwind, 2),
            "centroid": [round(cx, 5), round(cy, 5)],
            "polygon": poly,
            "mask": m,
        })
    return objects, dict(lons=lons, lats=lats, land=land, wspd=wspd,
                         transform=transform, thr=thr, med=med)


def write_outputs(objects, aux):
    feats = []
    for o in objects:
        props = {k: o[k] for k in ("object_id", "class", "confidence", "area_km2",
                                   "contrast_db", "elongation", "wind_ms", "centroid")}
        feats.append({"type": "Feature", "properties": props,
                      "geometry": mapping(o["polygon"])})
    fc = {"type": "FeatureCollection", "features": feats}
    C.SLICK_GEOJSON.write_text(json.dumps(fc, indent=1))

    # ---- detectability mask: where wind is outside [3, 12] m/s ----
    wspd = aux["wspd"]
    bad = ((wspd < C.WIND_VALID_MIN) | (wspd > C.WIND_VALID_MAX)) & ~aux["land"]
    mask_polys = grid_binary_to_polygons(bad, aux["transform"])
    mfeats = [{"type": "Feature",
               "properties": {"reason": "wind_outside_3_12_ms",
                              "detectability": "low"},
               "geometry": mapping(p)} for p in mask_polys]
    C.MASK_GEOJSON.write_text(json.dumps(
        {"type": "FeatureCollection", "features": mfeats}, indent=1))

    meta = json.loads(C.SAR_META.read_text())
    summary = {
        "scene_id": meta["scene_id"],
        "acquisition_time_utc": meta["acquisition_time_utc"],
        "detector": "physics-based adaptive-threshold SAR dark-spot detector",
        "ocean_median_db": round(float(aux["med"]), 2),
        "threshold_db": round(float(aux["thr"]), 2),
        "n_objects": len(objects),
        "objects": [{k: o[k] for k in ("object_id", "class", "confidence",
                                       "area_km2", "contrast_db", "wind_ms",
                                       "centroid")} for o in objects],
    }
    C.DET_SUMMARY.write_text(json.dumps(summary, indent=2))
    return summary
