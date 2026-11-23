// The AI Lab (island 8): where things are. Facts come from career.json.
const road = [
  [-47, 0], [-36, 1], [-24, 0], [-16, -1.2], [-8, 0], [0, 1.2], [10, 0], [19, -1.2], [28, 0], [38, 1], [47, 0],
]

// Four machines, alternating sides of the road. `rot` turns the machine to face the road.
const machines = [
  { x: -24, z: -10, rot: 0 },
  { x: -8, z: 10, rot: Math.PI },
  { x: 10, z: -10, rot: 0 },
  { x: 28, z: 10, rot: Math.PI },
]

// The token stands on the road side of its machine.
const stops = machines.map((m) => [m.x, m.z < 0 ? -3.7 : 3.7])

const hut = { x: 0, z: -12.5 }
const restaurant = { x: 25, z: -12 }
const turbine = { x: 36, z: -10.5 }
const benches = [
  { x: -14, z: -11, rot: 0 },
  { x: 6, z: 11.5, rot: Math.PI },
  { x: -33, z: -11, rot: 0.2 },
]
const racks = [
  { x: -17.5, z: 12.5, rot: Math.PI },
  { x: 18, z: 12.5, rot: Math.PI },
  { x: -4.5, z: -12.8, rot: 0 },
]

const colliders = [
  ...machines.map((m) => ({ x: m.x, z: m.z, r: 3, h: 6 })),
  { x: hut.x, z: hut.z, r: 3, h: 4.5 },
  { x: restaurant.x, z: restaurant.z, r: 2.6, h: 4 },
  { x: turbine.x, z: turbine.z, r: 1.2, h: 9 },
  ...benches.map((b) => ({ x: b.x, z: b.z, r: 1.6, h: 2 })),
  ...racks.map((b) => ({ x: b.x, z: b.z, r: 1.3, h: 3 })),
]

const tour = [
  [-38, 0], [-35.6, 0.2], [-30, 0.5], [-24, -3.7], [-16, -1.2], [-8, 3.7], [0, 1.2], [10, -3.7],
  [19, -1.2], [28, 3.7], [38, 1], [45.5, 0],
]

export default { road, machines, stops, hut, restaurant, turbine, benches, racks, colliders, tour }
