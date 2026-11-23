import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npm run build` makes the normal multi-file site for Vercel.
// `SINGLE=1 npm run build` inlines everything into one HTML file for previews.
export default defineConfig({
  base: './',
  plugins: [react(), ...(process.env.SINGLE ? [viteSingleFile()] : [])],
  build: { outDir: process.env.SINGLE ? 'dist-single' : 'dist', chunkSizeWarningLimit: 2000 },
  server: { host: '127.0.0.1', port: 5173 },
})
