// ══════════════════════════════════════════════════════════════════════
// pm/moments.js — each episode's big moment, and the dumping scene
// ══════════════════════════════════════════════════════════════════════
//
// The dumping is its own scene in five PHASES (spec §10) — build-up, verdict
// (with the villa's ballots revealed), reaction, goodbye, fallout — each
// carrying as many events as the night produces. Every beat moves bonds, and
// a partner left behind can be heartbroken enough to walk out with them.
import { addBond, getBond } from '../bonds.js';
import { makeEvent, partnerOf, roomMates, airLater, today } from './events.js';
import { revealExchange } from './script.js';
import { streamFor } from '../dr/rng.js';
import { romance } from './feelings.js';
import { closedness } from './ladder.js';
import { breakHeart, feel, jealousOf, jealousyHit } from './emotions.js';
import { runRecoupling } from './recoupling.js';
import { publicVote, publicVoteIslanders, finalVote, splitOrSteal } from './public-vote.js';
import { villaDumping, topCouplePicks, saveOne, couplesVote, returningExes, exIslandersVote } from './villa-vote.js';
import { arriveBombshell, arrivePair, bombshellSteal, openCasa, standUp, bombshellSaves, publicMatch, introParts } from './arrivals.js';
import { kinFor, onYourSide, BLOOD } from './kin.js';
import { secretMission, sleepover, immunityChallenge } from './one-offs.js';
import { attr, nudgeAttraction } from './chemistry.js';
import { stickOrTwist } from './casa.js';
import { kissFirst } from './kiss-games.js';
import { finalDate, speechChapters } from './journey.js';
import { confrontation } from './movie-night.js';
import { addRelationshipDimension } from '../relationships.js';
import { closeEpisode, BETRAYAL } from './ledger.js';
import { FINAL_COUPLES } from './schedule.js';

const EXIT = 'dumped';

function removeFromVilla(state, names) {
  // Who has gone, and when: the ex-islanders who come back to vote are read
  // from here (villa-vote.js returningExes).
  for (const n of names) if (state.villa.includes(n) || state.casa.includes(n)) (state.gone ||= []).push({ name: n, ep: state.ep });
  state.villa = state.villa.filter(n => !names.includes(n));
  state.casa = state.casa.filter(n => !names.includes(n));
  state.couples = state.couples.filter(c => !c.some(n => names.includes(n)));
}

// ── THE NIGHT BEFORE THE VERDICT ──────────────────────────────────────
// User: "the build-up during the elimination is non-existent … who's in
// danger … the host doesn't explain step by step what we're doing … where
// was the text notification … no host announcement, no little talk, no recap,
// no suspense". The show's own order (UK 5, 8 July 2019, HuffPost; US 7 ep 32,
// Deadline): a text sends the villa to the fire pit; nerves while they wait;
// the host arrives, says what has happened, and explains exactly how tonight
// works; the SAFE couples are read out one at a time, so the ones left
// standing are the ones at risk; and whoever decides is told it is their turn.
const VOTE_NIGHTS = new Set(['public', 'villa', 'top-couple', 'save', 'couples', 'exes']);
// The villa decides (after the at-risk plead their case); the public do not.
const VILLA_DECIDES = new Set(['villa', 'top-couple', 'save', 'couples', 'exes']);
// What the host can recap: the day's biggest moment, if one aired.
const RECAP = ['steal', 'blowup', 'photo-split', 'movie-split', 'official-ask', 'love-said', 'argument', 'entrance', 'kiss'];

function fireBuildUp(state, rng, { atRisk, channel, format, dumped }) {
  const out = [];
  // What tonight is, for the text and the host: the public's singles, a
  // double dumping, or the format the night plays.
  const couplesGoing = dumped.filter(n => { const p = partnerOf(state, n); return p && dumped.includes(p); }).length / 2;
  const tonight = channel === 'public' && atRisk.every(c => c.length === 1) ? 'singles'
    : channel === 'public' && couplesGoing >= 2 ? 'public-double' : format || channel;
  const push = (kind, players, extra = {}, major = []) => out.push(makeEvent(state, rng,
    { phase: 'dumping', kind, players, aired: true, major, extra: { channel, ...extra } }));
  const villa = state.villa.filter(n => !(state.split && state.casa.includes(n)));
  const coupled = villa.filter(n => partnerOf(state, n));
  // 1. The text. Nobody knows yet who is at risk: the whole villa feels it.
  const reader = coupled[Math.floor(rng() * coupled.length)] || villa[0];
  const other = partnerOf(state, reader) || villa.find(n => n !== reader);
  for (const n of villa) feel(state, n, 'stress', 0.3 * (1 - (state.profiles[n].stats?.temperament ?? 5) / 20));
  push('dump-text', other ? [reader, other] : [reader], { of: tonight, pop: { [reader]: { approval: 0, fame: 0.5 } } });
  // 2. Waiting to go down: the couple least sure of where they stand.
  const pairs = state.couples.filter(([a, b]) => villa.includes(a) && villa.includes(b));
  const shaky = [...pairs].sort((x, y) => Math.min(romance(x[0], x[1]), romance(x[1], x[0])) - Math.min(romance(y[0], y[1]), romance(y[1], y[0])))[0];
  if (shaky) {
    addBond(shaky[0], shaky[1], 0.2);
    feel(state, shaky[0], 'stress', 0.3); feel(state, shaky[1], 'stress', 0.3);
    push('dump-nerves', [...shaky], { pop: { [shaky[0]]: { approval: 0.1, fame: 0.6 } } });
  }
  // 3. The host, the day, and the rules of the night.
  push('dump-open', [], { of: tonight, pop: {} });
  // Never a secret: a kiss is only recapped between partners, where the villa saw it.
  const big = today(state).filter(e => e.aired && !e.extra?.secret && RECAP.includes(e.kind)
    && e.players.every(n => villa.includes(n) || e.kind === 'steal')
    && (e.kind !== 'kiss' || partnerOf(state, e.players[0]) === e.players[1]))
    .sort((x, y) => RECAP.indexOf(x.kind) - RECAP.indexOf(y.kind))[0];
  // A row between two who are not a couple is not "you might need each other".
  const apart = big && ['argument', 'blowup'].includes(big.kind) && partnerOf(state, big.players[0]) !== big.players[1];
  if (big) push('dump-recap', big.players.slice(0, 3), { of: big.kind + (apart ? '-apart' : ''), pop: {} });
  // 4. The safe couples, one at a time, when the public has ranked them all.
  if (['public', 'villa', 'top-couple'].includes(channel) && atRisk.every(c => c.length === 2)) {
    const risky = new Set(atRisk.flat());
    const safe = pairs.filter(c => !c.some(n => risky.has(n)));
    for (let i = safe.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [safe[i], safe[j]] = [safe[j], safe[i]]; }
    safe.forEach((c, i) => {
      for (const n of c) { feel(state, n, 'security', 0.4); feel(state, n, 'stress', -0.4); }
      push('dump-safe', [...c], { nth: i === 0 ? 'first' : i === safe.length - 1 ? 'last' : 'next',
        pop: Object.fromEntries(c.map(n => [n, { approval: 0, fame: 0.4 }])) });
    });
  }
  return out;
}

/** The at-risk make their case to whoever decides, before a single vote. */
function pleas(state, rng, atRisk, channel) {
  return atRisk.map(c => {
    const a = c[0];
    const s = state.profiles[a].stats?.social ?? 5;
    return makeEvent(state, rng, { phase: 'dumping', kind: 'dump-plea', players: [...c], aired: true,
      extra: { channel, of: c.length === 1 ? 'one' : 'couple', pop: { [a]: { approval: 0.1 + 0.05 * (s - 5), fame: 0.6 } } } });
  });
}

