// The rider and bicycle: a toy figure built from simple shapes.
// Local axes: +Z is forward, +Y is up, +X is the rider's left.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { rider, clock, useGame, wrapAngle } from './state.js'
import career from '../content/career.json'

const brandOf = (id) => career.islands.find((i) => i.id === id).brand

const C = {
  frame: '#f0553f',
  tyre: '#2c2f3a',
  rim: '#fdf3dc',
  metal: '#aab4c0',
  jacket: '#ffcf4a',
  trousers: '#2b4a6f',
  skin: '#e9b48a',
  helmet: '#1f9d8f',
  stripe: '#fff6e4',
  pack: '#f08a4b',
  shoe: '#fff6e4',
  flag: '#f0553f',
}

const WHEEL_R = 0.42
const CRANK = 0.19
const THIGH = 0.5
const SHIN = 0.5
const BB = new THREE.Vector3(0, 0.42, -0.06)
const REAR = new THREE.Vector3(0, WHEEL_R, -0.64)
const SEAT = new THREE.Vector3(0, 1.0, -0.36)
const HEAD = new THREE.Vector3(0, 1.04, 0.42)
const STEER_Z = 0.44
const FRONT_LOCAL = new THREE.Vector3(0, WHEEL_R, 0.22) // inside the steering group
const HIP = new THREE.Vector3(0, 1.16, -0.34)
const NECK = new THREE.Vector3(0, 1.7, 0.02)

const UP = new THREE.Vector3(0, 1, 0)
const _d = new THREE.Vector3()
const _a = new THREE.Vector3()
const _b = new THREE.Vector3()
const _k = new THREE.Vector3()
const _yAxis = new THREE.Vector3(0, 1, 0)

function placeLimb(mesh, a, b) {
  mesh.position.copy(a).add(b).multiplyScalar(0.5)
  _d.copy(b).sub(a)
  const len = _d.length()
  mesh.quaternion.setFromUnitVectors(UP, _d.normalize())
  mesh.scale.set(1, len, 1)
}

function Tube({ a, b, r = 0.035, color, geo, material }) {
  const ref = useRef()
  const props = useMemo(() => {
    const m = new THREE.Object3D()
    placeLimb(m, a, b)
    return { position: m.position.clone(), quaternion: m.quaternion.clone(), scale: m.scale.clone() }
  }, [a, b])
  return (
    <mesh ref={ref} castShadow geometry={geo} material={material} {...props}>
      {!geo && <cylinderGeometry args={[r, r, 1, 8]} />}
      {!material && <meshStandardMaterial color={color} roughness={0.55} flatShading />}
    </mesh>
  )
}

function Wheel({ innerRef, position }) {
  return (
    <group position={position}>
      <group ref={innerRef}>
        <mesh castShadow rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[WHEEL_R - 0.07, 0.075, 8, 22]} />
          <meshStandardMaterial color={C.tyre} roughness={0.8} flatShading />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[WHEEL_R - 0.15, 0.025, 6, 22]} />
          <meshStandardMaterial color={C.rim} roughness={0.5} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[(i * Math.PI) / 3, 0, 0]}>
            <boxGeometry args={[0.03, 0.03, (WHEEL_R - 0.14) * 2]} />
            <meshStandardMaterial color={C.rim} roughness={0.5} />
          </mesh>
        ))}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.06, 0.14, 8]} />
          <meshStandardMaterial color={C.metal} roughness={0.4} />
        </mesh>
      </group>
    </group>
  )
}

const UPRIGHT = -Math.atan2(NECK.z - HIP.z, NECK.y - HIP.y)
const SHOULDER = new THREE.Vector3(0.25, 1.62, -0.02)
const _s = new THREE.Vector3()
const _f = new THREE.Vector3()
const _h = new THREE.Vector3()
const _c = new THREE.Color()
const _xAxis = new THREE.Vector3(1, 0, 0)

