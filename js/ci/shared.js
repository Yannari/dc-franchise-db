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

// What the two are to each other (user, 2026-09-30), picked by the author.
// Unset, the lines never say. It changes the game, not only the words:
//   twins    sound alike (TWIN_VOICE: the voice barely wobbles)
//   parent   pulls rank (PARENT_RANK: wins more of the arguments)
//   siblings bicker (SIBLING_CHAOS: the argument is more of a coin flip)
export const RELATIONS = ['couple', 'married', 'siblings', 'twins', 'parent', 'friends', 'cousins'];
// The franchise's own relations (core.js REL_KINSHIP, the cast's
// Relationships tab, which Big Brother and Perfect Match read too) as the ones
// the Circle plays. A relation with no Circle lines yet (exes, in-laws, a
// grandparent) plays with the general ones.
const FROM_KIN = {
  twins: 'twins', siblings: 'siblings', 'step-siblings': 'siblings', 'parent-child': 'parent', cousins: 'cousins',
  married: 'married', engaged: 'couple', partners: 'couple', dating: 'couple',
  'best-friends': 'friends', 'childhood-friends': 'friends', 'old-friends': 'friends', roommates: 'friends',
};
export const relationFromKin = kin => FROM_KIN[kin] || null;
// And back: what the Circle's "They are" writes on the Relationships tab.
export const KIN_OF = { twins: 'twins', siblings: 'siblings', parent: 'parent-child', cousins: 'cousins',
  married: 'married', couple: 'dating', friends: 'best-friends' };
/** What two people sharing a profile are to each other: the Relationships
 *  tab first, then what life made of them (a couple married since their last
 *  show), then an old Circle-only setting. */
export function pairRelation(a, b, { kin = 'none', carried = [], setupRel = null } = {}) {
  const fromTab = relationFromKin(kin);
  if (fromTab) return fromTab;
  const k = [a, b].sort().join('|');
  const life = (carried || []).find(x => [x.a, x.b].sort().join('|') === k && relationFromKin(x.kin));
  if (life) return relationFromKin(life.kin);
  return RELATIONS.includes(setupRel) ? setupRel : null;
}
export const TWIN_VOICE = 0.3;
export const PARENT_RANK = 1.8;
export const SIBLING_CHAOS = 2;

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
    const rel = state.profiles[h].relation;
    let pull = S(state, h, 'boldness', { who: n }) * 0.3 + S(state, h, 'strategic', { who: n }) * 0.2
      + rng() * (rel === 'siblings' ? 2 + SIBLING_CHAOS : 2);
    if (rel === 'parent' && n === roles.parent) pull += PARENT_RANK;
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
  const d = ['boldness', 'social', 'temperament'].reduce((s, k) => s + Math.abs((x[k] ?? 5) - (y[k] ?? 5)), 0);
  // Twins grew up finishing each other's sentences: they type alike.
  return state.profiles[h]?.relation === 'twins' ? d * TWIN_VOICE : d;
}

/** The roles a pair has beyond face and brain: older and younger, and for a
 *  parent and child, which is which (the older one is the parent). */
export function pairRoles(state, names, relation) {
  const [x, y] = names;
  const ax = state.people[x]?.age ?? 0, ay = state.people[y]?.age ?? 0;
  const older = ay > ax ? y : x, younger = older === x ? y : x;
  return { older, younger, ...(relation === 'parent' ? { parent: older, kid: younger } : {}) };
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
