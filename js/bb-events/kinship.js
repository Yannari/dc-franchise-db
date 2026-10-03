// ══════════════════════════════════════════════════════════════════════
// bb-events/kinship.js — the people who knew each other before the door
// ══════════════════════════════════════════════════════════════════════
//
// The Relationships tab carries two axes: how they FEEL about each other (the
// bond) and how they KNOW each other (the kinship). Only two things in the
// whole simulator ever read the second one — the Twin Twist looks for declared
// twins, and Rivals casts from the tense relations — so outside those twists a
// cast could declare an estranged father and daughter, a married couple and a
// pair of exes, and the house would treat all three as "two people with a
// number between them".
//
// These are the scenes that only exist because of what the pair are to each
// other. An ex is not a friend with a lower bond; a brother is not an ally with
// a higher one. The tell that this is working is that the same bond value
// produces a completely different evening depending on the relation.
//
// ── the lean is the reason these are worth writing ──
//
// A pair now has THREE numbers, not one: the shared bond, and what each of them
// privately makes of it. That is what lets a relapse be one-sided, an apology
// land on somebody who has already moved on, and a marriage end because one of
// them noticed something the other one has not. Almost every event here reads
// `feelsFor(a, b)` and `feelsFor(b, a)` separately, and several of them exist
// ONLY when those two numbers disagree.
import { gs, seasonConfig, kinshipPairs, REL_KINSHIP } from '../core.js';
import { pronouns, romanticCompat } from '../players.js';
import { feelsFor, addLean, leanGap, getBond } from '../bonds.js';
import { spotlightOrder } from './_read.js';
import { makeScene } from '../bb/script/scene.js';

const label = kin => REL_KINSHIP?.[kin]?.label || 'History';

/**
 * What one of them calls the other, in a sentence.
 *
 * `label` is the name of the RELATION and belongs on a form — "Married",
 * "Siblings". Dropped into speech it produces "you cannot be in an alliance
 * with your married" and a badge reading WOULD YOU CUT YOUR SIBLINGS. What a
 * houseguest actually says is the person.
 */
const NOUN = {
  twins: 'twin', siblings: 'sibling', 'parent-child': 'family',
  cousins: 'cousin', married: 'spouse', partners: 'partner',
  estranged: 'family', exes: 'ex', 'ex-friends': 'oldest friend',
  'old-friends': 'oldest friend in here', colleagues: 'colleague',
};
const noun = kin => NOUN[kin] || 'person';
/** What one of them calls `name` out loud: a brother, a wife — by the person's own pronouns. */
const GENDERED = { siblings: ['brother', 'sister'], married: ['husband', 'wife'] };
const spoken = (kin, name) => {
  const pair = GENDERED[kin];
  if (!pair) return noun(kin);
  let sub = 'they';
  try { sub = pronouns(name).sub; } catch { /* the plain word */ }
  return sub === 'he' ? pair[0] : sub === 'she' ? pair[1] : noun(kin);
};

const _once = (id, ctx) => !!ctx?.week?._kinFired?.[id];
const _spend = (id, ctx) => { if (ctx?.week) (ctx.week._kinFired ||= {})[id] = true; };

// ── and the ones that can only ever happen once ──
//
// Getting back together, a marriage ending, the house finding out two of them
// knew each other — these are events, not weather. Fired weekly they turned a
// season into the same reconciliation over and over.
const _spent = id => !!gs.bb?._kinOnce?.[id];
const _burn = id => { ((gs.bb ||= {})._kinOnce ||= {})[id] = true; };

/** Nothing here belongs in the middle of a ceremony. */
const _quiet = (ctx, value) => {
  if (['nominations', 'veto-ceremony', 'eviction'].includes(ctx?.act)) return 0;
  return value * (ctx?.act === 'campaign' ? 0.7 : 1);
};

/**
 * Every declared pair of the given kinds with both halves still in the house.
 *
 * Ordered by who the edit has been ignoring, so a season does not spend all of
 * these on the same two people.
 */
function _pairs(house, kinds) {
  const want = [].concat(kinds);
  const order = spotlightOrder(house);
  return kinshipPairs(want)
    .filter(p => house.includes(p.a) && house.includes(p.b))
    .sort((x, y) => Math.min(order.indexOf(x.a), order.indexOf(x.b))
      - Math.min(order.indexOf(y.a), order.indexOf(y.b)));
}

