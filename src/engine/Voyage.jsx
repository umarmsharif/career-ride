// The voyage world: a sea around the islands, a sailboat for the crossings, wooden piers,
// lighthouses and gulls. Only mounted when career.json sets "world": "voyage".
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Kit } from './kit.js'
import { rideRibbon } from './rideCurve.js'
import { Static, toyMaterial, toyMaterialDouble } from './IslandParts.jsx'
import { rider, clock, useGame } from './state.js'
import { look } from './day.js'
import { SEA, DECK } from './world.js'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js'

const CELL = 6
const N = 44

// Low-poly water. A patch of moving facets follows the camera; a wide flat sheet carries the
// colour out to the horizon. `offset` keeps the waves fixed to the world as islands change.
export function Sea({ offset }) {
  const mesh = useRef()
  const far = useRef()
  const mat = useRef()
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(CELL * N, CELL * N, N, N)
    g.rotateX(-Math.PI / 2)
    return g.toNonIndexed()
  }, [])
  const deep = useMemo(() => new THREE.Color(), [])
  useFrame(({ camera }) => {
    const m = mesh.current
    const cx = Math.round(camera.position.x / CELL) * CELL
    const cz = Math.round(camera.position.z / CELL) * CELL
    m.position.set(cx, SEA, cz)
    far.current.position.set(cx, SEA - 0.35, cz)
    const p = geo.attributes.position
    const t = clock.t
    const ox = cx + offset.x
    const oz = cz + offset.z
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) + ox
      const z = p.getZ(i) + oz
      p.setY(i, Math.sin(x * 0.11 + t * 0.9) * 0.22 + Math.sin(z * 0.14 - t * 0.7) * 0.18 + Math.sin((x + z) * 0.05 + t * 0.4) * 0.2)
    }
    p.needsUpdate = true
    geo.computeVertexNormals()
    // The water takes some of the sky's colour, so it turns gold and then dark with the day.
    deep.set('#2f9fc4').lerp(look.mid, 0.28).multiplyScalar(1 - look.night * 0.45)
    mat.current.color.copy(deep)
    far.current.material.color.copy(deep).multiplyScalar(0.94)
  })
  return (
    <>
      <mesh ref={far} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
        <planeGeometry args={[2400, 2400]} />
        <meshStandardMaterial color="#2f9fc4" roughness={0.6} />
      </mesh>
      <mesh ref={mesh} geometry={geo} receiveShadow frustumCulled={false}>
        <meshStandardMaterial ref={mat} color="#2f9fc4" roughness={0.42} metalness={0.05} flatShading />
      </mesh>
    </>
  )
}

// The wooden piers at each end of a crossing, where the road used to be.
export function Piers({ ride, tipX, endY }) {
  const colors = ['#d9b98a', '#8b5e3c', '#b98c5e', '#8b5e3c']
  const out = useMemo(() => rideRibbon(ride, { to: ride.seaFrom + 3, width: 4.4, colors }), [ride])
  const back = useMemo(
    () => rideRibbon(ride, { from: ride.seaTo - 2, width: 4.4, colors, until: (p) => p.x > tipX + 1.2 && Math.abs(p.y - endY) < 0.3 }),
    [ride, tipX, endY]
  )
  return (
    <>
      <mesh geometry={out} material={toyMaterialDouble} receiveShadow castShadow />
      <mesh geometry={back} material={toyMaterialDouble} receiveShadow castShadow />
      <Static
        deps={[ride]}
        build={(k) => {
          // Posts down into the water, and a mooring bollard where each pier ends.
          const post = (f) => {
            for (const s of [1, -1]) {
              const x = f.p.x + f.left.x * 2 * s
              const z = f.p.z + f.left.z * 2 * s
              const top = f.p.y + 0.5
              k.cyl(0.16, 0.2, top - (SEA - 1.5), '#6f4a30', { p: [x, (top + SEA - 1.5) / 2, z] }, 6)
            }
          }
          for (let i = 4; i < ride.seaFrom + 2; i += 9) post(ride.frames[i])
          for (let i = ride.seaTo - 1; i < ride.frames.length; i += 9) {
            const f = ride.frames[i]
            if (f.p.x > tipX - 0.5) break
            post(f)
          }
          for (const i of [ride.seaFrom + 2, ride.seaTo - 2]) {
            const f = ride.frames[i]
            k.cyl(0.3, 0.34, 0.9, '#22304f', { p: [f.p.x + f.left.x * 2.4, f.p.y + 0.5, f.p.z + f.left.z * 2.4] }, 8)
          }
        }}
      />
    </>
  )
}

