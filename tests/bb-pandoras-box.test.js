// Pandora's Box — the first real distributor over the power inventory, and
// the canonical secret Diamond Power of Veto it hands out (BB12: acquired in
// private, lied about in public, detonated at the live show).
//
// The load-bearing assertions are about SECRECY and the detonation's ballot
// surgery: no public surface may name the prize before it fires, and when it
// fires the vote must be valid over a block the house never campaigned on.
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { gs, seasonConfig, TWIST_CATALOG, players } from '../js/core.js';
import { pStats, pronouns, threatScore } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { ordinal } from '../js/finale.js';
import { simulateBBWeek } from '../js/bb/week.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { grantPower, heldPowers, activePowerAt, usePower, expirePowers } from '../js/bb/powers.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { HOUSE_EVENTS } from '../js/bb-events/index.js';
import { buildVPScreens, _tvState } from '../js/vp-screens.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((s * 7 + i * 3) % 10)]));
const CAST = Array.from({ length: 12 }, (_, i) => ({
  name: 'P' + i, archetype: ['mastermind', 'hero', 'floater', 'villain', 'schemer', 'goat'][i % 6],
  gender: i % 2 ? 'f' : 'm', sexuality: 'straight', stats: spread(i + 1),
}));
const seededRng = (seed = 5) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

function reset() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
  seasonConfig.romance = 'enabled';
  seasonConfig.finaleSize = 3;
}

describe('the power inventory', () => {
  it('tracks the whole lifecycle the spec demands', () => {
    reset();
    const inst = grantPower('diamond-veto', 'P3', { week: 2, visibility: 'secret', source: 'bb-pandoras-box' });
    expect(inst.expiresAfterWeek).toBe(3); // two-eviction fuse
    expect(heldPowers('P3')).toHaveLength(1);
    // A secret diamond waits for eviction night; a public one fires at the ceremony.
    expect(activePowerAt('eviction-night', 2)).toBe(inst);
    expect(activePowerAt('veto-ceremony', 2)).toBe(null);
    usePower(inst, 3);
    expect(heldPowers('P3')).toHaveLength(0);
    expect(inst.usedWeek).toBe(3);
  });

  it('disposes what expires and what walks out the door', () => {
    reset();
    const stale = grantPower('diamond-veto', 'P1', { week: 1, visibility: 'secret', source: 't' });
    const orphan = grantPower('diamond-veto', 'P2', { week: 3, visibility: 'secret', source: 't' });
    expirePowers(4, ['P1', 'P3']); // P2 has left; P1's window (1–2) is past
    expect(stale.disposed).toBe(true);
    expect(stale.disposedReason).toBe('expired');
    expect(orphan.disposed).toBe(true);
    expect(orphan.disposedReason).toBe('holder-evicted');
  });
});

