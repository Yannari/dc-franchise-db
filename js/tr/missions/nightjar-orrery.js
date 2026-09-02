// ══════════════════════════════════════════════════════════════════════
// tr/missions/nightjar-orrery.js — The Nightjar Orrery
// ══════════════════════════════════════════════════════════════════════
//
// The estate's observatory dome at dusk. A brass orrery the size of a room, a
// dead astronomer's night-book, and a strongroom under the floor whose lock is
// the orrery itself: set the rings to the right night and the floor opens.
//
// WHY THIS AFTERNOON IS NOT THE CIPHER CRYPT WITH DIFFERENT NOUNS. The crypt
// archetype is one mental/strategic number and four tiers of prose. This is a
// CHAIN: the ledger produces the dates, the dates set the rings, and the rings
// decide whether the transit call is even askable. Phase two cannot beat a bad
// phase one, and phase three is scored against what phase two left standing —
// so the mission has an internal causality a viewer can follow, and a blame
// argument on the road home has somewhere specific to point ("we were two
// nights out before anybody touched a ring").
//
// AND IT IS A CHAIN THAT DOES NOT COLLAPSE. A team that reads the ledger badly
// is behind, not finished: the ring-setters can recover most of a bad date and
// the transit call is worth as much as either of the other two. Three phases
// weighted equally, a different stat pair on each — mental, then strategic and
// physical, then intuition and temperament — which is the scoring balance rule
// from AGENTS.md and the reason the observatory is not simply "the clever one
// wins".
//
// WHAT A TRAITOR CAN DO HERE. The rings are set in sequence and only the person
// at the ring can see the vernier. Reading a mark one graduation out is the
// commonest honest error in the phase AND the only sabotage available, and the
// record cannot tell them apart — it stores the misread and the graduation, and
// never why. The shift is to a probability that a steady hand still beats.
//
// NO SHIELD, NO RELIC, NO POWER. See the header of drowned-causeway.js.

import {
  briefingText, clamp01, freshPick, hostDo, hostSay, PHASE_SWING,
  missionQuality, missionScene, noisy, noisyPair, payPot, placementsFrom,
  pronounSlots, render, splitTeams, statOf, validateMissionRecord, weightedPick,
} from './contract.js';

const TEAMS = ['Meridian', 'Antares'];

/** How many rings there are to set. Scales with the room; never fewer than three. */
const ringsFor = n => Math.max(3, Math.min(6, Math.round(n / 3)));

// ══════════════════════════════════════════════════════════════════════
// THE BRIEFING
// ══════════════════════════════════════════════════════════════════════

function _ceremony(rings) {
  const hostBeats = [
    hostDo('The dome is dark except for a working lamp on the plinth. The host stands '
      + 'beside the orrery with a hand resting on the outermost brass ring.'),
    hostSay('The man who built this spent forty years watching one patch of sky and told '
      + 'nobody what he found. He left it in here, under the floor, behind a lock he '
      + 'made himself.'),
    hostDo('The host taps the floor twice with a heel. The sound is hollow.'),
    hostSay('The lock is the machine you are standing next to. Set it to the right night '
      + 'and the floor opens. Set it to the wrong one and it does nothing at all, '
      + 'which is worse, because it does not tell you which ring you got wrong.'),
    hostDo('A crew member sets a leather night-book on the reading desk and opens it.'),
    hostSay('His night-book is on that desk. It does not contain a date anywhere. It '
      + `contains observations, and you will turn them into ${rings} numbers — one for `
      + 'each ring — because that is what he did every evening of his life.'),
    hostSay('Then you set the rings, in order, from the outside in. Each ring has a '
      + 'vernier scale and one person can read it at a time. A ring set one graduation '
      + 'out will still turn, will still feel right, and will still be wrong, and '
      + 'every ring inside it is then wrong too.'),
    hostDo('The host walks to the meridian line inlaid in the floor and stands on it.'),
    hostSay('When the rings are set, the lamp throws the pointer\'s shadow across this '
      + 'line. One of you calls the moment it crosses. Early or late, you have missed '
      + 'the transit and the floor stays shut.'),
    hostSay('Each opened compartment down there is three thousand into the pot. Time is '
      + 'the only thing I am giving you and I am not giving you much of it.'),
    hostDo('The host steps off the line and puts the lamp on its lowest setting.'),
    hostSay('One last thing. He wrote in his own hand for himself, not for you, and he '
      + 'was not a tidy man. Whoever finishes with the floor open wins the room the '
      + 'money. Begin.'),
  ];
  return {
    ceremonyId: 'mission-brief-nightjar-orrery',
    staging: 'An unheated observatory dome at dusk. A brass orrery on a stone plinth with '
      + `${rings} concentric rings, a reading desk with an astronomer's night-book on it, `
      + 'and a meridian line inlaid across the floor.',
    hostBeats,
    contestantBeats: [],
    rulePoints: [
      { id: 'task', explainedByBeat: 5 },
      { id: 'sequence', explainedByBeat: 6 },
      { id: 'failure', explainedByBeat: 6 },
      { id: 'transit', explainedByBeat: 8 },
      { id: 'reward', explainedByBeat: 9 },
      { id: 'finish', explainedByBeat: 11 },
    ],
    revealBeats: hostBeats.length,
    reminder: 'The host reminds the room that the rings are set outside in, that a ring one '
      + 'graduation out spoils every ring inside it, and that the transit call must be '
      + 'made on the line.',
  };
}

