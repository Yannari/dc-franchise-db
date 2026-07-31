// ══════════════════════════════════════════════════════════════════════
// bb-events/schemes.js — Total Drama's social schemes, played in a house
// ══════════════════════════════════════════════════════════════════════
//
// The other simulator already has a deep social-manipulation layer: forged
// notes with a belief check against the reader's mental and intuition, lies
// that can trigger a confrontation, whisper campaigns that seed doubt with
// half the cast, a false vote plan that actually steers a ballot and gets
// traced back the following week, and the two reaction events — somebody
// catching a schemer, somebody comforting the victim — that make the whole
// thing a system rather than a text generator.
//
// None of it was reachable from a Big Brother season, and rewriting it here
// would have been the same nine events built twice, drifting apart forever.
// This is a bridge, not a reimplementation: the generators in
// js/social-manipulation.js do the work and apply their own consequences
// through the shared bond, memory and vote-planning modules, and this file
// decides who schemes, when, and in which room.
//
// The one scheme deliberately left behind is the challenge-throw accusation,
// which is structurally Total Drama — it needs a tribe that lost a challenge.
//
// The only adaptation is vocabulary. The generators say "the tribe" because
// they were written for one; a house is a house.

import { gs, seasonConfig } from '../core.js';
import { romanticCompat } from '../players.js';
import {
  _generateForgeNote, _generateSpreadLies, _generateKissTrap,
  _generateWhisperCampaign, _generateCampaignRally, _generateFalseMajority,
  _generateExposeSchemer, _generateComfortVictim,
} from '../social-manipulation.js';
import { getBond } from '../bonds.js';
import {
  pStats, band, furthestFrom, willScheme, isNice, beatsInvolving,
} from './_read.js';

// ── helpers ───────────────────────────────────────────────────────────

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const _quiet = pool => [...pool].sort((a, b) => beatsInvolving(a) - beatsInvolving(b));
const _pick = arr => arr[Math.floor(Math.random() * arr.length)];

/** A house is not a tribe. The only thing these events need translating. */
const _house = text => String(text || '')
  .replace(/\bThe tribe\b/g, 'The house')
  .replace(/\bthe tribe\b/g, 'the house')
  .replace(/\btribe\b/g, 'house')
  .replace(/\bTribe\b/g, 'House');

/**
 * Fold a generator's results into one renderable beat.
 *
 * A scheme can produce several results — a forged note that gets detected
 * also produces the exposure — and the scheduler takes one beat per fire.
 * The consequences have already been applied by the generator either way, so
 * this is purely presentation: the texts read as one moment because that is
 * what they are.
 */
function _fold(results, badgeText, badgeClass) {
  const list = (results || []).filter(r => r && r.text);
  if (!list.length) return null;
  // The badge names the PRIMARY action, not the last thing that happened as a
  // consequence of it — a kiss trap that ends with somebody being consoled is
  // still a kiss trap, and labelling it COMFORTED buries the event.
  const first = list[0];
  return {
    text: _house(list.map(r => r.text).join(' ')),
    players: [...new Set(list.flatMap(r => r.players || []))].filter(Boolean),
    badgeText: first.badgeText || badgeText,
    badgeClass: first.badgeClass || badgeClass,
  };
}

/** Something renderable when a scheme's cast does not come together. */
const _quietBeat = (text, players) => ({
  text, players: players.filter(Boolean), badgeText: 'NOTHING COMES OF IT', badgeClass: 'grey',
});

/**
 * Run a generator and keep what it leaves behind.
 *
 * The generators read only `ep.num`, but they also WRITE three scratch fields
 * naming who schemed and who was lied about — which is exactly what the two
 * reaction events need to find. Passing a throwaway object dropped them on the
 * floor and would leave "expose the schemer" permanently unreachable, so they
 * are lifted onto shared state here.
 *
 * Always returns a renderable beat: a scheme whose cast fell through at the
 * last moment must not hand the scheduler a null, which throws and takes the
 * whole week with it.
 */
