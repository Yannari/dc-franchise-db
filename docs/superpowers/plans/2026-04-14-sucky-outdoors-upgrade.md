# Sucky Outdoors Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Sucky Outdoors challenge with food/hunger tracking, enriched phases 2-3, a multi-beat bear encounter, morning race variance, and an enriched debug tab.

**Architecture:** All changes in `simulator.html`. The function `simulateSuckyOutdoors` starts at ~line 11861. Food/hunger is a new per-tribe tracker woven into existing phases. Bear encounter replaces the current single-event bear. Morning race adds fatigue, morale, and misstep variance. Debug tab at ~line 59270 gets per-player breakdowns.

**Tech Stack:** Vanilla JS, single-file HTML app.

**Key patterns:**
- `pStats(name)` for stats, `pronouns(name)` for pronouns (posAdj before nouns, pos standalone)
- `addBond(a, b, delta)` for bond changes, `getBond(a, b)` to read bonds
- `_rp(arr)` = random pick (defined locally in function)
- `_hash(str, n)` = deterministic pick for player-consistency
- Events pushed to `phases[phaseKey]` arrays with `{ type, phase, players:[], text, personalScores:{}, badge, badgeClass }`
- Stats are ALWAYS proportional: `stat * factor`, never thresholds for gameplay. Thresholds ONLY for narrative text.
- Camp events: `{ type, players:[], text, consequences, badgeText, badgeClass }`

**Data shape — current `ep.suckyOutdoors`:**
```javascript
{ phases, navigators, campQuality, lostPlayers, survivalScores, winner, loser, autoLoseTribe }
```

---

### Task 1: Food/Hunger Tracking System

**Files:**
- Modify: `simulator.html` — inside `simulateSuckyOutdoors()`, ~lines 11861-13310

The hunger system tracks food per tribe across all phases. Found food → better sleep, better race. No food → fatigue penalties, morale hits.

- [ ] **Step 1: Initialize hunger tracker after campQuality initialization**

After the `campQuality` initialization block (~line 11890), add:

```javascript
  // ── Food/Hunger tracker per tribe (0 = starving, 1-2 = hungry, 3+ = fed) ──
  const tribeFood = {};
  tribes.forEach(t => { tribeFood[t.name] = 0; });
```

- [ ] **Step 2: Upgrade existing Phase 1 food provider event to feed tribeFood**

Find the `soProvider` event in Phase 1 (~line 12040-12070). The provider event currently gives +1.5 or +1.0 personalScore. After the personalScore modification, add food tracking:

Find the line where the provider event is pushed to `phases.announcement` and before that push, add:

```javascript
        // Feed the tribe
        tribeFood[t.name] += isFisher ? 2 : 1;
```

This means a fisher provides 2 food, a forager provides 1. A tribe can get multiple providers across phases.

- [ ] **Step 3: Add Phase 2 foraging/hunting event**

In Phase 2 (setupCamp), after the existing shelter and fire events (~line 12270, after the labor argument event), add a new foraging event:

```javascript
    // Foraging while setting up camp — proportional to intuition
    if (Math.random() < 0.40) {
      const foragers = members.slice().sort((a, b) => pStats(b).intuition - pStats(a).intuition);
      const forager = foragers[0];
      const fS = pStats(forager);
      const fPr = pronouns(forager);
      const findChance = fS.intuition * 0.06 + fS.mental * 0.03;
      if (Math.random() < findChance) {
        const _forageTexts = [
          `${forager} disappears into the brush while the others build and comes back with armfuls of berries. The tribe eats.`,
          `${forager} finds a patch of wild mushrooms near the campsite. ${fPr.Sub} ${fPr.sub==='they'?'know':'knows'} which ones are safe. The tribe has dinner.`,
          `While scouting for firewood, ${forager} stumbles onto a berry bush. ${fPr.Sub} ${fPr.sub==='they'?'strip':'strips'} it clean. Food for the night.`,
          `${forager} catches two fish in the creek with ${fPr.posAdj} bare hands. It takes an hour. Nobody else could have done it.`,
          `${forager} sets a snare before the shelter goes up. By the time the fire is lit, there's food cooking on it.`,
        ];
        tribeFood[t.name] += 1;
        personalScores[forager] += 1.0;
        members.filter(m => m !== forager).forEach(m => addBond(m, forager, 0.2));
        phases.setupCamp.push({
          type: 'soForage', phase: 'setupCamp', players: [forager],
          text: _forageTexts[_hash(forager + 'forage', _forageTexts.length)],
          personalScores: { [forager]: 1.0 }, badge: 'FORAGER', badgeClass: 'gold'
        });
        campEventCount++;
      }
    }
