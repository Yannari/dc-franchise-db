// Kristal-talKs exit interviews — Big Brother.
//
// Spec: docs/superpowers/specs/2026-10-21-kristal-exit-interviews-design.md
// Core: js/exit-interview/core.js (decides; this file only reads the house).
//
// Called at the end of every week and on finale night. Nothing here reaches a
// screen or the text backlog — the user, 2026-10-21: "nothing shown in the
// simulator, it's outside the game." What it changes is real: the guest's fans
// and the fans of whoever they name (America's Favourite reads gs.popularity),
// and the bond with each person named, once that person hears it.
//
// WHO CAN HEAR: out of the house for good and not sequestered. Jurors record
// the week they leave like everybody else, but hear nothing until the final
// vote is in — a podcast never reaches a juror's ballot. A living Camp
// Comeback camper is still in the game, so records nothing and hears nothing
// until the camp resolves.

import { gs } from '../core.js';
import { isSeatedJuror, weekExits } from './jury.js';
import { campers } from './camp-comeback.js';
import { deliverInterviews } from '../exit-interview/core.js';
import { exitRng } from '../exit-interview/aired.js';
import { exitStore as store, HOUSE_OPS as OPS, houseFacts, recordHouseExit, publishedExits } from '../exit-interview/house.js';

const active = () => gs.activePlayers || [];
const camp = () => { try { return campers(); } catch { return []; } };
const isJuror = name => { try { return isSeatedJuror(name) || (gs.jury || []).includes(name); } catch { return (gs.jury || []).includes(name); } };
const sequestered = name => isJuror(name) || camp().includes(name);
const goneForGood = name => !!name && !active().includes(name) && !camp().includes(name);
const canHearNow = name => goneForGood(name) && (gs.eliminated || []).includes(name) && !sequestered(name);

function record(name, week, rng, { how = 'evicted', placement = null, withName = null } = {}) {
  return recordHouseExit(houseFacts({
    show: 'big-brother', round: week?.num, name, how, placement, withName,
    ballots: (week?.ballots || []).map(b => ({ voter: b?.voter, target: b?.evict })),
    // The Head of Household put them there; that one is no guess.
    nominator: week?.hoh || null,
    // initialNominees, not `nominees`: that one is only written on a cancelled week.
    backdoor: (week?.initialNominees || []).length > 0
      && !week.initialNominees.includes(name) && (week?.finalNominees || []).includes(name),
    isJuror, canHear: canHearNow,
    wins: n => (gs.bb?.stats?.[n]?.hohWins || 0) + (gs.bb?.stats?.[n]?.vetoWins || 0),
  }), rng);
}

/**
 * The week's exits: tonight's evictees (and a walkout or expulsion) who are
 * out for good, plus any camper whose camp resolved without them. Then
 * everybody who can hear catches up — a new evictee first, so their own
 * interview can answer what was said about them.
 */
export function recordBBExits(week, { rng = Math.random } = {}) {
  if (!week) return [];
  // every exit of the week, in order: the White Locust's loser (out before the vote) first (bb/jury.js weekExits;
  // the user, 2026-10-29: "make sure the export do the kristal talk interview with both evicted")
  const exits = weekExits(week).filter((x, i, a) => a.findIndex(y => y.name === x.name) === i && goneForGood(x.name));
  const leaving = exits.map(x => x.name);
  const special = new Map(exits.filter(x => x.how !== 'eviction').map(x => [x.name, x.how]));
  // who called them up: the chain's failed round (bb/white-locust.js)
  const callerOf = name => ((week.acts || []).find(a => a?.type === 'white-locust')?.rounds || [])
    .find(r => r && !r.made && r.target === name)?.caller || null;
  // Campers sent home when the camp resolved, interviewed now.
  const campGone = ((gs.bb?.camp) || []).filter(c => c.gone && !c.returned && !c.interviewed);
  const how = name => week.departure?.name === name
    ? (week.departure.kind === 'expulsion' ? 'expelled' : 'walked')
    // out on a clock, not a vote: Kristal's 'lost-challenge' interview, in Big Brother's own words (a premiere's
    // evictee was voted out, by the house or the BB Swap)
    : special.has(name) && special.get(name) !== 'premiere' ? 'lost-challenge' : 'evicted';
  const voted = leaving.filter(n => !special.has(n));
  const out = [];
  try {
    // The new evictees hear what reached the outside first (unless sequestered).
    deliverInterviews(store(), { at: week.num, canHear: canHearNow, ops: OPS });
    out.push(...catchUp(week, rng));
    const n = leaving.length;
    leaving.forEach((name, i) => {
      out.push(record(name, special.has(name) ? { ...week, ballots: [] } : week, rng, {
        how: how(name), placement: active().length + n - i,
        // the chain's loser names whoever called them up; a double vote's two name each other
        withName: special.has(name) ? callerOf(name) : voted.length > 1 ? voted.find(x => x !== name) : null,
      }));
    });
    for (const c of campGone) {
      c.interviewed = true;
      const evictedWeek = (gs.bb?.weeks || []).find(w => w.evicted === c.name || w.secondEvicted === c.name) || week;
      out.push(record(c.name, { ...evictedWeek, num: week.num }, rng, { how: 'evicted', placement: active().length + 1 }));
    }
    deliverInterviews(store(), { at: week.num, canHear: canHearNow, ops: OPS });
  } catch (e) {
    if (typeof process !== 'undefined' && process.env?.EXIT_DEBUG) throw e;
  }
  return out;
}

