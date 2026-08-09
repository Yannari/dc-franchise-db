// The power shelf.
//
// The architecture always separated a POWER (a rule object with a lifecycle)
// from the DISTRIBUTOR that hands it out — the Diamond Veto is the same power
// whether a competition awarded it in public or Pandora's Box slipped it to
// somebody. That separation was correct and completely untested, because the
// registry held exactly one power and three of the eight declared acquisition
// channels were ever used. Pandora's Box was a container with one thing to put
// in it.
//
// These are the three that prove the lifecycle generalises, each firing at a
// different moment of the week:
//
//   the-cloud    before the nomination ceremony  (preventative, one ceremony)
//   coup-d-etat  after the veto ceremony         (overrules the whole block)
//   bonus-life   eviction night                  (a chance to come back)
//
// Real rules, off the wiki, and two of them are not what they sound like: the
// Cloud does NOT cover the week — use it on nomination day and you are still a
// legal replacement at the veto ceremony — and Bonus Life is not immunity, it
// is a competition to come back with.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { BB_POWER_DEFINITIONS, grantPower, heldPowers, spendPull } from '../js/bb/powers.js';
import { BB_TWIST_CONTRACTS, POWER_ACQUISITION_CHANNELS } from '../js/bb/twist-contract.js';
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
const actOf = (ep, type) => (ep.acts || []).find(a => a.type === type);
const played = (ep, id) => (ep.acts || []).find(a => a.type === 'power-played' && a.powerId === id);

describe('the shelf has more than one thing on it', () => {
  beforeEach(() => house());

  it('holds four powers, each with its own moment in the week', () => {
    const ids = Object.keys(BB_POWER_DEFINITIONS);
    expect(ids).toEqual(expect.arrayContaining(
      ['diamond-veto', 'coup-d-etat', 'the-cloud', 'bonus-life']));
    // Different timings, or the lifecycle has not been proven to generalise —
    // it has only been proven to work for a Diamond-Veto-shaped power.
    const timings = new Set(ids.map(id => {
      const t = BB_POWER_DEFINITIONS[id].useTiming;
      return typeof t === 'string' ? t : t.public;
    }));
    expect(timings.size, 'every power fires at the same moment').toBeGreaterThan(2);
  });

  it('Pandora’s Box is a container with a real choice of cargo', () => {
    // It was never hard-wired to the Diamond Veto — the shelf simply had one
    // item on it. Anything in the registry can be the prize.
    for (const id of ['the-cloud', 'coup-d-etat', 'bonus-life']) {
      expect(BB_POWER_DEFINITIONS[id], `${id} cannot be put in the box`).toBeTruthy();
    }
  });
});

describe('The Cloud', () => {
  beforeEach(() => house());

  // Enough seeds that a zero-fire run is not a coin flip.
  //
  // The Cloud stopped being automatic and became a DECISION, which is right —
  // and immediately made this test flaky, because five seeds is nowhere near
  // enough to observe a decision that is usually "no". A holder who senses
  // nothing coming mostly sits on it, which is the point of making it one.
  //
  // The rate when they DO sense it is guarded separately, in "powers get spent
  // by the people who need them" at the bottom of this file. It used to be 55%
  // and this comment recorded that as if it were fine — one holder in two
  // walking onto the block still holding the thing that stops it.
  //
  // At ~15% overall a five-seed window comes up empty roughly 45% of the time. Thirty
  // brings that under 1%, which is the difference between a guard and a coin.
  const CLOUD_SEEDS = [2026, 77, 4242, 31, 909, 12, 88, 141, 203, 317,
    404, 512, 633, 719, 826, 934, 1041, 1158, 1263, 1372,
    1489, 1596, 1703, 1818, 1925, 2044, 2157, 2268, 2379, 2481];

  it('takes its holder off the nomination ceremony, and no further', () => {
    let proved = 0;
    for (const seed of CLOUD_SEEDS) {
      house();
      const ep = withSeededRandom(seed, () => {
        // Granted to somebody who is not about to hold the room.
        const target = NAMES[3];
        grantPower('the-cloud', target, { week: 1, visibility: 'holder-secret', source: 'test' });
        return simulateBBEpisode();
      });
      const act = played(ep, 'the-cloud');
      if (!act) continue;
      proved++;
      // Safe at the ceremony it was spent on.
      expect(ep.initialNominees, `${act.holder} spent the Cloud and was nominated anyway`)
        .not.toContain(act.holder);
      // And NOT safe afterwards: the power is spent, so nothing is protecting
      // them from the replacement chair.
      expect(heldPowers(act.holder, 'the-cloud'), 'the Cloud survived being used')
        .toHaveLength(0);
    }
    expect(proved, 'the Cloud never fired in any seeded week').toBeGreaterThan(0);
  });
});

