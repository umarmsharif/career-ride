// The Workshop: an engineer's yard in the west, two small European-style towns in the east.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Kit, ribbonXZ, rng } from '../../engine/kit.js'
import { beam, stripes, scatter, baseRoad, CREAM, WOOD, SLATE, NAVY, CORAL, TEAL, GOLD } from '../../engine/props.js'
import { Static, toyMaterial } from '../../engine/IslandParts.jsx'
import { clock, sinceOf, smooth } from '../../engine/state.js'
import L, { roadZ } from './layout.js'

const since = sinceOf(1)
const GLASS = '#7fc4d8'
const BEIGE = '#e8dcc0'
const STEEL = '#aab4c0'
const TAN = '#c9a27a'

// --- Gears ---------------------------------------------------------------------
// A gear lying in the XY plane (axis along z). Pitch radius r, n teeth.
function gearShape(k, r, n, thick, color, hub = GOLD) {
  k.cyl(r - 0.12, r - 0.12, thick, color, { r: [Math.PI / 2, 0, 0] }, Math.max(10, n * 2))
  const tw = ((2 * Math.PI * r) / n) * 0.5
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    k.box(0.3, tw, thick, color, { p: [Math.cos(a) * (r + 0.02), Math.sin(a) * (r + 0.02), 0], r: [0, 0, a] })
  }
  k.cyl(r * 0.3, r * 0.3, thick + 0.14, hub, { r: [Math.PI / 2, 0, 0] }, 8)
}

const WALL_GEARS = [
  { n: 12, r: 1.5, color: '#e2674a', pos: [-1.9, 0.4] },
  { n: 8, r: 1.0, color: '#2f8f8a', pos: null },
  { n: 6, r: 0.75, color: '#f2a541', pos: null },
]
// Place gear 2 to the right of gear 1 and gear 3 below-right of gear 2, with tooth phases that mesh.
const PSI = -0.55
function wallGearLayout() {
  const g = WALL_GEARS.map((x) => ({ ...x }))
  g[1].pos = [g[0].pos[0] + g[0].r + g[1].r, g[0].pos[1]]
  g[2].pos = [g[1].pos[0] + Math.cos(PSI) * (g[1].r + g[2].r), g[1].pos[1] + Math.sin(PSI) * (g[1].r + g[2].r)]
  g[0].rot = 0
  g[1].rot = Math.PI - Math.PI / g[1].n
  const f2 = ((PSI - g[1].rot) * g[1].n) / (2 * Math.PI)
  g[2].rot = PSI + Math.PI - ((0.5 - f2) * 2 * Math.PI) / g[2].n
  return g
}
const wallGears = wallGearLayout()

function GearWall() {
  const refs = useRef([])
  const angle = useRef(0)
  const geos = useMemo(
    () =>
      wallGears.map((g) => {
        const k = new Kit()
        gearShape(k, g.r, g.n, 0.4, g.color)
        return k.build()
      }),
    []
  )
  useFrame((_, dt) => {
    const s = since(1)
    if (s >= 0) angle.current += Math.min(dt, 0.05) * 1.3 * smooth(s / 2.5)
    const th = angle.current
    const [a, b, c] = wallGears
    refs.current[0].rotation.z = a.rot + th
    refs.current[1].rotation.z = b.rot - (th * a.n) / b.n
    refs.current[2].rotation.z = c.rot + (th * a.n) / c.n
  })
  return (
    <group position={[L.gearWall.x, 2.6, L.gearWall.z + 0.4]}>
      {wallGears.map((g, i) => (
        <mesh key={i} ref={(m) => (refs.current[i] = m)} geometry={geos[i]} material={toyMaterial} position={[g.pos[0] + 1.1, g.pos[1], 0]} castShadow />
      ))}
    </group>
  )
}

// --- Static pieces -------------------------------------------------------------

