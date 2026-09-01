"""
Render the three map frames used inside the evidence PDF (pure PIL —
no GUI / no matplotlib needed, works fully offline).

  frame1_detection.png  SAR scene + slick classes + ships at T0
  frame2_origin.png     backward origin-cloud key frames (-6/-12/-18/-24h)
  frame3_suspects.png   top-3 suspect tracks + ghost gap + origin cloud
"""
import json
import datetime as dt
import math
import numpy as np
import pandas as pd
from PIL import Image, ImageDraw

from common import config as C
from common.geo import coastline_geojson

BOX = dict(lon0=75.15, lon1=76.65, lat0=8.65, lat1=9.95)
W, H = 1500, 980

SEA = (8, 20, 38)
LAND = (30, 41, 54)
GRID = (24, 42, 66)
RED = (255, 71, 87)
AMBER = (255, 176, 32)
GREY = (150, 160, 175)
CYAN = (46, 213, 255)
GREEN = (60, 220, 140)
WHITE = (230, 238, 245)


def _proj(lon, lat):
    x = (lon - BOX["lon0"]) / (BOX["lon1"] - BOX["lon0"]) * W
    y = (BOX["lat1"] - lat) / (BOX["lat1"] - BOX["lat0"]) * H
    return x, y


def _basemap(with_scene=False):
    img = Image.new("RGB", (W, H), SEA)
    dr = ImageDraw.Draw(img, "RGBA")
    if with_scene and C.SAR_PREVIEW.exists():
        scene = Image.open(C.SAR_PREVIEW).convert("L")
        s = C.SCENE
        x0, y0 = _proj(s["lon_min"], s["lat_max"])
        x1, y1 = _proj(s["lon_max"], s["lat_min"])
        scene = scene.resize((int(x1 - x0), int(y1 - y0)))
        tinted = Image.merge("RGB", (scene.point(lambda v: v // 3),
                                      scene.point(lambda v: v // 2), scene))
        img.paste(tinted, (int(x0), int(y0)))
        dr = ImageDraw.Draw(img, "RGBA")
    # land
    land_poly = None
    for f in coastline_geojson()["features"]:
        if f["properties"]["kind"] == "land":
            land_poly = f["geometry"]["coordinates"][0]
    dr.polygon([_proj(lon, lat) for lon, lat in land_poly], fill=LAND)
    # graticule
    for lon in np.arange(math.floor(BOX["lon0"] * 4) / 4, BOX["lon1"], 0.25):
        x, _ = _proj(lon, 0)
        dr.line([(x, 0), (x, H)], fill=GRID, width=1)
        dr.text((x + 3, H - 18), f"{lon:.2f}E", fill=(90, 110, 130))
    for lat in np.arange(math.floor(BOX["lat0"] * 4) / 4, BOX["lat1"], 0.25):
        _, y = _proj(0, lat)
        dr.line([(0, y), (W, y)], fill=GRID, width=1)
        dr.text((6, y + 2), f"{lat:.2f}N", fill=(90, 110, 130))
    return img, dr


def _poly(dr, geom, fill, outline, width=2):
    polys = [geom["coordinates"]] if geom["type"] == "Polygon" else geom["coordinates"]
    for poly in polys:
        for ring in poly[:1]:
            pts = [_proj(lo, la) for lo, la in ring]
            dr.polygon(pts, fill=fill, outline=outline)


def frame_detection():
    img, dr = _basemap(with_scene=True)
    det = json.loads(C.SLICK_GEOJSON.read_text())
    colmap = {"oil_confirmed": (RED, "rgba(255,71,87,90)"),
              "look_alike": (AMBER, "rgba(255,176,32,80)"),
              "ambiguous": (GREY, "rgba(150,160,175,60)")}
    for f in det["features"]:
        c = f["properties"]["class"]
        col, fill = colmap.get(c, colmap["ambiguous"])
        _poly(dr, f["geometry"], None, col, 3)
        centroid = f["properties"]["centroid"]
        x, y = _proj(*centroid)
        dr.text((x + 8, y - 8), f"{f['properties']['object_id']} ({c})",
                fill=col)
    # ships at detection
    try:
        ais = pd.read_csv(C.AIS_CSV, parse_dates=["timestamp"])
        near = ais[(ais.timestamp >= C.T0 - dt.timedelta(minutes=20))]
        for _, r in near.iterrows():
            x, y = _proj(r.lon, r.lat)
            if 0 <= x < W and 0 <= y < H:
                dr.ellipse([x - 4, y - 4, x + 4, y + 4], outline=CYAN, width=1)
    except Exception:
        pass
    _title(dr, "F1  SAR DETECTION — Sentinel-1 scene, slick classes + AIS positions @ T0")
    img.save(C.EVIDENCE_FRAMES / "frame1_detection.png")


def frame_origin():
    img, dr = _basemap()
    bt = json.loads(C.BACKTRACK_GEOJSON.read_text())
    show = {-6: (CYAN, 60), -12: (GREEN, 70), -18: (AMBER, 80), -24: (RED, 85)}
    label_off = {-6: (14, -16), -12: (-44, 8), -18: (16, 6), -24: (-56, -14)}
    for f in bt["features"]:
        p = f["properties"]
        if p.get("t_hours") not in show:
            continue
        col, a = show[p["t_hours"]]
        if p.get("level") == "p90":
            _poly(dr, f["geometry"], (*col, a // 3), None)
        elif p.get("level") == "p50":
            _poly(dr, f["geometry"], (*col, a), col, 3)
            ring = (f["geometry"]["coordinates"][0] if f["geometry"]["type"] == "Polygon"
                    else f["geometry"]["coordinates"][0][0])
            x, y = _proj(*np.mean(np.array(ring), axis=0))
            dx, dy = label_off[p["t_hours"]]
            dr.text((x + dx, y + dy), f"T{p['t_hours']}h", fill=col)
    for f in bt["features"]:
        if f["properties"].get("kind") == "centroid_track":
            pts = [_proj(*c) for c in f["geometry"]["coordinates"]]
            dr.line(pts, fill=WHITE, width=2)
            break
    man = json.loads(C.DRIFT_MANIFEST.read_text())
    oe = man["origin_estimate"]
    _star(dr, _proj(oe["lon"], oe["lat"]), 12, AMBER)
    det = json.loads(C.SLICK_GEOJSON.read_text())
    for f in det["features"]:
        if f["properties"]["class"] == "oil_confirmed":
            _poly(dr, f["geometry"], (255, 71, 87, 70), RED, 3)
    _title(dr, "F2  BACKWARD ATTRIBUTION — origin probability cloud (p50 contours by look-back hour)")
    img.save(C.EVIDENCE_FRAMES / "frame2_origin.png")


def frame_suspects():
    img, dr = _basemap()
    sus = json.loads(C.SUSPECTS_JSON.read_text())
    ais = pd.read_csv(C.AIS_CSV, parse_dates=["timestamp"])
    man = json.loads(C.DRIFT_MANIFEST.read_text())
    bt = json.loads(C.BACKTRACK_GEOJSON.read_text())
    for f in bt["features"]:
        if f["properties"].get("level") == "p90" and f["properties"].get("t_hours") == -18:
            _poly(dr, f["geometry"], (255, 176, 32, 40), AMBER, 1)
    oe = man["origin_estimate"]
    _star(dr, _proj(oe["lon"], oe["lat"]), 12, AMBER)
    cols = [RED, AMBER, CYAN]
    for i, r in enumerate(sus["ranking"][:3]):
        col = cols[i]
        g = ais[ais.mmsi == int(r["mmsi"])].sort_values("timestamp")
        if len(g) < 2:
            continue
        t = g.timestamp.map(lambda x: x.timestamp()).values
        lon, lat = g.lon.values, g.lat.values
        for j in range(len(g) - 1):
            p0, p1 = _proj(lon[j], lat[j]), _proj(lon[j + 1], lat[j + 1])
            if t[j + 1] - t[j] > 1800:      # ghost / dark segment
                _dashed(dr, p0, p1, col)
            else:
                dr.line([p0, p1], fill=col, width=3)
        x, y = _proj(lon[0], lat[0])
        dr.text((x + 6, y), f"#{i+1} {r['name']}  score={r['score']}", fill=col)
    _title(dr, "F4  TOP-3 SUSPECT TRACKS (dashed = AIS dark interval) — overlay with T-18h origin cloud")
    img.save(C.EVIDENCE_FRAMES / "frame3_suspects.png")


def _dashed(dr, p0, p1, col, dash=12, gap=9):
    x0, y0 = p0; x1, y1 = p1
    dist = math.hypot(x1 - x0, y1 - y0)
    if dist == 0:
        return
    n = int(dist // (dash + gap)) + 1
    for k in range(n):
        a = k * (dash + gap) / dist
        b = min(a + dash / dist, 1)
        dr.line([(x0 + (x1 - x0) * a, y0 + (y1 - y0) * a),
                 (x0 + (x1 - x0) * b, y0 + (y1 - y0) * b)], fill=col, width=3)


def _star(dr, xy, r, col):
    x, y = xy
    pts = []
    for k in range(10):
        ang = -math.pi / 2 + k * math.pi / 5
        rad = r if k % 2 == 0 else r * 0.45
        pts.append((x + rad * math.cos(ang), y + rad * math.sin(ang)))
    dr.polygon(pts, fill=col, outline=(0, 0, 0))


def _title(dr, text):
    dr.rectangle([0, 0, W, 30], fill=(5, 12, 24))
    dr.text((12, 8), text, fill=WHITE)


def render_all():
    C.EVIDENCE_FRAMES.mkdir(parents=True, exist_ok=True)
    frame_detection()
    frame_origin()
    frame_suspects()
    print("frames rendered ->", C.EVIDENCE_FRAMES)


if __name__ == "__main__":
    render_all()
