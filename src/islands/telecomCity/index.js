import { defineIsland } from '../../engine/defineIsland.js'
import L from './layout.js'
import Scenery from './Scenery.jsx'

export const island = defineIsland({
  id: 4,
  len: 50,
  wid: 21.5,
  neck: 10.5,
  road: L.road,
  stops: L.pickupSpots,
  sign: { x: -41.5, z: 6.2, face: -2.2 },
  signView: [-38, 0.6],
  colliders: L.colliders,
  banners: [
    { x: -37, z: -5.4, face: 0.5, district: 0 },
    { x: 5, z: -6, face: 0.35, district: 1 },
  ],
  tour: [
    [-41.6, 0], [-38, 0.6], [-34, 2.5], [-28, 0.8], [-22, -2.5], [-16, -0.5], [-10, 2.5], [-3, 0.8],
    [3, 0], [11, 2.5], [17, 0.5], [23, -2], [29, 0.5], [35, 2.5], [42, 0.5], [48.5, 0],
  ],
  ride: { dy: -8, dz: 40, style: 'wave' },
})
export { Scenery }
