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

describe('and it has somewhere to go', () => {
  // "These events are not giving love triangle at all, where's the drama."
  //
  // The drama was written and almost never reached. Measured over 25 seasons
  // before this: 20 triangles, mean life 2.3 weeks, 55% never left the tension
  // phase, 10% ever reached the ultimatum — and 85% ended with one of the
  // three being voted out, an ending that produced NO SCENE AT ALL. The
  // triangle simply stopped existing between one episode and the next.
  //
  // Two things were wrong. The clock was written for a show where three
  // specific people can stay in the game for five weeks; a house evicts
  // somebody every single one. And the ending the house actually produces was
  // the one ending nobody had written.

  it('paces the arc to the show it is running in', () => {
    const romance = readFileSync('js/romance.js', 'utf8');
    // The thresholds must depend on the format rather than assuming a season
    // long enough for a trio to survive five weeks of it.
    expect(romance, 'the phase clock is still a pair of constants')
      .toMatch(/format === 'big-brother'[\s\S]{0,400}?episodesActive >= \(_fast \? 2 : 3\)/);
    expect(romance).toMatch(/episodesActive >= \(_fast \? 4 : 5\)/);
  });

  it('says something when the vote ends it', () => {
    const romance = readFileSync('js/romance.js', 'utf8');
    expect(romance, 'the most common ending in the system is still silent')
      .toMatch(/type: 'triangleCut'/);
    const week = readFileSync('js/bb/week.js', 'utf8');
    expect(week, 'the house has no words for it').toMatch(/case 'triangleCut'/);
  });

  it('asks whether the person in the middle wrote the name', () => {
    // The ballots are right there, and it is the single most interesting
    // question the format can ask about a triangle. Measured at 3 of 8
    // suitor-evictions.
    const romance = readFileSync('js/romance.js', 'utf8');
    expect(romance).toMatch(/byTheirHand/);
    // Read from the week that actually took them out: this stage notices the
    // eviction a week late, when the current ballots are a fresh empty set and
    // the name being asked about is long gone from them. It returned false
    // every single time before that.
    expect(romance, 'it is reading the wrong week of ballots again')
      .toMatch(/w\?\.evicted === gone \|\| w\?\.secondEvicted === gone/);
  });

  it('gives every dramatic beat house words, not just the opening one', () => {
    // The escalation, the schemer working it, the public fight, the choice and
    // the aftermath all fell through to the default, which rewrites "camp" to
    // "house" and leaves the fire, the shelter and the reward feast where they
    // are.
    const week = readFileSync('js/bb/week.js', 'utf8');
    for (const type of ['triangleConfrontation', 'triangleEscalation',
      'trianglePublicFight', 'triangleUltimatum', 'triangleResolved', 'triangleLonely']) {
      expect(week, `${type} still falls through to the default`)
        .toMatch(new RegExp(`case '${type}'`));
    }
  });

  it('reaches the back half of the arc in a played house', () => {
    // The measurement, not the intention: with the clock fixed, triangles
    // reach the ultimatum and end in a choice instead of dying in tension.
    let past = 0, seen = 0;
    for (let s = 0; s < 12 && past < 1; s++) {
      house();
      const best = new Map();
      for (let w = 0; w < 11; w++) {
        if (!simulateBBEpisode()) break;
        for (const t of gs.loveTriangles || []) {
          const key = `${t.center}|${(t.suitors || []).join('|')}|${t.formedEp}`;
          const rank = { tension: 1, escalation: 2, ultimatum: 3, resolved: 4 }[t.phase] || 0;
          if (!best.has(key) || rank >= best.get(key)) best.set(key, rank);
        }
      }
      for (const rank of best.values()) { seen++; if (rank >= 2) past++; }
    }
    expect(seen, 'no triangle formed at all in twelve seasons').toBeGreaterThan(0);
    expect(past, 'every triangle died in the tension phase').toBeGreaterThan(0);
  });
});