function shedBuild(k) {
  const { x, z, w, d, h } = L.shed
  k.at({ p: [x, 0, z] }, () => {
    k.box(w + 0.6, 0.3, d + 0.6, TAN, { p: [0, 0.15, 0] })
    k.box(w, h, d, '#f0d9b0', { p: [0, 0.3 + h / 2 - 0.15, 0] })
    k.box(w + 0.3, 0.4, d + 0.3, TEAL, { p: [0, h + 0.15, 0] })
    // Sawtooth roof: vertical glass faces look west, slopes fall east.
    const shape = new THREE.Shape()
    const teeth = 4
    const tw = w / teeth
    shape.moveTo(-w / 2, 0)
    for (let i = 0; i < teeth; i++) {
      const x0 = -w / 2 + i * tw
      shape.lineTo(x0, 1.9)
      shape.lineTo(x0 + tw, 0)
    }
    shape.closePath()
    const g = new THREE.ExtrudeGeometry(shape, { depth: d + 0.4, bevelEnabled: false })
    g.translate(0, 0, -(d + 0.4) / 2)
    k.add(g, '#e2674a', { p: [0, h + 0.35, 0] })
    for (let i = 0; i < teeth; i++) {
      const x0 = -w / 2 + i * tw
      k.box(0.12, 0.1, d + 0.5, CREAM, { p: [x0, h + 0.35 + 1.9, 0] })
    }
    // Front door and windows.
    k.box(3.4, 3.4, 0.2, '#3b4a63', { p: [0, 1.85, d / 2 + 0.03] })
    k.box(3.8, 0.25, 0.3, CREAM, { p: [0, 3.65, d / 2 + 0.05] })
    k.box(0.14, 3.4, 0.24, CREAM, { p: [0, 1.85, d / 2 + 0.06] })
    for (const wx of [-6.5, -3.4, 3.4, 6.5]) {
      k.box(2.5, 0.16, 0.28, CREAM, { p: [wx, 3.35, d / 2 + 0.05] })
      k.box(2.5, 0.16, 0.34, CREAM, { p: [wx, 1.45, d / 2 + 0.08] })
      k.box(0.14, 1.9, 0.28, CREAM, { p: [wx - 1.2, 2.4, d / 2 + 0.05] })
      k.box(0.14, 1.9, 0.28, CREAM, { p: [wx + 1.2, 2.4, d / 2 + 0.05] })
    }
    // Chimney, a big roll-up awning over the door and a bunch of logs.
    k.box(1.2, 3.2, 1.2, '#c9503e', { p: [6.5, h + 1.6, -2.2] })
    k.box(1.5, 0.3, 1.5, SLATE, { p: [6.5, h + 3.3, -2.2] })
    stripes(k, 3.8, 1.5, CORAL, { p: [0, 3.95, d / 2 + 0.1], r: [0.35, 0, 0] }, 5)
    for (let i = 0; i < 3; i++) k.cyl(0.3, 0.3, 1.8, '#a8794d', { p: [w / 2 + 0.7, 0.45 + (i % 2 ? 0.5 : 0), -1 + i * 0.62], r: [0, 0, Math.PI / 2] }, 7)
    // Lean-to on the side with a toolboard.
    k.box(0.4, 3.2, 3.6, WOOD, { p: [-w / 2 - 0.3, 1.9, 1] })
    for (let i = 0; i < 4; i++) k.box(0.2, 0.12, 0.5 + (i % 2) * 0.3, STEEL, { p: [-w / 2 - 0.55, 2.2 + (i % 2) * 0.5, 0.2 + i * 0.5] })
  })
}

function bench(k, b, i) {
  k.at({ p: [b.x, 0, b.z] }, () => {
    k.box(3.4, 0.2, 1.5, '#d9a066', { p: [0, 1.1, 0] })
    for (const sx of [-1.5, 1.5]) for (const sz of [-0.6, 0.6]) k.box(0.2, 1.0, 0.2, WOOD, { p: [sx, 0.5, sz] })
    k.box(3.0, 0.14, 1.1, WOOD, { p: [0, 0.45, 0] })
    k.box(3.4, 0.7, 0.14, '#3b4a63', { p: [0, 1.7, -0.72] })
    // Tools: vise, hammer, little gears, a mug.
    k.box(0.5, 0.4, 0.5, STEEL, { p: [-1.2, 1.4, 0.1] })
    k.box(0.12, 0.1, 0.6, NAVY, { p: [-1.2, 1.64, 0.1] })
    k.box(0.14, 0.14, 0.9, WOOD, { p: [0.2, 1.27, 0.3], r: [0, 0.5, 0] })
    k.box(0.4, 0.26, 0.2, STEEL, { p: [0.45, 1.3, 0.55], r: [0, 0.5, 0] })
    gearShape(k, 0.4, 7, 0.12, [GOLD, '#e2674a', TEAL][i % 3])
    k.at({ p: [1.0, 1.28, 0.1], r: [-Math.PI / 2, 0, 0] }, () => gearShape(k, 0.4, 7, 0.12, [GOLD, '#e2674a', TEAL][i % 3]))
    k.cyl(0.14, 0.12, 0.26, CORAL, { p: [-0.4, 1.33, -0.3] }, 8)
  })
}