describe("The Coup d'Etat", () => {
  beforeEach(() => house());

  it('overrules the block, and cannot touch the two who earned their safety', () => {
    let proved = 0;
    for (const seed of [2026, 77, 4242, 31, 909, 1301, 58]) {
      house();
      const ep = withSeededRandom(seed, () => {
        grantPower('coup-d-etat', NAMES[5], { week: 1, visibility: 'secret', source: 'test' });
        return simulateBBEpisode();
      });
      const act = played(ep, 'coup-d-etat');
      if (!act) continue;
      proved++;
      const veto = actOf(ep, 'veto');
      // The two names it may never put up.
      expect(act.nominees, 'the coup nominated the Head of Household').not.toContain(ep.hoh);
      if (veto?.winner) {
        expect(act.nominees, 'the coup nominated the veto holder').not.toContain(veto.winner);
      }
      // Two up, two down, and the block afterwards is the coup's block.
      expect(act.nominees).toHaveLength(2);
      expect([...ep.finalNominees].sort()).toEqual([...act.nominees].sort());
      expect(act.holder).not.toBe(ep.hoh);
    }
    expect(proved, "the Coup never fired in any seeded week").toBeGreaterThan(0);
  });

  it('looks at who is standing on the block before emptying it', () => {
    // There was no decision here at all — `if (coup)` and then straight to
    // `usePower`. The loudest power in the game fired the first legal minute it
    // existed, on whatever block happened to be sitting there, so a fortnight
    // window was always spent in week one and a holder whose alliance was
    // nowhere near the block detonated it anyway: two new enemies, a dethroned
    // Head of Household, and nothing bought. The tension the two-week window
    // was written for never happened once.
    //
    // Bucketed by the block AS IT STOOD when the holder had to decide, which is
    // `removed` when it fired and the final block when it did not. An earlier
    // version of this compared against a control run without the power and
    // measured nothing: granting a power shifts the rng stream, so the control
    // is a different week with a different block.
    const buckets = { on: [0, 0], off: [0, 0] };
    for (let i = 0; i < 50; i++) {
      const seed = 1000 + i * 37;
      house();
      const holder = NAMES[5];
      const mate = NAMES[8];
      const ep = withSeededRandom(seed, () => {
        gs.namedAlliances = [{ name: 'The Committee', members: [holder, mate], active: true }];
        grantPower('coup-d-etat', holder, { week: 1, visibility: 'secret', source: 'test' });
        return simulateBBEpisode();
      });
      if (ep.hoh === holder) continue;
      const act = (ep.acts || []).find(a => a.powerId === 'coup-d-etat');
      const before = act ? (act.removed || []) : (ep.finalNominees || []);
      const key = before.includes(mate) || before.includes(holder) ? 'on' : 'off';
      buckets[key][1]++;
      if ((gs.bb?.powers || []).find(p => p.powerId === 'coup-d-etat' && p.used)) buckets[key][0]++;
    }
    const rate = ([f, n]) => (n ? f / n : 0);
    expect(buckets.on[1], 'no seeded week put the holder or their ally up').toBeGreaterThan(5);
    expect(rate(buckets.on), 'it sat on the coup while its own alliance was on the block')
      .toBeGreaterThan(0.6);
    expect(rate(buckets.on) - rate(buckets.off),
      'who was on the block made no difference to whether it fired').toBeGreaterThan(0.25);
  }, 240000);

  it('costs the Head of Household something for being overruled in public', () => {
    for (const seed of [2026, 77, 4242, 31, 909, 1301, 58]) {
      house();
      const ep = withSeededRandom(seed, () => {
        grantPower('coup-d-etat', NAMES[5], { week: 1, visibility: 'secret', source: 'test' });
        return simulateBBEpisode();
      });
      const act = played(ep, 'coup-d-etat');
      if (!act) continue;
      // The people taken off the block and the people put on it do not feel
      // the same way about the person who did it.
      const saved = act.removed?.[0];
      const named = act.nominees?.[0];
      if (!saved || !named) continue;
      expect(getBond(saved, act.holder), 'being saved by the coup cost the saver nothing')
        .toBeGreaterThan(getBond(named, act.holder));
      return;
    }
    throw new Error('no seeded week produced a coup to check');
  });
});

