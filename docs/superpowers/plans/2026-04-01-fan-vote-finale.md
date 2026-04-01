# Fan Vote Finale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the fan-vote finale format — fans crown the winner via popularity, with a broadcast-style Fan Campaign screen and interactive Fan Vote reveal.

**Architecture:** Single-file changes in `simulator.html`. Engine: new fan-vote branch in `simulateFinale()` + `generateFanCampaign()` + `simulateFanVote()`. VP: `rpBuildFanCampaign()` (interactive phased broadcast) + `rpBuildFanVoteReveal()` (interactive percentage reveal) + winner ceremony modifications. VP screen flow additions in `buildEpisodeMap()`.

**Tech Stack:** Vanilla JS, inline CSS, existing VP dark theme system.

**Spec:** `docs/superpowers/specs/2026-04-01-fan-vote-finale-design.md`

---

### Task 1: Engine — Fan Vote branch in `simulateFinale()`

**Files:**
- Modify: `simulator.html:21042-21197` (simulateFinale, after koh-lanta block, before existing F3/F4 cut logic)
- Modify: `simulator.html:21127-21156` (finale format branching: final-challenge vs jury)
- Modify: `simulator.html:21217-21251` (episodeHistory push)

This task adds the fan-vote path into `simulateFinale()`. The fan-vote format:
- F2: skip immunity, go straight to fan campaign
- F3: immunity + cut to F2
- F4: immunity + cut to F3

Then generates fan campaign data and runs the fan vote scoring.

- [ ] **Step 1: Add fan-vote immunity skip for F2**

In `simulateFinale()`, right after `const ep = { ... }` and camp events (line ~21683), wrap the immunity challenge in a condition. Find these lines:

```js
  // Final immunity challenge
  const immResult = simulateIndividualChallenge(players, null);
  ep.immunityWinner = immResult?.name || players[0];
  ep.challengeLabel = immResult?.challengeType || 'Mixed';
  ep.chalPlacements = immResult?.chalPlacements || null;
```

Replace with:

```js
  // Final immunity challenge — skip for fan-vote F2 (no one to cut)
  const _skipImmunity = cfg.finaleFormat === 'fan-vote' && cfg.finaleSize <= 2;
  if (!_skipImmunity) {
    const immResult = simulateIndividualChallenge(players, null);
    ep.immunityWinner = immResult?.name || players[0];
    ep.challengeLabel = immResult?.challengeType || 'Mixed';
    ep.chalPlacements = immResult?.chalPlacements || null;
  }
```

- [ ] **Step 2: Add fan-vote format branch after the existing cut logic**

After the line `ep.finaleFinalists = finalists;` (line ~21128), and before the bench selection block (line ~21130), insert the fan-vote branch. This goes right before `// Bench selection`:

```js
  // ── FAN VOTE FINALE: fan campaign + popularity-based vote ──
  if (cfg.finaleFormat === 'fan-vote') {
    // Require popularity system
    if (!seasonConfig.popularityEnabled || !gs.popularity) {
      // Fallback: treat as traditional jury if popularity not enabled
      cfg.finaleFormat = 'traditional';
    } else {
      // Generate fan campaign data
      ep.fanCampaign = generateFanCampaign(finalists);

      // Run the fan vote
      ep.fanVoteResult = simulateFanVote(finalists);
      ep.winner = ep.fanVoteResult.winner;
      gs.finaleResult = { winner: ep.winner, votes: null, reasoning: null, finalists, fanVote: true };
    }
  }
```

- [ ] **Step 3: Guard existing FTC/final-challenge branches from fan-vote**

The existing format branching at line ~21146 has `if (cfg.finaleFormat === 'final-challenge') { ... } else { ... }`. The `else` block runs jury vote + FTC. We need to exclude fan-vote from this. Change the `else` to:

```js
  } else if (cfg.finaleFormat !== 'fan-vote' || !ep.fanVoteResult) {
```

This ensures fan-vote doesn't fall through to the jury vote path. If fan-vote failed (no popularity), the fallback to `'traditional'` above means it'll still hit the jury path naturally.

- [ ] **Step 4: Add fan-vote fields to episodeHistory push**

In the `gs.episodeHistory.push({...})` block (line ~21217), add these fields after the koh-lanta fields:

```js
    // Fan vote finale
    fanCampaign: ep.fanCampaign || null,
    fanVoteResult: ep.fanVoteResult || null,
```

- [ ] **Step 5: Commit**

```bash
git add simulator.html
git commit -m "feat: add fan-vote branch in simulateFinale"
```

---

### Task 2: Engine — `generateFanCampaign()` function

**Files:**
- Modify: `simulator.html` — insert new function after `generateFTCData()` (line ~21897)

This function generates the broadcast-style fan campaign data: speeches, pulse reactions, fan reactions, and jury commentary per finalist.

- [ ] **Step 1: Add `generateFanCampaign()` function**

Insert after the `generateFTCData` function (find its closing `}` and add after):

