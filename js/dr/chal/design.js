// ══════════════════════════════════════════════════════════════════════
// dr/chal/design.js — build it, or act it: the shape is the same
// ══════════════════════════════════════════════════════════════════════
//
// Serves the design challenge, the acting challenge, the commercial and the
// improv challenge. Underneath they are one thing — prepare something in the
// werk room, then present it — and they differ in what is handed out: a design
// queen picks materials, everybody else drafts a part.
//
// The design night is the one that walks its own build (`sewn: true`), and it
// is the season's ONE design runway. The Ball is the only other look built on
// camera, and between them that is the three-runway budget the user set: two
// themed walks and one design.
import { pickOrder, contestFor, draftRoles } from '../assign.js';
import { prepareRoom, walkthrough } from '../prep.js';
import { dragOf } from '../queen.js';
import { blendScore, noise, ROLE_RANGES } from '../perform.js';
import { evt } from '../rules.js';

// `difficulty` cuts BOTH ways, which is what makes the pick a decision rather
// than a queue. It costs quality to work in car parts, and the panel pays for
// a look that obviously came out of car parts. A queen who cannot sew wants
// the curtains; a queen who can reaches for the hardware store.
export const MATERIALS = [
  { id: 'newspaper', name: 'Newspaper and tape', difficulty: 3 },
  { id: 'garden', name: 'Garden centre', difficulty: 4 },
  { id: 'kitchen', name: 'Kitchen supplies', difficulty: 4 },
  { id: 'hardware', name: 'Hardware store', difficulty: 5 },
  { id: 'toy-box', name: 'The toy box', difficulty: 3 },
  { id: 'party-shop', name: 'Party shop', difficulty: 2 },
  { id: 'pet-store', name: 'Pet store', difficulty: 5 },
  { id: 'stationery', name: 'Stationery cupboard', difficulty: 3 },
  { id: 'camping', name: 'Camping gear', difficulty: 4 },
  { id: 'bathroom', name: 'Bathroom cabinet', difficulty: 5 },
  { id: 'sports-kit', name: 'Sports kit', difficulty: 3 },
  { id: 'curtains', name: 'Curtains and upholstery', difficulty: 2 },
  { id: 'car-parts', name: 'Car parts', difficulty: 5 },
  { id: 'sweet-shop', name: 'Sweet shop', difficulty: 3 },
];

export const materialById = id => MATERIALS.find(m => m.id === id) || null;

const IS_DESIGN = id => id === 'design';
const PART_LADDER = ['lead', 'featured', 'standard', 'standard', 'ensemble'];
/** How far past the difficulty penalty the panel's reward reaches. */
const AMBITION = 0.5;
const CAN_SEW = 7;

export function assign(ctx) {
  const { living, players, rng, miniWinner, mini, maxi } = ctx;
  const order = pickOrder({ living, miniWinner, mini, rng });

  if (IS_DESIGN(maxi.id)) {
    const choices = Object.fromEntries(order.map(n => {
      const d = dragOf(players[n]);
      // Expected value, not raw ease: a strong designer's shortlist is the
      // hard sets, a weak one's is the easy ones. Same list, opposite order.
      const value = m => (d.design >= CAN_SEW ? m.difficulty * AMBITION : 0) - m.difficulty * 0.3;
      return [n, [...MATERIALS].sort((a, b) => value(b) - value(a)).map(m => m.id)];
    }));
    const { picks, events } = contestFor({ order, choices, players, rng });
    return {
      roles: Object.fromEntries(order.map(n => [n, 'standard'])),
      teams: [], order, picks, events,
      scenes: [{ step: 'choice', kind: 'material-picks', data: { picks } }],
    };
  }

  // Acting, commercial, improv: pairs or casts, with parts drafted per team so
  // every team has its own lead.
  const teams = [];
  if (maxi.format === 'pairs') {
    for (let i = 0; i < order.length; i += 2) teams.push(order.slice(i, i + 2));
  } else {
    const half = Math.ceil(order.length / 2);
    teams.push(order.slice(0, half), order.slice(half));
  }
  const roles = {};
  const picks = {};
  for (const t of teams) {
    const d = draftRoles({
      order: order.filter(n => t.includes(n)),
      roleNames: PART_LADDER.slice(0, t.length), rng, players,
    });
    Object.assign(roles, d.roles);
    for (const p of d.picks) picks[p.name] = { ...p, choice: p.role, penalty: 0 };
  }
  return {
    roles, teams, order, picks, events: [],
    scenes: [{ step: 'choice', kind: 'parts-draft', data: { teams, roles } }],
  };
}

