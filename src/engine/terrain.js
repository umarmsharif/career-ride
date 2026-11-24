// Ground height. An island describes its terrain as a function (x, z) => y built from the
// helpers here. The engine samples it on a grid; `ground.h` reads that grid exactly as the
// land mesh draws it, so anything placed with `h` sits on the surface.
import * as THREE from 'three'

const sm = (t) => {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}

// Heights along the road axis: profile([[-45, 0], [-20, 0], [-8, 5], [45, 5]]) is flat, climbs
// between x = -20 and x = -8, then stays at 5. Slopes ease in and out.
export function profile(points) {
  return (x) => {
    if (x <= points[0][0]) return points[0][1]
    for (let i = 1; i < points.length; i++) {
      const [x1, y1] = points[i]
      if (x <= x1) {
        const [x0, y0] = points[i - 1]
        return y0 + (y1 - y0) * sm((x - x0) / (x1 - x0))
      }
    }
    return points[points.length - 1][1]
  }
}

// A round rise (or, with a negative height, a hollow) with a flat top of radius `flat`.
export function mound(cx, cz, r, height, flat = 0) {
  return (x, z) => height * sm(1 - (Math.hypot(x - cx, z - cz) - flat) / (r - flat))
}

// A band across the island that only applies between two z values, easing over `soft`.
export function band(z0, z1, soft = 4) {
  return (x, z) => sm((z - z0) / soft + 1) * sm((z1 - z) / soft + 1)
}

export const CELL = 2

export function makeGround(fn, len, wid = 24) {
  const x0 = -Math.ceil((len + 4) / CELL) * CELL
  const z0 = -Math.ceil((wid + 4) / CELL) * CELL
  const nx = Math.round((-x0 * 2) / CELL)
  const nz = Math.round((-z0 * 2) / CELL)
  const ys = new Float32Array((nx + 1) * (nz + 1))
  let isFlat = true
  for (let j = 0; j <= nz; j++) {
    for (let i = 0; i <= nx; i++) {
      const y = fn ? fn(x0 + i * CELL, z0 + j * CELL) : 0
      ys[j * (nx + 1) + i] = y
      if (Math.abs(y) > 1e-4) isFlat = false
    }
  }
  const at = (i, j) => ys[j * (nx + 1) + i]
  function h(x, z) {
    if (isFlat) return 0
    const gx = Math.min(nx - 1e-6, Math.max(0, (x - x0) / CELL))
    const gz = Math.min(nz - 1e-6, Math.max(0, (z - z0) / CELL))
    const i = Math.floor(gx)
    const j = Math.floor(gz)
    const fx = gx - i
    const fz = gz - j
    const b = at(i + 1, j)
    const c = at(i, j + 1)
    if (fx + fz <= 1) {
      const a = at(i, j)
      return a + (b - a) * fx + (c - a) * fz
    }
    const d = at(i + 1, j + 1)
    return d + (c - d) * (1 - fx) + (b - d) * (1 - fz)
  }
  return { h, x0, z0, nx, nz, at, isFlat }
}

// The land surface: the grid, coloured by slope, cut to the outline by an alpha map.
export function groundGeometry(ground, grass) {
  const { x0, z0, nx, nz, at } = ground
  const W = nx * CELL
  const D = nz * CELL
  const pos = []
  const col = []
  const uv = []
  const base = new THREE.Color(grass)
  const steep = base.clone().multiply(new THREE.Color('#c9b98f'))
  const c = new THREE.Color()
  const tri = (p, q, r, tone) => {
    const slope = Math.max(Math.abs(p[1] - q[1]), Math.abs(q[1] - r[1]), Math.abs(p[1] - r[1])) / CELL
    c.copy(base).lerp(steep, Math.min(1, slope * 1.5))
    c.multiplyScalar(tone)
    for (const v of [p, q, r]) {
      pos.push(v[0], v[1], v[2])
      col.push(c.r, c.g, c.b)
      uv.push((v[0] - x0) / W, (v[2] - z0) / D)
    }
  }
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const v = (di, dj) => [x0 + (i + di) * CELL, at(i + di, j + dj), z0 + (j + dj) * CELL]
      const a = v(0, 0)
      const b = v(1, 0)
      const cc = v(0, 1)
      const d = v(1, 1)
      const tone = 1 - ((i * 7 + j * 13) % 5) * 0.012
      tri(a, cc, b, tone)
      tri(b, cc, d, tone * 0.985)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.computeVertexNormals()
  return g
}

export function outlineMask(ground, outline) {
  const W = ground.nx * CELL
  const D = ground.nz * CELL
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = Math.round((1024 * D) / W)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  outline.forEach(([x, z], i) => {
    const px = ((x - ground.x0) / W) * canvas.width
    const py = ((z - ground.z0) / D) * canvas.height
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  })
  ctx.closePath()
  ctx.fill()
  const tex = new THREE.CanvasTexture(canvas)
  tex.flipY = false
  return tex
}

// --- putting scenery on the ground -------------------------------------------

function displaceKit(geo, h) {
  const p = geo.attributes.position
  const a = geo.attributes.anchor
  for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + h(a.getX(i), a.getY(i)))
  p.needsUpdate = true
  geo.computeVertexNormals()
  geo.computeBoundingSphere()
  geo.computeBoundingBox()
}

function drape(geo, h) {
  const p = geo.attributes.position
  for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + h(p.getX(i), p.getZ(i)))
  p.needsUpdate = true
  geo.computeVertexNormals()
  geo.computeBoundingSphere()
}

const isIdentity = (o) =>
  o.position.lengthSq() < 1e-10 && Math.abs(o.quaternion.w) > 0.999999 && Math.abs(o.scale.x - 1) + Math.abs(o.scale.y - 1) + Math.abs(o.scale.z - 1) < 1e-6

function lift(o, root, h) {
  o.userData.lifted = true
  o.updateMatrixWorld = function () {
    if (this.matrixAutoUpdate) this.updateMatrix()
    this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix)
    const e = this.matrixWorld.elements
    const r = root.matrixWorld.elements
    e[13] += h(e[12] - r[12], e[14] - r[14])
    this.matrixWorldNeedsUpdate = false
    const kids = this.children
    for (let i = 0; i < kids.length; i++) kids[i].updateMatrixWorld(true)
  }
}

// Called every frame on an island's scenery. Static kit meshes are reshaped once so each prop
// stands on the ground under it. Every other object is raised by the ground height at its own
// position, each frame, so moving things follow the terrain without knowing about it.
export function groundScenery(node, root, h) {
  const kids = node.children
  for (let i = 0; i < kids.length; i++) {
    const c = kids[i]
    const u = c.userData
    if (u.noLift || u.lifted) continue
    if (u.container) {
      groundScenery(c, root, h)
      continue
    }
    const ident = isIdentity(c)
    const geo = c.geometry
    if (ident && c.isMesh && !c.isInstancedMesh && geo && (geo.attributes.anchor || geo.userData.drape)) {
      if (!geo.userData.grounded) {
        geo.userData.grounded = true
        if (geo.attributes.anchor) displaceKit(geo, h)
        else drape(geo, h)
      }
      continue
    }
    if (c.isInstancedMesh && ident) continue
    if (ident && c.type === 'Group') {
      u.container = true
      groundScenery(c, root, h)
      continue
    }
    lift(c, root, h)
  }
}
