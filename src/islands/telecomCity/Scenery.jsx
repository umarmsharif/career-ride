// Telecom City scenery: Signal City (rooftops, antennas, a beacon tower) in the west,
// Wallet Bazaar (stalls, toy phones, a small bank) in the east.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Kit, ribbonXZ, rng } from '../../engine/kit.js'
import { baseRoad, scatter, stripes, beam, CREAM, WOOD, NAVY, CORAL, TEAL, GOLD } from '../../engine/props.js'
import { Static, toyMaterial } from '../../engine/IslandParts.jsx'
import { clock, sinceOf, smooth } from '../../engine/state.js'
import L from './layout.js'

const since = sinceOf(4)
const SAND = '#c9a27a'
const WINDOW = '#7fc4d8'
const DARK = '#3b4a63'

const front = (face, d) => [Math.sin(face) * d, Math.cos(face) * d]
const topY = (h) => 0.25 + h.floors * 1.6

// A satellite dish whose face looks along local +z, tilted up a little.
function dish(k, p, yaw, s, color = '#e8eef3') {
  k.at({ p, r: [0, yaw, 0] }, () => {
    k.cone(s, s * 0.55, color, { r: [-Math.PI / 2 - 0.35, 0, 0] }, 9)
    k.cyl(0.05, 0.05, s * 1.1, '#aab4c0', { p: [0, -s * 0.15, -s * 0.2], r: [0.6, 0, 0] }, 5)
  })
}

function mast(k, p, h, color = '#aab4c0') {
  k.at({ p }, () => {
    k.cyl(0.06, 0.08, h, color, { p: [0, h / 2, 0] }, 5)
    for (let i = 0; i < 3; i++) k.box(0.9 - i * 0.2, 0.05, 0.05, color, { p: [0, h * (0.55 + i * 0.16), 0] })
    k.ball(0.1, CORAL, { p: [0, h + 0.05, 0] }, 0)
  })
}

function house(k, h, i) {
  const H = h.floors * 1.6
  k.at({ p: [h.x, 0, h.z], r: [0, h.face, 0] }, () => {
    k.box(4.8, 0.25, 4.4, SAND, { p: [0, 0.125, 0] })
    k.box(4.4, H, 4.0, h.wall, { p: [0, 0.25 + H / 2, 0] })
    k.box(4.9, 0.3, 4.5, h.roof, { p: [0, 0.25 + H + 0.15, 0] })
    const top = 0.25 + H + 0.3
    k.box(1.2, 0.7, 1.0, '#aab4c0', { p: [1.4, top + 0.35, 0.9] })
    mast(k, [-1.4, top, -1.0], 2.2 + (i % 3) * 0.5)
    dish(k, [0.9, top + 0.55, -0.9], 0.3 - i * 0.5, 0.55 + (i % 2) * 0.15)
    // Door and a canopy.
    k.box(0.95, 1.5, 0.12, WOOD, { p: [-1.3, 1.0, 2.03] })
    k.ball(0.07, GOLD, { p: [-1.02, 1.0, 2.12] }, 0)
    k.box(1.4, 0.12, 0.6, h.roof, { p: [-1.3, 1.85, 2.25] })
    // Windows. The top-floor middle one is the animated pane.
    for (let f = 0; f < h.floors; f++) {
      for (const x of [-1.3, 0, 1.3]) {
        if (f === 0 && x === -1.3) continue
        if (f === h.floors - 1 && x === 0) continue
        k.box(0.9, 0.8, 0.08, WINDOW, { p: [x, 0.25 + f * 1.6 + 1.0, 2.02] })
        k.box(1.05, 0.08, 0.12, CREAM, { p: [x, 0.25 + f * 1.6 + 0.58, 2.06] })
      }
    }
    // Side windows.
    for (let f = 0; f < h.floors; f++) k.box(0.08, 0.8, 0.9, WINDOW, { p: [2.22, 0.25 + f * 1.6 + 1.0, 0] })
  })
}

