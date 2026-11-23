import { defineIsland } from '../../engine/defineIsland.js'
import L from './layout.js'
import Scenery from './Scenery.jsx'

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
  ride: { dy: 10, dz: -38, style: 'wave' },
})
export { Scenery }
