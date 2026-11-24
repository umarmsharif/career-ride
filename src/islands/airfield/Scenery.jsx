// The Airfield: a toy airfield ringed by eighteen plain flags.
// Static props go into one merged mesh; only parts that move get their own mesh.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Kit, ribbonXZ, rng, textTexture } from '../../engine/kit.js'
import { scatter, CREAM, WOOD, SLATE, CORAL, TEAL, GOLD } from '../../engine/props.js'
import { Static, toyMaterial } from '../../engine/IslandParts.jsx'
import { clock, sinceOf, smooth } from '../../engine/state.js'
import L from './layout.js'

const since = sinceOf(7)

const TARMAC = '#4b4a5e'
const SHOULDER = '#6d6a7e'
const APRON = '#5f5c74'
const LINE = '#ffe08a'
const GLASS = '#9ad7ea'
const NAVY = '#22304f'

// --- geometry helpers ------------------------------------------------------------

const forkCurves = L.forks.map((f) => new THREE.CatmullRomCurve3(f.pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal'))

// Point beside a fork road: u along it, `side` metres to the left of travel.
function forkAt(fi, u, side = 0) {
  const c = forkCurves[fi]
  const p = c.getPointAt(u)
  const t = c.getTangentAt(u)
  return { x: p.x + t.z * side, z: p.z - t.x * side, tx: t.x, tz: t.z }
}

// Seedling pots: four stations along each fork, one pot each side.
const POTS = []
L.forks.forEach((_, fi) => {
  ;[0.36, 0.48, 0.6, 0.72].forEach((u, j) => {
    ;[2.4, -2.4].forEach((side, si) => {
      const p = forkAt(fi, u, side)
      POTS.push({ x: p.x, z: p.z, order: (fi * 4 + j) * 0.16 + si * 0.08, tint: (fi + j + si) % 3 })
    })
  })
})

function archShape(w, h0) {
  const s = new THREE.Shape()
  s.moveTo(-w / 2, 0)
  s.lineTo(w / 2, 0)
  s.lineTo(w / 2, h0)
  s.absarc(0, h0, w / 2, 0, Math.PI, false)
  s.lineTo(-w / 2, 0)
  return s
}
function archGeo(w, h0, depth) {
  const g = new THREE.ExtrudeGeometry(archShape(w, h0), { depth, bevelEnabled: false, curveSegments: 10 })
  g.translate(0, 0, -depth / 2)
  return g
}

// A toy propeller plane, nose toward local +z, wheels on y = 0. No propeller (that spins).
function planeBody(k, body, accent) {
  k.cyl(0.5, 0.28, 3.4, body, { p: [0, 1.15, 0], r: [Math.PI / 2, 0, 0] }, 8)
  k.cyl(0.54, 0.54, 0.5, accent, { p: [0, 1.15, 1.75], r: [Math.PI / 2, 0, 0] }, 8)
  k.cone(0.24, 0.45, accent, { p: [0, 1.15, 2.22], r: [Math.PI / 2, 0, 0] }, 8)
  k.box(6.6, 0.14, 1.3, body, { p: [0, 1.3, 0.25] })
  for (const s of [1, -1]) k.box(1.1, 0.16, 1.32, accent, { p: [s * 2.78, 1.3, 0.25] })
  k.box(2.4, 0.1, 0.7, body, { p: [0, 1.25, -1.55] })
  for (const s of [1, -1]) k.box(0.5, 0.12, 0.72, accent, { p: [s * 1.0, 1.25, -1.55] })
  k.box(0.1, 0.95, 0.8, accent, { p: [0, 1.7, -1.5] })
  k.ball(0.4, GLASS, { p: [0, 1.58, 0.35], s: [0.95, 0.8, 1.5] })
  for (const s of [1, -1]) {
    k.cyl(0.28, 0.28, 0.14, SLATE, { p: [s * 0.85, 0.28, 0.5], r: [0, 0, Math.PI / 2] }, 8)
    k.box(0.08, 0.75, 0.1, SLATE, { p: [s * 0.75, 0.65, 0.5], r: [0, 0, s * 0.25] })
  }
  k.ball(0.14, SLATE, { p: [0, 0.2, -1.6] }, 0)
}

const propGeo = (() => {
  const k = new Kit()
  k.box(0.22, 2.3, 0.05, NAVY)
  k.box(0.05, 0.22, 0.04, GOLD, { p: [0, 1.0, 0.02] })
  k.ball(0.14, GOLD, { p: [0, 0, 0.05] }, 0)
  return k.build()
})()

function cart(k, x, z, ry) {
  k.at({ p: [x, 0, z], r: [0, ry, 0] }, () => {
    // Tug.
    k.box(1.5, 0.7, 0.95, CORAL, { p: [0, 0.55, 0] })
    k.box(0.8, 0.7, 0.9, CREAM, { p: [-0.25, 1.15, 0] })
    k.box(0.9, 0.1, 1.0, SLATE, { p: [-0.25, 1.55, 0] })
    for (const sx of [-0.5, 0.5]) for (const sz of [-0.5, 0.5]) k.cyl(0.22, 0.22, 0.14, SLATE, { p: [sx, 0.22, sz], r: [Math.PI / 2, 0, 0] }, 8)
    // Three trailers with luggage.
    ;['#f2a541', '#1f9d8f', '#e2674a'].forEach((c, i) => {
      const ox = 2.1 + i * 2.2
      k.box(0.9, 0.06, 0.06, SLATE, { p: [ox - 1.4, 0.35, 0] })
      k.box(1.7, 0.14, 1.1, c, { p: [ox, 0.42, 0] })
      for (const sx of [-0.55, 0.55]) for (const sz of [-0.5, 0.5]) k.cyl(0.2, 0.2, 0.12, SLATE, { p: [ox + sx, 0.2, sz], r: [Math.PI / 2, 0, 0] }, 8)
      k.box(0.6, 0.45, 0.5, '#c9a27a', { p: [ox - 0.3, 0.72, 0.1], r: [0, 0.2, 0] })
      k.box(0.5, 0.35, 0.45, '#8e6bc9', { p: [ox + 0.4, 0.67, -0.15], r: [0, -0.3, 0] })
      if (i !== 1) k.box(0.4, 0.3, 0.4, '#e8648b', { p: [ox + 0.1, 1.05, 0.05], r: [0, 0.5, 0] })
    })
  })
}

// --- the static island -----------------------------------------------------------

function buildAirfield(k, island) {
  const r = rng(707)

  // Runway: tarmac, shoulders, edge stripes, centre dashes and threshold keys.
  k.add(ribbonXZ(L.road, 8.6, 0.03), SHOULDER)
  k.add(ribbonXZ(L.road, 7.4, 0.05), TARMAC)
  for (const s of [1, -1]) k.box(86, 0.02, 0.2, CREAM, { p: [0, 0.065, s * 3.3] })
  for (let x = -32; x <= 33; x += 5) k.box(2.4, 0.02, 0.24, CREAM, { p: [x, 0.065, 0] })
  for (const [cx, dir] of [[-35.4, 1], [36, -1]]) {
    for (let i = 0; i < 8; i++) {
      const z = -2.45 + i * 0.7
      if (Math.abs(z) < 0.2) continue
      k.box(2.4, 0.02, 0.36, CREAM, { p: [cx + dir * 0.2, 0.065, z] })
    }
  }
  // Big aiming blocks.
  for (const x of [-18, 20]) for (const s of [1, -1]) k.box(3.6, 0.02, 0.8, CREAM, { p: [x, 0.065, s * 1.7] })

  // Aprons: hangar forecourt, parking pad and a link to the runway.
  k.box(L.apron.w, 0.04, L.apron.d, APRON, { p: [L.apron.x, 0.02, L.apron.z] })
  k.box(L.apron.w + 0.8, 0.03, L.apron.d + 0.8, SHOULDER, { p: [L.apron.x, 0.015, L.apron.z] })
  k.box(4.5, 0.045, 3.2, APRON, { p: [-8.5, 0.022, 5.0] })
  k.add(new THREE.CircleGeometry(6.6, 18).rotateX(-Math.PI / 2), SHOULDER, { p: [35, 0.015, 9.5] })
  k.add(new THREE.CircleGeometry(6.0, 18).rotateX(-Math.PI / 2), APRON, { p: [35, 0.025, 9.5] })
  k.box(4.5, 0.045, 3.6, APRON, { p: [31, 0.022, 5.4] })
  for (const p of L.parked) k.add(new THREE.RingGeometry(3.6, 3.8, 20).rotateX(-Math.PI / 2), LINE, { p: [p.x, 0.06, p.z] })

  // Taxiways, their centre dashes, gate pads and gates.
  L.forks.forEach((f, fi) => {
    k.add(ribbonXZ(f.pts, 4.4, 0.032), SHOULDER)
    k.add(ribbonXZ(f.pts, 3.4, 0.058), TARMAC)
    for (let u = 0.34; u < 0.9; u += 0.07) {
      const p = forkAt(fi, u)
      k.box(0.16, 0.02, 0.7, LINE, { p: [p.x, 0.08, p.z], r: [0, Math.atan2(p.tx, p.tz), 0] })
    }
    const e = forkAt(fi, 1)
    k.disc(2.9, SHOULDER, { p: [e.x, 0.034, e.z] }, 16)
    k.disc(2.5, f.color, { p: [e.x, 0.06, e.z] }, 16)
    k.disc(2.0, TARMAC, { p: [e.x, 0.07, e.z] }, 16)
    // Arch over the road.
    const a = forkAt(fi, 0.8)
    k.at({ p: [a.x, 0, a.z], r: [0, Math.atan2(a.tx, a.tz) + Math.PI / 2, 0] }, () => {
      for (const s of [1, -1]) {
        k.cyl(0.16, 0.2, 3.5, CREAM, { p: [s * 2.4, 1.75, 0] }, 6)
        k.ball(0.3, f.color, { p: [s * 2.4, 3.6, 0] })
      }
      k.box(5.4, 0.55, 0.4, f.color, { p: [0, 3.35, 0] })
      for (let i = 0; i < 5; i++) k.cone(0.24, 0.5, i % 2 ? CREAM : f.color, { p: [-1.8 + i * 0.9, 2.8, 0], r: [Math.PI, 0, 0] }, 3)
    })
    // Little gate house beside the pad.
    const b = forkAt(fi, 0.95, f.house)
    k.at({ p: [b.x, 0, b.z], r: [0, Math.atan2(b.tx, b.tz) + Math.PI / 2 + Math.PI, 0] }, () => {
      k.box(2.2, 0.25, 2.0, '#c9a27a', { p: [0, 0.12, 0] })
      k.box(1.9, 1.5, 1.7, CREAM, { p: [0, 1.0, 0] })
      k.box(2.5, 0.2, 2.3, f.color, { p: [0, 1.85, 0] })
      k.box(0.6, 0.6, 0.12, GLASS, { p: [0, 1.2, 0.88] })
      k.box(0.5, 1.0, 0.12, WOOD, { p: [0.55, 0.75, 0.88] })
    })
  })

  // Control tower.
  k.at({ p: [L.tower.x, 0, L.tower.z] }, () => {
    k.box(5.0, 0.5, 5.0, '#c9a27a', { p: [0, 0.25, 0] })
    k.cyl(1.35, 1.7, 9.4, CREAM, { p: [0, 5.2, 0] }, 8)
    k.cyl(1.45, 1.5, 0.5, CORAL, { p: [0, 3.2, 0] }, 8)
    k.cyl(1.4, 1.45, 0.5, CORAL, { p: [0, 6.6, 0] }, 8)
    k.box(0.5, 1.4, 0.12, '#3b4a63', { p: [0, 1.2, 1.6] })
    k.cyl(2.9, 2.2, 0.8, CORAL, { p: [0, 10.3, 0] }, 8)
    k.cyl(2.55, 2.55, 1.6, GLASS, { p: [0, 11.5, 0] }, 8)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8
      k.box(0.16, 1.7, 0.16, CREAM, { p: [Math.sin(a) * 2.56, 11.5, Math.cos(a) * 2.56] })
    }
    k.cyl(3.1, 3.1, 0.35, CORAL, { p: [0, 12.5, 0] }, 8)
    k.cone(2.4, 1.0, CREAM, { p: [0, 13.2, 0] }, 8)
    k.cyl(0.1, 0.1, 3.6, SLATE, { p: [0, 14.8, 0] }, 6)
    // A railing and desk inside the cab.
    k.box(1.4, 0.7, 0.6, '#c9a27a', { p: [0, 10.9, 0.3] })
  })

  // Hangar: an arched shed with ribs and a big dark door.
  k.at({ p: [L.hangar.x, 0, L.hangar.z], r: [0, Math.PI, 0] }, () => {
    k.box(12.2, 0.3, 10.2, '#c9a27a', { p: [0, 0.15, 0] })
    k.add(archGeo(11, 2.4, 9), '#ffe2c4', { p: [0, 0.3, 0] })
    for (let i = 0; i < 6; i++) k.add(archGeo(11.3, 2.4, 0.35).scale(1, 1.0, 1), CORAL, { p: [0, 0.28, -4 + i * 1.6] })
    k.add(archGeo(8.2, 1.6, 0.3), '#3b4a63', { p: [0, 0.3, 4.55] })
    k.add(archGeo(9.0, 1.9, 0.18), CREAM, { p: [0, 0.3, 4.52] })
    k.add(archGeo(8.2, 1.6, 0.3), '#3b4a63', { p: [0, 0.3, 4.62] })
    k.box(7.6, 0.14, 0.1, SLATE, { p: [0, 3.6, 4.82] })
    k.box(0.12, 3.6, 0.1, SLATE, { p: [0, 2.1, 4.82] })
    k.box(2.6, 0.9, 0.2, TEAL, { p: [-5.4, 0.9, 4.7] })
  })

  // Windsock pole.
  k.cyl(0.09, 0.14, 5.6, CREAM, { p: [L.windsock.x, 2.8, L.windsock.z] }, 6)
  k.ball(0.2, CORAL, { p: [L.windsock.x, 5.7, L.windsock.z] })
  k.cyl(0.5, 0.6, 0.3, '#c9a27a', { p: [L.windsock.x, 0.15, L.windsock.z] }, 8)

  // Luggage carts.
  L.carts.forEach((c) => cart(k, c.x, c.z, c.ry))
  // A few loose cases beside the hangar door.
  ;[[-14.2, 6.5, 0.3, '#e2674a'], [-13.4, 6.7, -0.4, '#1f9d8f'], [-14.0, 6.0, 0.9, '#f2a541']].forEach(([x, z, ry, c]) => k.box(0.7, 0.5, 0.45, c, { p: [x, 0.3, z], r: [0, ry, 0] }))

  // Runway light poles (the glowing bulbs are animated).
  for (const s of [1, -1]) for (let x = -39; x <= 41; x += 4) k.cyl(0.05, 0.08, 0.5, SLATE, { p: [x, 0.25, s * 4.7] }, 5)

  // Flag poles.
  L.flags.forEach((f) => {
    k.cyl(0.09, 0.13, 6.7, CREAM, { p: [f.x, 3.35, f.z] }, 6)
    k.ball(0.2, GOLD, { p: [f.x, 6.8, f.z] }, 0)
    k.cyl(0.4, 0.5, 0.25, '#c9a27a', { p: [f.x, 0.12, f.z] }, 7)
  })

  // Dial sign: posts, board, face, coloured ticks.
  k.at({ p: [L.dial.x, 0, L.dial.z], r: [0, L.dial.face, 0] }, () => {
    for (const s of [1, -1]) k.cyl(0.17, 0.21, 2.4, WOOD, { p: [s * 2.2, 1.2, 0] })
    k.box(5.4, 4.8, 0.36, '#a86b47', { p: [0, 4.4, 0] })
    k.box(5.0, 4.4, 0.1, CREAM, { p: [0, 4.4, 0.2] })
    k.cyl(1.7, 1.7, 0.08, '#fffaf0', { p: [0, 4.95, 0.28], r: [Math.PI / 2, 0, 0] }, 20)
    k.cyl(1.82, 1.82, 0.06, SLATE, { p: [0, 4.95, 0.26], r: [Math.PI / 2, 0, 0] }, 20)
    const amber = new THREE.Color('#f2a541')
    const green = new THREE.Color('#4cae6a')
    for (let i = 0; i <= 10; i++) {
      const a = (150 - i * 12) * (Math.PI / 180)
      const c = amber.clone().lerp(green, i / 10)
      k.box(0.32, 0.12, 0.06, '#' + c.getHexString(), { p: [Math.cos(a) * 1.4, 4.95 + Math.sin(a) * 1.4, 0.36], r: [0, 0, a] })
    }
    k.box(5.4, 0.35, 0.5, '#e2674a', { p: [0, 7.0, 0.05] })
    k.ball(0.14, CREAM, { p: [-2.4, 7.0, 0.3] }, 0)
    k.ball(0.14, CREAM, { p: [2.4, 7.0, 0.3] }, 0)
  })

  // Seedling pots along the taxiways (the seedlings themselves grow later).
  POTS.forEach((p) => {
    k.cyl(0.36, 0.26, 0.46, ['#e2674a', '#d9a066', '#c9503e'][p.tint], { p: [p.x, 0.23, p.z] }, 8)
    k.cyl(0.4, 0.4, 0.07, '#e2674a', { p: [p.x, 0.46, p.z] }, 8)
    k.disc(0.3, '#6b4a33', { p: [p.x, 0.5, p.z] }, 8)
  })

  // Trees, bushes and flowers on the grass, clear of everything above.
  const keepOut = [
    { x: L.apron.x, z: L.apron.z, r: 15 },
    { x: 1.8, z: 11.8, r: 6 },
    { x: 14, z: -10.5, r: 6 },
    { x: 35, z: 9.5, r: 8 },
    { x: 31, z: 5.4, r: 4 },
    { x: L.dial.x, z: L.dial.z, r: 5 },
    { x: L.tower.x, z: L.tower.z, r: 4 },
    { x: L.windsock.x, z: L.windsock.z, r: 2 },
    ...L.flags.map((f) => ({ x: f.x, z: f.z, r: 1.6 })),
    ...L.forks.flatMap((_, fi) => [0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1].map((u) => ({ ...forkAt(fi, u), r: 3 }))),
    ...L.forks.map((f, fi) => ({ ...forkAt(fi, 0.95, f.house), r: 3 })),
  ]
  scatter(k, island, r, {
    trees: 12, cover: 90, kinds: [0, 1], keepOut,
    flowers: [CORAL, CREAM, GOLD, '#ff8fa3'],
  })
}

// --- parts that move -------------------------------------------------------------

// A propeller plane. `setGroup` and `setProp` hand back the refs so the parent can animate it.
function Plane({ body, accent, scale = 1, setGroup, setProp, position, rotation }) {
  const geo = useMemo(() => {
    const k = new Kit()
    planeBody(k, body, accent)
    return k.build()
  }, [body, accent])
  return (
    <group ref={setGroup} position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geo} material={toyMaterial} castShadow />
      <mesh ref={setProp} geometry={propGeo} material={toyMaterial} position={[0, 1.15, 2.5]} />
    </group>
  )
}

