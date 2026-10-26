// ══════════════════════════════════════════════════════════════════════
// pm-just-friends.test.js — "better as friends" sticks (pm/just-friends.js)
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-26: "when they decide to stay friends… do they only act
// as friends now?" They did not: the kissing ban lasted two episodes, and a
// couple of friends were kissing on the daybeds after it. And: "Casa Amor
// shouldn't consider them taken if they didn't rekindle". Measured on twenty
// seasons when it was built: 72 friends endings, 0 romantic scenes between a
// pair after it, 5 rekindles in 12 asks, 1 couple of friends at a final.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playPerfectMatchSeason } from '../js/pm/season.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';

const ROMANTIC = new Set(['kiss', 'chat', 'deep-chat', 'bed-chat', 'love-said', 'love-hanging', 'exclusive-ask', 'official-ask',
  'close-off', 'challenge-win', 'hideaway', 'reassurance']);
const key = (a, b) => [a, b].sort().join('|');

function season(seed) {
  const cast = makeIslanders(22, seed);
  setPlayers(cast);
  const names = cast.map(p => p.name);
  return playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed }).rows;
}

describe('friends after "better as friends"', () => {
  const seasons = [2, 3, 7].map(season);

  it('act only as friends until they rekindle, and get scenes of their own', () => {
    let endings = 0, scenes = 0;
    const bad = [];
    seasons.forEach((rows, i) => {
      const since = {};
      for (const r of rows) for (const e of r.pm.events) {
        const [a, b] = e.players || [];
        if (e.kind === 'doubt-end' && e.extra?.of === 'friends') { since[key(a, b)] = r.num; endings++; continue; }
        // Back together: a second chance, "Back on?", or picking each other at a recoupling with the feeling back.
        if ((e.kind === 'reunite' || (e.kind === 'rekindle' && e.extra?.of === 'yes') || (e.kind === 'recouple-pick' && e.extra?.exPick === 'rekindled')) && a && b) delete since[key(a, b)];
        if (e.kind === 'just-friends') scenes++;
        if (a && b && since[key(a, b)] != null && since[key(a, b)] < r.num && ROMANTIC.has(e.kind)) bad.push(`season ${i} ep ${r.num} ${e.kind} ${a}+${b}`);
      }
    });
    expect(endings, 'friends endings to test against').toBeGreaterThan(3);
    expect(bad).toEqual([]);
    // Some endings go bitter, or one of them is dumped, before a scene is due:
    // measured 2026-10-26, 55 scenes for 44 endings over ten seasons, but as few
    // as 2 for 7 in one (season 3). On three seasons, more than half is the bar.
    expect(scenes).toBeGreaterThan(endings / 2);
  });

  it('a couple of friends at the final is not played as a love story', () => {
    for (const rows of seasons) {
      const fin = rows.find(r => r.moment === 'final');
      for (const e of fin?.pm.events || []) {
        if (!['final-date', 'journey-end', 'declaration'].includes(e.kind) || !e.extra?.mates) continue;
        const text = (e.script?.lines || []).map(l => l.text).join(' ');
        expect(text, `${e.kind}: ${text}`).not.toMatch(/\b(love you|in love|kiss(es|ed)?)\b/i);
      }
    }
  });
});
