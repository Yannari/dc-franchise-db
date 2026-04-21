# 3:10 to Crazytown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Western-themed pre-merge challenge with 3 phases (horse dive, Mexican standoff, cattle roundup), spaghetti western VP overdrive, and throw system integration.

**Architecture:** Single file `js/chal/crazytown.js` contains simulate + rpBuild + _text functions. Registration across core.js, twists.js, episode.js, main.js, vp-screens.js, text-backlog.js. Uses shared `checkChallengeThrows`/`processChallengeThrows` from challenges-core.js.

**Tech Stack:** Vanilla JS ES modules, inline CSS in VP shell, CSS keyframes for animations.

---

## File Map

- **Create:** `js/chal/crazytown.js` — all simulation + VP + text
- **Modify:** `js/core.js:~125` — TWIST_CATALOG entry
- **Modify:** `js/twists.js:~1428` — applyTwist case
- **Modify:** `js/episode.js:~1838` — challenge dispatch + skip list + serialization
- **Modify:** `js/main.js:~38,~127` — import + module registration
- **Modify:** `js/vp-screens.js:~15,~10340` — import + VP screen wiring
- **Modify:** `js/text-backlog.js:~30,~2016` — import + call

---

### Task 1: Registration (core.js + twists.js + episode.js + main.js + vp-screens.js + text-backlog.js)

Wire up the challenge so it can fire. Simulation stub returns minimal valid data.

**Files:**
- Create: `js/chal/crazytown.js` (stub)
- Modify: `js/core.js` — TWIST_CATALOG
- Modify: `js/twists.js` — applyTwist
- Modify: `js/episode.js` — dispatch + skip + exile exclusion + serialization
- Modify: `js/main.js` — import
- Modify: `js/vp-screens.js` — import + screen wiring
- Modify: `js/text-backlog.js` — import + call

- [ ] **Step 1: Create stub `js/chal/crazytown.js`**

```js
// js/chal/crazytown.js — 3:10 to Crazytown Western challenge
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';

export function simulateCrazytown(ep) {
  const tribes = gs.tribes;
  if (!tribes || tribes.length < 2) return;
  const tribeMembers = tribes.map(t => ({ name: t.name, members: [...t.members] }));

  const result = {
    phases: [],
    tribeScores: {},
    horseDive: null,
    standoff: null,
    roundup: null,
    breakEvents1: null,
    breakEvents2: null,
  };
  tribeMembers.forEach(t => { result.tribeScores[t.name] = 0; });

  ep.crazytown = result;
  ep.challengeType = 'crazytown';

  if (!ep.campEvents) ep.campEvents = {};
  const campKey = gs.tribes[0]?.name || 'merge';
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };

  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  tribeMembers.flatMap(t => t.members).forEach(n => { ep.chalMemberScores[n] = 0; });

  // TODO: Phase 1, 2, 3 go here

  // Winner/loser
  const sorted = Object.entries(result.tribeScores).sort((a, b) => b[1] - a[1]);
  const winnerName = sorted[0][0];
  const loserName = sorted[sorted.length - 1][0];
  ep.winner = tribes.find(t => t.name === winnerName);
  ep.loser = tribes.find(t => t.name === loserName);
  ep.tribalPlayers = [...ep.loser.members];
  ep.safeTribes = tribes.filter(t => t.name !== loserName && t.name !== winnerName);

  updateChalRecord(ep);

  ep.campEvents[campKey].post.push({
    text: `3:10 to Crazytown: ${winnerName} wins the Western showdown. ${loserName} heads to tribal council.`,
    players: tribeMembers.flatMap(t => t.members),
    badgeText: '3:10 TO CRAZYTOWN', badgeClass: 'gold',
    tag: 'challenge',
  });

  ep._debugCrazytown = {
    tribeScores: { ...result.tribeScores },
    phases: [...result.phases],
  };
}

export function _textCrazytown(ep, ln, sec) {
  const ct = ep.crazytown;
  if (!ct) return;
  sec('3:10 to Crazytown');
  ln('The teams saddle up for a rootin\'-tootin\' Western showdown.');
}

export function rpBuildCrazytownTitleCard(ep) {
  if (!ep.crazytown) return '';
  return '<div>3:10 to Crazytown — Title Card (TODO)</div>';
}

export function crazytownRevealNext() {}
export function crazytownRevealAll() {}
```

