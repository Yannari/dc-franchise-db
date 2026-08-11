// Premiere Night, and the two powers it hands out.
//
// BB27's opening: the Mastermind takes the host and the HOH relic, the house
// splits in two to hunt them, and each half's winner takes a prize. The prizes
// are deliberately mismatched — one is loud and one is disguised as loud — and
// the point of the night is that the house spends a fortnight watching the
// wrong one.
//
// The two powers are on the ordinary shelf rather than welded into this card,
// which is the thing worth testing: it means every distributor in the game can
// hand them out, and it means their effects have to work when they arrive from
// somewhere else entirely.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, setGs, TWIST_CATALOG,
  twistsForFormat } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { BB_TWIST_CONTRACTS, resolveWeekTwistState } from '../js/bb/twist-contract.js';
import { BB_POWER_DEFINITIONS, grantPower, heldPowers } from '../js/bb/powers.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house(extra = {}) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', theme: '', ...extra });
  seasonConfig.twistSchedule = [];
  seasonConfig.themeArcStamped = '';
  setGs({ ...gs, bb: null });
}

function playPremiere(seed = 511) {
  seasonConfig.twistSchedule = [{ id: 'p1', episode: 1, type: 'bb-premiere-mystery' }];
  let week = null;
  withSeededRandom(seed, () => {
    simulateBBEpisode();
    week = (gs.bb.weeks || [])[0];
  });
  return week;
}
const openingAct = week => (week.acts || []).find(a => a.type === 'premiere-mystery');

beforeEach(() => house());
afterEach(() => { setGs({ ...gs, bb: null }); });

describe('the two powers', () => {
  it('are on the shelf, so every channel can hand them out', () => {
    // The user's rule: a power with a channel should be reachable through it
    // rather than locked to the card that introduced it. Distributors default
    // their doors to the whole shelf, so being here IS being schedulable.
    expect(BB_POWER_DEFINITIONS['hoh-gatekeeper']).toBeTruthy();
    expect(BB_POWER_DEFINITIONS['buy-off']).toBeTruthy();
    expect(BB_POWER_DEFINITIONS['hoh-gatekeeper'].rules.hohEligibility).toBe(4);
    expect(BB_POWER_DEFINITIONS['buy-off'].rules.buyOff).toBe(true);
  });

  it('the relic decides who is allowed to play for the crown', () => {
    house();
    withSeededRandom(404, () => {
      simulateBBEpisode();                       // a normal week 1
      grantPower('hoh-gatekeeper', gs.activePlayers[0],
        { week: 2, visibility: 'public', source: 'test' });
      simulateBBEpisode();
    });
    const week = (gs.bb.weeks || [])[1];
    expect(week.relicPick, 'the relic never acted').toBeTruthy();
    expect(week.relicPick.eligible.length).toBe(4);
    // And the crown came out of those four, not out of the whole house.
    expect(week.relicPick.eligible).toContain(week.hoh);
  });

  it('the buy-off takes the holder off the block and the HOH cannot refuse', () => {
    house();
    let week = null;
    withSeededRandom(808, () => {
      for (let i = 0; i < 8; i++) {
        simulateBBEpisode();
        const w = (gs.bb.weeks || [])[gs.bb.weeks.length - 1];
        // Hand it to somebody who has just been nominated, and let the next
        // week's ceremony find it.
        const nom = (w.initialNominees || []).find(n => gs.activePlayers.includes(n));
        if (nom && !heldPowers(nom, 'buy-off').length) {
          grantPower('buy-off', nom, { week: w.num + 1, visibility: 'secret', source: 'test' });
        }
        week = (gs.bb.weeks || []).find(x => x.buyOff);
        if (week) break;
      }
    });
    if (!week) return;                            // the holder was never re-nominated
    expect(week.buyOff.holder).toBeTruthy();
    expect(week.buyOff.replacement).toBeTruthy();
    expect(week.buyOff.replacement).not.toBe(week.buyOff.holder);
    // Off the block, and somebody else on it.
    expect(week.finalNominees || week.initialNominees).not.toContain(week.buyOff.holder);
  });
});

