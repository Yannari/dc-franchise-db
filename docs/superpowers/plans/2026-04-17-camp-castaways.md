# Camp Castaways — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement "Camp Castaways" — a post-merge survival-scoring challenge where a flood scatters players across a deserted island in groups, personal scores accumulate across 5 phases (flood → scattered → night → regrouping → storming camp), the highest scorer wins individual immunity, and a real tribal follows. Features Mr. Coconut breakdown, Chris surveillance mechanic with playback callbacks, and a 3-mode VP identity (surveillance / castaway diary / emergency broadcast).

**Architecture:** Single challenge module (`js/chal/camp-castaways.js`) exporting `simulateCampCastaways`, `rpBuildCampCastaways`, and `_textCampCastaways`. Follows the same integration pattern as Wawanakwa Gone Wild / Off the Chain / Hide and Be Sneaky — wired into main.js, episode.js, twists.js, core.js, vp-screens.js, text-backlog.js, savestate.js, run-ui.js, alliances.js heat, debug tab.

**Tech Stack:** Vanilla ES modules, no build step. Verification: `node --check` + manual browser smoke test via `simulator.html`.

**Design spec:** `docs/superpowers/specs/2026-04-17-camp-castaways-design.md`

---

## Setup

Before starting:

1. Read the design spec end-to-end (484 lines), especially §Phases, §Core Mechanics, §VP Architecture, §Episode Integration.
2. Reference regions in existing challenges:
   - `js/chal/sucky-outdoors.js` — closest analog (survival scoring, multi-phase, wildlife encounters, personalScores pattern). Study lines 7-1680 (simulate), 1873-1914 (text), 1915-2170 (VP).
   - `js/chal/wawanakwa-gone-wild.js` — post-merge individual challenge dispatch pattern (ep.immunityWinner, ep.tribalPlayers). Study the simulate function's resolution section.
   - `js/chal/hide-and-be-sneaky.js` — another post-merge individual challenge with VP click-to-reveal pattern. Study rpBuild structure.
3. Reference integration files:
   - `js/core.js` line 127 — TWIST_CATALOG entries for post-merge challenges
   - `js/twists.js` lines 1295-1315 — applyTwist dispatch for post-merge challenges
   - `js/episode.js` lines 2038-2041 — challenge dispatch (isWawanakwaGoneWild pattern)
   - `js/episode.js` line 2242 — updateChalRecord skip list
   - `js/main.js` lines 31-33 + 202-204 — import + CHALLENGES registry
   - `js/vp-screens.js` lines 6-7, 616, 1995, 2693, 10254-10260 — VP wiring
   - `js/text-backlog.js` lines 26-27, 1926-1927 — text routing
   - `js/savestate.js` lines 135-138 — patchEpisodeHistory
   - `js/run-ui.js` lines 252-254 — timeline tags

**Commit convention:** `feat(castaways): <description>` for features. `fix(castaways): <description>` for bug fixes.

---

## Task 1: Create Module — Constants, Event Pools, Text Pools, Helpers

**Files:**
- Create: `js/chal/camp-castaways.js`

- [ ] **Step 1: Create the file with imports and constant pools**

```javascript
// js/chal/camp-castaways.js — Camp Castaways survival-scoring challenge
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';
```

Constants to define:

```javascript
// ── ARCHETYPE HELPERS ──
const VILLAIN_ARCHETYPES = ['villain', 'mastermind', 'schemer'];
const NICE_ARCHETYPES = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];

// ── MR. COCONUT OBJECT POOL ──
// { id, name, namePool: [possible names based on archetype] }
const BREAKDOWN_OBJECTS = [
  { id: 'coconut', name: 'coconut', namePool: { villain: 'Mr. Coconut', hero: 'Coco', wildcard: 'Dr. Coconut', default: 'Mr. Coconut' } },
  { id: 'stick', name: 'stick', namePool: { villain: 'Chief', hero: 'Sticky', wildcard: 'The Colonel', default: 'Sticky' } },
  { id: 'rock', name: 'rock', namePool: { villain: 'Big Guy', hero: 'Rocky', wildcard: 'Professor Stone', default: 'Rocky' } },
  { id: 'shell', name: 'shell', namePool: { villain: 'Shelly', hero: 'Shelly', wildcard: 'Admiral Shell', default: 'Shelly' } },
  { id: 'driftwood', name: 'driftwood', namePool: { villain: 'The Captain', hero: 'Woody', wildcard: 'Lord Plank', default: 'The Captain' } },
  { id: 'can', name: 'empty can', namePool: { villain: 'Cannie', hero: 'Tin', wildcard: 'El Cano', default: 'Cannie' } },
  { id: 'volleyball', name: 'volleyball-shaped prop', namePool: { villain: 'Wilson', hero: 'Wilson', wildcard: 'Señor Wilson', default: 'Wilson' } },
];

// ── CHRIS REACTION TYPES + TEXT POOLS ──
const CHRIS_REACTIONS = {
  entertained: [
    `"AND THAT'S the shot I needed." — Chris McLean`,
    `"THIS is why we do this show." — Chris McLean`,
    `"Intern expense: JUSTIFIED." — Chris McLean`,
  ],
  horrified: [
    `"That was NOT in the budget." — Chris McLean`,
    `"I need legal on line one." — Chris McLean`,
  ],
  impressed: [
    `"And THAT is why I signed this cast." — Chris McLean`,
    `"I love this job." — Chris McLean`,
  ],
  vindicated: [
    `"Worth every penny." — Chris McLean`,
    `"I told you the flood idea would work." — Chris McLean`,
  ],
  confused: [
    `"Was that... real? Check the budget for therapy interns." — Chris McLean`,
    `"My villain is BONDING with the underdog? Reshoot." — Chris McLean`,
  ],
};

// ── WILDLIFE ENCOUNTER POOL ──
// Each: { id, name, stat requirements, brave/panic/neutral outcomes, score deltas }
const WILDLIFE = [
  { id: 'shark',       name: 'Shark Sighting',         nearWater: true,  braveStat: 'boldness',  braveThreshold: 0.06, braveScore: 2.0, panicScore: -1.5 },
  { id: 'trex-skull',  name: 'T-Rex Skull',            nearWater: false, detectStat: 'mental',   detectScore: 0.5,  scareScore: -0.5 },
  { id: 'pterodactyl', name: 'Pterodactyl / Large Goose', nearWater: false, braveStat: 'boldness', braveScore: 1.0, panicScore: -1.0, rescuerScore: 1.5 },
  { id: 'python',      name: 'Python',                 nearWater: false, braveStat: 'boldness',  braveScore: 1.5, panicScore: -1.0 },
  { id: 'raccoon',     name: 'Raccoon Raid',           nearWater: false, defenderStat: 'intuition', failScore: -1.0 },
  { id: 'mosquito',    name: 'Mosquito Swarm',         nearWater: false, sufferStat: 'endurance', sufferScore: -0.5 },
  { id: 'crab',        name: 'Crab Attack',            nearWater: true,  chaseScore: -0.5, groupBond: 0.3 },
  { id: 'boar',        name: 'Wild Boar',              nearWater: false, soloOnly: true, braveStat: 'physical', braveScore: 2.0, failScore: -1.0 },
  { id: 'seagull',     name: 'Seagull Steals Food',    nearWater: false, victimScore: -0.5 },
];
```

