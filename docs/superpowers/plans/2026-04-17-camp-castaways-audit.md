# Camp Castaways — Audit & Remediation Plan

**Date:** 2026-04-17
**File audited:** `js/chal/camp-castaways.js` (1718 lines)
**Audit against:** `docs/superpowers/specs/2026-04-17-camp-castaways-design.md`, CLAUDE.md rules, sibling challenges (Wawanakwa, Triple-Dog-Dare, Say Uncle, Tri-Armed).
**Verdict:** Integration is fully wired, text pools are strong, but the challenge has **one broken interaction, ~120 lines of dead crash-prone code, a one-dimensional scoring model in Phase 4, and a three-mode visual identity that is promised by the CSS but never *felt* by the user.**

---

## 0. Integration check — ALL GOOD

Grep-verified wiring across:

- `js/main.js:34,206` — module imported + registered in challenge dispatcher.
- `js/episode.js:43,2047-2050` — `simulateCampCastaways` dispatched; `tribalPlayers` filtered.
- `js/episode.js:~2247` — `!ep.isCampCastaways` present in the `updateChalRecord` skip list.
- `js/twists.js:1317-1323` — engineType handler sets `ep.isCampCastaways` when merged + 4+ active.
- `js/text-backlog.js:28,1930` — `_textCampCastaways` called.
- `js/vp-screens.js:9,634,2004,10279-10280` — `rpBuildCampCastaways` imported, screen pushed, Challenge tab gated.
- `js/savestate.js:139-140` — `h.isCampCastaways` and `h.campCastaways` persisted.
- `js/run-ui.js:255` — timeline tag rendered.
- `js/core.js:~128` — `TWIST_CATALOG` entry present with incompatibility list.

No integration gaps found. Problems are all **inside** `camp-castaways.js`.

---

## 1. 🔴 Bug-level findings (must-fix)

### 1A. Broken click-to-reveal handler — lines 1570–1581

```js
window._ccReveal = function (stateKey, idx, total) {
  ...
  if (typeof buildVPScreens === 'function') {
    buildVPScreens(ep);
    const screens = document.querySelectorAll('[data-vp-screen-id]');
    screens.forEach((el, i) => {
      if (el.dataset.vpScreenId && el.dataset.vpScreenId.includes('camp-castaways')) {
        if (typeof setVPScreen === 'function') setVPScreen(i);
      }
    });
  }
  ...
};
```

**Two defects in one function:**
1. `setVPScreen(i)` is called **inside the `forEach` loop** for every screen whose id matches — so after all iterations, you land on the **last** camp-castaways screen (Immunity), regardless of which reveal button was clicked.
2. Screens pushed in `vp-screens.js` all have `id: 'camp-castaways'` (line 10280) — *the same id for all six CC sections* — so the dataset matcher can't distinguish Cold Open from Night from Storm even if the loop logic were fixed.

**CLAUDE.md explicitly warns about this:** *"When rebuilding VP screens from a reveal handler, preserve `vpCurrentScreen` by finding the screen index after `buildVPScreens`."* The handler ignores the guidance.

**Fix direction:** Don't walk DOM — set `_tvState[stateKey].idx = idx`, call `buildVPScreens(ep)`, then restore `vpCurrentScreen` directly (see how Lucky Hunt / Wawanakwa handle this).

### 1B. Dead `_fireWildlifeEvent` helper — lines 1594–1717 (~124 lines)

- Never called from anywhere. Actual wildlife logic is inlined in `simulate` at lines 436–511.
- References `WILDLIFE.shark.brave`, `WILDLIFE.pterodactyl.panic`, `WILDLIFE.mosquito(...)`, etc. — **these nested structures do not exist.** `WILDLIFE` is declared at line 46 as a flat array of `{id, name, nearWater}`. If this function were ever reached, it would throw `TypeError: Cannot read properties of undefined`.
- Also references `WILDLIFE.trexSkull` (camelCase) while the flat list uses `'trex-skull'` — a naming inconsistency suggesting this was an abandoned refactor.