const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _yAxis = new THREE.Vector3(0, 1, 0)
const _c = new THREE.Color()

// The sailboat. It waits at the end of the pier, carries the rider across and stays at the far pier.
export function Boat({ ride, sail }) {
  const root = useRef()
  const cloth = useRef()
  const out = useMemo(() => ({ pos: new THREE.Vector3(), tangent: new THREE.Vector3(), left: new THREE.Vector3(), normal: new THREE.Vector3(), quat: new THREE.Quaternion(), bank: 0 }), [])
  const hull = useMemo(() => {
    const k = new Kit()
    // Local axes match the rider: +Z is the bow. The deck is at y = 0.
    k.box(3.0, 0.9, 5.6, '#fff1dc', { p: [0, -0.5, -0.2] })
    k.cone(1.5, 2.4, '#fff1dc', { p: [0, -0.5, 3.75], r: [Math.PI / 2, Math.PI / 4, 0], s: [1, 1, 0.42] }, 4)
    k.box(3.2, 0.22, 5.8, '#f0553f', { p: [0, 0.0, -0.2] })
    k.box(2.6, 0.08, 5.2, '#d9b98a', { p: [0, 0.12, -0.2] })
    k.box(3.0, 0.5, 0.2, '#c98a5e', { p: [0, 0.35, -3.0] })
    for (const s of [1, -1]) k.box(0.16, 0.5, 5.6, '#c98a5e', { p: [s * 1.5, 0.35, -0.2] })
    // Mast and yard ahead of the rider, so the sail fills the view behind the bike.
    k.cyl(0.09, 0.12, 6.6, '#8b5e3c', { p: [0, 3.3, 2.0] }, 6)
    k.box(3.9, 0.1, 0.1, '#8b5e3c', { p: [0, 1.5, 2.0] })
    k.ball(0.14, '#f2a541', { p: [0, 6.65, 2.0] }, 0)
    k.cone(0.22, 0.5, '#f0553f', { p: [0.3, 6.3, 2.0], r: [0, 0, -Math.PI / 2] }, 3)
    return k.build()
  }, [])
  const sailGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1.85, 1.6, 2.06, 1.85, 1.6, 2.06, 0, 6.3, 2.06], 3))
    g.computeVertexNormals()
    return g
  }, [])
  useFrame(() => {
    const g = useGame.getState()
    const riding = g.phase === 'ride'
    const f = riding ? THREE.MathUtils.clamp((rider.rideU || 0) * ride.N, ride.seaFrom + 3, ride.seaTo - 3) : ride.seaFrom + 3
    ride.sample(f / ride.N, out)
    const bob = Math.sin(clock.t * 1.7) * 0.1
    root.current.position.set(out.pos.x, DECK + bob - 0.14, out.pos.z)
    _q.setFromAxisAngle(_yAxis, Math.atan2(out.tangent.x, out.tangent.z))
    root.current.quaternion.copy(_q)
    root.current.scale.setScalar(1.35)
    root.current.rotation.z += Math.sin(clock.t * 1.3) * 0.03
    cloth.current.material.color.lerp(_c.set(sail), 0.1)
    cloth.current.scale.z = 1 + Math.sin(clock.t * 2.2) * 0.04
  })
  return (
    <group ref={root}>
      <mesh geometry={hull} material={toyMaterial} castShadow receiveShadow />
      <mesh ref={cloth} geometry={sailGeo} castShadow>
        <meshStandardMaterial color={sail} side={THREE.DoubleSide} roughness={0.8} flatShading />
      </mesh>
    </group>
  )
}

