import { defineIsland } from '../../engine/defineIsland.js'
import L from './layout.js'
import Scenery from './Scenery.jsx'
import { profile, mound } from '../../engine/terrain.js'

// Flat through the shed and gear wall, one gentle climb before the first town, level again to the exit.
const rise = profile([[-47, 0], [-9, 0], [4, 3.5], [47, 3.5]])
const knollS = mound(-3, 14, 7.5, 2, 2)
const knollN = mound(44, -14, 6.5, 2, 2)

export const island = defineIsland({
  id: 1,
  len: 47,
  road: L.road,
  stops: L.pickupSpots,
  colliders: L.colliders,
  tour: L.tour,
  terrain: (x, z) => rise(x) + knollS(x, z) + knollN(x, z),
  brandSign: { x: -26, z: -12, y: 8.8, face: -1.25, scale: 1.2 },
  ride: { dy: 8, dz: -36, style: 'wave' },
})
export { Scenery }
