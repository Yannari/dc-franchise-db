# Lucky Hunt Challenge — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **DEPENDENCY:** This plan requires the Social Manipulation Camp Events system (Plan A: `2026-04-14-social-manipulation-events.md`) to be implemented first. The Lucky Hunt calls `generateSocialManipulationEvents()` during its timeline.

**Goal:** Implement the Lucky Hunt challenge twist — a post-merge individual scavenger hunt with keys, chests, hunt events, and a unified chronological timeline.

**Architecture:** All changes in `simulator.html`. New function `simulateLuckyHunt(ep)` handles the challenge. Location pools, text pools, and hunt event functions are defined as constants/helpers near the function. VP screen `rpBuildLuckyHunt(ep)`, text backlog `_textLuckyHunt(ep, ln, sec)`, and debug tab section follow existing patterns for other challenge twists.

**Tech Stack:** Vanilla JS, single-file HTML app.

**Key patterns:**
- Post-merge individual challenge: `ep.challengeType = 'individual'`, `ep.immunityWinner = name`, `ep.tribalPlayers = gs.activePlayers.filter(p => p !== immunityWinner)`
- Twist catalog entry with `engineType: 'lucky-hunt'`, `phase: 'post-merge'`
- `applyTwist`: set `ep.isLuckyHunt = true`
- Add to updateChalRecord skip list
- `patchEpisodeHistory`: preserve `ep.isLuckyHunt` and `ep.luckyHunt`
- VP screen: `vpScreens.push({ id, label, html: rpBuildLuckyHunt(ep) })`

---

### Task 1: Twist Registration & Dispatch Wiring

**Files:**
- Modify: `simulator.html` — TWIST_CATALOG (~line 2534), applyTwist (~line 31618), challenge dispatch (~line 43228), updateChalRecord skip (~line 44435), patchEpisodeHistory (~line 53101), VP screen push (~line 76691), debug tab check (~line 58014)

- [ ] **Step 1: Add TWIST_CATALOG entry**

Find `TWIST_CATALOG` (search for `id:'say-uncle'`). Add after the last challenge replacement entry:

```javascript
  { id:'lucky-hunt', emoji:'🗝️', name:'Lucky Hunt', category:'challenge', phase:'post-merge', desc:'Scavenger hunt for keys to treasure chests. Random difficulty, random locations. Find your key, open your chest — one has immunity, one is a booby trap. Help allies, sabotage rivals, steal keys, or scheme in the chaos.', engineType:'lucky-hunt', incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors','up-the-creek','paintball-hunt','hells-kitchen','trust-challenge','basic-straining','x-treme-torture','brunch-of-disgustingness'] },
```

- [ ] **Step 2: Add applyTwist flag**

In `applyTwist`, find the post-merge challenge section. After `} else if (engineType === 'brunch-of-disgustingness') {`, add:

```javascript
  } else if (engineType === 'lucky-hunt') {
    if (!gs.isMerged && gs.activePlayers.length > 12) return; // post-merge or near-merge
    if (gs.activePlayers.length < 6) return;
    ep.isLuckyHunt = true;
```

- [ ] **Step 3: Add challenge dispatch**

In the challenge dispatch section (search for `ep.isSayUncle` dispatch), add:

```javascript
  } else if (ep.isLuckyHunt) {
    simulateLuckyHunt(ep);
```

- [ ] **Step 4: Add to updateChalRecord skip list**

Find the long `if (!ep.isDodgebrawl && !ep.isCliffDive && ...` condition. Add `&& !ep.isLuckyHunt` to the chain.

- [ ] **Step 5: Add to patchEpisodeHistory**

Find where other challenge flags are preserved (search for `if (ep.isSayUncle) h.isSayUncle`). Add:

```javascript
  if (ep.isLuckyHunt) h.isLuckyHunt = true;
  if (!h.luckyHunt && ep.luckyHunt) h.luckyHunt = ep.luckyHunt;
```

- [ ] **Step 6: Add VP screen push**

Find where other challenge VP screens are pushed (search for `rpBuildSayUncle`). Add:

```javascript
  } else if (ep.isLuckyHunt && ep.luckyHunt) {
    vpScreens.push({ id:'lucky-hunt', label:'Lucky Hunt', html: rpBuildLuckyHunt(ep) });
```

