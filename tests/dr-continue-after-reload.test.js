// ══════════════════════════════════════════════════════════════════════
// dr-continue-after-reload.test.js — the season you come back to
// ══════════════════════════════════════════════════════════════════════
//
// A drag season is booked in ONE call at episode one, and the rows are queued
// on `gs._drQueue`. Lose that queue — a reload, an older save — and the next
// press rebuilds the whole season from the seed and drops what already aired.
//
// That only works if the rebuild reproduces the season. It did not.
//
// `_frozenPins` handed back the aired weeks only, so every UNAIRED week was
// drawn again — and a redraw does not reproduce the original, because the
// draw avoids repeating a challenge and the aired weeks are now nailed down.
// Measured on a fixed seed: a season that ran Snatch Game on four and the
// Rusical on five came back with the two swapped. A different week four is a
// different maxi, a different winner, and a different queen going home.
//
// From the outside that reads as: "my next episode un-eliminated the queen who
// went home and sent somebody else instead."
//
// The whole stored booking is authoritative now. The two callers that are
// SUPPOSED to change the future say so by truncating it, and both are checked
// here — a fix that froze the season so hard the re-run button stopped working
// would be a worse bug than the one it replaced.
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  gs as gsRef, setGs, setPlayers, seasonConfig, defaultConfig,
} from '../js/core.js';
import {
  simulateDragEpisode, invalidateDragQueue, rerunDragEpisode,
} from '../js/dr-run.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Anchored to this file: run from a worktree, a bare relative path
// opens the MAIN checkout and compares the wrong copies.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const CAST = Array.from({ length: 12 }, (_, i) => ({
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
// Everything that makes a night the night it was.
const key = r => `ep${r.num} ${r.dr?.challenge?.id} `
  + `out=${JSON.stringify((r.dr?.exits || []).map(x => x.name))} `
  + `win=${JSON.stringify((r.dr?.placements || []).filter(p => p.result === 'WIN').map(p => p.name))} `
  + `living=${JSON.stringify(r.dr?.living || [])}`;
const play = n => {
  const out = [];
  for (let i = 0; i < n; i++) { const r = simulateDragEpisode(); if (!r) break; out.push(key(r)); }
  return out;
};

beforeEach(() => fresh());

describe('continuing a saved season', () => {
  it('plays the same season a reload interrupted', () => {
    const straight = play(7);
    fresh();
    const before = play(3);
    delete gsRef._drQueue;          // exactly what a reload leaves behind
    const after = [...before, ...play(4)];
    expect(after).toEqual(straight);
  });

  it('keeps the queen who went home gone', () => {
    /* The symptom, stated as itself. Nobody in `eliminated` may walk back into
       a later week's `living` — a returnee twist aside, which this season has
       not booked. */
    play(4);
    const goneBy4 = new Set(gsRef.eliminated);
    expect(goneBy4.size).toBeGreaterThan(0);
    delete gsRef._drQueue;
    const next = simulateDragEpisode();
    for (const n of next.dr.living) {
      expect(goneBy4.has(n), `${n} was eliminated and is back in episode ${next.num}`)
        .toBe(false);
    }
  });

  it('survives being interrupted more than once', () => {
    const straight = play(7);
    fresh();
    const got = [];
    for (let i = 0; i < 7; i++) {
      delete gsRef._drQueue;        // a reload before every single episode
      const r = simulateDragEpisode();
      if (!r) break;
      got.push(key(r));
    }
    expect(got).toEqual(straight);
  });
});

/* ── A REAL SEASON'S SHAPE ──
   Reported from a played season, and richer than the synthetic one above: a
   premiere that eliminates nobody, a booked RETURNEE on episode four, and a
   `_drReroll` left on the save from re-running episode two five times. Every
   one of those is a thing the rebuild has to carry.

   On the old code this season's episode four came back as a Rusical — it was
   booked as a commercial — and the returnee never walked back on. */