function buildTower(k) {
  k.at({ p: [L.tower.x, 0, L.tower.z] }, () => {
    k.box(3.6, 3, 3.6, TEAL, { p: [0, 1.5, 0] })
    k.box(3.9, 0.3, 3.9, NAVY, { p: [0, 3.1, 0] })
    k.cyl(1.0, 1.7, 12, '#ffe2c4', { p: [0, 9, 0] }, 8)
    for (const y of [5.5, 9, 12.5]) k.cyl(1.18 - (y - 5.5) * 0.04, 1.3 - (y - 5.5) * 0.04, 0.5, CORAL, { p: [0, y, 0] }, 8)
    k.cyl(2.6, 2.1, 0.6, NAVY, { p: [0, 15.2, 0] }, 8)
    k.cyl(1.5, 1.5, 1.3, '#fff1dc', { p: [0, 16.15, 0] }, 8)
    k.cyl(1.55, 1.55, 0.5, WINDOW, { p: [0, 16.2, 0] }, 8)
    k.cone(1.9, 1.7, CORAL, { p: [0, 17.65, 0] }, 8)
    k.cyl(0.1, 0.14, 4, '#aab4c0', { p: [0, 20, 0] }, 5)
    k.box(1.4, 0.07, 0.07, '#aab4c0', { p: [0, 19.2, 0] })
    k.box(0.07, 0.07, 1.4, '#aab4c0', { p: [0, 19.7, 0] })
    // Dishes around the deck, and a few on the shaft.
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.4
      dish(k, [Math.sin(a) * 2.5, 15.75, Math.cos(a) * 2.5], a, 0.7)
    }
    for (let i = 0; i < 3; i++) {
      const a = i * 2.1 + 1
      dish(k, [Math.sin(a) * 1.3, 7.4 + i * 1.4, Math.cos(a) * 1.3], a, 0.5)
    }
  })
}

function clubhouse(k) {
  k.at({ p: [L.clubhouse.x, 0, L.clubhouse.z] }, () => {
    k.box(7.0, 0.25, 5.0, SAND, { p: [0, 0.125, 0] })
    k.box(6.4, 3.4, 4.4, '#fbe6a8', { p: [0, 0.25 + 1.7, 0] })
    k.box(6.9, 0.3, 4.9, '#c9503e', { p: [0, 3.8, 0] })
    k.roof(6.9, 2.2, 5.0, '#e2674a', { p: [0, 3.95, 0] })
    k.box(1.5, 2.3, 0.14, TEAL, { p: [0, 1.4, 2.25] })
    k.ball(0.09, GOLD, { p: [0.5, 1.4, 2.36] }, 0)
    k.box(2.3, 0.16, 0.9, '#c9a27a', { p: [0, 0.34, 2.7] })
    for (const x of [-2.3, 2.3]) {
      k.box(1.3, 1.1, 0.1, WINDOW, { p: [x, 1.9, 2.22] })
      k.box(1.5, 0.1, 0.16, CREAM, { p: [x, 1.3, 2.26] })
    }
    // A gold emblem over the door, and a flag.
    k.cyl(0.55, 0.55, 0.12, GOLD, { p: [0, 3.0, 2.28], r: [Math.PI / 2, 0, 0] }, 10)
    k.cyl(0.05, 0.05, 2.0, '#aab4c0', { p: [-2.9, 5.0, -1.6] }, 5)
    k.box(0.9, 0.5, 0.05, CORAL, { p: [-2.45, 5.75, -1.6] })
    // Plaza for the members.
    k.box(12.5, 0.05, 4.6, '#ecd3a2', { p: [0, 0.03, 6.6] })
    k.box(11.5, 0.06, 3.6, '#f3dcab', { p: [0, 0.04, 6.6] })
  })
}

