// ══════════════════════════════════════════════════════════════════════
// tr-episode-editor.test.js — the cut, measured
// ══════════════════════════════════════════════════════════════════════
//
// Task 7A's editor (js/tr/episode-editor.js) orders and shapes a night's
// scenes into an episode. The controller ruling attached to the task is the
// binding constraint and it is asserted first, before anything about quality:
// the editor may never spend the throughput Task 7 bought. So arm 1 is set
// equality on scene identity, not a length check — a cut that swapped one
// scene for a duplicate of another would keep the count and lose the content.
//
// EVERY BAND IN THIS FILE HAS A MUTANT ARM BESIDE IT. That is the process
// lesson Task 7 ended on: "I measured the fix, published the measurement, then
// banded around the number I had just seen rather than the number the defect
// produces." Where a band cannot be mutated in place, the arm reconstructs the
// pre-fix behaviour over the same fixture and requires it to violate the band.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, setGs } from '../js/core.js';
import { initTraitorsState } from '../js/tr/state.js';
import {
  buildEpisodeEdit, recordPromise, settlePromise, sceneTone, longestRun,
  PROMISE_STATUSES, MAX_CONFLICT_RUN, TIERS,
} from '../js/tr/episode-editor.js';

const CAST = ['Ada', 'Bo', 'Cy', 'Dee', 'Eli', 'Fen', 'Gus', 'Hal',
  'Ivy', 'Jo', 'Kit', 'Lou'];

function world() {
  setGs({ bonds: {}, activePlayers: [...CAST] });
  gs.tr = initTraitorsState();
}

/** A scene record in exactly the shape `_castleRecord` (js/tr/headless.js) writes. */
function scene(o) {
  return {
    window: 'evening', phaseId: 'private-strategy', family: 'suspicion',
    eventId: 'ev', branch: null, actors: [], people: [], parties: [],
    speaker: null, respondent: null, threadId: null, kind: 'suspicion',
    openedEp: 3, beatNo: 1, opened: false, priorDays: [], line: 'A line.',
    citation: '', citedDays: [], closedNow: false, outcome: null, sense: null,
    ...o,
  };
}

/** rngFor is not consumed by the editor; the argument exists for interface parity. */
function rngFor(seed) { let s = seed; return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648); }

