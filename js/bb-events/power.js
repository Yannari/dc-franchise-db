// ══════════════════════════════════════════════════════════════════════
// bb-events/power.js — the HOH room, the block, and the fallout
// ══════════════════════════════════════════════════════════════════════
//
// The two places a Big Brother week actually happens, and neither had events
// of its own. The house talked about slop and the weather while the only room
// that mattered sat empty: nobody climbed the stairs to pitch a name, nobody
// sweated out the days on the block, and a nomination ceremony ended without
// anybody saying a word about it.
//
// Everything here is asymmetric on purpose. A pitch is not a conversation
// between equals — one of them can end the other's game on Thursday — so it
// moves suspicion, targeting and memory rather than just a bond. Time on the
// block is not neutral either: it wears people down, and how it wears them
// depends entirely on who they are. A hothead goes looking for the HOH. A goat
// stops trying. A mastermind starts counting votes.
//
// The rule of the file: pitching, raging and pleading all change what somebody
// does next, or they do not belong here.

import { pronouns } from '../players.js';
import {
  pStats, bond, band, perceived, closestTo, furthestFrom, trusts, dislikes, campaignArgument,
  sharesAlliance, grudge, remembers, suspicionOf, targetOf, threat, willScheme,
  isNice, isVillainous, archetype, resentmentOf, trustOf, beatsInvolving,
  actFacts, alliancesOf, deFactoAllies,
} from './_read.js';

// ── helpers ───────────────────────────────────────────────────────────

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}

/** Weight an event onto one phase of the week — the same scaling phases.js uses. */
const at = (phase, ctx, value) => (ctx?.phase === phase ? band(value * 2.6, 34) : 0);

/**
 * After the veto ceremony, which is NOT the 'post-veto' phase.
 *
 * post-veto is the stretch between the competition and the ceremony — the veto
 * exists and nobody has said what they are doing with it. The fallout happens
 * afterwards, in the campaign, once somebody has come down and somebody else
 * has taken their chair. Gating the fallout on post-veto meant none of it could
 * ever fire: at that point there is no saved and no replacement to react to.
 */
const afterCeremony = (ctx, value) =>
  // Scaled at 0.9, not 2.2. These are the loudest scenes of the week and they
  // all land in the campaign act, which draws one to three beats — at the old
  // multiplier four of them arrived weighing ~25 against a library whose other
  // campaign events sit around 3, and they took nearly every slot. Being the
  // most dramatic thing available is not a reason to be the only thing.
  (ctx?.act === 'campaign' || ctx?.phase === 'campaign' ? band(value * 0.9, 16) : 0);

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const _hoh = ctx => ctx?.hoh || ctx?.week?.hoh || null;
const _noms = ctx => (ctx?.nominees || []).filter(Boolean);
/** Least-seen first, so the same three names do not carry every week. */
const _quiet = pool => [...pool].sort((a, b) => beatsInvolving(a) - beatsInvolving(b));

/** Is the block known yet? Everything on this list depends on that. */
const _blockKnown = ctx => ['post-noms', 'post-veto', 'campaign', 'eviction'].includes(ctx?.phase)
  || ['nominations', 'veto', 'veto-ceremony', 'campaign', 'eviction', 'safety'].includes(ctx?.act);

// ══════════════════════════════════════════════════════════════════════
// THE HOH ROOM
// ══════════════════════════════════════════════════════════════════════

/**
 * Somebody climbs the stairs with a name.
 *
 * The core political act of the format and it was not modelled at all. Whether
 * it lands is a real contest — how persuasive they are against how well the
 * HOH reads people — and landing it MOVES THE TARGET, so a pitch can decide
 * the week. Failing is worse than not trying: the HOH now knows who is
 * steering, and remembers it.
 */
const hohPitch = {
  id: 'power-hoh-pitch',
  location: 'hoh-room',
  category: 'deals',
  weight(house, ctx) {
    const hoh = _hoh(ctx);
    if (!hoh || house.length < 4) return 0;
    // Once the block is set the pitch is about the vote, not the nominations.
    if (_blockKnown(ctx)) return 0;
    return band(9);
  },
  fire(house, ctx, api, rng) {
    const hoh = _hoh(ctx);
    const pitchers = _quiet(_others(house, hoh));
    const pitcher = pitchers.find(n => willScheme(n) || pStats(n).social >= 5) || pitchers[0];
    const p = pronouns(pitcher);
    // The name they push: someone they fear or resent, never a friend.
    const mark = furthestFrom(pitcher, _others(house, hoh, pitcher))
      || _others(house, hoh, pitcher)[0];

    const push = pStats(pitcher).social * 0.5 + pStats(pitcher).strategic * 0.4
      + perceived(hoh, pitcher) * 0.6;
    const resist = pStats(hoh).intuition * 0.55 + pStats(hoh).strategic * 0.3
      + (grudge(hoh, pitcher) ? 2.5 : 0);
    const lands = push + (rng() * 5 - 2.5) > resist;

    const text = lands ? _variant([
      `${pitcher} finds a reason to be upstairs, admires the room for exactly as long as politeness needs, and then says ${mark}'s name out loud.`,
      `"I'm not telling you what to do." ${pitcher} then tells ${hoh} what to do, and ${hoh} finds ${p.ref} agreeing with it.`,
      `${pitcher} lets the conversation drift toward ${mark}, then asks ${hoh} whether keeping ${mark} is really good for their game.`,
      `It takes ${pitcher} four minutes to turn ${hoh}'s own doubts about ${mark} into ${hoh}'s own idea.`,
    ], ctx, pitcher, mark) : _variant([
      `${pitcher} pitches ${mark} hard, and a little too hard. ${hoh} nods along and privately moves ${pitcher} up the list.`,
      `${pitcher} comes up with a name ready. ${hoh} has heard that eagerness before and knows what it usually means.`,
      `"You'd be doing the whole house a favour." ${hoh} notices that the favour is mostly to ${pitcher}.`,
      `${pitcher} overplays it. ${hoh} says nothing, agrees with nothing, and remembers everything.`,
    ], ctx, pitcher, mark);

    if (lands) {
      api.setTarget(hoh, mark, `${pitcher} put the name in the room`);
      api.addBond(hoh, pitcher, 0.7);
      api.remember(hoh, pitcher, 'trust', 1, { about: 'came to me straight' });
      api.suspicion(mark, pitcher, 0.5);
    } else {
      api.suspicion(hoh, pitcher, 1.4);
      api.remember(hoh, pitcher, 'grievance', 2, { about: 'tried to run my week' });
      api.addBond(hoh, pitcher, -0.5);
    }
    return {
      text, players: [pitcher, hoh],
      badgeText: lands ? 'THE NAME LANDS' : 'OVERPLAYED IT',
      badgeClass: lands ? 'blue' : 'red',
    };
  },
};

/**
 * Who came up, and who very deliberately did not.
 *
 * The HOH room is a register of loyalty that nobody signs. Staying away reads
 * as guilt whether or not it is.
 */
const hohRoomTraffic = {
  id: 'power-hoh-traffic',
  location: 'hoh-room',
  category: 'phases',
  weight(house, ctx) {
    const hoh = _hoh(ctx);
    return hoh && house.length >= 5 && !_blockKnown(ctx) ? band(7) : 0;
  },
  fire(house, ctx, api) {
    const hoh = _hoh(ctx);
    const pool = _others(house, hoh);
    const visitors = pool.filter(n => perceived(hoh, n) >= 0).slice(0, 4);
    const absent = _quiet(pool.filter(n => !visitors.includes(n)))[0];
    const p = pronouns(absent || hoh);

    const text = absent ? _variant([
      `The HOH room has a queue all afternoon. ${absent} is not in it, and ${hoh} counts the absence twice.`,
      `Everybody finds a reason to come up and sit on the bed. Everybody except ${absent}, who suddenly has laundry.`,
      `${hoh} notices who knocks. More usefully, ${hoh} notices that ${absent} has not, and that ${p.sub} has had all day.`,
      `Four visits before dinner. ${absent} makes none of them, and by evening that is its own kind of statement.`,
    ], ctx, hoh, absent) : _variant([
      `The whole house files through the HOH room in ones and twos, each of them casual about it.`,
      `${hoh} holds court on the good bed and learns more from the order people arrive in than from anything they say.`,
    ], ctx, hoh);

    visitors.forEach(v => api.addBond(hoh, v, 0.25));
    if (absent) {
      api.suspicion(hoh, absent, 1.1);
      api.remember(hoh, absent, 'grievance', 1, { about: 'never came up' });
    }
    return {
      text, players: [hoh, absent].filter(Boolean),
      badgeText: absent ? 'DID NOT COME UP' : 'THE QUEUE',
      badgeClass: absent ? 'red' : 'grey',
    };
  },
};

/**
 * Power is heavier than it looks from downstairs.
 *
 * The HOH alone with the decision. Wears on low-temperament players and
 * hardens the strategic ones.
 */
