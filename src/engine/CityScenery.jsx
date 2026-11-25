// A station as a night city block. Dark buildings line the road, and the company's
// tower shows the chapter filling up: each stop lights a band of its windows in the company
// colour, and the headline result is spelled across them.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ribbonXZ, rng, textTexture } from './kit.js'
import { baseRoad } from './props.js'
import { Static } from './IslandParts.jsx'
import { sinceOf, clock } from './state.js'
import { spell } from './dots.js'

const WALLS = ['#3d477c', '#444f8a', '#363f70']
const NEON = ['#ff4fa3', '#4fe3ff', '#ffb347', '#b8ff4f']

function buildCity(island) {
  const { tower, blocks } = island.extra.city
  return (k) => {
    k.add(ribbonXZ(island.road, 13.5, 0.015), '#2e3558')
    baseRoad(k, island, { color: '#1d2138', edge: '#565d86', dash: '#f1e6c0' })
    for (const b of blocks) {
      if (b.landmark) continue
      const w = b.half * 2
      k.at({ p: [b.x, 0, b.z] }, () => {
        // The footing goes well below ground so no gap shows where the land slopes.
        k.box(w + 0.5, 3.4, w + 0.5, '#2a3052', { p: [0, -1.5, 0] })
        k.box(w, b.h, w, WALLS[b.tone], { p: [0, b.h / 2 + 0.2, 0] })
        k.box(w + 0.3, 0.3, w + 0.3, '#2d3560', { p: [0, b.h + 0.35, 0] })
        if (b.seed % 3 === 0) k.box(1.4, 1.1, 1.4, '#232a4e', { p: [w * 0.18, b.h + 1.0, -w * 0.15] })
        if (b.seed % 4 === 1) k.cyl(0.05, 0.05, 2.6, '#3a4270', { p: [-w * 0.25, b.h + 1.8, w * 0.2] })
      })
    }
    const t = tower
    if (t) {
      k.at({ p: [t.x, 0, t.z] }, () => {
        k.box(t.w + 1.6, 3.6, t.d + 1.6, '#2a3052', { p: [0, -1.5, 0] })
        k.box(t.w + 0.8, 1.0, t.d + 0.8, '#232a4e', { p: [0, 0.7, 0] })
        k.box(t.w, t.h, t.d, '#0f1330', { p: [0, t.h / 2 + 0.2, 0] })
        k.box(t.w + 0.4, 0.5, t.d + 0.4, island.finish ? island.data.brand.secondary : island.data.brand.primary, { p: [0, t.h + 0.45, 0] })
      })
      // The square beside the tower: a few low planters on the open ground.
      for (const dx of [-9, -15, -21]) {
        const x = t.x + dx
        const z = t.z + t.side * 1.5
        if (Math.abs(island.h(x + 1.2, z) - island.h(x - 1.2, z)) > 0.3) continue
        k.at({ p: [x, 0, z] }, () => {
          k.box(2.2, 0.6, 2.2, '#343c66', { p: [0, 0.3, 0] })
          k.ball(0.9, '#2f6e5a', { p: [0, 1.1, 0] }, 0)
        })
      }
    }
    LANDMARKS[island.id]?.(k, island)
  }
}

// Extra landmarks for particular stations, keyed by station number.
const LANDMARKS = {
  1: (k, island) => {
    for (const b of island.extra.city.blocks) {
      if (b.landmark === 'brussels') {
        // A row of tall guild houses with stepped gables and gilded trim, and a slim spire.
        k.at({ p: [b.x, 0, b.z] }, () => {
          k.box(7.2, 3.2, 6.2, '#3a3350', { p: [0, -1.4, 0] })
          ;[-2.4, 0, 2.4].forEach((x, i) => {
            const h = 6.4 + (i % 2) * 1.1
            k.box(2.2, h, 3.2, ['#6b5a4a', '#75624e', '#5f5246'][i], { p: [x, h / 2 + 0.2, 1] })
            for (let s = 0; s < 3; s++) k.box(2.2 - s * 0.62, 0.55, 3.2, '#7d6a52', { p: [x, h + 0.45 + s * 0.55, 1] })
            k.box(2.3, 0.14, 0.2, '#e0b84a', { p: [x, h + 0.2, -0.62] })
            k.ball(0.18, '#e0b84a', { p: [x, h + 2.05, 1] }, 0)
          })
          k.box(1.5, 9.5, 1.5, '#5a4f48', { p: [0, 4.95, -1.9] })
          k.cone(1.0, 4.2, '#3f4a66', { p: [0, 11.8, -1.9] }, 6)
        })
      }
      if (b.landmark === 'madrid') {
        // A long red-brick front with a white clock turret over the middle.
        k.at({ p: [b.x, 0, b.z] }, () => {
          k.box(7.4, 3.2, 6.2, '#3a3350', { p: [0, -1.4, 0] })
          k.box(7.0, 4.6, 4.0, '#8a4a3c', { p: [0, 2.5, 0.6] })
          k.box(7.2, 0.3, 4.2, '#d9d2c4', { p: [0, 4.95, 0.6] })
          k.box(2.0, 2.6, 2.0, '#d9d2c4', { p: [0, 6.4, 0.6] })
          k.disc(0.62, '#f4efe2', { p: [0, 6.6, -0.42], r: [Math.PI / 2, 0, 0] })
          k.cone(1.25, 1.5, '#4a566e', { p: [0, 8.45, 0.6] }, 4)
          k.cyl(0.05, 0.05, 1.2, '#c9c2b4', { p: [0, 9.7, 0.6] })
        })
      }
    }
  },
}

