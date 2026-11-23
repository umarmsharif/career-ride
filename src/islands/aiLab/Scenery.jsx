// The AI Lab scenery: an inventor's yard with four toy machines.
// Static props go into one merged mesh; each machine's moving parts are separate meshes
// that wake up when its stop is found.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Kit, ribbonXZ, rng } from '../../engine/kit.js'
import { baseRoad, scatter, CREAM, WOOD, NAVY, CORAL, TEAL, GOLD } from '../../engine/props.js'
import { Static, toyMaterial } from '../../engine/IslandParts.jsx'
import { clock, sinceOf, smooth } from '../../engine/state.js'
import L from './layout.js'

const since = sinceOf(8)
const Y = 0.4 // top of a machine platform
const SLATE_OFF = '#3b4a63'
const DARK = new THREE.Color(SLATE_OFF)
const ON_TEAL = new THREE.Color('#37e0c9')
const ON_GOLD = new THREE.Color('#ffd23f')
const ON_CORAL = new THREE.Color('#ff7a5c')
const ON_CREAM = new THREE.Color('#fff6e4')
const onOf = (i) => {
  const s = since(i)
  return s < 0 ? 0 : smooth(s / 0.8)
}
const paint = (mesh, k, on) => mesh.material.color.copy(DARK).lerp(on, k)

// Build a merged geometry for one moving part.
function useGeo(fn) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => {
    const k = new Kit()
    fn(k)
    return k.build()
  }, [])
}

function platform(k, m, r = 4.4) {
  k.at({ p: [m.x, 0, m.z] }, () => {
    k.cyl(r + 0.2, r + 0.3, 0.3, '#c98a5e', { p: [0, 0.15, 0] }, 20)
    k.cyl(r, r, 0.12, '#f3dcab', { p: [0, 0.34, 0] }, 20)
    k.cyl(r - 0.5, r - 0.5, 0.05, '#ecd3a2', { p: [0, 0.38, 0] }, 20)
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      k.box(0.5, 0.06, 0.22, i % 2 ? GOLD : TEAL, { p: [Math.cos(a) * (r - 0.25), 0.4, Math.sin(a) * (r - 0.25)], r: [0, -a, 0] })
    }
  })
}

// ---------- Static pieces of each machine (local frame: +z faces the road) ----------

function chatMachine(k) {
  k.box(4.2, 1.5, 1.9, CORAL, { p: [0, Y + 0.75, 0.3] })
  k.box(4.4, 0.16, 2.1, CREAM, { p: [0, Y + 1.58, 0.3] })
  k.box(4.0, 0.2, 1.5, '#2f8f8a', { p: [0, Y + 1.9, 0.5], r: [-0.3, 0, 0] })
  ;[-1.5, -0.75, 0, 0.75, 1.5].forEach((x, i) => k.ball(0.17, [GOLD, TEAL, CREAM, GOLD, CORAL][i], { p: [x, Y + 2.05, 0.95] }, 0))
  for (const s of [1, -1]) k.box(0.3, 5.3, 0.3, NAVY, { p: [s * 2.75, Y + 2.65, -0.7] })
  k.box(6.0, 0.3, 0.4, NAVY, { p: [0, Y + 5.3, -0.7] })
  ;[-1.7, 0, 1.7].forEach((x, i) => {
    k.box(1.7, 1.3, 0.2, CREAM, { p: [x, 4.3, -0.7] })
    k.cone(0.26, 0.55, CREAM, { p: [x + (i % 2 ? 0.5 : -0.5), 3.4, -0.7], r: [0, 0, Math.PI] }, 3)
    for (let d = 0; d < 3; d++) k.ball(0.09, NAVY, { p: [x - 0.3 + d * 0.3, 4.3, -0.5] }, 0)
  })
  // Funnel, stand and tray.
  k.box(0.22, 3.2, 0.22, NAVY, { p: [4.1, Y + 1.6, 0.1] })
  k.box(0.2, 0.2, 0.9, NAVY, { p: [3.7, 3.45, 0.5] })
  k.cone(0.9, 0.9, GOLD, { p: [3.7, 3.35, 0.9], r: [Math.PI, 0, 0] }, 8)
  k.cyl(0.13, 0.13, 0.9, '#e2c48d', { p: [3.7, 2.55, 0.9] }, 6)
  k.box(0.2, 0.55, 0.2, WOOD, { p: [3.7, Y + 0.28, 0.9] })
  k.box(1.5, 0.14, 1.2, WOOD, { p: [3.7, 1.0, 0.9] })
  for (const [x, z, w, d] of [[0, 0.62, 1.5, 0.1], [0, -0.62, 1.5, 0.1], [0.72, 0, 0.1, 1.2], [-0.72, 0, 0.1, 1.2]]) k.box(w, 0.2, d, '#a86b47', { p: [3.7 + x, 1.12, 0.9 + z] })
}

