# How to Create a New Twist Challenge (Complete Guide)

## Step 1: File Creation
Create `js/chal/<challenge-id>.js`. Use an existing challenge (e.g., `super-hero-ld.js` or `princess-pride.js`) as a template. Standard imports:
```javascript
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';
```

## Step 2: Integration Points (ALL required)
**5 files must be updated:**

1. **`js/core.js`** — Add TWIST_CATALOG entry:
   ```javascript
   { id:'challenge-id', emoji:'🎯', name:'Challenge Name', category:'challenge',
     chalSeries:'action', chalStyle:'adventure', phase:'post-merge',
     desc:'Description...', engineType:'challenge-id',
     incompatible:[...all other challenge IDs...] }
   ```

2. **`js/twists.js`** — Add `engineType` → flag mapping in `applyTwist()`:
   ```javascript
   } else if (engineType === 'challenge-id') {
     ep.isChallengeId = true;
   ```
   No merge/phase checks here — let episode.js handle that.

3. **`js/episode.js`** — SEVEN places to update:
   - **Import**: `import { simulateChallengeId } from './chal/challenge-id.js';`
   - **Dispatch block** (near other post-merge challenges ~line 1475):
     ```javascript
     if (ep.isChallengeId && gs.isMerged) {
       simulateChallengeId(ep);
       ep.immunityWinner = ep.challengeData?.immunityWinner || ep.immunityWinner;
       ep.challengeType = 'challenge-id';
     }
     ```
   - **Generic challenge skip** (~line 2221): add `|| ep.isChallengeId` to the `isMonsterCash || isOperationClassified || ...` condition
   - **Generic updateChalRecord guard** (~line 2545): add `&& !ep.isChallengeId` — prevents double-calling. The twist challenge's `simulate` function already calls `updateChalRecord(ep)` internally; this guard stops the GENERIC catch-all from calling it a second time (which would double-count wins/podiums/bombs).
   - **`_hasTwistChallenge` list** (~line 1640): add `|| ep.isChallengeId` — THIS IS CRITICAL for sudden-death compatibility. Without it, sudden death runs its own generic challenge instead of using the twist challenge results to eliminate last place.
   - **`handleExileFormat` guard** (~line 991): add `|| ep.isChallengeId` — prevents exile format from interfering with the twist challenge.
   - **Episode history save** — add `isChallengeId: ep.isChallengeId || false, challengeData: ep.challengeData || null` to ALL `gs.episodeHistory.push` calls in episode.js (there are 4+: main ~line 5400, no-tribal ~line 2918, sudden-death ~line 1715, sudden-death+twist ~line 2417). Missing any one = VP screens show nothing on replay for that episode type.

4. **`js/vp-screens.js`** — Add import + screen registration:
   ```javascript
   import { rpBuild..., revealNext, revealAll } from './chal/challenge-id.js';
   // In buildVPScreens(), add:
   } else if ((ep.isChallengeId || ep.challengeType === 'challenge-id') && ep.challengeData) {
     vpScreens.push({ id:'xx-title', label:'Title', html: rpBuildTitleCard(ep) });
     // ... more screens
   }
   ```

5. **`js/text-backlog.js`** — Two options for text backlog:

   **Option A (recommended): VP-rendered text backlog** — uses `_textTwistChallenge()` to call VP builder functions and strip HTML. This automatically outputs the exact narration from the VP screens with zero manual work:
   ```javascript
   // In text-backlog.js — import VP builders:
   import { rpBuildChallengeTitleCard, rpBuildChallengePhase1, ... } from './chal/challenge-id.js';
   // In generateSummaryText() — call generic renderer:
   if (ep.challengeData) {
     _textTwistChallenge(ep, ln, sec, 'challengeData', 'CHALLENGE NAME', [
       rpBuildChallengeTitleCard, rpBuildChallengePhase1, ...
     ]);
   }
   ```
   Place the call in the twist challenges block (BEFORE `_textCampPost`).

   **Option B: Custom `_text` function** — export `_textChallengeId(ep, ln, sec)` from the challenge file and call it manually. Use this only if you need a different format than the VP output. Must include ALL narration text from the VP — every player action, every event, every score. The text backlog should be a complete retranscription of what the VP shows.

6. **`js/main.js`** — Add `import * as challengeMod from './chal/challenge-id.js';` and add `challengeMod` to the module spread array.

