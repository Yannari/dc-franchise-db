// The whole Big Brother event library, tested as a library.
//
// The per-category files test their own events; this covers the properties that
// only exist across all of them at once — that nothing is dead, that no
// category has quietly taken over the house, and that every event still
// satisfies the scheduler contract no matter which act it lands in.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { simulateBBSeason, simulateBBWeek } from '../js/bb/week.js';
import { scheduleHouseBeats, houseEventState } from '../js/bb/house-events.js';
import {
  HOUSE_EVENTS, HOUSE_EVENTS_BY_CATEGORY, houseEventsFor, assertUniqueEventIds,
} from '../js/bb-events/index.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = seed => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((seed * 7 + i * 3) % 10)]));

const CAST = [
  ['A', 'mastermind', 'm'], ['B', 'social-butterfly', 'f'], ['C', 'challenge-beast', 'm'],
  ['D', 'schemer', 'f'], ['E', 'hero', 'm'], ['F', 'floater', 'f'],
  ['G', 'villain', 'm'], ['H', 'loyal-soldier', 'f'], ['I', 'underdog', 'm'],
  ['J', 'goat', 'f'], ['K', 'hothead', 'm'], ['L', 'perceptive-player', 'f'],
  ['M', 'wildcard', 'm'], ['N', 'chaos-agent', 'f'],
].map(([name, archetype, gender], i) =>
  ({ name, archetype, gender, sexuality: 'straight', stats: spread(i + 1) }));
const HOUSE = CAST.map(p => p.name);

const seededRng = (seed = 5) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

function reset() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.popularity = {};
  gs.showmances = [];
  gs.romanticSparks = [];
  seasonConfig.romance = 'enabled';
  seasonConfig.finaleSize = 3;
}

const ACTS = ['hoh', 'nominations', 'veto', 'veto-ceremony', 'campaign'];
const ctxFor = (act, extra = {}) => ({
  act, beat: 0, hoh: 'A', nominees: ['B', 'C'], vetoWinner: 'D',
  week: { num: 3, plan: { target: 'B', pawn: 'C', backdoorTarget: null },
    initialNominees: ['B', 'C'], finalNominees: ['B', 'C'], houseAtStart: HOUSE },
  ...extra,
});

function playSeasons(seeds) {
  const fired = {};
  // Two seeds run their SECOND week as an Invisible HOH, the way a real
  // season schedules one — the invisible-* family exists only on sealed
  // weeks, and a sweep that never seals one reports six live events as dead.
  const invisibleSeasons = new Set([44, 88]);
  // And two run a Battle of the Block, for the same reason: the two-crown
  // events exist only on a week with two Heads of Household, and a sweep that
  // never seats a second one reports live events as dead.
  const botbSeasons = new Set([23, 37, 71, 129, 151, 178]);
  // And the two anonymous-authority twists, for exactly the same reason: the
  // hacker-* and roadkill-* families only exist on a week where somebody is
  // secretly rewriting the block, and a sweep that never schedules one reports
  // thirteen live events as dead. Two weeks each, because the hacker's
  // aftermath events (a cancelled vote being noticed, the silenced houseguest
  // deciding whether to say so) fire the week AFTER the hack.
  const hackerSeasons = new Set([44, 88, 23, 129]);
  const roadkillSeasons = new Set([37, 71, 151, 178]);
  // Pandora's Box needs two consecutive weeks for the same reason the hacker
  // does: half its family is the week AFTER, when the house is still doing the
  // arithmetic on a locked backyard.
  const pandoraSeasons = new Set([23, 37, 129, 151]);
  // The Den, two weeks apiece — half its family is the aftermath, and the
  // wariness it leaves behind fires the week after the curse lands.
  const denSeasons = new Set([44, 71, 178, 88]);
  // And the Whacktivity, two weeks apiece — the suspicion it plants outlives
  // the night the doors opened.
  const whackSeasons = new Set([23, 129, 151, 909]);
  for (const seed of seeds) {
    reset();
    const rng = seededRng(seed);
    const weeks = [];
    let n = 0;
    while ((gs.activePlayers || []).length > 3) {
      const week = ++n;
      const extra = invisibleSeasons.has(seed) && week === 2 ? ['bb-invisible-hoh']
        : botbSeasons.has(seed) && week === 2 ? ['bb-battle-of-the-block']
          : hackerSeasons.has(seed) && (week === 3 || week === 4) ? ['bb-hacker']
            : roadkillSeasons.has(seed) && week === 3 ? ['bb-roadkill']
              : pandoraSeasons.has(seed) && (week === 5 || week === 6) ? ['bb-pandoras-box']
                : denSeasons.has(seed) && (week === 5 || week === 6) ? ['bb-den-of-temptation']
                  : whackSeasons.has(seed) && (week === 3 || week === 4) ? ['bb-whacktivity'] : [];
      weeks.push(simulateBBWeek({
        rng, houseEvents: HOUSE_EVENTS, competitions: BB_COMPETITIONS,
        // Have-nots on, because a normal season has them: the default season
        // mode runs slop every week. Without the twist there are no have-nots,
        // so the events about being one correctly cannot fire — and a sweep
        // for dead code that plays an unrepresentative season reports live
        // events as dead.
        twists: ['bb-have-nots', ...extra],
      }));
    }
    for (const act of weeks.flatMap(w => w.acts || [])) {
      for (const b of act.socialBeats || []) fired[b.eventId] = (fired[b.eventId] || 0) + 1;
    }
  }
  return fired;
}

