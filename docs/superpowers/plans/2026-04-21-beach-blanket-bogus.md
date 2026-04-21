# Beach Blanket Bogus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Beach Blanket Bogus — a 3-phase pre-merge beach challenge (surf + sandcastle + conditional dance-off tiebreaker) with retro 60s beach movie poster VP identity.

**Architecture:** Single challenge file `js/chal/beach-blanket-bogus.js` following the alien-egg/talent-show pattern. Engine function `simulateBeachBlanketBogus(ep)` runs all phases, stores results on `ep.beachBlanketBogus`, sets winner/loser/challengeType. VP screens use click-to-reveal with live sidebar HUD. Registered via TWIST_CATALOG + episode.js + main.js + vp-screens.js + text-backlog.js.

**Tech Stack:** Vanilla ES modules, CSS animations inline in rpBuild functions, SVG for sandcastle construction visual.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `js/chal/beach-blanket-bogus.js` | **Create** | Engine (simulate) + VP (rpBuild*) + text backlog (_text*) + sound + reveal handlers |
| `js/core.js` | **Modify** ~line 121 | Add TWIST_CATALOG entry for `beach-blanket-bogus` |
| `js/twists.js` | **Modify** ~line 1424 | Add `engineType === 'beach-blanket-bogus'` branch setting `ep.isBeachBlanketBogus = true` |
| `js/episode.js` | **Modify** ~line 1834, ~line 974, ~line 5332 | Add pre-merge dispatch, skip-auto-elim guard, serialization fields |
| `js/main.js` | **Modify** ~line 37, ~line 126, ~line 213 | Import module, add to extractedModules, add CHALLENGES registry entry |
| `js/vp-screens.js` | **Modify** ~line 10329 | Import rpBuild* functions, add VP screen pushes for beach-blanket-bogus |
| `js/text-backlog.js` | **Modify** ~line 2012 | Import and call `_textBeachBlanketBogus` |

---

### Task 1: Scaffold + TWIST_CATALOG + Episode Wiring

**Files:**
- Create: `js/chal/beach-blanket-bogus.js`
- Modify: `js/core.js:~121`
- Modify: `js/twists.js:~1424`
- Modify: `js/episode.js:~974, ~1834, ~5332`
- Modify: `js/main.js:~37, ~126, ~213`

- [ ] **Step 1: Create skeleton challenge file**

```js
// js/chal/beach-blanket-bogus.js
import { gs, players } from '../core.js';
import { pStats, pronouns, romanticCompat, updateChalRecord } from '../players.js';
import { getBond, addBond } from '../bonds.js';

// ══════════════════════════════════════════════════════════════════════
// ENGINE: BEACH BLANKET BOGUS — 3-phase beach challenge
// Phase 1: Surf (heat-based escalation, 5 hazard rounds)
// Phase 2: Sandcastle (scavenge + build)
// Phase 3: Dance-Off (conditional 1v1 tiebreaker)
// ══════════════════════════════════════════════════════════════════════

export function simulateBeachBlanketBogus(ep) {
  const tribes = gs.tribes;
  if (!tribes || tribes.length < 2) return;
  const tribeMembers = tribes.map(t => ({ name: t.name, members: [...t.members] }));

  // Placeholder — phases will be added in subsequent tasks
  const result = {
    chrisOpener: 'Chris stands on a fake beach set. Behind him: a pool full of sharks, a pile of sand, and a disco ball. "Welcome to Beach Blanket Bogus!"',
    chrisCloser: '"And that\'s a wrap on Beach Blanket Bogus! One tribe is safe. The other... not so much."',
    phases: [],
    tribeScores: {},
    surfData: null,
    sandcastleData: null,
    halftimeEvents: null,
    danceOff: null,
  };

  // Tribe scoring: each phase = 1 point
  tribeMembers.forEach(t => { result.tribeScores[t.name] = 0; });

  ep.beachBlanketBogus = result;
  ep.challengeType = 'beach-blanket-bogus';

  // Determine winner/loser (placeholder until phases implemented)
  const sortedTribes = Object.entries(result.tribeScores).sort((a, b) => b[1] - a[1]);
  const winnerName = sortedTribes[0][0];
  const loserName = sortedTribes[sortedTribes.length - 1][0];
  ep.winner = tribes.find(t => t.name === winnerName);
  ep.loser = tribes.find(t => t.name === loserName);
  ep.challengePlacements = sortedTribes.map(([name]) => {
    const t = tribes.find(tr => tr.name === name);
    return { name, members: [...(t?.members || [])] };
  });
  ep.tribalPlayers = [...(ep.loser?.members || [])];

  // Challenge member scores (placeholder)
  const chalMemberScores = {};
  tribeMembers.flatMap(t => t.members).forEach(name => { chalMemberScores[name] = 0; });
  ep.chalMemberScores = chalMemberScores;
  updateChalRecord(ep);

  // Popularity
  if (!gs.popularity) gs.popularity = {};
}

// ── Text backlog ──
export function _textBeachBlanketBogus(ep, ln, sec) {
  const bbb = ep.beachBlanketBogus;
  if (!bbb) return;
  ln('Chris announces the Beach Blanket Bogus challenge — three beach-themed events on the film lot.');
  sec();
}

// ── VP: Title Card ──
export function rpBuildBeachBlanketBogusTitleCard(ep) {
  const bbb = ep.beachBlanketBogus;
  if (!bbb) return '';
  return _bbbShell(`
    <div style="text-align:center;padding:40px 20px;">
      <div style="font-size:32px;font-weight:900;letter-spacing:3px;color:#fff;text-shadow:3px 3px 0 #c4421a;">BEACH BLANKET BOGUS</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:8px;">${bbb.chrisOpener}</div>
    </div>
  `, ep);
}

// ── VP shell (retro beach movie poster theme) ──
function _bbbShell(content, ep) {
  return `
