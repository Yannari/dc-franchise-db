# Camp Castaways — Overdrive Design Spec

**Date:** 2026-04-18 (v2 — castaway-truthful rewrite)
**Status:** Design only. No implementation. Pick a direction before writing code.
**Problem with current VP:** it's handsome but generic. Three themed card stacks (surveillance / diary / broadcast) don't read as **marooned**. A player looking at it sees text blocks in palettes, not someone washed ashore. The "castaway" metaphor is in the title and the prose — nowhere in the pixels.

**Goal of overdrive:** the VP should *look like it washed up on a beach*. Sun-bleached, salt-stained, hand-lashed, improvised. The user should feel like they are reading recovered artifacts — not browsing a dashboard.

Three directions. Each is castaway-truthful in a different register. Pick one; don't blend. All three assume the v2 audit Layer-1' cleanup (`2026-04-17-camp-castaways-audit-v2.md §7`) ships first — the duplicate winner-reveal and tape-numbering bugs must be fixed before any polish.

---

## Direction A — The Castaway's Journal

**Core move:** the entire VP becomes a single **leather-bound survival journal** recovered from the island. Every phase is a page spread. The user turns pages.

### The artifact
- Centered on a sandy-burlap background: a **6:5 aspect journal**, leather cover with strap, stitched binding down the center gutter, deckle-edged aged paper.
- Cover: "CAMP CASTAWAYS — DAY 1" embossed, burn mark in corner, dried seaweed pressed under the strap.
- Left and right pages visible simultaneously. Page turn = phase advance.
- **Paper texture** is a real asset (SVG + displacement filter, or a layered PNG). Stains: coffee ring, water damage, smudged ink at bottom of some pages, a dead mosquito flattened on page 3.
- **Handwritten typography:** use a single humanist script face (e.g. Caveat, Shadows Into Light). Chris's commentary is in a separate, blockier marker-pen face — he scribbled on the recovered journal before handing it back.

### Content as artifacts
Each beat is not a text block — it's a **physical object pinned to the page**:
- **Diary entry:** handwritten paragraph, ink bleed at line starts, a few words crossed out with scribbles.
- **Polaroid:** portrait pinned with a tiny piece of washi tape; caption below in pencil ("Kristoff — day 2, still mad about the raft"). Rotation ±3° random.
- **Pressed specimen:** a dried leaf / feather / shell taped to the page, with a label.
- **Sketch:** a hand-drawn map fragment, compass rose in ink, dotted trail.
- **Field note / tide table:** grid-ruled with messy numeric entries.

### Phase-driven page mutations
- **Phase 0 (Flood):** opening splash — the book is closed, wet. A drop of water falls and hits the cover. The strap unbuckles. The book opens to page 1. Water stains fade in on the paper as the phase narrates the flood.
- **Phase 1 (Scattered):** a hand-drawn island map occupies the left page. Group portraits pinned at their landing spots with short yarn lines connecting the group members. Right page: scribbled first-day entries per group, ink still wet (glossy gradient).
- **Phase 2 (Night):** pages darken. A taped-on Polaroid of the campfire glows on the right. The Mr. Coconut breakdown is rendered as **a child-like drawing** of the player and the object holding hands, in crayon, with a heart. Handwriting gets shakier (slight per-character rotation jitter).
- **Phase 3 (Regroup):** the map reappears, now with yarn paths connecting groups that converged. Photographs are stacked on top of earlier pins (slight depth shadow). Margin doodles appear: arrows, question marks, names circled.
- **Phase 4 (Storm & Discovery):** page edges burn inward (SVG mask animation). The right page is a **torn-out diary entry** pinned by Chris's red marker with "CLASSIFIED — DO NOT PUBLISH" stamped across it. The playback beats are drawn as comic panels.
- **Phase 5 (Immunity):** final page is a **wax-sealed letter**. Breaking the seal (click) unfurls: winner's portrait inside a laurel wreath, handwritten "VICTOR: [name]". A pressed flower next to the name. Runner-up portraits are pinned along the margin with smaller captions.

### Page-turn mechanic
- Click right page edge or press → page flexes, lifts, rotates around the gutter (CSS `transform-origin: center left` + perspective + `rotateY`). Back of page shows bleed-through ink in mirror image. Duration ~700ms with ease-out. Reduced-motion: instant swap.
- Progress indicator: a tiny ribbon bookmark hanging from the top of the book, with phase label embroidered on it.