function bank(k) {
  k.at({ p: [L.bank.x, 0, L.bank.z], r: [0, L.bank.face, 0] }, () => {
    k.box(6.0, 4.6, 5.0, '#fff1dc', { p: [0, 2.3, 0] })
    k.box(6.5, 0.35, 5.5, SAND, { p: [0, 4.78, 0] })
    k.box(1.6, 0.9, 1.6, '#aab4c0', { p: [-1.8, 5.4, -1] })
    k.cyl(0.7, 0.8, 0.5, NAVY, { p: [1.2, 5.2, -0.6] }, 8)
    k.ball(0.7, '#e8c46a', { p: [1.2, 5.55, -0.6] })
    // Steps, columns, portico.
    k.box(6.6, 0.22, 1.6, '#e2c48d', { p: [0, 0.11, 3.3] })
    k.box(6.0, 0.22, 1.0, SAND, { p: [0, 0.33, 3.0] })
    for (const x of [-2.6, -1.55, 1.55, 2.6]) {
      k.cyl(0.3, 0.3, 3.5, CREAM, { p: [x, 2.3, 3.0] }, 8)
      k.box(0.8, 0.2, 0.8, SAND, { p: [x, 0.55, 3.0] })
      k.box(0.8, 0.2, 0.8, SAND, { p: [x, 4.1, 3.0] })
    }
    k.box(6.4, 0.35, 1.4, SAND, { p: [0, 4.35, 3.0] })
    k.roof(1.4, 1.1, 6.4, '#e2674a', { p: [0, 4.52, 3.0], r: [0, Math.PI / 2, 0] })
    k.cyl(0.5, 0.5, 0.1, GOLD, { p: [0, 5.2, 3.72], r: [Math.PI / 2, 0, 0] }, 10)
    // Doorway and side windows.
    k.box(1.9, 2.7, 0.1, '#5a3d2b', { p: [0, 1.35, 2.52] })
    k.box(2.2, 0.15, 0.2, SAND, { p: [0, 2.78, 2.55] })
    for (const s of [-1, 1]) for (const z of [-1, 1]) k.box(0.08, 1.4, 0.9, WINDOW, { p: [s * 3.02, 2.4, z * 1.2] })
  })
}

function stall(k, s, i) {
  k.at({ p: [s.x, 0, s.z], r: [0, s.face, 0] }, () => {
    k.box(3.6, 0.1, 2.8, '#ecd3a2', { p: [0, 0.05, 0.4] })
    k.box(3.0, 1.1, 1.1, '#d9a066', { p: [0, 0.65, 0.5] })
    k.box(3.3, 0.14, 1.4, CREAM, { p: [0, 1.25, 0.5] })
    for (const x of [-1.6, 1.6]) {
      k.box(0.14, 2.9, 0.14, WOOD, { p: [x, 1.5, -0.6] })
      k.box(0.14, 2.3, 0.14, WOOD, { p: [x, 1.2, 1.5] })
    }
    k.box(3.3, 1.7, 0.1, '#fbe6a8', { p: [0, 1.8, -0.7] })
    stripes(k, 3.8, 2.4, s.c, { p: [0, 2.95, -0.75], r: [0.22, 0, 0] }, 6)
    // Shopkeeper behind the counter, holding up a phone.
    k.cyl(0.32, 0.4, 1.0, s.shirt, { p: [0, 0.9, -0.15] }, 8)
    k.ball(0.3, s.skin, { p: [0, 1.7, -0.15] })
    k.box(0.1, 0.3, 0.04, NAVY, { p: [0.5, 1.5, 0.25], r: [0.2, 0, 0.1] })
    // Goods and a tiny pay-by-phone sign.
    const goods = [CORAL, GOLD, '#7cc36a', '#ff8fa3']
    for (let g = 0; g < 4; g++) k.ball(0.2, goods[(g + i) % 4], { p: [-1.1 + g * 0.4, 1.5, 0.55] }, 0)
    k.box(0.55, 0.85, 0.08, NAVY, { p: [1.0, 1.9, 1.07] })
    k.box(0.42, 0.6, 0.04, TEAL, { p: [1.0, 1.92, 1.12] })
    k.box(0.8, 0.8, 0.8, '#d9a066', { p: [-1.9, 0.5, 1.1], r: [0, 0.3, 0] })
    k.ball(0.3, goods[i % 4], { p: [-1.9, 1.1, 1.1] })
  })
}

