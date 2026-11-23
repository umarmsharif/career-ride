// Plain scenery for an island that has not been dressed yet: a road and some greenery.
import { Static } from './IslandParts.jsx'
import { baseRoad, scatter } from './props.js'
import { rng } from './kit.js'

export default function DefaultScenery({ island }) {
  return (
    <Static
      deps={[island]}
      build={(k) => {
        baseRoad(k, island)
        scatter(k, island, rng(island.id * 101), { trees: 26, cover: 70 })
      }}
    />
  )
}
