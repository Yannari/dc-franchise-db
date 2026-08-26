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
import { registerEvent, eligible, pickEvent, validateRegistry, EVENTS, _resetRegistry }
  from '../js/tr/events.js';
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

  it('a solo firing does not block the same player in an unrelated pair scene', () => {
    // Player scope (solo actor) and pair scope (two-or-more actors) are
    // checked on mutually exclusive actor counts. If they were not, a
    // two-person scene would ALSO write a per-player cooldown for both
    // participants, blurring "this pair had this conversation" with "this
    // person did this at all" — two different narrative guarantees.
    registerEvent({ id: 'soloconfession', family: 'trust', window: 'evening',
      weight: () => 5, fire: () => ({ ok: true }) });
    const soloCtx = { ...ctxFor(3), actors: [CAST[0]] };
    pickEvent(soloCtx, seededRng(4));
    // Same player, later, in a PAIR scene with someone else: event scope has
    // lapsed and pair scope has never seen this pair, so it is offered again.
    const pairCtx = { ...ctxFor(6), actors: [CAST[0], CAST[1]] };
    expect(eligible(pairCtx).map(e => e.id)).toContain('soloconfession');
  });

  it('will not fire a oncePerSeason event twice', () => {
    registerEvent({ id: 'signature', family: 'suspicion', window: 'evening',
      oncePerSeason: true, weight: () => 9, fire: () => ({ ok: true }) });
    pickEvent(ctxFor(), seededRng(3));
    expect(eligible(ctxFor(5)).map(e => e.id)).not.toContain('signature');
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