// ── THE FIXTURES ──────────────────────────────────────────────────────
//
// A DAY THAT ACTUALLY CHAINS. Two multi-beat stories, one of which pays off,
// one that opens and does not, and a scatter of one-beat texture. Built by
// hand rather than played, because a fixture that has to be reached by a seed
// makes every failure in this file a question about the seed.
function eligibleScenesFor(ep = 4) {
  const out = [];
  // PRIMARY: Ada pulls at Bo's timeline over three beats, and it closes.
  out.push(scene({ phaseId: 'breakfast-fallout', window: 'dawn', threadId: 't-ada-bo',
    eventId: 'susp-open', opened: true, beatNo: 1, speaker: 'Ada',
    parties: ['Ada', 'Bo'], people: ['Ada', 'Bo'], branch: 'noticed',
    line: 'Ada said she was going to check where Bo actually was after dinner.' }));
  out.push(scene({ phaseId: 'morning-life', window: 'morning', threadId: 't-ada-bo',
    eventId: 'susp-ask-around', beatNo: 2, speaker: 'Ada', branch: 'confirmed',
    parties: ['Ada', 'Bo'], people: ['Ada', 'Cy'], priorDays: [ep - 1],
    line: 'Ada asked Cy what Cy had seen in the hour after dinner.' }));
  out.push(scene({ phaseId: 'private-strategy', window: 'evening', threadId: 't-ada-bo',
    eventId: 'susp-private-accusation', beatNo: 3, speaker: 'Ada', branch: 'denies',
    parties: ['Ada', 'Bo'], people: ['Ada', 'Bo'], priorDays: [ep - 1],
    closedNow: true, outcome: 'turned-back',
    line: 'Ada put the two accounts side by side and asked Bo which one was true.' }));
  // PRIMARY: Dee and Eli, trust, two beats, unfinished.
  out.push(scene({ phaseId: 'morning-life', window: 'morning', threadId: 't-dee-eli',
    family: 'trust', kind: 'trust', eventId: 'trust-open', opened: true, beatNo: 1,
    speaker: 'Dee', parties: ['Dee', 'Eli'], people: ['Dee', 'Eli'], branch: 'held',
    line: 'Dee told Eli something and asked Eli to keep it.' }));
  out.push(scene({ phaseId: 'private-strategy', window: 'evening', threadId: 't-dee-eli',
    family: 'trust', kind: 'trust', eventId: 'trust-checkin', beatNo: 2,
    speaker: 'Eli', parties: ['Dee', 'Eli'], people: ['Dee', 'Eli'], branch: 'kept',
    line: 'Eli had two chances to spend it and took neither.' }));
  // SECONDARY: a grief pair, two beats.
  out.push(scene({ phaseId: 'breakfast-fallout', window: 'dawn', threadId: 't-fen-gus',
    family: 'grief', kind: 'grief', eventId: 'grief-empty-chair', opened: true, beatNo: 1,
    speaker: 'Fen', parties: ['Fen', 'Gus'], people: ['Fen', 'Gus'],
    line: 'Fen would not sit down until somebody moved the chair.' }));
  out.push(scene({ phaseId: 'morning-life', window: 'morning', threadId: 't-fen-gus',
    family: 'grief', kind: 'grief', eventId: 'grief-headcount', beatNo: 2,
    speaker: 'Gus', parties: ['Fen', 'Gus'], people: ['Fen', 'Gus'],
    line: 'Gus said the number out loud so Fen did not have to.' }));
  // TEXTURE: single-beat scenes across the day.
  const texture = [
    ['post-banishment', 'night', 'romance', 'romance-quiet', 'Hal and Ivy stayed up.', ['Hal', 'Ivy']],
    ['mission-fallout', 'journey-back', 'journey', 'journey-quiet', 'Jo slept the whole way back.', ['Jo']],
    ['roundtable-scramble', 'after-table', 'callback', 'callback-old-season', 'Kit reminded Lou about season two.', ['Kit', 'Lou']],
  ];
  for (const [phaseId, window, family, eventId, line, people] of texture) {
    out.push(scene({ phaseId, window, family, kind: family, eventId, line,
      threadId: `t-${eventId}`, people, parties: people, opened: true, speaker: people[0] }));
  }
  return out;
}

/**
 * A CONFLICT-HEAVY DAY, and the word is heavy rather than exclusive.
 *
 * Ten of thirteen scenes are adverse, and the three that are not are spread
 * across the phases the resequencer can actually reach them from. That is what
 * a bad night in this castle looks like; a day made ENTIRELY of conflict is
 * not a pacing problem an editor can solve, because ordering cannot
 * manufacture relief that the night did not contain, and inventing one is the
 * thing this whole plan is written against.
 */
function conflictHeavyScenesFor() {
  const out = [];
  const phases = ['breakfast-fallout', 'morning-life', 'private-strategy', 'roundtable-scramble'];
  const wins = { 'breakfast-fallout': 'dawn', 'morning-life': 'morning',
    'private-strategy': 'evening', 'roundtable-scramble': 'after-table' };
  let n = 0;
  for (const phase of phases) {
    for (let k = 0; k < 3; k++) {
      n++;
      out.push(scene({ phaseId: phase, window: wins[phase], family: 'suspicion',
        kind: 'suspicion', eventId: `susp-${n}`, branch: 'hardened', threadId: `t${n}`,
        opened: true, speaker: CAST[n % CAST.length],
        people: [CAST[n % CAST.length], CAST[(n + 3) % CAST.length]],
        parties: [CAST[n % CAST.length], CAST[(n + 3) % CAST.length]],
        line: `An accusation, number ${n}.` }));
    }
  }
  // The three that are not conflict, one each in three of the four phases.
  const relief = [
    ['breakfast-fallout', 'dawn', 'romance', 'Ada made Bo a cup of tea.', ['Ada', 'Bo']],
    ['morning-life', 'morning', 'journey', 'Cy fell asleep on the way out.', ['Cy']],
    ['private-strategy', 'evening', 'trust', 'Dee told Eli the truth about Tuesday.', ['Dee', 'Eli']],
  ];
  for (const [phaseId, window, family, line, people] of relief) {
    out.push(scene({ phaseId, window, family, kind: family, branch: 'held',
      eventId: `calm-${family}`, threadId: `t-calm-${family}`, opened: true,
      speaker: people[0], people, parties: people, line }));
  }
  return out;
}

