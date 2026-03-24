# VP Viewer Redesign — Design Spec
**Date:** 2026-03-24
**Scope:** Full overhaul of the Visual Player (VP) viewer inside `simulator.html` — aesthetic redesign + all items from `DATA_SEASON/viewer_improvements.txt`

---

## 1. Goals

- Make the VP feel like a broadcast-quality reality TV competition recap (Disventure Camp structure + Survivor-dark atmosphere)
- Fill every functional gap in `viewer_improvements.txt` (missing screens, nav issues, screen quality)
- No spoilers on pre-reveal screens

---

## 2. Implementation Approach

Screen-by-screen in VP order. Each screen gets its visual treatment and any functional fixes/additions at the same time. The existing design foundation (Anton / DM Sans / Space Mono, dark backgrounds, `vpPageIn` animation) is the starting point — we extend it, not replace it.

---

## 3. Visual Language

### 3.1 Color System (CSS variables)

```css
--accent-fire:   #e8873a;   /* tribal amber — vote tallies, elimination, heat */
--accent-ice:    #4db8c4;   /* alliance/social blue — bond scores, alliance cards */
--accent-gold:   #f0c040;   /* advantage/twist gold — badges, twist titles */
--ease-broadcast: cubic-bezier(0.22, 1, 0.36, 1);
--reveal-stagger: 120ms;
```

Tribe colors thread through via existing `tribeColor()` — sidebar dots, camp headers, portrait borders.

### 3.2 Time-of-Day Progression

Each screen maps to a time of day. The background hue shifts progressively; all palettes remain dark (the UI is always dark-mode — the palette controls the *tint*, not brightness). The Tribal fire is earned by the end.

| Screen | Time of Day | `--tod-bg-start` | `--tod-bg-end` |
|---|---|---|---|
| Cold Open | Dawn | `#0f0e18` | `#1a1530` |
| Tribe Status | Early morning | `#0d1018` | `#181624` |
| Merge Announcement | Morning | `#0e1014` | `#1a1a28` |
| Camp Life | Midday | `#0c1118` | `#111820` |
| Challenge | Afternoon | `#0b1219` | `#0e1a26` |
| Relationships / Alliance State | Late afternoon | `#100e0a` | `#1c1508` |
| Voting Plans | Dusk | `#130d06` | `#1e1205` |
| Tribal Council | Night | `#090d12` | `#0d0705` |
| Vote Reveal | Deep night | `#050709` | `#08050a` |
| WHY This Vote Happened | Post-tribal / early dawn | `#080c11` | `#0d1018` |
| RI Duel | Midday (arena) | `#0d1318` | `#131a20` |
| Pre-Tribal Twists | Dusk | same as Voting Plans | same as Voting Plans |
| Post-Vote Twists | Deep night | same as Vote Reveal | same as Vote Reveal |

Each screen sets these as inline CSS on its container:
```js
style="background: linear-gradient(to bottom, var(--tod-bg-start), var(--tod-bg-end));"
```

### 3.3 Component System

- **`.vp-card`** — dark card with border, used for alliance cards, player cards, duel matchup
- **`.vp-badge`** — existing badge system, colors via `--accent-fire` / `--accent-ice` / `--accent-gold`
- **`.vp-section-header`** — Anton label with colored left-bar accent (fire, ice, or gold depending on context)
- **`.vp-stump`** — wooden stump pedestal for Tribal Council portrait row (see section 5.8)

### 3.4 Animation Rules

- Page entrance: existing `vpPageIn` (fade + translateY) applies to all screens
- Card entrances: `transform: translateY(24px) → 0` + `opacity: 0 → 1` with `--ease-broadcast`, staggered
- Alliance card slide-in: `translateX(-32px) → 0`
- Stump plant + portrait drop (Tribal): stumps stagger in bottom-up, portraits drop onto them
- Vote tally count-up: JS `requestAnimationFrame` loop increments the displayed number from `0` to `n` over 600ms per tally, triggered when each card enters the DOM (one tally counts up before the next card animates in)
- Torch-snuff (Vote Reveal only): eliminated portrait `filter: brightness(1) → 0.15` over 1.5s via CSS transition
- Merge banner entrance: `scaleX(0 → 1)` from `transform-origin: center` on the tribe banner, then portrait grid staggers up
- Twist scroll drop: `scaleY(0 → 1)` from `transform-origin: top center`

---

## 4. Navigation Fixes

### 4.1 Sidebar Color Dots (3+ Tribes)

