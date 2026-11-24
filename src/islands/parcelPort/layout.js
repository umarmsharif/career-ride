// Parcel Port (island 5): where things are. Facts come from career.json.
import { rng, insideOutline } from '../../engine/kit.js'
import { clearance } from '../../engine/props.js'

const len = 47
const wid = 21.5

function makeOutline() {
  const pts = []
  const n = 76
  for (let i = 0; i < n; i++) {
    const th = (i / n) * Math.PI * 2
    const wob = 1 + 0.035 * Math.sin(3 * th + 1.3 + 5) + 0.025 * Math.sin(7 * th + 0.4 + 10)
    const x = len * Math.cos(th)
    pts.push([x * (0.985 + 0.015 * wob), wid * Math.sin(th) * wob])
  }
  return pts
}

const outline = makeOutline()

const road = [
  [-47, 0], [-38, 0], [-31, -1.2], [-24, -1.8], [-14, -1], [-6, 0.5],
  [2, 1.3], [12, 1.5], [22, 0.3], [30, -0.6], [38, 0], [47, 0],
]
const pickupSpots = [[-24, -1.8], [2, 1.3], [30, -0.6]]

const warehouse = { x: -26, z: -10.5 }
const depotDoor = [-26, -6.4]

// Container stacks: x, z, levels, colour order.
const COLORS = ['#f0553f', '#1f9d8f', '#f2a541', '#fff1dc', '#22304f']
const stacks = [
  { x: -30, z: 10.2, n: 3, c: [0, 1, 2] }, { x: -24.5, z: 10.2, n: 2, c: [3, 0] }, { x: -19, z: 10.2, n: 3, c: [4, 2, 1] },
  { x: -30, z: 13.4, n: 2, c: [1, 3] }, { x: -24.5, z: 13.4, n: 3, c: [2, 4, 0] }, { x: -19, z: 13.4, n: 1, c: [0] },
]
const crane = { x: -7, z0: 7.2, z1: 15.8 }

const belts = [
  { x0: -4, x1: 5.5, z: 7.2, dir: 1 },
  { x0: -4, x1: 5.5, z: -7.4, dir: -1 },
]
const clockPos = { x: warehouse.x, y: 7.5, z: warehouse.z + 4.15 }
const board = { x: 0, z: -12.5 }
const kiosk = { x: 32, z: 5.4 }
const quay = { x0: 21, x1: 37, z0: 11.4, z1: 15.2 }
const boat = { x: 27.5, z: 21.6 }
const vans = Array.from({ length: 8 }, (_, i) => ({ x: 22 + i * 2.4, z: -11.2 }))
const VAN_COLORS = ['#f0553f', '#1f9d8f', '#f2a541', '#fff1dc', '#22304f', '#ff8fa3', '#7fc4d8', '#7cc36a', '#ff8a3d', '#a58be0']

const colliders = [
  ...[-31.5, -26, -20.5].map((x) => ({ x, z: warehouse.z, r: 4.8, h: 7 })),
  ...stacks.map((s) => ({ x: s.x, z: s.z, r: 3.3, h: 2.8 * s.n + 1 })),
  { x: crane.x, z: crane.z0, r: 1.3, h: 9 },
  { x: crane.x, z: crane.z1, r: 1.3, h: 9 },
  ...belts.flatMap((b) => {
    const out = []
    for (let x = b.x0 + 1; x <= b.x1 - 0.5; x += 2.4) out.push({ x, z: b.z, r: 1.3, h: 1.5 })
    return out
  }),
  { x: board.x - 2.6, z: board.z, r: 1.8, h: 6 },
  { x: board.x + 2.6, z: board.z, r: 1.8, h: 6 },
  ...vans.map((v) => ({ x: v.x, z: v.z, r: 1.5, h: 2.6 })),
  { x: kiosk.x, z: kiosk.z, r: 1.6, h: 4 },
  { x: quay.x0 + 3.2, z: quay.z0 + 1.6, r: 3.2, h: 5.5 },
]

// Small destination pins all over the island.
function makePins() {
  const r = rng(5150)
  const base = { outline, road, colliders, stops: pickupSpots.map(([x, z]) => ({ x, z })) }
  const free = clearance(base)
  const pins = []
  for (let i = 0; i < 4000 && pins.length < 46; i++) {
    const x = -42 + r() * 84
    const z = -19 + r() * 38
    if (!free(x, z, 1.2)) continue
    if (!insideOutline(outline, x * 1.1, z * 1.12)) continue
    if (x > 8 && z > 9.5) continue // quay
    if (x < -10 && z > 5.5 && z < 16.5) continue // container yard
    if (x < -10 && z < -5) continue // depot yard
    if (x > 18 && x < 42 && z < -8) continue // vans
    if (Math.hypot(x - kiosk.x, z - kiosk.z) < 5) continue
    if (Math.abs(x - board.x) < 6 && z < -9) continue
    if (x > 38 || x < -40) continue
    if (pins.some((p) => Math.hypot(p.x - x, p.z - z) < 3.8)) continue
    pins.push({ x, z, c: Math.floor(r() * 5) })
  }
  return pins
}

const L = {
  len, wid, outline, road, pickupSpots, warehouse, depotDoor, stacks, COLORS, crane, belts, clockPos,
  board, kiosk, quay, boat, vans, VAN_COLORS, colliders, pins: makePins(),
}
export default L