// ══════════════════════════════════════════════════════════════════════
// PHASE 1 — THE NIGHT-BOOK. mental, and everybody reads.
// ══════════════════════════════════════════════════════════════════════
//
// Everybody works the ledger, and the team's reading is the MEAN rather than
// the best of them — the archetypes' rule (a team is only as good as its
// average), which is what stops one brilliant cast member carrying an
// afternoon that four other people are also in.
const LEDGER_SHARP = [
  '{who} noticed he dated everything from the evening rather than the midnight, which moved every entry by a day.',
  '{who} found the three nights he wrote nothing and worked out what he must have been doing instead.',
  '{who} got the hand almost immediately. The rest of the desk started passing pages to {them}.',
  '{who} read a smudge as a numeral and turned out to be right about it, which nobody else would have risked.',
];
const LEDGER_LOST = [
  '{who} spent most of the ledger on a single page and came away from it with nothing anybody could use.',
  'The handwriting beat {who}. {They} said so, which is more than one or two of the others managed.',
  '{who} was reading a column of temperatures under the impression they were dates.',
  '{who} kept finding patterns that turned out to be the same page twice.',
];
const LEDGER_SHARE = [
  '{who} had a reading and gave it to {other} to check rather than to the room to admire.',
  '{who} took {other} through the whole derivation twice, which cost time and bought agreement.',
  'When {other} was going in the wrong direction, {who} said so early, quietly, and was listened to.',
];
const LEDGER_HOARD = [
  '{who} had something and held onto it until it could be announced rather than used.',
  '{who} let {other} finish being wrong in front of everybody before producing the right reading.',
  '{who} worked alone at the far end of the desk and shared the answer at the point where it stopped being useful.',
];

