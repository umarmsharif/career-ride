// Night Drive, one district. A dark city seen from a fixed high angle; a car follows the route
// and every stop switches on the part of the city around it and lights its figure on a tower.
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js'
import { Kit, rng } from '../engine/kit.js'
import { buildCity, CAM_DIR, XS, ZS, BLOCK, BOARD } from './city.js'
import { useNight, car, keys } from './nightState.js'

const LIME = '#C8FF3D'
const SIGN_YAW = CAM_DIR.az
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt))
const sm = (t) => {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}
const wrap = (a) => {
  while (a > Math.PI) a -= Math.PI * 2
  while (a < -Math.PI) a += Math.PI * 2
  return a
}

const solid = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.85 })

function glowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.35, 'rgba(255,255,255,0.45)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

// Neon lettering: glowing text on a transparent board.
function neonTexture(text, color, { w = 1024, h = 256, size = 150, font = '"IBM Plex Mono", ui-monospace, monospace', weight = 600 } = {}) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  const draw = () => {
    const g = c.getContext('2d')
    g.clearRect(0, 0, w, h)
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    let px = size
    g.font = `${weight} ${px}px ${font}`
    const tw = g.measureText(text).width
    if (tw > w * 0.9) px *= (w * 0.9) / tw
    g.font = `${weight} ${px}px ${font}`
    g.shadowColor = color
    g.shadowBlur = px * 0.35
    g.fillStyle = color
    g.fillText(text, w / 2, h / 2)
    g.shadowBlur = px * 0.12
    g.fillStyle = '#ffffff'
    g.globalAlpha = 0.75
    g.fillText(text, w / 2, h / 2)
    g.globalAlpha = 1
    tex.needsUpdate = true
  }
  draw()
  if (document.fonts?.load) document.fonts.load(`${weight} 80px "IBM Plex Mono"`).then(draw).catch(() => {})
  return tex
}

// --- the fixed city ----------------------------------------------------------

