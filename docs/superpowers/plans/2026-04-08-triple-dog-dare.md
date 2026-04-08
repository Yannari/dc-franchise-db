# Triple Dog Dare You — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a post-merge sudden-death elimination challenge where players dare each other, trade freebies, form pacts, and the first player to fail a dare is eliminated — no tribal council.

**Architecture:** Single new engine function `simulateTripleDogDare(ep)` handles all dare logic, freebie economy, pact formation, and elimination. Follows the `simulateSlasherNight(ep)` pattern — called from `simulateEpisode` when `ep.isTripleDogDare` is set, replaces both immunity challenge and tribal. VP uses round-by-round click-to-reveal similar to voting screens. All code in `simulator.html`.

**Tech Stack:** Vanilla JS, single-file architecture (simulator.html)

**Reference patterns:** 
- Engine: `simulateSlasherNight(ep)` (~line 6435) — episode flow, elimination handling, history push
- Twist catalog: `TWIST_CATALOG` (~line 1588) — entry format
- VP: `rpBuildSlasherRounds(ep)` (~line 45284) — click-to-reveal round presentation
- Episode flow: `ep.isSlasherNight` block (~line 20901) — pre-challenge setup, post-elimination cleanup

---

### Task 1: Twist Catalog Entry + Episode Flag

**Files:**
- Modify: `simulator.html` — `TWIST_CATALOG` array (~line 1588), `applyTwist()` (~line 9998)

- [ ] **Step 1: Add TWIST_CATALOG entry**

Add after the `slasher-night` entry (~line 1618):

```javascript
{ id:'triple-dog-dare', emoji:'🎯', name:'Triple Dog Dare', category:'elim', phase:'post-merge', desc:'Eliminated players dare the tribe. Accept to earn freebies, redirect to spend them. Run out of freebies and fail a dare? You\'re out. No tribal council.', engineType:'triple-dog-dare' },
```

- [ ] **Step 2: Add applyTwist handler**

In `applyTwist()`, find the `} else if (engineType === 'slasher-night') {` block (~line 10452). Add a new block after it:

```javascript
} else if (engineType === 'triple-dog-dare') {
  // Post-merge only; need at least 4 players for meaningful dare economy
  if (!gs.isMerged || gs.activePlayers.length < 4) return;
  ep.isTripleDogDare = true;
```

- [ ] **Step 3: Add to special episode type guards**

Find the exile guard (~line 20519):
```javascript
if (ep.isMultiTribal || ep.isDoubleTribal || ep.isSlasherNight || ep.isSuddenDeath) return;
```
Add `ep.isTripleDogDare` to this check:
```javascript
if (ep.isMultiTribal || ep.isDoubleTribal || ep.isSlasherNight || ep.isSuddenDeath || ep.isTripleDogDare) return;
```

Search for ALL similar guards in the file (there are several — search for `isSlasherNight` and add `ep.isTripleDogDare` alongside each occurrence that acts as a guard/skip condition). Key locations:
- Exile format guard (~line 20519)
- Text backlog tribal skip (~line 26205): `if (!ep.votingLog?.length || ep.multiTribalResults?.length || ep.isSlasherNight)` → add `|| ep.isTripleDogDare`

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: add Triple Dog Dare twist catalog entry and episode flag"
```

---

### Task 2: Dare Pool Constants

**Files:**
- Modify: `simulator.html` — add constants near the top of the engine section (after `TWIST_CATALOG`)

- [ ] **Step 1: Add dare category pool**

Add after `TWIST_CATALOG` (around line 1640):

```javascript
// ── Triple Dog Dare — dare pools by category ──
const DARE_POOL = {
  'gross-out': [
    'Lick someone\'s armpit.',
    'Eat a mystery meat slurry.',
    'Chew a piece of gum you found under a bench.',
    'Drink swamp water through a straw.',
    'Eat a live bug.',
    'Lick the bottom of someone\'s shoe.',
    'Eat a raw egg — shell and all.',
    'Drink blended fish guts.',
    'Suck on a piece of someone else\'s toenail.',
    'Eat a spoonful of mystery camp leftovers — three days old.',
  ],
  'humiliation': [
    'Dress up in a ridiculous costume and do a runway walk.',
    'Do a chicken dance in front of everyone for 60 seconds.',
    'Slap yourself in the face — hard — five times.',
    'Serenade the host with a love ballad.',
    'Declare your undying love for your worst enemy.',
    'Wear a diaper and act like a baby for 5 minutes.',
    'Let the tribe draw on your face with permanent marker.',
    'Give a dramatic monologue confessing your biggest weakness.',
    'Do an interpretive dance about your game so far.',
    'Get on your knees and beg your biggest rival for forgiveness.',
  ],
  'pain-fear': [
    'Give a purple nurple to a sleeping bear.',
    'Swim in a pool of leeches.',
    'Sit on an anthill for 60 seconds.',
    'Walk across hot coals barefoot.',
    'Wrestle a raccoon.',
    'Hold a scorpion in your hand for 30 seconds.',
    'Stand in a swarm of bees wearing a honey-covered shirt.',
    'Let a snake wrap around your neck.',
    'Jump into freezing water and stay for 2 minutes.',
    'Get blasted by a fire hose at close range.',
  ],
  'sacrifice': [
    'Shave your head.',
    'Destroy your luxury item.',
    'Give up your next reward challenge win.',
    'Burn your camp shoes.',
    'Eat the entire tribe\'s rice ration for tomorrow.',
    'Hand your closest ally\'s name to the host as your next vote.',
    'Surrender your sleeping spot for the rest of the game.',
    'Smash the tribe\'s fishing gear.',
    'Let the host confiscate your personal memento.',
    'Wear a sign that says "VOTE ME OUT" for the rest of the day.',
  ],
};
const DARE_CATEGORIES = Object.keys(DARE_POOL);
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: add Triple Dog Dare pool constants"
```

---

### Task 3: Engine Function — `simulateTripleDogDare(ep)`

**Files:**
- Modify: `simulator.html` — add new function near `simulateSlasherNight` (~line 6435)

This is the core engine. It handles: round loop, dare assignment, accept/redirect decisions, freebie economy, pact formation, freebie sharing, alliance betrayal, and elimination.

- [ ] **Step 1: Add the main engine function**

Add before `simulateSlasherNight` (~line 6433):

```javascript
// ══════════════════════════════════════════════════════════════════════
// ENGINE: TRIPLE DOG DARE YOU
// ══════════════════════════════════════════════════════════════════════

