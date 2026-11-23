# How to build an island

Every island is a folder in `src/islands/<folder>/` with an `index.js` that exports two things:

```js
export const island = defineIsland({ ...where things are... })
export { Scenery }   // a React component: ({ island }) => JSX
```

Read `src/islands/kitchenStreet/` first. It is the quality reference: `index.js`, `layout.js`, `Scenery.jsx`.

## Rules

- **Facts come only from `src/content/career.json`.** `defineIsland` pulls them in by `id`. Never type a role, date, number or company description into scenery or layout. Short generic labels on props are fine.
- **No company logos, wordmarks or brand colours.** Evoke the industry.
- **Everything is drawn in code** from simple shapes. No model files, no image files, no audio files.
- **The land is flat** (y = 0). The rider can go anywhere on the land that is not blocked by a collider. A hill, building or pond you do not want ridden through needs a collider.
- **Budget per island:** at most 200 draw calls and 90,000 triangles with shadows on. Put all static props into one `<Static build={(k) => ...} />` mesh. Only parts that animate get their own mesh.
- Only edit files inside your own island folder.

## defineIsland(spec)

Coordinates are `[x, z]`. The road runs west to east: the entrance gate is at `x = -(len - 5)`, the exit gate at `x = len - 4`, the rider spawns just inside the entrance. `+x` is east, `+z` is south on screen when riding east (the rider's right).

| Field | Meaning |
|---|---|
| `id` | Island number in `career.json` (1 to 9). |
| `len`, `wid`, `neck` | Half length (default 47), half width (default 21.5), and how much the middle pinches in (default 0). Keep `len` between 40 and 50. |
| `road` | Points from `[-len, 0]` to `[len, 0]`. Keep it gentle. It must pass through both gates at `z = 0`. |
| `stops` | One `[x, z]` per item in `career.json`, in the same order. Put them on or near the road, at least 9 apart, at least 8 from either gate. |
| `sign` | `{ x, z, face }` for the signboard. Default is beside the entrance. |
| `colliders` | `{ x, z, r, h }` circles for anything solid. `h` is its height, used by the camera. |
| `tour` | Points the hands-free ride follows, from the spawn to `[exitGate.x + 2.5, 0]`. It must pass within 1.5 of every stop and stay clear of colliders. If you leave it out, it goes straight from stop to stop in x order. |
| `signStop` | Index in `tour` where the hands-free ride pauses to read the signboard (default 1). |
| `banners` | `{ x, z, face, district }` roadside name boards for districts. |
| `grass`, `land` | Colours of the ground and the island's underside. |
| `ride` | `{ dy, dz, style }` for the road to the next island. Style is `spiral`, `wave` or `dive`. Keep `dy` within plus or minus 12 and `dz` within plus or minus 50. |
| `diagrams` | Island 8 only. One array of short step labels per machine, or `null`. |
| `last`, `finish` | Island 9 only. `last: true` and `finish: { x, z, radius }` for the spot that ends the ride. |

The returned `island` has `outline`, `road`, `stops`, `colliders`, `len`, `data` and more; Scenery receives it as a prop.

## Drawing scenery

`Static` (from `engine/IslandParts.jsx`) gives you a `Kit` (`engine/kit.js`). Each call adds a coloured shape to one merged mesh:

- `k.box(w, h, d, color, { p, r, s })`, `k.cyl(rTop, rBottom, h, color, t, segments)`, `k.cone(r, h, color, t, segments)`, `k.ball(r, color, t, detail)`, `k.disc(r, color, t)`, `k.roof(w, h, d, color, t)`
- `k.at({ p, r, s }, () => { ... })` places a group of shapes together.
- `k.add(geometry, color, t)` for any three.js geometry, for example `ribbonXZ(points, width, y)`.

`engine/props.js` has `baseRoad`, `scatter`, `clearance`, `tree`, `beam`, `stripes` and the shared colours. `textTexture` in `engine/kit.js` draws short text for a sign.

## Reacting to stops

Each stop should make something happen on the island that illustrates its fact. Use `sinceOf(id)` from `engine/state.js`:

```js
const since = sinceOf(4)        // island id
useFrame(() => {
  const s = since(2)            // seconds since stop index 2 was found, or -1
  ...
})
```

Use `clock.t` from `engine/state.js` for time, never `Date.now()`.

## Checking your work

The dev server is already running on port 5173. Do not start another.

```bash
node tools/tourcheck.mjs 4
```

rides island 4 hands-free and must print `OK`, with draw calls and triangles under budget and no errors.

```bash
URL='http://127.0.0.1:5173/?only=4&start=4' node tools/shot.mjs island4-a 1280 720 "window.__ride.teleport(-20, 0, 1.57); window.__ride.game.getState().collect(4, 0);" 3000
```

saves `docs/shots/island4-a.png`. `teleport(x, z, heading)` moves the rider (heading 1.57 faces east); `collect(islandId, stopIndex)` finds a stop. Look at your screenshots and fix what looks wrong: props floating or buried, anything on the road, the rider hidden, colours that clash with Kitchen Street's warm toy palette.
