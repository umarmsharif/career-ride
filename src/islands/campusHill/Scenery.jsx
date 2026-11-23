// Campus Hill scenery: a toy campus on a grassy mound.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Kit, ribbonXZ, rng } from '../../engine/kit.js'
import { baseRoad, tree, clearance, CREAM, WOOD, NAVY, GOLD, CORAL, TEAL } from '../../engine/props.js'
import { Static, toyMaterial } from '../../engine/IslandParts.jsx'
import { clock, sinceOf, smooth } from '../../engine/state.js'
import L from './layout.js'

const since = sinceOf(2)

const BRICK = '#e0714f'
const WALL = '#fff1dc'
const SAND = '#ffe2c4'
const STONE = '#c9a27a'
const ROOF = '#2f8f8a'
const MOUND = '#92d26b'

const TOWER_FACE_Y = 7.3
const TOWER_HALF = 1.9

// --- static pieces -----------------------------------------------------------

function columns(k, xs, y, z, h, color = CREAM) {
  xs.forEach((x) => {
    k.cyl(0.36, 0.4, h, color, { p: [x, y + h / 2, z] }, 8)
    k.box(0.95, 0.18, 0.95, STONE, { p: [x, y + 0.09, z] })
    k.box(0.95, 0.18, 0.95, STONE, { p: [x, y + h - 0.09, z] })
  })
}

function library(k) {
  k.at({ p: [L.library.x, 0, L.library.z] }, () => {
    k.box(13, 0.5, 9, STONE, { p: [0, 0.25, 0.4] })
    k.box(11, 5.2, 6.4, WALL, { p: [0, 3.1, 0] })
    k.box(11.4, 0.3, 6.8, BRICK, { p: [0, 5.75, 0] })
    k.roof(11.8, 2.4, 7.0, BRICK, { p: [0, 5.85, 0] })
    // Portico: columns, beam and a triangular pediment.
    columns(k, [-4.5, -2.7, -0.9, 0.9, 2.7, 4.5], 0.5, 4.2, 4.6)
    k.box(11.4, 0.6, 1.9, CREAM, { p: [0, 5.4, 3.95] })
    k.roof(1.9, 1.7, 11.4, CREAM, { p: [0, 5.7, 3.95], r: [0, Math.PI / 2, 0] })
    k.box(6.0, 0.9, 0.12, GOLD, { p: [0, 5.15, 4.95] })
    // Book emblem over the door: two open pages.
    k.box(1.3, 0.12, 0.7, CREAM, { p: [-0.7, 6.4, 4.85], r: [0, 0, 0.12] })
    k.box(1.3, 0.12, 0.7, CREAM, { p: [0.7, 6.4, 4.85], r: [0, 0, -0.12] })
    k.box(0.1, 0.6, 0.7, CORAL, { p: [0, 6.4, 4.85] })
    // Door.
    k.box(1.6, 3.0, 0.14, WOOD, { p: [0, 2.0, 3.25] })
    k.cyl(0.8, 0.8, 0.14, WOOD, { p: [0, 3.5, 3.25], r: [Math.PI / 2, 0, 0] }, 10)
    k.ball(0.1, GOLD, { p: [0.45, 2.0, 3.36] })
    // Window frames (the glass panes are separate and light up).
    ;[-3.6, -1.8, 1.8, 3.6].forEach((x) => k.box(1.25, 2.75, 0.08, STONE, { p: [x, 2.7, 3.23] }))
    ;[-1.4, 1.4].forEach((z) => [1, -1].forEach((s) => k.box(0.08, 2.75, 1.25, STONE, { p: [s * 5.53, 2.7, z] })))
    // Cupola on the ridge.
    k.box(1.6, 1.2, 1.6, WALL, { p: [0, 8.7, 0] })
    k.cone(1.4, 1.4, ROOF, { p: [0, 10.0, 0], r: [0, Math.PI / 4, 0] }, 4)
    k.ball(0.18, GOLD, { p: [0, 10.9, 0] })
    // Wide stair in front.
    for (let i = 0; i < 5; i++) k.box(8.4, 0.5 - i * 0.1, 0.6, '#e8c9a0', { p: [0, (0.5 - i * 0.1) / 2, 5.2 + i * 0.6] })
    // Low walls and planters beside the stair.
    for (const s of [1, -1]) {
      k.box(0.7, 1.0, 3.6, STONE, { p: [s * 4.6, 0.5, 6.4] })
      k.ball(0.6, '#5fae5a', { p: [s * 4.6, 1.3, 6.4], s: [1, 0.8, 1.3] })
    }
  })
}