- [ ] **Step 2: Add TWIST_CATALOG entry in `js/core.js`**

Find the `beach-blanket-bogus` entry (~line 125) and add after it:

```js
  { id:'crazytown', emoji:'🤠', name:'3:10 to Crazytown', category:'challenge', chalSeries:'action', phase:'pre-merge', desc:'Three Western challenges on the film lot: 100-foot horse dive with chicken cascade, Mexican standoff water gun elimination, and cattle roundup roping. Spaghetti Western showdown vibes.', engineType:'crazytown', minTribes:2, incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors','up-the-creek','paintball-hunt','hells-kitchen','trust-challenge','basic-straining','x-treme-torture','monster-cash','alien-egg','brunch-of-disgustingness','beach-blanket-bogus','lucky-hunt','hide-and-be-sneaky','off-the-chain','wawanakwa-gone-wild','tri-armed-triathlon','camp-castaways','are-we-there-yeti'] },
```

- [ ] **Step 3: Add applyTwist case in `js/twists.js`**

After the `beach-blanket-bogus` case (~line 1428):

```js
  } else if (engineType === 'crazytown') {
    if (gs.isMerged || gs.tribes.length < 2) return;
    ep.isCrazytown = true;
```

- [ ] **Step 4: Add dispatch in `js/episode.js`**

4a. Add import (~line 41 area):
```js
import { simulateCrazytown } from './chal/crazytown.js';
```

4b. Add dispatch after `isBeachBlanketBogus` block (~line 1840):
```js
  } else if (ep.isCrazytown && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    simulateCrazytown(ep);
    // winner, loser, challengeType, tribalPlayers already set by simulateCrazytown
```

4c. Add to exile exclusion list (~line 975):
Append `|| ep.isCrazytown` to the existing condition.

4d. Add to updateChalRecord skip list (~line 2437):
Append `&& !ep.isCrazytown` to the existing condition.

4e. Add to serialization (~line 5338 area):
```js
    isCrazytown:      ep.isCrazytown      || false,
    crazytown:        ep.crazytown         || null,
```

- [ ] **Step 5: Add import in `js/main.js`**

After beachBlanketBogusMod import (~line 38):
```js
import * as crazytownMod from './chal/crazytown.js';
```

Add `crazytownMod` to extractedModules array (~line 127).

- [ ] **Step 6: Add VP wiring in `js/vp-screens.js`**

6a. Add import (~line 15 area):
```js
import { rpBuildCrazytownTitleCard, crazytownRevealNext, crazytownRevealAll } from './chal/crazytown.js';
```

6b. Add screen block after beachBlanketBogus section (~line 10357):
```js
  } else if (ep.isCrazytown && ep.crazytown) {
    vpScreens.push({ id:'ct-title', label:'🤠 3:10 to Crazytown', html: rpBuildCrazytownTitleCard(ep) });
```

- [ ] **Step 7: Add text-backlog wiring in `js/text-backlog.js`**

7a. Import (~line 30):
```js
import { _textCrazytown } from './chal/crazytown.js';
```

7b. Call (~line 2016):
```js
  _textCrazytown(ep, ln, sec);
```

- [ ] **Step 8: Verify — open simulator.html, enable crazytown twist, run episode. Should complete without errors.**

- [ ] **Step 9: Commit**
```
feat(crazytown): registration stub — challenge fires with placeholder data
```

---

### Task 2: Phase 1 — Horse Dive (Chicken Cascade)

Adapt cliff-dive chicken system. Sequential jump decisions per tribe, momentum cascade, convince/force interventions.

**Files:**
- Modify: `js/chal/crazytown.js` — add reaction pools + `_simulateHorseDive` function

- [ ] **Step 1: Add reaction text pools**

