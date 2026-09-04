// ══════════════════════════════════════════════════════════════════════
// tr/missions/drowned-causeway.js — The Drowned Causeway
// ══════════════════════════════════════════════════════════════════════
//
// A tidal sandbar, a ruined chapel on it, and about seventy minutes before the
// sea closes the road. The castle carries sealed strongboxes out to the chapel,
// gets them up onto the roof by the only route that is still above water, and
// rings the tide bell the number of times the tide board says. Every box on the
// roof when the bell stops is money. Every box still on the sand is not.
//
// WHY THIS MISSION EXISTS, and what makes it different from the six archetypes
// it sits beside: THE CLOCK IS A PLACE. The archetypes model an afternoon as a
// stat pair and a tier of prose, so there is nothing inside them for anybody to
// choose. Here the tide is a physical line that moves across the mission — the
// wade is measured against it, the ledge is above it, and the bell is rung
// after it has taken the road — so every phase can be narrated in terms of a
// thing the viewer can see, and every failure has a shape ("she went back for
// it and the channel was already knee-deep") rather than a percentage.
//
// THE THREE PHASES USE THREE DIFFERENT PAIRS OF STATS, and that is the
// scoring balance rule from AGENTS.md rather than decoration: endurance and
// physical carry the boxes, boldness and temperament get along the ledge, and
// mental and intuition read the board. A cast member who is useless on the
// sand is the one who reads the tide, which is the whole reason to have three
// phases instead of one number.
//
// WHAT A TRAITOR CAN DO HERE, AND WHAT THEY CANNOT. On the ledge a passer can
// hold a box a beat too long before handing it on. That is a NUDGE to the
// hand-over roll and the receiver's temperament can still beat it; there is no
// branch anywhere in this file where sabotage is guaranteed. And a Faithful
// whose hands are cold produces exactly the same observable — a fumbled
// hand-over — which is where this mission's false accusations come from and
// why the record carries the fumble and never the reason for it.
//
// NO SHIELD. The relic is in js/tr/missions/ash-vault.js and nowhere else: one
// bespoke mission grants a power, for the same reason exactly one archetype
// does. Four missions each handing out an afternoon's immunity would make the
// Shield the ordinary state of the castle rather than the thing that has to be
// paid for out of the pot.

import {
  briefingText, clamp01, confessionalVoice, freshPick, hostDo, hostSay, PHASE_SWING,
  missionQuality, missionScene, noisyPair, payPot, placementsFrom,
  pronounSlots, render, splitTeams, statOf, validateMissionRecord, weightedPick,
} from './contract.js';

/** The two teams. Named for what is on the sandbar rather than for a colour. */
const TEAMS = ['Gulls', 'Herons'];

/** How many boxes are out there. Scales with the room so a small cast is not idle. */
const boxesFor = n => Math.max(4, Math.min(10, Math.round(n * 0.6)));

