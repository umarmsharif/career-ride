// Signal Valley scenery: valley walls, a winding road and stream, signal towers
// whose beacons light as the rider passes, and an analyst's hut with a chart board.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ribbonXZ, rng, textTexture } from '../../engine/kit.js'
import { baseRoad, beam, scatter, tree, CREAM, WOOD, SLATE, CORAL, TEAL, GOLD } from '../../engine/props.js'
import { Static } from '../../engine/IslandParts.jsx'
import { clock, rider, sinceOf, smooth, damp } from '../../engine/state.js'
import L, { roadAt } from './layout.js'

const since = sinceOf(3)
const BARS = [0.9, 1.4, 1.2, 2.1, 2.9]
const BAR_COLORS = [TEAL, TEAL, GOLD, TEAL, CORAL]
const BOARD_Y = 2.6

function tower(k, t) {
  k.at({ p: [t.x, 0, t.z], r: [0, t.i * 0.7, 0] }, () => {
    const h = t.h
    const b = 1.15
    const tp = 0.3
    const corners = [[1, 1], [1, -1], [-1, -1], [-1, 1]]
    k.cyl(1.9, 2.1, 0.3, '#c9a27a', { p: [0, 0.15, 0] }, 8)
    corners.forEach(([sx, sz]) => beam(k, [sx * b, 0.3, sz * b], [sx * tp, h, sz * tp], 0.17, CREAM))
    // Cross braces on each face, at three levels.
    const lv = [0.3, h * 0.36, h * 0.68, h]
    const at = (y) => b + (tp - b) * ((y - 0.3) / (h - 0.3))
    for (let l = 0; l < 3; l++) {
      for (let c = 0; c < 4; c++) {
        const [ax, az] = corners[c]
        const [bx, bz] = corners[(c + 1) % 4]
        const a0 = at(lv[l])
        const a1 = at(lv[l + 1])
        beam(k, [ax * a0, lv[l], az * a0], [bx * a1, lv[l + 1], bz * a1], 0.09, l % 2 ? CORAL : '#e9b44c')
      }
      k.box(at(lv[l + 1]) * 2 + 0.1, 0.12, at(lv[l + 1]) * 2 + 0.1, CORAL, { p: [0, lv[l + 1], 0] })
    }
    k.box(1.1, 0.14, 1.1, SLATE, { p: [0, h + 0.1, 0] })
    k.cyl(0.07, 0.1, 0.8, SLATE, { p: [0, h + 0.5, 0] }, 6)
    // Dishes pointing different ways, and a small panel antenna.
    for (const [y, a, sz] of [[h * 0.78, 0.9, 1.0], [h * 0.58, 3.4, 0.8], [h * 0.9, -1.9, 0.7]]) {
      k.at({ p: [0, y, 0], r: [0, a, 0] }, () => {
        k.box(0.12, 0.12, 0.9, SLATE, { p: [0, 0, 0.75] })
        k.cyl(sz, 0.12, 0.28, CREAM, { p: [0, 0, 1.3], r: [Math.PI / 2, 0, 0] }, 10)
        k.ball(0.14, GOLD, { p: [0, 0, 1.5] }, 0)
      })
    }
    k.box(0.3, 1.6, 0.18, '#aab4c0', { p: [0.6, h * 0.45, 0.6] })
    k.box(1.1, 1.0, 0.9, '#aab4c0', { p: [2.0, 0.65, 0.3] })
    k.box(1.2, 0.12, 1.0, CORAL, { p: [2.0, 1.2, 0.3] })
  })
}

function house(k, h) {
  k.at({ p: [h.x, 0, h.z], r: [0, h.face, 0] }, () => {
    k.box(4.8, 0.25, 4.2, '#c9a27a', { p: [0, 0.12, 0] })
    k.box(4.4, 2.9, 3.8, h.wall, { p: [0, 1.7, 0] })
    k.roof(5.1, 1.9, 4.6, h.roof, { p: [0, 3.15, 0] })
    k.box(1.0, 1.9, 0.14, WOOD, { p: [-1.1, 1.2, 1.94] })
    k.box(1.4, 1.2, 0.14, '#7fc4d8', { p: [1.1, 1.9, 1.94] })
    k.box(1.6, 0.14, 0.2, CREAM, { p: [1.1, 1.25, 1.98] })
    k.box(0.14, 1.0, 1.2, '#7fc4d8', { p: [2.22, 1.9, 0] })
    // Rooftop antenna with a little yagi and a dish.
    k.cyl(0.06, 0.08, 2.6, SLATE, { p: [1.3, 6.0, -0.2] }, 6)
    for (let i = 0; i < 3; i++) k.box(0.9 - i * 0.2, 0.06, 0.06, SLATE, { p: [1.3, 6.8 - i * 0.45, -0.2], r: [0, 0.5, 0] })
    k.cyl(0.4, 0.06, 0.15, CREAM, { p: [-1.4, 5.0, -0.4], r: [Math.PI / 2.4, 0.4, 0] }, 8)
  })
}