Add at top of file, after imports. Pools needed:
- `HORSE_DIVE_JUMPED` — `{high, mid, low}` arrays, 4 templates each. Western flavor: "leaps off the platform like a rodeo bull", etc.
- `HORSE_DIVE_CHICKEN` — `{high, mid, low}` arrays, 4 templates each. "backs away from the edge, boots scraping the planks"
- `HORSE_DIVE_LANDING` — `{perfect, rough, bellyflop, miss}` arrays, 3 templates each. Score: 3/2/1/0.
- `HORSE_DIVE_HOST` — `{intro, afterChicken, afterBoldJump, afterScaredJump}` arrays, 3 templates each.
- `HORSE_DIVE_CONVINCE_SUCCESS`, `HORSE_DIVE_CONVINCE_FAIL`, `HORSE_DIVE_FORCE_SUCCESS`, `HORSE_DIVE_FORCE_FAIL` — 4 templates each. Same pattern as cliff-dive.
- `HORSE_DIVE_HOST_INTERVENTION` — `{convinceSuccess, convinceFail, forceSuccess, forceFail}` arrays.

Each template is `(name, pr) => string` or `(actor, target, aPr, tPr) => string` for interventions.

- [ ] **Step 2: Implement `_simulateHorseDive(ep, tribeMembers, result)`**

Logic (follow cliff-dive pattern exactly):
1. For each tribe, shuffle members into jump order
2. Each player: `jumpChance = boldness * 0.05 + physical * 0.02 + loyalty * 0.02 + 0.08 + max(-2, momentum) * 0.04`. Clamp 0.05–0.95.
3. Jumped → push to jumpers, momentum++. Chicken → push to chickens, momentum--.
4. Tier text selection: boldness ≥ 7 = high, ≤ 3 = low, else mid.
5. **Landing quality** for jumpers: roll = physical * 0.06 + boldness * 0.04 + noise. ≥ 0.7 = perfect (3pts), ≥ 0.5 = rough (2pts), ≥ 0.3 = bellyflop (1pt), else miss (0pts).
6. **Interventions** (max 2 per tribe): same as cliff-dive — find most motivated jumper for each chicken (bond * 0.4 + social * 0.03 + physical * 0.02). Convince if bond ≥ 2, force if bond ≤ -2, else social > physical. Success flips chicken to jumper.
7. Pressure reactions for remaining chickens.
8. **Throw integration**: check `checkChallengeThrows(allMembers, {phase:'pre-merge', tribes: gs.tribes})`. Throwers chicken out deliberately. Mark `throwDisguisedAsChicken: true`. Override detection: -3% base (chickening looks natural). Store throw data on result.
9. Tribe score = avg landing points per member (jumpers only). Winner gets +1 to `result.tribeScores`.
10. Update `ep.chalMemberScores` with landing scores.
11. Bonds: chickens get -0.1 from each teammate. Forced jumpers: forcer gets -0.5 from chicken. Convinced: +0.2.
12. Popularity: perfect mount → +2. Chicken → -1.
13. Store: `result.horseDive = { tribeResults: [...], throws, winner }`. Each tribeResult: `{ tribe, jumpers, chickens, reactions, interventions, scores, tribeScore }`.

- [ ] **Step 3: Wire into `simulateCrazytown`**

Replace `// TODO: Phase 1, 2, 3 go here` with:
```js
  _simulateHorseDive(ep, tribeMembers, result);
  result.phases.push('horseDive');
```

- [ ] **Step 4: Verify — run sim, check `ep.crazytown.horseDive` has data.**

- [ ] **Step 5: Commit**
```
feat(crazytown): Phase 1 — horse dive with chicken cascade + throw integration
```

---

### Task 3: Phase 2 — Mexican Standoff

Circle elimination water gun round-by-round.

**Files:**
- Modify: `js/chal/crazytown.js` — add `_simulateStandoff` + text pools

- [ ] **Step 1: Add standoff text pools**

- `STANDOFF_HOST` — `{intro, roundStart, elimination, finalRound}`, 3 templates each.
- `STANDOFF_SHOT` — `{hit, miss, shield, betrayal, hesitation}`, 3 templates each. `(shooter, target, sPr, tPr) => string`.
- `STANDOFF_ELIMINATION` — 4 templates. `(eliminated, pr) => string`.

- [ ] **Step 2: Implement `_simulateStandoff(ep, tribeMembers, result)`**

