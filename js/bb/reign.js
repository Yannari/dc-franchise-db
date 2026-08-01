// ══════════════════════════════════════════════════════════════════════
// bb/reign.js — how well somebody wore the power, and what it cost them
// ══════════════════════════════════════════════════════════════════════
//
// Winning Head of Household was pure upside. You could not be evicted, you
// picked the nominations, and on Thursday the week ended and nothing about how
// you had spent it followed you anywhere. That is the one week of the format
// with the most consequences attached to it in real life and it had none here.
//
// The fandom has a word for the classic failure — HOHitis — and the case that
// named it is instructive. Devin, in the sixteenth season, called a house
// meeting, opened it with "this is not a dictatorship", then went round his own
// alliance asking each of them who they wanted to keep. One of them answered
// honestly, the alliance came apart in the room, and the house united over
// disliking him. He was the target the following week. Ronnie, in the
// eleventh, ran a reign so badly the house bonded over hating him.
//
// The opposite failure is less discussed and just as expensive: the frightened
// Head of Household who nominates two pawns nobody wants gone, lets the house
// tell them what to do, and spends the only week of power they will ever get
// achieving nothing. Nobody fears them afterwards and nobody owes them
// anything, which is the worst of both.
//
// So a reign is scored on what actually happened in it — did the person they
// were after go home, how many enemies did they make doing it, did the people
// they were protecting end up protected — and the answer follows them. A good
// week buys standing. A bad one buys a target on your back the moment the
// power moves on, which is exactly what the show does to people.

import { gs, players } from '../core.js';
import { pStats } from '../players.js';
import { getBond } from '../bonds.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const live = () => (gs.activePlayers || []).filter(Boolean);
const archetypeOf = name => players.find(p => p.name === name)?.archetype || '';

function ensure() {
  gs.bb ||= {};
  gs.bb.reigns ||= {};
  return gs.bb.reigns;
}

/**
 * Which way this Head of Household is likely to go wrong.
 *
 * Read at the START of the reign, because it decides which scenes are available
 * to them for the week — a nervous houseguest does not call a house meeting and
 * a swaggering one does not ask the house who to nominate.
 *
 * Deliberately proportional rather than a switch: most reigns are neither, and
 * the interesting ones are the players who are one bad afternoon away from
 * either failure.
 */
export function reignTemperament(name) {
  if (!name) return { ego: 0, nerves: 0, mode: 'steady' };
  const stats = pStats(name);
  const arch = archetypeOf(name);
  // Ego: the power confirms what they already suspected about themselves.
  let ego = (stats.boldness * 0.5 + (10 - stats.temperament) * 0.35 + stats.social * 0.15) / 10;
  if (['villain', 'hothead', 'chaos-agent', 'challenge-beast'].includes(arch)) ego += 0.18;
  if (['goat', 'floater', 'underdog'].includes(arch)) ego -= 0.2;
  // Nerves: the power is a thing that can be taken away and blamed on them.
  let nerves = ((10 - stats.boldness) * 0.5 + (10 - stats.strategic) * 0.3
    + stats.loyalty * 0.2) / 10;
  if (['goat', 'floater', 'loyal-soldier'].includes(arch)) nerves += 0.18;
  if (['mastermind', 'villain', 'schemer'].includes(arch)) nerves -= 0.15;
  ego = clamp(ego, 0, 1); nerves = clamp(nerves, 0, 1);
  return {
    ego, nerves,
    mode: ego > 0.62 && ego > nerves ? 'hohitis'
      : nerves > 0.62 && nerves > ego ? 'frightened' : 'steady',
  };
}

/**
 * What the week actually achieved, judged after it ends.
 *
 * Five questions, and every one of them is answered from the record rather than
 * from intent: a Head of Household who meant well and lost their target still
 * lost their target.
 */