export function dumpingScene(state, rng, { atRisk = [], dumped, ballots = [], channel, decision = null, afterVotes = null, format = null, nominate = null }) {
  const events = [];
  const solidarityWalk = [];
  const kinWalk = new Set();
  // Who is going home tonight, for the beach hut (script.js hutFor `leaving`).
  state._leaving = [...dumped];
  // Every phase knows which vote it came from, so Dior says the right thing.
  const ev = (kind, players, pop, major = [], more = {}) => events.push(makeEvent(state, rng,
    { phase: 'dumping', kind, players, aired: true, major, extra: { pop, channel, ...more } }));
  const partners = Object.fromEntries(dumped.map(n => [n, partnerOf(state, n)]));
  // A night that sends two couples or more home says so, and names them in
  // order (a double dumping read as two separate nights, each "the couple
  // leaving tonight").
  const goingCouples = dumped.filter(n => partners[n] && dumped.includes(partners[n])).length / 2;
  const going = goingCouples >= 2 ? goingCouples : null;
  let told = 0;
  const order = () => (going ? { going, nth: told++ ? 'next' : 'first' } : {});
  // Who is at risk is named in turn: the first, the next, or the only one.
  let named = 0;
  const riskOrder = () => (going ? order() : { nth: atRisk.length === 1 ? 'only' : named++ ? 'next' : 'first' });
  const voteNight = atRisk.length && VOTE_NIGHTS.has(channel);
  // 0. the text, the wait, the host, the safe couples (fireBuildUp)
  if (voteNight) events.push(...fireBuildUp(state, rng, { atRisk, channel, format, dumped }));
  // …the villa's own nominations, when it names who is at risk
  if (nominate) events.push(...nominate);
  // What the dumped will remember if they are ever asked back: who voted them
  // out, and the partner they left behind (villa-vote.js grudgeOf).
  for (const n of dumped) {
    (state.dumpedBy ||= {})[n] = ballots.filter(b => !b.save && (b.target === n || b.couple?.includes(n))).map(b => b.voter);
    if (partners[n]) (state.leftBehind ||= {})[n] = partners[n];
  }
  // 1. build-up: a couple at risk, or one islander on their own (save-one)
  for (const c of atRisk) {
    for (const n of c) feel(state, n, 'stress', 0.6);
    ev(c.length === 1 ? 'dump-at-risk' : 'dump-buildup', c, Object.fromEntries(c.map(n => [n, { approval: 0, fame: 0.5 }])),
      [], c.length === 1 ? {} : riskOrder());
  }
  told = 0;
  // …what happens next, and whose turn it is to decide
  if (voteNight && VILLA_DECIDES.has(channel)) {
    events.push(...pleas(state, rng, atRisk, channel));
    events.push(makeEvent(state, rng, { phase: 'dumping', kind: 'dump-decide', players: [], aired: true,
      extra: { channel, of: format || channel, pop: {} } }));
  }
  // …then the decision, when somebody makes it in front of the villa
  if (decision) events.push(...decision());
  // 2. the ballots in front of everyone, THEN the verdict they add up to
  // (the verdict read first had Dior announcing a count nobody had cast).
  for (const b of ballots) {
    // A vote to SAVE (save-one): the saved islander owes the voter.
    if (b.save) {
      addBond(b.target, b.voter, 0.6);
      ev('save-vote', [b.voter, b.target], { [b.voter]: { approval: 0.1, fame: 0.8 } });
      continue;
    }
    // A ballot with its own scene (an ex-islander's) is shown whether or not
    // it carried: every ex stands up and says it. The ex is gone again by
    // morning, so only the one voted against carries the bond.
    if (b.kind) {
      addBond(b.target, b.voter, -0.8);
      events.push(makeEvent(state, rng, { phase: 'dumping', kind: b.kind, players: [b.voter, b.target], aired: true,
        extra: { channel, grudge: b.grudge || null, pop: { [b.voter]: { approval: 0, fame: 1 } } } }));
      continue;
    }
    // Every vote is read out, not only the ones against whoever went: a 5-0
    // on screen was really 5-4 (season 88), and the count IS the suspense.
    // Decided in a scene of its own (the favourite couple's pick): the bond,
    // not a second reveal.
    if (b.silent) {
      for (const n of b.couple || [b.target]) addBond(n, b.voter, -0.8);
      continue;
    }
    addBond(b.target, b.voter, -0.8);
    const p = partners[b.target];
    if (p && p !== b.voter && !dumped.includes(p)) addBond(p, b.voter, -0.5);
    ev('ballot-reveal', [b.voter, b.target], { [b.voter]: { approval: -0.2, fame: 1 } });
  }
  // …and what the votes left to settle (a tie), before anyone is told.
  if (afterVotes) events.push(...afterVotes());
  // A couple dumped together hears it once, together; several singles left
  // over hear it once, as a group ("X is the only one still standing" over
  // five people standing was false, and five times over).
  const done = new Set();
  const lone = dumped.filter(n => !(partners[n] && dumped.includes(partners[n])));
  if (channel === 'recoupling' && lone.length > 1) {
    ev('dump-verdict-singles', lone, Object.fromEntries(lone.map(n => [n, { approval: 0, fame: 2 }])), lone);
    for (const n of lone) done.add(n);
  }
  for (const n of dumped) {
    if (done.has(n)) continue;
    const p = partners[n];
    if (p && dumped.includes(p)) {
      done.add(n); done.add(p);
      ev('dump-verdict-couple', [n, p], { [n]: { approval: 0, fame: 2 }, [p]: { approval: 0, fame: 2 } }, [n, p], order());
    } else {
      done.add(n);
      ev('dump-verdict', [n], { [n]: { approval: 0, fame: 2 } }, [n]);
    }
  }
  // 3. reaction: the partner left behind, and the ones who cannot stay without them
  for (const n of dumped) {
    const p = partners[n];
    if (!p || dumped.includes(p)) continue;
    breakHeart(state, p, n, 5 * romance(p, n) / 10);
    ev('dump-reaction', [p, n], { [p]: { approval: 0.8 * Math.max(0, getBond(p, n)) / 10 + 0.3, fame: 1.5 } });
    const solidarity = (romance(p, n) / 10) ** 2 * (state.profiles[p].stats.loyalty / 10)
      * (0.3 + 0.7 * closedness(state, p, n));
    if (rng() < solidarity * 0.5) {
      solidarityWalk.push(p);
      ev('solidarity', [p, n], { [p]: { approval: 2.5, fame: 2 } }, [p]);
    }
  }
  // 3b. family, or a best friend, watching them go (pm/kin.js): it hurts,
  // and a loyal one may walk out with them.
  for (const n of dumped) {
    for (const k of kinFor(state, n)) {
      if (!onYourSide(k.kin) || dumped.includes(k.other) || !state.villa.includes(k.other) || solidarityWalk.includes(k.other)) continue;
      feel(state, k.other, 'stress', 1); feel(state, k.other, 'loneliness', 1.2);
      ev('kin-goodbye', [k.other, n], { [k.other]: { approval: 0.6, fame: 1.2 } }, [], { of: BLOOD.has(k.kin) ? 'family' : 'friends' });
      const walks = (state.profiles[k.other].stats.loyalty / 10) ** 2 * 0.12 * (BLOOD.has(k.kin) ? 1 : 0.5);
      if (rng() < walks && !partnerOf(state, k.other)) {
        solidarityWalk.push(k.other); kinWalk.add(k.other);
        ev('kin-walk', [k.other, n], { [k.other]: { approval: 2, fame: 2 } }, [k.other], { of: BLOOD.has(k.kin) ? 'family' : 'friends' });
      }
    }
  }
  // 4. goodbye: hugs from the friends — fewer each when many are going, or
  // a five-way dumping is twenty goodbyes from seven lines.
  const hugs = dumped.length > 2 ? 1 : dumped.length > 1 ? 2 : 3;
  for (const n of dumped) {
    // …from the ones staying: on a double dumping, one leaver told another
    // "don't let anyone mess you about once I'm gone" (season 31).
    const friends = roomMates(state, n).filter(m => getBond(n, m) > 1 && !dumped.includes(m)).slice(0, hugs);
    for (const f of friends) { addBond(n, f, 0.2); ev('dump-goodbye', [n, f], { [n]: { approval: 0.5, fame: 0.5 } }); }
    ev('dump-goodbye', [n], { [n]: { approval: 1.5, fame: 1 } });
  }
  removeFromVilla(state, [...dumped, ...solidarityWalk]);
  state._leaving = null;
  // 5. fallout: whoever is newly single panics
  for (const p of Object.values(partners)) {
    if (p && state.villa.includes(p) && !partnerOf(state, p)) ev('dump-fallout', [p], { [p]: { approval: 0.2, fame: 1 } });
  }
  return {
    events,
    exits: [
      ...dumped.map(name => ({ name, verb: EXIT, channel })),
      ...solidarityWalk.map(name => ({ name, verb: 'walked', channel: 'walk', cause: kinWalk.has(name) ? 'kin' : 'solidarity' })),
    ],
  };
}

/**
 * THE RECOUPLING'S OPENING: the text, a single islander who is not sure
 * anyone will stand up for them, and the host saying who chooses tonight and
 * what being left single means. `stake`: 'all' (the final recoupling: every
 * single goes home) · 'risk' (whoever is left single could be dumped) ·
 * 'safe' (whoever is left single stays, single and vulnerable).
 */
function recoupleBuildUp(state, { picker, stake, final }) {
  const rng = streamFor(state.seed ?? 1, `recouple-open:${state.ep}${state.epSalt || ''}`);
  const out = [];
  const villa = state.villa.filter(n => !(state.split && state.casa.includes(n)));
  const push = (kind, players, extra = {}) => out.push(makeEvent(state, rng, { phase: 'firepit', kind, players, aired: true, extra: { pop: {}, ...extra } }));
  if (!final) {
    const reader = villa[Math.floor(rng() * villa.length)];
    const other = partnerOf(state, reader) || villa.find(n => n !== reader);
    push('recouple-text', [reader, other], { of: picker });
  }
  // The one most likely to be left standing: on the side waiting to be
  // picked, single or least sure of a partner (season 202's girl asked "what
  // if nobody picks me?" on a night the girls were choosing).
  const worried = villa.filter(n => state.profiles[n]?.gender !== picker).sort((x, y) => {
    const w = n => (partnerOf(state, n) ? romance(partnerOf(state, n), n) : -5);
    return w(x) - w(y);
  })[0];
  const friend = worried && villa.filter(n => n !== worried && state.profiles[n]?.gender === state.profiles[worried]?.gender)
    .sort((x, y) => getBond(worried, y) - getBond(worried, x))[0];
  if (worried && friend) {
    feel(state, worried, 'stress', 0.5);
    push('recouple-nerves', [worried, friend], { taken: !!partnerOf(state, worried) });
  }
  push('recouple-open', [], { of: `${picker}-${stake}` });
  return out;
}

function pickerGender(state) {
  const g = state.recouplings % 2 === 0 ? 'm' : 'f';
  state.recouplings++;
  return g;
}