In the `vpScreens.push()` block, each `id: 'camp-'` entry's `label` string gets a colored circle prefix using `tribeColor(tribeName)`:

```js
label: `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${tribeColor(t)};margin-right:6px"></span>${t} Camp`
```

Pre-camp and post-camp entries get a subtle `padding-left: 14px` indent grouping so they visually cluster.

### 4.2 Duplicate Twist Labels

- Pre-tribal twist screen label → `"Pre-Tribal Events"`
- Post-elimination twist screen label → `"Post-Vote Twist"`

---

## 5. Screen-by-Screen Plan

### 5.1 Cold Open *(existing — quality fix)*

**Functional addition:** "Coming in from last episode" block below the cast status grid.

Data sources (`prevEp` = the previous entry in `gs.episodeHistory`, or `null` if episode 1):
- `prevEp.allianceQuits` — array of `{ player, alliance, reason }` (top-level field on episodeHistory entry, saved at episode end)
- `prevEp.allianceRecruits` — array of `{ player, toAlliance, fromAlliance, scenario }` (same)
- `prevEp.gsSnapshot.namedAlliances` — named alliances at end of last episode

Shows:
1. Top named alliance going into this episode (largest active alliance from `prevEp.gsSnapshot.namedAlliances` by `members.length`)
2. Who's on the bottom — call `getBond(a, b)` at render time across all current `gs.activePlayers` pairs, compute average per player, surface bottom 2 players. Using live `getBond()` is correct here: bonds at episode start reflect the state flowing in from the previous episode.
3. Any alliance shifts from last episode (`prevEp.allianceQuits` / `prevEp.allianceRecruits` if non-empty)

Skipped entirely if `gs.episodeHistory.length < 2` (episode 1).

Style: Anton sub-header, fire-accent callout card for bottom players.
Time-of-day: dawn palette.

### 5.2 Tribe Status *(existing — minor polish)*

- Tribe name headers get color from `tribeColor()` as text or border accent
- Time-of-day: early morning

### 5.3 Merge Announcement *(NEW screen)*

**Condition:** `ep.isMerge === true`
**Position:** Between Tribe Status and Camp Life

**Merged tribe name + color:**
- After merge, `ep.gsSnapshot.tribes` contains a single tribe entry (the merged tribe): `ep.gsSnapshot.tribes[0].name`
- Color: `tribeColor(ep.gsSnapshot.tribes[0].name)`

**Content:**
- Tribe banner: merged tribe name in Anton, colored with `tribeColor()`
- Full merged cast portrait grid (`ep.gsSnapshot.activePlayers`)
- Two callout blocks:
  1. **Top alliance threats** — `ep.gsSnapshot.namedAlliances` sorted by `members.length` descending, show top 2
  2. **Unallied / on the bottom:**
     - *Unallied*: `ep.gsSnapshot.activePlayers` whose name does not appear in any `ep.gsSnapshot.namedAlliances[i].members`
     - *On the bottom*: of the unallied players, surface up to 3 with the lowest average `getBond(player, other)` across all active players

**Entrance animation (cinematic):**
1. Tribe banner: `scaleX(0 → 1)` from `transform-origin: center` with `--ease-broadcast`
2. Portrait grid staggers up one by one (left to right, `--reveal-stagger` apart)
3. Callout blocks fade in last

Time-of-day: morning.

### 5.4 Camp Life *(existing — quality fix)*

**Post-merge change only:** Group events by type using `.vp-section-header` dividers.

Camp event `type` → display category mapping:

| Event type | Display category |
|---|---|
| `doubt`, `paranoia`, `tempBloc`, `idol` | Strategy |
| `bond`, `comfort`, `lovedOnes`, `tribeArrival` | Social |
| `comfortBlindspot`, `clockingIt` | Spotlight (`.vp-card` callout with fire-accent border) |

Any type not in the above list falls into Social by default.

**Note:** The "cap to N events with expand button" option from `viewer_improvements.txt [F]` is dropped. Grouping by type solves the hierarchy problem without truncating information. The cap option would require expand/collapse state management with no meaningful benefit given the grouping structure.

Pre-merge behavior unchanged.
Time-of-day: midday.

### 5.5 Relationships / Alliance State *(NEW screen)*

**Position:** Between Camp Life and Voting Plans
**Data:**
- `ep.bondChanges` — array of `{ a, b, delta }` bond shift records for this episode
- `ep.allianceRecruits` — array of `{ player, toAlliance, fromAlliance, scenario }`
- `ep.allianceQuits` — array of `{ player, alliance, reason }`
- `ep.gsSnapshot.namedAlliances` — current named alliances

**Betrayals access:** `snapshotGameState()` shallow-copies each alliance's `betrayals` array (`[...a.betrayals]`) and the snapshot is taken *after* `detectBetrayals()` runs. So `ep.gsSnapshot.namedAlliances[i].betrayals` is a reliable copy of the betrayals array including those from this episode. Filter to this episode: `alliance.betrayals.filter(b => b.ep === ep.num)`. Each betrayal object has `{ player, ep, votedFor, consensusWas }`.

**Content:**
1. Alliance cards (`.vp-card`) — one per active named alliance, showing name + member portrait row + ice-accent "joined" badge for any recruit in `ep.allianceRecruits` + fire-accent "left" badge for any quit in `ep.allianceQuits`
2. Bond shifts — ranked list of biggest `Math.abs(delta)` from `ep.bondChanges`, showing player pair + delta (ice for positive, fire for negative). Show top 5.
3. Betrayals section — shown only if any alliance has `betrayals.filter(b => b.ep === ep.num).length > 0`. List: player name + alliance they betrayed + who they voted for.

**Animation:** Alliance cards slide in from left (`translateX(-32px) → 0`), staggered by `--reveal-stagger`.
Time-of-day: late afternoon.

### 5.6 Voting Plans *(existing — gap fixes)*

**Two additions:**
1. Comfort blindspot player (`ep.comfortBlindspotPlayer`) gets `⭐ CHECKED OUT` badge on their plan card
2. Defectors from `ep.defections` get a "broke from bloc" callout card (fire-accent border) before the plan reveal section

**`ep.defections` shape:** array of `{ player, alliance, votedFor, consensusWas }` — set in `runTribal()` from `simulateVotes()` return value. May be undefined if no defections; guard with `ep.defections?.length`.

**Data used:** `ep.comfortBlindspotPlayer`, `ep.defections`
**Note:** `ep.alliances` is NOT needed for these additions.

Time-of-day: dusk.

### 5.7 Challenge *(existing — no changes)*

Time-of-day: afternoon.

### 5.8 Tribal Council *(existing — full atmospheric redesign)*

Time-of-day: night.

**Background:** `linear-gradient(to top, rgba(232,135,58,0.12), transparent)` layered over the base `--tod-bg` gradient — amber radiates up from the bottom. Add `@keyframes torchFlicker { 0%,100% { opacity:0.10 } 50% { opacity:0.18 } }` and apply to the overlay layer (3.5s ease-in-out infinite).

**Header:** "TRIBAL COUNCIL" in Anton, `font-size: 48px`, `text-shadow: 0 0 24px #e8873a, 0 0 8px rgba(232,135,58,0.5)`.

