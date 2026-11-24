// Plays the Night Drive district hands-free from the first frame and reports what happened.
// node tools/nightrun.mjs [phone]
import { createRequire } from 'module'
const require = createRequire('/')
const { chromium } = require('playwright')
const phone = process.argv.includes('phone')
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext(phone ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } : { viewport: { width: 1280, height: 720 } })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await page.goto(process.env.URL || 'http://127.0.0.1:5173/')
await page.waitForFunction(() => window.__night, null, { timeout: 40000 })
await page.screenshot({ path: `docs/shots/nr-${phone ? 'phone-' : ''}title.png` })
// No click: the drive must start by itself.
await page.waitForFunction(() => window.__night.store.getState().phase === 'drive', null, { timeout: 60000 })
await page.evaluate(() => (window.__timeScale = 6))
let st, last = -1, same = 0, driftSeen = 0, maxSlip = 0
for (let i = 0; i < 600; i++) {
  await page.waitForTimeout(300)
  st = await page.evaluate(() => { const s = window.__night.store.getState(); const c = window.__night.car; return { phase: s.phase, n: s.collected.length, lit: s.lit, total: s.total, s: +c.s.toFixed(1), drift: +c.drift.toFixed(2), slip: +c.slip.toFixed(2), auto: s.auto } })
  if (st.drift > 0.5) driftSeen++
  maxSlip = Math.max(maxSlip, Math.abs(st.slip))
  same = st.s === last ? same + 1 : 0; last = st.s
  if (st.phase === 'done') break
  if (same > 40) break
}
await page.evaluate(() => (window.__timeScale = 4))
await page.waitForTimeout(9000)
await page.evaluate(() => (window.__timeScale = 1))
await page.waitForTimeout(1500)
await page.screenshot({ path: `docs/shots/nr-${phone ? 'phone-' : ''}end.png` })
const book = await page.getAttribute('#n-book', 'href').catch(() => null)
console.log(JSON.stringify(st), 'samples sliding', driftSeen, 'max slip (rad)', maxSlip.toFixed(2), 'book link', book, 'errors', errors.slice(0, 3))
await browser.close()