export function prepare(ctx) {
  const { living, players, assignment, rng, maxi } = ctx;
  const r = prepareRoom(ctx);
  const w = walkthrough({ ...ctx, prep: r.prep });
  const events = [...r.events, ...w.events];
  const build = {};

  for (const n of living) {
    // The glue gun bites first, so the burn actually costs her the build
    // rather than being applied to a number already taken.
    if (rng() < 0.15) {
      w.prep[n] = (w.prep[n] || 0) - 0.5;
      events.push(evt('glue-gun', {
        players: [n], pop: { [n]: 1 },
        data: { material: materialById(assignment.picks[n]?.choice)?.name || null },
      }));
    }
    const d = dragOf(players[n]);
    const mat = IS_DESIGN(maxi.id) ? materialById(assignment.picks[n]?.choice) : null;
    const q = blendScore(d, maxi.blend) * 0.8
      - (mat ? mat.difficulty * 0.3 : 0) + (w.prep[n] || 0) + noise(rng, 1.5);
    build[n] = {
      quality: Math.round(q * 100) / 100,
      material: mat ? mat.name : null,
      materialId: mat ? mat.id : null,
      difficulty: mat ? mat.difficulty : null,
    };
  }

  return {
    prep: w.prep, events, build,
    scenes: [...r.scenes, {
      step: 'prep',
      kind: IS_DESIGN(maxi.id) ? 'workroom-build' : 'rehearsal',
      data: { build },
    }],
  };
}

export function perform(ctx) {
  const { living, players, maxi, assignment, prep, rng, bond, build } = ctx;
  const performances = {};

  for (const n of living) {
    const d = dragOf(players[n]);
    const range = ROLE_RANGES[assignment.roles[n]] ?? 1;
    const team = (assignment.teams || []).find(t => t.includes(n)) || null;
    const chem = team && team.length > 1
      ? team.filter(o => o !== n).reduce((s, o) => s + bond(n, o), 0) / (team.length - 1) * 0.12
      : 0;
    // The other half of the difficulty bargain: a hard material pays off only
    // if the thing she made out of it is actually good.
    const b = build?.[n];
    const ambition = IS_DESIGN(maxi.id) && b?.difficulty && b.quality > 5
      ? b.difficulty * AMBITION : 0;
    const base = blendScore(d, maxi.blend);
    const perf = (base - 5) * range + 5 + (prep[n] || 0) + chem + ambition
      - (assignment.picks[n]?.penalty || 0) + noise(rng, 2.3 * range);

    performances[n] = {
      perf: Math.round(perf * 100) / 100,
      moment: perf > 11,
      risk: (Number(players[n]?.stats?.boldness) || 5) / 10,
      role: assignment.roles[n],
      team: team ? assignment.teams.indexOf(team) : null,
      parts: { prep: prep[n] || 0, chem, ambition },
      detail: {
        material: b?.material || null,
        difficulty: b?.difficulty ?? null,
        buildQuality: b?.quality ?? null,
      },
    };
  }

  return {
    performances, events: [],
    runwayOverride: IS_DESIGN(maxi.id)
      ? { walks: [{ category: 'the look you built', sewn: true, categoryStyles: ['art', 'fashion'] }] }
      : null,
    scenes: [{
      step: maxi.stage === 'pre' ? 'maxi-pre' : 'maxi-main',
      kind: 'design-performance', data: {},
    }],
  };
}