Text pools for each event type — Phase 0 reactions, Phase 1 survival events, Phase 2 night events, Phase 3 reunion events, Phase 4 climax events. Each pool should have 3-5 entries with `(name, pr)` or `(name, pr, targetName, targetPr)` signatures.

Key pools needed:
- `FLOOD_REACTIONS` — per-archetype-bucket: villain, hothead, social, hero, underdog, wildcard, default
- `FOOD_FINDING_TEXTS` — success, fail, mishap variants
- `SHELTER_TEXTS` — build, collapse, treehouse discovery
- `FIRE_TEXTS` — fail beats, fix-it
- `LOST_TEXTS` — solo, pair
- `FORCED_PROXIMITY_TEXTS` — enemies, strangers, unexpected alliance
- `VULNERABILITY_TEXTS` — confessions per archetype
- `NIGHT_COMEDY_TEXTS` — sleep-talk, 2am breakfast, headhunter paranoia, nightmare, seagull
- `NIGHT_DRAMA_TEXTS` — old wounds, playing everyone, hunger breakdown, survivor's guilt
- `NIGHT_HEARTFELT_TEXTS` — stargazing, comfort, unlikely friends, solo resolve
- `MR_COCONUT_TEXTS` — breaking point, introduction (per archetype), conversation (per archetype), others react
- `REUNION_TEXTS` — emotional, tense, raft, pterodactyl carry, war paint, "I knew it", shared suffering
- `STORM_TEXTS` — discovery, charge, chef scared, chris unbothered, playback, reveal

- [ ] **Step 2: Implement helper functions**

```javascript
function _rp(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}

function getArchetype(name) { return players.find(p => p.name === name)?.archetype || ''; }
function isVillainArch(name) { return VILLAIN_ARCHETYPES.includes(getArchetype(name)); }
function isNiceArch(name) { return NICE_ARCHETYPES.includes(getArchetype(name)); }
function isSchemeEligible(name) {
  if (isVillainArch(name)) return true;
  const s = pStats(name);
  return !isNiceArch(name) && s.strategic >= 6 && s.loyalty <= 4;
}

// Group formation: random split into groups of 1-3 ignoring alliances/tribes
function formGroups(playerList) {
  const shuffled = [...playerList].sort(() => Math.random() - 0.5);
  const groups = [];
  let i = 0;
  while (i < shuffled.length) {
    const remaining = shuffled.length - i;
    let size;
    if (remaining <= 3) { size = remaining; }
    else if (remaining === 4) { size = 2; } // avoid leaving 1 alone
    else { size = Math.random() < 0.6 ? 2 : (Math.random() < 0.5 ? 3 : 1); }
    // Avoid solos if possible when enough players remain
    if (size === 1 && remaining > 3 && Math.random() < 0.7) size = 2;
    groups.push(shuffled.slice(i, i + size));
    i += size;
  }
  return groups;
}
```

- [ ] **Step 3: Commit**

