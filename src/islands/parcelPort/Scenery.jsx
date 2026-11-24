// Parcel Port scenery: a toy depot, sorting yard and harbour.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Kit, rng } from '../../engine/kit.js'
import { beam, baseRoad, scatter, CREAM, WOOD, SLATE, NAVY, CORAL, TEAL, GOLD } from '../../engine/props.js'
import { Static } from '../../engine/IslandParts.jsx'
import { clock, sinceOf, smooth } from '../../engine/state.js'
import L from './layout.js'

const since = sinceOf(5)
const PAL = [CORAL, TEAL, GOLD, CREAM, NAVY]

function container(k, x, y, z, color, along = true) {
  k.at({ p: [x, y, z], r: [0, along ? 0 : Math.PI / 2, 0] }, () => {
    k.box(6, 2.5, 2.4, color, { p: [0, 1.25, 0] })
    for (let i = -2; i <= 2; i++) k.box(0.1, 2.3, 2.5, shade(color), { p: [i * 1.1, 1.25, 0] })
    k.box(0.12, 2.3, 2.3, shade(color), { p: [3.02, 1.25, 0] })
  })
}
function shade(c) {
  const col = new THREE.Color(c)
  return '#' + col.multiplyScalar(0.8).getHexString()
}

function warehouse(k) {
  const W = L.warehouse
  k.at({ p: [W.x, 0, W.z] }, () => {
    k.box(15, 0.3, 9, '#cfc3ab', { p: [0, 0.15, 0] })
    k.box(14, 5.4, 8, '#fff1dc', { p: [0, 3.0, 0] })
    k.box(14.4, 0.4, 8.4, CORAL, { p: [0, 5.7, 0] })
    k.roof(14.8, 1.5, 8.8, '#e2674a', { p: [0, 5.9, 0] })
    // Loading dock, four roller doors.
    k.box(14, 0.9, 1.3, '#d9c9a8', { p: [0, 0.45, 4.6] })
    for (let i = 0; i < 4; i++) {
      const x = -5.25 + i * 3.5
      k.box(2.9, 3.4, 0.16, '#8b94a1', { p: [x, 2.6, 4.04] })
      for (let s = 0; s < 6; s++) k.box(2.6, 0.12, 0.14, ['#f2a541', '#1f9d8f', '#f0553f', '#f2a541'][i], { p: [x, 1.2 + s * 0.52 + 0.3, 4.12] })
      k.box(0.2, 3.5, 0.24, NAVY, { p: [x - 1.55, 2.65, 4.08] })
      k.box(0.2, 3.5, 0.24, NAVY, { p: [x + 1.55, 2.65, 4.08] })
      k.box(3.3, 0.2, 0.24, NAVY, { p: [x, 4.42, 4.08] })
    }
    // Clock tower over the doors.
    k.box(4.2, 3.9, 2.6, '#fbe6a8', { p: [0, 7.5, 2.7] })
    k.box(4.6, 0.3, 3.0, CORAL, { p: [0, 9.6, 2.7] })
    k.cone(2.6, 1.3, '#e2674a', { p: [0, 10.4, 2.7] }, 4)
    k.cyl(1.75, 1.75, 0.22, NAVY, { p: [0, 7.5, 4.05], r: [Math.PI / 2, 0, 0] }, 20)
    k.cyl(1.55, 1.55, 0.26, CREAM, { p: [0, 7.5, 4.08], r: [Math.PI / 2, 0, 0] }, 20)
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      k.box(0.12, i % 3 ? 0.22 : 0.4, 0.06, NAVY, { p: [Math.sin(a) * 1.3, 7.5 + Math.cos(a) * 1.3, 4.24], r: [0, 0, -a] })
    }
    k.ball(0.14, CORAL, { p: [0, 7.5, 4.3] })
    // Side vents and stacked pallets.
    for (let i = 0; i < 3; i++) k.cyl(0.4, 0.4, 0.8, '#aab4c0', { p: [-4.5 + i * 2.4, 6.9, -2] }, 8)
  })
  // Pallets with parcels by the docks.
  for (let i = 0; i < 6; i++) pallet(k, -17.6 + (i > 2 ? 0 : 0) + (i % 3) * 0, -7.8 + i * 0, i)
}

