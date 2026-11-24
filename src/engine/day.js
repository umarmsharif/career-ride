// Time of day. The ride starts at dawn on the first island and ends at sunset on the last,
// so the light itself shows how far through the career the rider is.
import * as THREE from 'three'

export const day = { t: 0, target: 0 }

const KEYS = [
  { t: 0.0, top: '#5f86d0', mid: '#f6c7ae', low: '#ffd7a6', sun: '#ffc995', sI: 1.3, hI: 1.3, hs: '#ffe9e0', hg: '#e9c9a8', fog: '#f1d3c6', cloud: '#f3b9a0' },
  { t: 0.14, top: '#4fb3ea', mid: '#d6f1fb', low: '#fff0d6', sun: '#fff0d2', sI: 1.75, hI: 1.5, hs: '#eef8ff', hg: '#f6d7b4', fog: '#d9eef6', cloud: '#bcd9ea' },
  { t: 0.5, top: '#3c9fe6', mid: '#cfeefc', low: '#fff3dc', sun: '#fffaf0', sI: 1.9, hI: 1.5, hs: '#eef8ff', hg: '#f6d7b4', fog: '#d9eef6', cloud: '#bcd9ea' },
  { t: 0.74, top: '#4a96d8', mid: '#fbe6c2', low: '#ffdba6', sun: '#ffdfa8', sI: 1.75, hI: 1.4, hs: '#fff3e0', hg: '#f3cfa4', fog: '#f0e2cc', cloud: '#f0cfa8' },
  { t: 0.92, top: '#5670bd', mid: '#ffa671', low: '#ffcf8c', sun: '#ff9c5c', sI: 1.5, hI: 1.25, hs: '#ffd9c4', hg: '#d9a98c', fog: '#f3b795', cloud: '#ff9d7a' },
  { t: 1.0, top: '#34428a', mid: '#f0806a', low: '#f7b47c', sun: '#ff7d4f', sI: 1.15, hI: 1.1, hs: '#e9c0c8', hg: '#b98a80', fog: '#d98e80', cloud: '#e0707a' },
  { t: 1.1, top: '#161d48', mid: '#6a4f93', low: '#d9805f', sun: '#c0603f', sI: 0.35, hI: 1.0, hs: '#b9b0e0', hg: '#806a80', fog: '#6a5590', cloud: '#7a5a96' },
].map((k) => {
  const o = { t: k.t, sI: k.sI, hI: k.hI }
  for (const n of ['top', 'mid', 'low', 'sun', 'hs', 'hg', 'fog', 'cloud']) o[n] = new THREE.Color(k[n])
  return o
})

export const look = {
  top: new THREE.Color(), mid: new THREE.Color(), low: new THREE.Color(), sun: new THREE.Color(), hs: new THREE.Color(), hg: new THREE.Color(),
  fog: new THREE.Color(), cloud: new THREE.Color(), sI: 1, hI: 1, dir: new THREE.Vector3(0, 1, 0), night: 0,
}

// Fills `look` for the current time. Call once a frame.
export function updateDay() {
  const t = Math.min(1.1, Math.max(0, day.t))
  let i = 1
  while (i < KEYS.length - 1 && KEYS[i].t < t) i++
  const a = KEYS[i - 1]
  const b = KEYS[i]
  const k = (t - a.t) / (b.t - a.t)
  for (const n of ['top', 'mid', 'low', 'sun', 'hs', 'hg', 'fog', 'cloud']) look[n].copy(a[n]).lerp(b[n], k)
  look.sI = a.sI + (b.sI - a.sI) * k
  look.hI = a.hI + (b.hI - a.hI) * k
  // The sun rises behind the rider and sets ahead, over the last island.
  const u = Math.min(1, t)
  const el = (t <= 1 ? 7 + 55 * Math.pow(Math.sin(Math.PI * u), 0.8) : 7 - (t - 1) * 120) * (Math.PI / 180)
  const az = Math.PI * u
  look.dir.set(-Math.cos(az) * Math.cos(el), Math.sin(el), (0.35 + 0.5 * Math.sin(az)) * Math.cos(el)).normalize()
  const n = (t - 0.98) / 0.12
  look.night = Math.min(1, Math.max(0, n))
  return look
}
