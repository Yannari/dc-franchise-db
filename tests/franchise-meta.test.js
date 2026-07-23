import { describe, it, expect } from 'vitest';
import { franchiseLedger, setFranchiseLedger, activeSeasons, activeFranchise,
  listFranchises, createFranchise, renameFranchise, deleteFranchise, setActiveFranchise,
  setSeasonIncluded, recordSeasonFromSavestate, META_WEIGHTS } from '../js/franchise-meta.js';

describe('franchise-meta skeleton', () => {
  it('exposes an empty v2 ledger and weights', () => {
    setFranchiseLedger(null);
    expect(franchiseLedger.v).toBe(2);
    expect(franchiseLedger.active).toBe('main');
    expect(activeSeasons()).toEqual({});
    expect(META_WEIGHTS.repThreatFactor).toBeGreaterThan(0);
  });
  it('setFranchiseLedger accepts v2 and migrates v1', () => {
    // v1 input migrates to v2 with a `main` franchise carrying the old seasons.
    setFranchiseLedger({ seasons: { '10': { seasonName: 'X', players: {} } } });
    expect(franchiseLedger.v).toBe(2);
    expect(franchiseLedger.franchises.main.seasons['10'].seasonName).toBe('X');
    expect(activeSeasons()['10'].seasonName).toBe('X');
    setFranchiseLedger({ seasons: {} });
  });
  it('malformed input yields an empty v2 ledger', () => {
    setFranchiseLedger(42);
    expect(franchiseLedger.v).toBe(2);
    expect(activeSeasons()).toEqual({});
  });
});

describe('multi-franchise management', () => {
  it('creates, renames, switches, and deletes franchises with isolation', () => {
    setFranchiseLedger({ seasons: {} });
    activeSeasons()['1'] = { seasonName: 'Main S1', players: { A: { placement: 1, winner: true } } };
    const otherId = createFranchise('Spin Off');
    expect(otherId).toBe('spin-off');
    // Recording lands in the ACTIVE franchise only.
    setActiveFranchise(otherId);
    activeSeasons()['1'] = { seasonName: 'Spin S1', players: { B: { placement: 1, winner: true } } };
    expect(Object.keys(activeSeasons())).toEqual(['1']);
    expect(activeSeasons()['1'].seasonName).toBe('Spin S1');
    setActiveFranchise('main');
    expect(activeSeasons()['1'].seasonName).toBe('Main S1'); // untouched
    renameFranchise(otherId, 'Renamed');
    expect(listFranchises().find(f => f.id === otherId).name).toBe('Renamed');
    // uniqueness on slug collision
    expect(createFranchise('Main')).toBe('main-2');
  });
  it('cannot delete the last franchise; reassigns active when active deleted', () => {
    setFranchiseLedger({ seasons: {} });
    const b = createFranchise('B');
    setActiveFranchise(b);
    expect(deleteFranchise(b)).toBe(true);
    expect(franchiseLedger.active).not.toBe(b);
    // now only one franchise remains
    const only = listFranchises()[0].id;
    expect(deleteFranchise(only)).toBe(false);
  });
});

import { setGs, setPlayers, setSeasonConfig, defaultConfig } from '../js/core.js';
import { deriveSeasonRecord, recordSeasonToLedger } from '../js/franchise-meta.js';