// ══════════════════════════════════════════════════════════════════════
// THE BRIEFING — the ceremony, and the only place the rules are stated
// ══════════════════════════════════════════════════════════════════════
//
// Every rule the afternoon will enforce is spoken here, before anybody moves,
// in a complete sentence somebody could act on. The staging is written out
// because the ceremony contract asks for the physical space and not a summary
// of it: the host is standing on the near end of the causeway with the tide
// board behind them and the sea already showing at the edge of the sand.
//
// THE HOST IS NEVER NAMED. Global constraint — host explanations use the
// configured host and never a literal name — so every beat says "the host" and
// the screen substitutes the season's own. That also makes this speech
// gender-neutral by construction, which is the standing rule for host prose.
function _ceremony(boxes) {
  const hostBeats = [
    hostDo('The host stands at the landward end of the causeway with the tide board '
      + 'behind them. The sea is already visible at both edges of the sand.'),
    hostSay('Out there is a chapel. It has been cut off twice a day for four hundred '
      + 'years, and in about seventy minutes it will be cut off again.'),
    hostDo('The host turns and points along the wet road to the chapel.'),
    hostSay(`Between here and it are ${boxes} sealed strongboxes, half of them marked `
      + 'for one team and half for the other. You will carry them out along the '
      + 'causeway. That is the easy part, and I would enjoy it.'),
    hostDo('A crew member lifts the corner of a tarpaulin at the chapel wall, showing '
      + 'a stone ledge about a foot wide running above the channel.'),
    hostSay('You cannot take a box in through the chapel door, because by the time you '
      + 'reach it there will be water across the threshold. You take it along that '
      + 'ledge, hand to hand, and up onto the roof.'),
    hostSay('If a box goes into the channel, it is gone. Nobody goes in after it. If you '
      + 'drop a box on the sand you may go back for it, and you will lose the time '
      + 'it takes you, and the tide does not wait while you decide.'),
    hostDo('The host walks to the foot of the tower and puts a hand on the bell rope.'),
    hostSay('When your boxes are up, one of you rings this bell. The tide board will '
      + 'tell you how many times — read it properly, because a wrong count opens '
      + 'the wrong hatch, and the wrong hatch drops a box straight back onto the sand.'),
    hostSay('Every strongbox on that roof when I stop the clock is two thousand into '
      + 'the pot you are all playing for. Every box still down here earns you nothing '
      + 'except the walk back.'),
    hostDo('The host steps aside and looks at the water.'),
    hostSay('The road closes when it closes. Whoever is on the wrong side of it when '
      + 'that happens finishes the afternoon watching. Go.'),
  ];
  return {
    ceremonyId: 'mission-brief-drowned-causeway',
    staging: 'The landward end of a tidal causeway at half-tide. A painted tide board on '
      + 'a post, a line of sealed strongboxes on the shingle, and a ruined chapel about '
      + 'four hundred yards out on the sand.',
    hostBeats,
    contestantBeats: [],
    rulePoints: [
      { id: 'task', explainedByBeat: 3 },
      { id: 'route', explainedByBeat: 5 },
      { id: 'failure', explainedByBeat: 6 },
      { id: 'count', explainedByBeat: 8 },
      { id: 'reward', explainedByBeat: 9 },
      { id: 'finish', explainedByBeat: 11 },
    ],
    revealBeats: hostBeats.length,
    reminder: 'The host reminds the room that the ledge is the only way onto the roof and '
      + 'that the tide board sets the count on the bell.',
  };
}

// ══════════════════════════════════════════════════════════════════════
// PHASE 1 — THE WADE. endurance and physical, and the sand takes both.
// ══════════════════════════════════════════════════════════════════════
//
// Everybody carries. Per-player, because the per-player record is the thing
// the archetypes could not produce and the thing every downstream event needs:
// Task 7 measured that fallout must gate on something readable, and a number
// against every name is the most readable thing a mission can write.
const WADE_STRONG = [
  '{who} took a box on each shoulder for the last two hundred yards and did not put either down.',
  '{who} found the firm sand on the seaward side and walked it while everybody else fought the ruts.',
  '{who} carried at the same pace the whole way out, which by the end meant carrying alone.',
  '{who} was back for a second box before half the line had finished the first.',
];
const WADE_WEAK = [
  '{who} went down to one knee in the soft sand about halfway and lost most of a minute getting up.',
  'The box beat {who}. {They} got it out there, eventually, at the pace of somebody being beaten by a box.',
  '{who} stopped twice, then stopped a third time and did not pretend it was to look at the water.',
  '{who} had to swap ends with somebody at the halfway post, which cost the line its rhythm.',
];
const WADE_HELP = [
  '{who} came back down the sand for {other}\'s end of a box that was not going any further on its own.',
  'When {other} stalled, {who} took the weight without being asked and walked it in.',
  '{who} put {their} own box down, went back, and carried {other}\'s the rest of the way.',
];
const WADE_SHIRK = [
  '{who} took the light end of every box {they} touched, and touched fewer of them than anybody.',
  '{who} spent the wade organising the line rather than being in it, which is a job that pays nothing.',
  '{who} was on the sand the whole time and somehow never under a box.',
];

