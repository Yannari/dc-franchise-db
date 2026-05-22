# Season Stats Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a simulator-side export system that extracts all mechanical season data from `gs` at season end, producing raw stats JSON and a pre-filled template for the AI worker to add narrative.

**Architecture:** New module `js/stats-export.js` contains all extraction logic. It reads `gs`, `gs.episodeHistory`, `gs.bonds`, `gs.namedAlliances`, etc. and builds two output JSONs. A button in `run-ui.js` triggers download after finale. Worker gets a new `narrative-fill` mode that accepts the template.

**Tech Stack:** Vanilla ES modules (no build step), browser download via Blob/URL.createObjectURL, Cloudflare Worker (OpenAI API).

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `js/stats-export.js` | **Create** | All extraction logic: per-player stats, season stats, vote matrix, bond heatmap, alliance timeline, awards, template generation |
| `js/run-ui.js` | **Modify** (~line 136-148) | Add "Export Season Data" button when `gs.phase === 'complete'` |
| `js/main.js` | **Modify** (~line 93, ~line 170) | Import + expose stats-export module |
| `worker-season.js` | **Modify** (~line 22-27) | Add `narrative-fill` mode that accepts template + summaries |

---

## Task 1: Core Extraction — Per-Player Stats

**Files:**
- Create: `js/stats-export.js`

This is the largest task. Build the per-player extraction that walks `gs.episodeHistory` and computes every stat field.

- [ ] **Step 1: Create stats-export.js with imports and helper functions**

```javascript
// js/stats-export.js — End-of-season data extraction
import { gs, players, seasonConfig } from './core.js';
import { pStats } from './players.js';
import { bKey, getBond } from './bonds.js';

function _slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function _allPlayerNames() {
  return players.map(p => p.name);
}
```

- [ ] **Step 2: Build `_extractPlayerPlacements()` — elimination order + phases**

This function walks `gs.episodeHistory` to build the elimination order, then derives placement numbers and phase labels.

```javascript
function _extractPlayerPlacements() {
  const allNames = _allPlayerNames();
  const elimOrder = []; // { name, ep, voteCount }

  for (const epRec of gs.episodeHistory) {
    if (epRec.eliminated && !epRec.isFinale) {
      const votes = epRec.votes?.[epRec.eliminated] || 0;
      elimOrder.push({ name: epRec.eliminated, ep: epRec.num || (elimOrder.length + 1), voteCount: votes });
    }
  }

  const finaleResult = gs.finaleResult || {};
  const winner = finaleResult.winner || gs.activePlayers?.[0] || null;
  const jurySet = new Set(gs.jury || []);
  const castSize = allNames.length;

  const placements = {};
  // Winner = 1
  if (winner) {
    placements[winner] = { placement: 1, phase: 'Winner', ep: gs.episodeHistory.length };
  }

  // Finalists (non-winner active players) = 2, 3, ...
  const finalists = (gs.activePlayers || []).filter(n => n !== winner);
  const ftcVotes = finaleResult.finalVote ? {} : {};
  if (finaleResult.juryVotes) {
    for (const [name, votes] of Object.entries(finaleResult.juryVotes)) {
      ftcVotes[name] = votes;
    }
  }
  // Sort finalists by jury votes descending
  finalists.sort((a, b) => (ftcVotes[b] || 0) - (ftcVotes[a] || 0));
  finalists.forEach((name, i) => {
    placements[name] = { placement: i + 2, phase: 'Finalist', ep: gs.episodeHistory.length };
  });

  // Eliminated players in reverse order (last eliminated = highest placement after finalists)
  const nextPlacement = finalists.length + 2;
  for (let i = elimOrder.length - 1; i >= 0; i--) {
    const e = elimOrder[i];
    if (!placements[e.name]) {
      const rank = nextPlacement + (elimOrder.length - 1 - i);
      const phase = jurySet.has(e.name) ? 'Juror' : (gs.isMerged && e.ep >= (gs.mergeEp || 0)) ? 'Pre-Juror' : 'Pre-Merge';
      placements[e.name] = { placement: rank, phase, ep: e.ep, voteCount: e.voteCount };
    }
  }

  // Any remaining players not in elimOrder or finalists (medevacs, quits, etc.)
  for (const name of allNames) {
    if (!placements[name]) {
      placements[name] = { placement: castSize, phase: 'Pre-Merge', ep: 0, voteCount: 0 };
    }
  }

  return { placements, elimOrder, ftcVotes, winner, finalists };
}
```

- [ ] **Step 3: Build `_extractVotingData(name)` — per-player vote details**

```javascript
function _extractVotingData(name) {
  const votesReceivedDetail = [];
  const votesCast = [];
  let totalVotesReceived = 0;

  for (const epRec of gs.episodeHistory) {
    const epNum = epRec.num || (gs.episodeHistory.indexOf(epRec) + 1);
    const log = epRec.votingLog || [];

    // Votes this player received
    const receivedThisEp = log.filter(v => v.voted === name);
    if (receivedThisEp.length > 0) {
      votesReceivedDetail.push({
        ep: epNum,
        voters: receivedThisEp.map(v => ({ name: v.voter, reason: v.reason || '' })),
        total: receivedThisEp.length
      });
      totalVotesReceived += receivedThisEp.length;
    }

    // Votes this player cast
    const castThisEp = log.filter(v => v.voter === name);
    for (const v of castThisEp) {
      votesCast.push({ ep: epNum, target: v.voted, reason: v.reason || '' });
    }
  }

  return { votesReceivedDetail, votesCast, totalVotesReceived };
}
```

- [ ] **Step 4: Build `_extractChallengeData(name)` — per-player challenge scores**

