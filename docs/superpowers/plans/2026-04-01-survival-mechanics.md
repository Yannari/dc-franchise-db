# Survival Mechanics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the food/water survival system with per-tribe food reserves, provider/slacker dynamics, challenge stat penalties, collapse→medevac arc, and VP display.

**Architecture:** Single-file changes in `simulator.html`. New `updateSurvival(ep)` function runs each episode to decay tribe food, compute provider/slacker, sync player survival, generate survival camp events, and check collapse/medevac. Challenge functions apply survival stat penalties. VP camp screens show tribe food bar + player survival on hover.

**Tech Stack:** Vanilla JS, inline CSS, existing camp event / VP patterns.

**Spec:** `docs/superpowers/specs/2026-04-01-survival-mechanics-design.md`

---

### Task 1: Initialize survival state at season start

**Files:**
- Modify: `simulator.html` — season initialization (where `gs` is first set up)

Find where `gs` is initialized at season start. Search for `gs.activePlayers =` or `gs.initialized = true` near the beginning of the game setup. Add survival state initialization right before `gs.initialized = true`:

- [ ] **Step 1: Add survival state initialization**

Find the game initialization block. Search for `gs.initialized = true`. Add right BEFORE it:

```js
  // ── Survival Mechanics initialization ──
  if (seasonConfig.foodWater === 'enabled') {
    gs.survival = {};
    gs.activePlayers.forEach(p => { gs.survival[p] = 80; }); // start at 80 (already on an island)
    gs.tribeFood = {};
    gs.tribes.forEach(t => { gs.tribeFood[t.name] = 60; }); // tribe food starts at 60
    gs.currentProviders = [];
    gs.currentSlackers = [];
    gs.providerHistory = {};
    gs.collapseWarning = {};
    gs.medevacs = [];
  }
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: initialize survival state at season start"
```

---

### Task 2: Core `updateSurvival(ep)` function — decay, provider/slacker, sync

**Files:**
- Modify: `simulator.html` — insert new function after `updatePlayerStates` (line ~3065)

This is the core engine function. It runs once per episode and handles:
1. Tribe food decay
2. Provider/slacker calculation + contribution to tribe food
3. Energy cost (providers) / energy savings (slackers)
4. Player survival sync toward tribe food level
5. Store provider/slacker data for camp events and VP

- [ ] **Step 1: Add the function**

Find `function updatePlayerStates(ep)` and find its closing `}`. Insert after it:

```js
// ══════════════════════════════════════════════════════════════════════
// ENGINE: SURVIVAL MECHANICS
// ══════════════════════════════════════════════════════════════════════

function updateSurvival(ep) {
  if (seasonConfig.foodWater !== 'enabled') return;
  if (!gs.survival) gs.survival = {};
  if (!gs.tribeFood) gs.tribeFood = {};
  const difficulty = seasonConfig.survivalDifficulty || 'casual';
  const epNum = ep.num || (gs.episode || 0) + 1;

  // ── 1. Tribe food decay ──
  const decayRanges = { casual: [3, 5], realistic: [6, 10], brutal: [10, 16] };
  const [decayMin, decayMax] = decayRanges[difficulty] || decayRanges.casual;

  // Get current tribe groups (pre-merge: gs.tribes, post-merge: single merged group)
  const tribeGroups = gs.isMerged
    ? [{ name: gs.mergeName || 'merge', members: [...gs.activePlayers] }]
    : gs.tribes.filter(t => t.members.length > 0);

  tribeGroups.forEach(tribe => {
    if (!gs.tribeFood[tribe.name] && gs.tribeFood[tribe.name] !== 0) gs.tribeFood[tribe.name] = 60;
    const decay = decayMin + Math.random() * (decayMax - decayMin);
    gs.tribeFood[tribe.name] = Math.max(0, gs.tribeFood[tribe.name] - decay);
  });

  // ── 2. Provider/slacker calculation ──
  gs.currentProviders = [];
  gs.currentSlackers = [];
  if (!gs.providerHistory) gs.providerHistory = {};

  tribeGroups.forEach(tribe => {
    const members = tribe.members.filter(m => gs.activePlayers.includes(m));
    if (!members.length) return;

    // Calculate contributions
    const contributions = members.map(name => {
      const s = pStats(name);
      const willingness = s.loyalty * 0.3 + s.social * 0.3 + (10 - s.boldness) * 0.1;
      const ability = s.endurance * 0.3 + s.physical * 0.2;
      const contribution = (willingness + ability) * 0.5 + (Math.random() * 1.5 - 0.75);
      return { name, contribution };
    });

    const avg = contributions.reduce((s, c) => s + c.contribution, 0) / contributions.length;

    contributions.forEach(({ name, contribution }) => {
      const isProvider = contribution > avg;
      const isSlacker = contribution < avg;
      const diff = Math.abs(contribution - avg);

      if (isProvider) {
        gs.currentProviders.push(name);
        gs.providerHistory[name] = (gs.providerHistory[name] || 0) + 1;
        // Provider adds extra to tribe food
        gs.tribeFood[tribe.name] = Math.min(100, gs.tribeFood[tribe.name] + diff * 0.5);
        // Provider bond boost with tribemates
        members.filter(m => m !== name).forEach(m => addBond(m, name, diff * 0.03));
        // Energy cost — providing is exhausting
        gs.survival[name] = Math.max(0, (gs.survival[name] || 80) - contribution * 0.3);
      } else if (isSlacker) {
        gs.currentSlackers.push(name);
        // Slacker drags tribe food down
        gs.tribeFood[tribe.name] = Math.max(0, gs.tribeFood[tribe.name] - diff * 0.3);
        // Slacker bond decay with non-slackers
        members.filter(m => m !== name && !gs.currentSlackers.includes(m)).forEach(m => addBond(m, name, -0.1));
        // Energy conservation — resting preserves survival
        gs.survival[name] = Math.min(100, (gs.survival[name] || 80) + diff * 0.2);
      }
    });

    // ── 3. Player survival sync toward tribe food ──
    members.forEach(name => {
      if (!gs.survival[name] && gs.survival[name] !== 0) gs.survival[name] = 80;
      const s = pStats(name);
      const tribeFood = gs.tribeFood[tribe.name] || 0;
      const shift = (tribeFood - gs.survival[name]) * 0.3 + s.endurance * 0.2;
      gs.survival[name] = Math.max(0, Math.min(100, gs.survival[name] + shift));
    });
  });

  // ── 4. Save provider/slacker data to episode ──
  ep.providerSlackerData = { providers: [...gs.currentProviders], slackers: [...gs.currentSlackers] };
  ep.survivalSnapshot = { ...gs.survival };
  ep.tribeFoodSnapshot = { ...gs.tribeFood };
}
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: add updateSurvival core function — decay, provider/slacker, sync"
```