function _wade(ctx, rng, teams) {
  const beats = [];
  const scenes = [];
  const contrib = {};
  for (const t of teams) {
    for (const name of t.members) {
      const v = noisyPair(rng, name, 'endurance', 'physical');
      contrib[name] = clamp01(v / 10) * 10;
      const slots = pronounSlots(name);
      if (v >= 7.4) {
        beats.push({ team: t.name, player: name, kind: 'strong', score: v,
          text: render(freshPick(rng, WADE_STRONG), slots) });
      } else if (v <= 3.6) {
        beats.push({ team: t.name, player: name, kind: 'weak', score: v,
          text: render(freshPick(rng, WADE_WEAK), slots) });
      } else {
        beats.push({ team: t.name, player: name, kind: 'steady', score: v,
          text: `${name} carried ${slots.their} share of the boxes out and came back for another.` });
      }
    }
  }

  // ── THE ONE SOCIAL BEAT THE SAND PRODUCES ────────────────────────────
  // Somebody was struggling and somebody else did or did not go back. Drawn
  // from the phase's OWN results rather than at random: the person who is
  // helped is the worst score on that team and the helper is weighted on
  // loyalty, so the scene cites a fact the record already carries. That is the
  // causal contract at the smallest scale it operates on — the stored fact is
  // the wade score, the eligible reaction is a rescue, the scene names both.
  // FIRES FOR EVERY TEAM WITH TWO PEOPLE ON IT, and the branch rather than the
  // firing is what varies. A gate here — "only when the team is big enough",
  // "only 55% of the time" — is how a mission ends up with an afternoon that
  // recorded no scenes at all, which `validateMissionRecord` refuses outright
  // and which a four-person late-game castle would have hit first.
  for (const t of teams) {
    if (t.members.length < 2) continue;
    const ranked = [...t.members].sort((a, b) => contrib[a] - contrib[b]);
    const struggler = ranked[0];
    const pool = t.members.filter(n => n !== struggler);
    if (!pool.length) continue;
    const helper = weightedPick(rng, pool, n => 0.4 + statOf(n, 'loyalty') / 10 + contrib[n] / 20);
    const helped = rng() < clamp01(0.2 + 0.06 * statOf(helper, 'loyalty'));
    const slots = { ...pronounSlots(helper), other: struggler };
    if (helped) {
      contrib[helper] += 0.8;
      scenes.push(missionScene({
        id: `causeway-wade-help-${t.name}`,
        eventId: 'causeway-carry-taken-over',
        phase: 'wade',
        participants: [helper, struggler],
        behaviour: 'heroic',
        text: render(freshPick(rng, WADE_HELP), slots),
        effects: [
          { kind: 'bond', players: [helper, struggler], delta: 0.6,
            source: `${helper} carried ${struggler}'s box in off the sand` },
          { kind: 'crowd', name: helper, colour: 'heroic', mult: 0.8,
            source: `${helper} went back down the causeway for somebody else's box` },
        ],
        confessional: {
          purpose: 'emotional-turn', speaker: struggler,
          text: confessionalVoice(struggler, {
            nice: `I couldn't get that thing off the sand. ${helper} didn't say a word about `
              + 'it, which somehow made it worse and better at the same time.',
            villainous: `${helper} reckons that little rescue means I owe them something now. `
              + "I don't. I'll file it and I'll never mention it — out here a favour's just a "
              + 'receipt, and I keep the receipts.',
            neutral: `I'd have got it up eventually. Everyone's decided ${helper} saved me and `
              + "I'm not going to make a speech about it — I didn't ask anybody to come back.",
          }),
        },
      }));
    } else {
      contrib[helper] += 0.3;
      scenes.push(missionScene({
        id: `causeway-wade-shirk-${t.name}`,
        eventId: 'causeway-carry-left-behind',
        phase: 'wade',
        participants: [helper, struggler],
        behaviour: 'selfish',
        text: render(freshPick(rng, WADE_SHIRK), slots)
          + ` ${struggler} was still out on the sand with a box when the line came back.`,
        effects: [
          { kind: 'bond', players: [helper, struggler], delta: -0.5,
            source: `${helper} walked past ${struggler} on the sand and did not stop` },
          { kind: 'crowd', name: helper, colour: 'selfish', mult: 0.6,
            source: `${helper} carried the light end and left ${struggler} out there` },
        ],
        confessional: {
          purpose: 'hidden-intent', speaker: helper,
          text: confessionalVoice(helper, {
            villainous: "I'm not carrying two boxes so somebody who hasn't done a thing all "
              + 'week can walk in beside me looking useful.',
            nice: "I keep telling myself I didn't see them stuck out there. I did. I just "
              + "didn't turn around, and that's not the person I want the room to be voting for.",
            neutral: `Everybody hauls their own box, that's the whole job. I'm not wrecking my `
              + `own back dragging ${struggler} in when they've been coasting since Monday.`,
          }),
        },
      }));
    }
  }

  const score = t => t.members.reduce((s, n) => s + contrib[n], 0) / Math.max(1, t.members.length);
  return {
    phase: {
      id: 'wade', name: 'The Wade',
      setting: 'Four hundred yards of wet sand between the shingle and the chapel wall.',
      stats: ['endurance', 'physical'],
      beats,
      teams: teams.map(t => ({ name: t.name, score: score(t) / 10 })),
    },
    contrib, scenes,
  };
}

