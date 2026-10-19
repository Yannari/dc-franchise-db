// ══════════════════════════════════════════════════════════════════════
// ch/pair-week.js — a Pairs season's vote night and Arena day
// ══════════════════════════════════════════════════════════════════════
//
// Spec docs/superpowers/specs/2026-10-17-ch-pairs-season-design.md §5.2-5.4. The solo season's day 2 and day 3
// (season.js) with a pair where a player was: the house votes a pair in (vote.js names it by its representative),
// that pair calls out a pair (pairs.js choosePairOpponent: they agree, or one overrules the other), and the Arena
// is two on two; the losing pair goes home together. Everything a solo night does for its one player is done for
// both partners: the record, the respect, the mind, the purse, the skull, the goodbye, the walk back in.
import { getBond } from '../bonds.js';
import { gs } from '../core.js';
import { addScene, inDivision } from './state.js';
import { nudge } from './mind.js';
import { giveRespect, threatRead } from './respect.js';
import { afterVote } from './alliances.js';
import { deliberate, houseVote, voteFallout, breakDeal, houseDebate, tribunalDecide } from './vote.js';
import { dealBetween } from './callout.js';
import { drawGame } from './arena.js';
import { tjVerdict, calloutCost } from './tj.js';
import { removePlayer } from './exits.js';
import { returnToHouse } from './house.js';
import { morningAfter } from './fallout.js';
import { calledOut, arenaWon, remember, grudgeOf, intimidated } from './rel.js';
import { S } from './state.js';
import { addBond } from '../bonds.js';
import { arenaPurse, hurt, medicalRisk, earnPass } from './stakes.js';
import { injuryRoll } from './arena.js';
import { arenaGoodbye } from './goodbye.js';
import { medevac } from './medevac.js';
import { gloatAfterVote } from './cruel.js';
import { membersOf, partnerOf, repOf, choosePairOpponent, playPairDuel, dissolvePair, unitsLeft, infiltrate, pairingOf, arenaPairBeats } from './pairs.js';

const pop = (name, d) => { gs.popularity ||= {}; gs.popularity[name] = (gs.popularity[name] || 0) + d; };
const reps = (state, names) => [...new Set(names.map(n => repOf(state, n)))];

// The Tribunal: the winning pair (two judges), or the two who did best on it.
function tribunalOf(state, daily, immune) {
  const sc = daily?.scores || {};
  return [...immune].sort((a, b) => (sc[b] || 0) - (sc[a] || 0)).slice(0, state.fmt.tribunal || 3);
}

/**
 * Day 2 of a Pairs season: deliberation, the vote, and the call-out decided in the pair's own heads. Returns the
 * matches for the Arena ({ a, b } are pairs' representatives) and the deliberation.
 */
