// The Classroom: an open-air classroom on a summit. The last island, so it ends at an open door.
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Kit, rng } from '../../engine/kit.js'
import { baseRoad, beam, stripes, scatter, CREAM, WOOD, SLATE } from '../../engine/props.js'
import { Static, toyMaterial } from '../../engine/IslandParts.jsx'
import { clock, sinceOf, smooth } from '../../engine/state.js'
import L from './layout.js'

const since = sinceOf(9)
const SNOW = '#fff6e4'
const FLAGS = ['#f0553f', '#f2a541', '#1f9d8f', '#ff8fa3', '#7fc4d8', '#fff6e4']
const CHALK = '#f4efe0'

// ---------------------------------------------------------------- chalk doodles
// Each doodle is a list of strokes in board coordinates (centre of the slate is 0,0).
function line(out, pts, color) {
  for (let i = 0; i < pts.length - 1; i++) out.push({ a: pts[i], b: pts[i + 1], c: color })
}
function head(out, from, to, color) {
  const ang = Math.atan2(to[1] - from[1], to[0] - from[0])
  for (const d of [0.5, -0.5]) out.push({ a: [to[0] - 0.34 * Math.cos(ang + d), to[1] - 0.34 * Math.sin(ang + d)], b: to, c: color })
}
function doodles() {
  const A = []
  // 0: a path that branches three ways.
  {
    const o = []
    line(o, [[-2.4, -1.2], [-1.6, -0.9], [-0.9, -0.2]], CHALK)
    line(o, [[-0.9, -0.2], [0.3, 0.7], [1.8, 0.95]], '#f6bd60')
    head(o, [0.3, 0.7], [1.8, 0.95], '#f6bd60')
    line(o, [[-0.9, -0.2], [1.8, -0.2]], '#ff8fa3')
    head(o, [-0.9, -0.2], [1.8, -0.2], '#ff8fa3')
    line(o, [[-0.9, -0.2], [0.3, -0.9], [1.8, -1.1]], '#7fe3d4')
    head(o, [0.3, -0.9], [1.8, -1.1], '#7fe3d4')
    A.push(o)
  }
  // 1: three blocks, small, medium and large.
  {
    const o = []
    line(o, [[-2.6, -1.3], [2.5, -1.3]], CHALK)
    const rect = (x0, x1, h, c) => line(o, [[x0, -1.3], [x0, -1.3 + h], [x1, -1.3 + h], [x1, -1.3]], c)
    rect(-2.3, -1.5, 0.8, '#7fe3d4')
    rect(-1.0, 0.1, 1.3, '#f6bd60')
    rect(0.6, 2.2, 1.95, '#ff8fa3')
    A.push(o)
  }
  // 2: an arrow that loops.
  {
    const o = []
    line(o, [[-2.4, -1.15], [-1.2, -1.1], [0, -1.0]], CHALK)
    const loop = []
    for (let i = 0; i <= 18; i++) {
      const a = -Math.PI / 2 + (i / 18) * Math.PI * 2
      loop.push([Math.cos(a) * 1.0, Math.sin(a) * 1.0 - 0.1])
    }
    line(o, loop, '#f6bd60')
    line(o, [[0, -1.1], [1.2, -0.2], [2.3, 0.95]], '#7fe3d4')
    head(o, [1.2, -0.2], [2.3, 0.95], '#7fe3d4')
    A.push(o)
  }
  return A
}
const DOODLES = doodles()