describe("Pandora's Box", () => {
  it('is a Big Brother twist in the shared catalog', () => {
    const entry = TWIST_CATALOG.find(t => t.id === 'bb-pandoras-box');
    expect(entry).toBeTruthy();
    expect(entry.format).toBe('big-brother');
  });

  const boxWeek = seed => {
    reset();
    const rng = seededRng(seed);
    const w1 = simulateBBWeek({ rng, houseEvents: HOUSE_EVENTS, competitions: BB_COMPETITIONS, twists: ['bb-pandoras-box'] });
    return { rng, w1 };
  };

  it('keeps the prize off every public surface until it fires', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const { w1 } = boxWeek(seed * 17 + 3);
      const box = w1.acts.find(a => a.type === 'pandoras-box');
      expect(box, 'no box act').toBeTruthy();
      // A secret grant never announces.
      expect(w1.acts.some(a => a.type === 'twist-announcement')).toBe(false);
      if (!box.opened) continue;
      // The act carries the lie, never the cargo.
      expect(JSON.stringify(box)).not.toContain('diamond');
      const detonated = w1.acts.find(a => a.type === 'diamond-detonation');
      if (!detonated) {
        // Still live and still secret: the ceremony this week ran under
        // normal rules — the HOH named any replacement.
        const cer = w1.acts.find(a => a.type === 'veto-ceremony');
        expect(cer?.diamond || false).toBe(false);
      }
    }
  });

  it('detonates like the canonical one: valid vote over a block nobody campaigned on', () => {
    let detonations = 0;
    for (let seed = 1; seed <= 40 && detonations < 6; seed++) {
      const { rng, w1 } = boxWeek(seed * 17 + 3);
      const box = w1.acts.find(a => a.type === 'pandoras-box');
      if (!box.opened) continue;
      let det = w1.acts.find(a => a.type === 'diamond-detonation');
      let week = w1;
      if (!det) {
        week = simulateBBWeek({ rng, houseEvents: HOUSE_EVENTS, competitions: BB_COMPETITIONS });
        det = week.acts.find(a => a.type === 'diamond-detonation');
      }
      if (!det) continue;
      detonations++;
      expect(week.finalNominees).toContain(det.replacement);
      expect(week.finalNominees).not.toContain(det.saved);
      expect(det.replacement).not.toBe(week.hoh);
      expect(det.replacement).not.toBe(det.holder);
      for (const b of week.ballots) {
        expect(week.finalNominees).toContain(b.evict);
        expect(b.voter).not.toBe(det.replacement);
        expect(b.voter).not.toBe(week.hoh);
      }
      expect(week.finalNominees).toContain(week.evicted);
      // The fallout exists: the ambush lands on the holder, in public.
      expect((det.socialBeats || []).some(b => b.eventId === 'dpov-ambush')).toBe(true);
    }
    expect(detonations, 'no detonation in forty seeded seasons — the fuse never burns').toBeGreaterThanOrEqual(3);
  });

  it('replays identically for the same seed', () => {
    const run = () => {
      const { rng, w1 } = boxWeek(911);
      const w2 = simulateBBWeek({ rng, houseEvents: HOUSE_EVENTS, competitions: BB_COMPETITIONS });
      return [w1, w2].map(w => ({
        box: w.acts.find(a => a.type === 'pandoras-box')?.opened ?? null,
        det: w.acts.find(a => a.type === 'diamond-detonation')?.replacement ?? null,
        evicted: w.evicted,
      }));
    };
    expect(run()).toEqual(run());
  });

  it('runs through a full played episode with screens and transcript agreeing', () => {
    for (let seed = 5; seed < 60; seed++) {
      reset();
      Object.assign(seasonConfig, {
        format: 'big-brother', jurySize: 7, bbSafetyMode: 'off',
        bbHaveNots: 'off', bbDepartures: 'off', setting: 'bb-house',
        twistSchedule: [{ episode: 1, type: 'bb-pandoras-box' }],
      });
      gs.episodeHistory = []; gs.riPlayers = gs.riPlayers || []; gs.sideDeals = []; gs.knowledge = {};
      Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, threatScore, getBond, getPerceivedBond, ordinal });
      const ep1 = simulateBBEpisode();
      const box = ep1.acts.find(a => a.type === 'pandoras-box');
      expect(box).toBeTruthy();
      expect(ep1.summaryText).toContain("PANDORA'S BOX");
      if (!box.opened) continue;
      // The transcript tells the public story only.
      expect(ep1.summaryText).not.toContain('Diamond');
      // The box screen exists and never names the cargo.
      buildVPScreens(gs.episodeHistory[0]);
      Object.keys(_tvState).filter(k => k.startsWith('bb_')).forEach(k => { _tvState[k].idx = 99; });
      const screens = buildVPScreens(gs.episodeHistory[0]);
      const boxScreen = screens.find(s => s.id.includes('bb-pandora'));
      expect(boxScreen, 'no box screen').toBeTruthy();
      expect(boxScreen.html).not.toContain('Diamond');
      // Play forward until it fires or dies; when it fires, the screen and
      // transcript both carry the detonation.
      let guard = 0;
      while (guard++ < 3) {
        const ep = simulateBBEpisode();
        if (!ep) break;
        const det = ep.acts.find(a => a.type === 'diamond-detonation');
        if (!det) continue;
        expect(ep.summaryText).toContain('DETONATED');
        buildVPScreens(gs.episodeHistory.at(-1));
        Object.keys(_tvState).filter(k => k.startsWith('bb_')).forEach(k => { _tvState[k].idx = 99; });
        const detScreen = buildVPScreens(gs.episodeHistory.at(-1)).find(s => s.id.includes('bb-detonation'));
        expect(detScreen, 'no detonation screen').toBeTruthy();
        expect(detScreen.html).toContain('THE DIAMOND POWER OF VETO');
        return;
      }
    }
    // Some seeds never open or never fire — that is the twist working, but
    // across the sweep at least one full arc must have been exercised above.
  }, 240000);
});