```javascript
function _extractChallengeData(name) {
  const challengeScores = [];
  let immunityWins = 0;
  let rewardWins = 0;

  for (const epRec of gs.episodeHistory) {
    const epNum = epRec.num || (gs.episodeHistory.indexOf(epRec) + 1);
    const score = epRec.chalMemberScores?.[name];
    if (score !== undefined) {
      const placements = epRec.chalPlacements || {};
      let placement = null;
      for (const [pos, names] of Object.entries(placements)) {
        if (Array.isArray(names) && names.includes(name)) { placement = parseInt(pos); break; }
      }
      challengeScores.push({ ep: epNum, score, placement });
    }
    if (epRec.immunityWinner === name) immunityWins++;
    if (epRec.rewardWinner === name) rewardWins++;
  }

  const chalRecord = gs.chalRecord?.[name] || { wins: 0, podiums: 0, bombs: 0, appearances: 0 };

  return { challengeScores, immunityWins, rewardWins, chalRecord: { ...chalRecord } };
}
```

- [ ] **Step 5: Build `_extractBondData(name)` — final bonds + evolution**

```javascript
function _extractBondData(name) {
  const allNames = _allPlayerNames().filter(n => n !== name);
  const bondsFinal = {};
  for (const other of allNames) {
    const val = getBond(name, other);
    if (val !== 0) bondsFinal[other] = val;
  }

  // Bond evolution from gsSnapshots in episodeHistory
  const bondsEvolution = [];
  for (const epRec of gs.episodeHistory) {
    const epNum = epRec.num || (gs.episodeHistory.indexOf(epRec) + 1);
    const snap = epRec.gsSnapshot;
    if (snap?.bonds) {
      const epBonds = {};
      for (const other of allNames) {
        const key = [name, other].sort().join('||');
        const val = snap.bonds[key];
        if (val !== undefined && val !== 0) epBonds[other] = val;
      }
      if (Object.keys(epBonds).length > 0) {
        bondsEvolution.push({ ep: epNum, bonds: epBonds });
      }
    }
  }

  return { bondsFinal, bondsEvolution };
}
```

- [ ] **Step 6: Build `_extractAdvantageData(name)` — advantage lifecycle**

```javascript
function _extractAdvantageData(name) {
  const held = (gs.advantages || []).filter(a => a.holder === name);
  const lifecycle = held.map(a => {
    const entry = {
      type: a.type,
      foundEp: a.foundEp || null,
      inheritedFrom: a.inheritedFrom || null
    };

    // Check if played in any episode
    for (const epRec of gs.episodeHistory) {
      const plays = epRec.idolPlays || [];
      for (const play of plays) {
        if (play.player === name && play.type === a.type) {
          entry.playedEp = epRec.num || (gs.episodeHistory.indexOf(epRec) + 1);
          entry.success = !play.misplay;
          entry.votesNegated = play.votesNegated || 0;
          entry.playedFor = play.playedFor || name;
        }
      }
    }
    return entry;
  });

  // Also check SITD usage
  const sitdUsed = gs.shotInDarkUsed instanceof Set
    ? gs.shotInDarkUsed.has(name)
    : Array.isArray(gs.shotInDarkUsed) && gs.shotInDarkUsed.includes(name);

  return { advantageLifecycle: lifecycle, idolsFound: held.filter(a => !a.inheritedFrom).length, sitdUsed };
}
```

- [ ] **Step 7: Build `_extractSocialData(name)` — schemes, camp events, romance**

```javascript
function _extractSocialData(name) {
  const schemesLaunched = [];
  const schemesTargeted = [];
  const campEventsInvolved = [];

  for (const epRec of gs.episodeHistory) {
    const epNum = epRec.num || (gs.episodeHistory.indexOf(epRec) + 1);
    const campMap = epRec.campEvents || {};
    for (const [tribeKey, phases] of Object.entries(campMap)) {
      for (const phase of ['pre', 'post']) {
        const events = phases?.[phase] || [];
        for (const evt of events) {
          const evtPlayers = evt.players || [];
          if (evtPlayers.includes(name)) {
            campEventsInvolved.push({
              ep: epNum, tribe: tribeKey, phase,
              type: evt.badgeText || evt.type || 'event',
              text: evt.text || ''
            });
          }
          // Check for scheme events
          if (evt.schemer === name) {
            schemesLaunched.push({ ep: epNum, type: evt.schemeType || evt.badgeText || 'scheme', target: evt.target || '' });
          }
          if (evt.target === name && (evt.schemer || evt.schemeType)) {
            schemesTargeted.push({ ep: epNum, type: evt.schemeType || evt.badgeText || 'scheme', schemer: evt.schemer || '' });
          }
        }
      }
    }
  }

  // Showmance data
  let showmanceData = null;
  const showmances = gs.showmances || [];
  for (const sh of showmances) {
    if (sh.players && sh.players.includes(name)) {
      const partner = sh.players.find(p => p !== name);
      showmanceData = {
        partner,
        sparkEp: sh.sparkEp || null,
        phase: sh.phase || 'spark',
        intensity: sh.intensity || 0,
        broken: !!sh.broken,
        breakupEp: sh.breakupEp || null,
        fake: !!sh.fake
      };
      break;
    }
  }

  // Emotional arc
  const emotionalArc = [];
  for (const epRec of gs.episodeHistory) {
    const epNum = epRec.num || (gs.episodeHistory.indexOf(epRec) + 1);
    const snap = epRec.gsSnapshot;
    if (snap?.playerStates?.[name]) {
      emotionalArc.push({ ep: epNum, state: snap.playerStates[name].emotional || 'content' });
    }
  }

  // Popularity arc
  const popularityArc = [];
  if (gs.popularityArcs?.[name]) {
    for (const entry of gs.popularityArcs[name]) {
      popularityArc.push({ ep: entry.ep, popularity: entry.score || 0 });
    }
  } else {
    // Reconstruct from snapshots
    for (const epRec of gs.episodeHistory) {
      const epNum = epRec.num || (gs.episodeHistory.indexOf(epRec) + 1);
      const snap = epRec.gsSnapshot;
      if (snap?.popularity?.[name] !== undefined) {
        popularityArc.push({ ep: epNum, popularity: snap.popularity[name] });
      }
    }
  }

  return { schemesLaunched, schemesTargeted, campEventsInvolved, showmanceData, emotionalArc, popularityArc };
}
```

