// ══════════════════════════════════════════════════════════════════════
// bb-events/blocs.js — organising against the house's power structures
// ══════════════════════════════════════════════════════════════════════
//
// The scenes for the layer in bb/blocs.js. Every one of them either moves what
// somebody KNOWS or turns what they know into a target, because the failure
// this replaces was a set of events that did neither: the house could say "one
// of them has to go" and then nominate a stranger.
//
// The order they tend to run in is the order a real season finds a group:
//
//   somebody notices → the vote confirms it → they pick who to hit →
//   they go looking for help → and somewhere in there it either stays quiet or
//   somebody says it out loud in front of everybody
//
// Being told is the interesting one. A true thing from an untrusted mouth is
// not information, it is a reason to wonder what the teller wants — so
// bloc-told fires whether or not it lands, and the disbelieved version has
// consequences of its own.

import { pronouns } from '../players.js';
import {
  pStats, bond, perceived, band, closestTo, furthestFrom, suspicionOf, targetOf,
  archetype, isVillainous, beatsInvolving, spotlightOrder, willScheme,
} from './_read.js';
import {
  listBlocs, knowledgeOf, knownBlocsFor, readPower, pointOfAttack, chooseBlocTarget,
  tellAbout, exposeBloc, outsidersTo, hasPlanAgainst, recordPlanAgainst, blocExposure,
} from '../bb/blocs.js';
import { timesVotedTogether, evictionCount } from '../bb/fallout.js';

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));

