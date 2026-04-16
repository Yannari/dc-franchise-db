# Hide and Be Sneaky Overdrive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add animations, Chris commentary, showmance/romance, cold open, stalker arc, relocation story, status tracker, multi-beat events, and badge registration to the existing Hide and Be Sneaky challenge.

**Architecture:** All changes in `js/chal/hide-and-be-sneaky.js` (primary) with minor integration touches. The file has 3 sections: constants/helpers (lines 1-148), simulation (lines 149-830), VP/text (lines 831-1229). Each task adds to one or more of these sections.

**Tech Stack:** Vanilla ES modules, CSS animations, no build step.

**Spec:** `docs/superpowers/specs/2026-04-15-hide-and-be-sneaky-overdrive-design.md`

---

### Task 1: CSS Animations

**Files:**
- Modify: `js/chal/hide-and-be-sneaky.js` (NV_STYLES constant, ~line 915)

Add all CSS animation keyframes to the `NV_STYLES` string and update relevant VP elements to use them.

- [ ] **Step 1: Add animation keyframes to NV_STYLES**

Find the `const NV_STYLES` template literal (line 915). Append these keyframes BEFORE the closing backtick:

```css
  @keyframes nv-scan-in { 0% { opacity:0; clip-path:inset(0 100% 0 0); } 100% { opacity:1; clip-path:inset(0 0 0 0); } }
  .nv-scan-in { animation: nv-scan-in 0.3s ease-out both; }
  @keyframes nv-soaked { 0%,100%{transform:translateX(0)} 15%,45%,75%{transform:translateX(-4px)} 30%,60%,90%{transform:translateX(4px)} }
  .nv-soaked-shake { animation: nv-soaked 0.4s; }
  @keyframes nv-splash { 0%{opacity:0.5;transform:scale(1)} 100%{opacity:0;transform:scale(1.5)} }
  @keyframes nv-beat-in { 0%{opacity:0;transform:translateX(30px)} 100%{opacity:1;transform:translateX(0)} }
  @keyframes nv-beat-jitter { 0%{opacity:0;transform:translateX(20px)} 25%{transform:translateX(-3px)} 50%{transform:translateX(3px)} 75%{transform:translateX(-2px)} 100%{opacity:1;transform:translateX(0)} }
  @keyframes nv-found-pulse { 0%,100%{box-shadow:0 0 0 rgba(255,100,50,0)} 50%{box-shadow:0 0 12px rgba(255,100,50,0.6)} }
  .nv-found-pulse { animation: nv-found-pulse 0.4s 3; }
  @keyframes nv-drop-in { 0%{opacity:0;transform:translateY(-40px)} 60%{transform:translateY(4px)} 100%{opacity:1;transform:translateY(0)} }
  .nv-drop-in { animation: nv-drop-in 0.5s ease-out both; }
  @keyframes nv-gold-glow { 0%,100%{box-shadow:0 0 10px rgba(255,215,0,0.2)} 50%{box-shadow:0 0 25px rgba(255,215,0,0.5)} }
  .nv-gold-glow { animation: nv-gold-glow 2s infinite; }
  @keyframes nv-flicker { 0%,95%,100%{opacity:1} 96%{opacity:0.97} 97%{opacity:1} 98%{opacity:0.96} }
  .nv-page { animation: nv-flicker 4s infinite; }
  .nv-reveal-btn { animation: nv-btn-pulse 2s infinite; }
  @keyframes nv-btn-pulse { 0%,100%{box-shadow:0 0 5px rgba(0,255,65,0.1)} 50%{box-shadow:0 0 15px rgba(0,255,65,0.3)} }
  @keyframes nv-count-flash { 0%{color:#fff;transform:scale(1.3)} 100%{color:inherit;transform:scale(1)} }
  .nv-count-flash { animation: nv-count-flash 0.3s ease-out; }
```

- [ ] **Step 2: Apply scan-in animation to reveal handler**

In `_hsReveal` function (~line 1203), after `el.style.display = '';`, add the animation class:

Change:
```javascript
if (el) { el.style.display = ''; el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
```
To:
```javascript
if (el) { el.style.display = ''; el.classList.add('nv-scan-in'); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
```

- [ ] **Step 3: Apply soaked shake + splash to discovery cards in VP**

In the hunt discovery VP rendering (~line 1030), add shake class and splash overlay to SOAKED cards. Find the discovery card building code and add to the SOAKED outcome:

After the `<div style="margin-top:6px;text-align:right">` line with SOAKED tag, add a splash div:
```html
<div style="position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(circle,rgba(56,189,248,0.3),transparent 70%);border-radius:6px;pointer-events:none;animation:nv-splash 0.8s forwards"></div>
```

And add `class="nv-soaked-shake"` to the outer card div and `style="position:relative;overflow:hidden"`.

- [ ] **Step 4: Apply beat slide-in to chase beats**

In the VP chase beat rendering (both hunt discovery and showdown), add staggered animation. For each beat `<div>`, add:
```
style="animation:${b.win ? 'nv-beat-in' : 'nv-beat-jitter'} 0.3s ease-out ${i * 0.15}s both"
```
where `i` is the beat index.

- [ ] **Step 5: Apply found-pulse to FOUND badges**

Find all `<span class="nv-status nv-found">FOUND</span>` in the VP and add `nv-found-pulse` class:
```html
<span class="nv-status nv-found nv-found-pulse">FOUND</span>
```

