// ══════════════════════════════════════════════════════════════════════
// bb-events/alliance-life.js — what it costs to be in a group
// ══════════════════════════════════════════════════════════════════════
//
// blocs.js is about a group being SEEN from outside. This file is the other
// side of the same wall: what happens inside one once it has more than two
// people in it and a name somebody made up in the storage room.
//
// The failure it exists to fix is that an alliance in this house was a static
// membership list. It got formed, it voted, it dissolved, and in between it had
// no interior — no missed meeting, no inner two, no member who quietly will not
// promise their vote. Every real alliance dies of one of those long before it
// dies of an eviction.
//
// The arc these follow is the arc a five-person group actually runs:
//
//   somebody is not in the room       — and finds out a decision was made
//   two of them are always in it      — the inner circle the others hear about
//   somebody is in two of these       — and the stories do not match
//   somebody will not promise a vote  — the first crack that is said out loud
//   somebody is protecting a name     — for a reason they will not give
//   the vote comes back wrong         — and the group blames the wrong person
//   an outsider says the name         — and it is not a secret any more
//
// Everything reads gs.namedAlliances and leaves suspicion, memory and bond
// movement behind it, because a group that never costs anybody anything is not
// a group, it is a spreadsheet.

import { gs } from '../core.js';
import {
  pStats, bond, perceived, band, spotlightOrder, beatsInvolving, targetOf,
} from './_read.js';
import { makeScene } from '../bb/script/scene.js';

// ── helpers ───────────────────────────────────────────────────────────

/**
 * Which room a scene happens in: by hash, never a die. `people` are the ones
 * in it; the HOH room needs the HOH (the house's own rule, house-events
 * _roomAllows, which a scene's own room skips).
 */
