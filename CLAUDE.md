## Project
DC Franchise Simulator — a Survivor-style franchise simulator.
Everything lives in a single file: `simulator.html` (~55,000+ lines).
Do not split it into separate files. This is intentional.

## Architecture
- `simulator.html` — the entire app: CSS + engine in one file
- `franchise_roster.json` — player database (name, stats, archetype, slug)
- `assets/avatars/` — player portrait images (slug-named PNGs)
- `DATA_SEASON/` — ideas backlog, season planning notes

## Non-Negotiable Rules

### Stats are ALWAYS Proportional
**NEVER use `if (stat >= X)` threshold checks for gameplay effects.** Use `stat * factor` so every point matters. Thresholds are ONLY acceptable for narrative TEXT variant selection.

### Behavior > Stats
A loyalty 10 player who betrayed 3 times is NOT loyal. Check behavioral track record alongside raw stats.

### Archetype Access
`pStats(name)` returns stats ONLY — no archetype. Use `players.find(p => p.name === name)?.archetype` for archetype lookup. This has caused bugs multiple times.

### Pronouns — NEVER Hardcode
`pronouns(name)` → `{sub, obj, pos, posAdj, ref, Sub, Obj, PosAdj}`. Use `posAdj` before nouns ("her head"), `pos` standalone ("it's hers"). NO `Pos` property exists.

### Serialization
Functions don't survive `JSON.stringify`. Pre-render all text as strings at simulation time. Sets need `prepGsForSave()`/`repairGsSets()`.

### Every Feature Needs Both VP + Text Backlog
VP screens (`rpBuild*`) for visual viewer. Text backlog (`_text*` functions) for plain-text log. Neither is optional.

### Camp Events Must Have Consequences
Bond changes, state changes, or information flow. Text-only events are cosmetic and waste screentime. Events MUST include `players: []` array + `badgeText`/`badgeClass`.

## Challenge System Rules

### Scoring Balance
**Tribe scores MUST use averages per member, NEVER raw sums.** A 5-member tribe must have the same chance as an 8-member tribe. Balanced: avg/member, percentage, fixed count, last-standing. Broken: summing all members' scores.

### Required Per Challenge
- `updateChalRecord(ep)` with `ep.chalMemberScores` for podium/bomb tracking
- Debug → Challenge tab breakdown (non-negotiable)
- VP screen + text backlog + cold open recap + timeline tag
- Badge text + badge class entries for all event types
- Episode history fields + `patchEpisodeHistory`
- All challenge twists mutually incompatible
- Skip main `updateChalRecord` call (add to the skip list in simulateEpisode)
- **Showmance moments:** Check if the challenge structure supports romantic moments (downtime,
  partner interactions, danger). If yes, add showmance challenge moments. If not, don't force it.
  Challenges with intimate/social phases (overnight, canoe partners) = yes.
  Pure competition challenges (dodgeball, sudden death) = no.

### VP Pattern
- `_tvState[key]` with `idx: -1` for click-to-reveal
- Save/restore `.rp-main` scrollTop on reveal clicks
- Registered in `buildVPScreens()` — exclude from `rpBuildPreTwist` filter

## Key Engine Functions
- `simulateVotes()` — tribal vote logic
- `checkIdolPlays()` / `checkNonIdolAdvantageUse()` — advantage plays at tribal
- `computeHeat()` — vote targeting pressure. Third param is alliances array (NOT ep).
- `resolveVotes()` — elimination + tie handling
- `handleAdvantageInheritance()` — called BEFORE stripping advantages on every elimination
- `formAlliances()` — pre-tribal alliance formation
- `generateCampEvents()` / `generateCampEventsForGroup()` — camp narrative
- `patchEpisodeHistory(ep)` — patches missing fields after history push
- `checkSocialPolitics(ep)` — side deals, info trades, loyalty tests
- `checkPerceivedBondTriggers(ep)` / `updatePerceivedBonds(ep)` — perception gaps

## Core State
- `gs` — global game state. `gs.episodeHistory[]` for VP viewer.
- `getBond(a,b)` / `addBond(a,b,delta)` — symmetric bonds (-10 to +10)
- `getPerceivedBond(a,b)` — what player A *thinks* the bond is (for votes/alliances/heat)
- `gs.advantages[]`, `gs.namedAlliances[]`, `gs.showmances[]`, `gs.loveTriangles[]`, `gs.affairs[]`
- `gs.sideDeals[]`, `gs.moles[]`, `gs.perceivedBonds`
- `gs.romanticSparks[]` — slow-burn romance sparks (intensity grows → first move → showmance)
- Temporary heat: `gs._emissaryHeat`, `gs._dodgebrawlHeat`, `gs._talentShowHeat`, `gs._suckyOutdoorsHeat`, `gs._upTheCreekHeat` (all use `{ amount, expiresEp }` pattern)

