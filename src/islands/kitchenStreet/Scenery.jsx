// Kitchen Street scenery: a street-food town in two districts.
// Static props go into one merged mesh; only the parts that react to pickups are separate.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Kit, ribbonXZ, insideOutline, rng, textTexture } from '../../engine/kit.js'
import { Static, toyMaterial } from '../../engine/IslandParts.jsx'
import { clock, collectedAt, smooth } from '../../engine/state.js'
import L from './layout.js'

const CREAM = '#fff6e4'
const WOOD = '#8b5e3c'
const SLATE = '#2f3a4f'

// Seconds since pickup `i` was collected, or -1.
const since = (i) => (collectedAt[i] === undefined ? -1 : clock.t - collectedAt[i])

function beam(k, a, b, thick, color) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const dz = b[2] - a[2]
  const len = Math.hypot(dx, dy, dz)
  k.box(thick, thick, len, color, {
    p: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2],
    r: [-Math.atan2(dy, Math.hypot(dx, dz)), Math.atan2(dx, dz), 0],
  })
}

function stripes(k, w, d, color, t, n = 5) {
  // A slab made of alternating strips, starting at local z = 0 and reaching out to z = d.
  k.at(t, () => {
    for (let i = 0; i < n; i++) {
      k.box(w / n + 0.005, 0.1, d, i % 2 ? CREAM : color, { p: [-w / 2 + (i + 0.5) * (w / n), 0, d / 2] })
    }
    k.box(w, 0.26, 0.1, color, { p: [0, -0.12, d] })
  })
}

function tree(k, x, z, s, kind, r) {
  k.at({ p: [x, 0, z], r: [0, r() * 6, 0], s }, () => {
    if (kind === 0) {
      k.cyl(0.22, 0.3, 1.8, WOOD, { p: [0, 0.9, 0] }, 6)
      k.ball(1.5, '#5fae5a', { p: [0, 2.9, 0], s: [1, 0.9, 1] })
      k.ball(1.05, '#7cc36a', { p: [0.8, 3.7, 0.3] })
      k.ball(0.9, '#4f9f58', { p: [-0.8, 2.4, -0.5] })
    } else if (kind === 1) {
      k.cyl(0.2, 0.26, 1.2, WOOD, { p: [0, 0.6, 0] }, 6)
      k.cone(1.5, 2.0, '#3f9a6d', { p: [0, 2.0, 0] }, 7)
      k.cone(1.15, 1.7, '#4fae78', { p: [0, 3.1, 0] }, 7)
      k.cone(0.8, 1.4, '#62bd84', { p: [0, 4.1, 0] }, 7)
    } else {
      k.cyl(0.18, 0.24, 1.4, WOOD, { p: [0, 0.7, 0] }, 6)
      k.ball(1.2, '#f2a541', { p: [0, 2.3, 0] })
      k.ball(0.8, '#f6bd60', { p: [0.5, 3.0, 0.2] })
    }
  })
}

function house(k, h) {
  k.at({ p: [h.x, 0, h.z], r: [0, h.face, 0] }, () => {
    k.box(5.6, 0.3, 5.0, '#c9a27a', { p: [0, 0.15, 0] })
    k.box(5.2, 3.5, 4.6, h.wall, { p: [0, 2.05, 0] })
    k.roof(6.0, 2.3, 5.5, h.roof, { p: [0, 3.8, 0] })
    k.box(0.7, 1.5, 0.7, '#c9a27a', { p: [-1.5, 5.3, -0.9] })
    k.box(0.9, 0.2, 0.9, h.roof, { p: [-1.5, 6.1, -0.9] })
    // Door.
    k.box(1.15, 2.1, 0.14, WOOD, { p: [-1.55, 1.35, 2.31] })
    k.ball(0.09, '#f2a541', { p: [-1.2, 1.35, 2.42] })
    k.box(1.5, 0.16, 0.5, '#c9a27a', { p: [-1.55, 0.3, 2.5] })
    // Kitchen window frame and the serving counter under it.
    k.box(2.3, 0.16, 0.2, CREAM, { p: [1.1, 2.86, 2.32] })
    k.box(0.16, 1.5, 0.2, CREAM, { p: [0.02, 2.1, 2.32] })
    k.box(0.16, 1.5, 0.2, CREAM, { p: [2.18, 2.1, 2.32] })
    k.box(2.6, 0.18, 0.75, WOOD, { p: [1.1, 1.3, 2.6] })
    k.box(0.14, 1.0, 0.14, WOOD, { p: [0.0, 0.8, 2.85] })
    k.box(0.14, 1.0, 0.14, WOOD, { p: [2.2, 0.8, 2.85] })
    // Side window and a flower box.
    k.box(0.14, 1.1, 1.2, '#7fc4d8', { p: [2.62, 2.3, -0.4] })
    k.box(0.3, 0.3, 1.4, WOOD, { p: [2.75, 1.6, -0.4] })
    for (let i = 0; i < 3; i++) k.ball(0.2, ['#f0553f', '#f2a541', '#ff8fa3'][i], { p: [2.8, 1.9, -0.85 + i * 0.45] })
  })
}

