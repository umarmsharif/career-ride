// The 3D scene: the chain of nine islands and the roads between them.
// Only the island being ridden and the next one are mounted.
import { useEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Rider from './engine/Rider.jsx'
import Controller from './engine/Controller.jsx'
import { Land, Stops, Gate, Banner, Signboard, Sky, Lights, Static, Grounded, BrandSign, ProfileStand, toyMaterialDouble } from './engine/IslandParts.jsx'
import { buildRide, rideRibbon } from './engine/rideCurve.js'
import { rng } from './engine/kit.js'
import { useGame } from './engine/state.js'
import Cinematic, { sceneCost } from './engine/Cinematic.jsx'
import { VOYAGE } from './engine/world.js'
import { Sea, MirrorSea, Foam, Piers, Boat, Lighthouse, Gulls } from './engine/Voyage.jsx'

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

function Island({ entry, exitYear, lite }) {
  const { island, Scenery } = entry
  const h = island.h
  const brand = island.data.brand
  const bs = island.brandSign ?? { x: island.sign.x, z: island.sign.z, y: 7.4, face: island.sign.face }
  const st = island.profileStand
  return (
    <>
      <Land island={island} seed={island.id * 3 + 1} />
      {VOYAGE && <Foam outline={island.outline} />}
      {!lite && (
        <Grounded island={island}>
          <Scenery island={island} />
        </Grounded>
      )}
      {!lite && <Stops island={island} />}
      {!lite && (
        <>
      <Signboard id={island.id} {...island.sign} y={h(island.sign.x, island.sign.z)} brand={brand} />
      <ProfileStand id={island.id} x={st.x} z={st.z} y={h(st.x, st.z)} face={island.sign.face} color={brand.primary} />
      <BrandSign brand={brand} {...bs} y={h(bs.x, bs.z) + bs.y} />
        </>
      )}
      <Gate {...island.entranceGate} y={h(island.entranceGate.x, 0)} year={island.startYear} />
      {VOYAGE && !lite && <Lighthouse {...(island.exitGate ? { x: island.exitGate.x - 1.5, z: 8.2, scale: 0.8 } : { x: island.finish.x + 4.6, z: -8.6, scale: 1.35 })} y={h(island.exitGate ? island.exitGate.x - 1.5 : island.finish.x + 4.6, island.exitGate ? 8.2 : -8.6)} />}
      {island.exitGate && <Gate {...island.exitGate} y={h(island.exitGate.x, 0)} year={exitYear} glow />}
      {!lite &&
        island.banners.map((b, i) => (
          <Banner key={i} {...b} y={h(b.x, b.z)} text={b.text ?? island.districts[b.district ?? 0]} />
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
      // Islands sit nearly in line, so the road between them goes up and down rather than side to side.
      const d = new THREE.Vector3(a.len + b.len + GAP, VOYAGE ? 0 : a.ride.dy, a.ride.dz * 0.3)
      origins.push(origins[i].clone().add(d))
      rides.push(
        buildRide({
          start: { x: a.exitGate.x + 0.8, y: a.h(a.exitGate.x + 0.8, a.exitGate.z), z: a.exitGate.z },
          end: { x: d.x + b.spawn.x, y: d.y + b.h(b.spawn.x, b.spawn.z), z: d.z + b.spawn.z },
          tip: { x: d.x - b.len },
          style: VOYAGE ? 'voyage' : 'hills',
          side: 1,
        })
      )
    }
    return { origins, rides }
  }, [islands])

  useEffect(() => {
    scene.fog = new THREE.Fog('#d9eef6', 150, 430)
    window.__ride = { ...(window.__ride || {}), info: () => (gl.info.autoReset ? { ...gl.info.render } : { ...sceneCost }), rides }
  }, [scene, gl, rides])

  // The next island is only drawn once the rider is heading for it, to stay inside the budget.
  // While both are in view only one has its scenery: the one being left for the first part of
  // the ride, the one being approached for the rest. The other is bare land.
  const leaving = useGame((s) => s.phase === 'ride' || s.nearExit)
  const late = useGame((s) => s.phase === 'ride' && s.rideLate)
  const cinematic = useGame((s) => s.cinematic && !s.touch)
  const mounted = (leaving ? [current, current + 1] : [current]).filter((i) => i < islands.length)
  return (
    <>
      <Sky />
      <Lights />
      {VOYAGE ? (
        <>
          {cinematic ? <MirrorSea offset={origins[current]} /> : <Sea offset={origins[current]} />}
          <Gulls />
        </>
      ) : (
        <Backdrop />
      )}
      <group ref={worldRef}>
        {mounted.map((i) => (
          <group key={islands[i].id} position={origins[i]}>
            <Island entry={entries[i]} exitYear={islands[i + 1]?.startYear} lite={leaving && (i === current) === late} />
            {rides[i] && i === current && !VOYAGE && <RideRoad ride={rides[i]} tipX={origins[i + 1].x - origins[i].x - islands[i + 1].len} endY={islands[i].ride.dy + islands[i + 1].h(islands[i + 1].spawn.x, 0)} />}
            {rides[i] && i === current && VOYAGE && (
              <>
                <Piers ride={rides[i]} tipX={origins[i + 1].x - origins[i].x - islands[i + 1].len} endY={islands[i + 1].h(islands[i + 1].spawn.x, 0)} />
                <Boat ride={rides[i]} sail={islands[i + 1].data.brand.primary} />
              </>
            )}
          </group>
        ))}
      </group>
      {cinematic && <Cinematic />}
      <Rider ids={islands.map((i) => i.id)} />
      <Controller islands={islands} origins={origins} rides={rides} worldRef={worldRef} />
    </>
  )
}
