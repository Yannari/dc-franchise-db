// ══════════════════════════════════════════════════════════════════════
// bb/teams.js — a group you did not choose
// ══════════════════════════════════════════════════════════════════════
//
// Every group this engine had before this file was OPTED INTO. Alliances are
// formed by the people in them, showmances happen to two people who wanted
// them to, duos are declared, and `blocs.js` does not hold groups at all — it
// DERIVES power structures from alliances and showmances every time it is
// asked.
//
// So there was no way to express the oldest reality-television shape there is:
// you have been sorted, you did not agree to it, and your fate is now tied to
// people you may not be able to stand.
//
// That gap cost real work before it was filled. BB23's Wildcard draws one
// player per assigned team on the broadcast; `js/bb/wildcard.js` had to flatten
// that to a random draw and say so in a comment, because assigned teams did not
// exist. Cliques (BB11), Coaches (BB14) and Festie Besties (BB24) are all
// blocked behind the same missing idea.
//
// ── WHAT A TEAM IS NOT ─────────────────────────────────────────────────
//
// It is not an alliance, and the whole design fails if it behaves like one.
// An alliance is evidence about who somebody trusts. A team is evidence about
// nothing at all — it is an accident of sorting — so it gets a WEAK pull on
// targeting and voting, well below anything chosen, and the interesting state
// is the crack: the houseguest who resents the sorting, and who is safe this
// week because of people they cannot stand.
import { gs, players } from '../core.js';
import { pStats } from '../players.js';

/** The teams, created on first touch. Plain JSON: no Sets, no functions. */
function store() {
  if (!gs.bb) gs.bb = {};
  if (!Array.isArray(gs.bb.teams)) gs.bb.teams = [];
  return gs.bb.teams;
}

/** Which team this houseguest was sorted into, or null. */
export function teamOf(name) {
  if (!name) return null;
  return store().find(t => (t.members || []).includes(name)) || null;
}

/** The rest of their team. Empty for somebody unsorted, or a team of one. */
export function teammates(name) {
  const t = teamOf(name);
  if (!t) return [];
  return (t.members || []).filter(n => n && n !== name);
}

/** Sorted into the same team. False when either is unsorted. */
export function sharesTeam(a, b) {
  if (!a || !b || a === b) return false;
  const t = teamOf(a);
  return !!t && (t.members || []).includes(b);
}

/** Every team, for a screen or a debug panel. A copy, never the store. */
export function allTeams() {
  return store().map(t => ({ ...t, members: [...(t.members || [])] }));
}

/** Have the teams stopped mattering? */
export const teamsDissolved = () => !!(gs.bb && gs.bb.teamsDissolved);

// ── THE FOUR CLIQUES ───────────────────────────────────────────────────
//
// BB11, and the sorting is archetype-driven rather than random on purpose.
// Random would be a line cheaper and would throw away data the roster already
// carries; sorting on archetype means the cliques READ as cliques the moment
// they are drawn, which is the entire appeal of the twist.
//
// `mix` is the stat profile the clique is about, used to break ties and to
// place anybody whose archetype belongs to nobody in particular. Every
// archetype in `CLAUDE.md` appears in exactly one `archetypes` list below, so
// nobody is sorted by the fallback unless the cast carries an archetype this
// file has never heard of.
export const CLIQUES = Object.freeze([
  Object.freeze({
    id: 'athletes', name: 'The Athletes',
    archetypes: ['challenge-beast', 'hothead'],
    mix: { physical: 0.45, endurance: 0.35, boldness: 0.20 },
    blurb: 'They win things. It is most of how they are read, and all of how they read themselves.',
  }),
  Object.freeze({
    id: 'brains', name: 'The Brains',
    archetypes: ['mastermind', 'schemer', 'perceptive-player'],
    mix: { mental: 0.40, strategic: 0.40, intuition: 0.20 },
    blurb: 'They have a plan for a house that has not done anything yet, and they are already three weeks ahead of it.',
  }),
  Object.freeze({
    id: 'populars', name: 'The Populars',
    archetypes: ['social-butterfly', 'showmancer', 'hero'],
    mix: { social: 0.55, boldness: 0.25, temperament: 0.20 },
    blurb: 'The room arranges itself around them without being asked to, which is a skill and reads as luck.',
  }),
  Object.freeze({
    id: 'offbeats', name: 'The Off-Beats',
    archetypes: ['wildcard', 'chaos-agent', 'goat', 'underdog', 'floater',
      'loyal-soldier', 'villain'],
    mix: { intuition: 0.35, temperament: 0.35, mental: 0.30 },
    blurb: 'Sorted together because they did not fit anywhere else, which is the least flattering way to be given three allies.',
  }),
]);