function shop(k, s, i) {
  k.at({ p: [s.x, 0, s.z], r: [0, Math.PI, 0] }, () => {
    const tall = 4.3 + (i % 2) * 0.9
    k.box(6.6, 0.3, 5.4, '#c9a27a', { p: [0, 0.15, 0] })
    k.box(6.2, tall, 5.0, s.wall, { p: [0, 0.3 + tall / 2, 0] })
    k.box(6.6, 0.45, 5.4, s.trim, { p: [0, 0.3 + tall + 0.22, 0] })
    k.box(1.2, 0.9, 1.2, '#aab4c0', { p: [1.6, tall + 1.1, -1] })
    k.cyl(0.5, 0.5, 0.9, '#7fc4d8', { p: [-1.6, tall + 1.1, 0.6] }, 10)
    // Shop window, door and name board.
    k.box(3.0, 1.9, 0.14, '#7fc4d8', { p: [-1.2, 1.75, 2.52] })
    k.box(3.2, 0.16, 0.2, CREAM, { p: [-1.2, 0.76, 2.54] })
    k.box(1.3, 2.3, 0.14, s.trim, { p: [1.9, 1.45, 2.52] })
    k.ball(0.09, CREAM, { p: [1.5, 1.45, 2.64] })
    k.box(5.0, 0.8, 0.2, CREAM, { p: [0, tall - 0.35, 2.56] })
    for (let d = 0; d < 3; d++) k.ball(0.17, s.trim, { p: [-0.7 + d * 0.7, tall - 0.35, 2.7] })
    stripes(k, 6.0, 1.7, s.trim, { p: [0, 3.15, 2.5], r: [0.3, 0, 0] }, 7)
    // Crates and a planter by the door.
    k.box(0.8, 0.7, 0.8, '#d9a066', { p: [-2.7, 0.65, 3.2], r: [0, 0.3, 0] })
    k.ball(0.28, '#f0553f', { p: [-2.8, 1.12, 3.15] })
    k.ball(0.26, '#f2a541', { p: [-2.5, 1.1, 3.3] })
    k.cyl(0.4, 0.3, 0.6, '#e2674a', { p: [2.9, 0.6, 3.1] }, 8)
    k.ball(0.55, '#5fae5a', { p: [2.9, 1.3, 3.1] })
  })
}