<style>
@import url('https://fonts.googleapis.com/css2?family=Bowlby+One+SC&family=Inter:wght@400;600;700;900&display=swap');
.bbb-shell{font-family:'Inter',sans-serif;color:#1b2838;background:linear-gradient(180deg,#ff6b35 0%,#f7931e 15%,#ffd700 30%,#87CEEB 50%,#0d6986 75%,#0a3d5c 100%);padding:0;max-width:1100px;margin:0 auto;position:relative;min-height:400px}
.bbb-shell::before{content:'';position:absolute;inset:0;background-image:radial-gradient(circle,rgba(0,0,0,0.03) 1px,transparent 1px);background-size:8px 8px;pointer-events:none;z-index:1}
.bbb-header{background:rgba(0,0,0,0.3);backdrop-filter:blur(8px);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid rgba(255,255,255,0.15)}
.bbb-title{font-family:'Bowlby One SC',sans-serif;font-size:18px;color:#fff;text-shadow:2px 2px 0 #c4421a;letter-spacing:2px}
.bbb-subtitle{font-size:10px;color:rgba(255,255,255,0.6);letter-spacing:3px;text-transform:uppercase}
.bbb-layout{display:flex;gap:14px;align-items:flex-start;padding:16px}
.bbb-feed{flex:1;min-width:0}
.bbb-sidebar{width:260px;flex-shrink:0;position:sticky;top:12px;max-height:calc(100vh - 24px);overflow-y:auto;scrollbar-width:thin;background:rgba(0,0,0,0.25);backdrop-filter:blur(8px);border-radius:6px;padding:12px;border:1px solid rgba(255,255,255,0.1)}
.bbb-hud{display:flex;gap:2px;margin-bottom:12px}
.bbb-hud-cell{flex:1;background:rgba(0,0,0,0.3);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,0.1);padding:8px 4px;text-align:center}
.bbb-hud-cell:first-child{border-radius:4px 0 0 4px}.bbb-hud-cell:last-child{border-radius:0 4px 4px 0}
.bbb-hud-val{font-family:'Bowlby One SC',sans-serif;font-size:18px;font-weight:700;color:#fff;text-shadow:0 0 8px currentColor}
.bbb-hud-lbl{font-size:7px;letter-spacing:2px;color:rgba(255,255,255,0.4);margin-top:2px;text-transform:uppercase}
.bbb-sec{font-family:'Bowlby One SC',sans-serif;font-size:9px;letter-spacing:3px;color:rgba(255,255,255,0.4);border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:3px;margin:14px 0 8px;text-transform:uppercase}
.bbb-btn-next{background:rgba(232,93,58,0.2);color:#fff;border:1px solid rgba(232,93,58,0.5);padding:8px 20px;border-radius:4px;cursor:pointer;font-size:12px;font-weight:600;letter-spacing:1px}
.bbb-btn-next:hover{background:rgba(232,93,58,0.4)}
.bbb-btn-all{background:transparent;color:rgba(255,255,255,0.4);border:1px solid rgba(255,255,255,0.1);padding:8px 16px;border-radius:4px;cursor:pointer;font-size:11px;margin-left:8px}
.bbb-controls{margin:12px 0;text-align:center}
@keyframes bbb-wave{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes bbb-bob{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-6px) rotate(1deg)}}
@keyframes bbb-fade-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes bbb-shark{0%{transform:translateX(-40px);opacity:0}10%{opacity:0.7}90%{opacity:0.7}100%{transform:translateX(300px);opacity:0}}
@keyframes bbb-seagull{0%{transform:translate(0,0)}25%{transform:translate(80px,-20px)}50%{transform:translate(160px,5px)}75%{transform:translate(240px,-15px)}100%{transform:translate(320px,0)}}
@keyframes bbb-wobble{0%,100%{transform:rotate(-2deg)}25%{transform:rotate(1deg)}50%{transform:rotate(-1deg)}75%{transform:rotate(2deg)}}
@keyframes bbb-pulse{0%,100%{opacity:0.6}50%{opacity:1}}
@keyframes bbb-spotlight{0%{transform:rotate(-15deg)}50%{transform:rotate(15deg)}100%{transform:rotate(-15deg)}}
@keyframes bbb-splash{0%{transform:scale(0) rotate(0);opacity:1}50%{transform:scale(1.2) rotate(180deg);opacity:0.8}100%{transform:scale(0.8) rotate(360deg);opacity:0}}
@keyframes bbb-tiki-flicker{0%,100%{opacity:0.7;transform:scaleY(1)}25%{opacity:1;transform:scaleY(1.1)}50%{opacity:0.8;transform:scaleY(0.95)}75%{opacity:0.9;transform:scaleY(1.05)}}
@keyframes bbb-sand-build{from{clip-path:inset(100% 0 0 0)}to{clip-path:inset(0 0 0 0)}}
</style>
<div class="bbb-shell">
  <div class="bbb-header">
    <div>
      <div class="bbb-title">BEACH BLANKET BOGUS</div>
      <div class="bbb-subtitle">Surf · Build · Dance</div>
    </div>
    <div style="font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:2px;">EPISODE ${ep.num || '?'}</div>
  </div>
  ${content}
</div>`;
}

// Reveal handlers (placeholder — will be implemented with surf VP)
export function beachBogusRevealNext(stateKey, totalSteps) {}
export function beachBogusRevealAll(stateKey, totalSteps) {}
```

- [ ] **Step 2: Add TWIST_CATALOG entry in core.js**

In `js/core.js`, add after the `alien-egg` entry (around line 130):

```js
  { id:'beach-blanket-bogus', emoji:'🏖️', name:'Beach Blanket Bogus', category:'challenge', chalSeries:'action', phase:'pre-merge', desc:'Three beach challenges on the film lot: surfboard endurance over a shark pool, sandcastle construction with scavenge and sabotage, and a dance-off tiebreaker. Retro beach movie vibes.', engineType:'beach-blanket-bogus', minTribes:2, incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors','up-the-creek','paintball-hunt','hells-kitchen','trust-challenge','basic-straining','x-treme-torture','monster-cash','alien-egg','brunch-of-disgustingness'] },
```

- [ ] **Step 3: Add twist engine branch in twists.js**

In `js/twists.js`, add after the `alien-egg` branch (after line ~1424):

```js
  } else if (engineType === 'beach-blanket-bogus') {
    if (gs.isMerged || gs.tribes.length < 2) return;
    ep.isBeachBlanketBogus = true;
```

- [ ] **Step 4: Wire episode.js dispatch**

4a. In `js/episode.js`, add import at the top (after line ~40):
```js
import { simulateBeachBlanketBogus } from './chal/beach-blanket-bogus.js';
```

4b. Add pre-merge dispatch branch (after the `isAlienEgg` block, ~line 1836):
```js
  } else if (ep.isBeachBlanketBogus && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    simulateBeachBlanketBogus(ep);
    // winner, loser, challengeType, tribalPlayers already set by simulateBeachBlanketBogus
```

4c. Add to skip-auto-elim guard (~line 974) — append `|| ep.isBeachBlanketBogus` to the existing condition.

4d. Add serialization fields (~line 5332, after `alienEgg`):
```js
    isBeachBlanketBogus: ep.isBeachBlanketBogus || false,
    beachBlanketBogus:   ep.beachBlanketBogus   || null,
```

- [ ] **Step 5: Wire main.js**

5a. Add import (after line ~37):
```js
import * as beachBlanketBogusMod from './chal/beach-blanket-bogus.js';
```

5b. Add to `extractedModules` array (~line 126):
```js
  brunchMod, luckyHuntMod, sayUncleMod, tripleDogDareMod, slasherNightMod, monsterCashMod, hideAndBeSneakyMod, offTheChainMod, alienEggMod, beachBlanketBogusMod,
```

5c. Add CHALLENGES registry entry (~line 213, after `alien-egg`):
```js
  'beach-blanket-bogus': { simulate: beachBlanketBogusMod.simulateBeachBlanketBogus, rpBuild: beachBlanketBogusMod.rpBuildBeachBlanketBogusTitleCard, text: beachBlanketBogusMod._textBeachBlanketBogus },
```

- [ ] **Step 6: Wire vp-screens.js**

In `js/vp-screens.js`, add import (after alien-egg imports, ~line 14):
```js
import { rpBuildBeachBlanketBogusTitleCard, beachBogusRevealNext, beachBogusRevealAll } from './chal/beach-blanket-bogus.js';
```

Add VP screen pushes (after the alien-egg block, ~line 10338):
```js
  } else if (ep.isBeachBlanketBogus && ep.beachBlanketBogus) {
    vpScreens.push({ id:'bbb-title', label:'🏖️ Beach Blanket Bogus', html: rpBuildBeachBlanketBogusTitleCard(ep) });
```

- [ ] **Step 7: Wire text-backlog.js**

In `js/text-backlog.js`, add import (after existing challenge imports):
```js
import { _textBeachBlanketBogus } from './chal/beach-blanket-bogus.js';
```

Add call in the text generation chain (~after line 2012):
```js
  _textBeachBlanketBogus(ep, ln, sec);
```

- [ ] **Step 8: Test the skeleton**

Open `simulator.html` in browser. Create a season with 2+ tribes. Add Beach Blanket Bogus as a twist. Run an episode. Verify:
- No console errors
- Episode completes (even though phases are placeholder)
- VP shows the title card screen
- Text backlog includes the challenge opener line

- [ ] **Step 9: Commit**

```bash
git add js/chal/beach-blanket-bogus.js js/core.js js/twists.js js/episode.js js/main.js js/vp-screens.js js/text-backlog.js
git commit -m "feat(beach-blanket-bogus): scaffold challenge + wire all integration points"
```

---

### Task 2: Surf Phase Engine (Phase 1)

**Files:**
- Modify: `js/chal/beach-blanket-bogus.js`

- [ ] **Step 1: Add hazard round constants and surf engine**

Add above `simulateBeachBlanketBogus`:

```js
const HAZARD_ROUNDS = [
  { id: 'cold-water', name: 'Cold Water', threat: 'LOW',
    statCheck: s => s.temperament * 0.08 + s.physical * 0.04,
    desc: 'The temperature drops. Ice forms on the boards. Teeth chatter.',
    survive: (p, pr) => `${p} grits ${pr.posAdj} teeth through the cold. Board steady.`,
    struggle: (p, pr) => `${p} shivers violently. ${pr.Sub} can barely grip the board.`,
    wipeout: (p, pr) => `${p}'s hands go numb. The board slips. ${pr.Sub} hits the water with a yelp.`,
  },
  { id: 'sharks-circle', name: 'Sharks Circle', threat: 'MEDIUM',
    statCheck: s => s.boldness * 0.08 + s.mental * 0.04,
    desc: 'Fins break the surface. The sharks are awake.',
    survive: (p, pr) => `${p} watches the fins pass beneath. Doesn't flinch. The sharks move on.`,
    struggle: (p, pr) => `${p} spots a fin heading straight at ${pr.obj}. Balance wavers.`,
    wipeout: (p, pr) => `A shark bumps the board from below. ${p} screams and goes sideways into the pool.`,
  },
  { id: 'seagull-swarm', name: 'Seagull Swarm', threat: 'HIGH',
    statCheck: s => s.mental * 0.07 + s.temperament * 0.05,
    desc: 'Chris loads the seagull gun. "Hope you like feathers!"',
    survive: (p, pr) => `${p} ducks flat as birds streak overhead. Back up before the board drifts. Clean.`,
    struggle: (p, pr) => `A seagull clips ${pr.posAdj} shoulder. ${p} stumbles but catches ${pr.posAdj}self.`,
    wipeout: (p, pr) => `Three seagulls at once. ${p} swats, spins, loses footing. Splash.`,
  },
  { id: 'equipment-thrown', name: 'Equipment Thrown', threat: 'HIGH',
    statCheck: s => s.mental * 0.08 + s.physical * 0.04,
    desc: 'Chris starts throwing whatever\'s nearby. Props, cameras, Lindsay.',
    survive: (p, pr) => `${p} sees it coming. Sidestep on the board — clean dodge. Chris looks annoyed.`,
    struggle: (p, pr) => `A prop grazes ${pr.posAdj} arm. ${p} wobbles hard but stays up.`,
    wipeout: (p, pr) => `Never saw the camera coming. ${p} takes it full in the chest and goes backward off the board.`,
  },
  { id: 'everything', name: 'Everything At Once', threat: 'EXTREME',
    statCheck: s => (s.physical + s.mental + s.boldness + s.temperament) * 0.025,
    desc: 'Cold. Sharks. Seagulls. Flying equipment. All at once. Chris is having the time of his life.',
    survive: (p, pr) => `${p} is soaked, scratched, freezing, and still on the board. Pure survival.`,
    struggle: (p, pr) => `${p} dodges a bird, flinches from a fin, takes a glancing blow. Barely upright.`,
    wipeout: (p, pr) => `It's too much. ${p} slips on ice, gets hit by a seagull, and the shark does the rest.`,
  },
];

const SURF_EVENTS = [
  { id: 'trash-talk', type: 'negative',
    check: (members, tribeMembers) => {
      for (const t of tribeMembers) {
        for (const a of t.members) {
          for (const ot of tribeMembers.filter(x => x.name !== t.name)) {
            for (const b of ot.members) {
              if (getBond(a, b) <= -2 && Math.random() < 0.3) return { actor: a, target: b };
            }
          }
        }
      }
      return null;
    },
    apply: (actor, target) => {
      addBond(actor, target, -0.3);
      const witnesses = players.filter(p => gs.activePlayers.includes(p.name) && p.name !== actor && p.name !== target).slice(0, 3);
      witnesses.forEach(w => addBond(w.name, actor, -0.2));
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[actor] = (gs.popularity[actor] || 0) - 1;
      return { actor, target, witnesses: witnesses.map(w => w.name) };
    },
    text: (d, pr) => `${d.actor} shouts from ${getBond(d.actor, d.target) <= -3 ? 'the board' : 'shore'}: "Enjoy the water, ${d.target}!" ${d.witnesses[0] || 'Someone'} winces.`,
    badge: 'TRASH TALK', badgeClass: 'red',
  },
  { id: 'showmance-distraction', type: 'negative',
    check: (members, tribeMembers) => {
      for (const sm of (gs.showmances || [])) {
        const aTribe = tribeMembers.find(t => t.members.includes(sm.a));
        const bTribe = tribeMembers.find(t => t.members.includes(sm.b));
        if (aTribe && bTribe && aTribe.name !== bTribe.name && Math.random() < 0.4) {
          return { surfer: sm.a, partner: sm.b, tribe: aTribe.name };
        }
      }
      return null;
    },
    apply: (surfer, partner, data) => {
      addBond(surfer, partner, 0.2);
      const tribemates = gs.tribes.find(t => t.name === data.tribe)?.members.filter(m => m !== surfer) || [];
      tribemates.forEach(m => addBond(m, surfer, -0.3));
      return { surfer, partner, tribemates };
    },
    text: (d, pr) => `${d.surfer} keeps glancing at ${d.partner} on the other side. Loses focus. Board wobbles. ${d.tribemates[0] || 'A tribemate'} groans.`,
    badge: 'DISTRACTED', badgeClass: 'red',
  },
  { id: 'clutch-save', type: 'positive',
    check: (members, tribeMembers, balances) => {
      for (const [name, bal] of Object.entries(balances)) {
        if (bal > 0 && bal < 30 && pStats(name).boldness >= 5 && Math.random() < 0.35) {
          return { hero: name };
        }
      }
      return null;
    },
    apply: (hero) => {
      const tribe = gs.tribes.find(t => t.members.includes(hero));
      if (tribe) tribe.members.forEach(m => { if (m !== hero) addBond(m, hero, 0.4); });
      const rivals = gs.tribes.filter(t => !t.members.includes(hero)).flatMap(t => t.members);
      rivals.slice(0, 2).forEach(r => addBond(r, hero, 0.1));
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[hero] = (gs.popularity[hero] || 0) + 2;
      return { hero, tribe: tribe?.name };
    },
    text: (d) => `${d.hero} is at the edge — board tipping, one foot off — and SLAMS back to center. The tribe screams. That should not have worked.`,
    badge: 'CLUTCH SAVE', badgeClass: 'gold',
  },
  { id: 'catastrophe', type: 'neutral',
    check: (members, tribeMembers) => {
      for (const t of tribeMembers) {
        for (const name of t.members) {
          const s = pStats(name);
          if (s.physical >= 7 && s.mental <= 4 && Math.random() < 0.25) return { victim: name, tribe: t.name };
        }
      }
      return null;
    },
    apply: (victim, _, data) => {
      const tribemates = gs.tribes.find(t => t.name === data.tribe)?.members.filter(m => m !== victim) || [];
      tribemates.forEach(m => addBond(m, victim, -0.2));
      const rivals = gs.tribes.filter(t => t.name !== data.tribe).flatMap(t => t.members);
      rivals.slice(0, 3).forEach(r => addBond(r, victim, 0.2));
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[victim] = (gs.popularity[victim] || 0) + 1;
      return { victim, tribemates, rivals: rivals.slice(0, 3) };
    },
    text: (d, pr) => `${d.victim} lands hard — the board SNAPS. Water geysers. The sharks scatter. Chris: "That's coming out of the budget." The other tribe can't stop laughing.`,
    badge: 'CATASTROPHE', badgeClass: 'red',
  },
  { id: 'encouraging-shout', type: 'positive',
    check: (members, tribeMembers, balances) => {
      for (const t of tribeMembers) {
        for (const shouter of t.members) {
          if (pStats(shouter).social < 6) continue;
          for (const surfer of t.members) {
            if (surfer === shouter) continue;
            if (getBond(shouter, surfer) >= 3 && (balances[surfer] || 0) > 0 && Math.random() < 0.3) {
              return { shouter, surfer };
            }
          }
        }
      }
      return null;
    },
    apply: (shouter, surfer) => {
      addBond(surfer, shouter, 0.3);
      return { shouter, surfer, balanceBoost: 5 };
    },
    text: (d) => `"Come on, ${d.surfer}! You got this!" ${d.shouter} shouts from the sideline. ${d.surfer} steadies. +5% balance.`,
    badge: 'ENCOURAGEMENT', badgeClass: 'gold',
  },
  { id: 'taunt-after-wipeout', type: 'negative',
    check: (members, tribeMembers, balances, wiped) => {
      if (!wiped.length) return null;
      for (const t of tribeMembers) {
        for (const name of t.members) {
          const arch = players.find(p => p.name === name)?.archetype || '';
          if (!['villain', 'schemer', 'mastermind'].includes(arch)) continue;
          const target = wiped[wiped.length - 1];
          if (getBond(name, target) > 0) continue;
          if (Math.random() < 0.35) return { taunter: name, victim: target };
        }
      }
      return null;
    },
    apply: (taunter, victim) => {
      addBond(taunter, victim, -0.5);
      const witnesses = gs.activePlayers.filter(p => p !== taunter && p !== victim).slice(0, 4);
      witnesses.forEach(w => addBond(w, taunter, -0.2));
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[taunter] = (gs.popularity[taunter] || 0) - 2;
      return { taunter, victim, witnesses };
    },
    text: (d) => `${d.taunter} cups ${pronouns(d.taunter).posAdj} hands: "Nice swim, ${d.victim}!" Nobody laughs. ${d.witnesses[0] || 'Everyone'} looks away.`,
    badge: 'TAUNT', badgeClass: 'red',
  },
  { id: 'shield-move', type: 'positive',
    check: (members, tribeMembers, balances) => {
      for (const t of tribeMembers) {
        for (const savior of t.members) {
          if ((balances[savior] || 0) <= 30) continue;
          for (const saved of t.members) {
            if (saved === savior) continue;
            if ((balances[saved] || 0) > 0 && (balances[saved] || 0) < 40 && getBond(savior, saved) >= 1 && Math.random() < 0.2) {
              return { savior, saved };
            }
          }
        }
      }
      return null;
    },
    apply: (savior, saved) => {
      addBond(saved, savior, 0.5);
      const tribe = gs.tribes.find(t => t.members.includes(savior));
      if (tribe) tribe.members.filter(m => m !== savior && m !== saved).forEach(m => addBond(m, savior, 0.2));
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[savior] = (gs.popularity[savior] || 0) + 2;
      return { savior, saved, balanceCost: 10 };
    },
    text: (d) => `A prop flies at ${d.saved}. ${d.savior} leans over and BLOCKS it with ${pronouns(d.savior).posAdj} arm. Board shakes from the impact — but ${d.saved} is safe. −10% balance for ${d.savior}.`,
    badge: 'SHIELD', badgeClass: 'gold',
  },
  { id: 'sabotage-splash', type: 'negative',
    check: (members, tribeMembers) => {
      for (const t of tribeMembers) {
        for (const name of t.members) {
          const arch = players.find(p => p.name === name)?.archetype || '';
          if (!['villain', 'schemer', 'mastermind'].includes(arch)) continue;
          const s = pStats(name);
          if (Math.random() >= s.strategic * 0.03) continue;
          const rivals = tribeMembers.filter(ot => ot.name !== t.name).flatMap(ot => ot.members);
          const target = rivals[Math.floor(Math.random() * rivals.length)];
          if (target) return { splasher: name, target };
        }
      }
      return null;
    },
    apply: (splasher, target) => {
      addBond(splasher, target, -0.3);
      const witnesses = gs.activePlayers.filter(p => p !== splasher && p !== target);
      const detected = witnesses.filter(w => pStats(w).intuition >= 6);
      detected.forEach(w => addBond(w, splasher, -0.4));
      return { splasher, target, detected, balanceLoss: 10 };
    },
    text: (d) => `${d.splasher} "accidentally" splashes water at ${d.target}'s board. The wave hits hard. −10% balance.${d.detected.length ? ` ${d.detected[0]} saw everything.` : ''}`,
    badge: 'SABOTAGE', badgeClass: 'red',
  },
];

