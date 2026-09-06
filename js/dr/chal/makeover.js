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
// Two kinds of pool, and they behave differently on purpose. A pit crew or a
// returning queen is a SHARED resource — one of them, several queens who want
// her, so it is drafted and somebody misses out. Family is not: two queens can
// both bring their mother, and drafting relationship types as if there were
// only one mother in the world would be nonsense.
import { pickOrder, contestFor } from '../assign.js';
import { prepareRoom, walkthrough } from '../prep.js';
import { dragOf } from '../queen.js';
import { noise } from '../perform.js';
import { evt } from '../rules.js';

const crew = (name, ease) => ({ id: name.toLowerCase().replace(/\W+/g, '-'), name, ease });

// `ease` is how well a partner takes to it: a dancer walks, a shy one has to
// be carried through every step of it.
export const PARTNER_POOLS = {
  'pit-crew': [crew('Marco', 8), crew('Devon', 6), crew('Rafa', 9), crew('Ty', 5), crew('Bruno', 7),
    crew('Kai', 8), crew('Sol', 4), crew('Ivo', 6), crew('Nate', 9), crew('Quin', 5),
    crew('Ash', 7), crew('Rome', 6)],
  family: [crew('her mother', 4), crew('her brother', 6), crew('her sister', 8), crew('her father', 3),
    crew('her cousin', 7), crew('her best friend', 9), crew('her aunt', 5), crew('her nephew', 6),
    crew('her uncle', 3), crew('her twin', 9), crew('her neighbour', 5), crew('her drag mother', 10)],
  // Built at run time from the queens already sent home.
  eliminated: null,
};

/** Family is personal; a pit crew and a returning queen are shared. */
const CONTESTED = new Set(['pit-crew', 'eliminated']);

function poolFor(cfg, state, players) {
  if (cfg?.makeoverPool === 'eliminated') {
    return (state?.out || []).map(n => ({
      id: n.toLowerCase(), name: n,
      ease: players[n] ? dragOf(players[n]).runway : 7,
      isQueen: true,
    }));
  }
  return PARTNER_POOLS[cfg?.makeoverPool] || PARTNER_POOLS['pit-crew'];
}

export function assign(ctx) {
  const { living, players, rng, miniWinner, mini, cfg, state, bond } = ctx;
  const poolKey = cfg?.makeoverPool || 'pit-crew';
  let pool = poolFor(cfg, state, players);
  // A returnee pool can be empty in an early week. Fall back rather than
  // pairing everybody with nobody.
  if (!pool.length) pool = PARTNER_POOLS['pit-crew'];

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
      order, choices, players, rng,
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
  const pool = assignment.pool || PARTNER_POOLS['pit-crew'];
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
      risk: (Number(players[n]?.stats?.boldness) || 5) / 10,
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