function buildTown(k) {
  const r = rng(2020)

  // Roads and paving.
  k.add(ribbonXZ(L.road, 6.0, 0.03), '#e2c48d')
  k.add(ribbonXZ(L.road, 5.0, 0.05), '#f3dcab')
  k.disc(6.4, '#ecd3a2', { p: [-22.5, 0.04, 5.2] }, 9)
  k.disc(5.0, '#f3dcab', { p: [-22.5, 0.06, 5.2] }, 9)
  k.add(ribbonXZ([[6.5, 8.6], [14, 9.6], [22, 10.3], [30, 9.4], [37, 7]], 3.6, 0.04), '#ecd3a2')
  k.add(ribbonXZ([[10, -3.4], [18, -4.8], [26, -5], [36, -4.2]], 5.2, 0.04), '#ecd3a2')
  // Dashes down the middle of the road.
  const mid = new THREE.CatmullRomCurve3(L.road.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal')
  for (let i = 2; i < 46; i++) {
    const u = i / 48
    const p = mid.getPointAt(u)
    const t = mid.getTangentAt(u)
    if (Math.abs(p.x + 0.5) < 3.2) continue
    k.box(0.22, 0.02, 0.9, CREAM, { p: [p.x, 0.07, p.z], r: [0, Math.atan2(t.x, t.z), 0] })
  }

  // The stream across the neck, with a waterfall at each end and a plank bridge.
  k.add(ribbonXZ([[-0.2, -12.6], [-0.9, -6], [-0.4, 0], [-1.0, 6], [-0.3, 12.6]], 2.8, 0.06), '#6fc7d9')
  k.add(ribbonXZ([[-0.2, -12.6], [-0.9, -6], [-0.4, 0], [-1.0, 6], [-0.3, 12.6]], 3.6, 0.045), '#8fbf62')
  for (const s of [1, -1]) {
    k.box(2.6, 15, 0.5, '#6fc7d9', { p: [-0.25, -7.4, s * 12.4] })
    k.box(1.0, 15, 0.6, '#bfe9f2', { p: [-0.6, -7.6, s * 12.5] })
    k.ball(1.1, '#ffffff', { p: [-0.3, -15, s * 12.6] })
    k.ball(0.8, '#ffffff', { p: [0.9, -15.4, s * 12.5] })
  }
  k.box(5.2, 0.12, 5.4, '#c58a54', { p: [-0.5, 0.09, -0.15], r: [0, 0.08, 0] })
  for (let i = 0; i < 6; i++) k.box(0.08, 0.14, 5.4, WOOD, { p: [-2.7 + i * 0.9, 0.1, -0.15], r: [0, 0.08, 0] })
  for (const s of [1, -1]) {
    beam(k, [-3.0, 1.1, s * 2.75 - 0.4], [2.2, 1.1, s * 2.75 + 0.05], 0.14, WOOD)
    for (const x of [-3.0, -0.4, 2.2]) k.box(0.2, 1.2, 0.2, WOOD, { p: [x, 0.6, s * 2.75 - 0.15] })
  }

  L.houses.forEach((h) => house(k, h))
  L.shops.forEach((s, i) => shop(k, s, i))

  // Well in the Home Kitchens square.
  k.at({ p: [L.well.x, 0, L.well.z] }, () => {
    k.cyl(1.1, 1.2, 0.9, '#b9c2cc', { p: [0, 0.45, 0] }, 10)
    k.cyl(0.85, 0.85, 0.1, '#6fc7d9', { p: [0, 0.86, 0] }, 10)
    for (const s of [1, -1]) k.box(0.16, 2.2, 0.16, WOOD, { p: [s * 0.95, 1.5, 0] })
    k.roof(2.6, 0.8, 1.8, '#e2674a', { p: [0, 2.5, 0] })
  })
  // A market stall and benches in the square.
  k.at({ p: [-17.6, 0, 5.4], r: [0, -0.5, 0] }, () => {
    k.box(2.6, 1.0, 1.2, '#d9a066', { p: [0, 0.5, 0] })
    for (const s of [1, -1]) k.box(0.12, 2.6, 0.12, WOOD, { p: [s * 1.2, 1.3, -0.5] })
    stripes(k, 2.9, 1.5, '#f2a541', { p: [0, 2.6, -0.6], r: [0.25, 0, 0] })
    ;['#f0553f', '#f2a541', '#7cc36a', '#f0553f'].forEach((c, i) => k.ball(0.24, c, { p: [-0.8 + i * 0.52, 1.15, 0.1] }))
  })
  k.box(2.2, 0.16, 0.6, WOOD, { p: [-23.5, 0.6, 8.2] })
  for (const s of [1, -1]) k.box(0.16, 0.6, 0.5, WOOD, { p: [-23.5 + s * 0.9, 0.3, 8.2] })

  // Merchant Row: outdoor tables and the help desk.
  L.tables.forEach((t) => {
    k.at({ p: [t.x, 0, t.z] }, () => {
      k.cyl(0.9, 0.9, 0.12, CREAM, { p: [0, 1.0, 0] }, 10)
      k.cyl(0.1, 0.14, 1.0, WOOD, { p: [0, 0.5, 0] }, 6)
      k.cyl(0.06, 0.06, 2.4, WOOD, { p: [0, 2.2, 0] }, 6)
      k.cone(1.9, 0.9, t.c, { p: [0, 3.6, 0] }, 8)
      k.ball(0.14, CREAM, { p: [0, 4.1, 0] })
      for (let i = 0; i < 3; i++) {
        const a = i * 2.1 + 0.4
        k.cyl(0.32, 0.28, 0.6, t.c, { p: [Math.cos(a) * 1.5, 0.3, Math.sin(a) * 1.5] }, 8)
      }
      k.ball(0.2, '#f2a541', { p: [0.3, 1.2, 0.1] })
      k.cyl(0.16, 0.12, 0.26, '#7fc4d8', { p: [-0.3, 1.19, -0.2] }, 6)
    })
  })
  k.at({ p: [L.helpDesk.x, 0, L.helpDesk.z], r: [0, -0.35, 0] }, () => {
    k.box(3.0, 1.15, 1.6, '#1f9d8f', { p: [0, 0.58, 0] })
    k.box(3.3, 0.14, 1.9, CREAM, { p: [0, 1.22, 0] })
    for (const s of [1, -1]) k.box(0.16, 2.2, 0.16, CREAM, { p: [s * 1.4, 2.3, -0.7] })
    stripes(k, 3.4, 2.1, '#1f9d8f', { p: [0, 3.4, -0.9], r: [0.18, 0, 0] })
    k.ball(0.2, '#f2a541', { p: [0.8, 1.42, 0.3] })
    k.cyl(0.26, 0.26, 0.06, '#aab4c0', { p: [0.8, 1.3, 0.3] }, 8)
  })

  // Lantern strings across the row.
  for (const x of [12.5, 18.5, 24.5, 30.5, 36]) {
    const zr = roadZ(x)
    const a = [x, 5.3, zr + 4.3]
    const b = [x, 5.3, zr - 4.3]
    for (const p of [a, b]) {
      k.cyl(0.1, 0.14, 5.3, '#22304f', { p: [p[0], 2.65, p[2]] }, 6)
      k.ball(0.18, '#f2a541', { p: [p[0], 5.4, p[2]] })
    }
    let prev = a
    for (let i = 1; i <= 6; i++) {
      const u = i / 6
      const q = [x, 5.3 - Math.sin(u * Math.PI) * 0.9, a[2] + (b[2] - a[2]) * u]
      beam(k, prev, q, 0.045, '#22304f')
      prev = q
    }
  }

  // Menu boards outside each shop (the writing appears when pickup 4 is found).
  L.shops.forEach((s) => {
    k.at({ p: [s.x + 2.4, 0, s.z - 4.3], r: [0, Math.PI + 0.25, 0] }, () => {
      k.box(1.5, 2.0, 0.12, WOOD, { p: [0, 1.0, 0], r: [-0.2, 0, 0] })
      k.box(1.26, 1.6, 0.08, SLATE, { p: [0, 1.05, 0.08], r: [-0.2, 0, 0] })
      k.box(1.5, 1.9, 0.1, WOOD, { p: [0, 0.95, -0.5], r: [0.2, 0, 0] })
    })
  })

  // Scoreboard plinth for the growth pickup.
  k.at({ p: [L.scoreboard.x, 0, L.scoreboard.z], r: [0, -2.7, 0] }, () => {
    k.box(3.6, 0.5, 1.8, '#c9a27a', { p: [0, 0.25, 0] })
    k.box(3.2, 0.2, 1.4, CREAM, { p: [0, 0.6, 0] })
  })

  // Trees, bushes, rocks and flowers, kept clear of roads and buildings.
  const roadPts = []
  for (let i = 0; i <= 60; i++) {
    const p = mid.getPointAt(i / 60)
    roadPts.push([p.x, p.z])
  }
  const clear = (x, z, pad) => {
    for (const o of [[0, 0], [pad, 0], [-pad, 0], [0, pad], [0, -pad]]) {
      if (!insideOutline(L.outline, x + o[0] * 1.6, z + o[1] * 1.6)) return false
    }
    if (Math.abs(x + 0.5) < 3.4) return false
    if (Math.hypot(x + 22.5, z - 5.2) < 7.4) return false
    if (x > 6 && x < 38 && z > -8.5 && z < 11) return false
    for (const [rx, rz] of roadPts) if (Math.hypot(x - rx, z - rz) < 3.6 + pad) return false
    for (const c of L.colliders) if (Math.hypot(x - c.x, z - c.z) < c.r + 1.2 + pad) return false
    for (const p of L.pickups) if (Math.hypot(x - p.x, z - p.z) < 3.5) return false
    return true
  }
  let placed = 0
  for (let i = 0; i < 900 && placed < 46; i++) {
    const x = -46 + r() * 92
    const z = -21 + r() * 42
    if (!clear(x, z, 3.2)) continue
    tree(k, x, z, 0.8 + r() * 0.55, Math.floor(r() * 3), r)
    placed++
  }
  placed = 0
  for (let i = 0; i < 1400 && placed < 110; i++) {
    const x = -46 + r() * 92
    const z = -21 + r() * 42
    if (!clear(x, z, 0)) continue
    const kind = r()
    if (kind < 0.3) k.ball(0.5 + r() * 0.45, r() < 0.5 ? '#6dbb5e' : '#86cc6f', { p: [x, 0.3, z], s: [1.2, 0.8, 1.1] })
    else if (kind < 0.45) k.ball(0.35 + r() * 0.5, '#b9c2cc', { p: [x, 0.12, z], s: [1.2, 0.7, 1], r: [r(), r(), r()] }, 0)
    else if (kind < 0.8) {
      k.cyl(0.03, 0.03, 0.4, '#4f9f58', { p: [x, 0.2, z] }, 4)
      k.ball(0.15, ['#f0553f', '#fff6e4', '#f2a541', '#ff8fa3'][Math.floor(r() * 4)], { p: [x, 0.46, z] }, 0)
    } else k.disc(1.2 + r() * 1.6, '#93cd62', { p: [x, 0.02, z] }, 7)
    placed++
  }
}

function roadZ(x) {
  // Height of the road's centre line across the island at a given x (east half).
  const pts = L.road
  for (let i = 0; i < pts.length - 1; i++) {
    if (x >= pts[i][0] && x <= pts[i + 1][0]) {
      const u = (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0])
      return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u
    }
  }
  return 0
}

