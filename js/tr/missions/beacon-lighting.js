// ══════════════════════════════════════════════════════════════════════
// tr/missions/beacon-lighting.js — Beacon Lighting
// ══════════════════════════════════════════════════════════════════════
//
// From the wiki (thetraitors.fandom.com/wiki/Beacon_Lighting — UK S2, US S2).
// Everyone starts tied to a pole in a loch. Once free, a player can untie
// somebody else, fetch the plan from the bottles on the shore, carry beacon
// pieces out to the raft, or go for one of three Shields — two out in the
// water, one on land. The beacon only lights once every player is out of the
// water, and only inside forty minutes. Approved mockup:
// mockup/mockup-tr-beacon-lighting.html.
//
// ONE CLOCK FOR THE WHOLE ROOM. The teams race each other on pieces, but the
// fire is shared: every minute anybody spends — a knot, a misread plan, a
// piece set upside down, a swim for a Shield — comes off the same forty. If
// the beacon does not burn, the afternoon pays a fraction of what it earned
// (the show pays nothing; the shared pot arithmetic keeps a floor so the band
// stays where the other missions put it).
//
// THREE SHIELDS, THREE PRICES, taken in the phase where they sit: the first
// water Shield during the poles (the swimmer is not untying anybody), the land
// Shield during the bottles (a bottle that holds a key, not a plan), and the
// second water Shield during the beacon — the costly one, because a player in
// the loch stops the fire for everybody.
//
// WHAT A TRAITOR CAN DO. Set a piece the wrong way round. It is the commonest
// honest mistake on the raft and it costs minutes, never the fire outright.

import {
  briefingText, clamp01, confessionalVoice, freshPick, hostDo, hostSay, PHASE_SWING,
  missionQuality, missionScene, missionShieldOffered, noisyPair, payPot, placementsFrom,
  pronounSlots, render, splitTeams, statOf, validateMissionRecord, weightedPick, runSideObjectives,
  andList, shieldCostOf,
} from './contract.js';
import { awardShield } from '../powers.js';

const TEAMS = ['Heather', 'Bracken'];
const CLOCK = 40;
const PIECES = 8;

/** Order beats one team at a time, so the first cards are not all one team's. */
function _interleave(beats) {
  const by = {};
  for (const b of beats) (by[b.team] = by[b.team] || []).push(b);
  const lists = Object.values(by);
  const out = [];
  for (let i = 0; out.length < beats.length; i++) for (const l of lists) if (l[i]) out.push(l[i]);
  return out;
}

// ══════════════════════════════════════════════════════════════════════
// THE BRIEFING
// ══════════════════════════════════════════════════════════════════════
function _ceremony(poles, shield) {
  const hostBeats = [
    hostDo('The host stands on the shingle with a lit torch, and the players are waist-deep in '
      + 'the loch, each one tied to a pole.'),
    hostSay('You are tied on, and you will have to get yourselves off. Nobody on the bank will '
      + 'help you.'),
    hostSay('Out on that raft is a frame. The pieces that fill it are in the water around you, and '
      + 'the plan for how they go together is in the bottles along this shore. Put every piece '
      + 'in the right place.'),
    hostDo('The host walks along the waterline past the bottles and stops at the end of the shingle.'),
    hostDo('The host lowers the torch toward the water and stops.'),
    hostSay('The beacon will not light while there is anybody in the loch. Every one of you has to '
      + 'be on dry land before I put this to it.'),
    ...(shield ? [
      hostSay('There are three Shields. Two are out in the water. One is somewhere on this shore.'),
      hostSay('Whoever goes for one is not untying anybody, not carrying pieces, and, if it is in '
        + 'the water, not out of it.'),
    ] : []),
    hostSay(`If the beacon burns inside ${CLOCK} minutes, the pot earns its money. If it does not, `
      + 'it earns almost nothing. Start.'),
  ];
  const at = s => hostBeats.findIndex(b => b.kind === 'say' && b.text.startsWith(s));
  return {
    ceremonyId: 'mission-brief-beacon-lighting',
    staging: `A loch at dusk. ${poles} wooden poles standing in the shallows, a raft moored in the `
      + 'middle with an empty iron frame on it, and a line of bottles along the shingle.',
    hostBeats,
    contestantBeats: [],
    rulePoints: [
      { id: 'task', explainedByBeat: at('Out on that raft') },
      { id: 'failure', explainedByBeat: at('The beacon will not') },
      ...(shield ? [
        { id: 'shield', explainedByBeat: at('There are three Shields') },
        { id: 'cost', explainedByBeat: at('Whoever goes for one') },
      ] : []),
      { id: 'reward', explainedByBeat: at('If the beacon burns') },
      { id: 'finish', explainedByBeat: at('If the beacon burns') },
    ],
    revealBeats: hostBeats.length,
    reminder: 'The host reminds the room that nobody on the bank will untie them, that the plan '
      + 'is in the bottles, and that the beacon will not light with anybody in the water.',
  };
}