function CityBlocks({ city }) {
  const geo = useMemo(() => {
    const k = new Kit()
    const r = rng(5)
    const tones = ['#232c52', '#2b3460', '#1f2748', '#342c58', '#0c1022']
    for (const b of city.blocks) {
      k.box(BLOCK, 0.3, BLOCK, '#1c2440', { p: [b.cx, 0.15, b.cz] })
      k.box(BLOCK + 0.5, 0.2, BLOCK + 0.5, '#2f3962', { p: [b.cx, 0.1, b.cz] })
    }
    for (const b of city.buildings) {
      k.box(b.w, b.h, b.d, tones[b.tone], { p: [b.x, b.h / 2 + 0.3, b.z] })
      k.box(b.w + 0.3, 0.35, b.d + 0.3, '#2c3460', { p: [b.x, b.h + 0.45, b.z] })
      if (b.tower) {
        // A scoreboard: a dark face framed like a display, with masts on the roof.
        k.box(b.w + 0.5, 0.5, 0.5, '#3b4680', { p: [b.x, b.h + 0.1, b.z + b.d / 2] })
        k.box(b.w + 0.5, 0.5, 0.5, '#3b4680', { p: [b.x, 0.55, b.z + b.d / 2] })
        for (const sx of [1, -1]) k.box(0.5, b.h, 0.5, '#3b4680', { p: [b.x + sx * (b.w / 2), b.h / 2 + 0.3, b.z + b.d / 2] })
        for (const sx of [1, -1]) k.cyl(0.1, 0.14, 5, '#3a4270', { p: [b.x + sx * 6.5, b.h + 2.8, b.z - 3] }, 5)
      } else if (b.tier) {
        k.box(b.w * 0.62, b.tier, b.d * 0.62, tones[(b.tone + 1) % 4], { p: [b.x - b.w * 0.12, b.h + 0.3 + b.tier / 2, b.z - b.d * 0.12] })
        k.box(b.w * 0.62 + 0.3, 0.3, b.d * 0.62 + 0.3, '#2c3460', { p: [b.x - b.w * 0.12, b.h + 0.45 + b.tier, b.z - b.d * 0.12] })
      } else if (b.h > 7) {
        k.box(1.6, 0.9, 1.6, '#30386a', { p: [b.x - 1.2 + r() * 2, b.h + 1.05, b.z - 1.2 + r() * 2] })
        if (r() < 0.4) k.cyl(0.07, 0.09, 3.2, '#3a4270', { p: [b.x + 1.6, b.h + 2.1, b.z - 1.6] }, 4)
      }
    }
    for (const p of city.plazas) {
      // Small squares where a building would have hidden the road: a tree and a bench.
      k.box(6.6, 0.12, 6.6, '#18203a', { p: [p.x, 0.36, p.z] })
      k.cyl(0.18, 0.24, 1.4, '#2a2238', { p: [p.x - 1.4, 1.0, p.z - 1.2] }, 5)
      k.ball(1.25, '#1d3a3a', { p: [p.x - 1.4, 2.4, p.z - 1.2] }, 0)
      k.box(1.8, 0.3, 0.5, '#2a2f55', { p: [p.x + 1.3, 0.6, p.z + 1.4] })
    }
    for (const l of city.lamps) {
      k.cyl(0.08, 0.11, 4.6, '#2b3156', { p: [l.x, 2.6, l.z] }, 5)
      k.box(0.5, 0.14, 0.5, '#3a4270', { p: [l.x, 4.95, l.z] })
    }
    // Lane dashes on every street in the district.
    for (const z of ZS) for (let x = XS[0] - 26; x <= XS[XS.length - 1] + 26; x += 5.2) k.box(2.2, 0.02, 0.26, '#5d6898', { p: [x, 0.04, z] })
    for (const x of XS) for (let z = ZS[0]; z <= ZS[ZS.length - 1]; z += 5.2) k.box(0.26, 0.02, 2.2, '#5d6898', { p: [x, 0.04, z] })
    return k.build()
  }, [city])
  const outer = useRef()
  useEffect(() => {
    const m = new THREE.Matrix4()
    const c = new THREE.Color()
    const r = rng(3)
    city.outer.forEach((b, i) => {
      m.makeScale(b.w, b.h, b.d).setPosition(b.x, b.h / 2, b.z)
      outer.current.setMatrixAt(i, m)
      outer.current.setColorAt(i, c.set('#1a2140').multiplyScalar(0.8 + r() * 0.4))
    })
    outer.current.instanceMatrix.needsUpdate = true
    outer.current.instanceColor.needsUpdate = true
  }, [city])
  return (
    <>
      <mesh geometry={geo} material={solid} castShadow receiveShadow />
      <instancedMesh ref={outer} args={[null, null, city.outer.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.9} flatShading />
      </instancedMesh>
    </>
  )
}

// Every window in the district. They start dark and come on in a wave when a stop is reached.
const OFF = new THREE.Color(0.03, 0.04, 0.075)
// Scoreboard windows: a faint grid until the figure is written in lime, the colour of the route.
const DOT_OFF = new THREE.Color(0.055, 0.07, 0.13)
const TRIM_OFF = new THREE.Color(0.09, 0.11, 0.2)
const DOT_ON = new THREE.Color(LIME).multiplyScalar(1.75)
function Windows({ city, brand }) {
  const mesh = useRef()
  const runKey = useNight((s) => s.runKey)
  const zones = useMemo(() => city.stops.map((s) => city.windows.map((w, i) => (w.zone === s.i && w.will ? i : -1)).filter((i) => i >= 0)), [city])
  const trim = useRef()
  const trimOn = useMemo(() => new THREE.Color(brand).multiplyScalar(1.9), [brand])
  const state = useRef({ on: null, active: [], seen: 0, trim: null })
  const palette = useMemo(() => [new THREE.Color(1.45, 1.0, 0.48), new THREE.Color(1.3, 0.86, 0.38), new THREE.Color(0.7, 0.95, 1.45), new THREE.Color(brand).multiplyScalar(1.7)], [brand])

  useEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2)
    const size = new THREE.Vector3(1, 1, 1)
    const p = new THREE.Vector3()
    const c = new THREE.Color()
    state.current = { on: new Uint8Array(city.windows.length), active: [], seen: 0, trim: new Uint8Array(city.trims.length) }
    city.trims.forEach((t, i) => {
      trim.current.setMatrixAt(i, m.compose(p.set(t.x, t.y, t.z), new THREE.Quaternion(), size.set(t.sx, 0.2, t.sz)))
      trim.current.setColorAt(i, TRIM_OFF)
    })
    trim.current.instanceMatrix.needsUpdate = true
    trim.current.instanceColor.needsUpdate = true
    city.windows.forEach((w, i) => {
      p.set(w.x, w.y + 0.3, w.z)
      m.compose(p, w.face ? q : new THREE.Quaternion(), size.set(w.sx ?? 1, w.sy ?? 1, 1))
      mesh.current.setMatrixAt(i, m)
      mesh.current.setColorAt(i, w.dot ? DOT_OFF : OFF)
    })
    mesh.current.instanceMatrix.needsUpdate = true
    mesh.current.instanceColor.needsUpdate = true
    useNight.setState({ lit: 0, total: zones.reduce((n, z) => n + z.length, 0) })
  }, [city, zones, runKey])

  useFrame(() => {
    const st = state.current
    const g = useNight.getState()
    // A newly reached stop starts its wave.
    while (st.seen < g.collected.length) st.active.push({ zone: g.collected[st.seen++], t0: car.t })
    if (g.collected.length < st.seen) st.seen = g.collected.length
    let changed = 0
    for (const a of st.active) {
      const age = car.t - a.t0
      if (age > 6) continue
      for (const i of zones[a.zone]) {
        if (st.on[i]) continue
        const w = city.windows[i]
        if (age < w.dist / 26 + w.rand * 0.5) continue
        st.on[i] = 1
        const pick = w.rand < 0.5 ? 0 : w.rand < 0.74 ? 1 : w.rand < 0.88 ? 2 : 3
        mesh.current.setColorAt(i, w.dot ? DOT_ON : palette[pick])
        changed++
      }
    }
    let edges = 0
    for (const a of st.active) {
      const age = car.t - a.t0
      if (age > 6) continue
      city.trims.forEach((t, i) => {
        if (st.trim[i] || t.zone !== a.zone || age < t.dist / 26) return
        st.trim[i] = 1
        trim.current.setColorAt(i, trimOn)
        edges++
      })
    }
    if (edges) trim.current.instanceColor.needsUpdate = true
    if (changed) {
      mesh.current.instanceColor.needsUpdate = true
      useNight.setState({ lit: g.lit + changed })
    }
  })
  return (
    <>
      <instancedMesh ref={mesh} args={[null, null, city.windows.length]} frustumCulled={false}>
        <planeGeometry args={[0.88, 1.2]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={trim} args={[null, null, city.trims.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </>
  )
}

// Street lamps: a bulb and a pool of light on the road.
function Lamps({ city, glow }) {
  const pools = useRef()
  const bulbs = useRef()
  useEffect(() => {
    const m = new THREE.Matrix4()
    const flat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2)
    const p = new THREE.Vector3()
    const s = new THREE.Vector3()
    city.lamps.forEach((l, i) => {
      pools.current.setMatrixAt(i, m.compose(p.set(l.x, 0.07, l.z), flat, s.set(10.5, 10.5, 1)))
      bulbs.current.setMatrixAt(i, m.compose(p.set(l.x, 4.78, l.z), new THREE.Quaternion(), s.set(1, 1, 1)))
    })
    pools.current.instanceMatrix.needsUpdate = true
    bulbs.current.instanceMatrix.needsUpdate = true
  }, [city])
  return (
    <>
      <instancedMesh ref={pools} args={[null, null, city.lamps.length]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={glow} color="#ffd9a8" transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={bulbs} args={[null, null, city.lamps.length]} frustumCulled={false}>
        <sphereGeometry args={[0.28, 8, 6]} />
        <meshBasicMaterial color={new THREE.Color(2.2, 1.5, 0.8)} toneMapped={false} />
      </instancedMesh>
    </>
  )
}

// A stop: a column of light on the road, and the tower sign that comes on when it is reached.
function Stop({ stop, caption, brand }) {
  const ring = useRef()
  const wave = useRef()
  const sign = useRef()
  const got = useRef(-1)
  const tex = useMemo(() => neonTexture(caption, brand, { w: 1024, h: 160, size: 74 }), [caption, brand])
  const t = stop.tower
  useFrame(() => {
    const done = useNight.getState().collected.includes(stop.i)
    if (done && got.current < 0) got.current = car.t
    if (!done) got.current = -1
    const age = done ? car.t - got.current : -1
    const pulse = 0.5 + 0.5 * Math.sin(car.t * 3 + stop.i)
    ring.current.visible = !done
    ring.current.scale.setScalar(1 + pulse * 0.12)
    // The wave front that runs out across the district.
    wave.current.visible = age >= 0 && age < 1.7
    if (wave.current.visible) {
      wave.current.scale.setScalar(2 + age * 26)
      wave.current.material.opacity = 0.9 * (1 - age / 1.7)
    }
    // The sign stutters on, like a tube warming up.
    const lit = age >= 0.9
    sign.current.visible = age >= 0.35 && (lit || Math.sin(age * 46) > 0.1)
    sign.current.children[1].material.color.setScalar(lit ? 1.3 + Math.sin(car.t * 7 + stop.i) * 0.05 : 0.8)
  })
  return (
    <>
      <group position={[stop.x, 0, stop.z]}>
        <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.09, 0]}>
          <ringGeometry args={[1.7, 2.15, 36]} />
          <meshBasicMaterial color={new THREE.Color(LIME).multiplyScalar(1.6)} toneMapped={false} />
        </mesh>
        <mesh ref={wave} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.11, 0]} visible={false}>
          <ringGeometry args={[0.982, 1.0, 96]} />
          <meshBasicMaterial color={LIME} transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
      {/* What the figure is, on the roof of the scoreboard. It comes on with the windows. */}
      <group ref={sign} position={[t.x, t.h + 2.5, t.z + 1.5]} rotation={[-0.42, SIGN_YAW * 0.35, 0, 'YXZ']} visible={false}>
        <mesh position={[0, 0, -0.08]}>
          <planeGeometry args={[BOARD.w + 0.6, 2.9]} />
          <meshBasicMaterial color="#070a14" transparent opacity={0.9} />
        </mesh>
        <mesh>
          <planeGeometry args={[BOARD.w, 2.5]} />
          <meshBasicMaterial map={tex} transparent toneMapped={false} depthWrite={false} />
        </mesh>
      </group>
    </>
  )
}

