// The nine islands in career order. Each folder exports { island, Scenery }.
// An island whose folder is missing or broken falls back to a plain placeholder,
// so one unfinished island never stops the ride.
import { defineIsland } from '../engine/defineIsland.js'
import career from '../content/career.json'
import DefaultScenery from '../engine/DefaultScenery.jsx'

const FOLDERS = { 1: 'workshop', 2: 'campusHill', 3: 'signalValley', 4: 'telecomCity', 5: 'parcelPort', 6: 'kitchenStreet', 7: 'airfield', 8: 'aiLab', 9: 'classroom' }
const loaders = import.meta.glob('./*/index.js')
const RIDES = ['wave', 'spiral', 'dive', 'wave', 'spiral', 'spiral', 'dive', 'wave']

function placeholder(id) {
  const data = career.islands.find((i) => i.id === id)
  const count = data.districts
    ? data.districts.reduce((n, d) => n + d.pickups.length, 0)
    : (data.pickups || data.machines || [...(data.boards || []), ...(data.cards || [])]).length
  const stops = Array.from({ length: count }, (_, i) => [-26 + (52 / Math.max(1, count - 1 || 1)) * i * (count > 1 ? 1 : 0), i % 2 ? 3.5 : -3.5])
  const last = id === 9
  return {
    island: defineIsland({ id, stops, last, finish: last ? { x: 34, z: 0, radius: 3 } : undefined, ride: { dy: id % 2 ? 9 : -8, dz: id % 2 ? -40 : 38, style: RIDES[id - 1] } }),
    Scenery: DefaultScenery,
  }
}

export async function loadIslands() {
  const only = new URLSearchParams(location.search).get('only')
  const out = []
  for (let id = 1; id <= 9; id++) {
    const path = `./${FOLDERS[id]}/index.js`
    let entry = null
    if (loaders[path] && (!only || +only === id)) {
      try {
        const mod = await loaders[path]()
        entry = { island: mod.island, Scenery: mod.Scenery }
      } catch (err) {
        console.warn(`Island ${id} failed to load, using a placeholder`, err)
      }
    }
    out.push(entry ?? placeholder(id))
  }
  return out
}