- [ ] **Step 7: Add debug tab check**

Find the condition that shows the challenge tab (search for `ep.isBasicStraining`). Add `|| ep.isLuckyHunt` to the condition.

- [ ] **Step 8: Add timeline tag in episode history**

Find where other challenge tags are rendered (search for `isCliffDive.*ep-hist-tag`). Add:

```javascript
    const lhTag = ep.isLuckyHunt ? `<span class="ep-hist-tag" style="background:rgba(255,215,0,0.15);color:#f0a500">Lucky Hunt</span>` : '';
```

And include `${lhTag}` in the tag rendering alongside other challenge tags.

- [ ] **Step 9: Commit**

```bash
git add simulator.html
git commit -m "feat(lucky-hunt): register twist, wire dispatch, skip lists, patchEpisodeHistory"
```

---

### Task 2: Location Pool & Difficulty System

**Files:**
- Modify: `simulator.html` — add constants near other challenge text pools

- [ ] **Step 1: Add location pool constant**

Add the `LUCKY_HUNT_LOCATIONS` constant near the other challenge constants. This is a large data structure — each location has an id, name, tier, description, statWeights, and text pools for each beat.

The implementer should create this constant with ALL 28 locations from the spec (8 easy, 8 medium, 8 hard, 4 nightmare). Each location needs:

```javascript
const LUCKY_HUNT_LOCATIONS = {
  easy: [
    {
      id: 'flaming-hoop', name: 'Flaming Hoop', tier: 'easy',
      desc: 'Key hanging inside a ring of fire. Jump through.',
      statWeights: { boldness: 0.05, physical: 0.03 },
      draw: {
        brave: [
          (n, pr) => `${n} looks at the plank. A ring of fire. ${pr.Sub} grins. "Seriously? This is my challenge?"`,
          (n, pr) => `Fire. ${n} turns the plank over to check for something harder. Nope. Just fire. ${pr.Sub} ${pr.sub==='they'?'look':'looks'} almost disappointed.`,
        ],
        mid: [
          (n, pr) => `${n} studies the plank. A hoop. On fire. ${pr.Sub} takes a breath. "Okay. I can do this."`,
        ],
        timid: [
          (n, pr) => `${n} stares at the plank. Fire. Actual fire. ${pr.posAdj} hand shakes a little.`,
        ],
      },
      arrive: [
        (n, pr) => `${n} reaches the clearing. The hoop is there, flames licking the frame. The key dangles from the center.`,
        (n, pr) => `The fire is real. ${n} can feel the heat from ten feet away. The key swings gently inside the ring.`,
      ],
      attemptSuccess: [
        (n, pr) => `${n} backs up, runs, and dives through. Clean. The key is in ${pr.posAdj} hand before ${pr.sub} hits the ground.`,
        (n, pr) => `${n} doesn't hesitate. One leap. Through the fire, grab the key, roll out. Hair singed. Key acquired.`,
        (n, pr) => `${n} reaches through the flames, wincing, and snatches the key. Fast. Done.`,
      ],
      attemptFail: [
        (n, pr) => `${n} runs at the hoop, balks at the last second, and veers off. The heat was more than ${pr.sub} expected.`,
        (n, pr) => `${n} reaches in and pulls back. Burns. The key is still there. ${pr.Sub} ${pr.sub==='they'?'are':'is'} going to need another approach.`,
      ],
    },
    // ... (7 more easy locations with the same structure)
    // cabin-drawer, flagpole-top, hollow-log, dock-ladder, campfire-pit, amphitheater-seats, canteen-shelf
  ],
  medium: [
    // shark-lake, beehive, crocodile-bridge, outhouse-plumbing, mud-pit-rope, rapids-buoy, woodpecker-tree, territorial-goose
    // (8 locations, same structure)
  ],
  hard: [
    // chefs-fridge, bear-den, septic-tank, hornets-cliff, cage-over-lake, shower-drain, cliff-bottom, raccoon-nest
    // (8 locations, same structure)
  ],
  nightmare: [
    // snake-skunk-den, underwater-cave, cliff-rope, electrical-panel
    // (4 locations, same structure)
  ],
};
```

**IMPORTANT FOR IMPLEMENTER:** Each location must have:
- `draw.brave` (2+ variants), `draw.mid` (1+ variant), `draw.timid` (1+ variant) — all `(name, pronouns) => string`
- `arrive` (2+ variants) — `(name, pronouns) => string`
- `attemptSuccess` (3+ variants) — `(name, pronouns) => string`
- `attemptFail` (2+ variants) — `(name, pronouns) => string`

All text should be vivid, specific to the location, and follow TDI tone. Use `posAdj` before nouns, `pos` standalone. Check pronoun agreement for they/them.

The full pool of locations is defined in the spec at `docs/superpowers/specs/2026-04-14-lucky-hunt-design.md` — reference it for each location's theme, primary stat, and flavor description.

- [ ] **Step 2: Add difficulty bucket function**

```javascript
function _luckyHuntAssignDifficulties(playerCount) {
  // Weighted bucket produces right distribution per cast size
  const bucket = [];
  const easyCount = Math.max(3, Math.floor(playerCount * 0.30));
  const medCount = Math.max(3, Math.floor(playerCount * 0.30));
  const hardCount = Math.max(2, Math.floor(playerCount * 0.25));
  const nightCount = Math.max(1, playerCount - easyCount - medCount - hardCount);

  for (let i = 0; i < easyCount; i++) bucket.push('easy');
  for (let i = 0; i < medCount; i++) bucket.push('medium');
  for (let i = 0; i < hardCount; i++) bucket.push('hard');
  for (let i = 0; i < nightCount; i++) bucket.push('nightmare');

  // Shuffle
  for (let i = bucket.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bucket[i], bucket[j]] = [bucket[j], bucket[i]];
  }

  return bucket.slice(0, playerCount);
}
```

- [ ] **Step 3: Add success formula function**

```javascript
function _luckyHuntSuccessChance(player, location, huntState) {
  const s = pStats(player);
  const tierBase = { easy: 0.40, medium: 0.20, hard: 0.10, nightmare: 0.05 };
  let chance = tierBase[location.tier];

  // Stat contributions from location weights
  Object.entries(location.statWeights).forEach(([stat, weight]) => {
    chance += (s[stat] || 0) * weight;
  });

  // Modifiers from hunt state
  const ps = huntState.players[player];
  if (ps.helpedBy) chance += 0.15;
  if (ps.sabotagedBy) chance -= 0.15;
  if (ps.frozen) return 0;
  if (ps.attemptsMade > 0) chance += 0.05 * ps.attemptsMade; // learn from failures
  if (ps.emotionalState === 'devastated') chance -= 0.15;
  if (ps.emotionalState === 'furious') chance += 0.05;
  if (ps.emotionalState === 'elated') chance += 0.05;

  return Math.max(0.05, Math.min(0.95, chance));
}
```

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat(lucky-hunt): location pool (28 locations), difficulty assignment, success formula"
```

