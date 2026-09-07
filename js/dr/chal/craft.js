// ══════════════════════════════════════════════════════════════════════
// dr/chal/craft.js — the last four that had no mechanics of their own
// ══════════════════════════════════════════════════════════════════════
//
// The photoshoot, the choreography challenge, the singing challenge and the
// runway challenge all ran on _generic.js: one blend check, no decisions, no
// events. Four of nineteen types were a number with a name on it.
//
// Every one of them already had its rules written down in the catalogue and
// nothing implemented them. This is those four descriptions, built.
//
//   photoshoot  a set that FIGHTS BACK, and the best frame counts rather than
//               the average — she needs one shot, not a good run.
//   choreography a routine taught by a choreographer, formations that can be
//               blown, and one featured solo per team.
//   singing     live, with a band, where the specific failures are a cracked
//               note and a forgotten lyric.
//   runway      three looks judged separately, where repeating yourself across
//               them is its own failure.
import { pickOrder, draftRoles } from '../assign.js';
import { prepareRoom, walkthrough } from '../prep.js';
import { dragOf } from '../queen.js';
import { blendScore, noise, ROLE_RANGES } from '../perform.js';
import { evt } from '../rules.js';

const stat = (p, k) => {
  const n = Number(p?.stats?.[k]);
  return Number.isFinite(n) ? n : 5;
};
const pickOne = (a, rng) => a[Math.floor(rng() * a.length)];

/** What the photoshoot set does to her. */
export const HAZARDS = [
  { id: 'wind', name: 'a wind machine on its highest setting' },
  { id: 'water', name: 'water, from above, without warning' },
  { id: 'platform', name: 'a platform that will not stop moving' },
  { id: 'co-star', name: 'a co-star who will not cooperate' },
  { id: 'confetti', name: 'confetti fired directly at her face' },
  { id: 'heat', name: 'lights hot enough to melt the makeup' },
  { id: 'animal', name: 'a live animal with opinions of its own' },
  { id: 'harness', name: 'a harness holding her at an angle nobody stands at' },
];

/** The three walks of a runway challenge. */
export const RUNWAY_TRIOS = [
  { id: 'colour', name: 'One Colour Story', cats: ['Head to toe red', 'Head to toe white', 'Head to toe gold'] },
  { id: 'decades', name: 'Three Decades', cats: ['The forties', 'The seventies', 'The nineties'] },
  { id: 'texture', name: 'Texture', cats: ['Leather', 'Feathers', 'Chrome'] },
  { id: 'silhouette', name: 'Silhouette', cats: ['Exaggerated hips', 'A column', 'All shoulder'] },
  { id: 'elements', name: 'The Elements', cats: ['Earth', 'Air', 'Fire'] },
  { id: 'night', name: 'Night Out', cats: ['Cocktail hour', 'The club', 'Four in the morning'] },
];

const FRAMES = 4;

export function assign(ctx) {
  const { living, players, rng, miniWinner, mini, maxi } = ctx;
  const order = pickOrder({ living, miniWinner, mini, rng });

  if (maxi.id === 'photoshoot') {
    // Every queen gets the same set with the same hazard: it resets between
    // them, so the hazard is the challenge rather than a piece of luck.
    const hazard = pickOne(HAZARDS, rng);
    return {
      roles: Object.fromEntries(order.map(n => [n, 'standard'])),
      teams: [], order, picks: {}, events: [], hazard, form: 'photoshoot',
      scenes: [{ step: 'maxi-announce', kind: 'photoshoot-set', data: { hazard } }],
    };
  }

  if (maxi.id === 'runway-challenge') {
    const trio = pickOne(RUNWAY_TRIOS, rng);
    return {
      roles: Object.fromEntries(order.map(n => [n, 'standard'])),
      teams: [], order, picks: {}, events: [], trio, form: 'runway',
      scenes: [{ step: 'maxi-announce', kind: 'runway-trio', data: { trio } }],
    };
  }

  if (maxi.id === 'singing') {
    // The mini set the order, and going late after a good performance is
    // harder than going early — the same room-temperature idea as the roast.
    const picks = Object.fromEntries(order.map((n, i) => ({ n, i }))
      .map(({ n, i }) => [n, { name: n, choice: `slot-${i + 1}`, slot: i + 1, penalty: 0, lostTo: null }]));
    return {
      roles: Object.fromEntries(order.map(n => [n, 'standard'])),
      teams: [], order, picks, events: [], form: 'singing',
      scenes: [{ step: 'choice', kind: 'singing-order', data: { order } }],
    };
  }

  // ── choreography: teams, and one featured solo written into each ──
  const half = Math.ceil(order.length / 2);
  const teams = order.length >= 6 ? [order.slice(0, half), order.slice(half)] : [[...order]];
  const roles = {};
  const picks = {};
  for (const t of teams) {
    const ladder = ['lead', ...Array(Math.max(0, t.length - 1)).fill('standard')];
    const d = draftRoles({ order: order.filter(n => t.includes(n)), roleNames: ladder, rng, players });
    Object.assign(roles, d.roles);
    for (const p of d.picks) picks[p.name] = { ...p, choice: p.role, penalty: 0 };
  }
  return {
    roles, teams, order, picks, events: [], form: 'choreography',
    scenes: [{ step: 'choice', kind: 'solo-draft', data: { teams, roles } }],
  };
}