- [ ] **Step 8: Build `_extractBlindsideData(name, placements)` — blindsides**

```javascript
function _extractBlindsideData(name) {
  let blindsidesReceived = 0;
  let blindsidesOrchestrated = 0;

  for (const epRec of gs.episodeHistory) {
    const log = epRec.votingLog || [];
    const eliminated = epRec.eliminated;
    if (!eliminated) continue;

    // Get alliances at time of vote
    const snap = epRec.gsSnapshot;
    const alliances = snap?.namedAlliances || [];
    const elimAlliances = alliances.filter(a => a.members?.includes(eliminated));
    const elimAllyNames = new Set();
    for (const a of elimAlliances) {
      for (const m of a.members || []) elimAllyNames.add(m);
    }
    elimAllyNames.delete(eliminated);

    // If allies voted for the eliminated player, it's a blindside
    const allyVoters = log.filter(v => v.voted === eliminated && elimAllyNames.has(v.voter));
    const isBlindside = allyVoters.length > 0 && allyVoters.length >= elimAllyNames.size * 0.5;

    if (eliminated === name && isBlindside) {
      blindsidesReceived++;
    }

    if (isBlindside && log.some(v => v.voter === name && v.voted === eliminated)) {
      blindsidesOrchestrated++;
    }
  }

  return { blindsidesReceived, blindsidesOrchestrated };
}
```

- [ ] **Step 9: Build the main `_extractPlayerData()` that combines all sub-extractors**

```javascript
function _extractPlayerData() {
  const { placements, elimOrder, ftcVotes, winner, finalists } = _extractPlayerPlacements();
  const allNames = _allPlayerNames();
  const playerData = {};

  for (const name of allNames) {
    const p = placements[name];
    const voting = _extractVotingData(name);
    const challenge = _extractChallengeData(name);
    const bonds = _extractBondData(name);
    const advantages = _extractAdvantageData(name);
    const social = _extractSocialData(name);
    const blindsides = _extractBlindsideData(name);
    const player = players.find(pl => pl.name === name);
    const stats = pStats(name);

    const allianceNames = (gs.namedAlliances || [])
      .filter(a => a.members?.includes(name))
      .map(a => a.name);

    // Rivalries: negative bonds + mutual voting
    const rivalries = [];
    for (const other of allNames) {
      if (other === name) continue;
      const bond = getBond(name, other);
      if (bond <= -3) rivalries.push(other);
    }

    playerData[name] = {
      placement: p.placement,
      phase: p.phase,
      archetype: player?.archetype || 'floater',
      stats: stats ? { ...stats } : {},
      challengeWins: challenge.chalRecord.wins,
      immunityWins: challenge.immunityWins,
      rewardWins: challenge.rewardWins,
      idolsFound: advantages.idolsFound,
      votesReceived: voting.totalVotesReceived,
      votesReceivedDetail: voting.votesReceivedDetail,
      votesCast: voting.votesCast,
      blindsidesReceived: blindsides.blindsidesReceived,
      blindsidesOrchestrated: blindsides.blindsidesOrchestrated,
      bondsFinal: bonds.bondsFinal,
      bondsEvolution: bonds.bondsEvolution,
      popularityArc: social.popularityArc,
      campEventsInvolved: social.campEventsInvolved,
      advantageLifecycle: advantages.advantageLifecycle,
      showmanceData: social.showmanceData,
      emotionalArc: social.emotionalArc,
      challengeScores: challenge.challengeScores,
      schemesLaunched: social.schemesLaunched,
      schemesTargeted: social.schemesTargeted,
      chalRecord: challenge.chalRecord,
      alliances: allianceNames,
      rivalries,
      survivalScore: gs.survival?.[name] || 0,
      juryVotes: ftcVotes[name] || null,
      playerSlug: _slug(name)
    };
  }

  return { playerData, placements, elimOrder, ftcVotes, winner, finalists };
}
```

- [ ] **Step 10: Verify the module loads without errors**

Open `simulator.html` in a browser. Open the console. There should be no import errors. The module isn't wired up to UI yet, but the import should parse cleanly.

- [ ] **Step 11: Commit**

```
git add js/stats-export.js
git commit -m "feat: add stats-export module with per-player extraction logic"
```

---

## Task 2: Season-Level Stats, Vote Matrix, Alliance Timeline, Awards

**Files:**
- Modify: `js/stats-export.js`

Add the season-level aggregators and auto-computed awards.

- [ ] **Step 1: Build `_extractSeasonStats()` — aggregate season stats**

```javascript
function _extractSeasonStats() {
  let totalTribalCouncils = 0;
  let totalVotesCast = 0;
  let totalBlowups = 0;

  for (const epRec of gs.episodeHistory) {
    if (epRec.eliminated) totalTribalCouncils++;
    const log = epRec.votingLog || [];
    totalVotesCast += log.length;
    if (epRec.tribalBlowup) totalBlowups++;
  }

  const totalIdolsFound = (gs.advantages || []).filter(a => !a.inheritedFrom).length;
  let totalIdolsPlayed = 0;
  for (const epRec of gs.episodeHistory) {
    totalIdolsPlayed += (epRec.idolPlays || []).length;
  }

  const activeShowmances = (gs.showmances || []).length;
  const breakups = (gs.showmances || []).filter(s => s.broken).length;

  // Count blindsides
  let totalBlindsides = 0;
  for (const epRec of gs.episodeHistory) {
    const log = epRec.votingLog || [];
    const eliminated = epRec.eliminated;
    if (!eliminated) continue;
    const snap = epRec.gsSnapshot;
    const alliances = snap?.namedAlliances || [];
    const elimAlliances = alliances.filter(a => a.members?.includes(eliminated));
    const elimAllyNames = new Set();
    for (const a of elimAlliances) for (const m of a.members || []) elimAllyNames.add(m);
    elimAllyNames.delete(eliminated);
    const allyVoters = log.filter(v => v.voted === eliminated && elimAllyNames.has(v.voter));
    if (allyVoters.length > 0 && allyVoters.length >= elimAllyNames.size * 0.5) totalBlindsides++;
  }

  return {
    totalTribalCouncils, totalVotesCast, totalIdolsFound, totalIdolsPlayed,
    totalBlindsides, totalShowmances: activeShowmances, totalBreakups: breakups, totalBlowups
  };
}
```

