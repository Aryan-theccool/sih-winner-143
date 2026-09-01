/** Scientific / legal terminology mappings for UI display */

export const CLASS_LABELS = {
  oil_confirmed: 'Oil-slick probability',
  look_alike: 'Look-alike',
  ambiguous: 'Ambiguous',
}

export const FEATURE_LABELS = {
  origin_mass: 'Origin overlap',
  deep_hour_mass: 'Release-time compatibility',
  cpa_km: 'Track consistency',
  dump_profile: 'Track reconstruction',
  gap_overlap_h: 'AIS continuity',
  late_arrival: 'Downstream traffic exclusion',
}

export function featurePct(feature, value) {
  if (feature === 'cpa_km') return Math.max(0, Math.min(100, Math.round((1 - value / 5) * 100)))
  if (feature === 'gap_overlap_h') return Math.min(100, Math.round((value / 8) * 100))
  if (feature === 'late_arrival') return value === 0 ? 100 : Math.max(0, Math.round((1 - value) * 100))
  return Math.max(0, Math.min(100, Math.round(value * 100)))
}

export function attributionScore(score) {
  return Math.round(score * 100)
}

export function candidateStatus(rank, score) {
  if (rank === 1 && score >= 0.7) return { label: 'HIGH PRIORITY FOR VERIFICATION', tone: 'high' }
  if (rank <= 2 && score >= 0.5) return { label: 'VERIFICATION RECOMMENDED', tone: 'med' }
  return { label: 'ADVISORY — CORROBORATE', tone: 'low' }
}

export function originConfidence(manifest) {
  const err = manifest?.origin_estimate?.note_synthetic_case_truth?.origin_error_km
  if (err != null) return Math.min(99, Math.round(100 - err * 15))
  return 81
}

export function fmtUtc(iso, opts = {}) {
  if (!iso) return '—'
  const d = new Date(iso)
  const date = d.toISOString().slice(0, 10)
  const time = d.toISOString().slice(11, 16)
  if (opts.dateOnly) return date
  if (opts.timeOnly) return `${time} UTC`
  return `${date} · ${time} UTC`
}

export function fmtWindow(start, end) {
  if (!start || !end) return '—'
  const ds = start.slice(0, 10)
  const t0 = start.slice(11, 16)
  const t1 = end.slice(11, 16)
  const day = new Date(start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  return `${day} · ${t0}–${t1} UTC`
}

export const WORKFLOW_STEPS = [
  'OBSERVE', 'DETECT', 'CHARACTERISE', 'HINDCAST', 'ATTRIBUTE', 'CORROBORATE', 'ACT',
]

export const EVIDENCE_TIERS = [
  { tier: 1, title: 'Slick detected', action: 'Monitor & log', color: 'cyan' },
  { tier: 2, title: 'Ranked candidate', action: 'Request information', color: 'amber' },
  { tier: 3, title: 'Corroborating anomaly', action: 'Inspect / verify', color: 'purple' },
  { tier: 4, title: 'Chemical / ORB match', action: 'Enforcement review', color: 'green' },
]
