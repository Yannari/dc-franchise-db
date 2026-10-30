// The fire pit says whose partner was taken (season read 2026-10-30: in seed 7's
// episode 15 Keisha took Dan with Mia on the bench, Mia took him back, Leah took
// Liam with Tasha still to stand, Tasha took him back — and all four played as
// ordinary "this person gets me" speeches that named nobody).
import { describe, it, expect, beforeAll } from 'vitest';
import { playReadSeason, eventLines } from './helpers/pm-read.js';

let rows;
beforeAll(() => { ({ rows } = playReadSeason(7)); });
const picks = n => rows.find(r => r.num === n).pm.events.filter(e => e.kind === 'recouple-pick');
const pickBy = (n, a) => picks(n).find(e => e.players[0] === a);
const said = e => eventLines(e).map(l => l.text).join(' ');

describe('pm fire pit', () => {
  it('flags a pick made with the partner still on the bench', () => {
    expect(pickBy(15, 'Keisha').extra.tookFrom).toBe('Mia');
    expect(pickBy(15, 'Leah').extra.tookFrom).toBe('Tasha');
    expect(pickBy(13, 'Marcus').extra.tookFrom).toBe('Josh');
  });

  it('flags the take-back, with who it was taken back from', () => {
    for (const [a, from] of [['Mia', 'Keisha'], ['Tasha', 'Leah']]) {
      const e = pickBy(15, a);
      expect(e.extra.reclaim).toBe(true);
      expect(e.extra.stole).toBe(from);
    }
  });

  it('names the partner on the bench, and the one it was taken back from', () => {
    for (const [a, c] of [['Keisha', 'Mia'], ['Leah', 'Tasha'], ['Mia', 'Keisha'], ['Tasha', 'Leah']]) {
      expect(said(pickBy(15, a)), `${a}'s pick`).toContain(c);
    }
  });

  it('never flags somebody whose partner had already chosen someone else', () => {
    for (const r of rows) {
      const ps = (r.pm?.events || []).filter(e => e.kind === 'recouple-pick');
      ps.forEach((e, i) => {
        const c = e.extra?.tookFrom;
        if (!c) return;
        const theirs = ps.findIndex(x => x.players[0] === c);
        expect(theirs === -1 || theirs > i, `ep${r.num} ${e.players[0]} took from ${c}`).toBe(true);
      });
    }
  });
});
