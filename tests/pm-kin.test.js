// The islanders who knew each other before the villa (js/pm/kin.js): the
// relations the cast's Relationships tab sets, read by the season.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playPerfectMatchSeason } from '../js/pm/season.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';

function play(seed, kinship) {
  const cast = makeIslanders(22, seed);
  setPlayers(cast);
  const names = cast.map(p => p.name);
  return { ...playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed, kinship }), names };
}
const coupledEver = (rows, a, b) => rows.some(r => r.pm.couples.some(c => c.includes(a) && c.includes(b)));

describe('relations from before the villa', () => {
  // Isl01 (f) and Isl02 (m) start as siblings; Isl11 and Isl13 are twin bombshells.
  const KIN = [{ a: 'Isl01', b: 'Isl02', kin: 'siblings' }, { a: 'Isl11', b: 'Isl13', kin: 'twins' },
    { a: 'Isl03', b: 'Isl04', kin: 'exes' }];

  it('family by blood never couples up', () => {
    for (const seed of [1, 2, 3]) expect(coupledEver(play(seed, KIN).rows, 'Isl01', 'Isl02'), `seed ${seed}`).toBe(false);
  });

  it('twin bombshells walk in together, once each', () => {
    const { rows } = play(4, KIN);
    const all = rows.flatMap(r => r.pm.events);
    const pair = all.filter(e => e.kind === 'kin-entrance');
    expect(pair).toHaveLength(1);
    expect([...pair[0].players].sort()).toEqual(['Isl11', 'Isl13']);
    expect(pair[0].extra.of).toBe('twins');
    for (const n of ['Isl11', 'Isl13']) expect(all.filter(e => e.kind === 'entrance' && e.players.includes(n))).toHaveLength(0);
  });

  it('family never votes to dump family', () => {
    for (const seed of [5, 6, 7]) {
      const { rows } = play(seed, KIN);
      for (const v of rows.flatMap(r => r.votes || [])) {
        if (v.couple || v.channel !== 'villa') continue;
        expect([v.voter, v.target].sort().join('|'), `seed ${seed}`).not.toMatch(/^(Isl01\|Isl02|Isl11\|Isl13)$/);
      }
    }
  });

  it('the relations get their own scenes, and every one of them renders', () => {
    const kinds = new Set(['kin-heart', 'kin-vet', 'kin-protect', 'ex-awkward', 'ex-jealous', 'kin-entrance', 'pair-text']);
    const seen = new Set();
    for (const seed of [1, 2, 3, 4]) {
      for (const e of play(seed, KIN).rows.flatMap(r => r.pm.events)) {
        if (!kinds.has(e.kind)) continue;
        seen.add(e.kind);
        const text = JSON.stringify(e.script || {});
        expect(text, `${e.kind}`).not.toMatch(/\{[abcd~][^}]*\}/);
        expect(e.script?.lines?.length || e.script?.stage, `${e.kind} has no script`).toBeTruthy();
      }
    }
    for (const k of ['kin-heart', 'ex-awkward', 'kin-entrance']) expect(seen, k).toContain(k);
  });

  it('the episode record lists them for the heart map', () => {
    const { rows } = play(1, KIN);
    expect(rows[0].pm.kin.map(k => k.slice(0, 3).join('|')).sort()).toEqual(['Isl01|Isl02|siblings', 'Isl03|Isl04|exes', 'Isl11|Isl13|twins']);
  });

  it('an ex who walks in as a bombshell: the hint, the reveal, the partner, their dates, then the two of them', () => {
    let played = 0;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      for (const ex of ['Isl01', 'Isl03', 'Isl05']) {
        const { rows } = play(seed, [{ a: ex, b: 'Isl12', kin: 'exes' }]);
        const night = rows.find(r => r.pm.events.some(e => e.kind === 'ex-reveal'));
        if (!night) continue;
        played++;
        const ev = night.pm.events, at = k => ev.findIndex(e => e.kind === k);
        expect(at('ex-text')).toBeGreaterThanOrEqual(0);
        expect(ev[at('ex-text')].players).toContain(ex);
        const walkIn = ev.findIndex(e => /entrance/.test(e.kind) && e.players.includes('Isl12'));
        expect(at('ex-text')).toBeLessThan(walkIn);
        expect(walkIn).toBeLessThan(at('ex-reveal'));
        expect(ev[at('ex-reveal')].players).toEqual([ex, 'Isl12']);
        // The night's last word between them comes after every date.
        const lastDate = Math.max(...ev.map((e, i) => ((e.kind === 'date' && e.players[0] === 'Isl12') || (e.kind === 'date-back' && e.players[2] === 'Isl12') ? i : -1)));
        expect(at('ex-confront')).toBeGreaterThan(lastDate);
        // A date with the ex is played as one.
        for (const d of ev.filter(e => e.kind === 'date' && e.players.includes(ex) && e.players.includes('Isl12'))) expect(d.extra.exes).toBe(true);
        // The starter's night-one tape never knew the ex was coming.
        const tape = rows[0].pm.events.find(e => e.kind === 'intro' && e.players[0] === ex);
        expect(tape.extra.parts.some(([k, of]) => k === 'intro-kin')).toBe(false);
        break;
      }
    }
    expect(played).toBeGreaterThanOrEqual(3);
  });

  it('a season without relations is exactly the season it always was', () => {
    const sig = rows => rows.map(r => `${r.num}:${r.exits.map(x => x.name).join(',')}:${r.pm.events.length}`).join('|');
    const a = sig(play(9, []).rows);
    const b = sig(play(9, null).rows);
    expect(a).toBe(b);
    expect(play(9, []).rows.flatMap(r => r.pm.events).some(e => e.kind.startsWith('kin-') || e.kind.startsWith('ex-a') || e.kind === 'ex-jealous')).toBe(false);
  });
});
