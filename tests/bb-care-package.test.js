// America's Care Package (BB18).
//
// The inverse of every other twist in this catalogue. The contents are
// announced BEFORE the vote, the audience decides, and the recipient is named
// in front of the whole house — there is no hunt and nothing to work out.
//
// What it produces instead is a weekly public ranking of who the country
// likes, delivered to a room of people who did not get one. A houseguest may
// receive exactly one package all season, so the pool shrinks every week.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, summariseWeek } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { BB_TWIST_CONTRACTS } from '../js/bb/twist-contract.js';
import { CARE_PACKAGES } from '../js/bb/care-package.js';
import { CARE_PACKAGE_EVENTS } from '../js/bb-events/care-package.js';
import { HOUSE_EVENTS } from '../js/bb-events/index.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house(weeks = 1) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = Array.from({ length: weeks },
    (_, i) => ({ episode: i + 1, type: 'bb-care-package' }));
}

const actOf = (ep, type = 'care-package') => (ep.acts || []).find(a => a.type === type) || null;

/** Play until a week delivers the named package. */
function play(packageId = null, weeks = 1) {
  for (let seed = 1; seed <= 30; seed++) {
    house(weeks);
    let ep = null;
    for (let w = 0; w < weeks; w++) {
      ep = withSeededRandom(seed * 37 + w * 5 + 1, () => simulateBBEpisode());
      const act = actOf(ep);
      if (act && (!packageId || act.packageId === packageId)) return { ep, act, seed };
    }
  }
  return null;
}

describe("America's Care Package", () => {
  beforeEach(() => house());

  it('is the first public audience grant in the catalogue', () => {
    const c = BB_TWIST_CONTRACTS['bb-care-package'];
    expect(c).toBeTruthy();
    expect(c.acquisition).toEqual({ channel: 'audience', secrecy: 'public' });
    expect(TWIST_CATALOG.some(t => t.id === 'bb-care-package')).toBe(true);
    expect(CARE_PACKAGES).toHaveLength(5);
  });

  it('announces the contents and names the recipient out loud', () => {
    const played = play();
    expect(played, 'no package delivered').toBeTruthy();
    const { ep, act } = played;
    expect(act.secret).toBe(false);
    expect(act.recipient).toBeTruthy();
    for (const [label, text] of [
      ['summariseWeek', summariseWeek(gs.bb.weeks[gs.bb.weeks.length - 1])],
      ['generateSummaryText', generateSummaryText(ep)],
    ]) {
      expect(text, `${label}: untranscribed`).toMatch(/AMERICA'S CARE PACKAGE/);
      // Public means public: both the package and the person are nameable, and
      // that is the entire difference from the App Store.
      expect(text, `${label}: hid the recipient`).toContain(act.recipient);
      expect(text, `${label}: hid the contents`).toContain(act.package);
    }
  });

  it('runs the five in order and never gives one houseguest two', () => {
    for (let seed = 1; seed <= 8; seed++) {
      house(5);
      const seen = [];
      for (let w = 0; w < 5; w++) {
        const ep = withSeededRandom(seed * 37 + w * 5 + 1, () => simulateBBEpisode());
        const act = actOf(ep);
        if (act) seen.push(act);
      }
      if (seen.length < 3) continue;
      expect(seen.map(a => a.packageId))
        .toEqual(CARE_PACKAGES.slice(0, seen.length).map(p => p.id));
      const names = seen.map(a => a.recipient);
      expect(new Set(names).size, 'somebody got two packages').toBe(names.length);
      return;
    }
    throw new Error('no season delivered three packages');
  });

  it('makes Super Safety and the Co-HOH key unnominatable', () => {
    for (const id of ['super-safety', 'co-hoh']) {
      const played = play(id, 5);
      expect(played, `${id} never delivered`).toBeTruthy();
      const { ep, act } = played;
      expect(ep.initialNominees, `${id} was nominated anyway`).not.toContain(act.recipient);
      expect(ep.finalNominees || [], `${id} was replaced onto the block`)
        .not.toContain(act.recipient);
      if (id === 'co-hoh' && act.coNominee) {
        expect(ep.initialNominees).toContain(act.coNominee);
      }
    }
  });

  it('gives the house a weekly public ranking to resent', () => {
    expect(CARE_PACKAGE_EVENTS.length).toBeGreaterThanOrEqual(6);
    const ids = new Set(HOUSE_EVENTS.map(e => e.id));
    for (const e of CARE_PACKAGE_EVENTS) expect(ids.has(e.id), `${e.id} unreachable`).toBe(true);
    let seen = 0;
    const kinds = new Set();
    for (let seed = 1; seed <= 10; seed++) {
      house(5);
      for (let w = 0; w < 5; w++) {
        const ep = withSeededRandom(seed * 37 + w * 5 + 1, () => simulateBBEpisode());
        const bs = (ep.acts || []).flatMap(a => a.socialBeats || [])
          .filter(b => String(b.eventId || '').startsWith('care-'));
        seen += bs.length;
        for (const b of bs) kinds.add(b.eventId);
      }
    }
    expect(seen, 'the house never reacted to a care package').toBeGreaterThan(0);
    // The two eviction-night packages react a week LATE by design, so a run
    // this long should have reached more than one kind of beat.
    expect(kinds.size, 'only one care-package beat is ever reachable').toBeGreaterThan(1);
  });

  it('strikes two votes by name, and buys one in private', () => {
    const blocked = play('vote-block', 5);
    expect(blocked, 'vote block never delivered').toBeTruthy();
    if (blocked.act.blocked.length) {
      const week = gs.bb.weeks[gs.bb.weeks.length - 1];
      for (const name of blocked.act.blocked) {
        expect((week.ballots || []).some(b => b.voter === name),
          'a struck voter still cast a ballot').toBe(false);
      }
      // Struck in public: the transcript names them and names who did it.
      const text = generateSummaryText(blocked.ep);
      expect(text).toContain(blocked.act.blocked[0]);
    }

    const bribed = play('bribe', 5);
    expect(bribed, 'bribe never delivered').toBeTruthy();
    if (bribed.act.bribe) {
      expect(bribed.act.bribe.amount).toBe(5000);
      expect(bribed.act.bribe.mark).not.toBe(bribed.act.recipient);
      // Who took the money is never printed as a fact about the vote count.
      const text = generateSummaryText(bribed.ep);
      if (bribed.act.bribe.taken) {
        expect(text).not.toContain(`${bribed.act.bribe.mark} was bought`);
      }
    }
  });
});