### Techniques
- **CSS 3D** (`perspective`, `rotateY`, `transform-style: preserve-3d`) for page turn.
- **SVG filter chain** (`feTurbulence` + `feDisplacementMap` + `feColorMatrix`) for paper fiber / wet-stain / ink-bleed effects. Animatable via `@property`.
- **`@property --paper-wetness`, `--ink-age`, `--sun-bleach`** — registered custom props driving saturation / blur / hue across phases so the book visibly ages as the story progresses.
- **Hand-drawn assets:** map silhouettes, compass, wax seal, ribbon bookmark — one-time SVG illustrations (~6 artifacts total).
- **View Transitions API** for page-to-page morph where a pinned photo persists across pages.

### "Wow" moment
The page turn itself, reinforced by the fact that **a pinned Polaroid of a player persists across the turn** — it stays in the camera view while the page rotates around it, then re-pins on the new page. Users realize this isn't a card stack; it's one continuous artifact.

### Cost
~2 days. Asset creation (SVG illustrations + paper textures) is the long pole. Implementation is CSS-heavy, JS-light.

### Trade-off
Commits hard to a single metaphor. The three-mode identity (surveillance / diary / broadcast) collapses into *one voice* — the journal. Chris's surveillance becomes his red-marker scribbles on the paper; the broadcast becomes torn-out pages stamped by the production team. Cleaner, but less variety.

---

## Direction B — Driftwood Shore

**Core move:** the VP **is the beach.** There is no card, no panel, no window. Content washes in on the tide, sits on the sand, gets stacked with driftwood, and washes out between phases.

### The scene
- Full-viewport SVG/CSS beach: sand in foreground (noise-textured, warm tone), wet sand line with a subtle sheen, ocean horizon at mid-height, sky gradient above. Parallax layers.
- Ambient: gentle sand-grain drift (Canvas 2D particles ~40 grains, low opacity), subtle heat-shimmer on the horizon (SVG displacement), seagull silhouettes every ~15s.
- **Day / night cycle:** sun position and sky gradient tied to phase via `@property --sun-angle` (0→180°). Phase 2 brings stars (SVG + twinkle), moon, bioluminescent tide.

### Content as washed-up artifacts
Every beat is an **object on the sand**, not a card:
- **Diary beats** = torn paper scraps half-buried in sand, weighted with a shell. Text is handwritten; edges are jagged.
- **Group events** = clusters of footprints in the sand leading to a small driftwood-and-rope shelter. Click the shelter to read the group's events.
- **Mr. Coconut breakdown** = an actual coconut sitting on the sand next to the player's footprint trail, with a face drawn on it in charcoal. A small dialogue bubble floats from the coconut.
- **Surveillance beats (Chris)** = a hidden camera tangled in a palm frond at the top of the screen, with a red blinking LED. Click → a grainy thumbnail unfolds with Chris's caption.
- **Chris's camp discovery (Phase 4)** = the camera fronds rustle aside revealing a full production tent behind the palm line. The reveal is a curtain-pull.
- **Winner (Phase 5)** = an SOS built from rocks on the sand gets kicked apart by the winner's shadow; replaced by their name written in the sand by an invisible finger (stroke-dashoffset).

### Tide-based phase transitions
The phase boundary **is a wave**. A wave rolls in from the horizon, covers the current artifacts, recedes — and new artifacts are on the sand. Old artifacts are gone (washed away) or left as weathered residue.
- Wave motion: SVG path morph + foam particle spray (Canvas 2D).
- Residue: some objects persist — e.g. a pinned Polaroid buried in sand from Phase 1 is still partially visible in Phase 3 with more sand over it.
- Sound (opt-in only): faint wave crash at each phase transition.

### Castaway UI chrome
- No traditional phase nav. Instead, a **row of driftwood sticks** lashed with rope at the top, each burned with a phase name. Current phase's stick is burned darker / has a rope flag on it.
- "Next phase" = a conch shell icon bottom-right. Click → the wave rolls.
- "Search" = a hand-lens magnifier cursor when hovering the beach; scanning reveals hidden artifacts buried in the sand (faint rectangles that brighten on hover).

