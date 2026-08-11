// ══════════════════════════════════════════════════════════════════════
// bb-events/veto-variants.js — living in a week where the medallion is wrong
// ══════════════════════════════════════════════════════════════════════
//
// The variant vetoes all change the same object, and each one changes a
// different thing about it — who owns the empty chair, whether the holder gets
// a choice, how many medallions are in the room. The ceremony narrates that.
// What the ceremony cannot narrate is what it is like to be in a house where
// it is true, which is where these live.
//
// Four situations, and none of them exists on an ordinary week:
//
//   the courting     somebody is being worked for a vote by a nominee who does
//                    not know they are holding a second medallion. The most
//                    one-sided conversation this format produces.
//   the double blame the block got rewritten twice in one meeting and the Head
//                    of Household chose neither name on it. That is a person
//                    who spent a week in power and has nothing to show for it.
//   the box          a second medallion that never came out. Everybody knows
//                    it exists, nobody knows whose pocket it is in, and the
//                    nominees have all week to do that arithmetic.
//   no say in it     a FORCED veto is the one week where "you didn't have to
//                    do that" is factually wrong — and gets said anyway, by
//                    the person who went up in the empty chair.
//
// Everything here reads `week.secondVeto` and `week.vetoRules`, which the week
// engine writes onto the week rather than only onto its act, so the reaction
// survives into the campaign and into the week after.
import { pronouns } from '../players.js';
import { pStats, band, bond, closestTo, spotlightOrder } from './_read.js';

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}

/** Current medallion only: every scene below also reads this week's block. */
const _second = ctx => ctx?.week?.secondVeto || null;

const _noms = ctx => (ctx?.week?.finalNominees || ctx?.week?.initialNominees || []);
const _after = ctx => ctx?.act === 'campaign' || ctx?.act === 'house';

// ── being worked for a vote you already have in your pocket ───────────
//
// Fires BEFORE the second medallion is spent, at the ceremony, because that is
// the only window where it is still a secret and still worth something.
const courtedInTheDark = {
  id: 'vetovar-courted-in-the-dark',
  category: 'deals',
  weight(house, ctx) {
    if (ctx?.act !== 'veto-ceremony') return 0;
    return _cast(house, ctx) ? band(13, 16) : 0;
  },
  fire(house, ctx, api) {
    const cast = _cast(house, ctx);
    if (!cast) return null;
    const { holder, suitor } = cast;
    const p = pronouns(holder);
    const text = _variant([
      `${suitor} has spent twenty minutes explaining to ${holder} why this week does not have to go the way `
        + `it looks like going. ${p.Sub} ${p.sub === 'they' ? 'are' : 'is'} holding the answer to that in `
        + `${p.posAdj} pocket and lets ${suitor} finish.`,
      `"You're the only person in here I can actually talk to." ${suitor} means it, which is what makes it `
        + `worse — ${holder} could end this conversation with one sentence and does not.`,
      `${holder} asks questions ${p.sub} already knows the answers to, because the answers tell ${p.obj} what `
        + `${suitor} is worth. ${suitor} thinks it is going well.`,
      `${suitor} is campaigning to somebody who came second in a competition and walked away with something `
        + `for it. Nobody in this house has worked that out, ${suitor} least of all.`,
    ], ctx, holder, suitor);
    api.addBond(holder, suitor, 1.1);
    api.popDelta(suitor, 0.5);
    try { api.remember(holder, suitor, 'came-to-me-first', 1, { twist: 'bb-double-veto' }); } catch { /* texture */ }
    return { text, players: [holder, suitor], badgeText: 'STILL TALKING', badgeClass: 'blue' };
  },
};

/** A second holder who has not spent it yet, and somebody working them. */
function _cast(house, ctx) {
  // The Double only. A FOUND veto's holder did not come second in anything and
  // half these lines say they did — the hidden one earns its own scene, not a
  // borrowed one that gets a fact wrong.
  const extra = (ctx?.week?.vetoRules?.extra || []).find(e => e.kind === 'double');
  if (!extra || !house.includes(extra.holder)) return null;
  if (ctx?.week?.secondVeto) return null;         // already spent — different scene
  const noms = _noms(ctx).filter(n => house.includes(n) && n !== extra.holder);
  const suitor = spotlightOrder(noms)[0]
    || spotlightOrder(house.filter(n => n !== extra.holder && n !== ctx?.hoh))[0];
  return suitor ? { holder: extra.holder, suitor } : null;
}

// ── a week in power, and neither name is yours ────────────────────────
const twoMedallions = {
  id: 'vetovar-two-medallions',
  category: 'social',
  weight(house, ctx) {
    if (!_after(ctx)) return 0;
    const sec = _second(ctx);
    const hoh = ctx?.hoh;
    if (!sec?.used || !hoh || !house.includes(hoh)) return 0;
    if (sec.anonymous || !house.includes(sec.holder)) return 0;
    // The Head of Household plays in the veto competition by right, so they can
    // come second and hold the other medallion themselves — at which point
    // there is no grievance and no second person, only somebody who rewrote
    // their own block. Different scene; not this one.
    if (sec.holder === hoh) return 0;
    return band(12, 15);
  },
  fire(house, ctx, api) {
    const sec = _second(ctx);
    const hoh = ctx?.hoh;
    if (!sec?.used || !hoh || sec.holder === hoh) return null;
    const { holder, replacement } = sec;
    const p = pronouns(hoh);
    const text = _variant([
      `${hoh} put up the original block and watched it change twice. ${holder} made the second change after the first veto decision was already over.`,
      `"I had one week." ${hoh} keeps coming back to that sentence. ${holder} rewrote the only week ${p.sub} `
        + `is ever going to get, and did it in front of everybody.`,
      `The arithmetic ${hoh} is doing is simple: two medallions came out, and ${replacement} is now sitting in a chair ${p.sub} did not put ${pronouns(replacement).obj} in.`,
      `${holder} tries to have a normal conversation with ${hoh} about something else entirely. It lasts about `
        + `a minute and a half.`,
    ], ctx, hoh, holder);
    api.addBond(hoh, holder, -1.8);
    api.suspicion(hoh, holder, 1.4);
    try { api.setTarget(hoh, holder, 'took my week off me after the meeting ended'); } catch { /* texture */ }
    try { api.remember(hoh, holder, 'rewrote-my-block', 2, { twist: 'bb-double-veto' }); } catch { /* texture */ }
    return { text, players: [hoh, holder, replacement].filter(Boolean), badgeText: 'THE SECOND CHANGE WASN’T MINE', badgeClass: 'red' };
  },
};