function ParkedPlanes() {
  const props = useRef([])
  useFrame(() => {
    props.current.forEach((m, i) => {
      if (m) m.rotation.z = clock.t * (2.2 + i * 0.4)
    })
  })
  return L.parked.map((p, i) => (
    <Plane key={i} body={p.body} accent={p.accent} scale={1.15} position={[p.x, 0, p.z]} rotation={[0, p.ry, 0]} setProp={(m) => (props.current[i] = m)} />
  ))
}

// Flight path of a departing plane, simulated once: roll, climb, loop, fly away.
const FLIGHT = (() => {
  const pts = []
  const dt = 0.05
  let f = 0
  let y = 0
  let th = 0
  for (let u = 0; u <= 15; u += dt) {
    pts.push({ f, y, th })
    let v
    if (u < 2) v = 4 * u
    else v = Math.min(8 + (u - 2) * 3, 11)
    if (u >= 2 && u < 3.2) th = 0.42 * smooth((u - 2) / 1.2)
    else if (u >= 3.2 && th < 0.42 + Math.PI * 2 - 0.02) th += 1.45 * dt
    else if (u >= 3.2) th = 0.42 + Math.PI * 2
    f += Math.cos(th) * v * dt
    y += Math.sin(th) * v * dt
    if (y < 0) y = 0
  }
  return pts
})()