```

Note: `campEventCount` is the local counter in the phase 2 tribe loop. If it doesn't exist with that name, use whatever counter the existing code uses (likely `setupCount` or similar — check the actual code).

- [ ] **Step 4: Add Phase 3 hunger consequences**

In Phase 3 (nightfall), at the end of the tribe's nightfall events (after the existing events like ghost stories, fireside, ~line 12680), add hunger effects:

```javascript
    // ── Hunger effects at nightfall ──
    if (tribeFood[t.name] === 0) {
      // Starving: morale hit, everyone suffers
      const hungriest = members.slice().sort((a, b) => pStats(a).endurance - pStats(b).endurance)[0];
      const hPr = pronouns(hungriest);
      const _starveTexts = [
        `Nobody found food. Stomachs growl around the fire. ${hungriest} looks the worst — ${hPr.sub} ${hPr.sub==='they'?'haven\'t':'hasn\'t'} eaten since morning.`,
        `The tribe has nothing to eat. ${hungriest}'s hands are shaking. The fire isn't helping.`,
        `No food. No plan. The mood around the fire drops. ${hungriest} lies down early. ${hPr.Sub} ${hPr.sub==='they'?'don\'t':'doesn\'t'} have the energy to pretend.`,
      ];
      members.forEach(m => { personalScores[m] -= 0.5; });
      personalScores[hungriest] -= 0.5; // extra hit for weakest
      phases.nightfall.push({
        type: 'soStarving', phase: 'nightfall', players: [hungriest, ...members.filter(m => m !== hungriest).slice(0, 2)],
        text: _starveTexts[_hash(t.name + 'starve', _starveTexts.length)],
        personalScores: Object.fromEntries(members.map(m => [m, m === hungriest ? -1.0 : -0.5])),
        badge: 'STARVING', badgeClass: 'red'
      });
    } else if (tribeFood[t.name] >= 3) {
      // Well-fed: morale boost
      const _fedTexts = [
        `The tribe eats well. The fire feels warmer when your stomach isn't empty. Morale is high.`,
        `Between the fish and the berries, the tribe has more food than they expected. Good spirits all around.`,
        `Full stomachs. Warm fire. For a moment, nobody remembers they're in a competition.`,
      ];
      members.forEach(m => { personalScores[m] += 0.3; });
      phases.nightfall.push({
        type: 'soWellFed', phase: 'nightfall', players: [...members.slice(0, 3)],
        text: _fedTexts[_hash(t.name + 'fed', _fedTexts.length)],
        personalScores: Object.fromEntries(members.map(m => [m, 0.3])),
        badge: 'WELL FED', badgeClass: 'green'
      });
    }
```

- [ ] **Step 5: Add hunger effects to morning race**

In Phase 5 (morning race), before the race score calculation (~line 12948), add a hunger modifier:

```javascript
    // Hunger modifier for race
    const hungerMod = tribeFood[t.name] === 0 ? 0.7 : tribeFood[t.name] >= 3 ? 1.15 : 1.0;
```

Then modify the rawRace calculation to apply it:

Change:
```javascript
    const rawRace = racers.reduce((sum, m) => {
      const s = pStats(m);
      return sum + s.physical * 0.04 + s.endurance * 0.03;
    }, 0);
    raceScores[t.name] = rawRace - penalty;
```

To:
```javascript
    const rawRace = racers.reduce((sum, m) => {
      const s = pStats(m);
      return sum + s.physical * 0.04 + s.endurance * 0.03;
    }, 0) * hungerMod;
    raceScores[t.name] = rawRace - penalty;
```

- [ ] **Step 6: Store tribeFood on ep.suckyOutdoors**

In the `ep.suckyOutdoors = { ... }` assignment (~line 13301), add `tribeFood`:

```javascript
  ep.suckyOutdoors = {
    phases, navigators, campQuality, tribeFood, lostPlayers,
    survivalScores, winner: winner.name, loser: loser.name,
    autoLoseTribe: autoLoseTribes.size ? [...autoLoseTribes][0] : null,
  };
```

- [ ] **Step 7: Commit**

```bash
git add simulator.html
git commit -m "feat(sucky-outdoors): add food/hunger tracking across all phases"
```

---

### Task 2: Phase 2 Enrichment — Camp Tensions

**Files:**
- Modify: `simulator.html` — Phase 2 section inside `simulateSuckyOutdoors()`, ~lines 12192-12402

Add 2 new event types to Phase 2: leadership struggle and sabotage/laziness escalation.

- [ ] **Step 1: Add leadership struggle event**

After the existing fire-starting event in Phase 2, add:

```javascript
    // Leadership struggle: two high-strategic players clash over how to set up camp
    if (campEventCount < maxCampEvents && members.length >= 4 && Math.random() < 0.30) {
      const strategists = members.slice().sort((a, b) => pStats(b).strategic - pStats(a).strategic);
      const leader1 = strategists[0], leader2 = strategists[1];
      if (leader1 && leader2 && pStats(leader1).strategic >= 5 && pStats(leader2).strategic >= 5) {
        const l1Pr = pronouns(leader1), l2Pr = pronouns(leader2);
        const bond = getBond(leader1, leader2);
        const _leaderTexts = bond >= 2
          ? [
            `${leader1} and ${leader2} disagree on where to build the shelter. It's civil — they respect each other — but neither backs down. The tribe splits to watch.`,
            `${leader1} wants the shelter by the creek. ${leader2} wants it on higher ground. They debate for ten minutes. ${leader2} concedes. It costs ${l2Pr.obj}.`,
            `Two plans. Two leaders. ${leader1} and ${leader2} each draw their layout in the dirt. The tribe votes. Somebody's ego takes a hit.`,
          ]
          : [
            `${leader1} and ${leader2} are both trying to run the camp. Orders overlap. Workers get confused. "Who's in charge here?" somebody asks. Nobody answers.`,
            `${leader1} starts directing the shelter build. ${leader2} starts directing a different shelter build. The tribe has half of two shelters and none of one.`,
            `"I've got this." "No, I've got this." ${leader1} and ${leader2} spend more time arguing than building. The shelter suffers for it.`,
          ];

        // Winner is more social (can rally the troops)
        const winner = pStats(leader1).social >= pStats(leader2).social ? leader1 : leader2;
        const loserLeader = winner === leader1 ? leader2 : leader1;
        personalScores[winner] += 1.0;
        personalScores[loserLeader] -= 0.5;
        addBond(leader1, leader2, bond >= 2 ? -0.1 : -0.3);
        members.filter(m => m !== winner && m !== loserLeader).forEach(m => addBond(m, winner, 0.15));
        phases.setupCamp.push({
          type: 'soLeaderClash', phase: 'setupCamp', players: [leader1, leader2],
          text: _leaderTexts[_hash(leader1 + leader2 + 'lead', _leaderTexts.length)],
          personalScores: { [winner]: 1.0, [loserLeader]: -0.5 }, badge: 'POWER STRUGGLE', badgeClass: 'red'
        });
        campEventCount++;
      }
    }
