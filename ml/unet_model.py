"""
U-Net for SAR oil-slick segmentation (PyTorch).

This is the full deep-learning path (F1 upgrade): trained weights make
`ml/unet_inference.py` automatically switch from the physics-based
detector to this network. Kept import-safe without torch installed so the
CPU demo pipeline works everywhere.

    from ml.unet_model import UNet          # requires torch
    model = UNet(in_ch=1, base=32)
"""
try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    _HAS_TORCH = True
except ImportError:                          # pragma: no cover
    _HAS_TORCH = False
    nn = object  # type: ignore


if _HAS_TORCH:

    class _DoubleConv(nn.Module):
        def __init__(self, cin, cout):
            super().__init__()
            self.block = nn.Sequential(
                nn.Conv2d(cin, cout, 3, padding=1, bias=False),
                nn.BatchNorm2d(cout), nn.ReLU(inplace=True),
                nn.Conv2d(cout, cout, 3, padding=1, bias=False),
                nn.BatchNorm2d(cout), nn.ReLU(inplace=True),
            )

        def forward(self, x):
            return self.block(x)


    class UNet(nn.Module):
        """Compact U-Net — 1-ch dB SAR in, slick probability out."""

        def __init__(self, in_ch=1, base=32):
            super().__init__()
            self.d1 = _DoubleConv(in_ch, base)
            self.d2 = _DoubleConv(base, base * 2)
            self.d3 = _DoubleConv(base * 2, base * 4)
            self.d4 = _DoubleConv(base * 4, base * 8)
            self.pool = nn.MaxPool2d(2)
            self.u3 = nn.ConvTranspose2d(base * 8, base * 4, 2, stride=2)
            self.c3 = _DoubleConv(base * 8, base * 4)
            self.u2 = nn.ConvTranspose2d(base * 4, base * 2, 2, stride=2)
            self.c2 = _DoubleConv(base * 4, base * 2)
            self.u1 = nn.ConvTranspose2d(base * 2, base, 2, stride=2)
            self.c1 = _DoubleConv(base * 2, base)
            self.head = nn.Conv2d(base, 1, 1)

        def forward(self, x):
            s1 = self.d1(x)
            s2 = self.d2(self.pool(s1))
            s3 = self.d3(self.pool(s2))
            b = self.d4(self.pool(s3))
            x = self.c3(torch.cat([self.u3(b), s3], dim=1))
            x = self.c2(torch.cat([self.u2(x), s2], dim=1))
            x = self.c1(torch.cat([self.u1(x), s1], dim=1))
            return self.head(x)      # logits


    def dice_loss(logits, target, eps=1e-6):
        p = torch.sigmoid(logits)
        num = 2 * (p * target).sum() + eps
        den = p.sum() + target.sum() + eps
        return 1 - num / den
