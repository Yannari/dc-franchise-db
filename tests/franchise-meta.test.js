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
import { deriveSeasonRecord, recordSeasonToLedger, buildFranchiseMeta, franchiseLedger } from '../js/franchise-meta.js';

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

import { exportActiveFranchise, importFranchiseExport, retrofitFranchiseMeta } from '../js/franchise-meta.js';

describe('resume line ordering', () => {
  it('leads with wins even when older seasons had weak placements', () => {
    setFranchiseLedger({ seasons: {
      '5': { seasonName: 'S5', players: { 'Jasmine': { placement: 14, winner: false, finalist: false, blindsided: false, blindsidedBy: [], blindsidesAuthored: 0, idolsFound: 0, idolsPlayed: 0, idoledOut: false, betrayed: [], betrayedBy: [], allies: [], showmances: [], rivals: [], chalWins: 0, schemesCaught: 0 } } },
      '10': { seasonName: 'S10', players: { 'Jasmine': { placement: 1, winner: true, finalist: true, blindsided: false, blindsidedBy: [], blindsidesAuthored: 2, idolsFound: 0, idolsPlayed: 0, idoledOut: false, betrayed: [], betrayedBy: [], allies: [], showmances: [], rivals: [], chalWins: 4, schemesCaught: 0 } } }
    } });
    const meta = buildFranchiseMeta([{ name: 'Jasmine', isReturnee: true }], { franchiseMeta: true });
    const resume = meta.profiles['Jasmine'].resume;
    // One line per season, best season first, feats folded into that season's line
    expect(resume[0]).toBe('Won Season 10 — 2 blindsides, 4 immunity wins');
    expect(resume[1]).toBe('Placed 14th in Season 5');
    expect(resume.length).toBe(2);
  });
  it('caps the resume at 3 seasons, covering a little of each', () => {
    const mkSeason = (placement, extra = {}) => ({ placement, winner: placement === 1, finalist: placement <= 2,
      blindsided: false, blindsidedBy: [], blindsidesAuthored: 0, idolsFound: 0, idolsPlayed: 0, idoledOut: false,
      betrayed: [], betrayedBy: [], allies: [], showmances: [], rivals: [], chalWins: 0, schemesCaught: 0, ...extra });
    setFranchiseLedger({ seasons: {
      '3': { seasonName: 'S3', players: { 'Vet': mkSeason(9) } },
      '5': { seasonName: 'S5', players: { 'Vet': mkSeason(2) } },
      '7': { seasonName: 'S7', players: { 'Vet': mkSeason(12) } },
      '9': { seasonName: 'S9', players: { 'Vet': mkSeason(1) } }
    } });
    const resume = buildFranchiseMeta([{ name: 'Vet', isReturnee: true }], { franchiseMeta: true }).profiles['Vet'].resume;
    expect(resume.length).toBe(3);                                 // capped
    expect(resume[0]).toBe('Won Season 9');
    expect(resume[1]).toContain('Finalist in Season 5');
    expect(new Set(resume.map(l => l.match(/Season (\d+)/)[1])).size).toBe(3); // three DIFFERENT seasons
  });
});

describe('retrofitFranchiseMeta (ledger-load race self-heal)', () => {
  it('rebuilds null meta before episode 1 and seeds bonds; no-op once episodes exist', () => {
    seedLedgerS12();
    setPlayers([{ name: 'Fiore', isReturnee: true }, { name: 'Thom', isReturnee: true }]);
    setSeasonConfig({ ...defaultConfig(), seasonNumber: 20, franchiseMeta: true });
    setGs({ initialized: true, franchiseMeta: null, episodeHistory: [], bonds: {} });
    expect(retrofitFranchiseMeta()).toBe(true);
    expect(gs.franchiseMeta.profiles['Fiore'].repScore).toBeGreaterThan(0);
    expect(Object.keys(gs.bonds).length).toBeGreaterThan(0); // betrayal seed Fiore/Thom applied
    // Second call is a no-op (meta already present)
    expect(retrofitFranchiseMeta()).toBe(false);
    // And never fires once an episode has been simulated
    setGs({ initialized: true, franchiseMeta: null, episodeHistory: [{ num: 1 }], bonds: {} });
    expect(retrofitFranchiseMeta()).toBe(false);
  });
});

