// Screenshot helper: node tools/shot.mjs <name> <width> <height> "<js to run in page>" [waitMs]
import { createRequire } from 'module'
const require = createRequire('/')
let chromium
try { ({ chromium } = require('playwright')) } catch { ({ chromium } = await import('playwright')) }
const [name, w = '1280', h = '720', script = '', wait = '1500', touch = ''] = process.argv.slice(2)
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] })
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, hasTouch: !!touch, isMobile: !!touch })
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message))
await page.goto(process.env.URL || 'http://127.0.0.1:5173/', { waitUntil: 'load' })
await page.waitForTimeout(2500)
if (script) {
  const out = await page.evaluate(async (src) => { const fn = new Function('return (async()=>{' + src + '})()'); return await fn() }, script)
  if (out !== undefined) console.log('result:', JSON.stringify(out))
}
await page.waitForTimeout(+wait)
await page.screenshot({ path: `docs/shots/${name}.png` })
const info = await page.evaluate(() => window.__ride?.info?.())
console.log(name, JSON.stringify(info), errors.slice(0, 6).join(' | '))
await browser.close()