---

### Task 3: Core Timeline Engine — simulateLuckyHunt

**Files:**
- Modify: `simulator.html` — add `simulateLuckyHunt(ep)` function

This is the main engine. It implements the timeline algorithm from the spec: seed queue → sort by timing → process sequentially with live state checks → last chance → chest ceremony → aftermath.

- [ ] **Step 1: Implement simulateLuckyHunt**

The implementer should create the full function following the algorithm in the spec. Key sections:

1. **Init:** Set up huntState, assign difficulties, pick locations (no duplicates), set maxAttempts per player
2. **Seed queue:** Add clueDraw events (timing 0.0), huntAttempt events (timing 0.1-0.8 based on difficulty), hunt events (scan for eligible pairs, pre-roll with timing weights), social scheme events (call generateSocialManipulationEvents with boostRate 0.40)
3. **Sort queue** by timing + jitter
4. **Process sequentially:** For each event, check preconditions against live state. If valid, execute and update state. If invalid, skip. After execution, check for reactive events (panic, comfort, expose).
5. **Last chance pass:** Players without keys get one final attempt (chance - 0.05)
6. **Dud key roll:** ~15% of key finders get a dud
7. **Chest ceremony:** Assign chests, reveal in order (immunity last)
8. **Set challenge outcome:** `ep.immunityWinner`, `ep.challengeType`, `ep.tribalPlayers`, `ep.challengeLabel`, etc.
9. **Generate camp events** for notable hunt outcomes (helped, sabotaged, stolen, showoff, panic, etc.)
10. **Store ep.luckyHunt** with the full timeline and huntResults