**Portrait seating row — wooden stumps:**
- Each player gets a `.vp-stump` wrapper containing a stump `div` + portrait `img`
- Stump `div`: `width: 72px; height: 20px; border-radius: 6px; background: radial-gradient(ellipse at 50% 30%, #8b6914, #5c3d0a)` with a `linear-gradient(to right, #3d2505, transparent 20%, transparent 80%, #3d2505)` overlay for edge grain; `box-shadow: 0 2px 16px rgba(232,135,58,0.25)`
- Portrait `img`: positioned above stump with `margin-bottom: -10px`, `box-shadow: 0 4px 12px rgba(0,0,0,0.7)`
- Row arc: outermost 2 players on each side get `transform: translateY(6px)` (cosmetic perspective bend)
- Entrance: stump `translateY(20px) → 0` + `opacity: 0 → 1`, staggered. After stump settles, portrait drops in with `cubic-bezier(0.34, 1.56, 0.64, 1)` (slight bounce)

**Mood indicators (replaces heat bars — no spoiler risk):**
Show a small emotional state badge per player using `ep.gsSnapshot.playerStates?.[player]?.emotional` (or `gs.playerStates[player].emotional` at render time). Emotional states (`comfortable`, `confident`, `paranoid`, `desperate`) are set before alliances form and do not directly encode vote outcomes. Display as a small colored pill beneath each portrait: comfortable = muted green, confident = ice-accent, paranoid = fire-accent, desperate = dark red. This replaces the heat-bar approach — `computeHeat()` is not used here because it encodes alliance targeting information which is a spoiler risk.

**Urn divider:** `.vp-card` with `font-family: var(--font-mono)`, italic, centered: *"The votes have been cast."* Fire-accent border.

**Comfort blindspot note:** Fire-accent `.vp-card` if `ep.comfortBlindspotPlayer` is set.