Logic:
1. Standing pool = all members who jumped in Phase 1 (chickens sit out unless converted). If throw-chicken, they're still out.
2. `hits = {}` — per-player hit count, 2 hits = eliminated.
3. **Max 5 rounds.** Each round:
   a. Each standing player picks target. Weight: `enemyBond * 0.3 + threatScore * 0.2 + noise`. Cross-tribe preferred (same-tribe targeting only for villains). Never target self.
   b. Hit check: `mental * 0.06 + boldness * 0.04 + noise > 0.5`. Hit → target takes 1 hit.
   c. **Events (1-2 per round, random):**
      - Shield move: loyalty ≥ 7 player absorbs hit for teammate. Bond +0.4.
      - Betrayal shot: villain/schemer shoots own teammate. Bond -1.0 from all witnesses. Detected by all.
      - Showmance hesitation: player with cross-tribe showmance wastes shot on partner. No damage. Narrative drama.
   d. Eliminate players with 2+ hits. Mark as eliminated.
   e. Round ends if one tribe has all eliminated.
4. Winner = tribe with more standing. Tie = both +1.
5. **Gunslinger badge**: player with 3+ kills → badge, carry-forward buff stored on `result.gunslingers`.
6. **Throw integration**: throwers from `checkChallengeThrows` always miss. Already processed in Phase 1 — reuse throw data, don't re-roll.
7. Update `ep.chalMemberScores`: +kills * 5 + survival bonus (2 if still standing).
8. Popularity: gunslinger +3, betrayal shot -2.
9. Store: `result.standoff = { rounds: [...], standings, eliminations, gunslingers, winner }`.

- [ ] **Step 3: Add drama break between phases**

Implement `_simulateDramaBreak(ep, tribeMembers, result, breakNum)`. Pool of 6-8 events (same pattern as beach-blanket-bogus halftime): cross-tribe taunt, alliance huddle, showmance moment, injury check, pep talk, strategy whisper, chicken shame, throw confrontation. Fire 4-6 events. Store on `result.breakEvents1` / `result.breakEvents2`.

Break event pool:
```js
const DRAMA_BREAK_EVENTS = [
  { id:'cross-tribe-taunt', badge:'Trash Talk', badgeClass:'red', ... },
  { id:'alliance-huddle', badge:'Strategy', badgeClass:'teal', ... },
  { id:'showmance-moment', badge:'Romance', badgeClass:'gold', ... },
  { id:'injury-check', badge:'Injury', badgeClass:'orange', ... },
  { id:'pep-talk', badge:'Rally', badgeClass:'gold', ... },
  { id:'strategy-whisper', badge:'Whisper', badgeClass:'teal', ... },
  { id:'chicken-shame', badge:'Shame', badgeClass:'red', ... },
  { id:'throw-confrontation', badge:'Accusation', badgeClass:'red', ... },
];
```

Each event: check function → apply function (bond/pop changes) → text function. Same pattern as beach-blanket-bogus halftime events.

- [ ] **Step 4: Wire into `simulateCrazytown`**

After Phase 1:
```js
  _simulateDramaBreak(ep, tribeMembers, result, 1);
  _simulateStandoff(ep, tribeMembers, result);
  result.phases.push('standoff');
  _simulateDramaBreak(ep, tribeMembers, result, 2);
```

- [ ] **Step 5: Verify — run sim, check `ep.crazytown.standoff` has rounds + eliminations.**

- [ ] **Step 6: Commit**
```
feat(crazytown): Phase 2 — Mexican standoff + drama breaks
```

---

### Task 4: Phase 3 — Cattle Roundup

Cowboys rope cattle. Role assignment based on Phase 1 winner.

**Files:**
- Modify: `js/chal/crazytown.js` — add `_simulateRoundup` + text pools

- [ ] **Step 1: Add roundup text pools**

- `ROUNDUP_HOST` — `{intro, roundStart, capture, dodge, finale}`, 3 templates each.
- `ROUNDUP_LASSO` — `{hit, miss, tangle, teamwork}`, 3 templates each.
- `ROUNDUP_DODGE` — `{success, fail}`, 3 templates each.
- `ROUNDUP_EVENTS` — stampede, showmance standoff, rope tangle, lasso teamwork. 3 templates each.

- [ ] **Step 2: Implement `_simulateRoundup(ep, tribeMembers, result)`**

