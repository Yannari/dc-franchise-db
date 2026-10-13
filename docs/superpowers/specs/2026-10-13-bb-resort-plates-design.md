# Big Brother: the Reality Resort plates

2026-10-13. Sub-project 1 of the Big Brother overhaul ("bring Big Brother to Total Drama's level").

## The overhaul, and where this fits

The user's goal: Big Brother should look and play like the Total Drama viewer. Today it plays on 34 flat Blender
renders with portraits on a still room; Total Drama plays on 1,069 plate files cut from the show's own frames,
moving, with day and night, a game map, a living stage, deep writing and voice acting.

The overhaul, one spec each, in this order:

1. **The house in plates** (this spec).
2. **The house map as live feeds**: the resort blueprint is the map, cameras are how you enter a room.
3. **A living stage**: people at their marks, background houseguests doing things, camera shots, room sound.
4. **Writing to Total Drama depth**: arcs across weeks, inner story, runners, phrasebook, every Diary Room vote's reason.
5. **Ceremonies with game feel**: nomination keys, veto, the live eviction reading, comps on the comp field.
6. **Voice acting**: the Inworld pipeline pointed at Big Brother.

## What the user supplied

`C:\Users\yanna\Downloads\RealityResort-frames\usable\`: 64 backgrounds from *Reality Resort*, a show drawn in
Total Drama's style, cleaned of people with AI image editing (READMEs 1-3 in that folder list every edit). Most are
1920x1080; the beaches, the resort fronts, the maps, the camera close-ups and the hallway are smaller.

`...\to-edit\` holds the edits still to come, each a folder with the image to attach and its prompt:

- **A01-A14**: fixes to plates we have (widen the fronts and beaches to 16:9, a host still in the night doorway,
  names on the comp-field stones, legs under the red cart, outlines in the night forest, blur).
- **B02-B11**: rooms with no frame: HOH suite, a second bedroom, the have-not room, storage, bathroom, foyer,
  eviction interview set, premiere arrival, finale stage, finale jury bench.
- **C-themes**: six themes x nine rooms, each the SAME room and camera with only the decor changed.

The user decided: the Diary Room is the `2_confessional` couch; the green crown bedroom is the Winner's Wing and
stays a bedroom; themes redecorate, never re-lay out.

## What this spec builds

### 1. The plate list: `tools/bb-resort/plates.json`

One entry per plate, keyed by a plate id (`living-sofas`, `living-screens`, `dining-noms`, `pool-wide`...):

```json
"living-screens": {
  "src": "living-00-30-41-clean-1080p.png",
  "room": "living-room",
  "use": ["eviction", "veto", "house"],
  "indoor": true,
  "night": "relight",
  "motion": { "glow": [[...]], "cloth": [[...]], "pool": [[...]], "sway": [[...]] },
  "lights": [[x, y, r], ...],
  "windows": [[x0, y0, x1, y1], ...],
  "screens": [[x0, y0, x1, y1], ...],
  "floor": [y0, y1],
  "block": [[x0, y0, x1, y1], ...],
  "anchors": { "...": "see 4" }
}
```

Coordinates are in the 1920x1080 frame. The motion vocabulary is Total Drama's `places.json` vocabulary unchanged
(`sway`, `cloth`, `pool`, `fall`, `glow`, `bob`, `still`, `flutter`, `wind`), so `glplate.js` animates these plates
with no shader change. New keys, BB only: `lights` (lamps that glow at night), `windows` (glass that goes dark at
night), `screens` (TV and memory-wall rectangles the viewer draws on), `floor` and `block` (where people may stand,
for sub-project 3), `anchors` (seats for the ceremonies).

### 2. The build: `tools/bb-resort/build.py`

Reuses `tools/td-camp/clean.py` (`sharpen_4k` through Real-ESRGAN anime x4, `motion_map`, `sky_of`) and
`tools/td-camp/nightify.py` (`night_sky`), imported, not copied. No people cutting: the user's plates are clean.

Per plate it writes to `assets/sets/bb/resort/<theme>/`:

| File | What |
|---|---|
| `<id>-day.webp` / `-day-hd.webp` | 1920 and 3840 wide; frames under 3000 px go through ESRGAN first |
| `<id>-night.webp` / `-night-hd.webp` | the night version (below) |
| `<id>-day-motion.webp` / `-night-motion.webp` | the motion map `glplate.js` reads |
| `<id>-water.webp` | the pool or sea mask, where there is water |
| `<id>.json` | the marks: floor, blocks, screens, anchors, lights |

`<theme>` is `default` for the user's plates and the theme folder (`temptation`, `machine`, `mystery`,
`high-rollers`, `summer-camp`, `summer-school`, the names `SEASON_DIR` in `vp-bb-ep/stage.js` already uses) for a
redecorated plate. A themed plate is built with the default plate's `plates.json` entry: the themes keep the
layout, so the marks are shared. A frame that is wider than 16:9 (the beaches until A03-A05 come back) is
centre-cropped by `crop_169`.

Run: `python tools/bb-resort/build.py [ids|all] [--theme <t>]`. Like `nightify.py`, it never overwrites a plate
the user handed over.

### 3. Night

Every plate gets a night version, as a baked frame and never a shader grade alone, because a lamp must come on:

- **Outdoors** (pool, patio, beaches, front, comp field, lawn): `nightify.py`'s recipe. The land is darkened and
  cooled, the sky becomes a night sky with stars and a moon, and warm bright pixels stay lit. On top of that, pool
  water gets an underwater glow, and the string lights and the RR sign light up (`lights`).
- **Indoors**: the room is darkened and warmed, not cooled (a lit house at night). The `windows` turn to night
  sky, and each `lights` point casts a soft warm pool on the wall and floor. TV `screens` keep their colour.

Where the user has a real night frame (`Resort_front.webp`, the night forest), it is used as the night version and
nothing is generated.

### 4. Seats for the ceremonies: anchors

The ceremonies place people at Blender anchors (`js/vp-bb-ep/anchors.js`): `ceremony` / `ceremony3` (nominee chairs
`N-1 N0 N1`, the house on the sofas `L0-L3 R0-R3`, `stand`, the memory-wall `panels`), `dining` (seats `S0-S7`,
`head`, the key `box`, the nominations `screen`), `studio` (`G`, `H`), `finale` (`F0 F1`, jurors `J0-J9`, `box`, `H`,
`D0 D1`, `slot`). Each plate that hosts a ceremony authors the same keys in `plates.json` (`at: [x%, y%, z]`, `w`,
measured on the plate, with z the depth order the stage already uses). `build.py` writes them into
`js/vp-bb-ep/anchors-resort.js`, the same shape as `anchors.js`. The stage reads the resort anchors when the set
comes from a plate, and the Blender anchors otherwise.

Every anchor is checked by an overlay image (`build.py --marks`): the plate with every seat, stand, screen and block
drawn on it, read by eye before it ships.

### 5. Which plate plays which room

The engine has eight rooms (`BB_ROOMS`: hoh-room, living-room, kitchen, backyard, bedroom, pantry, washroom,
diary-room), and the stage has sets (`ROOM_SET` in `steps.js`). Each set gets a list of plates. A scene takes one
plate deterministically (a hash of the scene id), and a plate whose `use` names the scene's moment wins. A line
that names a place ("by the pool", "in the gym") picks that plate. The rule from Total Drama's `stageSpot` still
holds: the place the lines name always wins.

| Set / moment | Plates (default theme) |
|---|---|
| `ceremony`, eviction night | `living-screens`. The host appears on the big teal screen |
| `ceremony`, veto meeting and house scenes | `living-sofas`, `living-reverse`, `living-console` |
| `ceremony`, quiet talk in the living room | + `library-wide`, `library-couch` |
| `dining`, nominations | `dining-noms` (empty table) |
| `dining`, meals | `dining-breakfast` and the other set-table angles |
| `kitchen` | `kitchen-wide`, `kitchen-stove` |
| `bedroom` | `bedroom-wide`, `bedroom-beds`, `bedroom-sofa`, + B03 |
| `yard` (backyard) | `pool-wide`, `pool-deck`, `pool-loungers`, `patio`, `bar-lobby`, `beach-bar`, `gym`, `gym-bench` |
| `dr` (Diary Room) | `confessional` |
| `bathroom` | `hallway-bathroom`, + B06 |
| `storage` | B05 |
| `havenot` | B04 |
| `hoh` | B02 |
| `juryhouse` | `beach-hut`, `beach-volcano`, `beach-arch`, `dock` |
| `studio` (eviction interview) | B08 |
| `finale` | B10 stage + B11 jury bench |
| `door`, premiere | B09 arrival, B07 foyer |
| memory wall | `memory-wall`: 16 slots. A cast over 16 keeps the current HTML wall |
| cutaways | the four camera close-ups, the resort fronts, the island map |

Any set with no plate yet (B02-B11 before the user's edits arrive) keeps its Blender render and its Blender
anchors. Nothing is lost while the edits are pending. The comp arenas stay on their Blender renders in this spec;
the comp field joins in sub-project 5.

### 6. The viewer

- `vp-bb-ep/stage.js`: `setDiv` paints the plate (`<id>-day|night.webp`, the hour from the scene clock that
  `steps.js` already computes, night from 20:00 to 06:00) with a `glplate` canvas over it. `glplate.js` is imported
  from `../vp-td-ep/glplate.js` as it is.
- Themes: `SEASON_DIR[theme]/<id>` if that plate exists (a manifest written by `build.py`,
  `assets/sets/bb/resort/manifest.json`), else `default/<id>`. A themed season never cuts to a close-up angle that
  has no themed version (see the user's decision above); it uses the room's themed hero angle instead.
- Cache: the plate URLs carry the manifest's version, so a rebuilt plate is never shown stale (the `V` constant
  lesson).

## Testing

- `tests/bb-resort-plates.test.js`:
  - every `plates.json` entry has a source and a room;
  - every set in `ROOM_SET` has a plate or a Blender fallback;
  - every ceremony plate has every anchor key its ceremony reads;
  - every `use` names a real moment;
  - every manifest file exists on disk.
- Overlay images (`--marks`) read by eye for every plate with anchors.
- Play one real-roster season in Chromium (the zz-twistplay pattern). Step every screen of week 1, an eviction
  night, a nomination ceremony, the jury house and the finale. Screenshot at day and night, and fix any page error.
- A default-theme season and one themed season, read side by side.

## Out of scope

The map, people at marks and background activity (sub-projects 2-3), comp arenas, sound. The user makes the
themed and missing-room edits; this spec builds whatever exists and falls back for the rest.