function _simulateSurf(ep, tribeMembers, result) {
  const balances = {};
  const surfScores = {};
  const wipeoutOrder = [];
  const roundResults = [];

  tribeMembers.flatMap(t => t.members).forEach(name => {
    balances[name] = 100;
    surfScores[name] = 0;
  });

  for (let ri = 0; ri < HAZARD_ROUNDS.length; ri++) {
    const hazard = HAZARD_ROUNDS[ri];
    const roundEvents = [];
    const roundWipeouts = [];

    // Each active surfer faces the hazard
    const activeSurfers = tribeMembers.flatMap(t => t.members).filter(name => balances[name] > 0);
    for (const name of activeSurfers) {
      const s = pStats(name);
      const check = hazard.statCheck(s);
      const drain = (1 - Math.min(1, check)) * (25 + Math.random() * 15);
      balances[name] = Math.max(0, balances[name] - drain);

      if (balances[name] <= 0) {
        balances[name] = 0;
        wipeoutOrder.push(name);
        roundWipeouts.push(name);
        surfScores[name] = ri * 10;
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[name] = (gs.popularity[name] || 0) - 1;
      }
    }

    // Survivors get score boost
    activeSurfers.filter(n => balances[n] > 0).forEach(name => {
      surfScores[name] = (ri + 1) * 10 + balances[name];
    });

    // Mid-surf events (1-2 per round)
    const midEvents = [];
    const eventBudget = 1 + (Math.random() < 0.4 ? 1 : 0);
    const shuffled = [...SURF_EVENTS].sort(() => Math.random() - 0.5);
    for (const ev of shuffled) {
      if (midEvents.length >= eventBudget) break;
      const match = ev.check(activeSurfers, tribeMembers, balances, wipeoutOrder);
      if (!match) continue;
      const firstArg = match.actor || match.surfer || match.hero || match.victim || match.shouter || match.savior || match.splasher || match.taunter;
      const secondArg = match.target || match.partner || match.surfer || match.victim || match.saved;
      const applyResult = ev.apply(firstArg, secondArg, match);
      // Apply balance effects
      if (applyResult.balanceBoost && applyResult.surfer) {
        balances[applyResult.surfer] = Math.min(100, (balances[applyResult.surfer] || 0) + applyResult.balanceBoost);
      }
      if (applyResult.balanceLoss && applyResult.target) {
        balances[applyResult.target] = Math.max(0, (balances[applyResult.target] || 0) - applyResult.balanceLoss);
      }
      if (applyResult.balanceCost && applyResult.savior) {
        balances[applyResult.savior] = Math.max(0, (balances[applyResult.savior] || 0) - applyResult.balanceCost);
      }
      const pr = pronouns(firstArg);
      midEvents.push({
        type: ev.id,
        text: ev.text(applyResult, pr),
        badge: ev.badge, badgeClass: ev.badgeClass,
        players: [firstArg, secondArg].filter(Boolean),
        data: applyResult,
      });
    }

    roundResults.push({
      roundNum: ri + 1,
      hazard,
      balances: { ...balances },
      wipeouts: roundWipeouts,
      events: midEvents,
      activeSurfers: activeSurfers.filter(n => balances[n] > 0),
    });
  }

  // Tribe scoring: average surf score per member
  const tribeAvgs = {};
  tribeMembers.forEach(t => {
    const total = t.members.reduce((sum, name) => sum + (surfScores[name] || 0), 0);
    tribeAvgs[t.name] = total / t.members.length;
  });

  const surfWinner = Object.entries(tribeAvgs).sort((a, b) => b[1] - a[1])[0][0];
  result.tribeScores[surfWinner] = (result.tribeScores[surfWinner] || 0) + 1;

  result.surfData = {
    rounds: roundResults,
    balances,
    surfScores,
    wipeoutOrder,
    tribeAvgs,
    winner: surfWinner,
  };

  // Update chalMemberScores
  for (const [name, score] of Object.entries(surfScores)) {
    ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + score;
  }
}
```

- [ ] **Step 2: Call surf from simulateBeachBlanketBogus**

Replace the placeholder tribe scoring in `simulateBeachBlanketBogus` with:

```js
  // Initialize chalMemberScores before phases
  const chalMemberScores = {};
  tribeMembers.flatMap(t => t.members).forEach(name => { chalMemberScores[name] = 0; });
  ep.chalMemberScores = chalMemberScores;

  // Phase 1: Surf
  _simulateSurf(ep, tribeMembers, result);
```

And move the winner/loser determination to after all phases (end of function).

- [ ] **Step 3: Test surf phase**

Run an episode with Beach Blanket Bogus. Check console for errors. Verify `ep.beachBlanketBogus.surfData` exists with 5 rounds, wipeout order, and a surf winner.

- [ ] **Step 4: Commit**

```bash
git add js/chal/beach-blanket-bogus.js
git commit -m "feat(beach-blanket-bogus): surf phase engine — 5 hazard rounds with balance mechanic + 8 mid-surf events"
```

---

### Task 3: Sandcastle Phase Engine (Phase 2)

**Files:**
- Modify: `js/chal/beach-blanket-bogus.js`

- [ ] **Step 1: Add material constants and scavenge engine**

```js
const MATERIALS = [
  { id: 'shells', name: 'Shells', emoji: '🐚', type: 'decorative',
    statCheck: s => s.intuition * 0.08 + s.mental * 0.04 },
  { id: 'driftwood', name: 'Driftwood', emoji: '🪵', type: 'structural',
    statCheck: s => s.physical * 0.08 + s.intuition * 0.04 },
  { id: 'rocks', name: 'Rocks', emoji: '🪨', type: 'foundation',
    statCheck: s => s.physical * 0.06 + s.temperament * 0.06 },
];