// ── the one that never came out ───────────────────────────────────────
const leftInTheBox = {
  id: 'vetovar-left-in-the-box',
  category: 'social',
  weight(house, ctx) {
    if (!_after(ctx)) return 0;
    const sec = _second(ctx);
    if (!sec || sec.used) return 0;
    const noms = _noms(ctx).filter(n => house.includes(n));
    return noms.length ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const sec = _second(ctx);
    const noms = _noms(ctx).filter(n => house.includes(n));
    const nominee = spotlightOrder(noms)[0];
    if (!sec || !nominee) return null;
    // Who they land on is not necessarily who has it. That is the point: a
    // medallion nobody used still costs somebody, and it is usually the wrong
    // somebody.
    const suspectPool = house.filter(n => n !== nominee && !noms.includes(n) && n !== ctx?.hoh);
    const suspect = suspectPool.sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
    if (!suspect) return null;
    const p = pronouns(nominee);
    const right = suspect === sec.holder;
    const text = _variant([
      `There was a second medallion in that meeting and it never came out. ${nominee} has spent the evening `
        + `working out who was sitting on it, and has arrived at ${suspect}${right ? '' : ', who was not'}.`,
      `${nominee} does not need to know who held it to know what it means: somebody in this house looked at `
        + `${p.obj} on that block and decided ${p.sub} could stay there.`,
      `"Somebody chose this." ${nominee} says it to nobody in particular, twice, and ${suspect} is the person `
        + `who happens to be in the room the second time.`,
      `The medallion that was not used is the loudest thing that happened at that meeting, and ${nominee} is `
        + `the only person in the house who cannot stop hearing it.`,
    ], ctx, nominee, suspect);
    api.suspicion(nominee, suspect, right ? 1.6 : 1.1);
    api.addBond(nominee, suspect, -0.9);
    api.popDelta(nominee, 0.5);
    return { text, players: [nominee, suspect], badgeText: right ? 'AND IS RIGHT' : 'AND IS WRONG',
      badgeClass: 'grey' };
  },
};

// ── the one week nobody had a choice ──────────────────────────────────
const noSayInIt = {
  id: 'vetovar-no-say-in-it',
  category: 'social',
  weight(house, ctx) {
    if (!_after(ctx)) return 0;
    return _forcedCast(house, ctx) ? band(13, 16) : 0;
  },
  fire(house, ctx, api) {
    const cast = _forcedCast(house, ctx);
    if (!cast) return null;
    const { holder, replacement, saved } = cast;
    const p = pronouns(holder);
    const text = _variant([
      `${replacement} is on the block because a rule said the medallion had to come out and ${holder} had to `
        + `put a name on it. Knowing that changes nothing about how ${replacement} says ${holder}'s name.`,
      `"You could have picked me." ${saved} says it as a joke to ${holder}. ${replacement}, two rooms away, `
        + `is not treating it as one.`,
      `${holder} explains the rule to ${replacement} carefully and completely, and it is all true, and it does `
        + `not help even slightly. ${replacement} knows whose mouth ${pronouns(replacement).posAdj} name came out of.`,
      `The only person in this house who did not get a decision this week is ${holder}, and ${p.sub} `
        + `${p.sub === 'they' ? 'are' : 'is'} the one everybody is angry with.`,
    ], ctx, holder, replacement);
    api.addBond(replacement, holder, -1.6);
    api.suspicion(replacement, holder, 1.2);
    api.popDelta(holder, -0.5);
    if (saved) api.addBond(saved, holder, 0.8);
    try { api.remember(replacement, holder, 'named-me-with-a-forced-veto', 2, { twist: 'bb-forced-veto' }); } catch { /* texture */ }
    return { text, players: [replacement, holder, saved].filter((n, i, a) => n && a.indexOf(n) === i),
      badgeText: 'A RULE SAID SO', badgeClass: 'red' };
  },
};

/** A veto that had to be used, and the two people it moved. */
function _forcedCast(house, ctx) {
  const week = ctx?.week;
  if (!week?.vetoRules?.primary?.mustUse) return null;
  const dec = week.vetoDecision;
  if (!dec?.use || !dec.holder || !dec.replacement) return null;
  if (dec.holder === dec.replacement) return null;
  if (!house.includes(dec.holder) || !house.includes(dec.replacement)) return null;
  const saved = dec.save && dec.save !== dec.holder && house.includes(dec.save) ? dec.save : null;
  // Nothing to resent when the holder saved themselves out of a chair they were
  // sitting in — that is not a favour anybody was passed over for.
  if (!saved && bond(dec.replacement, dec.holder) > 6) return null;
  return { holder: dec.holder, replacement: dec.replacement, saved };
}

export const VETO_VARIANT_EVENTS = [courtedInTheDark, twoMedallions, leftInTheBox, noSayInIt];
