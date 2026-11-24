// Frames of the company-profile pickup, and of the sky at several times of day.
import { createRequire } from 'module'
const require = createRequire('/')
const { chromium } = require('playwright')
const n = +(process.argv[2] || 1)
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const page = await (await browser.newContext({ viewport: { width: 1000, height: 600 } })).newPage()
page.on('pageerror', (e) => console.log('ERR', e.message))
await page.goto(`http://127.0.0.1:5173/?only=${n}&start=${n}`)
await page.waitForFunction(() => window.__ride?.game?.getState().phase === 'island', null, { timeout: 40000 })
await page.waitForTimeout(1500)
await page.evaluate(() => window.__ride.game.getState().setAutopilot(true))
let i = 0
for (let k = 0; k < 60 && i < 9; k++) {
  await page.waitForTimeout(250)
  const act = await page.evaluate(() => window.__ride.rider.act?.t ?? -1)
  if (act >= 0 || i > 0) { await page.screenshot({ path: `docs/shots/act-${n}-${i++}.png` }) ; await page.waitForTimeout(300) }
}
console.log('frames', i, await page.evaluate(() => JSON.stringify({ p: window.__ride.game.getState().profiles, w: window.__ride.game.getState().waiting })))
await browser.close()
