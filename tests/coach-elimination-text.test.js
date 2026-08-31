// @vitest-environment jsdom
// Regression coverage for the coach-read-report defects:
//   1. A coach vote-out must read as a vote-out in the text backlog and the
//      season timeline, not "No elimination this episode."
//   2. The === COACHING === section must print BEFORE the fallout events it
//      causes, not after (they used to land in the same `pre` camp-event
//      bucket that prints long before the coaching section).
//
// Reuses the headless-season bootstrap from tests/coach-season.test.js —
// same reasoning documented there applies here (coaches never get a
// `.tribe` field before initGameState, etc).
import { describe, expect, it } from 'vitest';
import { runHeadlessSeason } from './helpers/coach-season.js';
import { getEpisodeEliminations } from '../js/run-ui.js';

describe('a coach voted out reads correctly in the text backlog', () => {
  it('never falls back to "No elimination" on the episode a coach is cut', async () => {
    // Coach boots are probabilistic — run enough seasons to guarantee at
        // least one, matching the sampling approach already used in
    // coach-season.test.js for this same event.
    let found = null;
    for (let i = 0; i < 20 && !found; i++) {
      const season = await runHeadlessSeason({ twist: 'coaches', coachesPerTribe: 2, captureText: true });
      found = season.episodes.find(e => (e.coachElimination || []).length);
    }
    expect(found, 'no coach was ever voted out across 20 sampled seasons').toBeTruthy();

    const ce = found.coachElimination[0];
    expect(found.text).toBeTruthy();

    // The old bug: both of these literal strings appear on a coach-boot
    // episode's text backlog no matter what.
    expect(found.text).not.toMatch(/No elimination this episode\.?\s*$/m);
    expect(found.text.trim().endsWith('No elimination.')).toBe(false);

    // The new behaviour: the coach's name and the fact of the boot appear.
    expect(found.text).toContain(ce.coach);
    expect(found.text.toLowerCase()).toContain('voted out');

    // The season timeline (js/run-ui.js) must also stop reporting nobody
    // left — getEpisodeEliminations is what every timeline/hub view reads.
    expect(getEpisodeEliminations(found.ep)).toContain(ce.coach);
  }, 240000);
});

describe('the coaching section prints before its own fallout', () => {
  it('=== COACHING === appears before the breakthrough/left-off consequence lines it caused', async () => {
    let hit = null;
    for (let i = 0; i < 10 && !hit; i++) {
      const season = await runHeadlessSeason({ twist: 'coaches', coachesPerTribe: 2, captureText: true });
      hit = season.episodes.find(e => e.text && e.text.includes('=== COACHING ===')
        && /BREAKTHROUGH|LEFT OFF AGAIN|PATTERN NOTICED|COMPARING NOTES|BAD ADVICE|DEFENDED THE COACH|PROTEGES COMPARE|CAUGHT BETWEEN COACHES/.test(e.text));
    }
    expect(hit, 'no episode produced both a coaching section and a fallout event to check ordering with').toBeTruthy();

    const coachingIdx = hit.text.indexOf('=== COACHING ===');
    const falloutMarkers = ['[BREAKTHROUGH]', '[LEFT OFF AGAIN]', '[PATTERN NOTICED]', '[COMPARING NOTES]',
      '[BAD ADVICE]', '[DEFENDED THE COACH]', '[PROTEGES COMPARE]', '[CAUGHT BETWEEN COACHES]'];
    for (const marker of falloutMarkers) {
      const idx = hit.text.indexOf(marker);
      if (idx === -1) continue;
      expect(idx, `${marker} appeared before === COACHING === — consequence printed before cause`).toBeGreaterThan(coachingIdx);
    }
  }, 240000);
});