This function will be 400-600 lines. The implementer should reference:
- The spec at `docs/superpowers/specs/2026-04-14-lucky-hunt-design.md` for the full timeline algorithm, live state object, and hunt event mechanics
- Other challenge functions (like `simulateSayUncle` or `simulateBasicStraining`) for the pattern of setting ep.challengeType, ep.immunityWinner, ep.tribalPlayers, calling updateChalRecord, etc.

**Critical detail:** Hunt events must be implemented as separate helper functions (like the social manipulation events), each checking live state preconditions. The main function calls them but doesn't contain all their logic inline.

- [ ] **Step 2: Implement hunt event helpers**

Each of these needs its own function, following the spec mechanics:
- `_lhHelpAlly(helper, target, huntState, ep, _rp)` 
- `_lhSabotageRival(saboteur, target, huntState, ep, _rp)`
- `_lhTradeIntel(playerA, playerB, huntState, ep, _rp)`
- `_lhStealKey(stealer, victim, huntState, ep, _rp)`
- `_lhAmbush(ambusher, victim, huntState, ep, _rp)`
- `_lhPanicFreeze(player, huntState, ep, _rp)`
- `_lhShowoff(player, huntState, ep, _rp)`
- `_lhUnlikelyTeamup(playerA, playerB, huntState, ep, _rp)`
- `_lhDiscovery(player, huntState, ep, _rp)`

Each returns a timeline event object (or null if preconditions fail). Each modifies huntState.

- [ ] **Step 3: Implement chest ceremony**

```javascript
function _lhChestCeremony(huntState, ep, _rp) {
  const timeline = [];
  const keyFinders = Object.entries(huntState.players)
    .filter(([name, ps]) => ps.keyFound && !ps.keyStolen && !ps.dudKey)
    .map(([name]) => name);

  // Build chest pool
  const chestPool = [];
  chestPool.push({ type: 'immunity', name: 'Invincibility', description: 'You cannot be voted out tonight.' });
  chestPool.push({ type: 'boobyTrap', name: _rp(['Paint Bomb', 'Skunk Spray', 'Glitter Cannon', 'Boxing Glove', 'Smoke Bomb']), description: 'Something bad.' });
  if (keyFinders.length >= 4) {
    chestPool.push({ type: 'shareable', name: 'Food Basket', description: 'Choose one person to share with.' });
  }
  // Check if advantage system enabled
  if (seasonConfig.advantages !== 'disabled' && Math.random() < 0.5) {
    chestPool.push({ type: 'advantage', name: _rp(['Extra Vote', 'Vote Steal', 'Idol Clue']), description: 'A game advantage.' });
  }
  // Fill rest with food/comfort
  const _items = ['Chips and a Candy Bar', 'Cleaver Body Spray', 'Toaster', 'Leg Lamp', 'Ships in a Bottle', 'Accordion', 'Industrial Body Spray', 'A Pillow', 'Mystery Meat Jerky'];
  while (chestPool.length < keyFinders.length) {
    chestPool.push({ type: 'food', name: _rp(_items), description: 'A comfort item.' });
  }

  // Shuffle chests
  for (let i = chestPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chestPool[i], chestPool[j]] = [chestPool[j], chestPool[i]];
  }

  // Assign to key finders (shuffle finders too for reveal order)
  const revealOrder = [...keyFinders].sort(() => Math.random() - 0.5);
  // But move immunity to last reveal
  const immunityIdx = chestPool.findIndex(c => c.type === 'immunity');
  // Find which player got immunity
  const immunityPlayerIdx = immunityIdx < revealOrder.length ? immunityIdx : 0;
  // Swap that player to end of reveal order
  const immunityPlayer = revealOrder[immunityPlayerIdx];
  revealOrder.splice(immunityPlayerIdx, 1);
  revealOrder.push(immunityPlayer);

  revealOrder.forEach((name, i) => {
    const chest = chestPool[i < immunityPlayerIdx ? i : (i === revealOrder.length - 1 ? immunityIdx : i)];
    // Actually, simpler: just pair shuffled chests with shuffled players, find who got immunity, move them last in reveal
    huntState.players[name].chestReward = chest;
    huntState.players[name].hasChest = true;

    // Generate text per reward type
    // ... (implementer fills text pools per reward type)

    timeline.push({
      type: 'chestOpen', player: name,
      reward: chest,
      text: `${name} opens ${pronouns(name).posAdj} chest...`, // placeholder — implementer adds real text
    });
  });

  return { timeline, immunityPlayer };
}
```

