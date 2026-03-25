# Popularity System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a persistent fan popularity system that tracks per-player scores across all episodes, drives the Fan Vote twist (saves highest-popularity active player), and awards a Fan Favorite at the end.

**Architecture:** A new `updatePopularity(ep)` function is called after each episode resolves. It scans camp events, tribal data, and vote logs, then accumulates per-axis deltas (Drama cap +6, Likability cap +4, Underdog cap +5 per episode) into `gs.popularity[name]`. Two VP features consume the scores: Fan Pulse rows in Cold Open and Camp Overview, and new Fan Vote / Fan Favorite screens.

**Tech Stack:** Vanilla JS inside `simulator.html` (single-file architecture). No external deps.

---

## File Map

| File | What changes |
|------|-------------|
| `simulator.html` | All changes — engine, VP viewer, settings UI already done |

---

## Task 1: Add `player` field to camp event push statements

Camp events currently store only `{ type, text }`. `updatePopularity` needs to know which player an event is about. Add a `player` (single) or `players` (array) field to each relevant push.

**Files:**
- Modify: `simulator.html` (lines ~4919–5810 inside `generateCampEventsForGroup`)

- [ ] **Step 1: Add player fields to all 19 event pushes**

Make these exact replacements (each is unique in context):

```
// hardWork (~line 4919) — player var is `p`
OLD: events.push({ type: 'hardWork', text: hwLines[Math.floor(Math.random() * hwLines.length)] });
NEW: events.push({ type: 'hardWork', text: hwLines[Math.floor(Math.random() * hwLines.length)], player: p });

// comfort (~line 5087) — comforter + struggling
OLD: events.push({ type: 'comfort', text: comfortLines[Math.floor(Math.random() * comfortLines.length)] });
NEW: events.push({ type: 'comfort', text: comfortLines[Math.floor(Math.random() * comfortLines.length)], players: [comforter, struggling] });

// overplay (~line 5103) — player var is `p`
OLD: events.push({ type: 'overplay', text: overplayLines[Math.floor(Math.random() * overplayLines.length)] });
NEW: events.push({ type: 'overplay', text: overplayLines[Math.floor(Math.random() * overplayLines.length)], player: p });

// tdBond (~line 5132) — players a + b
OLD: events.push({ type: 'tdBond', text: tdBondLines[Math.floor(Math.random() * tdBondLines.length)] });
NEW: events.push({ type: 'tdBond', text: tdBondLines[Math.floor(Math.random() * tdBondLines.length)], players: [a, b] });

// showmancerMoment (~line 5197) — players a + b
OLD: events.push({ type: 'showmancerMoment', text: smLines[Math.floor(Math.random() * smLines.length)] });
NEW: events.push({ type: 'showmancerMoment', text: smLines[Math.floor(Math.random() * smLines.length)], players: [a, b] });

// unexpectedCompetence (~line 5234) — player var is `p`
OLD: events.push({ type: 'unexpectedCompetence', text: ucLines[Math.floor(Math.random() * ucLines.length)] });
NEW: events.push({ type: 'unexpectedCompetence', text: ucLines[Math.floor(Math.random() * ucLines.length)], player: p });

// showboat (~line 5283) — player var is `p`
OLD: events.push({ type: 'showboat', text: sbLines[Math.floor(Math.random() * sbLines.length)] });
NEW: events.push({ type: 'showboat', text: sbLines[Math.floor(Math.random() * sbLines.length)], player: p });

// foodConflict (~line 5300) — taker is `a`
OLD: events.push({ type: 'foodConflict', text: fcLines[Math.floor(Math.random() * fcLines.length)] });
NEW: events.push({ type: 'foodConflict', text: fcLines[Math.floor(Math.random() * fcLines.length)], player: a });

// tdStrategy (~line 5347) — strategist is `a`
OLD: events.push({ type: 'tdStrategy', text: tdStratLines[Math.floor(Math.random() * tdStratLines.length)] });
NEW: events.push({ type: 'tdStrategy', text: tdStratLines[Math.floor(Math.random() * tdStratLines.length)], player: a });

// confessional (~line 5419) — player var is `p`
OLD: events.push({ type: 'confessional', text: confLines[Math.floor(Math.random() * confLines.length)] });
NEW: events.push({ type: 'confessional', text: confLines[Math.floor(Math.random() * confLines.length)], player: p });

// overconfidence (~line 5503) — player var is `p`
OLD: events.push({ type: 'overconfidence', text: ocLines[Math.floor(Math.random() * ocLines.length)] });
NEW: events.push({ type: 'overconfidence', text: ocLines[Math.floor(Math.random() * ocLines.length)], player: p });

// bigMoveThoughts (~line 5581) — player var is `p`
OLD: events.push({ type: 'bigMoveThoughts', text: bmLines[Math.floor(Math.random() * bmLines.length)] });
NEW: events.push({ type: 'bigMoveThoughts', text: bmLines[Math.floor(Math.random() * bmLines.length)], player: p });

// loneWolf (~line 5609) — player var is `p`
OLD: events.push({ type: 'loneWolf', text: lwLines[Math.floor(Math.random() * lwLines.length)] });
NEW: events.push({ type: 'loneWolf', text: lwLines[Math.floor(Math.random() * lwLines.length)], player: p });

// schemerManipulates (~line 5646) — schemer is `a`
OLD: events.push({ type: 'schemerManipulates', text: smLines[Math.floor(Math.random() * smLines.length)] });
NEW: events.push({ type: 'schemerManipulates', text: smLines[Math.floor(Math.random() * smLines.length)], player: a });

// hotheadExplosion (~line 5686) — exploder is `a`
OLD: events.push({ type: 'hotheadExplosion', text: hhLines[Math.floor(Math.random() * hhLines.length)] });
NEW: events.push({ type: 'hotheadExplosion', text: hhLines[Math.floor(Math.random() * hhLines.length)], player: a });

// socialBoost (~line 5722) — booster is `a`
OLD: events.push({ type: 'socialBoost', text: sbLines[Math.floor(Math.random() * sbLines.length)] });
NEW: events.push({ type: 'socialBoost', text: sbLines[Math.floor(Math.random() * sbLines.length)], player: a });

// soldierCheckin (~line 5742) — soldier is `a`
OLD: events.push({ type: 'soldierCheckin', text: lsLines[Math.floor(Math.random() * lsLines.length)] });
NEW: events.push({ type: 'soldierCheckin', text: lsLines[Math.floor(Math.random() * lsLines.length)], player: a });

// floaterInvisible (~line 5795) — floater is `a`
OLD: events.push({ type: 'floaterInvisible', text: fiLines[Math.floor(Math.random() * fiLines.length)] });
NEW: events.push({ type: 'floaterInvisible', text: fiLines[Math.floor(Math.random() * fiLines.length)], player: a });

// underdogMoment (~line 5810) — underdog is `a`
OLD: events.push({ type: 'underdogMoment', text: udLines[Math.floor(Math.random() * udLines.length)] });
NEW: events.push({ type: 'underdogMoment', text: udLines[Math.floor(Math.random() * udLines.length)], player: a });
```

