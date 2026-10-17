// @vitest-environment jsdom
// A night a coach is voted out has its vote talk (the user, 2026-10-16: "i barely got strategy and voting talk again was
// that cause the target was a coach?"). It was: the coach is not one of tonight's voters and ep.eliminated stays empty,
// so director.js votePlan returned nothing, and 11 coach nights of 12 had no plan, no other side and no swing vote.
import { describe, it, expect, vi } from 'vitest';
import { runHeadlessSeason } from './helpers/coach-season.js';
import * as core from '../js/core.js';
import { campFeed } from '../js/td/story/feed.js';

function lcg(seed) { let s = seed >>> 0; return () => ((s = (1664525 * s + 1013904223) >>> 0) / 0x100000000); }

describe('coach nights', () => {
  it('plan the coach out on camera, with a coach\'s reason, and never give a player one', async () => {
    let nights = 0;
    for (const seed of [1001, 1002]) {
      const spy = vi.spyOn(Math, 'random').mockImplementation(lcg(seed));
      let season;
      try { season = await runHeadlessSeason({ twist: 'coaches', coachesPerTribe: 1, captureText: true }); } finally { spy.mockRestore(); }
      const coaches = new Set(season.coachNames);
      for (const ep of core.gs.episodeHistory) {
        const out = (ep.coachElimination || [])[0]?.coach;
        if (!ep.campStory) continue;
        const votes = Object.keys(ep.campStory).flatMap(c => ['pre', 'post'].flatMap(ph => campFeed(ep, c, ph))).filter(s => s.storyType === 'vote');
        // a coach's reason is only ever about a coach
        for (const s of votes.filter(s => /\.coach$/.test(s.kind || ''))) expect(coaches.has(s.scene?.data?.target), `ep${ep.num} ${s.kind} on ${s.scene?.data?.target}`).toBe(true);
        if (!out || ep.eliminated) continue;
        nights++;
        const plan = votes.find(s => s.step === 'plan' && s.scene?.data?.target === out);
        expect(plan, `ep${ep.num}: no plan on ${out}`).toBeTruthy();
        expect(plan.kind).toMatch(/\.coach$/);
      }
    }
    expect(nights).toBeGreaterThan(1);
  }, 600000);
});
