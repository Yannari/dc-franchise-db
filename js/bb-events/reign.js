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
import { pronouns } from '../players.js';
import {
  pStats, bond, perceived, band, closestTo, furthestFrom, beatsInvolving, spotlightOrder,
  alliancesOf, archetype, targetOf,
} from './_read.js';
import { reignTemperament, reignMadeAnEnemy } from '../bb/reign.js';

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}
const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
/** Least-seen first, weighted toward whoever this week is about. */
const _quiet = pool => spotlightOrder(pool);
const _list = names => (names.length <= 1 ? (names[0] || 'nobody')
  : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

/** The days between winning and the ceremony, when the damage gets done. */
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
    const p = pronouns(hoh);
    // Somebody says the quiet part in front of everybody, which is the entire
    // mechanism: the meeting does not fail because of the answer, it fails
    // because the question was asked in public.
    const honest = _quiet(room).find(n => pStats(n).boldness >= 6) || room[0];

    const text = _variant([
      `${hoh} calls everybody into the living room and opens with, “This is not a dictatorship.” A few people glance at each other before ${p.sub} reaches the end of the sentence.`,
      `${hoh} spends most of the meeting explaining why nobody should take the nominations personally. ${_list(room.slice(0, 3))} leave together and immediately discuss how personal it sounded.`,
      `${hoh} stands in the middle of the living room and asks, one at a time, who wants ${p.posAdj} target to stay. ${honest} answers honestly. Everybody watches ${hoh} hear it.`,
      `${hoh} calls a house meeting to clear the air, then asks each person to declare where they stand. The answers grow shorter as the room gets more uncomfortable.`,
    ], ctx, hoh, honest);

    room.forEach(n => {
      api.addBond(hoh, n, -0.9);
      api.suspicion(n, hoh, 1.1);
      reignMadeAnEnemy(ctx.week, n);
    });
    // The room bonds over it, which is the part that actually ends people.
    room.forEach((a, i) => { const b = room[i + 1]; if (b) api.addBond(a, b, 0.5); });
    api.remember(honest, hoh, 'made-me-say-it-out-loud', 2, {});
    api.popDelta(hoh, -3);
    return { text, players: [hoh, honest], badgeText: 'HOUSE MEETING', badgeClass: 'red',
      // Same scene, same treatment on the screen.
      meeting: { caller: hoh, about: honest, outcome: 'backfires', cause: 'power', room: [...room],
        beats: [
          { kind: 'call', who: hoh, text: `${hoh} does not shout it. ${p.Sub} ${p.sub === 'they' ? 'do' : 'does'} not have to — the Head of Household asking everybody to come to the living room is not a request, and all ${room.length} of them know it.` },
          { kind: 'assemble', who: null, text: `They arrive in the order people arrive when they have been summoned rather than invited: quickly, and without talking on the way.` },
          { kind: 'case', who: hoh, text: `"This is not a dictatorship." It is the first thing ${hoh} says and it is the only thing anybody will quote afterwards.` },
          { kind: 'answer', who: honest, text: `${honest} admits ${p.posAdj} target has support. Someone behind the couch whispers, “Thank you,” and ${hoh} hears it.` },
          { kind: 'verdict', who: null, text: `The meeting breaks up with ${hoh} still holding power and far fewer people willing to visit the HOH room alone.` },
        ] } };
  },
};

