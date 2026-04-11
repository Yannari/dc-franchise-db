# Paintball Deer Hunter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a schedulable pre-merge paintball hunt challenge with asymmetric hunter/deer roles, round-based elimination, social drama events, paintball war escalation, bear injuries, and overdrive VP with splatter effects.

**Architecture:** New `simulatePaintballHunt(ep)` handles role assignment, round-based hunt loop, 18+ event types, friendly fire escalation, bear injury integration. VP screen `rpBuildPaintballHunt(ep)` with paint splatter animations, dodge effects, and per-round paint counters. Text backlog via `_textPaintballHunt(ep, ln, sec)`.

**Tech Stack:** Pure JS in `simulator.html`. No external dependencies.

---

### Task 1: TWIST_CATALOG + applyTwist + Episode Branch

**Files:**
- Modify: `simulator.html` — TWIST_CATALOG, applyTwist, simulateEpisode, updateChalRecord skip

- [ ] **Step 1: Add catalog entry**

After up-the-creek entry, add:
```javascript
  { id:'paintball-hunt', emoji:'🎯', name:'Paintball Deer Hunter', category:'challenge', phase:'pre-merge', desc:'Paintball hunt. Half your tribe are hunters, half are deer. Hunters track opposing deer. Last tribe with unpainted deer wins. Social chaos guaranteed.', engineType:'paintball-hunt', minTribes:2, incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors','up-the-creek'] },
```

Add `'paintball-hunt'` to ALL other challenge twists' incompatible arrays (11 existing).

- [ ] **Step 2: Add applyTwist flag**

After `ep.isUpTheCreek = true;`:
```javascript

  } else if (engineType === 'paintball-hunt') {
    if (gs.isMerged || gs.tribes.length < 2) return;
    ep.isPaintballHunt = true;
```

- [ ] **Step 3: Add episode branch**

After up the creek branch:
```javascript
  } else if (ep.isPaintballHunt && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    simulatePaintballHunt(ep);
    // winner, loser, challengeType, tribalPlayers already set by simulatePaintballHunt
```

- [ ] **Step 4: Add to updateChalRecord skip**

Add `&& !ep.isPaintballHunt` to the skip condition.

- [ ] **Step 5: Commit**

```bash
git add simulator.html
git commit -m "feat: add Paintball Hunt to TWIST_CATALOG + applyTwist + episode branch"
```

---

### Task 2: Core Simulation — `simulatePaintballHunt(ep)`

**Files:**
- Modify: `simulator.html` — add function after `simulateUpTheCreek` ends (before `// ENGINE: PHOBIA FACTOR`)

The function must implement the full spec from `docs/superpowers/specs/2026-04-11-paintball-hunt-design.md`.

- [ ] **Step 1: Add the simulation function**

Insert between the closing `}` of `simulateUpTheCreek` and `// ENGINE: PHOBIA FACTOR` (line ~12925).

**Structure:**

```javascript
function simulatePaintballHunt(ep) {
  // 1. ROLE ASSIGNMENT
  // Math.ceil(members/2) = deer, rest = hunters. Random split.
  
  // 2. HUNT LOOP (rounds until 1 tribe has deer left)
  // Per round, per hunter:
  //   a. Search check: intuition*0.06 + random(0,0.2). < 0.4 = found nothing
  //   b. Target: weighted random from opposing unpainted deer
  //   c. Rare double find: intuition*0.02
  //   d. Shot: hunter score vs deer score
  //   e. Special events (3-5 per round from 18+ type pool)
  //   f. Friendly fire / deliberate / retaliation / paintball war
  //   g. Social events (alliance, rebellion, bonding)
  //   h. Showmance moments (3 touchpoints)
  //   i. Check: any tribe with 0 deer? → that tribe fully painted
  //   j. Check: only 1 tribe has deer? → hunt over
  
  // 3. WINNER DETERMINATION
  // Last tribe with unpainted deer wins
  // First fully painted = loser → tribal
  
  // 4. PERSONAL SCORING → chalMemberScores
  // Balanced: hunters avg ~3.0, deer avg ~3.5
  
  // 5. CAMP EVENTS (2 pos + 1-2 neg per tribe)
  
  // 6. BEAR INJURY integration (gs.lingeringInjuries)
  
  // 7. STORE ep.paintballHunt data
}
```

