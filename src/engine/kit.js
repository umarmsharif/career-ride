// The toy kit: every static prop on an island is pushed into one merged,
// vertex-coloured geometry, so a whole island of scenery costs one draw call.
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const _pos = new THREE.Vector3()
const _quat = new THREE.Quaternion()
const _scl = new THREE.Vector3()
const _eul = new THREE.Euler()
const _col = new THREE.Color()

export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function matrixOf({ p = [0, 0, 0], r = [0, 0, 0], s = 1 } = {}) {
  _pos.set(p[0], p[1], p[2])
  _eul.set(r[0], r[1], r[2], 'YXZ')
  _quat.setFromEuler(_eul)
  if (typeof s === 'number') _scl.set(s, s, s)
  else _scl.set(s[0], s[1], s[2])
  return new THREE.Matrix4().compose(_pos, _quat, _scl)
}

export class Kit {
  constructor() {
    this.parts = []
    this.stack = [new THREE.Matrix4()]
  }

  // Run fn with every part placed relative to this transform.
  at(transform, fn) {
    const m = this.stack[this.stack.length - 1].clone().multiply(matrixOf(transform))
    this.stack.push(m)
    fn()
    this.stack.pop()
    return this
  }

  add(geometry, color, transform) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry.clone()
    if (g.attributes.uv) g.deleteAttribute('uv')
    if (!g.attributes.normal) g.computeVertexNormals()
    const m = this.stack[this.stack.length - 1].clone().multiply(matrixOf(transform))
    g.applyMatrix4(m)
    const n = g.attributes.position.count
    const colors = new Float32Array(n * 3)
    _col.set(color)
    for (let i = 0; i < n; i++) {
      colors[i * 3] = _col.r
      colors[i * 3 + 1] = _col.g
      colors[i * 3 + 2] = _col.b
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    this.parts.push(g)
    geometry.dispose()
    return this
  }

  box(w, h, d, color, t) {
    return this.add(new THREE.BoxGeometry(w, h, d), color, t)
  }
  cyl(rTop, rBottom, h, color, t, seg = 8) {
    return this.add(new THREE.CylinderGeometry(rTop, rBottom, h, seg), color, t)
  }
  cone(r, h, color, t, seg = 6) {
    return this.add(new THREE.ConeGeometry(r, h, seg), color, t)
  }
  ball(r, color, t, detail = 1) {
    return this.add(new THREE.IcosahedronGeometry(r, detail), color, t)
  }
  disc(r, color, t, seg = 14) {
    // Flat disc lying on the ground.
    const g = new THREE.CircleGeometry(r, seg)
    g.rotateX(-Math.PI / 2)
    return this.add(g, color, t)
  }
  // A roof with a ridge along local X.
  roof(w, h, d, color, t) {
    const shape = new THREE.Shape()
    shape.moveTo(-d / 2, 0)
    shape.lineTo(d / 2, 0)
    shape.lineTo(0, h)
    shape.closePath()
    const g = new THREE.ExtrudeGeometry(shape, { depth: w, bevelEnabled: false })
    g.translate(0, 0, -w / 2)
    g.rotateY(Math.PI / 2)
    return this.add(g, color, t)
  }

  build() {
    const merged = mergeGeometries(this.parts, false)
    this.parts.forEach((g) => g.dispose())
    this.parts = []
    merged.computeBoundingSphere()
    return merged
  }
}

// Ribbon lying on a path of [x, z] points at height y. Returns a geometry.
export function ribbonXZ(points, width, y = 0.04) {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, z]) => new THREE.Vector3(x, y, z)),
    false,
    'centripetal'
  )
  const n = points.length * 10
  const verts = []
  let prevL, prevR
  for (let i = 0; i <= n; i++) {
    const u = i / n
    const p = curve.getPointAt(u)
    const t = curve.getTangentAt(u)
    const side = new THREE.Vector3(t.z, 0, -t.x).normalize().multiplyScalar(width / 2)
    const L = p.clone().add(side)
    const R = p.clone().sub(side)
    if (prevL) {
      verts.push(prevL.x, y, prevL.z, prevR.x, y, prevR.z, L.x, y, L.z)
      verts.push(prevR.x, y, prevR.z, R.x, y, R.z, L.x, y, L.z)
    }
    prevL = L
    prevR = R
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  g.computeVertexNormals()
  return g
}

// The floating landmass under an outline: a grassy lip, dirt, then tapering rock.
export function islandBody(outline, colors, seed = 7) {
  const rand = rng(seed)
  let cx = 0
  let cz = 0
  outline.forEach(([x, z]) => {
    cx += x
    cz += z
  })
  cx /= outline.length
  cz /= outline.length
  const rings = [
    { s: 1.0, y: 0, c: colors.lip },
    { s: 1.025, y: -1.1, c: colors.lip },
    { s: 0.95, y: -3.6, c: colors.dirt },
    { s: 0.76, y: -9, c: colors.rock },
    { s: 0.5, y: -15.5, c: colors.rock2 },
    { s: 0.2, y: -22, c: colors.rock2 },
  ]
  const n = outline.length
  const ringPts = rings.map((ring, ri) =>
    outline.map(([x, z]) => {
      const j = ri < 2 ? 0 : (rand() - 0.5) * 0.12
      const s = ring.s + j
      return [cx + (x - cx) * s, ring.y + (ri < 2 ? 0 : (rand() - 0.5) * 1.6), cz + (z - cz) * s]
    })
  )
  const verts = []
  const cols = []
  const push = (p, c) => {
    verts.push(p[0], p[1], p[2])
    cols.push(c.r, c.g, c.b)
  }
  for (let ri = 0; ri < rings.length - 1; ri++) {
    const c = new THREE.Color(rings[ri + 1].c)
    for (let i = 0; i < n; i++) {
      const a = ringPts[ri][i]
      const b = ringPts[ri][(i + 1) % n]
      const c1 = ringPts[ri + 1][i]
      const d = ringPts[ri + 1][(i + 1) % n]
      push(a, c); push(b, c); push(c1, c)
      push(b, c); push(d, c); push(c1, c)
    }
  }
  const last = ringPts[rings.length - 1]
  const tip = [cx, -27, cz]
  const tc = new THREE.Color(colors.rock2)
  for (let i = 0; i < n; i++) {
    push(last[i], tc); push(last[(i + 1) % n], tc); push(tip, tc)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
  g.computeVertexNormals()
  return g
}

export function islandTop(outline) {
  const shape = new THREE.Shape()
  outline.forEach(([x, z], i) => (i === 0 ? shape.moveTo(x, -z) : shape.lineTo(x, -z)))
  shape.closePath()
  const g = new THREE.ShapeGeometry(shape)
  g.rotateX(-Math.PI / 2)
  return g
}

export function insideOutline(outline, x, z) {
  let inside = false
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const xi = outline[i][0]
    const zi = outline[i][1]
    const xj = outline[j][0]
    const zj = outline[j][1]
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside
  }
  return inside
}

// Text drawn onto a canvas, for gate plaques and district banners.
export function textTexture(text, { w = 512, h = 160, bg = '#fff6e4', fg = '#22304f', size = 92, font = 'Fredoka' } = {}) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  const draw = () => {
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = fg
    ctx.font = `600 ${size}px ${font}, "Trebuchet MS", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, w / 2, h / 2 + size * 0.04)
    tex.needsUpdate = true
  }
  draw()
  if (document.fonts?.load) document.fonts.load(`600 ${size}px ${font}`).then(draw).catch(() => {})
  return tex
}