// ---------------------------------------------------------------- pieces
function chalkboard(k, b) {
  k.at({ p: [b.x, 0, b.z], r: [0, b.yaw, 0] }, () => {
    for (const s of [-1, 1]) {
      k.box(0.28, 4.4, 0.3, WOOD, { p: [s * 3.2, 2.2, -0.2] })
      beam(k, [s * 3.2, 0.1, -2.0], [s * 3.2, 3.2, -0.25], 0.18, '#a97650')
    }
    k.box(6.9, 4.0, 0.3, '#a97650', { p: [0, 3.2, 0] })
    k.box(6.3, 3.4, 0.2, SLATE, { p: [0, 3.2, 0.12] })
    k.box(6.9, 0.2, 0.55, WOOD, { p: [0, 1.4, 0.3] })
    for (let i = 0; i < 3; i++) k.box(0.3 - i * 0.03, 0.07, 0.07, i % 2 ? '#f6bd60' : CREAM, { p: [-2.2 + i * 0.4, 1.53, 0.35], r: [0, 0.4 + i, 0] })
    k.roof(7.3, 0.9, 1.4, '#e2674a', { p: [0, 5.2, -0.1] })
    // A headline scribble, to read like writing.
    const r = rng(b.x * 7 + 3)
    let x = -2.7
    while (x < -0.4) {
      const w = 0.25 + r() * 0.55
      k.box(w, 0.06, 0.03, '#a9b3c4', { p: [x + w / 2, 4.55, 0.23] })
      x += w + 0.2
    }
    // Chalk dust, a planter and a stack of books at the foot.
    k.box(0.9, 0.45, 0.7, '#e2674a', { p: [-4.1, 0.25, 0.5] })
    k.ball(0.45, '#5fae5a', { p: [-4.1, 0.75, 0.5] })
    k.ball(0.2, '#f2a541', { p: [-4.0, 1.0, 0.7] }, 0)
    k.box(0.9, 0.16, 0.6, '#1f9d8f', { p: [4.2, 0.1, 0.9], r: [0, 0.2, 0] })
    k.box(0.8, 0.16, 0.55, '#f0553f', { p: [4.2, 0.26, 0.9], r: [0, -0.1, 0] })
    k.box(0.7, 0.14, 0.5, '#f2a541', { p: [4.2, 0.41, 0.9], r: [0, 0.3, 0] })
  })
}

function bench(k, b) {
  k.at({ p: [b.x, 0, b.z], r: [0, b.yaw, 0] }, () => {
    if (b.h > 0) k.box(b.len + 0.15, b.h, 1.85, '#d6b184', { p: [0, b.h / 2, 0] })
    for (const s of [-1, 1]) k.box(0.2, 0.34, 0.5, WOOD, { p: [s * (b.len / 2 - 0.2), b.h + 0.17, 0] })
    k.box(b.len, 0.16, 0.6, '#e2674a', { p: [0, b.h + 0.42, 0] })
  })
}

function peak(k, p) {
  const rock = ['#b8977f', '#a98d80', '#c3a38a'][p.tint]
  const light = ['#cdb39d', '#bfa596', '#d6bba3'][p.tint]
  k.at({ p: [p.x, 0, p.z], r: [0, p.rot, 0] }, () => {
    k.cone(p.base, p.h, rock, { p: [0, p.h / 2, 0] }, 6)
    k.cone(p.base * 0.34, p.h * 0.3, SNOW, { p: [0, p.h * 0.86, 0] }, 6)
    k.cone(p.base * 0.62, p.h * 0.62, light, { p: [p.base * 0.75, p.h * 0.31, p.base * 0.25] }, 5)
  })
}

function doorway(k) {
  const { x } = L.door
  k.at({ p: [x, 0, 0] }, () => {
    for (const s of [-1, 1]) {
      k.box(0.9, 0.35, 0.9, '#c9a27a', { p: [0, 0.17, s * 2.25] })
      k.box(0.62, 5.0, 0.62, '#fff1dc', { p: [0, 2.85, s * 2.25] })
      k.box(0.82, 0.3, 0.82, GOLDISH, { p: [0, 5.45, s * 2.25] })
    }
    k.box(0.8, 0.6, 5.5, '#fff1dc', { p: [0, 5.6, 0] })
    k.roof(1.5, 1.5, 6.4, '#e2674a', { p: [0, 5.9, 0] })
    k.ball(0.3, '#f2a541', { p: [-0.5, 5.55, 0] })
    // The open door leaf, swung back behind the frame.
    k.at({ p: [0.7, 0, 1.9], r: [0, 1.25, 0] }, () => {
      k.box(0.12, 4.6, 3.4, '#a97650', { p: [0, 2.45, -1.7] })
      for (let i = 0; i < 2; i++) k.box(0.16, 1.6, 1.3, '#c58a54', { p: [0, 3.0 - i * 2.0 + 0.2, -1.7] })
      k.ball(0.12, '#f2a541', { p: [-0.12, 2.3, -3.0] })
    })
    // Steps up to the door.
    k.box(1.3, 0.2, 5.6, '#e2c48d', { p: [-1.5, 0.1, 0] })
    k.box(1.0, 0.2, 5.0, '#ecd3a2', { p: [-0.9, 0.3, 0] })
  })
}
const GOLDISH = '#f2a541'

