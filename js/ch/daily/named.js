// ══════════════════════════════════════════════════════════════════════
// ch/daily/named.js — being named, out loud, in a daily
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-16, on Buried: "they basically calling the snake the fakest the meanest or the one i wanna
// bring to the finale cause theres no reaction during or after ... emotional or betrayal could?" and "same for
// other same type challenges". Buried, Who Said It, Food Wars and Poison Cup all have somebody name somebody in
// front of the house. What it costs depends on who said it: a stranger calling you a snake is the game; a
// friend, an alliance-mate or a partner doing it is a betrayal.
//
//   betrayed  a friend, an ally or a partner named them: a much colder bond, a grudge that lasts, morale down
//   fires     a short fuse snaps back on the spot: the bond goes cold both ways
//   expected  an enemy named them: no surprise, a little colder
//   laughs    somebody they barely know: shrugged off
//   flattered the one they'd take to the final: warmer
//   proud     the biggest threat: no wound, a little paranoia
//
// Every sting is kept for the day (state.dailyStings); the worst one becomes a scene after the daily
// (season.js, right after the daily).
import { getBond, addBond } from '../../bonds.js';
import { S } from '../state.js';
import { nudge } from '../mind.js';
import { remember } from '../rel.js';

const allied = (state, a, b) => (state.alliances || []).some(x => !x.ended && x.members.includes(a) && x.members.includes(b));
const paired = (state, a, b) => (state.couples || []).some(c => !c.ended && ((c.a === a && c.b === b) || (c.a === b && c.b === a)));

export function namedSting(state, rng, by, named, q, { base = 0.35 } = {}) {
  if (!by || !named || by === named) return null;
  const c = getBond(named, by);
  if (q === 'final') {
    addBond(named, by, 0.3 + Math.max(0, c) * 0.04);
    return { kind: 'flattered', w: 0 };
  }
  // the biggest threat is half a compliment: it paints a target, it doesn't wound
  if (q === 'threat') {
    nudge(state, named, 'paranoia', 0.3);
    return { kind: rng() < 0.5 ? 'proud' : null, w: 0 };
  }
  const ally = allied(state, by, named), couple = paired(state, by, named);
  const w = 1 + Math.max(0, c) * 0.25 + (ally ? 1 : 0) + (couple ? 1.5 : 0);
  addBond(named, by, -base * w);
  remember(named, by, 'named-me', 0.5 * w, { q, friend: w > 1.5 });
  let kind;
  if (couple || ally || c >= 2) {
    kind = 'betrayed';
    nudge(state, named, 'morale', -0.3 * w);
    nudge(state, named, 'paranoia', 0.3);
  } else if (rng() < Math.max(0, 10 - S(named, 'temperament')) / 14) {
    // snapping back costs the one who said it too
    kind = 'fires';
    addBond(by, named, -0.25);
  } else kind = c <= -2 ? 'expected' : 'laughs';
  (state.dailyStings ||= []).push({ by, named, q, kind, w });
  return { kind, w };
}

/** The worst sting of the day, for its scene after the daily: a betrayal first, then a snap. */
export function worstSting(state) {
  const list = (state.dailyStings || []).filter(s => s.kind === 'betrayed' || s.kind === 'fires');
  state.dailyStings = [];
  return list.sort((x, y) => (y.kind === 'betrayed') - (x.kind === 'betrayed') || y.w - x.w)[0] || null;
}
