// ══════════════════════════════════════════════════════════════════════
// tr/missions/wicker-beasts.js — Wicker Beasts
// ══════════════════════════════════════════════════════════════════════
//
// From the wiki (thetraitors.fandom.com/wiki/Wicker_Beasts — UK S1, US S1,
// Portugal S1). Two teams each build a fuse and set fire to a giant wicker
// beast inside thirty minutes. Half of each team digs the storm debris for
// rope; the other half rows across the river for the only torch. First beast
// to burn earns the full prize, the second half. Approved mockup:
// mockup/mockup-tr-wicker-beasts.html.
//
// EACH TEAM HAS ITS OWN CLOCK. Rotten rope, a boat going in circles, a torch
// a wave put out, a knot that stops the flame: each costs that team minutes.
// A beast that has not caught at thirty minutes earns nothing. The afternoon's
// tier follows the fires, so the summary cannot contradict them: both burned
// is solid or better, one is scraped, none is failed.
//
// THE SHIELD is inside a wicker hare in the debris. The digger who stops to
// unpick it (see `runShieldHunt`) leaves their team a length of rope short.
//
// WHAT A TRAITOR CAN DO. Hold the torch low in the boat, or tie a knot that
// will not carry the flame. Both are ordinary mistakes; both cost minutes.

import {
  briefingText, clamp01, confessionalVoice, freshPick, hostDo, hostSay, PHASE_SWING,
  missionQuality, missionScene, noisyPair, payPot, placementsFrom, pronounSlots, render,
  splitTeams, statOf, validateMissionRecord, weightedPick, runSideObjectives,
  runShieldHunt, missionShieldOffered, shieldCostOf,
} from './contract.js';

const TEAMS = ['Stag', 'Boar'];
const CLOCK = 30;
const ROPE = 6;

function _interleave(beats) {
  const by = {};
  for (const b of beats) (by[b.team] = by[b.team] || []).push(b);
  const lists = Object.values(by);
  const out = [];
  for (let i = 0; out.length < beats.length; i++) for (const l of lists) if (l[i]) out.push(l[i]);
  return out;
}

/** Half of each team digs, half rows: the team's own call, weighted on the job. */
function _roles(teams, rng) {
  for (const t of teams) {
    const pool = [...t.members];
    const want = Math.max(1, Math.floor(pool.length / 2));
    t.diggers = [];
    for (let i = 0; i < want && pool.length > 1; i++) {
      const who = weightedPick(rng, pool, n => 0.4 + (statOf(n, 'intuition') + statOf(n, 'physical')) / 20);
      t.diggers.push(who);
      pool.splice(pool.indexOf(who), 1);
    }
    t.rowers = pool;
  }
}

// ══════════════════════════════════════════════════════════════════════
// THE BRIEFING
// ══════════════════════════════════════════════════════════════════════
const BRIEF = [
  hostDo('The host stands between the two beasts, one hand resting on the stag\'s woven foreleg.'),
  hostSay('Each team has a beast. Your job is to burn it.'),
  hostSay('To burn it you need a fuse and a flame. The rope for the fuse is buried in that debris. '
    + 'Half of you dig it out and tie it into one long line from the beast to the bank.'),
  hostDo('The host points across the river to a single torch burning on a post.'),
  hostSay('The other half row across and bring back the flame. Let it go out and you row back for '
    + 'another. Tie a bad knot and the fire stops at it.'),
];
const SHIELD_BRIEF = [
  hostSay('Somewhere in that debris is a small wicker hare, and inside the hare is a Shield. Whoever '
    + 'opens it keeps it.'),
  hostSay('Whoever stops to open it is not finding rope, and your fuse will be shorter for it.'),
];
const CLOSE = [
  hostSay(`The first beast to burn earns the most for the pot. The second earns half. A beast that is `
    + `still standing in ${CLOCK} minutes earns nothing. Go.`),
  hostDo('The host steps well back from both beasts.'),
];

