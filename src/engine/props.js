// Shared building blocks for island scenery. Everything draws into a Kit (one merged mesh).
import * as THREE from 'three'
import { ribbonXZ, insideOutline } from './kit.js'

export const CREAM = '#fff6e4'
export const WOOD = '#8b5e3c'
export const SLATE = '#2f3a4f'
export const NAVY = '#22304f'
export const CORAL = '#f0553f'
export const TEAL = '#1f9d8f'
export const GOLD = '#f2a541'

// A thin bar between two points.
export function beam(k, a, b, thick, color) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const dz = b[2] - a[2]
  const len = Math.hypot(dx, dy, dz)
  k.box(thick, thick, len, color, {
    p: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2],
    r: [-Math.atan2(dy, Math.hypot(dx, dz)), Math.atan2(dx, dz), 0],
  })
}

// A striped awning slab that starts at local z = 0 and reaches out to z = d.
export function stripes(k, w, d, color, t, n = 5) {
  k.at(t, () => {
    for (let i = 0; i < n; i++) k.box(w / n + 0.005, 0.1, d, i % 2 ? CREAM : color, { p: [-w / 2 + (i + 0.5) * (w / n), 0, d / 2] })
    k.box(w, 0.26, 0.1, color, { p: [0, -0.12, d] })
  })
}

// kind 0 round, 1 pine, 2 autumn. Pass foliage colours to restyle.
export function tree(k, x, z, s, kind, r, colors) {
  const c = colors ?? ['#5fae5a', '#7cc36a', '#4f9f58', '#3f9a6d', '#4fae78', '#62bd84', '#f2a541', '#f6bd60']
  k.at({ p: [x, 0, z], r: [0, r() * 6, 0], s }, () => {
    if (kind === 0) {
      k.cyl(0.22, 0.3, 1.8, WOOD, { p: [0, 0.9, 0] }, 6)
      k.ball(1.5, c[0], { p: [0, 2.9, 0], s: [1, 0.9, 1] })
      k.ball(1.05, c[1], { p: [0.8, 3.7, 0.3] })
      k.ball(0.9, c[2], { p: [-0.8, 2.4, -0.5] })
    } else if (kind === 1) {
      k.cyl(0.2, 0.26, 1.2, WOOD, { p: [0, 0.6, 0] }, 6)
      k.cone(1.5, 2.0, c[3], { p: [0, 2.0, 0] }, 7)
      k.cone(1.15, 1.7, c[4], { p: [0, 3.1, 0] }, 7)
      k.cone(0.8, 1.4, c[5], { p: [0, 4.1, 0] }, 7)
    } else {
      k.cyl(0.18, 0.24, 1.4, WOOD, { p: [0, 0.7, 0] }, 6)
      k.ball(1.2, c[6], { p: [0, 2.3, 0] })
      k.ball(0.8, c[7], { p: [0.5, 3.0, 0.2] })
    }
  })
}

export function roadCurve(island) {
  return new THREE.CatmullRomCurve3(island.road.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal')
}

// The island's road with a darker verge and centre dashes.
export function baseRoad(k, island, { color = '#f3dcab', edge = '#e2c48d', dash = CREAM, width = 5, skip = null } = {}) {
  k.add(ribbonXZ(island.road, width + 1, 0.03), edge)
  k.add(ribbonXZ(island.road, width, 0.05), color)
  if (!dash) return
  const mid = roadCurve(island)
  for (let i = 2; i < 46; i++) {
    const u = i / 48
    const p = mid.getPointAt(u)
    const t = mid.getTangentAt(u)
    if (skip && skip(p.x, p.z)) continue
    k.box(0.22, 0.02, 0.9, dash, { p: [p.x, 0.07, p.z], r: [0, Math.atan2(t.x, t.z), 0] })
  }
}

// Returns a test for "is this spot free": on the land, off the road, clear of buildings and stops.
export function clearance(island, keepOut = []) {
  const mid = roadCurve(island)
  const roadPts = []
  for (let i = 0; i <= 60; i++) {
    const p = mid.getPointAt(i / 60)
    roadPts.push([p.x, p.z])
  }
  return (x, z, pad = 0) => {
    for (const o of [[0, 0], [pad, 0], [-pad, 0], [0, pad], [0, -pad]]) {
      if (!insideOutline(island.outline, x + o[0] * 1.6 + Math.sign(o[0]) * 1.2, z + o[1] * 1.6 + Math.sign(o[1]) * 1.2)) return false
    }
    if (!insideOutline(island.outline, x * 1.06, z * 1.06)) return false
    for (const [rx, rz] of roadPts) if (Math.hypot(x - rx, z - rz) < 3.6 + pad) return false
    for (const c of island.colliders) if (Math.hypot(x - c.x, z - c.z) < c.r + 1.2 + pad) return false
    for (const p of island.stops) if (Math.hypot(x - p.x, z - p.z) < 3.5) return false
    for (const c of keepOut) if (Math.hypot(x - c.x, z - c.z) < c.r + pad) return false
    return true
  }
}

// Scatter trees and ground cover wherever there is room.
export function scatter(k, island, r, { trees = 40, cover = 100, kinds = [0, 1, 2], treeColors, keepOut = [], flowers = [CORAL, CREAM, GOLD, '#ff8fa3'], rock = '#b9c2cc', bush = ['#6dbb5e', '#86cc6f'], patch = '#93cd62' } = {}) {
  const clear = clearance(island, keepOut)
  const L = island.len
  let placed = 0
  for (let i = 0; i < 900 && placed < trees; i++) {
    const x = -L + r() * L * 2
    const z = -24 + r() * 48
    if (!clear(x, z, 3.2)) continue
    tree(k, x, z, 0.8 + r() * 0.55, kinds[Math.floor(r() * kinds.length)], r, treeColors)
    placed++
  }
  placed = 0
  for (let i = 0; i < 1500 && placed < cover; i++) {
    const x = -L + r() * L * 2
    const z = -24 + r() * 48
    if (!clear(x, z, 0)) continue
    const kind = r()
    if (kind < 0.3) k.ball(0.5 + r() * 0.45, bush[r() < 0.5 ? 0 : 1], { p: [x, 0.3, z], s: [1.2, 0.8, 1.1] })
    else if (kind < 0.45) k.ball(0.35 + r() * 0.5, rock, { p: [x, 0.12, z], s: [1.2, 0.7, 1], r: [r(), r(), r()] }, 0)
    else if (kind < 0.8) {
      k.cyl(0.03, 0.03, 0.4, '#4f9f58', { p: [x, 0.2, z] }, 4)
      k.ball(0.15, flowers[Math.floor(r() * flowers.length)], { p: [x, 0.46, z] }, 0)
    } else k.disc(1.2 + r() * 1.6, patch, { p: [x, 0.02, z] }, 7)
    placed++
  }
}