export function prepare(ctx) {
  const { living, players, rng, assignment } = ctx;
  const r = prepareRoom(ctx);
  const w = walkthrough({ ...ctx, prep: r.prep });
  const events = [...r.events, ...w.events];
  const pickup = {};

  // Choreography and singing both have somebody teaching them the material,
  // and picking it up quickly is a real skill that is not the same as
  // performing it well.
  if (assignment.form === 'choreography' || assignment.form === 'singing') {
    for (const n of living) {
      const d = dragOf(players[n]);
      const craft = assignment.form === 'choreography' ? d.dance : d.singing;
      const q = (craft * 0.5 + stat(players[n], 'mental') * 0.5 - 5) * 0.25 + noise(rng, 0.8);
      pickup[n] = Math.round(q * 100) / 100;
      w.prep[n] = (w.prep[n] || 0) + q;
      if (q < -0.9) {
        events.push(evt('lost-in-rehearsal', {
          players: [n], pop: { [n]: -1 }, data: { form: assignment.form },
        }));
      }
    }
  }

  return {
    prep: w.prep, events, pickup,
    scenes: [...r.scenes, {
      step: 'prep',
      kind: assignment.form === 'choreography' ? 'studio-rehearsal'
        : assignment.form === 'singing' ? 'band-rehearsal' : 'styling',
      data: { pickup },
    }],
  };
}

