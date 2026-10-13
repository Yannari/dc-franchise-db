// legacy-canon.test.js — what Legacy will and will not take.
//
// The user, 2026-10-13: "miriam won s11 not sterling, quin won drag race 1 not
// paige" -- published seasons had been replayed and the replays recorded over
// them -- and "test season shouldnt be a legacy". The ledgers here are shaped
// like theirs: a chronicle-enriched season that matches its document, a
// replay sitting on a published season, a missing one, and a Traitors test
// run filed under Perfect Match's name.
import { describe, it, expect, beforeEach } from 'vitest';
import { setFranchiseLedger, activeSeasons, setPublishedSeasons, isPublishedSeason, applyPublishedSeason,
  dropMislabeledRecords, recordBuiltSeason, lastLedgerRefusal } from '../js/franchise-meta.js';
import { seasonConfig, setSeasonConfig } from '../js/core.js';

const doc = (title, rows, winner) => ({ title, winner: { name: winner }, placements: rows.map(([name, placement]) => ({ name, placement })) });
const S11 = doc('Cursed Island', [['Miriam', 1], ['Thom', 2], ['Fiore', 3]], 'Miriam');
const DR1 = doc(null, [['Quin', 1], ['Paige Turner', 2]], 'Quin');
const S1 = doc('Cullhouse', [['Lindsay', 1], ['Owen', 2]], 'Lindsay');
const rec = (rows, extra = {}) => ({ ...extra, players: Object.fromEntries(rows.map(([n, p]) => [n, { placement: p, winner: p === 1, allies: ['kept'] }])) });

beforeEach(() => {
  setSeasonConfig({ ...seasonConfig, testSeason: false });
  setFranchiseLedger({ v: 2, active: 'td', franchises: { td: { name: 'Total Drama', seasons: {
    '1': rec([['Lindsay', 1], ['Owen', 2]], { source: 'enriched', seasonName: 'Total Drama: Cullhouse' }),
    '11': rec([['Sterling', 1], ['Miriam', 3], ['Thom', 2]], { source: 'live', format: 'total-drama' }),
    'dr-1': rec([['Paige Turner', 1], ['Quin', 2]], { source: 'live', format: 'drag-race', seasonName: 'Drag Race 1' }),
    'tr-1': rec([['Topher', 1]], { source: 'live', format: 'traitors', seasonName: 'Perfect Match 1' }),
  } } } });
  setPublishedSeasons([{ format: 'total-drama', num: 1 }, { format: 'total-drama', num: 11 }, { format: 'drag-race', num: 1 }, { format: 'big-brother', num: 1 }]);
});

const winner = key => Object.entries(activeSeasons()[key]?.players || {}).find(([, r]) => r.winner)?.[0];

describe('published seasons are what Legacy says happened', () => {
  it('puts back a published season a replay recorded over', () => {
    expect(applyPublishedSeason(S11, 'total-drama', 11)).toBe(true);
    expect(winner('11')).toBe('Miriam');
    expect(applyPublishedSeason(DR1, 'drag-race', 1)).toBe(true);
    expect(winner('dr-1')).toBe('Quin');
    expect(activeSeasons()['dr-1'].format).toBe('drag-race');
  });

  it('leaves a record that already matches exactly as it is, alliances and all', () => {
    const before = activeSeasons()['1'];
    expect(applyPublishedSeason(S1, 'total-drama', 1)).toBe(false);
    expect(activeSeasons()['1']).toBe(before);
    expect(activeSeasons()['1'].players.Lindsay.allies).toEqual(['kept']);
  });

  it('adds a published season the ledger never had', () => {
    expect(applyPublishedSeason(doc('Big Brother 1', [['Misha', 1], ['Jules', 2]], 'Misha'), 'big-brother', 1)).toBe(true);
    expect(winner('bb-1')).toBe('Misha');
  });

  it('refuses to record a replay of a published season', () => {
    expect(isPublishedSeason('drag-race', 1)).toBe(true);
    const ok = recordBuiltSeason({ format: 'drag-race', seasonName: 'Drag Race 1', players: { 'Paige Turner': { placement: 1, winner: true } } }, 1);
    expect(ok).toBe(false);
    expect(lastLedgerRefusal()).toMatch(/published/);
  });

  it('records an unpublished season as before', () => {
    expect(recordBuiltSeason({ format: 'drag-race', seasonName: 'Drag Race 2', players: { A: { placement: 1, winner: true } } }, 2)).toBe(true);
    expect(winner('dr-2')).toBe('A');
  });
});

describe('test seasons stay out', () => {
  it('a season marked as a test is never recorded', () => {
    setSeasonConfig({ ...seasonConfig, testSeason: true });
    expect(recordBuiltSeason({ format: 'drag-race', seasonName: 'Drag Race 2', players: { A: { placement: 1 } } }, 2)).toBe(false);
    expect(lastLedgerRefusal()).toMatch(/test season/);
    expect(activeSeasons()['dr-2']).toBeUndefined();
  });

  it('a test run filed under another show\'s name is removed; nothing real is', () => {
    expect(dropMislabeledRecords()).toBe(1);
    expect(activeSeasons()['tr-1']).toBeUndefined();
    expect(activeSeasons()['dr-1']).toBeDefined();
    expect(activeSeasons()['1']).toBeDefined();
  });

  it('a new season never takes another show\'s name', () => {
    recordBuiltSeason({ format: 'traitors', seasonName: 'Perfect Match 1', players: { Topher: { placement: 1, winner: true } } }, 2);
    expect(activeSeasons()['tr-2'].seasonName).toBe('The Traitors 2');
  });
});
