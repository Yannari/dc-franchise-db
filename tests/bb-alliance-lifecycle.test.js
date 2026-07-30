import { beforeEach, describe, expect, it } from 'vitest';
import { gs } from '../js/core.js';
import { setBond } from '../js/bonds.js';
import { memoriesAbout } from '../js/strategy-memory.js';
import { nominationScore } from '../js/bb/strategy.js';
import { settleBBAllianceWeek, updateBBAllianceLifecycle } from '../js/bb/shared-strategy.js';
import { simulateBBWeek } from '../js/bb/week.js';
import { seedGame } from './helpers/setup.js';

const CAST = ['A','B','C','D','E','F','G','H'].map(name => ({ name, archetype:'floater' }));
const rng = seed => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

describe('Big Brother alliance lifecycle adapter', () => {
  beforeEach(() => seedGame(CAST, { episode:0, eliminated:[], namedAlliances:[], sideDeals:[] }));

  it('forms an alliance around a mutually trusted core', () => {
    setBond('A','B',6); setBond('A','C',6); setBond('B','C',6);
    const result = updateBBAllianceLifecycle({ phase:'opening', house:gs.activePlayers, week:{num:1}, rng:() => 0 });
    expect(result.formed).toMatchObject({ members:['A','B','C'], active:true });
    expect(result.formed.formationEvidence).toBeTruthy();
    expect(gs.namedAlliances).toContain(result.formed);
  });

  // Formation mirrors the Total Drama camp-event system: a permissive bond
  // floor plus weighted triggers, rather than a high trust bar. Two people who
  // are close enough DO ally without a written deal — that is how alliances
  // start on the island and there is no reason a house should differ.
  it('lets a close pair ally without a formal deal', () => {
    setBond('A','B',8);
    const formed = updateBBAllianceLifecycle({ phase:'opening', house:gs.activePlayers, week:{num:1}, rng:() => 0 }).formed;
    expect(formed).toBeTruthy();
    expect(formed.members).toContain('A');
    expect(formed.members).toContain('B');
  });

  // The floor is the real guard, and it is the one Total Drama uses: nobody
  // allies with somebody they actively dislike, though a strategic player can
  // bridge a little coldness.
  it('never allies people who actively dislike each other', () => {
    for (const a of gs.activePlayers) for (const b of gs.activePlayers) if (a < b) setBond(a, b, -6);
    const formed = updateBBAllianceLifecycle({ phase:'opening', house:gs.activePlayers, week:{num:1}, rng:() => 0 }).formed;
    expect(formed).toBeNull();
  });

  it('treats a recorded deal as the strongest evidence there is', () => {
    gs.sideDeals = [{ players:['G','H'], active:true, genuine:true, type:'f2', madeEp:1 }];
    const formed = updateBBAllianceLifecycle({ phase:'opening', house:gs.activePlayers, week:{num:1}, rng:() => 0.99 }).formed;
    expect(formed?.members).toEqual(['G','H']);
    expect(formed.formationEvidence).toBe('genuine-deal');
  });

  it('can advance past an existing core and form another evidenced alliance', () => {
    gs.sideDeals = [
      { players:['A','B'], active:true, genuine:true, type:'f2' },
      { players:['C','D'], active:true, genuine:true, type:'f2' },
    ];
    const first = updateBBAllianceLifecycle({ phase:'opening', house:gs.activePlayers, week:{num:1}, rng:() => 0 }).formed;
    const second = updateBBAllianceLifecycle({ phase:'opening', house:gs.activePlayers, week:{num:2}, rng:() => 0 }).formed;
    expect(first.members).not.toEqual(second.members);
    expect(gs.namedAlliances).toHaveLength(2);
  });

  it('makes an alliance materially protect a member from nomination', () => {
    const before = nominationScore('A','B',() => 0.5);
    gs.namedAlliances.push({ name:'The Core', members:['A','B','C'], active:true, formed:1, betrayals:[] });
    const after = nominationScore('A','B',() => 0.5);
    expect(after).toBeLessThan(before - 2);
  });

  it('records eviction votes against allies as canonical betrayal evidence', () => {
    gs.namedAlliances.push({ name:'The Core', members:['A','B','C'], active:true, formed:1, betrayals:[], history:[] });
    gs.activePlayers = ['A','C','D','E','F','G','H'];
    const incidents = settleBBAllianceWeek({ num:2, ballots:[{ voter:'A', evict:'B' }, { voter:'D', evict:'B' }] });
    expect(incidents).toHaveLength(1);
    expect(gs.namedAlliances[0].betrayals[0]).toMatchObject({ player:'A', victim:'B', severity:'major' });
    expect(memoriesAbout('B','A')[0]).toMatchObject({ type:'alliance-betrayal', severity:2 });
  });

  it('runs lifecycle formation at the opening of a real week', () => {
    setBond('A','B',6); setBond('A','C',6); setBond('B','C',6);
    const week = simulateBBWeek({ rng:rng(11) });
    expect(week.allianceChanges).toEqual(expect.objectContaining({ formed:expect.any(Array), betrayals:expect.any(Array) }));
    // Evidence is now the trigger that produced it — a pitch, a close pair, a
    // shared enemy, a survival pact, a shared block, or a recorded deal.
    const REASONS = ['strategic-pitch','close-pair','shared-enemy','survival-pact','shared-block','genuine-deal'];
    expect(gs.namedAlliances.length).toBeGreaterThan(0);
    expect(REASONS).toContain(gs.namedAlliances[0].formationEvidence);
  });
});
