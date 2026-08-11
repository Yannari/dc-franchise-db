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
import { pronouns } from '../players.js';
import {
  pStats, bond, perceived, band, spotlightOrder, beatsInvolving, targetOf,
} from './_read.js';

// ── helpers ───────────────────────────────────────────────────────────

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}

const _quiet = pool => spotlightOrder(pool);
const _list = names => (names.length <= 1 ? (names[0] || '')
  : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

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
    const p = pronouns(absent);
    const rest = members.filter(n => n !== absent);
    const decision = targetOf(organiser) || ctx?.week?.plan?.target || null;

    const text = _variant([
      `${absent} was in the shower. By the time ${p.sub} ${p.sub === 'they' ? 'come' : 'comes'} back out, ${_list(rest)} have already agreed on ${decision ? `${decision}` : 'a name'} and moved on to talking about breakfast.`,
      `“We were going to fill you in.” ${organiser} says it easily, which is the part ${absent} keeps turning over: not that the meeting happened without ${p.obj}, but that nobody thought it needed explaining.`,
      `${absent} finds out about it sideways — ${rest[1] || rest[0]} refers to something that was decided, then stops. There are ${members.length} people in <strong>${al.name}</strong> and ${members.length - 1} of them were in that room.`,
      `${absent} counts the chairs afterwards. ${_list(rest)} were all in the storage room for twenty minutes and ${p.sub} ${p.sub === 'they' ? 'were' : 'was'} outside, in a hammock, being told nothing.`,
      `${organiser} presents it as a plan the group made. ${absent} does not remember making it, does not say so, and starts paying attention to who leaves a room first.`,
      `“It wasn't a meeting,” ${organiser} says. ${absent} points out that ${members.length - 1} of ${members.length} is not a coincidence, and ${organiser} changes the subject to the veto.`,
    ], ctx, this.id, absent, organiser);

    // Being left out is not a betrayal, which is why it works — nobody can be
    // accused of anything, and the person it happened to never forgets it.
    api.addBond(absent, organiser, -0.9);
    api.suspicion(absent, organiser, 1.0);
    api.remember(absent, organiser, 'decided-without-me', 2, { about: al.name });
    rest.filter(n => n !== organiser).forEach(n => api.suspicion(absent, n, 0.3));
    return { text, players: [...members],
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
    const p = pronouns(periph);
    const call = targetOf(a) || targetOf(b) || ctx?.week?.plan?.target || null;

    const text = _variant([
      `${a} and ${b} settle it upstairs before anybody else is awake. ${periph} hears about ${call ? `${call}` : 'the decision'} at lunch, from ${a}, phrased as something <strong>${al.name}</strong> decided together.`,
      `There is an alliance, and then there is the two people inside it who never have to explain themselves to each other. ${periph} has worked out which one ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} in.`,
      `${periph} asks when the group agreed on this. ${b} says “last night,” and does not offer a location, and ${periph} does not ask for one.`,
      `${a} and ${b} come down the stairs looking finished. Whatever ${_list(members.filter(n => n !== a && n !== b))} contribute after that is a comment on a decision, not a vote in one.`,
      `${periph} is not being cut out of <strong>${al.name}</strong>. ${p.Sub} ${p.sub === 'they' ? 'are' : 'is'} simply never one of the first two people told.`,
      `“We just talked it through so it'd be quicker.” ${a} means it kindly. ${periph} hears an alliance with a smaller alliance living inside it.`,
    ], ctx, this.id, periph, a);

    api.suspicion(periph, a, 0.8);
    api.suspicion(periph, b, 0.8);
    api.addBond(periph, a, -0.5);
    api.remember(periph, a, 'an-alliance-inside-the-alliance', 2, { about: al.name, with: b });
    return { text, players: [periph, a, b], badgeText: 'THE REAL TWO', badgeClass: 'blue' };
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
    const p = pronouns(name);
    const target = ctx?.week?.plan?.target || targetOf(orgA) || targetOf(orgB) || null;

    const text = _variant([
      `${orgA} explains the week to ${name} in the pantry. Forty minutes later ${orgB} explains the same week in the backyard, and the two versions agree on everything except who is standing behind whom.`,
      `${name} is in <strong>${first.al.name}</strong> and <strong>${second.al.name}</strong> and has just discovered that ${target ? `${target} going` : 'this vote'} means two entirely different things depending on which room ${p.sub} ${p.sub === 'they' ? 'hear' : 'hears'} it in.`,
      `Both stories are true. That is the problem. ${orgA} tells ${name} the plan protects the group; ${orgB} tells ${name} the plan protects the group; neither of them uses the same list of people.`,
      `${name} nods along with ${orgB}, waits until ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} alone, and starts putting the two conversations side by side. One of them has ${p.obj} at the bottom of it.`,
      `“Same page?” ${orgA} asks. ${name} says yes. ${p.Sub} ${p.sub === 'they' ? 'have' : 'has'} been on two pages since both groups formed, and this is the first time those pages have contradicted each other out loud.`,
      `${name} makes the mistake of repeating a detail from <strong>${second.al.name}</strong> to ${orgA}, catches it half a sentence in, and covers it with a question about slop.`,
    ], ctx, this.id, name, orgA);

    api.suspicion(name, worse, 1.0);
    api.remember(name, worse, 'two-versions-of-the-same-plan', 2,
      { about: `${first.al.name} and ${second.al.name}` });
    api.addBond(name, worse, -0.5);
    return { text, players: [name, orgA, orgB], badgeText: 'THE STORIES DIFFER', badgeClass: 'blue' };
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
    const p = pronouns(holdout);
    const rest = members.filter(n => n !== holdout);
    const noms = ((ctx?.nominees && ctx.nominees.length ? ctx.nominees
      : (ctx?.week?.finalNominees || [])) || []).filter(Boolean);

    const text = _variant([
      `${organiser} goes round the room asking everybody to say the name out loud. ${holdout} says, “I'll vote with the house,” which is not a name, and the room notices that it is not a name.`,
      `“I'm not locking anything in before the vote.” ${holdout} says it pleasantly, in front of ${_list(rest)}, and the temperature in the room drops about four degrees.`,
      `${organiser} wants ${members.length} votes counted before the campaigning starts. ${holdout} gives ${p.posAdj} word on everything except the ballot, and repeats it twice when asked.`,
      `${holdout} points out, correctly, that nobody in <strong>${al.name}</strong> has ever had to promise a vote in writing. ${organiser} points out that nobody has ever refused to give one either.`,
      `Somebody asks ${holdout} directly whether ${noms[0] || 'the target'} is the vote. ${p.Sub} ${p.sub === 'they' ? 'say' : 'says'}, “Probably,” and there is no version of that word the rest of them like.`,
      `${holdout} explains that ${p.sub} ${p.sub === 'they' ? 'want' : 'wants'} to hear both nominees out first. It is the most reasonable sentence anybody has said all day and every person in <strong>${al.name}</strong> leaves the room worried.`,
    ], ctx, this.id, holdout, organiser);

    rest.forEach(n => {
      api.suspicion(n, holdout, 0.9);
      api.addBond(n, holdout, -0.45);
    });
    api.remember(organiser, holdout, 'would-not-promise-the-vote', 2, { about: al.name });
    return { text, players: [...members],
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
    const p = pronouns(member);
    const kind = deal.tier === 'final-two' ? 'a final two'
      : deal.tier === 'final-three' ? 'a final three' : 'an arrangement';

    const text = _variant([
      `${partner}'s name comes up and ${member} finds three reasons it should not. All three are good reasons. None of them is the reason.`,
      `“${partner} is useless to everybody, that's exactly why we keep ${pronouns(partner).obj} around.” ${member} reaches for the argument before anybody has finished suggesting the name. ${sharp} notices how ready it was.`,
      `${member} steers <strong>${al.name}</strong> off ${partner} the way somebody steers a car off a kerb — smoothly, and without mentioning the kerb.`,
      `Somebody suggests ${partner} as the backup plan. ${member} agrees enthusiastically, then spends the next ten minutes on a better backup plan, and then a better one than that.`,
      `${member} shook on ${kind} with ${partner} and has told nobody in <strong>${al.name}</strong>. What the group sees is a member who is unusually careful about one specific name.`,
      `${sharp} notices that ${member} never argues against ${partner} — ${p.sub} just always ${p.sub === 'they' ? 'have' : 'has'} somebody better. It is a small thing. ${sharp} keeps it anyway.`,
    ], ctx, this.id, member, partner);

    // Whether the sharpest person in the room catches it is a read, not a
    // certainty — proportional to how good they actually are at this.
    const caught = (rng ? rng() : 0.5) < pStats(sharp).intuition / 12;
    api.remember(member, partner, 'protected-them-quietly', 1, { about: al.name });
    api.suspicion(sharp, member, caught ? 1.2 : 0.35);
    if (caught) api.remember(sharp, member, 'is-protecting-somebody', 2, { about: partner });
    return { text, players: [member, partner, sharp],
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
  const innocent = entry.members.filter(n => !split.strayVoters.includes(n));
  const blamed = _bottomBy(innocent, n => _looksLoyal(n, entry.members));
  const accuser = _organiser(entry.members.filter(n => n !== blamed));
  if (!blamed || !accuser) return null;
  return { ...entry, ...split, blamed, accuser };
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
    const p = pronouns(blamed);
    const rest = members.filter(n => n !== blamed);
    const count = strays === 1 ? 'one vote' : `${strays} votes`;

    const text = _variant([
      `<strong>${al.name}</strong> was supposed to be ${members.length} votes in the same direction and ${count} went the other way. By the time the bedroom lights go off, ${_list(rest)} have decided it was ${blamed}.`,
      `Nobody has any evidence. ${accuser} has something better than evidence — a feeling ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} had about ${blamed} since ${evicted} was nominated, and a room willing to agree with it.`,
      `“It wasn't me.” ${blamed} says it once, calmly, which ${accuser} treats as suspicious, and then a second time, less calmly, which ${accuser} treats as confirmation.`,
      `The alliance compares every promised vote with the result and finds ${count} that cannot be explained. Suspicion settles on the member whose commitment was never firm.`,
      `${accuser} does not accuse ${blamed}. ${accuser} simply stops finishing sentences when ${blamed} walks in, and before the next competition everybody in <strong>${al.name}</strong> is doing the same thing.`,
      `${blamed} did not do it. ${p.Sub} ${p.sub === 'they' ? 'spend' : 'spends'} the evening being told, kindly, that nobody is angry — which is how ${p.sub} ${p.sub === 'they' ? 'find' : 'finds'} out ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} already been convicted.`,
    ], ctx, this.id, blamed, accuser);

    rest.forEach(n => {
      api.addBond(n, blamed, -0.8);
      api.suspicion(n, blamed, 1.0);
    });
    api.remember(blamed, accuser, 'blamed-me-for-a-vote-i-did-not-cast', 3, { about: al.name });
    api.addBond(blamed, accuser, -0.7);
    gs.bb ||= {};
    gs.bb.allianceWrongBlameSeen = key;
    return { text, players: [...members],
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
    const p = pronouns(heard);
    const others = members.filter(n => n !== heard);

    const text = _variant([
      `${talker} says it in the middle of a sentence about washing up. “—well, that's <strong>${al.name}</strong>, isn't it.” ${heard} keeps drying the same plate for considerably longer than the plate needs.`,
      `Nobody outside the group was supposed to know there WAS a name. ${talker} uses it like a word everybody has, and ${heard} watches ${others[0] || 'the room'} go very still.`,
      `“What do you call yourselves?” ${talker} asks, not unkindly, and answers it before ${heard} can. It is the right answer.`,
      `${talker} makes a joke about <strong>${al.name}</strong> having a meeting. Half the kitchen laughs. The half that laughs is entirely made up of people who are not in it.`,
      `${heard} has spent ${(ctx?.week?.num || 0) > 3 ? 'weeks' : 'days'} making sure the name never left the storage room. ${talker} says it out loud at the table, casually, twice, and then asks somebody to pass the salt.`,
      `${talker} does not know what ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} just done. ${heard} does. So does every other member of <strong>${al.name}</strong> in the room, and none of them can react without confirming it.`,
    ], ctx, this.id, talker, heard);

    // The wall is down in both directions: they know they are visible, and the
    // outsider is now somebody who knows too much.
    members.forEach(m => {
      api.suspicion(m, talker, 0.9);
      api.suspicion(talker, m, 0.5);
    });
    api.remember(heard, talker, 'knows-what-we-are-called', 2, { about: al.name });
    api.addBond(heard, talker, -0.4);
    return { text, players: [talker, ...members].filter((n, i, a) => n && a.indexOf(n) === i),
      badgeText: 'THEY KNOW THE NAME', badgeClass: 'red' };
  },
};

export const ALLIANCE_LIFE_EVENTS = [
  missedMeeting, innerCircle, comparesNotes, unauthorizedVote,
  sideDealProtected, wrongBlame, nameSlips,
];

export default ALLIANCE_LIFE_EVENTS;