**Fix direction:** Delete the entire function + the unreachable import surface it implies.

### 1C. Dead no-op line — line 478

```js
subject !== defender && (wText = wText); // use defender as subject for display
```

Self-assignment. Delete.

### 1D. Playback prioritization clobbers a flag — line 866–869

```js
const breakdownFlag = cameraFlags.find(f => f.type === 'breakdown');
if (breakdownFlag && !playbackFlags.includes(breakdownFlag)) {
  playbackFlags[0] = breakdownFlag;
}
```

If `playbackFlags` already has 2–3 sampled flags, slot 0 is **overwritten**, silently dropping a chosen camera moment. Should be `playbackFlags.unshift(breakdownFlag)` (and trim if overlong) or insert-if-missing semantics.

### 1E. Unused parameter in reveal contract — line 1326

`_revealBtn(stateKey, i, events.length - 1)` passes a `total` argument that `_ccReveal` never consumes. Either wire it (bounds-check idx ≤ total) or remove it.

---

## 2. 🟠 Design / balance findings

### 2A. Phase 4 is "highest boldness wins" (lines 828–860)

In phase 4, one stat dominates:

| Beat | Condition | Reward |
|---|---|---|
| Discovery | highest boldness in cast | +1.0 |
| The Charge | boldness ≥ 7 | **+2.0** + pop +1 |
| The Charge (mid) | boldness 4–6 | +0.5 |
| War Paint (phase 3, carries in) | boldness ≥ 7 | +1.0 |
| Player Confront | temperament ≥ 7 (50% chance) | −0.5, pop +1 |
| Endurance bonus | accumulated score ≥ 5.0 | +1.0 (self-reinforcing) |

A bold player easily stacks **+4.0 to +5.0 in Phase 4 alone**, while the Mr. Coconut breakdown penalty (−2.0) and Phase-2 drama beats target *mental/temperament-low* players. Net effect: **the player with the highest boldness wins immunity ~every time**, regardless of Phase 1–3 play.

**The spec promised ensemble survival** — strategic, intuition, social, endurance all mattering. Delivery collapses it to one stat.

**Fix direction:** Give every primary stat a distinctive Phase 4 upside:
- `intuition ≥ 7`: *Navigator* — routes the war party, +1.0.
- `strategic ≥ 7`: *Tactician* — spots Chris's bluff early, +1.0.
- `social ≥ 7`: *Negotiator* — argues down Chef, +1.0.
- `mental ≥ 7`: *Skeptic* (already partly covered by the Reveal beat at line 886–892) — expand its weight.
- `endurance ≥ 7`: *Finisher* — keep the existing ≥5.0 bonus but gate it on endurance, not raw score.
- Cap boldness upside at +2.0 total in Phase 4.

### 2B. War Party always fires — line 789–794

```js
const warPainters = activePlayers.filter(p => pStats(p).boldness >= 7);
if (warPainters.length > 0) { /* always fires */ }
```

No probability gate. In any cast of 10+ merge players there will always be someone with boldness ≥ 7. This event plays in every episode → loses its "holy shit" energy and further inflates boldness scoring (see 2A).

**Fix direction:** Add `Math.random() < 0.55` gate; if no war paint, alternative "stealth approach" beat rewards intuition.

### 2C. "Nearby" raft rescuers are the first three in turn order — line 782

```js
const nearby = activePlayers.filter(p => p !== rafter).slice(0, 3);
```

`slice(0, 3)` takes the first three players of `activePlayers` (arbitrary insertion order), then gives each a +0.3 bond with the rafter. No actual spatial/group logic. At minimum this should be *"members of the rafter's group"* or *"random 3"*, not *"first 3 by turn order"*.

### 2D. Discovery + War Paint double-dip — lines 821, 836

Same high-boldness player usually wins both Discovery (+1.0) and is counted in War Party (+1.0 via phase 3) and leads the Charge (+2.0). Three beats, one player.

