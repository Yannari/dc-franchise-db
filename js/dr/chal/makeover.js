// ══════════════════════════════════════════════════════════════════════
// dr/chal/makeover.js — turn a stranger into your sister
// ══════════════════════════════════════════════════════════════════════
//
// The only challenge scored on a RELATIONSHIP rather than on a result. The
// winning look here is not the best look — it is the one where the two of them
// read as family, which is why `resemblance` is the heaviest term and why a
// queen who paints herself beautifully and leaves her partner behind takes a
// note for it. Out-dressing your own sister is a loss, not a flex.
//
// ── CHECKED AGAINST THE SHOW, AND IT WAS WRONG ───────────────────────
//
// This was built with a pit crew and a pool of relationship types — "her
// mother", "her brother" — drafted as if there were one mother in the world.
// The real challenge is not that. The queens give a drag makeover to INVITED
// GUESTS from a specific demographic, and the demographic changes every time
// it is booked: superfans, military veterans, seniors, athletes, the queens
// already sent home. Her job is to make a stranger read as her drag family.
//
// So a pool is a THEMED COHORT and which one it is comes from the season's
// booking rather than from the queen. "Loved ones" is the single case where
// the guest is already hers, which is why it alone is not drafted.
//
// The resemblance term was right and stays: a family resemblance across
// cohesive looks is what the panel actually judges here.
import { pickOrder, contestFor } from '../assign.js';
import { prepareRoom, walkthrough } from '../prep.js';
import { dragOf } from '../queen.js';
import { noise, riskFor } from '../perform.js';
import { evt } from '../rules.js';
import { alumniPool } from '../../alumni.js';
import { SHOWS, DRAG_FORMAT } from '../../shows.js';
import { drawPartners, GUEST_POOLS } from '../data/partners.js';

const crew = (name, ease) => ({ id: name.toLowerCase().replace(/\W+/g, '-'), name, ease });

// `ease` is how well a partner takes to it: a dancer walks, a shy one has to
// be carried through every step of it.
/* ── THE AUTHORED COHORTS MOVED OUT ──
   They were six arrays of invented first names in this file, two of which were
   the same twelve people — see the header of js/dr/data/partners.js. They have
   faces now and they live with the rest of the show's authored data, which is
   also where the next person will look for them. */
export { PIT_CREW, GUEST_POOLS } from '../data/partners.js';

export const PARTNER_POOLS = {
  // The one cohort that is not a roster of people: her own person, so nothing
  // is drafted and two queens can both bring a sister.
  'loved-ones': [crew('her mother', 4), crew('her brother', 6), crew('her sister', 8),
    crew('her father', 3), crew('her cousin', 7), crew('her best friend', 9),
    crew('her aunt', 5), crew('her nephew', 6), crew('her uncle', 3),
    crew('her twin', 9), crew('her neighbour', 5), crew('her drag mother', 10)],
  // Built at run time from the queens already sent home.
  eliminated: null,
  // And from the franchise itself — see `alumniPartners` below.
  alumni: null,
};

/* ── THE CROSSOVER MAKEOVER ──
   The cohorts above are invented people with faces: superfans, service
   veterans, the pit crew. They are the show's own premise and they stay. This
   is the one that could only exist in a franchise — the guests walking through
   the door are people who actually played one of the other shows, and the
   audience has watched them lose something.

   THE SHOW IS NOT A LIST. js/shows.js is the only place that knows what shows
   exist, and docs/ADDING-A-SHOW.md §9 is emphatic that a second copy is how a
   fourth show ends up wearing the first one's name. So the eligible shows are
   DERIVED: every registered format that is not this one and that has enough
   people on the ledger to fill a room. A show with nobody in it yet is never
   offered, and the day it has a cast it starts appearing without anybody
   editing this file.

   DRAG RACE IS EXCLUDED, and not for a technical reason: a makeover is turning
   somebody who does not do drag into a drag sister, and another queen has no
   transformation in her. The exclusion reads `DRAG_FORMAT` from the registry,
   so it is still not a hardcoded slug. */
const ALUMNI_FLOOR = 8;

/** Which registered shows could supply a room of partners right now. */
export function makeoverShows(exclude = []) {
  const barred = new Set(exclude);
  return Object.keys(SHOWS)
    .filter(f => f !== DRAG_FORMAT)
    /* NATIVE ONLY. `alumniPool` widens to the whole franchise when a format has
       fewer than `minNative` people in it — right for a guest judge, where the
       question is "would anybody recognise her", and wrong here, where the whole
       point is that these people played THAT show. Unfiltered it reported 170
       available for the castle, which has never had a cast: the fallback had
       handed back the entire franchise wearing the castle's name. */
    .map(f => ({ format: f,
      people: alumniPool({ format: f, exclude: [...barred] }).filter(a => a?.native) }))
    .filter(x => x.people.length >= ALUMNI_FLOOR);
}