/** The first pair matching a condition, with the two sides named by feeling. */
function _pick(house, kinds, test) {
  for (const p of _pairs(house, kinds)) {
    // `warm` is whichever of them is further into it; `cold` is the other.
    const ab = feelsFor(p.a, p.b);
    const ba = feelsFor(p.b, p.a);
    const warm = ab >= ba ? p.a : p.b;
    const cold = warm === p.a ? p.b : p.a;
    const shaped = { ...p, warm, cold, warmSide: Math.max(ab, ba), coldSide: Math.min(ab, ba),
      gap: leanGap(p.a, p.b), bond: getBond(p.a, p.b) };
    if (!test || test(shaped)) return shaped;
  }
  return null;
}

const _others = (house, ...ex) => house.filter(n => n && !ex.includes(n));

// ══════════════════════════════════════════════════════════════════════
// Exes
// ══════════════════════════════════════════════════════════════════════

const exRelapse = {
  id: 'kin-ex-relapse',
  category: 'house-life',
  location: 'backyard',
  weight(house, ctx) {
    if (_once('kin-ex-relapse', ctx) || _spent('kin-ex-relapse')) return 0;
    if (seasonConfig?.romance === 'disabled') return 0;
    // Two weeks of being extremely normal about it first. Falling back into
    // bed with an ex on the first night is not a relapse, it is a cast choice.
    if ((Number(ctx?.week?.num) || 1) < 2) return 0;
    // BOTH of them, which is the whole point of having two numbers. One person
    // being warm about an ex is a different event, three below this one.
    const p = _pick(house, 'exes', x => x.coldSide >= 2 && romanticCompat(x.a, x.b));
    if (!p) return 0;
    const already = (gs.showmances || []).some(s => (s.players || []).includes(p.a)
      && (s.players || []).includes(p.b) && !s.broken);
    return already ? 0 : _quiet(ctx, 7 + p.coldSide);
  },
  fire(house, ctx, api) {
    const p = _pick(house, 'exes', x => x.coldSide >= 2 && romanticCompat(x.a, x.b));
    _spend(this.id, ctx); _burn(this.id);
    const { a, b } = p;
    const scene = makeScene('kin.relapse', { a, b }, { ending: 'scene' }, [], 'backyard');

    api.addBond(a, b, 2.6);
    api.popDelta(a, 2); api.popDelta(b, 2);
    api.showmance(a, b, { rekindled: true });
    for (const n of _others(house, a, b).slice(0, 3)) {
      api.remember(n, a, 'back-with-their-ex', 2, { about: b });
    }
    return { scene, players: [a, b], badgeText: 'BACK ON', badgeClass: 'gold' };
  },
};

const exUnrequited = {
  id: 'kin-ex-unrequited',
  category: 'house-life',
  location: 'bedroom',
  weight(house, ctx) {
    if (_once('kin-ex-unrequited', ctx)) return 0;
    // ONLY exists when the two numbers disagree. Before the lean there was no
    // way to be in this situation at all — an ex who was still in love and an
    // ex who was finished came out as one lukewarm number and behaved like two
    // people who were mildly fond of each other.
    const p = _pick(house, ['exes', 'ex-friends'], x => x.gap >= 4 && x.warmSide >= 1);
    return p ? _quiet(ctx, 8) : 0;
  },
  fire(house, ctx, api) {
    const p = _pick(house, ['exes', 'ex-friends'], x => x.gap >= 4 && x.warmSide >= 1);
    _spend(this.id, ctx);
    const { warm, cold } = p;
    const witness = _others(house, warm, cold)[0];
    const scene = makeScene('kin.unrequited', { a: warm, b: cold, c: witness || null }, { ending: 'scene' }, [], 'bedroom');

    // It costs them, in the only currency this house has: the person carrying
    // it plays worse, and the room notices who is doing the wanting.
    addLean(warm, cold, -0.6);
    api.addBond(warm, cold, -0.3);
    api.popDelta(warm, 1);
    if (witness) api.remember(witness, warm, 'not-over-them', 2, { about: cold });
    return { scene, players: [warm, cold], badgeText: 'ONE OF THEM IS NOT OVER IT', badgeClass: 'blue' };
  },
};

