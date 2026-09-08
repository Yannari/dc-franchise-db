// ══════════════════════════════════════════════════════════════════════
// dr/chal/acting.js — the set, the director, and the one take
// ══════════════════════════════════════════════════════════════════════
//
// Acting, the commercial and improv used to run on design.js: draft a nameless
// lead, blend-check acting and comedy, done. Three of nineteen challenges were
// the design challenge with different weights, which is why they read the same.
//
// The catalogue already said what these are. The acting desc promises a
// scripted parody with named parts, a rehearsal, one walkthrough, and a shoot
// where forgetting lines, stepping on a scene partner, or playing every part
// the same way is what buries you. None of that existed. This is that.
//
// THE THREE ARE GENUINELY DIFFERENT, and the differences are mechanical rather
// than cosmetic:
//
//   acting      named parts, a rehearsal that can be fixed, and a take where
//               specific things go wrong. Prep matters most here.
//   commercial  pairs, thirty seconds, and a product with a trap in it. The
//               pair either finds an angle or plays the obvious one.
//   improv      NO PREPARATION AT ALL. She gets a premise cold, on stage, and
//               nerve carries it where craft would carry the other two.
import { pickOrder, contestFor, draftRoles } from '../assign.js';
import { prepareRoom } from '../prep.js';
import { SCRIPTS, PRODUCTS, PREMISES } from '../data/scenes.js';
import { dragOf } from '../queen.js';
import { blendScore, noise, ROLE_RANGES, riskFor } from '../perform.js';
import { evt } from '../rules.js';

const stat = (p, k) => {
  const n = Number(p?.stats?.[k]);
  return Number.isFinite(n) ? n : 5;
};
const pickOne = (arr, rng) => arr[Math.floor(rng() * arr.length)];

/** How much a director's note is worth when she actually takes it. */
const NOTE_HELP = 0.9;
/** And what ignoring a good one costs. */
const NOTE_COST = 0.6;

export function assign(ctx) {
  const { living, players, rng, miniWinner, mini, maxi, bond } = ctx;
  const order = pickOrder({ living, miniWinner, mini, rng });

  // ── IMPROV: nothing is cast, because nothing is prepared ──
  if (maxi.id === 'improv') {
    const picks = {};
    const taken = new Set();
    for (const n of order) {
      let prem = pickOne(PREMISES, rng);
      let guard = 0;
      while (taken.has(prem.id) && guard++ < 20) prem = pickOne(PREMISES, rng);
      taken.add(prem.id);
      picks[n] = { name: n, choice: prem.id, premise: prem.name, penalty: 0, lostTo: null };
    }
    return {
      roles: Object.fromEntries(order.map(n => [n, 'standard'])),
      teams: [], order, picks, events: [], form: 'improv',
      scenes: [{ step: 'choice', kind: 'improv-premises', data: { picks } }],
    };
  }

  // ── COMMERCIAL: pairs, and a product each ──
  if (maxi.id === 'commercial') {
    const teams = [];
    for (let i = 0; i < order.length; i += 2) teams.push(order.slice(i, i + 2));
    const picks = {};
    const used = new Set();
    for (const t of teams) {
      let prod = pickOne(PRODUCTS, rng);
      let guard = 0;
      while (used.has(prod.id) && guard++ < 20) prod = pickOne(PRODUCTS, rng);
      used.add(prod.id);
      for (const n of t) {
        picks[n] = { name: n, choice: prod.id, product: prod.name, angle: prod.angle, penalty: 0, lostTo: null };
      }
    }
    return {
      roles: Object.fromEntries(order.map(n => [n, 'standard'])),
      teams, order, picks, events: [], form: 'commercial',
      scenes: [{ step: 'choice', kind: 'commercial-products', data: { teams, picks } }],
    };
  }

  // ── ACTING: a script, split into casts, with named parts drafted ──
  const script = pickOne(SCRIPTS, rng);
  const half = Math.ceil(order.length / 2);
  const teams = order.length >= 8 ? [order.slice(0, half), order.slice(half)] : [[...order]];
  const picks = {};
  const roles = {};
  const events = [];

  for (const t of teams) {
    const teamOrder = order.filter(n => t.includes(n));
    const parts = script.parts.slice(0, Math.max(teamOrder.length, 1));
    while (parts.length < teamOrder.length) {
      parts.push({ role: 'ensemble', name: `Extra ${parts.length}`, spotlight: 0.2, needs: 'comedy' });
    }
    // She wants the biggest part she can carry — spotlight against the craft
    // the part actually needs, so a comic reaches past the dramatic lead.
    const choices = Object.fromEntries(teamOrder.map(n => {
      const d = dragOf(players[n]);
      return [n, [...parts]
        .sort((a, b) => (b.spotlight * 2 + d[b.needs]) - (a.spotlight * 2 + d[a.needs]))
        .map(p => p.name)];
    }));
    const c = contestFor({ order: teamOrder, choices, players, rng, bond });
    events.push(...c.events);
    for (const n of teamOrder) {
      picks[n] = { ...c.picks[n], part: c.picks[n].choice };
      roles[n] = parts.find(p => p.name === c.picks[n].choice)?.role || 'ensemble';
    }
  }

  return {
    roles, teams, order, picks, events, script, form: 'acting',
    scenes: [{ step: 'choice', kind: 'acting-cast', data: { script: script.name, picks } }],
  };
}