```

- [ ] **Step 2: Add injury/accident event during camp setup**

```javascript
    // Minor injury during camp setup — physical players push too hard
    if (campEventCount < maxCampEvents && Math.random() < 0.20) {
      const candidates = members.filter(m => pStats(m).physical >= 5);
      if (candidates.length > 0) {
        const injured = _rp(candidates);
        const iPr = pronouns(injured);
        const _injuryTexts = [
          `${injured} cuts ${iPr.posAdj} hand on a branch while hacking at shelter poles. It's not bad, but it slows ${iPr.obj} down for the rest of the night.`,
          `${injured} twists ${iPr.posAdj} ankle carrying a log. ${iPr.Sub} ${iPr.sub==='they'?'sit':'sits'} down and tries to walk it off. It's going to be a long night.`,
          `A rock gives way under ${injured}'s foot. ${iPr.Sub} ${iPr.sub==='they'?'catch':'catches'} ${iPr.ref}, but ${iPr.posAdj} knee takes the hit. ${iPr.Sub} ${iPr.sub==='they'?'limp':'limps'} for the next hour.`,
          `${injured} overextends hauling a log for the shelter frame. Something pulls in ${iPr.posAdj} shoulder. ${iPr.Sub} ${iPr.sub==='they'?'don\'t':'doesn\'t'} mention it. Everyone notices.`,
        ];
        personalScores[injured] -= 1.0;
        // Injury flag for morning race penalty
        if (!ep._soInjured) ep._soInjured = {};
        ep._soInjured[injured] = true;
        phases.setupCamp.push({
          type: 'soInjury', phase: 'setupCamp', players: [injured],
          text: _injuryTexts[_hash(injured + 'injury', _injuryTexts.length)],
          personalScores: { [injured]: -1.0 }, badge: 'INJURED', badgeClass: 'red'
        });
        campEventCount++;
      }
    }
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat(sucky-outdoors): enrich phase 2 with leadership clash, foraging, injury events"
```

---

### Task 3: Phase 3 Enrichment — Night Tensions

**Files:**
- Modify: `simulator.html` — Phase 3 section, ~lines 12403-12690

Add food-sharing drama and alliance whispers to nightfall.

- [ ] **Step 1: Add food-sharing drama event**

After the existing nightfall events, before the hunger effects from Task 1:

```javascript
    // Food-sharing drama: someone hoards or generously shares
    if (tribeFood[t.name] >= 1 && tribeFood[t.name] <= 2 && Math.random() < 0.35) {
      const selfish = members.slice().sort((a, b) => pStats(a).loyalty - pStats(b).loyalty)[0];
      const selfS = pStats(selfish);
      if (selfS.loyalty <= 5) {
        const sPr = pronouns(selfish);
        const _hoardTexts = [
          `${selfish} pockets extra berries when nobody's looking. ${sPr.Sub} ${sPr.sub==='they'?'eat':'eats'} them later, alone. The tribe's share gets a little thinner.`,
          `The food gets split unevenly. ${selfish} takes a bigger portion. Somebody notices. Nobody says anything — yet.`,
          `${selfish} finishes eating before anyone else. Suspiciously fast. The portions don't add up.`,
        ];
        personalScores[selfish] -= 0.5;
        members.filter(m => m !== selfish).forEach(m => addBond(m, selfish, -0.2));
        phases.nightfall.push({
          type: 'soFoodHoard', phase: 'nightfall', players: [selfish, ...members.filter(m => m !== selfish).slice(0, 2)],
          text: _hoardTexts[_hash(selfish + 'hoard', _hoardTexts.length)],
          personalScores: { [selfish]: -0.5 }, badge: 'FOOD HOARDER', badgeClass: 'red'
        });
      } else {
        // Generous sharer — highest loyalty
        const generous = members.slice().sort((a, b) => pStats(b).loyalty - pStats(a).loyalty)[0];
        const gPr = pronouns(generous);
        const _shareTexts = [
          `${generous} gives ${gPr.posAdj} portion to the person who looks hungriest. Doesn't say anything about it. Everyone notices anyway.`,
          `${generous} splits ${gPr.posAdj} food evenly with the group before taking any. The tribe remembers this.`,
          `${generous} makes sure everyone eats before ${gPr.sub} ${gPr.sub==='they'?'do':'does'}. ${gPr.Sub} ${gPr.sub==='they'?'go':'goes'} to bed with less, but ${gPr.posAdj} tribe trusts ${gPr.obj} more.`,
        ];
        personalScores[generous] += 0.5;
        members.filter(m => m !== generous).forEach(m => addBond(m, generous, 0.2));
        phases.nightfall.push({
          type: 'soFoodShare', phase: 'nightfall', players: [generous, ...members.filter(m => m !== generous).slice(0, 2)],
          text: _shareTexts[_hash(generous + 'share', _shareTexts.length)],
          personalScores: { [generous]: 0.5 }, badge: 'SHARED FOOD', badgeClass: 'green'
        });
      }
    }
