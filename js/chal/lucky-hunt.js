// js/chal/lucky-hunt.js
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';

function _lhSuccessChance(playerName, location, huntState) {
  const s = pStats(playerName);
  let chance = { easy: 0.40, medium: 0.20, hard: 0.10, nightmare: 0.05 }[location.tier];
  Object.entries(location.statWeights).forEach(([stat, weight]) => { chance += (s[stat] || 0) * weight; });
  const ps = huntState[playerName];
  if (ps.helpedBy) chance += 0.15;
  if (ps.sabotagedBy) chance -= 0.15;
  if (ps._ambushPenalty) chance -= ps._ambushPenalty;
  if (ps._intelBoost) chance += ps._intelBoost;
  if (ps._intelPenalty) chance -= ps._intelPenalty;
  if (ps._allianceBoost) chance += ps._allianceBoost;
  if (ps.frozen) return 0;
  if (ps.attemptsMade > 0) chance += 0.05 * ps.attemptsMade;
  if (ps.emotionalState === 'devastated') chance -= 0.15;
  if (ps.emotionalState === 'furious') chance += 0.05;
  return Math.max(0.05, Math.min(0.95, chance));
}

function _lhHelpAlly(helper, target, huntState, ep, _rp) {
  const hS = pStats(helper);
  const hs = huntState[helper], ts = huntState[target];
  if (!hs || !ts) return null;
  if (!hs.keyFound) return null;
  if (ts.keyFound) return null;
  if (getBond(helper, target) < 3) return null;
  if (hS.loyalty < 5) return null;
  ts.helpedBy = helper;
  addBond(helper, target, 0.5);
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[helper] = (gs.popularity[helper] || 0) + 1;
  const pr = pronouns(helper);
  const tPr = pronouns(target);
  return {
    type: 'luckyHuntHelped',
    players: [helper, target],
    text: _rp([
      `${helper} already has ${pr.posAdj} key. ${pr.Sub} find${pr.sub==='they'?'':'s'} ${target} empty-handed and pulls ${tPr.obj} aside — shares the approach that worked. Bond. Genuine.`,
      `${helper} spots ${target} struggling. Gives ${tPr.obj} the shortcut. Why? Because ${pr.sub} can. Because ${pr.sub} already won this round.`,
      `${target} is going in circles. ${helper} jogs over. "Here. This way." No hesitation. That's the move of someone playing a long game.`,
    ]),
    badgeText: 'HELPED', badgeClass: 'green',
    consequences: { bondChange: [[helper, target, 0.5]] },
  };
}

function _lhSabotageRival(saboteur, target, huntState, ep, _rp) {
  const sS = pStats(saboteur);
  const tS = pStats(target);
  const ss = huntState[saboteur], ts = huntState[target];
  if (!ss || !ts) return null;
  if (ts.keyFound) return null;
  const bond = getBond(saboteur, target);
  // Only villainous/strategic types sabotage — nice archetypes won't unless truly desperate
  const arch = players.find(p => p.name === saboteur)?.archetype || '';
  const niceArchs = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
  const isNice = niceArchs.has(arch);
  const eligible = isNice
    ? (bond <= -4 && sS.strategic >= 7) // nice players only sabotage bitter rivals AND must be very strategic
    : (bond <= -2 || (sS.strategic >= 6 && sS.loyalty <= 5)); // others need rivalry OR strategic+low loyalty
  if (!eligible) return null;
  ts.sabotagedBy = saboteur;
  // Detection check
  const detected = Math.random() < (tS.intuition * 0.06 - sS.strategic * 0.05 + 0.3);
  const pr = pronouns(saboteur);
  const tPr = pronouns(target);
  if (detected) {
    addBond(saboteur, target, -1.0);
    if (!gs._luckyHuntHeat) gs._luckyHuntHeat = {};
    gs._luckyHuntHeat[saboteur] = { amount: 1.5, expiresEp: (gs.episode || 0) + 2 };
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[saboteur] = (gs.popularity[saboteur] || 0) - 2;
    gs.popularity[target] = (gs.popularity[target] || 0) + 1;
    return {
      type: 'luckyHuntSaboteur',
      players: [saboteur, target],
      text: _rp([
        `${saboteur} moved ${target}'s clue marker. ${target} doubled back — and caught ${pr.obj} resetting it. The look on both their faces says everything.`,
        `${saboteur} had a quiet word with the wrong person about where ${target} was searching. ${target} figured it out. "That was you, wasn't it?" Silence.`,
        `${saboteur} tried the subtle play — redirect, not destroy. ${target} is perceptive enough to notice. This is going to cost ${pr.obj}.`,
      ]),
      badgeText: 'SABOTEUR CAUGHT', badgeClass: 'red',
      consequences: { bondChange: [[saboteur, target, -1.0]] },
    };
  } else {
    return {
      type: 'luckyHuntSabotage',
      players: [saboteur, target],
      text: _rp([
        `${saboteur} sends ${target} the wrong direction with a casual mention of where to look. ${target} follows it. Doesn't know it was deliberate.`,
        `${saboteur} swaps ${target}'s approach marker when ${tPr.sub}'${tPr.sub==='they'?'re':'s'} not looking. Untraceable. Probably.`,
        `${saboteur} has done nothing wrong. Technically. ${target} is just having a very bad time at this location.`,
      ]),
      badgeText: 'SABOTAGE', badgeClass: '',
    };
  }
}

function _lhStealKey(stealer, victim, huntState, ep, _rp) {
  const stS = pStats(stealer);
  const vS = pStats(victim);
  const ss = huntState[stealer], vs = huntState[victim];
  if (!ss || !vs) return null;
  if (!vs.keyFound || vs.stolen) return null; // can't steal from someone already stolen from
  // Eligibility: bold/strategic types, boosted if stealer has NO key yet
  const hasNoKey = !ss.keyFound;
  const statThreshold = hasNoKey ? 5 : 7; // desperate keyless players try harder
  if (!(stS.boldness >= statThreshold || stS.strategic >= statThreshold)) return null;
  // Nice archetypes don't steal (unless keyless AND low loyalty)
  const stealArch = players.find(p => p.name === stealer)?.archetype || '';
  const niceArchs = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
  if (niceArchs.has(stealArch) && (stS.loyalty >= 4 || !hasNoKey)) return null;
  // Success chance — boosted if desperate (no key)
  let successChance = stS.physical * 0.06 + stS.boldness * 0.04 + stS.strategic * 0.03 - vS.physical * 0.04;
  if (hasNoKey) successChance += 0.10; // desperation bonus
  const success = Math.random() < Math.max(0.1, Math.min(0.8, successChance));
  const pr = pronouns(stealer);
  const vPr = pronouns(victim);
  // Get active players for witness effects
  const witnesses = Object.keys(huntState).filter(p => p !== stealer && p !== victim);
  if (success) {
    // Stealer gets victim's key. If stealer already had a key, they now have 2 (try both at chests).
    if (ss.keyFound) { ss._extraKey = true; } // already had one — bonus chest chance
    ss.keyFound = true;
    ss.stolenFrom = victim;
    // Victim LOSES their key permanently — location is depleted, can't re-find
    vs.keyFound = false;
    vs.stolen = true;
    vs._locationDepleted = true; // prevents re-finding at same location
    vs.emotionalState = 'devastated';
    // DRAMATIC consequences
    addBond(stealer, victim, -3.0); // deep personal violation
    // Every witness loses respect for the thief
    witnesses.forEach(w => {
      addBond(w, stealer, -0.5);
      addBond(w, victim, 0.2); // sympathy
    });
    // Popularity hit
    if (gs.popularity) {
      gs.popularity[stealer] = (gs.popularity[stealer] || 0) - 2;
      gs.popularity[victim] = (gs.popularity[victim] || 0) + 1;
    }
    // Heat
    if (!gs._luckyHuntHeat) gs._luckyHuntHeat = {};
    gs._luckyHuntHeat[stealer] = { amount: 2.5, expiresEp: (gs.episode || 0) + 3 };
    return {
      type: 'luckyHuntStolen',
      players: [stealer, victim],
      text: _rp([
        `${stealer} waited until ${victim} was alone. Then ${pr.sub} made ${pr.posAdj} move. The key changes hands. ${victim} can't believe it. The camp saw everything. Nobody says a word.`,
        `${stealer} physically blocked ${victim}'s path, grabbed ${vPr.posAdj} key in the confusion, and walked away. ${victim} stands there, empty-handed, shaking. The game just got personal.`,
        `${victim} had the key in hand. Then ${stealer} happened. It was quick. It was ruthless. ${victim}'s shot at immunity — gone. Everyone watching knows exactly what kind of player ${stealer} is now.`,
        `${stealer} rips the key from ${victim}'s grip. No subtlety. No apology. ${victim} is left standing at ${vPr.posAdj} location with nothing. The entire island heard ${victim}'s reaction.`,
      ]),
      badgeText: 'KEY STOLEN', badgeClass: 'red',
    };
  } else {
    addBond(stealer, victim, -2.0);
    witnesses.forEach(w => addBond(w, stealer, -0.3));
    if (!gs._luckyHuntHeat) gs._luckyHuntHeat = {};
    gs._luckyHuntHeat[stealer] = { amount: 1.5, expiresEp: (gs.episode || 0) + 2 };
    return {
      type: 'luckyHuntStealFail',
      players: [stealer, victim],
      text: _rp([
        `${stealer} tried to grab ${victim}'s key. ${victim} held on. ${stealer} is walking away empty-handed and everyone saw the attempt.`,
        `The steal attempt fails. ${victim} twists free, holds ${vPr.posAdj} key tight, and stares ${stealer} down. "Don't." The camp is watching.`,
        `${stealer} lunges for the key. ${victim} is faster. Now ${stealer} has nothing, a new enemy, and an audience that won't forget this.`,
      ]),
      badgeText: 'STEAL FAILED', badgeClass: 'red',
    };
  }
}

function _lhPanicFreeze(playerName, location, huntState, ep, _rp) {
  const s = pStats(playerName);
  const ps = huntState[playerName];
  if (!ps) return null;
  if (s.boldness > 3) return null;
  if (!['hard','nightmare'].includes(location.tier)) return null;
  if (ps.frozen) return null;
  ps.frozen = true;
  ps.emotionalState = 'devastated';
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[playerName] = (gs.popularity[playerName] || 0) - 1;
  const pr = pronouns(playerName);
  return {
    type: 'luckyHuntPanic',
    players: [playerName],
    text: _rp([
      `${playerName} gets to ${pr.posAdj} location and stops. The location is worse than ${pr.sub} imagined. ${pr.Sub} can't make ${pr.posAdj} body go further. ${pr.Sub} just stands there.`,
      `${playerName} arrives and freezes. Not a performance — a real freeze. ${pr.Sub} know${pr.sub==='they'?'':'s'} ${pr.sub} can't do this. ${pr.Sub} don't know how to start.`,
      `${playerName} looks at the location and at ${pr.posAdj} own hands. The body says no. The game says try. The body wins this one.`,
    ]),
    badgeText: 'FROZE UP', badgeClass: 'red',
  };
}

function _lhShowoff(playerName, location, huntState, ep, _rp) {
  const s = pStats(playerName);
  const ps = huntState[playerName];
  if (!ps) return null;
  if (s.boldness < 8) return null;
  if (!['easy','medium'].includes(location.tier)) return null;
  if (!ps.keyFound) return null;
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[playerName] = (gs.popularity[playerName] || 0) + 1;
  const pr = pronouns(playerName);
  return {
    type: 'luckyHuntShowoff',
    players: [playerName],
    text: _rp([
      `${playerName} got ${pr.posAdj} key and is now making sure everyone knows how ${pr.sub} got it. Unnecessarily detailed. Very entertaining.`,
      `${playerName} could have walked back to camp quietly. ${pr.Sub} chose to walk back loudly. Key held high. Commentary provided.`,
      `${playerName}: "You just have to commit." ${playerName} is now explaining to anyone who'll listen exactly how ${pr.sub} committed.`,
    ]),
    badgeText: 'SHOWBOATING', badgeClass: 'gold',
  };
}

function _lhUnlikelyTeamup(a, b, huntState, ep, _rp) {
  const as = huntState[a], bs = huntState[b];
  if (!as || !bs) return null;
  if (as.keyFound || bs.keyFound) return null;
  if (getBond(a, b) > -1) return null;
  as.helpedBy = b;
  bs.helpedBy = a;
  addBond(a, b, 0.5);
  const aP = pronouns(a);
  return {
    type: 'luckyHuntTeamup',
    players: [a, b],
    text: _rp([
      `${a} and ${b} have not been friends this season. But they're both lost, and neither of them is going to find the key alone. They nod at each other. "Fine."`,
      `${a} finds ${b} searching the same wrong area. "I'll try left, you try right." Two people who don't like each other, doing the logical thing.`,
      `Rivals for a moment, partners for the next ten minutes. ${a} and ${b} split the search without a word about what it means.`,
    ]),
    badgeText: 'UNLIKELY ALLIES', badgeClass: '',
    consequences: { bondChange: [[a, b, 0.5]] },
  };
}

