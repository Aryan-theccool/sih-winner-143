# Animation improvement plans — OriginTrace frontend

Commit baseline: `f5a6b47` · Skill: [improve-animations](https://github.com/emilkowalski/skills)

| # | Plan | Severity | Status |
|---|------|----------|--------|
| 001 | Motion tokens + fix reduced-motion | HIGH | DONE |
| 002 | Modal enter (scale 0.95 + opacity) | MEDIUM | DONE |
| 003 | Panel content enter on nav change | MEDIUM | DONE |
| 004 | Button press feedback | MEDIUM | DONE |
| 005 | Dossier step transitions | LOW | DONE |

## Audit summary

Professional geospatial dashboard — motion should stay **crisp under 300ms**, ease-out on enter, no animation on high-frequency map mode toggles. Map vessel replay uses rAF (correct for dynamic sim); UI chrome was mostly static with an overly aggressive reduced-motion global nuke.

## Execution order

001 → 002 → 003 → 004 → 005 (001 is prerequisite for all others)
