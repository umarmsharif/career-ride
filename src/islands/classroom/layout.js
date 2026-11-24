// The Classroom (island 9): where things are. Facts come from career.json; this file only holds positions.
import { rng } from '../../engine/kit.js'

const LEN = 47
const WID = 21.5

// Same shape defineIsland would make, built here so the mountain ring can sit on it.
function makeOutline() {
  const pts = []
  const n = 76
  for (let i = 0; i < n; i++) {
    const th = (i / n) * Math.PI * 2
    const wob = 1 + 0.035 * Math.sin(3 * th + 1.3 + 9) + 0.025 * Math.sin(7 * th + 0.4 + 18)
    const x = LEN * Math.cos(th)
    pts.push([x * (0.985 + 0.015 * wob), WID * Math.sin(th) * wob])
  }
  return pts
}
const outline = makeOutline()

const road = [
  [-47, 0], [-38, 0], [-32, -0.6], [-26, -1.2], [-18, -0.3], [-10, 0.6], [-2, 0.1], [6, -0.6],
  [14, 0], [22, 0.8], [30, 0.7], [38, 0.1], [47, 0],
]
const pickupSpots = [[-26, -1.2], [-10, 0.6], [6, -0.6], [22, 0.8]]

// Three chalkboards north of the road, angled a little towards the approaching rider.
const boards = pickupSpots.slice(0, 3).map(([x]) => ({ x, z: -6.6, yaw: -0.4 }))
const kiosk = { x: 22, z: -6.2 }
const door = { x: 43.5, z: 0 }
const finish = { x: 39.5, z: 0, radius: 3 }
const lectern = { x: 40.6, z: -5.2, yaw: -0.5 }
const bikeStand = { x: 40.8, z: 5.4 }

// Stepped benches facing east, looking toward the door. Rows climb as they go west.
const amph = { cx: 37, cz: 8, rows: [4.5, 6.3, 8.1], a0: (143 * Math.PI) / 180, a1: (217 * Math.PI) / 180 }
const benches = []
amph.rows.forEach((R, row) => {
  const n = Math.max(2, Math.round((R * (amph.a1 - amph.a0)) / 2.1))
  for (let i = 0; i < n; i++) {
    const a = amph.a0 + ((i + 0.5) / n) * (amph.a1 - amph.a0)
    const x = amph.cx + R * Math.cos(a)
    const z = amph.cz + R * Math.sin(a)
    benches.push({ x, z, row, h: 0.25 + 0.42 * row, len: ((R * (amph.a1 - amph.a0)) / n) * 0.92, yaw: Math.atan2(amph.cx - x, amph.cz - z), kind: 'amph' })
  }
})
// A pair of benches in front of each board, on the far side of the road, facing it.
boards.forEach((b, i) => {
  for (const s of [-1, 1]) {
    const x = b.x + s * 1.9
    const z = 7.6
    benches.push({ x, z, row: i, h: 0, len: 2.2, yaw: Math.atan2(b.x - x, b.z - z), kind: 'mini', board: i })
  }
})

// Listener pegs: each board wakes the pegs on its own pair of benches and one amphitheatre row.
const pegColors = ['#f0553f', '#f2a541', '#1f9d8f', '#ff8fa3', '#7fc4d8', '#fff6e4']
const pegs = []
let pc = 0
benches.forEach((bn) => {
  const board = bn.kind === 'mini' ? bn.board : bn.row
  const per = bn.kind === 'mini' ? 2 : bn.len > 2 ? 3 : 2
  for (let j = 0; j < per; j++) {
    const off = (j - (per - 1) / 2) * (bn.len / per) * 0.95
    pegs.push({
      x: bn.x + Math.cos(bn.yaw) * off,
      z: bn.z - Math.sin(bn.yaw) * off,
      y: bn.h + 0.56,
      yaw: bn.yaw,
      board,
      color: pegColors[pc++ % pegColors.length],
    })
  }
})
pegs.forEach((p, i) => {
  p.order = pegs.filter((q, j) => j < i && q.board === p.board).length
})

// Ring of low-poly peaks on the rim. Gaps are left where the road enters and leaves.
const peaks = []
{
  const r = rng(909)
  for (let i = 1; i < outline.length; i += 3) {
    const [ox, oz] = outline[i]
    if (Math.abs(oz) < 7.5 && Math.abs(ox) > 33) continue
    const x = ox * 0.93
    const z = oz * 0.93
    const west = x < -20 ? 1.25 : 1
    const base = (3.3 + r() * 1.5) * (Math.abs(oz) < 8 ? 0.85 : 1)
    const east = x > 30 ? 0.5 : 1
    const h = (6 + r() * 6.5) * west * east
    peaks.push({ x, z, base, h, tint: Math.floor(r() * 3), rot: r() * 6 })
  }
}

const colliders = [
  ...boards.flatMap((b) => [-2.6, 0, 2.6].map((o) => ({ x: b.x + o * Math.cos(b.yaw), z: b.z - o * Math.sin(b.yaw), r: 1.4, h: 5.5 }))),
  { x: kiosk.x, z: kiosk.z, r: 2.4, h: 5 },
  { x: door.x, z: -2.3, r: 0.8, h: 6 },
  { x: door.x, z: 2.3, r: 0.8, h: 6 },
  { x: door.x, z: -3.7, r: 0.4, h: 3 },
  { x: door.x, z: 3.7, r: 0.4, h: 3 },
  { x: lectern.x, z: lectern.z, r: 0.9, h: 2 },
  { x: bikeStand.x, z: bikeStand.z, r: 1.3, h: 1.6 },
  ...benches.map((b) => ({ x: b.x, z: b.z, r: b.kind === 'mini' ? 1.1 : 1.3, h: 1.6 })),
  ...peaks.map((p) => ({ x: p.x, z: p.z, r: p.base * 0.78, h: p.h })),
]

const L = { outline, road, pickupSpots, boards, kiosk, door, finish, lectern, bikeStand, amph, benches, pegs, peaks, colliders, len: LEN }
export default L