function simulateTripleDogDare(ep) {
  const activePlayers = [...gs.activePlayers];
  const eliminated = [...gs.eliminated];
  const maxRounds = activePlayers.length * 2;
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
  const _pick = (seed) => { let h = 0; for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0; return (Math.abs(h) % 100) / 100; };

  // State tracking
  const freebies = {};
  activePlayers.forEach(p => freebies[p] = 0);
  const rounds = [];
  const freebieGifts = [];
  const pacts = [];       // { initiator, partner, target, formedRound }
  const betrayals = [];   // { player, target, type:'redirect'|'refusal', round }
  const completions = {}; // { playerName: count }
  activePlayers.forEach(p => completions[p] = 0);
  let eliminatedPlayer = null;
  let eliminatedRound = null;
  let eliminatedDare = null;

  // ── Helper: get TD pact/alliance partners ──
  const _getPactPartners = (player) => {
    const partners = new Set();
    // Named alliances
    (gs.namedAlliances || []).filter(a => a.active && a.members.includes(player))
      .forEach(a => a.members.forEach(m => { if (m !== player) partners.add(m); }));
    // Temporary pacts
    pacts.filter(p => (p.initiator === player || p.partner === player) && !p.broken)
      .forEach(p => partners.add(p.initiator === player ? p.partner : p.initiator));
    return partners;
  };

  // ── Helper: willingness to accept a dare ──
  const _willingness = (player, category, roundNum) => {
    const s = pStats(player);
    const fatigue = roundNum * 0.03;
    const baseDifficulty = 0.40;
    let secondary = 0;
    if (category === 'humiliation') secondary = (10 - s.social) * 0.03;
    else if (category === 'pain-fear') secondary = s.physical * 0.03;
    else if (category === 'sacrifice') secondary = (10 - s.loyalty) * 0.03;
    // gross-out: no secondary, pure boldness
    const chance = s.boldness * 0.08 + secondary - fatigue;
    return chance >= baseDifficulty;
  };

  // ── Helper: redirect target selection ──
  const _pickRedirectTarget = (player, remaining) => {
    const partners = _getPactPartners(player);
    const candidates = remaining.filter(p => p !== player);
    if (!candidates.length) return null;

    // Check for alliance betrayal — low loyalty + low bond + high strategic
    const _allyBetrayalTarget = (() => {
      const s = pStats(player);
      const allyTargets = candidates.filter(c => partners.has(c));
      if (!allyTargets.length) return null;
      for (const ally of allyTargets) {
        const bond = getBond(player, ally);
        const betrayalChance = (10 - s.loyalty) * 0.03 + (10 - Math.max(0, bond)) * 0.02 + s.strategic * 0.02;
        if (Math.random() < betrayalChance - 0.30) return ally; // high bar — needs low loyalty AND low bond AND high strategic
      }
      return null;
    })();

    if (_allyBetrayalTarget) return { target: _allyBetrayalTarget, isBetrayal: true };

    // Normal targeting: enemies first, heat, alliance consensus
    return { target: wRandom(candidates, c => {
      const bond = getBond(player, c);
      const heat = computeHeat(c, remaining, gs.namedAlliances || []);
      const isPartner = partners.has(c);
      const partnerPenalty = isPartner ? -5.0 : 0;
      return Math.max(0.1, (-bond * 0.4) + (heat * 0.3) + partnerPenalty + Math.random() * 0.3);
    }), isBetrayal: false };
  };

  // ── Helper: freebie sharing check ──
  const _checkFreebieSharing = (roundNum, remaining) => {
    // Find players with 0-1 freebies who need help
    const needy = remaining.filter(p => freebies[p] <= 1 && p !== eliminatedPlayer);
    for (const requester of needy) {
      // Check all other remaining players for willingness to share
      const donors = remaining.filter(p => p !== requester && freebies[p] >= 2);
      for (const donor of donors) {
        const bond = getBond(donor, requester);
        const s = pStats(donor);
        // Strategic value: is keeping requester alive good for donor's game?
        const requesterThreat = threatScore(requester);
        const donorThreat = threatScore(donor);
        const isShield = requesterThreat > donorThreat ? 0.15 : 0;
        const strategicVal = s.strategic * 0.03 * (isShield ? 2 : 1);
        // Self-preservation penalty
        const selfPres = freebies[donor] <= 1 ? -0.30 : freebies[donor] === 2 ? -0.10 : 0;
        // Archetype mods
        const arch = players.find(p => p.name === donor)?.archetype || '';
        const archMod = arch === 'hero' || arch === 'loyal-soldier' ? 0.08
                       : arch === 'social-butterfly' ? 0.04
                       : arch === 'villain' || arch === 'mastermind' ? 0.00
                       : arch === 'chaos-agent' ? Math.random() * 0.10
                       : 0;

        const shareChance = bond * 0.05 + s.loyalty * 0.05 + strategicVal + selfPres + archMod;

        if (Math.random() < shareChance) {
          freebies[donor]--;
          freebies[requester]++;
          freebieGifts.push({ from: donor, to: requester, round: roundNum });
          addBond(donor, requester, 0.4);
          addBond(requester, donor, 0.4);
          break; // one gift per needy player per check
        } else if (bond >= 2 && _getPactPartners(donor).has(requester)) {
          // Ally refused to share — betrayal
          const refusalChance = (10 - s.loyalty) * 0.04 + (10 - Math.max(0, bond)) * 0.03;
          if (Math.random() < refusalChance) {
            betrayals.push({ player: donor, target: requester, type: 'refusal', round: roundNum });
            addBond(donor, requester, -0.5);
          }
        }
      }
    }
  };

  // ── Helper: pact formation ──
  const _checkPactFormation = (roundNum, remaining) => {
    // Non-allied players try to form temporary pacts
    const unallied = remaining.filter(p => {
      return !(gs.namedAlliances || []).some(a => a.active && a.members.includes(p) &&
        a.members.filter(m => remaining.includes(m)).length >= 2);
    });
    // Already in a pact?
    const inPact = new Set(pacts.filter(p => !p.broken).flatMap(p => [p.initiator, p.partner]));

    for (const initiator of unallied) {
      if (inPact.has(initiator)) continue;
      const s = pStats(initiator);
      const initiateChance = s.strategic * 0.07 + s.social * 0.03;
      if (Math.random() >= initiateChance) continue;

      // Find best partner — highest bond, not already in a pact
      const candidates = remaining.filter(p => p !== initiator && !inPact.has(p));
      if (!candidates.length) continue;
      const partner = candidates.sort((a, b) => getBond(initiator, b) - getBond(initiator, a))[0];
      const bond = getBond(initiator, partner);
      // Shared enemy bonus
      const sharedEnemies = remaining.filter(p => p !== initiator && p !== partner &&
        getBond(initiator, p) < -1 && getBond(partner, p) < -1);
      const sharedEnemyBonus = sharedEnemies.length ? 0.15 : 0;
      const acceptChance = bond * 0.05 + sharedEnemyBonus;
      if (Math.random() < acceptChance) {
        // Find shared target — lowest combined bond
        const target = remaining.filter(p => p !== initiator && p !== partner)
          .sort((a, b) => (getBond(initiator, a) + getBond(partner, a)) - (getBond(initiator, b) + getBond(partner, b)))[0];
        pacts.push({ initiator, partner, target, formedRound: roundNum, broken: false });
        inPact.add(initiator); inPact.add(partner);
        addBond(initiator, partner, 0.2);
      }
    }
  };

  // ══════════════════════════════════════════════════════════════
  // MAIN ROUND LOOP
  // ══════════════════════════════════════════════════════════════
  let remaining = [...activePlayers];
  let rotation = [...remaining].sort(() => Math.random() - 0.5); // random initial order
  let rotIdx = 0;

  for (let roundNum = 1; roundNum <= maxRounds; roundNum++) {
    if (eliminatedPlayer) break;

    // ── Pact formation (check every 3 rounds) ──
    if (roundNum % 3 === 1) _checkPactFormation(roundNum, remaining);

    // ── Freebie sharing (check every 2 rounds) ──
    if (roundNum % 2 === 0) _checkFreebieSharing(roundNum, remaining);

    // ── Spin the wheel — random eliminated player ──
    const spinner = eliminated.length ? _rp(eliminated) : 'The Host';

    // ── Draw a dare ──
    const category = _rp(DARE_CATEGORIES);
    const dareText = _rp(DARE_POOL[category]);

    // ── Initial target — rotation ──
    if (rotIdx >= rotation.length) { rotation = [...remaining].sort(() => Math.random() - 0.5); rotIdx = 0; }
    let currentTarget = rotation[rotIdx];
    rotIdx++;

    // ── Redirect chain ──
    const chain = [];
    const _visited = new Set(); // prevent infinite redirect loops
    let resolved = false;

    while (!resolved) {
      _visited.add(currentTarget);
      const hasFreebie = freebies[currentTarget] > 0;
      const wantsToAccept = _willingness(currentTarget, category, roundNum);

      if (wantsToAccept || !hasFreebie) {
        // Must attempt the dare (either willing or forced)
        if (wantsToAccept) {
          // Completed the dare
          chain.push({ player: currentTarget, action: 'accept', completed: true, freebieEarned: true });
          freebies[currentTarget]++;
          completions[currentTarget]++;
          resolved = true;
        } else {
          // Forced to accept (0 freebies) but willingness failed — ELIMINATED
          chain.push({ player: currentTarget, action: 'accept', completed: false, freebieEarned: false });
          eliminatedPlayer = currentTarget;
          eliminatedRound = roundNum;
          eliminatedDare = { category, text: dareText };
          resolved = true;
        }
      } else {
        // Has freebies — redirect
        const redirectResult = _pickRedirectTarget(currentTarget, remaining.filter(p => !_visited.has(p)));
        if (!redirectResult || !redirectResult.target) {
          // No valid targets — everyone visited, forced to accept
          if (wantsToAccept) {
            chain.push({ player: currentTarget, action: 'accept', completed: true, freebieEarned: true });
            freebies[currentTarget]++;
            completions[currentTarget]++;
          } else {
            chain.push({ player: currentTarget, action: 'accept', completed: false, freebieEarned: false });
            eliminatedPlayer = currentTarget;
            eliminatedRound = roundNum;
            eliminatedDare = { category, text: dareText };
          }
          resolved = true;
        } else {
          freebies[currentTarget]--;
          chain.push({
            player: currentTarget, action: 'redirect', to: redirectResult.target,
            freebieSpent: true, isBetrayal: redirectResult.isBetrayal
          });
          // Bond consequences
          addBond(currentTarget, redirectResult.target, -0.2);
          if (redirectResult.isBetrayal) {
            betrayals.push({ player: currentTarget, target: redirectResult.target, type: 'redirect', round: roundNum });
            addBond(currentTarget, redirectResult.target, -0.8); // extra penalty on top of -0.2
          }
          currentTarget = redirectResult.target;
        }
      }
    }

    rounds.push({
      roundNum,
      eliminatedSpinner: spinner,
      dareCategory: category,
      dareText,
      initialTarget: chain[0]?.player,
      chain,
    });
  }

  // ── Fallback: if no one was eliminated, lowest completions goes home ──
  if (!eliminatedPlayer) {
    const sorted = remaining.sort((a, b) => completions[a] - completions[b]);
    eliminatedPlayer = sorted[0];
    eliminatedRound = maxRounds;
    eliminatedDare = { category: 'fallback', text: 'Couldn\'t keep up with the dares' };
  }

  // ── MVP: most completions (resume moment, no immunity) ──
  const mostDares = remaining.filter(p => p !== eliminatedPlayer)
    .sort((a, b) => completions[b] - completions[a])[0] || null;

  // ── Set results on ep ──
  ep.tripleDogDare = {
    rounds,
    freebieGifts,
    pacts,
    betrayals,
    freebiesAtEnd: { ...freebies },
    completions: { ...completions },
    eliminated: eliminatedPlayer,
    eliminatedRound,
    eliminatedDare,
    mostDares,
    playerCount: activePlayers.length,
  };
  ep.eliminated = eliminatedPlayer;
  ep.challengeType = 'triple-dog-dare';

  // Camp events from dare challenge
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };

  // Dare completions — respect events
  Object.entries(completions).forEach(([player, count]) => {
    if (count >= 3) {
      ep.campEvents[campKey].post.push({
        type: 'dareCompleted', players: [player],
        text: `${player} completed ${count} dares. That kind of guts doesn't go unnoticed.`,
        badgeText: 'DAREDEVIL', badgeClass: 'gold'
      });
    }
  });

  // Freebie gifts — bond moments
  freebieGifts.forEach(g => {
    ep.campEvents[campKey].post.push({
      type: 'freebieGift', players: [g.from, g.to],
      text: `${g.from} slid a freebie to ${g.to} during the dare challenge. That's not nothing.`,
      badgeText: 'FREEBIE SHARED', badgeClass: 'gold'
    });
  });

  // Pact formation
  pacts.forEach(p => {
    ep.campEvents[campKey].post.push({
      type: 'darePact', players: [p.initiator, p.partner],
      text: `${p.initiator} and ${p.partner} made a deal during the dare challenge — target ${p.target} together.`,
      badgeText: 'DEAL STRUCK', badgeClass: 'gold'
    });
  });

  // Betrayals
  betrayals.forEach(b => {
    const badgeText = b.type === 'redirect' ? 'BETRAYED' : 'LEFT HANGING';
    const text = b.type === 'redirect'
      ? `${b.player} redirected a dare to ${b.target} — their own ally. The cracks are showing.`
      : `${b.player} watched ${b.target} run out of freebies and did nothing.`;
    ep.campEvents[campKey].post.push({
      type: b.type === 'redirect' ? 'allianceRedirectBetrayal' : 'freebieRefusal',
      players: [b.player, b.target], text, badgeText, badgeClass: 'red'
    });
  });

  // MVP resume moment
  if (mostDares) {
    ep.campEvents[campKey].post.push({
      type: 'dareMVP', players: [mostDares],
      text: `${mostDares} completed the most dares. That performance is going on the resume.`,
      badgeText: 'DAREDEVIL', badgeClass: 'gold'
    });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: add simulateTripleDogDare engine function"
```

---

### Task 4: Episode Flow Integration

**Files:**
- Modify: `simulator.html` — `simulateEpisode` function, near the Slasher Night block (~line 20901)

- [ ] **Step 1: Add Triple Dog Dare episode block**

Find the end of the Slasher Night block (~line 20977, the `}` before `// ── SUDDEN DEATH`). Add the Triple Dog Dare block after it:

```javascript
  // ── TRIPLE DOG DARE — dare challenge replaces immunity + tribal ──
  if (ep.isTripleDogDare) {
    // Pre-challenge: journey, advantages, camp events fire normally
    simulateJourney(ep); findAdvantages(ep);
    if (gs._scrambleActivations) ep._debugScramble = { ...gs._scrambleActivations };
    generateCampEvents(ep, 'pre');
    checkMoleSabotage(ep);
    updatePerceivedBonds(ep);

    // Run the dare challenge
    simulateTripleDogDare(ep);

    // Post-challenge camp reactions
    generateCampEvents(ep, 'post');

    // Handle elimination — with RI check
    if (ep.eliminated) {
      handleAdvantageInheritance(ep.eliminated, ep);
      if (isRIStillActive()) {
        if (cfg.riFormat === 'rescue') {
          ep.riChoice = 'RESCUE ISLAND';
          gs.riPlayers.push(ep.eliminated);
          if (!gs.riArrivalEp) gs.riArrivalEp = {};
          gs.riArrivalEp[ep.eliminated] = epNum;
        } else {
          const _tddRiC = simulateRIChoice(ep.eliminated);
          ep.riChoice = _tddRiC;
          if (_tddRiC === 'REDEMPTION ISLAND') gs.riPlayers.push(ep.eliminated);
          else { gs.eliminated.push(ep.eliminated); if (gs.isMerged) gs.jury.push(ep.eliminated); }
        }
      } else {
        gs.eliminated.push(ep.eliminated);
        if (gs.isMerged) gs.jury.push(ep.eliminated);
      }
      gs.activePlayers = gs.activePlayers.filter(p => p !== ep.eliminated);
      gs.tribes = gs.tribes.map(t => ({...t, members: t.members.filter(p => p !== ep.eliminated)}));
      gs.advantages = gs.advantages.filter(a => a.holder !== ep.eliminated);

      // Tied Destinies collateral
      if (gs._tiedDestiniesActive) {
        const _tdPair = gs._tiedDestiniesActive.find(p => p.a === ep.eliminated || p.b === ep.eliminated);
        if (_tdPair) {
          const _tdPartner = _tdPair.a === ep.eliminated ? _tdPair.b : _tdPair.a;
          if (gs.activePlayers.includes(_tdPartner)) {
            ep.tiedDestiniesCollateral = _tdPartner;
            handleAdvantageInheritance(_tdPartner, ep);
            if (isRIStillActive()) {
              if (cfg.riFormat === 'rescue') { gs.riPlayers.push(_tdPartner); }
              else {
                const _tdRi = simulateRIChoice(_tdPartner);
                if (_tdRi === 'REDEMPTION ISLAND') gs.riPlayers.push(_tdPartner);
                else { gs.eliminated.push(_tdPartner); if (gs.isMerged) gs.jury.push(_tdPartner); }
              }
            } else {
              gs.eliminated.push(_tdPartner);
              if (gs.isMerged) gs.jury.push(_tdPartner);
            }
            gs.activePlayers = gs.activePlayers.filter(p => p !== _tdPartner);
            gs.tribes = gs.tribes.map(t => ({...t, members: t.members.filter(p => p !== _tdPartner)}));
            gs.advantages = gs.advantages.filter(a => a.holder !== _tdPartner);
          }
        }
      }
    }

    ep.bondChanges = updateBonds([], ep.eliminated, []);
    detectBetrayals(ep);
    updatePlayerStates(ep); checkPerceivedBondTriggers(ep.num); decayAllianceTrust(ep.num); recoverBonds(ep);
    updateSurvival(ep);
    gs.episode = epNum;
    if (gs.activePlayers.length <= cfg.finaleSize) gs.phase = 'finale';

    gs.episodeHistory.push({
      num: epNum, eliminated: ep.eliminated || null, riChoice: ep.riChoice || null,
      immunityWinner: null,
      challengeType: 'triple-dog-dare', isMerge: ep.isMerge,
      isTripleDogDare: true,
      votes: {}, alliances: [],
      twists: (ep.twists || []).map(t => ({...t})),
      tribesAtStart: (ep.tribesAtStart || []).map(t => ({ name: t.name, members: [...t.members] })),
      campEvents: ep.campEvents || null,
      tripleDogDare: ep.tripleDogDare,
      tiedDestiniesCollateral: ep.tiedDestiniesCollateral || null,
      journey: ep.journey || null,
      idolFinds: ep.idolFinds || [],
      bewareLostVotes: ep.bewareLostVotes || [],
      riDuel: ep.riDuel || null,
      riPlayersPreDuel: ep.riPlayersPreDuel || null,
      riLifeEvents: ep.riLifeEvents || [],
      riReentry: ep.riReentry || null,
      rescueIslandEvents: ep.rescueIslandEvents || [],
      rescueReturnChallenge: ep.rescueReturnChallenge || null,
      riArrival: ep.riArrival || null,
      riQuit: ep.riQuit || null,
      advantagesPreTribal: ep.advantagesPreTribal || null, summaryText: '', gsSnapshot: snapshotGameState()
    });
    const stTDD = generateSummaryText(ep);
    gs.episodeHistory[gs.episodeHistory.length-1].summaryText = stTDD; ep.summaryText = stTDD;
    patchEpisodeHistory(ep); saveGameState(); return ep;
  }
```

