// A day airs in the order a day has (the user, 2026-10-16: "why is night out before [sunset] and right after
// morning at the villa it doesnt make much sense"). A scene whose lines remembered "this morning" was moved to the
// top of the day, and the club went with it; a party spark drew a breakfast scene. On a day with a daily: no night
// out and no sunset before the daily, and the viewer never opens a Night out chapter before The daily.
import { describe, it, expect, beforeAll } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { challengeRows } from '../js/ch-run.js';
import { chStepScreens } from '../js/vp-ch-ep/steps.js';
import { challengeCast } from './helpers/ch-cast.js';

describe('the order of a day', () => {
  const runs = [];
  beforeAll(() => {
    for (const seed of [631, 632, 633]) {
      const { cast, names, background } = challengeCast(24, seed);
      setPlayers(cast);
      const r = playChallengeSeason({ cast: names, background, seed });
      airSeason(r.state);
      runs.push(r);
    }
  });

  it('airs the night out and the sunset after that day\'s daily', () => {
    const bad = [];
    for (const r of runs) for (const e of r.episodes) {
      const aired = e.aired || [];
      for (const [i, a] of aired.entries()) {
        const d = aired.findIndex(x => x.kind === 'daily' && x.day === a.day);
        if (d < 0 || i > d) continue;
        if (a.scene?.spot === 'party' || a.kind.startsWith('party') || a.kind === 'sunset-talk') bad.push(`ep${e.ep} ${a.kind} before the daily`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('never opens a Night out chapter before The daily', () => {
    const bad = [];
    for (const r of runs) for (const row of challengeRows(r)) {
      const keys = chStepScreens(row).map(s => s.key);
      const p = keys.indexOf('party'), d = keys.indexOf('daily');
      if (p >= 0 && d >= 0 && p < d) bad.push(`ep${row.num}: ${keys.join(' > ')}`);
    }
    expect(bad).toEqual([]);
  });

  it('does not set a scene at the club at breakfast', () => {
    const bad = [];
    for (const r of runs) for (const e of r.episodes) for (const a of e.aired || []) {
      if (a.scene?.spot !== 'party') continue;
      for (const l of a.script?.lines || []) if (l.kind === 'beat' && /\bbreakfast\b/i.test(l.text)) bad.push(`ep${e.ep} ${a.kind}: ${l.text}`);
    }
    expect(bad).toEqual([]);
  });
});