function _ledger(ctx, rng, teams) {
  const beats = [];
  const scenes = [];
  const contrib = {};
  for (const t of teams) {
    for (const name of t.members) {
      const v = noisy(rng, name, 'mental');
      contrib[name] = clamp01(v / 10) * 10;
      const slots = pronounSlots(name);
      if (v >= 7.3) {
        beats.push({ team: t.name, player: name, kind: 'sharp', score: v,
          text: render(freshPick(rng, LEDGER_SHARP), slots) });
      } else if (v <= 3.7) {
        beats.push({ team: t.name, player: name, kind: 'lost', score: v,
          text: render(freshPick(rng, LEDGER_LOST), slots) });
      } else {
        beats.push({ team: t.name, player: name, kind: 'steady', score: v,
          text: `${name} worked through ${slots.their} share of the pages and produced a `
            + 'number that survived being checked.' });
      }
    }

    // One social beat per team, off the phase's own results: the best reader
    // either shares or does not. Weighted on social and loyalty, which is the
    // proportional form — no threshold, and a hoarder can be sharp or dim.
    if (t.members.length < 2) continue;
    const ranked = [...t.members].sort((a, b) => contrib[b] - contrib[a]);
    const best = ranked[0];
    const other = ranked[ranked.length - 1];
    const shares = rng() < clamp01(0.18 + 0.05 * statOf(best, 'social')
      + 0.04 * statOf(best, 'loyalty'));
    const slots = { ...pronounSlots(best), other };
    if (shares) {
      contrib[other] += 1.2;
      scenes.push(missionScene({
        id: `orrery-ledger-share-${t.name}`,
        eventId: 'orrery-reading-checked-together',
        phase: 'ledger',
        participants: [best, other],
        behaviour: 'heroic',
        text: render(freshPick(rng, LEDGER_SHARE), slots),
        effects: [
          { kind: 'bond', players: [best, other], delta: 0.5,
            source: `${best} took ${other} through the ledger derivation instead of announcing it` },
          { kind: 'crowd', name: best, colour: 'heroic', mult: 0.6,
            source: `${best} shared the reading at the desk` },
        ],
        confessional: {
          purpose: 'character', speaker: other,
          text: `${best} could've stood up and said it to the room. `
            + "Instead I got shown it, which isn't nothing when you've spent an hour being wrong.",
        },
      }));
    } else {
      contrib[best] += 0.6;
      scenes.push(missionScene({
        id: `orrery-ledger-hoard-${t.name}`,
        eventId: 'orrery-reading-held-back',
        phase: 'ledger',
        participants: [best, other],
        behaviour: 'selfish',
        text: render(freshPick(rng, LEDGER_HOARD), slots),
        effects: [
          { kind: 'bond', players: [best, other], delta: -0.4,
            source: `${best} let ${other} finish being wrong before producing the reading` },
          { kind: 'claim', claimant: other, about: best,
            text: `${other} says ${best} sat on a working reading for the applause`,
            source: `${best} produced the correct reading only after ${other} had finished` },
          { kind: 'crowd', name: best, colour: 'selfish', mult: 0.5,
            source: `${best} worked alone at the desk and shared late` },
        ],
        confessional: {
          purpose: 'hidden-intent', speaker: best,
          text: "If I hand it over the second I've got it, it's the team's answer. If I hold "
            + "it ninety seconds, it's mine. There's a version of this game where that matters.",
        },
      }));
    }
  }

  const score = t => t.members.reduce((s, n) => s + contrib[n], 0) / Math.max(1, t.members.length);
  return {
    phase: {
      id: 'ledger', name: 'The Night-Book',
      setting: 'A reading desk under one working lamp, with forty years of an astronomer\'s '
        + 'private handwriting on it.',
      stats: ['mental'],
      beats,
      teams: teams.map(t => ({ name: t.name, score: clamp01(score(t) / 10) })),
    },
    contrib, scenes,
  };
}

// ══════════════════════════════════════════════════════════════════════
// PHASE 2 — THE GEARING. strategic and physical, outside in, in sequence.
// ══════════════════════════════════════════════════════════════════════
//
// One person per ring. A ring set wrong spoils every ring inside it, so the
// phase has a real ORDER: the first setter's error is the expensive one, and
// the room can see that while it is happening, which is what makes the
// allocation an argument rather than a queue.
//
// THE PHASE IS SCORED AGAINST WHAT THE LEDGER LEFT. `carry` is the team's
// reading quality, and it moves every setter's odds — the chain the header
// describes, made of one multiplier rather than a special case.
const RING_TRUE = [
  '{who} set the ring, checked the vernier, and did not touch it again, which sounds easy and is not.',
  '{who} read the graduation from directly above it and refused to be hurried, and it went on true.',
  '{who} had the outermost ring on the number before the rest of the team had agreed there was one.',
  '{who} set it, stepped back, and let somebody else confirm it, which cost nine seconds and saved the phase.',
];
const RING_OUT = [
  '{who} read the vernier from the side and took the mark one graduation out. Everything inside it went with it.',
  '{who} set the ring in a hurry because somebody was counting down, and set it wrong.',
  'The brass was cold and {who}\'s hands were colder, and the ring stopped a hair past the mark.',
  '{who} was certain. {who} was one graduation out, and the rings inside had no way of knowing.',
];
const RING_CAUGHT = [
  '{other} came round behind {who} and read the same vernier, and the two numbers were not the same.',
  '{who} had already stepped away when {other} put a thumb on the ring and said, quietly, that it was not right.',
  '{other} asked {who} to say the number out loud. {who} said it. It was not the number on the brass.',
];
const RING_BLAME = [
  '{other} wanted to know who had set ring two, in a voice that had already decided.',
  'By the time the floor did not open, {other} had worked back through the order out loud and arrived at {who}.',
  '{other} said the outer ring had been wrong from the start and looked at {who} while saying it.',
];