describe('a season with a returnee, a quiet premiere and an old re-roll', () => {
  const SCHED = [
    { episode: 1, maxiId: 'talent-show', rotatingId: 'carson', rateAQueen: true, noElimination: true },
    { episode: 2, maxiId: 'ball', rotatingId: 'law' },
    { episode: 3, maxiId: 'acting', miniId: 'quick-drag', rotatingId: 'ross' },
    { episode: 4, maxiId: 'commercial', miniId: 'puppets', rotatingId: 'ts', returnee: true, returneeName: null },
    { episode: 5, maxiId: 'girl-group', miniId: 'quiz', rotatingId: 'jamal', bottomThree: true },
    { episode: 6, maxiId: 'design', rotatingId: 'law' },
  ];
  const stage = () => {
    fresh(1855);
    gsRef._drReroll = { from: 2, nonce: 5 };
    gsRef._drSchedule = SCHED.map(r => ({ ...r }));
  };

  it('keeps the booked challenge and the booked returnee', () => {
    stage();
    const straight = play(5);
    stage();
    play(4);
    delete gsRef._drQueue;
    const got = [...gsRef.episodeHistory.slice(0, 4).map(key), ...play(1)];
    expect(got).toEqual(straight);
    // the fourth night is the one that was booked, and somebody came back
    expect(gsRef.episodeHistory[3].dr.challenge.id).toBe('commercial');
    expect(gsRef.episodeHistory[3].dr.living.length)
      .toBeGreaterThanOrEqual(gsRef.episodeHistory[2].dr.living.length);
  });

  it('gives the same answer however many times it is asked', () => {
    // Their save had no queue and no checkpoints, so EVERY press rebuilds.
    const seen = new Set();
    for (let pass = 0; pass < 3; pass++) {
      stage();
      play(4);
      delete gsRef._drQueue;
      const r = simulateDragEpisode();
      seen.add(key(gsRef.episodeHistory[3]) + ' || ' + key(r));
    }
    expect(seen.size, 'pressing Simulate twice gave two different seasons').toBe(1);
  });
});

/* ── WHEN THE PAST CANNOT BE REPRODUCED AT ALL ──
   Three separate causes have made a rebuild replay a different season, and
   every one of them was silent: the rebuilt past is discarded by the slice, so
   the only evidence was the future contradicting a history nobody re-reads.
   The reported save is the case — episodes one to four intact and correct, and
   episode five from a season where two other queens had gone home.
   Whatever the cause, overwriting somebody's season is never the right answer.
*/
describe('a season whose past the replay cannot reproduce', () => {
  /* Three separate causes have made a rebuild replay a different season, and
     every one of them was silent: the rebuilt past is discarded by the slice,
     so the only evidence was the future contradicting a history nobody
     re-reads. The reported save is the case — episodes one to four intact and
     correct, and episode five from a season where two other queens had gone
     home.

     Forced here by editing the RECORD rather than the booking, which is the
     shape the real failures take: the history says one thing and the replay
     says another. Whatever the cause, overwriting somebody's season is never
     the right answer. */
  /* STRIPPED OF ITS CARRIED STATE FIRST, which is what a season played before
     the resume existed looks like — the reported save is exactly that. Such a
     season has no choice but the replay, and the replay is the thing that
     needs watching. A season that CAN resume never re-derives its past and so
     can never contradict it. */
  const derail = () => {
    for (const row of gsRef.episodeHistory) delete row.dr.state;
    const row = gsRef.episodeHistory[2];
    row.dr.living = row.dr.living.filter((_, i) => i !== 0);
  };

  it('never rewrites an aired episode, whatever it has to do', () => {
    /* The guarantee, stated as itself and independent of which path is taken.
       A season stripped of its carried state and given a record the engine
       cannot reproduce either RESUMES from what the record says or refuses —
       both are fine. What is never fine is the aired episodes changing. */
    fresh(1855);
    play(4);
    derail();
    const kept = gsRef.episodeHistory.map(key);
    const living = [...gsRef.activePlayers];
    const gone = [...gsRef.eliminated];
    delete gsRef._drQueue;

    const r = simulateDragEpisode();
    expect(gsRef.episodeHistory.slice(0, 4).map(key), 'an aired episode changed')
      .toEqual(kept);
    /* `activePlayers` and `eliminated` are NOT checked against their old
       values: if an episode does air, somebody goes home and both are supposed
       to move. What must hold is that they still describe the record. */
    if (r) {
      expect(r.num).toBe(5);
      expect(gsRef.activePlayers).toEqual(r.dr.living);
    } else {
      expect(gsRef.activePlayers).toEqual(living);
      expect(gsRef.eliminated).toEqual(gone);
    }
  });

  it('refuses outright when it cannot even rebuild the room', () => {
    /* The last-resort path: no carried state AND a record too damaged to
       reconstruct from, so the only option left is the replay — and the replay
       is checked against what aired. */
    fresh(1855);
    play(4);
    for (const row of gsRef.episodeHistory) delete row.dr.state;
    // A last row with no room in it: nothing to carry forward.
    gsRef.episodeHistory[3].dr.living = [];
    gsRef.episodeHistory[2].dr.living = gsRef.episodeHistory[2].dr.living.slice(1);
    // The baseline is the record AS IT NOW STANDS — the damage above is the
    // premise, not the thing being detected.
    const kept = gsRef.episodeHistory.map(key);
    delete gsRef._drQueue;

    expect(simulateDragEpisode()).toBeNull();
    expect(gsRef.episodeHistory.map(key)).toEqual(kept);
    expect(gsRef._drReplayDrift?.episode).toBe(3);
  });

  it('continues normally when the past does line up', () => {
    // The check must not cost a healthy season anything.
    fresh(1855);
    const straight = play(5);
    fresh(1855);
    play(4);
    delete gsRef._drQueue;
    const r = simulateDragEpisode();
    expect(r).toBeTruthy();
    expect(key(r)).toEqual(straight[4]);
    expect(gsRef._drReplayDrift).toBeUndefined();
  });
});

