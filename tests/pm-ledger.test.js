import { describe, expect, it } from 'vitest';
import { createLedger, noteArrival, recordAired, closeEpisode, coupleScore, followers,
  labelFor, nudgeBelief, readApproval, CAP, FIRST_CAP, MAJOR_CAP, SCENE_GAIN, POP_SCALE, FIRST_WINDOW } from '../js/pm/ledger.js';

const S = FIRST_WINDOW;   // the first episode after the first-impression window is S + 1

const settled = () => {           // an islander past the first-impression window
  const L = createLedger();
  noteArrival(L, 'A', 1);
  for (let ep = 1; ep <= S; ep++) closeEpisode(L, ep);
  return L;
};

describe('per-episode caps', () => {
  it('holds an ordinary episode to the cap', () => {
    const L = settled();
    recordAired(L, { who: 'A', approval: 80 });
    expect(closeEpisode(L, S + 1).A.applied).toBe(CAP);
  });
  it('doubles it in the first-impression window', () => {
    const L = createLedger(); noteArrival(L, 'A', 1);
    recordAired(L, { who: 'A', approval: 80 });
    expect(closeEpisode(L, 1).A.applied).toBe(FIRST_CAP);
  });
  it('lifts it for a major moment', () => {
    const L = settled();
    recordAired(L, { who: 'A', approval: -90, major: true });
    expect(closeEpisode(L, S + 1).A.applied).toBe(-MAJOR_CAP);
  });
  it('writes gs.popularity at the show scale', () => {
    const L = settled(); const pop = {};
    const scene = 1 / SCENE_GAIN;                    // one scene's worth of raw
    recordAired(L, { who: 'A', approval: 4 * scene });
    const { applied } = closeEpisode(L, S + 1, pop).A;   // 0.75 * 4 = 3
    expect(applied).toBe(3);
    expect(pop.A).toBe(3 * POP_SCALE);
  });
});

describe('labels hold for two episodes before they change', () => {
  it('does not flip on one episode', () => {
    const L = settled();
    L.approval.A = 30; L.label.A = 'loved';
    recordAired(L, { who: 'A', approval: -40 });  // capped at -12 → 18: liked
    expect(closeEpisode(L, S + 1).A.label).toBe('loved');
    expect(closeEpisode(L, S + 2).A.label).toBe('liked');
  });
  it('never moves more than two tiers at once without a major moment', () => {
    const L = settled();
    L.approval.A = 30; L.label.A = 'loved'; L.pending.A = 'disliked';
    L.approval.A = -30;                             // held in "disliked" for the second close
    expect(closeEpisode(L, S + 1).A.label).toBe('invisible');   // loved → invisible, two tiers
  });
  it('a major moment moves the label at once, however far', () => {
    const L = settled();
    L.approval.A = 30; L.label.A = 'loved';
    L.approval.A = 0;
    recordAired(L, { who: 'A', approval: -90, major: true });   // -35 → -35: disliked
    expect(closeEpisode(L, S + 1).A.label).toBe('disliked');
  });
  it('bands match the spec', () => {
    expect(labelFor(60)).toBe('fan-favourite');
    expect(labelFor(0)).toBe('invisible');
    expect(labelFor(-61)).toBe('villain');
  });
});

describe('a star carries a hated partner', () => {
  it('+70 and -50 score +28 before belief', () => {
    const L = createLedger(); L.approval.A = 70; L.approval.B = -50;
    expect(coupleScore(L, 'A', 'B')).toBeCloseTo(28, 5);
    nudgeBelief(L, 'A', 'B', 5);
    expect(coupleScore(L, 'B', 'A')).toBeCloseTo(33, 5);
  });
});

describe('followers come from fame, scaled by approval', () => {
  it('a heavily aired villain out-gains a quiet favourite; equal airtime favours the loved', () => {
    const L = createLedger();
    L.fame = { villain: 100, quiet: 20, star: 100 };
    L.approval = { villain: -80, quiet: 60, star: 80 };
    expect(followers(L, 'villain')).toBeGreaterThan(followers(L, 'quiet'));
    expect(followers(L, 'star')).toBeGreaterThan(followers(L, 'villain'));
    expect(readApproval(L, 'nobody')).toBe(0);
  });
});