- [ ] **Step 2: Build `_extractVoteMatrix()` — full voting record**

```javascript
function _extractVoteMatrix() {
  const matrix = {};
  for (const epRec of gs.episodeHistory) {
    const epNum = epRec.num || (gs.episodeHistory.indexOf(epRec) + 1);
    const log = epRec.votingLog || [];
    if (log.length === 0) continue;
    const epVotes = {};
    for (const v of log) {
      epVotes[v.voter] = v.voted;
    }
    matrix[epNum] = { votes: epVotes, eliminated: epRec.eliminated || null };
  }
  return matrix;
}
```

- [ ] **Step 3: Build `_extractBondHeatmap()` — all pair final bonds**

```javascript
function _extractBondHeatmap() {
  const allNames = _allPlayerNames();
  const heatmap = {};
  for (let i = 0; i < allNames.length; i++) {
    for (let j = i + 1; j < allNames.length; j++) {
      const val = getBond(allNames[i], allNames[j]);
      if (val !== 0) {
        heatmap[bKey(allNames[i], allNames[j])] = val;
      }
    }
  }
  return heatmap;
}
```

- [ ] **Step 4: Build `_extractAllianceTimeline()` — formation/dissolution**

```javascript
function _extractAllianceTimeline() {
  const allAlliances = [];

  // Active alliances
  for (const a of (gs.namedAlliances || [])) {
    allAlliances.push({
      name: a.name,
      members: [...(a.members || [])],
      formedEp: a.formed || null,
      dissolvedEp: null,
      active: true,
      betrayals: [...(a.betrayals || [])],
      permanence: a.permanence || null
    });
  }

  // Dissolved alliances
  for (const d of (gs.allianceDissolutions || [])) {
    allAlliances.push({
      name: d.name,
      members: [...(d.members || [])],
      formedEp: null,
      dissolvedEp: d.ep || null,
      active: false,
      betrayals: [...(d.betrayals || [])],
      reason: d.reason || ''
    });
  }

  return allAlliances;
}
```

- [ ] **Step 5: Build `_extractChallengeBreakdown()` — wins by style**

```javascript
function _extractChallengeBreakdown() {
  const breakdown = {};
  for (const epRec of gs.episodeHistory) {
    const style = epRec.chalStyle || epRec.challengeCategory || 'unknown';
    if (!breakdown[style]) breakdown[style] = { count: 0, winners: [] };
    breakdown[style].count++;
    if (epRec.immunityWinner) {
      breakdown[style].winners.push(epRec.immunityWinner);
    }
  }
  return breakdown;
}
```

- [ ] **Step 6: Build `_extractMoleActivity()` — mole data**

```javascript
function _extractMoleActivity() {
  if (!gs.moles || gs.moles.length === 0) return null;
  return gs.moles.map(m => ({
    player: m.player,
    sabotageCount: m.sabotageCount || 0,
    sabotageLog: [...(m.sabotageLog || [])],
    exposed: !!m.exposed,
    exposedEp: m.exposedEp || null,
    active: !!m.active,
    layingLow: !!m.layingLow
  }));
}
```

- [ ] **Step 7: Build `_computeAutoAwards(playerData)` — auto-computed awards**