function _room(rooms, ctx, ...people) {
  const ok = rooms.filter(r => r !== 'hoh-room' || (ctx?.hoh && people.includes(ctx.hoh)));
  const pool = ok.length ? ok : ['backyard'];
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${people.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return pool[hash % pool.length];
}

const _quiet = pool => spotlightOrder(pool);

/**
 * House life, not ceremony.
 *
 * The two ceremonies take one to three beats between them and the events
 * written FOR those moments are the point of watching. A conversation about who
 * was in the room when the group talked can happen any of the other days.
 */
const _fit = ctx => {
  if (ctx?.act === 'nominations' || ctx?.act === 'veto-ceremony') return 0;
  if (ctx?.act === 'eviction') return 0.25;
  if (ctx?.act === 'campaign') return 0.8;
  return 1;
};

/** Live alliances, counted only by the members still in the house. */
function _alliances(house, minSize = 3) {
  return (gs.namedAlliances || [])
    .filter(al => al && al.active !== false && !al.dissolved && al.name)
    .map(al => ({ al, members: (al.members || []).filter(n => house.includes(n)) }))
    .filter(entry => entry.members.length >= minSize);
}

/** The group that has had the least of the season, so one alliance does not carry it. */
function _alliance(house, minSize = 3) {
  const all = _alliances(house, minSize);
  if (!all.length) return null;
  return [...all].sort((x, y) => {
    const sx = x.members.reduce((s, n) => s + beatsInvolving(n), 0) / x.members.length;
    const sy = y.members.reduce((s, n) => s + beatsInvolving(n), 0) / y.members.length;
    return sx - sy || (x.al.name < y.al.name ? -1 : 1);
  })[0];
}

/** Highest of a stat, with a stable tie-break so the same week replays the same. */
const _topBy = (names, score) =>
  [...names].sort((a, b) => score(b) - score(a) || (a < b ? -1 : 1))[0] || null;
const _bottomBy = (names, score) =>
  [...names].sort((a, b) => score(a) - score(b) || (a < b ? -1 : 1))[0] || null;

/** Whoever behaves like the organiser: the one who calls the meetings. */
const _organiser = members => _topBy(members, n => pStats(n).strategic + pStats(n).social * 0.3);

/** How loyal this member LOOKS to the rest of the group, which is not how loyal they are. */
const _looksLoyal = (name, members) => {
  const rest = members.filter(m => m !== name);
  if (!rest.length) return 0;
  return rest.reduce((sum, m) => sum + perceived(name, m), 0) / rest.length;
};

// ── somebody was not in the room ──────────────────────────────────────

function _missedCast(house, ctx) {
  const entry = _alliance(house, 3);
  if (!entry) return null;
  const organiser = _organiser(entry.members);
  const absent = _quiet(entry.members.filter(n => n !== organiser))[0];
  if (!organiser || !absent) return null;
  return { ...entry, organiser, absent };
}

const missedMeeting = {
  id: 'alliance-missed-meeting',
  category: 'deals',
  location: 'bedroom',
  weight(house, ctx) {
    const cast = _missedCast(house, ctx);
    if (!cast) return 0;
    // Bigger groups miss people more often — there are more rooms to be in.
    return band((4.5 + cast.members.length * 0.9) * _fit(ctx));
  },
  fire(house, ctx, api) {
    const { al, members, organiser, absent } = _missedCast(house, ctx);
    const rest = members.filter(n => n !== absent);
    const decision = targetOf(organiser) || ctx?.week?.plan?.target || null;

    api.addBond(absent, organiser, -0.9);
    api.suspicion(absent, organiser, 1.0);
    api.remember(absent, organiser, 'decided-without-me', 2, { about: al.name });
    rest.filter(n => n !== organiser).forEach(n => api.suspicion(absent, n, 0.3));
    const scene = makeScene('alliance.missed', { a: organiser, b: absent }, { ending: 'left-out', alliance: al.name, target: decision || null },
      members, 'bedroom');
    return { scene, players: [...members],
      badgeText: 'NOT IN THE ROOM', badgeClass: 'blue' };
  },
};

// ── two of them are always in the room ────────────────────────────────

function _innerCast(house, ctx) {
  const entry = _alliance(house, 4);
  if (!entry) return null;
  const { members } = entry;
  // The tightest real pair inside the group. Real bond, not perceived — the
  // whole problem is that the periphery is guessing.
  let best = null;
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const value = bond(members[i], members[j]);
      if (!best || value > best.value) best = { a: members[i], b: members[j], value };
    }
  }
  if (!best) return null;
  const outside = members.filter(n => n !== best.a && n !== best.b);
  const periph = _bottomBy(outside, n => bond(n, best.a) + bond(n, best.b));
  return periph ? { ...entry, ...best, periph } : null;
}

const innerCircle = {
  // Not 'alliance-inner-circle' — the alliance lifecycle in bb/week.js already
  // emits a hardcoded beat under that id, and two beats sharing an id makes the
  // history unreadable and this event impossible to prove reachable.
  id: 'alliance-inner-two',
  category: 'deals',
  location: 'hoh-room',
  weight(house, ctx) {
    const cast = _innerCast(house, ctx);
    if (!cast) return 0;
    // The tighter the two are, the more obvious the layer underneath.
    return band((4 + Math.max(0, cast.value) * 0.55) * _fit(ctx));
  },
  fire(house, ctx, api) {
    const { al, members, a, b, periph } = _innerCast(house, ctx);
    const call = targetOf(a) || targetOf(b) || ctx?.week?.plan?.target || null;

    api.suspicion(periph, a, 0.8);
    api.suspicion(periph, b, 0.8);
    api.addBond(periph, a, -0.5);
    api.remember(periph, a, 'an-alliance-inside-the-alliance', 2, { about: al.name, with: b });
    const scene = makeScene('alliance.inner', { a, b, c: periph }, { ending: 'two', alliance: al.name, target: call || null }, [],
      _room(['kitchen', 'backyard', 'bedroom'], ctx, a, b, periph));
    return { scene, players: [periph, a, b], badgeText: 'THE REAL TWO', badgeClass: 'blue' };
  },
};

// ── the same plan, told two different ways ────────────────────────────

