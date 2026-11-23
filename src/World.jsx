// The 3D scene: the chain of nine islands and the roads between them.
// Only the island being ridden and the next one are mounted.
import { useEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Rider from './engine/Rider.jsx'
import Controller from './engine/Controller.jsx'
import { Land, Stops, Gate, Banner, Signboard, Sky, Lights, Static, toyMaterialDouble } from './engine/IslandParts.jsx'
import { buildRide, rideRibbon } from './engine/rideCurve.js'
import { rng } from './engine/kit.js'
import { useGame } from './engine/state.js'

const GAP = 118

function RideRoad({ ride, tipX, endY }) {
  const geo = useMemo(() => rideRibbon(ride, { until: (p) => p.x > tipX + 1.2 && Math.abs(p.y - endY) < 0.3 }), [ride, tipX, endY])
  return (
    <>
      <mesh geometry={geo} material={toyMaterialDouble} receiveShadow />
      <Static
        deps={[ride]}
        build={(k) => {
          // Floating rocks under the track, so it reads as held up by something.
          const r = rng(5)
          for (let i = 60; i < ride.frames.length - 80; i += 34) {
            const f = ride.frames[i]
            k.at({ p: [f.p.x, f.p.y - 2.3, f.p.z], r: [0, r() * 6, 0] }, () => {
              k.cone(1.9 + r(), 3.4 + r() * 2, '#a86b47', { p: [0, -1.9, 0], r: [Math.PI, 0, 0] }, 6)
              k.cyl(2.1, 1.9, 0.5, '#86c765', { p: [0, 0, 0] }, 6)
            })
          }
        }}
      />
    </>
  )
}

function Island({ entry, exitYear }) {
  const { island, Scenery } = entry
  return (
    <>
      <Land outline={island.outline} colors={island.land} grass={island.grass} seed={island.id * 3 + 1} />
      <Scenery island={island} />
      <Stops island={island} />
      <Signboard id={island.id} {...island.sign} />
      <Gate {...island.entranceGate} year={island.startYear} />
      {island.exitGate && <Gate {...island.exitGate} year={exitYear} glow />}
      {island.banners.map((b, i) => (
        <Banner key={i} {...b} text={b.text ?? island.districts[b.district ?? 0]} />
      ))}
    </>
  )
}

function Backdrop() {
  // Small islands drifting in the distance, wherever the rider is.
  return (
    <Static
      build={(k) => {
        for (const [x, y, z, s] of [[-70, -8, -90, 1.4], [20, 14, -130, 1.8], [110, -16, 80, 1.6], [-40, 6, 105, 1.2], [150, 20, 120, 1.5], [-120, 12, 30, 1.3]]) {
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
  )
}

export default function World({ entries }) {
  const islands = useMemo(() => entries.map((e) => e.island), [entries])
  const worldRef = useRef()
  const current = useGame((s) => s.island)
  const { scene, gl } = useThree()

  // Where each island sits in the world, and the ride from each one to the next.
  const { origins, rides } = useMemo(() => {
    const origins = [new THREE.Vector3()]
    const rides = []
    for (let i = 0; i < islands.length - 1; i++) {
      const a = islands[i]
      const b = islands[i + 1]
      const d = new THREE.Vector3(a.len + b.len + GAP, a.ride.dy, a.ride.dz)
      origins.push(origins[i].clone().add(d))
      rides.push(
        buildRide({
          start: { x: a.exitGate.x + 0.8, z: a.exitGate.z },
          end: { x: d.x + b.spawn.x, y: d.y, z: d.z + b.spawn.z },
          tip: { x: d.x - b.len },
          style: a.ride.style,
          side: a.ride.dz <= 0 ? 1 : -1,
        })
      )
    }
    return { origins, rides }
  }, [islands])

  useEffect(() => {
    scene.fog = new THREE.Fog('#d9eef6', 150, 430)
    window.__ride = { ...(window.__ride || {}), info: () => ({ ...gl.info.render }) }
  }, [scene, gl])

  // The next island is only drawn once the rider is heading for it, to stay inside the budget.
  const leaving = useGame((s) => s.phase === 'ride' || s.nearExit)
  const mounted = (leaving ? [current, current + 1] : [current]).filter((i) => i < islands.length)
  return (
    <>
      <Sky />
      <Lights />
      <Backdrop />
      <group ref={worldRef}>
        {mounted.map((i) => (
          <group key={islands[i].id} position={origins[i]}>
            <Island entry={entries[i]} exitYear={islands[i + 1]?.startYear} />
            {rides[i] && i === current && <RideRoad ride={rides[i]} tipX={origins[i + 1].x - origins[i].x - islands[i + 1].len} endY={islands[i].ride.dy} />}
          </group>
        ))}
      </group>
      <Rider />
      <Controller islands={islands} origins={origins} rides={rides} worldRef={worldRef} />
    </>
  )
}
