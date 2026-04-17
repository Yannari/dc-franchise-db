# Trial by Tri-Armed Triathlon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a new post-merge challenge — Trial by Tri-Armed Triathlon. Three sub-challenges (Chowdown / Idol Haul / Totem Pole) run with handcuffed pairs + a wimp-key escape mechanic. Canonical "nobody-safe" outcome fires when all three pairs each win one sub-challenge. Summer-camp-tournament visual identity anchored by a handcuff-chain SVG between paired portraits.

**Architecture:** All challenge code in a new file `js/chal/tri-armed-triathlon.js`. Integration touches `js/episode.js`, `js/twists.js`, `js/main.js`, `js/vp-screens.js`, `js/text-backlog.js`. Per-pair state machine handles 3 phases with shared pair-banner visual across all three. No new reveal-engine architecture — reuses the click-to-reveal pattern proven in off-the-chain/wawanakwa-gone-wild.

**Tech Stack:** Vanilla ES modules, no build step. Verification: `node --check` + manual browser smoke test.

**Design spec:** `docs/superpowers/specs/2026-04-16-tri-armed-triathlon-design.md`

---

## Setup

Before starting:

1. Read the design spec end-to-end.
2. Confirm you can open `simulator.html` via a local HTTP server (`python -m http.server 8765` from repo root → `http://localhost:8765/simulator.html`).
3. Familiarize yourself with the existing challenge pattern by skimming `js/chal/wawanakwa-gone-wild.js` and `js/chal/off-the-chain.js` — the new file follows the same shape.

Reference files you'll touch:
- `js/chal/tri-armed-triathlon.js` (CREATE)
- `js/episode.js` (modify — import + route)
- `js/twists.js` (modify — register twist definition + engine route)
- `js/main.js` (modify — engine map)
- `js/vp-screens.js` (modify — rpBuild register)
- `js/text-backlog.js` (modify — text register)
- `js/savestate.js` (modify if needed — `patchEpisodeHistory`)

**Commit convention:** `feat(tri-armed): <description>` for features.

---

## Task 1: Create the challenge file scaffold

**Files:**
- Create: `js/chal/tri-armed-triathlon.js`

- [ ] **Step 1: Create the file with imports, constants, and exported stubs**

Write the entire file with this initial structure. Subsequent tasks fill in the stubs.

```js
// js/chal/tri-armed-triathlon.js — Trial by Tri-Armed Triathlon challenge
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// ══════════════════════════════════════════════════════════════
// CONSTANTS & POOLS
// ══════════════════════════════════════════════════════════════

const VILLAIN_ARCHETYPES = ['villain', 'mastermind', 'schemer'];
const NICE_ARCHETYPES = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];

function getArchetype(name) { return players.find(p => p.name === name)?.archetype || ''; }
function isVillainArch(name) { return VILLAIN_ARCHETYPES.includes(getArchetype(name)); }
function isNiceArch(name) { return NICE_ARCHETYPES.includes(getArchetype(name)); }
function neutralWouldScheme(name) { const s = pStats(name); return s.strategic >= 6 && s.loyalty <= 4; }

function _rp(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function _rand(lo, hi) { return lo + Math.random() * (hi - lo); }

function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}

// Text pools — populated in Task 11
const TA_CHRIS_INTROS = [];
const TA_PAIRING_FLAVOR = { villain_hero: [], rivals: [], showmance: [], strangers: [], default: [] };
const TA_CHOWDOWN_TEXTS = { roleArg: [], rhythm: [], cheatCaught: [], cheatSneaky: [], grossOut: [], smashFood: [], vomit: [] };
const TA_IDOL_TEXTS = { canoeArg: [], canoeNav: [], canoeWeight: [], canoeBond: [], findPackage: [], findCurse: [], piggyStumble: [], piggyHeart: [], piggyJoke: [], caveSpider: [], caveWooly: [], caveClutch: [] };
const TA_TOTEM_TEXTS = { badmouth: [], defend: [], confusion: [], carved: [], breakdown: [] };
const TA_CHRIS_QUIPS = [];
const TA_AFTERMATH_SINGLE: [];  // single-winner outcome aftermath
const TA_AFTERMATH_TRIPLE = []; // triple-tie outcome aftermath

// Reveal state (shared with off-the-chain / wawanakwa pattern)
const _tvState = {};

// ══════════════════════════════════════════════════════════════
// PAIRING — Task 2
// ══════════════════════════════════════════════════════════════

function _pairPlayers(activePlayers) {
  // TODO Task 2
  return { pairs: [], spectator: null };
}

function _computeWimpKeyDecision(pair, triState, offerIndex) {
  // TODO Task 2
  return false;
}

// ══════════════════════════════════════════════════════════════
// SUB-CHALLENGE 1: CHOWDOWN — Task 3
// ══════════════════════════════════════════════════════════════

function _runChowdown(triState, activePlayers, timeline) {
  // TODO Task 3
}

// ══════════════════════════════════════════════════════════════
// SUB-CHALLENGE 2: IDOL HAUL — Task 4
// ══════════════════════════════════════════════════════════════

function _runIdolHaul(triState, activePlayers, timeline) {
  // TODO Task 4
}

// ══════════════════════════════════════════════════════════════
// SUB-CHALLENGE 3: TOTEM POLE — Task 5
// ══════════════════════════════════════════════════════════════

function _runTotemPole(triState, activePlayers, timeline) {
  // TODO Task 5
}

// ══════════════════════════════════════════════════════════════
// SIMULATE (main entry point) — wired by Task 6
// ══════════════════════════════════════════════════════════════

export function simulateTriArmedTriathlon(ep) {
  const activePlayers = [...gs.activePlayers];
  const timeline = [];
  const badges = {};

  // Pair up + create triState
  const { pairs, spectator } = _pairPlayers(activePlayers);
  const triState = {
    pairs: pairs.map((p, i) => ({
      id: i, members: p, wimpKeyTaken: false,
      chowdownRate: 0, chowdownEvents: [], chowdownWon: false,
      idolHaulScore: 0, idolPhasesComplete: 0, idolWon: false,
      totemScore: 0, totemWon: false,
      totalWins: 0,
      bond: getBond(p[0], p[1]),
      archPair: _computeArchPair(p[0], p[1]),
    })),
    players: {},
    spectator,
  };
  activePlayers.forEach((name, idx) => {
    const pairId = pairs.findIndex(p => p.includes(name));
    triState.players[name] = {
      pair: pairId >= 0 ? pairs[pairId].find(n => n !== name) : null,
      pairId,
      wimpKeyTaken: false,
      chowdownRole: null,
      chowdownDone: false,
      idolPhaseReached: 'none',
      totemDone: false,
      personalScore: 0,
      mishapCount: 0,
      badges: [],
    };
  });

  // Chris intro
  timeline.push({ type: 'chrisIntro', text: _rp(TA_CHRIS_INTROS) || '"Welcome to the Tri-Armed Triathlon!" — Chris McLean' });

  // Pairing reveal
  triState.pairs.forEach((pair, i) => {
    timeline.push({
      type: 'pairingReveal', pairId: i, players: pair.members,
      text: _rp(TA_PAIRING_FLAVOR[pair.archPair] || TA_PAIRING_FLAVOR.default) || `Pair ${i + 1}: ${pair.members.join(' & ')}.`,
    });
    timeline.push({
      type: 'handcuffed', pairId: i, players: pair.members,
      bond: pair.bond,
      text: `${pair.members[0]} and ${pair.members[1]} are cuffed together. Bond: ${pair.bond >= 3 ? 'allies' : pair.bond <= -3 ? 'rivals' : 'uneasy'}.`,
    });
  });

  // Wimp key offer #1
  _offerWimpKey(triState, timeline, 0);

  // Sub-challenge 1: Chowdown
  _runChowdown(triState, activePlayers, timeline);

  // Wimp key offer #2
  _offerWimpKey(triState, timeline, 1);

  // Sub-challenge 2: Idol Haul
  _runIdolHaul(triState, activePlayers, timeline);

  // Wimp key offer #3
  _offerWimpKey(triState, timeline, 2);

  // Sub-challenge 3: Totem Pole
  _runTotemPole(triState, activePlayers, timeline);

  // Final scoring
  triState.pairs.forEach(p => {
    p.totalWins = (p.chowdownWon ? 1 : 0) + (p.idolWon ? 1 : 0) + (p.totemWon ? 1 : 0);
  });
  const eligible = triState.pairs.filter(p => !p.wimpKeyTaken);
  const maxWins = Math.max(0, ...eligible.map(p => p.totalWins));
  const topPairs = eligible.filter(p => p.totalWins === maxWins);
  const tripleTie = eligible.length >= 3 && eligible.every(p => p.totalWins === 1);
  const winnerPair = (tripleTie || topPairs.length > 1 || maxWins === 0) ? null : topPairs[0];
  const immune = winnerPair ? winnerPair.members : [];

  timeline.push({
    type: 'finalScoreReveal',
    pairs: triState.pairs.map(p => ({ id: p.id, members: p.members, wins: p.totalWins, wimpKeyTaken: p.wimpKeyTaken, details: { chowdown: p.chowdownWon, idol: p.idolWon, totem: p.totemWon } })),
    winnerPair: winnerPair ? winnerPair.id : null,
    immune,
    tripleTie,
  });

  // Popularity/bond effects post-challenge
  immune.forEach(n => popDelta(n, 2));

  // Badges
  immune.forEach(n => { badges[n] = 'triArmedWinner'; });
  if (tripleTie) activePlayers.forEach(n => { badges[n] = 'triArmedNoImmune'; });

  // Persist to ep
  ep.triArmedTriathlon = {
    timeline,
    pairs: triState.pairs,
    spectator,
    winnerPair: winnerPair ? winnerPair.id : null,
    immune,
    tripleTie,
    badges,
  };

  // Chal record update (memberScores: points by participation)
  ep.chalMemberScores = {};
  triState.pairs.forEach(p => {
    const score = p.totalWins * 10 - (p.wimpKeyTaken ? 20 : 0);
    p.members.forEach(n => { ep.chalMemberScores[n] = score; });
  });
  if (spectator) ep.chalMemberScores[spectator] = 0;
  updateChalRecord(ep);

  return ep.triArmedTriathlon;
}

function _offerWimpKey(triState, timeline, offerIndex) {
  const decisions = [];
  triState.pairs.forEach(pair => {
    if (pair.wimpKeyTaken) return; // already out
    const takes = _computeWimpKeyDecision(pair, triState, offerIndex);
    decisions.push({ pairId: pair.id, members: pair.members, taken: takes });
    if (takes) {
      pair.wimpKeyTaken = true;
      triState.players[pair.members[0]].wimpKeyTaken = true;
      triState.players[pair.members[1]].wimpKeyTaken = true;
      pair.members.forEach(n => popDelta(n, -2));
    }
  });
  timeline.push({ type: 'wimpKeyOffer', offerIndex, decisions });
  decisions.filter(d => d.taken).forEach(d => {
    timeline.push({ type: 'wimpKeyTaken', pairId: d.pairId, players: d.members, text: `${d.members[0]} and ${d.members[1]} take the key. Handcuffs off. They're out of the running.` });
  });
}

function _computeArchPair(a, b) {
  const av = isVillainArch(a), bv = isVillainArch(b);
  const an = isNiceArch(a), bn = isNiceArch(b);
  if ((av && bn) || (bn && av)) return 'villain_hero';
  const bond = getBond(a, b);
  if (bond <= -3) return 'rivals';
  const showmance = (gs.showmances || []).find(s => s.phase !== 'broken-up' && s.players.every(p => [a, b].includes(p)));
  if (showmance) return 'showmance';
  if (bond <= 1) return 'strangers';
  return 'default';
}

