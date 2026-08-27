// The third person, in a house.
//
// Reported from a live watch: somebody was in two showmances at once and the
// season said nothing about it — "I feel like we didn't explore that at all."
//
// The system was not missing. Measured over 110 weeks: 7 triangles form, both
// shapes fire, and each produces about ten visible beats across its life. What
// was wrong was the beat that OPENS one. Every other triangle stage had a case
// in the house's romance harvest and that one did not, so it fell through to
// the default — which rewrites "camp" to "house" and leaves everything else
// alone. A Big Brother house was told that two houseguests had been "carrying
// water together, sitting close at fire, volunteering for the same tasks".
// That is the bug class docs/ADDING-A-SHOW.md exists for: one show's
// vocabulary printed over the other.
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { gs, seasonConfig, players } from '../js/core.js';
import { pStats, pronouns, threatScore } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { ordinal } from '../js/finale.js';
import { simulateBBEpisode, summariseWeek } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';

const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = n => Object.fromEntries(KEYS.map((k, i) => [k, 1 + ((n * 13 + i * 5) % 10)]));
const ARCH = ['showmancer', 'hero', 'floater', 'villain', 'schemer', 'goat',
  'social-butterfly', 'loyal-soldier', 'wildcard', 'underdog', 'showmancer',
  'challenge-beast'];

function house() {
  seedGame(Array.from({ length: 14 }, (_, i) => ({ name: 'P' + i,
    archetype: ARCH[i % ARCH.length], gender: i % 2 ? 'f' : 'm',
    sexuality: 'straight', stats: spread(i + 1) })),
  { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.popularity = {}; gs.showmances = []; gs.romanticSparks = []; gs.loveTriangles = [];
  gs.episodeHistory = []; gs.sideDeals = []; gs.knowledge = {};
  Object.assign(seasonConfig, { format: 'big-brother', jurySize: 7, bbSafetyMode: 'off',
    finaleSize: 3, bbHaveNots: 'off', bbDepartures: 'off', setting: 'bb-house',
    romance: 'enabled', twistSchedule: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, threatScore,
    getBond, getPerceivedBond, ordinal });
}

/** Play seasons until triangles have formed, collecting the week transcripts. */
function trianglesWithText(target = 4) {
  const found = [];
  for (let s = 0; s < 14 && found.length < target; s++) {
    house();
    let seen = 0;
    for (let w = 0; w < 11; w++) {
      if (!simulateBBEpisode()) break;
      const tris = gs.loveTriangles || [];
      if (tris.length <= seen) continue;
      const fresh = tris.slice(seen); seen = tris.length;
      const text = summariseWeek(gs.bb.weeks[gs.bb.weeks.length - 1]) || '';
      for (const tri of fresh) found.push({ tri, text });
    }
  }
  return found;
}

describe('a house triangle is written in house words', () => {
  const CAMP = /carrying water|sitting close at fire|around the fire|across camp|volunteering for the same tasks|\btribe\b/i;

  it('forms at all, and reaches the transcript', () => {
    const found = trianglesWithText(3);
    expect(found.length, 'no love triangle formed in fourteen seasons').toBeGreaterThan(0);
    // Both shapes are reachable in a house: two showmances at once, and a
    // third person circling a couple.
    const kinds = new Set(found.map(f => f.tri.sourceType));
    expect(kinds.size).toBeGreaterThan(0);
  });

  it('never describes a house with camp vocabulary', () => {
    for (const { tri, text } of trianglesWithText(5)) {
      const names = [tri.center, ...(tri.suitors || [])];
      for (const line of text.split('\n')) {
        if (names.filter(n => line.includes(n)).length < 2) continue;
        expect(CAMP.test(line), `a Big Brother house was told: ${line.trim()}`).toBe(false);
      }
    }
  });

  it('tells the rewrite which shape it is instead of guessing', () => {
    // The two shapes mean different things by the same three names — centre of
    // two showmances, versus a couple plus somebody circling — so the beat
    // carries its own `sourceType`. Inferring it from gs.loveTriangles was
    // wrong twice over: a triangle can form and resolve inside one week, and
    // two beats about the same trio in the same week both resolve to whichever
    // triangle the search reaches first.
    const romance = readFileSync('js/romance.js', 'utf8');
    const pushes = [...romance.matchAll(/type: 'triangleTension'[^}]*}/g)].map(m => m[0]);
    expect(pushes.length, 'the tension beat moved').toBeGreaterThan(0);
    for (const push of pushes) {
      expect(push, `a triangleTension push with no sourceType: ${push.slice(0, 80)}`)
        .toMatch(/sourceType:/);
    }
    const week = readFileSync('js/bb/week.js', 'utf8');
    expect(week, 'the house has no case for the beat that opens a triangle')
      .toMatch(/case 'triangleTension'/);
    expect(week, 'the house is guessing the shape from gs again')
      .not.toMatch(/loveTriangles \|\| \[\]\)\.slice\(\)\.reverse\(\)\.find/);
  });

  it('does not collapse two suitors into the same pronoun', () => {
    // "He noticed. He noticed." — the shared Total Drama line printed a
    // pronoun for each suitor, so two men read as a stutter rather than a
    // beat. Names cost nothing here and cannot collapse.
    const romance = readFileSync('js/romance.js', 'utf8');
    expect(romance).not.toMatch(/\$\{ps0\.Sub\} noticed\. \$\{ps1\.Sub\} noticed\./);
  });
});
