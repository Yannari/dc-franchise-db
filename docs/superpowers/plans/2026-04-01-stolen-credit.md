# Stolen Credit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a probabilistic "Stolen Credit" mechanic — a bold player publicly takes credit for another player's big move, with a potential confrontation the next episode.

**Architecture:** Single-file changes in `simulator.html`. Track bigMoves earners in `updatePlayerStates()` → `gs.bigMoveThisEp`. New `checkStolenCredit(ep)` function fires in `generateCampEvents` pre-phase to check previous episode's big moves. Confrontation fires next episode via `gs.stolenCredit` state. VP badges via existing `rpBuildCampTribe` badge block.

**Tech Stack:** Vanilla JS, existing camp event patterns.

**Spec:** `docs/superpowers/specs/2026-04-01-stolen-credit-design.md`

---

### Task 1: Track bigMoves earners per episode

**Files:**
- Modify: `simulator.html` — `updatePlayerStates()` function (line ~3063)

The existing `updatePlayerStates` increments `bigMoves` but doesn't record WHO earned one this episode. We need that for the theft check next episode.

- [ ] **Step 1: Add bigMoves tracking array**

In `updatePlayerStates(ep)`, find the block that increments `bigMoves` (around line 3085-3101). After the last bigMoves increment check (`// Survived being the top target`), add:

```js
    // Track who earned bigMoves this episode for Stolen Credit mechanic
    if ((state.bigMoves || 0) > (_priorBigMoves || 0)) {
      if (!gs.bigMoveEarnersThisEp) gs.bigMoveEarnersThisEp = [];
      if (!gs.bigMoveEarnersThisEp.includes(name)) gs.bigMoveEarnersThisEp.push(name);
    }
```

But we need `_priorBigMoves` — capture it BEFORE the increment checks. Find the line `// Big moves: actions that build a FTC resume` (line ~3085). Add right BEFORE it:

```js
    const _priorBigMoves = state.bigMoves || 0;
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: track bigMoves earners per episode for stolen credit"
```

---

### Task 2: Add `checkStolenCredit(ep)` function — the theft

**Files:**
- Modify: `simulator.html` — insert new function after `checkInformationBroker` (line ~11331)

- [ ] **Step 1: Add the function**

Find `function checkInformationBroker(ep)` and find its closing `}`. Insert after it:

```js
// [5] STOLEN CREDIT — bold player takes public credit for another's big move
function checkStolenCredit(ep) {
  // ── PHASE 1: Check for CONFRONTATION from previous episode's theft ──
  if (gs.stolenCredit && !gs.stolenCredit.confronted) {
    const { stealer, architect, ep: theftEp } = gs.stolenCredit;
    const currentEp = (gs.episode || 0) + 1;
    if (!gs.activePlayers.includes(stealer) || !gs.activePlayers.includes(architect)) {
      gs.stolenCredit.confronted = true; // one of them got eliminated, consume
    } else if (currentEp - theftEp >= 3) {
      gs.stolenCredit.confronted = true; // expired — architect let it go
    } else if (currentEp > theftEp) {
      // Confrontation roll
      const aS = pStats(architect);
      const aPr = pronouns(architect);
      const sPr = pronouns(stealer);
      const sS = pStats(stealer);
      const confrontChance = aS.boldness * 0.08 + (10 - aS.temperament) * 0.05;
      if (Math.random() < confrontChance) {
        // Confrontation fires
        const _pick = (arr, seed) => arr[([...seed].reduce((a,c)=>a+c.charCodeAt(0),0)+(gs.episode||0)*7)%arr.length];

        // Beat 1: The Callout (architect speaks)
        let calloutText;
        if (aS.temperament <= 4) {
          // Hothead — explosive
          calloutText = _pick([
            `${architect} snaps. It's been building since last tribal. "You sat there and did NOTHING and then you told everyone it was YOUR move? Say it to my face, ${stealer}. Say it right now." The camp goes dead silent.`,
            `${architect} doesn't plan it. It just comes out — at the well, in front of three people. "You want to know who ACTUALLY flipped the vote? Because it wasn't ${stealer}. Ask me. Ask anyone who was actually paying attention." ${stealer} puts down ${sPr.pos} canteen.`,
            `${architect} explodes at the fire. "I am DONE watching ${stealer} walk around this camp like ${sPr.sub} ${sPr.sub==='they'?'run':'runs'} this game. That was MY move. MINE. And every single person here knows it." ${stealer} doesn't blink.`,
          ], architect + stealer + 'hothead');
        } else if (aS.boldness >= 7) {
          // Bold + composed — calculated confrontation
          calloutText = _pick([
            `${architect} pulls ${stealer} aside after the challenge. "We both know what happened at that tribal. You didn't orchestrate anything. I did. And if you keep telling people otherwise, I'll make sure the jury knows exactly who did what." It's not a threat. It's a promise.`,
            `${architect} waits until the right moment — when enough people are listening. "Hey ${stealer}, tell them again about how you planned the blindside. I love that story. Especially the part where I came to YOU with the plan." ${stealer}'s smile freezes.`,
            `${architect} corners ${stealer} at the water well. ${aPr.Sub} ${aPr.sub==='they'?'keep':'keeps'} ${aPr.pos} voice low but every word lands: "I know what you're doing. Taking credit for my game. It ends now — or I tell everyone exactly how that vote really went down."`,
          ], architect + stealer + 'bold');
        } else {
          // Emotional crack — wasn't planning to confront
          calloutText = _pick([
            `${architect} didn't mean to say anything. But sitting there listening to ${stealer} take credit one more time — something breaks. "That was MY move. You know it was my move. Why are you doing this?" The rawness catches everyone off guard.`,
            `It happens at the worst possible time — right before tribal. ${architect}'s voice cracks: "I just — I can't listen to this anymore. ${stealer} didn't do anything. I did. And I'm tired of pretending otherwise." The tribe freezes.`,
            `${architect} has been holding it in for days. ${aPr.Sub} finally ${aPr.sub==='they'?'break':'breaks'} at camp, voice shaking: "You took my move. You took the one thing I did in this game that mattered and you put your name on it. I can't just — I can't let that go."`,
          ], architect + stealer + 'emotional');
        }

        // Beat 2: The Response + Outcome
        const architectScore = aS.social + aS.strategic;
        const stealerScore = sS.social + sS.boldness;
        const architectWins = architectScore > stealerScore;

        let responseText;
        if (architectWins) {
          responseText = _pick([
            `${stealer} tries to laugh it off, but ${architect} has receipts. ${aPr.Sub} ${aPr.sub==='they'?'name':'names'} the conversation, the timing, the exact words. ${stealer} has nothing. The tribe watches ${stealer} shrink. Nobody believes ${sPr.pos} version anymore.`,
            `${stealer} starts to respond — and stops. There's nothing to say. ${architect} laid it out too clearly. The tribe exchanges looks. ${stealer}'s credibility just evaporated.`,
            `"That's not how it happened—" ${stealer} starts. ${architect} cuts ${sPr.obj} off with specifics: who said what, when, where. ${stealer} goes quiet. The silence is the verdict.`,
          ], architect + stealer + 'awin');
          // Architect reclaims partial credit
          const aState = gs.playerStates[architect] || {};
          aState.bigMoves = (aState.bigMoves || 0) + 0.5;
          gs.playerStates[architect] = aState;
          const sState = gs.playerStates[stealer] || {};
          sState.bigMoves = Math.max(0, (sState.bigMoves || 0) - 0.5);
          gs.playerStates[stealer] = sState;
          // Stealer loses face with witnesses
          const witnesses = gs.activePlayers.filter(p => p !== stealer && p !== architect).slice(0, 2);
          witnesses.forEach(w => addBond(w, stealer, -0.5));
          // Stealer gets heat
          gs.stolenCreditHeat = { player: stealer, ep: currentEp };
        } else {
          responseText = _pick([
            `${stealer} doesn't flinch. "${sPr.Sub} ${sPr.sub==='they'?'don\'t':'doesn\'t'} know what ${architect} is talking about. We all saw what happened. I'm sorry ${aPr.sub} ${aPr.sub==='they'?'feel':'feels'} that way." It's so smooth it almost sounds sincere. The tribe nods along. ${architect} looks like the petty one.`,
            `${stealer} turns it around: "If ${architect} really made that move, why didn't ${aPr.sub} say something at the time? Why now?" The tribe looks at ${architect}. ${aPr.Sub} ${aPr.sub==='they'?'have':'has'} no answer. ${stealer} walks away looking vindicated.`,
            `${stealer} sighs, shakes ${sPr.pos} head. "I'm not going to argue about who did what. The game speaks for itself." It's dismissive. It's condescending. And it works. ${architect} looks desperate.`,
          ], architect + stealer + 'swin');
          // Architect looks petty — loses MORE standing
          const aState = gs.playerStates[architect] || {};
          aState.bigMoves = Math.max(0, (aState.bigMoves || 0) - 0.5);
          gs.playerStates[architect] = aState;
          // Architect loses face with witnesses
          const witnesses = gs.activePlayers.filter(p => p !== stealer && p !== architect).slice(0, 2);
          witnesses.forEach(w => addBond(w, architect, -0.3));
        }

        // Both outcomes: additional bond damage
        addBond(architect, stealer, -1.0);
        gs.stolenCredit.confronted = true;

        // Push camp event
        const _campKey = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(architect))?.name || 'merge');
        if (ep.campEvents?.[_campKey]) {
          const phase = ep.campEvents[_campKey].pre ? 'pre' : null;
          if (phase) {
            ep.campEvents[_campKey].pre.push({
              type: 'stolenCreditConfrontation',
              players: [architect, stealer],
              text: calloutText + ' ' + responseText,
              badgeText: architectWins ? 'CREDIT RECLAIMED' : 'CONFRONTATION FAILED',
              badgeClass: architectWins ? 'gold' : 'red',
            });
          }
        }
        // Save to episode history
        if (!ep.stolenCreditEvents) ep.stolenCreditEvents = [];
        ep.stolenCreditEvents.push({ type: 'confrontation', architect, stealer, architectWins, ep: currentEp });
      } else {
        // No confrontation — resentment simmers
        addBond(architect, stealer, -0.3);
      }
    }
    return; // Don't check for new theft in the same call as confrontation
  }

  // ── PHASE 2: Check for NEW theft ──
  if (gs.stolenCreditFired) return; // once per game
  const currentEp = (gs.episode || 0) + 1;
  if (currentEp < 2) return; // need at least one tribal

  // Check previous episode's bigMoves earners
  const architects = gs.bigMoveEarnersThisEp || [];
  gs.bigMoveEarnersThisEp = []; // consume
  if (!architects.length) return;

  for (const architect of architects) {
    if (!gs.activePlayers.includes(architect)) continue;
    const aS = pStats(architect);

    // Find potential stealer at same camp
    const campMembers = gs.isMerged
      ? gs.activePlayers
      : (gs.tribes.find(t => t.members.includes(architect))?.members || []);
    const candidates = campMembers.filter(p => {
      if (p === architect) return false;
      const s = pStats(p);
      if (s.boldness < 6) return false;
      // Not in strong alliance with architect
      const sharedAlliance = (gs.namedAlliances || []).find(a =>
        a.active !== false && a.members.includes(p) && a.members.includes(architect)
      );
      if (sharedAlliance && getBond(p, architect) >= 3) return false;
      return true;
    });
    if (!candidates.length) continue;

    // Pick best candidate: boldness * 0.6 + social * 0.4
    candidates.sort((a, b) => {
      const aScore = pStats(a).boldness * 0.6 + pStats(a).social * 0.4;
      const bScore = pStats(b).boldness * 0.6 + pStats(b).social * 0.4;
      return bScore - aScore;
    });
    const stealer = candidates[0];
    const sS = pStats(stealer);
    const sPr = pronouns(stealer);
    const aPr = pronouns(architect);

    // Roll
    const bond = getBond(stealer, architect);
    const chance = sS.boldness * 0.015 + (bond <= -1 ? 0.05 : 0);
    if (Math.random() >= chance) continue;

    // THEFT FIRES
    gs.stolenCreditFired = true;

    // bigMoves transfer
    const sState = gs.playerStates[stealer] || { emotional: 'content', votesReceived: 0, lastVotedEp: null, bigMoves: 0 };
    sState.bigMoves = (sState.bigMoves || 0) + 1;
    gs.playerStates[stealer] = sState;
    const aState = gs.playerStates[architect] || { emotional: 'content', votesReceived: 0, lastVotedEp: null, bigMoves: 0 };
    aState.bigMoves = Math.max(0, (aState.bigMoves || 0) - 1);
    gs.playerStates[architect] = aState;

    // Bond damage
    addBond(architect, stealer, -(1.5 + sS.boldness * 0.1));

    // State
    gs.stolenCredit = { stealer, architect, ep: currentEp, confronted: false };

    // Generate theft camp event text
    const _pick = (arr, seed) => arr[([...seed].reduce((a,c)=>a+c.charCodeAt(0),0)+(gs.episode||0)*7)%arr.length];

    let theftText;
    if (sS.boldness >= 8) {
      theftText = _pick([
        `${stealer} is holding court at the fire, retelling the blindside like ${sPr.sub} drew it up on a whiteboard. "I pulled them aside before tribal and told them exactly what was going to happen." ${architect} is sitting three feet away. ${aPr.Sub} didn't say a word.`,
        `${stealer} can't stop talking about last tribal. The story gets bigger every time ${sPr.sub} ${sPr.sub==='they'?'tell':'tells'} it. "That was the biggest move of the season and I'm not afraid to say I made it." ${architect} stares at the ground.`,
        `At the water well, ${stealer} is explaining the vote to anyone who'll listen. "I saw the opening and I took it. Simple as that." ${architect} was there. ${architect} MADE the opening. But ${stealer} is louder. And louder wins at camp.`,
      ], stealer + architect + 'shameless');
    } else {
      theftText = _pick([
        `${stealer} keeps saying "we" but meaning "I." Every time someone brings up last tribal, ${sPr.sub} ${sPr.sub==='they'?'steer':'steers'} the story. ${architect} notices. Everyone else doesn't.`,
        `It's subtle. ${stealer} doesn't outright claim the move — ${sPr.sub} just... positions ${sPr.ref} at the center of every retelling. "Yeah, I talked to them first, and then the rest of us got on board." ${architect} bites ${aPr.pos} tongue.`,
        `${stealer} drops it casually at dinner: "I've been thinking about this game strategically, and I think last tribal was my best move." ${architect} almost chokes on ${aPr.pos} rice. That was NOT ${stealer}'s move.`,
      ], stealer + architect + 'subtle');
    }

    // Architect reaction (brief — confrontation comes next episode)
    let reactionText;
    if (aS.temperament >= 7) {
      reactionText = _pick([
        `${architect} says nothing. But in confessional: "I'm watching someone take credit for MY move and I can't even—" ${aPr.Sub} stops. Breathes. "This isn't over."`,
        `${architect} keeps ${aPr.pos} face neutral. Inside, something is boiling. ${aPr.Sub} ${aPr.sub==='they'?'know':'knows'} the truth. The question is whether anyone else does.`,
      ], architect + 'composed');
    } else if (aS.temperament <= 4) {
      reactionText = _pick([
        `${architect}'s jaw clenches. ${aPr.Sub} ${aPr.sub==='they'?'stand':'stands'} up, ${aPr.sub==='they'?'walk':'walks'} away from the fire. Everyone notices. The tension is thick enough to cut.`,
        `${architect} slams a pot down and walks into the jungle. The tribe exchanges looks. Something just broke — they're just not sure what yet.`,
      ], architect + 'hothead');
    } else {
      reactionText = _pick([
        `${architect} forces a smile when ${stealer} retells the story. In confessional: "If ${stealer} wants to tell people ${sPr.sub} did that, fine. The jury will know the truth. I hope."`,
        `${architect} rolls ${aPr.pos} eyes and looks away. ${aPr.Sub} ${aPr.sub==='they'?'don\'t':'doesn\'t'} trust ${aPr.ref} to respond without losing it. Not yet. But soon.`,
      ], architect + 'mid');
    }

    // Push camp event
    const _campKey = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(architect))?.name || 'merge');
    if (ep.campEvents?.[_campKey]) {
      const phase = ep.campEvents[_campKey].pre ? 'pre' : null;
      if (phase) {
        ep.campEvents[_campKey].pre.push({
          type: 'stolenCredit',
          players: [stealer, architect],
          text: theftText + ' ' + reactionText,
          badgeText: 'STOLEN CREDIT',
          badgeClass: 'gold',
        });
      }
    }

    // Save to episode history
    if (!ep.stolenCreditEvents) ep.stolenCreditEvents = [];
    ep.stolenCreditEvents.push({ type: 'theft', stealer, architect, ep: currentEp });

    break; // one theft per episode max
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: add checkStolenCredit function — theft + confrontation"
```

---

### Task 3: Wire `checkStolenCredit` into `generateCampEvents`

**Files:**
- Modify: `simulator.html` — `generateCampEvents()` function (line ~13748-13774)

- [ ] **Step 1: Add checkStolenCredit calls**

In the `post` phase block (line ~13752), add AFTER `checkInformationBroker(ep);`:

```js
    // Stolen credit — bold player takes credit for another's big move
    checkStolenCredit(ep);
