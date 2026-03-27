# Slasher Night Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder slasher-night twist with a full horror survival challenge — round-by-round scoring, personality-driven events, final showdown, auto-elimination, and 7 VP screens with dark atmosphere.

**Architecture:** Everything lives in `simulator.html`. The engine adds `simulateSlasherNight(ep)` which runs the round-by-round challenge and returns full results. VP adds `rpBuildSlasherNight(ep)` and related screen builders. Visual adds a new `'slasher'` particle profile.

**Spec:** `docs/superpowers/specs/2026-03-27-slasher-night-design.md`

**Tech Stack:** Vanilla JS, single-file architecture, existing VP screen patterns.

---

### Task 1: Engine — Event Pool & Scoring Constants

**Files:**
- Modify: `simulator.html` — add after the `CHALLENGE_DB` array (around line ~2949)

- [ ] **Step 1: Add the slasher event pool and constants**

Add `SLASHER_EVENTS` object with positive/negative event arrays, caught scenes, atmosphere lines, final showdown win/lose methods. Each event has: `id`, `points`, `statCheck` (function), `archetypeBonus` (array), `bondEffect` (object), `textVariants` (array of template strings using `{name}`, `{ally}`, `{enemy}`, `{pr}` placeholders).

Add `SLASHER_FINAL_WIN` and `SLASHER_FINAL_LOSE` arrays for the showdown.

Add `SLASHER_CAUGHT_SCENES` array.

Add `SLASHER_ATMOSPHERE` array of between-round lines.

Key constants:
```js
const SLASHER_ROUND_SURVIVAL_BONUS = 2;
const SLASHER_DIMINISHING_RETURNS = { 1: 0, 2: -1, 3: -2 }; // per repeat
const SLASHER_OVERCONFIDENCE_CHANCE = 0.20;
const SLASHER_GROUP_CATCH_MOD = { solo: 2, pair: 0, group: -1 };
```

- [ ] **Step 2: Verify no syntax errors**

Open `simulator.html` in browser, check console for errors.

- [ ] **Step 3: Commit**

```
feat(slasher): add event pool and scoring constants
```

---

### Task 2: Engine — Core Simulation Function

**Files:**
- Modify: `simulator.html` — add `simulateSlasherNight(ep)` function near other challenge simulation functions

- [ ] **Step 1: Write `simulateSlasherNight(ep)`**

The function:
1. Determines round count: `Math.ceil(activePlayers.length / 2)`
2. Creates initial pairings based on bonds (bond >= 3 → paired, showmances always paired, bond <= 0 → avoid)
3. Loops through rounds:
   - For each surviving player: roll 1-2 events from the pool (weighted by stats + archetype + current situation)
   - Apply diminishing returns for repeated strategies
   - Roll overconfidence penalty for highest scorer (20% if boldness >= 6)
   - Determine who gets caught this round (weighted random using catch formula)
   - Freeze caught players' scores
   - Apply bond changes from events
   - Update pairings (partner caught → check loyalty response)
   - When 2 players remain → break to final showdown
4. Runs final showdown between last 2 (stat-weighted roll, archetype-driven methods)
5. Determines immunity winner (last standing) and eliminated (lowest score)
6. Returns full results object

Key return structure:
```js
ep.slasherNight = {
  rounds: [{ num, events: [{player, eventId, points, text, bondChanges}], caught: [{name, score, scene}], atmosphere }],
  scores: { [name]: number },
  caughtOrder: [{ name, round, finalScore }],
  pairings: { [name]: [allies] },
  finalShowdown: { winner, loser, winMethod, winText, loseMethod, loseText },
  immunityWinner: name,
  eliminated: name,
  leaderboard: [{ name, score, caughtRound }] // sorted by score desc
};
```

- [ ] **Step 2: Wire into `applyTwist`**

Replace the existing slasher-night block in `applyTwist` (line ~5001-5010):
- Remove old random slasher/victim logic
- Set `ep.isSlasherNight = true` flag only (simulation runs later in `simulateEpisode`)

- [ ] **Step 3: Wire into `simulateEpisode`**

Replace the existing slasher early-return block (line ~9456-9470):
- Call `simulateSlasherNight(ep)`
- Set `ep.eliminated = ep.slasherNight.eliminated`
- Set `ep.immunityWinner = ep.slasherNight.immunityWinner`
- Run journey + findAdvantages + generateCampEvents('pre') BEFORE the slasher challenge
- Run updatePlayerStates + decayAllianceTrust AFTER
- Save full slasher data to episode history

