// ══════════════════════════════════════════════════════════════════════
// dr/chal/rusical.js — an original musical, cast in a draft
// ══════════════════════════════════════════════════════════════════════
//
// The parts are NAMED, which is the difference between this and any other team
// challenge. "She took the Sparkling Diamond and could not sing it" is a
// sentence the panel can say; "she took the lead role" is not. So the cast is
// resolved through contestFor over part names, and two queens wanting the same
// one is the scene the werk room is about that week.
//
// The live vocal is the other decision. It swings ±1.5 against ±0.4 for lip
// syncing to the recording — the biggest single risk a queen can take in a
// maxi challenge, taken by choice, and the panel remembers who took it.
import { pickOrder, contestFor } from '../assign.js';
import { prepareRoom, walkthrough } from '../prep.js';
import { dragOf } from '../queen.js';
import { noise, ROLE_RANGES } from '../perform.js';
import { evt } from '../rules.js';

const P = (role, name, spotlight, needs) => ({ role, name, spotlight, needs });

// Eight originals. Every one has exactly one lead, two or three featured parts
// and an ensemble, and the parts do not all want the same craft — a rusical
// that needed singing all the way down would be the same night eight times.
export const RUSICALS = [
  { id: 'divas-live', name: 'Divas Live On Ice', parts: [
    P('lead', 'The Headliner', 1.0, 'singing'), P('featured', 'The Rival', 0.7, 'acting'),
    P('featured', 'The Manager', 0.7, 'acting'), P('standard', 'The Skater', 0.45, 'dance'),
    P('standard', 'The Commentator', 0.45, 'acting'), P('ensemble', 'The Chorus', 0.2, 'dance'),
    P('ensemble', 'The Rink Staff', 0.2, 'dance')] },
  { id: 'moulin-ru', name: 'The Moulin Ru', parts: [
    P('lead', 'The Sparkling Diamond', 1.0, 'singing'), P('featured', 'The Poet', 0.7, 'singing'),
    P('featured', 'The Duke', 0.7, 'acting'), P('standard', 'The Doorman', 0.45, 'acting'),
    P('standard', 'The Absinthe Fairy', 0.45, 'dance'), P('ensemble', 'The Can-Can Line', 0.2, 'dance'),
    P('ensemble', 'The Patrons', 0.2, 'acting')] },
  { id: 'space-station', name: 'Space Station Sisters', parts: [
    P('lead', 'The Captain', 1.0, 'acting'), P('featured', 'The Engineer', 0.7, 'singing'),
    P('featured', 'The Alien', 0.7, 'dance'), P('standard', 'The Medic', 0.45, 'singing'),
    P('standard', 'The Cadet', 0.45, 'acting'), P('ensemble', 'The Crew', 0.2, 'dance')] },
  { id: 'high-school', name: 'Herstory High', parts: [
    P('lead', 'The Prom Queen', 1.0, 'singing'), P('featured', 'The Outcast', 0.7, 'acting'),
    P('featured', 'The Coach', 0.7, 'dance'), P('standard', 'The Nerd', 0.45, 'acting'),
    P('standard', 'The Jock', 0.45, 'dance'), P('ensemble', 'The Hall Monitors', 0.2, 'acting'),
    P('ensemble', 'The Marching Band', 0.2, 'dance')] },
  { id: 'wild-west', name: 'Gunslingers of Gulch City', parts: [
    P('lead', 'The Sheriff', 1.0, 'acting'), P('featured', 'The Saloon Singer', 0.7, 'singing'),
    P('featured', 'The Outlaw', 0.7, 'dance'), P('standard', 'The Barkeep', 0.45, 'acting'),
    P('standard', 'The Preacher', 0.45, 'singing'), P('ensemble', 'The Townsfolk', 0.2, 'acting')] },
  { id: 'soap-opera', name: 'As the Wig Turns', parts: [
    P('lead', 'The Matriarch', 1.0, 'acting'), P('featured', 'The Long-Lost Twin', 0.7, 'acting'),
    P('featured', 'The Doctor', 0.7, 'singing'), P('standard', 'The Nurse', 0.45, 'singing'),
    P('standard', 'The Lawyer', 0.45, 'acting'), P('ensemble', 'The Mourners', 0.2, 'dance')] },
  { id: 'fairy-tale', name: 'Once Upon a Werk Room', parts: [
    P('lead', 'The Princess', 1.0, 'singing'), P('featured', 'The Witch', 0.7, 'acting'),
    P('featured', 'The Woodcutter', 0.7, 'dance'), P('standard', 'The Mirror', 0.45, 'acting'),
    P('standard', 'The Godmother', 0.45, 'singing'), P('ensemble', 'The Forest', 0.2, 'dance')] },
  { id: 'disco-inferno', name: 'Disco Inferno: The Musical', parts: [
    P('lead', 'The Dancefloor Queen', 1.0, 'dance'), P('featured', 'The DJ', 0.7, 'singing'),
    P('featured', 'The Bouncer', 0.7, 'acting'), P('standard', 'The Regular', 0.45, 'dance'),
    P('standard', 'The New Girl', 0.45, 'singing'), P('ensemble', 'The Crowd', 0.2, 'dance')] },
];