// --- Parts that react to pickups ------------------------------------------------

// Pickup 1: kitchens open one by one. Shutters lift into awnings, windows glow, chimneys steam.
function Kitchens() {
  const shutters = useRef([])
  const panes = useRef()
  const steam = useRef()
  const pots = useRef([])
  const shutterGeos = useMemo(
    () =>
      L.houses.map((h) => {
        const k = new Kit()
        stripes(k, 2.5, 1.55, h.awning, { p: [0, 0, 0] })
        return k.build()
      }),
    []
  )
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const dark = useMemo(() => new THREE.Color('#3b4a63'), [])
  const lit = useMemo(() => new THREE.Color('#ffd98a'), [])
  const col = useMemo(() => new THREE.Color(), [])
  const fronts = useMemo(
    () =>
      L.houses.map((h) => {
        const o = new THREE.Object3D()
        o.position.set(h.x, 0, h.z)
        o.rotation.y = h.face
        o.updateMatrixWorld()
        return o
      }),
    []
  )
  const v = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    const s = since(0)
    L.houses.forEach((h, i) => {
      const open = s < 0 ? 0 : smooth((s - i * 0.45) / 0.7)
      const over = open * (1 + Math.sin(Math.min(1, open) * Math.PI) * 0.12)
      shutters.current[i].rotation.x = Math.PI / 2 - over * (Math.PI / 2 - 0.28)
      pots.current[i].scale.setScalar(Math.max(0.001, open))
      // Window pane.
      v.set(1.1, 2.1, 2.3).applyMatrix4(fronts[i].matrixWorld)
      dummy.position.copy(v)
      dummy.rotation.set(0, h.face, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      panes.current.setMatrixAt(i, dummy.matrix)
      panes.current.setColorAt(i, col.copy(dark).lerp(lit, open))
      // Steam puffs from the chimney.
      for (let j = 0; j < 3; j++) {
        const life = (clock.t * 0.45 + j / 3 + i * 0.17) % 1
        v.set(-1.5, 6.4 + life * 3.2, -0.9 + Math.sin(life * 5 + i) * 0.3).applyMatrix4(fronts[i].matrixWorld)
        dummy.position.copy(v)
        dummy.rotation.set(0, 0, 0)
        dummy.scale.setScalar(open * (0.25 + life * 0.5) * (1 - life * 0.75))
        dummy.updateMatrix()
        steam.current.setMatrixAt(i * 3 + j, dummy.matrix)
      }
    })
    panes.current.instanceMatrix.needsUpdate = true
    if (panes.current.instanceColor) panes.current.instanceColor.needsUpdate = true
    steam.current.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      {L.houses.map((h, i) => (
        <group key={i} position={[h.x, 0, h.z]} rotation={[0, h.face, 0]}>
          <group position={[1.1, 2.94, 2.36]}>
            <mesh ref={(m) => (shutters.current[i] = m)} geometry={shutterGeos[i]} material={toyMaterial} castShadow />
          </group>
          <group ref={(m) => (pots.current[i] = m)} position={[1.1, 1.39, 2.6]}>
            <mesh position={[-0.6, 0.22, 0]} castShadow>
              <cylinderGeometry args={[0.3, 0.26, 0.44, 8]} />
              <meshStandardMaterial color="#aab4c0" roughness={0.4} flatShading />
            </mesh>
            <mesh position={[0.2, 0.16, 0.05]} castShadow>
              <cylinderGeometry args={[0.36, 0.3, 0.32, 8]} />
              <meshStandardMaterial color="#e2674a" roughness={0.6} flatShading />
            </mesh>
            <mesh position={[0.85, 0.2, -0.05]}>
              <icosahedronGeometry args={[0.22, 0]} />
              <meshStandardMaterial color="#f2a541" roughness={0.6} flatShading />
            </mesh>
          </group>
        </group>
      ))}
      <instancedMesh ref={panes} args={[null, null, L.houses.length]} frustumCulled={false}>
        <boxGeometry args={[2.0, 1.4, 0.08]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={steam} args={[null, null, L.houses.length * 3]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
      </instancedMesh>
    </>
  )
}

// Pickup 2: the playbook leaves the island as two paper planes.
function PaperPlanes() {
  const planes = useRef([])
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const v = [
      0, 0, 1.4, -0.9, 0.12, -0.8, 0, 0, -0.5,
      0, 0, 1.4, 0, 0, -0.5, 0.9, 0.12, -0.8,
      0, 0, 1.4, 0, -0.45, -0.7, 0, 0, -0.5,
    ]
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3))
    g.computeVertexNormals()
    return g
  }, [])
  const routes = [
    { from: [-22, 7.5, 13.4], dir: [0.93, 0.2, 0.3], wob: 0 },
    { from: [-22, 7.5, 13.4], dir: [0.9, 0.26, -0.36], wob: 2 },
  ]
  useFrame(() => {
    const s = since(1)
    routes.forEach((r, i) => {
      const m = planes.current[i]
      const local = s - i * 1.1
      if (s < 0 || local < 0) {
        m.visible = false
        return
      }
      const loop = (local % 11) / 11
      const d = loop * 150
      m.visible = true
      m.position.set(
        r.from[0] + r.dir[0] * d,
        r.from[1] + r.dir[1] * d + Math.sin(loop * 9 + r.wob) * 1.6,
        r.from[2] + r.dir[2] * d + Math.sin(loop * 6 + r.wob) * 3
      )
      m.rotation.set(-0.18 + Math.cos(loop * 9 + r.wob) * -0.2, Math.atan2(r.dir[0], r.dir[2]), Math.sin(loop * 6 + r.wob) * 0.35, 'YXZ')
      m.scale.setScalar(Math.min(1, loop * 12, (1 - loop) * 6) * 1.5)
    })
  })
  return routes.map((_, i) => (
    <mesh key={i} ref={(m) => (planes.current[i] = m)} geometry={geo} visible={false} castShadow>
      <meshStandardMaterial color="#fff6e4" side={THREE.DoubleSide} flatShading roughness={0.9} />
    </mesh>
  ))
}