const hohWeight = {
  id: 'power-hoh-weight',
  location: 'hoh-room',
  category: 'house-life',
  weight(house, ctx) {
    const hoh = _hoh(ctx);
    if (!hoh || _blockKnown(ctx)) return 0;
    return band(3 + (10 - pStats(hoh).temperament) * 0.35);
  },
  fire(house, ctx, api) {
    const hoh = _hoh(ctx);
    const s = pStats(hoh);
    const p = pronouns(hoh);
    const rattled = s.temperament <= 5;
    const text = rattled ? _variant([
      `${hoh} lies awake in the best bed in the house doing arithmetic that keeps coming out wrong.`,
      `${hoh} sits alone in the HOH room with the door open. Twice, ${p.sub} hears someone on the stairs, but nobody comes in.`,
      `${hoh} practises saying two names out loud. Neither of them sounds any better the fourth time.`,
      `Everyone downstairs thinks ${hoh} is safe. ${hoh} is discovering that safe and comfortable are different words.`,
    ], ctx, hoh) : _variant([
      `${hoh} has known the two names since about an hour after winning, and spends the rest of the time deciding how to sell them.`,
      `${hoh} writes nothing down — there is nowhere in this house to hide a list — and keeps the whole plan behind ${p.posAdj} teeth.`,
      `The room is quiet, and ${hoh} uses the quiet. By morning the week has a shape.`,
    ], ctx, hoh);

    if (rattled) api.popDelta(hoh, 1);
    return {
      text, players: [hoh],
      badgeText: rattled ? 'THE WEIGHT OF IT' : 'DECIDED ALREADY',
      badgeClass: rattled ? 'grey' : 'gold',
    };
  },
};

/**
 * The HOH promises somebody they are safe.
 *
 * A real deal, recorded — which means it can be kept or broken later, and the
 * rest of the season will read it either way.
 */
const hohPromise = {
  id: 'power-hoh-promise',
  location: 'hoh-room',
  category: 'deals',
  weight(house, ctx) {
    const hoh = _hoh(ctx);
    if (!hoh || house.length < 5 || _blockKnown(ctx)) return 0;
    return band(6);
  },
  fire(house, ctx, api) {
    const hoh = _hoh(ctx);
    const ally = closestTo(hoh, _others(house, hoh)) || _others(house, hoh)[0];
    const honest = perceived(hoh, ally) >= 2 && !willScheme(hoh);
    const text = honest ? _variant([
      `"You're not going up. Not this week, not while I've got it." ${hoh} means it, and ${ally} can tell.`,
      `${hoh} tells ${ally} the plan before anyone else. ${ally} asks if this means their deal is still real. ${hoh} says it does.`,
      `It is not a grand alliance. It is one sentence — you are safe with me — and ${ally} takes it as one.`,
    ], ctx, hoh, ally) : _variant([
      `${hoh} promises ${ally} safety in a tone that costs nothing and buys a week of quiet.`,
      `"You're fine." ${hoh} has said that to two people today, and only one of them is going to stay fine.`,
      `${ally} leaves the room certain of something ${hoh} has not actually decided.`,
    ], ctx, hoh, ally);

    api.sideDeal(hoh, ally, 'safety', { genuine: honest, about: 'a week of protection' });
    api.addBond(hoh, ally, honest ? 1.1 : 0.4);
    api.remember(ally, hoh, honest ? 'trust' : 'promise', 2, { about: 'told me I was safe' });
    return {
      text, players: [hoh, ally],
      badgeText: honest ? 'A REAL PROMISE' : 'CHEAP PROMISE',
      badgeClass: honest ? 'green' : 'grey',
    };
  },
};

// ══════════════════════════════════════════════════════════════════════
// THE BLOCK
// ══════════════════════════════════════════════════════════════════════

/**
 * Working the house from the block.
 *
 * Campaigning is exhausting and visible, and doing it well costs something.
 * Who they go to first is the read: an ally, or the person they most need to
 * turn.
 */
const nomCampaign = {
  id: 'power-nom-campaign',
  category: 'deals',
  weight(house, ctx) {
    return _blockKnown(ctx) && _noms(ctx).length && house.length >= 4 ? band(9) : 0;
  },
  fire(house, ctx, api, rng) {
    const noms = _noms(ctx);
    const nom = _quiet(noms)[0];
    const p = pronouns(nom);
    const voters = _others(house, ...noms, _hoh(ctx));
    if (!voters.length) {
      return { text: `${nom} has run out of people to talk to.`, players: [nom],
        badgeText: 'NOBODY LEFT', badgeClass: 'grey' };
    }
    const mark = _quiet(voters)[0];
    const persuasive = pStats(nom).social * 0.5 + pStats(nom).strategic * 0.3 + bond(nom, mark) * 0.5;
    const works = persuasive + (rng() * 5 - 2.5) > pStats(mark).loyalty * 0.45 + 2;

    // The actual pitch, drawn from the board. These cards used to describe
    // somebody making "the only argument that matters" without ever saying
    // what it was.
    const other = _noms(ctx).find(n => n !== nom) || null;
    const pitch = campaignArgument(nom, mark, other);
    const text = works ? _variant([
      `${nom} gets ${mark} alone by the ${_variant(['storage room', 'washroom door', 'back of the kitchen'], ctx, nom)}. ${pitch} ${mark} does not answer straight away, which is an answer.`,
      `${nom} does not beg. ${pitch} ${mark} works through it and cannot find the hole in it.`,
      `${pitch} ${mark} counts, and does not like the answer.`,
      `${nom} works ${mark} for twenty minutes and gets there in the end. ${pitch} By the time ${p.sub} ${p.sub === 'they' ? 'leave' : 'leaves'}, ${mark} has stopped arguing.`,
    ], ctx, nom, mark) : _variant([
      `${pitch} ${mark} has heard it, agrees with all of it, and has already decided.`,
      `${nom} makes the case one more time. ${pitch} "I'll think about it," ${mark} says. In this house that sentence has one meaning.`,
      `${pitch} It is a good argument. ${mark} nods along and does not move an inch.`,
      `${nom} runs out of argument in front of ${mark} and fills the gap with a promise ${p.sub} cannot keep.`,
    ], ctx, nom, mark);

    api.addBond(nom, mark, works ? 1.0 : -0.3);
    if (works) {
      api.remember(mark, nom, 'trust', 1, { about: 'came to me honestly' });
      api.sideDeal(nom, mark, 'vote', { genuine: true, about: 'a vote to keep' });
    } else {
      api.remember(nom, mark, 'grievance', 1, { about: 'would not even look at me' });
    }
    return {
      text, players: [nom, mark],
      badgeText: works ? 'A VOTE MOVES' : 'PITCH DIES',
      badgeClass: works ? 'green' : 'grey',
    };
  },
};

/**
 * The block gets to somebody.
 *
 * Which way it breaks is archetype and temperament, not chance: anger, despair
 * or a very cold sort of focus. All three change how the house treats them.
 */
const blockPressure = {
  id: 'power-block-pressure',
  category: 'social',
  weight(house, ctx) {
    return _blockKnown(ctx) && _noms(ctx).length ? band(8) : 0;
  },
  fire(house, ctx, api) {
    const noms = _noms(ctx);
    const nom = _quiet(noms)[0];
    const s = pStats(nom);
    const arch = archetype(nom);
    const p = pronouns(nom);
    const hoh = _hoh(ctx);

    // Angry, hollow, or focused — decided by who they are.
    const anger = (10 - s.temperament) * 0.6 + (['hothead', 'villain', 'chaos-agent'].includes(arch) ? 3 : 0);
    const collapse = (10 - s.boldness) * 0.5 + (['goat', 'floater', 'underdog'].includes(arch) ? 2.5 : 0);
    const mode = anger > collapse && anger > 4 ? 'anger' : collapse > 4 ? 'despair' : 'focus';

    const text = mode === 'anger' ? _variant([
      `${nom} slams a cupboard hard enough that the whole kitchen stops. Nobody asks what it was about because everybody knows.`,
      `"Say it to me, then." ${nom} is looking straight at ${hoh || 'the room'}, and the temperature drops about ten degrees.`,
      `${nom} has been polite since the nomination and runs out of it between one sentence and the next.`,
      `It comes out sideways — a joke with too much in it, aimed at nobody, landing on everybody.`,
    ], ctx, nom) : mode === 'despair' ? _variant([
      `${nom} stops campaigning halfway through a sentence, and does not pick it back up.`,
      `${nom} sits in the ${_variant(['backyard', 'washroom', 'storage room'], ctx, nom)} for most of an hour. Two people see ${p.obj}. Neither goes in.`,
      `${nom} starts saying goodbye to people in ways that are not quite goodbyes.`,
      `${nom} holds it together until somebody quietly asks if ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} okay. ${p.Sub} tries to answer and cannot get the words out.`,
    ], ctx, nom) : _variant([
      `${nom} goes very quiet and very organised, and the house finds that more alarming than shouting.`,
      `${nom} works out exactly how many votes ${p.sub} needs and exactly whose they are, and starts at the top of the list.`,
      `Being on the block has clarified things for ${nom}. That is not good news for whoever put ${p.obj} there.`,
    ], ctx, nom);

    if (mode === 'anger') {
      _others(house, nom).forEach(w => api.suspicion(w, nom, 0.4));
      if (hoh) { api.addBond(nom, hoh, -1.3); api.remember(nom, hoh, 'grievance', 3, { about: 'put me up' }); }
      api.popDelta(nom, -1);
    } else if (mode === 'despair') {
      api.popDelta(nom, 2);
      const kind = closestTo(nom, _others(house, nom));
      if (kind) api.addBond(nom, kind, 0.6);
    } else {
      if (hoh) api.setTarget(nom, hoh, 'put me on the block');
      api.remember(nom, hoh, 'grievance', 2, { about: 'nominated me' });
    }
    return {
      text, players: [nom, mode === 'anger' && hoh ? hoh : null].filter(Boolean),
      badgeText: mode === 'anger' ? 'BOILS OVER' : mode === 'despair' ? 'GIVES IN' : 'GOES COLD',
      badgeClass: mode === 'anger' ? 'red' : mode === 'despair' ? 'grey' : 'blue',
    };
  },
};