```

- [ ] **Step 2: Add late-night alliance whisper event**

After food sharing, in the nightfall events:

```javascript
    // Late-night alliance whisper — strategic players scheme
    if (Math.random() < 0.25) {
      const schemers = members.filter(m => pStats(m).strategic >= 5).slice(0, 2);
      if (schemers.length === 2) {
        const [a, b] = schemers;
        const aPr = pronouns(a), bPr = pronouns(b);
        const bond = getBond(a, b);
        const _whisperTexts = bond >= 1
          ? [
            `${a} and ${b} stay up after the others fall asleep. Voices low. Plans made. Nobody else hears — but the game just shifted.`,
            `"What if we..." ${a} starts. ${b} finishes the sentence. They've been thinking the same thing. By sunrise, they have a deal.`,
            `The fire is embers. Everyone's asleep. ${a} nudges ${b}. A whispered conversation that changes the next three votes happens in ninety seconds.`,
          ]
          : [
            `${a} tests the waters with ${b} by the dying fire. ${b} listens but gives nothing away. The attempt is noted.`,
            `${a} tries to pull ${b} into a conversation about "moving forward." ${b} keeps ${bPr.posAdj} answers vague. Neither trusts the other. Yet.`,
          ];
        addBond(a, b, bond >= 1 ? 0.3 : 0.1);
        personalScores[a] += 0.5;
        personalScores[b] += 0.5;
        phases.nightfall.push({
          type: 'soAllianceWhisper', phase: 'nightfall', players: [a, b],
          text: _whisperTexts[_hash(a + b + 'whisper', _whisperTexts.length)],
          personalScores: { [a]: 0.5, [b]: 0.5 }, badge: 'WHISPERS', badgeClass: 'blue'
        });
      }
    }
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat(sucky-outdoors): enrich phase 3 with food drama, alliance whispers"
```

---

### Task 4: Bear Encounter Expansion

**Files:**
- Modify: `simulator.html` — Phase 4 (The Night) section, ~lines 12734-12762

Replace the single-event bear with a multi-beat setpiece.

- [ ] **Step 1: Replace the bear encounter**

Find the current bear event (lines ~12734-12762). It triggers at 35% chance and is a single event. Replace the entire bear block with:

```javascript
    // ── BEAR ENCOUNTER (multi-beat setpiece) ──
    if (nightCount < maxNight && Math.random() < 0.35) {
      const sortedByBold = members.slice().sort((a, b) => pStats(b).boldness - pStats(a).boldness);
      const brave = sortedByBold[0];
      const panicker = sortedByBold[sortedByBold.length - 1];
      const bravePr = pronouns(brave), panicPr = pronouns(panicker);
      const braveS = pStats(brave), panicS = pStats(panicker);

      // Beat 1: Detection — who spots it first? Intuition-weighted.
      const spotter = members.slice().sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
      const spotPr = pronouns(spotter);
      const _detectTexts = [
        `${spotter} hears it first. A branch snaps. Then another. Something big is moving through the trees. ${spotPr.Sub} ${spotPr.sub==='they'?'sit':'sits'} up slowly and grabs the nearest torch.`,
        `${spotter}'s eyes snap open. Something is breathing outside the shelter. Heavy. Close. ${spotPr.Sub} ${spotPr.sub==='they'?'don\'t':'doesn\'t'} move. Not yet.`,
        `A supply crate crashes over in the dark. ${spotter} is the first one awake. ${spotPr.Sub} ${spotPr.sub==='they'?'see':'sees'} it — a shape, massive, at the edge of the firelight.`,
      ];

      // Beat 2: Panic — who freezes, who runs?
      const runners = members.filter(m => m !== brave && pStats(m).boldness <= 4);
      const freezers = members.filter(m => m !== brave && m !== panicker && pStats(m).boldness >= 4 && pStats(m).boldness <= 6);
      const _panicTexts = [
        `${panicker} screams. Full volume. The whole camp is awake now. ${runners.length > 0 ? `${runners[0]} bolts into the trees.` : 'Nobody runs — but it\'s close.'}`,
        `${panicker} backs into the shelter wall so hard it shakes. ${panicPr.Sub} ${panicPr.sub==='they'?'are':'is'} hyperventilating. The tribe is awake and terrified.`,
        `${panicker} freezes solid. Can't move. Can't speak. ${runners.length > 0 ? `${runners[0]} is already running.` : 'Everyone else is frozen too.'}`,
      ];

      // Beat 3: Confrontation — brave player stands their ground
      const confrontSuccess = Math.random() < braveS.boldness * 0.08 + braveS.physical * 0.03;
      const _confrontTexts = confrontSuccess
        ? [
          `${brave} picks up a burning stick from the fire and walks toward it. Slow. Steady. The bear looks at ${bravePr.obj}. ${brave} looks back. The bear decides this isn't worth it.`,
          `${brave} stands up, spreads ${bravePr.posAdj} arms wide, and yells. Raw. Primal. The sound echoes off the trees. The bear backs away.`,
          `${brave} grabs two pots and smashes them together. Again. Again. The bear flinches. Then turns. Then goes. ${brave} doesn't stop banging until the silence comes back.`,
        ]
        : [
          `${brave} tries to scare it off with a torch, but the bear swipes the torch away. The tribe scatters. The bear gets into the food supplies before losing interest and wandering off.`,
          `${brave} stands ${bravePr.posAdj} ground, but the bear is bigger than expected. It bluff-charges. ${brave} stumbles back. The bear rummages through the camp at its leisure before leaving.`,
          `${brave} yells. The bear doesn't care. It shoves past ${bravePr.obj}, knocks over the shelter support, and eats everything that smells like food. Then it leaves. The damage is done.`,
        ];

      // Beat 4: Aftermath
      const _afterTexts = confrontSuccess
        ? [
          `The tribe sits in silence for a long time. Then someone says: "${brave} just saved all of us." Nobody disagrees.`,
          `Nobody sleeps for the rest of the night. But they're alive, and the food is intact. ${brave} stares into the dark until sunrise.`,
        ]
        : [
          `The shelter is wrecked. The food is gone. The tribe rebuilds what they can in the dark and doesn't sleep.`,
          `Half the supplies are destroyed. The shelter has a hole in it. Morale is zero. ${panicker} won't stop shaking.`,
        ];

      // ── Score + bond effects ──
      personalScores[spotter] += 1.0;
      personalScores[brave] += confrontSuccess ? 3.0 : 1.0;
      personalScores[panicker] -= 1.5;
      members.filter(m => m !== brave).forEach(m => addBond(m, brave, confrontSuccess ? 0.5 : 0.2));
      members.filter(m => m !== panicker).forEach(m => addBond(m, panicker, -0.2));

      // Food loss on failed confrontation
      if (!confrontSuccess) {
        tribeFood[t.name] = Math.max(0, tribeFood[t.name] - 2);
        campQuality[t.name] = Math.max(1, campQuality[t.name] - 2);
      }

      // Push all beats as one rich event
      const fullText = _detectTexts[_hash(spotter + 'detect', _detectTexts.length)]
        + '\n' + _panicTexts[_hash(panicker + 'panic', _panicTexts.length)]
        + '\n' + _confrontTexts[_hash(brave + 'confront', _confrontTexts.length)]
        + '\n' + _afterTexts[_hash(brave + 'after', _afterTexts.length)];

      phases.theNight.push({
        type: 'soBear', phase: 'theNight',
        players: [spotter, brave, panicker, ...runners.slice(0, 1)].filter((v, i, a) => a.indexOf(v) === i),
        text: fullText,
        personalScores: {
          [spotter]: 1.0, [brave]: confrontSuccess ? 3.0 : 1.0, [panicker]: -1.5,
        },
        badge: confrontSuccess ? 'BEAR — SURVIVED' : 'BEAR — CAMP WRECKED',
        badgeClass: confrontSuccess ? 'gold' : 'red',
        bearSuccess: confrontSuccess,
      });

      // Big moves tracker for brave player
      if (confrontSuccess) {
        if (!gs.playerStates) gs.playerStates = {};
        if (!gs.playerStates[brave]) gs.playerStates[brave] = {};
        gs.playerStates[brave].bigMoves = (gs.playerStates[brave].bigMoves || 0) + 1;
      }

      // Popularity
      if (typeof addPopularity === 'function') {
        addPopularity(brave, confrontSuccess ? 2 : 1);
        addPopularity(panicker, -1);
      }

      nightCount++;
    }
