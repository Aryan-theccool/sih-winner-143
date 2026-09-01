/** Professional vessel icon atlas — type-differentiated silhouettes for deck.gl */

const TYPE_KEYS = ['tanker', 'cargo', 'container', 'fishing', 'lng', 'passenger', 'support', 'default']

function drawShip(ctx, variant) {
  ctx.clearRect(0, 0, 64, 64)
  ctx.fillStyle = '#4ade80'
  ctx.strokeStyle = '#14532d'
  ctx.lineWidth = 1.2

  if (variant === 'tanker') {
    ctx.beginPath()
    ctx.moveTo(32, 6)
    ctx.lineTo(48, 52)
    ctx.lineTo(32, 48)
    ctx.lineTo(16, 52)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#166534'
    ctx.fillRect(22, 28, 20, 8)
  } else if (variant === 'fishing') {
    ctx.beginPath()
    ctx.moveTo(32, 8)
    ctx.lineTo(44, 50)
    ctx.lineTo(32, 44)
    ctx.lineTo(20, 50)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  } else if (variant === 'container') {
    ctx.beginPath()
    ctx.moveTo(32, 5)
    ctx.lineTo(50, 54)
    ctx.lineTo(32, 50)
    ctx.lineTo(14, 54)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.strokeStyle = '#14532d'
    for (let i = 0; i < 3; i++) ctx.strokeRect(18 + i * 10, 26, 8, 6)
  } else {
    ctx.beginPath()
    ctx.moveTo(32, 7)
    ctx.lineTo(46, 53)
    ctx.lineTo(32, 49)
    ctx.lineTo(18, 53)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }
}

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

let _atlas = null
let _typeMap = null

export function getShipIconAtlas() {
  if (_atlas) return { atlas: _atlas, mapping: _typeMap, typeKey }

  const canvas = document.createElement('canvas')
  const cell = 64
  canvas.width = cell * TYPE_KEYS.length
  canvas.height = cell
  const ctx = canvas.getContext('2d')

  const mapping = {}
  TYPE_KEYS.forEach((key, i) => {
    ctx.save()
    ctx.translate(i * cell, 0)
    drawShip(ctx, key)
    ctx.restore()
    mapping[key] = { x: i * cell, y: 0, width: cell, height: cell, anchorY: 32 }
  })

  _atlas = canvas.toDataURL()
  _typeMap = mapping
  return { atlas: _atlas, mapping: _typeMap, typeKey }
}