function _lhAmbush(ambusher, target, huntState, ep, _rp) {
  const aS = pStats(ambusher);
  const as = huntState[ambusher], ts = huntState[target];
  if (!as || !ts) return null;
  if (aS.physical < 7) return null;
  if (ts.keyFound) return null;
  if (getBond(ambusher, target) >= 0) return null;
  // Nice archetypes don't physically bully people
  const ambushArch = players.find(p => p.name === ambusher)?.archetype || '';
  const niceArchs = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
  if (niceArchs.has(ambushArch)) return null;
  ts._ambushPenalty = (ts._ambushPenalty || 0) + 0.10;
  addBond(ambusher, target, -0.5);
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[ambusher] = (gs.popularity[ambusher] || 0) + (aS.boldness >= 8 ? 1 : -1);
  const pr = pronouns(ambusher);
  const tPr = pronouns(target);
  return {
    type: 'luckyHuntAmbush',
    players: [ambusher, target],
    text: _rp([
      `${ambusher} kicks a rock into ${target}'s search area. ${target} jumps back. The key ${tPr.sub} was about to grab slips deeper. ${ambusher} keeps walking. "Oops."`,
      `${target} is reaching for the key when ${ambusher} slams a branch into the tree above ${tPr.obj}. Birds scatter. ${target} flinches and loses ${tPr.posAdj} grip. By the time ${tPr.sub} recover${tPr.sub==='they'?'':'s'}, ${ambusher} is gone.`,
      `${ambusher} walks right through ${target}'s location, kicking dirt, making noise, scaring off every animal in a fifty-foot radius. ${target} has to start the approach over. ${ambusher} doesn't look back.`,
      `${ambusher} shoulders past ${target} at the search spot. Hard. Deliberate. ${target} stumbles. The key is still there — but ${tPr.posAdj} hands are shaking now.`,
      `"You look stuck." ${ambusher} leans against the tree ${target} needs to climb. ${pr.Sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} move for a full minute. By the time ${pr.sub} leave${pr.sub==='they'?'':'s'}, ${target} has lost ${tPr.posAdj} window.`,
    ]),
    badgeText: 'AMBUSHED', badgeClass: 'red',
    consequences: { bondChange: [[ambusher, target, -0.5]] },
  };
}

function _lhRivalryEncounter(a, b, huntState, ep, _rp) {
  const as = huntState[a], bs = huntState[b];
  if (!as || !bs) return null;
  if (getBond(a, b) > -2) return null;
  addBond(a, b, -0.1);
  addBond(b, a, -0.1);
  const aP = pronouns(a);
  const bP = pronouns(b);
  return {
    type: 'luckyHuntRivalry',
    players: [a, b],
    text: _rp([
      `${a} and ${b} end up on the same trail. Neither speaks. Neither moves aside. They walk parallel for thirty seconds before splitting off.`,
      `${a} rounds a corner and finds ${b} there. A look. Not a word. The air gets heavier. Then they both keep moving.`,
      `${b} is searching when ${a} appears. They lock eyes. "${a}." "${b}." That's it. That's the whole conversation.`,
      `The tension between ${a} and ${b} is thick enough to touch. They pass each other on the trail. Close enough to reach. Neither does.`,
    ]),
    badgeText: 'TENSION', badgeClass: '',
    consequences: { bondChange: [[a, b, -0.1], [b, a, -0.1]] },
  };
}

function _lhTradeIntel(a, b, huntState, ep, _rp) {
  const aS = pStats(a), bS = pStats(b);
  const as = huntState[a], bs = huntState[b];
  if (!as || !bs) return null;
  if (as.keyFound && bs.keyFound) return null;
  if (getBond(a, b) < 0) return null;
  // Does one player lie? Higher threshold — lying is a real move
  const aLies = aS.strategic >= 7 && getBond(a, b) < 2 && aS.loyalty <= 4 && Math.random() < 0.30;
  const bLies = bS.strategic >= 7 && getBond(b, a) < 2 && bS.loyalty <= 4 && Math.random() < 0.30;
  // Meaningful effects: honest = +0.12, lie = -0.10 to victim
  if (aLies) { if (!bs.keyFound) { bs.sabotagedBy = a; bs._intelPenalty = (bs._intelPenalty || 0) + 0.10; } }
  else if (!as.keyFound) { as.helpedBy = b; as._intelBoost = (as._intelBoost || 0) + 0.12; }
  if (bLies) { if (!as.keyFound) { as.sabotagedBy = b; as._intelPenalty = (as._intelPenalty || 0) + 0.10; } }
  else if (!bs.keyFound) { bs.helpedBy = a; bs._intelBoost = (bs._intelBoost || 0) + 0.12; }
  addBond(a, b, aLies || bLies ? -0.2 : 0.15);
  const aP = pronouns(a);
  const bP = pronouns(b);
  const anyLied = aLies || bLies;
  return {
    type: 'luckyHuntIntelTrade',
    players: [a, b],
    text: anyLied ? _rp([
      `${a} and ${b} exchange notes. What ${aLies ? a : b} shares sounds right — landmarks, distances, timing. It's all wrong. Deliberately.`,
      `"I'll show you mine if you show me yours." One of them is lying. The other one will find out the hard way — at the location.`,
      `${aLies ? a : b} describes a shortcut that doesn't exist. ${aLies ? b : a} thanks ${aLies ? aP.obj : bP.obj} and heads the wrong direction.`,
      `They compare notes. Politely. Thoroughly. One of those notes will cost someone twenty minutes they don't have.`,
    ]) : _rp([
      `${a} and ${b} cross paths near the trail. Quick exchange — what's where, what to avoid, where the danger is. Both recalibrate.`,
      `"The key's deeper than you think." ${a} gives ${b} real advice. ${b} returns the favor. This is what trust looks like.`,
      `${a} and ${b} pool what they know. Two perspectives, one clearer picture. Both move with more confidence after.`,
      `${b} warns ${a} about a dead end. ${a} shares the shortcut. Fair trade. Real advantage.`,
      `${a} and ${b} meet by the creek. Thirty seconds of honest debrief. Both leave sharper.`,
    ]),
    badgeText: anyLied ? 'BAD INTEL' : 'INTEL TRADE', badgeClass: anyLied ? 'red' : '',
  };
}

function _lhAllianceMoment(a, b, huntState, ep, _rp) {
  const as = huntState[a], bs = huntState[b];
  if (!as || !bs) return null;
  // At least one must still be hunting
  if (as.keyFound && bs.keyFound) return null;
  // Must be in the same active named alliance
  const sharedAlliance = (gs.namedAlliances || []).find(al =>
    al.members && al.members.includes(a) && al.members.includes(b) && !al.dissolved
  );
  if (!sharedAlliance) return null;
  const aP = pronouns(a), bP = pronouns(b);
  const alName = sharedAlliance.name || 'their alliance';
  // Scout = the one who already found their key (or higher loyalty)
  const scout = as.keyFound ? a : bs.keyFound ? b : (pStats(a).loyalty >= pStats(b).loyalty ? a : b);
  const hunter = scout === a ? b : a;
  const scoutPr = pronouns(scout), huntPr = pronouns(hunter);
  // Scout's attempt gets delayed (penalty)
  if (!huntState[scout].keyFound) {
    huntState[scout]._allianceDelay = true; // flag for timing penalty
  }
  // Hunter gets real boost
  if (!huntState[hunter].keyFound) {
    huntState[hunter].helpedBy = scout;
    huntState[hunter]._allianceBoost = 0.12;
  }
  addBond(a, b, 0.3);
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[a] = (gs.popularity[a] || 0) + 1;
  gs.popularity[b] = (gs.popularity[b] || 0) + 1;
  return {
    type: 'luckyHuntAlliance',
    players: [scout, hunter],
    text: _rp([
      `${scout} drops what ${scoutPr.sub}'${scoutPr.sub==='they'?'re':'s'} doing and goes to find ${hunter}. "${alName} sticks together." ${scoutPr.Sub} scouts ahead while ${hunter} focuses on the key.`,
      `"I'll check the perimeter. You focus on the key." ${scout} takes point for ${hunter}. This is ${alName} working as a unit. It costs ${scout} time. ${scoutPr.Sub} doesn't care.`,
      `${scout} and ${hunter} huddle. ${scout} draws a map in the dirt from what ${scoutPr.sub}'${scoutPr.sub==='they'?'ve':'s'} seen. ${hunter} nods. "Go." ${alName} moves as one.`,
      `${scout} circles ${hunter}'s location twice, checking approaches, identifying hazards. ${hunter} goes in prepared. Alliance advantage.`,
      `"I got your back." ${scout} posts up near ${hunter}'s location. Not helping directly — just watching. Making sure nobody interferes. ${alName} protects its own.`,
    ]),
    badgeText: alName.toUpperCase(), badgeClass: 'blue',
    personalScores: {},
  };
}

function _lhDiscovery(playerName, location, huntState, ep, _rp) {
  const s = pStats(playerName);
  const ps = huntState[playerName];
  if (!ps) return null;
  if (s.intuition < 6) return null;
  if (!['hard','nightmare'].includes(location.tier)) return null;
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[playerName] = (gs.popularity[playerName] || 0) + 1;
  const pr = pronouns(playerName);
  return {
    type: 'luckyHuntDiscovery',
    players: [playerName],
    text: _rp([
      `${playerName} notices something at ${pr.posAdj} location that nobody else would. Not the key — but something. A pattern in how this challenge was built.`,
      `${playerName} reads the environment better than the clue. What ${pr.sub} find${pr.sub==='they'?'':'s'} isn't the key — but it might help later.`,
      `${playerName} takes stock of the location with unusual care. There's something here beyond what the clue said. ${pr.Sub} file${pr.sub==='they'?'':'s'} it away.`,
      `${playerName} notices something wedged behind a rock at ${pr.posAdj} location — a folded note. Someone's handwriting. Not part of the challenge. ${pr.Sub} pocket${pr.sub==='they'?'':'s'} it.`,
      `While searching, ${playerName} finds a marking on the ground — a hidden trail that doesn't match the challenge map. Someone's been here before.`,
      `${playerName} overhears two players whispering on the other side of the ridge. ${pr.Sub} can't make out every word, but "vote" and a name come through clearly.`,
      `${playerName} finds a torn symbol scratched into a tree. Someone made a deal here. The question is who.`,
      `The key location reveals more than a key. ${playerName} finds footprints — someone was here earlier. Searching for something else.`,
      `${playerName} doesn't just find what ${pr.sub} was looking for. ${pr.Sub} find${pr.sub==='they'?'':'s'} what someone ELSE was looking for. That's leverage.`,
      `Something catches ${playerName}'s eye at the edge of the search area. Not a key. Something older. Information has value here.`,
    ]),
    badgeText: 'FOUND SOMETHING', badgeClass: 'blue',
  };
}

