// The headline results: the stops in career.json marked with a `headline` figure, in career order.
import career from '../content/career.json'

export const HEADLINES = career.islands.flatMap((isl) => {
  const picks = isl.districts ? isl.districts.flatMap((d) => d.pickups) : isl.pickups || []
  return picks.filter((p) => p.headline).map((p) => ({ id: isl.id, text: p.headline, label: p.headlineLabel || '', company: isl.brand.label, color: isl.brand.primary }))
})

// When the opening title went up, in seconds of real time; the skyline lights to the same beat.
export const opening = { at: -1 }
// Each figure comes on this many seconds after the title, one after another.
export const cue = (i) => 0.9 + i * 0.75
