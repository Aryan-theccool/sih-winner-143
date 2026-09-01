/** Map mode presets — only show layers relevant to the active investigation phase */

export const MAP_MODES = [
  {
    id: 'investigation',
    label: 'INVESTIGATION',
    short: 'Case map',
    desc: 'Slick, origin cloud and vessel tracks together — the default view for reading the whole case.',
  },
  {
    id: 'oil_flow',
    label: 'OIL FLOW',
    short: 'Where the oil goes',
    desc: 'Forward forecast only: currents and wind pushing the slick over the next 6–48 hours.',
  },
  {
    id: 'vessel_replay',
    label: 'VESSEL REPLAY',
    short: 'Ship movement',
    desc: 'Animated AIS tracks for the 48 hours before detection. Use the timeline below the map to scrub.',
  },
  {
    id: 'origin',
    label: 'ORIGIN RECONSTRUCTION',
    short: 'Where it began',
    desc: 'Backward drift only. Drag the T− hours scrubber to watch the probability cloud tighten toward a release area.',
  },
  {
    id: 'evidence',
    label: 'EVIDENCE',
    short: 'Proof layers',
    desc: 'Every layer at once — the view that matches what the exported dossier contains.',
  },
]

export function modeById(id) {
  return MAP_MODES.find((m) => m.id === id) || MAP_MODES[0]
}

export function layersForMode(modeId) {
  const presets = {
    investigation: {
      sar: true, oil: true, tracks: true, flow: false,
      current: false, wind: false, waves: false,
      ships: true, backtrack: true, gaps: true, mask: false,
    },
    oil_flow: {
      sar: false, oil: true, tracks: false, flow: true,
      current: true, wind: true, waves: true,
      ships: false, backtrack: false, gaps: false, mask: false,
    },
    vessel_replay: {
      sar: false, oil: true, tracks: true, flow: false,
      current: false, wind: false, waves: false,
      ships: true, backtrack: false, gaps: true, mask: false,
    },
    origin: {
      sar: false, oil: true, tracks: false, flow: false,
      current: false, wind: false, waves: false,
      ships: false, backtrack: true, gaps: false, mask: false,
    },
    evidence: {
      sar: true, oil: true, tracks: true, flow: false,
      current: false, wind: false, waves: false,
      ships: true, backtrack: true, gaps: true, mask: false,
    },
  }
  return presets[modeId] || presets.investigation
}

export function modesForMode(modeId) {
  return {
    originMode: modeId === 'origin',
    flowMode: modeId === 'oil_flow',
  }
}

export const FLOW_NL =
  'Slick transport is primarily driven northeastward by surface current and wind.'