- [ ] **Step 6: Apply drop-in + gold glow to Last Operative Standing card**

In the last-standing VP card (~line 1140), add `nv-drop-in` to the outer card div and `nv-gold-glow` to the portrait wrapper.

- [ ] **Step 7: Commit**

```bash
git add js/chal/hide-and-be-sneaky.js
git commit -m "feat(hide-seek-overdrive): CSS animations — scan-in, soaked splash, chase beats, gold glow"
```

---

### Task 2: Chris Quips Pool + Simulation Integration

**Files:**
- Modify: `js/chal/hide-and-be-sneaky.js` (constants section ~line 82, simulation ~line 150)

Add the `CHRIS_QUIPS` constant pool and wire quip selection into the simulation so quips are stored deterministically on `ep.hideAndBeSneaky.chrisQuips`.

- [ ] **Step 1: Add CHRIS_QUIPS constant**

After `CHASE_BEATS` (line 90), add:

```javascript
// ── CHRIS McLEAN COMMENTARY ──
const CHRIS_QUIPS = {
  roundEarly: [
    `"This is almost too easy." — Chris McLean`,
    `"Chef's barely trying and they're already panicking." — Chris McLean`,
    `"Ten bucks says someone sneezes in the first five minutes." — Chris McLean`,
    `"I love this part. The false sense of security." — Chris McLean`,
    `"Places, everyone! Chef is LOCKED and LOADED." — Chris McLean`,
  ],
  roundMid: [
    `"Now we're getting somewhere!" — Chris McLean`,
    `"The herd is thinning, folks." — Chris McLean`,
    `"Chef's getting warmer..." — Chris McLean`,
    `"I can practically taste the drama." — Chris McLean`,
    `"This is better than cable." — Chris McLean`,
  ],
  roundLate: [
    `"Down to the final few..." — Chris McLean`,
    `"Chef can smell the fear." — Chris McLean`,
    `"Who's gonna crack next?" — Chris McLean`,
    `"This is what I live for." — Chris McLean`,
    `"The suspense is KILLING me. Well, not me. Them." — Chris McLean`,
  ],
  catchEmbarrassing: [
    `"That was just sad." — Chris McLean`,
    `"Did they even TRY to hide?" — Chris McLean`,
    `"I've seen better hiding from a toddler." — Chris McLean`,
    `"That's going in the highlight reel." — Chris McLean`,
  ],
  catchClose: [
    `"Ooh, SO close!" — Chris McLean`,
    `"Almost had it! Almost." — Chris McLean`,
    `"Inches away from freedom. Inches." — Chris McLean`,
    `"That's gotta sting." — Chris McLean`,
  ],
  catchNormal: [
    `"Another one bites the dust." — Chris McLean`,
    `"And just like that — soaked." — Chris McLean`,
    `"Better luck never." — Chris McLean`,
    `"Don't feel bad. Actually, do. It's funnier." — Chris McLean`,
  ],
  escapeSuccess: [
    `"NO WAY!" — Chris McLean`,
    `"Chef is NOT gonna be happy about that one." — Chris McLean`,
    `"Did that just happen?!" — Chris McLean`,
    `"HOME BASE! Unbelievable!" — Chris McLean`,
  ],
  betrayal: [
    `"And THAT'S why you don't trust anyone on this island." — Chris McLean`,
    `"Cold. Ice cold." — Chris McLean`,
    `"I knew they had it in them." — Chris McLean`,
    `"Ooh, the betrayal! Chef, are you getting this?" — Chris McLean`,
  ],
  loyal: [
    `"How noble. How boring." — Chris McLean`,
    `"Loyalty doesn't win you immunity, people." — Chris McLean`,
    `"Respect... I guess." — Chris McLean`,
  ],
  showdown: [
    `"Time to run." — Chris McLean`,
    `"Last ones standing — but not for long." — Chris McLean`,
    `"This is the final hunt." — Chris McLean`,
    `"Smoke 'em out, Chef!" — Chris McLean`,
  ],
  lastStanding: [
    `"Well played. Chef searched EVERYWHERE." — Chris McLean`,
    `"I'm actually impressed. Don't tell anyone I said that." — Chris McLean`,
    `"The last operative standing. Immunity is yours." — Chris McLean`,
  ],
  chefFrustration: [
    `Chef kicked a trash can in frustration.`,
    `Chef muttered something unprintable under his breath.`,
    `Chef punched a tree. The tree won.`,
    `"THEY CAN'T HAVE JUST DISAPPEARED!" — Chef Hatchet`,
    `Chef angrily pumped his water gun, scanning every shadow.`,
  ],
  chefTaunt: [
    `"There you are." — Chef Hatchet`,
    `"Did you REALLY think that would work?" — Chef Hatchet`,
    `"Too easy." — Chef Hatchet`,
    `"I can hear you breathing." — Chef Hatchet`,
    `"You call that hiding? My GRANDMOTHER hides better." — Chef Hatchet`,
    `"End of the line." — Chef Hatchet`,
  ],
  stalkerCaught: [
    `"Wait — were they following Chef THIS WHOLE TIME?!" — Chris McLean`,
    `"That is either the bravest or dumbest strategy I've ever seen." — Chris McLean`,
  ],
  stalkerSurvived: [
    `"They literally followed Chef around and he NEVER noticed?! Legendary." — Chris McLean`,
    `"Izzy would be proud." — Chris McLean`,
  ],
};
```

