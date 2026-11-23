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
}

export const clock = { t: 0 }

// Time (in clock seconds) at which each pickup was collected, for scenery animations.
export const collectedAt = []

export const input = { up: false, down: false, left: false, right: false }

const coarse = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches

// Slow-changing values that the HTML layer shows.
export const useGame = create((set, get) => ({
  phase: 'intro', // intro | island | falling | ride | arrived
  touch: !!coarse,
  autopilot: false,
  waiting: false, // autopilot is paused at a pickup or the signboard
  collected: [],
  fact: null, // index of the pickup whose fact is on screen
  nearSign: false,
  signRead: false,
  nearExit: false,
  district: 0,
  year: null,
  resetKey: 0,

  start(autopilot) {
    set({ phase: 'island', autopilot: autopilot || get().touch })
  },
  setAutopilot(v) {
    set({ autopilot: v, waiting: false })
  },
  collect(i) {
    if (get().collected.includes(i)) return
    collectedAt[i] = clock.t
    set({ collected: [...get().collected, i], fact: i })
  },
  dismissFact() {
    set({ fact: null })
  },
  resume() {
    set({ waiting: false, fact: null })
  },
  restart() {
    collectedAt.length = 0
    set({
      phase: 'island',
      collected: [],
      fact: null,
      waiting: false,
      nearSign: false,
      signRead: false,
      nearExit: false,
      district: 0,
      year: null,
      autopilot: get().touch,
      resetKey: get().resetKey + 1,
    })
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