function computer(k) {
  const { x, z } = L.computerDesk
  k.at({ p: [x, 0, z], r: [0, 0.35, 0], s: 1.15 }, () => {
    k.box(3.4, 0.2, 1.8, '#d9a066', { p: [0, 1.1, 0] })
    for (const sx of [-1.5, 1.5]) for (const sz of [-0.7, 0.7]) k.box(0.2, 1.0, 0.2, WOOD, { p: [sx, 0.5, sz] })
    // Chunky CRT monitor.
    k.box(1.5, 1.3, 0.9, BEIGE, { p: [-0.6, 1.85, -0.1] })
    k.box(1.0, 0.9, 0.7, '#cfc3a6', { p: [-0.6, 1.8, -0.8] })
    k.box(1.1, 0.9, 0.06, '#27433f', { p: [-0.6, 1.9, 0.38] })
    k.box(0.9, 0.7, 0.04, '#6fd0b8', { p: [-0.6, 1.9, 0.41] })
    k.box(0.5, 0.08, 0.04, '#27433f', { p: [-0.7, 2.0, 0.44] })
    k.box(0.9, 0.18, 0.7, BEIGE, { p: [-0.6, 1.3, -0.1] })
    k.ball(0.05, '#58d68d', { p: [-0.1, 1.5, 0.4] }, 0)
    // Beige tower, keyboard, mouse.
    k.box(0.8, 1.6, 1.3, BEIGE, { p: [1.0, 1.9, -0.2] })
    k.box(0.6, 0.1, 0.06, '#8a8576', { p: [1.0, 2.4, 0.45] })
    k.box(0.6, 0.08, 0.04, '#8a8576', { p: [1.0, 2.1, 0.45] })
    k.ball(0.05, '#f0553f', { p: [1.25, 1.7, 0.46] }, 0)
    k.box(1.3, 0.08, 0.5, BEIGE, { p: [-0.6, 1.24, 0.6], r: [0.1, 0, 0] })
    k.box(0.2, 0.08, 0.3, BEIGE, { p: [0.4, 1.24, 0.65] })
    k.cyl(0.4, 0.4, 0.8, '#3b4a63', { p: [1.0, 0.4, 1.1] }, 8)
  })
}

function cabinets(k) {
  const { x, z } = L.cabinets
  const leds = [CORAL, '#58d68d', GOLD]
  ;[-1.6, 0, 1.6].forEach((dx, i) => {
    k.at({ p: [x + dx, 0, z], r: [0, 0.08 * (i - 1), 0] }, () => {
      k.box(1.4, 3.4 + (i === 1 ? 0.5 : 0), 1.3, '#4a5a78', { p: [0, 1.7 + (i === 1 ? 0.25 : 0), 0] })
      for (let u = 0; u < 5; u++) {
        k.box(1.1, 0.4, 0.06, '#2a354d', { p: [0, 0.8 + u * 0.55, 0.67] })
        k.ball(0.06, leds[(u + i) % 3], { p: [0.4, 0.8 + u * 0.55, 0.72] }, 0)
        k.ball(0.06, leds[(u + i + 1) % 3], { p: [0.25, 0.8 + u * 0.55, 0.72] }, 0)
      }
    })
  })
}

function spool(k, s, i) {
  k.at({ p: [s.x, 0, s.z], r: [0, i * 1.1, 0] }, () => {
    k.cyl(1.2, 1.2, 0.14, '#c58a54', { p: [0, 0.14, 0] }, 12)
    k.cyl(0.3, 0.3, 1.0, WOOD, { p: [0, 0.7, 0] }, 8)
    k.cyl(0.9, 0.9, 0.7, i ? TEAL : CORAL, { p: [0, 0.65, 0] }, 12)
    k.cyl(1.2, 1.2, 0.14, '#c58a54', { p: [0, 1.2, 0] }, 12)
    k.add(new THREE.TorusGeometry(0.5, 0.07, 5, 16).rotateX(Math.PI / 2), i ? TEAL : CORAL, { p: [2.0, 0.08, 0.6] })
  })
}