function recoupleNight(state, rng, { dumpSingles, pace = 1.5, votesAhead = 0, all = false }) {
  // How many a recoupling may send home, decided before anyone picks, so the
  // host can say what is at stake (below: the cap's reasons).
  const base = state.villa.length > 10 ? 2 : 1;
  const floor = votesAhead ? 2 * (FINAL_COUPLES + 1) : 0;
  const cap = Math.min(pace < 0.5 ? 0 : pace < 1 ? 1 : Math.max(base, Math.ceil(pace - 0.5)),
    Math.max(0, state.villa.length - floor));
  const picker = pickerGender(state);
  // The final recoupling says so first: who reads the text, and the one
  // they turn to.
  const open = [];
  if (all && state.villa.length >= 2) {
    const a = state.villa[Math.floor(rng() * state.villa.length)];
    const b = partnerOf(state, a) || state.villa.find(x => x !== a);
    open.push(makeEvent(state, rng, { phase: 'firepit', kind: 'final-recoupling', players: [a, b], aired: true,
      extra: { pop: { [a]: { approval: 0, fame: 0.5 }, [b]: { approval: 0, fame: 0.3 } } } }));
  }
  // A recoupling says what it is before anyone stands (user: "not just a
  // continuation of text without setup or explanation" — season 202's opened
  // on the first pick, and "whoever was not chosen is dumped" was only said
  // after the last). The text, somebody who is not sure of being picked, and
  // the host: who chooses, and what happens to whoever is left standing. On
  // its own dice, so the picks play as they did.
  if (dumpSingles && state.villa.length >= 4) open.push(...recoupleBuildUp(state, { picker, stake: all ? 'all' : cap > 0 ? 'risk' : 'safe', final: all }));
  const r = runRecoupling(state, { rng, pickerGender: picker, repick: all });
  const events = [...open, ...r.picks.map(pk => makeEvent(state, rng, { phase: 'firepit', kind: 'recouple-pick',
    players: [pk.picker, pk.picked, ...(pk.stole ? [pk.stole] : [])], aired: true,
    major: pk.stole ? [pk.picker, pk.stole] : [],
    extra: { stole: pk.stole, reason: pk.reason, pop: { [pk.picker]: { approval: pk.stole ? -BETRAYAL.steal : 0.2, fame: 1 },
      ...(pk.stole ? { [pk.stole]: { approval: 1.5, fame: 2 } } : {}) } } }))];
  for (const pk of r.picks) if (pk.stole) breakHeart(state, pk.stole, pk.picked, 5 * romance(pk.stole, pk.picked) / 10);
  state.couples = r.couples;
  if (!dumpSingles || !r.single.length) return { events, exits: [], ballots: r.ballots };
  // The final recoupling: nobody single stays, whatever the pace.
  if (all) {
    const scene = dumpingScene(state, rng, { atRisk: [], dumped: [...r.single], ballots: [], channel: 'recoupling' });
    return { events: [...events, ...scene.events], exits: scene.exits, ballots: r.ballots };
  }
  // The cap (top of the function): at most two go on a recoupling night, and
  // only one once the villa is down to ten — the real show leaves the rest
  // single rather than emptying the place a ceremony at a time (measured:
  // without the second cap, a thin season arrived at the final with two
  // couples instead of four). The season's pace moves it: nobody goes when
  // the villa has no one to spare, more when a short season has more to lose;
  // under half an islander a night to spare the singles stay, under one a
  // night dumps one at most. And never below five couples while a public vote
  // is still to come: a villa emptied to the final's four by the early
  // recouplings skipped the first vote in 24 seasons of 100 (2026-09-23).
  if (!cap) {
    // Left single, and staying: said, so the night does not simply stop.
    if (r.single.length) events.push(makeEvent(state, rng, { phase: 'dumping', kind: 'recouple-single', players: [r.single[0]], aired: true,
      extra: { pop: { [r.single[0]]: { approval: 0.3, fame: 1 } } } }));
    for (const n of r.single) { feel(state, n, 'confidence', -0.8); feel(state, n, 'stress', 0.6); }
    return { events, exits: [], ballots: r.ballots };
  }
  const dumped = r.single.slice(0, cap);
  const scene = dumpingScene(state, rng, { atRisk: [], dumped, ballots: [], channel: 'recoupling' });
  return { events: [...events, ...scene.events], exits: scene.exits, ballots: r.ballots };
}

/**
 * Bombshells are cast to the villa that exists: a dumping takes whichever
 * side was surplus, so the next arrival comes from the side that is short.
 * Without this the villa drifts out of balance and the singles can never
 * couple up again — the final ended with two couples and three singles.
 */
function arrivals(state, ctx, count) {
  const out = [];
  // A pair counts as two of tonight's arrivals. With no room left tonight it
  // takes the season's LAST arrival place (the queue runs in order, so that
  // is the one left short), and only if that leaves no bombshell night with
  // nobody: the final recoupling's or the photos night's, or a bombshell
  // night that still has someone. Otherwise another bombshell walks in
  // tonight and the pair waits for a night with room.
  const spare = () => { const l = (ctx.slotsAhead || []).filter(x => x.n > 0).at(-1); return l && (l.moment !== 'bombshell' || l.n >= 2) ? l : null; };
  const mateOf = n => kinFor(state, n).find(k => onYourSide(k.kin) && ctx.queues.bombshell.includes(k.other));
  for (let i = 0; i < count && ctx.queues.bombshell.length; i++) {
    // …counting nobody in a same-sex couple: they need no one from either side
    // (UK 2: Katie and Sophie coupled up, two boys were left, and the show
    // sent in a girl to choose between them).
    const gen = n => state.profiles[n].gender;
    const paired = new Set(state.couples.filter(([x, y]) => gen(x) === gen(y)).flat());
    const count = g => state.villa.filter(n => gen(n) === g && !paired.has(n)).length;
    const need = ['f', 'm'].sort((a, b) => count(a) - count(b))[0];
    const room = i + 1 < count || !!spare();
    const fits = n => state.profiles[n].gender === need && (room || !mateOf(n));
    let idx = ctx.queues.bombshell.findIndex(fits);
    if (idx < 0) idx = Math.max(0, ctx.queues.bombshell.findIndex(n => room || !mateOf(n)));
    if (idx < 0) idx = 0;
    const [name] = ctx.queues.bombshell.splice(idx, 1);
    // A relative or best friend still waiting to come in walks in with them
    // (pm/kin.js): the second is one of the season's own bombshells, taken
    // from a later night, so every bombshell still arrives exactly once.
    const mate = room ? mateOf(name) : null;
    if (mate) {
      ctx.queues.bombshell.splice(ctx.queues.bombshell.indexOf(mate.other), 1);
      if (i + 1 < count) i++;
      else { const s = spare(); if (s) s.n--; }
      out.push(...arrivePair(state, [name, mate.other], { ep: state.ep, seed: ctx.seed, rng: ctx.rng, kin: mate.kin }).events);
      continue;
    }
    out.push(...arriveBombshell(state, name, { ep: state.ep, seed: ctx.seed, rng: ctx.rng }).events);
  }
  return out;
}

// ── the dumping formats of Plan 4.5 ──────────────────────────────────
// Each reads its real-show night: who is at risk, who decides, and the scene
// where they decide it, before the verdict.

/** The public's favourite couple picks which bottom couple goes. */
function topCoupleNight(state, ctx, pv, top) {
  const tp = topCouplePicks(state, { bottom: pv.bottom, pickers: top, rng: ctx.rng });
  const decision = () => [makeEvent(state, ctx.rng, { phase: 'dumping', kind: 'top-couple-pick',
    players: [top[0], top[1], tp.dumped[0], tp.dumped[1]], aired: true, major: [...top],
    extra: { channel: 'top-couple', pop: Object.fromEntries(top.map(n => [n, { approval: -0.3, fame: 1.5 }])) } })];
  const ballots = tp.ballots.map(b => ({ ...b, silent: true }));
  const scene = dumpingScene(state, ctx.rng, { atRisk: pv.bottom, dumped: tp.dumped, ballots, channel: 'top-couple', decision });
  return { events: scene.events, exits: scene.exits, ballots: tp.ballots,
    extra: { shares: pv.shares, bottom: pv.bottom, deciders: [...top], dumpFormat: 'top-couple-picks' } };
}

/** The public's bottom boys (or girls); the other side saves one. */
function saveOneNight(state, ctx) {
  // The larger side is the one at risk, so the night evens the villa out.
  const count = g => state.villa.filter(n => state.profiles[n].gender === g).length;
  const side = count('f') === count('m') ? (ctx.rng() < 0.5 ? 'f' : 'm') : count('f') > count('m') ? 'f' : 'm';
  const pv = publicVoteIslanders(state, { rng: ctx.rng, gender: side, bottom: ctx.entry.bottom || 3, immune: ctx.immune || [] });
  const so = saveOne(state, { atRisk: pv.bottom, rng: ctx.rng, shares: pv.shares });
  // A tie: the host says so, and the public's votes settle it on screen.
  const afterVotes = so.tie ? () => [makeEvent(state, ctx.rng, { phase: 'dumping', kind: 'save-tie',
    players: [so.saved, ...so.tie.filter(n => n !== so.saved)], aired: true, major: [...so.tie],
    extra: { channel: 'save', pop: { [so.saved]: { approval: 0, fame: 1.5 } } } })] : null;
  const scene = dumpingScene(state, ctx.rng, { atRisk: pv.bottom.map(n => [n]), dumped: so.dumped,
    ballots: so.ballots, channel: 'save', afterVotes });
  return { events: scene.events, exits: scene.exits, ballots: so.ballots,
    extra: { islanderShares: pv.shares, bottom: pv.bottom.map(n => [n]), saved: so.saved, tie: so.tie, dumpFormat: 'save-one' } };
}

/** The single islanders face the public; the fewest votes go. */
function singlesVoteNight(state, ctx, singles, n) {
  const pv = publicVoteIslanders(state, { rng: ctx.rng, names: singles, bottom: singles.length });
  const dumped = pv.bottom.slice(0, n);
  const scene = dumpingScene(state, ctx.rng, { atRisk: singles.map(x => [x]), dumped, channel: 'public' });
  return { events: scene.events, exits: scene.exits, ballots: [],
    extra: { islanderShares: pv.shares, bottom: singles.map(x => [x]), dumpFormat: 'singles' } };
}

/** Each couple names the least compatible couple, in front of everyone. */
function coupleVoteScenes(state, rng, cv) {
  return cv.votes.map(v => {
    for (const x of v.couple) for (const y of v.target) addBond(y, x, -0.3);
    return makeEvent(state, rng, { phase: 'dumping', kind: 'couples-vote', players: [...v.couple, ...v.target], aired: true,
      extra: { pop: Object.fromEntries(v.couple.map(n => [n, { approval: 0, fame: 0.5 }])) } });
  });
}

