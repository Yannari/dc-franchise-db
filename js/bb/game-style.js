// ══════════════════════════════════════════════════════════════════════
// bb/game-style.js — how each houseguest is playing to win
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-27: "this isn't Loft Story, it's Big Brother, it's a strategy
// game, you win for having the best strategy, but that could be anything: comping
// out, alliance, floating, rising, someone else's coattail, anything is possible",
// and "don't announce every strategy, rather show it with their actions in the
// course of the whole season".
//
// So a strategy is a property of the person, read out of who they are (archetype)
// and what they can do (stats), drawn in proportion, never a threshold. It is
// played in the engine (bb-events/game-style.js: the moves; bb/strategy.js: a
// floater joins the winning side of a vote more easily, a coattail rider votes the
// way their anchor wants) and shown through those moves, not said.
//
//   comp        win your safety: train, study, take every competition seriously
//   alliance    build the numbers and run them
//   social      be everybody's friend; nobody votes out somebody they like
//   float       stay next to whoever holds the power this week
//   coattail    attach to the strongest player and ride
//   manipulate  lie, set people against each other (villain archetypes, and a
//               neutral with strategic >= 6 and loyalty <= 4, as everywhere)
//   loyal       pick a side and never leave it
//   lowkey      lie low, let the big players knock each other out ... then 'rise'
//   rise        late in the season: the quiet one makes their move
//   provoke     stir things up in the open, make the house react
//   read        watch, listen, know more than anybody thinks you know
//
// A strategy can change, the way it does on the real show: the lowkey player
// rises once the house is small, the coattail rider whose anchor leaves has to
// find another (or float), a floater who keeps winning becomes a comp player.
// Every change is logged (gs.bb.styleLog) so the screen can say when it turned.
import { gs, players } from '../core.js';
import { pStats } from '../players.js';
import { getBond } from '../bonds.js';
import { stableRng } from './knowledge.js';

export const STYLES = ['comp', 'alliance', 'social', 'float', 'coattail', 'manipulate', 'loyal', 'lowkey', 'rise', 'provoke', 'read'];
const VILLAIN = new Set(['villain', 'mastermind', 'schemer']);
const NEUTRAL = new Set(['hothead', 'challenge-beast', 'wildcard', 'chaos-agent', 'floater', 'perceptive-player']);
const archOf = n => (players || []).find(p => p.name === n)?.archetype || '';

/** The archetype rule for scheming (CLAUDE.md "Archetype Behavior Rules"). */
function mayScheme(name) {
  const a = archOf(name), s = pStats(name);
  return VILLAIN.has(a) || (NEUTRAL.has(a) && (s.strategic ?? 5) >= 6 && (s.loyalty ?? 5) <= 4);
}

/** How strongly each strategy suits this person: { style: weight }. Proportional throughout. */
export function styleWeights(name) {
  const s = pStats(name), a = archOf(name);
  const v = k => (s[k] ?? 5) / 10;
  const comps = (v('physical') + v('endurance') + v('mental')) / 3;
  const boost = (map) => map[a] || 1;
  return {
    comp: comps * comps * 1.6 * boost({ 'challenge-beast': 3, hero: 1.3 }),
    alliance: (v('strategic') * 0.6 + v('social') * 0.4) * v('strategic') * boost({ mastermind: 2.6, schemer: 1.4, 'loyal-soldier': 1.2 }),
    social: v('social') * v('social') * boost({ 'social-butterfly': 2.8, showmancer: 1.6, hero: 1.2 }),
    float: (1 - v('boldness')) * (1 - v('loyalty') * 0.5) * boost({ floater: 3, goat: 1.5 }),
    coattail: (1 - comps) * (0.4 + v('loyalty') * 0.6) * (1 - v('boldness') * 0.5) * boost({ goat: 2.4, underdog: 1.3, 'loyal-soldier': 1.2, showmancer: 1.2 }),
    manipulate: mayScheme(name) ? v('strategic') * (1 - v('loyalty')) * 1.4 * boost({ villain: 2.6, schemer: 2.6, mastermind: 1.6 }) : 0,
    loyal: v('loyalty') * v('loyalty') * boost({ 'loyal-soldier': 2.6, hero: 2 }),
    lowkey: (1 - v('boldness')) * v('intuition') * boost({ underdog: 3, floater: 1.2, 'perceptive-player': 1.2 }),
    rise: 0,
    // stirring the house up is a hothead's and a chaos agent's way; a nice archetype rarely plays like that
    provoke: v('boldness') * (1 - v('temperament')) * boost({ hothead: 2.6, 'chaos-agent': 2.6, wildcard: 1.6, hero: 0.4, 'loyal-soldier': 0.4, 'social-butterfly': 0.4, goat: 0.4, underdog: 0.4, showmancer: 0.6 }),
    read: v('intuition') * v('intuition') * boost({ 'perceptive-player': 3, mastermind: 1.2 }),
  };
}