function hut(k) {
  const { x, z } = L.hut
  k.at({ p: [x, 0, z] }, () => {
    k.box(5.4, 0.25, 4.6, '#c9a27a', { p: [0, 0.12, 0] })
    k.box(4.8, 2.7, 4.0, '#fff1dc', { p: [0, 1.6, 0] })
    k.roof(5.5, 1.7, 4.8, TEAL, { p: [0, 2.95, 0] })
    k.box(1.0, 1.9, 0.14, WOOD, { p: [-1.2, 1.2, 2.04] })
    k.box(1.6, 1.2, 0.14, '#7fc4d8', { p: [1.2, 1.8, 2.04] })
    k.box(1.8, 0.14, 0.2, CREAM, { p: [1.2, 1.15, 2.08] })
    k.box(2.0, 0.5, 0.9, WOOD, { p: [1.2, 0.5, 2.5] })
    // Mini mast on the roof.
    k.cyl(0.07, 0.1, 2.2, SLATE, { p: [-1.6, 5.6, -0.6] }, 6)
    k.cyl(0.35, 0.06, 0.14, CREAM, { p: [-1.6, 5.0, -0.1], r: [Math.PI / 2.2, 0, 0] }, 8)
    k.ball(0.14, CORAL, { p: [-1.6, 6.8, -0.6] }, 0)
  })
  // Chart board on two posts.
  const b = L.board
  k.at({ p: [b.x, 0, b.z] }, () => {
    for (const s of [-1, 1]) k.box(0.2, 3.4, 0.2, WOOD, { p: [s * 2.0, 1.7, 0] })
    k.box(4.6, 3.0, 0.2, WOOD, { p: [0, BOARD_Y + 0.3, 0] })
    k.box(4.2, 2.6, 0.12, '#fff6e4', { p: [0, BOARD_Y + 0.3, 0.1] })
    // Grid lines and the axis.
    for (let i = 1; i < 4; i++) k.box(3.7, 0.03, 0.02, '#d9cfb8', { p: [0, 1.65 + i * 0.5, 0.17] })
    k.box(3.8, 0.07, 0.03, SLATE, { p: [0, 1.62, 0.18] })
    k.box(0.07, 2.2, 0.03, SLATE, { p: [-1.9, 2.72, 0.18] })
    k.box(4.6, 0.12, 0.5, WOOD, { p: [0, 1.4, 0.2] })
  })
}

