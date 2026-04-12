# Who Can You Trust? Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a schedulable pre-merge trust challenge with Chris-picked pairs, 3 rounds of trust tests (rock climb, fugu cooking, 3 blind challenges), role negotiation, sabotage mechanics, deep bond consequences, hidden redemption moments, and overdrive VP with per-round visual themes.

**Architecture:** New `simulateTrustChallenge(ep)` handles pair selection, role negotiation, 3 rounds of trust tests with deep events, winner determination. VP screen `rpBuildTrustChallenge(ep)` with trust meters, rope/blindfold animations, per-round visual themes. Text backlog via `_textTrustChallenge(ep, ln, sec)`.

**Tech Stack:** Pure JS in `simulator.html`. No external dependencies.

---

### Task 1: TWIST_CATALOG + applyTwist + Episode Branch

**Files:**
- Modify: `simulator.html` — TWIST_CATALOG, applyTwist, simulateEpisode, updateChalRecord skip

- [ ] **Step 1: Add catalog entry**

After hells-kitchen entry, add:
```javascript
  { id:'trust-challenge', emoji:'🤝', name:"Who Can You Trust?", category:'challenge', phase:'pre-merge', desc:'Three trust tests. Chris picks the worst pairs. Rock climb, fugu cooking, blind challenges. Trust is earned or destroyed.', engineType:'trust-challenge', minTribes:2, incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors','up-the-creek','paintball-hunt','hells-kitchen'] },
```

Add `'trust-challenge'` to ALL other challenge twists' incompatible arrays (14 existing).

- [ ] **Step 2: Add applyTwist flag**

After `ep.isHellsKitchen = true;` block:
```javascript
  } else if (engineType === 'trust-challenge') {
    if (gs.isMerged || gs.tribes.length < 2) return;
    ep.isTrustChallenge = true;
```

- [ ] **Step 3: Add episode branch**

After hells-kitchen branch:
```javascript
  } else if (ep.isTrustChallenge && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    simulateTrustChallenge(ep);
    // winner, loser, challengeType, tribalPlayers already set by simulateTrustChallenge
```

- [ ] **Step 4: Add to updateChalRecord skip**

Add `&& !ep.isTrustChallenge` to the skip condition.

- [ ] **Step 5: Commit**

```bash
git add simulator.html
git commit -m "feat: add Trust Challenge to TWIST_CATALOG + applyTwist + episode branch"
```

---

### Task 2: Core Simulation — `simulateTrustChallenge(ep)`

**Files:**
- Modify: `simulator.html` — add function after `simulateHellsKitchen` ends (before `// ENGINE: PHOBIA FACTOR`)

The function must implement the full spec from `docs/superpowers/specs/2026-04-12-trust-challenge-design.md`.

- [ ] **Step 1: Add the simulation function**

Insert between the closing `}` of `simulateHellsKitchen` and `// ENGINE: PHOBIA FACTOR`.

**Structure:**