function deskMachine(k) {
  k.box(4.4, 1.1, 1.6, CORAL, { p: [0, Y + 0.55, 0.9] })
  k.box(4.8, 0.15, 2.0, CREAM, { p: [0, Y + 1.18, 0.9] })
  for (const x of [-1.1, 1.1]) {
    k.box(1.6, 0.7, 0.06, '#e2674a', { p: [x, Y + 0.55, 1.72] })
    k.ball(0.1, GOLD, { p: [x, Y + 0.55, 1.78] }, 0)
  }
  // Phone base and cradle.
  k.box(1.1, 0.26, 0.85, '#2f8f8a', { p: [-1.2, 1.74, 0.9] })
  for (const s of [1, -1]) k.box(0.1, 0.22, 0.16, NAVY, { p: [-1.2 + s * 0.55, 1.98, 0.9] })
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) k.ball(0.07, CREAM, { p: [-1.45 + c * 0.25, 1.9, 1.12 - r * 0.2] }, 0)
  // Little desk lamp and tray with papers.
  k.cyl(0.05, 0.05, 0.8, NAVY, { p: [1.6, 2.1, 0.6] }, 5)
  k.cone(0.3, 0.3, GOLD, { p: [1.6, 2.6, 0.6], r: [Math.PI, 0, 0] }, 8)
  k.box(0.9, 0.08, 0.7, WOOD, { p: [0.3, 1.74, 1.1] })
  k.box(0.7, 0.06, 0.5, CREAM, { p: [0.3, 1.8, 1.1], r: [0, 0.2, 0] })
  // Calendar board on two posts.
  for (const s of [1, -1]) k.box(0.25, 5.0, 0.25, NAVY, { p: [s * 2.55, Y + 2.5, -0.9] })
  k.box(5.2, 3.7, 0.25, NAVY, { p: [0, 3.65, -0.9] })
  k.box(5.2, 0.55, 0.3, CORAL, { p: [0, 5.35, -0.9] })
  for (let i = 0; i < 4; i++) k.ball(0.11, CREAM, { p: [-1.8 + i * 1.2, 5.35, -0.7] }, 0)
}

function dialMachine(k) {
  k.cyl(1.0, 1.25, 0.5, '#c98a5e', { p: [0, Y + 0.25, 0] }, 10)
  k.cyl(0.3, 0.42, 6.4, '#2f8f8a', { p: [0, Y + 3.2, 0] }, 8)
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5
    const ex = Math.cos(a) * 2.2
    const ez = Math.sin(a) * 2.2
    const beamLen = Math.hypot(ex, 3.2, ez)
    k.box(0.14, 0.14, beamLen, '#e2c48d', { p: [ex / 2, Y + 1.6 + 0.3, ez / 2], r: [-Math.atan2(2.0, Math.hypot(ex, ez)), Math.atan2(ex, ez), 0] })
    k.box(0.5, 0.2, 0.5, '#c98a5e', { p: [ex, Y + 0.1, ez] })
  }
  k.box(2.9, 2.9, 0.5, CREAM, { p: [0, 5.4, 0.35] })
  k.box(3.1, 0.2, 0.6, CORAL, { p: [0, 7.0, 0.35] })
  k.box(0.28, 0.5, 0.2, NAVY, { p: [1.15, 4.55, 0.7], r: [0, 0, -0.5] })
  k.cyl(0.05, 0.05, 1.4, NAVY, { p: [0, 7.7, 0] }, 5)
}

function filmMachine(k) {
  // Projector table and body.
  k.box(2.9, 0.2, 1.5, WOOD, { p: [2.4, 1.6, 0] })
  for (const sx of [1, -1]) for (const sz of [1, -1]) k.box(0.16, 1.2, 0.16, WOOD, { p: [2.4 + sx * 1.2, Y + 0.6, sz * 0.55] })
  k.box(2.4, 0.95, 1.1, '#2f8f8a', { p: [2.5, 2.2, 0] })
  k.box(2.5, 0.12, 1.2, CORAL, { p: [2.5, 2.72, 0] })
  k.cyl(0.32, 0.4, 0.6, NAVY, { p: [1.0, 2.25, 0], r: [0, 0, Math.PI / 2] }, 10)
  k.cyl(0.2, 0.2, 0.08, '#ffe9a8', { p: [0.68, 2.25, 0], r: [0, 0, Math.PI / 2] }, 10)
  for (const x of [1.85, 3.15]) k.box(0.16, 0.9, 0.16, NAVY, { p: [x, 3.2, 0] })
  for (let i = 0; i < 3; i++) k.ball(0.1, [GOLD, CREAM, TEAL][i], { p: [2.0 + i * 0.35, 2.78, 0.62] }, 0)
  // Screen on a frame, facing +x.
  k.box(0.2, 3.1, 3.5, NAVY, { p: [-3.3, 2.3, 0] })
  k.box(0.16, 2.8, 3.2, '#e8e1d0', { p: [-3.2, 2.3, 0] })
  for (const sz of [1, -1]) k.box(0.2, 0.8, 0.2, NAVY, { p: [-3.3, 0.8, sz * 1.5] })
  k.box(0.7, 0.14, 4.0, NAVY, { p: [-3.3, Y + 0.07, 0] })
  // Film cans.
  k.cyl(0.35, 0.35, 0.3, GOLD, { p: [-1.2, Y + 0.15, 2.4] }, 10)
  k.cyl(0.35, 0.35, 0.3, CORAL, { p: [-0.6, Y + 0.45, 2.4] }, 10)
}