/** No public vote at all: the villa names two couples, and the safe islanders pick. */
function couplesVoteNight(state, ctx) {
  const cv = couplesVote(state, { rng: ctx.rng, atRisk: ctx.entry.bottom || 2, immune: ctx.immune || [] });
  const named = coupleVoteScenes(state, ctx.rng, cv);
  const vd = villaDumping(state, { format: 'safe-pick-couple', bottom: cv.vulnerable, rng: ctx.rng });
  const scene = dumpingScene(state, ctx.rng, { atRisk: cv.vulnerable, dumped: vd.dumped, ballots: vd.ballots, channel: 'couples', nominate: named });
  return { events: scene.events, exits: scene.exits, ballots: vd.ballots,
    extra: { bottom: cv.vulnerable, dumpFormat: 'couples-vote' } };
}

/** The semi-final the dumped islanders decide. */
function exIslandersNight(state, ctx, singles, over, exes) {
  const events = [];
  const exits = [];
  if (singles.length) {
    const s = dumpingScene(state, ctx.rng, { dumped: singles, channel: 'recoupling' });
    events.push(...s.events); exits.push(...s.exits);
  }
  const cv = couplesVote(state, { rng: ctx.rng, atRisk: Math.min(state.couples.length, over + 1) });
  const named = coupleVoteScenes(state, ctx.rng, cv);
  const exv = exIslandersVote(state, { exes, vulnerable: cv.vulnerable, rng: ctx.rng, dump: over });
  // One entrance for the group, led by the most recent: eight separate
  // arrivals from four lines read as the same scene twice (measured).
  const decision = () => [makeEvent(state, ctx.rng, { phase: 'dumping', kind: 'ex-return', players: [exes[0]],
    aired: true, extra: { channel: 'exes', pop: Object.fromEntries(exes.map(ex => [ex, { approval: 0, fame: 1 }])) } })];
  const scene = dumpingScene(state, ctx.rng, { atRisk: cv.vulnerable, dumped: exv.dumped,
    ballots: exv.ballots.map(b => ({ ...b, kind: 'ex-ballot' })), channel: 'exes', decision, nominate: named });
  events.push(...scene.events); exits.push(...scene.exits);
  return { events, exits, ballots: exv.ballots, extra: { bottom: cv.vulnerable, exes, dumpFormat: 'ex-islanders' } };
}

// ── NIGHT ONE (Plan 4.5 phase 2) ─────────────────────────────────────
// The girls stepping forward is the usual first coupling (recoupleNight).
// The other three are one real season each: dating profiles on podiums (UK
// 12 d1), the public's own couples before anyone met (UK 10), and a "most to
// least" ranking that couples the same positions (UK 11 d1). Nobody has met
// on night one, so each reads only looks-and-type attraction — never feelings.
/**
 * NIGHT ONE OPENS THE EPISODE (user: "where's the arrival ceremony on the
 * first episode … the first coupling … get to meet each other"). The real
 * show's first minutes: the islanders walk in one at a time — the girls
 * first, then the boys (UK 5-13) — say hello to whoever is already there,
 * size each other up, and couple up that same afternoon. The whole first day
 * is then played as couples, and the night belongs to the bombshell.
 *
 * Returns the arrivals and the coupling as scenes of their own parts of the
 * day ('arrival', 'coupling'), which the transcript puts before everything.
 */
export function nightOneOpening(state, ctx) {
  const rng = ctx.rng;
  const g = n => state.profiles[n].gender;
  const fmt = ctx.entry.firstFormat || 'step-forward';
  // Who walks in first is the season's (Villa options, `pmFirstIn`): the
  // girls by default, as the show nearly always does it. On Step Forward the
  // first side is the one standing in the line.
  const firstIn = state.firstIn === 'm' ? 'm' : 'f';
  const firstSide = state.villa.filter(n => (g(n) === 'f') === (firstIn === 'f'));
  const secondSide = state.villa.filter(n => !firstSide.includes(n));
  const stepping = fmt === 'step-forward';
  // The show opens on its host (user: "where is she, and where are the
  // presentations?"), and every islander is introduced before they walk in.
  const events = [makeEvent(state, rng, { phase: 'arrival', kind: 'host-open', players: [], aired: true, extra: { pop: {} } })];
  const intro = (a, phase) => makeEvent(state, rng, { phase, kind: 'intro', players: [a], aired: true,
    extra: { parts: introParts(state, a, rng), pop: { [a]: { approval: 0.2, fame: 1 } } } });
  events.push(...arriveSide(state, rng, firstSide, 'arrival', intro));
  // Every other night-one format has the other side walk in too, before a
  // few first chats across the villa and the coupling.
  if (!stepping) events.push(...arriveSide(state, rng, secondSide, 'arrival-2', intro));
  const order = [...firstSide, ...secondSide];
  // First impressions: the strongest pulls in the villa, said out loud.
  const pairs = [];
  for (const a of order) for (const b of order) {
    if (a === b || g(a) === g(b) || attr(state, a, b) == null) continue;
    pairs.push([a, b, attr(state, a, b) + rng() * 2]);
  }
  pairs.sort((x, y) => y[2] - x[2]);
  const met = new Set();
  for (const [a, b] of stepping ? [] : pairs) {
    if (met.has(a) || met.has(b) || met.size >= 8) continue;
    met.add(a); met.add(b);
    // Whether it lands is the other one's attraction, not the asker's.
    const spark = (attr(state, b, a) ?? 0) >= 5;
    if (spark) { nudgeAttraction(state, b, a, 0.3); nudgeAttraction(state, a, b, 0.2); }
    else addBond(a, b, 0.2);
    events.push(makeEvent(state, rng, { phase: 'arrival-2', kind: 'first-look', players: [a, b], aired: true,
      extra: { of: spark ? 'spark' : 'polite', pop: { [a]: { approval: 0.2, fame: 1 } } } }));
  }
  // Dior explains the night's coupling at the fire pit, then it happens.
  const host = makeEvent(state, rng, { phase: 'coupling', kind: 'host-first', players: [], aired: true, extra: { of: fmt, side: firstIn, pop: {} } });
  const first = stepping ? stepForward(state, rng, intro, firstIn)
    : fmt === 'icebreakers' || fmt === 'lady-luck' ? kissFirst(state, rng, fmt, firstIn) : firstCouples(state, rng, fmt);
  // The first coupling is in daylight, the same afternoon they arrived.
  for (const e of first.events) e.phase = 'coupling';
  // THE DEBRIEF (user: "the debrief is really important"): straight after the
  // coupling, the side that walked in on the terrace and the side that stood
  // in the dressing room — who they got, how they really feel about it, and
  // who they have already clocked.
  const debrief = [...debriefSide(state, rng, secondSide), ...debriefSide(state, rng, firstSide)];
  return { events: [...events, host, ...first.events, ...debrief], ballots: first.ballots, firstFormat: fmt };
}

/**
 * One side walking into the villa: each islander's introduction, a hello
 * from whoever is nearest the steps, and — from the second arrival on — a
 * real conversation with the ones already there (user: "the arrivals meeting
 * be a little longer … this is where first impressions are made"). What they
 * talk about is who they are: two who go for the same type clock it, two
 * short fuses rub, and everyone else gets on. A toast once the side is in.
 */
function arriveSide(state, rng, side, phase, intro) {
  const events = [];
  const here = [];
  const S = n => state.profiles[n].stats || {};
  const typeOf = n => [...(state.profiles[n].type?.looks || []), ...(state.profiles[n].type?.vibes || [])];
  for (const a of side) {
    events.push(intro(a, phase));
    const b = here.length ? here[Math.floor(rng() * here.length)] : null;
    if (b) addBond(a, b, 0.3);
    events.push(makeEvent(state, rng, { phase, kind: 'first-arrival', players: b ? [a, b] : [a], aired: true,
      extra: { of: here.length ? 'arrive' : 'first', pop: { [a]: { approval: 0.3, fame: 1.5 } } } }));
    if (here.length) {
      // Someone other than the one who said hello, when there is one.
      const pool = here.length > 1 ? here.filter(n => n !== b) : here;
      const x = pool[Math.floor(rng() * pool.length)];
      const c = here.length > 2 && rng() < 0.5 ? here.filter(n => n !== x)[Math.floor(rng() * (here.length - 1))] : null;
      const shared = typeOf(a).some(k => typeOf(x).includes(k));
      // A clash is two short fuses, in proportion (never a threshold).
      const fuse = ((10 - (S(a).temperament ?? 5)) + (10 - (S(x).temperament ?? 5))) / 20;
      const of = rng() < 0.18 * fuse ? 'clash' : shared && rng() < 0.6 ? 'same-type'
        : here.length <= 2 && rng() < 0.5 ? 'nerves' : ['looking', 'compliment', 'type'][Math.floor(rng() * 3)];
      if (of === 'clash') { addBond(a, x, -0.8); feel(state, a, 'stress', 0.6); }
      else if (of === 'same-type') { addBond(a, x, 0.1); feel(state, a, 'stress', 0.3); feel(state, x, 'stress', 0.3); }
      else { addBond(a, x, 0.5); if (c) { addBond(a, c, 0.3); addBond(x, c, 0.2); } }
      events.push(makeEvent(state, rng, { phase, kind: 'arrival-chat', players: c ? [a, x, c] : [a, x], aired: true,
        extra: { of, pop: { [a]: { approval: of === 'clash' ? -0.4 : 0.3, fame: 1 }, [x]: { approval: 0.1, fame: 0.8 } } } }));
    }
    here.push(a);
  }
  if (here.length >= 3) {
    const [x, y, z] = [...here].sort(() => rng() - 0.5);
    for (const m of here) for (const n of here) if (m < n) addBond(m, n, 0.2);
    events.push(makeEvent(state, rng, { phase, kind: 'first-toast', players: [x, y, z], aired: true,
      extra: { pop: Object.fromEntries(here.slice(0, 3).map(n => [n, { approval: 0.2, fame: 0.5 }])) } }));
  }
  return events;
}