---

### Task 3: Survival camp events — provider, slacker, food crisis, collapse, medevac

**Files:**
- Modify: `simulator.html` — add `generateSurvivalEvents(ep)` function after `updateSurvival`

- [ ] **Step 1: Add the survival events function**

Insert after `updateSurvival`:

```js
function generateSurvivalEvents(ep) {
  if (seasonConfig.foodWater !== 'enabled') return;
  const difficulty = seasonConfig.survivalDifficulty || 'casual';
  const _pick = (arr, seed) => arr[([...seed].reduce((a,c)=>a+c.charCodeAt(0),0)+(gs.episode||0)*7)%arr.length];

  const tribeGroups = gs.isMerged
    ? [{ name: gs.mergeName || 'merge', members: [...gs.activePlayers] }]
    : gs.tribes.filter(t => t.members.length > 0);

  tribeGroups.forEach(tribe => {
    const members = tribe.members.filter(m => gs.activePlayers.includes(m));
    if (!members.length) return;
    const campKey = tribe.name;
    if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
    const tribeFood = gs.tribeFood[campKey] || 0;
    const providers = members.filter(m => gs.currentProviders.includes(m));
    const slackers = members.filter(m => gs.currentSlackers.includes(m));

    // ── Provider events ──
    if (providers.length && tribeFood < 70 && Math.random() < 0.35) {
      const provider = providers[Math.floor(Math.random() * providers.length)];
      const pr = pronouns(provider);
      const isFishing = Math.random() < 0.5;
      if (isFishing) {
        gs.tribeFood[campKey] = Math.min(100, tribeFood + 8);
        gs.survival[provider] = Math.max(0, (gs.survival[provider] || 80) + 5);
        members.filter(m => m !== provider).forEach(m => addBond(m, provider, 0.5));
        ep.campEvents[campKey].pre.push({ type: 'providerFishing', players: [provider],
          text: _pick([
            `${provider} is up before dawn, waist-deep in the ocean with a makeshift spear. Two hours later, ${pr.sub} ${pr.sub==='they'?'come':'comes'} back with three fish. The tribe eats tonight.`,
            `Nobody asked ${provider} to go fishing. ${pr.Sub} just went. Came back with enough to feed the camp. ${pr.Sub} didn't say a word about it — didn't need to. Everyone saw.`,
            `${provider} catches a fish the size of ${pr.pos} forearm. The camp erupts. It's been two days since anyone had protein. ${pr.Sub} ${pr.sub==='they'?'grin':'grins'}: "Dinner's on me."`,
          ], provider + 'fishing'), badgeText: 'PROVIDER', badgeClass: 'gold' });
      } else {
        gs.tribeFood[campKey] = Math.min(100, tribeFood + 5);
        members.filter(m => m !== provider).forEach(m => addBond(m, provider, 0.3));
        ep.campEvents[campKey].pre.push({ type: 'providerForaging', players: [provider],
          text: _pick([
            `${provider} disappears into the jungle and comes back with an armful of coconuts and wild fruit. Not glamorous, but it keeps the tribe going.`,
            `While everyone else debates strategy, ${provider} is out collecting firewood and cracking coconuts. ${pronouns(provider).Sub} ${pronouns(provider).sub==='they'?'know':'knows'} what actually matters out here.`,
          ], provider + 'forage'), badgeText: 'FORAGING', badgeClass: 'gold' });
      }
    }

    // Provider praised (tribe food < 60, separate from fishing/foraging)
    if (providers.length && tribeFood < 60 && Math.random() < 0.3) {
      const provider = providers[Math.floor(Math.random() * providers.length)];
      const pr = pronouns(provider);
      members.filter(m => m !== provider).forEach(m => addBond(m, provider, 0.3));
      ep.campEvents[campKey].pre.push({ type: 'providerPraised', players: [provider],
        text: _pick([
          `"I don't know what we'd do without ${provider}," someone says at the fire. Nobody disagrees. ${pr.Sub} ${pr.sub==='they'?'have':'has'} been carrying this camp.`,
          `The tribe is running on fumes — but ${provider} keeps showing up. Fishing, firewood, water runs. ${pr.Sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} complain. The tribe notices.`,
        ], provider + 'praised'), badgeText: 'PRAISED', badgeClass: 'gold' });
    }

    // ── Slacker events ──
    if (slackers.length && tribeFood < 50) {
      const slacker = slackers[Math.floor(Math.random() * slackers.length)];
      const spr = pronouns(slacker);
      const sS = pStats(slacker);
      // Find a bold/hothead caller
      const callers = members.filter(m => m !== slacker && (pStats(m).boldness >= 5 || pStats(m).temperament <= 5));
      if (callers.length && Math.random() < 0.35) {
        const caller = callers[Math.floor(Math.random() * callers.length)];
        const cPr = pronouns(caller);
        const cS = pStats(caller);
        const isEscalated = cS.boldness >= 7 || cS.temperament <= 3;
        addBond(caller, slacker, isEscalated ? -1.5 : -1.0);
        ep.campEvents[campKey].pre.push({ type: isEscalated ? 'slackerConfrontation' : 'slackerCalledOut',
          players: [caller, slacker],
          text: isEscalated ? _pick([
            `${caller} finally snaps. "We're out here starving and ${slacker} is lying in the shelter doing NOTHING. I'm done carrying ${spr.obj}." ${slacker} ${sS.temperament <= 4 ? `fires back: "You want to go? Let's go."` : `says nothing. The silence is worse.`}`,
            `${caller} throws a coconut shell at the shelter wall. "Get up. We need water. We need firewood. We need someone who actually DOES something." ${slacker} doesn't move. ${caller} walks away shaking ${cPr.pos} head.`,
          ], caller + slacker + 'escalated') : _pick([
            `${caller} pulls ${slacker} aside: "People are noticing that you don't help around camp. It's going to be a problem." ${slacker} shrugs. That shrug costs ${spr.obj} more than ${spr.sub} ${spr.sub==='they'?'know':'knows'}.`,
            `"Hey ${slacker}, when's the last time you went to the well?" ${caller} asks it casually, but the message is clear. The tribe is watching who works and who doesn't.`,
          ], caller + slacker + 'callout'),
          badgeText: isEscalated ? 'CONFRONTATION' : 'CALLED OUT', badgeClass: 'red' });
      }
    }

    // ── Slacker bonding (lazy alliance) ──
    if (slackers.length >= 2 && Math.random() < 0.4) {
      const [s1, s2] = slackers.slice(0, 2);
      addBond(s1, s2, 0.2);
      ep.campEvents[campKey].pre.push({ type: 'slackerBonding', players: [s1, s2],
        text: _pick([
          `While the rest of the tribe hauls water, ${s1} and ${s2} are sitting in the shelter comparing bug bites. Nobody says anything. But everyone notices.`,
          `${s1} and ${s2} have found a rhythm: wake up late, eat whatever's left, avoid eye contact with the people working. It's not a strategy. It's a lifestyle. And somehow, it's working.`,
          `"You know what? Let them fish," ${s1} says to ${s2}. "We'll handle the strategy." ${s2} nods. Neither of them has handled any strategy either. But at least they have each other.`,
        ], s1 + s2 + 'lazy'), badgeText: 'LAZY ALLIANCE', badgeClass: 'green' });
    }

    // ── Food crisis events ──
    if (tribeFood < 40 && Math.random() < 0.3) {
      const fighters = members.filter(m => getBond(m, members.find(o => o !== m && getBond(m, o) < 0) || '') < 0);
      if (fighters.length >= 2) {
        const [f1, f2] = fighters.slice(0, 2);
        addBond(f1, f2, -1.5);
        ep.campEvents[campKey].pre.push({ type: 'foodConflict', players: [f1, f2],
          text: _pick([
            `The rice is almost gone. ${f1} catches ${f2} taking a second scoop. "That's not yours." What follows isn't pretty.`,
            `${f1} and ${f2} argue over who ate the last of the coconut. It's not about the coconut. It's about everything. The hunger makes everything worse.`,
          ], f1 + f2 + 'food'), badgeText: 'FOOD FIGHT', badgeClass: 'red' });
      }
    }

    // Food hoarding (tribe food < 50, low loyalty player)
    if (tribeFood < 50) {
      const hoarders = members.filter(m => pStats(m).loyalty <= 4 && Math.random() < 0.1);
      const discoverers = members.filter(m => pStats(m).intuition >= 6 && !hoarders.includes(m));
      if (hoarders.length && discoverers.length) {
        const hoarder = hoarders[0], discoverer = discoverers[0];
        addBond(discoverer, hoarder, -2.0);
        members.filter(m => m !== hoarder).forEach(m => addBond(m, hoarder, -1.0));
        ep.campEvents[campKey].pre.push({ type: 'foodHoarding', players: [discoverer, hoarder],
          text: _pick([
            `${discoverer} finds a stash of coconut meat hidden under ${hoarder}'s bag. The look on ${pronouns(discoverer).pos} face says everything. ${hoarder} has been stealing from the tribe.`,
            `${discoverer} catches ${hoarder} sneaking food from the supply at night. Word spreads by morning. The tribe is furious.`,
          ], hoarder + discoverer + 'hoard'), badgeText: 'HOARDING', badgeClass: 'red' });
      }
    }

    // Starvation bond (tribe food < 35, two players with bond >= 1)
    if (tribeFood < 35) {
      const bondPairs = [];
      for (let i = 0; i < members.length; i++) for (let j = i+1; j < members.length; j++) {
        if (getBond(members[i], members[j]) >= 1) bondPairs.push([members[i], members[j]]);
      }
      if (bondPairs.length && Math.random() < 0.3) {
        const [a, b] = bondPairs[Math.floor(Math.random() * bondPairs.length)];
        addBond(a, b, 1.0);
        ep.campEvents[campKey].pre.push({ type: 'starvationBond', players: [a, b],
          text: _pick([
            `${a} and ${b} sit by a dying fire, splitting the last handful of rice between them. Nobody speaks. They don't need to. Hunger has a way of stripping everything down to what matters.`,
            `It's been two days since the tribe had a real meal. ${a} and ${b} share a coconut in silence. The game feels very far away right now.`,
          ], a + b + 'starve'), badgeText: 'SHARED SUFFERING', badgeClass: 'green' });
      }
    }

    // Food rationing (tribe food < 50, strategic player manages)
    if (tribeFood < 50) {
      const strategists = members.filter(m => pStats(m).strategic >= 7 && Math.random() < 0.2);
      if (strategists.length) {
        const mgr = strategists[0];
        gs.tribeFood[campKey] = Math.min(100, tribeFood + 3);
        members.filter(m => m !== mgr).forEach(m => addBond(m, mgr, 0.5));
        ep.campEvents[campKey].pre.push({ type: 'foodRationing', players: [mgr],
          text: _pick([
            `${mgr} takes charge of the food. "We portion this out or we starve in three days." Nobody argues. ${pronouns(mgr).Sub} ${pronouns(mgr).sub==='they'?'count':'counts'} every grain of rice.`,
            `${mgr} implements a rationing system. Equal portions, no exceptions. The tribe doesn't love it — but they're still eating on day ${ep.num * 3}.`,
          ], mgr + 'ration'), badgeText: 'RATIONING', badgeClass: 'gold' });
      }
    }

    // ── Food crisis (tribe food < 20) ──
    if (tribeFood < 20) {
      members.forEach(m => {
        const state = gs.playerStates[m] || {};
        if (state.emotional !== 'paranoid') state.emotional = 'desperate';
        gs.playerStates[m] = state;
      });
      ep.campEvents[campKey].pre.push({ type: 'foodCrisis', players: members.slice(0, 3),
        text: _pick([
          `The rice is gone. The coconuts are gone. The tribe sits in silence, too tired to strategize, too hungry to sleep. This is what the game looks like when the island wins.`,
          `Day ${ep.num * 3}. No food left. The fire went out and nobody has the energy to restart it. Eyes are hollow. Conversations have stopped. The game is secondary now — survival is the game.`,
        ], campKey + 'crisis'), badgeText: 'FOOD CRISIS', badgeClass: 'red' });
    }

    // ── Collapse warning (survival < 25, realistic/brutal only) ──
    if (difficulty !== 'casual') {
      members.forEach(name => {
        const surv = gs.survival[name] || 0;
        if (surv < 25 && !gs.collapseWarning?.[name]) {
          if (!gs.collapseWarning) gs.collapseWarning = {};
          gs.collapseWarning[name] = ep.num || epNum;
          const pr = pronouns(name);
          const s = pStats(name);
          ep.campEvents[campKey].pre.push({ type: 'survivalCollapse', players: [name],
            text: _pick([
              `${name} collapses at the water well. ${pr.Sub} ${pr.sub==='they'?'try':'tries'} to stand — legs buckle. The tribe rushes over. ${s.temperament >= 7 ? `"I'm fine," ${pr.sub} ${pr.sub==='they'?'say':'says'}. ${pr.Sub} ${pr.sub==='they'?'are':'is'}n't fine.` : `${pr.Sub} can't hide it anymore. The body is giving out.`}`,
              `${name}'s hands are shaking too hard to hold a coconut. ${pr.Sub} ${pr.sub==='they'?'haven\'t':'hasn\'t'} eaten properly in days. The medical team is called for a check. ${s.social >= 7 ? `"Don't pull me. Please. I can do this." The medic hesitates.` : `The tribe watches in silence. Nobody knows what to say.`}`,
              `In the middle of a conversation, ${name} goes pale and sits down hard. ${pr.Sub} ${pr.sub==='they'?'stare':'stares'} at the ground, breathing heavy. This isn't strategy. This isn't the game. This is the island saying: you're running out of time.`,
            ], name + 'collapse'), badgeText: 'COLLAPSE', badgeClass: 'red' });
          // Empathetic tribemates bond
          members.filter(m => m !== name && getBond(m, name) >= 0).forEach(m => addBond(m, name, 0.5));
        }
      });
    }

    // ── Medevac (survival < 15, post-collapse, realistic/brutal) ──
    if (difficulty !== 'casual') {
      const medevacChance = difficulty === 'brutal' ? 0.12 : 0.05;
      members.forEach(name => {
        const surv = gs.survival[name] || 0;
        const collapseEp = gs.collapseWarning?.[name];
        if (surv < 15 && collapseEp && (ep.num || epNum) > collapseEp && Math.random() < medevacChance) {
          // MEDEVAC FIRES
          const pr = pronouns(name);
          const isPostMerge = gs.isMerged;

          ep.campEvents[campKey].pre.push({ type: 'medevac', players: [name],
            text: _pick([
              `The medical team arrives at dawn. ${name} is pulled from the game. ${pr.Sub} ${pr.sub==='they'?'fight':'fights'} it — of course ${pr.sub} ${pr.sub==='they'?'do':'does'} — but the decision is made. The stretcher. The helicopter. The game goes on without ${pr.obj}.`,
              `${name} can't stand up this morning. The tribe gathers around as the medics check vitals. The verdict comes fast: "${name} is done." ${pr.Sub} ${pr.sub==='they'?'cry':'cries'}. The tribe cries. This is the part of Survivor nobody wants to see.`,
            ], name + 'medevac'), badgeText: 'MEDEVAC', badgeClass: 'red' });

          // Remove from game
          gs.activePlayers = gs.activePlayers.filter(p => p !== name);
          tribe.members = tribe.members.filter(p => p !== name);
          gs.eliminated.push(name);
          if (isPostMerge) gs.jury.push(name); // post-merge: goes to jury
          // Track medevac
          if (!gs.medevacs) gs.medevacs = [];
          gs.medevacs.push({ name, ep: ep.num || epNum, survival: surv, postMerge: isPostMerge });
          ep.medevac = { name, survival: surv, postMerge: isPostMerge };
          // Tribe morale boost (shared trauma)
          members.filter(m => m !== name && gs.activePlayers.includes(m)).forEach(m => {
            members.filter(o => o !== name && o !== m && gs.activePlayers.includes(o)).forEach(o => addBond(m, o, 0.5));
          });
          // Provider medevac = food crisis
          if (gs.currentProviders.includes(name)) {
            gs.tribeFood[campKey] = Math.max(0, (gs.tribeFood[campKey] || 0) - 15);
          }
        }
      });
    }

    // ── Provider voted out aftermath (from previous episode) ──
    if (gs.providerVotedOutLastEp?.tribeName === campKey) {
      gs.tribeFood[campKey] = Math.max(0, (gs.tribeFood[campKey] || 0) - 15);
      const provider = gs.providerVotedOutLastEp.name;
      ep.campEvents[campKey].pre.push({ type: 'providerVotedOut', players: members.slice(0, 3),
        text: _pick([
          `The camp feels different without ${provider}. Nobody's fishing. Nobody's starting the fire at dawn. The tribe voted out the one person who kept them fed — and now the island is collecting the debt.`,
          `First morning without ${provider}. The rice is almost gone and nobody knows how to catch fish. "We really messed up," someone mutters. The silence that follows is deafening.`,
        ], provider + 'gone'), badgeText: 'FOOD CRISIS', badgeClass: 'red' });
      gs.providerVotedOutLastEp = null; // consume
    }
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: add generateSurvivalEvents — provider/slacker/crisis/collapse/medevac"
```

---

### Task 4: Wire `updateSurvival` and `generateSurvivalEvents` into episode flow

**Files:**
- Modify: `simulator.html` — `simulateEpisode()` function
- Modify: `simulator.html` — `generateCampEvents()` function

- [ ] **Step 1: Call updateSurvival after updatePlayerStates**

Find the main `updatePlayerStates(ep); decayAllianceTrust(ep.num); recoverBonds(ep);` line in `simulateEpisode()`. There are multiple instances — add after EACH one:

```js
    updateSurvival(ep);
