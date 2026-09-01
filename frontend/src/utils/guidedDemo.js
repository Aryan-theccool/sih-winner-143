/**
 * Guided Demo Configuration
 * 90-second cinematic sequence: 6 scenes with captions, camera transitions, and layer orchestration
 * Drives ViewportFlyToInterpolator, driftHour, simTime, and layer visibility
 */

export const GUIDED_DEMO_CONFIG = [
  {
    id: 'scene-1-detection',
    caption: 'A slick appears off Kochi on Sentinel-1…',
    durationMs: 15000,
    viewState: {
      longitude: 75.50,
      latitude: 9.357,
      zoom: 10.2,
      pitch: 15,
      bearing: 0,
      transitionDuration: 2000,
    },
    layerOps: {
      show: { sar: true, oil: true, detectability: false, backtrack: false, vessels: false },
      pulse: true,
    },
    driftHour: 0,
    simTime: null, // Keep current
    narrator: 'detection',
  },
  {
    id: 'scene-2-wind-gate',
    caption: 'Wind gate: only 3–12 m/s detects oil. Below 3 m/s? Look-alike. Above 12 m/s? Capillary damping.',
    durationMs: 12000,
    viewState: {
      longitude: 75.50,
      latitude: 9.357,
      zoom: 10.2,
      pitch: 15,
      bearing: 0,
      transitionDuration: 1200,
    },
    layerOps: {
      show: { sar: true, oil: true, detectability: true, backtrack: false, vessels: false },
      pulse: false,
    },
    driftHour: 0,
    simTime: null,
    narrator: 'wind-gate',
  },
  {
    id: 'scene-3-backward-drift',
    caption: 'Now we run time BACKWARD 24 hours. Watch the cloud expand and breathe…',
    durationMs: 18000,
    viewState: {
      longitude: 75.60,
      latitude: 9.40,
      zoom: 8.8,
      pitch: 25,
      bearing: 0,
      transitionDuration: 1500,
    },
    layerOps: {
      show: { sar: true, oil: true, detectability: false, backtrack: true, vessels: true },
      pulse: true,
      driftAnimate: { from: 0, to: 24, durationMs: 14000 }, // Animate driftHour over 14s
    },
    driftHour: 24,
    simTime: null,
    narrator: 'backward-drift',
  },
  {
    id: 'scene-4-suspect-vessel',
    caption: '20 vessels on the water. One went dark exactly at release time — MT KAVERI STAR.',
    durationMs: 16000,
    viewState: {
      longitude: 75.52,
      latitude: 9.35,
      zoom: 9.5,
      pitch: 20,
      bearing: 0,
      transitionDuration: 1800,
    },
    layerOps: {
      show: { sar: true, oil: true, detectability: false, backtrack: true, vessels: true, suspects: true },
      pulse: true,
      suspectHighlight: 419000001, // MMSI of MT KAVERI STAR
    },
    driftHour: 18,
    simTime: null,
    narrator: 'suspect-vessel',
  },
  {
    id: 'scene-5-evidence',
    caption: 'Four independent evidences agree: origin match, dark period, slow speed, steady heading.',
    durationMs: 14000,
    viewState: {
      longitude: 75.50,
      latitude: 9.357,
      zoom: 9.8,
      pitch: 10,
      bearing: 0,
      transitionDuration: 1200,
    },
    layerOps: {
      show: { sar: true, oil: true, detectability: false, backtrack: true, vessels: true, suspects: true, shap: true },
      pulse: false,
      suspectHighlight: 419000001,
    },
    driftHour: 18,
    simTime: null,
    narrator: 'evidence-convergence',
  },
  {
    id: 'scene-6-proof',
    caption: 'Export: UNCLOS 220(3) tip-and-cue evidence package. SHA-256 sealed, ready for ICG.',
    durationMs: 15000,
    viewState: {
      longitude: 75.50,
      latitude: 9.357,
      zoom: 9.2,
      pitch: 0,
      bearing: 0,
      transitionDuration: 1200,
    },
    layerOps: {
      show: { sar: true, oil: true, detectability: false, backtrack: true, vessels: true, suspects: true, evidence: true },
      pulse: false,
    },
    driftHour: 18,
    simTime: null,
    narrator: 'proof-export',
  },
]

/**
 * Caption text localization
 */
