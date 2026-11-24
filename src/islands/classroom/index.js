import { defineIsland } from '../../engine/defineIsland.js'
import L from './layout.js'
import Scenery from './Scenery.jsx'
import { profile } from '../../engine/terrain.js'

// The road climbs in the gaps between the boards and the kiosk; each of those sits on a level step.
const climb = profile([[-47, 0], [-22, 0], [-14, 2], [-6, 2], [2, 4], [10, 4], [19, 6.5], [24.5, 6.5], [30, 8], [47, 8]])

export const island = defineIsland({
  id: 9,
  len: 47,
  outline: L.outline,
  road: L.road,
  stops: L.pickupSpots.concat([]),
  sign: { x: -38.5, z: 6.2, face: -2.2 },
  colliders: L.colliders,
  terrain: (x) => climb(x),
  brandSign: { x: -26, z: -6.6, y: 7.2, face: -Math.PI / 2, scale: 1 },
  last: true,
  finish: L.finish,
  grass: '#b7d66a',
  land: { lip: '#9ccb5e', dirt: '#d79c62', rock: '#b27c55', rock2: '#8a5c4a' },
  tour: [
    [-38, 0], [-35.6, 0.2], [-32, -0.6], [-26, -1.2], [-18, -0.3], [-10, 0.6], [-2, 0.1], [6, -0.6],
    [14, 0], [22, 0.8], [30, 0.7], [L.finish.x, L.finish.z],
  ],
})
export { Scenery }