const exColdWar = {
  id: 'kin-ex-cold-war',
  category: 'house-life',
  location: 'kitchen',
  weight(house, ctx) {
    if (_once('kin-ex-cold-war', ctx)) return 0;
    const p = _pick(house, ['exes', 'ex-friends'], x => x.warmSide <= 0);
    return p ? _quiet(ctx, 7) : 0;
  },
  fire(house, ctx, api) {
    const p = _pick(house, ['exes', 'ex-friends'], x => x.warmSide <= 0);
    _spend(this.id, ctx);
    const { a, b } = p;
    const third = _others(house, a, b)[0];
    const scene = makeScene('kin.coldwar', { a, b }, { ending: 'scene' }, [], 'kitchen');

    api.addBond(a, b, -1.1);
    if (third) api.suspicion(third, a, 0.4);
    return { scene, players: [a, b], badgeText: 'NOT SPEAKING', badgeClass: 'red' };
  },
};

// ══════════════════════════════════════════════════════════════════════
// Family, estranged and otherwise
// ══════════════════════════════════════════════════════════════════════

const estrangedAttempt = {
  id: 'kin-estranged-attempt',
  category: 'house-life',
  location: 'backyard',
  weight(house, ctx) {
    if (_once('kin-estranged-attempt', ctx) || _spent('kin-estranged-attempt')) return 0;
    return _pick(house, 'estranged') ? _quiet(ctx, 9) : 0;
  },
  fire(house, ctx, api, rng) {
    const p = _pick(house, 'estranged');
    _spend(this.id, ctx); _burn(this.id);
    const { warm, cold, a, b } = p;
    // Whether it lands is about how far apart they actually are, not luck
    // alone — a pair who both half-want it get there, and a pair where only
    // one of them is reaching mostly do not.
    const reach = (feelsFor(warm, cold) + feelsFor(cold, warm)) / 2;
    const lands = (rng ? rng() : Math.random()) < Math.max(0.15, Math.min(0.8, 0.42 + reach * 0.06));

    const scene = makeScene('kin.estranged', { a: warm, b: cold }, { ending: lands ? 'thaw' : 'same' }, [], 'backyard');

    if (lands) {
      api.addBond(a, b, 2.8);
      addLean(warm, cold, 0.8);
      addLean(cold, warm, 1.2);
      api.popDelta(warm, 3); api.popDelta(cold, 2);
    } else {
      api.addBond(a, b, -1.8);
      addLean(warm, cold, -1);
      api.popDelta(warm, 1);
    }
    return { scene, players: [warm, cold],
      badgeText: lands ? 'SOMETHING LIKE A THAW' : 'THE SAME ARGUMENT AS ALWAYS',
      badgeClass: lands ? 'green' : 'red' };
  },
};

const familyShield = {
  id: 'kin-family-shield',
  category: 'house-life',
  location: 'living-room',
  weight(house, ctx) {
    if (_once('kin-family-shield', ctx)) return 0;
    const p = _pick(house, ['siblings', 'parent-child', 'cousins', 'twins'], x => x.warmSide >= 2);
    return p ? _quiet(ctx, 8) : 0;
  },
  fire(house, ctx, api) {
    const p = _pick(house, ['siblings', 'parent-child', 'cousins', 'twins'], x => x.warmSide >= 2);
    _spend(this.id, ctx);
    const { warm, cold, kin } = p;
    const threat = _others(house, warm, cold)[0];
    const scene = makeScene('kin.shield', { a: warm, b: cold }, { ending: 'scene', kinword: spoken(kin, cold) }, [], 'living-room');

    api.addBond(warm, cold, 1.4);
    // Protecting somebody in a house like this is the loudest thing you can do
    // about who you are with — and it makes you the more dangerous half.
    for (const n of _others(house, warm, cold).slice(0, 4)) api.suspicion(n, warm, 0.5);
    if (threat) api.setTarget(threat, warm, `${warm} will always protect ${cold}`);
    api.popDelta(warm, 2);
    return { scene, players: [warm, cold], badgeText: `${String(label(kin)).toUpperCase()} · SHIELDED`,
      badgeClass: 'blue' };
  },
};

