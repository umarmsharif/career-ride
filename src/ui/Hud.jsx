// The flat layer over the scene: start screen, island label, mini-map, token counter,
// the cards for each kind of stop, the year counter and the closing scene.
import { useEffect, useState } from 'react'
import { useGame } from '../engine/state.js'
import { audio } from '../engine/sound.js'
import career from '../content/career.json'

function Gem() {
  return (
    <svg className="gem" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2 21 12 12 22 3 12Z" />
    </svg>
  )
}

function CvLink({ className = 'cv-link' }) {
  return (
    <button id="open-cv" className={className} onClick={() => useGame.setState({ view: 'timeline' })}>
      Plain CV
    </button>
  )
}

function StartScreen() {
  const start = useGame((s) => s.start)
  const touch = useGame((s) => s.touch)
  return (
    <div className="start">
      <div className="card start-card">
        <p className="eyebrow">{career.person.name}</p>
        <h1>Career Ride</h1>
        <p className="lede">Nine islands, one bicycle. Ride from a software workshop in 2004 to an AI classroom today.</p>
        <div className="row">
          <button id="start-story" className="btn primary" onClick={() => start('story', false)}>
            {touch ? 'Start the story' : 'Play the story'}
          </button>
          {!touch && (
            <button id="start-map" className="btn" onClick={() => start('map', false)}>
              Open map
            </button>
          )}
          {!touch && (
            <button id="start-auto" className="btn" onClick={() => start('story', true)}>
              Ride for me
            </button>
          )}
        </div>
        <p className="fine">
          {touch ? 'The rider steers for you. Tap to move on from each stop.' : 'Steer with the arrow keys or W A S D. Story plays the years in order; Open map lets you start anywhere.'}
        </p>
        <CvLink className="text-link" />
      </div>
    </div>
  )
}

function MiniMap({ islands }) {
  const current = useGame((s) => s.island)
  const visited = useGame((s) => s.visited)
  const mode = useGame((s) => s.mode)
  const phase = useGame((s) => s.phase)
  const jumpTo = useGame((s) => s.jumpTo)
  return (
    <nav className="minimap" aria-label="Islands">
      {islands.map((isl, i) => {
        const canJump = (mode === 'map' || visited.includes(i)) && phase !== 'ride' && i !== current
        return (
          <button
            key={isl.id}
            id={`map-${isl.id}`}
            className={`map-dot${i === current ? ' here' : ''}${visited.includes(i) ? ' seen' : ''}`}
            disabled={!canJump}
            onClick={() => jumpTo(i)}
            title={`${isl.name} · ${isl.data.years}`}
            aria-label={`${isl.name}, ${isl.data.years}${i === current ? ', you are here' : ''}`}
            aria-current={i === current ? 'step' : undefined}
          >
            {isl.id}
          </button>
        )
      })}
    </nav>
  )
}

function Diagram({ steps }) {
  return (
    <ol className="diagram" aria-label="How it works">
      {steps.map((s, i) => (
        <li key={i} style={{ animationDelay: `${i * 0.35}s` }}>
          {s}
        </li>
      ))}
    </ol>
  )
}

