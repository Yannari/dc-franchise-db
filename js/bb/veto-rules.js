// ══════════════════════════════════════════════════════════════════════
// bb/veto-rules.js — what shape the medallion is this week
// ══════════════════════════════════════════════════════════════════════
//
// The veto is not one object. Across the format's history it has changed
// authority (the Diamond names the replacement), obligation (the Forced veto
// must be used), count (a Double puts a second medallion in the room) and
// knowledge (a Secret one is used without the house learning whose hand did
// it) — and every one of those was, historically in this codebase and every
// other, a reason to write another ceremony.
//
// It is one ceremony reading a profile instead. The profile has two halves,
// because the variants are genuinely two different kinds of thing:
//
//   primary   properties OF the week's own medallion — who owns the empty
//             chair, whether the holder has a choice about using it, whether
//             the house sees who used it.
//
//   extra     ADDITIONAL medallions. A Double veto is not a stronger veto, it
//             is a second one, and it can save a second nominee and force a
//             second replacement. This is the half that actually stresses the
//             ceremony, because the block gets rewritten twice in one meeting
//             and a nominee saved by the first may not be renominated by the
//             second.
//
// Both halves resolve from the same two sources the Diamond already used: the
// scheduled twist's contract rules, or a power instance somebody is holding.
// A season can therefore announce "this week's veto is the Double" or hand the
// same shape to one person in secret through Pandora's Box, and the ceremony
// below cannot tell the difference and does not need to.
import { gs } from '../core.js';
import { activePowerAt } from './powers.js';

/** The shapes the medallion can take, and what each one changes. */
export const VETO_VARIANTS = Object.freeze({
  diamond: { changes: 'authority', powerId: 'diamond-veto' },
  forced: { changes: 'obligation' },
  double: { changes: 'count' },
  secret: { changes: 'knowledge' },
});

const DEFAULT_PRIMARY = Object.freeze({
  authority: 'hoh', mustUse: false, visibility: 'public',
});

/**
 * Who ends up holding a second medallion.
 *
 * The Double is won: it is the same competition, and the person who came
 * closest to winning it gets the other one, which is why it changes the week
 * so much more than an extra power handed out at random would. The Secret is
 * not won by anybody in public — it goes to somebody the house is not watching,
 * on the same popularity weighting every other audience channel uses.
 */
function _secondHolder(kind, { vetoWinner, vetoPlayers = [], house = [], hoh = null, rng = Math.random }) {
  const pool = (kind === 'double'
    ? vetoPlayers.filter(n => n && n !== vetoWinner && house.includes(n))
    : house.filter(n => n && n !== vetoWinner && n !== hoh));
  if (!pool.length) return null;
  if (kind === 'double') return pool[0];      // the field is already in finishing order
  const weights = pool.map(name => ({ name, w: Math.max(0.6, 3 + (gs.popularity?.[name] || 0)) }));
  const total = weights.reduce((sum, c) => sum + c.w, 0);
  let roll = rng() * total;
  let picked = weights[weights.length - 1];
  for (const c of weights) { roll -= c.w; if (roll <= 0) { picked = c; break; } }
  return picked.name;
}

/**
 * The week's veto profile.
 *
 * @returns {{primary: object, extra: object[]}}
 */
export function resolveVetoRules({
  week, vetoWinner = null, vetoPlayers = [], house = [], hoh = null, rng = Math.random,
} = {}) {
  const rules = week?.twistState?.rules || {};
  const primary = { ...DEFAULT_PRIMARY };
  const extra = [];

  // ── the Diamond, in both of the ways it can arrive ──
  //
  // Kept exactly as it was rather than re-expressed: this function has to be
  // able to replace the old boolean without changing a single diamond week,
  // which is the only way to know the refactor was safe.
  const granted = activePowerAt('veto-ceremony', week?.num);
  if (rules.replacementAuthority === 'veto-holder'
    || (granted?.holder === vetoWinner && granted?.powerId === 'diamond-veto')) {
    primary.authority = 'veto-holder';
  }

  // ── obligation ──
  //
  // A veto that must be used is a different decision from a veto that may be:
  // the holder stops choosing whether to touch the block and starts choosing
  // only who to take off it, which is worse for them in every week where the
  // honest answer was "nobody".
  if (rules.vetoMustBeUsed) primary.mustUse = true;

  // ── knowledge ──
  if (rules.vetoVisibility === 'anonymous') primary.visibility = 'anonymous';

  // ── count ──
  for (const kind of ['double', 'secret']) {
    if (!rules[kind === 'double' ? 'doubleVeto' : 'secretVeto']) continue;
    const holder = _secondHolder(kind, { vetoWinner, vetoPlayers, house, hoh, rng });
    if (!holder) continue;
    extra.push({
      kind, holder,
      // A second medallion never carries the Diamond's authority unless it is
      // told to: two people rewriting the chair is a different twist again.
      authority: rules.secondVetoAuthority === 'veto-holder' ? 'veto-holder' : 'hoh',
      visibility: kind === 'secret' ? 'anonymous' : 'public',
      mustUse: false,
    });
  }

  return { primary, extra };
}

/** The old boolean, derived — so every existing reader keeps working. */
export const isDiamond = rules => rules?.primary?.authority === 'veto-holder';
