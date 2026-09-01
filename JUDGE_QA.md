# Judge Q&A — Ready Answers (SIH-26143)

## Novelty
**Q. EMSA CleanSeaNet toh pehle se hai — tumhara system alag kaise?**
CleanSeaNet detect karta hai aur CURRENT ships ko match karta hai. Koi operational
system backward nahi jaata: "spill kahan se aur kab shuru hua" — ye temporal
attribution koi nahi karta. Hum 24h backward Lagrangian advection se origin
cloud nikaalte hain, phir HISTORICAL AIS se match karte hain. OOSA (INCOIS)
forward forecast karta hai, detection nahi. Venn diagram: hum dono ko join karte
hain + backward direction add karte hain.

**Q. Backward simulation physically kaise sahi hai?**
Slick advection current + windage (3% of U10) se hota hai — backward integration
negative time step + diffusion as uncertainty growth. Time-reversal of advection
is standard for source attribution (same maths as air-pollution back-trajectories,
e.g., HYSPLIT). Koi "inverse physics" trick nahi — forward operator ko negative
dt pe integrate karna.

## Accuracy
**Q. Origin estimate kitna accurate hai?**
Calibrated demo case pe ~1 km (ground truth known by construction).
Production accuracy SAR revisit latency, current-field resolution, aur spill age
pe depend karegi — indicative 1–10 km for < 24h-old spills. Isliye hum cloud
PROBABILITY dete hain, point nahi — p50/p90 contours.

**Q. False positives?**
Do layers: (1) wind gate 3–12 m/s — Bragg damping physics ke bahar ka dark spot
look-alike type hota hai (demo mein amber patch exactly ye hai);
(2) ranker multi-evidence hai — sirf proximity se koi convict nahi hota;
lurker vessel 0.001 score + CLEARED verdict iska proof hai.

## Legal
**Q. Ye court mein use ho sakta hai?**
Direct nahi — aur ye deliberately design hai. UNCLOS Art. 220(3): "clear grounds"
pe coastal state INFORMATION maang sakti hai. Hum tip-and-cue hain. 220(5)
boarding + 220(6) detention ke liye chemical fingerprinting (oil sample match)
chahiye — PDF mein ye tier explicitly likha hai. Over-claim karna evidence ko
court mein weak karta deta.

## Engineering
**Q. Real data pe kaam karega kab?**
Interfaces real-data-ready: Sentinel-1 GRD (Copernicus Data Space), ERA5 (CDS
API), CMEMS currents, aisstream.io. Synthetic case sirf demo casefile hai —
`casefiles/` mein real files daalo, `pipeline.run_all --no-casegen`. U-Net GPU
path ready hai (`ml/train_unet.py`); demo CPU baseline physics-based detector
use karta hai.

**Q. Ship dark ho gayi toh kaise pakda?**
Gap hi evidence hai. Hum ghost-track interpolate karte hain gap ke across
(endpoints ko join karke), phir origin cloud se check karte hain. Demo mein
polluter ka gap exactly release window pe tha — score +2.2 SHAP weight mila.
"AIS band kiya" khud suspicious behavior hai.

**Q. Scale hoga? 20 ships se zyada?**
Ranking cost per vessel trivial hai (feature extraction O(pings×hours)). Bottleneck
sirf drift sim ho sakta hai jo detections pe parallel chalega. AIS feeds regional
hote hain — AOI-window subset pe kaam karte hain.

**Q. Currents/wind data haar jagah milega?**
CMEMS global hai (1/12°); ERA5 global hourly. Coastal high-res models (INCOIS
regional) plug ho sakte hain better accuracy ke liye.

## Process
**Q. Agar 2-3 ships saath mein cloud cross karein?**
System unko sabko rank karta hai — isliye PDF top-3 deta hai, verdict nahi.
I&C investigation decide karti hai boarding priority. Corroborating signals
(gap, slow-steady) separate karte hain; V2 (0.79, clean AIS) advisory-level
suspect hai, V1 (1.0, dark + dumping profile) primary.
