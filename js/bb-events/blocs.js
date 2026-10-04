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

import { gs } from '../core.js';
import { pronouns } from '../players.js';
import {
  pStats, bond, perceived, band, closestTo, furthestFrom, suspicionOf, targetOf,
  archetype, isVillainous, beatsInvolving, spotlightOrder, willScheme,
} from './_read.js';
import {
  listBlocs, knowledgeOf, knownBlocsFor, readPower, pointOfAttack, chooseBlocTarget,
  tellAbout, exposeBloc, outsidersTo, hasPlanAgainst, recordPlanAgainst, blocExposure,
} from '../bb/blocs.js';
import { timesVotedTogether } from '../bb/fallout.js';
import { makeScene } from '../bb/script/scene.js';
import { numberWord } from '../bb/script/inject.js';

/** Which room a scene happens in: by hash, never a die; the HOH room needs the HOH. */
function _room(rooms, ctx, ...people) {
  const ok = rooms.filter(r => r !== 'hoh-room' || (ctx?.hoh && people.includes(ctx.hoh)));
  const pool = ok.length ? ok : ['backyard'];
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${people.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return pool[hash % pool.length];
}

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));

/** "Raj, Brightly and Ripper" — not "Raj and Brightly and Ripper". */
/** "both of them" for a pair; "all four of them" for a group. */
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
    if (!entry) return { scene: makeScene('bloc.quiet', { a: seer }, { ending: 'scene' }, [], _room(['bedroom', 'backyard'], ctx, seer)), players: [seer],
      badgeText: 'COUNTING', badgeClass: 'grey' };
    const bloc = entry.bloc;
    const scene = makeScene('bloc.noticed', { a: seer, b: bloc.members[0], c: bloc.members[1] || null },
      { ending: bloc.kind === 'couple' ? 'couple' : 'group', intent: bloc.members.length > 2 ? 'big' : 'pair' }, [],
      _room(['kitchen', 'living-room', 'backyard'], ctx, seer));
    bloc.members.forEach(m => api.suspicion(seer, m, 0.5));
    api.remember(seer, bloc.members[0], 'reads-the-room', 1, { about: bloc.label });
    return { scene, players: [seer, ...bloc.members.slice(0, 2)],
      badgeText: bloc.kind === 'couple' ? 'ONE VOTE, TWICE' : 'A PATTERN',
      badgeClass: 'blue' };
  },
};

/**
 * The last eviction's tally, as the house heard it read out.
 *
 * Ballots are secret. Nobody in the house can go back through a vote "name by
 * name"; what they have is the number, and a number only gives a bloc away when
 * the room actually split. A 12-1 vote says nothing about who is working with
 * whom, and this event used to read one as proof of a four-person alliance.
 */
function _lastTally() {
  const w = (gs.bb?.weeks || []).slice().reverse().find(x => (x?.ballots || []).length);
  if (!w) return null;
  const t = {};
  for (const b of w.ballots) if (b?.evict) t[b.evict] = (t[b.evict] || 0) + 1;
  const counts = Object.values(t).sort((a, b) => b - a);
  return { text: counts.join('–'), words: counts.map(numberWord).join('-'), minority: counts.slice(1).reduce((a, b) => a + b, 0) };
}