describe('franchise export / import round-trip', () => {
  it('exports the active franchise and re-imports it as a new active franchise', () => {
    setFranchiseLedger({ seasons: { '12': { seasonName: 'S12', players: { 'Fiore': { placement: 1, winner: true } } } } });
    renameFranchise('main', 'DC Canon');
    const exported = exportActiveFranchise();
    expect(exported).toMatchObject({ type: 'dc-franchise-export', v: 2, name: 'DC Canon', exportedSeasons: 1 });
    // Mutating the export must not touch the live ledger (deep copy)
    exported.seasons['12'].seasonName = 'Mutated';
    expect(activeSeasons()['12'].seasonName).toBe('S12');
    const res = importFranchiseExport(exported);
    expect(res.ok).toBe(true);
    expect(franchiseLedger.active).toBe(res.id);           // imported becomes active
    expect(res.id).not.toBe('main');                        // new franchise, no merge
    expect(activeSeasons()['12'].seasonName).toBe('Mutated');
    expect(franchiseLedger.franchises.main.seasons['12'].seasonName).toBe('S12'); // original intact
  });
  it('rejects files that are not franchise exports', () => {
    expect(importFranchiseExport({ seasons: {} }).ok).toBe(false);
    expect(importFranchiseExport({ type: 'dc-franchise-export' }).ok).toBe(false);
  });
});

