// A season is not forty incidents. It is a handful of stories that get picked
// up, escalated, and paid off — and the only reason an accusation in episode 7
// can name episode 2 is that episode 2 wrote something down.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, setGs, setPlayers } from '../js/core.js';
import { initTraitorsState } from '../js/tr/state.js';
import { openThread, advanceThread, closeThread, openThreadsFor, hottest, residueFor,
  heatAt, findOpenThread, abandonThread, priorMoments, citeMoments, continueThread,
  advanceCiting, actFor, actPhrase, lastClosedThread, outcomeSense, knownOutcomes }
  from '../js/tr/threads.js';
import { readdirSync, readFileSync } from 'node:fs';
import roster from '../franchise_roster.json';

const CAST = roster.players.slice(0, 8).map(p => p.name);
beforeEach(() => {
  setPlayers(roster.players.slice(0, 8));
  setGs({ bonds: {}, activePlayers: [...CAST] });
  gs.tr = initTraitorsState();
});

describe('a thread accumulates', () => {
  it('remembers every beat, with the episode attached', () => {
    const t = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    advanceThread(t.id, 3, 'asked for a vote and did not get it');
    advanceThread(t.id, 4, 'broke the commitment at the table');
    const thread = gs.tr.threads.find(x => x.id === t.id);
    expect(thread.beats).toHaveLength(3);
    expect(thread.beats.map(b => b.ep)).toEqual([2, 3, 4]);
    expect(thread.lastEp).toBe(4);
  });

  it('gets hotter as it is fed', () => {
    const t = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    const cold = gs.tr.threads.find(x => x.id === t.id).heat;
    advanceThread(t.id, 3, 'again');
    advanceThread(t.id, 4, 'again');
    expect(gs.tr.threads.find(x => x.id === t.id).heat).toBeGreaterThan(cold);
  });

  it('cools when nobody feeds it, so a stale story stops steering the season', () => {
    const t = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    advanceThread(t.id, 3, 'again');
    advanceThread(t.id, 4, 'again'); // heat is now 3, lastEp 4
    const thread = gs.tr.threads.find(x => x.id === t.id);

    // Direct heatAt observation: the number itself must move with partial
    // decay, not just "found vs not found" via a `?? 0` fallback.
    const fed = heatAt(thread, 4);
    const partiallyStale = heatAt(thread, 6);
    expect(partiallyStale).toBeLessThan(fed);
    expect(partiallyStale).toBeGreaterThan(0);

    // hottest() must surface that same decayed number, not just presence.
    expect(hottest(CAST[0], 6).heat).toBeCloseTo(partiallyStale);

    // Left alone long enough, it drops out of the live pool entirely.
    expect(hottest(CAST[0], 20)).toBeNull();
  });

  it('closes with an outcome, and stops being open', () => {
    const t = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    closeThread(t.id, 7, 'banished-and-was-faithful');
    expect(openThreadsFor(CAST[0], 7)).toHaveLength(0);
    expect(gs.tr.threads.find(x => x.id === t.id).outcome).toBe('banished-and-was-faithful');
  });

  it('leaves residue a later event can cite by episode, for BOTH parties', () => {
    const t = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    advanceThread(t.id, 4, 'broke the commitment at the table');
    const resA = residueFor(CAST[0]);
    const resB = residueFor(CAST[1]);
    // A residue write restricted to the first party passes if only CAST[0]
    // is ever checked — a thread is citable by BOTH sides or it isn't real.
    expect(resA.length).toBeGreaterThan(0);
    expect(resB.length).toBeGreaterThan(0);
    expect(resA[0]).toHaveProperty('ep');
    expect(resA[0]).toHaveProperty('note');
    expect(resB.map(r => r.note)).toContain('broke the commitment at the table');
  });

  it('is deterministic — the same season replays the same threads', () => {
    const a = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    gs.tr = initTraitorsState();
    const b = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    expect(a.id).toBe(b.id);
  });

  it('re-opening the same story returns the SAME thread — no wipe, no fragmentation', () => {
    const a = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    const again = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    expect(again.id).toBe(a.id);
    expect(gs.tr.threads.filter(x => x.kind === 'suspicion').length).toBe(1);

    // Party order must not matter — [A,B] and [B,A] are the same story.
    const reordered = openThread('suspicion', [CAST[1], CAST[0]], 2, 'eavesdrop');
    expect(reordered.id).toBe(a.id);
    expect(gs.tr.threads.filter(x => x.kind === 'suspicion').length).toBe(1);
  });

  it('a cooled thread is revived, not fragmented into an unreachable duplicate', () => {
    const t = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    advanceThread(t.id, 3, 'first follow-up');
    // Nothing feeds it for five episodes — it goes cold, but the pair is not
    // done: someone brings it back up in episode 8.
    const revived = openThread('suspicion', [CAST[0], CAST[1]], 8, 'she never let it go');

    // This is the plan's central claim in miniature: the episode-2 beat is
    // still attached to the SAME thread an episode-8 event revived, not
    // orphaned on a thread nothing can find any more.
    expect(revived.id).toBe(t.id);
    expect(revived.beats[0]).toMatchObject({ ep: 2, note: 'eavesdrop' });
    expect(revived.lastEp).toBe(8);
    expect(openThreadsFor(CAST[0], 8).map(x => x.id)).toContain(revived.id);
    expect(gs.tr.threads.filter(x => x.kind === 'suspicion').length).toBe(1);
  });

  it('findOpenThread reaches a cold thread regardless of heat', () => {
    const t = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    // Heat has fully decayed by ep 20 (hottest() would return null here) —
    // findOpenThread must still find it, because THAT is what lets it revive.
    expect(hottest(CAST[0], 20)).toBeNull();
    expect(findOpenThread('suspicion', [CAST[0], CAST[1]])?.id).toBe(t.id);
  });

  it('an abandoned thread stops being reachable as open, but the record stays', () => {
    const t = openThread('suspicion', [CAST[2], CAST[3]], 2, 'eavesdrop');
    abandonThread(t.id, 10);
    expect(openThreadsFor(CAST[2], 10)).toHaveLength(0);
    expect(findOpenThread('suspicion', [CAST[2], CAST[3]])).toBeNull();
    expect(gs.tr.threads.find(x => x.id === t.id).state).toBe('abandoned');
  });

  it('a closed thread is a payoff, not a reopenable one — a new episode gets a NEW thread', () => {
    const t = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    advanceThread(t.id, 3, 'confirmed at the table');
    closeThread(t.id, 5, 'banished-and-was-guilty');
    const beatsBefore = JSON.parse(JSON.stringify(t.beats));

    // Someone raises the same pair again later — this MUST NOT reopen the
    // payoff. Closure is an ending; silently reviving it erases the ending.
    const after = openThread('suspicion', [CAST[0], CAST[1]], 9, 'brought it up again');

    expect(after.id).not.toBe(t.id);
    const closed = gs.tr.threads.find(x => x.id === t.id);
    expect(closed.state).toBe('closed');
    expect(closed.outcome).toBe('banished-and-was-guilty');
    expect(closed.beats).toEqual(beatsBefore); // untouched by the later call
    expect(gs.tr.threads.filter(x => x.kind === 'suspicion').length).toBe(2);
  });

  // ── THE SAME EPISODE, WHICH IS THE CASE THAT BROKE ──
  //
  // The test above reopens at episode 9, which sidesteps the bug entirely: the
  // id carries the opening episode, so 2 and 9 differ and nothing collides.
  // Close and reopen in the SAME round — two same-family events landing on one
  // pair in one round, the first of which resolves — and both threads keyed
  // `suspicion:A|B:5`. Every id lookup (`advanceThread`, `closeThread`,
  // `abandonThread`) uses `threads.find`, which returns the CLOSED one, so the
  // new thread was unadvanceable from birth and every beat aimed at it
  // silently did nothing.
  it('close and reopen in the SAME episode gives two threads with two ids, and the new one advances', () => {
    const t = openThread('suspicion', [CAST[0], CAST[1]], 5, 'noticed something');
    closeThread(t.id, 5, 'denied-convincingly');
    const reopened = openThread('suspicion', [CAST[0], CAST[1]], 5, 'and then noticed something else');

    expect(reopened.id).not.toBe(t.id);
    expect(gs.tr.threads.filter(x => x.kind === 'suspicion')).toHaveLength(2);

    // The whole point: the new thread is usable. Under the collision this
    // returned null, because find() reached the closed thread first.
    const advanced = advanceThread(reopened.id, 6, 'and would not let it go');
    expect(advanced, 'advanceThread returned null — the id resolved to the closed thread')
      .not.toBeNull();
    expect(advanced.id).toBe(reopened.id);
    expect(advanced.beats).toHaveLength(2);

    // And the closed one is still closed, with its ending intact.
    const closed = gs.tr.threads.find(x => x.id === t.id);
    expect(closed.state).toBe('closed');
    expect(closed.outcome).toBe('denied-convincingly');
    expect(closed.beats).toHaveLength(1);
  });

  it('a revive writes residue for the revival episode, for both parties', () => {
    const t = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    advanceThread(t.id, 3, 'first follow-up');
    const beforeA = residueFor(CAST[0]).length;
    const beforeB = residueFor(CAST[1]).length;

    openThread('suspicion', [CAST[0], CAST[1]], 8, 'she never let it go');

    // Residue-citation is the entire payoff of a revive: it is why episode 9
    // can name episode 8. If the revive stops writing it, that link is gone.
    const afterA = residueFor(CAST[0]);
    const afterB = residueFor(CAST[1]);
    expect(afterA.length).toBe(beforeA + 1);
    expect(afterB.length).toBe(beforeB + 1);
    expect(afterA[afterA.length - 1]).toMatchObject({ ep: 8, note: 'she never let it go' });
    expect(afterB[afterB.length - 1]).toMatchObject({ ep: 8, note: 'she never let it go' });
  });

  it('a revive raises heat — a story that comes back must outrank a fresh one', () => {
    const t = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    advanceThread(t.id, 3, 'first follow-up');
    const heatBefore = gs.tr.threads.find(x => x.id === t.id).heat;

    const revived = openThread('suspicion', [CAST[0], CAST[1]], 8, 'she never let it go');

    expect(revived.heat).toBeGreaterThan(heatBefore);
  });

  it('a redundant re-announcement adds no second beat and no second residue entry', () => {
    const a = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    const beatsBefore = a.beats.length;
    const residueBefore = residueFor(CAST[0]).length;

    // Identical (kind, parties, ep, seed) — this is the SAME beat announced
    // twice, not a second one. If the guard were disabled, both counts here
    // would grow on the second call.
    openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');

    const again = gs.tr.threads.find(x => x.id === a.id);
    expect(again.beats.length).toBe(beatsBefore);
    expect(residueFor(CAST[0]).length).toBe(residueBefore);
  });
});