function _gearing(ctx, rng, teams, ledgerScore, rings) {
  const beats = [];
  const scenes = [];
  const contrib = {};
  const teamRings = {};
  for (const t of teams) t.members.forEach(n => { contrib[n] = 0; });

  for (const t of teams) {
    const carry = ledgerScore[t.name];
    const setters = [];
    const pool = [...t.members];
    for (let i = 0; i < Math.min(rings, pool.length); i++) {
      const who = weightedPick(rng, pool,
        n => 0.5 + statOf(n, 'strategic') / 8 + statOf(n, 'physical') / 14);
      setters.push(who);
      pool.splice(pool.indexOf(who), 1);
    }
    let good = 0;
    let spoiledFrom = null;
    for (const [i, name] of setters.entries()) {
      const v = noisyPair(rng, name, 'strategic', 'physical');
      contrib[name] = clamp01(v / 10) * 10;
      const slots = pronounSlots(name);
      // Proportional in both the setter and the reading they were handed, and
      // nudged — never switched — for somebody with a reason to want it wrong.
      const nudge = ctx.conflicted(name) ? 0.10 : 0;
      const pTrue = clamp01(0.10 + 0.062 * v + 0.30 * carry - nudge);
      if (rng() < pTrue) {
        good += 1;
        beats.push({ team: t.name, ring: i + 1, player: name, kind: 'true', score: v,
          text: render(freshPick(rng, RING_TRUE), slots) });
      } else {
        if (spoiledFrom == null) spoiledFrom = i + 1;
        contrib[name] = Math.max(0, contrib[name] - 1.8);
        beats.push({ team: t.name, ring: i + 1, player: name, kind: 'out', score: v,
          text: render(freshPick(rng, RING_OUT), slots) });

        // Somebody may catch it. Intuition, proportional, and if it is caught
        // the ring is reset — which is the only thing in the phase that undoes
        // an error, and it costs the catcher's own ring some time.
        const watchers = t.members.filter(n => n !== name);
        if (watchers.length) {
          const eye = weightedPick(rng, watchers, n => 0.3 + statOf(n, 'intuition') / 7);
          if (rng() < clamp01(0.05 + 0.055 * statOf(eye, 'intuition'))) {
            good += 1;
            spoiledFrom = null;
            contrib[eye] += 1.6;
            scenes.push(missionScene({
              id: `orrery-ring-caught-${t.name}-${i}`,
              eventId: 'orrery-vernier-rechecked',
              phase: 'gearing',
              participants: [eye, name],
              behaviour: 'impressive',
              text: render(freshPick(rng, RING_CAUGHT), { ...pronounSlots(name), other: eye }),
              effects: [
                { kind: 'crowd', name: eye, colour: 'impressive', mult: 0.9,
                  source: `${eye} caught ring ${i + 1} one graduation out before it was locked` },
                { kind: 'reputation', player: eye, axis: 'sharpness', delta: 0.6,
                  source: `${eye} reread the vernier ${name} had already walked away from` },
                { kind: 'bond', players: [eye, name], delta: -0.2,
                  source: `${eye} corrected ${name} at the ring in front of the team` },
              ],
            }));
          }
        }
      }
    }
    teamRings[t.name] = good;

    // THE BLAME BEAT, and it is gated on the record rather than on a die: it
    // fires only when a ring actually went out, and it names the ring and the
    // setter the record carries. That is the mission-blame rule from the causal
    // contract at the smallest scale — no scene may say somebody failed a phase
    // they did not fail.
    if (spoiledFrom != null) {
      const culprit = setters[spoiledFrom - 1];
      const accusers = t.members.filter(n => n !== culprit);
      if (accusers.length) {
        const accuser = weightedPick(rng, accusers,
          n => 0.3 + statOf(n, 'boldness') / 8 + (10 - statOf(n, 'temperament')) / 14);
        scenes.push(missionScene({
          id: `orrery-ring-blame-${t.name}`,
          eventId: 'orrery-spoiled-ring-blamed',
          phase: 'gearing',
          participants: [accuser, culprit],
          behaviour: 'suspicious',
          text: render(freshPick(rng, RING_BLAME), { ...pronounSlots(culprit), other: accuser })
            + ` Ring ${spoiledFrom} was the one that went out, and ${culprit} set it.`,
          effects: [
            { kind: 'record', player: culprit, field: 'spoiledRing', value: spoiledFrom,
              source: `${culprit} set ring ${spoiledFrom} one graduation out` },
            { kind: 'suspicion', observer: accuser, subject: culprit, delta: 0.3,
              source: `ring ${spoiledFrom} was set wrong by ${culprit} and nothing inside it opened` },
            { kind: 'bond', players: [accuser, culprit], delta: -0.6,
              source: `${accuser} named ${culprit} for the spoiled ring in front of the team` },
          ],
          confessional: {
            purpose: 'belief-change', speaker: accuser,
            text: `Ring ${spoiledFrom}. That's not a hard job. You stand over it and you read `
              + `the number. I'd like to know why ${culprit} couldn't manage it.`,
          },
        }));
      }
    }
  }

  const score = t => {
    const setters = t.members.filter(n => contrib[n] > 0);
    if (!setters.length) return 0;
    return setters.reduce((s, n) => s + contrib[n], 0) / setters.length;
  };
  return {
    phase: {
      id: 'gearing', name: 'The Gearing',
      setting: 'The orrery itself: concentric brass rings on a stone plinth, each with a '
        + 'vernier scale only one person can read at a time.',
      stats: ['strategic', 'physical'],
      beats,
      rings: { ...teamRings },
      teams: teams.map(t => ({ name: t.name, score: clamp01(score(t) / 10),
        ringsTrue: teamRings[t.name], ringsTotal: Math.min(rings, t.members.length) })),
    },
    contrib, scenes, teamRings,
  };
}