const familyCompared = {
  id: 'kin-family-compared',
  category: 'house-life',
  location: 'kitchen',
  weight(house, ctx) {
    if (_once('kin-family-compared', ctx)) return 0;
    const p = _pick(house, ['siblings', 'parent-child', 'cousins', 'twins']);
    return p ? _quiet(ctx, 6) : 0;
  },
  fire(house, ctx, api) {
    const p = _pick(house, ['siblings', 'parent-child', 'cousins', 'twins']);
    _spend(this.id, ctx);
    // Whoever the house rates less. Being the other one is its own thing.
    const lesser = p.coldSide === feelsFor(p.a, p.b) ? p.a : p.b;
    const better = lesser === p.a ? p.b : p.a;
    const scene = makeScene('kin.compared', { a: lesser, b: better }, { ending: 'scene', kinword: spoken(p.kin, lesser) }, [], 'kitchen');

    // Resentment inside a family is exactly what the lean is for: the bond
    // between them does not have to move for one of them to start pulling away.
    addLean(lesser, better, -1.3);
    api.popDelta(better, 1);
    return { scene, players: [lesser, better], badgeText: 'BEING THE OTHER ONE', badgeClass: 'blue' };
  },
};

// ══════════════════════════════════════════════════════════════════════
// Married and partners — the pair the house counts as one vote
// ══════════════════════════════════════════════════════════════════════

const partnersStrain = {
  id: 'kin-partners-strain',
  category: 'house-life',
  location: 'bedroom',
  weight(house, ctx) {
    if (_once('kin-partners-strain', ctx)) return 0;
    return _pick(house, ['married', 'partners']) ? _quiet(ctx, 8) : 0;
  },
  fire(house, ctx, api) {
    const p = _pick(house, ['married', 'partners']);
    _spend(this.id, ctx);
    const { a, b, kin } = p;
    const scene = makeScene('kin.strain', { a, b }, { ending: 'scene', kinword: spoken(kin, b) }, [], 'bedroom');

    for (const n of _others(house, a, b).slice(0, 4)) { api.suspicion(n, a, 0.5); api.suspicion(n, b, 0.5); }
    api.popDelta(a, 1);
    return { scene, players: [a, b], badgeText: 'COUNTED AS ONE VOTE', badgeClass: 'red' };
  },
};

const partnersBreak = {
  id: 'kin-partners-break',
  category: 'house-life',
  location: 'bedroom',
  weight(house, ctx) {
    if (_once('kin-partners-break', ctx) || _spent('kin-partners-break')) return 0;
    // Not on the first night. A marriage that ends in week one ended before
    // anybody walked in, and the house had no part in it — the whole point is
    // that being locked in here with somebody is what does it.
    if ((Number(ctx?.week?.num) || 1) < 3) return 0;
    // It takes one of them having genuinely gone — which the shared bond alone
    // could never show, because a couple where one person is finished and the
    // other has not noticed looks identical to a happy one.
    const p = _pick(house, ['married', 'partners'], x => x.coldSide <= -1 && x.gap >= 3);
    return p ? _quiet(ctx, 10) : 0;
  },
  fire(house, ctx, api) {
    const p = _pick(house, ['married', 'partners'], x => x.coldSide <= -1 && x.gap >= 3);
    _spend(this.id, ctx); _burn(this.id);
    const { warm, cold, kin } = p;
    const scene = makeScene('kin.break', { a: warm, b: cold }, { ending: 'scene', kinword: spoken(kin, cold) }, [], 'bedroom');

    api.addBond(warm, cold, -3.5);
    // The lean goes with it: the one who was carrying it stops carrying it,
    // eventually, and the one who left has nothing left to hide.
    addLean(warm, cold, -2.5);
    addLean(cold, warm, 1);
    api.popDelta(warm, 3); api.popDelta(cold, 2);
    const sh = (gs.showmances || []).find(s => (s.players || []).includes(warm)
      && (s.players || []).includes(cold));
    if (sh) {
      sh.broken = true;
      sh.phase = 'broken-up';
      // Named, or it reaches the panel as a bare "it ended" and the life layer
      // has nothing to read. One of them ended it, in the house, out loud.
      sh.breakupType = 'called-off';
      sh.breakupEp = (gs.episode || 0) + 1;
      sh.breakupVoter = cold;
    }
    for (const n of _others(house, warm, cold).slice(0, 4)) {
      api.remember(n, cold, 'ended-it-in-the-house', 2, { about: warm });
    }
    return { scene, players: [warm, cold],
      badgeText: `${String(label(kin)).toUpperCase()} · IT ENDS HERE`, badgeClass: 'red' };
  },
};