function restaurant(k) {
  const r = L.restaurant
  k.at({ p: [r.x, 0, r.z], r: [0, -Math.PI / 2, 0] }, () => {
    k.cyl(2.8, 2.9, 0.25, '#c98a5e', { p: [0, 0.12, 0] }, 14)
    k.cyl(2.6, 2.6, 0.08, '#f3dcab', { p: [0, 0.27, 0] }, 14)
    k.box(3.4, 2.2, 2.6, '#fff1dc', { p: [0, 1.4, 0] })
    k.roof(3.8, 1.1, 3.0, '#e2674a', { p: [0, 2.5, 0] })
    k.box(0.5, 0.9, 0.5, '#c9a27a', { p: [-1.0, 3.3, -0.5] })
    k.box(0.9, 1.5, 0.12, WOOD, { p: [-0.9, 1.0, 1.32] })
    k.box(1.1, 0.14, 0.7, CORAL, { p: [-0.9, 1.9, 1.6], r: [0.3, 0, 0] })
    k.box(1.2, 0.12, 0.12, CREAM, { p: [0.95, 0.95, 1.36] })
    k.box(0.16, 1.2, 0.12, CREAM, { p: [0.35, 1.5, 1.36] })
    k.box(0.16, 1.2, 0.12, CREAM, { p: [1.55, 1.5, 1.36] })
    k.box(1.4, 0.12, 0.12, CREAM, { p: [0.95, 2.1, 1.36] })
    k.box(0.9, 0.5, 0.9, GOLD, { p: [1.6, 0.65, 1.9] }) // a little menu stand
    k.ball(0.25, '#f0553f', { p: [1.6, 1.05, 1.9] })
  })
}

function hut(k) {
  const h = L.hut
  k.at({ p: [h.x, 0, h.z] }, () => {
    k.box(5.0, 0.3, 4.2, '#c9a27a', { p: [0, 0.15, 0] })
    k.box(4.4, 3.0, 3.6, '#fff1dc', { p: [0, 1.8, 0] })
    k.roof(5.0, 1.7, 4.2, '#2f8f8a', { p: [0, 3.3, 0] })
    k.box(0.9, 1.6, 0.14, WOOD, { p: [-1.1, 1.1, 1.85] })
    k.box(1.4, 1.1, 0.12, '#7fc4d8', { p: [1.0, 2.0, 1.85] })
    k.box(1.5, 0.12, 0.2, CREAM, { p: [1.0, 1.4, 1.9] })
    // A zigzag power bolt on the wall.
    const sh = new THREE.Shape()
    sh.moveTo(0.1, 0.9); sh.lineTo(-0.45, 0.0); sh.lineTo(-0.05, 0.0); sh.lineTo(-0.2, -0.9); sh.lineTo(0.45, 0.1); sh.lineTo(0.05, 0.1); sh.closePath()
    k.add(new THREE.ShapeGeometry(sh), GOLD, { p: [-1.1, 2.75, 1.84] })
    k.box(1.1, 1.3, 1.0, '#aab4c0', { p: [1.5, 1.0, -2.5] })
    k.cyl(0.25, 0.25, 1.4, NAVY, { p: [-1.6, 4.3, -0.6] }, 8)
  })
}

function bench(k, b) {
  k.at({ p: [b.x, 0, b.z], r: [0, b.rot, 0] }, () => {
    k.box(3.2, 0.2, 1.3, '#c58a54', { p: [0, 1.0, 0] })
    for (const sx of [1, -1]) for (const sz of [1, -1]) k.box(0.18, 1.0, 0.18, WOOD, { p: [sx * 1.4, 0.5, sz * 0.5] })
    k.box(3.0, 0.12, 0.9, '#a86b47', { p: [0, 0.35, 0] })
    k.box(3.2, 1.0, 0.1, '#e8cfa0', { p: [0, 1.6, -0.62] }) // back board
    k.cyl(0.35, 0.35, 0.12, GOLD, { p: [-1.0, 1.16, 0.1] }, 8) // a gear
    k.cyl(0.14, 0.14, 0.14, NAVY, { p: [-1.0, 1.2, 0.1] }, 6)
    k.box(0.7, 0.3, 0.5, TEAL, { p: [0.2, 1.25, 0.1] })
    k.ball(0.18, CORAL, { p: [0.2, 1.52, 0.1] }, 0)
    k.cyl(0.18, 0.18, 0.4, CORAL, { p: [1.0, 1.3, 0.2] }, 8)
    k.box(0.14, 0.08, 0.9, '#aab4c0', { p: [1.2, 1.14, -0.15], r: [0, 0.4, 0] })
  })
}

