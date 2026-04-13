# Say Uncle Overdrive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul Say Uncle from a flat stat-roll loop into a 4-phase medieval torture game show ("The Dungeon of Misfortune") with spectator pillory, showmance moments, expanded text pools, and themed VP.

**Architecture:** Wrap the existing `simulateSayUncle` round loop in a phase structure. Add pillory tracking, spectator reactions, host commentary, and showmance moments between phases. Rebuild the 3 VP screens with dungeon theme. Expand all text pools. Core mechanics (survival roll, targeting, backfire, scoring) unchanged.

**Tech Stack:** Vanilla JS, single file (`simulator.html`)

**Spec:** `docs/superpowers/specs/2026-04-13-say-uncle-overdrive-design.md`

---

### Task 1: Expand text pools (reaction text)

**Files:**
- Modify: `simulator.html:24094-24151` (reaction functions inside `simulateSayUncle`)

Expand existing text pools without changing any logic. This is pure text addition.

- [ ] **Step 1: Expand `_surviveReaction` pass pool from 4 to 8 lines**

Find the pass reaction return (lines 24108-24113):
```javascript
    return _rp([
      `Teeth clenched. Eyes shut. Ten seconds never felt so long. But ${player} made it.`,
      `${player} was shaking by the end. But ${pr.sub} made it. Barely.`,
      `${player} survived ${dareTitle}. Not gracefully. But survival doesn't need to be graceful.`,
      `${player} hung on. The timer hit ten. ${pr.Sub} let out a breath ${pr.sub} didn't know ${pr.sub} ${pr.sub === 'they' ? 'were' : 'was'} holding.`,
    ]);
```

Replace with:
```javascript
    return _rp([
      `Teeth clenched. Eyes shut. Ten seconds never felt so long. But ${player} made it.`,
      `${player} was shaking by the end. But ${pr.sub} made it. Barely.`,
      `${player} survived ${dareTitle}. Not gracefully. But survival doesn't need to be graceful.`,
      `${player} hung on. The timer hit ten. ${pr.Sub} let out a breath ${pr.sub} didn't know ${pr.sub} ${pr.sub === 'they' ? 'were' : 'was'} holding.`,
      `${player} gripped the edges of the torture station until ${pr.pos} knuckles went white. The timer hit zero. ${pr.Sub} let go.`,
      `${player}'s whole body was rigid. The countdown finished. ${pr.Sub} survived, but it cost something.`,
      `${player} made a sound ${pr.sub} probably didn't mean to make. But ${pr.sub} made it through. That's what counts.`,
      `${player} didn't quit. Not because it was easy — because ${pr.sub} refused to give anyone the satisfaction of watching ${pr.obj} break.`,
    ]);
```

- [ ] **Step 2: Expand `_surviveReaction` dominant pool from 3+3 to 6+4 archetype lines**

Find the dominant reaction (lines 24098-24106):
```javascript
      const r = [
        `${player} didn't flinch. Didn't blink. Looked at the host and said "next."`,
        `${player} took it like it was nothing. The tribe is watching. ${pr.Sub} ${pr.sub === 'they' ? 'know' : 'knows'} they're watching.`,
        `${player} finished ${dareTitle} with a smirk. That wasn't a challenge. That was a warm-up.`,
      ];
      if (arch === 'villain' || arch === 'mastermind') r.push(`${player} smiled through the pain. That's the scary part.`);
      if (arch === 'hero') r.push(`${player} gritted ${pr.pos} teeth and powered through. Not a sound. The tribe respects that.`);
      if (arch === 'chaos-agent') r.push(`${player} laughed through ${dareTitle}. Actually laughed. The tribe doesn't know what to do with that.`);
```

Replace with:
```javascript
      const r = [
        `${player} didn't flinch. Didn't blink. Looked at the host and said "next."`,
        `${player} took it like it was nothing. The tribe is watching. ${pr.Sub} ${pr.sub === 'they' ? 'know' : 'knows'} they're watching.`,
        `${player} finished ${dareTitle} with a smirk. That wasn't a challenge. That was a warm-up.`,
        `${player} looked bored. Actually bored. The host had to check if ${dareTitle} was working properly.`,
        `${player} stared straight ahead the entire time. Ten seconds. Not a sound. Not a flinch. Nothing.`,
        `${player} breathed through it like ${pr.sub} ${pr.sub === 'they' ? 'were' : 'was'} meditating. The dungeon has a new favourite.`,
      ];
      if (arch === 'villain' || arch === 'mastermind') r.push(`${player} smiled through the pain. That's the scary part.`, `${player} made eye contact with the rest of the tribe during ${dareTitle}. A message. Received.`);
      if (arch === 'hero') r.push(`${player} gritted ${pr.pos} teeth and powered through. Not a sound. The tribe respects that.`, `${player} took ${dareTitle} like a warrior. The dungeon couldn't break what the game already tested.`);
      if (arch === 'chaos-agent') r.push(`${player} laughed through ${dareTitle}. Actually laughed. The tribe doesn't know what to do with that.`, `${player} started humming during ${dareTitle}. Nobody knows if that's bravery or insanity.`);
      if (arch === 'underdog' || arch === 'floater') r.push(`Nobody expected ${player} to take that. ${pr.Sub} did. The tribe is recalibrating.`);
```

- [ ] **Step 3: Expand `_failReaction` from 5 to 8 lines**

Find (lines 24117-24125):
```javascript
  const _failReaction = (player, dareTitle) => {
    const pr = pronouns(player);
    return _rp([
      `${player} tapped out at 8 seconds. So close. Not close enough.`,
      `${player} said uncle before the timer hit 5. The body quit before the brain did.`,
      `${player} tried. You could see ${pr.obj} trying. But ${dareTitle} was too much.`,
      `${player} couldn't last. ${pr.Sub} ${pr.sub === 'they' ? 'step' : 'steps'} down. The stocks await.`,
      `${player} lasted 3 seconds. ${pr.Sub} ${pr.sub === 'they' ? 'look' : 'looks'} at the ground. "I can't."`,
    ]);
  };
```

Replace with:
```javascript
  const _failReaction = (player, dareTitle) => {
    const pr = pronouns(player);
    return _rp([
      `${player} tapped out at 8 seconds. So close. Not close enough.`,
      `${player} said uncle before the timer hit 5. The body quit before the brain did.`,
      `${player} tried. You could see ${pr.obj} trying. But ${dareTitle} was too much.`,
      `${player} couldn't last. ${pr.Sub} ${pr.sub === 'they' ? 'step' : 'steps'} down. The pillory awaits.`,
      `${player} lasted 3 seconds. ${pr.Sub} ${pr.sub === 'they' ? 'look' : 'looks'} at the ground. "I can't."`,
      `${player} screamed. Not the dramatic kind — the involuntary kind. ${dareTitle} won.`,
      `${player} yanked free of the restraints before the host could finish counting. Some dares find your limit fast.`,
      `"Uncle. Uncle. UNCLE." ${player} said it three times before anyone could stop the machine. ${pr.Sub} ${pr.sub === 'they' ? 'are' : 'is'} done.`,
    ]);
  };
```

- [ ] **Step 4: Expand `_pickReaction` confident pool from 3 to 5, hesitant from 3 to 5**

Find (lines 24127-24139):
```javascript
  const _pickReaction = (picker, victim, confident) => {
    const pr = pronouns(picker);
    if (confident) return _rp([
      `${picker} points at ${victim}. "Your turn." No hesitation.`,
      `${picker} picks ${victim} without blinking. ${pr.Sub} ${pr.sub === 'they' ? 'know' : 'knows'} ${victim}'s weakness.`,
      `"${victim}." ${picker} says the name like ${pr.sub} ${pr.sub === 'they' ? 'have' : 'has'} been waiting to say it.`,
    ]);
    return _rp([
      `${picker} picks ${victim}. Bold move. Could backfire.`,
      `${picker} hesitates, then points at ${victim}. Not the safest choice.`,
      `"${victim}." ${picker} doesn't sound sure. The tribe notices.`,
    ]);
  };