function _ceremony(shield) {
  const hostBeats = [...BRIEF, ...(shield ? SHIELD_BRIEF : []), ...CLOSE];
  const at = s => hostBeats.findIndex(b => b.kind === 'say' && b.text.startsWith(s));
  return {
    ceremonyId: 'mission-brief-wicker-beasts',
    staging: 'A riverside field. Two giant beasts woven from willow stand at the far end, a stag and '
      + 'a boar. Heaps of storm debris line the near bank, and two rowing boats are tied up at the water.',
    hostBeats,
    contestantBeats: [],
    rulePoints: [
      { id: 'task', explainedByBeat: at('Each team has a beast') },
      { id: 'fuse', explainedByBeat: at('To burn it') },
      { id: 'failure', explainedByBeat: at('The other half row') },
      ...(shield ? [
        { id: 'shield', explainedByBeat: at('Somewhere in that debris') },
        { id: 'cost', explainedByBeat: at('Whoever stops to open it') },
      ] : []),
      { id: 'reward', explainedByBeat: at('The first beast') },
      { id: 'finish', explainedByBeat: at('The first beast') },
    ],
    revealBeats: hostBeats.length,
    reminder: 'The host reminds the room that the rope is in the debris, the flame is across the '
      + 'river, and a beast still standing at the bell earns nothing.',
  };
}

// ══════════════════════════════════════════════════════════════════════
// THE SHIELD — the wicker hare
// ══════════════════════════════════════════════════════════════════════
const HARE = {
  id: 'wicker', phase: 'debris', field: 'unpickedTheHare', penalty: 0.04,
  weight: n => 0.3 + 0.9 * (statOf(n, 'boldness') / 10) * (1 - 0.5 * (statOf(n, 'loyalty') / 10)),
  chance: n => 0.18 + 0.035 * statOf(n, 'intuition'),
  found: [
    '{who} found the wicker hare under a sheet of corrugated iron, sat down with it, and unpicked it until the Shield fell out.',
    '{who} stopped digging for rope the moment {they} saw straw ears in the pile, and came out of the debris with a Shield.',
    'While the rest of the diggers pulled rope, {who} was quietly taking a wicker hare apart. There was a Shield inside.',
  ],
  missed: [
    '{who} spent ten minutes looking for the wicker hare instead of rope, and came back with neither.',
    '{who} found a wicker hare, unpicked it, and it was empty straw. Somebody else must have had the real one hidden better.',
  ],
  voice: {
    found: {
      villainous: 'Rope is rope. There was only one of those in the whole field.',
      nice: "I know the fuse was short. I'll tie every knot twice to make up for it.",
      neutral: 'Everyone was busy looking down for rope. I looked for ears.',
    },
    missed: {
      villainous: "No Shield, and they all saw me looking. Now I need them to think I was looking for rope.",
      nice: "I went for it and I came back with nothing. My team deserved better than that.",
      neutral: "Ten minutes of my afternoon on a toy. I'd like them back.",
    },
  },
};

// ══════════════════════════════════════════════════════════════════════
// PHASE 1 — THE DEBRIS. intuition and physical.
// ══════════════════════════════════════════════════════════════════════
const DIG_GOOD = [
  '{who} pulled a whole broken fence out of the pile and found twenty feet of good rope still tied to it.',
  '{who} worked out the storm had carried everything downhill and dug at the bottom of the heap. Rope, lots of it.',
  '{who} came back from the debris with two coils over each shoulder.',
];
const DIG_BAD = [
  '{who} brought back three armfuls of rope, and two of them snapped the moment anybody pulled on them.',
  '{who} dug in the wrong heap for ten minutes and found a great deal of sacking.',
  '{who} pulled a coil free and it was so rotten it came apart in {their} hands.',
];
const DIG_STEADY = [
  '{who} dug steadily and brought back a length at a time.',
  '{who} found one good coil and carried it to the bank without fuss.',
];