describe('The App Store', () => {
  beforeEach(() => house(['bb-app-store']));

  it('is a distributor on a channel nothing had ever used', () => {
    expect(BB_TWIST_CONTRACTS['bb-app-store']).toBeTruthy();
    expect(BB_TWIST_CONTRACTS['bb-app-store'].acquisition.channel).toBe('audience');
    expect(POWER_ACQUISITION_CHANNELS).toContain('audience');
    // A distributor changes who holds what, not how the week is played.
    expect(Object.keys(BB_TWIST_CONTRACTS['bb-app-store'].rules)).toHaveLength(0);
  });

  it('hands out powers nobody competed for, in secret', () => {
    const ep = play();
    const act = actOf(ep, 'app-store');
    expect(act, 'the app store never opened').toBeTruthy();
    expect(act.secret).toBe(true);
    expect(act.winners.length, 'nothing came off the shelf').toBeGreaterThan(0);

    for (const w of act.winners) {
      expect(ep.houseAtStart).toContain(w.name);
      expect(BB_POWER_DEFINITIONS[w.powerId], `${w.powerId} is not a real power`).toBeTruthy();
    }
    // Nobody gets two.
    const names = act.winners.map(w => w.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('the audience votes for who it has been watching', () => {
    // Screen time is the only currency here, and that is the point of the
    // twist: the powers land on the most WATCHED houseguests rather than the
    // best ones. Loaded heavily so this reads the weighting, not the noise.
    let favouredWins = 0, runs = 0;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
      house(['bb-app-store']);
      const ep = withSeededRandom(seed, () => {
        gs.popularity = { [NAMES[7]]: 60 };
        return simulateBBEpisode();
      });
      const act = actOf(ep, 'app-store');
      if (!act) continue;
      runs++;
      if (act.winners.some(w => w.name === NAMES[7])) favouredWins++;
    }
    expect(runs, 'the app store never ran').toBeGreaterThan(0);
    expect(favouredWins / runs, 'screen time did not move the vote at all')
      .toBeGreaterThan(0.5);
  });

  it('stocks the shelf the Format Designer asked for', () => {
    // Booking a specific power onto a specific week is the reason the control
    // exists: without it the audience votes over whatever happened to be in
    // the registry, and adding a power silently changed every scheduled week.
    house(['bb-app-store']);
    seasonConfig.twistSchedule = [{ episode: 1, type: 'bb-app-store', shelf: 'the-cloud' }];
    const ep = play(4242);
    const act = actOf(ep, 'app-store');
    expect(act, 'the app store never opened').toBeTruthy();
    expect(act.shelf, 'the shelf was not the one that was booked')
      .toEqual([BB_POWER_DEFINITIONS['the-cloud'].name]);
    for (const w of act.winners) expect(w.powerId).toBe('the-cloud');
  });

  it('does not hand out a power that already has its own distributor', () => {
    // The Diamond Veto arrives through the veto competition and through the
    // box. If the default shelf carried it too, a week running both would give
    // it away twice, and the second grant would sit unused behind the first.
    house(['bb-app-store']);
    const ep = play(77);
    const act = actOf(ep, 'app-store');
    expect(act, 'the app store never opened').toBeTruthy();
    for (const w of act.winners) {
      expect(w.powerId, 'the app store handed out the Diamond Veto').not.toBe('diamond-veto');
    }
  });
});

describe('powers get spent by the people who need them', () => {
  beforeEach(() => house());

  // The complaint that produced `spendPull`, in the form it was measured in:
  // powers were being held through the exact week they were written for.
  //
  // Every gate on the shelf had its own hand-tuned constants and they had all
  // drifted timid. Measured over sixty seeded weeks, granting each power to
  // somebody who was ACTUALLY in trouble that week: the Cloud fired 80% of the
  // time and the Interrogation 57%. Both are now read off one shared curve, and
  // the same measurement says 93% and 78%.
  //
  // The floors here sit below what was measured, not at it — this guards
  // against the drift back toward timidity, not against the numbers moving.
  const seeds = n => Array.from({ length: n }, (_, i) => 1000 + i * 37);

  // Not by act type. Every power emits a differently-shaped act, and looking
  // for the wrong one reads as "this power never fires" — it did, for three of
  // them, while I was measuring this. The ledger is what they all agree on.
  const spent = (id, holder) => !!(gs.bb?.powers || [])
    .find(p => p.powerId === id && p.holder === holder && p.used);

  it('does not sit on a power through the week it exists for', () => {
    // Two passes over the same seeds: one with no power, to find out who was
    // in trouble, and one granting it to exactly that person.
    const trouble = [];
    for (const seed of seeds(40)) {
      house();
      const ep = withSeededRandom(seed, () => simulateBBEpisode());
      trouble.push({ seed, noms: ep.initialNominees || [], hoh: ep.hoh });
    }

    for (const [id, floor] of [['the-cloud', 0.8], ['hoh-interrogation', 0.6]]) {
      let fired = 0; let n = 0;
      for (const t of trouble) {
        const holder = (t.noms || []).find(x => x && x !== t.hoh);
        if (!holder) continue;
        house();
        withSeededRandom(t.seed, () => {
          grantPower(id, holder, { week: 1, visibility: 'holder-secret', source: 'test' });
          return simulateBBEpisode();
        });
        n++;
        if (spent(id, holder)) fired++;
      }
      expect(n, `${id}: no seeded week put its holder in danger`).toBeGreaterThan(10);
      expect(fired / n, `${id} was held through ${n - fired} of ${n} weeks its holder needed it`)
        .toBeGreaterThan(floor);
    }
  }, 240000);

  it('still holds it on a week nobody is coming', () => {
    // The other half. Raising the floor is worthless if it just spends
    // everything the moment it is granted — the Cloud on a quiet week should
    // stay in the pocket, and it does, at 2%.
    let fired = 0; let n = 0;
    for (const seed of seeds(40)) {
      house();
      const ctl = withSeededRandom(seed, () => simulateBBEpisode());
      const safe = NAMES.find(x => x !== ctl.hoh && !(ctl.initialNominees || []).includes(x));
      if (!safe) continue;
      house();
      withSeededRandom(seed, () => {
        grantPower('the-cloud', safe, { week: 1, visibility: 'holder-secret', source: 'test' });
        return simulateBBEpisode();
      });
      n++;
      if (spent('the-cloud', safe)) fired++;
    }
    expect(fired / n, 'the Cloud is being burned on quiet weeks').toBeLessThan(0.25);
  }, 240000);

  it('treats the last week of a window as the decision, not a nudge', () => {
    // An unspent power at the end of its window is worth exactly nothing, so
    // even a marginal use beats binning it. This was a +0.18 on the Diamond and
    // a +0.22 on the Hex — a rounding error against a decision.
    const marginal = { need: 0.15, nerve: 0.5 };
    expect(spendPull({ ...marginal, weeksLeft: 4 })).toBeLessThan(0.2);
    expect(spendPull({ ...marginal, weeksLeft: 0 })).toBeGreaterThan(0.55);
  });

  it('gives nobody patience about their own eviction', () => {
    // Patience is scaled by how little you need it, so at full need it is
    // exactly zero: no amount of remaining window makes somebody sit on a power
    // while they are the one going home.
    for (const weeksLeft of [0, 1, 3, 6]) {
      expect(spendPull({ need: 1, weeksLeft, nerve: 0.1 }),
        `a full-need holder hesitated with ${weeksLeft} weeks left`).toBeGreaterThan(0.9);
    }
    // And nerve is a tilt, not a gate: a timid houseguest hesitates, they do
    // not hold a veto through their own eviction. A few points, not a third.
    const bold = spendPull({ need: 0.6, weeksLeft: 3, nerve: 1 });
    const timid = spendPull({ need: 0.6, weeksLeft: 3, nerve: 0 });
    expect(bold).toBeGreaterThan(timid);
    expect(bold - timid, 'boldness decides this rather than tilting it').toBeLessThan(0.35);
  });
});
