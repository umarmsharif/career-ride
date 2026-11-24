// The night city for one district: streets, buildings, windows, the route and its stops.
// Pure data, generated from a seed, so the scene and the tests agree on where everything is.
import { rng } from '../engine/kit.js'

export const PITCH = 26
export const STREET = 9
export const BLOCK = PITCH - STREET
export const XS = [-104, -78, -52, -26, 0, 26, 52, 78, 104]
export const ZS = [-52, -26, 0, 26, 52]

// The camera never turns. It sits to the south-east and looks down at this angle, so only the
// south and east faces of buildings are ever seen.
export const CAM_DIR = (() => {
  const el = (54 * Math.PI) / 180
  const az = Math.atan2(0.507, 0.862)
  return { x: Math.cos(el) * Math.sin(az), y: Math.sin(el), z: Math.cos(el) * Math.cos(az), el, az }
})()

// The route: street corners in order. `r` is the corner radius; drift corners are taken wide.
const WAY = [
  [-134, 0],
  [-78, 0, 7],
  [-78, -26, 7],
  [-26, -26, 15, 'drift'],
  [-26, 26, 7],
  [26, 26, 7],
  [26, -26, 15, 'drift'],
  [78, -26, 7],
  [78, 0, 7],
  [99, 0],
]

export const STOP_SPOTS = [[-91, 0], [-52, -26], [-26, 0], [0, 26], [26, 0], [52, -26]]
export const ZONE_R = 37

const sm = (t) => {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}
const wrap = (a) => {
  while (a > Math.PI) a -= Math.PI * 2
  while (a < -Math.PI) a += Math.PI * 2
  return a
}

export function buildPath() {
  const raw = []
  const drifts = []
  const corners = []
  let from = WAY[0]
  for (let i = 1; i < WAY.length; i++) {
    const c = WAY[i]
    const next = WAY[i + 1]
    const din = norm(c[0] - WAY[i - 1][0], c[1] - WAY[i - 1][1])
    if (!next) {
      line(raw, from, c)
      break
    }
    const dout = norm(next[0] - c[0], next[1] - c[1])
    const r = c[2]
    const a = [c[0] - din[0] * r, c[1] - din[1] * r]
    const b = [c[0] + dout[0] * r, c[1] + dout[1] * r]
    line(raw, from, a)
    const start = raw.length
    // Quarter circle from a to b.
    const centre = [a[0] + dout[0] * r, a[1] + dout[1] * r]
    const a0 = Math.atan2(a[1] - centre[1], a[0] - centre[0])
    const a1 = a0 + wrap(Math.atan2(b[1] - centre[1], b[0] - centre[0]) - a0)
    const n = Math.ceil((Math.abs(a1 - a0) * r) / 0.5)
    for (let k = 1; k <= n; k++) {
      const t = a0 + ((a1 - a0) * k) / n
      raw.push([centre[0] + Math.cos(t) * r, centre[1] + Math.sin(t) * r])
    }
    const turn = Math.sign(wrap(Math.atan2(dout[0], dout[1]) - Math.atan2(din[0], din[1])))
    corners.push({ start, end: raw.length - 1, turn, drift: c[3] === 'drift' })
    from = b
  }
  // Arc length, tangent and heading at every point.
  const pts = raw.map(([x, z]) => ({ x, z, s: 0, tx: 1, tz: 0, yaw: Math.PI / 2, drift: 0, turn: 0, corner: 0 }))
  for (let i = 1; i < pts.length; i++) pts[i].s = pts[i - 1].s + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z)
  for (let i = 0; i < pts.length; i++) {
    const p = pts[Math.max(0, i - 1)]
    const q = pts[Math.min(pts.length - 1, i + 1)]
    const d = norm(q.x - p.x, q.z - p.z)
    pts[i].tx = d[0]
    pts[i].tz = d[1]
    pts[i].yaw = Math.atan2(d[0], d[1])
  }
  for (const c of corners) {
    const sA = pts[c.start].s
    const sB = pts[c.end].s
    if (c.drift) drifts.push({ sA, sB, turn: c.turn })
    for (const p of pts) {
      const near = sm((p.s - (sA - 9)) / 9) * (1 - sm((p.s - sB) / 9))
      p.corner = Math.max(p.corner, near)
      if (c.drift) {
        const w = sm((p.s - (sA - 13)) / 15) * (1 - sm((p.s - (sB - 2)) / 18))
        if (w > p.drift) {
          p.drift = w
          p.turn = c.turn
        }
      }
    }
  }
  const length = pts[pts.length - 1].s
  let cursor = 0
  function at(s, out) {
    const t = Math.min(length, Math.max(0, s))
    if (pts[cursor].s > t) cursor = 0
    while (cursor < pts.length - 2 && pts[cursor + 1].s < t) cursor++
    const a = pts[cursor]
    const b = pts[cursor + 1]
    const k = b.s > a.s ? (t - a.s) / (b.s - a.s) : 0
    out.x = a.x + (b.x - a.x) * k
    out.z = a.z + (b.z - a.z) * k
    out.yaw = a.yaw + wrap(b.yaw - a.yaw) * k
    out.drift = a.drift + (b.drift - a.drift) * k
    out.corner = a.corner + (b.corner - a.corner) * k
    out.turn = a.drift > b.drift ? a.turn : b.turn
    return out
  }
  return { pts, length, at, drifts }
}