export function pairVoteNight(state, { R, epRec, division, daily, immune, elims, opts, plan, liveTwist }) {
  const matches = [];
  let delib = null;
  const used = new Set();
  for (let k = 0; k < elims; k++) {
    const eligible = inDivision(state, division).filter(n => !immune.includes(n) && !used.has(n) && partnerOf(state, n) && !used.has(partnerOf(state, n)));
    if (reps(state, eligible).length < 2) break;
    if (!delib) { state.promises = {}; delib = deliberate(state, R('delib'), { division, eligible, immune }); epRec.delib = summarise(delib); if (!delib.volunteer) houseDebate(state, delib, eligible); }
    let votedIn, vote = null, volunteer = false;
    if (k === 0 && delib.volunteer && eligible.includes(delib.volunteer.name)) {
      votedIn = delib.volunteer.name; volunteer = true;
      for (const n of membersOf(state, votedIn)) state.rec[n].volunteered++;
    } else {
      const tribunal = state.fmt.tribunal ? tribunalOf(state, daily, immune) : null;
      vote = houseVote(state, R(`vote${k}`), { eligible, delib, winners: immune, voters: tribunal ? state.active.filter(n => !tribunal.includes(n)) : null });
      if (tribunal && vote.votedIn) {
        // the house nominates three pairs; the winning pair decides together
        const nominees = Object.keys(vote.tally).sort((x, y) => vote.tally[y] - vote.tally[x] || threatRead(state, y) - threatRead(state, x)).slice(0, state.fmt.nominees);
        for (const n of reps(state, eligible).sort((x, y) => threatRead(state, y) - threatRead(state, x))) if (nominees.length < Math.min(state.fmt.nominees, reps(state, eligible).length) && !nominees.includes(n)) nominees.push(n);
        vote.nominated = vote.votedIn;
        vote.tribunal = tribunalDecide(state, R(`trib${k}`), { tribunal, nominees, delib });
        vote.votedIn = repOf(state, vote.tribunal.chosen);
      }
      state.receiptsFresh = {};
      for (const b of vote.ballots) for (const t of membersOf(state, b.target)) (state.receiptsFresh[t] ||= []).push(b.voter);
      votedIn = vote.votedIn;
      epRec.votes.push(vote);
      for (const r of reps(state, eligible)) if (r !== votedIn) for (const n of membersOf(state, r)) { state.rec[n].survivedVotes++; giveRespect(state, n, 'survivedVote'); }
    }
    if (!votedIn) break;
    const inPair = membersOf(state, votedIn);
    for (const n of inPair) {
      used.add(n);
      state.rec[n].votedIn++;
      nudge(state, n, 'confidence', volunteer ? 0.5 : -1.2);
      nudge(state, n, 'morale', volunteer ? 0 : -1);
    }
    epRec.votedIn.push(votedIn);
    addScene(state, volunteer ? 'pair-volunteer-in' : 'pair-voted-in', inPair, { volunteer, count: vote?.tally?.[votedIn] || 0 }, state.active, 'public');
    for (const sc of vote?.tribunal?.scenes || []) addScene(state, ...sc);
    if (vote) voteFallout(state, vote, delib);
    // after the vote: the two of them, alone, with who said their names; and somebody who said it rubs it in
    if (!volunteer && vote) {
      const stung = vote.ballots.filter(x => x.target === votedIn && inPair.some(n => getBond(n, x.voter) >= 2))
        .sort((x, y) => Math.max(...inPair.map(n => getBond(n, y.voter))) - Math.max(...inPair.map(n => getBond(n, x.voter))))[0]?.voter || null;
      addScene(state, 'pair-after-vote', [...inPair, ...(stung ? [stung] : [])], { count: vote.tally?.[votedIn] || 0, stung }, inPair, 'villa');
      gloatAfterVote(state, R(`gloat${k}`), vote);
    }
    // the call-out, decided tonight in the pair's own heads, said at the Arena tomorrow
    const pool = eligible.filter(n => !used.has(n));
    if (!reps(state, pool).length) break;
    let co, matchGame = null;
    const voters = (vote?.ballots || []).filter(x => x.target === votedIn).map(x => x.voter);
    if (volunteer && delib.volunteer.target && pool.includes(delib.volunteer.target)) {
      co = { opponent: delib.volunteer.target, about: delib.volunteer.target, reason: 'grudge', terms: null, volunteerTarget: true, decider: delib.volunteer.by || votedIn, agreed: true };
    } else {
      const revealed = liveTwist === 'reveal' || R(`reveal${k}`)() < 0.18;
      if (revealed) {
        matchGame = drawGame(state, R(`game${k}`));
        addScene(state, 'arena-reveal', inPair, { game: matchGame.id, gameName: matchGame.name, booked: liveTwist === 'reveal', pair: true }, state.active, 'deliberation');
      }
      co = choosePairOpponent(state, R(`callout${k}`), votedIn, pool, { game: matchGame, voters });
    }
    for (const n of membersOf(state, co.opponent)) used.add(n);
    afterVote(state, R(`after${k}`), { ballots: vote?.ballots || [], votedIn, calledOut: null, by: votedIn });
    matches.push({ a: votedIn, b: co.opponent, volunteer, vote, co, k, pool, game: matchGame, voters, pair: true,
      callout: { by: votedIn, opponent: co.opponent, reason: co.reason, decider: co.decider } });
  }
  return { matches, delib };
}

