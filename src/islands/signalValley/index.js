import { defineIsland } from '../../engine/defineIsland.js'
import L from './layout.js'
import Scenery from './Scenery.jsx'

export const island = defineIsland({
  id: 3,
  len: L.LEN,
  road: L.road,
  stops: [L.stopSpot],
  sign: { ...L.sign, face: -2.2 },
  colliders: L.colliders,
  tour: L.tour,
  grass: '#97d674',
  ride: { dy: 9, dz: -40, style: 'dive' },
})
export { Scenery }
