// America's Nominee (BB15).
//
// A third houseguest goes on the block and nobody in the building put them
// there. Two shapes, both real: for three weeks the audience voted a houseguest
// MVP and that houseguest secretly named the third nominee; for three more the
// audience named the third directly.
//
// The rule the wiki is explicit about, and the one that separates this from
// every other third-chair twist here: if the veto saves the third nominee there
// is NO replacement. Roadkill hands the pen to whoever filled the chair. This
// one simply empties it, because nobody in the house owns that seat.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, summariseWeek } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { BB_TWIST_CONTRACTS, resolveWeekTwistState } from '../js/bb/twist-contract.js';
import { AMERICAS_NOMINEE_EVENTS } from '../js/bb-events/americas-nominee.js';
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

function house() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = [{ episode: 1, type: 'bb-americas-nominee' }];
}

const actOf = ep => (ep.acts || []).find(a => a.type === 'americas-nominee') || null;
const beats = ep => (ep.acts || []).flatMap(a => a.socialBeats || [])
  .filter(b => String(b.eventId || '').startsWith('americas-'));

function play(seedBase = 29) {
  for (let seed = 1; seed <= 15; seed++) {
    house();
    const ep = withSeededRandom(seed * seedBase + 7, () => simulateBBEpisode());
    if (actOf(ep)) return ep;
  }
  return null;
}

describe("America's Nominee", () => {
  beforeEach(house);

  it('is registered, and asks for a third chair with no replacement', () => {
    expect(BB_TWIST_CONTRACTS['bb-americas-nominee']).toBeTruthy();
    expect(TWIST_CATALOG.some(t => t.id === 'bb-americas-nominee')).toBe(true);
    const resolved = resolveWeekTwistState(['bb-americas-nominee']);
    expect(resolved.rules.nomineeCount).toBe(3);
    expect(resolved.rules.thirdChairNoReplacement).toBe(true);
  });

  it('seats a third nominee nobody in the house chose', () => {
    const ep = play();
    expect(ep, 'no third chair in 15 seeds').toBeTruthy();
    const act = actOf(ep);
    expect(ep.initialNominees).toHaveLength(3);
    expect(ep.initialNominees).toContain(act.nominee);
    expect(act.nominee, 'the HOH was nominated by the audience').not.toBe(ep.hoh);
  });

  it('empties the chair rather than refilling it', () => {
    // The whole difference from Roadkill.
    let seen = 0;
    for (let seed = 1; seed <= 40 && !seen; seed++) {
      house();
      const ep = withSeededRandom(seed * 13 + 1, () => simulateBBEpisode());
      const act = actOf(ep);
      const vc = (ep.acts || []).find(a => a.type === 'veto-ceremony');
      if (!act || !vc || vc.saved !== act.nominee) continue;
      seen++;
      expect(ep.finalNominees, 'somebody was named to a chair nobody owns').toHaveLength(2);
      expect(ep.finalNominees).not.toContain(act.nominee);
    }
    expect(seen, 'no seed vetoed the third nominee').toBeGreaterThan(0);
  });

  it('reaches both transcripts', () => {
    const ep = play();
    expect(ep, 'no week to check').toBeTruthy();
    for (const [label, text] of [
      ['summariseWeek', summariseWeek(gs.bb.weeks[gs.bb.weeks.length - 1])],
      ['generateSummaryText', generateSummaryText(ep)],
    ]) {
      expect(text, `${label}: untranscribed`).toMatch(/AMERICA'S NOMINEE/);
      expect(text).toContain(actOf(ep).nominee);
    }
  });

  it('makes the house react without ever naming the MVP', () => {
    expect(AMERICAS_NOMINEE_EVENTS.length).toBeGreaterThanOrEqual(5);
    const ids = new Set(HOUSE_EVENTS.map(e => e.id));
    for (const e of AMERICAS_NOMINEE_EVENTS) {
      expect(ids.has(e.id), `${e.id} is unreachable`).toBe(true);
    }
    let seen = 0;
    for (let seed = 1; seed <= 20; seed++) {
      house();
      const ep = withSeededRandom(seed * 29 + 7, () => simulateBBEpisode());
      const act = actOf(ep);
      const bs = beats(ep);
      if (!act || !bs.length) continue;
      seen += bs.length;
      if (!act.mvp) continue;
      for (const b of bs) {
        for (const claim of [`${act.mvp} is the MVP`, `${act.mvp} named`,
          `${act.mvp} nominated`, `${act.mvp} chose`]) {
          expect(b.text, `a beat named the MVP: "${claim}"`).not.toContain(claim);
        }
      }
    }
    expect(seen, 'the house never reacted to an anonymous third chair').toBeGreaterThan(0);
  });
});
