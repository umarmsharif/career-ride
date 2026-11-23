// Parts every island shares: the land, pickups, gates, the signboard and the sky.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Kit, islandBody, islandTop, textTexture, rng } from './kit.js'
import { clock, collectedAt, useGame, rider } from './state.js'

export const toyMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.82 })
export const toyMaterialDouble = new THREE.MeshStandardMaterial({
  vertexColors: true,
  flatShading: true,
  roughness: 0.82,
  side: THREE.DoubleSide,
})

export function Land({ outline, grass = '#a5d86e', colors, seed = 7, y = 0 }) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const body = useMemo(() => islandBody(outline, colors, seed), [outline, colors, seed])
  const top = useMemo(() => islandTop(outline), [outline])
  return (
    <group position={[0, y, 0]}>
      <mesh geometry={top} receiveShadow>
        <meshStandardMaterial color={grass} roughness={0.95} />
      </mesh>
      <mesh geometry={body} material={toyMaterial} />
    </group>
  )
}

export function Static({ build, deps = [], double = false }) {
  const geo = useMemo(() => {
    const kit = new Kit()
    build(kit)
    return kit.build()
  }, deps)
  return <mesh geometry={geo} material={double ? toyMaterialDouble : toyMaterial} castShadow receiveShadow />
}

function Stop({ id, index, x, z, kind }) {
  const group = useRef()
  const gem = useRef()
  const ring = useRef()
  const glow = useRef()
  const done = useRef()
  const sparks = useRef()
  const dirs = useMemo(() => {
    const r = rng(index * 31 + 5)
    return Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2 + r()
      return [Math.cos(a), 0.6 + r() * 0.9, Math.sin(a)]
    })
  }, [index])

  useFrame(() => {
    const t = clock.t
    const at = collectedAt[id]?.[index]
    const since = at === undefined ? -1 : t - at
    const live = since < 0
    gem.current.rotation.y = t * 1.6 + index
    ring.current.rotation.z = -t * 1.1
    ring.current.rotation.x = Math.PI / 2 + Math.sin(t * 1.3 + index) * 0.5
    const bob = Math.sin(t * 2.2 + index * 1.7) * 0.18
    if (live) {
      group.current.visible = true
      group.current.position.y = 1.55 + bob
      group.current.scale.setScalar(1)
      glow.current.visible = true
      glow.current.scale.setScalar(1 + Math.sin(t * 3 + index) * 0.08)
    } else {
      const k = Math.min(since / 0.45, 1)
      group.current.visible = k < 1
      group.current.position.y = 1.55 + k * 2.2
      group.current.scale.setScalar(1 + k * 1.3 - k * k * 2.2)
      glow.current.visible = false
    }
    done.current.visible = !live
    sparks.current.visible = since >= 0 && since < 0.8
    if (sparks.current.visible) {
      const k = since / 0.8
      sparks.current.children.forEach((m, i) => {
        const d = dirs[i]
        m.position.set(d[0] * k * 3.2, 1.5 + d[1] * k * 3 - k * k * 2.5, d[2] * k * 3.2)
        m.scale.setScalar(1 - k)
        m.rotation.set(k * 6, k * 4, 0)
      })
    }
  })

  return (
    <group position={[x, 0, z]}>
      <group ref={group}>
        <mesh ref={gem} castShadow>
          <octahedronGeometry args={[0.62, 0]} />
          <meshStandardMaterial color={kind === 'fact' ? '#ffd23f' : '#7fe3d4'} emissive={kind === 'fact' ? '#ff9f1c' : '#1f9d8f'} emissiveIntensity={0.75} roughness={0.3} flatShading />
        </mesh>
        <mesh ref={ring}>
          <torusGeometry args={[0.98, 0.05, 6, 28]} />
          <meshBasicMaterial color="#fff6e4" />
        </mesh>
      </group>
      <mesh ref={glow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
        <ringGeometry args={[1.25, 1.6, 28]} />
        <meshBasicMaterial color="#ffd23f" transparent opacity={0.85} />
      </mesh>
      <mesh ref={done} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]} visible={false}>
        <ringGeometry args={[0.95, 1.2, 28]} />
        <meshBasicMaterial color="#1f9d8f" transparent opacity={0.7} />
      </mesh>
      <group ref={sparks} visible={false}>
        {dirs.map((_, i) => (
          <mesh key={i}>
            <tetrahedronGeometry args={[0.22, 0]} />
            <meshBasicMaterial color={i % 2 ? '#ffd23f' : '#fff6e4'} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

// The tokens (and machine, board and card markers) of one island.
export function Stops({ island }) {
  return island.stops.map((p, i) => <Stop key={i} id={island.id} index={i} x={p.x} z={p.z} kind={p.kind} />)
}

// An archway with a year plaque. The exit gate glows.
export function Gate({ x, z, y = 0, year, glow = false, face = Math.PI / 2 }) {
  const tex = useMemo(() => textTexture(String(year), { w: 384, h: 160, size: 112, bg: '#22304f', fg: '#fff6e4' }), [year])
  const portal = useRef()
  useFrame(() => {
    if (portal.current) {
      portal.current.material.opacity = 0.32 + Math.sin(clock.t * 2.4) * 0.12
      portal.current.scale.setScalar(1 + Math.sin(clock.t * 1.7) * 0.03)
    }
  })
  return (
    <group position={[x, y, z]} rotation={[0, face, 0]}>
      <Static
        deps={[]}
        build={(k) => {
          for (const s of [1, -1]) {
            k.box(1.2, 0.5, 1.2, '#c98a5e', { p: [s * 4.4, 0.25, 0] })
            k.box(0.85, 9.0, 0.85, '#fff1dc', { p: [s * 4.4, 4.8, 0] })
            k.box(1.1, 0.35, 1.1, '#f0553f', { p: [s * 4.4, 9.4, 0] })
            k.ball(0.45, '#f2a541', { p: [s * 4.4, 9.95, 0] })
          }
          k.box(9.7, 0.7, 0.9, '#f0553f', { p: [0, 9.0, 0] })
          k.box(4.6, 2.0, 0.5, '#fff1dc', { p: [0, 10.3, 0] })
          // Bunting.
          for (let i = 0; i < 9; i++) {
            const u = (i + 0.5) / 9
            const cx = -3.9 + u * 7.8
            const sag = Math.sin(u * Math.PI) * 0.5
            k.cone(0.26, 0.5, ['#1f9d8f', '#f2a541', '#f0553f'][i % 3], { p: [cx, 8.4 - sag, 0], r: [Math.PI, 0, 0] }, 3)
          }
        }}
      />
      {[0.27, -0.27].map((o) => (
        <mesh key={o} position={[0, 10.3, o]} rotation={[0, o > 0 ? 0 : Math.PI, 0]}>
          <planeGeometry args={[4.1, 1.6]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
      ))}
      {glow && (
        <mesh ref={portal} position={[0, 4.4, 0]}>
          <planeGeometry args={[8, 8.3]} />
          <meshBasicMaterial color="#ffe08a" transparent opacity={0.35} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

// A roadside banner naming a district.
export function Banner({ x, z, face, text }) {
  const tex = useMemo(() => textTexture(text, { w: 640, h: 150, size: 84, bg: '#fff6e4', fg: '#22304f' }), [text])
  return (
    <group position={[x, 0, z]} rotation={[0, face, 0]}>
      <Static
        build={(k) => {
          for (const s of [1, -1]) k.cyl(0.13, 0.16, 3.6, '#8b5e3c', { p: [s * 2.7, 1.8, 0] })
          k.box(6.2, 1.7, 0.24, '#f0553f', { p: [0, 3.1, 0] })
        }}
      />
      {[0.13, -0.13].map((o) => (
        <mesh key={o} position={[0, 3.1, o]} rotation={[0, o > 0 ? 0 : Math.PI, 0]}>
          <planeGeometry args={[5.8, 1.36]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

// The signboard: riding near it opens the role summary in the HUD.
export function Signboard({ id, x, z, face }) {
  const marker = useRef()
  const read = useGame((s) => !!s.signRead[id])
  useFrame(() => {
    marker.current.position.y = 5.5 + Math.sin(clock.t * 2.6) * 0.22
    marker.current.rotation.y = clock.t * 1.4
  })
  return (
    <group position={[x, 0, z]} rotation={[0, face, 0]}>
      <Static
        build={(k) => {
          for (const s of [1, -1]) k.cyl(0.16, 0.2, 4.2, '#8b5e3c', { p: [s * 1.9, 2.1, 0] })
          k.box(4.8, 3.0, 0.3, '#a86b47', { p: [0, 3.0, 0] })
          k.box(4.4, 2.6, 0.1, '#fff6e4', { p: [0, 3.0, 0.2] })
          k.box(4.4, 0.55, 0.12, '#f0553f', { p: [0, 4.02, 0.21] })
          ;[3.45, 3.05, 2.65, 2.25].forEach((y, i) => k.box(i === 3 ? 2.2 : 3.6, 0.16, 0.12, '#22304f', { p: [i === 3 ? -0.7 : 0, y, 0.21] }))
          k.box(5.2, 0.3, 0.7, '#e2674a', { p: [0, 4.65, 0] })
        }}
      />
      <mesh ref={marker} position={[0, 5.5, 0]} visible={!read}>
        <octahedronGeometry args={[0.36, 0]} />
        <meshBasicMaterial color="#1f9d8f" />
      </mesh>
    </group>
  )
}

const skyVert = `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`
const skyFrag = `varying vec3 vDir; uniform vec3 top; uniform vec3 mid; uniform vec3 low;
void main(){ float h = vDir.y; vec3 c = h > 0.0 ? mix(mid, top, pow(h, 0.55)) : mix(mid, low, pow(-h, 0.5));
gl_FragColor = vec4(c, 1.0); }`

export function Sky() {
  const ref = useRef()
  const clouds = useRef()
  const cloudGeo = useMemo(() => {
    const r = rng(42)
    const k = new Kit()
    for (let i = 0; i < 26; i++) {
      const a = r() * Math.PI * 2
      const d = 70 + r() * 190
      const y = -34 + r() * 70
      const s = 2.2 + r() * 3.6
      k.at({ p: [60 + Math.cos(a) * d, y, -20 + Math.sin(a) * d], r: [0, r() * 6, 0] }, () => {
        k.ball(s * 1.5, '#ffffff', { p: [0, 0, 0], s: [1.5, 0.75, 1] })
        k.ball(s * 1.1, '#ffffff', { p: [s * 1.6, -0.2 * s, 0.3 * s], s: [1.3, 0.75, 1] })
        k.ball(s * 0.95, '#ffffff', { p: [-s * 1.7, -0.25 * s, -0.2 * s], s: [1.3, 0.7, 1] })
        k.ball(s, '#ffffff', { p: [0.3 * s, 0.55 * s, 0], s: [1.1, 0.8, 1] })
      })
    }
    return k.build()
  }, [])
  const uniforms = useMemo(
    () => ({
      top: { value: new THREE.Color('#4fb3ea') },
      mid: { value: new THREE.Color('#d6f1fb') },
      low: { value: new THREE.Color('#fff0d6') },
    }),
    []
  )
  useFrame(({ camera }) => {
    ref.current.position.copy(camera.position)
    clouds.current.position.x = Math.sin(clock.t * 0.02) * 14
  })
  return (
    <>
      <mesh ref={ref} renderOrder={-1} frustumCulled={false}>
        <sphereGeometry args={[400, 24, 16]} />
        <shaderMaterial vertexShader={skyVert} fragmentShader={skyFrag} uniforms={uniforms} side={THREE.BackSide} depthWrite={false} fog={false} />
      </mesh>
      <mesh ref={clouds} geometry={cloudGeo}>
        <meshStandardMaterial color="#ffffff" flatShading roughness={1} emissive="#bcd9ea" emissiveIntensity={0.35} />
      </mesh>
    </>
  )
}

// Sun and soft fill. The shadow follows the rider so its map stays sharp.
export function Lights() {
  const sun = useRef()
  const target = useMemo(() => new THREE.Object3D(), [])
  useFrame(() => {
    const p = rider.pos
    target.position.set(p.x, Math.max(p.y, 0), p.z)
    target.updateMatrixWorld()
    sun.current.position.set(p.x + 34, Math.max(p.y, 0) + 58, p.z + 26)
  })
  return (
    <>
      <hemisphereLight args={['#eef8ff', '#f6d7b4', 1.5]} />
      <primitive object={target} />
      <directionalLight
        ref={sun}
        target={target}
        color="#fff0d2"
        intensity={1.75}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-48}
        shadow-camera-right={48}
        shadow-camera-top={48}
        shadow-camera-bottom={-48}
        shadow-camera-near={1}
        shadow-camera-far={160}
        shadow-bias={-0.0006}
        shadow-normalBias={0.04}
      />
    </>
  )
}