// ══════════════════════════════════════════════════════════════════════
// PHASE 2 — THE LEDGE. boldness and temperament, above moving water.
// ══════════════════════════════════════════════════════════════════════
//
// Not everybody goes on the ledge. Three per team, chosen by the team on
// boldness — which is the room's own judgement and not a stat gate, because
// the weighting is proportional and a nervous player with the boldness of a
// door still turns up on the ledge some afternoons and is the reason the
// hand-over is a roll rather than a formula.
//
// THE HAND-OVER IS WHERE THE MISSION CAN BE UNDERMINED. A passer holds a beat
// too long; the receiver's temperament decides whether that becomes a fumble.
// A conflicted passer's hold is longer — a shift to the roll, never a switch —
// and the record stores the FUMBLE and never the hold's reason, because from
// the roof nobody can tell the difference between a slow hand and a cold one.
const LEDGE_CROSS = [
  '{who} went out along the ledge without touching the wall, which nobody had told {them} was possible.',
  '{who} took the ledge at a walk. The channel was doing what channels do underneath and {they} did not look at it.',
  '{who} moved along the ledge deliberately, box against the stone, and made it look like a corridor.',
  '{who} was out and back twice before the second team had committed anybody to it.',
];
const LEDGE_FREEZE = [
  '{who} got four feet along the ledge, stopped, and stayed stopped for a length of time that started to matter.',
  'The channel got into {who}\'s head. {They} came back off the ledge without the box and would not say why.',
  '{who} would not put a second foot on the stone. Somebody else took the box out of {their} hands.',
  '{who} went out, looked down once, and everything after that was very slow.',
];
const LEDGE_FUMBLE = [
  'The hand-over between {who} and {other} came apart above the channel. The box went in and did not come out.',
  '{who} held the box a beat longer than {other} expected and it went between them into the water.',
  '{other} reached for it, {who} let go, and there was a gap where the box should have been.',
  'Nobody could say afterwards whose hands it left. The channel took it either way.',
];
const LEDGE_TALK = [
  '{who} talked {other} the last six feet of the ledge in a voice you would use on a horse.',
  '{who} stood at the near end and gave {other} something to walk towards until {they} did.',
  '{other} had stopped. {who} went out to {them}, took the box, and walked back in front of {them} the whole way.',
];

