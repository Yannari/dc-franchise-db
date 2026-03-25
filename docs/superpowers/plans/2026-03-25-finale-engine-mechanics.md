# Finale Engine Mechanics — Implementation Plan (Sub-Plan 1 of 6)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the engine-side mechanics for the finale overhaul: smart decision logic, finaleSize=4 branch, bench selection, assistant selection, multi-stage final challenge, and FTC swing votes.

**Architecture:** All changes in `simulator.html`. New functions are added near the existing finale engine block (~line 11997-12440). The existing `simulateFinale()` is restructured to call new sub-functions. All new data is stored on `ep` and saved to `gs.episodeHistory`.

**Tech Stack:** Vanilla JS in a single HTML file. No test framework — verify by simulating seasons and inspecting `gs.episodeHistory` in browser console.

**Spec:** `docs/superpowers/specs/2026-03-25-finale-vp-overhaul-design.md`

---

### Task 1: Smart Decision Logic — `projectJuryVotes` + replace `wRandom` pick

**Files:**
- Modify: `simulator.html` — add `projectJuryVotes()` function near `simulateJuryVote()` (~line 12287), then update the Decision branch in `simulateFinale()` (~line 12029-12032)

**What:** The immunity winner currently picks who to bring using `wRandom` (bond + loyalty weighted random). Replace with a deterministic projection: for each possible pairing, simulate who the jury would vote for, then pick the opponent the immunity winner is most likely to beat. Weight by loyalty (lean ally) and strategic (lean beatable).

- [ ] **Step 1: Add `projectJuryVotes` function**

Insert after `simulateJuryVote()` (after line 12287):

```javascript
// Project jury vote outcome for a given finalist set — used by smart decision logic
// Thin wrapper around simulateJuryVote's scoring logic, but deterministic (no random noise)
// Returns { [finalist]: projectedVotes } without modifying game state
function projectJuryVotes(finalistSet) {
  const jury = gs.jury || [];
  if (!jury.length || !finalistSet.length) return {};
  const votes = Object.fromEntries(finalistSet.map(f => [f, 0]));
  jury.forEach(juror => {
    const jS = pStats(juror);
    const scores = finalistSet.map(f => {
      const fS = pStats(f);
      const bond = getBond(juror, f);
      // Same formula as simulateJuryVote — keep in sync if that changes
      const gameplay = fS.strategic * 0.3 + fS.boldness * 0.2 + fS.social * 0.2 + (fS.physical + fS.endurance) / 2 * 0.1;
      const personal = bond * 1.5;
      const history = gs.jurorHistory?.[juror];
      let bitterness = 0;
      if (history) {
        const bondAtBoot = history.finalBonds?.[f] ?? 0;
        if (history.voters.includes(f)) bitterness = -(0.6 + Math.max(0, bondAtBoot) * 0.5);
        else bitterness = 0.25 + Math.max(0, bondAtBoot) * 0.15;
      }
      const score = jS.strategic > 7 || jS.intuition > 7
        ? gameplay * 0.7 + personal * 0.3 + bitterness * 0.3
        : gameplay * 0.3 + personal * 0.7 + bitterness * 0.8;
      // Deterministic tiebreaker: use bond magnitude to break score ties
      return { name: f, score, tiebreak: Math.abs(bond) };
    });
    scores.sort((a, b) => b.score - a.score || b.tiebreak - a.tiebreak);
    votes[scores[0].name]++;
  });
  return votes;
}
```

- [ ] **Step 2: Replace wRandom pick with smart decision in finaleSize=2 branch**

In `simulateFinale()`, replace the non-jury-cut else branch (~line 12029-12032):

Old:
```javascript
brought = wRandom(others, p => Math.max(0.1, getBond(ep.immunityWinner, p) + pStats(p).loyalty * 0.3));
cut = others.find(p => p !== brought);
ep.finalCut = { winner: ep.immunityWinner, brought, cut };
```

