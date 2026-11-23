# Career Ride

A 3D toy-world ride through Umar Muhammad Sharif's career: nine islands from 2004 to today,
with a plain timeline at `/cv/` for anyone who cannot or does not want to play.

## Run it

```bash
npm install
npm run dev
```

`npm run build` makes the site for Vercel in `dist/`.
`SINGLE=1 npm run build` makes one self-contained HTML file in `dist-single/`.

## Where things live

- `src/content/career.json`: every fact shown on screen. Edit text here, nowhere else.
- `src/engine/`: shared by all islands. Rider, steering, camera, pickups, gates, the road between islands.
- `src/islands/<name>/layout.js`: where things are on one island.
- `src/islands/<name>/Scenery.jsx`: what one island looks like and how it reacts to pickups.
- `src/ui/`: the cards and counters drawn over the scene.
- `src/timeline.js`: the plain timeline, used for the fallback, the Plain CV view and `/cv/`.
- `docs/stage-1/`, `docs/stage-2/`: screenshots from the reviews.

## Adding or changing an island

See `docs/ISLAND_GUIDE.md`. `node tools/tourcheck.mjs <number>` rides one island hands-free and
checks it; `node tools/story.mjs` plays the whole story.

## Performance budget per island

At most 200 draw calls and 90,000 triangles, measured with shadows on. In the last full run the
peak was 191 draw calls and 91,025 triangles (The AI Lab, in the moment the next island is also drawn).