```javascript
function simulateTrustChallenge(ep) {
  // 1. PAIR SELECTION (Chris picks for drama)
  //    Round 1: lowest bond pair per tribe
  //    Round 2: showmance/archetype clash/neutral pair
  //    Round 3: remaining players, fill 3 blind sub-rounds
  
  // 2. ROLE NEGOTIATION per round
  //    negotiation = bond * 0.03 + avg_temperament * 0.04 + (10 - max_boldness) * 0.02 + random
  //    High → correct roles. Low → wrong roles (ego clash).
  
  // 3. ROUND 1: EXTREME ROCK CLIMB
  //    climbScore = climber.physical*0.04 + climber.endurance*0.03 + random(0,0.12)
  //                + bond*0.025 + belayer.loyalty*0.02 + belayer.temperament*0.015
  //    Obstacles, sabotage check, heroic catch, summit moment
  
  // 4. ROUND 2: FUGU SASHIMI
  //    cookScore = cook.intuition*0.04 + cook.mental*0.03 + random(0,0.12)
  //               + bond*0.02 + cook.loyalty*0.02
  //    Poisoning check, hesitation, deliberate botch
  
  // 5. ROUND 3: THREE BLIND CHALLENGES (best of 3)
  //    3a: Blind William Tell — shooter.intuition*0.03 + random(0,0.2) + trust modifiers
  //    3b: Blind Trapeze — catcher.physical*0.03 + random(0,0.15) + trust modifiers
  //    3c: Blind Toboggan — driver.physical*0.03 + navigator.intuition*0.03 + random(0,0.15) + trust
  //    Rule break DQ check on toboggan
  
  // 6. HIDDEN MOMENTS (redemption act, witness)
  
  // 7. WINNER DETERMINATION (2+ rounds wins)
  
  // 8. PERSONAL SCORING → chalMemberScores
  
  // 9. CAMP EVENTS (trust built, saboteur, poisoner, etc.)
  
  // 10. HEAT INTEGRATION (gs._trustHeat)
  
  // 11. STORE ep.trustChallenge data + timeline
}
```

**Key patterns the subagent MUST follow:**
- `players.find(p => p.name === name)?.archetype` for archetype
- `pronouns(name).posAdj` before nouns, `pos` standalone
- ALL proportional stats — no thresholds for gameplay
- Camp events MUST have `players: []` + `badgeText`/`badgeClass`
- `_challengeRomanceSpark` for trapeze perfect catch with compatible pair
- `_checkShowmanceChalMoment` for danger moments (climb, trapeze)
- `seasonConfig.romance` guard on romance checks
- `updateChalRecord(ep)` at end with `ep.chalMemberScores` set
- Pre-render ALL text as strings
- Timeline: build per-round, store events grouped by round, stable order
- `ep.winner`/`ep.loser` must be tribe OBJECTS not strings
- `ep.tribalPlayers` filtered by `gs.activePlayers`
- `ep.safeTribes` for 3+ tribes
- Events need 3-5 text variants each
- Deep consequences on EVERY event (bond changes, heat, camp ripple)
- Temperament affects negotiation, sabotage chance, mid-challenge reactions
- Emotional state debuff for recently-hurt players
- Hidden moment: `_chainAfter`-style — redemption fires, then witness fires after
- `kind: 'event'` on timeline items (not `type:` which gets overwritten by spread)

**Scoring constants:**
```javascript
const ROUND_WIN = 2.0, ROUND_LOSE = -0.5;
const CORRECT_ROLE = 0.5, WRONG_ROLE = -0.5;
const SABOTAGE_PENALTY = -2.0, OVERCAME_DISTRUST = 1.5;
const PERFECT_MOMENT = 1.5, GOT_POISONED = -1.0;
const RULE_BREAK_DQ = -2.0, REDEMPTION = 1.0;
```

- [ ] **Step 2: Add heat integration**

In computeHeat after cooking heat line:
```javascript
  if (gs._trustHeat?.[name] && ((gs.episode || 0) + 1) < gs._trustHeat[name].expiresEp) heat += gs._trustHeat[name].amount;
```

- [ ] **Step 3: Add heat clearing**

After cooking heat clearing:
```javascript
    if (gs._trustHeat) {
      Object.keys(gs._trustHeat).forEach(k => {
        if (((gs.episode || 0) + 1) >= gs._trustHeat[k].expiresEp) delete gs._trustHeat[k];
      });
      if (!Object.keys(gs._trustHeat).length) delete gs._trustHeat;
    }
```

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: simulateTrustChallenge — 3-round trust tests with deep consequences"
```

---

### Task 3: Episode History + patchEpisodeHistory + Badges

**Files:**
- Modify: `simulator.html` — history push, patch, badge chains

- [ ] **Step 1: Add to episode history push**

After hells-kitchen fields:
```javascript
    isTrustChallenge:   ep.isTrustChallenge   || false,
    trustChallenge:     ep.trustChallenge      || null,
