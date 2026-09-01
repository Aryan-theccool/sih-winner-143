"""
F4a — per-vessel evidence features: AIS tracks x backtrack origin cloud.

Features (per vessel):
  origin_mass     mean backtrack-cloud probability sampled along the
                  vessel's track at the matching look-back hour
  gap_overlap_h   hours of AIS silence intersecting the release window
  dump_profile    fraction of window pings that are slow+steady
                  (operational-discharge kinematic signature)
  cpa_km          closest point of approach to the moving cloud centroid
  late_arrival    1 if the vessel only appears in the last 4 h (exoneration)
  absent_absorb   fraction of release-window hours with no point near cloud
"""
import json
import math
import datetime as dt
import numpy as np
import pandas as pd

from common import config as C

FEATURE_NAMES = ["origin_mass", "deep_hour_mass", "gap_overlap_h",
                 "dump_profile", "cpa_km", "late_arrival"]

RELEASE_T0 = C.T0 - dt.timedelta(hours=24)
RELEASE_T1 = C.T0 - dt.timedelta(hours=4)


def _cloud_centroids(back, gx, gy):
    cents = []
    GX, GY = np.meshgrid(gx, gy)
    for h in range(back.shape[0]):
        g = back[h]
        cents.append((float((GX * g).sum() / g.sum()), float((GY * g).sum() / g.sum())))
    return cents


def load_tracks():
    df = pd.read_csv(C.AIS_CSV, parse_dates=["timestamp"])
    meta = {v["mmsi"]: v for v in json.loads(C.VESSELS_JSON.read_text())["vessels"]}
    out = {}
    for mmsi, g in df.groupby("mmsi"):
        g = g.sort_values("timestamp")
        out[str(mmsi)] = dict(
            t=g.timestamp.map(lambda x: x.timestamp()).values.astype(float),
            lon=g.lon.values, lat=g.lat.values,
            sog=g.sog.values, cog=g.cog.values,
            meta=meta.get(str(mmsi), {}),
        )
    return out


def _sample_grid(stack, hidx, gx, gy, lon, lat):
    """bilinear sample of a (H,lat,lon) stack at per-point hour hidx."""
    ix = np.clip(np.interp(lon, gx, np.arange(len(gx))), 0, len(gx) - 1.001)
    iy = np.clip(np.interp(lat, gy, np.arange(len(gy))), 0, len(gy) - 1.001)
    x0, y0 = ix.astype(int), iy.astype(int)
    fx, fy = ix - x0, iy - y0
    return (stack[hidx, y0, x0] * (1 - fx) * (1 - fy)
            + stack[hidx, y0, x0 + 1] * fx * (1 - fy)
            + stack[hidx, y0 + 1, x0] * (1 - fx) * fy
            + stack[hidx, y0 + 1, x0 + 1] * fx * fy)


