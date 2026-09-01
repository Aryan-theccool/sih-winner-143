"""
Environmental field access (wind + currents) with space/time interpolation.

Loads the ERA5-like and CMEMS-like NetCDF subsets and exposes bilinear
spatial + linear temporal sampling — the same interface a real OpenDrift
environment reader provides, so the advection engine is drop-in compatible.
"""
import datetime as dt
import numpy as np
from scipy.interpolate import RegularGridInterpolator
from netCDF4 import Dataset, num2date

from common import config as C


class _Field:
    def __init__(self, nc_path, varname):
        with Dataset(nc_path) as ds:
            self.lons = ds["lon"][:].astype(float)
            self.lats = ds["lat"][:].astype(float)
            t = ds["time"]
            times = num2date(t[:], t.units)
            epochs = []
            for t_ in times:
                py = dt.datetime(t_.year, t_.month, t_.day, t_.hour, t_.minute,
                                 int(t_.second), tzinfo=dt.timezone.utc)
                epochs.append(py.timestamp())
            self.epochs = np.array(epochs)
            data = ds[varname][:].astype(float)  # (time, lat, lon)
        self.interp = RegularGridInterpolator(
            (self.epochs, self.lats, self.lons), data,
            bounds_error=False, fill_value=None,  # clamp/nearest at edges
        )

    def sample(self, lon, lat, epoch):
        """Vectorised sample. lon/lat arrays, epoch scalar or array."""
        epoch = np.broadcast_to(np.asarray(epoch, dtype=float), np.shape(lon))
        pts = np.stack([epoch, np.asarray(lat, float), np.asarray(lon, float)], axis=-1)
        pts[..., 0] = np.clip(pts[..., 0], self.epochs[0], self.epochs[-1])
        pts[..., 1] = np.clip(pts[..., 1], self.lats[0], self.lats[-1])
        pts[..., 2] = np.clip(pts[..., 2], self.lons[0], self.lons[-1])
        return self.interp(pts)


class FieldSet:
    """Wind (10 m) + surface currents, everything the particle engine needs."""

    def __init__(self, wind_nc=C.WIND_NC, curr_nc=C.CURR_NC):
        self.u10 = _Field(wind_nc, "u10")
        self.v10 = _Field(wind_nc, "v10")
        self.uo = _Field(curr_nc, "uo")
        self.vo = _Field(curr_nc, "vo")

    def current(self, lon, lat, epoch):
        return self.uo.sample(lon, lat, epoch), self.vo.sample(lon, lat, epoch)

    def wind(self, lon, lat, epoch):
        return self.u10.sample(lon, lat, epoch), self.v10.sample(lon, lat, epoch)

    def oil_drift_velocity(self, lon, lat, epoch):
        """Total slick drift = current + windage*wind (leeway + Stokes proxy)."""
        uc, vc = self.current(lon, lat, epoch)
        uw, vw = self.wind(lon, lat, epoch)
        return uc + C.WINDAGE * uw, vc + C.WINDAGE * vw


if __name__ == "__main__":
    fs = FieldSet()
    t = C.T0.timestamp()
    u, v = fs.oil_drift_velocity(np.array([C.TRUE_ORIGIN_LON]),
                                 np.array([C.TRUE_ORIGIN_LAT]), t)
    print(f"drift velocity at truth origin @T0: u={u[0]:.3f} m/s v={v[0]:.3f} m/s")
