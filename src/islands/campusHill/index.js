import { defineIsland } from '../../engine/defineIsland.js'
import L from './layout.js'
import Scenery from './Scenery.jsx'

// Flat at the entrance, a long climb past the library, a level campus on top, then a small
// step down to the exit. Piecewise-linear with the corners rounded, so the road slope stays even.
const pts = [[-60, 0], [-22, 0], [3, 6.8], [26.5, 6.8], [31, 5.6], [60, 5.6]]
const lin = (x) => {
  for (let i = 1; i < pts.length; i++) {
    if (x <= pts[i][0]) return pts[i - 1][1] + ((pts[i][1] - pts[i - 1][1]) * (x - pts[i - 1][0])) / (pts[i][0] - pts[i - 1][0])
  }
  return pts[pts.length - 1][1]
}
const rise = (x) => {
  let s = 0
  for (let i = -4; i <= 4; i++) s += lin(x + i * 0.5)
  return s / 9
}

export const island = defineIsland({
  id: 2,
  len: L.len,
  road: L.road,
  stops: L.pickupSpots,
  signView: [-28.6, 0.2],
  colliders: L.colliders,
  tour: L.tour,
  terrain: (x) => rise(x),
  brandSign: { x: L.hill.x - 3, z: L.hill.z, y: L.hill.h + 7.0, face: -Math.PI / 2, scale: 0.8 },
  ride: { dy: -9, dz: 38, style: 'spiral' },
})
export { Scenery }