// ══════════════════════════════════════════════════════════════
// REVEAL ENGINE — Task 8
// ══════════════════════════════════════════════════════════════

function _trReveal(stateKey, totalSteps) {
  // TODO Task 8
}

function _trRevealAll(stateKey, totalSteps) {
  // TODO Task 8
}

// ══════════════════════════════════════════════════════════════
// VP BUILD — Task 8
// ══════════════════════════════════════════════════════════════

const TA_STYLES = ``; // TODO Task 7

export function rpBuildTriArmedTriathlon(ep) {
  // TODO Task 8
  return '';
}

// ══════════════════════════════════════════════════════════════
// TEXT BACKLOG — Task 11
// ══════════════════════════════════════════════════════════════

export function _textTriArmedTriathlon(ep, ln, sec) {
  // TODO Task 11
}
```

Note the typo fix: the scaffold has `const TA_AFTERMATH_SINGLE: [];` which is invalid JavaScript (that's object-literal syntax). Change to `const TA_AFTERMATH_SINGLE = [];` when you paste. Same for `TA_AFTERMATH_TRIPLE` below it if needed.

- [ ] **Step 2: Validate parse**

```bash
node --check js/chal/tri-armed-triathlon.js
```

Must exit 0. Fix any typos surfaced.

- [ ] **Step 3: Commit**

```bash
git add js/chal/tri-armed-triathlon.js
git commit -m "feat(tri-armed): scaffold challenge file with imports + stubs"
```

---

## Task 2: Pairing logic + wimp-key logic

**Files:**
- Modify: `js/chal/tri-armed-triathlon.js` — fill in `_pairPlayers` and `_computeWimpKeyDecision`.

- [ ] **Step 1: Implement `_pairPlayers`**

Replace the stub with:

```js
function _pairPlayers(activePlayers) {
  const n = activePlayers.length;
  if (n < 4) return { pairs: [], spectator: null };

  // Shuffle + optional bias
  const biased = (seasonConfig?.triArmedDramaBias !== false); // default on
  let shuffled = [...activePlayers];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  if (biased) {
    // Sort so players with extreme bonds land next to each other
    // Heuristic: sort by the sum of absolute bonds with others (high-drama first)
    shuffled.sort((a, b) => {
      const dA = activePlayers.reduce((s, p) => p === a ? s : s + Math.abs(getBond(a, p)), 0);
      const dB = activePlayers.reduce((s, p) => p === b ? s : s + Math.abs(getBond(b, p)), 0);
      return dB - dA;
    });
  }

  // Force showmances together if possible (before pairing)
  const showmances = (gs.showmances || []).filter(s => s.phase !== 'broken-up');
  showmances.forEach(s => {
    const [a, b] = s.players;
    if (!shuffled.includes(a) || !shuffled.includes(b)) return;
    // Move a and b to be adjacent at the front of the list
    shuffled = shuffled.filter(p => p !== a && p !== b);
    shuffled.unshift(a, b);
  });

  // Handle odd player count — pick a random spectator
  let spectator = null;
  if (shuffled.length % 2 !== 0) {
    spectator = shuffled.pop();
  }

  // Pair consecutively
  const pairs = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    pairs.push([shuffled[i], shuffled[i + 1]]);
  }

  return { pairs, spectator };
}
```

- [ ] **Step 2: Implement `_computeWimpKeyDecision`**

```js
function _computeWimpKeyDecision(pair, triState, offerIndex) {
  const [a, b] = pair.members;
  const bond = pair.bond;
  const aInclination = _inclinationToTakeKey(a, pair, triState, offerIndex, bond);
  const bInclination = _inclinationToTakeKey(b, pair, triState, offerIndex, bond);
  return aInclination >= 0.50 && bInclination >= 0.50;
}

function _inclinationToTakeKey(name, pair, triState, offerIndex, bond) {
  const s = pStats(name);
  const arch = getArchetype(name);
  let incl = 0.05;
  if (bond < -2) incl += 0.15;
  if (s.boldness < 3) incl += 0.10;
  const memberMishaps = pair.members.reduce((sum, n) => sum + (triState.players[n]?.mishapCount || 0), 0);
  if (memberMishaps >= 2) incl += 0.20;
  if (VILLAIN_ARCHETYPES.includes(arch)) incl -= 0.10;
  if (NICE_ARCHETYPES.includes(arch)) incl -= 0.10;
  if (offerIndex === 0) incl -= 0.05; // no one takes it on offer 1 except in extreme cases
  return incl;
}
```

- [ ] **Step 3: Validate + commit**

```bash
node --check js/chal/tri-armed-triathlon.js
git add js/chal/tri-armed-triathlon.js
git commit -m "feat(tri-armed): pairing logic + wimp-key decision algorithm"
```

---

## Task 3: Chowdown simulation

**Files:**
- Modify: `js/chal/tri-armed-triathlon.js` — fill in `_runChowdown`.

- [ ] **Step 1: Implement `_runChowdown`**

```js
function _runChowdown(triState, activePlayers, timeline) {
  const activePairs = triState.pairs.filter(p => !p.wimpKeyTaken);
  if (!activePairs.length) return;

  timeline.push({
    type: 'chowdownSetup',
    text: `Chris unveils three platters of mystery meat. The green chicken twitches once. Nobody mentions it.`,
  });

  // Role assignment per pair
  activePairs.forEach(pair => {
    const [a, b] = pair.members;
    const sA = pStats(a);
    const sB = pStats(b);
    // Prefer high endurance + low mental as eater; prefer high strategic as feeder
    const aEaterScore = sA.endurance * 1.2 + sA.boldness - sA.mental * 0.5 + _rand(-2, 2);
    const bEaterScore = sB.endurance * 1.2 + sB.boldness - sB.mental * 0.5 + _rand(-2, 2);
    const eater = aEaterScore >= bEaterScore ? a : b;
    const feeder = eater === a ? b : a;
    triState.players[eater].chowdownRole = 'eater';
    triState.players[feeder].chowdownRole = 'feeder';

    // Optional role arg — pair-archetype-based
    if (Math.random() < 0.45) {
      timeline.push({
        type: 'chowdownEvent',
        subtype: 'roleArg',
        pairId: pair.id,
        players: [feeder, eater],
        text: _rp(TA_CHOWDOWN_TEXTS.roleArg) || `${feeder} and ${eater} argue about who has to eat this.`,
      });
      addBond(a, b, -1);
    }

    // Mid-challenge events (2-4 per pair)
    const eventCount = 2 + Math.floor(Math.random() * 3);
    let rate = pStats(feeder).physical + pStats(feeder).strategic + pStats(eater).endurance - pStats(eater).mental * 0.5 + _rand(-3, 3);
    for (let e = 0; e < eventCount; e++) {
      const evt = _fireChowdownEvent(pair, feeder, eater, triState);
      if (!evt) continue;
      timeline.push(evt);
      rate += evt._rateDelta || 0;
      if (evt.subtype === 'vomit' || evt.subtype === 'grossOut') {
        triState.players[eater].mishapCount++;
      }
    }
    pair.chowdownRate = rate;
    pair.chowdownEvents = activePairs.indexOf(pair); // sequence index only
  });

  // Determine winner
  const winner = activePairs.reduce((best, p) => p.chowdownRate > best.chowdownRate ? p : best, activePairs[0]);
  winner.chowdownWon = true;
  winner.members.forEach(n => popDelta(n, 1));
  timeline.push({
    type: 'chowdownWin',
    pairId: winner.id,
    players: winner.members,
    text: `${winner.members[0]} and ${winner.members[1]} finish the platter first. Challenge 1 to them.`,
  });
}

function _fireChowdownEvent(pair, feeder, eater, triState) {
  const fA = getArchetype(feeder);
  const eA = getArchetype(eater);
  const pool = [];

  pool.push({ subtype: 'rhythm', weight: 2 });
  pool.push({ subtype: 'grossOut', weight: 2 });
  if (VILLAIN_ARCHETYPES.includes(fA) || (pStats(feeder).strategic >= 6 && pStats(feeder).loyalty <= 4)) {
    pool.push({ subtype: 'cheat', weight: 1.5 });
  }
  if (pStats(feeder).boldness >= 6) {
    pool.push({ subtype: 'smashFood', weight: 1 });
  }
  if (pStats(eater).endurance < 4 || pStats(eater).mental < 4) {
    pool.push({ subtype: 'vomit', weight: 1 });
  }

  const total = pool.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  let pick;
  for (const p of pool) { r -= p.weight; if (r <= 0) { pick = p; break; } }
  if (!pick) return null;

  const s = pick.subtype;
  let text = '';
  let rateDelta = 0;
  const pool_key = { rhythm: 'rhythm', grossOut: 'grossOut', smashFood: 'smashFood', vomit: 'vomit', cheat: 'cheatSneaky' }[s];

  if (s === 'rhythm') { text = _rp(TA_CHOWDOWN_TEXTS.rhythm) || `${feeder} finds the rhythm. ${eater} keeps up.`; rateDelta = 2; addBond(feeder, eater, 1); }
  else if (s === 'grossOut') { text = _rp(TA_CHOWDOWN_TEXTS.grossOut) || `${eater} gags on the green chicken.`; rateDelta = -2; }
  else if (s === 'cheat') {
    // Caught or not?
    const caught = Math.random() < 0.35;
    if (caught) { text = _rp(TA_CHOWDOWN_TEXTS.cheatCaught) || `${feeder} uses both arms. Chris catches it. "DISQUALIFIED ONE SPOON."`; rateDelta = -3; popDelta(feeder, -1); }
    else { text = _rp(TA_CHOWDOWN_TEXTS.cheatSneaky) || `${feeder} quietly uses both arms. Nobody sees.`; rateDelta = 3; }
  }
  else if (s === 'smashFood') { text = _rp(TA_CHOWDOWN_TEXTS.smashFood) || `${feeder} smashes the whole platter into ${eater}'s face. It counts.`; rateDelta = 4; popDelta(feeder, 1); }
  else if (s === 'vomit') { text = _rp(TA_CHOWDOWN_TEXTS.vomit) || `${eater} vomits into the platter. The run is over.`; rateDelta = -5; popDelta(eater, -1); }

  return {
    type: 'chowdownEvent',
    subtype: s,
    pairId: pair.id,
    players: [feeder, eater],
    text,
    _rateDelta: rateDelta,
    badgeText: s === 'cheat' ? 'CHEAT' : s === 'smashFood' ? 'CLUTCH' : s === 'vomit' ? 'VOMIT' : s === 'grossOut' ? 'GROSS' : 'RHYTHM',
    badgeClass: s === 'rhythm' || s === 'smashFood' ? 'green' : 'red',
  };
}
```

- [ ] **Step 2: Validate + commit**

```bash
node --check js/chal/tri-armed-triathlon.js
git add js/chal/tri-armed-triathlon.js
git commit -m "feat(tri-armed): chowdown sub-challenge simulation"
```

---

## Task 4: Idol Haul simulation

**Files:**
- Modify: `js/chal/tri-armed-triathlon.js` — fill in `_runIdolHaul`.

- [ ] **Step 1: Implement `_runIdolHaul`**

```js
function _runIdolHaul(triState, activePlayers, timeline) {
  const activePairs = triState.pairs.filter(p => !p.wimpKeyTaken);
  if (!activePairs.length) return;

  timeline.push({
    type: 'chrisQuip',
    text: `"Paddle out to Boney Island. Bring back the cursed idol. First pair to the Cave of Treacherous Terror wins." — Chris McLean`,
  });

  activePairs.forEach(pair => {
    let score = 0;

    // Phase 1: Canoe
    score += _runIdolPhase(pair, 'canoe', triState, timeline);

    // Phase 2: Find idol
    score += _runIdolPhase(pair, 'find', triState, timeline);

    // Phase 3: Piggyback
    score += _runIdolPhase(pair, 'piggyback', triState, timeline);

    // Phase 4: Cave
    score += _runIdolPhase(pair, 'cave', triState, timeline);

    pair.idolHaulScore = score;
    pair.idolPhasesComplete = 4;
  });

  // Winner
  const winner = activePairs.reduce((best, p) => p.idolHaulScore > best.idolHaulScore ? p : best, activePairs[0]);
  winner.idolWon = true;
  winner.members.forEach(n => popDelta(n, 1));
  timeline.push({
    type: 'idolWin',
    pairId: winner.id,
    players: winner.members,
    text: `${winner.members[0]} and ${winner.members[1]} drop the idol into the cave. Challenge 2 is theirs.`,
  });
}

