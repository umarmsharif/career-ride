// The car's engine: recordings of a real engine at six steady revs, blended and pitched to follow
// the revs, through a sequential gearbox with quick paddle-style shifts (a short cut and a pop
// going up, a throttle blip coming down), and tyre squeal while the tail is out. Until the
// recordings have loaded, or if they cannot, a growl made in code stands in. Works with any audio
// context, including an offline one for a rendered preview.

const GEARS = [0, 2.6, 4.8, 7.0, 9.2, 13] // speed at which each gear runs out
const IDLE = 0.16
// The recordings, lowest revs first, with the pitch each was recorded at (measured, in Hz).
export const REVS = [
  ['media/engine/rev-0.wav', 43.5],
  ['media/engine/rev-1.wav', 60.9],
  ['media/engine/rev-2.wav', 65.4],
  ['media/engine/rev-3.wav', 69.2],
  ['media/engine/rev-4.wav', 72.2],
  ['media/engine/rev-5.wav', 76.6],
]

// Fetches and decodes the recordings. Resolves to null if any fails, so the made-in-code engine stays.
export async function loadRevs(ctx, base = '') {
  try {
    return await Promise.all(
      REVS.map(async ([url, f0]) => {
        const res = await fetch(base + url)
        if (!res.ok) throw new Error(url)
        return { buffer: await ctx.decodeAudioData(await res.arrayBuffer()), f0 }
      })
    )
  } catch {
    return null
  }
}