export function scoreReign(week) {
  if (!week?.hoh) return null;
  const hoh = week.hoh;
  const target = week.plan?.target || null;
  const evicted = week.evicted || null;
  const noms = week.finalNominees || [];

  // Did the person they came for actually go?
  const gotTheTarget = !!(target && evicted && target === evicted);
  const lostTheTarget = !!(target && evicted && target !== evicted);
  // Was it worth doing? Evicting a pawn nobody feared is a week spent on
  // nothing, and the house can tell the difference.
  const bootWasThreat = evicted
    ? (gs.bb?.stats?.[evicted]?.hohWins || 0) + (gs.bb?.stats?.[evicted]?.vetoWins || 0) > 0
      || (week.plan?.rankings || []).slice(0, 3).some(r => r.name === evicted)
    : false;
  // How much damage did they do to their own standing doing it?
  const enemies = (week._reignEnemies || []).filter(n => live().includes(n));
  // And did the people on their side end up safe?
  const alliesProtected = (gs.namedAlliances || [])
    .filter(a => a.active !== false && (a.members || []).includes(hoh))
    .flatMap(a => a.members || [])
    .filter(n => n !== hoh && !noms.includes(n) && n !== evicted).length;

  let score = 0;
  if (gotTheTarget) score += 3;
  if (lostTheTarget) score -= 2.5;
  if (evicted && bootWasThreat) score += 1.5;
  if (evicted && !bootWasThreat) score -= 1;
  score -= enemies.length * 1.2;
  score += Math.min(3, alliesProtected) * 0.4;
  // A reign that produced no eviction at all — the block blown up by a veto and
  // a replacement nobody wanted — is its own kind of failure.
  if (!evicted) score -= 1.5;

  const verdict = score >= 2.5 ? 'strong' : score >= 0 ? 'competent' : score >= -2.5 ? 'poor' : 'disastrous';
  return {
    hoh, week: week.num || 0, score, verdict,
    gotTheTarget, lostTheTarget, bootWasThreat,
    enemies: [...enemies], target, evicted,
  };
}

/** Remember it, so the house can hold it against them later. */
export function recordReign(week) {
  const result = scoreReign(week);
  if (!result) return null;
  const store = ensure();
  (store[result.hoh] ||= []).push(result);
  return result;
}

export function reignsOf(name) {
  return (ensure()[name] || []).slice();
}

/** The most recent reign, which is the one the house is still talking about. */
export function lastReign(name) {
  const all = reignsOf(name);
  return all.length ? all[all.length - 1] : null;
}

/**
 * What their record as a Head of Household does to how targetable they are.
 *
 * This is the mechanism the format is famous for and the house had no version
 * of: the week after a bad reign is when you go up. A disastrous week is worth
 * more heat than most grudges, and it fades — two weeks later the house has a
 * newer thing to be annoyed about.
 */
export function reignHeat(candidate, currentWeek = 0) {
  const last = lastReign(candidate);
  if (!last) return 0;
  const age = Math.max(0, (currentWeek || 0) - last.week);
  if (age > 2) return 0;
  const fade = age === 0 ? 1 : age === 1 ? 0.7 : 0.35;
  const base = last.verdict === 'disastrous' ? 3.2
    : last.verdict === 'poor' ? 1.6
    : last.verdict === 'strong' ? -0.8   // a good week buys a little grace
    : 0;
  return base * fade;
}

/** For the screens: a sentence about how they wore it. */
export function describeReign(result) {
  if (!result) return '';
  const { hoh, verdict, gotTheTarget, lostTheTarget, enemies, evicted, bootWasThreat } = result;
  if (verdict === 'disastrous') {
    return `${hoh} had the only power in the house and finished the week with `
      + `${enemies.length ? `${enemies.length} new ${enemies.length === 1 ? 'enemy' : 'enemies'}` : 'nothing to show for it'}`
      + `${lostTheTarget ? ` and the person they came for still here` : ''}.`;
  }
  if (verdict === 'poor') {
    return lostTheTarget
      ? `${hoh} missed. ${result.target} is still in this house and now knows exactly where they stand.`
      : `${hoh} spent a week of power on ${evicted || 'nobody'}, which changes very little.`;
  }
  if (verdict === 'strong') {
    return `${hoh} got ${evicted}${bootWasThreat ? ', who was a real problem,' : ''} and walked out of the week `
      + `with ${enemies.length ? 'a bruise or two' : 'the house more or less intact'}.`;
  }
  return `${hoh} did the job${gotTheTarget ? '' : ' more or less'} and nobody will be writing songs about it.`;
}

/** Mark somebody as having been alienated BY the reign, not merely by the vote. */
export function reignMadeAnEnemy(week, name) {
  if (!week || !name) return;
  (week._reignEnemies ||= []).push(name);
}