**Key patterns:**
- `players.find(p => p.name === name)?.archetype` for archetype
- `pronouns(name).posAdj` before nouns
- ALL proportional — no thresholds
- Block nice archetypes from deliberate friendly fire
- Pre-render all text as strings
- `players: []` on every event
- `_challengeRomanceSpark` for deer-to-deer hiding + antlers locked
- `_checkShowmanceChalMoment` for hunter-protects-deer
- `seasonConfig.romance` guard on romance checks
- Bear injury: `gs.lingeringInjuries[name] = { ep, duration: 2, type: 'bear-mauled' }`
- Heat: `gs._paintballHeat` for bear-mauled and paintball war instigators
- 2-tribe bonus events (same pattern as other challenges)
- `updateChalRecord(ep)` at the end
- Per-round data: `rounds.push({ num, matchups: [], events: [], paintStatus: {} })`

**Scoring:**
```javascript
// Hunters
const HUNTER_HIT = 2.0, HUNTER_MISS = -0.5, HUNTER_NOTHING = -0.3;
const HUNTER_EVENT_BONUS = 1.5, HUNTER_NEGATIVE = -2.0, HUNTER_STANDOFF = -1.0;

// Deer  
const DEER_DODGE = 2.0, DEER_PER_ROUND = 1.0, DEER_SURVIVOR = 4.0;
const DEER_PAINTED = -1.5, DEER_EVENT_BONUS = 1.5;
```

**Round names:**
```javascript
const ROUND_NAMES = [
  'THE HUNT BEGINS', 'INTO THE WOODS', 'THEY\'RE GETTING CLOSER',
  'DOWN TO THE WIRE', 'THE FINAL CHASE', 'ENDGAME',
  'LAST ONES STANDING', 'THE BITTER END'
];
```

- [ ] **Step 2: Add heat integration**

In computeHeat after up-the-creek heat:
```javascript
  if (gs._paintballHeat?.[name] && ((gs.episode || 0) + 1) < gs._paintballHeat[name].expiresEp) heat += gs._paintballHeat[name].amount;
```

- [ ] **Step 3: Add heat clearing**

After up-the-creek heat clearing:
```javascript
    if (gs._paintballHeat) {
      Object.keys(gs._paintballHeat).forEach(k => {
        if (((gs.episode || 0) + 1) >= gs._paintballHeat[k].expiresEp) delete gs._paintballHeat[k];
      });
      if (!Object.keys(gs._paintballHeat).length) delete gs._paintballHeat;
    }
```

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: simulatePaintballHunt — round-based hunt with 18+ event types + paintball war"
```

---

### Task 3: Episode History + patchEpisodeHistory + Badges

**Files:**
- Modify: `simulator.html` — history push, patch, badge chains

- [ ] **Step 1: Add to episode history push**

After up-the-creek fields:
```javascript
    isPaintballHunt:    ep.isPaintballHunt    || false,
    paintballHunt:      ep.paintballHunt      || null,
```

- [ ] **Step 2: Add to patchEpisodeHistory**

After up-the-creek patch:
```javascript
  if (ep.isPaintballHunt) h.isPaintballHunt = true;
  if (!h.paintballHunt && ep.paintballHunt) h.paintballHunt = ep.paintballHunt;
