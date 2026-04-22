// js/chal/chefshank.js — The Chefshank Redemption prison challenge
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';

// ── Text pools ──────────────────────────────────────────────────────────────

const PRISON_FOOD_HOST = {
  intro: [
    h => `${h} grins. "Welcome to Phase 1: Prison Food. One unfortunate soul from each tribe gets to eat whatever their rivals cook up. And trust me — you don't want to know what's in it."`,
    h => `"Alright convicts," ${h} announces, "Phase 1 is Prison Food. Your tribe cooks the slop. The other tribe's chosen victim has to eat it. Last one standing wins the Golden Shovel."`,
    h => `${h} lifts a rusted pot lid and recoils. "Phase 1. Your tribe decides what goes in the pot. The enemy eats it. Simple. Disgusting. Perfect."`,
  ],
  victimPicked: [
    (h, name, tribe) => `${h} points: "${name} — you're eating for ${tribe} tonight."`,
    (h, name, tribe) => `The ${tribe} tribe nominates ${name}. ${h} slow-claps. "Bold choice."`,
    (h, name, tribe) => `"${name} from ${tribe}," ${h} calls out. "Hope you skipped breakfast."`,
  ],
  cookingStart: [
    h => `${h} fires a starting pistol. "Cooks — you've got ten minutes. Make it count."`,
    h => `"Start cooking!" ${h} shouts. The tribes scramble for the mystery ingredients.`,
    h => `${h} gestures at the grimy kitchen counter. "You have ten minutes. Sanitation is optional."`,
  ],
  roundStart: [
    (h, r) => `${h} slides a steaming bowl forward. "Round ${r}. Bon appétit."`,
    (h, r) => `"Round ${r}!" ${h} announces, slapping a ladle on the table. "Dig in."`,
    (h, r) => `${h} raises an eyebrow. "Round ${r}. Things are getting… fragrant."`,
  ],
  vomit: [
    (h, name) => `${name} lurches forward — and that's it. ${h} blows the whistle. "We have a casualty."`,
    (h, name) => `${h} winces as ${name} loses the battle. "And down goes the contestant."`,
    (h, name) => `"Ohhh," ${h} groans theatrically as ${name} taps out. "That's gonna leave a mark."`,
  ],
  survive: [
    (h, name) => `${name} slams the empty bowl down and glares at ${h}. ${h} looks almost impressed.`,
    (h, name) => `${name} finishes every last bite. ${h} blinks. "Okay. I respect that."`,
    (h, name) => `${h} shakes his head slowly as ${name} survives the final round. "Unbelievable."`,
  ],
};

const PRISON_FOOD_COOKING = {
  sabotageIngredient: [
    (actor, pr) => `${actor} smirks and palms something unidentifiable into the pot when no one's looking.`,
    (actor, pr) => `${actor} digs through the mystery bin and pulls out something that makes ${pr.sub} gag — then dumps it straight in.`,
    (actor, pr) => `While the tribe debates seasoning, ${actor} quietly adds a handful of something green and moving.`,
  ],
  accidentalImprovement: [
    (actor, pr) => `${actor} adds what ${pr.sub} thinks is hot sauce — but the pot smells almost… good now. ${pr.Sub} looks confused.`,
    (actor, pr) => `${actor} sneezes into the spice rack and accidentally improves the dish. ${pr.PosAdj} tribe is suspicious.`,
    (actor, pr) => `${actor} tosses in an extra ingredient on instinct. The resulting aroma is somehow not awful.`,
  ],
  foreignObject: [
    (actor, pr) => `${actor}'s shoe lace snaps and half of it disappears into the pot. ${pr.Sub} pretends not to notice.`,
    (actor, pr) => `A button pops off ${actor}'s shirt mid-stir and sinks without a trace.`,
    (actor, pr) => `${actor} drops ${pr.posAdj} wristband into the slop. It doesn't come back out.`,
  ],
  tastTestBetrayal: [
    (actor, target, aPr, tPr) => `${actor} sidles up near ${target} and whispers a warning about what's in the pot. ${tPr.Sub} looks shaken.`,
    (actor, target, aPr, tPr) => `When no one's watching, ${actor} mouths something to ${target} across the challenge area. ${tPr.Sub} nods slightly.`,
    (actor, target, aPr, tPr) => `${actor} makes brief eye contact with ${target} and gives the faintest grimace — a warning. ${tPr.Sub} swallows hard.`,
  ],
};