```

Replace with:
```javascript
  const _pickReaction = (picker, victim, confident) => {
    const pr = pronouns(picker);
    if (confident) return _rp([
      `${picker} points at ${victim}. "Your turn." No hesitation.`,
      `${picker} picks ${victim} without blinking. ${pr.Sub} ${pr.sub === 'they' ? 'know' : 'knows'} ${victim}'s weakness.`,
      `"${victim}." ${picker} says the name like ${pr.sub} ${pr.sub === 'they' ? 'have' : 'has'} been waiting to say it.`,
      `${picker} walks straight to the wheel, spins it, then turns and points at ${victim}. Calculated.`,
      `${picker} doesn't even look at anyone else. "Get ${victim} in the chair."`,
    ]);
    return _rp([
      `${picker} picks ${victim}. Bold move. Could backfire.`,
      `${picker} hesitates, then points at ${victim}. Not the safest choice.`,
      `"${victim}." ${picker} doesn't sound sure. The tribe notices.`,
      `${picker} looks around the dungeon. Weighs it. Points at ${victim}. The tribe holds its breath.`,
      `${picker} closes ${pr.pos} eyes for a second before saying the name. "${victim}." ${pr.Sub} ${pr.sub === 'they' ? 'know' : 'knows'} what's at stake.`,
    ]);
  };
```

- [ ] **Step 5: Expand `_backfireReaction` from 3 to 6 and `_calledItReaction` from 3 to 6**

Find (lines 24141-24151):
```javascript
  const _backfireReaction = (picker, victim) => _rp([
    `The look on ${picker}'s face when ${victim} doesn't flinch. That backfire is going to sting longer than the dare.`,
    `${victim} walks out untouched. ${picker} walks to the stocks. The tribe saw everything.`,
    `${picker} picked wrong. ${victim} took it like nothing. Now ${picker}'s out. That's the game.`,
  ]);

  const _calledItReaction = (picker, victim) => _rp([
    `${picker} called it. ${victim} couldn't handle it. The read was right.`,
    `${victim} breaks. ${picker} was counting on that. Smart play.`,
    `${picker} knew. Everybody watching knew. ${victim} wasn't built for that one.`,
  ]);
```

Replace with:
```javascript
  const _backfireReaction = (picker, victim) => _rp([
    `The look on ${picker}'s face when ${victim} doesn't flinch. That backfire is going to sting longer than the dare.`,
    `${victim} walks out untouched. ${picker} walks to the pillory. The tribe saw everything.`,
    `${picker} picked wrong. ${victim} took it like nothing. Now ${picker}'s out. That's the game.`,
    `${picker} gambled on ${victim} breaking. ${victim} didn't. The dungeon has a new prisoner — and it's ${picker}.`,
    `The pillory opens for ${picker}. ${victim} doesn't even look back. The power move became a self-elimination.`,
    `${picker} watches ${victim} step down from the torture station untouched. ${picker} knows what's coming. The walk to the pillory is the longest walk in the dungeon.`,
  ]);

  const _calledItReaction = (picker, victim) => _rp([
    `${picker} called it. ${victim} couldn't handle it. The read was right.`,
    `${victim} breaks. ${picker} was counting on that. Smart play.`,
    `${picker} knew. Everybody watching knew. ${victim} wasn't built for that one.`,
    `${picker} doesn't celebrate. Just nods. The dungeon rewards those who read people.`,
    `${victim} goes to the pillory. ${picker} watches with the expression of someone who did their homework.`,
    `The dungeon claimed another. ${picker} pointed, the wheel turned, and ${victim} folded. Exactly as planned.`,
  ]);
```

- [ ] **Step 6: Commit**

```bash
git add simulator.html
git commit -m "feat(say-uncle): expand all reaction text pools — pass/dominant/fail/pick/backfire/calledIt"
```

---

### Task 2: Add phase structure + host commentary + pillory tracking to simulateSayUncle

**Files:**
- Modify: `simulator.html:24059-24369` (simulateSayUncle function)

This is the core engine restructuring. Wrap the existing round loop in phases, add host lines to rounds, track pillory, generate phase break data. No mechanical changes to survival rolls, targeting, or backfire.

- [ ] **Step 1: Add host commentary text pools and spectator reaction functions**

Insert after the `_calledItReaction` function (after the expanded version from Task 1, around line 24160) and before the `_pickVictim` function:

```javascript
  // ── Host commentary ──
  const _hostPhaseIntro = (phase) => {
    if (phase === 1) return _rp([
      `"Welcome to the Dungeon of Misfortune. The wheel decides your fate. Survive ten seconds — or say uncle."`,
      `"This is the Wheel of Misfortune. Pain, fear, disgust, humiliation — the wheel picks. You endure. Last one standing wins immunity."`,
      `"Step into the dungeon. The wheel is spinning. Your only job? Don't break."`,
    ]);
    if (phase === 2) return _rp([
      `"You survived the wheel. Now it gets personal. Dominate your dare — you pick who suffers next."`,
      `"Phase two. The Gauntlet. The wheel still turns, but now the players choose who faces it."`,
      `"The dungeon is thinning the herd. But now the herd gets to fight back."`,
    ]);
    if (phase === 3) return _rp([
      `"Three remain. The dares don't get easier. The wheel doesn't care about your endurance."`,
      `"The Rack. The final stage before the final sentence. Every dare could be your last."`,
      `"Look at the pillory. That's where everyone else ended up. Three of you are still standing. Not for long."`,
    ]);
    return _rp([
      `"Two left. One dare. One winner. This is the Final Sentence."`,
      `"The dungeon comes down to this. One dare between immunity and the pillory."`,
      `"Two players. One torture. The Wheel of Misfortune decides who leaves the dungeon standing."`,
    ]);
  };

  const _hostWheelSpin = (category) => {
    const catName = { pain:'PAIN', fear:'FEAR', gross:'GROSS', humiliation:'HUMILIATION' }[category] || category.toUpperCase();
    return _rp([
      `The wheel turns... slows... clicks past one category after another... and lands on ${catName}.`,
      `The Wheel of Misfortune spins. The colours blur. It stops. ${catName}.`,
      `Spin. Click. Click. Click... ${catName}. The dungeon has spoken.`,
      `The wheel doesn't care about your feelings. It landed on ${catName}.`,
    ]);
  };

  const _hostTransition = (fromPhase) => {
    if (fromPhase === 1) return _rp([
      `"The wheel tested you. Now it's time to test each other. Welcome to the Gauntlet."`,
      `"Phase one is done. Some of you looked comfortable. Some of you didn't. Now we find out who can use that information."`,
      `"The easy part is over. From here on out, the dungeon gets personal."`,
    ]);
    if (fromPhase === 2) return _rp([
      `"Look around. Most of you are in the pillory. The few who remain — this is the Rack."`,
      `"The Gauntlet is done. What's left is the Rack. Harder dares. Higher stakes. Fewer friends."`,
      `"Three left. The dungeon is almost finished with you. Almost."`,
    ]);
    return _rp([
      `"It comes down to two. The dungeon has one more dare. One of you walks out. One of you joins the pillory."`,
      `"Final Sentence. The wheel decides the dare. Fate decides the rest."`,
      `"Two players. One torture station. The last dare of the Dungeon of Misfortune."`,
    ]);
  };

  // ── Spectator reactions from the pillory ──
  const _spectatorReaction = (spectator, activePlayer, result) => {
    const bond = getBond(spectator, activePlayer);
    const prS = pronouns(spectator);
    if (bond >= 3) {
      // Ally — encouraging
      if (result === 'fail') return _rp([
        `In the pillory, ${spectator} winces. ${prS.Sub} wanted ${activePlayer} to make it.`,
        `${spectator} looks away from the pillory. ${prS.Sub} can't watch ${activePlayer} go down.`,
      ]);
      if (result === 'dominant') return _rp([
        `${spectator} grins from the pillory. That's ${prS.pos} person.`,
        `From the pillory, ${spectator} nods. ${activePlayer} is still in it.`,
      ]);
      return _rp([
        `${spectator} exhales from the pillory. ${activePlayer} survived. For now.`,
        `In the pillory, ${spectator} mouths "come on" as ${activePlayer} hangs on.`,
      ]);
    }
    if (bond <= -3) {
      // Enemy — taunting
      if (result === 'fail') return _rp([
        `${spectator} smirks from the pillory. ${activePlayer} finally broke.`,
        `From the pillory, ${spectator} doesn't even try to hide the satisfaction.`,
      ]);
      if (result === 'dominant') return _rp([
        `${spectator}'s smirk fades in the pillory. ${activePlayer} isn't going anywhere.`,
        `${spectator} shifts uncomfortably in the pillory. ${activePlayer} just made a statement.`,
      ]);
      return _rp([
        `${spectator} rolls ${prS.pos} eyes from the pillory. ${activePlayer} barely made it.`,
        `From the pillory, ${spectator} watches ${activePlayer} survive with visible annoyance.`,
      ]);
    }
    // Neutral
    if (result === 'fail') return _rp([
      `${spectator} watches from the pillory as ${activePlayer} taps out.`,
      `From the pillory, ${spectator} just shakes ${prS.pos} head.`,
    ]);
    return _rp([
      `${spectator} watches silently from the pillory.`,
      `From the pillory, ${spectator} raises an eyebrow but says nothing.`,
    ]);
  };

  // ── Showmance spectator reactions ──
  const _showmanceSpectatorReaction = (spectator, activePlayer, result) => {
    const prS = pronouns(spectator);
    if (result === 'fail') return _rp([
      `${spectator} grips the pillory frame. Watching ${activePlayer} break is worse than any dare ${prS.sub} faced.`,
      `${spectator} can't look. ${prS.Sub} turns away in the pillory as ${activePlayer} says uncle.`,
      `"No..." ${spectator} whispers from the pillory. ${activePlayer} is done.`,
    ]);
    if (result === 'dominant') return _rp([
      `${spectator}'s face in the pillory — pure pride. ${activePlayer} didn't just survive. ${activePlayer} dominated.`,
      `From the pillory, ${spectator} beams. That's the person ${prS.sub} ${prS.sub === 'they' ? 'chose' : 'chose'}. Still fighting.`,
    ]);
    return _rp([
      `${spectator} holds ${prS.pos} breath in the pillory the entire ten seconds. ${activePlayer} made it. ${spectator} breathes again.`,
      `From the pillory, ${spectator}'s eyes don't leave ${activePlayer} for a single second of the dare.`,
    ]);
  };
