import { defineIsland } from '../../engine/defineIsland.js'
import L from './layout.js'
import Scenery from './Scenery.jsx'
import { profile } from '../../engine/terrain.js'

// Four terraces, one per project machine; short ramps between them.
const steps = profile([
  [-47, 0], [-34.5, 0], [-28.5, 1.3], [-19.5, 1.3], [-13.5, 2.7], [-3, 2.7],
  [3.5, 4.1], [15, 4.1], [22, 5.5], [47, 5.5],
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
    ['Message in Urdu, Roman Urdu or English', 'Agent on Gemini and FastAPI', 'Five interactions', 'Qualified lead to CRM'],
    null,
    ['Agent calls the restaurant', 'Answers merchant queries', 'Qualifies the lead', 'Books a slot in the calendar'],
    null,
  ],
  terrain: (x) => steps(x),
  brandSign: { x: -8, z: -12.5, y: 6.6, face: -Math.PI / 2, scale: 1 },
  ride: { dy: 10, dz: -38, style: 'wave' },
})
export { Scenery }