function phoneStand(k, p, i) {
  k.at({ p: [p.x, 0, p.z], r: [0, Math.PI, 0] }, () => {
    k.cyl(0.95, 1.05, 0.25, '#d9a066', { p: [0, 0.125, 0] }, 10)
    k.cyl(0.13, 0.17, 1.3, WOOD, { p: [0, 0.85, 0] }, 6)
    k.box(1.2, 0.18, 0.5, WOOD, { p: [0, 1.5, 0] })
    k.box(1.75, 2.75, 0.3, p.c, { p: [0, 2.9, 0] })
    k.box(1.5, 2.05, 0.06, NAVY, { p: [0, 3.0, 0.15] })
    k.box(0.5, 0.07, 0.07, '#22304f', { p: [0, 4.1, 0.17] })
    k.cyl(0.14, 0.14, 0.06, CREAM, { p: [0, 1.82, 0.16], r: [Math.PI / 2, 0, 0] }, 8)
  })
}

function podium(k) {
  k.at({ p: [L.podium.x, 0, L.podium.z], r: [0, L.podium.face, 0] }, () => {
    k.box(5.8, 0.2, 2.2, '#ecd3a2', { p: [0, 0.1, 0] })
    k.box(1.6, 1.4, 1.5, GOLD, { p: [0, 0.9, 0] })
    k.box(1.6, 0.95, 1.5, '#cfd8e3', { p: [-1.7, 0.675, 0] })
    k.box(1.6, 0.65, 1.5, '#d9824a', { p: [1.7, 0.525, 0] })
    for (const [x, c] of [[-1.7, '#aab4c0'], [0, '#c98a1f'], [1.7, '#b0623a']]) k.ball(0.22, c, { p: [x, 0.6, 0.78] }, 0)
    // Bunting behind.
    k.box(0.12, 3.4, 0.12, WOOD, { p: [-2.7, 1.7, -0.9] })
    k.box(0.12, 3.4, 0.12, WOOD, { p: [2.7, 1.7, -0.9] })
    const cols = [CORAL, GOLD, TEAL, '#ff8fa3', CORAL, GOLD]
    for (let i = 0; i < 6; i++) {
      const x = -2.2 + i * 0.88
      k.cone(0.26, 0.5, cols[i], { p: [x, 3.1 - Math.sin((i / 5) * Math.PI) * -0.25 - 0.45, -0.9], r: [Math.PI, 0, 0] }, 3)
    }
    beam(k, [-2.7, 3.35, -0.9], [2.7, 3.35, -0.9], 0.04, NAVY)
  })
}

function buildTown(k) {
  const r = rng(2012)
  baseRoad(k, { road: L.road }, { width: 5.2 })

  // Paving: the bazaar rows and the tower square.
  k.add(ribbonXZ([[5, -8], [16, -8.6], [27, -8.2], [41, -6.6]], 4.2, 0.04), '#ecd3a2')
  k.add(ribbonXZ([[3, 8.4], [12, 8.4], [22, 8.6], [34, 8.4], [42, 7.6]], 4.6, 0.04), '#ecd3a2')
  k.disc(5.2, '#ecd3a2', { p: [L.tower.x, 0.04, L.tower.z] }, 10)
  k.disc(3.8, '#f3dcab', { p: [L.tower.x, 0.06, L.tower.z] }, 10)

  L.houses.forEach((h, i) => house(k, h, i))
  buildTower(k)
  clubhouse(k)
  bank(k)
  L.stalls.forEach((s, i) => stall(k, s, i))
  L.phones.forEach((p, i) => phoneStand(k, p, i))
  podium(k)

  // A few lamp posts along the bazaar road.
  for (const [x, z] of [[6.5, 5.2], [18, 5.6], [29.5, 5.4], [41, 4.8]]) {
    k.cyl(0.08, 0.12, 3.6, NAVY, { p: [x, 1.8, z] }, 6)
    k.ball(0.28, '#ffd98a', { p: [x, 3.8, z] })
  }

  const keepOut = [
    { x: -18.5, z: -8.5, r: 6 },
    { x: 11, z: -9, r: 4 }, { x: 26, z: -9, r: 5 }, { x: 38, z: -7.5, r: 4 },
    { x: 8, z: 8.5, r: 4 }, { x: 20, z: 9, r: 6 }, { x: 31, z: 9, r: 6 }, { x: 41, z: 8, r: 4 },
    { x: L.tower.x, z: L.tower.z, r: 6 },
  ]
  scatter(k, { ...ISLAND_REF.current }, r, { trees: 34, cover: 90, keepOut, flowers: [CORAL, CREAM, GOLD, '#ff8fa3'] })
}
const ISLAND_REF = { current: null }