New:
```javascript
// Smart decision: project jury votes for each possible F2 pairing
const immWinner = ep.immunityWinner;
const immS = pStats(immWinner);
const pairings = others.map(partner => {
  const opponent = others.find(p => p !== partner);
  const projected = projectJuryVotes([immWinner, partner]);
  const margin = (projected[immWinner] || 0) - (projected[partner] || 0);
  return { partner, opponent, margin, bond: getBond(immWinner, partner) };
});
// Strategic players pick the most beatable opponent; loyal players lean toward allies
const loyaltyWeight = immS.loyalty * 0.1;  // 0-1 range
const stratWeight = immS.strategic * 0.1;
pairings.forEach(p => {
  p.score = p.margin * (0.5 + stratWeight * 0.3) + p.bond * loyaltyWeight * 0.5;
});
pairings.sort((a, b) => b.score - a.score);
brought = pairings[0].partner;
cut = others.find(p => p !== brought);
const projectedVotes = projectJuryVotes([immWinner, brought]);
ep.finalCut = {
  winner: immWinner, brought, cut,
  reasoning: {
    projectedVotes,
    margin: pairings[0].margin,
    loyaltyDriven: loyaltyWeight > stratWeight,
    bondWithBrought: pairings[0].bond,
  }
};
```

- [ ] **Step 3: Verify**

Simulate a season with finaleSize=2 jury format. In browser console after finale, check:
```javascript
gs.episodeHistory.slice(-1)[0].finalCut?.reasoning
```
Should show `projectedVotes`, `margin`, `loyaltyDriven`, `bondWithBrought`.

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat(engine): smart decision logic — immunity winner projects jury votes"
```

---

### Task 2: finaleSize=4 engine branch

**Files:**
- Modify: `simulator.html` — add new branch in `simulateFinale()` after the finaleSize=2 branch (~line 12039)

**What:** When `cfg.finaleSize === 4`, run immunity challenge among 4 players. Winner uses smart decision logic to cut 1 player. Remaining 3 go to FTC (or all go to final challenge).

- [ ] **Step 1: Add finaleSize=4 branch**

After the `finaleSize === 2` block's closing brace (after `finalists = [ep.immunityWinner, brought];`), insert:

```javascript
  // If finaleSize === 4: immunity winner cuts 1, top 3 go to FTC
  if (cfg.finaleSize === 4 && players.length === 4 && cfg.finaleFormat !== 'final-challenge') {
    const others4 = players.filter(p => p !== ep.immunityWinner);
    // Smart decision: project jury votes for each possible F3 trio
    const immWinner4 = ep.immunityWinner;
    const immS4 = pStats(immWinner4);
    const cutCandidates = others4.map(candidate => {
      const remaining = others4.filter(p => p !== candidate);
      const trio = [immWinner4, ...remaining];
      const projected = projectJuryVotes(trio);
      const myVotes = projected[immWinner4] || 0;
      const bestRival = Math.max(...remaining.map(r => projected[r] || 0));
      return { cut: candidate, margin: myVotes - bestRival, bond: getBond(immWinner4, candidate) };
    });
    const loyaltyW4 = immS4.loyalty * 0.1;
    const stratW4 = immS4.strategic * 0.1;
    cutCandidates.forEach(c => {
      // High margin = immunity winner does well when this person is REMOVED = good candidate to cut
      // High bond = loyalty cost of cutting them = bad candidate to cut (for loyal players)
      // High cutScore = SHOULD be cut
      c.cutScore = c.margin * (0.5 + stratW4 * 0.3) - c.bond * loyaltyW4 * 0.5;
    });
    // Highest cutScore = best candidate to cut (removes biggest threat / least loyal cost)
    cutCandidates.sort((a, b) => b.cutScore - a.cutScore);
    const cut4 = cutCandidates[0].cut;
    const brought4 = others4.filter(p => p !== cut4);
    const projectedVotes4 = projectJuryVotes([immWinner4, ...brought4]);
    ep.finalCut = {
      winner: immWinner4, brought: brought4, cut: cut4,
      reasoning: {
        projectedVotes: projectedVotes4,
        margin: cutCandidates[0].margin,
        loyaltyDriven: loyaltyW4 > stratW4,
        bondWithCut: cutCandidates[0].bond,
      }
    };
    ep.eliminated = cut4;
    gs.eliminated.push(cut4);
    gs.jury.push(cut4);
    gs.activePlayers = gs.activePlayers.filter(p => p !== cut4);
    finalists = [immWinner4, ...brought4];
  }
```

- [ ] **Step 2: Capture chalPlacements from immunity challenge**

In `simulateFinale()`, after the `simulateIndividualChallenge` call (~line 12012), capture the full placement data so VP can use it:

```javascript
  const immResult = simulateIndividualChallenge(players, null);
  ep.immunityWinner = immResult?.name || players[0];
  ep.challengeLabel = immResult?.challengeType || 'Mixed';
  ep.chalPlacements = immResult?.chalPlacements || null;  // ADD: capture for VP interactive reveal