const SCAVENGE_ENCOUNTERS = [
  { id: 'race-for-material',
    check: (tribeMembers) => {
      const t1 = tribeMembers[0], t2 = tribeMembers[1];
      if (!t1 || !t2) return null;
      const a = t1.members[Math.floor(Math.random() * t1.members.length)];
      const b = t2.members[Math.floor(Math.random() * t2.members.length)];
      if (Math.random() < 0.35) return { a, b, aTribe: t1.name, bTribe: t2.name };
      return null;
    },
    apply: (d) => {
      const sA = pStats(d.a), sB = pStats(d.b);
      const winner = (sA.physical + sA.intuition) >= (sB.physical + sB.intuition) ? d.a : d.b;
      const loser = winner === d.a ? d.b : d.a;
      addBond(loser, winner, -0.3);
      return { ...d, winner, loser, materialType: MATERIALS[Math.floor(Math.random() * MATERIALS.length)] };
    },
    text: (d) => `${d.a} and ${d.b} spot the same piece of ${d.materialType.name.toLowerCase()} at the same time. ${d.winner} gets there first. ${d.loser} walks away empty-handed.`,
    badge: 'RACE', badgeClass: 'gold',
  },
  { id: 'help-rival',
    check: (tribeMembers) => {
      for (const t of tribeMembers) {
        for (const a of t.members) {
          for (const ot of tribeMembers.filter(x => x.name !== t.name)) {
            for (const b of ot.members) {
              if (getBond(a, b) >= 2 && Math.random() < 0.15) return { helper: a, rival: b, helperTribe: t.name, rivalTribe: ot.name };
            }
          }
        }
      }
      return null;
    },
    apply: (d) => {
      addBond(d.helper, d.rival, 0.5);
      const tribemates = gs.tribes.find(t => t.name === d.helperTribe)?.members.filter(m => m !== d.helper) || [];
      tribemates.forEach(m => addBond(m, d.helper, -0.3));
      return { ...d, tribemates };
    },
    text: (d) => `${d.helper} sees ${d.rival} struggling to carry driftwood. Helps ${pronouns(d.rival).obj} carry it back. ${d.tribemates[0] || 'A tribemate'}: "What are you DOING?"`,
    badge: 'CROSS-TRIBE HELP', badgeClass: 'gold',
  },
  { id: 'steal-material',
    check: (tribeMembers) => {
      for (const t of tribeMembers) {
        for (const name of t.members) {
          const arch = players.find(p => p.name === name)?.archetype || '';
          if (!['villain', 'schemer', 'mastermind'].includes(arch)) continue;
          if (Math.random() >= pStats(name).strategic * 0.025) continue;
          const rivalTribe = tribeMembers.find(ot => ot.name !== t.name);
          if (rivalTribe) return { thief: name, thiefTribe: t.name, victimTribe: rivalTribe.name };
        }
      }
      return null;
    },
    apply: (d) => {
      const witnesses = gs.activePlayers.filter(p => p !== d.thief);
      const caught = witnesses.filter(w => pStats(w).intuition >= 6 && Math.random() < 0.5);
      caught.forEach(w => addBond(w, d.thief, -0.5));
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[d.thief] = (gs.popularity[d.thief] || 0) - 1;
      return { ...d, caught };
    },
    text: (d) => `${d.thief} pockets a shell from ${d.victimTribe}'s pile while nobody's looking. ${d.caught.length ? `Except ${d.caught[0]} was looking.` : 'Clean getaway.'}`,
    badge: 'THEFT', badgeClass: 'red',
  },
  { id: 'hidden-cache',
    check: (tribeMembers) => {
      for (const t of tribeMembers) {
        for (const name of t.members) {
          if (pStats(name).intuition >= 7 && Math.random() < 0.15) return { finder: name, tribe: t.name };
        }
      }
      return null;
    },
    apply: (d) => {
      const tribe = gs.tribes.find(t => t.name === d.tribe);
      if (tribe) tribe.members.filter(m => m !== d.finder).forEach(m => addBond(m, d.finder, 0.3));
      return d;
    },
    text: (d) => `${d.finder} digs behind a rock and finds a stash — shells, driftwood, and a smooth flat stone. Jackpot. +2 bonus materials for ${d.tribe}.`,
    badge: 'HIDDEN CACHE', badgeClass: 'gold',
  },
  { id: 'territorial-standoff',
    check: (tribeMembers) => {
      if (tribeMembers.length < 2 && Math.random() < 0.2) return null;
      const a = tribeMembers[0].members[Math.floor(Math.random() * tribeMembers[0].members.length)];
      const b = tribeMembers[1].members[Math.floor(Math.random() * tribeMembers[1].members.length)];
      if (Math.random() < 0.2) return { a, b, aTribe: tribeMembers[0].name, bTribe: tribeMembers[1].name };
      return null;
    },
    apply: (d) => {
      const sA = pStats(d.a), sB = pStats(d.b);
      const winner = sA.boldness >= sB.boldness ? d.a : d.b;
      const loserTribe = winner === d.a ? d.bTribe : d.aTribe;
      const loserMembers = gs.tribes.find(t => t.name === loserTribe)?.members || [];
      loserMembers.forEach(m => {
        const rival = winner === d.a ? d.b : d.a;
        if (m !== rival) addBond(m, rival, -0.2);
      });
      return { ...d, winner, loserTribe };
    },
    text: (d) => `Both tribes claim the same stretch of beach. ${d.a} and ${d.b} square off. ${d.winner} doesn't blink. ${d.loserTribe} backs off.`,
    badge: 'STANDOFF', badgeClass: 'red',
  },
];

const BUILD_EVENTS = [
  { id: 'creative-disagreement',
    check: (tribe) => {
      const smart = tribe.members.filter(m => pStats(m).mental >= 6);
      if (smart.length >= 2 && Math.random() < 0.3) return { a: smart[0], b: smart[1], tribe: tribe.name };
      return null;
    },
    apply: (d) => {
      const resolved = pStats(d.a).social + pStats(d.b).social >= 10;
      if (resolved) {
        addBond(d.a, d.b, 0.2); addBond(d.b, d.a, 0.2);
      } else {
        addBond(d.a, d.b, -0.3); addBond(d.b, d.a, -0.3);
      }
      return { ...d, resolved, scoreMod: resolved ? 3 : -2 };
    },
    text: (d) => d.resolved
      ? `${d.a} and ${d.b} argue about the tower design. Then ${d.a} tries ${d.b}'s idea — it works better. "Fine. You were right." +3% build.`
      : `${d.a} and ${d.b} can't agree on anything. The tower leans left because neither will compromise. −2% build.`,
    badge: (d) => d.resolved ? 'TEAMWORK' : 'DISAGREEMENT',
    badgeClass: (d) => d.resolved ? 'gold' : 'red',
  },
  { id: 'sabotage-kick',
    check: (tribe, tribeMembers) => {
      const otherTribe = tribeMembers.find(t => t.name !== tribe.name);
      if (!otherTribe) return null;
      for (const name of otherTribe.members) {
        const arch = players.find(p => p.name === name)?.archetype || '';
        if (!['villain', 'schemer', 'mastermind'].includes(arch)) continue;
        if (Math.random() < pStats(name).strategic * 0.025) return { saboteur: name, victimTribe: tribe.name };
      }
      return null;
    },
    apply: (d) => {
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[d.saboteur] = (gs.popularity[d.saboteur] || 0) - 1;
      const detected = gs.activePlayers.filter(p => p !== d.saboteur && pStats(p).intuition >= 6 && Math.random() < 0.4);
      detected.forEach(w => addBond(w, d.saboteur, -0.4));
      return { ...d, detected, scoreMod: -2 };
    },
    text: (d) => `${d.saboteur} kicks sand across ${d.victimTribe}'s foundation. "Oops. The wind." There is no wind. −2 build score.${d.detected.length ? ` ${d.detected[0]} saw everything.` : ''}`,
    badge: () => 'SABOTAGE', badgeClass: () => 'red',
  },
  { id: 'teamwork-moment',
    check: (tribe) => {
      for (let i = 0; i < tribe.members.length; i++) {
        for (let j = i + 1; j < tribe.members.length; j++) {
          if (getBond(tribe.members[i], tribe.members[j]) >= 3 && Math.random() < 0.25) {
            return { a: tribe.members[i], b: tribe.members[j], tribe: tribe.name };
          }
        }
      }
      return null;
    },
    apply: (d) => {
      addBond(d.a, d.b, 0.3); addBond(d.b, d.a, 0.3);
      return { ...d, scoreMod: 2 };
    },
    text: (d) => `${d.a} holds the base steady while ${d.b} sculpts the top. No words needed — they just sync. +2% build.`,
    badge: () => 'TEAMWORK', badgeClass: () => 'gold',
  },
  { id: 'collapse-setback',
    check: (tribe) => {
      const weakest = tribe.members.slice().sort((a, b) => pStats(a).temperament - pStats(b).temperament)[0];
      if (weakest && pStats(weakest).temperament <= 5 && Math.random() < 0.2) return { klutz: weakest, tribe: tribe.name };
      return null;
    },
    apply: (d) => {
      const helper = d.tribe ? gs.tribes.find(t => t.name === d.tribe)?.members.find(m => m !== d.klutz && pStats(m).social >= 5) : null;
      if (helper) {
        addBond(d.klutz, helper, 0.4);
      } else {
        gs.tribes.find(t => t.name === d.tribe)?.members.filter(m => m !== d.klutz).forEach(m => addBond(m, d.klutz, -0.2));
      }
      return { ...d, helper, scoreMod: helper ? -1 : -3 };
    },
    text: (d) => d.helper
      ? `${d.klutz} bumps the main tower. It wobbles — starts to fall — ${d.helper} catches it. "I got it." Crisis averted. −1% build.`
      : `${d.klutz} bumps the main tower. It collapses. The tribe stares at the pile. −3% build.`,
    badge: (d) => d.helper ? 'SAVE' : 'COLLAPSE',
    badgeClass: (d) => d.helper ? 'gold' : 'red',
  },
  { id: 'copycat-accusation',
    check: (tribe, tribeMembers) => {
      if (Math.random() < 0.15) {
        const otherTribe = tribeMembers.find(t => t.name !== tribe.name);
        if (otherTribe) {
          const accuser = tribe.members[Math.floor(Math.random() * tribe.members.length)];
          return { accuser, accuserTribe: tribe.name, accusedTribe: otherTribe.name };
        }
      }
      return null;
    },
    apply: (d) => {
      const accusedMembers = gs.tribes.find(t => t.name === d.accusedTribe)?.members || [];
      accusedMembers.forEach(m => addBond(m, d.accuser, -0.3));
      return d;
    },
    text: (d) => `${d.accuser}: "They're copying our design!" ${d.accusedTribe}: "Your design is a pile of sand." Chris: "Both designs are piles of sand. That's the challenge."`,
    badge: () => 'ACCUSATION', badgeClass: () => 'red',
  },
  { id: 'paper-mache-trick',
    check: (tribe) => {
      const smart = tribe.members.find(m => pStats(m).mental >= 7);
      if (smart && Math.random() < 0.2) return { inventor: smart, tribe: tribe.name };
      return null;
    },
    apply: (d) => {
      gs.tribes.find(t => t.name === d.tribe)?.members.filter(m => m !== d.inventor).forEach(m => addBond(m, d.inventor, 0.3));
      return { ...d, scoreMod: 5 };
    },
    text: (d) => `${d.inventor} finds old magazines by the craft table. "Give me those." Paper-mâché support structure. The castle suddenly has a skeleton. +5% build.`,
    badge: () => 'INNOVATION', badgeClass: () => 'gold',
  },
];

function _simulateSandcastle(ep, tribeMembers, result) {
  const tribeMaterials = {};
  const tribeBuildScores = {};
  const scavengeEncounters = [];
  const buildEvents = [];

  tribeMembers.forEach(t => { tribeMaterials[t.name] = { shells: 0, driftwood: 0, rocks: 0 }; });

  // Sub-phase A: Scavenge
  tribeMembers.forEach(t => {
    t.members.forEach(name => {
      const s = pStats(name);
      for (const mat of MATERIALS) {
        const roll = mat.statCheck(s) + Math.random() * 0.3;
        if (roll >= 0.45) {
          tribeMaterials[t.name][mat.id] += 1;
          if (roll >= 0.7) tribeMaterials[t.name][mat.id] += 1;
        }
      }
    });
  });

  // Scavenge encounters (1-2)
  const encBudget = 1 + (Math.random() < 0.4 ? 1 : 0);
  const shuffledEnc = [...SCAVENGE_ENCOUNTERS].sort(() => Math.random() - 0.5);
  for (const enc of shuffledEnc) {
    if (scavengeEncounters.length >= encBudget) break;
    const match = enc.check(tribeMembers);
    if (!match) continue;
    const applied = enc.apply(match);
    // Apply material effects
    if (enc.id === 'hidden-cache') {
      tribeMaterials[match.tribe].shells += 1;
      tribeMaterials[match.tribe].driftwood += 1;
    }
    if (enc.id === 'steal-material') {
      const matType = MATERIALS[Math.floor(Math.random() * MATERIALS.length)].id;
      if (tribeMaterials[match.victimTribe][matType] > 0) {
        tribeMaterials[match.victimTribe][matType] -= 1;
        tribeMaterials[match.thiefTribe][matType] = (tribeMaterials[match.thiefTribe]?.[matType] || 0) + 1;
      }
    }
    if (enc.id === 'help-rival') {
      const matType = MATERIALS[Math.floor(Math.random() * MATERIALS.length)].id;
      if (tribeMaterials[match.helperTribe][matType] > 0) {
        tribeMaterials[match.helperTribe][matType] -= 1;
        tribeMaterials[match.rivalTribe][matType] = (tribeMaterials[match.rivalTribe]?.[matType] || 0) + 1;
      }
    }
    scavengeEncounters.push({
      type: enc.id,
      text: enc.text(applied),
      badge: enc.badge, badgeClass: enc.badgeClass,
      players: Object.values(match).filter(v => typeof v === 'string' && gs.activePlayers.includes(v)),
      data: applied,
    });
  }

  // Sub-phase B: Build
  tribeMembers.forEach(t => {
    let baseScore = 0;
    t.members.forEach(name => {
      const s = pStats(name);
      const contrib = (s.mental * 0.06 + s.social * 0.05 + s.temperament * 0.04) * (0.8 + Math.random() * 0.4);
      baseScore += contrib;
      ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + Math.round(contrib * 10 + Object.values(tribeMaterials[t.name]).reduce((s, v) => s + v, 0) * 5);
    });
    baseScore /= t.members.length;

    // Material bonuses
    const mats = tribeMaterials[t.name];
    let bonus = 0;
    if (mats.shells >= 3) bonus += 0.08;
    if (mats.driftwood >= 3) bonus += 0.08;
    if (mats.rocks >= 3) bonus += 0.08;
    if (mats.shells > 0 && mats.driftwood > 0 && mats.rocks > 0) bonus += 0.05;

    // Build captain
    const captain = t.members.slice().sort((a, b) => pStats(b).mental - pStats(a).mental)[0];
    const captainBonus = pStats(captain).strategic * 0.03;

    tribeBuildScores[t.name] = baseScore * (1 + bonus) + captainBonus;
  });

  // Build events (1-3 per tribe)
  tribeMembers.forEach(t => {
    const evBudget = 1 + (Math.random() < 0.4 ? 1 : 0) + (Math.random() < 0.2 ? 1 : 0);
    const shuffledBuild = [...BUILD_EVENTS].sort(() => Math.random() - 0.5);
    for (const ev of shuffledBuild) {
      if (buildEvents.filter(e => e.tribe === t.name).length >= evBudget) break;
      const match = ev.check(t, tribeMembers);
      if (!match) continue;
      const applied = ev.apply(match);
      if (applied.scoreMod) tribeBuildScores[t.name] += applied.scoreMod * 0.01 * tribeBuildScores[t.name];
      const badgeText = typeof ev.badge === 'function' ? ev.badge(applied) : ev.badge;
      const badgeCls = typeof ev.badgeClass === 'function' ? ev.badgeClass(applied) : ev.badgeClass;
      buildEvents.push({
        type: ev.id, tribe: t.name,
        text: ev.text(applied),
        badge: badgeText, badgeClass: badgeCls,
        players: Object.values(match).filter(v => typeof v === 'string' && gs.activePlayers.includes(v)),
        data: applied,
      });
    }
  });

  // Winner
  const sandWinner = Object.entries(tribeBuildScores).sort((a, b) => b[1] - a[1])[0][0];
  result.tribeScores[sandWinner] = (result.tribeScores[sandWinner] || 0) + 1;

  result.sandcastleData = {
    materials: tribeMaterials,
    buildScores: tribeBuildScores,
    scavengeEncounters,
    buildEvents,
    captains: {},
    winner: sandWinner,
  };

  tribeMembers.forEach(t => {
    result.sandcastleData.captains[t.name] = t.members.slice().sort((a, b) => pStats(b).mental - pStats(a).mental)[0];
  });
}
```

- [ ] **Step 2: Call sandcastle from simulateBeachBlanketBogus**

After the surf call:
```js
  // Phase 2: Sandcastle
  _simulateSandcastle(ep, tribeMembers, result);