```

- [ ] **Step 2: Add camp event for bear encounter**

In the camp events section (~line 13158+), after existing camp event generation, add:

```javascript
    // Bear encounter camp event
    const bearEvent = t.reactions ? null : (phases.theNight || []).find(e => e.type === 'soBear' && e.players.some(p => members.includes(p)));
```

Wait — the bear event is already in `phases.theNight`, and camp events are generated separately. Look at how existing camp events reference phase events. The bear event players need a camp event:

Find the section where soBrave camp events are generated (~line 13200). Near there, add:

```javascript
    // Bear encounter camp events
    const bearEvents = (phases.theNight || []).filter(e => e.type === 'soBear' && e.players.some(p => members.includes(p)));
    bearEvents.forEach(be => {
      const brave = be.players[1]; // brave is second in players array (spotter, brave, panicker, runner)
      if (brave && members.includes(brave)) {
        ep.campEvents[t.name].post.push({
          type: 'soBearHero',
          players: [brave, ...be.players.filter(p => p !== brave).slice(0, 2)],
          text: be.bearSuccess
            ? `${brave} scared off a bear in the middle of the night. The tribe is alive because of it.`
            : `${brave} tried to fight off a bear. It didn't work. But ${pronouns(brave).sub} stood ${pronouns(brave).posAdj} ground.`,
          consequences: be.bearSuccess ? 'Bond +0.5 from tribe. Big move.' : 'Bond +0.2 from tribe.',
          badgeText: be.bearSuccess ? 'BEAR HERO' : 'STOOD GROUND', badgeClass: 'gold'
        });
      }
      const panicker = be.players[2];
      if (panicker && members.includes(panicker) && panicker !== brave) {
        ep.campEvents[t.name].post.push({
          type: 'soBearPanic',
          players: [panicker],
          text: `${panicker} panicked during the bear encounter. The tribe saw.`,
          consequences: 'Bond -0.2 from tribe.',
          badgeText: 'PANICKED', badgeClass: 'red'
        });
      }
    });
