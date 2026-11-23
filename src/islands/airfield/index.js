import { defineIsland } from '../../engine/defineIsland.js'
import L from './layout.js'
import Scenery from './Scenery.jsx'

export const island = defineIsland({
  id: 7,
  len: 47,
  road: L.road,
  stops: L.pickupSpots,
  colliders: L.colliders,
  tour: L.tour,
  ride: { dy: -9, dz: 40, style: 'dive' },
})
export { Scenery }
