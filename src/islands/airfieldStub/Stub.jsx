// A stub of island 7, The Airfield: enough to land on. The full island is Stage 2.
import { useMemo } from 'react'
import * as THREE from 'three'
import { Land, Static, Gate } from '../../engine/IslandParts.jsx'
import { rng } from '../../engine/kit.js'

const dir = new THREE.Vector3(16, 0, -18).normalize()
export const stub = { x: 153, y: 10, z: -44, dir, year: '2025', name: 'The Airfield' }

const FLAGS = ['#f0553f', '#f2a541', '#ffd23f', '#7cc36a', '#1f9d8f', '#58b7e6', '#6c7bd9', '#b07cd8', '#ff8fa3']

export default function AirfieldStub() {
  const outline = useMemo(() => {
    const pts = []
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2
      const r = 17.5 * (1 + 0.05 * Math.sin(a * 3 + 1) + 0.03 * Math.sin(a * 7))
      pts.push([Math.cos(a) * r, Math.sin(a) * r])
    }
    return pts
  }, [])
  const colors = useMemo(() => ({ lip: '#86c765', dirt: '#c98a5e', rock: '#a86b47', rock2: '#7d5241' }), [])
  const yaw = Math.atan2(dir.x, dir.z)
  return (
    <group position={[stub.x, stub.y, stub.z]}>
      <Land outline={outline} colors={colors} grass="#b4de7c" seed={11} />
      <Static
        build={(k) => {
          const r = rng(77)
          k.at({ r: [0, yaw, 0] }, () => {
            // Landing strip.
            k.box(6.4, 0.06, 30, '#59657a', { p: [0, 0.03, 0] })
            for (let i = -5; i <= 5; i++) k.box(0.3, 0.02, 1.4, '#fff6e4', { p: [0, 0.07, i * 2.6] })
            for (const s of [1, -1]) k.box(0.3, 0.02, 30, '#fff6e4', { p: [s * 2.9, 0.07, 0] })
            // Hangar and a toy plane.
            k.at({ p: [-9.5, 0, 2] }, () => {
              const g = new THREE.CylinderGeometry(3.4, 3.4, 6.4, 10, 1, false, 0, Math.PI)
              g.rotateZ(Math.PI / 2)
              g.rotateY(Math.PI / 2)
              k.add(g, '#f2a541', { p: [0, 0, 0], r: [0, 0, 0] })
              k.box(6.6, 0.4, 6.8, '#c9a27a', { p: [0, 0.2, 0] })
              k.box(0.3, 3.2, 5.6, '#22304f', { p: [3.3, 1.5, 0] })
            })
            k.at({ p: [8.6, 0, -3], r: [0, 0.6, 0] }, () => {
              k.cyl(0.55, 0.3, 4.2, '#fff6e4', { p: [0, 1.25, 0], r: [Math.PI / 2, 0, 0] }, 8)
              k.box(6.4, 0.14, 1.2, '#f0553f', { p: [0, 1.35, 0.6] })
              k.box(2.2, 0.12, 0.7, '#f0553f', { p: [0, 1.35, -1.8] })
              k.box(0.12, 0.9, 0.7, '#f0553f', { p: [0, 1.8, -1.8] })
              k.box(1.9, 0.14, 0.14, '#22304f', { p: [0, 1.25, 2.2] })
              k.ball(0.2, '#f2a541', { p: [0, 1.25, 2.15] })
              for (const s of [1, -1]) k.cyl(0.28, 0.28, 0.16, '#2c2f3a', { p: [s * 0.8, 0.3, 0.6], r: [0, 0, Math.PI / 2] }, 8)
            })
            // Windsock.
            k.cyl(0.08, 0.1, 4.6, '#fff6e4', { p: [9, 2.3, 9.5] }, 6)
            k.cone(0.45, 1.8, '#f0553f', { p: [9.9, 4.4, 9.5], r: [0, 0, -Math.PI / 2] }, 8)
          })
          // Eighteen plain flags, one for each market.
          for (let i = 0; i < 18; i++) {
            const a = (i / 18) * Math.PI * 2 + 0.3
            const x = Math.cos(a) * 15.4
            const z = Math.sin(a) * 15.4
            if (Math.abs(x * dir.z - z * dir.x) < 4.4) continue
            k.cyl(0.06, 0.08, 3.4, '#fff6e4', { p: [x, 1.7, z] }, 5)
            k.box(1.1, 0.7, 0.05, FLAGS[i % FLAGS.length], { p: [x + 0.55 * Math.cos(a + 1.57), 3.0, z + 0.55 * Math.sin(a + 1.57)], r: [0, -a - 1.57, 0] })
          }
          for (let i = 0; i < 16; i++) {
            const a = r() * 6.28
            const d = 5 + r() * 9
            const x = Math.cos(a) * d
            const z = Math.sin(a) * d
            if (Math.abs(x * dir.z - z * dir.x) < 4.6) continue
            k.ball(0.4 + r() * 0.4, '#6dbb5e', { p: [x, 0.25, z], s: [1.2, 0.8, 1.1] })
          }
        }}
      />
      <group position={[-dir.x * 14.5, 0, -dir.z * 14.5]}>
        <Gate x={0} z={0} year={stub.year} face={yaw} />
      </group>
    </group>
  )
}