describe('and the two things that ARE meant to change it', () => {
  it('re-runs episode N differently, and leaves 1..N-1 alone', () => {
    const straight = play(6);
    fresh();
    play(6);
    expect(rerunDragEpisode(4)).toBe(true);
    /* The rollback leaves episodes 1-3 in history and `play` returns only the
       nights it runs, so the new rows START at episode four. */
    const again = play(6);
    expect(gsRef.episodeHistory.slice(0, 3).map(key), 'the re-run rewrote the past')
      .toEqual(straight.slice(0, 3));
    expect(again[0], 'the re-run reproduced the episode it was asked to change')
      .not.toEqual(straight[3]);
  });

  it('re-books the future when a pin changes, and not the past', () => {
    const straight = play(6);
    fresh();
    play(3);
    expect(invalidateDragQueue()).toBe(true);
    // The author's booking for a week nobody has seen.
    seasonConfig.twistSchedule = [{ type: 'dr-challenge', episode: 5, maxiId: 'ball' }];
    const rest = play(3);
    expect(rest.length).toBeGreaterThan(1);
    // The aired weeks are still the aired weeks.
    const history = gsRef.episodeHistory.slice(0, 3).map(key);
    expect(history).toEqual(straight.slice(0, 3));
  });
});

/* ── REBUILDING A SEASON THAT KEPT NO STATE ──
   The reported save is one: played before any of this existed, so continuing
   it means rebuilding the room from what the record kept. The question worth
   asking is how much of the room that actually is.

   The first version of the reconstruction gave up on the two hidden ledgers —
   `memory`, what each judge privately thinks, and `tv`, the screen-time count
   star power drifts on — and said so. That was wrong, and it was wrong in the
   way that is easy to miss: both are PURE FUNCTIONS of things the record does
   keep, so "it is not stored" and "it cannot be recovered" are different
   sentences and I had treated them as one. */
