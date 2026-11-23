// Checks one island: node tools/tourcheck.mjs <islandNumber>
// Rides it hands-free and reports whether every stop was found and the rider reached the exit.
import { createRequire } from 'module'
const require = createRequire('/')
const { chromium } = require('playwright')
const n = +process.argv[2]
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && /fail|rror/.test(m.text()) && errors.push(m.text()))
await page.goto(`http://127.0.0.1:5173/?only=${n}&start=${n}`)
await page.waitForFunction(() => window.__ride?.game?.getState().phase === 'island', null, { timeout: 40000 })
await page.waitForTimeout(800)
const total = await page.evaluate((n) => window.__ride.islands[n - 1].stops.length, n)
await page.evaluate(() => { window.__ride.game.getState().setAutopilot(true); window.__timeScale = 5 })
let peak = { calls: 0, tris: 0 }, result = 'TIMEOUT', last = '', same = 0, st
for (let i = 0; i < 300; i++) {
  await page.waitForTimeout(400)
  st = await page.evaluate(() => { const s = window.__ride.game.getState(); const r = window.__ride.rider; const inf = window.__ride.info(); return { phase: s.phase, n: s.collected.length, waiting: s.waiting, x: +r.pos.x.toFixed(1), z: +r.pos.z.toFixed(1), calls: inf.calls, tris: inf.triangles } })
  if (st.phase === 'island') { peak.calls = Math.max(peak.calls, st.calls); peak.tris = Math.max(peak.tris, st.tris) }
  if (st.phase === 'falling') { result = 'FELL OFF THE EDGE near ' + st.x + ',' + st.z; break }
  if (st.phase === 'ride' || st.phase === 'closing') { result = st.n === total ? 'OK' : `REACHED EXIT BUT FOUND ONLY ${st.n} OF ${total} STOPS`; break }
  const pos = `${st.x},${st.z}`
  same = pos === last && !st.waiting ? same + 1 : 0; last = pos
  if (same > 20) { result = 'STUCK at ' + pos + ` after ${st.n} of ${total} stops`; break }
}
console.log(`island ${n}: ${result} | peak draw calls ${peak.calls} (budget 200) | peak triangles ${peak.tris} (budget 90000) | errors: ${errors.slice(0, 3).join(' ; ') || 'none'}`)
await browser.close()
