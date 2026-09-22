// ══════════════════════════════════════════════════════════════════════
// pm/ladder.js — what we are to each other (spec §6.7)
// ══════════════════════════════════════════════════════════════════════
//
// Pure state; the scenes are made in villa-day.js. Most rungs are ONE
// person's declaration: "closed off" is unilateral (Tyla; Molly and Zach),
// "exclusive" and "official" are an ask and a yes (Zach asked Kayda, Bryce
// asked Trinity — US S8). Each side also BELIEVES something about the other's
// rung, and the gap between the two is a situationship.
import { romance } from './feelings.js';
import { getRelationshipDimension } from '../relationships.js';

export const STEPS = ['coupled', 'cracking-on', 'open', 'closed-off', 'exclusive', 'official'];
// How much a partner's straying hurts, by the rung you believe they are on.
export const BETRAYAL = { coupled: 0.3, 'cracking-on': 0.4, open: 0.5, 'closed-off': 1.0, exclusive: 1.3, official: 1.6 };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const at = s => Math.max(0, STEPS.indexOf(s || 'coupled'));
const pair = (a, b) => [a, b].sort().join('|');

export const stepOf = (state, a, b) => state.ladder?.[`${a}→${b}`] || null;
export function setStep(state, a, b, step) { (state.ladder ||= {})[`${a}→${b}`] = step; }
export function believedStep(state, viewer, a) {
  const v = state.ladderBelief?.[`${viewer}:${a}→${viewer}`];
  return v ?? stepOf(state, a, viewer);
}
export function believeStep(state, viewer, a, step) { (state.ladderBelief ||= {})[`${viewer}:${a}→${viewer}`] = step; }
/** `a` tells `viewer` where they stand — the belief becomes the truth. */
export function tellStep(state, viewer, a) { believeStep(state, viewer, a, stepOf(state, a, viewer)); }

/** Couples that formed start on `coupled`; couples that ended leave the ladder. */
export function syncLadder(state) {
  const live = new Set(state.couples.map(([a, b]) => pair(a, b)));
  for (const key of Object.keys(state.ladder || {})) {
    const [a, b] = key.split('→');
    if (!live.has(pair(a, b))) { delete state.ladder[key]; if (state.ladderBelief) delete state.ladderBelief[`${b}:${a}→${b}`]; }
  }
  for (const key of Object.keys(state.coupledSince || {})) if (!live.has(key)) delete state.coupledSince[key];
  for (const [a, b] of state.couples) {
    for (const [x, y] of [[a, b], [b, a]]) if (!stepOf(state, x, y)) { setStep(state, x, y, 'coupled'); tellStep(state, y, x); }
    (state.coupledSince ||= {})[pair(a, b)] ??= state.day || 0;
  }
}

export const closedness = (state, a, b) => clamp((at(stepOf(state, a, b)) - 2) / 3, 0, 1);
export const believedCloseness = (state, viewer, partner) => clamp((at(believedStep(state, viewer, partner)) - 2) / 3, 0, 1);
export const betrayalWeight = (state, viewer, partner) => BETRAYAL[believedStep(state, viewer, partner) || 'coupled'];
/** How settled a couple looks to the villa: the LOWER of the two rungs. */
export const coupleStrength = (state, a, b) =>
  clamp(Math.min(at(stepOf(state, a, b)), at(stepOf(state, b, a))) / (STEPS.length - 1), 0, 1);
/** b believes a is at least two rungs further up than a is. */
export const situationship = (state, a, b) => at(believedStep(state, b, a)) - at(stepOf(state, a, b)) >= 2;

const INTENT_PACE = { love: 1.2, 'settle-down': 1.35, 'first-love': 1.25, 'fresh-start': 0.9, fun: 0.5,
  stir: 0.45, fame: 0.8, win: 0.85, money: 0.7 };

/** How ready A is to climb toward B, 0..1. Proportional in every term. */
export function readiness(state, a, b, attachmentOf = null) {
  const p = state.profiles[a], s = p.stats;
  const rom = romance(a, b) / 10, love = getRelationshipDimension(a, b, 'love') / 10;
  const trust = (getRelationshipDimension(a, b, 'trust') + 10) / 20;
  const since = state.coupledSince?.[pair(a, b)] ?? state.day ?? 0;
  const days = Math.max(0, (state.day || 0) - since);
  const att = attachmentOf ? attachmentOf(p) : { anxiety: 0, avoidance: 0 };
  return clamp(rom * (0.45 + 0.55 * love) * (0.5 + 0.5 * trust) * (0.6 + 0.4 * s.loyalty / 10)
    * (INTENT_PACE[p.intent] ?? 1) * (1 + 0.4 * att.anxiety - 0.45 * att.avoidance)
    * Math.min(1, 0.35 + days / 12), 0, 1);
}