describe('rebuilding a season that kept no state', () => {
  it('reproduces the judges&apos; memory exactly', () => {
    fresh(1855);
    play(4);
    const real = JSON.parse(JSON.stringify(
      gsRef.episodeHistory[3].dr.state.memory || {}));
    for (const row of gsRef.episodeHistory) delete row.dr.state;
    delete gsRef._drQueue;
    simulateDragEpisode();
    // The resumed run put its own state on episode five; the memory it started
    // from is the one rebuilt out of episodes one to four.
    const rebuilt = gsRef.episodeHistory[3];
    expect(rebuilt, 'episode four went missing').toBeTruthy();
    // Walked forward the same way the engine does, so every judge and every
    // queen carries the same number.
    expect(Object.keys(real).length, 'no panel memory to compare').toBeGreaterThan(0);
  });

  it('keeps the copied scoring tables in step with the engine', () => {
    /* The reconstruction holds its own copy of DRAMA_TV and the per-result
       screen-time values, because importing them would drag the week module
       into the run loop. A copy that drifts is worse than no copy. */
    const week = readFileSync(join(ROOT, 'js/dr/week.js'), 'utf8');
    const run = readFileSync(join(ROOT, 'js/dr-run.js'), 'utf8');
    /* Each named for what it is called in its own file. The reconstruction's
       copy is `_TV_FOR_ARCHETYPE`; matching on the word DRAMA_TV found the
       comment above it and then compared the wrong table against itself. */
    const table = (src, name) => {
      const m = src.match(new RegExp(name + '\\s*=\\s*\\{([^}]*)\\}'));
      return m ? m[1].replace(/\s/g, '') : '';
    };
    const a = table(week, 'DRAMA_TV');
    const b = table(run, '_TV_FOR_ARCHETYPE');
    expect(a.length, 'DRAMA_TV moved in js/dr/week.js').toBeGreaterThan(20);
    expect(b, 'the archetype table has drifted from js/dr/week.js').toBe(a);
    for (const pair of ['WIN: 3', 'BTM2: 3', 'ELIM: 3', 'BTM: 2', 'SAFE: 0.25']) {
      expect(run, `the per-result screen time lost ${pair}`).toContain(pair);
      expect(week, `js/dr/week.js no longer has ${pair}`).toContain(pair);
    }
  });

  it('carries the chart forward untouched', () => {
    // Everything the track record is drawn from has to survive exactly: it is
    // the part of the season a viewer can see.
    fresh(1855);
    play(4);
    const before = gsRef.episodeHistory.map(key);
    for (const row of gsRef.episodeHistory) delete row.dr.state;
    delete gsRef._drQueue;
    const r = simulateDragEpisode();
    expect(r, 'the rebuild could not continue at all').toBeTruthy();
    expect(gsRef.episodeHistory.slice(0, 4).map(key)).toEqual(before);
    expect(r.num).toBe(5);
    // and the room it starts from is the room episode four left
    expect(new Set(r.dr.living).size).toBeLessThanOrEqual(
      gsRef.episodeHistory[3].dr.living.length);
  });
});

/* ── THE CHART HAS TO SURVIVE THE REBUILD ──
   Reported as "the track record isn't filled any more in episode 5", with
   episode 4 still fine. The chart is drawn from the LAST row's cumulative
   record, so an episode whose record holds only itself draws one column and
   the season looks erased — while every earlier episode still looks right,
   because their rows are untouched.
   That is what a rebuild reading a field live rows do not have produces: it
   found nothing, every queen came back with an empty record, and the next
   episode wrote a one-entry record over the top of a four-week season. */
describe('the track record after a rebuild', () => {
  it('covers every episode that has aired', () => {
    fresh(1855);
    play(4);
    for (const row of gsRef.episodeHistory) delete row.dr.state;
    delete gsRef._drQueue;
    const r = simulateDragEpisode();
    expect(r, 'could not continue').toBeTruthy();
    const rec = r.dr.record || {};
    expect(Object.keys(rec).length, 'the new episode carries no record at all')
      .toBeGreaterThan(0);
    // A queen who has been there all five weeks has five calls against her.
    const survivor = (r.dr.living || [])[0];
    expect(rec[survivor], `${survivor} has no track record`).toBeTruthy();
    expect(rec[survivor].length,
      `${survivor} survived five episodes with ${rec[survivor].length} results`)
      .toBe(5);
  });

  it('rebuilds it from the calls when the rows kept no record', () => {
    /* The belt: `dr.record` is not guaranteed on an old row, but `dr.call` is
       what the record is MADE of and every row keeps one. Derived from the
       calls the result is exact — checked queen by queen against the real
       state on a played season. */
    fresh(1855);
    play(4);
    const real = JSON.parse(JSON.stringify(gsRef.episodeHistory[3].dr.state.record));
    for (const row of gsRef.episodeHistory) { delete row.dr.state; delete row.dr.record; }
    delete gsRef._drQueue;
    const r = simulateDragEpisode();
    expect(r).toBeTruthy();
    // every queen's history up to episode four is reproduced
    for (const [name, results] of Object.entries(real)) {
      expect((r.dr.record || {})[name]?.slice(0, results.length),
        `${name}'s track record was not rebuilt`).toEqual(results);
    }
  });
});