function _run(ctx, generate, badgeText, badgeClass, quiet, rng) {
  const ep = { num: ctx?.week?.num || gs.episode || 1 };
  // The Total Drama generators reach for Math.random directly — they predate
  // the seeded scheduler and are shared with a simulator that does not need
  // one. Pointing Math.random at the week's own rng for the length of the call
  // keeps a seeded season reproducible without rewriting nine events that work.
  const real = Math.random;
  if (typeof rng === 'function') Math.random = rng;
  // Same reason the rng is swapped: these are Total Drama generators, and they
  // write gs.popularity directly rather than through the house's api — which
  // walked straight past the season's own popularity switch.
  const popOff = seasonConfig.popularityEnabled === false;
  const popBefore = popOff ? { ...(gs.popularity || {}) } : null;
  let results;
  try { results = generate(ep) || []; } finally {
    Math.random = real;
    if (popOff) gs.popularity = popBefore;
  }
  if (ep._socialSchemer) gs._lastBBSchemer = ep._socialSchemer;
  if (ep._socialVictim) gs._lastBBVictim = ep._socialVictim;
  if (ep._socialVictimTarget) gs._lastBBVictimTarget = ep._socialVictimTarget;
  return _fold(results, badgeText, badgeClass) || quiet;
}

/** Who is willing to scheme, least-seen first so it is not always one player. */
const _schemer = house => _quiet(house).filter(n => willScheme(n))[0] || null;

/** Schemes are a house's real currency, but not every second beat. */
const _w = (base, ctx) => band(ctx?.act === 'eviction' ? base * 0.4 : base);

// ── the schemes ───────────────────────────────────────────────────────

const forgeNote = {
  id: 'scheme-forge-note',
  category: 'deals',
  location: 'bedroom',
  weight(house, ctx) { return house.length >= 4 && _schemer(house) ? _w(4.5, ctx) : 0; },
  fire(house, ctx, api, rng) {
    const schemer = _schemer(house);
    const rest = _others(house, schemer);
    const reader = _quiet(rest)[0];
    const alleged = furthestFrom(reader, _others(rest, reader)) || _others(rest, reader)[0];
    if (!reader || !alleged) {
      return _quietBeat(`${schemer} starts writing something, thinks better of it, and pockets it.`, [schemer]);
    }
    return _run(ctx, ep => _generateForgeNote(schemer, { a: reader, b: alleged }, house, ep, _pick),
      'FORGED NOTE', 'red',
      _quietBeat(`${schemer} plants a note and nobody ever finds it.`, [schemer]), rng);
  },
};

const spreadLies = {
  id: 'scheme-spread-lies',
  category: 'deals',
  location: 'pantry',
  weight(house, ctx) { return house.length >= 4 && _schemer(house) ? _w(5, ctx) : 0; },
  fire(house, ctx, api, rng) {
    const schemer = _schemer(house);
    const rest = _others(house, schemer);
    const listener = _quiet(rest)[0];
    const accused = furthestFrom(listener, _others(rest, listener)) || _others(rest, listener)[0];
    if (!listener || !accused) {
      return _quietBeat(`${schemer} has a story ready and nobody to tell it to.`, [schemer]);
    }
    return _run(ctx, ep => _generateSpreadLies(schemer, { a: listener, b: accused }, house, ep, _pick),
      'SPREADING LIES', 'red',
      _quietBeat(`${schemer} tries a line on ${listener} and it goes nowhere.`, [schemer, listener]), rng);
  },
};

const whisperCampaign = {
  id: 'scheme-whisper-campaign',
  category: 'deals',
  location: 'backyard',
  weight(house, ctx) { return house.length >= 6 && _schemer(house) ? _w(4, ctx) : 0; },
  fire(house, ctx, api, rng) {
    const schemer = _schemer(house);
    const target = furthestFrom(schemer, _others(house, schemer));
    if (!target) {
      return _quietBeat(`${schemer} does a lap of the house and says nothing worth repeating.`, [schemer]);
    }
    return _run(ctx, ep => _generateWhisperCampaign(schemer, target, house, ep, _pick),
      'WHISPER CAMPAIGN', 'red',
      _quietBeat(`${schemer} plants a doubt about ${target} that does not take.`, [schemer, target]), rng);
  },
};

