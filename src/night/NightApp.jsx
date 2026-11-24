// Night Drive: the page around the scene. Starts by itself, drives by itself, and ends on a
// way to get in touch. The look follows umarmsharif.com: near-black, lime, mono labels.
import { useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import career from '../content/career.json'
import NightScene from './NightScene.jsx'
import Cinematic from '../engine/Cinematic.jsx'
import { useNight } from './nightState.js'
import './night.css'

const coarse = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches

function useDistrict() {
  return useMemo(() => {
    const isl = career.islands.find((i) => i.id === 4)
    const years = (isl.years.match(/\d{4}/g) || []).map(Number)
    const stops = isl.districts.flatMap((d) => d.pickups.map((p) => ({ ...p, district: d.name })))
    return { ...isl, startYear: years[0], endYear: years[years.length - 1], stops, districts: isl.districts.map((d) => d.name) }
  }, [])
}

// A filmed clip shown over the scene: the driver getting in before the drive, and getting out
// at the end. Set the file paths in career.json under "night". With no file, nothing is shown.
function Clip({ src, onDone }) {
  // If the clip is missing or will not play, carry on without it after a short wait.
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    if (playing) return
    const id = setTimeout(onDone, 3500)
    return () => clearTimeout(id)
  }, [playing])
  return (
    <div className="n-clip">
      <video src={src.replace(/^\//, '')} autoPlay muted playsInline onPlaying={() => setPlaying(true)} onEnded={onDone} onError={onDone} />
      <button className="n-btn" onClick={onDone}>
        Skip
      </button>
    </div>
  )
}

const LIFE = { stop: 6500, profile: 7500 }
function Toast({ toast, district }) {
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    const a = setTimeout(() => setLeaving(true), LIFE[toast.kind])
    const b = setTimeout(() => useNight.getState().dropToast(toast.id), LIFE[toast.kind] + 600)
    return () => {
      clearTimeout(a)
      clearTimeout(b)
    }
  }, [toast.id, toast.kind])
  const stop = toast.kind === 'stop' ? district.stops[toast.index] : null
  return (
    <section className={`n-card n-toast${leaving ? ' leaving' : ''}`}>
      {stop ? (
        <>
          <p className="n-label">
            Result {toast.index + 1} of {district.stops.length} · now in lights
          </p>
          <p className="n-figure">{stop.headline}</p>
          <p className="n-text">{stop.fact}</p>
        </>
      ) : (
        <>
          <p className="n-label">
            <span className="n-dot" style={{ background: district.brand.primary }} />
            {district.years}
          </p>
          <p className="n-figure small">{district.company}</p>
          <p className="n-text">{district.role}</p>
          {district.about && <p className="n-text dim">{district.about}</p>}
        </>
      )}
    </section>
  )
}