function drafting(k) {
  const { x, z } = L.drafting
  k.at({ p: [x, 0, z], r: [0, 0.4, 0] }, () => {
    for (const sx of [-1.2, 1.2]) {
      k.box(0.2, 1.6, 0.2, WOOD, { p: [sx, 0.8, 0.5] })
      k.box(0.2, 2.2, 0.2, WOOD, { p: [sx, 1.1, -0.7], r: [-0.2, 0, 0] })
    }
    k.box(3.2, 0.14, 1.9, '#d9a066', { p: [0, 1.85, 0], r: [-0.45, 0, 0] })
    k.box(2.8, 0.05, 1.5, '#dbe9f5', { p: [0, 1.95, 0.02], r: [-0.45, 0, 0] })
    k.box(2.0, 0.04, 0.05, '#2f6fb0', { p: [0, 2.0, 0.1], r: [-0.45, 0, 0.02] })
    k.box(0.9, 0.04, 0.05, '#2f6fb0', { p: [-0.5, 2.0, -0.2], r: [-0.45, 0, -0.5] })
    k.box(3.3, 0.1, 0.2, WOOD, { p: [0, 1.35, 0.95] })
    k.cyl(0.1, 0.1, 0.5, CORAL, { p: [1.0, 1.55, 0.95], r: [0, 0, Math.PI / 2] }, 6)
    // Lamp.
    k.cyl(0.05, 0.05, 1.4, NAVY, { p: [-1.5, 2.6, -0.6] }, 5)
    k.cone(0.4, 0.4, GOLD, { p: [-1.3, 3.3, -0.6], r: [0, 0, -0.9] }, 8)
  })
  // Stool.
  k.cyl(0.4, 0.4, 0.15, '#c58a54', { p: [x + 0.2, 1.3, z + 2.2] }, 8)
  k.cyl(0.08, 0.1, 1.2, WOOD, { p: [x + 0.2, 0.6, z + 2.2] }, 5)
}

function plinthBuild(k) {
  k.at({ p: [L.plinth.x, 0, L.plinth.z] }, () => {
    k.cyl(1.9, 2.1, 0.3, '#ecd3a2', { p: [0, 0.15, 0] }, 10)
    k.box(2.8, 0.9, 1.9, '#c9a27a', { p: [0, 0.75, 0] })
    k.box(3.1, 0.18, 2.2, CREAM, { p: [0, 1.29, 0] })
  })
}

function crateBuild(k) {
  const { x, z } = L.crates
  k.box(1.1, 1.0, 1.1, '#d9a066', { p: [x - 0.5, 0.5, z], r: [0, 0.3, 0] })
  k.box(0.9, 0.8, 0.9, '#c58a54', { p: [x + 0.7, 0.4, z + 0.3], r: [0, -0.2, 0] })
  k.box(0.8, 0.7, 0.8, '#d9a066', { p: [x - 0.2, 1.35, z], r: [0, 0.9, 0] })
  k.cyl(0.5, 0.5, 1.1, TEAL, { p: [x + 1.8, 0.55, z - 0.6] }, 10)
  k.cyl(0.52, 0.52, 0.1, NAVY, { p: [x + 1.8, 0.8, z - 0.6] }, 10)
}

