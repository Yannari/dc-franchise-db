// ══════════════════════════════════════════════════════════════════════
// tests/franchise-carry.test.js — pasts that cross shows
// ══════════════════════════════════════════════════════════════════════
//
// User: bonds between islanders, positive and negative, must "persist between
// seasons, between shows (two islanders on The Traitors), and outside the
// shows". js/franchise-carry.js turns the franchise ledger (and the life log)
// into what a show that plays in its own game state can seed; The Traitors now
// both read it and write its own castle to it.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { getBond } from '../js/bonds.js';
import { setFranchiseLedger, seasonKey } from '../js/franchise-meta.js';
import { carriedFor } from '../js/franchise-carry.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { trLedgerRecord } from '../js/tr/ledger-record.js';
import roster from '../franchise_roster.json';

const mk = over => ({ placement: 3, winner: false, finalist: false, episodesLasted: 10,
  blindsided: false, blindsidedBy: [], blindsidesAuthored: 0, idolsFound: 0, idolsPlayed: 0,
  idoledOut: false, betrayed: [], betrayedBy: [], allies: [], showmances: [], rivals: [],
  chalWins: 0, schemesCaught: 0, ...over });

// A Perfect Match season: Ana and Ben were a couple that ended; Cal and Dee
// were friends; Eve stole Fay's partner.
function seed() {
  setFranchiseLedger({ v: 2, active: 'main', franchises: { main: { name: 'Main', seasons: {
    [seasonKey('perfect-match', 1)]: { seasonName: 'PM1', format: 'perfect-match', players: {
      Ana: mk({ showmances: [{ partner: 'Ben', ended: 'breakup' }] }),
      Ben: mk({ showmances: [{ partner: 'Ana', ended: 'breakup' }] }),
      Cal: mk({ allies: ['Dee'] }), Dee: mk({ allies: ['Cal'] }),
      Eve: mk({ betrayed: ['Fay'] }), Fay: mk({ betrayedBy: ['Eve'] }),
    } },
  } } } });
  globalThis.window ||= globalThis;
  window._trRunnable = true; window._pmRunnable = true;
}
const people = ['Ana', 'Ben', 'Cal', 'Dee', 'Eve', 'Fay'].map(name => ({ name }));
const pair = (list, a, b) => list.find(x => [x.a, x.b].sort().join() === [a, b].sort().join());

describe('what a cast brings with them', () => {
  it.each(['traitors', 'perfect-match'])('%s: an ex, an old friend and a grudge', format => {
    seed();
    const c = carriedFor(people, { format, franchiseMeta: true, lifeCarryover: false });
    expect(pair(c.kin, 'Ana', 'Ben')?.kin).toBe('exes');
    expect(pair(c.kin, 'Cal', 'Dee')?.kin).toBe('old-friends');
    expect(pair(c.bonds, 'Fay', 'Eve')?.resent).toBe(true);
    expect(pair(c.sums, 'Ana', 'Ben').delta).toBeLessThan(0);
    expect(pair(c.sums, 'Cal', 'Dee').delta).toBeGreaterThan(0);
    expect(pair(c.sums, 'Eve', 'Fay').delta).toBeLessThan(0);
  });
  it('nothing carried on a franchise with no history', () => {
    setFranchiseLedger({ v: 2, active: 'main', franchises: { main: { name: 'Main', seasons: {} } } });
    const c = carriedFor(people, { format: 'traitors', franchiseMeta: true, lifeCarryover: false });
    expect(c).toEqual({ kin: [], bonds: [], sums: [] });
  });
});

describe('The Traitors reads and writes the franchise', () => {
  const ROSTER = roster.players.slice(0, 20);
  const CAST = ROSTER.map(p => p.name);
  it('a carried past replaces the random opening bond for that pair', () => {
    setPlayers(ROSTER);
    const [a, b] = CAST;
    // The fixture draws every pair's opening bond; a carried one overrides it.
    // Whatever the castle does after, a -6 opening shows at the end as the
    // coldest they could reasonably be compared with the same season uncarried.
    const plain = playTraitorsSeason({ cast: CAST, seed: 11 });
    const plainBond = getBond(a, b);
    const carried = playTraitorsSeason({ cast: CAST, seed: 11, carried: [{ a, b, delta: -6 }] });
    expect(plain && carried).toBeTruthy();
    expect(getBond(a, b)).toBeLessThan(plainBond);
  });
  it('a finished castle leaves a record in the shape every show reads', () => {
    setPlayers(ROSTER);
    const result = playTraitorsSeason({ cast: CAST, seed: 12 });
    const rec = trLedgerRecord(result, { cast: CAST });
    expect(rec.format).toBe('traitors');
    for (const n of CAST) expect(rec.players[n], n).toBeTruthy();
    expect(Object.values(rec.players).filter(p => p.placement === 1).length).toBeGreaterThan(0);
    for (const [n, p] of Object.entries(rec.players)) for (const v of p.betrayed) expect(rec.players[v].betrayedBy).toContain(n);
    expect(Object.values(rec.players).some(p => p.allies.length || p.rivals.length)).toBe(true);
  });
});
