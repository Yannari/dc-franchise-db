# I Triple Dog Dare You! — Overdrive Design

Date: 2026-04-17
Scope: Gameplay deepening + complete VP identity pass on top of the existing Triple Dog Dare challenge.
Target file: `js/chal/triple-dog-dare.js` (modify — grew from 802 → ~2000 lines).
Adjacent touch-points: `js/vp-screens.js` (replace 3 legacy rpBuild calls with a single consolidated one), `js/text-backlog.js`, `js/episode.js` (no changes needed — the twist dispatch already exists).

## Why this pass

The existing Triple Dog Dare has a solid mechanical skeleton — spinner, daisy-chain redirects, freebie economy, fatigue. But:

- **VP identity is thin.** No dedicated CSS, no reveal engine, three separate `rpBuild` screens in `vp-screens.js` that render as plain tables. Nothing visually anchors the challenge in the player's memory.
- **Dare category is flavor-only.** `DARE_POOL` has `gross`/`physical`/`truth`/`public` buckets, but the category never affects anything post-acceptance. Accept a gross dare? Same mechanical result as accepting a physical dare. The categories are currently decorative text.
- **No archetype influence on dare choice.** Every player is equally (un)willing regardless of whether they're a hothead or a floater. A hothead should *love* physical dares; a perceptive-player should *love* truth dares; a floater should chicken out of everything.
- **Chicken-out has no consequence beyond the tactical freebie cost.** Redirecting 5 times in a row doesn't damage your reputation, doesn't escalate pressure, doesn't make the next dare harsher.
- **Public reaction is invisible.** A player eating a worm should swing popularity ±. A truth reveal should damage the revealed player. Currently popularity changes are limited to the final elimination.

## Identity: Playground Chaos

Chalk-on-blacktop aesthetic. Hand-drawn wobbly SVGs, childlike energy, dares scrawled in sharpie on torn notebook paper. Distinct from every other challenge in the pack:

- Off the Chain → motocross (orange HP bars, explosions)
- Wawanakwa Gone Wild → ranger field-cam (tan surveillance)
- Tri-Armed Triathlon → tournament-bracket stage (black/gold)
- Say Uncle → dungeon stone
- Brunch → cafeteria slime
- Hide and Be Sneaky → night-vision green
- **Triple Dog Dare → recess-asphalt chalk-and-sharpie** (new)

### Palette

- Background base: `#2a2a2a` asphalt gray with chalk-dust overlay (`radial-gradient` noise)
- Chalk white: `#f0ece2` (slightly off-white, not pure)
- Sharpie black: `#1a1a1a` (for dare scrawls on cream paper)
- Cream paper: `#f4e8c8` (notebook page)
- Category neons (highlighter marker style):
  - GROSS: hot pink `#ff2d87`
  - PHYSICAL: highlighter yellow `#ffe83a` with black text for readability
  - TRUTH: electric cyan `#3ef0ff`
  - PUBLIC: neon green `#3aff7a`
- Chicken badge: chicken-feather yellow `#ffd447`
- Elimination red: sharpie red `#d92424`

### Fonts

- Display / chalk scrawl: handwritten stack — `'Kalam', 'Patrick Hand', 'Chalkboard SE', 'Comic Sans MS', cursive` (degrades gracefully if Kalam/Patrick Hand not loaded)
- Sharpie scrawl (dare cards): `'Permanent Marker', 'Kalam', cursive` — thicker, bolder weight
- Chalk readable body: `'Kalam', 'Patrick Hand', cursive`
- Courier monospace accents for round numbers + stats

No web-font fetch required — use system handwritten-stack fallback. Graceful degradation to Comic Sans is acceptable (fits the vibe).

### Distinctive visual primitives (not reused from other challenges)

