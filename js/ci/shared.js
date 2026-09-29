// ══════════════════════════════════════════════════════════════════════
// ci/shared.js — one profile, two people (spec §14.8)
// ══════════════════════════════════════════════════════════════════════
//
// Ed & Tammy, the Capra sisters, Jamie & Millie: two people, one apartment,
// one keyboard. Every message is a negotiation. One of them is the FACE (whose
// photos and name the profile shows, and who runs the flirting and the
// small talk) and one the BRAIN (who runs the strategy). Arguing makes them
// slow — fewer chats — and hard to trap — two heads check every answer. But
// two people do not sound like one: the more different they are, the more
// the voice wobbles, and people who notice it keep count.
import { S } from './state.js';
import { nudgeBelief } from './beliefs.js';

const FACE_INTENTS = new Set(['flirt', 'bond', 'checkin', 'repair']);
const BRAIN_INTENTS = new Set(['pitch', 'probe', 'plant', 'ally', 'pump', 'compare', 'credit']);
export const SHARED_PACE = 0.7;       // chats a day, as a share of one person's
export const SHARED_PROBE = 0.6;      // probe failures, as a share of one person's
export const INCONSISTENT_AT = 3;     // notices before the wobble costs belief
export const INCONSISTENT_COST = 0.05;

const firstOf = (state, h) => state.profiles[h]?.players || [];
export const isPair = (state, h) => firstOf(state, h).length > 1;

/** Face and brain: authored on either person (`face`/`brain`), else by stats. */
export function rolesFor(state, names) {
  const [x, y] = names;
  const authored = names.map(n => state.people[n]).find(p => p?.face || p?.brain);
  if (authored) {
    const face = authored.face || names.find(n => n !== authored.brain);
    const brain = authored.brain || names.find(n => n !== face);
    return { face, brain };
  }
  const st = (n, k) => state.people[n].stats[k] ?? 5;
  const face = st(y, 'social') > st(x, 'social') ? y : x;
  const brain = names.find(n => n !== face);
  const brainByStrat = st(y, 'strategic') > st(x, 'strategic') ? y : x;
  return { face, brain: brainByStrat !== face ? brainByStrat : brain };
}

/** Who wins the argument over this message. */
export function leadFor(state, h, intent, rng) {
  const names = firstOf(state, h);
  if (names.length < 2) return names[0];
  const roles = state.profiles[h].roles || rolesFor(state, names);
  let best = names[0], top = -Infinity;
  for (const n of names) {
    let pull = S(state, h, 'boldness', { who: n }) * 0.3 + S(state, h, 'strategic', { who: n }) * 0.2 + rng() * 2;
    if (n === roles.face && FACE_INTENTS.has(intent)) pull += 2;
    if (n === roles.brain && BRAIN_INTENTS.has(intent)) pull += 2;
    if (pull > top) { top = pull; best = n; }
  }
  return best;
}

/** How unlike each other the two sound: temperament, boldness and social apart. */
export function distance(state, h) {
  const names = firstOf(state, h);
  if (names.length < 2) return 0;
  const [x, y] = names.map(n => state.people[n].stats);
  return ['boldness', 'social', 'temperament'].reduce((s, k) => s + Math.abs((x[k] ?? 5) - (y[k] ?? 5)), 0);
}

/** Facts about the partner who is not the face — the life the profile hides. */
export function hiddenFacts(state, h) {
  const p = state.profiles[h];
  if (!p || p.players.length < 2) return [];
  const face = p.roles?.face || p.players[0];
  return p.players.filter(n => n !== face).flatMap(n => state.people[n].facts || []);
}

/** An observer caught the voice wobbling again; past a few times, it counts. */
export function noticeInconsistency(state, obs, h, scene) {
  const row = ((state.inconsistency ||= {})[obs] ||= {});
  row[h] = (row[h] || 0) + 1;
  if (row[h] > INCONSISTENT_AT) {
    nudgeBelief(state, obs, h, 'real', -INCONSISTENT_COST * S(state, obs, 'intuition') / 10, scene);
  }
  return row[h];
}
