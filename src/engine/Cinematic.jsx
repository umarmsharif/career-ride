// The cinematic pass: the scene is photographed like a miniature. A soft glow on the brightest
// parts, blur that grows towards the top and bottom of the frame (the tilt-shift look of a
// close-up model shot), slightly richer colour and a gentle vignette. Desktop only.
import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame } from './state.js'
import { DRIVE } from './world.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { Pass } from 'three/examples/jsm/postprocessing/Pass.js'

const vert = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`

const TiltShift = {
  uniforms: { tDiffuse: { value: null }, dir: { value: new THREE.Vector2() }, focus: { value: 0.44 }, band: { value: 0.16 }, amount: { value: 2.4 } },
  vertexShader: vert,
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 dir; uniform float focus; uniform float band; uniform float amount; varying vec2 vUv;
void main(){
  float r = smoothstep(band, 0.56, abs(vUv.y - focus)) * amount;
  vec4 c = texture2D(tDiffuse, vUv) * 0.227;
  c += (texture2D(tDiffuse, vUv + dir * r) + texture2D(tDiffuse, vUv - dir * r)) * 0.194;
  c += (texture2D(tDiffuse, vUv + dir * r * 2.0) + texture2D(tDiffuse, vUv - dir * r * 2.0)) * 0.122;
  c += (texture2D(tDiffuse, vUv + dir * r * 3.0) + texture2D(tDiffuse, vUv - dir * r * 3.0)) * 0.054;
  c += (texture2D(tDiffuse, vUv + dir * r * 4.0) + texture2D(tDiffuse, vUv - dir * r * 4.0)) * 0.016;
  gl_FragColor = c;
}`,
}

const Grade = {
  uniforms: { tDiffuse: { value: null } },
  vertexShader: vert,
  fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
void main(){
  vec4 c = texture2D(tDiffuse, vUv);
  float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
  c.rgb = mix(vec3(l), c.rgb, 1.1);
  c.rgb = (c.rgb - 0.5) * 1.04 + 0.5;
  vec2 d = vUv - 0.5;
  c.rgb *= 1.0 - 0.34 * smoothstep(0.35, 0.95, length(d * vec2(1.0, 0.82)) * 1.5);
  gl_FragColor = c;
}`,
}

// Remembers how much the scene itself cost to draw, before the full-screen passes run.
class CountPass extends Pass {
  constructor(store) {
    super()
    this.store = store
    this.needsSwap = false
  }
  render(renderer) {
    Object.assign(this.store, renderer.info.render)
  }
}

export const sceneCost = { calls: 0, triangles: 0 }

export default function Cinematic() {
  const { gl, scene, camera, size } = useThree()
  const rig = useMemo(() => {
    const target = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 })
    const composer = new EffectComposer(gl, target)
    composer.addPass(new RenderPass(scene, camera))
    composer.addPass(new CountPass(sceneCost))
    const bloom = new UnrealBloomPass(new THREE.Vector2(4, 4), DRIVE ? 0.42 : 0.14, DRIVE ? 0.6 : 0.5, DRIVE ? 0.88 : 0.95)
    composer.addPass(bloom)
    const h = new ShaderPass(TiltShift)
    const v = new ShaderPass(TiltShift)
    composer.addPass(h)
    composer.addPass(v)
    composer.addPass(new ShaderPass(Grade))
    composer.addPass(new OutputPass())
    return { composer, h, v }
  }, [gl, scene, camera])

  useEffect(() => {
    const ratio = Math.min(gl.getPixelRatio(), 1.5)
    rig.composer.setPixelRatio(ratio)
    rig.composer.setSize(size.width, size.height)
    rig.h.uniforms.dir.value.set(1 / size.width, 0)
    rig.v.uniforms.dir.value.set(0, 1 / size.height)
  }, [rig, gl, size])

  useEffect(() => {
    gl.info.autoReset = false
    return () => {
      gl.info.autoReset = true
      rig.composer.dispose()
    }
  }, [gl, rig])

  // Taking over the frame: priority 1 stops the default render and runs the composer instead.
  useFrame(() => {
    // At the finale the focus lifts to the board over the door, so its name is sharp.
    const closing = useGame.getState().phase === 'closing'
    for (const pass of [rig.h, rig.v]) {
      const u = pass.uniforms
      u.focus.value += ((closing ? 0.74 : 0.44) - u.focus.value) * 0.04
      u.band.value += ((closing ? 0.3 : 0.16) - u.band.value) * 0.04
    }
    gl.info.reset()
    rig.composer.render()
  }, 1)
  return null
}
