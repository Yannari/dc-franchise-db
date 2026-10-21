// Kristal-talKs exit interviews — what the shows on the shared game state
// (Big Brother and Total Drama: one `gs`, one bond store, one gs.popularity)
// have in common. Each show's adapter says who left, how, and who may hear;
// this file builds what the guest could KNOW and records it.
//
// Spec: docs/superpowers/specs/2026-10-21-kristal-exit-interviews-design.md

import { gs, players, seasonConfig } from '../core.js';
import { getPerceivedBond, addBond } from '../bonds.js';
import { pStats } from '../players.js';
import { decideExitInterview, applyRecording, heardAbout } from './core.js';

export const exitStore = () => (gs.exitInterviews ||= []);

export const HOUSE_OPS = {
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

/**
 * Everything the guest could know the night they left.
 *
 * `ballots` is [{ voter, target }] for the vote they lost (empty when nobody
 * voted). `nominator` is somebody who put them up in public — no guess. The
 * show passes `isJuror`, `canHear` (out and not sequestered) and `wins(name)`.
 */
export function houseFacts({ show, round, name, how = 'evicted', placement = null, withName = null,
  ballots = [], nominator = null, backdoor = false, isJuror = () => false, canHear = () => false,
  wins = () => 0 }) {
  const records = exitStore();
  const active = gs.activePlayers || [];
  // The game is over for a finalist: nobody is still in it to message or rank.
  const stillIn = how === 'finalist' ? [] : active.filter(n => n !== name);
  const cast = ballots.filter(b => b && b.voter);
  const against = cast.filter(b => b.target === name).map(b => b.voter);
  const voters = cast.map(b => b.voter).filter(v => v !== name);
  const byRead = list => list.slice().sort((a, b) => perceived(name, a) - perceived(name, b));
  // They know the count, not the names: they suspect the voters they read
  // worst, as many as the count says (two at most) — and they can be wrong.
  const suspected = how === 'evicted'
    ? byRead([...new Set(voters)]).filter(v => perceived(name, v) < 1.5).slice(0, Math.min(2, against.length))
    : [];
  if (how === 'evicted' && nominator && nominator !== name && perceived(name, nominator) < 1.5
    && !suspected.includes(nominator)) suspected.unshift(nominator);
  const flippers = [...new Set(against.filter(v => perceived(name, v) >= 1.5))];
  // A blindside is a count they got wrong: going in, they read a majority of
  // the room as theirs. The first season read had nearly every eviction as a
  // "blindside", because SOME friend nearly always votes against you.
  const readAsMine = voters.filter(v => perceived(name, v) >= 1).length;
  const blindside = how === 'evicted' && against.length > 0 && flippers.length > 0
    && readAsMine * 2 > cast.length;
  const partner = showmancePartner(name);
  const everyone = [...new Set([...active, ...(gs.eliminated || [])])].filter(n => n !== name);
  // A finalist's people are the whole cast; anyone else's are those still playing.
  const allies = (how === 'finalist' ? everyone : stillIn).filter(n => perceived(name, n) >= 2)
    .sort((a, b) => perceived(name, b) - perceived(name, a)).slice(0, 2);
  const rivals = everyone.filter(n => perceived(name, n) <= -2)
    .sort((a, b) => perceived(name, a) - perceived(name, b)).slice(0, 2);
  // Who they think wins: the people they rate, and the people who keep winning.
  const predictFrom = stillIn.map(n => [n, 1 + Math.max(0, perceived(name, n)) * 0.3 + (Number(wins(n)) || 0) * 0.5]);
  const answered = new Set(records.filter(r => r.guest === name).flatMap(r => (r.answerBack || []).map(a => a.id)));
  const again = records.some(r => r.guest === name);
  return {
    show, week: Number(round) || 0, guest: name, with: withName, how, placement,
    // First boot is read off who has left, not the interviews: a season saved
    // before exit interviews existed has none, and is not on its first boot.
    juror: how !== 'finalist' && isJuror(name),
    firstBoot: !again && how === 'evicted' && !(gs.eliminated || []).some(n => n !== name && n !== withName),
    again, blindside, backdoor: how === 'evicted' && !!backdoor,
    votesAgainst: against.length, votesTotal: cast.length, flippers, suspected,
    partner, partnerStillIn: !!partner && stillIn.includes(partner),
    allies, rivals, stillIn,
    outNow: (gs.eliminated || []).filter(n => n !== name && canHear(n)),
    heardAboutMe: heardAbout(records, name).filter(h => !answered.has(h.id)),
    profile: { archetype: archetypeOf(name), stats: { ...pStats(name) } },
    predictFrom,
  };
}

/** Decide, apply and file one interview. */
export function recordHouseExit(facts, rng = Math.random) {
  const records = exitStore();
  const rec = decideExitInterview(facts, { rng, earlier: records.filter(r => r.show === facts.show) });
  if (records.some(r => r.id === rec.id)) rec.id += `-${records.length}`;
  applyRecording(rec, HOUSE_OPS);
  records.push(rec);
  return rec;
}

/** What a season publishes: its show's decisions, without the hearing stamps. */
export function publishedExits(show, list = gs.exitInterviews) {
  return (list || []).filter(r => r && r.show === show)
    .map(({ heardBy, ...r }) => JSON.parse(JSON.stringify({ ...r, heard: Object.keys(heardBy || {}) })));
}