/** Day 3 of a Pairs season: the call-out at the Arena, the two-on-two, the losing pair's goodbyes. */
export function pairArenaDay(state, { R, epRec, matches, delib, closing }) {
  for (const [k, m] of matches.entries()) {
    if (!membersOf(state, m.a).every(n => state.active.includes(n)) || !membersOf(state, m.b).every(n => state.active.includes(n))) continue;
    const { a, b, co, vote } = m;
    const A = membersOf(state, a), B = membersOf(state, b);
    const by = A.includes(co.decider) ? co.decider : a;
    const at = B.includes(co.about) ? co.about : b;
    for (const n of B) state.rec[n].calledOut++;
    calledOut(by, at, co.reason);
    // every deal between the two pairs breaks when the name is said
    for (const x of A) for (const y of B) { const deal = dealBetween(state, x, y); if (deal) breakDeal(state, deal, x, 'callout'); }
    const pr = state.promises?.[by];
    const promise = pr && !m.volunteer ? (B.includes(pr.at) ? 'kept' : state.active.includes(pr.at) ? 'broken' : null) : null;
    epRec.callouts.push({ by: a, opponent: b, decider: by, about: at, agreed: !!co.agreed, overruled: co.overruled || null, reason: co.reason, terms: co.terms, ranked: co.ranked || null, promise, promisedAt: promise ? pr.at : null, pair: true });
    addScene(state, 'pair-callout', [by, at, partnerOf(state, by), partnerOf(state, at)].filter(Boolean),
      { reason: co.reason, volunteer: m.volunteer, promise, agreed: !!co.agreed, overruled: co.overruled || null, ...(m.game ? { gameName: m.game.name } : {}),
        votedMe: !!vote?.ballots.some(x => B.includes(x.voter) && x.target === a) }, state.active, 'arena');
    if (promise) {
      state.word ||= {};
      if (promise === 'kept') { state.word[by] = Math.min(3, (state.word[by] || 0) + 1); pop(by, 0.5); }
      else { state.word[by] = Math.max(-3, (state.word[by] || 0) - 1.5); remember(pr.at, by, 'empty-threat', 0.6); addScene(state, 'empty-threat', [pr.at, by], { opponent: at }, state.active, 'arena'); }
      delete state.promises[by];
    }
    afterVote(state, R(`afterco${k}`), { ballots: [], votedIn: a, calledOut: b, by: a });
    calloutCost(state, by, at, co.reason);
    const duel = playPairDuel(state, R(`arena${k}`), a, b, m.game || null);
    duel.volunteer = m.volunteer;
    epRec.arena.push(duel);
    const { winner, loser, winners, losers } = duel;
    for (const w of winners) {
      state.rec[w].arenaW++; state.rec[w].lastArenaEp = state.ep;
      giveRespect(state, w, m.volunteer && winner === a ? 'volunteerWin' : 'arenaWin');
      nudge(state, w, 'confidence', 1.6); nudge(state, w, 'morale', 1);
      pop(w, duel.comeback ? 2 : duel.upset ? 1.5 : 0.6);
    }
    for (const l of losers) { state.rec[l].arenaL++; if (m.volunteer && loser === a) giveRespect(state, l, 'volunteerLoss'); }
    duel.tj = tjVerdict(state, duel);
    const how = winner === a ? (m.volunteer ? 'volunteered' : 'voted') : 'calledout';
    addScene(state, 'pair-arena', [...winners, ...losers], { game: duel.game, gameName: duel.gameName, winner, loser, winners, losers, upset: duel.upset,
      comeback: duel.comeback, tj: duel.tj, beats: duel.beats, how }, state.active, 'arena');
    // inside each pair: who cost it, who carried it
    duel.inside = arenaPairBeats(state, R(`inside${k}`), duel);
    // the goodbyes at the gate, both of them, while they are still here
    const asVotedIn = loser === a;
    duel.goodbye = losers.map((l, i) => arenaGoodbye(state, R(`bye${k}${i}`), { loser: l, winner: winners[i] || winner,
      culprits: asVotedIn ? (m.volunteer ? [] : m.voters) : [by], how: asVotedIn ? (m.volunteer ? 'volunteered' : 'voted') : 'calledout',
      leaving: losers, winners }));
    for (const w of winners) for (const l of losers) arenaWon(w, l, state.active, { margin: (duel.upset ? 1.4 : 1) / 2 });
    duel.took = winners.reduce((t, w, i) => t + arenaPurse(state, w, losers[i] || losers[0]), 0);
    for (const w of winners) earnPass(state, w);
    // the pair goes home together, on one placement
    const place = unitsLeft(state);
    dissolvePair(state, loser);
    for (const l of losers) removePlayer(state, l, 'arena', { by: winner, game: duel.game, partner: losers.find(x => x !== l) || null, place, pairDone: true });
    // a Pick season: the winners may take a partner from another pair (Double Agents' infiltration)
    if (pairingOf(state) === 'pick' && !closing) duel.swap = infiltrate(state, R(`swap${k}`), winners);
    for (const [i, w] of winners.entries()) {
      const hurtNow = injuryRoll(state, R(`hurt${k}${i}`), w, 1.3) ? hurt(state, R(`hurtk${k}${i}`), w, 'arena') : null;
      if (hurtNow && R(`med${k}${i}`)() < medicalRisk(hurtNow)) { medevac(state, w); epRec.exits.push({ name: w, how: 'medical' }); continue; }
      if (state.active.includes(w)) returnToHouse(state, w, winner === a ? m.voters : [], { volunteered: m.volunteer && winner === a, calledOut: winner === b, beat: losers[i] || loser, pair: true });
    }
    // the morning after, for each of them: the ballots said the pair, so each partner's mourners blame the same voters
    const forL = l => (asVotedIn && m.vote ? { ...m.vote, ballots: m.vote.ballots.map(x => (x.target === a ? { ...x, target: l } : x)) } : m.vote);
    epRec.fallout = (epRec.fallout || []).concat(losers.map((l, i) => morningAfter(state, { duel: { ...duel, loser: l }, vote: forL(l),
      callout: { ...m.callout, by: asVotedIn ? l : by }, meetings: delib?.meetings || [], rng: R(`payback${k}${i}`), volunteer: m.volunteer })));
  }
}