```bash
git add js/chal/camp-castaways.js
git commit -m "feat(castaways): scaffold module — constants, event pools, text pools, helpers

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 2: Simulation — Phase 0 (Flood Cold Open) + Phase 1 (Scattered)

**Files:**
- Modify: `js/chal/camp-castaways.js`

- [ ] **Step 1: Begin `simulateCampCastaways(ep)` with Phase 0 + Phase 1**

```javascript
export function simulateCampCastaways(ep) {
  const activePlayers = [...gs.activePlayers];
  const personalScores = {};
  activePlayers.forEach(n => { personalScores[n] = 0; });

  const timeline = [];        // chronological event log for VP
  const badges = {};           // { name: badgeKey }
  const cameraFlags = [];      // gs._castawaysCamera entries

  // ══ PHASE 0 — THE FLOOD (cold open, no scoring) ══
  // Chris tannoy announcement
  timeline.push({ type: 'chrisAnnounce', phase: 0, text: '...' });
  // Per-player confessional reaction (archetype-gated from FLOOD_REACTIONS)
  activePlayers.forEach(name => {
    const arch = getArchetype(name);
    const pr = pronouns(name);
    // Select reaction bucket based on archetype
    const bucket = VILLAIN_ARCHETYPES.includes(arch) ? 'villain'
      : ['hothead','chaos-agent'].includes(arch) ? 'hothead'
      : ['social-butterfly','showmancer'].includes(arch) ? 'social'
      : ['hero','loyal-soldier'].includes(arch) ? 'hero'
      : ['underdog','floater','goat'].includes(arch) ? 'underdog'
      : arch === 'wildcard' ? 'wildcard' : 'default';
    const text = _rp(FLOOD_REACTIONS[bucket])(name, pr);
    timeline.push({ type: 'floodReaction', phase: 0, player: name, archBucket: bucket, text });
  });

  // ══ PHASE 1 — SCATTERED ══
  const groups = formGroups(activePlayers);
  const groupLabels = groups.map((_, i) => String.fromCharCode(65 + i)); // A, B, C, ...

  groups.forEach((group, gi) => {
    const label = groupLabels[gi];
    const eventCount = Math.max(3, group.length + 1 + (Math.random() < 0.3 ? 1 : 0));
    // ... fire survival + social events per group
  });
```

- [ ] **Step 2: Implement Phase 1 survival events**

For each group, fire 2-3 survival events from pool:
- **Food Finding** (~60%): `intuition * 0.04 + mental * 0.03 + endurance * 0.02` → success/fail/mishap
- **Shelter Building** (~50%, groups ≥ 2): `endurance * 0.05 + mental * 0.04` → quality, collapse, treehouse
- **Wildlife Encounters** (1-2 per group from WILDLIFE pool, no repeats within group): stat-proportional brave/panic/neutral outcomes
- **Fire-Starting** (~40%): comedy beats, lowest-mental tries, high-mental fixes
- **Getting Lost** (~25% solo/low-intuition): circle-back comedy, pair blame

Each event:
- Modifies `personalScores[name]` proportionally
- May modify bonds (`addBond`)
- May flag `cameraFlags.push({ player, type, text, reactionType })`
- Pushes to `timeline[]` with `{ type, phase: 1, group: label, players: [...], text, badgeText?, badgeClass? }`

- [ ] **Step 3: Implement Phase 1 social events**

For each group, fire 1-2 social events:
- **Forced Proximity — Enemies** (auto if bond ≤ −2 pair exists): argument, bond −0.4, −0.5 each
- **Forced Proximity — Strangers** (low interaction pair): `social * 0.04 + temperament * 0.03` → warmth or dislike
- **Unexpected Alliance** (both strategic ≥ 6): 50% quiet strategy talk
- **Vulnerability Confession** (solo/pair, highest temperament): archetype-flavored, bond + score
- **Homesickness** (low-boldness/underdog): introspective or groupmate response
- **Scheming in Isolation** (schemer-eligible + target): `social + strategic ≥ 12` check vs target intuition
- **Comedy Chaos** (argument about nothing): −0.2 each, Chris `'entertained'`

- [ ] **Step 4: Commit**

```bash
git add js/chal/camp-castaways.js
git commit -m "feat(castaways): Phase 0 flood cold open + Phase 1 scattered survival/social events

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 3: Simulation — Phase 2 (The Night) + Mr. Coconut Breakdown

**Files:**
- Modify: `js/chal/camp-castaways.js`

- [ ] **Step 1: Phase 2 — Night events (3-5 per group/solo)**

Event buckets — fire at most 1 from each bucket per group:

**Comedy bucket:**
- Sleep Talking: lowest-mental or highest-boldness, reveals embarrassing/strategic secret
- 2am Breakfast: highest-hunger player wakes everyone, −0.5 cook, bond −0.2
- Headhunter Paranoia: low-mental solo/pair, elaborate trap comedy
- Nightmare Scream: low-temperament, wakes group, shared adrenaline bond
- Seagull in Shelter: food stolen, someone pecked, group bond +0.3

**Drama bucket:**
- Old Wounds Surface: unresolved history pair stuck together, intuition-gated resolution vs escalation
- "I've Been Playing Everyone": high-strategic villain with trusted ally, confession event
- Hunger Breakdown: lowest-endurance, not funny, social-gated comfort response
- Survivor's Guilt: solo player reflects on jury betrayals, references actual `gs.episodeHistory`

**Heartfelt bucket:**
- Stargazing Confession: pair bond ≥ 1, archetype-flavored real talk, romance spark check
- Comfort in the Dark: high-social/loyal comforts struggling player, bond +0.6
- Unlikely Friends: bond between −1 and +1, find common ground, bond +0.4
- Solo Resolve: solo player has clarity moment, +0.5 score, +1 popularity

- [ ] **Step 2: Mr. Coconut Breakdown**

Fires during Phase 2. Probabilistic:
```javascript
// Sort by mental + temperament ascending
const candidates = activePlayers.map(n => ({ name: n, score: pStats(n).mental + pStats(n).temperament }))
  .sort((a, b) => a.score - b.score);
const breakdowns = [];
// First candidate: 30% chance
if (Math.random() < 0.30) {
  breakdowns.push(_fireBreakdown(candidates[0].name, groups, timeline, cameraFlags, personalScores));
}
// Second candidate: 15% chance (only if different from first)
if (candidates.length > 1 && Math.random() < 0.15) {
  breakdowns.push(_fireBreakdown(candidates[1].name, groups, timeline, cameraFlags, personalScores));
}
```

`_fireBreakdown(name, ...)`:
- Beat 1 — Breaking Point: quiet moment, find the object
- Beat 2 — Introduction: archetype-gated naming from BREAKDOWN_OBJECTS
- Beat 3 — Conversation: 5-6 text options per archetype bucket (strategy, loneliness, fear, love, funny). One reveals a game-relevant secret.
- Beat 4 — Others React: amused / concerned / judging / joining-in (20% if another low-mental player present)
- Score: −2.0 to breakdown player
- Camera flag: `{ player, type: 'breakdown', text: ..., reactionType: 'entertained' }`
- Store: `ep.castawaysBreakdowns.push({ player: name, object: obj.name, objectName: assignedName })`

- [ ] **Step 3: Commit**

```bash
git add js/chal/camp-castaways.js
git commit -m "feat(castaways): Phase 2 night events + Mr. Coconut breakdown mechanic

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 4: Simulation — Phase 3 (Regrouping) + Phase 4 (Storming the Camp)

**Files:**
- Modify: `js/chal/camp-castaways.js`

- [ ] **Step 1: Phase 3 — Regrouping (3-4 reunion events)**

Reunion mechanic: players with `getBond(a, b) >= 3` have 70% chance of seeking each other. Bold players (boldness ≥ 7) actively search. Low-bond/timid wait.

Reunion event types:
- **Emotional Reunion** (bond ≥ 3): +0.5 both, bond +0.3
- **Tense Reunion** (bond ≤ −1): cold comment, bond −0.2, −0.3 each
- **Raft Circles Back**: −0.5 rafter, others bond +0.3, Chris `'entertained'`
- **Pterodactyl Carry**: brave = +1.0, panic = −0.5, rescuer +1.5 + bond +0.4
- **War Paint Preparation**: boldness ≥ 7, +1.0 participants, +0.2 watchers
- **"I Knew It Was A Challenge"**: high-strategic/intuition, found camp = +1.0 + pop +1, wrong = −0.3 comedy
- **Mr. Coconut Carrier Still Has Object**: group reaction (amused/concerned/joining-in)
- **Shared Suffering Bond**: pair from same bad Phase 1/2 event, bond +0.4, +0.3 each

- [ ] **Step 2: Phase 4 — Storming the Camp (3-5 events)**

Events:
- **Discovery Beat**: bold player spots smoke first, +1.0, camera flag `'impressed'`
- **The Charge**: boldness ≥ 7 = charge leader (+2.0, pop +1), 4-6 = group (+0.5), ≤ 3 = neutral follower
- **Chef Scared**: comedy beat, war paint players get comedy credits
- **Chris Unbothered**: high-temperament confront (−0.5 from dismissal, +0.5 pop), high-social charm (30% tidbit), strategic assess
- **Surveillance Playback (2-3 beats)**: draw from `cameraFlags`, Chris narrates, subject reacts (embarrassment/pride/fury). Mr. Coconut breakdown always plays back if fired.
- **The Reveal**: Chris admits he engineered the flood. High-intuition = +0.5 "CALLED IT". Others: anger, −0.3.
- **Confrontation Scoring Bonus**: players with personalScore ≥ 5.0 by Phase 4 get +1.0 "Endurance Bonus"

- [ ] **Step 3: Commit**

```bash
git add js/chal/camp-castaways.js
git commit -m "feat(castaways): Phase 3 regrouping + Phase 4 storming the camp + surveillance playback

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 5: Simulation — Scoring Resolution, Immunity, Camp Events, ep Fields

**Files:**
- Modify: `js/chal/camp-castaways.js`

- [ ] **Step 1: Scoring resolution + immunity**

```javascript
// ══ RESOLUTION ══
// Sort by personalScore descending. Tiebreaker: boldness, then mental.
const sorted = [...activePlayers].sort((a, b) => {
  const diff = personalScores[b] - personalScores[a];
  if (Math.abs(diff) > 0.01) return diff;
  const sBold = pStats(b).boldness - pStats(a).boldness;
  if (sBold !== 0) return sBold;
  return pStats(b).mental - pStats(a).mental;
});

const immunityWinner = sorted[0];
const lowestScorer = sorted[sorted.length - 1];

timeline.push({ type: 'immunityReveal', phase: 4, player: immunityWinner, score: personalScores[immunityWinner], text: `...` });

popDelta(immunityWinner, 2);  // winner popularity
```

- [ ] **Step 2: Set episode fields**

```javascript
ep.challengeType = 'individual';
ep.challengeLabel = 'Camp Castaways';
ep.challengeCategory = 'survival';
ep.challengeDesc = 'Survive the night on a deserted island. Best survivor wins immunity.';
ep.isCampCastaways = true;
ep.immunityWinner = immunityWinner;
ep.tribalPlayers = gs.activePlayers.filter(p => p !== immunityWinner && !(ep.extraImmune || []).includes(p) && p !== gs.exileDuelPlayer);

ep.chalMemberScores = { ...personalScores };
updateChalRecord(ep);

ep.challengePlacements = sorted.map((name, i) => ({ name, place: i + 1, score: personalScores[name] }));

// Store challenge data for VP
ep.campCastaways = {
  timeline,
  groups: groups.map((g, i) => ({ label: groupLabels[i], members: [...g] })),
  personalScores: { ...personalScores },
  immunityWinner,
  lowestScorer,
  breakdowns: breakdowns.filter(Boolean),
  cameraFlags: [...cameraFlags],
  badges,
};
ep.castawaysGroups = groups.map((g, i) => ({ label: groupLabels[i], members: [...g] }));
ep.castawaysBreakdowns = breakdowns.filter(Boolean);
```

- [ ] **Step 3: Camp events (post-challenge)**

Pattern: `ep.campEvents[gs.mergeName || 'merge'].post.push(...)`. 3-4 events:

```javascript
const campKey = gs.mergeName || 'merge';
if (!ep.campEvents) ep.campEvents = {};
if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };

// SURVIVOR: top scorer
// THE BREAKDOWN: Mr. Coconut player (if fired)
// THE CALLED-IT: highest intuition player who survived well
// THE DISASTER: lowest scorer
// UNEXPECTED BOND: pair with biggest bond gain from episode
```

Each camp event has `{ type, text, players: [], badgeText, badgeClass }`.

- [ ] **Step 4: Heat system**

```javascript
// gs._castawaysHeat — fires for schemer detected, surveillance exposure, breakdown instability
gs._castawaysHeat = gs._castawaysHeat || [];
// Applied during event execution in Phases 1-4 when relevant
```

- [ ] **Step 5: Romance hooks**

```javascript
// Showmance moments (stargazing, forced proximity)
_checkShowmanceChalMoment(ep, activePlayers);
// Romance sparks checked during stargazing confession + forced proximity warmth
```

- [ ] **Step 6: Commit**

```bash
git add js/chal/camp-castaways.js
git commit -m "feat(castaways): scoring resolution, immunity, camp events, heat, romance hooks, ep fields

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 6: Text Backlog — `_textCampCastaways`

**Files:**
- Modify: `js/chal/camp-castaways.js`

- [ ] **Step 1: Implement _textCampCastaways**

Follows the `_textSuckyOutdoors` pattern (signature: `(ep, ln, sec)`):

```javascript
export function _textCampCastaways(ep, ln, sec) {
  if (!ep.isCampCastaways || !ep.campCastaways) return;
  const cc = ep.campCastaways;
  sec('CAMP CASTAWAYS');
  ln('A flash flood scatters the camp. Personal scores determine immunity.');
  ln('');

  // Groups
  ln('GROUPS:');
  cc.groups.forEach(g => {
    ln(`  Group ${g.label}: ${g.members.join(', ')}`);
  });
  ln('');

  // Personal scores
  ln('PERSONAL SCORES:');
  const sorted = Object.entries(cc.personalScores).sort(([,a],[,b]) => b - a);
  sorted.forEach(([name, score]) => {
    const status = name === cc.immunityWinner ? ' ★ IMMUNE' : name === cc.lowestScorer ? ' ⚠ LOWEST' : '';
    ln(`  ${name}: ${score.toFixed(1)}${status}`);
  });
  ln('');

  // Breakdowns
  if (cc.breakdowns?.length) {
    ln('MR. COCONUT BREAKDOWN:');
    cc.breakdowns.forEach(b => {
      ln(`  ${b.player} bonded with ${b.objectName} (${b.object})`);
    });
    ln('');
  }

  // Timeline
  ln('TIMELINE:');
  cc.timeline.forEach(evt => {
    const phaseTag = evt.phase !== undefined ? `P${evt.phase}` : '';
    const groupTag = evt.group ? ` G${evt.group}` : '';
    ln(`  [${phaseTag}${groupTag} ${(evt.type || '').toUpperCase()}] ${evt.text || ''}`);
  });
  ln('');

  ln(`IMMUNITY: ${cc.immunityWinner || 'None'}`);
}
```

- [ ] **Step 2: Commit**

```bash
git add js/chal/camp-castaways.js
git commit -m "feat(castaways): text backlog

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 7: VP Screen — Mode 1: Surveillance (Phase 0 + Phase 4)

**Files:**
- Modify: `js/chal/camp-castaways.js`

- [ ] **Step 1: Implement surveillance CSS class + renderer**

CSS identity (inline styles or class-based):
- Background: dark grey / near-black (`#0a0e0a`)
- Scanline overlay: `repeating-linear-gradient(0deg, rgba(0,255,0,0.03) 0px, transparent 2px)`
- Night-vision green tint: `rgba(0,255,65,0.06)` overlay
- Camera ID watermark: top-left, monospace, dim green (`CAM-03 / ISLAND EAST`)
- Timestamp: top-right, ticking appearance (CSS animation optional, or render seconds in text)
- Event cards: slide-in-from-left with slight horizontal offset
- Chris commentary: white-on-black VHS label strip, all-caps

```javascript
function _renderSurveillanceCard(evt, camId, timestamp) {
  // Night-vision green border, monospace text, glitch aesthetic
  // Camera label + timestamp header
  // Event text + player portrait if applicable
}
```

- [ ] **Step 2: Phase 0 VP screen — Flood Cold Open**

`_tvState` key: `castawaysColdOpen`

```javascript
// Click-to-reveal per player reaction
// Each reaction card: surveillance mode, player name + portrait, reaction text
// Ticking timestamp advances per reveal
```

- [ ] **Step 3: Phase 4 VP screens — Storming the Camp + Playback**

`_tvState` key: `castawaysStorm`

```javascript
// Monitor grid (3×2) concept: show 6 mini-cards in a grid layout
// PLAYBACK label on callback events
// Rewind glitch effect: brief CSS class flash before callback text
```

- [ ] **Step 4: Commit**

```bash
git add js/chal/camp-castaways.js
git commit -m "feat(castaways): VP surveillance mode — flood cold open + storming camp + playback

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 8: VP Screen — Mode 2: Castaway Diary (Phases 1-3)

**Files:**
- Modify: `js/chal/camp-castaways.js`

- [ ] **Step 1: Implement diary CSS + renderer**

CSS identity:
- Background: aged paper (`#f5e6c8` or warm cream)
- Subtle noise texture: CSS noise overlay or slight gradient variation
- Event panels: bordered with ink-style border, slightly rotated (±1-2deg random per panel via inline transform)
- Badges: ink-stamp style — red circle, bold, slightly imperfect rotation
- Font: serif for body, monospace for badges (use `font-family: serif` inline)
- Event reveal: panels "drop" in with rotation settle (opacity + transform transition)
- Phase headers: handwritten-style label

```javascript
function _renderDiaryPanel(evt, rotation) {
  const rot = rotation || ((Math.random() * 4) - 2); // ±2 degrees
  // Ink-bordered panel with aged-paper background
  // Slightly rotated
  // Ink-stamp badge if badge exists
  // Player portrait
}
```

- [ ] **Step 2: Scattered VP screens (one per group)**

`_tvState` keys: `castawaysGroupA`, `castawaysGroupB`, `castawaysGroupC` (dynamic based on group count)

```javascript
// Filter timeline by group label
// Click-to-reveal per event
// Each event = diary panel with ink-stamp badge
// Wildlife encounters get animal emoji in header
```

- [ ] **Step 3: Night VP screen**

`_tvState` key: `castawaysNight`

```javascript
// Diary mode base
// Chris commentary pops in as surveillance overlay (brief green-tinted card breaking diary style)
// Mr. Coconut breakdown gets a special multi-beat card sequence
// Heartfelt events get a softer ink-wash background
```

- [ ] **Step 4: Regrouping VP screen**

`_tvState` key: `castawaysRegroup`

```javascript
// Diary → Surveillance blend
// Diary panels with camera-flash interrupts when Chris reacts
// Score tracker sidebar (optional): per-player running score tally
```

- [ ] **Step 5: Commit**

```bash
git add js/chal/camp-castaways.js
git commit -m "feat(castaways): VP diary mode — scattered groups, night, regrouping + ink-stamp badges

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 9: VP Screen — Mode 3: Emergency Broadcast (Immunity Results)

**Files:**
- Modify: `js/chal/camp-castaways.js`

- [ ] **Step 1: Implement broadcast CSS + renderer**

CSS identity:
- Background: dark navy (`#0a0f1e`)
- Signal bar: top of screen, animated pulse (`SIGNAL FOUND` / `SIGNAL LOST` alternation)
- Ticker: scrolling text at bottom (player names + score deltas)
- Event text: clean, urgent, monospace, white on dark
- Static frame effect between reveals

```javascript
function _renderBroadcastCard(evt) {
  // EBS-style card: monospace, white text on dark navy
  // TRANSMISSION label
  // Signal-strength bar visualization per player (proportional to score)
}
```

- [ ] **Step 2: Immunity Results VP screen**

`_tvState` key: `castawaysImmunity`

```javascript
// Score leaderboard with signal-strength bars per player
// Click to reveal final scores one by one (lowest to highest)
// Last reveal = immunity winner with SIGNAL FOUND pulse
// Mr. Coconut elimination card if applicable (SIGNAL LOST → OBJECT IDENTIFIED → ELIMINATED)
```

- [ ] **Step 3: Commit**

```bash
git add js/chal/camp-castaways.js
git commit -m "feat(castaways): VP emergency broadcast mode — immunity results + signal bars

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 10: VP Master Builder — `rpBuildCampCastaways`

**Files:**
- Modify: `js/chal/camp-castaways.js`

- [ ] **Step 1: Implement rpBuildCampCastaways**

Master function that composes all VP screens into one scrollable experience:

```javascript
export function rpBuildCampCastaways(ep) {
  const cc = ep.campCastaways;
  if (!cc?.timeline?.length) return '';

  let html = '';

  // Mode transitions: CSS class swap + 3-frame glitch flash between modes
  // Glitch: brief white frame → horizontal tear → new mode (200ms transition class)

  // Screen 1: Flood Cold Open (Surveillance)
  html += _buildColdOpenScreen(cc, ep);

  // Screens 2-4: Scattered Groups (Diary) — one per group
  cc.groups.forEach((group, i) => {
    html += _buildGroupScreen(cc, group, ep);
  });

  // Screen 5: The Night (Diary + Surveillance interrupts)
  html += _buildNightScreen(cc, ep);

  // Screen 6: Regrouping (Diary → Surveillance blend)
  html += _buildRegroupScreen(cc, ep);

  // Screen 7: Storming the Camp (Surveillance)
  html += _buildStormScreen(cc, ep);

  // Screen 8: Immunity Results (Broadcast)
  html += _buildImmunityScreen(cc, ep);

  return html;
}
```

Each `_build*Screen` function:
- Initializes its `_tvState` key with `{ idx: -1 }`
- Filters `timeline` by phase + group
- Renders click-to-reveal cards using the appropriate mode renderer
- Handles mode transition glitch between sections

- [ ] **Step 2: Wire scrollTop preservation pattern**

```javascript
// Save/restore scrollTop when rebuilding VP screens from a reveal handler
// Preserve vpCurrentScreen by finding the screen index after buildVPScreens
```

- [ ] **Step 3: Commit**

```bash
git add js/chal/camp-castaways.js
git commit -m "feat(castaways): VP master builder with mode transitions, all 8 screens

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 11: Twist Registration & Full Dispatch Wiring

**Files:**
- Modify: `js/core.js` — TWIST_CATALOG
- Modify: `js/twists.js` — applyTwist
- Modify: `js/episode.js` — challenge dispatch + import + skip list
- Modify: `js/savestate.js` — patchEpisodeHistory
- Modify: `js/main.js` — import + CHALLENGES registry
- Modify: `js/text-backlog.js` — import + routing
- Modify: `js/vp-screens.js` — import + challenge tab gating + label + VP dispatch + cold open
- Modify: `js/run-ui.js` — timeline tag

- [ ] **Step 1: TWIST_CATALOG entry in `js/core.js`**

Add after the `wawanakwa-gone-wild` entry (line ~127):

```javascript
{ id:'camp-castaways', emoji:'🏝️', name:'Camp Castaways', category:'challenge', phase:'post-merge', desc:'Flash flood scatters the camp. Survival scoring across 5 phases. Best survivor wins individual immunity. Mr. Coconut breakdown. Chris surveillance with playback callbacks. Real tribal follows.', engineType:'camp-castaways', incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors','up-the-creek','paintball-hunt','hells-kitchen','trust-challenge','basic-straining','x-treme-torture','brunch-of-disgustingness','lucky-hunt','hide-and-be-sneaky','off-the-chain','wawanakwa-gone-wild','tri-armed-triathlon'] },
```

Also add `'camp-castaways'` to the `incompatible` arrays of ALL other challenge twist entries.

- [ ] **Step 2: applyTwist dispatch in `js/twists.js`**

Add after the `wawanakwa-gone-wild` block (after line ~1310):

```javascript
} else if (engineType === 'camp-castaways') {
  if (!gs.isMerged) {
    const _ccMerging = gs.activePlayers.length <= (seasonConfig.mergeAt || 12);
    if (!_ccMerging) return;
  }
  if (gs.activePlayers.length < 4) return;
  ep.isCampCastaways = true;
```

- [ ] **Step 3: Challenge dispatch in `js/episode.js`**

Add after the `isWawanakwaGoneWild` block (after line ~2041):

```javascript
} else if (ep.isCampCastaways) {
  // ── CAMP CASTAWAYS: post-merge survival scoring ──
  simulateCampCastaways(ep);
  ep.tribalPlayers = gs.activePlayers.filter(p => p !== ep.immunityWinner && !(ep.extraImmune || []).includes(p) && p !== gs.exileDuelPlayer);
```

Add import near the top (after line ~40):

```javascript
import { simulateCampCastaways } from './chal/camp-castaways.js';
```

- [ ] **Step 4: updateChalRecord skip list in `js/episode.js`**

Add `&& !ep.isCampCastaways` to the long chain at line ~2242.

- [ ] **Step 5: patchEpisodeHistory in `js/savestate.js`**

Add after the `isWawanakwaGoneWild` block (after line ~136):

```javascript
if (ep.isCampCastaways) h.isCampCastaways = true;
if (!h.campCastaways && ep.campCastaways) h.campCastaways = ep.campCastaways;
```

- [ ] **Step 6: main.js — import + CHALLENGES registry**

Add import:
```javascript
import * as campCastawaysMod from './chal/camp-castaways.js';
```

Add to CHALLENGES:
```javascript
'camp-castaways': { simulate: campCastawaysMod.simulateCampCastaways, rpBuild: campCastawaysMod.rpBuildCampCastaways, text: campCastawaysMod._textCampCastaways },
```

- [ ] **Step 7: text-backlog.js — import + routing**

Add import:
```javascript
import { _textCampCastaways } from './chal/camp-castaways.js';
```

Add call near line ~1927:
```javascript
_textCampCastaways(ep, ln, sec);
```

- [ ] **Step 8: vp-screens.js — full wiring**

Add import:
```javascript
import { rpBuildCampCastaways } from './chal/camp-castaways.js';
```

Challenge tab gating (line ~1995): Add `|| ep.isCampCastaways` to the condition.

Challenge type label (line ~2693): Add `ep.isCampCastaways ? 'Camp Castaways' :` to the ternary chain.

VP screen push (line ~10257): Add after the `isWawanakwaGoneWild` block:
```javascript
} else if (ep.isCampCastaways && ep.campCastaways) {
  vpScreens.push({ id:'camp-castaways', label:'Camp Castaways', html: rpBuildCampCastaways(ep) });
```

Exclusion list (line ~10260): Add `&& !ep.isCampCastaways` to the generic challenge screen condition.

- [ ] **Step 9: run-ui.js — timeline tag**

Add after the `wwTag` line (~253):

```javascript
const ccTag = ep.isCampCastaways ? `<span class="ep-hist-tag" style="background:rgba(0,128,64,0.12);color:#00a854">Castaways</span>` : '';
```

Include `${ccTag}` in the tag rendering.

- [ ] **Step 10: Cold open hook in vp-screens.js**

Add after the `prevEp.isWawanakwaGoneWild` cold open block (~line 630):

```javascript
if (prevEp.isCampCastaways && prevEp.campCastaways) {
  const _cc = prevEp.campCastaways;
  const hasBreakdown = _cc.breakdowns?.length > 0;
  html += `<div class="vp-card" style="border-color:rgba(0,168,84,0.15);margin-bottom:8px">
    <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#00a854;margin-bottom:4px">CAMP CASTAWAYS</div>
    <div style="font-size:12px;color:#8b949e">${_cc.immunityWinner} won immunity after the flood.${hasBreakdown ? ` ${_cc.breakdowns[0].player} had a breakdown with ${_cc.breakdowns[0].objectName}.` : ''} ${_cc.lowestScorer} scored lowest.</div>
  </div>`;
}
```

- [ ] **Step 11: Debug tab section in vp-screens.js**

Add after the WWG debug tab section (~line 2975):

```javascript
if (ep.campCastaways?.personalScores) {
  html += `<div style="font-family:var(--font-display);font-size:13px;color:#00a854;margin:16px 0 8px">Camp Castaways — Per Player</div>`;
  const ccSorted = Object.entries(ep.campCastaways.personalScores).sort(([,a],[,b]) => b - a);
  ccSorted.forEach(([name, score]) => {
    const isWinner = name === ep.campCastaways.immunityWinner;
    const breakdown = ep.campCastaways.breakdowns?.find(b => b.player === name);
    html += `<div style="font-size:9px;padding:1px 0;color:#6e7681">${name}: ${score.toFixed(1)}${isWinner ? ' ★ IMMUNE' : ''}${breakdown ? ` 🥥 ${breakdown.objectName}` : ''}</div>`;
  });
  html += `<div style="font-size:9px;color:#00a854;padding:2px 0;margin-top:4px">Groups: ${ep.campCastaways.groups?.map(g => `${g.label}(${g.members.join(',')})`).join(' · ') || '?'}</div>`;
  html += `<div style="font-size:9px;color:#6e7681">Timeline events: ${ep.campCastaways.timeline?.length || 0} · Camera flags: ${ep.campCastaways.cameraFlags?.length || 0}</div>`;
}
```

- [ ] **Step 12: Commit**

```bash
git add js/core.js js/twists.js js/episode.js js/savestate.js js/main.js js/text-backlog.js js/vp-screens.js js/run-ui.js js/chal/camp-castaways.js
git commit -m "feat(castaways): register twist + wire all integration points — dispatch, VP, text, savestate, debug, cold open, timeline tag

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 12: Smoke Test & Final Polish

- [ ] **Step 1: Syntax check**

```bash
node --check js/chal/camp-castaways.js
```

- [ ] **Step 2: Run in browser with Camp Castaways twist**

Configure a season, reach post-merge with 6+ players, schedule Camp Castaways, simulate.

- [ ] **Step 3: Verify VP screen**

Click through all 8+ screens:
- Phase 0: Surveillance mode, flood reactions, ticking timestamp
- Phase 1: Diary mode per group, survival + social events, ink-stamp badges
- Phase 2: Diary + surveillance interrupts, night events, Mr. Coconut breakdown (if fired)
- Phase 3: Diary → surveillance blend, reunion events
- Phase 4: Surveillance mode, monitor grid, playback callbacks
- Immunity: Broadcast mode, score leaderboard with signal bars
- Mode transitions: glitch flash between modes

- [ ] **Step 4: Verify text backlog**

Switch to text backlog. Confirm groups, personal scores, breakdowns, timeline all print.

- [ ] **Step 5: Verify debug tab**

Open debug tab. Confirm per-player score table, groups, camera flags count.

- [ ] **Step 6: Verify immunity + tribal**

Confirm winner is immune at tribal, standard vote proceeds, no auto-elimination.

- [ ] **Step 7: Verify save/load**

Save state, reload, confirm `isCampCastaways` and `campCastaways` data survive.

- [ ] **Step 8: Verify cold open**

Run the next episode. Confirm cold open references Camp Castaways results.

- [ ] **Step 9: Verify incompatibilities**

Schedule Camp Castaways alongside another challenge twist. Confirm the conflict is detected and one is removed.

- [ ] **Step 10: Final commit**

```bash
git add -A
git commit -m "feat(castaways): Camp Castaways challenge complete — smoke tested

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Reference: Integration Point Inventory

| File | Line(s) | What to add |
|------|---------|-------------|
| `js/core.js` | ~128 | TWIST_CATALOG entry + add to all other challenge `incompatible` arrays |
| `js/twists.js` | ~1311 | `engineType === 'camp-castaways'` flag setting |
| `js/episode.js` | ~42 | Import `simulateCampCastaways` |
| `js/episode.js` | ~2042 | `ep.isCampCastaways` dispatch block |
| `js/episode.js` | ~2242 | `&& !ep.isCampCastaways` skip list |
| `js/savestate.js` | ~137 | `isCampCastaways` + `campCastaways` preservation |
| `js/main.js` | ~33 | Import `campCastawaysMod` |
| `js/main.js` | ~204 | CHALLENGES registry entry |
| `js/text-backlog.js` | ~28 | Import `_textCampCastaways` |
| `js/text-backlog.js` | ~1928 | Call `_textCampCastaways(ep, ln, sec)` |
| `js/vp-screens.js` | ~8 | Import `rpBuildCampCastaways` |
| `js/vp-screens.js` | ~616 | Cold open block |
| `js/vp-screens.js` | ~1995 | Challenge tab gating |
| `js/vp-screens.js` | ~2693 | Challenge type label |
| `js/vp-screens.js` | ~2975 | Debug tab section |
| `js/vp-screens.js` | ~10258 | VP screen push |
| `js/vp-screens.js` | ~10260 | Generic challenge exclusion |
| `js/run-ui.js` | ~254 | Timeline tag |

## Reference: ep Field Shape

```javascript
ep.isCampCastaways = true;
ep.challengeType = 'individual';
ep.challengeLabel = 'Camp Castaways';
ep.challengeCategory = 'survival';
ep.immunityWinner = 'PlayerName';
ep.chalMemberScores = { name: score, ... };
ep.castawaysGroups = [{ label: 'A', members: ['...'] }, ...];
ep.castawaysBreakdowns = [{ player, object, objectName }, ...];
ep.campCastaways = {
  timeline: [...],
  groups: [...],
  personalScores: { ... },
  immunityWinner: '...',
  lowestScorer: '...',
  breakdowns: [...],
  cameraFlags: [...],
  badges: { ... },
};
```