/** "Raj, Brightly and Ripper" — not "Raj and Brightly and Ripper". */
const _list = names => (names.length <= 1 ? (names[0] || '')
  : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

/** "both of them" for a pair; "all four of them" for a group. */
const WORDS = ['', '', 'both', 'all three', 'all four', 'all five', 'all six', 'all seven'];
const _count = n => WORDS[n] || `all ${n}`;
/** Least-seen first, so the same two people do not carry every beat. */
/** Least-seen first, weighted toward whoever this week is about. */
const _quiet = pool => spotlightOrder(pool);

/**
 * House life, not ceremony.
 *
 * Zero during the two ceremonies, not merely reduced. Those acts draw one to
 * three beats between them and the events written FOR them are the point of
 * watching — six more eligible events at any weight is enough to push one out,
 * and veto-left-on-block (a nominee watching somebody who owed them leave them
 * sitting there) went dead across ten seeded seasons the week these were added.
 * A conversation about who is working with whom can happen in the other four
 * acts; a veto ceremony cannot.
 */
const _fit = ctx => (ctx?.act === 'nominations' || ctx?.act === 'veto-ceremony' ? 0
  : ctx?.act === 'eviction' ? 0.2
  : ctx?.act === 'campaign' ? 0.7 : 1);

/** The first person in the house who has worked something out and not acted. */
function _firstReader(house, minRead = 0.9) {
  for (const name of _quiet(house)) {
    const read = chooseBlocTarget(name, { minPower: minRead });
    if (read && !hasPlanAgainst(name, read.bloc.id)) return { name, ...read };
  }
  return null;
}

// ── noticing ──────────────────────────────────────────────────────────

const blocNoticed = {
  id: 'bloc-noticed',
  category: 'social',
  weight(house, ctx) {
    if (house.length < 5) return 0;
    // Somebody on the edge of a group they can half-see. Not certainty — the
    // moment before it, which is the one worth a scene.
    const seer = house.find(name => knownBlocsFor(name)
      .some(entry => entry.known >= 0.3 && entry.known <= 0.8));
    return seer ? band(7 * _fit(ctx)) : 0;
  },
  fire(house, ctx, api) {
    const seer = _quiet(house).find(name => knownBlocsFor(name)
      .some(entry => entry.known >= 0.3 && entry.known <= 0.8)) || house[0];
    const entry = knownBlocsFor(seer).find(e => e.known >= 0.3 && e.known <= 0.8)
      || knownBlocsFor(seer)[0];
    if (!entry) return { text: `${seer} watches the house and counts.`, players: [seer],
      badgeText: 'COUNTING', badgeClass: 'grey' };
    const bloc = entry.bloc;
    const p = pronouns(seer);
    const names = bloc.members.slice(0, 3).join(', ');

    const text = bloc.kind === 'couple' ? _variant([
      `${seer} stops pretending ${p.sub} ${p.sub === 'they' ? 'have not' : 'has not'} noticed. ${bloc.members[0]} and ${bloc.members[1]} are not two people any more, they are one vote that arrives twice.`,
      `It is the small things that give ${bloc.members[0]} and ${bloc.members[1]} away, and ${seer} has been collecting them: who follows whom out of a room, who looks at whom before answering.`,
      `${seer} works out that ${bloc.members[0]} and ${bloc.members[1]} will never, under any circumstances, write each other's names down. Everything else follows from that.`,
    ], ctx, seer, bloc.id) : _variant([
      `${seer} has been keeping a list of who ends up in the same room and the same names keep appearing on it. ${names} — always, and never by accident.`,
      `The conversation stops when ${seer} walks in. It is not the first time, and the same people always seem to be in the room.`,
      `${seer} does the arithmetic ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} been avoiding: if ${names} are together, the votes are being decided before everybody else enters the room.`,
      `${seer} cannot prove it and does not need to. ${names} move like people who have already agreed.`,
    ], ctx, seer, bloc.id);

    // Noticing is not knowing. It moves the read and makes them warier of the
    // members, which is what actually changes behaviour next week.
    bloc.members.forEach(m => api.suspicion(seer, m, 0.5));
    api.remember(seer, bloc.members[0], 'reads-the-room', 1, { about: bloc.label });
    return { text, players: [seer, ...bloc.members.slice(0, 2)],
      badgeText: bloc.kind === 'couple' ? 'ONE VOTE, TWICE' : 'A PATTERN',
      badgeClass: 'blue' };
  },
};

const blocVoteTell = {
  id: 'bloc-vote-tell',
  category: 'social',
  weight(house, ctx) {
    // Only worth saying once the house has a vote to look back on.
    if ((ctx?.week?.num || 0) < 2 || house.length < 5) return 0;
    const counter = house.find(name => knownBlocsFor(name)
      .some(entry => entry.known >= 0.45));
    return counter ? band(8 * _fit(ctx)) : 0;
  },
  fire(house, ctx, api) {
    const counter = _quiet(house).find(name => knownBlocsFor(name)
      .some(entry => entry.known >= 0.45)) || house[0];
    const entry = knownBlocsFor(counter).find(e => e.known >= 0.45) || knownBlocsFor(counter)[0];
    if (!entry) return { text: `${counter} runs the last vote back in ${pronouns(counter).posAdj} head.`,
      players: [counter], badgeText: 'COUNTING', badgeClass: 'grey' };
    const bloc = entry.bloc;
    const p = pronouns(counter);
    // How many times this has actually happened, rather than a number chosen to
    // sound good. These lines used to claim "again" and "twice running" with
    // nothing behind them, which is how an event ended up describing two
    // previous evictions in week two.
    const together = timesVotedTogether(bloc);
    const evictions = evictionCount();
    const again = together >= 2 ? ` That is ${together} votes in a row.` : '';

    const text = _variant([
      `${counter} goes back through the last vote out loud, name by name, and stops. "${_list(bloc.members.slice(0, 3))} all landed on the same person."${again}`,
      `Nobody has to be told what happened at the last eviction; ${counter} just has to count it in front of somebody. ${bloc.members.length} votes moved in the same direction${evictions >= 2 ? `, and it is not the first time` : ''}.`,
      `"Tell me that's a coincidence." ${counter} lists who voted with whom and waits. Nobody in the room takes the bet.`,
      `${counter} has stopped guessing about ${bloc.label}. The tally did the work — ${p.sub} ${p.sub === 'they' ? 'were' : 'was'} looking at the wrong thing all week.`,
    ], ctx, counter, bloc.id);
    bloc.members.forEach(m => api.suspicion(counter, m, 0.7));
    return { text, players: [counter, ...bloc.members.slice(0, 2)],
      badgeText: 'THE VOTES SAY SO', badgeClass: 'orange' };
  },
};

// ── deciding ──────────────────────────────────────────────────────────

const blocTargetPicked = {
  id: 'bloc-target-picked',
  category: 'deals',
  weight(house, ctx) {
    if (house.length < 5) return 0;
    return _firstReader(house) ? band(11 * _fit(ctx)) : 0;
  },
  fire(house, ctx, api) {
    const read = _firstReader(house);
    if (!read) {
      const who = house[0];
      return { text: `${who} decides the house is not yet a shape worth attacking.`,
        players: [who], badgeText: 'WAITING', badgeClass: 'grey' };
    }
    const { name: plotter, bloc, target, why } = read;
    const p = pronouns(plotter);
    const confidant = closestTo(plotter, outsidersTo(bloc, plotter));

    const text = bloc.kind === 'couple' ? _variant([
      `"You cannot take them both out at once." ${plotter} has settled on ${target} — break the pair and what remains is one angry houseguest instead of two locked votes.`,
      `${plotter} says it plainly${confidant ? ` to ${confidant}` : ''}: ${bloc.members.join(' and ')} will keep choosing each other unless somebody separates them, and ${target} has less protection around the house.`,
      `${plotter} does not care which of them goes. ${p.Sub} ${p.sub === 'they' ? 'care' : 'cares'} that one of them does, and ${target} is the name with the fewest people behind it.`,
    ], ctx, plotter, target) : _variant([
      `${plotter} stops talking about ${bloc.label} as a rumour and starts talking about it as a problem with a solution. ${why}.`,
      `"We are not playing against ${bloc.members.length} people, we are playing against one group that votes ${bloc.members.length} times." ${plotter} names ${target} — ${why}.`,
      `${plotter} works backwards from the end of the season and arrives at ${target}${confidant ? `, and tells ${confidant} so` : ''}. ${why}.`,
      `${plotter} has counted it enough times to be sure. The way through ${bloc.label} is ${target}, because ${why.toLowerCase()}.`,
    ], ctx, plotter, target);

    // The whole point of the layer: this is a real target now.
    api.setTarget(plotter, target, bloc.kind === 'couple'
      ? `to break up ${bloc.label}` : `to break up ${bloc.label}`);
    api.remember(plotter, target, 'bloc-threat', 2, { about: bloc.label });
    api.suspicion(plotter, target, 0.8);
    if (confidant) api.addBond(plotter, confidant, 0.4);
    recordPlanAgainst(plotter, bloc.id, ctx?.week?.num || 0);
    return { text, players: [plotter, target], badgeText: 'A PLAN WITH A NAME', badgeClass: 'red' };
  },
};

const blocRecruit = {
  id: 'bloc-recruit',
  category: 'deals',
  weight(house, ctx) {
    if (house.length < 6) return 0;
    // Somebody who has already decided, looking for the numbers to do it.
    const plotter = house.find(name => {
      const t = targetOf(name);
      return t && listBlocs().some(b => b.members.includes(t) && !b.members.includes(name)
        && knowledgeOf(name, b.id) >= 0.5);
    });
    return plotter ? band(9 * _fit(ctx)) : 0;
  },
  fire(house, ctx, api) {
    const plotter = _quiet(house).find(name => {
      const t = targetOf(name);
      return t && listBlocs().some(b => b.members.includes(t) && !b.members.includes(name)
        && knowledgeOf(name, b.id) >= 0.5);
    }) || house[0];
    const target = targetOf(plotter);
    const bloc = listBlocs().find(b => b.members.includes(target) && !b.members.includes(plotter));
    if (!target || !bloc) {
      return { text: `${plotter} looks for somebody to talk to and finds the house already spoken for.`,
        players: [plotter], badgeText: 'NO TAKERS', badgeClass: 'grey' };
    }

    const pool = _quiet(outsidersTo(bloc, plotter)).slice(0, 3);
    const joined = [];
    const refused = [];
    for (const listener of pool) {
      // You cannot recruit somebody into a fear they do not have. Either they
      // already see the group, or you have to convince them it exists first —
      // and that is the belief check, not a formality.
      let sees = knowledgeOf(listener, bloc.id) >= 0.4;
      if (!sees) sees = tellAbout(plotter, listener, bloc).believed;
      const willing = sees && perceived(listener, plotter) > -1
        && bond(listener, target) < 3;
      if (willing) {
        joined.push(listener);
        api.setTarget(listener, target, `${plotter} convinced them ${bloc.label} has the numbers`);
        api.addBond(plotter, listener, 0.7);
        api.remember(listener, plotter, 'recruited-me', 1, { about: bloc.label });
      } else {
        refused.push(listener);
        api.suspicion(listener, plotter, 0.6);
      }
    }

    const p = pronouns(plotter);
    const spoken = joined.length + refused.length;
    const text = joined.length ? _variant([
      `${plotter} spends the afternoon making the same case ${spoken === 1 ? 'once' : `${spoken} separate times`}. ${_list(joined)} ${joined.length > 1 ? 'come' : 'comes'} out of it agreeing that ${target} goes first.`,
      `"I am not asking you to like me, I am asking you to count." ${_list(joined)} ${joined.length > 1 ? 'do' : 'does'} the counting and ${joined.length > 1 ? 'arrive' : 'arrives'} where ${plotter} did.${refused.length ? ` ${_list(refused)} ${refused.length > 1 ? 'do' : 'does'} not.` : ''}`,
      `${plotter} pulls people aside one at a time, which is the only way this ever works. By evening ${joined.length === 1 ? 'one more person is' : `${joined.length} more people are`} prepared to say ${target}'s name.`,
    ], ctx, plotter, target) : _variant([
      `${plotter} makes the case to ${spoken === 1 ? 'the one person who will listen' : `${spoken} separate people`} and watches it land nowhere.${refused.length ? ` ${_list(refused)} ${refused.length > 1 ? 'either do not' : 'does not'} see ${bloc.label} or ${refused.length > 1 ? 'do not' : 'does not'} trust the person pointing at it.` : ''}`,
      `"Think about who benefits from you saying that." ${refused[0] || 'Nobody'} does not disagree with ${plotter} about ${bloc.label} so much as disagree with ${plotter}.`,
      `Everybody ${plotter} talks to nods and does nothing. The plan is sound and ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} the wrong person to be carrying it.`,
    ], ctx, plotter, target);

    return { text, players: [plotter, ...joined.slice(0, 2)],
      badgeText: joined.length ? `${joined.length} ON BOARD` : 'NOBODY MOVES',
      badgeClass: joined.length ? 'red' : 'grey' };
  },
};

// ── telling, and being disbelieved ────────────────────────────────────

const blocTold = {
  id: 'bloc-told',
  category: 'social',
  weight(house, ctx) {
    if (house.length < 5) return 0;
    const teller = house.find(name => knownBlocsFor(name).some(e => e.known >= 0.55));
    return teller ? band(8 * _fit(ctx)) : 0;
  },
  fire(house, ctx, api) {
    const teller = _quiet(house).find(name => knownBlocsFor(name).some(e => e.known >= 0.55))
      || house[0];
    const entry = knownBlocsFor(teller).find(e => e.known >= 0.55) || knownBlocsFor(teller)[0];
    if (!entry) return { text: `${teller} keeps it to ${pronouns(teller).ref || 'themselves'}.`,
      players: [teller], badgeText: 'SAYS NOTHING', badgeClass: 'grey' };
    const bloc = entry.bloc;
    const listener = _quiet(outsidersTo(bloc, teller))[0];
    if (!listener) return { text: `${teller} has nobody left to tell.`, players: [teller],
      badgeText: 'NOBODY LEFT', badgeClass: 'grey' };

    const result = tellAbout(teller, listener, bloc);
    const p = pronouns(listener);
    const text = result.believed ? _variant([
      `${teller} tells ${listener} about ${bloc.label}. ${listener} does not argue — ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} already noticed enough to need somebody else to say it first.`,
      `"You know they are working together." ${listener} says nothing for a moment, then starts naming votes that suddenly make sense.`,
      `${teller} lays it out and ${listener} believes it, because ${result.why}.`,
    ], ctx, teller, listener) : _variant([
      `${teller} tells ${listener} about ${bloc.label} and watches it land badly. ${listener} hears a person with a motive, not a person with information.`,
      `"And who told you that?" ${listener} does not believe ${teller} — ${result.why} — and spends the rest of the evening wondering what ${teller} is setting up.`,
      `It is true and ${listener} does not believe it, which is the whole risk of being the one who says it out loud. ${result.why.charAt(0).toUpperCase()}${result.why.slice(1)}.`,
      `${teller} is right about ${bloc.label}. ${listener} has decided ${teller} is playing an angle, and being right does not survive that.`,
    ], ctx, teller, listener);

    if (result.believed) {
      api.addBond(teller, listener, 0.6);
      bloc.members.forEach(m => api.suspicion(listener, m, 0.5));
      api.remember(listener, teller, 'told-me-the-truth', 1, { about: bloc.label });
    } else {
      api.suspicion(listener, teller, 1.1);
      api.addBond(teller, listener, -0.5);
      api.remember(listener, teller, 'working-an-angle', 1, { about: bloc.label });
    }
    return { text, players: [teller, listener],
      badgeText: result.believed ? 'IT LANDS' : 'NOT BELIEVED',
      badgeClass: result.believed ? 'orange' : 'grey' };
  },
};

const blocBlowup = {
  id: 'bloc-blowup',
  category: 'social',
  weight(house, ctx) {
    if (house.length < 5) return 0;
    // A blowup is not a conversation. It needs somebody with a temper, a group
    // that is already half-known, and enough of the season gone that people
    // have stopped being careful.
    const angry = house.find(name => pStats(name).temperament <= 5
      && knownBlocsFor(name).some(e => e.known >= 0.6 && blocExposure(e.bloc) < 0.85));
    // Rare on purpose: this is the scene that ends a group, and one every
    // other week makes it weather rather than an event.
    return angry ? band(2.2 * _fit(ctx)) : 0;
  },
  fire(house, ctx, api) {
    const angry = _quiet(house).find(name => pStats(name).temperament <= 5
      && knownBlocsFor(name).some(e => e.known >= 0.6 && blocExposure(e.bloc) < 0.85)) || house[0];
    const entry = knownBlocsFor(angry).find(e => e.known >= 0.6 && blocExposure(e.bloc) < 0.85)
      || knownBlocsFor(angry)[0];
    if (!entry) return { text: `${angry} bites it back down.`, players: [angry],
      badgeText: 'HELD IT IN', badgeClass: 'grey' };
    const bloc = entry.bloc;
    const p = pronouns(angry);

    const text = _variant([
      `It comes out in the kitchen with everybody standing there. "${bloc.members.slice(0, 3).join(', ')} — we all know. Stop pretending those votes are independent." Nobody has to be told twice; there is no unhearing it.`,
      `${angry} has been holding it in since ${pronouns(angry).sub} first noticed the pattern and lets go at the worst possible moment, in front of the entire house. ${bloc.label} is not a theory any more; it is a thing that was shouted.`,
      `"Say it to my face that you are not working together." ${bloc.members[0]} says nothing, which is the loudest answer available, and every person in the room does the arithmetic at the same time.`,
      `The argument is about something else for about forty seconds. Then ${angry} names ${_count(bloc.members.length)} of them out loud and the house stops being able to pretend.`,
    ], ctx, angry, bloc.id);

    // Everybody heard it. No belief check — they were standing there.
    exposeBloc(bloc, { everybody: true, week: ctx?.week?.num || 0, how: 'blowup' });
    bloc.members.forEach(m => {
      api.suspicion(angry, m, 1.2);
      api.addBond(angry, m, -1.2);
      _others(house, ...bloc.members).forEach(w => api.suspicion(w, m, 0.6));
    });
    api.popDelta(angry, pStats(angry).boldness >= 7 ? 2 : -1);
    return { text, players: [angry, ...bloc.members.slice(0, 2)],
      badgeText: 'SAID OUT LOUD', badgeClass: 'red' };
  },
};

export const BLOC_EVENTS = [
  blocNoticed, blocVoteTell, blocTargetPicked, blocRecruit, blocTold, blocBlowup,
];