// `ids` are the island ids in play order, so the outfit can follow the island being ridden.
export default function Rider({ ids }) {
  const root = useRef()
  const walker = useRef()
  const upper = useRef()
  const held = useRef()
  const profiles = useGame((s) => s.profiles)
  // The outfit takes each company's colours: jersey and frame in the main colour, helmet and
  // pennant in the second. It fades over as the rider arrives.
  const mats = useMemo(
    () => ({
      jacket: new THREE.MeshStandardMaterial({ color: C.jacket, roughness: 0.7, flatShading: true }),
      helmet: new THREE.MeshStandardMaterial({ color: C.helmet, roughness: 0.45, flatShading: true }),
      frame: new THREE.MeshStandardMaterial({ color: C.frame, roughness: 0.55, flatShading: true }),
      flag: new THREE.MeshStandardMaterial({ color: C.flag, roughness: 0.8, side: THREE.DoubleSide }),
      held: new THREE.MeshStandardMaterial({ color: C.jacket, roughness: 0.6 }),
    }),
    []
  )
  const leanRef = useRef()
  const steerRef = useRef()
  const rearWheel = useRef()
  const frontWheel = useRef()
  const body = useRef()
  const flag = useRef()
  const parts = useRef({})
  const set = (name) => (m) => {
    if (m) parts.current[name] = m
  }

  const limbGeo = useMemo(() => new THREE.CylinderGeometry(0.085, 0.075, 1, 8), [])
  const armGeo = useMemo(() => new THREE.CylinderGeometry(0.07, 0.06, 1, 8), [])
  const crankGeo = useMemo(() => new THREE.CylinderGeometry(0.025, 0.025, 1, 6), [])
  const flagGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, -0.34, 0, 0, -0.17, -0.5], 3))
    g.computeVertexNormals()
    return g
  }, [])

  const torso = useMemo(() => {
    const m = new THREE.Object3D()
    placeLimb(m, HIP, NECK)
    return { position: m.position.clone(), quaternion: m.quaternion.clone(), length: HIP.distanceTo(NECK) }
  }, [])

  useFrame((_, dtRaw) => {
    const p = parts.current
    if (!root.current) return
    const g = useGame.getState()
    const brand = brandOf(ids[Math.min(ids.length - 1, g.island)])
    const k = 1 - Math.exp(-3 * Math.min(dtRaw, 0.05))
    mats.jacket.color.lerp(_c.set(brand.primary), k)
    mats.frame.color.lerp(_c.set(brand.primary), k)
    mats.helmet.color.lerp(_c.set(brand.secondary), k)
    mats.flag.color.lerp(_c.set(brand.secondary), k)

    // On foot: where the rider stands relative to the bike, and how far off the saddle.
    const act = rider.act
    const off = act ? act.off : 0
    const reach = act ? act.reach : 0
    if (act) {
      const vx = act.x - rider.pos.x
      const vz = act.z - rider.pos.z
      const ch = Math.cos(rider.heading)
      const sh = Math.sin(rider.heading)
      walker.current.position.set((vx * ch - vz * sh) / 1.18, 0, (vx * sh + vz * ch) / 1.18 + HIP.z)
      walker.current.rotation.y = wrapAngle(act.face - rider.heading)
      mats.held.color.set(brandOf(act.island).primary)
    } else {
      walker.current.position.set(0, 0, HIP.z)
      walker.current.rotation.y = 0
    }
    const tilt = UPRIGHT * off + 0.45 * reach
    upper.current.rotation.x = tilt
    held.current.visible = !!act && act.has
    const stride = act ? Math.sin(act.walk * 4.2) : 0
    root.current.position.copy(rider.pos)
    root.current.quaternion.copy(rider.quat)
    leanRef.current.rotation.z = rider.lean
    leanRef.current.rotation.x = rider.tumble
    steerRef.current.rotation.y = rider.steer
    rearWheel.current.rotation.x = rider.wheel
    frontWheel.current.rotation.x = rider.wheel
    body.current.position.y = rider.pedalling ? Math.sin(rider.pedal * 2) * 0.012 : 0
    body.current.position.z = -HIP.z

    // Pedals and legs.
    for (const side of [1, -1]) {
      const phase = rider.pedal + (side === 1 ? 0 : Math.PI)
      const px = side * 0.15
      _a.set(side * 0.07, BB.y, BB.z)
      _b.set(px, BB.y + Math.cos(phase) * CRANK, BB.z + Math.sin(phase) * CRANK)
      const s = side === 1 ? 'L' : 'R'
      placeLimb(p['crank' + s], _a, _b)
      p['pedal' + s].position.copy(_b)

      // Two-bone leg from hip to the foot on the pedal.
      const hipX = side * 0.13
      // The foot is on the pedal when riding and on the ground, striding, when walking.
      _f.set(px, _b.y + 0.08, _b.z).lerp(_s.set(hipX, 0.15 + Math.max(0, stride * side) * 0.1, HIP.z + stride * side * 0.34), off)
      const footX = _f.x
      const fy = _f.y
      const fz = _f.z
      const dz = fz - HIP.z
      const dy = fy - HIP.y
      const dist = Math.min(Math.hypot(dz, dy), THIGH + SHIN - 0.001)
      const base = Math.atan2(dy, dz)
      const bend = Math.acos((THIGH * THIGH + dist * dist - SHIN * SHIN) / (2 * THIGH * dist))
      const ang = base + bend
      _a.set(hipX, HIP.y, HIP.z)
      _k.set(hipX + side * 0.03, HIP.y + Math.sin(ang) * THIGH, HIP.z + Math.cos(ang) * THIGH)
      _b.set(footX, fy, fz)
      placeLimb(p['thigh' + s], _a, _k)
      placeLimb(p['shin' + s], _k, _b)
      p['knee' + s].position.copy(_k)
      p['shoe' + s].position.set(footX, fy - 0.03, fz + 0.07)

      // Arms follow the handlebar as it turns.
      _a.set(side * SHOULDER.x, SHOULDER.y, SHOULDER.z).sub(HIP).applyAxisAngle(_xAxis, tilt).add(HIP)
      _b.set(side * 0.27, 1.19, -0.02).applyAxisAngle(_yAxis, rider.steer)
      _b.z += STEER_Z
      if (off > 0) {
        // Arms swing at the sides, reach out for the folder, or carry it in front.
        const carry = act.has ? 1 : reach
        _h.set(side * (0.3 - 0.14 * carry), _a.y - 0.5 + 0.2 * carry - 0.12 * reach, _a.z - stride * side * 0.2 * (1 - carry) + 0.4 * carry + 0.1 * reach)
        _b.lerp(_h, off)
        if (side === 1) held.current.position.set(0, _h.y + 0.02, _h.z + 0.08)
      }
      placeLimb(p['arm' + s], _a, _b)
      p['hand' + s].position.copy(_b)
    }

    // Pennant sways with speed and turning.
    const sp = Math.min(Math.abs(rider.speed) / 10, 1.6)
    flag.current.rotation.y = Math.sin(clock.t * 9) * 0.25 * sp - rider.steer * 0.8
    flag.current.rotation.z = Math.sin(clock.t * 2.1) * 0.03
  })

  const std = (color, rough = 0.7) => <meshStandardMaterial color={color} roughness={rough} flatShading />

  return (
    <group ref={root}>
      <group ref={leanRef} scale={1.18}>
        {/* Bicycle frame */}
        <Tube a={BB} b={SEAT} material={mats.frame} color={C.frame} r={0.04} />
        <Tube a={BB} b={HEAD} material={mats.frame} color={C.frame} r={0.045} />
        <Tube a={SEAT} b={HEAD} material={mats.frame} color={C.frame} r={0.04} />
        <Tube a={SEAT} b={REAR} material={mats.frame} color={C.frame} r={0.03} />
        <Tube a={BB} b={REAR} material={mats.frame} color={C.frame} r={0.03} />
        <mesh castShadow position={[0, 1.05, -0.4]}>
          <boxGeometry args={[0.18, 0.07, 0.34]} />
          {std(C.tyre, 0.9)}
        </mesh>
        <Wheel innerRef={rearWheel} position={REAR} />

        {/* Steering: fork, front wheel, handlebar */}
        <group ref={steerRef} position={[0, 0, STEER_Z]}>
          <Tube a={new THREE.Vector3(0, 1.22, -0.03)} b={new THREE.Vector3(0, 0.98, 0.0)} color={C.metal} r={0.035} />
          <Tube a={new THREE.Vector3(0.07, 0.98, 0.0)} b={new THREE.Vector3(0.07, WHEEL_R, 0.22)} material={mats.frame} color={C.frame} r={0.028} />
          <Tube a={new THREE.Vector3(-0.07, 0.98, 0.0)} b={new THREE.Vector3(-0.07, WHEEL_R, 0.22)} material={mats.frame} color={C.frame} r={0.028} />
          <mesh castShadow position={[0, 1.2, -0.03]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 0.62, 8]} />
            {std(C.metal, 0.4)}
          </mesh>
          <mesh position={[0, 0.82, 0.12]}>
            <sphereGeometry args={[0.07, 8, 6]} />
            <meshBasicMaterial color="#fff3b0" />
          </mesh>
          <Wheel innerRef={frontWheel} position={FRONT_LOCAL} />
        </group>

        {/* Cranks and pedals */}
        {['L', 'R'].map((s) => (
          <group key={s}>
            <mesh ref={set('crank' + s)} geometry={crankGeo}>
              {std(C.metal, 0.4)}
            </mesh>
            <mesh ref={set('pedal' + s)}>
              <boxGeometry args={[0.14, 0.035, 0.1]} />
              {std(C.tyre, 0.8)}
            </mesh>
          </group>
        ))}

        {/* Pennant */}
        <Tube a={new THREE.Vector3(0.1, 0.6, -0.66)} b={new THREE.Vector3(0.42, 2.3, -0.86)} color={C.metal} r={0.014} />
        <group ref={flag} position={[0.42, 2.3, -0.86]}>
          <mesh geometry={flagGeo} castShadow>
            <primitive object={mats.flag} attach="material" />
          </mesh>
        </group>

        {/* Rear crate: one folder for every company profile picked up so far */}
        <Tube a={REAR} b={new THREE.Vector3(0, 0.9, -0.95)} color={C.metal} r={0.02} />
        <mesh castShadow position={[0, 0.93, -0.95]}>
          <boxGeometry args={[0.46, 0.06, 0.44]} />
          {std('#a86b47')}
        </mesh>
        {[[0, 1.04, -1.16, 0.46, 0.2, 0.03], [0, 1.04, -0.74, 0.46, 0.2, 0.03], [0.22, 1.04, -0.95, 0.03, 0.2, 0.44], [-0.22, 1.04, -0.95, 0.03, 0.2, 0.44]].map(([x, y, z, w, h, d], i) => (
          <mesh key={i} position={[x, y, z]}>
            <boxGeometry args={[w, h, d]} />
            {std('#c98a5e')}
          </mesh>
        ))}
        {profiles.map((id, i) => (
          <group key={id} position={[0, 1.16, -1.12 + i * 0.042]} rotation={[0.08, 0, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.36, 0.42, 0.03]} />
              {std('#f6dfa6')}
            </mesh>
            <mesh position={[0.02 * ((i % 3) - 1) * 4, 0.19, 0]}>
              <boxGeometry args={[0.37, 0.1, 0.034]} />
              <meshStandardMaterial color={brandOf(id).primary} roughness={0.6} />
            </mesh>
          </group>
        ))}

        {/* Rider */}
        <group ref={walker} position={[0, 0, HIP.z]}>
        <group ref={body} position={[0, 0, -HIP.z]}>
          <mesh ref={held} visible={false} castShadow rotation={[-0.5, 0, 0]}>
            <boxGeometry args={[0.36, 0.44, 0.05]} />
            <primitive object={mats.held} attach="material" />
          </mesh>
          <group ref={upper} position={HIP}>
          <group position={[-HIP.x, -HIP.y, -HIP.z]}>
          <mesh castShadow position={torso.position} quaternion={torso.quaternion} material={mats.jacket}>
            <capsuleGeometry args={[0.23, torso.length - 0.2, 4, 10]} />
          </mesh>
          <mesh castShadow position={[0, 1.52, -0.4]} rotation={[0.58, 0, 0]}>
            <boxGeometry args={[0.36, 0.44, 0.22]} />
            {std('#fff1dc')}
          </mesh>
          <mesh position={[0, 1.56, -0.52]} rotation={[0.58, 0, 0]}>
            <boxGeometry args={[0.24, 0.16, 0.06]} />
            {std(C.stripe)}
          </mesh>
          {/* Head and helmet */}
          <mesh castShadow position={[0, 1.99, 0.09]}>
            <sphereGeometry args={[0.26, 14, 10]} />
            {std(C.skin)}
          </mesh>
          <mesh castShadow position={[0, 2.02, 0.07]} rotation={[-0.12, 0, 0]}>
            <sphereGeometry args={[0.29, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
            <primitive object={mats.helmet} attach="material" />
          </mesh>
          <mesh position={[0, 2.085, 0.075]} rotation={[-0.12, 0, 0]}>
            <boxGeometry args={[0.09, 0.46, 0.5]} />
            {std(C.stripe, 0.45)}
          </mesh>
          <mesh position={[0, 2.0, 0.36]} rotation={[0.25, 0, 0]}>
            <boxGeometry args={[0.36, 0.04, 0.14]} />
            <primitive object={mats.helmet} attach="material" />
          </mesh>
          {[1, -1].map((s) => (
            <mesh key={s} position={[s * 0.1, 1.95, 0.33]}>
              <sphereGeometry args={[0.032, 6, 6]} />
              <meshBasicMaterial color="#2c2f3a" />
            </mesh>
          ))}
          </group>
          </group>
          {/* Limbs, placed every frame */}
          {['L', 'R'].map((s) => (
            <group key={s}>
              <mesh ref={set('thigh' + s)} geometry={limbGeo} castShadow>{std(C.trousers)}</mesh>
              <mesh ref={set('shin' + s)} geometry={limbGeo} castShadow>{std(C.trousers)}</mesh>
              <mesh ref={set('knee' + s)}>
                <sphereGeometry args={[0.088, 8, 6]} />
                {std(C.trousers)}
              </mesh>
              <mesh ref={set('shoe' + s)} castShadow>
                <boxGeometry args={[0.12, 0.09, 0.26]} />
                {std(C.shoe)}
              </mesh>
              <mesh ref={set('arm' + s)} geometry={armGeo} castShadow material={mats.jacket} />
              <mesh ref={set('hand' + s)}>
                <sphereGeometry args={[0.075, 8, 6]} />
                {std(C.skin)}
              </mesh>
            </group>
          ))}
        </group>
        </group>
      </group>
    </group>
  )
}