function lantern(k, x, z, h = 2.8) {
  k.cyl(0.09, 0.12, h, '#22304f', { p: [x, h / 2, z] }, 6)
  k.box(0.5, 0.08, 0.5, '#22304f', { p: [x, h + 0.02, z] })
  k.cone(0.4, 0.34, '#e2674a', { p: [x, h + 0.62, z] }, 6)
  k.box(0.5, 0.08, 0.5, '#22304f', { p: [x, h - 0.36, z] })
}
const LANTERN_H = 2.8
const LANTERNS = [
  [L.door.x - 0.3, -3.8], [L.door.x - 0.3, 3.8],
  [31, -3.6], [31, 3.6], [34.8, -3.6], [34.8, 3.6], [38.2, -3.6], [38.2, 3.6],
]

function bunting(k, island, a0, b0, sag, n, seed) {
  const r = rng(seed)
  // Placed in one group at the island origin, so heights are added by hand relative to it.
  const h0 = island.h(0, 0)
  const up = (p) => [p[0], p[1] + island.h(p[0], p[2]) - h0, p[2]]
  const a = up(a0)
  const b = up(b0)
  k.at({ p: [0, 0, 0] }, () => {
  for (const [p, q] of [[a, a0], [b, b0]]) {
    const base = p[1] - q[1]
    k.cyl(0.1, 0.14, q[1], '#22304f', { p: [p[0], base + q[1] / 2, p[2]] }, 6)
  }
  let prev = a
  const pts = [a]
  for (let i = 1; i <= n; i++) {
    const u = i / n
    pts.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - Math.sin(u * Math.PI) * sag, a[2] + (b[2] - a[2]) * u])
  }
  for (let i = 1; i <= n; i++) {
    beam(k, prev, pts[i], 0.05, '#22304f')
    prev = pts[i]
  }
  const dir = Math.atan2(b[0] - a[0], b[2] - a[2])
  for (let i = 1; i < n; i++) {
    const p = pts[i]
    k.cone(0.34, 0.8, FLAGS[Math.floor(r() * FLAGS.length)], { p: [p[0], p[1] - 0.42, p[2]], r: [Math.PI, dir - Math.PI / 2, 0], s: [1, 1, 0.1] }, 3)
  }
  })
}

