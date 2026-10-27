// What a drag season exports for the rankings: lip syncs FOR YOUR LIFE only,
// the Smackdown (it was dropped whole), and points per episode.
import { describe, it, expect } from 'vitest';
import { dragCareerStats, dragEpisodes } from '../js/dr/export.js';
import { RU_SHOW, computeScore, placementPct } from '../js/rankings-update.js';

const row = (num, dr) => ({ num, format: 'drag-race', dr: { living: ['A', 'B', 'C', 'D'], call: {}, ...dr }, exits: [] });

describe('lip syncs won', () => {
  const rows = [
    row(1, { call: { win: ['A'], high: ['B'] }, lipsync: { call: 'for-the-win', queens: ['A', 'B'], winner: 'A', loser: null } }),
    row(2, { call: { bottom: ['C', 'D'] }, lipsync: { call: 'shantay', queens: ['C', 'D'], winner: 'C', loser: 'D' } }),
    row(3, { call: { win: ['B'] }, lipsync: { call: 'legacy', queens: ['B', 'A'], winner: 'B', loser: 'A' } }),
  ];
  it('counts the ones for your life, not the ones for the win', () => {
    expect(dragCareerStats(rows, 'A').lipsyncWins).toBe(0);
    expect(dragCareerStats(rows, 'B').lipsyncWins).toBe(0);
    expect(dragCareerStats(rows, 'C').lipsyncWins).toBe(1);
  });
});

describe('the Smackdown', () => {
  const smack = row(5, {
    challenge: { id: 'smackdown', name: 'The Lip Sync Smackdown' },
    smackdown: { field: ['A', 'B', 'C', 'D'], title: 'Queen of It All', winner: 'C',
      duels: [{ round: 1, winner: 'C', loser: 'D' }, { round: 1, winner: 'A', loser: 'B' }, { round: 2, winner: 'C', loser: 'A' }] },
  });
  it('is exported with its champion, title and duels', () => {
    const ep = dragEpisodes([smack])[0];
    expect(ep.smackdown).toEqual({ winner: 'C', title: 'Queen of It All',
      duels: [{ round: 1, winner: 'C', loser: 'D' }, { round: 1, winner: 'A', loser: 'B' }, { round: 2, winner: 'C', loser: 'A' }] });
  });
  it("counts the champion's crown and every duel won", () => {
    expect(dragCareerStats([smack], 'C')).toMatchObject({ smackdownWins: 2, smackdownCrowns: 1 });
    expect(dragCareerStats([smack], 'A')).toMatchObject({ smackdownWins: 1, smackdownCrowns: 0 });
  });
});

describe('points per episode', () => {
  it("is the chart's own number, over the episodes she competed in", () => {
    const rows = [
      row(1, { call: { win: ['A'], bottom: ['C', 'D'] }, lipsync: { call: 'shantay', winner: 'C', loser: 'D', queens: ['C', 'D'] } }),
      row(2, { living: ['A', 'B', 'C'], call: { high: ['A'] } }),
    ];
    rows[0].exits = [{ name: 'D' }];
    expect(dragCareerStats(rows, 'A').ppe).toBe(4.5);   // WIN 5, HIGH 4
    expect(dragCareerStats(rows, 'D').ppe).toBe(0);     // ELIM 0, then not competing
  });
});

describe('the Drag Race rubric', () => {
  const rub = RU_SHOW['drag-race'];
  it('reads points per episode and the Smackdown crown', () => {
    const cols = rub.read({ dr: { wins: 2, lipsyncWins: 1, highs: 5, bottoms: 3, ppe: 3.5, smackdownCrowns: 1 } }, {});
    expect(cols).toMatchObject({ comp1: 2, comp2: 1, comp3: 1, social: 3, strategicScore: 3.5 });
    expect(rub.comp3.label).toBe('Smackdown');
    expect(rub.strat).toMatchObject({ label: 'PPE', center: 3, weight: 4 });
  });
  it('charges a below-average run and pays an above-average one, zero included', () => {
    const base = { allPcts: [placementPct(5, 10)], wins: 0, nonWinFinals: 0, numSeasons: 1, format: 'drag-race', castSize: 10,
      immWins: 0, rewWins: 0, comp3Wins: 0, advFound: 0, advPlayed: 0, advWasted: 0, advHeld: 0, alliances: 0, socialCol: 0, override: 0 };
    const at = ppe => computeScore({ ...base, strategicScore: ppe });
    expect(at(3)).toBeCloseTo(at(3.0));
    expect(at(4) - at(3)).toBeCloseTo(4, 0);
    expect(at(3) - at(0)).toBeCloseTo(12, 0);
  });
});

import { readFileSync } from 'node:fs';
describe('the honours shelf', () => {
  const page = readFileSync('player.html', 'utf8');
  it('names a Lip Sync Assassin and a Smackdown champion', () => {
    expect(page).toMatch(/Lip Sync Assassin/);
    expect(page).toMatch(/d\.dr\?\.lipsyncWins \|\| 0\) >= 3/);
    expect(page).toMatch(/smackdownCrowns/);
  });
});
