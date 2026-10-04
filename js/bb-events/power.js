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

import {
  pStats, bond, band, perceived, closestTo, furthestFrom, trusts, dislikes, campaignArgument,
  sharesAlliance, grudge, remembers, suspicionOf, targetOf, threat, willScheme,
  isNice, isVillainous, archetype, resentmentOf, trustOf, beatsInvolving, spotlightOrder,
  actFacts, alliancesOf, deFactoAllies,
} from './_read.js';
import { makeScene } from '../bb/script/scene.js';
import { scriptBeat, joinScripts, numberWord } from '../bb/script/inject.js';
import { campaignCase } from './_read.js';

// ── helpers ───────────────────────────────────────────────────────────


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
// On an invisible week the engine hands events a null hoh on purpose — and
// this fallback was quietly reaching around it into the week object, so the
// house spent a sealed week holding court in an HOH room whose owner nobody
// is supposed to know. The week's own secrecy flag gates the reach-around.
const _hoh = ctx => ctx?.hoh || (ctx?.week?.hohSecret ? null : ctx?.week?.hoh) || null;
const _noms = ctx => (ctx?.nominees || []).filter(Boolean);
/** Least-seen first, so the same three names do not carry every week. */
/** Least-seen first, weighted toward whoever this week is about. */
const _quiet = pool => spotlightOrder(pool);
const _first = list => list[0];