function _debris(ctx, rng, teams) {
  const beats = [];
  const contrib = {};
  const rope = {};
  const minutes = {};
  for (const t of teams) {
    let found = 0;
    for (const name of t.diggers) {
      const v = noisyPair(rng, name, 'intuition', 'physical', 3.2);
      contrib[name] = clamp01(v / 10) * 10;
      const slots = pronounSlots(name);
      if (v >= 6.6) { found += 2; beats.push({ team: t.name, player: name, kind: 'good', score: v, text: render(freshPick(rng, DIG_GOOD), slots) }); }
      else if (v <= 3.8) { beats.push({ team: t.name, player: name, kind: 'bad', score: v, text: render(freshPick(rng, DIG_BAD), slots) }); }
      else { found += 1; beats.push({ team: t.name, player: name, kind: 'steady', score: v, text: render(freshPick(rng, DIG_STEADY), slots) }); }
    }
    // A short haul means digging longer; a long one means the rope is there.
    const scaled = Math.round(found * (ROPE / Math.max(2, t.diggers.length * 1.5)));
    rope[t.name] = Math.min(ROPE, scaled);
    minutes[t.name] = 6 + Math.max(0, ROPE - rope[t.name]) * 2;
  }
  const score = t => t.diggers.reduce((s, n) => s + (contrib[n] || 0), 0) / Math.max(1, t.diggers.length);
  return {
    phase: { id: 'debris', name: 'The Debris', stats: ['intuition', 'physical'],
      setting: 'Heaps of storm wreckage on the near bank: branches, sacking, broken crates, and rope somewhere underneath.',
      beats: _interleave(beats),
      teams: teams.map(t => ({ name: t.name, score: clamp01(score(t) / 10 * (0.6 + 0.4 * rope[t.name] / ROPE)),
        rope: rope[t.name] })) },
    contrib, rope, minutes,
  };
}

// ══════════════════════════════════════════════════════════════════════
// PHASE 2 — THE RIVER. endurance and strategic.
// ══════════════════════════════════════════════════════════════════════
const ROW_GOOD = [
  '{who} rowed {team} across in a straight line and was at the torch before the other boat had its oars in.',
  '{who} set a rowing count the whole boat could keep, and it kept it.',
];
const ROW_BAD = [
  '{who} pulled harder on one oar than the other, and {team}\'s boat turned a full circle in the middle of the river.',
  '{who} caught a crab with the oar and nearly went over the side.',
];
const ROW_STEADY = [
  '{who} rowed {their} share and kept the boat pointed at the torch.',
  '{who} took an oar and did not complain about the current.',
];
const OAR_HELP = [
  '{who} took one oar off {other} and counted the strokes out loud until the boat went straight.',
  '{who} swapped seats with {other} mid-river and had the boat moving again in a minute.',
];
const DOUSED = [
  '{who} held the torch too low coming back, a wave came over the side, and {team} rowed back across for another flame.',
  '{who} shielded the torch with {their} jacket, which caught, and in the scramble the flame went into the river. {team} went back for another.',
];

