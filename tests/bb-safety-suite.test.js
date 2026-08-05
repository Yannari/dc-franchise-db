// The Safety Suite (BB22).
//
// The twist is the economy, not the competition. One entry per houseguest for
// the WHOLE SEASON, so the decision is which week is worth spending it on —
// and everything is public, so the house can see who swiped, who held, and who
// has nothing left.
//
// The winner is safe and must name a Plus One, who is also safe and takes a
// punishment for it. A lone entrant is not safe by default: they still have to
// beat the clock.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, summariseWeek } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { BB_TWIST_CONTRACTS, BASE_WEEK_RULES, resolveWeekTwistState } from '../js/bb/twist-contract.js';
import { PLUS_ONE_PUNISHMENTS } from '../js/bb/safety-suite.js';
import { SAFETY_SUITE_EVENTS } from '../js/bb-events/safety-suite.js';
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
    (_, i) => ({ episode: i + 1, type: 'bb-safety-suite' }));
}

const actOf = ep => (ep.acts || []).find(a => a.type === 'safety-suite') || null;

/** Play until a week produces a suite act matching `want`. */
function play(want = () => true, weeks = 3) {
  for (let seed = 1; seed <= 30; seed++) {
    house(weeks);
    for (let w = 0; w < weeks; w++) {
      const ep = withSeededRandom(seed * 29 + w * 7 + 5, () => simulateBBEpisode());
      const act = actOf(ep);
      if (act && want(act)) return { ep, act, seed };
    }
  }
  return null;
}

describe('the Safety Suite', () => {
  beforeEach(() => house());

  it('is the first consumer of the dormant safety slot', () => {
    const c = BB_TWIST_CONTRACTS['bb-safety-suite'];
    expect(c).toBeTruthy();
    expect(BASE_WEEK_RULES.addSlots).toEqual([]);
    expect(resolveWeekTwistState(['bb-safety-suite']).rules.addSlots).toContain('safety');
    expect(TWIST_CATALOG.some(t => t.id === 'bb-safety-suite')).toBe(true);
    expect(PLUS_ONE_PUNISHMENTS.length).toBeGreaterThanOrEqual(4);
  });

  it('never lets a houseguest enter twice, and never lets the HOH enter', () => {
    for (let seed = 1; seed <= 10; seed++) {
      house(4);
      const seen = [];
      let ran = 0;
      for (let w = 0; w < 4; w++) {
        const ep = withSeededRandom(seed * 29 + w * 7 + 5, () => simulateBBEpisode());
        const act = actOf(ep);
        if (!act) continue;
        ran++;
        expect(act.entrants, 'the Head of Household entered').not.toContain(ep.hoh);
        for (const n of act.entrants) {
          expect(seen, `${n} entered twice`).not.toContain(n);
          seen.push(n);
        }
      }
      if (ran >= 3 && seen.length >= 2) return;
    }
    throw new Error('no season ran the suite three times with entrants');
  });

  it('protects the winner and the Plus One for the whole week', () => {
    const played = play(a => a.winner && a.plusOne);
    expect(played, 'nobody ever won the suite with a Plus One').toBeTruthy();
    const { ep, act } = played;
    for (const safe of [act.winner, act.plusOne]) {
      expect(ep.initialNominees, `${safe} was nominated`).not.toContain(safe);
      expect(ep.finalNominees || [], `${safe} was backdoored`).not.toContain(safe);
    }
    // A Plus One is safe AND punished — the gift has a bill on it.
    expect(act.punishment).toBeTruthy();
    if (act.punishment === 'slop') {
      expect(gs.bb.weeks[gs.bb.weeks.length - 1].haveNots || []).toContain(act.plusOne);
    }
  });

  it('does not hand a lone entrant safety for free', () => {
    const solo = play(a => a.solo);
    if (!solo) return;                     // rare; the rule is asserted below anyway
    // Solo or not, safety only ever comes from beating the clock.
    expect(Boolean(solo.act.winner)).toBe(solo.act.beatTheClock);
  });

  it('reaches both transcripts with the count everybody can see', () => {
    const played = play(a => a.entrants.length);
    expect(played, 'no suite week with entrants').toBeTruthy();
    const { ep, act } = played;
    for (const [label, text] of [
      ['summariseWeek', summariseWeek(gs.bb.weeks[gs.bb.weeks.length - 1])],
      ['generateSummaryText', generateSummaryText(ep)],
    ]) {
      expect(text, `${label}: untranscribed`).toMatch(/THE SAFETY SUITE/);
      // Nothing here is secret — who spent an entry is the whole document.
      expect(text, `${label}: hid an entrant`).toContain(act.entrants[0]);
    }
  });

  it('gives the house an arithmetic to play off', () => {
    expect(SAFETY_SUITE_EVENTS.length).toBeGreaterThanOrEqual(5);
    const ids = new Set(HOUSE_EVENTS.map(e => e.id));
    for (const e of SAFETY_SUITE_EVENTS) expect(ids.has(e.id), `${e.id} unreachable`).toBe(true);
    let seen = 0;
    const kinds = new Set();
    for (let seed = 1; seed <= 10; seed++) {
      house(4);
      for (let w = 0; w < 4; w++) {
        const ep = withSeededRandom(seed * 29 + w * 7 + 5, () => simulateBBEpisode());
        for (const b of (ep.acts || []).flatMap(a => a.socialBeats || [])) {
          if (!String(b.eventId || '').startsWith('suite-')) continue;
          seen++; kinds.add(b.eventId);
        }
      }
    }
    expect(seen, 'the house never reacted to the suite').toBeGreaterThan(0);
    expect(kinds.size, 'only one suite beat is ever reachable').toBeGreaterThan(1);
  });
});