// ══════════════════════════════════════════════════════════════════════
// THE SHIELDS — three slots, one hunt each
// ══════════════════════════════════════════════════════════════════════
const SLOTS = [
  { id: 'water-a', where: 'water', phase: 'poles', delay: 3, stat: 'physical',
    found: [
      '{who} was free early and swam straight out past the raft toward the buoy on the far side. {They} came back with a Shield.',
      '{who} did not untie anybody. {They} swam for the first buoy and came back holding a Shield over {their} head.',
    ],
    missed: [
      '{who} swam for the far buoy, circled it twice, and came back with nothing while the poles were still full.',
    ] },
  { id: 'land', where: 'land', phase: 'bottles', delay: 2, stat: 'intuition',
    found: [
      '{who} opened a bottle that held no plan, only a key, and walked it up to the boathouse. The land Shield was {theirs}.',
      '{who} noticed one bottle was heavier than the rest, kept it, and came back from the boathouse with a Shield.',
    ],
    missed: [
      '{who} spent the bottles looking for the land Shield instead of reading the plan, and never found it.',
    ] },
  { id: 'water-b', where: 'water', phase: 'beacon', delay: 3, stat: 'endurance',
    found: [
      'The others were heading for the shore and {who} was still out at the second buoy. {They} found the Shield. It took {them} three more minutes to swim back.',
      'Everybody was ashore but {who}, who was treading water at the second buoy with a Shield in {their} hand and a long way to swim.',
    ],
    missed: [
      'The others were heading for the shore and {who} was still out at the second buoy, looking for a Shield that {they} never found.',
    ] },
];
const SEARCH_VOICE = {
  found: {
    villainous: "Everybody else was being useful. Somebody has to still be here on Friday to be useful again.",
    nice: "I'll own it at the table if I have to. I couldn't leave it in the water.",
    neutral: "It was there, I could reach it, and nobody else was going to. Simple.",
  },
  missed: {
    villainous: "Nothing out there. What matters is what they think I was doing.",
    nice: "I wasted time the team needed. I'll say so before anybody asks.",
    neutral: "Swam a long way for nothing. That's the afternoon.",
  },
};