function _river(ctx, rng, teams, minutes) {
  const beats = [];
  const scenes = [];
  const contrib = {};
  const doused = {};
  let refused = false;
  let helped = false;
  for (const t of teams) {
    // FIRST, whether anybody will not get in the boat — at most once an
    // afternoon. Decided before anybody rows, so the person who stayed on the
    // bank has no rowing beat, no oar to hand over and no torch to carry.
    let scared = null;
    if (!refused && t.rowers.length > 1) {
      const least = [...t.rowers].sort((a, b) => statOf(a, 'boldness') - statOf(b, 'boldness'))[0];
      if (rng() < clamp01(0.4 - 0.05 * statOf(least, 'boldness'))) {
        refused = true;
        scared = least;
        contrib[scared] = 0;
        minutes[t.name] += 1;
        scenes.push(missionScene({
          id: `wicker-refused-${t.name}`, eventId: 'wicker-would-not-row', phase: 'river',
          participants: [scared], behaviour: 'cowardly',
          text: `${scared} took one look at the river and stayed on the bank. ${t.name} rowed a pair of arms short.`,
          effects: [
            { kind: 'crowd', name: scared, colour: 'cowardly', mult: 0.5, source: `${scared} would not get in the boat` },
          ],
          confessional: { purpose: 'emotional-turn', speaker: scared,
            text: confessionalVoice(scared, {
              nice: "I can't swim. I should have said that before they split us up.",
              villainous: "I'm not drowning for five thousand pounds I might never see.",
              neutral: 'Deep water and a wooden boat. No thanks.',
            }) },
        }));
      }
    }
    const crew = t.rowers.filter(n => n !== scared);

    let sum = 0;
    let worst = null;
    for (const name of crew) {
      const v = noisyPair(rng, name, 'endurance', 'strategic', 3.2);
      contrib[name] = clamp01(v / 10) * 10;
      sum += v;
      const slots = { ...pronounSlots(name), team: t.name };
      if (v >= 6.6) beats.push({ team: t.name, player: name, kind: 'good', score: v, text: render(freshPick(rng, ROW_GOOD), slots) });
      else if (v <= 3.8) { if (!worst) worst = name; beats.push({ team: t.name, player: name, kind: 'bad', score: v, text: render(freshPick(rng, ROW_BAD), slots) }); }
      else beats.push({ team: t.name, player: name, kind: 'steady', score: v, text: render(freshPick(rng, ROW_STEADY), slots) });
    }
    const mean = sum / Math.max(1, crew.length);
    minutes[t.name] += Math.round(10 - mean * 0.8);

    // Somebody sorts out the boat, or it keeps going in circles. One scene an
    // afternoon; a second rescue is a plain beat.
    if (worst && crew.length > 1) {
      const pool = crew.filter(n => n !== worst);
      const who = weightedPick(rng, pool, n => 0.3 + statOf(n, 'strategic') / 8);
      if (rng() < clamp01(0.3 + 0.05 * statOf(who, 'loyalty'))) {
        contrib[who] += 0.8;
        if (helped) {
          beats.push({ team: t.name, player: who, kind: 'good', score: mean,
            text: `${who} took over from ${worst} at the oars and ${t.name} crossed straight after that.` });
        } else {
          helped = true;
          scenes.push(missionScene({
            id: `wicker-oar-${t.name}`, eventId: 'wicker-took-the-oar', phase: 'river',
            participants: [who, worst], behaviour: 'heroic',
            text: render(freshPick(rng, OAR_HELP), { ...pronounSlots(who), other: worst }),
            effects: [
              { kind: 'bond', players: [who, worst], delta: 0.6, source: `${who} took the oar from ${worst} and straightened the boat` },
              { kind: 'crowd', name: who, colour: 'heroic', mult: 0.8, source: `${who} got ${t.name}'s boat across` },
            ],
            confessional: { purpose: 'emotional-turn', speaker: worst,
              text: confessionalVoice(worst, {
                nice: `Nobody taught me to row. ${who} did, in about ninety seconds, in the middle of a river.`,
                villainous: `${who} fixed my rowing in front of everybody. Generous. I'll remember it.`,
                neutral: 'I was going in circles. Somebody sorted it. That is what boats are for.',
              }) },
          }));
        }
      } else {
        minutes[t.name] += 3;
      }
    }

    // The torch on the way back. A conflicted carrier holds it a little lower.
    const carrier = weightedPick(rng, crew, n => 0.3 + statOf(n, 'temperament') / 8);
    const pDouse = clamp01(0.2 - 0.012 * statOf(carrier, 'temperament') + (ctx.conflicted(carrier) ? 0.16 : 0));
    doused[t.name] = rng() < pDouse;
    if (doused[t.name]) {
      minutes[t.name] += 4;
      contrib[carrier] = Math.max(0, contrib[carrier] - 1.2);
      scenes.push(missionScene({
        id: `wicker-doused-${t.name}`, eventId: 'wicker-torch-doused', phase: 'river',
        participants: [carrier], behaviour: 'suspicious',
        text: render(freshPick(rng, DOUSED), { ...pronounSlots(carrier), team: t.name }),
        effects: [
          { kind: 'record', player: carrier, field: 'dousedTheTorch', value: true,
            source: `${carrier} let the torch go out on the river` },
          { kind: 'suspicion', subject: carrier, delta: 0.14,
            source: `${carrier} was holding the torch when it went out` },
        ],
      }));
    }
  }
  const score = t => t.rowers.reduce((s, n) => s + (contrib[n] || 0), 0) / Math.max(1, t.rowers.length);
  return {
    phase: { id: 'river', name: 'The River', stats: ['endurance', 'strategic'],
      setting: 'A slow brown river, two rowing boats, and one torch burning on a post on the far bank.',
      beats: _interleave(beats),
      teams: teams.map(t => ({ name: t.name, score: clamp01(score(t) / 10 - (doused[t.name] ? 0.1 : 0)),
        doused: doused[t.name] })) },
    contrib, scenes, doused,
  };
}