function _ledge(ctx, rng, teams, boxes) {
  const beats = [];
  const scenes = [];
  const contrib = {};
  const teamBoxes = {};
  for (const t of teams) t.members.forEach(n => { contrib[n] = 0; });

  for (const t of teams) {
    const crew = [];
    const pool = [...t.members];
    const want = Math.min(3, pool.length);
    for (let i = 0; i < want; i++) {
      const who = weightedPick(rng, pool, n => 0.5 + statOf(n, 'boldness') / 6);
      crew.push(who);
      pool.splice(pool.indexOf(who), 1);
    }
    let landed = 0;
    const quota = Math.ceil(boxes / 2);
    for (const name of crew) {
      const v = noisyPair(rng, name, 'boldness', 'temperament');
      contrib[name] = clamp01(v / 10) * 10;
      const slots = pronounSlots(name);
      if (v >= 7.2) {
        landed += 2;
        beats.push({ team: t.name, player: name, kind: 'cross', score: v,
          text: render(freshPick(rng, LEDGE_CROSS), slots) });
      } else if (v <= 3.4) {
        beats.push({ team: t.name, player: name, kind: 'freeze', score: v,
          text: render(freshPick(rng, LEDGE_FREEZE), slots) });
        scenes.push(missionScene({
          id: `causeway-ledge-freeze-${name}`,
          eventId: 'causeway-stopped-on-the-ledge',
          phase: 'ledge',
          participants: [name],
          behaviour: 'cowardly',
          text: render(freshPick(rng, LEDGE_FREEZE), slots),
          effects: [
            { kind: 'crowd', name: name, colour: 'cowardly', mult: 0.7,
              source: `${name} stopped on the chapel ledge and came back without the box` },
            { kind: 'reputation', player: name, axis: 'nerve', delta: -0.5,
              source: `${name} would not cross the ledge over the channel` },
          ],
          confessional: {
            purpose: 'emotional-turn', speaker: name,
            text: confessionalVoice(name, {
              nice: "It's a foot wide and there's water under it. I've watched myself do braver "
                + "things than that and I couldn't make my leg move.",
              villainous: "Let them call it nerves. I made a call — that box wasn't worth going "
                + "into the channel for, and there's a difference between frozen and choosing, "
                + 'even if nobody up there can see it.',
              neutral: "It's a foot of wet stone over a running channel. Anybody swearing they "
                + "wouldn't think twice is lying to you. I thought twice. That's all it was.",
            }),
          },
        }));
      } else {
        landed += 1;
        beats.push({ team: t.name, player: name, kind: 'steady', score: v,
          text: `${name} got out along the ledge and got a box up, slowly, without incident.` });
      }
    }

    // The hand-over, once per team, between the two crew members whose ends
    // actually met. THE ONE PLACE A NUDGE EXISTS, and it is a nudge.
    if (crew.length >= 2) {
      const passer = crew[0], receiver = crew[1];
      const hold = ctx.conflicted(passer) ? 0.14 : 0;
      const pFumble = clamp01(0.30 + hold - 0.028 * statOf(receiver, 'temperament')
        - 0.014 * statOf(passer, 'social'));
      if (rng() < pFumble) {
        landed = Math.max(0, landed - 1);
        contrib[passer] = Math.max(0, contrib[passer] - 1.4);
        contrib[receiver] = Math.max(0, contrib[receiver] - 0.7);
        const slots = { ...pronounSlots(passer), other: receiver };
        scenes.push(missionScene({
          id: `causeway-ledge-fumble-${t.name}`,
          eventId: 'causeway-box-into-the-channel',
          phase: 'ledge',
          participants: [passer, receiver],
          behaviour: 'suspicious',
          text: render(freshPick(rng, LEDGE_FUMBLE), slots),
          effects: [
            { kind: 'bond', players: [passer, receiver], delta: -0.6,
              source: `a strongbox went into the channel between ${passer} and ${receiver}` },
            { kind: 'claim', claimant: receiver, about: passer,
              text: `${receiver} says ${passer} held the box too long on the hand-over`,
              source: `the box ${passer} and ${receiver} were passing went into the channel` },
            { kind: 'suspicion', observer: receiver, subject: passer, delta: 0.35,
              source: `${passer} held the box a beat longer than ${receiver} expected` },
          ],
          confessional: {
            purpose: 'belief-change', speaker: receiver,
            text: confessionalVoice(receiver, {
              neutral: `I had my hands on it. ${passer} didn't let go when I expected, and two `
                + "thousand went into the sea. I'm not saying it was on purpose. I'm saying I noticed.",
              villainous: `A box goes in the channel and just like that I've got a name to say `
                + `at the table tonight. Whether ${passer} did it on purpose barely matters — `
                + 'it lands on them the same either way.',
              nice: `I want to believe ${passer}'s hands were just cold, I really do. But I felt `
                + "the box sit there a beat too long, and I can't pretend I didn't.",
            }),
          },
        }));
      }
    }

    // And somebody talks the frozen one across, if there is a frozen one.
    const frozen = beats.filter(b => b.team === t.name && b.kind === 'freeze').map(b => b.player);
    if (frozen.length && t.members.length > frozen.length) {
      const who = weightedPick(rng, t.members.filter(n => !frozen.includes(n)),
        n => 0.4 + statOf(n, 'social') / 8);
      const other = frozen[0];
      contrib[who] += 1.1;
      landed += 1;
      scenes.push(missionScene({
        id: `causeway-ledge-talked-${t.name}`,
        eventId: 'causeway-talked-across',
        phase: 'ledge',
        participants: [who, other],
        behaviour: 'heroic',
        text: render(freshPick(rng, LEDGE_TALK), { ...pronounSlots(who), other }),
        effects: [
          { kind: 'bond', players: [who, other], delta: 0.9,
            source: `${who} went out onto the ledge and brought ${other} back off it` },
          { kind: 'crowd', name: who, colour: 'heroic', mult: 1,
            source: `${who} talked ${other} off the chapel ledge` },
        ],
        confessional: {
          purpose: 'character', speaker: who,
          text: confessionalVoice(who, {
            nice: `${other} wasn't moving for the host, the money or the tide. `
              + "Sometimes you've just got to go and stand where somebody can see you.",
            villainous: `Everyone clocked me going out to get ${other}. That's the point — you `
              + "want the room seeing you as the one who saves people, right up until the day you "
              + "need them not to be watching you at all.",
            neutral: `${other} had frozen solid and somebody had to go get them. It was me. I `
              + "wasn't going to stand there watching a box go nowhere because nobody else would move first.",
          }),
        },
      }));
    }

    teamBoxes[t.name] = Math.max(0, Math.min(quota, landed));
  }

  // THE PHASE IS SCORED ON WHAT REACHED THE ROOF, not only on how the crew
  // looked doing it. The first calibration scored the ledge purely on the
  // crew's own numbers, which meant a dropped strongbox cost the castle
  // nothing but a sentence — and the arm in tests/tr-missions-bespoke.test.js
  // that asks whether being conflicted costs the room anything came back GREEN
  // for this mission at n=150, because the one thing a Traitor can do here
  // touched the tally and never the money. A mission whose stated win
  // condition is boxes on a roof has to be scored on boxes on a roof.
  const quota = Math.max(1, Math.ceil(boxes / 2));
  const score = t => {
    const crewNames = t.members.filter(n => contrib[n] > 0);
    const crew = crewNames.length
      ? crewNames.reduce((s, n) => s + contrib[n], 0) / crewNames.length : 0;
    return 0.55 * crew + 0.45 * clamp01(teamBoxes[t.name] / quota) * 10;
  };
  return {
    phase: {
      id: 'ledge', name: 'The Ledge',
      setting: 'A foot-wide stone ledge along the chapel wall, above the channel, at the '
        + 'point where the tide is running fastest.',
      stats: ['boldness', 'temperament'],
      beats,
      boxes: { ...teamBoxes },
      teams: teams.map(t => ({ name: t.name, score: score(t) / 10, boxes: teamBoxes[t.name] })),
    },
    contrib, scenes, teamBoxes,
  };
}

