// ══════════════════════════════════════════════════════════════════════
// bb-events/fallout.js — the Friday morning after a Thursday eviction
// ══════════════════════════════════════════════════════════════════════
//
// Everything here fires in the quiet at the top of a week, before the Head of
// Household competition, and everything here reads the ballots that were
// actually cast rather than a general sense that somebody left.
//
// The two halves matter equally. Grief without consequence is a sad scene; the
// consequence is that a person who loses a friend goes looking for who did it,
// gets it right or gets it badly wrong, and carries that for weeks. And a
// houseguest who quietly kept somebody's ally has bought goodwill they do not
// know they have until it surfaces.
//
// Nobody in this house can see a ballot, which is the whole design: blame is a
// reconstruction assembled from who put them up, who could have saved them, who
// gained, and whichever group the mourner had already decided was running the
// place. Sometimes that lands on the right person.

import { gs } from '../core.js';
import { pronouns } from '../players.js';
import {
  pStats, bond, perceived, band, closestTo, beatsInvolving, archetype, isNice,
} from './_read.js';
import {
  lastCompletedWeek, reactionsTo, chiefMourner, assignBlame, keptThem,
  wroteTheName, votedAgainst, evictionCount,
} from '../bb/fallout.js';
import { knowsVote } from '../bb/knowledge.js';
import { factId, learn } from '../knowledge.js';

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}
const _quiet = pool => [...pool].sort((a, b) => beatsInvolving(a) - beatsInvolving(b));
const _list = names => (names.length <= 1 ? (names[0] || '')
  : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

/**
 * The morning after, and only the morning after.
 *
 * These belong in the empty hours before the Head of Household competition. By
 * the time nominations are being decided the house has moved on, and a grief
 * scene during a ceremony reads as the show losing its place.
 */
const _morning = (ctx, value) => {
  const early = ctx?.phase === 'pre-hoh' || ctx?.act === 'house' || ctx?.act === 'hoh';
  return early ? band(value) : 0;
};

/**
 * Once per eviction, not once per beat.
 *
 * The morning after a vote is one morning. Without this the house act — which
 * draws twenty-odd beats — would run the same reckoning two or three times, and
 * a mourner would work out who did it, then work it out again an hour later.
 * Measured at 225 blame scenes across 110 weeks before the guard.
 */
// Marked on the WEEK, not on gs.bb. A global map keyed by week number survives
// anything that rebuilds gs.bb without clearing it, so replaying the same seed
// found every event already spent and produced a different season — which is
// the determinism guarantee, broken by a bookkeeping detail. The week object is
// new every week and dies with it.
function _spent(id, ctx) {
  return !!ctx?.week?._falloutFired?.[id];
}
function _spend(id, ctx) {
  if (!ctx?.week) return;
  (ctx.week._falloutFired ||= {})[id] = true;
}

/** Is there a fresh eviction to react to at all? */
const _fresh = ctx => {
  const week = lastCompletedWeek();
  if (!week) return null;
  // Only the week immediately after. Week-old grief is a different event.
  return (ctx?.week?.num || 0) === (week.num || 0) + 1 ? week : null;
};

// ── grief, and the performance of it ──────────────────────────────────

const mourning = {
  id: 'fallout-grief',
  category: 'house-life',
  location: 'bedroom',
  weight(house, ctx) {
    const week = _fresh(ctx);
    if (!week) return 0;
    if (_spent('fallout-grief', ctx)) return 0;
    const mourner = chiefMourner(week);
    return mourner && !mourner.hypocrisy ? _morning(ctx, 9) : 0;
  },
  fire(house, ctx, api) {
    const week = _fresh(ctx);
    _spend(this.id, ctx);
    const mourner = chiefMourner(week);
    const gone = week.evicted;
    const p = pronouns(mourner.name);
    const comfort = closestTo(mourner.name, house.filter(n => n !== mourner.name));

    const text = _variant([
      `${mourner.name} makes coffee for a number of people that is one too many, notices, and puts the extra cup back without saying anything.`,
      `The bed ${gone} slept in is stripped by mid-morning. ${mourner.name} is the one who does it, and does not let anybody help.`,
      `${mourner.name} keeps starting sentences with "${gone} would have —" and then stopping. By the third time nobody fills the silence for ${p.obj}.`,
      `Somebody asks ${mourner.name} how ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} doing and gets a long pause and a shrug. ${p.Sub} ${p.sub === 'they' ? 'have' : 'has'} lost the only person in this house ${p.sub} did not have to explain ${p.ref || 'themselves'} to.`,
    ], ctx, mourner.name, gone);

    // Grief is not neutral: it isolates. Somebody down a friend is down a vote
    // and everybody can count.
    api.popDelta(mourner.name, 1);
    if (comfort) {
      api.addBond(mourner.name, comfort, 0.8);
      api.remember(mourner.name, comfort, 'was-there', 1, { about: `after ${gone} left` });
    }
    return { text, players: [mourner.name, comfort].filter(Boolean),
      badgeText: 'DOWN A FRIEND', badgeClass: 'blue' };
  },
};

const cryingOverAName = {
  id: 'fallout-hypocrisy',
  category: 'house-life',
  weight(house, ctx) {
    const week = _fresh(ctx);
    if (!week) return 0;
    if (_spent('fallout-hypocrisy', ctx)) return 0;
    return reactionsTo(week).some(r => r.hypocrisy > 0) ? _morning(ctx, 8) : 0;
  },
  fire(house, ctx, api) {
    const week = _fresh(ctx);
    _spend(this.id, ctx);
    const faker = reactionsTo(week).find(r => r.hypocrisy > 0);
    const gone = week.evicted;
    const p = pronouns(faker.name);
    // Whoever is sharp enough to notice what they are watching.
    const witness = _quiet(house.filter(n => n !== faker.name))
      .find(n => pStats(n).intuition >= 6) || house.find(n => n !== faker.name);

    const text = _variant([
      `${faker.name} cries about ${gone} for most of the morning. ${witness} watches it happen and remembers writing ${gone}'s name down at the same table as ${faker.name} did.`,
      `"I can't believe ${gone} is gone." ${witness} does not say the obvious thing out loud, but ${pronouns(witness).sub} ${pronouns(witness).sub === 'they' ? 'do' : 'does'} think it, and ${pronouns(witness).sub} ${pronouns(witness).sub === 'they' ? 'are' : 'is'} not the only one.`,
      `${faker.name} is genuinely upset and also voted to make it happen, and ${p.sub} ${p.sub === 'they' ? 'do' : 'does'} not appear to find those two facts uncomfortable together. ${witness} finds it very uncomfortable indeed.`,
      `The grief is real. So was the vote. ${witness} decides that a person who can hold both of those at once is a person to be careful around.`,
    ], ctx, faker.name, witness);

    // The tell is not the crying, it is what it teaches the room about them.
    api.suspicion(witness, faker.name, 1.1);
    api.remember(witness, faker.name, 'two-faced', 2, { about: `mourned ${gone} after voting them out` });
    api.popDelta(faker.name, -2);
    return { text, players: [faker.name, witness],
      badgeText: 'MOURNS THE NAME THEY WROTE', badgeClass: 'orange' };
  },
};

const goodRiddance = {
  id: 'fallout-relief',
  category: 'house-life',
  weight(house, ctx) {
    const week = _fresh(ctx);
    if (!week) return 0;
    if (_spent('fallout-relief', ctx)) return 0;
    return reactionsTo(week).some(r => r.relief >= 1.5) ? _morning(ctx, 7) : 0;
  },
  fire(house, ctx, api) {
    const week = _fresh(ctx);
    _spend(this.id, ctx);
    const relieved = reactionsTo(week).filter(r => r.relief >= 1.5);
    const who = relieved[0];
    const gone = week.evicted;
    const p = pronouns(who.name);
    const loud = pStats(who.name).temperament <= 5 || !isNice(who.name);
    const mourner = reactionsTo(week).find(r => r.grief >= 2);

    const text = loud ? _variant([
      `${who.name} does not pretend. "I slept properly for the first time in two weeks." Somebody points out that ${gone} has been gone for eleven hours.`,
      `${who.name} is in an extremely good mood and makes no attempt to explain why${mourner ? `, which ${mourner.name} notices from across the room` : ''}.`,
      `"Am I supposed to be sad?" ${who.name} asks it as a genuine question, at breakfast, in front of people who are.`,
    ], ctx, who.name, gone) : _variant([
      `${who.name} arranges ${p.posAdj} face carefully before coming out of the bedroom, and does a decent job of it for about an hour.`,
      `${who.name} says all the right things about ${gone} and means none of them. ${p.Sub} ${p.sub === 'they' ? 'have' : 'has'} been waiting three weeks for this.`,
      `Nobody would call ${who.name} cheerful. But ${p.sub} ${p.sub === 'they' ? 'eat' : 'eats'} properly for the first time since ${gone} started saying ${p.posAdj} name in strategy conversations.`,
    ], ctx, who.name, gone);

    if (loud && mourner) {
      api.addBond(mourner.name, who.name, -0.9);
      api.suspicion(mourner.name, who.name, 0.7);
      api.popDelta(who.name, -1);
    }
    return { text, players: [who.name, loud && mourner ? mourner.name : null].filter(Boolean),
      badgeText: loud ? 'NOT EVEN HIDING IT' : 'QUIETLY RELIEVED',
      badgeClass: loud ? 'orange' : 'grey' };
  },
};

// ── who did it ────────────────────────────────────────────────────────

const findingTheCulprit = {
  id: 'fallout-blame',
  category: 'deals',
  weight(house, ctx) {
    const week = _fresh(ctx);
    if (!week) return 0;
    if (_spent('fallout-blame', ctx)) return 0;
    const mourner = chiefMourner(week);
    if (!mourner) return 0;
    return assignBlame(mourner.name, week) ? _morning(ctx, 12) : 0;
  },
  fire(house, ctx, api) {
    const week = _fresh(ctx);
    _spend(this.id, ctx);
    const mourner = chiefMourner(week);
    const verdict = assignBlame(mourner.name, week);
    const gone = week.evicted;
    if (!verdict) {
      return { text: `${mourner.name} spends the morning trying to work out who did it and gets nowhere.`,
        players: [mourner.name], badgeText: 'NO ANSWER', badgeClass: 'grey' };
    }
    const { blamed, correct, why } = verdict;
    const p = pronouns(mourner.name);

    const text = correct ? _variant([
      `${mourner.name} works backwards from who gained and arrives at ${blamed}, who ${why}. It is the right answer and ${p.sub} ${p.sub === 'they' ? 'know' : 'knows'} it before ${p.sub} can prove it.`,
      `It takes ${mourner.name} most of the morning and one very careful conversation, but ${p.sub} ${p.sub === 'they' ? 'get' : 'gets'} there: ${blamed}. ${gone} is gone and ${blamed} ${why}.`,
      `"It was ${blamed}." ${mourner.name} says it flatly, to nobody in particular, and does not need anybody to confirm it.`,
    ], ctx, mourner.name, blamed) : _variant([
      `${mourner.name} settles on ${blamed} because ${blamed} ${why}, and because ${p.sub} ${p.sub === 'they' ? 'need' : 'needs'} it to be somebody. It was not ${blamed}.`,
      `The arithmetic ${mourner.name} does is sound and the answer is wrong. ${blamed} ${why}, which is enough — grief does not require a high standard of proof.`,
      `${mourner.name} decides it was ${blamed}. Somewhere in this house the person who actually did it watches ${p.obj} decide that and says nothing at all.`,
      `${blamed} ${why} and is therefore, as far as ${mourner.name} is concerned, the reason ${gone} is not here. The real answer is standing three feet away being sympathetic.`,
    ], ctx, mourner.name, blamed);

    // This is the point of the whole file: losing somebody makes a target.
    api.setTarget(mourner.name, blamed, `holds ${blamed} responsible for ${gone} going home`);
    api.remember(mourner.name, blamed, 'took-my-ally', 3, { about: gone });
    api.suspicion(mourner.name, blamed, 2);
    api.addBond(mourner.name, blamed, -1.6);
    return { text, players: [mourner.name, blamed],
      badgeText: correct ? 'THEY WORKED IT OUT' : 'WRONG PERSON',
      badgeClass: correct ? 'red' : 'orange' };
  },
};

const itWasNotMe = {
  id: 'fallout-denial',
  category: 'deals',
  weight(house, ctx) {
    const week = _fresh(ctx);
    if (!week) return 0;
    if (_spent('fallout-denial', ctx)) return 0;
    const mourner = chiefMourner(week);
    if (!mourner) return 0;
    // Somebody who wrote the name down and would rather this person did not
    // find that out.
    return wroteTheName(week).some(n => n !== mourner.name && bond(n, mourner.name) > -2)
      ? _morning(ctx, 10) : 0;
  },
  fire(house, ctx, api) {
    const week = _fresh(ctx);
    _spend(this.id, ctx);
    const mourner = chiefMourner(week);
    const liar = _quiet(wroteTheName(week).filter(n => n !== mourner.name
      && bond(n, mourner.name) > -2))[0];
    const gone = week.evicted;
    if (!liar) {
      return { text: `Nobody volunteers how they voted.`, players: [mourner.name],
        badgeText: 'SILENCE', badgeClass: 'grey' };
    }
    const p = pronouns(liar);
    // Same shape as every other claim in this house: it lands on trust, not on
    // truth. Here the truth is that they are lying, which makes being believed
    // the bad outcome for everybody except the liar.
    const trust = perceived(mourner.name, liar);
    const believed = trust + (pStats(liar).social - 5) * 0.25
      - pStats(mourner.name).intuition * 0.18 > -0.4;

    const text = believed ? _variant([
      `"It wasn't me. I need you to know that." ${mourner.name} believes ${liar}, and ${liar} wrote ${gone}'s name down four hours ago.`,
      `${liar} gets to ${mourner.name} before anybody else can and says it plainly: ${p.sub} voted to keep ${gone}. ${mourner.name} takes ${p.obj} at ${p.posAdj} word, and looks somewhere else for somebody to be angry at.`,
      `${liar} is a convincing liar largely because ${p.sub} ${p.sub === 'they' ? 'seem' : 'seems'} so uncomfortable doing it. ${mourner.name} apologises for even wondering.`,
    ], ctx, mourner.name, liar) : _variant([
      `"It wasn't me." ${mourner.name} lets it sit for a second too long before saying "okay", and both of them hear it.`,
      `${liar} denies it and ${mourner.name} does not believe a word, which is worse than being asked — now ${p.sub} ${p.sub === 'they' ? 'know' : 'knows'} ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} to be managed.`,
      `${mourner.name} asks ${liar} straight out. ${liar} says no. ${mourner.name} thanks ${p.obj} for being honest in a tone that makes it clear ${p.sub} ${p.sub === 'they' ? 'were' : 'was'} not.`,
    ], ctx, mourner.name, liar);

    if (believed) {
      api.addBond(mourner.name, liar, 0.5);
      api.remember(mourner.name, liar, 'swore-it-was-not-them', 2, { about: gone });
    } else {
      api.suspicion(mourner.name, liar, 1.6);
      api.addBond(mourner.name, liar, -1.1);
      api.remember(mourner.name, liar, 'lied-to-my-face', 2, { about: gone });
    }
    return { text, players: [mourner.name, liar],
      badgeText: believed ? 'TAKEN AT THEIR WORD' : 'NOT BUYING IT',
      badgeClass: believed ? 'grey' : 'red' };
  },
};

const somebodyStayedLoyal = {
  id: 'fallout-recognition',
  category: 'deals',
  weight(house, ctx) {
    const week = _fresh(ctx);
    if (!week) return 0;
    if (_spent('fallout-recognition', ctx)) return 0;
    const mourner = chiefMourner(week);
    if (!mourner) return 0;
    return keptThem(week).some(n => n !== mourner.name) ? _morning(ctx, 9) : 0;
  },
  fire(house, ctx, api) {
    const week = _fresh(ctx);
    _spend(this.id, ctx);
    const mourner = chiefMourner(week);
    const loyal = _quiet(keptThem(week).filter(n => n !== mourner.name))[0];
    const gone = week.evicted;
    if (!loyal) {
      return { text: `Nobody kept ${gone}. ${mourner.name} finds that out and stops asking.`,
        players: [mourner.name], badgeText: 'ALONE IN IT', badgeClass: 'grey' };
    }
    const p = pronouns(loyal);
    // Whether these two were already close decides which story this is, and the
    // copy has to ask rather than assume. One variant called the loyal voter "a
    // stranger at best" without checking, and picked somebody the mourner was
    // already at maximum bond with — where the +2 also silently vanished into
    // the clamp, so the card showed a friendship forming and moved nothing.
    const already = bond(mourner.name, loyal);
    const text = already >= 5 ? _variant([
      `${mourner.name} finds out ${loyal} was the vote to keep ${gone} and is not remotely surprised. It is still the first thing all morning that has made ${p.obj} feel less alone in here.`,
      `"You kept ${gone}." "Obviously I kept ${gone}." ${mourner.name} does not have many certainties left in this house. ${loyal} is one of them.`,
      `Everybody else spends the morning explaining themselves to ${mourner.name}. ${loyal} does not have to, and both of them notice that.`,
    ], ctx, mourner.name, loyal) : _variant([
      `${mourner.name} finds out that ${loyal} was the vote to keep ${gone}. ${p.Sub} had nothing to gain from it and did it anyway, and that is worth more to ${mourner.name} than anything anybody has promised ${p.obj} in three weeks.`,
      `"You voted to keep ${gone}." ${loyal} does not deny it and does not make a thing of it either, which is exactly why ${mourner.name} believes it.`,
      `It comes out sideways, in the middle of a conversation about something else: ${loyal} was one vote on the wrong side of a result ${p.sub} could not change. ${mourner.name} has been looking for somebody to trust and has just found one.`,
      `${mourner.name} had ${loyal} down as a stranger at best. Then the count comes out, and a stranger turns out to be the only person who tried.`,
    ], ctx, mourner.name, loyal);

    // Room to move, or the receipt is a lie: at the cap this changes nothing and
    // the card would claim a friendship it did not create.
    api.addBond(mourner.name, loyal, already >= 8 ? 0.6 : 2);
    api.remember(mourner.name, loyal, 'stood-by-my-friend', 2, { about: gone });
    api.suspicion(mourner.name, loyal, -0.8);
    return { text, players: [mourner.name, loyal],
      badgeText: 'THE ONE WHO TRIED', badgeClass: 'green' };
  },
};

// ── the house talking ─────────────────────────────────────────────────

const wordGetsAround = {
  id: 'fallout-word-gets-around',
  category: 'deals',
  weight(house, ctx) {
    const week = _fresh(ctx);
    if (!week) return 0;
    if (_spent('fallout-word-gets-around', ctx)) return 0;
    return _teller(house, week) ? _morning(ctx, 10) : 0;
  },
  fire(house, ctx, api, rng = Math.random) {
    const week = _fresh(ctx);
    _spend(this.id, ctx);
    const pair = _teller(house, week);
    if (!pair) {
      return { text: `Nobody has anything to trade this morning.`, players: [],
        badgeText: 'NOTHING MOVES', badgeClass: 'grey' };
    }
    const { teller, listener, about } = pair;
    const gone = week.evicted;
    const p = pronouns(teller);

    const text = _variant([
      `${teller} tells ${listener} how ${about} voted, which ${teller} only knows because ${p.sub} ${p.sub === 'they' ? 'were' : 'was'} in the room when ${about} said it out loud. That is how everything in here travels.`,
      `"${about} wrote ${gone}'s name down." ${listener} did not know that an hour ago and cannot unknow it now, and ${teller} has just spent something to make that true.`,
      `${teller} trades what ${p.sub} ${p.sub === 'they' ? 'know' : 'knows'} about ${about}'s vote for something ${listener} knows. Both of them come out of it better informed and slightly more dangerous.`,
      `It takes ${teller} one sentence to change how ${listener} sees ${about}, and the sentence is true, which is the rarest version of this conversation.`,
    ], ctx, teller, listener, about);

    // The information itself is the consequence: the listener now genuinely
    // knows, which the blame layer reads directly.
    try {
      // The seeded generator, not Math.random. `told` is a persuasion roll
      // inside learn(), so an unseeded one here means the same seed stops
      // replaying the same season — which is exactly how it broke.
      learn(listener, factId('vote', about, gone),
        { source: teller, sourceType: 'told', confidence: 0.85, from: teller,
          ep: week.num || 0, rng });
    } catch { /* the fact has aged out */ }
    api.addBond(teller, listener, 0.8);
    api.suspicion(listener, about, 1.2);
    api.remember(listener, teller, 'told-me-something-real', 2, { about });
    return { text, players: [teller, listener, about],
      badgeText: 'WORD GETS AROUND', badgeClass: 'orange' };
  },
};

/**
 * Somebody who knows a vote, and somebody who would want to hear it.
 *
 * Only real knowledge is tradeable: the teller has to actually believe the
 * fact, which in this house means they cast the vote, watched it happen, or
 * were told by somebody they believed.
 */
function _teller(house, week) {
  const gone = week?.evicted;
  if (!gone) return null;
  for (const teller of _quiet(house)) {
    for (const about of house) {
      if (about === teller || !knowsVote(teller, about, gone)) continue;
      const listener = _quiet(house).find(n => n !== teller && n !== about
        && !knowsVote(n, about, gone) && bond(teller, n) >= 1);
      if (listener) return { teller, listener, about };
    }
  }
  return null;
}

export const FALLOUT_EVENTS = [
  mourning, cryingOverAName, goodRiddance, findingTheCulprit, itWasNotMe, somebodyStayedLoyal,
  wordGetsAround,
];