1. **Chalked spinner wheel** — SVG circle drawn with rough-chalk stroke (`stroke-dasharray` for irregular edge), sharpie-arrow pointer that wobbles on spin. Animation: physics-driven decel (JS-driven rotation with easing), lands on a player with a tiny overshoot + settle.
2. **Friendship bracelet freebies** — each freebie is a colored braided bracelet (3 strands, CSS gradient). Stack visible on every player card. Gifted bracelets have a hand-off animation (slides from donor → recipient with a "PASS" scrawl overlay).
3. **Sharpie dare card** — torn-notebook-paper background with lined rules, dare text renders letter-by-letter (JS typewriter) in thick sharpie stroke. Category tag in the corner highlighted with a neon marker stripe.
4. **Chicken meter** — cartoon SVG chicken that grows per redirect streak: round 1 = tiny chick, round 3 = small hen, round 5 = giant clucking rooster. Permanent badge on the player card while streak is alive.
5. **Crowd stick-figures** — sidewalk-chalk stick figures along the bottom of the page, multiplying as dare spectacle grows (gross dare = 2 new onlookers, public dare = 5, truth dare = 1 gossipy pair). Static chalk drawings, no animation beyond fade-in.
6. **Marker-stripe highlights** — whenever a category is mentioned in any card, the category name gets a neon-highlighter stripe under the text (CSS: `background: linear-gradient(transparent 50%, <category-color> 50%)`).
7. **Scritch-settle spinner animation** — after the big spin, the arrow does 3-4 tiny back-and-forth jitters as if snagging on chalk grit. 0.4s of "scritch" motion before final rest.

### Anti-reuse enforcement

These patterns exist in other challenges and are **explicitly forbidden** from this VP:
- No portraits in rectangular cards with left-border color accent (Off the Chain / Wawanakwa / Tri-Armed)
- No ticker marquee band (every other challenge has one)
- No sticky tracker bar across the top
- No stamp-slam on wins (no `stamp-slam` keyframe reuse)
- No chain/handcuff iconography
- No curtain-reveal
- No podium plinths

If we want "a pair just accepted a dare" to feel celebratory, the language has to be CHALK — a chalk-burst particle flourish, a hand-drawn star, a scrawled "NICE" in the margin — not a gold stamp.

## Gameplay depth changes (mechanical polish tier)

All changes stay inside `simulateTripleDogDare(ep)` in `js/chal/triple-dog-dare.js`. No new persisted state schema. Round-state tracking stays in the existing locals.

### 1. Dare-category consequences (post-accept)

After a player successfully accepts and completes a dare, apply a category-specific side effect:

- **GROSS:** 25% mishap roll. If mishap fires: emit a `dareMishap` event, deduct 1 freebie if they have one (the dare was so bad they need backup), -1 popularity per fail, +1 popularity per clean completion (guts), -1 bond with whoever's specifically named in the dare ("eat a worm in front of X" damages bond).
- **PHYSICAL:** stat fatigue — player's boldness + physical drop by 1 each for the next 2 rounds (transient `_dareFatigue` counter on the state). Affects their willingness rolls. +2 popularity for bold completion.
- **TRUTH:** bond shift with named target. The dare reveals something (truth pool has templates like "admit who you'd vote for") — pull the named target from the template and apply: revealer-target bond -2 to -4 depending on severity. Revealer's popularity: +1 for honesty, -1 if the revealed secret hurts the target.
- **PUBLIC:** popularity swing. Amplify whatever direction the event is going: +2/-2 instead of +1/-1, because the crowd is watching.

These fire via the existing `popDelta` + `addBond` helpers already imported.

### 2. Archetype dare preferences

Replace the uniform `freebieComfort` calculation with archetype-category biases:

```
archetypeBias[archetype][category] = small modifier on acceptance willingness
```

Examples:
- `hothead` + `physical` = +0.15 willingness (loves it)
- `hothead` + `truth` = -0.10 (bad at emotional)
- `villain`/`mastermind` + `truth` = +0.12 (weaponize info)
- `villain` + `public` = -0.08 (prefers private scheming)
- `showmancer`/`social-butterfly` + `public` = +0.15 (spotlight)
- `perceptive-player` + `truth` = +0.10 (comfortable with vulnerability)
- `challenge-beast` + `physical` = +0.20 (obvious)
- `floater` + anything = -0.05 (avoid everything)
- `hero`/`loyal-soldier` + anything = +0.05 (honor)
- `goat` + `gross` = +0.15 (no shame)

