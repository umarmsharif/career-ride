import { defineIsland } from '../../engine/defineIsland.js'
import L from './layout.js'
import Scenery from './Scenery.jsx'
import { profile } from '../../engine/terrain.js'

// Three terraces, one per project machine, each a step higher; short ramps between them.
const steps = profile([
  [-47, 0], [-36, 0], [-30, 1.4], [-9, 1.4], [-3, 2.9], [14, 2.9], [20, 4.4], [47, 4.4],
])

export const island = defineIsland({
  id: 8,
  len: 47,
  road: L.road,
  stops: L.stops,
  sign: { x: -38.5, z: 6.2, face: -2.2 },
  colliders: L.colliders,
  tour: L.tour,
  grass: '#a9d870',
  diagrams: [
    null,
    ['Agent calls the restaurant', 'Answers merchant queries', 'Qualifies the lead', 'Books a slot in the calendar'],
    ['Message in Urdu, Roman Urdu or English', 'Agent on Gemini and FastAPI', 'Five interactions', 'Qualified lead to CRM'],
  ],
  terrain: (x) => steps(x),
  brandSign: { x: -12, z: -12.5, y: 6.6, face: -Math.PI / 2, scale: 1 },
  ride: { dy: 10, dz: -38, style: 'wave' },
})
export { Scenery }