Logic:
1. Role assignment: Phase 1 winner tribe = cowboys, loser = cattle. Tied → random.
2. 3 rounds. Each round:
   a. Each cowboy picks a target cattle member. Weight: bond (enemies preferred) + strategic * 0.1 + noise.
   b. Rope check: `(cowboyPhys * 0.06 + cowboyStrat * 0.04 + gunslingerBuff + noise) vs (cattlePhys * 0.05 + cattleBold * 0.04 + noise)`. Cowboy wins → capture.
   c. Gunslinger carry-forward: +8% score buff (multiply cowboy roll by 1.08).
   d. **Events (1-2 per round):**
      - Lasso teamwork: 2 cowboys on 1 target, guaranteed capture. Bond +0.3.
      - Cattle stampede: physical ≥ 7 cattle rallies scatter. Next round all cowboys get -10% to rolls.
      - Rope tangle: cowboy catches wrong person (comedy). Wasted round.
      - Showmance standoff: cowboy can't rope crush. Wasted round.
   e. Captured cattle out of future rounds.
3. **Tables turned**: if cattle tribe leads 2-0 in tribeScores, round 3 cattle find rope and counter-rope cowboys. Role reversal mini-event.
4. Tribe score: cowboys get 1 point per capture. Cattle tribe gets 0.5 points per uncaptured member at end. Winner of roundup phase = higher total → +1 tribeScores.
5. **Throw integration**: cowboy thrower misses lasso deliberately. Cattle thrower doesn't dodge.
6. Update `ep.chalMemberScores`: cowboys +captures * 4, cattle +dodges * 3.
7. Popularity: most captures → +2 (Sheriff). Stampede leader → +1.
8. **Sheriff badge**: most captures.
9. Store: `result.roundup = { cowboys, cattle, rounds, captures, dodges, sheriff, tablesTurned, winner }`.

- [ ] **Step 3: Wire into `simulateCrazytown`**

After Phase 2 + drama break:
```js
  _simulateRoundup(ep, tribeMembers, result);
  result.phases.push('roundup');
```

- [ ] **Step 4: Add heat tracking after all phases**

```js
  // Heat: detected throwers + betrayal shots + sabotage
  if (!gs._crazytownHeat) gs._crazytownHeat = {};
  const expiresEp = (gs.episode || 1) + 2;
  // Betrayal shots from standoff
  if (result.standoff) {
    for (const round of result.standoff.rounds) {
      for (const evt of round.events) {
        if (evt.eventId === 'betrayal-shot' && evt.shooter && evt.target) {
          gs._crazytownHeat[evt.target] = { target: evt.shooter, amount: 1.5, expiresEp };
        }
      }
    }
  }
  // Throw detection heat handled by processChallengeThrows already
```

Also add `_crazytownHeat` reader in `js/alliances.js` computeHeat, after `_beachBogusHeat` block:
```js
  if (gs._crazytownHeat) {
    Object.entries(gs._crazytownHeat).forEach(([victim, data]) => {
      if (data.target === name && tribalPlayers.includes(victim) && ((gs.episode || 0) + 1) < data.expiresEp) heat += data.amount;
    });
  }
```

- [ ] **Step 5: Add tiebreaker — sudden death quick-draw**

If all 3 phases done and tribeScores tied, run a sudden-death 1v1 quick-draw: each tribe picks their highest-mental member. `score = mental * 0.08 + boldness * 0.05 + noise`. Higher wins. Winner's tribe gets +1.

- [ ] **Step 6: Finalize `simulateCrazytown` — process throws, determine winner, set ep fields**

Ensure `processChallengeThrows` called once at end with all throw data. Set `ep.challengeThrows` if any. Update debug data to include all phases.

- [ ] **Step 7: Verify — full 3-phase sim runs. Winner/loser correct. Heat stored.**

- [ ] **Step 8: Commit**
```
feat(crazytown): Phase 3 — cattle roundup + heat + tiebreaker
```

---

### Task 5: VP Shell — Spaghetti Western Overdrive CSS

The full visual identity. Film grain, wanted posters, saloon doors, neon badges, chalk scoreboard.

**Files:**
- Modify: `js/chal/crazytown.js` — add `_ctShell()` function with all CSS

- [ ] **Step 1: Implement `_ctShell(content, ep)` with full CSS**

Pattern: same as `_bbbShell` in beach-blanket-bogus.js. Returns `<style>...</style><div class="ct-shell">...</div>`.

