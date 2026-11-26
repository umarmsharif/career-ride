// Turns a short island spec into everything the engine needs.
// Facts always come from career.json; a spec only says where things are.
import career from '../content/career.json'
import { makeGround } from './terrain.js'
import { CITY } from './world.js'
import { planCity } from './city.js'

function makeOutline({ len, wid, neck, seed }) {
  const pts = []
  const n = 76
  for (let i = 0; i < n; i++) {
    const th = (i / n) * Math.PI * 2
    const wob = 1 + 0.035 * Math.sin(3 * th + 1.3 + seed) + 0.025 * Math.sin(7 * th + 0.4 + seed * 2)
    const x = len * Math.cos(th)
    const half = wid - neck * Math.exp(-((x / 10) ** 2))
    pts.push([x * (0.985 + 0.015 * wob), half * Math.sin(th) * wob])
  }
  return pts
}

function stopsFrom(data) {
  if (data.districts) return data.districts.flatMap((d, di) => d.pickups.map((p) => ({ kind: 'fact', fact: p.fact, district: di })))
  if (data.pickups) return data.pickups.map((p) => ({ kind: 'fact', fact: p.fact, district: 0 }))
  if (data.machines) return data.machines.map((m) => ({ kind: 'machine', ...m, district: 0 }))
  return [
    ...(data.boards || []).map((b) => ({ kind: 'board', ...b, district: 0 })),
    ...(data.cards || []).map((c) => ({ kind: 'card', ...c, district: 0 })),
  ]
}

export function defineIsland(spec) {
  const data = career.islands.find((i) => i.id === spec.id)
  const years = (data.years.match(/\d{4}/g) || []).map(Number)
  const len = spec.len ?? 47
  const wid = spec.wid ?? 21.5
  const outline = spec.outline ?? makeOutline({ len, wid, neck: spec.neck ?? 0, seed: spec.id })
  const content = stopsFrom(data)
  if (spec.stops.length !== content.length) {
    throw new Error(`Island ${spec.id}: ${spec.stops.length} stop positions for ${content.length} items in career.json`)
  }
  const stops = spec.stops.map(([x, z], i) => ({ x, z, ...content[i], diagram: spec.diagrams?.[i] }))
  const entranceGate = { x: -(len - 5), z: 0 }
  const exitGate = spec.last ? null : { x: len - 4, z: 0, halfWidth: 3.6 }
  const spawn = { x: entranceGate.x + 3.4, z: 0, heading: Math.PI / 2 }
  const road = spec.road ?? [[-len, 0], [-len * 0.5, 0], [0, 0], [len * 0.5, 0], [len, 0]]
  const sign = { radius: 7.5, ...(spec.sign ?? { x: entranceGate.x + 3.5, z: 6.2, face: -2.2 }) }
  const gatePillars = [entranceGate, exitGate].filter(Boolean).flatMap((g) => [{ x: g.x, z: 4.4, r: 0.7 }, { x: g.x, z: -4.4, r: 0.7 }])
  // In the city the station's own scenery gives way to a planned block of buildings and a tower.
  const cityStops = spec.stops.map(([x, z]) => [x, z])
  const city = CITY
    ? planCity({
        id: spec.id, len, outline, road, stops: cityStops, terrain: spec.terrain,
        tour: spec.tour ?? cityStops,
        last: !!spec.last,
        keep: [
          { x: sign.x, z: sign.z, r: 6.5 },
          ...(spec.banners ?? []).map((b) => ({ x: b.x, z: b.z, r: 4 })),
          ...[entranceGate, exitGate].filter(Boolean).map((g) => ({ x: g.x, z: g.z, r: 8 })),
          ...(spec.finish ? [{ x: spec.finish.x, z: spec.finish.z, r: 9 }] : []),
        ],
      })
    : null
  const colliders = [...(city ? city.colliders : spec.colliders ?? []), { x: sign.x, z: sign.z, r: 1.5, h: 5 }, ...gatePillars]
  const blockers = [entranceGate, exitGate].filter(Boolean).flatMap((g) => [-3.2, 0, 3.2].map((z) => ({ x: g.x, z, r: 2.1, h: 12 })))
  const signView = spec.signView ?? [spawn.x + 3, 0.2]
  // The company profile waits on a small stand between the road and the signboard.
  const sd = Math.hypot(sign.x - signView[0], sign.z - signView[1]) || 1
  const profileStand = spec.profileStand ?? { x: signView[0] + ((sign.x - signView[0]) / sd) * 2.7, z: signView[1] + ((sign.z - signView[1]) / sd) * 2.7 }
  const ground = makeGround(spec.terrain, len, Math.max(wid, ...outline.map(([, z]) => Math.abs(z))) + 3)
  const tour = spec.tour ?? [
    [spawn.x + 0.6, 0],
    signView,
    ...[...stops].sort((a, b) => a.x - b.x).map((s) => [s.x, s.z]),
    spec.last ? [spec.finish.x, spec.finish.z] : [exitGate.x + 2.5, 0],
  ]
  const districts = data.districts ? data.districts.map((d) => d.name) : [data.name]
  return {
    id: spec.id,
    data,
    name: data.name,
    startYear: years[0],
    endYear: years[years.length - 1],
    len,
    outline,
    road,
    spawn,
    entranceGate,
    exitGate,
    finish: spec.finish ?? null,
    sign,
    profileStand,
    ground,
    h: ground.h,
    // In the city the company name stands on top of the company's tower.
    brandSign: city?.tower ? { x: city.tower.x, z: city.tower.z, y: city.tower.h + (data.brand.logo ? 3.6 : 2.4), face: -Math.PI / 2, scale: 1.7 } : spec.brandSign ?? null,
    stops,
    colliders,
    blockers,
    tour,
    signStop: spec.signStop ?? 1,
    districts,
    districtAt: spec.districtAt ?? ((x) => (districts.length > 1 && x >= 0 ? 1 : 0)),
    banners: spec.banners ?? [],
    grass: city ? '#232a4c' : spec.grass ?? '#a5d86e',
    land: city ? { lip: '#2f3763', dirt: '#1c2242', rock: '#161a34', rock2: '#10132a' } : spec.land ?? { lip: '#86c765', dirt: '#c98a5e', rock: '#a86b47', rock2: '#7d5241' },
    // How the road to the NEXT island behaves: where that island sits and the shape of the ride.
    ride: spec.ride ?? { dy: 10, dz: -40, style: 'spiral' },
    extra: { ...(spec.extra ?? {}), city },
  }
}
