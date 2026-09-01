/** Map mode presets — only show layers relevant to the active investigation phase */

export const MAP_MODES = [
  { id: 'investigation', label: 'INVESTIGATION' },
  { id: 'oil_flow', label: 'OIL FLOW' },
  { id: 'vessel_replay', label: 'VESSEL REPLAY' },
  { id: 'origin', label: 'ORIGIN RECONSTRUCTION' },
  { id: 'evidence', label: 'EVIDENCE' },
]

export function layersForMode(modeId) {
  const presets = {
    investigation: {
      sar: true, oil: true, tracks: true, flow: false,
      current: false, wind: false, waves: false,
      ships: true, backtrack: true, gaps: false, mask: false,
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