function valley(k, island) {
  const r = rng(77)
  // Road and stream.
  baseRoad(k, island, { color: '#f0d9a6', edge: '#dcbf88', width: 4.6 })
  k.add(ribbonXZ(L.streamPts, 3.6, 0.035), '#e9d9a8')
  k.add(ribbonXZ(L.streamPts, 2.3, 0.06), '#6fc7d9')
  k.add(ribbonXZ(L.streamPts.map(([x, z]) => [x + 0.2, z + 0.1]), 0.5, 0.075), '#bfe9f2')
  for (const [x, z] of [L.streamPts[0], L.streamPts[L.streamPts.length - 1]]) {
    k.disc(2.2, '#e9d9a8', { p: [x, 0.03, z] }, 10)
    k.disc(1.7, '#6fc7d9', { p: [x, 0.065, z] }, 10)
  }
  // Plank bridge over the stream, with paths to the road and the southern houses.
  const bz = L.bridge.z
  const bx = L.bridge.x
  k.box(2.0, 0.16, 4.8, '#c58a54', { p: [bx, 0.17, bz] })
  for (let i = 0; i < 5; i++) k.box(2.1, 0.05, 0.1, WOOD, { p: [bx, 0.27, bz - 1.8 + i * 0.9] })
  for (const sx of [-1, 1]) {
    k.box(0.12, 0.12, 4.8, WOOD, { p: [bx + sx * 0.95, 0.75, bz] })
    for (const sz of [-1, 1]) k.box(0.14, 0.7, 0.14, WOOD, { p: [bx + sx * 0.95, 0.4, bz + sz * 2.2] })
  }
  k.add(ribbonXZ([[bx, roadAt(bx) + 2], [bx, bz - 2.6]], 1.6, 0.045), '#e9d9a8')
  k.add(ribbonXZ([[bx, bz + 2.4], [bx + 2, bz + 5], [L.houses[2].x - 1, L.houses[2].z - 2.8]], 1.6, 0.045), '#e9d9a8')
  for (const h of L.houses.filter((h) => h.z < 0)) k.add(ribbonXZ([[h.x - 1.1, h.z + 3], [h.x - 1.1, roadAt(h.x) - 1.5]], 1.3, 0.045), '#e9d9a8')
  k.add(ribbonXZ([[L.stopSpot[0], L.stopSpot[1] - 2], [L.board.x + 0.5, L.board.z + 3], [L.hut.x - 0.5, L.hut.z + 4]], 1.4, 0.04), '#e9d9a8')

  L.towers.forEach((t) => tower(k, t))
  L.houses.forEach((h) => house(k, h))
  hut(k)

  // Valley walls.
  for (const h of L.hills) {
    const sy = 0.8 + r() * 0.15
    k.ball(h.r, h.c, { p: [h.x, h.r * 0.1, h.z], s: [1, sy, 1], r: [r(), r() * 6, 0] }, 1)
    k.ball(h.r * 0.62, h.c, { p: [h.x + (r() - 0.5) * h.r * 0.6, h.r * 0.55, h.z + (r() - 0.5) * h.r * 0.6], s: [1, 0.85, 1] }, 1)
    if (h.row === 1 && r() < 0.6) k.cone(h.r * 0.4, h.r * 0.9, '#b8a898', { p: [h.x, h.r * 1.05, h.z] }, 5)
    // A few trees on the slopes facing the road.
    const side = -Math.sign(h.z)
    if (r() < 0.5) tree(k, h.x + (r() - 0.5) * 2, h.z + side * h.r * 0.75, 0.8 + r() * 0.3, 1, r, COOL)
  }
  for (const o of L.rocks) {
    k.at({ p: [o.x, 0, o.z], r: [0, o.rot, 0] }, () => {
      k.cyl(o.r * 0.8, o.r, o.r * 1.5, '#b8a898', { p: [0, o.r * 0.7, 0] }, 5)
      k.cone(o.r * 0.7, o.r * 0.9, '#a8978a', { p: [0, o.r * 1.8, 0] }, 5)
      k.ball(o.r * 0.55, '#9a8a7c', { p: [o.r * 1.0, o.r * 0.3, o.r * 0.4] }, 0)
    })
  }

  const keepOut = L.streamPts.map(([x, z]) => ({ x, z, r: 2.4 }))
  keepOut.push({ x: L.stopSpot[0], z: L.stopSpot[1], r: 3 })
  scatter(k, island, r, { trees: 34, cover: 90, kinds: [0, 1, 2], treeColors: COOL, keepOut, bush: ['#62bd7a', '#7cc98a'], patch: '#8bd06c' })
}
const COOL = ['#4f9f68', '#6cbf7e', '#43926a', '#3a9a7d', '#4fae8c', '#62bd94', '#f2a541', '#f6bd60']

// --- Animated parts -------------------------------------------------------------