// A pallet with a few parcels. (x, z, variation)
function pallet(k, x, z, v) {
  k.at({ p: [x, 0, z], r: [0, v * 0.5, 0] }, () => {
    k.box(1.4, 0.18, 1.4, '#c9a27a', { p: [0, 0.2, 0] })
    k.box(1.4, 0.1, 0.3, WOOD, { p: [0, 0.07, 0.5] })
    k.box(1.4, 0.1, 0.3, WOOD, { p: [0, 0.07, -0.5] })
    const c = [['#d9a066', '#e8b97d'], ['#e8b97d', '#d9a066']][v % 2]
    k.box(0.65, 0.55, 0.6, c[0], { p: [-0.33, 0.58, -0.3] })
    k.box(0.6, 0.45, 0.6, c[1], { p: [0.35, 0.53, -0.3] })
    k.box(0.7, 0.5, 0.6, c[1], { p: [-0.3, 0.55, 0.35] })
    k.box(0.72, 0.1, 0.1, CREAM, { p: [-0.3, 0.82, 0.35] })
    if (v % 2 === 0) k.box(0.6, 0.4, 0.55, c[0], { p: [0.33, 0.5, 0.38] })
    if (v % 3 === 0) k.box(0.5, 0.4, 0.5, '#f6d9cf', { p: [-0.33, 1.05, -0.3] })
  })
}

function crane(k) {
  const C = L.crane
  const zm = (C.z0 + C.z1) / 2
  const span = C.z1 - C.z0
  for (const z of [C.z0, C.z1]) {
    for (const dx of [-1, 1]) k.box(0.4, 9, 0.4, '#f2a541', { p: [C.x + dx * 0.9, 4.5, z] })
    k.box(2.6, 0.4, 0.4, NAVY, { p: [C.x, 4.5, z] })
    k.box(2.6, 0.4, 0.4, NAVY, { p: [C.x, 8.6, z] })
    k.box(2.4, 0.3, 1.5, SLATE, { p: [C.x, 0.15, z] })
  }
  for (const dx of [-1, 1]) k.box(0.5, 0.5, span + 5, CORAL, { p: [C.x + dx * 0.9, 9.2, zm + 1.2] })
  k.box(2.4, 0.3, 1.0, NAVY, { p: [C.x, 9.0, zm + 3.5] })
  // Cabin, trolley and a hanging container.
  k.box(1.6, 1.3, 1.6, CREAM, { p: [C.x + 1.9, 8.2, C.z0 - 0.2] })
  k.box(1.4, 0.2, 1.8, CORAL, { p: [C.x + 1.9, 8.95, C.z0 - 0.2] })
  k.box(1.5, 0.5, 1.6, NAVY, { p: [C.x, 9.7, zm + 2.0] })
  for (const dz of [-0.6, 0.6]) k.cyl(0.04, 0.04, 3.3, SLATE, { p: [C.x, 7.9, zm + 2.0 + dz] }, 4)
  container(k, C.x, 4.55, zm + 2.0, '#1f9d8f', false)
}

function conveyor(k, b) {
  const lenB = b.x1 - b.x0
  const cx = (b.x0 + b.x1) / 2
  k.box(lenB, 0.14, 1.5, '#3b4a63', { p: [cx, 0.95, b.z] })
  for (const s of [1, -1]) k.box(lenB, 0.3, 0.14, GOLD, { p: [cx, 1.1, b.z + s * 0.78] })
  for (let x = b.x0 + 0.4; x < b.x1; x += 1.8) {
    k.box(0.14, 0.9, 1.5, SLATE, { p: [x, 0.45, b.z] })
    k.box(0.1, 0.03, 1.2, '#5b6c86', { p: [x + 0.9, 1.03, b.z] })
  }
  for (const e of [b.x0, b.x1]) k.cyl(0.35, 0.35, 1.4, '#aab4c0', { p: [e, 0.95, b.z], r: [Math.PI / 2, 0, 0] }, 8)
  // A little arch and a sorting chute.
  const ax = b.dir > 0 ? b.x0 + (b.x1 - b.x0) * 0.55 : b.x0 + (b.x1 - b.x0) * 0.45
  for (const s of [1, -1]) k.box(0.2, 2.8, 0.2, TEAL, { p: [ax, 1.4, b.z + s * 0.95] })
  k.box(0.3, 0.3, 2.3, TEAL, { p: [ax, 2.8, b.z] })
  const endx = b.dir > 0 ? b.x1 : b.x0
  k.box(1.4, 0.9, 1.7, '#d9a066', { p: [endx + b.dir * 1.2, 0.45, b.z] })
  k.box(1.5, 0.12, 1.8, CORAL, { p: [endx + b.dir * 1.2, 0.95, b.z] })
}

