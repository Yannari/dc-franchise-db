// Can this life have happened, in this order?
//
// The log is append-only and the resolver has learned its rules one bug at a
// time — availability locks, `after` replies, per-track positions — which means
// rows written before a rule existed do not obey it. Alejandro's page was the
// proof: he started seeing Bridgette in one off-season, started seeing Lindsay
// six seasons later without either relationship ending, moved in with both, and
// the record only closed the first one three years after the second began.
//
// So the same rules, applied to a log that already exists. Two callers:
//
//   - `auditLife` reports what cannot be true, for a page or a script.
//   - `repairLife` returns the edits that would fix it — never a rewrite of
//     somebody's history, only the smallest change that makes it possible:
//     re-date an ending that came too late, drop a row that could not have
//     happened from where the person was standing.
//
// NOTHING HERE DELETES SILENTLY. Every repair says what it did and why, because
// canon belongs to the author and this is a suggestion with a reason attached.

import { kindOf, order, allowedFrom, TRACK_START } from './life-events.js';

const isRel = e => kindOf(e.kind)?.track === 'relationship';
const ENDINGS = new Set(['broke-up', 'quietly-ended', 'divorced', 'separated']);
const STARTS = new Set(['dating']);

/** The other half of a two-person row, from one side's point of view. */
const otherIn = (e, slug) => (e.player === slug ? e.whom : e.player) || null;

/**
 * Everything in this log that cannot be true, oldest first.
 *
 * `events` is the whole franchise log; `seasonRank` is what orders it. Returns
 * one row per problem: `{ event, why, fix }` where `fix` is what `repairLife`
 * would do about it.
 */
export function auditLife(events = [], { seasonRank = null, statuses = ['approved'] } = {}) {
  const live = events.filter(e => e && statuses.includes(e.status)).slice().sort(order(seasonRank));
  const problems = [];

  // ── one relationship at a time ────────────────────────────────────
  //
  // Walked per PERSON rather than per couple, because the overlap is a fact
  // about a person: two people can each be in one relationship and still be
  // in the same one.
  const partnerNow = new Map();     // slug -> who they are with
  const startedAt = new Map();      // pairKey -> index of the row that started it
  const people = new Set();
  for (const e of live) { people.add(e.player); if (e.whom) people.add(e.whom); }

  live.forEach((e, i) => {
    if (!isRel(e)) return;
    for (const slug of [e.player, e.whom].filter(Boolean)) {
      const other = otherIn(e, slug);
      const current = partnerNow.get(slug) || null;
      if (STARTS.has(e.kind)) {
        if (current && current !== other) {
          problems.push({
            event: e, at: i, slug,
            why: `${slug} was already seeing ${current} when this started`,
            fix: 'end-the-first',
            with: current,
          });
        }
        partnerNow.set(slug, other);
        startedAt.set([slug, other].sort().join('|'), i);
      } else if (ENDINGS.has(e.kind)) {
        // An ending that names somebody they are not with is a fact about the
        // other person's page, not this one's — deriveState already ignores
        // it, and so does this.
        if (current && current === other) partnerNow.set(slug, null);
      } else if (current === other || !current) {
        // went-public / moved-in / engaged / wedding advance whoever it names.
        partnerNow.set(slug, other);
      } else {
        problems.push({
          event: e, at: i, slug,
          why: `${slug} was with ${current}, not ${other}`,
          fix: 'drop',
        });
      }
    }
  });

  // ── you cannot do a thing from where you are not standing ─────────
  //
  // The same gate the resolver draws through, applied backwards over the log:
  // graduating without enrolling, resigning from a job you were laid off from,
  // a reply with nothing to reply to.
  const stageBy = new Map();        // slug -> { track -> stage }
  const seenKinds = new Map();      // slug -> Set of kinds so far
  live.forEach((e, i) => {
    const def = kindOf(e.kind);
    if (!def) return;
    for (const slug of [e.player, e.whom].filter(Boolean)) {
      const stages = stageBy.get(slug) || {};
      const seen = seenKinds.get(slug) || new Set();
      if (def.needsStage) {
        const at = stages[def.track] || TRACK_START[def.track] || null;
        if (!allowedFrom(e.kind, { trackStage: stages })) {
          problems.push({
            event: e, at: i, slug,
            why: `${slug} was ${at || 'nowhere'} on the ${def.track} track`,
            fix: 'drop',
          });
        }
      }
      if (def.once && seen.has(e.kind)) {
        problems.push({ event: e, at: i, slug, why: `${e.kind} happens once`, fix: 'drop' });
      }
      if (def.after && !def.after.some(k => seen.has(k))) {
        problems.push({
          event: e, at: i, slug,
          why: `nothing for ${e.kind} to answer`,
          fix: 'drop',
        });
      }
      seen.add(e.kind);
      seenKinds.set(slug, seen);
      if (def.stage) { stages[def.track] = def.stage; stageBy.set(slug, stages); }
    }
  });

  return problems;
}

