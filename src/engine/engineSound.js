// The car's engine, made in code: a growl that follows the revs, a sequential gearbox with quick
// paddle-style shifts (a short cut and a pop going up, a throttle blip coming down), and tyre
// squeal while the tail is out. Works with any audio context, including an offline one for a
// rendered preview.

const GEARS = [0, 2.6, 4.8, 7.0, 9.2, 13] // speed at which each gear runs out
const IDLE = 0.16

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