```

- [ ] **Step 3: Also skip immunity challenge for finaleSize=2 in VP (not engine)**

The immunity challenge still runs in the engine for all jury formats (needed for fire-making/jury-cut), but the VP screens will conditionally show it. No engine change needed here — just a note for Sub-Plan 2.

- [ ] **Step 3: Verify**

Change `seasonConfig.finaleSize` to 4 in setup, simulate. Check:
```javascript
gs.episodeHistory.slice(-1)[0].finalCut  // should show cut player + reasoning
gs.episodeHistory.slice(-1)[0].finaleFinalists.length  // should be 3
```

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat(engine): finaleSize=4 branch — immunity winner cuts 4 to 3"
```

---

### Task 3: Bench Selection — `generateBenchAssignments`

**Files:**
- Modify: `simulator.html` — add function near `simulateFinale()`, call it from within `simulateFinale()`

- [ ] **Step 1: Add `generateBenchAssignments` function**

Insert after `generateFinalChallengeStages()` (~line 12357):

```javascript
// Eliminated players pick which finalist's bench to sit on
function generateBenchAssignments(finalists) {
  // Pool: jury for jury formats, all eliminated for final-challenge
  const pool = seasonConfig.finaleFormat === 'final-challenge' ? [...gs.eliminated] : [...(gs.jury || [])];
  const assignments = Object.fromEntries(finalists.map(f => [f, []]));
  const reasons = {};

  pool.forEach(supporter => {
    // Find which finalist they voted out (if any) — avoid that bench
    const elimEp = (gs.episodeHistory || []).find(h => h.eliminated === supporter || h.firstEliminated === supporter);
    const votersWhoGotMeOut = (elimEp?.votingLog || []).filter(v => v.voted === supporter && v.voter !== 'THE GAME').map(v => v.voter);

    const scored = finalists.map(f => {
      const bond = getBond(supporter, f);
      const votedMeOut = votersWhoGotMeOut.includes(f);
      // Penalty if this finalist voted them out (-1.5), unless bond is very high
      const penalty = votedMeOut && bond < 2 ? -1.5 : 0;
      return { finalist: f, bond, score: bond + penalty };
    });
    scored.sort((a, b) => b.score - a.score);

    const best = scored[0];
    const finalist = best.finalist;
    assignments[finalist].push(supporter);

    // Generate reason
    const votedMeOut = votersWhoGotMeOut.includes(finalist);
    const wereAllied = (gs.episodeHistory || []).some(h =>
      (h.alliances || []).some(a => a.members?.includes(supporter) && a.members?.includes(finalist))
    );
    let reason;
    if (wereAllied && best.bond >= 2) reason = `We were in the same alliance. That bond didn't die when I got voted out.`;
    else if (best.bond >= 3) reason = `${finalist} was always real with me. I trust that.`;
    else if (best.bond >= 1) reason = `${finalist} never wrote my name down. That counts for something.`;
    else if (votedMeOut && best.bond >= 0) reason = `${finalist} voted me out, but played the best game. I respect it.`;
    else if (scored.length >= 2 && scored[1].score < -1) reason = `I don't love anyone left, but ${finalist} is the least of the evils.`;
    else reason = `${finalist} played the game I would have played. That's enough.`;

    reasons[supporter] = { finalist, reason, bond: best.bond };
  });

  return { assignments, reasons };
}
```

- [ ] **Step 2: Call from `simulateFinale()` when there's a challenge**

In `simulateFinale()`, after `ep.finaleFinalists = finalists;` (~line 12041), add:

```javascript
  // Bench selection: eliminated players pick sides (when there's a challenge in the finale)
  const hasFinaleChallenge = cfg.finaleFormat === 'final-challenge' || cfg.finaleSize >= 3;
  if (hasFinaleChallenge && (gs.eliminated.length > 0 || (gs.jury || []).length > 0)) {
    const benchResult = generateBenchAssignments(finalists);
    ep.benchAssignments = benchResult.assignments;
    ep.benchReasons = benchResult.reasons;
  }
