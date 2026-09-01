"""
Train the U-Net on SAR chips.

Use on a GPU machine with real Sentinel-1 scenes + labels (e.g. a Zenodo
oil-spill dataset), or with `--synthetic` on chips produced by the same
physics generator used for the demo case — handy for smoke-testing the
full deep path without downloading 1 GB scenes:

    pip install -r requirements-ml-gpu.txt
    python -m ml.train_unet --synthetic --epochs 15 --out ml/weights/unet_sar.pt

Once `ml/weights/unet_sar.pt` exists, F1 uses the network automatically.
"""
import argparse
import numpy as np
from common import config as C


def make_synthetic_chip(rng, size=128):
    """Speckled ocean with a random dark slick (matches demo-case physics)."""
    wspd = rng.uniform(3.5, 10)
    nrcs = (0.16 + 0.045 * wspd) * np.ones((size, size))
    nrcs += 0.03 * np.sin(np.linspace(0, 6, size))[None, :] * \
        np.cos(np.linspace(0, 5, size))[:, None]
    nrcs *= rng.gamma(3.0, 1 / 3.0, (size, size))
    mask = np.zeros((size, size), np.float32)
    if rng.random() < 0.85:  # slick chip
        cx, cy = rng.integers(25, size - 25, 2)
        yy, xx = np.mgrid[0:size, 0:size]
        a = rng.uniform(8, 30); b = rng.uniform(4, 14)
        th = rng.uniform(0, np.pi)
        r = (((xx - cx) * np.cos(th) + (yy - cy) * np.sin(th)) / a) ** 2 + \
            (((xx - cx) * np.sin(th) - (yy - cy) * np.cos(th)) / b) ** 2
        blob = np.exp(-r)
        from scipy.ndimage import gaussian_filter
        blob = gaussian_filter(blob, 1.5)
        damp = rng.uniform(0.4, 0.7) * np.clip(blob / blob.max(), 0, 1)
        nrcs *= (1 - damp)
        mask[blob / blob.max() > 0.45] = 1.0
    db = 10 * np.log10(np.clip(nrcs, 1e-3, None)).astype(np.float32)
    return db[None, :, :], mask[None, :, :]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--synthetic", action="store_true")
    ap.add_argument("--epochs", type=int, default=15)
    ap.add_argument("--batch", type=int, default=8)
    ap.add_argument("--chips", type=int, default=400)
    ap.add_argument("--out", default=str(C.ROOT / "ml" / "weights" / "unet_sar.pt"))
    args = ap.parse_args()

    import torch
    from torch.utils.data import Dataset, DataLoader
    from .unet_model import UNet, dice_loss

    assert args.synthetic, "real-dataset loader: plug a Zenodo dataset folder here"

    class ChipDS(Dataset):
        def __init__(self, n): self.n = n
        def __len__(self): return self.n
        def __getitem__(self, i):
            rng = np.random.default_rng(i)
            x, y = make_synthetic_chip(rng)
            return torch.from_numpy((x - x.mean()) / (x.std() + 1e-6)), torch.from_numpy(y)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    dl = DataLoader(ChipDS(args.chips), batch_size=args.batch, shuffle=True)
    model = UNet().to(device)
    opt = torch.optim.AdamW(model.parameters(), lr=2e-3)
    bce = torch.nn.BCEWithLogitsLoss()
    for ep in range(args.epochs):
        tot = 0.0
        for x, y in dl:
            x, y = x.to(device), y.to(device)
            logits = model(x)
            loss = 0.5 * bce(logits, y) + dice_loss(logits, y)
            opt.zero_grad(); loss.backward(); opt.step()
            tot += loss.item() * len(x)
        print(f"epoch {ep+1:02d}/{args.epochs}  loss={tot/args.chips:.4f}")
    from pathlib import Path
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    torch.save({"state_dict": model.state_dict(), "base": 32}, args.out)
    print(f"saved -> {args.out}")


if __name__ == "__main__":
    main()
