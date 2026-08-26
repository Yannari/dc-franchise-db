// The engine that decides what happens tonight.
//
// Most events are weight 0 most of the time, and that is the point: an event
// with sharp preconditions fires once a season and reads as authored. What
// stops a season looping is not more events — it is that a live story beats a
// fresh one, that the same pair cannot repeat themselves, and that the castle
// in episode 9 does not sound like the castle in episode 2.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, setGs, setPlayers } from '../js/core.js';
import { initTraitorsState } from '../js/tr/state.js';
import { openThread } from '../js/tr/threads.js';
import { registerEvent, eligible, pickEvent, validateRegistry, EVENTS, _resetRegistry,
  runWindow, startRoundBudget } from '../js/tr/events.js';
import roster from '../franchise_roster.json';

const CAST = roster.players.slice(0, 8).map(p => p.name);
function seededRng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function ctxFor(ep = 3, window = 'evening') {
  return { ep, window, act: ep <= 3 ? 'early' : ep <= 7 ? 'middle' : 'late',
    living: [...CAST], rng: seededRng(1) };
}
beforeEach(() => {
  setPlayers(roster.players.slice(0, 8));
  setGs({ bonds: {}, activePlayers: [...CAST] });
  gs.tr = initTraitorsState();
  _resetRegistry();
});

describe('the contract', () => {
  it('catches an event whose weight and fire disagree about eligibility', () => {
    // The BB Hacker lesson: an event that weights itself eligible and then
    // declines to do anything is content you believe is in the game and is not.
    //
    // This is a SWEEP, not a registration-time check. Validating by execution
    // at registration would fire the event against the live season and write
    // bonds, threads and residue as an import side effect — a worse bug than
    // the one being guarded.
    registerEvent({ id: 'broken', family: 'suspicion', window: 'evening',
      weight: () => 5, fire: () => null });
    registerEvent({ id: 'honest', family: 'suspicion', window: 'evening',
      weight: () => 5, fire: () => ({ ok: true }) });
    const broken = validateRegistry(() => ctxFor(), seededRng(1));
    expect(broken).toContain('broken');
    expect(broken).not.toContain('honest');
  });

  it('rejects a duplicate event id', () => {
    registerEvent({ id: 'dup', family: 'trust', window: 'evening',
      weight: () => 1, fire: () => ({ ok: true }) });
    expect(() => registerEvent({ id: 'dup', family: 'trust', window: 'evening',
      weight: () => 1, fire: () => ({ ok: true }) })).toThrow();
  });

  it('treats weight 0 as not eligible', () => {
    registerEvent({ id: 'never', family: 'suspicion', window: 'evening',
      weight: () => 0, fire: () => ({ ok: true }) });
    expect(eligible(ctxFor()).map(e => e.id)).not.toContain('never');
  });

  it('only offers events for the current window', () => {
    registerEvent({ id: 'night-only', family: 'grief', window: 'night',
      weight: () => 5, fire: () => ({ ok: true }) });
    expect(eligible(ctxFor(3, 'evening')).map(e => e.id)).not.toContain('night-only');
    expect(eligible(ctxFor(3, 'night')).map(e => e.id)).toContain('night-only');
  });
});

describe('continuation beats novelty', () => {
  it('an event advancing a live thread outranks an identical fresh one', () => {
    registerEvent({ id: 'fresh', family: 'suspicion', window: 'evening',
      weight: () => 5, fire: () => ({ ok: true }) });
    registerEvent({ id: 'continues', family: 'suspicion', window: 'evening',
      advancesThread: true, weight: () => 5, fire: () => ({ ok: true }) });
    openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    const ctx = { ...ctxFor(), actors: [CAST[0], CAST[1]] };
    const scored = eligible(ctx);
    const fresh = scored.find(e => e.id === 'fresh');
    const cont = scored.find(e => e.id === 'continues');
    expect(cont.score, 'a live story did not beat a fresh one').toBeGreaterThan(fresh.score);
  });
});