```javascript
function _computeAutoAwards(playerData) {
  const entries = Object.entries(playerData);

  // Most challenge wins
  const mostChalWins = entries.reduce((best, [name, d]) =>
    d.chalRecord.wins > (best.count || 0) ? { player: name, count: d.chalRecord.wins } : best, { player: '', count: 0 });

  // Fan favorite (highest popularity)
  const fanFav = entries.reduce((best, [name, d]) => {
    const pop = gs.popularity?.[name] || 0;
    return pop > (best.popularity || -Infinity) ? { player: name, popularity: pop } : best;
  }, { player: '', popularity: -Infinity });

  // Best social game (highest avg final bond)
  const bestSocial = entries.reduce((best, [name, d]) => {
    const bonds = Object.values(d.bondsFinal || {});
    const avg = bonds.length > 0 ? bonds.reduce((s, v) => s + v, 0) / bonds.length : 0;
    return avg > (best.avgBond || -Infinity) ? { player: name, avgBond: Math.round(avg * 10) / 10 } : best;
  }, { player: '', avgBond: -Infinity });

  // Biggest blindside (most ally votes against them when eliminated)
  let biggestBlindside = { eliminated: '', ep: 0 };
  for (const epRec of gs.episodeHistory) {
    if (!epRec.eliminated) continue;
    const snap = epRec.gsSnapshot;
    const alliances = snap?.namedAlliances || [];
    const elimAlliances = alliances.filter(a => a.members?.includes(epRec.eliminated));
    let allyVoteCount = 0;
    for (const a of elimAlliances) {
      for (const m of a.members || []) {
        if (m !== epRec.eliminated && (epRec.votingLog || []).some(v => v.voter === m && v.voted === epRec.eliminated)) {
          allyVoteCount++;
        }
      }
    }
    if (allyVoteCount > (biggestBlindside.allyVotes || 0)) {
      biggestBlindside = { eliminated: epRec.eliminated, ep: epRec.num || 0, allyVotes: allyVoteCount, description: '[AI_FILL]' };
    }
  }

  // Best villain (most schemes + lowest avg bond + deep run)
  const bestVillain = entries
    .filter(([, d]) => ['villain', 'mastermind', 'schemer'].includes(d.archetype))
    .map(([name, d]) => {
      const bonds = Object.values(d.bondsFinal || {});
      const avgBond = bonds.length > 0 ? bonds.reduce((s, v) => s + v, 0) / bonds.length : 0;
      const score = d.schemesLaunched.length * 3 + (d.placement <= 5 ? 5 : 0) - avgBond;
      return { player: name, schemes: d.schemesLaunched.length, score, description: '[AI_FILL]' };
    })
    .sort((a, b) => b.score - a.score)[0] || { player: '', schemes: 0, description: '[AI_FILL]' };

  // Best underdog (worst early challenge scores + deep run)
  const bestUnderdog = entries
    .filter(([, d]) => d.placement <= Math.ceil(entries.length / 2))
    .map(([name, d]) => {
      const earlyScores = d.challengeScores.filter(c => c.ep <= 4);
      const avgEarly = earlyScores.length > 0 ? earlyScores.reduce((s, c) => s + c.score, 0) / earlyScores.length : 5;
      const score = (10 - avgEarly) + (entries.length - d.placement);
      return { player: name, score, description: '[AI_FILL]' };
    })
    .sort((a, b) => b.score - a.score)[0] || { player: '', description: '[AI_FILL]' };

  // Most dramatic (most camp events + blowups)
  const mostDramatic = entries
    .map(([name, d]) => ({ player: name, events: d.campEventsInvolved.length, description: '[AI_FILL]' }))
    .sort((a, b) => b.events - a.events)[0] || { player: '', events: 0, description: '[AI_FILL]' };

  return {
    mostChallengeWins: mostChalWins,
    fanFavorite: fanFav,
    bestSocialGame: bestSocial,
    biggestBlindside,
    bestVillain,
    bestUnderdog,
    mostDramatic
  };
}
```

- [ ] **Step 8: Commit**

```
git add js/stats-export.js
git commit -m "feat: add season-level stats, vote matrix, alliance timeline, auto awards"
```

---

## Task 3: Main Export Functions + Download

**Files:**
- Modify: `js/stats-export.js`

Build the two public export functions that combine everything into the final JSON outputs.

- [ ] **Step 1: Build `extractSeasonRawStats()` — the complete raw stats JSON**

```javascript
export function extractSeasonRawStats() {
  const { playerData, placements, elimOrder, ftcVotes, winner, finalists } = _extractPlayerData();
  const seasonStats = _extractSeasonStats();
  const voteMatrix = _extractVoteMatrix();
  const bondHeatmap = _extractBondHeatmap();
  const allianceTimeline = _extractAllianceTimeline();
  const challengeTypeBreakdown = _extractChallengeBreakdown();
  const moleActivity = _extractMoleActivity();
  const autoAwards = _computeAutoAwards(playerData);

  const finalistData = [winner, ...finalists].filter(Boolean).map(name => ({
    name,
    playerSlug: _slug(name),
    placement: playerData[name]?.placement || 0,
    juryVotes: ftcVotes[name] || 0
  }));

  const eliminationOrder = elimOrder.map(e => ({
    name: e.name,
    ep: e.ep,
    voteCount: e.voteCount,
    unanimous: false,
    blindside: playerData[e.name]?.blindsidesReceived > 0
  }));

  return {
    seasonNumber: seasonConfig?.seasonNumber || gs.episodeHistory.length > 0 ? 10 : 0,
    castSize: _allPlayerNames().length,
    episodeCount: gs.episodeHistory.length,
    jurySize: (gs.jury || []).length,
    winner: winner || '',
    finalists: finalistData,
    eliminationOrder,
    players: playerData,
    seasonStats,
    voteMatrix,
    bondHeatmap,
    allianceTimeline,
    challengeTypeBreakdown,
    moleActivity,
    autoAwards,
    riData: {
      players: gs.riPlayers || [],
      duelHistory: gs.riDuelHistory || [],
      lifeEvents: gs.riLifeEvents || {},
      quits: gs.riQuits || []
    },
    showmances: (gs.showmances || []).map(s => ({
      players: s.players,
      sparkEp: s.sparkEp,
      phase: s.phase,
      intensity: s.intensity,
      broken: !!s.broken,
      breakupEp: s.breakupEp || null
    })),
    loveTriangles: (gs.loveTriangles || []).map(t => ({
      center: t.center,
      suitors: t.suitors,
      jealousyLevel: t.jealousyLevel,
      resolved: !!t.resolved
    }))
  };
}
```

- [ ] **Step 2: Build `extractSeasonTemplate()` — the pre-filled template with [AI_FILL] markers**

```javascript
export function extractSeasonTemplate() {
  const raw = extractSeasonRawStats();
  const finaleResult = gs.finaleResult || {};

  const template = {
    seasonNumber: raw.seasonNumber,
    title: '[AI_FILL]',
    subtitle: '[AI_FILL]',
    castSize: raw.castSize,
    episodeCount: raw.episodeCount,
    jurySize: raw.jurySize,
    winner: {
      name: raw.winner,
      playerSlug: _slug(raw.winner),
      vote: finaleResult.finalVote || `${raw.finalists[0]?.juryVotes || 0}-${raw.finalists[1]?.juryVotes || 0}${raw.finalists[2] ? '-' + (raw.finalists[2].juryVotes || 0) : ''}`,
      runnerUp: raw.finalists.slice(1).map(f => f.name).join(' & '),
      keyStats: '[AI_FILL]',
      strategy: '[AI_FILL]',
      legacy: '[AI_FILL]'
    },
    finalists: raw.finalists.map(f => ({
      name: f.name,
      playerSlug: f.playerSlug,
      placement: f.placement,
      votes: f.juryVotes
    })),
    placements: Object.entries(raw.players)
      .sort(([, a], [, b]) => a.placement - b.placement)
      .map(([name, d]) => ({
        placement: d.placement,
        name,
        playerSlug: _slug(name),
        phase: d.phase,
        notes: '[AI_FILL]',
        strategicRank: '[AI_FILL]',
        story: '[AI_FILL]',
        gameplayStyle: '[AI_FILL]',
        keyMoments: '[AI_FILL]',
        challengeWins: d.challengeWins,
        immunityWins: d.immunityWins,
        rewardWins: d.rewardWins,
        idolsFound: d.idolsFound,
        votesReceived: d.votesReceived,
        alliances: d.alliances,
        rivalries: d.rivalries
      })),
    seasonNarrative: '[AI_FILL]',
    awards: '[AI_FILL]'
  };

  return template;
}
```