```

- [ ] **Step 3: Register new badge types**

Find the badge renderer (~line 61370, where cliff dive badges are). Add:

```javascript
                     : evt.type === 'soBearHero'               ? (evt.badgeText || 'BEAR HERO')
                     : evt.type === 'soBearPanic'              ? (evt.badgeText || 'PANICKED')
```

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat(sucky-outdoors): multi-beat bear encounter with detection, panic, confrontation, aftermath"
```

---

### Task 5: Morning Race Variance

**Files:**
- Modify: `simulator.html` — Phase 5 (Morning Race), ~lines 12937-13100

Add fatigue, morale, missteps, and a rally mechanic so the race isn't purely athletic.

- [ ] **Step 1: Add fatigue and morale modifiers to race scoring**

Before the rawRace calculation (~line 12948), compute fatigue and morale:

```javascript
    // Fatigue: injured players and poor sleep (low camp quality) slow you down
    const fatigueModifiers = {};
    racers.forEach(m => {
      let fatigue = 1.0;
      if (ep._soInjured?.[m]) fatigue -= 0.15; // injury from camp setup
      fatigue -= Math.max(0, (5 - campQuality[t.name]) * 0.03); // poor camp = poor sleep
      fatigueModifiers[m] = Math.max(0.5, fatigue);
    });

    // Morale: well-fed tribes run harder, starving tribes drag
    // (hungerMod already defined from Task 1)
```

Then change the rawRace to use per-player fatigue:

```javascript
    const rawRace = racers.reduce((sum, m) => {
      const s = pStats(m);
      return sum + (s.physical * 0.04 + s.endurance * 0.03) * fatigueModifiers[m];
    }, 0) * hungerMod;
```

- [ ] **Step 2: Add misstep/stumble event with higher variance**

Find the existing stumble event in morning race (if it exists — search for `soStumble`). Replace or add:

```javascript
    // Misstep: random player trips/falls, proportional to low physical
    if (raceEventCount < maxRaceEvents && Math.random() < 0.30) {
      const stumbleCandidates = racers.filter(m => m !== topRacer);
      if (stumbleCandidates.length > 0) {
        // Weight toward low physical
        const stumbler = stumbleCandidates.sort((a, b) => {
          const wA = (10 - pStats(a).physical) * 0.5 + Math.random() * 5;
          const wB = (10 - pStats(b).physical) * 0.5 + Math.random() * 5;
          return wB - wA;
        })[0];
        const sPr = pronouns(stumbler);
        const _stumbleTexts = [
          `${stumbler} catches a root and goes down hard. ${sPr.Sub} ${sPr.sub==='they'?'get':'gets'} up, but ${sPr.sub} ${sPr.sub==='they'?'are':'is'} limping. The tribe slows for ${sPr.obj}.`,
          `${stumbler} misjudges a rock and rolls ${sPr.posAdj} ankle. The whole tribe feels it. They lose thirty seconds waiting.`,
          `${stumbler} slides on wet leaves and takes out two other people on the way down. Chaos. A full minute lost.`,
          `${stumbler} trips, falls face-first into the mud, and has to be pulled out by teammates. The other tribes gain ground.`,
        ];
        personalScores[stumbler] -= 1.5;
        raceScores[t.name] -= 1.5;
        phases.morningRace.push({
          type: 'soStumble', phase: 'morningRace', players: [stumbler],
          text: _stumbleTexts[_hash(stumbler + 'stumble', _stumbleTexts.length)],
          personalScores: { [stumbler]: -1.5 }, badge: 'STUMBLE', badgeClass: 'red'
        });
        raceEventCount++;
      }
    }
```

