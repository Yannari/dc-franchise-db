// Kristal-talKs exit interviews — the shows that play a whole season from a
// seed and air it from a queue (The Traitors, Drag Race, Perfect Match, The
// Circle, The Challenge, Ridonculous Race).
//
// Spec: docs/superpowers/specs/2026-10-21-kristal-exit-interviews-design.md
//
// ── RECORDED AS EACH EPISODE AIRS ──
//
// These seasons are generated in one deterministic block and re-run by
// replaying that block with a swapped seed, so nothing may reach inside it
// without breaking a re-run or an old save's replay. The interviews are
// recorded when each row AIRS: who left is the difference between the room
// before the row and the room it leaves (`gs.activePlayers`), and the dice are
// the interview's own (seeded off the season and the guest), never the block's.
// What they move — fans and bonds — lands on the season as it stands, the
// published record and Dramagram; it cannot rewrite a season already played.
//
// A guest's own bonds stop changing once they leave, so reading them when the
// row airs reads them as they were on the way out.

import { gs } from '../core.js';
import { deliverInterviews } from './core.js';
import { HOUSE_OPS as OPS, exitStore as store, houseFacts, recordHouseExit } from './house.js';

/** A seeded stream for one interview: same season, same guest, same dice. */
export function exitRng(...parts) {
  let h = 2166136261;
  for (const ch of parts.join('|')) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  let s = h >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

const outNow = (living, show) => {
  const recorded = new Set(store().filter(r => r.show === show).map(r => r.guest));
  return name => !living.includes(name) && recorded.has(name);
};

/**
 * After a row airs.
 *
 * `adapter = { show, seed, round, ballots(row) -> [{voter,target}], howOf(name,row) -> how,
 *   pairOf(name,row) -> partner|null, finalists(row) -> names|null, winners(row) -> names }`
 * `before` is the room as it stood before the row (an array of names).
 */
export function recordAiredExits(before, row, adapter) {
  const out = [];
  if (!row || !Array.isArray(before)) return out;
  const show = adapter.show;
  try {
    const living = [...(gs.activePlayers || [])];
    const round = Number(adapter.round?.(row) ?? row.num) || 0;
    const canHear = outNow(living, show);
    const finalists = gs.phase === 'complete' ? (adapter.finalists?.(row) || living) : null;
    const winners = new Set(finalists ? (adapter.winners?.(row) || []) : []);
    const leaving = before.filter(n => !living.includes(n) && !store().some(r => r.show === show && r.guest === n && r.week === round));
    deliverInterviews(store(), { at: round, canHear, ops: OPS });
    // Already out before tonight: everybody with an interview on file.
    const goneBefore = [...new Set(store().filter(r => r.show === show && r.kind !== 'finalist').map(r => r.guest))];
    const facts = (name, how, placement, withName, gone) => {
      const f = houseFacts({
        show, round, name, how, placement, withName,
        ballots: how === 'evicted' ? (adapter.ballots?.(row) || []) : [],
        canHear, isJuror: () => false, gone, publicVotes: !!adapter.publicVotes,
      });
      // The show's own story of them; its partner when the franchise's showmances
      // don't know it (Perfect Match couples are its own, not gs.showmances).
      const story = adapter.story?.(name, row) || null;
      const partner = f.partner || story?.partner?.who || null;
      return { ...f, story, partner, partnerStillIn: !!partner && f.stillIn.includes(partner) };
    };
    const howOfName = n => adapter.howOf?.(n, row) || 'evicted';
    leaving.forEach((name, i) => {
      const how = howOfName(name);
      const pair = adapter.pairOf?.(name, row) || null;
      // Two out through the SAME door is a double night; a banishment and a
      // murder on one night are two different stories.
      const sameDoor = leaving.find(x => x !== name && howOfName(x) === how) || null;
      out.push(recordHouseExit(facts(name, how, living.length + leaving.length - i,
        pair && leaving.includes(pair) ? pair : sameDoor,
        [...goneBefore, ...leaving.slice(0, i)]),
      exitRng(show, adapter.seed ?? '', round, name)));
    });
    if (finalists) {
      // Finale night, after the result: every finalist records their own, and
      // then everyone hears everything.
      const ranked = [...finalists.filter(n => winners.has(n)), ...finalists.filter(n => !winners.has(n))];
      ranked.slice().reverse().forEach(name => {
        if (store().some(r => r.show === show && r.guest === name && r.kind === 'finalist')) return;
        out.push(recordHouseExit(facts(name, 'finalist', winners.has(name) ? 1 : ranked.indexOf(name) + 1, null, goneBefore),
          exitRng(show, adapter.seed ?? '', 'finale', name)));
      });
    }
    deliverInterviews(store(), { at: round, canHear: finalists ? () => true : outNow(living, show), ops: OPS });
  } catch (e) {
    if (typeof process !== 'undefined' && process.env?.EXIT_DEBUG) throw e;
  }
  return out;
}

/**
 * Wrap a show's "air the next row" function. Keeps the interviews that aired
 * when a re-run rebuilds `gs` wholesale, drops what an abandoned timeline
 * recorded (anything at or after the row now airing), then records this row.
 */
export function airedEpisode(show, body, adapterFor) {
  return function airWithInterviews(...args) {
    const before = [...(gs?.activePlayers || [])];
    const kept = Array.isArray(gs?.exitInterviews) ? gs.exitInterviews : null;
    const row = body(...args);
    if (!row || row.format && row.format !== show) return row;
    try {
      const round = Number(row.num) || 0;
      if (kept && gs.exitInterviews !== kept) gs.exitInterviews = kept;
      gs.exitInterviews = (gs.exitInterviews || []).filter(r => r.show !== show || r.week < round);
      for (const r of gs.exitInterviews) {
        if (r.show !== show) continue;
        for (const [k, v] of Object.entries(r.heardBy || {})) if (v >= round) delete r.heardBy[k];
      }
      // The first night starts from the room the show says it started with —
      // never the whole cast: Perfect Match opens with half its islanders and
      // The Circle brings people in later, and somebody who has not arrived
      // has not left.
      const room = before.length ? before : (adapterFor(show)?.startRoom?.(row) || []);
      recordAiredExits(room, row, adapterFor(show));
    } catch (e) {
      if (typeof process !== 'undefined' && process.env?.EXIT_DEBUG) throw e;
    }
    return row;
  };
}
