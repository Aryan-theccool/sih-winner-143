# Demo Script — 90 seconds (mapped to actual UI clicks)

Rehearse 3×. Buttons below are the real UI controls.

| Time | Say | Click |
|------|-----|-------|
| 0–12s | "Illegal oil dumping Indian waters mein hota hai. Aaj tak koi system ye nahi bata sakta ki spill KAHAN se aur KAB shuru hua." | — |
| 12–25s | "Ye Sentinel-1 SAR scene hai Kerala coast ka. System ne oil slick detect kiya — red. Aur dekhiye: ye amber patch oil NAHI hai — wind sirf 1.7 m/s hai wahan, isliye look-alike. Detection reliable sirf 3–12 m/s mein." | Tab **detection** → toggle *low-detectability wind mask* ON/OFF |
| 25–45s | "Ab main time peeche le jaata hoon. 350 particles slick se backward advect ho rahe hain — current + windage + diffusion. Dekhiye cloud kaise badhta hai… 24 ghante peeche, release zone yahan lock hota hai. **YE KOI SYSTEM NAHI KARTA ABHI TAK.**" | Tab **origin** → **▶ run the time machine** (cloud animates 0→−24h, ships sync automatically) |
| 45–60s | "Isi window mein 20 vessels thin. Ye rahi suspect #1 — MT KAVERI STAR. Dekhiye: dashed segment — **AIS release ke EXACT time pe dark** tha. Ghost track origin pe se guzarta hai." | **sync ships ⇄ cloud** then slider to **T−18h**, suspect #1 passes the amber star; click its dot for the vessel card |
| 60–75s | "LightGBM ne score kiya — SHAP se EXPLAIN hota hai kyun: origin-cloud match +4.3, deep-hour coincidence +3.5, gap +2.2, slow-steady steaming +2.4. Aur ye tanker? Detection KE BAAD aaya — **exonerated**." | Tab **suspects** → cards show bars + reason bullets; scroll to *exonerated* |
| 75–90s | "Export: legal evidence package. UNCLOS Art 220(3) — tip-and-cue grade. ICG isse boarding request kar sakta hai; detention ke liye chemical fingerprinting chahiye — ye line hum clearly maante hain. Har artifact SHA-256 sealed hai." | Tab **evidence** → **⬇ download evidence.pdf**, open page 1 |

## Fallback rules
- Internet dead? Demo phir bhi chalega — basemap ka fallback dark canvas + embedded coastline hai; all data `/api` se local.
- Kuch bhi toote → browser refresh; outputs precomputed hain, stateless UI hai.
- Accuracy poochhe? → "Origin estimate ~1–2 km indicative on this calibrated case; production pe real SAR/AIS latency decide karega."

## Numbers to quote confidently
- 24 h backward horizon · 350 particles · RK2 + diffusion
- Detection gate: wind 3–12 m/s (physical, Bragg damping)
- #1 score 1.000 vs #2 0.79 vs lurker 0.001 — corroborated multi-evidence separation
- Truth-check on case: origin recovered to ~1 km
