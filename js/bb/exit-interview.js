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

import { gs, players, seasonConfig } from '../core.js';
import { getPerceivedBond, addBond } from '../bonds.js';
import { pStats } from '../players.js';
import { isSeatedJuror } from './jury.js';
import { campers } from './camp-comeback.js';
import { decideExitInterview, applyRecording, deliverInterviews, heardAbout } from '../exit-interview/core.js';

const store = () => (gs.exitInterviews ||= []);
const active = () => gs.activePlayers || [];
const camp = () => { try { return campers(); } catch { return []; } };
const isJuror = name => { try { return isSeatedJuror(name) || (gs.jury || []).includes(name); } catch { return (gs.jury || []).includes(name); } };
const sequestered = name => isJuror(name) || camp().includes(name);
const goneForGood = name => !!name && !active().includes(name) && !camp().includes(name);
const canHearNow = name => goneForGood(name) && (gs.eliminated || []).includes(name) && !sequestered(name);

const OPS = {
  addBond: (a, b, d) => addBond(a, b, d),
  addPopularity: (name, d) => {
    if (seasonConfig?.popularityEnabled === false) return;
    gs.popularity ||= {};
    gs.popularity[name] = (gs.popularity[name] || 0) + d;
  },
  popularityOf: name => Number(gs.popularity?.[name]) || 0,
  statsOf: name => pStats(name),
};

const perceived = (a, b) => { try { return getPerceivedBond(a, b); } catch { return 0; } };
const archetypeOf = name => players.find(p => p.name === name)?.archetype || '';
const showmancePartner = name => {
  const sh = (gs.showmances || []).find(s => (s.players || []).includes(name) && s.phase !== 'broken-up');
  return sh ? sh.players.find(p => p !== name) || null : null;
};

/** Everything the guest could know the night they left. */
function factsFor(name, week, { how = 'evicted', placement = null, withName = null } = {}) {
  const records = store();
  // The game is over for a finalist: nobody is still in it to message or rank.
  const stillIn = how === 'finalist' ? [] : active().filter(n => n !== name);
  const ballots = (week?.ballots || []).filter(b => b && b.voter);
  const against = ballots.filter(b => b.evict === name).map(b => b.voter);
  const voters = ballots.map(b => b.voter).filter(v => v !== name);
  const byRead = list => list.slice().sort((a, b) => perceived(name, a) - perceived(name, b));
  // They know the count, not the names: they suspect the voters they read
  // worst, as many as the count says (two at most) — and they can be wrong.
  const suspected = how === 'evicted'
    ? byRead(voters).filter(v => perceived(name, v) < 1.5).slice(0, Math.min(2, against.length))
    : [];
  // The Head of Household put them there; that one is no guess.
  if (how === 'evicted' && week?.hoh && week.hoh !== name && perceived(name, week.hoh) < 1.5
    && !suspected.includes(week.hoh)) suspected.unshift(week.hoh);
  const flippers = against.filter(v => perceived(name, v) >= 1.5);
  // A blindside is a count they got wrong: going in, they read a majority of
  // the room as theirs. The first season read had nearly every eviction as a
  // "blindside", because SOME friend nearly always votes against you.
  const readAsMine = voters.filter(v => perceived(name, v) >= 1).length;
  const blindside = how === 'evicted' && against.length > 0 && flippers.length > 0
    && readAsMine * 2 > ballots.length;
  const partner = showmancePartner(name);
  const everyone = [...new Set([...active(), ...(gs.eliminated || [])])].filter(n => n !== name);
  // A finalist's people are the whole cast; anyone else's are those still playing.
  const allies = (how === 'finalist' ? everyone : stillIn).filter(n => perceived(name, n) >= 2)
    .sort((a, b) => perceived(name, b) - perceived(name, a)).slice(0, 2);
  const rivals = everyone.filter(n => perceived(name, n) <= -2)
    .sort((a, b) => perceived(name, a) - perceived(name, b)).slice(0, 2);
  const wins = n => (gs.bb?.stats?.[n]?.hohWins || 0) + (gs.bb?.stats?.[n]?.vetoWins || 0);
  // Who they think wins: the people they rate, and the people who keep winning.
  const predictFrom = stillIn.map(n => [n, 1 + Math.max(0, perceived(name, n)) * 0.3 + wins(n) * 0.5]);
  const answered = new Set(records.filter(r => r.guest === name).flatMap(r => (r.answerBack || []).map(a => a.id)));
  const again = records.some(r => r.guest === name);
  return {
    show: 'big-brother', week: Number(week?.num) || 0, guest: name, with: withName, how, placement,
    // First boot is read off the house, not the interviews: a season saved
    // before exit interviews existed has none, and is not on its first boot.
    juror: how !== 'finalist' && isJuror(name), firstBoot: !again && how === 'evicted'
      && !(gs.eliminated || []).some(n => n !== name && n !== withName),
    again, blindside, backdoor: how === 'evicted'
      // initialNominees, not `nominees`: that one is only written on a cancelled week.
      && (week?.initialNominees || []).length > 0
      && !week.initialNominees.includes(name) && (week?.finalNominees || []).includes(name),
    votesAgainst: against.length, votesTotal: ballots.length, flippers, suspected,
    partner, partnerStillIn: !!partner && stillIn.includes(partner),
    allies, rivals, stillIn,
    outNow: (gs.eliminated || []).filter(n => n !== name && canHearNow(n)),
    heardAboutMe: heardAbout(records, name).filter(h => !answered.has(h.id)),
    profile: { archetype: archetypeOf(name), stats: { ...pStats(name) } },
    predictFrom,
  };
}

function record(name, week, rng, opts) {
  const records = store();
  const rec = decideExitInterview(factsFor(name, week, opts), {
    rng, earlier: records.filter(r => r.show === 'big-brother'),
  });
  if (records.some(r => r.id === rec.id)) rec.id += `-${records.length}`;
  applyRecording(rec, OPS);
  records.push(rec);
  return rec;
}

/**
 * The week's exits: tonight's evictees (and a walkout or expulsion) who are
 * out for good, plus any camper whose camp resolved without them. Then
 * everybody who can hear catches up — a new evictee first, so their own
 * interview can answer what was said about them.
 */
export function recordBBExits(week, { rng = Math.random } = {}) {
  if (!week) return [];
  const leaving = [week.evicted, week.secondEvicted].filter(Boolean)
    .filter((n, i, a) => a.indexOf(n) === i && goneForGood(n));
  // Campers sent home when the camp resolved, interviewed now.
  const campGone = ((gs.bb?.camp) || []).filter(c => c.gone && !c.returned && !c.interviewed);
  const how = name => week.departure?.name === name
    ? (week.departure.kind === 'expulsion' ? 'expelled' : 'walked') : 'evicted';
  const out = [];
  try {
    // The new evictees hear what reached the outside first (unless sequestered).
    deliverInterviews(store(), { at: week.num, canHear: canHearNow, ops: OPS });
    const n = leaving.length;
    leaving.forEach((name, i) => {
      out.push(record(name, week, rng, {
        how: how(name), placement: active().length + n - i,
        withName: n > 1 ? leaving.find(x => x !== name) : null,
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
  return (list || []).filter(r => r && r.show === 'big-brother')
    .map(({ heardBy, ...r }) => JSON.parse(JSON.stringify({ ...r, heard: Object.keys(heardBy || {}) })));
}