**Fix direction:** Discoverer must be *excluded* from the warPaint pool, OR warPaint gates out the top-1 bold player.

### 2E. Mr. Coconut archetype-bucket mislabels 'goat' — line 277

```js
: ['underdog', 'goat', 'floater'].includes(arch) ? 'underdog'
```

Per CLAUDE.md: `goat` is classed under **nice archetypes**, not underdog. Using the "underdog" intro line for a goat yields off-voice prose ("You've been sitting here this whole time, and nobody noticed you either").

**Fix direction:** Move 'goat' to `default` bucket or create a dedicated 'goat' voice.

### 2F. Mr. Coconut has no episode cooldown

30% / 15% on the two lowest mental+temperament players → the same player often breaks down two or three episodes running. Real-TV equivalent is episodic; repeated breakdowns read as cast-sheet stats, not character.

**Fix direction:** `gs._lastCoconutEp` + minimum 2-episode gap per-player; also suppress if the player is already eliminated or just returned.

### 2G. Food "mishap" branch uses compound randomness

Line 385: `else if (Math.random() < 0.35)` **inside** `else if (successChance >= 0.35) { ... }`. With low-stat foragers the math is:

- successChance often 0.20–0.35 → falls through
- then 35% of that falls into mishap, 65% into fail

So ~23% mishap, ~42% fail, rest varies. Acceptable, but the nested rolls are hard to reason about. Consider flattening.

### 2H. Sleep-talk "EXPOSED" heat target is the sleeper — lines 619–624

