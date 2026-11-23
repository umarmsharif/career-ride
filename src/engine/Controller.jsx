// One loop that moves the rider, fires triggers and drives the camera.
// It works in the current island's own coordinates: the world is slid under the rider
// so the island being ridden always sits at the origin.
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { rider, clock, input, useGame, damp, clamp, wrapAngle, smooth } from './state.js'
import { insideOutline } from './kit.js'
import { audio } from './sound.js'

const MAX_SPEED = 10.5
const REVERSE_SPEED = -3
const WHEEL_R = 0.42 * 1.18
const Y_AXIS = new THREE.Vector3(0, 1, 0)
const READ_TIME = 4.6

export default function Controller({ islands, origins, rides, worldRef }) {
  const { camera, size } = useThree()
  const s = useRef({
    camHeading: Math.PI / 2,
    look: new THREE.Vector3(0, 2, 0),
    camPos: new THREE.Vector3(),
    fallT: 0,
    rideS: 0,
    rideT: 0,
    rideFrom: new THREE.Vector3(),
    rideFromQ: new THREE.Quaternion(),
    tourIdx: 0,
    waitUntil: 0,
    introT: 0,
    closeT: 0,
    lastPhase: '',
    lastReset: -1,
    lastAuto: false,
    snap: true,
    zoom: 1,
    idx: 0,
  }).current
  const sample = useMemo(
    () => ({ pos: new THREE.Vector3(), tangent: new THREE.Vector3(0, 0, 1), left: new THREE.Vector3(1, 0, 0), normal: new THREE.Vector3(), quat: new THREE.Quaternion(), bank: 0 }),
    []
  )
  const tmp = useMemo(() => ({ v: new THREE.Vector3(), w: new THREE.Vector3(), d: new THREE.Vector3() }), [])

  useEffect(() => {
    const map = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' }
    const onKey = (down) => (e) => {
      const k = map[e.code]
      if (!k) return
      if (e.target?.closest?.('button, a')) return
      e.preventDefault()
      input[k] = down
      const g = useGame.getState()
      if (down && g.autopilot && !g.touch && g.phase === 'island') g.setAutopilot(false)
    }
    const kd = onKey(true)
    const ku = onKey(false)
    const blur = () => Object.keys(input).forEach((k) => (input[k] = false))
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
      window.removeEventListener('blur', blur)
    }
  }, [])

  function placeAtSpawn(island) {
    rider.pos.set(island.spawn.x, 0, island.spawn.z)
    rider.heading = island.spawn.heading
    rider.speed = 0
    rider.lean = 0
    rider.steer = 0
    rider.tumble = 0
    rider.quat.setFromAxisAngle(Y_AXIS, rider.heading)
    s.tourIdx = 0
    s.waitUntil = 0
  }

  function nearestTourIndex(island) {
    let best = 0
    let bd = Infinity
    island.tour.forEach(([x, z], i) => {
      const d = (x - rider.pos.x) ** 2 + (z - rider.pos.z) ** 2
      if (d < bd) {
        bd = d
        best = i
      }
    })
    return Math.min(island.tour.length - 1, best + 1)
  }

  function stepIsland(dt, g, island) {
    let turn = 0
    let throttle = 0
    if (g.autopilot) {
      if (g.waiting) {
        if (!g.touch && clock.t > s.waitUntil) g.resume()
      } else {
        const target = island.tour[s.tourIdx]
        const dx = target[0] - rider.pos.x
        const dz = target[1] - rider.pos.z
        const dist = Math.hypot(dx, dz)
        const diff = wrapAngle(Math.atan2(dx, dz) - rider.heading)
        turn = clamp(diff * 2.6, -1, 1)
        throttle = Math.abs(diff) > 0.9 ? 0.4 : 0.82
        if (dist < 1.5) {
          if (s.tourIdx === island.signStop && !g.signRead[island.id]) {
            useGame.setState({ waiting: true, signRead: { ...g.signRead, [island.id]: true } })
            s.waitUntil = clock.t + READ_TIME + 1.5
          }
          if (s.tourIdx < island.tour.length - 1) s.tourIdx++
        }
      }
    } else {
      turn = (input.left ? 1 : 0) - (input.right ? 1 : 0)
      throttle = (input.up ? 1 : 0) - (input.down ? 1 : 0)
    }

    const target = throttle > 0 ? MAX_SPEED * throttle : throttle < 0 ? REVERSE_SPEED : 0
    const braking = (throttle < 0 && rider.speed > 0) || (g.autopilot && g.waiting)
    const rate = braking ? 20 : throttle !== 0 ? 8.5 : 4.5
    rider.speed += clamp(target - rider.speed, -rate * dt, rate * dt)

    // A bicycle turns with its speed, but never gets stuck at a standstill.
    const turnRate = 2.3 * clamp(Math.abs(rider.speed) / 5, 0.3, 1)
    rider.heading += turn * turnRate * dt * (rider.speed < -0.2 ? -1 : 1)
    rider.steer = damp(rider.steer, turn * 0.5, 10, dt)
    rider.lean = damp(rider.lean, -turn * 0.3 * clamp(rider.speed / MAX_SPEED, 0, 1), 6, dt)

    const step = rider.speed * dt
    rider.pos.x += Math.sin(rider.heading) * step
    rider.pos.z += Math.cos(rider.heading) * step
    rider.wheel += step / WHEEL_R
    rider.pedalling = throttle > 0 && rider.speed > 0.3
    if (rider.pedalling) rider.pedal += step * 0.95

    for (const c of island.colliders) {
      const dx = rider.pos.x - c.x
      const dz = rider.pos.z - c.z
      const d = Math.hypot(dx, dz)
      const min = c.r + 0.55
      if (d < min && d > 0.0001) {
        rider.pos.x = c.x + (dx / d) * min
        rider.pos.z = c.z + (dz / d) * min
        rider.speed *= 1 - 2.5 * dt
      }
    }
    rider.quat.setFromAxisAngle(Y_AXIS, rider.heading)

    // Triggers.
    const patch = {}
    island.stops.forEach((p, i) => {
      const d2 = (p.x - rider.pos.x) ** 2 + (p.z - rider.pos.z) ** 2
      const key = `${island.id}:${i}`
      const had = g.collected.includes(key)
      if (!had && d2 < 2.3 ** 2) {
        g.collect(island.id, i)
        audio.chime()
        if (g.autopilot) {
          patch.waiting = true
          s.waitUntil = clock.t + READ_TIME + (p.kind === 'fact' ? 0 : 3)
        }
      } else if (had && p.kind !== 'fact' && !g.autopilot) {
        // Machines and boards reopen when the rider comes back to them.
        const isOpen = g.open && g.open.island === g.island && g.open.index === i
        if (d2 < 2.3 ** 2 && !isOpen && !s.left?.[key]) g.collect(island.id, i)
        if (d2 > 5 ** 2) (s.left ||= {})[key] = false
        else if (isOpen) (s.left ||= {})[key] = true
      }
    })
    const nearSign = Math.hypot(island.sign.x - rider.pos.x, island.sign.z - rider.pos.z) < island.sign.radius
    if (nearSign !== g.nearSign) patch.nearSign = nearSign
    if (nearSign && !g.signRead[island.id] && !g.autopilot) patch.signRead = { ...g.signRead, [island.id]: true }
    const district = island.districtAt(rider.pos.x, rider.pos.z)
    if (district !== g.district) patch.district = district
    const ex = island.exitGate
    const nearExit = !!ex && Math.hypot(ex.x - rider.pos.x, ex.z - rider.pos.z) < 9
    if (nearExit !== g.nearExit) patch.nearExit = nearExit
    if (Object.keys(patch).length) useGame.setState(patch)

    if (ex && rider.pos.x > ex.x + 0.6 && Math.abs(rider.pos.z - ex.z) < ex.halfWidth) {
      s.rideS = 0
      s.rideT = 0
      s.rideFrom.copy(rider.pos)
      s.rideFromQ.copy(rider.quat)
      useGame.setState({ phase: 'ride', open: null, waiting: false, nearSign: false, nearExit: false, year: island.endYear })
      return
    }
    const fin = island.finish
    if (fin && Math.hypot(fin.x - rider.pos.x, fin.z - rider.pos.z) < fin.radius) {
      s.closeT = 0
      rider.speed = 0
      rider.pedalling = false
      useGame.setState({ phase: 'closing', open: null, waiting: false, nearSign: false })
      return
    }
    if (!insideOutline(island.outline, rider.pos.x, rider.pos.z)) {
      s.fallT = 0
      audio.whoosh()
      useGame.setState({ phase: 'falling', open: null, nearSign: false })
    }
  }

  function stepFall(dt, island) {
    s.fallT += dt
    rider.pos.x += Math.sin(rider.heading) * rider.speed * dt * 0.6
    rider.pos.z += Math.cos(rider.heading) * rider.speed * dt * 0.6
    rider.pos.y -= (4 + s.fallT * 26) * dt
    rider.tumble += dt * 3.2
    if (s.fallT > 1.25) {
      placeAtSpawn(island)
      s.tourIdx = 1
      useGame.setState({ phase: 'island', waiting: false })
    }
  }

  function stepRide(dt, g) {
    const ride = rides[s.idx]
    const next = islands[s.idx + 1]
    s.rideT += dt
    const remaining = ride.length - s.rideS
    const target = Math.min(21, 4 + remaining * 0.6)
    rider.speed = damp(rider.speed, target, 1.6, dt)
    s.rideS = Math.min(ride.length, s.rideS + rider.speed * dt)
    ride.sample(s.rideS / ride.length, sample)
    const blend = smooth(s.rideT / 0.9)
    rider.pos.lerpVectors(s.rideFrom, sample.pos, blend)
    rider.quat.slerpQuaternions(s.rideFromQ, sample.quat, blend)
    rider.lean = damp(rider.lean, 0, 5, dt)
    rider.steer = damp(rider.steer, -sample.bank * 0.35, 5, dt)
    rider.wheel += (rider.speed * dt) / WHEEL_R
    rider.pedalling = true
    rider.pedal += rider.speed * dt * 0.55
    // The year counter ticks from the year being left to the year being entered.
    const u = s.rideS / ride.length
    const a = islands[s.idx].endYear
    const b = next.startYear
    const year = Math.round(a + (b - a) * smooth((u - 0.15) / 0.6))
    if (year !== g.year) {
      useGame.setState({ year })
      audio.tick()
    }
    if (remaining < 0.2) {
      // Arrive: slide the world so the new island sits at the origin.
      tmp.d.copy(origins[s.idx + 1]).sub(origins[s.idx])
      rider.pos.sub(tmp.d)
      rider.pos.y = 0
      s.camPos.sub(tmp.d)
      s.look.sub(tmp.d)
      s.idx += 1
      rider.heading = Math.PI / 2
      rider.quat.setFromAxisAngle(Y_AXIS, rider.heading)
      rider.speed = 5
      s.camHeading = rider.heading
      s.tourIdx = 0
      s.zoom = 1
      worldRef.current.position.copy(origins[s.idx]).multiplyScalar(-1)
      const visited = g.visited.includes(s.idx) ? g.visited : [...g.visited, s.idx]
      useGame.setState({ phase: 'island', island: s.idx, visited, year: null, district: 0, splash: g.splash + 1 })
    }
  }

  function updateCamera(dt, phase, island) {
    const portrait = size.width / size.height < 0.9
    const fov = portrait ? 62 : 46
    if (camera.fov !== fov) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
    const want = tmp.v
    const look = tmp.w
    let kPos = 3.2
    const kLook = 6
    if (phase === 'intro') {
      s.introT += dt
      const a = 2.5 + s.introT * 0.06
      const r = portrait ? 118 : 86
      want.set(Math.sin(a) * r, portrait ? 52 : 36, Math.cos(a) * r)
      look.set(0, portrait ? -22 : -16, 0)
      kPos = 1.5
    } else if (phase === 'ride') {
      const ride = rides[s.idx]
      const u = s.rideS / ride.length
      const dist = portrait ? 17 : 13
      const swing = Math.sin(u * Math.PI * 2.2 + 0.6)
      const settle = smooth((1 - u) / 0.12)
      want.copy(rider.pos)
        .addScaledVector(sample.tangent, -dist * (0.75 + 0.25 * Math.cos(u * Math.PI * 2)))
        .addScaledVector(Y_AXIS, 5 + 3.2 * Math.sin(u * Math.PI))
        .addScaledVector(sample.left, (-sample.bank * 16 + swing * 6.5) * settle)
      look.copy(rider.pos).addScaledVector(sample.tangent, 3).addScaledVector(Y_AXIS, 1.4)
      kPos = 2.2
    } else if (phase === 'closing') {
      s.closeT += dt
      const a = s.closeT * 0.14 + 4.2
      const r = portrait ? 34 : 26
      want.set(rider.pos.x + Math.sin(a) * r, 11, rider.pos.z + Math.cos(a) * r)
      look.set(rider.pos.x, portrait ? -1 : 0.5, rider.pos.z)
      kPos = 1.2
    } else if (phase === 'falling') {
      want.copy(s.camPos)
      look.set(rider.pos.x, Math.max(rider.pos.y, -10) + 1, rider.pos.z)
    } else {
      s.camHeading += wrapAngle(rider.heading - s.camHeading) * (1 - Math.exp(-2.6 * dt))
      const dist = portrait ? 15 : 10.2
      const height = portrait ? 10 : 7.2
      want.set(rider.pos.x - Math.sin(s.camHeading) * dist, height, rider.pos.z - Math.cos(s.camHeading) * dist)
      const ahead = 4.5 * s.zoom * s.zoom
      look.set(rider.pos.x + Math.sin(s.camHeading) * ahead, 1.0, rider.pos.z + Math.cos(s.camHeading) * ahead)
    }
    if (phase === 'island') {
      // Pull the camera in when a building or gate would sit between it and the rider.
      const bx = rider.pos.x
      const bz = rider.pos.z
      const by = 1.5
      const dx = bx - want.x
      const dz = bz - want.z
      const a = dx * dx + dz * dz
      let need = 1
      for (const list of [island.colliders, island.blockers]) {
        for (const c of list) {
          const fx = want.x - c.x
          const fz = want.z - c.z
          const b = 2 * (fx * dx + fz * dz)
          const disc = b * b - 4 * a * (fx * fx + fz * fz - c.r * c.r)
          if (disc <= 0) continue
          const root = Math.sqrt(disc)
          const t1 = (-b - root) / (2 * a)
          const t2 = (-b + root) / (2 * a)
          if (t2 <= 0 || t1 >= 1 || t2 >= 0.97) continue
          if (want.y + (by - want.y) * t2 > (c.h ?? 7)) continue
          need = Math.min(need, 1 - (t2 + 0.03))
        }
      }
      need = Math.max(need, 0.5)
      s.zoom = damp(s.zoom, need, need < s.zoom ? 9 : 1.6, dt)
      if (s.snap) s.zoom = need
      want.set(bx + (want.x - bx) * s.zoom, by + (want.y - by) * s.zoom, bz + (want.z - bz) * s.zoom)
    }
    if (s.snap) {
      s.camPos.copy(want)
      s.look.copy(look)
      s.snap = false
    } else {
      s.camPos.lerp(want, 1 - Math.exp(-kPos * dt))
      s.look.lerp(look, 1 - Math.exp(-kLook * dt))
    }
    camera.position.copy(s.camPos)
    camera.lookAt(s.look)
  }

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    clock.t += dt
    const g = useGame.getState()
    if (g.resetKey !== s.lastReset) {
      // A jump from the map, or a restart: put the rider at that island's entrance.
      s.lastReset = g.resetKey
      s.idx = g.island
      placeAtSpawn(islands[s.idx])
      s.camHeading = rider.heading
      s.snap = true
      s.left = {}
    }
    const island = islands[s.idx]
    worldRef.current.position.copy(origins[s.idx]).multiplyScalar(-1)
    if (g.phase !== s.lastPhase) {
      if (g.phase === 'island' && g.autopilot && s.lastPhase === 'intro') s.tourIdx = nearestTourIndex(island)
      s.lastPhase = g.phase
    }
    if (g.autopilot !== s.lastAuto) {
      if (g.autopilot && g.phase === 'island') s.tourIdx = nearestTourIndex(island)
      s.lastAuto = g.autopilot
    }
    // `__timeScale` is a test hook: it runs the simulation several steps per frame.
    for (let n = window.__timeScale || 1; n > 0; n--) {
      if (n < (window.__timeScale || 1)) clock.t += dt
      const now = useGame.getState()
      if (now.phase === 'island') stepIsland(dt, now, islands[s.idx])
      else if (now.phase === 'falling') stepFall(dt, islands[s.idx])
      else if (now.phase === 'ride') stepRide(dt, now)
    }
    audio.update(g, rider, island)
    updateCamera(dt, useGame.getState().phase, islands[s.idx])
  })

  // Hooks for automated screenshots.
  useEffect(() => {
    window.__ride = {
      ...(window.__ride || {}),
      rider,
      game: useGame,
      islands,
      teleport(x, z, heading) {
        rider.pos.set(x, 0, z)
        if (heading !== undefined) rider.heading = heading
        s.camHeading = rider.heading
        s.snap = true
      },
      jumpRide(u) {
        s.rideS = rides[s.idx].length * u
      },
    }
  }, [])

  return null
}