// ── the night before, and the day of the Arena ───────────────────────
// A Pairs season's night before is the pair's own: the two of them going in, sitting up together (close, nervous, or
// barely speaking), and somebody from the pair they mean to pick, who can tell, asking.
export function pairEve(state, rng, m) {
  const A = membersOf(state, m.a), B = membersOf(state, m.b);
  if (A.length === 2 && A.every(n => state.active.includes(n))) {
    const bond = getBond(A[0], A[1]);
    const mood = bond >= 2 ? 'close' : bond <= -2 ? 'cold' : 'nervous';
    if (mood === 'close') { addBond(A[0], A[1], 0.4); for (const n of A) nudge(state, n, 'confidence', 0.5); }
    else if (mood === 'cold') { addBond(A[0], A[1], -0.3); for (const n of A) nudge(state, n, 'confidence', -0.2); }
    else { addBond(A[0], A[1], 0.2); for (const n of A) nudge(state, n, 'morale', 0.2); }
    addScene(state, 'pair-eve', A, { mood }, A, mood === 'close' ? 'beach' : 'villa');
  }
  // the one from the other pair with the worst feeling about it goes to ask
  const asker = [...B].filter(n => state.active.includes(n)).sort((x, y) => (grudgeOf(y, m.a) + S(y, 'boldness') * 0.2) - (grudgeOf(x, m.a) + S(x, 'boldness') * 0.2))[0];
  if (!asker) return;
  const heat = grudgeOf(asker, m.a) + S(asker, 'boldness') * 0.2 - S(asker, 'temperament') * 0.1;
  if (rng() < Math.min(0.7, Math.max(0.05, heat * 0.12))) {
    const won = S(asker, 'boldness') + rng() * 4 > S(m.a, 'temperament') + rng() * 4;
    intimidated(won ? asker : m.a, won ? m.a : asker, 0.6);
    nudge(state, won ? m.a : asker, 'confidence', -0.4);
    addBond(m.a, asker, -0.6);
    addScene(state, 'arena-eve-confront', [asker, m.a], { rattled: won ? m.a : asker, pair: true }, state.active, 'pool');
  }
}

// The day of the Arena: the pair going in talks the pick through between them (two pairs it could be), and the pairs
// who could be picked wait it out together.
export function pairPickDay(state, rng, m) {
  if (m.volunteer || !state.active.includes(m.a)) return;
  const A = membersOf(state, m.a);
  const open = reps(state, (m.pool || []).filter(n => state.active.includes(n)));
  const other = open.filter(r => r !== m.b).sort((x, y) => getBond(m.a, x) - getBond(m.a, y))[0];
  if (other && A.length === 2) {
    const options = rng() < 0.5 ? [m.b, other] : [other, m.b];
    addBond(A[0], A[1], 0.2);
    // (picked: which option is the call-out, so a scene that settles on one says the right one: read 2026-10-19, a pair
    // agreed on Duncan and MK over breakfast and called out Drea and Tobias that afternoon)
    addScene(state, 'pick-talk', A, { options, pair: true, picked: options.indexOf(m.b) + 1 }, A, 'private');
  }
  const worried = [...open].sort((x, y) => getBond(m.a, x) - getBond(m.a, y)).slice(0, 2);
  if (worried.length === 2) {
    const who = worried.flatMap(r => membersOf(state, r)).slice(0, 4);
    for (const x of who) for (const y of who) if (x < y) addBond(x, y, 0.2);
    addScene(state, 'pick-guess', who, { by: m.a, pair: true }, who, 'private');
  }
}

function summarise(delib) {
  return { targets: delib.targets, meetings: delib.meetings, pitches: delib.pitches, campaigns: delib.campaigns,
    threats: delib.threats, volunteer: delib.volunteer, intents: delib.intents, hunted: delib.hunted };
}
