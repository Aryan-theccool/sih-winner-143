/** Motion helpers — respect prefers-reduced-motion */

export const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)'
export const DURATION = { fast: 150, ui: 220, panel: 320, map: 480 }

export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function staggerDelay(index, baseMs = 40) {
  return prefersReducedMotion() ? 0 : index * baseMs
}
