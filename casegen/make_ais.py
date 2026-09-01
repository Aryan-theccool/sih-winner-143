"""
Generate the synthetic 48 h AIS traffic picture (20 vessels, 5-min pings).

Designed scenario (ground truth baked in for scoring/plausibility):
  * V900001 MT KAVERI STAR (tanker) — crosses the TRUE release point at the
    TRUE release time, slow + steady (operational discharge profile), AIS
    silent across the release window  => the real polluter.
  * V900002 MV MALABAR TRADER — passes edge of origin cloud, clean AIS.
  * V900003 FV OCEAN PEARL — fishing wanderer, near origin but AFTER release.
  * V900004 MT COROMANDEL GRACE — late arrival (exoneration case).
  * V900005 KMV NEELAKANTA — passenger ferry, crossed long before (time filter).
  * V900007 — coastal freighter with an AIS gap OUTSIDE the window (red herring).
  * 14 more: coastal-lane freighters, fishing fleet, tug, dredger.
"""
import json
import math
import datetime as dt
import numpy as np
import pandas as pd

from common import config as C
from common.geo import coast_lon_at

STEP_S = 300          # 5-minute pings
KN = 0.514444


def _h(x):
    return C.T0 + dt.timedelta(hours=x)


def _flat_km(lon, lat):
    x = lon * 111.32 * math.cos(math.radians(9.5))
    y = lat * 110.57
    return x, y


def route_from_timed_waypoints(twps, t_start, t_end):
    """twps: [(datetime, lon, lat)] -> per-STEP_S (lon,lat,sog,cog) until last wp."""
    ts = np.array([w[0].timestamp() for w in twps])
    lons = np.array([w[1] for w in twps])
    lats = np.array([w[2] for w in twps])
    t0, t1 = t_start.timestamp(), t_end.timestamp()
    grid = np.arange(max(t0, ts[0]), min(t1, ts[-1]) + 1, STEP_S)
    lon = np.interp(grid, ts, lons)
    lat = np.interp(grid, ts, lats)
    # kinematics from step deltas
    dl = np.diff(_flat_km(lon, lat)[0]), np.diff(_flat_km(lon, lat)[1])
    dist = np.hypot(*dl) * 1000.0
    sog = np.concatenate([[dist[0] / STEP_S if len(dist) else 0], dist / STEP_S]) / KN
    cog = np.degrees(np.arctan2(np.diff(_flat_km(lon, lat)[0], prepend=_flat_km(lon, lat)[0][0]),
                                np.diff(_flat_km(lon, lat)[1], prepend=_flat_km(lon, lat)[1][0]))) % 360
    return grid, lon, lat, sog, cog


def anchored(twps, anchor_until):
    """Append zero-speed anchoring after last waypoint."""
    t_last = twps[-1][0].timestamp()
    grid = np.arange(t_last + STEP_S, anchor_until.timestamp(), STEP_S)
    lon = np.full_like(grid, twps[-1][1], dtype=float)
    lat = np.full_like(grid, twps[-1][2], dtype=float)
    sog = np.zeros_like(grid)
    cog = np.zeros_like(grid)
    return grid, lon, lat, sog, cog


def fishing_walk(center, t_start, t_end, seed, speed_kn=3.5, radius_deg=0.22):
    rng = np.random.default_rng(seed)
    grid = np.arange(t_start.timestamp(), t_end.timestamp() + 1, STEP_S)
    n = len(grid)
    head = rng.uniform(0, 2 * np.pi)
    lon = np.empty(n); lat = np.empty(n)
    lon[0], lat[0] = center
    for i in range(1, n):
        head += rng.normal(0, 0.5)
        # confine
        dcx = (lon[i-1] - center[0]) * 111.32 * math.cos(math.radians(9.5))
        dcy = (lat[i-1] - center[1]) * 110.57
        if math.hypot(dcx, dcy) > radius_deg * 111:
            head = math.atan2(center[0] - lon[i-1], center[1] - lat[i-1]) + rng.normal(0, 0.3)
        sp = speed_kn * KN * STEP_S
        lat[i] = lat[i-1] + math.cos(head) * sp / 110570.0
        lon[i] = lon[i-1] + math.sin(head) * sp / (111320.0 * math.cos(math.radians(lat[i-1])))
    sog = np.full(n, speed_kn) + rng.normal(0, 0.4, n)
    cog = np.degrees(np.arctan2(np.diff(lon, prepend=lon[0]), np.diff(lat, prepend=lat[0]))) % 360
    return grid, lon, lat, np.clip(sog, 0.2, None), cog