// Pickup 3: one bar grows by 60%, the other shrinks by 30%.
function GrowthBars() {
  const gmv = useRef()
  const sub = useRef()
  const up = useRef()
  const down = useRef()
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), [])
  const texA = useMemo(() => textTexture('GMV', { w: 256, h: 96, size: 64, bg: '#fff6e4', fg: '#22304f' }), [])
  const texB = useMemo(() => textTexture('Subsidy', { w: 256, h: 96, size: 54, bg: '#fff6e4', fg: '#22304f' }), [])
  useFrame(() => {
    const s = since(2)
    const k = s < 0 ? 0 : smooth(s / 1.4)
    const bounce = s < 0 ? 0 : Math.sin(Math.min(1, s / 1.4) * Math.PI) * 0.12
    const hA = 2.0 * (1 + 0.6 * k + bounce)
    const hB = 2.0 * (1 - 0.3 * k)
    gmv.current.scale.set(1.1, hA, 1.0)
    sub.current.scale.set(1.1, hB, 1.0)
    up.current.position.y = 0.7 + hA + 0.55 + Math.sin(clock.t * 3) * 0.08
    down.current.position.y = 0.7 + hB + 0.55 + Math.sin(clock.t * 3 + 1) * 0.08
    up.current.visible = down.current.visible = k > 0.05
  })
  return (
    <group position={[L.scoreboard.x, 0, L.scoreboard.z]} rotation={[0, -2.7, 0]}>
      <mesh ref={gmv} geometry={geo} position={[-0.85, 0.7, 0]} castShadow>
        <meshStandardMaterial color="#1f9d8f" roughness={0.6} flatShading />
      </mesh>
      <mesh ref={sub} geometry={geo} position={[0.85, 0.7, 0]} castShadow>
        <meshStandardMaterial color="#f0553f" roughness={0.6} flatShading />
      </mesh>
      <mesh ref={up} position={[-0.85, 3, 0]} visible={false}>
        <coneGeometry args={[0.42, 0.6, 4]} />
        <meshBasicMaterial color="#1f9d8f" />
      </mesh>
      <mesh ref={down} position={[0.85, 3, 0]} rotation={[Math.PI, 0, 0]} visible={false}>
        <coneGeometry args={[0.42, 0.6, 4]} />
        <meshBasicMaterial color="#f0553f" />
      </mesh>
      <mesh position={[-0.85, 0.36, 0.91]}>
        <planeGeometry args={[1.4, 0.5]} />
        <meshBasicMaterial map={texA} toneMapped={false} />
      </mesh>
      <mesh position={[0.85, 0.36, 0.91]}>
        <planeGeometry args={[1.4, 0.5]} />
        <meshBasicMaterial map={texB} toneMapped={false} />
      </mesh>
    </group>
  )
}