```

- [ ] **Step 2: Add phase tracking variables and modify the main round loop**

Find the section starting with `// MAIN ROUND LOOP` (around line 24190-24197):
```javascript
  // ══════════════════════════════════════════════════════════════
  // MAIN ROUND LOOP
  // ══════════════════════════════════════════════════════════════
  let nextPlayer = null;
  let nextCategory = null;
  let pickedBy = null;
  let _rotation = [...remaining].sort(() => Math.random() - 0.5);
```

Replace with:
```javascript
  // ══════════════════════════════════════════════════════════════
  // MAIN ROUND LOOP — THE DUNGEON OF MISFORTUNE
  // ══════════════════════════════════════════════════════════════
  let nextPlayer = null;
  let nextCategory = null;
  let pickedBy = null;
  let _rotation = [...remaining].sort(() => Math.random() - 0.5);

  // Phase tracking
  let currentPhase = 1;
  const startingCount = remaining.length;
  const phase3Threshold = Math.max(3, Math.floor(startingCount * 0.3));
  const phases = [];
  const phaseBreaks = [];
  const pillory = [];
  let phaseStartRound = 1;
  let phaseStartPlayers = [...remaining];

  // Phase 1: one full rotation (everyone faces one dare)
  let phase1RotationComplete = false;
  const phase1Seen = new Set();
```

- [ ] **Step 3: Add phase transition logic inside the round loop**

Inside the `for` loop, right after `if (remaining.length <= 1) break;` (around line 24199), add phase transition checks:

Find:
```javascript
  for (let roundNum = 1; roundNum <= maxRounds; roundNum++) {
    if (remaining.length <= 1) break;

    // ── Final two ──
    if (remaining.length === 2) {
```

