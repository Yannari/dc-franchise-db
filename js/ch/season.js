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
import { addBond } from '../bonds.js';
import { romanticCompat } from '../players.js';
import { streamFor } from '../dr/rng.js';
import { newState, blankRecord, addScene, inDivision, noise } from './state.js';
import { DEFAULT_OPTIONS, formatOf } from './format.js';
import { buildSchedule, elimsFor, divisionFor } from './schedule.js';
import { initMind, driftDay, nudge } from './mind.js';
import { giveRespect } from './respect.js';
import { afterVote } from './alliances.js';
import { deliberate, houseVote, voteFallout, breakDeal } from './vote.js';
import { chooseOpponent, dealBetween } from './callout.js';
import { playDaily } from './dailies.js';
import { playDuel, injuryRoll } from './arena.js';
import { partyNight } from './party.js';
import { romanceDay, breakupCheck } from './romance.js';
import { quitRisk, quit, medical, disqualify, removePlayer } from './exits.js';
import { houseDay, psycheMoment, returnToHouse } from './house.js';
import { houseBeats } from './events.js';
import { arenaEve, tjLaysDownTheLaw, tjVerdict } from './tj.js';
import { playFinal } from './final.js';
import { reviseAll } from './plans.js';
import { spreadDay, syncActive } from './knowledge.js';
import { morningAfter } from './fallout.js';
import { calledOut, arenaWon, remember } from './rel.js';

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
  addScene(state, 'arrival', cast, { recognised: recog, kin: (carried?.kin || []).filter(k => cast.includes(k.a) && cast.includes(k.b)) }, cast, 'villa');

  const schedule = buildSchedule({ total: cast.length, finalists: opts.finalists, daysPerEpisode: opts.daysPerEpisode, gendered: opts.gendered });
  state.schedule = schedule;
  state.plannedEpisodes = schedule.filter(e => !e.final).length;
  let prevDiv = streamFor(seed, 'coin')() < 0.5 ? 'm' : 'f';

  for (let idx = 0; idx < schedule.length; idx++) {
    const plan = schedule[idx];
    if (plan.final || state.active.length <= opts.finalists) break;
    state.ep = plan.ep;
    gs.episode = plan.ep;
    const R = name => streamFor(seed, `ep${plan.ep}:${name}`);
    const epRec = { ep: plan.ep, division: null, exits: [], votedIn: [], arena: [], votes: [], callouts: [] };
    state.episodes.push(epRec);

    // ── Day 1: house life, the daily, the night out ──
    state.day = plan.firstDay;
    for (const n of state.active) driftDay(state, n);
    houseDay(state, R('house1'));
    romanceDay(state, R('romance1'));
    reviseAll(state);
    houseBeats(state, R('beats1'), { min: 1, max: 4 });
    spreadDay(state);
    const division = divisionFor(state, prevDiv, opts.finalists);
    prevDiv = division;
    epRec.division = division;
    const daily = playDaily(state, R('daily'), { division });
    epRec.daily = daily;
    epRec.exits.push(...dayExits(state, R('exits1'), daily.injuries));
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
      if (!delib) { delib = deliberate(state, R('delib'), { division, eligible, immune }); epRec.delib = summarise(delib); }
      let votedIn, vote = null, volunteer = false;
      if (k === 0 && delib.volunteer && eligible.includes(delib.volunteer.name)) {
        votedIn = delib.volunteer.name; volunteer = true;
        state.rec[votedIn].volunteered++;
      } else {
        vote = houseVote(state, R(`vote${k}`), { eligible, delib, winners: immune });
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
      // The call-out.
      const pool = eligible.filter(n => n !== votedIn && !used.has(n));
      if (!pool.length) break;
      let co;
      if (volunteer && delib.volunteer.target && pool.includes(delib.volunteer.target)) {
        co = { opponent: delib.volunteer.target, reason: 'grudge', terms: null, volunteerTarget: true };
      } else {
        co = chooseOpponent(state, R(`callout${k}`), votedIn, pool);
      }
      used.add(co.opponent);
      state.rec[co.opponent].calledOut++;
      calledOut(votedIn, co.opponent, co.reason);
      const deal = dealBetween(state, votedIn, co.opponent);
      if (deal) breakDeal(state, deal, votedIn, 'callout');
      epRec.callouts.push({ by: votedIn, opponent: co.opponent, reason: co.reason, terms: co.terms, ranked: co.ranked || null });
      addScene(state, 'callout', [votedIn, co.opponent], { reason: co.reason }, state.active, 'public');
      afterVote(state, R(`after${k}`), { ballots: vote?.ballots || [], votedIn, calledOut: co.opponent, by: votedIn });
      matches.push({ a: votedIn, b: co.opponent, volunteer, vote, callout: { by: votedIn, opponent: co.opponent, reason: co.reason },
        voters: (vote?.ballots || []).filter(x => x.target === votedIn).map(x => x.voter) });
    }

    // ── The night before: the two who are going in, and the people around them ──
    for (const m of matches) arenaEve(state, R(`eve${m.a}`), m);

    // ── Day 3: the Arena ──
    state.day = plan.firstDay + 2;
    for (const n of state.active) driftDay(state, n);
    for (const [k, m] of matches.entries()) {
      if (!state.active.includes(m.a) || !state.active.includes(m.b)) continue;
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
      epRec.fallout = (epRec.fallout || []).concat(morningAfter(state, { duel, vote: m.vote, callout: m.callout, meetings: delib?.meetings || [] }));
      // A winner hurt in the Arena can still be pulled out.
      if (injuryRoll(state, R(`hurt${k}`), winner, 1.3) && R(`med${k}`)() < 0.2) {
        medical(state, winner); epRec.exits.push({ name: winner, how: 'medical' });
      } else {
        returnToHouse(state, winner, m.voters);
      }
    }
    houseBeats(state, R('beats3'), { night: true, min: 1, max: 3 });
    psycheMoment(state, R('psyche'));
    breakupCheck(state, R('breakup'));
    epRec.exits.push(...dayExits(state, R('exits3')));
    state.cliqueStrength = Math.max(0.15, state.cliqueStrength * 0.84);
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

