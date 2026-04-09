# Phobia Factor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pre-merge "Phobia Factor" tribe challenge where players face randomly-assigned fears — campfire confessions, pass/fail per player, tribe scoring by completion %, triple-points clutch for losing tribe, normal tribal follows.

**Architecture:** Single new engine function `simulatePhobiaFactor(ep)` assigns fears, runs the challenge, scores tribes. Called from `simulateEpisode` when `ep.isPhobiaFactor` is set — replaces `simulateTribeChallenge` but keeps normal tribal flow. VP has 5 screens (confessions, announcement, challenge, clutch, results). All code in `simulator.html`.

**Tech Stack:** Vanilla JS, single-file architecture (simulator.html)

**Reference patterns:**
- Engine: `simulateSayUncle(ep)` — challenge replacement with stat-based survival rolls
- Tribe challenge: `simulateTribeChallenge(tribes)` at ~line 22269 — sets `ep.winner`, `ep.loser`, `ep.challengeType`
- VP: `rpBuildSayUncleRounds(ep)` — sequential click-to-reveal
- Twist: Say Uncle `applyTwist` handler with merge-episode guard pattern

---

### Task 1: Twist Catalog Entry + Episode Flag

**Files:**
- Modify: `simulator.html` — `TWIST_CATALOG`, `applyTwist()`

- [ ] **Step 1: Add TWIST_CATALOG entry**

After the `say-uncle` entry:

```javascript
{ id:'phobia-factor', emoji:'😱', name:'Phobia Factor', category:'immunity', phase:'pre-merge', desc:'Each player faces their worst fear. Tribe with the best completion rate wins immunity. Worst tribe goes to tribal. Triple points clutch for losing tribe.', engineType:'phobia-factor' },
```

- [ ] **Step 2: Add applyTwist handler**

After the `say-uncle` handler:

```javascript
} else if (engineType === 'phobia-factor') {
  // Pre-merge only, not episode 1, need 2+ tribes
  if (gs.isMerged || gs.tribes.length < 2) return;
  const epNum = (gs.episode || 0) + 1;
  if (epNum < 2) return;
  ep.isPhobiaFactor = true;
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: add Phobia Factor twist catalog entry and episode flag"
```

---

### Task 2: Fear Pool Constants

**Files:**
- Modify: `simulator.html` — after `SAY_UNCLE_CATEGORIES`

- [ ] **Step 1: Add PHOBIA_POOL**

