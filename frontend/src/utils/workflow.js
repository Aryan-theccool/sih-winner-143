/** Guided investigation workflow — progressive disclosure stages */

export const WORKFLOW_STAGES = [
  { id: 'detect', num: 1, label: 'DETECT', view: 'detection', mapMode: 'investigation' },
  { id: 'characterise', num: 2, label: 'CHARACTERISE', view: 'detection', mapMode: 'investigation' },
  { id: 'origin', num: 3, label: 'ESTIMATE ORIGIN', view: 'origin', mapMode: 'origin' },
  { id: 'replay', num: 4, label: 'REPLAY AIS', view: 'map', mapMode: 'vessel_replay' },
  { id: 'attribute', num: 5, label: 'ATTRIBUTE', view: 'vessels', mapMode: 'vessel_replay' },
  { id: 'corroborate', num: 6, label: 'CORROBORATE', view: 'evidence', mapMode: 'evidence' },
  { id: 'report', num: 7, label: 'REPORT', view: 'report', mapMode: 'evidence' },
]

export const VIEW_TO_STAGE = {
  map: 'replay',
  detection: 'detect',
  origin: 'origin',
  vessels: 'attribute',
  evidence: 'corroborate',
  report: 'report',
}

export const EVIDENCE_CHECKLIST = [
  { id: 1, label: 'Satellite Detection', status: 'ok' },
  { id: 2, label: 'Slick Characterisation', status: 'ok' },
  { id: 3, label: 'Age Estimation', status: 'ok' },
  { id: 4, label: 'Origin Reconstruction', status: 'ok' },
  { id: 5, label: 'AIS Reconstruction', status: 'ok' },
  { id: 6, label: 'Vessel Attribution', status: 'ok' },
  { id: 7, label: 'Corroborating Evidence', status: 'warn' },
  { id: 8, label: 'Regulatory Mapping', status: 'ok' },
  { id: 9, label: 'Evidence Integrity', status: 'ok' },
]

export const DOSSIER_CHECKLIST = [
  'Satellite evidence', 'Coordinates', 'Slick polygon', 'Age estimation',
  'Origin probability', 'AIS reconstruction', 'Candidate vessels',
  'Environmental conditions', 'Regulatory mapping', 'Evidence integrity',
]