function rack(k, b) {
  k.at({ p: [b.x, 0, b.z], r: [0, b.rot, 0] }, () => {
    for (const s of [1, -1]) k.box(0.2, 2.8, 0.2, WOOD, { p: [s * 1.5, 1.4, 0] })
    k.box(3.4, 1.7, 0.14, '#e8cfa0', { p: [0, 1.8, 0] })
    k.box(3.5, 0.16, 0.34, '#a86b47', { p: [0, 2.75, 0] })
    // Hammer, wrench, saw, pliers hanging from pegs.
    k.box(0.1, 0.9, 0.08, WOOD, { p: [-1.1, 1.7, 0.15] })
    k.box(0.5, 0.22, 0.1, '#aab4c0', { p: [-1.1, 2.2, 0.15] })
    k.box(0.12, 1.1, 0.08, '#aab4c0', { p: [-0.4, 1.7, 0.15] })
    k.cyl(0.2, 0.2, 0.1, '#aab4c0', { p: [-0.4, 2.3, 0.15], r: [Math.PI / 2, 0, 0] }, 6)
    k.add(new THREE.ShapeGeometry(sawShape()), '#c9d1d9', { p: [0.5, 1.2, 0.12] })
    k.box(0.12, 0.7, 0.08, CORAL, { p: [1.2, 2.0, 0.15], r: [0, 0, 0.2] })
    k.box(0.12, 0.7, 0.08, TEAL, { p: [1.35, 2.0, 0.15], r: [0, 0, -0.2] })
    k.box(1.4, 0.1, 0.5, WOOD, { p: [0, 0.9, 0.3] })
    k.box(0.3, 0.3, 0.3, GOLD, { p: [-0.4, 1.1, 0.3] })
  })
}
function sawShape() {
  const s = new THREE.Shape()
  s.moveTo(0, 0); s.lineTo(0.9, 0.35); s.lineTo(0.9, 0.0); s.lineTo(0, 0)
  return s
}

function barrel(k, x, z, c) {
  k.cyl(0.55, 0.5, 1.0, c, { p: [x, 0.5, z] }, 10)
  k.cyl(0.57, 0.57, 0.1, NAVY, { p: [x, 0.7, z] }, 10)
}

function turbineBase(k) {
  const t = L.turbine
  k.cyl(1.0, 1.2, 0.5, '#c98a5e', { p: [t.x, 0.25, t.z] }, 10)
  k.cyl(0.18, 0.4, 8.2, CREAM, { p: [t.x, 4.5, t.z] }, 8)
  k.box(0.9, 0.7, 1.5, CORAL, { p: [t.x, 8.8, t.z + 0.2] })
  k.cone(0.4, 0.6, GOLD, { p: [t.x, 8.8, t.z + 1.25], r: [Math.PI / 2, 0, 0] }, 8)
}

function buildYard(k, island) {
  const r = rng(808)
  baseRoad(k, island, { skip: (x) => Math.abs(x + 6) < 1.8 || Math.abs(x - 17) < 1.8 })

  // Cables from the power hut to each machine.
  const runs = [
    [[-2.2, -11], [-10, -13.5], [-18, -11.5], [-21, -10]],
    [[-1.5, -10.5], [-4.5, -5], [-6, 0], [-7, 5], [-7.6, 8]],
    [[2.5, -11.5], [6, -11], [7.5, -10]],
    [[2.5, -11], [13, -7.5], [16.5, -1], [20, 5], [25, 8]],
  ]
  runs.forEach((p) => {
    k.add(ribbonXZ(p, 0.5, 0.075), NAVY)
    k.add(ribbonXZ(p, 0.14, 0.09), TEAL)
  })
  // Cable clips along the runs.
  runs.forEach((p) => p.forEach(([x, z]) => k.cyl(0.3, 0.3, 0.1, GOLD, { p: [x, 0.06, z] }, 8)))

  L.machines.forEach((m) => platform(k, m))
  k.at({ p: [L.machines[0].x, 0, L.machines[0].z] }, () => chatMachine(k))
  k.at({ p: [L.machines[1].x, 0, L.machines[1].z], r: [0, Math.PI, 0] }, () => deskMachine(k))
  k.at({ p: [L.machines[2].x, 0, L.machines[2].z] }, () => dialMachine(k))
  k.at({ p: [L.machines[3].x, 0, L.machines[3].z], r: [0, Math.PI, 0] }, () => filmMachine(k))
  restaurant(k)
  hut(k)
  turbineBase(k)
  L.benches.forEach((b) => bench(k, b))
  L.racks.forEach((b) => rack(k, b))
  barrel(k, -29.5, -12.2, CORAL)
  barrel(k, -28.6, -13.0, TEAL)
  barrel(k, 14, 13.2, GOLD)
  barrel(k, 33.5, 13.0, CORAL)
  k.box(0.9, 0.7, 0.9, '#d9a066', { p: [-12, 0.35, 12.8], r: [0, 0.3, 0] })
  k.box(0.8, 0.6, 0.8, '#d9a066', { p: [-11.1, 0.3, 13.4], r: [0, 0.8, 0] })
  k.box(0.9, 0.7, 0.9, '#d9a066', { p: [38, 0.35, 8.5], r: [0, 0.1, 0] })

  scatter(k, island, r, {
    trees: 26,
    cover: 80,
    kinds: [0, 2],
    keepOut: [
      ...L.machines.map((m) => ({ x: m.x, z: m.z, r: 6.5 })),
      { x: L.hut.x, z: L.hut.z, r: 5 },
      { x: L.restaurant.x, z: L.restaurant.z, r: 4 },
      { x: L.turbine.x, z: L.turbine.z, r: 3 },
      ...L.benches.map((b) => ({ x: b.x, z: b.z, r: 2.5 })),
      ...L.racks.map((b) => ({ x: b.x, z: b.z, r: 2.5 })),
      { x: -6, z: 0, r: 6 },
      { x: 17, z: 0, r: 6 },
    ],
  })
}