7. **`js/run-ui.js`** — Add episode history badge tag (colored pill in episode timeline).

## Step 3: Simulation Structure
Init: `active` (filter exileDuelPlayer), `campKey`, `campEvents`, `chalMemberScores`. Run romance hooks with `null` for phases/phaseKey. Finalize: set `ep.challengeData`, `ep.isChallengeId`, `ep.challengeType`, `ep.challengeLabel`, `ep.challengeCategory`, `ep.chalPlacements`, call `updateChalRecord(ep)`. See existing challenges for template.

### Pre-Merge vs Post-Merge vs Both-Phase

**Post-merge:** Set `ep.immunityWinner` + `ep.tribalPlayers = active`. Massive `chalMemberScores` bonus: `maxOther + active.length + 5`. Dispatch: `ep.isChallengeId && gs.isMerged`.

**Pre-merge:** DO NOT set `ep.immunityWinner`. Rank tribes by avg member score. Set `ep.tribalPlayers` = losing tribe only, `ep.winner`/`ep.loser`/`ep.safeTribes`/`ep.challengePlacements` = tribe objects from `gs.tribes` (NOT tribeData). Dispatch: `ep.isChallengeId && !gs.isMerged`. Camp events use per-tribe keys.

**Both-phase:** Branch on `gs.isMerged` inside simulate function. TWIST_CATALOG: `phase: 'both'`. Dispatch: `ep.isChallengeId` (no merge check). VP results branch on `gs.isMerged`.

## Step 4: VP Pattern
- Each screen is an exported function: `rpBuildChallengeTitleCard(ep)`, `rpBuildChallengePhase1(ep)`, etc.
- Use `_tvState[stateKey]` with `idx: -1` for click-to-reveal
- Export `challengeRevealNext(screenKey, totalSteps)` and `challengeRevealAll(screenKey, totalSteps)`
- Shell wrapper function with CSS + theme: `_shellWrapper(content, ep, theme)`
- Sidebar should NOT spoil future results — show state from BEFORE current phase, update progressively
- Each screen needs its own `stateKey` for independent reveal state

### VP Reveal: DOM-Only Updates (CRITICAL)
**NEVER rebuild entire page on reveal.** Use `_reapplyVisibility(suffix, upToIdx, total)` — loops step 0 to current idx, adds visible class, updates counter, dims buttons when done. Patches stale DOM after screen switch. See `crazy-fun-time.js` as reference.

**Required element IDs:** step divs `id="prefix-step-{suffix}-{i}"`, counter `id="prefix-counter-{suffix}"`, controls `id="prefix-controls-{suffix}"`, sidebar `id="prefix-sidebar-inner"`.

**Auto-scroll**: `scrollIntoView({ behavior: 'smooth', block: 'center' })` on revealed element. **Sidebar**: split into wrapper + `_buildSidebarContent()`, update via `sideEl.innerHTML` replacement.

### VP Mockup Workflow
1. **Create a standalone mockup HTML file** (`mockup-<name>.html`) with all CSS, layout, icons, fonts, and placeholder data. This is the visual target.
2. **Get user approval** on the mockup before writing any VP builder code.
3. **VP builders must reproduce the mockup exactly** — same grid layout, same fonts, same CSS icon system, same sidebar structure, same card physics, same ambient effects. If the VP output doesn't match the mockup, it's wrong.
4. **After VP builders are written, verify against the mockup** — open both in a browser and compare. The mockup is the source of truth.
5. **Keep the mockup file** in the repo for future reference — it documents the visual intent.

## Step 5: Scoring Rules
- `chalMemberScores` accumulates across all phases — used for challenge tab ranking
- Immunity winner gets massive bonus to guarantee #1 position
- Survivors/top performers get intermediate bonuses
- `chalPlacements` array: best-to-worst order for podium/bomb tracking
- `updateChalRecord(ep)` reads `ep.immunityWinner` to credit the win (1W)