export function makeEngine(ctx, out) {
  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
  const nd = noise.getChannelData(0)
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1

  // Two slightly detuned saws and a sub an octave down, through a filter that opens with the revs.
  const a = ctx.createOscillator()
  const b = ctx.createOscillator()
  const sub = ctx.createOscillator()
  a.type = 'sawtooth'
  b.type = 'sawtooth'
  sub.type = 'sine'
  const subGain = ctx.createGain()
  subGain.gain.value = 0.9
  const tone = ctx.createBiquadFilter()
  tone.type = 'lowpass'
  tone.Q.value = 2.2
  // Firing pulses: the volume throbs at the engine's firing rate.
  const pulse = ctx.createGain()
  pulse.gain.value = 0.7
  const throb = ctx.createOscillator()
  throb.type = 'square'
  const throbDepth = ctx.createGain()
  throbDepth.gain.value = 0.28
  throb.connect(throbDepth).connect(pulse.gain)
  const body = ctx.createGain()
  body.gain.value = 0
  a.connect(tone)
  b.connect(tone)
  sub.connect(subGain).connect(tone)
  tone.connect(pulse).connect(body).connect(out)

  // A little exhaust breath on top.
  const breath = ctx.createBufferSource()
  breath.buffer = noise
  breath.loop = true
  const breathFilter = ctx.createBiquadFilter()
  breathFilter.type = 'bandpass'
  breathFilter.Q.value = 0.9
  const breathGain = ctx.createGain()
  breathGain.gain.value = 0
  breath.connect(breathFilter).connect(breathGain).connect(out)

  // Tyre squeal.
  const squeal = ctx.createBufferSource()
  squeal.buffer = noise
  squeal.loop = true
  const squealFilter = ctx.createBiquadFilter()
  squealFilter.type = 'bandpass'
  squealFilter.frequency.value = 1900
  squealFilter.Q.value = 9
  const squealGain = ctx.createGain()
  squealGain.gain.value = 0
  squeal.connect(squealFilter).connect(squealGain).connect(out)

  for (const n of [a, b, sub, throb, breath, squeal]) n.start()

  // The recorded engine, once its loops are handed over with useRecordings().
  const rec = ctx.createBiquadFilter()
  rec.type = 'lowpass'
  rec.Q.value = 0.8
  const recGain = ctx.createGain()
  recGain.gain.value = 0
  rec.connect(recGain).connect(out)
  let layers = null

  const st = { gear: 1, rpm: IDLE, lastSpeed: 0, shiftUntil: 0, blipUntil: 0 }

  function pop(t, loud) {
    const src = ctx.createBufferSource()
    src.buffer = noise
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = 900
    const g = ctx.createGain()
    g.gain.setValueAtTime(loud, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09)
    src.connect(f).connect(g).connect(out)
    src.start(t)
    src.stop(t + 0.12)
  }

  return {
    useRecordings(revs) {
      if (!revs || layers) return
      layers = revs.map(({ buffer, f0 }) => {
        const src = ctx.createBufferSource()
        src.buffer = buffer
        src.loop = true
        const g = ctx.createGain()
        g.gain.value = 0
        src.connect(g).connect(rec)
        src.start()
        return { src, g, f0 }
      })
    },
    // speed: forward speed; dt: seconds since the last call; drift: the tail is out;
    // running: the engine is on; cruise: on the open road between stations.
    update(t, { speed, dt, drift, running, cruise }) {
      const s = Math.abs(speed)
      const accel = dt > 0 ? (s - st.lastSpeed) / dt : 0
      st.lastSpeed = s
      const load = Math.min(1, Math.max(0, accel / 4))
      // Pick the gear from the speed, shifting up late and down early, one gear at a time.
      let g = st.gear
      if (s > GEARS[g] * 0.97 && g < GEARS.length - 2) g++
      else if (g > 1 && s < GEARS[g - 1] * 0.82) g--
      if (cruise) g = Math.max(g, 4)
      if (g > st.gear) {
        st.shiftUntil = t + 0.11
        pop(t + 0.05, 0.05)
      } else if (g < st.gear) {
        st.blipUntil = t + 0.16
        pop(t + 0.1, 0.035)
      }
      st.gear = g
      const lo = GEARS[g - 1]
      const hi = GEARS[g]
      const frac = Math.min(1, Math.max(0, (s - lo) / (hi - lo)))
      let rpm = s < 0.3 ? IDLE : 0.3 + 0.62 * frac
      if (cruise) rpm = 0.55
      if (t < st.blipUntil) rpm = Math.min(1, rpm + 0.22)
      st.rpm += (rpm - st.rpm) * Math.min(1, dt * 9)
      const r = st.rpm
      const cut = t < st.shiftUntil
      const on = running ? 1 : 0

      if (layers) {
        // Pick the two recordings either side of the wanted pitch, play both at that pitch, and
        // cross-fade between them so the sound never jumps.
        const want = 38 + r * 68
        let i = 0
        while (i < layers.length - 2 && want > layers[i + 1].f0) i++
        const lo = layers[i]
        const hi = layers[i + 1]
        const x = Math.min(1, Math.max(0, (want - lo.f0) / (hi.f0 - lo.f0)))
        layers.forEach((l, j) => {
          const g = j === i ? Math.cos((x * Math.PI) / 2) : j === i + 1 ? Math.sin((x * Math.PI) / 2) : 0
          l.g.gain.setTargetAtTime(g, t, 0.04)
          l.src.playbackRate.setTargetAtTime(want / l.f0, t, 0.03)
        })
        // Off the throttle the sound is duller; on it, brighter.
        rec.frequency.setTargetAtTime(900 + r * 2200 + load * 3500, t, 0.05)
        const level = (0.2 + r * 0.08 + load * 0.1) * on * (cut ? 0.3 : 1)
        recGain.gain.setTargetAtTime(level, t, cut ? 0.012 : 0.05)
        body.gain.setTargetAtTime(0, t, 0.05)
        breathGain.gain.setTargetAtTime((0.001 + load * 0.004) * on, t, 0.08)
        squealGain.gain.setTargetAtTime(drift && running ? 0.045 : 0, t, drift ? 0.05 : 0.12)
        return { gear: st.gear, rpm: st.rpm }
      }

      const f = 34 + r * 96
      a.frequency.setTargetAtTime(f, t, 0.03)
      b.frequency.setTargetAtTime(f * 1.008, t, 0.03)
      sub.frequency.setTargetAtTime(f / 2, t, 0.03)
      throb.frequency.setTargetAtTime(f / 2, t, 0.03)
      tone.frequency.setTargetAtTime(220 + r * 1100 + load * 900, t, 0.05)
      const level = (0.07 + r * 0.05 + load * 0.06) * on * (cut ? 0.25 : 1)
      body.gain.setTargetAtTime(level, t, cut ? 0.012 : 0.05)
      breathFilter.frequency.setTargetAtTime(300 + r * 700, t, 0.05)
      breathGain.gain.setTargetAtTime((0.008 + load * 0.03) * on, t, 0.08)
      squealGain.gain.setTargetAtTime(drift && running ? 0.045 : 0, t, drift ? 0.05 : 0.12)
      return { gear: st.gear, rpm: st.rpm }
    },
  }
}