```

- [ ] **Step 3: Verify**

After simulating a finale, check:
```javascript
gs.episodeHistory.slice(-1)[0].benchAssignments  // { 'PlayerA': ['Juror1','Juror2'], 'PlayerB': ['Juror3'] }
gs.episodeHistory.slice(-1)[0].benchReasons       // { 'Juror1': { finalist: 'PlayerA', reason: '...', bond: 2.5 } }
```

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat(engine): bench selection — eliminated players pick finalist sides"
```

---

### Task 4: Assistant Selection — `selectAssistants`

**Files:**
- Modify: `simulator.html` — add function + call in `simulateFinale()`

- [ ] **Step 1: Add `selectAssistants` function**

Insert after `generateBenchAssignments()`:

```javascript
// Each finalist picks an assistant from their bench (final-challenge format only)
function selectAssistants(finalists, benchAssignments) {
  const assistants = {};

  finalists.forEach(f => {
    const bench = benchAssignments[f] || [];
    if (!bench.length) {
      assistants[f] = null;  // solo — nobody on their bench
      return;
    }

    const fS = pStats(f);
    const heartWeight = (fS.loyalty + fS.social + fS.temperament) / 3;
    const brainWeight = (fS.strategic + fS.mental + fS.boldness) / 3;
    const diff = heartWeight - brainWeight;

    // Heart pick: highest bond
    const heartPick = bench.reduce((best, p) =>
      getBond(f, p) > getBond(f, best) ? p : best, bench[0]);
    // Brain pick: highest challenge stats
    const brainPick = bench.reduce((best, p) => {
      const pS = pStats(p), bS = pStats(best);
      const pScore = pS.physical + pS.endurance + pS.mental;
      const bScore = bS.physical + bS.endurance + bS.mental;
      return pScore > bScore ? p : best;
    }, bench[0]);

    let chosen, decision;
    if (heartPick === brainPick) {
      chosen = heartPick;
      decision = 'unanimous';
    } else if (diff >= 3) {
      chosen = heartPick;
      decision = 'heart';
    } else if (diff <= -3) {
      chosen = brainPick;
      decision = 'brain';
    } else {
      // Balanced — agonizing decision
      const heartChance = 0.5 + (diff / 6) * 0.3;
      if (fS.temperament < 4) {
        // Impulsive snap — pure coin flip
        chosen = Math.random() < 0.5 ? heartPick : brainPick;
        decision = 'impulsive';
      } else {
        chosen = Math.random() < heartChance ? heartPick : brainPick;
        decision = 'agonized';
      }
    }

    const chosenBond = getBond(f, chosen);

    assistants[f] = {
      name: chosen,
      stats: pStats(chosen),
      bond: chosenBond,
      heartPick, brainPick,
      decision,
      // Sabotage is rolled per-stage in simulateFinaleChallenge, not pre-computed here
    };
  });

  return assistants;
}
```

- [ ] **Step 2: Call from `simulateFinale()` after bench selection**

After the bench selection block, add:

```javascript
  // Assistant selection: final-challenge format only, when setting enabled
  if (cfg.finaleFormat === 'final-challenge' && cfg.finaleAssistants && ep.benchAssignments) {
    ep.assistants = selectAssistants(finalists, ep.benchAssignments);
  }
```

- [ ] **Step 3: Add `finaleAssistants` setting to config**

In the `defaultConfig` object (~line 1422), add:
```javascript
finaleAssistants: false,
```

Also add a checkbox in the Finale Format section of the setup UI (near the `cfg-finale-format` select, ~line 995):
```html
<label style="display:flex;align-items:center;gap:6px;margin-top:6px;font-size:12px">
  <input type="checkbox" id="cfg-finale-assistants" onchange="saveConfig()"> Enable Assistants (Final Challenge)
</label>
```

And wire it in `saveConfig()` / `loadConfig()`:
```javascript
// In saveConfig:
finaleAssistants: g('cfg-finale-assistants')?.checked || false,
// In loadConfig:
set('cfg-finale-assistants', seasonConfig.finaleAssistants || false);  // checkbox .checked
```

- [ ] **Step 4: Verify**

Enable assistants in settings, set finale format to "Final Challenge", simulate. Check:
```javascript
gs.episodeHistory.slice(-1)[0].assistants
// { 'PlayerA': { name: 'Juror1', bond: 2, decision: 'heart', sabotage: false, ... }, ... }
```

- [ ] **Step 5: Commit**

```bash
git add simulator.html
git commit -m "feat(engine): assistant selection with heart-vs-brain decision model"
```

---

### Task 5: Multi-Stage Final Challenge — `simulateFinaleChallenge`