/** Which room a scene happens in: by hash, never a die; the HOH room needs the HOH. */
function _room(rooms, ctx, ...people) {
  const hoh = _hoh(ctx);
  const ok = rooms.filter(r => r !== 'hoh-room' || (hoh && people.includes(hoh)));
  const pool = ok.length ? ok : ['backyard'];
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${people.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return pool[hash % pool.length];
}

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
    // The name they push: someone they fear or resent, never a friend.
    const mark = furthestFrom(pitcher, _others(house, hoh, pitcher))
      || _others(house, hoh, pitcher)[0];

    const push = pStats(pitcher).social * 0.5 + pStats(pitcher).strategic * 0.4
      + perceived(hoh, pitcher) * 0.6;
    const resist = pStats(hoh).intuition * 0.55 + pStats(hoh).strategic * 0.3
      + (grudge(hoh, pitcher) ? 2.5 : 0);
    const lands = push + (rng() * 5 - 2.5) > resist;

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
    // The name is talked ABOUT; only the two of them are in the room.
    const scene = makeScene('talk.pitch-target', { a: pitcher, b: hoh, c: mark }, { ending: lands ? 'lands' : 'overplayed' }, [], 'hoh-room');
    scene.seenBy = [pitcher, hoh];
    return {
      scene, players: [pitcher, hoh],
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
    visitors.forEach(v => api.addBond(hoh, v, 0.25));
    if (absent) {
      api.suspicion(hoh, absent, 1.1);
      api.remember(hoh, absent, 'grievance', 1, { about: 'never came up' });
    }
    const scene = makeScene('power.traffic', { a: hoh, b: absent || null }, { ending: absent ? 'snub' : 'queue' }, [], 'hoh-room');
    scene.seenBy = [hoh];
    return {
      scene, players: [hoh, absent].filter(Boolean),
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
    const rattled = s.temperament <= 5;
    if (rattled) api.popDelta(hoh, 1);
    const scene = makeScene('power.weight', { a: hoh }, { ending: rattled ? 'rattled' : 'decided' }, [], 'hoh-room');
    return {
      scene, players: [hoh],
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
    api.sideDeal(hoh, ally, 'safety', { genuine: honest, about: 'a week of protection' });
    api.addBond(hoh, ally, honest ? 1.1 : 0.4);
    api.remember(ally, hoh, honest ? 'trust' : 'promise', 2, { about: 'told me I was safe' });
    const scene = makeScene('power.promise', { a: hoh, b: ally }, { ending: honest ? 'real' : 'cheap' }, [], 'hoh-room');
    return {
      scene, players: [hoh, ally],
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
    // Needs somebody to pitch to — the "has run out of people to talk to"
    // fallback was a card with nothing in it.
    return _blockKnown(ctx) && _noms(ctx).length && house.length >= 4
      && _others(house, ..._noms(ctx), _hoh(ctx)).length ? band(9) : 0;
  },
  fire(house, ctx, api, rng) {
    const noms = _noms(ctx);
    const nom = _quiet(noms)[0];
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
    api.addBond(nom, mark, works ? 1.0 : -0.3);
    if (works) {
      api.remember(mark, nom, 'trust', 1, { about: 'came to me honestly' });
      api.sideDeal(nom, mark, 'vote', { genuine: true, about: 'a vote to keep' });
    } else {
      api.remember(nom, mark, 'grievance', 1, { about: 'would not even look at me' });
    }
    // The same two picks as a campaign pitch: the case, then the reply.
    const room = _room(['backyard', 'bedroom', 'pantry'], ctx, nom, mark);
    const sctx = { week: ctx?.week, act: ctx?.act || 'campaign', hoh: _hoh(ctx), nominees: noms, room, seenBy: [nom, mark], salt: 'nom-campaign' };
    const c = campaignCase(nom, mark, other);
    const script = joinScripts(
      scriptBeat('campaign.case', { a: nom, b: mark }, { ending: c.kind, target: c.opponent, partner: c.partner, alliance: c.alliance,
        theirComps: numberWord(c.theirComps), myComps: numberWord(c.myComps) }, sctx),
      scriptBeat('campaign.reply', { a: nom, b: mark }, { ending: works ? 'receptive' : 'unmoved' }, sctx));
    return {
      text: script?.text || `${nom} works ${mark} for a vote.`, lines: script?.lines, lineId: script?.lineId, location: room,
      players: [nom, mark],
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
    const hoh = _hoh(ctx);

    // Angry, hollow, or focused — decided by who they are.
    const anger = (10 - s.temperament) * 0.6 + (['hothead', 'villain', 'chaos-agent'].includes(arch) ? 3 : 0);
    const collapse = (10 - s.boldness) * 0.5 + (['goat', 'floater', 'underdog'].includes(arch) ? 2.5 : 0);
    const mode = anger > collapse && anger > 4 ? 'anger' : collapse > 4 ? 'despair' : 'focus';

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
    // The HOH is only in the room for the anger; the other two are the nominee's own.
    const scene = makeScene('power.block', { a: nom, b: hoh || null }, { ending: mode }, [], _room(['kitchen', 'backyard', 'bedroom'], ctx, nom));
    scene.seenBy = mode === 'anger' && hoh ? [nom, hoh] : [nom];
    return {
      scene, players: [nom, mode === 'anger' && hoh ? hoh : null].filter(Boolean),
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
  oncePerWeek: true,
  weight(house, ctx) {
    const f = actFacts(ctx);
    if (!(_blockKnown(ctx) && f.pawn && _noms(ctx).includes(f.pawn))) return 0;
    // Grounded on the ask: a pawn who volunteered gladly has little to resent,
    // a grudging yes simmers, and a forced seat is the loudest grievance in
    // the house.
    const ask = ctx?.week?.pawnAsk;
    if (ask?.forced) return band(13);
    if (ask && !ask.willing) return band(10);
    return band(4);
  },
  fire(house, ctx, api) {
    const { pawn, target } = actFacts(ctx);
    const hoh = _hoh(ctx);
    const takesIt = pStats(pawn).loyalty >= 6 && perceived(pawn, hoh) >= 1;

    if (!takesIt && hoh) {
      api.addBond(pawn, hoh, -1.6);
      api.remember(pawn, hoh, 'grievance', 3, { about: 'used me as a pawn' });
      api.setTarget(pawn, hoh, 'sat me down as a prop');
      api.popDelta(pawn, 1);
    } else if (hoh) {
      api.remember(pawn, hoh, 'obligation', 1, { about: 'owes me for sitting there' });
    }
    const scene = makeScene('power.pawn', { a: pawn, b: hoh || null, c: target || null }, { ending: takesIt ? 'takes' : 'resents' }, [],
      _room(['bedroom', 'backyard', 'kitchen'], ctx, pawn));
    scene.seenBy = [pawn, hoh].filter(Boolean);
    return {
      scene, players: [pawn, hoh].filter(Boolean),
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
    const backs = _others(house, accuser, hoh).filter(n => bond(n, accuser) >= 2);

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
    const scene = makeScene('power.confront', { a: accuser, b: hoh }, { ending: 'asks' }, _others(house, accuser, hoh), 'living-room');
    return {
      scene, players: [accuser, hoh],
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
    const blindsided = perceived(replacement, hoh) >= 2;

    if (hoh) {
      api.addBond(replacement, hoh, blindsided ? -2.4 : -1.0);
      api.remember(replacement, hoh, 'betrayal', blindsided ? 3 : 1,
        { about: blindsided ? 'told me I was safe and put me up' : 'used me as the replacement' });
      api.setTarget(replacement, hoh, 'put me up after the veto');
    }
    if (saved) api.remember(replacement, saved, 'grievance', 1, { about: 'came off and I went up' });
    api.popDelta(replacement, blindsided ? 2 : 0);
    // A secret HOH leaves nobody to face (lines/anon.js).
    const scene = hoh ? makeScene('power.replaced', { a: replacement, b: hoh }, { ending: blindsided ? 'blindsided' : 'expected' }, house, 'living-room')
      : makeScene('power.replaced', { a: replacement }, { ending: 'anon' }, house, 'living-room');
    return {
      scene, players: [replacement, hoh].filter(Boolean),
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
    const decent = isNice(saved) || pStats(saved).loyalty >= 6;
    api.addBond(saved, replacement, decent ? 0.5 : -1.2);
    if (decent) api.remember(replacement, saved, 'trust', 1, { about: 'at least came and said it' });
    else {
      api.remember(replacement, saved, 'grievance', 2, { about: 'enjoyed my seat' });
      api.popDelta(saved, -1);
    }
    const scene = makeScene('power.saved-guilt', { a: saved, b: replacement }, { ending: decent ? 'decent' : 'cold' }, [], _room(['kitchen', 'backyard', 'bedroom'], ctx, saved, replacement));
    return {
      scene, players: [saved, replacement],
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
    api.addBond(hoh, turned, -1.2);
    api.remember(turned, hoh, 'grievance', 2, { about: 'would not open the door' });
    api.suspicion(turned, hoh, 1.5);
    // The house reads the closed door as a nomination announcement.
    _others(house, hoh, turned).forEach(w => api.suspicion(w, hoh, 0.2));
    api.popDelta(hoh, -1);
    const scene = makeScene('power.refused', { a: hoh, b: turned }, { ending: 'shut' }, house, 'hoh-room');
    return {
      scene, players: [...house],
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
    const trusted = perceived(hoh, asker) >= 1.5;
    const agrees = trusted && rng() > 0.3;
    if (agrees) {
      api.sideDeal(hoh, asker, 'veto', { genuine: true, about: 'the veto goes the way I want it' });
      api.addBond(hoh, asker, 0.9);
      api.remember(hoh, asker, 'obligation', 2, { about: 'promised me the veto' });
    } else {
      api.addBond(hoh, asker, -0.4);
      api.suspicion(asker, hoh, 0.9);
      api.remember(asker, hoh, 'grievance', 1, { about: 'would not have me in the draw' });
    }
    const scene = makeScene('power.draw-lobby', { a: hoh, b: asker }, { ending: agrees ? 'agrees' : 'declines' }, [], 'hoh-room');
    return {
      scene, players: [hoh, asker],
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
    const means = perceived(holder, saved) >= 2 || sharesAlliance(holder, saved);
    api.sideDeal(holder, saved, 'veto', { genuine: means, about: 'promised the veto' });
    api.addBond(holder, saved, means ? 1.4 : 0.6);
    api.remember(saved, holder, means ? 'trust' : 'promise', 3, { about: 'said I was coming off' });
    if (other) api.suspicion(other, holder, 1.2);
    const scene = makeScene('power.veto-promise', { a: holder, b: saved, c: other || null }, { ending: means ? 'means' : 'hollow' }, [], 'pantry');
    scene.seenBy = [holder, saved];
    return {
      scene, players: [holder, saved],
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
    const s = pStats(hoh);
    const guests = _quiet(_others(house, hoh)).slice(0, 3);
    const holdsIt = s.temperament >= 6;
    guests.forEach(g => { api.addBond(hoh, g, 0.7); api.remember(hoh, g, 'was-there', 1); });
    api.popDelta(hoh, 2);
    const scene = makeScene('power.reveal', { a: hoh, b: guests[0] || null, c: guests[1] || null }, { ending: holdsIt ? 'holds' : 'breaks' }, guests, 'hoh-room');
    return { scene, players: [hoh, ...guests], badgeText: 'THE ROOM OPENS', badgeClass: 'gold' };
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
    // The nominees are not upstairs being seen with the person who put them up.
    const inner = _quiet(_others(house, hoh, ..._noms(ctx))).slice(0, 3);
    const outside = _others(house, hoh, ...inner)[0] || null;
    inner.forEach(n => { api.addBond(hoh, n, 0.8); inner.forEach(m => { if (m !== n) api.addBond(n, m, 0.4); }); });
    // Being visibly outside the room is its own information.
    if (outside) {
      api.suspicion(outside, hoh, 0.8);
      api.remember(outside, hoh, 'left-me-out', 1);
      api.addBond(outside, hoh, -0.4);
    }
    const scene = makeScene('talk.hoh-visit', { a: hoh, b: inner[0] || outside, c: inner[1] || null }, { ending: 'court' }, inner, 'hoh-room');
    return { scene, players: [hoh, ...inner, outside].filter(Boolean), badgeText: 'HOLDING COURT', badgeClass: 'blue' };
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
    api.addBond(hoh, clinger, -0.8);
    api.suspicion(hoh, clinger, 0.5);
    api.remember(hoh, clinger, 'cannot-read-a-room', 1);
    const scene = makeScene('power.overstay', { a: hoh, b: clinger }, { ending: 'stays' }, [], 'hoh-room');
    return { scene, players: [hoh, clinger], badgeText: 'WILL NOT LEAVE', badgeClass: 'orange' };
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
    queue.forEach((n, i) => {
      api.addBond(hoh, n, 0.3 - i * 0.15);
      api.suspicion(hoh, n, 0.4);
      api.remember(hoh, n, 'came-to-me', 1);
    });
    const scene = makeScene('power.queue', { a: hoh, b: queue[0] || null, c: queue[1] || null }, { ending: 'queue' }, queue, 'hoh-room');
    return { scene, players: [hoh, ...queue], badgeText: 'A QUEUE ON THE STAIRS', badgeClass: 'grey' };
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
    const next = _others(house, hoh)[0] || null;
    api.popDelta(hoh, 1);
    if (next) api.remember(hoh, next, 'watching-who-wants-it', 1);
    const scene = makeScene('power.last-night', { a: hoh }, { ending: 'packs' }, [], 'hoh-room');
    return { scene, players: [hoh], badgeText: 'LAST NIGHT IN THE ROOM', badgeClass: 'grey' };
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
    api.suspicion(watcher, hoh, 1.1);
    api.suspicion(watcher, favourite, 1.3);
    api.setTarget(watcher, favourite, 'lives in the HOH room');
    api.remember(watcher, favourite, 'in-with-power', 2);
    // Watched from downstairs: neither the favourite nor the HOH is in the scene.
    const scene = makeScene('power.spy', { a: watcher, b: favourite, c: hoh }, { ending: 'counts' }, [], 'living-room');
    scene.seenBy = [watcher];
    return { scene, players: [watcher, favourite, hoh], badgeText: 'COUNTING THE STAIRS', badgeClass: 'purple' };
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
    api.addBond(hoh, confidant, 0.9);
    api.remember(confidant, hoh, 'told-me-first', 2, { about: mark });
    // Being told first is the most valuable thing in this house, and it is also
    // the moment the plan stops being private.
    api.suspicion(confidant, mark, 0.5);
    const scene = makeScene('talk.hoh-decide', { a: hoh, b: confidant, c: mark }, { ending: 'named' }, [], 'hoh-room');
    scene.seenBy = [hoh, confidant];
    return { scene, players: [hoh, confidant, mark].filter(Boolean), badgeText: 'A NAME OUT LOUD', badgeClass: 'gold' };
  },
};

const pawnAsk = {
  id: 'power-pawn-ask',
  location: 'hoh-room',
  category: 'deals',
  weight(house, ctx) {
    // The scene of a decision the ENGINE made. This event used to run its own
    // parallel ask against closestTo(hoh) — agreements the plan ignored,
    // refusals the week never punished. It renders the real record now, and
    // only when there is one worth a scene.
    const ask = ctx?.week?.pawnAsk;
    if (!ask || !ask.asked?.length || _blockKnown(ctx) || house.length < 6) return 0;
    if (!house.includes(ask.pawn)) return 0;
    // ── the Head of Household cannot ask themselves ──
    //
    // negotiatePawn filters the sitting HOH out of its own ranking, so this is
    // never true on an ordinary week. It is true on a SPLIT week: the ask is
    // recorded once on the week while `_hoh(ctx)` resolves against whichever
    // half is currently being narrated, and the two can land on the same name.
    // Every line below is a two-hander — "X asks Y to take the chair" — so with
    // one name it prints a houseguest negotiating with themselves and puts
    // their face on the card twice.
    //
    // Declining to fire rather than repairing the cast: there is no scene here
    // to tell. A pawn ask needs two people in the room.
    const hoh = _hoh(ctx);
    if (!hoh || hoh === ask.pawn) return 0;
    return band(11);
  },
  fire(house, ctx, api) {
    const hoh = _hoh(ctx);
    const ask = ctx.week.pawnAsk;
    const pawn = ask.pawn;

    if (ask.forced) api.popDelta(pawn, 1);
    const scene = makeScene('power.pawn-ask', { a: hoh, b: pawn }, { ending: ask.forced ? 'forced' : ask.willing ? 'willing' : 'grudging' }, [], 'hoh-room');
    return {
      scene, players: [hoh, pawn],
      badgeText: ask.forced ? 'SEATED AGAINST A NO' : ask.willing ? 'AGREES TO SIT' : 'A GRUDGING YES',
      badgeClass: ask.forced ? 'red' : ask.willing ? 'blue' : 'grey',
    };
  },
};;

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
    // Nobody explains a plan to backdoor themselves. On a two-Head-of-Household
    // week the plan on the week belongs to one of them and the scene can be
    // cast from the other, which put the same houseguest in the room and on the
    // block in one card — "those two were never the point, H is" said by H.
    if (real === _hoh(ctx)) return 0;
    return band(13);
  },
  fire(house, ctx, api) {
    const hoh = _hoh(ctx);
    const real = ctx.week.plan.backdoorTarget;
    if (!real || real === hoh) return null;
    const noms = _noms(ctx);
    const ally = closestTo(hoh, _others(house, hoh, real, ...noms)) || _others(house, hoh, real)[0];
    api.remember(ally, hoh, 'showed-me-the-plan', 3, { about: real });
    api.addBond(hoh, ally, 0.8);
    api.setTarget(hoh, real, 'the whole week is about them');
    api.suspicion(ally, real, 0.6);
    // The target is listed even though they are not in the room. A card about
    // somebody is a card they belong on — the portraits say who the scene is
    // ABOUT, not who is standing there.
    const scene = makeScene('power.backdoor', { a: hoh, b: ally, c: real }, { ending: 'plan' }, [], 'hoh-room');
    scene.seenBy = [hoh, ally];
    return { scene, players: [hoh, ally, real].filter(Boolean), badgeText: 'THE REAL PLAN', badgeClass: 'purple' };
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
    api.suspicion(a, hoh, 0.5);
    api.suspicion(b, hoh, 0.5);
    api.addBond(a, b, 0.5);
    if (rightGuess) api.remember(a, guess, 'called-it', 1);
    const scene = makeScene('power.nom-eve', { a, b }, { ending: rightGuess ? 'right' : 'wrong', target: guess || null }, [], 'living-room');
    return {
      scene, players: [a, b, guess].filter(Boolean),
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
    api.popDelta(saved, 2);
    if (hoh) {
      api.remember(hoh, saved, 'cost-me-a-week', 2);
      api.suspicion(hoh, saved, 0.7);
      api.addBond(hoh, saved, -0.5);
    }
    const scene = hoh ? makeScene('power.saved-self', { a: saved, b: hoh }, { ending: 'saved' }, house, 'living-room')
      : makeScene('power.saved-self', { a: saved }, { ending: 'anon' }, house, 'living-room');
    return { scene,
      players: [saved, hoh].filter(Boolean), badgeText: 'SAVED THEMSELVES', badgeClass: 'green' };
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
    const arch = archetype(replacement);
    // Anger, despair, or a very cold calm — decided by who they are, not by a
    // roll, so the same houseguest reacts the same way twice.
    const mode = (s.temperament <= 4 || arch === 'hothead') ? 'angry'
      : (s.boldness <= 4 || arch === 'goat') ? 'crushed' : 'cold';
    if (hoh) {
      api.addBond(replacement, hoh, mode === 'angry' ? -2.2 : mode === 'crushed' ? -1.1 : -0.6);
      api.setTarget(replacement, hoh, 'put me up when I was already safe');
      api.remember(replacement, hoh, 'renominated-me', 3);
      if (mode === 'angry') api.popDelta(replacement, -1);
      if (mode === 'cold') api.popDelta(replacement, 1);
    }
    if (saved) api.addBond(replacement, saved, -0.7);
    const scene = hoh ? makeScene('power.replaced-reacts', { a: replacement, b: hoh, c: saved || null }, { ending: mode }, [],
      _room(['kitchen', 'bedroom', 'backyard'], ctx, replacement, hoh))
      : makeScene('power.replaced-reacts', { a: replacement }, { ending: 'anon' }, [], 'bedroom');
    scene.seenBy = [replacement, hoh].filter(Boolean);
    return {
      scene, players: [replacement, hoh].filter(Boolean),
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
    if (hoh) {
      api.addBond(holder, hoh, -1.4);
      api.suspicion(hoh, holder, 1.2);
      api.remember(hoh, holder, 'crossed-me', 2, { about: 'the veto' });
    }
    if (saved) { api.addBond(holder, saved, 1.6); api.remember(saved, holder, 'saved-me', 3); }
    api.popDelta(holder, 1);
    const scene = hoh ? makeScene('power.veto-fallout', { a: holder, b: hoh, c: saved || null }, { ending: 'fallout' }, [],
      _room(['kitchen', 'living-room'], ctx, holder, hoh))
      : makeScene('power.veto-fallout', { a: holder, b: saved }, { ending: 'anon' }, [], 'living-room');
    if (hoh) scene.seenBy = [holder, hoh];
    return { scene,
      players: [holder, hoh || saved].filter(Boolean), badgeText: 'BLOOD ON THEIR HANDS', badgeClass: 'red' };
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
    noms.forEach(n => watchers.forEach(w => api.suspicion(w, n, 0.2)));
    // Two quiet watchers; in a small house, one; with nobody left off the block, a nominee.
    const speaker = watchers.length ? null : noms[0] || null;
    const scene = watchers.length >= 2 ? makeScene('power.no-surprise', { a: watchers[0], b: watchers[1] }, { ending: 'flat' }, [], 'living-room')
      : watchers.length === 1 ? makeScene('power.no-surprise', { a: watchers[0] }, { ending: 'alone' }, [], 'living-room')
        : speaker ? makeScene('power.no-surprise', { a: speaker }, { ending: 'nominee' }, [], 'living-room') : null;
    return { ...(scene ? { scene } : { text: 'The ceremony changes nothing, and nobody is surprised.' }),
      players: speaker ? [speaker] : watchers.filter(Boolean), badgeText: 'NOBODY IS SURPRISED', badgeClass: 'grey' };
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
    // Does the nominee believe them? Trust and how well the seller sells it.
    const believable = perceived(nom, seller) + (s.social - 5) * 0.4;
    const bought = believable > 0.5;
    // And whether the offer is honest is a different question entirely.
    const honest = (s.loyalty || 5) >= 6 || bond(seller, nom) >= 3;

    if (bought) {
      api.sideDeal(seller, nom, 'veto', { genuine: honest, about: 'I will take you down' });
      api.addBond(nom, seller, honest ? 1.2 : 0.6);
      api.remember(nom, seller, honest ? 'offered-to-save-me' : 'promise', 2, { about: 'the veto' });
    } else {
      api.addBond(nom, seller, -0.5);
      api.suspicion(nom, seller, 0.8);
      api.remember(nom, seller, 'sold-me-something', 1);
    }
    const scene = makeScene('power.pick-me', { a: seller, b: nom }, { ending: bought ? 'bought' : 'refused' }, [], 'bedroom');
    return {
      scene, players: [nom, seller],
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
    const s = pStats(mark);
    _others(house, mark).slice(0, 3).forEach(n => api.suspicion(n, mark, 0.5));
    api.suspicion(mark, hoh, 1.1);
    api.remember(mark, hoh, 'coming-for-me', 2);
    api.setTarget(mark, hoh, 'was going to backdoor me');
    api.popDelta(mark, s.boldness >= 7 ? 1 : -1);
    const scene = makeScene('power.fears-backdoor', { a: mark, b: hoh }, { ending: 'sees' }, [], _room(['bedroom', 'backyard', 'kitchen'], ctx, mark));
    scene.seenBy = [mark];
    return { scene, players: [mark, hoh], badgeText: 'SEES IT COMING', badgeClass: 'orange' };
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