Full table defined in the implementation plan. Modifier applied in the acceptance-willingness roll.

### 3. Chicken-out streak mechanic

Track per-player redirect count in a local `chickenStreak[name]` counter. Rules:

- Each redirect/freebie-use = +1 to streak.
- Each accept / completion = streak resets to 0.
- At streak ≥ 3: player earns a visible "CHICKEN" badge (chicken meter grows each round).
- At streak ≥ 3: **pressure effect** — willingness drops by `0.03 * streak` (peer pressure math, making them less likely to refuse next time — they feel the stares).
- At streak ≥ 5: **targeted dare** — the next time a dare is generated for this player, the dare pool is biased toward harsher dares (pull from the top 50% of the pool by mishap-severity).
- Final elimination: if two players tie in any elimination logic, highest chicken-streak loses (they're the target of the crowd).
- Popularity: -0.5 per round while streak is alive, -2 total if streak ≥ 5 at episode end.

Emitted events:
- `chickenStreakStart` (first time streak hits 3 for a player)
- `chickenStreakEscalate` (each round streak grows past 3)
- `chickenStreakBroken` (accepting a dare while on streak — bond-positive with whoever they accept around, +1 popularity)

### 4. Public reactions per round

After each round, emit a `publicReaction` event summarizing crowd sentiment:

- Baseline: 0-1 reaction events per round
- Triggered by:
  - A gross dare with visible mishap: "The crowd gags. Owen loses a small bit of respect."
  - A public dare completed boldly: "The crowd whoops. Leshawna gains rep."
  - A truth dare exposing a player: "Gwen is going to remember that."
  - Extended chicken streak: "The crowd starts to turn on Geoff. Every pass-off makes it worse."

Popularity deltas are applied via `popDelta`. The events are narrative + mechanical (the popularity shift is real in the game state).

### 5. Text-pool expansion for narrative depth

Current dare pool is ~50 entries. Expand to ~120 (30 per category) to support:

- Named-target dares (truth category uses `{target}` placeholder resolved to a player name at draw-time)
- Archetype-conditional dares (some dares require a specific archetype to be pulled — a "confess your crush" dare requires a showmance or spark exists; a "wrestle Chef" dare requires high physical)
- Mishap-eligible dares flagged separately (gross pool)
- Category severity tiers — top 50% of each pool is "harsh", bottom 50% is "mild"

## New event types

Emitted by the simulation, consumed by the new VP renderer and text backlog.

| Type | Purpose |
|---|---|
| `tddIntro` | Chris announces the challenge (fresh for the overdrive) |
| `spinnerLand` | The spinner landed on a player (new — currently just embedded in chain) |
| `dareReveal` | The dare card is pulled and revealed (new — replaces plain text embed) |
| `dareAccept` | Player accepts (existing, but now emits cleanly) |
| `dareRedirect` | Player redirects to another (existing) |
| `dareAttempt` | Player attempts completion, success/fail (existing) |
| `dareMishap` | Category-specific mishap fires (NEW — gross/physical) |
| `dareConsequence` | Post-accept side effects: fatigue, truth bond shift, public swing (NEW) |
| `freebieGift` | Ally shares a freebie (existing) |
| `chickenStreakStart` | First time streak hits 3 (NEW) |
| `chickenStreakEscalate` | Streak grew past 3 (NEW) |
| `chickenStreakBroken` | Accepted while on streak (NEW) |
| `publicReaction` | Crowd sentiment shift (NEW) |
| `dareElimination` | Final elimination moment (existing, renamed for clarity) |
| `dareAftermath` | Post-challenge narrative beats (NEW) |

All events carry `players: []`, `round: number`, optional `category: 'gross'|'physical'|'truth'|'public'`.

## VP design

### Page chrome

- Root `.tdd-page` — asphalt gray background with chalk-dust overlay (SVG noise or `radial-gradient` simulation), 30px padding.
- Header `.tdd-header` — centered, "I TRIPLE DOG DARE YOU!" title in thick sharpie scrawl font. Below: three sidewalk-chalk stars and a subtitle "THE LAST ONE STANDING WINS IMMUNITY · THE FIRST ONE TO CHICKEN OUT GOES HOME".
- No ticker. No sticky top bar. Intentional whitespace — the chalk theme wants breathing room.

### Scoreboard: the recess wall

Instead of a tracker bar, have a **recess-wall scoreboard** — a chalked rectangle on the left/side showing:

- Every active player's name (chalk handwriting)
- Their freebie-bracelet stack (1-6 small colored braided rectangles)
- Chicken streak meter if alive (small chicken emoji scaled by streak count)
- Elimination = name crossed out with sharpie slash

This block is NOT sticky (avoid other challenges' pattern). Instead, it's a SIDEBAR that scrolls with the page. Renders once at the top, updates via reveal-engine when state changes fire.

### The spinner (signature centerpiece)

Full-width card on every `spinnerLand` event. Structure:

```
     ╱─────────────╲
    │   ✎ arrow     │   <- sharpie arrow SVG, wobbles
    │  ╱            │
    │ ╱   ◉         │   <- chalked circle
    │╱              │   <- rough-edge chalk stroke
    │               │
     ╲─────────────╱
          ▼
     GWEN (lands here with a scritch)
```

- Circle: SVG `<circle>` with `stroke: #f0ece2`, `stroke-width: 4`, `stroke-dasharray: 5 3 7 4 6 2` (irregular chalk look), `fill: transparent`.
- Arrow: SVG `<path>` — hand-drawn sharpie line, rotates.
- Rotation: JS-driven. Compute target angle, use `requestAnimationFrame` with cubic-out easing over ~1.4s. Then 3-4 micro-oscillations (±3-5°) for the "scritch" effect, total 0.4s. Final settle on exact target.
- Result text ("GWEN") renders BELOW the spinner in chalk font, fades in after settle.

This is the tentpole visual. It MUST feel physical — spring-settle, not `animation-timing-function: linear`.

### Dare card reveal

When a `dareReveal` event fires, the card is a torn-notebook-paper rectangle with:

- Lined-paper background (SVG: horizontal cream lines on pale cream, torn-edge top via clip-path)
- Category corner tag: highlighter-marker stripe behind the category name
- Main dare text: big sharpie scrawl, rendered **letter-by-letter** via JS typewriter over ~1.2s (adjustable pacing — 50ms/char, faster for long dares)
- Below: one small sharpie symbol — a scrawled star, arrow, or question mark depending on category

### Chicken meter card

When a `chickenStreakEscalate` event fires, render a standalone card:

- Background: chalk-drawn concentric circles (target rings)
- Center: cartoon SVG chicken that grows with streak
  - Streak 3: small chick (baby size)
  - Streak 4: medium hen
  - Streak 5+: giant clucking rooster
- Label: "CHICKEN METER · ${player} · ${streak} passes in a row"
- Small chalk-crowd drawing gathering around (2 stick figures at streak 3, 5 at streak 5+)
- Popularity tick: a small "-0.5 POP" chalk scrawl in the corner

### Public reaction card

Compact chalk-on-asphalt rectangle. No portrait. Just narrator text:

```
  ──── CROWD REACTS ────
  The onlookers GAG. Owen loses a bit of respect.
```

Uses chalk font. Sidewalk-chalk stick figures (3-5 of them) render in the bottom border, fading in.

### Freebie-gift card (enhanced)

When a freebie is gifted (`freebieGift` event), the card shows both portraits + an animated bracelet sliding between them:

- Left: donor portrait with bracelet stack (count decrementing)
- Right: recipient portrait with bracelet stack (count incrementing)
- Middle: a braided bracelet SVG with a "PASS" scrawl sliding from left → right over 0.8s
- Caption: scrawled text ("Damien passes Gwen a bracelet. 'Hold onto this.'") in chalk font

### Elimination card

When `dareElimination` fires:

- Full-width chalk-drawn tombstone or "GAME OVER" chalk scrawl
- Eliminated player's name in chalk gets dramatically CROSSED OUT with a sharpie slash (CSS: `text-decoration-line` animation over 0.8s, red color)
- Below: their final dare that broke them, in sharpie
- Chalk crowd: all remaining stick figures turn to face the eliminated player

### Reveal engine

Standard click-to-reveal pattern, consistent with off-the-chain/wawanakwa. Functions:

- `_tddReveal(stateKey, totalSteps)` — advance one step
- `_tddRevealAll(stateKey, totalSteps)` — snap everything visible

Per-step animation triggers:
- Spinner rotation on `spinnerLand`
- Typewriter on `dareReveal`
- Chicken-grow on `chickenStreakEscalate`
- Bracelet hand-off on `freebieGift`
- Slash-through on `dareElimination`

No camera shake. No stamp-slams. When a dare is accepted, the celebration is a small **chalk-burst particle** (5-8 short white chalk lines radiating from the player's name, 0.3s fade).

## CSS architecture

Single `TDD_STYLES` template literal at top of `triple-dog-dare.js`. Estimated ~300 lines.

Animations (all additive — none shared with other challenges):
- `tdd-chalk-dust-drift` — subtle background texture shift (8s, very slow)
- `tdd-spinner-wobble` — arrow jitter during spin settle (0.4s ease-out)
- `tdd-chalk-stroke-in` — chalked border appears via `stroke-dasharray` animation (0.8s)
- `tdd-typewriter` — handled via JS (no CSS keyframe — set `width` step-by-step)
- `tdd-chalk-burst` — particle flourish on accept (0.3s)
- `tdd-chicken-grow` — chicken emoji scales up (0.5s spring)
- `tdd-bracelet-slide` — freebie-gift hand-off (0.8s cubic-bezier)
- `tdd-sharpie-slash` — elimination slash-through (0.8s linear)
- `tdd-crowd-fade-in` — stick figures appear (0.4s staggered)

Reduced-motion block disables all animation, sets final static states.

## Integration changes

### `js/chal/triple-dog-dare.js` — expand

- Add `TDD_STYLES` template literal
- Add `rpBuildTripleDogDare(ep)` function (consolidates the 3 existing rpBuild screens into one)
- Add `_tddReveal` / `_tddRevealAll` engine
- Add `_renderTDDStep(evt, tdd, annotation)` — per-event renderer
- Add text pools for new event types
- Expand `DARE_POOL` by category
- Keep `simulateTripleDogDare(ep)` — add the 5 mechanical changes inline, no signature changes

### `js/vp-screens.js` — simplify

Current (line 10484-10487):
```js
if (ep.isTripleDogDare && ep.tripleDogDare) {
  vpScreens.push({ id:'tdd-announce', label:'Triple Dog Dare', html: rpBuildTripleDogDareAnnouncement(ep) });
  vpScreens.push({ id:'tdd-rounds', label:'The Dares', html: rpBuildTripleDogDareRounds(ep) });
  vpScreens.push({ id:'tdd-elimination', label:'Eliminated', html: rpBuildTripleDogDareElimination(ep) });
}
```

Replace with single consolidated screen:
```js
if (ep.isTripleDogDare && ep.tripleDogDare) {
  vpScreens.push({ id: 'tdd', label: 'Triple Dog Dare', html: rpBuildTripleDogDare(ep) });
}
```

Delete the three legacy rpBuild functions (they render plain tables — no longer needed).

### `js/text-backlog.js`

Add/replace the existing `_textTripleDogDare` (if present) to handle the new event types. Emit round-by-round summary + final elimination.

### `js/episode.js`

No changes. The twist dispatch already calls `simulateTripleDogDare(ep)` when `ep.isTripleDogDare` is set.

### `js/core.js`

`DARE_POOL` is currently exported from `core.js`. Expand it there (add ~70 new entries split across the 4 categories). Add a `severity` field per dare (`'mild' | 'harsh'`) to support chicken-streak harsh-pool biasing.

## Data-flow changes

- Per-player state inside `tripleDogDare` state object gains:
  - `dareFatigue` — int, decremented per round, set to 2 on physical-dare accept
  - `chickenStreak` — int, increments on redirect, resets on accept
  - `publicBuzz` — int, short-term narrative tracking (used for public-reaction triggers), reset each round

None of these require save-state schema changes — they live in `ep.tripleDogDare` which serializes as a plain object.

- New event types added to the `timeline` array. Legacy consumers (if any) that don't recognize `dareMishap`/`dareConsequence`/`chickenStreakStart`/etc. will just ignore them.

## Testing

Manual via `simulator.html`:

1. Trigger a post-merge episode with Triple Dog Dare twist active, 5-8 active players.
2. Visual identity: page is asphalt + chalk dust. Title is scrawled sharpie. Spinner is chalked circle with a wobbling sharpie arrow.
3. Click-through reveal:
   - Spinner lands with physics-feel rotation + scritch-settle (not linear spin)
   - Dare cards typewrite letter-by-letter
   - Category tag highlighter stripe renders in correct color per category
   - Freebie bracelets visible on every scoreboard player; gift animation slides bracelets on gift events
   - Chicken meter appears at streak 3, grows at 4, becomes a rooster at 5+
   - Public reaction cards fire 0-1 times per round
   - Dare consequences apply: gross dares roll mishaps, physical dares apply fatigue (visible on willingness in next round), truth dares shift bonds, public dares swing popularity 2x
4. Archetype preferences measurable: run 5 simulations with a hothead and a floater — hothead should accept physical dares far more often.
5. Elimination: name gets crossed out with a sharpie slash animation.
6. Reduced-motion: all animations disabled, static states show correctly.
7. Console clean.
8. Text backlog contains round-by-round summary with chicken-streak escalation, dare consequences, public reactions.

Also: spot-check a 100-run simulation to confirm chicken-streak elimination rate is reasonable (not every episode ends by chicken-5; should be ~15-25% of eliminations caused primarily by streak pressure).

## Non-goals

- No sound.
- No new persisted state schema.
- No changes to the twist dispatch in episode.js or twists.js.
- No "earned dare" crafting (that was the deep-overhaul tier, out of scope per user choice).
- No new player-archetype interactions beyond the willingness biases defined above.
- No View Transitions API / WebGL / WASM — the Playground Chaos identity is SVG + CSS + small JS, not GPU-intensive.
- No mobile-first layout rework (scales OK at 720px+ per existing pattern).

## Risks and mitigations

- **Spinner physics feels fake.** Mitigation: iterate visually in Playwright. Use a real cubic-ease-out for the big spin and a 4-step tweened back-and-forth for the settle. If it still feels off, add a `transform: translateY(-1px)` micro-lift at the settle peak for weight.
- **Typewriter on dare card feels slow on long dares.** Mitigation: cap typewriter speed — if dare > 60 chars, go to 30ms/char instead of 50ms.
- **Chicken-meter overwhelms the round cards.** Mitigation: max one chicken-meter-escalate card per round even if multiple players cross 3. Dropped events aggregate into a single "MULTIPLE CHICKENS" summary.
- **Archetype biases swing acceptance too hard, break balance.** Mitigation: cap max bias at ±0.20 per category. Keep a noise term `_rand(-0.08, +0.08)` in the final willingness roll so nothing is fully deterministic.
- **Dare-pool expansion creates bad content.** Mitigation: write in small batches (10-15 per category per task), review in-context after each batch. Bad dares get replaced, not merged.
- **Handwritten fonts unavailable on user system.** Mitigation: font stack ends in `cursive` which resolves to something readable on every OS. Comic Sans on Windows is acceptable — it fits the aesthetic.
- **Chalk-stroke SVG paths don't render consistently across browsers.** Mitigation: use `stroke-dasharray` + `stroke-linecap: round` which are universally supported. No `stroke-dashoffset` animation for initial chalk-draw (optional embellishment).