function fabricateFinishedSeason() {
  const _stats = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 };
  setPlayers([
    { name: 'Ava', isReturnee: false, stats: { ..._stats } }, { name: 'Ben', isReturnee: false, stats: { ..._stats } },
    { name: 'Cy', isReturnee: false, stats: { ..._stats } }, { name: 'Dee', isReturnee: false, stats: { ..._stats } }
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
    expect(Object.keys(activeSeasons())).toEqual(['15']);
    expect(activeSeasons()['15'].players['Ava'].winner).toBe(true);
  });
  it('skips live recording when auto-record is off, but manual recording still works', () => {
    setFranchiseLedger({ seasons: {} });
    fabricateFinishedSeason();
    setSeasonConfig({ ...defaultConfig(), seasonNumber: 15, franchiseMeta: true, franchiseMetaAutoRecord: false });
    expect(recordSeasonToLedger({}, 'live')).toBe(false);
    expect(activeSeasons()['15']).toBeUndefined();
    expect(recordSeasonToLedger({}, 'manual')).toBe(true);
    expect(activeSeasons()['15'].players['Ava'].winner).toBe(true);
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
  it('does not stack a betrayal AND a blindside for the same victim→author edge', () => {
    // One incident: Fiore both betrayed AND blindsided Thom. Should seed only the betrayal.
    setFranchiseLedger({ seasons: { '12': { seasonName: 'S12', players: {
      'Fiore': { placement: 1, winner: true, finalist: true, episodesLasted: 18, blindsided: false,
        blindsidedBy: [], blindsidesAuthored: 1, idolsFound: 0, idolsPlayed: 0, idoledOut: false,
        betrayed: ['Thom'], betrayedBy: [], allies: [], showmances: [], rivals: [], chalWins: 1, schemesCaught: 0 },
      'Thom': { placement: 5, winner: false, finalist: false, episodesLasted: 14, blindsided: true,
        blindsidedBy: ['Fiore'], blindsidesAuthored: 0, idolsFound: 0, idolsPlayed: 0, idoledOut: true,
        betrayed: [], betrayedBy: ['Fiore'], allies: [], showmances: [], rivals: [], chalWins: 0, schemesCaught: 0 }
    } } } });
    const meta = buildFranchiseMeta(cast, { franchiseMeta: true });
    const thomToFiore = meta.seededPairs.filter(p => p.a === 'Thom' && p.b === 'Fiore');
    expect(thomToFiore.length).toBe(1);
    expect(thomToFiore[0].kind).toBe('betrayal');
    expect(meta.seededPairs.some(p => p.kind === 'blindside')).toBe(false);
  });
  it('returns null when toggled off or when no returnee has history', () => {
    seedLedgerS12();
    expect(buildFranchiseMeta(cast, { franchiseMeta: false })).toBeNull();
    expect(buildFranchiseMeta([{ name: 'Newbie', isReturnee: false }], { franchiseMeta: true })).toBeNull();
  });
});

import { gs } from '../js/core.js';
import { threatScore } from '../js/players.js';

describe('reputation threat multiplier', () => {
  it('raises threatScore for a decorated returnee, decaying over episodes', () => {
    fabricateFinishedSeason(); // any valid gs; then attach meta
    gs.showmances = []; // fabricated showmances use {a,b}; threatScore reads sh.players
    gs.chalRecord = { 'Ava': { wins: 1, podiums: 0, bombs: 0 } }; // decorated returnee: keeps the base challenge-threat stable across episodes so the assertion isolates the rep multiplier's decay
    gs.episode = 1;
    gs.franchiseMeta = { profiles: { 'Ava': { repScore: 1.0 } }, seededPairs: [] };
    const withRep = threatScore('Ava');
    gs.franchiseMeta = null;
    const withoutRep = threatScore('Ava');
    expect(withRep).toBeGreaterThan(withoutRep);
    gs.franchiseMeta = { profiles: { 'Ava': { repScore: 1.0 } }, seededPairs: [] };
    gs.episode = 12; // decayed résumé
    const lateRep = threatScore('Ava');
    expect(lateRep).toBeLessThan(withRep);
    expect(lateRep).toBeGreaterThan(withoutRep); // floor keeps some effect
  });

  it('keeps the detailed breakdown summing to total with rep active', () => {
    fabricateFinishedSeason();
    gs.showmances = [];
    gs.chalRecord = { 'Ava': { wins: 1, podiums: 0, bombs: 0 } };
    gs.episode = 3;
    gs.franchiseMeta = { profiles: { 'Ava': { repScore: 0.8 } }, seededPairs: [] };
    const d = threatScore('Ava', true);
    // components are raw (unweighted); total applies the 0.33 weighting
    expect(d.challenge * 0.33 + d.social * 0.33 + d.strategic * 0.33).toBeCloseTo(d.total, 10);
  });
});

import { backfillFromSeasonsDb, backfillFromSeasonData, franchiseHistorySummary, wipeLedger } from '../js/franchise-meta.js';