// A sign that is always on: district names, the year gates, the company.
function NeonSign({ text, color, x, y, z, w = 14, h = 3.2, tilt = -0.42 }) {
  const tex = useMemo(() => neonTexture(text, color, { w: 1024, h: Math.round((1024 * h) / w), size: 120 }), [text, color, w, h])
  return (
    <mesh position={[x, y, z]} rotation={[tilt, SIGN_YAW, 0, 'YXZ']}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} depthWrite={false} color={new THREE.Color(1.15, 1.15, 1.15)} />
    </mesh>
  )
}

// --- the car -----------------------------------------------------------------

// How far back the camera is, shared so the ground can fade at the matching distance.
const view = { zoom: 1 }
const SMOKE = 46
// The car is drawn larger than life, like a toy on a model street, so it stays the hero from above.
const CAR_SCALE = 1.65
function Car({ city, paint, glow }) {
  const root = useRef()
  const body = useRef()
  const wheels = useRef([])
  const door = useRef()
  const driver = useRef()
  const trail = useRef()
  const smoke = useRef()
  const spot = useRef()
  const target = useMemo(() => new THREE.Object3D(), [])
  const { camera, size, scene } = useThree()
  const runKey = useNight((s) => s.runKey)
  const sample = useMemo(() => ({}), [])
  const puffs = useMemo(() => Array.from({ length: SMOKE }, () => ({ life: 0, x: 0, y: 0, z: 0, vx: 0, vz: 0, s: 1 })), [])
  const st = useRef({ look: new THREE.Vector3(), zoom: 1, puff: 0, heading: Math.PI / 2, mv: 0, endT: 0 }).current

  const carGeo = useMemo(() => {
    const k = new Kit()
    // +Z is the nose. The driver sits on the left (+X).
    k.box(2.05, 0.55, 4.5, paint, { p: [0, 0.62, 0] })
    k.box(1.8, 0.5, 2.1, '#0e1326', { p: [0, 1.12, -0.25] })
    k.box(1.86, 0.08, 2.2, paint, { p: [0, 1.4, -0.25] })
    k.box(2.1, 0.18, 0.5, '#0e1326', { p: [0, 0.42, 2.2] })
    k.box(1.9, 0.12, 0.4, '#0e1326', { p: [0, 1.05, -2.1] })
    k.box(1.7, 0.1, 0.3, paint, { p: [0, 1.32, -2.2] })
    return k.build()
  }, [paint])
  const paintMat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.35, metalness: 0.3, emissive: new THREE.Color(paint), emissiveIntensity: 0.22 }), [paint])

  // The line of light the car leaves behind: the route, drawn as it is driven.
  const trailGeo = useMemo(() => {
    const v = []
    const pts = city.path.pts
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i]
      const b = pts[i + 1]
      const ax = Math.cos(a.yaw) * 0.2
      const az = -Math.sin(a.yaw) * 0.2
      const bx = Math.cos(b.yaw) * 0.2
      const bz = -Math.sin(b.yaw) * 0.2
      v.push(a.x - ax, 0.06, a.z - az, a.x + ax, 0.06, a.z + az, b.x - bx, 0.06, b.z - bz)
      v.push(a.x + ax, 0.06, a.z + az, b.x + bx, 0.06, b.z + bz, b.x - bx, 0.06, b.z - bz)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3))
    g.setDrawRange(0, 0)
    return g
  }, [city])

  useEffect(() => {
    const p = city.path.at(0, {})
    Object.assign(car, { x: p.x, z: p.z, yaw: p.yaw, slip: 0, speed: 0, s: 0, drift: 0, slide: 0, door: 0, out: 0 })
    st.heading = p.yaw
    st.endT = 0
    st.look.set(p.x, 0, p.z)
    puffs.forEach((q) => (q.life = 0))
    window.__night = { car, store: useNight, city, jump: (s) => (car.s = s) }
  }, [city, runKey])

  useEffect(() => {
    const map = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' }
    const on = (v) => (e) => {
      const k = map[e.code]
      if (!k || e.target?.closest?.('button, a')) return
      e.preventDefault()
      keys[k] = v
      if (v && useNight.getState().auto && useNight.getState().phase === 'drive') useNight.setState({ auto: false })
    }
    const d = on(true)
    const u = on(false)
    window.addEventListener('keydown', d)
    window.addEventListener('keyup', u)
    return () => {
      window.removeEventListener('keydown', d)
      window.removeEventListener('keyup', u)
    }
  }, [])

  function stepAuto(dt) {
    const path = city.path
    const p = path.at(car.s, sample)
    const left = path.length - car.s
    // The last stretch is a long slide to a stop, side-on to the camera.
    const slide = sm(1 - left / 19)
    const cruise = 15.5 * (1 - 0.34 * p.corner * (1 - p.drift)) * (1 - 0.12 * p.drift)
    const want = left <= 0.05 ? 0 : Math.max(1.6, cruise * (1 - slide * slide * 0.94))
    car.speed = damp(car.speed, want, left <= 0.05 ? 9 : 2.6, dt)
    car.s = Math.min(path.length, car.s + car.speed * dt)
    path.at(car.s, sample)
    car.drift = Math.max(sample.drift, slide > 0.12 ? Math.min(1, slide * 1.2) : 0)
    car.slide = slide
    const turn = slide > 0.12 ? 1 : sample.turn
    // Sliding: the nose points further into the corner than the car is travelling.
    const slip = turn * (sample.drift * 0.72 + slide * 1.25)
    car.slip = damp(car.slip, slip, 5.5, dt)
    car.yaw = sample.yaw + car.slip
    // ...and the tail swings wide.
    const out = -turn * sample.drift * 1.5
    car.x = sample.x + Math.cos(sample.yaw) * out
    car.z = sample.z - Math.sin(sample.yaw) * out
    st.heading = sample.yaw
    if (left <= 0.05 && car.speed < 0.25 && useNight.getState().phase === 'drive') useNight.setState({ phase: 'done' })
  }

  function stepManual(dt) {
    const turn = (keys.left ? 1 : 0) - (keys.right ? 1 : 0)
    const gas = (keys.up ? 1 : 0) - (keys.down ? 1 : 0)
    const want = gas > 0 ? 17 : gas < 0 ? -5 : 0
    car.speed = damp(car.speed, want, gas ? 1.8 : 1.1, dt)
    st.heading += turn * 2.1 * dt * Math.min(1, Math.abs(car.speed) / 5) * Math.sign(car.speed || 1)
    car.slip = damp(car.slip, turn * 0.34 * Math.min(1, Math.abs(car.speed) / 14), 4, dt)
    car.drift = Math.abs(car.slip) > 0.26 ? 0.7 : 0
    car.yaw = st.heading + car.slip
    car.x += Math.sin(st.heading) * car.speed * dt
    car.z += Math.cos(st.heading) * car.speed * dt
    // Stay off the pavements: push the car back out of any block it touches.
    for (const b of city.blocks) {
      const dx = car.x - b.cx
      const dz = car.z - b.cz
      const h = BLOCK / 2 + 1.1
      if (Math.abs(dx) < h && Math.abs(dz) < h) {
        if (h - Math.abs(dx) < h - Math.abs(dz)) car.x = b.cx + Math.sign(dx || 1) * h
        else car.z = b.cz + Math.sign(dz || 1) * h
        car.speed *= 0.9
      }
    }
    car.x = Math.min(150, Math.max(-150, car.x))
    car.z = Math.min(ZS[ZS.length - 1] + 6, Math.max(ZS[0] - 6, car.z))
    // Keep the line of light roughly in step with how far along the route the car is.
    let best = car.s
    let bd = Infinity
    for (let i = 0; i < city.path.pts.length; i += 6) {
      const q = city.path.pts[i]
      const d = (q.x - car.x) ** 2 + (q.z - car.z) ** 2
      if (d < bd) {
        bd = d
        best = q.s
      }
    }
    if (bd < 80) car.s = Math.max(car.s, best)
    const end = city.path.pts[city.path.pts.length - 1]
    if (Math.hypot(end.x - car.x, end.z - car.z) < 6 && useNight.getState().collected.length === city.stops.length) {
      car.speed = damp(car.speed, 0, 6, dt)
      if (Math.abs(car.speed) < 0.6) useNight.setState({ phase: 'done' })
    }
  }

  useFrame((_, raw) => {
    const g = useNight.getState()
    const base = Math.min(raw, 0.05)
    const rate = (window.__timeScale || 1) * (g.phase === 'drive' ? g.speed : 1)
    const steps = Math.ceil(rate)
    const dt = (base * rate) / steps
    for (let n = 0; n < steps; n++) {
      car.t += dt
      if (g.phase === 'drive') {
        if (g.auto) stepAuto(dt)
        else stepManual(dt)
        for (const s of city.stops) if (Math.hypot(s.x - car.x, s.z - car.z) < 5) useNight.getState().collect(s.i)
      } else if (g.phase === 'done') {
        st.endT += dt
        car.speed = 0
        car.drift = 0
        car.door = sm((st.endT - 0.5) / 0.6)
        car.out = sm((st.endT - 1.0) / 0.9)
      }
      // Tyre smoke while sliding.
      st.puff += dt
      if (car.drift > 0.3 && Math.abs(car.speed) > 2.5 && st.puff > 0.028) {
        st.puff = 0
        const q = puffs.find((x) => x.life <= 0)
        if (q) {
          const side = Math.random() < 0.5 ? 1 : -1
          const fx = Math.sin(car.yaw)
          const fz = Math.cos(car.yaw)
          q.x = car.x - fx * 2.5 + fz * side * 1.5
          q.z = car.z - fz * 2.5 - fx * side * 1.5
          q.y = 0.4
          q.vx = (Math.random() - 0.5) * 1.6
          q.vz = (Math.random() - 0.5) * 1.6
          q.s = 1.8 + Math.random() * 1.2
          q.life = 1
        }
      }
      for (const q of puffs) {
        if (q.life <= 0) continue
        q.life -= dt / 1.25
        q.x += q.vx * dt
        q.z += q.vz * dt
        q.y += 1.5 * dt
        q.s += 4.6 * dt
      }
    }

    // Place the car.
    root.current.position.set(car.x, 0, car.z)
    root.current.rotation.y = car.yaw
    root.current.scale.setScalar(CAR_SCALE)
    body.current.rotation.z = -car.slip * 0.09
    wheels.current.forEach((w, i) => {
      if (w && i < 2) w.rotation.y = -car.slip * 0.95
    })
    door.current.rotation.y = car.door * 1.15
    driver.current.visible = car.out > 0.02
    driver.current.position.set(1.25 + car.out * 1.25, 0, 0.15 - car.out * 0.2)
    driver.current.scale.setScalar(0.4 + car.out * 0.6)
    trail.current.geometry.setDrawRange(0, Math.floor((car.s / city.path.length) * (city.path.pts.length - 1)) * 6)

    const m = new THREE.Matrix4()
    const c = new THREE.Color()
    const sc = new THREE.Vector3()
    const pv = new THREE.Vector3()
    puffs.forEach((q, i) => {
      const a = Math.max(0, q.life)
      smoke.current.setMatrixAt(i, m.compose(pv.set(q.x, q.y, q.z), camera.quaternion, sc.setScalar(a > 0 ? q.s : 0.0001)))
      smoke.current.setColorAt(i, c.setRGB(0.5 * a * a, 0.47 * a * a, 0.52 * a * a))
    })
    smoke.current.instanceMatrix.needsUpdate = true
    if (smoke.current.instanceColor) smoke.current.instanceColor.needsUpdate = true

    // Headlights.
    const fx = Math.sin(car.yaw)
    const fz = Math.cos(car.yaw)
    spot.current.position.set(car.x + fx * 3.4, 2, car.z + fz * 3.4)
    target.position.set(car.x + fx * 20, 0, car.z + fz * 20)
    target.updateMatrixWorld()

    // The camera: fixed direction, following the car, closer in while it slides.
    const portrait = size.width / size.height < 0.9
    const fov = portrait ? 36 : 25
    if (camera.fov !== fov) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
    // The ending: close on the car while the driver gets out, then pull far back so the whole
    // district, now lit, is in the picture.
    const reveal = g.phase === 'done' ? sm((st.endT - 2.6) / 2.4) : 0
    const ahead = g.phase === 'done' ? 0 : 7
    const keep = 1 - reveal * 0.8
    st.look.x = damp(st.look.x, (car.x + Math.sin(st.heading) * ahead) * keep, 2.6, base)
    st.look.z = damp(st.look.z, (car.z + Math.cos(st.heading) * ahead) * keep + reveal * 6, 2.6, base)
    const wantZoom = g.phase === 'title' ? 1.2 : g.phase === 'done' ? 0.44 + reveal * 1.5 : 1 - 0.34 * Math.min(1, car.drift)
    st.zoom = damp(st.zoom, wantZoom, g.phase === 'done' ? 1.2 : 1.7, base)
    view.zoom = st.zoom
    const dist = (portrait ? 190 : 168) * st.zoom
    // Aim a little beyond the car, so the towers and their signs behind the road are in frame.
    const bx = st.look.x - Math.sin(CAM_DIR.az) * 9 * st.zoom
    const bz = st.look.z - Math.cos(CAM_DIR.az) * 9 * st.zoom
    camera.position.set(bx + CAM_DIR.x * dist, CAM_DIR.y * dist, bz + CAM_DIR.z * dist)
    camera.lookAt(bx, 1, bz)
    if (scene.fog) {
      scene.fog.near = 175 * Math.max(1, st.zoom)
      scene.fog.far = 390 * Math.max(1, st.zoom)
    }
  })

  const wheelAt = [[0.98, 0.42, 1.45], [-0.98, 0.42, 1.45], [0.98, 0.42, -1.45], [-0.98, 0.42, -1.45]]
  return (
    <>
      <mesh ref={trail} geometry={trailGeo} frustumCulled={false}>
        <meshBasicMaterial color={new THREE.Color(LIME).multiplyScalar(0.9)} transparent opacity={0.42} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <group ref={root}>
        <group ref={body}>
          <mesh geometry={carGeo} material={paintMat} castShadow />
          {[[0.912, 1.62, 1.2], [1.452, -0.25, 2.2], [0.912, -1.75, 0.9]].map(([y, z, len]) => (
            <mesh key={z} position={[0, y, z]}>
              <boxGeometry args={[0.46, 0.02, len]} />
              <meshBasicMaterial color={new THREE.Color(LIME).multiplyScalar(1.15)} toneMapped={false} />
            </mesh>
          ))}
          {/* Lamps front and rear */}
          {[0.7, -0.7].map((x) => (
            <mesh key={x} position={[x, 0.66, 2.27]}>
              <boxGeometry args={[0.42, 0.2, 0.06]} />
              <meshBasicMaterial color={new THREE.Color(3, 2.7, 2)} toneMapped={false} />
            </mesh>
          ))}
          <mesh position={[0, 0.7, -2.27]}>
            <boxGeometry args={[1.86, 0.14, 0.06]} />
            <meshBasicMaterial color={new THREE.Color(2.6, 0.15, 0.2)} toneMapped={false} />
          </mesh>
          {/* The driver's door, hinged at its front edge */}
          <group ref={door} position={[1.04, 0.62, 0.72]}>
            <mesh position={[0.02, 0.2, -0.6]}>
              <boxGeometry args={[0.07, 0.92, 1.2]} />
              <meshStandardMaterial color={paint} roughness={0.35} metalness={0.3} emissive={paint} emissiveIntensity={0.22} flatShading />
            </mesh>
          </group>
        </group>
        {wheelAt.map((p, i) => (
          <mesh key={i} ref={(m) => (wheels.current[i] = m)} position={p} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.42, 0.42, 0.34, 10]} />
            <meshStandardMaterial color="#0b0e1a" roughness={0.9} flatShading />
          </mesh>
        ))}
        {/* Light thrown on the road, and a glow under the car */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 8.5]}>
          <planeGeometry args={[9, 16]} />
          <meshBasicMaterial map={glow} color="#fff0c8" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
          <planeGeometry args={[5.4, 8]} />
          <meshBasicMaterial map={glow} color={LIME} transparent opacity={0.42} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
        {/* A simple stand-in for the driver, until the filmed clip replaces this moment */}
        <group ref={driver} visible={false}>
          <mesh position={[0, 1.0, 0]} castShadow>
            <capsuleGeometry args={[0.3, 0.9, 4, 8]} />
            <meshStandardMaterial color="#e9edf5" roughness={0.6} emissive="#8f98b8" emissiveIntensity={0.25} flatShading />
          </mesh>
          <mesh position={[0, 1.95, 0]}>
            <sphereGeometry args={[0.27, 10, 8]} />
            <meshStandardMaterial color="#d9a47c" roughness={0.7} emissive="#6b4a35" emissiveIntensity={0.3} flatShading />
          </mesh>
        </group>
      </group>
      <instancedMesh ref={smoke} args={[null, null, SMOKE]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={glow} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      <primitive object={target} />
      <spotLight ref={spot} target={target} color="#ffe9c0" intensity={900} distance={46} angle={0.5} penumbra={0.7} decay={1.7} />
    </>
  )
}