function van(k, v, color) {
  k.at({ p: [v.x, 0, v.z], r: [0, 0, 0] }, () => {
    k.box(1.9, 1.7, 2.3, color, { p: [0, 1.3, -0.5] })
    k.box(1.9, 1.15, 1.1, color, { p: [0, 0.95, 1.2] })
    k.box(1.7, 0.55, 0.08, '#7fc4d8', { p: [0, 1.4, 1.76], r: [-0.25, 0, 0] })
    k.box(1.94, 0.18, 2.34, '#ffffff', { p: [0, 2.2, -0.5] })
    k.box(1.94, 0.12, 3.5, shade(color), { p: [0, 0.5, 0.1] })
    for (const sx of [1, -1]) for (const z of [-0.9, 1.1]) k.cyl(0.38, 0.38, 0.26, '#2a3140', { p: [sx * 0.95, 0.38, z], r: [0, 0, Math.PI / 2] }, 10)
    k.box(1.2, 0.1, 0.1, '#2a3140', { p: [0, 0.35, 1.8] })
  })
}

function quayAndBoat(k) {
  const Q = L.quay
  const w = Q.x1 - Q.x0
  const cx = (Q.x0 + Q.x1) / 2
  k.box(w, 0.5, Q.z1 - Q.z0, '#d5d0c4', { p: [cx, 0.25, (Q.z0 + Q.z1) / 2] })
  k.box(w, 0.12, 0.5, '#8b94a1', { p: [cx, 0.54, Q.z1 - 0.25] })
  // Bollards and lamps (small, no colliders).
  for (let i = 0; i < 7; i++) {
    const x = Q.x0 + 1.5 + i * ((w - 3) / 6)
    k.cyl(0.26, 0.32, 0.55, NAVY, { p: [x, 0.78, Q.z1 - 0.9] }, 8)
    k.cyl(0.38, 0.28, 0.14, CORAL, { p: [x, 1.1, Q.z1 - 0.9] }, 8)
  }
  for (const x of [Q.x0 + 1.2, cx, Q.x1 - 1.2]) {
    k.cyl(0.08, 0.1, 2.6, NAVY, { p: [x, 1.8, Q.z0 + 0.6] }, 6)
    k.ball(0.26, '#ffe08a', { p: [x, 3.2, Q.z0 + 0.6] })
  }
  // Mooring ropes quay to boat.
  for (const x of [boat(-4.2), boat(4.2)]) beam(k, [x, 1.2, Q.z1 - 0.9], [x, 2.2, L.boat.z - 2.1], 0.06, '#b08a5c')
  // Crates on the quay.
  container(k, Q.x0 + 3.2, 0.5, Q.z0 + 1.6, '#f2a541')
  container(k, Q.x0 + 3.2, 3.0, Q.z0 + 1.6, '#fff1dc')
  pallet(k, Q.x1 - 3, Q.z0 + 1.4, 1)
  pallet(k, Q.x1 - 5.2, Q.z0 + 1.3, 2)
}
const boat = (dx) => L.boat.x + dx

