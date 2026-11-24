# How to build an island

Every island is a folder in `src/islands/<folder>/` with an `index.js` that exports two things:

```js
export const island = defineIsland({ ...where things are... })
export { Scenery }   // a React component: ({ island }) => JSX
```

Read `src/islands/kitchenStreet/` first. It is the quality reference: `index.js`, `layout.js`, `Scenery.jsx`.

## Rules

- **Facts come only from `src/content/career.json`.** `defineIsland` pulls them in by `id`. Never type a role, date, number or company description into scenery or layout. Short generic labels on props are fine.
- **Do not draw company logos.** The engine puts the company name on one rooftop board (`brandSign`) and dresses the rider in the company's colours. Scenery keeps the warm toy palette.
- **Everything is drawn in code** from simple shapes. No model files, no image files, no audio files.
- **The land has hills.** Each island sets a `terrain` function (see Terrain below). The rider can go anywhere on the land that is not blocked by a collider. A building or pond you do not want ridden through needs a collider.
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
| `terrain` | `(x, z) => height`. See Terrain below. Leave out for flat land. |
| `brandSign` | `{ x, z, y, face, scale }` for the company-name board. `y` is the height of the board's centre above the ground at that spot. Put it on top of the island's main building. At `face: 0` the front faces +z; `face: -Math.PI / 2` faces a rider arriving from the west. |
| `profileStand` | `{ x, z }` of the stand holding the company profile folder. Default: 3 units from `signView` towards the signboard. The hands-free tour must pass within 3.5 of it. |
| `diagrams` | Island 8 only. One array of short step labels per machine, or `null`. |
| `last`, `finish` | Island 9 only. `last: true` and `finish: { x, z, radius }` for the spot that ends the ride. |

The returned `island` has `outline`, `road`, `stops`, `colliders`, `len`, `data` and more; Scenery receives it as a prop.

## Terrain

`engine/terrain.js` has the helpers. Heights are in the same units as everything else; the island's own zero is the height at its entrance.

```js
import { profile, mound, band } from '../../engine/terrain.js'
const rise = profile([[-47, 0], [-26, 0], [-12, 3], [2, 3], [14, 6], [47, 6]])   // heights along x
const knoll = mound(10, -14, 9, 4, 3)    // centre x, centre z, radius, height, flat-top radius
terrain: (x, z) => rise(x) + knoll(x, z)
```

The engine samples the function on a 2-unit grid and draws exactly that surface. `island.h(x, z)` returns the height of the drawn surface at any spot.

**You do not place things on the ground yourself.** The engine does it for all scenery:

- Inside a `<Static>` kit mesh, each part is raised by the ground height under it: under the origin of its outermost `k.at(...)` group, or under its own centre if it is not in a group. Low thin parts (roads from `ribbonXZ`, paths, markings, flat discs) follow the surface point by point.
- Every other object in your Scenery (any mesh or group with its own position, including ones you move every frame) is raised by the ground height at its current position, automatically.

What this means for the terrain you choose:

- **Big flat things need flat ground.** A building, plaza, pond, runway or platform wider than about 5 units must sit where the terrain is level, or it will float at one end and sink at the other. Put the slopes between features.
- Keep the road's slope gentle: at most about 1 up for every 3.5 along. Keep the ground level across the road's width, and level for 6 units around each gate, each stop, the signboard and the profile stand.
- The automatic placing cannot help: an `instancedMesh` whose instances are spread over the island (add `island.h(x, z)` to each instance's y yourself), and a hand-built geometry with island coordinates baked in that is not from `ribbonXZ`. Set `userData={{ noLift: true }}` on an object to opt it out and place it yourself.

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

saves `docs/shots/island4-a.png`. Add `window.__ride.game.setState({ signRead: { 4: true }, profiles: [4] });` at the start of the script to skip the profile pickup that otherwise runs near the entrance. `teleport(x, z, heading)` moves the rider (heading 1.57 faces east); `collect(islandId, stopIndex)` finds a stop. Look at your screenshots and fix what looks wrong: props floating or buried, anything on the road, the rider hidden, colours that clash with Food Delivery Street's warm toy palette.
