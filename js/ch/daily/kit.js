// ══════════════════════════════════════════════════════════════════════
// ch/daily/kit.js — what every played daily shares
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-15: "the daily needs an overhaul to be an actual challenge. I want to see everything,
// actual avatars well placed on their platform; if someone falls show it. Right now it's three events then
// 'seventeen people fall'. I want the complete challenge, every part, with the host and players talking, and
// other events; a Total Drama challenge is also used to form storylines."
//
// So a daily is PLAYED: a file per game in ch/daily/ runs it in stages and records every moment as a beat
// ({ t, kind, who, data }), in the order it happened. The result comes out of the beats (who fell last,
// who scored most), never the other way round. The viewer (vp-ch-ep/daily-play.js) shows each beat.
//
// The moments between people are the social layer, and every one of them changes something (CLAUDE.md:
// all social events have consequences): a taunt is a grudge, help is a debt, a knock is a grudge and a hit
// to popularity, freezing in front of everybody costs respect, beating your fear earns it. The archetype
// rules hold: a nice archetype never taunts or knocks anybody on purpose; a neutral one needs strategic >= 6
// and loyalty <= 4.
import { gs } from '../../core.js';
import { addBond, getBond } from '../../bonds.js';
import { S, mayScheme, noise, logistic, clamp, archetypeOf } from '../state.js';
import { nudge } from '../mind.js';
import { remember, trustOf } from '../rel.js';
import { giveRespect } from '../respect.js';
import { coupleOf } from '../callout.js';

const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
export const isNice = n => NICE.has(archetypeOf(n));
export const pop = (n, d) => { gs.popularity ||= {}; gs.popularity[n] = (gs.popularity[n] || 0) + d; };

/** A run's recorder: beats in order, plus who is still in. */
export function run(players) {
  const R = { beats: [], out: [], in: new Set(players) };
  R.beat = (t, kind, who, data = {}) => { R.beats.push({ t: +t.toFixed(2), kind, who: [...who], data }); return R.beats[R.beats.length - 1]; };
  R.drop = (t, n, kind, data) => { if (!R.in.has(n)) return null; R.in.delete(n); R.out.push(n); return R.beat(t, kind, [n], data); };
  return R;
}

// ── the people around you ────────────────────────────────────────────
/** The pair of neighbours (or of any two still in) with the most going on between them. */
export function charged(state, list, rng) {
  let best = null, top = 0;
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = list[i], b = list[j];
    const heat = Math.abs(getBond(a, b)) + (coupleOf(state, a) === b ? 4 : 0) + rng() * 0.8;
    if (heat > top) { top = heat; best = [a, b]; }
  }
  return best;
}
/** What two people say to each other mid-challenge: a needle, a flirt, a word between allies, or small talk. */
export function toneOf(state, a, b) {
  if (coupleOf(state, a) === b) return 'couple';
  const g = getBond(a, b);
  if (g <= -2) return 'needle';
  if (g >= 3) return 'friends';
  return 'smalltalk';
}
const canNeedle = n => !isNice(n) || S(n, 'temperament') <= 3;

/** A needle: the one who says it grows a grudge in the other; the target is shaken or fired up. Returns the shift in the target's staying power. */
export function needle(state, a, b) {
  if (!canNeedle(a)) [a, b] = [b, a];
  if (!canNeedle(a)) return { a, b, shift: 0, soft: true };
  addBond(a, b, -0.6); remember(b, a, 'taunted-me', 0.8);
  pop(a, -0.15);
  const temper = S(b, 'temperament') / 10, bold = S(b, 'boldness') / 10;
  const shift = (bold - 0.5) * 1.2 - (1 - temper) * 0.9;   // a bold player is fired up, a hot-headed one rattled
  nudge(state, b, 'confidence', shift * 0.3);
  return { a, b, shift: +shift.toFixed(2) };
}
/** A friend or a partner keeps them going: closer, and a little longer up. */
export function cheer(state, a, b) {
  addBond(a, b, 0.4); remember(b, a, 'cheered-me', 0.5);
  return { a, b, shift: 0.5 + S(a, 'social') * 0.05 };
}
/** Talked through a fear by somebody else: a debt, and the house saw a decent thing. */
export function help(state, a, b) {
  addBond(a, b, 0.8); remember(b, a, 'helped-me', 1.1); pop(a, 0.4);
  return { a, b, shift: 0.8 + S(a, 'social') * 0.08 };
}
/** Somebody takes somebody else down with them: a grudge, a hit with the audience if it looked deliberate. */
export function knock(state, a, b, { meant = false } = {}) {
  addBond(b, a, meant ? -1.6 : -0.9); remember(b, a, 'knocked-me-off', meant ? 1.8 : 1);
  pop(a, meant ? -0.6 : -0.2);
  return { a, b, meant };
}