Theme tokens:
```css
.ct-shell {
  --ct-sepia: #d4a574; --ct-leather: #8b4513; --ct-dust: #c4a882;
  --ct-blood: #8b0000; --ct-gold: #daa520; --ct-iron: #4a4a4a;
  --ct-wanted: #f5e6c8; --ct-chalk: #e8e8e8; --ct-wood: #654321;
  --ct-neon-green: #39ff14; --ct-neon-red: #ff073a; --ct-neon-gold: #ffd700;
  background: linear-gradient(180deg, #d4a574 0%, #8b6914 30%, #654321 60%, #2d1810 100%);
}
```

Key CSS classes needed:
- `.ct-shell` — base container, sepia gradient bg, wooden border
- `.ct-shell::before` — film grain overlay (same SVG noise as bbb but sepia tinted)
- `.ct-shell::after` — projector flicker animation
- `.ct-header` — weathered wood plank bg, branded iron font
- `.ct-layout` — feed + sidebar flex layout
- `.ct-sidebar` — sticky, leather texture bg
- `.ct-hud` — chalk scoreboard with flip-tile numbers
- `.ct-ev` — event card, parchment bg, torn edge pseudo-elements
- `.ct-ev.negative` / `.ct-ev.positive` / `.ct-ev.showmance` — border-left colors
- `.ct-portrait` — wanted poster frame (tan border, "WANTED" text above, bounty below)
- `.ct-portrait.dead` — sepia + "DEAD" stamp overlay
- `.ct-portrait.chicken` — chicken hat emoji overlay
- `.ct-badge-neon` — neon cactus sign effect (text-shadow glow + flicker animation)
- `.ct-badge-neon.chicken` — red neon
- `.ct-badge-neon.gunslinger` — gold neon
- `.ct-badge-neon.sheriff` — green neon
- `.ct-badge-neon.outlaw` — red neon, faster flicker
- `.ct-saloon-door` — 3D perspective transform, swing-open animation
- `.ct-poker-card` — backface-hidden, flip animation on click
- `.ct-poker-card.flipped` — rotateY(180deg)
- `.ct-chalk-num` — mechanical flip-tile number animation
- `.ct-tumbleweed` — emoji drift animation left→right
- `.ct-dust-mote` — small floating particles, random positions
- `.ct-controls` — reveal next / reveal all buttons, leather texture

Keyframes needed:
```
@keyframes ct-grain — film grain jitter (same as bbb-grain)
@keyframes ct-flicker — projector flicker (opacity steps)
@keyframes ct-neon-flicker — neon sign flicker (opacity 0.8→1→0.9→1)
@keyframes ct-neon-glow — pulsing text-shadow glow
@keyframes ct-tumbleweed — translateX(-60px → calc(100% + 60px)) + rotate(720deg)
@keyframes ct-dust-float — translateY + opacity fade
@keyframes ct-saloon-swing — perspective rotateY(90deg → 0)
@keyframes ct-card-flip — rotateY(0 → 180deg)
@keyframes ct-card-deal — translateY(-100px) + opacity + slight rotation
@keyframes ct-fade-up — opacity 0→1 + translateY(12→0)
@keyframes ct-stamp — scale(3→1) + opacity(0→1), for DEAD/CHICKEN stamps
@keyframes ct-chalk-flip — rotateX for number tile changes
@keyframes ct-countdown — scale pulse for "3... 2... 1... DRAW!"
@keyframes ct-eyes-narrow — clip-path from full face to eye-slit strip
@keyframes ct-heartbeat — scale(1→1.05→1) with increasing speed
@keyframes ct-lasso — SVG path draw (stroke-dashoffset)
@keyframes ct-brand-sizzle — opacity flash + red glow for captured stamp
```

Helper functions needed:
- `_ctPortrait(name, size)` — returns wanted poster framed portrait HTML
- `_ctNeonBadge(text, type)` — returns neon badge HTML
- `_ctChalkNum(num)` — returns chalk flip-tile number HTML
- `_ctPokerCard(content, faceDown)` — returns poker card HTML with flip

- [ ] **Step 2: Implement `rpBuildCrazytownTitleCard(ep)` — replace stub**