```javascript
// ── Phobia Factor — fear pools (face your phobia) ──
const PHOBIA_POOL = {
  'pain': [
    { title: 'Hot Coals', desc: 'Walk barefoot across hot coals.' },
    { title: 'Bee Stings', desc: 'Stand still while bees land on you.' },
    { title: 'Ice Water Immersion', desc: 'Submerge yourself in ice water for 10 seconds.' },
    { title: 'Cactus Walk', desc: 'Walk through a cactus patch barefoot.' },
    { title: 'Electric Shock', desc: 'Sit in a chair that delivers mild shocks.' },
    { title: 'Fire Walk', desc: 'Walk between two walls of flame.' },
    { title: 'Pepper Spray', desc: 'Stand in a mist of pepper spray. Eyes open.' },
    { title: 'Ant Swarm', desc: 'Let fire ants crawl over your hands.' },
    { title: 'Jellyfish Touch', desc: 'Touch a jellyfish with your bare hand.' },
    { title: 'Nail Bed', desc: 'Lay on a bed of nails for 10 seconds.' },
    { title: 'Rubber Band Snap', desc: 'Let the tribe snap rubber bands at your arms.' },
    { title: 'Slap Challenge', desc: 'Get slapped across the face. Don\'t flinch.' },
    { title: 'Branding Iron', desc: 'Hold a fake branding iron close to your skin. Don\'t pull away.' },
    { title: 'Sunburn Box', desc: 'Sit in a box under heat lamps for 10 seconds.' },
    { title: 'Hail Storm', desc: 'Stand under a machine that pelts you with ice.' },
  ],
  'fear': [
    { title: 'Snakes', desc: 'Pick up a live snake. Hold it.' },
    { title: 'Spiders', desc: 'Let a tarantula walk on your hand.' },
    { title: 'Buried Alive', desc: 'Get sealed in a glass box under sand for 5 minutes.' },
    { title: 'Heights', desc: 'Stand on the edge of a cliff. Look down.' },
    { title: 'Darkness', desc: 'Get locked in a pitch-black room for 60 seconds.' },
    { title: 'Confined Spaces', desc: 'Climb into a coffin. Lid closes. 10 seconds.' },
    { title: 'Deep Water', desc: 'Get lowered into deep water in a shark cage.' },
    { title: 'Rats', desc: 'Stand in a room full of rats.' },
    { title: 'Bats', desc: 'Sit in a cave full of bats. Don\'t run.' },
    { title: 'Thunder', desc: 'Sit through a simulated thunderstorm at close range.' },
    { title: 'Clowns', desc: 'Sit in a room with a clown staring at you.' },
    { title: 'Being Chased', desc: 'Get chased by a masked figure through the woods.' },
    { title: 'Wolves', desc: 'Make eye contact with a wolf for 10 seconds.' },
    { title: 'Quicksand', desc: 'Stand in quicksand up to your waist. Don\'t struggle.' },
    { title: 'Haunted House', desc: 'Walk through a haunted house alone.' },
  ],
  'gross': [
    { title: 'Worms', desc: 'Jump into a pool of worms. Submerge.' },
    { title: 'Leeches', desc: 'Sit in a barrel of leeches.' },
    { title: 'Cockroaches', desc: 'Let cockroaches crawl on your face.' },
    { title: 'Sewage', desc: 'Snorkel in swamp water. Face down.' },
    { title: 'Rotten Food', desc: 'Eat a spoonful of week-old camp food.' },
    { title: 'Maggots', desc: 'Let maggots be spread on your back. Lay still.' },
    { title: 'Fish Guts', desc: 'Stick your hands into a bucket of fish guts.' },
    { title: 'Slug Bath', desc: 'Lay in a bathtub of slugs.' },
    { title: 'Bird Droppings', desc: 'Stand under a birdcage. Look up.' },
    { title: 'Dumpster', desc: 'Sit inside a closed dumpster for 30 seconds.' },
    { title: 'Mystery Meat', desc: 'Eat a mystery meat patty. Don\'t ask what it is.' },
    { title: 'Swamp Mud', desc: 'Get buried in swamp mud up to your neck.' },
    { title: 'Catfish', desc: 'Kiss a live catfish on the mouth.' },
    { title: 'Roadkill', desc: 'Lay your head on a roadkill pillow.' },
    { title: 'Nose Hair Pull', desc: 'Have all your nose hairs pulled at once.' },
  ],
  'humiliation': [
    { title: 'Green Jelly Pool', desc: 'Dive into a pool of green jelly from a high board.' },
    { title: 'Chicken Costume', desc: 'Wear a chicken costume and cluck for 60 seconds.' },
    { title: 'Public Singing', desc: 'Sing your worst song in front of everyone.' },
    { title: 'Baby Outfit', desc: 'Wear a baby outfit and cry for your bottle.' },
    { title: 'Clown Makeup', desc: 'Get full clown makeup. Do a routine.' },
    { title: 'Wedgie Walk', desc: 'Give yourself a wedgie and walk the length of camp.' },
    { title: 'Dance Solo', desc: 'Dance alone in front of everyone. No music.' },
    { title: 'Love Confession', desc: 'Confess love to the person you like least. On camera.' },
    { title: 'Dunce Cap', desc: 'Wear a dunce cap and sit in the corner while everyone watches.' },
    { title: 'Ugly Wig', desc: 'Wear the ugliest wig imaginable. All day.' },
    { title: 'Cow Costume', desc: 'Wear a cow costume. Parade around camp. Moo on command.' },
    { title: 'Truth Serum', desc: 'Answer any question the tribe asks. Honestly.' },
    { title: 'Belly Flop', desc: 'Do a belly flop off the dock. Maximum splash.' },
    { title: 'Being Mocked', desc: 'Stand on stage while the tribe roasts you for 60 seconds.' },
    { title: 'Walk of Shame', desc: 'Walk a lap around camp while everyone slow-claps.' },
  ],
};
const PHOBIA_CATEGORIES = Object.keys(PHOBIA_POOL);
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: add Phobia Factor fear pool constants (60 fears, 4 categories)"
```

---

### Task 3: Engine Function — `simulatePhobiaFactor(ep)`

**Files:**
- Modify: `simulator.html` — add before `simulateSayUncle`

- [ ] **Step 1: Add the engine function**