- [ ] **Step 3: Build `downloadSeasonExport()` — browser download trigger**

```javascript
function _downloadJSON(data, filename) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadSeasonExport() {
  const seasonNum = seasonConfig?.seasonNumber || gs.episodeHistory.length;
  const rawStats = extractSeasonRawStats();
  const template = extractSeasonTemplate();

  _downloadJSON(rawStats, `season${seasonNum}-raw-stats.json`);

  // Small delay so browser handles two downloads
  setTimeout(() => {
    _downloadJSON(template, `season${seasonNum}-data-template.json`);
  }, 500);

  return { rawStats, template };
}
```

- [ ] **Step 4: Commit**

```
git add js/stats-export.js
git commit -m "feat: add main export functions and browser download trigger"
```

---

## Task 4: UI Integration — Export Button in run-ui.js

**Files:**
- Modify: `js/run-ui.js` (~lines 136-148)
- Modify: `js/main.js` (~line 93, ~line 170)

Wire up the export button and module import.

- [ ] **Step 1: Add import in main.js**

After line 93 (`import * as savestateMod from './savestate.js';`), add:

```javascript
import * as statsExportMod from './stats-export.js';
```

- [ ] **Step 2: Add to extractedModules array in main.js**

In the `extractedModules` array (line 162-173), add `statsExportMod` after `savestateMod`:

```javascript
  savestateMod,
  statsExportMod,
];
```

- [ ] **Step 3: Add export button in run-ui.js renderGameState()**

In `js/run-ui.js`, find the block at lines 136-148 where `gs.phase === 'complete'` is handled. After the button disable logic (line 139), add the export button:

```javascript
  if (gs.phase === 'complete' || gs.activePlayers.length <= 1) {
    btn.textContent = 'Season Complete'; btn.disabled = true;
    if (sim5Btn) sim5Btn.style.display = 'none';
    if (simAllBtn) simAllBtn.style.display = 'none';

    // Export Season Data button
    let exportBtn = document.getElementById('export-season-btn');
    if (!exportBtn) {
      exportBtn = document.createElement('button');
      exportBtn.id = 'export-season-btn';
      exportBtn.className = 'btn';
      exportBtn.style.cssText = 'margin-top:8px;background:var(--accent);color:#fff;width:100%;padding:8px 12px;border-radius:6px;cursor:pointer;font-weight:600;border:none;';
      exportBtn.textContent = 'Export Season Data';
      exportBtn.onclick = () => {
        window.downloadSeasonExport();
        exportBtn.textContent = 'Exported!';
        exportBtn.disabled = true;
        setTimeout(() => { exportBtn.textContent = 'Export Season Data'; exportBtn.disabled = false; }, 3000);
      };
      btn.parentElement.insertBefore(exportBtn, btn.nextSibling);
    }
  }
```

- [ ] **Step 4: Test the full flow**

1. Open `simulator.html` in browser
2. Set up a cast and run a full season through finale
3. When "Season Complete" appears, the "Export Season Data" button should appear below it
4. Click it — two JSON files should download
5. Open both files and verify:
   - `season{N}-raw-stats.json` has player data with all fields populated
   - `season{N}-data-template.json` has stats filled and `[AI_FILL]` for narrative fields

- [ ] **Step 5: Commit**

```
git add js/main.js js/run-ui.js
git commit -m "feat: wire up export button in run UI after season complete"
```

---

## Task 5: Worker — Add narrative-fill Mode

**Files:**
- Modify: `worker-season.js` (~lines 17-27)

Add a new mode that accepts the pre-filled template and only asks the AI to write narrative fields.

- [ ] **Step 1: Add mode dispatch in worker-season.js**

At line 22-26 in the mode dispatch block, add the new mode:

```javascript
    if (mode === "episode") {
      return await generateEpisode(summaryText, season, episode, env, previousEpisodes);
    } else if (mode === "narrative-fill") {
      return await generateNarrativeFill(body, env);
    } else if (mode === "season-data-extraction") {
      return await generateSeasonDataExtraction(body, env);
    } else {
      return await generateAnalytics(summaryText, season, episode, env);
    }
```

- [ ] **Step 2: Build the `generateNarrativeFill()` function**

Add after the `generateSeasonDataExtraction` function (after line 335):