const tmp = { m: new THREE.Matrix4(), q: new THREE.Quaternion(), p: new THREE.Vector3(), s: new THREE.Vector3(), c: new THREE.Color() }
const Y = new THREE.Vector3(0, 1, 0)
const VIOLET = new THREE.Color('#7a3cff')

// Lit windows and shopfronts of the ordinary buildings: one mesh for the whole block.
function BlockLights({ island }) {
  const ref = useRef()
  const lights = useMemo(() => {
    const { blocks } = island.extra.city
    const out = []
    for (const b of blocks) {
      if (b.landmark) continue
      const r = rng(b.seed)
      const y0 = island.h(b.x, b.z)
      const w = b.half * 2
      const cols = 4
      const rows = Math.max(1, Math.floor((b.h - 2.6) / 1.45))
      // The face towards the road, and the west face the driver sees on the way in.
      const faces = [
        { nx: 0, nz: -b.side, face: b.side > 0 ? Math.PI : 0 },
        { nx: -1, nz: 0, face: -Math.PI / 2 },
      ]
      faces.forEach((f, fi) => {
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            if (r() > 0.34) continue
            const along = (col - (cols - 1) / 2) * (w / cols)
            const warm = r() > 0.25
            const lum = 0.5 + r() * 0.45
            out.push({
              x: b.x + f.nx * (b.half + 0.04) + (f.nx ? 0 : along),
              y: y0 + 2.9 + row * 1.45,
              z: b.z + f.nz * (b.half + 0.04) + (f.nz ? 0 : along),
              face: f.face, sx: (w / cols) * 0.46, sy: 0.66,
              color: warm ? [1.0 * lum, 0.78 * lum, 0.42 * lum] : [0.45 * lum, 0.85 * lum, 1.0 * lum],
            })
          }
        }
        // A lit shopfront at street level on the road side.
        if (fi === 0 && r() > 0.3) {
          const c = new THREE.Color(NEON[b.seed % NEON.length])
          out.push({ x: b.x, y: y0 + 1.25, z: b.z + f.nz * (b.half + 0.05), face: f.face, sx: w * 0.7, sy: 1.0, color: [c.r * 0.95, c.g * 0.95, c.b * 0.95] })
        }
      })
    }
    return out
  }, [island])
  useFrame(() => {
    const mesh = ref.current
    if (!mesh || mesh.userData.placed) return
    mesh.userData.placed = true
    lights.forEach((l, i) => {
      mesh.setMatrixAt(i, tmp.m.compose(tmp.p.set(l.x, l.y, l.z), tmp.q.setFromAxisAngle(Y, l.face), tmp.s.set(l.sx, l.sy, 1)))
      mesh.setColorAt(i, tmp.c.setRGB(l.color[0], l.color[1], l.color[2]))
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.instanceColor.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[null, null, lights.length]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}

// The tower's windows. Each stop found lights the next band in the company colour. A stop marked
// as a headline spells its figure across the lower floors; the latest one found is the one shown.
function TowerLights({ island }) {
  const ref = useRef()
  const tower = island.extra.city.tower
  const { cols, rows } = tower
  const since = useMemo(() => sinceOf(island.id), [island])
  const count = island.stops.length
  const picks = useMemo(() => (island.data.districts ? island.data.districts.flatMap((d) => d.pickups) : island.data.pickups || []), [island])
  // Each stop's own figure, as one picture per line; a two-part figure shows its parts in turn.
  const figures = useMemo(() => picks.map((p) => (p.headline || p.kpi ? (p.headline || p.kpi).split(' ').map((line) => spell(line, cols)) : null)), [picks, cols])
  const brand = useMemo(() => new THREE.Color(island.data.brand.primary), [island])
  // The figure sits on the lower floors: the camera behind the car cuts off anything higher.
  const top = 9
  const cells = useMemo(() => {
    const y0 = island.h(tower.x, tower.z) + 2.4
    const out = []
    const pitchY = (tower.h - 3.2) / rows
    // The face the driver sees on the way in, and the face beside the road.
    for (const west of [true, false]) {
      const span = (west ? tower.d : tower.w) - 0.7
      const pitch = span / cols
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const along = (col - (cols - 1) / 2) * pitch
          const road = -tower.side
          out.push({
            x: west ? tower.x - tower.w / 2 - 0.05 : tower.x + along * road,
            y: y0 + row * pitchY,
            z: west ? tower.z + along : tower.z + road * (tower.d / 2 + 0.05),
            face: west ? -Math.PI / 2 : road > 0 ? 0 : Math.PI, sx: pitch * 0.74, sy: pitchY * 0.66, row, col,
          })
        }
      }
    }
    return out
  }, [island, cols, rows])
  useFrame(() => {
    const mesh = ref.current
    if (!mesh) return
    if (!mesh.userData.placed) {
      mesh.userData.placed = true
      cells.forEach((c, i) => mesh.setMatrixAt(i, tmp.m.compose(tmp.p.set(c.x, c.y, c.z), tmp.q.setFromAxisAngle(Y, c.face), tmp.s.set(c.sx, c.sy, 1))))
      mesh.instanceMatrix.needsUpdate = true
    }
    const times = Array.from({ length: count }, (_, i) => since(i))
    // Nothing to redraw once every light has settled.
    const turn = Math.floor(clock.t / 1.5)
    const key = times.map((t) => (t < 0 ? 'x' : t > 2.6 ? 'd' : t.toFixed(2))).join() + turn
    if (mesh.userData.key === key && !island.finish) return
    mesh.userData.key = key
    // The figure of the stop found most recently.
    let shown = -1
    figures.forEach((f, i) => { if (f && times[i] >= 0 && (shown < 0 || times[i] < times[shown])) shown = i })
    const figure = shown >= 0 ? figures[shown][turn % figures[shown].length] : null
    const tf = shown >= 0 ? times[shown] : -1
    cells.forEach((c, i) => {
      const stop = Math.min(count - 1, Math.floor((c.row * count) / rows))
      const t = times[stop]
      // Bands sweep on from left to right.
      const lit = t < 0 ? 0 : Math.min(1, Math.max(0, (t - c.col * 0.03) / 0.7))
      // The last station is the destination: its tower glows from pink at the foot to violet at
      // the top the whole time, and brightens as its stops are found.
      const hue = island.finish ? tmp.c.set('#ff36a9').lerp(VIOLET, c.row / rows) : brand
      const on0 = island.finish ? 0.42 + 0.14 * Math.sin(clock.t * 1.3 - c.row * 0.35) : 0
      const amt = Math.max(lit, on0)
      let r = 0.03 + (hue.r * 1.15 - 0.03) * amt
      let g = 0.04 + (hue.g * 1.15 - 0.04) * amt
      let b = 0.09 + (hue.b * 1.15 - 0.09) * amt
      const fy = top - c.row
      if (figure && fy >= 0 && fy < 7) {
        const f = Math.min(1, Math.max(0, (tf - c.col * 0.04) / 0.9))
        const on = figure[fy][c.col]
        // The figure's own lights go bright; the ones around it stay low so it reads.
        r += ((on ? 1.7 : 0.04 + brand.r * 0.13) - r) * f
        g += ((on ? 1.65 : 0.04 + brand.g * 0.13) - g) * f
        b += ((on ? 1.5 : 0.07 + brand.b * 0.13) - b) * f
      }
      mesh.setColorAt(i, tmp.c.setRGB(r, g, b))
    })
    mesh.instanceColor.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[null, null, cells.length]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}

function PlaceName({ island, b, text }) {
  const map = useMemo(() => textTexture(text, { w: 512, h: 128, bg: '#161b38', fg: '#f1e6c0', size: 78 }), [text])
  return (
    <mesh position={[b.x, 1.5, b.z - b.side * (b.half + 1.3)]} rotation={[0, b.side > 0 ? Math.PI : 0, 0]}>
      <planeGeometry args={[3.6, 0.9]} />
      <meshBasicMaterial map={map} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

export default function CityScenery({ island }) {
  const build = useMemo(() => buildCity(island), [island])
  return (
    <group>
      <Static build={build} deps={[build]} />
      <BlockLights island={island} />
      {island.extra.city.blocks.filter((b) => b.landmark).map((b) => (
        <PlaceName key={b.landmark} island={island} b={b} text={b.landmark === 'brussels' ? 'Brussels' : 'Madrid'} />
      ))}
      {island.extra.city.tower && <TowerLights island={island} />}
    </group>
  )
}