function _runIdolPhase(pair, phase, triState, timeline) {
  const [a, b] = pair.members;
  const sA = pStats(a);
  const sB = pStats(b);
  let phaseScore = 0;

  // Pick 1-2 events per phase
  const evtCount = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < evtCount; i++) {
    const evt = _fireIdolEvent(pair, phase, triState);
    if (!evt) continue;
    timeline.push(evt);
    phaseScore += evt._scoreDelta || 0;
    if (evt.subtype && evt.subtype.includes('mishap')) {
      triState.players[a].mishapCount++;
      triState.players[b].mishapCount++;
    }
  }

  // Base phase roll (stat-driven)
  const baseRoll = (sA.physical + sA.endurance + sB.physical + sB.endurance) / 4 + _rand(-2, 2);
  phaseScore += baseRoll;

  if (phase === 'cave') {
    // Spider panic + wooly beaver gate — boldness check
    if ((sA.boldness + sB.boldness) / 2 < 5 && Math.random() < 0.4) {
      phaseScore -= 5;
      timeline.push({
        type: 'idolCaveEvent',
        subtype: 'panic',
        pairId: pair.id,
        players: [a, b],
        text: `${a} and ${b} bolt from the cave entrance. They'll have to try again. Time lost.`,
        badgeText: 'PANIC',
        badgeClass: 'red',
      });
    } else {
      // Clutch throw
      if (Math.random() < 0.25) {
        phaseScore += 6;
        timeline.push({
          type: 'idolCaveEvent',
          subtype: 'clutch',
          pairId: pair.id,
          players: [a, b],
          text: _rp(TA_IDOL_TEXTS.caveClutch) || `${a} winds up and hurls the idol piece from ten feet out. It sails into the cave mouth. Done.`,
          badgeText: 'CLUTCH',
          badgeClass: 'green',
        });
      }
    }
  }

  return phaseScore;
}

function _fireIdolEvent(pair, phase, triState) {
  const [a, b] = pair.members;
  const bond = getBond(a, b);

  const subtypePool = {
    canoe: ['argue', 'nav', 'weight', 'bond'],
    find: ['package', 'curse'],
    piggyback: ['stumble', 'heart', 'joke'],
    cave: ['spider', 'wooly'],
  };
  const pool = subtypePool[phase] || [];
  if (!pool.length) return null;

  const sub = _rp(pool);
  const textPoolKey = {
    canoe_argue: 'canoeArg', canoe_nav: 'canoeNav', canoe_weight: 'canoeWeight', canoe_bond: 'canoeBond',
    find_package: 'findPackage', find_curse: 'findCurse',
    piggyback_stumble: 'piggyStumble', piggyback_heart: 'piggyHeart', piggyback_joke: 'piggyJoke',
    cave_spider: 'caveSpider', cave_wooly: 'caveWooly',
  }[phase + '_' + sub] || '';

  const pool_texts = TA_IDOL_TEXTS[textPoolKey] || [];
  const text = pool_texts.length ? _rp(pool_texts)(a, b) : `${a} and ${b} work through the ${phase} phase.`;

  let scoreDelta = 0;
  let badge = 'EVENT', badgeClass = 'neutral';
  if (sub === 'nav' || sub === 'heart' || sub === 'bond' || sub === 'package') { scoreDelta = 2; badgeClass = 'green'; badge = 'SMOOTH'; if (sub === 'bond' || sub === 'heart') addBond(a, b, 2); }
  if (sub === 'argue' || sub === 'weight' || sub === 'stumble') { scoreDelta = -2; badgeClass = 'red'; badge = 'TROUBLE'; addBond(a, b, -1); }
  if (sub === 'curse') { scoreDelta = -1; badge = 'CURSED'; badgeClass = 'red'; }
  if (sub === 'joke') { scoreDelta = 0; badge = 'JOKE'; }
  if (sub === 'spider' || sub === 'wooly') { scoreDelta = -3; badge = sub.toUpperCase(); badgeClass = 'red'; }

  return {
    type: phase === 'canoe' ? 'idolCanoeEvent' : phase === 'find' ? 'idolFindEvent' : phase === 'piggyback' ? 'idolPiggybackEvent' : 'idolCaveEvent',
    subtype: sub,
    phase,
    pairId: pair.id,
    players: [a, b],
    text,
    _scoreDelta: scoreDelta,
    badgeText: badge,
    badgeClass,
  };
}
```

- [ ] **Step 2: Validate + commit**

```bash
node --check js/chal/tri-armed-triathlon.js
git add js/chal/tri-armed-triathlon.js
git commit -m "feat(tri-armed): idol haul sub-challenge simulation (4 phases)"
```

---

## Task 5: Totem Pole simulation

**Files:**
- Modify: `js/chal/tri-armed-triathlon.js` — fill in `_runTotemPole`.

- [ ] **Step 1: Implement `_runTotemPole`**

```js
function _runTotemPole(triState, activePlayers, timeline) {
  const activePairs = triState.pairs.filter(p => !p.wimpKeyTaken);
  if (!activePairs.length) return;

  const eliminated = [...(gs.eliminated || [])]; // elimination order
  if (eliminated.length < 2) {
    // Nothing to build — auto-award to current leader
    timeline.push({
      type: 'totemSetup',
      text: `Chris unveils the wooden heads. There aren't enough to build a proper totem. Chris gives up and declares the challenge skipped.`,
    });
    return;
  }

  timeline.push({
    type: 'totemSetup',
    text: `Chris unveils a pile of wooden heads — one for every camper eliminated so far. "Stack them in voting order. Ezekiel on the bottom. Go."`,
  });

  // Detect confusion pairs (players with similar names in eliminated list)
  const confusionPairs = _detectConfusionPairs(eliminated);

  activePairs.forEach(pair => {
    const [a, b] = pair.members;
    const avgMental = (pStats(a).mental + pStats(b).mental) / 2;
    const avgStrategic = (pStats(a).strategic + pStats(b).strategic) / 2;
    let score = avgMental * 1.2 + avgStrategic * 0.8 + _rand(-2, 2);

    // Events (2-3 per pair)
    const evtCount = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < evtCount; i++) {
      const evt = _fireTotemEvent(pair, triState, eliminated, confusionPairs);
      if (!evt) continue;
      timeline.push(evt);
      score += evt._scoreDelta || 0;
    }

    pair.totemScore = score;
  });

  const winner = activePairs.reduce((best, p) => p.totemScore > best.totemScore ? p : best, activePairs[0]);
  winner.totemWon = true;
  winner.members.forEach(n => popDelta(n, 1));
  timeline.push({
    type: 'totemWin',
    pairId: winner.id,
    players: winner.members,
    text: `${winner.members[0]} and ${winner.members[1]} lock in the last head. Challenge 3 is theirs.`,
  });
}

function _detectConfusionPairs(eliminated) {
  const pairs = [];
  for (let i = 0; i < eliminated.length; i++) {
    for (let j = i + 1; j < eliminated.length; j++) {
      const a = eliminated[i];
      const b = eliminated[j];
      // Same first letter = confusing
      if (a[0] === b[0] && Math.abs(a.length - b.length) <= 1) {
        pairs.push([a, b]);
      }
    }
  }
  return pairs;
}