// ══════════════════════════════════════════════════════════════════════
// PHASE 3 — THE BELL. mental and intuition, and one number to get right.
// ══════════════════════════════════════════════════════════════════════
//
// The tide board gives the count and the count is not written on it as a
// number — it is the height mark minus the hours since the last low, which is
// the kind of arithmetic three people can do in a courtyard and nobody can do
// with the sea coming in. One nominated ringer per team. A wrong count drops a
// box back down the hatch, so the phase can COST a team boxes the ledge won:
// three phases that only ever add are three phases that cannot be lost.
const BELL_RIGHT = [
  '{who} read the board twice, said a number out loud, and was not argued with. {They} were right.',
  '{who} worked the count off the height mark rather than the hours and got it first go.',
  'The number came out of {who} flatly, as if it had been obvious, and the hatch opened on the right one.',
  '{who} had the count before {they} reached the rope and rang it without checking again.',
];
const BELL_WRONG = [
  '{who} counted from the wrong low water. The hatch opened, a box came down, and the sound of it carried.',
  '{who} rang one too many. One box went back onto the sand in front of everybody who had carried it.',
  'The board said one thing and {who} said another, and the bell believed {who}.',
];
const BELL_ARGUE = [
  '{who} and {other} had the count two apart, at volume, with the water across the road.',
  '{other} wanted to ring it. {who} put a hand on the rope and would not let go until the board was read again.',
  '{who} said one number, {other} said another, and the argument took longer than the arithmetic would have.',
];

