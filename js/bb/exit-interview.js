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
    // out on a clock, not a vote: Kristal's 'lost-challenge' interview, in Big Brother's own words
    : special.has(name) ? 'lost-challenge' : 'evicted';
  const voted = leaving.filter(n => !special.has(n));
  const out = [];
  try {
    // The new evictees hear what reached the outside first (unless sequestered).
    deliverInterviews(store(), { at: week.num, canHear: canHearNow, ops: OPS });
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