function _hunt(ctx, rng, teams, slot, busy, shieldOn) {
  if (!shieldOn) return null;
  const pool = teams.flatMap(t => t.members).filter(n => !busy.has(n));
  if (!pool.length) return null;
  const searcher = weightedPick(rng, pool,
    n => 0.25 + 0.9 * (statOf(n, 'boldness') / 10) * (1 - 0.5 * (statOf(n, 'loyalty') / 10)));
  const found = rng() < clamp01(0.3 + 0.04 * statOf(searcher, slot.stat));
  if (!searcher) return null;
  busy.add(searcher);
  const team = teams.find(t => t.members.includes(searcher));
  const won = found ? awardShield(searcher, teams, ctx.ep, rng) : null;
  const slots = pronounSlots(searcher);
  const effects = [
    { kind: 'record', player: searcher, field: 'wentForAShield', value: slot.id,
      source: `${searcher} went for the ${slot.where} Shield instead of working the beacon` },
    { kind: 'crowd', name: searcher, colour: won ? 'masterful' : 'selfish', mult: 0.7,
      source: `${searcher} went after a Shield while the others worked` },
  ];
  if (won) effects.push({ kind: 'shield', player: searcher,
    source: `${searcher} took the ${slot.where} Shield` });
  const scene = missionScene({
    id: `beacon-shield-${slot.id}`,
    eventId: won ? 'beacon-shield-found' : 'beacon-shield-missed',
    phase: slot.phase,
    participants: [searcher],
    behaviour: won ? 'impressive' : 'selfish',
    text: render(freshPick(rng, won ? slot.found : slot.missed), slots)
      + (won && won.witnesses.length ? ` ${andList(won.witnesses.slice(0, 3))} saw it.` : ''),
    effects,
    confessional: { purpose: 'hidden-intent', speaker: searcher,
      text: confessionalVoice(searcher, won ? SEARCH_VOICE.found : SEARCH_VOICE.missed) },
  });
  return {
    slot: slot.id, where: slot.where, searcher, team: team ? team.name : null,
    found: !!won, delay: slot.delay, scene,
    block: { slot: slot.id, where: slot.where, searcher, found: !!won, cost: 0,
      holder: won ? won.holder : null, witnesses: won ? [...won.witnesses] : [],
      visibility: won ? won.visibility : null, lines: won ? [won.seenLine] : [] },
  };
}

// ══════════════════════════════════════════════════════════════════════
// PHASE 1 — THE POLES. physical and temperament.
// ══════════════════════════════════════════════════════════════════════
const FREE_FAST = [
  '{who} stopped pulling, found the end of the knot, and was off {their} pole in four minutes.',
  '{who} worked the rope down the pole instead of fighting it, and was free before most people had a hand loose.',
  '{who} was out of the rope while the people either side were still shouting about it.',
  '{who} worked one loop loose, then the next, and stepped off the pole without a word.',
  '{who} had clearly tied a knot or two in {their} life, and was free before the host had finished talking.',
];
const FREE_STUCK = [
  '{who} pulled the knot tighter every time {they} tried to loosen it, and was still tied on at the quarter-hour.',
  '{who} could not feel {their} fingers after ten minutes in the water, and the knot knew it.',
  '{who} went at the rope with {their} teeth, which did not work.',
];
const FREE_STEADY = [
  '{who} got loose in the ordinary time, cold and cross about it.',
  '{who} untied {self} slowly and properly and waded in.',
];
const UNTIE_HELP = [
  '{who} waded over to {other} before going anywhere else and had {other} loose in two minutes.',
  '{who} heard {other} swearing at the knot, went back, and cut the argument short.',
];
const UNTIE_PASS = [
  '{who} was free and waded straight past {other}, who was still tied on.',
  '{other} asked for a hand. {who} was already halfway to the raft.',
];

