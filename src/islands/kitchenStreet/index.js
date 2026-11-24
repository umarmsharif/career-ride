import { defineIsland } from '../../engine/defineIsland.js'
import L from './layout.js'
import Scenery from './Scenery.jsx'
import { profile } from '../../engine/terrain.js'

// Two steps of 3, one per district. The road corridor climbs gently between stops; the
// stream and its bridge (x -5 to 4) stay on the middle level.
const rise = profile([[-47, 0], [-20.5, 0], [-10, 3], [3.5, 3], [12.5, 6], [47, 6]])
// Behind the houses and shops the ground is terraced so each building stands on one level:
// the climbs sit in the gaps between buildings.
const lots = profile([[-47, 0], [-18.9, 0], [-16.6, 3], [3.2, 3], [7, 6], [47, 6]])
const back = (z) => Math.min(1, Math.max(0, (Math.abs(z) - 6.5) / 3))
const lerpBack = (x, z) => {
  const w = back(z)
  const t = w * w * (3 - 2 * w)
  return rise(x) * (1 - t) + lots(x) * t
}

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
  terrain: lerpBack,
  brandSign: { x: 18.6, z: 13.6, y: 8.4, face: -Math.PI / 2, scale: 1.3 },
  ride: { dy: 10, dz: -44, style: 'spiral' },
})
export { Scenery }
