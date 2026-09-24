// ══════════════════════════════════════════════════════════════════════
// pm-challenges.test.js — Plan 4.5 phase 4: the villa's named challenges
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { gs, setPlayers } from '../js/core.js';
import { playPerfectMatchSeason, perfectMatchScheduleFor } from '../js/pm/season.js';
import { withBookings, CHALLENGE_NAMES, CHALLENGE_NIGHTS } from '../js/pm/schedule.js';
import { runChallenge, CHALLENGES } from '../js/pm/challenges.js';
import { phasesOf } from '../js/pm/transcript.js';
import { rngFor } from '../js/dr/rng.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';

const SHAPE = { bombshells: 6, casa: 6 };
function castFor(seed) {
  const cast = makeIslanders(22, seed); setPlayers(cast);
  return cast.map(p => p.name);
}
function season(seed, bookings = {}) {
  const names = castFor(seed);
  return playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed, bookings });
}
/** A season stopped after `upto` episodes with no challenge played yet: a villa to run one in. */
function villaAfter(seed, upto) {
  const names = castFor(seed);
  const schedule = perfectMatchScheduleFor(seed, SHAPE).slice(0, upto).map(e => { const x = { ...e }; delete x.challenge; return x; });
  const { state } = playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed, schedule });
  state.ep = upto + 1;
  return state;
}
const snapshot = state => JSON.stringify([state.emo, gs.relationshipDimensions, gs.bonds, state.believes,
  state.secrets.map(s => s.known), state.ledger.approval]);

describe('the challenges are drawn like the real show', () => {
  it('only on villa days, one a day, never on the heart-rate or Snog Marry Pie day, each at most once a season', () => {
    let drawn = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const sched = perfectMatchScheduleFor(seed, SHAPE);
      const ids = sched.map(e => e.challenge).filter(Boolean);
      drawn += ids.length;
      expect(new Set(ids).size, `seed ${seed}`).toBe(ids.length);
      for (const e of sched.filter(x => x.challenge)) {
        expect(CHALLENGE_NIGHTS, `seed ${seed} ep ${e.ep}`).toContain(e.moment);
        expect(e.rituals || [], `seed ${seed} ep ${e.ep}`).not.toContain('heart-rate');
        expect(e.rituals || [], `seed ${seed} ep ${e.ep}`).not.toContain('snog-marry-pie');
        if (e.challenge === 'grafties') expect(e.moment).toBe('public-vote');
      }
    }
    // Four to six a season from the first ten (UK 10-13's tables); with the
    // eight from UK 5-9 (pm/challenges-more.js, user: "write more named
    // challenges") about seven and a half — the real show names ten or more.
    expect(drawn / 60).toBeGreaterThan(5);
    expect(drawn / 60).toBeLessThan(11);
  });
  it('the draws come after every other, so no earlier draw moved', () => {
    // Every episode's dumping / arrival rule / night one / one-off /
    // immunity, drawn by the schedule of commit 1429d091 — before the
    // challenges existed. Same seed, same season, less the afternoon games —
    // and plus the three nights added after Casa Amor (a recoupling, a vote,
    // the final recoupling) and the vote before the semi-final, whose
    // formats are drawn after all of them.
    const BEFORE = {
      1: '//step-forward// //// //// //// save-one//// /saves/// //// //// //// //// //// top-couple-picks////imm ///return/ couples-vote//// //// couples-vote//// public//// //// ////',
      2: '//step-forward// //// //// //// top-couple-picks//// //// //// //// //// //// //// couples-vote//// //// top-couple-picks//// //// top-couple-picks//// public//// //// ////',
      3: '//step-forward// //// /saves/// //// public//// //// //// //// //// //// //// safe-pick-couple//// //// top-couple-picks//// //// couples-vote//// ex-islanders//// //// ////',
      4: '//step-forward// //// /stand-up/// //// cross-gender//// ///mission/ //// //// //// //// //// top-couple-picks//// ///return/ couples-vote//// //// top-couple-picks//// ex-islanders//// //// ////',
      5: '//step-forward// //// /saves/// //// cross-gender//// /public-matches//sleepover/ //// //// //// //// //// public//// ///return/ safe-pick-couple//// //// top-couple-picks//// public//// //// ////',
      6: '//ranking// //// /stand-up/// //// top-couple-picks//// //// //// //// //// //// //// couples-vote//// //// public//// //// public//// ex-islanders//// //// ////',
    };
    const sig = s => s.map(e => [e.dumpFormat, e.arrivalRule, e.firstFormat, e.oneOff, e.immunity ? 'imm' : ''].map(x => x || '').join('/')).join(' ');
    for (const seed of Object.keys(BEFORE)) expect(sig(perfectMatchScheduleFor(Number(seed), SHAPE)), `seed ${seed}`).toBe(BEFORE[seed]);
  });
});