/**
 * The rehearsal, and the director.
 *
 * This is the back-and-forth the challenge was missing entirely. A director
 * gives a note, and whether it helps depends on two separate things that are
 * not the same thing: `intuition` decides whether she understands what she is
 * being asked for, and `boldness` decides whether she is willing to throw away
 * what she prepared this late. So a queen can hear a good note and refuse it,
 * or take a note she has misread — and both cost her.
 *
 * IMPROV HAS NO REHEARSAL. That is the point of improv.
 */
export function prepare(ctx) {
  const { living, players, rng, maxi, assignment } = ctx;
  const r = prepareRoom(ctx);
  const events = [...r.events];
  const notes = [];
  const prep = { ...r.prep };

  if (maxi.id === 'improv') {
    return {
      prep, events, notes,
      scenes: [...r.scenes, { step: 'prep', kind: 'no-rehearsal', data: {} }],
    };
  }

  for (const n of living) {
    const good = rng() < 0.75;
    const reads = rng() < 0.25 + stat(players[n], 'intuition') / 20;
    const acts = rng() < 0.30 + stat(players[n], 'boldness') / 16;
    const took = (good ? reads : !reads) && acts;
    const delta = good ? (took ? NOTE_HELP : -NOTE_COST) : (took ? -NOTE_HELP : 0.2);
    prep[n] = (prep[n] || 0) + delta;
    notes.push({ name: n, good, took, delta: Math.round(delta * 100) / 100 });

    // Only the notable halves are events. A queen quietly taking a sensible
    // note is a rehearsal, not a scene.
    if (good && !took) {
      events.push(evt('ignored-the-note', {
        players: [n], pop: { [n]: -1 }, data: { challenge: maxi.id },
      }));
    } else if (!good && took) {
      events.push(evt('took-a-bad-note', {
        players: [n], pop: { [n]: -1 }, data: { challenge: maxi.id },
      }));
    }
  }

  return {
    prep, events, notes,
    scenes: [...r.scenes, {
      step: 'prep',
      kind: assignment.form === 'commercial' ? 'commercial-pitch' : 'rehearsal',
      data: { notes },
    }],
  };
}