// ══════════════════════════════════════════════════════════════════════
// CITING RESIDUE (Plan 5 Task 2) — spec §5.4.4, "residue is what lets
// episode 7's accusation name episode 2"
// ══════════════════════════════════════════════════════════════════════
//
// Before this task `residue` had zero production readers: every event wrote to
// it and nothing ever read it back, so the accumulation the whole thread system
// exists for was invisible in the text. These are the unit-level guards on the
// read side. The pool-level and season-level guards live in tr-castle.test.js
// and tr-castle-reachability.test.js, because a helper that works in isolation
// and is called by nothing is the same defect in a different place.
//
// THE MUTATION THAT PROVES THEM: `residueFor` returning `[]` unconditionally.
// Every assertion below reaches the citation through residueFor, deliberately —
// a citation built off `thread.beats` would survive residue being deleted.
describe('residue can be cited by name and by day', () => {
  it('a payoff on a three-beat thread names the day of every earlier beat', () => {
    const t = openThread('suspicion', [CAST[0], CAST[1]], 2, 'A eavesdropped and heard nothing.');
    advanceThread(t.id, 3, 'A asked for a vote and did not get one.');
    advanceThread(t.id, 4, 'B broke the commitment at the table.');

    const cited = citeMoments(gs.tr.threads.find(x => x.id === t.id), 7);

    // The episode numbers themselves, which is the spec's claim stated
    // literally: an event in episode 7 naming episodes 2, 3 and 4.
    expect(cited).toContain('day 2');
    expect(cited).toContain('day 3');
    expect(cited).toContain('day 4');
    // And the SPECIFIC moment, not "as before" — the opening beat's own words,
    // with its full stop taken off, because it is spliced INSIDE an em-dash
    // parenthetical and "…heard nothing. — and it had not stopped since" is
    // what the unpunctuated version reads like.
    expect(cited).toContain('A eavesdropped and heard nothing —');
    expect(cited).not.toContain('. —');
    // It must not name the episode it is being spoken in.
    expect(cited).not.toContain('day 7');
  });

  it('DEGRADES: a two-beat thread cites its one earlier moment and still reads as a sentence', () => {
    // This is the case that actually happens. 73.9% of threads die at beat one
    // and only 3.96% reach a payoff, so a citation that needed three prior
    // beats would be content nobody ever sees. One prior moment is the shape
    // the mechanism must be built around.
    const t = openThread('trust', [CAST[0], CAST[1]], 3, 'They promised each other a vote.');

    const cited = citeMoments(gs.tr.threads.find(x => x.id === t.id), 5);

    expect(cited).toBe('It went back to day 3: They promised each other a vote.');
  });

  it('a thread with nothing before this episode cites nothing at all', () => {
    // The single-beat case: no earlier moment exists, so there is no citation
    // to make and the caller must get an empty string rather than a dangling
    // "It went back to day undefined".
    const t = openThread('trust', [CAST[0], CAST[1]], 4, 'first beat');
    expect(citeMoments(gs.tr.threads.find(x => x.id === t.id), 4)).toBe('');
    expect(priorMoments(gs.tr.threads.find(x => x.id === t.id), 4)).toEqual([]);
  });

  it('continueThread writes the citation INTO the beat, built from the thread as it stood before', () => {
    openThread('suspicion', [CAST[0], CAST[1]], 2, 'A noticed the timeline did not fit.');

    const { thread, note, cited } = continueThread('suspicion', [CAST[0], CAST[1]], 6,
      'A said it out loud this time.');

    expect(cited).toEqual([2]);
    expect(note).toContain('day 2');
    expect(note).toContain('A noticed the timeline did not fit.');
    // The beat that was just written is the one carrying it — the citation is
    // narration, not a return value nobody renders.
    const last = thread.beats[thread.beats.length - 1];
    expect(last.ep).toBe(6);
    expect(last.note).toBe(note);
    // NO SELF-CITATION. If the citation were built after appending the beat,
    // the note would cite day 6 — itself — and a long thread's text would grow
    // with every beat as each citation quoted the last one.
    expect(last.note).not.toContain('day 6');
  });

  it('continueThread opens a fresh thread, uncited, when there is no story to continue', () => {
    const { thread, note, cited } = continueThread('grief', [CAST[2], CAST[3]], 4, 'they sat in silence');
    expect(cited).toEqual([]);
    expect(note).toBe('they sat in silence');
    expect(thread.beats).toHaveLength(1);
  });

  it('residueFor narrows to one story and to what was written before a given episode', () => {
    const a = openThread('suspicion', [CAST[0], CAST[1]], 2, 'the suspicion');
    openThread('trust', [CAST[0], CAST[1]], 3, 'the pact');
    advanceThread(a.id, 5, 'the suspicion, again');

    expect(residueFor(CAST[0]).length).toBe(3);
    expect(residueFor(CAST[0], { threadId: a.id }).map(r => r.ep)).toEqual([2, 5]);
    expect(residueFor(CAST[0], { threadId: a.id, beforeEp: 5 }).map(r => r.ep)).toEqual([2]);
  });
});


