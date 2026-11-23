import { defineIsland } from '../../engine/defineIsland.js'
import L from './layout.js'
import Scenery from './Scenery.jsx'

export const island = defineIsland({
  id: 6,
  len: 47,
  outline: L.outline,
  road: L.road,
  stops: L.pickupSpots,
  sign: { x: -38.5, z: 6.2, face: -2.2 },
  signView: [-35.6, 0.2],
  colliders: L.colliders,
  banners: [
    { x: -35.5, z: -6.6, face: 0.5, district: 0 },
    { x: 5.5, z: -5.2, face: 0.35, district: 1 },
  ],
  tour: [
    [-38, 0], [-35.6, 0.2], [-29.5, -2.6], [-25, 0.6], [-22, 3.4], [-17.5, 0], [-11.5, -3],
    [-4, -0.8], [3, 0.6], [11.5, 3.4], [17, 4.4], [22, 4.6], [31.5, 3.2], [38, 0.8], [45.5, 0],
  ],
  ride: { dy: 10, dz: -44, style: 'spiral' },
})
export { Scenery }