const PRISON_FOOD_EATING = {
  gagReflex:            (v, pr) => `${v} gags visibly between bites but forces ${pr.posAdj} expression neutral.`,
  taunt:                (v, opp, vPr, oPr) => `${opp} leans over and taunts: "Gonna quit?" ${v} shoots ${oPr.obj} a death glare.`,
  encouragement:        (v, opp, vPr, oPr) => `Teammates shout encouragement from the sidelines. ${v} grits ${vPr.posAdj} teeth and pushes on.`,
  foreignObjectDiscovery:(v, pr) => `${v} pauses — something solid in the bowl that shouldn't be there. ${pr.Sub} keeps eating anyway.`,
  secondWind:           (v, pr) => `${v} exhales sharply, squares ${pr.posAdj} shoulders, and finds a second wind.`,
  smellHits:            (v, pr) => `The smell from the bowl hits ${v} like a wall. ${pr.Sub} sways but stays seated.`,
  sympathyGag:          (v, opp, vPr, oPr) => `${opp} makes a noise and ${v} nearly loses it in sympathy. ${vPr.Sub} clamps ${vPr.posAdj} hand over ${vPr.posAdj} mouth.`,
  chefCritique:         (v, pr) => `Chris leans in to commentate on the texture. The description makes ${v}'s face contort.`,
  crowdPressure:        (v, pr) => `The spectators start chanting. ${v} closes ${pr.posAdj} eyes, jaw tight.`,
  pokerFace:            (v, opp, vPr, oPr) => `${v} stares ${oPr.obj} dead in the eye and eats without blinking. ${opp} shifts uncomfortably.`,
  textureSurprise:      (v, pr) => `Something in the bowl moves slightly. ${v} freezes for a half-second before swallowing.`,
  spiteBite:            (v, pr) => `${v} thinks of who cooked this, sets ${pr.posAdj} jaw, and takes the biggest bite yet.`,
  nostrilFlare:         (v, pr) => `${v}'s nostrils flare at the next spoonful. ${pr.Sub} breathes through ${pr.posAdj} mouth the rest of the round.`,
  powerStare:           (v, opp, vPr, oPr) => `${v} locks eyes with ${opp} and lifts the bowl without looking away.`,
  stomachGrowl:         (v, pr) => `An audible gurgle from ${v}'s stomach. ${pr.Sub} pretends it didn't happen.`,
  flashback:            (v, pr) => `${v} goes somewhere else mentally — somewhere better — and the round passes in a blur.`,
};

// ── Phase 1 implementation ───────────────────────────────────────────────────