## Step 6: Common Bugs to Avoid
- **Episode history**: Add challenge data fields to ALL `gs.episodeHistory.push` calls (4+ locations — grep for them). Missing = VP shows nothing on replay.
- **Romance hooks**: Pass `null` for phases/phaseKey params or they crash trying to push to nonexistent array.
- **Pre-merge: NO `ep.immunityWinner`** — tribe wins, not individual. Only post-merge sets this.
- **Generic challenge skip**: Add to BOTH skip conditions in episode.js (dispatch + updateChalRecord guard).
- **Tribe property**: `gs.tribes` objects (built by `initGameState()`/`cast-ui.js`) carry `.name`, never `.tribeName` — `episode.js`, `alliances.js`, `camp-events.js`, `romance.js`, `advantages.js`, and `auction.js` all read `.name` (several with an explicit `t.tribeName || t.name` fallback). Read a tribe's name as `tribe.name ?? tribe.tribeName` if a call site must also tolerate the older shape; do not write new code that reads `tribeName` alone. Episode number: `gs.episodeHistory.length` not `+1`.
- **Reveals after screen switch**: `_reapplyVisibility()` loops 0→idx on every click. Isolate sidebar/map updates in separate try-catch blocks so reapply always runs first.
- **Reward Twist compatibility**: (1) Add ID to `reward-twist-challenge` incompatible list in core.js. (2) Add engine ID + flag to `_engineFlagMap` in twists.js.
- **VP atmosphere**: Use `top:46px` not `top:0` — don't cover the 46px `.rp-nav` bar.
- **VP mockup**: Always compare VP output against approved mockup. Subagents must reproduce exact layout.
- **Text variety**: 4+ variants per narration category. Use priority draft for class/type assignment.

## Step 7: VP Aesthetic Identity — OVERDRIVE IS THE BASELINE
Every challenge VP must feel like a standalone immersive experience with its own **unique visual identity**. The goal is wow factor — the user should feel transported into the challenge's world. Never settle for plain cards with emoji icons on a flat background.

**EVERY CHALLENGE IS DIFFERENT.** Do NOT copy another challenge's visual language. A pyramid expedition should not look like a space station. A fairy tale quest should not look like a spy thriller. Study the challenge's theme and invent visual primitives that belong to THAT world. No two challenges should share layout patterns, ambient effects, or HUD styles.

**Required foundations (adapt the form to the theme):**
- Unique CSS class prefix per challenge (e.g., `sh-` for Super Hero-ld, `eg-` for Walk Like an Egyptian)
- Unique font family + color palette — at least 2 fonts (display + body)
- `max-width:1100px;margin:0 auto` on the shell — never full-screen
- Phase-specific background themes that shift atmosphere (color temperature, mood)
- `@media(prefers-reduced-motion:reduce)` fallback on ALL animations
- CSS-only animated icons (no emoji) via `_icon(type)` helper — each challenge invents its own icon set
- Persistent background animations fitting the theme (particles, environmental effects)
- Phase-specific card physics — cards MOVE differently per zone
- Atmospheric flavor text between cards (comm chatter, announcer, ambient narration) — 8-10 per zone
- Sticky reveal controls (`position:fixed;bottom:0`) with counter (by ID for live update) + auto-scroll via `scrollIntoView({ behavior: 'smooth', block: 'center' })` — page must stay in place, never flash top-to-bottom
- Interactive sidebar: live-updating on every reveal via DOM innerHTML replacement (by ID), zone-specific, gated by `_tvState`. Use `stepMeta` arrays for progressive score accumulation.
- Store phase data on `window`, read from DOM `data-phase` (not globals that get overwritten)

**Noise & Unpredictability (simulation, not VP):**
- All stat checks use `noise(2.5)` minimum — outcomes should surprise
- Never guarantee results from stats alone — upsets must happen regularly
- Elimination thresholds should let ~20-30% of players fail naturally

## Twist Challenge Design Rules

### Scoring Balance
- All phases should score in similar ranges (10-15 max per phase). One phase dominating = one player dominates.
- Don't use the same stat in every phase — spread stat requirements so different archetypes shine in different phases.
- No immunity score inflation (`maxOther + active.length + 5`) for challenges where the winner is already the highest scorer.
- Phase advantages (VIP, backstage pass) should give a meaningful edge but NOT guarantee the win.

### Sidebar / Honor Board — LIVE UPDATING (CRITICAL)
- Live-update on every reveal via `_updateSidebar(screenKey)` from BOTH `revealNext` AND `revealAll`. Replace innerHTML by ID, never full rebuild.
- Use `stepMeta` arrays on `window` for progressive score accumulation. Gate ALL data by `_tvState[key].idx` — never spoil ahead.
- Store phase data on `window`, read from DOM `data-phase` (not globals). Episode data: `gs.episodeHistory[window.vpEpNum - 1]`.

