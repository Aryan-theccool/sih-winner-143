"""
One-command end-to-end pipeline: casegen -> F1 detection -> F2 drift ->
F4 ranking -> F5 evidence.

    python -m pipeline.run_all                # full run (incl. synthetic casegen)
    python -m pipeline.run_all --no-casegen   # data already in casefiles/
"""
import sys
import time
import importlib

STEPS_CASEGEN = [
    ("casegen.make_met", "synthetic ERA5-like wind subset"),
    ("casegen.make_ais", "synthetic 48h AIS picture (20 vessels)"),
    ("casegen.make_sar", "synthetic Sentinel-1-like SAR scene"),
]
STEPS_PIPELINE = [
    ("ml.unet_inference", "F1 SAR oil-slick detection"),
    ("drift.opendrift_run", "F2 backward attribution + forward forecast"),
    ("ranking.rank", "F4 suspect ranking (LightGBM + TreeSHAP)"),
    ("evidence.make_pdf", "F5 evidence PDF (UNCLOS Art. 220(3))"),
]


def main():
    no_casegen = "--no-casegen" in sys.argv
    steps = ([] if no_casegen else STEPS_CASEGEN) + STEPS_PIPELINE
    t_all = time.time()
    for mod, label in steps:
        t0 = time.time()
        print(f"\n=== {label}  [{mod}] ===")
        importlib.import_module(mod)
        m = sys.modules[mod]
        if hasattr(m, "main"):
            m.main()
        elif hasattr(m, "run"):
            m.run()
        elif hasattr(m, "build"):
            m.build()
        print(f"    done in {time.time()-t0:.1f}s")
    print(f"\nPIPELINE COMPLETE in {time.time()-t_all:.1f}s")


if __name__ == "__main__":
    main()