/**
 * A room of partners drawn from one of the other shows.
 *
 * Returns `[]` when the franchise cannot fill one — no database loaded, or no
 * show with enough people — and the caller falls back to the invented cohorts,
 * which is the honest answer rather than a half-empty crossover.
 */
export function alumniPartners({ cast = [], rng = Math.random, format = null } = {}) {
  const castNames = cast.map(p => (p && p.name) || p).filter(Boolean);
  const shows = makeoverShows(castNames);
  if (!shows.length) return [];
  const chosen = (format && shows.find(s => s.format === format))
    || shows[Math.floor(rng() * shows.length)];

  const roster = (typeof globalThis !== 'undefined' && globalThis.FRANCHISE_ROSTER) || [];
  const rowOf = n => roster.find(r => r && r.name === n) || null;

  return chosen.people.map(a => {
    const st = (rowOf(a.name) || {}).stats || {};
    const num = k => (Number.isFinite(Number(st[k])) ? Number(st[k]) : 5);
    /* Willingness rather than talent: nobody here has done drag before, so what
       decides how the day goes is whether she will let somebody put her in a
       corset and laugh about it. Proportional, never a threshold. */
    const ease = Math.max(1, Math.min(10, Math.round(
      7 + (num('boldness') - 5) * 0.45 + (num('social') - 5) * 0.35
        + (num('temperament') - 5) * 0.2)));
    return {
      id: `alum-${(a.slug || a.name).toLowerCase().replace(/\W+/g, '-')}`,
      name: a.name,
      ease,
      fromShow: chosen.format,
      // Said the registry's way, so a screen never owns the show's name.
      fromShowName: SHOWS[chosen.format]?.name || chosen.format,
    };
  });
}

/** Which cohorts a season can book. */
export const PARTNER_COHORTS = ['superfans', 'veterans', 'seniors', 'athletes',
  'pit-crew', 'loved-ones', 'eliminated', 'alumni'];

/** Everybody competes for a shared guest; loved ones are already hers. */
const CONTESTED = new Set(['superfans', 'veterans', 'seniors', 'athletes',
  'pit-crew', 'eliminated', 'alumni']);

function poolFor(cfg, state, players, ctx) {
  if (cfg?.makeoverPool === 'alumni') {
    /* Falls through to the invented cohorts when the franchise cannot fill a
       room — an early-life franchise, or a headless tool with no database
       loaded, both of which are ordinary rather than an error. */
    return alumniPartners({
      cast: Object.values(players || {}),
      rng: ctx?.rng, format: cfg?.makeoverShow || null,
    });
  }
  /* THE FOUR AUTHORED COHORTS PLUS THE CREW, drawn rather than handed back in
     written order — see `drawPartners`. `loved-ones` is not here because it is
     relationships rather than people and every queen gets her own. */
  if (GUEST_POOLS[cfg?.makeoverPool]) {
    return drawPartners(cfg.makeoverPool, ctx?.rng);
  }
  if (cfg?.makeoverPool === 'eliminated') {
    return (state?.out || []).map(n => ({
      id: n.toLowerCase(), name: n,
      ease: players[n] ? dragOf(players[n]).runway : 7,
      isQueen: true,
    }));
  }
  /* THE FALLBACK IS DRAWN TOO. It used to be `PARTNER_POOLS.superfans`, a
     fixed array that no longer lives in this file — an unbooked cohort would
     have fallen back to `undefined` and paired every queen with nobody. */
  return PARTNER_POOLS[cfg?.makeoverPool] || drawPartners('superfans', ctx?.rng);
}