// Pickup 3: three small planes take off along the three forks and loop away.
function Departures() {
  const groups = useRef([])
  const props = useRef([])
  const spin = useRef([0, 0, 0])
  const ends = useMemo(
    () =>
      L.forks.map((_, fi) => {
        const e = forkAt(fi, 1)
        return { x: e.x, z: e.z, dx: e.tx, dz: e.tz, ry: Math.atan2(e.tx, e.tz) }
      }),
    []
  )
  useFrame((_, dt) => {
    const s = since(2)
    ends.forEach((e, i) => {
      const g = groups.current[i]
      const local = s - i * 1.1
      let u = s < 0 || local < 0 ? 0 : local
      let speed = 2.4
      g.visible = true
      if (u > 0) {
        speed = 2.4 + Math.min(1, u / 2) * 30
        const idx = Math.min(FLIGHT.length - 2, Math.floor(u / 0.05))
        const a = FLIGHT[idx]
        const b = FLIGHT[idx + 1]
        const w = u / 0.05 - idx
        const f = a.f + (b.f - a.f) * w
        const y = a.y + (b.y - a.y) * w
        const th = a.th + (b.th - a.th) * w
        g.position.set(e.x + e.dx * f, y, e.z + e.dz * f)
        g.rotation.set(-th, e.ry, 0, 'YXZ')
        g.scale.setScalar(0.85 * Math.min(1, (14.5 - u) / 2.5))
        if (u > 14.2) g.visible = false
      } else {
        g.position.set(e.x, 0, e.z)
        g.rotation.set(0, e.ry, 0, 'YXZ')
        g.scale.setScalar(0.85)
      }
      spin.current[i] += dt * speed
      props.current[i].rotation.z = spin.current[i]
    })
  })
  return L.forks.map((f, i) => (
    <Plane key={i} body={f.plane[0]} accent={f.plane[1]} setGroup={(m) => (groups.current[i] = m)} setProp={(m) => (props.current[i] = m)} />
  ))
}

