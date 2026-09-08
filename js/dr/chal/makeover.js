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

const crew = (name, ease) => ({ id: name.toLowerCase().replace(/\W+/g, '-'), name, ease });

// `ease` is how well a partner takes to it: a dancer walks, a shy one has to
// be carried through every step of it.
export const PARTNER_POOLS = {
  // The most-booked version: fans of the show, thrilled to be there.
  superfans: [crew('Marco', 9), crew('Devon', 8), crew('Rafa', 9), crew('Ty', 7),
    crew('Bruno', 8), crew('Kai', 9), crew('Sol', 7), crew('Ivo', 8),
    crew('Nate', 9), crew('Quin', 7), crew('Ash', 8), crew('Rome', 8)],
  // Service veterans. Game, disciplined, starting from zero.
  veterans: [crew('Sergeant Hale', 5), crew('Corporal Diaz', 6), crew('Captain Boone', 4),
    crew('Private Okafor', 7), crew('Major Reyes', 4), crew('Lieutenant Frost', 5),
    crew('Sergeant Vance', 6), crew('Corporal Mbeki', 7), crew('Officer Lange', 5),
    crew('Airman Cole', 6), crew('Gunner Petrov', 4), crew('Ensign Marsh', 6)],
  // Older guests, who have usually seen more than the queen painting them.
  seniors: [crew('Dot', 6), crew('Winifred', 5), crew('Harold', 4), crew('Estelle', 7),
    crew('Mabel', 6), crew('Cyril', 3), crew('Norma', 7), crew('Reg', 4),
    crew('Joyce', 6), crew('Albert', 3), crew('Pearl', 8), crew('Stan', 5)],
  // Athletes: physically fearless and completely lost in a heel.
  athletes: [crew('Ash Kovac', 6), crew('Bex Toure', 7), crew('Cam Whitlock', 5),
    crew('Dani Ferraro', 8), crew('Emeka Bright', 6), crew('Frankie Sol', 7),
    crew('Gio Vance', 5), crew('Hana Belov', 8), crew('Iggy Marsh', 6),
    crew('Jules Okonkwo', 7), crew('Kit Rasmussen', 5), crew('Lex Amari', 6)],
  // The show's own crew, when the season books that version.
  'pit-crew': [crew('Marco', 8), crew('Devon', 6), crew('Rafa', 9), crew('Ty', 5),
    crew('Bruno', 7), crew('Kai', 8), crew('Sol', 4), crew('Ivo', 6),
    crew('Nate', 9), crew('Quin', 5), crew('Ash', 7), crew('Rome', 6)],
  // The one cohort that is not shared: her own person, so nothing is drafted
  // and two queens can both bring a sister.
  'loved-ones': [crew('her mother', 4), crew('her brother', 6), crew('her sister', 8),
    crew('her father', 3), crew('her cousin', 7), crew('her best friend', 9),
    crew('her aunt', 5), crew('her nephew', 6), crew('her uncle', 3),
    crew('her twin', 9), crew('her neighbour', 5), crew('her drag mother', 10)],
  // Built at run time from the queens already sent home.
  eliminated: null,
};

/** Which cohorts a season can book. */
export const PARTNER_COHORTS = ['superfans', 'veterans', 'seniors', 'athletes',
  'pit-crew', 'loved-ones', 'eliminated'];

/** Everybody competes for a shared guest; loved ones are already hers. */
const CONTESTED = new Set(['superfans', 'veterans', 'seniors', 'athletes',
  'pit-crew', 'eliminated']);

function poolFor(cfg, state, players) {
  if (cfg?.makeoverPool === 'eliminated') {
    return (state?.out || []).map(n => ({
      id: n.toLowerCase(), name: n,
      ease: players[n] ? dragOf(players[n]).runway : 7,
      isQueen: true,
    }));
  }
  return PARTNER_POOLS[cfg?.makeoverPool] || PARTNER_POOLS.superfans;
}

export function assign(ctx) {
  const { living, players, rng, miniWinner, mini, cfg, state, bond } = ctx;
  const poolKey = cfg?.makeoverPool || 'superfans';
  let pool = poolFor(cfg, state, players);
  // A returnee pool can be empty in an early week. Fall back rather than
  // pairing everybody with nobody.
  if (!pool.length) pool = PARTNER_POOLS.superfans;

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
  const pool = assignment.pool || PARTNER_POOLS.superfans;
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