function hall(k) {
  const { x, z, h } = L.hill
  k.cyl(L.hill.rTop, L.hill.rBase, h, MOUND, { p: [x, h / 2, z] }, 20)
  k.cyl(L.hill.rBase + 0.4, L.hill.rBase + 0.6, 0.12, '#85c75f', { p: [x, 0.06, z] }, 20)
  // Stone path up the front of the mound.
  const x0 = x
  const topZ = z + L.hill.rTop - 0.1
  const botZ = z + L.hill.rBase
  const len = Math.hypot(botZ - topZ, h)
  const ang = Math.atan2(h, botZ - topZ)
  k.at({ p: [x0, h / 2 + 0.08, (topZ + botZ) / 2], r: [ang, 0, 0] }, () => {
    k.box(2.8, 0.14, len + 0.2, '#ecd3a2', { p: [0, 0, 0] })
    for (let i = 1; i < 6; i++) k.box(2.8, 0.17, 0.12, STONE, { p: [0, 0.01, -len / 2 + (i * len) / 6] })
  })
  k.at({ p: [x, h, z] }, () => {
    k.box(10.6, 0.3, 6.2, STONE, { p: [0, 0.15, 0] })
    k.box(9, 4.2, 5, SAND, { p: [0, 2.4, 0] })
    k.box(9.6, 0.35, 5.6, CREAM, { p: [0, 4.65, 0] })
    k.roof(9.8, 1.8, 5.8, ROOF, { p: [0, 4.8, 0] })
    columns(k, [-3.2, -1.1, 1.1, 3.2], 0.3, 3.1, 4.3)
    k.box(9.4, 0.5, 1.4, CREAM, { p: [0, 4.85, 3.1] })
    k.roof(1.4, 1.3, 9.4, CREAM, { p: [0, 5.1, 3.1], r: [0, Math.PI / 2, 0] })
    k.box(1.4, 2.4, 0.14, WOOD, { p: [0, 1.7, 2.55] })
    ;[-3.2, -1.1, 1.1, 3.2].forEach((dx) => k.box(0.9, 1.7, 0.08, '#7fc4d8', { p: [dx * 1.2, 2.3, 2.52] }))
    // Drum and dome.
    k.cyl(1.7, 1.9, 1.1, CREAM, { p: [0, 6.3, 0] }, 10)
    k.ball(1.9, GOLD, { p: [0, 6.85, 0], s: [1, 0.8, 1] })
    k.cyl(0.04, 0.04, 1.8, WOOD, { p: [0, 8.6, 0] }, 4)
    k.box(0.9, 0.5, 0.05, CORAL, { p: [0.5, 9.2, 0] })
  })
}

function clockTower(k) {
  k.at({ p: [L.tower.x, 0, L.tower.z] }, () => {
    k.box(5.2, 0.5, 5.2, STONE, { p: [0, 0.25, 0] })
    k.box(3.8, 9.8, 3.8, BRICK, { p: [0, 5.4, 0] })
    k.box(4.1, 0.35, 4.1, CREAM, { p: [0, 3.2, 0] })
    k.box(4.1, 0.35, 4.1, CREAM, { p: [0, 9.7, 0] })
    k.box(4.5, 0.4, 4.5, STONE, { p: [0, 10.5, 0] })
    // Arched door at the foot.
    k.box(1.3, 2.2, 0.14, WOOD, { p: [0, 1.6, TOWER_HALF + 0.02] })
    k.cyl(0.65, 0.65, 0.14, WOOD, { p: [0, 2.7, TOWER_HALF + 0.02], r: [Math.PI / 2, 0, 0] }, 10)
    // Four clock faces with tick marks.
    for (let f = 0; f < 4; f++) {
      k.at({ r: [0, (f * Math.PI) / 2, 0] }, () => {
        k.cyl(1.55, 1.55, 0.2, CORAL, { p: [0, TOWER_FACE_Y, TOWER_HALF + 0.05], r: [Math.PI / 2, 0, 0] }, 16)
        k.cyl(1.35, 1.35, 0.24, CREAM, { p: [0, TOWER_FACE_Y, TOWER_HALF + 0.07], r: [Math.PI / 2, 0, 0] }, 16)
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2
          const big = i % 3 === 0
          k.box(big ? 0.14 : 0.08, big ? 0.34 : 0.2, 0.05, NAVY, {
            p: [Math.sin(a) * 1.08, TOWER_FACE_Y + Math.cos(a) * 1.08, TOWER_HALF + 0.22],
            r: [0, 0, -a],
          })
        }
        k.ball(0.14, GOLD, { p: [0, TOWER_FACE_Y, TOWER_HALF + 0.32] }, 0)
      })
    }
    // Open belfry: four posts, a beam for the bell, a bright roof.
    for (const sx of [1, -1]) for (const sz of [1, -1]) k.box(0.6, 2.5, 0.6, CREAM, { p: [sx * 1.5, 11.95, sz * 1.5] })
    k.box(3.6, 0.28, 0.28, WOOD, { p: [0, 12.85, 0] })
    k.box(4.5, 0.4, 4.5, CORAL, { p: [0, 13.4, 0] })
    k.cone(3.15, 3.6, ROOF, { p: [0, 15.4, 0], r: [0, Math.PI / 4, 0] }, 4)
    k.ball(0.28, GOLD, { p: [0, 17.35, 0] })
    k.cone(0.12, 0.9, GOLD, { p: [0, 17.9, 0] }, 4)
  })
}