- [ ] **Step 2: Add to patchEpisodeHistory**

In `patchEpisodeHistory()` (~line 29038, near the `tiedDestinies` patch), add:

```javascript
if (ep.tripleDogDare) h.tripleDogDare = ep.tripleDogDare;
if (ep.isTripleDogDare) h.isTripleDogDare = true;
```

- [ ] **Step 3: Add camp event boost for Triple Dog Dare**

In the camp event boost switch (~line 18942, near the `slasher-night` case), add:

```javascript
case 'triple-dog-dare':
  // Dare challenge aftermath — drama, doubt, strategic talk
  boost('doubt', 30); boost('confessional', 30);
  boost('strategicTalk', 25); boost('rumor', 20);
  break;
```

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: integrate Triple Dog Dare into episode flow"
```

---

### Task 5: Camp Event Badges

**Files:**
- Modify: `simulator.html` — badge chain in `rpBuildCampTribe()` (~line 36651+)

- [ ] **Step 1: Add event type detection**

In the badge detection block (after the `isMoleReveal` line, ~line 36670), add:

```javascript
const isDareComplete  = evt.type === 'dareCompleted';
const isDareMVP       = evt.type === 'dareMVP';
const isDareGift      = evt.type === 'freebieGift';
const isDarePact      = evt.type === 'darePact';
const isDarePactBetray= evt.type === 'darePactBetrayal';
const isDareAllyBetray= evt.type === 'allianceRedirectBetrayal';
const isDareRefusal   = evt.type === 'freebieRefusal';
const isDareElim      = evt.type === 'dareElimination';
```

- [ ] **Step 2: Add badge text entries**

In the `badgeText` chain, find a suitable spot (after the mole badges ~line 36918). Add:

```javascript
                     : isDareComplete   ? (evt.badgeText || 'DARE COMPLETED')
                     : isDareMVP        ? (evt.badgeText || 'DAREDEVIL')
                     : isDareGift       ? (evt.badgeText || 'FREEBIE SHARED')
                     : isDarePact       ? (evt.badgeText || 'DEAL STRUCK')
                     : isDarePactBetray ? (evt.badgeText || 'PACT BROKEN')
                     : isDareAllyBetray ? (evt.badgeText || 'BETRAYED')
                     : isDareRefusal    ? (evt.badgeText || 'LEFT HANGING')
                     : isDareElim       ? (evt.badgeText || 'COULDN\'T TAKE IT')