/**
 * The debrief for one side: about half of them tell a friend how they really
 * feel about who they got. Happy or not sure, from how much they fancy their
 * new partner; and when somebody else in the villa pulls them harder, they
 * say so — to the face of that somebody's partner, sometimes, which costs.
 */
function debriefSide(state, rng, side) {
  const events = [];
  const coupled = side.filter(n => partnerOf(state, n));
  const speakers = [...coupled].sort(() => rng() - 0.5).slice(0, Math.max(1, Math.ceil(coupled.length / 2)));
  const heard = new Set();
  for (const a of speakers) {
    const pa = partnerOf(state, a);
    // A friend they already get on with — and not the same listener every
    // time (season 7: one boy heard three of the four).
    const friends = side.filter(n => n !== a).sort((x, y) => getBond(a, y) - getBond(a, x));
    const b = friends.find(n => !heard.has(n)) || friends[0];
    if (!b) continue;
    heard.add(b);
    const others = state.villa.filter(n => n !== pa && attr(state, a, n) != null)
      .sort((x, y) => attr(state, a, y) - attr(state, a, x));
    const r = others[0];
    const rather = r && attr(state, a, r) > (attr(state, a, pa) ?? 0) + 1;
    const of = rather ? (partnerOf(state, b) === r ? 'rather-yours' : 'rather') : (attr(state, a, pa) ?? 0) >= 5 ? 'happy' : 'unsure';
    addBond(a, b, 0.3);
    if (of === 'unsure') feel(state, a, 'stress', 0.5);
    if (of === 'rather') nudgeAttraction(state, a, r, 0.2);
    if (of === 'rather-yours') { addBond(b, a, -1.2); jealousOf(state, b, a, 1.5); nudgeAttraction(state, a, r, 0.2); }
    events.push(makeEvent(state, rng, { phase: 'debrief', kind: 'debrief', players: of === 'rather' ? [a, b, r] : [a, b], aired: true,
      major: of === 'rather-yours' ? [a, b] : [],
      extra: { of, pop: { [a]: { approval: of === 'rather-yours' ? -1.5 : 0.2, fame: 1 }, [b]: { approval: 0, fame: 0.5 } } } }));
  }
  return events;
}


/**
 * The boys walk in one at a time; the girls who like the look of him step
 * forward, and he chooses between them. Nobody stepping forward leaves him
 * waiting at the side, and whoever is left at the end is put together. How
 * likely a girl is to step is how much she is drawn to him (proportional);
 * who he picks is how much he is drawn to her. No steals: it is minutes in.
 */
function stepForward(state, rng, intro = null, stand = 'f') {
  const g = n => state.profiles[n].gender;
  // `stand` is the side in the line; the other walks in to it, one at a time.
  const isStand = n => (g(n) === 'f') === (stand === 'f');
  const free = new Set(state.villa.filter(isStand));
  const boys = state.villa.filter(n => !isStand(n));
  const pairs = [], waiting = [], events = [];
  for (const b of boys) {
    // Each boy is introduced as he reaches the top of the steps.
    if (intro) events.push(intro(b, 'coupling'));
    // Whether she steps forward is how much she fancies HIM against the rest
    // of the side walking in, and her nerve: night one's attraction is looks
    // alone and low for everyone, so a fixed bar left most boys with one
    // girl or none, and the choosing — the moment the night is for — never
    // happened (season 7: five boys, never two steppers).
    const stepped = [...free].filter(f => {
      const v = attr(state, f, b);
      if (v == null) return false;
      const rest = boys.map(o => attr(state, f, o)).filter(x => x != null);
      const usual = rest.length ? rest.reduce((t, x) => t + x, 0) / rest.length : v;
      const p = Math.max(0.05, Math.min(0.9, 0.4 + 0.3 * (v - usual) + 0.3 * ((state.profiles[f].stats?.boldness ?? 5) - 5) / 10));
      return rng() < p;
    });
    if (!stepped.length) {
      waiting.push(b);
      events.push(makeEvent(state, rng, { phase: 'coupling', kind: 'step-forward', players: [b], aired: true,
        extra: { of: 'nobody', side: stand, pop: { [b]: { approval: 0.8, fame: 1.5 } } } }));
      continue;
    }
    const pick = stepped.map(f => [f, (attr(state, b, f) ?? 0) + rng()]).sort((x, y) => y[1] - x[1])[0][0];
    free.delete(pick); pairs.push([pick, b]);
    // The ones he walked past noticed.
    for (const f of stepped) if (f !== pick) addBond(f, pick, -0.2);
    if (stepped.length === 1) {
      events.push(makeEvent(state, rng, { phase: 'coupling', kind: 'step-forward', players: [b, pick], aired: true,
        extra: { of: 'one', side: stand, pop: { [b]: { approval: 0.2, fame: 1 }, [pick]: { approval: 0.3, fame: 1 } } } }));
      continue;
    }
    // MORE THAN ONE STEPPED (user: "the first coupling is still quick and
    // boring"): the moment the show lives on is its own three scenes — who
    // stepped, named; the choice, with the ones not chosen still standing
    // there; and the one who steps back into the line. Those passed over lose
    // a little confidence, in proportion to how much they fancied him.
    const others = stepped.filter(f => f !== pick).sort((x, y) => (attr(state, y, b) ?? 0) - (attr(state, x, b) ?? 0));
    const count = stepped.length === 2 ? 'two' : 'three';
    events.push(makeEvent(state, rng, { phase: 'coupling', kind: 'step-reveal', players: [b, ...[pick, ...others].slice(0, 3)], aired: true,
      extra: { of: count, side: stand, pop: Object.fromEntries(stepped.map(f => [f, { approval: 0.1, fame: 0.6 }])) } }));
    events.push(makeEvent(state, rng, { phase: 'coupling', kind: 'step-choose', players: [b, pick, ...others.slice(0, 2)], aired: true,
      extra: { of: count, side: stand, pop: { [b]: { approval: 0.2, fame: 1 }, [pick]: { approval: 0.3, fame: 1 } } } }));
    for (const f of others) feel(state, f, 'confidence', -0.6 * (attr(state, f, b) ?? 5) / 10);
    feel(state, pick, 'confidence', 0.4);
    events.push(makeEvent(state, rng, { phase: 'coupling', kind: 'step-back', players: [others[0], pick], aired: true,
      extra: { side: stand, pop: { [others[0]]: { approval: 0.4, fame: 0.8 } } } }));
  }
  // Whoever is left: put together, best-matched first.
  for (const b of waiting) {
    const f = [...free].filter(x => attr(state, x, b) != null).sort((x, y) => (attr(state, y, b) ?? 0) - (attr(state, x, b) ?? 0))[0];
    if (!f) continue;
    free.delete(f); pairs.push([f, b]);
    events.push(makeEvent(state, rng, { phase: 'coupling', kind: 'step-last', players: [f, b], aired: true,
      extra: { side: stand, pop: { [f]: { approval: 0.2, fame: 0.8 }, [b]: { approval: 0.4, fame: 0.8 } } } }));
  }
  state.couples = pairs.map(([a, b]) => [a, b]);
  state.recouplings++;
  state.lastRecoupleEp = state.ep;
  return { events, exits: [], ballots: [] };
}

function firstCouples(state, rng, format) {
  const g = n => state.profiles[n].gender;
  const girls = state.villa.filter(n => g(n) === 'f'), boys = state.villa.filter(n => g(n) === 'm');
  const pairs = [];
  const free = new Set(boys);
  const pickFor = (a, score) => [...free].filter(b => attr(state, a, b) != null)
    .map(b => [b, score(a, b)]).sort((x, y) => y[1] - x[1])[0]?.[0];
  if (format === 'ranking') {
    // Ranked by how the other side sees them, and coupled by position.
    const rank = (side, other) => [...side].sort((x, y) =>
      other.reduce((s, o) => s + (attr(state, o, y) ?? 0), 0) - other.reduce((s, o) => s + (attr(state, o, x) ?? 0), 0));
    const rg = rank(girls, boys), rb = rank(boys, girls);
    rg.forEach((a, i) => { if (rb[i] && attr(state, a, rb[i]) != null) { pairs.push([a, rb[i]]); free.delete(rb[i]); } });
  } else {
    const order = [...girls].sort(() => rng() - 0.5);
    const score = format === 'public'
      // The public ship the couples: both ways round, and a little chance.
      ? (a, b) => (attr(state, a, b) ?? 0) + (attr(state, b, a) ?? 0) + (rng() - 0.5) * 2
      // A profile is a name, a height and a quote: mostly chance.
      : (a, b) => 0.3 * (attr(state, a, b) ?? 0) + rng() * 6;
    for (const a of order) { const b = pickFor(a, score); if (b) { pairs.push([a, b]); free.delete(b); } }
  }
  state.couples = pairs.map(([a, b]) => [a, b]);
  state.recouplings++;
  state.lastRecoupleEp = state.ep;
  const kind = { profiles: 'profile-pick', public: 'public-couple', ranking: 'ranking-couple' }[format];
  const events = pairs.map(([a, b], i) => makeEvent(state, rng, { phase: 'firepit', kind, players: [a, b], aired: true,
    extra: { rank: format === 'ranking' ? i + 1 : null, pop: { [a]: { approval: 0.2, fame: 1 }, [b]: { approval: 0.2, fame: 1 } } } }));
  return { events, exits: [], ballots: [] };
}

