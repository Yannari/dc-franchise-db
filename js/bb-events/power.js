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
  pStats, bond, band, perceived, closestTo, furthestFrom, trusts, dislikes,
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
      `${pitcher} makes the case against ${mark} without ever sounding like ${p.sub} came up here to make it. That is the skill.`,
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
      `The room is quiet and enormous and ${hoh} has never wanted company more, which is exactly the thing ${p.sub} cannot ask for now.`,
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
      `${hoh} tells ${ally} the plan before telling anybody else, which is worth more than the plan.`,
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

    const text = works ? _variant([
      `${nom} gets ${mark} alone by the ${_variant(['storage room', 'washroom door', 'back of the kitchen'], ctx, nom)} and makes the only argument that matters: keeping ${p.obj} is better for ${mark} than losing ${p.obj}.`,
      `${nom} does not beg. ${p.Sub} lays out the numbers, and ${mark} realises ${p.sub} is right about them.`,
      `"I'm not asking you to like me. I'm asking you to count." ${mark} counts, and does not like the answer.`,
      `${nom} works ${mark} for twenty minutes and never once mentions being on the block. By the end ${mark} brings it up ${p.ref}.`,
    ], ctx, nom, mark) : _variant([
      `${nom} makes the pitch to ${mark} twice, which is once more than it needed, and watches it stop landing halfway through.`,
      `${mark} is kind about it, agrees with all of it, and has already decided. ${nom} can hear that ${p.sub} has.`,
      `${nom} runs out of argument in front of ${mark} and fills the gap with a promise ${p.sub} cannot keep.`,
      `"I'll think about it." In this house that sentence has one meaning and ${nom} knows it.`,
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
      `${nom} has been polite for two days and runs out of it between one sentence and the next.`,
      `It comes out sideways — a joke with too much in it, aimed at nobody, landing on everybody.`,
    ], ctx, nom) : mode === 'despair' ? _variant([
      `${nom} stops campaigning halfway through a sentence, and does not pick it back up.`,
      `${nom} sits in the ${_variant(['backyard', 'washroom', 'storage room'], ctx, nom)} for most of an hour. Two people see ${p.obj}. Neither goes in.`,
      `${nom} starts saying goodbye to people in ways that are not quite goodbyes.`,
      `The thing that breaks ${nom} is not the block. It is somebody being nice about the block.`,
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
      `${replacement} looks at ${hoh} while walking to the chair. ${hoh} does not look back, which is its own answer.`,
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

export const POWER_EVENTS = [
  hohPitch, hohRoomTraffic, hohWeight, hohPromise,
  nomCampaign, blockPressure, pawnResentment,
  ceremonyConfrontation, replacementFallout, savedGuilt,
];

export default POWER_EVENTS;