- [ ] **Step 2: Wire quip selection into simulation**

In `simulateHideAndBeSneaky`, after the `badges` declaration (~line 240), add:
```javascript
  const chrisQuips = {}; // { stepKey: quipText }
```

Then at each relevant point in the simulation, assign quips:

**Round headers** — inside the hunt round loop, after `roundData` creation:
```javascript
    const quipPool = r <= totalRounds * 0.33 ? CHRIS_QUIPS.roundEarly : r <= totalRounds * 0.66 ? CHRIS_QUIPS.roundMid : CHRIS_QUIPS.roundLate;
    chrisQuips[`round-${r}`] = quipPool[Math.floor(Math.random() * quipPool.length)];
```

**Discovery** — after each caught/escaped resolution, inside the `caughtThisRound` loop:
```javascript
      if (didEscape) {
        chrisQuips[`catch-${target}-${r}`] = CHRIS_QUIPS.escapeSuccess[Math.floor(Math.random() * CHRIS_QUIPS.escapeSuccess.length)];
      } else {
        const pool = badges[target] === 'hideSeekFlush' ? CHRIS_QUIPS.catchEmbarrassing :
                     escBeats.some(b => b.win) ? CHRIS_QUIPS.catchClose : CHRIS_QUIPS.catchNormal;
        chrisQuips[`catch-${target}-${r}`] = pool[Math.floor(Math.random() * pool.length)];
        chrisQuips[`chef-taunt-${target}`] = CHRIS_QUIPS.chefTaunt[Math.floor(Math.random() * CHRIS_QUIPS.chefTaunt.length)];
      }
```

**No-catch rounds** — after the detection block, if no one was caught this round:
```javascript
    if (!caughtThisRound.length) {
      chrisQuips[`frustration-${r}`] = CHRIS_QUIPS.chefFrustration[Math.floor(Math.random() * CHRIS_QUIPS.chefFrustration.length)];
    }
```

**Betrayals** — in Phase 3, for each betrayal:
```javascript
      chrisQuips[`betrayal-${name}`] = CHRIS_QUIPS.betrayal[Math.floor(Math.random() * CHRIS_QUIPS.betrayal.length)];
```

**Loyals** — after the loyals loop:
```javascript
  if (loyals.length) chrisQuips['loyal'] = CHRIS_QUIPS.loyal[Math.floor(Math.random() * CHRIS_QUIPS.loyal.length)];
```

**Showdown** — at Phase 5 start:
```javascript
    chrisQuips['showdown'] = CHRIS_QUIPS.showdown[Math.floor(Math.random() * CHRIS_QUIPS.showdown.length)];
```

**Last standing** — when 1 hider auto-wins:
```javascript
    chrisQuips['lastStanding'] = CHRIS_QUIPS.lastStanding[Math.floor(Math.random() * CHRIS_QUIPS.lastStanding.length)];
```

Store in results:
```javascript
  ep.hideAndBeSneaky = { ..., chrisQuips, ... };
```

- [ ] **Step 3: Commit**

```bash
git add js/chal/hide-and-be-sneaky.js
git commit -m "feat(hide-seek-overdrive): Chris quips pool + simulation integration"
```

---

### Task 3: Chris Quips VP Rendering

**Files:**
- Modify: `js/chal/hide-and-be-sneaky.js` (VP section ~line 937+)

Render stored quips in the VP at the appropriate locations.

- [ ] **Step 1: Create quip render helper**

After the `NV_STYLES` constant, add a helper:
```javascript
function _chrisQuip(quips, key) {
  const q = quips?.[key];
  if (!q) return '';
  return `<div style="font-size:11px;color:#8b949e;font-style:italic;margin-bottom:6px;padding-left:4px">${q}</div>`;
}
```

- [ ] **Step 2: Add quips to round headers**

In the hunt round header step building, prepend the quip:
```javascript
    steps.push({ type: 'hunt-header', html: `${_chrisQuip(hs.chrisQuips, 'round-' + round.num)}<div class="nv-sector">SCANNING SECTOR ${round.num} ...` });
```

- [ ] **Step 3: Add Chef taunt + Chris quip to discovery cards**

In the discovery card building, prepend the Chef taunt before the card and Chris quip after:
```javascript
      const chefTaunt = _chrisQuip(hs.chrisQuips, 'chef-taunt-' + f.name);
      const catchQuip = _chrisQuip(hs.chrisQuips, 'catch-' + f.name + '-' + round.num);
      // Prepend chefTaunt before card, append catchQuip after
```

- [ ] **Step 4: Add frustration beat for no-catch rounds**

After the events and before checking for found players, if no discovery this round, add a Chef frustration step:
```javascript
    if (!allCaughtThisRound.length) {
      const frustration = _chrisQuip(hs.chrisQuips, 'frustration-' + round.num);
      if (frustration) steps.push({ type: 'hunt-frustration', html: `<div class="nv-card" style="border-color:rgba(255,100,50,0.1)">${frustration}</div>` });
    }
```

- [ ] **Step 5: Add quips to betrayal, loyalty, showdown, last-standing sections**

Prepend quips to each section header using the stored keys.

- [ ] **Step 6: Commit**