function _poles(ctx, rng, teams) {
  const beats = [];
  const scenes = [];
  const contrib = {};
  let minutes = 0;
  let panicked = false;
  const freeOrder = [];
  for (const t of teams) {
    const stuck = [];
    for (const name of t.members) {
      const v = noisyPair(rng, name, 'physical', 'temperament');
      contrib[name] = clamp01(v / 10) * 10;
      const slots = pronounSlots(name);
      if (v >= 6.8) {
        freeOrder.push(name);
        beats.push({ team: t.name, player: name, kind: 'good', score: v, text: render(freshPick(rng, FREE_FAST), slots) });
      } else if (v <= 3.8) {
        stuck.push(name);
        beats.push({ team: t.name, player: name, kind: 'bad', score: v, text: render(freshPick(rng, FREE_STUCK), slots) });
      } else {
        beats.push({ team: t.name, player: name, kind: 'steady', score: v, text: render(freshPick(rng, FREE_STEADY), slots) });
      }
    }
    // THE ONE WHO COULD NOT STAND THE WATER, at most once an afternoon: a
    // player still tied on whose nerve went. Costs a minute, and the crowd sees it.
    if (!panicked && stuck.length) {
      const who = [...stuck].sort((a, b) => statOf(a, 'temperament') - statOf(b, 'temperament'))[0];
      if (rng() < clamp01(0.55 - 0.05 * statOf(who, 'temperament'))) {
        panicked = true;
        minutes += 1;
        scenes.push(missionScene({
          id: `beacon-panic-${t.name}`, eventId: 'beacon-panicked-on-the-pole', phase: 'poles',
          participants: [who], behaviour: 'cowardly',
          text: `${who} stopped working the knot and started shouting for the crew to cut the rope. Nobody on the bank moved. ${who} had to be talked back into untying it.`,
          effects: [
            { kind: 'crowd', name: who, colour: 'cowardly', mult: 0.5,
              source: `${who} called for the crew to cut the rope` },
          ],
          confessional: { purpose: 'emotional-turn', speaker: who,
            text: confessionalVoice(who, {
              nice: "Cold water, a rope, and no way to move. I'm not proud of it. I'm being honest about it.",
              villainous: "Fine, I panicked. Better that they think I'm weak than think I'm clever.",
              neutral: "I don't like being tied to things in lochs. Turns out that's a personality trait.",
            }) },
        }));
      }
    }
    // The slowest knot on each team sets how long the team is in the water.
    minutes = Math.max(minutes, stuck.length ? 11 : 7);
    // One untie scene per team: somebody free goes back for the worst-tied.
    const worst = stuck[0] || [...t.members].sort((a, b) => contrib[a] - contrib[b])[0];
    const pool = t.members.filter(n => n !== worst);
    if (pool.length) {
      const who = weightedPick(rng, pool, n => 0.3 + statOf(n, 'loyalty') / 8);
      const helped = rng() < clamp01(0.25 + 0.06 * statOf(who, 'loyalty'));
      const slots = { ...pronounSlots(who), other: worst };
      if (helped) {
        contrib[who] += 0.8;
        scenes.push(missionScene({
          id: `beacon-untie-${t.name}`, eventId: 'beacon-untied-a-teammate', phase: 'poles',
          participants: [who, worst], behaviour: 'heroic',
          text: render(freshPick(rng, UNTIE_HELP), slots),
          effects: [
            { kind: 'bond', players: [who, worst], delta: 0.7,
              source: `${who} untied ${worst} before doing anything else` },
            { kind: 'crowd', name: who, colour: 'selfless', mult: 0.8,
              source: `${who} went back into the loch to untie ${worst}` },
          ],
          confessional: { purpose: 'emotional-turn', speaker: worst,
            text: confessionalVoice(worst, {
              nice: `${who} could've gone straight for a Shield. ${who} came to me. I'm not going to forget that.`,
              villainous: `${who} untied me. Lovely. Now I know exactly who in there is soft.`,
              neutral: `I'd have got it eventually. But ${who} came over, and I noticed.`,
            }) },
        }));
      } else {
        minutes += 1;
        scenes.push(missionScene({
          id: `beacon-untie-${t.name}`, eventId: 'beacon-waded-past', phase: 'poles',
          participants: [who, worst], behaviour: 'selfish',
          text: render(freshPick(rng, UNTIE_PASS), slots),
          effects: [
            { kind: 'bond', players: [who, worst], delta: -0.5,
              source: `${who} waded past ${worst} while ${worst} was still tied on` },
          ],
          confessional: { purpose: 'hidden-intent', speaker: who,
            text: confessionalVoice(who, {
              nice: `I thought ${worst} was nearly out. They weren't. I should have looked.`,
              villainous: 'Everyone gets themselves off the pole. That was the rule, and I liked it.',
              neutral: `The raft needed hands. ${worst} had two of their own.`,
            }) },
        }));
      }
    }
  }
  const score = t => t.members.reduce((s, n) => s + (contrib[n] || 0), 0) / Math.max(1, t.members.length);
  return {
    phase: { id: 'poles', name: 'The Poles', stats: ['physical', 'temperament'],
      setting: 'Cold water to the waist, wet rope, and knots tied by somebody who meant them.',
      beats: _interleave(beats),
      teams: teams.map(t => ({ name: t.name, score: clamp01(score(t) / 10) })) },
    contrib, scenes, minutes, freeOrder,
  };
}

