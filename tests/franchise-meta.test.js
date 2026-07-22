import { describe, it, expect } from 'vitest';
import { franchiseLedger, setFranchiseLedger, META_WEIGHTS } from '../js/franchise-meta.js';

describe('franchise-meta skeleton', () => {
  it('exposes an empty ledger and weights', () => {
    expect(franchiseLedger).toEqual({ seasons: {} });
    expect(META_WEIGHTS.repThreatFactor).toBeGreaterThan(0);
  });
  it('setFranchiseLedger replaces the ledger', () => {
    setFranchiseLedger({ seasons: { '10': { seasonName: 'X', players: {} } } });
    expect(franchiseLedger.seasons['10'].seasonName).toBe('X');
    setFranchiseLedger({ seasons: {} });
  });
});

import { setGs, setPlayers, setSeasonConfig, defaultConfig } from '../js/core.js';
import { deriveSeasonRecord, recordSeasonToLedger } from '../js/franchise-meta.js';

function fabricateFinishedSeason() {
  setPlayers([
    { name: 'Ava', isReturnee: false }, { name: 'Ben', isReturnee: false },
    { name: 'Cy', isReturnee: false }, { name: 'Dee', isReturnee: false }
  ]);
  setSeasonConfig({ ...defaultConfig(), seasonNumber: 15, name: 'Test Season', franchiseMeta: true });
  setGs({
    phase: 'complete',
    finaleResult: { winner: 'Ava', finalists: ['Ava', 'Ben'] },
    episodeHistory: [
      { num: 1, eliminated: 'Dee', immunityWinner: 'Ava',
        votingLog: [ { voter: 'Ava', voted: 'Dee' }, { voter: 'Ben', voted: 'Dee' }, { voter: 'Cy', voted: 'Dee' }, { voter: 'Dee', voted: 'Ben' } ],
        defections: [ { player: 'Cy' }, { player: 'Ben' } ],
        idolPlays: [] },
      { num: 2, eliminated: 'Cy', immunityWinner: 'Ava',
        votingLog: [ { voter: 'Ava', voted: 'Cy' }, { voter: 'Ben', voted: 'Cy' }, { voter: 'Cy', voted: 'Ben' } ],
        defections: [],
        idolPlays: [ { player: 'Ava', votesNegated: 1 } ] }
    ],
    bonds: { 'Ava||Ben': 4.0, 'Ben||Cy': -5.0 },
    advantages: [], namedAlliances: [ { name: 'Core Four', members: ['Ava', 'Ben'] } ],
    showmances: [ { a: 'Ava', b: 'Ben', broken: false } ],
    schemesCaught: { 'Cy': 1 }
  });
}

describe('deriveSeasonRecord', () => {
  it('derives placements, winner, blindside, idols, allies, showmances, rivals', () => {
    fabricateFinishedSeason();
    const rec = deriveSeasonRecord();
    expect(rec.players['Ava']).toMatchObject({ placement: 1, winner: true, finalist: true, chalWins: 2, idolsPlayed: 1 });
    expect(rec.players['Ben'].placement).toBe(2);
    expect(rec.players['Cy'].placement).toBe(3);
    expect(rec.players['Dee']).toMatchObject({ placement: 4, blindsided: true });
    expect(rec.players['Dee'].blindsidedBy).toEqual(expect.arrayContaining(['Cy', 'Ben']));
    expect(rec.players['Cy'].betrayed).toContain('Dee');       // flipped onto Dee
    expect(rec.players['Dee'].betrayedBy).toContain('Cy');
    expect(rec.players['Ava'].allies).toContain('Ben');
    expect(rec.players['Ava'].showmances).toEqual([{ partner: 'Ben', ended: 'intact' }]);
    expect(rec.players['Ben'].rivals).toContain('Cy');          // bond -5
    expect(rec.players['Cy'].schemesCaught).toBe(1);
  });
  it('returns null when seasonNumber is 0', () => {
    fabricateFinishedSeason();
    setSeasonConfig({ ...defaultConfig(), seasonNumber: 0 });
    expect(deriveSeasonRecord()).toBeNull();
  });
});

describe('recordSeasonToLedger', () => {
  it('writes the season record idempotently', () => {
    setFranchiseLedger({ seasons: {} });
    fabricateFinishedSeason();
    expect(recordSeasonToLedger({})).toBe(true);
    expect(recordSeasonToLedger({})).toBe(true);
    expect(Object.keys(franchiseLedger.seasons)).toEqual(['15']);
    expect(franchiseLedger.seasons['15'].players['Ava'].winner).toBe(true);
  });
});
