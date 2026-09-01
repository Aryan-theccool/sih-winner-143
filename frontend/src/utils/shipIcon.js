/** Vessel icon atlas — loads ship.png, aligns bow to north for heading rotation */

const TYPE_KEYS = ['tanker', 'cargo', 'container', 'fishing', 'lng', 'passenger', 'support', 'default']

/** ship.png is isometric with bow toward bottom-left; rotate CCW so bow points north (0° heading) */
const BOW_NORTH_OFFSET_DEG = 135

function typeKey(vesselType = '') {
  const t = vesselType.toLowerCase()
  if (t.includes('tank') || t.includes('oil') || t.includes('chemical')) return 'tanker'
  if (t.includes('container')) return 'container'
  if (t.includes('fish')) return 'fishing'
  if (t.includes('lng') || t.includes('lpg')) return 'lng'
  if (t.includes('passenger') || t.includes('cruise')) return 'passenger'
  if (t.includes('cargo') || t.includes('bulk')) return 'cargo'
  if (t.includes('tug') || t.includes('support')) return 'support'
  return 'default'
}

function stripBlackBackground(img) {
  const w = img.naturalWidth
  const h = img.naturalHeight
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, w, h)
  for (let i = 0; i < data.data.length; i += 4) {
    const r = data.data[i]
    const g = data.data[i + 1]
    const b = data.data[i + 2]
    if (r < 24 && g < 24 && b < 24) data.data[i + 3] = 0
  }
  ctx.putImageData(data, 0, 0)
  return canvas
}

function alignBowNorth(source, offsetDeg) {
  const w = source.width
  const h = source.height
  const size = Math.ceil(Math.hypot(w, h))
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.translate(size / 2, size / 2)
  ctx.rotate((offsetDeg * Math.PI) / 180)
  ctx.drawImage(source, -w / 2, -h / 2)
  return canvas
}

let _atlas = null
let _typeMap = null
let _loadPromise = null

export function loadShipIconAtlas() {
  if (_atlas) return Promise.resolve({ atlas: _atlas, mapping: _typeMap, typeKey })
  if (_loadPromise) return _loadPromise

  _loadPromise = new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const transparent = stripBlackBackground(img)
      const canvas = alignBowNorth(transparent, BOW_NORTH_OFFSET_DEG)
      const w = canvas.width
      const h = canvas.height
      const mapping = {}
      TYPE_KEYS.forEach((key) => {
        mapping[key] = { x: 0, y: 0, width: w, height: h, anchorX: w / 2, anchorY: h / 2 }
      })
      _atlas = canvas
      _typeMap = mapping
      resolve({ atlas: _atlas, mapping: _typeMap, typeKey })
    }
    img.onerror = () => reject(new Error('Failed to load ship icon'))
    img.src = '/ship.png'
  })
  return _loadPromise
}

export function getShipIconAtlas() {
  if (!_atlas) return null
  return { atlas: _atlas, mapping: _typeMap, typeKey }
}

/** deck.gl IconLayer angle: CCW degrees; nautical heading is CW from north */
export function iconAngleFromHeading(heading = 0) {
  return -heading
}