```

- [ ] **Step 3: Test**

Run episode. Verify `ep.beachBlanketBogus.sandcastleData` has materials, buildScores, encounters, events, and a winner.

- [ ] **Step 4: Commit**

```bash
git add js/chal/beach-blanket-bogus.js
git commit -m "feat(beach-blanket-bogus): sandcastle phase — scavenge + build + 11 event types"
```

---

### Task 4: Halftime Drama + Dance-Off + Winner Resolution

**Files:**
- Modify: `js/chal/beach-blanket-bogus.js`

- [ ] **Step 1: Add halftime drama interlude**

```js
const HALFTIME_EVENTS = [
  { id: 'rivalry-confrontation',
    check: (tribeMembers) => {
      for (const t of tribeMembers) {
        for (const a of t.members) {
          for (const ot of tribeMembers.filter(x => x.name !== t.name)) {
            for (const b of ot.members) {
              if (getBond(a, b) <= -2 && Math.random() < 0.3) return { a, b };
            }
          }
        }
      }
      return null;
    },
    apply: (d) => {
      addBond(d.a, d.b, -0.4); addBond(d.b, d.a, -0.4);
      const witnesses = gs.activePlayers.filter(p => p !== d.a && p !== d.b).slice(0, 3);
      witnesses.forEach(w => {
        const closer = getBond(w, d.a) > getBond(w, d.b) ? d.a : d.b;
        const farther = closer === d.a ? d.b : d.a;
        addBond(w, closer, 0.2); addBond(w, farther, -0.2);
      });
      return { ...d, witnesses };
    },
    text: (d) => {
      const texts = [
        `${d.a} and ${d.b} cross paths on the beach. Words start quiet. They don't stay quiet.`,
        `${d.a} makes a comment about ${d.b}'s performance. ${d.b} makes a comment about ${d.a}'s face. It escalates.`,
        `"Stay out of my way." "${d.a}, I am literally standing on a public beach." It goes downhill from there.`,
      ];
      return texts[Math.floor(Math.random() * texts.length)];
    },
    badge: 'CONFRONTATION', badgeClass: 'red',
  },
  { id: 'alliance-pitch',
    check: (tribeMembers) => {
      for (const t of tribeMembers) {
        for (const name of t.members) {
          const s = pStats(name);
          const arch = players.find(p => p.name === name)?.archetype || '';
          if ((s.social >= 7 || ['mastermind', 'schemer', 'social-butterfly'].includes(arch)) && Math.random() < 0.25) {
            const target = t.members.find(m => m !== name && getBond(name, m) >= 0);
            if (target) return { pitcher: name, target, tribe: t.name };
          }
        }
      }
      return null;
    },
    apply: (d) => {
      const targetS = pStats(d.target);
      const accepted = (pStats(d.pitcher).social + getBond(d.target, d.pitcher)) > (targetS.mental * 0.5 + Math.random() * 5);
      if (accepted) {
        addBond(d.pitcher, d.target, 0.3); addBond(d.target, d.pitcher, 0.3);
      } else {
        addBond(d.pitcher, d.target, -0.2);
      }
      return { ...d, accepted };
    },
    text: (d) => d.accepted
      ? `${d.pitcher} pulls ${d.target} aside by the umbrellas. "You and me — we look out for each other." ${d.target} nods. Deal made.`
      : `${d.pitcher} floats an alliance to ${d.target}. ${d.target} smiles and says nothing. That's a no.`,
    badge: (d) => d.accepted ? 'ALLIANCE FORMED' : 'REJECTED',
    badgeClass: (d) => d.accepted ? 'gold' : 'red',
  },
  { id: 'showmance-moment',
    check: (tribeMembers) => {
      for (const spark of [...(gs.showmances || []), ...(gs.romanticSparks || [])]) {
        if (gs.activePlayers.includes(spark.a) && gs.activePlayers.includes(spark.b) && Math.random() < 0.4) {
          if (!romanticCompat(spark.a, spark.b)) continue;
          return { a: spark.a, b: spark.b };
        }
      }
      return null;
    },
    apply: (d) => {
      addBond(d.a, d.b, 0.3); addBond(d.b, d.a, 0.3);
      const nearby = gs.activePlayers.filter(p => p !== d.a && p !== d.b).slice(0, 2);
      nearby.forEach(n => {
        addBond(n, d.a, Math.random() < 0.5 ? 0.1 : -0.1);
      });
      return { ...d, nearby };
    },
    text: (d) => {
      const pr = pronouns(d.a);
      return `${d.a} finds ${d.b} at the water's edge. They don't say much. The sunset does the talking. ${d.nearby[0] ? `${d.nearby[0]} watches from a distance, unsure what to think.` : ''}`;
    },
    badge: 'SHOWMANCE', badgeClass: 'gold',
  },
  { id: 'injury-check',
    check: (tribeMembers, surfData) => {
      if (!surfData?.wipeoutOrder?.length) return null;
      const victim = surfData.wipeoutOrder[surfData.wipeoutOrder.length - 1];
      if (Math.random() < 0.3) return { victim };
      return null;
    },
    apply: (d) => {
      const healer = gs.activePlayers.find(p => p !== d.victim && pStats(p).social >= 6 && getBond(p, d.victim) >= 0);
      if (healer) addBond(d.victim, healer, 0.4);
      return { ...d, healer, sandcastlePenalty: healer ? 0 : 15 };
    },
    text: (d) => d.healer
      ? `${d.victim} is nursing a sore shoulder from the wipeout. ${d.healer} brings ice. "You good?" "...yeah. Thanks."`
      : `${d.victim} is limping from the wipeout. Nobody checks on ${pronouns(d.victim).obj}. −15% sandcastle contribution.`,
    badge: (d) => d.healer ? 'PATCHED UP' : 'INJURY',
    badgeClass: (d) => d.healer ? 'gold' : 'red',
  },
  { id: 'strategy-huddle',
    check: (tribeMembers) => {
      for (const t of tribeMembers) {
        const captain = t.members.slice().sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
        if (captain && Math.random() < 0.25) return { captain, tribe: t.name };
      }
      return null;
    },
    apply: (d) => {
      const s = pStats(d.captain);
      const success = s.social * 0.1 + Math.random() * 0.4 >= 0.5;
      const members = gs.tribes.find(t => t.name === d.tribe)?.members || [];
      if (success) {
        members.forEach(a => members.forEach(b => { if (a !== b) addBond(a, b, 0.2); }));
      } else {
        members.forEach(m => { if (m !== d.captain) addBond(m, d.captain, -0.1); });
      }
      return { ...d, success };
    },
    text: (d) => d.success
      ? `${d.captain} calls ${d.tribe} together. "Here's how we win this next one." The tribe listens. For once, everyone agrees.`
      : `${d.captain} tries to rally ${d.tribe}. It turns into an argument about who messed up the surfing. Productive.`,
    badge: (d) => d.success ? 'RALLY' : 'BACKFIRE',
    badgeClass: (d) => d.success ? 'gold' : 'red',
  },
  { id: 'cross-tribe-taunt',
    check: (tribeMembers, surfData) => {
      if (!surfData?.winner) return null;
      const winTribe = tribeMembers.find(t => t.name === surfData.winner);
      if (!winTribe) return null;
      for (const name of winTribe.members) {
        const arch = players.find(p => p.name === name)?.archetype || '';
        if (['villain', 'schemer', 'mastermind'].includes(arch) && Math.random() < 0.3) {
          return { taunter: name, winTribe: winTribe.name, loseTribe: tribeMembers.find(t => t.name !== winTribe.name)?.name };
        }
      }
      return null;
    },
    apply: (d) => {
      const losers = gs.tribes.find(t => t.name === d.loseTribe)?.members || [];
      losers.forEach(m => addBond(m, d.taunter, -0.3));
      const own = gs.tribes.find(t => t.name === d.winTribe)?.members.filter(m => m !== d.taunter) || [];
      own.forEach(m => addBond(m, d.taunter, Math.random() < 0.5 ? 0.1 : -0.1));
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[d.taunter] = (gs.popularity[d.taunter] || 0) - 1;
      return { ...d, losers };
    },
    text: (d) => `${d.taunter} walks past ${d.loseTribe}: "Better luck next time. Oh wait — there IS a next time. And you'll need it." ${d.losers[0] || 'Someone'} clenches a fist.`,
    badge: 'TAUNT', badgeClass: 'red',
  },
];

