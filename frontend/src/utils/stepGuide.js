/** Pipeline step narration — one record per sidebar tab.
 *
 * The landing page tells the story as DETECT → CHARACTERISE → RECONSTRUCT →
 * ATTRIBUTE → EVIDENCE. The dashboard uses the same five beats here so the
 * operator always knows which question the current screen is answering.
 */

export const STEPS = [
  {
    id: 'detection',
    num: '01',
    tab: 'DETECTION',
    rail: 'Detect',
    name: 'Detect & characterise',
    question: 'Is that dark patch really oil — and how much of it is there?',
    plain: 'Sentinel-1 radar saw a calm, dark area at sea. This screen scores how much it behaves like oil rather than a wind shadow or an algae film, then sizes it.',
    next: 'origin',
    nextLabel: 'Trace it back to an origin',
  },
  {
    id: 'origin',
    num: '02',
    tab: 'ORIGIN',
    rail: 'Origin',
    name: 'Reconstruct the origin',
    question: 'Where and when did the oil enter the water?',
    plain: 'The ocean is replayed backwards — currents, wind and spreading — from the slick we saw. The shaded cloud is where the release most plausibly happened.',
    next: 'vessels',
    nextLabel: 'See who was there',
  },
  {
    id: 'vessels',
    num: '03',
    tab: 'VESSELS',
    rail: 'Vessels',
    question: 'Which ships were inside that area at that time?',
    name: 'Attribute to vessels',
    plain: 'Forty-eight hours of AIS position broadcasts are reconstructed and scored against the origin cloud. Being near the slick today is not the same as being there when it was released.',
    next: 'evidence',
    nextLabel: 'Check how solid the case is',
  },
  {
    id: 'evidence',
    num: '04',
    tab: 'EVIDENCE',
    rail: 'Evidence',
    name: 'Corroborate',
    question: 'How defensible is every step of this chain?',
    plain: 'Each finding links back to a source file and a checksum. Missing evidence is listed as explicitly as the evidence we have.',
    next: 'report',
    nextLabel: 'Package the case file',
  },
  {
    id: 'report',
    num: '05',
    tab: 'REPORT',
    rail: 'Report',
    name: 'Case dossier',
    question: 'Can a human authority act on this without re-running anything?',
    plain: 'Maps, tracks, model settings, uncertainty and regulatory references are bundled into one hash-verified dossier.',
    next: null,
    nextLabel: null,
  },
]

export const OVERVIEW_STEP = {
  id: 'map',
  num: '00',
  tab: 'OVERVIEW',
  rail: 'Overview',
  name: 'Case overview',
  question: 'Everything the satellite, the ocean model and AIS agree on — on one map.',
  plain: 'Pick a step on the left to zoom into one part of the investigation, or use the map modes along the bottom of the map.',
  next: 'detection',
  nextLabel: 'Start with the detection',
}

export const STEP_BY_ID = STEPS.reduce((acc, s) => ({ ...acc, [s.id]: s }), { map: OVERVIEW_STEP })

/** Views that map to the same sidebar tab as the map view */
export function stepFor(view) {
  return STEP_BY_ID[view] || STEP_BY_ID.map
}

export function stepIndex(view) {
  const i = STEPS.findIndex((s) => s.id === view)
  return i
}