// Pickup 4: dish descriptions write themselves onto every menu board.
function MenuWriting() {
  const lines = useRef([])
  const geo = useMemo(() => {
    const k = new Kit()
    ;[0, 1, 2, 3].forEach((i) => {
      const w = [0.95, 0.75, 0.9, 0.55][i]
      k.box(w, 0.1, 0.03, i === 0 ? '#ffd23f' : CREAM, { p: [w / 2, -i * 0.32, 0] })
    })
    return k.build()
  }, [])
  useFrame(() => {
    const s = since(3)
    L.shops.forEach((_, i) => {
      const k = s < 0 ? 0 : smooth((s - i * 0.5) / 0.9)
      lines.current[i].scale.x = Math.max(0.001, k)
      lines.current[i].visible = k > 0
    })
  })
  return L.shops.map((s, i) => (
    <group key={i} position={[s.x + 2.4, 0, s.z - 4.3]} rotation={[0, Math.PI + 0.25, 0]}>
      <group rotation={[-0.2, 0, 0]} position={[0, 1.05, 0.14]}>
        <mesh ref={(m) => (lines.current[i] = m)} geometry={geo} position={[-0.48, 0.5, 0]} visible={false}>
          <meshBasicMaterial vertexColors toneMapped={false} />
        </mesh>
      </group>
    </group>
  ))
}

