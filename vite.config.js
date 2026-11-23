import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { timelineHtml, timelineCss } from './src/timeline.js'

// Writes the career timeline as real HTML: a /cv/ page and a <noscript> block on the home page,
// so search engines and link previews can read the content without running the 3D scene.
function staticTimeline() {
  const page = () => `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Umar Muhammad Sharif: career timeline</title>
<meta name="description" content="Career timeline of Umar Muhammad Sharif, from software engineering in 2004 to AI training today.">
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@500;700;800&display=swap" rel="stylesheet">
<style>body{margin:0;background:#d6f1fb}${timelineCss}.back{display:inline-block;margin-bottom:10px;font-weight:800}</style></head>
<body><div class="tl" style="padding-block:20px 0"><a class="back" href="../">Play the ride</a></div>${timelineHtml()}</body></html>`
  return {
    name: 'static-timeline',
    transformIndexHtml(html) {
      return html.replace('<div id="root"></div>', `<div id="root"></div>\n    <noscript><style>${timelineCss}</style>${timelineHtml()}</noscript>`)
    },
    generateBundle() {
      if (!process.env.SINGLE) this.emitFile({ type: 'asset', fileName: 'cv/index.html', source: page() })
    },
  }
}

// `npm run build` makes the normal multi-file site for Vercel.
// `SINGLE=1 npm run build` inlines everything into one HTML file for previews.
export default defineConfig({
  base: './',
  plugins: [react(), staticTimeline(), ...(process.env.SINGLE ? [viteSingleFile()] : [])],
  build: { outDir: process.env.SINGLE ? 'dist-single' : 'dist', chunkSizeWarningLimit: 2000 },
  server: { host: '127.0.0.1', port: 5173 },
})