// ══════════════════════════════════════════════════════════════════════
// PHASE 3 — THE TRANSIT. intuition and temperament, and one word.
// ══════════════════════════════════════════════════════════════════════
//
// One caller per team stands on the meridian line and says "now". Early or
// late and the floor stays shut. Scored against the gearing, because a shadow
// thrown by a wrongly-set pointer crosses the line at a time that means
// nothing — which is the chain closing.
const TRANSIT_ON = [
  '{who} called it on the line with the shadow still moving, and the floor came up under everybody\'s feet.',
  '{who} said one word at exactly the right moment and then looked as surprised as the rest of the room.',
  '{who} let three people tell {them} it was time, ignored all three, and called it two seconds later. Correctly.',
  '{who} watched the edge of the shadow rather than the middle of it, which is why {they} got it.',
];
const TRANSIT_EARLY = [
  '{who} called it early. The shadow arrived on the line about a second after the word did.',
  'The room was counting and {who} went with the room instead of the floor.',
  '{who} could not hold the last second and said it, and the floor did not move.',
  '{who} called the shadow the moment it looked close, which is not the same as being on the line.',
];
const TRANSIT_LATE = [
  '{who} waited to be certain, was certain, and was certain about eight seconds after the transit.',
  '{who} did not call it at all. Somebody else eventually did, and by then it was over.',
  'The shadow crossed and {who} was still checking. It does not come back.',
  '{who} wanted one more look, and the one more look cost the floor.',
];
const TRANSIT_STEADY = [
  '{who} stood on the line and did not move for four minutes while people talked at {them}.',
  '{who} held the room off the line so the caller could see, which was the second most useful thing anybody did.',
];