NOTE: `allianceCrack` already has `players: [acA, acB]` — the cracker is index 0. No change needed.
NOTE: `idolFound` already has `players: [name]`. No change needed.
NOTE: `socialBomb` already has `players: [name]`. No change needed.

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: add player fields to camp event push statements for popularity tracking"
```

---

## Task 2: Initialize popularity state in `initGameState()`

**Files:**
- Modify: `simulator.html` (~line 10830)

- [ ] **Step 1: Add `popularity`, `popularityArcs`, `topVoteStreak`, `dominantAllianceStreak` to the `gs` object**

Find the `gs = {` block in `initGameState()` (starts around line 10814). The last line before the closing `};` has `jurorHistory: {},`. Add after it:

```js
    popularity: {},          // { [name]: running score }
    popularityArcs: {},      // { [name]: [{ep, delta}] } — episode-by-episode arc
    topVoteStreak: {},       // { [name]: consecutive_eps_as_top_vote_getter }
    dominantAllianceStreak: { id: null, count: 0 },
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: add popularity state fields to initGameState"
```

---

## Task 3: Implement `updatePopularity(ep)` engine function

This is the core function. Place it immediately after `simulateEpisode` ends (~line 8363, search for `// ══════════════════════════════════════════════════════════════════════\n// ENGINE: OUTPUT GENERATION`).

**Files:**
- Modify: `simulator.html` (~line 8364)

- [ ] **Step 1: Insert the full `updatePopularity` function**

Insert the following function. Find the line:
```
// ══════════════════════════════════════════════════════════════════════
// ENGINE: OUTPUT GENERATION — HELPERS
```
and insert this block immediately before it:

```js
// ══════════════════════════════════════════════════════════════════════
// ENGINE: POPULARITY SYSTEM
// ══════════════════════════════════════════════════════════════════════

function updatePopularity(ep) {
  if (seasonConfig.popularityEnabled === false) return;
  if (!gs.popularity)               gs.popularity = {};
  if (!gs.popularityArcs)           gs.popularityArcs = {};
  if (!gs.topVoteStreak)            gs.topVoteStreak = {};
  if (!gs.dominantAllianceStreak)   gs.dominantAllianceStreak = { id: null, count: 0 };

  // ── Flatten all camp events for this episode ──
  const allEvents = [];
  if (ep.campEvents) {
    Object.values(ep.campEvents).forEach(phaseData => {
      const pre  = Array.isArray(phaseData) ? phaseData : (phaseData?.pre  || []);
      const post = Array.isArray(phaseData) ? []         : (phaseData?.post || []);
      allEvents.push(...pre, ...post);
    });
  }

  // ── Per-axis per-episode accumulators ──
  const caps = { drama: 6, like: 4, under: 5 };
  const axisTotals = {};   // { name: { drama, like, under } } — tracks positive headroom
  const epDeltas = {};     // { name: [{axis, delta, reason}] }

  const ensure = name => {
    if (!axisTotals[name]) axisTotals[name] = { drama: 0, like: 0, under: 0 };
    if (!epDeltas[name])   epDeltas[name] = [];
  };

  const add = (name, axis, rawDelta, reason) => {
    ensure(name);
    let delta = rawDelta;
    if (delta > 0) {
      const headroom = caps[axis] - axisTotals[name][axis];
      delta = Math.min(delta, headroom);
      if (delta <= 0) return;
    }
    axisTotals[name][axis] += delta;
    epDeltas[name].push({ axis, delta, reason });
  };

  // ── Build per-player event index ──
  const epEventsByPlayer = {};
  allEvents.forEach(evt => {
    const pp = evt.players ? evt.players : (evt.player ? [evt.player] : []);
    pp.forEach(n => {
      if (!epEventsByPlayer[n]) epEventsByPlayer[n] = [];
      epEventsByPlayer[n].push(evt.type);
    });
  });

  // ── Scan camp events for deltas ──
  // Drama: caps at +6/ep. Likability: caps at +4/ep. Underdog: caps at +5/ep.
  allEvents.forEach(evt => {
    const p  = evt.player;            // single-player events
    const ps = evt.players;           // two-player events (index 0 = primary actor)

    switch (evt.type) {
      // ── Positive Drama ──
      case 'hotheadExplosion':    if (p)     { add(p, 'drama', 3, evt.type); } break;
      case 'showmancerMoment':    if (ps?.[0]) { add(ps[0], 'drama', 2, evt.type); add(ps[0], 'like', 1, evt.type); } break;
      case 'bigMoveThoughts':     if (p)     { add(p, 'drama', 2, evt.type); } break;
      case 'allianceCrack':       if (ps?.[0]) { add(ps[0], 'drama', 2, evt.type); } break;
      case 'confessional':        if (p)     { add(p, 'drama', 1, evt.type); } break;
      case 'tdStrategy':          if (p)     { add(p, 'drama', 1, evt.type); } break;
      case 'schemerManipulates':  if (p)     { add(p, 'drama', 1, evt.type); } break;
      // ── Positive Likability ──
      case 'socialBoost':         if (p)     { add(p, 'like', 2, evt.type); } break;
      case 'comfort':             if (ps?.[0]) { add(ps[0], 'like', 1, evt.type); } break;
      case 'tdBond':              if (ps?.[0]) { add(ps[0], 'like', 1, evt.type); } break;
      case 'underdogMoment':      if (p)     { add(p, 'like', 2, evt.type); add(p, 'under', 1, evt.type); } break;
      case 'hardWork':            if (p)     { add(p, 'like', 1, evt.type); } break;
      case 'soldierCheckin':      if (p)     { add(p, 'like', 1, evt.type); } break;
      case 'unexpectedCompetence':if (p)     { add(p, 'like', 1, evt.type); add(p, 'under', 1, evt.type); } break;
      // ── Negative Drama ──
      case 'floaterInvisible':    if (p)     { add(p, 'drama', -2, evt.type); } break;
      case 'overplay':            if (p)     { add(p, 'drama', -1, evt.type); } break;
      // ── Negative Likability ──
      case 'showboat':            if (p)     { add(p, 'like', -2, evt.type); } break;
      case 'overconfidence':      if (p)     { add(p, 'like', -1, evt.type); } break;
      case 'foodConflict':        if (p)     { add(p, 'like', -2, evt.type); } break;
      case 'loneWolf':            if (p)     { add(p, 'like', -1, evt.type); } break;
    }
  });

  // ── bigMoveThoughts AND voted correctly (+2 drama) ──
  allEvents.filter(e => e.type === 'bigMoveThoughts' && e.player).forEach(e => {
    if (ep.votingLog?.some(l => l.voter === e.player && l.voted === ep.eliminated)) {
      add(e.player, 'drama', 2, 'bigMoveVoted');
    }
  });

  // ── Social bomb backlash: -1 like to the bomber ──
  (ep.socialBombs || []).forEach(sb => {
    add(sb.player, 'like', -1, 'socialBomb');
  });

  // ── Tribal blowup: +3 drama to the player who caused it ──
  if (ep.tribalBlowup?.player) {
    add(ep.tribalBlowup.player, 'drama', 3, 'tribalBlowup');
  }

  // ── Idol plays: +2 drama to the player who played ──
  (ep.idolPlays || []).forEach(play => {
    if (play.player) add(play.player, 'drama', 2, 'idolPlay');
  });

  // ── Survived idol play against them: +3 underdog ──
  (ep.idolPlays || []).forEach(play => {
    // playedFor = the protected player; if they survive, they get the bonus
    if (play.playedFor && play.votesNegated > 0 && play.playedFor !== ep.eliminated) {
      add(play.playedFor, 'under', 3, 'survivedIdolPlay');
    }
  });

  // ── Survived being top vote-getter (most votes, not eliminated): +4 underdog ──
  if (ep.votes && ep.eliminated) {
    const sortedV = Object.entries(ep.votes).sort(([,a],[,b]) => b - a);
    const [topName, topCount] = sortedV[0] || [];
    if (topName && topName !== ep.eliminated && topCount >= 2) {
      add(topName, 'under', 4, 'survivedTopVotes');
    }
  }

  // ── Came back from bottom (was top-target last ep, safe this ep): +3 underdog ──
  const prevEp = (gs.episodeHistory || []).filter(h => h.num < ep.num).slice(-1)[0];
  if (prevEp) {
    const prevTopTarget = (prevEp.alliances || [])
      .filter(a => a.target && a.type !== 'solo' && a.members?.length >= 2)
      .sort((a, b) => (b.members?.length || 0) - (a.members?.length || 0))[0]?.target;
    if (prevTopTarget && gs.activePlayers.includes(prevTopTarget) && prevTopTarget !== ep.eliminated) {
      add(prevTopTarget, 'under', 3, 'cameBackFromBottom');
    }
  }

  // ── Voted out with unplayed idol: +2 drama, +1 underdog ──
  if (ep.eliminated && prevEp) {
    const hadIdol = (prevEp.gsSnapshot?.advantages || [])
      .some(a => a.holder === ep.eliminated && (a.type === 'idol' || a.type === 'super-idol'));
    if (hadIdol) {
      add(ep.eliminated, 'drama', 2, 'eliminatedWithIdol');
      add(ep.eliminated, 'under', 1, 'eliminatedWithIdol');
    }
  }

  // ── Tiebreaker win: +2 underdog ──
  if (ep.tiebreakerResult?.winner) {
    add(ep.tiebreakerResult.winner, 'under', 2, 'tiebreakerWin');
  }
  if (ep.tiebreakerResult1?.winner) {
    add(ep.tiebreakerResult1.winner, 'under', 2, 'tiebreakerWin');
  }

  // ── Not mentioned in any camp event: -1 drama ──
  // ── Has camp events but all atmospheric (no strategic/social): -2 drama ──
  // Atmospheric = weirdMoment, tribeMood, homesick, doubt, tribeMood
  const atmoTypes = new Set(['weirdMoment', 'tribeMood', 'homesick', 'doubt']);
  const activePop = gs.activePlayers || [];
  activePop.forEach(name => {
    const playerEvts = epEventsByPlayer[name] || [];
    if (playerEvts.length === 0) {
      add(name, 'drama', -1, 'notInCampEvents');
    } else if (playerEvts.every(t => atmoTypes.has(t))) {
      add(name, 'drama', -2, 'boringEpisode');
    }
  });

  // ── Tribal invisible (attended tribal, received 0 votes): -2 drama ──
  if (ep.tribalPlayers?.length && ep.votes && ep.eliminated) {
    ep.tribalPlayers.forEach(name => {
      if (name !== ep.eliminated && !(ep.votes[name] > 0)) {
        add(name, 'drama', -2, 'tribalInvisible');
      }
    });
  }

  // ── Voted out a player with popularity >= 10: -2 likability to each voter ──
  if (ep.eliminated && (gs.popularity[ep.eliminated] || 0) >= 10) {
    (ep.votingLog || [])
      .filter(l => l.voted === ep.eliminated)
      .forEach(l => add(l.voter, 'like', -2, 'votedOutPopular'));
  }

  // ── Was #1 vote-getter for 3+ straight tribals (bully perception): -2 like ──
  if (ep.votes) {
    const vSorted = Object.entries(ep.votes).sort(([,a],[,b]) => b - a);
    const topGetter = vSorted[0]?.[0];
    if (topGetter) {
      if (topGetter === ep.eliminated) {
        gs.topVoteStreak[topGetter] = 0;
      } else {
        gs.topVoteStreak[topGetter] = (gs.topVoteStreak[topGetter] || 0) + 1;
        if (gs.topVoteStreak[topGetter] >= 3) {
          add(topGetter, 'like', -2, 'bullyPerception');
        }
      }
      // Reset streak for everyone else
      Object.keys(gs.topVoteStreak).forEach(n => {
        if (n !== topGetter) gs.topVoteStreak[n] = 0;
      });
    }
  }

  // ── Dominant alliance 3+ consecutive controlled votes: -2 underdog to members ──
  if (ep.eliminated) {
    const controlAlliance = (ep.alliances || [])
      .filter(a => a.target === ep.eliminated && a.type !== 'solo' && a.members?.length >= 2)
      .sort((a, b) => (b.members?.length || 0) - (a.members?.length || 0))[0];
    const controlNaName = controlAlliance
      ? (gs.namedAlliances || []).find(na =>
          na.active && controlAlliance.members.every(m => na.members.includes(m)))?.name || null
      : null;

    if (controlNaName && controlNaName === gs.dominantAllianceStreak.id) {
      gs.dominantAllianceStreak.count++;
    } else {
      gs.dominantAllianceStreak = { id: controlNaName || null, count: controlNaName ? 1 : 0 };
    }
    if (gs.dominantAllianceStreak.count >= 3 && controlAlliance) {
      controlAlliance.members.forEach(m => {
        if (gs.activePlayers.includes(m)) add(m, 'under', -2, 'dominantAlliance');
      });
    }
  }

  // ── Won immunity but never threatened that episode: -1 underdog ──
  if (ep.immunityWinner && ep.challengeType === 'individual') {
    const wasTargeted = (ep.alliances || []).some(a => a.target === ep.immunityWinner);
    if (!wasTargeted) add(ep.immunityWinner, 'under', -1, 'immunityUnthreatened');
  }

  // ── Apply all deltas to gs.popularity ──
  Object.entries(epDeltas).forEach(([name, deltas]) => {
    if (!gs.popularity[name]) gs.popularity[name] = 0;
    const total = deltas.reduce((s, d) => s + d.delta, 0);
    gs.popularity[name] = Math.max(0, gs.popularity[name] + total);
  });

  // ── Save arc data for VP (episode-by-episode history) ──
  Object.entries(epDeltas).forEach(([name, deltas]) => {
    if (!gs.popularityArcs[name]) gs.popularityArcs[name] = [];
    const total = deltas.reduce((s, d) => s + d.delta, 0);
    if (total !== 0) gs.popularityArcs[name].push({ ep: ep.num, delta: total, score: gs.popularity[name] || 0 });
  });

  // ── Save to current episode history record ──
  const lastRec = gs.episodeHistory[gs.episodeHistory.length - 1];
  if (lastRec) {
    lastRec.popularityDeltas = epDeltas;
    lastRec.popularitySnapshot = { ...gs.popularity };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: implement updatePopularity(ep) engine function"
```

