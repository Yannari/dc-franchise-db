// The Challenge's Pairs season (spec docs/superpowers/specs/2026-10-17-ch-pairs-season-design.md §10): the rules
// that hold in every Pairs season, whatever way the pairs were made.
import { describe, expect, it, beforeAll } from 'vitest';
import { setPlayers, players } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { buildSchedule } from '../js/ch/schedule.js';
import { mayScheme } from '../js/ch/state.js';
import { challengeCast } from './helpers/ch-cast.js';
import { chLedgerRecord } from '../js/ch/ledger-record.js';

const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);

function play(seed, pairing, { shape = 'mixed', pins = {}, twists = {} } = {}) {
  const { cast, names, background } = challengeCast(24, seed);
  if (pairing === 'fresh-meat') {
    // twelve vets and twelve rookies, a man and a woman on each side
    const m = names.filter(n => background[n].gender === 'm'), f = names.filter(n => background[n].gender === 'f');
    for (const [i, n] of m.entries()) background[n].rookie = i < 6;
    for (const [i, n] of f.entries()) background[n].rookie = i >= 6;
  }
  setPlayers(cast);
  const res = playChallengeSeason({ cast: names, background, seed, options: { pairs: { pairing, shape, pins }, episodeTwists: twists } });
  // read while this season's cast is the roster (the next season replaces it)
  const arch = Object.fromEntries(names.map(n => [n, players.find(p => p.name === n)?.archetype]));
  const can = Object.fromEntries(names.map(n => [n, mayScheme(n)]));
  return { names, background, pairing, shape, arch, can, ...res };
}

// Every scene, in order, with the pairs as they stood (the pairs change in a Pick season)
const pairsAt = s => (s.state.pairHistory || []);
const wasPair = (s, a, b, ep) => pairsAt(s).some(h => ((h.a === a && h.b === b) || (h.a === b && h.b === a)) && h.from <= ep && (h.to == null || h.to >= ep));