```

Search for `updatePlayerStates(ep);` and add `updateSurvival(ep);` right after each occurrence. There should be 4-6 instances.

- [ ] **Step 2: Call generateSurvivalEvents in generateCampEvents**

In `generateCampEvents`, find the `post` phase block. Right BEFORE `checkParanoiaSpiral(ep);`, add:

```js
    // Survival events — provider/slacker/food crisis
    generateSurvivalEvents(ep);
```

Also in the `both` phase block, right BEFORE `checkParanoiaSpiral(ep);`, add:

```js
    generateSurvivalEvents(ep);
```

- [ ] **Step 3: Track provider voted out for next-episode aftermath**

Find all elimination paths. In each place where `ep.eliminated` is set AND the player is removed from `gs.activePlayers`, add a check for provider status. The cleanest approach is to add this right after `handleAdvantageInheritance` is called:

Search for `handleAdvantageInheritance(ep.eliminated` (the main elimination path). Right after it, add:

```js
    // Track if a provider was voted out (for food crisis next episode)
    if (seasonConfig.foodWater === 'enabled' && gs.currentProviders?.includes(ep.eliminated)) {
      const _elimTribe = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(ep.eliminated))?.name || '');
      gs.providerVotedOutLastEp = { name: ep.eliminated, tribeName: _elimTribe };
    }
