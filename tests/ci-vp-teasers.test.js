// ci-vp-teasers.test.js — Previously, Coming up, Next time (vp-ci/teasers.js).
// User (2026-09-30): "we need a coming up next episode ... to really feel like
// a complete episode of a reality show". The rule a teaser lives by: it may
// recap what aired, and it never shows how something still to come ENDS.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { circleScreens } from '../js/vp-ci/steps.js';
import { withTeasers, cutLine } from '../js/vp-ci/teasers.js';
import { stageInner } from '../js/vp-ci/stage.js';
import { soundFor, bedFor } from '../js/vp-ci/sound.js';
import { rosterCast, circleSetup } from './helpers/ci-cast.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';

const cast = rosterCast(12);
setPlayers(cast);
const names = cast.map(p => p.name);
const { rows } = playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed: 4 });
const aired = (row, i) => withTeasers(row, circleScreens(row), { prev: rows[i - 1] || null, next: rows[i + 1] || null, screensOf: circleScreens });
const all = rows.map(aired);
const OUTCOME = /^(result\.|rate\.|block\.|vote\.|goodbye\.|reveal\.|meet\.|visit\.|final\.)/;

describe('where the teasers go', () => {
  it('Previously opens every episode but the first, and comes first', () => {
    expect(all[0].some(s => s.teaser === 'previously')).toBe(false);
    for (const sc of all.slice(1)) expect(sc[0].teaser).toBe('previously');
  });
  it('Next time closes every episode but the finale', () => {
    all.slice(0, -1).forEach(sc => expect(sc.at(-1).teaser).toBe('nexttime'));
    expect(all.at(-1).some(s => s.teaser === 'nexttime')).toBe(false);
  });
  it('most episodes have a Coming up, and it never opens the day', () => {
    const withBreak = all.filter(sc => sc.some(s => s.teaser === 'comingup'));
    expect(withBreak.length).toBeGreaterThanOrEqual(Math.floor(rows.length * 0.6));
    for (const sc of withBreak) expect(sc.findIndex(s => s.teaser === 'comingup')).toBeGreaterThanOrEqual(3);
  });
});

describe('what a teaser may show', () => {
  it('Coming up and Next time never show how anything ends', () => {
    // A clip remembers nothing of its key, so check the lines they were cut from.
    for (const [i, sc] of all.entries()) {
      const later = [...circleScreens(rows[i]), ...(rows[i + 1] ? circleScreens(rows[i + 1]) : [])];
      const outcomeTexts = new Set(later.flatMap(s => s.steps).filter(x => OUTCOME.test(x.key || '')).map(x => cutLine(x.text)));
      for (const t of sc.filter(s => s.teaser === 'comingup' || s.teaser === 'nexttime')) {
        for (const st of t.steps.filter(x => x.clip)) expect(outcomeTexts.has(st.text), st.text).toBe(false);
      }
    }
  });
  it('a teased line is cut off; a recap line is whole', () => {
    const c = all.flat().filter(s => s.teaser === 'nexttime').flatMap(s => s.steps.filter(x => x.clip));
    expect(c.length).toBeGreaterThan(3);
    expect(c.filter(x => x.text.endsWith('…')).length / c.length).toBeGreaterThan(0.5);
    const p = all.flat().filter(s => s.teaser === 'previously').flatMap(s => s.steps.filter(x => x.clip));
    expect(p.every(x => !x.text.endsWith('…') || x.text.length > 0)).toBe(true);
  });
  it('every clip has a face, a speaker and where it came from; mostly different speakers', () => {
    for (const t of all.flat().filter(s => s.teaser)) {
      const clips = t.steps.filter(x => x.clip);
      for (const st of clips) { expect(st.clip.real).toBeTruthy(); expect(st.clip.where).toBeTruthy(); }
      if (clips.length >= 3) expect(new Set(clips.map(x => x.clip.real)).size).toBeGreaterThanOrEqual(2);
    }
  });
  it('cutLine stops at the first sentence, or before the last words', () => {
    expect(cutLine("I know that face from somewhere. Circle, enlarge the photo.")).toBe('I know that face from somewhere…');
    expect(cutLine('Short one.')).toBe('Short one.');
  });
});

describe('on screen', () => {
  it('draws the band, the clip and the dots; a whoosh on each clip, suspense under it', () => {
    const t = all[2].find(s => s.teaser === 'previously');
    const k = t.steps.findIndex(x => x.clip);
    const html = stageInner(rows[2], t, k, true);
    expect(html).toMatch(/PREVIOUSLY ON/);
    expect(html).toMatch(/civ-tz-clip/);
    expect(html).toMatch(/civ-tz-dots/);
    expect(soundFor(t, k).cue).toBe('ci-whoosh');
    expect(bedFor(t)).toMatch(/ci-drama/);
  });
});
