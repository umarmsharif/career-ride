// The 3D scene for Stage 1: Kitchen Street, the road out, and the Airfield stub.
import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Rider from './engine/Rider.jsx'
import Controller from './engine/Controller.jsx'
import { Land, Pickups, Gate, Banner, Signboard, Sky, Lights, Static, toyMaterialDouble } from './engine/IslandParts.jsx'
import { buildRide, rideRibbon } from './engine/rideCurve.js'
import { rng } from './engine/kit.js'
import island from './islands/kitchenStreet/layout.js'
import KitchenStreetScenery from './islands/kitchenStreet/Scenery.jsx'
import AirfieldStub, { stub } from './islands/airfieldStub/Stub.jsx'

const LAND_COLORS = { lip: '#86c765', dirt: '#c98a5e', rock: '#a86b47', rock2: '#7d5241' }

function RideRoad({ ride }) {
  const geo = useMemo(() => rideRibbon(ride, { until: (p) => Math.hypot(p.x - stub.x, p.z - stub.z) < 16.6 }), [ride])
  return (
    <>
      <mesh geometry={geo} material={toyMaterialDouble} receiveShadow />
      <Static
        deps={[ride]}
        build={(k) => {
          // Floating rocks under the track, so it reads as held up by something.
          const r = rng(5)
          for (let i = 60; i < ride.frames.length - 50; i += 34) {
            const f = ride.frames[i]
            if (Math.hypot(f.p.x - stub.x, f.p.z - stub.z) < 24) continue
            k.at({ p: [f.p.x, f.p.y - 2.3, f.p.z], r: [0, r() * 6, 0] }, () => {
              k.cone(1.9 + r(), 3.4 + r() * 2, '#a86b47', { p: [0, -1.9, 0], r: [Math.PI, 0, 0] }, 6)
              k.cyl(2.1, 1.9, 0.5, '#86c765', { p: [0, 0, 0] }, 6)
            })
          }
          // Small islands drifting in the distance.
          for (const [x, y, z, s] of [[-70, -8, -70, 1.4], [20, 12, -110, 1.8], [110, -14, 60, 1.6], [-30, 6, 95, 1.2], [215, 2, -10, 1.7], [95, -6, -120, 1.3]]) {
            k.at({ p: [x, y, z], s }, () => {
              k.cone(6, 9, '#a86b47', { p: [0, -4.5, 0], r: [Math.PI, 0, 0] }, 7)
              k.cyl(6.3, 6, 1, '#93cd62', { p: [0, 0.4, 0] }, 7)
              k.cyl(0.3, 0.4, 2, '#8b5e3c', { p: [1, 1.8, 0.5] }, 6)
              k.ball(2, '#5fae5a', { p: [1, 4, 0.5] })
              k.ball(1.2, '#7cc36a', { p: [-2.2, 1.6, -1] })
            })
          }
        }}
      />
    </>
  )
}

export default function World() {
  const ride = useMemo(() => buildRide({ start: { x: island.exitGate.x + 0.8, z: island.exitGate.z }, stub }), [])
  const { scene, gl } = useThree()
  useEffect(() => {
    scene.fog = new THREE.Fog('#d9eef6', 120, 380)
    window.__ride = { ...(window.__ride || {}), info: () => ({ ...gl.info.render }) }
  }, [scene, gl])

  return (
    <>
      <Sky />
      <Lights />
      <Land outline={island.outline} colors={LAND_COLORS} />
      <KitchenStreetScenery />
      <Pickups pickups={island.pickups} />
      <Signboard {...island.sign} />
      <Gate {...island.entranceGate} />
      <Gate {...island.exitGate} glow />
      {island.banners.map((b) => (
        <Banner key={b.text} {...b} />
      ))}
      <RideRoad ride={ride} />
      <AirfieldStub />
      <Rider />
      <Controller island={island} ride={ride} stub={stub} />
    </>
  )
}
