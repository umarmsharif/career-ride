import { useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import World from './World.jsx'
import Hud from './ui/Hud.jsx'
import Timeline from './ui/Timeline.jsx'
import { useGame } from './engine/state.js'
import { loadIslands } from './islands/registry.js'

function canRender3D() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export default function App() {
  const [entries, setEntries] = useState(null)
  const webgl = useMemo(canRender3D, [])
  const reduced = useMemo(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, [])
  // Visitors who cannot run 3D, or who asked for less motion, get the timeline first.
  const [ride, setRide] = useState(webgl && !reduced && location.hash !== '#cv')
  const view = useGame((s) => s.view)

  useEffect(() => {
    if (ride && !entries) {
      loadIslands().then((list) => {
        setEntries(list)
        // Test hook: ?start=4 opens straight onto island 4 with every island unlocked.
        const start = +new URLSearchParams(location.search).get('start')
        if (start) {
          useGame.setState({ mode: 'map' })
          useGame.getState().jumpTo(start - 1)
        }
      })
    }
  }, [ride, entries])

  if (!ride) {
    return (
      <Timeline
        note={!webgl ? 'This device cannot show the 3D ride, so here is the same story as a timeline.' : reduced ? 'You have reduced motion switched on, so here is the same story as a timeline.' : null}
        onPlay={webgl ? () => setRide(true) : null}
        playLabel={reduced ? 'Play the animated ride anyway' : 'Play the ride'}
      />
    )
  }

  return (
    <div className="stage">
      {entries && (
        <Canvas
          flat
          shadows={{ type: THREE.PCFSoftShadowMap }}
          dpr={[1, 2]}
          camera={{ fov: 46, near: 0.5, far: 900, position: [60, 40, 60] }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
        >
          <World entries={entries} />
        </Canvas>
      )}
      {entries && <Hud islands={entries.map((e) => e.island)} />}
      {view === 'timeline' && (
        <div className="timeline-over">
          <Timeline onPlay={() => useGame.setState({ view: 'ride' })} playLabel="Back to the ride" />
        </div>
      )}
    </div>
  )
}
