import { defineIsland } from '../../engine/defineIsland.js'
import L from './layout.js'
import Scenery from './Scenery.jsx'
import { profile } from '../../engine/terrain.js'

// Entrance on high ground, a drop to the yard level, then down to the quay.
const fall = profile([[-47, 0], [-17.5, 0], [-8.5, -2], [8, -2], [20.5, -4.8], [47, -4.8]])

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
  terrain: (x) => fall(x),
  brandSign: { x: -30, z: -9, y: 7.9, face: -Math.PI / 2, scale: 1 },
  ride: { dy: 10, dz: -42, style: 'spiral' },
})
export { Scenery }