// Pickup 5: five hearts rise from the help desk.
function Hearts() {
  const hearts = useRef([])
  const geo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0, -0.5)
    s.bezierCurveTo(-0.9, 0.1, -0.55, 0.75, 0, 0.3)
    s.bezierCurveTo(0.55, 0.75, 0.9, 0.1, 0, -0.5)
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.22, bevelEnabled: false, curveSegments: 5 })
    g.translate(0, 0, -0.11)
    return g
  }, [])
  useFrame(() => {
    const s = since(4)
    for (let i = 0; i < 5; i++) {
      const m = hearts.current[i]
      if (s < 0) {
        m.visible = false
        continue
      }
      const local = s - i * 0.5
      if (local < 0) {
        m.visible = false
        continue
      }
      const life = (local % 4.2) / 4.2
      m.visible = true
      m.position.set(
        L.helpDesk.x + Math.sin(life * 6 + i * 1.3) * 0.9 + (i - 2) * 0.7,
        2.2 + life * 6.5,
        L.helpDesk.z + Math.cos(life * 5 + i) * 0.6
      )
      m.rotation.y = clock.t * 1.5 + i
      m.scale.setScalar(Math.min(1, life * 8, (1 - life) * 4) * (0.8 + (i % 2) * 0.25))
    }
  })
  return [0, 1, 2, 3, 4].map((i) => (
    <mesh key={i} ref={(m) => (hearts.current[i] = m)} geometry={geo} visible={false}>
      <meshStandardMaterial color="#f0553f" emissive="#f0553f" emissiveIntensity={0.35} roughness={0.5} flatShading />
    </mesh>
  ))
}

