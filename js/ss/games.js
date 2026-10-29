// ══════════════════════════════════════════════════════════════════════
// ss/games.js — the Voice's weekly game, and what the winner wins
// ══════════════════════════════════════════════════════════════════════
//
// Part 2 design §8 and §15. The classic seasons had NO weekly immunity
// competition: the Voice's games (quizzes, blind tests, garden games, the
// sexy cleaning contest…) were for clues, money, a free buzz, and sometimes an
// immunity. The revival (season 12) ran a weekly MASTER OF THE HOUSE game:
// immune, and one direct nomination. A season is one or the other
// (`state.weekly`, drawn at the start from `seasonConfig.ssWeekly`).
//
// The engine's weekly competition still runs (its comps, its stepped
// screens); this file decides what winning it MEANS.

import { mint } from './kitty.js';
import { secretOf, showClue, theoryOf } from './hunt.js';
import { grantPower } from './powers.js';

/** Prize weights in a classic season (the real games' rewards, roughly). */
export const CLASSIC_PRIZES = [
  { id: 'clue', w: 0.38 },
  { id: 'immunity', w: 0.26 },
  { id: 'money', w: 0.2 },
  { id: 'free-buzz', w: 0.16 },
  // the Joker card (S4-S6; js/ss/powers.js)
  { id: 'joker', w: 0.12 },
];

/** Which kind of season: a pick, or a draw. */
export function resolveWeekly(choice, rng = Math.random) {
  if (choice === 'classic' || choice === 'revival') return choice;
  return rng() < 0.7 ? 'classic' : 'revival';
}

function draw(table, rng) {
  let r = rng() * table.reduce((a, b) => a + b.w, 0);
  for (const e of table) { r -= e.w; if (r <= 0) return e.id; }
  return table[table.length - 1].id;
}

/** Whose secret the winner wants a clue on: the one they are closest to cracking. */
function clueTarget(state, winner, house, rng) {
  const hidden = house.filter(n => n !== winner && secretOf(state, n) && !secretOf(state, n).found
    && !(secretOf(state, winner)?.holders || []).includes(n));
  if (!hidden.length) return null;
  const scored = hidden.map(n => [n, theoryOf(state, winner, n)?.conf ?? -1]).sort((a, b) => b[1] - a[1]);
  return scored[0][1] >= 0 ? scored[0][0] : hidden[Math.floor(rng() * hidden.length)];
}

/** The Master of the House's direct nomination: whoever threatens their secret most, else their worst bond. */
function masterPick(state, ctx, master, house) {
  const others = house.filter(n => n !== master && !(secretOf(state, master)?.holders || []).includes(n));
  if (!others.length) return null;
  const threat = n => (theoryOf(state, n, master)?.conf || 0) * 4 - (ctx.bond?.(master, n) ?? 0) * 0.5;
  return others.sort((a, b) => threat(b) - threat(a))[0];
}

/**
 * The week's game is won; settle the prize. Returns
 * `{ act, immune: [names], masterPick: name|null, clueAct }`.
 */
export function settleWeeklyGame(state, ctx, { winner = undefined, house = [], noNoms = false } = {}) {
  const rng = ctx.rng || Math.random;
  const week = ctx.week ?? 0;
  if (!winner) return { act: null, immune: [], masterPick: null, clueAct: null };
  // (a week with no nominations, the first: immunity and the Master's direct pick would win nothing)
  if (state.weekly === 'revival' && !noNoms) {
    const pick = masterPick(state, ctx, winner, house);
    return {
      immune: [winner], masterPick: pick, clueAct: null,
      act: { type: 'ss-game', week, winner, mode: 'revival', prize: 'master', masterPick: pick,
        beats: [{ text: `${winner} wins the Voice's game and becomes Master of the House: safe this week${pick ? `, and ${pick} is nominated directly` : ''}.`,
          players: [winner, pick].filter(Boolean), badgeText: 'MASTER OF THE HOUSE', badgeClass: 'gold', part: 'game' }] },
    };
  }
  const prize = draw(noNoms ? CLASSIC_PRIZES.filter(p => p.id !== 'immunity') : CLASSIC_PRIZES, rng);
  let clueAct = null, amount = 0, target = null;
  if (prize === 'clue') {
    target = clueTarget(state, winner, house, rng);
    if (target) clueAct = showClue(state, ctx, { holder: target, how: 'game', house, by: winner });
  } else if (prize === 'money') {
    amount = mint(state, winner, 2000 + Math.round(rng() * 6) * 500, "won the Voice's game", week);
  } else if (prize === 'free-buzz') {
    state.freeBuzz ||= {};
    state.freeBuzz[winner] = (state.freeBuzz[winner] || 0) + 1;
  } else if (prize === 'joker') {
    grantPower(state, { kind: 'joker', holder: winner, week, from: 'game' });
  }
  const got = prize === 'clue' && clueAct ? 'chooses a clue on the table'
    : prize === 'money' ? `wins $${amount.toLocaleString('en-US')}`
      : prize === 'free-buzz' ? 'wins a free buzz'
        : prize === 'immunity' ? 'wins immunity from this week\'s nominations' : prize === 'joker' ? 'wins the Joker card' : 'wins the game';
  return {
    immune: prize === 'immunity' ? [winner] : [], masterPick: null, clueAct,
    act: { type: 'ss-game', week, winner, mode: 'classic', prize: prize === 'clue' && !clueAct ? 'none' : prize, amount, target,
      beats: [{ text: `${winner} wins the Voice's game and ${got}.`, players: [winner], badgeText: "THE VOICE'S GAME", badgeClass: 'gold', part: 'game' }] },
  };
}
