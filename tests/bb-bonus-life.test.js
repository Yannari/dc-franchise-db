// The Bonus Life's return path.
//
// The power was defined on 2026-08-04 and nothing read its rules.returnChance,
// so it was a shelf item that could be granted and could never do anything.
// This is the wiring, and the rules are BB20's, off the wiki:
//
//   - the holder may spend it on THEMSELVES or on somebody else
//   - an unspent power does not expire quietly: the fuse runs out and it fires
//     on that night's evictee, whoever that is (Sam Bledsoe never used hers)
//   - the return is NOT automatic — one competition, alone, and losing it
//     sends you home for good (the aired one was FAILED and nobody came back)
//
// The two lifecycle rules that had to change to make any of it possible are
// asserted here too, because both are the kind of thing a later refactor
// quietly reverts: a Bonus Life must survive its holder's eviction (every
// other power dies with its holder — this one is SPENT by it), and
// activePowerAt must be able to name the power it came for (it returned the
// first live instance at a timing, so a Bonus Life granted before a secret
// Diamond silently ate the Diamond's detonation).
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, summariseWeek } from '../js/bb-run.js';
import { rpBuildBBBonusLife, _tvState } from '../js/vp-screens.js';
import {
  BB_POWER_DEFINITIONS, grantPower, expirePowers, activePowerAt, activePowersAt,
} from '../js/bb/powers.js';
import { resolveBonusLife } from '../js/bb/bonus-life.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house(twists = []) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = twists.map(type => ({ episode: 1, type }));
}

const play = (seed = 2026) => withSeededRandom(seed, () => simulateBBEpisode());

describe('lifecycle: the rules that make it possible at all', () => {
  beforeEach(() => house());

  it('survives its holder being evicted — that is the trigger, not the end', () => {
    grantPower('bonus-life', 'Bowie', { week: 1, visibility: 'holder-secret', source: 'test' });
    // Bowie walks. Every other power would be disposed right here.
    const houseAfter = (gs.activePlayers || []).filter(n => n !== 'Bowie');
    expirePowers(1, houseAfter);
    const inst = gs.bb.powers.find(p => p.powerId === 'bonus-life');
    expect(inst.disposed, 'the fuse was swept away on the night it exists to fire').toBe(false);
  });

  it('a diamond-veto still dies with its holder', () => {
    grantPower('diamond-veto', 'Chase', { week: 1, visibility: 'secret', source: 'test' });
    expirePowers(1, (gs.activePlayers || []).filter(n => n !== 'Chase'));
    const inst = gs.bb.powers.find(p => p.powerId === 'diamond-veto');
    expect(inst.disposed).toBe(true);
    expect(inst.disposedReason).toBe('holder-evicted');
  });

  it('still expires normally when the window closes and the holder stayed', () => {
    grantPower('bonus-life', 'Bowie', { week: 1, visibility: 'holder-secret', source: 'test' });
    const inst = gs.bb.powers.find(p => p.powerId === 'bonus-life');
    expirePowers(inst.expiresAfterWeek + 1, gs.activePlayers);
    expect(inst.disposed).toBe(true);
    expect(inst.disposedReason).toBe('expired');
  });

  it('two powers can be live at the same timing, and each is findable by name', () => {
    // The regression: both fire on eviction night. Before the powerId filter,
    // whichever was granted first was the only one the engine could see.
    grantPower('bonus-life', 'Bowie', { week: 1, visibility: 'holder-secret', source: 'test' });
    grantPower('diamond-veto', 'Chase', { week: 1, visibility: 'secret', source: 'test' });

    expect(activePowersAt('eviction-night', 1)).toHaveLength(2);
    expect(activePowerAt('eviction-night', 1, 'diamond-veto')?.holder).toBe('Chase');
    expect(activePowerAt('eviction-night', 1, 'bonus-life')?.holder).toBe('Bowie');
  });
});

describe('the decision', () => {
  beforeEach(() => house());

  it('always plays it on itself when the holder is the one evicted', () => {
    grantPower('bonus-life', 'Bowie', { week: 1, visibility: 'holder-secret', source: 'test' });
    const act = withSeededRandom(7, () =>
      resolveBonusLife({ week: { num: 1 }, evicted: 'Bowie', rng: Math.random }));
    expect(act.fired).toBe(true);
    expect(act.self).toBe(true);
    expect(act.beneficiary).toBe('Bowie');
  });

  it('can sit on it while somebody else walks, and the hoard is a beat', () => {
    // A holder with no bond to the evictee, early in a long window: the
    // proportional read should mostly decline, and declining must produce an
    // act rather than silence — the viewer is owed the near miss.
    let hoarded = 0;
    for (let seed = 1; seed <= 40; seed++) {
      house();
      grantPower('bonus-life', 'Bowie', { week: 1, visibility: 'holder-secret', source: 'test' });
      const act = withSeededRandom(seed, () =>
        resolveBonusLife({ week: { num: 1 }, evicted: 'Caleb', rng: Math.random }));
      if (act?.hoarded) {
        hoarded++;
        expect(act.beats.length, 'a hoard with no beat is an invisible decision').toBeGreaterThan(0);
        expect(act.fired).toBe(false);
      }
    }
    expect(hoarded, 'it is spent on a stranger every single time').toBeGreaterThan(5);
  });

  it('fires itself on the last night of the window whether the holder likes it or not', () => {
    // Canonical: Sam never used hers, the fuse ran out, and it went off on the
    // fourth evictee. Hoarding has to be a gamble, not a way to opt out.
    const def = BB_POWER_DEFINITIONS['bonus-life'];
    expect(def.autoFiresAtExpiry).toBe(true);

    for (let seed = 1; seed <= 12; seed++) {
      house();
      const inst = grantPower('bonus-life', 'Bowie', { week: 1, visibility: 'holder-secret', source: 'test' });
      const last = inst.expiresAfterWeek;
      const act = withSeededRandom(seed, () =>
        resolveBonusLife({ week: { num: last }, evicted: 'Caleb', rng: Math.random }));
      expect(act.fired, `seed ${seed}: the fuse did not go off`).toBe(true);
      expect(act.beneficiary).toBe('Caleb');
    }
  });
});