/** What a bombshell night's rule does, for each bombshell who walked in tonight. */
function arrivalRule(state, ctx, rule, fresh) {
  const events = [], exits = [];
  let played = null;
  for (const name of fresh) {
    const tonight = fresh;
    const r = rule === 'stand-up' ? standUp(state, name, { rng: ctx.rng, tonight })
      : rule === 'saves' ? bombshellSaves(state, name, { rng: ctx.rng, spare: ctx.pace >= 0.5, tonight })
      : rule === 'public-matches' ? publicMatch(state, name, { rng: ctx.rng, tonight }) : null;
    if (!r) continue;
    played = rule;
    // The host says what tonight's rule is before it plays (season 41's
    // stand-up opened on "Slowly, Chloe stands up", with nobody asked to).
    // On its own dice; the coupled on the other side feel it coming.
    const orng = streamFor(state.seed ?? 1, `rule-open:${state.ep}:${name}${state.epSalt || ''}`);
    const g = state.profiles[name]?.gender;
    for (const n of state.villa) if (n !== name && state.profiles[n]?.gender !== g && partnerOf(state, n)) feel(state, n, 'stress', 0.3);
    // (The save has its own opening, save-setup.)
    if (rule !== 'saves') events.push(makeEvent(state, orng, { phase: 'event', kind: 'rule-open', players: [name], aired: true,
      extra: { of: rule, pop: { [name]: { approval: 0, fame: 0.5 } } } }));
    events.push(...r.events);
    if (r.dumped?.length) {
      const scene = dumpingScene(state, ctx.rng, { dumped: r.dumped, channel: 'bombshell' });
      events.push(...scene.events); exits.push(...scene.exits);
    }
  }
  return { events, exits, played };
}

export const MOMENTS = {
  'first-coupling': (state, ctx) => {
    // The couples were made at the start of the episode (nightOneOpening);
    // the night is the bombshell's. Without an opening (a direct call) the
    // coupling happens here, as it used to.
    const fmt = ctx.entry.firstFormat;
    const kissing = fmt === 'icebreakers' || fmt === 'lady-luck';
    const first = ctx.opening || (kissing ? kissFirst(state, ctx.rng, fmt, state.firstIn === 'm' ? 'm' : 'f')
      : fmt && fmt !== 'step-forward' ? firstCouples(state, ctx.rng, fmt)
      : recoupleNight(state, ctx.rng, { dumpSingles: false }));
    const events = [...(ctx.opening ? [] : first.events), ...arrivals(state, ctx, ctx.entry.arrivals?.bombshell || 0)];
    for (const name of state.villa.filter(n => state.ledger.firstEp[n] === state.ep
      && state.profiles[n].role === 'bombshell')) {
      const st = bombshellSteal(state, name, { rng: ctx.rng });
      if (st) events.push(...st.events);
    }
    return { events, exits: [], ballots: first.ballots, extra: { firstFormat: fmt || 'step-forward' } };
  },
  recoupling: (state, ctx) => {
    const pre = arrivals(state, ctx, ctx.entry.arrivals?.bombshell || 0);
    // The final recoupling sends every single home (schedule.js).
    const r = recoupleNight(state, ctx.rng, { dumpSingles: true, pace: ctx.pace, votesAhead: ctx.votesAhead || 0,
      all: !!ctx.entry.finalRecoupling });
    return { events: [...pre, ...r.events], exits: r.exits, ballots: r.ballots };
  },
  'public-vote': (state, ctx) => {
    // Immunity (US 8): a challenge before the vote, and its winners are safe.
    const imm = ctx.entry.immunity ? immunityChallenge(state, { rng: ctx.rng }) : null;
    ctx.immune = imm?.immune || [];
    const r = ctx.entry.coupled ? coupledNight(state, ctx) : voteNight(state, ctx);
    if (imm) { r.events = [...imm.events, ...r.events]; r.extra = { ...(r.extra || {}), immune: imm.immune }; }
    return r;
  },
  bombshell: (state, ctx) => {
    const before = new Set(state.villa);
    const events = arrivals(state, ctx, ctx.entry.arrivals?.bombshell || 0);
    const fresh = state.villa.filter(n => !before.has(n));
    const exits = [];
    let oneOff = null;
    // The sleepover villa takes the whole night: it is the arrivals' rule.
    if (ctx.entry.oneOff === 'sleepover' && fresh.length >= 2) {
      const s = sleepover(state, fresh, { rng: ctx.rng });
      if (s) {
        oneOff = 'sleepover';
        events.push(...s.events);
        if (s.dumped.length) { const d = dumpingScene(state, ctx.rng, { dumped: s.dumped, channel: 'sleepover' }); events.push(...d.events); exits.push(...d.exits); }
        return { events, exits, ballots: [], extra: { arrivalRule: null, oneOff } };
      }
    }
    const rule = ctx.entry.arrivalRule;
    let played = null;
    if (rule) {
      const r = arrivalRule(state, ctx, rule, fresh);
      events.push(...r.events); exits.push(...r.exits); played = r.played;
    }
    if (ctx.entry.oneOff === 'mission' && fresh.length) {
      // Never one the arrival rule already sent home tonight (it picked a
      // dumped boy, and the "nobody goes home" night had him gone).
      const m = secretMission(state, fresh[0], { rng: ctx.rng, tonight: [...fresh, ...exits.map(e => e.name)] });
      if (m) { oneOff = 'mission'; events.push(...m.events); }
    }
    // The row says which rule PLAYED: a save with fewer than two singles was a night of dates.
    return { events, exits, ballots: [], extra: { arrivalRule: played, oneOff } };
  },
};

/** A vote night, in whatever format it plays (see 'public-vote' above for immunity). */
function voteNight(state, ctx) {
  {
    // What counts on the last votes before the final recoupling is how many
    // couples the villa CAN make — the smaller side, with the bombshells still
    // to come filling it — since that recoupling pairs up everyone it can and
    // only the rest go home. Voting a couple out of a villa that can make no
    // more than the week needs left it a couple short.
    const can = couplesPossible(state, ctx.queues?.bombshell || []);
    const lastVotes = (ctx.votesAhead || 0) <= 1;
    // The couples a vote must leave. On the last two: the final's four, and
    // one for each night of the couples-only week. Earlier, the final's four,
    // as it always was — the arrivals still to come refill the villa.
    const target = FINAL_COUPLES + (lastVotes ? ctx.coupledAhead || 0 : 0);
    const enough = lastVotes ? can <= target : state.couples.length <= target;
    // A small villa can reach a vote night with two couples or fewer: a vote
    // would send one of the last couples home before the final. The night
    // plays without one, and the row says no format played.
    // And a villa already down to the final's four couples keeps them, as
    // does one with nobody to spare: a vote sends two or three home, so it
    // needs about one islander to spare a night. Letting a four-couple villa
    // vote because arrivals were still to come was measured, and it cost
    // four-couple finals (15 of 20 at the calibration cast, against 18).
    // A villa of ten or more with the final's four couples and singles about
    // is not a villa with nobody to spare: the singles re-couple with the
    // arrivals still to come. It votes (measured 2026-09-23: without this the
    // first vote was skipped in 23 seasons of 100, always a villa of ten).
    const toComeAll = (ctx.queues?.bombshell?.length || 0) + (ctx.queues?.casa?.length || 0);
    const roomy = state.villa.length >= 2 * (target + 1) && toComeAll >= 2 && state.couples.length >= target;
    // The first vote of the season plays whenever the villa has a couple to
    // spare, whatever the pace: at 10 and 12 islanders the pace sat under 0.8
    // and the first vote was skipped in 40 seasons of 40 (measured 2026-09-23),
    // so a small cast never met the public until the semi-final.
    const firstCall = !!ctx.firstVote && (ctx.surplus ?? 0) >= 2;
    // …and the singles can face it with one to spare: a singles vote sends one
    // home, a couples vote two (seed 2 at twelve: a walkout left nine, four
    // couples and a single, and the first vote skipped).
    const firstSingles = !!ctx.firstVote && (ctx.surplus ?? 0) >= 1;
    // …and the last votes before the final recoupling play whenever the villa
    // can make more couples than the week after it needs, whatever the pace.
    const paceOk = ctx.pace >= 0.8 || firstCall || (lastVotes && can > target);
    // The first vote with the final's four couples and bombshells still to
    // come (counted in the surplus) plays too: the arrivals refill the villa
    // (season 7 audit, seed 6: nine islanders, four couples, the one single
    // held for a bombshell — the first vote skipped).
    const firstRoom = firstCall && state.couples.length >= target && toComeAll >= 1;
    if (state.couples.length < 3 || (enough && !roomy && !firstRoom) || !paceOk) {
      // …unless the villa has single islanders to lose: then the singles face
      // the public (measured: at the calibration cast a quarter of second
      // votes met four couples and three or four singles, who then all went
      // at once at the semi-final).
      // Only the singles nobody is left to arrive for: a bombshell still to
      // come is somebody's partner (measured: dumping those cost the
      // 16-islander cast its four-couple finals, 18 of 20 down to 13).
      let singles = state.villa.filter(n => !partnerOf(state, n));
      // On the last votes, only the singles of the side with more islanders:
      // they are the ones the final recoupling cannot pair. Dumping a single
      // from the short side cost the villa a couple it needed (26 islanders,
      // three seasons of thirty).
      if (lastVotes) {
        const g = x => state.profiles[x].gender;
        const nf = state.villa.filter(x => g(x) === 'f').length, nm = state.villa.length - nf;
        if (nf !== nm) singles = singles.filter(x => g(x) === (nf > nm ? 'f' : 'm'));
      }
      // Counting everyone still to arrive left four singles "all spoken for"
      // on 22-islander seed 9, and its first vote skipped.
      // …and on the first vote nobody is held back at all: the bombshells are
      // cast to whichever side the villa is short of (arrivals()), so a
      // single facing the public never strands an arrival.
      const toCome = firstSingles ? 0 : (ctx.queues?.bombshell?.length || 0) + (ctx.queues?.casa?.length || 0);
      const spare = Math.min(firstSingles ? Math.max(1, Math.round(ctx.pace)) : Math.round(ctx.pace), singles.length - toCome,
        firstSingles ? ctx.surplus : Infinity);
      if (spare > 0 && (paceOk || firstSingles)) return singlesVoteNight(state, ctx, singles, spare);
      return { events: safeNight(state, ctx), exits: [], ballots: [], extra: { dumpFormat: null } };
    }
    // A vote that plays only because it is the first (the pace alone would
    // have skipped it) can spare one couple and nobody else. A format that
    // dumps one of a pair leaves the other single with nobody to re-couple
    // with, and the semi-final then takes the singles: measured at 12
    // islanders, four-couple finals fell from 15 of 20 to 10 until the forced
    // night played as the public's own vote, which sends a whole couple.
    // (The pace runs lower since the couples-only week took its own share of
    // the dumpings: at 0.8 every first vote at 22 islanders was forced.)
    const forced = firstCall && ctx.pace < 0.5;
    // A DOUBLE DUMPING: a villa too full for the nights left sends two
    // couples home, as the real show does when it runs short of time. The
    // couples-only week can then keep to a couple a night; before this, a
    // villa of eight couples reached it and lost three in one night.
    const votesLeft = (ctx.votesAhead || 0) + 1;
    if (!forced && lastVotes && can - target > votesLeft && can - 2 >= target && state.couples.length >= 2) {
      const pv = publicVote(state, { rng: ctx.rng, bottom: 2, immune: ctx.immune || [] });
      const s = dumpingScene(state, ctx.rng, { atRisk: pv.bottom, dumped: pv.bottom.flat(), channel: 'public' });
      return { events: s.events, exits: s.exits, ballots: [], extra: { shares: pv.shares, bottom: pv.bottom, dumpFormat: 'public', double: true } };
    }
    return coupleFormatNight(state, ctx, forced ? 'public' : ctx.entry.dumpFormat);
  }
}