// --- Parts that react to pickups ------------------------------------------------

// Pickup 0: offers fly from the tower to individual houses and their windows light up.
function Offers({ island }) {
  const panes = useRef([])
  const env = useRef()
  const beacon = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const dark = useMemo(() => new THREE.Color(DARK), [])
  const lit = useMemo(() => new THREE.Color('#ffd98a'), [])
  const geo = useMemo(() => {
    const k = new Kit()
    k.box(0.8, 0.5, 0.1, CREAM)
    k.box(0.82, 0.12, 0.12, CORAL, { p: [0, 0.1, 0] })
    k.ball(0.1, GOLD, { p: [0, -0.05, 0.08] }, 0)
    return k.build()
  }, [])
  const targets = useMemo(
    () =>
      L.houses.map((h) => {
        const [fx, fz] = front(h.face, 2.2)
        const gy = island.h(h.x, h.z)
        return { pane: [h.x + fx, gy + topY(h) - 0.8, h.z + fz], hit: [h.x + fx * 1.3, gy + topY(h) - 0.8, h.z + fz * 1.3] }
      }),
    [island]
  )
  const src = [L.tower.x, 16.2 + island.h(L.tower.x, L.tower.z), L.tower.z]
  useFrame(() => {
    const s = since(0)
    L.houses.forEach((h, i) => {
      const k = s < 0 ? 0 : smooth((s - (i * 0.55 + 1.2)) / 0.35)
      panes.current[i].material.color.copy(dark).lerp(lit, k)
      const local = s - i * 0.55
      const m = dummy
      const cyc = local < 0 ? -1 : local % 6
      if (s < 0 || cyc < 0 || cyc > 1.7) {
        m.scale.setScalar(0.0001)
      } else {
        const u = Math.min(1, cyc / 1.3)
        const t = targets[i].hit
        m.position.set(src[0] + (t[0] - src[0]) * u, src[1] + (t[1] - src[1]) * u + Math.sin(u * Math.PI) * 4, src[2] + (t[2] - src[2]) * u)
        m.rotation.set(0, Math.atan2(t[0] - src[0], t[2] - src[2]), Math.sin(clock.t * 8 + i) * 0.4)
        m.scale.setScalar(Math.min(1, (1.7 - cyc) * 4) * 1.4)
      }
      m.updateMatrix()
      env.current.setMatrixAt(i, m.matrix)
    })
    env.current.instanceMatrix.needsUpdate = true
    const pulse = 0.6 + 0.4 * Math.sin(clock.t * 4)
    beacon.current.scale.setScalar((s < 0 ? 0.55 : 0.8) * (0.8 + pulse * 0.5))
    beacon.current.material.color.set(s < 0 ? '#ff9f1c' : pulse > 0.7 ? '#fff1a8' : '#ffb347')
  })
  return (
    <>
      {L.houses.map((h, i) => {
        const [fx, fz] = front(h.face, 2.07)
        return (
          <mesh key={i} ref={(m) => (panes.current[i] = m)} position={[h.x + fx, topY(h) - 0.8, h.z + fz]} rotation={[0, h.face, 0]}>
            <boxGeometry args={[1.0, 0.9, 0.08]} />
            <meshBasicMaterial color={DARK} toneMapped={false} />
          </mesh>
        )
      })}
      <instancedMesh ref={env} args={[geo, toyMaterial, L.houses.length]} frustumCulled={false} castShadow />
      <mesh ref={beacon} position={[L.tower.x, 22.3, L.tower.z]}>
        <icosahedronGeometry args={[0.75, 1]} />
        <meshBasicMaterial color="#ff9f1c" toneMapped={false} />
      </mesh>
    </>
  )
}

