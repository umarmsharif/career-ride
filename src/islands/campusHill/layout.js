// Campus Hill (island 2): where things are. Facts come from career.json.
import career from '../../content/career.json'

export const data = career.islands.find((i) => i.id === 2)

const LEN = 40

// The road bends south around the foot of the hill and runs through the quad.
const road = [
  [-40, 0], [-30, 0], [-20, 1.6], [-10, 4.8], [0, 6.8], [10, 6.6], [20, 4.4], [28, 2], [34, 0], [40, 0],
]

const hill = { x: 15, z: -4, rTop: 4.2, rBase: 6, h: 1.4 }
const library = { x: -29, z: -13 }
const tower = { x: 22, z: -12.5 }
const quad = { x: 11, z: 12.6, r: 7.6 }
const pickupSpots = [[11, 8.6]]
const bikeRack = { x: 3.5, z: 16.5 }
const fountain = { x: 11, z: 14.2 }

const bookStacks = [
  { x: 4.5, z: -2.5, rot: 0.4, k: 0 },
  { x: 16.5, z: -3.5, rot: -0.5, k: 1 },
  { x: 3.5, z: 1.5, rot: 0.9, k: 2 },
]

// Benches and lamp posts around the quad.
const benches = [0.05, 0.95, 2.2, 3.1].map((a) => ({
  x: quad.x + Math.cos(a) * 6.2,
  z: quad.z + Math.sin(a) * 6.2,
  face: Math.atan2(-Math.cos(a), -Math.sin(a)),
}))
const lamps = [0.5, 1.4, 1.75, 2.65].map((a) => ({ x: quad.x + Math.cos(a) * 7.8, z: quad.z + Math.sin(a) * 7.8 }))

const colliders = [
  { x: hill.x, z: hill.z, r: 6.4, h: 8 },
  ...[-4.5, -1.5, 1.5, 4.5].map((dx) => ({ x: library.x + dx, z: library.z + 1, r: 3.3, h: 9 })),
  { x: library.x, z: library.z + 5.4, r: 3.4, h: 3 },
  { x: library.x - 4, z: library.z + 5.4, r: 1.6, h: 3 },
  { x: library.x + 4, z: library.z + 5.4, r: 1.6, h: 3 },
  { x: tower.x, z: tower.z, r: 3.1, h: 17 },
  { x: fountain.x, z: fountain.z, r: 1.9, h: 2.5 },
  { x: bikeRack.x, z: bikeRack.z, r: 2.3, h: 2 },
  ...bookStacks.map((b) => ({ x: b.x, z: b.z, r: 1.6, h: 3.2 })),
  ...benches.map((b) => ({ x: b.x, z: b.z, r: 1.2, h: 1.6 })),
  ...lamps.map((l) => ({ x: l.x, z: l.z, r: 0.4, h: 5 })),
]

const tour = [
  [-31.6, 0], [-28.6, 0.2], [-20, 1.7], [-10, 4.9], [0, 6.9], [5, 6.8], [11, 8.6], [16, 6.2], [20, 4.4], [28, 2], [34, 0], [38.5, 0],
]

export default {
  len: LEN, road, hill, library, tower, quad, pickupSpots, bikeRack, fountain, bookStacks, benches, lamps, colliders, tour,
}