def compute_features():
    z = np.load(C.DRIFT_KDE_NPZ)
    gx, gy, back = z["gx"].astype(float), z["gy"].astype(float), z["back"].astype(float)
    cents = _cloud_centroids(back, gx, gy)
    tracks = load_tracks()
    t0 = C.T0.timestamp()
    w0, w1 = RELEASE_T0.timestamp(), RELEASE_T1.timestamp()

    rows = {}
    for mmsi, tr in tracks.items():
        t, lon, lat = tr["t"], tr["lon"], tr["lat"]

        # ---- AIS gaps = bracketed silences (>30 min) between pings ----
        gap_h = 0.0
        ghost = []                                # interpolated dark-track points
        for i in range(len(t) - 1):
            dt_s = t[i + 1] - t[i]
            if dt_s > 1800:
                a, b = t[i], t[i + 1]
                gap_h += max(0.0, (min(b, w1) - max(a, w0))) / 3600.0
                ng = int(dt_s // 600)
                gs = a + 600 * np.arange(1, ng + 1)
                frac = (gs - a) / dt_s
                ghost.append((gs,
                              lon[i] + frac * (lon[i + 1] - lon[i]),
                              lat[i] + frac * (lat[i + 1] - lat[i])))

        pre = t <= t0 - 1800                      # only before detection (no post-hoc bias)
        tp, lp, bp = list(t[pre]), list(lon[pre]), list(lat[pre])
        # ghost track counts as evidence of position during darkness
        for gs, gx_, gy_ in ghost:
            sel = gs <= t0 - 1800
            tp += list(gs[sel]); lp += list(gx_[sel]); bp += list(gy_[sel])
        tp, lp, bp = np.array(tp), np.array(lp), np.array(bp)
        if len(tp) == 0:
            tp, lp, bp = t[:1], lon[:1], lat[:1]
        hours_back = np.clip((t0 - tp) / 3600.0, 0, back.shape[0] - 1e-6)
        h0 = hours_back.astype(int)
        fh = hours_back - h0
        d1 = _sample_grid(back, h0, gx, gy, lp, bp)
        d2 = _sample_grid(back, np.clip(h0 + 1, 0, len(back) - 1), gx, gy, lp, bp)
        dens = d1 * (1 - fh) + d2 * fh
        # emphasise release-relevant look-back hours (8-24 h back); a vessel
        # loitering next to the slick at detection time is NOT illuminated
        w_h = np.clip((hours_back - 3.0) / 12.0, 0.01, 1.0) ** 1.5
        origin_mass = float((dens * w_h).sum() / w_h.sum())
        # time-consistency: mass restricted to the deep back-track hours
        deep = hours_back >= 9.0
        deep_hour_mass = float(dens[deep].mean()) if deep.sum() >= 3 else 0.0

        # ---- dump profile: best 3 h slow+steady sub-window in release window ----
        win = (t >= w0) & (t <= w1)
        dump_profile = 0.0
        if win.sum() >= 6:
            tw_, sw_, cw_ = t[win], tr["sog"][win], np.radians(tr["cog"][win])
            order = np.argsort(tw_)
            tw_, sw_, cw_ = tw_[order], sw_[order], cw_[order]
            n3 = max(1, int(3 * 3600 / 300))
            for s in range(0, len(tw_) - n3):
                seg_s = sw_[s:s + n3]
                seg_c = cw_[s:s + n3]
                slow = ((seg_s >= 3.0) & (seg_s <= 8.5)).mean()
                steady = abs(np.mean(np.exp(1j * seg_c)))
                dump_profile = max(dump_profile, float(slow) * float(steady))

        # ---- CPA to moving cloud centroid (km, incl. ghost points),
        #      restricted to look-back >= 6 h so that simply being near the
        #      slick shortly before detection earns nothing ----
        dkm = 999.0
        for i in range(len(tp)):
            if hours_back[i] < 6.0:
                continue
            h = min(int(hours_back[i]), len(cents) - 1)
            cx, cy = cents[h]
            dx = (lp[i] - cx) * 111.32 * math.cos(math.radians(bp[i]))
            dy = (bp[i] - cy) * 110.57
            dkm = min(dkm, math.hypot(dx, dy), 999.0)

        late = float(t.min() > C.T0.timestamp() - 4 * 3600)

        rows[mmsi] = dict(origin_mass=origin_mass,
                          deep_hour_mass=round(deep_hour_mass, 6),
                          gap_overlap_h=round(gap_h, 2),
                          dump_profile=round(dump_profile, 3),
                          cpa_km=round(dkm, 1), late_arrival=late)

    # relative masses (0-1 across the fleet)
    mx = max(1e-12, max(r["origin_mass"] for r in rows.values()))
    mx_d = max(1e-12, max(r["deep_hour_mass"] for r in rows.values()))
    for r in rows.values():
        r["origin_mass"] = round(r["origin_mass"] / mx, 4)
        r["deep_hour_mass"] = round(r["deep_hour_mass"] / mx_d, 4)
    return rows, tracks


def to_matrix(rows):
    df = pd.DataFrame(rows).T[FEATURE_NAMES].astype(float)
    return df


if __name__ == "__main__":
    rows, _ = compute_features()
    df = to_matrix(rows).sort_values("origin_mass", ascending=False)
    print(df.round(3).head(8).to_string())
