"""
F4c — score the fleet, explain with TreeSHAP (LightGBM pred_contrib),
and emit suspects.json consumed by the UI + the evidence PDF.

    python -m ranking.train_ranker     # once (or it auto-trains on first run)
    python -m ranking.rank
"""
import json
import datetime as dt
import numpy as np
import lightgbm as lgb

from common import config as C
from .features import compute_features, to_matrix, FEATURE_NAMES, RELEASE_T0, RELEASE_T1
from . import train_ranker


REASON_TEMPLATES = {
    "origin_mass": ("backtrack origin-cloud probability along track (time-weighted)",
                    "track intersects the reconstructed origin cloud at plausible times"),
    "deep_hour_mass": ("cloud probability at deep back-track hours (9-24 h back)",
                       "position coincides with the cloud at release-relevant hours"),
    "gap_overlap_h": ("AIS silence inside the estimated release window",
                      "vessel went dark for {:.1f} h inside the release window"),
    "dump_profile": ("slow & steady steaming (operational-discharge signature)",
                     "best 3 h sub-window shows slow, straight-run steaming"),
    "cpa_km": ("closest point of approach to the reconstructed spill trajectory",
               "closest approach {:.0f} km to the reconstructed release locus"),
    "late_arrival": ("arrival after the detection time",
                     "exoneration: first appears only after the detection window"),
}


def _reasons(contrib, feats):
    out = []
    order = np.argsort(-np.abs(contrib))
    for i in order:
        name = FEATURE_NAMES[i]
        c = float(contrib[i])
        if abs(c) < 0.15:
            continue
        label, template = REASON_TEMPLATES[name]
        val = feats[name]
        try:
            txt = template.format(val)
        except Exception:
            txt = label
        out.append({"feature": name, "direction": "raises" if c > 0 else "lowers",
                    "weight": round(c, 3), "text": txt, "value": round(float(val), 3)})
    return out[:6]


VERDICTS = [
    (0.85, "PRIMARY SUSPECT"),
    (0.30, "SUSPECT — CORROBORATE"),
    (0.05, "POSSIBLE · ADVISORY ONLY"),
    (0.00, "CLEARED"),
]


def _verdict(score, feats):
    late = feats["late_arrival"] > 0.5 or (
        feats["origin_mass"] < 0.02 and feats["cpa_km"] > 45)
    if late:
        return "EXONERATED"
    for thr, v in VERDICTS:
        if score >= thr:
            return v
    return "CLEARED"


def run():
    X_df, tracks = (None, None)
    rows, tracks = compute_features()
    X_df = to_matrix(rows)

    if C.RANKER_MODEL.exists():
        booster = lgb.Booster(model_file=str(C.RANKER_MODEL))
    else:
        booster = train_ranker.train().booster_

    scores = booster.predict(X_df)
    shap = booster.predict(X_df, pred_contrib=True)[:, :-1]   # drop bias term

    ranking = []
    for i, mmsi in enumerate(X_df.index):
        meta = tracks[mmsi]["meta"]
        feats = X_df.loc[mmsi].to_dict()
        ranking.append({
            "mmsi": mmsi,
            "name": meta.get("name", mmsi),
            "type": meta.get("type", "?"),
            "flag": meta.get("flag", "?"),
            "length_m": meta.get("length_m"),
            "score": round(float(scores[i]), 3),
            "features": {k: round(float(v), 3) for k, v in feats.items()},
            "shap": {FEATURE_NAMES[j]: round(float(shap[i, j]), 3)
                     for j in range(len(FEATURE_NAMES))},
            "reasons": _reasons(shap[i], feats),
            "verdict": _verdict(float(scores[i]), feats),
            "exonerated": bool(feats["late_arrival"] > 0.5 or
                               (feats["origin_mass"] < 0.02 and feats["cpa_km"] > 45)),
        })
    ranking.sort(key=lambda r: -r["score"])
    for i, r in enumerate(ranking):
        r["rank"] = i + 1
        r["top3"] = i < 3

    out = {
        "generated_at": C.T0.isoformat(),
        "model": "LightGBM binary classifier (synthetic-calibrated) + TreeSHAP "
                 "(pred_contrib) explanations",
        "release_window_utc": [RELEASE_T0.isoformat(), RELEASE_T1.isoformat()],
        "n_vessels": len(ranking),
        "ranking": ranking,
        "synthetic_case_truth": {
            "true_polluter": "419000001 (MT KAVERI STAR)",
            "note": "demo case is synthetic; truth known by construction"},
    }
    C.SUSPECTS_JSON.write_text(json.dumps(out, indent=1))
    print("F4 ranking (top 5):")
    for r in ranking[:5]:
        print(f"  #{r['rank']} {r['name']:<22s} score={r['score']:.3f} "
              f"mass={r['features']['origin_mass']:.2f} gap={r['features']['gap_overlap_h']}h "
              f"dump={r['features']['dump_profile']} cpa={r['features']['cpa_km']}km")
    return out


if __name__ == "__main__":
    run()
