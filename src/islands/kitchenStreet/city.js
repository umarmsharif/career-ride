// Food Delivery Street as a night city block: where the buildings stand.
// Positions only; nothing here is a career fact.
import L from './layout.js'
import { insideOutline, rng } from '../../engine/kit.js'

// The company's tower. Its windows are a grid of `cols` by `rows` lights on the two faces the
// driver sees: the west face on the way in, and the south face beside the road.
export const tower = { x: 33.5, z: -7.8, w: 8.5, d: 8.5, h: 13.5, cols: 17, rows: 14 }

const zAt = (pts, x) => {
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1]
    const [bx, bz] = pts[i]
    if (x <= bx) return az + ((bz - az) * (x - ax)) / (bx - ax || 1)
  }
  return pts[pts.length - 1][1]
}

// Everything the car may drive over: the road, the hands-free route and the stops.
const paths = [...L.road, ...L.tour, ...L.pickupSpots]
// The two places where the ground steps up; a building must not straddle one.
const steps = [[-19.6, -15.9], [2.5, 7.7]]
// Kept open: the signboard and profile stand, the two district boards, and the square in front
// of the tower so nothing hides it from the road.
const open = [
  { x: -38.5, z: 6.2, r: 6.5 },
  { x: -35.5, z: -6.6, r: 4 },
  { x: 5.5, z: -5.2, r: 4 },
]

function plan() {
  const r = rng(61)
  const out = []
  for (const side of [-1, 1]) {
    for (let x = -40.5; x <= 41; x += 6.9) {
      const half = 2.7 + r() * 0.5
      // Stand back from the outermost thing the car uses along this stretch.
      let edge = side * zAt(L.road, x)
      for (const [px, pz] of paths) if (Math.abs(px - x) < half + 3.5) edge = Math.max(edge, side * pz)
      const z = side * (edge + 4.6 + half)
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [x + a * (half + 0.9), z + b * (half + 0.9)])
      if (!corners.every(([cx, cz]) => insideOutline(L.outline, cx, cz))) continue
      if (steps.some(([a, b]) => x + half > a && x - half < b)) continue
      if (open.some((o) => Math.hypot(x - o.x, z - o.z) < o.r + half)) continue
      if (side < 0 && x > 8) continue
      out.push({ x, z, half, h: 5.5 + r() * 8.5, side, tone: Math.floor(r() * 3), seed: Math.floor(r() * 1e6) })
    }
  }
  return out
}

export const blocks = plan()

export const cityColliders = [
  ...blocks.map((b) => ({ x: b.x, z: b.z, r: b.half + 0.7, h: b.h })),
  { x: tower.x, z: tower.z, r: 5.4, h: tower.h },
]