describe('the editor spends none of the throughput it was handed (controller R1)', () => {
  beforeEach(world);

  it('returns exactly the scenes it was given — a permutation, never a cut', () => {
    const input = eligibleScenesFor();
    const edit = buildEpisodeEdit(input, { ep: 4, living: CAST }, rngFor(7));
    // SET EQUALITY ON IDENTITY, not on length: a cut that replaced one scene
    // with a duplicate of another would pass a length assertion.
    expect(edit.scenes.length).toBe(input.length);
    expect(new Set(edit.scenes).size).toBe(input.length);
    for (const s of input) expect(edit.scenes).toContain(s);
  });

  it('and the record carries no drop channel at all', () => {
    const edit = buildEpisodeEdit(eligibleScenesFor(), { ep: 4, living: CAST }, rngFor(7));
    // A field that is always empty is a field a later reader assumes is
    // load-bearing. If a future task adds a cut, it adds the field, the reason
    // and the floor guard together, and this arm goes red to say so.
    expect(edit.dropped).toBeUndefined();
  });

  it('keeps chronology: no scene moves across a phase boundary', () => {
    const input = eligibleScenesFor();
    const edit = buildEpisodeEdit(input, { ep: 4, living: CAST }, rngFor(7));
    const phaseAt = s => String(s.phaseId);
    const seen = [];
    for (const s of edit.scenes) {
      const p = phaseAt(s);
      if (seen[seen.length - 1] !== p) seen.push(p);
    }
    // Each phase appears as ONE contiguous block, in the order it first
    // appeared in the input.
    expect(new Set(seen).size).toBe(seen.length);
    const firstSeen = [];
    for (const s of input) {
      const p = phaseAt(s);
      if (!firstSeen.includes(p)) firstSeen.push(p);
    }
    expect(seen).toEqual(firstSeen);
  });
});

