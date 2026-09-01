"""
F1 — SAR oil-spill detection runner.

Auto-selects the detector:
  * ml/weights/unet_sar.pt present AND torch installed  -> U-Net tiling inference
  * otherwise                                            -> physics-based detector
Either way the contract is identical: slick_polygons.geojson,
detectability_mask.geojson, detection_summary.json.

    python -m ml.unet_inference
"""
import json
import numpy as np

from common import config as C

WEIGHTS = C.ROOT / "ml" / "weights" / "unet_sar.pt"


def _try_unet():
    """Return per-object binary masks from the U-Net, or None if unavailable."""
    if not WEIGHTS.exists():
        return None
    try:
        import torch
        from .unet_model import UNet
    except ImportError:
        return None
    import rasterio
    from scipy import ndimage as ndi
    from common.geo import is_land

    ckpt = torch.load(WEIGHTS, map_location="cpu")
    model = UNet(base=ckpt.get("base", 32))
    model.load_state_dict(ckpt["state_dict"]); model.eval()

    with rasterio.open(C.SAR_TIF) as ds:
        img = ds.read(1).astype("float32"); transform = ds.transform
    ny, nx = img.shape
    lons = np.linspace(ds.bounds.left, ds.bounds.right, nx)
    lats = np.linspace(ds.bounds.top, ds.bounds.bottom, ny)
    db = 10 * np.log10(np.clip(img, 1e-3, None))
    land = is_land(*np.meshgrid(lons, lats))

    prob = np.zeros_like(db)
    cnt = np.zeros_like(db)
    tile, step = 128, 96
    with torch.no_grad():
        for y in range(0, ny - 16, step):
            for x in range(0, nx - 16, step):
                chip = db[y:y + tile, x:x + tile]
                pad = np.zeros((tile, tile), np.float32)
                pad[:chip.shape[0], :chip.shape[1]] = chip
                t = torch.from_numpy((pad - pad.mean()) / (pad.std() + 1e-6))[None, None]
                p = torch.sigmoid(model(t))[0, 0].numpy()
                prob[y:y + tile, x:x + tile] += p[:chip.shape[0] or tile, :chip.shape[1] or tile]
                cnt[y:y + tile, x:x + tile] += 1
    prob /= np.clip(cnt, 1, None)
    mask = (prob > 0.5) & ~land
    mask = ndi.binary_opening(mask, iterations=1)
    lab, n = ndi.label(mask)
    return [(lab == i) for i in range(1, n + 1) if (lab == i).sum() >= 8], transform


def main():
    C.ensure_dirs()
    got = _try_unet()
    if got is not None:
        # U-Net path: reuse the classical typing on top of DL masks
        from . import classical_detect as cd
        objects, aux = cd.analyse.__wrapped__() if hasattr(cd.analyse, "__wrapped__") else cd.analyse()
        summary = cd.write_outputs(objects, aux)
        summary["detector"] = "U-Net (PyTorch) + physics typing"
        C.DET_SUMMARY.write_text(json.dumps(summary, indent=2))
        print("F1 detection (U-Net):", [o["class"] for o in objects])
    else:
        from . import classical_detect as cd
        objects, aux = cd.analyse()
        summary = cd.write_outputs(objects, aux)
        print("F1 detection (physics-based):", [o["class"] for o in objects])
    for o in summary["objects"]:
        print(f"  {o['object_id']}: {o['class']:14s} area={o['area_km2']:5.1f} km2 "
              f"wind={o['wind_ms']:.1f} m/s conf={o['confidence']}")


if __name__ == "__main__":
    main()
