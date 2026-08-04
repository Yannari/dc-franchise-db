// The three house twists, played rather than read.
//
// A twist that sits in the catalogue and does nothing to the week is the bug
// this format has produced repeatedly, so these assert the SHAPE of the week
// changes: acts that stop happening, acts that start happening, and two people
// leaving on the same night.
//
// Named outside tests/bb-*.test.js on purpose — that glob belongs to Codex.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, twistsForFormat } from '../js/core.js';
import { pStats, pronouns, ordinal } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { simulateBBEpisode, bbTwistsForWeek, BB_TWIST_IDS } from '../js/bb-run.js';
import { buildBBWeekScreens } from '../js/vp-screens.js';
import { seedGame } from './helpers/setup.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';

const CAST = [['A','mastermind'],['B','social-butterfly'],['C','challenge-beast'],['D','schemer'],
  ['E','hero'],['F','floater'],['G','villain'],['H','loyal-soldier'],['I','underdog'],['J','goat'],
  ['K','hothead'],['L','perceptive-player']]
  .map(([name, archetype]) => ({ name, archetype, gender: 'm', sexuality: 'straight' }));

function reset(twists = []) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, ordinal, getBond, getPerceivedBond });
  seasonConfig.format = 'big-brother';
  seasonConfig.finaleSize = 3;
  seasonConfig.twistSchedule = twists.map(type => ({ episode: 1, type }));
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = [];
  gs.jury = [];
}

const actTypes = ep => (ep.acts || []).map(a => a.type);

describe('house twists', () => {
  it('are in the catalogue, scoped to the house, and never leak into Total Drama', () => {
    const bb = twistsForFormat('big-brother').map(t => t.id);
    const td = twistsForFormat('total-drama').map(t => t.id);
    for (const id of BB_TWIST_IDS) {
      expect(bb, `${id} missing from the house catalogue`).toContain(id);
      expect(td, `${id} leaked into Total Drama`).not.toContain(id);
    }
  });

  it('only schedules twists this format can actually run', () => {
    reset(['bb-have-nots', 'tribe-swap', 'merge-feast']);
    expect(bbTwistsForWeek(1)).toEqual(['bb-have-nots']);
  });

  it('Instant Eviction removes the veto and votes on the original pair', () => {
    reset(['bb-instant-eviction']);
    const ep = simulateBBEpisode();
    const types = actTypes(ep);
    expect(types).toContain('instant-eviction');
    expect(types).not.toContain('veto');
    expect(types).not.toContain('veto-ceremony');
    expect(ep.vetoWinner).toBeNull();
    // Nominations stand: nobody can have come off the block.
    expect([...ep.finalNominees].sort()).toEqual([...ep.initialNominees].sort());
    expect(ep.finalNominees).toContain(ep.eliminated);
    expect(gs.activePlayers).toHaveLength(CAST.length - 1);
  });

  it('Have-Nots puts part of the house on slop and costs them in the veto', () => {
    reset(['bb-have-nots']);
    const ep = simulateBBEpisode();
    expect(actTypes(ep)).toContain('have-nots');
    expect(ep.haveNots.length).toBeGreaterThanOrEqual(2);
    // The HOH picks, and never picks themselves.
    expect(ep.haveNots).not.toContain(ep.hoh);
    const veto = (ep.acts || []).find(a => a.type === 'veto');
    const breakdown = veto?.competition?.debug?.scoreBreakdown || {};
    expect(Object.keys(breakdown).length).toBeGreaterThan(0);
    // Pure Chance is the one competition with nothing for slop to take away:
    // the ball is identical, the mark is identical, and it is out of their
    // hands before anything is decided. It declares that, and the contract
    // respects the declaration rather than demanding a penalty that would be
    // a lie about the competition.
    const def = BB_COMPETITIONS.find(c => c.id === veto?.competition?.id);
    if (def?.pureChance) {
      for (const row of Object.values(breakdown)) {
        expect(row.haveNotPenalty || 0, 'a pure chance competition charged for slop').toBe(0);
      }
      return;
    }
    for (const [name, row] of Object.entries(breakdown)) {
      if (ep.haveNots.includes(name)) expect(row.haveNotPenalty).toBeGreaterThan(0);
      else expect(row.haveNotPenalty || 0).toBe(0);
    }
  });

  it('Double Eviction runs a compressed second cycle and evicts two people', () => {
    reset(['bb-double-eviction']);
    const ep = simulateBBEpisode();
    expect(ep.doubleEviction).toBeTruthy();
    expect(ep.alsoEliminated).toBeTruthy();
    expect(ep.alsoEliminated).not.toBe(ep.eliminated);
    // Two people gone from one press of Run.
    expect(gs.activePlayers).toHaveLength(CAST.length - 2);
    expect(gs.eliminated).toContain(ep.eliminated);
    expect(gs.eliminated).toContain(ep.alsoEliminated);
    // The second cycle is compressed: no house life in it at all.
    const second = (ep.acts || []).filter(a => a.segment === 2);
    expect(second.some(a => a.type === 'hoh')).toBe(true);
    expect(second.some(a => a.type === 'eviction')).toBe(true);
    expect(second.some(a => a.type === 'house')).toBe(false);
    expect(ep.doubleEviction.evicted).toBe(ep.alsoEliminated);
  });

  it('gives the second cycle its own screens rather than redrawing the first', () => {
    reset(['bb-double-eviction']);
    const ep = simulateBBEpisode();
    const ids = buildBBWeekScreens(ep).map(s => s.id);
    expect(new Set(ids).size, 'duplicate screen ids').toBe(ids.length);
    expect(ids).toContain('bb-double');
    expect(ids).toContain('bb-hoh');
    expect(ids).toContain('bb-hoh-2');
    expect(ids).toContain('bb-evict-2');
  });

  it('leaves an ordinary week alone', () => {
    reset([]);
    const ep = simulateBBEpisode();
    const types = actTypes(ep);
    expect(types).toContain('veto');
    expect(types).toContain('veto-ceremony');
    expect(types).not.toContain('have-nots');
    expect(types).not.toContain('instant-eviction');
    expect(ep.doubleEviction).toBeUndefined();
    expect(gs.activePlayers).toHaveLength(CAST.length - 1);
  });
});