function _transit(ctx, rng, teams, gearRatio) {
  const beats = [];
  const scenes = [];
  const contrib = {};
  const opened = {};
  for (const t of teams) t.members.forEach(n => { contrib[n] = 0; });

  for (const t of teams) {
    const caller = weightedPick(rng, t.members,
      n => 0.4 + statOf(n, 'intuition') / 7 + statOf(n, 'temperament') / 14);
    const v = noisyPair(rng, caller, 'intuition', 'temperament');
    contrib[caller] = clamp01(v / 10) * 10;
    const slots = pronounSlots(caller);
    const pOn = clamp01(0.09 + 0.058 * v + 0.30 * gearRatio[t.name]);
    if (rng() < pOn) {
      opened[t.name] = true;
      beats.push({ team: t.name, player: caller, kind: 'on', score: v,
        text: render(freshPick(rng, TRANSIT_ON), slots) });
      contrib[caller] += 1.5;
      scenes.push(missionScene({
        id: `orrery-transit-on-${t.name}`,
        eventId: 'orrery-floor-opened',
        phase: 'transit',
        participants: [caller],
        behaviour: 'impressive',
        text: render(freshPick(rng, TRANSIT_ON), slots)
          + ` ${t.name}'s compartment is open, and the money in it is the room's.`,
        effects: [
          { kind: 'crowd', name: caller, colour: 'impressive', mult: 1.1,
            source: `${caller} called the transit on the line and opened the floor` },
          { kind: 'reputation', player: caller, axis: 'nerve', delta: 0.7,
            source: `${caller} held the call until the shadow was actually on the meridian` },
        ],
        confessional: {
          purpose: 'emotional-turn', speaker: caller,
          text: "Three people were shouting at me to say it. If you say it when they want you "
            + "to, you're just the person who said it. I wanted to be the one who was right.",
        },
      }));
    } else {
      opened[t.name] = false;
      const early = rng() < clamp01(0.35 + 0.05 * (10 - statOf(caller, 'temperament')));
      contrib[caller] = Math.max(0, contrib[caller] - 1.0);
      beats.push({ team: t.name, player: caller, kind: early ? 'early' : 'late', score: v,
        text: render(freshPick(rng, early ? TRANSIT_EARLY : TRANSIT_LATE), slots) });
      scenes.push(missionScene({
        id: `orrery-transit-missed-${t.name}`,
        eventId: 'orrery-transit-missed',
        phase: 'transit',
        participants: [caller],
        behaviour: early ? 'suspicious' : 'cowardly',
        text: render(freshPick(rng, early ? TRANSIT_EARLY : TRANSIT_LATE), slots)
          + ` ${t.name}'s floor stayed shut.`,
        effects: [
          { kind: 'record', player: caller, field: 'missedTransit', value: early ? 'early' : 'late',
            source: `${caller} called the transit ${early ? 'early' : 'late'} and the floor stayed shut` },
          { kind: 'crowd', name: caller, colour: early ? 'selfish' : 'cowardly', mult: 0.5,
            source: `${caller} missed the transit call on the meridian line` },
        ],
        confessional: early ? {
          purpose: 'audience-lie', speaker: caller,
          text: "I'll say the shadow was hard to see. The shadow was extremely easy to see. "
            + "I couldn't stand there being looked at for one more second.",
        } : null,
      }));
    }

    // Somebody holds the line clear. Small, warm, and it has a consequence.
    const others = t.members.filter(n => n !== caller);
    if (others.length) {
      const steady = weightedPick(rng, others, n => 0.3 + statOf(n, 'temperament') / 8);
      // SCORED, NOT GIVEN A TOKEN. The first calibration handed this player a
      // flat +1.0 on a 0..10 phase, and because the transit phase averages only
      // its contributors, one person on 1.0 beside a caller on 6 dragged the
      // whole phase to 0.40 — which pulled the mission's quality to 0.27 and
      // made `triumph` unreachable, so a quarter of the summary lines in this
      // file were dead content. Measured over 400 afternoons, before and after.
      // Holding a room off a meridian line is a temperament job; score it.
      contrib[steady] = clamp01(noisyPair(rng, steady, 'temperament', 'social') / 10) * 10;
      scenes.push(missionScene({
        id: `orrery-transit-steady-${t.name}`,
        eventId: 'orrery-line-held-clear',
        phase: 'transit',
        participants: [steady, caller],
        behaviour: 'heroic',
        text: render(freshPick(rng, TRANSIT_STEADY), { ...pronounSlots(steady), other: caller })
          + ` ${caller} was the one on the line.`,
        effects: [
          { kind: 'bond', players: [steady, caller], delta: 0.4,
            source: `${steady} kept the meridian line clear while ${caller} made the call` },
          { kind: 'crowd', name: steady, colour: 'heroic', mult: 0.4,
            source: `${steady} held the room back from the meridian line` },
        ],
      }));
    }
  }

  const score = t => {
    const active = t.members.filter(n => contrib[n] > 0);
    if (!active.length) return 0;
    return active.reduce((s, n) => s + contrib[n], 0) / active.length;
  };
  return {
    phase: {
      id: 'transit', name: 'The Transit',
      setting: 'A meridian line inlaid across the dome floor, a lamp on its lowest setting, '
        + 'and a brass pointer throwing a shadow that moves whether anybody is ready or not.',
      stats: ['intuition', 'temperament'],
      beats,
      teams: teams.map(t => ({ name: t.name, score: clamp01(score(t) / 10),
        opened: !!opened[t.name] })),
    },
    contrib, scenes, opened,
  };
}

