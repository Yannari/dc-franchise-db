// ══════════════════════════════════════════════════════════════════════
// tests/dr-history.test.js — what really happened (js/dr/history.js)
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { seasonFromDoc, seasonsFromDocs } from '../js/dr/history.js';

// The real stored season, not a fixture: this is the document the app loads.
const doc = JSON.parse(readFileSync('data/seasons/dr-1-data.json', 'utf8'));

describe('a stored season', () => {
  it('carries the maxi wins the ledger cannot count', () => {
    const s = seasonFromDoc(doc);
    expect(s.winsKnown).toBe(true);
    expect(s.placements[0].wins).toBeGreaterThan(0);
  });

  it('knows who beat whom in the song that sent her home', () => {
    const s = seasonFromDoc(doc);
    expect(s.relations.length).toBeGreaterThan(3);
    for (const r of s.relations) {
      expect(r.kind).toBe('sent-home');
      expect(r.a).not.toBe(r.b);
    }
    // Episode 3 of dr-1: Minnie Skurr beat Taystee and Taystee went home.
    expect(s.relations).toContainEqual(
      expect.objectContaining({ a: 'Minnie Skurr', b: 'Taystee', kind: 'sent-home' }));
  });

  it('does not claim a queen who lost a song and STAYED was sent home', () => {
    const s = seasonFromDoc(doc);
    // Episode 1 had a lip sync and nobody left.
    const ep1 = (doc.dr?.episodes || [])[0];
    expect((ep1.exits || []).length).toBe(0);
    const pair = [ep1.lipsync?.winner, ep1.lipsync?.loser].filter(Boolean).sort().join('|');
    for (const r of s.relations) expect([r.a, r.b].sort().join('|')).not.toBe(pair);
  });

  it('reads an All Stars exit, where the loser of the song is not the one who leaves', () => {
    const as = {
      seasonNumber: 4,
      placements: [{ name: 'A', placement: 1, dr: { wins: 2 } }, { name: 'B', placement: 2, dr: { wins: 0 } }],
      dr: {
        episodes: [{
          episode: 1,
          // The TOP two sang; B was named by the winner of that song.
          lipsync: { queens: ['A', 'C'], winner: 'A', loser: 'C', eliminated: 'B', chosenBy: 'A' },
          exits: [{ name: 'B' }],
        }],
      },
    };
    const s = seasonFromDoc(as);
    expect(s.relations).toContainEqual(
      expect.objectContaining({ a: 'A', b: 'B', kind: 'sent-home' }));
    // C lost the song and did NOT go home, so nobody sent her anywhere.
    expect(s.relations.some(r => r.b === 'C')).toBe(false);
  });

  it('puts the most recent season first', () => {
    const list = seasonsFromDocs([{ seasonNumber: 1, placements: [{ name: 'A', placement: 1 }] },
      { seasonNumber: 3, placements: [{ name: 'A', placement: 2 }] }]);
    expect(list.map(s => s.season)).toEqual([3, 1]);
  });
});

// ══════════════════════════════════════════════════════════════════════
// End to end: a cast of real returnees
// ══════════════════════════════════════════════════════════════════════
import { playDragSeason } from '../js/dr/season.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];

describe('an All Stars season cast from a real one', () => {
  const real = seasonFromDoc(doc);
  const names = real.placements.slice(0, 8).map(p => p.name);
  const cast = names.map((name, i) => ({
    name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), gender: 'm', sexuality: 'gay',
    archetype: ['villain', 'hero', 'floater', 'wildcard'][i % 4], age: 25 + i,
    stats: Object.fromEntries(STATS.map((k, j) => [k, ((i * 3 + j) % 10) + 1])),
  }));

  function run() {
    const bonds = {}; const key = (a, b) => [a, b].sort().join('|');
    return Object.assign({ bonds }, playDragSeason({
      cast, seed: 777,
      config: {
        drAllStars: true,
        drPastSeasons: [real],
        drPastRelations: real.relations,
      },
      bond: (a, b) => bonds[key(a, b)] || 0,
      addBond: (a, b, d) => { const k = key(a, b); bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d)); },
      popDelta: () => {},
    }));
  }

  it('gives every queen her real placement and her real wins', () => {
    const pasts = run().state.allStars.pasts;
    for (const p of real.placements.slice(0, 8)) {
      expect(pasts[p.name].real).toBe(true);
      expect(pasts[p.name].rank).toBe(p.place);
      expect(pasts[p.name].wins).toBe(p.wins);
      expect(pasts[p.name].winsKnown).toBe(true);
    }
  });

  it('carries the eliminations that really happened, and invents none', () => {
    const history = run().state.allStars.history;
    const sent = history.filter(h => h.kind === 'sent-home');
    expect(sent.length).toBeGreaterThan(0);
    // Every one of them is in the record.
    for (const h of sent) {
      expect(real.relations).toContainEqual(
        expect.objectContaining({ a: h.a, b: h.b, kind: 'sent-home' }));
    }
    // And nothing else was asserted about queens the record covers.
    for (const h of history) expect(['sent-home', 'mates', 'friend', 'rival']).toContain(h.kind);
    for (const h of history.filter(x => x.kind === 'friend' || x.kind === 'rival')) {
      expect(real.relations).toContainEqual(expect.objectContaining({ a: h.a, b: h.b, kind: h.kind }));
    }
  });

  it('so somebody in that room is carrying a real grudge', () => {
    const res = run();
    const g = res.state.power.grudges.filter(x => x.season);
    expect(g.length).toBeGreaterThan(0);
    for (const x of g) {
      expect(real.relations).toContainEqual(
        expect.objectContaining({ a: x.against, b: x.by, kind: 'sent-home' }));
    }
  });

  it('and the entrance says what she really did', () => {
    const res = run();
    const resumes = (res.rows[0].dr.scenes || []).filter(s => s.kind === 'arrival:resume');
    expect(resumes.length).toBeGreaterThan(4);
    const winner = resumes.find(s => s.data.past.rank === 1);
    if (winner) {
      expect(winner.text).toMatch(/won it/);
      expect(winner.text).not.toMatch(/no wins at all/);
    }
  });
});
