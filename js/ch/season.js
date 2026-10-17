// ══════════════════════════════════════════════════════════════════════
// ch/season.js — play a whole season of The Challenge, headless
// ══════════════════════════════════════════════════════════════════════
//
// Spec docs/superpowers/specs/2026-10-14-the-challenge-design.md. Plays in its
// own `gs` (manual §8.3): bonds start empty and the franchise's history comes
// in through `carried` (js/franchise-carry.js carriedFor, read by the run
// layer) — sums onto the bonds, couples and exes onto the relationships,
// grudges onto the revenge list.
//
// One episode is three days:
//   Day 1  house life; the daily challenge; the night out (most episodes)
//   Day 2  house life; deliberation; the open vote; the call-out
//   Day 3  the Arena; the winner's return to the house; the night's fallout
// Quits, medicals and disqualifications can come on any day; the Arena takes
// what is still needed (schedule.js elimsFor).
//
// Every random draw comes from a named stream (dr/rng.js streamFor), so one
// episode's change moves that episode and nothing before it.
import { setGs, gs } from '../core.js';
import { newLedger } from '../script/pick.js';
import { addBond, getBond } from '../bonds.js';
import { romanticCompat } from '../players.js';
import { streamFor } from '../dr/rng.js';
import { newState, blankRecord, addScene, inDivision, noise, S, kinOf } from './state.js';
import { DEFAULT_OPTIONS, formatOf } from './format.js';
import { buildSchedule, elimsFor, divisionFor } from './schedule.js';
import { initMind, driftDay, nudge } from './mind.js';
import { giveRespect, threatRead } from './respect.js';
import { afterVote } from './alliances.js';
import { deliberate, houseVote, voteFallout, breakDeal, houseDebate, tribunalDecide } from './vote.js';
import { chooseOpponent, dealBetween } from './callout.js';
import { playDaily } from './dailies.js';
import { playDuel, injuryRoll, drawGame } from './arena.js';
import { partyNight, expelledGoodbye, expelledAftermath, dqDebate } from './party.js';
import { romanceDay, breakupCheck } from './romance.js';
import { quitRisk, quit, medical, disqualify, removePlayer } from './exits.js';
import { houseDay, psycheMoment, returnToHouse } from './house.js';
import { houseBeats } from './events.js';
import { arenaEve, pickDay, calloutCost, tjLaysDownTheLaw, tjVerdict } from './tj.js';
import { playFinal } from './final.js';
import { reviseAll } from './plans.js';
import { spreadDay, syncActive } from './knowledge.js';
import { morningAfter } from './fallout.js';
import { calledOut, arenaWon, remember } from './rel.js';
import { payDaily, arenaPurse, hurt, medicalRisk, healDay, powerRankings, earnPass, passCut, PURSE } from './stakes.js';
import { purge, returnArena, lateArrival } from './ep-twists.js';
import { arenaGoodbye } from './goodbye.js';
import { wavering, hasWavered, quitMoment } from './quit.js';
import { medevac, medicalScare } from './medevac.js';
import { wishlist } from './wishlist.js';
import { worstSting } from './daily/named.js';
import { mockAfterDaily, gloatAfterVote } from './cruel.js';
import { pairsOn, makeSeasonPairs, unitsLeft, partnerSwap } from './pairs.js';
import { pairVoteNight, pairArenaDay } from './pair-week.js';
import { redemptionOn, houseTakes, sendToRedemption, redemptionWatch, redemptionNight, returnFromRedemption, closeForFinal } from './redemption.js';

// The Tribunal: the daily's winners, or the three who did best on a winning team.
function tribunalOf(state, daily, immune) {
  const sc = daily?.scores || {};
  return [...immune].sort((a, b) => (sc[b] || 0) - (sc[a] || 0)).slice(0, state.fmt.tribunal || 3);
}

function pop(name, d) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + d;
}

// The quit risk only counts once somebody has shown the signs (quit.js), so it is scaled up to keep the
// season's rate (30 seasons: 0.53 quits a season before the gate; 0.47 after, plus about one in seven talked
// out of it by a friend).
const QUIT_CARRY = 4;
// A medevac on the day of the injury, and later from one the medic cleared (per check, three a episode). Kept to
// the season's rate before the split (30 seasons: 11 medevacs).
const MED_NOW = 0.6, MED_LATER = 0.12;
// A day's quits and medicals. At most one quit a day. floor: the house this can not go below (after the last
// regular Arena, the finalists: a quit there came after the schedule had counted to the final, and the final
// started with seven, seed 23, 2026-10-16); a quit or a medevac that would cross it does not happen that day.
function dayExits(state, rng, injured = [], floor = 0) {
  const out = [];
  const room = () => state.active.length > floor;
  // a knock is played through; a sprain sometimes, a tear often, ends it (stakes.js)
  // (medevac.js: the exam, TJ, the goodbye; a bad injury the medic clears is a scare the viewer sees, and it can
  // still end things on a later day, so a medevac often grows out of an injury that has been on screen)
  for (const n of injured) {
    if (!state.active.includes(n)) continue;
    if (rng() < medicalRisk(state.injury[n]) * MED_NOW && room()) { medevac(state, n); out.push({ name: n, how: 'medical' }); }
    else if (state.injury[n]?.sev >= 2) medicalScare(state, n);
  }
  for (const n of [...state.active]) {
    const inj = state.injury?.[n];
    if (!inj?.scared || inj.scared === state.ep || inj.heal <= state.ep) continue;
    if (rng() < medicalRisk(inj) * MED_LATER && room()) { medevac(state, n); out.push({ name: n, how: 'medical' }); }
  }
  // a quit comes after signs the viewer saw on an earlier day (quit.js), and the risk carries the days it waited
  for (const n of [...state.active]) {
    if (!hasWavered(state, n) || !room()) continue;
    if (rng() < quitRisk(state, n) * QUIT_CARRY) {
      if (quitMoment(state, rng, n) === 'stays') break;
      quit(state, n); pop(n, -2); out.push({ name: n, how: 'quit' }); break;
    }
  }
  if (!out.some(x => x.how === 'quit')) wavering(state, rng);
  return out;
}

