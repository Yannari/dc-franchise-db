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
import { shouldThrowHoh, shouldThrowVeto, gunningFor } from '../bb/strategy.js';

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
  n => `${n} ends the attempt early and does not bother selling it as a mistake.`,
  n => `${n} is out almost immediately. The shrug afterward makes the choice look deliberate.`,
  n => `${n} gives it a token effort, then quits before the competition has properly settled in.`,
  n => `${n} stops while there is clearly more left in the tank. Nobody watching buys it as an accident.`,
  n => `${n} makes one careless move, checks who noticed, and walks away from the competition.`,
  n => `${n} takes the quick exit. Whatever the plan was tonight, winning was not part of it.`,
];

/**
 * Verb agreement for singular they.
 *
 * `pronouns()` returns they/them for anybody non-binary and carries no notion
 * of conjugation, so every writer has to phrase around it by hand — and the
 * first competition that forgot printed "they knows it before the count even
 * finishes" at a real houseguest. This makes the agreement explicit instead of
 * relying on remembering.
 *
 *   `${n} ${vb(p, 'knows', 'know')} it` -> "she knows it" / "they know it"
 */
export const vb = (pr, singular, plural) => (pr?.sub === 'they' ? plural : singular);

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
  if (context.allowThrowing === false) return { threw: false, chance: 0 };
  // ── AND THE VETO, WHICH THIS REFUSED TO CONSIDER ──
  //
  // `shouldThrowVeto` has existed in strategy.js the whole time, with exactly
  // the right motive on it: a houseguest ducks the veto because they do not
  // want to be the one holding a decision that makes somebody an enemy either
  // way. js/bb/comps.js honours it. This function — which is what every
  // THEMED competition scores through — returned `{threw:false}` for anything
  // that was not an HOH comp, so the whole motive quietly did not exist on any
  // week whose veto had a set built for it. Two engines, one of them deaf.
  if (context.type === 'veto') {
    const read = shouldThrowVeto(name, context);
    return { threw: rng() < read.throwChance, chance: read.throwChance };
  }
  if (context.type !== 'hoh') return { threw: false, chance: 0 };
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
/**
 * `swingBy` is the fix for a modelling error worth stating plainly, because it
 * was in a third of the library: temperament was being used as GRIT.
 *
 * In this simulator low temperament means volatile — angry, impulsive, quick to
 * snap — and that is not the same as weak-willed. A hothead can be ferociously
 * determined, and plenty have stayed on a wall out of pure spite. Any
 * competition that folds temperament into the average of "how long can this
 * person last" is quietly saying short fuse = quitter.
 *
 * So an endurance competition passes its staying power as `mix` and its
 * temperament as `swingBy`, and temperament stops setting the LEVEL and starts
 * setting the SPREAD. A calm houseguest lands near their own number every time;
 * a volatile one is a coin toss between walking off early and planting
 * themselves out of stubbornness.
 *
 * No compensation is added here, and that is a deliberate difference from the
 * competitions that run their own elimination loops. Everything scoring through
 * scoreField is ONE roll that gets ranked, and in a single ranked roll variance
 * is already fair: a wider swing wins more often and finishes last more often
 * in equal measure, leaving the average where it was. It is only when a
 * competition eliminates people round after round that a wide swing becomes a
 * pure penalty — every round is another chance to come up short — and those
 * comps (the wall, the pressure cooker) pay for the swing themselves.
 *
 * Measured the wrong way round first: adding the compensation here handed the
 * volatile houseguest 50 wins out of 200 against the calm one's 4.
 *
 * Competitions where temperament genuinely IS the skill — a steady hand on a
 * balance beam, not flinching at a buzzer — should keep it in `mix` and not
 * pass this at all.
 */
export function scoreField(participants, { mix, luck = 3, context, rng, throwPenalty = 6, swingBy = null }) {
  const breakdown = {};
  const entries = participants.map(name => {
    const steady = swingBy ? aptitude(name, swingBy) : null;
    const width = steady == null ? luck : luck * (0.62 + (10 - steady) * 0.085);
    const base = aptitude(name, mix);
    const roll = (rng() - 0.5) * width * 2;
    const t = throwRead(name, context, rng);
    const penalty = t.threw ? throwPenalty + rng() * 3 : 0;
    // Slop and no sleep, applied before the field is ranked so the narration
    // never contradicts the result. Every competition scores through here, so
    // a have-not is disadvantaged in all of them rather than only the generic
    // ones — which was the difference between a twist and a label.
    const haveNot = (context?.haveNots || []).includes(name);
    const haveNotPenalty = haveNot ? 1.4 + rng() * 1.6 : 0;
    // The have-not penalty with the sign flipped: people in danger play harder.
    const gun = gunningFor(name, context, rng);
    const score = base + roll - penalty - haveNotPenalty + gun.bonus;
    breakdown[name] = { base, roll, threwChance: t.chance, threw: t.threw, penalty,
      haveNot, haveNotPenalty, gunningFor: gun.reason, gunningBonus: gun.bonus, score,
      // Reported so the Debug tab can show WHY two houseguests with the same
      // staying power had different nights.
      ...(steady == null ? {} : {
        steadiness: Math.round(steady * 100) / 100,
        swing: Math.round(width * 100) / 100,
      }) };
    return { name, score, threw: t.threw, base };
  });
  entries.sort((a, b) => b.score - a.score);
  return { entries, breakdown };
}

/**
 * The result shape the dispatcher validates.
 *
 * `detail` is whatever structured record a competition needs to survive to a
 * screen — the jury quiz's statements and answers, say. Beats are prose and
 * breakdown rows are debug numbers; neither can carry "here are three options
 * and which one was true" in a form a board can render.
 */
export function toResult(entries, { beats = [], events = [], text, variant = null, breakdown = {}, luck = null, detail = null }) {
  const placements = entries.map(e => e.name);
  return {
    winner: placements[0],
    placements,
    scores: Object.fromEntries(entries.map(e => [e.name, e.score])),
    beats, events, variant, breakdown, detail,
    // Per-houseguest luck, when the competition recorded it. The dispatcher
    // merges this into the breakdown so a competition never has to remember to
    // write the Debug tab's fields into every one of its own result rows.
    luck,
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