```

- [ ] **Step 2: Add to patchEpisodeHistory**

After hells-kitchen patch:
```javascript
  if (ep.isTrustChallenge) h.isTrustChallenge = true;
  if (!h.trustChallenge && ep.trustChallenge) h.trustChallenge = ep.trustChallenge;
```

- [ ] **Step 3: Add badge text entries**

All trust challenge event types. Expected types include:
`tcEgoClash`, `tcCalmDiscussion`, `tcSteamroll`, `tcAwkwardSilence`, `tcStrategicAssign`,
`tcExplosion`, `tcHabanero`, `tcOilSlick`, `tcNailGrab`, `tcBelayerEncourage`, `tcBelayerDistract`,
`tcRopeDrop`, `tcHumiliation`, `tcHeroicCatch`, `tcSummit`,
`tcPerfectDish`, `tcSuspiciousEater`, `tcPoisoning`, `tcCookConfidence`, `tcEaterBravery`,
`tcCookPanic`, `tcDeliberateBotch`, `tcYouFirst`,
`tcPerfectHit`, `tcFaceHit`, `tcWildShooter`, `tcPerfectCatch`, `tcJellyfishFall`,
`tcCatcherSabotage`, `tcTrustLeap`, `tcFrozenJumper`, `tcExplosionDodge`, `tcRuleBreakDQ`,
`tcNavigatorScream`, `tcWrongDirection`,
`tcRedemption`, `tcWitness`, `tcPostArgument`, `tcPostBonding`, `tcSpectatorReaction`,
`tcToldYouSo`, `tcGrudgingRespect`,
`tcTrustBuilt`, `tcSaboteur`, `tcRuleBreaker`, `tcWildShooterCamp`, `tcPoisoner`, `tcEgoClashCamp`

- [ ] **Step 4: Add badge class entries**

Gold for positive (heroic catch, perfect dish, trust built, grudging respect, redemption).
Red for negative (sabotage, poisoning, DQ, wild shooter).
Neutral for drama (ego clash, spectator reaction, suspicion).

- [ ] **Step 5: Commit**

```bash
git add simulator.html
git commit -m "feat: trust challenge episode history, patchEpisodeHistory, badges"
```

---

### Task 4: VP Screen — `rpBuildTrustChallenge(ep)` (Overdrive)

**Files:**
- Modify: `simulator.html` — add function, register in buildVPScreens, CSS animations

- [ ] **Step 1: Add CSS keyframes**

In the `<style>` block after hells-kitchen keyframes:
```css
@keyframes trustGlow { ... }
@keyframes distrustCrack { ... }
@keyframes ropeDrop { ... }
@keyframes ropeSnap { ... }
@keyframes climbUp { ... }
@keyframes poisonPulse { ... }
@keyframes blindfoldReveal { ... }
@keyframes jellyZap { ... }
@keyframes tobogganShake { ... }
@keyframes trustBuild { ... }
@keyframes secretGlow { ... }
```
(Full definitions in spec VP section)

- [ ] **Step 2: Add the VP function**

`rpBuildTrustChallenge(ep)` before `rpBuildSuckyOutdoors`:
- State key: `tc_reveal_` + ep.num
- Scroll-preserving reveal onclick
- Per-round visual themes (climb=rocky brown, fugu=poison green, blind=dark+blindfold stripe)
- Pair cards with trust meter bars (animated red→green gradient)
- Bond indicator between portraits (crack/chain/heart)
- Role badges with ropeDrop animation
- Round-specific event cards (ropeSnap for sabotage, poisonPulse for poisoning, etc.)
- Blind sub-round headers (🎯/🎪/🛷)
- Rule break DQ: red X stamp over winning score
- Hidden moment: gold secretGlow card
- Final scoreboard: rounds won as ✓/✗
- NEXT/REVEAL ALL with rp-btn class

- [ ] **Step 3: Register in buildVPScreens**

After hells-kitchen:
```javascript
  } else if (ep.isTrustChallenge && ep.trustChallenge) {
    vpScreens.push({ id:'trust-challenge', label:"Who Can You Trust?", html: rpBuildTrustChallenge(ep) });
```

- [ ] **Step 4: Exclude from rpBuildPreTwist**

Add `&& t.type !== 'trust-challenge'` to filter.

- [ ] **Step 5: Commit**

```bash
git add simulator.html
git commit -m "feat: trust challenge VP overdrive — trust meters, rope animations, per-round themes"
```

---

### Task 5: Text Backlog + Cold Open + Timeline Tag + Debug

**Files:**
- Modify: `simulator.html` — multiple locations

- [ ] **Step 1: Add text backlog**

After `_textHellsKitchen`:
```javascript
function _textTrustChallenge(ep, ln, sec) {
  if (!ep.isTrustChallenge || !ep.trustChallenge) return;
  const tc = ep.trustChallenge;
  sec("WHO CAN YOU TRUST?");
  ln('Three-round trust challenge. Chris picks the pairs.');
  // Per round: pairs, roles, events, score
  ['round1', 'round2', 'round3'].forEach(rk => {
    const round = tc.rounds?.[rk];
    if (!round) return;
    ln('');
    ln(`── ${round.label || rk.toUpperCase()} ──`);
    Object.entries(round.pairs || {}).forEach(([tribe, pair]) => {
      ln(`  ${tribe}: ${pair.join(' & ')} (${round.roles?.[tribe]?.role1 || '?'} / ${round.roles?.[tribe]?.role2 || '?'})`);
    });
    if (round.winner) ln(`  Winner: ${round.winner}`);
  });
  (tc.events || []).forEach(evt => {
    ln(`  [${evt.badge || evt.badgeText || evt.type}] ${evt.text}`);
  });
  if (tc.sabotage?.length) ln(`SABOTAGE: ${tc.sabotage.map(s => s.perpetrator).join(', ')}`);
  if (tc.poisoned?.length) ln(`POISONED: ${tc.poisoned.join(', ')}`);
  if (tc.ruleBreak) ln(`RULE BREAK DQ: ${tc.ruleBreak.player}`);
  if (tc.redemption) ln(`HIDDEN MOMENT: ${tc.redemption.kind} witnessed by ${tc.redemption.witness}`);
  ln(`Winner: ${tc.winner}. ${tc.loser} goes to tribal.`);
  if (tc.mvp) ln(`MVP: ${tc.mvp}`);
}
```

Wire into `generateSummaryText` after `_textHellsKitchen`:
```javascript
  _textTrustChallenge(ep, ln, sec);
```

- [ ] **Step 2: Add cold open recap**

After hells-kitchen cold open:
```javascript
    if (prevEp.isTrustChallenge && prevEp.trustChallenge) {
      const _tc = prevEp.trustChallenge;
      html += `<div class="vp-card" style="border-color:rgba(56,189,248,0.15);margin-bottom:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#38bdf8;margin-bottom:4px">WHO CAN YOU TRUST?</div>
        <div style="font-size:12px;color:#8b949e">${_tc.winner} won the trust challenge.${_tc.sabotage?.length ? ' Sabotage!' : ''}${_tc.poisoned?.length ? ` ${_tc.poisoned[0]} was poisoned.` : ''}${_tc.ruleBreak ? ' A rule break changed everything.' : ''}${_tc.redemption ? ' A secret act of kindness was witnessed.' : ''}</div>
      </div>`;
    }
```

- [ ] **Step 3: Add timeline tag**

After hells-kitchen tag:
```javascript
    const tcTag = ep.isTrustChallenge ? `<span class="ep-hist-tag" style="background:rgba(56,189,248,0.15);color:#38bdf8">Trust Challenge</span>` : '';
```
Add `${tcTag}` to tag rendering.

- [ ] **Step 4: Add debug breakdown**

In debug challenge tab after hells-kitchen breakdown:
```javascript
    if (ep.trustChallenge) {
      html += `<div style="font-family:var(--font-display);font-size:13px;color:#38bdf8;margin:16px 0 8px">Trust Challenge — Summary</div>`;
      const tc = ep.trustChallenge;
      ['round1', 'round2', 'round3'].forEach(rk => {
        const r = tc.rounds?.[rk];
        if (!r) return;
        html += `<div style="font-size:10px;font-weight:700;color:#8b949e;margin-top:6px">${r.label || rk}</div>`;
        Object.entries(r.pairs || {}).forEach(([tribe, pair]) => {
          const tc2 = tribeColor(tribe);
          const score = r.scores?.[tribe] || 0;
          const col = r.winner === tribe ? '#3fb950' : '#f85149';
          html += `<div style="font-size:9px;color:${col}">${tribe}: ${pair.join(' & ')} → ${score.toFixed(3)}</div>`;
        });
      });
      if (tc.sabotage?.length) html += `<div style="font-size:9px;color:#f85149;margin-top:4px">Sabotage: ${tc.sabotage.map(s => `${s.perpetrator} → ${s.victim}`).join(', ')}</div>`;
      if (tc.poisoned?.length) html += `<div style="font-size:9px;color:#f85149">Poisoned: ${tc.poisoned.join(', ')}</div>`;
      if (tc.ruleBreak) html += `<div style="font-size:9px;color:#f85149">Rule Break DQ: ${tc.ruleBreak.player} (${tc.ruleBreak.tribe})</div>`;
      if (tc.redemption) html += `<div style="font-size:9px;color:#fbbf24">Hidden: ${tc.redemption.kind} witnessed by ${tc.redemption.witness}</div>`;
      html += `<div style="font-size:9px;color:#8b949e;margin-top:4px">Winner: ${tc.winner} | Loser: ${tc.loser}${tc.mvp ? ' | MVP: ' + tc.mvp : ''}</div>`;
    }
```

- [ ] **Step 5: Add `isTrustChallenge` to challenge tab button condition and `_chalType`**

Add `|| ep.isTrustChallenge` to button condition.
Add `ep.isTrustChallenge ? "Trust Challenge" :` to `_chalType`.

- [ ] **Step 6: Commit**

```bash
git add simulator.html
git commit -m "feat: trust challenge text backlog, cold open, timeline tag, debug breakdown"
```

---

### Task 6: CLAUDE.md Documentation

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add to challenge table**

After hells-kitchen row:
```
| `trust-challenge` | Who Can You Trust? | 3-round pair trust tests, Chris picks rivals, sabotage, fugu poisoning, blind challenges | Trust meters + per-round themes |
```

- [ ] **Step 2: Add to heat list**

Add `gs._trustHeat` to the temporary heat line.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add Trust Challenge to CLAUDE.md"
```

---

## Self-Review

**Spec coverage check:**
- Pair selection (drama/wildcard/remaining) → Task 2
- Role negotiation (bond+temperament+boldness) → Task 2
- Round 1 rock climb (score + obstacles + sabotage) → Task 2
- Round 2 fugu (score + poisoning + hesitation + sabotage) → Task 2
- Round 3 blind challenges (3 sub-rounds, best of 3) → Task 2
- Rule break DQ (toboggan, emotional trigger) → Task 2
- Hidden moments (redemption + witness) → Task 2
- Deep event consequences (bond, heat, camp) → Task 2
- Personal scoring → chalMemberScores → Task 2
- Winner determination (2+ rounds) → Task 2
- Heat integration → Task 2
- VP overdrive (11 animations, per-round themes) → Task 4
- Episode history + badges → Task 3
- Text backlog → Task 5
- Cold open recap → Task 5
- Timeline tag → Task 5
- Debug tab → Task 5
- CLAUDE.md → Task 6
- TWIST_CATALOG + applyTwist → Task 1

**No gaps found.** All spec sections covered.
