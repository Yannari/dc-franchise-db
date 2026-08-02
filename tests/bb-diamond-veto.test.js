// The Diamond Power of Veto — the first twist built on the descriptor
// contract (docs/superpowers/specs/2026-08-02-big-brother-twist-catalog-design.md).
//
// The twist is one rule: if the veto is used, the veto holder — not the Head
// of Household — names the replacement. Everything asserted here follows
// from that rule or from the catalog's general test requirements:
// determinism, valid nominees, protected players, and a transcript and
// screen that say the rule out loud.
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { gs, seasonConfig, TWIST_CATALOG, players } from '../js/core.js';
import { pStats, pronouns, threatScore } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { ordinal } from '../js/finale.js';
import { simulateBBWeek } from '../js/bb/week.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { resolveWeekTwistState, BASE_WEEK_RULES } from '../js/bb/twist-contract.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { HOUSE_EVENTS } from '../js/bb-events/index.js';
import { buildVPScreens, _tvState } from '../js/vp-screens.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((s * 7 + i * 3) % 10)]));
const ARCH = ['mastermind', 'hero', 'floater', 'villain', 'schemer', 'goat'];
const CAST = Array.from({ length: 12 }, (_, i) => ({
  name: 'P' + i, archetype: ARCH[i % ARCH.length], gender: i % 2 ? 'f' : 'm',
  sexuality: 'straight', stats: spread(i + 1),
}));
const seededRng = (seed = 5) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

function reset() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
  seasonConfig.romance = 'enabled';
  seasonConfig.finaleSize = 3;
}

const diamondWeek = seed => {
  reset();
  return simulateBBWeek({ rng: seededRng(seed), houseEvents: HOUSE_EVENTS,
    competitions: BB_COMPETITIONS, twists: ['bb-diamond-veto'] });
};

describe('the twist contract', () => {
  it('resolves a neutral week to the base rules', () => {
    const { rules, active, applied } = resolveWeekTwistState([]);
    expect(rules).toEqual({ ...BASE_WEEK_RULES, addSlots: [] });
    expect(active).toEqual([]);
    expect(applied).toEqual([]);
  });

  it('records which twist changed which rule', () => {
    const { rules, applied } = resolveWeekTwistState(['bb-diamond-veto', 'bb-have-nots']);
    expect(rules.replacementAuthority).toBe('veto-holder');
    expect(applied).toEqual([{ twist: 'bb-diamond-veto', rule: 'replacementAuthority', from: 'hoh', to: 'veto-holder' }]);
  });

  it('registers the pre-contract twists without changing their engines', () => {
    expect(resolveWeekTwistState(['bb-instant-eviction']).rules.vetoCount).toBe(0);
    expect(resolveWeekTwistState(['bb-double-eviction']).rules.secondCycle).toBe(true);
  });

  it('ignores ids it has no contract for rather than guessing', () => {
    const { rules, active } = resolveWeekTwistState(['no-such-twist']);
    expect(active).toEqual([]);
    expect(rules.replacementAuthority).toBe('hoh');
  });
});