function _overlapCast(house, ctx) {
  const live = (gs.namedAlliances || [])
    .filter(al => al && al.active !== false && !al.dissolved && al.name)
    .map(al => ({ al, members: (al.members || []).filter(n => house.includes(n)) }))
    .filter(e => e.members.length >= 2);
  for (const name of _quiet(house)) {
    const mine = live.filter(e => e.members.includes(name));
    if (mine.length < 2) continue;
    const [first, second] = mine;
    const orgA = _organiser(first.members.filter(n => n !== name));
    const orgB = _organiser(second.members.filter(n => n !== name));
    if (!orgA || !orgB || orgA === orgB) continue;
    // Whichever room describes the plan in a way that leaves them lower down it.
    const worse = bond(orgA, name) <= bond(orgB, name) ? orgA : orgB;
    return { name, first, second, orgA, orgB, worse };
  }
  return null;
}

const comparesNotes = {
  id: 'alliance-overlap-compares-notes',
  category: 'deals',
  location: 'storage',
  weight(house, ctx) {
    if (house.length < 5) return 0;
    return _overlapCast(house, ctx) ? band(6 * _fit(ctx)) : 0;
  },
  fire(house, ctx, api) {
    const { name, first, second, orgA, orgB, worse } = _overlapCast(house, ctx);
    const target = ctx?.week?.plan?.target || targetOf(orgA) || targetOf(orgB) || null;

    api.suspicion(name, worse, 1.0);
    api.remember(name, worse, 'two-versions-of-the-same-plan', 2,
      { about: `${first.al.name} and ${second.al.name}` });
    api.addBond(name, worse, -0.5);
    const scene = makeScene('alliance.overlap', { a: name, b: orgA, c: orgB },
      { ending: 'differ', alliance: first.al.name, alliance2: second.al.name, target: target || null }, [],
      _room(['pantry', 'backyard', 'bedroom'], ctx, name, orgA, orgB));
    return { scene, players: [name, orgA, orgB], badgeText: 'THE STORIES DIFFER', badgeClass: 'blue' };
  },
};

// ── the vote nobody will promise ──────────────────────────────────────

function _holdoutCast(house, ctx) {
  const entry = _alliance(house, 3);
  if (!entry) return null;
  const holdout = _bottomBy(entry.members, n => pStats(n).loyalty - pStats(n).strategic * 0.2);
  const organiser = _organiser(entry.members.filter(n => n !== holdout));
  if (!holdout || !organiser) return null;
  return { ...entry, holdout, organiser };
}

const unauthorizedVote = {
  id: 'alliance-unauthorized-vote-fear',
  category: 'deals',
  location: 'living-room',
  weight(house, ctx) {
    // The week's business, not the quiet days. Nobody refuses to promise a
    // ballot on a Saturday; they do it when somebody asks for it.
    const live = ctx?.act === 'campaign' || ctx?.act === 'eviction'
      || (ctx?.act === 'house' && ctx?.phase === 'post-veto')
      || (ctx?.act === 'veto' && (ctx?.week?.finalNominees || []).length);
    if (!live) return 0;
    const cast = _holdoutCast(house, ctx);
    if (!cast) return 0;
    return band((5 + (10 - pStats(cast.holdout).loyalty) * 0.4) * _fit(ctx));
  },
  fire(house, ctx, api) {
    const { al, members, holdout, organiser } = _holdoutCast(house, ctx);
    const rest = members.filter(n => n !== holdout);
    const noms = ((ctx?.nominees && ctx.nominees.length ? ctx.nominees
      : (ctx?.week?.finalNominees || [])) || []).filter(Boolean);

    rest.forEach(n => {
      api.suspicion(n, holdout, 0.9);
      api.addBond(n, holdout, -0.45);
    });
    api.remember(organiser, holdout, 'would-not-promise-the-vote', 2, { about: al.name });
    const scene = makeScene('alliance.holdout', { a: holdout, b: organiser }, { ending: 'refuses', alliance: al.name, target: noms[0] || null },
      members, _room(['living-room', 'bedroom'], ctx, holdout, organiser));
    return { scene, players: [...members],
      badgeText: 'WILL NOT SAY IT', badgeClass: 'red' };
  },
};

// ── protecting a name for reasons nobody is given ─────────────────────

