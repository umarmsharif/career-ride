import * as THREE from 'three'
import { create } from 'zustand'

// Fast-changing values live here and are read inside the render loop.
export const rider = {
  pos: new THREE.Vector3(),
  quat: new THREE.Quaternion(),
  heading: 0,
  speed: 0,
  lean: 0,
  steer: 0,
  pedal: 0,
  wheel: 0,
  pedalling: false,
  tumble: 0,
  // The car: how far the tail is out, whether the tyres are smoking, and the ending.
  slip: 0,
  drift: false,
  door: 0,
  out: 0,
  pitch: 0,
  // The company-profile pickup: null, or what the rider on foot is doing right now.
  act: null,
}

export const clock = { t: 0 }

// collectedAt[islandId][stopIndex] = clock time the stop was found, for scenery animations.
export const collectedAt = {}
export const sinceOf = (id) => (i) => {
  const at = collectedAt[id]?.[i]
  return at === undefined ? -1 : clock.t - at
}

export const input = { up: false, down: false, left: false, right: false }

const coarse = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches

// Slow-changing values that the HTML layer shows.
let toastId = 0

export const useGame = create((set, get) => ({
  phase: 'intro', // intro | island | falling | ride | closing
  mode: 'story', // story | map
  touch: !!coarse,
  autopilot: false,
  waiting: false, // a hands-free ride is paused at a stop
  island: 0, // index into the island list
  visited: [0],
  collected: [], // keys like "6:2"
  open: null, // the stop whose card is on screen: { island, index }
  nearSign: false,
  signRead: {},
  profiles: [], // island ids whose company profile is loaded on the bike
  nearExit: false,
  district: 0,
  year: null,
  splash: 0, // bumps when a new island is entered, to show its name
  resetKey: 0,
  sound: false,
  speed: 1, // the speed dial
  cinematic: true,
  toasts: [], // captures shown on the right: { id, type: 'stop' | 'profile', island, index }
  rideLate: false,
  view: 'ride', // ride | timeline

  start(mode, autopilot) {
    set({ phase: 'island', mode, autopilot: autopilot || get().touch, splash: get().splash + 1 })
  },
  setAutopilot(v) {
    set({ autopilot: v, waiting: false })
  },
  collect(islandId, i) {
    const key = `${islandId}:${i}`
    const idx = get().island
    if (get().collected.includes(key)) {
      get().toast('stop', idx, i)
      return false
    }
    ;(collectedAt[islandId] ||= [])[i] = clock.t
    set({ collected: [...get().collected, key] })
    get().toast('stop', idx, i)
    return true
  },
  toast(type, island, index = -1) {
    const list = get().toasts
    if (list.some((t) => t.type === type && t.island === island && t.index === index)) return
    set({ toasts: [...list, { id: ++toastId, type, island, index }].slice(-4) })
  },
  dropToast(id) {
    set({ toasts: get().toasts.filter((t) => t.id !== id) })
  },
  loadProfile(id) {
    if (!get().profiles.includes(id)) set({ profiles: [...get().profiles, id] })
  },
  dismiss() {
    set({ open: null })
  },
  resume() {
    set({ waiting: false, open: null })
  },
  jumpTo(i) {
    const s = get()
    set({
      island: i,
      visited: s.visited.includes(i) ? s.visited : [...s.visited, i],
      phase: 'island',
      open: null,
      waiting: false,
      nearSign: false,
      nearExit: false,
      district: 0,
      year: null,
      resetKey: s.resetKey + 1,
      splash: s.splash + 1,
    })
  },
  restart() {
    Object.keys(collectedAt).forEach((k) => delete collectedAt[k])
    set({ collected: [], signRead: {}, profiles: [], toasts: [], visited: [0], phase: 'intro', island: 0, open: null, waiting: false, autopilot: false, resetKey: get().resetKey + 1 })
  },
}))

export const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt))
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
export const wrapAngle = (a) => {
  while (a > Math.PI) a -= Math.PI * 2
  while (a < -Math.PI) a += Math.PI * 2
  return a
}
export const smooth = (t) => {
  const x = clamp(t, 0, 1)
  return x * x * (3 - 2 * x)
}
