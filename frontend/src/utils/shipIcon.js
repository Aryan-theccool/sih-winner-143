/** Generate ship icon atlas for deck.gl IconLayer */
let _atlas = null

export function getShipIconAtlas() {
  if (_atlas) return _atlas
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, 128, 128)
  ctx.fillStyle = '#e2e8f0'
  ctx.strokeStyle = '#1e293b'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(64, 12)
  ctx.lineTo(88, 100)
  ctx.lineTo(64, 88)
  ctx.lineTo(40, 100)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  _atlas = {
    atlas: canvas.toDataURL(),
    mapping: { ship: { x: 0, y: 0, width: 128, height: 128, anchorY: 64 } },
  }
  return _atlas
}