// The house as it stands, for the viewer's Intel drawer (the user, 2026-10-15: "intel doesn't show anything
// like it does in Big Brother and Total Drama"): the bonds between everybody still in, the alliances, the
// deals, the couples, and each player's record. Taken as an episode starts and as it ends, so the drawer
// never shows a screen something it hasn't reached.
function intelSnap(state) {
  const act = [...state.active];
  const bonds = {};
  for (const a of act) for (const b of act) if (a < b) { const v = Math.round(getBond(a, b) * 10) / 10; if (v) bonds[`${a}||${b}`] = v; }
  const R = n => state.rec[n] || {};
  return {
    players: act, bonds,
    alliances: state.alliances.filter(x => !x.ended).map(x => ({ name: x.name, leader: x.leader, members: x.members.filter(n => act.includes(n)) })).filter(x => x.members.length >= 2),
    gone: state.alliances.filter(x => x.ended).map(x => x.name).slice(-4),
    deals: state.deals.filter(d => !d.broken && act.includes(d.a) && act.includes(d.b)).map(d => ({ a: d.a, b: d.b, tier: d.tier || 'protect' })),
    broken: state.deals.filter(d => d.broken).slice(-4).map(d => ({ a: d.a, b: d.b })),
    couples: state.couples.filter(c => !c.ended && act.includes(c.a) && act.includes(c.b)).map(c => [c.a, c.b]),
    rec: Object.fromEntries(act.map(n => [n, { daily: R(n).dailyWins || 0, arenaW: R(n).arenaW || 0, arenaL: R(n).arenaL || 0, votedIn: R(n).votedIn || 0, calledOut: R(n).calledOut || 0, votes: R(n).votesReceived || 0,
      // the stakes (stakes.js): money, skulls, an injury that has not healed
      bank: state.bank?.[n] || 0, skulls: state.skulls?.[n] || 0, hurt: state.injury?.[n] && state.injury[n].heal > state.ep ? `${state.injury[n].part} ${state.injury[n].sev}` : null }])),
    redemption: state.redemption ? state.redemption.residents.map(r => r.name) : null,
    // for the Debug screen: how each of them feels, what they need, what they are trying to do, and their word
    mind: Object.fromEntries(act.map(n => [n, Object.fromEntries(Object.entries(state.mind[n] || {}).map(([k, v]) => [k, Math.round(v * 10) / 10]))])),
    psyche: Object.fromEntries(act.map(n => [n, state.psyche[n] || null])),
    plans: Object.fromEntries(act.map(n => { const p = state.plans?.[n]; return [n, p ? { style: p.style, core: [...p.core], targets: p.targets.map(t => [t, p.origins?.[t] || '']),
      shield: p.shield, revenge: [...p.revenge], finalWith: [...p.finalWith] } : null]; })),
    word: Object.fromEntries(act.filter(n => state.word?.[n]).map(n => [n, state.word[n]])),
  };
}

// A Redemption House season has its own way back: a booked return is not played (ep-twists.js). A Pairs season
// has no late arrival (a pair cannot walk in half), and a Partner Swap is only for a Pairs season.
export const liveTwists = opts => Object.fromEntries(Object.entries(opts?.episodeTwists || {}).filter(([, k]) => !(k === 'return' && opts.redemption)
  && !(opts?.pairs && (k === 'late' || k === 'return')) && !(!opts?.pairs && k === 'swap')));

// A Pairs season counts pairs: the final is so many PAIRS (two a division when the pairs are men's and women's),
// and `finalists` becomes the people in them, for everything that reads it as people.
export function pairsFinal(opts) {
  if (!opts?.pairs) return null;
  const same = opts.gendered && opts.pairs.shape === 'same';
  const n = Number(opts.pairs.finalPairs) || (same ? 4 : 3);
  return same ? Math.max(2, n + (n % 2)) : Math.max(2, n);
}