// ---------- Machine 0: the chat machine ----------

function ChatMachine() {
  const m = L.machines[0]
  const panels = useRef([])
  const lamp = useRef()
  const beads = useRef()
  const heap = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  useFrame(() => {
    const s = since(0)
    const on = onOf(0)
    const ph = s < 0 ? 0 : (s / 0.9) % 3
    panels.current.forEach((p, i) => {
      const d = Math.abs(ph - i)
      const dd = Math.min(d, 3 - d)
      const lvl = Math.max(0, 1 - dd * 1.1)
      paint(p, on * (0.12 + 0.88 * lvl), i === 1 ? ON_GOLD : ON_TEAL)
    })
    paint(lamp.current, on * (0.6 + 0.4 * Math.sin(clock.t * 6)), ON_GOLD)
    for (let i = 0; i < 8; i++) {
      const u = s < 0 ? 0 : (s * 0.7 + i / 8) % 1
      dummy.position.set(3.7 + Math.sin(i * 2) * 0.05, 2.25 - u * 1.1, 0.9)
      dummy.scale.setScalar(on > 0 ? 1 : 0.001)
      dummy.updateMatrix()
      beads.current.setMatrixAt(i, dummy.matrix)
    }
    beads.current.instanceMatrix.needsUpdate = true
    for (let i = 0; i < 6; i++) {
      const grown = s < 0 ? 0 : smooth((s - 1.2 - i * 1.4) / 0.5)
      dummy.position.set(3.7 + ((i % 3) - 1) * 0.35, 1.18 + Math.floor(i / 3) * 0.2, 0.9 + (i % 2 ? 0.2 : -0.2))
      dummy.scale.setScalar(Math.max(0.001, grown))
      dummy.updateMatrix()
      heap.current.setMatrixAt(i, dummy.matrix)
    }
    heap.current.instanceMatrix.needsUpdate = true
  })
  return (
    <group position={[m.x, 0, m.z]}>
      {[-1.7, 0, 1.7].map((x, i) => (
        <mesh key={i} ref={(e) => (panels.current[i] = e)} position={[x, 4.3, -0.55]}>
          <boxGeometry args={[1.5, 1.1, 0.06]} />
          <meshBasicMaterial color={SLATE_OFF} toneMapped={false} />
        </mesh>
      ))}
      <mesh ref={lamp} position={[0, 5.85, -0.7]}>
        <icosahedronGeometry args={[0.3, 1]} />
        <meshBasicMaterial color={SLATE_OFF} toneMapped={false} />
      </mesh>
      <instancedMesh ref={beads} args={[null, null, 8]} frustumCulled={false}>
        <icosahedronGeometry args={[0.13, 0]} />
        <meshBasicMaterial color="#ffd23f" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={heap} args={[null, null, 6]} frustumCulled={false}>
        <icosahedronGeometry args={[0.16, 0]} />
        <meshBasicMaterial color="#f2a541" toneMapped={false} />
      </instancedMesh>
    </group>
  )
}

// ---------- Machine 1: the reception desk ----------