Replace with:
```javascript
  for (let roundNum = 1; roundNum <= maxRounds; roundNum++) {
    if (remaining.length <= 1) break;

    // ── Phase transition checks ──
    const _needsPhaseTransition = (
      (currentPhase === 1 && phase1RotationComplete) ||
      (currentPhase === 2 && remaining.length <= phase3Threshold) ||
      (currentPhase === 3 && remaining.length <= 2)
    );
    if (_needsPhaseTransition) {
      // Record completed phase
      phases.push({
        phase: currentPhase,
        name: ['The Wheel', 'The Gauntlet', 'The Rack', 'The Final Sentence'][currentPhase - 1],
        startRound: phaseStartRound,
        endRound: roundNum - 1,
        startingPlayers: [...phaseStartPlayers],
        eliminatedInPhase: phaseStartPlayers.filter(p => !remaining.includes(p)),
      });

      // Generate phase break content
      const _pbSpectatorReactions = [];
      if (pillory.length) {
        // Pick 1-2 spectators for reactions (prefer strong bonds)
        const _pbCandidates = pillory.map(p => ({
          name: p.name,
          maxBond: Math.max(...remaining.map(r => Math.abs(getBond(p.name, r)))),
        })).sort((a, b) => b.maxBond - a.maxBond);
        const _pbCount = Math.min(2, _pbCandidates.length);
        for (let _pi = 0; _pi < _pbCount; _pi++) {
          const spec = _pbCandidates[_pi];
          const aboutPlayer = remaining.reduce((best, r) => Math.abs(getBond(spec.name, r)) > Math.abs(getBond(spec.name, best)) ? r : best, remaining[0]);
          _pbSpectatorReactions.push({
            spectator: spec.name,
            about: aboutPlayer,
            text: _spectatorReaction(spec.name, aboutPlayer, 'pass'),
          });
        }
      }

      // Showmance check at phase break
      let _pbShowmanceMoment = null;
      let _pbRomanceSpark = null;
      if (currentPhase >= 2) {
        // Check for showmance moments — partner in pillory watching partner still competing
        const _pbActiveShowmances = (gs.showmances || []).filter(sh =>
          sh.phase !== 'broken-up' && sh.players.some(p => remaining.includes(p)) && sh.players.some(p => pillory.some(pi => pi.name === p))
        );
        if (_pbActiveShowmances.length) {
          const sh = _pbActiveShowmances[0];
          const inPillory = sh.players.find(p => pillory.some(pi => pi.name === p));
          const stillIn = sh.players.find(p => remaining.includes(p));
          if (inPillory && stillIn) {
            const prP = pronouns(inPillory);
            _pbShowmanceMoment = {
              players: [inPillory, stillIn],
              text: _rp([
                `Between rounds, ${inPillory} catches ${stillIn}'s eye from the pillory. No words. Just a look that says everything.`,
                `${inPillory} can't help ${stillIn} from the pillory. But ${prP.sub} can watch. And ${prP.sub} ${prP.sub === 'they' ? 'haven\'t' : 'hasn\'t'} looked away once.`,
                `${stillIn} glances at ${inPillory} in the pillory before the next dare. A tiny nod. Keep going.`,
              ]),
            };
          }
        }

        // Romance spark check — two players bonding through shared suffering
        if (remaining.length >= 2) {
          const _sparkPairs = [];
          for (let _si = 0; _si < remaining.length; _si++) {
            for (let _sj = _si + 1; _sj < remaining.length; _sj++) {
              _sparkPairs.push([remaining[_si], remaining[_sj]]);
            }
          }
          for (const [a, b] of _sparkPairs) {
            if (_challengeRomanceSpark(a, b, ep, 'sayUnclePhase' + currentPhase, phases, ep.chalMemberScores || {}, 'dungeon endurance')) {
              _pbRomanceSpark = { players: [a, b] };
              break;
            }
          }
        }
      }

      phaseBreaks.push({
        afterPhase: currentPhase,
        hostLine: _hostTransition(currentPhase),
        spectatorReactions: _pbSpectatorReactions,
        showmanceMoment: _pbShowmanceMoment,
        romanceSpark: _pbRomanceSpark,
      });

      currentPhase++;
      phaseStartRound = roundNum;
      phaseStartPlayers = [...remaining];
    }

    // ── Final two ──
    if (remaining.length === 2) {
```

- [ ] **Step 4: Add host line and spectator reactions to each round object**

In the round object construction (there are two places: final-two round around line 24209 and normal round around line 24257), add `phase`, `hostLine`, and `spectatorReactions` fields.

For the **final-two round**, find:
```javascript
      const round = {
        roundNum, player: finalist, pickedBy, pickerCategory: nextCategory,
        dareCategory: category, dareTitle: dareObj.title, dareText: dareObj.desc,
        result, isFinal: true,
        reaction: result !== 'fail' ? _surviveReaction(finalist, result, dareObj.title) : _failReaction(finalist, dareObj.title),
        backfire: null, calledIt: null, pick: null,
      };
```

Replace with:
```javascript
      const round = {
        roundNum, player: finalist, pickedBy, pickerCategory: nextCategory,
        dareCategory: category, dareTitle: dareObj.title, dareText: dareObj.desc,
        result, isFinal: true, phase: currentPhase,
        hostLine: _hostWheelSpin(category),
        reaction: result !== 'fail' ? _surviveReaction(finalist, result, dareObj.title) : _failReaction(finalist, dareObj.title),
        backfire: null, calledIt: null, pick: null,
        spectatorReactions: pillory.slice(0, 2).map(p => {
          const isShowmance = (gs.showmances || []).some(sh => sh.phase !== 'broken-up' && sh.players.includes(p.name) && sh.players.includes(finalist));
          return {
            spectator: p.name, about: finalist,
            text: isShowmance ? _showmanceSpectatorReaction(p.name, finalist, result) : _spectatorReaction(p.name, finalist, result),
          };
        }),
      };
```

For the **normal round**, find:
```javascript
    const round = {
      roundNum, player, pickedBy: _pickedBy, pickerCategory: _pickedBy ? category : null,
      dareCategory: category, dareTitle: dareObj.title, dareText: dareObj.desc,
      result, isFinal: false,
      reaction: result !== 'fail' ? _surviveReaction(player, result, dareObj.title) : _failReaction(player, dareObj.title),
      backfire: null, calledIt: null, pick: null,
    };
```

Replace with:
```javascript
    const _roundSpectators = currentPhase >= 3 ? pillory.slice(0, 2).map(p => {
      const isShowmance = (gs.showmances || []).some(sh => sh.phase !== 'broken-up' && sh.players.includes(p.name) && sh.players.includes(player));
      return {
        spectator: p.name, about: player,
        text: isShowmance ? _showmanceSpectatorReaction(p.name, player, result) : _spectatorReaction(p.name, player, result),
      };
    }) : [];

    const round = {
      roundNum, player, pickedBy: _pickedBy, pickerCategory: _pickedBy ? category : null,
      dareCategory: category, dareTitle: dareObj.title, dareText: dareObj.desc,
      result, isFinal: false, phase: currentPhase,
      hostLine: _hostWheelSpin(category),
      reaction: result !== 'fail' ? _surviveReaction(player, result, dareObj.title) : _failReaction(player, dareObj.title),
      backfire: null, calledIt: null, pick: null,
      spectatorReactions: _roundSpectators,
    };
```

- [ ] **Step 5: Track pillory entries and Phase 1 rotation**

Wherever a player is eliminated (3 places in the round loop), add them to the pillory. Also track Phase 1 rotation completion.

After each `eliminated.push(playerName)` call in the round loop, add a pillory push. There are 4 elimination points:

1. **Final-two fail** (finalist eliminated): after `eliminated.push(finalist);` add:
```javascript
        pillory.push({ name: finalist, eliminatedInPhase: currentPhase, eliminatedInRound: roundNum, wasBackfire: false });
```

2. **Final-two other** (other player eliminated when finalist passes): after `eliminated.push(other);` add:
```javascript
        pillory.push({ name: other, eliminatedInPhase: currentPhase, eliminatedInRound: roundNum, wasBackfire: false });
```

3. **Normal fail**: after `eliminated.push(player);` (in the `result === 'fail'` branch) add:
```javascript
      pillory.push({ name: player, eliminatedInPhase: currentPhase, eliminatedInRound: roundNum, wasBackfire: false });
```

4. **Backfire eliminations** (2 places — dominant backfire and pass backfire): after each `eliminated.push(_pickedBy);` add:
```javascript
        pillory.push({ name: _pickedBy, eliminatedInPhase: currentPhase, eliminatedInRound: roundNum, wasBackfire: true });
```

For Phase 1 rotation tracking, after the normal round is pushed to `rounds` (after `rounds.push(round);` at the end of the normal-round section), add:
```javascript
    // Phase 1 rotation tracking
    if (currentPhase === 1) {
      phase1Seen.add(player);
      if (phase1Seen.size >= startingCount || remaining.every(p => phase1Seen.has(p))) {
        phase1RotationComplete = true;
      }
    }
```

- [ ] **Step 6: Record final phase and store new data on ep.sayUncle**

After the round loop ends (after `if (!immunityWinner && remaining.length) { immunityWinner = remaining[0]; }`), add:

Find:
```javascript
  if (!immunityWinner && remaining.length) {
    immunityWinner = remaining[0];
  }

  const placements = [immunityWinner, ...eliminated.reverse()].filter(Boolean);
```

Replace with:
```javascript
  if (!immunityWinner && remaining.length) {
    immunityWinner = remaining[0];
  }

  // Record final phase
  phases.push({
    phase: currentPhase,
    name: ['The Wheel', 'The Gauntlet', 'The Rack', 'The Final Sentence'][currentPhase - 1],
    startRound: phaseStartRound,
    endRound: rounds.length,
    startingPlayers: [...phaseStartPlayers],
    eliminatedInPhase: phaseStartPlayers.filter(p => !remaining.includes(p) && p !== immunityWinner),
  });

  const placements = [immunityWinner, ...eliminated.reverse()].filter(Boolean);
```

Then update the `ep.sayUncle` assignment. Find:
```javascript
  ep.sayUncle = {
    rounds, placements, backfires,
    eliminated: [...eliminated].reverse(),
    immunityWinner,
    playerCount: activePlayers.length,
  };
```

Replace with:
```javascript
  ep.sayUncle = {
    rounds, placements, backfires,
    eliminated: [...eliminated].reverse(),
    immunityWinner,
    playerCount: activePlayers.length,
    phases, phaseBreaks, pillory,
  };
```

- [ ] **Step 7: Update camp event text to use dungeon theme**

Find the camp events section (around line 24339-24366). Update the text to reference the dungeon:

Find:
```javascript
  if (immunityWinner) {
    ep.campEvents[campKey].post.push({
      type: 'sayUncleWinner', players: [immunityWinner],
      text: `${immunityWinner} outlasted everyone in Say Uncle. That's immunity.`,
      badgeText: 'LAST ONE STANDING', badgeClass: 'gold'
    });
  }
```

Replace with:
```javascript
  if (immunityWinner) {
    ep.campEvents[campKey].post.push({
      type: 'sayUncleWinner', players: [immunityWinner],
      text: `${immunityWinner} walked out of the Dungeon of Misfortune standing. Everyone else is in the pillory. That's immunity.`,
      badgeText: 'LAST ONE STANDING', badgeClass: 'gold'
    });
  }
```

Find:
```javascript
  backfires.forEach(bf => {
    ep.campEvents[campKey].post.push({
      type: 'sayUncleBackfire', players: [bf.picker, bf.victim],
      text: `${bf.picker} picked ${bf.victim} — and it backfired. ${bf.victim} passed. ${bf.picker} is out.`,
      badgeText: 'BACKFIRE', badgeClass: 'red'
    });
  });
```

Replace with:
```javascript
  backfires.forEach(bf => {
    ep.campEvents[campKey].post.push({
      type: 'sayUncleBackfire', players: [bf.picker, bf.victim],
      text: `${bf.picker} picked ${bf.victim} in the dungeon — and it backfired. ${bf.victim} passed. ${bf.picker} walked to the pillory.`,
      badgeText: 'BACKFIRE', badgeClass: 'red'
    });
  });
```

Find:
```javascript
  rounds.filter(r => r.result === 'dominant' && !r.isFinal).forEach(r => {
    ep.campEvents[campKey].post.push({
      type: 'sayUncleDominated', players: [r.player],
      text: `${r.player} dominated ${r.dareTitle}. Didn't flinch.`,
      badgeText: 'DIDN\'T FLINCH', badgeClass: 'gold'
    });
  });
```

Replace with:
```javascript
  rounds.filter(r => r.result === 'dominant' && !r.isFinal).forEach(r => {
    ep.campEvents[campKey].post.push({
      type: 'sayUncleDominated', players: [r.player],
      text: `${r.player} dominated ${r.dareTitle} in the Dungeon of Misfortune. Didn't flinch.`,
      badgeText: 'DIDN\'T FLINCH', badgeClass: 'gold'
    });
  });
```

- [ ] **Step 8: Commit**

```bash
git add simulator.html
git commit -m "feat(say-uncle): 4-phase structure, host commentary, pillory tracking, spectator reactions, showmance moments"
```

---

### Task 3: Rebuild VP Screen 1 — The Dungeon (announcement)

**Files:**
- Modify: `simulator.html:71198-71242` (rpBuildSayUncleAnnouncement)

Rebuild with dungeon theme, executioner-showman host, wheel graphic, parchment-styled rules.

- [ ] **Step 1: Replace the entire `rpBuildSayUncleAnnouncement` function**

Find lines 71198-71242 (the entire function from `function rpBuildSayUncleAnnouncement(ep) {` to its closing `}`). Replace with:

```javascript
function rpBuildSayUncleAnnouncement(ep) {
  const su = ep.sayUncle;
  if (!su) return '';
  const prevEp = (gs.episodeHistory || []).filter(h => h.num < ep.num).slice(-1)[0];
  const prevSnap = prevEp?.gsSnapshot || {};
  const snap = ep.gsSnapshot || {};
  const _tm = ep.tribesAtStart?.flatMap(t => t.members);
  const activePlayers = (_tm?.length ? _tm : null) || prevSnap.activePlayers || snap.activePlayers || [];

  const _hostQuotes = [
    `Welcome to the Dungeon of Misfortune. The wheel decides your fate. Survive ten seconds — or say uncle. Last one standing gets immunity. But dominate your dare, and you become the executioner. Choose your next victim wisely — because if they survive, YOU go to the pillory.`,
    `This is the Wheel of Misfortune. Four categories. Four flavours of suffering. Pain. Fear. Disgust. Humiliation. The wheel picks your poison. Your job is to endure it. Ten seconds. That's all. But ten seconds in this dungeon can feel like a lifetime.`,
    `The dungeon doesn't care about your alliances. Doesn't care about your strategy. In here, it's just you and the wheel. Survive, and you move on. Dominate, and you get to pick who goes next. But pick wrong — and the dungeon swallows you instead.`,
  ];
  const _hostQuote = _hostQuotes[Math.floor(Math.abs((ep.num || 1) * 23) % _hostQuotes.length)];

  // Wheel graphic — 4 colored quadrants
  const _wheelSvg = `<div style="position:relative;width:120px;height:120px;margin:0 auto 16px">
    <svg viewBox="0 0 120 120" style="width:100%;height:100%;filter:drop-shadow(0 0 12px rgba(232,160,53,0.3))">
      <circle cx="60" cy="60" r="56" fill="none" stroke="#e8a035" stroke-width="2"/>
      <path d="M60,4 A56,56 0 0,1 116,60 L60,60 Z" fill="rgba(218,54,51,0.25)" stroke="#da3633" stroke-width="1"/>
      <path d="M116,60 A56,56 0 0,1 60,116 L60,60 Z" fill="rgba(137,87,229,0.25)" stroke="#8957e5" stroke-width="1"/>
      <path d="M60,116 A56,56 0 0,1 4,60 L60,60 Z" fill="rgba(63,185,80,0.25)" stroke="#3fb950" stroke-width="1"/>
      <path d="M4,60 A56,56 0 0,1 60,4 L60,60 Z" fill="rgba(219,97,162,0.25)" stroke="#db61a2" stroke-width="1"/>
      <circle cx="60" cy="60" r="8" fill="#e8a035"/>
    </svg>
    <div style="position:absolute;top:15px;right:18px;font-size:8px;font-weight:700;color:#da3633">PAIN</div>
    <div style="position:absolute;bottom:15px;right:18px;font-size:8px;font-weight:700;color:#8957e5">FEAR</div>
    <div style="position:absolute;bottom:15px;left:18px;font-size:8px;font-weight:700;color:#3fb950">GROSS</div>
    <div style="position:absolute;top:15px;left:12px;font-size:8px;font-weight:700;color:#db61a2">HUMIL.</div>
  </div>`;

  let html = `<div class="rp-page" style="background:linear-gradient(180deg,#1a1a2e 0%,#16213e 100%)">
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:4px;text-align:center;color:#e8a035;text-shadow:0 0 20px rgba(232,160,53,0.4),0 0 40px rgba(232,160,53,0.15);margin-bottom:2px;animation:scrollDrop 0.5s var(--ease-broadcast) both">THE DUNGEON OF MISFORTUNE</div>
    <div style="font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#8b6914;text-align:center;margin-bottom:20px">Torture Endurance Challenge</div>

    ${_wheelSvg}

    <div style="font-size:12px;color:#cdd6f4;text-align:center;margin-bottom:24px;line-height:1.7;max-width:460px;margin-left:auto;margin-right:auto;font-style:italic;border-left:3px solid #e8a035;padding-left:16px;text-align:left">"${_hostQuote}"</div>

    <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-bottom:24px;max-width:520px;margin-left:auto;margin-right:auto">
      <div style="flex:1;min-width:200px;background:rgba(232,160,53,0.06);border:1px solid rgba(232,160,53,0.15);border-radius:8px;padding:14px;text-align:left">
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#e8a035;margin-bottom:10px">THE RULES OF THE DUNGEON</div>
        <div style="font-size:11px;color:#8b949e;line-height:1.7">
          <div style="margin-bottom:4px"><span style="color:#3fb950;font-weight:700">Survive</span> 10 seconds \u2014 move on</div>
          <div style="margin-bottom:4px"><span style="color:var(--accent-gold);font-weight:700">Dominate</span> \u2014 pick the next victim + category</div>
          <div style="margin-bottom:4px"><span style="color:#da3633;font-weight:700">Victim passes</span> \u2014 YOU go to the pillory</div>
          <div><span style="color:#da3633;font-weight:700">Fail</span> \u2014 straight to the pillory</div>
        </div>
      </div>
      <div style="flex:1;min-width:140px;background:rgba(232,160,53,0.06);border:1px solid rgba(232,160,53,0.15);border-radius:8px;padding:14px;text-align:center">
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#e8a035;margin-bottom:10px">THE STAKES</div>
        <div style="font-size:11px;color:#8b949e;line-height:1.7">
          <div style="margin-bottom:4px">${su.playerCount} players enter</div>
          <div style="margin-bottom:4px">${su.phases?.length || 4} phases</div>
          <div style="margin-bottom:4px">${su.rounds.length} rounds</div>
          <div style="color:var(--accent-gold);font-weight:700">Winner gets immunity</div>
        </div>
      </div>
    </div>

    <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#8b6914;text-align:center;margin-bottom:10px">ENTERING THE DUNGEON</div>
    <div class="rp-portrait-row" style="justify-content:center">${activePlayers.map(name => rpPortrait(name)).join('')}</div>
  </div>`;
  return html;
}
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat(say-uncle): rebuild announcement VP — Dungeon of Misfortune theme with wheel graphic"
```

---

### Task 4: Rebuild VP Screen 2 — The Torture (phase-by-phase rounds)

**Files:**
- Modify: `simulator.html:71244-71366` (rpBuildSayUncleRounds)

Rebuild with phase headers, pillory section, spectator reactions, phase break cards, dungeon theme.

- [ ] **Step 1: Replace the entire `rpBuildSayUncleRounds` function**

Find lines 71244-71366 (from `function rpBuildSayUncleRounds(ep) {` to its closing `}`). Replace with:

```javascript
function rpBuildSayUncleRounds(ep) {
  const su = ep.sayUncle;
  if (!su || !su.rounds?.length) return '';
  const uid = 'su-' + ep.num;
  const _catColor = { 'pain': '#da3633', 'fear': '#8957e5', 'gross': '#3fb950', 'humiliation': '#db61a2' };
  const _catEmoji = { 'pain': '\uD83D\uDD25', 'fear': '\uD83D\uDC80', 'gross': '\uD83E\uDD22', 'humiliation': '\uD83D\uDE48' };

  const revealItems = [];
  let lastPhase = 0;

  // ── Pillory renderer ──
  const _renderPillory = (currentPillory) => {
    if (!currentPillory.length) return '';
    return `<div style="margin-top:12px;padding:10px;background:rgba(139,105,20,0.08);border:1px solid rgba(139,105,20,0.2);border-radius:6px">
      <div style="font-size:8px;font-weight:700;letter-spacing:2px;color:#8b6914;margin-bottom:8px;text-align:center">THE PILLORY</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">${currentPillory.map(p =>
        `<div style="position:relative;opacity:0.7">${rpPortrait(p.name, 'sm', 'elim')}
          <div style="position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);font-size:7px;font-weight:700;color:${p.wasBackfire ? '#da3633' : '#8b6914'};white-space:nowrap">${p.wasBackfire ? 'BACKFIRE' : 'OUT'}</div>
        </div>`
      ).join('')}</div>
    </div>`;
  };

  // ── Build reveal items ──
  su.rounds.forEach((round, roundIdx) => {
    const catColor = _catColor[round.dareCategory] || '#8b949e';
    const catEmoji = _catEmoji[round.dareCategory] || '\uD83C\uDFB2';
    const isFinal = round.isFinal;
    const roundPhase = round.phase || 1;

    // ── Phase header ──
    if (roundPhase !== lastPhase) {
      const phaseName = ['The Wheel', 'The Gauntlet', 'The Rack', 'The Final Sentence'][roundPhase - 1] || 'Phase ' + roundPhase;
      const phaseData = su.phases?.find(p => p.phase === roundPhase);
      const phasePlayerCount = phaseData?.startingPlayers?.length || '?';

      // Phase break card (between phases, not before Phase 1)
      if (roundPhase > 1) {
        const pb = su.phaseBreaks?.find(b => b.afterPhase === roundPhase - 1);
        if (pb) {
          let pbHtml = `<div style="font-size:12px;color:#cdd6f4;font-style:italic;border-left:3px solid #e8a035;padding-left:12px;margin-bottom:10px;line-height:1.6">"${pb.hostLine}"</div>`;
          if (pb.spectatorReactions?.length) {
            pb.spectatorReactions.forEach(sr => {
              pbHtml += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
                <div style="opacity:0.7">${rpPortrait(sr.spectator, 'xs', 'elim')}</div>
                <div style="font-size:11px;color:#8b949e;line-height:1.4">${sr.text}</div>
              </div>`;
            });
          }
          if (pb.showmanceMoment) {
            pbHtml += `<div style="border-top:1px solid rgba(232,160,53,0.15);padding-top:8px;margin-top:8px">
              <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#db61a2;margin-bottom:4px">\u2764\uFE0F MOMENT</div>
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                ${pb.showmanceMoment.players.map(p => rpPortrait(p, 'xs')).join('')}
              </div>
              <div style="font-size:11px;color:#cdd6f4;line-height:1.5">${pb.showmanceMoment.text}</div>
            </div>`;
          }
          // Show pillory state at phase break
          const _pilloryAtBreak = su.pillory?.filter(p => p.eliminatedInPhase < roundPhase) || [];
          if (_pilloryAtBreak.length) pbHtml += _renderPillory(_pilloryAtBreak);

          revealItems.push({ type: 'phase-break', html: `<div style="background:rgba(232,160,53,0.04);border:1px solid rgba(232,160,53,0.12);border-radius:8px;padding:14px;margin-bottom:12px">${pbHtml}</div>` });
        }
      }

      // Phase intro card
      const phaseIntro = su.rounds[roundIdx]?.phase === roundPhase ? '' : '';
      let phaseHtml = `<div style="text-align:center;margin-bottom:8px">
        <div style="font-family:var(--font-display);font-size:18px;letter-spacing:3px;color:#e8a035;text-shadow:0 0 12px rgba(232,160,53,0.3)">${phaseName.toUpperCase()}</div>
        <div style="font-size:10px;color:#8b6914;margin-top:4px">${phasePlayerCount} players remaining</div>
      </div>`;

      // Host phase intro
      const phaseData2 = su.phases?.find(p => p.phase === roundPhase);
      if (roundPhase === 1) {
        // First phase — host intro
        phaseHtml += `<div style="font-size:12px;color:#cdd6f4;font-style:italic;border-left:3px solid #e8a035;padding-left:12px;margin-top:8px;line-height:1.6">"${_rp_hostPhaseIntro(roundPhase, ep)}"</div>`;
      }

      revealItems.push({ type: 'phase-header', html: `<div style="background:rgba(232,160,53,0.06);border:1px solid rgba(232,160,53,0.15);border-radius:8px;padding:14px;margin-bottom:12px">${phaseHtml}</div>` });
      lastPhase = roundPhase;
    }

    // ── Final Two announcement ──
    if (isFinal) {
      const _f2 = su.placements.slice(0, 2);
      revealItems.push({ type: 'final-two', html: `<div style="background:rgba(232,160,53,0.08);border:1px solid rgba(232,160,53,0.2);border-radius:8px;padding:16px;margin-bottom:12px;text-align:center">
        <div style="font-family:var(--font-display);font-size:14px;letter-spacing:2px;color:#e8a035;margin-bottom:12px">THE FINAL SENTENCE</div>
        <div class="rp-portrait-row" style="justify-content:center;gap:20px;margin-bottom:8px">
          ${_f2.map(name => rpPortrait(name)).join('<span style="font-size:20px;color:#e8a035;align-self:center">VS</span>')}
        </div>
        <div style="font-size:11px;color:#8b949e">One more dare. One walks free. One joins the pillory.</div>
      </div>` });
    }

    // ── Round card ──
    let rh = '';
    rh += `<div style="font-size:10px;font-weight:700;color:#8b6914;font-family:var(--font-mono);margin-bottom:6px">${isFinal ? 'FINAL DARE' : 'ROUND ' + round.roundNum}</div>`;

    if (round.pickedBy) {
      rh += `<div style="font-size:11px;font-weight:700;color:#da3633;letter-spacing:0.5px;margin-bottom:6px">\uD83C\uDFAF PICKED BY ${round.pickedBy.toUpperCase()}</div>`;
    }

    // Host wheel spin
    if (round.hostLine) {
      rh += `<div style="font-size:11px;color:#8b949e;font-style:italic;margin-bottom:8px;line-height:1.5">${round.hostLine}</div>`;
    }

    rh += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      ${rpPortrait(round.player, 'sm')}
      <div style="font-size:12px;color:#cdd6f4">${round.player} faces the Wheel of Misfortune\u2026</div>
    </div>
    <div style="background:${catColor}0a;border-left:3px solid ${catColor};padding:8px 12px;margin-bottom:12px;border-radius:0 6px 6px 0">
      <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:${catColor};margin-bottom:4px">${catEmoji} ${round.dareCategory.toUpperCase()}</div>
      <div style="font-size:14px;font-weight:700;color:#cdd6f4;margin-bottom:4px">${round.dareTitle}</div>
      <div style="font-size:12px;color:#8b949e;line-height:1.5">${round.dareText}</div>
    </div>`;

    // Result badge
    if (round.result === 'dominant') {
      rh += `<div style="font-size:11px;font-weight:700;color:var(--accent-gold);letter-spacing:0.5px;margin-bottom:4px">\u2B50 DOMINATED \u2014 DIDN'T FLINCH</div>`;
    } else if (round.result === 'pass') {
      rh += `<div style="font-size:11px;font-weight:700;color:#3fb950;letter-spacing:0.5px;margin-bottom:4px">\u2705 SURVIVED</div>`;
    } else {
      rh += `<div style="font-size:11px;font-weight:700;color:#da3633;letter-spacing:0.5px;margin-bottom:4px">\u274c SAID UNCLE</div>`;
    }

    if (round.reaction) rh += `<div style="font-size:12px;color:#cdd6f4;line-height:1.5;margin-bottom:8px">${round.reaction}</div>`;

    // Spectator reactions (Phase 3+)
    if (round.spectatorReactions?.length) {
      rh += `<div style="border-top:1px solid rgba(139,105,20,0.2);padding-top:8px;margin-top:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#8b6914;margin-bottom:6px">FROM THE PILLORY</div>`;
      round.spectatorReactions.forEach(sr => {
        rh += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          <div style="opacity:0.7">${rpPortrait(sr.spectator, 'xs', 'elim')}</div>
          <div style="font-size:11px;color:#8b949e;line-height:1.4">${sr.text}</div>
        </div>`;
      });
      rh += `</div>`;
    }

    // Backfire
    if (round.backfire) {
      rh += `<div style="border-top:1px solid rgba(218,54,51,0.2);padding-top:8px;margin-top:8px">
        <div style="font-size:11px;font-weight:700;color:#da3633;letter-spacing:1px;margin-bottom:4px">\uD83D\uDCA5 BACKFIRE</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          ${rpPortrait(round.backfire.picker, 'sm', 'elim')}
          <div style="font-size:12px;color:#cdd6f4;line-height:1.5">${round.backfire.reaction}</div>
        </div>
      </div>`;
    }

    // Called it
    if (round.calledIt) {
      rh += `<div style="border-top:1px solid rgba(232,160,53,0.15);padding-top:8px;margin-top:8px">
        <div style="font-size:11px;font-weight:700;color:var(--accent-gold);letter-spacing:1px;margin-bottom:4px">\u2705 CALLED IT</div>
        <div style="font-size:12px;color:#8b949e;line-height:1.5">${round.calledIt.reaction}</div>
      </div>`;
    }

    // Pick next victim
    if (round.pick) {
      rh += `<div style="border-top:1px solid rgba(232,160,53,0.15);padding-top:8px;margin-top:8px">
        <div style="font-size:11px;font-weight:700;color:#e8a035;letter-spacing:1px;margin-bottom:4px">\uD83C\uDFAF PICKS NEXT VICTIM</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          ${rpPortrait(round.player, 'sm')}
          <span style="font-size:14px;color:#e8a035">\u2192</span>
          ${rpPortrait(round.pick.victim, 'sm')}
        </div>
        <div style="font-size:12px;color:#cdd6f4;line-height:1.5;margin-bottom:4px">${round.pick.reaction}</div>
        <div style="font-size:10px;color:#8b949e;font-style:italic">${round.pick.categoryReason}</div>
      </div>`;
    }

    // Final round winner
    if (isFinal && su.immunityWinner) {
      const _winner = su.immunityWinner;
      rh += `<div style="border-top:2px solid var(--accent-gold);padding-top:12px;margin-top:12px;text-align:center">
        <div style="font-family:var(--font-display);font-size:12px;letter-spacing:2px;color:var(--accent-gold);margin-bottom:8px">IMMUNITY WINNER</div>
        ${rpPortrait(_winner, 'md')}
        <div style="font-size:14px;font-weight:700;color:#cdd6f4;margin-top:8px">${_winner}</div>
        <div style="font-size:11px;color:var(--accent-gold)">Last one standing in the Dungeon of Misfortune</div>
      </div>`;
    }

    const cardBorder = round.result === 'fail' ? 'rgba(218,54,51,0.2)' : round.backfire ? 'rgba(218,54,51,0.2)' : round.result === 'dominant' ? 'rgba(232,160,53,0.2)' : isFinal ? 'rgba(232,160,53,0.2)' : 'rgba(139,105,20,0.1)';
    revealItems.push({ type: 'round', html: `<div style="background:rgba(26,26,46,0.6);border:1px solid ${cardBorder};border-radius:8px;padding:14px;margin-bottom:12px">${rh}</div>` });
  });

  // Final pillory state
  if (su.pillory?.length) {
    revealItems.push({ type: 'pillory-final', html: _renderPillory(su.pillory) });
  }

  let html = `<div class="rp-page" style="background:linear-gradient(180deg,#1a1a2e 0%,#16213e 100%)" id="${uid}-page" data-su-revealed="0" data-su-total="${revealItems.length}">
    <div style="font-family:var(--font-display);font-size:22px;letter-spacing:3px;text-align:center;color:#e8a035;text-shadow:0 0 12px rgba(232,160,53,0.3);margin-bottom:4px">THE TORTURE</div>
    <div style="font-size:10px;color:#8b6914;text-align:center;margin-bottom:16px">${su.playerCount} players \u2014 ${su.phases?.length || '?'} phases \u2014 ${su.rounds.length} rounds</div>`;

  revealItems.forEach((item, i) => {
    html += `<div class="${uid}-item" style="display:none" data-idx="${i}">${item.html}</div>`;
  });

  html += `<div style="display:flex;gap:10px;justify-content:center;margin-top:16px;position:sticky;bottom:10px;z-index:5">
    <button class="rp-camp-toggle-btn" style="border-color:#e8a035;color:#e8a035;padding:8px 20px;font-size:12px" onclick="suRevealNext('${uid}')">NEXT \u25B6</button>
    <button class="rp-camp-toggle-btn" style="border-color:#484f58;color:#8b949e;padding:8px 16px;font-size:11px" onclick="suRevealAll('${uid}')">REVEAL ALL</button>
  </div>`;

  html += `</div>`;
  return html;
}
```

- [ ] **Step 2: Add the `_rp_hostPhaseIntro` helper function**

The rounds VP references `_rp_hostPhaseIntro(roundPhase, ep)` for the Phase 1 intro. This needs to be a globally accessible function since it's called from the VP builder (not inside `simulateSayUncle`). Insert just before `rpBuildSayUncleAnnouncement`:

```javascript
// ── Say Uncle VP helpers ──
function _rp_hostPhaseIntro(phase, ep) {
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
  if (phase === 1) return _rp([
    `Welcome to the Dungeon of Misfortune. The wheel decides your fate. Survive ten seconds — or say uncle.`,
    `This is the Wheel of Misfortune. Pain, fear, disgust, humiliation — the wheel picks. You endure. Last one standing wins immunity.`,
    `Step into the dungeon. The wheel is spinning. Your only job? Don't break.`,
  ]);
  if (phase === 2) return _rp([
    `You survived the wheel. Now it gets personal. Dominate your dare — you pick who suffers next.`,
    `Phase two. The Gauntlet. The wheel still turns, but now the players choose who faces it.`,
    `The dungeon is thinning the herd. But now the herd gets to fight back.`,
  ]);
  if (phase === 3) return _rp([
    `Three remain. The dares don't get easier. The wheel doesn't care about your endurance.`,
    `The Rack. The final stage before the final sentence. Every dare could be your last.`,
    `Look at the pillory. That's where everyone else ended up. Only a few are still standing.`,
  ]);
  return _rp([
    `Two left. One dare. One winner. This is the Final Sentence.`,
    `The dungeon comes down to this. One dare between immunity and the pillory.`,
    `Two players. One torture. The Wheel of Misfortune decides who leaves the dungeon standing.`,
  ]);
}
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat(say-uncle): rebuild rounds VP — phase headers, pillory portraits, spectator reactions, dungeon theme"
```

---

### Task 5: Rebuild VP Screen 3 — Immunity + Placements

**Files:**
- Modify: `simulator.html:71368-71397` (rpBuildSayUncleImmunity)

Retheme with dungeon palette, pillory-styled placement list.

- [ ] **Step 1: Replace the entire `rpBuildSayUncleImmunity` function**

Find lines 71368-71397 (from `function rpBuildSayUncleImmunity(ep) {` to its closing `}`). Replace with:

```javascript
function rpBuildSayUncleImmunity(ep) {
  const su = ep.sayUncle;
  if (!su || !su.immunityWinner) return '';
  const winner = su.immunityWinner;
  const p = players.find(x => x.name === winner);
  const arch = p?.archetype || 'player';
  const archLabel = arch.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  let html = `<div class="rp-page" style="background:linear-gradient(180deg,#1a1a2e 0%,#16213e 100%);text-align:center">
    <div style="font-family:var(--font-display);font-size:12px;letter-spacing:3px;color:#e8a035;margin-bottom:20px;text-shadow:0 0 12px rgba(232,160,53,0.3)">IMMUNITY WINNER</div>
    <div style="position:relative;display:inline-block">
      ${rpPortrait(winner, 'lg')}
      <div style="position:absolute;inset:-4px;border:2px solid rgba(232,160,53,0.3);border-radius:50%;box-shadow:0 0 20px rgba(232,160,53,0.15);pointer-events:none"></div>
    </div>
    <div style="font-size:18px;font-weight:700;color:#cdd6f4;margin-top:16px;font-family:var(--font-display)">${winner}</div>
    <div style="font-size:11px;color:#8b949e;margin-top:4px">${archLabel}</div>
    <div style="font-size:12px;color:var(--accent-gold);font-weight:700;letter-spacing:2px;margin-top:8px">LAST ONE STANDING</div>
    <div style="font-size:11px;color:#8b6914;margin-top:4px">Survived the Dungeon of Misfortune</div>
    <div style="width:60px;height:1px;background:rgba(232,160,53,0.3);margin:20px auto"></div>
    <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#8b6914;margin-bottom:12px">PLACEMENT ORDER</div>`;

  su.placements.forEach((name, i) => {
    const isWinner = i === 0;
    const isBackfire = su.backfires.some(bf => bf.picker === name);
    const badge = isWinner ? 'WINNER' : isBackfire ? 'BACKFIRE' : '#' + (i + 1);
    const badgeColor = isWinner ? 'var(--accent-gold)' : isBackfire ? '#da3633' : '#8b6914';
    const pilloryEntry = su.pillory?.find(p => p.name === name);
    const phaseLabel = pilloryEntry ? ['Wheel', 'Gauntlet', 'Rack', 'Final'][pilloryEntry.eliminatedInPhase - 1] || '' : '';
    html += `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;${i > 0 ? 'opacity:0.7' : ''};justify-content:center">
      <span style="font-size:10px;font-weight:700;color:${badgeColor};font-family:var(--font-mono);width:70px;text-align:right;flex-shrink:0">${badge}</span>
      ${rpPortrait(name, 'sm', i > 0 ? 'elim' : '')}
      <span style="font-size:12px;color:#cdd6f4;width:100px;text-align:left">${name}</span>
      ${phaseLabel && i > 0 ? `<span style="font-size:9px;color:#8b6914">${phaseLabel}</span>` : ''}
    </div>`;
  });

  html += `</div>`;
  return html;
}
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat(say-uncle): rebuild immunity VP — dungeon theme, pillory placement badges, phase labels"
```

---

### Task 6: Update text backlog

**Files:**
- Modify: `simulator.html:46988-47009` (_textSayUncle)

Restructure from flat round list to phase-grouped output with host lines, spectator reactions, and showmance moments.

- [ ] **Step 1: Replace the entire `_textSayUncle` function**

Find lines 46988-47009 (from the line containing `const su = ep.sayUncle;` that starts the function body, through the closing `}`). The function starts at `function _textSayUncle(ep, ln, sec) {` on the line before. Replace the full function:

```javascript
function _textSayUncle(ep, ln, sec) {
  const su = ep.sayUncle;
  if (!su) return;
  sec('THE DUNGEON OF MISFORTUNE');
  ln(`${su.playerCount} players. ${su.phases?.length || '?'} phases. ${su.rounds.length} rounds. Torture endurance.`);
  ln('');

  let lastPhase = 0;
  su.rounds.forEach(round => {
    // Phase header
    if (round.phase && round.phase !== lastPhase) {
      if (round.phase > 1) {
        // Phase break content
        const pb = su.phaseBreaks?.find(b => b.afterPhase === round.phase - 1);
        if (pb) {
          ln('');
          if (pb.hostLine) ln(`Host: "${pb.hostLine}"`);
          if (pb.spectatorReactions?.length) {
            pb.spectatorReactions.forEach(sr => ln(`  [Pillory] ${sr.text}`));
          }
          if (pb.showmanceMoment) ln(`  [Moment] ${pb.showmanceMoment.text}`);
        }
      }
      const phaseName = ['THE WHEEL', 'THE GAUNTLET', 'THE RACK', 'THE FINAL SENTENCE'][round.phase - 1] || 'PHASE ' + round.phase;
      ln('');
      ln(`=== ${phaseName} ===`);
      lastPhase = round.phase;
    }

    const picked = round.pickedBy ? ` [PICKED BY ${round.pickedBy}]` : '';
    ln(`Round ${round.roundNum}: ${round.player}${picked} — [${round.dareCategory.toUpperCase()}] ${round.dareTitle}`);
    if (round.hostLine) ln(`  Host: "${round.hostLine}"`);
    ln(`  Result: ${round.result.toUpperCase()}`);
    if (round.reaction) ln(`  ${round.reaction}`);
    if (round.spectatorReactions?.length) {
      round.spectatorReactions.forEach(sr => ln(`  [Pillory] ${sr.text}`));
    }
    if (round.backfire) ln(`  BACKFIRE: ${round.backfire.picker} goes to the pillory`);
    if (round.calledIt) ln(`  CALLED IT: ${round.calledIt.picker} was right`);
    if (round.pick) ln(`  PICKS: ${round.pick.victim} (${round.pick.category})`);
  });
  ln('');
  if (su.backfires.length) {
    ln('BACKFIRES:');
    su.backfires.forEach(bf => ln(`- Round ${bf.round}: ${bf.picker} picked ${bf.victim} — backfired`));
    ln('');
  }
  ln('THE PILLORY (elimination order):');
  su.placements.forEach((name, i) => {
    const pilloryEntry = su.pillory?.find(p => p.name === name);
    const phase = pilloryEntry ? ['Wheel', 'Gauntlet', 'Rack', 'Final'][pilloryEntry.eliminatedInPhase - 1] || '' : '';
    ln(`  ${i + 1}. ${name}${i === 0 ? ' (IMMUNITY)' : ''}${phase ? ' [' + phase + ']' : ''}`);
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat(say-uncle): restructure text backlog with phase grouping, host lines, pillory reactions"
```

---

### Task 7: Update cold open recap + twist catalog description

**Files:**
- Modify: `simulator.html:53510-53517` (cold open recap)
- Modify: `simulator.html:2243` (twist catalog)

- [ ] **Step 1: Update the cold open recap**

Find lines 53510-53517:
```javascript
    if (prevEp.isSayUncle && prevEp.sayUncle) {
      const _suData = prevEp.sayUncle;
      html += `<div class="vp-card gold" style="margin-bottom:10px">
        <div style="font-family:var(--font-body);font-size:11px;font-weight:800;letter-spacing:1px;color:var(--accent-gold);margin-bottom:6px">SAY UNCLE</div>
        <div style="font-size:12px;margin-bottom:4px">${_suData.immunityWinner} won immunity \u2014 last one standing after ${_suData.rounds.length} rounds</div>
        ${_suData.backfires?.length ? `<div style="font-size:11px;color:#da3633">${_suData.backfires.length} backfire${_suData.backfires.length > 1 ? 's' : ''} \u2014 picks that blew up</div>` : ''}
      </div>`;
    }
```

Replace with:
```javascript
    if (prevEp.isSayUncle && prevEp.sayUncle) {
      const _suData = prevEp.sayUncle;
      const _suPhaseCount = _suData.phases?.length || '?';
      html += `<div style="background:rgba(232,160,53,0.06);border:1px solid rgba(232,160,53,0.15);border-radius:8px;padding:10px 14px;margin-bottom:10px">
        <div style="font-family:var(--font-body);font-size:11px;font-weight:800;letter-spacing:1px;color:#e8a035;margin-bottom:6px">THE DUNGEON OF MISFORTUNE</div>
        <div style="font-size:12px;color:#cdd6f4;margin-bottom:4px">${_suData.immunityWinner} survived ${_suPhaseCount} phases and ${_suData.rounds.length} rounds \u2014 last one standing</div>
        ${_suData.backfires?.length ? `<div style="font-size:11px;color:#da3633">${_suData.backfires.length} backfire${_suData.backfires.length > 1 ? 's' : ''} \u2014 picks that sent their owners to the pillory</div>` : ''}
        ${_suData.pillory?.length ? `<div style="font-size:11px;color:#8b6914">${_suData.pillory.length} player${_suData.pillory.length > 1 ? 's' : ''} in the pillory</div>` : ''}
      </div>`;
    }
```

- [ ] **Step 2: Update the twist catalog description**

Find line 2243:
```javascript
  { id:'say-uncle', emoji:'💪', name:'Say Uncle', category:'challenge', phase:'post-merge', desc:'Torture endurance challenge. Survive 10 seconds or you're out. Dominate a dare to pick the next victim — but if they pass, YOU\'RE eliminated instead. Last one standing wins immunity.', engineType:'say-uncle', incompatible:[...] },
```

Read the exact line first before editing — the incompatible array may be long. Only change the `desc` value. Replace the desc string with:
```
'The Dungeon of Misfortune. 4-phase torture endurance: The Wheel, The Gauntlet, The Rack, The Final Sentence. Survive 10 seconds or say uncle. Dominate to pick the next victim — but if they pass, YOU go to the pillory. Last one standing wins immunity.'
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat(say-uncle): dungeon-themed cold open recap + updated catalog description"
```

---

### Task 8: Final integration test

- [ ] **Step 1: Open the simulator in a browser**

Open `simulator.html`. Navigate to Episode Format Designer.

- [ ] **Step 2: Test the UI**

1. Configure a post-merge episode with Say Uncle twist assigned
2. Run the simulation
3. Check the VP screens:
   - Screen 1 (The Dungeon): Verify dungeon theme, wheel graphic, parchment rules, host quote
   - Screen 2 (The Torture): Verify phase headers appear, rounds grouped by phase, phase break cards between phases, pillory portraits accumulate, spectator reactions appear in Phase 3+, showmance moments appear if applicable
   - Screen 3 (Immunity): Verify dungeon-themed placement list with phase labels

- [ ] **Step 3: Test the text backlog**

1. Open the text backlog for the Say Uncle episode
2. Verify phase grouping (=== THE WHEEL ===, === THE GAUNTLET ===, etc.)
3. Verify host lines and spectator reactions appear
4. Verify pillory placement order at the end

- [ ] **Step 4: Test the cold open**

1. Advance to the next episode
2. Check the cold open recap — verify it shows dungeon theme, phase count, pillory count

- [ ] **Step 5: Test edge cases**

1. Small cast (3-4 players): phases may collapse — verify it doesn't crash. With 3 players, Phase 1 (one rotation) immediately transitions to Phase 3 (3 remaining = threshold). Verify gracefully.
2. No backfires: verify pillory section still works (all entries are non-backfire)
3. All fails in Phase 1: verify Phase 2 is skipped if only 2 remain after Phase 1

- [ ] **Step 6: Commit**

```bash
git add simulator.html
git commit -m "test: verify Say Uncle overdrive end-to-end"
```