```

- [ ] **Step 3: Add badge class entries**

In the `badgeClass` chain, add after the mole classes:

```javascript
                     : isDareComplete || isDareMVP || isDareGift || isDarePact ? 'gold'
                     : isDarePactBetray || isDareAllyBetray || isDareRefusal || isDareElim ? 'red'
```

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: add Triple Dog Dare camp event badges"
```

---

### Task 6: VP Screen — Announcement

**Files:**
- Modify: `simulator.html` — add VP function near the slasher VP screens (~line 45251)

- [ ] **Step 1: Add announcement screen**

Add before the slasher VP section:

```javascript
// ══════════════════════════════════════════════════════════════════════
// TRIPLE DOG DARE VP SCREENS
// ══════════════════════════════════════════════════════════════════════

function rpBuildTripleDogDareAnnouncement(ep) {
  const tdd = ep.tripleDogDare;
  if (!tdd) return '';
  const allPlayers = gs.activePlayers.length ? gs.activePlayers
    : ep.gsSnapshot?.activePlayers || [];
  // Use tribesAtStart or snapshot for player list
  const snap = ep.gsSnapshot || {};
  const activePlayers = snap.activePlayers || allPlayers;
  const playerCount = tdd.playerCount || activePlayers.length;

  let html = `<div class="rp-page tod-tribal">
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;color:var(--accent-fire);text-shadow:0 0 20px var(--accent-fire);margin-bottom:6px;animation:scrollDrop 0.5s var(--ease-broadcast) both">TRIPLE DOG DARE</div>
    <div style="font-size:13px;color:var(--muted);text-align:center;margin-bottom:24px;line-height:1.6">
      The eliminated players have written the dares.<br>
      Accept a dare — earn a freebie. Redirect it — spend one.<br>
      Run out of freebies and can't do the dare?<br>
      <span style="color:var(--accent-fire);font-weight:700">You're out of the game.</span>
    </div>
    <div style="font-size:11px;color:var(--muted);text-align:center;margin-bottom:20px">
      ${playerCount} players. ${tdd.rounds.length} rounds. 1 elimination. No tribal council.
    </div>
    <div class="rp-portrait-row" style="justify-content:center;margin-bottom:20px">
      ${activePlayers.map(name => rpPortrait(name)).join('')}
    </div>
  </div>`;
  return html;
}
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: add Triple Dog Dare announcement VP screen"
```

---

### Task 7: VP Screen — Rounds (Click-to-Reveal)

**Files:**
- Modify: `simulator.html` — add after `rpBuildTripleDogDareAnnouncement`

- [ ] **Step 1: Add rounds screen with freebie counter and click-to-reveal**