---

## Task 4: Call `updatePopularity(ep)` after each episode and re-save state

The cleanest hook is in `simulateNext()` and `replayEpisode()` — they're the only callers of `simulateEpisode` and `simulateFinale`. Call after the episode returns, then re-save.

**Files:**
- Modify: `simulator.html` (~lines 11030–11037 and ~11057–11059)

- [ ] **Step 1: Update `simulateNext()`**

```js
// BEFORE:
function simulateNext() {
  if (!gs) { if (!initGameState()) { alert('Add players to Cast Builder first.'); return; } }
  const ep = gs.phase === 'finale' ? simulateFinale() : simulateEpisode();
  if (!ep) return;
  viewingEpNum = ep.num;
  renderRunTab();
  document.getElementById('run-main').scrollTop = 0;
}

// AFTER:
function simulateNext() {
  if (!gs) { if (!initGameState()) { alert('Add players to Cast Builder first.'); return; } }
  const ep = gs.phase === 'finale' ? simulateFinale() : simulateEpisode();
  if (!ep) return;
  if (seasonConfig.popularityEnabled !== false) { updatePopularity(ep); saveGameState(); }
  viewingEpNum = ep.num;
  renderRunTab();
  document.getElementById('run-main').scrollTop = 0;
}
```

- [ ] **Step 2: Update `replayEpisode()` — find the block that calls `simulateEpisode()` (~line 11057)**