### 5.9 Vote Reveal *(existing — motion upgrade + torch-snuff)*

**Function to modify:** `rpBuildVotes()` in `simulator.html`.

Time-of-day: deep night.

**Motion upgrades (extend existing `scale(0.98→1)` animation, do not replace it):**
- Each vote card: add `opacity: 0 → 1` to the existing entrance animation, with `--reveal-stagger` delay per card index
- Tally count-up: after each card's entrance animation completes, run a `requestAnimationFrame` counter from `0` to the current tally value over 600ms. Update the tally `<span>` element's `textContent` each frame.
- Final vote card: add `box-shadow` pulse — `@keyframes voteFlash { 0% { box-shadow: 0 0 0 0 #e8873a } 100% { box-shadow: 0 0 0 16px transparent } }` applied once on the last card

**Torch-snuff (after final vote is revealed):**
- Add class `.torch-snuffed` to eliminated player's portrait wrapper
- CSS: `.torch-snuffed img { transition: filter 1.5s ease-in; filter: brightness(0.15) grayscale(1); }`
- Append "The tribe has spoken." in Anton below the portrait: `opacity: 0 → 1` over 0.8s after snuff begins

### 5.10 RI Duel *(NEW screen)*

**Condition:** `ep.riDuel !== null`
**Position:** After Vote Reveal in RI episodes
**Data:** `ep.riDuel.winner` (string), `ep.riDuel.loser` (string)

**Note on `context` field:** `viewer_improvements.txt` mentions `ep.riDuel.context`, but `simulateRIDuel()` returns only `{ winner, loser }` — no `context` field exists in the engine. Narrative text is generated on-the-fly using `pronouns()` and `pStats()`.

**Content:**
- Header: "REDEMPTION ISLAND DUEL" in Anton
- Portrait pair side by side in `.vp-card` wrappers, labeled with player names
- Result: `${winner} wins — remains on Redemption Island. ${loser} has been eliminated.`
- One stat-derived flavor line (e.g., `pStats(winner).physical >= 7` → "A dominant physical performance.")
- Torch-snuff on loser portrait (same `.torch-snuffed` CSS class as Vote Reveal) — only if this is a final elimination (i.e., `gs.riPlayers` no longer contains loser after this episode)

Time-of-day: midday (arena).

### 5.11 WHY This Vote Happened *(existing — gap fixes)*

**Three additions:**
1. **Comfort blindspot:** If `ep.comfortBlindspotPlayer === ep.eliminated`, add a fire-accent callout: *"[Name] was seen checked out at camp before Tribal — the tribe noticed."*
2. **Rival tip-off:** In the idol misplay ally analysis — when rendering a `tipOffAlly` entry — if `entry.isRivalTipOff === true`, append: *"(Note: this ally was in a rival alliance.)"*
3. **Alliance recruitment:** If `ep.allianceRecruits?.length > 0`, add a section: list each `{ player → toAlliance }` and note: *"This shifted the numbers going into Tribal."*

**Data:** `ep.comfortBlindspotPlayer`, `ep.eliminated`, `ep.idolMisplays`, `ep.allianceRecruits`, `ep.tipOffBetrayalFired`

Time-of-day: post-tribal / early dawn.

### 5.12 Pre-Tribal Twists / Post-Vote Twists *(existing — label fix + style upgrade)*

**Label fixes:**
- Pre-tribal twist → sidebar label: `"Pre-Tribal Events"`
- Post-elim twist → sidebar label: `"Post-Vote Twist"`

**Style:** Both screens:
- Twist title: Anton, `font-size: 36px`, `text-shadow: 0 0 20px #f0c040, 0 0 8px rgba(240,192,64,0.5)` (gold glow)
- Twist body: `.vp-card` with `background: rgba(240,192,64,0.04)`, gold-accent border
- Entrance: `transform: scaleY(0) → scaleY(1)`, `transform-origin: top center`, `--ease-broadcast`, 400ms

Time-of-day: Pre-tribal → dusk. Post-vote → deep night.

---

## 6. What Does Not Change

- Single-file architecture (`simulator.html`) — no file splitting
- Existing font stack (Anton / DM Sans / Space Mono) — extended, not replaced
- Existing `vpPageIn` entrance animation — kept
- Existing badge system (`badgeText` / `badgeClass`) — extended with new badge types
- Existing `tribeColor()`, `pronouns()`, `pStats()`, `threatScore()`, `getBond()` helpers — used as-is
- Pre-merge Camp Life behavior

---

## 7. Files Changed

- `simulator.html` — all VP builder functions, CSS additions
- No other files