```javascript
// ══════════════════════════════════════════════════════════════════════
// ENGINE: PHOBIA FACTOR
// ══════════════════════════════════════════════════════════════════════

function simulatePhobiaFactor(ep) {
  const tribes = gs.tribes;
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];

  // ── Step 1: Assign random fears to each player ──
  const fears = {};
  const allPlayers = tribes.flatMap(t => t.members);
  allPlayers.forEach(player => {
    const category = _rp(PHOBIA_CATEGORIES);
    const fear = _rp(PHOBIA_POOL[category]);
    fears[player] = { category, title: fear.title, desc: fear.desc };
  });

  // ── Detect shared fears ──
  const sharedFears = [];
  const fearsByTitle = {};
  Object.entries(fears).forEach(([player, f]) => {
    if (!fearsByTitle[f.title]) fearsByTitle[f.title] = [];
    fearsByTitle[f.title].push(player);
  });
  Object.entries(fearsByTitle).forEach(([title, players]) => {
    if (players.length >= 2) {
      sharedFears.push({ players: [...players], fear: title });
      // Bond boost for shared vulnerability
      for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
          addBond(players[i], players[j], 0.2);
        }
      }
    }
  });

  // ── Step 2: Campfire confessions (camp events) ──
  const confessions = [];
  const campKey = tribes[0]?.name || 'tribe1';
  allPlayers.forEach(player => {
    const f = fears[player];
    const pr = pronouns(player);
    const arch = players.find(p => p.name === player)?.archetype || '';
    let confText;
    if (arch === 'villain' || arch === 'mastermind') {
      confText = _rp([
        `${player} hesitates before speaking. "I don't have fears." Nobody believes ${pr.obj}. Finally: "${f.title}."`,
        `${player} says "${f.title}" like it's a strategic move. Maybe it is.`,
      ]);
    } else if (arch === 'hero') {
      confText = _rp([
        `${player} doesn't flinch. "${f.title}. I'm not proud of it, but it's real."`,
        `${player} looks into the fire. "${f.title}." ${pr.Sub} ${pr.sub === 'they' ? 'say' : 'says'} it like ${pr.sub} ${pr.sub === 'they' ? 'are' : 'is'} already preparing to face it.`,
      ]);
    } else if (arch === 'chaos-agent') {
      confText = _rp([
        `${player} blurts it out: "${f.title}. Don't judge me." The tribe can't tell if ${pr.sub} ${pr.sub === 'they' ? 'are' : 'is'} serious.`,
        `"${f.title}," ${player} says cheerfully. "Terrifies me. Can we talk about something else?"`,
      ]);
    } else {
      confText = _rp([
        `${player} stares into the fire. "${f.title}." The tribe goes quiet.`,
        `"You want to know my fear? ${f.title}." ${player} looks away. The vulnerability is real.`,
        `${player} admits ${pr.pos} fear quietly: ${f.title}. ${pr.Sub} ${pr.sub === 'they' ? 'don\'t' : 'doesn\'t'} want to talk about it.`,
      ]);
    }
    confessions.push({ player, fear: f.title, category: f.category, reaction: confText });
  });

  // ── Step 3: Run the challenge — each player faces their fear ──
  const results = {};
  const tribeScores = {};

  tribes.forEach(tribe => {
    let completions = 0;
    tribe.members.forEach(player => {
      const f = fears[player];
      const s = pStats(player);
      let primary = 0, secondary = 0;
      if (f.category === 'pain')        { primary = s.endurance * 0.07; secondary = s.physical * 0.04; }
      else if (f.category === 'fear')   { primary = s.boldness * 0.07;  secondary = s.endurance * 0.04; }
      else if (f.category === 'gross')  { primary = s.boldness * 0.07;  secondary = s.physical * 0.04; }
      else if (f.category === 'humiliation') { primary = s.boldness * 0.07; secondary = (10 - s.social) * 0.04; }
      const score = primary + secondary + (Math.random() * 0.25 - 0.05);
      const passed = score >= 0.45;
      results[player] = passed ? 'pass' : 'fail';
      if (passed) completions++;
    });
    tribeScores[tribe.name] = {
      completions,
      total: tribe.members.length,
      percentage: tribe.members.length ? completions / tribe.members.length : 0,
    };
  });

  // ── Step 4: Determine winner + loser ──
  const ranked = [...tribes].sort((a, b) => tribeScores[b.name].percentage - tribeScores[a.name].percentage);
  // Tiebreaker: total completions, then random
  if (ranked.length >= 2 && tribeScores[ranked[0].name].percentage === tribeScores[ranked[1].name].percentage) {
    ranked.sort((a, b) => tribeScores[b.name].completions - tribeScores[a.name].completions || (Math.random() - 0.5));
  }
  const winningTribe = ranked[0];
  const losingTribe = ranked[ranked.length - 1];

  // ── Step 5: Triple points clutch ──
  let clutch = null;
  const winPct = tribeScores[winningTribe.name].percentage;
  const losePct = tribeScores[losingTribe.name].percentage;
  if (winPct - losePct >= 0.20 && losingTribe.members.length >= 2) {
    // Pick the player with lowest boldness on the losing tribe (needs redemption)
    const clutchPlayer = [...losingTribe.members].sort((a, b) => pStats(a).boldness - pStats(b).boldness)[0];
    // Pick their weakest category
    const cs = pStats(clutchPlayer);
    const catScores = {
      pain: cs.endurance * 0.07 + cs.physical * 0.04,
      fear: cs.boldness * 0.07 + cs.endurance * 0.04,
      gross: cs.boldness * 0.07 + cs.physical * 0.04,
      humiliation: cs.boldness * 0.07 + (10 - cs.social) * 0.04,
    };
    const weakestCat = PHOBIA_CATEGORIES.sort((a, b) => catScores[a] - catScores[b])[0];
    const clutchFear = _rp(PHOBIA_POOL[weakestCat]);
    // Roll with the same formula
    let cPrimary = 0, cSecondary = 0;
    if (weakestCat === 'pain')        { cPrimary = cs.endurance * 0.07; cSecondary = cs.physical * 0.04; }
    else if (weakestCat === 'fear')   { cPrimary = cs.boldness * 0.07;  cSecondary = cs.endurance * 0.04; }
    else if (weakestCat === 'gross')  { cPrimary = cs.boldness * 0.07;  cSecondary = cs.physical * 0.04; }
    else if (weakestCat === 'humiliation') { cPrimary = cs.boldness * 0.07; cSecondary = (10 - cs.social) * 0.04; }
    const clutchScore = cPrimary + cSecondary + (Math.random() * 0.25 - 0.05);
    const clutchPassed = clutchScore >= 0.45;
    clutch = {
      player: clutchPlayer,
      fear: { category: weakestCat, title: clutchFear.title, desc: clutchFear.desc },
      result: clutchPassed ? 'pass' : 'fail',
      tribe: losingTribe.name,
    };
    if (clutchPassed) {
      tribeScores[losingTribe.name].completions += 3;
      tribeScores[losingTribe.name].percentage = tribeScores[losingTribe.name].completions / tribeScores[losingTribe.name].total;
      // Re-rank after clutch
      const reranked = [...tribes].sort((a, b) => tribeScores[b.name].percentage - tribeScores[a.name].percentage);
      // Update winner/loser if clutch changed the outcome
      if (reranked[0].name !== winningTribe.name) {
        // Clutch overturned!
        clutch.overturned = true;
      }
    }
  }

  // Final ranking after potential clutch
  const finalRanked = [...tribes].sort((a, b) => tribeScores[b.name].percentage - tribeScores[a.name].percentage);
  const finalWinner = finalRanked[0];
  const finalLoser = finalRanked[finalRanked.length - 1];

  // ── Reactions ──
  const _conquerReaction = (player, fear) => {
    const pr = pronouns(player);
    const arch = players.find(p => p.name === player)?.archetype || '';
    const reactions = [
      `${player} closes ${pr.pos} eyes. Heart pounding. But ${pr.sub} ${pr.sub === 'they' ? 'do' : 'does'} it. The fear doesn't own ${pr.obj} anymore.`,
      `${player} is shaking the whole time. But ${pr.sub} lasted. And that's enough.`,
      `${player} pushes through ${fear}. Every second is agony. But ${pr.sub} ${pr.sub === 'they' ? 'make' : 'makes'} it.`,
    ];
    if (arch === 'hero') reactions.push(`${player} faces ${fear} head-on. No hesitation. The tribe watches in respect.`);
    if (arch === 'chaos-agent') reactions.push(`${player} actually seems to enjoy ${fear}. The tribe isn't sure what to do with that.`);
    return _rp(reactions);
  };

  const _failReaction = (player, fear) => {
    const pr = pronouns(player);
    return _rp([
      `${player} freezes. Can't move. Can't breathe. ${fear} wins this one.`,
      `${player} tries to step forward. Every muscle says no. ${pr.Sub} backs away.`,
      `${player} starts — then stops. "I can't. I'm sorry." The tribe watches ${pr.obj} sit down.`,
      `${player} takes one look at ${fear} and the color drains from ${pr.pos} face. It's over before it starts.`,
    ]);
  };

  // ── Set results on ep ──
  ep.phobiaFactor = {
    fears, sharedFears, results, tribeScores,
    clutch, confessions,
    winningTribe: finalWinner.name,
    losingTribe: finalLoser.name,
    reactions: {},
  };

  // Generate reactions for each player
  allPlayers.forEach(player => {
    const f = fears[player];
    ep.phobiaFactor.reactions[player] = results[player] === 'pass'
      ? _conquerReaction(player, f.title)
      : _failReaction(player, f.title);
  });
  // Clutch reaction
  if (clutch) {
    const cpr = pronouns(clutch.player);
    ep.phobiaFactor.reactions['_clutch'] = clutch.result === 'pass'
      ? `Triple points on the line. The whole tribe is watching. ${clutch.player} stares at ${clutch.fear.title}. And ${cpr.sub} ${cpr.sub === 'they' ? 'do' : 'does'} it.`
      : `${clutch.player} can't. Not with everyone watching. Not with this. The tribe's hope dies right there.`;
  }

  // Set standard challenge fields
  ep.challengeType = 'tribe';
  ep.winner = finalWinner;
  ep.loser = finalLoser;
  ep.safeTribes = finalRanked.slice(1, -1); // middle tribes safe
  ep.challengeLabel = 'Phobia Factor';
  ep.challengeCategory = 'mixed';
  ep.challengeDesc = 'Face your fear. Tribe with the best completion rate wins immunity.';
  ep.tribalPlayers = [...finalLoser.members];
  ep.challengePlacements = finalRanked.map(t => ({ name: t.name, members: [...t.members] }));

  // ── Camp events ──
  // Confessions — fire into each tribe's pre events
  confessions.forEach(conf => {
    const tribeName = tribes.find(t => t.members.includes(conf.player))?.name;
    if (tribeName && ep.campEvents?.[tribeName]) {
      const block = ep.campEvents[tribeName];
      (block.pre = block.pre || []).push({
        type: 'phobiaConfession', players: [conf.player],
        text: conf.reaction,
        badgeText: 'CONFESSION', badgeClass: 'gold'
      });
    }
  });

  // Challenge results — post events
  allPlayers.forEach(player => {
    const tribeName = tribes.find(t => t.members.includes(player))?.name;
    if (tribeName && ep.campEvents?.[tribeName]) {
      const block = ep.campEvents[tribeName];
      const passed = results[player] === 'pass';
      (block.post = block.post || []).push({
        type: passed ? 'phobiaConquered' : 'phobiaFailed',
        players: [player],
        text: ep.phobiaFactor.reactions[player],
        badgeText: passed ? 'CONQUERED' : 'COULDN\'T DO IT',
        badgeClass: passed ? 'gold' : 'red',
      });
    }
  });

  // Shared fear events
  sharedFears.forEach(sf => {
    const tribeName = tribes.find(t => t.members.includes(sf.players[0]))?.name;
    if (tribeName && ep.campEvents?.[tribeName]) {
      (ep.campEvents[tribeName].post = ep.campEvents[tribeName].post || []).push({
        type: 'phobiaSharedFear', players: sf.players,
        text: `${sf.players.join(' and ')} share the same fear: ${sf.fear}. They faced it knowing the other was watching.`,
        badgeText: 'SHARED FEAR', badgeClass: 'gold',
      });
    }
  });

  // Clutch events
  if (clutch) {
    const tribeName = clutch.tribe;
    if (ep.campEvents?.[tribeName]) {
      (ep.campEvents[tribeName].post = ep.campEvents[tribeName].post || []).push({
        type: clutch.result === 'pass' ? 'phobiaClutchPass' : 'phobiaClutchFail',
        players: [clutch.player],
        text: ep.phobiaFactor.reactions['_clutch'],
        badgeText: clutch.result === 'pass' ? 'CLUTCH' : 'CHOKED',
        badgeClass: clutch.result === 'pass' ? 'gold' : 'red',
      });
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: add simulatePhobiaFactor engine function"
```

---

### Task 4: Episode Flow Integration

**Files:**
- Modify: `simulator.html` — challenge execution, patchEpisodeHistory, camp boosts, twist screen filter

- [ ] **Step 1: Intercept pre-merge challenge**

Find the pre-merge tribe challenge at ~line 22269:
```javascript
  } else if (gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    const result = simulateTribeChallenge(gs.tribes);
```

Add BEFORE it:

```javascript
  } else if (ep.isPhobiaFactor && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    // Phobia Factor replaces the tribe challenge
    simulatePhobiaFactor(ep);
    // winner, loser, challengeType, tribalPlayers already set by simulatePhobiaFactor
```

- [ ] **Step 2: patchEpisodeHistory**

Near the `sayUncle` patch, add:

```javascript
  if (ep.phobiaFactor) h.phobiaFactor = ep.phobiaFactor;
  if (ep.isPhobiaFactor) h.isPhobiaFactor = true;
```

- [ ] **Step 3: Camp event boost**

Add after the `say-uncle` case:

```javascript
      case 'phobia-factor':
        boost('confessional', 35); boost('vulnerability', 25);
        boost('bond', 20); boost('doubt', 15);
        break;
```

- [ ] **Step 4: Twist screen exclusion**

Add `&& t.type !== 'phobia-factor'` to the twist screen filter chain.

- [ ] **Step 5: Commit**

```bash
git add simulator.html
git commit -m "feat: integrate Phobia Factor into episode flow"
```

---

### Task 5: Camp Event Badges

**Files:**
- Modify: `simulator.html` — badge chain in `rpBuildCampTribe()`

- [ ] **Step 1: Add badge detection**

After Say Uncle badge detections:

```javascript
    const isPhobiaConf    = evt.type === 'phobiaConfession';
    const isPhobiaConq    = evt.type === 'phobiaConquered';
    const isPhobiaFail    = evt.type === 'phobiaFailed';
    const isPhobiaClutchP = evt.type === 'phobiaClutchPass';
    const isPhobiaClutchF = evt.type === 'phobiaClutchFail';
    const isPhobiaShared  = evt.type === 'phobiaSharedFear';
```

- [ ] **Step 2: Add badge text**

```javascript
                     : isPhobiaConf    ? (evt.badgeText || 'CONFESSION')
                     : isPhobiaConq    ? (evt.badgeText || 'CONQUERED')
                     : isPhobiaFail    ? (evt.badgeText || 'COULDN\'T DO IT')
                     : isPhobiaClutchP ? (evt.badgeText || 'CLUTCH')
                     : isPhobiaClutchF ? (evt.badgeText || 'CHOKED')
                     : isPhobiaShared  ? (evt.badgeText || 'SHARED FEAR')
```

- [ ] **Step 3: Add badge class**

```javascript
                     : isPhobiaConf || isPhobiaConq || isPhobiaClutchP || isPhobiaShared ? 'gold'
                     : isPhobiaFail || isPhobiaClutchF ? 'red'
```

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: add Phobia Factor camp event badges"
```

---

### Task 6: VP Screens

**Files:**
- Modify: `simulator.html` — add VP functions before Say Uncle VP section, add reveal functions, register screens

- [ ] **Step 1: Add all VP screen functions**

Add before `// SAY UNCLE VP SCREENS`:

```javascript
// ══════════════════════════════════════════════════════════════════════
// PHOBIA FACTOR VP SCREENS
// ══════════════════════════════════════════════════════════════════════

function rpBuildPhobiaConfessions(ep) {
  const pf = ep.phobiaFactor;
  if (!pf) return '';
  const uid = 'pf-conf-' + ep.num;
  const confessions = pf.confessions || [];

  let html = `<div class="rp-page tod-dusk" id="${uid}-page" data-pf-revealed="0" data-pf-total="${confessions.length}">
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;color:var(--accent-fire);text-shadow:0 0 20px var(--accent-fire);margin-bottom:4px;animation:scrollDrop 0.5s var(--ease-broadcast) both">CAMPFIRE CONFESSIONS</div>
    <div style="font-size:11px;color:var(--muted);text-align:center;margin-bottom:20px">"What are you afraid of?"</div>`;

  confessions.forEach((conf, i) => {
    const f = pf.fears[conf.player];
    const _catColor = { 'pain': '#da3633', 'fear': '#8957e5', 'gross': '#3fb950', 'humiliation': '#db61a2' }[f?.category] || '#8b949e';
    html += `<div class="${uid}-item" style="display:none" data-idx="${i}">
      <div class="vp-card" style="margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          ${rpPortrait(conf.player, 'sm')}
          <div style="flex:1">
            <div style="font-size:13px;font-weight:700;color:var(--vp-text)">${conf.player}</div>
            <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:${_catColor};background:${_catColor}18;padding:2px 6px;border-radius:3px">${f?.title || 'Unknown'}</span>
          </div>
        </div>
        <div style="font-size:12px;color:var(--vp-text);line-height:1.5;font-style:italic">${conf.reaction}</div>
      </div>
    </div>`;
  });

  html += `<div style="display:flex;gap:10px;justify-content:center;margin-top:16px;position:sticky;bottom:10px;z-index:5">
    <button class="rp-camp-toggle-btn" style="border-color:var(--accent-fire);color:var(--accent-fire);padding:8px 20px;font-size:12px" onclick="pfRevealNext('${uid}')">NEXT \u25B6</button>
    <button class="rp-camp-toggle-btn" style="border-color:#484f58;color:#8b949e;padding:8px 16px;font-size:11px" onclick="pfRevealAll('${uid}')">REVEAL ALL</button>
  </div></div>`;
  return html;
}

function rpBuildPhobiaAnnouncement(ep) {
  const pf = ep.phobiaFactor;
  if (!pf) return '';
  const tribes = ep.tribesAtStart || gs.tribes || [];

  let html = `<div class="rp-page tod-dawn">
    <div style="font-family:var(--font-display);font-size:32px;letter-spacing:3px;text-align:center;color:var(--accent-fire);text-shadow:0 0 20px var(--accent-fire);margin-bottom:4px;animation:scrollDrop 0.5s var(--ease-broadcast) both">PHOBIA FACTOR</div>
    <div style="font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--muted);text-align:center;margin-bottom:20px">Face Your Fear</div>
    <div style="font-size:13px;color:var(--vp-text);text-align:center;margin-bottom:24px;line-height:1.7;max-width:460px;margin-left:auto;margin-right:auto;font-style:italic">
      "We watched the tapes. We know what you're afraid of. Today's challenge: face your fear. Tribe with the best completion rate wins immunity."
    </div>`;

  // Show each tribe with their members + assigned fears
  tribes.forEach(tribe => {
    const tc = tribeColor(tribe.name);
    html += `<div class="rp-tribe" style="margin-bottom:16px">
      <div class="rp-tribe-head" style="color:${tc};border-color:${tc}">${tribe.name}</div>`;
    tribe.members.forEach(name => {
      const f = pf.fears[name];
      if (!f) return;
      const _catColor = { 'pain': '#da3633', 'fear': '#8957e5', 'gross': '#3fb950', 'humiliation': '#db61a2' }[f.category] || '#8b949e';
      html += `<div style="display:flex;align-items:center;gap:8px;padding:4px 0">
        ${rpPortrait(name, 'sm')}
        <span style="font-size:12px;color:var(--vp-text);flex:1">${name}</span>
        <span style="font-size:10px;font-weight:700;letter-spacing:0.5px;color:${_catColor}">${f.title}</span>
      </div>`;
    });
    html += `</div>`;
  });

  html += `</div>`;
  return html;
}

function rpBuildPhobiaChallenge(ep) {
  const pf = ep.phobiaFactor;
  if (!pf) return '';
  const uid = 'pf-chal-' + ep.num;
  const tribes = ep.tribesAtStart || gs.tribes || [];
  const _catColor = { 'pain': '#da3633', 'fear': '#8957e5', 'gross': '#3fb950', 'humiliation': '#db61a2' };

  const revealItems = [];

  tribes.forEach(tribe => {
    const tc = tribeColor(tribe.name);
    const ts = pf.tribeScores[tribe.name] || {};
    // Tribe header
    revealItems.push({ type: 'header', html: `<div style="font-size:13px;font-weight:700;letter-spacing:2px;color:${tc};border-bottom:2px solid ${tc};padding-bottom:6px;margin:16px 0 8px">${tribe.name} <span style="color:var(--muted);font-weight:400">${ts.completions || 0}/${ts.total || 0}</span></div>` });
    // Each player
    tribe.members.forEach(name => {
      const f = pf.fears[name];
      const result = pf.results[name];
      const reaction = pf.reactions[name];
      const catCol = _catColor[f?.category] || '#8b949e';
      const passed = result === 'pass';
      let rh = `<div class="vp-card ${passed ? '' : 'fire'}" style="margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          ${rpPortrait(name, 'sm')}
          <div style="flex:1">
            <div style="font-size:12px;font-weight:700;color:var(--vp-text)">${name}</div>
            <div style="font-size:10px;color:${catCol};font-weight:600">${f?.title || '?'}</div>
          </div>
          <span style="font-size:10px;font-weight:700;letter-spacing:1px;color:${passed ? '#3fb950' : '#da3633'}">${passed ? '\u2705 CONQUERED' : '\u274c FAILED'}</span>
        </div>
        <div style="font-size:11px;color:var(--muted);line-height:1.5">${f?.desc || ''}</div>
        <div style="font-size:12px;color:var(--vp-text);line-height:1.5;margin-top:6px">${reaction || ''}</div>
      </div>`;
      revealItems.push({ type: 'player', html: rh });
    });
  });

  let html = `<div class="rp-page tod-arena" id="${uid}-page" data-pf-revealed="0" data-pf-total="${revealItems.length}">
    <div style="font-family:var(--font-display);font-size:22px;letter-spacing:2px;text-align:center;color:var(--accent-fire);margin-bottom:16px">THE CHALLENGE</div>`;

  revealItems.forEach((item, i) => {
    html += `<div class="${uid}-item" style="display:none" data-idx="${i}">${item.html}</div>`;
  });

  html += `<div style="display:flex;gap:10px;justify-content:center;margin-top:16px;position:sticky;bottom:10px;z-index:5">
    <button class="rp-camp-toggle-btn" style="border-color:var(--accent-fire);color:var(--accent-fire);padding:8px 20px;font-size:12px" onclick="pfRevealNext('${uid}')">NEXT \u25B6</button>
    <button class="rp-camp-toggle-btn" style="border-color:#484f58;color:#8b949e;padding:8px 16px;font-size:11px" onclick="pfRevealAll('${uid}')">REVEAL ALL</button>
  </div></div>`;
  return html;
}

function rpBuildPhobiaClutch(ep) {
  const pf = ep.phobiaFactor;
  if (!pf?.clutch) return '';
  const c = pf.clutch;
  const _catColor = { 'pain': '#da3633', 'fear': '#8957e5', 'gross': '#3fb950', 'humiliation': '#db61a2' }[c.fear.category] || '#8b949e';
  const passed = c.result === 'pass';

  let html = `<div class="rp-page tod-arena" style="text-align:center">
    <div style="font-family:var(--font-display);font-size:24px;letter-spacing:2px;color:var(--accent-fire);margin-bottom:8px">TRIPLE POINTS</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:16px">${c.tribe} is behind. One last chance. Triple the stakes.</div>
    ${rpPortrait(c.player, 'lg')}
    <div style="font-size:14px;font-weight:700;color:var(--vp-text);margin-top:12px">${c.player}</div>
    <div style="margin:12px 0">
      <span style="font-size:10px;font-weight:700;letter-spacing:1px;color:${_catColor};background:${_catColor}18;padding:3px 8px;border-radius:3px">${c.fear.title}</span>
    </div>
    <div style="font-size:12px;color:var(--muted);font-style:italic;margin-bottom:16px">${c.fear.desc}</div>
    <div style="font-size:14px;font-weight:700;letter-spacing:2px;color:${passed ? 'var(--accent-gold)' : '#da3633'};margin-bottom:8px">${passed ? '\u2705 CLUTCH' : '\u274c CHOKED'}</div>
    <div style="font-size:12px;color:var(--vp-text);line-height:1.5">${pf.reactions['_clutch'] || ''}</div>
    ${c.overturned ? '<div style="font-size:12px;font-weight:700;color:var(--accent-gold);margin-top:12px;letter-spacing:1px">THE RESULT IS OVERTURNED!</div>' : ''}
  </div>`;
  return html;
}

function rpBuildPhobiaResults(ep) {
  const pf = ep.phobiaFactor;
  if (!pf) return '';
  const tribes = ep.tribesAtStart || gs.tribes || [];

  let html = `<div class="rp-page tod-dawn" style="text-align:center">
    <div style="font-family:var(--font-display);font-size:22px;letter-spacing:2px;color:var(--accent-gold);margin-bottom:16px">RESULTS</div>`;

  const ranked = [...tribes].sort((a, b) => (pf.tribeScores[b.name]?.percentage || 0) - (pf.tribeScores[a.name]?.percentage || 0));
  ranked.forEach((tribe, i) => {
    const ts = pf.tribeScores[tribe.name] || {};
    const tc = tribeColor(tribe.name);
    const isWinner = tribe.name === pf.winningTribe;
    const isLoser = tribe.name === pf.losingTribe;
    const pct = Math.round((ts.percentage || 0) * 100);
    html += `<div class="vp-card ${isWinner ? 'gold' : isLoser ? 'fire' : ''}" style="margin-bottom:12px;text-align:left">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="font-size:14px;font-weight:700;color:${tc}">${tribe.name}</div>
        <div style="flex:1;text-align:right;font-size:14px;font-weight:700;font-family:var(--font-mono);color:${isWinner ? 'var(--accent-gold)' : isLoser ? '#da3633' : 'var(--muted)'}">${ts.completions}/${ts.total} (${pct}%)</div>
      </div>
      <div style="font-size:11px;font-weight:700;letter-spacing:1px;margin-top:6px;color:${isWinner ? 'var(--accent-gold)' : isLoser ? '#da3633' : 'var(--muted)'}">${isWinner ? 'WINS IMMUNITY' : isLoser ? 'GOES TO TRIBAL' : 'SAFE'}</div>
    </div>`;
  });

  html += `</div>`;
  return html;
}
```

- [ ] **Step 2: Add global reveal functions**

Near the `suRevealNext`/`suRevealAll` functions:

```javascript
// ── Phobia Factor sequential reveal ──
function pfRevealNext(uid) {
  const page = document.getElementById(uid + '-page');
  if (!page) return;
  const revealed = parseInt(page.dataset.pfRevealed) || 0;
  const total = parseInt(page.dataset.pfTotal) || 0;
  if (revealed >= total) return;
  const el = document.querySelector('.' + uid + '-item[data-idx="' + revealed + '"]');
  if (el) { el.style.display = 'block'; el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  page.dataset.pfRevealed = revealed + 1;
}
function pfRevealAll(uid) {
  const page = document.getElementById(uid + '-page');
  if (!page) return;
  const total = parseInt(page.dataset.pfTotal) || 0;
  while ((parseInt(page.dataset.pfRevealed) || 0) < total) pfRevealNext(uid);
}
```

- [ ] **Step 3: Register VP screens**

Find the Say Uncle VP registration. Add BEFORE it:

```javascript
  // ── Phobia Factor — replaces tribe challenge ──
  if (ep.isPhobiaFactor && ep.phobiaFactor) {
    vpScreens.push({ id:'pf-confessions', label:'Confessions', html: rpBuildPhobiaConfessions(ep) });
    vpScreens.push({ id:'pf-announce', label:'Phobia Factor', html: rpBuildPhobiaAnnouncement(ep) });
    vpScreens.push({ id:'pf-challenge', label:'The Challenge', html: rpBuildPhobiaChallenge(ep) });
    if (ep.phobiaFactor.clutch) {
      vpScreens.push({ id:'pf-clutch', label:'Triple Points', html: rpBuildPhobiaClutch(ep) });
    }
    vpScreens.push({ id:'pf-results', label:'Results', html: rpBuildPhobiaResults(ep) });
  }
```

Also add `&& !ep.isPhobiaFactor` to the normal challenge screen guard.

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: add Phobia Factor VP screens and registration"
```

---

### Task 7: Text Backlog + Cold Open + Episode History

**Files:**
- Modify: `simulator.html`

- [ ] **Step 1: Add text backlog function**

Before `_textSayUncle`:

```javascript
// ── PHOBIA FACTOR ──
function _textPhobiaFactor(ep, ln, sec) {
  const pf = ep.phobiaFactor;
  if (!pf) return;
  sec('PHOBIA FACTOR');
  ln('Campfire Confessions:');
  (pf.confessions || []).forEach(c => ln(`  ${c.player}: ${c.fear} (${c.category})`));
  ln('');
  ln('Challenge Results:');
  const tribes = ep.tribesAtStart || [];
  tribes.forEach(tribe => {
    const ts = pf.tribeScores[tribe.name] || {};
    ln(`  ${tribe.name}: ${ts.completions}/${ts.total} (${Math.round((ts.percentage || 0) * 100)}%)`);
    tribe.members.forEach(name => {
      ln(`    ${name}: ${pf.results[name]?.toUpperCase()} — ${pf.fears[name]?.title}`);
    });
  });
  if (pf.clutch) {
    ln('');
    ln(`TRIPLE POINTS: ${pf.clutch.player} (${pf.clutch.tribe}) — ${pf.clutch.fear.title} — ${pf.clutch.result.toUpperCase()}`);
    if (pf.clutch.overturned) ln('  RESULT OVERTURNED!');
  }
  ln('');
  ln(`WINNER: ${pf.winningTribe}`);
  ln(`LOSER: ${pf.losingTribe} — goes to tribal`);
}
```

- [ ] **Step 2: Wire into text output**

Find `_textSayUncle(ep, ln, sec)` call. Add before it:

```javascript
  _textPhobiaFactor(ep, ln, sec);
```

- [ ] **Step 3: Cold open card**

After the Say Uncle cold open card:

```javascript
    // ── [1d] PHOBIA FACTOR RECAP ──
    if (prevEp.isPhobiaFactor && prevEp.phobiaFactor) {
      const _pfData = prevEp.phobiaFactor;
      const _pfWinPct = Math.round((_pfData.tribeScores[_pfData.winningTribe]?.percentage || 0) * 100);
      html += `<div class="vp-card gold" style="margin-bottom:10px">
        <div style="font-family:var(--font-body);font-size:11px;font-weight:800;letter-spacing:1px;color:var(--accent-gold);margin-bottom:6px">PHOBIA FACTOR</div>
        <div style="font-size:12px;margin-bottom:4px">${_pfData.winningTribe} won immunity (${_pfWinPct}% conquered their fears)</div>
        ${_pfData.clutch ? `<div style="font-size:11px;color:${_pfData.clutch.result === 'pass' ? 'var(--accent-gold)' : '#da3633'}">${_pfData.clutch.player} ${_pfData.clutch.result === 'pass' ? 'hit the clutch triple points!' : 'choked on triple points'}</div>` : ''}
      </div>`;
    }
```

- [ ] **Step 4: Episode history badge**

Find the Say Uncle tag. Add:

```javascript
const pfTag = ep.isPhobiaFactor ? `<span class="ep-hist-tag" style="background:rgba(139,92,246,0.15);color:#8957e5">Phobia Factor</span>` : '';
```

Append `${pfTag}` where `${suTag}` is appended.

- [ ] **Step 5: Commit**

```bash
git add simulator.html
git commit -m "feat: add Phobia Factor text backlog, cold open, episode history badge"
```

---

### Task 8: Testing & Polish

- [ ] **Step 1: Test basic flow** — Schedule `phobia-factor` on a pre-merge episode (not ep 1). Verify confessions → announcement → challenge → results VP screens.
- [ ] **Step 2: Test triple points** — Run until a clutch triggers. Verify the Triple Points screen.
- [ ] **Step 3: Test 3+ tribes** — Set up a 3-tribe season. Verify scoring with middle tribe safe.
- [ ] **Step 4: Test guards** — Schedule on episode 1 (should skip), on post-merge (should skip).
- [ ] **Step 5: Commit fixes**