Find:
```js
  // Re-run this episode
  const ep = simulateEpisode();
  if (!ep) return;
  viewingEpNum = ep.num;
```

Replace with:
```js
  // Re-run this episode
  const ep = simulateEpisode();
  if (!ep) return;
  if (seasonConfig.popularityEnabled !== false) { updatePopularity(ep); saveGameState(); }
  viewingEpNum = ep.num;
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: call updatePopularity after each episode, re-save state"
```

---

## Task 5: Update Fan Vote Twist to save highest-popularity player

Replace the random-weighted logic in `applyTwist` for `fan-vote-boot` with an argmax over `gs.popularity`.

**Files:**
- Modify: `simulator.html` (~lines 4662–4668)

- [ ] **Step 1: Replace the fan-vote-boot handler**

Find:
```js
  } else if (engineType === 'fan-vote-boot') {
    const target = wRandom(gs.activePlayers, n => {
      const s = pStats(n); return Math.max(0.1, (10 - s.social) * 0.5 + s.boldness * 0.2 + Math.random());
    });
    twistObj.penaltyTarget = target;
    gs.penaltyVoteThisEp = target;
    twistObj.fanVote = true;
```

Replace with:
```js
  } else if (engineType === 'fan-vote-boot') {
    // Save the highest-popularity active player (pre-merge: immunity; post-merge: extra vote)
    const pop = gs.popularity || {};
    const sorted = [...gs.activePlayers].sort((a, b) => {
      const diff = (pop[b] || 0) - (pop[a] || 0);
      if (diff !== 0) return diff;
      // Tiebreak: earlier episode appearance = more fan investment
      const iA = players.findIndex(p => p.name === a);
      const iB = players.findIndex(p => p.name === b);
      return iA - iB;
    });
    const saved = sorted[0] || gs.activePlayers[0];
    twistObj.fanVoteSaved = saved;
    twistObj.fanVoteScore = pop[saved] || 0;
    twistObj.fanVoteIsPreMerge = gs.phase === 'pre-merge';
    twistObj.fanVote = true;
    if (gs.phase === 'pre-merge') {
      // Full tribal immunity
      if (!gs.extraImmune) gs.extraImmune = [];
      gs.extraImmune.push(saved);
      gs.guaranteedImmuneThisEp = saved;
    } else {
      // Extra vote advantage
      gs.advantages.push({ holder: saved, type: 'extra-vote', foundEp: ep.num, fromFanVote: true });
    }
```