const campaignRally = {
  id: 'scheme-campaign-rally',
  category: 'deals',
  location: 'living-room',
  weight(house, ctx) {
    // A rally is social muscle rather than villainy — anybody persuasive can.
    return house.length >= 5 && _quiet(house).some(n => pStats(n).social >= 6) ? _w(4, ctx) : 0;
  },
  fire(house, ctx, api, rng) {
    const rallier = _quiet(house).find(n => pStats(n).social >= 6) || house[0];
    const target = furthestFrom(rallier, _others(house, rallier));
    if (!target) {
      return _quietBeat(`${rallier} works the room without ever naming anybody.`, [rallier]);
    }
    return _run(ctx, ep => _generateCampaignRally(rallier, target, house, ep, _pick),
      'RALLY', 'red',
      _quietBeat(`${rallier} tries to move the house against ${target} and cannot.`, [rallier, target]), rng);
  },
};

/**
 * The fake vote plan.
 *
 * The richest of them: the victim's ballot is genuinely steered toward the
 * decoy at the vote, and the following week an intuitive victim can trace it
 * back. It works unchanged in a house because a house votes too.
 */
const falseMajority = {
  id: 'scheme-false-majority',
  category: 'deals',
  location: 'pantry',
  weight(house, ctx) {
    if (house.length < 5 || gs._falseMajorityPlot) return 0;
    // Only worth selling once the vote is close enough to be believable.
    const late = ['post-noms', 'post-veto', 'campaign'].includes(ctx?.phase);
    return late && _schemer(house) ? _w(5, ctx) : 0;
  },
  fire(house, ctx, api, rng) {
    const schemer = _schemer(house);
    const rest = _others(house, schemer);
    const victim = _quiet(rest)[0];
    const decoy = furthestFrom(victim, _others(rest, victim)) || _others(rest, victim)[0];
    if (!victim || !decoy) {
      return _quietBeat(`${schemer} works out there is nobody left to sell a plan to.`, [schemer]);
    }
    return _run(ctx, ep => _generateFalseMajority(schemer, victim, decoy, house, ep, _pick),
      'FALSE MAJORITY', 'red',
      _quietBeat(`${schemer} floats a fake plan at ${victim}, who does not bite.`, [schemer, victim]), rng);
  },
};

/**
 * The kiss trap — the rarest, and the only one with a hard prerequisite.
 *
 * Needs a real showmance to break and an accomplice who is romantically
 * plausible, which the shared romance rules decide rather than this file.
 */
/**
 * The kiss trap — the rarest, and the only one with hard prerequisites.
 *
 * The generator derives the roles itself from the showmance: the lower-mental
 * partner is the witness, the other is the one who gets kissed. It needs the
 * schemer to be romantically plausible with THAT partner, and an accomplice
 * who both trusts the schemer and is socially capable. The gate here checks
 * the same three things rather than guessing, because an event whose weight
 * says yes and whose fire says nothing is just a wasted beat.
 */
const kissTrap = {
  id: 'scheme-kiss-trap',
  category: 'social',
  location: 'bedroom',
  weight(house, ctx) {
    // Weighted high on purpose. Four conditions have to align for this to be
    // possible at all — a live showmance, a willing schemer who is plausible
    // with the partner the generator picks, and a trusted accomplice — so
    // when they do, eligibility should decide it rather than a second lottery
    // against ninety other events.
    return house.length >= 5 && _kissSetup(house) ? _w(16, ctx) : 0;
  },
  fire(house, ctx, api, rng) {
    const setup = _kissSetup(house);
    if (!setup) {
      return _quietBeat(`Somebody in this house is looking for a couple to break, and cannot find the angle.`, []);
    }
    return _run(ctx, ep => _generateKissTrap(setup.schemer, { showmance: setup.showmance }, house, ep, _pick),
      'KISS TRAP', 'red',
      _quietBeat(`${setup.schemer} sets something up around ${setup.kissTarget}, and it does not happen.`,
        [setup.schemer, setup.kissTarget]), rng);
  },
};

