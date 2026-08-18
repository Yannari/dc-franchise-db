// ══════════════════════════════════════════════════════════════════════
// bb/camp-director.js — the house elects somebody, and regrets it by Friday
// ══════════════════════════════════════════════════════════════════════
//
// BB21's night one, and the only twist in this catalogue that hands out power
// by ELECTION. From the wiki: "On Night One, the houseguests had to elect a
// 'Camp Director' to rule over the house. The winner would have the power to
// banish four houseguests to the Hit The Road competition where the loser
// would be evicted from the house."
//
// Three things make it worth building, and none of them is the competition:
//
//   · POWER BY POPULARITY, NOT BY WINNING. Every other route to authority in
//     this engine is a competition or a draw. This one is a room deciding who
//     it likes before it knows anybody, which is a different question and
//     produces a different kind of winner — the warm, the loud and the
//     apparently harmless, rather than the strong.
//   · THE BILL ARRIVES IMMEDIATELY. You are elected because you seemed safe,
//     and the first thing the job makes you do is pick four people to put in
//     danger, out loud, on your first night. Nobody elected for being liked
//     keeps the thing they were elected for.
//   · SOMEBODY GOES HOME BEFORE THE FIRST CROWN. A house that has not yet had
//     a Head of Household has already lost a player, and it was decided by a
//     popularity vote and a scramble in the backyard.
//
// ── WHERE IT RUNS, AND WHY THAT IS THE HARD PART ───────────────────────
//
// It evicts BEFORE the first Head of Household competition, so the week's
// bookkeeping has to be done by hand — the ordinary eviction path is a thousand
// lines further down and never runs for this player. `runCallOutChain` in
// `white-locust.js` is the precedent, and the dispatch in `js/bb/week.js` does
// the honours: the roster, the eliminated list and the local `house` array all
// have to be narrowed together, or the season plays its first competition
// against somebody who has already left the building.
import { gs } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getPerceivedBond, addBond } from '../bonds.js';
import { aptitude, makePicker } from '../bb-comps/_shared.js';
import { stableRng } from './knowledge.js';

const beat = (text, players, badgeText, badgeClass = 'gold') =>
  ({ text, players: [...players].filter(Boolean), badgeText, badgeClass });

/** How many the Director sends to the backyard. Canon, and load-bearing. */
export const BANISH_COUNT = 4;

/**
 * What Hit The Road asks for.
 *
 * A scramble in the dirt with something to carry: the body, and the will to
 * keep going. Deliberately NOT mental — nobody banished on night one has had
 * time to learn anything worth thinking about.
 */
const ROAD_MIX = { physical: 0.34, endurance: 0.32, temperament: 0.20, boldness: 0.14 };

const NOMINATED_FOR = [
  (n) => `${n} is put forward by somebody ${n} spoke to for four minutes this afternoon, which is how this works tonight.`,
  (n, p) => `Somebody says ${n}'s name and three people nod, and that is a candidacy. ${p.Sub} did not ask for it.`,
  (n) => `${n} is nominated for the job and does the smart thing, which is to look delighted about it.`,
  (n, p) => `${n} puts ${p.ref} forward, out loud, before anybody else can. It is either brave or the first mistake of the season.`,
];
const ELECTED = [
  (n, p) => `${n} is elected Camp Director. ${p.Sub} ${p.sub === 'they' ? 'have' : 'has'} been in this house for six hours and already owns it.`,
  (n) => `The vote goes to ${n}, who is now the most powerful person in a building where nobody has done anything yet.`,
  (n, p) => `${n} takes it comfortably. Everybody who voted for ${p.obj} is about to find out what they voted for.`,
  (n, p) => `${n} is the Camp Director. ${p.Sub} smiled at the right people at the right time, and that turns out to have been the whole competition.`,
];
const BANISHED = [
  (d, n) => `${d} names ${n}, and does not look at ${n} while doing it.`,
  (d, n, p) => `${n} is banished. ${p.Sub} ${p.sub === 'they' ? 'were' : 'was'} still holding a drink somebody handed ${p.obj} on the way in.`,
  (d, n) => `${d} says ${n}'s name with a reason attached. Nobody believes the reason and everybody writes down the name.`,
  (d, n, p) => `${n} hears it, nods once, and starts counting who is left — the correct response, and no help at all tonight.`,
];
const SPARED = [
  (n) => `${n} is not named, and spends the rest of the night working out whether that was mercy or arithmetic.`,
  (n, p) => `${n} is safe, and is careful not to look relieved anywhere the four can see ${p.obj}.`,
];
const ROAD = [
  (n, p, t) => `${n} goes at it like the season depends on it, because tonight it does, and finishes on ${t}.`,
  (n, p, t) => `${n} paces ${p.ref}, which is the right call in theory, and it is worth ${t}.`,
  (n, p, t) => `${n} falls twice, gets up twice, and posts ${t} with half the backyard on ${p.posAdj} shoulders.`,
  (n, p, t) => `${n} is the only one out there not talking. ${t}, and no explanation offered.`,
];

/**
 * Who the room elects, before it knows anybody.
 *
 * SOCIAL, and the warmth they have already generated, and nothing else. There
 * is no competition here to launder it through — a night-one election is a
 * popularity contest by definition, and modelling it as anything cleverer
 * would be inventing information nobody in that house has yet.
 *
 * Strategic players do badly ON PURPOSE. On night one, being visibly clever is
 * a reason not to hand somebody the only power in the building.
 */