/** The strongest pull A feels toward anybody but B — a turned head. */
export function headTurn(state, a, b) {
  let best = 0;
  for (const o of state.villa) if (o !== a && o !== b) best = Math.max(best, romance(a, o));
  return best;
}

/**
 * One day of ladder decisions for every couple, as plain records. The asks
 * can be declined; a turned head steps back down and may not say so.
 */
export function decideLadder(state, rng, attachmentOf = null) {
  const out = [];
  for (const [a, b] of state.couples) {
    for (const [x, y] of [[a, b], [b, a]]) {
      const cur = stepOf(state, x, y) || 'coupled';
      const r = readiness(state, x, y, attachmentOf);
      const turned = headTurn(state, x, y) - romance(x, y);
      if (at(cur) >= at('closed-off') && turned > 1 && rng() < clamp(turned / 8, 0, 0.6)) {
        setStep(state, x, y, 'open');
        // Telling your partner you've opened back up takes loyalty.
        const told = rng() < 0.1 + 0.8 * state.profiles[x].stats.loyalty / 10;
        if (told) tellStep(state, y, x);
        out.push({ kind: 'open-back-up', from: x, to: y, told, was: cur });
        continue;
      }
      if (cur === 'coupled' && rng() < r * 0.9) {
        setStep(state, x, y, 'cracking-on'); tellStep(state, y, x);
        out.push({ kind: 'cracking-on', from: x, to: y });
      } else if (cur === 'cracking-on' && rng() < 0.6) {
        if (turned > -1) { setStep(state, x, y, 'open'); tellStep(state, y, x); out.push({ kind: 'keeping-open', from: x, to: y }); }
        else if (rng() < r * 1.2) { setStep(state, x, y, 'closed-off'); tellStep(state, y, x); out.push({ kind: 'close-off', from: x, to: y }); }
      } else if (cur === 'open' && turned < 0 && rng() < r * 0.9) {
        setStep(state, x, y, 'closed-off'); tellStep(state, y, x);
        out.push({ kind: 'close-off', from: x, to: y });
      }
    }
    // The asks: at most one per couple per day, made by the readier, bolder one.
    const ra = readiness(state, a, b, attachmentOf), rb = readiness(state, b, a, attachmentOf);
    const [asker, askee] = ra + state.profiles[a].stats.boldness / 20 >= rb + state.profiles[b].stats.boldness / 20 ? [a, b] : [b, a];
    const rAsk = Math.max(ra, rb), rYes = readiness(state, askee, asker, attachmentOf);
    const both = Math.min(at(stepOf(state, a, b)), at(stepOf(state, b, a)));
    if (both >= at('open') && both < at('exclusive') && at(stepOf(state, asker, askee)) >= at('open')
      && rng() < rAsk * 0.5) {
      const yes = rng() < clamp(0.15 + rYes * 1.1, 0, 0.97);
      if (yes) { setStep(state, a, b, 'exclusive'); setStep(state, b, a, 'exclusive'); tellStep(state, a, b); tellStep(state, b, a); }
      out.push({ kind: 'exclusive-ask', from: asker, to: askee, yes });
    } else if (both === at('exclusive') && rng() < rAsk * 0.35) {
      const yes = rng() < clamp(0.1 + rYes * 1.15, 0, 0.97);
      if (yes) { setStep(state, a, b, 'official'); setStep(state, b, a, 'official'); tellStep(state, a, b); tellStep(state, b, a); }
      out.push({ kind: 'official-ask', from: asker, to: askee, yes });
    }
    // "I love you" — said once, returned or left hanging.
    for (const [x, y] of [[a, b], [b, a]]) {
      if (state.loveSaid?.[`${x}→${y}`] != null) continue;
      const love = getRelationshipDimension(x, y, 'love');
      const att = attachmentOf ? attachmentOf(state.profiles[x]) : { anxiety: 0, avoidance: 0 };
      if (rng() < clamp((love - 5) / 10 * (0.6 + att.anxiety - 0.5 * att.avoidance), 0, 0.5)) {
        (state.loveSaid ||= {})[`${x}→${y}`] = state.day;
        const back = getRelationshipDimension(y, x, 'love') >= 6;
        if (back) state.loveSaid[`${y}→${x}`] = state.day;
        out.push({ kind: back ? 'love-said' : 'love-hanging', from: x, to: y });
      }
    }
  }
  return out;
}
