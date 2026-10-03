// ══════════════════════════════════════════════════════════════════════
// bb-events/reign.js — the week the power goes to somebody's head
// ══════════════════════════════════════════════════════════════════════
//
// HOHitis, and the quieter failure on the other side of it.
//
// These are the scenes that MAKE a reign bad rather than commentary on one
// that already is. Each one is available only to a Head of Household whose
// temperament points that way — a nervous houseguest does not call a house
// meeting, a swaggering one does not ask the house who to nominate — and each
// one records the enemies it makes, which is what the reign is scored on when
// the week ends.
//
// The house meeting is the canonical version and it is drawn from the canonical
// example: stand everybody in one room, tell them this is not a dictatorship,
// then ask your own alliance which of them wants your target to stay. Somebody
// answers honestly. It is not that the answer is bad — it is that the question
// was asked in front of eleven people, and now they have all watched the
// alliance disagree with itself.

import { gs } from '../core.js';
import {
  pStats, bond, perceived, band, closestTo, furthestFrom, beatsInvolving, spotlightOrder,
  alliancesOf, archetype, targetOf,
} from './_read.js';
import { reignTemperament, reignMadeAnEnemy } from '../bb/reign.js';
import { makeScene } from '../bb/script/scene.js';
import { writeMeeting } from '../bb/script/meeting.js';

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
/** Least-seen first, weighted toward whoever this week is about. */
const _quiet = pool => spotlightOrder(pool);
const _list = names => (names.length <= 1 ? (names[0] || 'nobody')
  : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

/** The days between winning and the ceremony, when the damage gets done. */
/** Which room a scene happens in: by hash, never a die; the HOH room needs the HOH. */
function _room(rooms, ctx, ...people) {
  const ok = rooms.filter(r => r !== 'hoh-room' || (ctx?.hoh && people.includes(ctx.hoh)));
  const pool = ok.length ? ok : ['living-room'];
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${people.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return pool[hash % pool.length];
}

const _reigning = (ctx, value) => {
  const window = ctx?.phase === 'post-hoh' || ctx?.phase === 'post-noms'
    || ctx?.act === 'house' || ctx?.act === 'veto';
  return window && ctx?.hoh ? band(value) : 0;
};

/** Whoever is on the block, wherever the act happens to keep it. */
const _noms = ctx => ((ctx?.nominees && ctx.nominees.length ? ctx.nominees
  : (ctx?.week?.finalNominees || ctx?.week?.initialNominees || [])) || []).filter(Boolean);

/** Once per reign — a house meeting is not a thing you do twice. */
const _spent = (id, ctx) => !!ctx?.week?._reignFired?.[id];
const _spend = (id, ctx) => { if (ctx?.week) (ctx.week._reignFired ||= {})[id] = true; };

// ── the power goes to their head ──────────────────────────────────────

const houseMeeting = {
  id: 'reign-house-meeting',
  category: 'house-life',
  location: 'living-room',
  weight(house, ctx) {
    const hoh = ctx?.hoh;
    if (!hoh || house.length < 6 || _spent('reign-house-meeting', ctx)) return 0;
    const { ego, mode } = reignTemperament(hoh);
    return mode === 'hohitis' ? _reigning(ctx, 4.5 * ego) : 0;
  },
  fire(house, ctx, api) {
    const hoh = ctx.hoh;
    _spend(this.id, ctx);
    const room = _others(house, hoh);
    // Somebody says the quiet part in front of everybody, which is the entire
    // mechanism: the meeting does not fail because of the answer, it fails
    // because the question was asked in public.
    const honest = _quiet(room).find(n => pStats(n).boldness >= 6) || room[0];

    room.forEach(n => {
      api.addBond(hoh, n, -0.9);
      api.suspicion(n, hoh, 1.1);
      reignMadeAnEnemy(ctx.week, n);
    });
    // The room bonds over it, which is the part that actually ends people.
    room.forEach((a, i) => { const b = room[i + 1]; if (b) api.addBond(a, b, 0.5); });
    api.remember(honest, hoh, 'made-me-say-it-out-loud', 2, {});
    api.popDelta(hoh, -3);
    const written = writeMeeting({ caller: hoh, about: honest, witness: room.find(n => n !== honest) || null,
      outcome: 'backfires', cause: 'power' }, ctx);
    return { text: written.text, players: [hoh, ...room], badgeText: 'HOUSE MEETING', badgeClass: 'red',
      lines: written.lines, lineId: written.lineId, location: 'living-room',
      // Same scene, same treatment on the screen.
      meeting: { caller: hoh, about: honest, outcome: 'backfires', cause: 'power', room: [...room],
        beats: written.beats } };
  },
};

const saysItOutLoud = {
  id: 'reign-announces-target',
  category: 'deals',
  weight(house, ctx) {
    const hoh = ctx?.hoh;
    if (!hoh || _spent('reign-announces-target', ctx)) return 0;
    const { ego, mode } = reignTemperament(hoh);
    return mode === 'hohitis' && targetOf(hoh) && ctx?.phase === 'post-hoh'
      ? _reigning(ctx, 6 * ego) : 0;
  },
  fire(house, ctx, api) {
    const hoh = ctx.hoh;
    _spend(this.id, ctx);
    const mark = targetOf(hoh) || furthestFrom(hoh, _others(house, hoh));
    const audience = _quiet(_others(house, hoh, mark)).slice(0, 2);
    const scene = makeScene('reign.announce', { a: hoh, b: mark, c: audience[0] || null }, { ending: 'scene' }, [],
      _room(['kitchen', 'living-room', 'backyard', 'bedroom'], ctx, hoh, mark));
    api.suspicion(mark, hoh, 2);
    api.setTarget(mark, hoh, `told the house I was going up before telling me`);
    api.addBond(mark, hoh, -1.4);
    reignMadeAnEnemy(ctx.week, mark);
    audience.forEach(n => api.remember(n, hoh, 'cannot-keep-quiet', 1, {}));
    return { scene, players: [hoh, mark, ...audience], badgeText: 'SAYS IT OUT LOUD', badgeClass: 'orange' };
  },
};

const testsTheAlliance = {
  id: 'reign-loyalty-test',
  category: 'deals',
  weight(house, ctx) {
    const hoh = ctx?.hoh;
    if (!hoh || _spent('reign-loyalty-test', ctx)) return 0;
    const { ego, mode } = reignTemperament(hoh);
    const activeAlliance = alliancesOf(hoh).find(a => (a?.members || []).some(n => n !== hoh && house.includes(n)));
    return mode === 'hohitis' && activeAlliance ? _reigning(ctx, 5 * ego) : 0;
  },
  fire(house, ctx, api) {
    const hoh = ctx.hoh;
    _spend(this.id, ctx);
    const alliance = alliancesOf(hoh).find(a => (a?.members || []).some(n => n !== hoh && house.includes(n)));
    const mates = ((alliance?.members) || []).filter(n => n !== hoh && house.includes(n));
    if (!mates.length) {
      return { scene: makeScene('reign.nobody', { a: hoh }, { ending: 'scene' }, [], 'diary-room'),
        location: 'diary-room', players: [hoh], badgeText: 'NOBODY TO ASK', badgeClass: 'grey' };
    }
    const doubter = _quiet(mates).find(n => bond(n, hoh) < 4) || mates[0];

    const scene = makeScene('reign.test', { a: hoh, b: doubter }, { ending: 'scene', alliance: alliance?.name || 'this alliance' },
      mates, _room(['hoh-room', 'bedroom'], ctx, hoh));
    mates.forEach(n => {
      api.addBond(hoh, n, -0.7);
      api.remember(n, hoh, 'made-me-prove-it', 1, {});
    });
    api.suspicion(hoh, doubter, 1.3);
    api.suspicion(doubter, hoh, 1);
    reignMadeAnEnemy(ctx.week, doubter);
    return { scene, players: [hoh, ...mates], badgeText: 'LOYALTY TEST', badgeClass: 'orange' };
  },
};

// ── or they are too frightened to use it ──────────────────────────────

const letsTheHouseDecide = {
  id: 'reign-house-decides',
  category: 'deals',
  weight(house, ctx) {
    const hoh = ctx?.hoh;
    if (!hoh || _spent('reign-house-decides', ctx)) return 0;
    const { nerves, mode } = reignTemperament(hoh);
    return mode === 'frightened' && ctx?.phase === 'post-hoh' ? _reigning(ctx, 6 * nerves) : 0;
  },
  fire(house, ctx, api) {
    const hoh = ctx.hoh;
    _spend(this.id, ctx);
    const advisor = closestTo(hoh, _others(house, hoh)) || _others(house, hoh)[0];
    const scene = makeScene('reign.decides', { a: hoh, b: advisor }, { ending: 'scene' }, [],
      _room(['hoh-room', 'bedroom'], ctx, hoh));
    api.addBond(hoh, advisor, 0.4);
    api.remember(advisor, hoh, 'let-me-pick', 2, { about: 'their own nominations' });
    _others(house, hoh).forEach(n => api.suspicion(n, hoh, -0.3));
    api.popDelta(hoh, -1);
    return { scene, players: [hoh, advisor, ..._others(house, hoh, advisor)], badgeText: 'SOMEBODY ELSE DECIDES', badgeClass: 'grey' };
  },
};

const apologisesForIt = {
  id: 'reign-apologises',
  category: 'social',
  // No location. It needs the block to exist, which already narrows it to the
  // back half of the week; pinning it to the HOH room as well left it firing
  // once in ten seasons. Somebody who cannot stop apologising does it wherever
  // they find the person.
  weight(house, ctx) {
    const hoh = ctx?.hoh;
    if (!hoh || _spent('reign-apologises', ctx)) return 0;
    const { nerves, mode } = reignTemperament(hoh);
    // ctx.nominees is only populated in the acts built around the block, and
    // this scene belongs to the quiet days afterwards — so it falls back to the
    // week, which is where the nominations actually live. Without that it fired
    // once in ten seasons.
    const noms = _noms(ctx);
    return mode === 'frightened' && noms.length ? _reigning(ctx, 8 * nerves) : 0;
  },
  fire(house, ctx, api) {
    const hoh = ctx.hoh;
    _spend(this.id, ctx);
    const nom = _noms(ctx)[0];
    const scene = makeScene('reign.apology', { a: hoh, b: nom }, { ending: 'scene' }, [],
      _room(['kitchen', 'living-room', 'backyard', 'bedroom'], ctx, hoh, nom));
    api.addBond(hoh, nom, 0.6);
    api.remember(nom, hoh, 'can-be-guilted', 2, {});
    api.suspicion(nom, hoh, -0.5);
    return { scene, players: [hoh, nom], badgeText: 'CANNOT STOP APOLOGISING', badgeClass: 'grey' };
  },
};

// ── and the week after, the house adds it up ──────────────────────────

const theReckoning = {
  id: 'reign-reckoning',
  category: 'social',
  weight(house, ctx) {
    const last = gs.bb?.outgoingHoh;
    if (!last || !house.includes(last)) return 0;
    if (_spent('reign-reckoning', ctx)) return 0;
    const reigns = gs.bb?.reigns?.[last] || [];
    const recent = reigns[reigns.length - 1];
    if (!recent || (ctx?.week?.num || 0) !== recent.week + 1) return 0;
    // Only worth a scene when the week was memorable in either direction.
    // The morning the keys change hands, and nowhere else. Ungated it fired in
    // the campaign act too, where the beats are few and the vote-flip scenes
    // live — editorial-vote-flip-room went dead across ten seasons.
    const morning = ctx?.phase === 'pre-hoh' || ctx?.act === 'house' || ctx?.act === 'hoh';
    if (!morning) return 0;
    return recent.verdict === 'disastrous' || recent.verdict === 'poor'
      || recent.verdict === 'strong' ? band(9) : 0;
  },
  fire(house, ctx, api) {
    const last = gs.bb.outgoingHoh;
    _spend(this.id, ctx);
    const reigns = gs.bb.reigns[last] || [];
    const recent = reigns[reigns.length - 1];
    const critic = _quiet(_others(house, last))[0];
    const bad = recent.verdict === 'disastrous' || recent.verdict === 'poor';

    const scene = makeScene('reign.reckoning', { a: last, b: critic }, { ending: bad ? 'bad' : 'good' }, [],
      _room(['kitchen', 'living-room', 'backyard', 'bedroom'], ctx, last, critic));
    if (bad) {
      _others(house, last).forEach(n => {
        api.suspicion(n, last, 0.8);
        api.addBond(n, last, -0.4);
      });
      api.setTarget(critic, last, `spent a week of power badly and made it everybody's problem`);
      api.popDelta(last, -2);
    } else {
      _others(house, last).slice(0, 3).forEach(n => api.addBond(n, last, 0.5));
      api.popDelta(last, 2);
    }
    return { scene, players: [last, critic],
      badgeText: bad ? 'THE BILL FOR THAT WEEK' : 'WORE IT WELL',
      badgeClass: bad ? 'red' : 'green' };
  },
};


// -- two crowns in one house -------------------------------------------
//
// A Battle of the Block week is not one reign twice as big. It is two people
// holding the same power at the same time, knowing that by the end of the
// night one of them will have had it taken off them by their own nominees --
// and that which one is decided by who they choose to put up. Nothing in the
// library could say that, because every event here reads a single `ctx.hoh`.

/** Both crowns are still on the wall -- the window before the battle. */
const _twoCrowns = ctx => {
  const hohs = (ctx?.hohs || []).filter(Boolean);
  return hohs.length === 2 && !ctx?.week?.dethronedHoh ? hohs : null;
};

const carveItUp = {
  id: 'reign-carve-it-up',
  category: 'house-life',
  weight(house, ctx) {
    const hohs = _twoCrowns(ctx);
    if (!hohs || house.length < 6 || _spent('reign-carve-it-up', ctx)) return 0;
    // Weighted near the top of the band. Its window is a single act — the
    // stretch between two crownings and the two ceremonies, which is the only
    // time in the week the pair of them can still divide the house — and at a
    // middling weight it lost that one draw to the hundred events that are
    // eligible every week of the season.
    return ctx.phase === 'post-hoh' ? band(13) : 0;
  },
  fire(house, ctx, api, rng) {
    const [a, b] = _twoCrowns(ctx);
    _spend('reign-carve-it-up', ctx);
    const between = bond(a, b);
    // Four names have to come off one house, and neither of them wants to be
    // the one whose pair walks off the block.
    const pool = _quiet(_others(house, a, b));
    const [x, y] = pool;
    const agree = between + (rng() - 0.5) * 6 > 0;

    const scene = makeScene('reign.carve', { a, b }, { ending: agree ? 'agree' : 'split', target: x || null, partner: y || null }, [],
      'hoh-room');
    if (agree) {
      api.addBond(a, b, 1.4);
      api.remember(a, b, 'carved-the-house-up-with-me', 2, {});
      api.remember(b, a, 'carved-the-house-up-with-me', 2, {});
    } else {
      api.addBond(a, b, -1.6);
      api.suspicion(a, b, 1.2);
      api.suspicion(b, a, 1.2);
      api.popDelta(a, -1);
    }

    return { scene, players: [a, b, x, y].filter(Boolean),
      badgeText: agree ? 'TWO CROWNS, ONE DEAL' : 'TWO CROWNS, NO DEAL',
      badgeClass: agree ? 'green' : 'red' };
  },
};

const worksBothRooms = {
  id: 'reign-works-both-rooms',
  category: 'social',
  weight(house, ctx) {
    const hohs = _twoCrowns(ctx);
    if (!hohs || house.length < 7 || _spent('reign-works-both-rooms', ctx)) return 0;
    // Weighted alongside its sibling rather than below it. Both two-crown
    // events live in the same single act — the stretch before the two
    // ceremonies — so at band(6) against the other one's band(13) this simply
    // lost that draw and read as dead code across a sixteen-season sweep.
    return band(11);
  },
  fire(house, ctx, api, rng) {
    const [a, b] = _twoCrowns(ctx);
    _spend('reign-works-both-rooms', ctx);
    // Two rooms means two chances to be safe, and somebody always takes both.
    const worker = _quiet(_others(house, a, b))[0];
    const st = pStats(worker);
    // Getting away with it is what social play IS, and getting caught is what
    // makes two crowns dangerous rather than twice as safe.
    const caught = rng() > Math.min(0.82, 0.28 + st.social * 0.05 + st.strategic * 0.02);

    const scene = makeScene('reign.both', { a: worker, b: a, c: b }, { ending: caught ? 'caught' : 'clean' }, [],
      'hoh-room');
    if (caught) {
      api.addBond(worker, a, -1.8);
      api.addBond(worker, b, -1.8);
      api.suspicion(a, worker, 2);
      api.suspicion(b, worker, 2);
      // Two Heads of Household who agree on nothing else now agree on this.
      api.addBond(a, b, 0.8);
      api.setTarget(a, worker, 'played both Head of Household rooms in one afternoon');
      api.popDelta(worker, -2);
    } else {
      api.addBond(worker, a, 0.9);
      api.addBond(worker, b, 0.9);
      api.remember(worker, a, 'told-me-what-i-wanted-to-hear', 1, {});
      api.popDelta(worker, 2);
    }

    return { scene, players: [worker, a, b],
      badgeText: caught ? 'CAUGHT IN BOTH ROOMS' : 'WORKED BOTH ROOMS',
      badgeClass: caught ? 'red' : 'gold' };
  },
};

export const REIGN_EVENTS = [
  houseMeeting, saysItOutLoud, testsTheAlliance,
  letsTheHouseDecide, apologisesForIt, theReckoning,
  carveItUp, worksBothRooms,
];