export const CAPTIONS = {
  detection: 'A slick appears off Kochi on Sentinel-1…',
  'wind-gate': 'Wind gate: only 3–12 m/s detects oil. Below 3 m/s? Look-alike. Above 12 m/s? Capillary damping.',
  'backward-drift': 'Now we run time BACKWARD 24 hours. Watch the cloud expand and breathe…',
  'suspect-vessel': '20 vessels on the water. One went dark exactly at release time — MT KAVERI STAR.',
  'evidence-convergence': 'Four independent evidences agree: origin match, dark period, slow speed, steady heading.',
  'proof-export': 'Export: UNCLOS 220(3) tip-and-cue evidence package. SHA-256 sealed, ready for ICG.',
}

/**
 * Story steps: user can click a step to jump to that demo scene index
 */
export const STORY_STEPS = [
  { id: 'detect', label: 'DETECT', sceneIndex: 0, description: 'SAR detects oil slick' },
  { id: 'drift-back', label: 'DRIFT BACK', sceneIndex: 2, description: 'Backward 24-hour attribution' },
  { id: 'rank', label: 'RANK', sceneIndex: 3, description: 'Vessel suspect scoring' },
  { id: 'exonerate', label: 'EXONERATE', sceneIndex: 4, description: 'Multi-evidence analysis' },
  { id: 'prove', label: 'PROVE', sceneIndex: 5, description: 'Export UNCLOS evidence' },
]

/**
 * Orchestrate guided demo
 * @param {Object} state - Current app state { driftHour, simTime, show, selectedMmsi, … }
 * @param {Function} setState - Update state ({ driftHour, simTime, show, … })
 * @param {Function} onViewStateChange - Update deck.gl viewState
 * @param {Function} onSceneComplete - Called when scene finishes (sceneIndex)
 * @returns {Function} cleanup function
 */
export function orchestrateGuidedDemo(state, setState, onViewStateChange, onSceneComplete) {
  let sceneIndex = 0
  let demoRunning = true
  let sceneStartTime = performance.now()

  const runScene = () => {
    if (!demoRunning || sceneIndex >= GUIDED_DEMO_CONFIG.length) {
      onSceneComplete?.(-1) // Finished
      return
    }

    const scene = GUIDED_DEMO_CONFIG[sceneIndex]
    const now = performance.now()
    const elapsed = now - sceneStartTime

    // Update view state (deck.gl will handle easing via ViewportFlyToInterpolator)
    if (onViewStateChange) {
      onViewStateChange({
        ...scene.viewState,
        transitionInterpolator: 'ViewportFlyToInterpolator',
      })
    }

    // Handle driftHour animation within scene
    if (scene.layerOps?.driftAnimate) {
      const animElapsed = Math.min(elapsed, scene.layerOps.driftAnimate.durationMs)
      const progress = animElapsed / scene.layerOps.driftAnimate.durationMs
      const newDrift = scene.layerOps.driftAnimate.from + (scene.layerOps.driftAnimate.to - scene.layerOps.driftAnimate.from) * progress
      setState((s) => ({ ...s, driftHour: newDrift }))
    } else if (scene.driftHour !== null) {
      setState((s) => ({ ...s, driftHour: scene.driftHour }))
    }

    // Update layers visibility
    if (scene.layerOps?.show) {
      setState((s) => ({ ...s, show: { ...s.show, ...scene.layerOps.show } }))
    }

    // Highlight suspect if specified
    if (scene.layerOps?.suspectHighlight) {
      setState((s) => ({ ...s, selectedMmsi: scene.layerOps.suspectHighlight }))
    }

    // Pulse animation toggle
    if (scene.layerOps?.pulse !== undefined) {
      setState((s) => ({ ...s, demoPulse: scene.layerOps.pulse }))
    }

    // Move to next scene after duration
    if (elapsed >= scene.durationMs) {
      onSceneComplete?.(sceneIndex)
      sceneIndex += 1
      sceneStartTime = performance.now()
      requestAnimationFrame(runScene)
    } else {
      requestAnimationFrame(runScene)
    }
  }

  runScene()

  return () => {
    demoRunning = false
  }
}

/**
 * Jump to a specific story step
 */
export function jumpToStoryStep(stepId) {
  const step = STORY_STEPS.find((s) => s.id === stepId)
  return step ? GUIDED_DEMO_CONFIG[step.sceneIndex] : null
}