function build(k, island) {
  const r = rng(2026)
  baseRoad(k, island, { color: '#f3dcab', edge: '#e2c48d', skip: (x) => x > 33 })

  // The plaza round the door, and a worn patch of ground at each board.
  k.disc(7.2, '#ecd3a2', { p: [41.5, 0.04, 0] }, 20)
  k.disc(5.8, '#f6e6bd', { p: [41.5, 0.06, 0] }, 20)
  L.boards.forEach((b) => k.disc(3.4, '#ecd3a2', { p: [b.x - 0.6, 0.04, b.z + 2.2] }, 12))
  k.disc(3.2, '#ecd3a2', { p: [L.kiosk.x, 0.04, L.kiosk.z + 2.2] }, 12)
  k.disc(11, '#e6d6a0', { p: [L.amph.cx - 3.5, 0.03, L.amph.cz] }, 20)

  L.peaks.forEach((p) => peak(k, p))
  L.boards.forEach((b) => chalkboard(k, b))
  L.benches.forEach((b) => bench(k, b))
  doorway(k)
  LANTERNS.forEach(([x, z]) => lantern(k, x, z))

  // Kiosk for the agency card: a small striped stall under a magnifying-glass sign.
  k.at({ p: [L.kiosk.x, 0, L.kiosk.z] }, () => {
    k.box(3.9, 0.25, 2.8, '#c9a27a', { p: [0, 0.12, 0] })
    k.box(3.6, 2.7, 2.3, '#fff1dc', { p: [0, 1.6, -0.1] })
    k.box(2.5, 1.0, 0.1, '#3b4a63', { p: [0, 1.9, 1.07] })
    k.box(3.2, 0.14, 0.8, WOOD, { p: [0, 1.28, 1.4] })
    for (const s of [-1, 1]) k.box(0.14, 1.1, 0.14, WOOD, { p: [s * 1.5, 0.78, 1.7] })
    stripes(k, 3.9, 2.0, '#f0553f', { p: [0, 2.95, 1.1], r: [0.3, 0, 0] }, 6)
    k.roof(4.2, 1.1, 3.0, '#1f9d8f', { p: [0, 3.0, -0.1] })
    k.cyl(0.07, 0.07, 1.4, WOOD, { p: [0, 4.4, -0.2] }, 6)
    // Goods on the counter, a stool and a flower pot.
    k.box(0.5, 0.35, 0.4, '#f2a541', { p: [-1.0, 1.52, 1.4] })
    k.box(0.5, 0.25, 0.4, '#1f9d8f', { p: [-0.9, 1.82, 1.4], r: [0, 0.3, 0] })
    k.cyl(0.3, 0.3, 0.5, '#e2674a', { p: [2.4, 0.5, 1.5] }, 8)
    k.ball(0.45, '#5fae5a', { p: [2.4, 1.0, 1.5] })
    k.cyl(0.3, 0.3, 0.5, '#d9a066', { p: [-2.4, 0.5, 1.6] }, 8)
    k.cyl(0.4, 0.4, 0.08, CREAM, { p: [-2.4, 0.78, 1.6] }, 8)
  })

  // Lectern and bicycle stand beside the door.
  k.at({ p: [L.lectern.x, 0, L.lectern.z], r: [0, L.lectern.yaw, 0] }, () => {
    k.box(0.9, 1.1, 0.6, WOOD, { p: [0, 0.55, 0] })
    k.box(1.2, 0.1, 0.85, '#a97650', { p: [0, 1.3, 0.05], r: [0.35, 0, 0] })
    k.box(0.95, 0.05, 0.6, CREAM, { p: [0, 1.38, 0.05], r: [0.35, 0, 0] })
    k.box(0.06, 0.4, 0.5, '#d9c9a8', { p: [0, 1.4, 0.02], r: [0.35, 0, 0] })
    k.ball(0.17, '#f0553f', { p: [0.55, 0.3, 0.55] })
  })
  k.at({ p: [L.bikeStand.x, 0, L.bikeStand.z] }, () => {
    k.box(2.6, 0.12, 0.4, '#22304f', { p: [0, 0.06, 0] })
    for (let i = 0; i < 3; i++) {
      const x = -0.9 + i * 0.9
      k.box(0.07, 0.8, 0.07, '#22304f', { p: [x, 0.5, -0.15] })
      k.box(0.07, 0.8, 0.07, '#22304f', { p: [x, 0.5, 0.15] })
      k.box(0.07, 0.07, 0.37, '#22304f', { p: [x, 0.9, 0] })
    }
    k.ball(0.26, '#f2a541', { p: [0.9, 1.15, 0] }, 1)
    k.box(0.5, 0.06, 0.3, '#1f9d8f', { p: [0.9, 0.96, 0] })
  })

  // Prayer-flag bunting behind the boards, behind the benches, and over the road at both ends.
  for (let i = 0; i < 4; i++) bunting(k, island, [-40 + i * 21, 6.4, -11.6], [-23 + i * 21, 6.4, -11.6], 0.9, 11, 11 + i)
  for (let i = 0; i < 2; i++) bunting(k, island, [-36 + i * 26, 5.2, 11.8], [-13 + i * 26, 5.2, 11.8], 0.8, 10, 31 + i)
  bunting(k, island, [43.5, 6.9, -2.4], [48, 5.4, -9], 0.5, 6, 53)
  bunting(k, island, [43.5, 6.9, 2.4], [48, 5.4, 9], 0.5, 6, 54)

  scatter(k, island, r, {
    trees: 16,
    cover: 90,
    keepOut: [
      { x: L.amph.cx - 3, z: L.amph.cz, r: 10 },
      { x: 42, z: 0, r: 9 },
      { x: L.kiosk.x, z: L.kiosk.z, r: 4 },
      ...L.boards.map((b) => ({ x: b.x, z: b.z + 4, r: 7 })),
      ...L.boards.map((b) => ({ x: b.x, z: 7.6, r: 3.5 })),
    ],
    treeColors: ['#7fb85a', '#9acb62', '#6aa954', '#4f9f6d', '#5fae78', '#7cc79a', '#f2a541', '#f6bd60'],
    rock: '#c3b09a',
    bush: ['#86c765', '#a3d36d'],
    patch: '#a9d36b',
  })
}

// ---------------------------------------------------------------- animated parts
const unitStroke = new THREE.BoxGeometry(1, 1, 0.03).translate(0.5, 0, 0)
const dummy = new THREE.Object3D()