```

Note: there are multiple elimination paths. Add this check to the MAIN one first. Other paths (rock draw, twist eliminations) can be handled later if needed.

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: wire survival mechanics into episode flow"
```

---

### Task 5: Challenge stat penalties from low survival

**Files:**
- Modify: `simulator.html` — `simulateIndividualChallenge()` and `simulateTribeChallenge()`

- [ ] **Step 1: Add survival penalty to individual challenges**

In `simulateIndividualChallenge`, find the scoring line:

```js
      return { name, score: base - fatigue - injPenalty + (Math.random()*8-4) };
```

Add a survival penalty calculation BEFORE it and include it in the score:

```js
      // Survival penalty: starving players perform worse
      let survPenalty = 0;
      if (seasonConfig.foodWater === 'enabled' && gs.survival) {
        const surv = gs.survival[name] || 80;
        if (surv < 70) survPenalty = 0.5;
        else if (surv < 50) survPenalty = 1.0;
        else if (surv < 35) survPenalty = 1.5;
        else if (surv < 20) survPenalty = 2.0;
      }
      return { name, score: base - fatigue - injPenalty - survPenalty + (Math.random()*8-4) };
```

Wait — the threshold approach violates the stat philosophy ("ALWAYS proportional"). Use proportional instead:

```js
      // Survival penalty: proportional — every point below 70 matters
      const survPenalty = (seasonConfig.foodWater === 'enabled' && gs.survival)
        ? Math.max(0, (70 - (gs.survival[name] || 80)) * 0.03) // survival 70=0, 50=-0.6, 30=-1.2, 10=-1.8
        : 0;
      return { name, score: base - fatigue - injPenalty - survPenalty + (Math.random()*8-4) };
```