/**
 * The pawn works out what a pawn is.
 *
 * Being told you are a formality is only reassuring until you count the votes
 * yourself.
 */
const pawnResentment = {
  id: 'power-pawn-resents',
  category: 'social',
  weight(house, ctx) {
    const f = actFacts(ctx);
    return _blockKnown(ctx) && f.pawn && _noms(ctx).includes(f.pawn) ? band(7) : 0;
  },
  fire(house, ctx, api) {
    const { pawn, target } = actFacts(ctx);
    const hoh = _hoh(ctx);
    const p = pronouns(pawn);
    const takesIt = pStats(pawn).loyalty >= 6 && perceived(pawn, hoh) >= 1;

    const text = takesIt ? _variant([
      `${pawn} accepts being the pawn with better grace than most, and files it somewhere ${p.sub} can reach later.`,
      `"I get it. I'm the safe one." ${pawn} says it lightly. ${p.Sub} does not feel it lightly.`,
      `${pawn} sits beside ${target || 'the target'} and does the maths on what happens if one vote wanders.`,
    ], ctx, pawn) : _variant([
      `${pawn} was told this was a formality. ${p.Sub} has now counted the votes twice and does not like how thin the word formality is.`,
      `"Pawns go home." ${pawn} says it to nobody in particular, in a room with four people in it.`,
      `Being used as furniture stops being funny to ${pawn} somewhere around the second day.`,
      `${pawn} smiles through the ceremony and stops smiling the moment ${p.sub} is round the corner.`,
    ], ctx, pawn);

    if (!takesIt && hoh) {
      api.addBond(pawn, hoh, -1.6);
      api.remember(pawn, hoh, 'grievance', 3, { about: 'used me as a pawn' });
      api.setTarget(pawn, hoh, 'sat me down as a prop');
      api.popDelta(pawn, 1);
    } else if (hoh) {
      api.remember(pawn, hoh, 'obligation', 1, { about: 'owes me for sitting there' });
    }
    return {
      text, players: [pawn, hoh].filter(Boolean),
      badgeText: takesIt ? 'TAKES IT' : 'PAWNS GO HOME',
      badgeClass: takesIt ? 'grey' : 'red',
    };
  },
};

// ══════════════════════════════════════════════════════════════════════
// AFTER THE CEREMONY
// ══════════════════════════════════════════════════════════════════════

/**
 * It gets said out loud in front of everybody.
 *
 * A ceremony ends and somebody does not walk away. The house takes sides
 * whether it wants to or not, and that is the point — a confrontation is
 * expensive for both of them.
 */
const ceremonyConfrontation = {
  id: 'power-ceremony-confrontation',
  location: 'living-room',
  category: 'ceremonies',
  weight(house, ctx) {
    if (!['nominations', 'veto-ceremony', 'post-noms', 'post-veto'].includes(ctx?.act)
      && !['post-noms', 'post-veto'].includes(ctx?.phase)) return 0;
    const noms = _noms(ctx);
    const hoh = _hoh(ctx);
    if (!noms.length || !hoh) return 0;
    // Needs somebody with a temper and a reason.
    const hottest = Math.max(...noms.map(n => (10 - pStats(n).temperament) + (grudge(n, hoh) ? 3 : 0)));
    return band(hottest * 0.6);
  },
  fire(house, ctx, api) {
    const hoh = _hoh(ctx);
    const noms = _noms(ctx);
    const accuser = noms.slice().sort((a, b) =>
      (10 - pStats(a).temperament) - (10 - pStats(b).temperament))[noms.length - 1];
    const p = pronouns(accuser);
    const backs = _others(house, accuser, hoh).filter(n => bond(n, accuser) >= 2);

    const text = _variant([
      `The room does not empty after the ceremony. ${accuser} stays in ${p.posAdj} chair and asks ${hoh}, in front of everybody, to explain it.`,
      `"You could have told me first." ${accuser} says it to ${hoh} with eleven people pretending to do something else.`,
      `${hoh} gets three steps toward the stairs before ${accuser} says ${hoh}'s name in a voice that stops the whole room.`,
      `It is not shouting. It is worse than shouting — ${accuser} asks ${hoh} one quiet question and waits for an answer in front of the entire house.`,
    ], ctx, accuser, hoh);

    api.addBond(accuser, hoh, -2.0);
    api.remember(accuser, hoh, 'grievance', 3, { about: 'made me ask in public' });
    api.remember(hoh, accuser, 'grievance', 2, { about: 'came at me in front of everyone' });
    api.setTarget(accuser, hoh, 'made me sit there and ask');
    // Everybody watching forms a view, and it is rarely a kind one about both.
    _others(house, accuser, hoh).forEach(w => {
      api.suspicion(w, accuser, 0.5);
      if (bond(w, accuser) >= 2) api.addBond(w, accuser, 0.4);
    });
    api.popDelta(accuser, backs.length ? 1 : -1);
    return {
      text, players: [accuser, hoh],
      badgeText: 'IN FRONT OF EVERYBODY',
      badgeClass: 'red',
    };
  },
};

/**
 * The replacement finds out what happened to them.
 *
 * Being put up after the veto is a different injury to being nominated: the
 * house had a chance to think about it and chose them anyway.
 */
const replacementFallout = {
  id: 'power-replacement-fallout',
  location: 'living-room',
  category: 'ceremonies',
  weight(house, ctx) {
    const f = actFacts(ctx);
    return f.replacement && _noms(ctx).includes(f.replacement) ? band(9) : 0;
  },
  fire(house, ctx, api) {
    const { replacement, saved } = actFacts(ctx);
    const hoh = _hoh(ctx);
    const p = pronouns(replacement);
    const blindsided = perceived(replacement, hoh) >= 2;

    const text = blindsided ? _variant([
      `${replacement} was told this morning ${p.sub} was safe. ${p.Sub} sits down in the chair anyway, because there is nowhere else to sit.`,
      `The name is ${replacement}'s and it takes ${p.obj} a full second to move, which the whole house sees.`,
      `${replacement} looks directly at ${hoh} while walking to the empty chair. ${hoh} keeps their eyes on the table.`,
      `"Safe" turned out to have a shelf life of about four hours, and ${replacement} learns that standing up.`,
    ], ctx, replacement) : _variant([
      `${replacement} takes the chair without surprise. ${p.Sub} has been counting on being here since the veto came off the wall.`,
      `Nobody in the room is astonished, least of all ${replacement}, and ${p.sub} sits down like it is a job.`,
      `${replacement} replaces ${saved || 'the saved nominee'} and spends the walk to the chair working out who to talk to first.`,
    ], ctx, replacement);

    if (hoh) {
      api.addBond(replacement, hoh, blindsided ? -2.4 : -1.0);
      api.remember(replacement, hoh, 'betrayal', blindsided ? 3 : 1,
        { about: blindsided ? 'told me I was safe and put me up' : 'used me as the replacement' });
      api.setTarget(replacement, hoh, 'put me up after the veto');
    }
    if (saved) api.remember(replacement, saved, 'grievance', 1, { about: 'came off and I went up' });
    api.popDelta(replacement, blindsided ? 2 : 0);
    return {
      text, players: [replacement, hoh].filter(Boolean),
      badgeText: blindsided ? 'TOLD I WAS SAFE' : 'THE REPLACEMENT',
      badgeClass: 'red',
    };
  },
};

/**
 * The saved nominee has to live with being saved.
 *
 * Coming off the block puts somebody else on it, and the house keeps score of
 * who benefited from whom.
 */