function Chalk({ index }) {
  const mesh = useRef()
  const b = L.boards[index]
  const strokes = DOODLES[index]
  const col = useMemo(() => new THREE.Color(), [])
  useLayoutEffect(() => {
    strokes.forEach((s, i) => mesh.current.setColorAt(i, col.set(s.c)))
    mesh.current.instanceColor.needsUpdate = true
  }, [strokes, col])
  useFrame(() => {
    const s = since(index)
    strokes.forEach((st, i) => {
      const p = s < 0 ? 0 : smooth((s - 0.4 - i * 0.16) / 0.45)
      const dx = st.b[0] - st.a[0]
      const dy = st.b[1] - st.a[1]
      dummy.position.set(st.a[0], st.a[1], 0)
      dummy.rotation.set(0, 0, Math.atan2(dy, dx))
      dummy.scale.set(Math.max(0.0001, Math.hypot(dx, dy) * p + 0.0001), 0.085, 1)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })
  return (
    <group position={[b.x, 0, b.z]} rotation={[0, b.yaw, 0]}>
      <group position={[0, 3.2, 0.25]}>
        <instancedMesh ref={mesh} args={[unitStroke, null, strokes.length]} frustumCulled={false}>
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
      </group>
    </group>
  )
}

// Listener pegs pop up on the benches when their board is found.
const pegGeo = (() => {
  const k = new Kit()
  k.cone(0.24, 0.52, '#ffffff', { p: [0, 0.26, 0] }, 7)
  k.ball(0.18, '#ffffff', { p: [0, 0.66, 0] }, 1)
  k.ball(0.04, '#22304f', { p: [-0.07, 0.7, 0.15] }, 0)
  k.ball(0.04, '#22304f', { p: [0.07, 0.7, 0.15] }, 0)
  return k.build()
})()

function Pegs({ island }) {
  const mesh = useRef()
  const col = useMemo(() => new THREE.Color(), [])
  useLayoutEffect(() => {
    L.pegs.forEach((p, i) => mesh.current.setColorAt(i, col.set(p.color)))
    mesh.current.instanceColor.needsUpdate = true
  }, [col])
  useFrame(() => {
    L.pegs.forEach((p, i) => {
      const s = since(p.board)
      const local = s - 0.5 - p.order * 0.13
      let k = 0
      let hop = 0
      if (s >= 0 && local > 0) {
        const u = Math.min(1, local / 0.5)
        k = 1 + Math.sin(u * Math.PI) * 0.35 * (1 - u) - (1 - u) * (1 - u) * (1 - u)
        k = u >= 1 ? 1 : Math.max(0.001, k * u + (1 - u) * u)
        hop = local > 0.5 ? Math.max(0, Math.sin(clock.t * 2.2 + i * 1.9)) * 0.06 : 0
      }
      dummy.position.set(p.x, p.y + hop + island.h(p.x, p.z), p.z)
      dummy.rotation.set(0, p.yaw + Math.sin(clock.t * 0.8 + i) * 0.15, 0)
      dummy.scale.setScalar(Math.max(0.001, k))
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={mesh} args={[pegGeo, toyMaterial, L.pegs.length]} frustumCulled={false} castShadow />
  )
}

// Stop 3: the magnifying glass sweeps and little arrows climb.
const arrowGeo = (() => {
  const k = new Kit()
  k.cone(0.26, 0.4, '#ffffff', { p: [0, 0.4, 0] }, 4)
  k.box(0.12, 0.45, 0.12, '#ffffff', { p: [0, 0.05, 0] })
  return k.build()
})()

function Magnifier({ island }) {
  const group = useRef()
  const arrows = useRef()
  const col = useMemo(() => new THREE.Color(), [])
  const hues = ['#1f9d8f', '#f2a541', '#f0553f', '#1f9d8f', '#f2a541', '#f0553f']
  useLayoutEffect(() => {
    hues.forEach((h, i) => arrows.current.setColorAt(i, col.set(h)))
    arrows.current.instanceColor.needsUpdate = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [col])
  useFrame(() => {
    const s = since(3)
    const sweep = s < 0 ? 0 : Math.min(1, s / 0.6) * (s < 5 ? 1 : 0.6)
    const angle = s < 0 ? Math.sin(clock.t * 0.9) * 0.06 : Math.sin(s * 2.4) * 0.5 * sweep * Math.exp(-Math.max(0, s - 4) * 0.4) + Math.sin(clock.t * 0.9) * 0.05
    group.current.rotation.z = angle
    group.current.position.x = L.kiosk.x + Math.sin(s < 0 ? 0 : s * 2.4) * 0.5 * (s < 0 ? 0 : sweep)
    for (let i = 0; i < 6; i++) {
      const life = s < 0 ? 0 : ((s * 0.4 + i / 6) % 1)
      const on = s < 0 ? 0 : Math.min(1, s / 0.5)
      dummy.position.set(L.kiosk.x + (i - 2.5) * 0.62, 2.0 + life * 4.2 + island.h(L.kiosk.x, L.kiosk.z), L.kiosk.z + 2.4 + Math.sin(i * 2.1) * 0.3)
      dummy.rotation.set(0, clock.t * 1.4 + i, 0)
      dummy.scale.setScalar(Math.max(0.001, Math.sin(life * Math.PI) * 1.2 * on))
      dummy.updateMatrix()
      arrows.current.setMatrixAt(i, dummy.matrix)
    }
    arrows.current.instanceMatrix.needsUpdate = true
  })
  return (
    <>
      <group ref={group} position={[L.kiosk.x, 5.0, L.kiosk.z + 0.1]}>
        <group position={[0, 1.55, 0]}>
          <mesh castShadow>
            <torusGeometry args={[0.95, 0.15, 6, 20]} />
            <meshStandardMaterial color="#f2a541" roughness={0.45} flatShading />
          </mesh>
          <mesh position={[0, 0, -0.02]}>
            <circleGeometry args={[0.95, 20]} />
            <meshStandardMaterial color="#bfe9f2" transparent opacity={0.45} side={THREE.DoubleSide} roughness={0.2} />
          </mesh>
          <mesh position={[-0.1, 0.25, 0.03]} rotation={[0, 0, 0.6]}>
            <boxGeometry args={[0.5, 0.1, 0.02]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
          </mesh>
          <mesh position={[-1.35, -1.35, 0]} rotation={[0, 0, -Math.PI / 4]} castShadow>
            <boxGeometry args={[0.24, 1.2, 0.24]} />
            <meshStandardMaterial color="#8b5e3c" roughness={0.7} flatShading />
          </mesh>
        </group>
      </group>
      <instancedMesh ref={arrows} args={[arrowGeo, null, 6]} frustumCulled={false}>
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </>
  )
}

// The open door: light pours through it, gently pulsing, all the time.
function DoorLight({ island }) {
  const glow = useRef()
  const halo = useRef()
  const floor = useRef()
  const orbs = useRef()
  const motes = useRef()
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 128
    c.height = 256
    const g = c.getContext('2d')
    const gr = g.createRadialGradient(64, 150, 6, 64, 150, 170)
    gr.addColorStop(0, '#fffbe8')
    gr.addColorStop(0.45, '#ffe9a6')
    gr.addColorStop(1, '#ffc25e')
    g.fillStyle = gr
    g.fillRect(0, 0, 128, 256)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  const floorGeo = useMemo(() => {
    const v = [0, 0.1, -1.9, 0, 0.1, 1.9, -10, 0.1, 5.2, 0, 0.1, -1.9, -10, 0.1, 5.2, -10, 0.1, -5.2]
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3))
    const n = [1, 0.7, 0.3]
    const f = [0, 0, 0]
    g.setAttribute('color', new THREE.Float32BufferAttribute([...n, ...n, ...f, ...n, ...f, ...f], 3))
    return g
  }, [])
  const moteSeeds = useMemo(() => Array.from({ length: 18 }, (_, i) => ({ a: i * 2.399, b: (i * 0.37) % 1, z: ((i * 0.618) % 1) * 2 - 1 })), [])
  useFrame(() => {
    const p = 0.5 + 0.5 * Math.sin(clock.t * 1.5)
    glow.current.color.setScalar(0.93 + 0.07 * p)
    halo.current.opacity = 0.22 + 0.16 * p
    floor.current.opacity = 0.55 + 0.35 * p
    LANTERNS.forEach(([x, z], i) => {
      dummy.position.set(x, LANTERN_H + 0.2 + island.h(x, z), z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.setScalar(0.9 + 0.12 * Math.sin(clock.t * 1.5 + i * 0.7))
      dummy.updateMatrix()
      orbs.current.setMatrixAt(i, dummy.matrix)
    })
    orbs.current.instanceMatrix.needsUpdate = true
    moteSeeds.forEach((m, i) => {
      const life = (clock.t * 0.08 + m.b) % 1
      dummy.position.set(L.door.x - 0.8 - life * 8, island.h(L.door.x, 0) + 0.6 + ((m.a * 3) % 3) + Math.sin(clock.t * 0.9 + m.a) * 0.3 + life * 0.8, m.z * (1.4 + life * 3.2))
      dummy.rotation.set(0, 0, 0)
      dummy.scale.setScalar(Math.max(0.001, Math.sin(life * Math.PI) * 0.9))
      dummy.updateMatrix()
      motes.current.setMatrixAt(i, dummy.matrix)
    })
    motes.current.instanceMatrix.needsUpdate = true
  })
  return (
    <>
      <mesh position={[L.door.x + 0.1, 2.75, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[3.8, 5.0]} />
        <meshBasicMaterial ref={glow} map={tex} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh position={[L.door.x - 0.55, 2.75, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[5.4, 6.4]} />
        <meshBasicMaterial ref={halo} color="#ffd98a" transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh geometry={floorGeo} position={[L.door.x - 0.2, 0, 0]}>
        <meshBasicMaterial ref={floor} vertexColors transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <instancedMesh ref={orbs} args={[null, null, LANTERNS.length]} frustumCulled={false}>
        <icosahedronGeometry args={[0.28, 1]} />
        <meshBasicMaterial color="#ffd36b" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={motes} args={[null, null, moteSeeds.length]} frustumCulled={false}>
        <icosahedronGeometry args={[0.07, 0]} />
        <meshBasicMaterial color="#fff2b8" toneMapped={false} />
      </instancedMesh>
    </>
  )
}

// Clouds drift slowly around the rim; a low sun sits behind the door.
function Sky() {
  const a = useRef()
  const b = useRef()
  const geos = useMemo(() => {
    const make = (seed, tint) => {
      const r = rng(seed)
      const k = new Kit()
      for (let i = 0; i < 16; i++) {
        const th = (i / 16) * Math.PI * 2 + r() * 0.3
        const m = 1 + r() * 0.35
        const cx = Math.cos(th) * (60 * m)
        const cz = Math.sin(th) * (34 * m + 4)
        const cy = -2 + r() * 11
        k.at({ p: [cx, cy, cz], s: 1 + r() * 0.8 }, () => {
          k.ball(2.6, tint, { p: [0, 0, 0], s: [1.5, 0.75, 1] })
          k.ball(2.0, tint, { p: [2.4, -0.2, 0.6], s: [1.3, 0.7, 1] })
          k.ball(1.9, tint, { p: [-2.3, -0.3, -0.5], s: [1.3, 0.7, 1] })
          k.ball(1.5, tint, { p: [0.3, 0.9, 0.3] })
        })
      }
      return k.build()
    }
    return [make(5, '#fffaf0'), make(17, '#ffe6bf')]
  }, [])
  useFrame(() => {
    a.current.position.x = Math.sin(clock.t * 0.04) * 3
    b.current.position.x = -Math.sin(clock.t * 0.03 + 1) * 3
  })
  return (
    <>
      <mesh ref={a} geometry={geos[0]} userData={{ noLift: true }}>
        <meshBasicMaterial vertexColors toneMapped={false} />
      </mesh>
      <mesh ref={b} geometry={geos[1]} userData={{ noLift: true }}>
        <meshBasicMaterial vertexColors toneMapped={false} />
      </mesh>
      <mesh position={[92, 12, 0]} rotation={[0, -Math.PI / 2, 0]} userData={{ noLift: true }}>
        <circleGeometry args={[7, 28]} />
        <meshBasicMaterial color="#ffe08a" fog={false} toneMapped={false} />
      </mesh>
      <mesh position={[91, 12, 0]} rotation={[0, -Math.PI / 2, 0]} userData={{ noLift: true }}>
        <circleGeometry args={[13, 28]} />
        <meshBasicMaterial color="#ffd27a" transparent opacity={0.3} fog={false} toneMapped={false} depthWrite={false} />
      </mesh>
    </>
  )
}

export default function ClassroomScenery({ island }) {
  return (
    <>
      <Static build={(k) => build(k, island)} />
      <Chalk index={0} />
      <Chalk index={1} />
      <Chalk index={2} />
      <Pegs island={island} />
      <Magnifier island={island} />
      <DoorLight island={island} />
      <Sky />
    </>
  )
}