function Footage({ src, title }) {
  const [missing, setMissing] = useState(false)
  if (missing) {
    return (
      <div className="clip-missing" role="img" aria-label={`Clip of ${title} to be added`}>
        <span>Clip coming soon</span>
      </div>
    )
  }
  return <video className="clip" src={src.replace(/^\//, '')} controls muted playsInline preload="metadata" onError={() => setMissing(true)} />
}

function StopCard({ stop, district }) {
  if (stop.kind === 'fact') {
    return (
      <section className="card fact" aria-live="polite">
        <p className="eyebrow">
          <Gem /> {district}
        </p>
        <p className="fact-text">{stop.fact}</p>
      </section>
    )
  }
  if (stop.kind === 'machine') {
    return (
      <section className="card project" aria-live="polite">
        <p className="eyebrow">{stop.client}</p>
        <h2>{stop.title}</h2>
        {stop.card === 'footage' ? <Footage src={stop.media} title={stop.title} /> : stop.diagram && <Diagram steps={stop.diagram} />}
        <ul className="facts">
          {stop.facts.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </section>
    )
  }
  return (
    <section className="card board" aria-live="polite">
      <p className="eyebrow">{stop.kind === 'board' ? 'On the board' : 'Now'}</p>
      <h2>{stop.title}</h2>
      <p>{stop.body}</p>
    </section>
  )
}

function Splash({ island }) {
  const splash = useGame((s) => s.splash)
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (!splash) return
    setShow(true)
    const id = setTimeout(() => setShow(false), 2600)
    return () => clearTimeout(id)
  }, [splash])
  if (!show) return null
  return (
    <div className="splash" key={splash} aria-live="polite">
      <span className="splash-years">{island.data.years}</span>
      <span className="splash-name">{island.name}</span>
    </div>
  )
}

function Closing({ total }) {
  const g = useGame()
  const last = career.islands[career.islands.length - 1]
  const links = career.person.links
  return (
    <section className="card closing">
      <p className="eyebrow">The end of the road, for now</p>
      <h2>{last.closing}</h2>
      <p>
        You found {g.collected.length} of {total} tokens.
      </p>
      <div className="row">
        <a id="link-linkedin" className="btn primary" href={links.linkedin} target="_blank" rel="noopener">
          LinkedIn
        </a>
        <a id="link-github" className="btn" href={links.github} target="_blank" rel="noopener">
          GitHub
        </a>
        <CvLink className="btn" />
      </div>
      <div className="row">
        <button id="again" className="text-link" onClick={() => g.restart()}>
          Ride again
        </button>
        <button
          id="explore"
          className="text-link"
          onClick={() => {
            useGame.setState({ mode: 'map', autopilot: false })
            g.jumpTo(0)
          }}
        >
          Explore every island
        </button>
      </div>
    </section>
  )
}

export default function Hud({ islands }) {
  const g = useGame()
  const island = islands[g.island]
  const total = islands.reduce((n, i) => n + i.stops.length, 0)

  // Space or Enter moves a hands-free ride on from a stop, or closes a card.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') && !e.target?.closest?.('button, a, video')) {
        const s = useGame.getState()
        if (s.waiting) s.resume()
        else if (s.open) s.dismiss()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // In free steering a fact card clears itself after a while; project cards stay until closed.
  const open = g.open && g.open.island === g.island ? island.stops[g.open.index] : null
  useEffect(() => {
    if (!open || g.autopilot || open.kind !== 'fact') return
    const id = setTimeout(() => useGame.getState().dismiss(), 7000)
    return () => clearTimeout(id)
  }, [open, g.autopilot])

  if (g.phase === 'intro') return <StartScreen />

  const onIsland = g.phase === 'island' || g.phase === 'falling'
  const showSign = onIsland && !open && g.signRead[island.id] && (g.autopilot ? g.waiting : g.nearSign)
  const data = island.data

  return (
    <div className="hud">
      <header className="top">
        {onIsland && (
          <div className="pill place">
            <span className="place-name">{island.name}</span>
            <span className="place-sub">
              {island.districts.length > 1 ? `${island.districts[g.district]} · ` : ''}
              {data.years}
            </span>
          </div>
        )}
        <div className="spacer" />
        {onIsland && !g.touch && (
          <button id="toggle-auto" className="btn small" onClick={() => g.setAutopilot(!g.autopilot)}>
            {g.autopilot ? 'Take the handlebars' : 'Ride for me'}
          </button>
        )}
        <button
          id="toggle-sound"
          className="btn small"
          aria-pressed={g.sound}
          onClick={() => {
            if (g.sound) audio.disable()
            else audio.enable()
            useGame.setState({ sound: !g.sound })
          }}
        >
          {g.sound ? 'Sound on' : 'Sound off'}
        </button>
        {g.phase !== 'ride' && (
          <div className="pill counter" aria-label={`${g.collected.length} of ${total} tokens found`}>
            <Gem />
            <span>
              {g.collected.length}
              <small> / {total}</small>
            </span>
          </div>
        )}
      </header>
      {g.phase !== 'closing' && <MiniMap islands={islands} />}

      {onIsland && <Splash island={island} />}
      {g.phase === 'ride' && g.year && (
        <div className="year" aria-live="polite">
          <span className="year-label">Riding into</span>
          <span className="year-digits" key={g.year}>
            {g.year}
          </span>
        </div>
      )}

      <div className="bottom">
        {showSign && (
          <section className="card sign" aria-live="polite">
            <p className="eyebrow">
              <span className="swatch" style={{ background: data.brand.primary }} />
              Company profile · {g.profiles.length} of {islands.length} loaded
            </p>
            <h2>{data.company}</h2>
            {data.about && <p className="about">{data.about}</p>}
            <p className="role">
              <strong>{data.years}</strong> · {data.role}
            </p>
            <p>{data.summary}</p>
          </section>
        )}
        {open && onIsland && <StopCard key={`${g.island}-${g.open.index}`} stop={open} district={island.districts[open.district] ?? island.name} />}
        {onIsland && g.autopilot && g.waiting && (
          <button id="ride-on" className="btn primary" onClick={() => g.resume()}>
            {g.touch ? 'Tap to ride on' : 'Ride on'}
          </button>
        )}
        {onIsland && !g.autopilot && open && open.kind !== 'fact' && (
          <button id="close-card" className="btn small" onClick={() => g.dismiss()}>
            Close
          </button>
        )}
        {onIsland && !g.autopilot && !open && !showSign && (
          <p className="hint">
            {g.nearExit ? (
              <>Ride through the glowing gate to leave for {islands[g.island + 1]?.startYear}</>
            ) : (
              <>
                {!g.signRead[island.id] && <>Ride to the folder by the signboard · </>}
                <kbd>↑</kbd> pedal <kbd>←</kbd> <kbd>→</kbd> steer <kbd>↓</kbd> brake
              </>
            )}
          </p>
        )}
        {g.phase === 'closing' && <Closing total={total} />}
      </div>
      {g.phase !== 'closing' && <CvLink />}
    </div>
  )
}
