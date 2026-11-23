import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import World from './World.jsx'
import Hud from './ui/Hud.jsx'
import { useGame } from './engine/state.js'

export default function App() {
  // A tap anywhere on the scene moves a hands-free ride on from a stop.
  const onTap = () => {
    const s = useGame.getState()
    if (s.touch && s.waiting) s.resume()
  }
  return (
    <div className="stage" onPointerUp={onTap}>
      <Canvas
        flat
        shadows={{ type: THREE.PCFSoftShadowMap }}
        dpr={[1, 2]}
        camera={{ fov: 46, near: 0.5, far: 900, position: [60, 40, 60] }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <World />
      </Canvas>
      <Hud />
    </div>
  )
}