The implementer should flesh out the text generation for each reward type (immunity fanfare, booby trap explosion, shareable choice, food item humor, dud frustration, no-key shame).

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat(lucky-hunt): core timeline engine, hunt event helpers, chest ceremony"
```

---

### Task 4: Hunt Event Text Pools

**Files:**
- Modify: `simulator.html` — add text pool constants for hunt events

- [ ] **Step 1: Add text pools for all hunt events**

Each hunt event type needs 3-5 text variants. These go as constants near the location pool:

```javascript
const LH_HELP_TEXTS = [
  (helper, target, hPr, tPr) => `${helper} already has ${hPr.posAdj} key. ${hPr.Sub} sees ${target} struggling and walks over. "Need a hand?"`,
  // ... 3+ more
];

const LH_SABOTAGE_TEXTS = { /* caught and uncaught variants */ };
const LH_STEAL_TEXTS = { /* success and fail variants */ };
const LH_AMBUSH_TEXTS = [ /* 3+ variants */ ];
const LH_PANIC_TEXTS = [ /* 3+ variants for freeze */ ];
const LH_SHOWOFF_TEXTS = [ /* 3+ variants */ ];
const LH_TEAMUP_TEXTS = [ /* 3+ variants */ ];
const LH_DISCOVERY_TEXTS = [ /* 3+ variants per discovery type */ ];
const LH_TRADE_TEXTS = { /* genuine, liar-success, liar-caught variants */ };

const LH_CHEST_TEXTS = {
  immunity: [ /* 3+ reveal texts */ ],
  boobyTrap: { /* per trap type: paint, skunk, glitter, boxing, smoke */ },
  shareable: [ /* 3+ texts */ ],
  food: [ /* 3+ generic item texts */ ],
  advantage: [ /* 3+ texts */ ],
};

const LH_DUD_TEXTS = [ /* 4+ frustration variants */ ];
const LH_NO_KEY_TEXTS = [ /* 3+ shame variants */ ];

const LH_CHRIS_LINES = {
  announcement: [ /* 3+ pirate-themed intros */ ],
  draw: [ /* 4+ reactions to specific funny draws */ ],
  attempt: [ /* 3+ commentary on dramatic moments */ ],
  immunity: [ /* 3+ immunity reveal reactions */ ],
  boobyTrap: [ /* 3+ laughing-at-misfortune lines */ ],
};
```

The implementer should write all text following TDI tone — funny, dramatic, character-specific. Reference the spec for the narrative examples.

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat(lucky-hunt): text pools for all hunt events, chest rewards, chris commentary"
```

---

### Task 5: VP Screen — rpBuildLuckyHunt

**Files:**
- Modify: `simulator.html` — add VP screen function

- [ ] **Step 1: Implement rpBuildLuckyHunt**

Follow the pattern from `rpBuildSayUncle` or `rpBuildCliffDive`:
- State key: `lh_reveal_${ep.num}`
- `_tvState[stateKey]` with `idx: -1`
- Click-to-reveal through `ep.luckyHunt.timeline` entries
- Each timeline event type gets its own rendering:
  - `clueDraw`: player portrait + plank image description + reaction text
  - `huntAttempt`: player portrait, location description, attempt text, success/fail badge
  - `huntEvent`: two portraits, event description, consequence text
  - `socialScheme`: dramatic framing with bold colored border
  - `chestOpen`: chest icon, reward reveal, special styling for immunity
  - `aftermath`: standard event card