- [ ] **Step 2: Add survival penalty to tribe challenges**

Find `simulateTribeChallenge`. Find where individual member scores are calculated. Add the same survival penalty:

```js
      const survPenalty = (seasonConfig.foodWater === 'enabled' && gs.survival)
        ? Math.max(0, (70 - (gs.survival[name] || 80)) * 0.03)
        : 0;
```

And subtract it from the member's score.

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: survival stat penalties in challenge scoring (proportional)"
```

---

### Task 6: computeHeat integration — provider/slacker heat modifiers

**Files:**
- Modify: `simulator.html` — `computeHeat()` function

- [ ] **Step 1: Add provider/slacker heat**

In `computeHeat`, find the stolen credit heat line:

```js
  if (gs.stolenCreditHeat?.player === name && gs.stolenCreditHeat.ep >= ((gs.episode || 0) + 1) - 1) heat += 0.3;
```

Add right after it:

```js
  // Survival: provider protection + slacker resentment + villain/schemer targeting providers
  if (seasonConfig.foodWater === 'enabled') {
    if (gs.currentProviders?.includes(name)) {
      // Villains/schemers target providers, everyone else protects them
      const _villSchem = tribalPlayers.filter(p => {
        const a = players.find(x => x.name === p)?.archetype || '';
        return a === 'villain' || a === 'schemer';
      }).length;
      const _protectors = tribalPlayers.filter(p => p !== name).length - _villSchem;
      heat += _villSchem * 0.5 - _protectors * 0.05; // net protection unless many villains
      heat -= 0.3; // base provider protection
    }
    if (gs.currentSlackers?.includes(name)) {
      // Non-slackers resent slackers
      const _nonSlackers = tribalPlayers.filter(p => p !== name && !gs.currentSlackers?.includes(p)).length;
      heat += _nonSlackers * 0.04; // proportional to how many people are annoyed
    }
  }
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: provider/slacker heat modifiers in computeHeat"
```

---

### Task 7: Jury scoring — provider bonus

**Files:**
- Modify: `simulator.html` — `simulateJuryVote()` and `projectJuryVotes()`

- [ ] **Step 1: Add provider bonus to simulateJuryVote**

In `simulateJuryVote`, find the `_socialBreadth` line. Add right after it:

```js
      // Provider bonus: camp workhorse respected by jury
      const _providerEps = gs.providerHistory?.[f] || 0;
      const _providerBonus = Math.min(0.4, _providerEps * 0.04); // 5 eps = 0.2, 10 = 0.4