// ══════════════════════════════════════════════════════════════════════
// Ex-best-friends, and the people who simply knew each other
// ══════════════════════════════════════════════════════════════════════

const exFriendsApology = {
  id: 'kin-exfriends-apology',
  category: 'house-life',
  location: 'backyard',
  weight(house, ctx) {
    if (_once('kin-exfriends-apology', ctx) || _spent('kin-exfriends-apology')) return 0;
    const p = _pick(house, 'ex-friends', x => x.warmSide >= 0);
    return p ? _quiet(ctx, 7) : 0;
  },
  fire(house, ctx, api, rng) {
    const p = _pick(house, 'ex-friends', x => x.warmSide >= 0);
    _spend(this.id, ctx); _burn(this.id);
    const { warm, cold } = p;
    // An apology lands on how far the OTHER one has come, not on how sorry
    // this one is — which is the whole reason it needs two numbers.
    const lands = (rng ? rng() : Math.random()) < Math.max(0.1, Math.min(0.85, 0.4 + feelsFor(cold, warm) * 0.07));
    const scene = makeScene('kin.apology', { a: warm, b: cold }, { ending: lands ? 'lands' : 'fails' }, [], 'backyard');

    if (lands) { api.addBond(warm, cold, 2.4); addLean(cold, warm, 1.4); api.popDelta(warm, 2); }
    else { api.addBond(warm, cold, -0.8); addLean(warm, cold, -1.2); }
    return { scene, players: [warm, cold],
      badgeText: lands ? 'PUT DOWN AT LAST' : 'AN APOLOGY THAT DOES NOT LAND',
      badgeClass: lands ? 'green' : 'red' };
  },
};

const knownBefore = {
  id: 'kin-known-before',
  category: 'house-life',
  location: 'living-room',
  weight(house, ctx) {
    if (_once('kin-known-before', ctx) || _spent('kin-known-before')) return 0;
    return _pick(house, ['old-friends', 'colleagues']) ? _quiet(ctx, 6) : 0;
  },
  fire(house, ctx, api) {
    const p = _pick(house, ['old-friends', 'colleagues']);
    _spend(this.id, ctx); _burn(this.id);
    const { a, b, kin } = p;
    const suspicious = _others(house, a, b)[0];
    const scene = makeScene('kin.known', { a, b, c: suspicious || null }, { ending: 'scene', how: String(label(kin)).toLowerCase() }, [], 'living-room');

    for (const n of _others(house, a, b).slice(0, 5)) { api.suspicion(n, a, 0.6); api.suspicion(n, b, 0.6); }
    // Being suspected of a bloc is how blocs start.
    api.addBond(a, b, 0.8);
    if (suspicious) api.setTarget(suspicious, a, `${a} and ${b} came in already knowing each other`);
    return { scene, players: [a, b], badgeText: 'THEY CAME IN KNOWING EACH OTHER', badgeClass: 'red' };
  },
};

const bloodQuestion = {
  id: 'kin-blood-question',
  category: 'house-life',
  location: 'backyard',
  weight(house, ctx) {
    if (_once('kin-blood-question', ctx)) return 0;
    const p = _pick(house, ['siblings', 'parent-child', 'cousins', 'married', 'partners', 'twins']);
    return p ? _quiet(ctx, 5) : 0;
  },
  fire(house, ctx, api) {
    const p = _pick(house, ['siblings', 'parent-child', 'cousins', 'married', 'partners', 'twins']);
    _spend(this.id, ctx);
    const { a, b, kin } = p;
    const asker = _others(house, a, b)[0];
    const scene = makeScene('kin.blood', { a, b, c: asker || null }, { ending: 'scene', kinword: spoken(kin, b) }, [], 'backyard');

    for (const n of _others(house, a, b).slice(0, 3)) api.suspicion(n, a, 0.35);
    api.popDelta(a, 1);
    return { scene, players: [a, b], badgeText: `WOULD YOU CUT YOUR ${noun(kin).toUpperCase()}`,
      badgeClass: 'blue' };
  },
};

export const KINSHIP_EVENTS = [
  exRelapse, exUnrequited, exColdWar,
  estrangedAttempt, familyShield, familyCompared,
  partnersStrain, partnersBreak,
  exFriendsApology, knownBefore, bloodQuestion,
];