/** How well this houseguest fits that clique, 0..1-ish. Never a gate. */
function affinity(name, clique) {
  const st = pStats(name) || {};
  let score = 0;
  for (const [stat, weight] of Object.entries(clique.mix)) {
    score += ((st[stat] ?? 5) / 10) * weight;
  }
  return score;
}

/** The archetype string for a houseguest, or ''. */
const archetypeOf = name =>
  (players || []).find(p => p?.name === name)?.archetype || '';

/**
 * Sort the house into four cliques.
 *
 * A DRAFT rather than a sort, because the sizes have to stay within one of each
 * other at any cast size and a pure "best clique for each person" pass does
 * not: a cast of six masterminds would put six people in the Brains and nobody
 * anywhere else, which is not a set of cliques, it is a list with three empty
 * rooms.
 *
 * So each houseguest is scored against every clique — archetype match first,
 * stat profile as the tiebreak, a little noise so two identical players do not
 * always land the same way — and the strongest remaining pair is assigned,
 * with any clique that has reached its cap taken out of the running.
 *
 * @returns {object|null} `{ teams, assignments }`, or null on a house too small
 */
export function assignTeams({ house = [], rng = Math.random } = {}) {
  const room = (house || []).filter(Boolean);
  // Four cliques out of fewer than eight is a set of pairs, and the immunity
  // rule stops meaning anything when a quarter of the house is safe by default.
  if (room.length < 8) return null;

  const cap = Math.ceil(room.length / CLIQUES.length);
  const picks = new Map(CLIQUES.map(c => [c.id, []]));

  // Score every pair once. Archetype is worth more than the stat profile
  // because it is the thing a reader can see on the roster.
  const pairs = [];
  for (const name of room) {
    const arch = archetypeOf(name);
    for (const c of CLIQUES) {
      const archMatch = c.archetypes.includes(arch) ? 1 : 0;
      pairs.push({
        name, id: c.id,
        score: archMatch * 1.4 + affinity(name, c) + (rng() - 0.5) * 0.25,
      });
    }
  }
  pairs.sort((x, y) => y.score - x.score);

  const placed = new Set();
  for (const p of pairs) {
    if (placed.has(p.name)) continue;
    const bucket = picks.get(p.id);
    if (bucket.length >= cap) continue;
    bucket.push(p.name);
    placed.add(p.name);
  }
  // Anybody the caps squeezed out goes to the smallest clique, so the sizes
  // stay within one of each other however the draft fell.
  for (const name of room) {
    if (placed.has(name)) continue;
    const smallest = [...picks.entries()].sort((a, b) => a[1].length - b[1].length)[0];
    smallest[1].push(name);
    placed.add(name);
  }

  const teams = CLIQUES.map(c => ({
    id: c.id, name: c.name, blurb: c.blurb, members: [...picks.get(c.id)],
  })).filter(t => t.members.length);

  if (!gs.bb) gs.bb = {};
  gs.bb.teams = teams;
  gs.bb.teamsDissolved = false;
  return { teams: allTeams(), assignments: teams };
}

/**
 * Who the Head of Household's team protects this week.
 *
 * THE WHOLE RULE, from the wiki: "Should a member of their clique win Head of
 * Household, they would be immune from eviction that week." So four people are
 * safe rather than one, and three of them did nothing to earn it — which is
 * what makes the twist worth having and what makes the block so much harder to
 * fill.
 *
 * Returns [] once the cliques dissolve, and [] when nobody is sorted, so the
 * caller never has to know whether this season has teams at all.
 */
export function teamImmune(week, hoh) {
  if (!hoh || teamsDissolved()) return [];
  const t = teamOf(hoh);
  if (!t) return [];
  return (t.members || []).filter(Boolean);
}

/**
 * Close the cliques down.
 *
 * Canon's stopped mattering partway through the season and ours do too — a
 * protection that lasts to the final five would decide the endgame by
 * accident of sorting rather than by anything anybody played.
 *
 * @returns {object|null} the act, or null when there was nothing to dissolve
 */
export function dissolveTeams(week) {
  if (!store().length || teamsDissolved()) return null;
  gs.bb.teamsDissolved = true;
  const teams = allTeams();
  return {
    type: 'teams-dissolved', week: week?.num || 0, secret: false,
    teams: teams.map(t => ({ id: t.id, name: t.name, members: [...t.members] })),
    beats: [{
      text: 'The cliques are over. No group is safe because one of its own is in charge any more, '
        + 'and every houseguest who has spent this game being protected by three people they did '
        + 'not choose is now protected by nobody at all. Some of them have friends. The rest have '
        + 'been finding out all season what it looks like when you do not.',
      players: [], badgeText: 'THE CLIQUES ARE OVER', badgeClass: 'red',
    }],
  };
}
