// The Knight Moves board.
//
// Every other themed comp screen draws its mechanic. This one's mechanic IS a
// floor: eight by eight, one legal move, and every square that has been stood
// on goes dark behind you — so the screen is the board, with each houseguest's
// route traced across it and the stranded one ending in a dead end.
//
// The routes are reconstructed from placement, because the engine scores this
// competition and never records a move list. That is fine and the caption says
// so — but every route drawn has to be a LEGAL knight's path over squares
// nobody had already used, or the board is a lie about the one rule it exists
// to show.
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { rpBuildSigKnightMoves } from '../js/vp-bb-sig/knight-moves.js';
import { seedGame } from './helpers/setup.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'hero', 'floater', 'villain'][i % 4],
}));

const U = {
  esc: v => String(v ?? ''), avatar: () => '<i></i>', ordinal: i => `${i}`,
  cat: () => ({ label: 'PUZZLE', accent: '#ffb347' }),
  reveal: (ep, k, i) => `_r('${k}',${i})`, tvState: {},
};

function ep(overrides = {}) {
  return {
    num: 3,
    acts: [{
      type: 'hoh',
      competition: {
        variant: 'knightmoves', name: 'Knight Moves', category: 'puzzle',
        placements: [...NAMES],
        beats: [{ text: 'A chequered floor.', players: ['Bowie'], badgeText: 'ONE LEGAL MOVE' },
          { text: 'Nothing legal left.', players: ['Axel'], badgeText: 'STRANDED', badgeClass: 'red' }],
        ...overrides,
      },
    }],
  };
}

beforeEach(() => {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat, TWIST_CATALOG });
  U.tvState = {};
});
afterAll(() => { delete seasonConfig.format; });

/** Pull every route back out of the drawn svg. */
function routesFrom(html) {
  return [...html.matchAll(/<path d="((?:[ML][\d.,]+ ?)+)" fill="none"/g)]
    .map(m => m[1].trim().split(/\s+/).map(p => {
      const [x, y] = p.slice(1).split(',').map(Number);
      return [Math.round((y - 17) / 34), Math.round((x - 17) / 34)];
    }));
}

describe('the board draws the rule it exists to show', () => {
  it('moves only the way a knight moves', () => {
    const e = ep();
    rpBuildSigKnightMoves(e, 'hoh', U);
    const key = Object.keys(U.tvState)[0];
    U.tvState[key].idx = 99;
    const html = rpBuildSigKnightMoves(e, 'hoh', U);

    const routes = routesFrom(html);
    expect(routes.length, 'no routes were drawn').toBeGreaterThan(0);
    for (const path of routes) {
      for (let i = 1; i < path.length; i++) {
        const dr = Math.abs(path[i][0] - path[i - 1][0]);
        const dc = Math.abs(path[i][1] - path[i - 1][1]);
        expect(`${dr},${dc}`, `illegal step in a route: ${dr},${dc}`)
          .toMatch(/^(1,2|2,1)$/);
      }
    }
  });

  it('never steps on a square that route already used', () => {
    const e = ep();
    rpBuildSigKnightMoves(e, 'hoh', U);
    U.tvState[Object.keys(U.tvState)[0]].idx = 99;
    for (const path of routesFrom(rpBuildSigKnightMoves(e, 'hoh', U))) {
      const seen = new Set(path.map(([r, c]) => `${r},${c}`));
      expect(seen.size, 'a route re-used a dark square').toBe(path.length);
    }
  });

  it('keeps every square on the board', () => {
    const e = ep();
    rpBuildSigKnightMoves(e, 'hoh', U);
    U.tvState[Object.keys(U.tvState)[0]].idx = 99;
    for (const path of routesFrom(rpBuildSigKnightMoves(e, 'hoh', U))) {
      for (const [r, c] of path) {
        expect(r >= 0 && r < 8 && c >= 0 && c < 8, `off the board: ${r},${c}`).toBe(true);
      }
    }
  });

  it('gives the winner more floor than the last of them', () => {
    const e = ep();
    rpBuildSigKnightMoves(e, 'hoh', U);
    U.tvState[Object.keys(U.tvState)[0]].idx = 99;
    const routes = routesFrom(rpBuildSigKnightMoves(e, 'hoh', U));
    expect(routes[0].length).toBeGreaterThan(routes[routes.length - 1].length);
  });

  it('draws the same floor for the same week every time', () => {
    const a = ep(); rpBuildSigKnightMoves(a, 'hoh', U);
    U.tvState[Object.keys(U.tvState)[0]].idx = 99;
    const first = rpBuildSigKnightMoves(a, 'hoh', U);
    U.tvState = {};
    const b = ep(); rpBuildSigKnightMoves(b, 'hoh', U);
    U.tvState[Object.keys(U.tvState)[0]].idx = 99;
    expect(rpBuildSigKnightMoves(b, 'hoh', U)).toBe(first);
  });

  it('declines rather than drawing an empty floor', () => {
    expect(rpBuildSigKnightMoves({ num: 1, acts: [] }, 'hoh', U)).toBe('');
    expect(rpBuildSigKnightMoves(ep({ placements: [] }), 'hoh', U)).toBe('');
  });

  it('says the routes are a reconstruction', () => {
    const e = ep();
    rpBuildSigKnightMoves(e, 'hoh', U);
    U.tvState[Object.keys(U.tvState)[0]].idx = 99;
    expect(rpBuildSigKnightMoves(e, 'hoh', U)).toMatch(/reconstructed/);
  });
});