function bench(k, b) {
  k.at({ p: [b.x, 0, b.z], r: [0, b.face, 0] }, () => {
    k.box(2.2, 0.14, 0.62, WOOD, { p: [0, 0.62, 0] })
    k.box(2.2, 0.55, 0.1, WOOD, { p: [0, 1.0, -0.3], r: [-0.12, 0, 0] })
    for (const s of [1, -1]) {
      k.box(0.12, 0.62, 0.6, NAVY, { p: [s * 0.95, 0.31, 0] })
    }
  })
}

function lamp(k, l) {
  k.cyl(0.22, 0.3, 0.4, NAVY, { p: [l.x, 0.2, l.z] }, 6)
  k.cyl(0.08, 0.12, 4.4, NAVY, { p: [l.x, 2.4, l.z] }, 6)
  k.box(0.5, 0.12, 0.5, NAVY, { p: [l.x, 4.65, l.z] })
  k.ball(0.38, '#ffe9a8', { p: [l.x, 4.95, l.z] })
  k.cone(0.46, 0.32, NAVY, { p: [l.x, 5.3, l.z] }, 6)
}

const BOOKS = ['#f0553f', '#2f8f8a', '#f2a541', '#22304f', '#e07fa0', '#7cc36a', '#8b5e3c']

function bookStack(k, b) {
  k.at({ p: [b.x, 0, b.z], r: [0, b.rot, 0] }, () => {
    const n = 5 + b.k
    let y = 0
    const r = rng(40 + b.k)
    for (let i = 0; i < n; i++) {
      const h = 0.32 + r() * 0.2
      const w = 2.3 - i * 0.12 - r() * 0.2
      k.box(w, h, w * 0.72, BOOKS[(i + b.k * 2) % BOOKS.length], { p: [(r() - 0.5) * 0.3, y + h / 2, (r() - 0.5) * 0.2], r: [0, (r() - 0.5) * 0.35, 0] })
      k.box(w * 0.94, h * 0.7, w * 0.72 + 0.05, CREAM, { p: [0, y + h / 2, 0], r: [0, 0, 0] })
      y += h
    }
    // A toy pencil on top.
    k.cyl(0.07, 0.07, 1.4, GOLD, { p: [0, y + 0.1, 0], r: [0, 0, Math.PI / 2] }, 6)
    k.cone(0.1, 0.2, '#f0553f', { p: [0.8, y + 0.1, 0], r: [0, 0, -Math.PI / 2] }, 6)
  })
}

function bike(k, z, c) {
  k.at({ p: [0, 0, z] }, () => {
    for (const x of [-0.7, 0.7]) {
      k.add(new THREE.TorusGeometry(0.42, 0.05, 6, 12), NAVY, { p: [x, 0.47, 0], r: [0, Math.PI / 2, 0] })
      k.ball(0.07, GOLD, { p: [x, 0.47, 0] }, 0)
    }
    // Frame, fork, seat and handlebar.
    k.box(1.1, 0.07, 0.07, c, { p: [0.0, 0.62, 0], r: [0, 0, 0.1] })
    k.box(0.07, 0.62, 0.07, c, { p: [-0.35, 0.78, 0], r: [0, 0, -0.1] })
    k.box(0.07, 0.62, 0.07, c, { p: [0.65, 0.78, 0], r: [0, 0, 0.2] })
    k.box(0.36, 0.08, 0.14, NAVY, { p: [-0.4, 1.12, 0] })
    k.box(0.07, 0.07, 0.5, NAVY, { p: [0.75, 1.1, 0] })
  })
}

