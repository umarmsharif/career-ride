// A small soundscape made entirely in code. Silent until the visitor switches it on.
import { DRIVE } from './world.js'
import { makeEngine } from './engineSound.js'
let ctx = null
let master = null
let pad = null
let wind = null
let lastPedal = 0
let padIsland = -1
let engine = null
let lastT = 0

function noiseBuffer() {
  const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  const d = b.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return b
}

function tone(freq, t0, dur, gain, type = 'sine') {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(gain, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  o.connect(g).connect(master)
  o.start(t0)
  o.stop(t0 + dur + 0.05)
}

// Each island gets its own soft two-note drone.
const ROOTS = [196, 220, 174.6, 207.7, 185, 233.1, 246.9, 164.8, 261.6]

export const audio = {
  on: false,
  enable() {
    try {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)()
        master = ctx.createGain()
        master.gain.value = 0.5
        master.connect(ctx.destination)
        const buf = noiseBuffer()
        wind = { src: ctx.createBufferSource(), filter: ctx.createBiquadFilter(), gain: ctx.createGain() }
        wind.src.buffer = buf
        wind.src.loop = true
        wind.filter.type = 'bandpass'
        wind.filter.frequency.value = 500
        wind.filter.Q.value = 0.6
        wind.gain.gain.value = 0
        wind.src.connect(wind.filter).connect(wind.gain).connect(master)
        wind.src.start()
        pad = { a: ctx.createOscillator(), b: ctx.createOscillator(), filter: ctx.createBiquadFilter(), gain: ctx.createGain() }
        pad.a.type = 'triangle'
        pad.b.type = 'sine'
        pad.filter.type = 'lowpass'
        pad.filter.frequency.value = 700
        pad.gain.gain.value = 0
        pad.a.connect(pad.filter)
        pad.b.connect(pad.filter)
        pad.filter.connect(pad.gain).connect(master)
        pad.a.start()
        pad.b.start()
        padIsland = -1
        if (DRIVE) engine = makeEngine(ctx, master)
      }
      ctx.resume()
      this.on = true
    } catch {
      this.on = false
    }
  },
  disable() {
    this.on = false
    if (ctx) ctx.suspend()
  },
  chime() {
    if (!this.on) return
    const t = ctx.currentTime
    tone(784, t, 0.35, 0.16)
    tone(1174.7, t + 0.09, 0.5, 0.14)
  },
  tick() {
    if (!this.on) return
    tone(520, ctx.currentTime, 0.12, 0.1, 'triangle')
  },
  whoosh() {
    if (!this.on) return
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.frequency.setValueAtTime(500, t)
    o.frequency.exponentialRampToValueAtTime(90, t + 0.9)
    g.gain.setValueAtTime(0.12, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9)
    o.connect(g).connect(master)
    o.start(t)
    o.stop(t + 1)
  },
  // Called every frame.
  update(g, rider, island) {
    if (!this.on || !ctx) return
    const t = ctx.currentTime
    const riding = g.phase === 'ride'
    wind.gain.gain.setTargetAtTime(riding ? 0.09 : Math.min(Math.abs(rider.speed) / 10, 1) * 0.02, t, 0.3)
    wind.filter.frequency.setTargetAtTime(riding ? 900 : 450, t, 0.4)
    const idx = g.phase === 'intro' ? 0 : g.island
    if (idx !== padIsland) {
      padIsland = idx
      const root = ROOTS[idx % ROOTS.length]
      pad.a.frequency.setTargetAtTime(root, t, 0.8)
      pad.b.frequency.setTargetAtTime(root * 1.5, t, 0.8)
    }
    // In the car the music sits lower, under the engine.
    pad.gain.gain.setTargetAtTime(DRIVE ? 0.02 : 0.035, t, 1.5)
    if (engine) {
      const dt = lastT ? Math.min(0.1, t - lastT) : 0
      lastT = t
      engine.update(t, {
        speed: riding ? 8 : rider.speed,
        dt,
        drift: !!rider.drift,
        // The engine stops when the driver steps out at the end.
        running: !(rider.out > 0.05),
        cruise: riding,
      })
      return
    }
    // A soft click for each half turn of the pedals.
    const half = Math.floor(rider.pedal / Math.PI)
    if (rider.pedalling && half !== lastPedal) {
      lastPedal = half
      tone(half % 2 ? 150 : 170, t, 0.06, 0.05, 'triangle')
    }
  },
}
