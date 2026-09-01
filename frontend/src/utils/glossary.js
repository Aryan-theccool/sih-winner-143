/**
 * Plain-language glossary for every piece of jargon shown in the dashboard.
 *
 * `Term` components read from this map, and the Reading Guide prints all of
 * it, so a first-time user is never stuck on an acronym.
 */

export const GLOSSARY = {
  sar: {
    term: 'SAR',
    full: 'Synthetic Aperture Radar',
    plain: 'Radar that flies over the sea day, night and through cloud. Oil damps the small ripples the radar bounces off, so slicks show up as dark patches.',
  },
  lookalike: {
    term: 'Look-alike',
    full: 'Biogenic or slick-like feature',
    plain: 'A dark patch that looks like oil but is not — algae films, rain cells or wind shadows. SAGAR-NET screens them out instead of counting them.',
  },
  windgate: {
    term: 'Wind gate',
    full: 'Detectability window',
    plain: 'Radar only reads slicks reliably when the wind is 3–12 m/s. Below 3 m/s the sea is too flat, above 12 m/s the surface is too rough — no detection is a blind spot, not a clean sea.',
  },
  mask: {
    term: 'Detectability mask',
    full: 'Where the sensor could see',
    plain: 'Hatched areas the algorithm could not judge reliably. "Nothing found here" does not mean "nothing happened here".',
  },
  hindcast: {
    term: 'Hindcast',
    full: 'Backward drift run',
    plain: 'The ocean is replayed backwards — currents, wind drag, turbulent spreading — from where the slick was seen, to find where the oil plausibly entered the water.',
  },
  credible: {
    term: 'Credible region',
    full: 'p10 / p50 / p90 contours',
    plain: 'A probability area, not a pin. p50 holds the middle 50% of the simulated trajectories; p90 is the widest plausible area. Smaller means more certain.',
  },
  release: {
    term: 'Release window',
    full: 'Probable time of discharge',
    plain: 'The hours during which the oil most likely entered the sea — derived from slick age and the backward drift, not from a report.',
  },
  age: {
    term: 'Slick age',
    full: 'Time between release and detection',
    plain: 'Estimated from how far the slick drifted, how weathered the radar signature looks and the drift ensemble.',
  },
  ais: {
    term: 'AIS',
    full: 'Automatic Identification System',
    plain: 'The position beacon most ships must broadcast. SAGAR-NET replays 48 hours of it against the origin estimate.',
  },
  amsgap: {
    term: 'AIS gap',
    full: 'Dark vessel',
    plain: 'A period where a ship stopped broadcasting while still moving. Switching AIS off is common evidence of an unreported discharge.',
  },
  cpa: {
    term: 'CPA',
    full: 'Closest point of approach',
    plain: 'How close the ship came to the probable origin point, in kilometres. Small distance plus the right timing is what ranks a vessel high.',
  },
  score: {
    term: 'Attribution score',
    full: 'Ranking model output',
    plain: 'How well a ship fits the origin, the timing and the track pattern. It is a priority score for verification — not a finding of guilt.',
  },
  shap: {
    term: 'SHAP',
    full: 'Model explanation',
    plain: 'Which inputs pushed the score up or down, so a human can read the reasoning instead of trusting a black box.',
  },
  ensemble: {
    term: 'Ensemble',
    full: 'Thousands of drift trajectories',
    plain: 'One thousand simulated oil parcels per hour of possible spill age. Their spread is what turns into a probability cloud.',
  },
  mmsi: {
    term: 'MMSI',
    full: 'Maritime Mobile Service Identity',
    plain: 'A nine-digit radio ID for a ship. IMO numbers identify the hull permanently, MMSI the radio it transmits with.',
  },
  orb: {
    term: 'ORB',
    full: 'Oil Record Book',
    plain: 'The book every tanker must keep for tank transfers and discharges. Comparing it with the satellite timeline is what turns a probable origin into evidence.',
  },
  unclos: {
    term: 'UNCLOS Art. 220(3)',
    full: 'Right to request information',
    plain: 'Where there are clear grounds for suspicion, a coastal State may ask a vessel passing through its zone for information about the ship and its cargo.',
  },
  marpol: {
    term: 'MARPOL Annex I',
    full: 'Regulations for the prevention of pollution by oil',
    plain: 'The international treaty that bans discharges of oil outside narrowly defined conditions.',
  },
  hash: {
    term: 'SHA-256',
    full: 'Evidence integrity fingerprint',
    plain: 'A short code that changes if a source file changes. It lets a court or a reviewer confirm the case file was not altered after processing.',
  },
  sog: {
    term: 'SOG / COG',
    full: 'Speed and course over ground',
    plain: 'Actual speed in knots and heading in degrees relative to north, as the ship moves over the seabed.',
  },
  tier: {
    term: 'Evidentiary tier',
    full: 'How far the case has gone',
    plain: 'T1 satellite detection → T2 ranked candidate → T3 corroborating anomaly → T4 chemical or logbook match. Only T4 is enforcement grade.',
  },
}

export const GLOSSARY_LIST = Object.values(GLOSSARY)

/** Resolve a glossary key with a tolerant lookup (labels are human written). */
export function glossaryFor(key) {
  if (!key) return null
  const k = String(key).toLowerCase().replace(/[^a-z]/g, '')
  return GLOSSARY[k] || GLOSSARY[key] || null
}