function DeskMachine() {
  const m = L.machines[1]
  const handset = useRef()
  const bell = useRef()
  const arcs = useRef()
  const tiles = useRef()
  const lamp = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const col = useMemo(() => new THREE.Color(), [])
  const handsetGeo = useGeo((k) => {
    k.box(1.5, 0.2, 0.3, CORAL, { p: [0.75, 0.17, 0] })
    k.box(0.4, 0.34, 0.4, CORAL, { p: [0.15, 0.17, 0] })
    k.box(0.4, 0.34, 0.4, CORAL, { p: [1.4, 0.17, 0] })
  })
  const ringGeo = useMemo(() => new THREE.TorusGeometry(0.45, 0.05, 5, 12, Math.PI * 0.7), [])
  useFrame(() => {
    const s = since(1)
    const on = onOf(1)
    // Ring (shaking), then the handset lifts, then it settles back.
    const c = s < 0 ? 0 : s % 3.6
    const ringing = s >= 0 && c < 1.8
    const lift = s < 0 ? 0 : c < 1.8 ? 0 : c < 2.3 ? smooth((c - 1.8) / 0.5) : c < 3.1 ? 1 : 1 - smooth((c - 3.1) / 0.5)
    handset.current.rotation.z = lift * 0.55 + (ringing ? Math.sin(clock.t * 40) * 0.025 : 0)
    handset.current.position.y = 1.87 + (ringing ? Math.abs(Math.sin(clock.t * 20)) * 0.04 : 0)
    bell.current.visible = ringing
    bell.current.scale.setScalar(0.85 + Math.abs(Math.sin(clock.t * 14)) * 0.25)
    arcs.current.visible = ringing
    for (let i = 0; i < 12; i++) {
      const row = Math.floor(i / 4)
      const u = s < 0 ? 0 : (s * 0.9 - i * 0.55) % 13.2
      const uu = (u + 13.2) % 13.2
      const f = s < 0 ? 0 : uu < 0.5 ? smooth(uu / 0.5) : uu < 6.6 ? 1 : uu < 7.1 ? 1 - smooth((uu - 6.6) / 0.5) : 0
      const c4 = i % 4
      dummy.position.set(-1.8 + c4 * 1.2, 4.4 - row * 1.0, -0.62)
      dummy.rotation.set(f * Math.PI, 0, 0)
      dummy.updateMatrix()
      tiles.current.setMatrixAt(i, dummy.matrix)
      col.copy(f > 0.5 ? (i % 3 === 1 ? ON_GOLD : ON_TEAL) : DARK)
      tiles.current.setColorAt(i, col)
    }
    tiles.current.instanceMatrix.needsUpdate = true
    tiles.current.instanceColor.needsUpdate = true
    paint(lamp.current, on * (0.6 + 0.4 * Math.sin(clock.t * 5)), ON_CORAL)
  })
  // Local frame is turned to face the road, so the group copies the machine's rotation.
  return (
    <group position={[m.x, 0, m.z]} rotation={[0, Math.PI, 0]}>
      <group ref={handset} position={[-1.95, 1.87, 0.9]}>
        <mesh geometry={handsetGeo} material={toyMaterial} castShadow />
      </group>
      <group ref={bell} position={[-1.2, 2.25, 0.9]}>
        <mesh ref={arcs} geometry={ringGeo} rotation={[0, 0, Math.PI * 0.15]}>
          <meshBasicMaterial color="#ffd23f" toneMapped={false} />
        </mesh>
        <mesh geometry={ringGeo} rotation={[0, 0, Math.PI * 1.15]}>
          <meshBasicMaterial color="#ffd23f" toneMapped={false} />
        </mesh>
      </group>
      <instancedMesh ref={tiles} args={[null, null, 12]} frustumCulled={false}>
        <boxGeometry args={[1.05, 0.85, 0.12]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <mesh ref={lamp} position={[0, 5.85, -0.9]}>
        <icosahedronGeometry args={[0.3, 1]} />
        <meshBasicMaterial color={SLATE_OFF} toneMapped={false} />
      </mesh>
    </group>
  )
}

// ---------- Machine 2: the calling mast ----------

function DialMachine() {
  const m = L.machines[2]
  const dial = useRef()
  const lamp = useRef()
  const rings = useRef([])
  const windowMesh = useRef()
  const door = useRef()
  const dialGeo = useGeo((k) => {
    k.cyl(1.1, 1.1, 0.14, CORAL, { r: [Math.PI / 2, 0, 0] }, 16)
    k.cyl(0.38, 0.38, 0.22, CREAM, { p: [0, 0, 0.04], r: [Math.PI / 2, 0, 0] }, 10)
    k.cyl(0.18, 0.18, 0.3, GOLD, { p: [0, 0, 0.06], r: [Math.PI / 2, 0, 0] }, 8)
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 1.7 + 0.4
      k.cyl(0.15, 0.15, 0.2, NAVY, { p: [Math.cos(a) * 0.74, Math.sin(a) * 0.74, 0.06], r: [Math.PI / 2, 0, 0] }, 8)
    }
  })
  const from = useMemo(() => new THREE.Vector3(m.x + 1.3, 5.2, m.z + 0.8), [m])
  const to = useMemo(() => new THREE.Vector3(L.restaurant.x - 1.9, 2.0, L.restaurant.z + 0.5), [])
  const quat = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), to.clone().sub(from).normalize()), [from, to])
  useFrame(() => {
    const s = since(2)
    const on = onOf(2)
    const c = s < 0 ? 0 : s % 2.4
    const u = c / 2.4
    dial.current.rotation.z = s < 0 ? 0 : u < 0.7 ? -(u / 0.7) * 2.0 : -2.0 * (1 - smooth((u - 0.7) / 0.3))
    paint(lamp.current, on * (0.6 + 0.4 * Math.sin(clock.t * 7)), ON_GOLD)
    rings.current.forEach((r, i) => {
      const v = s < 0 ? 0 : (s / 2.0 + i / 5) % 1
      r.visible = s >= 0
      r.position.lerpVectors(from, to, v)
      r.scale.setScalar(0.5 + v * 1.7)
      r.children[0].material.opacity = 0.9 * Math.min(1, (1 - v) * 3.5, v * 6 + 0.2)
    })
    paint(windowMesh.current, s < 0 ? 0 : smooth((s - 1.4) / 0.6), ON_GOLD)
    paint(door.current, s < 0 ? 0 : smooth((s - 1.4) / 0.6) * (0.55 + 0.45 * Math.sin(clock.t * 5)), ON_TEAL)
  })
  const r = L.restaurant
  return (
    <>
      <group position={[m.x, 0, m.z]}>
        <group ref={dial} position={[0, 5.4, 0.7]}>
          <mesh geometry={dialGeo} material={toyMaterial} castShadow />
        </group>
        <mesh ref={lamp} position={[0, 8.5, 0]}>
          <icosahedronGeometry args={[0.32, 1]} />
          <meshBasicMaterial color={SLATE_OFF} toneMapped={false} />
        </mesh>
      </group>
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i} ref={(e) => (rings.current[i] = e)} quaternion={quat} visible={false}>
          <mesh>
            <torusGeometry args={[0.6, 0.07, 5, 18]} />
            <meshBasicMaterial color="#37e0c9" transparent opacity={0.8} depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <group position={[r.x, 0, r.z]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh ref={windowMesh} position={[0.95, 1.55, 1.32]}>
          <boxGeometry args={[1.05, 0.9, 0.06]} />
          <meshBasicMaterial color={SLATE_OFF} toneMapped={false} />
        </mesh>
        <mesh ref={door} position={[-0.9, 2.45, 1.7]}>
          <icosahedronGeometry args={[0.2, 1]} />
          <meshBasicMaterial color={SLATE_OFF} toneMapped={false} />
        </mesh>
      </group>
    </>
  )
}