```javascript
async function generateNarrativeFill(body, env) {
  const { template, episodes, season, seasonTitle, metadata } = body;

  if (!template || !episodes) {
    return new Response(JSON.stringify({ error: "Missing template or episodes" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const canonicalCast = template.placements?.map(p => p.name) || [];
  const castItemSchema = canonicalCast.length
    ? { type: "string", enum: canonicalCast }
    : { type: "string" };

  // Build episode summaries
  let episodeSummaries = '';
  episodes.forEach(ep => {
    episodeSummaries += `\n\n=== EPISODE ${ep.episode} ===\n${ep.summary}`;
  });

  // Schema for narrative-only fields
  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string", description: "Season title (e.g. 'Total Drama: Champions vs Contenders')" },
      subtitle: { type: "string", description: "Season subtitle/tagline" },
      winner: {
        type: "object",
        additionalProperties: false,
        properties: {
          keyStats: { type: "string" },
          strategy: { type: "string", description: "2-3 sentences on how they won" },
          legacy: { type: "string", description: "1-2 sentences on their franchise impact" }
        },
        required: ["keyStats", "strategy", "legacy"]
      },
      placements: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: castItemSchema,
            notes: { type: "string" },
            strategicRank: { type: "number", description: "1-10 scale" },
            story: { type: "string", description: "A compelling 4-8 sentence narrative arc. Write like a sports documentary voiceover — dramatic, specific, present tense." },
            gameplayStyle: { type: "string", description: "3-6 words — evocative, not generic." },
            keyMoments: { type: "array", items: { type: "string" } }
          },
          required: ["name", "notes", "strategicRank", "story", "gameplayStyle", "keyMoments"]
        }
      },
      seasonNarrative: { type: "string", description: "2-3 sentence overview of season story arc" },
      awards: template.placements ? JSON.parse(JSON.stringify(
        // Reuse the same awards schema from generateSeasonDataExtraction
        {
          type: "object",
          additionalProperties: false,
          properties: {
            bestStrategic:   { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] },
            bestSocial:      { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] },
            bestPhysical:    { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, wins: { type: "number" }, description: { type: "string" } }, required: ["name", "playerSlug", "wins", "description"] },
            mostClutch:      { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] },
            mostLoyal:       { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] },
            bestUnderdog:    { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] },
            biggestVillain:  { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] },
            mostChaotic:     { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] },
            quietestThreat:  { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] },
            seasonMVP:       { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] },
            mostTragic:      { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] },
            mostUnlucky:     { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] },
            ironPerson:      { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] },
            biggestMeltdown: { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, episode: { type: "number" }, description: { type: "string" } }, required: ["name", "playerSlug", "episode", "description"] },
            playerOfSeason:     { type: "object", additionalProperties: false, properties: { gold: { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] }, silver: { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] } }, required: ["gold", "silver"] },
            heroOfSeason:       { type: "object", additionalProperties: false, properties: { gold: { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] }, silver: { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] } }, required: ["gold", "silver"] },
            villainOfSeason:    { type: "object", additionalProperties: false, properties: { gold: { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] }, silver: { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] } }, required: ["gold", "silver"] },
            compBeast:          { type: "object", additionalProperties: false, properties: { gold: { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] }, silver: { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] } }, required: ["gold", "silver"] },
            socialQueenKing:    { type: "object", additionalProperties: false, properties: { gold: { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] }, silver: { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] } }, required: ["gold", "silver"] },
            masterStrategist:   { type: "object", additionalProperties: false, properties: { gold: { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] }, silver: { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] } }, required: ["gold", "silver"] },
            mostBrutalExit:     { type: "object", additionalProperties: false, properties: { gold: { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] }, silver: { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] } }, required: ["gold", "silver"] },
            advantageKing:      { type: "object", additionalProperties: false, properties: { gold: { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] }, silver: { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] } }, required: ["gold", "silver"] },
            mostRobbedPlayer:   { type: "object", additionalProperties: false, properties: { gold: { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] } }, required: ["gold"] },
            ftcGame:            { type: "object", additionalProperties: false, properties: { gold: { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] } }, required: ["gold"] },
            mostRobbedFinalist: { type: "object", additionalProperties: false, properties: { gold: { type: "object", additionalProperties: false, properties: { name: castItemSchema, playerSlug: { type: "string" }, description: { type: "string" } }, required: ["name", "playerSlug", "description"] } }, required: ["gold"] },
            messiestFeud: { type: "object", additionalProperties: false, properties: { players: { type: "array", items: castItemSchema, minItems: 2, maxItems: 4 }, description: { type: "string" } }, required: ["players", "description"] },
            biggestBetrayal: { type: "object", additionalProperties: false, properties: { betrayer: castItemSchema, betrayed: castItemSchema, episode: { type: "number" }, description: { type: "string" } }, required: ["betrayer", "betrayed", "episode", "description"] },
            secondBiggestBetrayal: { type: "object", additionalProperties: false, properties: { betrayer: castItemSchema, betrayed: castItemSchema, episode: { type: "number" }, description: { type: "string" } }, required: ["betrayer", "betrayed", "episode", "description"] },
            legacyMoment: { type: "object", additionalProperties: false, properties: { name: { type: "string" }, episode: { type: "number" }, description: { type: "string" } }, required: ["name", "episode", "description"] }
          },
          required: [
            "bestStrategic", "bestSocial", "bestPhysical", "mostClutch", "mostLoyal",
            "bestUnderdog", "biggestVillain", "mostChaotic", "quietestThreat", "seasonMVP",
            "mostTragic", "mostUnlucky", "ironPerson", "biggestMeltdown",
            "playerOfSeason", "heroOfSeason", "villainOfSeason", "compBeast",
            "socialQueenKing", "masterStrategist", "mostBrutalExit", "advantageKing",
            "mostRobbedPlayer", "ftcGame", "mostRobbedFinalist",
            "messiestFeud", "biggestBetrayal", "secondBiggestBetrayal", "legacyMoment"
          ]
        }
      )) : { type: "object" }
    },
    required: ["title", "subtitle", "winner", "placements", "seasonNarrative", "awards"]
  };

  const templateSummary = JSON.stringify({
    seasonNumber: template.seasonNumber,
    castSize: template.castSize,
    episodeCount: template.episodeCount,
    winner: template.winner?.name,
    finalists: template.finalists?.map(f => `${f.name} (${f.votes} jury votes)`),
    placements: template.placements?.map(p => `#${p.placement} ${p.name} (${p.phase}) — ${p.challengeWins} chal wins, ${p.immunityWins} immunity, ${p.votesReceived} votes against, allies: ${p.alliances?.join(', ')}, rivals: ${p.rivalries?.join(', ')}`)
  }, null, 2);

  const instructions = `
You are writing narrative content for a Total Drama season. All STATS are already filled in — you only write NARRATIVE fields.

SEASON DATA (pre-computed, DO NOT change these numbers):
${templateSummary}

YOUR JOB: Fill in narrative fields ONLY. For each player, write:
- notes: 1 sentence summary
- strategicRank: 1-10 number
- story: 4-8 sentence narrative arc. Write like a sports documentary voiceover — dramatic, specific, present tense.
- gameplayStyle: 3-6 evocative words (NOT generic like "Strategic player")
- keyMoments: Array of 3-8 specific moment descriptions with episode numbers

Also write: title, subtitle, seasonNarrative, winner analysis (keyStats/strategy/legacy), and all awards.

IMPORTANT: Use EXACTLY these player names — do not modify, abbreviate, or add suffixes.
Cast: ${canonicalCast.join(', ')}

EPISODE SUMMARIES (for narrative context):
${episodeSummaries}

Return ONLY valid JSON matching the schema.
`.trim();

  const payload = {
    model: "gpt-5.5",
    instructions,
    input: episodeSummaries,
    text: { format: { type: "json_schema", name: "narrative_fill", strict: true, schema } },
  };

  return await callOpenAI(payload, env);
}
```

- [ ] **Step 3: Commit**

```
git add worker-season.js
git commit -m "feat: add narrative-fill mode to worker for template-based extraction"
```

---

## Task 6: Final Testing + Edge Case Handling

**Files:**
- Modify: `js/stats-export.js`

Add defensive checks for edge cases the extraction might hit.

- [ ] **Step 1: Add null-safety guards throughout extraction functions**

At the top of `extractSeasonRawStats()`, add early returns for incomplete state:

```javascript
export function extractSeasonRawStats() {
  if (!gs || !gs.episodeHistory || gs.episodeHistory.length === 0) {
    return { error: 'No season data to export. Run a full season first.' };
  }
  if (!players || players.length === 0) {
    return { error: 'No players loaded.' };
  }
  // ... rest of function
```

Add to `downloadSeasonExport()`:

```javascript
export function downloadSeasonExport() {
  const rawStats = extractSeasonRawStats();
  if (rawStats.error) {
    alert(rawStats.error);
    return null;
  }
  // ... rest of function
```

- [ ] **Step 2: Handle Sets that may not have been converted**

In `_extractAdvantageData`, the `gs.shotInDarkUsed` check already handles both Set and Array. Add similar guards wherever gs fields might be Sets:

```javascript
function _isInSet(setOrArr, value) {
  if (setOrArr instanceof Set) return setOrArr.has(value);
  if (Array.isArray(setOrArr)) return setOrArr.includes(value);
  return false;
}
```

Use `_isInSet` anywhere checking Set-like gs fields.

- [ ] **Step 3: Handle missing gsSnapshot gracefully**

Some episodeHistory entries might not have `gsSnapshot` (older seasons or if snapshots are disabled). The bond evolution and emotional arc extractors already check for `snap?.bonds` and `snap?.playerStates`, but add a count:

In `_extractBondData`, if no snapshots exist, return empty evolution:

```javascript
  const bondsEvolution = [];
  for (const epRec of gs.episodeHistory) {
    const epNum = epRec.num || (gs.episodeHistory.indexOf(epRec) + 1);
    const snap = epRec.gsSnapshot;
    if (!snap) continue; // No snapshot for this episode
    // ... rest
  }
```

- [ ] **Step 4: Run a full season and verify export**

1. Open simulator, configure a cast, run all episodes through finale
2. Click "Export Season Data"
3. Open `season{N}-raw-stats.json`:
   - Verify all players have placements
   - Verify voteMatrix has entries for each tribal council
   - Verify bondHeatmap has values
   - Verify autoAwards has non-empty player names
4. Open `season{N}-data-template.json`:
   - Verify stats fields are filled (numbers, arrays)
   - Verify narrative fields show `[AI_FILL]`
   - Verify placement order is correct (winner = 1)

- [ ] **Step 5: Commit**

```
git add js/stats-export.js
git commit -m "feat: add edge case handling and null safety to stats export"
```

---

## Task 7: Spoiler-Free Mode Support

**Files:**
- Modify: `js/run-ui.js` (~line 67-68)

The spoiler-free mode branch also needs the export button when season is complete.

- [ ] **Step 1: Add export button to spoiler-free complete state**

In the spoiler-free block (~line 67-68), after `btn.disabled = d.phase === 'complete'`, add:

```javascript
    btn.textContent = d.phase === 'complete' ? 'Season Complete' : 'Simulate Next Episode';
    btn.disabled = d.phase === 'complete';
    if (d.phase === 'complete') {
      let exportBtn = document.getElementById('export-season-btn');
      if (!exportBtn) {
        exportBtn = document.createElement('button');
        exportBtn.id = 'export-season-btn';
        exportBtn.className = 'btn';
        exportBtn.style.cssText = 'margin-top:8px;background:var(--accent);color:#fff;width:100%;padding:8px 12px;border-radius:6px;cursor:pointer;font-weight:600;border:none;';
        exportBtn.textContent = 'Export Season Data';
        exportBtn.onclick = () => {
          window.downloadSeasonExport();
          exportBtn.textContent = 'Exported!';
          exportBtn.disabled = true;
          setTimeout(() => { exportBtn.textContent = 'Export Season Data'; exportBtn.disabled = false; }, 3000);
        };
        btn.parentElement.insertBefore(exportBtn, btn.nextSibling);
      }
    }
```

- [ ] **Step 2: Commit**

```
git add js/run-ui.js
git commit -m "feat: add export button to spoiler-free mode"
```