export function assign(ctx) {
  const { living, players, rng, miniWinner, mini, cfg, state, bond } = ctx;
  const poolKey = cfg?.makeoverPool || 'superfans';
  let pool = poolFor(cfg, state, players, ctx);
  /* ── A SHORT ROOM IS THE COMMON CASE, NOT AN EMPTY ONE ──
     This only caught a pool with NOTHING in it, and the pool that needed it is
     never quite empty: `eliminated` holds however many queens have gone home,
     which on episode four is three of them. Nine queens, three partners, and
     six cards reading "with a stranger" — which is what the fallback existed
     to prevent and did not, because three is not zero.
     The season scheduler keeps `eliminated` out of the draw before episode
     five for this reason, but an author can pin it anywhere, and a control
     that produces six strangers when used early is a trap rather than a
     choice. Topped up from the superfans, which is what a production would
     do. */
  if (pool.length < living.length) {
    const short = living.length - pool.length;
    const taken = new Set(pool.map(p => p.id));
    pool = [...pool, ...drawPartners('superfans', rng, short + 4)
      .filter(p => !taken.has(p.id)).slice(0, short)];
  }

  const order = pickOrder({ living, miniWinner, mini, rng });
  const events = [];
  let picks;

  if (CONTESTED.has(poolKey) && pool.length) {
    const choices = Object.fromEntries(order.map(n => {
      // A returning queen she is close to is worth reaching for, above and
      // beyond how well the partner takes to drag.
      const scored = pool.map(p => ({
        p, s: p.ease + (p.isQueen ? bond(n, p.name) * 0.5 : 0) + rng(),
      }));
      return [n, scored.sort((a, b) => b.s - a.s).map(x => x.p.name)];
    }));
    const contest = contestFor({
      order, choices, players, rng, bond,
      // No preparation penalty here — she meets him this morning either way; his ease already scores it.
      penaltyScale: 0,
    });
    picks = contest.picks;
    events.push(...contest.events);
  } else {
    // Nobody competes for their own family. Each queen draws one, and the same
    // relationship can turn up twice, because it can.
    picks = Object.fromEntries(order.map(n => {
      const p = pool[Math.floor(rng() * pool.length)];
      return [n, { name: n, choice: p.name, penalty: 0, lostTo: null }];
    }));
  }

  for (const n of order) {
    const partner = picks[n]?.choice;
    const rec = pool.find(p => p.name === partner);
    if (rec?.isQueen && bond(n, partner) >= 4) {
      events.push(evt('reunion', {
        players: [n, partner],
        bond: [[n, partner, 1.5]],
        pop: { [n]: 2, [partner]: 2 },
        data: { partner },
      }));
    }
  }

  return {
    roles: Object.fromEntries(order.map(n => [n, 'standard'])),
    teams: [], order, picks, events, pool, poolKey,
    scenes: [{ step: 'choice', kind: 'makeover-pairs', data: { pool: poolKey, picks } }],
  };
}

export function prepare(ctx) {
  const { living, players, assignment, rng } = ctx;
  const pool = assignment.pool || drawPartners('superfans', rng);
  const r = prepareRoom(ctx);
  const w = walkthrough({ ...ctx, prep: r.prep });
  const events = [...r.events, ...w.events];
  const looks = {};

  for (const n of living) {
    const d = dragOf(players[n]);
    const partner = pool.find(p => p.name === assignment.picks[n]?.choice)
      || { name: 'a stranger', ease: 5 };
    // Her own look is how she wears drag. Her partner's is how she MAKES it,
    // on a body that is not hers, helped or hindered by how willing he is.
    const own = d.runway * 0.8 + (w.prep[n] || 0) + noise(rng, 1.5);
    const theirs = d.design * 0.5 + partner.ease * 0.3 + (w.prep[n] || 0) + noise(rng, 1.8);
    looks[n] = {
      own: Math.round(own * 100) / 100,
      partner: Math.round(theirs * 100) / 100,
      partnerName: partner.name,
      /* HIS FACE, WHICH THE SCREEN HAD NO WAY TO ASK FOR. The partners are
         authored people with portraits now (js/dr/data/partners.js), and a
         makeover card that names him without showing him is the one card in
         the show where the second person is the whole point. Null for a loved
         one and for an eliminated queen — a queen already has a portrait the
         registry resolves, and "her aunt" is a relationship rather than a
         face. */
      partnerPortrait: partner.portrait || null,
      partnerNote: partner.note || null,
      ease: partner.ease,
    };
    if (own - theirs > 3) {
      events.push(evt('dressed-herself-better', {
        players: [n], pop: { [n]: -2 },
        data: { own: looks[n].own, partner: looks[n].partner },
      }));
    }
  }

  return {
    prep: w.prep, events, looks,
    scenes: [...r.scenes, { step: 'prep', kind: 'makeover-build', data: { looks } }],
  };
}

export function perform(ctx) {
  const { living, players, prep, rng, looks } = ctx;
  const performances = {};

  for (const n of living) {
    const L = looks?.[n] || { own: 5, partner: 5, partnerName: 'a stranger', ease: 5 };
    // The gap between the two looks IS the score. A pair that matches at seven
    // beats a queen at ten standing next to a partner at four.
    const resemblance = 10 - Math.abs(L.own - L.partner) - (10 - L.ease) * 0.3 + noise(rng, 1.2);
    const perf = resemblance * 0.4 + L.partner * 0.35 + L.own * 0.25;
    performances[n] = {
      perf: Math.round(perf * 100) / 100,
      moment: resemblance > 9 && perf > 9,
      risk: riskFor(players[n], rng),
      role: 'standard', team: null,
      parts: { prep: prep[n] || 0 },
      detail: {
        partner: L.partnerName,
        partnerPortrait: L.partnerPortrait || null,
        partnerNote: L.partnerNote || null,
        resemblance: Math.round(resemblance * 100) / 100,
        ownLook: L.own, partnerLook: L.partner,
      },
    };
  }

  return {
    performances, events: [],
    runwayOverride: { walks: [{ category: 'the pair', sewn: false, categoryStyles: [] }] },
    scenes: [{ step: 'maxi-main', kind: 'makeover-reveal', data: {} }],
  };
}