function _simulatePrisonFood(ep, tribeMembers, result) {
  const host = seasonConfig.host || 'Chris';
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
  const _shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  result.prisonFood = { victims: {}, cooking: {}, duel: { rounds: [], winner: null, loser: null, vomitRound: null } };

  const campKey = gs.tribes[0]?.name || 'merge';
  const pushEvent = (text, playerList, badge, cls) => {
    ep.campEvents[campKey].post.push({ text, players: playerList, badgeText: badge, badgeClass: cls, tag: 'challenge' });
  };

  // Host intro
  pushEvent(_rp(PRISON_FOOD_HOST.intro)(host), tribeMembers.flatMap(t => t.members), 'PRISON FOOD', 'purple');

  // ── 1. VICTIM DRAFT ──
  const victims = {};
  for (const tribe of tribeMembers) {
    const enemies = tribeMembers.filter(t => t.name !== tribe.name).flatMap(t => t.members);
    const scored = enemies.map(name => {
      const s = pStats(name);
      return { name, w: (10 - s.endurance) * 0.04 + (10 - s.boldness) * 0.03 + Math.random() * 0.5 };
    });
    scored.sort((a, b) => b.w - a.w);
    const victimName = scored[0].name;
    victims[tribe.name] = victimName;
    result.prisonFood.victims[tribe.name] = victimName;
    const victimTribe = tribeMembers.find(t => t.members.includes(victimName));
    pushEvent(
      _rp(PRISON_FOOD_HOST.victimPicked)(host, victimName, victimTribe?.name || ''),
      [victimName], 'VICTIM PICKED', 'red'
    );
  }

  // ── 2. COOKING PHASE ──
  pushEvent(_rp(PRISON_FOOD_HOST.cookingStart)(host), tribeMembers.flatMap(t => t.members), 'COOKING PHASE', 'orange');

  // Check for mole/thrower
  const thrower = ep.thrower || null;

  for (const tribe of tribeMembers) {
    const s = tribe.members.map(n => pStats(n));
    const avgMental = s.reduce((a, m) => a + m.mental, 0) / s.length;
    const avgStrat = s.reduce((a, m) => a + m.strategic, 0) / s.length;
    let disgustScore = avgMental * 0.04 + avgStrat * 0.03;

    const cookingEvents = [];
    const usedActors = new Set();

    // Identify the victim eaten by this tribe (i.e. the victim from enemy tribe)
    const enemyVictimEntry = Object.entries(victims).find(([tName]) => tName !== tribe.name);
    const enemyVictim = enemyVictimEntry ? enemyVictimEntry[1] : null;

    // Build event candidates
    const candidates = [];

    // sabotageIngredient
    const saboteurs = tribe.members.filter(n => {
      const arch = players.find(p => p.name === n)?.archetype;
      return ['villain', 'mastermind', 'schemer', 'chaos-agent'].includes(arch);
    });
    if (saboteurs.length) candidates.push({ type: 'sabotageIngredient', actors: saboteurs });

    // accidentalImprovement
    const improvers = tribe.members.filter(n => {
      const s2 = pStats(n);
      return s2.loyalty * 0.1 > 0.5 + Math.random() * 0.3;
    });
    if (improvers.length) candidates.push({ type: 'accidentalImprovement', actors: improvers });

    // foreignObject — any random member
    candidates.push({ type: 'foreignObject', actors: [...tribe.members] });

    // tasteTestBetrayal — need cross-tribe bond or high strategic
    if (enemyVictim) {
      const betrayers = tribe.members.filter(n => {
        const s2 = pStats(n);
        return getBond(n, enemyVictim) >= 3 || s2.strategic >= 7;
      });
      if (betrayers.length) candidates.push({ type: 'tastTestBetrayal', actors: betrayers, target: enemyVictim });
    }

    const numEvents = 2 + Math.floor(Math.random() * 2); // 2-3
    _shuffle(candidates);

    for (const cand of candidates) {
      if (cookingEvents.length >= numEvents) break;
      const eligibleActors = cand.actors.filter(n => !usedActors.has(n));
      if (!eligibleActors.length) continue;
      const actor = _rp(eligibleActors);
      usedActors.add(actor);
      const aPr = pronouns(actor);
      const tPr = cand.target ? pronouns(cand.target) : null;

      let text = '';
      let disEffect = 0;
      let involvedPlayers = [actor];

      if (cand.type === 'sabotageIngredient') {
        text = _rp(PRISON_FOOD_COOKING.sabotageIngredient)(actor, aPr);
        disEffect = 0.3;
        if (enemyVictim) { addBond(actor, enemyVictim, -0.2); }
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[actor] = (gs.popularity[actor] || 0) - 1;
        if (ep.chalMemberScores[actor] !== undefined) ep.chalMemberScores[actor] += 3;

      } else if (cand.type === 'accidentalImprovement') {
        text = _rp(PRISON_FOOD_COOKING.accidentalImprovement)(actor, aPr);
        disEffect = -0.2;
        // Detect check: intuition from teammates
        const detectors = tribe.members.filter(n => n !== actor);
        if (detectors.length) {
          const detectorStats = detectors.map(n => pStats(n));
          const avgIntuition = detectorStats.reduce((a, m) => a + m.intuition, 0) / detectorStats.length;
          if (avgIntuition * 0.08 > 0.5 + Math.random() * 0.3) {
            detectors.forEach(n => addBond(n, actor, -0.3));
            if (!gs.popularity) gs.popularity = {};
            gs.popularity[actor] = (gs.popularity[actor] || 0) - 1;
            involvedPlayers = [...involvedPlayers, ...detectors];
          }
        }

      } else if (cand.type === 'foreignObject') {
        text = _rp(PRISON_FOOD_COOKING.foreignObject)(actor, aPr);
        disEffect = 0.15;
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[actor] = (gs.popularity[actor] || 0) + 1;

      } else if (cand.type === 'tastTestBetrayal') {
        const target = cand.target;
        text = _rp(PRISON_FOOD_COOKING.tastTestBetrayal)(actor, target, aPr, tPr);
        addBond(actor, target, 0.3);
        // Detect check
        const detectChance = pStats(actor).strategic * 0.05;
        if (detectChance < Math.random()) {
          // undetected — apply cross-tribe bond silently
        } else {
          // detected — apply heat
          if (!gs._schemeHeat) gs._schemeHeat = {};
          gs._schemeHeat[actor] = (gs._schemeHeat[actor] || 0) + 1;
        }
        involvedPlayers = [actor, target];
        disEffect = 0;
      }

      disgustScore += disEffect;
      cookingEvents.push({ type: cand.type, actor, text, disEffect, involvedPlayers });

      if (text) {
        pushEvent(text, involvedPlayers, cand.type.toUpperCase().replace(/_/g, ' '), 'orange');
      }
    }

    // THROW INTEGRATION: thrower sets their disgust contribution to 0
    if (thrower && tribe.members.includes(thrower)) {
      const ts = pStats(thrower);
      const throwerContrib = (ts.mental * 0.04 + ts.strategic * 0.03);
      disgustScore -= throwerContrib;
    }

    result.prisonFood.cooking[tribe.name] = { disgustScore, events: cookingEvents };
  }

  // ── 3. EATING DUEL ──
  const tribeNames = tribeMembers.map(t => t.name);
  const victimsByTribe = {}; // tribeName: name of the victim who eats (enemy victim of that tribe)
  // victim[tribeName] = who the ENEMY nominated = who eats on behalf of their OWN tribe
  // Actually: tribe A nominated victim from tribe B; so tribe B's victim eats tribe A's food
  // Let's clarify: victims[tribeA] = player from enemy tribe who eats tribe A's food
  // So we need: for tribe T, who is eating T's food? That's victims[T].
  // And their disgust score source is cooking[T].
  const duelVictims = {}; // tribeName -> victim name (eats that tribe's cooking)
  for (const [tName, vName] of Object.entries(victims)) {
    duelVictims[tName] = vName;
  }

  // Compute victim resist margins
  const victimMargins = {}; // victimName -> cumulative margin
  const victimResists = {}; // victimName -> current resist
  for (const tName of tribeNames) {
    const v = duelVictims[tName];
    if (v) {
      const vs = pStats(v);
      victimResists[v] = vs.endurance * 0.06 + vs.boldness * 0.04;
      victimMargins[v] = 0;
    }
  }

  const roundEscalation = [0.7, 0.85, 1.0, 1.15, 1.3];
  const numRounds = 4 + Math.floor(Math.random() * 2); // 4-5
  let duelLoser = null;
  let vomitRound = null;

  const duelRounds = [];

  for (let r = 0; r < numRounds; r++) {
    const roundData = { round: r + 1, events: [], vomited: null };
    const escFactor = roundEscalation[r] || 1.3;

    pushEvent(_rp(PRISON_FOOD_HOST.roundStart)(host, r + 1), Object.values(duelVictims), `ROUND ${r + 1}`, 'purple');

    // Collect this round's victims with their stats
    const activeDuelTribes = tribeNames.filter(tName => !duelLoser || duelVictims[tName] !== duelLoser);

    // Build event pool for this round
    const eventPool = [];
    const allVictims = tribeNames.map(tName => duelVictims[tName]).filter(Boolean);

    // Helper: pick 2-3 events from pool
    const addPoolEvent = (type, victim, opponent, weight) => {
      eventPool.push({ type, victim, opponent, weight });
    };

    for (const tName of tribeNames) {
      const v = duelVictims[tName];
      if (!v) continue;
      const vs = pStats(v);
      const opp = allVictims.find(n => n !== v) || null;
      const oppPr = opp ? pronouns(opp) : null;
      const tribe = tribeMembers.find(t => t.name === tName);
      const teammates = tribe ? tribe.members.filter(n => n !== v) : [];
      const hasForObj = result.prisonFood.cooking[tName]?.events.some(e => e.type === 'foreignObject');
      const margin = (victimResists[v] || 0) - (result.prisonFood.cooking[tName]?.disgustScore || 0) * escFactor;

      addPoolEvent('gagReflex', v, opp, 0.4);
      if (opp) {
        const oppStats = pStats(opp);
        if (oppStats.boldness * 0.08 > 0.3 + Math.random() * 0.3) addPoolEvent('taunt', v, opp, 0.35);
      }
      if (teammates.length) {
        const avgLoyalty = teammates.reduce((a, n) => a + pStats(n).loyalty, 0) / teammates.length;
        if (avgLoyalty * 0.08 > 0.3 + Math.random() * 0.3) addPoolEvent('encouragement', v, opp, 0.35);
      }
      if (hasForObj) addPoolEvent('foreignObjectDiscovery', v, opp, 0.45);
      if (vs.endurance * 0.08 > 0.4 + Math.random() * 0.3) addPoolEvent('secondWind', v, opp, 0.3);
      if (r >= 2) addPoolEvent('smellHits', v, opp, 0.4);
      if (opp && Math.abs(margin) < 0.1) addPoolEvent('sympathyGag', opp, v, 0.35);
      addPoolEvent('chefCritique', v, opp, 0.3);
      if (tribeMembers.flatMap(t => t.members).length >= 4) addPoolEvent('crowdPressure', v, opp, 0.35);
      if (vs.strategic * 0.08 > 0.4 + Math.random() * 0.3) addPoolEvent('pokerFace', v, opp, 0.3);
      if (r >= 2) addPoolEvent('textureSurprise', v, opp, 0.4);
      const hasCookEnemy = tribeMembers.find(t => t.name !== tName)?.members.some(n => getBond(v, n) <= -3);
      if (hasCookEnemy) addPoolEvent('spiteBite', v, opp, 0.35);
      addPoolEvent('nostrilFlare', v, opp, 0.35);
      if (vs.boldness * 0.08 > 0.4 + Math.random() * 0.3) addPoolEvent('powerStare', v, opp, 0.3);
      if (r >= 1) addPoolEvent('stomachGrowl', v, opp, 0.35);
      if (vs.mental * 0.08 > 0.4 + Math.random() * 0.3) addPoolEvent('flashback', v, opp, 0.3);
    }

    // Normalize + pick 2-3
    const totalW = eventPool.reduce((a, e) => a + e.weight, 0);
    const numEvts = 2 + Math.floor(Math.random() * 2);
    const pickedEvents = [];
    const usedTypes = new Set();
    for (let pick = 0; pick < numEvts && eventPool.length > 0; pick++) {
      let rand = Math.random() * totalW;
      for (const evt of eventPool) {
        rand -= evt.weight;
        if (rand <= 0 && !usedTypes.has(evt.type + evt.victim)) {
          pickedEvents.push(evt);
          usedTypes.add(evt.type + evt.victim);
          break;
        }
      }
    }

    // Apply events + resist modifications
    for (const evt of pickedEvents) {
      const { type, victim, opponent } = evt;
      const vPr = pronouns(victim);
      const oPr = opponent ? pronouns(opponent) : null;
      const tName = tribeNames.find(t => duelVictims[t] === victim);
      let resist = victimResists[victim] || 0;
      let text = '';
      let resistDelta = 0;

      if (type === 'gagReflex')              { text = PRISON_FOOD_EATING.gagReflex(victim, vPr); }
      else if (type === 'taunt')             { resistDelta = -0.05; text = PRISON_FOOD_EATING.taunt(victim, opponent, vPr, oPr); }
      else if (type === 'encouragement')     { resistDelta = +0.05; text = PRISON_FOOD_EATING.encouragement(victim, opponent, vPr, oPr); }
      else if (type === 'foreignObjectDiscovery') { resistDelta = -0.15; text = PRISON_FOOD_EATING.foreignObjectDiscovery(victim, vPr); }
      else if (type === 'secondWind')        { resistDelta = +0.1;  text = PRISON_FOOD_EATING.secondWind(victim, vPr); }
      else if (type === 'smellHits')         { resistDelta = -0.08; text = PRISON_FOOD_EATING.smellHits(victim, vPr); }
      else if (type === 'sympathyGag')       {
        // affect opponent
        if (opponent && victimResists[opponent] !== undefined) victimResists[opponent] -= 0.05;
        text = PRISON_FOOD_EATING.sympathyGag(victim, opponent, vPr, oPr);
      }
      else if (type === 'chefCritique')      { resistDelta = -0.06; text = PRISON_FOOD_EATING.chefCritique(victim, vPr); }
      else if (type === 'crowdPressure')     { resistDelta = +0.04; text = PRISON_FOOD_EATING.crowdPressure(victim, vPr); }
      else if (type === 'pokerFace')         {
        if (opponent && victimResists[opponent] !== undefined) victimResists[opponent] -= 0.03;
        text = PRISON_FOOD_EATING.pokerFace(victim, opponent, vPr, oPr);
      }
      else if (type === 'textureSurprise')   { resistDelta = -0.1;  text = PRISON_FOOD_EATING.textureSurprise(victim, vPr); }
      else if (type === 'spiteBite')         { resistDelta = +0.08; text = PRISON_FOOD_EATING.spiteBite(victim, vPr); }
      else if (type === 'nostrilFlare')      { resistDelta = -0.07; text = PRISON_FOOD_EATING.nostrilFlare(victim, vPr); }
      else if (type === 'powerStare')        {
        resistDelta = +0.06;
        if (opponent && victimResists[opponent] !== undefined) victimResists[opponent] -= 0.03;
        text = PRISON_FOOD_EATING.powerStare(victim, opponent, vPr, oPr);
      }
      else if (type === 'stomachGrowl')      { resistDelta = -0.04; text = PRISON_FOOD_EATING.stomachGrowl(victim, vPr); }
      else if (type === 'flashback')         { resistDelta = +0.05; text = PRISON_FOOD_EATING.flashback(victim, vPr); }

      victimResists[victim] = (victimResists[victim] || 0) + resistDelta;
      const margin = (victimResists[victim] || 0) - (tName ? (result.prisonFood.cooking[tName]?.disgustScore || 0) * escFactor : 0);
      victimMargins[victim] = (victimMargins[victim] || 0) + margin;
      roundData.events.push({ type, victim, text, resistDelta, margin });

      if (text) {
        pushEvent(text, opponent ? [victim, opponent] : [victim], type.replace(/([A-Z])/g, ' $1').toUpperCase().trim(), 'blue');
      }
    }

    // Check for vomit
    for (const tName of tribeNames) {
      const v = duelVictims[tName];
      if (!v || duelLoser) continue;
      const resist = victimResists[v] || 0;
      const disgust = (result.prisonFood.cooking[tName]?.disgustScore || 0) * escFactor;
      if (resist < disgust) {
        duelLoser = v;
        vomitRound = r + 1;
        roundData.vomited = v;
        pushEvent(_rp(PRISON_FOOD_HOST.vomit)(host, v), [v], 'VOMIT', 'red');
        break;
      }
    }

    duelRounds.push(roundData);
    if (duelLoser) break;
  }

  // Tiebreak: lowest cumulative margin loses
  if (!duelLoser && tribeNames.length >= 2) {
    const sortedMargins = tribeNames
      .map(tName => ({ tName, v: duelVictims[tName], m: victimMargins[duelVictims[tName]] || 0 }))
      .sort((a, b) => a.m - b.m);
    duelLoser = sortedMargins[0].v;
  }

  // Determine winner tribe + loser tribe
  const loserTribeName = tribeNames.find(tName => duelVictims[tName] === duelLoser) || null;
  const winnerTribeName = tribeNames.find(tName => tName !== loserTribeName) || null;

  result.prisonFood.duel.rounds = duelRounds;
  result.prisonFood.duel.winner = winnerTribeName;
  result.prisonFood.duel.loser = loserTribeName;
  result.prisonFood.duel.vomitRound = vomitRound;

  // Survivor popularity
  if (!gs.popularity) gs.popularity = {};
  if (winnerTribeName) {
    const survivor = duelVictims[winnerTribeName];
    if (survivor) {
      gs.popularity[survivor] = (gs.popularity[survivor] || 0) + 2;
      if (ep.chalMemberScores[survivor] !== undefined) ep.chalMemberScores[survivor] += 5;
      pushEvent(_rp(PRISON_FOOD_HOST.survive)(host, survivor), [survivor], 'SURVIVED', 'gold');
    }
  }
  if (loserTribeName) {
    const loserVictim = duelVictims[loserTribeName];
    if (loserVictim && ep.chalMemberScores[loserVictim] !== undefined) {
      ep.chalMemberScores[loserVictim] += 0;
    }
  }

  // Golden Shovel reward
  if (winnerTribeName) {
    result.goldenShovel = winnerTribeName;
    result.tribeScores[winnerTribeName] = (result.tribeScores[winnerTribeName] || 0) + 1;
  }

  result.phases.push('prisonFood');
}