```

- [ ] **Step 3: Add badge text entries**

All paintball event types:
```javascript
: evt.type === 'pbHit'              ? (evt.badgeText || evt.badge || 'PAINTED OUT')
: evt.type === 'pbMiss'             ? (evt.badgeText || evt.badge || 'DODGED')
: evt.type === 'pbNotFound'         ? (evt.badgeText || evt.badge || 'LOST IN WOODS')
: evt.type === 'pbEpicChase'        ? (evt.badgeText || evt.badge || 'EPIC CHASE')
: evt.type === 'pbAmbush'           ? (evt.badgeText || evt.badge || 'AMBUSH')
: evt.type === 'pbSneakAttack'      ? (evt.badgeText || evt.badge || 'SNEAK ATTACK')
: evt.type === 'pbCamouflage'       ? (evt.badgeText || evt.badge || 'CAMOUFLAGE')
: evt.type === 'pbRebellion'        ? (evt.badgeText || evt.badge || 'REBELLION')
: evt.type === 'pbDecoy'            ? (evt.badgeText || evt.badge || 'DECOY')
: evt.type === 'pbTaunt'            ? (evt.badgeText || evt.badge || 'TAUNT')
: evt.type === 'pbMudSlide'         ? (evt.badgeText || evt.badge || 'MUD SLIDE')
: evt.type === 'pbTreeClimb'        ? (evt.badgeText || evt.badge || 'TREE CLIMB')
: evt.type === 'pbMisfire'          ? (evt.badgeText || evt.badge || 'MISFIRE')
: evt.type === 'pbHunterRivalry'    ? (evt.badgeText || evt.badge || 'HUNTER RIVALRY')
: evt.type === 'pbStampede'         ? (evt.badgeText || evt.badge || 'DEER STAMPEDE')
: evt.type === 'pbBear'             ? (evt.badgeText || evt.badge || 'BEAR MAULED')
: evt.type === 'pbAntlersLocked'    ? (evt.badgeText || evt.badge || 'ANTLERS LOCKED')
: evt.type === 'pbFriendlyFire'     ? (evt.badgeText || evt.badge || 'FRIENDLY FIRE')
: evt.type === 'pbDeliberateShot'   ? (evt.badgeText || evt.badge || 'DELIBERATE SHOT')
: evt.type === 'pbRetaliation'      ? (evt.badgeText || evt.badge || 'RETALIATION')
: evt.type === 'pbPaintballWar'     ? (evt.badgeText || evt.badge || 'PAINTBALL WAR')
: evt.type === 'pbAllianceStandoff' ? (evt.badgeText || evt.badge || 'STANDOFF')
: evt.type === 'pbObsessiveChase'   ? (evt.badgeText || evt.badge || 'OBSESSED')
: evt.type === 'pbDeerBonding'      ? (evt.badgeText || evt.badge || 'HIDING TOGETHER')
: evt.type === 'pbAllianceMeeting'  ? (evt.badgeText || evt.badge || 'PLOTTING')
: evt.type === 'pbHunterProtects'   ? (evt.badgeText || evt.badge || 'LOVE OVER GAME')
: evt.type === 'pbDeerPact'         ? (evt.badgeText || evt.badge || 'PACT')
: evt.type === 'pbHunterScheme'     ? (evt.badgeText || evt.badge || 'SCHEMING')
: evt.type === 'pbCrossRoleWhisper' ? (evt.badgeText || evt.badge || 'WHISPER')
: evt.type === 'pbRebellionAlliance'? (evt.badgeText || evt.badge || 'REBELLION')
: evt.type === 'pbSympathyShot'     ? (evt.badgeText || evt.badge || 'PILING ON')
: evt.type === 'pbMVPHunter'        ? (evt.badgeText || evt.badge || 'TOP HUNTER')
: evt.type === 'pbLastDeer'         ? (evt.badgeText || evt.badge || 'LAST DEER STANDING')
```

- [ ] **Step 4: Add badge class entries**

```javascript
: evt.type === 'pbHit' || evt.type === 'pbAmbush' || evt.type === 'pbSneakAttack' || evt.type === 'pbMVPHunter' ? 'gold'
: evt.type === 'pbCamouflage' || evt.type === 'pbRebellion' || evt.type === 'pbDecoy' || evt.type === 'pbLastDeer' || evt.type === 'pbDeerBonding' || evt.type === 'pbDeerPact' || evt.type === 'pbTreeClimb' || evt.type === 'pbStampede' ? 'gold'
: evt.type === 'pbBear' || evt.type === 'pbFriendlyFire' || evt.type === 'pbDeliberateShot' || evt.type === 'pbRetaliation' || evt.type === 'pbPaintballWar' || evt.type === 'pbSympathyShot' ? 'red'
: evt.type === 'pbMiss' || evt.type === 'pbEpicChase' || evt.type === 'pbTaunt' || evt.type === 'pbAntlersLocked' || evt.type === 'pbObsessiveChase' || evt.type === 'pbAllianceStandoff' || evt.type === 'pbHunterProtects' || evt.type === 'pbMudSlide' || evt.type === 'pbMisfire' || evt.type === 'pbHunterRivalry' || evt.type === 'pbNotFound' ? ''
```

- [ ] **Step 5: Commit**

```bash
git add simulator.html
git commit -m "feat: paintball hunt episode history, patchEpisodeHistory, 33 badge types"
```

---

### Task 4: VP Screen — `rpBuildPaintballHunt(ep)` (Overdrive)

**Files:**
- Modify: `simulator.html` — add function before rpBuildSuckyOutdoors, register in buildVPScreens

- [ ] **Step 1: Add the VP function with overdrive treatment**

The VP must include:

**CSS keyframes (injected in `<style>` block):**
```css
@keyframes paintSplat {
  0% { transform: scale(0) rotate(0deg); opacity: 1; }
  50% { transform: scale(1.5) rotate(15deg); opacity: 0.8; }
  100% { transform: scale(1) rotate(5deg); opacity: 0.6; }
}
@keyframes paintDrip {
  0% { height: 0; opacity: 0.8; }
  100% { height: 20px; opacity: 0.3; }
}
@keyframes dodgeSlide {
  0% { transform: translateX(0); }
  30% { transform: translateX(-15px); }
  60% { transform: translateX(5px); }
  100% { transform: translateX(0); }
}
@keyframes targetPulse {
  0%, 100% { box-shadow: 0 0 0 rgba(255,0,0,0); }
  50% { box-shadow: 0 0 15px rgba(255,0,0,0.3); }
}
@keyframes warShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}
```

**Page structure:**
- Forest background with canopy overlay + leaf particles
- Role assignment display (hunters with gun emoji, deer with antler emoji per tribe)
- Per-round sections (click-to-reveal)
- Paint counter bar per tribe (deer portraits, painted ones get tribe-color splatter + greyscale)
- Dynamic round names based on hunt progress

**HIT card:** Paint splatter radial gradient in tribe color behind deer portrait, "PAINTED OUT" stamp, drip effect, portrait fades
**MISS card:** Deer portrait slides (dodgeSlide), "DODGED" in green, paintball streak that misses
**NOT FOUND:** Hunter with "?" marks, faded
**Special events:** Dramatic interlude cards matching event type
**Paintball war:** Multi-card sequence with warShake animation, rapid splatter effects
**Final:** Last deer spotlight, winner celebration, loser = all deer splattered

- [ ] **Step 2: Register in buildVPScreens**

After up-the-creek:
```javascript
  } else if (ep.isPaintballHunt && ep.paintballHunt) {
    vpScreens.push({ id:'paintball-hunt', label:'Paintball Hunt', html: rpBuildPaintballHunt(ep) });
```

- [ ] **Step 3: Exclude from generic twist screen**

Add `&& t.type !== 'paintball-hunt'` to rpBuildPreTwist filter.

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: paintball hunt VP overdrive — splatter effects, dodge animations, paint counters"
```

---

### Task 5: Text Backlog + Cold Open + Timeline Tag + Debug

**Files:**
- Modify: `simulator.html` — multiple locations

- [ ] **Step 1: Add text backlog**

After `_textUpTheCreek`:
```javascript
function _textPaintballHunt(ep, ln, sec) {
  if (!ep.isPaintballHunt || !ep.paintballHunt) return;
  const pb = ep.paintballHunt;
  sec('PAINTBALL DEER HUNTER');
  ln('Hunters vs deer. Last tribe with unpainted deer wins.');
  Object.entries(pb.roles || {}).forEach(([tribe, roles]) => {
    ln(`${tribe} — Hunters: ${roles.hunters.join(', ')} | Deer: ${roles.deer.join(', ')}`);
  });
  (pb.rounds || []).forEach(r => {
    ln('');
    ln(`── ROUND ${r.num} ──`);
    (r.matchups || []).forEach(m => {
      if (m.result === 'hit') ln(`  [HIT] ${m.hunter} → ${m.deer} PAINTED OUT`);
      else if (m.result === 'miss') ln(`  [MISS] ${m.hunter} → ${m.deer} DODGED`);
      else if (m.result === 'notFound') ln(`  [---] ${m.hunter} found nothing`);
    });
    (r.events || []).forEach(evt => {
      ln(`  [${evt.badge || evt.type}] ${evt.text}`);
    });
    // Paint status
    Object.entries(r.paintStatus || {}).forEach(([tribe, status]) => {
      ln(`  ${tribe}: ${status.remaining}/${status.total} deer remaining`);
    });
  });
  if (pb.bearMauled?.length) ln(`BEAR MAULED: ${pb.bearMauled.join(', ')}`);
  ln(`Winner: ${pb.winner}. ${pb.loser} goes to tribal.`);
  if (pb.mvp) ln(`MVP: ${pb.mvp}`);
}
```

Wire into generateSummaryText after `_textUpTheCreek`:
```javascript
  _textPaintballHunt(ep, ln, sec);
```

- [ ] **Step 2: Add cold open recap**

After up-the-creek cold open:
```javascript
    if (prevEp.isPaintballHunt && prevEp.paintballHunt) {
      const _pb = prevEp.paintballHunt;
      html += `<div class="vp-card" style="border-color:rgba(63,185,80,0.15);margin-bottom:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#3fb950;margin-bottom:4px">PAINTBALL DEER HUNTER</div>
        <div style="font-size:12px;color:#8b949e">${_pb.winner} won the hunt.${_pb.mvp ? ` MVP: ${_pb.mvp}.` : ''}${_pb.bearMauled?.length ? ` ${_pb.bearMauled[0]} was mauled by a bear.` : ''}${_pb.paintballWar ? ' A paintball war broke out.' : ''}</div>
      </div>`;
    }
```

- [ ] **Step 3: Add timeline tag**

After `utcTag`:
```javascript
    const phTag = ep.isPaintballHunt ? `<span class="ep-hist-tag" style="background:rgba(63,185,80,0.15);color:#3fb950">Paintball Hunt</span>` : '';
```

Add `${phTag}` to tag rendering.

- [ ] **Step 4: Add debug breakdown**

In debug challenge tab after up-the-creek breakdown:
```javascript
    if (ep.paintballHunt?.rounds) {
      html += `<div style="font-family:var(--font-display);font-size:13px;color:#f0883e;margin:16px 0 8px">Paintball Hunt — Summary</div>`;
      const pb = ep.paintballHunt;
      Object.entries(pb.roles || {}).forEach(([tribe, roles]) => {
        const tc = tribeColor(tribe);
        html += `<div style="font-size:10px;color:${tc};font-weight:700;margin-top:4px">${tribe}</div>`;
        html += `<div style="font-size:9px;color:#6e7681">Hunters: ${roles.hunters.join(', ')} | Deer: ${roles.deer.join(', ')}</div>`;
      });
      pb.rounds.forEach(r => {
        html += `<div style="font-size:10px;font-weight:700;color:#8b949e;margin-top:6px">Round ${r.num} (${(r.matchups||[]).length} shots)</div>`;
        (r.matchups||[]).forEach(m => {
          const col = m.result === 'hit' ? '#3fb950' : m.result === 'miss' ? '#f85149' : '#6e7681';
          html += `<div style="font-size:9px;color:${col}">${m.result === 'notFound' ? m.hunter + ' found nothing' : m.hunter + ' → ' + m.deer + ' ' + m.result.toUpperCase()}</div>`;
        });
        (r.events||[]).forEach(evt => {
          html += `<div style="font-size:9px;color:#484f58">[${evt.badge||evt.type}] ${(evt.text||'').substring(0,80)}</div>`;
        });
      });
      if (pb.bearMauled?.length) html += `<div style="font-size:9px;color:#f85149;margin-top:4px">Bear mauled: ${pb.bearMauled.join(', ')}</div>`;
    }
```

- [ ] **Step 5: Add `isPaintballHunt` to challenge tab button condition and `_chalType`**

Add `|| ep.isPaintballHunt` to button condition.
Add `ep.isPaintballHunt ? 'Paintball Hunt' :` to `_chalType`.

- [ ] **Step 6: Commit**

```bash
git add simulator.html
git commit -m "feat: paintball hunt text backlog, cold open, timeline tag, debug breakdown"
```

---

### Task 6: CLAUDE.md Documentation

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add to Key Engine Functions**

After `simulateUpTheCreek`:
```
- `simulatePaintballHunt(ep)` — paintball hunt challenge (pre-merge, hunter/deer roles, elimination rounds)
```

- [ ] **Step 2: Add to Core State**

After `gs._upTheCreekHeat`:
```
- `gs._paintballHeat` — temporary heat from paintball hunt (bear mauled, war instigators)
```

- [ ] **Step 3: Add to challenge table**

Add row:
```
| `paintball-hunt` | Paintball Hunt | Hunter/deer split, round-based elimination, paintball war, bear injury | Splatter effects VP |
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add Paintball Hunt to CLAUDE.md"
```