// Narrow tall town house. Front is local +z. kind 0 steep roof, 1 stepped gable.
function townHouse(k, hs, idx) {
  const d = 3.6
  const { w, h } = hs
  const r = rng(idx * 17 + 3)
  k.at({ p: [hs.x, 0, hs.z], r: [0, hs.face, 0] }, () => {
    k.box(w + 0.5, 0.25, d + 0.5, TAN, { p: [0, 0.12, 0] })
    k.box(w, h, d, hs.wall, { p: [0, 0.25 + h / 2, 0] })
    const top = 0.25 + h
    if (hs.kind === 1) {
      k.roof(d + 0.3, 1.5, w + 0.3, hs.roof, { p: [0, top, 0], r: [0, Math.PI / 2, 0] })
      for (let i = 0; i < 3; i++) k.box(w * (1 - 0.3 * i) + (i === 0 ? 0.1 : 0), 0.5, 0.4, hs.wall, { p: [0, top + 0.25 + i * 0.5, d / 2 - 0.2] })
      k.box(w + 0.2, 0.14, 0.5, CREAM, { p: [0, top + 0.02, d / 2 - 0.1] })
    } else {
      k.roof(d + 0.5, 2.6, w + 0.5, hs.roof, { p: [0, top, 0], r: [0, Math.PI / 2, 0] })
      k.box(0.5, 0.9, 0.5, '#c9503e', { p: [w / 4, top + 1.6, -0.8] })
      k.box(0.4, 0.5, 0.06, '#f4c36a', { p: [0, top + 0.6, d / 2 + 0.28] })
    }
    // Door and windows on each floor.
    k.box(1.0, 1.9, 0.14, r() < 0.5 ? '#2f8f8a' : '#c9503e', { p: [-w / 4, 1.2, d / 2 + 0.04] })
    k.ball(0.07, GOLD, { p: [-w / 4 + 0.3, 1.2, d / 2 + 0.14] }, 0)
    k.box(1.3, 0.14, 0.4, CREAM, { p: [-w / 4, 0.32, d / 2 + 0.3] })
    const floors = Math.max(2, Math.floor((h - 0.8) / 1.7))
    for (let f = 0; f < floors; f++) {
      const y = f === 0 ? 1.9 : 1.9 + f * 1.55
      for (const wx of f === 0 ? [w / 4] : [-w / 4, w / 4]) {
        k.box(0.95, 1.0, 0.1, GLASS, { p: [wx, y, d / 2 + 0.03] })
        k.box(1.2, 0.12, 0.2, CREAM, { p: [wx, y - 0.58, d / 2 + 0.08] })
        k.box(0.12, 1.2, 0.2, hs.roof, { p: [wx - 0.62, y, d / 2 + 0.06] })
        k.box(0.12, 1.2, 0.2, hs.roof, { p: [wx + 0.62, y, d / 2 + 0.06] })
        if ((f + (wx > 0 ? 1 : 0)) % 2) {
          k.box(1.1, 0.25, 0.3, WOOD, { p: [wx, y - 0.7, d / 2 + 0.25] })
          k.ball(0.14, CORAL, { p: [wx - 0.3, y - 0.5, d / 2 + 0.25] }, 0)
          k.ball(0.14, GOLD, { p: [wx + 0.1, y - 0.5, d / 2 + 0.25] }, 0)
          k.ball(0.14, '#ff8fa3', { p: [wx + 0.4, y - 0.5, d / 2 + 0.25] }, 0)
        }
      }
    }
  })
}

function bellTower(k) {
  const { x, z } = L.tower
  k.at({ p: [x, 0, z] }, () => {
    k.box(3.6, 0.3, 3.6, TAN, { p: [0, 0.15, 0] })
    k.box(3.0, 7.2, 3.0, '#fff1dc', { p: [0, 3.9, 0] })
    k.box(3.3, 0.3, 3.3, '#c9a27a', { p: [0, 7.6, 0] })
    k.box(0.8, 1.9, 0.12, '#2f8f8a', { p: [0, 1.25, 1.52] })
    for (const y of [2.8, 5.2]) k.box(0.5, 1.0, 0.1, '#3b4a63', { p: [0, y, 1.52] })
    k.cyl(0.8, 0.8, 0.16, CREAM, { p: [0, 6.4, 1.53], r: [Math.PI / 2, 0, 0] }, 14)
    k.box(0.08, 0.5, 0.06, NAVY, { p: [0, 6.5, 1.63] })
    k.box(0.4, 0.07, 0.06, NAVY, { p: [0.1, 6.4, 1.63] })
    // Open belfry with a bell.
    for (const sx of [-1.2, 1.2]) for (const sz of [-1.2, 1.2]) k.box(0.4, 2.2, 0.4, '#fff1dc', { p: [sx, 8.85, sz] })
    k.cone(0.55, 0.9, GOLD, { p: [0, 8.9, 0] }, 8)
    k.ball(0.12, NAVY, { p: [0, 8.35, 0] }, 0)
    k.cone(2.6, 3.4, '#e2674a', { p: [0, 11.65, 0], r: [0, Math.PI / 4, 0] }, 4)
    k.ball(0.25, GOLD, { p: [0, 13.5, 0] })
  })
}

function plazaBuild(k) {
  const { x, z, r } = L.plaza
  k.disc(r + 0.5, '#ecd3a2', { p: [x, 0.04, z] }, 14)
  k.disc(r - 0.4, '#f6e6c3', { p: [x, 0.05, z] }, 14)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2
    k.box(0.5, 0.02, 1.2, '#d9b883', { p: [x + Math.cos(a) * 3.2, 0.065, z + Math.sin(a) * 3.2], r: [0, -a, 0] })
  }
  k.at({ p: [x, 0, z] }, () => {
    k.cyl(1.7, 1.8, 0.7, '#b9c2cc', { p: [0, 0.35, 0] }, 12)
    k.cyl(1.4, 1.4, 0.1, '#6fc7d9', { p: [0, 0.7, 0] }, 12)
    k.cyl(0.25, 0.35, 1.5, '#b9c2cc', { p: [0, 1.4, 0] }, 8)
    k.cyl(0.8, 0.5, 0.2, '#b9c2cc', { p: [0, 2.05, 0] }, 10)
    k.ball(0.3, '#bfe9f2', { p: [0, 2.35, 0] })
  })
  for (const a of [0.2, 2.4, 4.5]) {
    k.at({ p: [x + Math.cos(a) * 3.6, 0, z + Math.sin(a) * 3.6], r: [0, -a + Math.PI / 2, 0] }, () => {
      k.box(1.8, 0.14, 0.5, WOOD, { p: [0, 0.55, 0] })
      for (const s of [-1, 1]) k.box(0.14, 0.55, 0.4, '#3b4a63', { p: [s * 0.7, 0.28, 0] })
    })
  }
}