// ══════════════════════════════════════════════════════════════════════
// PHASE 3 — THE FUSE. mental and temperament.
// ══════════════════════════════════════════════════════════════════════
const KNOT_GOOD = [
  '{who} tied every join on {team}\'s fuse and tested each one with {their} whole weight.',
  '{who} laid the fuse flat and straight so the flame had nowhere to stop.',
];
const KNOT_BAD = [
  '{who} tied a join in a hurry and left a loose end the flame would never cross.',
  '{who} knotted two wet lengths together, which does not burn.',
];
const KNOT_STEADY = [
  '{who} tied the joins {they} were given and checked them once.',
  '{who} carried the fuse out to the beast and pegged it down.',
];

function _fuse(ctx, rng, teams, minutes) {
  const beats = [];
  const scenes = [];
  const contrib = {};
  let told = false;
  for (const t of teams) {
    let badBy = null;
    let checker = null;
    for (const name of t.members) {
      // Wider noise: cold hands tie bad knots whatever your stats say.
      const v = noisyPair(rng, name, 'mental', 'temperament', 3.4);
      contrib[name] = clamp01(v / 10) * 10;
      const slots = { ...pronounSlots(name), team: t.name };
      const pBad = clamp01(0.16 - 0.012 * v + (ctx.conflicted(name) ? 0.14 : 0));
      if (rng() < pBad) {
        if (!badBy) badBy = name;
        contrib[name] = Math.max(0, contrib[name] - 1.3);
        beats.push({ team: t.name, player: name, kind: 'bad', score: v, text: render(freshPick(rng, KNOT_BAD), slots) });
      } else if (v >= 6.6) {
        if (!checker) checker = name;
        beats.push({ team: t.name, player: name, kind: 'good', score: v, text: render(freshPick(rng, KNOT_GOOD), slots) });
      } else {
        beats.push({ team: t.name, player: name, kind: 'steady', score: v, text: render(freshPick(rng, KNOT_STEADY), slots) });
      }
    }
    minutes[t.name] += 5;
    if (badBy) {
      minutes[t.name] += 3;
      const finder = checker && checker !== badBy ? checker
        : t.members.filter(n => n !== badBy)[0];
      if (finder && !told) {
        told = true;
        scenes.push(missionScene({
          id: `wicker-bad-knot-${t.name}`, eventId: 'wicker-flame-stopped-at-a-knot', phase: 'fuse',
          participants: [finder, badBy], behaviour: 'suspicious',
          text: `${t.name}'s flame stopped dead at the one knot ${finder} had not tied. ${badBy} had tied it. ${finder} retied it with the torch already burning beside ${pronounSlots(finder).them}.`,
          effects: [
            { kind: 'claim', claimant: finder, about: badBy,
              text: `${finder} says the fire stopped at ${badBy}'s knot`,
              source: `${badBy} tied the knot the flame would not cross` },
            { kind: 'suspicion', observer: finder, subject: badBy, delta: 0.24,
              source: `the fuse went out at ${badBy}'s knot` },
            { kind: 'bond', players: [finder, badBy], delta: -0.4,
              source: `${finder} had to retie ${badBy}'s knot with the torch lit` },
          ],
          confessional: { purpose: 'belief-change', speaker: finder,
            text: confessionalVoice(finder, {
              neutral: "I checked every knot I tied. I didn't check theirs. I will next time.",
              villainous: 'One bad knot, and I know whose it was. So will the table.',
              nice: "Knots are hard when your hands are cold. I'm trying to believe that's all it was.",
            }) },
        }));
      }
    }
  }
  const score = t => t.members.reduce((s, n) => s + (contrib[n] || 0), 0) / Math.max(1, t.members.length);
  return {
    phase: { id: 'fuse', name: 'The Fuse', stats: ['mental', 'temperament'],
      setting: "One long line of knotted rope from the bank to each beast's feet, and a torch coming up the field.",
      beats: _interleave(beats),
      teams: teams.map(t => ({ name: t.name, score: clamp01(score(t) / 10) })) },
    contrib, scenes,
  };
}