// Pickup 1: gold stars rise over the clubhouse and ten small pegs pop up beside it.
function Loyalty() {
  const stars = useRef([])
  const pegs = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const starGeo = useMemo(() => {
    const sh = new THREE.Shape()
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2
      const rad = i % 2 ? 0.28 : 0.62
      sh[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rad, Math.sin(a) * rad)
    }
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.2, bevelEnabled: false })
    g.translate(0, 0, -0.1)
    return g
  }, [])
  const pegGeo = useMemo(() => {
    const k = new Kit()
    k.cyl(0.22, 0.32, 0.8, '#ffffff', { p: [0, 0.4, 0] }, 8)
    k.ball(0.27, '#ffffff', { p: [0, 1.05, 0] })
    return k.build()
  }, [])
  const colors = useMemo(() => ['#f0553f', '#1f9d8f', '#f2a541', '#ff8fa3', '#6fa8dc'].map((c) => new THREE.Color(c)), [])
  useFrame(() => {
    const s = since(1)
    for (let i = 0; i < 5; i++) {
      const m = stars.current[i]
      const k = s < 0 ? 0 : smooth((s - 0.2 - i * 0.25) / 0.9)
      m.visible = k > 0.01
      m.position.set(L.clubhouse.x + (i - 2) * 1.5, 5.0 + k * 3.0 + Math.sin(clock.t * 2 + i) * 0.1 * k, L.clubhouse.z)
      m.rotation.y = Math.sin(clock.t * 1.5 + i) * 0.5
      m.scale.setScalar(Math.max(0.001, k) * (1 + Math.sin(Math.min(1, k) * Math.PI) * 0.25))
    }
    for (let i = 0; i < 10; i++) {
      const k = s < 0 ? 0 : (s - 1.6 - i * 0.13) / 0.5
      const sc = k <= 0 ? 0.0001 : smooth(k) * (1 + Math.sin(Math.min(1, k) * Math.PI) * 0.25)
      dummy.position.set(L.clubhouse.x - 4.7 + i * 1.04, k > 1 ? Math.abs(Math.sin(clock.t * 2.2 + i * 0.7)) * 0.12 : 0, L.clubhouse.z + 4.9)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.setScalar(sc)
      dummy.updateMatrix()
      pegs.current.setMatrixAt(i, dummy.matrix)
      pegs.current.setColorAt(i, colors[i % 5])
    }
    pegs.current.instanceMatrix.needsUpdate = true
    if (pegs.current.instanceColor) pegs.current.instanceColor.needsUpdate = true
  })
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} ref={(m) => (stars.current[i] = m)} geometry={starGeo} visible={false} castShadow>
          <meshStandardMaterial color="#ffc93c" emissive="#ffb000" emissiveIntensity={0.45} roughness={0.5} flatShading />
        </mesh>
      ))}
      <instancedMesh ref={pegs} args={[pegGeo, toyMaterial, 10]} frustumCulled={false} castShadow />
    </>
  )
}