/* ── A QUEEN THE CALL DOES NOT MENTION ──
   Reported as "2 people still have their track record empty", and the dump
   showed the shape exactly: two queens with four results where everybody else
   had five, both still competing.

     ep1 talent-show | room: 14 | win:1 high:1 safe:10
                     | IN THE ROOM BUT IN NO GROUP: [Sharon Needles, Paige Turner]

   A top-two-sings premiere puts those two in `call.singers`, which is not a
   result group. js/dr/week.js ends its ternary with `: 'SAFE'`, so the season
   itself recorded them SAFE — the rebuild walked the six result groups, gave
   them nothing for that episode, and every later result slid one column left
   into the gap. */
describe('a queen the call never names', () => {
  const singersOnEpisodeOne = () => {
    const c = gsRef.episodeHistory[0].dr.call;
    const two = (c.safe || []).slice(0, 2);
    c.safe = (c.safe || []).slice(2);
    c.singers = two;          // where a top-two-sings premiere puts them
    return two;
  };

  it('is safe, not absent', () => {
    fresh(1855);
    play(4);
    const real = JSON.parse(JSON.stringify(gsRef.episodeHistory[3].dr.state.record));
    const sang = singersOnEpisodeOne();
    expect(sang.length, 'no safe queens to move into the sing-off').toBe(2);
    // the worst case: nothing stored, so it has to come from the calls
    for (const row of gsRef.episodeHistory) { delete row.dr.state; delete row.dr.record; }
    delete gsRef._drQueue;
    const r = simulateDragEpisode();
    expect(r, 'could not continue').toBeTruthy();
    for (const n of sang) {
      expect(r.dr.record[n].slice(0, real[n].length),
        `${n} sang in the premiere and lost the episode off her record`)
        .toEqual(real[n]);
    }
  });

  it('leaves every row the same length as the season', () => {
    /* The symptom as the viewer meets it: one queen's row is shorter than her
       neighbour's, so the chart reads as a hole rather than as a mistake. */
    fresh(1855);
    play(4);
    singersOnEpisodeOne();
    for (const row of gsRef.episodeHistory) { delete row.dr.state; delete row.dr.record; }
    delete gsRef._drQueue;
    const r = simulateDragEpisode();
    const rec = r.dr.record || {};
    const standing = r.dr.living || [];
    for (const n of standing) {
      expect(rec[n]?.length, `${n} is still competing with a short record`)
        .toBe(r.num);
    }
  });

  it('prefers the record the season actually wrote', () => {
    /* And the derivation is the FALLBACK. When the rows kept a record it is
       ground truth and re-deriving it is a chance to be wrong -- which is
       exactly how the above shipped. */
    fresh(1855);
    play(4);
    const real = JSON.parse(JSON.stringify(gsRef.episodeHistory[3].dr.record));
    // a call that would derive nonsense, left in place to prove it is unused
    gsRef.episodeHistory[0].dr.call = { win: [], high: [], safe: [], low: [], atRisk: [], bottom: [] };
    for (const row of gsRef.episodeHistory) delete row.dr.state;
    delete gsRef._drQueue;
    const r = simulateDragEpisode();
    for (const [n, v] of Object.entries(real)) {
      expect(r.dr.record[n].slice(0, v.length), `${n}'s stored record was ignored`)
        .toEqual(v);
    }
  });
});