function _bell(ctx, rng, teams, teamBoxes, boxes) {
  const beats = [];
  const scenes = [];
  const contrib = {};
  for (const t of teams) t.members.forEach(n => { contrib[n] = 0; });

  for (const t of teams) {
    const ringer = weightedPick(rng, t.members,
      n => 0.4 + statOf(n, 'mental') / 8 + statOf(n, 'intuition') / 12);
    const v = noisyPair(rng, ringer, 'mental', 'intuition');
    contrib[ringer] = clamp01(v / 10) * 10;
    const slots = pronounSlots(ringer);
    const right = rng() < clamp01(0.15 + 0.08 * v);
    if (right) {
      beats.push({ team: t.name, player: ringer, kind: 'right', score: v,
        text: render(freshPick(rng, BELL_RIGHT), slots) });
    } else {
      teamBoxes[t.name] = Math.max(0, teamBoxes[t.name] - 1);
      beats.push({ team: t.name, player: ringer, kind: 'wrong', score: v,
        text: render(freshPick(rng, BELL_WRONG), slots) });
      contrib[ringer] = Math.max(0, contrib[ringer] - 2);
      scenes.push(missionScene({
        id: `causeway-bell-wrong-${t.name}`,
        eventId: 'causeway-miscounted-the-peal',
        phase: 'bell',
        participants: [ringer],
        behaviour: 'suspicious',
        text: render(freshPick(rng, BELL_WRONG), slots)
          + ` That is one strongbox, and two thousand, off ${t.name}'s total.`,
        effects: [
          { kind: 'record', player: ringer, field: 'bellMiscount', value: 1,
            source: `${ringer} rang the wrong count and cost ${t.name} a strongbox` },
          { kind: 'suspicion', observer: null, subject: ringer, delta: 0.2,
            source: `During The Drowned Causeway, ${ringer} rang the bell at the wrong tide count `
              + `even though the correct count was on the board. The mistake dropped one strongbox `
              + `and cost ${t.name} two thousand.` },
        ],
        confessional: {
          purpose: 'audience-lie', speaker: ringer,
          text: confessionalVoice(ringer, {
            neutral: "I'll tell them the board was wet. The board wasn't wet. I counted from the "
              + "wrong low water and I knew it about a second after I let go of the rope.",
            villainous: "I'll tell them the board was wet, and I'll sell it. It wasn't — I "
              + 'counted off the wrong low water. But a good story at dinner is worth more to me '
              + 'than a right answer was this afternoon.',
            nice: "I'm going to say the board was wet, and I'll hate myself for it, because it "
              + "wasn't. I counted from the wrong low water and I knew the second I let go of the rope.",
          }),
        },
      }));
    }

    // The argument at the rope, when there is somebody to have it with.
    if (t.members.length >= 2) {
      const other = weightedPick(rng, t.members.filter(n => n !== ringer),
        n => 0.4 + statOf(n, 'boldness') / 9 + statOf(n, 'strategic') / 12);
      if (other && rng() < 0.55) {
        const s2 = { ...pronounSlots(ringer), other };
        scenes.push(missionScene({
          id: `causeway-bell-argue-${t.name}`,
          eventId: 'causeway-count-disputed',
          phase: 'bell',
          participants: [ringer, other],
          behaviour: right ? 'impressive' : 'suspicious',
          text: render(freshPick(rng, BELL_ARGUE), s2)
            + (right
              ? ` ${ringer}'s number was the right one, and ${other} had to watch it be right.`
              : ` ${other}'s number was the right one, and ${ringer} rang ${slots.their} anyway.`),
          effects: [
            { kind: 'bond', players: [ringer, other], delta: right ? -0.3 : -0.7,
              source: `${ringer} and ${other} argued the tide count at the bell rope` },
            { kind: 'claim', claimant: other, about: ringer,
              text: right
                ? `${other} says ${ringer} would not be told, and happened to be right`
                : `${other} says ${ringer} overruled the correct count and lost a box`,
              source: `${ringer} and ${other} disagreed about the peal count out loud` },
          ],
          confessional: right ? null : {
            purpose: 'vote-change', speaker: other,
            text: confessionalVoice(other, {
              villainous: `I gave ${ringer} the number. ${ringer} rang a different one and we `
                + "watched two thousand hit the sand. That's going on the list — right at the top of it.",
              nice: `I gave ${ringer} the right number and they went another way with it. I'm not `
                + "out for blood, but you can't hand somebody the answer, watch them bin it, and feel nothing.",
              neutral: `I gave ${ringer} the number. ${ringer} rang a different one and we watched `
                + "two thousand hit the sand. I'm not forgetting who wouldn't be told.",
            }),
          },
        }));
      }
    }
  }

  // Same rule as the ledge, and the same reason: a miscounted peal drops a box
  // off the roof, and the phase has to feel that in the money and not only in
  // the tally. `teamBoxes` has already been decremented by a wrong count above.
  const quota = Math.max(1, Math.ceil(boxes / 2));
  const score = t => {
    const ringers = t.members.filter(n => contrib[n] > 0);
    const ring = ringers.length
      ? ringers.reduce((s, n) => s + contrib[n], 0) / ringers.length : 0;
    return 0.6 * ring + 0.4 * clamp01(teamBoxes[t.name] / quota) * 10;
  };
  return {
    phase: {
      id: 'bell', name: 'The Tide Bell',
      setting: 'The chapel tower, the bell rope, and a painted tide board with the height '
        + 'mark half under water.',
      stats: ['mental', 'intuition'],
      beats,
      teams: teams.map(t => ({ name: t.name, score: score(t) / 10, boxes: teamBoxes[t.name] })),
    },
    contrib, scenes,
  };
}

// ── the afternoon's own summary, by tier ─────────────────────────────
// Claims about the sandbar and never about anybody's motives, for the reason
// the archetypes' pools are: whether the room made anything of what it saw is
// decided later by people this file cannot see.
const SUMMARY = {
  triumph: [
    'Every box on the roof and both bells rung right, with the causeway going under behind the last pair off it.',
    'The chapel roof was stacked and the sand was empty. The crew had not seen it done and had to count twice.',
    'Two teams read the same board, got the same number, and put everything they carried where it had to go.',
  ],
  solid: [
    'Most of the boxes went up. One is in the channel and one is on the sand, and both will be discussed at dinner.',
    'A respectable stack on the roof, a wrong count on one bell, and everybody back across the road with their boots full.',
    'The tide got some of it. Not enough to be a disaster, and more than enough to be somebody\'s fault.',
  ],
  scraped: [
    'One box on the roof. One. Carried, passed and rung for by people who had stopped speaking to each other.',
    'The channel took more than the roof kept, and what the roof kept came up in the last four minutes.',
    'They spent the afternoon arguing about the count and salvaged almost nothing from the end of it.',
  ],
  failed: [
    'The road closed with the boxes still on the sand. Nothing went up and nothing was earned.',
    'Two teams stood on the wrong side of a channel watching the sea take the whole afternoon.',
    'Not one strongbox reached the roof. The crew rowed out afterwards to collect what was left.',
  ],
};