// Eighteen plain flags that unfurl one after another when pickup 1 is found.
function Flags() {
  const pivots = useRef([])
  const meshes = useRef([])
  const data = useMemo(
    () =>
      L.flags.map(() => {
        const g = new THREE.PlaneGeometry(2.5, 1.4, 8, 3)
        g.translate(1.25, -0.7, 0)
        return { g, base: g.attributes.position.array.slice() }
      }),
    []
  )
  useFrame(() => {
    const s = since(0)
    const t = clock.t
    L.flags.forEach((_, i) => {
      const u = s < 0 ? 0 : smooth((s - i * 0.28) / 0.9)
      pivots.current[i].rotation.z = -(1 - u) * 1.5 + Math.sin(t * 1.4 + i) * 0.05 * (1 - u)
      meshes.current[i].scale.x = 0.35 + 0.65 * u
      const amp = 0.05 + 0.22 * u
      const pos = data[i].g.attributes.position
      const base = data[i].base
      for (let v = 0; v < pos.count; v++) {
        const x = base[v * 3]
        pos.array[v * 3 + 2] = Math.sin(x * 2.3 - t * (2 + 3.2 * u) + i * 0.7) * amp * (x / 2.5 + 0.1)
        pos.array[v * 3 + 1] = base[v * 3 + 1] + Math.sin(x * 1.7 - t * 3 + i) * 0.05 * u * (x / 2.5)
      }
      pos.needsUpdate = true
    })
  })
  return L.flags.map((f, i) => (
    <group key={i} position={[f.x, 6.65, f.z]} rotation={[0, -Math.atan2(f.tz, f.tx), 0]}>
      <group ref={(m) => (pivots.current[i] = m)} position={[0.12, 0, 0]}>
        <mesh ref={(m) => (meshes.current[i] = m)} geometry={data[i].g} frustumCulled={false}>
          <meshStandardMaterial color={f.color} side={THREE.DoubleSide} flatShading roughness={0.85} />
        </mesh>
      </group>
    </group>
  ))
}

