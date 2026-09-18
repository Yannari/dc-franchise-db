// ══════════════════════════════════════════════════════════════════════
// js/tr/on-trial.js — the shortlist that hangs over a whole day
// ══════════════════════════════════════════════════════════════════════
//
// THE RULE, OFF THE WIKI (thetraitors.fandom.com/wiki/On_Trial — also called
// Death Row or Death List) RATHER THAN OFF MEMORY:
//
//   "This forces the Traitors to nominate three to four contestants, one of
//    whom must be Murdered the following night. The Traitors may put
//    themselves on trial also. If one of those on trial is banished, the
//    Traitors must decide between the others whom they nominated. During
//    series where the Traitors have been too efficient at Murdering players,
//    this twist may pop up multiple times as a way to give the Faithfuls a
//    reprieve."
//
// ── WHAT THIS REPLACED, AND WHY ──────────────────────────────────────
//
// The first version of On Trial in this engine was a one-night footnote: the
// pact murdered somebody exactly as usual and the night ALSO recorded one or
// two other names that had been "on the list". The castle was never told, no
// screen drew the list, and the whole twist reached the viewer as a single
// audience-only sentence the following morning. Reported as "i still dont
// understand what on trial twist do", which was the correct reading of it —
// rendered, it was indistinguishable from a standard night.
//
// The real mechanic is nothing like that, and it is the only twist in the
// format that spans two episodes:
//
//   NIGHT ONE   the pact meets, argues, and writes three or four names.
//               NOBODY IS MURDERED. That is the reprieve: everybody not on
//               the list is safe tonight by construction.
//   THE DAY     the castle is told at breakfast. The named do the mission and
//               sit at the Round Table knowing. A banishment can take one of
//               them off the list, and a Shield can put one out of reach.
//   NIGHT TWO   the pact murders one of the names that are left. They may not
//               murder anybody else — if the room has emptied the list, the
//               night takes nobody at all.
//
// The state lives on `gs.tr.onTrial` because it has to survive the episode
// boundary; everything else about a murder shape is decided and spent inside
// one night. `done` is set when the trial is collected or lapses, and it is
// never deleted — the screens for the day in between read it, and so does the
// export.
import { gs } from '../core.js';
import { getBond } from '../bonds.js';
import { livingTraitors } from './roles.js';
import { _lineHash } from './castle/lines.js';

const hash01 = (key) => _lineHash(key) / 4294967296;

/**
 * How often the pact writes one of its own onto the list.
 *
 * The wiki sentence is "The Traitors may put themselves on trial also", and
 * they do it constantly, because a name on that list is a name the room stops
 * suspecting for a day. Higher than the death match's cover rate and for the
 * opposite reason: a chair at the card table is a one-in-four chance of dying,
 * and a name on this list is a chance the pact itself controls — they simply
 * do not choose that one tomorrow.
 *
 * THIS NUMBER IS THE WHOLE CHANNEL, exactly as `LIST_COVER_P` was before it.
 * A listed Traitor essentially always survives the collection — the pact only
 * ever takes a Faithful off its own list, so the cover is lost only to a
 * banishment — and the survivor set is therefore enriched by this probability,
 * diluted by however many Faithfuls were written down to make up the number.
 * Measured live at 0.6: survivors are 31.1% Traitor against a room of 21.0%,
 * which is a real read and a long way short of proof.
 *
 * THE FIRST TWO MEASUREMENTS OF IT WERE BOTH WRONG, in opposite directions,
 * and the mistake is recorded because it is easy to repeat. The first compared
 * the survivors against `gs.activePlayers` after a sweep had finished — the
 * endgame's two or three people, a denominator with half the pact in it — and
 * reported a 2.4x tell. The second read `gs.episodeHistory` after the same
 * sweep, which is the last season's history against the first season's names,
 * and reported the channel pointing backwards. Both numbers were the harness
 * asking the wrong season. The arm in tests/tr-on-trial.test.js now captures
 * the room and the survivors inside the sweep, while each season is live.
 */
export const TRIAL_COVER_P = 0.6;

/** Three names or four, and the show runs both. */
export function trialSize(ep, aim) {
  return hash01(`trial-size|${ep}|${aim}`) < 0.55 ? 3 : 4;
}

/**
 * The list. Returns `{ names, cover }` — `names` in a stable presentation
 * order, `cover` the fellow written on as cover, or null.
 *
 * The aim is always on it; that is the name the pact intends to take tomorrow.
 * The rest are filled the way the death match fills its chairs — from the
 * names the pact is least attached to — so a Traitor does not put their own
 * closest ally under a death sentence by accident.
 */
