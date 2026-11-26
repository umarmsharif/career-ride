// Plans a station as a night city block: where the ordinary buildings and the company's tower
// stand. Worked out from the station's own road, route, stops and land, so every station gets a
// block that fits it. Positions only; nothing here is a career fact.
import { insideOutline, rng } from './kit.js'

const zAt = (pts, x) => {
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1]
    const [bx, bz] = pts[i]
    if (x <= bx) return az + ((bz - az) * (x - ax)) / (bx - ax || 1)
  }
  return pts[pts.length - 1][1]
}

export function planCity({ id, len, outline, road, tour, stops, terrain, keep, last }) {
  const h = terrain || (() => 0)
  // Everything the car may drive over.
  const paths = [...road, ...tour, ...stops]
  // A building needs level ground under all of it.
  const level = (x, z, half) => {
    let lo = Infinity
    let hi = -Infinity
    for (const a of [-1, 0, 1]) for (const b of [-1, 0, 1]) {
      const y = h(x + a * half, z + b * half)
      lo = Math.min(lo, y)
      hi = Math.max(hi, y)
    }
    return hi - lo < 0.45
  }
  const inside = (x, z, half) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].every(([a, b]) => insideOutline(outline, x + a * (half + 0.9), z + b * (half + 0.9)))
  // Stand back from the outermost thing the car uses along this stretch.
  const setBack = (x, side, half, gap) => {
    let edge = side * zAt(road, x)
    for (const [px, pz] of paths) if (Math.abs(px - x) < half + 3.5) edge = Math.max(edge, side * pz)
    return side * (edge + gap + half)
  }
  const free = (x, z, half) => inside(x, z, half) && level(x, z, half) && !keep.some((o) => Math.hypot(x - o.x, z - o.z) < o.r + half)

  // The company's tower: towards the far end, on whichever side has room, with open ground
  // on its near side so the road has a clear view of it.
  let tower = null
  const th = 4.6
  for (const side of [-1, 1]) {
    for (let x = len * 0.72; x > -len * 0.2 && !tower; x -= 1.5) {
      const z = setBack(x, side, th, 3.6)
      if (free(x, z, th)) tower = { x, z, w: th * 2, d: th * 2, h: last ? 17 : 13.5, cols: 23, rows: last ? 18 : 14, side }
    }
    if (tower) break
  }

  const r = rng(id * 53 + 8)
  const blocks = []
  for (const side of [-1, 1]) {
    // The first stretch past the entrance stays open, so the camera behind the car starts with
    // a clear view down the street.
    for (let x = -len + 15; x <= len - 6; x += 6.9) {
      const half = 2.7 + r() * 0.5
      const tall = 5.5 + r() * 8.5
      const tone = Math.floor(r() * 3)
      const seed = Math.floor(r() * 1e6)
      const z = setBack(x, side, half, 4.6)
      if (!free(x, z, half)) continue
      if (tower && side === tower.side && x > tower.x - 25 && x < tower.x + th + half + 1.5) continue
      blocks.push({ x, z, half, h: tall, side, tone, seed })
    }
  }
  // Station 1 gives two of its lots to the squares of the two European cities worked in.
  if (id === 1) {
    const south = blocks.filter((b) => b.side > 0 && b.x > -30)
    for (const [i, name] of [[0, 'brussels'], [Math.min(3, south.length - 1), 'madrid']]) if (south[i]) south[i].landmark = name
  }
  const colliders = [...blocks.map((b) => ({ x: b.x, z: b.z, r: b.half + 0.7, h: b.h })), ...(tower ? [{ x: tower.x, z: tower.z, r: 5.4, h: tower.h }] : [])]
  return { tower, blocks, colliders }
}