describe('a booking on the Season Timeline', () => {
  it('plays on the night it is booked on, and not also on the night it was drawn for', () => {
    const sched = withBookings(perfectMatchScheduleFor(2, SHAPE), { 13: { challenge: 'talent' } });
    expect(sched.filter(e => e.challenge === 'talent').map(e => e.ep)).toEqual([13]);
    const { rows } = season(2, { 13: { challenge: 'talent' } });
    const row = rows.find(r => r.num === 13);
    expect(row.pm.challenge).toBe('talent');
    expect(row.pm.events.some(e => e.kind === 'talent-win')).toBe(true);
  });
  it('has its own screen, named after the challenge', () => {
    const { rows } = season(2, { 13: { challenge: 'talent' } });
    const labels = phasesOf(rows.find(r => r.num === 13)).map(([, , label]) => label);
    expect(labels).toContain(CHALLENGE_NAMES.talent);
    // …in the afternoon: after the day, before the evening.
    expect(labels.indexOf(CHALLENGE_NAMES.talent)).toBeLessThan(labels.indexOf('Evening'));
  });
});

describe('every challenge has consequences', () => {
  it('each one that plays changes feelings, bonds, beliefs or the ledger', () => {
    const played = new Set();
    for (const [seed, upto] of [[3, 12], [5, 12], [7, 6]]) {
      for (const id of Object.keys(CHALLENGES)) {
        const state = villaAfter(seed, upto);
        const before = snapshot(state);
        const events = runChallenge(state, rngFor(seed * 31 + 7), id);
        if (!events.length) continue;
        played.add(id);
        expect(snapshot(state), `${id} seed ${seed}`).not.toBe(before);
        for (const e of events) {
          expect(e.phase).toBe('challenge');
          expect(e.aired).toBe(true);
          expect(e.script.stage || e.script.lines.length, `${id} ${e.kind}`).toBeTruthy();
          expect(e.script.id, `${id} ${e.kind} has no scene written`).not.toMatch(/\.0$/);
        }
      }
    }
    expect([...played].sort()).toEqual(Object.keys(CHALLENGES).sort());
  });
  it('a receipt that reads out a secret: the partner knows now', () => {
    let read = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const { rows, state } = season(seed);
      for (const r of rows) for (const e of r.pm.events.filter(x => x.kind === 'receipt' && x.extra.of === 'secret')) {
        read++;
        expect(state.secrets.some(s => s.who === e.players[2] && s.known), `seed ${seed} ep ${r.num}`).toBe(true);
      }
    }
    expect(read).toBeGreaterThan(3);
  });
});

describe('what the cards say, the villa could know', () => {
  it("Look Who's Talking only reads beach-hut lines from earlier days, and names who they were about", () => {
    let cards = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const { rows } = season(seed, { 5: { challenge: 'look-who' } });
      const huts = rows.flatMap(r => r.pm.events.filter(e => e.hut).map(e => ({ ep: r.num, text: e.hut.script.lines[0].text, who: e.hut.who })));
      for (const r of rows) for (const e of r.pm.events.filter(x => x.kind === 'look-who')) {
        cards++;
        const src = huts.find(h => h.text === e.extra.quote && h.who === e.players[1]);
        expect(src, `seed ${seed} ep ${r.num}`).toBeTruthy();
        expect(src.ep).toBeLessThan(r.num);
        expect(e.extra.quote).toContain(e.players[2]);
      }
    }
    expect(cards).toBeGreaterThan(10);
  });
  it('Got the Receipts never uses anything that happened today', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const { rows } = season(seed, { 4: { challenge: 'receipts' } });
      for (const r of rows) for (const e of r.pm.events.filter(x => x.kind === 'receipt')) {
        // The subject did the thing on an earlier day: a secret or an event before this episode.
        const earlier = rows.filter(x => x.num < r.num).flatMap(x => x.pm.events)
          .some(x => x.players[0] === e.players[2] && ['pull', 'head-turned', 'ick', 'challenge-kiss', 'argument', 'love-said', 'kiss'].includes(x.kind))
          || e.extra.of === 'secret';
        expect(earlier, `seed ${seed} ep ${r.num} ${e.extra.of}`).toBe(true);
      }
    }
  });
});