```js
function generateFanCampaign(finalists) {
  const jury = gs.jury || [];
  const _pick = (arr, seed) => arr[([...seed].reduce((a,c)=>a+c.charCodeAt(0),0)+gs.episode*7)%arr.length];
  const usedJurors = new Set();

  const phases = finalists.map((name, idx) => {
    const s = pStats(name);
    const pr = pronouns(name);
    const arch = players.find(p => p.name === name)?.archetype || '';
    const pop = gs.popularity?.[name] || 0;
    const _betrayalCount = (gs.namedAlliances || []).reduce((n, a) => n + (a.betrayals || []).filter(b => b.player === name).length, 0);
    const _bigMoves = gs.playerStates?.[name]?.bigMoves || 0;
    const wins = gs.episodeHistory.filter(e => e.immunityWinner === name).length;
    const showmance = gs.showmances?.find(sm => sm.players.includes(name) && sm.phase !== 'broken-up');

    // Determine speech style from highest stat
    const styleScores = [
      { style: 'bold', val: s.boldness },
      { style: 'social', val: s.social },
      { style: 'strategic', val: s.strategic },
    ].sort((a, b) => b.val - a.val);
    const style = styleScores[0].style;

    // Speech — personality-driven, references actual game
    let speech;
    if (style === 'bold') {
      speech = _pick([
        `"I didn't come here to make friends. I came here to win. ${_betrayalCount > 0 ? `Yeah, I cut people. ${_betrayalCount} alliance${_betrayalCount !== 1 ? 's' : ''} — I broke them because they were in my way.` : `I stayed loyal when I could, and I fought when I had to.`} ${wins > 0 ? `${wins} immunity win${wins !== 1 ? 's' : ''} — I earned my safety.` : `I didn't need immunity. I made myself too valuable to vote out.`} You want a winner who played scared? Vote for ${pr.obj === 'them' ? 'someone else' : 'the other one'}. You want a winner who played with guts? I'm right here."`,
        `"Every person sitting on that jury knows what I did. I owned every move. ${_bigMoves > 0 ? `${_bigMoves} big move${_bigMoves !== 1 ? 's' : ''} — and I'd make every one of them again.` : `I played steady when others crumbled.`} This isn't a popularity contest — ${pr.sub === 'they' ? 'wait' : 'wait'}, actually, it is. And I think the fans respect someone who plays hard."`,
        `"Look — I'm not perfect. I know that. But I played THIS game harder than anyone sitting next to me. ${showmance ? `${showmance.players.find(p => p !== name)} and I had something real out there — that wasn't strategy, that was human.` : `I connected with people when it mattered.`} ${_betrayalCount >= 2 ? `Did I betray people? Absolutely. Did I feel good about it? No. Did it get me here? Yes.` : `I kept my word more than most.`} Vote for the player who actually played."`,
      ], name + 'bold');
    } else if (style === 'social') {
      speech = _pick([
        `"I know people think this game is about strategy. And it is. But it's also about people. ${showmance ? `${showmance.players.find(p => p !== name)} — you know what we had was real. That's not a weakness.` : `Every relationship I built out there was genuine.`} I listened. I cared. And I made it to the end because people trusted me — not because I tricked them. ${wins > 0 ? `I won challenges too — ${wins} of them.` : ''} I played a full game. A human game. I hope that's enough."`,
        `"Thirty-something days out here. I've laughed, I've cried, I've been scared, I've been angry. ${_betrayalCount === 0 ? `And through all of it, I never wrote down someone I promised I wouldn't.` : `I made mistakes — I know that. But I owned them.`} I built real connections with real people. That's not weakness. That's the hardest thing to do in this game. If the fans saw that — if they felt what I felt — then I think they'll know who to vote for."`,
        `"I want to tell you who I am. Not what I did in the game — who I AM. I'm someone who ${s.loyalty >= 7 ? `keeps ${pr.pos} word even when it costs ${pr.obj}` : `fights for the people ${pr.sub} ${pr.sub==='they'?'care':'cares'} about`}. That's what I brought to this island. ${_bigMoves > 0 ? `I made moves too — don't think I didn't. But the moves meant something because the relationships meant something.` : `I survived by being someone people wanted around.`} I hope the fans saw that."`,
      ], name + 'social');
    } else {
      speech = _pick([
        `"Let me break it down. ${_bigMoves > 0 ? `${_bigMoves} big move${_bigMoves !== 1 ? 's' : ''}. ` : ''}${wins > 0 ? `${wins} immunity win${wins !== 1 ? 's' : ''}. ` : ''}${_betrayalCount > 0 ? `${_betrayalCount} alliance${_betrayalCount !== 1 ? 's' : ''} broken — each one for a reason.` : `Zero betrayals. I played clean.`} I controlled votes. I read the room. I positioned myself where I needed to be at every tribal. ${pr.Sub} sitting next to me ${finalists.length > 2 ? 'can\'t say that' : 'can\'t say that'}. If you're voting on gameplay — the choice is obvious."`,
        `"I played this game like a chess match. Every vote, I knew who was going home before tribal started. ${_betrayalCount >= 2 ? `Yes, I cut allies. Because I understood the board better than they did.` : `I didn't need to betray people — I set the board so I didn't have to.`} ${showmance ? `Even my relationship with ${showmance.players.find(p => p !== name)} — I won't pretend that wasn't partly strategic. But it was real too.` : ''} The fans have watched every episode. They've seen every confessional. They know who ran this game."`,
        `"Strategy. That's what got me here. Not luck, not immunity wins${wins > 0 ? ` — well, ${wins} of those too` : ''}, not being liked. I outplayed everyone. ${_bigMoves >= 2 ? `The idol play in episode — that was me. The alliance flip — me. The split vote — me.` : `Every move I made was calculated.`} I'm not going to stand here and cry about relationships. I'm going to tell you I played the best game. And I think the fans agree."`,
      ], name + 'strategic');
    }

    // Pulse reaction — based on popularity rank among finalists
    const popRanks = [...finalists].sort((a, b) => (gs.popularity?.[b] || 0) - (gs.popularity?.[a] || 0));
    const popRank = popRanks.indexOf(name);
    const pulseReaction = popRank === 0 ? 'surging' : popRank === popRanks.length - 1 ? (Math.random() < 0.5 ? 'mixed' : 'cooling') : 'steady';

    // Fan reactions — keyed to archetype and game history
    const posPool = arch === 'villain'
      ? ['ICONIC VILLAIN', 'love to hate you', 'RESPECT THE GAME', 'villain era']
      : arch === 'hero'
      ? ['DESERVES IT', 'the real deal', 'HERO', 'pure heart']
      : _bigMoves >= 2
      ? ['GAME CHANGER', 'what a player', 'MASTERMIND', 'ran the season']
      : showmance
      ? ['power couple energy', 'heart of the season', 'LOVE WINS', 'rooting for you']
      : ['let\'s GO', 'earned it', 'WINNER', 'fan favorite'];
    const negPool = arch === 'villain'
      ? ['snake', 'didn\'t deserve it', 'carried', 'no loyalty']
      : _betrayalCount >= 2
      ? ['backstabber', 'can\'t trust that', 'FAKE', 'snake energy']
      : ['overrated', 'meh', 'boring winner', 'not impressed'];

    // Higher popularity = more positive reactions
    const posCount = pop >= (gs.popularity?.[finalists.find(f => f !== name)] || 0) ? 2 : 1;
    const negCount = 3 - posCount;
    const fanReactions = [];
    const _usedPos = new Set(), _usedNeg = new Set();
    for (let i = 0; i < posCount; i++) {
      const r = _pick(posPool.filter(x => !_usedPos.has(x)), name + 'pos' + i);
      _usedPos.add(r);
      fanReactions.push({ text: r, sentiment: 'positive' });
    }
    for (let i = 0; i < negCount; i++) {
      const r = _pick(negPool.filter(x => !_usedNeg.has(x)), name + 'neg' + i);
      _usedNeg.add(r);
      fanReactions.push({ text: r, sentiment: 'negative' });
    }

    // Jury reactions — pick juror with strongest bond to THIS finalist, not used yet
    const juryReactions = [];
    const availJurors = jury.filter(j => !usedJurors.has(j));
    if (availJurors.length) {
      // Sort by absolute bond strength — strongest relationship reacts
      const ranked = availJurors.map(j => ({ juror: j, bond: getBond(j, name), absBond: Math.abs(getBond(j, name)) }))
        .sort((a, b) => b.absBond - a.absBond);
      // Take 1-2 jurors (1 for F3, 2 for F2 to fill the space)
      const takeCount = finalists.length <= 2 ? Math.min(2, ranked.length) : Math.min(1, ranked.length);
      for (let i = 0; i < takeCount; i++) {
        const { juror, bond } = ranked[i];
        usedJurors.add(juror);
        const jPr = pronouns(juror);
        const fPr = pronouns(name);
        let text;
        if (bond >= 3) {
          text = _pick([
            `"We were allies from day one. Everything ${name} said up there is true. ${fPr.Sub} earned this."`,
            `"${name} played with heart. I watched it every day. The fans see what I see — ${fPr.sub} ${fPr.sub==='they'?'deserve':'deserves'} this."`,
            `"I trust ${name}. I trusted ${fPr.obj} out there and I trust ${fPr.obj} now. My vote would go to ${fPr.obj} — but tonight it's not my call."`,
            `"${name} and I had something real. Not strategy — real. ${fPr.Sub} played the game I wish I could have played."`,
          ], juror + name + 'pos');
        } else if (bond <= -2) {
          text = _pick([
            `"${name} talks about loyalty? Ask me how that loyalty felt when the votes came out. I'll never forget."`,
            `"I sat on that jury and watched ${name} do to others what ${fPr.sub} did to me. The fans should see through it."`,
            `"${name} is a good player. I'll give ${fPr.obj} that. But ${fPr.sub} ${fPr.sub==='they'?'are':'is'}n't a good person out here. And the fans know the difference."`,
            `"I have nothing nice to say about ${name}'s game. ${fPr.Sub} got here by cutting people who trusted ${fPr.obj}. That's not a winner."`,
          ], juror + name + 'neg');
        } else {
          text = _pick([
            `"${name} played hard. Whether that's enough — the fans will decide. Not me. Not anymore."`,
            `"I respect ${name}'s game. I don't love it. But I respect it. The fans have more information than we did — let them judge."`,
            `"${name} made it to the end. That's not nothing. Whether ${fPr.sub} ${fPr.sub==='they'?'deserve':'deserves'} to win — that's between ${fPr.obj} and a million viewers."`,
            `"I've watched ${name} play for ${gs.episode || 0} episodes. ${fPr.Sub} ${fPr.sub==='they'?'are':'is'} good. ${fPr.Sub} ${fPr.sub==='they'?'are':'is'}n't great. But good might be enough tonight."`,
          ], juror + name + 'neutral');
        }
        juryReactions.push({ juror, text, bond: Math.round(bond * 10) / 10 });
      }
    }

    return { finalist: name, style, speech, pulseReaction, fanReactions, juryReactions };
  });

  return { finalists: [...finalists], phases };
}
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: add generateFanCampaign function"
```