**Theme:** Pirate treasure map.
- Parchment-toned background: `linear-gradient(180deg, #2a1f14 0%, #1a140e 100%)`
- Gold accent: `#f0a500`
- Key icon motif
- Chest reveal with gold border for immunity

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat(lucky-hunt): VP screen with timeline click-to-reveal"
```

---

### Task 6: Text Backlog & Debug Tab

**Files:**
- Modify: `simulator.html` — add `_textLuckyHunt`, add debug section

- [ ] **Step 1: Implement _textLuckyHunt**

```javascript
function _textLuckyHunt(ep, ln, sec) {
  if (!ep.luckyHunt?.timeline?.length) return;
  const lh = ep.luckyHunt;
  sec('LUCKY HUNT');
  ln('Post-merge scavenger hunt. Find your key. Open your chest. One has immunity.');
  ln('');

  // Per-player summary
  ln('HUNT RESULTS:');
  Object.entries(lh.huntResults || {}).forEach(([name, r]) => {
    const keyStatus = r.dudKey ? 'DUD KEY' : r.foundKey ? 'FOUND KEY' : 'NO KEY';
    const chest = r.chestReward ? r.chestReward.name : 'None';
    ln(`  ${name}: ${r.difficulty.toUpperCase()} (${r.location?.name || '?'}) — ${keyStatus} — Chest: ${chest}`);
  });
  ln('');

  // Timeline narrative
  ln('TIMELINE:');
  lh.timeline.forEach(evt => {
    if (evt.type === 'clueDraw') ln(`  [DRAW] ${evt.player}: ${evt.text}`);
    else if (evt.type === 'huntAttempt') ln(`  [${evt.success ? 'SUCCESS' : 'FAIL'}] ${evt.player}: ${evt.text}`);
    else if (evt.type === 'huntEvent') ln(`  [${evt.subtype?.toUpperCase() || 'EVENT'}] ${evt.text}`);
    else if (evt.type === 'socialScheme') ln(`  [SCHEME: ${evt.subtype?.toUpperCase()}] ${evt.text}`);
    else if (evt.type === 'chestOpen') ln(`  [CHEST] ${evt.player}: ${evt.reward?.name || '?'} — ${evt.text}`);
    else if (evt.type === 'aftermath') ln(`  [AFTERMATH] ${evt.text}`);
    else ln(`  [${evt.type}] ${evt.text || ''}`);
  });
  ln('');

  ln(`IMMUNITY: ${lh.immunityWinner || 'None'}`);
}
```

- [ ] **Step 2: Add debug tab section**

Find the sucky outdoors debug section. After it, add:

```javascript
    if (ep.luckyHunt?.huntResults) {
      html += `<div style="font-family:var(--font-display);font-size:13px;color:#f0883e;margin:16px 0 8px">Lucky Hunt — Per Player</div>`;
      Object.entries(ep.luckyHunt.huntResults).forEach(([name, r]) => {
        const keyBadge = r.dudKey ? '<span style="color:#f85149">DUD</span>' : r.foundKey ? '<span style="color:#3fb950">KEY</span>' : '<span style="color:#6e7681">NO KEY</span>';
        const chest = r.chestReward ? `<span style="color:${r.chestReward.type === 'immunity' ? '#f0a500' : '#8b949e'}">${r.chestReward.name}</span>` : '—';
        const mods = [r.helpedBy ? `helped:${r.helpedBy}` : '', r.sabotagedBy ? `sab:${r.sabotagedBy}` : '', r.stolenBy ? `stolen:${r.stolenBy}` : ''].filter(Boolean).join(' ');
        html += `<div style="font-size:9px;padding:1px 0;color:#6e7681">${name}: ${r.difficulty} (${r.location?.name || '?'}) · ${keyBadge} · Chest: ${chest} · Score: ${(r.personalScore || 0).toFixed(1)}${mods ? ' · ' + mods : ''}</div>`;
      });
      html += `<div style="font-size:9px;color:#f0a500;padding:2px 0;margin-top:4px">Immunity: ${ep.luckyHunt.immunityWinner || 'None'}</div>`;
      html += `<div style="font-size:9px;color:#6e7681">Timeline events: ${ep.luckyHunt.timeline?.length || 0}</div>`;
    }
```

- [ ] **Step 3: Wire _textLuckyHunt into text backlog**

Find where other challenge text functions are called (search for `_textCliffDive(ep, ln, sec)`). Add nearby:

```javascript
  _textLuckyHunt(ep, ln, sec);
```

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat(lucky-hunt): text backlog + debug tab"
```

---

### Task 7: CSS & Cold Open Integration

**Files:**
- Modify: `simulator.html` — CSS section, cold open section

