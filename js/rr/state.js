// ══════════════════════════════════════════════════════════════════════
// rr/state.js — The Ridonculous Race's season state
// ══════════════════════════════════════════════════════════════════════
//
// Spec docs/superpowers/specs/2026-10-18-ridonculous-race-design.md §2, §6, §7.
// The season plays in its own `gs` (bonds live there, read through js/bonds.js)
// plus this state object, which holds everything a bond cannot: the teams and
// their relationship and identity, money, passes, the mind meters, who leads
// each pair, what each team has seen of the others, alliances, rivalries, and
// the scenes the story layer will write from (an event is a scene; `seenBy`
// says who knows).
import { players } from '../core.js';
import { mayScheme, S } from '../ch/state.js';

export { mayScheme, S };

// How two people are tied. `family` rules romance out (spec §2); `snap` scales how
// fast the pair snaps at each other under pressure (identities doc, "temperament off
// the task": exes snap fastest, a grandparent swallows it for the grandchild).
export const REL = {
  'parent-child': { family: true, snap: 0.8 },
  siblings: { family: true, snap: 1.1 },
  cousins: { family: true, snap: 0.9 },
  'grandparent-grandchild': { family: true, snap: 0.6 },
  married: { snap: 0.9 },
  dating: { snap: 1.0 },
  'newly-dating': { snap: 1.0 },
  'on-off': { snap: 1.3 },
  exes: { snap: 1.5 },
  'once-engaged': { snap: 1.4 },
  bffs: { snap: 0.8 },
  coworkers: { snap: 1.0 },
  roommates: { snap: 1.0 },
  rivals: { snap: 1.3 },
  enemies: { snap: 1.6 },
  'reality-vets': { snap: 1.0 },
};

export function blankRecord() {
  return { legWins: 0, lasts: 0, penalties: 0, begged: 0, sabotage: 0, caught: 0, helped: 0, quits: 0 };
}

export function newState(seed, options) {
  return {
    seed, options,
    teams: {}, order: [], gone: [], people: [],
    money: {}, debts: [],
    passes: {},
    botch: { last: {}, count: {} },
    mind: {}, lead: {}, rec: {},
    seen: {},
    alliances: [], rivalry: {},
    couples: [], sparks: {},
    speedBump: {}, marked: {}, carryPenalty: {},
    scenes: [], legs: [], leg: 0,
    // gratitude, never money: { from, to, leg } (a help, a rescue)
    owes: [],
    // minutes to serve at this leg's mat
    pending: {},
    snapped: {},
    noMoney: {}, noBag: {},
    lastOrder: [],
    boomeranged: {},
    // the minute of the day the current leg starts (7 AM for the first)
    clock: 420,
  };
}

const lead2 = n => S(n, 'strategic') + S(n, 'boldness');

export function addTeams(state, teams) {
  for (const t of teams) {
    state.teams[t.id] = { ...t };
    state.order.push(t.id);
    state.people.push(t.a, t.b);
    state.money[t.id] = 0;
    state.passes[t.id] = { express: 0, save: 0, boomerang: 0 };
    state.rec[t.id] = blankRecord();
    for (const n of [t.a, t.b]) state.mind[n] = { energy: 100, morale: 60, stress: 10 };
    state.lead[t.id] = lead2(t.b) > lead2(t.a) ? t.b : t.a;
  }
}

export function partner(state, teamId, name) {
  const t = state.teams[teamId];
  return t.a === name ? t.b : t.a;
}

export function teamOf(state, name) {
  return Object.values(state.teams).find(t => t.a === name || t.b === name)?.id ?? null;
}

// One scene: what happened, who was in it, who knows. `data` holds what it decided; the
// words are written later, from the record (manual §19.2).
export function addScene(state, kind, who, data = {}, seenBy = who) {
  const sc = { id: state.scenes.length + 1, leg: state.leg, t: data.t ?? null, kind,
    who: [...who], data, seenBy: [...new Set(seenBy)] };
  state.scenes.push(sc);
  return sc;
}

export const archetypeOf = name => players.find(p => p.name === name)?.archetype || null;