function norm(x, z) {
  const l = Math.hypot(x, z) || 1
  return [x / l, z / l]
}
function line(raw, a, b) {
  const l = Math.hypot(b[0] - a[0], b[1] - a[1])
  const n = Math.max(1, Math.ceil(l / 0.5))
  for (let k = raw.length ? 1 : 0; k <= n; k++) raw.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n])
}

// Dot-matrix letters, five wide and seven tall, for the figures written in windows.
const GLYPHS = {
  0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  5: ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  6: ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  9: ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
}
export const BOARD = { cols: 17, rows: 9, px: 0.9, py: 1.2, w: 16, d: 9, h: 13 }

// Which windows of a scoreboard are lit to spell `text` (up to three characters).
function boardPixels(text) {
  const on = new Set()
  const chars = [...text].slice(0, 3)
  const width = chars.length * 6 - 1
  const x0 = Math.floor((BOARD.cols - width) / 2)
  chars.forEach((ch, k) => {
    const g = GLYPHS[ch]
    if (!g) return
    g.forEach((row, y) => [...row].forEach((bit, x) => bit === '1' && on.add(`${x0 + k * 6 + x},${y + 1}`)))
  })
  return on
}

// How tall a building may be before it would hide part of the route, or a scoreboard, from the fixed camera.
function heightLimit(path, cx, cz, w, d) {
  const gx = -Math.sin(CAM_DIR.az)
  const gz = -Math.cos(CAM_DIR.az)
  const half = (w / 2) * Math.abs(gx) + (d / 2) * Math.abs(gz)
  const side = (w / 2) * Math.abs(gz) + (d / 2) * Math.abs(gx) + 2.2
  let limit = Infinity
  for (let i = 0; i < path.pts.length; i++) {
    const p = path.pts[i]
    const rx = p.x - cx
    const rz = p.z - cz
    const along = rx * gx + rz * gz
    if (along <= 0) continue
    if (Math.abs(rx * gz - rz * gx) > side) continue
    limit = Math.min(limit, Math.max(0, along - half) * Math.tan(CAM_DIR.el) - 2.4)
  }
  return limit
}

