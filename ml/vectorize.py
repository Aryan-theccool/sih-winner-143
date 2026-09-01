"""Shared raster-mask -> GeoJSON polygon vectorisation."""
import numpy as np
import rasterio.features
from shapely.geometry import shape, mapping


SIMPLIFY_TOL_DEG = 0.0012     # ~130 m — keeps GeoJSON light


def mask_to_polygon(mask: np.ndarray, transform):
    """Largest polygon of a binary mask (lon/lat via affine transform)."""
    if mask.sum() == 0:
        return None
    polys = []
    for geom, val in rasterio.features.shapes(mask.astype("uint8"),
                                              mask=mask.astype(bool),
                                              transform=transform):
        if val == 1:
            polys.append(shape(geom))
    if not polys:
        return None
    poly = max(polys, key=lambda p: p.area)
    poly = poly.simplify(SIMPLIFY_TOL_DEG, preserve_topology=True)
    return poly


def grid_binary_to_polygons(binary: np.ndarray, transform, min_area_deg2=0.002):
    """All polygons of a binary grid (used for the wind detectability mask)."""
    feats = []
    for geom, val in rasterio.features.shapes(binary.astype("uint8"),
                                              mask=binary.astype(bool),
                                              transform=transform):
        if int(val) != 1:
            continue
        p = shape(geom).simplify(SIMPLIFY_TOL_DEG, preserve_topology=True)
        if p.is_valid and p.area >= min_area_deg2:
            feats.append(p)
    return feats