// --- ground ------------------------------------------------------------------

const WetShader = {
  name: 'WetStreet',
  uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, fogCol: { value: new THREE.Color('#060913') }, far: { value: 1 } },
  vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vWorld;
void main(){ vUv = textureMatrix * vec4(position, 1.0); vWorld = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec3 color; uniform vec3 fogCol; uniform float far; varying vec4 vUv; varying vec3 vWorld;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
void main(){
  // Rain has pooled in places: reflections are sharp in the puddles and faint on the rougher road.
  float n = noise(vWorld.xz * 0.075) * 0.62 + noise(vWorld.xz * 0.23) * 0.38;
  float puddle = smoothstep(0.4, 0.6, n);
  vec2 j = vec2(noise(vWorld.xz * 0.6), noise(vWorld.xz * 0.6 + 7.3)) - 0.5;
  vec4 uv = vUv;
  uv.xy += j * 0.008 * uv.w * (1.0 - puddle * 0.85);
  vec3 r = texture2DProj(tDiffuse, uv).rgb * 2.0;
  vec4 a = uv; a.x += 0.004 * a.w; vec4 b = uv; b.x -= 0.004 * b.w;
  r = (r + texture2DProj(tDiffuse, a).rgb + texture2DProj(tDiffuse, b).rgb) * 0.25;
  vec3 c = color * (1.0 - 0.45 * puddle) + r * mix(0.12, 0.62, puddle);
  float dist = length(cameraPosition - vWorld);
  c = mix(c, fogCol, smoothstep(170.0 * far, 380.0 * far, dist));
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`,
}

function Ground({ wet }) {
  const mirror = useMemo(() => {
    if (!wet) return null
    const m = new Reflector(new THREE.PlaneGeometry(1400, 1400), { textureWidth: 1024, textureHeight: 1024, clipBias: 0.01, shader: WetShader, color: '#101528', multisample: 0 })
    m.rotation.x = -Math.PI / 2
    m.position.y = 0.012
    return m
  }, [wet])
  useEffect(() => () => mirror?.dispose(), [mirror])
  useFrame(() => {
    if (mirror) mirror.material.uniforms.far.value = Math.max(1, view.zoom)
  })
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1400, 1400]} />
        <meshStandardMaterial color="#101528" roughness={0.92} />
      </mesh>
      {mirror && <primitive object={mirror} />}
    </>
  )
}

function Moon() {
  const light = useRef()
  const target = useMemo(() => new THREE.Object3D(), [])
  useFrame(() => {
    target.position.set(car.x, 0, car.z)
    target.updateMatrixWorld()
    light.current.position.set(car.x + 40, 95, car.z + 62)
  })
  return (
    <>
      <hemisphereLight args={['#6076c8', '#10152a', 1.75]} />
      <primitive object={target} />
      <directionalLight
        ref={light}
        target={target}
        color="#9fb3ff"
        intensity={1.7}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-camera-near={1}
        shadow-camera-far={260}
        shadow-bias={-0.0008}
        shadow-normalBias={0.05}
      />
    </>
  )
}

export default function NightScene({ district, wet }) {
  const city = useMemo(() => buildCity(11, district.stops.map((s) => s.matrix)), [district])
  const glow = useMemo(glowTexture, [])
  const { scene } = useThree()
  useEffect(() => {
    scene.background = new THREE.Color('#05070f')
    scene.fog = new THREE.Fog('#060913', 175, 390)
  }, [scene])
  const brand = district.brand.primary
  const end = city.path.pts[city.path.pts.length - 1]
  return (
    <>
      <Moon />
      <Ground wet={wet} />
      <CityBlocks city={city} />
      <Windows city={city} brand={brand} />
      <Lamps city={city} glow={glow} />
      {city.stops.map((s) => (
        <Stop key={s.i} stop={s} caption={district.stops[s.i].caption} brand={brand} />
      ))}
      <NeonSign text={String(district.startYear)} color={LIME} x={XS[0] - 13} y={7.4} z={-7.5} w={11} h={3.4} />
      <NeonSign text={String(district.endYear)} color={LIME} x={end.x + 9} y={6.4} z={-9} w={11} h={3.4} />
      <NeonSign text={district.brand.label.toUpperCase()} color={brand} x={XS[0] - 13} y={11.6} z={-7.5} w={15} h={3.4} />
      {district.districts.map((d, i) => (
        <NeonSign key={d} text={d.toUpperCase()} color="#ff6ad5" x={i ? 6 : -62} y={6.5} z={i ? 33.5 : 7.5} w={14} h={2.4} tilt={-0.3} />
      ))}
      <Car city={city} paint={brand} glow={glow} />
    </>
  )
}