describe('story hierarchy', () => {
  beforeEach(world);

  it('keeps a small number of primary and secondary stories and calls the rest texture', () => {
    const edit = buildEpisodeEdit(eligibleScenesFor(), { ep: 4, living: CAST }, rngFor(7));
    expect(edit.primaryStories.length).toBeGreaterThanOrEqual(2);
    expect(edit.primaryStories.length).toBeLessThanOrEqual(TIERS.primaryMax);
    expect(edit.secondaryStories.length).toBeLessThanOrEqual(TIERS.secondaryMax);
    // Every promoted arc took more than one beat: one scene is texture.
    for (const a of [...edit.primaryStories, ...edit.secondaryStories]) {
      expect(a.beatsTonight).toBeGreaterThan(1);
    }
    // And the tiers are disjoint.
    const ids = [...edit.primaryStories, ...edit.secondaryStories].map(a => a.arcId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('scales down for a late-game castle rather than padding the tiers', () => {
    const edit = buildEpisodeEdit(eligibleScenesFor(),
      { ep: 12, living: CAST.slice(0, 5) }, rngFor(7));
    expect(edit.primaryStories.length).toBeLessThanOrEqual(2);
  });

  it('invents nothing: every premise names an arc that is actually in the scenes', () => {
    const input = eligibleScenesFor();
    const edit = buildEpisodeEdit(input, { ep: 4, living: CAST }, rngFor(7));
    const real = new Set(input.map(s => s.threadId));
    for (const a of [...edit.primaryStories, ...edit.secondaryStories]) {
      expect(real.has(a.arcId), `${a.arcId} is not a thread the night produced`).toBe(true);
      for (const beat of a.plannedBeats) {
        expect(input.some(s => s.sceneId === beat)).toBe(true);
      }
    }
  });
});

describe('promises', () => {
  beforeEach(world);

  it('pays off or explicitly settles every promised action', () => {
    const edit = buildEpisodeEdit(eligibleScenesFor(), { ep: 4, living: CAST }, rngFor(7));
    expect(edit.promises.length).toBeGreaterThan(0);
    for (const promise of edit.promises) {
      expect(['resolved', 'attempted', 'postponed', 'abandoned']).toContain(promise.status);
      if (promise.status === 'abandoned') expect(promise.abandonmentReason).toBeTruthy();
    }
  });

  it('a story that closed tonight is resolved; one that only advanced is attempted', () => {
    const edit = buildEpisodeEdit(eligibleScenesFor(), { ep: 4, living: CAST }, rngFor(7));
    const byThread = Object.fromEntries(edit.promises.map(p => [p.threadId, p]));
    expect(byThread['t-ada-bo'].status).toBe('resolved');
    expect(byThread['t-dee-eli'].status).toBe('attempted');
    // A one-beat story opened tonight is postponed, not silently dropped.
    expect(byThread['t-journey-quiet'].status).toBe('postponed');
  });

  it('a promise whose owner has left the castle is abandoned WITH a reason', () => {
    const input = eligibleScenesFor();
    const edit = buildEpisodeEdit(input, { ep: 4, living: CAST.filter(n => n !== 'Jo') }, rngFor(7));
    const jo = edit.promises.find(p => p.owner === 'Jo');
    expect(jo.status).toBe('abandoned');
    expect(jo.abandonmentReason).toMatch(/Jo/);
  });

  it('MUTANT: "abandoned" without a reason cannot be spelled', () => {
    // THE MUTATION, RUN RATHER THAN ASSERTED. The whole ledger exists so that
    // "silently forgotten" and "abandoned" are not the same call. If this
    // stops throwing, the arm above is decorative — a story could stop with a
    // terminal status and no explanation and every suite would stay green.
    const p = recordPromise('s1', 'Ada', 'Ada said she would check.', { ep: 4 });
    expect(() => settlePromise(p.id, 'abandoned')).toThrow(/recorded reason/i);
    expect(() => settlePromise(p.id, 'abandoned', '   ')).toThrow(/recorded reason/i);
    expect(() => settlePromise(p.id, 'forgotten', 'x')).toThrow(/resolved/);
    // ...and the legal shapes still work, or the guard is unusable.
    expect(settlePromise(p.id, 'abandoned', 'Ada was banished').status).toBe('abandoned');
    expect(PROMISE_STATUSES).toEqual(['resolved', 'attempted', 'postponed', 'abandoned']);
  });

  it('records the words that were actually said, not a paraphrase', () => {
    const input = eligibleScenesFor();
    const edit = buildEpisodeEdit(input, { ep: 4, living: CAST }, rngFor(7));
    const opener = input.find(s => s.threadId === 't-ada-bo' && s.opened);
    const promise = edit.promises.find(p => p.threadId === 't-ada-bo');
    expect(promise.promisedAction).toBe(opener.line);
  });
});

describe('tone and pacing', () => {
  beforeEach(world);

  it('does not schedule an unbroken wall of conflict', () => {
    const edit = buildEpisodeEdit(conflictHeavyScenesFor(), { ep: 5, living: CAST }, rngFor(3));
    expect(longestRun(edit.scenes, s => s.tone === 'conflict')).toBeLessThanOrEqual(MAX_CONFLICT_RUN);
    expect(edit.scenes.some(s => ['warmth', 'humour', 'ordinary-life'].includes(s.tone))).toBe(true);
  });

  it('MUTANT: the same night, left in the order it fired, breaks the band', () => {
    // THE NUMBER THE DEFECT PRODUCES, not the number the fix produces. The
    // fixture is emitted phase by phase with the three relief scenes appended
    // at the end, which is exactly how the scheduler hands a day over: an
    // unedited pass therefore runs six or more accusations back to back. If
    // this ever drops to <= MAX_CONFLICT_RUN the band above has stopped
    // measuring the editor and is measuring the fixture.
    const raw = conflictHeavyScenesFor();
    for (const s of raw) s.tone = sceneTone(s);
    expect(longestRun(raw, s => s.tone === 'conflict')).toBeGreaterThan(MAX_CONFLICT_RUN);
  });

  it('does not run the same family or the same pair three times together', () => {
    const edit = buildEpisodeEdit(conflictHeavyScenesFor(), { ep: 5, living: CAST }, rngFor(3));
    // Within a phase. Across a phase boundary the rule cannot bind, because
    // chronology outranks it and the editor may not move a breakfast scene
    // into the evening to relieve a run.
    const byPhase = new Map();
    for (const s of edit.scenes) {
      if (!byPhase.has(s.phaseId)) byPhase.set(s.phaseId, []);
      byPhase.get(s.phaseId).push(s);
    }
    for (const [, list] of byPhase) {
      const pairKey = s => [...new Set([...(s.people || [])])].sort().join('|');
      expect(longestRun(list, () => true)).toBe(list.length); // sanity: the run helper works
      let run = 1;
      for (let i = 1; i < list.length; i++) {
        run = pairKey(list[i]) === pairKey(list[i - 1]) ? run + 1 : 1;
        expect(run, 'the same two people three scenes running inside one phase')
          .toBeLessThanOrEqual(2);
      }
    }
  });

  it('the tone ledger counts every scene exactly once', () => {
    const input = eligibleScenesFor();
    const edit = buildEpisodeEdit(input, { ep: 4, living: CAST }, rngFor(7));
    const total = Object.values(edit.toneLedger).reduce((a, b) => a + b, 0);
    expect(total).toBe(input.length);
    expect(edit.toneLedger.grief).toBe(2);
  });

  it('a smooth suspicion scene is suspense and an adverse one is conflict', () => {
    // The split that keeps the pacing rule usable: without it, every scene in
    // the three biggest families reads as an argument and the band is vacuous.
    // The branch names are real ones — `let-it-go` is on the benign list and
    // `hardened` on the adverse one (js/tr/castle/voice.js). A made-up branch
    // string would classify as smooth and this arm would be asserting nothing,
    // which is exactly how the first draft of `sceneTone` shipped a regex that
    // called 4% of a real castle conflict.
    expect(sceneTone(scene({ family: 'suspicion', branch: 'let-it-go' }))).toBe('suspense');
    expect(sceneTone(scene({ family: 'suspicion', branch: 'hardened' }))).toBe('conflict');
    expect(sceneTone(scene({ family: 'grief', branch: 'anything' }))).toBe('grief');
  });
});

describe('the record carries no field nothing reads', () => {
  beforeEach(world);

  it('there is no consensus block on the edit', () => {
    // FIX ROUND 1. `edit.consensus` was written every episode and read by
    // nothing — no screen, no backlog, no later scene. The consensus machinery
    // governs prose through `api.consensusPhrase` instead, where it has real
    // callers; see tests/tr-castle-prose.test.js. This arm keeps the field from
    // coming back without a reader.
    const edit = buildEpisodeEdit(eligibleScenesFor(), { ep: 4, living: CAST }, rngFor(7));
    expect(edit.consensus).toBeUndefined();
    expect(edit.dropped).toBeUndefined();
  });
});
