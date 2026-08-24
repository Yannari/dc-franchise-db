// ══════════════════════════════════════════════════════════════════════
// bb-events/franchise-history.js — the season before this one
// ══════════════════════════════════════════════════════════════════════
//
// THE HOUSE HAD THE CONSEQUENCES AND NONE OF THE CAUSE.
//
// `initGameState` seeds starting bonds from the franchise ledger, so two
// returnees who cut each other last time genuinely arrive disliking each other
// — and no Big Brother module read that ledger, so nobody could ever say why.
// Total Drama has had OLD WOUNDS, REUNION and HISTORY at camp since the ledger
// existed. The house, which is built on the vote and where a grudge from a
// previous summer is the most Big Brother thing there is, had nothing.
//
// These are the same memories said in this show's words: on the block, in the
// diary room, at the eviction. Sourced from `sharedPast`, whose `reason` is
// already a sentence — "Ben betrayed Ava (Season 3)" — so the house cites the
// real thing rather than gesturing at a vague past.
//
// A season with no returnees produces none of these, silently, because
// `pastPairs` is empty and every weight below is zero.

import { gs } from '../core.js';
import { pronouns } from '../players.js';
import { pastPairs, pastProfile, sharedPast, spotlightOrder } from './_read.js';

/**
 * Verb agreement for a singular `they`.
 *
 * "and they is currently saying it" is what happens without this, and it is the
 * kind of line that makes a whole scene read as generated. A name is not enough
 * to know somebody's pronouns, so every sentence built around one has to ask.
 */
const isAre = name => (P(name).sub === 'they' ? 'are' : 'is');

const P = name => {
  try { return pronouns(name); } catch {
    return { sub: 'they', obj: 'them', posAdj: 'their', pos: 'theirs', Sub: 'They', Obj: 'Them' };
  }
};

/**
 * A line that will not repeat until its pool is exhausted.
 *
 * Same rule as kinship.js, and for the same reason: hashing the week into an
 * index collides across weeks and prints the identical sentence twice, which
 * reads as a broken generator rather than as something still going on.
 */
function _line(list, key, ctx) {
  const store = ((gs.bb ||= {})._pastSaid ||= {});
  const seen = store[key] || [];
  const open = list.map((_, i) => i).filter(i => !seen.includes(i));
  const pool = open.length ? open : list.map((_, i) => i);
  const at = pool[(Number(ctx?.week?.num) || 0) % pool.length];
  store[key] = [...(open.length ? seen : []), at];
  return list[at];
}

// Once per week, and — for the ones that are events rather than weather — once
// per season. The house finding out is a moment; it does not happen every week.
const _once = (id, ctx) => !!ctx?.week?._pastFired?.[id];
const _spend = (id, ctx) => { if (ctx?.week) (ctx.week._pastFired ||= {})[id] = true; };
const _burnt = key => !!gs.bb?._pastOnce?.[key];
const _burn = key => { ((gs.bb ||= {})._pastOnce ||= {})[key] = true; };

/** Old business surfaces early and thins out, the way catching up does. */
const _decay = ctx => Math.max(0.35, 1 - (Number(ctx?.week?.num) || 1) * 0.08);

const BAD = ['betrayal', 'blindside', 'rivals', 'showmance-broken'];
const GOOD = ['allies', 'showmance-intact'];

/** The strongest untold pair of the given kinds, ignoring anyone already used. */
function _pair(house, kinds, ctx) {
  const order = spotlightOrder ? spotlightOrder(house) : house;
  const rank = new Map(order.map((n, i) => [n, i]));
  return pastPairs(house, kinds)
    .filter(sp => !_burnt(`${sp.a}|${sp.b}|${sp.kind}`))
    // Prefer the pair the edit has been ignoring, so a season does not spend
    // all of these on the same two people.
    .sort((x, y) => (rank.get(x.a) ?? 99) + (rank.get(x.b) ?? 99)
                  - ((rank.get(y.a) ?? 99) + (rank.get(y.b) ?? 99)))[0] || null;
}

const _others = (house, ...ex) => house.filter(n => n && !ex.includes(n));