function _fireTotemEvent(pair, triState, eliminated, confusionPairs) {
  const [a, b] = pair.members;
  const archA = getArchetype(a);
  const archB = getArchetype(b);
  const pool = [];

  pool.push({ subtype: 'confusion', weight: confusionPairs.length ? 2 : 0.5 });
  if (VILLAIN_ARCHETYPES.includes(archA) || VILLAIN_ARCHETYPES.includes(archB)) pool.push({ subtype: 'badmouth', weight: 2 });
  if (NICE_ARCHETYPES.includes(archA) || NICE_ARCHETYPES.includes(archB)) pool.push({ subtype: 'defend', weight: 1.5 });
  // carved: if either player has a romance with an eliminated player
  const hasSpark = (gs.romanticSparks || []).some(s => (s.a === a || s.a === b) && eliminated.includes(s.b) || (s.b === a || s.b === b) && eliminated.includes(s.a));
  if (hasSpark) pool.push({ subtype: 'carved', weight: 1.5 });
  // breakdown: triggered when villain badmouths a showmance/ally of partner
  if ((VILLAIN_ARCHETYPES.includes(archA) && NICE_ARCHETYPES.includes(archB)) || (VILLAIN_ARCHETYPES.includes(archB) && NICE_ARCHETYPES.includes(archA))) {
    pool.push({ subtype: 'breakdown', weight: 1 });
  }

  if (!pool.length) return null;
  const total = pool.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  let pick;
  for (const p of pool) { r -= p.weight; if (r <= 0) { pick = p; break; } }
  if (!pick) return null;

  const s = pick.subtype;
  let text = '';
  let scoreDelta = 0;
  let badge = 'EVENT';
  let badgeClass = 'neutral';

  if (s === 'confusion') {
    const pair2 = _rp(confusionPairs) || ['Katie', 'Sadie'];
    text = (_rp(TA_TOTEM_TEXTS.confusion) || ((a, b, x, y) => `${a} and ${b} stare at the heads for ${x} and ${y}. Which one was voted off first?`))(a, b, pair2[0], pair2[1]);
    scoreDelta = -3;
    badge = 'STUCK';
    badgeClass = 'red';
  } else if (s === 'badmouth') {
    const villain = VILLAIN_ARCHETYPES.includes(archA) ? a : b;
    const partner = villain === a ? b : a;
    const target = _rp(eliminated);
    text = (_rp(TA_TOTEM_TEXTS.badmouth) || ((v, p, t) => `${v} holds up ${t}'s head. "Biggest waste of a platter we had."`))(villain, partner, target);
    scoreDelta = -1;
    badge = 'TRASH TALK';
    badgeClass = 'red';
    popDelta(villain, -1);
  } else if (s === 'defend') {
    const hero = NICE_ARCHETYPES.includes(archA) ? a : b;
    const target = _rp(eliminated);
    text = (_rp(TA_TOTEM_TEXTS.defend) || ((h, t) => `${h} picks up ${t}'s head with care. "They were good people."`))(hero, target);
    scoreDelta = 1;
    badge = 'DEFENDS';
    badgeClass = 'green';
    popDelta(hero, 1);
  } else if (s === 'carved') {
    const spark = (gs.romanticSparks || []).find(sp => (sp.a === a || sp.a === b) && eliminated.includes(sp.b) || (sp.b === a || sp.b === b) && eliminated.includes(sp.a));
    const carver = spark ? ((spark.a === a || spark.b === a) ? a : b) : a;
    const target = spark ? (spark.a === carver ? spark.b : spark.a) : eliminated[0];
    text = (_rp(TA_TOTEM_TEXTS.carved) || ((c, t) => `${c} carves a little heart on the back of ${t}'s head when Chris isn't looking.`))(carver, target);
    scoreDelta = 0;
    badge = 'ROMANCE';
    badgeClass = 'pink';
  } else if (s === 'breakdown') {
    const villain = VILLAIN_ARCHETYPES.includes(archA) ? a : b;
    const hero = villain === a ? b : a;
    text = (_rp(TA_TOTEM_TEXTS.breakdown) || ((v, h) => `${v} keeps talking trash. ${h} finally snaps. "I can't do this with you."`))(villain, hero);
    scoreDelta = -2;
    badge = 'BREAKDOWN';
    badgeClass = 'red';
    addBond(villain, hero, -3);
  }

  return {
    type: 'totemEvent',
    subtype: s,
    pairId: pair.id,
    players: [a, b],
    text,
    _scoreDelta: scoreDelta,
    badgeText: badge,
    badgeClass,
  };
}
```

- [ ] **Step 2: Validate + commit**

```bash
node --check js/chal/tri-armed-triathlon.js
git add js/chal/tri-armed-triathlon.js
git commit -m "feat(tri-armed): totem pole sub-challenge simulation"
```

---

## Task 6: Integration wiring

**Files:**
- Modify: `js/episode.js`, `js/twists.js`, `js/main.js`, `js/vp-screens.js`, `js/text-backlog.js`, `js/savestate.js` (if needed).

- [ ] **Step 1: Register in `js/episode.js`**

Add an import near the top of the file (follow the existing import pattern — look for other `simulateXxx` imports around line 40):

```js
import { simulateTriArmedTriathlon } from './chal/tri-armed-triathlon.js';
```

Then in the function that routes twist engine types (grep for `engineType === 'wawanakwa-gone-wild'` to locate), add a parallel branch:

```js
} else if (engineType === 'tri-armed-triathlon') {
  simulateTriArmedTriathlon(ep);
```

- [ ] **Step 2: Register in `js/main.js`**

Near the engine map (grep for `'wawanakwa-gone-wild': {` to locate), add:

```js
import * as triArmedMod from './chal/tri-armed-triathlon.js';
// ...
'tri-armed-triathlon': {
  simulate: triArmedMod.simulateTriArmedTriathlon,
  rpBuild: triArmedMod.rpBuildTriArmedTriathlon,
  text: triArmedMod.__textTriArmedTriathlon || triArmedMod._textTriArmedTriathlon,
},
```

- [ ] **Step 3: Register in `js/vp-screens.js`**

Grep for `rpBuildWawanakwaGoneWild` to find the registration block. Add:

```js
import { rpBuildTriArmedTriathlon } from './chal/tri-armed-triathlon.js';
// ...
if (ep.triArmedTriathlon) {
  vpScreens.push({ id: 'tri-armed-triathlon', label: 'Tri-Armed Triathlon', html: rpBuildTriArmedTriathlon(ep) });
}
```

- [ ] **Step 4: Register in `js/text-backlog.js`**

```js
import { _textTriArmedTriathlon } from './chal/tri-armed-triathlon.js';
// ...
// In the backlog-building function, add:
if (ep.triArmedTriathlon) _textTriArmedTriathlon(ep, ln, sec);
```

- [ ] **Step 5: Register the twist in `js/twists.js`**

Look at how `wawanakwa-gone-wild` is registered in the twist catalog (grep for its id). Add a parallel entry for `tri-armed-triathlon` with these properties:

- `id: 'tri-armed-triathlon'`
- `label: 'Trial by Tri-Armed Triathlon'`
- `phase: 'post-merge'`
- `minPlayers: 4`
- `mutuallyExclusive: true` (standard for challenge twists)
- `skipMainChalRecord: true`
- `engineType: 'tri-armed-triathlon'`
- `description: 'Handcuffed pairs compete in three sub-challenges: eat-off, idol haul, totem pole. Triple-tie outcome possible.'`

Match the shape of `wawanakwa-gone-wild`'s entry exactly — don't improvise schema.

- [ ] **Step 6: Validate**

```bash
node --check js/chal/tri-armed-triathlon.js
node --check js/episode.js
node --check js/twists.js
node --check js/main.js
node --check js/vp-screens.js
node --check js/text-backlog.js
```

All must exit 0.

- [ ] **Step 7: Commit**

```bash
git add js/chal/tri-armed-triathlon.js js/episode.js js/twists.js js/main.js js/vp-screens.js js/text-backlog.js
git commit -m "feat(tri-armed): wire challenge into episode/twist/vp/text pipelines"
```

---

## Task 7: CSS infrastructure

**Files:**
- Modify: `js/chal/tri-armed-triathlon.js` — fill in `TA_STYLES`.

- [ ] **Step 1: Replace the empty `TA_STYLES = \`\`` with the full CSS block**

```js
const TA_STYLES = `
  /* ═══ TRIAL BY TRI-ARMED TRIATHLON — SUMMER CAMP TOURNAMENT ═══
     Identity: carved wooden signs, iron handcuffs + chain, chalkboard
     scoreboard, campfire-warm palette. Distinct from motocross orange,
     ranger tan, dungeon stone, cafeteria slime, night-vision green.
  */

  .tr-page { background:#3a2818; color:#d4a574; font-family:Georgia,'Times New Roman',serif;
    position:relative; overflow:hidden; padding:24px 16px; min-height:400px; }
  .tr-page::before { content:''; position:absolute; inset:0; pointer-events:none; z-index:0;
    background:
      radial-gradient(ellipse at 50% 40%, transparent 55%, rgba(0,0,0,0.55) 100%),
      repeating-linear-gradient(90deg, rgba(139,90,43,0.04) 0px, rgba(139,90,43,0.04) 2px, transparent 2px, transparent 14px);
    opacity:0.75; }

  /* Header: carved wooden sign */
  .tr-header { position:relative; z-index:2; text-align:center; padding:16px 8px 12px;
    border-bottom:3px double rgba(212,165,116,0.35); margin-bottom:10px; }
  .tr-title { font-family:'Impact','Arial Narrow',sans-serif; font-size:26px; font-weight:900;
    letter-spacing:4px; color:#c8641e; text-transform:uppercase;
    text-shadow:1px 2px 0 rgba(0,0,0,0.55), -1px -1px 0 rgba(255,200,130,0.1); }
  .tr-subtitle { font-family:'Courier New',monospace; font-size:10px; color:#8b5a2b;
    letter-spacing:3px; margin-top:6px; }
  .tr-chain-deco { display:inline-block; margin:0 10px; color:#6e5a42; font-size:16px;
    animation: tr-chain-sway 3s ease-in-out infinite; }
  @keyframes tr-chain-sway { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(4deg)} }

  /* Ticker */
  .tr-ticker { position:relative; overflow:hidden; height:22px; margin:0 -16px 10px;
    background:linear-gradient(to right, rgba(139,90,43,0.25), rgba(58,40,24,0.4), rgba(139,90,43,0.25));
    border-top:1px solid rgba(212,165,116,0.3); border-bottom:1px solid rgba(212,165,116,0.3); z-index:2; }
  .tr-ticker-inner { position:absolute; white-space:nowrap; top:0; left:0; height:22px; line-height:22px;
    font-family:'Courier New',monospace; font-size:10px; color:#d4a574; letter-spacing:1.5px;
    animation: tr-ticker-scroll 34s linear infinite; }
  @keyframes tr-ticker-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }

  /* Scoreboard (chalkboard) */
  .tr-scoreboard { position:sticky; top:0; z-index:10; display:flex; justify-content:center; gap:12px;
    background:linear-gradient(to bottom, rgba(40,45,40,0.96), rgba(30,35,30,0.98));
    padding:10px 12px; margin:0 -16px 16px;
    border-top:2px solid rgba(139,90,43,0.45); border-bottom:2px solid rgba(139,90,43,0.45);
    font-family:'Courier New',monospace; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; }
  .tr-slot { display:flex; flex-direction:column; align-items:center; gap:4px; min-width:120px;
    padding:6px 8px; border-radius:4px; background:rgba(0,0,0,0.25);
    border:1px dashed rgba(212,165,116,0.4); }
  .tr-slot-label { color:#8b5a2b; font-size:9px; }
  .tr-slot-winner { font-size:10px; color:#d4a574; min-height:26px; display:flex; align-items:center; gap:4px; }
  .tr-slot-winner.tr-pending { opacity:0.3; }
  .tr-slot-winner.tr-filled { animation: tr-slot-fill 0.5s ease-out both; }
  @keyframes tr-slot-fill { 0%{opacity:0;transform:scale(0.5)} 100%{opacity:1;transform:scale(1)} }

  /* Stopwatch gauge */
  .tr-stopwatch { display:inline-flex; align-items:center; justify-content:center;
    width:32px; height:32px; border:2px solid #c8641e; border-radius:50%;
    font-family:'Courier New',monospace; font-size:9px; color:#c8641e; font-weight:700;
    position:relative; }
  .tr-stopwatch::after { content:''; position:absolute; top:2px; left:50%; width:1px; height:12px;
    background:#c8641e; transform-origin:bottom center; transform:rotate(0deg);
    animation: tr-watch-tick 12s linear infinite; }
  @keyframes tr-watch-tick { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }

  /* Pair banner with handcuff chain */
  .tr-pair-banner { display:flex; align-items:center; justify-content:center; gap:8px;
    padding:8px 12px; margin:6px 0; border-radius:6px;
    background:linear-gradient(135deg, rgba(139,90,43,0.2), rgba(58,40,24,0.3));
    border:1px solid rgba(212,165,116,0.25); }
  .tr-pair-portrait { flex:0 0 auto; text-align:center; }
  .tr-pair-name { font-family:'Courier New',monospace; font-size:10px; color:#d4a574; margin-top:2px; }
  .tr-chain { display:flex; align-items:center; gap:3px; padding:0 4px; }
  .tr-chain-link { display:inline-block; width:14px; height:8px; border-radius:50%;
    border:2px solid #6e5a42; background:linear-gradient(135deg, #5a4a32, #3a2e1e);
    box-shadow:inset 0 1px 2px rgba(0,0,0,0.45); }
  .tr-chain-link-mid { animation: tr-chain-jiggle 3s ease-in-out infinite; }
  @keyframes tr-chain-jiggle { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(5deg)} }
  .tr-pair-banner--broken .tr-chain-link { animation: tr-chain-break 0.6s ease-out both; }
  .tr-pair-banner--broken .tr-chain-link:nth-child(1) { animation-delay:0s; transform:translate(-12px,-6px) rotate(-25deg); opacity:0.4; }
  .tr-pair-banner--broken .tr-chain-link:nth-child(3) { animation-delay:0.1s; transform:translate(12px,6px) rotate(25deg); opacity:0.4; }
  @keyframes tr-chain-break { 0%{transform:translate(0,0) rotate(0)} 100%{transform:translate(var(--bx,0),var(--by,0)) rotate(var(--br,0))} }

  /* Wooden-frame cards */
  .tr-card { position:relative; z-index:2; padding:10px 14px; margin-bottom:6px; border-radius:4px;
    border:2px solid #6e4a2a; border-left:4px solid var(--tr-accent,#8b5a2b);
    background:linear-gradient(135deg, rgba(78,58,38,0.6), rgba(58,40,24,0.75));
    box-shadow:inset 0 1px 0 rgba(212,165,116,0.08);
    animation: tr-card-in 0.4s ease-out both; }
  @keyframes tr-card-in { 0%{opacity:0;transform:translateY(-6px)} 100%{opacity:1;transform:translateY(0)} }
  .tr-card-label { font-family:'Courier New',monospace; font-size:9px; font-weight:700; letter-spacing:1px;
    color:var(--tr-accent,#8b5a2b); text-transform:uppercase; margin-bottom:4px; }
  .tr-card-body { font-family:Georgia,serif; font-size:12px; color:#d4a574; line-height:1.55; }
  .tr-card-footer { font-family:'Courier New',monospace; font-size:8px; color:#8b5a2b; margin-top:4px; letter-spacing:1px; }

  /* Card variants */
  .tr-card--chowdown { border-left-color:#c8641e; }
  .tr-card--idol { border-left-color:#2a4a2a; background:linear-gradient(135deg, rgba(42,74,42,0.5), rgba(30,50,30,0.7)); }
  .tr-card--totem { border-left-color:#6e4a2a; }
  .tr-card--wimp { border-color:#c33; background:linear-gradient(135deg, rgba(80,25,25,0.6), rgba(50,20,20,0.75)); }
  .tr-card--mishap { animation: tr-card-in 0.4s ease-out both, tr-card-shake 0.4s 0.4s both; border-left-color:#c33; }
  @keyframes tr-card-shake { 0%,100%{transform:translateX(0)} 15%,45%,75%{transform:translateX(-3px)} 30%,60%,90%{transform:translateX(3px)} }

  /* Stamp */
  .tr-stamp { display:inline-block; padding:3px 10px; border:3px solid currentColor; border-radius:3px;
    font-family:'Courier New',monospace; font-size:12px; font-weight:900; letter-spacing:2px;
    text-transform:uppercase; transform:rotate(-5deg); animation: tr-stamp-slam 0.5s ease-out both; }
  @keyframes tr-stamp-slam {
    0%   { transform:rotate(-5deg) scale(3.5); opacity:0; }
    55%  { transform:rotate(-5deg) scale(0.92); opacity:1; }
    75%  { transform:rotate(-5deg) scale(1.06); }
    100% { transform:rotate(-5deg) scale(1); opacity:1; }
  }

  /* Camera shake (scoped to card) */
  .tr-camera-shake { animation: tr-camera-shake 0.4s; }
  @keyframes tr-camera-shake {
    0%,100% { transform:translate(0,0); }
    15%  { transform:translate(-3px, 2px); }
    30%  { transform:translate(3px,-2px); }
    45%  { transform:translate(-2px,-3px); }
    60%  { transform:translate(2px, 3px); }
    75%  { transform:translate(-3px, 1px); }
    90%  { transform:translate(3px,-1px); }
  }

  /* Wimp key visual */
  .tr-wimp-key { display:inline-block; font-size:28px; animation: tr-key-rotate 10s linear infinite;
    filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5)); }
  @keyframes tr-key-rotate { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }

  /* Reveal controls */
  .tr-btn-reveal { background:rgba(200,100,30,0.15); border:2px solid rgba(200,100,30,0.5);
    color:#c8641e; padding:8px 20px; border-radius:4px; cursor:pointer;
    font-family:'Impact','Arial Narrow',sans-serif; font-size:13px; letter-spacing:2px;
    text-transform:uppercase; margin:12px auto; display:block;
    animation: tr-btn-pulse 2s infinite; }
  .tr-btn-reveal:hover { background:rgba(200,100,30,0.3); }
  @keyframes tr-btn-pulse { 0%,100%{box-shadow:0 0 6px rgba(200,100,30,0.2)} 50%{box-shadow:0 0 18px rgba(200,100,30,0.5)} }
  .tr-btn-reveal-all { display:block; text-align:center; font-size:10px; color:#8b5a2b;
    cursor:pointer; text-decoration:underline; margin-top:4px; font-family:'Courier New',monospace; }

  /* Final reveal — single-winner gold banner */
  .tr-final-banner { padding:24px; text-align:center; border-radius:8px; margin:20px 0;
    background:radial-gradient(ellipse at 50% 40%, rgba(200,150,60,0.4) 0%, rgba(60,40,20,0.9) 70%);
    border:3px solid rgba(200,150,60,0.6); animation: tr-banner-rise 0.8s ease-out both; }
  @keyframes tr-banner-rise { 0%{opacity:0;transform:translateY(20px)} 100%{opacity:1;transform:translateY(0)} }
  .tr-final-title { font-family:'Impact','Arial Narrow',sans-serif; font-size:28px; color:#ffd700;
    letter-spacing:5px; font-weight:900; text-shadow:0 2px 6px rgba(0,0,0,0.7); }

  /* Final reveal — triple-tie warning banner */
  .tr-no-immune { padding:24px; text-align:center; border-radius:8px; margin:20px 0;
    background:repeating-linear-gradient(45deg, #1a0a0a 0 20px, #3a1010 20px 40px);
    border:3px solid #c33; animation: tr-banner-rise 0.8s ease-out both, tr-camera-shake 0.4s ease-out 0.8s both; }
  .tr-no-immune-title { font-family:'Impact','Arial Narrow',sans-serif; font-size:24px; color:#ffffff;
    letter-spacing:4px; font-weight:900; text-shadow:0 2px 6px rgba(0,0,0,0.8); }
  .tr-no-immune-sub { font-family:'Courier New',monospace; font-size:11px; color:#ffaaaa;
    letter-spacing:2px; margin-top:8px; }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .tr-chain-deco, .tr-chain-link-mid, .tr-ticker-inner, .tr-stopwatch::after,
    .tr-card, .tr-card--mishap, .tr-stamp, .tr-camera-shake, .tr-wimp-key,
    .tr-btn-reveal, .tr-slot-winner.tr-filled, .tr-final-banner, .tr-no-immune { animation:none !important; }
  }
`;
```

- [ ] **Step 2: Validate + commit**

```bash
node --check js/chal/tri-armed-triathlon.js
git add js/chal/tri-armed-triathlon.js
git commit -m "feat(tri-armed): CSS infrastructure (wood/rope/chalkboard + handcuff chain)"
```

---

## Task 8: VP builder + reveal engine + event renderers

**Files:**
- Modify: `js/chal/tri-armed-triathlon.js` — fill in `_trReveal`, `_trRevealAll`, `rpBuildTriArmedTriathlon`, and `_renderTAStep`.

- [ ] **Step 1: Implement `rpBuildTriArmedTriathlon` and the reveal engine**

```js
// Helper: access rpPortrait from a global — the simulator wires it in vp-screens.js
const rpPortrait = (name, size) => (window.rpPortrait || ((n) => `[${n}]`))(name, size);
// In practice, check whether rpPortrait is imported — if it is in wawanakwa-gone-wild.js, mirror that import.

function _trReveal(stateKey, totalSteps) {
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const st = _tvState[stateKey];
  if (st.idx >= totalSteps - 1) return;
  st.idx++;
  const el = document.getElementById(`tr-step-${stateKey}-${st.idx}`);
  if (el) {
    el.style.display = '';
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (el.dataset.cameraShake === '1') {
      el.classList.remove('tr-camera-shake');
      void el.offsetWidth;
      el.classList.add('tr-camera-shake');
      setTimeout(() => el.classList.remove('tr-camera-shake'), 450);
    }
    // Fill scoreboard slot if this reveal is a sub-challenge win
    if (el.dataset.fillSlot) {
      const slot = document.getElementById(`tr-slot-${stateKey}-${el.dataset.fillSlot}`);
      if (slot) {
        slot.innerHTML = el.dataset.slotHtml || '';
        slot.classList.add('tr-filled');
        slot.classList.remove('tr-pending');
      }
    }
  }
  const btn = document.getElementById(`tr-btn-${stateKey}`);
  if (btn) {
    if (st.idx >= totalSteps - 1) {
      const ctrl = document.getElementById(`tr-controls-${stateKey}`);
      if (ctrl) ctrl.style.display = 'none';
    } else {
      btn.textContent = `▶ NEXT BEAT (${st.idx + 2}/${totalSteps})`;
    }
  }
}

function _trRevealAll(stateKey, totalSteps) {
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  _tvState[stateKey].idx = totalSteps - 1;
  for (let i = 0; i < totalSteps; i++) {
    const el = document.getElementById(`tr-step-${stateKey}-${i}`);
    if (el) {
      el.style.display = '';
      if (el.dataset.fillSlot) {
        const slot = document.getElementById(`tr-slot-${stateKey}-${el.dataset.fillSlot}`);
        if (slot) { slot.innerHTML = el.dataset.slotHtml || ''; slot.classList.add('tr-filled'); slot.classList.remove('tr-pending'); }
      }
    }
  }
  const ctrl = document.getElementById(`tr-controls-${stateKey}`);
  if (ctrl) ctrl.style.display = 'none';
}

export function rpBuildTriArmedTriathlon(ep) {
  const tri = ep.triArmedTriathlon;
  if (!tri?.timeline?.length) return '';

  const stateKey = `tr_reveal_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  // Build ticker content
  const tickerLines = [
    'RULE: HANDCUFFS STAY ON. WIMP KEY EXISTS.',
    'RULE: WIMP KEY = FREEDOM + NO INVINCIBILITY',
    'CHEF STOCKED THE FOOD COURT. BE WARY.',
    'CURSED IDOL COUNTS DOWN WHILE YOU HOLD IT',
    'CAVE OF TREACHEROUS TERROR IS ACTUALLY TERRIFYING',
    'TOTEM POLE MUST MATCH THE VOTING HISTORY',
    'TRIPLE-TIE = NOBODY IS SAFE TONIGHT',
    ...((tri.timeline.filter(e => e.type === 'chrisQuip' && e.text)).map(e => 'CHRIS: ' + String(e.text).slice(0, 70).toUpperCase())),
  ];
  for (let i = tickerLines.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [tickerLines[i], tickerLines[j]] = [tickerLines[j], tickerLines[i]]; }
  const tickerText = tickerLines.slice(0, 24).join('  ·  ');
  const tickerDoubled = tickerText + '  ·  ' + tickerText;

  // Pre-compute step renderings
  const steps = tri.timeline.map((evt, i) => ({
    evt,
    html: _renderTAStep(evt, tri),
    cameraShake: ['grossOut', 'vomit', 'spider', 'wooly', 'breakdown'].includes(evt.subtype) ? 1 : 0,
  }));

  // Assembly
  let html = `<style>${TA_STYLES}</style>`;
  html += `<div class="tr-page rp-page">`;
  html += `<div class="tr-header">`;
  html += `<span class="tr-chain-deco">⛓️</span>`;
  html += `<span class="tr-title">Trial by Tri-Armed Triathlon</span>`;
  html += `<span class="tr-chain-deco">⛓️</span>`;
  html += `<div class="tr-subtitle">3 CHALLENGES · ${tri.pairs.length} PAIRS · ONE KEY TO FREEDOM</div>`;
  html += `</div>`;

  html += `<div class="tr-ticker"><div class="tr-ticker-inner">${tickerDoubled}</div></div>`;

  // Sticky scoreboard — 3 slots
  html += `<div class="tr-scoreboard">`;
  ['CHOWDOWN', 'IDOL HAUL', 'TOTEM POLE'].forEach((label, i) => {
    html += `<div class="tr-slot">`;
    html += `<div class="tr-slot-label">🏆 CHALLENGE ${i + 1} · ${label}</div>`;
    html += `<div class="tr-slot-winner tr-pending" id="tr-slot-${stateKey}-${i}">—</div>`;
    html += `</div>`;
  });
  html += `<div class="tr-stopwatch">▲</div>`;
  html += `</div>`;

  // Steps
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const visible = i <= state.idx;
    let slotAttr = '';
    if (s.evt.type === 'chowdownWin') slotAttr = ` data-fill-slot="0" data-slot-html="${_htmlEscape(_renderSlotWinner(s.evt, tri))}"`;
    if (s.evt.type === 'idolWin') slotAttr = ` data-fill-slot="1" data-slot-html="${_htmlEscape(_renderSlotWinner(s.evt, tri))}"`;
    if (s.evt.type === 'totemWin') slotAttr = ` data-fill-slot="2" data-slot-html="${_htmlEscape(_renderSlotWinner(s.evt, tri))}"`;
    html += `<div id="tr-step-${stateKey}-${i}" style="${visible ? '' : 'display:none'}"${s.cameraShake ? ' data-camera-shake="1"' : ''}${slotAttr}>${s.html}</div>`;
  }

  // Controls
  const allRevealed = state.idx >= steps.length - 1;
  html += `<div id="tr-controls-${stateKey}" style="${allRevealed ? 'display:none' : 'text-align:center;margin:12px 0;z-index:3;position:relative'}">`;
  html += `<button class="tr-btn-reveal" id="tr-btn-${stateKey}" onclick="window._trReveal('${stateKey}',${steps.length})">▶ NEXT BEAT (${state.idx + 2}/${steps.length})</button>`;
  html += `<a class="tr-btn-reveal-all" onclick="window._trRevealAll('${stateKey}',${steps.length})">reveal all</a>`;
  html += `</div>`;

  window._trReveal = _trReveal;
  window._trRevealAll = _trRevealAll;

  html += `</div>`;
  return html;
}

function _htmlEscape(s) { return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function _renderSlotWinner(evt, tri) {
  const pair = tri.pairs.find(p => p.id === evt.pairId);
  if (!pair) return '—';
  return `<span>${pair.members[0]}</span><span class="tr-chain-link" style="margin:0 2px"></span><span>${pair.members[1]}</span>`;
}

function _renderPairBanner(pair, broken = false) {
  const [a, b] = pair.members;
  const brokenClass = broken ? ' tr-pair-banner--broken' : '';
  let h = `<div class="tr-pair-banner${brokenClass}">`;
  h += `<div class="tr-pair-portrait">${rpPortrait(a, 'sm')}<div class="tr-pair-name">${a}</div></div>`;
  h += `<div class="tr-chain">`;
  h += `<span class="tr-chain-link"></span>`;
  h += `<span class="tr-chain-link tr-chain-link-mid"></span>`;
  h += `<span class="tr-chain-link"></span>`;
  h += `</div>`;
  h += `<div class="tr-pair-portrait">${rpPortrait(b, 'sm')}<div class="tr-pair-name">${b}</div></div>`;
  h += `</div>`;
  return h;
}
```

- [ ] **Step 2: Validate + commit**

```bash
node --check js/chal/tri-armed-triathlon.js
git add js/chal/tri-armed-triathlon.js
git commit -m "feat(tri-armed): VP builder + reveal engine + scoreboard/ticker chrome"
```

---

## Task 9: Event renderers

**Files:**
- Modify: `js/chal/tri-armed-triathlon.js` — implement `_renderTAStep`.

- [ ] **Step 1: Write the per-event renderer**

Add above `rpBuildTriArmedTriathlon` (or after, depending on declaration order):

```js
function _renderTAStep(evt, tri) {
  const TA_RED = '#c33', TA_GREEN = '#6a9f3a', TA_BROWN = '#8b5a2b', TA_ORANGE = '#c8641e', TA_GOLD = '#d4a574', TA_PINK = '#d4789a';

  // chrisIntro
  if (evt.type === 'chrisIntro') {
    return `<div class="tr-card"><div class="tr-card-label">📢 CHRIS MCLEAN</div><div class="tr-card-body" style="font-style:italic">${evt.text}</div></div>`;
  }

  // pairingReveal
  if (evt.type === 'pairingReveal') {
    const pair = tri.pairs.find(p => p.id === evt.pairId);
    let h = `<div class="tr-card" style="--tr-accent:${TA_ORANGE}">`;
    h += `<div class="tr-card-label">🎲 PAIRING · PAIR ${evt.pairId + 1}</div>`;
    h += _renderPairBanner(pair);
    h += `<div class="tr-card-body" style="margin-top:6px">${evt.text}</div>`;
    h += `</div>`;
    return h;
  }

  // handcuffed
  if (evt.type === 'handcuffed') {
    const chemLabel = evt.bond >= 3 ? 'ALLIES' : evt.bond <= -3 ? 'RIVALS' : 'STRANGERS';
    const chemColor = evt.bond >= 3 ? TA_GREEN : evt.bond <= -3 ? TA_RED : TA_BROWN;
    return `<div class="tr-card" style="--tr-accent:${chemColor}"><div class="tr-card-label">⛓️ CUFFED · ${chemLabel}</div><div class="tr-card-body">${evt.text}</div></div>`;
  }

  // wimpKeyOffer
  if (evt.type === 'wimpKeyOffer') {
    let h = `<div class="tr-card tr-card--wimp">`;
    h += `<div class="tr-card-label">🗝️ WIMP KEY OFFER #${evt.offerIndex + 1}</div>`;
    h += `<div style="text-align:center;margin:6px 0"><span class="tr-wimp-key">🗝️</span></div>`;
    evt.decisions.forEach(d => {
      const pair = tri.pairs.find(p => p.id === d.pairId);
      h += _renderPairBanner(pair, d.taken);
      h += `<div style="text-align:center;font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;color:${d.taken ? TA_RED : TA_GREEN};margin-top:-4px;margin-bottom:8px">${d.taken ? '🔓 TAKEN' : '✋ REFUSED'}</div>`;
    });
    h += `</div>`;
    return h;
  }

  // wimpKeyTaken
  if (evt.type === 'wimpKeyTaken') {
    return `<div class="tr-card tr-card--wimp"><div class="tr-card-label">🔓 OUT OF THE RUNNING</div><div class="tr-card-body">${evt.text}</div><div style="margin-top:6px"><span class="tr-stamp" style="color:${TA_RED}">WIMPED</span></div></div>`;
  }

  // chowdownSetup
  if (evt.type === 'chowdownSetup') {
    return `<div class="tr-card tr-card--chowdown"><div class="tr-card-label">🍽️ CHALLENGE 1 · COMPETITIVE CHOWDOWN</div><div class="tr-card-body">${evt.text}</div></div>`;
  }

  // chowdownEvent
  if (evt.type === 'chowdownEvent') {
    const pair = tri.pairs.find(p => p.id === evt.pairId);
    const cardClass = evt.subtype === 'vomit' || evt.subtype === 'grossOut' ? 'tr-card tr-card--mishap tr-card--chowdown' : 'tr-card tr-card--chowdown';
    let h = `<div class="${cardClass}">`;
    h += `<div class="tr-card-label">🍽️ CHOWDOWN · ${evt.subtype.toUpperCase()} · PAIR ${evt.pairId + 1}</div>`;
    h += _renderPairBanner(pair);
    h += `<div class="tr-card-body" style="margin-top:6px">${evt.text}</div>`;
    if (evt.badgeText) h += `<div style="margin-top:4px"><span class="tr-stamp" style="color:${evt.badgeClass === 'red' ? TA_RED : TA_GREEN}">${evt.badgeText}</span></div>`;
    h += `</div>`;
    return h;
  }

  // chowdownWin / idolWin / totemWin
  if (evt.type === 'chowdownWin' || evt.type === 'idolWin' || evt.type === 'totemWin') {
    const pair = tri.pairs.find(p => p.id === evt.pairId);
    const labelMap = { chowdownWin: '🏆 CHOWDOWN WON', idolWin: '🏆 IDOL HAUL WON', totemWin: '🏆 TOTEM POLE WON' };
    let h = `<div class="tr-card" style="--tr-accent:${TA_GOLD};border-color:${TA_GOLD}">`;
    h += `<div class="tr-card-label">${labelMap[evt.type]}</div>`;
    h += _renderPairBanner(pair);
    h += `<div class="tr-card-body" style="margin-top:6px;text-align:center">${evt.text}</div>`;
    h += `<div style="text-align:center;margin-top:6px"><span class="tr-stamp" style="color:${TA_GOLD}">FIRST!</span></div>`;
    h += `</div>`;
    return h;
  }

  // idol/canoe/find/piggyback/cave events
  if (evt.type && evt.type.startsWith('idol')) {
    const pair = tri.pairs.find(p => p.id === evt.pairId);
    const phaseLabel = { canoe: '🚣 CANOE', find: '📦 IDOL', piggyback: '🏃 PIGGYBACK', cave: '🕷️ CAVE' }[evt.phase] || evt.phase?.toUpperCase();
    const cardClass = evt.badgeClass === 'red' ? 'tr-card tr-card--mishap tr-card--idol' : 'tr-card tr-card--idol';
    let h = `<div class="${cardClass}">`;
    h += `<div class="tr-card-label">${phaseLabel} · PAIR ${evt.pairId + 1}</div>`;
    h += _renderPairBanner(pair);
    h += `<div class="tr-card-body" style="margin-top:6px">${evt.text}</div>`;
    if (evt.badgeText) h += `<div style="margin-top:4px"><span class="tr-stamp" style="color:${evt.badgeClass === 'red' ? TA_RED : TA_GREEN}">${evt.badgeText}</span></div>`;
    h += `</div>`;
    return h;
  }

  // totem events
  if (evt.type === 'totemSetup') {
    return `<div class="tr-card tr-card--totem"><div class="tr-card-label">🗿 CHALLENGE 3 · TOTEM POLE OF SHAME</div><div class="tr-card-body">${evt.text}</div></div>`;
  }
  if (evt.type === 'totemEvent') {
    const pair = tri.pairs.find(p => p.id === evt.pairId);
    const cardClass = evt.subtype === 'breakdown' ? 'tr-card tr-card--mishap tr-card--totem' : 'tr-card tr-card--totem';
    let h = `<div class="${cardClass}">`;
    h += `<div class="tr-card-label">🗿 TOTEM · ${evt.subtype.toUpperCase()} · PAIR ${evt.pairId + 1}</div>`;
    h += _renderPairBanner(pair);
    h += `<div class="tr-card-body" style="margin-top:6px">${evt.text}</div>`;
    if (evt.badgeText) h += `<div style="margin-top:4px"><span class="tr-stamp" style="color:${evt.badgeClass === 'red' ? TA_RED : evt.badgeClass === 'pink' ? TA_PINK : TA_GREEN}">${evt.badgeText}</span></div>`;
    h += `</div>`;
    return h;
  }

  // chrisQuip
  if (evt.type === 'chrisQuip') {
    return `<div class="tr-card"><div class="tr-card-label">📢 CHRIS MCLEAN</div><div class="tr-card-body" style="font-style:italic">${evt.text}</div></div>`;
  }

  // finalScoreReveal — delegated to Task 10

  // Fallback
  return `<div class="tr-card"><div class="tr-card-label">${(evt.type || 'EVENT').toUpperCase()}</div><div class="tr-card-body">${evt.text || ''}</div></div>`;
}
```

- [ ] **Step 2: Validate + commit**

```bash
node --check js/chal/tri-armed-triathlon.js
git add js/chal/tri-armed-triathlon.js
git commit -m "feat(tri-armed): per-event card renderers"
```

---

## Task 10: Final reveal (gold banner or triple-tie warning)

**Files:**
- Modify: `js/chal/tri-armed-triathlon.js` — extend `_renderTAStep` with `finalScoreReveal` branch.

- [ ] **Step 1: Add the `finalScoreReveal` branch**

Inside `_renderTAStep`, before the fallback, add:

```js
  // finalScoreReveal
  if (evt.type === 'finalScoreReveal') {
    let h = `<div class="tr-card" style="border-color:${TA_GOLD}">`;
    h += `<div class="tr-card-label">📊 FINAL SCORE</div>`;
    h += `<table style="width:100%;border-collapse:collapse;font-family:'Courier New',monospace;font-size:11px;color:${TA_GOLD}">`;
    h += `<thead><tr><th style="text-align:left;padding:4px 8px;border-bottom:1px solid rgba(212,165,116,0.3)">PAIR</th><th style="text-align:center">CHOW</th><th style="text-align:center">IDOL</th><th style="text-align:center">TOTEM</th><th style="text-align:center">WINS</th></tr></thead>`;
    h += `<tbody>`;
    evt.pairs.forEach(p => {
      const mark = (v) => v ? '✓' : v === null ? '—' : '✗';
      h += `<tr>`;
      h += `<td style="padding:4px 8px">${p.members[0]} & ${p.members[1]}${p.wimpKeyTaken ? ' 🔓' : ''}</td>`;
      h += `<td style="text-align:center;color:${p.details.chowdown ? TA_GREEN : '#8b5a2b'}">${mark(p.details.chowdown)}</td>`;
      h += `<td style="text-align:center;color:${p.details.idol ? TA_GREEN : '#8b5a2b'}">${mark(p.details.idol)}</td>`;
      h += `<td style="text-align:center;color:${p.details.totem ? TA_GREEN : '#8b5a2b'}">${mark(p.details.totem)}</td>`;
      h += `<td style="text-align:center;font-weight:900;color:${p.wins >= 2 ? TA_GOLD : TA_BROWN}">${p.wins}</td>`;
      h += `</tr>`;
    });
    h += `</tbody></table>`;
    h += `</div>`;

    // Winner banner OR triple-tie warning
    if (evt.tripleTie) {
      h += `<div class="tr-no-immune">`;
      h += `<div class="tr-no-immune-title">NO INVINCIBILITY</div>`;
      h += `<div class="tr-no-immune-sub">ALL THREE PAIRS WIN ONE CHALLENGE · EVERYONE IS VULNERABLE AT TRIBAL</div>`;
      h += `</div>`;
    } else if (evt.winnerPair !== null && evt.winnerPair !== undefined) {
      const wp = tri.pairs.find(p => p.id === evt.winnerPair);
      h += `<div class="tr-final-banner">`;
      h += `<div class="tr-final-title">🏆 INVINCIBILITY</div>`;
      h += `<div style="margin-top:12px">`;
      h += _renderPairBanner(wp);
      h += `</div>`;
      h += `<div style="font-family:'Courier New',monospace;font-size:10px;color:${TA_GOLD};letter-spacing:2px;margin-top:10px">BOTH MEMBERS ARE IMMUNE TONIGHT</div>`;
      h += `</div>`;
    } else {
      // Zero-wins edge case (all pairs wimp-keyed or all tied at 0)
      h += `<div class="tr-no-immune">`;
      h += `<div class="tr-no-immune-title">NO WINNER</div>`;
      h += `<div class="tr-no-immune-sub">NO PAIR QUALIFIED FOR INVINCIBILITY · EVERYONE IS VULNERABLE</div>`;
      h += `</div>`;
    }

    return h;
  }
```

- [ ] **Step 2: Validate + commit**

```bash
node --check js/chal/tri-armed-triathlon.js
git add js/chal/tri-armed-triathlon.js
git commit -m "feat(tri-armed): final reveal — gold banner or triple-tie warning"
```

---

## Task 11: Text pools + text backlog

**Files:**
- Modify: `js/chal/tri-armed-triathlon.js` — populate the text-pool constants + implement `_textTriArmedTriathlon`.

### Content expectations

Each pool below needs 3-6 variants. Match the voice of the existing Total Drama Island challenges — casual narrator tone, specific sensory details, Chris's sardonic commentary. Use template functions with `(a, b, ...)` signatures.

- [ ] **Step 1: Populate Chris intros (6 variants)**

```js
const TA_CHRIS_INTROS = [
  `"Welcome to the Tri-Armed Triathlon! Three challenges. Three pairs. Three very unfortunate handcuffs." — Chris McLean`,
  `"Final group, final stretch. Today you're cuffed to somebody you may or may not like. Try not to kill each other. Try." — Chris McLean`,
  `"Listen up. Today's game is a triathlon. Handcuffed. The wimp key exists if you can't hack it — but it costs you invincibility." — Chris McLean`,
  `"Three events. Chowdown, Idol Haul, Totem Pole. Last pair standing — actually, FIRST pair finishing — wins invincibility." — Chris McLean`,
  `"You thought getting to the final few would be easy. It's not. Here's a handcuff. Don't lose the key. Actually, do lose the key." — Chris McLean`,
  `"Trial by Tri-Armed Triathlon! It sounds cooler than it is. It's about as cool as it sounds." — Chris McLean`,
];
```

- [ ] **Step 2: Populate pairing-reveal flavor (4 per archetype category)**

```js
const TA_PAIRING_FLAVOR = {
  villain_hero: [
    `A villain and a saint. This should go great.`,
    `The most cursed handcuff in the cast. Buckle in.`,
    `One of them will be plotting. The other will be praying.`,
    `Nobody picked this. That's the point.`,
  ],
  rivals: [
    `They haven't made eye contact since week three. Now they're cuffed.`,
    `Perfect. The two campers who most want each other gone.`,
    `Tension: immediate. Outcome: unclear.`,
    `A grudge, a chain, and three challenges to survive.`,
  ],
  showmance: [
    `The showmance gets to hold hands for real. Sort of.`,
    `They were already inseparable. Chris made it official.`,
    `Three challenges to either seal the bond or break the bed.`,
    `A chain instead of a wedding ring. Progress?`,
  ],
  strangers: [
    `They've said maybe four sentences to each other all season. Now they're shackled.`,
    `Two campers who barely know each other. Time to get acquainted.`,
    `New friendship forged in obligation. Or not.`,
    `The cast's most awkward pair, now with hardware.`,
  ],
  default: [
    `Another pair. Another challenge.`,
    `Fine. Whatever. Handcuffs on.`,
    `They're cuffed. They'll figure it out.`,
    `Two names, one chain, three problems.`,
  ],
};
```

- [ ] **Step 3: Populate chowdown texts (4-6 per subtype)**

Write text-function arrays:

```js
const TA_CHOWDOWN_TEXTS = {
  roleArg: [
    `One of them says "I should feed" at the same time the other says "I should eat." They start again.`,
    `They argue for forty seconds about who gets to keep their arms free. Chris gives them a thirty-second shot clock.`,
    `They both point at each other. "You eat." "No, YOU eat." Chris buzzes in.`,
  ],
  rhythm: [
    `They find a rhythm. Scoop. Swallow. Scoop. Swallow. It's almost choreographed.`,
    `Against every expectation, they sync up. The platter empties steadily.`,
    `The feeder has learned to aim. The eater has learned to open wide. It's working.`,
  ],
  cheatCaught: [
    `The feeder sneaks their second arm out. Chris watches it happen on the monitor. "Disqualified that spoonful."`,
    `Both arms. Everyone sees. Chris adds five seconds.`,
  ],
  cheatSneaky: [
    `They use the other hand when nobody's looking. The platter empties suspiciously fast.`,
    `Two arms, angled carefully away from the camera. Nobody notices.`,
  ],
  grossOut: [
    `The green chicken MOVES on the fork. The eater gags. The feeder pauses, unsure what to do.`,
    `Whatever the mystery meat was, it is now on the eater's chin. The chin does not forgive.`,
    `The eater retches but doesn't quite vomit. The feeder keeps going anyway.`,
  ],
  smashFood: [
    `The feeder gives up on the spoon. They pick up the whole platter and smash it into their partner's face. It counts.`,
    `Desperate times. Whole tray. Full commitment. The eater is covered in something that might have been gravy.`,
  ],
  vomit: [
    `The eater loses it. Vomit in the platter. Run is over.`,
    `The eater tries to push through. The eater's body disagrees. Platter is gone.`,
  ],
};
```

- [ ] **Step 4: Populate idol texts (3-4 per subtype)**

```js
const TA_IDOL_TEXTS = {
  canoeArg: [
    (a, b) => `${a} and ${b} argue about who paddles harder. Neither paddles.`,
    (a, b) => `${a} splashes ${b} with the paddle. Accident. Probably.`,
  ],
  canoeNav: [
    (a, b) => `${b} spots Boney Island through the mist. ${a} adjusts course. They're ahead.`,
    (a, b) => `${a} reads the shoreline. They cut the corner and save a full minute.`,
  ],
  canoeWeight: [
    (a, b) => `${a} mutters about the weight distribution. ${b} hears. ${b} does not forget.`,
    (a, b) => `The canoe lists noticeably. Someone makes a comment. Someone else does not take it well.`,
  ],
  canoeBond: [
    (a, b) => `Out in the middle of the lake, ${a} admits something ${b} wasn't expecting. They paddle in silence for a minute.`,
    (a, b) => `${b} apologizes for something from week two. ${a} didn't know they were still thinking about it.`,
  ],
  findPackage: [
    (a, b) => `${a} pries open the package. Inside: pieces of a cursed tiki idol. ${b} picks one up and flinches immediately.`,
    (a, b) => `The idol pieces are wet and smell like a septic tank. ${a} is going to complain about this later.`,
  ],
  findCurse: [
    (a, b) => `${b} suddenly feels off. The curse is apparently real.`,
    (a, b) => `${a} swears the idol piece is heavier now than when they picked it up.`,
  ],
  piggyStumble: [
    (a, b) => `${a} is carrying ${b}. ${a} steps on a root. They both go down.`,
    (a, b) => `The piggyback collapses halfway up the trail. ${b} lands badly.`,
  ],
  piggyHeart: [
    (a, b) => `${b}, from on top of ${a}'s back: "I know we haven't talked much. Thanks for this." ${a} grunts, moved.`,
    (a, b) => `${a} realizes ${b} has been holding their breath to save weight. They both start laughing.`,
  ],
  piggyJoke: [
    (a, b) => `${b} yells "mush!" ${a} does not find it funny.`,
    (a, b) => `${a} pretends to stumble just to mess with ${b}. ${b} pretends to be unfazed. Neither is lying very well.`,
  ],
  caveSpider: [
    (a, b) => `A spider drops from the cave entrance. Spider on face. ${a} screams. They retreat twenty yards.`,
    (a, b) => `${b} opens their mouth at exactly the wrong moment. Spider encounter: personal.`,
  ],
  caveWooly: [
    (a, b) => `Wooly beavers surge out of the cave. ${a} and ${b} run. Nobody mentions what wooly beavers are.`,
    (a, b) => `Something large and fuzzy charges. It's not clear what. ${a} and ${b} abandon the cave mouth.`,
  ],
  caveClutch: [
    (a, b) => `${a} winds up from ten feet out and hurls the idol piece. It sails into the cave mouth. Challenge over.`,
    (a, b) => `${b} can't get close to the cave, so they throw the idol underhand. It lands perfectly. Somehow.`,
  ],
};
```

- [ ] **Step 5: Populate totem texts (4 per subtype)**

```js
const TA_TOTEM_TEXTS = {
  badmouth: [
    (villain, partner, target) => `${villain} holds up ${target}'s head. "This one was a waste of a platter."`,
    (villain, partner, target) => `${villain}: "Oh, ${target}. Remember? Zero game. Zero threat. Barely a player."`,
  ],
  defend: [
    (hero, target) => `${hero} places ${target}'s head gently on the pile. "They were good."`,
    (hero, target) => `${hero}: "Hey — ${target} was funny. Don't talk about them like that."`,
  ],
  confusion: [
    (a, b, x, y) => `${a} and ${b} stare at the heads for ${x} and ${y}. The eyes are identical. The mouths are identical. One of them was voted out first. Which?`,
    (a, b, x, y) => `${a} holds up ${x}. ${b} holds up ${y}. They look at each other. Neither knows.`,
  ],
  carved: [
    (carver, target) => `${carver} quietly carves a tiny heart on the back of ${target}'s head when Chris isn't looking.`,
    (carver, target) => `${carver}'s fingers shake a little as they handle ${target}'s head. A small "+ ${carver[0]}" appears on the back.`,
  ],
  breakdown: [
    (villain, hero) => `${villain} keeps badmouthing. ${hero} finally snaps: "I can't do this with you. I really can't."`,
    (villain, hero) => `${hero} throws down the head they're holding. "I'm done. I am DONE."`,
  ],
};
```

- [ ] **Step 6: Populate chrisQuips (8+ variants)**

```js
const TA_CHRIS_QUIPS = [
  `"I love this one." — Chris McLean`,
  `"That is NOT in the liability waiver." — Chris McLean`,
  `"This is great television." — Chris McLean`,
  `"Three events in, we could have a triple-tie situation." — Chris McLean`,
  `"The wimp key is real, people. Last chance!" — Chris McLean`,
  `"Somebody's going home tonight. Maybe everyone's going home tonight." — Chris McLean`,
];
```

- [ ] **Step 7: Populate aftermath (3-4 variants each)**

```js
const TA_AFTERMATH_SINGLE = [
  `The winning pair get their cuffs cut. The others head to tribal with targets on their backs.`,
  `Invincibility decided. The losing pairs already know one of them isn't sleeping in a bed tomorrow.`,
];

const TA_AFTERMATH_TRIPLE = [
  `Nobody wins. Everyone votes. Everyone can be voted. This is why Chris does this.`,
  `Triple-tie. Nobody is safe. Chris grins like he planned this. Maybe he did.`,
];
```

- [ ] **Step 8: Implement `_textTriArmedTriathlon`**

```js
export function _textTriArmedTriathlon(ep, ln, sec) {
  const tri = ep.triArmedTriathlon;
  if (!tri?.timeline?.length) return;

  sec('TRIAL BY TRI-ARMED TRIATHLON');
  ln('Post-merge challenge. Handcuffed pairs run three sub-challenges: Chowdown, Idol Haul, Totem Pole.');
  ln('');

  sec('PAIRINGS');
  tri.pairs.forEach(p => {
    ln(`  Pair ${p.id + 1}: ${p.members.join(' & ')}${p.wimpKeyTaken ? ' [WIMP KEYED]' : ''}`);
  });
  if (tri.spectator) ln(`  Spectator: ${tri.spectator}`);
  ln('');

  sec('TIMELINE');
  tri.timeline.forEach(evt => {
    if (evt.type === 'chrisIntro' || evt.type === 'chrisQuip') ln(`  [CHRIS] ${evt.text}`);
    else if (evt.type === 'pairingReveal' || evt.type === 'handcuffed') ln(`  [PAIR] ${evt.text}`);
    else if (evt.type === 'wimpKeyOffer') ln(`  [WIMP OFFER #${evt.offerIndex + 1}] ${evt.decisions.filter(d => d.taken).length} pairs took the key`);
    else if (evt.type === 'wimpKeyTaken') ln(`  [WIMPED] ${evt.text}`);
    else if (evt.type === 'chowdownSetup' || evt.type === 'totemSetup') ln(`  [SETUP] ${evt.text}`);
    else if (evt.type === 'chowdownEvent' || evt.type === 'totemEvent') ln(`  [${evt.subtype?.toUpperCase() || 'EVENT'}] ${evt.text}`);
    else if (evt.type && evt.type.startsWith('idol')) ln(`  [${(evt.phase || 'IDOL').toUpperCase()}] ${evt.text}`);
    else if (evt.type === 'chowdownWin' || evt.type === 'idolWin' || evt.type === 'totemWin') ln(`  [WIN] ${evt.text}`);
    else if (evt.type === 'finalScoreReveal') {
      ln('');
      sec('FINAL SCORE');
      evt.pairs.forEach(p => {
        const marks = [p.details.chowdown ? '✓' : '✗', p.details.idol ? '✓' : '✗', p.details.totem ? '✓' : '✗'];
        ln(`  ${p.members.join(' & ')}${p.wimpKeyTaken ? ' 🔓' : ''}: ${marks.join(' ')} (${p.wins} wins)`);
      });
      ln('');
      if (evt.tripleTie) ln('  OUTCOME: TRIPLE-TIE. NO INVINCIBILITY.');
      else if (evt.winnerPair !== null) ln(`  OUTCOME: INVINCIBILITY to ${evt.immune.join(' & ')}`);
      else ln('  OUTCOME: NO WINNER (all pairs wimp-keyed or tied at 0).');
    }
  });

  ln('');
  sec('AFTERMATH');
  ln(tri.tripleTie ? (_rp(TA_AFTERMATH_TRIPLE) || '') : (_rp(TA_AFTERMATH_SINGLE) || ''));
}
```

- [ ] **Step 9: Validate + commit**

```bash
node --check js/chal/tri-armed-triathlon.js
git add js/chal/tri-armed-triathlon.js
git commit -m "feat(tri-armed): text pools + text backlog generator"
```

---

## Task 12: Manual verification

**Files:** none (verification only).

- [ ] **Step 1: Serve simulator + trigger the challenge**

```bash
cd <repo root>
python -m http.server 8765
```

Open `http://localhost:8765/simulator.html` in a browser. Build or load a post-merge season with 4/6/8 active players.

Force-trigger the twist. If the season's RNG doesn't cooperate, use the browser console to set `seasonConfig.forceNextTwist = 'tri-armed-triathlon'` if that knob exists, OR manually set `gs.episode` to a post-merge episode and re-run.

- [ ] **Step 2: Verify the VP renders**

1. Header with "Trial by Tri-Armed Triathlon" title and chain decorations swaying.
2. Subtitle "3 CHALLENGES · N PAIRS · ONE KEY TO FREEDOM".
3. Scrolling ticker with rule reminders + Chris quips.
4. Sticky scoreboard with 3 empty slots ("CHOWDOWN · IDOL HAUL · TOTEM POLE · PENDING —").
5. Reveal button "NEXT BEAT (1/N)".

- [ ] **Step 3: Click through every reveal**

Verify:

1. **Pairing reveal.** Each pair shows up in its own card with the handcuff-chain banner between portraits. Chain visibly jiggles.
2. **Wimp key offer.** Card shows spinning key emoji. Each pair's decision renders as REFUSED/TAKEN with green/red label.
3. **Chowdown events.** Pair banner visible on every event card. Variety of subtypes across pairs. Gross-out and vomit events shake the card.
4. **Chowdown win.** Scoreboard slot 0 ("CHOWDOWN") fills with the winning pair's names + handcuff icon.
5. **Idol haul events.** Canoe / find / piggyback / cave phases each have distinct emoji labels (🚣 🚨 🏃 🕷️). Cave events with spider/wooly shake the card.
6. **Idol win.** Scoreboard slot 1 fills.
7. **Totem events.** Variety: badmouth (red TRASH TALK stamp), defend (green DEFENDS stamp), confusion (STUCK stamp), carved (pink ROMANCE stamp), breakdown (shakes + red).
8. **Totem win.** Scoreboard slot 2 fills.
9. **Final score reveal.** Scoreboard table renders with ✓/✗ per pair per sub-challenge. Then:
    - Single winner: gold banner with "🏆 INVINCIBILITY" + pair banner + "BOTH MEMBERS ARE IMMUNE TONIGHT".
    - Triple tie: red/black striped warning "NO INVINCIBILITY · ALL THREE PAIRS WIN ONE CHALLENGE · EVERYONE IS VULNERABLE AT TRIBAL". Banner shakes on reveal.
10. **Wimp-key edge case.** If a pair takes the wimp key, their banner shows the chain BROKEN (links flying apart) and they're excluded from the final-score table's winner computation.

- [ ] **Step 4: Edge cases**

- Run with 4 players → 2 pairs. Final can be 2-0 (single winner) or 1-1 (triple-tie-like situation, but only 2 pairs so actually a 1-1 tie).
    - **Known edge:** with 2 pairs, a 1-1 tie isn't a "triple-tie" per se but also has no single winner. The code returns `winnerPair = null` and the triple-tie banner shows with copy adjusted to "NO WINNER" (code already handles).
- Run with odd count (5, 7, 9) → one player becomes spectator. Verify the spectator is listed in text backlog but doesn't appear in any pair banner.
- Run with 8 players → 4 pairs. Scoreboard still 3 slots; final table shows 4 rows.
- Run post-merge with 0 eliminated players somehow → totem phase emits setup event but skips without crashing.

- [ ] **Step 5: Text backlog**

Click the backlog/export button (or call the text function manually via console). Confirm:

- Section headers (`TRIAL BY TRI-ARMED TRIATHLON`, `PAIRINGS`, `TIMELINE`, `FINAL SCORE`, `AFTERMATH`).
- Pair listing correct.
- Timeline events formatted with bracketed tags.
- Final score table with ✓/✗ marks.
- Correct outcome line (tie / invincibility / no winner).

- [ ] **Step 6: Console hygiene**

Open DevTools. Click through the entire VP. Confirm no errors, no warnings beyond pre-existing noise.

- [ ] **Step 7: Fix any bugs surfaced**

Commit fixes with `fix(tri-armed): <description>`.

- [ ] **Step 8: Update project memory**

Create `C:\Users\yanna\.claude\projects\C--Users-yanna-OneDrive-Documents-GitHub-dc-franchise-db\memory\project_tri_armed_triathlon.md`:

```markdown
---
name: Trial by Tri-Armed Triathlon
description: Post-merge challenge — handcuffed pairs compete in 3 sub-challenges (chowdown, idol haul, totem pole). Triple-tie can yield no invincibility.
type: project
---

Shipped 2026-04-16.

**Twist ID:** `tri-armed-triathlon`. Post-merge only. Min 4 players. Mutually exclusive with all other challenges.

**Structure:**
- Pairing phase (random + drama bias, showmances kept together)
- Wimp Key offered 3×, pair-level decision
- Chowdown (eat-off) → Idol Haul (canoe+idol+piggyback+cave) → Totem Pole (memory puzzle)
- Scoring: 1 point per sub-challenge
- Triple-tie → no invincibility (canonical outcome)

**Identity:** summer-camp tournament — wood/rope/chalkboard + handcuff-chain SVG between paired portraits. Distinct from all other challenge themes.

**File:** `js/chal/tri-armed-triathlon.js` (~2000 lines). Integration wired in episode.js / twists.js / main.js / vp-screens.js / text-backlog.js.

**Spec:** `docs/superpowers/specs/2026-04-16-tri-armed-triathlon-design.md`
**Plan:** `docs/superpowers/plans/2026-04-16-tri-armed-triathlon.md`

**Known gaps for future polish:** no per-card timestamps, no beat-by-beat within sub-challenges (each sub-challenge resolves holistically for each pair — consider a beat-pass follow-up similar to Hunt Encounters if the middle sags).
```

Update `MEMORY.md` index to reference it.

---

## Files touched at completion

- `js/chal/tri-armed-triathlon.js` (~2000 lines new)
- `js/episode.js` (2 lines: import + route)
- `js/twists.js` (~15 lines: twist catalog entry + engine route)
- `js/main.js` (~5 lines: engine map entry)
- `js/vp-screens.js` (~3 lines: import + rpBuild register)
- `js/text-backlog.js` (~2 lines: import + register)
- `js/savestate.js` (probably 0 lines — `ep.triArmedTriathlon` is a plain object, should serialize as-is)

## Files NOT touched

- No other `js/chal/*.js` files.
- No changes to `js/core.js`, `js/players.js`, `js/bonds.js`, `js/romance.js`, `js/alliances.js`, `js/voting.js`, `js/advantages.js`, `js/finale.js`, `js/challenges-core.js`, `js/aftermath.js`, `js/vp-ui.js`, `js/cast-ui.js`, `js/run-ui.js`.
- No changes to `franchise_roster.json` or asset files.
- No changes to other spec/plan files.