NOTE: The old code used `penaltyTarget` (fan votes AGAINST someone). The new code uses `fanVoteSaved` (fans SAVE someone). Remove `penaltyTarget` and `penaltyVoteThisEp` from this handler — they're no longer needed. Also check if `penaltyVoteThisEp` is referenced in tribal logic and guard it: a removed `penaltyVote` against the saved player would be wrong.

Search for `penaltyVoteThisEp` usages and confirm none apply to `fanVoteSaved`. If the only usage is in tribal vote logic, the guard `if (gs.penaltyVoteThisEp)` already handles it.

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: fan vote twist now saves highest-popularity player instead of penalizing"
```

---

## Task 6: Compute Fan Favorite in `simulateFinale()`

After the winner is determined, find who has the highest `gs.popularity` score across all players (active AND eliminated).

**Files:**
- Modify: `simulator.html` (~lines 11468–11474)

- [ ] **Step 1: Add fan favorite computation after winner is set**

Find the line in `simulateFinale()`:
```js
  const summaryText = generateFinaleSummaryText(ep);
  ep.summaryText = summaryText;
```

Insert before it:
```js
  // ── Fan Favorite ──
  if (seasonConfig.popularityEnabled !== false && gs.popularity) {
    const allSeasonPlayers = players.map(p => p.name);
    const fanFav = allSeasonPlayers.reduce((best, name) =>
      (gs.popularity[name] || 0) > (gs.popularity[best] || 0) ? name : best,
      allSeasonPlayers[0]
    );
    gs.fanFavorite = fanFav;
    ep.fanFavorite = fanFav;
    ep.fanFavoriteScore = gs.popularity[fanFav] || 0;
    ep.fanFavoriteIsWinner = fanFav === ep.winner;
  }
```

- [ ] **Step 2: Save `fanFavorite` to the finale episode history record**

In the `gs.episodeHistory.push({...})` block inside `simulateFinale` (~line 11476), add:
```js
    fanFavorite: ep.fanFavorite || null,
    fanFavoriteScore: ep.fanFavoriteScore || 0,
    fanFavoriteIsWinner: ep.fanFavoriteIsWinner || false,
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: compute fan favorite in simulateFinale, save to gs.fanFavorite"
```

---

## Task 7: VP — Fan Pulse row in Cold Open

Show top 3 players by current score at the bottom of the Cold Open screen.

**Files:**
- Modify: `simulator.html` inside `rpBuildColdOpen(ep)` (~line 12047)

- [ ] **Step 1: Add Fan Pulse section before the closing `html += '</div>'`**

Find the last lines of `rpBuildColdOpen`:
```js
  html += `</div>`;
  return html;
}
```
(This is right after the `_recruits`/`_quits` forEach and the `}` that closes the `if (prevEp && ep.num > 1)` block)

Insert before `html += '</div>';`:
```js
  // ── Fan Pulse (popularity leaderboard) ──
  if (seasonConfig.popularityEnabled !== false) {
    const _popSnap = ep.popularitySnapshot || prevEp?.popularitySnapshot || {};
    const _popPlayers = [...activeAtStart].sort((a, b) => ((_popSnap[b] || 0) - (_popSnap[a] || 0)));
    const _top3 = _popPlayers.slice(0, 3).filter(n => (_popSnap[n] || 0) > 0);
    if (_top3.length) {
      html += `<div class="rp-co-divider"></div>
        <div class="vp-section-header gold" style="margin-bottom:8px">Fan Pulse</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          ${_top3.map((name, i) => {
            const score = _popSnap[name] || 0;
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
            return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px">
              ${rpPortrait(name)}
              <span style="font-size:9px;font-weight:700;color:#e3b341;font-family:var(--font-mono)">${medal} ${score}</span>
            </div>`;
          }).join('')}
        </div>`;
    }
  }
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: add Fan Pulse row to Cold Open VP screen"
```

---