function bikeRack(k) {
  k.at({ p: [L.bikeRack.x, 0, L.bikeRack.z] }, () => {
    k.box(0.12, 0.12, 4.0, NAVY, { p: [0.1, 0.32, 0] })
    k.box(0.12, 0.12, 4.0, NAVY, { p: [-0.5, 0.32, 0] })
    for (const z of [-1.9, 1.9]) for (const x of [-0.5, 0.1]) k.box(0.1, 0.34, 0.1, NAVY, { p: [x, 0.17, z] })
    for (let i = 0; i < 4; i++) k.box(0.1, 0.5, 0.1, NAVY, { p: [-0.2, 0.55, -1.5 + i * 1.0] })
    ;['#f0553f', '#2f8f8a', '#f2a541', '#e07fa0'].forEach((c, i) => bike(k, -1.5 + i * 1.0, c))
  })
}

function fountain(k) {
  k.at({ p: [L.fountain.x, 0, L.fountain.z] }, () => {
    k.cyl(1.8, 1.9, 0.6, STONE, { p: [0, 0.3, 0] }, 12)
    k.cyl(1.5, 1.5, 0.1, '#6fc7d9', { p: [0, 0.62, 0] }, 12)
    k.cyl(0.22, 0.3, 1.5, STONE, { p: [0, 1.2, 0] }, 8)
    k.cyl(0.8, 0.5, 0.2, STONE, { p: [0, 1.9, 0] }, 10)
    k.ball(0.28, '#bfe9f2', { p: [0, 2.3, 0] })
    k.cyl(0.6, 0.6, 0.08, '#6fc7d9', { p: [0, 2.02, 0] }, 10)
  })
}

function buildCampus(k, island) {
  const r = rng(2008)
  baseRoad(k, island, { width: 5, dash: CREAM, skip: (x, z) => Math.hypot(x - L.quad.x, z - L.quad.z) < 8.6 })

  // The quad: round paving with a lighter inner ring, and paths to the library and the hall.
  k.disc(L.quad.r, '#ecd3a2', { p: [L.quad.x, 0.06, L.quad.z] }, 24)
  k.disc(L.quad.r - 1.1, '#f6e3bd', { p: [L.quad.x, 0.08, L.quad.z] }, 24)
  k.disc(2.8, '#ecd3a2', { p: [L.quad.x, 0.1, L.quad.z - 3.8] }, 16)
  k.add(ribbonXZ([[L.hill.x, L.hill.z + 11], [L.hill.x, L.hill.z + 14.5], [L.quad.x, 6.4]], 2.8, 0.05), '#ecd3a2')
  k.add(ribbonXZ([[-12, 4.2], [-14, -2], [L.library.x, L.library.z + 8.6]], 3.2, 0.05), '#ecd3a2')
  k.add(ribbonXZ([[18, 5], [21, -2], [L.tower.x, L.tower.z + 3.4]], 2.6, 0.05), '#ecd3a2')

  hall(k)
  library(k)
  clockTower(k)
  fountain(k)
  bikeRack(k)
  L.benches.forEach((b) => bench(k, b))
  L.lamps.forEach((l) => lamp(k, l))
  L.bookStacks.forEach((b) => bookStack(k, b))

  // Flower beds in front of the library and hall.
  ;[[L.library.x - 8.2, L.library.z + 4], [L.library.x + 8.2, L.library.z + 4], [L.tower.x - 4.2, L.tower.z + 3.2], [L.tower.x + 4.2, L.tower.z + 3.2]].forEach(([x, z]) => {
    k.box(2.6, 0.3, 1.6, STONE, { p: [x, 0.15, z] })
    for (let i = 0; i < 5; i++) {
      k.cyl(0.03, 0.03, 0.4, '#4f9f58', { p: [x - 1 + i * 0.5, 0.45, z + (i % 2 ? 0.2 : -0.2)] }, 4)
      k.ball(0.18, [CORAL, '#ffd23f', '#ff8fa3', CREAM, '#f2a541'][i], { p: [x - 1 + i * 0.5, 0.72, z + (i % 2 ? 0.2 : -0.2)] }, 0)
    }
  })

  // Trees in autumn colours; a few evergreens for contrast.
  const free = clearance(island, [{ x: L.quad.x, z: L.quad.z, r: 10 }, { x: L.hill.x, z: L.hill.z, r: 14 }, { x: L.bikeRack.x, z: L.bikeRack.z, r: 4 }, { x: L.tower.x, z: L.tower.z + 5, r: 8 }, { x: L.library.x, z: L.library.z + 6, r: 9 }])
  const autumn = [
    ['#f2a541', '#f6bd60'],
    ['#e2674a', '#f08a5d'],
    ['#d9a441', '#f2d06b'],
    ['#c9503e', '#e8825f'],
  ]
  let placed = 0
  for (let i = 0; i < 1200 && placed < 34; i++) {
    const x = -39 + r() * 78
    const z = -21 + r() * 42
    if (!free(x, z, 3.0)) continue
    const kind = r() < 0.8 ? 2 : r() < 0.5 ? 0 : 1
    const a = autumn[Math.floor(r() * autumn.length)]
    tree(k, x, z, 0.85 + r() * 0.5, kind, r, ['#5fae5a', '#7cc36a', '#4f9f58', '#3f9a6d', '#4fae78', '#62bd84', a[0], a[1]])
    placed++
  }
  // Fallen leaves, bushes, flowers and rocks.
  placed = 0
  for (let i = 0; i < 1500 && placed < 90; i++) {
    const x = -39 + r() * 78
    const z = -21 + r() * 42
    if (!free(x, z, 0)) continue
    const kind = r()
    if (kind < 0.3) k.ball(0.5 + r() * 0.4, r() < 0.5 ? '#6dbb5e' : '#86cc6f', { p: [x, 0.3, z], s: [1.2, 0.8, 1.1] })
    else if (kind < 0.42) k.ball(0.35 + r() * 0.45, '#b9c2cc', { p: [x, 0.12, z], s: [1.2, 0.7, 1], r: [r(), r(), r()] }, 0)
    else if (kind < 0.7) {
      k.cyl(0.03, 0.03, 0.4, '#4f9f58', { p: [x, 0.2, z] }, 4)
      k.ball(0.15, ['#f0553f', '#fff6e4', '#f2a541', '#ff8fa3'][Math.floor(r() * 4)], { p: [x, 0.46, z] }, 0)
    } else k.disc(0.8 + r() * 1.3, ['#e6c25a', '#e59a4a', '#d9784a'][Math.floor(r() * 3)], { p: [x, 0.025, z] }, 7)
    placed++
  }
}