```bash
git add js/chal/hide-and-be-sneaky.js
git commit -m "feat(hide-seek-overdrive): Chris quips VP rendering"
```

---

### Task 4: Stalker Strategy Overdrive

**Files:**
- Modify: `js/chal/hide-and-be-sneaky.js` (constants, simulation, VP)

Expand the stalker strategy from a single check to a multi-beat arc with per-round beats, suspicion meter, and unique VP styling.

- [ ] **Step 1: Add stalker beat pool**

After `CHRIS_QUIPS`, add:
```javascript
const STALKER_BEATS = [
  { id:'close-call',   text: (p, pr, win) => win ? `Chef turned suddenly — ${p} froze mid-step, inches away. Chef shrugged and kept walking.` : `Chef turned and squinted. ${p} pressed flat against a tree, but Chef's eyes lingered too long...` },
  { id:'mimicry',      text: (p, pr, win) => win ? `${p} matched Chef's footsteps perfectly — left, right, left, right. A shadow within a shadow.` : `${p} tried to match Chef's pace but stumbled. Chef paused... then kept moving.` },
  { id:'near-blown',   text: (p, pr, win) => win ? `Chef sniffed the air. "${pr.Sub} could SWEAR someone was behind ${pr.obj}." ${p} held ${pr.posAdj} breath.` : `Chef sniffed the air and slowly turned. ${p}'s heart pounded — ${pr.sub} barely ducked behind a bush in time.` },
  { id:'aggressive',   text: (p, pr, win) => win ? `${p} got cocky, following barely two steps behind Chef. The thrill was addictive.` : `${p} got too close. Chef's ear twitched. ${pr.Sub} had to dive behind a rock.` },
  { id:'intel',        text: (p, pr, win) => win ? `${p} overheard Chef mumble ${pr.posAdj} next search location. Valuable intel.` : `${p} leaned in to hear Chef's plan — and a twig snapped under ${pr.posAdj} foot.` },
  { id:'shadow',       text: (p, pr, win) => win ? `${p} slipped into Chef's literal shadow, moving in perfect sync. Inches away from the hunter.` : `${p} tried to walk in Chef's shadow but ${pr.posAdj} own shadow gave ${pr.obj} away on the wall.` },
];
```

- [ ] **Step 2: Expand stalker simulation logic**

In the Phase 1 stalker assignment block (~line 165), after the stalker check, initialize the arc:
```javascript
      // Initialize stalker arc
      const stalkerArc = { player: name, beats: [], suspicion: 0, outcome: null };
```

Move the stalkerArc into function scope (declare `let stalkerArc = null;` before the player loop, assign when stalker is chosen).

In Phase 2, at the START of each round loop (before events), if stalkerArc is active and stalker is still hidden:
```javascript
    if (stalkerArc && hidden.includes(stalkerArc.player)) {
      const sp = pStats(stalkerArc.player);
      const stalkerCheck = sp.boldness * 0.4 + sp.intuition * 0.3 + sp.physical * 0.3 + (Math.random() * 2 - 1);
      const beat = STALKER_BEATS[Math.floor(Math.random() * STALKER_BEATS.length)];
      const pass = stalkerCheck >= 5.5;
      const pr = pronouns(stalkerArc.player);
      stalkerArc.beats.push({
        round: r, id: beat.id, text: beat.text(stalkerArc.player, pr, pass), pass,
      });
      if (pass) {
        hidingQuality[stalkerArc.player] += 0.5;
        if (beat.id === 'intel') hidingQuality[stalkerArc.player] += 0.5; // extra for intel
      } else {
        hidingQuality[stalkerArc.player] -= 0.5;
        stalkerArc.suspicion++;
      }
      // Suspicion 3 = caught
      if (stalkerArc.suspicion >= 3) {
        stalkerArc.outcome = 'caught';
        const escScore = calcEscapeScore(stalkerArc.player);
        const didEscape = escScore > 7; // high threshold for stalker escape
        if (didEscape) {
          escaped.push({ name: stalkerArc.player, round: r });
          badges[stalkerArc.player] = 'hideSeekStalker';
          popDelta(stalkerArc.player, 2);
          stalkerArc.outcome = 'escaped';
          chrisQuips['stalker'] = CHRIS_QUIPS.stalkerCaught[Math.floor(Math.random() * CHRIS_QUIPS.stalkerCaught.length)];
        } else {
          caught.push({ name: stalkerArc.player, round: r, method: 'stalker-caught', escapeAttempted: true });
          chrisQuips['stalker'] = CHRIS_QUIPS.stalkerCaught[Math.floor(Math.random() * CHRIS_QUIPS.stalkerCaught.length)];
        }
        hidden = hidden.filter(h => h !== stalkerArc.player);
      }
    }