## Scope Gotchas
- `ep` NOT available in: `generateCampEventsForGroup`, `simulateIndividualChallenge`, `simulateTribeChallenge`, `computeHeat`
- Pre-merge vs post-merge are separate branches — features for BOTH go AFTER the if/else
- `ep.extraImmune` written by multiple systems — always MERGE, never overwrite
- `applyTwist` fires BEFORE the challenge — `ep.winner`/`ep.loser` don't exist yet. Challenge twists must set flags in applyTwist, then run logic in simulateEpisode after the challenge.
- Merge tribe key: `gs.mergeName || 'merge'` for post-merge camp events

## Bond System
- Range: -10 to +10. `getPerceivedBond` for decision systems, `getBond` for everything else.
- Positive cooling: bonds above +4.0 drift down (floor +3.0, showmances exempt)
- Recovery: bonds below -3.0 soften toward -2.0 floor

## Advantage System
- Types: idol, beware, voteSteal, extraVote, kip, legacy, amulet, secondLife, teamSwap, voteBlock, safetyNoPower, soleVote
- `handleAdvantageInheritance()` on every elimination path
- Super Idol plays AFTER votes read. Team Swap shifts twist schedule.
- RI check: `isRIStillActive()` before every elimination

## Challenge Twists (Pre-Merge)

| ID | Name | Key Mechanic | VP |
|---|---|---|---|
| `phobia-factor` | Phobia Factor | Fear completion %, clutch triple points | Confessions + challenge |
| `cliff-dive` | Cliff Dive | 3-phase: jump/haul/build, chicken blame | Per-player reveal |
| `awake-a-thon` | Awake-A-Thon | 3-phase: run/feast/awake, mid-challenge social events | Sequential dropout |
| `dodgebrawl` | Dodgebrawl | Multi-round dodgeball, per-player elimination tracking | Per-round with counters |
| `talent-show` | Talent Show | Auditions → backstage → show with Chef-O-Meter, sabotage | Auditions + backstage + stage |
| `sucky-outdoors` | Sucky Outdoors | 5-phase overnight survival, lost player auto-loss | Ambiance progression |
| `up-the-creek` | Up the Creek | 4-phase canoe race, partner selection, Boney Island, fire building | Water/jungle/fire/sunset |

### Challenge Twists (Post-Merge)

| ID | Name | Key Mechanic |
|---|---|---|
| `say-uncle` | Say Uncle | Endurance torture, dominator pick + backfire |
| `triple-dog-dare` | Triple Dog Dare | Sudden death, freebie economy, replaces tribal |
| `sudden-death` | Sudden Death | Last place auto-eliminated |
| `slasher-night` | Slasher Night | Round-by-round hunt, lowest scorer eliminated |

## Other Key Systems

### Romance
- Toggle: `seasonConfig.romance = 'enabled' | 'disabled'`. Guards on ALL romance functions.
- Slow burn pipeline: spark → intensity growth → first move → showmance
- `gs.romanticSparks[]`: `{ players, sparkEp, intensity, fake, saboteur }`. Intensity grows ~0.1-0.3/ep.
- `checkFirstMove(ep)`: fires when intensity reaches archetype threshold (showmancer 0.5, hero 1.0, loyal 1.2)
- Challenge showmance moments: protective, jealousy, sacrifice, PDA — via `_checkShowmanceChalMoment()`
- Showmance sabotage: villain kisses partner to destroy couple — `checkShowmanceSabotage(ep)`
- Asexual orientation: `romanticCompat` returns false. Blocks all romantic triggers.
- When disabled: bonding events use platonic text. No sparks, no showmances, no triangles, no affairs.
- Showmances → love triangles → secret affairs. Full lifecycle with bond/popularity/camp event consequences.

### The Mole
Season-level twist. 5 sabotage types. Per-observer suspicion tracking. Exposure at threshold 3.0.

### Social Politics
3-5 actions/episode: side deals, info trades, loyalty tests. Vote pitches at tribal.

### Aftermath Show
Truth or Anvil (12 contradiction types), Unseen Footage, Fan Call, Host Roast, Reunion.

### Emissary Vote
Winning tribe sends emissary to losing tribe's tribal → second elimination. No idol protection.

## Collaboration Style
- Think independently — brainstorm and propose, don't copy exact words
- Always propose ideas before implementing
- Camp events MUST have gameplay consequences
- When a mechanic creates information, it must flow into targeting or it's cosmetic
