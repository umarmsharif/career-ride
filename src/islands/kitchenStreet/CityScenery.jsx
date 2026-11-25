// Food Delivery Street as a night city block. Dark buildings line the road, and the company's
// tower shows the chapter filling up: each stop lights a band of its windows in the company
// colour, and the headline result is spelled across them.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ribbonXZ, rng } from '../../engine/kit.js'
import { baseRoad } from '../../engine/props.js'
import { Static } from '../../engine/IslandParts.jsx'
import { sinceOf } from '../../engine/state.js'
import { tower, blocks } from './city.js'
import { spell } from '../../engine/dots.js'

const since = sinceOf(6)
const WALLS = ['#3d477c', '#444f8a', '#363f70']
const NEON = ['#ff4fa3', '#4fe3ff', '#ffb347', '#b8ff4f']

function buildCity(island) {
  return (k) => {
    k.add(ribbonXZ(island.road, 13.5, 0.015), '#2e3558')
    baseRoad(k, island, { color: '#1d2138', edge: '#565d86', dash: '#f1e6c0' })
    for (const b of blocks) {
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
    k.at({ p: [t.x, 0, t.z] }, () => {
      k.box(t.w + 1.6, 3.6, t.d + 1.6, '#2a3052', { p: [0, -1.5, 0] })
      k.box(t.w + 0.8, 1.0, t.d + 0.8, '#232a4e', { p: [0, 0.7, 0] })
      k.box(t.w, t.h, t.d, '#0f1330', { p: [0, t.h / 2 + 0.2, 0] })
      k.box(t.w + 0.4, 0.5, t.d + 0.4, island.data.brand.primary, { p: [0, t.h + 0.45, 0] })
    })
    // The square in front of the tower: paving bands and a few low planters.
    for (let i = 0; i < 5; i++) k.box(0.25, 0.04, 9, '#39416a', { p: [11 + i * 4.2, 0.04, -6.5] })
    for (const [x, z] of [[12, -9.5], [19, -11], [25.5, -9.5]]) {
      k.at({ p: [x, 0, z] }, () => {
        k.box(2.2, 0.6, 2.2, '#343c66', { p: [0, 0.3, 0] })
        k.ball(0.9, '#2f6e5a', { p: [0, 1.1, 0] }, 0)
      })
    }
  }
}

const tmp = { m: new THREE.Matrix4(), q: new THREE.Quaternion(), p: new THREE.Vector3(), s: new THREE.Vector3(), c: new THREE.Color() }
const Y = new THREE.Vector3(0, 1, 0)

// Lit windows and shopfronts of the ordinary buildings: one mesh for the whole block.
function BlockLights({ island }) {
  const ref = useRef()
  const lights = useMemo(() => {
    const out = []
    for (const b of blocks) {
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

// The tower's windows. Each stop found lights the next band in the company colour; the stop
// marked as the headline spells its figure across the upper floors.
function TowerLights({ island }) {
  const ref = useRef()
  const { cols, rows } = tower
  const picks = useMemo(() => (island.data.districts ? island.data.districts.flatMap((d) => d.pickups) : island.data.pickups || []), [island])
  const headline = picks.findIndex((p) => p.headline)
  const figure = useMemo(() => (headline >= 0 ? spell(picks[headline].headline, cols) : null), [picks, headline, cols])
  const brand = useMemo(() => new THREE.Color(island.data.brand.primary), [island])
  // The figure sits on the lower floors: the camera behind the car cuts off anything higher.
  const top = 9
  const cells = useMemo(() => {
    const y0 = island.h(tower.x, tower.z) + 2.4
    const out = []
    const pitchY = (tower.h - 3.2) / rows
    for (const west of [true, false]) {
      const span = (west ? tower.d : tower.w) - 0.7
      const pitch = span / cols
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const along = (col - (cols - 1) / 2) * pitch
          out.push({
            x: west ? tower.x - tower.w / 2 - 0.05 : tower.x + along,
            y: y0 + row * pitchY,
            z: west ? tower.z + along : tower.z + tower.d / 2 + 0.05,
            face: west ? -Math.PI / 2 : 0, sx: pitch * 0.74, sy: pitchY * 0.66, row, col,
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
    const times = picks.map((_, i) => since(i))
    // Nothing to redraw once every light has settled.
    const key = times.map((t) => (t < 0 ? 'x' : t > 2.6 ? 'd' : t.toFixed(2))).join()
    if (mesh.userData.key === key) return
    mesh.userData.key = key
    const tf = headline >= 0 ? times[headline] : -1
    cells.forEach((c, i) => {
      const stop = Math.min(picks.length - 1, Math.floor((c.row * picks.length) / rows))
      const t = times[stop]
      // Bands sweep on from left to right.
      const lit = t < 0 ? 0 : Math.min(1, Math.max(0, (t - c.col * 0.03) / 0.7))
      let r = 0.03 + (brand.r * 1.15 - 0.03) * lit
      let g = 0.04 + (brand.g * 1.15 - 0.04) * lit
      let b = 0.09 + (brand.b * 1.15 - 0.09) * lit
      const fy = top - c.row
      if (figure && tf >= 0 && fy >= 0 && fy < 7) {
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

export default function CityScenery({ island }) {
  const build = useMemo(() => buildCity(island), [island])
  return (
    <group>
      <Static build={build} deps={[build]} />
      <BlockLights island={island} />
      <TowerLights island={island} />
    </group>
  )
}
