"""
F4b — train the LightGBM suspect ranker.

Labels come from a calibrated generative model of "polluter vs innocent"
feature vectors (documented, synthetic — matching the synthetic demo case;
on ops data this module is re-pointed at confirmed incident labels).

The generative story:
  polluter  -> strong origin mass AND typically corroborated by gap /
               dump profile / close CPA, late arrival ~ never
  innocent  -> at most ONE weakly-suspicious feature, usually none
"""
import numpy as np
import lightgbm as lgb

from common import config as C
from .features import FEATURE_NAMES

SEED = 143

def _make_samplers(rng):
    """Bind generator-scoped samplers (deterministic training data)."""
    return rng.beta, rng.gamma, rng.random



def synthesize(n=6000, rng=None):
    rng = rng or np.random.default_rng(SEED)
    y = rng.random(n) < 0.18
    rng_beta, rng_gamma, rng_random = _make_samplers(rng)

    def col(name, poll, inn):
        out = np.empty(n)
        out[y] = poll(int(y.sum()))
        out[~y] = inn(int((~y).sum()))
        return out

    # Archetypes the model must separate:
    #  polluter : time-consistent origin crossing + USUALLY corroborated
    #             (gap and/or dump profile), but sometimes clean-AIS
    #  innocent : at most weak proximity; "passerby" variant crosses the
    #             zone but only at shallow, time-INconsistent hours
    n_inn = int((~y).sum())
    passerby = rng_random(n_inn) < 0.12
    # "lurker" archetype: slow/close near the slick but only at shallow,
    # release-INconsistent hours (deep_hour_mass ~ 0) -> innocent
    lurker = rng_random(n_inn) < 0.10
    inn_mass = rng_beta(1.4, 4.5, n_inn)
    inn_mass[passerby] = rng_beta(4.0, 3.0, int(passerby.sum()))
    inn_mass[lurker] = rng_beta(3.5, 3.0, int(lurker.sum()))
    inn_gap = np.where(rng_random(n_inn) < 0.08, rng_gamma(1.2, 1.0, n_inn), 0.0)
    inn_gap[passerby | lurker] = 0.0
    inn_deep = rng_beta(0.9, 5.0, n_inn)
    inn_deep[passerby] = rng_beta(1.5, 6.0, int(passerby.sum()))
    inn_deep[lurker] = rng_beta(0.8, 6.0, int(lurker.sum()))

    k_p = int(y.sum())
    poll_has_gap = rng_random(k_p) < 0.45
    poll_clean_dump = rng_random(k_p) < 0.40

    X = {
        "origin_mass": col("origin_mass",
                           lambda k: rng_beta(5, 2.2, k),
                           lambda k: inn_mass),
        "deep_hour_mass": col("deep_hour_mass",
                              lambda k: rng_beta(4.0, 2.4, k),
                              lambda k: inn_deep),
        "gap_overlap_h": col("gap_overlap_h",
                             lambda k: np.where(poll_has_gap,
                                                rng_gamma(2.2, 1.8, k),
                                                np.zeros(k)),
                             lambda k: inn_gap),
        "dump_profile": col("dump_profile",
                            lambda k: np.where(poll_clean_dump,
                                               rng_beta(1.8, 3.5, k),
                                               rng_beta(4.5, 2.0, k)),
                            lambda k: np.where(passerby, 0.0,
                                               np.where(lurker,
                                                        rng_beta(2.5, 4.0, n_inn),
                                                        rng_beta(1.6, 3.5, n_inn)))),
        "cpa_km": col("cpa_km",
                      lambda k: rng_gamma(1.6, 4.0, k),
                      lambda k: np.where(lurker, rng_gamma(2.0, 3.0, n_inn),
                                         rng_gamma(3.0, 16.0, n_inn))),
        "late_arrival": col("late_arrival",
                            lambda k: (rng_random(k) < 0.01).astype(float),
                            lambda k: (rng_random(k) < 0.12).astype(float)),
    }
    import pandas as pd
    return pd.DataFrame(X)[FEATURE_NAMES], y.astype(int)


def train():
    X, y = synthesize()
    model = lgb.LGBMClassifier(
        n_estimators=220, learning_rate=0.06, num_leaves=15,
        min_child_samples=40, subsample=0.9, colsample_bytree=0.9,
        objective="binary", random_state=SEED)
    model.fit(X, y)
    import sklearn.metrics  # noqa: F401  (sanity import)
    from sklearn.model_selection import cross_val_score
    auc = cross_val_score(model, X, y, cv=3, scoring="roc_auc").mean()
    model.fit(X, y)
    model.booster_.save_model(str(C.RANKER_MODEL))
    print(f"ranker trained: cv-auc={auc:.3f} -> {C.RANKER_MODEL}")
    return model


if __name__ == "__main__":
    train()
