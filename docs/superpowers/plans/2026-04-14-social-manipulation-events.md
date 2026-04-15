# Social Manipulation Camp Events — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a standalone social manipulation camp event system (forge notes, spread lies, kiss traps, campaign rallies, whisper campaigns, expose schemers, comfort victims) that fires in any episode based on cast composition.

**Architecture:** All changes in `simulator.html`. New events are generated inside `generateCampEventsForGroup` (~line 35476) alongside existing camp events. Each event type has its own trigger check, mechanic, text pool, and camp event output. The system is completely independent of any specific challenge twist — it fires whenever eligible schemers and viable targets exist.

**Tech Stack:** Vanilla JS, single-file HTML app.

**Key patterns to follow:**
- Camp events: `{ type, players:[], text, consequences, badgeText, badgeClass }`
- `pStats(name)` for stats, `pronouns(name)` for pronouns
- `getBond(a, b)` / `addBond(a, b, delta)` for bonds
- `gs.showmances` — array of `{ players: [a, b], phase, intensity }` (check `phase !== 'broken-up'`)
- `gs.namedAlliances` — array of alliance objects
- Merge camp key: `gs.mergeName || 'merge'`
- Badge rendering: ternary chain at ~line 61658+
- `getPerceivedBond(a, b)` for vote/alliance/heat decisions
- Thresholds for NARRATIVE text selection only, never for gameplay. Stats always proportional.
- Post-merge `ep.campEvents` uses `gs.mergeName || 'merge'` as key

**Existing heat pattern (from other challenges):**
```javascript
gs._suckyOutdoorsHeat = { [name]: { amount: 2.0, expiresEp: ep + 2 } };
```
We'll use `gs._schemeHeat` for the social manipulation system — same structure.

---

### Task 1: Social Manipulation Event Generator Core

**Files:**
- Modify: `simulator.html` — inside or near `generateCampEventsForGroup`, ~line 35476

This task creates the core function that scans for eligible schemers and viable targets, then decides which social manipulation events fire this episode.

- [ ] **Step 1: Add the social manipulation generator function**