const SUMMARY = {
  triumph: [
    'Both beasts burned with time to spare, and the field smelled of woodsmoke for the rest of the day.',
    'Two fires, clean fuses, and a pot that took the full amount for both.',
    'The stag and the boar went up almost together. Nobody had to row twice.',
  ],
  solid: [
    'Both beasts burned. One well, one late, and the late one will be argued about.',
    'Two fires in the end, though one team spent most of its half-hour on the river.',
    'Everything that was supposed to burn burned, eventually.',
  ],
  scraped: [
    'One beast burned. The other was still standing at the bell with a fuse that went nowhere.',
    'A single fire, and a team walking back past a beast it never lit.',
    'One team got its flame to the end. The other stood in the smoke of somebody else\'s beast.',
  ],
  failed: [
    'Neither beast burned. The torches went out and the fuses never got the flame to the wicker.',
    'Two beasts still standing at the bell, and nothing for the pot.',
    'Wet rope, a doused torch and knots that would not carry it. Nothing caught.',
  ],
};

// ══════════════════════════════════════════════════════════════════════

export const wickerBeasts = {
  id: 'wicker-beasts',
  name: 'Wicker Beasts',
  teams: TEAMS,
  side: [
    { id: 'coil-alone', label: 'pull a whole coil of rope out of the debris alone', stat: 'physical' },
    { id: 'rowed-straight', label: 'row the whole crossing without the boat turning', stat: 'endurance' },
  ],
  desc: 'Two giant wicker beasts, a stag and a boar, stand in a riverside field, with storm '
    + 'debris on the near bank and a single torch burning on the far side of the river. Each '
    + 'team splits in half: the diggers pull rope out of the debris and tie it into a fuse from '
    + 'the beast to the bank, while the rowers cross the river in a boat and carry the flame '
    + 'back. Rotten rope snaps, a boat can turn in circles, a torch that goes out means rowing '
    + 'back for another, and a badly tied knot stops the flame partway along the fuse. On a '
    + 'Shield afternoon a wicker hare in the debris holds a Shield, and the digger who stops to '
    + 'open it leaves their team a length of rope short. The first beast to burn puts the most '
    + 'into the shared pot, the second half as much, and a beast still standing at thirty '
    + 'minutes earns nothing.',

  eligibility(ctx) {
    return Array.isArray(ctx?.living) && ctx.living.length >= 4;
  },

  simulate(ctx, rng) {
    const living = [...ctx.living];
    const teams = splitTeams(living, rng, TEAMS);
    _roles(teams, rng);
    const shieldOn = missionShieldOffered(ctx);
    const ceremony = _ceremony(shieldOn);

    const debris = _debris(ctx, rng, teams);
    const minutes = { ...debris.minutes };
    const river = _river(ctx, rng, teams, minutes);
    const fuse = _fuse(ctx, rng, teams, minutes);

    // THE HARE, after the phases so their stream is untouched, drawn from the
    // diggers only. Its cost is a length of rope: two more minutes for that team.
    const hunt = runShieldHunt(ctx, rng, teams.map(t => ({ name: t.name, members: t.diggers })), HARE);
    if (hunt.team) minutes[hunt.team] += 2;

    const lit = {};
    for (const t of teams) { minutes[t.name] += 2 + Math.floor(rng() * 8); lit[t.name] = minutes[t.name] <= CLOCK; }
    const litTeams = teams.filter(t => lit[t.name]).sort((a, b) => minutes[a.name] - minutes[b.name]);
    const order = litTeams.map(t => t.name);
    // Second really is second: never on the same minute as the first.
    if (order.length === 2 && minutes[order[1]] <= minutes[order[0]]) {
      minutes[order[1]] = minutes[order[0]] + 1;
      if (minutes[order[1]] > CLOCK) { lit[order[1]] = false; order.pop(); }
    }

    const phases = [debris.phase, river.phase, fuse.phase];
    const base = teams.map(t => {
      const parts = phases.map(ph => ph.teams.find(x => x.name === t.name).score);
      return { name: t.name, members: [...t.members], perf: clamp01(parts.reduce((a, b) => a + b, 0) / parts.length + (rng() - 0.5) * PHASE_SWING) };
    });
    const scored = base.map(t => (t.name === hunt.team ? { ...t, perf: clamp01(t.perf - hunt.penalty) } : t));

    const playerScores = {};
    for (const n of living) {
      playerScores[n] = Number(((debris.contrib[n] || 0) + (river.contrib[n] || 0) + (fuse.contrib[n] || 0)).toFixed(3));
    }

    // THE FIRES DECIDE THE TIER. Two fires is solid or better, one is scraped,
    // none is failed, so the summary line always matches what burned.
    const fires = order.length;
    const band = q => (fires === 2 ? Math.max(0.4, clamp01(q * 1.12))
      : fires === 1 ? Math.min(0.39, Math.max(0.15, q * 0.7)) : Math.min(0.14, q * 0.25));
    const quality = band(missionQuality(scored[0].perf, scored[1].perf));
    const sideObjectives = runSideObjectives(wickerBeasts.side, scored, rng, hunt.searcher);
    const pay = payPot(quality, sideObjectives.reduce((a, o) => a + o.bonus, 0));
    hunt.block.cost = shieldCostOf(quality, band(missionQuality(base[0].perf, base[1].perf)));

    const fireScenes = teams.map(t => {
      const lighter = [...t.members].sort((a, b) => (playerScores[b] - playerScores[a]) || (a < b ? -1 : 1))[0];
      const place = order.indexOf(t.name);
      return missionScene({
        id: `wicker-fire-${t.name}`, eventId: place === 0 ? 'wicker-first-to-burn' : place === 1 ? 'wicker-second-to-burn' : 'wicker-never-caught',
        phase: 'fuse', participants: [lighter],
        behaviour: place >= 0 ? 'heroic' : null,
        text: place === 0
          ? `${lighter} ran the torch up the field and put it to the end of ${t.name}'s fuse. The flame ran the whole length and the ${t.name.toLowerCase()} went up with ${CLOCK - minutes[t.name]} minutes to spare.`
          : place === 1
            ? `${t.name}'s ${t.name.toLowerCase()} caught at last with ${Math.max(0, CLOCK - minutes[t.name])} minutes left. ${lighter} lit it. Second, and still worth half.`
            : `The bell went with ${t.name}'s ${t.name.toLowerCase()} still standing. ${lighter} was still working on the fuse.`,
        effects: [place >= 0
          ? { kind: 'crowd', name: lighter, colour: 'heroic', mult: place === 0 ? 0.6 : 0.4, source: `${lighter} lit ${t.name}'s beast` }
          : { kind: 'record', player: lighter, field: 'beastUnlit', value: true, source: `${t.name}'s beast never caught, with ${lighter} at the fuse` }],
      });
    });

    const rec = {
      id: 'wicker-beasts', ep: ctx.ep, name: 'Wicker Beasts',
      ceremony, briefing: briefingText(ceremony.hostBeats),
      teams: scored,
      phases,
      playerScores,
      placements: placementsFrom(playerScores),
      quality, tier: pay.tier,
      bestTeam: order[0] || (scored[0].perf >= scored[1].perf ? scored[0].name : scored[1].name),
      potBefore: pay.potBefore, gross: pay.gross, potEarned: pay.potEarned,
      potAfter: pay.potAfter, earned: pay.potEarned,
      shields: hunt.found ? [hunt.block] : [],
      shield: hunt.block,
      sideObjectives,
      scenes: [...hunt.scenes, ...river.scenes, ...fuse.scenes,
        // Fires in the order they caught, the unlit one last.
        ...fireScenes.sort((a, b) => {
          const ia = order.indexOf(a.id.replace('wicker-fire-', ''));
          const ib = order.indexOf(b.id.replace('wicker-fire-', ''));
          return (ia < 0 ? 9 : ia) - (ib < 0 ? 9 : ib);
        })],
      summary: freshPick(rng, SUMMARY[pay.tier]),
      tally: {
        clock: CLOCK, ropeTarget: ROPE, offered: shieldOn,
        rope: { ...debris.rope },
        ropeUsed: Object.fromEntries(teams.map(t => [t.name, Math.max(0, debris.rope[t.name] - (hunt.team === t.name ? 1 : 0))])),
        doused: { ...river.doused },
        minutes: Object.fromEntries(teams.map(t => [t.name, Math.min(CLOCK, minutes[t.name])])),
        lit: { ...lit }, order: [...order],
        roles: Object.fromEntries(teams.map(t => [t.name, { diggers: [...t.diggers], rowers: [...t.rowers] }])),
      },
    };
    return validateMissionRecord(rec, ctx);
  },
};

export default wickerBeasts;