export function perform(ctx) {
  const { living, players, maxi, assignment, prep, rng, bond } = ctx;
  const performances = {};
  const events = [];
  const form = assignment.form || 'photoshoot';

  // The room temperature for singing: going after somebody good is harder.
  const singingOrder = form === 'singing'
    ? [...living].sort((a, b) => (assignment.picks[a]?.slot || 99) - (assignment.picks[b]?.slot || 99))
    : living;
  let roomLift = 0;

  for (const n of (form === 'singing' ? singingOrder : living)) {
    const d = dragOf(players[n]);
    let score = 0;
    let detail = {};

    if (form === 'photoshoot') {
      // FOUR FRAMES, AND THE BEST ONE COUNTS. She needs one shot, not a good
      // average, which is the whole difference between this and every other
      // solo craft check.
      const hazard = assignment.hazard;
      const frames = [];
      for (let f = 0; f < FRAMES; f++) {
        // Does she use the set or fight it? Nerve and acting decide.
        const uses = rng() < 0.25 + (stat(players[n], 'boldness') + d.acting) / 40;
        frames.push(Math.round((blendScore(d, maxi.blend) + (uses ? 1.2 : -1.0)
          + (prep[n] || 0) + noise(rng, 1.8)) * 100) / 100);
      }
      score = Math.max(...frames);
      const blank = frames.every(f => f < 4);
      if (blank) {
        events.push(evt('blank-frame', {
          players: [n], pop: { [n]: -2 }, data: { hazard: hazard?.name },
        }));
      } else if (score > 9) {
        events.push(evt('used-the-set', {
          players: [n], pop: { [n]: 2 }, data: { hazard: hazard?.name },
        }));
      }
      detail = { hazard: hazard?.name || null, frames, best: score };
    } else if (form === 'choreography') {
      const team = (assignment.teams || []).find(t => t.includes(n)) || [];
      const range = ROLE_RANGES[assignment.roles[n]] ?? 1;
      // Formations are a TEAM fact: she can be clean and still be in a mess.
      const sync = team.length > 1
        ? team.filter(o => o !== n).reduce((s, o) => s + bond(n, o), 0) / (team.length - 1) * 0.12
        : 0;
      const blew = rng() < Math.max(0.05, 0.35 - d.dance / 25 - (prep[n] || 0) * 0.05);
      score = (blendScore(d, maxi.blend) - 5) * range + 5 + (prep[n] || 0) + sync
        + (blew ? -1.8 : 0) + noise(rng, 2.0 * range);
      if (blew) {
        events.push(evt('blew-the-formation', { players: [n], pop: { [n]: -2 }, data: {} }));
      }
      if (assignment.roles[n] === 'lead' && score > 9) {
        events.push(evt('nailed-the-solo', { players: [n], pop: { [n]: 3 }, data: {} }));
      }
      detail = { solo: assignment.roles[n] === 'lead', blewFormation: blew };
    } else if (form === 'singing') {
      // Live, with a band. Two named ways to lose it.
      const cracked = rng() < Math.max(0.04, 0.35 - d.singing / 22);
      const forgot = rng() < Math.max(0.03, 0.25 - stat(players[n], 'mental') / 30);
      const rooted = d.dance <= 4 && rng() < 0.4;
      score = blendScore(d, maxi.blend) + (prep[n] || 0) + roomLift
        + (cracked ? -1.9 : 0) + (forgot ? -1.5 : 0) + (rooted ? -0.8 : 0)
        + noise(rng, 1.9);
      if (cracked) events.push(evt('cracked-a-note', { players: [n], pop: { [n]: -2 }, data: {} }));
      if (forgot) events.push(evt('forgot-the-lyric', { players: [n], pop: { [n]: -2 }, data: {} }));
      if (!cracked && !forgot && score > 9) {
        events.push(evt('sang-it-out', { players: [n], pop: { [n]: 3 }, data: {} }));
      }
      roomLift = Math.max(-1, Math.min(1, roomLift + (score > 8 ? 0.25 : score < 4 ? -0.25 : 0)));
      detail = { slot: assignment.picks[n]?.slot, cracked, forgot, rooted };
    } else {
      // ── THREE WALKS, JUDGED SEPARATELY, AND REPEATING YOURSELF FAILS ──
      const trio = assignment.trio;
      const walks = (trio?.cats || ['One', 'Two', 'Three']).map(cat => Math.round(
        (d.runway * 0.8 + d.design * 0.2 + (prep[n] || 0) + noise(rng, 1.9)) * 100) / 100);
      // A narrow queen produces three versions of the same look, and the panel
      // says so. Range across her own walks is the measure.
      const spread = Math.max(...walks) - Math.min(...walks);
      const repeated = spread < 1.2 && d.design <= 5;
      score = walks.reduce((a, b) => a + b, 0) / walks.length + (repeated ? -1.4 : 0);
      if (repeated) {
        events.push(evt('repeated-herself', {
          players: [n], pop: { [n]: -2 }, data: { trio: trio?.name },
        }));
      }
      detail = { trio: trio?.name || null, cats: trio?.cats || [], walks, repeated };
    }

    performances[n] = {
      perf: Math.round(score * 100) / 100,
      moment: score > 10.5,
      risk: stat(players[n], 'boldness') / 10,
      role: assignment.roles?.[n] || 'standard',
      team: (assignment.teams || []).findIndex(t => t.includes(n)),
      parts: { prep: prep[n] || 0 },
      detail,
    };
  }

  return {
    performances,
    // A runway challenge has no werk room build, so it walks its three
    // categories instead of the night's single themed walk.
    runwayOverride: form === 'runway' && assignment.trio
      ? {
        theme: assignment.trio.name,
        walks: assignment.trio.cats.map(c => ({ category: c, sewn: false, categoryStyles: [] })),
      }
      : null,
    events,
    scenes: [{
      step: maxi.stage === 'pre' ? 'maxi-pre' : 'maxi-main',
      kind: `${form}-performance`, data: { form },
    }],
  };
}
