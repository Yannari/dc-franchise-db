// ci-depth.test.js — does a game air like a game on the real show?
//
// Plan 3a shipped games that aired 10-17 lines each; the real show gives a
// game 30-170 sentences (US transcripts: Most Likely ~30, Ice Breaker ~67,
// Ask Me Anything ~163, Trivia Night ~171). This test plays five seasons
// and fails any aired game that is thinner than its family's minimum or
// missing a phase the real show always has.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { blockText } from '../js/ci/transcript.js';
import { GAMES } from '../js/ci/games-data.js';
import { POOLS } from '../js/ci/lines/index.js';
import { makePlayers, makePool, circleSetup } from './helpers/ci-cast.js';

export const DEPTH = {
  statement: { lines: 45, phases: ['announce', 'round', 'aftermath'] },
  name: { lines: 40, phases: ['announce', 'round', 'aftermath'] },
  ask: { lines: 45, phases: ['announce', 'prep', 'round', 'aftermath'] },
  guess: { lines: 40, phases: ['announce', 'prep', 'round', 'aftermath'] },
  make: { lines: 45, phases: ['announce', 'prep', 'reveal', 'verdict'] },
  photo: { lines: 35, phases: ['announce', 'prep', 'round', 'verdict'] },
  team: { lines: 60, phases: ['announce', 'prep', 'round', 'verdict'] },
  gift: { lines: 35, phases: ['announce', 'prep', 'reveal', 'aftermath'] },
  rival: { lines: 40, phases: ['announce', 'round', 'aftermath'] },
  flirt: { lines: 35, phases: ['announce', 'prep', 'round', 'verdict'] },
};

/** A season with the transcript harness's cast, including a shared pair. */
export function seasonWithPair(seed) {
  const cast = makePlayers(13, seed);
  Object.assign(cast[1], { name: 'Mateo', age: 26, stats: { ...cast[1].stats, social: 8, boldness: 8, strategic: 4 } });
  Object.assign(cast[3], { name: 'Luis', age: 31, stats: { ...cast[3].stats, social: 5, boldness: 3, strategic: 8 } });
  setPlayers(cast);
  const names = cast.map(p => p.name);
  const setup = circleSetup(names, { newcomers: 5 });
  Object.assign(setup.Mateo, { catfish: 'never', face: 'Mateo', brain: 'Luis' });
  Object.assign(setup.Luis, { catfish: 'never', partner: 'Mateo', facts: ['three kids at home'] });
  return playCircleSeason({ cast: names, setup, pool: makePool(6, seed), seed });
}

describe('every game airs in full', () => {
  it('meets its family\'s depth, with every phase and every round', () => {
    const thin = [], missing = [], rounds = [], seen = {};
    for (const seed of [2, 7, 19, 31, 44]) {
      const { state } = seasonWithPair(seed);
      for (const sc of state.scenes.filter(x => x.kind === 'game' && x.aired)) {
        const g = GAMES.find(x => x.id === sc.data.gameId);
        const need = DEPTH[g.family];
        // Fewer players, fewer answers to air: the real show's segments scale
        // with the room. Full minimum at eight or more players; 90% at five.
        const min = Math.round(need.lines * Math.min(1, 0.7 + sc.seenBy.length * 0.04));
        const lines = sc.script.blocks.reduce((n, b) => n + blockText(state, b).filter(l => l.trim()).length, 0);
        (seen[g.family] ||= []).push(lines);
        if (lines < min) thin.push(`${seed}:${g.id} ${lines}/${min} (${sc.seenBy.length} players)`);
        const phases = new Set(sc.script.blocks.map(b => b.phase));
        for (const p of need.phases) if (!phases.has(p)) missing.push(`${seed}:${g.id} no ${p}`);
        if (['statement', 'name'].includes(g.family)) {
          const shown = new Set(sc.script.blocks.filter(b => b.phase === 'round').map(b => b.round));
          if (shown.size < sc.data.rounds.length) rounds.push(`${seed}:${g.id} ${shown.size}/${sc.data.rounds.length} rounds`);
        }
      }
    }
    const avg = a => Math.round(a.reduce((x, y) => x + y, 0) / a.length);
    console.log('\n  lines per game (mean, min):', JSON.stringify(Object.fromEntries(
      Object.entries(seen).map(([f, a]) => [f, `${avg(a)} / ${Math.min(...a)}`]))));
    expect(thin.slice(0, 15)).toEqual([]);
    expect(missing.slice(0, 15)).toEqual([]);
    expect(rounds.slice(0, 15)).toEqual([]);
  });
});

import { streamFor } from '../js/dr/rng.js';
import { bump } from '../js/ci/state.js';
import { runGame } from '../js/ci/games.js';
import { writeScene } from '../js/ci/script.js';
import { room } from './helpers/ci-room.js';

