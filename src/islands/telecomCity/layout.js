// Telecom City (island 4): where things are. Facts come from career.json;
// this file only holds positions.

const road = [
  [-50, 0], [-41, 0], [-34, 2.5], [-28, 0.8], [-22, -2.5], [-16, -0.5], [-10, 2.5], [-3, 0.8],
  [3, 0], [11, 2.5], [17, 0.5], [23, -2], [29, 0.5], [35, 2.5], [42, 0.5], [50, 0],
]

const pickupSpots = [
  [-34, 2.5], [-22, -2.5], [-10, 2.5],
  [11, 2.5], [23, -2], [35, 2.5],
]

// Small apartment blocks of Signal City. `face` is the direction the front looks.
const houses = [
  { x: -38, z: 9.5, face: Math.PI, floors: 2, wall: '#fff1dc', roof: '#e2674a' },
  { x: -31, z: 13, face: Math.PI, floors: 3, wall: '#dcecf2', roof: '#2f8f8a' },
  { x: -14, z: 14.5, face: Math.PI, floors: 2, wall: '#ffe2c4', roof: '#f2a541' },
  { x: -38, z: -9, face: 0, floors: 3, wall: '#fbe6a8', roof: '#c9503e' },
  { x: -30, z: -14.5, face: 0, floors: 2, wall: '#f6d9cf', roof: '#2f8f8a' },
  { x: -9.5, z: -13, face: 0, floors: 3, wall: '#fff1dc', roof: '#e2674a' },
]

const tower = { x: -23.5, z: 11.5 }
const clubhouse = { x: -19, z: -13 }
const bank = { x: -8.6, z: 10.5, face: Math.PI }

// Wallet Bazaar stalls (face 0 looks south, face PI looks north), sorted west to east.
const stalls = [
  { x: 5.5, z: 9.5, face: Math.PI, c: '#2f8f8a', skin: '#c68a5a', shirt: '#f0553f' },
  { x: 9, z: -9.5, face: 0, c: '#f0553f', skin: '#e0a579', shirt: '#1f9d8f' },
  { x: 16.5, z: -10, face: 0, c: '#f2a541', skin: '#a8714a', shirt: '#e2674a' },
  { x: 24, z: -9.5, face: 0, c: '#1f9d8f', skin: '#d99a6c', shirt: '#f2a541' },
  { x: 31.5, z: -10, face: 0, c: '#e2674a', skin: '#c68a5a', shirt: '#2f8f8a' },
  { x: 39, z: -8, face: 0, c: '#f2a541', skin: '#e0a579', shirt: '#f0553f' },
]

// Eight oversized toy phones on stands, facing the road.
const phones = Array.from({ length: 8 }, (_, i) => ({ x: 13.5 + i * 2.6, z: 9, c: ['#f0553f', '#1f9d8f', '#f2a541', '#ff8fa3'][i % 4] }))

const podium = { x: 38.5, z: 8.5, face: Math.PI }

const colliders = [
  ...houses.map((h) => ({ x: h.x, z: h.z, r: 3, h: 3 + h.floors * 1.7 })),
  { x: tower.x, z: tower.z, r: 2.8, h: 22 },
  { x: clubhouse.x, z: clubhouse.z, r: 4.2, h: 7 },
  { x: bank.x, z: bank.z, r: 4.4, h: 7.5 },
  ...stalls.map((s) => ({ x: s.x, z: s.z, r: 2.1, h: 4.5 })),
  ...phones.map((p) => ({ x: p.x, z: p.z, r: 1.15, h: 4.6 })),
  { x: podium.x, z: podium.z, r: 2.6, h: 3.5 },
]

const L = { road, pickupSpots, houses, tower, clubhouse, bank, stalls, phones, podium, colliders, len: 50 }
export default L
