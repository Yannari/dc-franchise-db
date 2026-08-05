// Camp Comeback (BB24) — evicted, and still at the breakfast table.
//
// The first four houseguests voted out do not leave. They cannot compete, vote
// or be nominated, but they live in the house with the people who evicted
// them, and when the fourth arrives all four play for one place back.
//
// The design rule this pins: a camper is genuinely EVICTED. They leave
// `gs.activePlayers` and stay out of it, so nothing about competitions,
// nominations, the veto, the vote or the jury has to know the twist exists.
// Their presence is carried entirely by a dedicated event family that casts
// from `gs.bb.camp` — because widening the house roster instead would let the
// general pool cast a camper as a voter or a nominee, which is a far worse bug
// than the one it solves.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, summariseWeek } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { BB_TWIST_CONTRACTS } from '../js/bb/twist-contract.js';
import { CAMP_SIZE, campers, isCamper } from '../js/bb/camp-comeback.js';
import { CAMP_EVENTS } from '../js/bb-events/camp-comeback.js';
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

function house(weeks = 6) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = Array.from({ length: weeks },
    (_, i) => ({ episode: i + 1, type: 'bb-camp-comeback' }));
}

/** Play until the camp fills and the door resolves. */
function playToDoor(seed) {
  house(6);
  const eps = [];
  for (let w = 0; w < 6; w++) {
    const ep = withSeededRandom(seed * 17 + w * 3, () => simulateBBEpisode());
    if (!ep) break;
    eps.push(ep);
    if ((ep.acts || []).some(a => a.type === 'camp-return')) break;
  }
  return eps;
}

describe('Camp Comeback', () => {
  beforeEach(() => house());

  it('is registered, and changes no week rules at all', () => {
    const c = BB_TWIST_CONTRACTS['bb-camp-comeback'];
    expect(c).toBeTruthy();
    // The whole safety argument: an eviction is still an eviction.
    expect(c.rules).toEqual({});
    expect(TWIST_CATALOG.some(t => t.id === 'bb-camp-comeback')).toBe(true);
    expect(CAMP_SIZE).toBe(4);
  });

  it('keeps a camper evicted — out of the roster, out of everything', () => {
    const eps = playToDoor(3);
    expect(eps.length).toBeGreaterThan(1);
    const camp = campers();
    // Somebody went to camp at all.
    const arrivals = eps.flatMap(e => (e.acts || []).filter(a => a.type === 'camp-comeback'));
    expect(arrivals.length, 'nobody ever went to camp').toBeGreaterThan(0);

    for (const name of camp) {
      expect(isCamper(name)).toBe(true);
      // Out of the roster, so they cannot compete, vote or be nominated.
      expect(gs.activePlayers, `${name} is a camper and still in the roster`)
        .not.toContain(name);
      expect(gs.eliminated, `${name} is a camper and not recorded as evicted`).toContain(name);
      // And never on a block or a ballot after arriving.
      for (const ep of eps) {
        expect(ep.finalNominees || [], `${name} was nominated while in camp`).not.toContain(name);
        const week = (gs.bb.weeks || []).find(w => w.num === ep.num);
        for (const b of week?.ballots || []) {
          expect(b.voter, `${name} voted while in camp`).not.toBe(name);
        }
      }
    }
  });

  it('opens the door once camp is full, and only one comes back', () => {
    let door = null;
    let eps = [];
    for (let seed = 1; seed <= 8 && !door; seed++) {
      eps = playToDoor(seed);
      door = eps.flatMap(e => (e.acts || []).filter(a => a.type === 'camp-return'))[0] || null;
    }
    expect(door, 'the camp never filled in eight seasons').toBeTruthy();
    expect(door.played).toHaveLength(CAMP_SIZE);
    expect(door.gone).toHaveLength(CAMP_SIZE - 1);
    expect(door.played).toContain(door.winner);
    expect(door.gone).not.toContain(door.winner);
    // The winner is genuinely back: in the roster, off the eliminated list.
    expect(gs.activePlayers, 'the returnee never rejoined').toContain(door.winner);
    expect(gs.eliminated).not.toContain(door.winner);
    // And the losers are gone for good — no longer campers.
    for (const n of door.gone) {
      expect(isCamper(n), `${n} lost the door and is still in camp`).toBe(false);
      expect(gs.activePlayers).not.toContain(n);
    }
  });

  it('never sends a fifth houseguest to a full camp', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const eps = playToDoor(seed);
      for (const ep of eps) {
        for (const a of (ep.acts || []).filter(x => x.type === 'camp-comeback')) {
          expect(a.camp.length, 'camp overflowed').toBeLessThanOrEqual(CAMP_SIZE);
        }
      }
    }
  });

  it('reaches both transcripts', () => {
    const eps = playToDoor(3);
    const ep = eps.find(e => (e.acts || []).some(a => a.type === 'camp-comeback'));
    expect(ep, 'no camp week').toBeTruthy();
    const act = (ep.acts || []).find(a => a.type === 'camp-comeback');
    const week = (gs.bb.weeks || []).find(w => w.num === ep.num);
    for (const [label, text] of [
      ['summariseWeek', summariseWeek(week)],
      ['generateSummaryText', generateSummaryText(ep)],
    ]) {
      expect(text, `${label}: untranscribed`).toMatch(/CAMP COMEBACK/);
      expect(text, `${label}: never named the arrival`).toContain(act.arrival);
    }
  });

  it('gives the campers a voice of their own', () => {
    expect(CAMP_EVENTS.length).toBeGreaterThanOrEqual(4);
    const ids = new Set(HOUSE_EVENTS.map(e => e.id));
    for (const e of CAMP_EVENTS) expect(ids.has(e.id), `${e.id} unreachable`).toBe(true);
    let seen = 0;
    for (let seed = 1; seed <= 6; seed++) {
      const eps = playToDoor(seed);
      for (const ep of eps) {
        for (const b of (ep.acts || []).flatMap(a => a.socialBeats || [])) {
          if (String(b.eventId || '').startsWith('camp-')) seen++;
        }
      }
    }
    expect(seen, 'the campers never said anything').toBeGreaterThan(0);
  });
});