// The tower: radar dish turns all the time; the beacon lights up with pickup 1.
function TowerTop() {
  const radar = useRef()
  const beacon = useRef()
  const beams = useRef()
  const dishGeo = useMemo(() => {
    const k = new Kit()
    k.box(2.0, 0.12, 0.12, SLATE, { p: [0.5, 0, 0] })
    k.ball(0.8, '#e8ecf2', { p: [1.5, 0.2, 0], s: [0.2, 1, 1.4] })
    k.ball(0.14, CORAL, { p: [1.0, 0.2, 0] }, 0)
    k.box(0.15, 0.5, 0.15, SLATE, { p: [0, -0.2, 0] })
    k.box(1.2, 0.1, 0.1, SLATE, { p: [-0.5, 0, 0] })
    return k.build()
  }, [])
  const beamGeo = useMemo(() => {
    const g = new THREE.ConeGeometry(0.9, 7, 8, 1, true)
    g.rotateZ(-Math.PI / 2)
    g.translate(3.9, 0, 0)
    return g
  }, [])
  const dark = useMemo(() => new THREE.Color('#7a3b30'), [])
  const lit = useMemo(() => new THREE.Color('#ffd23f'), [])
  const col = useMemo(() => new THREE.Color(), [])
  useFrame(() => {
    const t = clock.t
    const s = since(0)
    radar.current.rotation.y = t * 1.3
    const on = s < 0 ? 0 : smooth(s / 0.8)
    const pulse = 0.65 + 0.35 * Math.sin(t * 6)
    beacon.current.material.color.copy(col.copy(dark).lerp(lit, on * pulse))
    beacon.current.scale.setScalar(1 + on * 0.25 * pulse)
    beams.current.visible = on > 0
    beams.current.rotation.y = t * 2.8
    beams.current.scale.setScalar(on)
  })
  return (
    <group position={[L.tower.x, 0, L.tower.z]}>
      <mesh ref={radar} geometry={dishGeo} material={toyMaterial} position={[0, 15.4, 0]} castShadow />
      <mesh ref={beacon} position={[0, 16.9, 0]}>
        <icosahedronGeometry args={[0.45, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </mesh>
      <group ref={beams} position={[0, 16.9, 0]} visible={false}>
        {[0, Math.PI].map((a) => (
          <mesh key={a} geometry={beamGeo} rotation={[0, a, 0]}>
            <meshBasicMaterial color="#ffe08a" transparent opacity={0.3} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

// A striped windsock that swings gently in the breeze.
function Windsock() {
  const sock = useRef()
  const geo = useMemo(() => {
    const k = new Kit()
    for (let i = 0; i < 5; i++) {
      const r0 = 0.55 - i * 0.075
      k.cyl(r0 - 0.075, r0, 0.62, i % 2 ? CREAM : CORAL, { p: [0.31 + i * 0.62, 0, 0], r: [0, 0, -Math.PI / 2] }, 8)
    }
    return k.build()
  }, [])
  useFrame(() => {
    const t = clock.t
    sock.current.rotation.set(0, Math.sin(t * 0.5) * 0.35, -0.28 + Math.sin(t * 1.9) * 0.1)
  })
  return (
    <group position={[L.windsock.x, 5.35, L.windsock.z]}>
      <mesh ref={sock} geometry={geo} material={toyMaterial} castShadow />
    </group>
  )
}

// Runway lights chase along both edges, always.
function RunwayLights({ island }) {
  const mesh = useRef()
  const spots = useMemo(() => {
    const out = []
    for (const s of [1, -1]) for (let x = -39; x <= 41; x += 4) out.push([x, s * 4.7])
    return out
  }, [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const a = useMemo(() => new THREE.Color('#ff9f1c'), [])
  const b = useMemo(() => new THREE.Color('#fff3c4'), [])
  const col = useMemo(() => new THREE.Color(), [])
  useFrame(() => {
    spots.forEach(([x, z], i) => {
      dummy.position.set(x, 0.56 + island.h(x, z), z)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
      const k = 0.5 + 0.5 * Math.sin(clock.t * 4 - x * 0.35)
      mesh.current.setColorAt(i, col.copy(a).lerp(b, k))
    })
    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
  })
  return (
    <instancedMesh ref={mesh} args={[null, null, spots.length]} frustumCulled={false}>
      <icosahedronGeometry args={[0.16, 0]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}

// Pickup 2: seedlings sprout in sequence along the three taxiways and grow into saplings.
function Seedlings({ island }) {
  const trunks = useRef()
  const crowns = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.05, 0.08, 1, 6).translate(0, 0.5, 0), [])
  const greens = useMemo(() => ['#5fae5a', '#7cc36a', '#4fae78'].map((c) => new THREE.Color(c)), [])
  useFrame(() => {
    const s = since(1)
    POTS.forEach((p, i) => {
      const k = s < 0 ? 0 : smooth((s - p.order) / 1.5)
      const over = k + Math.sin(Math.min(1, k) * Math.PI) * 0.12
      const h = k <= 0 ? 0.001 : 0.1 + 1.0 * smooth((k - 0.25) / 0.75)
      dummy.position.set(p.x, 0.5 + island.h(p.x, p.z), p.z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1, h, 1)
      dummy.updateMatrix()
      trunks.current.setMatrixAt(i, dummy.matrix)
      const cs = k <= 0 ? 0.001 : 0.2 + 0.8 * over
      dummy.position.set(p.x, 0.5 + island.h(p.x, p.z) + h + 0.08 * cs, p.z)
      dummy.rotation.set(0, i, 0)
      dummy.scale.set(cs * 1.2, cs * 0.9, cs * 1.2)
      dummy.updateMatrix()
      crowns.current.setMatrixAt(i, dummy.matrix)
      crowns.current.setColorAt(i, greens[(i + p.tint) % 3])
    })
    trunks.current.instanceMatrix.needsUpdate = true
    crowns.current.instanceMatrix.needsUpdate = true
    if (crowns.current.instanceColor) crowns.current.instanceColor.needsUpdate = true
  })
  return (
    <>
      <instancedMesh ref={trunks} args={[trunkGeo, null, POTS.length]} frustumCulled={false}>
        <meshStandardMaterial color={WOOD} flatShading roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={crowns} args={[null, null, POTS.length]} frustumCulled={false}>
        <icosahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial flatShading roughness={0.8} />
      </instancedMesh>
    </>
  )
}

// Pickup 3: the big dial swings from amber to green.
function Dial() {
  const needle = useRef()
  const lamp = useRef()
  const needleGeo = useMemo(() => {
    const k = new Kit()
    k.box(1.25, 0.1, 0.05, NAVY, { p: [0.55, 0, 0] })
    k.cone(0.1, 0.25, NAVY, { p: [1.25, 0, 0], r: [0, 0, -Math.PI / 2] }, 4)
    k.ball(0.17, CORAL, { p: [0, 0, 0.03] }, 1)
    return k.build()
  }, [])
  const tex = useMemo(() => textTexture('PARTNER HEALTH', { w: 512, h: 96, size: 58, bg: '#fff6e4', fg: '#22304f' }), [])
  const amber = useMemo(() => new THREE.Color('#ff9f1c'), [])
  const green = useMemo(() => new THREE.Color('#58d68d'), [])
  const col = useMemo(() => new THREE.Color(), [])
  useFrame(() => {
    const s = since(2)
    const k = s < 0 ? 0 : smooth(s / 1.6)
    const wobble = s < 1.6 ? 0 : Math.sin((s - 1.6) * 14) * 0.14 * Math.exp(-(s - 1.6) * 2.4)
    const rest = s < 0 ? Math.sin(clock.t * 1.5) * 0.03 : 0
    needle.current.rotation.z = 2.62 - 2.1 * k + wobble + rest
    lamp.current.material.color.copy(col.copy(amber).lerp(green, k))
  })
  return (
    <group position={[L.dial.x, 0, L.dial.z]} rotation={[0, L.dial.face, 0]}>
      <mesh ref={needle} geometry={needleGeo} material={toyMaterial} position={[0, 4.95, 0.42]} />
      <mesh ref={lamp} position={[0, 7.0, 0.35]}>
        <icosahedronGeometry args={[0.28, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </mesh>
      <mesh position={[0, 2.85, 0.27]}>
        <planeGeometry args={[4.0, 0.75]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  )
}

export default function AirfieldScenery({ island }) {
  return (
    <>
      <Static build={(k) => buildAirfield(k, island)} deps={[island]} />
      <Flags />
      <TowerTop />
      <ParkedPlanes />
      <Departures />
      <Windsock />
      <RunwayLights island={island} />
      <Seedlings island={island} />
      <Dial />
    </>
  )
}