### VP Narration Quality
- Minimum 4 text variants per narration category to avoid repetition.
- Text must be archetype-driven — a villain, hero, and goat should react differently to the same event.
- Every narration should reference the SPECIFIC player, their personality, and what happened — no generic "Player did well."
- Use `pick()` with large pools, or `_pickUnique()` to prevent duplicate text in the same game.
- Player cards inside manila/parchment folders need `color:var(--coffee)` or `rgba(26,26,26,0.8)` — light text on light backgrounds is INVISIBLE.

### Social Events Between Beats
- Fire social events BETWEEN each beat/round/phase, not just at the end.
- Guarantee at least 1 social event per beat — use probability for bonus events, not for the base event.
- Social event types: showmance, rivalry, bond, respect, blame, paranoia — each with distinct visual card.
- Social cards need player portrait icons (hanko/polaroid) and visually distinct styling from regular cards (dashed border, different background).
- Social events must have gameplay consequences (`addBond`, `popDelta`, camp events).

### Phase-Specific Environments
- Each phase needs its own distinct background/atmosphere — not the same background for all phases.
- Use the `_shell` wrapper's `phaseCls` parameter to set CSS class per phase.
- Environments should shift in color temperature: warm (training) → intense (fight) → cold/outdoor (climb).

### Fight / Competition Mechanics
- Round-robin for 3, bracket for 4+. Show both fighter AND trainer. Each fight generates 2-4 social events.

### Climb / Endurance Mechanics
- Resource loss formulas: `* 20-25` reasonable, `* 100` is death. Mid-stage eliminations need text. Boss prizes go to first player only.

### VP Reveal System
- `<script>` tags in innerHTML don't execute — set `window` data in VP build function.
- Toggle CSS classes by ID, never rebuild page. See Step 4 for full pattern.
- Fight exchanges should trigger impact animations (screen shake, move burst, KO slam).
- Betrayal/steal events should trigger screen shake on the entire shell.

### Multi-Phase Race Challenges
Challenges with timed races across multiple phases have unique pitfalls:

**Time spread — avoid photo finishes:**
- Penalties must be large enough to create real separation. If success adds +1.0 and failure adds +1.5, the spread over 6 segments is ~3s — every race is a tie.
- Target: best-to-worst tribe spread of 10-20s. Below 10s feels artificially close. Above 25s feels like a blowout.
- Use a **momentum system** to compound advantages: `momFactor = 1.0 + momentum * 0.1` (cap momentum at ±2). Struggling tribes fall further behind, leading tribes pull ahead.
- Base penalties should be 2x-4x the success time, not 1.2x. A wrong turn should HURT.

**Phase-isolated scoring:**
- Each phase must track its own performance separately. Snapshot `tribe.time` before each phase starts (`t._prePhaseTime = t.time`) and compute phase-only time as `t.time - t._prePhaseTime`.
- Phase winners are determined by phase-only time, NOT cumulative time from all previous phases. Otherwise the Phase 1 winner always wins Phase 2.
- Cumulative time can still feed into overall final results.

**Live map updates — every phase needs one:**
- Every phase with a visual map MUST have a `_update[Phase]Map(screenKey)` function.
- All phase map updaters must be hooked into a unified `_updateMap(screenKey)` caller, wrapped in try-catch.
- Map markers need **tribe labels** (initials) and **vertical stagger** (`bottom: baseY + idx * offset`) so overlapping markers are distinguishable.
- Markers must have IDs (`id="prefix-marker-${tribeName}"`) for DOM-based live updates.
- Markers start at the ENTRY position, not at their final simulated position.

**Event frequency — avoid spam:**
- Routine success events (e.g., "Good Nav") should only emit cards ~35% of the time. Failures always emit.
- Have 6-8 text variants minimum for any event that can fire every segment.
- Guaranteed-every-segment events flood the timeline and make every tribe's log look identical.

**No duplicate event arrays:**
- Events belong in ONE array (e.g., `segmentData.events`). Do NOT also push them to a parallel array (e.g., `gatorEvents`) if the VP builder flattens both — this causes double rendering.
- If a secondary array exists for metadata tracking, the VP builder must flatten from only ONE source.