- [ ] **Step 3: Add rally/morale event for losing tribes**

After the stumble event:

```javascript
    // Rally: a social leader fires up a tribe that's behind
    if (raceEventCount < maxRaceEvents && raceScores[t.name] < 0 && Math.random() < 0.35) {
      const rallier = members.slice().sort((a, b) => pStats(b).social * 0.5 + pStats(b).loyalty * 0.3 - (pStats(a).social * 0.5 + pStats(a).loyalty * 0.3))[0];
      if (rallier) {
        const rPr = pronouns(rallier);
        const _rallyTexts = [
          `${rallier} stops running, turns around, and yells at the tribe. "We are NOT losing this!" Something ignites. The pace picks up.`,
          `${rallier} grabs the slowest person's arm and pulls. "Stay with me." The tribe tightens up. They're not giving up.`,
          `"TOGETHER!" ${rallier} screams it. Nobody knows why it works. But it does. The tribe finds another gear.`,
          `${rallier} starts a chant. It's stupid. It's childish. And it works. The tribe runs harder than they have all morning.`,
        ];
        personalScores[rallier] += 1.5;
        raceScores[t.name] += 2.0;
        members.filter(m => m !== rallier).forEach(m => addBond(m, rallier, 0.2));
        phases.morningRace.push({
          type: 'soRally', phase: 'morningRace', players: [rallier, ...members.filter(m => m !== rallier).slice(0, 2)],
          text: _rallyTexts[_hash(rallier + 'rally', _rallyTexts.length)],
          personalScores: { [rallier]: 1.5 }, badge: 'RALLIED THE TRIBE', badgeClass: 'gold'
        });
        raceEventCount++;
      }
    }
```

- [ ] **Step 4: Add carry event for injured/weak player**

The carry event may already exist. If it does, ensure injured players from Phase 2 get priority for being carried. If not, add:

```javascript
    // Carry: strong player helps weak/injured teammate
    if (raceEventCount < maxRaceEvents && Math.random() < 0.25) {
      const weakest = racers.slice().sort((a, b) => {
        const aW = pStats(a).physical + pStats(a).endurance + (ep._soInjured?.[a] ? -5 : 0);
        const bW = pStats(b).physical + pStats(b).endurance + (ep._soInjured?.[b] ? -5 : 0);
        return aW - bW;
      })[0];
      const strongest = racers.filter(m => m !== weakest).sort((a, b) => pStats(b).physical - pStats(a).physical)[0];
      if (weakest && strongest && pStats(strongest).loyalty >= 4) {
        const sPr = pronouns(strongest), wPr = pronouns(weakest);
        const isInjured = ep._soInjured?.[weakest];
        const _carryTexts = [
          `${strongest} sees ${weakest} falling behind${isInjured ? ' — limping on that bad ankle' : ''}. Drops back. Throws ${weakest}'s arm over ${sPr.posAdj} shoulder. They finish together.`,
          `${weakest} can't keep up${isInjured ? ' — the injury from last night is worse than it looked' : ''}. ${strongest} grabs ${wPr.obj}. "We're not leaving anyone."`,
          `${strongest} half-carries ${weakest} over the last ridge${isInjured ? '. The injury slowed them both' : ''}. It costs the tribe time. But it earns something else.`,
        ];
        personalScores[strongest] += 1.5;
        addBond(strongest, weakest, 0.4);
        members.filter(m => m !== strongest).forEach(m => addBond(m, strongest, 0.2));
        phases.morningRace.push({
          type: 'soCarry', phase: 'morningRace', players: [strongest, weakest],
          text: _carryTexts[_hash(strongest + weakest + 'carry', _carryTexts.length)],
          personalScores: { [strongest]: 1.5 }, badge: 'CARRIED TEAMMATE', badgeClass: 'gold'
        });
        raceEventCount++;
      }
    }