/**
 * The log, made possible.
 *
 * THE SMALLEST CHANGE THAT WORKS, in this order of preference:
 *
 *   1. An overlap whose first relationship DOES end later is re-dated, not
 *      deleted. Both relationships happened; the record simply closed the
 *      first one years after it was over, which is a filing error rather than
 *      a contradiction. The ending moves to the off-season before the second
 *      one starts.
 *   2. An overlap with no ending anywhere gets one written, in the same place.
 *   3. Anything still impossible is dropped, with its reason.
 *
 * Returns `{ events, changes }`. The input is not mutated.
 */
export function repairLife(events = [], { seasonRank = null } = {}) {
  const out = events.map(e => ({ ...e }));
  const changes = [];
  const live = () => out.filter(e => e.status === 'approved').slice().sort(order(seasonRank));

  // ── 1 & 2: the overlaps ──
  for (const p of auditLife(out, { seasonRank })) {
    if (p.fix !== 'end-the-first') continue;
    const ordered = live();
    const startIdx = ordered.findIndex(e => e === p.event
      || (e.kind === p.event.kind && e.player === p.event.player && e.whom === p.event.whom
        && e.afterSeason === p.event.afterSeason));
    if (startIdx < 0) continue;
    const isThePair = e => [e.player, e.whom].includes(p.slug) && [e.player, e.whom].includes(p.with);
    // The ending that exists but was filed too late.
    const late = ordered.find((e, i) => i > startIdx && isRel(e) && ENDINGS.has(e.kind) && isThePair(e));
    // Where it should sit: the off-season the new relationship started in, one
    // step ahead of it so the order reads end-then-begin.
    const seasonId = p.event.afterSeason;
    if (late) {
      const row = out.find(e => e === late) || out.find(e =>
        e.kind === late.kind && e.player === late.player && e.whom === late.whom
        && e.afterSeason === late.afterSeason);
      if (row) {
        changes.push({ kind: 'redated', event: `${row.player}/${row.whom} ${row.kind}`,
          from: row.afterSeason, to: seasonId,
          why: `${p.slug} started seeing ${otherIn(p.event, p.slug)} in ${seasonId}; `
            + `the record closed ${p.with} in ${row.afterSeason}` });
        row.afterSeason = seasonId;
        row.seq = Math.max(0, Number(p.event.seq) || 1) - 0.5;
      }
    } else {
      const row = {
        player: p.slug, whom: p.with, kind: 'quietly-ended', afterSeason: seasonId,
        seq: Math.max(0, Number(p.event.seq) || 1) - 0.5, status: 'approved',
        note: 'written by the consistency pass: a relationship that never closed',
      };
      out.push(row);
      changes.push({ kind: 'closed', event: `${p.slug}/${p.with} quietly-ended`,
        to: seasonId, why: `${p.slug} started seeing ${otherIn(p.event, p.slug)} and was never single` });
    }
  }

  // ── 3: what is still impossible ──
  const drop = new Set();
  for (const p of auditLife(out, { seasonRank })) {
    if (p.fix !== 'drop') continue;
    drop.add(p.event);
    changes.push({ kind: 'dropped', event: `${p.event.player} ${p.event.kind}`,
      at: p.event.afterSeason, why: p.why });
  }
  return { events: out.filter(e => !drop.has(e)), changes };
}
