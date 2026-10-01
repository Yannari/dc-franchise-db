// ci-carry.test.js — relationships that outlive a Circle season (user,
// 2026-09-30: "do those relationship settings persist between shows, like a
// married couple stays married in life after the show and in their
// dramagram?").
// 1. One source: what two people are to each other is the cast's
//    Relationships tab (core.js REL_KINSHIP, the rows Big Brother and Perfect
//    Match read), then the life layer (a couple married in life), then an old
//    Circle-only setting. The Circle's "They are" writes the Relationships tab.
// 2. A Circle season leaves a record on the franchise ledger, in the shape
//    every show reads, so its friendships, couples and grudges follow the
//    people into their next show and into life after it.
import { describe, expect, it } from 'vitest';
import { setGs, setPlayers, seasonConfig, relationships, setRelationships } from '../js/core.js';
import { relationFromKin, pairRelation } from '../js/ci/shared.js';
import { simulateCircleEpisode } from '../js/ci-run.js';
import { ciLedgerRecord } from '../js/ci/ledger-record.js';
import { playCircleSeason } from '../js/ci/season.js';
import { setFranchiseLedger, activeSeasons, seasonKey, buildFranchiseMeta } from '../js/franchise-meta.js';
import { makePlayers, circleSetup } from './helpers/ci-cast.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';

describe('what a pair is comes from the shared Relationships tab', () => {
  it('the franchise\'s relations map onto the ones the Circle plays', () => {
    expect(relationFromKin('twins')).toBe('twins');
    expect(relationFromKin('step-siblings')).toBe('siblings');
    expect(relationFromKin('parent-child')).toBe('parent');
    expect(relationFromKin('married')).toBe('married');
    expect(relationFromKin('engaged')).toBe('couple');
    expect(relationFromKin('dating')).toBe('couple');
    expect(relationFromKin('childhood-friends')).toBe('friends');
    expect(relationFromKin('none')).toBeNull();
    expect(relationFromKin('exes')).toBeNull();          // no Circle lines for it yet: the general ones
  });
  it('the Relationships tab wins, then life, then an old Circle-only setting', () => {
    expect(pairRelation('A', 'B', { kin: 'siblings', carried: [{ a: 'A', b: 'B', kin: 'married' }], setupRel: 'friends' })).toBe('siblings');
    expect(pairRelation('A', 'B', { kin: 'none', carried: [{ a: 'B', b: 'A', kin: 'married' }], setupRel: 'friends' })).toBe('married');
    expect(pairRelation('A', 'B', { kin: 'none', carried: [], setupRel: 'friends' })).toBe('friends');
    expect(pairRelation('A', 'B', { kin: 'none', carried: [], setupRel: null })).toBeNull();
  });
});

function freshSeason(extra = {}) {
  Object.assign(seasonConfig, { format: 'the-circle', seasonNumber: 7, ciSetup: {}, ciPool: [], twistSchedule: [],
    ciDays: null, ciFinalists: 5, ciNewcomerRule: 'rate-not-rated', ciPickBy: 'stats', ciAI: false, franchiseMeta: true, ...extra });
  const cast = makePlayers(13, 5);
  setPlayers(cast);
  setGs({ initialized: true, episodeHistory: [], popularity: {}, activePlayers: [], ci: { seed: 505 }, seasonNumber: 7 });
  return cast.map(p => p.name);
}
const playAll = () => { const out = []; for (let i = 0; i < 30; i++) { const r = simulateCircleEpisode(); if (!r) break; out.push(r); } return out; };

describe('the run reads the Relationships tab', () => {
  it('two players sharing an apartment who are twins on the Relationships tab play as twins', async () => {
    const names = freshSeason();
    const [a, b] = names;
    seasonConfig.ciSetup = { [b]: { partner: a } };
    setRelationships([{ id: 't1', a, b, type: 'neutral', bond: 0, kin: 'twins', note: '' }]);
    const { gs } = await import('../js/core.js');
    simulateCircleEpisode();
    expect(gs.ci.setup[b].relation ?? gs.ci.setup[a].relation).toBe('twins');
    setRelationships([]);
  });
});

describe('a Circle season leaves a record on the franchise ledger', () => {
  const cast = makePlayers(13, 4); setPlayers(cast);
  const names = cast.map(p => p.name);
  const played = playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed: 4 });
  const rec = ciLedgerRecord(played.rows, played.state, { cast: names, winners: played.result?.winner ? played.state.profiles[played.result.winner.profile ?? played.result.winner]?.players : [] });

  it('every player is in it, in the shape every show reads, with a placement and the winner', () => {
    expect(rec.format).toBe('the-circle');
    for (const n of names) {
      const p = rec.players[n];
      expect(p, n).toBeTruthy();
      for (const k of ['placement', 'allies', 'rivals', 'showmances', 'betrayed', 'betrayedBy']) expect(p, `${n}.${k}`).toHaveProperty(k);
      expect(p.placement).toBeGreaterThan(0);
    }
    expect(Object.values(rec.players).filter(p => p.winner).length).toBeGreaterThanOrEqual(1);
    expect(Object.values(rec.players).filter(p => p.placement === 1).length).toBeGreaterThanOrEqual(1);
  });
  it('friendships are recorded both ways, and betrayals from both sides', () => {
    const all = Object.entries(rec.players);
    expect(all.some(([, p]) => p.allies.length)).toBe(true);
    for (const [n, p] of all) for (const o of p.allies) expect(rec.players[o].allies, `${n}~${o}`).toContain(n);
    for (const [n, p] of all) for (const v of p.betrayed) expect(rec.players[v].betrayedBy).toContain(n);
  });
  it('the next show reads it: a Circle friendship is a pair the franchise seeds', () => {
    setFranchiseLedger({ v: 2, active: 'main', franchises: { main: { name: 'Main', seasons: { [seasonKey('the-circle', 7)]: rec } } } });
    // a show that reads everyone's history (the Circle itself, Perfect Match, The Traitors)
    const meta = buildFranchiseMeta(cast, { format: 'the-circle' });
    const ally = Object.entries(rec.players).find(([, p]) => p.allies.length);
    const pair = [ally[0], ally[1].allies[0]].sort().join('|');
    expect((meta?.seededPairs || []).some(sp => [sp.a, sp.b].sort().join('|') === pair)).toBe(true);
  });
});

describe('the run writes it when the last episode airs', () => {
  it('a finished Circle season is on the active franchise ledger', () => {
    setFranchiseLedger({ v: 2, active: 'main', franchises: { main: { name: 'Main', seasons: {} } } });
    freshSeason();
    playAll();
    const recd = activeSeasons()[seasonKey('the-circle', 7)];
    expect(recd?.format).toBe('the-circle');
    expect(Object.keys(recd.players).length).toBe(13);
  });
});
