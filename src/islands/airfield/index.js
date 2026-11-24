import { defineIsland } from '../../engine/defineIsland.js'
import L from './layout.js'
import Scenery from './Scenery.jsx'
import { profile } from '../../engine/terrain.js'

// Level near the gate and signboard, one clear climb, then a flat tableland for the airfield.
const rise = profile([[-47, 0], [-33, 0], [-15, 6], [47, 6]])

export const island = defineIsland({
  id: 7,
  len: 47,
  road: L.road,
  stops: L.pickupSpots,
  colliders: L.colliders,
  tour: L.tour,
  brandSign: { x: -8.5, z: 12.2, y: 10.2, face: -2.0, scale: 1 },
  terrain: (x) => rise(x),
  ride: { dy: -9, dz: 40, style: 'dive' },
})
export { Scenery }
