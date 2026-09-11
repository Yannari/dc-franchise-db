// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-team-night.test.js — a team challenge, and what each screen may know
// ══════════════════════════════════════════════════════════════════════
//
// TWO DEFECTS ON ONE SCREENSHOT of a girl group night.
//
// 1. The maxi screen drew the winning team in gold with "— took it" beside its
//    name, at the TOP, before a single performance had been revealed — and
//    every queen on that team wore a "winning team" tag on her own card. The
//    reader was told who won and then invited to click through thirteen cards
//    finding out how. The three-step rule in docs/drag-race.md is the same
//    point from the other end: what she did, then what the panel thought, then
//    what the host decided. A screen showing performances cannot know the
//    third one.
//
// 2. The prep step had one card on it. js/dr/chal/girl-group.js has emitted
//    `recording-booth` since it was written — every queen's verse score and
//    whether the booth went well — and NOTHING HAS EVER READ IT. The queens
//    wrote and recorded off-screen. Same bug the Rumix's `studio-day` had, in
//    the module next door.
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { rpBuildMaxi } from '../js/vp-dr/challenge.js';
import { rpBuildResults } from '../js/vp-dr/results.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const cast = (n, seed) => {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Queen${i + 1}`, slug: `queen${i + 1}`, gender: 'f', archetype: 'hero', age: 25,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
};
// A team night is BOOKED, not hoped for — a seed that happens to draw one
// stops happening the moment anything upstream draws one fewer random number.
const { rows } = playDragSeason({
  cast: cast(12, 6), seed: 3,
  config: { drSchedule: [{ episode: 3, maxiId: 'girl-group' }] },
});
const row = rows.find(r => r.dr.challenge?.id === 'girl-group');

describe('the maxi screen on a team night', () => {
  it('is there to test', () => {
    expect(row, 'the booked girl group did not happen').toBeTruthy();
    expect((row.dr.assignment.teams || []).length).toBeGreaterThan(1);
  });

  it('does not say which team won', () => {
    const html = rpBuildMaxi(row);
    expect(html.length).toBeGreaterThan(400);
    expect(html, 'the board announces the winner above the performances')
      .not.toMatch(/took it/);
    expect(html, 'a queen&apos;s own card gives the result away')
      .not.toMatch(/winning team/);
    expect(html, 'the winning team is still highlighted in gold')
      .not.toMatch(/dr-won/);
  });

  it('still names both teams and everybody on them', () => {
    /* The fix is to stop announcing the RESULT, not to stop showing the
       line-up — which is the one thing this screen is for. */
    const html = rpBuildMaxi(row);
    for (const team of row.dr.assignment.teams) {
      for (const n of team) expect(html, `${n} is not on the board`).toContain(n);
    }
    expect((html.match(/class="dr-team"/g) || []).length)
      .toBe(row.dr.assignment.teams.length);
  });
});

describe('the call on a team night', () => {
  it('names the team beside every queen', () => {
    /* Where the winning team belongs: the host announces it, and it needs no
       card of its own — the WIN row reads as "the winning team is X, and the
       winner is Y" at the moment that row is revealed. Her own team is not a
       spoiler; WHICH team won is, and that is only legible once the calls are
       on the screen. */
    const html = rpBuildResults(row);
    expect((html.match(/dr-callteam/g) || []).length).toBeGreaterThan(3);
  });
});

describe('the recording booth', () => {
  it('reaches a screen at all', () => {
    const booth = (row.dr.scenes || [])
      .filter(s => s.step === 'prep' && /booth-session/.test(s.kind || '') && s.text);
    expect(booth.length, 'the queens recorded their verses off-screen again')
      .toBeGreaterThan(3);
  });

  it('gives each queen her own session, not one card for the room', () => {
    const booth = (row.dr.scenes || [])
      .filter(s => s.step === 'prep' && /booth-session/.test(s.kind || '') && s.text);
    const who = booth.flatMap(s => s.data?.players || []);
    expect(new Set(who).size, 'two queens share a booth card').toBe(who.length);
  });

  it('tiers off what the module decided, not off nothing', () => {
    /* `booth[n]` is girl-group.js's own verdict on whether she could sing it
       and `verse[n]` is the writing. A renderer that recomputed either would
       be a screen holding a second opinion about what happened. */
    const rec = (row.dr.scenes || []).find(s => s.kind === 'recording-booth');
    expect(rec, 'the module stopped emitting the scene').toBeTruthy();
    const booth = (row.dr.scenes || [])
      .filter(s => /booth-session/.test(s.kind || '') && s.text);
    const tiers = new Set(booth.map(s => s.data?.tier));
    expect(tiers.size, 'every queen had the same session').toBeGreaterThan(1);
    for (const s of booth) {
      const n = (s.data?.players || [])[0];
      const sang = Number(rec.data.booth[n]) > 0;
      // The two good tiers belong to the queens the module said could sing it.
      const good = ['got-it-on-tape', 'clean-session'].includes(s.data.tier);
      expect(good, `${n}: booth ${rec.data.booth[n]} drew ${s.data.tier}`).toBe(sang);
    }
  });
});