### Techniques
- **Canvas 2D** for particle systems (sand drift, foam, rain, stars). OffscreenCanvas if perf demands.
- **SVG** for the scene, wave path morphs, all artifacts.
- **`@property`** for `--sun-angle`, `--tide-level`, `--fog-density`, `--wind-strength` — all shared across the scene so ambient is coherent.
- **View Transitions API** for the wave-wipe between phases.
- **`animation-timeline: scroll()`** (with static fallback) for subtle parallax as the user scrolls within a phase's content.
- **WebGL shader** (optional stretch): ocean surface with simulated wave refraction. Falls back to looping SVG path.

### "Wow" moment
The **tide transition.** A wave rolls in, covers the scene, recedes — and the entire page content has changed. It's a page transition that *belongs to the setting*. No other challenge in the game has an environmental page transition.

### Cost
~2.5 days. Highest. Canvas particle work + SVG wave morph + ambient loop is the complexity. Risk: if ambient is too busy, it distracts from the text. Mitigation: strict opacity / motion budget; `prefers-reduced-motion` freezes all ambient entirely.

### Trade-off
Maximally immersive, maximally castaway-truthful. But it requires the entire VP screen architecture to yield to a single continuous scene — and the ambient has to be disciplined or it becomes noise. This is the direction with the most chance of looking **amazing** and the most chance of looking **overdesigned** if polish stops at 80%.

---

## Direction C — Salvaged Footage

**Core move:** the VP is a **reel of 8mm home-movie footage** found inside a sealed tin washed ashore. Not producer cameras — the castaways' own hidden camcorder, water-damaged and recovered weeks later.

### The artifact
- A **film reel** is the visual center. Metal reel, scratched label reading "PROPERTY OF TOTAL DRAMA — EVIDENCE LOT #14 — RECOVERED AUG 2026." Rust spots, salt rings.
- A hand-cranked film viewer sits below the reel (like a Moviola or a Super-8 editing deck). User cranks the handle (drag or click-hold) to advance footage.
- A frame window in the center shows the current footage. Footage is stylized: desaturated, 16mm grain, frame jitter, occasional splice marks, occasional water-damage blotches that creep across the image.

### Footage presentation
- Each beat = a **film clip** of 2–6 seconds of looping content, rendered as CSS/SVG (not actual video). Players appear as **stylized silhouettes against a beach backdrop** with handwritten subtitle captions at the bottom of the frame.
- **Intertitles** (silent-film style) between clips: black frame, centered white serif "~ LATER THAT AFTERNOON ~".
- **Scratched film**: SVG displacement overlay with animated dust, hair-thin scratches scrolling vertically, occasional cigarette burns in the top-right corner (cue marks).
- **Audio (opt-in only):** projector clicking at 24fps. Volume tied to crank speed. Reduced-motion: silent.

### Phase = reel side
Five phases = five reel segments. Between phases, the reel **flips over** — a tactile wooden-clunk transition, film threading through the gate, a "LEADER" strip of black-and-numbered frames counts 3-2-1, then the new phase begins.

- **Phase 0:** the reel is handed into frame (an unseen hand), placed on the spindle, threaded.
- **Phase 1:** footage of scattered groups, intercut with a hand-drawn map title card.
- **Phase 2:** night vision green tint, the image gets noisy, subtitles are partially illegible ("C***T HOLD THIS MUCH LONGER"). Mr. Coconut breakdown: the frame zooms in on the player + object; the camera is shaking; subtitles are the player's whispered monologue.
- **Phase 3:** montage: multiple clips cross-dissolve into each other (SVG blend modes). Intertitle: "REUNION."
- **Phase 4:** the film **catches fire** at the storm beat — a brown heat-bubble appears on the frame, spreads, the image blisters and blackens. Cut to leader. The next clip is the "CLASSIFIED" Chris-camp footage — color, different film stock, labeled "PRODUCTION ROLL A."
- **Phase 5:** the final clip is the winner's portrait held for 4 seconds with their name hand-lettered below. The film runs out — the end flaps against the reel (tick-tick-tick).

### Castaway UI chrome
- No buttons. The interface is the machine: spindles, crank, lever for "REWIND," a lens focus ring (unused decorative).
- **Playback speed** controlled by crank speed. Fast-crank = accelerated phase narration. Slow-crank = savor every frame.
- **Frame counter** on the side of the machine: brass mechanical digits that physically flip (CSS 3D).