describe('the guards', () => {
  it('amplifies a rare event when it finally becomes eligible', () => {
    registerEvent({ id: 'common', family: 'trust', window: 'evening',
      weight: () => 5, fire: () => ({ ok: true }) });
    registerEvent({ id: 'rare', family: 'trust', window: 'evening', rare: true,
      weight: (c) => (c.ep === 6 ? 5 : 0), fire: () => ({ ok: true }) });
    const scored = eligible(ctxFor(6));
    const rare = scored.find(e => e.id === 'rare');
    const common = scored.find(e => e.id === 'common');
    expect(rare.score, 'a rare event was not amplified when it became eligible')
      .toBeGreaterThan(common.score);
  });

  it('will not repeat the same PAIR, which is what makes a season loop', () => {
    registerEvent({ id: 'pairtalk', family: 'trust', window: 'evening',
      weight: () => 5, fire: () => ({ ok: true }) });
    const ctx = { ...ctxFor(), actors: [CAST[0], CAST[1]] };
    pickEvent(ctx, seededRng(2));
    const after = eligible({ ...ctx, ep: ctx.ep });
    expect(after.map(e => e.id), 'the same pair was offered the same event again')
      .not.toContain('pairtalk');
  });

  it('the pair scope outlasts the event scope — the guard doing the blocking is PAIR, not event', () => {
    // If event, player and pair cooldowns all held the same window, the
    // event-scope check alone would explain every "fired once, gone" result
    // in this file, and a mutant deleting the pair-scope check would pass
    // silently. Pair scope is given the LONGEST window on purpose (it is the
    // guard that matters), so once the event-scope window has lapsed and the
    // SAME event is generally offerable again, the SAME pair must still be
    // excluded — only the pair-scope check can be producing that.
    registerEvent({ id: 'longtalk', family: 'trust', window: 'evening',
      weight: () => 5, fire: () => ({ ok: true }) });
    const ctx = { ...ctxFor(3), actors: [CAST[0], CAST[1]] };
    pickEvent(ctx, seededRng(4));

    // Event scope has lapsed: a NEW pair can be offered the event again.
    const otherPair = { ...ctxFor(6), actors: [CAST[2], CAST[3]] };
    expect(eligible(otherPair).map(e => e.id), 'event scope should have expired by now')
      .toContain('longtalk');

    // The ORIGINAL pair, at that same later episode, is still excluded.
    const samePairLater = { ...ctxFor(6), actors: [CAST[0], CAST[1]] };
    expect(eligible(samePairLater).map(e => e.id),
      'pair scope did not outlast event scope for the pair that already had this conversation')
      .not.toContain('longtalk');
  });

  it('will not repeat the same solo event for the same player, which is the player scope', () => {
    // Mirrors the pair test above but for a single-actor scene, so the
    // player-scope check has its own dedicated failure mode: deleting it
    // must not be maskable by event scope (different pair, no repeat needed
    // here) or by pair scope (there is no pair — actors.length === 1).
    registerEvent({ id: 'soloagain', family: 'trust', window: 'evening',
      weight: () => 5, fire: () => ({ ok: true }) });
    const ctx = { ...ctxFor(3), actors: [CAST[0]] };
    pickEvent(ctx, seededRng(5));
    // Event scope (2 episodes) has lapsed by episode 5 but player scope
    // (3 episodes) has not — only player scope can still be excluding CAST[0].
    const sameSoloLater = { ...ctxFor(5), actors: [CAST[0]] };
    expect(eligible(sameSoloLater).map(e => e.id),
      'player scope did not outlast event scope for the player who already did this')
      .not.toContain('soloagain');
  });

  it('the same player cannot dodge their cooldown by rotating partners every episode', () => {
    // Player scope must check EVERY actor in the scene, not just solo scenes.
    // A version that only wrote player cooldowns for single-actor events (and
    // left pair scenes to pair-scope alone) would let one player run the same
    // event with a new partner each episode and never trip player scope at
    // all — exactly the "same person, same beat, over and over" this scope
    // exists to catch. Gap is chosen deliberately: 2 episodes clears the
    // 2-episode event-scope window (so event scope can't be doing this) and
    // the new partner means pair scope has never seen this exact pair before
    // (so pair scope can't be doing this either) — only player scope remains.
    registerEvent({ id: 'floater', family: 'trust', window: 'evening',
      weight: () => 5, fire: () => ({ ok: true }) });
    pickEvent({ ...ctxFor(3), actors: [CAST[0], CAST[1]] }, seededRng(7));
    const newPartnerCtx = { ...ctxFor(5), actors: [CAST[0], CAST[2]] };
    expect(eligible(newPartnerCtx).map(e => e.id),
      'player scope let the same player repeat the same event with a brand new partner')
      .not.toContain('floater');
  });

  it('the event-scope cooldown window itself blocks a repeat, then releases once it lapses', () => {
    // Task 2 review round 1: a mutant deleting `if (ctx.ep - evLast < evWindow)
    // return true` while LEAVING the oncePerSeason branch intact passed every
    // test — because every existing event-scope assertion used a
    // oncePerSeason event, which is blocked by a totally separate line. This
    // event is NOT oncePerSeason, and has no actors, so only the raw
    // event-scope TIME WINDOW (2 episodes) can be doing any blocking here.
    registerEvent({ id: 'windowed', family: 'trust', window: 'evening',
      weight: () => 5, fire: () => ({ ok: true }) });
    pickEvent(ctxFor(3), seededRng(6));
    expect(eligible(ctxFor(4)).map(e => e.id),
      'event scope should still hold at a 1-episode gap (its window is 2)')
      .not.toContain('windowed');
    expect(eligible(ctxFor(5)).map(e => e.id),
      'event scope did not release once its own 2-episode window had lapsed')
      .toContain('windowed');
  });

  it('will not fire a oncePerSeason event twice', () => {
    registerEvent({ id: 'signature', family: 'suspicion', window: 'evening',
      oncePerSeason: true, weight: () => 9, fire: () => ({ ok: true }) });
    pickEvent(ctxFor(), seededRng(3));
    expect(eligible(ctxFor(5)).map(e => e.id)).not.toContain('signature');
  });

  it('lets an author tune ONE cooldown scope without flattening the other two', () => {
    // Task 2 review round 1: a scalar `ev.cooldown` override collapses all
    // three scope durations (2/3/5) to a single value, restoring the exact
    // masking those unequal defaults exist to prevent — an author only ever
    // needs to lengthen the pair scope on a heavily-recurring couple, and a
    // scalar would silently shrink event scope's default too. `cooldown`
    // must be a PARTIAL: only the named scope is overridden.
    registerEvent({ id: 'tuned', family: 'trust', window: 'evening',
      cooldown: { pair: 6 }, weight: () => 5, fire: () => ({ ok: true }) });
    pickEvent({ ...ctxFor(3), actors: [CAST[0], CAST[1]] }, seededRng(8));
    // Gap of 5: default event scope (2) and default player scope (3, left
    // untouched by the override) have both lapsed — only the TUNED pair
    // window (6) can still be excluding this exact pair.
    const ctx = { ...ctxFor(8), actors: [CAST[0], CAST[1]] };
    expect(eligible(ctx).map(e => e.id),
      'the pair-scope override did not hold, or a scalar collapsed the other two scopes')
      .not.toContain('tuned');
  });

  it('shifts the centre of gravity between acts', () => {
    registerEvent({ id: 'warm', family: 'trust', window: 'evening',
      acts: { early: 2, middle: 1, late: 0.3 }, weight: () => 5, fire: () => ({ ok: true }) });
    registerEvent({ id: 'paranoid', family: 'suspicion', window: 'evening',
      acts: { early: 0.3, middle: 1, late: 2 }, weight: () => 5, fire: () => ({ ok: true }) });
    const early = eligible(ctxFor(2));
    const late = eligible(ctxFor(9));
    expect(early.find(e => e.id === 'warm').score)
      .toBeGreaterThan(early.find(e => e.id === 'paranoid').score);
    expect(late.find(e => e.id === 'paranoid').score)
      .toBeGreaterThan(late.find(e => e.id === 'warm').score);
  });
});