```

Then add `+ _providerBonus` to the `personal` calculation line.

- [ ] **Step 2: Add provider bonus to projectJuryVotes**

Same change in `projectJuryVotes` — add `_providerBonus` after `_socialBreadth` and add to `personal`.

- [ ] **Step 3: Add provider jury reasoning**

In `simulateJuryVote`, in the jury reasoning chain, add a new branch after the `_jrPosJurorBonds >= 5` block and before `_jrBond >= 1`:

```js
    } else if ((gs.providerHistory?.[pick] || 0) >= 5) {
      _jrReason = _jrPick([
        `${pick} fed this tribe. While everyone else was scheming, ${_jrFp.sub} ${_jrFp.sub==='they'?'were':'was'} fishing, foraging, keeping the fire alive. That matters. That's real.`,
        `I watched ${pick} work every single day. Camp wasn't glamorous, but it kept us alive. The jury remembers who carried the weight.`,
        `${pick} didn't just play the game — ${_jrFp.sub} kept us FED. Try thinking strategically on an empty stomach. ${pick} made that possible for all of us.`,
      ]);
```

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: provider jury bonus + reasoning"
```

---

### Task 8: VP — Tribe food bar on camp screens + player survival hover

**Files:**
- Modify: `simulator.html` — `rpBuildCampTribe()` function

- [ ] **Step 1: Add tribe food bar at top of camp screen**

In `rpBuildCampTribe`, find where the camp screen header is built. Right after the tribe name/label section, add the food bar. Search for `const phaseLabel =` in rpBuildCampTribe. After the header div is opened but before the events are rendered, add:

```js
  // ── Survival: Tribe Food Bar ──
  if (seasonConfig.foodWater === 'enabled') {
    const _tf = ep.tribeFoodSnapshot?.[tribeName] ?? gs.tribeFood?.[tribeName] ?? 60;
    const _tfLabel = _tf >= 80 ? 'Well-Fed' : _tf >= 60 ? 'Comfortable' : _tf >= 40 ? 'Hungry' : _tf >= 20 ? 'Starving' : 'Critical';
    const _tfColor = _tf >= 80 ? '#3fb950' : _tf >= 60 ? '#58a6ff' : _tf >= 40 ? '#e3b341' : _tf >= 20 ? '#f0883e' : '#da3633';
    html += `<div style="margin-bottom:12px;padding:8px 12px;background:rgba(139,148,158,0.04);border:1px solid rgba(139,148,158,0.08);border-radius:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:#8b949e">TRIBE FOOD</span>
        <span style="font-size:10px;font-weight:700;color:${_tfColor}">${_tfLabel}</span>
      </div>
      <div style="height:6px;background:rgba(139,148,158,0.15);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${Math.round(_tf)}%;background:${_tfColor};border-radius:3px;transition:width 0.4s"></div>
      </div>
    </div>`;
  }
```

- [ ] **Step 2: Add player survival to portrait hover**

Find the `rpPortrait` function. It generates player portrait HTML. We need to add a `title` attribute with survival info when on camp screens. However, `rpPortrait` doesn't know if it's on a camp screen. 

Instead, add the tooltip in `rpBuildCampTribe` where member portraits are rendered. Find where member portraits are shown in the camp screen — search for the member grid/list. Add a `title` attribute to each portrait wrapper:

The simplest approach: after the tribe food bar, add a small member survival summary section:

```js
  // ── Survival: Member status (shown when food system enabled) ──
  if (seasonConfig.foodWater === 'enabled' && ep.survivalSnapshot) {
    const _surv = ep.survivalSnapshot;
    const _memberSurvival = members.filter(m => _surv[m] !== undefined).sort((a, b) => (_surv[a] || 0) - (_surv[b] || 0));
    if (_memberSurvival.length) {
      html += `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">`;
      _memberSurvival.forEach(m => {
        const sv = Math.round(_surv[m] || 0);
        const svColor = sv >= 70 ? '#3fb950' : sv >= 50 ? '#58a6ff' : sv >= 35 ? '#e3b341' : sv >= 20 ? '#f0883e' : '#da3633';
        const isProvider = ep.providerSlackerData?.providers?.includes(m);
        const isSlacker = ep.providerSlackerData?.slackers?.includes(m);
        const roleIcon = isProvider ? '🐟' : isSlacker ? '💤' : '';
        html += `<div style="display:flex;align-items:center;gap:4px;padding:2px 6px;background:rgba(139,148,158,0.04);border-radius:4px;border:1px solid rgba(139,148,158,0.08)" title="Survival: ${sv}/100${isProvider ? ' (Provider)' : isSlacker ? ' (Slacker)' : ''}">
          ${rpPortrait(m, 'xs')}
          <span style="font-size:9px;color:${svColor};font-weight:700;font-family:var(--font-mono)">${sv}</span>
          ${roleIcon ? `<span style="font-size:8px">${roleIcon}</span>` : ''}
        </div>`;
      });
      html += `</div>`;
    }
  }
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: VP tribe food bar + player survival display on camp screens"
```

---

### Task 9: Badge rendering + episode history + merge food transfer

**Files:**
- Modify: `simulator.html` — badge text/class chains in `rpBuildCampTribe()`
- Modify: `simulator.html` — episode history push
- Modify: `simulator.html` — merge handling (transfer tribe food to merged pool)

- [ ] **Step 1: Add badge text entries**

In the badge text chain, add near the other camp event badges:

```js
                     : evt.type === 'providerFishing'           ? (evt.badgeText || 'PROVIDER')
                     : evt.type === 'providerForaging'          ? (evt.badgeText || 'FORAGING')
                     : evt.type === 'providerPraised'           ? (evt.badgeText || 'PRAISED')
                     : evt.type === 'slackerCalledOut'          ? (evt.badgeText || 'CALLED OUT')
                     : evt.type === 'slackerConfrontation'      ? (evt.badgeText || 'CONFRONTATION')
                     : evt.type === 'slackerBonding'            ? (evt.badgeText || 'LAZY ALLIANCE')
                     : evt.type === 'foodConflict'              ? (evt.badgeText || 'FOOD FIGHT')
                     : evt.type === 'foodHoarding'              ? (evt.badgeText || 'HOARDING')
                     : evt.type === 'starvationBond'            ? (evt.badgeText || 'SHARED SUFFERING')
                     : evt.type === 'foodRationing'             ? (evt.badgeText || 'RATIONING')
                     : evt.type === 'foodCrisis'                ? (evt.badgeText || 'FOOD CRISIS')
                     : evt.type === 'survivalCollapse'          ? (evt.badgeText || 'COLLAPSE')
                     : evt.type === 'medevac'                   ? (evt.badgeText || 'MEDEVAC')
                     : evt.type === 'providerVotedOut'          ? (evt.badgeText || 'FOOD CRISIS')