**Files:**
- Modify: `simulator.html` — add function + replace `simulateIndividualChallenge` call in the `final-challenge` format branch

- [ ] **Step 1: Add `simulateFinaleChallenge` function**

Insert after `selectAssistants()`:

```javascript
// Multi-stage finale challenge (replaces single simulateIndividualChallenge for final-challenge format)
function simulateFinaleChallenge(finalists, assistants) {
  const stages = [
    { name: 'Endurance', statA: 'endurance', statB: 'mental', assistStat: 'endurance', desc: 'Hold on. Outlast. The last one standing moves forward.' },
    { name: 'Obstacle Course', statA: 'physical', statB: 'endurance', assistStat: 'physical', desc: 'Sprint, climb, crawl. Pure physical will.' },
    { name: 'Final Puzzle', statA: 'mental', statB: 'strategic', assistStat: null, desc: 'Alone. No help. Solve the puzzle or lose everything.' },
  ];

  const scores = Object.fromEntries(finalists.map(f => [f, 0]));
  const stageResults = [];

  stages.forEach((stage, idx) => {
    const stageScores = {};
    finalists.forEach(f => {
      const s = pStats(f);
      let base = s[stage.statA] * 0.6 + s[stage.statB] * 0.4 + (Math.random() * 3 - 1.5);

      // Assistant boost (stages 0 and 1 only)
      if (stage.assistStat && assistants?.[f]?.name) {
        const asst = assistants[f];
        const aStats = asst.stats || pStats(asst.name);
        const boost = aStats[stage.assistStat] * 0.15;  // 15% of assistant's relevant stat
        // Sabotage: roll fresh each assisted stage — 15% + |bond| * 2% per stage (spec formula)
        const sabotageChance = asst.bond <= -2 ? (0.15 + Math.abs(asst.bond) * 0.02) : 0;
        if (sabotageChance > 0 && Math.random() < sabotageChance) {
          base -= boost * 1.5;  // Negative contribution
          stageResults._sabotageEvents = stageResults._sabotageEvents || [];
          stageResults._sabotageEvents.push({ stage: idx, finalist: f, assistant: asst.name });
        } else {
          base += boost;
        }
      }

      stageScores[f] = Math.max(0, base);
      scores[f] += stageScores[f];
    });

    // Determine stage winner
    const stageSorted = Object.entries(stageScores).sort(([,a],[,b]) => b - a);
    stageResults.push({
      name: stage.name,
      desc: stage.desc,
      scores: { ...stageScores },
      winner: stageSorted[0][0],
      hasAssistant: !!stage.assistStat,
      assistantDropoff: idx === 1,  // assistants leave after stage 2
    });
  });

  // Overall winner
  const sorted = Object.entries(scores).sort(([,a],[,b]) => b - a);
  const winner = sorted[0][0];

  return {
    stages: stageResults,
    totalScores: scores,
    winner,
    placements: sorted.map(([name]) => name),
  };
}
```

- [ ] **Step 2: Replace `simulateIndividualChallenge` call in final-challenge branch**

In `simulateFinale()`, replace the final-challenge format block (~line 12046-12052):

Old:
```javascript
if (cfg.finaleFormat === 'final-challenge') {
    const finalChalResult = simulateIndividualChallenge(finalists, null);
    ep.finalChallengeWinner = finalChalResult?.name || finalists[0];
    ep.winner = ep.finalChallengeWinner;
    ep.juryResult = null;
    gs.finaleResult = { winner: ep.winner, votes: null, reasoning: null, finalists, finalChallenge: true };
}
```

New:
```javascript
if (cfg.finaleFormat === 'final-challenge') {
    // Multi-stage finale challenge
    const chalResult = simulateFinaleChallenge(finalists, ep.assistants || null);
    ep.finaleChallengeStages = chalResult.stages;
    ep.finaleChallengeScores = chalResult.totalScores;
    ep.finaleChallengeWinner = chalResult.winner;
    ep.finalChallengePlacements = chalResult.placements;
    ep.winner = chalResult.winner;
    ep.juryResult = null;
    gs.finaleResult = { winner: ep.winner, votes: null, reasoning: null, finalists, finalChallenge: true };
}
```

- [ ] **Step 3: Verify**