- [ ] **Step 1: Add Lucky Hunt VP CSS**

Near the other challenge CSS (search for `/* Cliff Dive Overdrive */`), add:

```css
    /* ── Lucky Hunt Overdrive (Pirate Treasure) ── */
    .lh-wrap {
      position: relative;
      background: linear-gradient(180deg, #2a1f14 0%, #1a140e 50%, #0f0a06 100%);
    }
    .lh-clue-card {
      padding: 12px 14px; margin-bottom: 6px; border-radius: 8px;
      border: 1px solid rgba(240,165,0,0.15); background: rgba(240,165,0,0.04);
    }
    .lh-attempt-card {
      padding: 10px 14px; margin-bottom: 5px; border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.06); background: rgba(0,0,0,0.3);
    }
    .lh-attempt-card.success { border-left: 3px solid #3fb950; }
    .lh-attempt-card.fail { border-left: 3px solid #f85149; }
    .lh-chest-card {
      padding: 14px; margin-bottom: 8px; border-radius: 10px;
      border: 1px solid rgba(240,165,0,0.2); background: rgba(240,165,0,0.05);
    }
    .lh-chest-card.immunity {
      border: 2px solid #f0a500;
      background: linear-gradient(135deg, rgba(240,165,0,0.12), rgba(240,165,0,0.03));
      box-shadow: 0 0 20px rgba(240,165,0,0.15);
    }
    .lh-chest-card.booby {
      border: 2px solid #f85149;
      background: rgba(248,81,73,0.06);
    }
    .lh-event-card {
      padding: 10px 14px; margin-bottom: 5px; border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.06); background: rgba(0,0,0,0.25);
    }
    .lh-scheme-card {
      padding: 12px 14px; margin-bottom: 8px; border-radius: 8px;
      border: 2px solid rgba(248,81,73,0.2); background: rgba(248,81,73,0.04);
    }
```

- [ ] **Step 2: Add cold open hook for Lucky Hunt**

Find where other challenges add cold open info (search for `prevEp.isCliffDive && prevEp.cliffDive`). Add:

```javascript
    if (prevEp.isLuckyHunt && prevEp.luckyHunt) {
      const _lh = prevEp.luckyHunt;
      const keyCount = _lh.keyFinders?.length || 0;
      const dudCount = _lh.dudKeys?.length || 0;
      html += `<div class="vp-card" style="border-color:rgba(240,165,0,0.15);margin-bottom:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#f0a500;margin-bottom:4px">LUCKY HUNT</div>
        <div style="font-size:12px;color:#8b949e">${_lh.immunityWinner} found immunity. ${keyCount} keys found, ${dudCount} duds.${_lh.timeline?.some(e => e.type === 'socialScheme') ? ' Schemes were in play.' : ''}</div>
      </div>`;
    }
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat(lucky-hunt): CSS theme, cold open integration"
```

---

### Task 8: Smoke Test & Final Polish

- [ ] **Step 1: Run in browser with Lucky Hunt twist**

Configure a season, reach post-merge, schedule Lucky Hunt, simulate.

- [ ] **Step 2: Verify VP screen**

Click through the full timeline:
- Clue draws with reactions
- Hunt attempts with location-specific text
- Hunt events (help, sabotage, steal, panic, showoff)
- Social schemes (if they fired)
- Chest ceremony with immunity reveal last
- Aftermath events

- [ ] **Step 3: Verify text backlog**

Per-player hunt results + full timeline narrative + immunity winner.

- [ ] **Step 4: Verify debug tab**

Per-player difficulty, location, key status, chest reward, modifiers, score.

- [ ] **Step 5: Verify camp events**

Check for hunt-related camp events (HELPED, SABOTAGED, KEY STOLEN, etc.) and social manipulation events (FORGED NOTE, LIED TO, etc.).

- [ ] **Step 6: Run 5+ episodes for variance**

Verify:
- Difficulty distribution varies
- Not everyone finds their key
- Dud keys fire ~15%
- Booby trap fires once per episode
- Immunity winner varies
- Hunt events fire based on cast composition
- Social schemes fire when schemers exist

- [ ] **Step 7: Commit**

```bash
git add simulator.html
git commit -m "feat(lucky-hunt): full challenge twist — scavenger hunt with keys, chests, schemes, immunity"
```