const saysItOutLoud = {
  id: 'reign-announces-target',
  category: 'deals',
  weight(house, ctx) {
    const hoh = ctx?.hoh;
    if (!hoh || _spent('reign-announces-target', ctx)) return 0;
    const { ego, mode } = reignTemperament(hoh);
    return mode === 'hohitis' && targetOf(hoh) ? _reigning(ctx, 6 * ego) : 0;
  },
  fire(house, ctx, api) {
    const hoh = ctx.hoh;
    _spend(this.id, ctx);
    const mark = targetOf(hoh) || furthestFrom(hoh, _others(house, hoh));
    const audience = _quiet(_others(house, hoh, mark)).slice(0, 2);
    const p = pronouns(hoh);
    const text = _variant([
      `${hoh} tells ${_list(audience)} that ${mark} is going up and explains why. One of them leaves, finds ${mark} and repeats the conversation almost word for word.`,
      `“I'm not going to pretend.” ${hoh} names ${mark} in front of people ${p.sub} ${p.sub === 'they' ? 'do' : 'does'} not fully trust. ${mark} hears about it before ${hoh} can arrange a private talk.`,
      `${hoh} lowers ${p.posAdj} voice before naming ${mark}, as if volume is the same as secrecy. By the time ${hoh} reaches the kitchen, ${mark} is already waiting there.`,
    ], ctx, hoh, mark);

    // The target now has time, which is the only thing a target ever needs.
    api.suspicion(mark, hoh, 2);
    api.setTarget(mark, hoh, `told the house I was going up before telling me`);
    api.addBond(mark, hoh, -1.4);
    reignMadeAnEnemy(ctx.week, mark);
    audience.forEach(n => api.remember(n, hoh, 'cannot-keep-quiet', 1, {}));
    return { text, players: [hoh, mark], badgeText: 'SAYS IT OUT LOUD', badgeClass: 'orange' };
  },
};