describe('pickEvent actually spends the score', () => {
  it('picks the high-weight event substantially more often across many independent draws', () => {
    // Task 2 review round 1: forcing `let roll = -1` (always take scored[0],
    // ignoring every score) passed 11/11 — every guard in this file is
    // asserted against eligible().score, and nothing asserted the score
    // reaches SELECTION. A single draw proves nothing (lesson 4): this is a
    // population assertion over many independent trials, each from a
    // genuinely fresh world (lesson 5), with the bar set well below the
    // theoretical rate and the measured rate logged for the report.
    const TRIALS = 200;
    // ONE rng generator advanced across all trials — not a fresh seed per
    // trial. Re-seeding by incrementing the seed by 1 each time produces a
    // near-arithmetic sequence of first-outputs (the LCG multiplier step is
    // tiny relative to its modulus), which under-explores the unit interval.
    // Advancing a single generator's internal state through its real
    // recurrence is what actually gives 200 decorrelated draws.
    const rng = seededRng(1234);
    let highWins = 0;
    for (let i = 0; i < TRIALS; i++) {
      _resetRegistry();
      setPlayers(roster.players.slice(0, 8));
      setGs({ bonds: {}, activePlayers: [...CAST] });
      gs.tr = initTraitorsState();
      registerEvent({ id: 'low', family: 'trust', window: 'evening',
        weight: () => 1, fire: () => ({ ok: true }) });
      registerEvent({ id: 'high', family: 'trust', window: 'evening',
        weight: () => 19, fire: () => ({ ok: true }) });
      const picked = pickEvent(ctxFor(3), rng);
      if (picked?.event.id === 'high') highWins++;
    }
    const rate = highWins / TRIALS;
    // Theoretical weighted rate is 19/20 = 0.95. The bar (0.8) sits well
    // below that with headroom for RNG noise, but comfortably above what
    // either `roll = -1` (0%, always picks registration-order first) or a
    // score-ignoring uniform pick over 2 events (~50%) would produce.
    // eslint-disable-next-line no-console
    console.log(`pickEvent selection: high-weight event chosen ${highWins}/${TRIALS} (${(rate * 100).toFixed(1)}%)`);
    expect(rate, `high-weight event should win the large majority of draws, got ${(rate * 100).toFixed(1)}%`)
      .toBeGreaterThan(0.8);
  });
});