```

- [ ] **Step 5: Commit**

```bash
git add simulator.html
git commit -m "feat(sucky-outdoors): morning race variance with fatigue, stumble, rally, carry"
```

---

### Task 6: Debug Tab Enrichment

**Files:**
- Modify: `simulator.html` — debug tab section, ~line 59270

- [ ] **Step 1: Enrich the sucky outdoors debug section**

Replace the existing sucky outdoors debug block (~lines 59270-59286) with an enriched version that shows per-player total scores, tribe survival scores, food status, and bear outcome:

```javascript
    if (ep.suckyOutdoors?.phases) {
      html += `<div style="font-family:var(--font-display);font-size:13px;color:#f0883e;margin:16px 0 8px">Sucky Outdoors — Full Breakdown</div>`;
      const so = ep.suckyOutdoors;

      // Tribe summary
      Object.entries(so.survivalScores || {}).forEach(([tribe, score]) => {
        const tc = tribeColor(tribe);
        const food = so.tribeFood?.[tribe] ?? '?';
        const quality = (so.campQuality?.[tribe] || 0).toFixed(1);
        const nav = so.navigators?.[tribe] || '?';
        const isWinner = tribe === so.winner;
        const isLoser = tribe === so.loser;
        html += `<div style="font-size:10px;padding:3px 0"><span style="color:${tc};font-weight:700">${tribe}</span>: Score ${score.toFixed(1)}${isWinner ? ' ★ WINNER' : ''}${isLoser ? ' ✗ LOSER' : ''} · Nav: ${nav} · Camp: ${quality} · Food: ${food}</div>`;
      });

      // Per-player scores
      html += `<div style="font-size:9px;font-weight:700;color:#8b949e;margin-top:6px">Per-Player Scores</div>`;
      const allPlayers = Object.entries(ep.chalMemberScores || {}).sort((a, b) => b[1] - a[1]);
      allPlayers.forEach(([name, score]) => {
        const injured = ep._soInjured?.[name] ? ' INJURED' : '';
        const lost = so.lostPlayers?.some(lp => lp.name === name) ? ' LOST' : '';
        html += `<div style="font-size:9px;padding:1px 0 1px 12px;color:#6e7681">${name}: ${score.toFixed(1)}${injured}${lost}</div>`;
      });

      // Phase events
      Object.entries(so.phases).forEach(([phase, events]) => {
        const labels = { announcement: 'Hike', setupCamp: 'Camp Setup', nightfall: 'Nightfall', theNight: 'The Night', morningRace: 'Morning Race' };
        html += `<div style="font-size:10px;font-weight:700;color:#8b949e;margin-top:6px">${labels[phase] || phase} (${events.length} events)</div>`;
        events.forEach(evt => {
          const scores = Object.entries(evt.personalScores || {}).map(([n, d]) => `${n}:${d > 0 ? '+' : ''}${d.toFixed(1)}`).join(', ');
          html += `<div style="font-size:9px;padding:1px 0;color:#6e7681">[${evt.badge || evt.type}] ${evt.text.substring(0, 80)}${evt.text.length > 80 ? '...' : ''}${scores ? ` <span style="color:#8b949e">(${scores})</span>` : ''}</div>`;
        });
      });

      // Lost players
      if (so.lostPlayers?.length) {
        html += `<div style="margin-top:6px;padding:4px 8px;border-radius:4px;background:rgba(248,81,73,0.08);font-size:10px;color:#f85149">Lost: ${so.lostPlayers.map(lp => `${lp.name} (${lp.tribe})`).join(', ')}</div>`;
      }
    }
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat(sucky-outdoors): enriched debug tab with per-player scores, food, tribe breakdown"
```

---

### Task 7: Update Text Backlog

**Files:**
- Modify: `simulator.html` — `_textSuckyOutdoors()`, ~line 49595

The text backlog needs to show food status and bear outcome.

- [ ] **Step 1: Find `_textSuckyOutdoors` and add food/bear info**

In the text backlog function, after the existing phase event listing, add:

After the existing `sec('THE SUCKY OUTDOORS')` opening and before the phase loop, add:

```javascript
  // Food status per tribe
  if (so.tribeFood) {
    ln('Food Status:');
    Object.entries(so.tribeFood).forEach(([tribe, food]) => {
      const label = food === 0 ? 'STARVING' : food >= 3 ? 'WELL FED' : 'HUNGRY';
      ln(`  ${tribe}: ${food} food (${label})`);
    });
    ln('');
  }
```

And after the existing lost players section, add a bear summary if present:

```javascript
  // Bear encounter summary
  const bearEvent = Object.values(so.phases).flat().find(e => e.type === 'soBear');
  if (bearEvent) {
    ln('');
    ln(`BEAR ENCOUNTER: ${bearEvent.bearSuccess ? 'Bear scared off' : 'Bear wrecked camp'}`);
    ln(`  ${bearEvent.text.split('\n').join('\n  ')}`);
  }
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat(sucky-outdoors): text backlog shows food status and bear encounter"
```

---

### Task 8: Smoke Test

- [ ] **Step 1: Open in browser, configure cliff dive for episode, run**

Run a season with Sucky Outdoors twist. Verify:

- [ ] **Step 2: Check VP screen**

Click through all phases. Verify new events appear:
- Phase 2: foraging, leadership clash, injury
- Phase 3: food sharing/hoarding, alliance whispers, hunger effects (starving/well-fed)
- Phase 4: multi-beat bear encounter (if it fired — 35% chance)
- Phase 5: fatigue effects, stumbles, rallies, carries

- [ ] **Step 3: Check text backlog**

Open text backlog. Verify food status per tribe appears. Bear encounter summary if present.

- [ ] **Step 4: Check debug tab**

Open debug challenge tab. Verify per-player scores, food status, tribe survival scores visible.

- [ ] **Step 5: Run 5+ episodes to check variance**

Verify:
- Food levels vary (some tribes starve, some well-fed)
- Bear encounter fires ~35% of the time
- Morning race has upsets (weaker athletic tribe can win via rally/shortcut/no stumble)
- No console errors

- [ ] **Step 6: Commit final**

```bash
git add simulator.html
git commit -m "feat(sucky-outdoors): full upgrade — food system, bear setpiece, phase enrichment, race variance"
```
