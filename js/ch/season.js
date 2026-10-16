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
import { addBond, getBond } from '../bonds.js';
import { romanticCompat } from '../players.js';
import { streamFor } from '../dr/rng.js';
import { newState, blankRecord, addScene, inDivision, noise, S } from './state.js';
import { DEFAULT_OPTIONS, formatOf } from './format.js';
import { buildSchedule, elimsFor, divisionFor } from './schedule.js';
import { initMind, driftDay, nudge } from './mind.js';
import { giveRespect, threatRead } from './respect.js';
import { afterVote } from './alliances.js';
import { deliberate, houseVote, voteFallout, breakDeal, houseDebate, tribunalDecide } from './vote.js';
import { chooseOpponent, dealBetween } from './callout.js';
import { playDaily } from './dailies.js';
import { playDuel, injuryRoll } from './arena.js';
import { partyNight } from './party.js';
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

// The Tribunal: the daily's winners, or the three who did best on a winning team.
function tribunalOf(state, daily, immune) {
  const sc = daily?.scores || {};
  return [...immune].sort((a, b) => (sc[b] || 0) - (sc[a] || 0)).slice(0, state.fmt.tribunal || 3);
}

function pop(name, d) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + d;
}

// A day's quits and medicals. At most one quit a day.
function dayExits(state, rng, injured = []) {
  const out = [];
  for (const n of injured) {
    if (state.active.includes(n) && rng() < 0.22) { medical(state, n); out.push({ name: n, how: 'medical' }); }
  }
  for (const n of [...state.active]) {
    if (rng() < quitRisk(state, n)) { quit(state, n); pop(n, -2); out.push({ name: n, how: 'quit' }); break; }
  }
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
    rec: Object.fromEntries(act.map(n => [n, { daily: R(n).dailyWins || 0, arenaW: R(n).arenaW || 0, arenaL: R(n).arenaL || 0, votedIn: R(n).votedIn || 0, calledOut: R(n).calledOut || 0, votes: R(n).votesReceived || 0 }])),
    // for the Debug screen: how each of them feels, what they need, what they are trying to do, and their word
    mind: Object.fromEntries(act.map(n => [n, Object.fromEntries(Object.entries(state.mind[n] || {}).map(([k, v]) => [k, Math.round(v * 10) / 10]))])),
    psyche: Object.fromEntries(act.map(n => [n, state.psyche[n] || null])),
    plans: Object.fromEntries(act.map(n => { const p = state.plans?.[n]; return [n, p ? { style: p.style, core: [...p.core], targets: p.targets.map(t => [t, p.origins?.[t] || '']),
      shield: p.shield, revenge: [...p.revenge], finalWith: [...p.finalWith] } : null]; })),
    word: Object.fromEntries(act.filter(n => state.word?.[n]).map(n => [n, state.word[n]])),
  };
}