// ── Review round 3: the three things a reader saw and no assertion did ──
describe('a citation is punctuated, and never quotes a sentence back at itself', () => {
  it('does not quote the sentence it is being appended to (R2)', () => {
    // Several events write a CONSTANT note, so the second firing on the same
    // thread would otherwise read "X. It went back to day 1: X." — 22 of 758
    // citations in a measured season set.
    const LINE = 'Bowie had an answer ready for a question nobody had asked yet.';
    openThread('cover', [CAST[0]], 1, LINE);

    const { note, cited } = advanceCiting(findOpenThread('cover', [CAST[0]]), 4, LINE);

    expect(note).toBe(LINE);                    // no citation at all: nothing else to name
    expect(cited).toEqual([1]);
    expect(note.split('Bowie had an answer').length - 1).toBe(1);
  });

  it('quotes a DIFFERENT day rather than dropping the quote, when one is available (R2 + R4)', () => {
    // BEHAVIOUR CHANGED IN PLAN 5 TASK 4 ROUND 2, and the invariant did not.
    // R2's rule is "never quote a sentence back at itself"; it is not "never
    // quote when the OLDEST moment happens to be that sentence". The old code
    // conflated the two because the lead was always prior[0], so a self-quote
    // on day 1 discarded day 3's perfectly good sentence as collateral. Since
    // R4 the lead is chosen, so it simply skips day 1 and quotes day 3.
    //
    // The R2 invariant is the last assertion, unchanged and still the point:
    // the head appears in the note exactly once.
    const LINE = 'Bowie had an answer ready for a question nobody had asked yet.';
    const t = openThread('cover', [CAST[0]], 1, LINE);
    advanceThread(t.id, 3, 'Something else entirely happened.');

    const { note } = advanceCiting(findOpenThread('cover', [CAST[0]]), 6, LINE);

    expect(note).toContain('It went back to day 3');
    expect(note).toContain('Something else entirely happened');
    expect(note).toContain('day 1');            // the earlier day is still named
    // The self-quote is gone; the accounting is not.
    expect(note.split('Bowie had an answer').length - 1).toBe(1);
  });

  it('only the EARLIEST day may be called "since", and the quoting form never claims an order (R4 follow-up)', () => {
    // FOUND BY READING A DUMP, AND CREATED BY R4 ITSELF. Varying which moment
    // leads broke the assumption every "since" in citeMoments rested on - that
    // the quoted moment was the earliest one. Two real beats came out of the
    // engine naming real days in an order that cannot have happened:
    //
    //   "It went back to day 7 - ... - and it had not stopped since: day 5."
    //   "It had been going on since day 2, and again on day 1."
    //
    // The invariant has two halves and they need two different scenarios,
    // because the two forms of a citation are produced by different branches.

    // FORM 1 - a quoted lead. The lead is chosen and may be ANY prior moment,
    // so the connective must not claim the lead is the earliest. It says "it
    // did not stop there", and the word "since" may not appear at all.
    const t1 = openThread('cover', [CAST[2]], 1, 'The first thing that happened.');
    // Day 3 QUOTES day 1, which is what makes day 1 already-quoted and pushes
    // the lead onto a later moment - the exact situation that produced the bug.
    advanceThread(t1.id, 3, 'The second thing. The first thing that happened.');
    advanceThread(t1.id, 5, 'The third thing that happened.');

    const quoting = citeMoments(findOpenThread('cover', [CAST[2]]), 9);
    expect(quoting).toContain('It went back to day 3');   // not day 1: already quoted
    expect(quoting).toContain('day 1');                    // the earlier day is still named
    expect(quoting, `a citation whose lead is not the earliest moment must not say "since": ${quoting}`)
      .not.toMatch(/since/);
    // THE MUTATION for this half: in js/tr/threads.js, restore the old
    // connective - `and it had not stopped since: ${_days(others)}` in place of
    // `and it did not stop there: ${_days(others)}`.

    // FORM 2 - every moment already quoted, so there is no lead and the
    // citation is days only. THIS form does say "since", and the day it names
    // must be the smallest one in the sentence.
    // `_head` compares FIRST SENTENCES, so "already quoted" means a later note
    // repeats that opening sentence. Both earlier heads are repeated below,
    // which leaves citeMoments with nothing new to quote.
    const LINE = 'A sentence this thread keeps repeating.';
    const t2 = openThread('trust', [CAST[3]], 2, LINE);
    advanceThread(t2.id, 4, `Beat two. ${LINE}`);
    advanceThread(t2.id, 6, 'Beat two. And something after it.');

    const daysOnly = citeMoments(findOpenThread('trust', [CAST[3]]), 9);
    expect(daysOnly, `expected the days-only form, got: ${daysOnly}`).toMatch(/going on since/);
    const days = [...daysOnly.matchAll(/day (\d+)/g)].map(m => Number(m[1]));
    const since = Number(/going on since day (\d+)/.exec(daysOnly)[1]);
    expect(days.length).toBeGreaterThan(1);
    expect(since, `"since" named day ${since} while the sentence also names ${Math.min(...days)}: ${daysOnly}`)
      .toBe(Math.min(...days));
    // THE MUTATION for this half: `since day ${prior[prior.length - 1].ep}` in
    // place of `since day ${earliest.ep}`.
  });

  it('strips the quoted note\'s full stop before splicing it inside the dashes (R3)', () => {
    const t = openThread('cover', [CAST[1]], 2,
      'Chase performed the exact right amount of fear at breakfast.');
    advanceThread(t.id, 5, 'and again');

    const cited = citeMoments(findOpenThread('cover', [CAST[1]]), 8);

    // The connective changed in round 2 ("had not stopped since" -> "did not
    // stop there") because "since" may only ever name the EARLIEST day and the
    // quoted day is no longer guaranteed to be it. What this test is actually
    // about - the quoted note's own full stop coming off before the splice - is
    // unchanged, and is the second assertion.
    expect(cited).toContain('at breakfast — and it did not stop there: day 5.');
    expect(cited).not.toContain('. —');
  });

  it('throws rather than silently dropping a beat when the thread is missing (R5)', () => {
    // This replaced advanceThread(t.id, ...), which threw. Every call site
    // guarantees the thread in its own weight(); a null here is a weight/fire
    // disagreement and must fail loudly, not return { thread: null }.
    expect(() => advanceCiting(null, 4, 'a beat nobody will ever see')).toThrow(/no thread to advance/);
  });
});