const savedGuilt = {
  id: 'power-saved-guilt',
  location: 'living-room',
  category: 'ceremonies',
  weight(house, ctx) {
    const f = actFacts(ctx);
    return f.saved && f.replacement ? band(6) : 0;
  },
  fire(house, ctx, api) {
    const { saved, replacement } = actFacts(ctx);
    const p = pronouns(saved);
    const decent = isNice(saved) || pStats(saved).loyalty >= 6;

    const text = decent ? _variant([
      `${saved} finds ${replacement} within the hour and says the thing nobody says: this is not how ${p.sub} wanted it.`,
      `${saved} is off the block and cannot make ${p.ref} enjoy it while ${replacement} is sitting in ${p.posAdj} chair.`,
      `"I didn't ask for that." ${replacement} says ${p.sub} knows. Neither of them quite believes the conversation helped.`,
    ], ctx, saved, replacement) : _variant([
      `${saved} is off the block and visibly relieved about it, which ${replacement} watches from the chair ${saved} just left.`,
      `${saved} celebrates a little too openly for somebody whose safety cost ${replacement} theirs.`,
      `${saved} does not go and find ${replacement}. Everybody notices that ${p.sub} does not.`,
    ], ctx, saved, replacement);

    api.addBond(saved, replacement, decent ? 0.5 : -1.2);
    if (decent) api.remember(replacement, saved, 'trust', 1, { about: 'at least came and said it' });
    else {
      api.remember(replacement, saved, 'grievance', 2, { about: 'enjoyed my seat' });
      api.popDelta(saved, -1);
    }
    return {
      text, players: [saved, replacement],
      badgeText: decent ? 'SAYS IT TO THEIR FACE' : 'DOES NOT LOOK BACK',
      badgeClass: decent ? 'green' : 'red',
    };
  },
};


/**
 * The door does not open.
 *
 * The HOH room is the one private space in the house and the HOH controls who
 * is in it. Being turned away is public — everyone sees who came back down the
 * stairs — and it tells the whole house where somebody stands a day before the
 * ceremony does.
 */
const hohRefusesEntry = {
  id: 'power-hoh-refuses',
  location: 'hoh-room',
  category: 'phases',
  weight(house, ctx) {
    const hoh = _hoh(ctx);
    if (!hoh || house.length < 5 || _blockKnown(ctx)) return 0;
    // Only somebody the HOH already dislikes gets turned away.
    const worst = furthestFrom(hoh, _others(house, hoh));
    return worst && perceived(hoh, worst) <= -1 ? band(6) : 0;
  },
  fire(house, ctx, api) {
    const hoh = _hoh(ctx);
    const turned = furthestFrom(hoh, _others(house, hoh));
    const p = pronouns(turned);
    const text = _variant([
      `${turned} knocks on the HOH door and is told, through it, that now is not a good time. The stairs are long on the way back down.`,
      `${hoh} does not open the door for ${turned}. Four people in the kitchen watch ${p.obj} come back down and nobody asks how it went.`,
      `"I'm sleeping." ${hoh} is not sleeping, ${turned} knows ${hoh} is not sleeping, and that is the message.`,
      `The HOH room is the only door in this house that locks, and today ${hoh} uses it on ${turned}.`,
    ], ctx, hoh, turned);

    api.addBond(hoh, turned, -1.2);
    api.remember(turned, hoh, 'grievance', 2, { about: 'would not open the door' });
    api.suspicion(turned, hoh, 1.5);
    // The house reads the closed door as a nomination announcement.
    _others(house, hoh, turned).forEach(w => api.suspicion(w, hoh, 0.2));
    api.popDelta(hoh, -1);
    return {
      text, players: [hoh, turned],
      badgeText: 'DOOR STAYS SHUT', badgeClass: 'red',
    };
  },
};

/**
 * "Pick me for the veto."
 *
 * The draw is the last lever anybody has before the block is final, so people
 * lobby for it — and whether the HOH agrees says more than the ceremony will.
 */
const vetoDrawLobby = {
  id: 'power-veto-draw-lobby',
  location: 'hoh-room',
  category: 'deals',
  weight(house, ctx) {
    const hoh = _hoh(ctx);
    // Between the nominations and the veto: the only window this makes sense in.
    const window = ctx?.phase === 'post-noms' || ctx?.act === 'nominations';
    return hoh && window && _noms(ctx).length && house.length >= 6 ? band(8) : 0;
  },
  fire(house, ctx, api, rng) {
    const hoh = _hoh(ctx);
    const noms = _noms(ctx);
    const asker = _quiet(_others(house, hoh, ...noms))[0] || _others(house, hoh)[0];
    const p = pronouns(asker);
    const trusted = perceived(hoh, asker) >= 1.5;
    const agrees = trusted && rng() > 0.3;

    const text = agrees ? _variant([
      `"If I get drawn, I'm using it how you want it used." ${hoh} does not say yes out loud, which ${asker} correctly reads as yes.`,
      `${asker} asks to be in the draw and offers the only currency there is: ${p.posAdj} vote, in advance, in writing if it were allowed.`,
      `${asker} makes the case that ${p.sub} is the safest pair of hands for that veto. ${hoh} agrees, and both of them know what has just been traded.`,
    ], ctx, hoh, asker) : _variant([
      `${asker} lobbies to be in the veto draw. ${hoh} makes no promises, and the lack of one is deafening.`,
      `${hoh} says, “I'd rather choose somebody neutral.” ${asker} hears the word clearly: ${hoh} does not trust ${pronouns(asker).obj} with the veto.`,
      `${asker} asks ${hoh} to choose them if Houseguest's Choice is drawn. ${hoh} says, “We'll see what happens,” and changes the subject.`,
    ], ctx, hoh, asker);

    if (agrees) {
      api.sideDeal(hoh, asker, 'veto', { genuine: true, about: 'the veto goes the way I want it' });
      api.addBond(hoh, asker, 0.9);
      api.remember(hoh, asker, 'obligation', 2, { about: 'promised me the veto' });
    } else {
      api.addBond(hoh, asker, -0.4);
      api.suspicion(asker, hoh, 0.9);
      api.remember(asker, hoh, 'grievance', 1, { about: 'would not have me in the draw' });
    }
    return {
      text, players: [hoh, asker],
      badgeText: agrees ? 'A HAND SHAKES ON IT' : 'NO PROMISES',
      badgeClass: agrees ? 'blue' : 'grey',
    };
  },
};

/**
 * "I'm going to take you off."
 *
 * The veto holder tells a nominee before the ceremony. Said early it is the
 * strongest bond in the house; said and then broken it is the worst betrayal
 * the format has, because the nominee stopped campaigning on the strength of it.
 */
const vetoPromise = {
  id: 'power-veto-promise',
  location: 'pantry',
  category: 'deals',
  weight(house, ctx) {
    const holder = ctx?.vetoWinner || ctx?.week?.vetoWinner;
    const noms = _noms(ctx);
    if (!holder || !noms.length || noms.includes(holder)) return 0;
    return ctx?.phase === 'post-veto' || ctx?.act === 'veto' ? band(9) : 0;
  },
  fire(house, ctx, api) {
    const holder = ctx.vetoWinner || ctx.week?.vetoWinner;
    const noms = _noms(ctx);
    const saved = noms.slice().sort((a, b) => perceived(holder, b) - perceived(holder, a))[0];
    const other = noms.find(n => n !== saved);
    const p = pronouns(holder);
    const means = perceived(holder, saved) >= 2 || sharesAlliance(holder, saved);

    const text = means ? _variant([
      `${holder} finds ${saved} in the pantry and says it plainly: the veto is coming off the wall and ${saved} is coming with it.`,
      `"You're getting off that block." ${saved} has been braced for the opposite answer and takes a second to work out ${p.sub} means it.`,
      `${holder} tells ${saved} first, before the HOH, before anybody. That order is the whole message.`,
    ], ctx, holder, saved) : _variant([
      `${holder} tells ${saved} the veto is coming ${p.posAdj} way. ${holder} has not decided that at all.`,
      `"Don't worry about it." ${saved} stops campaigning that afternoon, which was the point of saying it.`,
      `${holder} makes ${saved} a promise that costs nothing today and will cost a great deal on Thursday.`,
    ], ctx, holder, saved);

    api.sideDeal(holder, saved, 'veto', { genuine: means, about: 'promised the veto' });
    api.addBond(holder, saved, means ? 1.4 : 0.6);
    api.remember(saved, holder, means ? 'trust' : 'promise', 3, { about: 'said I was coming off' });
    if (other) api.suspicion(other, holder, 1.2);
    return {
      text, players: [holder, saved],
      badgeText: means ? 'MEANS IT' : 'SAYS IT ANYWAY',
      badgeClass: means ? 'green' : 'grey',
    };
  },
};

// ── the room itself ───────────────────────────────────────────────────
//
// The HOH room is the only private space in this house and the only reward
// that is not food: a lock, a bed nobody else sleeps in, and photographs of
// people the houseguest has not seen in weeks. It only ever appeared as a place
// to be pitched at. These are about the room.