## Task 8: VP — Fan Pulse section in Camp Overview

Show top 3 and bottom 3 by score at the bottom of `rpBuildRelationships`.

**Files:**
- Modify: `simulator.html` inside `rpBuildRelationships(ep)` (~line 12839)

- [ ] **Step 1: Add Fan Pulse before closing `</div>` in `rpBuildRelationships`**

Find the last lines of `rpBuildRelationships`:
```js
  html += `</div>`;
  return html;
}
```
(right after the betrayals block at ~line 12838)

Insert before `html += '</div>';`:
```js
  // ── Fan Pulse (top 3 / bottom 3) ──
  if (seasonConfig.popularityEnabled !== false) {
    const _popSnap = ep.popularitySnapshot || {};
    const _scored = active.filter(n => (_popSnap[n] || 0) > 0)
      .sort((a, b) => (_popSnap[b] || 0) - (_popSnap[a] || 0));
    if (_scored.length) {
      const _top3 = _scored.slice(0, 3);
      const _bot3 = [...active].sort((a, b) => (_popSnap[a] || 0) - (_popSnap[b] || 0))
        .slice(0, Math.min(3, active.length))
        .filter(n => !_top3.includes(n));
      html += `<div class="vp-section-header gold" style="margin-top:10px">Fan Pulse</div>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:6px">
          <div>
            <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:var(--muted);margin-bottom:4px">TOP</div>
            ${_top3.map(name => `<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;font-size:11px">
              ${rpPortrait(name, '', '')}
              <span style="color:#e3b341;font-family:var(--font-mono);font-size:10px;font-weight:700">+${_popSnap[name] || 0}</span>
            </div>`).join('')}
          </div>
          ${_bot3.length ? `<div>
            <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:var(--muted);margin-bottom:4px">BOTTOM</div>
            ${_bot3.map(name => `<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;font-size:11px">
              ${rpPortrait(name, '', '')}
              <span style="color:var(--muted);font-family:var(--font-mono);font-size:10px">${_popSnap[name] || 0}</span>
            </div>`).join('')}
          </div>` : ''}
        </div>`;
    }
  }
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: add Fan Pulse section to Camp Overview VP screen"
```

---

## Task 9: VP — Fan Vote Twist screen update

The fan-vote-boot twist screen needs to show the SAVED player (not a penalty target). The VP twist rendering is in `rpBuildPreTwist` and the twist scene generator. Update the fan-vote-boot scene to reflect the new save mechanic.

**Files:**
- Modify: `simulator.html` — search for `case 'fan-vote-boot':` in the VP/scene builder sections

- [ ] **Step 1: Find and update all fan-vote-boot VP rendering**

Search for `fan-vote-boot` in the VP builder areas (~lines 8757, 9395, 12218, 12246). For each occurrence, update to use `tw.fanVoteSaved` and `tw.fanVoteScore` instead of `tw.penaltyTarget`.

The key VP render is in `generateTwistScenes` and `rpBuildPreTwist`. Find the section that renders the fan vote boot and update it:

For the scene text (in `generateTwistScenes`), find:
```js
case 'fan-vote-boot':      if (tw.penaltyTarget) L.push(`${tw.penaltyTarget} received the most fan votes — enters tribal with a penalty vote.`); break;
```
Replace with:
```js
case 'fan-vote-boot':
  if (tw.fanVoteSaved) {
    const _fvReward = tw.fanVoteIsPreMerge ? 'tribal immunity' : 'an Extra Vote';
    L.push(`Fan Vote: ${tw.fanVoteSaved} (score: ${tw.fanVoteScore || 0}) receives ${_fvReward}.`);
  }
  break;
```

For the sidebar/VP summary (~line 12218):
```js
case 'fan-vote-boot':     if (tw.penaltyTarget) names.push(tw.penaltyTarget); break;
```
Replace with:
```js
case 'fan-vote-boot':     if (tw.fanVoteSaved) names.push(tw.fanVoteSaved); break;
```

For the full VP screen rendering, find the fan-vote-boot block in `rpBuildPreTwist` or wherever it shows twist detail, and update to display:
- Portrait of saved player
- Score: `tw.fanVoteScore`
- Reward: "Tribal Immunity" (pre-merge) or "Extra Vote" (post-merge)
- Badge: "FAN VOTE SAVE" in gold

If the fan-vote-boot section in the VP builder uses a generic twist card, add a special case:
```js
if (tw.type === 'fan-vote-boot' && tw.fanVoteSaved) {
  const reward = tw.fanVoteIsPreMerge ? 'Tribal Immunity' : 'Extra Vote';
  html += `<div class="vp-card gold" style="...">
    <div style="font-family:var(--font-display);letter-spacing:1px;margin-bottom:8px">FAN VOTE SAVE</div>
    ${rpPortrait(tw.fanVoteSaved)}
    <div style="font-size:13px;font-weight:700;margin-top:8px">${tw.fanVoteSaved}</div>
    <div style="font-size:11px;color:#e3b341;margin-top:4px">${reward} · Score: ${tw.fanVoteScore || 0}</div>
    <div style="font-size:11px;color:var(--muted);margin-top:6px">Fans have spoken — ${tw.fanVoteSaved} is safe.</div>
  </div>`;
}
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: update fan vote twist VP screens to show saved player"
```

