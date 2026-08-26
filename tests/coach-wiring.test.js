import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = f => readFileSync(f, 'utf8');

describe('the twist is reachable', () => {
  it('is in the catalog with a phase and a style', () => {
    const core = read('js/core.js');
    expect(core).toMatch(/id:\s*'coaches'/);
    expect(core, 'the randomizer needs a style').toMatch(/id:\s*'coaches'[\s\S]{0,400}chalStyle/);
  });

  it('sets its flag in applyTwist', () => {
    expect(read('js/twists.js')).toMatch(/engineType === 'coaches'/);
  });

  it('runs the block and promotes at the merge', () => {
    const ep = read('js/episode.js');
    expect(ep).toMatch(/runCoachingBlock\(/);
    expect(ep).toMatch(/promoteCoaches\(/);
  });

  it('survives a reload — the data is on the episode history', () => {
    // Missing this is why a VP shows nothing on replay. Every push needs it.
    const ep = read('js/episode.js');
    const pushes = ep.split('gs.episodeHistory.push').length - 1;
    const carried = ep.split('coachData:').length - 1;
    expect(carried, `${pushes} history pushes, ${carried} carry coachData`).toBe(pushes);
  });

  it('is on the module spread and the timeline', () => {
    expect(read('js/main.js')).toMatch(/coach-episode\.js/);
    expect(read('js/run-ui.js')).toMatch(/isCoaches/);
  });

  it('every runTribal(...) result is routed through the shared coach-elimination gate', () => {
    // A coach voted out at a runTribal call site that skips this gate is a
    // silent no-op: they were never in gs.activePlayers, so contestant-only
    // elimination code does nothing and the coach quietly stays a coach with
    // their training intact. One shared helper (not four pasted branches) is
    // required so the sites can't drift apart later.
    const ep = read('js/episode.js');
    const runTribalCalls = ep.match(/runTribal\(/g)?.length || 0;
    const gateCalls = ep.match(/applyCoachElimination\(ep,/g)?.length || 0;
    // One `runTribal(` match is the function's own declaration, not a call site.
    expect(gateCalls, `${runTribalCalls} runTribal( occurrences (incl. the declaration), ${gateCalls} routed through applyCoachElimination`).toBe(runTribalCalls - 1);
  });
});