/**
 * The exact conditions the generator will accept, checked once and reused by
 * both weight() and fire() so the two can never disagree.
 *
 * Searches every willing schemer against every live showmance rather than
 * picking one schemer and hoping they fit. The generator kisses the
 * higher-mental partner and needs the schemer to be plausible with THAT one
 * plus a trusted, socially capable accomplice — four conditions that almost
 * never align for an arbitrarily chosen pair, which is why this event fired
 * exactly never across twenty seasons before the search was widened.
 */
function _kissSetup(house) {
  const live = (gs.showmances || []).filter(sh => sh.phase !== 'broken-up'
    && (sh.players || []).length === 2 && sh.players.every(n => house.includes(n)));
  if (!live.length) return null;
  const schemers = _quiet(house).filter(n => willScheme(n));
  for (const schemer of schemers) {
    for (const showmance of live) {
      const [p1, p2] = showmance.players;
      const witness = pStats(p1).mental <= pStats(p2).mental ? p1 : p2;
      const kissTarget = witness === p1 ? p2 : p1;
      if (schemer === witness || schemer === kissTarget) continue;
      if (!romanticCompat(schemer, kissTarget)) continue;
      const accomplice = house.find(n => n !== schemer && n !== witness && n !== kissTarget
        && getBond(n, schemer) >= 2 && pStats(n).social >= 5);
      if (!accomplice) continue;
      return { schemer, showmance, witness, kissTarget, accomplice };
    }
  }
  return null;
}

// ── the reactions ─────────────────────────────────────────────────────
// A scheme layer without these is a one-way street: people lie and nobody
// ever notices, and nobody ever sits with the person who was lied about.

const exposeSchemer = {
  id: 'scheme-exposed',
  category: 'social',
  location: 'living-room',
  weight(house, ctx) {
    const schemer = gs._lastBBSchemer;
    if (!schemer || !house.includes(schemer) || house.length < 4) return 0;
    // Somebody has to be sharp enough to catch it.
    return house.some(n => n !== schemer && pStats(n).intuition >= 6) ? _w(6, ctx) : 0;
  },
  fire(house, ctx, api, rng) {
    const schemer = gs._lastBBSchemer;
    const exposer = _others(house, schemer)
      .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
    const victim = (gs._lastBBVictim && house.includes(gs._lastBBVictim))
      ? gs._lastBBVictim : _others(house, schemer, exposer)[0];
    if (!exposer || !victim) {
      return _quietBeat(`Somebody in this house is lying and nobody can prove which one.`, []);
    }
    return _run(ctx, ep => [_generateExposeSchemer(exposer, schemer, victim, house, ep, _pick)],
      'EXPOSED', 'gold',
      _quietBeat(`${exposer} is almost sure about ${schemer}, and almost is not enough to say out loud.`, [exposer, schemer]), rng);
  },
};

const comfortVictim = {
  id: 'scheme-comfort-victim',
  category: 'social',
  location: 'bedroom',
  weight(house, ctx) {
    const victim = gs._lastBBVictim;
    if (!victim || !house.includes(victim) || house.length < 3) return 0;
    return house.some(n => n !== victim && isNice(n)) ? _w(5, ctx) : 0;
  },
  fire(house, ctx, api, rng) {
    const victim = gs._lastBBVictim;
    return _run(ctx, ep => [_generateComfortVictim(victim, house, ep, _pick)],
      'COMFORTED', 'green',
      _quietBeat(`${victim} sits with it alone, and nobody comes to find ${victim}.`, [victim]), rng);
  },
};

export const SCHEME_EVENTS = [
  forgeNote, spreadLies, whisperCampaign, campaignRally,
  falseMajority, kissTrap, exposeSchemer, comfortVictim,
];

export default SCHEME_EVENTS;
