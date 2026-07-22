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
        idolPlays: [ { player: 'Ben', type: 'extraVote', target: 'Dee' } ] },
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
    expect(rec.players['Ben'].idolsPlayed).toBe(0);             // extraVote is NOT an idol play
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

import { buildFranchiseMeta } from '../js/franchise-meta.js';

function seedLedgerS12() {
  setFranchiseLedger({ seasons: { '12': { seasonName: 'S12', players: {
    'Fiore': { placement: 1, winner: true, finalist: true, episodesLasted: 18, blindsided: false,
      blindsidedBy: [], blindsidesAuthored: 2, idolsFound: 1, idolsPlayed: 1, idoledOut: false,
      betrayed: ['Thom'], betrayedBy: [], allies: ['MacArthur'], showmances: [], rivals: [], chalWins: 4, schemesCaught: 1 },
    'Thom': { placement: 5, winner: false, finalist: false, episodesLasted: 14, blindsided: true,
      blindsidedBy: ['Fiore'], blindsidesAuthored: 0, idolsFound: 0, idolsPlayed: 0, idoledOut: true,
      betrayed: [], betrayedBy: ['Fiore'], allies: [], showmances: [{ partner: 'MacArthur', ended: 'intact' }],
      rivals: [], chalWins: 0, schemesCaught: 0 },
    'MacArthur': { placement: 3, winner: false, finalist: true, episodesLasted: 17, blindsided: false,
      blindsidedBy: [], blindsidesAuthored: 1, idolsFound: 0, idolsPlayed: 0, idoledOut: false,
      betrayed: [], betrayedBy: [], allies: ['Fiore'], showmances: [{ partner: 'Thom', ended: 'intact' }],
      rivals: [], chalWins: 2, schemesCaught: 0 }
  } } } });
}

describe('buildFranchiseMeta', () => {
  const cast = [
    { name: 'Fiore', isReturnee: true }, { name: 'Thom', isReturnee: true },
    { name: 'MacArthur', isReturnee: true }, { name: 'Newbie', isReturnee: false }
  ];
  it('builds profiles only for returnees with history', () => {
    seedLedgerS12();
    const meta = buildFranchiseMeta(cast, { franchiseMeta: true });
    expect(meta.profiles['Fiore'].repScore).toBeGreaterThan(0.5);   // winner
    expect(meta.profiles['Fiore'].resume.length).toBeGreaterThan(0);
    expect(meta.profiles['Thom'].blindsideWariness).toBeGreaterThan(0);
    expect(meta.profiles['Thom'].idolParanoia).toBeGreaterThan(0);  // idoled out + blindsided
    expect(meta.profiles['Fiore'].knownSchemer).toBeGreaterThan(0); // betrayer + caught scheming
    expect(meta.profiles['Newbie']).toBeUndefined();
  });
  it('seeds asymmetric betrayal bonds and ally/showmance bonds', () => {
    seedLedgerS12();
    const meta = buildFranchiseMeta(cast, { franchiseMeta: true });
    const betrayal = meta.seededPairs.find(p => p.kind === 'betrayal');
    expect(betrayal).toBeTruthy(); // Fiore betrayed Thom
    const allies = meta.seededPairs.find(p => p.kind === 'allies' && [p.a, p.b].includes('MacArthur'));
    expect(allies.bondDelta).toBeGreaterThan(0);
    const showmance = meta.seededPairs.find(p => p.kind === 'showmance-intact');
    expect(showmance.bondDelta).toBeGreaterThan(0);
    for (const p of meta.seededPairs) expect(Math.abs(p.bondDelta)).toBeLessThanOrEqual(6);
  });
  it('returns null when toggled off or when no returnee has history', () => {
    seedLedgerS12();
    expect(buildFranchiseMeta(cast, { franchiseMeta: false })).toBeNull();
    expect(buildFranchiseMeta([{ name: 'Newbie', isReturnee: false }], { franchiseMeta: true })).toBeNull();
  });
});
