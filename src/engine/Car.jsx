// The car: an open-top two-seater with the driver at the wheel. The same journey as the bicycle, driven. It takes each company's colour, carries the
// company profiles on its roof rack, slides its tail out on hard corners, and at the very end
// the driver's door opens and the driver steps out.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Kit } from './kit.js'
import { rider, clock, useGame } from './state.js'
import { look } from './day.js'
import career from '../content/career.json'

const LIME = '#C8FF3D'
const SCALE = 0.8
const SMOKE = 40
const brandOf = (id) => career.islands.find((i) => i.id === id).brand
const _c = new THREE.Color()
const _m = new THREE.Matrix4()
const _p = new THREE.Vector3()
const _s = new THREE.Vector3()
const _fwd = new THREE.Vector3()
const _left = new THREE.Vector3()

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

export default function Car({ ids }) {
  const root = useRef()
  const yaw = useRef()
  const body = useRef()
  const wheels = useRef([])
  const steerers = useRef([])
  const door = useRef()
  const driver = useRef()
  const smoke = useRef()
  const spot = useRef()
  const beam = useRef()
  const target = useMemo(() => new THREE.Object3D(), [])
  const profiles = useGame((s) => s.profiles)
  const glow = useMemo(glowTexture, [])
  const puffs = useMemo(() => Array.from({ length: SMOKE }, () => ({ life: 0, x: 0, y: 0, z: 0, vx: 0, vz: 0, s: 1 })), [])
  const st = useRef({ puff: 0 }).current

  const paint = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f37440', roughness: 0.35, metalness: 0.3, flatShading: true, emissive: '#f37440', emissiveIntensity: 0.18 }), [])
  const trim = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.6 }), [])
  const shell = useMemo(() => {
    // +Z is the nose. The driver sits on the left (+X).
    const g = new THREE.BoxGeometry(2.0, 0.55, 4.4)
    g.translate(0, 0.66, 0)
    // No roof: a folded hood sits behind the seats.
    const roof = new THREE.BoxGeometry(1.74, 0.22, 0.5)
    roof.translate(0, 1.02, -1.25)
    const wing = new THREE.BoxGeometry(1.7, 0.09, 0.32)
    wing.translate(0, 1.3, -2.12)
    const k = new Kit()
    k.add(g, '#ffffff')
    k.add(roof, '#ffffff')
    k.add(wing, '#ffffff')
    const out = k.build()
    out.deleteAttribute('color')
    return out
  }, [])
  const dark = useMemo(() => {
    const k = new Kit()
    // The open cabin: floor, two seats, the dash and a windscreen frame.
    k.box(1.72, 0.06, 1.96, '#0c1020', { p: [0, 0.95, -0.25] })
    for (const sx of [0.45, -0.45]) {
      k.box(0.6, 0.16, 0.6, '#2a1c1c', { p: [sx, 1.04, -0.45] })
      k.box(0.6, 0.62, 0.14, '#2a1c1c', { p: [sx, 1.3, -0.8] })
    }
    k.box(1.7, 0.2, 0.3, '#151a2c', { p: [0, 1.06, 0.62] })
    k.box(1.74, 0.07, 0.07, '#aab4c0', { p: [0, 1.52, 0.72] })
    for (const sx of [0.84, -0.84]) k.box(0.07, 0.5, 0.07, '#aab4c0', { p: [sx, 1.28, 0.74], r: [-0.25, 0, 0] })
    k.box(2.06, 0.2, 0.5, '#0c1020', { p: [0, 0.46, 2.14] })
    k.box(2.06, 0.2, 0.4, '#0c1020', { p: [0, 0.46, -2.14] })
    for (const sx of [1, -1]) k.box(0.1, 0.34, 0.1, '#0c1020', { p: [sx * 0.7, 1.12, -2.1] })
    // The driver, seated on the left: navy suit, white shirt, dark hair and beard.
    k.box(0.5, 0.56, 0.3, '#1b2644', { p: [0.45, 1.4, -0.52] })
    k.box(0.16, 0.3, 0.06, '#f2f2f2', { p: [0.45, 1.5, -0.36] })
    k.box(0.12, 0.12, 0.5, '#1b2644', { p: [0.24, 1.42, -0.2] })
    k.box(0.12, 0.12, 0.5, '#1b2644', { p: [0.66, 1.42, -0.2] })
    k.ball(0.19, '#e2b48c', { p: [0.45, 1.88, -0.5] }, 1)
    k.box(0.36, 0.14, 0.36, '#1a1a1c', { p: [0.45, 2.02, -0.54] })
    k.box(0.3, 0.16, 0.14, '#1a1a1c', { p: [0.45, 1.76, -0.36] })
    k.cyl(0.17, 0.17, 0.04, '#0c1020', { p: [0.45, 1.3, 0.3], r: [1.1, 0, 0] })
    return k.build()
  }, [])

  useFrame((frame, raw) => {
    const dt = Math.min(raw, 0.05)
    const g = useGame.getState()
    const brand = brandOf(ids[Math.min(ids.length - 1, g.island)])
    const k = 1 - Math.exp(-3 * dt)
    paint.color.lerp(_c.set(brand.primary), k)
    paint.emissive.copy(paint.color)
    paint.emissiveIntensity = 0.1 + look.night * 0.16

    root.current.position.copy(rider.pos)
    root.current.quaternion.copy(rider.quat)
    root.current.scale.setScalar(SCALE)
    const slip = rider.slip || 0
    yaw.current.rotation.y = slip
    yaw.current.rotation.x = rider.tumble
    body.current.rotation.z = rider.lean * 0.35 - slip * 0.07
    wheels.current.forEach((w) => w && (w.rotation.x = rider.wheel))
    steerers.current.forEach((w) => w && (w.rotation.y = rider.steer * 0.9 - slip * 0.8))
    door.current.rotation.y = (rider.door || 0) * 1.15
    const out = rider.out || 0
    driver.current.visible = out > 0.02
    driver.current.position.set(1.25 + out * 1.3, 0, 0.1 - out * 0.2)
    driver.current.scale.setScalar(0.4 + out * 0.6)

    // Headlights come up as the light goes.
    const dark = Math.max(0.15, look.night)
    _fwd.set(0, 0, 1).applyQuaternion(rider.quat)
    _fwd.applyAxisAngle(THREE.Object3D.DEFAULT_UP, slip)
    spot.current.position.set(rider.pos.x + _fwd.x * 1.4, rider.pos.y + 2.6, rider.pos.z + _fwd.z * 1.4)
    target.position.set(rider.pos.x + _fwd.x * 16, rider.pos.y + _fwd.y * 16, rider.pos.z + _fwd.z * 16)
    target.updateMatrixWorld()
    spot.current.intensity = 14 + dark * 95
    beam.current.material.opacity = 0.08 + dark * 0.26

    // Tyre smoke while the tail is out.
    st.puff += dt
    if (rider.drift && st.puff > 0.03) {
      st.puff = 0
      const q = puffs.find((x) => x.life <= 0)
      if (q) {
        const side = Math.random() < 0.5 ? 1 : -1
        _left.set(1, 0, 0).applyQuaternion(rider.quat).applyAxisAngle(THREE.Object3D.DEFAULT_UP, slip)
        q.x = rider.pos.x - _fwd.x * 1.5 + _left.x * side * 0.75
        q.z = rider.pos.z - _fwd.z * 1.5 + _left.z * side * 0.75
        q.y = rider.pos.y + 0.35
        q.vx = (Math.random() - 0.5) * 1.2
        q.vz = (Math.random() - 0.5) * 1.2
        q.s = 0.9 + Math.random() * 0.7
        q.life = 1
      }
    }
    const camQ = frame.camera.quaternion
    puffs.forEach((q, i) => {
      if (q.life > 0) {
        q.life -= dt / 1.2
        q.x += q.vx * dt
        q.z += q.vz * dt
        q.y += 1.2 * dt
        q.s += 2.6 * dt
      }
      const a = Math.max(0, q.life)
      smoke.current.setMatrixAt(i, _m.compose(_p.set(q.x, q.y, q.z), camQ, _s.setScalar(a > 0 ? q.s : 0.0001)))
      smoke.current.setColorAt(i, _c.setRGB(0.42 * a * a, 0.4 * a * a, 0.45 * a * a))
    })
    smoke.current.instanceMatrix.needsUpdate = true
    if (smoke.current.instanceColor) smoke.current.instanceColor.needsUpdate = true
  })

  const wheelGeo = useMemo(() => new THREE.CylinderGeometry(0.4, 0.4, 0.32, 10).rotateZ(Math.PI / 2), [])
  const wheelAt = [[0.96, 0.4, 1.4], [-0.96, 0.4, 1.4], [0.96, 0.4, -1.4], [-0.96, 0.4, -1.4]]
  const lime = useMemo(() => new THREE.Color(LIME).multiplyScalar(1.1), [])
  return (
    <>
      <group ref={root}>
        <group ref={yaw}>
          <group ref={body}>
            <mesh geometry={shell} material={paint} castShadow />
            <mesh geometry={dark} material={trim} castShadow />
            {/* A stripe in the colour of the route */}
            {[[0.945, 1.55, 1.3], [0.945, -1.85, 0.7]].map(([y, z, len]) => (
              <mesh key={z} position={[0, y, z]}>
                <boxGeometry args={[0.44, 0.02, len]} />
                <meshBasicMaterial color={lime} toneMapped={false} />
              </mesh>
            ))}
            {[0.68, -0.68].map((x) => (
              <mesh key={x} position={[x, 0.7, 2.22]}>
                <boxGeometry args={[0.4, 0.2, 0.06]} />
                <meshBasicMaterial color={new THREE.Color(3, 2.7, 2)} toneMapped={false} />
              </mesh>
            ))}
            <mesh position={[0, 0.74, -2.22]}>
              <boxGeometry args={[1.8, 0.14, 0.06]} />
              <meshBasicMaterial color={new THREE.Color(2.4, 0.15, 0.2)} toneMapped={false} />
            </mesh>
            {/* The company profiles picked up so far, stacked on the passenger seat */}
            {profiles.map((id, i) => (
              <mesh key={id} position={[-0.45, 1.2 + i * 0.07, -0.42]} rotation={[0, 0, 0]}>
                <boxGeometry args={[0.5, 0.06, 0.4]} />
                <meshStandardMaterial color={brandOf(id).primary} roughness={0.6} emissive={brandOf(id).primary} emissiveIntensity={0.25} />
              </mesh>
            ))}
            {/* The driver's door, hinged at its front edge */}
            <group ref={door} position={[1.01, 0.66, 0.7]}>
              <mesh position={[0.02, 0.22, -0.6]} material={paint}>
                <boxGeometry args={[0.07, 0.95, 1.2]} />
              </mesh>
            </group>
          </group>
          {wheelAt.map((p, i) => (
            <group key={i} ref={(m) => i < 2 && (steerers.current[i] = m)} position={p}>
              <mesh ref={(m) => (wheels.current[i] = m)} rotation={[0, 0, 0]}>
                <primitive object={wheelGeo} attach="geometry" />
                <meshStandardMaterial color="#0b0e1a" roughness={0.9} flatShading />
              </mesh>
            </group>
          ))}
          <mesh ref={beam} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.09, 7.6]}>
            <planeGeometry args={[7.5, 13]} />
            <meshBasicMaterial map={glow} color="#fff0c8" transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
          {/* A simple stand-in for the driver, until the filmed clip replaces this moment */}
          <group ref={driver} visible={false}>
            <mesh position={[0, 1.0, 0]} castShadow>
              <capsuleGeometry args={[0.3, 0.9, 4, 8]} />
              <meshStandardMaterial color="#1b2644" roughness={0.6} flatShading />
            </mesh>
            <mesh position={[0, 1.95, 0]}>
              <sphereGeometry args={[0.27, 10, 8]} />
              <meshStandardMaterial color="#d9a47c" roughness={0.7} flatShading />
            </mesh>
          </group>
        </group>
      </group>
      <instancedMesh ref={smoke} args={[null, null, SMOKE]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={glow} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      <primitive object={target} />
      <spotLight ref={spot} target={target} color="#ffe9c0" intensity={60} distance={34} angle={0.5} penumbra={0.85} decay={1.5} />
    </>
  )
}
