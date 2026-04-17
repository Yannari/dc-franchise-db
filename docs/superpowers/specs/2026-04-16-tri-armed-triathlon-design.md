# Trial by Tri-Armed Triathlon — Design

Date: 2026-04-16 (spec updated 2026-04-17 to match shipped implementation)
Scope: New post-merge challenge — complete simulation engine + VP + text backlog + integration.
Target file: `js/chal/tri-armed-triathlon.js`.

## Identity

**Tournament-bracket game-show stage.** Black stage floor, tournament red + bracket gold accents, iron-gray handcuff chain. The signature visual hook is the **handcuff chain SVG linking paired portraits** — it persists across the three sub-challenges so every card featuring a pair reads immediately as a duo. Deliberately distinct from:

- Off the Chain (orange/red motocross + HP bars)
- Wawanakwa Gone Wild (tan/gold ranger field-cam + scanlines)
- Say Uncle (stone dungeon torches)
- Brunch of Disgustingness (cafeteria slime tile)
- Hide and Be Sneaky (green CRT night-vision)

Palette: `#0f0f10` stage black, `#c8310a` tournament red, `#d4a017` bracket gold, `#6a6a6a`/`#4a4a4a` iron gray (chain), `#8a3aaa` cave purple. No wood-brown, no rope/bark.

Fonts: body `'Roboto Slab','Georgia',serif`. Display headers `'Impact','Arial Black',sans-serif`. Ticker + digits `'Courier New',monospace`.

## Triggering

Post-merge challenge. Requires **even** number of active players (≥ 4). The twist selector blocks selection when the active player count is odd. If an odd count sneaks through (e.g. mid-episode elimination), the least-dramatic player sits out as a spectator (flagged, no invincibility eligibility, `chalMemberScores[spectator] = 0`). Minimum 4 players (2 pairs); 6 is the canonical sweet spot (3 pairs = full triple-tie dramatics).

Twist ID: `tri-armed-triathlon`. Engine type: `tri-armed-triathlon`. Mutually exclusive with all other challenge twists.

## Core mechanics

### Pairing phase

Players are sorted descending by total drama score (sum of absolute bond values with all other players). The sorted list is then **interleaved**: `pair[0] = [sorted[0], sorted[n-1]]`, `pair[1] = [sorted[1], sorted[n-2]]`, etc. This spreads high-drama players across all pairs rather than concentrating them in one.

If the cast is odd, the least-dramatic player (last after sort) sits out as spectator before interleaving.

`_computeArchPair(a, b)` classifies each pair: `villain_hero`, `rivals` (bond ≤ -3), `showmance`, `strangers` (bond ≤ 1), `default`.

### Wimp Key offerings