export const rusicalById = id => RUSICALS.find(r => r.id === id) || null;

export function assign(ctx) {
  const { living, players, rng, miniWinner, mini, cfg } = ctx;
  const show = rusicalById(cfg?.rusical) || RUSICALS[Math.floor(rng() * RUSICALS.length)];
  const order = pickOrder({ living, miniWinner, mini, rng });

  // A cast bigger than the show gets more chorus. Never fewer parts than
  // queens: somebody standing in the wings is not a performance to judge.
  const parts = show.parts.slice(0, Math.max(order.length, 1));
  while (parts.length < order.length) {
    parts.push(P('ensemble', `The Chorus ${parts.length}`, 0.2, 'dance'));
  }

  // She wants the biggest part she can actually carry: spotlight counts double
  // against the craft the part needs, so a dancer reaches past the singing
  // lead for the featured part she can land.
  const choices = Object.fromEntries(order.map(n => {
    const d = dragOf(players[n]);
    return [n, [...parts]
      .sort((a, b) => (b.spotlight * 2 + d[b.needs]) - (a.spotlight * 2 + d[a.needs]))
      .map(p => p.name)];
  }));

  const { picks, events } = contestFor({ order, choices, players, rng });
  const roles = {};
  for (const n of order) {
    roles[n] = parts.find(p => p.name === picks[n]?.choice)?.role || 'ensemble';
  }

  return {
    roles, teams: [[...order]], order, picks, events, show, parts,
    scenes: [{ step: 'choice', kind: 'rusical-cast', data: { show: show.name, picks } }],
  };
}

export function prepare(ctx) {
  const { living, players, rng } = ctx;
  const r = prepareRoom(ctx);
  const w = walkthrough({ ...ctx, prep: r.prep });
  const events = [...r.events, ...w.events];
  const live = {};

  for (const n of living) {
    const d = dragOf(players[n]);
    const s = players[n]?.stats || {};
    // Two roads to the microphone: a voice, or the nerve to try without one.
    live[n] = d.singing >= 7 || (Number(s.boldness) || 5) >= 8;
    if (!live[n]) continue;
    // Only going live is an event. Lip syncing to the recording is what
    // everybody else does, and a scene per queen per week is a status line
    // rather than a night.
    const landed = d.singing >= 6;
    events.push(evt('live-vocal', {
      players: [n],
      pop: { [n]: landed ? 2 : -2 },
      data: { live: true, landed, singing: d.singing },
    }));
  }

  return {
    prep: w.prep, events, live,
    scenes: [...r.scenes, { step: 'prep', kind: 'vocal-choice', data: { live } }],
  };
}

export function perform(ctx) {
  const { living, players, assignment, prep, rng, live } = ctx;
  const show = assignment.show || RUSICALS[0];
  const parts = assignment.parts || show.parts;
  const performances = {};
  const events = [];

  for (const n of living) {
    const d = dragOf(players[n]);
    const partName = assignment.picks[n]?.choice;
    const part = parts.find(p => p.name === partName)
      || { role: 'ensemble', spotlight: 0.2, needs: 'dance', name: partName || 'The Chorus' };
    const range = ROLE_RANGES[part.role] ?? 1;
    const isLive = !!live?.[n];
    const base = d.singing * 0.35 + d.acting * 0.3 + d.dance * 0.25 + d.runway * 0.1;
    // The whole point of going live: a much wider swing, tilted by whether she
    // can actually sing. It is the biggest voluntary risk in a maxi challenge.
    const liveSwing = isLive ? noise(rng, 1.5) + (d.singing - 5) * 0.2 : noise(rng, 0.4);
    const perf = (base - 5) * range + 5 + (prep[n] || 0)
      - (assignment.picks[n]?.penalty || 0) + liveSwing + noise(rng, 2.0 * range);

    if (part.role === 'ensemble' && perf < 5) {
      events.push(evt('invisible', { players: [n], pop: { [n]: -1 }, data: { part: part.name } }));
    }

    performances[n] = {
      perf: Math.round(perf * 100) / 100,
      moment: perf > 11,
      risk: isLive ? 0.8 : 0.3,
      role: part.role,
      team: 0,
      parts: { prep: prep[n] || 0, liveSwing: Math.round(liveSwing * 100) / 100 },
      detail: { show: show.name, showId: show.id, part: part.name, live: isLive },
    };
  }

  return {
    performances, runwayOverride: null, events,
    scenes: [{ step: 'maxi-main', kind: 'rusical-performance', data: { show: show.name } }],
  };
}