export function buildTrialList(ep, aim, pact = null) {
  const fellows = (pact || livingTraitors(ep)).filter(n => n !== aim);
  const alive = (gs.activePlayers || []).filter(n => n !== aim);
  const want = trialSize(ep, aim);
  const names = [aim];
  const wantCover = fellows.length && hash01(`trial-cover|${ep}|${aim}`) < TRIAL_COVER_P;
  if (wantCover) {
    names.push([...fellows].sort((a, b) =>
      hash01(`trial-fellow|${ep}|${a}`) - hash01(`trial-fellow|${ep}|${b}`))[0]);
  }
  const others = alive.filter(n => !names.includes(n) && !fellows.includes(n));
  const warmth = n => fellows.reduce((s, t) => s + Math.max(0, getBond(t, n)), 0);
  const fill = [...others].sort((a, b) =>
    (warmth(a) - warmth(b)) || (hash01(`trial-fill|${ep}|${a}`) - hash01(`trial-fill|${ep}|${b}`)));
  for (const n of fill) {
    if (names.length >= want) break;
    names.push(n);
  }
  if (names.length < 3) return { names: [], cover: null };
  return {
    names: [...names].sort((a, b) =>
      hash01(`trial-order|${ep}|${a}`) - hash01(`trial-order|${ep}|${b}`)),
    cover: wantCover ? names[1] : null,
  };
}

/** Open a trial. One at a time: a second naming while one is live is a bug. */
export function openTrial(rec) {
  gs.tr.onTrial = { ...rec, done: false, outcome: null };
  return gs.tr.onTrial;
}

/**
 * The trial the pact has to collect on TONIGHT, or null.
 *
 * `collectEp` is set when the list is written and is always the next episode:
 * the show's "one of whom must be Murdered the following night".
 */
export function liveTrial(ep) {
  const t = gs.tr && gs.tr.onTrial;
  if (!t || t.done) return null;
  return t.collectEp === ep ? t : null;
}

/**
 * The trial hanging over TODAY, or null — the day between the two nights.
 *
 * This is what the mission, the Round Table and the morning read. It is a
 * different question from `liveTrial`: that one asks "must the pact collect
 * tonight", this one asks "is the castle living under a list right now", and
 * both are true on the same episode because the day comes first.
 */
export function trialToday(ep) {
  const t = gs.tr && gs.tr.onTrial;
  if (!t) return null;
  return (t.collectEp === ep && !t.done) ? t : null;
}

/**
 * Who on the list is still takeable: alive, and not already gone at the table.
 *
 * A SHIELD IS NOT FILTERED HERE. The pact's own knowledge of who holds one is
 * per-Traitor (`shieldsSeenBy`, js/tr/powers.js) and is already a term in
 * `formPreference`; filtering it out of the pool centrally would hand the
 * whole pact a fact only one of them watched being won, which is the exact
 * visibility model the Shield's value rests on. A Traitor who saw it will
 * argue against that name; a pact that did not see it can still spend the
 * night on a wall, and the show does that too (Bulgaria S1: Gloria won a
 * Shield and the pact had to settle for somebody else).
 */
export function trialCandidates(trial) {
  const alive = gs.activePlayers || [];
  return (trial?.names || []).filter(n => alive.includes(n));
}

/**
 * THE LIST STANDS UNTIL IT IS COLLECTED.
 *
 * "One of whom must be Murdered the following night" assumes the following
 * night happens, and in this engine three things can cancel it: the room buys
 * it off with the deal, the pact spends it making an offer, or the fire round
 * arrives. Measured before this existed: 22 lists in 60 seasons were written
 * and never collected — the twist promising the castle a body tomorrow and
 * then quietly not delivering one, which is the same defect the pinned-shape
 * ledger was built for, wearing a different hat.
 *
 * So the obligation rolls forward a night instead. It is not indefinite: at
 * the end of the season an uncollected list LAPSES and is recorded as such,
 * because a list the season never got round to is a real outcome and a silent
 * one is not.
 */
export function rollTrial(ep, why) {
  const t = gs.tr && gs.tr.onTrial;
  if (!t || t.done || t.collectEp !== ep) return null;
  t.collectEp = ep + 1;
  (t.rolled ||= []).push({ from: ep, why });
  return t;
}

/** Close it, with what happened to it on the record. */
export function closeTrial(outcome, taken = null) {
  const t = gs.tr && gs.tr.onTrial;
  if (!t) return null;
  t.done = true;
  t.outcome = outcome;     // 'taken' | 'emptied' | 'lapsed'
  t.taken = taken;
  (gs.tr.trials ||= []).push({ ...t });
  return t;
}

/**
 * Names that were written down and are still in the castle after the
 * collection. The evidence channel's subject set, and the reason the twist is
 * worth running: the room watched four people live under a sentence, watched
 * one of them die, and has three survivors to think about.
 */
export function trialSurvivors(trial) {
  const alive = gs.activePlayers || [];
  return (trial?.names || []).filter(n => alive.includes(n) && n !== trial.taken);
}
