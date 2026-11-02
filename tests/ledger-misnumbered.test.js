// A season filed under another show's number (js/franchise-meta.js foldMisnumberedRecords). The Circle 1 was
// played while the settings still said 15 and recorded as ci-15 beside the published ci-1, so every Challenge
// intro named "The Circle 15". The user, 2026-11-02: "theres only 1 circle season and its season 1 delete that
// season 15".
import { describe, expect, it } from 'vitest';
import { setFranchiseLedger, activeSeasons, foldMisnumberedRecords, recordBuiltSeason } from '../js/franchise-meta.js';

const rec = (over = {}) => ({ placement: 2, winner: false, finalist: true, showmances: [], rivals: [], episodesLasted: 0, ...over });
const ledger = () => ({
  v: 2, active: 'main', franchises: { main: { name: 'Main', seasons: {
    15: { seasonName: 'Doom Island', players: { Ann: rec({ placement: 1, winner: true }) } },
    'ci-15': { seasonName: 'The Circle 1', format: 'the-circle', source: 'live', fanFavorite: 'Hector',
      players: { Hector: rec({ placement: 1, winner: true, episodesLasted: 14, rivals: ['Sasha'] }),
        Sasha: rec({ placement: 2, showmances: [{ partner: 'Wyatt', ended: 'intact' }] }), Wyatt: rec({ placement: 3 }) } },
    'ci-1': { seasonName: 'The Circle 1', format: 'the-circle', source: 'published',
      players: { Hector: rec({ placement: 1, winner: true }), Sasha: rec({ placement: 2 }), Wyatt: rec({ placement: 3, slug: 'wyatt' }) } },
  } } },
});

describe('a season filed under the wrong number', () => {
  it('folds into the season its name says, keeping what only the played copy knew', () => {
    setFranchiseLedger(ledger());
    expect(foldMisnumberedRecords()).toBe(1);
    const S = activeSeasons();
    expect(Object.keys(S).sort()).toEqual(['15', 'ci-1']);
    expect(S['ci-1'].players.Hector.rivals).toEqual(['Sasha']);
    expect(S['ci-1'].players.Hector.episodesLasted).toBe(14);
    expect(S['ci-1'].players.Sasha.showmances).toEqual([{ partner: 'Wyatt', ended: 'intact' }]);
    expect(S['ci-1'].players.Wyatt.slug).toBe('wyatt');
    expect(S['ci-1'].fanFavorite).toBe('Hector');
    expect(S['ci-1'].source).toBe('published');
    expect(S['15'].seasonName).toBe('Doom Island');
  });

  it('leaves a copy whose result disagrees, a different cast, or a name with no number alone', () => {
    const L = ledger();
    L.franchises.main.seasons['ci-15'].players.Sasha.placement = 3;
    setFranchiseLedger(L);
    foldMisnumberedRecords();
    expect(activeSeasons()['ci-1'].players.Sasha.showmances).toEqual([]);

    const L2 = ledger();
    delete L2.franchises.main.seasons['ci-15'].players.Wyatt;
    setFranchiseLedger(L2);
    expect(foldMisnumberedRecords()).toBe(0);
    expect(activeSeasons()['ci-15']).toBeTruthy();

    const L3 = ledger();
    L3.franchises.main.seasons['ci-15'].seasonName = 'Circle of Lies';
    setFranchiseLedger(L3);
    expect(foldMisnumberedRecords()).toBe(0);
  });

  it('a recorder handed the wrong number lands on the right season', () => {
    const L = ledger();
    delete L.franchises.main.seasons['ci-15'];
    setFranchiseLedger(L);
    const played = ledger().franchises.main.seasons['ci-15'];
    expect(recordBuiltSeason(structuredClone(played), 15, 'manual')).toBe(true);
    expect(activeSeasons()['ci-15']).toBeUndefined();
    expect(activeSeasons()['ci-1'].players.Hector.rivals).toEqual(['Sasha']);
  });
});