// ══════════════════════════════════════════════════════════════════════
// SPEC 5.2: A THREAD CARRIES THE ACT IT OPENED IN
// ══════════════════════════════════════════════════════════════════════
//
// `thread: { id, kind, parties[], openedEp, act, state, evidence[], heat }` —
// the implementation had every field but `act`. It is not decoration: guard 4
// (`acts`) prices an episode-9 castle differently from an episode-2 one, and a
// STORY that began in a different part of the season is the same distinction
// made about a thread rather than about a draw.
//
// THE MUTATION: delete `act: actFor(ep)` from the object literal in
// `openThread`. Every assertion in this block goes red, and so do the two
// castle-side act branches in tr-castle.test.js.
describe('a thread knows which act it opened in (spec 5.2)', () => {
  const [A, B] = CAST;

  it('stamps the act at open, by the same three-band split ctx.act uses', () => {
    expect(openThread('suspicion', [A, B], 2, 'early beat').act).toBe('early');
    expect(openThread('trust', [A, B], 5, 'middle beat').act).toBe('middle');
    expect(openThread('grief', [A, B], 9, 'late beat').act).toBe('late');
    // The boundaries themselves, because an off-by-one here would silently
    // reclassify a fifth of every season and nothing else would notice.
    expect([1, 2, 3].map(actFor)).toEqual(['early', 'early', 'early']);
    expect([4, 5, 6, 7].map(actFor)).toEqual(['middle', 'middle', 'middle', 'middle']);
    expect([8, 9, 20].map(actFor)).toEqual(['late', 'late', 'late']);
  });

  it('KEEPS the act it opened in when it is advanced two acts later', () => {
    // The whole point of the field. A value recomputed from "now" could never
    // answer "did this story start somewhere else", which is what the two
    // castle readers ask.
    const t = openThread('suspicion', [A, B], 2, 'opened in the early act');
    advanceThread(t.id, 9, 'still going');
    const stored = gs.tr.threads.find(x => x.id === t.id);
    expect(stored.act).toBe('early');
    expect(stored.lastEp).toBe(9);
    expect(actFor(stored.lastEp)).toBe('late');   // ...and "now" says otherwise
  });

  it('every act a thread can be stamped with has a way of being said out loud', () => {
    // The events name the act in prose. A missing phrase would print "null" or
    // silently drop the clause, and the branch would look live and say nothing.
    for (const ep of [1, 3, 4, 7, 8, 12]) {
      const phrase = actPhrase(actFor(ep));
      expect(phrase, `no phrase for the act at ep ${ep}`).toBeTruthy();
      expect(phrase).not.toBe(actFor(ep));   // castle vocabulary, not the engine's label
    }
    expect(actPhrase('nonsense')).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════
// SPEC 5.5: A CLOSED THREAD'S OUTCOME IS READABLE
// ══════════════════════════════════════════════════════════════════════
//
// `closeThread` has written an outcome since it was built and nothing read it,
// so the eleven distinct outcomes the pool produces were eleven ways of writing
// the same thing. These two queries are what castle events branch on.
//
// THE MUTATION: `closeThread` setting `t.outcome = null` instead of `outcome`.
// Every assertion here goes red, and so does the castle-side branch test.
describe('a closed thread can be read back by outcome (spec 5.5)', () => {
  const [A, B, C] = CAST;

  it('finds the most recent closed thread a person was party to', () => {
    const t1 = openThread('suspicion', [A, B], 2, 'first');
    closeThread(t1.id, 3, 'denied-convincingly');
    const t2 = openThread('testing', [B, C], 5, 'second');
    closeThread(t2.id, 6, 'confessed-unrelated');

    expect(lastClosedThread(B)?.outcome).toBe('confessed-unrelated');
    expect(lastClosedThread(A)?.outcome).toBe('denied-convincingly');
    // Kind and time filters, both used by the readers.
    expect(lastClosedThread(B, { kind: 'suspicion' })?.outcome).toBe('denied-convincingly');
    expect(lastClosedThread(B, { beforeEp: 6 })?.outcome).toBe('denied-convincingly');
    expect(lastClosedThread(B, { beforeEp: 3 })).toBeNull();
  });

  it('never returns a thread that is still open — an unfinished story has no outcome to read', () => {
    openThread('suspicion', [A, B], 2, 'still going');
    expect(lastClosedThread(A)).toBeNull();
    expect(lastClosedThread(B)).toBeNull();
  });

  it('turns an outcome into a sense, and an unknown string into null rather than a guess', () => {
    expect(outcomeSense('denied-convincingly')).toBe('walked');
    expect(outcomeSense('confessed-unrelated')).toBe('cracked');
    expect(outcomeSense('became-showmance')).toBe('coupled');
    expect(outcomeSense('a-thing-nobody-wrote')).toBeNull();
    expect(outcomeSense(undefined)).toBeNull();
  });

  // ── THE SOURCE RULE, AND WHY IT IS ONE ──
  //
  // Events branch on the SENSE of an outcome, never on the eleven literals, so
  // an author adding a twelfth close site gets `null` back and their story
  // silently stops being readable — no error, no failing season, just a branch
  // that never fires again. No output check can catch that: the run where the
  // twelfth outcome first closes may be one season in a hundred, and a green
  // suite is exactly what it looks like. The source is exhaustive and instant.
  it('every outcome the castle pool actually closes with has a sense', () => {
    const dir = 'js/tr/castle/';
    const known = new Set(knownOutcomes());
    const unknown = [];
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.js')) continue;
      const src = readFileSync(dir + f, 'utf8');
      for (const m of src.matchAll(/closeThread\([^;]*?,\s*'([^']+)'\s*\)/g)) {
        if (!known.has(m[1])) unknown.push(`${f}: '${m[1]}'`);
      }
    }
    expect(unknown, 'these outcomes are written by an event and cannot be read by one — '
      + 'add them to OUTCOME_SENSE in js/tr/threads.js').toEqual([]);
    // Guard on the guard: a regex that matched nothing would pass this and
    // every mutant with it.
    expect(known.size).toBeGreaterThanOrEqual(8);
  });
});