function _protectCast(house, ctx) {
  const entry = _alliance(house, 3);
  if (!entry) return null;
  const deals = (gs.sideDeals || []).filter(d => d && d.active !== false && d.genuine !== false
    && Array.isArray(d.players) && d.players.length === 2);
  for (const member of _quiet(entry.members)) {
    const deal = deals.find(d => d.players.includes(member)
      && d.players.some(n => n !== member && house.includes(n) && !entry.members.includes(n)));
    if (!deal) continue;
    const partner = deal.players.find(n => n !== member);
    const sharp = _topBy(entry.members.filter(n => n !== member), n => pStats(n).intuition);
    if (!partner || !sharp) continue;
    return { ...entry, member, partner, deal, sharp };
  }
  return null;
}

const sideDealProtected = {
  id: 'alliance-side-deal-protected',
  category: 'deals',
  location: 'backyard',
  weight(house, ctx) {
    const cast = _protectCast(house, ctx);
    if (!cast) return 0;
    return band(5.5 * _fit(ctx));
  },
  fire(house, ctx, api, rng) {
    const { al, member, partner, deal, sharp } = _protectCast(house, ctx);

    const caught = (rng ? rng() : 0.5) < pStats(sharp).intuition / 12;
    api.remember(member, partner, 'protected-them-quietly', 1, { about: al.name });
    api.suspicion(sharp, member, caught ? 1.2 : 0.35);
    if (caught) api.remember(sharp, member, 'is-protecting-somebody', 2, { about: partner });
    // The partner is talked about; the member and the sharp one are in the room.
    const scene = makeScene('alliance.protect', { a: member, b: partner, c: sharp }, { ending: caught ? 'caught' : 'steered', alliance: al.name }, [],
      _room(['backyard', 'bedroom', 'kitchen'], ctx, member, sharp));
    scene.seenBy = [member, sharp];
    return { scene, players: [member, partner, sharp],
      badgeText: caught ? 'SOMEBODY IS WATCHING' : 'QUIETLY STEERED',
      badgeClass: caught ? 'red' : 'grey' };
  },
};

// ── the vote came back wrong and somebody has to have done it ─────────

/** The most recent completed vote that was not unanimous. */
function _lastSplit(ctx) {
  const weeks = gs.bb?.weeks || [];
  const currentWeek = ctx?.week?.num || 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    const w = weeks[i];
    // This is fallout from the last eviction, not a cold case the alliance
    // reopens whenever the scheduler needs a beat.
    if (currentWeek && Number.isFinite(w?.num) && w.num !== currentWeek - 1) continue;
    const ballots = Array.isArray(w?.ballots) ? w.ballots
      : Array.isArray(w?.votes) ? w.votes : [];
    if (ballots.length < 3) continue;
    const tally = {};
    for (const b of ballots) {
      const name = b?.evict || b?.voted || b?.vote || b?.target;
      if (name) tally[name] = (tally[name] || 0) + 1;
    }
    const names = Object.keys(tally);
    if (names.length < 2) continue;
    const majority = _topBy(names, n => tally[n]);
    const strayBallots = ballots.filter(b =>
      (b?.evict || b?.voted || b?.vote || b?.target) !== majority);
    const strayVoters = strayBallots.map(b => b?.voter || b?.by || b?.player).filter(Boolean);
    const key = `${w?.num ?? i}|${w?.evicted || majority}`;
    if (gs.bb?.allianceWrongBlameSeen === key) return null;
    return { week: w, evicted: w.evicted || majority, strays: strayBallots.length,
      strayVoters, key };
  }
  return null;
}