// ══════════════════════════════════════════════════════════════════════
// PHASE 2 — THE BOTTLES. mental and intuition, and the pieces go out.
// ══════════════════════════════════════════════════════════════════════
const READ_GOOD = [
  '{who} laid the scraps out on the stones in order and saw that the frame was a shield before anyone else did.',
  '{who} read three bottles, put them together, and had the plan in {their} head.',
  '{who} matched the pieces to the plan on the shingle before carrying a single one.',
];
const READ_BAD = [
  '{who} carried two pieces out to the raft and set both of them upside down.',
  '{who} read a scrap sideways and sent a piece to the wrong corner of the frame.',
  '{who} could not make the scraps say anything and went back into the water to carry instead.',
];
const READ_STEADY = [
  '{who} ferried pieces from the shingle to the raft and set them where {they} were told.',
  '{who} carried {their} share out and asked before placing anything.',
];

function _bottles(ctx, rng, teams) {
  const beats = [];
  const scenes = [];
  const contrib = {};
  const placed = {};
  let minutes = 0;
  let caught = false;
  for (const t of teams) {
    let set = 0;
    let wrong = null;
    let sum = 0;
    for (const name of t.members) {
      const v = noisyPair(rng, name, 'mental', 'intuition');
      contrib[name] = clamp01(v / 10) * 10;
      sum += v;
      const slots = pronounSlots(name);
      // A conflicted player sets a piece wrong a little more often. Never always.
      const pWrong = clamp01(0.22 - 0.02 * v + (ctx.conflicted(name) ? 0.14 : 0));
      if (rng() < pWrong) {
        if (!wrong) wrong = name;
        contrib[name] = Math.max(0, contrib[name] - 1.4);
        minutes += 2;
        beats.push({ team: t.name, player: name, kind: 'bad', score: v, text: render(freshPick(rng, READ_BAD), slots) });
      } else if (v >= 6.6) {
        set += 1;
        beats.push({ team: t.name, player: name, kind: 'good', score: v, text: render(freshPick(rng, READ_GOOD), slots) });
      } else {
        set += 0.6;
        beats.push({ team: t.name, player: name, kind: 'steady', score: v, text: render(freshPick(rng, READ_STEADY), slots) });
      }
    }
    placed[t.name] = Math.min(PIECES / 2, Math.round(set));
    minutes += Math.round(7 - (sum / Math.max(1, t.members.length)) * 0.6);
    // Somebody catches the wrong piece: one scene for the afternoon.
    if (wrong && !caught) {
      const pool = t.members.filter(n => n !== wrong);
      if (pool.length) {
        caught = true;
        const who = weightedPick(rng, pool, n => 0.3 + statOf(n, 'mental') / 8);
        scenes.push(missionScene({
          id: `beacon-wrong-piece-${t.name}`, eventId: 'beacon-piece-turned-back', phase: 'bottles',
          participants: [who, wrong], behaviour: 'suspicious',
          text: `${who} had the plan in hand and turned ${wrong}'s pieces back the right way round without a word. Then ${pronounSlots(who).they} said a word.`,
          effects: [
            { kind: 'record', player: wrong, field: 'setPiecesWrong', value: true,
              source: `${wrong} set beacon pieces the wrong way round` },
            { kind: 'claim', claimant: who, about: wrong,
              text: `${who} says ${wrong} set the pieces wrong with the plan in front of them`,
              source: `${wrong} put pieces in upside down and ${who} fixed them` },
            { kind: 'suspicion', observer: who, subject: wrong, delta: 0.26,
              source: `${wrong} set pieces against a plan with an arrow on it` },
            { kind: 'bond', players: [who, wrong], delta: -0.5,
              source: `${who} had to undo ${wrong}'s pieces` },
          ],
          confessional: { purpose: 'belief-change', speaker: who,
            text: confessionalVoice(who, {
              neutral: 'The plan had an arrow on it. A big one. They were looking right at it.',
              villainous: "Upside down. Twice. I don't care why. I care that the table hears about it.",
              nice: "Maybe the plan was confusing. I'd like to think so. I'm finding it hard to.",
            }) },
        }));
      }
    }
  }
  const score = t => t.members.reduce((s, n) => s + (contrib[n] || 0), 0) / Math.max(1, t.members.length);
  return {
    phase: { id: 'bottles', name: 'The Bottles', stats: ['mental', 'intuition'],
      setting: 'A line of green bottles on the shingle, each with a scrap of the plan inside, and pieces floating out in the loch.',
      beats: _interleave(beats),
      teams: teams.map(t => ({ name: t.name, score: clamp01(score(t) / 10), placed: placed[t.name] })) },
    contrib, scenes, minutes, placed,
  };
}