Find the end of `generateCampEventsForGroup` (search for the function, then find its closing `return events;`). BEFORE the return statement, add a call to a new function. But actually — the social manipulation events should work both inside and outside `generateCampEventsForGroup` (they need to fire during Lucky Hunt's timeline too). So create a **standalone function** that gets called from `generateCampEventsForGroup` AND can be called directly from challenge code.

Place this new function BEFORE `generateCampEventsForGroup` (or after it — near the camp event code, ~line 35470):

```javascript
// ══════════════════════════════════════════════════════════════════════
// SOCIAL MANIPULATION CAMP EVENTS (standalone system)
// ══════════════════════════════════════════════════════════════════════

function generateSocialManipulationEvents(group, ep, campKey, boostRate) {
  // boostRate: 0.15 normal, 0.40 during Lucky Hunt
  const events = [];
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
  if (!group || group.length < 4) return events;

  // ── Identify eligible schemers ──
  const schemers = group.filter(name => {
    const s = pStats(name);
    const arch = players.find(p => p.name === name)?.archetype || '';
    const isSchemeArch = ['villain', 'mastermind', 'schemer', 'black-widow'].includes(arch);
    return (s.strategic >= 6 && s.loyalty <= 4) || (s.strategic >= 8) || isSchemeArch;
  });
  if (schemers.length === 0) return events;

  // ── Identify viable targets ──
  const activeShowmances = (gs.showmances || []).filter(sm =>
    sm.phase !== 'broken-up' && group.includes(sm.players[0]) && group.includes(sm.players[1])
  );
  const strongBondPairs = [];
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      if (getBond(group[i], group[j]) >= 4) {
        strongBondPairs.push([group[i], group[j]]);
      }
    }
  }

  // ── For each schemer, roll whether they attempt a scheme ──
  const maxSchemes = Math.min(2, schemers.length); // cap at 2 schemes per episode
  let schemesThisEp = 0;

  schemers.forEach(schemer => {
    if (schemesThisEp >= maxSchemes) return;
    if (Math.random() >= boostRate) return; // rate gate

    const sStats = pStats(schemer);
    const sPr = pronouns(schemer);

    // Pick best target — weighted selection
    const targets = [];

    // Showmance targets (highest priority)
    activeShowmances.forEach(sm => {
      if (sm.players.includes(schemer)) return; // don't scheme your own showmance
      const [a, b] = sm.players;
      targets.push({ type: 'showmance', a, b, score: 3 + Math.random() * 2 });
    });

    // Strong bond pair targets
    strongBondPairs.forEach(([a, b]) => {
      if (a === schemer || b === schemer) return;
      const bondStr = getBond(a, b);
      targets.push({ type: 'bondPair', a, b, score: bondStr * 0.5 + Math.random() * 2 });
    });

    // Personal grudge targets
    group.filter(p => p !== schemer && getBond(schemer, p) <= -3).forEach(rival => {
      targets.push({ type: 'grudge', a: rival, b: null, score: Math.abs(getBond(schemer, rival)) * 0.3 + Math.random() * 2 });
    });

    if (targets.length === 0) return;
    targets.sort((a, b) => b.score - a.score);
    const target = targets[0];

    // ── Pick scheme type based on target and schemer stats ──
    // Kiss trap: only for showmance targets, rare
    // Forge note: works on any pair
    // Spread lies: works on any pair, needs social
    // Whisper campaign: works against any individual

    let schemeEvent = null;

    if (target.type === 'showmance' && sStats.strategic >= 7 && Math.random() < 0.25) {
      // Attempt kiss trap (rarest)
      schemeEvent = _generateKissTrap(schemer, target, group, ep, _rp);
    } else if (target.b && Math.random() < 0.5) {
      // Forge note or spread lies (pair target)
      if (sStats.social >= sStats.strategic) {
        schemeEvent = _generateSpreadLies(schemer, target, group, ep, _rp);
      } else {
        schemeEvent = _generateForgeNote(schemer, target, group, ep, _rp);
      }
    } else {
      // Whisper campaign (individual target)
      schemeEvent = _generateWhisperCampaign(schemer, target.a || target.b, group, ep, _rp);
    }

    if (schemeEvent) {
      events.push(...schemeEvent); // may return multiple events (scheme + reaction)
      schemesThisEp++;
    }
  });

  // ── Campaign Rally (separate from schemes — fires based on anger, not scheming) ──
  // Check if any social player is angry enough to rally
  const angryPlayers = group.filter(name => {
    const s = pStats(name);
    return s.social >= 6 && (gs._schemeHeat || {})[name]?.amount > 0 === false; // not a schemer themselves
  });
  // Rally fires if someone was victimized this episode (check ep-level flag)
  if (ep._socialVictim && angryPlayers.length > 0 && Math.random() < boostRate) {
    const rallier = angryPlayers.sort((a, b) => {
      const bndA = getBond(a, ep._socialVictim);
      const bndB = getBond(b, ep._socialVictim);
      return (bndB + pStats(b).social * 0.1) - (bndA + pStats(a).social * 0.1);
    })[0];
    if (rallier && getBond(rallier, ep._socialVictim) >= 2) {
      const rallyEvent = _generateCampaignRally(rallier, ep._socialVictimTarget || ep._socialSchemer, group, ep, _rp);
      if (rallyEvent) events.push(...rallyEvent);
    }
  }

  return events;
}
```

- [ ] **Step 2: Wire it into generateCampEventsForGroup**

Inside `generateCampEventsForGroup`, before `return events;`, add:

```javascript
  // Social manipulation events (standalone system)
  const _schemeBoost = ep?.isLuckyHunt ? 0.40 : 0.15;
  const _campKey = /* determine camp key from context — this depends on whether we're in pre-merge or post-merge */;
  const socialEvents = generateSocialManipulationEvents(group, ep, _campKey, _schemeBoost);
  socialEvents.forEach(evt => events.push(evt));
```

Note: The implementer needs to read the surrounding code to determine how `campKey` is derived in context. In post-merge it's `gs.mergeName || 'merge'`.

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: social manipulation event generator core with schemer/target selection"
```

---

### Task 2: Forge Note Event

**Files:**
- Modify: `simulator.html` — add `_generateForgeNote` function near the social manipulation code

- [ ] **Step 1: Implement _generateForgeNote**

```javascript
function _generateForgeNote(schemer, target, group, ep, _rp) {
  const events = [];
  const sStats = pStats(schemer);
  const sPr = pronouns(schemer);
  // target.a = the reader, target.b = the alleged author
  const reader = target.a;
  const alleged = target.b || group.find(p => p !== schemer && p !== reader && getBond(reader, p) >= 2);
  if (!reader || !alleged) return events;

  const rStats = pStats(reader);
  const rPr = pronouns(reader);
  const aPr = pronouns(alleged);

  // Note quality
  const noteQuality = sStats.strategic * 0.1 + sStats.social * 0.05;

  // Note content text pool
  const _noteContents = [
    `"I'm only keeping ${reader} around because ${rPr.sub} ${rPr.sub==='they'?'are':'is'} easy to beat at the end."`,
    `"Don't tell ${reader}, but I'm voting for ${rPr.obj} next chance I get."`,
    `"${reader}'s game is pathetic. ${rPr.Sub} ${rPr.sub==='they'?'have':'has'} no idea what's coming."`,
    `"${reader} thinks we're close? That's exactly what I need ${rPr.obj} to think."`,
    `"I can't stand ${reader}. The second ${rPr.sub} ${rPr.sub==='they'?'aren\'t':'isn\'t'} useful, ${rPr.sub} ${rPr.sub==='they'?'are':'is'} gone."`,
  ];
  const noteContent = _rp(_noteContents);

  // Belief check
  const beliefPower = noteQuality + (5 - getBond(reader, alleged)) * 0.1;
  const resistance = rStats.mental * 0.08 + rStats.intuition * 0.05;
  const believed = beliefPower > resistance;
  const detected = rStats.intuition * 0.06 > sStats.strategic * 0.05;

  if (believed && !detected) {
    // Full buy-in
    const bondDrop = -(1.0 + noteQuality * 0.3);
    addBond(reader, alleged, bondDrop);
    const _believeTexts = [
      `${reader} finds a note tucked into ${rPr.posAdj} bag. ${rPr.Sub} reads it. Reads it again. The handwriting looks like ${alleged}'s. The words are worse. ${rPr.Sub} ${rPr.sub==='they'?'don\'t':'doesn\'t'} say anything. But the damage is done.`,
      `A folded note falls out of ${reader}'s jacket. ${noteContent} It's unsigned — but ${reader} knows ${alleged}'s writing. Or thinks ${rPr.sub} ${rPr.sub==='they'?'do':'does'}.`,
      `${reader} discovers a note in ${rPr.posAdj} things that wasn't there before. ${rPr.Sub} reads it once, crumples it, then smooths it out and reads it again. ${rPr.Sub} ${rPr.sub==='they'?'look':'looks'} at ${alleged} differently after that.`,
    ];
    events.push({
      type: 'socialForgeNote', players: [schemer, reader, alleged],
      text: _rp(_believeTexts),
      consequences: `${reader} believes the note. Bond with ${alleged} ${bondDrop.toFixed(1)}.`,
      badgeText: 'FORGED NOTE', badgeClass: 'red'
    });
    ep._socialVictim = reader;
    ep._socialSchemer = schemer;
    ep._socialVictimTarget = alleged;

    // Trigger comfort reaction check
    const comfortEvent = _generateComfortVictim(reader, group, ep, _rp);
    if (comfortEvent) events.push(comfortEvent);

  } else if (!believed && detected) {
    // Caught
    addBond(reader, schemer, -1.0);
    if (!gs._schemeHeat) gs._schemeHeat = {};
    const epNum = (gs.episode || 0) + 1;
    gs._schemeHeat[schemer] = { amount: 2.0, expiresEp: epNum + 3 };
    const _caughtTexts = [
      `${reader} finds the note. Reads it. Then looks at it more carefully. The handwriting is wrong. ${rPr.Sub} ${rPr.sub==='they'?'know':'knows'} exactly who wrote this. ${reader} finds ${schemer} and holds up the note. "Nice try."`,
      `${reader} isn't stupid. The note is too convenient, too perfectly timed. ${rPr.Sub} ${rPr.sub==='they'?'show':'shows'} it to ${alleged}. They both look at ${schemer}.`,
    ];
    events.push({
      type: 'socialExposed', players: [reader, schemer, alleged],
      text: _rp(_caughtTexts),
      consequences: `${reader} caught ${schemer}'s forged note. ${schemer} exposed. Heat +2.0.`,
      badgeText: 'EXPOSED', badgeClass: 'gold'
    });
    // Sympathy for alleged author
    group.filter(p => p !== schemer).forEach(p => addBond(p, schemer, -0.5));
    group.filter(p => p !== reader && p !== alleged).forEach(p => addBond(p, reader, 0.3));

  } else {
    // Skeptical — seed of doubt but not fully believed
    addBond(reader, alleged, -0.5);
    const _doubtTexts = [
      `${reader} finds a note. Something about ${alleged}. ${rPr.Sub} ${rPr.sub==='they'?'don\'t':'doesn\'t'} buy it entirely — but ${rPr.sub} ${rPr.sub==='they'?'can\'t':'can\'t'} quite let it go either. A seed planted.`,
      `The note doesn't quite track. ${reader} frowns at it, tucks it away, and says nothing. But ${rPr.sub} ${rPr.sub==='they'?'watch':'watches'} ${alleged} a little closer after that.`,
    ];
    events.push({
      type: 'socialForgeNote', players: [schemer, reader, alleged],
      text: _rp(_doubtTexts),
      consequences: `${reader} is skeptical but a seed of doubt is planted. Bond with ${alleged} -0.5.`,
      badgeText: 'FORGED NOTE', badgeClass: 'red'
    });
  }

  return events;
}
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: forge note social manipulation event with belief/detection mechanics"
```

---

### Task 3: Spread Lies Event

**Files:**
- Modify: `simulator.html` — add `_generateSpreadLies` function

- [ ] **Step 1: Implement _generateSpreadLies**

Similar structure to forge note but face-to-face. The schemer approaches the target directly and tells them their bond partner said terrible things.

Key differences from forge note:
- Social-weighted persuasion (face-to-face vs. written)
- Can trigger a CONFRONTATION sub-event when the target believes and confronts the alleged
- Target's social stat resists (they can read body language)

```javascript
function _generateSpreadLies(schemer, target, group, ep, _rp) {
  const events = [];
  const sStats = pStats(schemer);
  const sPr = pronouns(schemer);
  const listener = target.a;
  const accused = target.b || group.find(p => p !== schemer && p !== listener && getBond(listener, p) >= 2);
  if (!listener || !accused) return events;

  const lStats = pStats(listener);
  const lPr = pronouns(listener);
  const aPr = pronouns(accused);

  // Persuasion vs resistance
  const persuasion = sStats.social * 0.08 + sStats.strategic * 0.04;
  const resistance = lStats.social * 0.06 + lStats.intuition * 0.04 + getBond(listener, accused) * 0.03;

  const _lieThemes = [
    `${accused} has been telling people ${listener}'s game is a joke`,
    `${accused} is planning to vote ${listener} out next`,
    `${accused} called ${listener} dead weight behind ${lPr.posAdj} back`,
    `${accused} told someone ${lPr.sub} ${lPr.sub==='they'?'are':'is'} only keeping ${listener} around as a shield`,
  ];
  const lieTheme = _rp(_lieThemes);

  if (persuasion > resistance) {
    // Believed — confrontation fires
    addBond(listener, accused, -1.5);
    const _believeTexts = [
      `${schemer} pulls ${listener} aside. "I need to tell you something. ${lieTheme}." ${listener}'s face changes. ${lPr.Sub} believes it.`,
      `"I hate being the one to say this," ${schemer} says. ${sPr.Sub} doesn't hate it. "${lieTheme}." ${listener} is quiet for too long.`,
      `${schemer} delivers the lie like a friend giving bad news. Sympathetic face, gentle voice. "${lieTheme}." ${listener} thanks ${schemer} for telling ${lPr.obj}. That's how good the delivery was.`,
    ];
    events.push({
      type: 'socialSpreadLies', players: [schemer, listener, accused],
      text: _rp(_believeTexts),
      consequences: `${listener} believes ${schemer}'s lies about ${accused}. Bond -1.5.`,
      badgeText: 'LIED TO', badgeClass: 'red'
    });
    ep._socialVictim = listener;
    ep._socialSchemer = schemer;

    // Confrontation sub-event
    if (lStats.temperament <= 6 && Math.random() < 0.6) {
      addBond(listener, accused, -0.5); // confrontation makes it worse
      addBond(accused, listener, -0.3); // accused is hurt by the accusation
      const _confrontTexts = [
        `${listener} marches up to ${accused}. "Is it true? Did you say that?" ${accused} is blindsided. "Say what?" The denial doesn't land. ${listener} walks away.`,
        `${listener} doesn't wait. ${lPr.Sub} confronts ${accused} in front of everyone. ${accused} denies it. ${listener} doesn't believe the denial. The camp is watching.`,
        `"I know what you said." ${listener} is shaking. ${accused} is confused. The argument is loud and public and solves nothing.`,
      ];
      events.push({
        type: 'socialConfrontation', players: [listener, accused],
        text: _rp(_confrontTexts),
        consequences: `${listener} confronts ${accused} publicly. Bond further damaged.`,
        badgeText: 'CONFRONTATION', badgeClass: 'red'
      });
    }

    // Comfort check
    const comfortEvent = _generateComfortVictim(listener, group, ep, _rp);
    if (comfortEvent) events.push(comfortEvent);

  } else {
    // Listener doesn't buy it
    addBond(listener, schemer, -0.5);
    const _failTexts = [
      `${schemer} tries to poison ${listener} against ${accused}. ${listener} listens, nods, and says nothing. But ${lPr.posAdj} eyes say: "I don't believe you."`,
      `"That doesn't sound like ${accused}," ${listener} says flatly. ${schemer} drops it. The attempt is noted.`,
      `${listener} hears ${schemer} out, then goes straight to ${accused} and repeats everything. Now ${accused} knows who to watch.`,
    ];
    events.push({
      type: 'socialSpreadLies', players: [schemer, listener, accused],
      text: _rp(_failTexts),
      consequences: `${listener} doesn't believe ${schemer}. Bond with schemer -0.5.`,
      badgeText: 'LIED TO', badgeClass: 'red'
    });

    // If listener went to the accused, accused now suspects schemer
    if (Math.random() < 0.5) {
      addBond(accused, schemer, -0.5);
    }
  }

  return events;
}
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: spread lies social event with confrontation sub-event"
```

---

### Task 4: Kiss Trap Event

**Files:**
- Modify: `simulator.html` — add `_generateKissTrap` function

- [ ] **Step 1: Implement _generateKissTrap**

The rarest and most devastating event. Full 5-step sequence from the spec.

```javascript
function _generateKissTrap(schemer, target, group, ep, _rp) {
  const events = [];
  const sStats = pStats(schemer);
  const sPr = pronouns(schemer);

  // target.type === 'showmance', target.a and target.b are the showmance partners
  const showmance = (gs.showmances || []).find(sm =>
    sm.phase !== 'broken-up' && sm.players.includes(target.a) && sm.players.includes(target.b)
  );
  if (!showmance) return events;

  const [smA, smB] = showmance.players;
  // kissTarget = the one schemer will kiss. witness = the one who sees it.
  // Pick the more gullible one (lower mental) as witness
  const witness = pStats(smA).mental <= pStats(smB).mental ? smA : smB;
  const kissTarget = witness === smA ? smB : smA;
  const wStats = pStats(witness);
  const wPr = pronouns(witness);
  const kStats = pStats(kissTarget);
  const kPr = pronouns(kissTarget);

  // Need an accomplice to lure the witness
  const accompliceCandidates = group.filter(p =>
    p !== schemer && p !== witness && p !== kissTarget && getBond(p, schemer) >= 2 && pStats(p).social >= 5
  );
  if (accompliceCandidates.length === 0) return events; // no accomplice = can't execute
  const accomplice = accompliceCandidates.sort((a, b) => getBond(b, schemer) - getBond(a, schemer))[0];
  const accPr = pronouns(accomplice);

  // Step 1: Setup — schemer approaches kissTarget with manipulation
  const setupResistance = kStats.loyalty * 0.06 + getBond(kissTarget, witness) * 0.04 + kStats.intuition * 0.03;
  const setupPower = sStats.social * 0.08 + sStats.strategic * 0.04;

  if (setupPower <= setupResistance && Math.random() > 0.3) {
    // Setup fails — kissTarget doesn't fall for it
    const _failTexts = [
      `${schemer} approaches ${kissTarget} with fake tears. "Nobody here likes me." ${kissTarget} is sympathetic — but not that sympathetic. ${kPr.Sub} ${kPr.sub==='they'?'keep':'keeps'} ${kPr.posAdj} distance.`,
      `${schemer} tries to engineer a moment with ${kissTarget}. ${kissTarget} isn't interested. The trap doesn't spring.`,
    ];
    events.push({
      type: 'socialKissTrap', players: [schemer, kissTarget],
      text: _rp(_failTexts),
      consequences: `${schemer} tried to set up ${kissTarget} but failed.`,
      badgeText: 'SCHEME FAILED', badgeClass: 'red'
    });
    addBond(kissTarget, schemer, -0.3);
    return events;
  }

  // Step 2: Accomplice lures witness to the dock/location
  // Step 3: The kiss
  // Step 4: Witness sees it
  const _trapTexts = [
    `${accomplice} finds ${witness}. "Hey, ${kissTarget} wanted to meet you at the dock." ${witness} heads over. What ${wPr.sub} ${wPr.sub==='they'?'see':'sees'}: ${schemer} and ${kissTarget}, close. Too close. ${schemer}'s hand on ${kissTarget}'s arm. Then ${schemer} leans in and kisses ${kissTarget}. ${witness} stops walking. ${wPr.Sub} saw everything.`,
    `The note said to meet ${kissTarget} at the dock for a surprise. ${witness} walks over, smiling. The smile dies. ${schemer} is kissing ${kissTarget}. ${kissTarget} looks confused. ${witness} doesn't see the confusion. ${witness} sees the kiss. ${wPr.Sub} runs.`,
    `${accomplice} lures ${witness} to the right place at the right time. ${schemer} has been working on ${kissTarget} for an hour — fake vulnerability, fake tears, building to this moment. When ${witness} rounds the corner, ${schemer} kisses ${kissTarget}. The timing is surgical. ${witness}'s face crumbles.`,
  ];

  events.push({
    type: 'socialKissTrap', players: [schemer, kissTarget, witness, accomplice],
    text: _rp(_trapTexts),
    consequences: `${schemer} kissed ${kissTarget}. ${witness} saw it.`,
    badgeText: 'KISS TRAP', badgeClass: 'red'
  });

  // Step 5: Fallout
  const beliefLevel = (10 - wStats.mental) * 0.08 + (10 - wStats.intuition) * 0.04;
  const bondDrop = -(2.0 + beliefLevel * 2.0); // -2.0 to -4.0
  addBond(witness, kissTarget, bondDrop);
  addBond(kissTarget, schemer, -1.0); // kissTarget realizes they were used

  // Witness emotional state
  const _witnessTexts = wStats.temperament <= 5
    ? [
      `${witness} is crying before ${wPr.sub} ${wPr.sub==='they'?'reach':'reaches'} the cabin. ${wPr.Sub} slams the door. Everyone hears it.`,
      `${witness} doesn't yell. ${wPr.Sub} ${wPr.sub==='they'?'don\'t':'doesn\'t'} confront anyone. ${wPr.Sub} just... stops talking. To everyone.`,
    ]
    : [
      `${witness} is furious. ${wPr.Sub} confronts ${kissTarget} immediately. "${kissTarget} doesn't get to finish a sentence. ${witness} is already gone.`,
      `${witness} processes in silence. Then ${wPr.sub} ${wPr.sub==='they'?'find':'finds'} ${kissTarget} and says one sentence: "We're done." Walks away.`,
    ];

  events.push({
    type: 'socialHeartbroken', players: [witness],
    text: _rp(_witnessTexts),
    consequences: `${witness} is devastated. Bond with ${kissTarget} ${bondDrop.toFixed(1)}.`,
    badgeText: 'HEARTBROKEN', badgeClass: 'red'
  });

  ep._socialVictim = witness;
  ep._socialSchemer = schemer;
  ep._socialVictimTarget = kissTarget;

  // Showmance damage check
  if (getBond(witness, kissTarget) <= 0) {
    showmance.phase = 'broken-up';
    events.push({
      type: 'socialHeartbroken', players: [witness, kissTarget],
      text: `The showmance between ${witness} and ${kissTarget} is over. Destroyed by a scheme neither of them planned.`,
      consequences: 'Showmance destroyed.',
      badgeText: 'SHOWMANCE DESTROYED', badgeClass: 'red'
    });
  }

  // Detection check — does anyone figure out it was a setup?
  const detectCandidates = group.filter(p =>
    p !== schemer && p !== accomplice && pStats(p).intuition >= 6
  );
  detectCandidates.forEach(detective => {
    if (pStats(detective).intuition * 0.06 > sStats.strategic * 0.05 && Math.random() < 0.4) {
      // Expose event
      const exposeEvent = _generateExposeSchemer(detective, schemer, group, ep, _rp);
      if (exposeEvent) events.push(exposeEvent);
    }
  });

  // Accomplice takes some heat if discovered
  if (events.some(e => e.type === 'socialExposed')) {
    group.filter(p => p !== accomplice).forEach(p => addBond(p, accomplice, -0.3));
  }

  // Comfort check
  const comfortEvent = _generateComfortVictim(witness, group, ep, _rp);
  if (comfortEvent) events.push(comfortEvent);

  return events;
}
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: kiss trap social event — the Heather move with full fallout cascade"
```

---

### Task 5: Whisper Campaign, Campaign Rally, Expose & Comfort Events

**Files:**
- Modify: `simulator.html` — add remaining social manipulation functions

- [ ] **Step 1: Implement _generateWhisperCampaign**

```javascript
function _generateWhisperCampaign(schemer, target, group, ep, _rp) {
  const events = [];
  const sStats = pStats(schemer);
  const sPr = pronouns(schemer);
  const tPr = pronouns(target);

  // Approach 5-6 players individually
  const approached = group.filter(p => p !== schemer && p !== target)
    .sort(() => Math.random() - 0.5).slice(0, Math.min(6, group.length - 2));

  let influenced = 0;
  approached.forEach(listener => {
    const influence = sStats.strategic * 0.04 + getBond(schemer, listener) * 0.02;
    const resist = pStats(listener).intuition * 0.04 + getBond(listener, target) * 0.03;
    if (influence > resist && Math.random() < 0.5) {
      addBond(listener, target, -0.3);
      influenced++;
    }
  });

  if (influenced > 0) {
    // Check if target detects it
    const detected = pStats(target).intuition * 0.06 > sStats.strategic * 0.05;

    const _whisperTexts = [
      `${schemer} works the camp quietly. A word here, a suggestion there. Nothing traceable. But by sunset, ${influenced} people look at ${target} differently.`,
      `${schemer} doesn't need a megaphone. ${sPr.Sub} just needs thirty seconds with each person. By evening, the seeds are planted. ${target} has no idea.`,
      `One by one, ${schemer} catches people alone. "Have you noticed ${target} lately?" The question does the work. ${influenced} people start noticing things that may not be there.`,
    ];
    events.push({
      type: 'socialWhispers', players: [schemer, target],
      text: _rp(_whisperTexts),
      consequences: `${schemer} whispered against ${target}. ${influenced} players influenced.`,
      badgeText: 'WHISPERS', badgeClass: 'blue'
    });

    if (detected) {
      const exposeEvent = _generateExposeSchemer(target, schemer, group, ep, _rp);
      if (exposeEvent) events.push(exposeEvent);
    }
  }

  return events;
}
```

- [ ] **Step 2: Implement _generateCampaignRally**

```javascript
function _generateCampaignRally(rallier, target, group, ep, _rp) {
  const events = [];
  const rStats = pStats(rallier);
  const rPr = pronouns(rallier);
  const tPr = pronouns(target);

  // Approach players one by one
  const approached = group.filter(p => p !== rallier && p !== target);
  let agreed = 0;

  approached.forEach(listener => {
    const influence = rStats.social * 0.05 + getBond(rallier, listener) * 0.03;
    if (Math.random() < influence) agreed++;
  });

  if (agreed > 0) {
    // Apply heat to target
    if (!gs._schemeHeat) gs._schemeHeat = {};
    const epNum = (gs.episode || 0) + 1;
    const heatAmount = Math.min(3.0, agreed * 0.5);
    gs._schemeHeat[target] = { amount: heatAmount, expiresEp: epNum + 2 };

    const _rallyTexts = [
      `${rallier} has had enough. ${rPr.Sub} goes cabin to cabin, dock to dock. "We need to talk about ${target}." ${agreed} people agree. The vote is shifting.`,
      `"${target} has to go." ${rallier} says it plainly to anyone who'll listen. ${agreed} people will.`,
      `${rallier} campaigns like ${rPr.posAdj} life depends on it. Door to door, one-on-one. By tribal, ${agreed} people are on board. ${target} doesn't know what's coming.`,
      `${rallier} doesn't ask people to vote ${target} out. ${rPr.Sub} just tells them what ${target} did. The conclusion draws itself. ${agreed} people reach it.`,
    ];
    events.push({
      type: 'socialCampaignRally', players: [rallier, target],
      text: _rp(_rallyTexts),
      consequences: `${rallier} rallied ${agreed} players against ${target}. Heat +${heatAmount.toFixed(1)}.`,
      badgeText: 'CAMPAIGNED', badgeClass: 'blue'
    });
  }

  return events;
}
```

- [ ] **Step 3: Implement _generateExposeSchemer**

```javascript
function _generateExposeSchemer(exposer, schemer, group, ep, _rp) {
  const eStats = pStats(exposer);
  const ePr = pronouns(exposer);
  const sPr = pronouns(schemer);

  // Schemer takes massive social hit
  group.filter(p => p !== schemer).forEach(p => addBond(p, schemer, -0.5));
  if (!gs._schemeHeat) gs._schemeHeat = {};
  const epNum = (gs.episode || 0) + 1;
  gs._schemeHeat[schemer] = { amount: 2.0, expiresEp: epNum + 3 };

  // Exposer gets hero boost
  group.filter(p => p !== exposer && p !== schemer).forEach(p => addBond(p, exposer, 0.3));

  // Victim gets sympathy
  if (ep._socialVictim) {
    group.filter(p => p !== ep._socialVictim).forEach(p => addBond(p, ep._socialVictim, 0.3));
  }

  const _exposeTexts = [
    `${exposer} pieces it together. The note. The timing. The convenient witness. ${ePr.Sub} stands up at camp and says it plainly: "${schemer} set the whole thing up." The camp goes silent. Then it gets loud.`,
    `"It was ${schemer}." ${exposer} doesn't need a speech. Just three words. The evidence speaks for itself. ${schemer}'s face says the rest.`,
    `${exposer} confronts ${schemer} in front of everyone. "I saw what you did. I know it was you." ${schemer} tries to deny it. ${sPr.Sub} ${sPr.sub==='they'?'aren\'t':'isn\'t'} convincing.`,
    `${exposer} takes ${ep._socialVictim || 'the victim'} aside first. Then the rest of the camp. By sunset, everyone knows: ${schemer} was behind all of it.`,
  ];

  return {
    type: 'socialExposed', players: [exposer, schemer],
    text: _rp(_exposeTexts),
    consequences: `${exposer} exposed ${schemer}. Bond -0.5 from everyone. Heat +2.0 for 3 episodes.`,
    badgeText: 'EXPOSED', badgeClass: 'gold'
  };
}
```

- [ ] **Step 4: Implement _generateComfortVictim**

```javascript
function _generateComfortVictim(victim, group, ep, _rp) {
  const vPr = pronouns(victim);

  // Find a compassionate player
  const comforters = group.filter(p => {
    if (p === victim || p === ep._socialSchemer) return false;
    const s = pStats(p);
    return (s.loyalty >= 6 || getBond(p, victim) >= 3);
  }).sort((a, b) => {
    const bndA = getBond(a, victim) + pStats(a).loyalty * 0.1;
    const bndB = getBond(b, victim) + pStats(b).loyalty * 0.1;
    return bndB - bndA;
  });

  if (comforters.length === 0) return null;
  const comforter = comforters[0];
  const cPr = pronouns(comforter);
  const cStats = pStats(comforter);

  const bondBoost = 1.0 + cStats.social * 0.1;
  addBond(comforter, victim, bondBoost);
  addBond(victim, comforter, bondBoost);

  const _comfortTexts = [
    `${comforter} finds ${victim} alone. Sits down. Doesn't say anything for a while. Then: "That wasn't your fault." ${victim} doesn't respond. But ${vPr.sub} ${vPr.sub==='they'?'don\'t':'doesn\'t'} leave.`,
    `${comforter} brings ${victim} water and sits with ${vPr.obj} until ${vPr.sub} ${vPr.sub==='they'?'are':'is'} ready to talk. "I'm here. Whatever you need."`,
    `"Hey." ${comforter} crouches next to ${victim}. "I know what happened. And I know it wasn't what it looked like." ${victim} looks up. The first real eye contact in an hour.`,
    `${comforter} doesn't ask what happened. ${cPr.Sub} ${cPr.sub==='they'?'don\'t':'doesn\'t'} need to. ${cPr.Sub} just stays. Sometimes that's enough.`,
  ];

  return {
    type: 'socialComforted', players: [comforter, victim],
    text: _rp(_comfortTexts),
    consequences: `${comforter} comforted ${victim}. Bond +${bondBoost.toFixed(1)} both ways.`,
    badgeText: 'COMFORTED', badgeClass: 'green'
  };
}
```

- [ ] **Step 5: Commit**

```bash
git add simulator.html
git commit -m "feat: whisper campaign, campaign rally, expose schemer, comfort victim events"
```

---

### Task 6: Badge Registration & Heat Integration

**Files:**
- Modify: `simulator.html` — badge ternary chain (~line 61658+), heat cleanup (~line 46217+), computeHeat (~line 5389+)

- [ ] **Step 1: Register all social manipulation badge types**

Find the badge ternary chain (search for `cliffDiveConvinced`). After the last cliff dive badge, add:

```javascript
                     : evt.type === 'socialForgeNote'          ? (evt.badgeText || 'FORGED NOTE')
                     : evt.type === 'socialSpreadLies'         ? (evt.badgeText || 'LIED TO')
                     : evt.type === 'socialConfrontation'      ? (evt.badgeText || 'CONFRONTATION')
                     : evt.type === 'socialKissTrap'           ? (evt.badgeText || 'KISS TRAP')
                     : evt.type === 'socialHeartbroken'        ? (evt.badgeText || 'HEARTBROKEN')
                     : evt.type === 'socialCampaignRally'      ? (evt.badgeText || 'CAMPAIGNED')
                     : evt.type === 'socialWhispers'           ? (evt.badgeText || 'WHISPERS')
                     : evt.type === 'socialExposed'            ? (evt.badgeText || 'EXPOSED')
                     : evt.type === 'socialCaught'             ? (evt.badgeText || 'CAUGHT')
                     : evt.type === 'socialComforted'          ? (evt.badgeText || 'COMFORTED')
```

- [ ] **Step 2: Add gs._schemeHeat to computeHeat**

Find `computeHeat` function (search for `function computeHeat`). Inside it, find where other heat sources are checked (like `gs._cliffDiveBlame`, `gs._suckyOutdoorsHeat`). Add:

```javascript
  if (gs._schemeHeat?.[name]) {
    const sh = gs._schemeHeat[name];
    if (sh.expiresEp > (gs.episode || 0) + 1) {
      heat += sh.amount;
    }
  }
```

- [ ] **Step 3: Add gs._schemeHeat to cleanup**

Find the heat cleanup section (search for `delete gs._cliffDiveBlame` around line 46217). Add nearby:

```javascript
  // Clean up expired scheme heat
  if (gs._schemeHeat) {
    const _curEp = (gs.episode || 0) + 1;
    Object.keys(gs._schemeHeat).forEach(name => {
      if (gs._schemeHeat[name].expiresEp <= _curEp) delete gs._schemeHeat[name];
    });
    if (Object.keys(gs._schemeHeat).length === 0) delete gs._schemeHeat;
  }
```

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: register social manipulation badges + integrate scheme heat into voting"
```

---

### Task 7: Smoke Test Social Manipulation Events

- [ ] **Step 1: Open in browser, run 5+ episodes**

Run a season. The social manipulation events should fire occasionally (~15% per eligible schemer per episode). Look for:
- FORGED NOTE events in camp events
- LIED TO events
- CONFRONTATION sub-events
- WHISPERS events
- CAMPAIGNED events
- EXPOSED events
- COMFORTED events

- [ ] **Step 2: Verify badge rendering**

Check that badges appear correctly in the camp event display.

- [ ] **Step 3: Verify heat integration**

Check the debug tab to see if scheme heat appears on targeted players. Verify it affects vote targeting.

- [ ] **Step 4: Verify no console errors**

Open console, run 10 episodes, check for errors.

- [ ] **Step 5: Commit**

```bash
git add simulator.html
git commit -m "test: verified social manipulation events fire correctly across episodes"
```
