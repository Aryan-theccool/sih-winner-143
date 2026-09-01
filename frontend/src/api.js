/** API client — same-origin /api (vite dev proxy in dev). */

export async function getJSON(path) {
  const r = await fetch(path)
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`)
  return r.json()
}

export const api = {
  case: () => getJSON('/api/case'),
  detection: () => getJSON('/api/detection'),
  backtrack: () => getJSON('/api/drift/backtrack'),
  forecast: () => getJSON('/api/drift/forecast'),
  manifest: () => getJSON('/api/drift/manifest'),
  vessels: () => getJSON('/api/vessels'),
  ranking: () => getJSON('/api/ranking'),
}

/**
 * Prepare vessels for deck.gl: interpolate AIS gaps, preserve sog/cog.
 * absolute: [lon, lat, epoch, sog, cog]
 */
export function prepVessels(raw) {
  const tMin = raw.t_min
  return raw.vessels.map((v) => {
    const pts = []
    for (let i = 0; i < v.path.length; i++) {
      const p = v.path[i]
      if (i > 0) {
        const q = v.path[i - 1]
        const dtp = p[2] - q[2]
        if (dtp > 1800) {
          const n = Math.floor(dtp / 600)
          for (let k = 1; k <= n; k++) {
            const f = (600 * k) / dtp
            pts.push([
              q[0] + (p[0] - q[0]) * f,
              q[1] + (p[1] - q[1]) * f,
              q[2] + 600 * k,
              q[3] ?? 0,
              q[4] ?? 0,
            ])
          }
        }
      }
      pts.push(p)
    }
    return {
      mmsi: v.mmsi,
      name: v.name,
      type: v.type,
      flag: v.flag,
      length_m: v.length_m,
      ais_gaps: v.ais_gaps || [],
      path: pts.map((p) => [p[0], p[1]]),
      timestamps: pts.map((p) => p[2] - tMin),
      absolute: pts,
      dark_segments: v.dark_segments,
    }
  })
}

export function posAt(vessel, epoch) {
  const a = vessel.absolute
  if (!a?.length || epoch < a[0][2] - 60 || epoch > a[a.length - 1][2] + 60) return null
  let lo = 0; let hi = a.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (a[mid][2] <= epoch) lo = mid
    else hi = mid
  }
  const t0 = a[lo][2]; const t1 = a[hi][2]
  const f = t1 === t0 ? 0 : (epoch - t0) / (t1 - t0)
  return [
    a[lo][0] + (a[hi][0] - a[lo][0]) * f,
    a[lo][1] + (a[hi][1] - a[lo][1]) * f,
  ]
}
