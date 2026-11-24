// The flat layer over the scene: start screen, island label, mini-map, token counter,
// the cards for each kind of stop, the year counter and the closing scene.
import { useEffect, useState } from 'react'
import { useGame } from '../engine/state.js'
import { audio } from '../engine/sound.js'
import career from '../content/career.json'
import { VOYAGE } from '../engine/world.js'

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
        <h1>{VOYAGE ? 'Career Voyage' : 'Career Ride'}</h1>
        <p className="lede">
          {VOYAGE
            ? 'Nine islands, one bicycle and a small boat. Sail from a software workshop in 2004 to an AI classroom today.'
            : 'Nine islands, one bicycle. Ride from a software workshop in 2004 to an AI classroom today.'}
        </p>
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
          {touch ? 'The rider steers for you. Sit back and watch.' : 'Steer with the arrow keys or W A S D. Story plays the years in order; Open map lets you start anywhere.'}
        </p>
        <div className="row">
          <CvLink className="text-link" />
          {career.person.links.site && (
            <a id="start-site" className="text-link" href={career.person.links.site}>
              Back to umarmsharif.com
            </a>
          )}
        </div>
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
  // A still image (for example a screenshot of the live product) or a video clip.
  if (/\.(jpe?g|png|webp)$/i.test(src)) return <img className="clip" src={src.replace(/^\//, '')} alt={`${title}: the live product`} onError={() => setMissing(true)} />
  return <video className="clip" src={src.replace(/^\//, '')} controls muted playsInline preload="metadata" onError={() => setMissing(true)} />
}

function StopCard({ stop, district }) {
  if (stop.kind === 'fact') {
    return (
      <>
        <p className="eyebrow">
          <Gem /> {district}
        </p>
        <p className="fact-text">{stop.fact}</p>
      </>
    )
  }
  if (stop.kind === 'machine') {
    return (
      <>
        <p className="eyebrow">{stop.client}</p>
        <h2>{stop.title}</h2>
        {stop.card === 'footage' ? <Footage src={stop.media} title={stop.title} /> : stop.diagram && <Diagram steps={stop.diagram} />}
        <ul className="facts">
          {stop.facts.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </>
    )
  }
  return (
    <>
      <p className="eyebrow">{stop.kind === 'board' ? 'On the board' : 'Now'}</p>
      <h2>{stop.title}</h2>
      <p>{stop.body}</p>
    </>
  )
}

function ProfileCard({ island, count, total }) {
  const data = island.data
  return (
    <>
      <p className="eyebrow">
        <span className="swatch" style={{ background: data.brand.primary }} />
        Company profile · {count} of {total} loaded
      </p>
      <h2>{data.company}</h2>
      {data.about && <p className="about">{data.about}</p>}
      <p className="role">
        <strong>{data.years}</strong> · {data.role}
      </p>
      <p>{data.summary}</p>
    </>
  )
}

// How long each kind of capture stays on screen, in seconds.
const LIFE = { fact: 5, board: 7, card: 7, machine: 9, profile: 7 }

// One capture in the stack on the right. It fades in, waits, fades out and removes itself.
function Toast({ toast, islands }) {
  const [leaving, setLeaving] = useState(false)
  const island = islands[toast.island]
  const stop = toast.type === 'stop' ? island.stops[toast.index] : null
  const kind = stop ? stop.kind : 'profile'
  useEffect(() => {
    const life = LIFE[kind] * 1000
    const a = setTimeout(() => setLeaving(true), life)
    const b = setTimeout(() => useGame.getState().dropToast(toast.id), life + 600)
    return () => {
      clearTimeout(a)
      clearTimeout(b)
    }
  }, [toast.id, kind])
  return (
    <section className={`card toast ${kind}${leaving ? ' leaving' : ''}`}>
      {stop ? <StopCard stop={stop} district={island.districts[stop.district] ?? island.name} /> : <ProfileCard island={island} count={useGame.getState().profiles.length} total={islands.length} />}
    </section>
  )
}

function Toasts({ islands }) {
  const toasts = useGame((s) => s.toasts)
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} islands={islands} />
      ))}
    </div>
  )
}

