// The fire pit says whose partner was taken (season read 2026-10-30: in seed 7's
// episode 15 Keisha took Dan with Mia on the bench, Mia took him back, Leah took
// Liam with Tasha still to stand, Tasha took him back — and all four played as
// ordinary "this person gets me" speeches that named nobody).
import { describe, it, expect, beforeAll } from 'vitest';
import { playReadSeason, eventLines } from './helpers/pm-read.js';

const SEEDS = [7, 12, 21];
let picks = [];
beforeAll(() => {
  picks = SEEDS.flatMap(seed => playReadSeason(seed).rows.flatMap(r => {
    const ps = (r.pm?.events || []).filter(e => e.kind === 'recouple-pick');
    return ps.map((e, i) => ({ seed, ep: r.num, e, i, all: ps, before: r.pm.couplesBefore || [] }));
  }));
});
// Named on screen: in a line, or speaking one.
const said = e => eventLines(e).map(l => `${l.who || ''}: ${l.text}`).join(' ');
const partnerBefore = (before, n) => before.find(c => c.includes(n))?.find(x => x !== n) || null;
const tag = p => `seed ${p.seed} ep${p.ep} ${p.e.players.join('>')}`;

describe('pm fire pit', () => {
  it('finds the partner-taking picks a season has', () => {
    expect(picks.filter(p => p.e.extra.tookFrom).length).toBeGreaterThan(2);
    expect(picks.filter(p => p.e.extra.reclaim && p.e.extra.stole).length).toBeGreaterThan(0);
  });

  it("flags {b}'s partner on the bench only while that partner is still to choose", () => {
    for (const p of picks.filter(x => x.e.extra.tookFrom)) {
      const c = p.e.extra.tookFrom;
      expect(partnerBefore(p.before, p.e.players[1]), tag(p)).toBe(c);
      const theirs = p.all.findIndex(x => x.players[0] === c);
      expect(theirs === -1 || theirs > p.i, tag(p)).toBe(true);
    }
  });

  it("flags leaving one's own partner, never one already taken tonight", () => {
    for (const p of picks.filter(x => x.e.extra.leftFrom)) {
      expect(partnerBefore(p.before, p.e.players[0]), tag(p)).toBe(p.e.extra.leftFrom);
      expect(p.all.slice(0, p.i).some(x => x.players[1] === p.e.extra.leftFrom), tag(p)).toBe(false);
    }
  });

  it('names the third person in every pick that has one', () => {
    for (const p of picks) {
      // (A pick after a no follows the refusal scene, which names who said it.)
      const c = p.e.extra.tookFrom || p.e.extra.leftFrom || p.e.extra.stole;
      if (c) expect(said(p.e), tag(p)).toContain(c);
    }
  });
});