// ── fear ──────────────────────────────────────────────────────────────
/** Facing their fear: froze (lost time, lost respect) or beat it (respect, the crowd). Returns { froze, beat, size }. */
export function faceFear(state, rng, n, size) {
  if (size <= 0) return null;
  const nerve = (S(n, 'boldness') * 0.6 + S(n, 'temperament') * 0.4) / 10;
  const froze = rng() < clamp(size * 1.1 - nerve * 0.5, 0.05, 0.9);
  if (froze) { giveRespect(state, n, 'froze'); nudge(state, n, 'confidence', -0.7); pop(n, -0.1); }
  else { giveRespect(state, n, 'fearBeaten'); nudge(state, n, 'confidence', 0.6); pop(n, 0.5 + size * 0.6); }
  return { froze, beat: !froze, size: +size.toFixed(2) };
}

/** Somebody who would talk them through it: a friend, a partner, an ally still in, never a rival. */
export function helperFor(state, n, pool) {
  return pool.filter(x => x !== n && (getBond(x, n) >= 2 || coupleOf(state, x) === n) && trustOf(x, n) > 0)
    .sort((x, y) => getBond(y, n) - getBond(x, n))[0] || null;
}

/** Staying power from the daily's base score (dailies.js: blend x mind x the day's form, a throw already taken off). */
export const staying = (power, rng, k = 1) => Math.max(0.3, (power + noise(rng) * 0.9) * k);
export { mayScheme, logistic, clamp, noise, S };

/**
 * Heats of up to `size` (a set with six poles or six platforms), a division at a time: each heat's last one
 * standing goes to that division's final heat. `play(players, label, { final })` runs one heat on the run and
 * returns its winner; the heat's fallers, in order, score 0, 1, 2...; finalists 10+; the champion 30.
 */
export function inHeats(state, rng, R, all, size, play) {
  const divs = state.options.gendered ? ['m', 'f'] : ['all'];
  const score = {};
  const name = (div, i, n) => (n > 1 ? `${div === 'm' ? "Men's heat" : div === 'f' ? "Women's heat" : 'Heat'} ${i + 1}` : div === 'm' ? 'The men' : div === 'f' ? 'The women' : 'Everybody');
  for (const div of divs) {
    const list = all.filter(n => div === 'all' || state.division[n] === div);
    if (!list.length) continue;
    const k = Math.ceil(list.length / size);
    const order = [...list].sort(() => rng() - 0.5);
    const heats = Array.from({ length: k }, (_, i) => order.filter((_, j) => j % k === i));
    const winners = heats.map((h, i) => {
      const before = R.out.length;
      const w = play(h, name(div, i, heats.length), { final: false });
      R.out.slice(before).forEach((n, j) => { score[n] = j; });
      return w;
    });
    if (winners.length > 1) {
      const before = R.out.length;
      const champ = play(winners, div === 'm' ? "The men's final" : div === 'f' ? "The women's final" : 'The final', { final: true });
      R.out.slice(before).forEach((n, j) => { score[n] = 10 + j; });
      score[champ] = 30;
    } else score[winners[0]] = 30;
  }
  for (const n of all) score[n] ??= 0;
  return score;
}
