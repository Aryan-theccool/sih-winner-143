"""Geography helpers — coastline model + conversions."""
import numpy as np
from . import config as C


def coast_lon_at(lat) -> np.ndarray:
    """Longitude of the coastline for given latitude(s). East of it = land."""
    lats = np.array([p[0] for p in C.COASTLINE])
    lons = np.array([p[1] for p in C.COASTLINE])
    lat = np.asarray(lat, dtype=float)
    return np.interp(lat, lats, lons)


def is_land(lon, lat) -> np.ndarray:
    lon = np.asarray(lon, dtype=float)
    lat = np.asarray(lat, dtype=float)
    return lon > coast_lon_at(lat)


def coastline_geojson():
    coords = [[lon, lat] for lat, lon in C.COASTLINE]
    # build a crude land polygon to fill east of the coast inside the AOI
    bbox = C.AOI
    poly = coords + [[bbox["lon_max"], bbox["lat_max"]],
                     [bbox["lon_max"], bbox["lat_min"]]]
    return {
        "type": "FeatureCollection",
        "features": [
            {"type": "Feature", "properties": {"kind": "coastline"},
             "geometry": {"type": "LineString", "coordinates": coords}},
            {"type": "Feature", "properties": {"kind": "land"},
             "geometry": {"type": "Polygon", "coordinates": [poly]}},
        ],
    }


def deg_per_meter(lat):
    return 1.0 / C.M_PER_DEG_LAT, 1.0 / C.m_per_deg_lon(lat)