describe('backfillFromSeasonData (single-season site file)', () => {
  const seasonFile = {
    seasonNumber: 1, title: 'Island Origins', castSize: 24, episodeCount: 26,
    winner: { name: 'Lindsay', playerSlug: 'lindsay' },
    placements: [
      { placement: 1, name: 'Lindsay', playerSlug: 'lindsay', phase: 'Winner', notes: 'Won Final Tribal 5–4 • 1 votes against' },
      { placement: 2, name: 'Alejandro', playerSlug: 'alejandro', phase: 'Finalist', notes: 'Lost Final Tribal 4–5 • 4 challenge wins • 3 immunity wins • 5 votes against' },
      { placement: 3, name: 'Bridgette', playerSlug: 'bridgette', phase: 'Finalist', notes: '1 jury vote • 5 challenge wins • 4 immunity wins • 20 votes against' },
      { placement: 4, name: 'Geoff', playerSlug: 'geoff', phase: 'Jury', notes: '2 immunity wins' }
    ]
  };
  it('imports a season data file with phases, immunity wins, and slugs', () => {
    setFranchiseLedger({ seasons: {} });
    const res = backfillFromSeasonData(seasonFile);
    expect(res).toMatchObject({ ok: true, seasonNum: 1, winner: 'Lindsay', playerCount: 4 });
    const s = activeSeasons()['1'];
    expect(s.seasonName).toBe('Island Origins');
    expect(s.castSize).toBe(24);
    expect(s.episodeCount).toBe(26);
    expect(s.players['Lindsay']).toMatchObject({ placement: 1, winner: true, finalist: true, backfilled: true, slug: 'lindsay' });
    expect(s.players['Bridgette']).toMatchObject({ placement: 3, winner: false, finalist: true, chalWins: 4 }); // FTC third = finalist via phase
    expect(s.players['Alejandro'].chalWins).toBe(3); // immunity wins parsed from notes, not challenge wins
    expect(s.players['Geoff']).toMatchObject({ finalist: false, chalWins: 2 });
  });
  it('never overwrites a live/manual record, but refreshes a prior backfill', () => {
    setFranchiseLedger({ seasons: { '1': { seasonName: 'Live S1', players: { 'Ava': { placement: 1, winner: true } } } } });
    const blocked = backfillFromSeasonData(seasonFile);
    expect(blocked.ok).toBe(false);
    expect(activeSeasons()['1'].seasonName).toBe('Live S1');
    setFranchiseLedger({ seasons: {} });
    expect(backfillFromSeasonData(seasonFile).ok).toBe(true);
    expect(backfillFromSeasonData({ ...seasonFile, title: 'Refreshed' }).ok).toBe(true); // backfill-over-backfill ok
    expect(activeSeasons()['1'].seasonName).toBe('Refreshed');
  });
  it('rejects non-season files', () => {
    expect(backfillFromSeasonData({ foo: 1 }).ok).toBe(false);
    expect(backfillFromSeasonData({ seasonNumber: 5 }).ok).toBe(false);
  });
});

describe('backfillFromSeasonsDb', () => {
  it('imports placements defensively and never overwrites live-recorded seasons', () => {
    setFranchiseLedger({ seasons: { '11': { seasonName: 'Live S11', players: { 'Fiore': { placement: 2, winner: false, finalist: true } } } } });
    const n = backfillFromSeasonsDb({ seasons: [
      { seasonNumber: 10, seasonName: 'S10', winner: { name: 'Fiore' },
        players: [ { name: 'Fiore', placement: 1 }, { name: 'Thom', placement: 7 } ] },
      { seasonNumber: 11, seasonName: 'Should Not Overwrite', winner: { name: 'X' }, players: [] }
    ] });
    expect(n).toBe(1); // season 11 already live-recorded → skipped
    expect(activeSeasons()['10'].players['Fiore'].winner).toBe(true);
    expect(activeSeasons()['10'].players['Thom'].placement).toBe(7);
    expect(activeSeasons()['11'].seasonName).toBe('Live S11');
    // relationship facts absent in export schema → empty arrays, not undefined
    expect(activeSeasons()['10'].players['Thom'].betrayed).toEqual([]);
    wipeLedger();
    expect(activeSeasons()).toEqual({});
  });
  it('a live season excluded from meta (included:false) still survives a backfill of the same number', () => {
    setFranchiseLedger({ seasons: { '9': { seasonName: 'Live S9', included: false,
      players: { 'Fiore': { placement: 1, winner: true } } } } });
    const n = backfillFromSeasonsDb({ seasons: [
      { seasonNumber: 9, seasonName: 'Backfill Should Not Win', winner: { name: 'X' }, players: [{ name: 'X', placement: 1 }] }
    ] });
    expect(n).toBe(0); // live record protected by backfilled-flags check ONLY
    expect(activeSeasons()['9'].seasonName).toBe('Live S9');
    expect(activeSeasons()['9'].players['Fiore'].winner).toBe(true);
  });
});

