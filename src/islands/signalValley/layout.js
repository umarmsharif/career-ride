// Signal Valley (island 3): where things are. Facts come from career.json.
import * as THREE from 'three'
import { rng } from '../../engine/kit.js'

export const LEN = 40
const WID = 21.5

const road = [
  [-40, 0], [-34, 0], [-28, -1.5], [-20, -3.5], [-12, -3.8], [-5, -1.5], [2, 1.5],
  [10, 3.5], [18, 3.5], [26, 1.5], [33, 0], [36, 0], [40, 0],
]
const curve = new THREE.CatmullRomCurve3(road.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal')
const samples = []
for (let i = 0; i <= 160; i++) {
  const p = curve.getPointAt(i / 160)
  samples.push([p.x, p.z])
}
// Height (z) of the road centre line at a given x.
export function roadAt(x) {
  for (let i = 0; i < samples.length - 1; i++) {
    const [x0, z0] = samples[i]
    const [x1, z1] = samples[i + 1]
    if (x >= x0 && x <= x1) return z0 + ((z1 - z0) * (x - x0)) / (x1 - x0 || 1)
  }
  return 0
}
const half = (x) => WID * Math.sqrt(Math.max(0, 1 - (x / LEN) ** 2))

// The stream runs along the south side of the road.
export const streamPts = []
for (let x = -33; x <= 35; x += 4) streamPts.push([x, roadAt(x) + 5.4 + Math.sin(x * 0.32) * 0.7])

// Signal towers: side -1 is north of the road, +1 south, beyond the stream.
const towerSpec = [[-26, -1], [-18, 1], [-9, -1], [-1, 1], [11, -1], [19, 1], [27, -1], [33, 1]]
const towers = towerSpec.map(([x, side], i) => {
  const z = roadAt(x) + (side < 0 ? -7.2 : 10.2)
  return { x, z, i, side, h: 9, beacon: [x, 9.7, z] }
})

const houses = [
  { x: -19, z: roadAt(-19) - 10.5, face: Math.PI, wall: '#fff1dc', roof: '#e2674a' },
  { x: 20, z: roadAt(20) - 10.5, face: Math.PI, wall: '#dcecf2', roof: '#f2a541' },
  { x: -9, z: roadAt(-9) + 12, face: 0, wall: '#fbe6a8', roof: '#2f8f8a' },
  { x: 8, z: roadAt(8) + 12.5, face: 0, wall: '#ffe2c4', roof: '#c9503e' },
  { x: 26, z: roadAt(26) + 11, face: 0, wall: '#f6d9cf', roof: '#2f8f8a' },
]

const stopX = 3
const stopSpot = [stopX, roadAt(stopX)]
const hut = { x: 8, z: -10, face: 0 }
const board = { x: 2.2, z: -7.2 }
const bridge = { x: -14, z: roadAt(-14) + 5.4 + Math.sin(-14 * 0.32) * 0.7 }
const sign = { x: -31.5, z: 6.2 }

const solid = [
  ...towers.map((t) => ({ x: t.x, z: t.z, r: 1.3, h: 10 })),
  ...houses.map((h) => ({ x: h.x, z: h.z, r: 2.9, h: 6.5 })),
  { x: hut.x, z: hut.z, r: 3.1, h: 5 },
  { x: board.x, z: board.z, r: 2.4, h: 5 },
]

// Valley walls: rows of chunky hills, then rock outcrops, along both edges.
const hills = []
const rocks = []
{
  const r = rng(303)
  const roadD = (x, z) => Math.min(...samples.map(([a, b]) => Math.hypot(x - a, z - b)))
  const free = (x, z, rad, pad) => {
    if (roadD(x, z) < rad + pad) return false
    if (Math.hypot(x - sign.x, z - sign.z) < rad + 3) return false
    for (const c of solid) if (Math.hypot(x - c.x, z - c.z) < rad + c.r + 1) return false
    for (const s of streamPts) if (Math.hypot(x - s[0], z - s[1]) < rad + 1.6) return false
    if (Math.abs(x) > 34 && Math.abs(z) < 6.5 + rad) return false
    return true
  }
  const palette = ['#7fc47e', '#6fb87c', '#8fcb7a', '#62b184', '#86c97f']
  for (const side of [-1, 1]) {
    for (let row = 0; row < 2; row++) {
      for (let x = -37 + r() * 3; x < 38; x += 4.2 + r() * 2.2) {
        const rad = 3.6 + r() * 2.6 + row * 0.8
        const z = side * (row === 0 ? 14.5 + r() * 3 : 20 + r() * 2)
        const lim = half(x) * 0.84
        if (Math.abs(z) + rad * 0.5 > lim + 0.8) continue
        const zz = side * Math.min(Math.abs(z), lim - rad * 0.3)
        if (!free(x, zz, rad * 0.85, 2.5)) continue
        hills.push({ x, z: zz, r: rad, c: palette[Math.floor(r() * palette.length)], row })
      }
    }
    // Outcrops at the foot of the walls.
    for (let x = -36 + r() * 3; x < 37; x += 7 + r() * 5) {
      const z = side * (11 + r() * 2.5)
      const rad = 1.5 + r() * 0.9
      if (Math.abs(z) > half(x) * 0.8) continue
      if (!free(x, z, rad, 1.8)) continue
      if (hills.some((h) => Math.hypot(h.x - x, h.z - z) < h.r * 0.85 + rad * 0.5)) continue
      rocks.push({ x, z, r: rad, rot: r() * 6 })
    }
  }
}

const colliders = [
  ...solid,
  ...hills.map((h) => ({ x: h.x, z: h.z, r: h.r * 0.82, h: h.r * 0.9 })),
  ...rocks.map((o) => ({ x: o.x, z: o.z, r: o.r * 0.9, h: o.r * 1.6 })),
]

const tour = [
  [-31, 0], [-28.6, 0.2],
  ...[-24, -18, -12, -6].map((x) => [x, roadAt(x)]),
  stopSpot,
  ...[10, 16, 22, 28, 33].map((x) => [x, roadAt(x)]),
  [38.5, 0],
]

const L = { LEN, road, towers, houses, hut, board, bridge, hills, rocks, colliders, stopSpot, tour, sign, streamPts }
export default L