export function simulateLuckyHunt(ep) {
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
  const host = seasonConfig.host || 'Chris';
  const activePlayers = [...gs.activePlayers];
  const timeline = [];
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };

  // ── 1. SETUP: assign locations and init hunt state ──
  const TIER_WEIGHTS = [
    { tier: 'easy', weight: 30 },
    { tier: 'medium', weight: 30 },
    { tier: 'hard', weight: 25 },
    { tier: 'nightmare', weight: 15 },
  ];
  const totalWeight = TIER_WEIGHTS.reduce((s, t) => s + t.weight, 0);

  const usedLocIds = new Set();
  const playerLocations = {};
  activePlayers.forEach(name => {
    // Pick tier
    let roll = Math.random() * totalWeight, chosen = 'easy';
    let cumulative = 0;
    for (const t of TIER_WEIGHTS) { cumulative += t.weight; if (roll < cumulative) { chosen = t.tier; break; } }
    // Pick unique location from tier
    const pool = LUCKY_HUNT_LOCATIONS[chosen].filter(l => !usedLocIds.has(l.id));
    if (!pool.length) {
      // Fall back to any unused
      const anyPool = Object.values(LUCKY_HUNT_LOCATIONS).flat().filter(l => !usedLocIds.has(l.id));
      if (anyPool.length) { const loc = anyPool[Math.floor(Math.random() * anyPool.length)]; usedLocIds.add(loc.id); playerLocations[name] = loc; }
      else { playerLocations[name] = LUCKY_HUNT_LOCATIONS.easy[0]; } // last resort
    } else {
      const loc = pool[Math.floor(Math.random() * pool.length)];
      usedLocIds.add(loc.id);
      playerLocations[name] = loc;
    }
  });

  const maxAttempts = { easy: 1, medium: 2, hard: 2, nightmare: 3 };
  const huntState = {};
  activePlayers.forEach(name => {
    huntState[name] = {
      keyFound: false,
      attemptsMade: 0,
      helpedBy: null,
      sabotagedBy: null,
      frozen: false,
      emotionalState: 'neutral',
      dudKey: false,
      stolen: false,
      stolenFrom: null,
    };
  });

  const personalScores = {};
  activePlayers.forEach(n => { personalScores[n] = 0; });

  // ── 2. ROUND 1: CLUE DRAW ──
  timeline.push({ type: 'lhPhase', text: 'CLUE DRAW', phase: 'draw' });
  activePlayers.forEach(name => {
    const loc = playerLocations[name];
    const pr = pronouns(name);
    const s = pStats(name);
    const drawPool = loc.draw;
    const drawText = drawPool[Math.floor(Math.random() * drawPool.length)](name, pr, host);
    timeline.push({ type: 'lhClue', players: [name], location: loc.id, locationName: loc.name, tier: loc.tier, text: drawText, badgeText: loc.tier.toUpperCase(), badgeClass: loc.tier === 'nightmare' ? 'red' : loc.tier === 'hard' ? 'red' : loc.tier === 'medium' ? 'gold' : 'green' });
    // 40% host commentary
    if (Math.random() < 0.40) {
      const hostLine = _rp([
        `${host} watches ${name} read the clue. "That one's going to be interesting."`,
        `${host}: "Oh — ${name} got the ${loc.name}. This should be good."`,
        `${host} makes a note on ${pr.posAdj} clipboard as ${name} processes the clue. Says nothing. Smiles.`,
        `"${name}." ${host} doesn't elaborate. Just says the name and watches.`,
      ]);
      timeline.push({ type: 'lhHostCommentary', players: [name], text: hostLine, badgeText: 'HOST', badgeClass: '' });
    }
  });

  // ── 3. ROUNDS 2-3: THE HUNT ──
  timeline.push({ type: 'lhPhase', text: 'THE HUNT', phase: 'hunt' });

  // Build action pool with timing weights
  const actionPool = [];
  activePlayers.forEach(name => {
    const loc = playerLocations[name];
    const maxA = maxAttempts[loc.tier];
    for (let i = 0; i < maxA; i++) {
      const tierBase = { easy: 0.2, medium: 0.35, hard: 0.55, nightmare: 0.75 }[loc.tier];
      const timing = tierBase + (i * 0.15) + (Math.random() * 0.15 - 0.075);
      actionPool.push({ type: 'attempt', player: name, attemptNum: i, timing: Math.max(0, Math.min(1, timing)) });
    }
  });

  // Add social actions
  const addSocialAction = (type, players, timing) => {
    actionPool.push({ type, players, timing: timing + (Math.random() * 0.1 - 0.05) });
  };

  // Help actions: loyal players help allies (more generous gate)
  for (let i = 0; i < activePlayers.length; i++) {
    for (let j = 0; j < activePlayers.length; j++) {
      if (i === j) continue;
      const helper = activePlayers[i], target = activePlayers[j];
      if (pStats(helper).loyalty >= 4 && getBond(helper, target) >= 2 && Math.random() < 0.35) {
        addSocialAction('helpAttempt', [helper, target], 0.55);
      }
    }
  }

  // Sabotage actions (seeded broadly — the function checks archetype)
  for (let i = 0; i < activePlayers.length; i++) {
    for (let j = 0; j < activePlayers.length; j++) {
      if (i === j) continue;
      const sab = activePlayers[i], tgt = activePlayers[j];
      const bond = getBond(sab, tgt);
      const s = pStats(sab);
      if ((bond <= -2 || (s.strategic >= 6 && s.loyalty <= 5)) && Math.random() < 0.30) {
        addSocialAction('sabotageAttempt', [sab, tgt], 0.30 + Math.random() * 0.30);
      }
    }
  }

  // Steal attempts (seeded broadly — function checks archetype)
  for (let i = 0; i < activePlayers.length; i++) {
    const stealer = activePlayers[i];
    const s = pStats(stealer);
    if ((s.boldness >= 6 || s.strategic >= 6) && Math.random() < 0.30) {
      const others = activePlayers.filter(p => p !== stealer);
      const target = others[Math.floor(Math.random() * others.length)];
      addSocialAction('stealAttempt', [stealer, target], 0.65);
    }
  }

  // Teamup attempts (rivals forced together)
  for (let i = 0; i < activePlayers.length; i++) {
    for (let j = i + 1; j < activePlayers.length; j++) {
      if (getBond(activePlayers[i], activePlayers[j]) <= -1 && Math.random() < 0.30) {
        addSocialAction('teamupAttempt', [activePlayers[i], activePlayers[j]], 0.40);
      }
    }
  }

  // Panic/freeze checks: low boldness at hard/nightmare locations
  activePlayers.forEach(name => {
    const s = pStats(name);
    const loc = playerLocations[name];
    if (s.boldness <= 4 && (loc?.tier === 'hard' || loc?.tier === 'nightmare') && Math.random() < 0.40) {
      addSocialAction('panicCheck', [name], 0.25 + Math.random() * 0.2);
    }
  });

  // Showoff checks: high boldness at easy/medium locations
  activePlayers.forEach(name => {
    const s = pStats(name);
    const loc = playerLocations[name];
    if (s.boldness >= 7 && (loc?.tier === 'easy' || loc?.tier === 'medium') && Math.random() < 0.40) {
      addSocialAction('showoffCheck', [name], 0.35 + Math.random() * 0.2);
    }
  });

  // Discovery checks: high intuition at hard/nightmare
  activePlayers.forEach(name => {
    const s = pStats(name);
    const loc = playerLocations[name];
    if (s.intuition >= 5 && (loc?.tier === 'hard' || loc?.tier === 'nightmare') && Math.random() < 0.25) {
      addSocialAction('discoveryCheck', [name], 0.50 + Math.random() * 0.2);
    }
  });

  // Intel trades (meaningful but not spam — require bond >= 1, not just neutral)
  for (let i = 0; i < activePlayers.length; i++) {
    for (let j = i + 1; j < activePlayers.length; j++) {
      if (getBond(activePlayers[i], activePlayers[j]) >= 1 && Math.random() < 0.08) {
        addSocialAction('intelTradeAttempt', [activePlayers[i], activePlayers[j]], 0.35);
      }
    }
  }

  // Alliance moments — actual named alliance members coordinate
  const activeAlliances = (gs.namedAlliances || []).filter(al => !al.dissolved && al.members?.length >= 2);
  activeAlliances.forEach(al => {
    const alMembers = al.members.filter(m => activePlayers.includes(m));
    if (alMembers.length >= 2 && Math.random() < 0.35) {
      // Pick a pair from this alliance
      const shuffled = [...alMembers].sort(() => Math.random() - 0.5);
      addSocialAction('allianceMoment', [shuffled[0], shuffled[1]], 0.30 + Math.random() * 0.2);
    }
  });

  // Panic checks (auto-triggered based on state after attempts)
  // Discovery checks
  for (const name of activePlayers) {
    if (pStats(name).intuition >= 6 && ['hard','nightmare'].includes(playerLocations[name].tier) && Math.random() < 0.15) {
      addSocialAction('discoveryAttempt', [name], 0.45);
    }
  }

  // Ambush: physical players scare rivals
  for (let i = 0; i < activePlayers.length; i++) {
    for (let j = 0; j < activePlayers.length; j++) {
      if (i === j) continue;
      const ambusher = activePlayers[i], tgt = activePlayers[j];
      if (pStats(ambusher).physical >= 7 && getBond(ambusher, tgt) < 0 && Math.random() < 0.20) {
        addSocialAction('ambushAttempt', [ambusher, tgt], 0.35);
      }
    }
  }

  // Rivalry encounters: enemies meeting on the trail
  for (let i = 0; i < activePlayers.length; i++) {
    for (let j = i + 1; j < activePlayers.length; j++) {
      if (getBond(activePlayers[i], activePlayers[j]) <= -2 && Math.random() < 0.25) {
        addSocialAction('rivalryEncounter', [activePlayers[i], activePlayers[j]], 0.45);
      }
    }
  }

  // ── TAUNT: mean player mocks someone struggling or who failed ──
  const _meanArchSet = new Set(['villain', 'schemer', 'hothead', 'chaos-agent']);
  activePlayers.forEach(name => {
    const arch = players.find(p => p.name === name)?.archetype || '';
    if (!_meanArchSet.has(arch)) return;
    const s = pStats(name);
    // Find someone who failed, froze, or got sabotaged
    const victims = activePlayers.filter(p => p !== name && getBond(name, p) < 1);
    if (victims.length > 0 && Math.random() < 0.25) {
      const victim = victims[Math.floor(Math.random() * victims.length)];
      addSocialAction('taunt', [name, victim], 0.50 + Math.random() * 0.2);
    }
  });

  // ── NICE ARCHETYPE EVENTS ──
  const _niceArchSet = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);

  // Encouragement: nice player cheers on someone struggling at a hard location
  activePlayers.forEach(name => {
    const arch = players.find(p => p.name === name)?.archetype || '';
    if (!_niceArchSet.has(arch)) return;
    const s = pStats(name);
    if (s.social < 5) return;
    // Find someone at a hard/nightmare location they're friendly with
    const candidates = activePlayers.filter(p => p !== name && getBond(name, p) >= 1 && ['hard','nightmare'].includes(playerLocations[p]?.tier));
    if (candidates.length > 0 && Math.random() < 0.35) {
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      addSocialAction('encouragement', [name, target], 0.40 + Math.random() * 0.2);
    }
  });

  // Selfless delay: nice player who already found their key stays behind to guard/watch someone else's location
  activePlayers.forEach(name => {
    const arch = players.find(p => p.name === name)?.archetype || '';
    if (!_niceArchSet.has(arch)) return;
    if (pStats(name).loyalty < 6) return;
    // They'd sacrifice time for a bond >= 3 ally
    const allies = activePlayers.filter(p => p !== name && getBond(name, p) >= 3);
    if (allies.length > 0 && Math.random() < 0.25) {
      const ally = allies[Math.floor(Math.random() * allies.length)];
      addSocialAction('selflessGuard', [name, ally], 0.55 + Math.random() * 0.15);
    }
  });

  // Bonding moment: two nice players have a genuine human moment during the hunt
  for (let i = 0; i < activePlayers.length; i++) {
    for (let j = i + 1; j < activePlayers.length; j++) {
      const archA = players.find(p => p.name === activePlayers[i])?.archetype || '';
      const archB = players.find(p => p.name === activePlayers[j])?.archetype || '';
      if (!_niceArchSet.has(archA) && !_niceArchSet.has(archB)) continue;
      if (getBond(activePlayers[i], activePlayers[j]) >= 2 && Math.random() < 0.12) {
        addSocialAction('bondingMoment', [activePlayers[i], activePlayers[j]], 0.45 + Math.random() * 0.2);
      }
    }
  }

  // Sort by timing
  actionPool.sort((a, b) => a.timing - b.timing);

  // Process actions
  for (const action of actionPool) {
    if (action.type === 'attempt') {
      const name = action.player;
      const ps = huntState[name];
      if (!ps) continue;
      if (ps.keyFound || ps.frozen || ps._locationDepleted) continue; // can't re-find after key stolen
      const loc = playerLocations[name];
      const pr = pronouns(name);
      const chance = _lhSuccessChance(name, loc, huntState);
      const success = Math.random() < chance;
      ps.attemptsMade++;
      ps.helpedBy = null; // consumed
      ps.sabotagedBy = null; // consumed

      // Arrive text on first attempt
      if (action.attemptNum === 0) {
        const arriveText = loc.arrive[Math.floor(Math.random() * loc.arrive.length)](name, pr);
        timeline.push({ type: 'lhArrive', players: [name], location: loc.id, locationName: loc.name, tier: loc.tier, text: arriveText, badgeText: 'ARRIVES', badgeClass: '' });
      }

      // Check for panic on hard/nightmare before attempt
      if (!ps.frozen && pStats(name).boldness <= 3 && ['hard','nightmare'].includes(loc.tier) && Math.random() < 0.35) {
        const panicEvt = _lhPanicFreeze(name, loc, huntState, ep, _rp);
        if (panicEvt) { timeline.push(panicEvt); ep.campEvents[campKey].post.push(panicEvt); continue; }
      }

      if (success) {
        ps.keyFound = true;
        personalScores[name] = (personalScores[name] || 0) + (loc.tier === 'nightmare' ? 4 : loc.tier === 'hard' ? 3 : loc.tier === 'medium' ? 2 : 1);
        const successText = loc.success[Math.floor(Math.random() * loc.success.length)](name, pr);
        timeline.push({ type: 'lhSuccess', players: [name], location: loc.id, locationName: loc.name, tier: loc.tier, text: successText, badgeText: 'KEY FOUND', badgeClass: 'green' });
        // Showoff check
        if (pStats(name).boldness >= 8 && ['easy','medium'].includes(loc.tier) && Math.random() < 0.40) {
          const showEvt = _lhShowoff(name, loc, huntState, ep, _rp);
          if (showEvt) { timeline.push(showEvt); ep.campEvents[campKey].post.push(showEvt); }
        }
      } else {
        const failText = loc.fail[Math.floor(Math.random() * loc.fail.length)](name, pr);
        timeline.push({ type: 'lhFail', players: [name], location: loc.id, locationName: loc.name, tier: loc.tier, text: failText, badgeText: 'FAILED ATTEMPT', badgeClass: 'red' });
        personalScores[name] = (personalScores[name] || 0) - 0.5;
      }
    } else if (action.type === 'helpAttempt') {
      const [helper, target] = action.players;
      const evt = _lhHelpAlly(helper, target, huntState, ep, _rp);
      if (evt) {
        timeline.push(evt); ep.campEvents[campKey].post.push(evt);
        personalScores[helper] = (personalScores[helper] || 0) + 1.0; // sacrifice own time for teammate
      }
    } else if (action.type === 'sabotageAttempt') {
      const [sab, tgt] = action.players;
      const evt = _lhSabotageRival(sab, tgt, huntState, ep, _rp);
      if (evt) {
        timeline.push(evt); ep.campEvents[campKey].post.push(evt);
        if (evt.type === 'luckyHuntSaboteur') { // caught
          personalScores[sab] = (personalScores[sab] || 0) - 1.5;
          personalScores[tgt] = (personalScores[tgt] || 0) + 0.5; // sympathy boost
        } else { // uncaught sabotage
          personalScores[tgt] = (personalScores[tgt] || 0) - 0.5; // their chance was reduced
        }
      }
    } else if (action.type === 'stealAttempt') {
      const [stealer, target] = action.players;
      const evt = _lhStealKey(stealer, target, huntState, ep, _rp);
      if (evt) {
        timeline.push(evt); ep.campEvents[campKey].post.push(evt);
        if (evt.type === 'luckyHuntStolen') { // successful steal
          personalScores[stealer] = (personalScores[stealer] || 0) + 2.0; // bold move
          personalScores[target] = (personalScores[target] || 0) - 2.0; // devastating loss
        } else { // steal failed
          personalScores[stealer] = (personalScores[stealer] || 0) - 1.0; // humiliation
        }
      }
    } else if (action.type === 'teamupAttempt') {
      const [a, b] = action.players;
      const evt = _lhUnlikelyTeamup(a, b, huntState, ep, _rp);
      if (evt) { timeline.push(evt); }
    } else if (action.type === 'intelTradeAttempt') {
      const [a, b] = action.players;
      const evt = _lhTradeIntel(a, b, huntState, ep, _rp);
      if (evt) {
        timeline.push(evt);
        if (evt.badgeText === 'BAD INTEL') { // someone lied — victim penalized
          personalScores[b] = (personalScores[b] || 0) - 0.5;
        } else { // honest trade — both benefit
          personalScores[a] = (personalScores[a] || 0) + 0.3;
          personalScores[b] = (personalScores[b] || 0) + 0.3;
        }
      }
    } else if (action.type === 'allianceMoment') {
      const [a, b] = action.players;
      const evt = _lhAllianceMoment(a, b, huntState, ep, _rp);
      if (evt) {
        timeline.push(evt); ep.campEvents[campKey].post.push(evt);
        // scout = evt.players[0], hunter = evt.players[1]
        const [scout, hunter] = evt.players;
        personalScores[scout] = (personalScores[scout] || 0) - 0.3; // time cost for scouting
        personalScores[hunter] = (personalScores[hunter] || 0) + 0.5; // boosted by alliance support
      }
    } else if (action.type === 'discoveryAttempt' || action.type === 'discoveryCheck') {
      const name = action.players[0];
      const evt = _lhDiscovery(name, playerLocations[name], huntState, ep, _rp);
      if (evt) {
        timeline.push(evt); ep.campEvents[campKey].post.push(evt);
        personalScores[name] = (personalScores[name] || 0) + 1.0; // sharp read of the environment
      }
    } else if (action.type === 'panicCheck') {
      const name = action.players[0];
      const ps = huntState[name];
      if (ps && !ps.keyFound) {
        const s = pStats(name);
        const pr = pronouns(name);
        const loc = playerLocations[name];
        ps.frozen = true;
        personalScores[name] = (personalScores[name] || 0) - 1.0;
        const panicTexts = [
          `${name} reaches the location and stops. Just stops. ${pr.posAdj} hands are shaking. ${pr.Sub} can't move.`,
          `${name} looks at what ${pr.sub} has to do and something in ${pr.posAdj} brain says no. ${pr.Sub} sits down. Not going anywhere.`,
          `The fear hits ${name} all at once. Not gradually. All at once. ${pr.Sub} backs up three steps and freezes.`,
          `${name}'s legs won't cooperate. ${pr.Sub} knows what ${pr.sub} has to do. ${pr.Sub} cannot make ${pr.ref} do it.`,
        ];
        timeline.push({
          type: 'luckyHuntPanic', players: [name],
          locationName: loc?.name || '', tier: loc?.tier || '',
          text: _rp(panicTexts), badgeText: 'FROZE', badgeClass: 'red'
        });
      }
    } else if (action.type === 'showoffCheck') {
      const name = action.players[0];
      const ps = huntState[name];
      if (ps && ps.keyFound) {
        const s = pStats(name);
        const pr = pronouns(name);
        const loc = playerLocations[name];
        personalScores[name] = (personalScores[name] || 0) + 1.0;
        const showTexts = [
          `${name} doesn't just find the key — ${pr.sub} makes it look effortless. A wink at the camera. The crowd goes wild. There is no crowd.`,
          `${name} grabs the key with a backflip dismount that nobody asked for. Popularity: up. Humility: unchanged.`,
          `${name} finishes the hunt and immediately starts celebrating. Jumping. Pointing at the sky. The other players can hear ${pr.obj} from across the island.`,
          `"That's how it's DONE!" ${name} shouts at nobody. ${pr.Sub} holds up the key like a trophy. Chris slow-claps from somewhere.`,
        ];
        timeline.push({
          type: 'luckyHuntShowoff', players: [name],
          locationName: loc?.name || '', tier: loc?.tier || '',
          text: _rp(showTexts), badgeText: 'SHOWOFF', badgeClass: 'gold'
        });
      }
    } else if (action.type === 'ambushAttempt') {
      const [ambusher, tgt] = action.players;
      const evt = _lhAmbush(ambusher, tgt, huntState, ep, _rp);
      if (evt) {
        timeline.push(evt); ep.campEvents[campKey].post.push(evt);
        personalScores[tgt] = (personalScores[tgt] || 0) - 0.5; // disrupted search
      }
    } else if (action.type === 'rivalryEncounter') {
      const [a, b] = action.players;
      const evt = _lhRivalryEncounter(a, b, huntState, ep, _rp);
      if (evt) { timeline.push(evt); ep.campEvents[campKey].post.push(evt); }
    } else if (action.type === 'taunt') {
      const [taunter, victim] = action.players;
      const tPr = pronouns(taunter), vPr = pronouns(victim);
      addBond(taunter, victim, -0.5);
      addBond(victim, taunter, -0.7); // victim hates the taunter more
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[taunter] = (gs.popularity[taunter] || 0) - 1;
      gs.popularity[victim] = (gs.popularity[victim] || 0) + 1; // sympathy
      // taunter gains nothing; victim is demoralized
      personalScores[victim] = (personalScores[victim] || 0) - 0.3;
      timeline.push({
        type: 'luckyHuntTaunt', players: [taunter, victim],
        text: _rp([
          `${taunter} walks past ${victim}'s location and laughs. Actually laughs. "Having trouble?" ${victim} doesn't respond. ${vPr.posAdj} jaw is tight.`,
          `"You're still here?" ${taunter} looks at ${victim} with genuine amusement. "I finished ages ago." ${taunter} hasn't finished. But ${victim} doesn't know that.`,
          `${taunter} stops to watch ${victim} struggle. Leans against a tree. Takes ${tPr.posAdj} time. "This is fun," ${tPr.sub} say${tPr.sub==='they'?'':'s'} to nobody. ${victim} pretends not to hear.`,
          `${taunter} makes a show of stretching as ${tPr.sub} pass${tPr.sub==='they'?'':'es'} ${victim}. "Some people just aren't built for this." ${victim} will remember that.`,
          `"Need help?" ${taunter} asks. ${tPr.Sub} ${tPr.sub==='they'?'don\'t':'doesn\'t'} mean it. ${victim} knows ${tPr.sub} ${tPr.sub==='they'?'don\'t':'doesn\'t'} mean it. Everyone nearby knows ${tPr.sub} ${tPr.sub==='they'?'don\'t':'doesn\'t'} mean it.`,
        ]),
        badgeText: 'TAUNTED', badgeClass: 'red',
      });
    } else if (action.type === 'encouragement') {
      const [encourager, target] = action.players;
      const ePr = pronouns(encourager), tPr = pronouns(target);
      const loc = playerLocations[target];
      addBond(encourager, target, 0.3);
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[encourager] = (gs.popularity[encourager] || 0) + 1;
      // Small confidence boost for target
      if (huntState[target] && !huntState[target].keyFound) huntState[target]._intelBoost = (huntState[target]._intelBoost || 0) + 0.08;
      personalScores[target] = (personalScores[target] || 0) + 0.5; // confidence boost from support
      timeline.push({
        type: 'luckyHuntEncouragement', players: [encourager, target],
        locationName: loc?.name || '', tier: loc?.tier || '',
        text: _rp([
          `${encourager} finds ${target} staring at ${tPr.posAdj} location. "${encourager}: "You've got this. Seriously." It's not strategy. It's genuine. ${target} stands up straighter.`,
          `"Hey." ${encourager} catches up to ${target} on the trail. "Don't overthink it. Just go." A hand on ${tPr.posAdj} shoulder. Then ${encourager} is gone. ${target} feels steadier.`,
          `${encourager} stops what ${ePr.sub}'${ePr.sub==='they'?'re':'s'} doing to check on ${target}. No advice. No game talk. Just: "You okay?" ${target} nods. Means it this time.`,
          `${target} is hesitating. ${encourager} walks over, says nothing for a moment, then: "I believe in you. Go get it." Simple. Effective. ${target} goes.`,
        ]),
        badgeText: 'ENCOURAGED', badgeClass: 'green',
      });
    } else if (action.type === 'selflessGuard') {
      const [guardian, ally] = action.players;
      const gPr = pronouns(guardian), aPr = pronouns(ally);
      addBond(guardian, ally, 0.4);
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[guardian] = (gs.popularity[guardian] || 0) + 1;
      // Guardian's own hunt timing gets delayed
      if (huntState[guardian] && !huntState[guardian].keyFound) huntState[guardian]._allianceDelay = true;
      personalScores[guardian] = (personalScores[guardian] || 0) - 0.5; // sacrificed own time
      personalScores[ally] = (personalScores[ally] || 0) + 0.5; // peace of mind, uninterrupted search
      timeline.push({
        type: 'luckyHuntGuard', players: [guardian, ally],
        text: _rp([
          `${guardian} finishes ${gPr.posAdj} own hunt early and posts up near ${ally}'s location. Not helping — just making sure nobody interferes. "Go ahead. I'm watching."`,
          `${guardian} could be opening ${gPr.posAdj} chest right now. Instead ${gPr.sub}'${gPr.sub==='they'?'re':'s'} standing ten feet from ${ally}'s search area, arms crossed, watching the trail. Loyalty has a cost.`,
          `"Nobody bothers ${ally} while I'm here." ${guardian} says it to no one in particular. But everyone within earshot hears it. ${ally} searches in peace.`,
          `${guardian} gives up ${gPr.posAdj} time advantage to patrol near ${ally}. It's not smart gameplay. It's something better.`,
        ]),
        badgeText: 'STANDING GUARD', badgeClass: 'green',
      });
    } else if (action.type === 'bondingMoment') {
      const [a, b] = action.players;
      const aPr = pronouns(a), bPr = pronouns(b);
      addBond(a, b, 0.3);
      personalScores[a] = (personalScores[a] || 0) + 0.3; // morale from genuine human moment
      personalScores[b] = (personalScores[b] || 0) + 0.3;
      timeline.push({
        type: 'luckyHuntBonding', players: [a, b],
        text: _rp([
          `${a} and ${b} end up walking the same trail. Neither is in a hurry. They talk — not about the game. About home. About what they miss. The hunt can wait.`,
          `${a} passes ${b} at the creek. They sit down. Five minutes of real conversation. No strategy. Just two people remembering they're people.`,
          `${b} falls behind the pace and ${a} slows down to match. They walk together in silence for a while. It's comfortable. The island feels smaller.`,
          `${a} shares water with ${b}. ${b} shares a snack with ${a}. Neither was asked. The hunt resumes. Something shifted.`,
        ]),
        badgeText: 'MOMENT', badgeClass: 'green',
      });
    }
  }

  // ── 4. ROUND 4: SOCIAL SCHEMES ──
  timeline.push({ type: 'lhPhase', text: 'SOCIAL SCHEMES', phase: 'social' });
  const socialEvents = generateSocialManipulationEvents(gs.activePlayers, ep, 0.40);
  socialEvents.forEach(evt => { timeline.push({ ...evt, type: 'lhSocialScheme' }); });

  // ── 5. ROUND 5: LAST CHANCE ──
  timeline.push({ type: 'lhPhase', text: 'LAST CHANCE', phase: 'lastchance' });
  activePlayers.forEach(name => {
    const ps = huntState[name];
    if (!ps || ps.keyFound || ps.frozen || ps._locationDepleted) return; // stolen victims can't re-find
    const loc = playerLocations[name];
    const pr = pronouns(name);
    const chance = Math.max(0.05, _lhSuccessChance(name, loc, huntState) - 0.05);
    const success = Math.random() < chance;
    ps.attemptsMade++;
    if (success) {
      ps.keyFound = true;
      personalScores[name] = (personalScores[name] || 0) + (loc.tier === 'nightmare' ? 3 : loc.tier === 'hard' ? 2 : 1);
      const successText = loc.success[Math.floor(Math.random() * loc.success.length)](name, pr);
      timeline.push({ type: 'lhLastChance', players: [name], location: loc.id, locationName: loc.name, tier: loc.tier, text: `[Last Chance] ${successText}`, badgeText: 'LAST CHANCE KEY', badgeClass: 'gold' });
    } else {
      timeline.push({ type: 'lhLastChanceFail', players: [name], location: loc.id, locationName: loc.name, tier: loc.tier, text: `${name} is out of time. The key stays where it is.`, badgeText: 'NO KEY', badgeClass: 'red' });
    }
  });

  // ── 6. DUD KEY ROLL ──
  activePlayers.forEach(name => {
    const ps = huntState[name];
    if (!ps || !ps.keyFound) return;
    if (Math.random() < 0.15) {
      ps.dudKey = true;
      personalScores[name] = (personalScores[name] || 0) - 0.5;
    }
  });

  // ── 7. CHEST CEREMONY ──
  timeline.push({ type: 'lhPhase', text: 'CHEST CEREMONY', phase: 'ceremony' });

  const FOOD_ITEMS = ['Chips and a Candy Bar', 'Cleaver Body Spray', 'Toaster', 'Leg Lamp', 'Ships in a Bottle', 'Accordion', 'Industrial Body Spray', 'A Pillow', 'Mystery Meat Jerky', 'Gift Certificate to Nowhere'];
  const BOOBY_TRAPS = ['Paint Bomb', 'Skunk Spray', 'Glitter Cannon', 'Boxing Glove', 'Smoke Bomb'];
  const FOOD_SHUFFLED = [...FOOD_ITEMS].sort(() => Math.random() - 0.5);
  const TRAPS_SHUFFLED = [...BOOBY_TRAPS].sort(() => Math.random() - 0.5);

  const validKeyHolders = activePlayers.filter(n => huntState[n]?.keyFound && !huntState[n]?.dudKey);
  const dudKeyHolders = activePlayers.filter(n => huntState[n]?.keyFound && huntState[n]?.dudKey);
  const noKeyPlayers = activePlayers.filter(n => !huntState[n]?.keyFound);

  // Dud key camp events
  dudKeyHolders.forEach(name => {
    const pr = pronouns(name);
    const dudEvt = { type: 'luckyHuntDud', players: [name], text: _rp([
      `${name} opens ${pr.posAdj} chest and pulls out a key. ${pr.Sub} smile${pr.sub==='they'?'':'s'} — then the key breaks in half. Fake. The chest holds nothing useful.`,
      `${name} inserts ${pr.posAdj} key. It turns. Nothing happens. ${pr.Sub} turn${pr.sub==='they'?'':'s'} the key back. Tries again. The chest stays shut. Dud.`,
      `${name}'s chest opens to reveal: another key. This one has a note. "This is not the immunity key." ${pr.Sub} make${pr.sub==='they'?'':'s'} a sound.`,
    ]), badgeText: 'DUD KEY', badgeClass: 'red' };
    timeline.push(dudEvt);
    ep.campEvents[campKey].post.push(dudEvt);
  });

  // Build chest pool
  const chestPool = [];
  chestPool.push({ type: 'immunity', label: 'Immunity Necklace' });
  chestPool.push({ type: 'boobyTrap', label: TRAPS_SHUFFLED[0] });
  if (validKeyHolders.length >= 4) chestPool.push({ type: 'shareable', label: 'Shareable Feast' });
  if (seasonConfig.advantages !== 'disabled' && Math.random() < 0.5) chestPool.push({ type: 'advantage', label: Math.random() < 0.5 ? 'Extra Vote' : 'Idol Clue' });
  // Extra keys from steals — stealers with _extraKey get a bonus chest slot
  const extraKeyPlayers = validKeyHolders.filter(n => huntState[n]?._extraKey);
  const totalChests = validKeyHolders.length + extraKeyPlayers.length;
  // Fill rest with food
  while (chestPool.length < totalChests) {
    chestPool.push({ type: 'food', label: FOOD_SHUFFLED[chestPool.length % FOOD_SHUFFLED.length] });
  }
  // Shuffle — but immunity reveal goes last
  const nonImmune = chestPool.filter(c => c.type !== 'immunity').sort(() => Math.random() - 0.5);
  const shuffledPool = [...nonImmune, { type: 'immunity', label: 'Immunity Necklace' }];

  const chestAssignments = {};
  let immunityWinner = null;
  // Build assignment list — extra-key stealers appear twice
  const assignmentList = [];
  validKeyHolders.sort(() => Math.random() - 0.5);
  validKeyHolders.forEach(name => {
    assignmentList.push(name);
    if (huntState[name]?._extraKey) assignmentList.push(name); // second try
  });
  assignmentList.forEach((name, i) => {
    const chest = shuffledPool[i] || { type: 'food', label: FOOD_SHUFFLED[i % FOOD_SHUFFLED.length] };
    // If player already has a chest, keep the better one (immunity > advantage > shareable > food > trap)
    const existing = chestAssignments[name];
    const rank = { immunity: 5, advantage: 4, shareable: 3, food: 2, boobyTrap: 0 };
    if (!existing || (rank[chest.type] || 0) > (rank[existing.type] || 0)) {
      chestAssignments[name] = chest;
    }
    if (chest.type === 'immunity') immunityWinner = name;
  });

  // If no key holders at all, pick a random player as immunity winner
  if (!immunityWinner && activePlayers.length > 0) {
    immunityWinner = activePlayers[Math.floor(Math.random() * activePlayers.length)];
    chestAssignments[immunityWinner] = { type: 'immunity', label: 'Immunity Necklace' };
  }

  // Generate chest reveal events
  const revealOrder = [...validKeyHolders].sort((a, b) => {
    if (chestAssignments[a]?.type === 'immunity') return 1;
    if (chestAssignments[b]?.type === 'immunity') return -1;
    return 0;
  });

  revealOrder.forEach(name => {
    const chest = chestAssignments[name];
    const pr = pronouns(name);
    if (!chest) return;

    let revealText = '';
    let badgeText = chest.label.toUpperCase();
    let badgeClass = '';

    if (chest.type === 'immunity') {
      badgeClass = 'gold';
      revealText = _rp([
        `${name} opens the chest. ${pr.Sub} look${pr.sub==='they'?'':'s'} down at what's inside. The immunity necklace. ${pr.Sub} put${pr.sub==='they'?'':'s'} ${pr.posAdj} hand over ${pr.posAdj} mouth. ${pr.Sub} got it.`,
        `The chest is open. ${name} stares for one second. Then ${pr.sub} reach${pr.sub==='they'?'':'es'} in and pulls out the necklace. Safe. The hunt is over.`,
        `${name} gets the immunity necklace. ${pr.Sub} look${pr.sub==='they'?'':'s'} up at everyone else. "Sorry." ${pr.Sub}'${pr.sub==='they'?'re':'s'} not sorry.`,
        `The immunity necklace is in ${name}'s hands before ${pr.sub} fully understand${pr.sub==='they'?'':'s'} what ${pr.sub}'${pr.sub==='they'?'re':'s'} holding. Then it hits. ${pr.Sub} let${pr.sub==='they'?'':'s'} out a long breath.`,
        `${name} opens the chest and goes completely still. Then ${pr.sub} lift${pr.sub==='they'?'':'s'} the necklace and put${pr.sub==='they'?'':'s'} it on without saying a word. That says everything.`,
      ]);
      personalScores[name] = (personalScores[name] || 0) + 5;
    } else if (chest.type === 'boobyTrap') {
      badgeClass = 'red';
      revealText = _rp([
        `${name} opens the chest and gets a ${chest.label} directly in the face. Full blast. No hesitation from the mechanism. The crowd steps back.`,
        `The ${chest.label} detonates the moment ${name}'s chest opens. ${pr.Sub} stand${pr.sub==='they'?'':'s'} there, covered, and says nothing for a very long time.`,
        `${name} deserved a key, not a ${chest.label}. The game doesn't care about deserving.`,
      ]);
      personalScores[name] = (personalScores[name] || 0) - 1;
      const trapEvt = { type: 'luckyHuntBoobyTrap', players: [name], text: revealText, badgeText: `BOOBY TRAP: ${chest.label}`, badgeClass: 'red' };
      ep.campEvents[campKey].post.push(trapEvt);
    } else if (chest.type === 'shareable') {
      badgeClass = 'green';
      // Pick highest bond ally
      const ally = activePlayers.filter(p => p !== name).sort((a, b) => getBond(name, b) - getBond(name, a))[0];
      if (ally) {
        addBond(name, ally, 1.0);
        activePlayers.filter(p => p !== name && p !== ally).forEach(p => addBond(name, p, -0.3));
        revealText = _rp([
          `${name} opens the chest to find a feast. ${pr.Sub} look${pr.sub==='they'?'':'s'} around — then immediately calls for ${ally}. "Come share this with me." Choice made. Bonds logged.`,
          `Feast in the chest. ${name} picks ${ally} without hesitation. The rest of camp notices who they picked.`,
        ]);
        const shareEvt = { type: 'luckyHuntShared', players: [name, ally], text: revealText, badgeText: 'SHARED REWARD', badgeClass: 'green' };
        ep.campEvents[campKey].post.push(shareEvt);
      } else {
        revealText = `${name} opens the feast chest. ${pr.Sub} eat${pr.sub==='they'?'':'s'} alone.`;
      }
    } else if (chest.type === 'advantage') {
      badgeClass = 'gold';
      revealText = _rp([
        `${name} opens the chest expecting food. Finds a ${chest.label} instead. ${pr.Sub} read${pr.sub==='they'?'':'s'} it twice. Pockets it immediately.`,
        `${chest.label}. ${name} does not celebrate openly. Just folds the paper, puts it away, and schools ${pr.posAdj} expression.`,
      ]);
      if (seasonConfig.advantages !== 'disabled') {
        const advType = chest.label === 'Extra Vote' ? 'extraVote' : 'clue';
        gs.advantages.push({ type: advType, holder: name, foundEp: ep.num, active: true });
      }
    } else {
      badgeClass = '';
      const itemName = chest.label;
      const chestTextsByItem = {
        'Chips and a Candy Bar': [
          `${name} opens the chest. Chips. A candy bar. ${pr.Sub} immediately start${pr.sub==='they'?'':'s'} eating.`,
          `"FOOD!" ${name} shoves the candy bar in ${pr.posAdj} mouth before anyone can ask to share.`,
          `${name} finds chips and a candy bar. Not immunity. But honestly? Right now this might be better.`,
        ],
        'Toaster': [
          `A toaster. ${name} stares at it. "There's no electricity on this island." ${pr.Sub} take${pr.sub==='they'?'':'s'} it anyway.`,
          `${name} pulls out a toaster. Blinks. Looks at the host. The host shrugs. "A prize is a prize."`,
          `"Is this a joke?" ${name} holds up a toaster. It is not a joke. It is a toaster.`,
        ],
        'Leg Lamp': [
          `${name} pulls out a leg-shaped lamp. The camp is briefly silent. Then someone starts laughing.`,
          `A leg lamp. ${name} has won a leg lamp. This is ${pr.posAdj} life now.`,
          `${name} unwraps the lamp and holds it up. It's a leg. A lamp leg. "I'm keeping this forever."`,
        ],
        'Cleaver Body Spray': [
          `${name} opens the chest and pulls out a can of Cleaver body spray. ${pr.Sub} read${pr.sub==='they'?'':'s'} the label. Reads it again. "Sure."`,
          `Cleaver body spray. The camp can smell it from here. ${name} sprays some on immediately.`,
          `${name} holds up the Cleaver can. "Is this a reward or a threat?" Nobody answers.`,
        ],
        'Industrial Body Spray': [
          `${name} cracks open the chest. Industrial body spray. An economy-size can. ${pr.Sub} look${pr.sub==='they'?'':'s'} genuinely unsure.`,
          `The chest holds industrial body spray. ${name} takes it with the face of someone accepting a parking ticket.`,
          `"...Industrial?" ${name} stares at the label. ${pr.Sub} put${pr.sub==='they'?'':'s'} it under ${pr.posAdj} arm. "Fine."`,
        ],
        'Ships in a Bottle': [
          `${name} lifts out a ship in a bottle. Tiny. Detailed. Completely useless. ${pr.Sub} love${pr.sub==='they'?'':'s'} it.`,
          `Ships in a bottle. ${name} holds it up to the light. "How did they even get it in there?" The game moves on.`,
          `${name} gets a ship in a bottle. ${pr.Sub} set${pr.sub==='they'?'':'s'} it down carefully. That's oddly precious.`,
        ],
        'Accordion': [
          `${name} pulls out an accordion. There is a long silence. Then ${pr.sub} start${pr.sub==='they'?'':'s'} playing it. Badly.`,
          `An accordion. ${name} squeezes it once. It makes a sound. Camp collectively winces.`,
          `${name} holds up an accordion like a trophy. "I don't know how to play this." ${pr.Sub} will learn.`,
        ],
        'A Pillow': [
          `${name} reaches in and pulls out a pillow. Just a pillow. ${pr.Sub} immediately hold${pr.sub==='they'?'':'s'} it against ${pr.posAdj} face.`,
          `A pillow. ${name} looks at it. At the game. At the chest. "I genuinely needed this."`,
          `${name} opens the chest and finds a pillow. The camp laughs. ${name} is not laughing. ${name} is sleeping tonight.`,
        ],
        'Mystery Meat Jerky': [
          `${name} finds mystery meat jerky in the chest. ${pr.Sub} open${pr.sub==='they'?'':'s'} the bag and smell${pr.sub==='they'?'':'s'} it. ${pr.Sub} eat${pr.sub==='they'?'':'s'} it anyway.`,
          `"Mystery meat." ${name} reads the label. There is no other information on the label. ${pr.Sub} eat${pr.sub==='they'?'':'s'} it.`,
          `${name} pulls out jerky with no identifiable source animal. ${pr.Sub} shrug${pr.sub==='they'?'':'s'}. "Protein's protein."`,
        ],
        'Gift Certificate to Nowhere': [
          `${name} unfolds a gift certificate. "Valid at participating locations." There are no participating locations. ${pr.Sub} pocket${pr.sub==='they'?'':'s'} it.`,
          `A gift certificate to nowhere. ${name} reads every line of the fine print. Every line. There is no fine print.`,
          `${name} holds up the certificate. "I don't know what this is for." Nobody does. ${pr.Sub} take${pr.sub==='they'?'':'s'} it home.`,
        ],
      };
      const itemPool = chestTextsByItem[itemName];
      if (itemPool) {
        revealText = _rp(itemPool);
      } else {
        revealText = _rp([
          `${name} opens the chest and finds ${itemName}. ${pr.Sub} blink${pr.sub==='they'?'':'s'}. "That's... a thing." ${pr.Sub} take${pr.sub==='they'?'':'s'} it.`,
          `${itemName}. ${name} holds it up. "What do I do with this?" Nobody knows. ${pr.Sub} keep${pr.sub==='they'?'':'s'} it anyway.`,
          `The chest holds ${itemName}. ${name} looks at it, at the camp, back at it. "I'll take the win."`,
        ]);
      }
      // Survival system food bonus
      if (chest.type === 'food' && gs.tribeFood && gs.tribeFood[campKey] !== undefined) {
        gs.tribeFood[campKey] = (gs.tribeFood[campKey] || 0) + 5;
      }
    }

    timeline.push({ type: 'lhChestReveal', chestType: chest.type, chestLabel: chest.label, players: [name], text: revealText, badgeText, badgeClass });
  });

  // Immunity announcement
  if (immunityWinner) {
    const imPr = pronouns(immunityWinner);
    timeline.push({ type: 'lhImmunity', players: [immunityWinner], text: _rp([
      `${immunityWinner} is safe tonight. The hunt is over. One key. One chest. One necklace.`,
      `Immunity goes to ${immunityWinner}. That's what the lucky hunt delivers — one person safe, everyone else scrambling.`,
      `${host}: "Tonight at tribal, ${immunityWinner} cannot be voted out." ${immunityWinner} holds the necklace. Everyone else does the math.`,
    ]), badgeText: 'IMMUNITY', badgeClass: 'gold' });
  }

  // ── 8. SET CHALLENGE OUTCOME ──
  ep.challengeType = 'individual';
  ep.challengeLabel = 'Lucky Hunt';
  ep.challengeCategory = 'mixed';
  ep.challengeDesc = 'Scavenger hunt for keys — one chest has immunity.';
  ep.immunityWinner = immunityWinner;
  ep.tribalPlayers = gs.activePlayers.filter(p => p !== immunityWinner);
  ep.chalMemberScores = personalScores;

  // ── 9. STORE ──
  ep.luckyHunt = {
    timeline,
    huntResults: huntState,
    immunityWinner,
    playerLocations: Object.fromEntries(Object.entries(playerLocations).map(([k,v]) => [k, { id: v.id, name: v.name, tier: v.tier }])),
    chestAssignments,
    keyFinders: validKeyHolders,
    dudKeys: dudKeyHolders,
    noKey: noKeyPlayers,
    personalScores,
  };

  // ── 10. UPDATE CHALLENGE RECORD ──
  updateChalRecord(ep);
}