describe('include toggle', () => {
  const cast = [ { name: 'Fiore', isReturnee: true }, { name: 'Thom', isReturnee: true },
    { name: 'MacArthur', isReturnee: true } ];
  it('excluded seasons feed nothing to buildFranchiseMeta', () => {
    seedLedgerS12();
    expect(buildFranchiseMeta(cast, { franchiseMeta: true })).toBeTruthy();
    // Exclude the only season → no history → null meta.
    expect(setSeasonIncluded('12', false)).toBe(true);
    expect(buildFranchiseMeta(cast, { franchiseMeta: true })).toBeNull();
    expect(franchiseHistorySummary('Fiore')).toEqual([]);
    // Re-include restores it.
    setSeasonIncluded('12', true);
    expect(buildFranchiseMeta(cast, { franchiseMeta: true })).toBeTruthy();
  });
});

describe('recordSeasonFromSavestate', () => {
  function fakeSavestate(phase = 'complete') {
    return {
      type: 'season-save', name: 'Imported Season',
      config: { seasonNumber: 77, name: 'Imported Season' },
      players: [ { name: 'Zed' }, { name: 'Yon' }, { name: 'Xia' } ],
      gs: {
        phase, seasonNumber: 77,
        finaleResult: { winner: 'Zed', finalists: ['Zed', 'Yon'] },
        episodeHistory: [ { num: 1, eliminated: 'Xia', immunityWinner: 'Zed', votingLog: [], defections: [], idolPlays: [] } ],
        bonds: {}, advantages: [], namedAlliances: [], showmances: [], schemesCaught: {}
      }
    };
  }
  it('records a finished save into the active franchise without touching live gs', () => {
    setFranchiseLedger({ seasons: {} });
    const before = JSON.stringify(gs); // live gs snapshot
    const res = recordSeasonFromSavestate(fakeSavestate());
    expect(res.ok).toBe(true);
    expect(res.seasonNum).toBe(77);
    expect(res.winner).toBe('Zed');
    expect(res.playerCount).toBe(3);
    expect(activeSeasons()['77'].players['Zed'].winner).toBe(true);
    expect(activeSeasons()['77'].source).toBe('imported-save');
    expect(JSON.stringify(gs)).toBe(before); // live gs untouched
  });
  it('rejects an unfinished season and a numberless save', () => {
    setFranchiseLedger({ seasons: {} });
    expect(recordSeasonFromSavestate(fakeSavestate('merge')).ok).toBe(false);
    const noNum = fakeSavestate(); delete noNum.gs.seasonNumber; delete noNum.config.seasonNumber;
    expect(recordSeasonFromSavestate(noNum).error).toMatch(/season number/i);
  });
  it('guards LIVE/MANUAL records: needsConfirm without writing, force overwrites', () => {
    setFranchiseLedger({ seasons: {} });
    activeSeasons()['77'] = { seasonName: 'Existing', source: 'live',
      players: { 'Old': { placement: 1, winner: true } } };
    const guarded = recordSeasonFromSavestate(fakeSavestate());
    expect(guarded.ok).toBe(false);
    expect(guarded.needsConfirm).toBe(true);
    expect(guarded.existingSource).toBe('live');
    expect(guarded.winner).toBe('Old');
    expect(activeSeasons()['77'].players['Old']).toBeTruthy(); // NOT written
    const forced = recordSeasonFromSavestate(fakeSavestate(), { force: true });
    expect(forced.ok).toBe(true);
    expect(activeSeasons()['77'].players['Zed'].winner).toBe(true);
    expect(activeSeasons()['77'].players['Old']).toBeUndefined();
  });
  it('re-dropping an imported-save over its own kind overwrites freely (no confirm)', () => {
    setFranchiseLedger({ seasons: {} });
    expect(recordSeasonFromSavestate(fakeSavestate()).ok).toBe(true);
    const again = recordSeasonFromSavestate(fakeSavestate());
    expect(again.ok).toBe(true);
    expect(again.needsConfirm).toBeUndefined();
  });
});