// ── 1. THE HOUSE FINDS OUT ────────────────────────────────────────────────
//
// Before anybody plays a move on it. Two people arrive with a history the rest
// of the cast has watched on television, and the room prices it in immediately.
const pastSurfaces = {
  id: 'past-surfaces',
  category: 'house-life',
  location: 'living-room',
  weight(house, ctx) {
    if (_once(this.id, ctx)) return 0;
    if (['nominations', 'veto-ceremony', 'eviction'].includes(ctx?.act)) return 0;
    return _pair(house, [...BAD, ...GOOD], ctx) ? 7 * _decay(ctx) : 0;
  },
  fire(house, ctx, api) {
    const sp = _pair(house, [...BAD, ...GOOD], ctx);
    if (!sp) return null;
    _spend(this.id, ctx); _burn(`${sp.a}|${sp.b}|${sp.kind}`);
    const { a: A, b: B, reason } = sp;
    const bad = BAD.includes(sp.kind);
    const watcher = _others(house, A, B)[0];

    const text = bad
      ? _line([
        `Somebody asks the question everybody has been not-asking since move-in, and ${A} answers `
          + `it flatly: ${reason}. ${P(A).Sub} did not come back to let that go.`,
        `${A} and ${B} have been polite for six days. It stops over the washing up. ${reason}, `
          + `and the whole room now knows the exact shape of it.`,
        `"You want to do this here?" ${B} does not, particularly. ${reason} — and the house has `
          + `already decided which side of it they are on.`,
        `${watcher || 'The house'} works out what the tension is and says it out loud: ${reason}. `
          + `Nobody in the room needed telling twice.`,
      ], `${this.id}|bad|${A}|${B}`, ctx)
      : _line([
        `${A} and ${B} do not have to be introduced. ${reason} — and the shorthand between them is `
          + `visible from across the kitchen, which is the worst possible place for it to be.`,
        `It takes the house about a day to notice that ${A} and ${B} finish each other's sentences. `
          + `${reason}. Nobody believes they are not working together.`,
        `"They already did this once." ${reason}, and ${watcher || 'the house'} says it like an `
          + `accusation, because in here it is one.`,
        `${A} catches ${B}'s eye over something nobody else finds funny. ${reason}. Two people in `
          + `this house are not starting from zero and everybody else is.`,
      ], `${this.id}|good|${A}|${B}`, ctx);

    // Being seen as a pair is how a pair becomes a target — the same rule
    // kinship.js runs on, because it is the same thing happening.
    for (const n of _others(house, A, B).slice(0, 5)) {
      api.suspicion?.(n, A, bad ? 0.3 : 0.7);
      api.suspicion?.(n, B, bad ? 0.3 : 0.7);
    }
    api.addBond?.(A, B, bad ? -0.6 : 0.8);
    if (!bad && watcher) api.setTarget?.(watcher, A, `${A} and ${B} came in with history`);

    return {
      text, players: [A, B],
      badgeText: bad ? 'OLD WOUNDS' : 'THEY HAVE DONE THIS BEFORE',
      badgeClass: bad ? 'red' : 'gold',
    };
  },
};

// ── 2. NOMINATED BY SOMEBODY WHO HAS DONE IT BEFORE ───────────────────────
//
// The most Big Brother version of this: it is not that they dislike each
// other, it is that one of them is holding the power again.
const nominatedAgain = {
  id: 'past-nominated-again',
  category: 'ceremonies',
  location: 'diary-room',
  weight(house, ctx) {
    if (_once(this.id, ctx)) return 0;
    if (!['nominations', 'campaign'].includes(ctx?.act)) return 0;
    return _nomineeWithHistory(ctx) ? 9 : 0;
  },
  fire(house, ctx, api) {
    const hit = _nomineeWithHistory(ctx);
    if (!hit) return null;
    _spend(this.id, ctx);
    const { hoh, nominee, past } = hit;
    const bad = BAD.includes(past.kind);

    const text = bad
      ? _line([
        `${nominee} does not look surprised, and that is somehow worse. ${past.reason}. `
          + `"${P(hoh).Sub === 'they' ? 'They have' : `${hoh} has`} had a whole year to think about `
          + `doing that again, and a week to do it."`,
        `In the diary room ${nominee} is very calm about it. ${past.reason}. `
          + `"So we are just going to run it back. Fine. I know how this one ends and so does ${hoh}."`,
        `${hoh} says the nomination is not personal. ${past.reason}, so there is precisely one `
          + `person in this house who believes that, and ${P(hoh).sub} ${isAre(hoh)} currently saying it.`,
        `The key turns and the room does the maths before ${nominee} does. ${past.reason} — `
          + `this is the second time ${hoh} has put ${P(nominee).obj} in this chair.`,
      ], `${this.id}|bad|${hoh}|${nominee}`, ctx)
      : _line([
        `${hoh} nominates ${nominee} and cannot look at ${P(nominee).obj} while doing it. `
          + `${past.reason}. Some debts are older than this house.`,
        `"I owed ${P(nominee).obj} better than this." ${past.reason}, and ${hoh} says it to the `
          + `diary room camera rather than to the person it is about.`,
        `${nominee} takes it standing up. ${past.reason} — which is exactly why it lands as hard `
          + `as it does, and why nobody else in the room says anything.`,
      ], `${this.id}|good|${hoh}|${nominee}`, ctx);

    api.addBond?.(nominee, hoh, bad ? -1.0 : -1.4);   // worse when it breaks something good
    api.setTarget?.(nominee, hoh, past.reason);
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[nominee] = (gs.popularity[nominee] || 0) + 0.6;   // the audience remembers too

    return {
      text, players: [nominee, hoh],
      badgeText: bad ? 'HE DID IT AGAIN' : 'AN OLD ALLY HOLDS THE KEY',
      badgeClass: 'red',
    };
  },
};