```

In the `both` phase block (line ~13767), add AFTER `checkInformationBroker(ep);`:

```js
    checkStolenCredit(ep);
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: wire checkStolenCredit into generateCampEvents"
```

---

### Task 4: Add `computeHeat` integration + `stolenCreditEvents` to episode history

**Files:**
- Modify: `simulator.html` — `computeHeat()` function (line ~2919 area)
- Modify: `simulator.html` — episode history push in `simulateEpisode()` 

- [ ] **Step 1: Add heat modifier in computeHeat**

Find `computeHeat`. Search for the existing fan vote heat line:

```js
  if (gs.fanVoteWinner === name || gs.fanVoteEp === (gs.episode || 0) + 1 && gs.advantages?.some(a => a.holder === name && a.fromFanVote)) heat += 0.5;
```

Add right after it:

```js
  // Stolen credit: stealer gets heat after losing confrontation
  if (gs.stolenCreditHeat?.player === name && gs.stolenCreditHeat.ep >= ((gs.episode || 0) + 1) - 1) heat += 0.3;
```

- [ ] **Step 2: Add stolenCreditEvents to episode history push**

Find the `gs.episodeHistory.push({` block in `simulateEpisode()`. Search for `paranoiaSpirals:` in the push block. Add after it:

```js
    stolenCreditEvents: ep.stolenCreditEvents || null,
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: stolen credit heat modifier + episode history field"
```

---

### Task 5: Add VP badge rendering for stolen credit events

**Files:**
- Modify: `simulator.html` — `rpBuildCampTribe()` badge text/class blocks

- [ ] **Step 1: Add badge text entries**

Find the badge text chain in `rpBuildCampTribe`. Search for `evt.type === 'brokerExposed'`. Add nearby (after the broker/legacy/showmance badge text entries):

```js
                     : evt.type === 'stolenCredit'              ? (evt.badgeText || 'STOLEN CREDIT')
                     : evt.type === 'stolenCreditConfrontation' ? (evt.badgeText || 'CONFRONTATION')
```

- [ ] **Step 2: Add badge class entries**

Find the badge class chain. Search for `evt.type === 'brokerExposed'` in the badgeClass section. Add nearby:

```js
                     : evt.type === 'stolenCredit' ? 'gold'
                     : evt.type === 'stolenCreditConfrontation' ? (evt.badgeClass || 'red')
```

- [ ] **Step 3: Add to stratTypes/spotTypes set**

Find `const spotTypes = new Set([` and add `'stolenCredit','stolenCreditConfrontation',` into the array.

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: VP badge rendering for stolen credit events"
```

---

### Task 6: Clear bigMoveEarnersThisEp at episode start + update CLAUDE.md

**Files:**
- Modify: `simulator.html` — `simulateEpisode()` function start
- Modify: `CLAUDE.md` — document new mechanic

- [ ] **Step 1: Clear bigMoveEarnersThisEp at episode start**

The `gs.bigMoveEarnersThisEp` array is populated in `updatePlayerStates` (end of episode) and consumed in `checkStolenCredit` (next episode's camp events). But we need to make sure it's cleared at the start of each episode so it doesn't accumulate across multiple episodes.

Find `function simulateEpisode()`. Near the top, after the `ep` object is created, add:

```js
  // Clear bigMoves tracking from previous episode (consumed by checkStolenCredit in generateCampEvents)
  // Don't clear here — it's consumed and cleared inside checkStolenCredit
```

Actually, `checkStolenCredit` already clears it (`gs.bigMoveEarnersThisEp = [];` after consuming). No additional clearing needed. Skip this step.

- [ ] **Step 2: Update CLAUDE.md**

Add to the simulation core functions list:

```
- `checkStolenCredit()` — bold player steals credit for another's big move (once per game). Confrontation next episode if architect is bold/hothead enough.
```

Add to state section:

```
- `gs.stolenCredit` — `{ stealer, architect, ep, confronted }` — active stolen credit tracking
- `gs.stolenCreditFired` — boolean, once-per-game flag
- `gs.stolenCreditHeat` — `{ player, ep }` — heat boost for stealer after losing confrontation
- `gs.bigMoveEarnersThisEp` — array of player names who earned bigMoves this episode
```

- [ ] **Step 3: Update ideas_probabilistic_moments.txt**

Move `[5] STOLEN CREDIT` from REMAINING to DONE section with implementation summary.

- [ ] **Step 4: Commit**

```bash
git add simulator.html CLAUDE.md DATA_SEASON/ideas_probabilistic_moments.txt
git commit -m "feat: stolen credit documentation + ideas backlog update"
```