function stallBuild(k) {
  k.at({ p: [L.stall.x, 0, L.stall.z], r: [0, Math.PI, 0] }, () => {
    k.box(2.6, 1.0, 1.2, '#d9a066', { p: [0, 0.5, 0] })
    for (const s of [1, -1]) k.box(0.12, 2.6, 0.12, WOOD, { p: [s * 1.2, 1.3, -0.5] })
    stripes(k, 2.9, 1.5, TEAL, { p: [0, 2.6, -0.6], r: [0.25, 0, 0] })
    ;[CORAL, GOLD, '#7cc36a', CORAL, '#ff8fa3'].forEach((c, i) => k.ball(0.24, c, { p: [-0.9 + i * 0.45, 1.15, 0.1] }))
  })
}

function lamp(k, x, z) {
  k.cyl(0.08, 0.12, 3.4, NAVY, { p: [x, 1.7, z] }, 6)
  k.box(0.4, 0.5, 0.4, '#ffe9a6', { p: [x, 3.5, z] })
  k.cone(0.4, 0.3, NAVY, { p: [x, 3.9, z] }, 4)
}

function buildAll(k, island) {
  const r = rng(101)
  baseRoad(k, { road: L.road, len: 47 }, { color: '#f3dcab', edge: '#e2c48d', width: 5 })
  // Pavements beside the towns and a gravel yard in front of the workshop.
  for (const s of [-1, 1]) {
    const pts = [2, 10, 18, 26, 34].map((x) => [x, roadZ(x) + s * 5.6])
    k.add(ribbonXZ(pts, 1.6, 0.04), '#ecd3a2')
  }
  k.add(ribbonXZ([[-36, -5.5], [-28, -5], [-18, -5], [-8, -4.5]], 3.2, 0.04), '#ecd3a2')
  k.disc(5.5, '#ecd3a2', { p: [L.plinth.x, 0.04, L.plinth.z] }, 10)

  shedBuild(k)
  L.benches.forEach((b, i) => bench(k, b, i))
  computer(k)
  cabinets(k)
  L.spools.forEach((s, i) => spool(k, s, i))
  drafting(k)
  plinthBuild(k)
  crateBuild(k)
  // The wall the gears sit on.
  k.at({ p: [L.gearWall.x, 0, L.gearWall.z] }, () => {
    k.box(7.4, 5.2, 0.4, '#e9c48a', { p: [0, 2.9, 0] })
    k.box(7.7, 0.3, 0.6, WOOD, { p: [0, 5.6, 0] })
    k.box(7.7, 0.3, 0.6, WOOD, { p: [0, 0.3, 0.05] })
    for (const s of [-3.5, 3.5]) k.box(0.3, 5.4, 0.5, WOOD, { p: [s, 2.8, 0.05] })
    k.box(7.0, 0.14, 0.2, '#3b4a63', { p: [0, 5.2, 0.35] })
  })

  L.houses.forEach((h, i) => townHouse(k, h, i))
  bellTower(k)
  plazaBuild(k)
  stallBuild(k)
  for (const x of [1, 9, 16.5, 23, 29, 36.5]) {
    lamp(k, x, roadZ(x) - 3.6)
  }
  // Pennant bases.
  L.pennants.forEach((p) => {
    k.cyl(0.7, 0.8, 0.2, STEEL, { p: [p.x, 0.1, p.z] }, 8)
    k.cyl(0.14, 0.14, 0.4, NAVY, { p: [p.x, 0.4, p.z] }, 6)
  })

  const keep = [
    { x: L.plinth.x, z: L.plinth.z, r: 5.8 },
    { x: L.plaza.x, z: L.plaza.z, r: 6.4 },
    { x: L.gearWall.x, z: L.gearWall.z + 1, r: 5 },
    ...L.pennants.map((p) => ({ x: p.x, z: p.z, r: 2.4 })),
  ]
  scatter(k, island, r, {
    trees: 10, cover: 25, keepOut: keep,
  })
}