export function playChallengeSeason({ cast, background = {}, divisions = {}, options = {}, seed = 1, carried = null, heard = null }) {
  setGs({ bonds: {}, perceivedBonds: {}, relationshipDimensions: {}, activePlayers: [...cast],
    episodeHistory: [], popularity: {}, episode: 0 });
  const opts = { ...DEFAULT_OPTIONS, ...options };
  // a Pairs season: no Redemption House (spec §2), finalists counted in pairs
  const finalPairs = pairsFinal(opts);
  if (finalPairs) { opts.redemption = false; opts.finalists = finalPairs * 2; }
  const state = newState(seed, opts);
  // The lines the last seasons aired (ch-run.js heardBefore): the picker holds them back while unheard ones fit.
  if (heard && Object.keys(heard).length) state.lineLedger = { ...newLedger(), past: { ...heard } };
  state.fmt = formatOf(opts);
  state.cast = [...cast];
  state.active = [...cast];
  state.cliqueStrength = 1;

  // Divisions: the player's gender; a non-binary player's pick (spec §2), or
  // the smaller side when nobody picked.
  for (const n of cast) {
    const g = (divisions[n] || background[n]?.gender || 'm');
    state.division[n] = opts.gendered ? g : 'all';
  }
  if (opts.gendered) {
    for (const n of cast.filter(x => !['m', 'f'].includes(state.division[x]))) {
      const m = cast.filter(x => state.division[x] === 'm').length, f = cast.filter(x => state.division[x] === 'f').length;
      state.division[n] = m <= f ? 'm' : 'f';
    }
  }
  // Late arrivals (ep-twists.js 'late'): one player a division held back from the start, walking in on the
  // booked episode. They are cast (records, minds, bonds) but not in the house until then.
  const lateEp = Number(Object.entries(liveTwists(opts)).find(([, k]) => k === 'late')?.[0]) || 0;
  state.late = [];
  if (lateEp >= 2) {
    const rl = streamFor(seed, 'late');
    for (const d of opts.gendered ? ['m', 'f'] : ['all']) {
      const pool = cast.filter(n => d === 'all' || state.division[n] === d);
      if (pool.length >= 6) state.late.push(pool[Math.floor(rl() * pool.length)]);
    }
    state.arrivedAt = Object.fromEntries(state.late.map(n => [n, lateEp]));
    state.active = cast.filter(n => !state.late.includes(n));
  }
  for (const n of cast) {
    const bg = background[n] || {};
    state.rookie[n] = !!bg.rookie;
    state.origin[n] = bg.origin || null;
    state.rep[n] = bg.rep || {};
    state.rec[n] = blankRecord();
    state.bank[n] = 0;
    state.tj[n] = 0;
    initMind(state, n);
  }

  // The franchise walks in with them.
  const r0 = streamFor(seed, 'arrival');
  for (const s of carried?.sums || []) if (cast.includes(s.a) && cast.includes(s.b)) addBond(s.a, s.b, s.delta);
  for (const b of carried?.bonds || []) {
    if (!cast.includes(b.a) || !cast.includes(b.b) || !b.resent) continue;
    // The one it is about carries the grudge (franchise-carry: `resent`).
    remember(b.b, b.a, 'old-grudge', Math.min(2.5, Math.abs(b.delta) * 0.5), { why: b.why });
    (state.carriedGrudge ||= {})[`${b.b}>${b.a}`] = Math.min(3, Math.abs(b.delta) * 0.6);
  }
  state.kin = (carried?.kin || []).filter(k => cast.includes(k.a) && cast.includes(k.b));
  // Walking in spoken for: a partner at home, who is not in the cast (romance.js homeFactor, events.js home-*).
  for (const s of carried?.atHome || []) if (cast.includes(s.name) && s.whom) state.atHome[s.name] = { name: s.whom, stage: s.stage };
  for (const k of carried?.kin || []) {
    if (!cast.includes(k.a) || !cast.includes(k.b)) continue;
    if ((k.kin === 'dating' || k.kin === 'married' || k.kin === 'engaged') && romanticCompat(k.a, k.b)) {
      state.couples.push({ a: k.a, b: k.b, since: 0, ended: false, preShow: true });
    }
  }
  // First impressions, and the old show's pull.
  for (let i = 0; i < cast.length; i++) for (let j = i + 1; j < cast.length; j++) {
    const a = cast[i], b = cast[j];
    const same = state.origin[a] && state.origin[a] === state.origin[b];
    addBond(a, b, noise(r0) * 0.35 + (same ? 1 : 0));
  }
  const recog = [];
  for (let i = 0; i < cast.length; i++) for (let j = i + 1; j < cast.length; j++) {
    const a = cast[i], b = cast[j];
    if (state.origin[a] && state.origin[a] === state.origin[b]) recog.push([a, b]);
  }
  state.day = 1;
  state.plans = {};
  syncActive(state);
  // The arrival airs in episode 1 (it used to be filed before any episode began, so it never aired):
  // the reunions at the airstrip, the sharpest old grudge first, then the closest old friends.
  const reunions = [...recog].sort((x, y) => Math.abs(getBond(y[0], y[1])) - Math.abs(getBond(x[0], x[1]))
    + ((state.carriedGrudge?.[`${y[0]}>${y[1]}`] || state.carriedGrudge?.[`${y[1]}>${y[0]}`]) ? 2 : 0)
    - ((state.carriedGrudge?.[`${x[0]}>${x[1]}`] || state.carriedGrudge?.[`${x[1]}>${x[0]}`]) ? 2 : 0));
  const usedArrival = new Set();
  state.arrivalPairs = [];
  // First, the people who walk in already something to each other, whatever show they came from (franchise-carry
  // kin): a couple arriving together, then old friends. Exes have their own scene (events.js ex-in-the-house).
  const kinPairs = (state.kin || []).filter(k => k.a !== k.b && cast.includes(k.a) && cast.includes(k.b))
    .map(k => ({ pair: [k.a, k.b], kin: kinOf(state, k.a, k.b) })).filter(k => k.kin === 'couple' || k.kin === 'old-friends')
    .sort((x, y) => (x.kin === 'couple' ? 0 : 1) - (y.kin === 'couple' ? 0 : 1));
  state.arrivalKin = {};
  const notLate = ([x, y]) => !state.late.includes(x) && !state.late.includes(y);
  for (const { pair: [a, b], kin } of kinPairs.filter(k => notLate(k.pair))) {
    if (state.arrivalPairs.length >= 2) break;
    if (usedArrival.has(a) || usedArrival.has(b)) continue;
    usedArrival.add(a); usedArrival.add(b);
    state.arrivalPairs.push([a, b]);
    state.arrivalKin[`${a}|${b}`] = kin;
  }
  for (const [a, b] of reunions.filter(notLate)) {
    if (state.arrivalPairs.length >= 3 + Object.keys(state.arrivalKin).length) break;
    if (usedArrival.has(a) || usedArrival.has(b)) continue;
    usedArrival.add(a); usedArrival.add(b);
    state.arrivalPairs.push([a, b]);
  }

  if (redemptionOn(state)) state.redemption = { open: true, residents: [], out: [], returned: [], pending: null };
  // the units the season counts down: players, or in a Pairs season pairs
  const FINAL_UNITS = finalPairs || opts.finalists;
  const schedule = buildSchedule({ pairs: !!finalPairs, total: finalPairs ? Math.floor(cast.length / 2) : cast.length, finalists: FINAL_UNITS, daysPerEpisode: opts.daysPerEpisode, gendered: opts.gendered, twists: liveTwists(opts) });
  state.schedule = schedule;
  state.plannedEpisodes = schedule.filter(e => !e.final).length;
  let prevDiv = streamFor(seed, 'coin')() < 0.5 ? 'm' : 'f';
  // the players a return still to come will bring back: the plan already counts them (schedule.js)
  const returnsAhead = idx => (redemptionOn(state) ? 0 : schedule.slice(idx + 1).filter(e => e.returns).length)
    + state.late.filter(n => !state.active.includes(n) && !state.gone.some(g => g.name === n)).length;   // still to walk in

  for (let idx = 0; idx < schedule.length; idx++) {
    const plan = schedule[idx];
    if (plan.final || unitsLeft(state) <= FINAL_UNITS) break;
    state.ep = plan.ep;
    gs.episode = plan.ep;
    // A re-run turns this episode's dice once more (ch-run.js rerunChallengeEpisode):
    // every stream the episode draws from is salted, every earlier one is untouched.
    const roll = Number(opts.rerolls?.[plan.ep]) || 0;
    const R = name => streamFor(seed, `ep${plan.ep}${roll ? `~${roll}` : ''}:${name}`);
    const epRec = { ep: plan.ep, division: null, exits: [], votedIn: [], arena: [], votes: [], callouts: [] };
    epRec.intel = { start: intelSnap(state) };
    state.episodes.push(epRec);
    // Who is close to whom as the week begins, for the stepped viewer's crowd: a friend cheers you on in the
    // daily and from the Arena's stand, a rival comments on your struggle. Read, never decided here.
    epRec.ties = Object.fromEntries(state.active.map(n => {
      const others = state.active.filter(x => x !== n).map(x => [x, getBond(n, x)]).sort((x, y) => y[1] - x[1]);
      const friends = others.filter(([, b]) => b >= 2).slice(0, 3).map(([x]) => x);
      const low = others[others.length - 1];
      return [n, { friends, rival: low && low[1] <= -2 ? low[0] : null }];
    }));

    // ── Day 1: house life, the daily, the night out ──
    // The premiere goes the modern show's way: off the plane, TJ, the first daily with the bags still in
    // hand, and only then the villa (the user, 2026-10-15: "challenge on arrival").
    state.day = plan.firstDay;
    for (const n of state.active) driftDay(state, n);
    // the morning: an injury that has healed, the one who fought back from Redemption House, TJ's rankings
    healDay(state);
    const back = returnFromRedemption(state);
    if (back) { epRec.returned = back; syncActive(state); }
    // tonight's one-episode twist, booked on the Season Timeline (ep-twists.js)
    const twist = liveTwists(opts)[plan.ep] || null;
    if (twist) epRec.twist = twist;
    if (twist === 'return' && !redemptionOn(state)) {
      const ret = returnArena(state, R('return'));
      if (ret) { epRec.returnArena = ret; syncActive(state); }
    }
    if (twist === 'late' && state.late.length) { lateArrival(state, R('late')); epRec.arrived = [...state.late]; syncActive(state); }
    let purged = null;
    epRec.rankings = powerRankings(state);
    const premiere = idx === 0;
    let division, daily;
    const runDaily = () => {
      division = divisionFor(state, prevDiv, FINAL_UNITS);
      prevDiv = division;
      epRec.division = division;
      // a Pairs season made by a draft (Fresh Meat, Pick your partner) plays the premiere daily alone: the combine
      const combine = premiere && pairsOn(state) && !state.pairs?.length;
      daily = playDaily(state, R('daily'), { division, pin: opts.dailyPins?.[plan.ep] || null, solo: combine });
      if (combine) {
        makeSeasonPairs(state, R('pairs'), { pins: opts.pairs.pins || {}, today: daily.scores, winners: daily.winners });
        // the combine's winners keep their safety, and so do their new partners
        daily.winners = [...new Set(daily.winners.flatMap(w => [w, state.partnerOf[w]].filter(Boolean)))];
        epRec.pairs = state.pairs.map(p => [p.a, p.b]);
      }
      epRec.daily = daily;
      payDaily(state, daily);
      // the ones hurt today: how bad, and who helped them off (stakes.js)
      const rh = R('hurt');
      for (const n of daily.injuries || []) if (state.active.includes(n)) hurt(state, rh, n, 'daily');
      epRec.exits.push(...dayExits(state, R('exits1'), daily.injuries));
      // the worst thing anybody was called today, said to a face afterwards (daily/named.js)
      const st = worstSting(state);
      if (st && state.active.includes(st.by) && state.active.includes(st.named)) {
        addScene(state, 'named-fallout', [st.named, st.by], { q: st.q, kind: st.kind, daily: daily.name || null }, state.active, 'villa');
      }
      // the mean ones: somebody mocks whoever choked or came last (cruel.js)
      mockAfterDaily(state, R('mock'), daily);
      // somebody at risk this week says who they would call out, and who they never would (wishlist.js)
      wishlist(state, R('wish'), { division, immune: daily.winners || [] });
      // the purge: the slowest goes home before anybody can vote, and that is this week's elimination
      if (twist === 'purge' && elimsFor(schedule, idx, unitsLeft(state) - FINAL_UNITS + returnsAhead(idx)) > 0) {
        purged = purge(state, daily, division);
        if (purged) { epRec.purged = purged; epRec.exits.push({ name: purged, how: 'purge' }); syncActive(state); }
      }
    };
    // a Pairs season's pairs, before anybody plays (Rivals, Exes): TJ names them at the airstrip
    if (premiere && pairsOn(state) && ['rivals', 'ties'].includes(opts.pairs.pairing || 'rivals')) {
      makeSeasonPairs(state, R('pairs'), { pins: opts.pairs.pins || {} });
      epRec.pairs = state.pairs.map(p => [p.a, p.b]);
    }
    // Partner Swap (the Format Designer): every pair redrawn by the season's own rule
    if (twist === 'swap' && pairsOn(state) && !premiere) { const sw = partnerSwap(state, R('swap')); if (sw) { epRec.swap = sw; epRec.pairs = sw.after; } }
    if (premiere) {
      for (const [a, b] of state.arrivalPairs || []) {
        const kin = state.arrivalKin?.[`${a}|${b}`] || null;
        // two people who were something to each other before: they find each other first, and the house sees it
        if (kin) addBond(a, b, kin === 'couple' ? 0.6 : 0.4);
        addScene(state, 'arrival', [a, b], { recognised: [[a, b]], ...(kin ? { kin } : {}) }, cast, 'airstrip');
      }
      runDaily();
      const looking = [...state.active].sort((x, y) => S(y, 'boldness') - S(x, 'boldness'));
      addScene(state, 'villa-reveal', looking.slice(0, 5), {}, state.active, 'villa');   // the first two, and three more behind them (x, y, z)
    }
    houseDay(state, R('house1'));
    romanceDay(state, R('romance1'));
    reviseAll(state);
    houseBeats(state, R('beats1'), { min: 1, max: 4 });
    spreadDay(state);
    if (!premiere) runDaily();
    if (opts.partyNights && R('party?')() < 0.75) {
      const party = partyNight(state, R('party'));
      epRec.party = { fights: party.fights };
      for (const d of party.dq) {
        if (!state.active.includes(d.name)) continue;
        // TJ's verdict, then their goodbye to the friends they leave, then the house's reckoning (party.js)
        // the house argues it out before TJ comes, and he hears from a witness (party.js dqDebate)
        const witness = dqDebate(state, R(`dq${d.name}`), d.name, d.victim);
        disqualify(state, d.name, d.victim, witness); pop(d.name, -3);
        const friends = expelledGoodbye(state, d.name, d.victim);
        epRec.exits.push({ name: d.name, how: 'disqualified', victim: d.victim });
        tjLaysDownTheLaw(state, d.name, d.victim);
        expelledAftermath(state, d.name, d.victim, friends);
      }
      for (const n of state.active) driftDay(state, n, { rested: false });
    } else {
      houseBeats(state, R('night1'), { night: true, min: 1, max: 2 });
    }

    // ── Day 2: deliberation, the vote, the call-out ──
    state.day = plan.firstDay + 1;
    for (const n of state.active) driftDay(state, n);
    houseDay(state, R('house2'));
    houseBeats(state, R('beats2'), { min: 1, max: 3 });
    spreadDay(state);
    reviseAll(state);
    epRec.exits.push(...dayExits(state, R('exits2')));
    const immune = daily.winners.filter(w => state.active.includes(w));
    const need = unitsLeft(state) - FINAL_UNITS + returnsAhead(idx);
    const elims = purged ? 0 : elimsFor(schedule, idx, need);
    epRec.elims = elims;
    // a double is announced, not discovered at the vote: TJ tells the house before anybody deliberates
    if (elims > 1) {
      // the two who hear it hardest: the most worried of those who can be voted in tonight
      const atRisk = inDivision(state, division).filter(n => !immune.includes(n)).sort((x, y) => (state.mind[y]?.paranoia || 0) - (state.mind[x]?.paranoia || 0));
      for (const n of atRisk) nudge(state, n, 'paranoia', 0.5);
      addScene(state, 'tj-double', atRisk.slice(0, 2), { elims, division, immune: [...immune], booked: plan.twist === 'double' }, state.active, 'villa');
    }
    let matches = [];
    let delib = null;
    const used = new Set();
    if (pairsOn(state)) ({ matches, delib } = pairVoteNight(state, { R, epRec, division, daily, immune, elims, opts, plan, liveTwist: liveTwists(opts)[plan.ep] || null }));
    else for (let k = 0; k < elims; k++) {
      const eligible = inDivision(state, division).filter(n => !immune.includes(n) && !used.has(n));
      if (eligible.length < 2) break;
      if (!delib) { state.promises = {}; delib = deliberate(state, R('delib'), { division, eligible, immune }); epRec.delib = summarise(delib); if (!delib.volunteer) houseDebate(state, delib, eligible); }
      let votedIn, vote = null, volunteer = false;
      if (k === 0 && delib.volunteer && eligible.includes(delib.volunteer.name)) {
        votedIn = delib.volunteer.name; volunteer = true;
        state.rec[votedIn].volunteered++;
      } else {
        // the Tribunal format: the house (not the Tribunal) nominates, the three top names plead their case,
        // and the Tribunal sends one in (format.js tribunal)
        const tribunal = state.fmt.tribunal ? tribunalOf(state, daily, immune) : null;
        vote = houseVote(state, R(`vote${k}`), { eligible, delib, winners: immune, voters: tribunal ? state.active.filter(n => !tribunal.includes(n)) : null });
        if (tribunal && vote.votedIn) {
          const nominees = Object.keys(vote.tally).sort((x, y) => vote.tally[y] - vote.tally[x] || threatRead(state, y) - threatRead(state, x)).slice(0, state.fmt.nominees);
          for (const n of [...eligible].sort((x, y) => threatRead(state, y) - threatRead(state, x))) if (nominees.length < Math.min(state.fmt.nominees, eligible.length) && !nominees.includes(n)) nominees.push(n);
          vote.nominated = vote.votedIn;
          vote.tribunal = tribunalDecide(state, R(`trib${k}`), { tribunal, nominees, delib });
          vote.votedIn = vote.tribunal.chosen;
        }
        state.receiptsFresh = {};
        for (const b of vote.ballots) (state.receiptsFresh[b.target] ||= []).push(b.voter);
        votedIn = vote.votedIn;
        epRec.votes.push(vote);
        for (const n of eligible) if (n !== votedIn) { state.rec[n].survivedVotes++; giveRespect(state, n, 'survivedVote'); }
      }
      if (!votedIn) break;
      used.add(votedIn);
      state.rec[votedIn].votedIn++;
      nudge(state, votedIn, 'confidence', volunteer ? 0.5 : -1.2);
      nudge(state, votedIn, 'morale', volunteer ? 0 : -1);
      epRec.votedIn.push(votedIn);
      addScene(state, volunteer ? 'volunteer-in' : 'voted-in', [votedIn], { volunteer }, state.active, 'public');
      // the Tribunal: the nominees' pitches, the room, the verdict, after the nominations are read
      for (const sc of vote?.tribunal?.scenes || []) addScene(state, ...sc);
      // what the vote broke (a deal, an alliance) comes after the house has heard it (the deal-broken scene
      // used to air before the ceremony it was about)
      if (vote) voteFallout(state, vote, delib);
      // after the vote: the one going in, with the friend who comes to find them, and a friend who said their name
      if (!volunteer && vote) {
        const friend = state.active.filter(n => n !== votedIn && !vote.ballots.some(x => x.voter === n && x.target === votedIn))
          .sort((x, y) => getBond(votedIn, y) - getBond(votedIn, x))[0];
        const stung = vote.ballots.filter(x => x.target === votedIn && getBond(votedIn, x.voter) >= 2).sort((x, y) => getBond(votedIn, y.voter) - getBond(votedIn, x.voter))[0]?.voter || null;
        if (friend) addScene(state, 'after-vote', [votedIn, friend, ...(stung ? [stung] : [])], { count: vote.tally?.[votedIn] || 0, stung }, [votedIn, friend], 'villa');
        // and somebody who said the name rubs it in (cruel.js)
        gloatAfterVote(state, R(`gloat${k}`), vote);
      }
      // The call-out.
      const pool = eligible.filter(n => n !== votedIn && !used.has(n));
      if (!pool.length) break;
      let co, matchGame = null;
      if (volunteer && delib.volunteer.target && pool.includes(delib.volunteer.target)) {
        co = { opponent: delib.volunteer.target, reason: 'grudge', terms: null, volunteerTarget: true };
      } else {
        // TJ says tomorrow's game before the call-out: on a booked night (the Format Designer's The Game Revealed),
        // or now and then on his own (the user, 2026-10-17: "TJ revealing it should be uncommon, or a scheduler")
        const revealed = liveTwists(opts)[plan.ep] === 'reveal' || R(`reveal${k}`)() < 0.18;
        if (revealed) {
          matchGame = drawGame(state, R(`game${k}`));
          addScene(state, 'arena-reveal', [votedIn], { game: matchGame.id, gameName: matchGame.name, booked: liveTwists(opts)[plan.ep] === 'reveal' }, state.active, 'deliberation');
        }
        co = chooseOpponent(state, R(`callout${k}`), votedIn, pool, { game: matchGame,
          voters: (vote?.ballots || []).filter(x => x.target === votedIn).map(x => x.voter) });
      }
      // Decided tonight, in their own head; said out loud tomorrow, at the Arena, in front of the house
      // (the show's call-out: the user's mockup, 2026-10-15). A second elimination this week cannot pick
      // the same person, so the choice is made now.
      used.add(co.opponent);
      afterVote(state, R(`after${k}`), { ballots: vote?.ballots || [], votedIn, calledOut: null, by: votedIn });
      matches.push({ a: votedIn, b: co.opponent, volunteer, vote, co, k, pool, game: matchGame, callout: { by: votedIn, opponent: co.opponent, reason: co.reason },
        voters: (vote?.ballots || []).filter(x => x.target === votedIn).map(x => x.voter) });
    }

    // Redemption House watches the vote on the television
    if (redemptionOn(state)) redemptionWatch(state, epRec.votes.flatMap(v => v.ballots || []));
    // ── The night before: the two who are going in, and the people around them ──
    for (const m of matches) arenaEve(state, R(`eve${m.a}`), m);
    // the rest of the house that night (the user, 2026-10-15: the villa after the vote was "four events,
    // short, boring and useless")
    houseBeats(state, R('eveBeats'), { night: true, min: 2, max: 3 });

    // ── Day 3: the Arena ──
    state.day = plan.firstDay + 2;
    for (const n of state.active) driftDay(state, n);
    // the day of the Arena, before it: house life, the one going in thinking it through with a friend,
    // and the people who might be picked, waiting
    houseDay(state, R('house3'));
    houseBeats(state, R('beats3am'), { min: 2, max: 3 });
    for (const m of matches) pickDay(state, R(`pick${m.a}`), m);
    if (pairsOn(state)) pairArenaDay(state, { R, epRec, matches, delib, closing: (state.plannedEpisodes || schedule.length) - (idx + 1) <= 2 });
    else for (const [k, m] of matches.entries()) {
      if (!state.active.includes(m.a) || !state.active.includes(m.b)) continue;
      // The call-out, at the Arena: everything it costs happens now, when the house hears it.
      const { a: votedIn, b: opp, co, vote } = m;
      state.rec[opp].calledOut++;
      calledOut(votedIn, opp, co.reason);
      const deal = dealBetween(state, votedIn, opp);
      if (deal) breakDeal(state, deal, votedIn, 'callout');
      // A threat made at the vote: kept, or broken in front of the person it was made to.
      const pr = state.promises?.[votedIn];
      const promise = pr && !m.volunteer ? (pr.at === opp ? 'kept' : state.active.includes(pr.at) ? 'broken' : null) : null;
      epRec.callouts.push({ by: votedIn, opponent: opp, reason: co.reason, terms: co.terms, ranked: co.ranked || null, promise, promisedAt: promise ? pr.at : null });
      addScene(state, 'callout', [votedIn, opp], { reason: co.reason, volunteer: m.volunteer, promise, ...(m.game ? { gameName: m.game.name } : {}),
        votedMe: !!vote?.ballots.some(x => x.voter === opp && x.target === votedIn) }, state.active, 'arena');
      if (promise) {
        state.word ||= {};
        if (promise === 'kept') { state.word[votedIn] = Math.min(3, (state.word[votedIn] || 0) + 1); pop(votedIn, 0.5); }
        else {
          state.word[votedIn] = Math.max(-3, (state.word[votedIn] || 0) - 1.5);
          remember(pr.at, votedIn, 'empty-threat', 0.6);
          addScene(state, 'empty-threat', [pr.at, votedIn], { opponent: opp }, state.active, 'arena');
        }
        delete state.promises[votedIn];
      }
      afterVote(state, R(`afterco${k}`), { ballots: [], votedIn, calledOut: opp, by: votedIn });
      calloutCost(state, votedIn, opp, co.reason);
      const duel = playDuel(state, R(`arena${k}`), m.a, m.b, m.game || null);
      duel.volunteer = m.volunteer;
      epRec.arena.push(duel);
      const { winner, loser } = duel;
      state.rec[winner].arenaW++; state.rec[winner].lastArenaEp = state.ep;
      state.rec[loser].arenaL++;
      giveRespect(state, winner, m.volunteer && winner === m.a ? 'volunteerWin' : 'arenaWin');
      if (m.volunteer && loser === m.a) giveRespect(state, loser, 'volunteerLoss');
      nudge(state, winner, 'confidence', 1.6); nudge(state, winner, 'morale', 1);
      pop(winner, duel.comeback ? 2 : duel.upset ? 1.5 : 0.6);
      duel.tj = tjVerdict(state, duel);
      const toRedemption = houseTakes(state, idx);
      // how the winner got here: voted in, volunteered, or called out by the other one (a line about "everybody
      // who voted for me" needs a vote: facts.how)
      const how = winner === m.a ? (m.volunteer ? 'volunteered' : 'voted') : 'calledout';
      addScene(state, 'arena', [m.a, m.b], { game: duel.game, winner, loser, upset: duel.upset, comeback: duel.comeback, tj: duel.tj, beats: duel.beats, gameName: duel.gameName,
        redemption: toRedemption, how }, state.active, 'arena');
      // the goodbye at the gate, while the loser is still here (goodbye.js); Redemption House is not a goodbye
      if (!toRedemption) {
        const asVotedIn = loser === m.a;
        duel.goodbye = arenaGoodbye(state, R(`bye${k}`), { loser, winner, culprits: asVotedIn ? (m.volunteer ? [] : m.voters) : [m.a],
          how: asVotedIn ? (m.volunteer ? 'volunteered' : 'voted') : 'calledout' });
      }
      arenaWon(winner, loser, state.active, { margin: duel.upset ? 1.4 : 1 });
      // the winner takes half of the loser's bank, and earns a skull (stakes.js)
      duel.took = arenaPurse(state, winner, loser);
      earnPass(state, winner);
      // Redemption House, while it is open: the loser is not going home yet (redemption.js)
      if (toRedemption) { sendToRedemption(state, loser, winner, m.voters); duel.redemption = true; }
      else removePlayer(state, loser, 'arena', { by: winner, game: duel.game });
      syncActive(state);
      // A winner hurt in the Arena: how bad decides whether the medics pull them out.
      const hurtNow = injuryRoll(state, R(`hurt${k}`), winner, 1.3) ? hurt(state, R(`hurtk${k}`), winner, 'arena') : null;
      if (hurtNow && R(`med${k}`)() < medicalRisk(hurtNow)) {
        medevac(state, winner); epRec.exits.push({ name: winner, how: 'medical' });
      } else {
        // The voters only face the one THEY put in; a winner who was called out
        // comes back having sent the caller home, and a volunteer put themselves there.
        returnToHouse(state, winner, winner === m.a ? m.voters : [], { volunteered: m.volunteer && winner === m.a, calledOut: winner === m.b, beat: loser });
      }
      // The morning after comes after the winner has walked back in.
      epRec.fallout = (epRec.fallout || []).concat(morningAfter(state, { duel, vote: m.vote, callout: m.callout, meetings: delib?.meetings || [], rng: R(`payback${k}`), volunteer: m.volunteer }));
    }
    // Redemption House: the people waiting there fight for the way back (redemption.js)
    if (redemptionOn(state)) {
      const champ = redemptionNight(state, R('redemption'), { closing: (state.plannedEpisodes || schedule.length) - (idx + 1) <= 3 });
      if (champ) epRec.redemption = { champ };
    }
    houseBeats(state, R('beats3'), { night: true, min: 3, max: 5 });
    psycheMoment(state, R('psyche'));
    breakupCheck(state, R('breakup'));
    epRec.exits.push(...dayExits(state, R('exits3'), [], schedule[idx + 1]?.final || idx === schedule.length - 1 ? opts.finalists : 0));
    state.cliqueStrength = Math.max(0.15, state.cliqueStrength * 0.84);
    epRec.intel.end = intelSnap(state);
  }

  // The final is its own episode.
  state.ep = (state.episodes.at(-1)?.ep || 0) + 1;
  gs.episode = state.ep;
  state.finalEp = { ep: state.ep, final: true, votes: [], votedIn: [], callouts: [], arena: [], exits: [] };
  // nobody runs the final from Redemption House, or without a skull (stakes.js)
  closeForFinal(state);
  state.finalEp.cut = passCut(state);
  syncActive(state);
  playFinal(state, streamFor(seed, 'final'));
  // a Pairs season's money was paid out by the share-or-keep (share-keep.js)
  if (!pairsOn(state)) for (const c of state.champions || []) state.bank[c] = (state.bank[c] || 0) + PURSE.champion;
  const placements = {};
  for (const g of state.gone) placements[g.name] = g.place;
  Object.assign(placements, state.final.placements);
  return { state, episodes: state.episodes, final: state.final, champions: state.champions, placements };
}

function summarise(delib) {
  return { targets: delib.targets, meetings: delib.meetings, pitches: delib.pitches, campaigns: delib.campaigns,
    threats: delib.threats, volunteer: delib.volunteer, intents: delib.intents, hunted: delib.hunted };
}