describe('runWindow: the seven social windows around the four beats', () => {
  it('only fires events registered for that window', () => {
    registerEvent({ id: 'dawn-only', family: 'grief', window: 'dawn',
      weight: () => 5, fire: () => ({ ok: true }) });
    registerEvent({ id: 'night-only', family: 'romance', window: 'night',
      weight: () => 5, fire: () => ({ ok: true }) });
    startRoundBudget(seededRng(1));
    const dawnFired = runWindow('dawn', 3, seededRng(2));
    expect(dawnFired.every(f => f.event.id === 'dawn-only')).toBe(true);
    expect(dawnFired.some(f => f.event.id === 'night-only')).toBe(false);

    startRoundBudget(seededRng(1));
    const nightFired = runWindow('night', 3, seededRng(2));
    expect(nightFired.every(f => f.event.id === 'night-only')).toBe(true);
  });

  it('caps a round at 4-8 total castle events across all seven windows, never per window', () => {
    // A single event, eligible in every window, with no cooldown at all
    // (oncePerSeason: false, tiny windows) so the ONLY thing that can stop
    // it firing over and over is the round budget itself.
    const windows = ['dawn', 'morning', 'journey-out', 'journey-back', 'evening', 'after-table', 'night'];
    for (const w of windows) {
      registerEvent({ id: `always-${w}`, family: 'trust', window: w,
        cooldown: { event: 0, player: 0, pair: 0 },
        weight: () => 5, fire: () => ({ ok: true }) });
    }
    const rng = seededRng(9);
    const budget = startRoundBudget(rng);
    expect(budget.total).toBeGreaterThanOrEqual(4);
    expect(budget.total).toBeLessThanOrEqual(8);

    let allFired = [];
    for (const w of windows) allFired = allFired.concat(runWindow(w, 5, rng));

    expect(allFired.length).toBeGreaterThanOrEqual(4);
    expect(allFired.length).toBeLessThanOrEqual(8);
    expect(allFired.length).toBe(gs.tr.roundBudget.used);
  });

  it('rejects an unknown window at registration, before the runner ever sees it', () => {
    expect(() => registerEvent({ id: 'bad-window', family: 'trust', window: 'brunch',
      weight: () => 5, fire: () => ({ ok: true }) })).toThrow();
  });

  it('does nothing when no round budget has been started', () => {
    registerEvent({ id: 'orphan', family: 'trust', window: 'evening',
      weight: () => 5, fire: () => ({ ok: true }) });
    gs.tr.roundBudget = null;
    expect(runWindow('evening', 3, seededRng(1))).toEqual([]);
  });
});