Content:
- Tumbleweed particles (2-3 drifting)
- Dust motes floating layer
- "Chris McLean Presents" subtitle
- "3:10 TO CRAZYTOWN" main title (branded iron font, text-shadow)
- "DIVE · DRAW · ROPE" tagline
- Phase breakdown box
- Chris opener quote
- Footer stats (player count, tribes)
- Sound toggle button

- [ ] **Step 3: Verify — title card renders with film grain, tumbleweed, neon look.**

- [ ] **Step 4: Commit**
```
feat(crazytown): VP shell — spaghetti western CSS + title card
```

---

### Task 6: VP Screens — Horse Dive + Standoff + Roundup + Results

Click-to-reveal VP screens for each phase.

**Files:**
- Modify: `js/chal/crazytown.js` — add rpBuild functions
- Modify: `js/vp-screens.js` — wire all screens

- [ ] **Step 1: Implement `rpBuildCrazytownHorseDive(ep)`**

Layout: feed + sidebar.
- Sidebar: per-tribe section with player portraits. Jumpers show landing score. Chickens show chicken badge (neon red). Converted chickens show "Pushed" or "Convinced" marker.
- Feed: click-to-reveal using `_tvState['ct-dive']` with `idx: -1`. Each reveal = one player's jump decision.
  - Poker card deal animation: card slides in face-down, click flips to reveal jump/chicken + landing quality.
  - Host commentary after bold jumps / chickens.
  - Intervention sequences: convince/force attempt + result.
  - Pressure reactions for remaining chickens.
- HUD: tribe scores (chalk flip-tiles), jumper/chicken counts.
- Phase result banner at end: winner tribe + score.

State management pattern (same as beach-blanket-bogus):
```js
if (!window._tvState) window._tvState = {};
if (!window._tvState['ct-dive']) window._tvState['ct-dive'] = { idx: -1 };
```

- [ ] **Step 2: Implement `rpBuildCrazytownStandoff(ep)`**

Layout: feed + sidebar.
- Sidebar: standing players with hit counters (0/1/2). Eliminated = sepia + "DEAD" stamp. Gunslinger badge (neon gold).
- Feed: click-to-reveal per round.
  - **Split-cam intro**: 3-way portrait strip with CSS `clip-path` narrowing to eyes. Heartbeat pulse animation that speeds up (`animation-duration` decreases each round).
  - "3... 2... 1... DRAW!" countdown with `ct-countdown` animation.
  - Target lines: dotted lines from shooter portrait to target portrait.
  - Hit/miss results as poker card flips.
  - Events (shield, betrayal, hesitation) as special event cards.
  - Elimination: portrait gets "DEAD" stamp with `ct-stamp` scale-in animation.
- HUD: standing count per tribe, round number.

- [ ] **Step 3: Implement `rpBuildCrazytownRoundup(ep)`**

Layout: feed + sidebar.
- Sidebar: cowboys vs cattle split. Captured cattle = roped icon. Sheriff badge (neon green). Cowboys show capture count.
- Feed: click-to-reveal per round.
  - Cowboy picks target → lasso SVG path animation (stroke-dashoffset).
  - Capture = "CAPTURED" brand-iron stamp with sizzle animation.
  - Dodge = cattle portrait dodges (translateX wiggle).
  - Events: teamwork, stampede, tangle, showmance standoff.
  - Tables turned: special event card with role reversal narration.
- HUD: captures vs uncaptured, round number.

- [ ] **Step 4: Implement `rpBuildCrazytownDramaBreak(ep, breakNum)`**

Same pattern as beach-blanket-bogus halftime. Event cards with portraits, badges, impact text.

- [ ] **Step 5: Implement `rpBuildCrazytownResults(ep)`**

Scoreboard summary:
- Phase-by-phase results (chalk scoreboard with flip-tiles showing 0→1 per phase win).
- Standout section: gunslinger, sheriff, most dramatic chicken, throw drama.
- Leaderboard: all players ranked by chalMemberScores, wanted poster frames.
- Winner banner with neon glow.

- [ ] **Step 6: Implement `crazytownRevealNext()` and `crazytownRevealAll()`**

Same pattern as beachBogusRevealNext/All. Increment `_tvState[screenKey].idx`, rebuild VP. Preserve `vpCurrentScreen` by finding screen index after `buildVPScreens`.

- [ ] **Step 7: Wire all screens in `js/vp-screens.js`**

