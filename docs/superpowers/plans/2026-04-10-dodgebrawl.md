# Dodgebrawl Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a schedulable pre-merge Dodgebrawl challenge twist — multi-round dodgeball with highlights, camp events, and click-to-reveal VP.

**Architecture:** New `simulateDodgebrawl(ep)` function handles round simulation, highlights, and camp events. Flag set in `applyTwist`, simulation runs in `simulateEpisode` challenge branch (same pattern as cliff-dive/awake-a-thon). VP via `rpBuildDodgebrawl(ep)`. Text backlog via `_textDodgebrawl(ep, ln, sec)`.

**Tech Stack:** Pure JS in `simulator.html`. No external dependencies.

---

### Task 1: TWIST_CATALOG Entry + applyTwist Flag

**Files:**
- Modify: `simulator.html:1634` (TWIST_CATALOG, after awake-a-thon)
- Modify: `simulator.html:12981` (applyTwist, after awake-a-thon case)

- [ ] **Step 1: Add the catalog entry**

After line 1634 (the awake-a-thon entry), add:

```javascript
  { id:'dodgebrawl', emoji:'🏐', name:'Dodgebrawl', category:'challenge', phase:'pre-merge', desc:'Multi-round dodgeball. All tribes on the court — first to 3 wins immunity. Highlights, heroics, and blame.', engineType:'dodgebrawl', minTribes:2 },
```

- [ ] **Step 2: Add the applyTwist flag**

After line 12981 (end of awake-a-thon case `ep.isAwakeAThon = true;`), add:

```javascript

  } else if (engineType === 'dodgebrawl') {
    if (gs.isMerged || gs.tribes.length < 2) return;
    ep.isDodgebrawl = true;
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: add Dodgebrawl to TWIST_CATALOG + applyTwist flag"
```

---

### Task 2: Core Simulation — `simulateDodgebrawl(ep)`

**Files:**
- Modify: `simulator.html` — add function near `simulateAwakeAThon` (line ~6968)

- [ ] **Step 1: Add the simulation function**

Place `simulateDodgebrawl(ep)` right after the `simulateAwakeAThon` function ends. Search for the end of `simulateAwakeAThon` (the closing `}` before the next function), and add after it:

```javascript
  // ══════════════════════════════════════════════════════════════════════
  // DODGEBRAWL — multi-round dodgeball challenge (pre-merge, tribe vs tribe)
  // ══════════════════════════════════════════════════════════════════════
  function simulateDodgebrawl(ep) {
    const tribes = gs.tribes.filter(t => t.members.filter(m => gs.activePlayers.includes(m)).length >= 2);
    if (tribes.length < 2) return;

    // ── Court size: 5 or smallest tribe's active count ──
    const tribeMembers = tribes.map(t => ({
      name: t.name,
      members: t.members.filter(m => gs.activePlayers.includes(m))
    }));
    const smallestSize = Math.min(...tribeMembers.map(t => t.members.length));
    const courtSize = Math.min(5, smallestSize);

    // ── Refusers: max 1 per tribe, low boldness + low loyalty ──
    const refusers = [];
    tribeMembers.forEach(t => {
      if (t.members.length <= courtSize) return; // no sit-outs needed, no refusal possible
      const candidates = t.members.map(name => {
        const s = pStats(name);
        const chance = (10 - s.boldness) * 0.03 + (10 - s.loyalty) * 0.02;
        return { name, chance };
      }).filter(c => Math.random() < c.chance);
      if (candidates.length) {
        const refuser = candidates.sort((a, b) => b.chance - a.chance)[0].name;
        refusers.push({ name: refuser, tribe: t.name });
      }
    });

    // ── Build rotation pools (exclude refusers) ──
    const rotationPools = {};
    tribeMembers.forEach(t => {
      const available = t.members.filter(m => !refusers.some(r => r.name === m));
      rotationPools[t.name] = { available, queue: [...available], played: new Set() };
    });

    // ── Helper: pick lineup for a tribe this round ──
    function pickLineup(tribeName) {
      const pool = rotationPools[tribeName];
      const lineup = [];
      // Fill from queue first (rotation)
      while (lineup.length < courtSize && pool.queue.length > 0) {
        lineup.push(pool.queue.shift());
      }
      // If queue exhausted, reset rotation
      if (lineup.length < courtSize) {
        pool.queue = pool.available.filter(m => !lineup.includes(m));
        while (lineup.length < courtSize && pool.queue.length > 0) {
          lineup.push(pool.queue.shift());
        }
      }
      lineup.forEach(m => pool.played.add(m));
      return lineup;
    }

    // ── Score formula ──
    function dodgeballScore(name) {
      const s = pStats(name);
      return s.physical * 0.35 + s.intuition * 0.30 + s.endurance * 0.20 + s.mental * 0.15 + Math.random() * 2.0;
    }

    // ── Simulate rounds ──
    const rounds = [];
    const tribeWins = {};
    const cumulativeScores = {};
    tribes.forEach(t => { tribeWins[t.name] = 0; cumulativeScores[t.name] = 0; });
    const playerTotalScores = {};

    let roundNum = 0;
    const maxWins = 3;
    while (!Object.values(tribeWins).some(w => w >= maxWins) && roundNum < 7) {
      roundNum++;
      const roundData = { num: roundNum, lineups: {}, scores: {}, tribeScores: {}, highlights: [], winner: null };

      // Pick lineups and score
      tribeMembers.forEach(t => {
        const lineup = pickLineup(t.name);
        roundData.lineups[t.name] = lineup;
        const playerScores = {};
        let tribeTotal = 0;
        lineup.forEach(name => {
          const score = dodgeballScore(name);
          playerScores[name] = score;
          tribeTotal += score;
          playerTotalScores[name] = (playerTotalScores[name] || 0) + score;
        });
        roundData.scores[t.name] = playerScores;
        roundData.tribeScores[t.name] = tribeTotal;
        cumulativeScores[t.name] += tribeTotal;
      });

      // Determine round winner (highest tribe score)
      const sortedTribes = Object.entries(roundData.tribeScores).sort(([,a], [,b]) => b - a);
      roundData.winner = sortedTribes[0][0];
      tribeWins[roundData.winner]++;

      // ── Generate highlights (max 3 per round) ──
      const allScoresThisRound = Object.values(roundData.scores).flatMap(ts => Object.entries(ts));
      const roundAvg = allScoresThisRound.reduce((s, [,v]) => s + v, 0) / Math.max(1, allScoresThisRound.length);
      const winnerScores = roundData.scores[roundData.winner] || {};
      const loserTribes = sortedTribes.slice(1).map(([name]) => name);

      // Trick Shot: top scorer with high mental
      const topScorer = allScoresThisRound.sort(([,a], [,b]) => b - a)[0];
      if (topScorer && pStats(topScorer[0]).mental >= 7 && roundData.highlights.length < 3) {
        const pr = pronouns(topScorer[0]);
        roundData.highlights.push({
          type: 'trickShot', player: topScorer[0],
          text: `${topScorer[0]} pulls off a trick shot — the ball curves mid-air and finds its target. The court goes silent.`,
        });
        addBond(topScorer[0], Object.keys(winnerScores).find(p => p !== topScorer[0]) || topScorer[0], 0.3);
      }

      // Rage Mode: someone scores 2x round average
      const rageCandidates = allScoresThisRound.filter(([,s]) => s >= roundAvg * 2);
      if (rageCandidates.length && roundData.highlights.length < 3) {
        const rager = rageCandidates.sort(([,a], [,b]) => b - a)[0];
        const pr = pronouns(rager[0]);
        roundData.highlights.push({
          type: 'rageMode', player: rager[0],
          text: `Something snaps in ${rager[0]}. ${pr.Sub} ${pr.sub === 'they' ? 'grab' : 'grabs'} every ball in reach and starts firing. Three players go down before anyone can react.`,
        });
        if (!gs._dodgebrawlHeat) gs._dodgebrawlHeat = {};
        gs._dodgebrawlHeat[rager[0]] = { amount: 1.0, expiresEp: ((gs.episode || 0) + 1) + 1 };
      }

      // Clutch Dodge: losing tribe's top scorer carried (>60% of tribe total)
      loserTribes.forEach(lt => {
        const ltScores = roundData.scores[lt] || {};
        const ltTotal = roundData.tribeScores[lt] || 1;
        const ltTop = Object.entries(ltScores).sort(([,a], [,b]) => b - a)[0];
        if (ltTop && ltTop[1] > ltTotal * 0.6 && roundData.highlights.length < 3) {
          const pr = pronouns(ltTop[0]);
          roundData.highlights.push({
            type: 'clutchDodge', player: ltTop[0],
            text: `${ltTop[0]} is the last one standing for ${lt}. ${pr.Sub} ${pr.sub === 'they' ? 'dodge' : 'dodges'} three throws in a row — but it's not enough.`,
          });
          // Bond boost from impressed teammates
          Object.keys(ltScores).filter(p => p !== ltTop[0]).forEach(p => addBond(p, ltTop[0], 0.3));
        }
      });

      // Rush Strategy: winning tribe has high strategic player
      const winnerPlayers = Object.keys(winnerScores);
      const strategist = winnerPlayers.find(p => pStats(p).strategic >= 7);
      if (strategist && roundData.highlights.length < 3 && roundNum >= 2) {
        const pr = pronouns(strategist);
        const targetTribe = loserTribes[0];
        const targetPlayer = Object.entries(roundData.scores[targetTribe] || {}).sort(([,a], [,b]) => b - a)[0]?.[0];
        roundData.highlights.push({
          type: 'rushStrategy', player: strategist, target: targetPlayer,
          text: `${strategist} calls the shots. "Everyone throw at ${targetPlayer || 'their best player'}. Now." The rush strategy works — ${targetPlayer || 'the target'} goes down under a wall of rubber.`,
        });
        const _bmState = gs.playerStates?.[strategist] || {};
        _bmState.bigMoves = (_bmState.bigMoves || 0) + 1;
        if (!gs.playerStates) gs.playerStates = {};
        gs.playerStates[strategist] = _bmState;
        if (!gs.bigMoveEarnersThisEp) gs.bigMoveEarnersThisEp = [];
        if (!gs.bigMoveEarnersThisEp.includes(strategist)) gs.bigMoveEarnersThisEp.push(strategist);
      }

      // Friendly Fire: bottom scorer on losing tribe, low physical, 15% chance
      loserTribes.forEach(lt => {
        const ltScores = Object.entries(roundData.scores[lt] || {}).sort(([,a], [,b]) => a - b);
        const worst = ltScores[0];
        if (worst && pStats(worst[0]).physical <= 4 && Math.random() < 0.15 && roundData.highlights.length < 3) {
          const victim = ltScores[1]?.[0] || ltScores[0]?.[0];
          const pr = pronouns(worst[0]);
          roundData.highlights.push({
            type: 'friendlyFire', player: worst[0], victim,
            text: `${worst[0]} winds up and throws — straight into ${victim}'s back. ${pr.Pos} own teammate. The court erupts.`,
          });
          addBond(victim, worst[0], -0.5);
        }
      });

      // Refusal: refuser's tribe lost this round
      refusers.forEach(r => {
        if (loserTribes.includes(r.tribe) && roundData.highlights.length < 3) {
          const rMembers = tribeMembers.find(t => t.name === r.tribe)?.members.filter(m => m !== r.name) || [];
          roundData.highlights.push({
            type: 'refusal', player: r.name,
            text: `${r.name} watches from the bench. Again. ${pronouns(r.name).Pos} tribe just lost and ${pronouns(r.name).sub} didn't lift a finger.`,
          });
          rMembers.forEach(m => addBond(m, r.name, -0.5));
          if (!gs._dodgebrawlHeat) gs._dodgebrawlHeat = {};
          gs._dodgebrawlHeat[r.name] = { amount: 1.5, expiresEp: ((gs.episode || 0) + 1) + 1 };
        }
      });

      rounds.push(roundData);
    }

    // ── Determine winner and loser ──
    const finalSorted = Object.entries(tribeWins).sort(([,a], [,b]) => b - a);
    const winnerName = finalSorted[0][0];
    // Loser: fewest wins, tiebreaker = lowest cumulative score
    const loserCandidates = finalSorted.filter(([,w]) => w === finalSorted[finalSorted.length - 1][1]);
    const loserName = loserCandidates.length === 1
      ? loserCandidates[0][0]
      : loserCandidates.sort(([a], [b]) => (cumulativeScores[a] || 0) - (cumulativeScores[b] || 0))[0][0];

    const winner = gs.tribes.find(t => t.name === winnerName);
    const loser = gs.tribes.find(t => t.name === loserName);

    // ── Refusers get score 0 ──
    refusers.forEach(r => { playerTotalScores[r.name] = 0; });

    // ── Set ep fields (same pattern as other challenge twists) ──
    ep.winner = winner;
    ep.loser = loser;
    ep.challengeType = 'tribe';
    ep.tribalPlayers = [...loser.members];
    ep.challengeLabel = 'Dodgebrawl';
    ep.challengeCategory = 'physical';
    ep.challengeDesc = `Multi-round dodgeball. First to ${maxWins} wins immunity.`;
    ep.chalMemberScores = playerTotalScores;
    ep.chalSitOuts = {};

    // Build sit-out list per tribe
    tribeMembers.forEach(t => {
      const allPlayed = new Set();
      rounds.forEach(r => (r.lineups[t.name] || []).forEach(p => allPlayed.add(p)));
      const satOut = t.members.filter(m => !allPlayed.has(m));
      if (satOut.length) ep.chalSitOuts[t.name] = satOut;
    });

    // ── Update challenge record ──
    updateChalRecord(ep);

    // ── Generate camp events (2 per tribe: 1 positive + 1 negative) ──
    if (!ep.campEvents) ep.campEvents = {};
    tribeMembers.forEach(t => {
      const key = t.name;
      if (!ep.campEvents[key]) ep.campEvents[key] = { pre: [], post: [] };
      if (!ep.campEvents[key].post) ep.campEvents[key].post = [];

      const memberScores = t.members.map(name => ({
        name,
        total: playerTotalScores[name] || 0,
        expected: (() => { const s = pStats(name); return s.physical * 0.35 + s.intuition * 0.30 + s.endurance * 0.20 + s.mental * 0.15; })() * rounds.length
      }));
      const sorted = memberScores.sort((a, b) => b.total - a.total);

      // ── POSITIVE EVENT ──
      const mvp = sorted[0];
      const nonMvpSorted = sorted.slice(1);
      // Check for Redemption first
      const round1Scores = rounds[0]?.scores[t.name] || {};
      const redemptionCandidate = sorted.find(p => {
        const r1Score = round1Scores[p.name] || 0;
        const r1Sorted = Object.values(round1Scores).sort((a, b) => a - b);
        const isBottomHalf = r1Score <= (r1Sorted[Math.floor(r1Sorted.length / 2)] || 0);
        const wasTopLater = rounds.slice(1).some(r => {
          const rScores = r.scores[t.name] || {};
          const rSorted = Object.entries(rScores).sort(([,a], [,b]) => b - a);
          return rSorted[0]?.[0] === p.name;
        });
        return isBottomHalf && wasTopLater;
      });

      if (redemptionCandidate && redemptionCandidate.name !== mvp.name) {
        const pr = pronouns(redemptionCandidate.name);
        ep.campEvents[key].post.push({
          type: 'dodgebrawlRedemption', players: [redemptionCandidate.name],
          text: `${redemptionCandidate.name} started rough — one of the worst in round 1. But ${pr.sub} came back hard. When it mattered, ${pr.sub} delivered.`,
          consequences: '+0.3 bond from tribemates.',
          badgeText: 'REDEMPTION', badgeClass: 'gold'
        });
        t.members.filter(m => m !== redemptionCandidate.name).forEach(m => addBond(m, redemptionCandidate.name, 0.3));
      } else if (nonMvpSorted.length) {
        // Team Player: highest social+loyalty among non-MVPs
        const teamPlayer = nonMvpSorted.sort((a, b) => {
          const sA = pStats(a.name); const sB = pStats(b.name);
          return (sB.social * 0.5 + sB.loyalty * 0.5) - (sA.social * 0.5 + sA.loyalty * 0.5);
        })[0];
        if (teamPlayer) {
          const pr = pronouns(teamPlayer.name);
          ep.campEvents[key].post.push({
            type: 'dodgebrawlTeamPlayer', players: [teamPlayer.name, mvp.name],
            text: `${teamPlayer.name} didn't need the spotlight. ${pr.Sub} kept feeding balls to ${mvp.name}, set up plays, covered gaps. That kind of selflessness doesn't go unnoticed.`,
            consequences: '+0.4 bond with tribemates.',
            badgeText: 'TEAM PLAYER', badgeClass: 'gold'
          });
          t.members.filter(m => m !== teamPlayer.name).slice(0, 2).forEach(m => addBond(m, teamPlayer.name, 0.4));
        }
      } else {
        // Solo tribe MVP — just give hero event
        const pr = pronouns(mvp.name);
        ep.campEvents[key].post.push({
          type: 'dodgebrawlHero', players: [mvp.name],
          text: `${mvp.name} carried the team. Every round, ${pr.sub} ${pr.sub === 'they' ? 'were' : 'was'} the one making plays.`,
          consequences: '+0.5 bond, +2 popularity.',
          badgeText: 'DODGEBALL HERO', badgeClass: 'gold'
        });
        t.members.filter(m => m !== mvp.name).forEach(m => addBond(m, mvp.name, 0.5));
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[mvp.name] = (gs.popularity[mvp.name] || 0) + 2;
      }

      // ── NEGATIVE EVENT ──
      const refuser = refusers.find(r => r.tribe === t.name);
      if (refuser) {
        const pr = pronouns(refuser.name);
        ep.campEvents[key].post.push({
          type: 'dodgebrawlRefusal', players: [refuser.name],
          text: `${refuser.name} sat out every round. ${pr.Sub} gave the team nothing but attitude and sarcastic commentary from the bench.`,
          consequences: '-0.5 bond from all tribemates, +1.5 heat.',
          badgeText: 'REFUSED TO PLAY', badgeClass: 'red'
        });
        t.members.filter(m => m !== refuser.name).forEach(m => addBond(m, refuser.name, -0.5));
        if (!gs._dodgebrawlHeat) gs._dodgebrawlHeat = {};
        gs._dodgebrawlHeat[refuser.name] = { amount: 1.5, expiresEp: ((gs.episode || 0) + 1) + 1 };
      } else {
        // Choked vs Liability: pick the bigger underperformer
        const worstPerformer = sorted[sorted.length - 1];
        const biggestChoke = memberScores.sort((a, b) => (a.total - a.expected) - (b.total - b.expected))[0];
        const chokeGap = biggestChoke ? biggestChoke.expected - biggestChoke.total : 0;
        const useChoke = chokeGap > 1.5 && biggestChoke.name !== worstPerformer?.name;

        if (useChoke && biggestChoke) {
          const pr = pronouns(biggestChoke.name);
          ep.campEvents[key].post.push({
            type: 'dodgebrawlChoke', players: [biggestChoke.name],
            text: `${biggestChoke.name} was supposed to be good at this. ${pr.Sub} ${pr.sub === 'they' ? 'weren\'t' : 'wasn\'t'}. The tribe expected more and got less.`,
            consequences: '-0.3 bond, +0.5 heat.',
            badgeText: 'CHOKED', badgeClass: 'red'
          });
          t.members.filter(m => m !== biggestChoke.name).forEach(m => addBond(m, biggestChoke.name, -0.3));
          if (!gs._dodgebrawlHeat) gs._dodgebrawlHeat = {};
          gs._dodgebrawlHeat[biggestChoke.name] = { amount: 0.5, expiresEp: ((gs.episode || 0) + 1) + 1 };
        } else if (worstPerformer) {
          const pr = pronouns(worstPerformer.name);
          const isLoser = t.name === loserName;
          ep.campEvents[key].post.push({
            type: 'dodgebrawlLiability', players: [worstPerformer.name],
            text: `${worstPerformer.name} was the weakest link on the court. ${isLoser ? 'The tribe knows exactly who cost them.' : `Even in a win, the tribe noticed.`}`,
            consequences: `${isLoser ? '-0.3 bond, +0.5 heat.' : '-0.2 bond.'}`,
            badgeText: 'LIABILITY', badgeClass: 'red'
          });
          const bondDelta = isLoser ? -0.3 : -0.2;
          t.members.filter(m => m !== worstPerformer.name).forEach(m => addBond(m, worstPerformer.name, bondDelta));
          if (isLoser) {
            if (!gs._dodgebrawlHeat) gs._dodgebrawlHeat = {};
            gs._dodgebrawlHeat[worstPerformer.name] = { amount: 0.5, expiresEp: ((gs.episode || 0) + 1) + 1 };
          }
        }
      }
    });

    // ── Store dodgebrawl data ──
    ep.dodgebrawl = {
      rounds, courtSize, refusers, tribeWins, cumulativeScores,
      winner: winnerName, loser: loserName,
      finalScore: tribeWins,
      mvp: Object.entries(playerTotalScores).sort(([,a], [,b]) => b - a)[0]?.[0] || null,
    };
  }
