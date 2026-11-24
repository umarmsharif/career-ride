// Food Delivery Street (island 6): where things are. Facts come from career.json;
// this file only holds positions and the shape of the land.
import career from '../../content/career.json'

const data = career.islands.find((i) => i.id === 6)

// A peanut-shaped island: two round districts joined by a narrow neck.
function makeOutline() {
  const pts = []
  const n = 76
  for (let i = 0; i < n; i++) {
    const th = (i / n) * Math.PI * 2
    const wob = 1 + 0.035 * Math.sin(3 * th + 1.3) + 0.025 * Math.sin(7 * th + 0.4)
    const x = 47 * Math.cos(th)
    const half = 21.5 - 10.5 * Math.exp(-((x / 10) ** 2))
    pts.push([x * (0.985 + 0.015 * wob), half * Math.sin(th) * wob])
  }
  return pts
}

const road = [
  [-47, 0], [-38, 0], [-30, -2.6], [-22, -3.8], [-12, -3], [-4, -0.8],
  [3, 0.6], [10, 3], [20, 4.5], [30, 3.6], [38, 0.8], [47, 0],
]

// Houses of the Home Kitchens district. `face` is the direction the kitchen window looks.
const houses = [
  { x: -31, z: 10.2, face: Math.PI, wall: '#fff1dc', roof: '#e2674a', awning: '#1f9d8f' },
  { x: -22, z: 13.4, face: Math.PI, wall: '#ffe2c4', roof: '#2f8f8a', awning: '#f0553f' },
  { x: -13, z: 10.6, face: Math.PI, wall: '#dcecf2', roof: '#f2a541', awning: '#e2674a' },
  { x: -33, z: -11.6, face: 0, wall: '#fbe6a8', roof: '#c9503e', awning: '#2f8f8a' },
  { x: -23.5, z: -14.2, face: 0, wall: '#fff1dc', roof: '#f2a541', awning: '#f0553f' },
  { x: -13.5, z: -12.2, face: 0, wall: '#f6d9cf', roof: '#2f8f8a', awning: '#f2a541' },
]

// Restaurant fronts of Merchant Row.
const shops = [
  { x: 11, z: 12.6, wall: '#fff1dc', trim: '#e2674a' },
  { x: 18.6, z: 13.6, wall: '#dcecf2', trim: '#2f8f8a' },
  { x: 26.2, z: 13.1, wall: '#fbe6a8', trim: '#c9503e' },
  { x: 33.4, z: 10.6, wall: '#ffe2c4', trim: '#1f9d8f' },
]

const tables = [
  { x: 14, z: -3.6, c: '#f0553f' },
  { x: 21, z: -5.4, c: '#f2a541' },
  { x: 28, z: -4.4, c: '#1f9d8f' },
]

const helpDesk = { x: 34.2, z: -4.6 }
const well = { x: -27.5, z: 5.6 }
const scoreboard = { x: -8.5, z: 3.2 }

const pickupSpots = [
  [-29.5, -2.6], [-22, 3.4], [-11.5, -3],
  [11.5, 3.4], [22, 4.6], [31.5, 3.2],
]


// `h` is how tall the thing is, so the camera knows when it would hide the rider.
const colliders = [
  ...houses.map((h) => ({ x: h.x, z: h.z, r: 3.5, h: 7 })),
  ...shops.map((s) => ({ x: s.x, z: s.z, r: 3.7, h: 6.5 })),
  ...tables.map((t) => ({ x: t.x, z: t.z, r: 1.3, h: 4.4 })),
  { x: helpDesk.x, z: helpDesk.z, r: 1.8, h: 4 },
  { x: well.x, z: well.z, r: 1.3, h: 3.4 },
  { x: scoreboard.x, z: scoreboard.z, r: 1.6, h: 4.6 },
]

// Positions only. `index.js` hands these to defineIsland.
const L = {
  outline: makeOutline(),
  road,
  houses,
  shops,
  tables,
  helpDesk,
  well,
  scoreboard,
  colliders,
  stops: pickupSpots.map(([x, z]) => ({ x, z })),
  pickupSpots,
  len: 47,
}
export default L