---

### Task 3: Engine — `simulateFanVote()` function

**Files:**
- Modify: `simulator.html` — insert after `generateFanCampaign()` (from Task 2)

- [ ] **Step 1: Add `simulateFanVote()` function**

Insert immediately after `generateFanCampaign`:

```js
function simulateFanVote(finalists) {
  const scores = {};
  const breakdown = [];
  finalists.forEach(name => {
    const s = pStats(name);
    const pop = gs.popularity?.[name] || 0;
    const campaignBoost = s.social * 0.3 + s.boldness * 0.2 + s.strategic * 0.1;
    const variance = Math.random() * 1.5;
    const total = pop * 1.0 + campaignBoost + variance;
    scores[name] = total;
    breakdown.push({ name, popularity: pop, campaignBoost: Math.round(campaignBoost * 10) / 10, totalScore: Math.round(total * 10) / 10 });
  });

  const totalScore = Object.values(scores).reduce((s, v) => s + Math.max(0, v), 0) || 1;
  const percentages = {};
  // Ensure percentages sum to 100
  const sorted = Object.entries(scores).sort(([,a],[,b]) => b - a);
  let pctRemaining = 100;
  sorted.forEach(([name, score], i) => {
    if (i === sorted.length - 1) {
      percentages[name] = pctRemaining;
    } else {
      const pct = Math.round((Math.max(0, score) / totalScore) * 100);
      percentages[name] = pct;
      pctRemaining -= pct;
    }
  });

  breakdown.forEach(b => { b.pct = percentages[b.name]; });
  breakdown.sort((a, b) => b.totalScore - a.totalScore);

  const rankings = sorted.map(([name]) => name);
  const winner = rankings[0];
  const winnerPct = percentages[winner];
  const margin = winnerPct >= 60 ? 'landslide' : winnerPct >= 52 ? 'comfortable' : 'razor-thin';

  return { scores, percentages, rankings, winner, margin, breakdown };
}
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: add simulateFanVote scoring function"
```

---

### Task 4: Engine — Summary text + winner ceremony adaptations

**Files:**
- Modify: `simulator.html:21320-21406` (generateFinaleSummaryText — add fan-vote branch)
- Modify: `simulator.html:30088-30230` (rpBuildWinnerCeremony — fan-vote flavor)

- [ ] **Step 1: Add fan-vote branch in `generateFinaleSummaryText`**

Find the line `if (cfg.finaleFormat === 'final-challenge') {` (line ~21320). Add a new branch BEFORE it:

```js
  if (cfg.finaleFormat === 'fan-vote' && ep.fanVoteResult) {
    sec('FAN CAMPAIGN');
    ln(`The finalists pitch to the audience. No jury vote tonight — the fans decide.`);
    ln('');
    (ep.fanCampaign?.phases || []).forEach(phase => {
      ln(`${phase.finalist} (${phase.style} pitch): pulse reaction — ${phase.pulseReaction}`);
      if (phase.juryReactions?.length) phase.juryReactions.forEach(jr => ln(`  ${jr.juror}: ${jr.text}`));
    });

    sec('FAN VOTE');
    const fvr = ep.fanVoteResult;
    fvr.breakdown.forEach(b => ln(`${b.name}: ${b.pct}% (popularity: ${b.popularity}, campaign boost: ${b.campaignBoost})`));
    ln('');
    ln(`Margin: ${fvr.margin}`);

    sec('WINNER');
    const winner = ep.winner;
    const ws = pStats(winner);
    const winPct = fvr.percentages[winner] || 0;
    ln(`${winner} wins the fan vote with ${winPct}% of the audience vote (${fvr.margin})!`);
    ln('');
    if (ws.social >= 8) ln(`${winner} won the fans over with charm and heart. The audience saw what the island saw.`);
    else if (ws.strategic >= 8) ln(`${winner} played a game the fans could respect — calculated, controlled, dominant.`);
    else if (ws.boldness >= 8) ln(`${winner} played with guts and the fans loved every second of it.`);
    else ln(`${winner} connected with the audience and earned their vote. A fan-crowned champion.`);

    // Runner-up
    if (fvr.rankings.length >= 2) {
      const ru = fvr.rankings[1];
      const ruPct = fvr.percentages[ru] || 0;
      if (fvr.margin === 'razor-thin') ln(`${ru} came agonizingly close — ${ruPct}%. A few more fans and the result flips.`);
      else ln(`${ru} finishes with ${ruPct}% of the fan vote.`);
    }

    return L.join('\n');
  } else if (cfg.finaleFormat === 'final-challenge') {
```

Note: the original `if (cfg.finaleFormat === 'final-challenge')` becomes `else if`.

