// ══════════════════════════════════════════════════════════════════════
// bb/team-america.js — an alliance nobody in the house chose
// ══════════════════════════════════════════════════════════════════════
//
// BB16, and the only twist in this catalogue that gives houseguests a JOB.
//
// The audience picks three players, tells them they are a team, and then sends
// them tasks: start a rumour and make it travel, get somebody to say a
// particular sentence out loud, put a specific name on the block. Complete it
// and all three are paid. Fail it and nothing happens. Get CAUGHT doing it and
// the house goes looking for a saboteur, which is the part that actually costs
// them something.
//
// What makes it worth building is the shape of the alliance rather than the
// money. Every other alliance in this game is chosen: people pick each other,
// for reasons, and can leave. This one is assigned. Three houseguests who may
// not like each other, may be on opposite sides of the house and may be
// actively targeting each other are now obliged to be seen together often
// enough to plan — which is the exact behaviour the rest of the house reads as
// an alliance.
//
// So the twist generates its own tell. The better they are at the missions,
// the more obviously they are working together.
import { gs } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getPerceivedBond } from '../bonds.js';
import { clamp, makePicker } from '../bb-comps/_shared.js';
import { addBBRelationship, bbHeat } from './shared-strategy.js';
import { recordBBFalseClaim } from './knowledge.js';
import { applyPunishment, BB_PUNISHMENTS } from './punishments.js';

const beat = (text, players, badgeText, badgeClass = 'gold') =>
  ({ text, players: [...players].filter(Boolean), badgeText, badgeClass });

/** What the audience asks for. Three members, so three people can be seen. */
export const TEAM_SIZE = 3;
/** Per completed mission, split between them. */
export const MISSION_FEE = 5000;

/**
 * The missions.
 *
 *   ask     what they physically have to do, stated plainly enough that a
 *           viewer can tell whether it happened
 *   stat    what carries it. Different missions suit different members, which
 *           is what stops one houseguest doing all the work all season.
 *   risk    how visible the attempt is — how likely the house is to notice
 *           somebody steering, before it notices WHO.
 */
export const TEAM_MISSIONS = [
  {
    id: 'rumour', name: 'Start a rumour and make it travel',
    ask: 'Plant a piece of information that is not true and get it back to one of you, from somebody who was not told it directly.',
    stat: 'social', risk: 0.30,
  },
  {
    id: 'saboteur', name: 'Convince the house there is a saboteur',
    ask: 'Make the house believe somebody is working against it from the inside — without any of you being the somebody they land on.',
    stat: 'strategic', risk: 0.42,
  },
  {
    id: 'block', name: 'Put a name on the block',
    ask: 'Get a specific houseguest nominated this week, without any of the three of you being the one who suggests it out loud.',
    stat: 'strategic', risk: 0.38,
  },
  {
    id: 'argument', name: 'Cause an argument you are not in',
    ask: 'Two houseguests have to have a real, loud disagreement, and none of the three of you may be in the room when it happens.',
    stat: 'social', risk: 0.34,
  },
  {
    id: 'costume', name: 'Get somebody into something ridiculous',
    ask: 'Talk a houseguest who is not one of you into wearing something absurd for a full day, and into believing it was their idea.',
    stat: 'social', risk: 0.22,
  },
  {
    id: 'meeting', name: 'Meet, in the open, without it looking like a meeting',
    ask: 'All three of you in the same room for ten minutes, talking about the game, in front of people, without anybody afterwards describing it as a meeting.',
    stat: 'intuition', risk: 0.48,
  },
];

const store = () => {
  gs.bb ||= {};
  gs.bb.teamAmerica ||= { members: [], missions: [], earned: 0 };
  return gs.bb.teamAmerica;
};

/** The team as it stands, filtered to who is still playing. */
export const teamMembers = (house = null) => {
  const t = store().members;
  return house ? t.filter(n => house.includes(n)) : [...t];
};
export const isTeamMember = name => store().members.includes(name);

/**
 * Fill empty seats from the audience's favourites.
 *
 * The same popularity weighting the other audience channels use, and the same
 * reason: the country picks who it has been watching. Seats are refilled when
 * a member is evicted, exactly as the show did.
 *
 * @returns {string[]} whoever was added this week
 */
