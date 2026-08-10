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
import { romanticCompat } from '../players.js';
import { feelsFor, addLean, leanGap, getBond } from '../bonds.js';
import { spotlightOrder } from './_read.js';

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
      `${a} and ${b} stay up after everyone else leaves the kitchen. The conversation drifts from the vote `
        + `to an old joke, then to why they broke up. Neither of them goes to bed when they should.`,
      `"We said we weren't doing this in here." ${a} says it after ${b} reaches for ${a}'s hand. `
        + `Neither one lets go.`,
      `${a} and ${b} disappear into the storage room to settle an argument. They come back twenty minutes `
        + `later no longer arguing and suddenly unable to look at anyone.`,
      `They begin the night comparing notes about the game and end it admitting they still miss each other. `
        + `By breakfast, keeping their distance is no longer part of the plan.`,
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
    const text = _line([
      `${warm} keeps finding small reasons to sit beside ${cold}. ${cold} keeps finding equally small `
        + `reasons to get up. After the third time, ${witness || 'somebody across the room'} notices.`,
      `${warm} tells ${witness || 'the empty bedroom'} that ${cold} is only being careful because of the cameras. `
        + `${cold} has already told the Diary Room there is nothing left to be careful about.`,
      `${cold} is kind without encouraging anything. ${warm} would almost prefer a fight; at least a fight `
        + `would mean there was still something to settle.`,
      `${warm} starts telling an old story about the two of them. ${cold} corrects one detail, then leaves `
        + `before the story reaches the part where they were still together.`,
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
      `${a} walks into the kitchen, sees ${b}, and turns back for a mug neither of them believes was forgotten. `
        + `${third || 'Someone at the table'} clocks it immediately.`,
      `A harmless conversation turns sharp the moment ${a} and ${b} disagree. Neither raises a voice. `
        + `They do not need to; they already know exactly where to aim.`,
      `${a} asks the room to pass the salt while looking directly past ${b}, who is holding it. `
        + `The silence that follows lasts longer than the joke deserves.`,
      `${third || 'Another houseguest'} asks whether the two of them can work together for one vote. `
        + `${a} says “ask ${b}.” ${b} says “there's your answer.”`,
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
      `${warm} finally asks ${cold} to talk without an audience. The apology is awkward and incomplete, `
        + `but ${cold} stays long enough to answer it.`,
      `${warm} and ${cold} agree they are not fixing years of damage in one night. They do agree to stop `
        + `using the house as another way to punish each other.`,
      `${cold} corrects ${warm}'s version of what happened between them. For once, ${warm} listens instead `
        + `of preparing the next defence. The conversation does not solve everything, but it does not become a fight.`,
    ], `${this.id}|${warm}|${cold}|y`, ctx) : _line([
      `${warm} asks for a clean start. ${cold} hears it as a request to forget why they stopped speaking, `
        + `and the conversation ends there.`,
      `"I didn't come here to repair this for television," ${cold} says. ${warm} has no answer that does `
        + `not sound rehearsed.`,
      `${warm} opens with an apology and follows it immediately with an excuse. ${cold} catches the difference `
        + `and walks away before the excuse becomes another argument.`,
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
      `${threat || 'Someone'} floats ${cold}'s name as an easy vote. ${warm} shuts it down so quickly that `
        + `the room learns more from the defence than it did from the suggestion.`,
      `${warm} is offered a deal that leaves ${cold} exposed and refuses before hearing the rest. `
        + `${cold} was not in the room, but the refusal reaches ${cold} before dinner.`,
      `"Pitch whoever you want," ${warm} tells ${threat || 'the room'}. "Just don't pitch ${cold} to me." `
        + `It is honest, protective, and terrible threat management.`,
      `${threat || 'A houseguest'} tests whether ${warm} would vote against ${cold}. ${warm}'s face answers `
        + `before the words do, and the question immediately becomes part of the week's strategy.`,
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
    // The less invested side is the one already tiring of being treated as a
    // matched set. This is about that person's response, not an invented
    // claim that the whole house objectively ranks one relative above another.
    const lesser = p.coldSide === feelsFor(p.a, p.b) ? p.a : p.b;
    const better = lesser === p.a ? p.b : p.a;
    const text = _line([
      `Someone tells ${lesser}, "You're nothing like ${better}," and means it as a compliment. `
        + `${lesser} still hears the comparison before the compliment.`,
      `A strategy conversation turns into a comparison between the two relatives. ${better} brushes it off. `
        + `${lesser} goes quiet and changes rooms.`,
      `${lesser} wins an argument and somebody credits ${better} for giving advice. ${better} denies it, `
        + `but the correction arrives too late to help.`,
      `A joke about which relative is carrying the pair lands badly. ${lesser} laughs with everyone else, `
        + `then tells ${better} in private that it was not funny.`,
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
      `A vote count reaches ${a} and ${b}, and everyone writes down two votes before either one answers. `
        + `${a} points out that they are allowed to disagree. Nobody changes the count.`,
      `${a} and ${b} deliberately take opposite sides in a harmless debate. The performance is so obvious `
        + `that it only reminds the room how coordinated they usually are.`,
      `"That's not an alliance," somebody says when ${a} mentions working with ${b}. "That's your ${noun(kin)}." `
        + `The table laughs. ${a} and ${b} do not.`,
      `${a} avoids checking ${b}'s reaction during a strategy meeting. The effort is visible enough that `
        + `three other people check ${b}'s reaction instead.`,
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
      `${cold} asks ${warm} to stop discussing the game and listen. The conversation is quiet, direct, `
        + `and over before ${warm} understands that the relationship is too.`,
      `"I didn't want to do this in here," ${cold} says, "but pretending we're fine in here is worse." `
        + `${warm} asks to talk after the season. ${cold} does not promise that conversation.`,
      `${warm} begins by defending the couple's game. ${cold} has to interrupt: this is not about the game. `
        + `That is the moment ${warm} finally understands.`,
    ], `${this.id}|${warm}|${cold}`, ctx);

    api.addBond(warm, cold, -3.5);
    // The lean goes with it: the one who was carrying it stops carrying it,
    // eventually, and the one who left has nothing left to hide.
    addLean(warm, cold, -2.5);
    addLean(cold, warm, 1);
    api.popDelta(warm, 3); api.popDelta(cold, 2);
    const sh = (gs.showmances || []).find(s => (s.players || []).includes(warm)
      && (s.players || []).includes(cold));
    if (sh) { sh.broken = true; sh.phase = 'broken-up'; }
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
      `${warm} apologises without explaining why ${warm} did it. ${cold} asks one question, gets a straight `
        + `answer, and accepts the apology without pretending everything is fixed.`,
      `${warm} and ${cold} begin with an old story they both still find funny. When the conversation reaches `
        + `the falling-out, neither one dodges it. By the end, speaking again feels possible.`,
    ], `${this.id}|${warm}|${cold}|y`, ctx) : _line([
      `${warm} apologises. ${cold} says, "I heard you," which is not forgiveness and is not mistaken for it.`,
      `${warm}'s apology is careful and sincere. ${cold} points out that it is also the same apology `
        + `${warm} gave before the friendship ended.`,
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
      `${a} mentions a place ${b} used to work, then realises nobody was supposed to know that. `
        + `${suspicious || 'Someone nearby'} asks the obvious question, and the room goes quiet for the answer.`,
      `${a} and ${b} give separate accounts of how well they knew each other before the season. `
        + `The accounts mostly match; the word “mostly” becomes the problem.`,
      `${suspicious || 'A houseguest'} learns that ${a} and ${b} knew each other before casting and immediately `
        + `rechecks every vote conversation involving either of them.`,
      `${a} finally tells the room that ${b} was ${kin === 'colleagues' ? 'a former colleague' : 'an old friend'}. `
        + `The history sounds harmless. Keeping it quiet does not.`,
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
      `${asker || 'Somebody'} asks ${a} directly: "Final two, one seat left—do you take ${b}?" `
        + `${a} answers too quickly, and the speed is more revealing than the answer.`,
      `${asker || 'A houseguest'} asks whether ${a} could ever write ${b}'s name down. ${a} says yes, `
        + `then spends so long explaining the answer that nobody believes it.`,
      `The conversation turns to endgame cuts. ${asker || 'Someone'} asks ${a} where family ends and `
        + `the game begins. ${a} says that is easy to answer and then does not answer it.`,
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