const blocVoteTell = {
  id: 'bloc-vote-tell',
  category: 'social',
  weight(house, ctx) {
    // Only worth saying once the house has a vote to look back on.
    if ((ctx?.week?.num || 0) < 2 || house.length < 5) return 0;
    if ((_lastTally()?.minority || 0) < 2) return 0;
    const counter = house.find(name => knownBlocsFor(name)
      .some(entry => entry.known >= 0.45));
    return counter ? band(8 * _fit(ctx)) : 0;
  },
  fire(house, ctx, api) {
    const counter = _quiet(house).find(name => knownBlocsFor(name)
      .some(entry => entry.known >= 0.45)) || house[0];
    const entry = knownBlocsFor(counter).find(e => e.known >= 0.45) || knownBlocsFor(counter)[0];
    if (!entry) return { scene: makeScene('bloc.quiet', { a: counter }, { ending: 'scene' }, [], _room(['bedroom', 'backyard'], ctx, counter)),
      players: [counter], badgeText: 'COUNTING', badgeClass: 'grey' };
    const bloc = entry.bloc;
    const scene = makeScene('bloc.votes', { a: counter, b: bloc.members[0], c: bloc.members[1] || null },
      { ending: bloc.kind === 'couple' ? 'couple' : 'group', tally: _lastTally()?.words || 'split',
        again: timesVotedTogether(bloc) >= 2 }, [], _room(['bedroom', 'backyard', 'living-room'], ctx, counter));
    bloc.members.forEach(m => api.suspicion(counter, m, 0.7));
    return { scene, players: [counter, ...bloc.members.slice(0, 2)],
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
      return { scene: makeScene('bloc.quiet', { a: who }, { ending: 'scene' }, [], _room(['bedroom', 'backyard'], ctx, who)),
        players: [who], badgeText: 'WAITING', badgeClass: 'grey' };
    }
    const { name: plotter, bloc, target, why } = read;
    const confidant = closestTo(plotter, outsidersTo(bloc, plotter));
    const scene = makeScene('bloc.target', { a: plotter, b: confidant || null }, {
      ending: bloc.kind === 'couple' ? 'couple' : 'group',
      reason: /nobody outside/.test(why || '') ? 'alone' : /keeps winning/.test(why || '') ? 'wins' : 'reach',
      intent: confidant ? 'told' : 'alone',
      target, partner: bloc.members.find(m => m !== target && m !== plotter && m !== confidant) || null,
    }, [], _room(['bedroom', 'backyard'], ctx, plotter, confidant));
    api.setTarget(plotter, target, bloc.kind === 'couple'
      ? `to break up ${bloc.label}` : `to break up ${bloc.label}`);
    api.remember(plotter, target, 'bloc-threat', 2, { about: bloc.label });
    api.suspicion(plotter, target, 0.8);
    if (confidant) api.addBond(plotter, confidant, 0.4);
    recordPlanAgainst(plotter, bloc.id, ctx?.week?.num || 0);
    return { scene, players: [plotter, target, confidant].filter(Boolean),
      badgeText: 'A PLAN WITH A NAME', badgeClass: 'red' };
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
      return { scene: makeScene('bloc.quiet', { a: plotter }, { ending: 'scene' }, [], _room(['bedroom', 'backyard'], ctx, plotter)),
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
        api.setTarget(listener, target, `${plotter} says ${bloc.label} has the numbers`);
        api.addBond(plotter, listener, 0.7);
        api.remember(listener, plotter, 'recruited-me', 1, { about: bloc.label });
      } else {
        refused.push(listener);
        api.suspicion(listener, plotter, 0.6);
      }
    }

    const listener = joined[0] || refused[0] || null;
    const scene = makeScene('bloc.recruit', { a: plotter, b: listener }, {
      ending: joined.length ? 'joined' : 'refused',
      intent: joined.length ? (joined.length > 1 ? 'many' : 'one') : (listener ? 'asked' : 'nobody'),
      target,
    }, [], _room(['bedroom', 'backyard', 'kitchen'], ctx, plotter, listener));
    return { scene, players: [plotter, ...joined.slice(0, 2)],
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
    // Somebody who knows AND somebody left to tell: the fallback when the
    // second half was missing was "has nobody left to tell", a card with no
    // consequence, twice in one week.
    const teller = house.find(name => knownBlocsFor(name).some(e => e.known >= 0.55
      && outsidersTo(e.bloc, name).length));
    return teller ? band(8 * _fit(ctx)) : 0;
  },
  fire(house, ctx, api) {
    const teller = _quiet(house).find(name => knownBlocsFor(name).some(e => e.known >= 0.55
      && outsidersTo(e.bloc, name).length)) || house[0];
    const entry = knownBlocsFor(teller).find(e => e.known >= 0.55) || knownBlocsFor(teller)[0];
    if (!entry) return { scene: makeScene('bloc.quiet', { a: teller }, { ending: 'scene' }, [], _room(['bedroom', 'backyard'], ctx, teller)),
      players: [teller], badgeText: 'SAYS NOTHING', badgeClass: 'grey' };
    const bloc = entry.bloc;
    const listener = _quiet(outsidersTo(bloc, teller))[0];
    if (!listener) return { scene: makeScene('bloc.quiet', { a: teller }, { ending: 'scene' }, [], _room(['bedroom', 'backyard'], ctx, teller)), players: [teller],
      badgeText: 'NOBODY LEFT', badgeClass: 'grey' };

    const result = tellAbout(teller, listener, bloc);
    const named = bloc.members.filter(m => m !== teller && m !== listener);
    const why = result.why || '';
    const scene = makeScene('bloc.told', { a: teller, b: listener }, {
      ending: result.believed ? 'believed' : 'doubted',
      reason: result.believed ? (/already seen/.test(why) ? 'matched' : 'trust')
        : /do not trust/.test(why) ? 'distrust' : /messenger/.test(why) ? 'messenger' : 'sudden',
      target: named[0] || null, partner: named[1] || null,
    }, [], _room(['bedroom', 'backyard', 'kitchen'], ctx, teller, listener));
    if (result.believed) {
      api.addBond(teller, listener, 0.6);
      bloc.members.forEach(m => api.suspicion(listener, m, 0.5));
      api.remember(listener, teller, 'told-me-the-truth', 1, { about: bloc.label });
    } else {
      api.suspicion(listener, teller, 1.1);
      api.addBond(teller, listener, -0.5);
      api.remember(listener, teller, 'working-an-angle', 1, { about: bloc.label });
    }
    return { scene, players: [teller, listener],
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
    if (!entry) return { scene: makeScene('bloc.quiet', { a: angry }, { ending: 'scene' }, [], _room(['bedroom', 'backyard'], ctx, angry)), players: [angry],
      badgeText: 'HELD IT IN', badgeClass: 'grey' };
    const bloc = entry.bloc;
    const scene = makeScene('bloc.blowup', { a: angry, b: bloc.members[0], c: bloc.members[1] || null },
      { ending: bloc.kind === 'couple' ? 'couple' : 'group' }, house, 'kitchen');
    exposeBloc(bloc, { everybody: true, week: ctx?.week?.num || 0, how: 'blowup' });
    bloc.members.forEach(m => {
      api.suspicion(angry, m, 1.2);
      api.addBond(angry, m, -1.2);
      _others(house, ...bloc.members).forEach(w => api.suspicion(w, m, 0.6));
    });
    api.popDelta(angry, pStats(angry).boldness >= 7 ? 2 : -1);
    return { scene, players: [angry, ...bloc.members.slice(0, 2)],
      badgeText: 'SAID OUT LOUD', badgeClass: 'red' };
  },
};

export const BLOC_EVENTS = [
  blocNoticed, blocVoteTell, blocTargetPicked, blocRecruit, blocTold, blocBlowup,
];