function _blameCast(house, ctx) {
  const split = _lastSplit(ctx);
  if (!split) return null;
  const entry = _alliance(house, 3);
  if (!entry) return null;
  // Who the group DECIDES it was: the member who looks least loyal, which is
  // a completely different question from who actually did it.
  // The title promises that the group gets it wrong. Ballots sometimes expose
  // voter names, so exclude anybody who actually cast a stray vote. If the
  // record cannot establish an innocent suspect, do not invent innocence.
  if (!split.strayVoters.length) return null;
  // The alliance is only short if one of ITS OWN ballots went the other way.
  // A stray from outside the group leaves every member's vote where it was
  // promised, and "four votes in the same direction and one went the other
  // way" was printed over four votes that all went the same way.
  const ownStrays = split.strayVoters.filter(v => entry.members.includes(v));
  if (!ownStrays.length) return null;
  const innocent = entry.members.filter(n => !split.strayVoters.includes(n));
  const blamed = _bottomBy(innocent, n => _looksLoyal(n, entry.members));
  const accuser = _organiser(entry.members.filter(n => n !== blamed));
  if (!blamed || !accuser) return null;
  return { ...entry, ...split, strays: ownStrays.length, blamed, accuser };
}

const wrongBlame = {
  id: 'alliance-wrong-blame',
  category: 'deals',
  location: 'bedroom',
  weight(house, ctx) {
    const cast = _blameCast(house, ctx);
    if (!cast) return 0;
    return band((5 + cast.strays * 1.2) * _fit(ctx));
  },
  fire(house, ctx, api) {
    const { al, members, blamed, accuser, evicted, strays, key } = _blameCast(house, ctx);
    const rest = members.filter(n => n !== blamed);

    rest.forEach(n => {
      api.addBond(n, blamed, -0.8);
      api.suspicion(n, blamed, 1.0);
    });
    api.remember(blamed, accuser, 'blamed-me-for-a-vote-i-did-not-cast', 3, { about: al.name });
    api.addBond(blamed, accuser, -0.7);
    gs.bb ||= {};
    gs.bb.allianceWrongBlameSeen = key;
    const scene = makeScene('alliance.blame', { a: accuser, b: blamed }, { ending: 'wrong', alliance: al.name }, members, 'bedroom');
    return { scene, players: [...members],
      badgeText: 'SOMEBODY HAS TO HAVE DONE IT', badgeClass: 'red' };
  },
};

// ── an outsider says the name ─────────────────────────────────────────

function _slipCast(house, ctx) {
  const entry = _alliance(house, 3);
  if (!entry) return null;
  const outsiders = house.filter(n => !entry.members.includes(n));
  if (!outsiders.length) return null;
  // Somebody who has actually been paying attention, or failing that anybody.
  const talker = _quiet(outsiders).sort((a, b) =>
    (pStats(b).intuition + pStats(b).social) - (pStats(a).intuition + pStats(a).social)
    || (a < b ? -1 : 1))[0] || outsiders[0];
  const heard = _quiet(entry.members)[0];
  return { ...entry, talker, heard };
}

const nameSlips = {
  id: 'alliance-name-slips',
  category: 'social',
  location: 'kitchen',
  weight(house, ctx) {
    if (house.length < 5) return 0;
    const cast = _slipCast(house, ctx);
    if (!cast) return 0;
    // A name is only findable once it has been used for a while.
    const age = Math.min(4, (ctx?.week?.num || 0) - (cast.al.formed || 0));
    if (age < 1) return 0;
    return band((3.5 + age * 1.1) * _fit(ctx));
  },
  fire(house, ctx, api) {
    const { al, members, talker, heard } = _slipCast(house, ctx);
    const others = members.filter(n => n !== heard);

    members.forEach(m => {
      api.suspicion(m, talker, 0.9);
      api.suspicion(talker, m, 0.5);
    });
    api.remember(heard, talker, 'knows-what-we-are-called', 2, { about: al.name });
    api.addBond(heard, talker, -0.4);
    const scene = makeScene('alliance.slip', { a: talker, b: heard }, { ending: 'name', alliance: al.name }, members, 'kitchen');
    return { scene, players: [talker, ...members].filter((n, i, a) => n && a.indexOf(n) === i),
      badgeText: 'THEY KNOW THE NAME', badgeClass: 'red' };
  },
};

export const ALLIANCE_LIFE_EVENTS = [
  missedMeeting, innerCircle, comparesNotes, unauthorizedVote,
  sideDealProtected, wrongBlame, nameSlips,
];

export default ALLIANCE_LIFE_EVENTS;