// Pickup 2: the bank's doors swing open and a stack of coins grows on its steps.
function BankDoors() {
  const left = useRef()
  const right = useRef()
  const coins = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const leafL = useMemo(() => {
    const k = new Kit()
    k.box(0.9, 2.5, 0.1, TEAL, { p: [0.45, 1.25, 0] })
    k.box(0.5, 0.9, 0.04, '#ffd98a', { p: [0.45, 1.7, 0.06] })
    k.ball(0.07, GOLD, { p: [0.78, 1.2, 0.09] }, 0)
    return k.build()
  }, [])
  const leafR = useMemo(() => {
    const k = new Kit()
    k.box(0.9, 2.5, 0.1, TEAL, { p: [-0.45, 1.25, 0] })
    k.box(0.5, 0.9, 0.04, '#ffd98a', { p: [-0.45, 1.7, 0.06] })
    k.ball(0.07, GOLD, { p: [-0.78, 1.2, 0.09] }, 0)
    return k.build()
  }, [])
  const stacks = [[-2.1, 3.8, 7], [-0.2, 3.85, 9], [1.9, 3.8, 6]]
  const total = stacks.reduce((n, s) => n + s[2], 0)
  useFrame(() => {
    const s = since(2)
    const open = s < 0 ? 0 : smooth(s / 1.0)
    const a = open * (1.75 + Math.sin(Math.min(1, open) * Math.PI) * 0.12)
    left.current.rotation.y = -a
    right.current.rotation.y = a
    let n = 0
    stacks.forEach(([x, z, count]) => {
      for (let j = 0; j < count; j++) {
        const k = s < 0 ? 0 : (s - 1.0 - (n % 9) * 0.0 - (j * 3 + n) * 0.09) / 0.3
        const sc = k <= 0 ? 0.0001 : Math.min(1, k)
        dummy.position.set(x, 0.22 + 0.07 + j * 0.15 + (k > 0 && k < 1 ? (1 - k) * 1.2 : 0), z)
        dummy.rotation.set(0, j * 0.7, 0)
        dummy.scale.setScalar(sc)
        dummy.updateMatrix()
        coins.current.setMatrixAt(n, dummy.matrix)
        n++
      }
    })
    coins.current.instanceMatrix.needsUpdate = true
  })
  return (
    <group position={[L.bank.x, 0, L.bank.z]} rotation={[0, L.bank.face, 0]}>
      <group ref={left} position={[-0.9, 0, 2.58]}>
        <mesh geometry={leafL} material={toyMaterial} castShadow />
      </group>
      <group ref={right} position={[0.9, 0, 2.58]}>
        <mesh geometry={leafR} material={toyMaterial} castShadow />
      </group>
      <instancedMesh ref={coins} args={[null, null, total]} frustumCulled={false} castShadow>
        <cylinderGeometry args={[0.46, 0.46, 0.13, 12]} />
        <meshStandardMaterial color="#ffc93c" emissive="#ffb000" emissiveIntensity={0.3} roughness={0.4} flatShading />
      </instancedMesh>
    </group>
  )
}