function Hud({ district }) {
  const g = useNight()
  const pct = Math.round((g.lit / Math.max(1, g.total)) * 100)
  const links = career.person.links
  const owner = career.person.name
  const now = career.islands[career.islands.length - 1]
  const finale = now.cards[0]
  // Starts by itself after the title has been read; no click needed.
  const clips = career.night || {}
  const [intro, setIntro] = useState(!!clips.introClip)
  const [outro, setOutro] = useState(false)
  useEffect(() => {
    if (g.phase === 'title') setIntro(!!clips.introClip)
    if (g.phase !== 'done' || !clips.outroClip) return setOutro(false)
    const id = setTimeout(() => setOutro(true), 1200)
    return () => clearTimeout(id)
  }, [g.phase, g.runKey])
  useEffect(() => {
    if (g.phase !== 'title' || intro) return
    const id = setTimeout(() => {
      useNight.getState().start()
      useNight.getState().toast('profile')
    }, 2600)
    return () => clearTimeout(id)
  }, [g.phase, g.runKey, intro])
  return (
    <div className="n-hud">
      {intro && <Clip src={clips.introClip} onDone={() => setIntro(false)} />}
      {outro && <Clip src={clips.outroClip} onDone={() => setOutro(false)} />}
      <header className="n-top">
        <div className="n-place">
          <span className="n-label">District 4 of 9 · {district.years}</span>
          <span className="n-name">{district.name}</span>
          <span className="n-sub">
            {district.company} · {district.role}
          </span>
        </div>
        <div className="n-spacer" />
        {g.phase === 'drive' && !coarse && (
          <button id="n-wheel" className="n-btn" onClick={() => useNight.setState({ auto: !g.auto })}>
            {g.auto ? 'Take the wheel' : 'Drive for me'}
          </button>
        )}
        <div className="n-meter" aria-label={`${pct}% of the district is lit`}>
          <span className="n-label">City lit</span>
          <span className="n-pct">{pct}%</span>
          <span className="n-bar">
            <i style={{ width: `${pct}%` }} />
          </span>
        </div>
      </header>

      <div className="n-toasts" aria-live="polite">
        {g.toasts.map((t) => (
          <Toast key={t.id} toast={t} district={district} />
        ))}
      </div>

      {g.phase === 'title' && !intro && (
        <div className="n-title">
          <p className="n-label">
            {owner} · {now.role}
          </p>
          <h1>
            Night <em>Drive</em>
          </h1>
          <p className="n-text">A career in nine districts. Every result switches on part of the city.</p>
        </div>
      )}

      {g.phase === 'done' && (
        <section className="n-card n-end">
          <div className="n-who">
            {career.person.photo && <img src={career.person.photo.replace(/^\//, '')} alt="" width="52" height="52" onError={(e) => (e.currentTarget.style.display = 'none')} />}
            <div>
              <p className="n-owner">{owner}</p>
              <p className="n-label">{now.role}</p>
            </div>
          </div>
          <h2>{district.name} is lit.</h2>
          <p className="n-text">
            {g.collected.length} results from {district.years} at {district.company}, written across the skyline. District 4 of 9; the drive ends at {finale.title}.
          </p>
          <div className="n-row">
            <a id="n-book" className="n-btn primary" href={links.book} target="_blank" rel="noopener">
              Book a 30-min intro call
            </a>
            <button id="n-again" className="n-link" onClick={() => g.restart()}>
              Drive again
            </button>
            <a className="n-link" href={links.site}>
              umarmsharif.com
            </a>
          </div>
        </section>
      )}

      {g.phase === 'drive' && (
        <div className="n-dial" role="group" aria-label="Speed">
          <span className="n-label">Speed</span>
          {[1, 1.5, 2, 3].map((v) => (
            <button key={v} id={`n-speed-${v}`} className={v === g.speed ? 'on' : ''} aria-pressed={v === g.speed} onClick={() => useNight.setState({ speed: v })}>
              {v}x
            </button>
          ))}
        </div>
      )}
      {g.phase === 'drive' && !g.auto && <p className="n-hint">Arrow keys or W A S D to drive</p>}
      {g.phase !== 'done' && (
        <a className="n-back" href={links.site}>
          <b>{owner}</b> · {now.role}
        </a>
      )}
    </div>
  )
}

export default function NightApp() {
  const district = useDistrict()
  return (
    <div className="n-stage">
      <Canvas flat shadows={{ type: THREE.PCFSoftShadowMap }} dpr={[1, coarse ? 1.5 : 2]} camera={{ fov: 25, near: 1, far: 1200, position: [60, 120, 100] }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
        <NightScene district={district} wet={!coarse} />
        {/* The glow is what makes it night. Phones get the glow without the extra blur passes. */}
        <Cinematic bloom={[0.55, 0.6, 0.86]} tilt={coarse ? 0 : 1.2} band={0.3} ratio={coarse ? 1 : 1.5} />
      </Canvas>
      <Hud district={district} />
    </div>
  )
}