- [ ] **Step 4: Verify engine runs without crash**

Simulate a season with slasher-night scheduled. Check console for errors.

- [ ] **Step 5: Commit**

```
feat(slasher): core simulation engine with round-by-round scoring
```

---

### Task 3: Engine — Event Selection & Catch Targeting

**Files:**
- Modify: `simulator.html` — helper functions inside or near `simulateSlasherNight`

- [ ] **Step 1: Write `_slasherPickEvents(player, round, context)`**

Selects 1-2 events for a player this round. Context includes: allies nearby, group size, scores, previous events (for diminishing returns), archetype.

Logic:
- Build eligible positive events (stat checks pass)
- Build eligible negative events (stat checks trigger)
- Weight by: archetype bonus, situation (alone vs grouped), randomness
- Apply diminishing returns: if same event ID used before, reduce points
- Special events: overconfidence only if top scorer + boldness >= 6
- Social events: comfort, confession, betrayal discovery only with specific ally/bond conditions
- Return 1-2 events (1 guaranteed, 2nd fires ~40% of the time)

- [ ] **Step 2: Write `_slasherCatchTargeting(survivors, round, context)`**

Picks 1-2 players to catch this round.

Formula per player:
```js
catchWeight = max(0.1,
  (10 - boldness) * 0.3
  + (10 - intuition) * 0.2
  + (10 - physical) * 0.1
  + (isAlone ? 2 : 0)
  + (justScreamed ? 1.5 : 0)
  + (justArgued ? 1.0 : 0)
  - (isHiding ? 3 : 0)
  - (isBarricaded ? 2 : 0))
```

Number caught per round: 1 if <= 4 survivors, else 1-2 (weighted random, ~60% chance of 2 early, ~30% later).

Never catch the last 2 — those go to final showdown.

- [ ] **Step 3: Write `_slasherFinalShowdown(player1, player2)`**

Stat-weighted roll between last 2 players. Winner method selected by highest qualifying stat. Loser method selected by lowest stat or personality.

Shield push: only if winner is schemer + loyalty <= 4 + bond <= 0 with loser.
Heroic sacrifice: only if loser has loyalty >= 8 + bond >= 4 with winner.

Returns: `{ winner, loser, winMethod, winText, loseMethod, loseText }`

- [ ] **Step 4: Test full simulation**

Run 5+ slasher night episodes. Verify:
- Scores make sense (brave players score higher than cowardly ones)
- Catch order is reasonable (low-stat solos caught early, not always)
- Final showdown fires with 2 players
- Bond changes persist
- No crashes

- [ ] **Step 5: Commit**

```
feat(slasher): event selection, catch targeting, and final showdown
```

---

### Task 4: Engine — Text Log & Episode History

**Files:**
- Modify: `simulator.html` — `generateSummaryText` function and episode history push

- [ ] **Step 1: Add slasher night to text log**

In `generateSummaryText`, add a slasher-night section:
- Episode type: "SLASHER NIGHT — survival challenge. No tribal council."
- Per-round summary: who survived, who got caught, key events
- Final showdown: winner method, loser method
- Result: immunity winner + eliminated player + score
- WHY THEY DIDN'T SURVIVE: key negative events, who they were with, final score

- [ ] **Step 2: Update episode history push**

Save all slasher data to history:
```js
slasherNight: ep.slasherNight,
challengeType: 'slasher-night',
immunityWinner: ep.slasherNight.immunityWinner,
eliminated: ep.slasherNight.eliminated,
```

Plus standard fields: campEvents, twists, tribesAtStart, bewareLostVotes, etc.

- [ ] **Step 3: Update twist catalog description**

Change the `TWIST_CATALOG` entry for slasher-night to reflect the new design:
```
desc: 'A slasher hunts the tribe. Players are picked off round by round. Last one standing wins immunity. Lowest scorer is eliminated. No tribal council.'
```

- [ ] **Step 4: Verify text log output**

Run a slasher episode, check the text output in the Run tab. Should show full round-by-round narrative.

- [ ] **Step 5: Commit**

```
feat(slasher): text log and episode history integration
```

---

### Task 5: VP — Announcement & Round Reveal Screens