const RINGS = 3
function Beacons() {
  const lamp = useRef()
  const glow = useRef()
  const rings = useRef()
  const lit = useRef(L.towers.map(() => 0))
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const off = useMemo(() => new THREE.Color('#8a4b3d'), [])
  const on = useMemo(() => new THREE.Color('#ffe066'), [])
  const col = useMemo(() => new THREE.Color(), [])
  const ringGeo = useMemo(() => {
    const g = new THREE.RingGeometry(0.92, 1, 28)
    g.rotateX(-Math.PI / 2)
    return g
  }, [])
  const n = L.towers.length

  useFrame((_, dt) => {
    const s = since(0)
    const rp = rider.pos
    L.towers.forEach((t, i) => {
      const near = Math.hypot(rp.x - t.x, rp.z - t.z) < 12 ? 1 : 0
      const found = s >= 0 ? 1 : 0
      const target = Math.max(near, found)
      lit.current[i] = damp(lit.current[i], target, target > lit.current[i] ? 9 : 2.2, Math.min(dt, 0.1))
      const l = lit.current[i]
      const pulse = 1 + Math.sin(clock.t * 6 + i) * 0.12 * l
      // Beacon lamp and halo.
      dummy.position.set(t.beacon[0], t.beacon[1], t.beacon[2])
      dummy.rotation.set(0, 0, 0)
      dummy.scale.setScalar((0.8 + l * 0.35) * pulse)
      dummy.updateMatrix()
      lamp.current.setMatrixAt(i, dummy.matrix)
      lamp.current.setColorAt(i, col.copy(off).lerp(on, l))
      dummy.scale.setScalar(l * 2.4 * pulse + 0.001)
      dummy.updateMatrix()
      glow.current.setMatrixAt(i, dummy.matrix)
      glow.current.setColorAt(i, col.setRGB(l * 0.45, l * 0.36, l * 0.08))
      // Rings: two that repeat while lit, one that ripples down the valley on the stop.
      for (let j = 0; j < RINGS; j++) {
        let ph
        let a
        if (j < 2) {
          ph = (clock.t * 0.7 + i * 0.37 + j * 0.5) % 1
          a = l * (1 - ph) * 0.9
        } else {
          const local = s - i * 0.4
          ph = local < 0 ? 1 : Math.min(1, local / 1.6)
          a = local < 0 || local > 1.6 ? 0 : (1 - ph) * 1.4
          ph = ph * 1.6
        }
        dummy.position.set(t.beacon[0], j < 2 ? t.beacon[1] - 0.2 : t.beacon[1] - 0.4, t.beacon[2])
        dummy.scale.setScalar(0.5 + ph * 9)
        dummy.updateMatrix()
        rings.current.setMatrixAt(i * RINGS + j, dummy.matrix)
        rings.current.setColorAt(i * RINGS + j, col.setRGB(a, a * 0.82, a * 0.2))
      }
    })
    for (const m of [lamp, glow, rings]) {
      m.current.instanceMatrix.needsUpdate = true
      if (m.current.instanceColor) m.current.instanceColor.needsUpdate = true
    }
  })
  return (
    <>
      <instancedMesh ref={lamp} args={[null, null, n]} frustumCulled={false}>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={glow} args={[null, null, n]} frustumCulled={false}>
        <icosahedronGeometry args={[0.8, 1]} />
        <meshBasicMaterial transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={rings} args={[ringGeo, null, n * RINGS]} frustumCulled={false}>
        <meshBasicMaterial transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </instancedMesh>
    </>
  )
}

// The bar chart grows when the stop is found.
function ChartBars() {
  const bars = useRef([])
  const arrow = useRef()
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), [])
  const tex = useMemo(() => textTexture('Growth', { w: 256, h: 80, size: 56, bg: '#fff6e4', fg: '#22304f' }), [])
  useFrame(() => {
    const s = since(0)
    BARS.forEach((h, i) => {
      const k = s < 0 ? 0 : smooth((s - i * 0.25) / 1.0)
      const bounce = s < 0 ? 0 : Math.sin(Math.min(1, Math.max(0, s - i * 0.25) / 1.0) * Math.PI) * 0.1
      bars.current[i].scale.y = Math.max(0.06, (0.18 + (h - 0.18) * k) * (1 + bounce) * 0.7)
    })
    const k = s < 0 ? 0 : smooth((s - 1.2) / 0.8)
    arrow.current.visible = k > 0.02
    arrow.current.scale.setScalar(k)
    arrow.current.position.y = 4.9 + Math.sin(clock.t * 3) * 0.07
  })
  return (
    <group position={[L.board.x, 0, L.board.z]}>
      {BARS.map((h, i) => (
        <mesh key={i} ref={(m) => (bars.current[i] = m)} geometry={geo} position={[-1.5 + i * 0.75, 1.65, 0.24]} scale={[0.52, 0.1, 0.12]} castShadow>
          <meshStandardMaterial color={BAR_COLORS[i]} roughness={0.6} flatShading />
        </mesh>
      ))}
      <mesh ref={arrow} position={[1.5, 4.9, 0.3]} visible={false}>
        <coneGeometry args={[0.3, 0.5, 4]} />
        <meshBasicMaterial color={TEAL} />
      </mesh>
      <mesh position={[0, 3.55, 0.17]}>
        <planeGeometry args={[1.8, 0.56]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  )
}

export default function SignalValleyScenery({ island }) {
  return (
    <>
      <Static build={(k) => valley(k, island)} />
      <Beacons />
      <ChartBars />
    </>
  )
}
