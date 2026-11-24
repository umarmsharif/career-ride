// The passenger ride between two islands: a climbing straight, one full
// spiral, then a banked sweep down to the next island's landing strip.
import * as THREE from 'three'

// `start` is the exit gate of this island. `end` is the next island's spawn point and
// `tip` the western tip of its land, both measured from this island's centre.
export function buildRide({ start, end, tip, style = 'spiral', side = 1 }) {
  const pts = []
  const add = (x, y, z) => pts.push(new THREE.Vector3(x, y, start.z + (z - start.z) * side + 0))
  const mix = (a, b, k) => a + (b - a) * k

  const sy = start.y ?? 0
  add(start.x, sy + 0.06, start.z)
  add(start.x + 6, sy + 0.06, start.z)
  // Where the last straight begins, lined up with the next island's gate.
  const ax = tip.x - 24
  let fromX = start.x + 14
  let fromY = sy + 1.2
  if (style === 'spiral') {
    add(start.x + 14, sy + 1.2, start.z)
    add(start.x + 21, sy + 3.4, start.z)
    const R = 14
    const cx = start.x + 27
    const cz = start.z - R
    for (let i = 0; i <= 14; i++) {
      const th = Math.PI / 2 + (i / 14) * Math.PI * 2
      add(cx - R * Math.cos(th), sy + 5 + (i / 14) * 12, cz + R * Math.sin(th))
    }
    fromX = cx + 18
    fromY = sy + 17
    add(fromX, fromY, start.z + 3)
  } else if (style === 'hills') {
    // One long rise and one dip, almost straight in plan: easy on the eye.
    const zEnd = (end.z - start.z) * side + start.z
    const fx = start.x + 12
    const tx = tip.x - 24
    for (let k = 1; k <= 7; k++) {
      const u = k / 8
      const e = u * u * (3 - 2 * u)
      pts.push(new THREE.Vector3(mix(fx, tx, u), mix(sy + 0.8, end.y + 1.6, e) + Math.sin(u * Math.PI * 2) * 4.2 * Math.sin(u * Math.PI), mix(start.z, zEnd, e)))
    }
  } else if (style === 'dive') {
    add(start.x + 16, sy + 3, start.z)
    add(start.x + 30, sy + 12, start.z - 6)
    add(start.x + 44, sy + 20, start.z - 2)
    fromX = start.x + 56
    fromY = sy + 18
    add(fromX, fromY, start.z + 6)
  } else {
    add(fromX, fromY, start.z)
  }
  // Rolling sweeps the rest of the way.
  const sideEnd = (end.z - start.z) * side + start.z
  const n = style === 'hills' ? 0 : style === 'wave' ? 5 : 3
  for (let k = 1; k <= n; k++) {
    const u = k / (n + 1)
    const sway = Math.sin(u * Math.PI * (style === 'wave' ? 2.4 : 1.5)) * (style === 'wave' ? 16 : 9) * (1 - u * 0.5)
    const hill = Math.sin(u * Math.PI * (style === 'wave' ? 3 : 1)) * (style === 'wave' ? 5 : 2)
    add(mix(fromX, ax, u), mix(fromY, end.y + 2.2, u) + hill, mix(start.z, sideEnd, u) + sway)
  }
  add(ax, end.y + 1.6, sideEnd)
  add(tip.x - 10, end.y + 0.4, sideEnd)
  add(tip.x - 1, end.y + 0.06, sideEnd)
  add(mix(tip.x, end.x, 0.5), end.y + 0.06, sideEnd)
  add(end.x, end.y + 0.06, sideEnd)

  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal')
  const length = curve.getLength()
  const N = 520
  const frames = []
  const up = new THREE.Vector3(0, 1, 0)
  let prevT = null
  const raw = []
  for (let i = 0; i <= N; i++) {
    const u = i / N
    const p = curve.getPointAt(u)
    const t = curve.getTangentAt(u).normalize()
    let k = 0
    if (prevT) k = (prevT.z * t.x - prevT.x * t.z) / (length / N)
    raw.push(k)
    prevT = t
    frames.push({ p, t })
  }
  // Smooth the curvature so banking eases in and out.
  const W = 14
  for (let i = 0; i <= N; i++) {
    let s = 0
    let c = 0
    for (let j = -W; j <= W; j++) {
      const q = Math.min(N, Math.max(0, i + j))
      s += raw[q]
      c++
    }
    const flat = Math.min(1, i / 40, (N - i) / 70)
    const bank = style === 'hills' ? 0 : THREE.MathUtils.clamp((s / c) * 7.5, -0.6, 0.6) * Math.max(0, flat)
    const f = frames[i]
    const left = new THREE.Vector3().crossVectors(up, f.t).normalize()
    const normal = new THREE.Vector3().crossVectors(f.t, left).normalize()
    f.bank = bank
    f.left = left.clone().multiplyScalar(Math.cos(bank)).addScaledVector(normal, -Math.sin(bank)).normalize()
    f.normal = new THREE.Vector3().crossVectors(f.t, f.left).normalize()
  }

  const m = new THREE.Matrix4()
  function sample(u, out) {
    const x = THREE.MathUtils.clamp(u, 0, 1) * N
    const i = Math.min(N - 1, Math.floor(x))
    const a = frames[i]
    const b = frames[i + 1]
    const k = x - i
    out.pos.lerpVectors(a.p, b.p, k)
    out.tangent.lerpVectors(a.t, b.t, k).normalize()
    out.left.lerpVectors(a.left, b.left, k).normalize()
    out.normal.crossVectors(out.tangent, out.left).normalize()
    out.bank = a.bank + (b.bank - a.bank) * k
    m.makeBasis(out.left, out.normal, out.tangent)
    out.quat.setFromRotationMatrix(m)
    return out
  }

  return { curve, length, frames, sample }
}

// The road itself: a toy track with striped kerbs and a thin slab underneath.
export function rideRibbon(ride, { width = 4.8, from = 2, until = null } = {}) {
  const road = new THREE.Color('#f3dcab')
  const kerbA = new THREE.Color('#f0553f')
  const kerbB = new THREE.Color('#fff6e4')
  const under = new THREE.Color('#c98a5e')
  const verts = []
  const cols = []
  const quad = (a, b, c, d, col) => {
    for (const v of [a, b, c, c, b, d]) {
      verts.push(v.x, v.y, v.z)
      cols.push(col.r, col.g, col.b)
    }
  }
  const row = (f) => {
    const w = width / 2
    const o = (s, drop = 0) => f.p.clone().addScaledVector(f.left, s).addScaledVector(f.normal, -drop)
    return { l0: o(w), l1: o(w - 0.55), r1: o(-w + 0.55), r0: o(-w), bl: o(w, 0.5), br: o(-w, 0.5) }
  }
  let prev = null
  for (let i = from; i < ride.frames.length; i++) {
    if (until && i > ride.frames.length / 2 && until(ride.frames[i].p)) break
    const cur = row(ride.frames[i])
    if (prev) {
      const kerb = Math.floor(i / 3) % 2 ? kerbA : kerbB
      quad(prev.l0, cur.l0, prev.l1, cur.l1, kerb)
      quad(prev.l1, cur.l1, prev.r1, cur.r1, road)
      quad(prev.r1, cur.r1, prev.r0, cur.r0, kerb)
      quad(prev.bl, cur.bl, prev.l0, cur.l0, under)
      quad(prev.r0, cur.r0, prev.br, cur.br, under)
      quad(prev.br, cur.br, prev.bl, cur.bl, under)
    }
    prev = cur
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
  g.computeVertexNormals()
  return g
}
