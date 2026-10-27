// ══════════════════════════════════════════════════════════════════════
// bb/hoh-fish.js — the target goes up to the HOH room and asks "am I going up?"
// ══════════════════════════════════════════════════════════════════════
//
// Decided here, in the engine, before the nomination ceremony, so it can cost
// something. It used to be rolled by the writer (bb/story/gametalk.js), which
// meant a lie to somebody's face changed nothing: the user, 2026-10-27, on Paisley
// telling Alexander "you're not even on my radar" and putting him up anyway:
// "for the more fiery temperament it should create a sort of resentment that could
// build up to the nom ceremony", and "not everyone has to lie about a nomination,
// especially when they don't need to (easy target, bad relationship, honest person)".
//
// What the HOH says is proportional to who they are and to whether a lie buys
// them anything:
//   need     a target who could campaign their way out (social, strategic) is worth
//            keeping calm, and a friend is worth not hurting yet; somebody already
//            openly at war with the HOH has nothing left to protect
//   liar     strategic and disloyal lie more; a nice archetype lies less, and more
//            the more strategic they are (the user, 2026-10-23)
//   honest   bold and loyal tell it straight, more so to an enemy or an easy target;
//            a backdoor target is never told the truth
// The answer is 'lie' | 'honest' | 'deflect', kept on week.fish for the writer
// and for the ceremony (bb-events/ceremonies.js nom-lied-to), and paid for here:
// a lie is remembered as "told me I was safe" (a promise, so the broken-promise
// row can follow it in a later week); a straight answer costs a little warmth and
// earns a little respect.
import { gs, players } from '../core.js';
import { getBond, addBond } from '../bonds.js';
import { pStats } from '../players.js';
import { stableRng } from './knowledge.js';
import { rememberBBStrategy } from './shared-strategy.js';

const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const archOf = n => (players || []).find(p => p.name === n)?.archetype || '';

/** The fishing conversation of this week, decided and paid for: { fisher, hoh, how } or null. */
export function decideFish(week, hoh, plan, house) {
  const fisher = plan?.backdoorTarget || plan?.target || null;
  if (!week || !hoh || !fisher || fisher === hoh || !(house || []).includes(fisher) || week.hohSecret) return null;
  // somebody who already went up and pitched themselves this week (bb-events/power.js) is not shown asking as well
  if (week._selfPitched === fisher) return null;
  const s = pStats(hoh), f = pStats(fisher);
  const bond = getBond(hoh, fisher) || 0;
  const backdoor = plan.backdoorTarget === fisher;
  const danger = ((f.social ?? 5) + (f.strategic ?? 5)) / 20;
  const warmth = Math.max(0, bond) / 5;
  const enemies = bond <= -2 ? 1 : 0;
  const need = Math.max(0.05, danger * 0.7 + warmth * 0.5 - enemies * 0.6);
  const liar = ((s.strategic ?? 5) / 10) * (1 - (s.loyalty ?? 5) / 20)
    * (NICE.has(archOf(hoh)) ? 0.5 * (s.strategic ?? 5) / 10 : 1);
  const lie = liar * need * 1.6;
  const honest = backdoor ? 0 : ((s.boldness ?? 5) / 10) * ((s.loyalty ?? 5) / 10) * (1 + enemies * 1.2 + (1 - danger));
  const deflect = 0.35;
  const roll = stableRng(gs.bb?.seasonSalt || 0, 'hoh-fish', week.num || 0, hoh, fisher)() * (lie + honest + deflect);
  const how = roll < lie ? 'lie' : roll < lie + honest ? 'honest' : 'deflect';
  const ctx = { week, act: 'hoh' };
  if (how === 'lie') {
    // believed, for now: the target relaxes, and the HOH's word is on the record
    addBond(fisher, hoh, 0.3);
    rememberBBStrategy(fisher, hoh, 'promise', 2, { about: 'told me I was safe', week: week.num || 0 }, ctx);
  } else if (how === 'honest') {
    addBond(fisher, hoh, -0.3);
    rememberBBStrategy(fisher, hoh, 'told-me-straight', 1, { about: 'told me I was going up', week: week.num || 0 }, ctx);
  }
  return { fisher, hoh, how };
}