// The cargo boat (floats beside the quay, bobbing).
function boatBuild(k) {
  k.box(11, 2.0, 4.6, NAVY, { p: [0, 1.0, 0] })
  k.box(11.05, 0.45, 4.65, CORAL, { p: [0, 1.7, 0] })
  k.box(10.4, 0.16, 4.2, '#c9a27a', { p: [0, 2.05, 0] })
  // Bow wedge.
  const shape = new THREE.Shape()
  shape.moveTo(0, -2.3)
  shape.lineTo(0, 2.3)
  shape.lineTo(3.6, 0)
  shape.closePath()
  const g = new THREE.ExtrudeGeometry(shape, { depth: 2.0, bevelEnabled: false })
  g.rotateX(-Math.PI / 2)
  k.add(g, NAVY, { p: [5.5, 0, 0] })
  const top = g.clone()
  k.add(new THREE.ExtrudeGeometry(shape, { depth: 0.16, bevelEnabled: false }).rotateX(-Math.PI / 2), '#c9a27a', { p: [5.5, 2.0, 0] })
  top.dispose()
  // Cabin, funnel and deck containers.
  k.box(2.4, 2.2, 3.6, CREAM, { p: [-3.6, 3.2, 0] })
  k.box(2.7, 0.3, 3.9, TEAL, { p: [-3.6, 4.4, 0] })
  k.box(0.1, 0.6, 2.8, '#7fc4d8', { p: [-2.38, 3.5, 0] })
  k.cyl(0.55, 0.65, 1.4, GOLD, { p: [-3.8, 5.3, 0] }, 8)
  k.cyl(0.58, 0.58, 0.2, NAVY, { p: [-3.8, 6.05, 0] }, 8)
  const cc = ['#f0553f', '#1f9d8f', '#f2a541', '#fff1dc']
  for (let i = 0; i < 3; i++) {
    k.box(2.2, 1.1, 1.9, cc[i], { p: [-0.3 + i * 2.3, 2.7, -0.95] })
    k.box(2.2, 1.1, 1.9, cc[(i + 2) % 4], { p: [-0.3 + i * 2.3, 2.7, 1.0] })
  }
  k.box(2.2, 1.1, 1.9, cc[1], { p: [0.85, 3.8, 0] })
  k.cyl(0.05, 0.05, 2.6, SLATE, { p: [5.4, 3.3, 0] }, 4)
  k.cone(0.4, 0.7, CORAL, { p: [5.6, 4.95, 0], r: [0, 0, -Math.PI / 2] }, 3)
}

function buildScene(k) {
  baseRoad(k, { road: L.road }, { color: '#e9dcc2', edge: '#cdbd98', dash: '#fff6e4' })
  // Paving.
  k.box(15, 0.08, 6.4, '#e4d3ae', { p: [-1.5, 0.04, 7.4] })
  k.box(12, 0.08, 5, '#e4d3ae', { p: [1, 0.04, -7.4] })
  k.box(19, 0.08, 8.6, '#d9cdb4', { p: [-24, 0.04, 11.8] })
  warehouse(k)
  // Container yard.
  L.stacks.forEach((s, si) => {
    for (let i = 0; i < s.n; i++) container(k, s.x, i * 2.5, s.z, L.COLORS[s.c[i]], true)
  })
  crane(k)
  L.belts.forEach((b) => conveyor(k, b))
  // Loose pallets around the depot and yard.
  ;[[-34.5, -6.2], [-18.5, -6.2], [-17.2, -4.7], [-33.2, 9.6], [-17.8, 6.0], [-9, -6.3], [24, 7.4], [26.2, 6.6]].forEach(([x, z], i) => pallet(k, x, z, i))
  L.vans.forEach((v, i) => van(k, v, L.VAN_COLORS[i]))
  // Van parking kerb.
  k.box(20, 0.12, 0.3, '#fff6e4', { p: [30, 0.08, -9.2] })
  quayAndBoatStatic(k)
  // Clock board for the tiles.
  const B = L.board
  for (const s of [1, -1]) k.box(0.3, 4.5, 0.3, WOOD, { p: [B.x + s * 4.9, 2.25, B.z] })
  k.box(10.4, 2.5, 0.3, NAVY, { p: [B.x, 4.6, B.z] })
  k.box(10.6, 0.3, 0.5, CORAL, { p: [B.x, 6.0, B.z] })
  // Payment kiosk.
  const K = L.kiosk
  k.at({ p: [K.x, 0, K.z], r: [0, Math.PI + 0.25, 0] }, () => {
    k.box(2.6, 0.3, 2.2, '#c9a27a', { p: [0, 0.15, 0] })
    k.box(2.2, 1.9, 1.7, TEAL, { p: [0, 1.25, 0] })
    k.box(2.5, 0.2, 2.0, CREAM, { p: [0, 2.3, 0] })
    k.box(1.6, 0.8, 0.1, '#7fc4d8', { p: [0, 1.75, 0.9] })
    k.box(1.6, 0.12, 0.6, CREAM, { p: [0, 1.15, 1.15] })
    k.box(0.5, 0.35, 0.12, GOLD, { p: [0.5, 1.45, 1.15] })
    k.cyl(0.1, 0.12, 2.2, NAVY, { p: [0, 3.4, 0] }, 6)
  })
  scatter(k, { outline: L.outline, road: L.road, colliders: L.colliders, stops: L.pickupSpots.map(([x, z]) => ({ x, z })), len: L.len }, rng(77), {
    trees: 16, cover: 50, kinds: [0, 2], treeColors: ['#5fae5a', '#7cc36a', '#4f9f58', '#3f9a6d', '#4fae78', '#62bd84', '#f2a541', '#f6bd60'],
    keepOut: [{ x: 29, z: 13, r: 13 }, { x: -22, z: 12, r: 11 }, { x: -1, z: 0, r: 10 }, { x: -26, z: -10, r: 6 }, { x: 30, z: -11, r: 14 }, { x: 38, z: 10, r: 7 }],
  })
}
function quayAndBoatStatic(k) {
  quayAndBoat(k)
}