describe('window wiring order inside a real season (headless.js contract)', () => {
  it('calls the seven windows in beat order and never disturbs evidence -> table -> night', async () => {
    // This does not go through registerEvent/pickEvent at all — it spies on
    // runWindow itself to record the ORDER headless.js calls the seven
    // windows in, independent of whether anything is registered to fire.
    // That is deliberate: "windows slot around the loop, they do not disturb
    // it" is a claim about CALL ORDER, and a population with an empty event
    // pool (true today — Tasks 5/6 have not shipped yet) must still prove it.
    const { vi } = await import('vitest');
    const eventsMod = await import('../js/tr/events.js');
    const roundtableMod = await import('../js/tr/roundtable.js');
    const { playTraitorsSeason } = await import('../js/tr/headless.js');
    const realRunWindow = eventsMod.runWindow;
    const realRunRoundTable = roundtableMod.runRoundTable;
    const order = [];
    const spyWindow = vi.spyOn(eventsMod, 'runWindow')
      .mockImplementation((window, ep, rng) => { order.push(window); return realRunWindow(window, ep, rng); });
    // A marker for the Round Table BEAT itself, not just the windows around
    // it — "evening immediately before the table, after-table immediately
    // after" is a claim about a window's position relative to the BEAT, and
    // a rank check over windows alone cannot see a window that moved to the
    // other side of the table while keeping its rank order among windows
    // (moving 'evening' to fire right after runRoundTable instead of right
    // before it does not change window-to-window rank at all).
    const spyTable = vi.spyOn(roundtableMod, 'runRoundTable')
      .mockImplementation((ep, rng) => { order.push('TABLE'); return realRunRoundTable(ep, rng); });
    try {
      playTraitorsSeason({ cast: CAST, traitorCount: 2, seed: 3, maxRounds: 4 });
    } finally {
      spyWindow.mockRestore();
      spyTable.mockRestore();
    }
    expect(order.length).toBeGreaterThan(0);

    const RANK = { dawn: 0, morning: 1, 'journey-out': 2, 'journey-back': 3,
      evening: 4, TABLE: 4.5, 'after-table': 5, night: 6 };
    // A round ends at 'night' — split the flat call log back into per-round
    // segments and check each is non-decreasing in beat rank. Round one has
    // no Round Table (no evening/after-table/TABLE); later rounds have all of it.
    let seg = [];
    const segments = [];
    for (const w of order) {
      seg.push(w);
      if (w === 'night') { segments.push(seg); seg = []; }
    }
    expect(segments.length).toBeGreaterThanOrEqual(2); // at least round one + round two

    const tableSegments = segments.filter(s => s.includes('TABLE'));
    expect(tableSegments.length).toBeGreaterThan(0);

    for (const s of segments) {
      const ranks = s.map(w => RANK[w]);
      for (let i = 1; i < ranks.length; i++) {
        expect(ranks[i], `"${s[i]}" fired out of beat order in segment ${JSON.stringify(s)}`)
          .toBeGreaterThan(ranks[i - 1]);
      }
      // 'evening' campaigns for the vote and must sit directly against the
      // table on the near side; 'after-table' reacts to the reveal cascade
      // and must sit directly against it on the far side.
      if (s.includes('TABLE')) {
        const t = s.indexOf('TABLE');
        expect(s[t - 1], `evening did not sit immediately before the table in ${JSON.stringify(s)}`)
          .toBe('evening');
        expect(s[t + 1], `after-table did not sit immediately after the table in ${JSON.stringify(s)}`)
          .toBe('after-table');
      }
    }
  });
});