const testsTheAlliance = {
  id: 'reign-loyalty-test',
  category: 'deals',
  weight(house, ctx) {
    const hoh = ctx?.hoh;
    if (!hoh || _spent('reign-loyalty-test', ctx)) return 0;
    const { ego, mode } = reignTemperament(hoh);
    return mode === 'hohitis' && alliancesOf(hoh).length ? _reigning(ctx, 5 * ego) : 0;
  },
  fire(house, ctx, api) {
    const hoh = ctx.hoh;
    _spend(this.id, ctx);
    const alliance = alliancesOf(hoh)[0];
    const mates = ((alliance?.members) || []).filter(n => n !== hoh && house.includes(n));
    if (!mates.length) {
      return { text: `${hoh} looks for somebody to test and finds nobody worth testing.`,
        players: [hoh], badgeText: 'NOBODY TO ASK', badgeClass: 'grey' };
    }
    const p = pronouns(hoh);
    const doubter = _quiet(mates).find(n => bond(n, hoh) < 4) || mates[0];

    const text = _variant([
      `${hoh} asks each member of ${alliance?.name || 'the group'} to confirm, in front of the others, that they are still loyal. ${doubter} pauses before answering, and ${hoh} immediately asks why.`,
      `“I just need to know where everybody is,” ${hoh} says. ${doubter} asks whether something happened. Nobody can name anything, but the meeting no longer feels routine.`,
      `${hoh} makes ${_list(mates.slice(0, 3))} promise they are still together. They all say yes; afterwards, ${doubter} pulls another member aside to ask what prompted the test.`,
    ], ctx, hoh, doubter);

    mates.forEach(n => {
      api.addBond(hoh, n, -0.7);
      api.remember(n, hoh, 'made-me-prove-it', 1, {});
    });
    api.suspicion(hoh, doubter, 1.3);
    api.suspicion(doubter, hoh, 1);
    reignMadeAnEnemy(ctx.week, doubter);
    return { text, players: [hoh, doubter], badgeText: 'LOYALTY TEST', badgeClass: 'orange' };
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
    return mode === 'frightened' ? _reigning(ctx, 6 * nerves) : 0;
  },
  fire(house, ctx, api) {
    const hoh = ctx.hoh;
    _spend(this.id, ctx);
    const advisor = closestTo(hoh, _others(house, hoh)) || _others(house, hoh)[0];
    const p = pronouns(hoh);
    const text = _variant([
      `${hoh} asks ${advisor} for two nomination names, then takes the same question to other rooms. When the answers overlap, ${hoh} adopts them without ever saying which targets ${p.sub} wanted.`,
      `“I don't want to make enemies,” ${hoh} tells ${advisor}. ${advisor} supplies a safe name, and ${hoh} looks relieved enough for ${advisor} to realize the suggestion will stick.`,
      `${hoh} searches for nominees nobody will defend. Every name has somebody attached to it, so ${p.sub} ${p.sub === 'they' ? 'settle' : 'settles'} on the two that produce the fewest objections.`,
    ], ctx, hoh, advisor);

    // The cost is invisible this week and enormous next week: nobody owes them
    // anything and nobody is afraid of them.
    api.addBond(hoh, advisor, 0.4);
    api.remember(advisor, hoh, 'let-me-pick', 2, { about: 'their own nominations' });
    _others(house, hoh).forEach(n => api.suspicion(n, hoh, -0.3));
    api.popDelta(hoh, -1);
    return { text, players: [hoh, advisor], badgeText: 'SOMEBODY ELSE DECIDES', badgeClass: 'grey' };
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
    const p = pronouns(hoh);
    const text = _variant([
      `${hoh} apologises to ${nom} every time they cross paths. Eventually ${nom} stops reassuring ${p.obj} and starts asking what would make ${hoh} feel better.`,
      `"You know it's nothing personal, right?" ${nom} says of course. ${nom} does not think it is nothing personal, and now knows ${hoh} needs to believe it is.`,
      `${hoh} cannot stop explaining ${p.posAdj} nominations to the person ${p.sub} nominated. ${nom} lets ${p.obj} talk, and files away every soft spot it reveals.`,
    ], ctx, hoh, nom);

    // Weakness is information, and a nominee has nothing to do all week but
    // collect it.
    api.addBond(hoh, nom, 0.6);
    api.remember(nom, hoh, 'can-be-guilted', 2, {});
    api.suspicion(nom, hoh, -0.5);
    return { text, players: [hoh, nom], badgeText: 'CANNOT STOP APOLOGISING', badgeClass: 'grey' };
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
    const p = pronouns(last);

    const text = bad ? _variant([
      `${last} is no longer Head of Household, and the traffic to ${p.posAdj} door stops with the power. In the bedroom, ${critic} finally says what people were too careful to say during ${last}'s reign.`,
      `The power changes hands. ${critic} tells two people that ${last} used the week to irritate nearly everyone, and neither of them rushes to defend ${p.obj}.`,
      `${last} joins a kitchen conversation that goes quiet on arrival. Across the house, ${critic} is comparing notes with people who spent the previous week nodding along.`,
      `${critic} waits until ${last} can no longer nominate anyone, then asks the room who was promised safety last week. Too many people answer.`,
    ], ctx, last, critic) : _variant([
      `${last} leaves the HOH room after doing exactly what ${p.sub} promised. ${critic} mentions that in the kitchen, and three people agree before the subject changes.`,
      `${last} no longer controls the nominations, but the people who worked with ${p.obj} last week still make room when ${p.sub} joins them.`,
      `${critic} admits that ${last}'s nominations made sense and the vote went as planned. Nobody offers ${last} another week of power, but several people now trust ${p.obj} more.`,
      `The HOH key changes hands without erasing what ${last} accomplished. Three houseguests independently describe the reign as clean, which becomes its own kind of protection.`,
    ], ctx, last, critic);

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
    return { text, players: [last, critic],
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
    const p = pronouns(a);
    const between = bond(a, b);
    // Four names have to come off one house, and neither of them wants to be
    // the one whose pair walks off the block.
    const pool = _quiet(_others(house, a, b));
    const [x, y] = pool;
    const agree = between + (rng() - 0.5) * 6 > 0;

    const text = agree
      ? _variant([
        `${a} and ${b} sit down in one of the two Head of Household rooms and split the house between them like people dividing a bill. ${a} takes ${x}. ${b} takes ${y}. Neither of them says the obvious thing out loud, which is that one of these two ceremonies is going to cost the person who held it.`,
        `Two crowns, one conversation. ${a} and ${b} work out who is putting up whom before either of them has spoken to a single nominee, and by the time they come downstairs the week is already decided.`,
        `${a} wants ${x} up. ${b} does not care who goes up as long as it is not ${y}. It takes them four minutes to agree and they are both pleased with themselves in a way that will not survive the night.`,
        `${b} asks ${a} straight out: "If your two win, I keep the room. You know that." ${a} knows that. They make the deal anyway, because the alternative is making it with somebody else.`,
      ], ctx, a, b, x)
      : _variant([
        `${a} and ${b} cannot agree on a single name. Two Heads of Household, two rooms, and by the end of it they are nominating around each other rather than with each other.`,
        `${b} refuses to take ${y} up, and ${a} refuses to take anybody instead. The conversation ends with both of them saying "fine" and meaning something much worse than fine.`,
        `The problem with two Heads of Household is that only one of them survives the night, and ${a} and ${b} both work that out mid-sentence. The rest of the conversation is two people being careful.`,
        `${a} offers ${b} a straight split. ${b} says ${pronouns(b).sub} will think about it, which ${a} correctly reads as no.`,
      ], ctx, a, b, y);

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
    // Either way, the people whose names were in that room find out.
    for (const n of [x, y].filter(Boolean)) api.suspicion(n, agree ? a : b, 0.7);
    void p;

    return { text, players: [a, b, x].filter(Boolean),
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
    const p = pronouns(worker);
    const st = pStats(worker);
    const they = p.sub === 'they';
    // Getting away with it is what social play IS, and getting caught is what
    // makes two crowns dangerous rather than twice as safe.
    const caught = rng() > Math.min(0.82, 0.28 + st.social * 0.05 + st.strategic * 0.02);

    const text = caught
      ? _variant([
        `${worker} tells ${a} that ${b} is the real problem this week, then goes upstairs and tells ${b} exactly the same thing about ${a}. The two of them compare notes within the hour, because they are the only two people in the house who have a reason to talk to each other.`,
        `Two Head of Household rooms, and ${worker} is in both of them inside twenty minutes saying different things. It works right up until ${a} repeats one of the sentences back to ${b}.`,
        `${worker} works both rooms and forgets that ${a} and ${b} now have something in common. They find the contradiction without even looking for it.`,
        `${worker} promises ${a} a vote and promises ${b} the same vote. ${p.Sub} ${they ? 'have' : 'has'} one.`,
      ], ctx, worker, a, b)
      : _variant([
        `${worker} spends the afternoon moving between the two Head of Household rooms, and comes out of both of them safe. Nobody upstairs compares notes, because neither of them wants to admit how much they said.`,
        `${worker} plays the two rooms off each other beautifully. ${a} thinks ${p.sub} ${they ? 'are' : 'is'} loyal, ${b} thinks the same, and both of them are wrong in a way that costs ${worker} nothing.`,
        `Two crowns is two chances, and ${worker} takes both of them. By the evening ${p.sub} ${they ? 'have' : 'has'} been told the target by two different people and neither of them knows.`,
        `${worker} says almost nothing in either room and leaves both of them believing ${p.sub} agreed. It is the best work ${p.sub} ${they ? 'have' : 'has'} done all season.`,
      ], ctx, worker, a, b);

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

    return { text, players: [worker, a, b],
      badgeText: caught ? 'CAUGHT IN BOTH ROOMS' : 'WORKED BOTH ROOMS',
      badgeClass: caught ? 'red' : 'gold' };
  },
};

export const REIGN_EVENTS = [
  houseMeeting, saysItOutLoud, testsTheAlliance,
  letsTheHouseDecide, apologisesForIt, theReckoning,
  carveItUp, worksBothRooms,
];