/** A nominee this week who has history with whoever nominated them. */
function _nomineeWithHistory(ctx) {
  const week = ctx?.week;
  const hoh = week?.hoh;
  const noms = week?.nominees || week?.finalNominees || [];
  if (!hoh || !noms.length) return null;
  for (const nominee of noms) {
    const past = sharedPast(hoh, nominee);
    if (past) return { hoh, nominee, past };
  }
  return null;
}

// ── 3. THE VOTE THAT SETTLES IT ───────────────────────────────────────────
//
// Eviction night. Not a new grievance — the old one, collected.
const settledTonight = {
  id: 'past-settled-tonight',
  category: 'ceremonies',
  location: 'diary-room',
  weight(house, ctx) {
    if (ctx?.act !== 'eviction') return 0;
    if (_once(this.id, ctx)) return 0;
    return _voterWithHistory(ctx) ? 8 : 0;
  },
  fire(house, ctx, api) {
    const hit = _voterWithHistory(ctx);
    if (!hit) return null;
    _spend(this.id, ctx);
    const { voter, nominee, past } = hit;

    const text = _line([
      `${voter} does not dress it up in the diary room. ${past.reason}. `
        + `"People keep telling me this is a game. It was a game last time too."`,
      `"Everyone in here is going to tell you this vote is strategic." ${past.reason}, `
        + `and ${voter} is not going to tell you that.`,
      `${past.reason}. ${voter} has been waiting a very long time to be holding a vote on the `
        + `night ${nominee} needed one.`,
      `${voter} votes and then sits with it for a second. ${past.reason} — `
        + `some debts follow you from one summer into the next.`,
    ], `${this.id}|${voter}|${nominee}`, ctx);

    if (!gs.popularity) gs.popularity = {};
    gs.popularity[voter] = (gs.popularity[voter] || 0) - 0.3;   // settling scores reads cold

    return {
      text, players: [voter, nominee],
      badgeText: 'SOME DEBTS CARRY OVER', badgeClass: 'red',
    };
  },
};

/** Somebody voting tonight who has old business with a nominee. */
function _voterWithHistory(ctx) {
  const week = ctx?.week;
  const noms = week?.finalNominees || week?.nominees || [];
  const voters = (week?.ballots || []).map(b => b.voter).filter(Boolean);
  for (const nominee of noms) {
    for (const voter of voters) {
      const past = sharedPast(voter, nominee);
      if (past && BAD.includes(past.kind)) return { voter, nominee, past };
    }
  }
  return null;
}

// ── 4. A REPUTATION THAT ARRIVED BEFORE THEY DID ──────────────────────────
//
// Not about a pair. The ledger knows this person plays a certain way, and the
// house has watched them do it.
const knownForIt = {
  id: 'past-known-for-it',
  category: 'house-life',
  location: 'kitchen',
  weight(house, ctx) {
    if (_once(this.id, ctx) || _burnt(this.id)) return 0;
    if (['nominations', 'veto-ceremony', 'eviction'].includes(ctx?.act)) return 0;
    return _notorious(house) ? 6 * _decay(ctx) : 0;
  },
  fire(house, ctx, api) {
    const hit = _notorious(house);
    if (!hit) return null;
    _spend(this.id, ctx); _burn(this.id);
    const { name, profile } = hit;
    const watcher = _others(house, name)[0];
    const line = profile.resume?.[0];

    const text = _line([
      `Nobody has to be told what ${name} is. ${line ? `${line}. ` : ''}`
        + `The house has watched ${P(name).obj} do it, and is now watching for it.`,
      `${watcher || 'Somebody'} says it at the table without much heat: "We all saw the season. `
        + `We know exactly what ${P(name).sub} ${P(name).sub === 'they' ? 'do' : 'does'}." `
        + `${line ? `${line}. ` : ''}${name} does not deny it.`,
      `The problem with a reputation is that it plays before you do. `
        + `${line ? `${line}. ` : ''}${name} spends the whole afternoon being agreed with by people `
          + `who are not going to work with ${P(name).obj}.`,
    ], `${this.id}|${name}`, ctx);

    for (const n of _others(house, name).slice(0, 6)) api.suspicion?.(n, name, 1.1);

    return { text, players: [name], badgeText: 'THE TAPES DO NOT LIE', badgeClass: 'red' };
  },
};

/** The houseguest the ledger most marks as a schemer, if the house has one. */
function _notorious(house) {
  let best = null;
  for (const name of house) {
    const profile = pastProfile(name);
    if (!profile || (profile.knownSchemer || 0) < 0.5) continue;
    if (!best || profile.knownSchemer > best.profile.knownSchemer) best = { name, profile };
  }
  return best;
}

export const FRANCHISE_HISTORY_EVENTS = [
  pastSurfaces, nominatedAgain, settledTonight, knownForIt,
];
