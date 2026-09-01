import { posAt } from '../api.js'

/** Full vessel state at epoch including heading (deg) and speed (kn) */
export function vesselAt(vessel, epoch) {
  const a = vessel.absolute
  if (!a?.length || epoch < a[0][2] - 120 || epoch > a[a.length - 1][2] + 120) return null

  let lo = 0; let hi = a.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (a[mid][2] <= epoch) lo = mid
    else hi = mid
  }

  const p0 = a[lo]; const p1 = a[hi]
  const f = p1[2] === p0[2] ? 0 : (epoch - p0[2]) / (p1[2] - p0[2])
  const lon = p0[0] + (p1[0] - p0[0]) * f
  const lat = p0[1] + (p1[1] - p0[1]) * f
  const sog = p0[4] != null ? p0[4] + ((p1[4] ?? p0[4]) - p0[4]) * f : 0
  let cog = p0[5] ?? 0
  if (p1[5] != null && p0[5] != null) cog = p0[5] + (p1[5] - p0[5]) * f

  if (sog < 0.5 && lo > 0) {
    const dx = p1[0] - p0[0]; const dy = p1[1] - p0[1]
    cog = (Math.atan2(dx, dy) * 180) / Math.PI
    if (cog < 0) cog += 360
  }

  return {
    position: [lon, lat],
    heading: cog,
    speed: sog,
    timestamp: epoch,
    inGap: isInGap(vessel, epoch),
  }
}

export function isInGap(vessel, epoch) {
  for (const seg of vessel.dark_segments || []) {
    if (seg.length >= 2) {
      const t0 = seg[0][2]; const t1 = seg[seg.length - 1][2]
      if (epoch >= t0 && epoch <= t1) return true
    }
  }
  return false
}

/** Speed vector endpoint [lon, lat] in degrees (~0.02 deg per 10 kn) */
export function speedVectorEnd(lon, lat, cog, sog, scale = 0.015) {
  const len = Math.min(sog, 20) * scale * 0.1
  const rad = (cog * Math.PI) / 180
  return [lon + Math.sin(rad) * len, lat + Math.cos(rad) * len]
}

export function vesselTypeColor(type = '') {
  const t = type.toLowerCase()
  if (t.includes('tanker') || t.includes('crude')) return [220, 60, 70]
  if (t.includes('container')) return [56, 189, 248]
  if (t.includes('bulk')) return [167, 139, 250]
  if (t.includes('fishing')) return [74, 222, 128]
  if (t.includes('passenger') || t.includes('ferry')) return [251, 191, 36]
  if (t.includes('lng') || t.includes('lpg')) return [244, 114, 182]
  return [148, 163, 184]
}
