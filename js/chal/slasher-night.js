// js/chal/slasher-night.js
import { gs, players } from '../core.js';
import { pStats, pronouns, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { wRandom } from '../alliances.js';

function _slasherResolveText(template, ctx) {
  if (!template) return '';
  let t = template;
  if (ctx.name)    t = t.replace(/\{name\}/g,    ctx.name);
  if (ctx.ally)    t = t.replace(/\{ally\}/g,    ctx.ally);
  if (ctx.enemy)   t = t.replace(/\{enemy\}/g,   ctx.enemy);
  if (ctx.victim)  t = t.replace(/\{victim\}/g,  ctx.victim);
  if (ctx.winner)  t = t.replace(/\{winner\}/g,  ctx.winner);
  if (ctx.loser)   t = t.replace(/\{loser\}/g,   ctx.loser);
  if (ctx.scarer)  t = t.replace(/\{scarer\}/g,  ctx.scarer);
  // Pronoun resolution — use the main actor's pronouns
  const prName = ctx.name || ctx.scarer || ctx.winner || ctx.loser;
  if (prName) {
    const pr = pronouns(prName);
    t = t.replace(/\{pr\.sub\}/g,    pr.sub);
    t = t.replace(/\{pr\.obj\}/g,    pr.obj);
    t = t.replace(/\{pr\.pos\}/g,    pr.pos);
    t = t.replace(/\{pr\.posAdj\}/g, pr.posAdj);
    t = t.replace(/\{pr\.ref\}/g,    pr.ref);
    t = t.replace(/\{pr\.Sub\}/g,    pr.Sub);
    t = t.replace(/\{pr\.Obj\}/g,    pr.Obj);
    t = t.replace(/\{pr\.PosAdj\}/g, pr.PosAdj);
    // Handle inline ternary patterns like {pr.sub==='they'?'are':'is'}
    // Use greedy match with lookahead for the closing '} to handle apostrophes inside words (don't, isn't, etc.)
    t = t.replace(/\{pr\.sub==='they'\?'(.*?)':'(.*?)'\}/g,
      (_, ifThey, ifOther) => pr.sub === 'they' ? ifThey : ifOther);
  }
  return t;
}

function _slasherPickEvents(player, survivors, context) {
  const stats = pStats(player);
  const { roundNum, pairings, scores, eventHistory, caughtThisRound } = context;
  const nearby = (pairings[player] || []).filter(a => survivors.includes(a) && !caughtThisRound.has(a));
  const isAlone = nearby.length === 0;
  const groupSize = nearby.length + 1; // including self
  const emotional = getPlayerState(player).emotional;

  // Find an ally (highest bond among nearby)
  let bestAlly = null, bestAllyBond = -Infinity;
  for (const n of nearby) {
    const b = getBond(player, n);
    if (b > bestAllyBond) { bestAllyBond = b; bestAlly = n; }
  }
  // Find an enemy (lowest bond among nearby survivors)
  let bestEnemy = null, bestEnemyBond = Infinity;
  for (const n of survivors) {
    if (n === player) continue;
    const b = getBond(player, n);
    if (b < bestEnemyBond) { bestEnemyBond = b; bestEnemy = n; }
  }
  // Find a victim (nearby player with lowest bond to this player)
  let victimName = null, victimBond = Infinity;
  for (const n of nearby) {
    const b = getBond(player, n);
    if (b < victimBond) { victimBond = b; victimName = n; }
  }
  if (!victimName && nearby.length) victimName = nearby[0];

  // Showmance partner
  const showmancePartner = getShowmancePartner(player);

  // Player's past event IDs for diminishing returns
  const pastIds = (eventHistory[player] || []);
  const idCounts = {};
  pastIds.forEach(id => { idCounts[id] = (idCounts[id] || 0) + 1; });

  // Is player the highest scorer?
  const isHighScorer = Object.entries(scores).filter(([n]) => survivors.includes(n))
    .every(([n, s]) => n === player || s <= scores[player]);

  // Check if ally was betrayed last ep (voted against player)
  const lastEpHistory = gs.episodeHistory.length ? gs.episodeHistory[gs.episodeHistory.length - 1] : null;
  const wasBetrayed = bestAlly && lastEpHistory?.votingLog?.some(v => v.voter === bestAlly && v.voted === player);

  // Check named alliances
  const playerAlliances = (gs.namedAlliances || []).filter(a => a.active && a.members.includes(player));

  // Build eligible events
  const eligible = [];

  const checkEvent = (evt) => {
    // Stat check
    if (!evt.statCheck(stats)) return null;

    // Social requirements
    if (evt.requiresAlly && !bestAlly) return null;
    if (evt.requiresAlly && evt.requiresBond !== undefined && bestAllyBond < evt.requiresBond) return null;
    if (evt.requiresEnemy && (!bestEnemy || bestEnemyBond >= (evt.requiresBond || 0))) return null;
    if (evt.requiresSolo && !isAlone) return null;
    if (evt.requiresGroup && groupSize < 3) return null;
    if (evt.requiresShowmance && !(showmancePartner && survivors.includes(showmancePartner) && nearby.includes(showmancePartner))) return null;
    if (evt.requiresHighScore && !isHighScorer) return null;
    if (evt.requiresLateRound && roundNum < evt.requiresLateRound) return null;
    if (evt.requiresSurvivedRounds && roundNum < evt.requiresSurvivedRounds) return null;
    if (evt.requiresBetrayedLastEp && !wasBetrayed) return null;
    if (evt.requiresVictimNearby && nearby.length < 1) return null;
    if (evt.requiresVictimCheck && bestAlly && !evt.requiresVictimCheck(pStats(bestAlly))) return null;
    if (evt.requiresAllyWithLowLoyalty) {
      const lowLoyaltyAlly = nearby.find(n => pStats(n).loyalty <= evt.requiresAllyWithLowLoyalty);
      if (!lowLoyaltyAlly) return null;
    }
    if (evt.requiresNamedAlliance && !playerAlliances.length) return null;

    // Diminishing returns
    const useCount = idCounts[evt.id] || 0;
    let pointsAdj = evt.points;
    if (useCount >= 1) {
      const dr = SLASHER_DIMINISHING_RETURNS[Math.min(useCount, 3)] || -2;
      pointsAdj = evt.points > 0 ? Math.max(1, evt.points + dr) : evt.points;
    }

    // Pick text variant
    const textTemplate = evt.textVariants[Math.floor(Math.random() * evt.textVariants.length)];

    // Determine ally for this event (for alliance-fracture, use the low-loyalty ally)
    let evtAlly = bestAlly;
    if (evt.requiresAllyWithLowLoyalty) {
      evtAlly = nearby.find(n => pStats(n).loyalty <= evt.requiresAllyWithLowLoyalty) || bestAlly;
    }

    // Resolve text
    const text = _slasherResolveText(textTemplate, {
      name: player,
      ally: evtAlly || bestAlly,
      enemy: bestEnemy,
      victim: victimName || bestEnemy,
      scarer: player,
      winner: null, loser: null
    });

    // Bond changes
    const bondChanges = [];
    if (evt.bondEffect) {
      const be = evt.bondEffect;
      if (be.target === 'ally' && evtAlly) {
        bondChanges.push({ a: player, b: evtAlly, delta: be.delta });
      } else if (be.target === 'enemy' && bestEnemy) {
        bondChanges.push({ a: player, b: bestEnemy, delta: be.delta });
      } else if (be.target === 'victim' && victimName) {
        bondChanges.push({ a: player, b: victimName, delta: be.delta });
      } else if (be.target === 'witnesses') {
        nearby.forEach(n => bondChanges.push({ a: player, b: n, delta: be.delta }));
      }
    }

    // Weight for selection: base from points + randomness + archetype alignment
    const baseWeight = Math.abs(pointsAdj) + 1;
    const emotionalMod = (emotional === 'paranoid' || emotional === 'desperate') && evt.type === 'negative' ? 1.3 : 1;
    const dimMod = useCount >= 1 ? 0.4 : 1; // strongly deprioritize repeats
    const weight = Math.max(0.1, baseWeight * emotionalMod * dimMod + Math.random() * 2);

    return { event: evt, points: pointsAdj, text, bondChanges, flags: evt.flags || {},
             ally: evtAlly, enemy: bestEnemy, victim: victimName, weight };
  };

  // Check all positive and negative events
  SLASHER_EVENTS.positive.forEach(evt => {
    const result = checkEvent(evt);
    if (result) eligible.push(result);
  });
  SLASHER_EVENTS.negative.forEach(evt => {
    const result = checkEvent(evt);
    if (result) eligible.push(result);
  });

  // Fallback: if nothing eligible, give a generic survival moment
  if (!eligible.length) {
    eligible.push({
      event: { id: 'generic-survive', type: 'positive', points: 0 },
      points: 0, text: `${player} keeps moving through the dark. Still here.`,
      bondChanges: [], flags: {}, weight: 1
    });
  }

  // Pick 1 guaranteed event (weighted)
  const picked = [];
  const pick1 = wRandom(eligible, e => e.weight);
  if (pick1) {
    picked.push(pick1);
    // Remove from pool to avoid picking same event twice
    const remaining = eligible.filter(e => e.event.id !== pick1.event.id);
    // 40% chance of a 2nd event
    if (remaining.length && Math.random() < 0.40) {
      const pick2 = wRandom(remaining, e => e.weight);
      if (pick2) picked.push(pick2);
    }
  }

  return picked;
}

function _slasherCatchTargeting(survivors, roundNum, context) {
  const { flags, scores, pairings, totalRounds } = context;

  // Never catch below 2 — those go to final showdown
  if (survivors.length <= 2) return [];

  // Number to catch: 1 if <=4 survivors; else 1-2 weighted
  let numCatch = 1;
  if (survivors.length > 4) {
    const earlyRound = roundNum <= Math.ceil(totalRounds / 2);
    numCatch = Math.random() < (earlyRound ? 0.60 : 0.30) ? 2 : 1;
  }
  // Don't catch so many we skip the final showdown
  numCatch = Math.min(numCatch, survivors.length - 2);
  if (numCatch <= 0) return [];

  // Calculate catch weights
  const weights = survivors.map(name => {
    const s = pStats(name);
    const pFlags = flags[name] || {};
    const isAlone = !(pairings[name]?.some(a => survivors.includes(a)));
    const groupMod = isAlone ? SLASHER_GROUP_CATCH_MOD.solo :
      (pairings[name]?.filter(a => survivors.includes(a)).length >= 2 ? SLASHER_GROUP_CATCH_MOD.group : SLASHER_GROUP_CATCH_MOD.pair);

    let w = (10 - s.boldness) * 0.3
          + (10 - s.intuition) * 0.2
          + (10 - s.physical) * 0.1
          + groupMod
          + (pFlags.justScreamed ? 1.5 : 0)
          + (pFlags.justArgued ? 1.0 : 0)
          + (pFlags.catchBoost || 0)
          + (pFlags.decoyCatchBoost || 0)
          - (pFlags.isHiding ? 3 : 0)
          - (pFlags.isBarricaded ? 2 : 0);

    // Immune from catch this round (fake-out)
    if (pFlags.immuneFromCatch) w = 0;
    // Auto-catch if fell asleep
    if (pFlags.autoCatchIfRolled) w += 10;

    return { name, weight: Math.max(0.1, w) };
  });

  const caught = [];
  for (let i = 0; i < numCatch; i++) {
    const pool = weights.filter(w => !caught.includes(w.name) && w.weight > 0);
    if (!pool.length) break;
    const pick = wRandom(pool, w => w.weight);
    if (pick) caught.push(pick.name);
  }

  return caught;
}

function _slasherFinalShowdown(p1, p2, scores) {
  const s1 = pStats(p1), s2 = pStats(p2);
  const bondChanges = [];

  // Weighted roll to determine winner: composite stat + score advantage + randomness
  const composite = s => s.physical * 0.2 + s.endurance * 0.15 + s.mental * 0.1
    + s.strategic * 0.15 + s.boldness * 0.15 + s.intuition * 0.1 + s.social * 0.05 + s.temperament * 0.1;
  const w1 = composite(s1) + (scores[p1] || 0) * 0.1 + Math.random() * 3;
  const w2 = composite(s2) + (scores[p2] || 0) * 0.1 + Math.random() * 3;

  const winner = w1 >= w2 ? p1 : p2;
  const loser  = winner === p1 ? p2 : p1;
  const winStats = pStats(winner), loseStats = pStats(loser);
  const bond = getBond(winner, loser);

  // Pick win method: find qualifying methods, pick highest priority
  const eligibleWin = SLASHER_FINAL_WIN.filter(m => {
    if (!m.statCheck(winStats)) return false;
    if (m.requiresLowBondWithOpponent && bond > 0) return false;
    return true;
  });

  let winMethod;
  if (eligibleWin.length) {
    // Sort by priority (highest first), pick from top 2 with some randomness
    eligibleWin.sort((a, b) => (b.priority(winStats) + Math.random()) - (a.priority(winStats) + Math.random()));
    winMethod = eligibleWin[0];
  } else {
    // Fallback: terror escape
    winMethod = SLASHER_FINAL_WIN.find(m => m.id === 'terror-escape') || SLASHER_FINAL_WIN[0];
  }

  // Pick lose method based on win method
  let loseMethod;
  if (winMethod.id === 'uses-shield') {
    loseMethod = SLASHER_FINAL_LOSE.find(m => m.id === 'pushed-as-shield');
  } else {
    // Heroic sacrifice: only if loser has loyalty >= 8 and bond >= 4 with winner
    const canSacrifice = loseStats.loyalty >= 8 && bond >= 4;
    const eligibleLose = SLASHER_FINAL_LOSE.filter(m => {
      if (m.requiresWinMethod) return false; // skip 'pushed-as-shield'
      if (m.id === 'heroic-sacrifice' && !canSacrifice) return false;
      if (m.requiresHighBondWithWinner && bond < m.requiresHighBondWithWinner) return false;
      return m.statCheck(loseStats);
    });
    if (eligibleLose.length) {
      // Prefer heroic sacrifice if eligible (dramatic)
      loseMethod = eligibleLose.find(m => m.id === 'heroic-sacrifice') || eligibleLose[Math.floor(Math.random() * eligibleLose.length)];
    } else {
      // Fallback: outsmarted
      loseMethod = SLASHER_FINAL_LOSE.find(m => m.id === 'outsmarted-by-slasher') || SLASHER_FINAL_LOSE[0];
    }
  }

  // Resolve text
  const winTextTemplate = winMethod.textVariants[Math.floor(Math.random() * winMethod.textVariants.length)];
  const loseTextTemplate = loseMethod.textVariants[Math.floor(Math.random() * loseMethod.textVariants.length)];

  const winText = _slasherResolveText(winTextTemplate, { name: winner, loser, winner, ally: null, enemy: loser });
  const loseText = _slasherResolveText(loseTextTemplate, { name: loser, winner, loser, ally: null, enemy: winner });

  // Apply bond effects
  if (winMethod.bondEffect) {
    const be = winMethod.bondEffect;
    if (be.target === 'opponent') {
      bondChanges.push({ a: winner, b: loser, delta: be.delta });
    } else if (be.target === 'tribe') {
      gs.activePlayers.filter(p => p !== winner).forEach(p => {
        bondChanges.push({ a: winner, b: p, delta: be.delta });
      });
    }
  }
  if (loseMethod.bondEffect) {
    const be = loseMethod.bondEffect;
    if (be.target === 'winner') {
      bondChanges.push({ a: loser, b: winner, delta: be.delta });
      if (be.tribeBonus) {
        gs.activePlayers.filter(p => p !== loser && p !== winner).forEach(p => {
          bondChanges.push({ a: loser, b: p, delta: be.tribeBonus });
        });
      }
    }
  }

  return {
    winner, loser,
    winMethod: winMethod.id, winText,
    loseMethod: loseMethod.id, loseText,
    shieldPush: winMethod.id === 'uses-shield',
    heroicSacrifice: loseMethod.id === 'heroic-sacrifice',
    bondChanges
  };
}

export function simulateSlasherNight(ep) {
  const activePlayers = [...gs.activePlayers];
  // Max rounds: enough to catch everyone down to 2 (each round catches 1-2)
  const totalRounds = activePlayers.length * 2; // generous cap — loop breaks at 2 survivors
  const scores = {};
  const eventHistory = {}; // { [name]: [eventId, eventId, ...] }
  activePlayers.forEach(n => { scores[n] = 0; eventHistory[n] = []; });

  // ── INITIAL PAIRINGS ──
  // Based on bonds: bond >= 3 → paired, showmances always paired
  const pairings = {}; // { [name]: [nearby allies] }
  activePlayers.forEach(n => { pairings[n] = []; });

  // Showmance pairs always together
  (gs.showmances || []).forEach(sh => {
    if (sh.phase === 'broken-up') return;
    const [a, b] = sh.players;
    if (activePlayers.includes(a) && activePlayers.includes(b)) {
      if (!pairings[a].includes(b)) pairings[a].push(b);
      if (!pairings[b].includes(a)) pairings[b].push(a);
    }
  });

  // Bond-based pairing: sort all pairs by bond descending, greedily pair
  const bondPairs = [];
  for (let i = 0; i < activePlayers.length; i++) {
    for (let j = i + 1; j < activePlayers.length; j++) {
      const b = getBond(activePlayers[i], activePlayers[j]);
      if (b >= 3) bondPairs.push({ a: activePlayers[i], b: activePlayers[j], bond: b });
    }
  }
  bondPairs.sort((x, y) => y.bond - x.bond);
  bondPairs.forEach(({ a, b }) => {
    if (!pairings[a].includes(b)) pairings[a].push(b);
    if (!pairings[b].includes(a)) pairings[b].push(a);
  });

  // ── ROUND LOOP ──
  let survivors = [...activePlayers];
  const caughtOrder = []; // [{ name, round, finalScore }]
  const rounds = [];

  for (let roundNum = 1; roundNum <= totalRounds; roundNum++) {
    // Check if we're at final 2
    if (survivors.length <= 2) break;

    const roundEvents = [];
    const roundFlags = {}; // per-player flags this round: { [name]: { justScreamed, isHiding, ... } }
    survivors.forEach(n => { roundFlags[n] = {}; });
    const caughtThisRound = new Set();

    // Survival bonus deferred to after catch targeting (only survivors who aren't caught get it)

    // ── Alliance coordination bonus ──
    // Named alliances with 3+ active survivors get bonus
    (gs.namedAlliances || []).forEach(alliance => {
      if (!alliance.active) return;
      const allianceAlive = alliance.members.filter(m => survivors.includes(m));
      if (allianceAlive.length >= 3) {
        // Find the "hub" — highest stat in the relevant category
        const leader = allianceAlive.reduce((best, n) => {
          const s = pStats(n);
          const score = Math.max(s.strategic, s.social, s.physical);
          return score > (best.score || 0) ? { name: n, score } : best;
        }, { score: 0 }).name;
        if (leader) {
          const leaderStats = pStats(leader);
          if (leaderStats.strategic >= 7) {
            // Strategic hub: group hides and sets traps
            allianceAlive.forEach(n => { scores[n] += 2; });
            scores[leader] += 1; // extra for leader
          } else if (leaderStats.social >= 7) {
            // Social hub: prevents panic
            allianceAlive.forEach(n => { roundFlags[n].panicImmune = true; });
          } else if (Math.random() < leaderStats.physical * 0.10) {
            // Physical hub: stands guard — proportional
            allianceAlive.forEach(n => { roundFlags[n].catchBoost = (roundFlags[n].catchBoost || 0) - 1; });
          }
        }
      }
    });

    // ── Hero/Villain Slasher Night bonuses ──
    survivors.forEach(p => {
      const _pArch = players.find(pl => pl.name === p)?.archetype || '';
      if (_pArch === 'villain') {
        // Villains THRIVE in Slasher Night — intimidation is their element
        scores[p] += 2; // baseline score boost
        roundFlags[p].panicImmune = true; // villains don't panic
      }
      if (_pArch === 'hero') {
        // Heroes protect others at personal cost — lower score but bond gains
        const _nearbyAllies = (pairings[p] || []).filter(a => survivors.includes(a));
        if (_nearbyAllies.length) {
          _nearbyAllies.forEach(ally => {
            scores[ally] += 1; // hero shields allies
            addBond(ally, p, 0.3); // ally appreciates the protection
          });
          scores[p] -= 1; // hero takes the risk
        }
      }
    });

    // ── Pick events per surviving player ──
    for (const player of survivors) {
      const events = _slasherPickEvents(player, survivors, {
        roundNum, pairings, scores, eventHistory, caughtThisRound
      });

      events.forEach(ev => {
        scores[player] += ev.points;
        eventHistory[player].push(ev.event.id);

        // Merge flags into round flags
        if (ev.flags) {
          Object.entries(ev.flags).forEach(([k, v]) => {
            if (k === 'groupBonus' && v) {
              // Rally bonus: +1 to all nearby
              (pairings[player] || []).filter(a => survivors.includes(a)).forEach(a => {
                scores[a] += v;
              });
            } else if (k === 'victimCaught' && v && ev.victim) {
              // Push toward slasher: victim auto-caught
              if (survivors.includes(ev.victim) && !caughtThisRound.has(ev.victim)) {
                caughtThisRound.add(ev.victim);
                caughtOrder.push({ name: ev.victim, round: roundNum, finalScore: scores[ev.victim] });
              }
            } else if (k === 'victimPoints' && ev.victim) {
              // Scare teammate: victim gets penalty
              scores[ev.victim] = (scores[ev.victim] || 0) + v;
            } else if (k === 'witnessPanic' && v) {
              // Fake-out: witnesses may panic
              (pairings[player] || []).filter(a => survivors.includes(a)).forEach(a => {
                if (pStats(a).temperament <= 5 && Math.random() < 0.5) {
                  scores[a] += v;
                }
              });
            } else if (k === 'bothAffected' && v && ev.enemy && survivors.includes(ev.enemy)) {
              // Rivalry: both get penalty + catch boost
              scores[ev.enemy] += ev.points;
              roundFlags[ev.enemy] = roundFlags[ev.enemy] || {};
              roundFlags[ev.enemy].justArgued = true;
              roundFlags[ev.enemy].catchBoost = (roundFlags[ev.enemy].catchBoost || 0) + (ev.flags.catchBoost || 0);
            } else {
              roundFlags[player][k] = v;
            }
          });
        }

        // Apply bond changes
        ev.bondChanges.forEach(bc => addBond(bc.a, bc.b, bc.delta));

        roundEvents.push({
          player, eventId: ev.event.id, points: ev.points, text: ev.text,
          type: ev.event.type, bondChanges: ev.bondChanges.map(bc => ({...bc})),
          ally: ev.ally || null, enemy: ev.enemy || null, victim: ev.victim || null
        });
      });
    }

    // ── Overconfidence penalty ──
    // Highest scorer this round with boldness >= 6 → 20% chance of penalty
    const roundScoreGains = {};
    roundEvents.forEach(re => {
      roundScoreGains[re.player] = (roundScoreGains[re.player] || 0) + re.points;
    });
    const topScorer = survivors.reduce((best, n) => {
      const gain = roundScoreGains[n] || 0;
      return gain > (best.gain || -Infinity) ? { name: n, gain } : best;
    }, { gain: -Infinity });
    if (topScorer.name && Math.random() < pStats(topScorer.name).boldness * 0.02) { // proportional: stat 4=8%, stat 7=14%, stat 10=20%
      scores[topScorer.name] -= 3;
      roundFlags[topScorer.name].highScore = true;
      roundEvents.push({
        player: topScorer.name, eventId: 'overconfidence-penalty', points: -3,
        text: `${topScorer.name} gets cocky. Drops ${pronouns(topScorer.name).posAdj} guard for one second too long. The slasher was watching.`,
        type: 'negative', bondChanges: [], ally: null, enemy: null, victim: null
      });
    }

    // ── Catch targeting ──
    const caughtNames = _slasherCatchTargeting(
      survivors.filter(n => !caughtThisRound.has(n)),
      roundNum,
      { flags: roundFlags, scores, pairings, totalRounds }
    );

    // Process caught players
    caughtNames.forEach(name => {
      if (caughtThisRound.has(name)) return; // already caught by push event
      caughtThisRound.add(name);
      caughtOrder.push({ name, round: roundNum, finalScore: scores[name] });

      // Pick caught scene
      const s = pStats(name);
      const pf = roundFlags[name] || {};
      const eligibleScenes = SLASHER_CAUGHT_SCENES.filter(sc => {
        if (sc.requiresFlag && !pf[sc.requiresFlag]) return false;
        if (sc.requiresLateRound && roundNum < sc.requiresLateRound) return false;
        return sc.statCheck(s);
      });
      const scene = eligibleScenes.length
        ? eligibleScenes[Math.floor(Math.random() * eligibleScenes.length)]
        : SLASHER_CAUGHT_SCENES.find(sc => sc.id === 'classic-catch') || SLASHER_CAUGHT_SCENES[0];

      // Find ally for caught scene text
      const catchAlly = (pairings[name] || []).find(a => survivors.includes(a) && !caughtThisRound.has(a));
      const sceneText = _slasherResolveText(scene.text, { name, ally: catchAlly });

      roundEvents.push({
        player: name, eventId: 'caught-' + scene.id, points: 0,
        text: sceneText, type: 'caught', bondChanges: [], ally: catchAlly, enemy: null, victim: null
      });

      // When partner gets caught: check loyalty response of nearby allies
      (pairings[name] || []).filter(a => survivors.includes(a) && !caughtThisRound.has(a)).forEach(ally => {
        const allyStats = pStats(ally);
        const allyBond = getBond(ally, name);
        // Proportional rescue: loyalty determines chance and quality of help
        const _rescueChance = allyStats.loyalty * 0.10; // loyalty 3=30%, loyalty 7=70%, loyalty 10=100%
        if (Math.random() < _rescueChance) {
          const _rescueQuality = allyStats.loyalty * 0.3; // loyalty 3=0.9, loyalty 7=2.1, loyalty 10=3.0
          scores[ally] += Math.round(_rescueQuality);
          addBond(ally, name, allyStats.loyalty * 0.15);
          roundFlags[ally].decoyCatchBoost = (roundFlags[ally].decoyCatchBoost || 0) + Math.round(allyStats.loyalty * 0.2);
          roundEvents.push({
            player: ally, eventId: 'partner-rescue-attempt', points: Math.round(_rescueQuality),
            text: `${ally} sees ${name} go down and charges in. ${pronouns(ally).Sub} ${pronouns(ally).sub === 'they' ? 'aren\'t' : 'isn\'t'} leaving anyone behind.`,
            type: 'positive', bondChanges: [{ a: ally, b: name, delta: allyStats.loyalty * 0.15 }], ally: name, enemy: null, victim: null
          });
        } else {
          // Didn't help — bond penalty scales inversely with loyalty (disloyal = bigger betrayal)
          addBond(ally, name, -(1.0 - allyStats.loyalty * 0.08));
          roundFlags[ally].partnerCaught = true;
        }
      });
    });

    // Deferred survival bonus: only players who survive this round (not caught) get +2
    survivors.filter(n => !caughtThisRound.has(n)).forEach(n => {
      scores[n] += SLASHER_ROUND_SURVIVAL_BONUS;
    });

    // Save who was alive at start of round (before catching) for VP display
    const _remainingBeforeCatch = [...survivors];
    // Remove caught from survivors
    survivors = survivors.filter(n => !caughtThisRound.has(n));

    // Atmosphere text
    const atmosphere = SLASHER_ATMOSPHERE[Math.floor(Math.random() * SLASHER_ATMOSPHERE.length)];

    rounds.push({
      num: roundNum,
      events: roundEvents,
      caught: [...caughtThisRound].map(n => ({
        name: n,
        score: scores[n],
        scene: roundEvents.find(e => e.player === n && e.type === 'caught')?.text || ''
      })),
      atmosphere,
      remaining: _remainingBeforeCatch,
      survivorCount: survivors.length
    });

    // Update pairings: remove caught players
    survivors.forEach(n => {
      pairings[n] = (pairings[n] || []).filter(a => survivors.includes(a));
    });
  }

  // ── FINAL SHOWDOWN ──
  let finalShowdown = null;
  if (survivors.length === 2) {
    finalShowdown = _slasherFinalShowdown(survivors[0], survivors[1], scores);

    // Apply bond changes from showdown
    finalShowdown.bondChanges.forEach(bc => addBond(bc.a, bc.b, bc.delta));

    // Award survival bonus to showdown participants
    scores[finalShowdown.winner] += SLASHER_ROUND_SURVIVAL_BONUS;
    scores[finalShowdown.loser] += SLASHER_ROUND_SURVIVAL_BONUS;

    // Loser is caught last
    caughtOrder.push({ name: finalShowdown.loser, round: totalRounds, finalScore: scores[finalShowdown.loser] });
  } else if (survivors.length === 1) {
    // Edge case: only 1 survivor left (all others caught in rounds)
    finalShowdown = {
      winner: survivors[0], loser: null,
      winMethod: 'last-standing', winText: `${survivors[0]} is the last one standing. No showdown needed.`,
      loseMethod: null, loseText: null, bondChanges: []
    };
  }

  // ── DETERMINE RESULTS ──
  const immunityWinner = finalShowdown?.winner || survivors[0];

  // Lowest total score = eliminated (excluding immunity winner)
  // Tiebreaker: caught earliest → most negative events → random
  const scorable = activePlayers.filter(n => n !== immunityWinner);
  scorable.sort((a, b) => {
    const diff = scores[a] - scores[b];
    if (diff !== 0) return diff; // lowest score first
    // Tie: caught earlier = eliminated (handled fear worse)
    const caughtA = caughtOrder.find(c => c.name === a)?.round ?? Infinity;
    const caughtB = caughtOrder.find(c => c.name === b)?.round ?? Infinity;
    if (caughtA !== caughtB) return caughtA - caughtB; // earlier caught = worse
    // Still tied: more negative events = worse
    const negA = rounds.flatMap(r => r.events).filter(e => e.player === a && e.points < 0).length;
    const negB = rounds.flatMap(r => r.events).filter(e => e.player === b && e.points < 0).length;
    if (negA !== negB) return negB - negA; // more negatives = worse
    // Final tiebreak: random
    return Math.random() - 0.5;
  });
  const eliminated = scorable[0];

  // Build leaderboard
  const leaderboard = activePlayers.map(n => ({
    name: n, score: scores[n],
    caughtRound: caughtOrder.find(c => c.name === n)?.round || null,
    isWinner: n === immunityWinner,
    isEliminated: n === eliminated
  })).sort((a, b) => b.score - a.score);

  // ── Surviving together bond bonus: +0.5 for all who survived to round 2+ ──
  const survivedMultipleRounds = activePlayers.filter(n => {
    const c = caughtOrder.find(co => co.name === n);
    return !c || c.round >= 2;
  });
  for (let i = 0; i < survivedMultipleRounds.length; i++) {
    for (let j = i + 1; j < survivedMultipleRounds.length; j++) {
      addBond(survivedMultipleRounds[i], survivedMultipleRounds[j], 0.5);
    }
  }

  // ── SET RESULTS ON EP ──
  ep.slasherNight = {
    rounds,
    scores,
    caughtOrder,
    pairings,
    finalShowdown,
    immunityWinner,
    eliminated,
    leaderboard
  };

  // Popularity: last survivor gets hero edit, weakest link gets soft target edit
  if (!gs.popularity) gs.popularity = {};
  if (immunityWinner) gs.popularity[immunityWinner] = (gs.popularity[immunityWinner] || 0) + 2; // survived slasher night = fan favourite
  if (eliminated) gs.popularity[eliminated] = (gs.popularity[eliminated] || 0) - 1; // slasher night's weakest = easy target

  updateChalRecord(ep);
}

export function _textSlasherNight(ep, ln, sec) {
  // Slasher pre-tribal kill
  const _slasherTw = (ep.twists||[]).find(t => t.type === 'slasher-night');
  if (_slasherTw?.slasher && _slasherTw?.slasherVictim) {
    sec('SLASHER NIGHT');
    ln(`${_slasherTw.slasher} was secretly chosen as the Slasher.`);
    ln(`At camp, ${_slasherTw.slasher} eliminated ${_slasherTw.slasherVictim} before tribal. The tribe woke to find them gone.`);
    ln(`Tribal council still runs — a second player will be voted out.`);
  }

  // Full slasher night episode
  if (!ep.isSlasherNight || !ep.slasherNight) return;
  const sn = ep.slasherNight;
  sec('SLASHER NIGHT');
  if (sn.finalShowdown) {
    if (sn.finalShowdown.winMethod === 'last-standing') ln(`IMMUNITY WINNER: ${sn.immunityWinner} — last one standing.`);
    else ln(`IMMUNITY WINNER: ${sn.immunityWinner} — won the final showdown (${sn.finalShowdown.winMethod}).`);
  } else ln(`IMMUNITY WINNER: ${sn.immunityWinner}`);
  ln('');
  (sn.rounds || []).forEach(r => {
    ln(`Round ${r.num} — ${r.survivorCount + (r.caught?.length || 0)} remaining:`);
    if (r.caught?.length) r.caught.forEach(c => ln(`  Caught: ${c.name} (score: ${c.score})`));
    else ln('  No one caught.');
  });
  ln('');
  if (sn.finalShowdown?.loser) {
    ln(`FINAL SHOWDOWN: ${sn.finalShowdown.winner} vs ${sn.finalShowdown.loser}`);
    if (sn.finalShowdown.winText) ln(`  ${sn.finalShowdown.winText}`);
    if (sn.finalShowdown.loseText) ln(`  ${sn.finalShowdown.loseText}`);
  }
  ln('');
  ln(`ELIMINATED: ${sn.eliminated} (score: ${sn.scores[sn.eliminated]})`);
  ln('');
  ln('WHY THEY DIDN\'T SURVIVE:');
  const elimEvents = (sn.rounds || []).flatMap(r => r.events.filter(e => e.player === sn.eliminated));
  const negativeEvents = elimEvents.filter(e => e.points < 0 || e.type === 'caught' || e.type === 'negative');
  if (negativeEvents.length) negativeEvents.forEach(e => ln(`  - ${e.text || e.eventId} (${e.points >= 0 ? '+' : ''}${e.points} pts)`));
  else ln('  - No standout negative events — simply accumulated the lowest score.');
  ln(`  Final score: ${sn.scores[sn.eliminated]}`);
}

export function rpBuildSlasherAnnouncement(ep) {
  const sn = ep.slasherNight;
  if (!sn) return '';
  const allPlayers = sn.rounds?.[0]?.remaining || sn.leaderboard?.map(e => e.name) || [];
  let html = `<div class="rp-page tod-deepnight">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div style="text-align:center;margin:30px 0 10px">
      <div class="slasher-pulse" style="display:inline-block;border-radius:50%;padding:4px">
        <img src="assets/avatars/slasher.png" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"
             style="width:120px;height:120px;border-radius:50%;border:3px solid #da3633">
        <div style="display:none;width:120px;height:120px;border-radius:50%;background:#1c2128;border:3px solid #da3633;font-size:48px;line-height:120px;text-align:center">🔪</div>
      </div>
    </div>
    <div class="rp-title" style="color:#da3633;text-shadow:0 0 20px rgba(218,54,51,0.5)">Slasher Night</div>
    <div style="font-size:14px;color:#8b949e;text-align:center;margin-bottom:20px;font-style:italic">Night falls. Something is out there.</div>
    <div class="vp-card" style="text-align:center;margin:20px auto;max-width:480px;border-color:rgba(218,54,51,0.3);background:rgba(218,54,51,0.05)">
      <div style="font-size:13px;color:#cdd9e5;line-height:1.8">
        A slasher is loose at camp. Players will be hunted round by round.<br>
        <strong style="color:#3fb950">Last one standing wins immunity.</strong><br>
        <strong style="color:#da3633">Lowest scorer is eliminated.</strong><br>
        <span style="color:#484f58">No tribal council tonight.</span>
      </div>
    </div>
    <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:24px">
      ${allPlayers.map(n => rpPortrait(n)).join('')}
    </div>
  </div>`;
  return html;
}

export function rpBuildSlasherRounds(ep) {
  const sn = ep.slasherNight;
  if (!sn || !sn.rounds?.length) return '';
  const stateKey = String(ep.num) + '_slasher';
  // Initialize reveal state — round 0 (first round) is already visible
  if (!_tvState[stateKey]) _tvState[stateKey] = { revealed: 0 };
  const totalRounds = sn.rounds.length;

  let html = `<div class="rp-page tod-deepnight">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div class="rp-title" style="color:#da3633">The Hunt</div>
    <div id="sl-rounds-${stateKey}" style="margin-top:16px">`;

  sn.rounds.forEach((round, ri) => {
    const isHidden = ri > 0 ? 'style="display:none"' : '';
    html += `<div class="sl-round-block" id="sl-round-${stateKey}-${ri}" ${isHidden}>
      <div style="font-size:11px;font-weight:800;letter-spacing:2px;color:#da3633;text-transform:uppercase;margin:20px 0 12px;border-top:1px solid #21262d;padding-top:16px">
        Round ${round.num} &mdash; ${round.remaining?.length || round.survivorCount || '?'} players remain
      </div>`;

    // Events as cards
    if (round.events?.length) {
      round.events.forEach(evt => {
        const pts = evt.points || 0;
        const ptColor = pts >= 0 ? '#3fb950' : '#f85149';
        const ptBg = pts >= 0 ? 'rgba(63,185,80,0.15)' : 'rgba(248,81,73,0.15)';
        const ptSign = pts >= 0 ? '+' : '';
        html += `<div class="vp-card" style="display:flex;align-items:center;gap:12px;padding:10px 14px;margin-bottom:8px">
          ${rpPortrait(evt.player, 'sm')}
          <div style="flex:1;font-size:12px;color:#cdd9e5;line-height:1.6">${evt.text}</div>
          <span style="font-size:13px;font-weight:700;padding:3px 10px;border-radius:12px;background:${ptBg};color:${ptColor};white-space:nowrap">${ptSign}${pts}</span>
        </div>`;
      });
    }

    // Caught players
    if (round.caught?.length) {
      round.caught.forEach(c => {
        html += `<div class="vp-card" style="display:flex;align-items:center;gap:12px;padding:10px 14px;margin-bottom:8px;border-color:rgba(218,54,51,0.4);background:rgba(218,54,51,0.06)">
          ${rpPortrait(c.name, 'sm')}
          <div style="flex:1">
            <div style="font-size:12px;color:#cdd9e5;line-height:1.6">${c.sceneText || c.name + ' was caught.'}</div>
          </div>
          <span class="rp-brant-badge red">CAUGHT</span>
        </div>`;
      });
    }

    // Atmosphere
    if (round.atmosphere) {
      html += `<div style="font-size:12px;color:#484f58;font-style:italic;text-align:center;margin:12px 0 8px;line-height:1.6">${round.atmosphere}</div>`;
    }

    // Running scores at bottom of each round
    // Reconstruct cumulatively: each player's score is their caught-round score (frozen)
    // or a running total of events + survival bonus up to this round
    const scoresUpToRound = {};
    const _allNames = sn.rounds[0]?.remaining || sn.leaderboard?.map(e => e.name) || [];
    _allNames.forEach(n => { scoresUpToRound[n] = 0; });
    const _caughtAt = {}; // { name: round } — when each player was caught
    for (let r = 0; r <= ri; r++) {
      const rd = sn.rounds[r];
      // Mark caught players this round
      const _caughtThisRound = new Set((rd.caught || []).map(c => c.name));
      // Survival bonus only for players who SURVIVE this round (not caught)
      (rd.remaining || []).forEach(n => {
        if (_caughtAt[n] != null) return; // caught in previous round
        if (_caughtThisRound.has(n)) return; // caught THIS round — no survival bonus
        scoresUpToRound[n] = (scoresUpToRound[n] || 0) + SLASHER_ROUND_SURVIVAL_BONUS;
      });
      // Event points for players alive this round (including those about to be caught — events happened)
      (rd.events || []).forEach(evt => {
        if (_caughtAt[evt.player] != null) return; // caught in previous round
        scoresUpToRound[evt.player] = (scoresUpToRound[evt.player] || 0) + (evt.points || 0);
      });
      _caughtThisRound.forEach(n => { if (_caughtAt[n] == null) _caughtAt[n] = r; });
    }
    const scoreSorted = Object.entries(scoresUpToRound).sort(([,a],[,b]) => b - a);
    if (scoreSorted.length) {
      html += `<div style="margin-top:14px;padding:10px;border-radius:8px;background:rgba(139,148,158,0.06);border:1px solid #21262d">
        <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#484f58;margin-bottom:8px">RUNNING SCORES</div>`;
      scoreSorted.forEach(([name, score]) => {
        const isCaught = sn.caughtOrder?.includes(name) && sn.rounds.slice(0, ri + 1).some(r => (r.caught || []).some(c => c.name === name));
        const color = isCaught ? '#484f58' : (score >= 0 ? '#3fb950' : '#f85149');
        html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;${isCaught ? 'opacity:0.5;' : ''}">
          <span style="font-size:11px;color:#8b949e;width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</span>
          <span style="font-size:12px;font-weight:700;color:${color}">${score >= 0 ? '+' : ''}${score}</span>
          ${isCaught ? '<span style="font-size:9px;color:#da3633;font-weight:700;letter-spacing:1px">CAUGHT</span>' : ''}
        </div>`;
      });
      html += `</div>`;
    }

    html += `</div>`; // end sl-round-block
  });

  html += `</div>`; // end sl-rounds container

  // Reveal controls
  html += `<div style="text-align:center;margin-top:20px">
    <button class="tv-reveal-btn" id="sl-btn-${stateKey}" onclick="slasherRevealNextRound('${stateKey}', ${totalRounds})"${totalRounds <= 1 ? ' style="display:none"' : ''}>Reveal Round (2/${totalRounds})</button>
    <div>
      <button onclick="slasherRevealAllRounds('${stateKey}', ${totalRounds})" style="background:none;border:none;font-size:11px;color:#484f58;cursor:pointer;padding:2px 0;letter-spacing:0.3px">Skip to all rounds &rsaquo;</button>
    </div>
  </div>`;

  html += `</div>`; // end rp-page
  return html;
}

export function slasherRevealNextRound(stateKey, totalRounds) {
  if (!_tvState[stateKey]) _tvState[stateKey] = { revealed: 0 };
  const state = _tvState[stateKey];
  const nextIdx = state.revealed + 1;
  if (nextIdx >= totalRounds) return;
  const el = document.getElementById('sl-round-' + stateKey + '-' + nextIdx);
  if (el) { el.style.display = 'block'; el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  state.revealed = nextIdx;
  const btn = document.getElementById('sl-btn-' + stateKey);
  if (nextIdx >= totalRounds - 1) {
    if (btn) btn.style.display = 'none';
  } else {
    if (btn) btn.textContent = 'Reveal Round (' + (nextIdx + 2) + '/' + totalRounds + ')';
  }
}

export function slasherRevealAllRounds(stateKey, totalRounds) {
  for (let i = 0; i < totalRounds; i++) {
    const el = document.getElementById('sl-round-' + stateKey + '-' + i);
    if (el) el.style.display = 'block';
  }
  if (!_tvState[stateKey]) _tvState[stateKey] = { revealed: 0 };
  _tvState[stateKey].revealed = totalRounds - 1;
  const btn = document.getElementById('sl-btn-' + stateKey);
  if (btn) btn.style.display = 'none';
}

export function rpBuildSlasherShowdown(ep) {
  const sn = ep.slasherNight;
  const sd = sn?.finalShowdown;
  if (!sd) return '';
  const winner = sd.winner;
  const loser = sd.loser;

  let html = `<div class="rp-page tod-deepnight">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div class="rp-title" style="color:#da3633">Final Showdown</div>
    <div style="display:flex;align-items:center;justify-content:center;gap:24px;margin:30px 0">
      <div style="text-align:center">
        ${rpPortrait(winner, 'xl')}
      </div>
      <div style="font-family:var(--font-display);font-size:36px;color:#da3633;text-shadow:0 0 12px rgba(218,54,51,0.4)">VS</div>
      <div style="text-align:center">
        ${rpPortrait(loser, 'xl')}
      </div>
    </div>`;

  // Winner method
  html += `<div class="vp-card" style="border-color:rgba(63,185,80,0.3);background:rgba(63,185,80,0.05);margin-bottom:12px">
    <div style="display:flex;align-items:center;gap:12px">
      ${rpPortrait(winner, 'sm')}
      <div style="flex:1">
        <div style="font-size:13px;color:#e6edf3;font-weight:700;margin-bottom:4px">${winner}</div>
        <div style="font-size:12px;color:#cdd9e5;line-height:1.6">${sd.winText || sd.winMethod || 'Outlasted the competition.'}</div>
      </div>
      <span class="rp-brant-badge green">IMMUNITY</span>
    </div>
  </div>`;

  // Loser method
  html += `<div class="vp-card" style="border-color:rgba(218,54,51,0.3);background:rgba(218,54,51,0.05);margin-bottom:12px">
    <div style="display:flex;align-items:center;gap:12px">
      ${rpPortrait(loser, 'sm')}
      <div style="flex:1">
        <div style="font-size:13px;color:#e6edf3;font-weight:700;margin-bottom:4px">${loser}</div>
        <div style="font-size:12px;color:#cdd9e5;line-height:1.6">${sd.loseText || sd.loseMethod || 'Was caught by the slasher.'}</div>
      </div>
      <span class="rp-brant-badge red">CAUGHT</span>
    </div>
  </div>`;

  // Shield push — bond damage
  if (sd.shieldPush) {
    html += `<div class="vp-card" style="border-color:rgba(218,54,51,0.5);background:rgba(218,54,51,0.08);margin-bottom:12px">
      <div style="font-size:12px;color:#f85149;line-height:1.6;text-align:center;font-weight:700">
        Shield Push &mdash; ${winner} shoved ${loser} toward the slasher to escape. Bond damaged.
      </div>
    </div>`;
  }

  // Heroic sacrifice
  if (sd.heroicSacrifice) {
    html += `<div class="vp-card" style="border-color:rgba(227,179,65,0.5);background:rgba(227,179,65,0.08);margin-bottom:12px">
      <div style="display:flex;align-items:center;justify-content:center;gap:12px">
        ${rpPortrait(loser, 'sm')}
        <div style="text-align:center">
          <span class="rp-brant-badge gold">LEGENDARY EXIT</span>
          <div style="font-size:12px;color:#e3b341;margin-top:6px;line-height:1.6">${loser} sacrificed themselves so ${winner} could escape. Bond boosted.</div>
        </div>
      </div>
    </div>`;
  }

  html += `</div>`;
  return html;
}

export function rpBuildSlasherImmunity(ep) {
  const sn = ep.slasherNight;
  if (!sn) return '';
  const winner = sn.immunityWinner;
  if (!winner) return '';

  // Gather best moments (positive events for the winner)
  const bestMoments = [];
  (sn.rounds || []).forEach(round => {
    (round.events || []).forEach(evt => {
      if (evt.player === winner && (evt.points || 0) > 0) {
        bestMoments.push(evt);
      }
    });
  });
  bestMoments.sort((a, b) => (b.points || 0) - (a.points || 0));
  const topMoments = bestMoments.slice(0, 3);

  const sd = sn.finalShowdown;
  const winDesc = sd?.winText || sd?.winMethod || 'Outlasted everyone in the darkness.';

  let html = `<div class="rp-page tod-dawn">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div class="rp-title">Immunity Winner</div>
    <div style="text-align:center;margin:24px 0">
      ${rpPortrait(winner, 'xl', '<span class="rp-brant-badge gold" style="font-size:10px">IMMUNITY</span>')}
    </div>
    <div style="text-align:center;font-size:16px;color:#e6edf3;font-weight:700;margin-bottom:8px">${winner}</div>
    <div style="text-align:center;font-size:11px;color:#8b949e;margin-bottom:20px">${vpArchLabel(winner)}</div>
    <div class="vp-card" style="text-align:center;max-width:420px;margin:0 auto 20px">
      <div style="font-size:13px;color:#cdd9e5;line-height:1.7">${winDesc}</div>
    </div>`;

  if (topMoments.length) {
    html += `<div style="max-width:420px;margin:0 auto">
      <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#484f58;margin-bottom:10px;text-align:center">BEST MOMENTS</div>`;
    topMoments.forEach(m => {
      html += `<div class="vp-card" style="display:flex;align-items:center;gap:10px;padding:8px 12px;margin-bottom:6px">
        <div style="flex:1;font-size:12px;color:#cdd9e5;line-height:1.5">${m.text}</div>
        <span style="font-size:12px;font-weight:700;padding:2px 8px;border-radius:10px;background:rgba(63,185,80,0.15);color:#3fb950">+${m.points}</span>
      </div>`;
    });
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

export function rpBuildSlasherElimination(ep) {
  const sn = ep.slasherNight;
  if (!sn) return '';
  const elim = sn.eliminated;
  if (!elim) return '';

  const quote = vpGenerateQuote(elim, ep, 'eliminated');
  const finalScore = sn.scores?.[elim] ?? 0;

  // Find negative events for this player
  const negEvents = [];
  (sn.rounds || []).forEach(round => {
    (round.events || []).forEach(evt => {
      if (evt.player === elim && (evt.points || 0) < 0) {
        negEvents.push(evt);
      }
    });
  });

  // Find next-lowest score
  const lb = sn.leaderboard || [];
  const elimIdx = lb.findIndex(e => e.name === elim);
  const nextLowest = elimIdx > 0 ? lb[elimIdx - 1] : null;

  // When was this player caught?
  let caughtRound = null;
  (sn.rounds || []).forEach(round => {
    if ((round.caught || []).some(c => c.name === elim)) caughtRound = round.num;
  });

  // Placement
  const placement = ep.gsSnapshot?.activePlayers
    ? (ep.gsSnapshot.activePlayers.length + (gs.jury?.includes(elim) ? 0 : 1))
    : '?';

  let html = `<div class="rp-page tod-deepnight" style="--page-accent:#da3633">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div class="rp-title" style="color:#da3633">Eliminated</div>
    <div class="rp-elim" style="margin:20px 0">
      <div class="rp-elim-eyebrow">Slasher Night &mdash; ${ordinal(placement)} place</div>
      ${rpPortrait(elim, 'xl elim')}
      <div class="rp-elim-name">${elim}</div>
      <div class="rp-elim-arch">${vpArchLabel(elim)}</div>
      <div class="rp-elim-quote">"${quote}"</div>
      <div class="rp-elim-place">Eliminated &mdash; Episode ${ep.num}</div>
    </div>`;

  // WHY THEY DIDN'T SURVIVE section
  html += `<div style="margin-top:28px;border-top:1px solid #21262d;padding-top:20px">
    <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#484f58;margin-bottom:14px">=== WHY THEY DIDN'T SURVIVE ===</div>`;

  const whyBullets = [];
  if (negEvents.length) {
    negEvents.forEach(evt => {
      whyBullets.push(evt.text + ' <span style="color:#f85149;font-weight:700">(' + evt.points + ')</span>');
    });
  } else {
    whyBullets.push('Failed to score enough points to stay ahead.');
  }
  if (caughtRound) {
    whyBullets.push('Caught by the slasher in round ' + caughtRound + '.');
  }
  if (nextLowest) {
    const _nlScore = sn.scores?.[nextLowest.name] ?? nextLowest.score ?? 0;
    const diff = _nlScore - finalScore;
    whyBullets.push('Final score: <span style="color:#f85149;font-weight:700">' + finalScore + '</span> vs next-lowest ' + nextLowest.name + ' at <span style="color:#8b949e">' + _nlScore + '</span>' + (diff > 0 ? ' (' + diff + ' points short)' : '') + '.');
  } else {
    whyBullets.push('Final score: <span style="color:#f85149;font-weight:700">' + finalScore + '</span> &mdash; dead last.');
  }

  html += `<div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:14px">
    ${rpPortrait(elim, 'elim')}
    <div style="flex:1">
      ${whyBullets.map(b => '<div style="font-size:12px;color:#cdd9e5;line-height:1.7;margin-bottom:5px;display:flex;gap:8px;align-items:flex-start"><span style="color:#484f58;flex-shrink:0;margin-top:1px">&#x2014;</span><span>' + b + '</span></div>').join('')}
    </div>
  </div>`;

  html += `</div>`; // end why section

  // Torch snuff
  html += `<div id="torch-snuff-sl-${ep.num}" style="text-align:center;margin-top:24px">
    <div class="torch-snuffed">${rpPortrait(elim, 'xl')}</div>
    <div style="font-family:var(--font-display);font-size:24px;color:var(--accent-fire);margin-top:16px;text-shadow:0 0 12px var(--accent-fire)">The night has spoken.</div>
  </div>`;

  html += `</div>`; // end rp-page

  // Fire torch snuff on screen enter
  setTimeout(() => {
    const snuffEl = document.querySelector('#torch-snuff-sl-' + ep.num + ' .torch-snuffed');
    if (snuffEl && typeof torchSnuffFx === 'function') torchSnuffFx(snuffEl);
  }, 600);

  return html;
}

export function rpBuildSlasherLeaderboard(ep) {
  const sn = ep.slasherNight;
  if (!sn) return '';
  const lb = sn.leaderboard || [];
  if (!lb.length) return '';

  // Use sn.scores as source of truth for display (leaderboard entry.score may be stale)
  const _slScores = sn.scores || {};
  const maxScore = Math.max(...lb.map(e => Math.abs(_slScores[e.name] ?? e.score ?? 0)), 1);
  const containerId = 'sl-leaderboard-' + ep.num;

  let html = `<div class="rp-page tod-deepnight">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div class="rp-title" style="color:#da3633">Slasher Night Leaderboard</div>
    <div id="${containerId}" style="margin-top:20px;max-width:520px;margin-left:auto;margin-right:auto">`;

  lb.forEach((entry, idx) => {
    const score = (sn.scores && sn.scores[entry.name] != null) ? sn.scores[entry.name] : (entry.score || 0);
    const isElim = entry.name === sn.eliminated;
    const isWinner = entry.name === sn.immunityWinner;
    const barPct = Math.max(5, Math.round((Math.abs(score) / maxScore) * 100));
    const barColor = score >= 0 ? '#3fb950' : '#f85149';
    const barBg = score >= 0 ? 'rgba(63,185,80,0.15)' : 'rgba(248,81,73,0.15)';

    // Status label
    let statusLabel = '';
    if (isWinner) {
      statusLabel = '<span class="rp-brant-badge gold" style="font-size:9px;padding:2px 6px">Last Standing</span>';
    } else if (isElim) {
      statusLabel = '<span class="rp-brant-badge red" style="font-size:9px;padding:2px 6px">ELIMINATED</span>';
    } else {
      // Find caught round
      let cr = null;
      (sn.rounds || []).forEach(r => { if ((r.caught || []).some(c => c.name === entry.name)) cr = r.num; });
      if (cr) statusLabel = '<span style="font-size:10px;color:#da3633">Caught R' + cr + '</span>';
    }

    const rowBg = isElim ? 'rgba(218,54,51,0.08)' : (isWinner ? 'rgba(227,179,65,0.06)' : 'rgba(139,148,158,0.04)');
    const rowBorder = isElim ? 'rgba(218,54,51,0.3)' : (isWinner ? 'rgba(227,179,65,0.2)' : '#21262d');
    const scoreSign = score >= 0 ? '+' : '-';

    html += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;padding:8px 12px;border-radius:8px;background:${rowBg};border:1px solid ${rowBorder}">
      <span style="font-size:12px;color:#484f58;font-weight:700;width:22px;text-align:right">${idx + 1}.</span>
      ${rpPortrait(entry.name, 'sm')}
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <span style="font-size:13px;color:#e6edf3;font-weight:700">${entry.name}</span>
          ${statusLabel}
        </div>
        <div style="position:relative;height:14px;background:${barBg};border-radius:7px;overflow:hidden">
          <div class="sl-score-bar" style="position:absolute;left:0;top:0;height:100%;width:0;background:${barColor};border-radius:7px;transition:width 0.8s ease ${idx * 0.15}s" data-target-width="${barPct}%"></div>
        </div>
      </div>
      <span style="font-size:14px;font-weight:800;color:${barColor};min-width:36px;text-align:right">${score >= 0 ? '+' : ''}${score}</span>
    </div>`;
  });

  html += `</div>
  </div>`;

  // Animation triggered by renderVPScreen when this screen becomes active

  return html;
}