The sleeper gets the heat. But the strategic reveal would realistically hurt whoever they *named* in their sleep — the text says *"Specifically, names. The group goes very quiet."* Heat should target the named player(s), not the talker. (Or: talker gets heat for being exposed as a player; that's defensible — just make it intentional.)

---

## 3. 🟡 VP identity findings — why it feels flat next to siblings

### 3A. Three-mode identity promised in CSS, not delivered in UX

The spec says: *"VP: THREE-MODE identity — Surveillance, Castaway Diary, Emergency Broadcast. Mode transitions: CSS class swap with 200ms glitch flash."*

What ships:
- Six screens stacked vertically in a single VP wrap (`cc-wrap`, line 1539).
- Between each, a 22px tall `_glitchTransition` decorative element (lines 1226–1240) that runs a one-shot 0.5s animation on first paint and then sits static forever.
- The three modes are just *three stylesheets*. There is no spatial or temporal mode *switch* that the user feels.

Compare to siblings:
- **Wawanakwa** has escalating tannoy timestamps + emoji pills + identity layer.
- **Triple-Dog-Dare** has Playground Chaos theming with chicken streaks + public reactions.
- **Say Uncle** has a coherent Dungeon-of-Misfortune visual metaphor maintained across phases.

Camp Castaways looks handsome per-screen but has no *unified journey*.

**Fix direction options (pick one):**

1. **Minimal identity pass:** single persistent "Producer's Monitor Wall" frame wrapping all six screens — timestamps advance continuously across phases, a CRT bezel persists, VHS label updates the "tape" per phase. Cheap.
2. **Mode-switch physicality:** when the mode changes, actually animate it — paper unfolds in for diary, signal-lock pulse for broadcast, CRT warm-up for surveillance. ~2–3 hours of CSS/JS. This is the "B" option from the prior response.
3. **Scroll-timeline mode pacing:** mode intensity (color grade, scan-density) tied to `animation-timeline: scroll()`. Cool but requires verifying the VP container owns scroll (Wawanakwa, Say Uncle historically put scroll on `.vp-content`).

### 3B. Same `id` for every CC screen — `vp-screens.js:10280`

`vpScreens.push({ id:'camp-castaways', ... })` — only one push. But internally `rpBuildCampCastaways` returns **six visually-separate sections concatenated**, all under a single VP screen. Sibling challenges (e.g. Wawanakwa) push one screen per phase with distinct ids so VP nav can target them.

**Consequence:** click-reveal (once fixed) can only scroll within the single screen; there's no "next phase →" navigation. All six phases paginate as one long screen.

**Fix direction:** Split `rpBuildCampCastaways` into six screen returns, pushed individually from `vp-screens.js`, each with its own id (`camp-castaways-cold`, `camp-castaways-group-A`, …, `camp-castaways-immunity`). This also fixes 1A automatically (each screen has a unique id to target).

### 3C. Glitch transition is cosmetic only — lines 1244–1250

It plays a 0.5s intro animation on first render and then sits. Because screens are stacked in one VP, the glitch is just a divider. In a mode-switch context, it should only appear when the user *transitions* modes — i.e. click-reveal the last event of phase N and the *next* phase's glitch plays as it enters viewport.

### 3D. `_tvState` module-scope persistence

`_tvState` is a module global keyed by `cc_cold_${epNum}` etc. Works for within-session navigation but:
- Not serialized to save state.
- Reloading a mid-VP save resets all reveal progress to `idx: -1`.

Other challenges have the same limitation, so this is not a regression — just noting for completeness.

### 3E. `rpPortrait`, `buildVPScreens`, `setVPScreen` accessed via `typeof` bare-name

Lines 1264, 1267, 1292, 1295, 1311, 1367, 1403, 1575, 1578, 1588.

```js
const port = (typeof rpPortrait === 'function') ? rpPortrait(pName, 'xs') : '';
```

These are globals set on `window` in `main.js`. In ES modules, bare `typeof X` returns `'undefined'` unless X is an actual global. Browsers expose `window.X` as a bare identifier in module scope, so this technically works — but it's fragile and inconsistent with how other modules in this project access portraits. Either import explicitly or use `typeof window.rpPortrait`.

### 3F. Phase-0 timestamp math is silly — line 1346

```js
`00:${String(i * 4).padStart(2, '0')}:${String(i * 7 % 60).padStart(2, '0')}`
```

Minutes go `00, 04, 08, 12, ..., 40, 44, 48, 52, 56, 60, 64, ...` — at ≥15 events the minute field is 3 digits and the string breaks the header layout. Low probability, but real.

---

## 4. 🟢 What's solid (do not break)

- **Text pools** voiced per archetype, with multiple variants per beat. Prose quality is the best in the file.
- **Camp-event consequences** correctly use `gs.mergeName`, include `players[]` arrays, `badgeText`, `badgeClass`. Follows the CLAUDE.md camp-event contract.
- **Heat propagation** via `gs._castawaysHeat` with `expiresEp`. Correct pattern.
- **Romance gate** (`romanticCompat` before stargazing spark) at line 710 — correct per CLAUDE.md.
- **Integration hooks** (main, episode, vp-screens, savestate, twists, text-backlog, run-ui, core) — all present and wired identically to the latest sibling (Tri-Armed Triathlon).
- **`_tvState` click-reveal pattern** conceptually matches Lucky Hunt / Wawanakwa — just poorly implemented in the handler.
- **`updateChalRecord`** called at line 927. Ep fields (`challengeType`, `challengeLabel`, `challengeCategory`, `immunityWinner`, `chalMemberScores`, `challengePlacements`) all set.
- **No serialization hazards** — all timeline text is pre-rendered strings, no functions stored on `ep.campCastaways`.

---

## 5. Remediation plan (sequenced)

Three layers, independently committable. Do **1 before 2 before 3**.

### Layer 1 — Correctness (half-day, zero-risk)

Fixes #1A-E, #2E, #3F. No visual changes.

1. Delete `_fireWildlifeEvent` (1594–1717) — dead, crash-prone.
2. Delete no-op line 478.
3. Rewrite `window._ccReveal` to: set `_tvState[stateKey].idx = idx`; call `buildVPScreens(ep)`; restore `vpCurrentScreen` directly (not via DOM walk). Model after Lucky Hunt's reveal handler.
4. Change playback slot-0 clobber → `unshift + cap`.
5. Remove unused `total` param from `_revealBtn` and `_ccReveal`, or bounds-check it.
6. Fix `goat` archetype bucketing in Mr. Coconut intro.
7. Fix Phase-0 timestamp formatting (use actual minutes/seconds modulo math).

**Test:** start season, advance to post-merge, trigger camp-castaways, click through every reveal button, verify VP does not jump screens. Save + reload mid-VP, verify no crash.

### Layer 2 — Balance (half-day, moderate risk, affects gameplay)

Fixes #2A-D, #2F-H.

1. Rebalance Phase 4 scoring: cap boldness stacking, add intuition/strategic/social/mental/endurance upside beats.
2. Add 0.55 probability gate to War Party; add alternative "stealth approach" beat.
3. Replace raft-rescue `slice(0,3)` with "members of rafter's assigned group."
4. Exclude Discoverer from War Paint cohort.
5. Add `gs._lastCoconutEp` 2-episode cooldown per player.
6. Flatten food-finding nested rolls (cosmetic / readability).
7. Sleep-talk heat → target named player(s), not the sleeper (or keep as-is with an explicit "exposed yourself" comment).

**Test:** simulate 30 episodes of a merged season. Verify:
- Immunity winner distribution correlates with multiple stats, not just boldness.
- Same player does not break down 3+ episodes in a row.
- War party fires ~50%, not 100%.

### Layer 3 — Identity (1–2 days, higher investment, real overdrive)

Fixes #3A-C. Only attempt after Layers 1+2 ship.

**Recommended approach — Producer's Monitor Wall + mode physicality:**

1. **Split the monolithic VP return** into six pushes in `vp-screens.js:10279`, each with its own id:
   `camp-castaways-flood`, `camp-castaways-group-<label>` (N×), `camp-castaways-night`, `camp-castaways-regroup`, `camp-castaways-storm`, `camp-castaways-immunity`.
2. **Add a persistent frame** wrapping all six screens — CRT bezel + running timestamp + "TAPE N/6" indicator — that gives the three modes a shared narrative container.
3. **Mode-switch animations fire only on transition**, not on every re-render:
   - Surveillance → Diary: CSS `@property` hue-rotate 75deg → 0 + scanline fade-out + paper-slide-in.
   - Diary → Broadcast: ink-to-signal morph; signal bar locks in with a static burst.
4. **Playback beats in Phase 4** actually *re-render the original diary panel* tinted green with a VHS tracking glitch — so the callback is visual, not just textual.
5. **Respect `prefers-reduced-motion`** — all mode transitions collapse to instant class swap.

Skip this layer if you'd rather invest the time elsewhere; Layers 1+2 alone make it ship-quality.

---

## 6. Line-number quick reference

| Concern | File | Lines |
|---|---|---|
| Dead `_fireWildlifeEvent` | camp-castaways.js | 1594–1717 |
| Broken `_ccReveal` | camp-castaways.js | 1570–1581 |
| No-op line | camp-castaways.js | 478 |
| Playback clobber | camp-castaways.js | 866–869 |
| Boldness dominance | camp-castaways.js | 821, 828–838, 894–900 |
| Ungated War Party | camp-castaways.js | 789–794 |
| "Nearby" slice(0,3) | camp-castaways.js | 782 |
| goat bucketing | camp-castaways.js | 277 |
| Mr. Coconut cooldown | camp-castaways.js | 736–746 |
| Sleep-talk heat target | camp-castaways.js | 619–624 |
| Single VP push | vp-screens.js | 10279–10280 |
| Phase-0 timestamp math | camp-castaways.js | 1346 |

---

## 7. Recommendation

Ship **Layer 1 this week** — it's pure defect removal and the reveal handler is a user-visible defect today. Follow with **Layer 2** the week after; simulate a full season before and after to compare immunity-winner distributions. **Layer 3** is a creative investment, not a defect fix — only pursue once you're confident the challenge deserves the polish budget more than the next new challenge does.