describe('a Pairs season', () => {
  let seasons;
  beforeAll(() => {
    seasons = [];
    for (const pairing of ['rivals', 'ties', 'fresh-meat', 'pick']) for (const seed of [3, 8]) seasons.push(play(seed, pairing));
    seasons.push(play(5, 'rivals', { shape: 'same' }));
  });

  it('pairs everybody, in the season\'s shape', () => {
    for (const s of seasons) {
      const first = pairsAt(s).filter(h => h.from <= 1 && !['swap', 'leftover'].includes(h.how));
      expect(first.length).toBe(12);
      expect(new Set(first.flatMap(h => [h.a, h.b])).size).toBe(24);
      for (const h of first) {
        const same = s.state.division[h.a] === s.state.division[h.b];
        expect(same).toBe(s.shape === 'same');
      }
      if (s.pairing === 'fresh-meat') for (const h of first) expect(!!s.state.rookie[h.a]).not.toBe(!!s.state.rookie[h.b]);
    }
  });

  it('every elimination sends a whole pair home together, on one placement', () => {
    for (const s of seasons) for (const e of s.episodes) for (const d of e.arena) {
      expect(d.pairs).toBe(true);
      expect(d.losers.length).toBe(2);
      const gone = d.losers.map(l => s.state.gone.find(g => g.name === l));
      expect(gone.every(g => g && g.how === 'arena')).toBe(true);
      expect(gone[0].place).toBe(gone[1].place);
      expect(wasPair(s, d.losers[0], d.losers[1], e.ep)).toBe(true);
    }
  });

  it('nobody votes for their own pair, and a ballot never names an immune pair', () => {
    for (const s of seasons) for (const e of s.episodes) for (const v of e.votes) for (const b of v.ballots) {
      expect(b.pair).toContain(b.target);
      expect(b.pair).not.toContain(b.voter);
      for (const n of b.pair) expect(e.daily.winners).not.toContain(n);
    }
  });

  it('a call-out names another pair, never an immune one', () => {
    for (const s of seasons) for (const e of s.episodes) for (const c of e.callouts) {
      expect(c.pair).toBe(true);
      expect(c.opponent).not.toBe(c.by);
      expect(e.daily.winners).not.toContain(c.opponent);
      // the one who decided is in the pair that was voted in
      const d = e.arena.find(x => x.a === c.by);
      if (d) expect(d.pairA).toContain(c.decider);
    }
  });

  it('a partner who leaves outside the Arena takes the pair with them, unless somebody else was left alone', () => {
    let seen = 0;
    for (const s of seasons) for (const g of s.state.gone.filter(x => x.how === 'partner-left')) {
      seen++;
      const p = s.state.gone.find(x => x.name === g.partner);
      expect(p).toBeTruthy();
      expect(p.place).toBe(g.place);
    }
    // the partner-left path is exercised somewhere in the sample (quits, medevacs, a final overnight quit)
    expect(seen).toBeGreaterThan(0);
  });

  it('the final crowns a pair (one a division with men\'s and women\'s pairs), and both share first place', () => {
    for (const s of seasons) {
      expect(s.champions.length).toBe(s.shape === 'same' ? 4 : 2);
      for (const c of s.champions) expect(s.placements[c]).toBe(1);
      const finishers = Object.keys(s.final.placements);
      for (const n of finishers) {
        const partner = finishers.find(x => x !== n && s.final.placements[x] === s.final.placements[n] && wasPair(s, n, x, s.state.ep));
        expect(partner).toBeTruthy();
      }
    }
  });

  it('every pair with money chooses: the one with more points decides, and nice archetypes never keep', () => {
    for (const s of seasons) {
      expect(s.final.choices.length).toBeGreaterThan(0);
      for (const c of s.final.choices) {
        const pts = s.final.totals;
        expect(pts[c.chooser]).toBeGreaterThanOrEqual(pts[c.partner]);
        if (c.keep) { expect(NICE.has(s.arch[c.chooser])).toBe(false); expect(s.can[c.chooser]).toBe(true); }
      }
      // the champions choose last (both champion pairs, with men's and women's pairs)
      const places = s.final.choices.map(c => c.place);
      expect(places).toEqual([...places].sort((x, y) => y - x));
      expect(s.final.choices.at(-1).place).toBe(1);
    }
  });

  it('hand pairs on the cast card are kept whatever the method', () => {
    const { names, background } = challengeCast(24, 4);
    const m = names.find(n => background[n].gender === 'm'), f = names.find(n => background[n].gender === 'f');
    const s = play(4, 'rivals', { pins: { [m]: f, [f]: m } });
    expect(s.state.pairHistory.find(h => h.a === m || h.b === m)).toMatchObject({ how: 'hand' });
    expect(wasPair(s, m, f, 1)).toBe(true);
  });

  it('Partner Swap redraws every pair, and nobody gets their old partner back', () => {
    const s = play(6, 'rivals', { twists: { 3: 'swap' } });
    const e = s.episodes.find(x => x.ep === 3);
    expect(e.swap).toBeTruthy();
    const old = new Set(e.swap.before.map(p => [...p].sort().join('|')));
    for (const p of e.swap.after) expect(old.has([...p].sort().join('|'))).toBe(false);
  });

  it('the schedule counts pairs: the regular season leaves the final pairs', () => {
    for (const s of seasons) {
      const last = s.state.episodes.at(-1);
      expect(last).toBeTruthy();
      const want = s.shape === 'same' ? 4 : 3;
      expect(s.final.finalists.length).toBeLessThanOrEqual(want * 2);
      expect(s.final.finalists.length % 2).toBe(0);
    }
    const plan = buildSchedule({ pairs: true, total: 12, finalists: 3 });
    expect(plan.filter(e => !e.final).reduce((t, e) => t + e.plannedElims, 0)).toBe(9);
  });

  it('a return brings a whole pair back, and the losers go home together again', () => {
    const s = play(7, 'rivals', { twists: { 5: 'return' } });
    const e = s.episodes.find(x => x.ep === 5);
    expect(e.returnArena?.winners?.length).toBe(2);
    expect(wasPair(s, e.returnArena.winners[0], e.returnArena.winners[1], 5)).toBe(true);
    const back = e.returnArena.losers.map(l => s.state.gone.find(g => g.name === l));
    expect(back[0].place).toBe(back[1].place);
  });

  it('the pair lives as a pair: fights, making up, plans, and the inside of every two-on-two air', () => {
    const kinds = {};
    for (const s of seasons) for (const sc of s.state.scenes) kinds[sc.kind] = (kinds[sc.kind] || 0) + 1;
    for (const k of ['pair-reveal', 'pair-fight', 'pair-makeup', 'pair-plan', 'pair-callout', 'pair-arena', 'pair-arena-win', 'pair-arena-blame', 'share-keep'])
      expect(kinds[k] || 0, k).toBeGreaterThan(0);
  });

  it('the ledger keeps the partner and the choice, and a kept prize is a betrayal the franchise remembers', () => {
    let s = seasons.find(x => x.final.choices.some(c => c.keep));
    for (let seed = 20; !s && seed < 60; seed++) { const t = play(seed, 'rivals'); if (t.final.choices.some(c => c.keep)) s = t; }
    expect(s).toBeTruthy();
    // the season's own relationship layer is live only right after it plays: replay it
    const again = play(s.state.seed, s.pairing, { shape: s.shape });
    const rec = chLedgerRecord(again.state, again);
    const kept = again.final.choices.find(c => c.keep);
    expect(rec.players[kept.chooser].keptMoneyFrom).toContain(kept.partner);
    expect(rec.players[kept.chooser].betrayed).toContain(kept.partner);
    expect(rec.players[kept.partner].ch.choice).toMatchObject({ chose: false, keep: true, with: kept.chooser });
    for (const n of again.names) expect(rec.players[n].ch.partner).toBeTruthy();
  });

  it('a solo season is untouched: no pairs, nobody chooses', () => {
    const { cast, names, background } = challengeCast(24, 3);
    setPlayers(cast);
    const s = playChallengeSeason({ cast: names, background, seed: 3 });
    expect(s.state.pairs).toBeUndefined();
    expect(s.final.choices).toBeUndefined();
  });
});