// ══════════════════════════════════════════════════════════════════════

export const drownedCauseway = {
  id: 'drowned-causeway',
  name: 'The Drowned Causeway',
  teams: TEAMS,
  // AGENTS.md: the description states the set-up, the mechanic, what goes
  // wrong and the win condition, in that order, and it is the only place the
  // viewer is told what the players are physically doing.
  desc: 'A ruined chapel sits on a sandbar four hundred yards out, and the causeway to it '
    + 'floods twice a day. Sealed strongboxes are laid out on the shingle, split between two '
    + 'teams; the teams carry them out across the wet sand and then pass them hand to hand '
    + 'along a foot-wide stone ledge above the tidal channel and up onto the chapel roof, '
    + 'because by then there is water across the chapel door. A box dropped into the channel '
    + 'is gone for good, a box dropped on the sand costs the time it takes to go back for it, '
    + 'and a peal rung on the wrong count opens the wrong hatch and drops a box that was '
    + 'already safe straight back down. Every strongbox still on the roof when the causeway '
    + 'closes is two thousand into the shared pot; everything on the sand is worth nothing.',

  /**
   * Four living players and a sea. Nothing else gates it — the boxes scale
   * with the room, so a late-game castle of five runs the same afternoon
   * smaller rather than not at all.
   */
  eligibility(ctx) {
    return Array.isArray(ctx?.living) && ctx.living.length >= 4;
  },

  simulate(ctx, rng) {
    const living = [...ctx.living];
    const boxes = boxesFor(living.length);
    const teams = splitTeams(living, rng, TEAMS);
    const ceremony = _ceremony(boxes);

    const wade = _wade(ctx, rng, teams);
    const ledge = _ledge(ctx, rng, teams, boxes);
    const bell = _bell(ctx, rng, teams, ledge.teamBoxes, boxes);

    // THE THREE PHASES ARE WEIGHTED EQUALLY, which is the scoring-balance rule
    // in AGENTS.md written out: if the wade were worth twice the bell then the
    // afternoon is a wade with two epilogues, and the cast member who is
    // useless on the sand never matters. A team's day swing is drawn ONCE and
    // applied to the mean, the same width the archetypes use, so a bespoke
    // afternoon and an archetype afternoon land on the same distribution.
    const phases = [wade.phase, ledge.phase, bell.phase];
    const perfOf = (tname) => {
      const parts = phases.map(p => p.teams.find(x => x.name === tname).score);
      return clamp01(parts.reduce((a, b) => a + b, 0) / parts.length
        + (rng() - 0.5) * PHASE_SWING);
    };
    const scored = teams.map(t => ({ name: t.name, members: [...t.members], perf: perfOf(t.name) }));

    const playerScores = {};
    for (const n of living) {
      playerScores[n] = Number(((wade.contrib[n] || 0) + (ledge.contrib[n] || 0)
        + (bell.contrib[n] || 0)).toFixed(3));
    }

    const quality = missionQuality(scored[0].perf, scored[1].perf);
    const pay = payPot(quality);
    const boxesUp = (ledge.teamBoxes[TEAMS[0]] || 0) + (ledge.teamBoxes[TEAMS[1]] || 0);

    const rec = {
      id: 'drowned-causeway', ep: ctx.ep, name: 'The Drowned Causeway',
      ceremony, briefing: briefingText(ceremony.hostBeats),
      teams: scored,
      phases,
      playerScores,
      placements: placementsFrom(playerScores),
      quality, tier: pay.tier,
      bestTeam: scored[0].perf >= scored[1].perf ? scored[0].name : scored[1].name,
      potBefore: pay.potBefore, gross: pay.gross, potEarned: pay.potEarned,
      potAfter: pay.potAfter, earned: pay.potEarned,
      shields: [],
      sideObjectives: [],
      scenes: [...wade.scenes, ...ledge.scenes, ...bell.scenes],
      summary: freshPick(rng, SUMMARY[pay.tier]),
      // The afternoon's own countable fact, for anything downstream that wants
      // to say what happened without re-deriving it from three phase records.
      tally: { boxesOut: boxes, boxesUp, perTeam: { ...ledge.teamBoxes } },
    };
    return validateMissionRecord(rec, ctx);
  },
};

export default drownedCauseway;