const hohRoomReveal = {
  id: 'power-hoh-room-reveal',
  location: 'hoh-room',
  category: 'house-life',
  weight(house, ctx) {
    // The night it opens, before the block exists.
    if (!_hoh(ctx) || _blockKnown(ctx)) return 0;
    return band(ctx?.phase === 'post-hoh' ? 12 : 3);
  },
  fire(house, ctx, api) {
    const hoh = _hoh(ctx);
    const p = pronouns(hoh);
    const s = pStats(hoh);
    const guests = _quiet(_others(house, hoh)).slice(0, 3);
    const holdsIt = s.temperament >= 6;
    const text = _variant([
      `The door opens and the house piles in behind ${hoh} — the bed, the shower nobody else gets, the basket of food. Then ${hoh} finds the photographs, and the room goes quiet the way it always does. ${guests[0] || 'Somebody'} looks at the floor rather than at ${p.obj}.`,
      `${hoh} reads the letter out loud and gets four lines in before ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} to stop. Nobody says anything. ${guests[0] || 'Somebody'} puts a hand on ${p.posAdj} shoulder and everybody pretends to be looking at the photographs.`,
      `Photographs first, then the letter, then the food. ${hoh} has been thinking about this moment since the competition ended. ${holdsIt ? `${p.Sub} ${p.sub === 'they' ? 'get' : 'gets'} through the letter.` : `${p.Sub} ${p.sub === 'they' ? 'do' : 'does'} not get through the letter.`}`,
      `For twenty minutes the HOH room is the warmest place in the house and everyone in it means what they are saying. ${hoh} will remember that later, when the same people are counting votes on ${p.obj}.`,
    ], ctx, hoh);

    // A room full of people being kind to you is worth something, and everybody
    // in it knows it is temporary.
    guests.forEach(g => { api.addBond(hoh, g, 0.7); api.remember(hoh, g, 'was-there', 1); });
    api.popDelta(hoh, 2);
    return { text, players: [hoh, ...guests], badgeText: 'THE ROOM OPENS', badgeClass: 'gold' };
  },
};

const hohRoomCourt = {
  id: 'power-hoh-room-court',
  location: 'hoh-room',
  category: 'social',
  weight(house, ctx) {
    const hoh = _hoh(ctx);
    if (!hoh || house.length < 5) return 0;
    // A sociable Head of Household fills the room; a private one does not.
    return band((pStats(hoh).social / 10) * 9);
  },
  fire(house, ctx, api) {
    const hoh = _hoh(ctx);
    const inner = _quiet(_others(house, hoh)).slice(0, 3);
    const outside = _others(house, hoh, ...inner)[0] || null;
    const text = _variant([
      `The HOH room fills up after lights-out and stays full. ${inner.join(', ')} are on the bed with ${hoh}; everybody else is downstairs listening to the ceiling.`,
      `${hoh} holds court upstairs for two hours. Nothing is decided. Being in the room is the point, and ${outside || 'the rest of the house'} is not in the room.`,
      `Somebody starts a game up there and the laughing carries down the stairs. ${outside ? `${outside} turns over and puts a pillow on ${pronouns(outside).posAdj} head.` : 'The rest of the house pretends not to hear it.'}`,
      `${inner.slice(0, 2).join(' and ')} have been in the HOH room since dinner. In this house that is not a friendship, it is a public statement about who is safe.`,
    ], ctx, hoh, ...inner);

    inner.forEach(n => { api.addBond(hoh, n, 0.8); inner.forEach(m => { if (m !== n) api.addBond(n, m, 0.4); }); });
    // Being visibly outside the room is its own information.
    if (outside) {
      api.suspicion(outside, hoh, 0.8);
      api.remember(outside, hoh, 'left-me-out', 1);
      api.addBond(outside, hoh, -0.4);
    }
    return { text, players: [hoh, ...inner, outside].filter(Boolean), badgeText: 'HOLDING COURT', badgeClass: 'blue' };
  },
};

const hohRoomOverstay = {
  id: 'power-hoh-room-overstay',
  location: 'hoh-room',
  category: 'social',
  weight(house, ctx) {
    const hoh = _hoh(ctx);
    if (!hoh || house.length < 5) return 0;
    // A private HOH with somebody who will not read the room.
    return band(((10 - pStats(hoh).social) / 10) * 8);
  },
  fire(house, ctx, api) {
    const hoh = _hoh(ctx);
    const clinger = _quiet(_others(house, hoh)).find(n => pStats(n).intuition <= 6) || _others(house, hoh)[0];
    const p = pronouns(hoh);
    const text = _variant([
      `${clinger} does not leave. ${hoh} has said goodnight twice in the politest possible way and ${clinger} is still sitting on the end of the bed, still talking.`,
      `It is past three and ${clinger} is still up here. ${hoh} has stopped answering in sentences. ${clinger} does not appear to have noticed.`,
      `${hoh} wanted one night alone in a room with a door. ${clinger} has been in it since eight, and ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} too polite to say the thing that would end it.`,
      `"You can stay as long as you want," ${hoh} says, meaning the opposite. ${clinger} takes it at face value and settles further into the bed.`,
    ], ctx, hoh, clinger);

    api.addBond(hoh, clinger, -0.8);
    api.suspicion(hoh, clinger, 0.5);
    api.remember(hoh, clinger, 'cannot-read-a-room', 1);
    return { text, players: [hoh, clinger], badgeText: 'WILL NOT LEAVE', badgeClass: 'orange' };
  },
};

const hohRoomQueue = {
  id: 'power-hoh-room-queue',
  location: 'hoh-room',
  category: 'deals',
  weight(house, ctx) {
    // The day before nominations, everybody suddenly needs five minutes.
    if (!_hoh(ctx) || _blockKnown(ctx) || house.length < 6) return 0;
    return band(10);
  },
  fire(house, ctx, api) {
    const hoh = _hoh(ctx);
    const queue = _quiet(_others(house, hoh)).slice(0, 3);
    const p = pronouns(hoh);
    const text = _variant([
      `There is a queue on the stairs. ${queue.join(', then ')} — each of them wanting five minutes, each of them certain their five minutes is the important one. ${hoh} listens to all three and believes about half of one.`,
      `${queue[0]} goes up, comes down looking pleased. ${queue[1]} goes up. ${hoh} has heard the same three sentences from everybody and has started counting how many of them name the same person.`,
      `Nobody says the word "queue" but there is one on the HOH-room stairs, and everybody downstairs is watching who joins it and in what order.`,
      `${hoh} does not leave the room all afternoon and does not need to. The house comes to ${p.obj}, one at a time, saying versions of the same thing.`,
    ], ctx, hoh, ...queue);

    queue.forEach((n, i) => {
      api.addBond(hoh, n, 0.3 - i * 0.15);
      api.suspicion(hoh, n, 0.4);
      api.remember(hoh, n, 'came-to-me', 1);
    });
    return { text, players: [hoh, ...queue], badgeText: 'A QUEUE ON THE STAIRS', badgeClass: 'grey' };
  },
};

const hohRoomLastNight = {
  id: 'power-hoh-room-last-night',
  location: 'hoh-room',
  category: 'house-life',
  weight(house, ctx) {
    // Eviction night: the week is over and so is the room.
    if (!_hoh(ctx)) return 0;
    return band(ctx?.act === 'eviction' || ctx?.phase === 'campaign' ? 9 : 0);
  },
  fire(house, ctx, api) {
    const hoh = _hoh(ctx);
    const p = pronouns(hoh);
    const next = _others(house, hoh)[0] || null;
    const text = _variant([
      `${hoh} takes the photographs down before anybody asks ${p.obj} to. Whoever wins tomorrow will want the wall, and ${p.sub} ${p.sub === 'they' ? 'would' : 'would'} rather do it now than be watched doing it.`,
      `Last night in the room. ${hoh} sleeps badly in the good bed, which ${p.sub} ${p.sub === 'they' ? 'find' : 'finds'} funny in a way ${p.sub} cannot explain to anybody.`,
      `The room goes back tomorrow and with it the only door in this house that locks. ${hoh} sits in it alone for a while, doing the arithmetic on who ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} annoyed this week.`,
      `${hoh} packs the basket up. A week of being the person everybody was nice to is ending, and ${p.sub} ${p.sub === 'they' ? 'know' : 'knows'} exactly how much of it was real.`,
    ], ctx, hoh);

    api.popDelta(hoh, 1);
    if (next) api.remember(hoh, next, 'watching-who-wants-it', 1);
    return { text, players: [hoh], badgeText: 'LAST NIGHT IN THE ROOM', badgeClass: 'grey' };
  },
};

