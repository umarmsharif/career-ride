import { defineIsland } from '../../engine/defineIsland.js'
import L from './layout.js'
import Scenery from './Scenery.jsx'

export const island = defineIsland({
  id: 2,
  len: L.len,
  road: L.road,
  stops: L.pickupSpots,
  signView: [-28.6, 0.2],
  colliders: L.colliders,
  tour: L.tour,
  ride: { dy: -9, dz: 38, style: 'spiral' },
})
export { Scenery }
