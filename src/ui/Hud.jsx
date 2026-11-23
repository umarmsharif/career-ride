// The flat layer over the scene: start card, island label, pickup counter,
// fact cards, the signboard text and the year counter.
import { useEffect } from 'react'
import { useGame } from '../engine/state.js'
import island from '../islands/kitchenStreet/layout.js'
import { stub } from '../islands/airfieldStub/Stub.jsx'

const data = island.data

function Gem() {
  return (
    <svg className="gem" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2 21 12 12 22 3 12Z" />
    </svg>
  )
}

function StartCard() {
  const start = useGame((s) => s.start)
  const touch = useGame((s) => s.touch)
  return (
    <div className="start">
      <div className="card start-card">
        <p className="eyebrow">Stage 1 preview · one island of nine</p>
        <h1>Career Ride</h1>
        <p className="lede">
          Ride through {data.name}, the {data.company} years. Find six tokens, read the signboard, then leave through the
          gate for {stub.year}.
        </p>
        <div className="row">
          {!touch && (
            <button id="start-steer" className="btn primary" onClick={() => start(false)}>
              Start riding
            </button>
          )}
          <button id="start-auto" className={touch ? 'btn primary' : 'btn'} onClick={() => start(true)}>
            {touch ? 'Start the ride' : 'Ride for me'}
          </button>
        </div>
        <p className="fine">
          {touch ? 'On a phone the rider steers for you. Tap to move on from each stop.' : 'Steer with the arrow keys or W A S D.'}
        </p>
      </div>
    </div>
  )
}

function Year() {
  const year = useGame((s) => s.year)
  const phase = useGame((s) => s.phase)
  if (phase !== 'ride' || !year) return null
  return (
    <div className="year" aria-live="polite">
      <span className="year-label">Riding into</span>
      <span className="year-digits" key={year}>
        {year}
      </span>
    </div>
  )
}

export default function Hud() {
  const g = useGame()

  // Space or Enter moves a hands-free ride on from a stop.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.code === 'Space' || e.code === 'Enter') && !e.target?.closest?.('button')) {
        const s = useGame.getState()
        if (s.waiting) s.resume()
        else if (s.fact !== null) s.dismissFact()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // In free steering a fact card clears itself after a while.
  useEffect(() => {
    if (g.fact === null || g.autopilot) return
    const id = setTimeout(() => useGame.getState().dismissFact(), 7000)
    return () => clearTimeout(id)
  }, [g.fact, g.autopilot])

  if (g.phase === 'intro') return <StartCard />

  const onIsland = g.phase === 'island' || g.phase === 'falling'
  const total = island.pickups.length
  const fact = g.fact !== null ? island.pickups[g.fact] : null
  const showSign = onIsland && fact === null && (g.autopilot ? g.waiting && g.signRead && g.collected.length === 0 : g.nearSign)

  return (
    <div className="hud">
      <header className="top">
        {onIsland && (
          <div className="pill place">
            <span className="place-name">{data.name}</span>
            <span className="place-sub">
              {island.districts[g.district]} · {data.years}
            </span>
          </div>
        )}
        {g.phase === 'arrived' && (
          <div className="pill place">
            <span className="place-name">{stub.name}</span>
            <span className="place-sub">{stub.year}</span>
          </div>
        )}
        <div className="spacer" />
        {onIsland && !g.touch && (
          <button id="toggle-auto" className="btn small" onClick={() => g.setAutopilot(!g.autopilot)}>
            {g.autopilot ? 'Take the handlebars' : 'Ride for me'}
          </button>
        )}
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

      <Year />

      <div className="bottom">
        {showSign && (
          <section className="card sign" aria-live="polite">
            <p className="eyebrow">
              {data.company} · {data.years}
            </p>
            <h2>{data.role}</h2>
            <p>{data.summary}</p>
          </section>
        )}
        {fact && onIsland && (
          <section className="card fact" aria-live="polite" key={g.fact}>
            <p className="eyebrow">
              <Gem /> {island.districts[fact.district]}
            </p>
            <p className="fact-text">{fact.fact}</p>
          </section>
        )}
        {onIsland && g.autopilot && g.waiting && (
          <button id="ride-on" className="btn primary" onClick={() => g.resume()}>
            {g.touch ? 'Tap to ride on' : 'Ride on'}
          </button>
        )}
        {onIsland && !g.autopilot && fact === null && !showSign && (
          <p className="hint">
            {g.nearExit ? (
              <>Ride through the glowing gate to leave for {stub.year}</>
            ) : (
              <>
                <kbd>↑</kbd> pedal <kbd>←</kbd> <kbd>→</kbd> steer <kbd>↓</kbd> brake
              </>
            )}
          </p>
        )}
        {g.phase === 'arrived' && (
          <section className="card arrived">
            <p className="eyebrow">End of the Stage 1 preview</p>
            <h2>
              You found {g.collected.length} of {total} tokens
            </h2>
            <p>The Airfield and the other seven islands are built in Stage 2.</p>
            <button id="ride-again" className="btn primary" onClick={() => g.restart()}>
              Ride {data.name} again
            </button>
          </section>
        )}
      </div>
    </div>
  )
}