**Files:**
- Modify: `simulator.html` — add `rpBuildSlasherAnnouncement(ep)` and `rpBuildSlasherRounds(ep)` functions

- [ ] **Step 1: Write `rpBuildSlasherAnnouncement(ep)`**

Dark screen (`tod-deepnight`). Shows:
- Slasher portrait (`slasher.png`) center with red glow CSS
- Title: "Slasher Night"
- Rules text: "Last one standing wins immunity. Lowest scorer is eliminated."
- All player portraits in a grid

- [ ] **Step 2: Write `rpBuildSlasherRounds(ep)`**

Interactive round-by-round reveal using `_tvState` pattern (like vote reveals):
- Each round: header ("Round 1 — 10 players remain"), hidden by default
- REVEAL button shows the round's events as cards:
  - Player portrait + event text + point badge (green positive / red negative)
  - Bond change note if applicable
  - Caught players: "CAUGHT" red badge, greyed portrait, frozen score
- Atmosphere text between rounds
- Running score sidebar: all players ranked, caught players at bottom greyed
- "REVEAL ALL" button to skip ahead

- [ ] **Step 3: Wire into `buildVPScreens`**

In `buildVPScreens`, when `ep.isSlasherNight`:
- Replace the normal challenge/tribal/votes screens with:
  1. `rpBuildSlasherAnnouncement(ep)` → id: 'slasher-announce'
  2. `rpBuildSlasherRounds(ep)` → id: 'slasher-rounds'
- Skip voting plans, tribal, votes screens

- [ ] **Step 4: Test VP screens**

Open VP for a slasher episode. Verify announcement renders, rounds reveal correctly, scores update.

- [ ] **Step 5: Commit**

```
feat(slasher-vp): announcement and round-by-round reveal screens
```

---

### Task 6: VP — Final Showdown, Immunity & Elimination Screens

**Files:**
- Modify: `simulator.html` — add `rpBuildSlasherShowdown(ep)`, reuse existing patterns for immunity/elimination cards

- [ ] **Step 1: Write `rpBuildSlasherShowdown(ep)`**

Full-screen face-off layout:
- Both portraits large, VS divider
- Win method text with badge
- Lose method text with badge
- If shield push: show bond damage callout
- If heroic sacrifice: show bond boost callout + "LEGENDARY EXIT" badge

- [ ] **Step 2: Write `rpBuildSlasherImmunity(ep)` and `rpBuildSlasherElimination(ep)`**

Immunity card:
- Winner portrait with gold IMMUNITY badge
- How they won (final showdown method + key moments from rounds)
- Dawn-break visual theme (warm tones, relief)

Elimination card:
- Lowest scorer portrait with ELIMINATED badge
- Fear-themed elimination quote (use `vpGenerateQuote` with 'eliminated' mode)
- "Eliminated — Episode X" placement
- Torch snuff flame effect

- [ ] **Step 3: Write WHY THEY DIDN'T SURVIVE section**

