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

const P = name => { try { return pronouns(name); } catch { return { sub: 'they', obj: 'them', posAdj: 'their', pos: 'theirs', Sub: 'They', Obj: 'Them' }; } };
const has = (name, verb) => `${P(name).sub} ${P(name).sub === 'they' ? verb : `${verb}s`}`;
// `has()` conjugates a REGULAR verb by adding an s, so has(x, 'have') came out
// as "he haves". The one irregular this file needs gets its own helper.
const hasHave = name => (P(name).sub === 'they' ? 'have' : 'has');
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

/**
 * A line that will not repeat until its pool is exhausted.
 *
 * The first cut hashed the week and beat into an index, and weeks two and three
 * collided mod four — so the ache between two exes printed the identical
 * sentence three weeks running, which reads as a broken generator rather than
 * as something that is still going on.
 */
function _line(list, key, ctx) {
  const store = ((gs.bb ||= {})._kinSaid ||= {});
  const seen = store[key] || [];
  const open = list.map((_, i) => i).filter(i => !seen.includes(i));
  const pool = open.length ? open : list.map((_, i) => i);
  // Deterministic within a seeded season: driven by the week, not by a roll.
  const at = pool[(Number(ctx?.week?.num) || 0) % pool.length];
  store[key] = [...(open.length ? seen : []), at];
  return list[at];
}

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
    const text = _line([
      `They have been extremely normal about it for two weeks. Tonight ${a} and ${b} are the last two `
        + `awake and neither of them goes to bed, and by the time anybody comes down in the morning `
        + `something has very obviously changed.`,
      `"We said we were not going to do this." ${a} is right, they did say that, and it turns out to `
        + `have been a plan rather than a fact.`,
      `Everybody in this house knows they used to be together and has been waiting to see it. `
        + `It happens in the storeroom, badly, and ${a} comes out looking like somebody who has just `
        + `made a decision ${hasHave(a)} not thought through.`,
      `The thing about being locked in a house with an ex is that all the reasons it ended are outside `
        + `and all the reasons it started are in here. By Thursday ${a} and ${b} have stopped pretending.`,
    ], `${this.id}|${a}|${b}`, ctx);

    api.addBond(a, b, 2.6);
    api.popDelta(a, 2); api.popDelta(b, 2);
    api.showmance(a, b, { rekindled: true });
    for (const n of _others(house, a, b).slice(0, 3)) {
      api.remember(n, a, 'back-with-their-ex', 2, { about: b });
    }
    return { text, players: [a, b], badgeText: 'BACK ON', badgeClass: 'gold' };
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
    const wp = P(warm);
    const text = _line([
      `${warm} is still in this and ${cold} is not, and the whole house can see it except ${warm}. `
        + `${wp.Sub} ${has(warm, 'keep')} finding reasons to be in whichever room ${cold} is in, `
        + `and ${cold} has started leaving them.`,
      `"${cold} did not mean it like that." ${warm} says it to ${witness || 'nobody'} about something `
        + `${cold} very much did mean like that. It is the third time this week.`,
      `${cold} is perfectly nice about it, which is somehow the worst version. ${warm} would rather `
        + `be argued with.`,
      `They are civil, they are friendly, they cook next to each other. And every single time ${cold} `
        + `walks out of a room without looking back, ${warm} watches the door for a second too long.`,
    ], `${this.id}|${warm}|${cold}`, ctx);

    // It costs them, in the only currency this house has: the person carrying
    // it plays worse, and the room notices who is doing the wanting.
    addLean(warm, cold, -0.6);
    api.addBond(warm, cold, -0.3);
    api.popDelta(warm, 1);
    if (witness) api.remember(witness, warm, 'not-over-them', 2, { about: cold });
    return { text, players: [warm, cold], badgeText: 'ONE OF THEM IS NOT OVER IT', badgeClass: 'blue' };
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
    const text = _line([
      `${a} and ${b} have not been alone in a room together since the first night and both of them `
        + `are managing it deliberately. It takes real coordination in a house this size.`,
      `Somebody asks, innocently, how they know each other. Both of them answer at the same time `
        + `with two completely different sentences.`,
      `The kitchen empties when they are both in it. Nobody decided that; it simply started happening `
        + `around the fourth day and nobody has said anything about it.`,
      `"I am not going to talk about it." ${a} says it pleasantly, twice, to two different people, `
        + `and by the evening the whole house is talking about it.`,
    ], `${this.id}|${a}|${b}`, ctx);

    api.addBond(a, b, -1.1);
    if (third) api.suspicion(third, a, 0.4);
    return { text, players: [a, b], badgeText: 'NOT SPEAKING', badgeClass: 'red' };
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

    const text = lands ? _line([
      `They end up on the sofa at two in the morning and ${warm} says the thing neither of them has `
        + `said in years. ${cold} does not say it back. ${cold} does stay, though, and they are still `
        + `sitting there when it gets light.`,
      `It is not a reconciliation. It is ${warm} and ${cold} agreeing that whatever this is, it does `
        + `not have to be carried around a house on television, and that is more than either of them `
        + `came in expecting.`,
      `Somebody asks how long it has been. They work it out together, out loud, and the number is `
        + `bad enough that both of them go quiet.`,
    ], `${this.id}|${warm}|${cold}|y`, ctx) : _line([
      `${warm} tries. It takes about ninety seconds for the conversation to arrive at the thing it `
        + `always arrives at, and ${cold} walks away from it exactly the way ${hasHave(cold)} `
        + `always walked away from it.`,
      `"I did not come here to do this." ${cold} says it and means it, and ${warm} spends the rest `
        + `of the night in the garden.`,
      `It goes wrong in the first sentence. Ten people pretend very hard to be doing something else `
        + `in the next room.`,
    ], `${this.id}|${warm}|${cold}`, ctx);

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
    return { text, players: [warm, cold],
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
    const text = _line([
      `Somebody says ${cold}'s name in front of ${warm} and the temperature of the room changes `
        + `before ${warm} has said anything at all. Nobody brings it up again in front of ${warm}.`,
      `${warm} takes a hit ${warm} did not have to take, in a conversation ${cold} was not even in, `
        + `and does not mention it afterwards. ${cold} finds out anyway.`,
      `"You can talk about anybody in this house except one person." ${warm} says it lightly, `
        + `to the room, and everybody understands it was not light.`,
      `The house has worked out that the fastest way to lose ${warm} is to come for ${cold}. `
        + `That is useful information and every single person in here now has it.`,
    ], `${this.id}|${warm}|${cold}`, ctx);

    api.addBond(warm, cold, 1.4);
    // Protecting somebody in a house like this is the loudest thing you can do
    // about who you are with — and it makes you the more dangerous half.
    for (const n of _others(house, warm, cold).slice(0, 4)) api.suspicion(n, warm, 0.5);
    if (threat) api.setTarget(threat, warm, `${warm} will always protect ${cold}`);
    api.popDelta(warm, 2);
    return { text, players: [warm, cold], badgeText: `${String(label(kin)).toUpperCase()} · SHIELDED`,
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
    const text = _line([
      `It is meant kindly every time. "You are nothing like ${better}." ${lesser} laughs every time, `
        + `and has now heard it four times in eleven days.`,
      `Somebody compares them out loud, badly, in front of both of them. ${better} does not notice. `
        + `${lesser} notices.`,
      `The house has decided which of them is the dangerous one. It has not told ${lesser}, `
        + `and it has not needed to.`,
      `"Which one of you is the smart one?" It is a joke. It is a joke ${lesser} is going to `
        + `think about at three in the morning.`,
    ], `${this.id}|${lesser}|${better}`, ctx);

    // Resentment inside a family is exactly what the lean is for: the bond
    // between them does not have to move for one of them to start pulling away.
    addLean(lesser, better, -1.3);
    api.popDelta(better, 1);
    return { text, players: [lesser, better], badgeText: 'BEING THE OTHER ONE', badgeClass: 'blue' };
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
    const text = _line([
      `Nobody in this house has to guess where ${a}'s vote is going, and that is the entire problem. `
        + `Two people who arrived together are one number to everybody else in here.`,
      `They have started disagreeing in front of people on purpose. It is not convincing anybody `
        + `and both of them can tell it is not convincing anybody.`,
      `"You cannot be in an alliance with your ${noun(kin)}, that is just being `
        + `in a couple." Somebody says it as a joke at the kitchen table. Nobody laughs, including them.`,
      `${a} spends the day being careful not to look at ${b} across a room, which is a considerably `
        + `stranger thing to watch than looking would have been.`,
    ], `${this.id}|${a}|${b}`, ctx);

    for (const n of _others(house, a, b).slice(0, 4)) { api.suspicion(n, a, 0.5); api.suspicion(n, b, 0.5); }
    api.popDelta(a, 1);
    return { text, players: [a, b], badgeText: 'COUNTED AS ONE VOTE', badgeClass: 'red' };
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
    const text = _line([
      `It ends in the bedroom with eleven people pretending to be asleep four feet away. `
        + `${cold} has been done with this for longer than ${warm} realised, and says so in about `
        + `two sentences.`,
      `"I did not want to do this in here." ${cold} did not, and is doing it in here anyway, `
        + `because there is nowhere in this building that is not in here.`,
      `${warm} works it out mid-conversation — not from anything ${cold} says, from the way `
        + `${has(cold, 'say')} it — and stops talking in the middle of a sentence.`,
    ], `${this.id}|${warm}|${cold}`, ctx);

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
    return { text, players: [warm, cold],
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
    const text = lands ? _line([
      `${warm} apologises properly — not the version that explains itself, the other one. `
        + `${cold} takes about four seconds and then takes it.`,
      `They do not talk about what happened. They talk about something from before it happened, `
        + `for two hours, and by the end of it something has quietly been put down.`,
    ], `${this.id}|${warm}|${cold}|y`, ctx) : _line([
      `${warm} apologises. ${cold} says "it's fine" in the voice of somebody for whom it is `
        + `not fine and is not going to be.`,
      `It is a good apology. ${cold} has heard it before, which is the problem with it.`,
    ], `${this.id}|${warm}|${cold}`, ctx);

    if (lands) { api.addBond(warm, cold, 2.4); addLean(cold, warm, 1.4); api.popDelta(warm, 2); }
    else { api.addBond(warm, cold, -0.8); addLean(warm, cold, -1.2); }
    return { text, players: [warm, cold],
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
    const text = _line([
      `It comes out that ${a} and ${b} knew each other before any of this, and the house does the `
        + `arithmetic in about a second and a half. It does not matter whether they are working `
        + `together. Everybody has decided they are.`,
      `"How did nobody know this?" Somebody knew. Somebody always knows. `
        + `${a} and ${b} spend the rest of the day being asked about it separately.`,
      `They are not an alliance. They have never once talked about the vote. `
        + `${suspicious || 'The house'} has them written down as a pair anyway, and that is now `
        + `permanent regardless of what either of them does about it.`,
      `${String(label(kin))}, apparently. The room takes it about as well as a room ever takes `
        + `finding out two of the people in it have history nobody was told about.`,
    ], `${this.id}|${a}|${b}`, ctx);

    for (const n of _others(house, a, b).slice(0, 5)) { api.suspicion(n, a, 0.6); api.suspicion(n, b, 0.6); }
    // Being suspected of a bloc is how blocs start.
    api.addBond(a, b, 0.8);
    if (suspicious) api.setTarget(suspicious, a, `${a} and ${b} came in already knowing each other`);
    return { text, players: [a, b], badgeText: 'THEY CAME IN KNOWING EACH OTHER', badgeClass: 'red' };
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
    const text = _line([
      `${asker || 'Somebody'} asks it at the table, straight out: "Final two. Half a million. `
        + `Do you take ${b}?" ${a} answers immediately, and the speed of it is what everybody `
        + `takes away rather than the answer.`,
      `"Could you write ${b}'s name down?" ${a} says of course. Nobody in that garden believes it, `
        + `including, quite visibly, ${a}.`,
      `The question everybody has been circling since day one gets asked by somebody with no tact `
        + `and no agenda, which is the only way it was ever going to get asked.`,
    ], `${this.id}|${a}|${b}`, ctx);

    for (const n of _others(house, a, b).slice(0, 3)) api.suspicion(n, a, 0.35);
    api.popDelta(a, 1);
    return { text, players: [a, b], badgeText: `WOULD YOU CUT YOUR ${noun(kin).toUpperCase()}`,
      badgeClass: 'blue' };
  },
};

export const KINSHIP_EVENTS = [
  exRelapse, exUnrequited, exColdWar,
  estrangedAttempt, familyShield, familyCompared,
  partnersStrain, partnersBreak,
  exFriendsApology, knownBefore, bloodQuestion,
];