const SUMMARY = {
  triumph: [
    'Both floors opened. Two teams read the same dead man\'s handwriting the same way and stood on the line at the same second.',
    'The dome gave up everything under it — every ring true, both transits called, and the astronomer\'s forty years on the plinth by dark.',
    'It came apart cleanly: the dates off the ledger, the rings off the dates, and the floor off a single word said at the right moment.',
  ],
  solid: [
    'One floor opened. The other team had the right night and the wrong ring, and will be told so.',
    'Most of the rings went on true. The transit is where it was decided, and it was decided by about a second.',
    'A slow, arguing, largely correct evening in a very cold room, settled one graduation short on one side.',
  ],
  scraped: [
    'One compartment, opened late, by a team that had stopped agreeing about the ledger an hour earlier.',
    'The rings were wrong from about the second one in, and what came out of the floor came out on the last call.',
    'They read the night-book into the ground and never got the machine to admit it.',
  ],
  failed: [
    'Both floors stayed shut. Two teams, one night-book, and a brass machine that gave nothing away.',
    'Nothing opened. The rings were set with conviction and set wrong, and the shadow crossed the line twice with nobody on it.',
    'The dome kept it. Whatever he found up there, he still has it.',
  ],
};

// ══════════════════════════════════════════════════════════════════════

export const nightjarOrrery = {
  id: 'nightjar-orrery',
  name: 'The Nightjar Orrery',
  teams: TEAMS,
  desc: 'The estate observatory holds a room-sized brass orrery on a stone plinth, and the '
    + 'strongroom under its floor is locked by the machine itself. Each team works the dead '
    + 'astronomer\'s night-book at the reading desk to turn forty years of undated '
    + 'observations into one number per ring, then sets the rings by hand from the outside '
    + 'in, one person to a ring, reading a vernier scale only that person can see; when the '
    + 'rings are set, the lamp throws the pointer\'s shadow toward the meridian line inlaid '
    + 'in the floor and one player calls the moment it crosses. A ring left a single '
    + 'graduation out still turns and still feels right, and it silently spoils every ring '
    + 'inside it; a transit called early or late leaves the floor shut with no second '
    + 'attempt. Every compartment opened under the floor is three thousand into the shared '
    + 'pot, and a team that never opens one earns nothing at all.',

  eligibility(ctx) {
    return Array.isArray(ctx?.living) && ctx.living.length >= 4;
  },

  simulate(ctx, rng) {
    const living = [...ctx.living];
    const rings = ringsFor(living.length);
    const teams = splitTeams(living, rng, TEAMS);
    const ceremony = _ceremony(rings);

    const ledger = _ledger(ctx, rng, teams);
    const ledgerScore = Object.fromEntries(ledger.phase.teams.map(t => [t.name, t.score]));
    const gearing = _gearing(ctx, rng, teams, ledgerScore, rings);
    const gearRatio = Object.fromEntries(gearing.phase.teams.map(t =>
      [t.name, t.ringsTotal ? t.ringsTrue / t.ringsTotal : 0]));
    const transit = _transit(ctx, rng, teams, gearRatio);

    const phases = [ledger.phase, gearing.phase, transit.phase];
    const perfOf = (tname) => {
      const parts = phases.map(p => p.teams.find(x => x.name === tname).score);
      return clamp01(parts.reduce((a, b) => a + b, 0) / parts.length + (rng() - 0.5) * PHASE_SWING);
    };
    const scored = teams.map(t => ({ name: t.name, members: [...t.members], perf: perfOf(t.name) }));

    const playerScores = {};
    for (const n of living) {
      playerScores[n] = Number(((ledger.contrib[n] || 0) + (gearing.contrib[n] || 0)
        + (transit.contrib[n] || 0)).toFixed(3));
    }

    const quality = missionQuality(scored[0].perf, scored[1].perf);
    const pay = payPot(quality);

    const rec = {
      id: 'nightjar-orrery', ep: ctx.ep, name: 'The Nightjar Orrery',
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
      scenes: [...ledger.scenes, ...gearing.scenes, ...transit.scenes],
      summary: freshPick(rng, SUMMARY[pay.tier]),
      tally: { rings, ringsTrue: { ...gearing.teamRings }, opened: { ...transit.opened } },
    };
    return validateMissionRecord(rec, ctx);
  },
};

export default nightjarOrrery;