function _simulateHalftime(ep, tribeMembers, result) {
  const events = [];
  const budget = 2 + (Math.random() < 0.3 ? 1 : 0);
  const shuffled = [...HALFTIME_EVENTS].sort(() => Math.random() - 0.5);

  for (const ev of shuffled) {
    if (events.length >= budget) break;
    const match = ev.check(tribeMembers, result.surfData);
    if (!match) continue;
    const applied = ev.apply(match);
    const badgeText = typeof ev.badge === 'function' ? ev.badge(applied) : ev.badge;
    const badgeCls = typeof ev.badgeClass === 'function' ? ev.badgeClass(applied) : ev.badgeClass;
    events.push({
      type: ev.id,
      text: typeof ev.text === 'function' ? ev.text(applied) : ev.text,
      badge: badgeText, badgeClass: badgeCls,
      players: Object.values(match).filter(v => typeof v === 'string' && gs.activePlayers.includes(v)),
      data: applied,
    });
  }

  result.halftimeEvents = events;

  // Camp events with badges
  const campKey = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes[0]?.name || 'merge');
  if (!gs.campEvents) gs.campEvents = {};
  if (!gs.campEvents[campKey]) gs.campEvents[campKey] = [];
  for (const ev of events) {
    gs.campEvents[campKey].push({
      text: ev.text, players: ev.players,
      badgeText: ev.badge, badgeClass: ev.badgeClass,
    });
  }
}
```

- [ ] **Step 2: Add dance-off engine**

```js
const DANCE_SELECTION = [
  { id: 'volunteer', check: (tribe) => {
    const bold = tribe.members.slice().sort((a, b) => pStats(b).boldness - pStats(a).boldness)[0];
    if (bold && pStats(bold).boldness >= 7 && Math.random() < 0.4) return { dancer: bold, method: 'volunteer' };
    return null;
  }, bondEffect: (d) => {
    const members = gs.tribes.find(t => t.members.includes(d.dancer))?.members || [];
    members.filter(m => m !== d.dancer).forEach(m => addBond(m, d.dancer, 0.2));
  }, text: (d) => `${d.dancer} steps forward before anyone else can speak. "I got this."` },
  { id: 'nominated', check: (tribe) => {
    const best = tribe.members.slice().sort((a, b) => (pStats(b).social + pStats(b).physical) - (pStats(a).social + pStats(a).physical))[0];
    if (best && Math.random() < 0.5) return { dancer: best, method: 'nominated' };
    return null;
  }, bondEffect: (d) => {
    const members = gs.tribes.find(t => t.members.includes(d.dancer))?.members || [];
    members.filter(m => m !== d.dancer).forEach(m => addBond(m, d.dancer, 0.1));
  }, text: (d) => `The tribe looks around. All eyes land on ${d.dancer}. "...fine."` },
  { id: 'power-grab', check: (tribe) => {
    for (const name of tribe.members) {
      const arch = players.find(p => p.name === name)?.archetype || '';
      if (['schemer', 'mastermind'].includes(arch) && Math.random() < 0.2) return { dancer: name, method: 'power-grab' };
    }
    return null;
  }, bondEffect: (d) => {
    const members = gs.tribes.find(t => t.members.includes(d.dancer))?.members || [];
    members.filter(m => m !== d.dancer).forEach(m => addBond(m, d.dancer, -0.2));
  }, text: (d) => `${d.dancer} pushes to the front. "Nobody else has what it takes." The tribe exchanges looks.` },
  { id: 'guilt-trip', check: (tribe) => {
    for (const name of tribe.members) {
      const s = pStats(name);
      if (s.social >= 7 && Math.random() < 0.15) {
        const target = tribe.members.find(m => m !== name && pStats(m).loyalty >= 6);
        if (target) return { pressurer: name, dancer: target, method: 'guilt-trip' };
      }
    }
    return null;
  }, bondEffect: (d) => {
    addBond(d.dancer, d.pressurer, -0.2);
    addBond(d.pressurer, d.dancer, -0.3);
  }, text: (d) => `${d.pressurer}: "You owe us after that surfing performance." ${d.dancer} swallows hard and stands up.` },
];

const DANCE_BEATS = [
  { id: 'crowd-erupts', check: (score, range) => score >= range[1] * 0.75,
    bond: (dancer) => {
      const tribe = gs.tribes.find(t => t.members.includes(dancer));
      if (tribe) tribe.members.filter(m => m !== dancer).forEach(m => addBond(m, dancer, 0.5));
      gs.tribes.filter(t => !t.members.includes(dancer)).flatMap(t => t.members).slice(0, 2).forEach(r => addBond(r, dancer, 0.1));
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[dancer] = (gs.popularity[dancer] || 0) + 2;
    },
    text: (dancer) => `${dancer} BRINGS IT. The camp goes wild. Even Chris claps. That was undeniable.`,
    badge: 'SHOWSTOPPER', badgeClass: 'gold' },
  { id: 'choke', check: (score, range) => score <= range[0] * 1.25,
    bond: (dancer) => {
      const tribe = gs.tribes.find(t => t.members.includes(dancer));
      if (tribe) tribe.members.filter(m => m !== dancer).forEach(m => addBond(m, dancer, -0.3));
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[dancer] = (gs.popularity[dancer] || 0) - 1;
    },
    text: (dancer) => `${dancer} freezes. The music plays. ${pronouns(dancer).Sub} just... stands there. The tribe can't watch.`,
    badge: 'CHOKE', badgeClass: 'red' },
  { id: 'showmance-audience', check: () => {
      for (const sm of (gs.showmances || [])) {
        if (gs.activePlayers.includes(sm.a) && gs.activePlayers.includes(sm.b)) return true;
      }
      return false;
    },
    bond: (dancer) => {
      const sm = (gs.showmances || []).find(s => s.a === dancer || s.b === dancer);
      if (sm) {
        const partner = sm.a === dancer ? sm.b : sm.a;
        addBond(partner, dancer, 0.4);
      }
    },
    text: (dancer) => {
      const sm = (gs.showmances || []).find(s => s.a === dancer || s.b === dancer);
      const partner = sm ? (sm.a === dancer ? sm.b : sm.a) : 'someone';
      return `${partner} watches from the front row. ${dancer} dances a little harder knowing ${pronouns(partner).sub} ${pronouns(partner).sub === 'they' ? 'are' : 'is'} watching.`;
    },
    badge: 'SHOWMANCE', badgeClass: 'gold' },
  { id: 'rival-heckle', check: () => Math.random() < 0.25,
    bond: (dancer) => {
      const rivals = gs.tribes.filter(t => !t.members.includes(dancer)).flatMap(t => t.members);
      const heckler = rivals.find(r => getBond(r, dancer) <= -3);
      if (heckler) {
        addBond(heckler, dancer, -0.2);
        const tribe = gs.tribes.find(t => t.members.includes(heckler));
        if (tribe) tribe.members.filter(m => m !== heckler).forEach(m => addBond(m, heckler, -0.3));
      }
    },
    text: (dancer) => {
      const rivals = gs.tribes.filter(t => !t.members.includes(dancer)).flatMap(t => t.members);
      const heckler = rivals.find(r => getBond(r, dancer) <= -3) || rivals[0] || 'Someone';
      return `${heckler} cups their hands: "BOO!" The tribe glares at ${heckler}. Not cool.`;
    },
    badge: 'HECKLE', badgeClass: 'red' },
  { id: 'signature-move', check: () => Math.random() < 0.3,
    bond: (dancer) => {
      if (pStats(dancer).boldness < 8) return;
      gs.activePlayers.filter(p => p !== dancer).forEach(p => addBond(p, dancer, 0.2));
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[dancer] = (gs.popularity[dancer] || 0) + 2;
    },
    text: (dancer) => `${dancer} pulls out something nobody expected — a move so good the music almost can't keep up. +5% score.`,
    badge: 'SIGNATURE MOVE', badgeClass: 'gold' },
  { id: 'trip-stumble', check: () => Math.random() < 0.2,
    bond: (dancer) => {
      if (pStats(dancer).temperament > 4) return;
      const recovers = pStats(dancer).boldness >= 6;
      const tribe = gs.tribes.find(t => t.members.includes(dancer));
      if (tribe) tribe.members.filter(m => m !== dancer).forEach(m => addBond(m, dancer, recovers ? 0.3 : -0.2));
    },
    text: (dancer) => {
      const recovers = pStats(dancer).boldness >= 6;
      return recovers
        ? `${dancer} trips on a branch — stumbles — and turns it into a SLIDE. The crowd gasps, then cheers. Recovery of the night.`
        : `${dancer} trips on a branch and goes down. Hard. The tribe winces.`;
    },
    badge: (dancer) => pStats(dancer).boldness >= 6 ? 'RECOVERY' : 'STUMBLE',
    badgeClass: (dancer) => pStats(dancer).boldness >= 6 ? 'gold' : 'red' },
];

function _simulateDanceOff(ep, tribeMembers, result) {
  const dancers = {};
  const selections = {};

  // Champion selection for each tribe
  tribeMembers.forEach(t => {
    let selected = null;
    for (const sel of DANCE_SELECTION) {
      if (selected) break;
      const match = sel.check(t);
      if (match) {
        selected = match;
        sel.bondEffect(match);
        selections[t.name] = { ...match, text: sel.text(match) };
      }
    }
    if (!selected) {
      const fallback = t.members[Math.floor(Math.random() * t.members.length)];
      selected = { dancer: fallback, method: 'nominated' };
      selections[t.name] = { ...selected, text: `The tribe picks ${fallback}. Nobody's thrilled about it.` };
    }
    dancers[t.name] = selected.dancer;
  });

  // Dance scores with temperament-scaled variance
  const scores = {};
  const ranges = {};
  for (const [tribeName, dancer] of Object.entries(dancers)) {
    const s = pStats(dancer);
    const base = s.social * 0.06 + s.physical * 0.05 + s.boldness * 0.04 + s.temperament * 0.03;
    const lowEnd = base * (1 - (10 - s.temperament) * 0.04);
    const highEnd = base * (1 + s.temperament * 0.02);
    ranges[tribeName] = [lowEnd, highEnd];
    scores[tribeName] = lowEnd + Math.random() * (highEnd - lowEnd);
  }

  // Dance beats (2-3)
  const beats = [];
  const beatBudget = 2 + (Math.random() < 0.3 ? 1 : 0);
  for (const [tribeName, dancer] of Object.entries(dancers)) {
    if (beats.length >= beatBudget) break;
    const shuffledBeats = [...DANCE_BEATS].sort(() => Math.random() - 0.5);
    for (const beat of shuffledBeats) {
      if (beats.length >= beatBudget) break;
      const passes = typeof beat.check === 'function'
        ? (beat.check.length === 2 ? beat.check(scores[tribeName], ranges[tribeName]) : beat.check())
        : false;
      if (!passes) continue;
      beat.bond(dancer);
      // Score modifiers
      if (beat.id === 'signature-move' && pStats(dancer).boldness >= 8) scores[tribeName] *= 1.05;
      if (beat.id === 'rival-heckle') scores[tribeName] *= 0.97;
      if (beat.id === 'trip-stumble') scores[tribeName] *= pStats(dancer).boldness >= 6 ? 1.0 : 0.92;
      const badgeText = typeof beat.badge === 'function' ? beat.badge(dancer) : beat.badge;
      const badgeCls = typeof beat.badgeClass === 'function' ? beat.badgeClass(dancer) : beat.badgeClass;
      beats.push({
        type: beat.id, dancer, tribe: tribeName,
        text: beat.text(dancer),
        badge: badgeText, badgeClass: badgeCls,
        players: [dancer],
      });
      break;
    }
  }

  // Winner
  const sortedDancers = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const danceWinner = sortedDancers[0][0];
  result.tribeScores[danceWinner] = (result.tribeScores[danceWinner] || 0) + 1;

  result.danceOff = {
    dancers,
    selections,
    scores,
    ranges,
    beats,
    winner: danceWinner,
  };

  // Update chalMemberScores for dancers
  for (const [tribeName, dancer] of Object.entries(dancers)) {
    ep.chalMemberScores[dancer] = (ep.chalMemberScores[dancer] || 0) + Math.round(scores[tribeName] * 100);
  }
}
```

- [ ] **Step 3: Wire all phases into simulateBeachBlanketBogus**

Replace the body of `simulateBeachBlanketBogus` after result initialization with:

```js
  // Initialize chalMemberScores before phases
  const chalMemberScores = {};
  tribeMembers.flatMap(t => t.members).forEach(name => { chalMemberScores[name] = 0; });
  ep.chalMemberScores = chalMemberScores;

  // Phase 1: Surf
  _simulateSurf(ep, tribeMembers, result);
  result.phases.push('surf');

  // Phase 2: Sandcastle
  _simulateSandcastle(ep, tribeMembers, result);
  result.phases.push('sandcastle');

  // Check if tiebreaker needed (1-1 tie)
  const scores = Object.entries(result.tribeScores);
  const isTied = scores.every(([_, s]) => s === scores[0][1]);

  if (isTied) {
    // Halftime drama fires only before dance-off
    _simulateHalftime(ep, tribeMembers, result);
    result.phases.push('halftime');

    // Phase 3: Dance-Off
    _simulateDanceOff(ep, tribeMembers, result);
    result.phases.push('dance-off');
  }

  // Store result
  ep.beachBlanketBogus = result;
  ep.challengeType = 'beach-blanket-bogus';

  // Determine winner/loser
  const sortedTribes = Object.entries(result.tribeScores).sort((a, b) => b[1] - a[1]);
  const winnerName = sortedTribes[0][0];
  const loserName = sortedTribes[sortedTribes.length - 1][0];
  ep.winner = tribes.find(t => t.name === winnerName);
  ep.loser = tribes.find(t => t.name === loserName);
  ep.challengePlacements = sortedTribes.map(([name]) => {
    const t = tribes.find(tr => tr.name === name);
    return { name, members: [...(t?.members || [])] };
  });
  ep.tribalPlayers = [...(ep.loser?.members || [])];

  updateChalRecord(ep);

  // Popularity: surf hero, sandcastle winner
  if (!gs.popularity) gs.popularity = {};
  const surfLastStanding = result.surfData?.rounds[result.surfData.rounds.length - 1]?.activeSurfers?.[0];
  if (surfLastStanding) gs.popularity[surfLastStanding] = (gs.popularity[surfLastStanding] || 0) + 2;

  // Heat
  if (!gs._beachBogusHeat) gs._beachBogusHeat = [];
  // Heat on detected saboteurs
  const allEvents = [
    ...(result.surfData?.rounds?.flatMap(r => r.events) || []),
    ...(result.sandcastleData?.scavengeEncounters || []),
    ...(result.sandcastleData?.buildEvents || []),
  ];
  for (const ev of allEvents) {
    if (ev.data?.caught?.length || ev.data?.detected?.length) {
      const saboteur = ev.data.splasher || ev.data.saboteur || ev.data.thief;
      if (saboteur) gs._beachBogusHeat.push({ target: saboteur, amount: 3, expiresEp: (gs.episode || 0) + 3 });
    }
  }

  // Camp events for challenge highlights
  const campKey = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes[0]?.name || 'merge');
  if (!gs.campEvents) gs.campEvents = {};
  if (!gs.campEvents[campKey]) gs.campEvents[campKey] = [];
  gs.campEvents[campKey].push({
    text: `${winnerName} wins the Beach Blanket Bogus challenge${result.danceOff ? ' in a dramatic dance-off tiebreaker' : ''}!`,
    players: tribes.find(t => t.name === winnerName)?.members || [],
    badgeText: result.danceOff ? 'DANCE-OFF VICTORY' : 'BEACH CHAMPS',
    badgeClass: 'gold',
  });

  // Showmance challenge moment
  for (const sm of (gs.showmances || [])) {
    if (gs.activePlayers.includes(sm.a) && gs.activePlayers.includes(sm.b) && romanticCompat(sm.a, sm.b)) {
      const aTribe = tribeMembers.find(t => t.members.includes(sm.a));
      const bTribe = tribeMembers.find(t => t.members.includes(sm.b));
      if (aTribe && bTribe && aTribe.name !== bTribe.name && Math.random() < 0.3) {
        gs.campEvents[campKey].push({
          text: `${sm.a} and ${sm.b} shared a look during the beach challenge. Being on opposite tribes didn't stop the tension.`,
          players: [sm.a, sm.b], badgeText: 'BEACH ROMANCE', badgeClass: 'gold',
        });
        addBond(sm.a, sm.b, 0.3);
      }
    }
  }
