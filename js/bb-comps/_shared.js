// ══════════════════════════════════════════════════════════════════════
// bb-comps/_shared.js — scoring and narration helpers for competitions
// ══════════════════════════════════════════════════════════════════════
//
// The dispatcher in js/bb/comps.js owns selection, validation and the generic
// stat-only fallback. This directory owns the production competitions: the ones
// that narrate a week rather than reporting a winner.
//
// The difference matters more here than it looks. A season plays about thirty
// competitions — an HOH and a veto every week — and the fallback says only
// "X wins Pressure Wall." Thirty of those is a season with no competition in it.
// These produce a run of beats: who led early, who cracked, who threw it, who
// nearly had it.
//
// Unlike house events, competitions ARE handed the seeded rng, so they may use
// it freely for both outcome and text. Reproducibility comes from the seed.

import { pStats } from '../players.js';
import { shouldThrowHoh } from '../bb/strategy.js';

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Pick from a list with the competition's own rng. Rolls once. */
export function choose(rng, list) {
  return list[Math.min(list.length - 1, Math.floor(rng() * list.length))];
}

/**
 * A picker that does not repeat itself within one competition.
 *
 * Needed because a competition narrates the same category of thing many times
 * over — six people dropping off a wall, four people throwing it — and a plain
 * random pick will happily print one sentence five times in a row. The first
 * played season did exactly that: five houseguests in a row "blames the cold.
 * The cold is not the reason."
 *
 * Falls back to reusing the least-recently-used line once a pool is exhausted,
 * so a small pool degrades gracefully instead of throwing.
 */
export function makePicker(rng) {
  const used = new Map();
  return function pickFrom(list) {
    if (!list?.length) return '';
    const fresh = list.filter(item => !used.has(item));
    const pool = fresh.length ? fresh : [...list].sort((a, b) => used.get(a) - used.get(b)).slice(0, Math.ceil(list.length / 2));
    const chosen = pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
    used.set(chosen, (used.get(chosen) || 0) + 1);
    return chosen;
  };
}

/**
 * Lines for a houseguest who threw it.
 *
 * Shared across competitions because throwing happens in every HOH and needs
 * the same variety everywhere.
 */
export const THROW_LINES = [
  n => `${n} bows out at a point that would be embarrassing if it were an accident. It is not an accident.`,
  n => `${n} goes early, shrugs, and does not meet anyone's eye on the way past.`,
  n => `${n} makes a show of trying for about a minute and then stops making a show of it.`,
  n => `${n} could have stayed in that a lot longer. Everybody watching knows it, and ${n} knows they know.`,
  n => `${n} throws it, badly, in the way of someone who has never had to pretend before.`,
  n => `${n} steps out with the timing of a person who worked out days ago that winning this would be the worst thing that could happen to ${n}.`,
];

/** A player's raw aptitude for this competition, before luck and nerve. */
export function aptitude(name, mix) {
  const s = pStats(name);
  return Object.entries(mix).reduce((sum, [stat, weight]) => sum + (s[stat] || 0) * weight, 0);
}

/**
 * Would this houseguest rather not win?
 *
 * Throwing is signature Big Brother and belongs in every HOH competition, not
 * just the fallback. A player safe on all sides has more to lose by taking the
 * power than by letting somebody else hold it.
 */
export function throwRead(name, context, rng) {
  if (context.type !== 'hoh' || context.allowThrowing === false) return { threw: false, chance: 0 };
  const read = shouldThrowHoh(name, context.house || []);
  return { threw: rng() < read.throwChance, chance: read.throwChance };
}

/**
 * Score every participant: aptitude, plus nerve, plus luck.
 *
 * `luck` is how much of the result is out of the houseguests' hands. Low for a
 * puzzle, near-total for a crapshoot — which is a real Big Brother competition
 * type, not a design failure, and the reason the house can never fully plan.
 */
export function scoreField(participants, { mix, luck = 3, context, rng, throwPenalty = 6 }) {
  const breakdown = {};
  const entries = participants.map(name => {
    const base = aptitude(name, mix);
    const roll = (rng() - 0.5) * luck * 2;
    const t = throwRead(name, context, rng);
    const penalty = t.threw ? throwPenalty + rng() * 3 : 0;
    // Slop and no sleep, applied before the field is ranked so the narration
    // never contradicts the result. Every competition scores through here, so
    // a have-not is disadvantaged in all of them rather than only the generic
    // ones — which was the difference between a twist and a label.
    const haveNot = (context?.haveNots || []).includes(name);
    const haveNotPenalty = haveNot ? 1.4 + rng() * 1.6 : 0;
    const score = base + roll - penalty - haveNotPenalty;
    breakdown[name] = { base, roll, threwChance: t.chance, threw: t.threw, penalty, haveNot, haveNotPenalty, score };
    return { name, score, threw: t.threw, base };
  });
  entries.sort((a, b) => b.score - a.score);
  return { entries, breakdown };
}

/** The result shape the dispatcher validates. */
export function toResult(entries, { beats = [], events = [], text, variant = null, breakdown = {} }) {
  const placements = entries.map(e => e.name);
  return {
    winner: placements[0],
    placements,
    scores: Object.fromEntries(entries.map(e => [e.name, e.score])),
    beats, events, variant, breakdown,
    text: text || beats.map(b => b.text).join(' '),
  };
}

/** A renderable beat. Every field here is required by the dispatcher. */
export const beat = (text, players, badgeText, badgeClass = 'challenge') =>
  ({ type: 'competition', text, players: [...players], badgeText, badgeClass });

/** The houseguests who threw it, for narration. */
export const throwers = entries => entries.filter(e => e.threw).map(e => e.name);

/**
 * How close it was, in words. Used to make a photo finish read differently from
 * a runaway, which the fallback cannot do.
 */
export function margin(entries) {
  if (entries.length < 2) return { gap: 0, word: 'unopposed' };
  const gap = entries[0].score - entries[1].score;
  const word = gap < 0.6 ? 'photo finish' : gap < 1.8 ? 'narrow' : gap < 4 ? 'clear' : 'runaway';
  return { gap, word };
}

/** Competition names are decorative; the type is what the week needs. */
export const titleFor = (context, name) =>
  context.type === 'veto' ? `${name} — Power of Veto` : context.type === 'hoh' ? `${name} — Head of Household` : name;