function electability(name, house) {
  const st = pStats(name) || {};
  const others = house.filter(o => o !== name);
  const warmth = others.length
    ? others.reduce((sum, o) => {
      let b = 0;
      try { b = getPerceivedBond(name, o); } catch { b = 0; }
      return sum + Math.max(0, b);
    }, 0) / others.length
    : 0;
  return (st.social ?? 5) * 0.55
    + (st.boldness ?? 5) * 0.18
    + warmth * 0.9
    - (st.strategic ?? 5) * 0.22;
}

/**
 * Who the Director sends to the backyard.
 *
 * The honest model of somebody handed this on night one: you cannot banish on
 * a game read, because there is no game yet. So it is threat and discomfort —
 * the physically obvious, and the people you have not clicked with — with a
 * tilt away from anybody you have already warmed to.
 *
 * The noise term is heavy on purpose. Half of this decision really is
 * arbitrary, and the house will spend six weeks assuming it was not.
 */
function banishScore(director, name, rng) {
  const st = pStats(name) || {};
  let bond = 0;
  try { bond = getPerceivedBond(director, name); } catch { bond = 0; }
  const threat = ((st.physical ?? 5) + (st.endurance ?? 5)) / 2;
  return threat * 0.5 - bond * 1.1 + (rng() - 0.5) * 5.5;
}

/**
 * Night one: the election, the banishment, and the backyard.
 *
 * @returns {object|null} `{ evicted, director, banished, survivors, act }`, or
 *   null when the house is too small for the twist to mean anything.
 */
export function runCampDirector(week, house, {
  rng = stableRng('camp-director', gs?.bb?.seasonSalt || 0, week?.num || 1),
} = {}) {
  const room = (house || []).filter(Boolean);
  // Four banished out of a house that still has to play a whole season. Below
  // this the twist is an early eviction with extra steps.
  if (room.length < 8) return null;
  const say = makePicker(rng);
  const beats = [];

  // ── THE ELECTION ──
  const standing = room
    .map(name => ({ name, score: electability(name, room) + (rng() - 0.5) * 2.4 }))
    .sort((a, b) => b.score - a.score);
  const director = standing[0].name;
  for (const { name } of standing.slice(0, 3)) {
    beats.push(beat(say(NOMINATED_FOR)(name, pronouns(name)), [name], 'PUT FORWARD', 'blue'));
  }
  beats.push(beat(say(ELECTED)(director, pronouns(director)), [director],
    'CAMP DIRECTOR', 'gold'));

  // ── THE BANISHMENT ──
  const pool = room.filter(n => n !== director);
  const banished = [...pool]
    .sort((a, b) => banishScore(director, b, rng) - banishScore(director, a, rng))
    .slice(0, Math.min(BANISH_COUNT, pool.length - 1));
  for (const name of banished) {
    beats.push(beat(say(BANISHED)(director, name, pronouns(name)), [director, name],
      'HIT THE ROAD', 'red'));
    // ── THE BILL FOR HAVING BEEN LIKED ──
    //
    // Elected for being warm, and the job's first act is to put four people in
    // danger by name. Every one of them remembers who said it, and this is the
    // grudge the rest of the season is built on.
    try { addBond(name, director, -2.2); } catch { /* no bond, no grievance */ }
  }
  const spared = pool.filter(n => !banished.includes(n));
  if (spared.length) {
    const who = spared[Math.floor(rng() * spared.length)] || spared[0];
    beats.push(beat(say(SPARED)(who, pronouns(who)), [who], 'NOT NAMED', 'grey'));
  }
  if (!gs.popularity) gs.popularity = {};
  // Publicly aiming at four people on night one is not a good look, and the
  // audience is watching this house before the house is.
  gs.popularity[director] = (gs.popularity[director] || 0) - 2;

  // ── HIT THE ROAD ──
  const times = banished
    .map(name => ({ name, score: aptitude(name, ROAD_MIX) + (rng() - 0.5) * 5.0 }))
    .sort((a, b) => b.score - a.score);
  for (const t of times) {
    beats.push(beat(say(ROAD)(t.name, pronouns(t.name), t.score.toFixed(1)),
      [t.name], 'RAN IT', 'blue'));
  }
  const evicted = times[times.length - 1].name;
  const survivors = times.slice(0, -1).map(t => t.name);

  beats.push(beat(
    `${evicted} finishes last and is out of the house before a single Head of Household has been crowned. `
      + `${survivors.join(', ')} walk back inside knowing exactly whose idea that was.`,
    [evicted, director], 'EVICTED, NIGHT ONE', 'red'));

  // Surviving it binds the ones who did. They were named together, in public,
  // by one person — the fastest alliance this format knows how to make.
  for (let i = 0; i < survivors.length; i++) {
    for (let j = i + 1; j < survivors.length; j++) {
      try { addBond(survivors[i], survivors[j], 1.4); } catch { /* texture */ }
    }
  }
  if (survivors.length >= 2) {
    beats.push(beat(
      `${survivors[0]} and ${survivors[1]} were strangers this morning and have now survived the same night `
        + 'together, which in this house is most of the way to an alliance.',
      survivors.slice(0, 2), 'BOUND BY IT', 'blue'));
  }

  return {
    evicted,
    director,
    banished: [...banished],
    survivors,
    act: {
      type: 'camp-director',
      week: week?.num || 1,
      director,
      standing: standing.slice(0, 3).map(s => ({ name: s.name, score: +s.score.toFixed(1) })),
      banished: [...banished],
      times: times.map(t => ({ name: t.name, score: +t.score.toFixed(1) })),
      survivors,
      evicted,
      beats,
    },
  };
}