describe('the Big Brother event library as a whole', () => {
  beforeEach(reset);

  it('has five categories and no duplicate ids', () => {
    expect(Object.keys(HOUSE_EVENTS_BY_CATEGORY).sort())
      .toEqual(['ceremonies', 'deals', 'house-life', 'phases', 'social']);
    expect(assertUniqueEventIds()).toBe(true);
    expect(HOUSE_EVENTS.length).toBeGreaterThanOrEqual(45);
    // Each event's declared category must match the bucket it is filed under.
    for (const [cat, list] of Object.entries(HOUSE_EVENTS_BY_CATEGORY)) {
      for (const e of list) expect(e.category, `${e.id} filed under ${cat}`).toBe(cat);
    }
  });

  it('can hand back one category at a time', () => {
    expect(houseEventsFor('deals')).toEqual(HOUSE_EVENTS_BY_CATEGORY.deals);
    expect(houseEventsFor()).toEqual(HOUSE_EVENTS);
    expect(houseEventsFor('nonsense')).toEqual([]);
  });

  // The recurring bug in this project: written, registered, and still unreachable.
  //
  // One documented exception. The kiss trap borrows Total Drama's generator,
  // which needs four things at once: a live showmance, a willing schemer who
  // is romantically plausible with the HIGHER-mental partner specifically, and
  // an accomplice who both trusts the schemer and is socially capable. It
  // fires correctly when they align — covered directly below — but across
  // twenty seeded seasons they never did, even with the event weighted to win
  // any draw it is eligible for. Loosening this side further would only make
  // it fire into a generator that then refuses it, which produces a beat
  // saying nothing happened. Left rare and honest rather than faked.
  //
  // power-veto-fallout needs three unlikely things in the same week: somebody
  // who is neither nominated nor Head of Household has to win the veto, and
  // then spend it, and spend it on a third person. Measured at eight weeks in
  // forty seasons. It is reachable and it does fire — raising its weight to
  // saturation moved it from three to five, and teaching shouldUseVeto to
  // honour the week's veto promises moved it to eight, which is the real
  // mechanism rather than a thumb on the scale. What is left is the event being
  // genuinely rare, and ten seasons is not a large enough sample to insist on
  // seeing it. Faking the rest would mean weighting a scene into weeks it did
  // not happen in.
  // veto-backdoor-lands is a conjunction: a backdoor planned, the veto used,
  // and the target kept out of the draw — about 60% of planned backdoors
  // complete, and a ten-seed window can legitimately catch none. The
  // correctness suites (green-light, changes-something) still cover it.
  // showmance-separate-campaigns needs a showmance whose two halves end up
  // campaigning on opposite sides, which is a conjunction of a pairing, a
  // nomination and a split. Measured directly over 60 seasons: it fires in 8
  // of them, about 13%. At that rate a 16-seed window misses it by luck alone
  // roughly one run in ten, so it failed the first time an unrelated rng shift
  // (a competition's slot eligibility) reshuffled the draws. Rare, not dead.
  const ULTRA_RARE = new Set(['scheme-kiss-trap', 'power-veto-fallout', 'veto-backdoor-lands',
    'showmance-separate-campaigns']);

  it('fires every event in real seasons — no dead code', () => {
    // Forty-seven events compete for a finite number of beats, so a rare one
    // needs a real sample before its absence means anything.
    // Ten seasons rather than twenty: a week produces roughly 105 beats now
    // against the ~18 it did when this sweep was written, so this sample is
    // several times larger than the original in the thing that matters.
    // Sixteen seasons, not ten. The catalog now carries a tail of events whose
    // preconditions occur a handful of times per season (a refusal spreading,
    // a pair split, a backdoor near-miss); with ten seeds every weight change
    // reshuffled the scheduler's draws and a different alive-but-marginal
    // event fell out of the window each time. More samples, not more weight.
    const fired = playSeasons([11, 23, 37, 44, 58, 63, 71, 88, 95, 102, 117, 129, 140, 151, 163, 178]);
    // The invisible family only exists on the sweep's two sealed weeks, so
    // demanding every one of its six events appear there is a coin flip that
    // re-rolls with any rng change — the arena games taught this lesson.
    // The family is asserted collectively; per-event reachability lives in
    // the Invisible HOH suite's dedicated sealed-week runs.
    const invisibleFamily = new Set(HOUSE_EVENTS.map(e => e.id).filter(id => id.startsWith('invisible-')));
    // Same treatment, same reason: the hacker's and Roadkill's families are
    // gated on a twist week AND on what the holder chose to do with it — an
    // unused authority produces no crime scene to react to. Asserted
    // collectively; per-event reachability lives in their own suites.
    const hackerFamily = new Set(HOUSE_EVENTS.map(e => e.id).filter(id => id.startsWith('hacker-')));
    const roadkillFamily = new Set(HOUSE_EVENTS.map(e => e.id).filter(id => id.startsWith('roadkill-')));
    const pandoraFamily = new Set(HOUSE_EVENTS.map(e => e.id).filter(id => id.startsWith('pandora-')));
    // The split family is unreachable from THIS harness by construction, not
    // by accident: a split week is assembled in bb-run's simulateBBEpisode,
    // which crowns two Heads of Household and runs the week engine twice over
    // disjoint rosters. This sweep calls simulateBBWeek directly, so no amount
    // of scheduling here produces a side for them to fire on. Their
    // reachability lives in tests/bb-split-events.test.js, which plays real
    // episodes.
    const splitFamily = new Set(HOUSE_EVENTS.map(e => e.id).filter(id => id.startsWith('split-')));
    const denFamily = new Set(HOUSE_EVENTS.map(e => e.id).filter(id => id.startsWith('temptation-')));
    const whackFamily = new Set(HOUSE_EVENTS.map(e => e.id).filter(id => id.startsWith('whack-')));
    const never = HOUSE_EVENTS.map(e => e.id)
      .filter(id => !fired[id] && !ULTRA_RARE.has(id) && !invisibleFamily.has(id)
        && !hackerFamily.has(id) && !roadkillFamily.has(id) && !pandoraFamily.has(id)
        && !splitFamily.has(id) && !denFamily.has(id) && !whackFamily.has(id));
    expect(never, `never fire in a real season: ${never.join(', ')}`).toEqual([]);
    const invisibleSeen = [...invisibleFamily].filter(id => fired[id]).length;
    expect(invisibleSeen, 'the sealed weeks stayed silent — check the invisible family gating')
      .toBeGreaterThanOrEqual(Math.min(invisibleFamily.size, 4));
    const hackerSeen = [...hackerFamily].filter(id => fired[id]).length;
    expect(hackerSeen, 'the hacked weeks stayed silent — check the hacker family gating')
      .toBeGreaterThanOrEqual(Math.min(hackerFamily.size, 4));
    const roadkillSeen = [...roadkillFamily].filter(id => fired[id]).length;
    expect(roadkillSeen, 'the roadkill weeks stayed silent — check the roadkill family gating')
      .toBeGreaterThanOrEqual(Math.min(roadkillFamily.size, 2));
    const pandoraSeen = [...pandoraFamily].filter(id => fired[id]).length;
    expect(pandoraSeen, 'the box weeks stayed silent — check the pandora family gating')
      .toBeGreaterThanOrEqual(Math.min(pandoraFamily.size, 4));
    const denSeen = [...denFamily].filter(id => fired[id]).length;
    expect(denSeen, 'the Den weeks stayed silent — check the temptation family gating')
      .toBeGreaterThanOrEqual(Math.min(denFamily.size, 4));
    const whackSeen = [...whackFamily].filter(id => fired[id]).length;
    expect(whackSeen, 'the door weeks stayed silent — check the whacktivity family gating')
      .toBeGreaterThanOrEqual(Math.min(whackFamily.size, 4));
  }, 240000);

  // Measured in counts, not shares. A stretch of house life now runs 22-30
  // beats against a ceremony act's 1-3, so ceremonies are a small SHARE of all
  // beats by design — that says nothing about whether they are being heard.
  // What matters is that every category actually speaks and none drowns the
  // rest out.
  it('keeps any one category from taking over the house', () => {
    const fired = playSeasons([11, 23, 37, 44, 58]);
    const total = Object.values(fired).reduce((a, b) => a + b, 0);
    for (const [cat, list] of Object.entries(HOUSE_EVENTS_BY_CATEGORY)) {
      const count = list.reduce((s, e) => s + (fired[e.id] || 0), 0);
      expect(count, `${cat} is silent`).toBeGreaterThan(20);
      expect(count / total, `${cat} dominates the house`).toBeLessThan(0.6);
    }
  });

  // Every event, in every act, at several house sizes: weight() saying yes must
  // always mean fire() can produce a renderable beat. A mismatch throws inside
  // the scheduler and takes the whole season with it.
  it('never green-lights an event it cannot narrate', () => {
    for (const event of HOUSE_EVENTS) {
      for (const act of ACTS) {
        for (const size of [4, 6, 9, 14]) {
          reset();
          const house = HOUSE.slice(0, size);
          const ctx = ctxFor(act, { nominees: house.slice(1, 3) });
          if (event.weight(house, ctx) <= 0) continue;
          expect(() => scheduleHouseBeats([event], house, ctx, { rng: seededRng(), min: 1, max: 1 }),
            `${event.id} in ${act} with ${size}`).not.toThrow();
        }
      }
    }
  });

  it('changes something every time it fires', () => {
    for (const event of HOUSE_EVENTS) {
      reset();
      const ctx = ctxFor(event.category === 'ceremonies' ? 'nominations' : 'hoh');
      if (event.weight(HOUSE, ctx) <= 0) continue;
      const snap = () => JSON.stringify({
        b: gs.bonds, p: gs.popularity, h: houseEventState(),
        m: gs.strategicMemories, i: gs.intentions, s: gs.romanticSparks,
      });
      const before = snap();
      scheduleHouseBeats([event], HOUSE, ctx, { rng: seededRng(), min: 1, max: 1 });
      expect(snap(), `${event.id} fired without changing anything`).not.toBe(before);
    }
  });

  it('gives a week enough to say without repeating itself inside an act', () => {
    reset();
    const { weeks } = simulateBBSeason({
      rng: seededRng(31), finaleSize: 3,
      houseEvents: HOUSE_EVENTS, competitions: BB_COMPETITIONS,
    });
    const perWeek = weeks.map(w => (w.acts || []).flatMap(a => a.socialBeats || []).length);
    const average = perWeek.reduce((a, b) => a + b, 0) / perWeek.length;
    // A house has to look lived in: this is the difference between a week you
    // read and a week you skim past.
    expect(average).toBeGreaterThan(60);
    // Fresh events are exhausted before any event is heard twice, and nothing
    // is ever heard a third time in one act. A stretch can be asked for more
    // beats than there are eligible events, so a second airing is allowed —
    // but only once the new ones have run out.
    for (const act of weeks.flatMap(w => w.acts || [])) {
      // Lifecycle beats (alliance formed/betrayed/repaired/collapsed, romance,
      // upkeep, campaign pitches) are attached directly by the week, one per
      // real event, rather than drawn by the scheduler — three betrayals in a
      // week is three beats and that is correct, and so is one pitch per
      // nominee per voter worked.
      const ids = (act.socialBeats || [])
        .map(b => b.eventId)
        .filter(id => !/^(alliance|romance|upkeep|campaign)-/.test(String(id || '')));
      const counts = {};
      ids.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
      for (const [id, n] of Object.entries(counts)) {
        expect(n, `${id} aired ${n} times in one act`).toBeLessThanOrEqual(2);
      }
      // Repeats only appear in the long stretches that outrun the pool.
      if (ids.length <= 10) expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('replays a season identically for the same seed', () => {
    const textOf = () => {
      reset();
      const { weeks } = simulateBBSeason({
        rng: seededRng(77), finaleSize: 3,
        houseEvents: HOUSE_EVENTS, competitions: BB_COMPETITIONS,
      });
      return weeks.flatMap(w => (w.acts || []).flatMap(a => (a.socialBeats || []).map(b => b.text)));
    };
    expect(textOf()).toEqual(textOf());
  });
});