export function buildCity(seed = 11, texts = []) {
  const r = rng(seed)
  const path = buildPath()
  const stops = STOP_SPOTS.map(([x, z], i) => ({ i, x, z, tower: null }))
  const buildings = []
  const plazas = []
  const blocks = []
  for (let i = 0; i < XS.length - 1; i++) {
    for (let j = 0; j < ZS.length - 1; j++) blocks.push({ cx: XS[i] + PITCH / 2, cz: ZS[j] + PITCH / 2 })
  }
  // Each stop's landmark tower stands on the block to its north-west (or north, or west), so it
  // rises behind the road as the camera sees it and hides nothing.
  for (const s of stops) {
    for (const [ox, oz] of [[-13, -13], [0, -13], [-13, 0], [13, -13]]) {
      const b = blocks.find((q) => Math.abs(q.cx - (s.x + ox)) < 1 && Math.abs(q.cz - (s.z + oz)) < 1 && !stops.some((t) => t.block === q))
      if (b) {
        s.block = b
        break
      }
    }
  }
  // Scoreboards first: every other building is then kept low enough not to hide them.
  const protect = { pts: path.pts.filter((_, i) => i % 3 === 0).map((p) => ({ x: p.x, z: p.z })) }
  for (const s of stops) {
    const t = { x: s.block.cx, z: s.block.cz + (BLOCK - BOARD.d) / 2 - 0.5, w: BOARD.w, d: BOARD.d, h: BOARD.h, tower: true, tone: 4 }
    buildings.push(t)
    s.tower = t
    for (let x = -8; x <= 8; x += 2) protect.pts.push({ x: t.x + x, z: t.z + t.d / 2 + 0.6 })
  }
  for (const b of blocks) {
    // The block north-west of a stop carries that stop's landmark tower, where it hides nothing.
    const stop = stops.find((s) => s.block === b)
    if (stop) continue
    for (const [ox, oz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const w = 6.2 + r() * 1.6
      const d = 6.2 + r() * 1.6
      const x = b.cx + ox * 4.3
      const z = b.cz + oz * 4.3
      const limit = heightLimit(protect, x, z, w, d)
      let h = 6 + r() * r() * 20
      if (limit < h) h = limit
      if (h < 2.4) {
        plazas.push({ x, z })
        continue
      }
      buildings.push({ x, z, w, d, h, tower: false, tone: Math.floor(r() * 4), tier: h > 11 && r() < 0.6 ? 2.5 + r() * 4 : 0 })
    }
  }
  // Windows on the two faces the camera sees.
  const windows = []
  for (const b of buildings) {
    if (b.tower) continue
    const rows = Math.floor((b.h - 1.6) / 2.1)
    const colsZ = Math.floor((b.w - 1.2) / 1.55)
    const colsX = Math.floor((b.d - 1.2) / 1.55)
    for (let row = 0; row < rows; row++) {
      const y = 1.9 + row * 2.1
      for (let c = 0; c < colsZ; c++) windows.push({ x: b.x - ((colsZ - 1) * 1.55) / 2 + c * 1.55, y, z: b.z + b.d / 2 + 0.03, face: 0, bx: b.x, bz: b.z })
      for (let c = 0; c < colsX; c++) windows.push({ x: b.x + b.w / 2 + 0.03, y, z: b.z - ((colsX - 1) * 1.55) / 2 + c * 1.55, face: 1, bx: b.x, bz: b.z })
    }
  }
  // Scoreboard windows: a grid on the south face; the ones that spell the figure will light.
  const dots = []
  for (const s of stops) {
    const t = s.tower
    const on = boardPixels(texts[s.i] ?? '')
    for (let row = 0; row < BOARD.rows; row++) {
      for (let c = 0; c < BOARD.cols; c++) {
        dots.push({ x: t.x + (c - (BOARD.cols - 1) / 2) * BOARD.px, y: 1.25 + (BOARD.rows - 1 - row) * BOARD.py, z: t.z + t.d / 2 + 0.04, face: 0, sx: 0.8, sy: 0.84, zone: s.i, dist: 4 + c * 1.6, rand: r() * 0.2, will: on.has(`${c},${row}`), early: false, dot: true })
      }
    }
  }
  for (const w of windows) {
    let best = -1
    let bd = ZONE_R
    stops.forEach((s) => {
      const d = Math.hypot(s.x - w.bx, s.z - w.bz)
      if (d < bd) {
        bd = d
        best = s.i
      }
    })
    w.zone = best
    w.dist = bd
    w.rand = r()
    w.will = best >= 0 && r() < 0.7 // not every window comes on, as in a real street
    w.early = r() < 0.06 // a few lights are on before anyone arrives
  }
  // The rest of the city, dark and low on the camera's side so it never hides the district.
  const outer = []
  for (let x = -338; x <= 338; x += PITCH) {
    for (let z = -260; z <= 208; z += PITCH) {
      const inside = x > XS[0] - 2 && x < XS[XS.length - 1] && z > ZS[0] - 2 && z < ZS[ZS.length - 1]
      if (inside) continue
      const near = z > ZS[ZS.length - 1] - 2 || x > XS[XS.length - 1] - 2
      for (const [ox, oz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        if (r() < 0.12) continue
        const h = near ? 1.6 + r() * 3 : 5 + r() * r() * 22
        outer.push({ x: x + PITCH / 2 + ox * 4.3, z: z + PITCH / 2 + oz * 4.3, w: 6.4 + r() * 1.4, d: 6.4 + r() * 1.4, h })
      }
    }
  }
  // Street lamps along the route, on the far side of the road from the camera.
  const lamps = []
  for (let s = 6; s < path.length - 4; s += 13) {
    const p = path.at(s, {})
    const nx = Math.cos(p.yaw)
    const nz = -Math.sin(p.yaw)
    const far = nx * CAM_DIR.x + nz * CAM_DIR.z < 0 ? 1 : -1
    lamps.push({ x: p.x + nx * far * 5.4, z: p.z + nz * far * 5.4 })
  }
  windows.push(...dots)
  // Roof edges that light up in the company's colour when a result reaches the building, so
  // light that comes from a result looks different from an ordinary lit window.
  const trims = []
  for (const b of buildings) {
    let zone = -1
    let bd = ZONE_R
    stops.forEach((st) => {
      const d = Math.hypot(st.x - b.x, st.z - b.z)
      if (d < bd) {
        bd = d
        zone = st.i
      }
    })
    if (zone < 0) continue
    const y = b.h + 0.66
    trims.push({ x: b.x, y, z: b.z + b.d / 2, sx: b.w + 0.34, sz: 0.2, zone, dist: bd })
    trims.push({ x: b.x + b.w / 2, y, z: b.z, sx: 0.2, sz: b.d + 0.34, zone, dist: bd })
  }
  return { path, stops, buildings, plazas, blocks, windows, trims, outer, lamps }
}