export function _textLuckyHunt(ep, ln, sec) {
  const lh = ep.luckyHunt;
  if (!lh) return;
  sec('LUCKY HUNT');
  const locs = lh.playerLocations || {};
  const results = lh.huntResults || {};
  ln(`${Object.keys(locs).length} players. Scavenger hunt for keys. One chest holds immunity.`);
  ln('');

  // Location assignments
  ln('CLUE ASSIGNMENTS:');
  Object.entries(locs).forEach(([name, loc]) => {
    const r = results[name];
    const status = r?.stolen ? 'KEY STOLEN' : r?.keyFound && !r?.dudKey ? 'KEY FOUND' : r?.dudKey ? 'DUD KEY' : 'NO KEY';
    const score = ep.chalMemberScores?.[name];
    ln(`  ${name}: ${loc.name} [${loc.tier.toUpperCase()}] — ${status}${score != null ? ` (score: ${typeof score === 'number' ? score.toFixed(1) : score})` : ''}`);
  });
  ln('');

  // Full timeline narrative
  ln('TIMELINE:');
  (lh.timeline || []).forEach(evt => {
    if (evt.type === 'lhPhase') { ln(''); ln(`=== ${evt.text} ===`); return; }
    if (!evt.text) return;
    const badge = evt.badgeText ? `[${evt.badgeText}]` : `[${evt.type}]`;
    const players = evt.players?.length ? evt.players.join(', ') + ': ' : '';
    const loc = evt.locationName ? ` (${evt.locationName}${evt.tier ? ' — ' + evt.tier : ''})` : '';
    ln(`  ${badge} ${players}${evt.text}${loc}`);
  });
  ln('');

  // Summary
  if (lh.keyFinders?.length) ln(`Key finders (${lh.keyFinders.length}): ${lh.keyFinders.join(', ')}`);
  if (lh.dudKeys?.length) ln(`Dud keys (${lh.dudKeys.length}): ${lh.dudKeys.join(', ')}`);
  if (lh.noKey?.length) ln(`No key (${lh.noKey.length}): ${lh.noKey.join(', ')}`);
  ln('');

  // Chest ceremony
  ln('CHEST CEREMONY:');
  Object.entries(lh.chestAssignments || {}).forEach(([name, chest]) => {
    const icon = chest.type === 'immunity' ? '*** IMMUNITY ***' : chest.type === 'boobyTrap' ? '(BOOBY TRAP)' : chest.type === 'shareable' ? '(SHARED)' : '';
    ln(`  ${name}: ${chest.label} ${icon}`);
  });
  ln('');
  ln(`IMMUNITY: ${lh.immunityWinner || '???'}`);
}

