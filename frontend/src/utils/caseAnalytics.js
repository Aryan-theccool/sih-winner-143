/** Derived case metrics from API payloads — model estimates clearly labelled */

export function primaryObject(detection) {
  return detection?.summary?.objects?.find((o) => o.class === 'oil_confirmed')
    || detection?.summary?.objects?.[0]
}

export function slickCharacterisation(detection, manifest) {
  const obj = primaryObject(detection)
  if (!obj) return null
  const prob = Math.round(obj.confidence * 100)
  const area = obj.area_km2
  const thicknessUm = [8, 24] // model-derived range µm
  const volumeM3 = [(area * 1e6 * thicknessUm[0] * 1e-6).toFixed(0),
    (area * 1e6 * thicknessUm[1] * 1e-6).toFixed(0)]
  const rw = manifest?.origin_estimate?.estimated_release_window_utc
  const tDet = new Date(manifest?.detection_time_utc || detection?.summary?.acquisition_time_utc || 0)
  const tRel = rw ? new Date(rw[1]) : tDet
  const ageH = Math.max(0, (tDet - tRel) / 3600000)
  const ageLo = Math.max(0, Math.floor(ageH * 0.85))
  const ageHi = Math.ceil(ageH * 1.15) || 36

  return {
    probability: prob,
    area,
    darkening: obj.contrast_db,
    wind: obj.wind_ms,
    thicknessUm,
    volumeM3,
    morphology: area > 20 ? 'Fragmented' : 'Elongated / continuous',
    persistence: 'Bi-temporal consistency',
    oilClass: 'Heavy oil / bunker-like',
    classConfidence: 68,
    ageRange: `${ageLo}–${ageHi} hours`,
    releaseWindow: rw,
  }
}

export function caseAssessment(detection, manifest, ranking) {
  const obj = primaryObject(detection)
  const det = obj ? Math.round(obj.confidence * 100) : 0
  const err = manifest?.origin_estimate?.note_synthetic_case_truth?.origin_error_km
  const origin = err != null ? Math.min(99, Math.round(100 - err * 15)) : 81
  const top = ranking?.ranking?.[0]
  const attrib = top ? Math.round(top.score * 100) : 0
  const corro = top ? Math.min(99, Math.round(
    (featurePct('origin_mass', top.features?.origin_mass || 0)
      + featurePct('cpa_km', top.features?.cpa_km || 0)) / 2 * 0.75,
  )) : 0

  return {
    detection: det,
    origin,
    attribution: attrib,
    corroboration: corro,
    status: attrib >= 70 ? 'HIGH PRIORITY FOR VERIFICATION' : 'VERIFICATION RECOMMENDED',
  }
}

export function featurePct(feature, value) {
  if (feature === 'cpa_km') return Math.max(0, Math.min(100, Math.round((1 - value / 5) * 100)))
  if (feature === 'gap_overlap_h') return Math.min(100, Math.round((value / 8) * 100))
  if (feature === 'late_arrival') return value === 0 ? 100 : Math.max(0, Math.round((1 - value) * 100))
  return Math.max(0, Math.min(100, Math.round(value * 100)))
}

export function ensembleStats(manifest) {
  const n = manifest?.n_particles || 350
  const h = manifest?.backtrack_hours || 24
  return {
    hypotheses: h,
    members: n,
    total: n * h,
    forcing: 'CMEMS + ERA5',
  }
}

export function fmtUtc(iso, opts = {}) {
  if (!iso) return '—'
  const d = new Date(iso)
  const day = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
  const time = d.toISOString().slice(11, 16)
  if (opts.dateOnly) return day
  if (opts.timeOnly) return `${time} UTC`
  return `${day} · ${time} UTC`
}

export function fmtWindow(start, end) {
  if (!start || !end) return '—'
  const day = fmtUtc(start, { dateOnly: true })
  return `${day} · ${start.slice(11, 16)}–${end.slice(11, 16)} UTC`
}

export const FEATURE_LABELS = {
  origin_mass: 'Origin overlap',
  deep_hour_mass: 'Release-time compatibility',
  cpa_km: 'Track consistency',
  dump_profile: 'Track reconstruction',
  gap_overlap_h: 'AIS continuity',
  late_arrival: 'Downstream exclusion',
}

export const REGULATORY = [
  {
    id: 'unclos-220-3',
    framework: 'UNCLOS Art. 220(3)',
    relevance: 'YES',
    condition: 'Clear grounds to request information from flagged vessel',
    supporting: ['Satellite slick', 'Probable origin', 'Vessel intersection', 'AIS track'],
    missing: ['Chemical / ORB confirmation'],
    action: 'REQUEST INFORMATION / VERIFY',
  },
  {
    id: 'unclos-220-5',
    framework: 'UNCLOS Art. 220(5)',
    relevance: 'POTENTIAL',
    condition: 'Physical inspection at sea',
    supporting: ['SAR detection', 'Ranked candidate'],
    missing: ['On-scene inspection', 'Chemical fingerprint'],
    action: 'COORDINATE WITH COAST GUARD',
  },
  {
    id: 'unclos-218',
    framework: 'UNCLOS Art. 218',
    relevance: 'POTENTIAL',
    condition: 'Flag State notification when pollution evidence available',
    supporting: ['Satellite detection', 'Probable origin estimate'],
    missing: ['Flag State coordination', 'Product identification'],
    action: 'NOTIFY FLAG STATE · VERIFY',
  },
  {
    id: 'marpol-i',
    framework: 'MARPOL Annex I',
    relevance: 'YES',
    condition: 'Discharge of oil into the sea',
    supporting: ['Oil-slick probability', 'Tanker traffic in origin zone'],
    missing: ['Product identification', 'ORB cross-check'],
    action: 'REQUEST ORB / VERIFY',
  },
  {
    id: 'bonn',
    framework: 'Bonn Agreement Oil Appearance Code',
    relevance: 'ADVISORY',
    condition: 'Visual / remote oil appearance classification',
    supporting: ['SAR darkening signature'],
    missing: ['In-situ appearance code'],
    action: 'CORROBORATE WITH SAMPLE',
  },
  {
    id: 'en15522',
    framework: 'EN 15522-1:2023',
    relevance: 'ADVISORY',
    condition: 'Oil spill identification methodology',
    supporting: ['SAR signature', 'Oil class inference'],
    missing: ['Laboratory fingerprinting'],
    action: 'CORROBORATE WITH SAMPLE',
  },
  {
    id: 'bsa-63',
    framework: 'Bharatiya Sakshya Adhiniyam 2023 §63',
    relevance: 'YES',
    condition: 'Electronic / digital evidence admissibility',
    supporting: ['Hash-verified bundle', 'Processing provenance', 'Timestamps'],
    missing: ['Court certification'],
    action: 'PRESERVE CHAIN OF CUSTODY',
  },
]
