// Runs the hands-free tour on a phone-sized touch screen and saves frames along the way.
import { createRequire } from 'module'
const require = createRequire('/')
const { chromium } = require('playwright')
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await page.goto('http://127.0.0.1:5173/')
await page.waitForTimeout(2500)
await page.screenshot({ path: 'docs/shots/p-0-start.png' })
const fps0 = await page.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = () => { n++; performance.now() - t0 < 2000 ? requestAnimationFrame(f) : res(n / 2) }; requestAnimationFrame(f) }))
console.log('fps(headless software):', fps0)
await page.tap('#start-auto')
let shots = 0
const log = []
for (let i = 0; i < 150; i++) {
  await page.waitForTimeout(1000)
  const st = await page.evaluate(() => { const s = window.__ride.game.getState(); const r = window.__ride.rider; return { phase: s.phase, waiting: s.waiting, n: s.collected.length, fact: s.fact, x: +r.pos.x.toFixed(1), z: +r.pos.z.toFixed(1), y: +r.pos.y.toFixed(1) } })
  if (i % 6 === 0) log.push(JSON.stringify(st))
  if (st.waiting) {
    await page.waitForTimeout(700)
    if (shots < 9) await page.screenshot({ path: `docs/shots/p-${++shots}-stop.png` })
    await page.tap('#ride-on')
  }
  if (st.phase === 'ride' && !globalThis.rideShot) { globalThis.rideShot = 1; await page.waitForTimeout(3500); await page.screenshot({ path: 'docs/shots/p-ride.png' }) }
  if (st.phase === 'arrived') { await page.waitForTimeout(1500); await page.screenshot({ path: 'docs/shots/p-arrived.png' }); log.push(JSON.stringify(st)); break }
}
console.log(log.join('\n'))
console.log('errors:', errors.slice(0, 5))
await browser.close()