VESSEL_META = [
    # mmsi, name, type, flag, length
    ("419000001", "MT KAVERI STAR",     "Crude Oil Tanker", "IN", 229),
    ("419000002", "MV MALABAR TRADER",  "Bulk Carrier",     "IN", 189),
    ("419000003", "FV OCEAN PEARL",     "Fishing",          "IN", 24),
    ("419000004", "MT COROMANDEL GRACE","Product Tanker",   "IN", 174),
    ("419000005", "KMV NEELAKANTA",     "Passenger Ferry",  "IN", 86),
    ("419000006", "MV PERIYAR EXPRESS", "Container Ship",   "IN", 210),
    ("419000007", "MV MALABAR COAST",   "General Cargo",    "IN", 140),
    ("419000008", "FV SEA BLOSSOM",     "Fishing",          "IN", 21),
    ("419000009", "MV KONKAN STAR",     "General Cargo",    "IN", 118),
    ("419000010", "FV BLUE FIN",        "Fishing",          "IN", 19),
    ("419000011", "MT SPICE ROUTE",     "Chemical Tanker",  "SG", 145),
    ("419000012", "FV SAGAR RANI",      "Fishing",          "IN", 22),
    ("419000013", "MV ARABIAN DAWN",    "Bulk Carrier",     "MH", 200),
    ("419000014", "TUG ALAPPUZHA",      "Tug",              "IN", 32),
    ("419000015", "FV KARAVALLI",       "Fishing",          "IN", 20),
    ("419000016", "MV MALDIVES TRADER", "Container Ship",   "MV", 160),
    ("419000017", "FV DEVI PRASAD",     "Fishing",          "IN", 18),
    ("419000018", "MV LAKSHADWEEP SEA", "Ro-Ro Cargo",      "IN", 122),
    ("419000019", "DREDGER CHAKRAM",    "Dredger",          "IN", 95),
    ("419000020", "FV MONSOON WING",    "Fishing",          "IN", 23),
]