describe('placement derivation with twist eliminations (ported from stats-export)', () => {
  it('orders by permanent exit (RI duel loss) and jury votes, not naive boot order', () => {
    const state = {
      seasonNumber: 42,
      players: ['A', 'B', 'C', 'D', 'E', 'F'].map(n => ({ name: n })),
      gs: {
        phase: 'complete',
        finaleResult: { winner: 'F', finalists: ['F', 'E', 'D'], votes: { E: 4, D: 1 } },
        episodeHistory: [
          { num: 1, eliminated: 'A' },                 // A voted out → Rescue Island
          { num: 2, eliminated: 'B', riDuel: { loser: 'A' } }, // A's PERMANENT exit is the duel loss
          { num: 3, multiTribalElims: ['C'] }          // multi-tribal boot not in ep.eliminated
        ],
        bonds: {}, advantages: [], namedAlliances: [], showmances: [], schemesCaught: {}
      }
    };
    const rec = deriveSeasonRecord(state);
    expect(rec.players['F'].placement).toBe(1);  // winner
    expect(rec.players['E'].placement).toBe(2);  // finalist, more jury votes
    expect(rec.players['D'].placement).toBe(3);
    expect(rec.players['C'].placement).toBe(4);  // last permanent exit
    expect(rec.players['B'].placement).toBe(5);
    expect(rec.players['A'].placement).toBe(6);  // earliest permanent exit despite two boot events
    expect(rec.players['A'].episodesLasted).toBe(2); // duel ep, not first vote-out ep
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

import { backfillFromEnrichedSeason } from '../js/franchise-meta.js';

describe('backfillFromEnrichedSeason (chronicle-enriched)', () => {
  const enriched = {
    type: 'dc-enriched-season', seasonNumber: 3, seasonName: 'World Tour', castSize: 4, episodeCount: 12,
    players: {
      'Emma': { placement: 1, winner: true, finalist: true, episodesLasted: 12, chalWins: 3, allies: ['Kitty'], slug: 'emma' },
      'Kitty': { placement: 2, finalist: true, episodesLasted: 12, allies: ['Emma'], showmances: [{ partner: 'Noah', ended: 'intact' }] },
      'Noah': { placement: 5, episodesLasted: 9, blindsided: true, blindsidedBy: ['Jacques'], betrayedBy: ['Jacques'], showmances: [{ partner: 'Kitty', ended: 'intact' }] },
      'Jacques': { placement: 4, episodesLasted: 10, blindsidesAuthored: 1, betrayed: ['Noah'], idolsPlayed: 1, schemesCaught: 1 }
    }
  };
  it('imports full-record fields and marks the season enriched', () => {
    setFranchiseLedger({ seasons: {} });
    const res = backfillFromEnrichedSeason(enriched);
    expect(res).toMatchObject({ ok: true, seasonNum: 3, winner: 'Emma', playerCount: 4 });
    const s = activeSeasons()['3'];
    expect(s.source).toBe('enriched');
    expect(s.players['Noah']).toMatchObject({ blindsided: true, blindsidedBy: ['Jacques'], backfilled: true });
    expect(s.players['Jacques'].betrayed).toEqual(['Noah']);
    expect(s.players['Kitty'].showmances[0].partner).toBe('Noah');
  });
  it('outranks light backfills but never live/manual records', () => {
    // enriched over light: allowed
    setFranchiseLedger({ seasons: { '3': { seasonName: 'Light', players: { 'Emma': { placement: 1, winner: true, backfilled: true } } } } });
    expect(backfillFromEnrichedSeason(enriched).ok).toBe(true);
    // light over enriched: refused (both DB-style and single-file backfills)
    expect(backfillFromSeasonsDb({ seasons: [{ seasonNumber: 3, seasonName: 'Clobber', winner: { name: 'X' }, players: [{ name: 'X', placement: 1 }] }] })).toBe(0);
    expect(backfillFromSeasonData({ seasonNumber: 3, title: 'Clobber2', placements: [{ placement: 1, name: 'X', phase: 'Winner' }] }).ok).toBe(false);
    expect(activeSeasons()['3'].source).toBe('enriched');
    // enriched over live: refused
    setFranchiseLedger({ seasons: { '3': { seasonName: 'Live', players: { 'Emma': { placement: 1, winner: true } } } } });
    expect(backfillFromEnrichedSeason(enriched).ok).toBe(false);
    expect(activeSeasons()['3'].seasonName).toBe('Live');
    // enriched over enriched: allowed (re-import/refresh)
    setFranchiseLedger({ seasons: {} });
    expect(backfillFromEnrichedSeason(enriched).ok).toBe(true);
    expect(backfillFromEnrichedSeason({ ...enriched, seasonName: 'Refreshed' }).ok).toBe(true);
    expect(activeSeasons()['3'].seasonName).toBe('Refreshed');
  });
  it('rejects wrong types and respects canon lock', () => {
    setFranchiseLedger({ seasons: {} });
    expect(backfillFromEnrichedSeason({ seasonNumber: 3, players: {} }).ok).toBe(false);
    setFranchiseLocked('main', true);
    expect(backfillFromEnrichedSeason(enriched).ok).toBe(false);
    setFranchiseLocked('main', false);
  });
});

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

// ══════════════════════════════════════════════════════════════════════
// Legacy layer — careerFor / franchiseRecords / returneePools + canon lock
// ══════════════════════════════════════════════════════════════════════
import { careerFor, franchiseRecords, returneePools, setFranchiseLocked,
  isFranchiseLocked, backfillFromSeasonsDb, backfillFromSeasonData,
  wipeLedger, deleteFranchise } from '../js/franchise-meta.js';

function _rec(o = {}) {
  return { placement: 0, winner: false, finalist: false, blindsided: false, blindsidedBy: [],
    blindsidesAuthored: 0, idolsFound: 0, idolsPlayed: 0, idoledOut: false, betrayed: [], betrayedBy: [],
    allies: [], showmances: [], rivals: [], chalWins: 0, schemesCaught: 0, ...o };
}

describe('careerFor', () => {
  function seedCareer() {
    // Nyla: 3 seasons — a title, a finals loss, and a mid boot with schemes.
    setFranchiseLedger({ seasons: {
      '4': { seasonName: 'S4', castSize: 12, players: {
        Nyla: _rec({ placement: 1, winner: true, finalist: true, chalWins: 3, idolsPlayed: 2, idolsFound: 3, blindsidesAuthored: 2, allies: ['Bea'], betrayed: ['Cal'], showmances: [{ partner: 'Dov', ended: 'intact' }], slug: 'nyla-x' }),
        Bea: _rec({ placement: 2, finalist: true, allies: ['Nyla'] }),
        Cal: _rec({ placement: 8, blindsided: true, blindsidedBy: ['Nyla'], betrayedBy: ['Nyla'] })
      } },
      '6': { seasonName: 'S6', castSize: 14, players: {
        Nyla: _rec({ placement: 2, finalist: true, chalWins: 2, blindsidesAuthored: 1, allies: ['Bea'], rivals: ['Cal'], betrayed: ['Eve'], showmances: [{ partner: 'Fen', ended: 'breakup' }] }),
        Bea: _rec({ placement: 5 }), Cal: _rec({ placement: 3, finalist: true }), Eve: _rec({ placement: 9, betrayedBy: ['Nyla'] })
      } },
      '9': { seasonName: 'S9', castSize: 16, players: {
        Nyla: _rec({ placement: 11, blindsided: true, blindsidedBy: ['Cal'], chalWins: 1, betrayed: ['Bea'], rivals: ['Cal'], schemesCaught: 2 }),
        Cal: _rec({ placement: 1, winner: true, finalist: true }), Bea: _rec({ placement: 10, betrayedBy: ['Nyla'] })
      } }
    } });
  }
  it('aggregates totals, sorted people, and badges', () => {
    seedCareer();
    const c = careerFor('Nyla');
    expect(c.slug).toBe('nyla-x');                       // slug from a season that has one
    expect(c.seasons.map(s => s.seasonNum)).toEqual([4, 6, 9]); // oldest→newest
    expect(c.totals).toMatchObject({ seasons: 3, wins: 1, finals: 2, chalWins: 6, idolsPlayed: 2,
      idolsFound: 3, blindsidesAuthored: 3, timesBlindsided: 1, betrayalsCommitted: 3, bestPlacement: 1 });
    expect(c.totals.avgPlacement).toBeCloseTo((1 + 2 + 11) / 3, 1);
    // people aggregation + count sort
    expect(c.people.allies[0]).toEqual({ name: 'Bea', count: 2 });
    expect(c.people.showmances.length).toBe(2);
    // badges: CHAMPION ×1 plus at least one more (BLINDSIDE ARTIST, CHALLENGE MACHINE, SURVIVOR, SNAKE, HEARTBREAKER)
    expect(c.badges).toContain('CHAMPION ×1');
    expect(c.badges).toContain('BLINDSIDE ARTIST');
    expect(c.badges).toContain('CHALLENGE MACHINE');
    expect(c.badges).toContain('SURVIVOR');
    expect(c.badges.length).toBeGreaterThan(1);
  });
  it('returns null for a name with no history', () => {
    seedCareer();
    expect(careerFor('Nobody')).toBeNull();
  });
  it('excluded seasons do not count toward a career', () => {
    seedCareer();
    setSeasonIncluded(9, false);
    const c = careerFor('Nyla');
    expect(c.totals.seasons).toBe(2);
    expect(c.totals.timesBlindsided).toBe(0);
  });
});

describe('franchiseRecords', () => {
  it('lists holders and enforces the min-2-seasons rule for avg placement', () => {
    setFranchiseLedger({ seasons: {
      '1': { seasonName: 'S1', castSize: 10, players: {
        Ace: _rec({ placement: 1, winner: true, finalist: true, chalWins: 4, blindsidesAuthored: 3 }),
        Bo: _rec({ placement: 2, finalist: true }) } },
      '2': { seasonName: 'S2', castSize: 10, players: {
        Ace: _rec({ placement: 3, finalist: true, chalWins: 1 }),
        Bo: _rec({ placement: 6 }) } }
    } });
    const recs = franchiseRecords();
    const titles = recs.find(r => r.title === 'Most titles');
    expect(titles).toMatchObject({ holder: 'Ace', value: 1 });
    const avg = recs.find(r => r.title === 'Best average placement');
    // Ace avg (1+3)/2=2, Bo avg (2+6)/2=4 → Ace holds it; both have ≥2 seasons
    expect(avg).toMatchObject({ holder: 'Ace' });
    expect(avg.value).toBeCloseTo(2, 1);
  });
  it('skips average-placement record when nobody has 2 scored seasons', () => {
    setFranchiseLedger({ seasons: {
      '1': { seasonName: 'S1', players: { Solo: _rec({ placement: 1, winner: true, finalist: true }) } }
    } });
    expect(franchiseRecords().find(r => r.title === 'Best average placement')).toBeUndefined();
  });
});

describe('returneePools — flavor pools and feuds', () => {
  it('flavor pools are non-exclusive and feuds pair up real history', () => {
    setFranchiseLedger({ seasons: {
      '1': { seasonName: 'S1', castSize: 10, players: {
        // Champion AND challenge machine AND schemer-villain — legends + titans + villains
        Ace: _rec({ placement: 1, winner: true, finalist: true, chalWins: 5, blindsidesAuthored: 2, betrayed: ['Pip', 'Sam'], episodesLasted: 14, archetype: 'schemer' }),
        Pip: _rec({ placement: 10, betrayedBy: ['Ace'], episodesLasted: 1 }),   // first boot (placement === castSize)
        Sam: _rec({ placement: 4, betrayedBy: ['Ace'], showmances: [{ partner: 'Lux', ended: 'intact' }], episodesLasted: 12 }),
        Lux: _rec({ placement: 5, showmances: [{ partner: 'Sam', ended: 'intact' }], rivals: ['Pip'], episodesLasted: 11, archetype: 'hero', allies: ['Sam'], popularity: 3 })
      } },
      '2': { seasonName: 'S2', castSize: 10, players: {
        Ace: _rec({ placement: 3, finalist: true, chalWins: 2, blindsidesAuthored: 1, episodesLasted: 13, archetype: 'schemer' }),
        Lux: _rec({ placement: 6, archetype: 'hero', allies: ['Pip'], episodesLasted: 9, popularity: 2 })
      } }
    } });
    const p = returneePools();
    expect(p.legends.map(x => x.name)).toContain('Ace');
    expect(p.challengeTitans.map(x => x.name)).toContain('Ace');   // 7 career chalWins
    expect(p.villains.map(x => x.name)).toContain('Ace');          // schemer archetype + 2 betrayals
    expect(p.heroes.map(x => x.name)).toContain('Lux');            // hero, clean hands, allies, fan-loved
    expect(p.heroes.map(x => x.name)).not.toContain('Ace');        // betrayers can never be heroes
    expect(p.showmanceStars.map(x => x.name)).toEqual(expect.arrayContaining(['Sam', 'Lux']));
    expect(p.firstBootClub.map(x => x.name)).toContain('Pip');
    expect(p.marathoners.map(x => x.name)).toContain('Ace');       // 27 episodes
    // feuds: betrayal pair (Ace vs Pip or Ace vs Sam) present with a why
    expect(p.feuds.length).toBeGreaterThan(0);
    const feud = p.feuds.find(f => [f.a, f.b].includes('Ace'));
    expect(feud).toBeTruthy();
    expect(feud.why).toMatch(/betrayed/);
  });
  // CLEAN HANDS ARE WORTH WHAT THE OPPORTUNITY WAS WORTH.
  //
  // The gate was absolute — one betrayal ever and nothing could get a player in
  // — so it rewarded being evicted early: a week-two boot has betrayed nobody
  // because nothing happened to them, while a finalist who made one hard cut
  // across a whole season was barred outright.
  it('rates clean hands by how far they got, and prices a betrayal instead of barring it', () => {
    setFranchiseLedger({ seasons: {
      '1': { seasonName: 'S1', castSize: 10, players: {
        // Same clean record, opposite opportunity.
        Deep: _rec({ placement: 1, winner: true, finalist: true, episodesLasted: 14,
          archetype: 'loyal-soldier', allies: ['Early', 'Cut'], popularity: 2 }),
        Early: _rec({ placement: 10, episodesLasted: 1,
          archetype: 'loyal-soldier', allies: ['Deep', 'Cut'], popularity: 2 }),
        // Went deep, made one cut, and the audience loved him anyway.
        Cut: _rec({ placement: 2, finalist: true, episodesLasted: 13, betrayed: ['Early'],
          archetype: 'social-butterfly', allies: ['Deep'], popularity: 4 }),
      } }
    } });
    // The pool is sorted strongest-first and drops the score, so rank IS the
    // assertion.
    const heroes = returneePools().heroes.map(x => x.name);
    // Reaching the end without betraying anybody beats never having the chance.
    expect(heroes).toContain('Deep');
    expect(heroes.indexOf('Deep')).toBeLessThan(
      heroes.indexOf('Early') === -1 ? Number.MAX_SAFE_INTEGER : heroes.indexOf('Early'));
    expect(returneePools().heroes.find(x => x.name === 'Deep').why)
      .toMatch(/clean hands to the end/);
    // And one cut no longer erases a whole career from the category.
    expect(heroes).toContain('Cut');
    expect(heroes.indexOf('Deep')).toBeLessThan(heroes.indexOf('Cut'));
  });

  it('blindsides alone are NOT villainy — a clean-handed hero never qualifies', () => {
    setFranchiseLedger({ seasons: {
      '1': { seasonName: 'S1', castSize: 10, players: {
        // A hero who orchestrated 4 blindsides but never betrayed an ally or got caught scheming
        Rook: _rec({ placement: 1, winner: true, finalist: true, blindsidesAuthored: 4, episodesLasted: 14, archetype: 'hero', allies: ['Wren', 'Tam'], popularity: 4 })
      } }
    } });
    const p = returneePools();
    expect(p.villains.map(x => x.name)).not.toContain('Rook');
    expect(p.heroes.map(x => x.name)).toContain('Rook');
  });
});

describe('returneePools', () => {
  it('sorts one player into each pool with the priority rule', () => {
    setFranchiseLedger({ seasons: {
      // Champ — also blindsided, but legends wins the tie-break
      '1': { seasonName: 'S1', castSize: 12, players: {
        Champ: _rec({ placement: 1, winner: true, finalist: true, blindsided: true, blindsidedBy: ['Rob'] }),
        Rob: _rec({ placement: 6, blindsided: true, blindsidedBy: ['Champ'], blindsidesAuthored: 2 }),
        Fade: _rec({ placement: 2, finalist: true }),
        Doom: _rec({ placement: 11 }) } },
      // Fade falls: was finalist S1, bottom-half in S2 → fallenAngels
      '2': { seasonName: 'S2', castSize: 12, players: {
        Fade: _rec({ placement: 10 }),
        Doom: _rec({ placement: 12 }) } }
    } });
    const p = returneePools();
    const has = (pool, nm) => p[pool].some(x => x.name === nm);
    expect(has('legends', 'Champ')).toBe(true);
    expect(has('unfinishedBusiness', 'Champ')).toBe(false); // priority: only in legends
    expect(has('fallenAngels', 'Fade')).toBe(true);
    expect(has('unfinishedBusiness', 'Rob')).toBe(true);    // blindsided last season, ran deep
    expect(has('redemption', 'Doom')).toBe(true);           // never made merge across 2 runs
    // each with a why line + slug
    expect(p.legends.find(x => x.name === 'Champ').why).toMatch(/champion/i);
    expect(p.legends[0].slug).toBeTruthy();
  });

  /* ── THE MILESTONE A CAREER NEVER REACHED IS THE SHOW'S OWN ───────────
     "Never made the merge" was printed over a house, which has no merge, and
     fixed with a two-way check — `every season is big-brother ? 'jury' :
     'the merge'` — that then printed "Never made the merge" over a CASTLE,
     which has neither. Three lines under a comment documenting the identical
     bug. The word comes from the registry, and a career spanning two shows
     names no show's milestone, because there is no boundary both have. */
  it("says the milestone in the show's own word", () => {
    const early = () => _rec({ placement: 11 });
    const why = format => {
      setFranchiseLedger({ seasons: {
        1: { seasonName: 'S1', castSize: 12, format, players: { Doom: early() } },
        2: { seasonName: 'S2', castSize: 12, format, players: { Doom: early() } },
      } });
      const row = returneePools().redemption.find(x => x.name === 'Doom');
      expect(row, `${format} produced no redemption row to read`).toBeTruthy();
      return row.why;
    };
    expect(why('total-drama')).toContain('the merge');
    expect(why('big-brother')).toContain('jury');
    const tr = why('traitors');
    expect(tr, 'a castle was told it never made the merge').not.toContain('merge');
    expect(tr, 'a castle was told it never made jury').not.toContain('jury');
    expect(tr).toContain('the final table');

    // A career across two shows names NEITHER, because neither boundary is
    // one both of them have.
    setFranchiseLedger({ seasons: {
      1: { seasonName: 'S1', castSize: 12, format: 'total-drama', players: { Doom: early() } },
      2: { seasonName: 'S2', castSize: 12, format: 'traitors', players: { Doom: early() } },
    } });
    const mixed = returneePools().redemption.find(x => x.name === 'Doom').why;
    expect(mixed).not.toContain('merge');
    expect(mixed).not.toContain('final table');
  });
});

describe('canon lock', () => {
  function seedLocked() {
    setFranchiseLedger({ seasons: { '1': { seasonName: 'S1', players: { A: _rec({ placement: 1, winner: true }) } } } });
    setFranchiseLocked('main', true);
  }
  it('blocks manual record, backfills, wipe, and delete while locked', () => {
    seedLocked();
    setSeasonConfig({ ...defaultConfig(), seasonNumber: 5, name: 'Blocked' });
    setGs({ phase: 'complete', seasonNumber: 5, finaleResult: { winner: 'A', finalists: ['A'] },
      episodeHistory: [], bonds: {}, advantages: [], namedAlliances: [], showmances: [], schemesCaught: {} });
    expect(recordSeasonToLedger(null, 'manual')).toBe(false);
    expect(recordSeasonToLedger(null, 'live')).toBe(false);
    expect(backfillFromSeasonsDb({ seasons: [{ seasonNumber: 2, players: [{ name: 'Z', placement: 1 }] }] })).toBe(0);
    expect(backfillFromSeasonData({ seasonNumber: 3, placements: [{ name: 'Z', placement: 1 }] })).toMatchObject({ ok: false, error: 'Franchise is locked' });
    expect(recordSeasonFromSavestate({ gs: { phase: 'complete', seasonNumber: 4 } })).toMatchObject({ ok: false, error: 'Franchise is locked' });
    expect(wipeLedger()).toBe(false);
    expect(activeSeasons()['1']).toBeTruthy();            // nothing wiped
    const other = createFranchise('Temp'); setActiveFranchise('main');
    expect(deleteFranchise('main')).toBe(false);          // locked can't be deleted
    void other;
  });
  it('unlock restores writes; importFranchiseExport works even while locked', () => {
    seedLocked();
    // import creates a NEW franchise regardless of lock
    const res = importFranchiseExport({ type: 'dc-franchise-export', seasons: { '9': { seasonName: 'S9', players: {} } } });
    expect(res.ok).toBe(true);
    // back to the locked one, unlock, then a wipe succeeds
    setActiveFranchise('main');
    expect(isFranchiseLocked('main')).toBe(true);
    setFranchiseLocked('main', false);
    expect(isFranchiseLocked('main')).toBe(false);
    expect(wipeLedger()).toBe(true);
    expect(activeSeasons()['1']).toBeUndefined();
  });
});

// ── A HOUSE KEEPS ITS FINALE SOMEWHERE ELSE ───────────────────────────────
//
// `gs.finaleResult` is Total Drama's. Big Brother writes `gs.bb.finale` with
// its own field names, so the ledger read an empty object for every Big
// Brother season it ever recorded: no winner, no finalists.
//
// With no finalists, placements fall back to eviction order numbered from the
// end — which crowns the LAST person evicted, drops the actual winner (never
// evicted, so never in the eviction list at all) to the bottom of the cast,
// and leaves nobody carrying `winner: true`. The symptom on screen was a season
// card with no winner, a "runner-up" who came fourth, an empty Hall of Fame,
// and the champion filed under "first out".
// ── TWO SHOWS, ONE SLOT ────────────────────────────────────────────────────
//
// The ledger keys a season by its NUMBER, so Big Brother 1 and Total Drama
// season 1 are the same entry and recording one destroys the other. It is the
// place that decides whether returnees remember each other, so the cost is a
// cast who have played together and arrive as strangers: no old alliance, no
// grudge, no showmance.
function fabricateHouse() {
  const _stats = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 };
  setPlayers(['Misha', 'Jules', 'Joel', 'Tobias', 'Stella'].map(name =>
    ({ name, isReturnee: false, stats: { ..._stats } })));
  setSeasonConfig({ ...defaultConfig(), seasonNumber: 1, name: 'Big Brother 1', franchiseMeta: true });
  setGs({
    phase: 'complete',
    format: 'big-brother',
    // Deliberately absent: a house never writes this.
    finaleResult: null,
    bb: { finale: { winner: 'Misha', runnerUp: 'Jules', cut: 'Joel',
      votes: { Misha: 5, Jules: 4 }, jury: ['Tobias', 'Stella'],
      favourite: { winner: 'Tobias', tally: [{ name: 'Tobias', share: 20 }], prize: 5000 } } },
    episodeHistory: [
      { num: 1, eliminated: 'Stella', immunityWinner: 'Tobias', vetoWinner: 'Misha', votingLog: [] },
      { num: 2, eliminated: 'Tobias', immunityWinner: 'Misha', vetoWinner: 'Misha', votingLog: [] },
    ],
    bonds: {}, advantages: [], namedAlliances: [], showmances: [], schemesCaught: {},
  });
}

describe('the ledger holds both shows', () => {
  it('records a Big Brother season without destroying Total Drama season 1', () => {
    setFranchiseLedger({ seasons: {
      '1': { seasonName: 'Total Drama 1', format: 'total-drama', castSize: 4, players: {
        Ava: _rec({ placement: 1, winner: true, finalist: true, allies: ['Ben'] }),
        Ben: _rec({ placement: 2, finalist: true, allies: ['Ava'] }),
      } },
    } });

    fabricateHouse();                    // Big Brother, season number 1
    expect(recordSeasonToLedger(null, 'manual')).not.toBe(false);

    const seasons = franchiseLedger.franchises[franchiseLedger.active].seasons;
    const names = Object.values(seasons).flatMap(s => Object.keys(s.players || {}));
    expect(names, 'Total Drama season 1 was overwritten').toEqual(expect.arrayContaining(['Ava', 'Ben']));
    expect(names, 'the Big Brother season was not recorded').toEqual(expect.arrayContaining(['Misha', 'Jules']));
    expect(Object.keys(seasons).length).toBe(2);
  });

  it('moves a season recorded under the old key out of the way', () => {
    // A ledger written before the key knew about shows: Big Brother 1 is
    // sitting on "1", where the next Total Drama season 1 will land on it.
    setFranchiseLedger({ seasons: {
      '1': { seasonName: 'Big Brother 1', format: 'big-brother', castSize: 3, players: {
        Misha: _rec({ placement: 1, winner: true, finalist: true }),
      } },
    } });
    const seasons = franchiseLedger.franchises[franchiseLedger.active].seasons;
    expect(Object.keys(seasons)).toEqual(['bb-1']);
    // And the record itself is untouched by the move.
    expect(seasons['bb-1'].players.Misha.winner).toBe(true);
  });

  it('gives a returning cast their history back', () => {
    setFranchiseLedger({ seasons: {} });
    fabricateHouse();
    recordSeasonToLedger(null, 'manual');
    // The same houseguests, brought back.
    const returning = ['Misha', 'Jules', 'Joel'].map(name => ({ name, isReturnee: true, stats: {} }));
    setPlayers(returning);
    const meta = buildFranchiseMeta(returning, { franchiseMeta: true });
    expect(meta, 'no returnee history at all').toBeTruthy();
    expect(Object.keys(meta.profiles)).toEqual(expect.arrayContaining(['Misha', 'Jules', 'Joel']));
  });
});

describe('deriveSeasonRecord reads a Big Brother finale', () => {

  it('crowns the winner the jury voted for, not the last person evicted', () => {
    fabricateHouse();
    const rec = deriveSeasonRecord();
    expect(rec.players['Misha']).toMatchObject({ placement: 1, winner: true, finalist: true });
    expect(rec.players['Jules']).toMatchObject({ placement: 2, finalist: true });
    expect(rec.players['Joel']).toMatchObject({ placement: 3, finalist: true });
    // Evicted, so they place BELOW the final three — the bug had it the other
    // way round, with Tobias first and Misha last.
    expect(rec.players['Tobias'].placement).toBe(4);
    expect(rec.players['Stella'].placement).toBe(5);
    expect(rec.players['Tobias'].winner).toBe(false);
  });

  it('stamps the show on the record, so labels can use its words', () => {
    fabricateHouse();
    expect(deriveSeasonRecord().format).toBe('big-brother');
  });

  // The audience's pick is not the jury's, and the ledger recorded it nowhere
  // -- so the only thing on the Legacy tab saying "fan favorite" was a returnee
  // bucket whose name happens to contain the words, leading with somebody the
  // audience never voted for.
  it('records the audience ballot, not the jury result', () => {
    fabricateHouse();
    const rec = deriveSeasonRecord();
    expect(rec.fanFavorite).toBe('Tobias');
    expect(rec.players['Tobias'].winner).toBe(false);   // loved, and still not the winner
  });

  it('counts vetoes as competition wins, not only the HOH', () => {
    fabricateHouse();
    const rec = deriveSeasonRecord();
    // Misha: one HOH (stamped as immunityWinner) plus two vetoes.
    expect(rec.players['Misha'].chalWins).toBe(3);
    expect(rec.players['Tobias'].chalWins).toBe(1);
  });
});