// ══════════════════════════════════════════════════════════════════════
// PHASE 3 — THE BEACON. strategic and loyalty: finish, and get out.
// ══════════════════════════════════════════════════════════════════════
const LAST_PIECE = [
  '{who} swam the last piece out, set it, and shouted the count to the shore.',
  '{who} checked every piece in the frame against the plan before swimming for the bank.',
];
const HEADCOUNT = [
  '{who} stood on the shingle counting heads out loud until the count was right.',
  '{who} went back in to the knees to hurry the last swimmers in.',
];
const STRAGGLE = [
  '{who} was the last one in the water and knew everybody on the bank was watching.',
  '{who} dawdled at the raft admiring the frame while the torch waited.',
];

function _beacon(ctx, rng, teams, placed) {
  const beats = [];
  const contrib = {};
  let minutes = 0;
  for (const t of teams) {
    let sum = 0;
    for (const name of t.members) {
      const v = noisyPair(rng, name, 'strategic', 'loyalty');
      contrib[name] = clamp01(v / 10) * 10;
      sum += v;
      const slots = pronounSlots(name);
      if (v >= 6.8) beats.push({ team: t.name, player: name, kind: 'good', score: v, text: render(freshPick(rng, rng() < 0.5 ? LAST_PIECE : HEADCOUNT), slots) });
      else if (v <= 3.6) { minutes += 1; beats.push({ team: t.name, player: name, kind: 'bad', score: v, text: render(freshPick(rng, STRAGGLE), slots) }); }
    }
    if (!beats.some(b => b.team === t.name)) {
      const who = t.members[0];
      beats.push({ team: t.name, player: who, kind: 'steady', score: 5,
        text: `${who} got ${t.name}'s last pieces onto the raft and the team out of the water.` });
    }
    // Finishing the frame: whatever the bottles did not place, set now.
    minutes += Math.max(0, PIECES / 2 - (placed[t.name] || 0));
    minutes += Math.round(4 - (sum / Math.max(1, t.members.length)) * 0.4);
  }
  const score = t => t.members.reduce((s, n) => s + (contrib[n] || 0), 0) / Math.max(1, t.members.length);
  return {
    phase: { id: 'beacon', name: 'The Beacon', stats: ['strategic', 'loyalty'],
      setting: 'A full frame on the raft, a torch on the shore, and a headcount that has to reach everybody before it is used.',
      beats: _interleave(beats),
      teams: teams.map(t => ({ name: t.name, score: clamp01(score(t) / 10) })) },
    contrib, minutes,
  };
}