```javascript
function rpBuildTripleDogDareRounds(ep) {
  const tdd = ep.tripleDogDare;
  if (!tdd || !tdd.rounds?.length) return '';
  const stateKey = String(ep.num) + '_tdd';
  const snap = ep.gsSnapshot || {};
  const activePlayers = snap.activePlayers || [];

  // Category colors
  const _catColor = { 'gross-out': '#3fb950', 'humiliation': '#db61a2', 'pain-fear': '#da3633', 'sacrifice': '#e3b341', 'fallback': '#8b949e' };
  const _catLabel = { 'gross-out': 'GROSS-OUT', 'humiliation': 'HUMILIATION', 'pain-fear': 'PAIN / FEAR', 'sacrifice': 'SACRIFICE', 'fallback': 'FALLBACK' };

  // Build freebie snapshots per round for display
  const _freebieHistory = [{}];
  const _fb = {};
  (tdd.rounds[0]?.chain?.[0]?.player ? activePlayers : []).forEach(p => _fb[p] = 0);
  activePlayers.forEach(p => _fb[p] = 0);

  tdd.rounds.forEach((round, ri) => {
    round.chain.forEach(step => {
      if (step.action === 'accept' && step.freebieEarned) _fb[step.player] = (_fb[step.player] || 0) + 1;
      if (step.action === 'redirect' && step.freebieSpent) _fb[step.player] = Math.max(0, (_fb[step.player] || 0) - 1);
    });
    // Apply gifts that happened at or before this round
    tdd.freebieGifts.filter(g => g.round <= round.roundNum).forEach(g => {
      // Gifts are already applied in engine — track for display only
    });
    _freebieHistory.push({ ..._fb });
  });

  let html = `<div class="rp-page tod-tribal">
    <div style="font-family:var(--font-display);font-size:22px;letter-spacing:2px;text-align:center;color:var(--accent-fire);margin-bottom:16px">THE DARES</div>`;

  // ── Persistent freebie counter bar ──
  html += `<div id="tdd-freebie-bar-${ep.num}" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:20px;padding:10px;background:var(--surface);border:1px solid var(--border);border-radius:8px">
    ${activePlayers.map(name => {
      const count = 0;
      return `<div style="text-align:center;min-width:48px" id="tdd-fb-${ep.num}-${name.replace(/\s+/g,'-')}">
        ${rpPortrait(name, 'sm')}
        <div style="font-size:12px;font-weight:700;color:var(--accent-gold);margin-top:2px;font-family:var(--font-mono)" data-fb-count="true">${count}</div>
      </div>`;
    }).join('')}
  </div>`;

  // ── Freebie gift events (shown between rounds) ──
  const _giftsByRound = {};
  tdd.freebieGifts.forEach(g => {
    if (!_giftsByRound[g.round]) _giftsByRound[g.round] = [];
    _giftsByRound[g.round].push(g);
  });

  // ── Pact events ──
  const _pactsByRound = {};
  tdd.pacts.forEach(p => {
    if (!_pactsByRound[p.formedRound]) _pactsByRound[p.formedRound] = [];
    _pactsByRound[p.formedRound].push(p);
  });

  // ── Round cards ──
  tdd.rounds.forEach((round, ri) => {
    const isLast = ri === tdd.rounds.length - 1;
    const hasElim = round.chain.some(s => s.action === 'accept' && !s.completed);
    const catColor = _catColor[round.dareCategory] || '#8b949e';
    const catLabel = _catLabel[round.dareCategory] || round.dareCategory;

    // Pact formation before this round
    (_pactsByRound[round.roundNum] || []).forEach(pact => {
      html += `<div class="vp-card gold" style="margin-bottom:8px;text-align:center">
        <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:var(--accent-gold)">DEAL STRUCK</span><br>
        <div class="rp-portrait-row" style="justify-content:center;margin:6px 0">${rpPortrait(pact.initiator, 'sm')} ${rpPortrait(pact.partner, 'sm')}</div>
        <div style="font-size:11px;color:var(--muted)">${pact.initiator} and ${pact.partner} agree to work together — target: ${pact.target}</div>
      </div>`;
    });

    // Freebie gifts before this round
    (_giftsByRound[round.roundNum] || []).forEach(gift => {
      html += `<div class="vp-card gold" style="margin-bottom:8px;text-align:center">
        <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:var(--accent-gold)">FREEBIE SHARED</span><br>
        <div class="rp-portrait-row" style="justify-content:center;margin:6px 0">${rpPortrait(gift.from, 'sm')} <span style="font-size:16px;color:var(--accent-gold)">→</span> ${rpPortrait(gift.to, 'sm')}</div>
        <div style="font-size:11px;color:var(--muted)">${gift.from} slides a freebie to ${gift.to}</div>
      </div>`;
    });

    // Round card (click-to-reveal)
    html += `<div class="vp-card ${hasElim ? 'fire' : ''}" style="margin-bottom:12px;cursor:pointer" onclick="tvRevealNext('${stateKey}')">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="font-size:10px;font-weight:700;color:var(--muted);font-family:var(--font-mono)">R${round.roundNum}</span>
        <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:${catColor};background:${catColor}18;padding:2px 6px;border-radius:3px">${catLabel}</span>
      </div>`;

    // Wheel spin — who dared
    html += `<div data-reveal="${stateKey}" style="display:none">
      <div style="font-size:12px;color:var(--muted);margin-bottom:6px">
        ${rpPortrait(round.eliminatedSpinner, 'sm', '', true)} <span style="vertical-align:middle">${round.eliminatedSpinner} dares you to…</span>
      </div>
      <div style="font-size:13px;font-weight:600;color:var(--vp-text);margin-bottom:10px;font-style:italic">"${round.dareText}"</div>`;

    // Chain of events
    round.chain.forEach((step, si) => {
      const isElim = step.action === 'accept' && !step.completed;
      html += `<div data-reveal="${stateKey}" style="display:none;padding:4px 0;${si > 0 ? 'margin-top:4px;border-top:1px solid var(--border);' : ''}">
        <div style="display:flex;align-items:center;gap:8px">
          ${rpPortrait(step.player, 'sm')}
          <div style="flex:1">`;

      if (step.action === 'accept' && step.completed) {
        html += `<span style="font-size:12px;font-weight:600;color:#3fb950">✅ ${step.player} accepted — completed the dare</span>
          <div style="font-size:10px;color:var(--accent-gold);margin-top:2px">+1 freebie</div>`;
      } else if (step.action === 'accept' && !step.completed) {
        html += `<span style="font-size:12px;font-weight:600;color:#da3633">❌ ${step.player} had no choice — couldn't go through with it</span>
          <div style="font-size:11px;font-weight:700;color:#da3633;margin-top:4px;letter-spacing:1px">ELIMINATED</div>`;
      } else if (step.action === 'redirect') {
        const betrayalTag = step.isBetrayal ? ` <span style="font-size:9px;font-weight:700;color:#da3633;letter-spacing:0.5px">BETRAYAL</span>` : '';
        html += `<span style="font-size:12px;color:var(--muted)">🔄 ${step.player} spent a freebie — redirected to ${step.to}${betrayalTag}</span>`;
      }

      html += `</div></div></div>`;
    });

    html += `</div></div>`;
  });

  // Reveal all button
  html += `<div style="text-align:center;margin-top:12px">
    <button class="rp-camp-toggle-btn" style="border-color:var(--accent-fire);color:var(--accent-fire)" onclick="tvRevealAll('${stateKey}')">REVEAL ALL ROUNDS</button>
  </div>`;

  html += `</div>`;
  return html;
}
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: add Triple Dog Dare rounds VP screen with click-to-reveal"
```

---

### Task 8: VP Screen — Elimination

**Files:**
- Modify: `simulator.html` — add after `rpBuildTripleDogDareRounds`

- [ ] **Step 1: Add elimination screen**