describe('the Diamond Power of Veto', () => {
  it('is a Big Brother twist in the shared catalog', () => {
    const entry = TWIST_CATALOG.find(t => t.id === 'bb-diamond-veto');
    expect(entry).toBeTruthy();
    expect(entry.format).toBe('big-brother');
    expect(entry.incompatible).toContain('bb-instant-eviction');
  });

  it('hands the empty chair to the veto holder, with everybody protected who should be', () => {
    let used = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const week = diamondWeek(seed * 7 + 1);
      expect(week.twistState.rules.replacementAuthority).toBe('veto-holder');
      const cer = week.acts.find(a => a.type === 'veto-ceremony');
      expect(cer.diamond).toBe(true);
      expect(cer.chairAuthority).toBe(week.vetoWinner);
      // Two nominees, no duplicates, everybody real — used or not.
      expect(week.finalNominees).toHaveLength(2);
      expect(new Set(week.finalNominees).size).toBe(2);
      week.finalNominees.forEach(n => expect(week.houseAtStart).toContain(n));
      if (cer.used && cer.replacement) {
        used++;
        expect(cer.replacement).not.toBe(week.hoh);
        expect(cer.replacement).not.toBe(week.vetoWinner);
        expect(cer.replacement).not.toBe(cer.saved);
        expect(week.finalNominees).toContain(cer.replacement);
      }
    }
    // The pull is real: a diamond holder uses the veto MORE than the ~55%
    // baseline, not less. Sixty seeded weeks put usage far from both cliffs.
    expect(used).toBeGreaterThan(24);
  });

  it('replays identically for the same seed', () => {
    const a = diamondWeek(431), b = diamondWeek(431);
    expect(a.hoh).toBe(b.hoh);
    expect(a.vetoWinner).toBe(b.vetoWinner);
    expect(a.finalNominees).toEqual(b.finalNominees);
    expect(a.evicted).toBe(b.evicted);
    expect(a.vetoDecision?.replacement || null).toBe(b.vetoDecision?.replacement || null);
  });

  it('aims the renomination grievance at the person who actually named them', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const week = diamondWeek(seed * 11 + 3);
      const cer = week.acts.find(a => a.type === 'veto-ceremony');
      if (!cer.used || !cer.replacement) continue;
      const reaction = (cer.socialBeats || []).find(b => b.eventId === 'veto-renomination-reaction');
      if (reaction) {
        expect(reaction.players).toContain(cer.chairAuthority);
        expect(reaction.players).toContain(cer.replacement);
        // And when the holder hijacked somebody else's block, the HOH's own
        // grievance exists too.
        if (week.vetoWinner !== week.hoh) {
          const hijack = (cer.socialBeats || []).find(b => b.eventId === 'diamond-veto-hijack');
          expect(hijack, `week ${seed}: HOH watched their block get rewritten and said nothing`).toBeTruthy();
          expect(hijack.players).toEqual([week.hoh, week.vetoWinner]);
        }
      }
    }
  });

  it('runs through a full played episode: transcript and screens state the rule', () => {
    reset();
    Object.assign(seasonConfig, {
      format: 'big-brother', jurySize: 7, bbSafetyMode: 'off',
      bbHaveNots: 'off', bbDepartures: 'off', setting: 'bb-house',
      twistSchedule: [{ episode: 1, type: 'bb-diamond-veto' }],
    });
    gs.episodeHistory = []; gs.riPlayers = gs.riPlayers || []; gs.sideDeals = []; gs.knowledge = {};
    Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, threatScore, getBond, getPerceivedBond, ordinal });
    const ep = simulateBBEpisode();
    expect(ep.twists).toContain('bb-diamond-veto');
    expect(ep.twistState.rules.replacementAuthority).toBe('veto-holder');
    const cer = ep.acts.find(a => a.type === 'veto-ceremony');
    expect(cer.diamond).toBe(true);
    // The transcript says the rule in plain language.
    expect(ep.summaryText).toContain('DIAMOND POWER OF VETO');
    // The ceremony screen explains the rule. The cards are click-to-reveal,
    // so build once to create the reveal keys, open them, and build again.
    buildVPScreens(gs.episodeHistory[0]);
    Object.keys(_tvState).filter(k => k.startsWith('bb_')).forEach(k => { _tvState[k].idx = 99; });
    const screens = buildVPScreens(gs.episodeHistory[0]);
    const cerScreen = screens.find(s => s.id.includes('bb-cer'));
    expect(cerScreen, 'no ceremony screen').toBeTruthy();
    expect(cerScreen.html).toContain('DIAMOND POWER OF VETO');
    // And the closed medal says which veto this is before a single reveal.
    Object.keys(_tvState).filter(k => k.startsWith('bb_')).forEach(k => { _tvState[k].idx = -1; });
    const fresh = buildVPScreens(gs.episodeHistory[0]).find(s => s.id.includes('bb-cer'));
    expect(fresh.html).toContain('DIAMOND VETO');
    if (cer.used && cer.replacement) {
      expect(ep.summaryText).toContain(`by ${cer.chairAuthority}, under the Diamond Veto`);
    }
    // Statistics: the block count reflects the final nominees exactly once.
    for (const n of ep.finalNominees) {
      expect(gs.bb.stats[n].timesOnTheBlock).toBe(1);
    }
  });
});