---

## Task 10: VP — Fan Favorite screen (post-finale)

New screen shown after the finale, using `gs.fanFavorite`.

**Files:**
- Modify: `simulator.html` — add `rpBuildFanFavorite(ep)` function and wire into `buildVPScreens`

- [ ] **Step 1: Add `rpBuildFanFavorite(ep)` function**

Place it right after `rpBuildAftermath` (~after line 15817's function). Add:

```js
function rpBuildFanFavorite(ep) {
  const name = ep.fanFavorite || gs.fanFavorite;
  if (!name) return null;
  const score = ep.fanFavoriteScore ?? gs.popularity?.[name] ?? 0;
  const isWinner = ep.fanFavoriteIsWinner || (ep.winner === name);
  const arc = gs.popularityArcs?.[name] || [];
  const elimEp = gs.eliminated.includes(name)
    ? (gs.episodeHistory || []).find(h => h.eliminated === name)?.num || null
    : null;
  const biggestMoment = (gs.episodeHistory || []).reduce((best, h) => {
    const deltas = h.popularityDeltas?.[name];
    if (!deltas) return best;
    const total = deltas.reduce((s, d) => s + d.delta, 0);
    return total > (best.total || 0) ? { ep: h.num, total, reason: deltas[0]?.reason || '' } : best;
  }, {});

  let html = `<div class="rp-page tod-golden">
    <div class="rp-eyebrow">Season Finale</div>
    <div class="rp-title">${isWinner ? 'Winner &amp; Fan Favorite' : 'Fan Favorite'}</div>
    <div style="text-align:center;margin:20px 0">
      ${rpPortrait(name, '', 'FAV')}
      <div style="font-family:var(--font-display);font-size:22px;letter-spacing:2px;margin-top:12px">${name}</div>
      <div style="font-size:13px;color:#e3b341;font-family:var(--font-mono);margin-top:4px">POPULARITY SCORE: ${score}</div>
      ${elimEp ? `<div style="font-size:11px;color:var(--muted);margin-top:4px">Eliminated Episode ${elimEp} — but never forgotten.</div>` : ''}
    </div>`;

  if (arc.length) {
    html += `<div class="vp-section-header gold" style="margin-bottom:8px">Season Arc</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:12px">
        ${arc.map(a => {
          const col = a.delta > 0 ? '#e3b341' : 'var(--accent-fire)';
          const sign = a.delta > 0 ? '+' : '';
          return `<div style="font-size:10px;color:${col};font-family:var(--font-mono)">Ep${a.ep}: ${sign}${a.delta}</div>`;
        }).join('<span style="color:var(--border);padding:0 2px">·</span>')}
      </div>`;
  }

  if (biggestMoment.ep) {
    html += `<div class="vp-card gold" style="margin-top:4px">
      <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:var(--muted);margin-bottom:4px">DEFINING MOMENT</div>
      <div style="font-size:12px">Episode ${biggestMoment.ep} — ${biggestMoment.reason.replace(/([A-Z])/g,' $1').trim()}</div>
      <div style="font-size:11px;color:#e3b341;font-family:var(--font-mono);margin-top:4px">+${biggestMoment.total} popularity</div>
    </div>`;
  }

  html += `</div>`;
  return html;
}
```

- [ ] **Step 2: Wire into `buildVPScreens` for finale episodes**

Find the end of `buildVPScreens` where `aftermath` is pushed:
```js
  vpScreens.push({ id:'aftermath', label:'Aftermath', html: rpBuildAftermath(ep) });
```

After it, add:
```js
  // ── Fan Favorite (finale only) ──
  if (ep.isFinale && seasonConfig.popularityEnabled !== false) {
    const _ffHtml = rpBuildFanFavorite(ep);
    if (_ffHtml) vpScreens.push({ id:'fan-favorite', label:'Fan Favorite', html: _ffHtml });
  }
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: add Fan Favorite VP screen to finale"
```

---

## Final check

- [ ] Run a full season in the simulator from ep 1 through finale
- [ ] Confirm each episode's Cold Open shows Fan Pulse from ep 2+
- [ ] Confirm Camp Overview shows Fan Pulse section
- [ ] Confirm a fan-vote-boot twist saves the highest-popularity player and shows the VP screen
- [ ] Confirm the finale shows the Fan Favorite screen after Aftermath
- [ ] Confirm disabling popularity in season settings produces no VP Fan Pulse / Fan Favorite
- [ ] Commit final cleanup if needed:

```bash
git add simulator.html
git commit -m "feat: popularity system complete"
```