Update import to include all rpBuild functions. Update the `ep.isCrazytown` block:
```js
  } else if (ep.isCrazytown && ep.crazytown) {
    vpScreens.push({ id:'ct-title', label:'🤠 3:10 to Crazytown', html: rpBuildCrazytownTitleCard(ep) });
    if (ep.crazytown.horseDive) {
      vpScreens.push({ id:'ct-dive', label:'Horse Dive', html: rpBuildCrazytownHorseDive(ep) });
    }
    if (ep.crazytown.breakEvents1?.length) {
      vpScreens.push({ id:'ct-break1', label:'Intermission', html: rpBuildCrazytownDramaBreak(ep, 1) });
    }
    if (ep.crazytown.standoff) {
      vpScreens.push({ id:'ct-standoff', label:'The Standoff', html: rpBuildCrazytownStandoff(ep) });
    }
    if (ep.crazytown.breakEvents2?.length) {
      vpScreens.push({ id:'ct-break2', label:'Tension Rising', html: rpBuildCrazytownDramaBreak(ep, 2) });
    }
    if (ep.crazytown.roundup) {
      vpScreens.push({ id:'ct-roundup', label:'The Roundup', html: rpBuildCrazytownRoundup(ep) });
    }
    vpScreens.push({ id:'ct-results', label:'Final Verdict', html: rpBuildCrazytownResults(ep) });
  }
```

- [ ] **Step 8: Verify — all VP screens render. Click-to-reveal works. Animations fire.**

- [ ] **Step 9: Commit**
```
feat(crazytown): VP screens — horse dive + standoff + roundup + results with overdrive
```

---

### Task 7: Text Backlog + Polish

Full text backlog generation + showmance moments + final polish.

**Files:**
- Modify: `js/chal/crazytown.js` — expand `_textCrazytown`

- [ ] **Step 1: Expand `_textCrazytown(ep, ln, sec)`**

Full text backlog:
```
sec('3:10 to Crazytown');
ln(ct.chrisOpener || 'The teams saddle up...');

// Phase 1: Horse Dive
sec('The Horse Dive');
// For each tribe, narrate jump order, chicken decisions, interventions, landings
// Host commentary between key moments

// Drama Break 1
sec('Between Phases');
// Narrate drama break events

// Phase 2: The Standoff
sec('Mexican Standoff');
// Round-by-round narration: who targets whom, hits, misses, events, eliminations

// Drama Break 2
sec('Rising Tension');
// Narrate drama break events

// Phase 3: The Roundup
sec('The Roundup');
// Round-by-round: lasso attempts, captures, dodges, events, tables turned

// Result
sec('The Verdict');
// Final scores, winner, loser heads to tribal
```

- [ ] **Step 2: Add showmance challenge moments**

In `simulateCrazytown`, after all phases:
- Check `_checkShowmanceChalMoment(ep)` pattern — if showmance pair on opposing tribes, fire a moment (quick embrace before tribal, or one looks back at the other).
- Check `romanticCompat` before any cross-tribe romantic event.

- [ ] **Step 3: Add `ep.coldOpen`**

Pick the most dramatic moment: throw caught, gunslinger streak, tables-turned, betrayal shot, or epic chicken cascade. Store as `result.coldOpen = { type, text, player }`.

- [ ] **Step 4: Final verification**

- Run 10+ sims with crazytown enabled
- Check: no console errors, winner/loser always set, VP screens render, text backlog generates, heat tracked, camp events fire, chalMemberScores populated, badges appear
- Check: throws fire when showmance/bond conditions met (may need to set up test cast)
- Check: `prefers-reduced-motion` — animations should degrade to static

- [ ] **Step 5: Commit**
```
feat(crazytown): text backlog + showmance moments + cold open + polish
```

---

## Summary

| Task | What | Est |
|------|------|-----|
| 1 | Registration stub | 5 min |
| 2 | Phase 1: Horse Dive | 15 min |
| 3 | Phase 2: Standoff + drama breaks | 20 min |
| 4 | Phase 3: Roundup + heat + tiebreaker | 15 min |
| 5 | VP Shell CSS | 20 min |
| 6 | VP Screens (6 screens) | 30 min |
| 7 | Text backlog + polish | 15 min |

Total: ~2 hours of focused implementation.
