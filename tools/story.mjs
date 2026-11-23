// Plays the whole story hands-free and reports what happened on each island.
// node tools/story.mjs [phone] [shots]
import { createRequire } from 'module'
const require = createRequire('/')
const { chromium } = require('playwright')
const phone = process.argv.includes('phone')
const shots = process.argv.includes('shots')
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext(phone ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } : { viewport: { width: 1280, height: 720 } })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await page.goto(process.env.URL || 'http://127.0.0.1:5173/')
await page.waitForSelector('#start-story', { timeout: 30000 })
await page.waitForTimeout(1500)
if (shots) await page.screenshot({ path: `docs/shots/s2-${phone ? 'phone-' : ''}start.png` })
if (phone) await page.tap('#start-story'); else await page.click('#start-auto')
await page.evaluate(() => { window.__timeScale = 5 })
const seen = {}
let maxCalls = 0, maxTris = 0, lastIsland = -1, stuckAt = null, lastPos = '', same = 0
for (let i = 0; i < 900; i++) {
  await page.waitForTimeout(400)
  const st = await page.evaluate(() => { const s = window.__ride.game.getState(); const r = window.__ride.rider; const inf = window.__ride.info(); return { phase: s.phase, island: s.island, waiting: s.waiting, n: s.collected.length, x: +r.pos.x.toFixed(1), z: +r.pos.z.toFixed(1), calls: inf.calls, tris: inf.triangles } })
  maxCalls = Math.max(maxCalls, st.calls); maxTris = Math.max(maxTris, st.tris)
  const b = (seen[st.island] ||= { calls: 0, tris: 0 }); b.calls = Math.max(b.calls, st.calls); b.tris = Math.max(b.tris, st.tris); b.n = st.n
  if (st.island !== lastIsland) { lastIsland = st.island; if (shots) { await page.evaluate(() => { window.__timeScale = 1 }); await page.waitForTimeout(1200); await page.screenshot({ path: `docs/shots/s2-${phone ? 'phone-' : ''}island-${st.island + 1}.png` }); await page.evaluate(() => { window.__timeScale = 5 }) } }
  if (st.waiting && phone) await page.tap('#ride-on').catch(() => {})
  const pos = `${st.phase}:${st.x},${st.z}`
  same = pos === lastPos && !st.waiting ? same + 1 : 0; lastPos = pos
  if (same > 25 && st.phase === 'island') { stuckAt = st; break }
  if (st.phase === 'closing') { await page.evaluate(() => { window.__timeScale = 1 }); await page.waitForTimeout(2500); if (shots) await page.screenshot({ path: `docs/shots/s2-${phone ? 'phone-' : ''}closing.png` }); console.log('REACHED CLOSING', JSON.stringify(st)); break }
}
console.log(JSON.stringify(seen))
console.log('peak calls', maxCalls, 'peak triangles', maxTris, 'stuck', JSON.stringify(stuckAt), 'errors', errors.slice(0, 4))
await browser.close()