// ---------------- animated parts ----------------

// Stop 0: glowing delivery routes draw from the depot door out to every pin; van lights come on.
const routeVert = `attribute float aU; attribute float aD; varying float vU; varying float vD; void main(){ vU = aU; vD = aD; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`
const routeFrag = `varying float vU; varying float vD; uniform float uS; uniform float uT;
void main(){
  float prog = clamp((uS - vD) / 1.6, 0.0, 1.0);
  if (uS < 0.0 || vU > prog) discard;
  float pulse = 0.55 + 0.45 * sin(vU * 46.0 - uT * 4.0);
  vec3 c = mix(vec3(1.0, 0.55, 0.12), vec3(1.0, 0.92, 0.45), pulse);
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`

function routePath(p) {
  const [sx, sz] = L.depotDoor
  const mx = (sx + p.x) / 2
  const mz = (sz + p.z) / 2
  const dx = p.x - sx
  const dz = p.z - sz
  const d = Math.hypot(dx, dz)
  const bend = Math.min(7, d * 0.18) * (p.c % 2 ? 1 : -1)
  return [mx - (dz / d) * bend, mz + (dx / d) * bend]
}

function Routes() {
  const mat = useRef()
  const mesh = useRef()
  const pinMesh = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const col = useMemo(() => new THREE.Color(), [])
  const delays = useMemo(() => L.pins.map((p) => 0.1 + Math.hypot(p.x - L.depotDoor[0], p.z - L.depotDoor[1]) * 0.05), [])
  const geo = useMemo(() => {
    const pos = []
    const au = []
    const ad = []
    const w = 0.13
    L.pins.forEach((p, pi) => {
      const [cx, cz] = routePath(p)
      const [sx, sz] = L.depotDoor
      const n = 36
      let prev = null
      for (let i = 0; i <= n; i++) {
        const u = i / n
        const a = (1 - u) * (1 - u)
        const b = 2 * (1 - u) * u
        const c = u * u
        const x = a * sx + b * cx + c * p.x
        const z = a * sz + b * cz + c * p.z
        const tx = 2 * (1 - u) * (cx - sx) + 2 * u * (p.x - cx)
        const tz = 2 * (1 - u) * (cz - sz) + 2 * u * (p.z - cz)
        const tl = Math.hypot(tx, tz) || 1
        const nx = (-tz / tl) * w
        const nz = (tx / tl) * w
        const cur = [x + nx, z + nz, x - nx, z - nz, u]
        if (prev) {
          const y = 0.1
          const v = (q, uu) => {
            pos.push(q[0], y, q[1])
            au.push(uu)
            ad.push(delays[pi])
          }
          v([prev[0], prev[1]], prev[4]); v([prev[2], prev[3]], prev[4]); v([cur[0], cur[1]], u)
          v([prev[2], prev[3]], prev[4]); v([cur[2], cur[3]], u); v([cur[0], cur[1]], u)
        }
        prev = cur
      }
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('aU', new THREE.Float32BufferAttribute(au, 1))
    g.setAttribute('aD', new THREE.Float32BufferAttribute(ad, 1))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 120)
    return g
  }, [delays])
  const pinGeo = useMemo(() => {
    const k = new Kit()
    k.cone(0.34, 0.9, '#ffffff', { p: [0, 0.45, 0], r: [Math.PI, 0, 0] }, 6)
    k.ball(0.42, '#ffffff', { p: [0, 1.15, 0] }, 1)
    return k.build()
  }, [])
  const uniforms = useMemo(() => ({ uS: { value: -1 }, uT: { value: 0 } }), [])
  useFrame(() => {
    const s = since(0)
    const u = mat.current?.uniforms
    if (u?.uS) {
      u.uS.value = s
      u.uT.value = clock.t
    }
    L.pins.forEach((p, i) => {
      const k = s < 0 ? 0 : smooth((s - delays[i] - 1.4) / 0.5)
      const pop = k * (1 + Math.sin(Math.min(1, k) * Math.PI) * 0.35)
      dummy.position.set(p.x, 0, p.z)
      dummy.scale.setScalar(Math.max(0.0001, pop * 0.75))
      dummy.rotation.y = clock.t * 1.2 + i
      dummy.updateMatrix()
      pinMesh.current.setMatrixAt(i, dummy.matrix)
      pinMesh.current.setColorAt(i, col.set(['#ff6b4a', '#35d3c0', '#ffc24a', '#fff6e4', '#7fa3ff'][p.c]))
    })
    pinMesh.current.instanceMatrix.needsUpdate = true
    if (pinMesh.current.instanceColor) pinMesh.current.instanceColor.needsUpdate = true
  })
  return (
    <>
      <mesh ref={mesh} geometry={geo} frustumCulled={false}>
        <shaderMaterial ref={mat} vertexShader={routeVert} fragmentShader={routeFrag} uniforms={uniforms} side={THREE.DoubleSide} />
      </mesh>
      <instancedMesh ref={pinMesh} args={[pinGeo, null, L.pins.length]} frustumCulled={false}>
        <meshBasicMaterial vertexColors toneMapped={false} />
      </instancedMesh>
    </>
  )
}

function VanLights() {
  const bulbs = useRef()
  const glow = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const col = useMemo(() => new THREE.Color(), [])
  const off = useMemo(() => new THREE.Color('#566275'), [])
  const on = useMemo(() => new THREE.Color('#fff2a8'), [])
  useFrame(() => {
    const s = since(0)
    L.vans.forEach((v, i) => {
      const k = s < 0 ? 0 : smooth((s - 1.0 - i * 0.18) / 0.3)
      for (const side of [0, 1]) {
        const j = i * 2 + side
        const x = v.x + (side ? 0.65 : -0.65)
        dummy.position.set(x, 0.85, v.z + 1.78)
        dummy.scale.setScalar(1 + k * 0.5)
        dummy.updateMatrix()
        bulbs.current.setMatrixAt(j, dummy.matrix)
        bulbs.current.setColorAt(j, col.copy(off).lerp(on, k))
        dummy.position.set(x, 0.07, v.z + 4.0)
        dummy.scale.set(Math.max(0.0001, k), 1, Math.max(0.0001, k))
        dummy.updateMatrix()
        glow.current.setMatrixAt(j, dummy.matrix)
      }
    })
    bulbs.current.instanceMatrix.needsUpdate = true
    if (bulbs.current.instanceColor) bulbs.current.instanceColor.needsUpdate = true
    glow.current.instanceMatrix.needsUpdate = true
  })
  const n = L.vans.length * 2
  return (
    <>
      <instancedMesh ref={bulbs} args={[null, null, n]} frustumCulled={false}>
        <sphereGeometry args={[0.2, 8, 6]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={glow} args={[null, null, n]} frustumCulled={false}>
        <circleGeometry args={[1.0, 14]} onUpdate={(g) => g.rotateX(-Math.PI / 2)} />
        <meshBasicMaterial color="#ffe58a" transparent opacity={0.45} depthWrite={false} />
      </instancedMesh>
    </>
  )
}

// Stop 1: belts speed up, clock spins, four of ten tiles go dark.
function Express() {
  const parcels = useRef()
  const hands = useRef()
  const minute = useRef()
  const hour = useRef()
  const tiles = useRef()
  const phase = useRef(0)
  const ang = useRef(0)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const col = useMemo(() => new THREE.Color(), [])
  const lit = useMemo(() => new THREE.Color('#ffc24a'), [])
  const dark = useMemo(() => new THREE.Color('#34415c'), [])
  const per = 8
  const colors = useMemo(() => Array.from({ length: per * L.belts.length }, (_, i) => PAL[(i * 3) % 5]), [])
  const boxGeo = useMemo(() => new THREE.BoxGeometry(0.8, 0.55, 0.7).translate(0, 0.28, 0), [])
  useFrame((_, dt) => {
    const s = since(1)
    const speed = 1.1 + (s < 0 ? 0 : 4.2 * smooth(s / 1.5))
    phase.current += Math.min(dt, 0.1) * speed
    L.belts.forEach((b, bi) => {
      const length = b.x1 - b.x0 + 1
      for (let i = 0; i < per; i++) {
        const u = (phase.current + (i * length) / per) % length
        const x = b.dir > 0 ? b.x0 - 0.5 + u : b.x1 + 0.5 - u
        dummy.position.set(x, 1.02, b.z + ((i * 7) % 3 - 1) * 0.18)
        dummy.rotation.set(0, (i % 3) * 0.2, 0)
        dummy.scale.set(1 + (i % 3) * 0.12, 1, 1)
        dummy.updateMatrix()
        parcels.current.setMatrixAt(bi * per + i, dummy.matrix)
        parcels.current.setColorAt(bi * per + i, col.set(colors[bi * per + i]))
      }
    })
    parcels.current.instanceMatrix.needsUpdate = true
    if (parcels.current.instanceColor) parcels.current.instanceColor.needsUpdate = true
    // Clock.
    ang.current += Math.min(dt, 0.1) * (0.25 + (s < 0 ? 0 : 1.2 + 5.5 * Math.exp(-s / 3.5)))
    minute.current.rotation.z = -ang.current
    hour.current.rotation.z = -ang.current / 12
    // Tiles.
    for (let i = 0; i < 10; i++) {
      const off = i >= 6
      const k = off && s >= 0 ? smooth((s - 1.0 - (i - 6) * 0.35) / 0.4) : 0
      dummy.position.set(L.board.x - 4.5 + i * 1.0, 4.6, L.board.z + 0.18)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1, 1 - k * 0.15, 1)
      dummy.updateMatrix()
      tiles.current.setMatrixAt(i, dummy.matrix)
      tiles.current.setColorAt(i, col.copy(lit).lerp(dark, k))
    }
    tiles.current.instanceMatrix.needsUpdate = true
    if (tiles.current.instanceColor) tiles.current.instanceColor.needsUpdate = true
  })
  return (
    <>
      <instancedMesh ref={parcels} args={[boxGeo, null, per * L.belts.length]} frustumCulled={false} castShadow>
        <meshStandardMaterial roughness={0.8} flatShading />
      </instancedMesh>
      <group ref={hands} position={[L.clockPos.x, L.clockPos.y, L.clockPos.z + 0.1]}>
        <group ref={minute}>
          <mesh position={[0, 0.55, 0]}>
            <boxGeometry args={[0.14, 1.2, 0.08]} />
            <meshStandardMaterial color={NAVY} />
          </mesh>
        </group>
        <group ref={hour} position={[0, 0, 0.06]}>
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[0.22, 0.8, 0.08]} />
            <meshStandardMaterial color={CORAL} />
          </mesh>
        </group>
      </group>
      <instancedMesh ref={tiles} args={[null, null, 10]} frustumCulled={false}>
        <boxGeometry args={[0.82, 1.6, 0.1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </>
  )
}

// Stop 2: the payment kiosk lights a shield-and-tick sign and spits out coins.
function Kiosk() {
  const shield = useRef()
  const tick = useRef()
  const sign = useRef()
  const coins = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const off = useMemo(() => new THREE.Color('#6b7690'), [])
  const on = useMemo(() => new THREE.Color('#35d3a0'), [])
  const shieldGeo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.8, 0.9)
    s.lineTo(0.8, 0.9)
    s.lineTo(0.8, 0.1)
    s.quadraticCurveTo(0.7, -0.7, 0, -1.1)
    s.quadraticCurveTo(-0.7, -0.7, -0.8, 0.1)
    s.closePath()
    return new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: false, curveSegments: 6 }).translate(0, 0, -0.1)
  }, [])
  const N = 7
  useFrame(() => {
    const s = since(2)
    const k = s < 0 ? 0 : smooth(s / 0.6)
    shield.current.material.color.copy(off).lerp(on, k)
    sign.current.scale.setScalar(1 + (s < 0 ? 0 : Math.sin(Math.min(1, s / 0.8) * Math.PI) * 0.25))
    sign.current.position.y = 4.9 + Math.sin(clock.t * 2) * 0.05 * k
    tick.current.visible = k > 0.5
    for (let i = 0; i < N; i++) {
      const local = s - 0.5 - i * 0.45
      const life = local < 0 ? -1 : (local % 3.2) / 3.2
      if (life < 0) {
        dummy.scale.setScalar(0.0001)
        dummy.position.set(0, 0, 0)
      } else {
        const a = 0.9 + i * 0.7
        const spread = 0.8 + (i % 3) * 0.5
        const t = life * 1.4
        const y = 1.6 + 5.2 * t - 6.2 * t * t
        const landed = y < 0.08
        const T = (a2) => (landed ? 1.1 : 0) * a2
        dummy.position.set(Math.sin(a) * spread * Math.min(1, life * 2) * 1.6, Math.max(0.1, y), 1.4 + Math.cos(a) * spread * Math.min(1, life * 2) + T(0))
        dummy.rotation.set(landed ? 0 : clock.t * 6 + i, 0, landed ? 0 : clock.t * 5)
        dummy.scale.setScalar(Math.min(1, life * 10, (1 - life) * 5) * 1.1)
      }
      dummy.updateMatrix()
      coins.current.setMatrixAt(i, dummy.matrix)
    }
    coins.current.instanceMatrix.needsUpdate = true
  })
  return (
    <group position={[L.kiosk.x, 0, L.kiosk.z]} rotation={[0, Math.PI + 0.25, 0]}>
      <group ref={sign} position={[0, 4.9, 0]} rotation={[0, 0.8, 0]}>
        <mesh ref={shield} geometry={shieldGeo}>
          <meshBasicMaterial color="#6b7690" toneMapped={false} />
        </mesh>
        <group ref={tick} position={[0, 0.05, 0.14]}>
          <mesh position={[-0.3, -0.12, 0]} rotation={[0, 0, 0.78]}>
            <boxGeometry args={[0.2, 0.55, 0.08]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
          <mesh position={[0.2, 0.08, 0]} rotation={[0, 0, -0.78]}>
            <boxGeometry args={[0.2, 1.0, 0.08]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
        </group>
      </group>
      <instancedMesh ref={coins} args={[null, null, N]} frustumCulled={false}>
        <cylinderGeometry args={[0.3, 0.3, 0.07, 12]} />
        <meshStandardMaterial color="#ffc93c" emissive="#ff9f1c" emissiveIntensity={0.5} roughness={0.35} />
      </instancedMesh>
    </group>
  )
}

function Boat() {
  const g = useRef()
  useFrame(() => {
    g.current.position.y = 0.4 + Math.sin(clock.t * 1.2) * 0.14
    g.current.rotation.z = Math.sin(clock.t * 0.9) * 0.015
    g.current.rotation.x = Math.sin(clock.t * 0.7) * 0.012
  })
  return (
    <group ref={g} position={[L.boat.x, 0.4, L.boat.z]} rotation={[0, 0, 0]}>
      <Static build={boatBuild} />
    </group>
  )
}

export default function ParcelPortScenery() {
  return (
    <>
      <Static build={buildScene} />
      <Boat />
      <Routes />
      <VanLights />
      <Express />
      <Kiosk />
    </>
  )
}
