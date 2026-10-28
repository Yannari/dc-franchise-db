// ══════════════════════════════════════════════════════════════════════
// ss/voice.js — the Voice's rules: the commandments, the breaks, the price
// ══════════════════════════════════════════════════════════════════════
//
// Part 2 design §3. The ten commandments are read on launch night; breaking
// one costs something, from the house's hot water to a housemate's whole
// kitty. Breaks come from BEHAVIOUR (stats, a partner in the house, a party),
// never a flat roll, and every one is a scene with a consequence.
//
// Exclusions for violence and walkouts are the engine's own departures
// (js/departures.js, behaviour-driven); this file does not duplicate them.
//
// Pure: takes the state and the hunt's context `{ stat, bond, rng, week }`.

import { burn } from './kitty.js';
import { secretOf, showClue } from './hunt.js';

/** The classic list (seasons 5–9), read on launch night. */
export const COMMANDMENTS = [
  'Stop everything and fall silent when the Voice speaks.',
  'Do what the Voice asks at once, and never contest a decision.',
  'Never interrupt the Voice.',
  'Never refuse a secret mission or a group mission.',
  'Never reveal the existence of your secret mission.',
  'Justify your nominations clearly and honestly.',
  'Never talk about the nominations with each other.',
  'Never reveal your secret to another housemate.',
  'Only ask to speak to the Voice from the confessional.',
  'Always call the Voice "the Voice".',
];
/** The revival list (seasons 12–14). */
export const COMMANDMENTS_REVIVAL = [
  'Act and speak respectfully inside the House of Secrets.',
  'Look after the house you live in.',
  'Never reveal your secret to another housemate.',
  'Never reveal the existence of your secret mission.',
  'Stop everything and fall silent when the Voice speaks.',
  'Do what the Voice asks at once, and never contest a decision.',
  'Never interrupt the Voice.',
  'Never reveal your vote once it is cast in the confessional.',
  'Only ask to speak to the Voice from the confessional.',
  'Always call the Voice "the Voice".',
];

const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const st = (ctx, n, k) => { const v = Number(ctx?.stat?.(n, k)); return Number.isFinite(v) ? v : 5; };

/** The week's punishments, read by the nominations (js/bb/secret-story.js). */
export function rulesOf(state) {
  state.rules ||= { log: [], dOffice: {}, extraVotes: {}, house: {} };
  return state.rules;
}
const addDOffice = (state, week, n) => { const r = rulesOf(state); (r.dOffice[week] ||= []).includes(n) || r.dOffice[week].push(n); };
const addVote = (state, week, n, k = 1) => { const r = rulesOf(state); ((r.extraVotes[week] ||= {})[n] = (r.extraVotes[week][n] || 0) + k); };

/**
 * Revealing your own secret (commandment 8), in any way: the kitty to zero, the
 * secret out, nominated d'office. A shared secret blurted by one costs every
 * holder (season 4: Robin told Anthony, Robin and Benoît paid together).
 * `exclude` is the season 2 rule (a season setting): out of the game instead.
 */
export function revealOwnSecret(state, ctx, who, { nominateWeek = (ctx.week ?? 0) + 1, exclude = false } = {}) {
  const s = secretOf(state, who);
  if (!s || s.found) return null;
  const lost = {};
  for (const h of s.holders) {
    lost[h] = burn(state, h, Number(state.kitty?.[h]) || 0, 'revealed their own secret', ctx.week ?? 0);
    if (!exclude) addDOffice(state, nominateWeek, h);
  }
  s.found = true; s.foundBy = null; s.selfRevealed = who; s.week = ctx.week ?? 0;
  for (const t of Object.values(state.theories || {})) for (const h of s.holders) delete t[h];
  return { holders: [...s.holders], lost, exclude };
}

/**
 * The week's rule breaks (§3). Returns acts. `party` raises the chance of a
 * slip (part 2 §15); `couples` is the set of names in a real or fake couple
 * secret, the ones who blurt "we're together" in the first weeks.
 */