// Pickup 3: coins hop from stall to stall along the bazaar in a chain.
function CoinChain({ island }) {
  const coins = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const path = useMemo(() => L.stalls.map((s) => [s.x, 1.95 + island.h(s.x, s.z), s.z + Math.cos(s.face) * 0.5]), [island])
  const N = path.length
  const COINS = 4
  useFrame(() => {
    const s = since(3)
    for (let c = 0; c < COINS; c++) {
      const u = (s - c * 0.9) / 1.0
      if (s < 0 || u < 0) {
        dummy.scale.setScalar(0.0001)
      } else {
        const t = u % (2 * (N - 1))
        const seg = t < N - 1 ? t : 2 * (N - 1) - t
        const i = Math.min(N - 2, Math.floor(seg))
        const f = seg - i
        const a = path[i]
        const b = path[i + 1]
        dummy.position.set(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f + Math.sin(f * Math.PI) * 2.6, a[2] + (b[2] - a[2]) * f)
        dummy.rotation.set(0, clock.t * 6 + c, Math.PI / 2)
        dummy.scale.setScalar(Math.min(1, u * 3))
      }
      dummy.updateMatrix()
      coins.current.setMatrixAt(c, dummy.matrix)
    }
    coins.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={coins} args={[null, null, COINS]} frustumCulled={false} castShadow>
      <cylinderGeometry args={[0.45, 0.45, 0.14, 12]} />
      <meshStandardMaterial color="#ffc93c" emissive="#ffb000" emissiveIntensity={0.4} roughness={0.4} flatShading />
    </instancedMesh>
  )
}

// Pickup 4: eight phones, 96 tiles. About 17% (16 tiles) light up, then it grows to 25% (24 tiles).
function PhoneTiles({ island }) {
  const mesh = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const dark = useMemo(() => new THREE.Color('#34456a'), [])
  const teal = useMemo(() => new THREE.Color('#5be3c1'), [])
  const gold = useMemo(() => new THREE.Color('#ffd35c'), [])
  const col = useMemo(() => new THREE.Color(), [])
  const tiles = useMemo(() => {
    const r = rng(417)
    const out = []
    L.phones.forEach((p, pi) => {
      const order = [...Array(12).keys()].sort(() => r() - 0.5)
      for (let j = 0; j < 12; j++) {
        const col_ = j % 3
        const row = Math.floor(j / 3)
        const rank = order.indexOf(j)
        out.push({
          pos: [p.x - (col_ - 1) * 0.46, island.h(p.x, p.z) + 3.0 + 0.1 + (1.5 - row) * 0.46 - 0.0, p.z - 0.23],
          stage: rank < 2 ? 1 : rank === 2 ? 2 : 0,
          order: pi * 2 + rank,
        })
      }
    })
    return out
  }, [island])
  useFrame(() => {
    const s = since(4)
    tiles.forEach((t, i) => {
      let k = 0
      let target = teal
      if (t.stage === 1) k = s < 0 ? 0 : smooth((s - 0.2 - t.order * 0.12) / 0.3)
      else if (t.stage === 2) {
        k = s < 0 ? 0 : smooth((s - 3.6 - t.order * 0.15) / 0.3)
        target = gold
      }
      dummy.position.set(t.pos[0], t.pos[1], t.pos[2])
      dummy.rotation.set(0, 0, 0)
      dummy.scale.setScalar(1 + Math.sin(k * Math.PI) * 0.3)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
      mesh.current.setColorAt(i, col.copy(dark).lerp(target, k))
    })
    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
  })
  return (
    <instancedMesh ref={mesh} args={[null, null, tiles.length]} frustumCulled={false}>
      <boxGeometry args={[0.36, 0.36, 0.05]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}

// Pickup 5: three trophies rise from the podium.
function Trophies() {
  const cups = useRef([])
  const defs = useMemo(
    () => [
      { x: -1.7, top: 1.15, c: '#cfd8e3', d: 0.5 },
      { x: 0, top: 1.6, c: '#ffc93c', d: 0 },
      { x: 1.7, top: 0.85, c: '#d9824a', d: 1.0 },
    ],
    []
  )
  const geos = useMemo(
    () =>
      defs.map((d) => {
        const k = new Kit()
        k.box(0.7, 0.16, 0.7, NAVY, { p: [0, 0.08, 0] })
        k.cyl(0.1, 0.14, 0.5, d.c, { p: [0, 0.4, 0] }, 6)
        k.cyl(0.52, 0.22, 0.75, d.c, { p: [0, 1.0, 0] }, 10)
        for (const s of [-1, 1]) k.ball(0.2, d.c, { p: [s * 0.58, 1.05, 0], s: [0.6, 1, 0.6] }, 0)
        k.ball(0.18, '#ffffff', { p: [0, 1.5, 0] }, 0)
        return k.build()
      }),
    [defs]
  )
  useFrame(() => {
    const s = since(5)
    defs.forEach((d, i) => {
      const m = cups.current[i]
      const k = s < 0 ? 0 : smooth((s - 0.2 - d.d) / 1.0)
      m.visible = k > 0.01
      m.position.y = d.top - 1.6 + k * 1.6 + (k >= 1 ? Math.sin(clock.t * 2 + i) * 0.05 : 0)
      m.rotation.y = k >= 1 ? clock.t * 1.2 + i : k * 6
      m.scale.setScalar(Math.max(0.001, k) * 1.1)
    })
  })
  return (
    <group position={[L.podium.x, 0, L.podium.z]} rotation={[0, L.podium.face, 0]}>
      {defs.map((d, i) => (
        <group key={i} position={[d.x, 0, 0]}>
          <mesh ref={(m) => (cups.current[i] = m)} geometry={geos[i]} material={toyMaterial} visible={false} castShadow />
        </group>
      ))}
    </group>
  )
}

export default function TelecomCityScenery({ island }) {
  ISLAND_REF.current = island
  return (
    <>
      <Static build={buildTown} />
      <Offers island={island} />
      <Loyalty />
      <BankDoors />
      <CoinChain island={island} />
      <PhoneTiles island={island} />
      <Trophies />
    </>
  )
}