/** How many couples the villa could form, the arrivals to come joining whichever side is short. */
function couplesPossible(state, toCome) {
  // A same-sex couple is a couple already, and takes nobody from either side.
  const gen = x => state.profiles[x].gender;
  const same = state.couples.filter(([a, b]) => gen(a) === gen(b));
  const inSame = new Set(same.flat());
  const n = { f: 0, m: 0 };
  for (const x of state.villa) if (!inSame.has(x)) n[gen(x)]++;
  const left = { f: 0, m: 0 };
  for (const x of toCome) left[state.profiles[x]?.gender || 'f']++;
  for (let i = 0; i < toCome.length; i++) {
    const g = n.f <= n.m ? (left.f ? 'f' : 'm') : (left.m ? 'm' : 'f');
    n[g]++; left[g]--;
  }
  return Math.min(n.f, n.m) + same.length;
}

/** A vote night in the drawn format; every format but save-one sends one couple home. */
function coupleFormatNight(state, ctx, fmt) {
  {
    if (fmt === 'save-one') return saveOneNight(state, ctx);
    if (fmt === 'couples-vote') return couplesVoteNight(state, ctx);
    const pv = publicVote(state, { rng: ctx.rng, bottom: ctx.entry.bottom || 2, immune: ctx.immune || [] });
    if (fmt === 'top-couple-picks') {
      const top = [...pv.shares].sort((a, b) => b.share - a.share).map(s => s.couple).find(c => !pv.bottom.includes(c));
      if (top) return topCoupleNight(state, ctx, pv, top);
    }
    // A favourite couple is needed to pick; when every couple is in the
    // bottom there is none, and the public's own vote stands. The row says
    // which format PLAYED, never only the one that was drawn.
    const played = fmt === 'top-couple-picks' ? 'public' : fmt;
    const vd = villaDumping(state, { format: played, bottom: pv.bottom, rng: ctx.rng });
    const scene = dumpingScene(state, ctx.rng, { atRisk: pv.bottom, dumped: vd.dumped, ballots: vd.ballots,
      channel: played === 'public' ? 'public' : 'villa', format: played });
    return { events: scene.events, exits: scene.exits, ballots: vd.ballots,
      extra: { shares: pv.shares, bottom: pv.bottom, dumpFormat: played } };
  }
}

/**
 * How many couples a night of the couples-only week sends home: one, with the
 * semi-final taking whatever is left over the final's four. A villa that
 * reached the week one couple short keeps its couples tonight and loses one
 * at the semi-final, so nobody arrives at the final with three.
 */
export function coupledDumps(couples, later) {
  const excess = couples - FINAL_COUPLES;
  if (excess <= 0) return 0;
  if (!later) return excess;
  return excess > later ? Math.max(1, excess - later) : 0;
}

/** Anyone single on a couples-only night leaves first: nobody stays in the villa alone now. */
/**
 * A vote night the villa has nobody to spare on (season 101: three in a row
 * played as plain days under a "Public vote" on the timeline). The show says
 * so: the text, the result, and the relief — everyone safe, for tonight.
 */
function safeNight(state, ctx) {
  const villa = state.villa.filter(n => !(state.split && state.casa.includes(n)));
  if (villa.length < 2) return [];
  const reader = villa[Math.floor(ctx.rng() * villa.length)];
  const other = partnerOf(state, reader) || villa.find(n => n !== reader);
  for (const n of villa) { feel(state, n, 'stress', -0.5); feel(state, n, 'security', 0.3); }
  return [makeEvent(state, ctx.rng, { phase: 'firepit', kind: 'vote-safe', players: [reader, other], aired: true,
    extra: { pop: { [reader]: { approval: 0, fame: 0.5 } } } })];
}

function singlesLeave(state, ctx) {
  const singles = state.villa.filter(n => !partnerOf(state, n));
  if (!singles.length) return { events: [], exits: [] };
  return dumpingScene(state, ctx.rng, { dumped: singles, channel: 'recoupling' });
}

/** The vote before the semi-final: couples only, and one couple goes. */
function coupledNight(state, ctx) {
  const pre = singlesLeave(state, ctx);
  const n = coupledDumps(state.couples.length, ctx.coupledAhead || 0);
  if (!n) return { events: [...pre.events, ...safeNight(state, ctx)], exits: pre.exits, ballots: [], extra: { dumpFormat: null } };
  let r;
  if (n === 1) r = coupleFormatNight(state, ctx, ctx.entry.dumpFormat || 'public');
  else {
    const pv = publicVote(state, { rng: ctx.rng, bottom: n });
    const s = dumpingScene(state, ctx.rng, { atRisk: pv.bottom, dumped: pv.bottom.flat(), channel: 'public' });
    r = { events: s.events, exits: s.exits, ballots: [], extra: { shares: pv.shares, bottom: pv.bottom, dumpFormat: 'public' } };
  }
  return { ...r, events: [...pre.events, ...r.events], exits: [...pre.exits, ...r.exits] };
}