- [ ] **Step 2: Add fan-vote flavor to winner ceremony**

In `rpBuildWinnerCeremony` (line ~30088), find the vote count display line:

```js
        ${voteStr ? `<div style="font-size:13px;color:var(--accent-gold);font-family:var(--font-mono);margin-top:8px">${voteStr} jury vote</div>` : `<div style="font-size:13px;color:var(--accent-gold);font-family:var(--font-mono);margin-top:8px">Final Challenge Winner</div>`}
```

Replace with:

```js
        ${ep.fanVoteResult ? `<div style="font-size:13px;color:var(--accent-gold);font-family:var(--font-mono);margin-top:8px">${ep.fanVoteResult.percentages[winner] || 0}% Fan Vote</div>`
        : voteStr ? `<div style="font-size:13px;color:var(--accent-gold);font-family:var(--font-mono);margin-top:8px">${voteStr} jury vote</div>`
        : `<div style="font-size:13px;color:var(--accent-gold);font-family:var(--font-mono);margin-top:8px">Final Challenge Winner</div>`}
```

- [ ] **Step 3: Update the trophy moment text**

Find the trophy text block:

```js
      : isFinalChallenge
      ? `${winner} wins the Final Challenge and takes the season. No jury. No vote. ${wp.Sub} earned it on the field.`
      : `The tribe has spoken. ${winner} is the Sole Survivor. ${winVotes} out of ${totalJury} jury votes.`}
```

Replace with:

```js
      : ep.fanVoteResult
      ? `The fans have spoken. ${winner} wins the season with ${ep.fanVoteResult.percentages[winner] || 0}% of the fan vote. ${ep.fanVoteResult.margin === 'landslide' ? 'A dominant performance.' : ep.fanVoteResult.margin === 'razor-thin' ? 'By the slimmest of margins.' : 'A decisive victory.'}`
      : isFinalChallenge
      ? `${winner} wins the Final Challenge and takes the season. No jury. No vote. ${wp.Sub} earned it on the field.`
      : `The tribe has spoken. ${winner} is the Sole Survivor. ${winVotes} out of ${totalJury} jury votes.`}
```

- [ ] **Step 4: Update winner confessional for fan-vote**

Find the confessional generation block in `rpBuildWinnerCeremony`. Before the `if (ws.strategic >= 8 && ws.social >= 7)` chain (line ~21207), add a fan-vote specific confessional:

```js
  // Fan-vote specific confessional
  if (ep.fanVoteResult) {
    const fvMargin = ep.fanVoteResult.margin;
    if (fvMargin === 'landslide')
      confessional = `"The fans saw everything. Every move, every conversation, every confessional. And they chose me. That's not luck — that's validation. I played a game worth watching."`;
    else if (fvMargin === 'razor-thin')
      confessional = `"I almost lost. I know how close it was. But almost doesn't count. The fans saw something in me — by the thinnest margin — and I'll take it. A win is a win."`;
    else
      confessional = `"The jury doesn't decide tonight. The fans do. And they picked me. That means more than any jury vote. A million people watched and said — that's the one. I can't believe it."`;
  } else if (ws.strategic >= 8 && ws.social >= 7)
```

Note: the original `if` becomes `else if`.

- [ ] **Step 5: Commit**

```bash
git add simulator.html
git commit -m "feat: fan-vote summary text + winner ceremony adaptations"
```

---

### Task 5: VP — `rpBuildFanCampaign()` screen

**Files:**
- Modify: `simulator.html` — insert new function near other finale VP functions (after `rpBuildFTC`, around line ~29500)

This is the broadcast-style interactive screen. Phases advance on click with animations.

- [ ] **Step 1: Add `rpBuildFanCampaign()` function**

Insert after `rpBuildFTC` function:

```js
function rpBuildFanCampaign(ep) {
  const fc = ep.fanCampaign;
  if (!fc?.phases?.length) return null;
  const epNum = ep.num || 0;
  const stateKey = `fan-campaign-${epNum}`;
  const totalPhases = fc.phases.length * 3; // per finalist: spotlight, speech+pulse, jury reaction
  const jury = ep.gsSnapshot?.jury || gs.jury || [];

  let html = `<div class="rp-page tod-golden" style="overflow:hidden">
    <div class="rp-eyebrow">Episode ${epNum} — Finale</div>
    <div style="text-align:center;margin-bottom:4px">
      <div style="font-size:10px;letter-spacing:3px;color:#e3b341;font-weight:700">LIVE FROM TRIBAL COUNCIL</div>
      <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;color:#f0f6fc;margin-top:4px;text-shadow:0 0 20px rgba(227,179,65,0.15)">THE FAN CAMPAIGN</div>
      <div style="width:60px;height:2px;background:#e3b341;margin:8px auto"></div>
      <div style="font-size:11px;color:#8b949e;margin-top:4px">The jury watches. The fans decide.</div>
    </div>`;

  // Jury bench — always visible
  html += `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:4px;margin:16px 0 20px;padding:10px;background:rgba(139,148,158,0.04);border-radius:8px;border:1px solid rgba(139,148,158,0.08)">
    <div style="width:100%;font-size:9px;letter-spacing:2px;color:#8b949e;font-weight:700;text-align:center;margin-bottom:6px">THE JURY</div>`;
  jury.forEach(j => { html += rpPortrait(j, 'sm'); });
  html += `</div>`;

  // Phase containers — all hidden initially, revealed by clicks
  fc.phases.forEach((phase, pIdx) => {
    const baseId = `${stateKey}-p${pIdx}`;
    const fPr = pronouns(phase.finalist);

    // Sub-phase A: Spotlight (portrait + name + badge)
    html += `<div id="${baseId}-spotlight" style="display:none;opacity:0;transition:opacity 0.5s;margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:16px;padding:16px;border:1px solid rgba(227,179,65,0.2);border-radius:12px;background:rgba(227,179,65,0.04)">
        <div>${rpPortrait(phase.finalist, 'xl')}</div>
        <div>
          <div style="font-family:var(--font-display);font-size:18px;color:#e3b341;letter-spacing:1px">${phase.finalist}</div>
          <div style="font-size:10px;letter-spacing:2px;color:#8b949e;font-weight:700;margin-top:4px">THE PITCH</div>
          <div style="font-size:11px;color:#58a6ff;margin-top:6px">${vpArchLabel(phase.finalist)}</div>
        </div>
      </div>
    </div>`;

    // Sub-phase B: Speech + Pulse + Fan reactions
    const pulseHeights = phase.pulseReaction === 'surging' ? [60,75,85,70,90,95,100]
      : phase.pulseReaction === 'steady' ? [50,55,60,65,55,60,65]
      : phase.pulseReaction === 'mixed' ? [40,60,35,55,30,50,45]
      : [55,45,35,40,30,25,20]; // cooling

    html += `<div id="${baseId}-speech" style="display:none;opacity:0;transition:opacity 0.5s;margin-bottom:16px">
      <div style="padding:14px;border-radius:10px;background:rgba(139,148,158,0.04);border:1px solid rgba(139,148,158,0.08)">
        <div style="font-size:13px;color:#c9d1d9;font-style:italic;line-height:1.7;margin-bottom:14px">${phase.speech}</div>
        <div style="margin-bottom:10px">
          <div style="font-size:9px;letter-spacing:2px;color:#8b949e;font-weight:700;margin-bottom:6px">AUDIENCE PULSE</div>
          <div style="display:flex;gap:3px;align-items:flex-end;height:40px">`;
    pulseHeights.forEach((h, i) => {
      const color = phase.pulseReaction === 'surging' ? '#e3b341' : phase.pulseReaction === 'cooling' ? '#da3633' : '#58a6ff';
      html += `<div id="${baseId}-bar-${i}" style="flex:1;border-radius:2px;height:0%;background:${color};transition:height 0.6s ease ${i * 0.1}s" data-target-height="${h}%"></div>`;
    });
    html += `</div>
          <div style="font-size:10px;color:${phase.pulseReaction === 'surging' ? '#e3b341' : phase.pulseReaction === 'cooling' ? '#da3633' : '#8b949e'};margin-top:4px;text-align:center">Audience response: <strong>${phase.pulseReaction.toUpperCase()}</strong></div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">`;
    phase.fanReactions.forEach((r, i) => {
      const bgColor = r.sentiment === 'positive' ? 'rgba(227,179,65,0.1)' : 'rgba(139,148,158,0.1)';
      const borderColor = r.sentiment === 'positive' ? 'rgba(227,179,65,0.2)' : 'rgba(139,148,158,0.2)';
      const textColor = r.sentiment === 'positive' ? '#e3b341' : '#8b949e';
      const emoji = r.sentiment === 'positive' ? '🔥' : '😤';
      html += `<div id="${baseId}-pill-${i}" style="opacity:0;transition:opacity 0.4s ease ${0.3 + i * 0.2}s;background:${bgColor};border:1px solid ${borderColor};border-radius:20px;padding:4px 10px;font-size:10px;color:${textColor}">${emoji} "${r.text}"</div>`;
    });
    html += `</div>
      </div>
    </div>`;

    // Sub-phase C: Jury reaction
    if (phase.juryReactions?.length) {
      html += `<div id="${baseId}-jury" style="display:none;opacity:0;transition:opacity 0.5s;margin-bottom:20px">
        <div style="background:rgba(139,148,158,0.06);border-radius:8px;padding:12px">
          <div style="font-size:9px;letter-spacing:2px;color:#8b949e;font-weight:700;margin-bottom:8px">JURY REACTS TO ${phase.finalist.toUpperCase()}</div>`;
      phase.juryReactions.forEach(jr => {
        const bondColor = jr.bond >= 3 ? '#3fb950' : jr.bond <= -2 ? '#f85149' : '#8b949e';
        html += `<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px">
          ${rpPortrait(jr.juror, 'sm')}
          <div>
            <div style="font-size:11px;font-weight:600;color:${bondColor}">${jr.juror}</div>
            <div style="font-size:12px;color:#c9d1d9;font-style:italic;line-height:1.5;margin-top:2px">${jr.text}</div>
          </div>
        </div>`;
      });
      html += `</div></div>`;
    }
  });

  // Control buttons
  html += `<div style="display:flex;gap:12px;margin-top:16px;align-items:center" id="${stateKey}-controls">
    <button onclick="fanCampaignAdvance('${stateKey}', ${totalPhases})" id="${stateKey}-btn" style="padding:8px 20px;background:var(--accent-gold);border:none;border-radius:6px;color:#0d1117;font-family:var(--font-display);font-size:13px;letter-spacing:1px;cursor:pointer;font-weight:700">BEGIN BROADCAST</button>
    <button onclick="fanCampaignRevealAll('${stateKey}', ${totalPhases})" style="padding:6px 12px;background:transparent;border:1px solid var(--border);border-radius:6px;color:var(--muted);font-size:11px;cursor:pointer">See all</button>
  </div>`;

  html += `</div>`;
  return html;
}
```

- [ ] **Step 2: Add the interactive JS functions**

Find the `window.scvRevealAll` function (around line ~23679) and after its closing block, add:

```js
  window._fcState = {};
  window.fanCampaignAdvance = function(key, totalPhases) {
    if (!window._fcState[key]) window._fcState[key] = 0;
    const step = window._fcState[key];
    if (step >= totalPhases) return;

    const phaseIdx = Math.floor(step / 3);
    const subPhase = step % 3;
    const baseId = `${key}-p${phaseIdx}`;

    // Dim previous finalist's section
    if (phaseIdx > 0 && subPhase === 0) {
      const prevBase = `${key}-p${phaseIdx - 1}`;
      ['spotlight', 'speech', 'jury'].forEach(s => {
        const el = document.getElementById(`${prevBase}-${s}`);
        if (el) el.style.opacity = '0.4';
      });
    }

    if (subPhase === 0) {
      // Show spotlight
      const el = document.getElementById(`${baseId}-spotlight`);
      if (el) { el.style.display = 'block'; setTimeout(() => el.style.opacity = '1', 50); }
    } else if (subPhase === 1) {
      // Show speech + animate pulse bars + pop fan pills
      const el = document.getElementById(`${baseId}-speech`);
      if (el) {
        el.style.display = 'block';
        setTimeout(() => {
          el.style.opacity = '1';
          // Animate bars
          for (let i = 0; i < 7; i++) {
            const bar = document.getElementById(`${baseId}-bar-${i}`);
            if (bar) bar.style.height = bar.dataset.targetHeight;
          }
          // Pop pills
          for (let i = 0; i < 5; i++) {
            const pill = document.getElementById(`${baseId}-pill-${i}`);
            if (pill) pill.style.opacity = '1';
          }
        }, 50);
      }
    } else if (subPhase === 2) {
      // Show jury reaction
      const el = document.getElementById(`${baseId}-jury`);
      if (el) { el.style.display = 'block'; setTimeout(() => el.style.opacity = '1', 50); }
    }

    window._fcState[key] = step + 1;
    const btn = document.getElementById(`${key}-btn`);
    if (btn) {
      if (step + 1 >= totalPhases) btn.textContent = 'BROADCAST COMPLETE';
      else {
        const labels = ['SHOW SPEECH', 'JURY REACTS', 'NEXT FINALIST'];
        const nextSub = (step + 1) % 3;
        btn.textContent = step + 1 >= totalPhases - 1 ? 'JURY REACTS' : labels[nextSub] || 'CONTINUE';
      }
    }
  };
  window.fanCampaignRevealAll = function(key, totalPhases) {
    while ((window._fcState[key] || 0) < totalPhases) {
      fanCampaignAdvance(key, totalPhases);
    }
    // Undim everything
    document.querySelectorAll(`[id^="${key}-p"]`).forEach(el => {
      if (el.style.opacity === '0.4') el.style.opacity = '1';
    });
  };
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: add rpBuildFanCampaign VP screen with interactive broadcast"
```

---

### Task 6: VP — `rpBuildFanVoteReveal()` screen

**Files:**
- Modify: `simulator.html` — insert after `rpBuildFanCampaign()` (from Task 5)

The climax screen: interactive percentage reveal for F2 (head-to-head bars) or F3 (vertical bars).

- [ ] **Step 1: Add `rpBuildFanVoteReveal()` function**

Insert after `rpBuildFanCampaign`:

```js
function rpBuildFanVoteReveal(ep) {
  const fvr = ep.fanVoteResult;
  if (!fvr) return null;
  const epNum = ep.num || 0;
  const stateKey = `fan-vote-${epNum}`;
  const finalists = fvr.rankings;
  const isF2 = finalists.length === 2;
  const totalSteps = 10; // 10 reveal clicks to fill to 100%

  let html = `<div class="rp-page tod-golden" style="overflow:hidden">
    <div class="rp-eyebrow">Episode ${epNum} — Finale</div>
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:10px;letter-spacing:3px;color:#e3b341;font-weight:700">THE MOMENT OF TRUTH</div>
      <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;color:#f0f6fc;margin-top:4px;text-shadow:0 0 20px rgba(227,179,65,0.15)">THE FAN VOTE</div>
      <div style="width:60px;height:2px;background:#e3b341;margin:8px auto"></div>
      <div style="font-size:11px;color:#8b949e;margin-top:4px">${isF2 ? 'Head to head. One winner.' : 'Three finalists. One winner. The fans decide.'}</div>
    </div>`;

  if (isF2) {
    // F2: Head-to-head layout
    const [a, b] = finalists;
    const aPct = fvr.percentages[a] || 50;
    const bPct = fvr.percentages[b] || 50;

    html += `<div id="${stateKey}" data-step="0" data-total="${totalSteps}" data-pcts="${aPct},${bPct}" data-names="${a},${b}" data-winner="${fvr.winner}" data-margin="${fvr.margin}">`;

    // Portraits facing each other
    html += `<div style="display:flex;justify-content:center;align-items:center;gap:32px;margin-bottom:24px">
      <div style="text-align:center" id="${stateKey}-left">
        ${rpPortrait(a, 'xl')}
        <div style="font-family:var(--font-display);font-size:16px;color:#f0f6fc;margin-top:8px">${a}</div>
        <div style="font-size:11px;color:#8b949e">${vpArchLabel(a)}</div>
      </div>
      <div style="font-family:var(--font-display);font-size:20px;color:#8b949e;letter-spacing:2px">VS</div>
      <div style="text-align:center" id="${stateKey}-right">
        ${rpPortrait(b, 'xl')}
        <div style="font-family:var(--font-display);font-size:16px;color:#f0f6fc;margin-top:8px">${b}</div>
        <div style="font-size:11px;color:#8b949e">${vpArchLabel(b)}</div>
      </div>
    </div>`;

    // Central percentage display
    html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <div id="${stateKey}-pct-a" style="font-family:var(--font-mono);font-size:28px;color:#e3b341;font-weight:700;text-align:right;flex:1;transition:all 0.4s">—</div>
      <div style="font-size:12px;color:#8b949e">|</div>
      <div id="${stateKey}-pct-b" style="font-family:var(--font-mono);font-size:28px;color:#58a6ff;font-weight:700;text-align:left;flex:1;transition:all 0.4s">—</div>
    </div>`;

    // Dual bar
    html += `<div style="display:flex;height:24px;border-radius:12px;overflow:hidden;background:rgba(139,148,158,0.1);margin-bottom:20px">
      <div id="${stateKey}-bar-a" style="height:100%;background:linear-gradient(90deg,#e3b341,#d29922);width:0%;transition:width 0.6s ease;border-radius:12px 0 0 12px"></div>
      <div id="${stateKey}-bar-b" style="height:100%;background:linear-gradient(90deg,#3b82f6,#58a6ff);width:0%;transition:width 0.6s ease;border-radius:0 12px 12px 0;margin-left:auto"></div>
    </div>`;

    html += `</div>`;

  } else {
    // F3: Vertical bars layout
    html += `<div id="${stateKey}" data-step="0" data-total="${totalSteps}" data-pcts="${finalists.map(f => fvr.percentages[f] || 0).join(',')}" data-names="${finalists.join(',')}" data-winner="${fvr.winner}" data-margin="${fvr.margin}">`;

    html += `<div style="display:flex;justify-content:center;gap:24px;margin-bottom:20px;align-items:flex-end">`;
    finalists.forEach((name, i) => {
      const colors = ['#e3b341', '#58a6ff', '#a78bfa'];
      html += `<div style="text-align:center;flex:1;max-width:160px">
        <div style="height:160px;display:flex;align-items:flex-end;justify-content:center;margin-bottom:8px">
          <div id="${stateKey}-vbar-${i}" style="width:48px;border-radius:6px 6px 0 0;background:${colors[i]};height:0%;transition:height 0.6s ease"></div>
        </div>
        ${rpPortrait(name, 'lg')}
        <div style="font-family:var(--font-display);font-size:14px;color:#f0f6fc;margin-top:6px">${name}</div>
        <div style="font-size:10px;color:#8b949e">${vpArchLabel(name)}</div>
        <div id="${stateKey}-vpct-${i}" style="font-family:var(--font-mono);font-size:20px;color:${colors[i]};font-weight:700;margin-top:6px;transition:all 0.4s">—</div>
      </div>`;
    });
    html += `</div>`;

    html += `</div>`;
  }

  // Winner section — hidden until fully revealed
  html += `<div id="${stateKey}-winner" style="display:none;text-align:center;margin-top:20px;padding:20px;border:2px solid rgba(227,179,65,0.4);border-radius:12px;background:rgba(227,179,65,0.06);box-shadow:0 0 30px rgba(227,179,65,0.1)">
    <div style="font-size:10px;letter-spacing:3px;color:#e3b341;font-weight:700;margin-bottom:12px">THE FANS HAVE SPOKEN</div>
    ${rpPortrait(fvr.winner, 'xl')}
    <div style="font-family:var(--font-display);font-size:24px;color:#e3b341;margin-top:12px;text-shadow:0 0 20px rgba(227,179,65,0.3)">${fvr.winner}</div>
    <div style="font-size:13px;color:#8b949e;margin-top:8px">${fvr.percentages[fvr.winner]}% of the fan vote</div>
    <span class="rp-brant-badge gold" style="margin-top:8px;display:inline-block">${fvr.margin === 'landslide' ? 'LANDSLIDE' : fvr.margin === 'razor-thin' ? 'RAZOR-THIN' : 'COMFORTABLE'}</span>
    <div style="margin-top:16px;font-size:11px;color:#8b949e">
      ${fvr.breakdown.map(b => `${b.name}: ${b.pct}% (popularity: ${b.popularity})`).join(' &nbsp;|&nbsp; ')}
    </div>
  </div>`;

  // Control buttons
  html += `<div style="display:flex;gap:12px;margin-top:16px;align-items:center">
    <button onclick="fanVoteRevealNext('${stateKey}')" id="${stateKey}-btn" style="padding:8px 20px;background:var(--accent-gold);border:none;border-radius:6px;color:#0d1117;font-family:var(--font-display);font-size:13px;letter-spacing:1px;cursor:pointer;font-weight:700">REVEAL (0/${totalSteps})</button>
    <button onclick="fanVoteRevealAll('${stateKey}')" style="padding:6px 12px;background:transparent;border:1px solid var(--border);border-radius:6px;color:var(--muted);font-size:11px;cursor:pointer">See all results</button>
  </div>`;

  html += `</div>`;
  return html;
}
```

- [ ] **Step 2: Add the interactive JS functions for fan vote reveal**

After the `fanCampaignRevealAll` function (from Task 5), add:

```js
  window.fanVoteRevealNext = function(key) {
    const container = document.getElementById(key);
    if (!container) return;
    let step = parseInt(container.dataset.step);
    const total = parseInt(container.dataset.total);
    if (step >= total) return;
    step++;
    container.dataset.step = step;

    const pcts = container.dataset.pcts.split(',').map(Number);
    const names = container.dataset.names.split(',');
    const progress = step / total; // 0.0 to 1.0
    const isF2 = names.length === 2;

    if (isF2) {
      const revA = Math.round(pcts[0] * progress);
      const revB = Math.round(pcts[1] * progress);
      document.getElementById(`${key}-pct-a`).textContent = revA + '%';
      document.getElementById(`${key}-pct-b`).textContent = revB + '%';
      document.getElementById(`${key}-bar-a`).style.width = revA + '%';
      document.getElementById(`${key}-bar-b`).style.width = revB + '%';
    } else {
      names.forEach((name, i) => {
        const revPct = Math.round(pcts[i] * progress);
        const pctEl = document.getElementById(`${key}-vpct-${i}`);
        const barEl = document.getElementById(`${key}-vbar-${i}`);
        if (pctEl) pctEl.textContent = revPct + '%';
        if (barEl) barEl.style.height = Math.max(2, revPct * 1.5) + '%';
      });
    }

    // Update button
    const btn = document.getElementById(`${key}-btn`);
    if (btn) btn.textContent = step >= total ? 'All Revealed' : `REVEAL (${step}/${total})`;

    // Show winner on final step
    if (step >= total) {
      const winnerEl = document.getElementById(`${key}-winner`);
      if (winnerEl) winnerEl.style.display = 'block';

      // Highlight winner portrait
      if (isF2) {
        const winIdx = names.indexOf(container.dataset.winner);
        const sideId = winIdx === 0 ? `${key}-left` : `${key}-right`;
        const loseId = winIdx === 0 ? `${key}-right` : `${key}-left`;
        const winSide = document.getElementById(sideId);
        const loseSide = document.getElementById(loseId);
        if (winSide) winSide.style.filter = 'drop-shadow(0 0 20px rgba(227,179,65,0.5))';
        if (loseSide) loseSide.style.opacity = '0.5';
      }
    }
  };
  window.fanVoteRevealAll = function(key) {
    const container = document.getElementById(key);
    if (!container) return;
    const total = parseInt(container.dataset.total);
    container.dataset.step = '0';
    for (let i = 0; i < total; i++) fanVoteRevealNext(key);
  };
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: add rpBuildFanVoteReveal VP screen with interactive reveal"
```

---

### Task 7: VP Screen Flow — Wire fan-vote screens into `buildEpisodeMap()`

**Files:**
- Modify: `simulator.html:32287-32292` (finale immunity challenge screen condition)
- Modify: `simulator.html:32597-32658` (finale-specific VP screens section)

- [ ] **Step 1: Skip immunity challenge screen for fan-vote F2**

Find this line (around 32287):

```js
  if (ep.isFinale && ep.challengeType && (seasonConfig.finaleSize >= 3 || seasonConfig.firemaking) && seasonConfig.finaleFormat !== 'final-challenge' && seasonConfig.finaleFormat !== 'koh-lanta') {
```

Add `&& seasonConfig.finaleFormat !== 'fan-vote'` condition — but only if immunity was skipped. Actually, fan-vote with F3/F4 DOES have immunity. The immunity is only skipped for F2. We can check `ep.immunityWinner` instead:

Replace with:

```js
  if (ep.isFinale && ep.challengeType && ep.immunityWinner && (seasonConfig.finaleSize >= 3 || seasonConfig.firemaking) && seasonConfig.finaleFormat !== 'final-challenge' && seasonConfig.finaleFormat !== 'koh-lanta') {
```

This naturally excludes F2 fan-vote (no `ep.immunityWinner`) while still showing immunity for F3/F4 fan-vote.

- [ ] **Step 2: Add fan campaign + fan vote screens to finale VP flow**

In the finale-specific screens section (line ~32597), find the FTC block:

```js
    // Final Tribal Council (jury-based games only)
    if (ep.juryResult) {
      const _ftcHtml = rpBuildFTC(ep);
      if (_ftcHtml) vpScreens.push({ id:'ftc', label:'Final Tribal', html: _ftcHtml });

      // Jury vote reveal — sequential cards
      const _jvHtml = rpBuildJuryVoteReveal(ep);
      if (_jvHtml) vpScreens.push({ id:'jury-vote', label:'Jury Vote', html: _jvHtml });
    }
```

Add the fan-vote screens BEFORE this block:

```js
    // Fan Vote Finale — campaign + vote reveal (replaces FTC)
    if (ep.fanCampaign) {
      const _fcHtml = rpBuildFanCampaign(ep);
      if (_fcHtml) vpScreens.push({ id:'fan-campaign', label:'Fan Campaign', html: _fcHtml });
    }
    if (ep.fanVoteResult) {
      const _fvrHtml = rpBuildFanVoteReveal(ep);
      if (_fvrHtml) vpScreens.push({ id:'fan-vote-reveal', label:'The Fan Vote', html: _fvrHtml });
    }

    // Final Tribal Council (jury-based games only)
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: wire fan-vote screens into VP finale flow"
```

---

### Task 8: Config validation + hidden popularity + summary text guard

**Files:**
- Modify: `simulator.html:21283-21288` (summary text immunity section — guard for fan-vote F2)
- Modify: `simulator.html:1061` (finaleFormat dropdown — disable fan-vote when no popularity)
- Modify: `simulator.html:1136-1143` (popularity config UI — add "Hide rankings" checkbox)
- Modify: `simulator.html:2338` (saveConfig — save hidePopularity)
- Modify: `simulator.html:2376` (loadConfig — load hidePopularity)
- Modify: `simulator.html:22531-22563` (Cold Open Fan Pulse — hide when hidePopularity)
- Modify: `simulator.html:24164-24193` (Aftermath Fan Pulse — hide when hidePopularity)

- [ ] **Step 1: Guard immunity summary text for fan-vote F2**

In `generateFinaleSummaryText`, find:

```js
  sec('FINAL IMMUNITY CHALLENGE');
  ln(`${ep.immunityWinner} wins the Final Immunity Challenge (${ep.challengeLabel||'Mixed'}).`);
```

Wrap in a condition:

```js
  if (ep.immunityWinner) {
    sec('FINAL IMMUNITY CHALLENGE');
    ln(`${ep.immunityWinner} wins the Final Immunity Challenge (${ep.challengeLabel||'Mixed'}).`);
    const immS = pStats(ep.immunityWinner);
    if (immS.physical >= 8 || immS.endurance >= 8) ln(`A dominant performance — ${ep.immunityWinner} wanted this one.`);
    else ln(`${ep.immunityWinner} digs deep when it matters most.`);
  }
```

Remove the original 3 lines (`sec`, `ln`, and the stat check below) since they're now inside the `if` block.

- [ ] **Step 2: Disable fan-vote option when popularity is off**

Find the finaleFormat dropdown. The fan-vote option needs to be dynamically disabled/enabled based on popularity checkbox state. Find the `onchange` handler for `cfg-popularity` checkbox and add logic to disable fan-vote option:

In the `saveConfig()` function (or wherever the popularity checkbox change is handled), add:

```js
// Disable fan-vote finale option when popularity is off
const _fvOpt = document.querySelector('#cfg-finale-format option[value="fan-vote"]');
if (_fvOpt) {
  const _popOn = g('cfg-popularity')?.checked;
  _fvOpt.disabled = !_popOn;
  _fvOpt.textContent = _popOn ? 'Fan Vote Finale' : 'Fan Vote Finale (requires popularity)';
  // If fan-vote was selected but popularity just got disabled, reset to traditional
  if (!_popOn && seasonConfig.finaleFormat === 'fan-vote') {
    seasonConfig.finaleFormat = 'traditional';
    const _fmSel = g('cfg-finale-format');
    if (_fmSel) _fmSel.value = 'traditional';
  }
}
```

Also add this same check in `loadConfig()` so the option is correctly disabled/enabled on page load.

- [ ] **Step 3: Add "Hide rankings" checkbox to popularity config UI**

After the existing popularity checkbox (line ~1138-1141), add:

```html
<label class="acc-check-row" id="hide-pop-row" style="margin-top:6px">
  <input type="checkbox" id="cfg-hide-popularity" onchange="saveConfig()">
  <span>Hide rankings (no spoilers)</span>
</label>
<p class="acc-desc" id="hide-pop-desc">Hides the Fan Pulse leaderboard during the season. Popularity still tracks internally — results only revealed at the Fan Vote finale.</p>
```

- [ ] **Step 4: Wire hidePopularity into saveConfig/loadConfig**

In `saveConfig()` (line ~2338), add after `popularityEnabled`:

```js
hidePopularity: g('cfg-hide-popularity')?.checked ?? false,
```

In `loadConfig()` (line ~2376), add after the popularity checkbox restore:

```js
chk('cfg-hide-popularity', seasonConfig.hidePopularity ?? false);
// Show/hide the hide-popularity row based on popularity being enabled
const _hpRow = g('hide-pop-row');
if (_hpRow) _hpRow.style.display = (seasonConfig.popularityEnabled ?? true) ? '' : 'none';
```

Also in the popularity checkbox `onchange`, toggle the hide-popularity row visibility:

```js
const _hpRow2 = g('hide-pop-row');
if (_hpRow2) _hpRow2.style.display = g('cfg-popularity')?.checked ? '' : 'none';
```

- [ ] **Step 5: Hide Fan Pulse in Cold Open when hidePopularity is on**

In `rpBuildColdOpen` (line ~22531), change:

```js
  if (seasonConfig.popularityEnabled !== false) {
```

To:

```js
  if (seasonConfig.popularityEnabled !== false && !seasonConfig.hidePopularity) {
```

- [ ] **Step 6: Hide Fan Pulse in Aftermath when hidePopularity is on**

In `rpBuildAftermath` (line ~24164), change:

```js
  if (seasonConfig.popularityEnabled !== false) {
```

To:

```js
  if (seasonConfig.popularityEnabled !== false && !seasonConfig.hidePopularity) {
```

- [ ] **Step 7: Commit**

```bash
git add simulator.html
git commit -m "feat: fan-vote requires popularity + hidden popularity mode"
```

---

### Task 9: Manual testing + edge case verification

- [ ] **Step 1: Test F2 fan-vote**

1. Open simulator.html in a browser
2. Set season config: `finaleFormat = 'fan-vote'`, `finaleSize = 2`, `popularityEnabled = true`
3. Run a full season to the finale
4. Verify: no immunity challenge screen, fan campaign screen appears with interactive broadcast, fan vote reveal shows F2 head-to-head bars, winner ceremony shows "THE FANS HAVE SPOKEN"

- [ ] **Step 2: Test F3 fan-vote (from finaleSize 3)**

1. Set `finaleSize = 3`
2. Run season to finale
3. Verify: immunity challenge runs, Decision screen cuts to F2, fan campaign + fan vote with F2

- [ ] **Step 3: Test F4 fan-vote (from finaleSize 4)**

1. Set `finaleSize = 4`
2. Run season to finale
3. Verify: immunity challenge runs, Decision cuts to F3, fan campaign + fan vote with F3 (three-way vertical bars)

- [ ] **Step 4: Test fan-vote without popularity enabled**

1. Disable popularity checkbox
2. Verify: fan-vote option in finale format dropdown is greyed out / disabled with "(requires popularity)" text
3. If fan-vote was selected, verify it resets to traditional
4. Re-enable popularity, verify fan-vote option becomes available again

- [ ] **Step 4b: Test hidden popularity mode**

1. Enable popularity, check "Hide rankings (no spoilers)"
2. Run several episodes
3. Verify: Cold Open screen has NO "Fan Pulse" section
4. Verify: Aftermath screen has NO "Fan Pulse" section
5. Run to finale with fan-vote format
6. Verify: Fan Vote Reveal screen DOES show percentages (the payoff)
7. Uncheck "Hide rankings" mid-season, verify Fan Pulse reappears

- [ ] **Step 5: Test interactive elements**

1. On fan campaign screen: click through all phases, verify animations (pulse bars grow, pills fade in, jury quotes appear, previous finalist dims)
2. Click "See all" — verify everything reveals at once
3. On fan vote screen: click REVEAL 10 times, verify bars grow progressively, percentages update, winner section appears on final click
4. Click "See all results" — verify instant reveal

- [ ] **Step 6: Commit any fixes**

```bash
git add simulator.html
git commit -m "fix: fan-vote finale edge cases"
```