Set finale format to "Final Challenge", enable assistants, simulate. Check:
```javascript
const ep = gs.episodeHistory.slice(-1)[0];
ep.finaleChallengeStages  // 3 stages with scores + winners
ep.finaleChallengeScores  // { 'PlayerA': 15.2, 'PlayerB': 12.8 }
ep.finaleChallengeWinner  // 'PlayerA'
```

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat(engine): multi-stage finale challenge with assistant boost and sabotage"
```

---

### Task 6: FTC Swing Votes

**Files:**
- Modify: `simulator.html` — modify the jury vote flow in `simulateFinale()` to add swing vote mechanics between FTC data generation and the actual vote

- [ ] **Step 1: Add `applyFTCSwingVotes` function**

Insert after `simulateFinaleChallenge()`:

```javascript
// FTC swing votes: hesitating jurors can change their vote based on FTC performance
function applyFTCSwingVotes(finalists) {
  const jury = gs.jury || [];
  const swings = [];

  jury.forEach(juror => {
    const jS = pStats(juror);
    const bonds = finalists.map(f => ({ name: f, bond: getBond(juror, f) }));
    bonds.sort((a, b) => b.bond - a.bond);

    // Hesitating: bond with top 2 picks is within the swing range (-0.5 to 1.5)
    if (bonds.length < 2) return;
    const top = bonds[0], second = bonds[1];
    const isHesitating = top.bond <= 1.5 && top.bond >= -0.5 && second.bond >= -0.5 && (top.bond - second.bond) < 2;
    if (!isHesitating) return;

    // Simulate FTC performance: each finalist's "answer quality"
    const performances = finalists.map(f => {
      const fS = pStats(f);
      const answerQuality = fS.social * 0.5 + fS.strategic * 0.3 + fS.boldness * 0.2;
      // Question difficulty from this juror
      const bitterness = Math.max(0, -getBond(juror, f));
      const difficulty = jS.strategic * 0.4 + bitterness * 0.6;
      const performance = answerQuality - difficulty + (Math.random() * 2 - 1);
      return { name: f, performance };
    });
    performances.sort((a, b) => b.performance - a.performance);

    // Best FTC performer gets a bond nudge with this hesitating juror
    const bestPerformer = performances[0].name;
    const worstPerformer = performances[performances.length - 1].name;
    const nudge = 0.3 + Math.random() * 0.2;  // +0.3 to +0.5

    // Record original vote preference
    const originalPick = top.name;

    addBond(juror, bestPerformer, nudge);
    addBond(juror, worstPerformer, -nudge * 0.5);

    // Supporting moment: if a non-hesitating juror with strong bond (>= 3) supports a finalist,
    // nearby hesitating jurors get an additional nudge toward that finalist
    finalists.forEach(f => {
      const allySupporter = jury.find(j =>
        j !== juror && getBond(j, f) >= 3 && !( // j is a strong ally of f, and not hesitating themselves
          finalists.every(ff => getBond(j, ff) >= -0.5 && getBond(j, ff) <= 1.5)
        )
      );
      if (allySupporter) addBond(juror, f, 0.2);
    });

    // Check if the vote actually flipped
    const newBonds = finalists.map(f => ({ name: f, bond: getBond(juror, f) }));
    newBonds.sort((a, b) => b.bond - a.bond);
    const newPick = newBonds[0].name;

    if (newPick !== originalPick) {
      swings.push({ juror, originalVote: originalPick, finalVote: newPick, reason: `FTC performance and jury support changed ${juror}'s mind` });
    }
  });

  return swings;
}
```

- [ ] **Step 2: Integrate into `simulateFinale()` jury vote flow**

In the jury vote branch (~line 12053-12062), restructure to apply swing votes BETWEEN FTC data generation and the actual vote:

Old:
```javascript
  } else {
    // Jury vote
    const juryResult = simulateJuryVote(finalists);
    ep.juryResult = juryResult;
    const jSorted = Object.entries(juryResult.votes).sort(([,a],[,b]) => b-a);
    ep.winner = jSorted[0]?.[0] || finalists[0];
    gs.finaleResult = { winner: ep.winner, votes: juryResult.votes, reasoning: juryResult.reasoning, finalists };
    ep.ftcData = generateFTCData(finalists, juryResult);
  }