// The rest of the season's moments.
Object.assign(MOMENTS, {
  'casa-open': (state, ctx) => {
    const names = ctx.queues.casa.splice(0);
    return { events: names.length ? openCasa(state, names, { ep: state.ep, seed: ctx.seed, rng: ctx.rng }) : [],
      exits: [], ballots: [] };
  },
  'casa-nights': () => ({ events: [], exits: [], ballots: [] }),
  'stick-or-twist': (state, ctx) => {
    if (!state.split) return { events: [], exits: [], ballots: [] };
    const st = stickOrTwist(state, { rng: ctx.rng });
    const exits = st.dumped.map(name => ({ name, verb: EXIT, channel: 'casa' }));
    return { events: st.events, exits, ballots: st.ballots };
  },
  photos: (state, ctx) => {
    const events = [];
    // The photos are a scene, not an inbox: the worst half-dozen get shown.
    // Every photo is a real moment from Casa Amor somebody kept quiet about
    // (user: "don't invent things") — it lands as a Polaroid (vp-pm/stage.js).
    state.photosShown = true;
    // One photo a couple — the worst of it — and only to somebody still with
    // the one in it (season 31: two photos each for the same three couples,
    // and photos shown to exes who had split at the Casa return).
    const pairs = new Set();
    const shown = state.secrets.filter(x => x.casa && !x.known)
      .sort((a, b) => b.severity - a.severity)
      .filter(x => { const k = `${x.who}|${x.partner}`; if (pairs.has(k)) { x.known = true; return false; } pairs.add(k); return true; })
      .slice(0, 6);
    const live = shown.filter(sec => state.villa.includes(sec.who) && state.villa.includes(sec.partner));
    if (live.length) {
      const reader = live[0].partner;
      events.push(makeEvent(state, ctx.rng, { phase: 'firepit', kind: 'photo-text', players: [reader], aired: true, extra: { pop: {} } }));
    }
    for (const sec of shown) {
      sec.known = true;
      sec.public = true;              // the whole villa saw the photos
      if (!state.villa.includes(sec.who) || !state.villa.includes(sec.partner) || partnerOf(state, sec.who) !== sec.partner) continue;
      addBond(sec.who, sec.partner, -1.5 * sec.severity);
      jealousyHit(state, sec.partner, sec.who, sec.with || sec.who, 4 * sec.severity, { confirmed: true });
      addRelationshipDimension(sec.partner, sec.who, 'trust', -1.5 * sec.severity);
      const hidden = state.history.find(e => e.id === sec.eventId);
      if (hidden) airLater(state, hidden);
      events.push(makeEvent(state, ctx.rng, { phase: 'firepit', kind: 'photos', players: [sec.partner, sec.who],
        aired: true, major: [sec.partner, sec.who],
        extra: { secret: sec.id, of: sec.kind || 'pull', faces: [sec.who, sec.with].filter(Boolean), photoEp: sec.ep,
          pop: { [sec.partner]: { approval: 1.5, fame: 2 }, [sec.who]: { approval: -BETRAYAL.photos, fame: 2 } } } }));
      // …and the row that follows, while everyone is still holding the photos.
      if (partnerOf(state, sec.who) === sec.partner) {
        events.push(...confrontation(state, ctx.rng, { p: sec.partner, x: sec.who, sev: sec.severity, rowKind: 'photo-row', splitKind: 'photo-split', phase: 'firepit' }));
      }
    }
    return { events: [...events, ...arrivals(state, ctx, ctx.entry.arrivals?.bombshell || 0)], exits: [], ballots: [] };
  },
  'semi-final': (state, ctx) => {
    // Nobody goes to the final alone: anyone still single leaves, and the
    // couples are trimmed down to four — one couple, normally, since the
    // final recoupling already took the singles — by the public, or by the
    // islanders the villa already dumped (UK 11 d55, UK 12 d56, UK 13 d46).
    const singles = state.villa.filter(n => !partnerOf(state, n));
    const over = coupledDumps(state.couples.length, 0);
    const exes = ctx.entry.dumpFormat === 'ex-islanders' && over > 0 ? returningExes(state) : [];
    if (exes.length) return exIslandersNight(state, ctx, singles, over, exes);
    // The singles first, and in the words of a night nobody picked them:
    // "the public have voted" over somebody nobody voted on was false.
    const events = [], exits = [];
    if (singles.length) {
      const s = dumpingScene(state, ctx.rng, { dumped: singles, channel: 'recoupling' });
      events.push(...s.events); exits.push(...s.exits);
    }
    const pv = over > 0 ? publicVote(state, { rng: ctx.rng, bottom: over }) : null;
    if (pv) {
      const s = dumpingScene(state, ctx.rng, { atRisk: pv.bottom, dumped: pv.bottom.flat(), channel: 'public' });
      events.push(...s.events); exits.push(...s.exits);
    }
    // Four couples or fewer: nobody votes, so no format played (an ex-islander
    // night that was drawn and never happened must not claim it did).
    return { events, exits, ballots: [],
      extra: { shares: pv?.shares || null, bottom: pv?.bottom || null, dumpFormat: pv ? 'public' : null } };
  },
  final: (state, ctx) => {
    // THE FINAL DATES (pm/journey.js): each couple on their last date, shown
    // their own story — then the declarations, which speak from it.
    const events = [];
    const dates = state.couples.map(([a, b], n) => { const d = finalDate(state, ctx.rng, [a, b], n); events.push(...d.events); return d; });
    // THE DECLARATIONS: both of them speak, as the show has it — each opens on
    // the shape of their story and then speaks of one real moment from it
    // (the chapter their film showed), never the same one as their partner.
    state.couples.forEach(([a, b], n) => {
      const { shape, chapters } = dates[n];
      const talk = speechChapters(chapters);
      [[a, b, talk[0]], [b, a, talk[1]]].forEach(([x, y, ch]) => {
        events.push(makeEvent(state, ctx.rng, { phase: 'firepit', kind: 'declaration', players: [x, y], aired: true,
          extra: { of: shape, pop: { [x]: { approval: 2 * romance(x, y) / 10, fame: 2 } } } }));
        if (ch) events.push(makeEvent(state, ctx.rng, { phase: 'firepit', kind: 'speech', players: [x, y], aired: true,
          extra: { of: ch.type, day: state.epDay?.[ch.event.ep] ?? null, pop: { [x]: { approval: 0.5 * romance(x, y) / 10, fame: 0.6 } } } }));
      });
    });
    // Declarations count toward the vote: close the ledger before the country votes.
    closeEpisode(state.ledger, state.ep, ctx.popularity);
    ctx.closed = true;
    const final = finalVote(state, { rng: ctx.rng });
    const envelope = ctx.splitOrStealOn ? splitOrSteal(state, final[0].couple, { rng: ctx.rng }) : null;
    state.winnersCouple = [...final[0].couple];
    // THE RESULT, on screen. The vote was counted and exported and never
    // shown: every final went from the declarations to the reunion with no
    // winner named (read in season 11, 2026-09-23 — §11.5's system that runs
    // and reaches no screen). The host reads it bottom first, as the show does.
    const PLACE = { 1: 'first', 2: 'second', 3: 'third', 4: 'fourth' };
    // …and before a name is read, the host says what this is: the couples
    // standing together, what the public have been voting on, and the prize.
    events.push(makeEvent(state, ctx.rng, { phase: 'final', kind: 'final-open', players: [], aired: true,
      extra: { of: envelope ? 'envelope' : 'plain', pop: {} } }));
    for (const f of [...final].reverse()) {
      const [a, b] = f.couple;
      const won = f.placement === 1;
      events.push(makeEvent(state, ctx.rng, { phase: 'final', kind: 'final-result', players: [a, b], aired: true,
        major: won ? [a, b] : [],
        extra: { of: PLACE[f.placement] || 'fourth', pop: { [a]: { approval: 0, fame: won ? 6 : 2 }, [b]: { approval: 0, fame: won ? 6 : 2 } } } }));
    }
    // The envelope: one of the winners chooses to split the prize or keep it.
    // A steal is the biggest betrayal the show has — the public turn at once.
    if (envelope) {
      const other = final[0].couple.find(n => n !== envelope.holder);
      const steal = envelope.choice === 'steal';
      events.push(makeEvent(state, ctx.rng, { phase: 'final', kind: 'envelope', players: [envelope.holder, other], aired: true,
        major: [envelope.holder, other],
        // Fame only: the public's approval closed with the vote, and a swing
        // here landed on the reunion with nothing on screen to explain it.
        extra: { choice: envelope.choice, pop: { [envelope.holder]: { approval: 0, fame: 4 }, [other]: { approval: 0, fame: 3 } } } }));
      if (steal) { addBond(envelope.holder, other, -6); breakHeart(state, other, envelope.holder, 6); }
    }
    // These scenes come after the ledger closed: their fame carries into the
    // reunion, their major flag must not (season 4: a winner's label jumped
    // three tiers at the reunion, on a row with no major moment for them).
    state.ledger.major = {};
    return { events, exits: [], ballots: [], extra: { final, envelope, shares: final.map(f => ({ couple: f.couple, share: f.share })) } };
  },
  reunion: (state, ctx) => {
    // What they didn't show you: the biggest hidden events, aired at last.
    // The reunion's clips are the scandal (a pull, a kiss, a shared bed, a
    // partner run down behind their back), not somebody telling on it: season
    // 31 aired five tellings and asked the tellers to explain themselves.
    const SCANDAL = new Set(['pull', 'bed-share', 'vent', 'kiss', 'challenge-kiss', 'head-turned', 'jealous-retaliate', 'argument', 'ick']);
    // …and never two clips the same scene was written for: two pulls that drew
    // the same lines played the same exchange twice (season 57).
    const shownScripts = new Set();
    const hidden = state.history.filter(e => !e.aired && SCANDAL.has(e.kind))
      .map(e => [e, Object.values(e.pop).reduce((a, p) => a + Math.abs(p.approval || 0), 0) * (state.secrets.some(s => s.eventId === e.id) ? 3 : 1)])
      .sort((a, b) => b[1] - a[1]).map(([e]) => e)
      .filter(e => { const k = revealExchange(state, e.id); if (k && shownScripts.has(k)) return false; if (k) shownScripts.add(k); return true; })
      .slice(0, 5);
    // The host's welcome, and the winners on the sofa first: how life is
    // since the final (user: "not just a continuation of text without setup").
    const winners = state.winnersCouple || null;
    const open = [makeEvent(state, ctx.rng, { phase: 'reunion', kind: 'reunion-open', players: [], aired: true, extra: { pop: {} } })];
    if (winners && winners.length === 2) open.push(makeEvent(state, ctx.rng, { phase: 'reunion', kind: 'reunion-winners', players: [...winners], aired: true,
      extra: { of: winners.every(n => state.villa.includes(n)) && partnerOf(state, winners[0]) === winners[1] ? 'together' : 'apart', pop: {} } }));
    const events = hidden.map(e => {
      const touched = Object.keys(e.pop);
      airLater(state, e);
      // The reveal names everyone the clip moves, so the row can explain the
      // approval it just cost them: a major moment nobody could see on the
      // screen is the "computed, drawn nowhere" bug class (§11.5 A).
      // How bad it is, for how the studio takes it: a secret, a shared bed or
      // a partner run down is a scandal; a row, an ick or a single islander's
      // chat is not (season 57's studio gasped at "Can I ask you something?").
      const sec = state.secrets.filter(s => s.eventId === e.id).sort((x, y) => (y.severity || 0) - (x.severity || 0))[0];
      const scandal = !!sec || e.kind === 'bed-share' || e.kind === 'vent';
      // What the clip WAS, said before it plays (season 57's reunion quoted
      // "None. I'll get over it." and nobody could tell what it was about):
      // who did it, who with, and who they were coupled with at the time.
      const what = sec ? (sec.kind || (sec.said ? 'said' : 'pull')) : e.kind === 'bed-share' ? 'bed' : e.kind;
      const cast = sec ? [...new Set([sec.who, sec.with || e.players.find(n => n !== sec.who), sec.partner].filter(Boolean))] : e.players;
      return makeEvent(state, ctx.rng, { phase: 'reunion', kind: 'reveal', players: cast,
        aired: true, major: touched, extra: { revealed: e.id, of: scandal ? 'scandal' : 'mild', what, pop: {} } });
    });
    const close = makeEvent(state, ctx.rng, { phase: 'reunion', kind: 'reunion-close', players: [], aired: true, extra: { pop: {} } });
    return { events: [...open, ...events, close], exits: [], ballots: [], extra: { revealed: hidden.map(e => e.id) } };
  },
});