// Pickup 6: the lanterns along the row turn from amber to green, one string at a time.
function Lanterns() {
  const mesh = useRef()
  const spots = useMemo(() => {
    const out = []
    ;[12.5, 18.5, 24.5, 30.5, 36].forEach((x, si) => {
      const zr = roadZ(x)
      for (let i = 1; i <= 5; i++) {
        const u = i / 6
        out.push({ p: [x, 5.3 - Math.sin(u * Math.PI) * 0.9 - 0.3, zr + 4.3 - 8.6 * u], order: si * 5 + i })
      }
    })
    return out
  }, [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const amber = useMemo(() => new THREE.Color('#ff9f1c'), [])
  const green = useMemo(() => new THREE.Color('#58d68d'), [])
  const col = useMemo(() => new THREE.Color(), [])
  useFrame(() => {
    const s = since(5)
    spots.forEach((sp, i) => {
      const k = s < 0 ? 0 : smooth((s - sp.order * 0.07) / 0.3)
      dummy.position.set(sp.p[0], sp.p[1] + Math.sin(clock.t * 1.6 + i) * 0.04, sp.p[2])
      dummy.scale.setScalar(1 + Math.sin(k * Math.PI) * 0.5)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
      mesh.current.setColorAt(i, col.copy(amber).lerp(green, k))
    })
    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
  })
  return (
    <instancedMesh ref={mesh} args={[null, null, spots.length]} frustumCulled={false}>
      <icosahedronGeometry args={[0.26, 1]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}

export default function KitchenStreetScenery() {
  return (
    <>
      <Static build={buildTown} />
      <Kitchens />
      <PaperPlanes />
      <GrowthBars />
      <MenuWriting />
      <Hearts />
      <Lanterns />
    </>
  )
}
