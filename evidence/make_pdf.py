"""
F5 — Legal evidence package (PDF) with UNCLOS Art. 220(3) framing.

Deliberately framed as TIP-AND-CUE intelligence (request-for-information
grade), NOT detention-grade — the honesty is the point.

    python -m evidence.frames        # render map frames first
    python -m evidence.make_pdf
"""
import json
import hashlib
import datetime as dt

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Image,
                                Table, TableStyle, PageBreak, HRFlowable)

from common import config as C
from . import frames as frame_mod

INK = colors.HexColor("#0b1526")
ACCENT = colors.HexColor("#2ed5ff")
RED = colors.HexColor("#ff4757")
AMBER = colors.HexColor("#e8980c")


def _sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def build():
    C.ensure_dirs()
    frame_mod.render_all()
    det_sum = json.loads(C.DET_SUMMARY.read_text())
    manifest = json.loads(C.DRIFT_MANIFEST.read_text())
    sus = json.loads(C.SUSPECTS_JSON.read_text())
    meta = json.loads(C.SAR_META.read_text())

    ss = getSampleStyleSheet()
    st_h = ParagraphStyle("h", parent=ss["Heading1"], textColor=INK, fontSize=16,
                          spaceAfter=4)
    st_h2 = ParagraphStyle("h2", parent=ss["Heading2"], textColor=INK, fontSize=12.5,
                           spaceBefore=10, spaceAfter=4)
    st_b = ParagraphStyle("b", parent=ss["BodyText"], fontSize=8.6, leading=11.5)
    st_sm = ParagraphStyle("sm", parent=ss["BodyText"], fontSize=7.4, leading=9.4,
                           textColor=colors.HexColor("#44506a"))
    st_badge = ParagraphStyle("badge", parent=ss["BodyText"], fontSize=9.5,
                              leading=13, textColor=colors.white)

    story = []

    # ------------------------------------------------- header
    story.append(Paragraph("OriginTrace — Oil-Spill Attribution Evidence Package", st_h))
    story.append(Paragraph(
        f"Case: <b>KERALA_2025_CASE01</b> &nbsp;|&nbsp; Scene: "
        f"<font face='Courier' size=7.6>{meta['scene_id']}</font> &nbsp;|&nbsp; "
        f"Detection (UTC): <b>{meta['acquisition_time_utc']}</b><br/>"
        f"Generated: {dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%d %H:%MZ')} "
        f"&nbsp;|&nbsp; Prepared for: Indian Coast Guard (demo) &nbsp;|&nbsp; "
        f"SIH-26143 Team Aryan", st_b))
    story.append(Spacer(1, 4))
    badge = Table([[Paragraph(
        "<b>LEGAL TIER — UNCLOS Art. 220(3): TIP-AND-CUE.</b> This package provides "
        "<i>clear grounds</i> to request information from the flagged vessels "
        "(name, port of registry, cargo log). It is <b>NOT</b> detention-grade "
        "evidence: Art. 220(5) physical inspection and Art. 220(6) detention "
        "require boarding and chemical fingerprinting beyond this system.", st_badge)]],
        colWidths=[180 * mm])
    badge.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), INK),
        ("BOX", (0, 0), (-1, -1), 1.2, AMBER),
        ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
    story.append(badge)

    # ------------------------------------------------- F1 detection
    story.append(Paragraph("1 · Satellite Detection (Sentinel-1 SAR)", st_h2))
    rows = [["Object", "Class", "Area (km²)", "Contrast (dB)", "Wind (m/s)", "Conf."]]
    for o in det_sum["objects"]:
        rows.append([o["object_id"], o["class"], o["area_km2"], o["contrast_db"],
                     o["wind_ms"], o["confidence"]])
    _table(story, rows)
    story.append(Paragraph(
        "Detection is considered <b>reliable only in 3–12 m/s wind</b>; objects in "
        "low-wind are typed <i>look-alike</i> (see detectability mask on map layer).", st_sm))
    story.append(Image(str(C.EVIDENCE_FRAMES / "frame1_detection.png"),
                       width=180 * mm, height=118 * mm))

    # ------------------------------------------------- F2 origin
    story.append(PageBreak())
    story.append(Paragraph("2 · Backward Attribution (Origin Reconstruction)", st_h2))
    oe = manifest["origin_estimate"]
    story.append(Paragraph(
        f"{manifest['n_particles']} Lagrangian particles advected <b>backward</b> "
        f"{manifest['backtrack_hours']} h from the detected slick "
        f"(current + {manifest['physics']['windage']}×U10 windage + diffusion, "
        f"dt={manifest['physics']['dt_seconds']} s). Hourly KDE clouds → p10/p50/p90 "
        "probability-mass contours.", st_b))
    rows = [["Estimated origin", "Release window (UTC)", "Engine"],
            [f"{oe['lon']}E, {oe['lat']}N",
             f"{oe['estimated_release_window_utc'][0][:16]}Z  ->  "
             f"{oe['estimated_release_window_utc'][1][:16]}Z",
             "OriginTrace Lagrangian Engine v1.0"]]
    _table(story, rows, widths=[42, 78, 60])
    story.append(Image(str(C.EVIDENCE_FRAMES / "frame2_origin.png"),
                       width=180 * mm, height=118 * mm))

    # ------------------------------------------------- F4 suspects
    story.append(PageBreak())
    story.append(Paragraph("3 · Vessel Attribution — Ranked Suspects", st_h2))
    story.append(Paragraph(
        f"Model: {sus['model']}. Release window scored: "
        f"{sus['release_window_utc'][0][:16]}Z → {sus['release_window_utc'][1][:16]}Z. "
        f"{sus['n_vessels']} vessels evaluated.", st_b))
    rows = [["#", "Vessel", "MMSI", "Verdict", "Score", "Leading factors"]]
    for r in sus["ranking"][:3]:
        factors = "; ".join(x["text"] for x in r["reasons"][:3])
        rows.append([r["rank"], r["name"], r["mmsi"], r.get("verdict", "-"),
                     f"{r['score']:.3f}", Paragraph(factors, st_sm)])
    _table(story, rows, widths=[8, 38, 22, 34, 14, 64])
    story.append(Image(str(C.EVIDENCE_FRAMES / "frame3_suspects.png"),
                       width=180 * mm, height=118 * mm))

    # ------------------------------------------------- integrity
    story.append(Paragraph("4 · Chain of Custody — SHA-256", st_h2))
    hashes = {
        "sar scene (scene.tif)": _sha256(C.SAR_TIF),
        "slick_polygons.geojson": _sha256(C.SLICK_GEOJSON),
        "backtrack_hourly.geojson": _sha256(C.BACKTRACK_GEOJSON),
        "suspects.json": _sha256(C.SUSPECTS_JSON),
        "lgbm_ranker.txt": _sha256(C.RANKER_MODEL),
    }
    pkg = hashlib.sha256("".join(hashes.values()).encode()).hexdigest()
    rows = [["Artifact", "SHA-256"]] + [
        [k, Paragraph(f"<font face='Courier' size=6.6>{v}</font>", st_sm)]
        for k, v in hashes.items()]
    rows.append(["PACKAGE ID (hash of hashes)",
                 Paragraph(f"<font face='Courier' size=6.6><b>{pkg}</b></font>", st_sm)])
    _table(story, rows, widths=[50, 130])
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", color=INK, thickness=0.7))
    story.append(Paragraph(
        "Synthetic demo case — generated scene/AIS/met-ocean stand-ins per the "
        "SIH-26143 build plan (Zenodo-fallback mode). Method chain is identical for "
        "operational Sentinel-1 / AIS feeds. OriginTrace is a decision-support "
        "system; all findings require corroboration per the UNCLOS enforcement "
        "ladder (220(5) inspection, 220(6) detention, MARPOL sampling).", st_sm))

    doc = SimpleDocTemplate(str(C.EVIDENCE_PDF), pagesize=A4,
                            title="OriginTrace Evidence Package KERALA_2025_CASE01",
                            author="OriginTrace / SIH-26143")
    doc.build(story)
    print(f"F5 evidence -> {C.EVIDENCE_PDF} ({C.EVIDENCE_PDF.stat().st_size//1024} kB)")


def _table(story, rows, widths=None):
    t = Table(rows, colWidths=[w * mm for w in widths] if widths else None)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 7.6),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#eef3f8")]),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#9fb2c8")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(t)
    story.append(Spacer(1, 4))


if __name__ == "__main__":
    build()