```

If stalker survives all rounds, set `stalkerArc.outcome = 'survived'` and add Chris quip from `stalkerSurvived`.

In Phase 5 showdown, give stalker a +3 chase score bonus and popularity +2.

Store `stalkerArc` in `ep.hideAndBeSneaky.stalkerArc`.

- [ ] **Step 3: Add stalker VP cards**

In the VP, after each round header step, if `stalkerArc` has a beat for this round, add a dedicated stalker step:
```javascript
    const stalkerBeat = hs.stalkerArc?.beats?.find(b => b.round === round.num);
    if (stalkerBeat) {
      steps.push({ type: 'stalker-beat', html: `
        <div class="nv-card" style="border-color:rgba(139,92,246,0.3);background:rgba(139,92,246,0.05)">
          <div style="font-size:9px;color:#8b5cf6;letter-spacing:2px;font-weight:700;margin-bottom:4px">STALKER FEED</div>
          <div style="display:flex;align-items:center;gap:10px">
            ${rpPortrait(hs.stalkerArc.player, 'sm')}
            <div style="flex:1;font-size:12px;color:#cdd9e5">${stalkerBeat.text}</div>
            <span class="nv-status" style="background:rgba(139,92,246,0.15);color:${stalkerBeat.pass ? '#8b5cf6' : '#f85149'}">${stalkerBeat.pass ? 'UNDETECTED' : 'SUSPICION +1'}</span>
          </div>
          ${stalkerArc.suspicion > 0 ? `<div style="margin-top:4px;font-size:10px;color:#8b5cf6">Suspicion: ${'🔴'.repeat(Math.min(3, hs.stalkerArc.beats.filter(b => !b.pass && b.round <= round.num).length))}${'⚫'.repeat(3 - Math.min(3, hs.stalkerArc.beats.filter(b => !b.pass && b.round <= round.num).length))}</div>` : ''}
        </div>` });
    }
```

- [ ] **Step 4: Commit**

```bash
git add js/chal/hide-and-be-sneaky.js
git commit -m "feat(hide-seek-overdrive): stalker arc with per-round beats, suspicion meter, VP cards"
```

---

### Task 5: Showmance & Romance Integration

**Files:**
- Modify: `js/chal/hide-and-be-sneaky.js` (simulation, VP)

- [ ] **Step 1: Add showmance moment in Phase 1**

After spot assignment loop but before Phase 2, check for showmance pairs:
```javascript
  // Showmance challenge moment — partners hiding nearby
  const showmanceMoments = [];
  if (seasonConfig.romance) {
    (gs.showmances || []).forEach(sh => {
      if (sh.phase === 'broken-up') return;
      const [a, b] = sh.players;
      if (!activePlayers.includes(a) || !activePlayers.includes(b)) return;
      const aPr = pronouns(a), bPr = pronouns(b);
      hidingQuality[a] -= 0.5;
      hidingQuality[b] -= 0.5;
      addBond(a, b, 1);
      showmanceMoments.push({
        type: 'nearby', players: [a, b],
        text: `${a} and ${b} found hiding spots close to each other. ${aPr.Sub} whispered reassurance to ${b} in the dark — risky, but comforting.`,
      });
    });
  }
```

- [ ] **Step 2: Add romance spark in Phase 2 social events**

In the solidarity/buddy-system event handling, after addBond, check for romance spark:
```javascript
          // Romance spark from shared hiding tension
          if (seasonConfig.romance && typeof romanticCompat === 'function' && romanticCompat(a, b)) {
            if (!(gs.romanticSparks || []).some(s => s.players.includes(a) && s.players.includes(b)) &&
                !(gs.showmances || []).some(s => s.players.includes(a) && s.players.includes(b))) {
              if (!gs.romanticSparks) gs.romanticSparks = [];
              gs.romanticSparks.push({ players: [a, b], intensity: 1, origin: 'hide-seek' });
              showmanceMoments.push({
                type: 'spark', players: [a, b],
                text: `The tension of hiding together sparked something between ${a} and ${b}...`,
              });
            }
          }
```

(Import `romanticCompat` — it's already available from `../players.js` import at top of file.)

- [ ] **Step 3: Add showmance discovery reaction**

In the Phase 2 catch resolution, after a player is caught, check if their showmance partner is still hidden:
```javascript
      // Showmance discovery reaction
      const shPartner = (gs.showmances || []).find(sh =>
        sh.phase !== 'broken-up' && sh.players.includes(target) && sh.players.some(p => p !== target && hidden.includes(p))
      );
      if (shPartner) {
        const partner = shPartner.players.find(p => p !== target);
        hidingQuality[partner] -= 1.0;
        addBond(partner, target, 1);
        const pPr = pronouns(partner);
        showmanceMoments.push({
          type: 'reaction', players: [partner, target],
          text: `${partner} watched helplessly as ${target} got soaked — ${pPr.sub} almost blew ${pPr.posAdj} own cover!`,
        });
      }
```

- [ ] **Step 4: Store showmanceMoments and render in VP**

Add `showmanceMoments` to `ep.hideAndBeSneaky`. In VP, after deployment steps, add showmance moments as steps with heart styling:
```javascript
  if (hs.showmanceMoments?.length) {
    hs.showmanceMoments.filter(m => m.type === 'nearby').forEach(m => {
      steps.push({ type: 'showmance', html: `
        <div class="nv-card" style="border-color:rgba(248,113,113,0.3);background:rgba(248,113,113,0.04)">
          <div style="display:flex;align-items:center;gap:10px">
            ${m.players.map(p => rpPortrait(p, 'sm')).join('')}
            <div style="flex:1;font-size:12px;color:#cdd9e5">${m.text}</div>
          </div>
        </div>` });
    });
  }