```

New:
```javascript
  } else {
    // FTC swing votes: nudge hesitating juror bonds based on FTC performance
    // Must happen BEFORE simulateJuryVote so the vote uses post-FTC bonds
    ep.ftcSwings = applyFTCSwingVotes(finalists);

    // Jury vote (uses post-swing bonds)
    const juryResult = simulateJuryVote(finalists);
    ep.juryResult = juryResult;
    const jSorted = Object.entries(juryResult.votes).sort(([,a],[,b]) => b-a);
    ep.winner = jSorted[0]?.[0] || finalists[0];
    gs.finaleResult = { winner: ep.winner, votes: juryResult.votes, reasoning: juryResult.reasoning, finalists };
    // Generate FTC narrative data (opening statements + juror Q&A) for VP viewer
    ep.ftcData = generateFTCData(finalists, juryResult);
  }
```

- [ ] **Step 3: Verify**

Simulate a jury-format finale. Check:
```javascript
gs.episodeHistory.slice(-1)[0].ftcSwings
// [] if no swings, or [{ juror: 'Nichelle', originalVote: 'Bowie', finalVote: 'Chase', reason: '...' }]
```

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat(engine): FTC swing votes — hesitating jurors influenced by performance"
```

---

### Task 7: Save all new fields to episodeHistory

**Files:**
- Modify: `simulator.html` — update the `gs.episodeHistory.push` in `simulateFinale()` (~line 12082-12087)

- [ ] **Step 1: Update episodeHistory push with all new fields**

Replace the existing push (~line 12082-12087):

Old:
```javascript
  gs.episodeHistory.push({
    num: epNum, eliminated: ep.eliminated || null, firstEliminated: null,
    riChoice: null, immunityWinner: ep.immunityWinner, challengeType: 'individual',
    isMerge: false, isFinale: true, votes: {}, alliances: [], summaryText, gsSnapshot: snapshotGameState(),
    fanFavorite: ep.fanFavorite || null, fanFavoriteScore: ep.fanFavoriteScore || 0, fanFavoriteIsWinner: ep.fanFavoriteIsWinner || false,
  });
```

New:
```javascript
  gs.episodeHistory.push({
    num: epNum, eliminated: ep.eliminated || null, firstEliminated: null,
    riChoice: null, immunityWinner: ep.immunityWinner, challengeType: 'individual',
    challengeLabel: ep.challengeLabel || null,
    isMerge: false, isFinale: true, votes: {}, alliances: [], summaryText, gsSnapshot: snapshotGameState(),
    fanFavorite: ep.fanFavorite || null, fanFavoriteScore: ep.fanFavoriteScore || 0, fanFavoriteIsWinner: ep.fanFavoriteIsWinner || false,
    // Finale-specific fields
    finaleFinalists: ep.finaleFinalists || null,
    finalCut: ep.finalCut || null,
    immunityNarrationStages: ep.finalChallengeStages || null,  // renamed from finalChallengeStages to avoid confusion with finaleChallengeStages
    juryResult: ep.juryResult || null,
    ftcData: ep.ftcData || null,
    ftcSwings: ep.ftcSwings || [],
    benchAssignments: ep.benchAssignments || null,
    benchReasons: ep.benchReasons || null,
    assistants: ep.assistants || null,
    finaleChallengeStages: ep.finaleChallengeStages || null,
    finaleChallengeScores: ep.finaleChallengeScores || null,
    finaleChallengeWinner: ep.finaleChallengeWinner || null,
    finalChallengePlacements: ep.finalChallengePlacements || null,
    campEvents: ep.campEvents || null,
    chalPlacements: ep.chalPlacements || null,
  });
```

- [ ] **Step 2: Verify**

Simulate any finale format. Check that all new fields appear:
```javascript
const ep = gs.episodeHistory.slice(-1)[0];
Object.keys(ep).filter(k => k.includes('bench') || k.includes('finale') || k.includes('ftc') || k.includes('assistant'))
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat(engine): save all finale fields to episodeHistory for VP screens"
```

---

## Remaining Sub-Plans

After this engine plan is implemented, the following sub-plans will be written:

- **Sub-Plan 2:** VP screens — Finale Camp Life, enhanced Final Immunity, enhanced Decision, Benches
- **Sub-Plan 3:** VP screens — FTC 5-phase overhaul with swing vote display
- **Sub-Plan 4:** VP screens — Grand Challenge with 3 stages, assistants, narration
- **Sub-Plan 5:** VP screens — Winner Ceremony, Reunion Show, Season Statistics + JSON export
- **Sub-Plan 6:** Screen assembly — wire all screens into `buildVPScreens` with correct conditions