```javascript
function rpBuildTripleDogDareElimination(ep) {
  const tdd = ep.tripleDogDare;
  if (!tdd || !tdd.eliminated) return '';
  const elimName = tdd.eliminated;
  const pr = pronouns(elimName);
  const p = players.find(x => x.name === elimName);
  const arch = p?.archetype || 'player';
  const archLabel = arch.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const catColor = { 'gross-out': '#3fb950', 'humiliation': '#db61a2', 'pain-fear': '#da3633', 'sacrifice': '#e3b341', 'fallback': '#8b949e' }[tdd.eliminatedDare?.category] || '#8b949e';

  // Elimination quotes
  const quotes = [
    `"I knew it was coming. I just didn't think it would end like this."`,
    `"I did everything I could. Some dares are just... too much."`,
    `"${pr.Sub} ${pr.sub === 'they' ? 'weren\'t' : 'wasn\'t'} afraid of the game. ${pr.Sub} ${pr.sub === 'they' ? 'were' : 'was'} afraid of that."`,
    `"I gave this game everything. It just asked for one thing I couldn't give."`,
    `"No regrets. Okay, one regret."`,
  ];
  const quote = quotes[Math.floor(Math.abs(elimName.charCodeAt(0) * 7 + ep.num * 13) % quotes.length)];

  let html = `<div class="rp-page tod-tribal" style="text-align:center">
    <div class="rp-co-eyebrow" style="color:#da3633;margin-bottom:20px">ELIMINATED</div>
    ${rpPortrait(elimName, 'lg elim')}
    <div class="rp-elim-name" style="margin-top:16px">${elimName}</div>
    <div class="rp-elim-arch">${archLabel}</div>
    <div class="rp-elim-quote">${quote}</div>`;

  if (tdd.eliminatedDare && tdd.eliminatedDare.category !== 'fallback') {
    html += `<div style="margin-bottom:16px">
      <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:${catColor};background:${catColor}18;padding:3px 8px;border-radius:3px">${(tdd.eliminatedDare.category || '').toUpperCase().replace('-', ' / ')}</span>
    </div>
    <div style="font-size:12px;color:var(--muted);font-style:italic;margin-bottom:16px">"${tdd.eliminatedDare.text}"</div>`;
  }

  html += `<div class="rp-elim-place">Couldn't take the dare — Round ${tdd.eliminatedRound}</div>`;

  // Tied Destinies collateral
  if (ep.tiedDestiniesCollateral) {
    const tdName = ep.tiedDestiniesCollateral;
    const tdPr = pronouns(tdName);
    const tdP = players.find(x => x.name === tdName);
    const tdArch = tdP?.archetype || 'player';
    const tdArchLabel = tdArch.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    html += `<div class="rp-co-divider"></div>
      <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#da3633;margin-bottom:12px">TIED DESTINIES &mdash; COLLATERAL</div>
      ${rpPortrait(tdName, 'lg elim')}
      <div class="rp-elim-name" style="margin-top:12px">${tdName}</div>
      <div class="rp-elim-arch">${tdArchLabel}</div>
      <div class="rp-elim-quote">"${tdPr.Sub} didn't get dared. ${tdPr.Sub} got tied to the wrong person."</div>
      <div class="rp-elim-place">Eliminated by Tied Destinies</div>`;
  }

  // Daredevil MVP
  if (tdd.mostDares) {
    html += `<div class="rp-co-divider"></div>
      <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:var(--accent-gold);margin-bottom:12px">DAREDEVIL</div>
      ${rpPortrait(tdd.mostDares, 'sm')}
      <div style="font-size:12px;color:var(--muted);margin-top:6px">${tdd.mostDares} completed the most dares (${tdd.completions?.[tdd.mostDares] || 0})</div>`;
  }

  html += `</div>`;
  return html;
}
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: add Triple Dog Dare elimination VP screen"
```

---

### Task 9: VP Screen Registration

**Files:**
- Modify: `simulator.html` — VP screen registration in `buildVPScreens()` (~line 46070)

- [ ] **Step 1: Register VP screens**

Find the slasher night VP registration block (~line 46071):
```javascript
// ── Slasher Night — replaces challenge + tribal + votes ──
if (ep.isSlasherNight && ep.slasherNight) {
```

Add the Triple Dog Dare block before it:

```javascript
  // ── Triple Dog Dare — replaces challenge + tribal + votes ──
  if (ep.isTripleDogDare && ep.tripleDogDare) {
    vpScreens.push({ id:'tdd-announce', label:'Triple Dog Dare', html: rpBuildTripleDogDareAnnouncement(ep) });
    vpScreens.push({ id:'tdd-rounds', label:'The Dares', html: rpBuildTripleDogDareRounds(ep) });
    vpScreens.push({ id:'tdd-elimination', label:'Eliminated', html: rpBuildTripleDogDareElimination(ep) });
    // RI/Rescue screens
    if (ep.riLifeEvents?.length || ep.riDuel) {
      const _tddRiLife = rpBuildRILife(ep);
      if (_tddRiLife) vpScreens.push({ id:'ri-life', label:'RI Life', html: _tddRiLife });
      const _tddRiDuel = rpBuildRIDuel(ep);
      if (_tddRiDuel) vpScreens.push({ id:'ri-duel', label:'RI Duel', html: _tddRiDuel });
    }
    if (ep.rescueIslandEvents?.length) {
      const _tddRescLife = rpBuildRescueIslandLife(ep);
      if (_tddRescLife) vpScreens.push({ id:'rescue-life', label:'Rescue Island', html: _tddRescLife });
    }
  }
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: register Triple Dog Dare VP screens"
```

---

### Task 10: Text Backlog

**Files:**
- Modify: `simulator.html` — add text backlog function near `_textSlasherNight` (~line 26694), and wire it into the main text output function

- [ ] **Step 1: Add text backlog function**

Add before `_textSlasherNight`:

```javascript
// ── TRIPLE DOG DARE ──
function _textTripleDogDare(ep, ln, sec) {
  const tdd = ep.tripleDogDare;
  if (!tdd) return;
  sec('TRIPLE DOG DARE');
  ln(`${tdd.playerCount} players. ${tdd.rounds.length} rounds. Sudden-death elimination.`);
  ln('');

  // Pacts formed
  if (tdd.pacts?.length) {
    ln('PACTS:');
    tdd.pacts.forEach(p => ln(`- ${p.initiator} + ${p.partner} → targeting ${p.target} (formed round ${p.formedRound})`));
    ln('');
  }

  // Round-by-round
  tdd.rounds.forEach(round => {
    ln(`Round ${round.roundNum}: [${round.dareCategory.toUpperCase()}] ${round.eliminatedSpinner} dares: "${round.dareText}"`);
    round.chain.forEach(step => {
      if (step.action === 'accept' && step.completed) {
        ln(`  ${step.player} ACCEPTED — completed. (+1 freebie)`);
      } else if (step.action === 'accept' && !step.completed) {
        ln(`  ${step.player} FORCED TO ACCEPT — FAILED. ELIMINATED.`);
      } else if (step.action === 'redirect') {
        ln(`  ${step.player} REDIRECTED to ${step.to} (-1 freebie)${step.isBetrayal ? ' [BETRAYAL]' : ''}`);
      }
    });
  });
  ln('');

  // Freebie gifts
  if (tdd.freebieGifts?.length) {
    ln('FREEBIE GIFTS:');
    tdd.freebieGifts.forEach(g => ln(`- Round ${g.round}: ${g.from} → ${g.to}`));
    ln('');
  }

  // Betrayals
  if (tdd.betrayals?.length) {
    ln('BETRAYALS:');
    tdd.betrayals.forEach(b => ln(`- Round ${b.round}: ${b.player} ${b.type === 'redirect' ? 'redirected to' : 'refused to share with'} ${b.target}`));
    ln('');
  }

  // Final freebie counts
  ln('FINAL FREEBIE COUNTS:');
  Object.entries(tdd.freebiesAtEnd || {}).sort(([,a],[,b]) => b - a).forEach(([name, count]) => {
    ln(`  ${name}: ${count}`);
  });
  ln('');

  // Result
  ln(`ELIMINATED: ${tdd.eliminated} (round ${tdd.eliminatedRound})`);
  if (tdd.eliminatedDare?.text) ln(`  Dare: "${tdd.eliminatedDare.text}" [${tdd.eliminatedDare.category}]`);
  if (tdd.mostDares) ln(`DAREDEVIL: ${tdd.mostDares} (${tdd.completions?.[tdd.mostDares] || 0} dares completed)`);
}
```

- [ ] **Step 2: Wire into main text output**

Find where `_textSlasherNight` is called in the main text output function. Search for `_textSlasherNight(ep, ln, sec)`. Add the Triple Dog Dare call nearby:

```javascript
_textTripleDogDare(ep, ln, sec);
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: add Triple Dog Dare text backlog"
```

---

### Task 11: Cold Open Integration

**Files:**
- Modify: `simulator.html` — the "Previously on..." section in `rpBuildColdOpen` (~line 32605+)

The cold open we just built should naturally handle Triple Dog Dare episodes since the elimination data flows through normal channels. But we should add a specific card when the previous episode was a Triple Dog Dare.

- [ ] **Step 1: Add Triple Dog Dare cold open card**

In the "Previously on..." section, after the `[1] LAST TRIBAL RECAP` block (~line 32627), add a conditional for TDD episodes:

```javascript
    // ── [1b] TRIPLE DOG DARE RECAP — if prev episode was TDD ──
    if (prevEp.isTripleDogDare && prevEp.tripleDogDare) {
      const _tddData = prevEp.tripleDogDare;
      html += `<div class="vp-card fire" style="margin-bottom:10px">
        <div style="font-family:var(--font-body);font-size:11px;font-weight:800;letter-spacing:1px;color:var(--accent-fire);margin-bottom:6px">TRIPLE DOG DARE</div>
        <div style="font-size:12px;margin-bottom:4px">${_tddData.eliminated} couldn't take the dare — eliminated in round ${_tddData.eliminatedRound}</div>
        ${_tddData.mostDares ? `<div style="font-size:11px;color:var(--accent-gold);margin-bottom:4px">⭐ ${_tddData.mostDares} — Daredevil (${_tddData.completions?.[_tddData.mostDares] || 0} dares)</div>` : ''}
        ${_tddData.betrayals?.length ? `<div style="font-size:11px;color:#da3633">${_tddData.betrayals.length} betrayal${_tddData.betrayals.length > 1 ? 's' : ''} during the challenge</div>` : ''}
        ${_tddData.pacts?.length ? `<div style="font-size:11px;color:var(--muted)">${_tddData.pacts.length} temporary deal${_tddData.pacts.length > 1 ? 's' : ''} formed</div>` : ''}
      </div>`;
    }
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: add Triple Dog Dare cold open recap card"
```

---

### Task 12: Episode History Timeline Badge

**Files:**
- Modify: `simulator.html` — episode history display

- [ ] **Step 1: Find and update episode history badge**

Search for where episode history renders elimination badges (the episode timeline at the bottom of the game state panel). Find the pattern that shows "Slasher Night" or challenge type badges. Add Triple Dog Dare handling:

Search for `slasher-night` in the episode history rendering. Where it shows special episode type labels, add:

```javascript
: h.isTripleDogDare ? 'Triple Dog Dare'
```

alongside the existing `h.isSlasherNight` check.

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: add Triple Dog Dare episode history badge"
```

---

### Task 13: Aftermath Integration

**Files:**
- Modify: `simulator.html` — aftermath show functions

- [ ] **Step 1: Add TDD as an Unseen Footage source**

Search for `unseenFootage` or the unseen footage generation in `generateAftermathShow`. Triple Dog Dare betrayals and pact formations should be eligible as unseen footage moments. Find the array of unseen footage sources and add:

```javascript
// Triple Dog Dare betrayals
if (ep.tripleDogDare?.betrayals?.length) {
  ep.tripleDogDare.betrayals.forEach(b => {
    unseenFootage.push({
      type: 'tdd-betrayal',
      drama: 7,
      text: b.type === 'redirect'
        ? `During the Triple Dog Dare, ${b.player} redirected a dare to their own ally ${b.target}. The cameras caught every second of it.`
        : `${b.player} had a freebie to spare. ${b.target} was running on empty. ${b.player} kept it. The cameras saw.`,
      players: [b.player, b.target]
    });
  });
}
```

- [ ] **Step 2: Add TDD as a Truth or Anvil contradiction source**

In the Truth or Anvil contradiction detection, add TDD pact betrayals as a source (if someone made a pact and then betrayed it). Search for the contradiction types array and add:

```javascript
// TDD pact betrayal — made a deal during the dare challenge and broke it
if (ep.tripleDogDare?.pacts?.length && ep.tripleDogDare?.betrayals?.length) {
  const _tddPactBetrayals = ep.tripleDogDare.betrayals.filter(b =>
    ep.tripleDogDare.pacts.some(p =>
      (p.initiator === b.player || p.partner === b.player) &&
      (p.initiator === b.target || p.partner === b.target)
    )
  );
  _tddPactBetrayals.forEach(b => {
    contradictions.push({
      type: 'tdd-pact-betrayal',
      player: b.player,
      evidence: `Made a pact with ${b.target} during the dare challenge, then ${b.type === 'redirect' ? 'redirected a dare to them' : 'refused to share a freebie'}`,
      drama: 7
    });
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: integrate Triple Dog Dare into aftermath show"
```

---

### Task 14: Final Testing & Polish

- [ ] **Step 1: Test basic flow**

Open `simulator.html` in a browser. Set up a season with `triple-dog-dare` scheduled on a post-merge episode. Run to that episode. Verify:
- The dare challenge runs instead of immunity + tribal
- One player is eliminated
- VP screens render: announcement, rounds (click-to-reveal), elimination
- Freebie counts are visible
- Cold open next episode shows TDD recap

- [ ] **Step 2: Test edge cases**

- Schedule on pre-merge episode → should skip (guard check)
- Schedule with < 4 players → should skip
- With Tied Destinies active → collateral elimination should work
- With Redemption Island active → eliminated player should go to RI

- [ ] **Step 3: Verify text backlog**

Click the text backlog button. Verify the Triple Dog Dare section appears with round-by-round output, freebie counts, and elimination details.

- [ ] **Step 4: Commit any fixes**

```bash
git add simulator.html
git commit -m "fix: polish Triple Dog Dare edge cases"
```
