# Career Ride

A 3D toy-world ride through Umar Muhammad Sharif's career. Stage 1 contains one island
(Kitchen Street, the Foodpanda years), the rider, and the road out to a stub of the next island.

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
- `docs/stage-1/`: screenshots from the Stage 1 review.

## Performance budget per island

Set in Stage 1 from Kitchen Street, measured with shadows on:

- at most 200 draw calls
- at most 90,000 triangles

Kitchen Street peaks at 181 draw calls and about 73,000 triangles.
