// The Workshop (island 1): where things are. Facts come from career.json.
import career from '../../content/career.json'

export const data = career.islands.find((i) => i.id === 1)

const road = [
  [-47, 0], [-38, 0], [-30, 1.5], [-18, 1.3], [-8, 0], [2, -1.5], [12, -2.4],
  [20, -2.6], [29, -2], [37, -0.6], [43, 0], [47, 0],
]

export function roadZ(x) {
  for (let i = 0; i < road.length - 1; i++) {
    if (x >= road[i][0] && x <= road[i + 1][0]) {
      const u = (x - road[i][0]) / (road[i + 1][0] - road[i][0])
      return road[i][1] + (road[i + 1][1] - road[i][1]) * u
    }
  }
  return 0
}

const pickupSpots = [[-29, 1.5], [-17, 1.3], [20, -2.6]]

const shed = { x: -26, z: -12, w: 18, d: 9, h: 4.8 }
const plinth = { x: -29, z: 6.6 }
const gearWall = { x: -12.5, z: -5.5 }
const benches = [{ x: -31, z: -4.2 }, { x: -22, z: -4.2 }, { x: -20, z: 9.5 }]
const computerDesk = { x: -38, z: -7.5 }
const cabinets = { x: -12.8, z: -13.5 }
const spools = [{ x: -6, z: -9 }, { x: -3.6, z: -12.2 }]
const drafting = { x: -34, z: 11.2 }
const crates = { x: -24, z: 12.4 }

// Town houses: narrow and tall. kind 0 steep roof, 1 stepped gable.
const H = '#fff1dc'
const houses = [
  // Town A, north then south of the road.
  { x: 4, z: -9.5, face: 0, w: 3.4, h: 5.6, wall: '#ffe2c4', roof: '#c9503e', kind: 1 },
  { x: 8.8, z: -9.6, face: 0, w: 3.8, h: 4.8, wall: '#dcecf2', roof: '#2f8f8a', kind: 0 },
  { x: 13.8, z: -9.5, face: 0, w: 3.4, h: 6.2, wall: '#fbe6a8', roof: '#e2674a', kind: 1 },
  { x: 5, z: 8.8, face: Math.PI, w: 3.6, h: 5.0, wall: '#f6d9cf', roof: '#5b6b8a', kind: 0 },
  { x: 9.8, z: 8.6, face: Math.PI, w: 3.4, h: 6.0, wall: H, roof: '#c9503e', kind: 1 },
  { x: 15.4, z: 8.8, face: Math.PI, w: 3.8, h: 4.6, wall: '#ffe2c4', roof: '#f2a541', kind: 0 },
  // Town B.
  { x: 25.5, z: -9.4, face: 0, w: 3.6, h: 5.2, wall: '#f6d9cf', roof: '#2f8f8a', kind: 1 },
  { x: 30.4, z: -9.5, face: 0, w: 3.4, h: 6.4, wall: H, roof: '#e2674a', kind: 0 },
  { x: 35, z: -8.2, face: 0, w: 3.6, h: 4.8, wall: '#dcecf2', roof: '#c9503e', kind: 1 },
  { x: 24.4, z: 10.6, face: Math.PI, w: 3.6, h: 5.4, wall: '#fbe6a8', roof: '#5b6b8a', kind: 1 },
  { x: 35.6, z: 9.0, face: Math.PI, w: 3.4, h: 5.8, wall: '#ffe2c4', roof: '#2f8f8a', kind: 0 },
]
const tower = { x: 19.5, z: -9.8 }
const plaza = { x: 30, z: 8.6, r: 4.6 }
const stall = { x: 11, z: 4.6 }
const pennants = [
  { x: -3, c: '#1f9d8f' },
  { x: 13, c: '#f0553f' },
  { x: 33, c: '#f2a541' },
].map((p) => ({ ...p, z: roadZ(p.x) + 3.9 }))

const colliders = [
  ...[-32, -26, -20].map((x) => ({ x, z: shed.z, r: 4.6, h: 7 })),
  ...benches.map((b) => ({ x: b.x, z: b.z, r: 1.9, h: 2 })),
  { x: computerDesk.x, z: computerDesk.z, r: 2.2, h: 3.5 },
  { x: cabinets.x, z: cabinets.z, r: 3, h: 4 },
  ...[-15, -12.5, -10].map((x) => ({ x, z: gearWall.z, r: 1.7, h: 5 })),
  ...spools.map((s) => ({ x: s.x, z: s.z, r: 1.4, h: 2 })),
  { x: drafting.x, z: drafting.z, r: 2.2, h: 3 },
  { x: plinth.x, z: plinth.z, r: 1.5, h: 2 },
  { x: crates.x, z: crates.z, r: 1.4, h: 2 },
  ...houses.map((h) => ({ x: h.x, z: h.z, r: 2.6, h: h.h + 2 })),
  { x: tower.x, z: tower.z, r: 2.4, h: 13 },
  { x: plaza.x, z: plaza.z, r: 1.9, h: 3 },
  { x: stall.x, z: stall.z, r: 1.5, h: 3 },
]

const tour = [
  [-38, 0], [-35.6, 0.2], [-29, 1.5], [-23, 1.5], [-17, 1.3], [-8, 0], [2, -1.5], [12, -2.4],
  [20, -2.6], [29, -2], [37, -0.6], [45.5, 0],
]

export default {
  road, pickupSpots, shed, plinth, gearWall, benches, computerDesk, cabinets, spools,
  drafting, crates, houses, tower, plaza, stall, pennants, colliders, tour,
}