### Techniques
- **SVG filter chain** for grain, scratches, water damage, heat bubbling. Animatable via `@property --film-damage` and `--heat-blister`.
- **Canvas 2D** for dust particles in the projector beam.
- **`@property`** custom props for `--crank-speed`, `--film-damage`, `--color-temp`.
- **CSS 3D** for the flipping frame counter and the reel-flip transition.
- **Web Audio API** (opt-in) for projector loop; volume / pitch tied to crank speed.

### "Wow" moment
The **film catching fire at Phase 4.** A single frame blisters, the image eats itself, the viewer cuts to leader — and what comes next is obviously different film stock. That single transition sells the whole conceit.

### Cost
~2 days. SVG filter chains are the finicky part; the projector UI is pure CSS. Asset cost: low (no hand-drawn illustrations required — everything is stylized silhouettes and grain).

### Trade-off
Keeps a **surveillance/archival voice** (close to the current broadcast identity) but moves it from "network control room" to "castaway's own buried camcorder." Less warm than A (the journal), less immersive than B (the beach). But it's the safest direction — it has the narrowest aesthetic surface area and the lowest chance of missing.

---

## Comparison

| Axis | A Journal | B Driftwood Shore | C Salvaged Footage |
|---|---|---|---|
| Castaway-truthfulness | high (personal artifact) | **highest** (you're on the beach) | high (recovered artifact) |
| Preserves current three-mode split | collapses to one | collapses to one | collapses to one |
| Per-player identity presence | strong (pinned photos) | medium (footprints + shelters) | weak (silhouettes) |
| Phase transition | page turn | **tide wave** | **film reel flip + burn** |
| Best "wow" beat | Polaroid persisting across page turn | wave wiping the entire scene | Phase-4 film catching fire |
| Risk | medium (CSS 3D page turn) | high (ambient discipline) | medium (SVG filter finicky) |
| Asset authoring cost | high (hand-drawn SVG) | medium (scene + particles) | low (stylized silhouettes) |
| Fallback quality | strong (flat pages) | weak (static beach) | strong (still frames) |
| Build cost | ~2 days | ~2.5 days | ~2 days |

---

## Recommendation

**Direction A — The Castaway's Journal.**

Reasons:
1. **It solves the actual complaint.** The current VP reads as "text in a palette." A journal reframes every existing beat as a physical artifact without changing any of the underlying data — diary entries become handwritten paragraphs, surveillance becomes Chris's red-marker scribbles, broadcast becomes torn-out stamped pages. Same simulate(); radically different surface.
2. **It scales with the cast.** Polaroids, pins, margin doodles, pressed specimens — all of these accept N players elegantly. The beach (B) struggles when the cast is 14; the film reel (C) loses per-player identity.
3. **Lowest risk-to-impact ratio.** The page-turn is CSS 3D that works in all browsers. Paper textures and handwriting fonts are cheap. The "wow" (persistent Polaroid across page turn) is one View Transitions call, not a particle system.

If A feels too "pretty" and you want the challenge to *feel* like being stranded, choose **B** — but only if you're willing to spend the extra half-day on ambient discipline. Under-polished, B looks like a screensaver.

Choose **C** only if the constraint is art-asset cost. It ships with the least custom illustration.

---

## Non-negotiables (any direction)

- **`prefers-reduced-motion`** must freeze all ambient motion, page turns become instant swaps, particle systems are off. Static end-states must still look handsome.
- **Performance target:** 60fps on mid-range laptop during the signature transition. If a transition drops below 50fps, simplify before shipping.
- **No audio without explicit user opt-in.** B's waves, C's projector — all default off with a small speaker icon in the corner.
- **Click-reveal state (`_tvState`) must survive the signature transition.** Test: advance to Phase 3, reveal beats, turn page / wave / crank forward, come back — revealed state holds.
- **Integration constraint:** simulate() + ep.campCastaways + timeline + cameraFlags + personalScores data model stays untouched. Overdrive is strictly VP-layer (`vp-screens.js` + new CSS module + new assets under `assets/castaways/`).
- **Font loading:** any handwritten / marker / serif faces must load `font-display: swap` and have a system fallback that doesn't break layout.
- **Fallback for View Transitions** (Firefox flag-only): the signature transition degrades to an instant class swap. The static end-state must look intentional, not broken.

---

## Before building

Ship the Layer-1' correctness pass from the v2 audit (`2026-04-17-camp-castaways-audit-v2.md §7`). Polishing a VP that still has the duplicate winner-reveal and the tape-numbering 6→5→7 bug wastes the polish — the bugs will be louder than the beauty.
