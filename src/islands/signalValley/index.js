import { defineIsland } from '../../engine/defineIsland.js'
import L from './layout.js'
import Scenery from './Scenery.jsx'
import { mound } from '../../engine/terrain.js'

// Gentle ramp: eased ends but close to a straight slope in the middle.
const ramp = (x, x0, x1, y0, y1) => {
  const t = Math.min(1, Math.max(0, (x - x0) / (x1 - x0)))
  return y0 + (y1 - y0) * (t + 0.5 * (t * t * (3 - 2 * t) - t))
}
const along = (x) => (x < -9 ? ramp(x, -29, -9, 0, -4) : x < 11 ? -4 : ramp(x, 11, 31, -4, 0.8))
// Each signal tower stands on a knoll on the valley side.
const knolls = L.towers.map((t) => mound(t.x, t.z, 4.6, 2.2, 2.3))
const terrain = (x, z) => along(x) + knolls.reduce((s, m) => s + m(x, z), 0)

export const island = defineIsland({
  id: 3,
  len: L.LEN,
  road: L.road,
  stops: [L.stopSpot],
  sign: { ...L.sign, face: -2.2 },
  colliders: L.colliders,
  tour: L.tour,
  grass: '#97d674',
  terrain,
  brandSign: { x: 8, z: -10, y: 6.4, face: -Math.PI / 2, scale: 1 },
  ride: { dy: 9, dz: -40, style: 'dive' },
})
export { Scenery }