```

Reaction and spark moments render inline with their respective round events.

- [ ] **Step 5: Add romanticCompat to imports**

Check the import line at top. `romanticCompat` should already be importable from `../players.js`. If not in the current import, add it:
```javascript
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
```

- [ ] **Step 6: Commit**

```bash
git add js/chal/hide-and-be-sneaky.js
git commit -m "feat(hide-seek-overdrive): showmance moments, romance sparks, discovery reactions"
```

---

### Task 6: Cold Open Hook

**Files:**
- Modify: `js/chal/hide-and-be-sneaky.js` (simulation results, text backlog, VP)

- [ ] **Step 1: Generate cold open at end of simulation**

Before the `ep.hideAndBeSneaky = {` line, add cold open selection:
```javascript
  // Cold open hook — pick the most dramatic moment
  let coldOpen = null;
  const escapeWinner = escaped.find(e => typeof e.round === 'number');
  if (escapeWinner) {
    coldOpen = { type: 'escape', text: `One player makes a desperate dash for home base — will they make it?`, player: escapeWinner.name };
  } else if (phase5?.winner) {
    const flashBeat = (phase5.beats[phase5.winner] || []).find(b => b.win && ['combat', 'window', 'last-stand'].includes(b.id));
    if (flashBeat) coldOpen = { type: 'showdown', text: `In a moment no one saw coming...`, player: phase5.winner };
  }
  if (!coldOpen && betrayals.some(b => b.targetFound)) {
    const b = betrayals.find(b => b.targetFound);
    coldOpen = { type: 'betrayal', text: `Trust is about to be shattered on Wawanakwa Island...`, player: b.betrayer };
  }
  if (!coldOpen && Object.values(badges).includes('hideSeekFlush')) {
    const p = Object.entries(badges).find(([,v]) => v === 'hideSeekFlush')?.[0];
    if (p) coldOpen = { type: 'embarrassing', text: `Things are about to get ugly for one camper...`, player: p };
  }
  if (!coldOpen && immunityWinners.length === 1 && !phase5) {
    coldOpen = { type: 'lastStanding', text: `While everyone else falls, one player refuses to be found...`, player: immunityWinners[0] };
  }
  if (!coldOpen && stalkerArc) {
    coldOpen = { type: 'stalker', text: `One player has a plan so crazy it just might work...`, player: stalkerArc.player };
  }
```

Add `coldOpen` to `ep.hideAndBeSneaky`.

- [ ] **Step 2: Add cold open to text backlog**

In `_textHideAndBeSneaky`, before `sec('HIDE AND BE SNEAKY')`, add:
```javascript
  if (hs.coldOpen) {
    sec('COLD OPEN');
    ln(hs.coldOpen.text);
  }
```

- [ ] **Step 3: Add cold open as first VP step**

In `rpBuildHideAndBeSneaky`, before the briefing step, if coldOpen exists:
```javascript
  if (hs.coldOpen) {
    steps.push({ type: 'cold-open', html: `
      <div class="nv-card" style="text-align:center;border-color:rgba(255,215,0,0.2);background:rgba(0,0,0,0.5);padding:20px">
        <div style="font-size:10px;color:#8b949e;letter-spacing:3px;margin-bottom:8px">PREVIOUSLY ON TOTAL DRAMA...</div>
        ${rpPortrait(hs.coldOpen.player, 'sm')}
        <div style="font-size:14px;color:#ffd700;font-style:italic;margin-top:8px">${hs.coldOpen.text}</div>
      </div>` });
  }
```

- [ ] **Step 4: Commit**

```bash
git add js/chal/hide-and-be-sneaky.js
git commit -m "feat(hide-seek-overdrive): cold open hook — previews most dramatic moment"
```

---

### Task 7: Relocation Story + Multi-Beat Events

**Files:**
- Modify: `js/chal/hide-and-be-sneaky.js` (simulation events, VP)

- [ ] **Step 1: Implement relocation spot change**

In the Phase 2 reposition event handling (detection/evasion single-target block, `template.id === 'reposition'`), instead of just adding a delta, actually swap spots:

```javascript
            if (template.id === 'reposition') {
              if (pStats(target).intuition >= 5) {
                const oldSpot = spotAssignments[target];
                const newSpots = HIDING_SPOTS.filter(sp => sp.id !== oldSpot.id && sp.id !== 'stalker' && !Object.values(spotAssignments).some(s => s.id === sp.id));
                if (newSpots.length) {
                  const newSpot = newSpots[Math.floor(Math.random() * newSpots.length)];
                  spotAssignments[target] = newSpot;
                  const oldQ = hidingQuality[target];
                  hidingQuality[target] = calcHidingQuality(target, newSpot) + 1.0;
                  delta = hidingQuality[target] - oldQ;
                  evt.text = `${target} sensed Chef approaching ${oldSpot.name}. Silently crept to ${newSpot.name}.`;
                  evt.relocation = { from: oldSpot.name, to: newSpot.name };
                } else {
                  delta = 0.5;
                }
              } else {
                delta = 0.5;
              }
```

- [ ] **Step 2: Render relocation in VP with crossed-out old spot**

In the event VP rendering, check for `evt.relocation` and add styled card:
```javascript
      const relocHtml = evt.relocation ? `
        <div style="font-size:10px;margin-top:4px">
          <span style="text-decoration:line-through;color:#666">Was: ${evt.relocation.from}</span>
          <span style="color:#00ff41;margin-left:8px">Now: ${evt.relocation.to}</span>
        </div>` : '';
```
Append `relocHtml` inside the event card after the text div.

- [ ] **Step 3: Add multi-beat setpiece events**

Add a `MULTIBEAT_EVENTS` constant after `CHRIS_QUIPS`:
```javascript
const MULTIBEAT_EVENTS = {
  'animal-skunk': [
    (p, pr) => `A family of skunks waddled toward ${p}'s hiding spot...`,
    (p, pr) => `${p} held perfectly still, not daring to breathe...`,
    (p, pr) => `The skunks sprayed. ${p} screamed. Chef heard everything.`,
  ],
  'shared-spot': [
    (a, aPr, b) => `${a} crawled into position and came face-to-face with ${b}.`,
    (a, aPr, b) => `They locked eyes. ${a} mouthed "MOVE." ${b} mouthed "YOU move."`,
    (a, aPr, b) => `Their whispered argument got louder... and louder... Chef redirected.`,
  ],
  'bug-swarm': [
    (p, pr) => `A cloud of gnats descended on ${p}'s position.`,
    (p, pr) => `${pr.Sub} tried to stay still, but they were EVERYWHERE.`,
    (p, pr) => `One landed in ${pr.posAdj} eye — ${pr.sub} swatted wildly, giving away the spot.`,
  ],
  'animal-squirrel': [
    (p, pr) => `A squirrel landed on ${p}'s head.`,
    (p, pr) => `${pr.Sub} tried to gently shoo it away... but it bit ${pr.posAdj} finger.`,
    (p, pr) => `${p} yelped. Chef snapped to attention.`,
  ],
  'trip-wire': [
    (p, pr) => `${p} shifted position and felt something catch ${pr.posAdj} ankle.`,
    (p, pr) => `A wire. Connected to cans. Time slowed down.`,
    (p, pr) => `CLANG CLANG CLANG. Every hider on the island held their breath.`,
  ],
};
```

In the simulation, when generating events, 30% chance to expand if the event ID has a multibeat entry:
```javascript
          if (MULTIBEAT_EVENTS[template.id] && Math.random() < 0.3) {
            const mbArgs = (template.id === 'shared-spot') ? [a, pronouns(a), b] : [target, tPr];
            evt.multibeat = MULTIBEAT_EVENTS[template.id].map(fn => fn(...mbArgs));
          }
```

- [ ] **Step 4: Render multibeat events in VP**

In the event card rendering, if `evt.multibeat` exists, render stacked lines instead of single text:
```javascript
      const eventContent = evt.multibeat
        ? evt.multibeat.map((line, li) => `<div style="font-size:12px;color:#cdd9e5;${li > 0 ? 'margin-top:4px;padding-left:8px;border-left:2px solid rgba(0,255,65,0.1)' : ''}">${line}</div>`).join('')
        : `<div style="flex:1;font-size:12px;color:#cdd9e5">${evt.text}</div>`;
```

- [ ] **Step 5: Commit**

```bash
git add js/chal/hide-and-be-sneaky.js
git commit -m "feat(hide-seek-overdrive): relocation story with spot swap, multi-beat setpiece events"
```

---

### Task 8: Status Tracker Sidebar

**Files:**
- Modify: `js/chal/hide-and-be-sneaky.js` (VP build + reveal handler)

- [ ] **Step 1: Add count deltas to each step during rpBuild**

Each step object gets `hiddenDelta`, `caughtDelta`, `immuneDelta` fields. Initialize based on step type:
- `deployment` steps: no delta
- `hunt-discovery` with SOAKED: hiddenDelta -1, caughtDelta +1
- `hunt-discovery` with ESCAPED: hiddenDelta -1, immuneDelta +1
- `last-standing`: hiddenDelta -1, immuneDelta +1
- `pursuit-chase` with OPERATIVE EXTRACTED: immuneDelta +1
- All others: 0

- [ ] **Step 2: Add persistent sidebar HTML**

In the VP HTML build, after the header div but before the steps, add:
```javascript
  html += `<div class="nv-sidebar" style="display:flex;gap:16px;justify-content:center;font-size:12px;font-weight:700;letter-spacing:1px">
    <span>HIDDEN: <span id="hs-hidden-${stateKey}" style="color:#00ff41">${hs.activePlayers.length}</span></span>
    <span>CAUGHT: <span id="hs-caught-${stateKey}" style="color:#ff6432">0</span></span>
    <span>IMMUNE: <span id="hs-immune-${stateKey}" style="color:#ffd700">0</span></span>
  </div>`;
```

- [ ] **Step 3: Update counts in reveal handler**

In `_hsReveal`, after showing the element, update the sidebar counts. Store cumulative counts on `_tvState`:
```javascript
  if (!state.counts) state.counts = { hidden: totalHidden, caught: 0, immune: 0 };
  // Read delta from the step's data attributes
  const hd = parseInt(el.dataset.hiddenDelta || '0');
  const cd = parseInt(el.dataset.caughtDelta || '0');
  const id = parseInt(el.dataset.immuneDelta || '0');
  if (hd || cd || id) {
    state.counts.hidden += hd;
    state.counts.caught += cd;
    state.counts.immune += id;
    const hEl = document.getElementById(`hs-hidden-${stateKey}`);
    const cEl = document.getElementById(`hs-caught-${stateKey}`);
    const iEl = document.getElementById(`hs-immune-${stateKey}`);
    if (hEl) { hEl.textContent = state.counts.hidden; hEl.classList.remove('nv-count-flash'); void hEl.offsetWidth; hEl.classList.add('nv-count-flash'); }
    if (cEl) { cEl.textContent = state.counts.caught; if (cd) { cEl.classList.remove('nv-count-flash'); void cEl.offsetWidth; cEl.classList.add('nv-count-flash'); } }
    if (iEl) { iEl.textContent = state.counts.immune; if (id) { iEl.classList.remove('nv-count-flash'); void iEl.offsetWidth; iEl.classList.add('nv-count-flash'); } }
  }
```

To pass deltas, add `data-*` attributes to each step div during rpBuild:
```javascript
    html += `<div id="hs-step-${stateKey}-${i}" data-hidden-delta="${step.hiddenDelta||0}" data-caught-delta="${step.caughtDelta||0}" data-immune-delta="${step.immuneDelta||0}" style="${visible ? '' : 'display:none'}">${step.html}</div>`;
```

- [ ] **Step 4: Handle revealAll — set final counts**

In `_hsRevealAll`, after revealing all elements, set final counts:
```javascript
  const hEl = document.getElementById(`hs-hidden-${stateKey}`);
  const cEl = document.getElementById(`hs-caught-${stateKey}`);
  const iEl = document.getElementById(`hs-immune-${stateKey}`);
  // Final counts = walk all steps
  let h = parseInt(hEl?.dataset.initial || '0'), c = 0, im = 0;
  for (let i = 0; i < totalSteps; i++) {
    const el = document.getElementById(`hs-step-${stateKey}-${i}`);
    if (el) { h += parseInt(el.dataset.hiddenDelta || '0'); c += parseInt(el.dataset.caughtDelta || '0'); im += parseInt(el.dataset.immuneDelta || '0'); }
  }
  if (hEl) hEl.textContent = Math.max(0, h);
  if (cEl) cEl.textContent = c;
  if (iEl) iEl.textContent = im;
```

- [ ] **Step 5: Commit**

```bash
git add js/chal/hide-and-be-sneaky.js
git commit -m "feat(hide-seek-overdrive): live status tracker sidebar with count flash animations"
```

---

### Task 9: Badge Registration + Timeline Tag

**Files:**
- Modify: `js/chal/hide-and-be-sneaky.js` (simulation)
- Modify: `js/vp-screens.js` (badge rendering lookup)
- Modify: `js/camp-events.js` or wherever badge labels are defined

- [ ] **Step 1: Inject challenge badges as camp events**

At the end of `simulateHideAndBeSneaky`, after setting `ep.hideAndBeSneaky`, inject badges into camp events so they render in other VP screens:

```javascript
  // Inject badge camp events for VP rendering in camp life / tribal
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  const badgeLabels = {
    hideSeekImmune: { text: 'Won Hide & Seek', cls: 'win' },
    hideSeekTracker: { text: 'Betrayed in Hide & Seek', cls: 'bad' },
    hideSeekLoyal: { text: 'Stayed Loyal', cls: 'green' },
    hideSeekStalker: { text: 'Stalked Chef', cls: 'gold' },
    hideSeekFlush: { text: 'Embarrassing Catch', cls: '' },
    hideSeekClutch: { text: 'Escaped to Home Base', cls: 'win' },
  };
  Object.entries(badges).forEach(([name, badge]) => {
    const label = badgeLabels[badge];
    if (label) {
      ep.campEvents[campKey].post.push({
        type: 'hide-seek-badge', text: `${name}: ${label.text}`,
        players: [name], badgeText: label.text, badgeClass: label.cls,
      });
    }
  });
```

- [ ] **Step 2: Add timeline tag**

In the simulation results, add:
```javascript
  ep.hideAndBeSneaky.timelineTag = 'Hide and Be Sneaky';
```

Check if the episode timeline rendering in `run-ui.js` or `vp-screens.js` reads this field. If not, it's already handled by the `isHideAndBeSneaky` flag + the episode history tag we added earlier.

- [ ] **Step 3: Commit**

```bash
git add js/chal/hide-and-be-sneaky.js
git commit -m "feat(hide-seek-overdrive): badge registration as camp events + timeline tag"
```

---

### Task 10: Smoke Test

**Files:** none (testing only)

- [ ] **Step 1: Open simulator at http://localhost:8092/simulator.html**
- [ ] **Step 2: Run a season with Hide and Be Sneaky twist enabled**
- [ ] **Step 3: Verify all overdrive features:**
  - [ ] CSS animations: scan-in wipe, soaked shake, chase beat slide-in, found pulse, gold glow
  - [ ] Chris quips appear at round headers, discoveries, betrayals, showdown
  - [ ] Chef taunts before chase beats on discovery
  - [ ] Chef frustration on no-catch rounds
  - [ ] Stalker arc (if triggered): purple STALKER FEED cards with suspicion meter
  - [ ] Showmance moments render with heart styling
  - [ ] Cold open appears as first VP step
  - [ ] Relocation shows old/new spot with crossed-out styling
  - [ ] Multi-beat events (skunk, shared spot) expand to 2-3 lines
  - [ ] Status tracker updates with each reveal, counts flash
  - [ ] Badges show in camp life / tribal VP screens
  - [ ] "Scan all" still works with new step types
  - [ ] No console errors
- [ ] **Step 4: Fix any issues found**
- [ ] **Step 5: Commit fixes**