function store() { return ((gs.bb ||= {}).styles ||= {}); }
function log() { return ((gs.bb ||= {}).styleLog ||= []); }

/** This houseguest's strategy, drawn the first time it is asked for (stable for the season's salt). */
export function styleOf(name) {
  if (!name) return null;
  const st = store();
  if (st[name]) return st[name];
  const w = styleWeights(name);
  const total = Object.values(w).reduce((x, y) => x + y, 0);
  let r = stableRng(gs.bb?.seasonSalt || 0, 'game-style', name)() * total;
  let pick = 'social';
  for (const [k, x] of Object.entries(w)) { if ((r -= x) <= 0) { pick = k; break; } }
  st[name] = pick;
  log().push({ name, style: pick, week: 0, why: 'how they came in' });
  return pick;
}

/** Everybody in the house with this strategy now. */
export const playing = (style, house) => (house || []).filter(n => styleOf(n) === style);

const winsOf = n => { const r = gs.bb?.stats?.[n] || {}; return (r.hohWins || 0) + (r.vetoWins || 0) + (r.blockBusterWins || 0); };

/** The strongest player a coattail rider can stand next to: most wins, and at least not an enemy. */
export function anchorOf(name, house) {
  const pool = (house || gs.activePlayers || []).filter(n => n !== name && getBond(name, n) > -1);
  return pool.sort((x, y) => winsOf(y) - winsOf(x) || getBond(name, y) - getBond(name, x))[0] || null;
}

/**
 * The strategies, revised once a week, before anybody plays: the turns a real season takes.
 * Returns what changed: [{ name, from, to, why }].
 */
export function reviseStyles(week, house) {
  const st = store(), out = [];
  const n = (house || []).length;
  for (const name of house || []) {
    const was = styleOf(name);
    let to = was, why = '';
    if (was === 'lowkey' && n <= 7) { to = 'rise'; why = 'the house got small enough to make a move'; }
    else if (was === 'coattail') {
      const anchor = st[`anchor:${name}`];
      if (anchor && !(house || []).includes(anchor)) {
        const next = anchorOf(name, house);
        if (next && winsOf(next) >= 1) { st[`anchor:${name}`] = next; }
        else { to = 'float'; why = `${anchor} is gone and nobody else is worth riding`; }
      } else if (!anchor) { const a = anchorOf(name, house); if (a) st[`anchor:${name}`] = a; }
    } else if (was === 'float' && winsOf(name) >= 2) { to = 'comp'; why = 'kept winning, so stopped hiding'; }
    if (to !== was) {
      st[name] = to;
      log().push({ name, style: to, from: was, week: week?.num || 0, why });
      out.push({ name, from: was, to, why });
    }
  }
  return out;
}

/** How easily somebody joins a vote that is already going one way (bb/strategy.js applyHouseBandwagon). */
export function bandwagonFactor(name) {
  const s = styleOf(name);
  return s === 'float' ? 1.8 : s === 'coattail' ? 1.3 : s === 'social' ? 1.15 : s === 'loyal' ? 0.6 : s === 'provoke' ? 0.7 : 1;
}

/** The anchor a coattail rider is following this week, if any. */
export const anchorFor = name => (styleOf(name) === 'coattail' ? store()[`anchor:${name}`] || null : null);