// --- Reactive parts ------------------------------------------------------------

// Stop 0: a graduation cap pops up and a scroll unrolls on the plinth.
function Graduation() {
  const cap = useRef()
  const sheet = useRef()
  const roll = useRef()
  const capGeo = useMemo(() => {
    const k = new Kit()
    k.cyl(0.55, 0.6, 0.5, NAVY, { p: [0, 0, 0] }, 10)
    k.box(1.9, 0.12, 1.9, '#27324f', { p: [0, 0.32, 0], r: [0, Math.PI / 4, 0] })
    k.ball(0.12, GOLD, { p: [0, 0.42, 0] })
    beam(k, [0, 0.4, 0], [0.9, 0.38, 0.9], 0.05, GOLD)
    k.cyl(0.07, 0.04, 0.6, GOLD, { p: [0.9, 0.05, 0.9] }, 5)
    k.ball(0.1, GOLD, { p: [0.9, -0.3, 0.9] }, 0)
    return k.build()
  }, [])
  const sheetGeo = useMemo(() => {
    const k = new Kit()
    k.box(2.0, 0.04, 1.3, CREAM, { p: [1.0, 0, 0] })
    ;[0.25, 0, -0.25].forEach((z, i) => k.box(1.5 - i * 0.3, 0.02, 0.07, '#8a7a5a', { p: [0.95 - i * 0.15, 0.03, z] }))
    k.box(0.4, 0.03, 0.4, CORAL, { p: [1.6, 0.04, -0.4], r: [0, 0.4, 0] })
    return k.build()
  }, [])
  const rollGeo = useMemo(() => {
    const k = new Kit()
    k.cyl(0.16, 0.16, 1.4, '#f4e7c8', { r: [Math.PI / 2, 0, 0] }, 8)
    k.cyl(0.07, 0.07, 1.6, WOOD, { r: [Math.PI / 2, 0, 0] }, 5)
    return k.build()
  }, [])
  useFrame(() => {
    const s = since(0)
    const kc = s < 0 ? 0 : smooth(s / 0.7)
    const bounce = s < 0 ? 0 : Math.sin(Math.min(1, s / 0.9) * Math.PI) * 0.7
    cap.current.visible = kc > 0.01
    cap.current.scale.setScalar(Math.max(0.001, kc) * 0.8)
    cap.current.position.y = 2.2 + bounce + Math.sin(clock.t * 2) * 0.08
    cap.current.rotation.y = s < 0 ? 0 : (1 - kc) * 9 + clock.t * 0.6
    const u = s < 0.5 ? 0 : smooth((s - 0.5) / 1.4)
    sheet.current.scale.x = Math.max(0.001, u)
    sheet.current.visible = u > 0.01
    roll.current.position.x = 2.0 * u
    roll.current.rotation.x = 0
    roll.current.visible = s >= 0
  })
  return (
    <group position={[L.plinth.x, 1.4, L.plinth.z]}>
      <mesh ref={cap} geometry={capGeo} material={toyMaterial} castShadow visible={false} />
      <group position={[-1.0, 0.1, 0]}>
        <mesh ref={sheet} geometry={sheetGeo} material={toyMaterial} visible={false} />
        <mesh geometry={rollGeo} material={toyMaterial} position={[0, 0.05, 0]} castShadow />
        <mesh ref={roll} geometry={rollGeo} material={toyMaterial} position={[0, 0.05, 0]} visible={false} castShadow />
      </group>
    </group>
  )
}

