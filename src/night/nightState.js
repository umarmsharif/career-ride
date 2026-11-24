import { create } from 'zustand'

let toastId = 0

// Slow-changing values the interface shows. Fast values (car position and so on) live in `car`.
export const useNight = create((set, get) => ({
  phase: 'title', // title | drive | done
  auto: true,
  speed: 1,
  lit: 0,
  total: 1,
  collected: [],
  toasts: [],
  start() {
    if (get().phase === 'title') set({ phase: 'drive' })
  },
  toast(kind, index = -1) {
    const list = get().toasts
    if (list.some((t) => t.kind === kind && t.index === index)) return
    set({ toasts: [...list, { id: ++toastId, kind, index }].slice(-3) })
  },
  dropToast(id) {
    set({ toasts: get().toasts.filter((t) => t.id !== id) })
  },
  collect(i) {
    if (get().collected.includes(i)) return false
    set({ collected: [...get().collected, i] })
    get().toast('stop', i)
    return true
  },
  restart() {
    set({ phase: 'title', auto: true, lit: 0, collected: [], toasts: [], runKey: (get().runKey || 0) + 1 })
  },
  runKey: 0,
}))

export const car = { x: 0, z: 0, yaw: Math.PI / 2, slip: 0, speed: 0, s: 0, drift: 0, slide: 0, door: 0, out: 0, t: 0 }
export const keys = { up: false, down: false, left: false, right: false }
