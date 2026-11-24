// Screenshots of Night Drive: node tools/nightshot.mjs <name> <width> <height> "<js to run>" [waitMs] [touch]
import { createRequire } from 'module'
const require = createRequire('/')
const { chromium } = require('playwright')
const [name, w = '1280', h = '720', script = '', wait = '1500', touch = ''] = process.argv.slice(2)
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, hasTouch: !!touch, isMobile: !!touch })
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message))
await page.goto(process.env.URL || 'http://127.0.0.1:5173/', { waitUntil: 'load' })
await page.waitForFunction(() => window.__night, null, { timeout: 40000 })
if (script) {
  const out = await page.evaluate(async (src) => await new Function('return (async()=>{' + src + '})()')(), script)
  if (out !== undefined) console.log('result:', JSON.stringify(out))
}
await page.waitForTimeout(+wait)
await page.screenshot({ path: `docs/shots/${name}.png` })
console.log(name, JSON.stringify(await page.evaluate(() => ({ phase: window.__night.store.getState().phase, s: +window.__night.car.s.toFixed(0), lit: window.__night.store.getState().lit, total: window.__night.store.getState().total, n: window.__night.store.getState().collected.length }))), errors.slice(0, 5).join(' | '))
await browser.close()
