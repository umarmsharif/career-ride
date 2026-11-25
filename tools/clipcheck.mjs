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
  await watch(page)
  await page.goto(base + path)
  return page
}
// A real pointer press on the middle of Skip, so anything covering the button would fail the check.
async function press(page) {
  const at = await page.evaluate(() => { const r = document.querySelector('.clip-over .btn')?.getBoundingClientRect(); return r && [r.x + r.width / 2, r.y + r.height / 2] })
  if (!at) return false
  await (phone ? page.touchscreen.tap(at[0], at[1]) : page.mouse.click(at[0], at[1]))
  return true
}
// The page itself notes how far each clip got, so a short clip cannot slip past between two looks.
const watch = (page) => page.addInitScript(() => { window.__clip = { t: 0, w: 0 }; document.addEventListener('timeupdate', (e) => { const v = e.target; if (v.closest?.('.clip-over')) { window.__clip.t = Math.max(window.__clip.t, v.currentTime); window.__clip.w = v.videoWidth } }, true) })
// True once the clip has really moved forward, not merely been put on the page.
const playing = (page) => page.waitForFunction(() => window.__clip.t > 0.6 && window.__clip.w > 0, null, { timeout: 8000 }).then(() => true, () => false)
// Straight after Skip the clip must be gone and the next screen up, long before the clip would have ended.
const skipped = async (page, next) => { await page.waitForTimeout(300); return page.evaluate((next) => !document.querySelector('.clip-over') && !!document.querySelector(next), next) }
const note = (name, ok, detail = '') => { results.push(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' (' + detail + ')' : ''}`); if (!ok) failed = true }
const sets = (page) => page.waitForFunction(() => window.__ride?.game?.getState().phase === 'island', null, { timeout: 60000 }).then(() => true, () => false)

async function intro() {
  if (!clips.intro) return note('no opening clip is set, so none is checked', true)
  let page = await open('')
  await page.waitForSelector('.clip-over video', { timeout: 30000 })
  const ok = await playing(page)
  if (shots) await page.screenshot({ path: `docs/shots/clip-${phone ? 'phone-' : ''}intro.png` })
  const t0 = Date.now()
  // The title is only up for a moment, so on a slow machine the drive may already have set off.
  const title = await page.waitForFunction(() => !document.querySelector('.clip-over') && (document.querySelector('.drive-title') || window.__ride?.game?.getState().phase === 'island'), null, { timeout: 20000 }).then(() => true, () => false)
  note('intro plays, then the title', ok && title, `title ${((Date.now() - t0) / 1000).toFixed(1)}s after the check`)
  note('drive starts after the intro', await sets(page), page.errors[0] || '')
  await page.context().close()

  // A short clip can finish on a slow machine before Skip is reached; that try is repeated, not failed.
  let did = null
  for (let i = 0; i < 4 && did === null; i++) {
    page = await open('')
    await page.waitForSelector('.clip-over .btn', { timeout: 30000 }).catch(() => {})
    if (await press(page)) did = await skipped(page, '.drive-title')
    await page.context().close()
  }
  note('intro can be skipped', did === true, did === null ? 'the clip ended before Skip could be pressed, four times' : '')

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
  let page = await toClosing(), did
  const shown = await page.waitForSelector('.clip-over video', { timeout: 8000 }).then(() => true, () => false)
  const ok = shown && (await playing(page))
  if (shots) await page.screenshot({ path: `docs/shots/clip-${phone ? 'phone-' : ''}outro.png` })
  note('outro plays, then the closing card', ok && (await card(page, 20000)), page.errors[0] || '')
  await page.context().close()

  did = null
  for (let i = 0; i < 3 && did === null; i++) {
    page = await toClosing()
    await page.waitForSelector('.clip-over .btn', { timeout: 8000 }).catch(() => {})
    if (await press(page)) did = await skipped(page, '.card.closing')
    await page.context().close()
  }
  note('outro can be skipped', did === true, did === null ? 'the clip ended before Skip could be pressed, three times' : '')

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