/**
 * An earlier week's exit that never sat down with Kristal, recorded now under its own week. Before 2026-10-29 only
 * `week.evicted` was interviewed, so the White Locust's loser in a season already under way had no interview at all
 * (the user: "i dont see nina final interview exit"). Only weeks the interviews were running for (one of that week's
 * exits has a record), so a season saved before Kristal-talKs existed does not record a whole season at once.
 */
function catchUp(week, rng, { andThisWeek = false } = {}) {
  const weeks = (gs.bb?.weeks || []).filter(w => w && w !== week && Number(w.num) < Number(week.num));
  const all = [...weeks, week].flatMap(w => weekExits(w).map(x => ({ ...x, week: w })))
    .filter((x, i, a) => a.findIndex(y => y.name === x.name && y.week === x.week) === i);
  const live = new Set(store().filter(r => r.show === 'big-brother').map(r => `${r.week}|${r.guest}`));
  const known = new Set(store().filter(r => r.show === 'big-brother').map(r => r.guest));
  const out = [];
  all.forEach((x, i) => {
    if ((x.week === week && !andThisWeek) || known.has(x.name) || !goneForGood(x.name)) return;
    if (!weekExits(x.week).some(y => live.has(`${x.week.num}|${y.name}`))) return;
    const chain = x.how === 'white-locust'
      ? ((x.week.acts || []).find(a => a?.type === 'white-locust')?.rounds || []).find(r => r && !r.made && r.target === x.name)?.caller || null
      : null;
    // everybody who left from this exit on is below them, with tonight's still to come
    const below = all.length - i;
    out.push(record(x.name, x.how === 'eviction' ? x.week : { ...x.week, ballots: [] }, rng, {
      how: x.how === 'eviction' || x.how === 'premiere' ? 'evicted' : 'lost-challenge',
      placement: active().length + below,
      withName: chain,
    }));
    known.add(x.name);
  });
  return out;
}

/**
 * Publishing (the live sync, the season export): the same catch-up, the last week played included, so a season
 * saved before 2026-10-29 sends its White Locust loser's interview without playing another week first (the user:
 * "rn with just ep11 it doesnt add the kristal exit interview"). Recording twice is impossible: a guest with an
 * interview on file is skipped.
 */
export function catchUpBBExits() {
  const weeks = gs.bb?.weeks || [];
  const last = weeks[weeks.length - 1];
  if (!last) return [];
  try {
    return catchUp(last, exitRng('bb-catch-up', last.num, (gs.activePlayers || []).join()), { andThisWeek: true });
  } catch (e) {
    if (typeof process !== 'undefined' && process.env?.EXIT_DEBUG) throw e;
    return [];
  }
}

/**
 * Finale night, after the result: the houseguest cut at three records as the
 * last juror, each finalist records their own, and then everybody — the jury
 * included, the vote being in — hears everything they have not.
 */
export function recordBBFinaleExits({ week = 0, cut = null, winner = null, runnerUp = null, rng = Math.random } = {}) {
  const out = [];
  try {
    const night = { num: week, ballots: [] };
    const everyone = () => true;
    deliverInterviews(store(), { at: week, canHear: n => n !== winner && n !== runnerUp && n !== cut, ops: OPS });
    if (cut && !store().some(r => r.guest === cut && r.week === week)) {
      out.push(record(cut, night, rng, { how: 'finalist', placement: 3 }));
    }
    if (runnerUp) out.push(record(runnerUp, night, rng, { how: 'finalist', placement: 2 }));
    if (winner) out.push(record(winner, night, rng, { how: 'finalist', placement: 1 }));
    deliverInterviews(store(), { at: week, canHear: everyone, ops: OPS });
  } catch (e) {
    if (typeof process !== 'undefined' && process.env?.EXIT_DEBUG) throw e;
  }
  return out;
}

/** What the season publishes: the decisions, without the hearing stamps. */
export function publishedExitInterviews(list = gs.exitInterviews) {
  return publishedExits('big-brother', list);
}
