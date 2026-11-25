// The opening skyline: one tall tower per headline result, standing behind the first station
// while the title is up. Each tower's windows come on in its company colour and spell the figure.
// The towers are placed from the opening camera's own position, so they sit in the upper part of
// the picture on a wide screen and on a phone alike.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame } from './state.js'
import { spellLines } from './dots.js'
import { HEADLINES, opening, cue } from './headlines.js'

const COLS = 21
const ROWS = 18
const RAD = Math.PI / 180
const tmp = { m: new THREE.Matrix4(), q: new THREE.Quaternion(), p: new THREE.Vector3(), s: new THREE.Vector3(), c: new THREE.Color() }
const NONE = new THREE.Quaternion()

// Where the towers stand and how big their lights are, worked out from the opening camera
// (see the intro branch of the camera in Controller.jsx).
function layout(portrait, n) {
  const a = 2.5 + 0.06 * 3
  const r = portrait ? 118 : 86
  const camY = portrait ? 52 : 36
  const lookY = portrait ? -22 : -16
  const half = (portrait ? 62 : 46) / 2
  const aspect = typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 16 / 9
  const dist = r + (portrait ? 92 : 78)
  const pitch = Math.atan((camY - lookY) / r) / RAD
  // The band of the picture the figures use: from near the top down to just above the title.
  const top = camY - dist * Math.tan((pitch - half * 0.9) * RAD)
  const bottom = camY - dist * Math.tan((pitch - half * 0.46) * RAD)
  const wide = 2 * dist * Math.tan(Math.atan(Math.tan(half * RAD) * aspect) * 0.84)
  const gapCols = 6
  const px = Math.min(((top - bottom) / ROWS) * 0.72, wide / (n * (COLS + 2) + (n - 1) * gapCols))
  const py = px / 0.72
  const width = (COLS + 2) * px
  const fx = -Math.sin(a)
  const fz = -Math.cos(a)
  const cam = { x: -fx * r, z: -fz * r }
  const d = dist - r
  return Array.from({ length: n }, (_, i) => {
    const off = (i - (n - 1) / 2) * (width + gapCols * px)
    const x = fx * d + -fz * off
    const z = fz * d + fx * off
    return { x, z, yaw: Math.atan2(cam.x - x, cam.z - z), top, px, py, width }
  })
}

function Tower({ item, spot, index, fade }) {
  const lights = useRef()
  const body = useRef()
  const figure = useMemo(() => spellLines(item.text, COLS), [item])
  const brand = useMemo(() => new THREE.Color(item.color), [item])
  const depth = spot.width * 0.6
  const height = 190
  // The figure is centred in the band of lights.
  const first = Math.floor((ROWS - figure.length) / 2)
  useFrame(() => {
    const mesh = lights.current
    if (!mesh) return
    if (!mesh.userData.placed) {
      mesh.userData.placed = true
      let i = 0
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          tmp.p.set((col - (COLS - 1) / 2) * spot.px, -(row + 1.5) * spot.py, depth / 2 + 0.2)
          mesh.setMatrixAt(i++, tmp.m.compose(tmp.p, NONE, tmp.s.set(spot.px * 0.74, spot.py * 0.6, 1)))
        }
      }
      mesh.instanceMatrix.needsUpdate = true
    }
    const t = opening.at < 0 ? -1 : performance.now() / 1000 - opening.at - cue(index)
    const dim = fade.current
    const key = `${t < 0 ? 'x' : t > 2 ? 'd' : t.toFixed(2)}:${dim.toFixed(2)}`
    if (mesh.userData.key === key) return
    mesh.userData.key = key
    body.current.material.opacity = dim
    let i = 0
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        // The lights sweep on from the top floor down.
        const lit = t < 0 ? 0 : Math.min(1, Math.max(0, (t - row * 0.03) / 0.5))
        const on = figure[row - first]?.[col]
        const base = on ? 1.75 : 0.34
        const r = (0.05 + ((on ? base : brand.r * base) - 0.05) * lit) * dim
        const g = (0.06 + ((on ? base * 0.97 : brand.g * base) - 0.06) * lit) * dim
        const b = (0.12 + ((on ? base * 0.9 : brand.b * base) - 0.12) * lit) * dim
        mesh.setColorAt(i++, tmp.c.setRGB(r, g, b))
      }
    }
    mesh.instanceColor.needsUpdate = true
  })
  return (
    <group position={[spot.x, spot.top + spot.py * 2, spot.z]} rotation={[0, spot.yaw, 0]}>
      <mesh ref={body} position={[0, -height / 2, 0]}>
        <boxGeometry args={[spot.width, height, depth]} />
        <meshStandardMaterial color="#1a2150" roughness={0.9} flatShading transparent />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[spot.width + 1, 1.2, depth + 1]} />
        <meshBasicMaterial color={item.color} toneMapped={false} fog={false} transparent opacity={0.9} />
      </mesh>
      <instancedMesh ref={lights} args={[null, null, COLS * ROWS]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial toneMapped={false} fog={false} />
      </instancedMesh>
    </group>
  )
}

export default function Skyline() {
  const phase = useGame((s) => s.phase)
  const size = useThree((s) => s.size)
  const portrait = size.width / size.height < 0.9
  const spots = useMemo(() => layout(portrait, HEADLINES.length), [portrait])
  const fade = useRef(1)
  const [gone, setGone] = useState(false)
  // Once the drive starts the towers dim away, then leave the scene.
  useEffect(() => {
    if (phase === 'intro') return
    const id = setTimeout(() => setGone(true), 1600)
    return () => clearTimeout(id)
  }, [phase])
  useFrame((_, dt) => {
    if (phase !== 'intro') fade.current = Math.max(0, fade.current - dt / 1.2)
  })
  if (gone || !HEADLINES.length) return null
  return (
    <group>
      {HEADLINES.map((h, i) => (
        <Tower key={h.id} item={h} spot={spots[i]} index={i} fade={fade} />
      ))}
    </group>
  )
}