const hohRoomSpy = {
  id: 'power-hoh-room-spy',
  location: 'hoh-room',
  category: 'social',
  weight(house, ctx) {
    const hoh = _hoh(ctx);
    if (!hoh || house.length < 5) return 0;
    // Somebody who notices things, noticing who keeps going up there.
    const watcher = _quiet(_others(house, hoh)).find(n => pStats(n).intuition >= 6);
    return watcher ? band((pStats(watcher).intuition / 10) * 8) : 0;
  },
  fire(house, ctx, api) {
    const hoh = _hoh(ctx);
    const watcher = _quiet(_others(house, hoh)).find(n => pStats(n).intuition >= 6) || _others(house, hoh)[0];
    const favourite = _others(house, hoh, watcher)
      .sort((a, b) => bond(hoh, b) - bond(hoh, a))[0];
    const p = pronouns(watcher);
    const text = _variant([
      `${watcher} is not counting on purpose, but ${p.sub} ${p.sub === 'they' ? 'know' : 'knows'} that ${favourite} has been up those stairs four times today and ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} been up none.`,
      `${watcher} works out that the door has closed behind ${favourite} three times this week. Doors closing is the only reliable information in this house.`,
      `Nobody tells ${watcher} anything. ${p.Sub} ${p.sub === 'they' ? 'do' : 'does'} not need telling — ${p.sub} can hear ${favourite} laughing through the ceiling.`,
      `${watcher} starts keeping a tally of who goes up to see ${hoh}. By the end of the day ${favourite} is winning it by a distance.`,
    ], ctx, watcher, favourite);

    api.suspicion(watcher, hoh, 1.1);
    api.suspicion(watcher, favourite, 1.3);
    api.setTarget(watcher, favourite, 'lives in the HOH room');
    api.remember(watcher, favourite, 'in-with-power', 2);
    return { text, players: [watcher, favourite, hoh], badgeText: 'COUNTING THE STAIRS', badgeClass: 'purple' };
  },
};

// ── the days before the ceremony ──────────────────────────────────────
//
// The visual player used to print a panel headed "private intent" listing the
// target, the pawn and the backdoor above the ceremony. Nobody announces that,
// and printing it spoils the only suspense the week has. The Head of Household
// works it out in the HOH room, out loud, with somebody — and the rest of the
// house works on it from downstairs, guessing. That is where this belongs.

const hohDeciding = {
  id: 'power-hoh-deciding',
  location: 'hoh-room',
  category: 'deals',
  weight(house, ctx) {
    const hoh = _hoh(ctx);
    if (!hoh || _blockKnown(ctx) || house.length < 5) return 0;
    if (!targetOf(hoh)) return 0;
    return band(11);
  },
  fire(house, ctx, api) {
    const hoh = _hoh(ctx);
    const mark = targetOf(hoh);
    // Somebody they trust enough to say a name to. That is the whole risk.
    const confidant = closestTo(hoh, _others(house, hoh, mark)) || _others(house, hoh, mark)[0];
    const p = pronouns(hoh);
    const s = pStats(hoh);
    const text = _variant([
      `${hoh} says the name out loud for the first time. "<strong>${mark}</strong>." ${confidant} does not react fast enough, and ${hoh} notices that too.`,
      `"If I don't do it this week, somebody else gets the chance and I lose it." ${hoh} is talking about <strong>${mark}</strong>, and ${confidant} already knew that before the sentence finished.`,
      `${hoh} lays it out for ${confidant} like a problem with one answer: <strong>${mark}</strong> goes up, and the only question left is who sits beside ${pronouns(mark).obj}.`,
      `${confidant} asks who it is. ${hoh} takes long enough to answer that ${confidant} works it out anyway. "<strong>${mark}</strong>." "Yeah," ${confidant} says. "Yeah."`,
    ], ctx, hoh, mark);

    api.addBond(hoh, confidant, 0.9);
    api.remember(confidant, hoh, 'told-me-first', 2, { about: mark });
    // Being told first is the most valuable thing in this house, and it is also
    // the moment the plan stops being private.
    api.suspicion(confidant, mark, 0.5);
    return { text, players: [hoh, confidant, mark].filter(Boolean), badgeText: 'A NAME OUT LOUD', badgeClass: 'gold' };
  },
};

const pawnAsk = {
  id: 'power-pawn-ask',
  location: 'hoh-room',
  category: 'deals',
  weight(house, ctx) {
    const hoh = _hoh(ctx);
    if (!hoh || _blockKnown(ctx) || house.length < 6) return 0;
    return band(9);
  },
  fire(house, ctx, api) {
    const hoh = _hoh(ctx);
    const mark = targetOf(hoh);
    // You ask somebody who likes you. That is what makes it a cruel favour.
    const pawn = closestTo(hoh, _others(house, hoh, mark)) || _others(house, hoh, mark)[0];
    const s = pStats(pawn);
    const p = pronouns(pawn);
    // Whether they say yes is about nerve and trust, not niceness.
    const agrees = (s.loyalty * 0.5 + s.boldness * 0.35 + bond(pawn, hoh) * 0.6) > 5.4;
    const text = agrees ? _variant([
      `"I need you to go up beside ${mark ? `<strong>${mark}</strong>` : 'them'}. You are not the one going home." ${pawn} says yes before ${hoh} has finished the sentence, and spends the rest of the night wondering why ${p.sub} did that.`,
      `${hoh} asks ${pawn} to be the pawn. ${pawn} agrees, on the condition that ${hoh} says it to ${p.posAdj} face if that ever changes.`,
      `"Pawns go home," ${pawn} says. "Not this one," ${hoh} says. ${pawn} agrees anyway, which tells ${hoh} everything about how safe ${pawn} feels.`,
    ], ctx, hoh, pawn) : _variant([
      `${hoh} asks ${pawn} to sit beside ${mark || 'them'}. ${pawn} says no. Nobody has refused the Head of Household this directly before, and the room does not quite know what to do with it.`,
      `"Ask somebody else." ${pawn} does not raise ${p.posAdj} voice and does not move. ${hoh} is going to have to nominate ${p.obj} anyway now, and they both know it.`,
      `${pawn} has watched three pawns go home and says so. ${hoh} runs out of reassurance about a minute before ${pawn} runs out of patience.`,
    ], ctx, hoh, pawn);

    if (agrees) {
      api.sideDeal(hoh, pawn, 'safety', { genuine: true, about: 'you are not the one going home' });
      api.addBond(hoh, pawn, 1.1);
      api.remember(pawn, hoh, 'asked-me-to-sit', 2);
    } else {
      api.addBond(hoh, pawn, -1.2);
      api.suspicion(hoh, pawn, 1.1);
      api.setTarget(hoh, pawn, 'refused to go up for me');
      api.remember(hoh, pawn, 'told-me-no', 2);
    }
    return {
      text, players: [hoh, pawn],
      badgeText: agrees ? 'AGREES TO SIT' : 'REFUSES THE CHAIR',
      badgeClass: agrees ? 'green' : 'red',
    };
  },
};

const backdoorPlan = {
  id: 'power-backdoor-plan',
  location: 'hoh-room',
  category: 'deals',
  weight(house, ctx) {
    // Only once the block exists, and only when there is a real plan behind it.
    const hoh = _hoh(ctx);
    if (!hoh || !_blockKnown(ctx)) return 0;
    const real = ctx?.week?.plan?.backdoorTarget;
    // A backdoor is putting somebody up who is NOT up. Once the target is on
    // the block there is nothing left to explain, and the card was describing a
    // plan to nominate a houseguest who had already been nominated.
    if (!real || _noms(ctx).includes(real)) return 0;
    // And the person holding the veto has to be somebody who might use it.
    if (ctx?.vetoWinner === real) return 0;
    return band(13);
  },
  fire(house, ctx, api) {
    const hoh = _hoh(ctx);
    const real = ctx.week.plan.backdoorTarget;
    const noms = _noms(ctx);
    const ally = closestTo(hoh, _others(house, hoh, real, ...noms)) || _others(house, hoh, real)[0];
    const p = pronouns(hoh);
    const text = _variant([
      `"Those two were never the point." ${hoh} explains it to ${ally} in one breath: the veto comes down, somebody comes off, and <strong>${real}</strong> goes up after losing the chance to play for safety.`,
      `${hoh} draws it out for ${ally} — two names on the block who are not the target, a veto, and <strong>${real}</strong> taking the empty chair without ever getting a shot at the necklace.`,
      `"If I put ${real} up at nominations, ${pronouns(real).sub} could get picked for veto and save ${pronouns(real).ref}." ${hoh} did not. The plan is to wait until that chance is gone.`,
      `${ally} asks why ${noms.join(' and ')}. ${hoh} smiles at that. The answer is <strong>${real}</strong>, and it does not happen until the veto.`,
    ], ctx, hoh, real, ally);

    api.remember(ally, hoh, 'showed-me-the-plan', 3, { about: real });
    api.addBond(hoh, ally, 0.8);
    api.setTarget(hoh, real, 'the whole week is about them');
    api.suspicion(ally, real, 0.6);
    // The target is listed even though they are not in the room. A card about
    // somebody is a card they belong on — the portraits say who the scene is
    // ABOUT, not who is standing there.
    return { text, players: [hoh, ally, real].filter(Boolean), badgeText: 'THE REAL PLAN', badgeClass: 'purple' };
  },
};

