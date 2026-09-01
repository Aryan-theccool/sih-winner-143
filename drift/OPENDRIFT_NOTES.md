# Switching to real OpenDrift

`drift/opendrift_run.py` is a self-contained Lagrangian engine with the same
physics OpenOil uses: `dx/dt = current + windage·U10` (+ turbulent diffusion),
integrated backward in time. It exists so the demo runs with **zero heavy
dependencies and fully offline**.

On an ops machine you can swap the integrator for OpenDrift proper:

```python
from opendrift.models.openoil import OpenOil
from opendrift.readers import reader_netCDF_CF_generic as nc

o = OpenOil(loglevel=20)
o.add_reader(nc.Reader('casefiles/KERALA_2025_CASE01/inputs/currents/cmems_subset.nc'))
o.add_reader(nc.Reader('casefiles/KERALA_2025_CASE01/inputs/wind/era5_subset.nc'))
o.set_config('processes:diffusion', True)
o.set_config('drift:horizontal_diffusivity', 8.0)     # m^2/s — matches config.DIFFUSION_KH
o.seed_elements(lon=..., lat=..., time=cfg.T0, number=cfg.N_PARTICLES,
                radius=0)  # or seed across the slick polygon as we do
o.run(time_step=-600, steps=144)                      # 24 h BACKWARD (negative dt)
o.plot()                                              # or export positions -> KDE
```

Everything downstream (KDE clouds → `backtrack_hourly.geojson`, ranker,
PDF) consumes the same artifact files and needs no change.