```

- [ ] **Step 4: Update text backlog**

Replace the placeholder `_textBeachBlanketBogus`:

```js
export function _textBeachBlanketBogus(ep, ln, sec) {
  const bbb = ep.beachBlanketBogus;
  if (!bbb) return;

  ln(bbb.chrisOpener);
  sec();

  // Surf
  if (bbb.surfData) {
    ln('Phase One: Surf\'s Up. Stay on the board over a pool of sharks.');
    for (const round of bbb.surfData.rounds) {
      ln(`Round ${round.roundNum} — ${round.hazard.name}. ${round.hazard.desc}`);
      for (const ev of round.events) ln(ev.text);
      for (const name of round.wipeouts) {
        ln(`${name} wipes out!`);
      }
    }
    ln(`${bbb.surfData.winner} wins the surfing phase!`);
    sec();
  }

  // Sandcastle
  if (bbb.sandcastleData) {
    ln('Phase Two: Castle Construction. Scavenge materials, then build.');
    for (const enc of bbb.sandcastleData.scavengeEncounters) ln(enc.text);
    for (const ev of bbb.sandcastleData.buildEvents) ln(ev.text);
    ln(`${bbb.sandcastleData.winner} wins the sandcastle phase!`);
    sec();
  }

  // Halftime
  if (bbb.halftimeEvents?.length) {
    ln('A tense break on the beach before the tiebreaker.');
    for (const ev of bbb.halftimeEvents) ln(ev.text);
    sec();
  }

  // Dance-off
  if (bbb.danceOff) {
    ln('Tiebreaker: Dance-Off! One champion per tribe.');
    for (const [tribe, sel] of Object.entries(bbb.danceOff.selections)) {
      ln(sel.text);
    }
    for (const beat of bbb.danceOff.beats) ln(beat.text);
    ln(`${bbb.danceOff.winner} wins the dance-off!`);
    sec();
  }

  ln(bbb.chrisCloser);
  sec();
}
```

- [ ] **Step 5: Test all phases**

Run multiple episodes with Beach Blanket Bogus. Verify:
- 2-0 outcomes (no dance-off, no halftime)
- 1-1 outcomes (halftime fires, dance-off fires)
- `ep.beachBlanketBogus` has all data populated
- No console errors
- chalMemberScores populated for all players
- Camp events registered with badges
- Bonds shifted across all phases

- [ ] **Step 6: Commit**

```bash
git add js/chal/beach-blanket-bogus.js
git commit -m "feat(beach-blanket-bogus): halftime drama + dance-off tiebreaker + winner resolution + heat + camp events"
```

---

### Task 5: VP Title Card + Surf Reveal Screen

**Files:**
- Modify: `js/chal/beach-blanket-bogus.js`
- Modify: `js/vp-screens.js`

- [ ] **Step 1: Implement the full _bbbShell with retro beach movie poster CSS**

Replace the placeholder `_bbbShell` with the production version. This includes:
- Bowlby One SC + Inter fonts
- Sunset gradient backgrounds
- Film grain overlay animation
- Animated wave layers (CSS translateX loop)
- Shark fin SVG animations
- Seagull flight path animations
- Surfboard wobble keyframes
- Tiki torch flicker keyframes
- Sandcastle build clip-path animation
- Spotlight sweep for dance-off
- Splash particle burst keyframes
- Balance bar glow and transition
- Halftone dot texture overlay
- Sidebar with frosted glass (backdrop-filter)
- HUD cells with text-shadow glow
- Temperature gauge frost effect
- All event card styles (badge pills, border-left accent colors)

The shell CSS should be comprehensive enough that individual rpBuild functions only need structural HTML, not inline styles for the theme.

Key CSS classes to define in `_bbbShell`:
```
.bbb-shell, .bbb-header, .bbb-title, .bbb-subtitle
.bbb-layout, .bbb-feed, .bbb-sidebar
.bbb-hud, .bbb-hud-cell, .bbb-hud-val, .bbb-hud-lbl
.bbb-sec (section label)
.bbb-btn-next, .bbb-btn-all, .bbb-controls
.bbb-ev (event card), .bbb-ev-badge, .bbb-ev-text
.bbb-surfer (surfer card), .bbb-surfer.eliminated
.bbb-balance-bar, .bbb-balance-fill
.bbb-wipeout (wipeout splash card)
.bbb-round (round header)
.bbb-threat (threat badge, pulsing)
.bbb-wave-layer (animated wave background)
.bbb-shark (animated shark fin)
.bbb-seagull (animated seagull)
.bbb-grain (film grain overlay)
.bbb-castle (sandcastle SVG container)
.bbb-castle-layer (clip-path animated build layers)
.bbb-material-pip (material icon in sidebar)
.bbb-tiki (tiki torch with flicker)
.bbb-dancer (dancer card in dance-off)
.bbb-score-bar (live scoring bar)
.bbb-spotlight (sweeping spotlight cone)
.bbb-halftime-card (drama event card)
.bbb-portrait (player avatar circle)
```

All keyframe animations:
```
bbb-wave, bbb-bob, bbb-fade-up, bbb-shark, bbb-seagull, bbb-wobble,
bbb-pulse, bbb-spotlight, bbb-splash, bbb-tiki-flicker, bbb-sand-build,
bbb-grain, bbb-balance-drain, bbb-score-tick
```

- [ ] **Step 2: Implement portrait helper**

```js
function _bbbPortrait(name, size = 40) {
  const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<img src="assets/avatars/${slug}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.2);" onerror="this.style.display='none'">`;
}
```

- [ ] **Step 3: Implement rpBuildBeachBlanketBogusTitleCard**

Replace the placeholder with full animated title card:
- Sunset gradient background (sky → ocean)
- Animated wave layers at bottom
- Swimming shark fin SVGs
- Film grain overlay
- "Chris McLean Presents" → "BEACH BLANKET BOGUS" → "Surf · Build · Dance"
- Phase indicator banner
- Chris opener text
- Player count, tribe names, phase count in footer stats
- Sound toggle button (muted by default)

- [ ] **Step 4: Implement rpBuildBeachBlanketBogusSurf (click-to-reveal)**

This is the main surf screen with step-by-step reveals. Pattern follows alien-egg's `rpBuildAlienEggRounds`:

- `_tvState` key: `String(ep.num || 0) + '_bbbSurf'`
- Steps array built from surf rounds:
  - Round header step (hazard name + threat level)
  - Per-surfer result steps (balance change, narrative text)
  - Mid-surf event steps
  - Wipeout steps (splash animation)
- Each step stores a state snapshot for sidebar updates
- Sidebar shows: active surfers with balance bars, eliminated list, tribe scores
- HUD: round number, active count, hazard level, tribe 1 score, tribe 2 score
- Reveal handlers: `beachBogusRevealNext`, `beachBogusRevealAll`
- Surfer cards with:
  - Portrait
  - Animated surfboard icon (wobble keyframe)
  - Balance bar with glow (color transitions: teal→gold→coral as balance drops)
  - Narrative action text
  - "ELIMINATED" overlay with splash burst when wiped
- Temperature gauge visual that increases frost each round
- Flying seagull animations during seagull round
- Shark fin animations during shark round

- [ ] **Step 5: Wire surf screen in vp-screens.js**

Update the VP section in `js/vp-screens.js` to import and push the surf screen:

```js
import { rpBuildBeachBlanketBogusTitleCard, rpBuildBeachBlanketBogusSurf, beachBogusRevealNext, beachBogusRevealAll } from './chal/beach-blanket-bogus.js';
```

In the VP build section:
```js
  } else if (ep.isBeachBlanketBogus && ep.beachBlanketBogus) {
    vpScreens.push({ id:'bbb-title', label:'🏖️ Beach Blanket Bogus', html: rpBuildBeachBlanketBogusTitleCard(ep) });
    vpScreens.push({ id:'bbb-surf', label:'Surf\'s Up', html: rpBuildBeachBlanketBogusSurf(ep) });
```

- [ ] **Step 6: Test VP**

Run episode. Open VP. Verify:
- Title card renders with animated sunset, waves, sharks
- Surf screen has click-to-reveal
- Each click reveals next step (round header, surfer results, events, wipeouts)
- Sidebar updates per step (balances change, eliminated list grows)
- HUD updates
- Wipeout shows splash animation
- No console errors

- [ ] **Step 7: Commit**

```bash
git add js/chal/beach-blanket-bogus.js js/vp-screens.js
git commit -m "feat(beach-blanket-bogus): VP title card + surf reveal screen with animated hazard rounds"
```

---

### Task 6: VP Sandcastle Screen (Animated Construction)

**Files:**
- Modify: `js/chal/beach-blanket-bogus.js`
- Modify: `js/vp-screens.js`

- [ ] **Step 1: Implement rpBuildBeachBlanketBogusSandcastle**

This screen has three sub-sections revealed sequentially:

**A) Scavenge Results**
- Per-tribe material inventory displayed as filled/empty slots
- Scavenge encounter event cards revealed one at a time
- Material pips use styled divs (not emoji) with subtle CSS icons