export function weeklyRuleBreaks(state, ctx, { house = [], party = false } = {}) {
  rulesOf(state);
  const rng = ctx.rng || Math.random;
  const week = ctx.week ?? 0;
  const acts = [];
  const broke = new Set();
  for (const n of house) {
    if (broke.has(n)) continue;
    const temper = st(ctx, n, 'temperament'), bold = st(ctx, n, 'boldness'), strat = st(ctx, n, 'strategic');
    const s = secretOf(state, n);
    // ── commandment 8: a slip. A loose mouth, a low guard, a party. ──
    const slipP = clamp(0.004 + (10 - strat) * 0.0018 + (10 - temper) * 0.0012 + (party ? 0.012 : 0));
    if (s && !s.found && rng() < slipP) {
      broke.add(n);
      const full = rng() < 0.3;
      if (full) {
        const r = revealOwnSecret(state, ctx, n);
        acts.push({ type: 'ss-rule', week, who: n, commandment: 8, kind: 'reveal', holders: r.holders, lost: r.lost,
          secretText: s.text, punishment: 'kitty-and-nomination',
          beats: [{ text: `${n} lets the secret slip. The Voice takes the whole kitty and nominates ${r.holders.join(' and ')} d'office.`, players: r.holders, badgeText: 'SECRET REVEALED', badgeClass: 'red', part: 'rule' }] });
      } else {
        const clue = showClue(state, ctx, { holder: n, how: 'slip', house });
        addVote(state, week + 1, n, 1);
        acts.push({ type: 'ss-rule', week, who: n, commandment: 8, kind: 'heavy-clue', clue: clue?.clue || null, punishment: 'clue-and-vote',
          beats: [{ text: `${n} says far too much about their own secret. The Voice puts a clue on the table and an extra vote against ${n}.`, players: [n], badgeText: 'TOO MUCH SAID', badgeClass: 'red', part: 'rule' }] });
      }
      continue;
    }
    // ── commandment 7: talking about the nominations. ──
    const talkP = clamp(0.012 + (10 - temper) * 0.004 + bold * 0.002);
    if (rng() < talkP) {
      broke.add(n);
      const houseWide = rng() < 0.5;
      // the whole house pays: the hot water, or the week's shopping (the store stays shut)
      const what = rng() < 0.5 ? 'hot-water' : 'no-shopping';
      if (houseWide) { rulesOf(state).house[week] = what; (rulesOf(state).houseBlame ||= {})[week] = n; }
      else addVote(state, week + 1, n, 1);
      acts.push({ type: 'ss-rule', week, who: n, commandment: 7, kind: 'nominations-talk', punishment: houseWide ? what : 'extra-vote',
        beats: [{ text: houseWide ? `${n} talks about the nominations. The whole house loses ${what === 'hot-water' ? 'its hot water' : "this week's shopping"}.` : `${n} talks about the nominations, and will carry an extra vote against them.`,
          players: [n], badgeText: 'COMMANDMENT 7', badgeClass: 'red', part: 'rule' }] });
      continue;
    }
    // ── commandment 2: contesting the Voice. ──
    const contestP = clamp((10 - temper) * 0.003 + bold * 0.0015);
    if (rng() < contestP) {
      broke.add(n);
      const fine = burn(state, n, 1000 + Math.round(rng() * 4) * 500, 'contested the Voice', week);
      acts.push({ type: 'ss-rule', week, who: n, commandment: 2, kind: 'contest', punishment: 'fine', amount: fine,
        beats: [{ text: `${n} argues with the Voice and loses $${fine.toLocaleString('en-US')} for it.`, players: [n], badgeText: 'COMMANDMENT 2', badgeClass: 'red', part: 'rule' }] });
    }
  }
  return acts;
}

/** Nominated d'office for a week, and extra votes against. */
export const dOfficeFor = (state, week) => [...(state?.rules?.dOffice?.[week] || [])];
export const extraVotesFor = (state, week) => ({ ...(state?.rules?.extraVotes?.[week] || {}) });