// --- things that move --------------------------------------------------------

// The clock hands turn all the time. Minute hand: one lap in about 42 s.
function ClockHands() {
  const hours = useRef([])
  const mins = useRef([])
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), [])
  useFrame(() => {
    const t = clock.t
    for (let f = 0; f < 4; f++) {
      mins.current[f].rotation.z = -t * 0.15
      hours.current[f].rotation.z = -t * 0.0125 - 1
    }
  })
  return (
    <group position={[L.tower.x, TOWER_FACE_Y, L.tower.z]}>
      {[0, 1, 2, 3].map((f) => (
        <group key={f} rotation={[0, (f * Math.PI) / 2, 0]}>
          <group position={[0, 0, TOWER_HALF + 0.3]}>
            <group ref={(m) => (hours.current[f] = m)}>
              <mesh geometry={geo} scale={[0.2, 0.75, 0.07]} position={[0, 0, 0.02]}>
                <meshStandardMaterial color={NAVY} flatShading />
              </mesh>
            </group>
            <group ref={(m) => (mins.current[f] = m)}>
              <mesh geometry={geo} scale={[0.13, 1.1, 0.07]} position={[0, 0, 0.1]}>
                <meshStandardMaterial color={CORAL} flatShading />
              </mesh>
            </group>
          </group>
        </group>
      ))}
    </group>
  )
}

// Pickup 0: the bell in the tower swings.
function Bell() {
  const g = useRef()
  useFrame(() => {
    const s = since(0)
    g.current.rotation.z = s < 0 ? Math.sin(clock.t * 0.7) * 0.03 : 0.85 * Math.exp(-s * 0.35) * Math.sin(s * 5.2)
  })
  return (
    <group ref={g} position={[L.tower.x, 12.75, L.tower.z]}>
      <mesh position={[0, -0.75, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.8, 1.2, 10]} />
        <meshStandardMaterial color={GOLD} roughness={0.35} metalness={0.3} flatShading />
      </mesh>
      <mesh position={[0, -1.4, 0]}>
        <icosahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color={WOOD} flatShading />
      </mesh>
    </group>
  )
}