// ---------- Machine 3: the film projector ----------

function shapeMesh(k, pts, color, z) {
  const sh = new THREE.Shape()
  pts.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y)))
  sh.closePath()
  k.add(new THREE.ShapeGeometry(sh), color, { p: [0, 0, z] })
}

function FilmMachine() {
  const m = L.machines[3]
  const reelA = useRef()
  const reelB = useRef()
  const cone = useRef()
  const screen = useRef()
  const lamp = useRef()
  const toons = useRef([])
  const reelGeo = useGeo((k) => {
    k.add(new THREE.TorusGeometry(0.62, 0.09, 5, 14), GOLD)
    k.cyl(0.14, 0.14, 0.22, NAVY, { r: [Math.PI / 2, 0, 0] }, 8)
    for (let i = 0; i < 3; i++) k.box(1.15, 0.13, 0.1, CORAL, { r: [0, 0, (i / 3) * Math.PI] })
  })
  const boat = useGeo((k) => {
    shapeMesh(k, [[-1.1, -0.1], [1.1, -0.1], [0.75, -0.55], [-0.75, -0.55]], CORAL, 0)
    shapeMesh(k, [[-0.05, 0.0], [-0.05, 1.3], [0.9, 0.0]], GOLD, 0.01)
    shapeMesh(k, [[-0.09, 0.0], [-0.09, 1.5], [-0.01, 1.5], [-0.01, 0.0]], NAVY, 0.02)
    for (let i = 0; i < 3; i++) shapeMesh(k, [[-1.3 + i * 0.9, -0.9], [-0.6 + i * 0.9, -0.9], [-0.95 + i * 0.9, -0.6]], TEAL, 0.01)
  })
  const wave = useGeo((k) => {
    for (let row = 0; row < 3; row++) {
      const pts = [[-1.4, -0.9 + row * 0.1]]
      for (let i = 0; i <= 14; i++) pts.push([-1.4 + (i / 14) * 2.8, 0.5 - row * 0.55 + Math.sin(i * 0.9 + row * 1.5) * 0.28])
      pts.push([1.4, -0.9 + row * 0.1])
      shapeMesh(k, pts, ['#37b8c9', '#1f9d8f', '#7fe3d4'][row], row * 0.01)
    }
  })
  const flame = useGeo((k) => {
    const out = new THREE.Shape()
    out.moveTo(0, -1)
    out.bezierCurveTo(0.95, -0.9, 1.0, -0.1, 0.15, 1.1)
    out.bezierCurveTo(0.15, 0.4, -0.15, 0.3, -0.35, 0.05)
    out.bezierCurveTo(-1.05, -0.3, -0.8, -0.9, 0, -1)
    k.add(new THREE.ShapeGeometry(out), CORAL, { p: [0, 0, 0] })
    const inn = new THREE.Shape()
    inn.moveTo(0, -0.95)
    inn.bezierCurveTo(0.5, -0.85, 0.5, -0.4, 0.05, 0.1)
    inn.bezierCurveTo(-0.5, -0.3, -0.45, -0.85, 0, -0.95)
    k.add(new THREE.ShapeGeometry(inn), GOLD, { p: [0, 0, 0.01] })
  })
  const geos = [boat, wave, flame]
  useFrame(() => {
    const s = since(3)
    const on = onOf(3)
    const sp = s < 0 ? 0 : Math.min(1, s / 1.2)
    reelA.current.rotation.z = -clock.t * 2.2 * sp
    reelB.current.rotation.z = -clock.t * 1.6 * sp
    cone.current.visible = s >= 0
    cone.current.material.opacity = 0.26 * on * (0.85 + 0.15 * Math.sin(clock.t * 24))
    screen.current.material.color.set('#4a5568').lerp(ON_CREAM, on)
    paint(lamp.current, on * (0.6 + 0.4 * Math.sin(clock.t * 5)), ON_TEAL)
    const idx = s < 0 ? -1 : Math.floor(s / 2.4) % 3
    toons.current.forEach((t, i) => {
      t.visible = i === idx
      if (i === idx) {
        const ph = (s % 2.4) / 2.4
        t.scale.setScalar(0.92 * smooth(ph * 5) * (1 - 0.1 * smooth((ph - 0.85) * 6)))
        t.position.y = 2.3 + (i === 0 ? Math.sin(clock.t * 3) * 0.08 : i === 2 ? Math.sin(clock.t * 9) * 0.04 : 0)
        t.rotation.z = i === 1 ? Math.sin(clock.t * 2.5) * 0.05 : 0
      }
    })
  })
  return (
    <group position={[m.x, 0, m.z]} rotation={[0, Math.PI, 0]}>
      <group ref={reelA} position={[1.85, 3.65, 0.3]}>
        <mesh geometry={reelGeo} material={toyMaterial} castShadow />
      </group>
      <group ref={reelB} position={[3.15, 3.65, 0.3]}>
        <mesh geometry={reelGeo} material={toyMaterial} castShadow />
      </group>
      <mesh ref={cone} position={[-1.15, 2.25, 0]} rotation={[0, 0, -Math.PI / 2]} visible={false}>
        <coneGeometry args={[1.5, 4.2, 14, 1, true]} />
        <meshBasicMaterial color="#ffe9a8" transparent opacity={0.25} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh ref={screen} position={[-3.1, 2.3, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[3.1, 2.7]} />
        <meshBasicMaterial color="#4a5568" toneMapped={false} />
      </mesh>
      {geos.map((g, i) => (
        <group key={i} ref={(e) => (toons.current[i] = e)} position={[-3.05, 2.3, 0]} rotation={[0, Math.PI / 2, 0]} visible={false}>
          <mesh geometry={g}>
            <meshBasicMaterial vertexColors side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <mesh ref={lamp} position={[-3.3, 4.25, 0]}>
        <icosahedronGeometry args={[0.3, 1]} />
        <meshBasicMaterial color={SLATE_OFF} toneMapped={false} />
      </mesh>
    </group>
  )
}

// ---------- Power hut lamp and the wind turbine ----------

function PowerAndWind() {
  const hutLamp = useRef()
  const rotor = useRef()
  const speed = useRef(0.6)
  const t = L.turbine
  const bladeGeo = useGeo((k) => {
    for (let i = 0; i < 3; i++) {
      k.at({ r: [0, 0, (i / 3) * Math.PI * 2] }, () => {
        k.box(0.5, 3.4, 0.1, CREAM, { p: [0, 1.9, 0] })
        k.box(0.5, 0.5, 0.12, CORAL, { p: [0, 3.4, 0] })
      })
    }
    k.ball(0.35, GOLD, { p: [0, 0, 0.1] })
  })
  useFrame((_, dt) => {
    let n = 0
    for (let i = 0; i < 4; i++) if (since(i) >= 0) n++
    speed.current += (0.5 + n * 0.55 - speed.current) * Math.min(1, dt * 1.5)
    rotor.current.rotation.z -= dt * speed.current
    paint(hutLamp.current, n ? 0.5 + 0.5 * Math.sin(clock.t * 4) : 0.1, ON_GOLD)
  })
  return (
    <>
      <mesh ref={hutLamp} position={[L.hut.x - 1.6, 5.2, L.hut.z - 0.6]}>
        <icosahedronGeometry args={[0.32, 1]} />
        <meshBasicMaterial color={SLATE_OFF} toneMapped={false} />
      </mesh>
      <group ref={rotor} position={[t.x, 8.8, t.z + 1.5]}>
        <mesh geometry={bladeGeo} material={toyMaterial} castShadow />
      </group>
    </>
  )
}

export default function AiLabScenery({ island }) {
  return (
    <>
      <Static build={(k) => buildYard(k, island)} deps={[island]} />
      <ChatMachine />
      <DeskMachine />
      <DialMachine />
      <FilmMachine />
      <PowerAndWind />
    </>
  )
}