```

- [ ] **Step 2: Wire into simulateEpisode challenge branch**

After line 24175 (end of awake-a-thon branch), add:

```javascript
  } else if (ep.isDodgebrawl && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    simulateDodgebrawl(ep);
    // winner, loser, challengeType, tribalPlayers already set by simulateDodgebrawl
```

- [ ] **Step 3: Add dodgebrawl heat to computeHeat**

Find the line `if (gs._emissaryHeat?.[name]` in computeHeat (around line 4205) and add after it:

```javascript
  if (gs._dodgebrawlHeat?.[name] && ((gs.episode || 0) + 1) < gs._dodgebrawlHeat[name].expiresEp) heat += gs._dodgebrawlHeat[name].amount;
```

- [ ] **Step 4: Add dodgebrawl heat clearing**

Find the emissary heat clearing block (search for `Clear expired emissary heat`) and add after it:

```javascript
    // Clear expired dodgebrawl heat
    if (gs._dodgebrawlHeat) {
      Object.keys(gs._dodgebrawlHeat).forEach(k => {
        if (((gs.episode || 0) + 1) >= gs._dodgebrawlHeat[k].expiresEp) delete gs._dodgebrawlHeat[k];
      });
      if (!Object.keys(gs._dodgebrawlHeat).length) delete gs._dodgebrawlHeat;
    }
```

- [ ] **Step 5: Commit**

```bash
git add simulator.html
git commit -m "feat: simulateDodgebrawl — round simulation, highlights, camp events"
```

---

### Task 3: Episode History + patchEpisodeHistory

**Files:**
- Modify: `simulator.html` — episode history push (~line 27267) and patchEpisodeHistory (~line 32483)

- [ ] **Step 1: Add dodgebrawl fields to episode history push**

Find the `emissaryDissolve:` line in the standard episode history push and add after it:

```javascript
    isDodgebrawl:       ep.isDodgebrawl       || false,
    dodgebrawl:         ep.dodgebrawl         || null,
```

- [ ] **Step 2: Add to patchEpisodeHistory**

Find `if (!h.awakeAThon && ep.awakeAThon) h.awakeAThon = ep.awakeAThon;` and add after it:

```javascript
  if (ep.isDodgebrawl) h.isDodgebrawl = true;
  if (!h.dodgebrawl && ep.dodgebrawl) h.dodgebrawl = ep.dodgebrawl;
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: dodgebrawl episode history fields + patchEpisodeHistory"
```

---

### Task 4: Camp Event Badges

**Files:**
- Modify: `simulator.html` — badge text chain (~line 40677) and badge class chain (~line 40783)

- [ ] **Step 1: Add badge text entries**

After the awake-a-thon badge text entries (after `awakeAThonFirstOut` line), add:

```javascript
                     : evt.type === 'dodgebrawlTeamPlayer'    ? (evt.badgeText || 'TEAM PLAYER')
                     : evt.type === 'dodgebrawlHero'          ? (evt.badgeText || 'DODGEBALL HERO')
                     : evt.type === 'dodgebrawlRedemption'    ? (evt.badgeText || 'REDEMPTION')
                     : evt.type === 'dodgebrawlRefusal'       ? (evt.badgeText || 'REFUSED TO PLAY')
                     : evt.type === 'dodgebrawlChoke'         ? (evt.badgeText || 'CHOKED')
                     : evt.type === 'dodgebrawlLiability'     ? (evt.badgeText || 'LIABILITY')
```

- [ ] **Step 2: Add badge class entries**

Find the emissary badge class entries (`evt.type === 'emissaryObservation'`) and add after them:

```javascript
                     : evt.type === 'dodgebrawlTeamPlayer' || evt.type === 'dodgebrawlHero' || evt.type === 'dodgebrawlRedemption' ? 'gold'
                     : evt.type === 'dodgebrawlRefusal' || evt.type === 'dodgebrawlChoke' || evt.type === 'dodgebrawlLiability' ? 'red'
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: dodgebrawl camp event badge text + class entries"
```

---

### Task 5: VP Screen — `rpBuildDodgebrawl(ep)`

**Files:**
- Modify: `simulator.html` — add function near `rpBuildAwakeAThon` (~line 49089)
- Modify: `simulator.html` — register in buildVPScreens (~line 50654)

- [ ] **Step 1: Add the VP function**

Place before `rpBuildCliffDive` (around line 49199):

```javascript
function rpBuildDodgebrawl(ep) {
  const db = ep.dodgebrawl;
  if (!db?.rounds?.length) return null;

  const stateKey = `db_reveal_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  const totalItems = db.rounds.length;
  const allRevealed = state.idx >= totalItems - 1;

  const _dbReveal = (targetIdx) => `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};_tvState['${stateKey}'].idx=${targetIdx};const ep=gs.episodeHistory.find(e=>e.num===${ep.num});if(ep){const m=document.querySelector('.rp-main');const st=m?m.scrollTop:0;buildVPScreens(ep);renderVPScreen();if(m)m.scrollTop=st;}`;

  // Build live scoreboard based on revealed rounds
  const revealedWins = {};
  Object.keys(db.tribeWins).forEach(t => { revealedWins[t] = 0; });
  db.rounds.forEach((r, i) => { if (i <= state.idx) revealedWins[r.winner]++; });

  let html = `<div class="rp-page tod-dawn">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;color:#e06030;text-shadow:0 0 20px rgba(224,96,48,0.3);margin-bottom:4px">🏐 DODGEBRAWL</div>
    <div style="text-align:center;font-size:12px;color:#8b949e;margin-bottom:6px">${db.courtSize}v${db.courtSize} · First to 3 wins immunity</div>`;

  // Scoreboard bar
  const scoreEntries = Object.entries(revealedWins);
  html += `<div style="display:flex;justify-content:center;gap:16px;margin-bottom:16px;padding:8px;border-radius:8px;background:rgba(255,255,255,0.03)">`;
  scoreEntries.forEach(([tribe, wins], i) => {
    const tc = tribeColor(tribe);
    const isWinner = allRevealed && tribe === db.winner;
    html += `<div style="text-align:center;${isWinner ? 'text-shadow:0 0 10px ' + tc : ''}">
      <div style="font-family:var(--font-display);font-size:${isWinner ? '24' : '20'}px;color:${tc};font-weight:700">${wins}</div>
      <div style="font-size:10px;color:${tc};opacity:0.8">${tribe}</div>
    </div>`;
    if (i < scoreEntries.length - 1) html += `<div style="font-size:16px;color:#8b949e;align-self:center">—</div>`;
  });
  html += `</div>`;

  // Refusers callout
  if (db.refusers?.length) {
    db.refusers.forEach(r => {
      html += `<div style="padding:6px 10px;margin-bottom:8px;border-radius:6px;background:rgba(248,81,73,0.08);border-left:3px solid #f85149;font-size:11px">
        <span style="font-weight:700;color:#f85149">REFUSING TO PLAY:</span> ${rpPortrait(r.name, 'xs')} <span style="color:#8b949e">${r.name} (${r.tribe}) sits on the bench every round.</span>
      </div>`;
    });
  }

  // Per-round cards
  db.rounds.forEach((r, i) => {
    const isVisible = i <= state.idx;
    if (!isVisible) {
      html += `<div style="padding:12px;margin-bottom:4px;border:1px solid var(--border);border-radius:6px;opacity:0.12;font-size:12px;text-align:center;color:var(--muted)">Round ${r.num}</div>`;
    } else {
      const rTC = tribeColor(r.winner);
      // Find round MVP
      const allRoundScores = Object.entries(r.scores).flatMap(([tribe, ps]) => Object.entries(ps).map(([p, s]) => ({ name: p, score: s, tribe })));
      const mvp = allRoundScores.sort((a, b) => b.score - a.score)[0];

      html += `<div style="padding:12px;margin-bottom:6px;border-radius:8px;border-left:3px solid ${rTC};background:${rTC}08;animation:scrollDrop 0.3s var(--ease-broadcast) both">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-family:var(--font-display);font-size:13px;letter-spacing:1px">ROUND ${r.num}</span>
          <span style="font-size:11px;font-weight:700;color:${rTC}">${r.winner} WINS</span>
        </div>`;

      // Narrative paragraph with highlights
      if (r.highlights.length) {
        r.highlights.forEach(h => {
          const hColor = h.type === 'friendlyFire' || h.type === 'refusal' ? '#f85149' : h.type === 'clutchDodge' ? '#58a6ff' : '#f0a500';
          const hLabel = h.type === 'trickShot' ? 'TRICK SHOT' : h.type === 'rageMode' ? 'RAGE MODE' : h.type === 'clutchDodge' ? 'CLUTCH DODGE' : h.type === 'rushStrategy' ? 'RUSH STRATEGY' : h.type === 'friendlyFire' ? 'FRIENDLY FIRE' : 'REFUSED';
          html += `<div style="margin-bottom:6px;padding:6px 8px;border-radius:4px;background:${hColor}0a">
            <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:${hColor}">${hLabel}</span>
            <div style="display:inline-flex;gap:4px;vertical-align:middle;margin-left:4px">${rpPortrait(h.player, 'xs')}</div>
            <div style="font-size:12px;margin-top:4px">${h.text}</div>
          </div>`;
        });
      } else {
        html += `<div style="font-size:12px;color:#8b949e">${r.winner} takes the round. No standout moments — just solid play across the board.</div>`;
      }

      // Round MVP
      if (mvp) {
        html += `<div style="display:flex;align-items:center;gap:6px;margin-top:6px;font-size:10px;color:#8b949e">
          ${rpPortrait(mvp.name, 'xs')} <span>MVP: <strong>${mvp.name}</strong></span>
        </div>`;
      }
      html += `</div>`;
    }
  });

  // Final result (after all revealed)
  if (allRevealed) {
    const wTC = tribeColor(db.winner);
    const lTC = tribeColor(db.loser);
    html += `<div style="padding:14px;margin-top:8px;border-radius:10px;border:2px solid ${wTC};background:${wTC}0a;text-align:center">
      <div style="font-family:var(--font-display);font-size:16px;color:${wTC};margin-bottom:4px">${db.winner} WINS IMMUNITY</div>
      <div style="font-size:12px;color:#8b949e">${db.loser} goes to tribal council.</div>
      ${db.mvp ? `<div style="margin-top:8px;font-size:11px;color:#8b949e">Challenge MVP: ${rpPortrait(db.mvp, 'sm')}</div>` : ''}
    </div>`;
  }

  // Buttons
  if (!allRevealed) {
    html += `<div style="position:sticky;bottom:0;padding:12px 0;text-align:center;background:linear-gradient(transparent,var(--bg-primary) 30%)">
      <button class="rp-btn" onclick="${_dbReveal(state.idx + 1)}">NEXT</button>
      <button class="rp-btn rp-btn-secondary" onclick="${_dbReveal(totalItems - 1)}" style="margin-left:8px">REVEAL ALL</button>
    </div>`;
  }

  html += `</div>`;
  return html;
}
```

- [ ] **Step 2: Register in buildVPScreens**

After line 50654 (awake-a-thon registration), add:

```javascript
  } else if (ep.isDodgebrawl && ep.dodgebrawl) {
    vpScreens.push({ id:'dodgebrawl', label:'Dodgebrawl', html: rpBuildDodgebrawl(ep) });
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: dodgebrawl VP screen (click-to-reveal per round with live scoreboard)"
```

---

### Task 6: Text Backlog

**Files:**
- Modify: `simulator.html` — add `_textDodgebrawl` near `_textAwakeAThon` (~line 29845)
- Modify: `simulator.html` — call it from `generateSummaryText`

- [ ] **Step 1: Add the text function**

After `_textAwakeAThon` function, add:

```javascript
function _textDodgebrawl(ep, ln, sec) {
  if (!ep.isDodgebrawl || !ep.dodgebrawl) return;
  const db = ep.dodgebrawl;
  sec('DODGEBRAWL');
  ln(`${db.courtSize}v${db.courtSize} dodgeball — first to 3 wins immunity.`);
  if (db.refusers?.length) ln(`Refused to play: ${db.refusers.map(r => r.name).join(', ')}`);
  db.rounds.forEach(r => {
    let line = `Round ${r.num}: ${r.winner} wins.`;
    r.highlights.forEach(h => {
      if (h.type === 'trickShot') line += ` ${h.player} trick shot.`;
      else if (h.type === 'rageMode') line += ` ${h.player} rage mode.`;
      else if (h.type === 'clutchDodge') line += ` ${h.player} clutch dodge.`;
      else if (h.type === 'rushStrategy') line += ` ${h.player} calls rush strategy.`;
      else if (h.type === 'friendlyFire') line += ` ${h.player} friendly fire on ${h.victim}.`;
      else if (h.type === 'refusal') line += ` ${h.player} sat out again.`;
    });
    ln(line);
  });
  ln(`Final: ${Object.entries(db.finalScore).map(([t, w]) => `${t} ${w}`).join(' — ')}`);
  ln(`Winner: ${db.winner}. ${db.loser} goes to tribal.`);
  if (db.mvp) ln(`MVP: ${db.mvp}`);
}
```

- [ ] **Step 2: Call from generateSummaryText**

Find where `_textAwakeAThon(ep, ln, sec)` is called in `generateSummaryText` and add after it:

```javascript
  _textDodgebrawl(ep, ln, sec);
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: dodgebrawl text backlog"
```

---

### Task 7: Cold Open Recap + Episode Timeline Tag

**Files:**
- Modify: `simulator.html` — rpBuildColdOpen (~line 36254) and timeline tags (~line 33160)

- [ ] **Step 1: Add cold open recap**

After the awake-a-thon recap block (search for `prevEp.isAwakeAThon && prevEp.awakeAThon`), add:

```javascript
    if (prevEp.isDodgebrawl && prevEp.dodgebrawl) {
      const _db = prevEp.dodgebrawl;
      const _dbScore = Object.entries(_db.finalScore).map(([t, w]) => `${t} ${w}`).join('–');
      html += `<div class="vp-card" style="border-color:rgba(224,96,48,0.15);margin-bottom:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#e06030;margin-bottom:4px">DODGEBRAWL</div>
        <div style="font-size:12px;color:#8b949e">${_db.winner} won immunity (${_dbScore}).${_db.mvp ? ` MVP: ${_db.mvp}.` : ''}${_db.refusers?.length ? ` ${_db.refusers[0].name} refused to play.` : ''}</div>
      </div>`;
    }
```

- [ ] **Step 2: Add timeline tag**

After the `aatTag` definition (line 33160), add:

```javascript
    const dbTag = ep.isDodgebrawl ? `<span class="ep-hist-tag" style="background:rgba(224,96,48,0.15);color:#e06030">Dodgebrawl</span>` : '';
```

Then find the tag rendering line (line ~33169) and add `${dbTag}` to the tag chain:

```javascript
      <div>${riTag}${mergeTag}${finaleTag}${slasherTag}${tddTag}${suTag}${pfTag}${cdTag}${aatTag}${evTag}${dbTag}</div>
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: dodgebrawl cold open recap + episode timeline tag"
```

---

### Task 8: CLAUDE.md Documentation

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add to Key Engine Functions**

After `generateEmissaryScoutEvents(ep)`, add:

```
- `simulateDodgebrawl(ep)` — multi-round dodgeball challenge (pre-merge, first to 3)
```

- [ ] **Step 2: Add to Core State**

After `gs._emissaryHeat`, add:

```
- `gs._dodgebrawlHeat` — temporary heat from dodgebrawl (refusal, rage mode, liability)
```

- [ ] **Step 3: Add Dodgebrawl section**

After the Emissary Vote section, add:

```markdown
## Dodgebrawl
- Schedulable pre-merge challenge (`dodgebrawl` in TWIST_CATALOG, category `challenge`)
- Multi-round dodgeball: all tribes on court simultaneously, first to 3 round wins gets immunity
- Court size: 5v5 default, matches smallest tribe if fewer than 5. Minimum 2v2.
- Sit-outs: rotation enforced. 1 refuser per tribe (low boldness + loyalty).
- Score: `physical * 0.35 + intuition * 0.30 + endurance * 0.20 + mental * 0.15 + random`
- 6 highlight types: trick shot, rage mode, clutch dodge, rush strategy, friendly fire, refusal
- Max 3 highlights per round. Highlights have bond/heat/bigMoves consequences.
- 2 camp events per tribe (1 positive, 1 negative): team player, hero, redemption, choked, liability, refusal
- 3+ tribes: all on court, first to 3. Loser = fewest wins (tiebreaker: lowest cumulative score).
- VP: `rpBuildDodgebrawl(ep)` — click-to-reveal per round with live scoreboard
- Text backlog: `_textDodgebrawl(ep, ln, sec)`
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add Dodgebrawl to CLAUDE.md"
```
