import { defineIsland } from '../../engine/defineIsland.js'
import L from './layout.js'
import Scenery from './Scenery.jsx'

export const island = defineIsland({
  id: 1,
  len: 47,
  road: L.road,
  stops: L.pickupSpots,
  colliders: L.colliders,
  tour: L.tour,
  ride: { dy: 8, dz: -36, style: 'wave' },
})
export { Scenery }