export function playChallengeSeason({ cast, background = {}, divisions = {}, options = {}, seed = 1, carried = null }) {
  setGs({ bonds: {}, perceivedBonds: {}, relationshipDimensions: {}, activePlayers: [...cast],
    episodeHistory: [], popularity: {}, episode: 0 });
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const state = newState(seed, opts);
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
  for (const n of cast) {
    const bg = background[n] || {};
    state.rookie[n] = !!bg.rookie;
    state.origin[n] = bg.origin || null;
    state.rep[n] = bg.rep || {};
    state.rec[n] = blankRecord();
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
  for (const [a, b] of reunions) {
    if (state.arrivalPairs.length >= 3) break;
    if (usedArrival.has(a) || usedArrival.has(b)) continue;
    usedArrival.add(a); usedArrival.add(b);
    state.arrivalPairs.push([a, b]);
  }

  const schedule = buildSchedule({ total: cast.length, finalists: opts.finalists, daysPerEpisode: opts.daysPerEpisode, gendered: opts.gendered });
  state.schedule = schedule;
  state.plannedEpisodes = schedule.filter(e => !e.final).length;
  let prevDiv = streamFor(seed, 'coin')() < 0.5 ? 'm' : 'f';

  for (let idx = 0; idx < schedule.length; idx++) {
    const plan = schedule[idx];
    if (plan.final || state.active.length <= opts.finalists) break;
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
    const premiere = idx === 0;
    let division, daily;
    const runDaily = () => {
      division = divisionFor(state, prevDiv, opts.finalists);
      prevDiv = division;
      epRec.division = division;
      daily = playDaily(state, R('daily'), { division });
      epRec.daily = daily;
      epRec.exits.push(...dayExits(state, R('exits1'), daily.injuries));
    };
    if (premiere) {
      for (const [a, b] of state.arrivalPairs || []) addScene(state, 'arrival', [a, b], { recognised: [[a, b]] }, cast, 'airstrip');
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
        disqualify(state, d.name, d.victim); pop(d.name, -3);
        epRec.exits.push({ name: d.name, how: 'disqualified', victim: d.victim });
        tjLaysDownTheLaw(state, d.name, d.victim);
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
    const need = state.active.length - opts.finalists;
    const elims = elimsFor(schedule, idx, need);
    epRec.elims = elims;
    const matches = [];
    let delib = null;
    const used = new Set();
    for (let k = 0; k < elims; k++) {
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
        voteFallout(state, vote, delib);
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
      // after the vote: the one going in, with the friend who comes to find them, and a friend who said their name
      if (!volunteer && vote) {
        const friend = state.active.filter(n => n !== votedIn && !vote.ballots.some(x => x.voter === n && x.target === votedIn))
          .sort((x, y) => getBond(votedIn, y) - getBond(votedIn, x))[0];
        const stung = vote.ballots.filter(x => x.target === votedIn && getBond(votedIn, x.voter) >= 2).sort((x, y) => getBond(votedIn, y.voter) - getBond(votedIn, x.voter))[0]?.voter || null;
        if (friend) addScene(state, 'after-vote', [votedIn, friend, ...(stung ? [stung] : [])], { count: vote.tally?.[votedIn] || 0, stung }, [votedIn, friend], 'villa');
      }
      // The call-out.
      const pool = eligible.filter(n => n !== votedIn && !used.has(n));
      if (!pool.length) break;
      let co;
      if (volunteer && delib.volunteer.target && pool.includes(delib.volunteer.target)) {
        co = { opponent: delib.volunteer.target, reason: 'grudge', terms: null, volunteerTarget: true };
      } else {
        co = chooseOpponent(state, R(`callout${k}`), votedIn, pool);
      }
      // Decided tonight, in their own head; said out loud tomorrow, at the Arena, in front of the house
      // (the show's call-out: the user's mockup, 2026-10-15). A second elimination this week cannot pick
      // the same person, so the choice is made now.
      used.add(co.opponent);
      afterVote(state, R(`after${k}`), { ballots: vote?.ballots || [], votedIn, calledOut: null, by: votedIn });
      matches.push({ a: votedIn, b: co.opponent, volunteer, vote, co, k, pool, callout: { by: votedIn, opponent: co.opponent, reason: co.reason },
        voters: (vote?.ballots || []).filter(x => x.target === votedIn).map(x => x.voter) });
    }

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
    for (const [k, m] of matches.entries()) {
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
      addScene(state, 'callout', [votedIn, opp], { reason: co.reason, volunteer: m.volunteer, promise,
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
      calloutCost(state, votedIn, opp);
      const duel = playDuel(state, R(`arena${k}`), m.a, m.b);
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
      addScene(state, 'arena', [m.a, m.b], { game: duel.game, winner, loser, upset: duel.upset, comeback: duel.comeback, tj: duel.tj, beats: duel.beats, gameName: duel.gameName }, state.active, 'arena');
      arenaWon(winner, loser, state.active, { margin: duel.upset ? 1.4 : 1 });
      removePlayer(state, loser, 'arena', { by: winner, game: duel.game });
      syncActive(state);
      // A winner hurt in the Arena can still be pulled out.
      if (injuryRoll(state, R(`hurt${k}`), winner, 1.3) && R(`med${k}`)() < 0.2) {
        medical(state, winner); epRec.exits.push({ name: winner, how: 'medical' });
      } else {
        // The voters only face the one THEY put in; a winner who was called out
        // comes back having sent the caller home, and a volunteer put themselves there.
        returnToHouse(state, winner, winner === m.a ? m.voters : [], { volunteered: m.volunteer && winner === m.a, calledOut: winner === m.b, beat: loser });
      }
      // The morning after comes after the winner has walked back in.
      epRec.fallout = (epRec.fallout || []).concat(morningAfter(state, { duel, vote: m.vote, callout: m.callout, meetings: delib?.meetings || [] }));
    }
    houseBeats(state, R('beats3'), { night: true, min: 3, max: 5 });
    psycheMoment(state, R('psyche'));
    breakupCheck(state, R('breakup'));
    epRec.exits.push(...dayExits(state, R('exits3')));
    state.cliqueStrength = Math.max(0.15, state.cliqueStrength * 0.84);
    epRec.intel.end = intelSnap(state);
  }

  // The final is its own episode.
  state.ep = (state.episodes.at(-1)?.ep || 0) + 1;
  gs.episode = state.ep;
  state.finalEp = { ep: state.ep, final: true, votes: [], votedIn: [], callouts: [], arena: [], exits: [] };
  playFinal(state, streamFor(seed, 'final'));
  const placements = {};
  for (const g of state.gone) placements[g.name] = g.place;
  Object.assign(placements, state.final.placements);
  return { state, episodes: state.episodes, final: state.final, champions: state.champions, placements };
}

function summarise(delib) {
  return { targets: delib.targets, meetings: delib.meetings, pitches: delib.pitches, campaigns: delib.campaigns,
    threats: delib.threats, volunteer: delib.volunteer, intents: delib.intents, hunted: delib.hunted };
}

