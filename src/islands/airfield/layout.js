// The Airfield (island 7): where things are. Facts come from career.json;
// this file only holds positions and the shape of the land.

// The runway is the main road: straight, west to east.
const road = [[-47, 0], [-24, 0], [0, 0], [24, 0], [47, 0]]

// Three taxiways fork off toward three departure gates, one colour per region.
const forks = [
  { pts: [[-10, 0], [-8.8, -4], [-7, -8], [-5.4, -11.2]], color: '#f0553f', house: 4.6, plane: ['#fff1dc', '#f0553f'] },
  { pts: [[6, 0], [7.4, 4], [9.4, 8], [11.6, 11.2]], color: '#1f9d8f', house: -4.6, plane: ['#fff1dc', '#1f9d8f'] },
  { pts: [[24, 0], [25.4, -3.8], [27, -7.6], [28.4, -10.6]], color: '#f2a541', house: 4.6, plane: ['#fff1dc', '#f2a541'] },
]

// Eighteen plain flags on a ring just inside the rim, clear of the two gates.
const FLAG_COLORS = [
  '#f0553f', '#1f9d8f', '#f2a541', '#3d7fd0', '#e8648b', '#7cc36a',
  '#8e6bc9', '#ffd23f', '#2f8f8a', '#e2674a', '#5bb5e0', '#c9503e',
  '#a3d160', '#ff8fa3', '#f68e5f', '#4f6bd1', '#d9a066', '#47b58a',
]
const flags = FLAG_COLORS.map((color, i) => {
  const th = ((17 + i * (326 / 17)) * Math.PI) / 180
  return {
    x: 47 * 0.89 * Math.cos(th),
    z: 21.5 * 0.89 * Math.sin(th),
    tx: -Math.sin(th), // direction the flag flies (clockwise round the ring)
    tz: Math.cos(th),
    color,
  }
})

const tower = { x: -26, z: -11 }
const hangar = { x: -27, z: 12.2 }
const apron = { x: -20, z: 10.8, w: 28, d: 12.4 }
const dial = { x: 20.5, z: 8.4, face: Math.PI }
const windsock = { x: -15, z: -7 }
const parked = [
  { x: -16.5, z: 9.8, ry: 0.5, body: '#fbe6a8', accent: '#1f9d8f' },
  { x: -9.5, z: 12.8, ry: 2.5, body: '#fff1dc', accent: '#f0553f' },
  { x: 35, z: 10.5, ry: -0.6, body: '#dcecf2', accent: '#f2a541' },
]
const carts = [{ x: -8.5, z: 6.4, ry: 0 }, { x: 30, z: 6.8, ry: 0.05 }]

const pickupSpots = [[-26, 0], [0, 0], [17, 0]]

const colliders = [
  { x: tower.x, z: tower.z, r: 3.2, h: 17 },
  { x: hangar.x - 3.4, z: hangar.z, r: 3.5, h: 7 },
  { x: hangar.x, z: hangar.z, r: 3.5, h: 7 },
  { x: hangar.x + 3.4, z: hangar.z, r: 3.5, h: 7 },
  ...parked.map((p) => ({ x: p.x, z: p.z, r: 2.8, h: 3.5 })),
  { x: dial.x, z: dial.z, r: 2.8, h: 7 },
  { x: windsock.x, z: windsock.z, r: 0.5, h: 6 },
  ...carts.map((c) => ({ x: c.x, z: c.z, r: 1.6, h: 2 })),
]

const L = {
  road, forks, flags, tower, hangar, apron, dial, windsock, parked, carts,
  colliders,
  stops: pickupSpots.map(([x, z]) => ({ x, z })),
  pickupSpots,
  tour: [
    [-38, 0], [-35.6, 0.2], [-26, 0], [-13, 0.3], [0, 0], [8, -0.3], [17, 0], [30, 0], [45.5, 0],
  ],
  len: 47,
}
export default L
