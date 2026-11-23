// The rider and bicycle: a toy figure built from simple shapes.
// Local axes: +Z is forward, +Y is up, +X is the rider's left.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { rider, clock } from './state.js'

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

function Tube({ a, b, r = 0.035, color, geo }) {
  const ref = useRef()
  const props = useMemo(() => {
    const m = new THREE.Object3D()
    placeLimb(m, a, b)
    return { position: m.position.clone(), quaternion: m.quaternion.clone(), scale: m.scale.clone() }
  }, [a, b])
  return (
    <mesh ref={ref} castShadow geometry={geo} {...props}>
      {!geo && <cylinderGeometry args={[r, r, 1, 8]} />}
      <meshStandardMaterial color={color} roughness={0.55} flatShading />
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

export default function Rider() {
  const root = useRef()
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

  useFrame(() => {
    const p = parts.current
    if (!root.current) return
    root.current.position.copy(rider.pos)
    root.current.quaternion.copy(rider.quat)
    leanRef.current.rotation.z = rider.lean
    leanRef.current.rotation.x = rider.tumble
    steerRef.current.rotation.y = rider.steer
    rearWheel.current.rotation.x = rider.wheel
    frontWheel.current.rotation.x = rider.wheel
    body.current.position.y = rider.pedalling ? Math.sin(rider.pedal * 2) * 0.012 : 0

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
      const fy = _b.y + 0.08
      const fz = _b.z
      const dz = fz - HIP.z
      const dy = fy - HIP.y
      const dist = Math.min(Math.hypot(dz, dy), THIGH + SHIN - 0.001)
      const base = Math.atan2(dy, dz)
      const bend = Math.acos((THIGH * THIGH + dist * dist - SHIN * SHIN) / (2 * THIGH * dist))
      const ang = base + bend
      _a.set(hipX, HIP.y, HIP.z)
      _k.set(hipX + side * 0.03, HIP.y + Math.sin(ang) * THIGH, HIP.z + Math.cos(ang) * THIGH)
      _b.set(px, fy, fz)
      placeLimb(p['thigh' + s], _a, _k)
      placeLimb(p['shin' + s], _k, _b)
      p['knee' + s].position.copy(_k)
      p['shoe' + s].position.set(px, fy - 0.03, fz + 0.07)

      // Arms follow the handlebar as it turns.
      _a.set(side * 0.25, 1.62, -0.02)
      _b.set(side * 0.27, 1.19, -0.02).applyAxisAngle(_yAxis, rider.steer)
      _b.z += STEER_Z
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
        <Tube a={BB} b={SEAT} color={C.frame} r={0.04} />
        <Tube a={BB} b={HEAD} color={C.frame} r={0.045} />
        <Tube a={SEAT} b={HEAD} color={C.frame} r={0.04} />
        <Tube a={SEAT} b={REAR} color={C.frame} r={0.03} />
        <Tube a={BB} b={REAR} color={C.frame} r={0.03} />
        <mesh castShadow position={[0, 1.05, -0.4]}>
          <boxGeometry args={[0.18, 0.07, 0.34]} />
          {std(C.tyre, 0.9)}
        </mesh>
        <Wheel innerRef={rearWheel} position={REAR} />

        {/* Steering: fork, front wheel, handlebar */}
        <group ref={steerRef} position={[0, 0, STEER_Z]}>
          <Tube a={new THREE.Vector3(0, 1.22, -0.03)} b={new THREE.Vector3(0, 0.98, 0.0)} color={C.metal} r={0.035} />
          <Tube a={new THREE.Vector3(0.07, 0.98, 0.0)} b={new THREE.Vector3(0.07, WHEEL_R, 0.22)} color={C.frame} r={0.028} />
          <Tube a={new THREE.Vector3(-0.07, 0.98, 0.0)} b={new THREE.Vector3(-0.07, WHEEL_R, 0.22)} color={C.frame} r={0.028} />
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
            <meshStandardMaterial color={C.flag} side={THREE.DoubleSide} roughness={0.8} />
          </mesh>
        </group>

        {/* Rider */}
        <group ref={body}>
          <mesh castShadow position={torso.position} quaternion={torso.quaternion}>
            <capsuleGeometry args={[0.23, torso.length - 0.2, 4, 10]} />
            {std(C.jacket)}
          </mesh>
          <mesh castShadow position={[0, 1.52, -0.4]} rotation={[0.58, 0, 0]}>
            <boxGeometry args={[0.36, 0.44, 0.22]} />
            {std(C.pack)}
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
            {std(C.helmet, 0.45)}
          </mesh>
          <mesh position={[0, 2.085, 0.075]} rotation={[-0.12, 0, 0]}>
            <boxGeometry args={[0.09, 0.46, 0.5]} />
            {std(C.stripe, 0.45)}
          </mesh>
          <mesh position={[0, 2.0, 0.36]} rotation={[0.25, 0, 0]}>
            <boxGeometry args={[0.36, 0.04, 0.14]} />
            {std(C.helmet, 0.45)}
          </mesh>
          {[1, -1].map((s) => (
            <mesh key={s} position={[s * 0.1, 1.95, 0.33]}>
              <sphereGeometry args={[0.032, 6, 6]} />
              <meshBasicMaterial color="#2c2f3a" />
            </mesh>
          ))}
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
              <mesh ref={set('arm' + s)} geometry={armGeo} castShadow>{std(C.jacket)}</mesh>
              <mesh ref={set('hand' + s)}>
                <sphereGeometry args={[0.075, 8, 6]} />
                {std(C.skin)}
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  )
}
