// ══════════════════════════════════════════════════════════════════════
// dr-pin-survives-resume.test.js — the dropdown that saved and did nothing
// ══════════════════════════════════════════════════════════════════════
//
// "My new episode isn't being respected again with the dropdown challenge. I
// changed it in ep13 to Stand-Up but the result is always Talent Show."
//
// Not the timeline, and not the engine: both do exactly what they say. The
// booking was being thrown away in between.
//
// `playDragSeason` returns `schedule` — what it PLAYED. On a resume the aired
// weeks are spliced off the front before the loop runs, so that array holds
// only the weeks from the resume point on. `gs._drSchedule = out.schedule`
// then deleted the booking for every episode already watched, and from the
// first reload onwards:
//
//   dragScheduleRecorded()  -> false   (aired weeks missing from the record)
//   dragQueueEditable()     -> false
//   invalidateDragQueue()   -> false, and truncates NOTHING
//   _frozenPins()           -> still holds episode 13
//
// so the stored booking out-ranked the author's pin, for ever, silently. The
// dropdown saved. It went pink. The season ran the same challenge every time.
//
// `repairOldDragSeason` could have rebuilt the record from the rows, and
// refused to: it required `gs._drInitBonds`, which a save made before the
// snapshot existed does not have. That guard was written when continuing a
// season meant REPLAYING it, where the opening bonds matter. Continuing
// resumes now and never reads them.
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { gs as gsRef, setGs, setPlayers, seasonConfig, defaultConfig } from '../js/core.js';
import {
  simulateDragEpisode, invalidateDragQueue, dragScheduleRecorded, dragQueueEditable,
} from '../js/dr-run.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const CAST = Array.from({ length: 16 }, (_, i) => ({
  name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f', archetype: 'hero', age: 25,
  stats: Object.fromEntries(STATS.map(k => [k, 3 + ((i * 3) % 8)])),
  drag: {
    acting: 1 + (i % 9), comedy: 2 + ((i * 5) % 8), dance: 1 + ((i * 7) % 9),
    design: 3 + (i % 7), runway: 2 + ((i * 2) % 8), lipsync: 1 + ((i * 4) % 9),
    singing: 4 + (i % 6),
  },
}));

Object.defineProperty(globalThis, 'gs', {
  configurable: true, get: () => gsRef, set: v => setGs(v),
});
globalThis.window = globalThis.window || {};
afterAll(() => { delete globalThis.gs; });

function fresh(seed = 4242) {
  setPlayers(CAST.map(p => ({ ...p })));
  Object.assign(seasonConfig, defaultConfig(), { format: 'drag-race', seasonNumber: 1 });
  setGs({
    episodeHistory: [], activePlayers: CAST.map(p => p.name), eliminated: [],
    popularity: {}, episode: 0, bonds: {}, bondLean: {}, perceivedBonds: {},
    _drInitBonds: {}, _drInitLean: {}, _drSeed: seed,
  });
}
beforeEach(() => fresh());

/** What the timeline's maxi dropdown does. */
function pinMaxi(ep, maxiId) {
  seasonConfig.drSchedule = seasonConfig.drSchedule || [];
  let entry = seasonConfig.drSchedule.find(c => Number(c.episode) === ep);
  if (!entry) { entry = { episode: ep }; seasonConfig.drSchedule.push(entry); }
  entry.maxiId = maxiId;
  // run-ui only invalidates for a week that has not aired, which is the case
  // under test: the author is booking the episode she is about to simulate.
  return invalidateDragQueue();
}
const playTo = n => {
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = simulateDragEpisode();
    if (!r) break;
    out.push(r);
  }
  return out;
};
const epsIn = () => new Set((gsRef._drSchedule || []).map(r => Number(r.episode)));

/** A reload: the queue is gone, so the next press resumes. */
const reload = () => { delete gsRef._drQueue; };
/** A save made before the bond snapshot existed. */
const oldSave = () => { delete gsRef._drInitBonds; delete gsRef._drInitLean; };

describe('the booking survives being resumed', () => {
  it('keeps every aired week on the record', () => {
    playTo(10);
    const before = epsIn();
    expect(before.has(1), 'episode one was never recorded').toBe(true);
    reload();
    simulateDragEpisode();
    const after = epsIn();
    for (const ep of before) {
      expect(after.has(ep), `a resume deleted the booking for episode ${ep}`)
        .toBe(true);
    }
  });

  it('still says the season can be re-booked', () => {
    playTo(10);
    reload();
    simulateDragEpisode();
    expect(dragScheduleRecorded(), 'a resume made the season unbookable').toBe(true);
    expect(dragQueueEditable()).toBe(true);
  });
});

describe('a pin on the next episode, after a reload', () => {
  /* THE REPORT, RUN AS ITSELF. Three different challenges, so a pass cannot
     come from the season happening to book the one asked for. */
  for (const want of ['stand-up', 'ball', 'improv']) {
    it(`runs ${want} when ${want} is what was chosen`, () => {
      const aired = playTo(10).length;
      reload();
      simulateDragEpisode();          // the resume that used to lose the record
      reload();
      const next = aired + 2;
      expect(pinMaxi(next, want), 'the pin was refused').toBe(true);
      const r = simulateDragEpisode();
      expect(r, `episode ${next} did not run`).toBeTruthy();
      expect(Number(r.num)).toBe(next);
      expect(r.dr.challenge.id, `pinned ${want} and got ${r.dr.challenge.id}`)
        .toBe(want);
    });
  }

  it('works on a save made before the bond snapshot existed', () => {
    /* The shape that actually reached the report. `repairOldDragSeason`
       refused to rebuild the record without `_drInitBonds`, so the pin was a
       no-op and nothing on the screen said so. */
    const aired = playTo(10).length;
    reload();
    oldSave();
    simulateDragEpisode();
    reload();
    oldSave();
    const next = aired + 2;
    expect(dragQueueEditable(), 'an old save cannot be re-booked at all').toBe(true);
    expect(pinMaxi(next, 'stand-up')).toBe(true);
    const r = simulateDragEpisode();
    expect(r.dr.challenge.id).toBe('stand-up');
  });

  it('does not disturb a single week that already aired', () => {
    const before = playTo(10).map(r => `${r.num}:${r.dr.challenge.id}`);
    reload();
    simulateDragEpisode();
    reload();
    pinMaxi(12, 'stand-up');
    simulateDragEpisode();
    const after = (gsRef.episodeHistory || []).slice(0, 10)
      .map(r => `${r.num}:${r.dr.challenge.id}`);
    expect(after, 'a pin on a future week rewrote the past').toEqual(before);
  });
});