export function simulateChefshank(ep) {
  const tribes = gs.tribes;
  if (!tribes || tribes.length < 2) return;
  const tribeMembers = tribes.map(t => ({ name: t.name, members: [...t.members] }));

  const result = {
    phases: [],
    tribeScores: {},
    prisonFood: null,
    prisonBreak: null,
    breakEvents: null,
    goldenShovel: null,
  };
  tribeMembers.forEach(t => { result.tribeScores[t.name] = 0; });

  ep.chefshank = result;
  ep.challengeType = 'chefshank';
  ep.challengeLabel = 'The Chefshank Redemption';

  if (!ep.campEvents) ep.campEvents = {};
  const campKey = gs.tribes[0]?.name || 'merge';
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];

  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  tribeMembers.flatMap(t => t.members).forEach(n => { ep.chalMemberScores[n] = 0; });

  _simulatePrisonFood(ep, tribeMembers, result);

  // TODO: Phase 2 (Prison Break) goes here

  // Fallback: if no phase produced scores, random winner
  const tNames = Object.keys(result.tribeScores);
  const hasScores = tNames.some(n => result.tribeScores[n] > 0);
  if (!hasScores) {
    result.tribeScores[tNames[Math.random() < 0.5 ? 0 : 1]] += 1;
  }

  const sorted = Object.entries(result.tribeScores).sort((a, b) => b[1] - a[1]);
  const winnerName = sorted[0][0];
  const loserName = sorted[sorted.length - 1][0];
  ep.winner = tribes.find(t => t.name === winnerName);
  ep.loser = tribes.find(t => t.name === loserName);
  ep.tribalPlayers = [...ep.loser.members];
  ep.safeTribes = tribes.filter(t => t.name !== loserName && t.name !== winnerName);

  updateChalRecord(ep);

  ep.campEvents[campKey].post.push({
    text: `The Chefshank Redemption: ${winnerName} breaks free. ${loserName} stays locked up — tribal council tonight.`,
    players: tribeMembers.flatMap(t => t.members),
    badgeText: 'CHEFSHANK REDEMPTION', badgeClass: 'gold',
    tag: 'challenge',
  });

  ep._debugChefshank = {
    tribeScores: { ...result.tribeScores },
    phases: [...result.phases],
  };
}

export function _textChefshank(ep, ln, sec) {
  const cs = ep.chefshank;
  if (!cs) return;
  sec('The Chefshank Redemption');
  ln('The teams face a prison-themed challenge — cook disgusting food, then dig their way to freedom.');
}

export function rpBuildChefshankTitleCard(ep) {
  if (!ep.chefshank) return '';
  return '<div style="padding:40px;text-align:center;color:#6b7280;font-family:serif;"><h1>⛓️ THE CHEFSHANK REDEMPTION</h1><p>Title Card — Full VP coming soon</p></div>';
}

export function chefshankRevealNext() {}
export function chefshankRevealAll() {}