function SpeedDial() {
  const speed = useGame((s) => s.speed)
  return (
    <div className="dial" role="group" aria-label="Bike speed">
      <span className="dial-label">Speed</span>
      {[1, 1.5, 2, 3].map((v) => (
        <button key={v} id={`speed-${v}`} className={`dial-step${v === speed ? ' on' : ''}`} aria-pressed={v === speed} onClick={() => useGame.setState({ speed: v })}>
          {v}x
        </button>
      ))}
    </div>
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
  const finale = last.cards[0]
  const links = career.person.links
  return (
    <section className="card closing">
      {career.person.photo && <img className="avatar" src={career.person.photo.replace(/^\//, '')} alt={career.person.name} width="96" height="96" />}
      <p className="eyebrow">Now</p>
      <h2 className="finale-title">
        {last.brand.logo && <img className="finale-logo" src={last.brand.logo.replace(/^\//, '')} alt="" width="48" height="48" />}
        {finale.title}
      </h2>
      <p>{finale.body}</p>
      <p className="closing-line">{last.closing}</p>
      <p className="fine">
        You found {g.collected.length} of {total} tokens and loaded {g.profiles.length} company profiles.
      </p>
      <div className="row">
        {links.site && (
          <a id="link-site" className="btn primary" href={links.site}>
            Back to umarmsharif.com
          </a>
        )}
        <a id="link-linkedin" className="btn" href={links.linkedin} target="_blank" rel="noopener">
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
            // A phone has no steering keys, so the rider keeps steering itself there.
            useGame.setState({ mode: 'map', autopilot: g.touch })
            g.jumpTo(0)
          }}
        >
          {g.touch ? 'Pick an island to revisit' : 'Explore every island'}
        </button>
      </div>
    </section>
  )
}

export default function Hud({ islands }) {
  const g = useGame()
  const island = islands[g.island]
  const total = islands.reduce((n, i) => n + i.stops.length, 0)

  if (g.phase === 'intro') return <StartScreen />

  const onIsland = g.phase === 'island' || g.phase === 'falling'
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
        {!g.touch && (
          <button id="toggle-cine" className="btn small" aria-pressed={g.cinematic} onClick={() => useGame.setState({ cinematic: !g.cinematic })}>
            {g.cinematic ? 'Cinematic on' : 'Cinematic off'}
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
      {g.touch && g.mode === 'map' && onIsland && g.toasts.length === 0 && <p className="hint map-hint">Tap a number to jump to that island</p>}
      {g.phase !== 'closing' && <Toasts islands={islands} />}

      {onIsland && <Splash island={island} />}
      {g.phase === 'ride' && g.year && (
        <div className="year" aria-live="polite">
          <span className="year-label">{VOYAGE ? 'Sailing into' : 'Riding into'}</span>
          <span className="year-digits" key={g.year}>
            {g.year}
          </span>
        </div>
      )}

      <div className="bottom">
        {onIsland && !g.autopilot && g.toasts.length === 0 && (
          <p className="hint">
            {g.nearExit ? (
              <>{VOYAGE ? 'Ride through the glowing gate to the pier and sail for' : 'Ride through the glowing gate to leave for'} {islands[g.island + 1]?.startYear}</>
            ) : (
              <>
                <kbd>↑</kbd> pedal <kbd>←</kbd> <kbd>→</kbd> steer <kbd>↓</kbd> brake
              </>
            )}
          </p>
        )}
        {g.phase === 'closing' && <Closing total={total} />}
      </div>
      {g.phase !== 'closing' && <SpeedDial />}
      {g.phase !== 'closing' && <CvLink />}
    </div>
  )
}