Similar to `vpWhyCard` but adapted for slasher:
- Key negative events that tanked score
- Who they were (or weren't) with
- The moment it went wrong
- Final score vs next-lowest

- [ ] **Step 4: Write leaderboard screen**

Full results: all players ranked by score. Per-round breakdown columns. Green/red coloring. Caught round shown. Score bars animate like vote tallies.

- [ ] **Step 5: Wire all screens into `buildVPScreens`**

After rounds screen, add:
3. `rpBuildSlasherShowdown(ep)` → id: 'slasher-showdown'
4. `rpBuildSlasherImmunity(ep)` → id: 'slasher-immunity'
5. `rpBuildSlasherElimination(ep)` → id: 'slasher-elimination'
6. WHY section (inline in elimination screen)
7. Leaderboard → id: 'slasher-leaderboard'

Then flow into Camp Overview → Aftermath as normal.

- [ ] **Step 6: Test full VP flow**

Open VP for slasher episode. Click through all screens. Verify layout, data, animations.

- [ ] **Step 7: Commit**

```
feat(slasher-vp): showdown, immunity, elimination, and leaderboard screens
```

---

### Task 7: Visual — Particle Profile & Atmosphere CSS

**Files:**
- Modify: `simulator.html` — `_vpaProfiles` object, `_vpaScreenProfile` function, CSS styles

- [ ] **Step 1: Add `'slasher'` particle profile**

In `_vpaProfiles`:
```js
slasher: {
  count: 30,
  colors: ['#2d333b', '#444c56', '#1c2128', '#da363322'],
  size: [2, 6],
  vx: [-0.15, 0.15],
  vy: [-0.3, 0.1],
  life: [120, 250],
  glow: false,
  opacity: [0.08, 0.2],
  spawnY: 'any'
}
```
Slow fog/mist — dark grays with occasional red flicker.

- [ ] **Step 2: Map slasher screens to the particle profile**

In `_vpaScreenProfile`:
```js
if (screenId === 'slasher-announce' || screenId === 'slasher-rounds'
    || screenId === 'slasher-showdown' || screenId === 'slasher-elimination') return 'slasher';
if (screenId === 'slasher-immunity') return null; // dawn breaks — no particles
```

- [ ] **Step 3: Add slasher-specific CSS**

Add styles for:
- `.slasher-portrait-glow` — red pulsing glow on slasher portrait
- `.slasher-caught` — greyed + red-tinted border for caught players
- `.slasher-score-positive` / `.slasher-score-negative` — green/red point badges
- `.slasher-round-header` — increasingly dark background per round
- `.slasher-atmosphere` — italic, muted, centered between-round text

- [ ] **Step 4: Test visual atmosphere**

Open VP slasher screens. Verify fog particles, dark theme, red accents, portraits render correctly. Check `prefers-reduced-motion` disables particles.

- [ ] **Step 5: Commit**

```
feat(slasher-vp): particle profile and atmosphere CSS
```

---

### Task 8: Integration — Badge Handling, Camp Overview, Edge Cases

**Files:**
- Modify: `simulator.html` — `rpBuildCampTribe` badge block, `buildVPScreens`, edge case handling

- [ ] **Step 1: Add slasher event badges to `rpBuildCampTribe`**

In the `badgeText`/`badgeClass` block, add:
- `slasherSurvived` → "SURVIVED" (green)
- `slasherCaught` → "CAUGHT" (red)
- `slasherImmunity` → "IMMUNITY WINNER" (gold)
- `slasherEliminated` → "ELIMINATED" (red)

(These fire if slasher-related camp events are injected post-challenge.)

- [ ] **Step 2: Update `buildVPScreens` for full slasher flow**

When `ep.isSlasherNight`:
```
Cold Open → Camp (pre) → Slasher Announcement → Slasher Rounds →
Slasher Showdown → Slasher Immunity → Slasher Elimination →
Slasher Leaderboard → Camp Overview → Aftermath
```

Skip: normal challenge, voting plans, tribal, votes, post-vote twist screens.

- [ ] **Step 3: Handle edge cases**

- **3 players left:** Only 1 round before final showdown (quick slasher night)
- **Advantages:** Idols/amulets are irrelevant (no tribal vote) but track them for display
- **Beware holders:** Still lose their vote (irrelevant since no vote) but show in camp status
- **Double elimination twist + slasher:** Slasher replaces tribal entirely — double elim doesn't stack
- **Episode history `hasTribal` check:** `ep.isSlasherNight` should make `hasTribal = false`
- **Spoiler-free mode:** Slasher leaderboard + elimination hidden when toggled

- [ ] **Step 4: Update CLAUDE.md**

Add slasher night to the Key Engine Functions and VP screens sections.

- [ ] **Step 5: Full integration test**

Run a complete season with 1-2 slasher nights scheduled. Verify:
- Pre-slasher camp events fire normally
- Slasher challenge runs with correct scoring
- VP screens render all 7 screens
- Bond changes persist into next episode
- Eliminated player is removed from game
- Immunity winner tracked
- Text log is complete
- Spoiler-free mode works
- No crashes on replay/history viewing

- [ ] **Step 6: Commit**

```
feat(slasher): full integration, edge cases, and badge handling
```

---

## Task Summary

| Task | What | Estimated complexity |
|------|------|---------------------|
| 1 | Event pool & constants | Medium — lots of data, little logic |
| 2 | Core simulation function | High — main engine loop |
| 3 | Event selection & catch targeting | High — weighted randomness + social dynamics |
| 4 | Text log & history | Medium — follows existing patterns |
| 5 | VP announcement + rounds | High — interactive reveal UI |
| 6 | VP showdown + immunity + elimination | Medium — reuses existing card patterns |
| 7 | Particle profile & CSS | Low — follows existing atmosphere system |
| 8 | Integration & edge cases | Medium — wiring + testing |
