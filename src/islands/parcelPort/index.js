import { defineIsland } from '../../engine/defineIsland.js'
import L from './layout.js'
import Scenery from './Scenery.jsx'

export const island = defineIsland({
  id: 5,
  len: L.len,
  wid: L.wid,
  outline: L.outline,
  road: L.road,
  stops: L.pickupSpots,
  sign: { x: -38.5, z: 6.2, face: -2.2 },
  signView: [-35.6, 0.2],
  colliders: L.colliders,
  tour: [
    [-38, 0], [-35.6, 0.2], [-31, -1.2], [-24, -1.8], [-14, -1], [-6, 0.5], [2, 1.3],
    [12, 1.5], [22, 0.3], [30, -0.6], [38, 0], [45.5, 0],
  ],
  ride: { dy: 10, dz: -42, style: 'spiral' },
})
export { Scenery }