export function perform(ctx) {
  const { living, players, maxi, assignment, prep, rng, bond } = ctx;
  const performances = {};
  const events = [];
  const form = assignment.form || 'acting';
  const script = assignment.script || null;

  for (const n of living) {
    const d = dragOf(players[n]);
    const pick = assignment.picks?.[n] || {};
    const range = ROLE_RANGES[assignment.roles?.[n]] ?? 1;
    const team = (assignment.teams || []).find(t => t.includes(n)) || null;
    const chem = team && team.length > 1
      ? team.filter(o => o !== n).reduce((s, o) => s + bond(n, o), 0) / (team.length - 1) * 0.15
      : 0;

    let base = blendScore(d, maxi.blend);
    let detail = {};

    if (form === 'improv') {
      // NO PREP TERM AT ALL, and nerve is half the score. A cautious queen
      // with better craft loses to a fearless one who commits, which is what
      // improv actually rewards and what makes it a different challenge.
      const nerve = stat(players[n], 'boldness');
      base = d.comedy * 0.35 + d.acting * 0.25 + nerve * 0.4;
      const froze = rng() < Math.max(0.05, 0.4 - nerve / 25);
      if (froze) {
        base -= 2.2;
        events.push(evt('froze', {
          players: [n], pop: { [n]: -2 }, data: { premise: pick.premise },
        }));
      } else if (nerve >= 8 && rng() < 0.35) {
        base += 1.4;
        events.push(evt('ran-with-it', {
          players: [n], pop: { [n]: 3 }, data: { premise: pick.premise },
        }));
      }
      detail = { premise: pick.premise, froze };
    } else if (form === 'commercial') {
      // The product has a trap. Finding the angle is worth more than polish.
      const found = rng() < 0.25 + (d.comedy + stat(players[n], 'strategic')) / 40;
      base += found ? 1.3 : -0.7;
      if (found) {
        events.push(evt('found-the-angle', {
          players: [n], pop: { [n]: 2 }, data: { product: pick.product },
        }));
      } else if (rng() < 0.3) {
        events.push(evt('tagline-died', {
          players: [n], pop: { [n]: -1 }, data: { product: pick.product },
        }));
      }
      detail = { product: pick.product, foundAngle: found };
    } else {
      // ── THE TAKE. One shot, and three specific ways to lose it. ──
      const part = script?.parts.find(p => p.name === pick.part) || null;
      const memory = stat(players[n], 'mental');
      const dropped = rng() < Math.max(0.04, 0.30 - memory / 30 - (prep[n] || 0) * 0.05);
      if (dropped) {
        base -= 1.6;
        events.push(evt('dropped-a-line', {
          players: [n], pop: { [n]: -2 }, data: { part: pick.part },
        }));
      }
      // Talking over a scene partner: a bold queen in a shared scene.
      const partner = team && team.length > 1 ? team.find(o => o !== n) : null;
      if (partner && stat(players[n], 'boldness') >= 7 && rng() < 0.22) {
        base += 0.4;
        events.push(evt('stepped-on-her', {
          players: [n, partner], bond: [[n, partner, -1.5]], pop: { [n]: -1 },
          data: { part: pick.part },
        }));
      }
      // Playing every part the same way — the note the panel gives most.
      if (d.acting <= 4 && d.comedy <= 5) {
        base -= 1.0;
        events.push(evt('one-note', {
          players: [n], pop: { [n]: -1 }, data: { part: pick.part },
        }));
      }
      detail = { script: script?.name || null, part: pick.part, dropped, needs: part?.needs || null };
    }

    const prepTerm = form === 'improv' ? 0 : (prep[n] || 0);
    const perf = (base - 5) * range + 5 + prepTerm + chem
      - (pick.penalty || 0) + noise(rng, 2.2 * range);

    performances[n] = {
      perf: Math.round(perf * 100) / 100,
      moment: perf > 11,
      risk: riskFor(players[n], rng),
      role: assignment.roles?.[n] || 'standard',
      team: team ? assignment.teams.indexOf(team) : null,
      parts: { prep: prepTerm, chem },
      detail,
    };
  }

  return {
    performances, runwayOverride: null, events,
    scenes: [{
      step: maxi.stage === 'pre' ? 'maxi-pre' : 'maxi-main',
      kind: `${form}-take`,
      data: { script: script?.name || null, form },
    }],
  };
}