const SUMMARY = {
  triumph: [
    'It burned with time to spare, and the loch was lit up end to end.',
    'Everybody free, every piece right, everybody ashore, and a fire you could see from the castle.',
    'The beacon went up and the whole shingle cheered, including the people who had spent it swimming.',
  ],
  solid: [
    'It burned, just, with the last swimmer still dripping on the stones.',
    'A slow start at the poles and a scramble at the end, but the fire caught.',
    'The beacon lit late and lit anyway.',
  ],
  scraped: [
    'The clock ran out with somebody still in the water, and the torch went back in its bracket unused.',
    'Pieces upside down, people still tied on too long, and a frame that never burned.',
    'They built most of it. Most of a beacon does not light.',
  ],
  failed: [
    'Nothing burned. The frame was half empty and half the room was still in the loch.',
    'The torch went out in the host\'s hand while they were still untying knots.',
    'A cold afternoon in a loch with nothing to show for it.',
  ],
};

// ══════════════════════════════════════════════════════════════════════

export const beaconLighting = {
  id: 'beacon-lighting',
  name: 'Beacon Lighting',
  teams: TEAMS,
  side: [
    { id: 'first-off-the-pole', label: 'be the first person off the poles', stat: 'physical' },
    { id: 'read-the-plan', label: 'read the whole plan from the bottles alone', stat: 'mental' },
  ],
  desc: 'Every player starts waist-deep in a loch, tied to a wooden pole, with a raft moored in '
    + 'the middle holding an empty iron frame and a line of bottles along the shore. Once they '
    + 'untie themselves, players can free their teammates, read the plan scraps from the '
    + 'bottles, and carry the beacon pieces out to set them in the frame. A piece set the wrong '
    + 'way round costs the time it takes to fix, and the beacon will not light while anybody is '
    + 'still in the water. On a Shield afternoon three Shields are hidden, two out in the loch '
    + 'and one on the shore, and a player who goes for one is not helping and, in the water, '
    + 'stops the fire. If the beacon burns inside forty minutes its money goes into the shared '
    + 'pot; if it does not, only a small share for the pieces that were set is paid.',

  eligibility(ctx) {
    return Array.isArray(ctx?.living) && ctx.living.length >= 4;
  },

  simulate(ctx, rng) {
    const living = [...ctx.living];
    const teams = splitTeams(living, rng, TEAMS);
    const shieldOn = missionShieldOffered(ctx);
    const ceremony = _ceremony(living.length, shieldOn);

    const poles = _poles(ctx, rng, teams);
    const bottles = _bottles(ctx, rng, teams);
    const beacon = _beacon(ctx, rng, teams, bottles.placed);

    // THE THREE HUNTS, after the phases so their stream is untouched, each
    // filed under the phase it happened in. One person per slot.
    const busy = new Set();
    const hunts = SLOTS.map(slot => _hunt(ctx, rng, teams, slot, busy, shieldOn)).filter(Boolean);
    const huntMinutes = hunts.reduce((a, h) => a + h.delay, 0);
    const minutesUsed = poles.minutes + bottles.minutes + beacon.minutes + huntMinutes
      + Math.floor(rng() * 5);
    const piecesSet = Object.values(bottles.placed).reduce((a, b) => a + b, 0);
    const lit = minutesUsed <= CLOCK;

    const phases = [poles.phase, bottles.phase, beacon.phase];
    const huntPenalty = name => hunts.filter(h => h.team === name).length * 0.03;
    const base = teams.map(t => {
      const parts = phases.map(ph => ph.teams.find(x => x.name === t.name).score);
      return { name: t.name, members: [...t.members],
        perf: clamp01(parts.reduce((a, b) => a + b, 0) / parts.length + (rng() - 0.5) * PHASE_SWING) };
    });
    const scored = base.map(t => ({ ...t, perf: clamp01(t.perf - huntPenalty(t.name)) }));

    const playerScores = {};
    for (const n of living) {
      playerScores[n] = Number(((poles.contrib[n] || 0) + (bottles.contrib[n] || 0)
        + (beacon.contrib[n] || 0)).toFixed(3));
    }

    // NO FIRE, ALMOST NO MONEY. A fire is at least a solid afternoon and no
    // fire is at most a scraped one, so the summary can never contradict it.
    const fired = q => (lit ? Math.max(0.4, clamp01(q * 1.18)) : Math.min(0.39, q * 0.35));
    const quality = fired(missionQuality(scored[0].perf, scored[1].perf));
    const sideObjectives = runSideObjectives(beaconLighting.side, scored, rng, null);
    const pay = payPot(quality, sideObjectives.reduce((a, o) => a + o.bonus, 0));
    // What the hunts cost the pot, shared between them.
    const lost = shieldCostOf(quality, fired(missionQuality(base[0].perf, base[1].perf)));
    for (const h of hunts) h.block.cost = Math.round(lost / Math.max(1, hunts.length));

    const lighter = [...living].sort((a, b) => (playerScores[b] - playerScores[a]) || (a < b ? -1 : 1))[0];
    const fire = missionScene({
      id: 'beacon-the-fire', eventId: lit ? 'beacon-lit' : 'beacon-not-lit', phase: 'beacon',
      participants: [lighter],
      behaviour: lit ? 'heroic' : null,
      text: lit
        ? `Everyone out. The host put the torch to the rope, and the beacon went up with ${CLOCK - minutesUsed} minute${CLOCK - minutesUsed === 1 ? '' : 's'} on the clock. ${lighter} had done more than anybody to get it there.`
        : `The clock ran out with the beacon unlit. ${lighter} had worked as hard as anybody, and the torch went back in its bracket anyway.`,
      effects: [
        lit
          ? { kind: 'crowd', name: lighter, colour: 'heroic', mult: 0.6,
            source: `${lighter} did the most to get the beacon lit` }
          : { kind: 'record', player: lighter, field: 'beaconUnlit', value: minutesUsed - CLOCK,
            source: `the beacon did not light before the clock ran out, with ${lighter} still working on it` },
      ],
    });

    const shields = hunts.filter(h => h.found).map(h => h.block);
    const rec = {
      id: 'beacon-lighting', ep: ctx.ep, name: 'Beacon Lighting',
      ceremony, briefing: briefingText(ceremony.hostBeats),
      teams: scored,
      phases,
      playerScores,
      placements: placementsFrom(playerScores),
      quality, tier: pay.tier,
      bestTeam: scored[0].perf >= scored[1].perf ? scored[0].name : scored[1].name,
      potBefore: pay.potBefore, gross: pay.gross, potEarned: pay.potEarned,
      potAfter: pay.potAfter, earned: pay.potEarned,
      shields,
      // The first Shield taken, in the single-relic shape the row and the
      // older readers know; `tally.shields` carries all three slots.
      shield: shields[0] || { offered: shieldOn, searcher: null, found: false, cost: 0,
        holder: null, witnesses: [], visibility: null, lines: [] },
      sideObjectives,
      scenes: [...poles.scenes, ...bottles.scenes, ...hunts.map(h => h.scene), fire],
      summary: freshPick(rng, SUMMARY[pay.tier]),
      tally: {
        clock: CLOCK, minutesUsed: Math.min(minutesUsed, CLOCK + 9), lit, pieces: PIECES,
        piecesSet: lit ? PIECES : Math.min(PIECES - 1, piecesSet),
        placed: { ...bottles.placed },
        freeOrder: [...poles.freeOrder],
        offered: shieldOn,
        shields: SLOTS.map(sl => {
          const h = hunts.find(x => x.slot === sl.id);
          return { slot: sl.id, where: sl.where, phase: sl.phase,
            searcher: h ? h.searcher : null, holder: h && h.found ? h.searcher : null,
            witnesses: h ? [...h.block.witnesses] : [] };
        }),
      },
    };
    return validateMissionRecord(rec, ctx);
  },
};

export default beaconLighting;