// Pickup 0: the library windows light up one by one.
const WINDOWS = [
  ...[-3.6, -1.8, 1.8, 3.6].map((x) => ({ p: [x, 2.7, 3.31], ry: 0 })),
  ...[-1.4, 1.4].flatMap((z) => [1, -1].map((s) => ({ p: [s * 5.6, 2.7, z], ry: s * (Math.PI / 2) }))),
]
function LibraryWindows() {
  const mesh = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const dark = useMemo(() => new THREE.Color('#5d7a96'), [])
  const lit = useMemo(() => new THREE.Color('#ffd98a'), [])
  const col = useMemo(() => new THREE.Color(), [])
  useFrame(() => {
    const s = since(0)
    WINDOWS.forEach((w, i) => {
      const open = s < 0 ? 0 : smooth((s - i * 0.25) / 0.6)
      dummy.position.set(...w.p)
      dummy.rotation.set(0, w.ry, 0)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
      mesh.current.setColorAt(i, col.copy(dark).lerp(lit, open))
    })
    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
  })
  return (
    <group position={[L.library.x, 0, L.library.z]}>
      <instancedMesh ref={mesh} args={[null, null, WINDOWS.length]} frustumCulled={false}>
        <boxGeometry args={[0.95, 2.45, 0.08]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  )
}

// Pickup 0: graduation caps fly up from the quad and tumble back down.
const CAPS = 14
function Caps() {
  const mesh = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const geo = useMemo(() => {
    const k = new Kit()
    k.box(1.0, 0.08, 1.0, NAVY, { p: [0, 0.32, 0] })
    k.cyl(0.3, 0.34, 0.32, NAVY, { p: [0, 0.14, 0] }, 8)
    k.ball(0.07, GOLD, { p: [0, 0.4, 0] }, 0)
    k.box(0.04, 0.04, 0.55, GOLD, { p: [0, 0.38, 0.28], r: [0, 0, 0] })
    k.ball(0.11, GOLD, { p: [0, 0.34, 0.58] }, 0)
    return k.build()
  }, [])
  const spec = useMemo(() => {
    const r = rng(99)
    return Array.from({ length: CAPS }, (_, i) => {
      const a = (i / CAPS) * Math.PI * 2 + r()
      const d = 1.5 + r() * 3.6
      return { dx: Math.cos(a) * d, dz: Math.sin(a) * d, vy: 9 + r() * 5, spin: [r() * 9 - 4.5, r() * 9 - 4.5, r() * 9 - 4.5], delay: i * 0.07 }
    })
  }, [])
  useFrame(() => {
    const s = since(0)
    const [sx, sz] = L.pickupSpots[0]
    spec.forEach((c, i) => {
      const t = s - c.delay
      if (s < 0 || t < 0 || t > 16) {
        dummy.scale.setScalar(0.0001)
        dummy.position.set(sx, -5, sz)
      } else {
        const tl = (c.vy + Math.sqrt(c.vy * c.vy + 22)) / 10
        const f = Math.min(t, tl)
        const y = t < tl ? 1.2 + c.vy * t - 5 * t * t : 0.16
        dummy.position.set(sx + c.dx * f / tl, y, sz + c.dz * f / tl)
        const k = tl - f
        dummy.rotation.set(c.spin[0] * k * 0.5, c.spin[1] * f, c.spin[2] * k * 0.5)
        dummy.scale.setScalar(1.0 * Math.min(1, (16 - t) / 1.5, t * 8 + 0.2))
      }
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })
  return <instancedMesh ref={mesh} args={[geo, toyMaterial, CAPS]} frustumCulled={false} castShadow />
}

// Fountain spray, always on.
function Spray() {
  const mesh = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  useFrame(() => {
    for (let i = 0; i < 8; i++) {
      const life = (clock.t * 0.6 + i / 8) % 1
      const a = (i / 8) * Math.PI * 2
      const d = life * 1.1
      dummy.position.set(L.fountain.x + Math.cos(a) * d, 2.3 + Math.sin(life * Math.PI) * 0.9 - life * life * 0.6, L.fountain.z + Math.sin(a) * d)
      dummy.scale.setScalar(0.16 * (1 - life * 0.4))
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={mesh} args={[null, null, 8]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color="#bfe9f2" />
    </instancedMesh>
  )
}

export default function CampusHillScenery({ island }) {
  return (
    <>
      <Static build={(k) => buildCampus(k, island)} />
      <ClockHands />
      <Bell />
      <LibraryWindows />
      <Caps />
      <Spray />
    </>
  )
}