const nomEveGuessing = {
  id: 'power-nom-eve-guessing',
  location: 'living-room',
  category: 'social',
  weight(house, ctx) {
    const hoh = _hoh(ctx);
    if (!hoh || _blockKnown(ctx) || house.length < 5) return 0;
    return band(10);
  },
  fire(house, ctx, api) {
    const hoh = _hoh(ctx);
    const talkers = _quiet(_others(house, hoh)).slice(0, 2);
    const [a, b] = talkers;
    const real = targetOf(hoh);
    // What the house GUESSES, which is the whole game — and it is often wrong.
    const guess = _others(house, hoh, a, b).sort((x, y) => threat(y) - threat(x))[0] || real;
    const rightGuess = guess === real;
    const p = pronouns(a);
    const text = _variant([
      `${a} and ${b} take opposite ends of the living-room couch and run through the house name by name. They land on <strong>${guess}</strong>. ${rightGuess ? 'They are right, and neither looks pleased about it.' : 'They are wrong. Morning will handle that.'}`,
      `"It's ${guess}. It has to be ${guess}." ${a} says it like arithmetic from the living-room couch. ${b} is not so sure, and ${b} is ${rightGuess ? 'wrong' : 'right'}.`,
      `Nobody is ready to go to bed before nominations. In the living room, ${a} counts every person ${hoh} spoke to that day while ${b} keeps finding reasons the list must be wrong.`,
      `${b} asks ${a} across the living room, "Am I going up?" ${a} says no. ${a} cannot possibly know that, but it is the only answer that lets the conversation end.`,
    ], ctx, a, b, guess);

    api.suspicion(a, hoh, 0.5);
    api.suspicion(b, hoh, 0.5);
    api.addBond(a, b, 0.5);
    if (rightGuess) api.remember(a, guess, 'called-it', 1);
    return {
      text, players: [a, b, guess].filter(Boolean),
      badgeText: 'THE NIGHT BEFORE', badgeClass: rightGuess ? 'orange' : 'grey',
    };
  },
};

// ── after the veto ceremony ──────────────────────────────────────────
//
// The ceremony resolved in a line and the house went straight back to talking
// about nothing. Everything below happens in the hour after somebody's week
// changed: the person who took themselves off it, the person who took their
// chair, the Head of Household who had to name them, and the room deciding
// whether any of it was a surprise.

const savedThemselves = {
  id: 'power-saved-themselves',
  category: 'deals',
  weight(house, ctx) {
    const { saved } = actFacts(ctx);
    // Only when the person who came down is the one who won it.
    if (!saved || saved !== ctx?.vetoWinner) return 0;
    return afterCeremony(ctx, 12);
  },
  fire(house, ctx, api) {
    const { saved } = actFacts(ctx);
    const hoh = _hoh(ctx);
    const p = pronouns(saved);
    const s = pStats(saved);
    const text = _variant([
      `${saved} took ${p.ref} off the block with ${p.posAdj} own hands and nobody in this house can take that away from ${p.obj}. ${p.Sub} also forced ${hoh} to put another name in the chair, and ${p.sub} ${p.sub === 'they' ? 'know' : 'knows'} that too.`,
      `There is a particular kind of quiet that follows somebody saving themselves. ${saved} is safe, everybody else is one chair short, and the room is doing the arithmetic out loud.`,
      `${saved} does not celebrate. ${p.Sub} ${p.sub === 'they' ? 'have' : 'has'} been on the block once now, which means the house has already had the conversation about ${p.obj} — and will have it again.`,
      `"I didn't have a choice." ${saved} says it to everybody who will listen. Nobody has suggested ${p.sub} did.`,
    ], ctx, saved, hoh);
    api.popDelta(saved, 2);
    if (hoh) {
      api.remember(hoh, saved, 'cost-me-a-week', 2);
      api.suspicion(hoh, saved, 0.7);
      api.addBond(hoh, saved, -0.5);
    }
    return { text, players: [saved, hoh].filter(Boolean), badgeText: 'SAVED THEMSELVES', badgeClass: 'green' };
  },
};

const replacementReacts = {
  id: 'power-replacement-reacts',
  category: 'social',
  weight(house, ctx) {
    const { replacement } = actFacts(ctx);
    return replacement ? afterCeremony(ctx, 13) : 0;
  },
  fire(house, ctx, api) {
    const { replacement, saved } = actFacts(ctx);
    const hoh = _hoh(ctx);
    const s = pStats(replacement);
    const p = pronouns(replacement);
    const arch = archetype(replacement);
    // Anger, despair, or a very cold calm — decided by who they are, not by a
    // roll, so the same houseguest reacts the same way twice.
    const mode = (s.temperament <= 4 || arch === 'hothead') ? 'angry'
      : (s.boldness <= 4 || arch === 'goat') ? 'crushed' : 'cold';
    const text = mode === 'angry' ? _variant([
      `${replacement} is on the block twenty minutes after ${p.sub} ${p.sub === 'they' ? 'were' : 'was'} safe, and does not do the thing where you take it well. ${hoh} gets the whole of it, in the kitchen, in front of everybody.`,
      `"Say it to me properly." ${replacement} wants ${hoh} to explain it standing up, and ${hoh} does, and it does not help either of them.`,
      `${replacement} slams a cupboard that did nothing to ${p.obj}. Two people leave the room. ${saved || 'The person who came down'} is not one of them, which ${replacement} notices.`,
    ], ctx, replacement, hoh) : mode === 'crushed' ? _variant([
      `${replacement} says it is fine. ${p.Sub} ${p.sub === 'they' ? 'say' : 'says'} it four times in ten minutes, to four different people, and by the last one ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} stopped meaning it.`,
      `Nobody sees ${replacement} for two hours. When ${p.sub} ${p.sub === 'they' ? 'come' : 'comes'} back out ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} washed ${p.posAdj} face and is being very pleasant to everybody.`,
      `${replacement} sits down on the end of a bed and stays there. Somebody brings ${p.obj} a plate. It goes cold.`,
    ], ctx, replacement, hoh) : _variant([
      `${replacement} congratulates ${saved || 'them'} on the veto, thanks ${hoh} for being straight about it, and starts counting votes before the room has emptied.`,
      `${replacement} takes it without a flicker. Within the hour ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} spoken to four people and ${hoh} is no longer certain this was the easy option.`,
      `"That's the game." ${replacement} means it, which is worse for ${hoh} than if ${p.sub} did not.`,
    ], ctx, replacement, hoh);

    if (hoh) {
      api.addBond(replacement, hoh, mode === 'angry' ? -2.2 : mode === 'crushed' ? -1.1 : -0.6);
      api.setTarget(replacement, hoh, 'put me up when I was already safe');
      api.remember(replacement, hoh, 'renominated-me', 3);
      if (mode === 'angry') api.popDelta(replacement, -1);
      if (mode === 'cold') api.popDelta(replacement, 1);
    }
    if (saved) api.addBond(replacement, saved, -0.7);
    return {
      text, players: [replacement, hoh].filter(Boolean),
      badgeText: mode === 'angry' ? 'TAKES IT BADLY' : mode === 'crushed' ? 'SAYS IT IS FINE' : 'TAKES IT COLDLY',
      badgeClass: mode === 'angry' ? 'red' : mode === 'crushed' ? 'blue' : 'grey',
    };
  },
};

const vetoHolderFallout = {
  id: 'power-veto-fallout',
  category: 'deals',
  weight(house, ctx) {
    const { saved } = actFacts(ctx);
    const holder = ctx?.vetoWinner;
    // Somebody else's veto, used on somebody who was not them.
    if (!holder || !saved || holder === saved || holder === _hoh(ctx)) return 0;
    // Weighted to saturate rather than to compete. Its siblings fire on things
    // that happen most weeks — a nominee saving themselves, a replacement
    // reacting — while this one needs somebody who was neither nominated nor
    // Head of Household to win the veto AND spend it on a third person, which
    // is three unlikely things at once and turned up three times in forty
    // seasons. When it does happen an ally has just torched the HOH's week in
    // public, so on those rare weeks it should be the scene, not a coin toss.
    return afterCeremony(ctx, 22);
  },
  fire(house, ctx, api) {
    const holder = ctx.vetoWinner;
    const { saved, replacement } = actFacts(ctx);
    const hoh = _hoh(ctx);
    const p = pronouns(holder);
    const text = _variant([
      `${hoh} does not raise it with ${holder} and that is the problem. They are perfectly polite to each other for the rest of the day and everybody in the house can hear it.`,
      `"You could have told me first." ${hoh} is not talking about the veto. ${holder} understands that and says nothing, because there is no answer that helps.`,
      `${holder} used it on ${saved} and now has to live in a house with ${replacement || 'the person who took the chair'}. ${p.Sub} ${p.sub === 'they' ? 'have' : 'has'} started rehearsing the conversation and has not had it yet.`,
      `The veto came off the wall and ${holder} used it, which means ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} now a person who makes moves. The house adjusts its list accordingly.`,
    ], ctx, holder, hoh, saved);

    if (hoh) {
      api.addBond(holder, hoh, -1.4);
      api.suspicion(hoh, holder, 1.2);
      api.remember(hoh, holder, 'crossed-me', 2, { about: 'the veto' });
    }
    if (saved) { api.addBond(holder, saved, 1.6); api.remember(saved, holder, 'saved-me', 3); }
    api.popDelta(holder, 1);
    return { text, players: [holder, hoh].filter(Boolean), badgeText: 'BLOOD ON THEIR HANDS', badgeClass: 'red' };
  },
};