// A striped lighthouse with a lamp that brightens as the light goes.
export function Lighthouse({ x, y, z, scale = 1 }) {
  const lamp = useRef()
  const beam = useRef()
  useFrame(() => {
    beam.current.rotation.y = clock.t * 0.55
    const glow = 0.012 + look.night * 0.3
    beam.current.children.forEach((m) => (m.material.opacity = glow))
    lamp.current.material.emissiveIntensity = 0.5 + look.night * 2.2 + Math.max(0, Math.sin(clock.t * 2.4)) * (0.3 + look.night * 1.5)
  })
  return (
    <group position={[x, y, z]} scale={scale}>
      <Static
        build={(k) => {
          k.cyl(1.5, 1.7, 0.6, '#b9c2cc', { p: [0, 0.3, 0] }, 8)
          ;[0, 1, 2, 3].forEach((i) => k.cyl(1.15 - i * 0.13, 1.28 - i * 0.13, 1.7, i % 2 ? '#f0553f' : '#fff6e4', { p: [0, 1.45 + i * 1.7, 0] }, 8))
          k.cyl(1.05, 1.05, 0.2, '#22304f', { p: [0, 7.5, 0] }, 8)
          k.cone(0.95, 1.0, '#22304f', { p: [0, 9.3, 0] }, 8)
          k.ball(0.14, '#f2a541', { p: [0, 9.9, 0] }, 0)
        }}
      />
      <mesh ref={lamp} position={[0, 8.2, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 1.2, 8]} />
        <meshStandardMaterial color="#fff3b0" emissive="#ffd23f" emissiveIntensity={0.6} flatShading />
      </mesh>
      {/* The sweeping beam: faint by day, strong after sunset. */}
      <group ref={beam} position={[0, 8.2, 0]}>
        {[0, Math.PI].map((r) => (
          <mesh key={r} rotation={[0, r, Math.PI / 2]} position={[r ? -11 : 11, 0, 0]}>
            <coneGeometry args={[2.6, 22, 12, 1, true]} />
            <meshBasicMaterial color="#ffe9a8" transparent opacity={0.1} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

// A few gulls wheeling over the water near the rider.
export function Gulls() {
  const flock = useRef()
  const geo = useMemo(() => {
    const k = new Kit()
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2
      const r = 16 + (i % 3) * 7
      k.at({ p: [Math.cos(a) * r, (i % 4) * 1.6, Math.sin(a) * r], r: [0, -a, 0] }, () => {
        k.box(1.3, 0.06, 0.34, '#ffffff', { p: [0.6, 0.12, 0], r: [0, 0, 0.35] })
        k.box(1.3, 0.06, 0.34, '#ffffff', { p: [-0.6, 0.12, 0], r: [0, 0, -0.35] })
        k.box(0.2, 0.14, 0.7, '#e9eef2', { p: [0, 0, 0.05] })
      })
    }
    return k.build()
  }, [])
  useFrame(() => {
    flock.current.position.set(rider.pos.x + 10, rider.pos.y + 15 + Math.sin(clock.t * 0.5) * 1.5, rider.pos.z - 6)
    flock.current.rotation.y = clock.t * 0.16
  })
  return <mesh ref={flock} geometry={geo} material={toyMaterial} />
}


// --- cinematic water ---------------------------------------------------------
// A mirror at sea level: the islands, the sky and the boat are reflected in it, broken up by
// ripples, with the sun's glitter laid across the water towards the viewer. Desktop only.
const MirrorShader = {
  name: 'SeaMirror',
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    time: { value: 0 },
    sunDir: { value: new THREE.Vector3(0, 1, 0) },
    sunCol: { value: new THREE.Color('#fff0d2') },
    fogCol: { value: new THREE.Color('#d9eef6') },
    offset: { value: new THREE.Vector2() },
    night: { value: 0 },
  },
  vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vWorld;
void main(){ vUv = textureMatrix * vec4(position, 1.0); vWorld = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec3 color; uniform float time; uniform vec3 sunDir; uniform vec3 sunCol; uniform vec3 fogCol; uniform vec2 offset; uniform float night;
varying vec4 vUv; varying vec3 vWorld;
vec2 ripple(vec2 p, float t){
  vec2 n = vec2(cos(p.x * 0.33 + t * 0.9), cos(p.y * 0.41 - t * 0.7)) * 0.5;
  n += vec2(cos(dot(p, vec2(0.8, 0.6)) * 0.9 + t * 1.4), cos(dot(p, vec2(-0.6, 0.8)) * 1.1 - t * 1.2)) * 0.3;
  n += vec2(cos(dot(p, vec2(0.3, -0.95)) * 2.3 + t * 2.1), cos(dot(p, vec2(0.95, 0.3)) * 2.7 + t * 1.8)) * 0.16;
  return n;
}
void main(){
  vec3 toCam = cameraPosition - vWorld;
  float dist = length(toCam);
  vec3 V = toCam / dist;
  // Ripples calm down with distance, so the far water does not shimmer.
  float calm = 1.0 / (1.0 + dist * 0.014);
  vec2 r = ripple(vWorld.xz + offset, time);
  vec3 N = normalize(vec3(-r.x * 0.22 * calm, 1.0, -r.y * 0.22 * calm));
  vec4 uv = vUv;
  uv.xy += r * 0.035 * calm * uv.w;
  vec3 refl = texture2DProj(tDiffuse, uv).rgb;
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  vec3 c = mix(color, refl, clamp(0.22 + fres * 0.7, 0.0, 0.88));
  // The sun on the water: a tight glitter on each ripple and a broad soft path beneath it.
  vec3 H = normalize(sunDir + V);
  float day = 1.0 - night * 0.85;
  c += sunCol * pow(max(dot(N, H), 0.0), 260.0) * 2.4 * day;
  c += sunCol * pow(max(dot(reflect(-V, N), sunDir), 0.0), 14.0) * 0.26 * day;
  c = mix(c, fogCol, smoothstep(150.0, 430.0, dist));
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`,
}

export function MirrorSea({ offset }) {
  const mirror = useMemo(() => {
    const m = new Reflector(new THREE.PlaneGeometry(5000, 5000), { textureWidth: 1024, textureHeight: 1024, clipBias: 0.02, shader: MirrorShader, color: '#2f9fc4', multisample: 0 })
    m.rotation.x = -Math.PI / 2
    m.position.y = SEA
    m.frustumCulled = false
    return m
  }, [])
  useFrame(() => {
    const u = mirror.material.uniforms
    u.time.value = clock.t
    u.sunDir.value.copy(look.dir)
    u.sunCol.value.copy(look.sun)
    u.fogCol.value.copy(look.fog)
    u.offset.value.set(offset.x, offset.z)
    u.night.value = look.night
    u.color.value.set('#1f86ad').lerp(look.top, 0.25).multiplyScalar(1 - look.night * 0.5)
  })
  return <primitive object={mirror} />
}

// White water where the sea meets an island.
export function Foam({ outline }) {
  const ref = useRef()
  const geo = useMemo(() => {
    let cx = 0
    let cz = 0
    outline.forEach(([x, z]) => {
      cx += x
      cz += z
    })
    cx /= outline.length
    cz /= outline.length
    const v = []
    const at = (i, s) => {
      const [x, z] = outline[i % outline.length]
      return [cx + (x - cx) * s, 0, cz + (z - cz) * s]
    }
    for (let i = 0; i < outline.length; i++) {
      const a = at(i, 1.05)
      const b = at(i + 1, 1.05)
      const c = at(i, 1.155)
      const d = at(i + 1, 1.155)
      v.push(...a, ...b, ...c, ...b, ...d, ...c)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3))
    return g
  }, [outline])
  useFrame(() => {
    ref.current.material.opacity = 0.42 + Math.sin(clock.t * 1.1) * 0.14
    ref.current.scale.setScalar(1 + Math.sin(clock.t * 0.8) * 0.006)
  })
  return (
    <mesh ref={ref} geometry={geo} position={[0, SEA + 0.07, 0]}>
      <meshBasicMaterial color="#ffffff" transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  )
}