describe('the competition', () => {
  beforeEach(() => house());

  it('is genuinely losable — the aired one was failed', () => {
    let won = 0, lost = 0;
    for (let seed = 1; seed <= 60; seed++) {
      house();
      grantPower('bonus-life', 'Bowie', { week: 1, visibility: 'holder-secret', source: 'test' });
      const act = withSeededRandom(seed, () =>
        resolveBonusLife({ week: { num: 1 }, evicted: 'Bowie', rng: Math.random }));
      if (act?.competition?.won) won++; else if (act?.fired) lost++;
    }
    expect(won, 'nobody ever comes back').toBeGreaterThan(3);
    expect(lost, 'the door always opens — the standard means nothing').toBeGreaterThan(3);
  });

  it('a win reverses the eviction everywhere it is read from', () => {
    let act = null;
    for (let seed = 1; seed <= 60 && !act?.competition?.won; seed++) {
      house();
      grantPower('bonus-life', 'Bowie', { week: 1, visibility: 'holder-secret', source: 'test' });
      gs.bb.weeks = [{ num: 1, evicted: 'Bowie', ballots: [
        { voter: 'Chase', evict: 'Bowie' }, { voter: 'Scary', evict: 'Bowie' },
        { voter: 'Axel', evict: 'Ripper' },
      ] }];
      gs.eliminated = ['Bowie'];
      gs.activePlayers = (gs.activePlayers || []).filter(n => n !== 'Bowie');
      act = withSeededRandom(seed, () =>
        resolveBonusLife({ week: { num: 1 }, evicted: 'Bowie', rng: Math.random }));
    }
    expect(act.competition.won).toBe(true);
    expect(act.returned).toBe('Bowie');
    expect(gs.activePlayers).toContain('Bowie');
    expect(gs.eliminated).not.toContain('Bowie');
    // Not a jury seat — the week is flagged, the vote still happened.
    expect(gs.bb.weeks[0].evictionReversed).toBe(true);
    // And they arrive knowing whose ballots had their name on.
    expect(act.grudges).toEqual(expect.arrayContaining(['Chase', 'Scary']));
    expect(getBond('Bowie', 'Chase')).toBeLessThan(0);
  });

  it('a loss is final and the power is spent', () => {
    let act = null;
    for (let seed = 1; seed <= 60 && !(act?.fired && !act?.competition?.won); seed++) {
      house();
      grantPower('bonus-life', 'Bowie', { week: 1, visibility: 'holder-secret', source: 'test' });
      act = withSeededRandom(seed, () =>
        resolveBonusLife({ week: { num: 1 }, evicted: 'Bowie', rng: Math.random }));
    }
    expect(act.competition.won).toBe(false);
    expect(act.returned).toBeNull();
    expect(gs.bb.powers.find(p => p.powerId === 'bonus-life').used).toBe(true);
  });
});

describe('in a played week', () => {
  it('resolves through the engine without disturbing a normal eviction', () => {
    house();
    const ep = play(4242);
    expect(ep.eliminated, 'the week did not produce an eviction').toBeTruthy();
    // No power granted, so nothing to resolve and no act.
    expect((ep.acts || []).some(a => a.type === 'bonus-life')).toBe(false);
  });

  it('fires on eviction night when the house is holding one', () => {
    house();
    // Grant before the week runs, the way a distributor would.
    const ep = withSeededRandom(88, () => {
      grantPower('bonus-life', gs.activePlayers[0], { week: 1, visibility: 'holder-secret', source: 'test' });
      return simulateBBEpisode();
    });
    const act = (ep.acts || []).find(a => a.type === 'bonus-life');
    expect(act, 'a live Bonus Life produced no act on eviction night').toBeTruthy();
    expect(act.beats.length).toBeGreaterThan(0);
  });

  it('reaches the transcript and the visual player', () => {
    house();
    const ep = withSeededRandom(88, () => {
      grantPower('bonus-life', gs.activePlayers[0], { week: 1, visibility: 'holder-secret', source: 'test' });
      return simulateBBEpisode();
    });
    // summariseWeek, not generateSummaryText: window.generateSummaryText is
    // unset under vitest, and this is the writer the tests can actually reach.
    const text = summariseWeek(gs.bb.weeks[gs.bb.weeks.length - 1]);
    expect(text).toMatch(/BONUS LIFE/);

    const act = (ep.acts || []).find(a => a.type === 'bonus-life');
    // Reveal state is created on first build, so build, open it, build again.
    rpBuildBBBonusLife(ep, act);
    const key = Object.keys(_tvState).find(k => k.startsWith('bb_bl_'));
    expect(key, 'the screen never registered a reveal key').toBeTruthy();
    _tvState[key].idx = 99;
    const html = rpBuildBBBonusLife(ep, act);
    expect(html).toMatch(/BONUS LIFE/);
    expect(html).not.toMatch(/is-hidden/);
    // Every beat's narration is on the screen, not just the header.
    for (const b of act.beats) {
      expect(html, `a beat never reached the screen: ${b.badgeText}`).toContain(b.text.slice(0, 40));
    }
  });
});
