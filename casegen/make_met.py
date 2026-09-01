"""
Generate the ERA5-like wind subset and CMEMS-like current subset (NetCDF).

Synthetic but physically plausible SW-monsoon fields for mid-June off Kerala:
  * winds from the SW (~6 m/s) with a spatially varying curl
  * a low-wind (<3 m/s) convergence patch -> SAR look-alike + low detectability
  * alongshore south-eastward coastal current (~0.15 m/s) + weak eddy + tidal wobble
"""
import datetime as dt
import numpy as np
from netCDF4 import Dataset, date2num

from common import config as C

GRID_STEP = 0.25
HOURS = list(range(-48, 13))            # T0-48h .. T0+12h hourly


def _grid():
    lons = np.arange(C.AOI["lon_min"], C.AOI["lon_max"] + GRID_STEP, GRID_STEP)
    lats = np.arange(C.AOI["lat_min"], C.AOI["lat_max"] + GRID_STEP, GRID_STEP)
    return lons, lats


def _times():
    return np.array([C.T0 + dt.timedelta(hours=h) for h in HOURS])


def wind_field():
    """Return (times, lats, lons, u10, v10) arrays."""
    lons, lats = _grid()
    times = _times()
    LON, LAT = np.meshgrid(lons, lats)
    n_t = len(times)
    u10 = np.zeros((n_t,) + LON.shape)
    v10 = np.zeros_like(u10)
    # low-wind convergence patch (south-east part of the AOI)
    patch = np.exp(-(((LON - 76.30) / 0.50) ** 2 + ((LAT - 8.80) / 0.50) ** 2))
    for k, t in enumerate(times):
        slow = np.sin(2 * np.pi * k / 24.0)          # diurnal modulation
        u = 5.2 + 0.9 * np.sin((LAT - 8.3) * 1.7) + 0.5 * slow
        v = 4.5 + 0.8 * np.cos((LON - 74.9) * 1.4) + 0.4 * slow
        u = u - 4.5 * patch
        v = v - 4.3 * patch
        u10[k] = u
        v10[k] = v
    return times, lats, lons, u10.astype("f4"), v10.astype("f4")


def current_field():
    """Return (times, lats, lons, uo, vo) arrays (m/s)."""
    lons, lats = _grid()
    times = _times()
    LON, LAT = np.meshgrid(lons, lats)
    n_t = len(times)
    uo = np.zeros((n_t,) + LON.shape)
    vo = np.zeros_like(uo)
    # weak anticyclonic eddy centred offshore Kochi
    cx, cy = 75.9, 9.7
    dx, dy = (LON - cx) / 0.6, (LAT - cy) / 0.6
    eddy = np.exp(-(dx ** 2 + dy ** 2))
    for k in range(n_t):
        tide = np.sin(2 * np.pi * k / 12.42)          # semi-diurnal tide
        uo[k] = 0.06 + 0.13 * eddy * dy + 0.03 * tide
        vo[k] = -0.15 - 0.13 * eddy * dx + 0.03 * tide
    return times, lats, lons, uo.astype("f4"), vo.astype("f4")


def _write_nc(path, times, lats, lons, vars_dict, long_name):
    with Dataset(path, "w", format="NETCDF4") as ds:
        ds.createDimension("time", len(times))
        ds.createDimension("lat", len(lats))
        ds.createDimension("lon", len(lons))
        t = ds.createVariable("time", "f8", ("time",))
        t.units = "seconds since 1970-01-01 00:00:00"
        t[:] = date2num(list(times), t.units)
        la = ds.createVariable("lat", "f4", ("lat",)); la[:] = lats
        lo = ds.createVariable("lon", "f4", ("lon",)); lo[:] = lons
        for name, arr in vars_dict.items():
            v = ds.createVariable(name, "f4", ("time", "lat", "lon"), zlib=True)
            v.units = "m s-1"
            v[:] = arr
        ds.title = long_name
        ds.institution = "OriginTrace synthetic demo case (SIH-26143)"


def main():
    C.ensure_dirs()
    tw, la, lo, u10, v10 = wind_field()
    _write_nc(C.WIND_NC, tw, la, lo, {"u10": u10, "v10": v10},
              "ERA5-like hourly 10m wind, Kerala AOI subset (synthetic)")
    tc, la, lo, uo, vo = current_field()
    _write_nc(C.CURR_NC, tc, la, lo, {"uo": uo, "vo": vo},
              "CMEMS-like hourly surface currents, Kerala AOI subset (synthetic)")
    print(f"wind  -> {C.WIND_NC}  ({C.WIND_NC.stat().st_size/1e3:.0f} kB)")
    print(f"curr  -> {C.CURR_NC}  ({C.CURR_NC.stat().st_size/1e3:.0f} kB)")


if __name__ == "__main__":
    main()