export function fillTeam(house = [], rng = Math.random) {
  const t = store();
  t.members = t.members.filter(n => house.includes(n));
  const added = [];
  while (t.members.length < TEAM_SIZE) {
    const pool = house.filter(n => !t.members.includes(n));
    if (!pool.length) break;
    const weights = pool.map(name => ({
      name, weight: Math.max(0.6, 3 + (gs.popularity?.[name] || 0)),
    }));
    const total = weights.reduce((sum, c) => sum + c.weight, 0);
    let roll = rng() * total;
    let picked = weights[weights.length - 1];
    for (const c of weights) { roll -= c.weight; if (roll <= 0) { picked = c; break; } }
    t.members.push(picked.name);
    added.push(picked.name);
  }
  return added;
}

// ══════════════════════════════════════════════════════════════════════
// What a completed mission actually DOES
// ══════════════════════════════════════════════════════════════════════
//
// The missions were narration for their first draft: a fee, a flag, and a
// house that woke up on Friday exactly as it went to bed. That is the version
// worth deleting — "put a specific name on the block" is only a mission if the
// name lands on the block.
//
// So every mission now reaches into the machinery it claims to touch, and each
// one reaches somewhere DIFFERENT. A rumour writes a false belief into the
// knowledge layer and the believers carry it around. An argument spends real
// bond between two people who are not on the team. The block mission edits the
// Head of Household's nomination plan before the keys turn.
//
// Two rules hold the whole thing honest:
//
//   Failing costs nothing. Effects fire on success only — the show's own
//   framing, and the reason the team can afford to try the hard ones.
//
//   Nobody on the team is ever the one it happens to. Every effect below
//   casts from NON-members, because a mission that damaged a member would be
//   the twist paying for itself, and the point is that it never does.
const _houseState = () => {
  gs.bb ||= {};
  gs.bb.house ||= { suspicion: {}, targets: {}, memories: {}, eventHistory: [] };
  gs.bb.house.suspicion ||= {};
  return gs.bb.house;
};
/** Same channel and same clamp the house-event api writes on. */
const suspect = (observer, subject, delta) => {
  if (!observer || !subject || observer === subject) return;
  const h = _houseState();
  const key = `${observer}→${subject}`;
  h.suspicion[key] = clamp((h.suspicion[key] || 0) + delta, 0, 10);
};
const bondShift = (a, b, delta) => { try { addBBRelationship(a, b, delta); } catch { /* optional */ } };
const popShift = (name, delta) => {
  gs.popularity ||= {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
};
/** How badly the team, collectively, would like this person gone. */
const teamWants = (team, name) => team.reduce((sum, m) => {
  try { return sum + bbHeat(m, name).total; } catch { return sum; }
}, 0) / Math.max(1, team.length);

/** A costume somebody could plausibly be talked into. Not slop — slop is not funny. */
const COSTUME_IDS = Object.keys(BB_PUNISHMENTS)
  .filter(id => BB_PUNISHMENTS[id].verb === 'wearing' && !BB_PUNISHMENTS[id].tether);

/**
 * The rumour reaches somebody who was never told it.
 *
 * Goes through the knowledge layer rather than a bond nudge, because a false
 * claim is a thing the house BELIEVES — it survives the week, colours how the
 * believers read the victim, and is wrong in a way the game can later discover.
 */
function _effectRumour({ team, lead, house, week }) {
  const outs = house.filter(n => !team.includes(n));
  if (outs.length < 3) return null;
  const victim = [...outs].sort((a, b) => teamWants(team, b) - teamWants(team, a))[0];
  // Whoever is easiest to tell something to. The rumour travels through the
  // people least equipped to check it, which is how rumours travel.
  const believers = outs.filter(n => n !== victim)
    .sort((a, b) => (pStats(a).mental + pStats(a).intuition) - (pStats(b).mental + pStats(b).intuition))
    .slice(0, 3);
  if (!believers.length) return null;
  recordBBFalseClaim(lead, victim, { week: week?.num || 0, believers: [...believers] });
  for (const n of believers) {
    suspect(n, victim, 1.4);
    bondShift(n, victim, -0.8);
  }
  popShift(victim, -0.4);
  return {
    players: [lead, victim, ...believers], victims: [victim],
    note: `${believers.length} houseguests now believe something about ${victim} that is not true.`,
    beat: `It goes out sideways and comes back four days later — ${believers[0]} tells ${lead} the story `
      + `${lead} started, having heard it from somebody who heard it from somebody. ${victim} cannot work `
      + 'out why the room has gone cold, and there is nobody to ask, because everybody heard it from '
      + 'somebody else.',
    badge: 'IT CAME BACK AROUND',
  };
}

/**
 * The house hunts a saboteur, and the hunt clears the actual saboteurs.
 *
 * The best joke in the twist: succeeding at this mission LAUNDERS the team.
 * Paranoia aimed at a scapegoat is paranoia aimed away from three people who
 * genuinely are working the house.
 */
function _effectSaboteur({ team, house }) {
  const outs = house.filter(n => !team.includes(n));
  if (outs.length < 3) return null;
  // The house lands on whoever it can read least: quiet, and visibly clever.
  const scapegoat = [...outs]
    .sort((a, b) => (pStats(b).strategic - pStats(b).social) - (pStats(a).strategic - pStats(a).social))[0];
  for (const observer of outs) {
    if (observer === scapegoat) continue;
    suspect(observer, scapegoat, 0.7);
    for (const m of team) suspect(observer, m, -0.5);
  }
  bondShift(scapegoat, outs.find(n => n !== scapegoat), -0.5);
  return {
    players: [scapegoat, ...team], victims: [scapegoat],
    note: `The house is hunting ${scapegoat}, and has stopped looking anywhere near the three people doing it.`,
    beat: `The house decides there is somebody working it from the inside, and it is right. It decides that `
      + `somebody is ${scapegoat}, and it is wrong. Every eye in the building turns ninety degrees away from `
      + 'the three people who put the idea there.',
    badge: 'LOOKING THE WRONG WAY',
  };
}

/**
 * A specific name goes up, and the Head of Household could not tell you why.
 *
 * This one edits the nomination plan directly, which is only possible because
 * the mission runs at week opening — the plan is chosen a few dozen lines
 * above and the ceremony is a long way below. The pawn chair is never the one
 * that moves: somebody has already been asked to sit there, on camera, and
 * quietly swapping them out would erase a conversation the week has shown.
 */
function _effectBlock({ team, house, plan, hoh, week }) {
  if (!plan || !Array.isArray(plan.nominees) || plan.nominees.length < 2) return null;
  const pool = house.filter(n => !team.includes(n) && n !== hoh && !plan.nominees.includes(n));
  if (!pool.length) return null;
  const mark = [...pool].sort((a, b) => teamWants(team, b) - teamWants(team, a))[0];
  const hohHeat = name => {
    try { return hoh ? bbHeat(hoh, name).total : teamWants(team, name); } catch { return 0; }
  };
  const swappable = plan.nominees.filter(n => n !== plan.pawn);
  const spared = (swappable.length ? swappable : plan.nominees)
    .sort((a, b) => hohHeat(a) - hohHeat(b))[0];
  if (!spared) return null;
  plan.nominees = plan.nominees.map(n => (n === spared ? mark : n));
  if (plan.target === spared) plan.target = mark;
  if (plan.pawn === spared) plan.pawn = mark;
  plan.structureWhy = `${plan.structureWhy || ''} The second name changed late, for a reason `
    + `${hoh || 'the Head of Household'} would struggle to say out loud.`.trim();
  if (hoh) suspect(hoh, mark, 2.2);
  return {
    players: [mark, spared, hoh].filter(Boolean), victims: [mark],
    note: `${mark} goes up in place of ${spared}, and nobody suggested it.`,
    beat: `${spared} was going up this week. ${mark} goes up instead, and if you asked `
      + `${hoh || 'the Head of Household'} to explain the change ${hoh ? 'they' : 'she'} would talk for a `
      + 'minute and land on nothing, because the reason was assembled out of six conversations that were '
      + 'never about nominations at all.',
    badge: 'A NAME NOBODY SUGGESTED',
  };
}

/** Two people who are not on the team, having a real fight about it. */
function _effectArgument({ team, house }) {
  const outs = house.filter(n => !team.includes(n));
  if (outs.length < 2) return null;
  let worst = null;
  for (const a of outs) {
    for (const b of outs) {
      if (a === b) continue;
      let v = 0;
      try { v = getPerceivedBond(a, b); } catch { v = 0; }
      if (!worst || v < worst.v) worst = { a, b, v };
    }
  }
  if (!worst) return null;
  const { a, b } = worst;
  bondShift(a, b, -1.6);
  suspect(a, b, 0.9);
  suspect(b, a, 0.9);
  // Loud is good television, whatever it does to the two of them.
  popShift(a, 0.35);
  popShift(b, 0.35);
  return {
    players: [a, b], victims: [a, b],
    note: `${a} and ${b} are no longer speaking, and neither of them can name who started it.`,
    beat: `${a} and ${b} go up in the kitchen over something small enough that neither of them can `
      + 'reconstruct it afterwards. The house hears all of it. Nobody on the team is in the room, which '
      + 'took more arranging than the argument did.',
    badge: 'NOT IN THE ROOM',
  };
}

/** Somebody spends a week in something ridiculous, believing it was their idea. */
function _effectCostume({ team, lead, house, week, rng }) {
  const outs = house.filter(n => !team.includes(n));
  if (!outs.length || !COSTUME_IDS.length) return null;
  // Talked into it: the least suspicious mind in the room, warmed up first.
  const victim = [...outs]
    .sort((a, b) => (pStats(a).intuition + pStats(a).mental) - (pStats(b).intuition + pStats(b).mental))[0];
  const id = COSTUME_IDS[Math.floor(rng() * COSTUME_IDS.length) % COSTUME_IDS.length];
  const worn = applyPunishment(victim, id, { week: week?.num || 1 });
  if (!worn) return null;
  const def = BB_PUNISHMENTS[id];
  popShift(victim, 0.8);
  // They had a lovely time being talked into it, which is the cruel part.
  bondShift(lead, victim, 0.5);
  return {
    players: [lead, victim], victims: [victim],
    note: `${victim} is in ${def.name} for the week, and thinks it was ${victim === lead ? 'their' : 'their own'} idea.`,
    beat: `${victim} spends the week in ${def.name}, having proposed it personally, enthusiastically, and `
      + `to a room that had been softened up for two days. ${def.cost}`,
    badge: 'THEIR OWN IDEA',
  };
}

/** Three people in a room in front of everybody, and nobody calls it a meeting. */
function _effectMeeting({ team, house }) {
  const outs = house.filter(n => !team.includes(n));
  if (!outs.length) return null;
  for (const observer of outs) for (const m of team) suspect(observer, m, -0.8);
  return {
    players: [...team], victims: [],
    note: 'Ten minutes in the open, and the house filed it as nothing.',
    beat: 'All three of them, in the same room, in front of everybody, for ten minutes, talking about the '
      + 'game. Not one person in that house describes it afterwards as a meeting. It is the single most '
      + 'dangerous thing they have done and it is the only week nobody is watching them.',
    badge: 'NOT A MEETING',
  };
}

const MISSION_EFFECTS = {
  rumour: _effectRumour, saboteur: _effectSaboteur, block: _effectBlock,
  argument: _effectArgument, costume: _effectCostume, meeting: _effectMeeting,
};

const OPENING = [
  (names) => `${names.join(', ')} are told, separately and in private, that the country has put them on a team together. None of them chose this and none of them can refuse it.`,
  (names) => `Three names, picked by people none of them have met: ${names.join(', ')}. They are an alliance now whether or not they can stand each other.`,
  (names) => `${names.join(', ')} get the same message on the same night. The team exists. Nobody in the house is supposed to find out it does.`,
];

/**
 * Run this week's mission.
 *
 * Success is carried by the member the mission actually suits, which is why
 * the missions ask for different stats — a team of three social players will
 * struggle with the strategic ones and vice versa, and the audience did not
 * pick them for balance.
 *
 * Getting caught is scored separately from failing, and it is the interesting
 * one: a mission can succeed loudly. The house does not learn WHO, it learns
 * that somebody is steering, which is the seed the events grow from.
 *
 * @returns {object|null} the act, or null when there is no team to send
 */
export function runMission({ week, house = [], rng = Math.random, forced = null,
  plan = null, hoh = null } = {}) {
  const t = store();
  const team = teamMembers(house);
  if (team.length < 2) return null;
  const say = makePicker(rng);

  const mission = (forced && TEAM_MISSIONS.find(m => m.id === forced))
    || TEAM_MISSIONS[t.missions.length % TEAM_MISSIONS.length];

  // Whoever this one actually suits does the work.
  const lead = [...team].sort((a, b) => (pStats(b)[mission.stat] || 5) - (pStats(a)[mission.stat] || 5))[0];
  const lst = pStats(lead);
  const skill = (lst[mission.stat] || 5) / 10;
  // The team pulling together matters: three people who distrust each other
  // cannot coordinate a rumour, however good the best of them is.
  const cohesion = team.length < 2 ? 0 : team.reduce((sum, a) => {
    const others = team.filter(b => b !== a);
    return sum + others.reduce((s, b) => {
      try { return s + getPerceivedBond(a, b); } catch { return s; }
    }, 0) / Math.max(1, others.length);
  }, 0) / team.length;

  const chance = clamp(0.24 + skill * 0.5 + cohesion * 0.03, 0.1, 0.88);
  const done = rng() < chance;
  // Loud work gets noticed. Doing it well helps; doing it at all is a risk.
  const caughtChance = clamp(mission.risk + (done ? 0.06 : 0.12) - (lst.intuition || 5) * 0.022, 0.05, 0.7);
  const noticed = rng() < caughtChance;

  const beats = [];
  if (!t.missions.length) {
    beats.push(beat(say(OPENING)(team), team, 'ASSIGNED, NOT CHOSEN', 'gold'));
  }
  beats.push(beat(
    `The mission: ${mission.ask}`, team, 'THIS WEEK’S MISSION', 'blue'));

  const p = pronouns(lead);
  let effect = null;
  if (done) {
    t.earned += MISSION_FEE;
    beats.push(beat(
      `${lead} carries it, and it lands. ${mission.name} — done, without a single person in that house `
        + `being able to say who started it. All three of them are paid for a job the house does not know happened.`,
      team, 'MISSION COMPLETE', 'gold'));
    // Pulling one of these off is, before it is anything else, television.
    // Popularity is the audience's currency in this format — it weights the
    // App Store, the Care Package, America's Nominee and this twist's own
    // refill — so the people the audience hired for a job get paid in it too.
    // The lead carries the segment; the other two are in it.
    popShift(lead, 0.5);
    for (const m of team) if (m !== lead) popShift(m, 0.25);
    // And then the house is actually different. Failing costs nothing, which
    // is why this only runs on the way through here.
    try {
      const apply = MISSION_EFFECTS[mission.id];
      effect = apply ? apply({ mission, team, lead, house, week, plan, hoh, rng }) : null;
    } catch { effect = null; }
    if (effect) beats.push(beat(effect.beat, effect.players, effect.badge, 'blue'));
  } else {
    beats.push(beat(
      `${lead} tries and it does not take. ${p.Sub} ${p.sub === 'they' ? 'get' : 'gets'} most of the way there and `
        + 'the last piece will not move, which is the difference between running a house and living in one.',
      [lead], 'MISSION FAILED', 'red'));
  }
  if (noticed) {
    // Being caught is the only thing in this twist that costs the team
    // anything, so it has to land somewhere the game reads. The sharpest
    // person still playing starts watching all three of them — and that is
    // the number nomination heat picks up two weeks later.
    const watcher = house.filter(n => !team.includes(n))
      .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
    if (watcher) for (const m of team) suspect(watcher, m, 1.2);
    // The one place the two currencies point opposite ways. A house that has
    // started hunting them is a disaster inside the building and the best
    // thing on the broadcast all week, so being caught RAISES the edit while
    // it wrecks the game — which is the trade the twist is actually about.
    for (const m of team) popShift(m, 0.4);
    beats.push(beat(
      'Somebody in this house has worked out that they are being steered. Not by whom — just that it is happening, '
        + 'which is enough to make everybody look sideways at everybody for a week.',
      team, 'THE HOUSE SMELLS IT', 'red'));
  }

  const record = {
    week: week?.num || 0, id: mission.id, name: mission.name, ask: mission.ask,
    lead, done, noticed, fee: done ? MISSION_FEE : 0,
    // `players` is everybody in the scene; `victims` is who it happened TO,
    // and the two are not the same list — a mission that clears the team casts
    // all three of them as beneficiaries. Nothing downstream should have to
    // guess which is which from position in an array.
    effect: effect
      ? { note: effect.note, players: [...effect.players], victims: [...(effect.victims || [])] }
      : null,
  };
  t.missions.push(record);

  return {
    type: 'team-america', week: week?.num || 0, secret: true,
    members: [...team], mission: record, earned: t.earned,
    missionNumber: t.missions.length, beats,
  };
}