describe('every one of the games, played in a room of eight', () => {
  it('meets its family\'s depth and phases, game by game', () => {
    const thin = [], missing = [];
    for (const g of GAMES) {
      for (const seed of [1, 2]) {
        const s = room(8, seed);
        s.people.Q0.stats.mental = 8; s.people.Q1.stats.boldness = 8;
        bump('@q0', '@q1', 'attraction', 7); bump('@q1', '@q0', 'attraction', 7);
        bump('@q2', '@q3', 'attraction', 6); bump('@q3', '@q2', 'attraction', 6);
        const sc = runGame(s, streamFor(seed, g.id), g);
        writeScene(s, sc);
        const lines = sc.script.blocks.reduce((n, b) => n + blockText(s, b).filter(l => l.trim()).length, 0);
        if (lines < DEPTH[g.family].lines) thin.push(`${g.id} ${lines}/${DEPTH[g.family].lines}`);
        const phases = new Set(sc.script.blocks.map(b => b.phase));
        for (const p of DEPTH[g.family].phases) if (!phases.has(p)) missing.push(`${g.id} no ${p}`);
        const text = sc.script.blocks.flatMap(b => b.lines.map(l => l.text)).join(' ');
        if (/\{[a-z]/.test(text)) missing.push(`${g.id} unfilled slot`);
      }
    }
    expect(thin).toEqual([]);
    expect(missing).toEqual([]);
  });
});

describe('a game never repeats itself', () => {
  it('never uses the same line twice inside one game, in any of the 48', () => {
    const repeats = [];
    for (const g of GAMES) {
      const s = room(8, 3);
      bump('@q0', '@q1', 'attraction', 7); bump('@q1', '@q0', 'attraction', 7);
      const sc = runGame(s, streamFor(3, g.id), g);
      writeScene(s, sc);
      const ids = sc.script.blocks.map(b => b.id);
      const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
      if (dup.length) repeats.push(`${g.id}: ${[...new Set(dup)].join(', ')}`);
    }
    expect(repeats).toEqual([]);
  });
});

// Beyond the games: every big moment of a Circle episode, held to what the
// real show gives it (structure-based minimums: who speaks in the real
// segment, times two or three lines each).
export const SCENE_DEPTH = {
  ratings: 30, 'final-ratings': 15, blocking: 14, goodbye: 18, visit: 22, party: 35, 'circle-chat': 16, meet: 6,
};

describe('every big moment airs in full', () => {
  it('meets the minimum for ratings, blockings, goodbyes, visits, parties, Circle Chat and the finale', () => {
    const thin = {}, seen = {};
    for (const seed of [2, 7, 19]) {
      const { state } = seasonWithPair(seed);
      for (const sc of state.scenes.filter(x => x.aired && SCENE_DEPTH[x.kind])) {
        const lines = sc.script.blocks.reduce((n, b) => n + blockText(state, b).filter(l => l.trim()).length, 0);
        (seen[sc.kind] ||= []).push(lines);
        // A visit delivered in person (a Super Influencer) opens at the talk:
        // the walk and the door are in the blocking scene before it.
        // A block the saves or the room decided has its waiting in those scenes.
        // A goodbye late in the season has fewer watchers: about three lines each, plus the video.
        const min = sc.kind === 'meet' && sc.who.length < 3 ? 4 : sc.kind === 'visit' && sc.data.inPerson ? 12
          : sc.kind === 'goodbye' ? Math.min(SCENE_DEPTH.goodbye, 3 * (sc.seenBy.length - 1) + 2)
          // Ratings: about three lines a ranker (the middle only for a few, script.js
          // MIDDLES_PER_NIGHT) plus the results; a secret night reads no board.
          : sc.kind === 'ratings' ? Math.min(SCENE_DEPTH.ratings, 3 * sc.data.ballots.length + (sc.data.hidden ? 6 : 10))
          : sc.kind === 'blocking' && ['unsaved', 'vote', 'instant', 'antivirus', 'mission'].includes(sc.data.channel) ? 9 : SCENE_DEPTH[sc.kind];
        if (lines < min) (thin[sc.kind] ||= []).push(lines);
      }
    }
    const avg = a => Math.round(a.reduce((x, y) => x + y, 0) / a.length);
    console.log('\n  lines per scene (mean, min):', JSON.stringify(Object.fromEntries(
      Object.entries(seen).map(([k, a]) => [k, `${avg(a)} / ${Math.min(...a)} (need ${SCENE_DEPTH[k]})`]))));
    expect(Object.fromEntries(Object.entries(thin).map(([k, a]) => [k, a.length]))).toEqual({});
  });
});

// Length bought with repetition is not depth: a season that airs the same
// sentence every week reads thinner than a short one. No line airs more than
// MAX_AIRINGS times in a season (the spec audit prints the full wear table).
export const MAX_AIRINGS = 4;
describe('a season never wears a line out', () => {
  it(`airs no single line more than ${MAX_AIRINGS} times`, () => {
    const worn = {};
    for (const seed of [2, 7, 19]) {
      const { state } = seasonWithPair(seed);
      const uses = state.usedLines?.uses || {};
      for (const [k, list] of Object.entries(POOLS)) {
        const worst = Math.max(0, ...list.map(e => uses[e.id] || 0));
        if (worst > MAX_AIRINGS) worn[k] = Math.max(worn[k] || 0, worst);
      }
    }
    expect(worn).toEqual({});
  });
});
