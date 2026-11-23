// The passenger ride between two islands: a climbing straight, one full
// spiral, then a banked sweep down to the next island's landing strip.
import * as THREE from 'three'

export function buildRide({ start, stub }) {
  const pts = []
  const add = (x, y, z) => pts.push(new THREE.Vector3(x, y, z))

  // Leave the gate and climb.
  add(start.x, 0.06, start.z)
  add(start.x + 6, 0.06, start.z)
  add(start.x + 14, 1.2, start.z)
  add(start.x + 21, 3.4, start.z)

  // One full left-hand spiral, climbing 12 units.
  const R = 14
  const cx = start.x + 27
  const cz = start.z - R
  const turns = 1
  const steps = 14
  for (let i = 0; i <= steps; i++) {
    const th = Math.PI / 2 + (i / steps) * Math.PI * 2 * turns
    add(cx - R * Math.cos(th), 5 + (i / steps) * 12, cz + R * Math.sin(th))
  }

  // Banked sweep down to the landing strip.
  const d = stub.dir
  const land = new THREE.Vector3(stub.x - d.x * 13.5, stub.y + 0.06, stub.z - d.z * 13.5)
  const end = new THREE.Vector3(stub.x + d.x * 5, stub.y + 0.06, stub.z + d.z * 5)
  add(cx + 20, 16.6, cz + R + 3)
  add(cx + 40, 15.4, cz + R + 1)
  add(land.x - d.x * 22 + 4, stub.y + 2.6, land.z - d.z * 22 + 8)
  add(land.x - d.x * 9, stub.y + 0.7, land.z - d.z * 9)
  pts.push(land)
  pts.push(new THREE.Vector3().lerpVectors(land, end, 0.5))
  pts.push(end)

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
    const flat = Math.min(1, i / 40, (N - i) / 60)
    const bank = THREE.MathUtils.clamp((s / c) * 7.5, -0.6, 0.6) * Math.max(0, flat)
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