def build_tracks():
    """Return dict mmsi -> (grid, lon, lat, sog, cog, gaps[(epoch,epoch)])."""
    tracks = {}
    t_start, t_end = C.AIS_START, C.AIS_END

    # --- V1 polluter: slow straight run STRAIGHT through the true origin at
    #     the release time (so even the gap-interpolated ghost track crosses it)
    twps = [(_h(-26), 74.98, 9.3193),
            (_h(-18), C.TRUE_ORIGIN_LON, C.TRUE_ORIGIN_LAT),
            (_h(-13), 76.02, 9.369),
            (_h(-9), 76.16, 9.80), (_h(-6), 76.24, 9.93)]
    g = route_from_timed_waypoints(twps, t_start, t_end)
    gap = (_h(-20).timestamp(), _h(-14).timestamp())         # straddles release
    keep = ~((g[0] >= gap[0]) & (g[0] <= gap[1]))
    tracks["419000001"] = [a[keep] if a.ndim else a for a in g] + [[gap]]

    # --- V2: clean bulk carrier, clips the reconstructed plume/cloud at T-10h ---
    twps = [(_h(-16), 76.20, 8.60), (_h(-10), 75.645, 9.38), (_h(-4), 75.15, 10.25)]
    g = route_from_timed_waypoints(twps, t_start, t_end)
    tracks["419000002"] = list(g) + [[]]

    # --- V3: fishing wanderer near origin AFTER release window ---
    g = fishing_walk((75.82, 9.30), _h(-9), t_end, seed=3, speed_kn=3.0, radius_deg=0.16)
    tracks["419000003"] = list(g) + [[]]

    # --- V4: innocent late arrival (exoneration case) ---
    twps = [(_h(-3), 75.05, 9.75), (_h(0), 75.75, 9.88)]
    tracks["419000004"] = list(route_from_timed_waypoints(twps, t_start, t_end)) + [[]]

    # --- V5: ferry crossing long before release (time-window filter case) ---
    twps = [(_h(-42), 76.22, 9.96), (_h(-38), 75.95, 10.35), (_h(-36), 75.80, 10.52)]
    tracks["419000005"] = list(route_from_timed_waypoints(twps, t_start, t_end)) + [[]]

    # --- V7: red herring — AIS gap but far away & outside window ---
    twps = [(_h(-46), 76.75, 8.45), (_h(-24), 76.45, 9.35), (_h(-12), 76.20, 10.25)]
    g = route_from_timed_waypoints(twps, t_start, t_end)
    gap7 = (_h(-40).timestamp(), _h(-36).timestamp())
    keep = ~((g[0] >= gap7[0]) & (g[0] <= gap7[1]))
    tracks["419000007"] = [a[keep] if a.ndim else a for a in g] + [[gap7]]

    # --- background coastal lane traffic (parallel to coast, ~0.35-0.6 deg offshore) ---
    lane_specs = {
        "419000006": (-0.38, +1, -47, 11.0),   # northbound
        "419000009": (-0.42, -1, -44, 10.0),   # southbound
        "419000011": (-0.34, +1, -40, 12.5),
        "419000013": (-0.55, -1, -46, 13.0),
        "419000016": (-0.48, +1, -38, 12.0),
        "419000018": (-0.30, -1, -36, 9.0),
    }
    for mmsi, (off, direc, h0, kn) in lane_specs.items():
        lat0 = 8.45 if direc > 0 else 10.55
        lat1 = 10.55 if direc > 0 else 8.45
        latm = 9.5
        wps_geo = [(coast_lon_at(lat0) + off, lat0),
                   (coast_lon_at(latm) + off, latm),
                   (coast_lon_at(lat1) + off, lat1)]
        # time legs from true great-circle-ish distance / declared speed
        dist_km = 0.0
        for (l0, a0), (l1, a1) in zip(wps_geo[:-1], wps_geo[1:]):
            dist_km += math.hypot((l1 - l0) * 111.32 * math.cos(math.radians(a0)),
                                  (a1 - a0) * 110.57)
        dur_h = dist_km / (kn * 1.852)
        tw = [(_h(h0), *wps_geo[0]), (_h(h0 + dur_h / 2), *wps_geo[1]),
              (_h(h0 + dur_h), *wps_geo[2])]
        g = route_from_timed_waypoints(tw, t_start, t_end)
        tracks[mmsi] = list(g) + [[]]

    # --- fishing fleet (clustered random walkers) ---
    fish_specs = {
        "419000008": ((76.35, 9.05), -30, 0, 8),
        "419000010": ((76.10, 9.55), -34, -2, 10),
        "419000012": ((76.50, 8.80), -28, -4, 12),
        "419000015": ((76.28, 9.70), -26, -1, 15),
        "419000017": ((76.60, 9.20), -32, -5, 17),
        "419000020": ((76.05, 9.10), -22, -3, 20),
    }
    for mmsi, (cen, h0, h1, seed) in fish_specs.items():
        tracks[mmsi] = list(fishing_walk(cen, _h(h0), _h(min(h1, 0)), seed=seed,
                                         speed_kn=np.random.default_rng(seed).uniform(2.5, 4.5))) + [[]]

    # --- tug: short trip near Kochi ---
    twps = [(_h(-14), 76.25, 9.95), (_h(-11), 76.02, 9.80), (_h(-8), 76.25, 9.95)]
    tracks["419000014"] = list(route_from_timed_waypoints(twps, t_start, t_end)) + [[]]

    # --- dredger: anchored the whole window ---
    g = np.arange(t_start.timestamp(), t_end.timestamp() + 1, STEP_S)
    tracks["419000019"] = [g, np.full_like(g, 76.24, dtype=float),
                           np.full_like(g, 9.96, dtype=float),
                           np.zeros_like(g, dtype=float), np.zeros_like(g, dtype=float), []]

    return tracks


def main():
    C.ensure_dirs()
    tracks = build_tracks()
    rows = []
    for mmsi, name, typ, flag, length in VESSEL_META:
        grid, lon, lat, sog, cog, gaps = tracks[mmsi]
        for i in range(len(grid)):
            rows.append((mmsi, dt.datetime.fromtimestamp(grid[i], dt.timezone.utc)
                         .strftime("%Y-%m-%dT%H:%M:%SZ"),
                         round(lon[i], 5), round(lat[i], 5),
                         round(float(sog[i]), 1), round(float(cog[i]) % 360, 0)))
    df = pd.DataFrame(rows, columns=["mmsi", "timestamp", "lon", "lat", "sog", "cog"])
    df = df.sort_values(["mmsi", "timestamp"])
    df.to_csv(C.AIS_CSV, index=False)

    meta = []
    for mmsi, name, typ, flag, length in VESSEL_META:
        grid, lon, lat, sog, cog, gaps = tracks[mmsi]
        meta.append({
            "mmsi": mmsi, "name": name, "type": typ, "flag": flag,
            "length_m": length,
            "ais_gaps": [
                {"start": dt.datetime.fromtimestamp(a, dt.timezone.utc).isoformat(),
                 "end": dt.datetime.fromtimestamp(b, dt.timezone.utc).isoformat()}
                for a, b in gaps
            ],
        })
    C.VESSELS_JSON.write_text(json.dumps({"vessels": meta}, indent=2))
    print(f"ais   -> {C.AIS_CSV}  ({len(df)} pings, {df.mmsi.nunique()} vessels)")


if __name__ == "__main__":
    main()