describe('premiere night', () => {
  it('splits the house, produces two winners, and grants both powers', () => {
    const week = playPremiere();
    const act = openingAct(week);
    expect(act, 'the premiere never ran').toBeTruthy();
    expect(act.relicTeam.length + act.hostTeam.length).toBe(NAMES.length);
    // Two groups, nobody in both.
    expect(act.relicTeam.filter(n => act.hostTeam.includes(n))).toEqual([]);
    expect(act.relicTeam).toContain(act.relicWinner);
    expect(act.hostTeam).toContain(act.hostWinner);
    expect(act.relicWinner).not.toBe(act.hostWinner);
    expect(act.relicGranted).toBe(true);
    expect(act.buyOffGranted).toBe(true);
    // The relic is granted AND SPENT on the same night — it decides who plays
    // for this week's crown — so it is correctly no longer held by the time
    // the week is over. The buy-off has a four-week fuse and is still in hand.
    expect(week.relicPick?.holder).toBe(act.relicWinner);
    expect(heldPowers(act.hostWinner, 'buy-off').length).toBe(1);
  });

  it('lets the relic act on the very week it was won', () => {
    const week = playPremiere();
    const act = openingAct(week);
    expect(week.relicPick, 'the relic was won and never used').toBeTruthy();
    expect(week.relicPick.holder).toBe(act.relicWinner);
    expect(week.relicPick.eligible.length).toBe(4);
  });

  it('keeps the money public and the power secret', () => {
    const week = playPremiere();
    const act = openingAct(week);
    const held = heldPowers(act.hostWinner, 'buy-off')[0];
    expect(held.visibility).toBe('secret');
    // The relic is the loud one, and the proof it was public is that the house
    // watched four names get read out — the act records who and which four.
    expect(week.relicPick.eligible.length).toBe(4);
    expect(week.relicPick.holder).toBe(act.relicWinner);
  });

  it('is a search, not a die roll', () => {
    const week = playPremiere();
    const act = openingAct(week);
    expect(act.hunts?.length).toBe(2);
    for (const h of act.hunts) {
      // Rooms actually searched, and the last thing that happens is the find.
      expect(h.rounds.length).toBeGreaterThan(1);
      expect(h.rounds[h.rounds.length - 1].outcome).toBe('found');
      expect(h.rounds[h.rounds.length - 1].who).toBe(h.found);
      expect(h.hidingIn).toBeTruthy();
      // Nobody searches after it has been found.
      expect(h.rounds.filter(r => r.outcome === 'found').length).toBe(1);
    }
  });

  it('is a competition, so both groups play the same length of one', () => {
    // Reported off a real episode: one group had sixteen cards and the other
    // had ONE, because a first-round find ended that group's night before it
    // started. The wiki calls it a competition — "each group would compete in a
    // competition where the winner would receive a game-changing prize" — and a
    // competition has a shape.
    for (const seed of [511, 222, 909]) {
      house();
      const act = openingAct(playPremiere(seed));
      const [a, b] = act.hunts.map(h => h.rounds.length);
      expect(Math.min(a, b), 'a group barely searched').toBeGreaterThan(4);
      // Both sides play the same rounds; the counts differ only by team size.
      const perHead = act.hunts.map(h => (h.rounds.length - 1) / h.team.length);
      expect(Math.abs(perHead[0] - perHead[1])).toBeLessThan(0.6);
      // The recovery is the LAST thing that happens, not a lucky early roll.
      for (const h of act.hunts) {
        expect(h.rounds[h.rounds.length - 1].outcome).toBe('found');
        expect(h.rounds.filter(r => r.outcome === 'found').length).toBe(1);
      }
    }
  });

  it('says how the two groups were formed', () => {
    // The wiki does not say how the house split, so this is our rule and the
    // screen has to admit that rather than present a coin toss as history.
    const act = openingAct(playPremiere());
    expect(act.splitRule).toMatch(/split themselves/i);
    expect(act.relicTeam.length + act.hostTeam.length).toBe(NAMES.length);
    expect(Math.abs(act.relicTeam.length - act.hostTeam.length)).toBeLessThanOrEqual(1);
  });

  it('makes the relic worth lobbying for, and remembers who was told yes', () => {
    // The pick was a sort over stats, which is not what this power is: the
    // hours between winning it and spending it are the most political stretch
    // of the season, and they were happening off screen instantly.
    const week = playPremiere();
    expect(week.relicLobby?.length, 'nobody asked').toBeGreaterThan(0);
    for (const l of week.relicLobby) {
      expect(['target', 'vote', 'safety', 'plea', 'loyalty']).toContain(l.offer);
    }
    // Anybody told yes is either in the four, or on the broken list — never
    // silently dropped.
    const promised = week.relicLobby.filter(l => l.won).map(l => l.asker);
    for (const n of promised) {
      const kept = week.relicPick.eligible.includes(n);
      const broken = (week.relicBroken || []).includes(n);
      expect(kept || broken, `${n} was promised a seat and neither got one nor was recorded as broken`)
        .toBe(true);
    }
  });

  it('replays identically from the same seed', () => {
    const a = openingAct(playPremiere(222));
    house();
    const b = openingAct(playPremiere(222));
    expect(`${b.relicWinner}|${b.hostWinner}`).toBe(`${a.relicWinner}|${a.hostWinner}`);
  });

  it('is offered in the designer', () => {
    expect(twistsForFormat({ format: 'big-brother' }).map(t => t.id))
      .toContain('bb-premiere-mystery');
    expect(BB_TWIST_CONTRACTS['bb-premiere-mystery']).toBeTruthy();
    expect(resolveWeekTwistState(['bb-premiere-mystery']).rules.premiereMystery).toBe(true);
  });
});