// Stop 1: shed windows (front and sawtooth glass) light up and chimney smoke puffs.
function Windows({ island }) {
  const panes = useRef()
  const smoke = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const dark = useMemo(() => new THREE.Color('#3b4a63'), [])
  const lit = useMemo(() => new THREE.Color('#ffe08a'), [])
  const col = useMemo(() => new THREE.Color(), [])
  const items = useMemo(() => {
    const { x, z, w, d, h } = L.shed
    const out = []
    ;[-6.5, -3.4, 3.4, 6.5].forEach((wx, i) => out.push({ p: [x + wx, 2.4, z + d / 2 + 0.1], s: [2.1, 1.7, 0.08], order: i }))
    for (let i = 0; i < 4; i++) {
      const x0 = x - w / 2 + i * (w / 4)
      out.push({ p: [x0 - 0.04, h + 0.35 + 0.95, z], s: [0.08, 1.8, d + 0.1], order: i + 4 })
    }
    return out
  }, [])
  useFrame(() => {
    const s = since(1)
    items.forEach((it, i) => {
      const k = s < 0 ? 0 : smooth((s - it.order * 0.22) / 0.4)
      dummy.position.set(it.p[0], it.p[1] + island.h(it.p[0], it.p[2]), it.p[2])
      dummy.scale.set(...it.s)
      dummy.updateMatrix()
      panes.current.setMatrixAt(i, dummy.matrix)
      panes.current.setColorAt(i, col.copy(dark).lerp(lit, k))
    })
    panes.current.instanceMatrix.needsUpdate = true
    if (panes.current.instanceColor) panes.current.instanceColor.needsUpdate = true
    const { x, z, h } = L.shed
    for (let j = 0; j < 4; j++) {
      const life = (clock.t * 0.4 + j / 4) % 1
      const on = s < 0 ? 0 : smooth(s / 1.2)
      dummy.position.set(x + 6.5 + life * 1.2, h + 3.8 + life * 3.5 + island.h(x + 6.5, z - 2.2), z - 2.2)
      dummy.scale.setScalar(on * (0.3 + life * 0.6) * (1 - life * 0.7))
      dummy.updateMatrix()
      smoke.current.setMatrixAt(j, dummy.matrix)
    }
    smoke.current.instanceMatrix.needsUpdate = true
  })
  return (
    <>
      <instancedMesh ref={panes} args={[null, null, items.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={smoke} args={[null, null, 4]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
      </instancedMesh>
    </>
  )
}

// Stop 2: three plain coloured pennants rise along the road, one per city.
function Pennants() {
  const poles = useRef([])
  const flags = useRef([])
  const poleGeo = useMemo(() => new THREE.CylinderGeometry(0.07, 0.1, 1, 6).translate(0, 0.5, 0), [])
  const flagGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.6, 0, 0, -0.6, 0, 2.1, 0, 0], 3))
    g.computeVertexNormals()
    return g
  }, [])
  const emblem = useMemo(() => new THREE.CircleGeometry(0.2, 10), [])
  useFrame(() => {
    const s = since(2)
    L.pennants.forEach((p, i) => {
      const t = s < 0 ? 0 : (s - i * 0.8) / 1.0
      const k = t <= 0 ? 0 : smooth(t)
      const over = 1 + Math.sin(Math.min(1, t) * Math.PI) * 0.1
      const h = 3.8 * k * over
      poles.current[i].visible = k > 0.01
      poles.current[i].scale.y = Math.max(0.001, h)
      flags.current[i].visible = k > 0.01
      flags.current[i].position.y = h - 0.9
      flags.current[i].rotation.y = Math.PI / 2 + Math.sin(clock.t * 2.4 + i * 1.7) * 0.25
      flags.current[i].scale.set(Math.min(1, k * 1.5) * 1.3, 1.3, 1.3)
    })
  })
  return L.pennants.map((p, i) => (
    <group key={i} position={[p.x, 0.4, p.z]}>
      <mesh ref={(m) => (poles.current[i] = m)} geometry={poleGeo} castShadow visible={false}>
        <meshStandardMaterial color="#8b5e3c" roughness={0.6} flatShading />
      </mesh>
      <group ref={(m) => (flags.current[i] = m)} position={[0.05, 0, 0]} visible={false}>
        <mesh geometry={flagGeo} castShadow>
          <meshStandardMaterial color={p.c} side={THREE.DoubleSide} roughness={0.7} flatShading />
        </mesh>
        <mesh geometry={emblem} position={[0.55, 0, 0.02]}>
          <meshStandardMaterial color="#fff6e4" side={THREE.DoubleSide} roughness={0.7} />
        </mesh>
        <mesh geometry={emblem} position={[0.55, 0, -0.02]} rotation={[0, Math.PI, 0]}>
          <meshStandardMaterial color="#fff6e4" side={THREE.DoubleSide} roughness={0.7} />
        </mesh>
      </group>
      <mesh position={[0, 4.75, 0]} visible={true} scale={0.001}>
        <icosahedronGeometry args={[0.1, 0]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  ))
}

export default function WorkshopScenery({ island }) {
  return (
    <>
      <Static build={(k) => buildAll(k, island)} deps={[island]} />
      <GearWall />
      <Windows island={island} />
      <Graduation />
      <Pennants />
    </>
  )
}