const nobodySurprised = {
  id: 'power-veto-no-surprise',
  category: 'house-life',
  weight(house, ctx) {
    const f = actFacts(ctx);
    // The weeks that go exactly as expected: nobody came down, or the person
    // who came down was always going to.
    const flat = !f.saved || f.saved === f.pawn || f.saved === ctx?.vetoWinner;
    return flat ? afterCeremony(ctx, 7) : 0;
  },
  fire(house, ctx, api) {
    const f = actFacts(ctx);
    const noms = _noms(ctx);
    const watchers = _quiet(_others(house, ...noms, _hoh(ctx))).slice(0, 2);
    const text = _variant([
      `The ceremony takes four minutes and surprises nobody. Two people go back to bed. The house has known how this week ends since Monday.`,
      `Nothing about the veto changes anything, which everybody privately expected and nobody says out loud in case it sounds like gloating.`,
      `${watchers[0] || 'Somebody'} asks what happened at the ceremony, gets the answer and goes straight back to what ${pronouns(watchers[0] || 'Somebody').sub} ${pronouns(watchers[0] || 'Somebody').sub === 'they' ? 'were' : 'was'} doing.`,
      `There is no scene after it. ${noms.join(' and ')} are the same two names they were this morning, and the vote was decided before any of it.`,
    ], ctx, ...watchers);
    // A week with no surprise is still a week: the block hardens.
    noms.forEach(n => watchers.forEach(w => api.suspicion(w, n, 0.2)));
    return { text, players: watchers.filter(Boolean), badgeText: 'NOBODY IS SURPRISED', badgeClass: 'grey' };
  },
};

// There is deliberately no "saved houseguest thanks the holder" event here.
// ceremonies.js already has veto-saved-gratitude, which fires at the ceremony
// itself — where the thanks actually happens — and weights it by how
// surprising the save was. A second one written here only competed with it for
// the same beat, and won, which killed the better version.

// ── working the draw ─────────────────────────────────────────────────
//
// The bag has not been opened yet and everybody already knows who they want in
// it. power-veto-draw-lobby covers somebody offering the Head of Household a
// safe pair of hands. These two are the other directions: a houseguest selling
// themselves to a nominee — pick me and I will get you down — and somebody who
// has worked out they are the real target trying to get into a competition
// they cannot afford to be outside of.

const pickMeIllSaveYou = {
  id: 'power-pick-me-lobby',
  location: 'bedroom',
  category: 'deals',
  weight(house, ctx) {
    const noms = _noms(ctx);
    if (!noms.length || house.length < 6) return 0;
    // Between the block being set and the bag being opened.
    const window = ctx?.phase === 'post-noms' || ctx?.act === 'nominations';
    return window ? band(9) : 0;
  },
  fire(house, ctx, api, rng) {
    const noms = _noms(ctx);
    const nom = _quiet(noms)[0] || noms[0];
    const seller = _quiet(_others(house, _hoh(ctx), ...noms))[0] || _others(house, nom)[0];
    const s = pStats(seller);
    const p = pronouns(seller);
    // Does the nominee believe them? Trust and how well the seller sells it.
    const believable = perceived(nom, seller) + (s.social - 5) * 0.4;
    const bought = believable > 0.5;
    // And whether the offer is honest is a different question entirely.
    const honest = (s.loyalty || 5) >= 6 || bond(seller, nom) >= 3;

    const text = bought ? _variant([
      `"If you pull a choice chip, pick me. I win that veto and it comes down on you." ${nom} has no better offer and takes it.`,
      `${seller} makes the pitch early, before anybody else thinks of it: pick ${p.obj} for the draw and the veto comes off the wall for ${nom}. ${nom} agrees, and spends the rest of the day hoping ${p.sub} meant it.`,
      `${seller} does not pretend it is a favour. "You need somebody in there who wants you to stay. That is me, and there is a price later." ${nom} nods.`,
    ], ctx, nom, seller) : _variant([
      `${seller} offers to play for ${nom} and be the one who takes ${pronouns(nom).obj} down. ${nom} says thank you and does not mean it — ${p.sub} has done nothing all week to earn being believed.`,
      `"Pick me and I'll save you." ${nom} has heard ${seller} say a version of that to somebody else this week, and says so.`,
      `${seller} spends ten minutes explaining why ${p.sub} is the safest choice. ${nom} listens, and picks a name ${p.sub} has known longer.`,
    ], ctx, nom, seller);

    if (bought) {
      api.sideDeal(seller, nom, 'veto', { genuine: honest, about: 'I will take you down' });
      api.addBond(nom, seller, honest ? 1.2 : 0.6);
      api.remember(nom, seller, honest ? 'offered-to-save-me' : 'promise', 2, { about: 'the veto' });
    } else {
      api.addBond(nom, seller, -0.5);
      api.suspicion(nom, seller, 0.8);
      api.remember(nom, seller, 'sold-me-something', 1);
    }
    return {
      text, players: [nom, seller],
      badgeText: bought ? 'PICK ME' : 'NOT BUYING IT',
      badgeClass: bought ? 'green' : 'grey',
    };
  },
};

const fearsTheBackdoor = {
  id: 'power-fears-backdoor',
  category: 'deals',
  weight(house, ctx) {
    const hoh = _hoh(ctx);
    const noms = _noms(ctx);
    if (!hoh || !noms.length || house.length < 6) return 0;
    const window = ctx?.phase === 'post-noms' || ctx?.act === 'nominations';
    if (!window) return 0;
    // Somebody off the block who can feel the week pointing at them. Reading it
    // is a skill, so intuition decides whether they work it out in time.
    const mark = _others(house, hoh, ...noms)
      .find(n => targetOf(hoh) === n || suspicionOf(n, hoh) >= 2);
    if (!mark) return 0;
    return band((pStats(mark).intuition / 10) * 12);
  },
  fire(house, ctx, api, rng) {
    const hoh = _hoh(ctx);
    const noms = _noms(ctx);
    const mark = _others(house, hoh, ...noms)
      .find(n => targetOf(hoh) === n || suspicionOf(n, hoh) >= 2) || _others(house, hoh, ...noms)[0];
    const p = pronouns(mark);
    const s = pStats(mark);
    const text = _variant([
      `${mark} has worked out that two names on that block are not the point, and that the only way to be certain of Saturday is to be playing in it. ${p.Sub} starts asking everybody who holds a chip.`,
      `"I just want to play." ${mark} says it lightly, four separate times, to four separate people. Nobody is fooled by the fourth.`,
      `${mark} cannot be nominated if ${p.sub} ${p.sub === 'they' ? 'win' : 'wins'} that veto, and ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} done the arithmetic that everybody else is pretending not to have done.`,
      `${mark} asks ${hoh} directly whether ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} safe this week. ${hoh} says of course. ${mark} goes and lobbies to be in the draw anyway.`,
    ], ctx, mark, hoh);

    // Lobbying out loud is itself information: the house learns who is worried.
    _others(house, mark).slice(0, 3).forEach(n => api.suspicion(n, mark, 0.5));
    api.suspicion(mark, hoh, 1.1);
    api.remember(mark, hoh, 'coming-for-me', 2);
    api.setTarget(mark, hoh, 'was going to backdoor me');
    api.popDelta(mark, s.boldness >= 7 ? 1 : -1);
    return { text, players: [mark, hoh], badgeText: 'SEES IT COMING', badgeClass: 'orange' };
  },
};

export const POWER_EVENTS = [
  hohPitch, hohRoomTraffic, hohWeight, hohPromise,
  hohRoomReveal, hohRoomCourt, hohRoomOverstay, hohRoomQueue, hohRoomLastNight, hohRoomSpy,
  hohDeciding, pawnAsk, backdoorPlan, nomEveGuessing,
  savedThemselves, replacementReacts, vetoHolderFallout, nobodySurprised,
  pickMeIllSaveYou, fearsTheBackdoor,
  nomCampaign, blockPressure, pawnResentment,
  ceremonyConfrontation, replacementFallout, savedGuilt,
  hohRefusesEntry, vetoDrawLobby, vetoPromise,
];

export default POWER_EVENTS;
