// ══════════════════════════════════════════════════════════════════════
// pm-breakups.test.js — every break-up has a reason and a reaction (pm/breakups.js)
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-26: "stay as friends is often the decision of one person,
// it doesn't mean it was consensual and the person on the receiving end took
// it well; jealousy could still be there, especially if it's recent; the
// public could take the side of the one being dumped or not, depending on
// whether it's a justified break-up or a selfish one; do that for all
// break-ups, and not all of them should be friendly."
// Measured on twenty seasons when it was built: 120 break-ups (moved on 57,
// cheated 26, cooling 15, clash 13, triangle 8, played 1); friends 49%, hurt
// 16%, bitter 35%; the one who ended a fair break-up +1.3 with the public, a
// selfish one -0.6; about six stings a season.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playPerfectMatchSeason } from '../js/pm/season.js';
import { SPLIT_CAUSES } from '../js/pm/breakups.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';

function season(seed) {
  const cast = makeIslanders(22, seed);
  setPlayers(cast);
  const names = cast.map(p => p.name);
  return playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed }).rows;
}

describe('break-ups', () => {
  const seasons = [1, 2, 5, 6, 9, 11].map(season);
  const splits = seasons.flatMap(rows => rows.flatMap(r => r.pm.events.filter(e => e.extra?.splitRec).map(e => ({ e, s: e.extra.splitRec }))));

  it('each one says who ended it, why, how fair it was and how it was taken', () => {
    expect(splits.length).toBeGreaterThan(15);
    for (const { s } of splits) {
      expect(SPLIT_CAUSES).toContain(s.cause);
      expect(['friends', 'hurt', 'bitter']).toContain(s.mood);
      expect(s.fair).toBeGreaterThanOrEqual(0);
      expect(s.fair).toBeLessThanOrEqual(1);
      expect([s.by, s.left]).toContain(s.holder);
      expect(s.by).not.toBe(s.left);
    }
  });

  it('they are not all friendly, and being cheated on rarely is', () => {
    const moods = new Set(splits.map(x => x.s.mood));
    expect([...moods].sort()).toEqual(['bitter', 'friends', 'hurt']);
    const cheated = splits.filter(x => x.s.cause === 'cheated');
    expect(cheated.length).toBeGreaterThan(3);
    expect(cheated.filter(x => x.s.mood === 'friends').length / cheated.length).toBeLessThan(0.45);
  });

  it('the public judges a selfish break-up harder than a fair one', () => {
    const avg = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
    const byPop = x => x.e.pop?.[x.s.by]?.approval ?? 0;
    const fair = splits.filter(x => x.s.fair >= 0.6).map(byPop);
    const selfish = splits.filter(x => x.s.fair <= 0.4).map(byPop);
    expect(fair.length).toBeGreaterThan(3);
    expect(selfish.length).toBeGreaterThan(3);
    expect(avg(selfish)).toBeLessThan(avg(fair) - 0.5);
  });

  it('an ex still holding a torch feels it when the other moves on', () => {
    const stings = seasons.flatMap(rows => rows.flatMap(r => r.pm.events.filter(e => e.kind === 'ex-sting')));
    expect(stings.length).toBeGreaterThan(seasons.length);
    for (const e of stings) expect(e.extra.about, 'who they were seen with').toBeTruthy();
  });
});