```

- [ ] **Step 2: Add badge class entries**

```js
                     : evt.type === 'providerFishing' || evt.type === 'providerForaging' || evt.type === 'providerPraised' ? 'gold'
                     : evt.type === 'foodRationing' ? 'gold'
                     : evt.type === 'slackerBonding' || evt.type === 'starvationBond' ? 'green'
                     : evt.type === 'slackerCalledOut' || evt.type === 'slackerConfrontation' || evt.type === 'foodConflict' || evt.type === 'foodHoarding' || evt.type === 'foodCrisis' || evt.type === 'survivalCollapse' || evt.type === 'medevac' || evt.type === 'providerVotedOut' ? 'red'
```

- [ ] **Step 3: Add to spotTypes**

Find `const spotTypes = new Set([`. Add survival event types:

```js
'providerFishing','providerForaging','providerPraised','slackerCalledOut','slackerConfrontation','slackerBonding','foodConflict','foodHoarding','starvationBond','foodRationing','foodCrisis','survivalCollapse','medevac','providerVotedOut',
```

- [ ] **Step 4: Add survival fields to episode history**

Find `patchEpisodeHistory` or the main `gs.episodeHistory.push({` block. Add:

```js
    survivalSnapshot: ep.survivalSnapshot || null,
    tribeFoodSnapshot: ep.tribeFoodSnapshot || null,
    providerSlackerData: ep.providerSlackerData || null,
    medevac: ep.medevac || null,
```

- [ ] **Step 5: Merge food transfer**

Find where the merge happens. Search for `gs.isMerged = true`. After tribes are merged, add:

```js
  // Transfer tribe food to merged pool — average of pre-merge tribes
  if (seasonConfig.foodWater === 'enabled' && gs.tribeFood) {
    const _preMergeFoods = Object.values(gs.tribeFood).filter(v => v > 0);
    const _avgFood = _preMergeFoods.length ? _preMergeFoods.reduce((s, v) => s + v, 0) / _preMergeFoods.length : 60;
    gs.tribeFood = { [gs.mergeName || 'merge']: _avgFood + 30 }; // +30 merge feast bonus
  }
```

- [ ] **Step 6: Commit**

```bash
git add simulator.html
git commit -m "feat: survival badges, episode history, merge food transfer"
```

---

### Task 10: Update CLAUDE.md + ideas backlog

**Files:**
- Modify: `CLAUDE.md`
- Modify: `DATA_SEASON/ideas_probabilistic_moments.txt`

- [ ] **Step 1: Update CLAUDE.md**

Add to Key Engine Functions section:

```
- `updateSurvival()` — per-episode tribe food decay, provider/slacker calculation, player survival sync, energy cost/savings
- `generateSurvivalEvents()` — survival camp events: provider fishing/foraging/praised, slacker callout/confrontation/bonding, food conflict/hoarding/rationing/crisis, collapse warning, medevac
```

Add to State section:

```
- `gs.survival[name]` — 0-100, per-player survival level
- `gs.tribeFood[tribeName]` — 0-100, per-tribe food reserve
- `gs.currentProviders` / `gs.currentSlackers` — arrays of player names this episode
- `gs.providerHistory[name]` — count of episodes as provider (feeds jury scoring)
- `gs.collapseWarning[name]` — episode number of collapse event (medevac fires next episode)
- `gs.medevacs` — array of medevac records for season stats
- `gs.providerVotedOutLastEp` — `{ name, tribeName }` — triggers food crisis camp event next episode
```

- [ ] **Step 2: Mark DONE in ideas backlog**

In `DATA_SEASON/ideas_probabilistic_moments.txt`, change `[TODO] SURVIVAL MECHANICS ENGINE` to `[DONE]` with implementation summary.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md DATA_SEASON/ideas_probabilistic_moments.txt
git commit -m "docs: survival mechanics in CLAUDE.md + ideas backlog"
```