export function rpBuildLuckyHunt(ep) {
  const lh = ep.luckyHunt;
  if (!lh) return '';
  const stateKey = `lh_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];
  const timeline = lh.timeline || [];
  const allRevealed = state.idx >= timeline.length - 1; // raw timeline index for backward compat

  const _lhReveal = (targetIdx) => `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};_tvState['${stateKey}'].idx=${targetIdx};const ep=gs.episodeHistory.find(e=>e.num===${ep.num});if(ep){const m=document.querySelector('.rp-main');const st=m?m.scrollTop:0;const _oldScreen=vpCurrentScreen;buildVPScreens(ep);const _lhIdx=vpScreens.findIndex(s=>s.id==='lucky-hunt');if(_lhIdx>=0)vpCurrentScreen=_lhIdx;else vpCurrentScreen=_oldScreen;renderVPScreen();if(m)m.scrollTop=st;}`;

  const TIER_COLORS = { easy: '#3fb950', medium: '#f0a500', hard: '#f97316', nightmare: '#f85149' };
  const TIER_BG = { easy: 'rgba(63,185,80,0.08)', medium: 'rgba(240,165,0,0.08)', hard: 'rgba(249,115,22,0.08)', nightmare: 'rgba(248,81,73,0.08)' };

  let html = `<div class="rp-page lh-map">
    <div style="text-align:center;font-size:9px;font-weight:700;letter-spacing:3px;color:#6b5234;margin-bottom:8px">EPISODE ${ep.num}</div>
    <div class="lh-title">LUCKY HUNT</div>
    <div class="lh-subtitle">Find your key. Open your chest. One holds immunity.</div>
    <div class="lh-compass">N ◇ E ◇ S ◇ W</div>`;

  // Summary header (only after all revealed — these are spoilers)
  const keyFinders = lh.keyFinders || [];
  const dudKeys = lh.dudKeys || [];
  const noKey = lh.noKey || [];
  if (allRevealed) {
    html += `<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;justify-content:center">
      <div style="padding:8px 16px;background:rgba(63,185,80,0.08);border:1px solid rgba(63,185,80,0.2);border-radius:6px;text-align:center">
        <div style="font-size:20px;font-weight:800;color:#3fb950">${keyFinders.length}</div>
        <div style="font-size:9px;color:#8b6d47;letter-spacing:1px">KEY HOLDERS</div>
      </div>
      <div style="padding:8px 16px;background:rgba(248,81,73,0.08);border:1px solid rgba(248,81,73,0.2);border-radius:6px;text-align:center">
        <div style="font-size:20px;font-weight:800;color:#f85149">${dudKeys.length}</div>
        <div style="font-size:9px;color:#8b6d47;letter-spacing:1px">DUD KEYS</div>
      </div>
      <div style="padding:8px 16px;background:rgba(139,148,158,0.06);border:1px solid rgba(139,148,158,0.15);border-radius:6px;text-align:center">
        <div style="font-size:20px;font-weight:800;color:#6e7681">${noKey.length}</div>
        <div style="font-size:9px;color:#8b6d47;letter-spacing:1px">NO KEY</div>
      </div>
    </div>`;
  }

  // Location assignments — revealed through the timeline clue draws, shown as summary only after all revealed
  if (allRevealed) {
    const playerLocs = lh.playerLocations || {};
    if (Object.keys(playerLocs).length) {
      html += `<div style="margin-bottom:16px">
        <div class="lh-section-title">EXPEDITION LOG</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">`;
      Object.entries(playerLocs).forEach(([name, loc]) => {
        const tc = TIER_COLORS[loc.tier] || '#8b6d47';
        const result = lh.huntResults?.[name];
        const icon = result?.keyFound && !result?.dudKey ? '🗝️' : result?.dudKey ? '💀' : '✗';
        const bgTint = result?.keyFound && !result?.dudKey ? 'rgba(63,185,80,0.06)' : result?.dudKey ? 'rgba(248,81,73,0.06)' : 'rgba(139,148,158,0.04)';
        html += `<div style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:${bgTint};border:1px solid ${tc}33;border-radius:4px">
          ${rpPortrait(name, 'sm')}
          <div>
            <div style="font-size:11px;font-weight:600;color:#e8d5b0">${name}</div>
            <div style="font-size:9px;color:${tc};letter-spacing:0.5px">${loc.name} — <span style="text-transform:uppercase;font-weight:700">${loc.tier}</span></div>
          </div>
          <div style="font-size:14px;margin-left:4px">${icon}</div>
        </div>`;
      });
      html += `</div></div>`;
    }
  }

  // Build reveal index: skip lhPhase (decorative) AND lhHostCommentary that follow lhClue
  // (host commentary during clue draw is bundled with the clue, not a separate click)
  const revealableEvents = [];
  const revealIndexMap = {}; // timeline index → reveal index
  const hostCommentaryBundled = new Set(); // indices of host commentary bundled with clues
  timeline.forEach((evt, i) => {
    if (evt.type === 'lhPhase') return; // skip phase headers
    if (evt.type === 'lhHostCommentary' && i > 0 && timeline[i - 1]?.type === 'lhClue') {
      // Bundle with preceding clue — not a separate reveal step
      hostCommentaryBundled.add(i);
      return;
    }
    revealIndexMap[i] = revealableEvents.length;
    revealableEvents.push(i);
  });
  const totalReveals = revealableEvents.length;
  // Count how many revealable events have been shown (timeline index <= state.idx)
  const revealedCount = revealableEvents.filter(ti => ti <= state.idx).length;
  const isEventRevealed = (timelineIdx) => timelineIdx <= state.idx && revealIndexMap[timelineIdx] !== undefined;
  const nextRevealTimelineIdx = revealedCount < totalReveals ? revealableEvents[revealedCount] : null;

  // ── QUEST BOARD: Clue Draw Phase ──
  // Separate clue draw events from the rest
  const clueDrawEvents = timeline.filter(e => e.type === 'lhClue');
  const huntEvents = timeline.filter((e, i) => e.type !== 'lhClue' && e.type !== 'lhPhase' && !hostCommentaryBundled.has(i));
  const clueDrawCount = clueDrawEvents.length;

  // Quest board
  html += `<div style="margin-bottom:20px;padding:16px;background:rgba(22,27,34,0.6);border:2px solid rgba(212,168,83,0.2);border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.3)">
    <div style="font-family:var(--font-display);font-size:14px;letter-spacing:2px;color:#d4a853;text-align:center;margin-bottom:12px;text-shadow:0 0 10px rgba(212,168,83,0.2)">📋 CLUE ASSIGNMENTS</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">`;

  clueDrawEvents.forEach((clue, ci) => {
    const timelineIdx = timeline.indexOf(clue);
    const revealed = isEventRevealed(timelineIdx);
    const tc = TIER_COLORS[clue.tier] || '#8b949e';
    const bg = TIER_BG[clue.tier] || 'rgba(139,148,158,0.08)';

    if (revealed) {
      // Flipped card — tier-colored border, dark card, vibrant text
      html += `<div style="width:120px;padding:8px;background:linear-gradient(180deg,rgba(13,17,23,0.9) 0%,rgba(22,27,34,0.9) 100%);border:2px solid ${tc};border-radius:8px;box-shadow:0 0 12px ${tc}33;text-align:center">
        <div style="margin-bottom:4px">${rpPortrait(clue.players?.[0] || '', 'sm')}</div>
        <div style="font-size:11px;font-weight:700;color:#e6edf3">${clue.players?.[0] || ''}</div>
        <div style="font-size:8px;font-weight:800;letter-spacing:1.5px;color:#fff;background:${tc};padding:2px 8px;border-radius:4px;margin:4px auto;display:inline-block">${(clue.tier || '').toUpperCase()}</div>
        <div style="font-size:9px;color:${tc};line-height:1.3;margin-top:3px;font-weight:600">${clue.locationName || '???'}</div>
      </div>`;
    } else {
      // Face-down card — dark, mysterious
      html += `<div style="width:120px;padding:8px;background:linear-gradient(180deg,rgba(22,27,34,0.8) 0%,rgba(13,17,23,0.8) 100%);border:1px solid rgba(255,255,255,0.08);border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.3);text-align:center;opacity:0.6">
        <div style="margin-bottom:4px">${rpPortrait(clue.players?.[0] || '', 'sm')}</div>
        <div style="font-size:11px;font-weight:700;color:#6e7681">${clue.players?.[0] || ''}</div>
        <div style="font-size:10px;color:#484f58;margin-top:4px">🗝️ ???</div>
      </div>`;
    }
  });

  html += `</div></div>`;

  // Latest revealed clue draw — show the reaction text below the board (+ bundled host commentary)
  const lastRevealedClue = clueDrawEvents.filter((c, ci) => isEventRevealed(timeline.indexOf(c))).slice(-1)[0];
  if (lastRevealedClue && revealedCount <= clueDrawCount) {
    const tc = TIER_COLORS[lastRevealedClue.tier] || '#8b949e';
    // Find bundled host commentary (the event right after this clue in the timeline)
    const clueTimelineIdx = timeline.indexOf(lastRevealedClue);
    const hostComment = (clueTimelineIdx < timeline.length - 1 && hostCommentaryBundled.has(clueTimelineIdx + 1))
      ? timeline[clueTimelineIdx + 1] : null;

    html += `<div style="padding:12px 16px;margin-bottom:14px;border-radius:10px;border:2px solid ${tc};background:linear-gradient(135deg, ${tc}18 0%, rgba(13,17,23,0.85) 100%);backdrop-filter:blur(4px)">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        ${rpPortrait(lastRevealedClue.players?.[0] || '', 'pb-sm')}
        <div style="flex:1">
          <div style="font-size:14px;font-weight:800;color:#e6edf3;letter-spacing:0.5px">${lastRevealedClue.players?.[0] || ''}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:3px">
            <span style="font-size:9px;font-weight:800;letter-spacing:1.5px;color:#fff;background:${tc};padding:2px 8px;border-radius:4px;text-transform:uppercase">${lastRevealedClue.tier || ''}</span>
            <span style="font-size:11px;color:${tc};font-weight:600">${lastRevealedClue.locationName || ''}</span>
          </div>
        </div>
      </div>
      <div style="font-size:13px;color:#c9d1d9;line-height:1.6;font-style:italic">${lastRevealedClue.text}</div>
      ${hostComment ? `<div style="font-size:11px;color:#8b949e;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06);font-style:italic">${hostComment.text}</div>` : ''}
    </div>`;
  }

  // ── THE HUNT: Post-clue-draw timeline ──
  const huntStartIdx = clueDrawCount; // first non-clue event's reveal index
  if (revealedCount > clueDrawCount) {
    html += `<hr class="lh-rope">
    <div style="margin-bottom:16px">
      <div class="lh-section-title">⚓ THE HUNT ⚓</div>`;

    // ── Live status tracker (sticky, updates based on revealed events) ──
    const trackerState = {};
    const allPlayers = Object.keys(lh.huntResults || lh.playerLocations || {});
    allPlayers.forEach(name => {
      trackerState[name] = { status: 'hunting', mods: [] }; // default
    });
    // Scan revealed events to build current state
    timeline.forEach((evt, i) => {
      if (!isEventRevealed(i)) return;
      const t = evt.type;
      const p0 = evt.players?.[0];
      if (t === 'lhSuccess' && p0 && trackerState[p0]) trackerState[p0].status = 'found';
      if (t === 'lhFail' && p0 && trackerState[p0] && trackerState[p0].status !== 'found') trackerState[p0].status = 'failed-attempt';
      if ((t === 'luckyHuntDud') && p0 && trackerState[p0]) trackerState[p0].status = 'dud';
      if ((t === 'luckyHuntPanic') && p0 && trackerState[p0]) { trackerState[p0].status = 'frozen'; trackerState[p0].mods.push({ icon: '😰', color: '#f85149' }); }
      if (t === 'luckyHuntSabotage' && evt.players?.[1] && trackerState[evt.players[1]]) trackerState[evt.players[1]].mods.push({ icon: '🗡️', color: '#8b5cf6' });
      if (t === 'luckyHuntSaboteur' && p0 && trackerState[p0]) trackerState[p0].mods.push({ icon: '👁️', color: '#f85149' });
      if (t === 'luckyHuntHelped' && evt.players?.[1] && trackerState[evt.players[1]]) trackerState[evt.players[1]].mods.push({ icon: '🤝', color: '#3fb950' });
      if (t === 'luckyHuntStolen' && p0 && trackerState[p0]) { trackerState[p0].status = 'found'; } // stealer got the key
      if (t === 'luckyHuntStolen' && evt.players?.[1] && trackerState[evt.players[1]]) { trackerState[evt.players[1]].status = 'stolen'; trackerState[evt.players[1]].mods.push({ icon: '💰', color: '#f0a500' }); }
      if (t === 'luckyHuntShowoff' && p0 && trackerState[p0]) trackerState[p0].mods.push({ icon: '✨', color: '#e3b341' });
      if (t === 'luckyHuntAmbush' && evt.players?.[1] && trackerState[evt.players[1]]) trackerState[evt.players[1]].mods.push({ icon: '⚡', color: '#f85149' });
      if (t === 'luckyHuntDiscovery' && p0 && trackerState[p0]) trackerState[p0].mods.push({ icon: '🔍', color: '#58a6ff' });
      if (t === 'luckyHuntAlliance') {
        if (p0 && trackerState[p0]) trackerState[p0].mods.push({ icon: '🤜', color: '#58a6ff' });
        if (evt.players?.[1] && trackerState[evt.players[1]]) trackerState[evt.players[1]].mods.push({ icon: '🤛', color: '#58a6ff' });
      }
      if (t === 'luckyHuntIntelTrade' && evt.badgeText === 'BAD INTEL') {
        // Mark the victim of bad intel
        if (evt.players?.[1] && trackerState[evt.players[1]]) trackerState[evt.players[1]].mods.push({ icon: '❌', color: '#f85149' });
      }
      if (t === 'lhChestReveal' && p0 && trackerState[p0]) trackerState[p0].status = 'chest-opened';
    });

    html += `<div class="lh-tracker">`;
    allPlayers.forEach(name => {
      const ts = trackerState[name];
      const loc = lh.playerLocations?.[name];
      const tc = loc?.tier ? TIER_COLORS[loc.tier] : '#484f58';
      const statusClass = ts.status === 'found' ? 'found' : ts.status === 'frozen' ? 'frozen'
        : ts.status === 'failed-attempt' ? 'failed' : ts.status === 'dud' ? 'failed'
        : ts.status === 'stolen' ? 'failed' : ts.status === 'chest-opened' ? 'found' : 'hunting';
      const statusIcon = ts.status === 'found' ? '🗝️' : ts.status === 'frozen' ? '😰'
        : ts.status === 'failed-attempt' ? '✗' : ts.status === 'dud' ? '💀'
        : ts.status === 'stolen' ? '💔' : ts.status === 'chest-opened' ? '📦' : '🔎';
      const hasMods = ts.mods.length > 0;

      html += `<div class="lh-tracker-player ${statusClass}">
        ${rpPortrait(name, 'xs')}
        <span style="font-weight:600;color:#c9d1d9">${name}</span>
        <span style="font-size:10px">${statusIcon}</span>
        ${hasMods ? `<span class="lh-tracker-mods">${ts.mods.map(m => `<span class="lh-tracker-mod" style="color:${m.color}">${m.icon}</span>`).join('')}</span>` : ''}
      </div>`;
    });
    html += `</div>`;

    huntEvents.forEach((evt, hi) => {
      const timelineIdx = timeline.indexOf(evt);
      const revealed = isEventRevealed(timelineIdx);

      if (!revealed) {
        html += `<div style="padding:6px;margin-bottom:3px;border:1px dashed rgba(139,109,71,0.2);border-radius:3px;opacity:0.3;font-size:9px;text-align:center;color:#8b6d47">· · ·</div>`;
        return;
      }

      const players = evt.players || [];
      const tierColor = evt.tier ? TIER_COLORS[evt.tier] : null;
      const t = evt.type;

      // ── Type-specific card styles ──
      let cardBorder, cardBg, cardIcon, cardAccent, cardLabel;

      if (t === 'lhArrive') {
        // Arrival — muted, atmospheric
        cardBorder = `${tierColor || '#484f58'}44`;
        cardBg = 'rgba(0,0,0,0.2)';
        cardIcon = '📍'; cardAccent = tierColor || '#484f58'; cardLabel = '';
      } else if (t === 'lhSuccess') {
        // Key found — triumphant green glow
        cardBorder = 'rgba(63,185,80,0.4)';
        cardBg = 'linear-gradient(135deg, rgba(63,185,80,0.12) 0%, rgba(63,185,80,0.03) 100%)';
        cardIcon = '🗝️'; cardAccent = '#3fb950'; cardLabel = 'KEY FOUND';
      } else if (t === 'lhFail') {
        // Failed attempt — muted red
        cardBorder = 'rgba(248,81,73,0.25)';
        cardBg = 'rgba(248,81,73,0.04)';
        cardIcon = '✗'; cardAccent = '#f85149'; cardLabel = 'FAILED';
      } else if (t === 'luckyHuntSabotage') {
        // Sabotage — sinister dark purple
        cardBorder = 'rgba(139,92,246,0.35)';
        cardBg = 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(0,0,0,0.3) 100%)';
        cardIcon = '🗡️'; cardAccent = '#8b5cf6'; cardLabel = 'SABOTAGE';
      } else if (t === 'luckyHuntSaboteur') {
        // Caught saboteur — exposed red
        cardBorder = 'rgba(248,81,73,0.4)';
        cardBg = 'rgba(248,81,73,0.08)';
        cardIcon = '👁️'; cardAccent = '#f85149'; cardLabel = 'CAUGHT';
      } else if (t === 'luckyHuntHelped') {
        // Help — warm green
        cardBorder = 'rgba(63,185,80,0.35)';
        cardBg = 'linear-gradient(135deg, rgba(63,185,80,0.08) 0%, rgba(0,0,0,0.15) 100%)';
        cardIcon = '🤝'; cardAccent = '#3fb950'; cardLabel = 'HELPED';
      } else if (t === 'luckyHuntStolen' || t === 'luckyHuntStealFail') {
        // Steal — bold gold/red, dramatic
        const success = t === 'luckyHuntStolen';
        cardBorder = success ? 'rgba(240,165,0,0.5)' : 'rgba(248,81,73,0.3)';
        cardBg = success ? 'linear-gradient(135deg, rgba(240,165,0,0.12) 0%, rgba(248,81,73,0.06) 100%)' : 'rgba(248,81,73,0.06)';
        cardIcon = success ? '💰' : '🚫'; cardAccent = success ? '#f0a500' : '#f85149';
        cardLabel = success ? 'KEY STOLEN' : 'STEAL FAILED';
      } else if (t === 'luckyHuntDiscovery') {
        // Discovery — mysterious blue
        cardBorder = 'rgba(88,166,255,0.35)';
        cardBg = 'linear-gradient(135deg, rgba(88,166,255,0.08) 0%, rgba(0,0,0,0.2) 100%)';
        cardIcon = '🔍'; cardAccent = '#58a6ff'; cardLabel = 'DISCOVERY';
      } else if (t === 'luckyHuntIntelTrade') {
        // Intel trade — conspiratorial muted blue
        cardBorder = 'rgba(88,166,255,0.2)';
        cardBg = 'rgba(88,166,255,0.04)';
        cardIcon = '🤫'; cardAccent = '#58a6ff'; cardLabel = 'INTEL TRADE';
      } else if (t === 'luckyHuntPanic') {
        // Panic — shaky red muted
        cardBorder = 'rgba(248,81,73,0.3)';
        cardBg = 'rgba(248,81,73,0.06)';
        cardIcon = '😰'; cardAccent = '#f85149'; cardLabel = 'FROZE';
      } else if (t === 'luckyHuntShowoff') {
        // Showoff — golden sparkle
        cardBorder = 'rgba(227,179,65,0.5)';
        cardBg = 'linear-gradient(135deg, rgba(227,179,65,0.12) 0%, rgba(227,179,65,0.03) 100%)';
        cardIcon = '✨'; cardAccent = '#e3b341'; cardLabel = 'SHOWOFF';
      } else if (t === 'luckyHuntAmbush') {
        // Ambush — sharp red, physical menace
        cardBorder = 'rgba(248,81,73,0.4)';
        cardBg = 'linear-gradient(135deg, rgba(248,81,73,0.1) 0%, rgba(0,0,0,0.25) 100%)';
        cardIcon = '⚡'; cardAccent = '#f85149'; cardLabel = 'AMBUSHED';
      } else if (t === 'luckyHuntRivalry') {
        // Rivalry — cold neutral gray, understated tension
        cardBorder = 'rgba(139,148,158,0.3)';
        cardBg = 'rgba(139,148,158,0.05)';
        cardIcon = '😶'; cardAccent = '#8b949e'; cardLabel = 'TENSION';
      } else if (t === 'lhSocialScheme') {
        // Social scheme — dark red drama
        cardBorder = 'rgba(218,54,51,0.4)';
        cardBg = 'linear-gradient(135deg, rgba(218,54,51,0.1) 0%, rgba(0,0,0,0.3) 100%)';
        cardIcon = '🎭'; cardAccent = '#da3633'; cardLabel = evt.badgeText || 'SCHEME';
      } else if (t === 'lhLastChance') {
        // Last chance — urgent amber
        cardBorder = 'rgba(240,165,0,0.35)';
        cardBg = 'rgba(240,165,0,0.06)';
        cardIcon = '⏰'; cardAccent = '#f0a500'; cardLabel = 'LAST CHANCE';
      } else if (t === 'luckyHuntDud') {
        // Dud key — disappointment gray-red
        cardBorder = 'rgba(248,81,73,0.3)';
        cardBg = 'rgba(139,148,158,0.06)';
        cardIcon = '💀'; cardAccent = '#f85149'; cardLabel = 'DUD KEY';
      } else if (t === 'lhChestReveal') {
        // Chest reveal — gold excitement
        const isImmunity = evt.text?.includes('immunity') || evt.text?.includes('Immunity') || evt.text?.includes('necklace');
        const isTrap = evt.chestType === 'boobyTrap' || evt.badgeText?.includes('TRAP') || evt.badgeText?.includes('BOOBY') || evt.text?.includes('Cannon') || evt.text?.includes('Bomb') || evt.text?.includes('Skunk Spray') || evt.text?.includes('Boxing Glove') || evt.text?.includes('Smoke Bomb');
        cardBorder = isImmunity ? 'rgba(227,179,65,0.6)' : isTrap ? 'rgba(248,81,73,0.4)' : 'rgba(212,168,83,0.3)';
        cardBg = isImmunity ? 'linear-gradient(135deg, rgba(227,179,65,0.15) 0%, rgba(227,179,65,0.04) 100%)'
          : isTrap ? 'rgba(248,81,73,0.08)' : 'rgba(212,168,83,0.06)';
        cardIcon = isImmunity ? '👑' : isTrap ? '💥' : '📦'; cardAccent = isImmunity ? '#e3b341' : isTrap ? '#f85149' : '#d4a853';
        cardLabel = isImmunity ? 'IMMUNITY' : isTrap ? 'BOOBY TRAP' : 'CHEST';
      } else if (t === 'lhImmunity') {
        // Final immunity declaration — big gold
        cardBorder = 'rgba(227,179,65,0.6)';
        cardBg = 'linear-gradient(135deg, rgba(227,179,65,0.15) 0%, rgba(227,179,65,0.04) 100%)';
        cardIcon = '🏆'; cardAccent = '#e3b341'; cardLabel = 'IMMUNITY WINNER';
      } else if (t === 'lhHostCommentary') {
        // Host commentary — subtle
        cardBorder = 'rgba(255,255,255,0.06)';
        cardBg = 'rgba(0,0,0,0.15)';
        cardIcon = '🎙️'; cardAccent = '#6e7681'; cardLabel = '';
      } else {
        // Default
        cardBorder = 'rgba(255,255,255,0.08)';
        cardBg = 'rgba(0,0,0,0.2)';
        cardIcon = ''; cardAccent = '#8b949e'; cardLabel = evt.badgeText || '';
      }

      // ── Render with themed classes ──

      // TRAIL EVENTS (arrivals, attempts, fails) — compact, inline with the quest line
      if (t === 'lhArrive' || t === 'lhFail') {
        const tierBadge = evt.tier ? `<span style="font-size:7px;font-weight:800;letter-spacing:1px;color:#fff;background:${tierColor || '#484f58'};padding:1px 5px;border-radius:3px;text-transform:uppercase;margin-left:6px">${evt.tier}</span>` : '';
        html += `<div class="lh-trail" style="--pin-color:${tierColor || '#5a3d25'}">
          <div style="display:flex;align-items:center;gap:6px">
            ${players[0] ? rpPortrait(players[0], 'sm') : ''}
            <div>
              <div class="lh-trail-name">${players[0] || ''}</div>
              <div class="lh-trail-loc">${t === 'lhArrive' ? '📍 ' : '✗ '}${evt.locationName || ''}${tierBadge}</div>
            </div>
          </div>
          <div class="lh-trail-text">${evt.text}</div>
        </div>`;

      // KEY FOUND — triumphant with glow
      } else if (t === 'lhSuccess') {
        const tierBadge = evt.tier ? `<span style="font-size:7px;font-weight:800;letter-spacing:1px;color:#fff;background:${tierColor || '#3fb950'};padding:1px 5px;border-radius:3px;text-transform:uppercase;margin-left:4px">${evt.tier}</span>` : '';
        html += `<div class="lh-keyfound">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            ${players[0] ? rpPortrait(players[0], 'pb-sm') : ''}
            <div>
              <div style="font-size:13px;font-weight:800;color:#3fb950">${players[0] || ''}</div>
              <div style="font-size:9px;color:#86efac;letter-spacing:1px">🗝️ KEY FOUND — ${evt.locationName || ''}${tierBadge}</div>
            </div>
          </div>
          <div style="font-size:13px;color:#bbf7d0;line-height:1.6">${evt.text}</div>
        </div>`;

      // HOST COMMENTARY — subtle whisper
      } else if (t === 'lhHostCommentary') {
        html += `<div class="lh-host">${evt.text}</div>`;

      // DUD KEY — disappointment
      } else if (t === 'luckyHuntDud') {
        html += `<div class="lh-dud">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            ${players[0] ? rpPortrait(players[0], 'sm') : ''}
            <span style="font-size:9px;font-weight:800;letter-spacing:2px;color:#f85149;background:rgba(248,81,73,0.15);padding:2px 8px;border-radius:3px">💀 DUD KEY</span>
          </div>
          <div class="lh-dud-text">${evt.text}</div>
        </div>`;

      // LAST CHANCE — urgent
      } else if (t === 'lhLastChance') {
        html += `<div class="lh-lastchance">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            ${players[0] ? rpPortrait(players[0], 'sm') : ''}
            <span style="font-size:9px;font-weight:800;letter-spacing:2px;color:#f0a500">⏰ LAST CHANCE</span>
            <span style="font-size:9px;color:#8b6d47">${evt.locationName || ''}</span>
          </div>
          <div style="font-size:12px;color:#fde68a;line-height:1.5">${evt.text}</div>
        </div>`;

      // CHEST REVEAL — dramatic chest opening
      } else if (t === 'lhChestReveal') {
        const isImmunity = evt.text?.includes('immunity') || evt.text?.includes('Immunity') || evt.text?.includes('necklace');
        const isTrap = evt.chestType === 'boobyTrap' || evt.badgeText?.includes('TRAP') || evt.badgeText?.includes('BOOBY') || evt.text?.includes('Cannon') || evt.text?.includes('Bomb') || evt.text?.includes('Skunk Spray') || evt.text?.includes('Boxing Glove') || evt.text?.includes('Smoke Bomb');
        const chestClass = isImmunity ? 'immunity' : isTrap ? 'trap' : '';
        html += `<div class="lh-chest-reveal ${chestClass}">
          ${players[0] ? rpPortrait(players[0], 'pb-sm') : ''}
          <div style="font-size:13px;font-weight:700;color:#e8d5b0;margin-top:6px">${players[0] || ''}</div>
          <div style="font-size:22px;margin:6px 0">${isImmunity ? '👑' : isTrap ? '💥' : '📦'}</div>
          <div class="lh-chest-item">${evt.text}</div>
        </div>`;

      // IMMUNITY FINAL — golden seal ceremony
      } else if (t === 'lhImmunity') {
        html += `<div class="lh-immunity-final">
          <div class="lh-seal">👑</div>
          ${players[0] ? rpPortrait(players[0], 'lg') : ''}
          <div style="font-size:20px;font-weight:800;color:#d4a853;margin-top:8px">${players[0] || ''}</div>
          <div style="font-size:10px;color:#8b6d47;letter-spacing:3px;margin-top:4px">SAFE TONIGHT</div>
          <div style="font-size:12px;color:#c4a87a;margin-top:8px;font-style:italic">${evt.text}</div>
        </div>`;

      // INTERRUPTION CARDS — hunt events that break the flow (the "mini-games")
      } else {
        // Pick interrupt subclass
        const isSabotage = t === 'luckyHuntSabotage' || t === 'luckyHuntSaboteur';
        const isSteal = t === 'luckyHuntStolen' || t === 'luckyHuntStealFail';
        const isHelp = t === 'luckyHuntHelped';
        const isDiscovery = t === 'luckyHuntDiscovery';
        const isIntel = t === 'luckyHuntIntelTrade';
        const isPanic = t === 'luckyHuntPanic';
        const isScheme = t === 'lhSocialScheme';
        const isShowoff = t === 'luckyHuntShowoff';
        const isAmbush = t === 'luckyHuntAmbush';
        const isRivalry = t === 'luckyHuntRivalry';
        const isAlliance = t === 'luckyHuntAlliance';
        const isEncouragement = t === 'luckyHuntEncouragement';
        const isGuard = t === 'luckyHuntGuard';
        const isBonding = t === 'luckyHuntBonding';
        const isTaunt = t === 'luckyHuntTaunt';

        const interruptClass = isSabotage ? 'sabotage' : isSteal ? 'steal' : isHelp ? 'help'
          : isDiscovery ? 'discovery' : isIntel ? 'intel' : isPanic ? 'panic'
          : isScheme ? 'scheme' : isShowoff ? 'showoff' : isAmbush ? 'sabotage'
          : isTaunt ? 'sabotage' : isRivalry ? 'intel' : isAlliance ? 'help'
          : isEncouragement ? 'help' : isGuard ? 'help' : isBonding ? 'help' : '';

        const interruptIcon = isSabotage ? '🗡️' : isSteal ? (t === 'luckyHuntStolen' ? '💰' : '🚫')
          : isHelp ? '🤝' : isDiscovery ? '🔍' : isIntel ? '🤫' : isPanic ? '😰'
          : isScheme ? '🎭' : isShowoff ? '✨' : isAmbush ? '⚡' : isTaunt ? '🫵'
          : isRivalry ? '😶' : isAlliance ? '🤜🤛'
          : isEncouragement ? '💪' : isGuard ? '🛡️' : isBonding ? '💚' : '⚡';

        const interruptLabel = isSabotage ? (t === 'luckyHuntSaboteur' ? 'CAUGHT' : 'SABOTAGE')
          : isSteal ? (t === 'luckyHuntStolen' ? 'KEY STOLEN' : 'STEAL FAILED')
          : isHelp ? 'HELPED' : isDiscovery ? 'DISCOVERY' : isIntel ? (evt.badgeText || 'INTEL TRADE')
          : isPanic ? 'FROZE' : isScheme ? (evt.badgeText || 'SCHEME') : isShowoff ? 'SHOWOFF'
          : isAmbush ? 'AMBUSHED' : isTaunt ? 'TAUNTED' : isRivalry ? 'TENSION'
          : isAlliance ? (evt.badgeText || 'ALLIANCE')
          : isEncouragement ? 'ENCOURAGED' : isGuard ? 'STANDING GUARD' : isBonding ? 'MOMENT'
          : (evt.badgeText || 'EVENT');

        html += `<div class="lh-interrupt ${interruptClass}">
          <div class="lh-interrupt-portraits">
            ${players.slice(0, 3).map(p => rpPortrait(p, 'pb-sm')).join('')}
          </div>
          <div class="lh-interrupt-label">${interruptIcon} ${interruptLabel}</div>
          <div class="lh-interrupt-text">${evt.text}</div>
        </div>`;
      }
    });

    html += `</div>`;
  }

  html += `</div>`;

  // Sticky controls — advance to next revealable event
  const allDone = revealedCount >= totalReveals;
  if (!allDone) {
    const nextTargetIdx = nextRevealTimelineIdx != null ? nextRevealTimelineIdx : timeline.length - 1;
    // Phase label: are we still in clue draws or the hunt?
    const phaseLabel = revealedCount < clueDrawCount ? 'DRAW CLUE' : 'NEXT';
    html += `<div style="position:sticky;bottom:0;padding:14px 0;text-align:center;background:linear-gradient(transparent,rgba(13,17,23,0.95) 25%);z-index:5">
      <button class="rp-btn" onclick="${_lhReveal(nextTargetIdx)}" style="background:rgba(212,168,83,0.15);border-color:#d4a853;color:#d4a853">${phaseLabel} (${revealedCount + 1}/${totalReveals})</button>
      <button class="rp-btn" style="margin-left:8px;opacity:0.5" onclick="${_lhReveal(timeline.length - 1)}">REVEAL ALL</button>
    </div>`;
  }

  // Chest summary (only after all revealed)
  if (allRevealed) {
    const chestAssign = lh.chestAssignments || {};
    if (Object.keys(chestAssign).length) {
      html += `<hr class="lh-rope">
      <div class="lh-section-title">TREASURE CHESTS</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:16px">`;
      Object.entries(chestAssign).forEach(([name, chest]) => {
        const isImmune = chest.type === 'immunity';
        const isTrap = chest.type === 'boobyTrap';
        const borderCol = isImmune ? '#d4a853' : isTrap ? '#f85149' : '#30363d';
        const icon = isImmune ? '👑' : isTrap ? '💥' : chest.type === 'advantage' ? '⚔️' : '📦';
        const glow = isImmune ? 'box-shadow:0 0 12px rgba(212,168,83,0.2)' : isTrap ? 'box-shadow:0 0 8px rgba(248,81,73,0.15)' : '';
        html += `<div style="width:100px;padding:10px;background:rgba(22,27,34,0.8);border:2px solid ${borderCol};border-radius:8px;text-align:center;${glow}">
          ${rpPortrait(name, 'sm')}
          <div style="font-size:10px;font-weight:700;color:#c9d1d9;margin-top:4px">${name}</div>
          <div style="font-size:18px;margin:4px 0">${icon}</div>
          <div style="font-size:9px;color:${isImmune ? '#d4a853' : isTrap ? '#f85149' : '#8b949e'}">${chest.label || ''}</div>
        </div>`;
      });
      html += `</div>`;
    }
  }

  // Immunity winner callout (only after all revealed)
  if (allRevealed && lh.immunityWinner) {
    html += `<div class="lh-immunity-final">
      <div class="lh-seal gold">👑</div>
      ${rpPortrait(lh.immunityWinner, 'lg')}
      <div style="font-size:18px;font-weight:800;color:#d4a853;margin-top:8px">${lh.immunityWinner}</div>
      <div style="font-size:11px;color:#8b6d47;letter-spacing:2px;margin-top:4px">SAFE TONIGHT</div>
    </div>`;
  }

  html += `</div>`;
  return html;
}

