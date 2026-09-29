// ══════════════════════════════════════════════════════════════════════
// tests/pm-franchise-carry.test.js — a villa's couples, friends and enemies
// outlive it
// ══════════════════════════════════════════════════════════════════════
//
// User: "make sure the bonds, positive and negative, between islanders persist
// between seasons (an All Stars), between shows (two islanders on The
// Traitors), and outside the shows". A Perfect Match season recorded nothing
// to the franchise ledger, and a Perfect Match season read nothing from it.
import { describe, expect, it } from 'vitest';
import { setGs, setPlayers } from '../js/core.js';
import { getBond } from '../js/bonds.js';
import { getRelationshipDimension } from '../js/relationships.js';
import { playPerfectMatchSeason } from '../js/pm/season.js';
import { pmLedgerRecord } from '../js/pm/ledger-record.js';
import { applyCarriedBonds } from '../js/pm/kin.js';
import { setFranchiseLedger, buildFranchiseMeta, seasonKey } from '../js/franchise-meta.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';

const cast = makeIslanders(22, 31);
setPlayers(cast);
const names = cast.map(p => p.name);
const played = playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed: 31, splitOrStealOn: true });
// Read while the season's own relationship layer is live, as pm-run.js does.
const rec = pmLedgerRecord(played.rows, played.state, { cast: names, winners: played.winners });

describe('a season leaves a record in the shape every show reads', () => {
  it('every islander is in it, with a placement', () => {
    expect(rec.format).toBe('perfect-match');
    for (const n of names) expect(rec.players[n], n).toBeTruthy();
    expect(Object.values(rec.players).filter(p => p.placement > 0).length).toBe(names.length);
  });
  it('the finalist couples left intact, each with the other', () => {
    const final = played.rows.find(r => r.moment === 'final').pm.couples;
    for (const [a, b] of final) {
      expect(rec.players[a].showmances).toContainEqual({ partner: b, ended: 'intact' });
      expect(rec.players[b].showmances).toContainEqual({ partner: a, ended: 'intact' });
    }
  });
  it('a betrayal is recorded from both sides', () => {
    for (const [n, p] of Object.entries(rec.players)) {
      for (const v of p.betrayed) expect(rec.players[v].betrayedBy, `${n} -> ${v}`).toContain(n);
    }
    expect(Object.values(rec.players).some(p => p.betrayed.length)).toBe(true);
  });
  it('the season had exes, friends and enemies, not only couples', () => {
    const all = Object.values(rec.players);
    expect(all.some(p => p.showmances.some(s => s.ended === 'breakup'))).toBe(true);
    expect(all.some(p => p.allies.length)).toBe(true);
    expect(all.some(p => p.rivals.length)).toBe(true);
  });
});

describe('a new villa starts where the franchise left them', () => {
  it('exes walk in as exes', () => {
    setPlayers(cast);
    const s = playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed: 5,
      carried: { kin: [{ a: 'Isl01', b: 'Isl02', kin: 'exes' }], bonds: [] } });
    expect(s.state.kin['Isl01|Isl02']).toBe('exes');
    expect(s.state.profiles.Isl01.ex).toBe('Isl02');
  });
  it('an author-written relation outranks what the franchise remembers', () => {
    setPlayers(cast);
    const s = playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed: 5,
      kinship: [{ a: 'Isl01', b: 'Isl02', kin: 'siblings' }],
      carried: { kin: [{ a: 'Isl01', b: 'Isl02', kin: 'exes' }], bonds: [] } });
    expect(s.state.kin['Isl01|Isl02']).toBe('siblings');
  });
  it('a grudge starts cold, with resentment on the side that holds it', () => {
    setGs({ bonds: {}, perceivedBonds: {}, relationshipDimensions: {} });
    applyCarriedBonds({ kin: {} }, ['A', 'B'], [{ a: 'A', b: 'B', delta: -5, resent: true }]);
    expect(getBond('A', 'B')).toBe(-5);
    expect(getRelationshipDimension('A', 'B', 'resentment')).toBeGreaterThan(0);
  });
});

describe('the record reaches the next season of any show', () => {
  const ledger = { v: 2, active: 'main', franchises: { main: { name: 'Main', seasons: { [seasonKey('perfect-match', 1)]: rec } } } };
  // Two islanders who were a real couple that ended, and a pair of enemies.
  const ex = Object.entries(rec.players).find(([, p]) => p.showmances.some(s => s.ended === 'breakup'));
  const [a, pa] = [ex[0], ex[1].showmances.find(s => s.ended === 'breakup').partner];
  it.each([['perfect-match', '_pmRunnable'], ['traitors', '_trRunnable']])('%s reads a Perfect Match ex as an ex', (format, flag) => {
    setFranchiseLedger(ledger);
    globalThis.window ||= globalThis;
    window[flag] = true;
    const people = cast.filter(p => [a, pa].includes(p.name));
    const meta = buildFranchiseMeta(people, { format, franchiseMeta: true });
    expect(meta, format).toBeTruthy();
    expect(meta.seededPairs.some(sp => sp.kind === 'showmance-broken' && [sp.a, sp.b].sort().join() === [a, pa].sort().join())).toBe(true);
  });
});
