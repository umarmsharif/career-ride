// Checks the two filmed clips: node tools/clipcheck.mjs [phone] [shots]
// For the clip before the drive and the clip after it, on one screen size, it checks that the
// clip plays, that Skip works, and that the drive carries on when the file is missing.
import { createRequire } from 'module'
import { readFileSync } from 'fs'
const require = createRequire('/')
const { chromium } = require('playwright')
const phone = process.argv.includes('phone')
const shots = process.argv.includes('shots')
const base = process.env.URL || 'http://127.0.0.1:5173/'
const career = JSON.parse(readFileSync(new URL('../src/content/career.json', import.meta.url)))
const clips = career.clips || {}
const last = career.islands.length
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const results = []
let failed = false

async function open(path, missing) {
  const ctx = await browser.newContext(phone ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } : { viewport: { width: 1280, height: 720 } })
  const page = await ctx.newPage()
  page.errors = []
  page.on('pageerror', (e) => page.errors.push(e.message))
  if (missing) await page.route('**/' + missing.replace(/^\//, ''), (r) => r.fulfill({ status: 404, body: 'Not found' }))
  await page.goto(base + path)
  return page
}
// A real pointer press on the middle of Skip, so anything covering the button would fail the check.
async function press(page) {
  await page.waitForTimeout(600)
  const [x, y] = await page.evaluate(() => { const r = document.querySelector('.clip-over .btn').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2] })
  await (phone ? page.touchscreen.tap(x, y) : page.mouse.click(x, y))
}
// True once the clip has really moved forward, not merely been put on the page.
const playing = (page) => page.waitForFunction(() => { const v = document.querySelector('.clip-over video'); return v && !v.paused && v.currentTime > 0.6 && v.videoWidth > 0 }, null, { timeout: 8000 }).then(() => true, () => false)
// Straight after Skip the clip must be gone and the next screen up, long before the clip would have ended.
const skipped = async (page, next) => { await page.waitForTimeout(300); return page.evaluate((next) => !document.querySelector('.clip-over') && !!document.querySelector(next), next) }
const note = (name, ok, detail = '') => { results.push(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' (' + detail + ')' : ''}`); if (!ok) failed = true }
const sets = (page) => page.waitForFunction(() => window.__ride?.game?.getState().phase === 'island', null, { timeout: 60000 }).then(() => true, () => false)

async function intro() {
  if (!clips.intro) return note('intro', false, 'no intro clip is set in career.json')
  let page = await open('')
  await page.waitForSelector('.clip-over video', { timeout: 30000 })
  const ok = await playing(page)
  if (shots) await page.screenshot({ path: `docs/shots/clip-${phone ? 'phone-' : ''}intro.png` })
  const t0 = Date.now()
  const title = await page.waitForSelector('.drive-title', { timeout: 20000 }).then(() => true, () => false)
  note('intro plays, then the title', ok && title, `title ${((Date.now() - t0) / 1000).toFixed(1)}s after the check`)
  note('drive starts after the intro', await sets(page), page.errors[0] || '')
  await page.context().close()

  page = await open('')
  await page.waitForSelector('.clip-over .btn', { timeout: 30000 })
  await press(page)
  note('intro can be skipped', await skipped(page, '.drive-title'))
  await page.context().close()

  page = await open('', clips.intro)
  const t1 = Date.now()
  const gone = await page.waitForSelector('.drive-title', { timeout: 30000 }).then(() => true, () => false)
  note('drive starts when the intro file is missing', gone && (await sets(page)), `title after ${((Date.now() - t1) / 1000).toFixed(1)}s`)
  await page.context().close()
}

// Opens straight onto the last station and drives it hands-free to the closing.
async function toClosing(missing) {
  const page = await open(`?only=${last}&start=${last}`, missing)
  await sets(page)
  await page.evaluate(() => { window.__ride.game.getState().setAutopilot(true); window.__timeScale = 5 })
  for (let i = 0; i < 300; i++) {
    await page.waitForTimeout(400)
    const st = await page.evaluate(() => { const s = window.__ride.game.getState(); return { phase: s.phase, waiting: s.waiting } })
    if (st.waiting && phone) await page.tap('#ride-on').catch(() => {})
    if (st.phase === 'closing') break
  }
  await page.evaluate(() => { window.__timeScale = 1 })
  return page
}
const card = (page, ms) => page.waitForSelector('.card.closing', { timeout: ms }).then(() => true, () => false)

async function outro() {
  if (!clips.outro) return note('outro', false, 'no outro clip is set in career.json')
  let page = await toClosing()
  const shown = await page.waitForSelector('.clip-over video', { timeout: 8000 }).then(() => true, () => false)
  const ok = shown && (await playing(page))
  if (shots) await page.screenshot({ path: `docs/shots/clip-${phone ? 'phone-' : ''}outro.png` })
  note('outro plays, then the closing card', ok && (await card(page, 20000)), page.errors[0] || '')
  await page.context().close()

  page = await toClosing()
  await page.waitForSelector('.clip-over .btn', { timeout: 8000 })
  await press(page)
  note('outro can be skipped', await skipped(page, '.card.closing'))
  await page.context().close()

  page = await toClosing(clips.outro)
  note('closing card shows when the outro file is missing', await card(page, 12000))
  await page.context().close()
}

await intro()
await outro()
console.log(`clips on ${phone ? 'phone' : 'desktop'} size:\n` + results.join('\n'))
console.log(failed ? 'CLIPS FAILED' : 'CLIPS OK')
await browser.close()
process.exit(failed ? 1 : 0)