Before EACH sub-challenge (3 total), every active pair gets a wimp-key offer. If they take it:
- Pair is freed from handcuffs.
- Pair is **eliminated from invincibility** for the rest of the triathlon.
- Both players remain in the game.
- Emits `wimpKeyOffer` (one event for all pairs' decisions) then a separate `wimpKeyTaken` per pair that accepts.
- Each member takes -2 popularity.

**Decision algorithm** — each member's individual inclination:

```
base:        0.10
bond < -2:  +0.20  (can't stand their partner)
boldness < 3: +0.15
mishapCount ≥ 2: +0.22  (not applicable offer #0 — mishaps haven't fired yet)
villain/mastermind/schemer archetype: -0.08
hero/loyal-soldier/underdog archetype: -0.10
offerIndex === 0: -0.05
```

Pair takes the key if `Math.random() < inclA && Math.random() < inclB` (both must roll pass). Expected rates: ~1-4% on offer 0 for typical pairs; ~10-20% on offer 2 for high-mishap low-boldness rivals.

The `wimpKeyOffer` event renders as a **full-width establishing card** (`.tr-wimp-key-screen`) with a large rotating 🔑 SVG, per-pair decision stamps (REFUSED green / TAKEN chain-break red).

### Sub-challenge 1: Competitive Chowdown

Eat-off. Each pair has a feeder (one arm free) and an eater (no arms). Fastest to empty the platter wins.

**3-phase structure:**

**Phase 1 — Opening:** Chef removes cloches (`chowdownSetup` setpiece card — steam, platters, green chicken). Then `roleDecision` event fires — the role assignment is a narrative character beat with four weighted subtypes:

- `armWrestle` — rivals / high-tension pairs (×3 weight)
- `bully` — villain archetype present (×3 weight)
- `agree` — showmance / calm pairs (×3 weight)
- `volunteer` — hero/loyal-soldier archetype present (×2 weight)

Winner of role determination is feeder; the other is eater.

**Handcuff events (Phase 1.5):** If `feeder.physical < 5`, `shortChainReach` fires — rate penalty -1 (or -2 if physical < 4). If physical < 4, `pair.tooShortArms = true` (used in clutch phase).

**Phase 2 — Mid:** 2-3 events from `rhythm` / `grossOut` / `cheat` (cheat only for villain/strategic schemer archetypes).

**Phase 3 — Clutch:** 1 event from `smashFood` / `vomit` / `pushThrough`. If `pair.tooShortArms`, `smashFood` weight ×5 — the arms-can't-reach gag forces the iconic smash move.

**Scoring:** `feedRate = feeder.physical + feeder.strategic×0.5 + eater.endurance×1.2 - eater.mental×0.5 + rand(-3,3) + chemMod`. Rate adjusted by event deltas. **Highest `feedRate` wins.**

**Chemistry mod** (`_getChemMod`): showmance +2, rivals -2, villain+hero -1, high-bond (≥4) +1, low-bond (≤-2) -1.

**Outcome:** `chowdownWon = true` for winning pair. Emits `chowdownWin` event.

### Sub-challenge 2: Cursed Idol Haul

Four phases: canoe-out → find-idol → piggyback-back → face-the-cave. **First pair to return the idol to the cave wins** (lowest `idolTime`).

**Time model:** `pair.idolTime = 90 + rand(-10, 10)` seconds (base). Events add or subtract time (`_timeDelta`). Lower time = faster finish = winner.

**Establishing event:** `caveApproach` card fires before per-pair events — cave-mouth SVG, dangling spider, wooly-beaver shadows in darkness.

**Per-phase events and time deltas:**
- `canoe`: argue (+5s), nav (-4s), weight (+5s), bond (-4s)
- `find`: package (-4s), curse (+5s)
- `piggyback`: stumble (+5s), heart (0s), joke (0s)
- `cave`: spider panic (+8s / +20s if bold avg < 5), wooly (+8s), clutch throw (-10s)

**Handcuff event:** `chainSnag` fires 30% of the time during piggyback — chain catches on terrain, +5s.

**Chemistry mod:** rivals +10s, showmance -8s, high-bond (≥4) -5s.

**Rubber-banding:** the chowdown winner pair gets +12s penalty (they're already ahead).

**Outcome:** lowest `idolTime` pair wins. `idolWon = true`. Emits `idolWin` event.

### Sub-challenge 3: Totem Pole of Shame

Build a totem of wooden heads of all previously eliminated players, **in correct elimination order** (first-boot at bottom). **First pair to correctly assemble wins** (lowest `totemTime`).

**Data source:** `gs.eliminated[]` — player names in elimination order.

**Time model:** `pair.totemTime = 60 + rand(-8, 8)` seconds (base). Events add time via `_timeDelta`. Lower = faster.

**Per-pair events** (2-3 per pair):
- `confusion` (+15s) — similar-sounding eliminated names (detect via same first letter and similar length)
- `badmouth` (0s, villain popularity -1) — villain insults eliminated players while assembling
- `defend` (0s, hero popularity +1) — nice player defends the eliminated
- `carved` (0s) — romantic spark with eliminated player; carves heart on a head
- `breakdown` (+5s, bond -3) — villain+hero pair: moral conflict over totem assembly

**Handcuff event:** `chainStretch` fires 35% of the time — chain prevents one member from reaching top and bottom simultaneously, +8s.

**Chemistry mod:** rivals +8s, showmance -5s.

**Rubber-banding:** idol winner pair gets +10s penalty.

**Per-pair totem visualization:** `totemResult` event fires after all pairs finish — renders each pair's attempted stack as a vertical list of eliminated-player names with ✓ (correct) / ✗ (wrong position) per head. Pairs with `_hadConfusion` have 1-2 adjacent heads swapped from correct order.

**Outcome:** lowest `totemTime` wins. `totemWon = true`. Emits `totemWin` event.

### Final scoring

Each sub-challenge = 1 point. Pair with most points wins invincibility.

Tie-breakers:
- One pair has 2 or 3 wins → that pair wins invincibility.
- All eligible pairs are tied at 1 win each → **triple-tie → NO INVINCIBILITY** (entire cast is vulnerable). This is the headline feature.
- Multiple pairs tied but not all at 1 → the multi-tied pairs share the top; no invincibility awarded (safer fallback).
- Pairs that took a wimp key are excluded from the eligible set.
- All pairs took the wimp key: nobody eligible, nobody wins invincibility.

**3-part final reveal** (sequential events, each click-to-reveal):
1. `finalRecap` — per-sub-challenge summary table (pair × chowdown/idol/totem ✓/✗)
2. `finalTally` — big-number win counts per pair
3. `finalOutcome` — gold banner "INVINCIBILITY → [pair]" OR red hazard-stripe "NO INVINCIBILITY · EVERYONE IS VULNERABLE" (triple-tie + camera shake)

## Event types (timeline)

All emitted by the simulation, consumed by the VP renderer and text backlog.

- `chrisIntro` — Chris announces the challenge
- `pairingReveal` — each pair announced one at a time
- `handcuffed` — pair's bond/archetype assessment
- `wimpKeyOffer` — before each sub-challenge (3 events); carries `decisions[]` with each pair's taken/refused result
- `wimpKeyTaken` — separate event per pair that accepts (may be 0 per offer)
- `chowdownSetup` — setpiece: cloche removal, green chicken reveal
- `chowdownEvent` — all chowdown beats: `roleDecision`, `shortChainReach`, `rhythm`, `grossOut`, `cheat`, `smashFood`, `vomit`, `pushThrough`
- `chowdownWin` — pair wins Challenge 1
- `caveApproach` — establishing card before idol haul per-pair events
- `chrisQuip` — Chris one-liner (idol haul intro, between events)
- `idolCanoeEvent` — canoe phase (argue/nav/weight/bond)
- `idolFindEvent` — find phase (package/curse)
- `idolPiggybackEvent` — piggyback phase (stumble/heart/joke/chainSnag)
- `idolCaveEvent` — cave phase (spider/wooly/panic/clutch)
- `idolWin` — pair wins Challenge 2
- `totemSetup` — Chris unveils wooden heads
- `totemEvent` — all totem beats: `confusion`, `badmouth`, `defend`, `carved`, `breakdown`, `chainStretch`
- `totemWin` — pair wins Challenge 3
- `totemResult` — per-pair totem visualization (correct/incorrect head stack)
- `finalRecap` — sub-challenge summary table
- `finalTally` — big win-count numbers
- `finalOutcome` — gold winner banner or red no-immunity hazard

All events carry `players: [...]` array, `badgeText`, `badgeClass`. Per-pair events carry `pairId` and `players: [memberA, memberB]`.

## Hunter state (per-player transient)

Per-player state tracked in `triState.players[name]`:

```js
{
  pair: string,              // partner's name
  pairId: number,            // 0, 1, 2, ...
  wimpKeyTaken: boolean,
  chowdownRole: 'eater' | 'feeder' | null,
  mishapCount: number,
  badges: string[],
}
```

Per-pair state on `triState.pairs[pairId]`:

```js
{
  id: number,
  members: [string, string],
  wimpKeyTaken: boolean,
  chowdownRate: number,         // final rate after all events
  chowdownWon: boolean,
  idolTime: number,             // lower = faster = winner
  idolWon: boolean,
  totemTime: number,            // lower = faster = winner
  totemWon: boolean,
  totalWins: number,            // 0-3
  bond: number,                 // starting bond between pair
  archPair: string,             // 'villain_hero' | 'rivals' | 'showmance' | 'strangers' | 'default'
  tooShortArms: boolean,        // feeder.physical < 4 — smashFood weight ×5 in clutch
  _hadConfusion: boolean,       // totem result shows swapped heads
}
```

## Scoring & records (integration)

- `updateChalRecord(ep)` with `ep.chalMemberScores` — each active player gets a score based on their pair's performance (higher if they were on the winning pair, modest if second, low if wimp-keyed). See `js/players.js` for the API.
- Challenge record update is handled by the twist engine — do NOT call `updateChalRecord` again in the main episode flow (skip-list pattern).

## Invincibility & vote effects

- Winning pair: BOTH members are immune for this tribal.
- Triple-tie: NO ONE is immune — entire cast is vulnerable.
- Wimp-key pair: not immune, vulnerable.
- Heat: pairs that argued a lot get small bond damage (-1 to -2). Pairs that bonded over adversity gain +2 to +3. Showmance pairs get a romance spark bump if they worked together well (high chemistry checked in `_checkShowmanceChalMoment`).

## Popularity effects

- Badmouthing eliminated players in totem phase → -1 per badmouth event.
- Defending eliminated players → +1 per defense.
- Taking the wimp key → -2 (cowardly).
- Clutch moments (last-throw idol, smash-food-in-face, correct totem at the last second) → +1 to +2.
- Cheating caught during chowdown → -1.

## VP design

### Page chrome

- Root `.tr-page` — `#0f0f10` black background, red radial gradient from top (`rgba(200,49,10,0.22)`).
- Header `.tr-header`:
  - Title "TRIAL BY TRI-ARMED TRIATHLON" in Impact/Arial Black, tournament red `#c8310a`, all-caps, 4px letter-spacing
  - Chain decoration `🔗` in `#6a6a6a` on each side (slow sway animation)
  - Subtitle "3 CHALLENGES · 3 PAIRS · ONE KEY TO FREEDOM" in bracket gold `#d4a017`
- Ticker band `.tr-ticker` — Courier monospace, 10px, red/gold border top/bottom. 18+ lines of content: challenge rules, Chris quips, reality-TV meta lines.
- Sticky scoreboard `.tr-scoreboard` — 3 tournament-bracket lane slots. When a sub-challenge is won, the slot animates in the winning pair. Black background `rgba(10,10,12,0.97)`, red top border, gold bottom border.
- Per-pair **progress dots** `.tr-pair-dots` — one dot per slot per pair in the scoreboard. Dot fills gold with pop animation when a pair wins that sub.
- Stopwatch `.tr-stopwatch` — circular red ticking hand in top-right of scoreboard.

### Pair banner (signature visual)

```
[portrait A]  [🔗 chain 🔗]  [portrait B]
```

Chain: 3 links, each 18×10px ellipse with metallic shimmer gradient (`#9a9a9a → #4a4a4a → #b0b0b0 → #5a5a5a`). Middle link jiggles ±15° (was ±5° in original). When a pair takes the wimp key, the chain links offset apart (`.tr-pair-banner--broken`).

`.tr-pair-banner` — standard (used in most events). `.tr-pair-banner--hero` — hero size variant with 22×12px chain links, used in pairing-reveal and wimp-key-offer cards.

### Cards

Per-event `.tr-card`:
- `rgba(20,20,25,0.9)` dark background
- Left border 4px solid `var(--tr-accent, #c8310a)`
- Label strip `.tr-card-label` — Impact/Arial Black, 9px, accent color, all-caps
- Body `.tr-card-body` — 12px, Roboto Slab
- Footer `.tr-card-footer` — Courier New, 8px, gray

Variants:
- `.tr-card--chowdown` — red accent `#c8310a`
- `.tr-card--idol` — pine green accent `#2a7a2a`, dark green background
- `.tr-card--totem` — gold accent `#d4a017`
- `.tr-card--wimp` — crimson `#cc3333`, dark red bg `rgba(40,10,10,0.92)`
- `.tr-card--mishap` — shake animation + crimson accent
- `.tr-card--cave` — purple accent `#8a3aaa`, near-black bg `rgba(10,5,20,0.95)`
- `.tr-card--setpiece` — 2px solid red border (heavier weight for establishing beats)

### Setpiece cards

**Chowdown setup** (`.tr-card--setpiece`): 3 platter emojis in `.tr-platter`, animated steam `.tr-steam` rising above each. Green chicken steam uses `.tr-steam--green`.

**Cave approach** (`type: 'caveApproach'`): cave-mouth description, spider dangling, wooly-beaver shapes. Uses `.tr-card--cave`.

**Wimp key establishing screen** (`wimpKeyOffer`): `.tr-wimp-key-screen` — full-width, dark red gradient bg, 2px `#cc3333` border. Large rotating 🔑 (`.tr-wimp-key-icon`, 10s spin), big "THE WIMP KEY" title (22px Impact), subtitle. Per-pair decision stamps follow inline (REFUSED green / TAKEN crimson).

### Totem result visualization

`totemResult` event renders a vertical `.tr-totem-stack` of `.tr-totem-head` pills — one per eliminated player in correct order. Correct positions are styled normally; incorrect (swapped) positions use `.tr-totem-head--wrong` (red border, pink text).

### Final reveal

Three sequential click-to-reveal events:
1. **finalRecap** — `.tr-recap-table` (Courier, 11px): pair names × chowdown/idol/totem, ✓ or ✗ per cell.
2. **finalTally** — `.tr-tally-grid`: big 48px Impact numbers per pair (`#d4a017` gold, or `#3a3a3a` if zero wins).
3. **finalOutcome** — Either `.tr-final-banner` (gold radial gradient, "INVINCIBILITY → [pair portraits]") or `.tr-no-immune` (red/black diagonal hazard stripes, "NO INVINCIBILITY · EVERYONE IS VULNERABLE" + camera shake).

### Reveal engine

Click-to-step-through pattern (same as Off the Chain / Wawanakwa):
- `_trReveal(stateKey, totalSteps)` — advance one step
- `_trRevealAll(stateKey, totalSteps)` — reveal everything
- Camera shake on: `grossOut`, `vomit`, cave panic, `breakdown`, `finalOutcome` triple-tie
- Stamp-slam on: sub-challenge wins
- Chain-break on: `wimpKeyTaken`
- Slot fill + dot pop on: sub-challenge wins

## Text pools

### Chris intros (6 variants)

Each intro covers: triathlon concept + handcuff twist + 3 sub-challenges preview.

### Pairing-reveal flavor (4 variants each)

Per archetype-pair type: `villain_hero`, `rivals`, `showmance`, `strangers`, `default`.

### Cloche-reveal pool (4 variants)

Chef removes cloches; green chicken twitches.

### Role-decision text pools (3 variants each)

Per role-decision subtype: `armWrestle`, `bully`, `agree`, `volunteer`. Templates take `(a, b, winner/victim/vol)`.

### Chowdown events (3-4 per subtype)

- rhythm, grossOut, cheatCaught, cheatSneaky, smashFood, vomit

### Idol events per phase (4 per subtype)

- canoe: canoeArg, canoeNav, canoeWeight, canoeBond
- find: findPackage, findCurse
- piggyback: piggyStumble, piggyHeart, piggyJoke
- cave: caveSpider, caveWooly, caveClutch

### Totem events (3-4 per subtype)

- confusion, badmouth, defend, carved, breakdown

### Ticker (18+ lines)

Challenge rules + final-stretch meta flavor + fake Chris sponsor banters. Repeats at 40s scroll.

## Integration touch-points

1. `js/chal/tri-armed-triathlon.js` — new file. Exports `simulateTriArmedTriathlon(ep)`, `rpBuildTriArmedTriathlon(ep)`, `_textTriArmedTriathlon(ep, ln, sec)`.
2. `js/episode.js` — import `simulateTriArmedTriathlon`, route when `twist.engineType === 'tri-armed-triathlon'`.
3. `js/twists.js` — register new twist definition (id `tri-armed-triathlon`, post-merge only, min 4 players, mutually exclusive with all other challenges). Engine routing.
4. `js/main.js` — add to the engine map.
5. `js/vp-screens.js` — register `rpBuildTriArmedTriathlon`.
6. `js/text-backlog.js` — register `_textTriArmedTriathlon`.
7. `js/savestate.js` — `patchEpisodeHistory` handling for the new event shape (ensure `ep.triArmedTriathlon` persists and restores correctly).
8. Challenge skip-list in main `updateChalRecord` flow (if present) — add the new twist's `skipMainChalRecord: true` flag.
9. Season config — optional pairing-bias toggle (default on). Added to the Episode Format Designer if that UI accepts new challenge toggles.

## Testing

Manual via `simulator.html`:

1. Trigger post-merge with ≥4 active players, force `tri-armed-triathlon` twist.
2. Verify VP renders with tournament-stage identity (black/red/gold — no wood or rope colors).
3. Click through every reveal:
   - Pairing reveal shows pair banners with 18×10 iron chains, ±15° jiggle.
   - Wimp-key screen is full-width with rotating key; per-pair REFUSED/TAKEN stamps.
   - Chowdown: roleDecision fires before eating events; tooShortArms triggers smash in clutch.
   - Cave approach setpiece fires before idol per-pair events.
   - Totem: per-pair result stacks show ✓/✗ per head.
   - Final reveal is 3 separate steps (recap → tally → outcome).
4. Scoreboard slots fill as sub-challenges complete; progress dots pop per pair.
5. Hero pair-banner (`--hero`) appears on pairing-reveal and wimp-key cards.
6. `ep.chalMemberScores` populated; main flow doesn't double-record.
7. Odd player count blocked at selector UI; even count proceeds.
8. With 8 players (4 pairs), challenge runs without crash.
9. Text backlog covers all phases + triple-tie and single-winner outcomes.
10. Console clean.

## Balance targets

Run `docs/superpowers/balance/tri-armed-balance.mjs` before heavy production use. Target thresholds:

| Metric | Target |
|---|---|
| Triple-tie rate (3 pairs, 6 players) | 15-30% |
| Wimp-key taken per offer per pair | 2-8% (primary metric) |
| Wimp-key taken per episode | 30-60% (9 offer chances × ~6%/offer; cast-dependent) |
| Sub-challenge distribution (chowdown/idol/totem wins spread) | 28-38% per pair slot (balanced) |
| Rubber-band effect (sub-winner sweeps all 3) | < 15% |

## Non-goals

- No new gameplay systems beyond the above.
- No sound.
- No Beat-per-attempt encounter system (that's a Hunt Encounters pattern).

## Risks and mitigations

- **Pair count edge cases.** Odd player count, 2 players (1 pair only), 10+ players. Mitigation: clamp minimum (≥4), spectator for odd, scale pair count dynamically, test 2-3-4 pair runs.
- **Data dependency on `gs.eliminated` for totem.** If eliminated list is empty (pre-merge accidentally triggered), skip totem phase gracefully.
- **Triple-tie rate.** Rubber-banding increases triple-tie organically but rate is probabilistic. The balance script provides empirical measurement. At ≥30% triple-tie rate the mechanic loses impact — adjust rubber-band penalties if needed.
- **File size.** ~1800-2200 lines (text pools dominate). Acceptable per project pattern.