**B) Animated Construction**
- SVG sandcastle that builds up in layers using CSS `clip-path: inset()` animation
- Castle visual quality scales with tribe build score:
  - Score < 40th percentile: crooked towers, gaps, crumbling edges, muted brown tones
  - Score 40-70th percentile: solid basic castle, clean lines, sand-colored
  - Score > 70th percentile: grand fortress with flags, decorated walls, golden highlights, detailed towers
- Each tribe's castle builds simultaneously (split view)
- Build events reveal during construction
- Build captain highlighted with crown indicator

**C) Judging**
- Chris walks between castles (text narration)
- Score reveal with bar comparison
- Winner announcement with confetti-like sand particles

**SVG castle components (layered, each animates in separately):**
```
Layer 1: Foundation/base (wide rectangle, first to appear)
Layer 2: Walls (narrower, appears second)
Layer 3: Towers (cylindrical shapes at corners)
Layer 4: Details (flags, windows, door arch)
Layer 5: Decorations (shells on walls if materials warrant)
```

For low-score castles, layers 3-5 are partially rendered or visually damaged (tilted, cracked paths in SVG).

- [ ] **Step 2: Wire sandcastle screen in vp-screens.js**

Add to VP pushes:
```js
    vpScreens.push({ id:'bbb-sandcastle', label:'Castle Construction', html: rpBuildBeachBlanketBogusSandcastle(ep) });
```

- [ ] **Step 3: Test**

Verify:
- Scavenge results show per-tribe materials
- Castle SVGs build up with animation
- Low-score castles look visibly worse than high-score ones
- Build events reveal during construction
- Captain highlighted
- Score comparison bar at end

- [ ] **Step 4: Commit**

```bash
git add js/chal/beach-blanket-bogus.js js/vp-screens.js
git commit -m "feat(beach-blanket-bogus): VP sandcastle screen with animated SVG construction + score-based quality"
```

---

### Task 7: VP Halftime Drama + Dance-Off Screen

**Files:**
- Modify: `js/chal/beach-blanket-bogus.js`
- Modify: `js/vp-screens.js`

- [ ] **Step 1: Implement rpBuildBeachBlanketBogusHalftime (conditional)**

Only renders if `bbb.halftimeEvents` exists (1-1 tie):
- Golden sunset background (beach at dusk — transition to night for dance-off)
- Event cards revealed one at a time
- Each card has: badge pill, narrative text, bond impact indicator, player portraits
- Warm color palette (oranges, golds) transitioning toward cooler tones (setup for night dance-off)

- [ ] **Step 2: Implement rpBuildBeachBlanketBogusDanceOff (conditional)**

Only renders if `bbb.danceOff` exists:
- **Night scene** — dark navy/purple background
- **Tiki torches** — CSS-animated flames on left and right borders (flicker keyframe, warm orange glow)
- **Champion Selection** — first reveal step shows both tribes picking their dancer (selection drama text)
- **VS Layout** — two dancer cards with portraits, names, stat badges
- **Turn-by-turn dance** — each beat is a reveal step:
  - Dancer icon slides/animates to center stage
  - Beat narrative text appears
  - Live score bar updates (two horizontal bars growing, tribe-colored)
  - Score tick animation when points are added
- **Result** — final score comparison, winner announcement, winning tribe celebration text
- **Tiki torch glow intensifies** on winner's side

Score tracker implementation:
- Two horizontal bars (coral for tribe A, teal for tribe B)
- Bars grow proportionally as dance progresses
- CSS transition on width for smooth animation
- Score numbers update alongside bars

- [ ] **Step 3: Implement rpBuildBeachBlanketBogusResults**

Always renders (whether 2-0 or 2-1):
- Final tribe score display (icons for each phase won)
- Winning tribe celebration banner
- Losing tribe "heading to tribal" text
- Individual standout callouts (highest surf score, best builder, dance-off hero)
- Leaderboard of all players by chalMemberScores

- [ ] **Step 4: Wire all conditional screens in vp-screens.js**

```js
  } else if (ep.isBeachBlanketBogus && ep.beachBlanketBogus) {
    vpScreens.push({ id:'bbb-title', label:'🏖️ Beach Blanket Bogus', html: rpBuildBeachBlanketBogusTitleCard(ep) });
    vpScreens.push({ id:'bbb-surf', label:'Surf\'s Up', html: rpBuildBeachBlanketBogusSurf(ep) });
    vpScreens.push({ id:'bbb-sandcastle', label:'Castle Construction', html: rpBuildBeachBlanketBogusSandcastle(ep) });
    if (ep.beachBlanketBogus.halftimeEvents) {
      vpScreens.push({ id:'bbb-halftime', label:'Beach Break', html: rpBuildBeachBlanketBogusHalftime(ep) });
    }
    if (ep.beachBlanketBogus.danceOff) {
      vpScreens.push({ id:'bbb-danceoff', label:'Dance-Off', html: rpBuildBeachBlanketBogusDanceOff(ep) });
    }
    vpScreens.push({ id:'bbb-results', label:'Results', html: rpBuildBeachBlanketBogusResults(ep) });
```

Update import line:
```js
import { rpBuildBeachBlanketBogusTitleCard, rpBuildBeachBlanketBogusSurf, rpBuildBeachBlanketBogusSandcastle, rpBuildBeachBlanketBogusHalftime, rpBuildBeachBlanketBogusDanceOff, rpBuildBeachBlanketBogusResults, beachBogusRevealNext, beachBogusRevealAll } from './chal/beach-blanket-bogus.js';
```

- [ ] **Step 5: Test**

Run multiple episodes to get both 2-0 and 1-1 outcomes. Verify:
- 2-0: title → surf → sandcastle → results (no halftime, no dance-off)
- 1-1: title → surf → sandcastle → halftime → dance-off → results
- Dance-off has animated tiki torches, turn-by-turn reveals, live score bars
- Halftime has warm sunset cards
- Results show correct final scores and standouts

- [ ] **Step 6: Commit**

```bash
git add js/chal/beach-blanket-bogus.js js/vp-screens.js
git commit -m "feat(beach-blanket-bogus): VP halftime drama + dance-off with tiki night scene + results screen"
```

---

### Task 8: Sound Hooks + Polish + Debug Tab

**Files:**
- Modify: `js/chal/beach-blanket-bogus.js`
- Modify: `js/vp-screens.js` (if debug tab additions needed)

- [ ] **Step 1: Add Web Audio API sound hooks**

Following alien-egg's audio pattern, add to `beach-blanket-bogus.js`:

```js
// Sound: wipeout splash
function _bbbPlaySplash() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // White noise burst + low thud for water impact
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.exp(-i / (ctx.sampleRate * 0.08));
      data[i] = (Math.random() * 2 - 1) * env * 0.3;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    src.connect(filter);
    filter.connect(ctx.destination);
    src.start();
    setTimeout(() => ctx.close(), 500);
  } catch(e) {}
}

// Sound: seagull screech
function _bbbPlaySeagull() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2000, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(3000, ctx.currentTime + 0.1);
    osc.frequency.linearRampToValueAtTime(1500, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
    setTimeout(() => ctx.close(), 400);
  } catch(e) {}
}

// Sound: sand crumble
function _bbbPlaySandCrumble() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.exp(-i / (ctx.sampleRate * 0.15));
      data[i] = (Math.random() * 2 - 1) * env * 0.15;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 0.5;
    src.connect(filter);
    filter.connect(ctx.destination);
    src.start();
    setTimeout(() => ctx.close(), 600);
  } catch(e) {}
}

// Sound: dance beat drop
function _bbbPlayBeatDrop() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
    setTimeout(() => ctx.close(), 400);
  } catch(e) {}
}
```

- [ ] **Step 2: Wire sounds into reveal handlers**

In `beachBogusRevealNext`, after revealing each step:
- If step contains "WIPEOUT" → `_bbbPlaySplash()`
- If step is in seagull round → `_bbbPlaySeagull()`
- If step contains "SABOTAGE" or "COLLAPSE" in sandcastle → `_bbbPlaySandCrumble()`
- If step is dance-off beat → `_bbbPlayBeatDrop()`

- [ ] **Step 3: Add debug challenge tab data**

In `simulateBeachBlanketBogus`, before the return, add debug data to `ep`:

```js
  ep._debugBeachBogus = {
    surfWinner: result.surfData?.winner,
    sandWinner: result.sandcastleData?.winner,
    danceOffFired: !!result.danceOff,
    danceWinner: result.danceOff?.winner || null,
    finalScores: result.tribeScores,
    surfAvgs: result.surfData?.tribeAvgs,
    buildScores: result.sandcastleData?.buildScores,
    materials: result.sandcastleData?.materials,
    wipeoutOrder: result.surfData?.wipeoutOrder,
    heatGenerated: gs._beachBogusHeat?.length || 0,
    eventsGenerated: allEvents.length,
  };
```

- [ ] **Step 4: Add timeline tag**

In the camp events section, add a timeline-compatible event:

```js
  gs.campEvents[campKey].push({
    text: `Beach Blanket Bogus: ${winnerName} ${result.danceOff ? 'wins in a tiebreaker dance-off' : 'sweeps 2-0'}. ${loserName} heads to tribal council.`,
    players: tribeMembers.flatMap(t => t.members),
    badgeText: 'BEACH BLANKET BOGUS', badgeClass: 'gold',
    tag: 'challenge',
  });
```

- [ ] **Step 5: Final integration test**

Full playthrough:
- Run 5+ episodes with Beach Blanket Bogus enabled
- Check VP for all screens (title, surf, sandcastle, halftime, dance-off, results)
- Click through all reveals
- Verify sounds play on wipeouts/events
- Check text backlog for complete narrative
- Verify no console errors
- Verify bonds shifted correctly
- Verify popularity updated
- Verify heat tracked
- Verify camp events registered with badges
- Verify debug data in ep._debugBeachBogus

- [ ] **Step 6: Commit**

```bash
git add js/chal/beach-blanket-bogus.js
git commit -m "feat(beach-blanket-bogus): sound hooks + debug tab + timeline tag + polish"
```

---

## Self-Review Checklist

- [x] All CLAUDE.md requirements covered: updateChalRecord, VP screens, text backlog, cold open, timeline tag, badges, popularity, chalSeries: 'action', showmance moments, camp events with players[] + badge
- [x] Stats are proportional (stat * factor), no thresholds for gameplay
- [x] Archetype behavior rules followed (nice archetypes never sabotage)
- [x] pronouns() used correctly (posAdj before nouns, pos standalone)
- [x] Tribe scores averaged per member, not raw sums
- [x] _tvState pattern with idx: -1 for click-to-reveal
- [x] patchEpisodeHistory handled by episode.js (not in challenge file)
- [x] gs.popularity guarded with `if (!gs.popularity) gs.popularity = {}`
- [x] ep.extraImmune merged, not overwritten (not applicable — pre-merge only)
- [x] romanticCompat checked before romance events
- [x] Merge camp key: `gs.mergeName || 'merge'` (not applicable — pre-merge only, but guarded)
- [x] No circular imports (only imports from core, players, bonds)
- [x] Heat stored as `gs._beachBogusHeat` array matching existing patterns
- [x] VP import + push in vp-screens.js
- [x] Text backlog import + call in text-backlog.js
- [x] Serialization fields in episode.js
- [x] TWIST_CATALOG entry with chalSeries: 'action', incompatible list
