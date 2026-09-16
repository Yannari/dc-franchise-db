// ══════════════════════════════════════════════════════════════════════
// tr/missions/buried-alive.js — Buried Alive
// ══════════════════════════════════════════════════════════════════════
//
// The franchise's trademark afternoon (thetraitors.fandom.com/wiki/Buried_Alive:
// UK S1, Canada S1, France S2, Greece S1, Portugal S1). Three teams. Two of each
// team are nailed into coffins and lowered into a churchyard; the rest dig clue
// plots to find out which plot their own people are under, inside forty-five
// minutes. Approved mockup: mockup/mockup-tr-buried-alive.html.
//
// THREE TEAMS, NOT TWO, because that is the mission. The contract takes two to
// four and `missionQualityOf` blends the best and the worst of them exactly as
// the two-team blend does, so the pot band cannot tell.
//
// THE CLOCK IS THE CURRENCY. Every phase spends minutes out of the same
// forty-five: reading the clue, digging the wrong plot, digging the right one,
// a dropped lift, and somebody underground asking for more time. A coffin that
// is not on the grass when the bell goes earns nothing, and the lift phase is
// scored on how many came up, so a slow afternoon costs money through the same
// arithmetic every other mission pays through.
//
// THE SHIELD IS INSIDE THE COFFINS (when this afternoon offers one — see
// `missionShieldOffered`). Each lid has a sealed riddle under it. A buried
// player who works theirs out may answer their team's knock with "not yet" and
// finish it, and the minutes that costs are their team's. It is the Ash Vault's
// rule — somebody pays for the Shield out of the pot — reached through a
// different door: nobody leaves the team, the team waits for them.
//
// WHAT A TRAITOR CAN DO. Call the wrong plot. It is the commonest honest mistake
// on the afternoon (the clue is a riddle and the ground all looks the same) and
// it costs minutes, never a person. Nudge, never switch.

import {
  briefingText, clamp01, confessionalVoice, freshPick, hostDo, hostSay, PHASE_SWING,
  missionQualityOf, missionScene, missionShieldOffered, noisyPair, payPot, placementsFrom,
  pronounSlots, render, shuffled, statOf, validateMissionRecord, weightedPick, runSideObjectives,
} from './contract.js';
import { awardShield } from '../powers.js';

const TEAMS = ['Yew', 'Rook', 'Lych'];
const CLOCK = 45;

/** Beats reordered one team at a time: A1 B1 C1 A2 B2 C2 ... */
function _interleave(beats) {
  const by = {};
  for (const b of beats) (by[b.team] = by[b.team] || []).push(b);
  const lists = Object.values(by);
  const out = [];
  for (let i = 0; out.length < beats.length; i++) {
    for (const l of lists) if (l[i]) out.push(l[i]);
  }
  return out;
}

/** Round-robin three teams out of a shuffled room, so sizes differ by one at most. */
function _threeTeams(living, rng) {
  const order = shuffled(living, rng);
  const teams = TEAMS.map(name => ({ name, members: [] }));
  order.forEach((n, i) => teams[i % 3].members.push(n));
  return teams;
}

/**
 * Who goes in the ground. Two a team when the team can spare them and still
 * dig, one otherwise. Weighted toward temperament — the show asks for calm
 * volunteers — with a floor so anybody can be picked. One draw per coffin.
 */
function _bury(teams, rng) {
  for (const t of teams) {
    // A team of one digs and nobody is buried; the plot map simply has no coffin for it.
    const want = t.members.length >= 4 ? 2 : t.members.length >= 2 ? 1 : 0;
    const pool = [...t.members];
    t.buried = [];
    for (let i = 0; i < want; i++) {
      const who = weightedPick(rng, pool, n => 0.4 + statOf(n, 'temperament') / 10);
      t.buried.push(who);
      pool.splice(pool.indexOf(who), 1);
    }
    t.diggers = pool;
  }
}

/** The churchyard: one plot per coffin plus a clue plot per team, in a shuffled row. */
function _plotMap(teams, rng) {
  const plots = [];
  for (const t of teams) {
    plots.push({ kind: 'clue', team: t.name, who: null });
    for (const b of t.buried) plots.push({ kind: 'coffin', team: t.name, who: b });
  }
  return shuffled(plots, rng).map((p, i) => ({ ...p, n: i + 1 }));
}

// ══════════════════════════════════════════════════════════════════════
// THE BRIEFING
// ══════════════════════════════════════════════════════════════════════
function _ceremony(plots, coffins, shield) {
  const beats = [
    hostDo('The host waits at the lych gate with one hand on the bell rope while the players '
      + `file in past ${coffins} open coffins.`),
    hostSay('Three teams. Some of each team are going into these coffins, and the coffins are '
      + 'going into the ground.'),
    hostSay(`There are ${plots} plots behind me and only ${coffins} of them have anybody in. The `
      + 'other three hold a clue each, one for every team, and the clue tells you which plot '
      + 'your own people are under. Dig the wrong plot and you have spent the time it took to '
      + 'dig it.'),
    hostDo('The host lifts a spade off the pile and plants it in the turf.'),
    hostSay('When your spade hits a lid, knock twice. If the person inside knocks back, get the '
      + 'ropes on and bring them up. You lift together, or you drop them, and a dropped coffin '
      + 'goes back to the bottom of the hole.'),
  ];
  const shieldBeats = shield ? [
    hostDo('The host turns one of the empty lids over. A sealed envelope is nailed to the '
      + 'underside.'),
    hostSay('Every lid has one of these. Inside is a riddle, and a lamp to read it by. Whoever '
      + 'solves theirs first has won a Shield.'),
    hostSay('Here is the catch. When your team knocks, you can knock back, or you can tell them '
      + '"not yet." Every minute you stay down is a minute your team is not digging for '
      + 'somebody else.'),
  ] : [];
  const close = [
    hostSay('Every one of you standing on the grass when this bell rings earns money for the '
      + `pot. Anybody still underground earns nothing. ${CLOCK} minutes. Dig.`),
    hostDo('The host rings the bell once.'),
  ];
  const hostBeats = [...beats, ...shieldBeats, ...close];
  const at = s => hostBeats.findIndex(b => b.kind === 'say' && b.text.startsWith(s));
  const rulePoints = [
    { id: 'task', explainedByBeat: at('Three teams') },
    { id: 'clues', explainedByBeat: at('There are') },
    { id: 'failure', explainedByBeat: at('There are') },
    { id: 'lift', explainedByBeat: at('When your spade') },
    ...(shield ? [
      { id: 'shield', explainedByBeat: at('Every lid') },
      { id: 'cost', explainedByBeat: at('Here is the catch') },
    ] : []),
    { id: 'reward', explainedByBeat: at('Every one of you') },
    { id: 'finish', explainedByBeat: at('Every one of you') },
  ];
  return {
    ceremonyId: 'mission-brief-buried-alive',
    staging: `A churchyard at dusk. ${plots} freshly turned plots behind the lych gate, `
      + `${coffins} coffins on trestles beside them, a pile of spades, and a bell hanging in `
      + 'the gate.',
    hostBeats,
    contestantBeats: [],
    rulePoints,
    revealBeats: hostBeats.length,
    reminder: 'The host reminds the room that the clue plot comes first, that a wrong plot '
      + 'costs its minutes, that a dropped coffin goes back down'
      + (shield ? ', and that a player who stays under to finish the riddle costs their team time' : '')
      + '.',
  };
}

// ══════════════════════════════════════════════════════════════════════
// PHASE 1 — THE CLUE PLOTS. physical and mental.
// ══════════════════════════════════════════════════════════════════════
const DIG_GOOD = [
  '{who} dug the clue plot out in the time it took the next team to agree where to start.',
  '{who} read the clue once, out loud, and pointed at the right mound before anybody asked.',
  '{who} worked out that the clue plots were the ones with no flowers on them, and was right.',
  '{who} put the spade in where the turf was loosest and hit the tin box on the third stroke.',
];
const DIG_BAD = [
  '{who} dug hard and fast in the wrong corner of the churchyard.',
  '{who} could not make the riddle mean anything and said so, twice.',
  '{who} was still arguing about the first line of the clue when the second team had finished it.',
  '{who} lost the spade in the clay and spent a minute getting it back.',
];
const WRONG_PLOT = [
  '{who} called plot {plot} before anybody had read the ground. {team} dug four feet of clay down to a lid with the wrong colour on it: {other}\'s. {mins} minutes gone.',
  '{who} was certain it was plot {plot}. It was a coffin, and it was {other}\'s. {team} filled the hole back in with {mins} minutes fewer than they had.',
  '{team} dug plot {plot} on {who}\'s say-so and found {other}\'s coffin at the bottom of it. {mins} minutes, spent on somebody else\'s afternoon.',
];
const WRONG_PLOT_EMPTY = [
  '{who} called plot {plot}. {team} dug it out and found {other}\'s clue box, already read. {mins} minutes gone.',
  '{team} dug plot {plot} on {who}\'s word. It was a clue plot, and not theirs. {mins} minutes.',
];

function _cluePlots(ctx, rng, teams, plots) {
  const beats = [];
  const scenes = [];
  const contrib = {};
  const minutes = {};
  const wrong = {};
  for (const t of teams) {
    minutes[t.name] = 0;
    wrong[t.name] = 0;
    let sum = 0;
    for (const name of t.diggers) {
      const v = noisyPair(rng, name, 'physical', 'mental');
      contrib[name] = clamp01(v / 10) * 10;
      sum += v;
      const slots = pronounSlots(name);
      const good = v >= 5.6;
      beats.push({ team: t.name, player: name, kind: good ? 'good' : 'bad', score: v,
        text: render(freshPick(rng, good ? DIG_GOOD : DIG_BAD), slots) });
    }
    const mean = sum / Math.max(1, t.diggers.length);
    // Reading the clue and digging the tin box: 5 to 13 minutes.
    minutes[t.name] += Math.round(8 + (10 - mean) * 1.1);

    // WHO CALLS THE PLOT, and whether they get it wrong. One draw for the
    // caller, one for the call. A conflicted caller tilts the call, never
    // decides it.
    const caller = weightedPick(rng, t.diggers, n => 0.3 + statOf(n, 'boldness') / 8);
    const nudge = ctx.conflicted(caller) ? 0.15 : 0;
    const pWrong = clamp01(0.5 - 0.045 * statOf(caller, 'mental') - 0.02 * statOf(caller, 'intuition') + nudge);
    // A SECOND WRONG CALL is possible, at a fraction of the first: a team that
    // has already dug one wrong plot is rattled, not wiser. It is what lets an
    // afternoon go properly wrong rather than merely slow.
    // Both rolls are always drawn, so a team's stream does not depend on
    // whether its first call was right.
    const firstRoll = rng(), secondRoll = rng();
    const wrongCalls = firstRoll < pWrong ? (secondRoll < pWrong * 0.6 ? 2 : 1) : 0;
    if (wrongCalls) {
      const mins = 6 * wrongCalls + Math.floor(rng() * 6);
      wrong[t.name] += wrongCalls - 1;
      minutes[t.name] += mins;
      wrong[t.name] += 1;
      contrib[caller] = Math.max(0, (contrib[caller] || 0) - 1.8);
      const others = plots.filter(p => p.team !== t.name);
      const plot = others[Math.min(others.length - 1, Math.floor(rng() * others.length))];
      const other = plot ? plot.team : TEAMS.find(x => x !== t.name);
      const pool = plot && plot.kind === 'coffin' ? WRONG_PLOT : WRONG_PLOT_EMPTY;
      const text = render(freshPick(rng, pool),
        { ...pronounSlots(caller), plot: plot ? plot.n : '?', team: t.name, other, mins });
      if (plot && plot.kind === 'coffin') plot.dugBy = t.name;
      // The teammate who had it right, if any: the sharpest reader who is not
      // the caller. Without one the mistake is nobody's story but the caller's.
      const readers = t.diggers.filter(n => n !== caller);
      const sharp = readers.length
        ? [...readers].sort((a, b) => statOf(b, 'mental') - statOf(a, 'mental'))[0] : null;
      if (sharp && statOf(sharp, 'mental') > statOf(caller, 'mental')) {
        scenes.push(missionScene({
          id: `buried-wrong-plot-${t.name}`,
          eventId: 'buried-wrong-plot-called',
          phase: 'clues',
          participants: [sharp, caller],
          behaviour: 'suspicious',
          text: `${text} ${sharp} had the clue in hand saying otherwise and did not say `
            + 'anything until the hole was dug.',
          effects: [
            { kind: 'record', player: caller, field: 'calledTheWrongPlot', value: true,
              source: `${caller} called the wrong plot and ${t.name} dug it` },
            { kind: 'claim', claimant: sharp, about: caller,
              text: `${sharp} says ${caller} ignored the clue and sent ${t.name} to the wrong plot`,
              source: `${caller} called plot ${plot ? plot.n : '?'} against the clue ${sharp} was holding` },
            { kind: 'suspicion', observer: sharp, subject: caller, delta: 0.24,
              source: `${caller} insisted on the wrong plot with the clue in the team's hands` },
            { kind: 'bond', players: [sharp, caller], delta: -0.5,
              source: `${sharp} watched ${caller} send the team to the wrong plot` },
          ],
          confessional: {
            purpose: 'belief-change', speaker: sharp,
            text: confessionalVoice(sharp, {
              neutral: `The clue said where the ${t.name.toLowerCase()} was. It wasn't where `
                + `${caller} said. I'm not accusing anybody. I'm just telling you what the clue said.`,
              villainous: `${caller} sent us the wrong way with the answer in my hand. Honest `
                + "mistake or not, it's a story, and I know how to tell it.",
              nice: `I should have said something sooner. But ${caller} was so sure, and it cost `
                + "us, and I keep wondering why anyone would be that sure.",
            }),
          },
        }));
      } else {
        scenes.push(missionScene({
          id: `buried-wrong-plot-${t.name}`,
          eventId: 'buried-wrong-plot-called',
          phase: 'clues',
          participants: [caller],
          behaviour: 'suspicious',
          text,
          effects: [
            { kind: 'record', player: caller, field: 'calledTheWrongPlot', value: true,
              source: `${caller} called the wrong plot and ${t.name} dug it` },
            { kind: 'suspicion', subject: caller, delta: 0.14,
              source: `${caller} sent ${t.name} to the wrong plot` },
          ],
        }));
      }
    }
  }
  const score = t => t.diggers.reduce((s, n) => s + (contrib[n] || 0), 0) / Math.max(1, t.diggers.length);
  return {
    phase: {
      id: 'clues',
      // Interleaved by team, so the screen's first few cards are not one team's.
      beats: _interleave(beats), name: 'The Clue Plots',
      setting: 'Mounds of wet earth, three teams with spades, and no way to tell a clue plot '
        + 'from a grave by looking.',
      stats: ['physical', 'mental'],
      // A wrong plot is the phase's own failure, so it is paid for here too.
      teams: teams.map(t => ({ name: t.name,
        score: clamp01(score(t) / 10 - 0.12 * wrong[t.name]),
        minutes: minutes[t.name], wrong: wrong[t.name] })),
    },
    contrib, scenes, minutes, wrong,
  };
}

// ══════════════════════════════════════════════════════════════════════
// PHASE 2 — UNDER THE LIDS. endurance and temperament, in the dark.
// ══════════════════════════════════════════════════════════════════════
const LID_STEADY = [
  '{who} lay still, counted {their} breathing, and did not touch the envelope.',
  '{who} spent the wait with {their} eyes shut and {their} hands flat on the wood.',
  '{who} talked to {self} the whole time, quietly and in full sentences, and was fine.',
  '{who} found the lamp, turned it down to save it, and waited.',
];
const LID_PANIC = [
  '{who} hammered on the lid ten minutes in, before anybody from {team} was anywhere near.',
  '{who} could hear spades that were not {their} team\'s and shouted at every one of them.',
  '{who} lasted about a quarter of an hour before the box started to feel smaller.',
];
const STAYED = [
  '{who} had the riddle open by lamplight before {team} reached the plot. When the spades knocked, {they} knocked once, not twice, and shouted "a few more minutes" through the wood.',
  'The knock came and {who} did not answer it. {They} had the envelope open and the answer nearly out.',
  '{who} heard {team} hit the lid and told them, through four feet of earth, to wait.',
];
const SOLVED = [
  '{who} wrote the answer on the back of the card and slid it through the gap in the lid. It was right.',
  '{who} got it in the end, said it out loud to nobody, and knocked twice.',
  'The riddle gave. {who} pushed the answer through the gap and came up holding a Shield.',
];
const UNSOLVED = [
  '{who} made {team} wait, and did not get it. The answer through the gap was wrong.',
  '{who} stayed under for the riddle, gave up on it, and knocked twice with nothing to show.',
];

function _underTheLids(ctx, rng, teams, minutes, shieldOn) {
  const beats = [];
  const scenes = [];
  const contrib = {};
  let stayer = null;
  let solved = false;
  let delay = 0;
  for (const t of teams) {
    for (const name of t.buried) {
      const v = noisyPair(rng, name, 'endurance', 'temperament');
      contrib[name] = clamp01(v / 10) * 10;
      const slots = { ...pronounSlots(name), team: t.name };
      if (v <= 3.4) {
        beats.push({ team: t.name, player: name, kind: 'bad', score: v,
          text: render(freshPick(rng, LID_PANIC), slots) });
        scenes.push(missionScene({
          id: `buried-panic-${name}`,
          eventId: 'buried-panicked-under-the-lid',
          phase: 'coffins',
          participants: [name],
          behaviour: 'cowardly',
          text: render(freshPick(rng, LID_PANIC), slots) + ' Nobody could hear it yet.',
          effects: [
            { kind: 'crowd', name, colour: 'cowardly', mult: 0.5,
              source: `${name} panicked in the coffin before ${t.name} was near` },
          ],
          confessional: {
            purpose: 'emotional-turn', speaker: name,
            text: confessionalVoice(name, {
              nice: "You think you'll be fine because it's television. Then the lid goes on "
                + 'and the television part stops.',
              villainous: "I'll say this once: I don't like boxes. Nobody in that house hears "
                + 'about it, and neither do you.',
              neutral: "I thought I'd be fine. I wasn't. It's a box in the ground, what did you "
                + 'expect.',
            }),
          },
        }));
      } else {
        beats.push({ team: t.name, player: name, kind: 'steady', score: v,
          text: render(freshPick(rng, LID_STEADY), slots) });
      }
    }
  }

  // THE RIDDLE. Offered to every coffin; one person, at most, stays for it.
  // One draw for who, one for whether they stay, one for whether they solve it.
  if (shieldOn) {
    const all = teams.flatMap(t => t.buried.map(n => ({ n, t })));
    const pick = weightedPick(rng, all,
      x => 0.25 + (statOf(x.n, 'mental') + statOf(x.n, 'intuition')) / 20);
    if (pick) {
      const n = pick.n;
      const stays = rng() < clamp01(0.3 + 0.07 * statOf(n, 'boldness') - 0.03 * statOf(n, 'loyalty'));
      if (stays) {
        stayer = { name: n, team: pick.t.name };
        solved = rng() < clamp01(0.2 + 0.05 * statOf(n, 'mental') + 0.02 * statOf(n, 'intuition'));
        delay = 4 + Math.floor(rng() * 4);
        minutes[pick.t.name] += delay;
        const slots = { ...pronounSlots(n), team: pick.t.name };
        scenes.push(missionScene({
          id: 'buried-not-yet',
          eventId: 'buried-asked-for-more-time',
          phase: 'coffins',
          participants: [n],
          behaviour: 'selfish',
          text: render(freshPick(rng, STAYED), slots) + ' '
            + render(freshPick(rng, solved ? SOLVED : UNSOLVED), slots),
          effects: [
            { kind: 'record', player: n, field: 'askedForMoreTime', value: delay,
              source: `${n} told ${pick.t.name} to wait while ${pronounSlots(n).they} finished the riddle` },
            { kind: 'crowd', name: n, colour: 'selfish', mult: 0.8,
              source: `${n} kept ${pick.t.name} waiting at the graveside for a riddle` },
          ],
          confessional: {
            purpose: 'hidden-intent', speaker: n,
            text: solved
              ? confessionalVoice(n, {
                  villainous: "Five minutes of my own team's patience for a week nobody can "
                    + "touch me. I'd sell them a lot cheaper than that.",
                  nice: "I'll carry every plank on the next mission. That's the deal I've made "
                    + "with myself for being safe tonight.",
                  neutral: "Would I do it again? Honestly, yes. I'd just lie about the cramp better.",
                })
              : confessionalVoice(n, {
                  neutral: "I made them wait and I didn't even get it. That's the worst of both.",
                  villainous: "Didn't get it. Doesn't matter. Nobody up there knows whether I did.",
                  nice: 'I held my own team up for nothing. I have to fix that tonight.',
                }),
          },
        }));
      }
    }
  }

  const score = t => t.buried.reduce((s, n) => s + (contrib[n] || 0), 0) / Math.max(1, t.buried.length);
  return {
    phase: {
      id: 'coffins', name: 'Under the Lids',
      setting: 'Coffins four feet down, a lamp in each, the sound of spades somewhere above'
        + (shieldOn ? ', and an envelope nailed to the underside of every lid.' : '.'),
      stats: ['endurance', 'temperament'],
      beats: _interleave(beats),
      stayer: stayer ? stayer.name : null,
      // Lying still is the easiest phase to be average at, so it counts for less.
      teams: teams.map(t => ({ name: t.name, score: clamp01(0.8 * score(t) / 10) })),
    },
    contrib, scenes, stayer, solved, delay,
  };
}

// ══════════════════════════════════════════════════════════════════════
// PHASE 3 — THE LIFT. physical and loyalty, against the clock.
// ══════════════════════════════════════════════════════════════════════
const LID_OFF = [
  '{who} got the lid off first and {buried} came up blinking into the lamps, holding on to {who} for rather longer than necessary.',
  '{buried} knocked back twice, {who} pulled the last nail, and {team} had its first face out of the ground.',
  '{who} was the first thing {buried} saw, and {buried} said so, loudly, to everybody.',
];
const LIFT_CLEAN = [
  '{team} brought {buried} up level the whole way, with {who} counting every pull out loud.',
  '{who} took the heavy end and {team} had {buried} on the grass without a wobble.',
  '{team} lifted {buried} clean, and {who} was the reason it was clean.',
];
const LIFT_SAVE = [
  'The clay went under {other}\'s side and {who} took the whole rope alone for three seconds, which was enough.',
  '{other} slipped. {who} did not let go, and {buried} came up anyway.',
];
const LIFT_DROP = [
  '{team} got {buried} halfway before {who}\'s end slipped. The coffin went back down.',
  '{who} let the rope run. {buried} went back to the bottom of the hole and {team} started the lift again.',
];

function _lift(ctx, rng, teams, minutes, plots, stayer) {
  const beats = [];
  const scenes = [];
  const contrib = {};
  const rescued = {};
  const left = {};
  const order = [];            // the order coffins reach the grass, for the sidebar
  const told = { save: false, drop: false };
  for (const t of teams) {
    rescued[t.name] = 0;
    left[t.name] = [];
    const pl = t.diggers.map(n => noisyPair(rng, n, 'physical', 'loyalty'));
    t.diggers.forEach((n, i) => { contrib[n] = clamp01(pl[i] / 10) * 10; });
    const mean = pl.reduce((a, b) => a + b, 0) / Math.max(1, pl.length);
    for (const b of t.buried) {
      // DIGGING THIS COFFIN OUT. Faster if another team already dug the plot.
      const plot = plots.find(p => p.who === b);
      const dug = plot && plot.dugBy && plot.dugBy !== t.name;
      minutes[t.name] += dug ? 4 : Math.round(6 + (10 - mean) * 0.9 + rng() * 4);
      if (minutes[t.name] > CLOCK) { left[t.name].push(b); continue; }
      const lifter = weightedPick(rng, t.diggers, n => 0.3 + statOf(n, 'loyalty') / 8);
      const clean = rng() < clamp01(0.3 + 0.07 * mean);
      if (!clean) {
        // A slip. Somebody else saves it, or it goes back down and costs time.
        const others = t.diggers.filter(n => n !== lifter);
        const saver = others.length
          ? weightedPick(rng, others, n => 0.3 + statOf(n, 'physical') / 8) : null;
        const saved = !!saver && rng() < clamp01(0.15 + 0.05 * statOf(saver, 'loyalty'));
        // ONE RESCUE ON THE ROPES AND ONE DROP MAKE A STORY; FOUR MAKE A LIST.
        // Later ones still happen and still count, as plain beats.
        if (saved && told.save) {
          contrib[saver] += 1.2;
          beats.push({ team: t.name, player: saver, kind: 'good', score: mean,
            text: `${saver} caught the rope when ${lifter}'s side slipped, and ${b} came up anyway.` });
        } else if (saved) {
          told.save = true;
          contrib[saver] += 1.2;
          scenes.push(missionScene({
            id: `buried-lift-save-${b}`,
            eventId: 'buried-rope-held-alone',
            phase: 'lift',
            participants: [saver, lifter],
            behaviour: 'heroic',
            text: render(freshPick(rng, LIFT_SAVE), { ...pronounSlots(saver), other: lifter, buried: b }),
            effects: [
              { kind: 'bond', players: [saver, lifter], delta: 0.8,
                source: `${saver} held the rope alone when ${lifter}'s side gave` },
              { kind: 'bond', players: [saver, b], delta: 0.5,
                source: `${saver} kept ${b}'s coffin from going back down` },
              { kind: 'crowd', name: saver, colour: 'heroic', mult: 1.1,
                source: `${saver} took the whole rope when the clay gave way` },
            ],
            confessional: {
              purpose: 'character', speaker: saver,
              text: confessionalVoice(saver, {
                nice: "I heard it go and I just didn't let go. That's it. That's the whole story.",
                villainous: 'Everybody saw me hold that rope. That picture is worth more than the '
                  + 'money.',
                neutral: "The clay went and somebody had to hold it. It was me. Next question.",
              }),
            },
          }));
        } else if (told.drop) {
          minutes[t.name] += 5;
          contrib[lifter] = Math.max(0, contrib[lifter] - 1.5);
          beats.push({ team: t.name, player: lifter, kind: 'bad', score: mean,
            text: `${lifter}'s end slipped and ${b} went back down. ${t.name} lifted again.` });
          if (minutes[t.name] > CLOCK) { left[t.name].push(b); continue; }
        } else {
          told.drop = true;
          minutes[t.name] += 5;
          contrib[lifter] = Math.max(0, contrib[lifter] - 1.5);
          scenes.push(missionScene({
            id: `buried-lift-drop-${b}`,
            eventId: 'buried-coffin-dropped',
            phase: 'lift',
            participants: [lifter, b],
            behaviour: 'suspicious',
            text: render(freshPick(rng, LIFT_DROP), { ...pronounSlots(lifter), team: t.name, buried: b }),
            effects: [
              { kind: 'record', player: lifter, field: 'droppedTheRope', value: true,
                source: `${lifter}'s end slipped and ${b}'s coffin went back down` },
              { kind: 'bond', players: [lifter, b], delta: -0.6,
                source: `${lifter} dropped ${b} back into the hole` },
            ],
          }));
          if (minutes[t.name] > CLOCK) { left[t.name].push(b); continue; }
        }
      }
      rescued[t.name] += 1;
      order.push({ who: b, team: t.name, at: Math.min(CLOCK, minutes[t.name]) });
      // THE LID COMES OFF. The team's first face out of the ground, and the
      // digger who opened it: the warmest moment the afternoon has.
      if (rescued[t.name] === 1 && t.diggers.length) {
        const opener = weightedPick(rng, t.diggers, n => 0.3 + statOf(n, 'social') / 8);
        scenes.push(missionScene({
          id: `buried-lid-off-${t.name}`,
          eventId: 'buried-first-face-out',
          phase: 'lift',
          participants: [opener, b],
          behaviour: 'heroic',
          text: render(freshPick(rng, LID_OFF), { ...pronounSlots(opener), buried: b, team: t.name }),
          effects: [
            { kind: 'bond', players: [opener, b], delta: 0.5,
              source: `${opener} was the one who opened ${b}'s coffin` },
          ],
        }));
      }
      if (clean) {
        contrib[lifter] += 0.6;
        beats.push({ team: t.name, player: lifter, kind: 'good', score: mean,
          text: render(freshPick(rng, LIFT_CLEAN), { ...pronounSlots(lifter), team: t.name, buried: b }) });
      }
    }
    for (const b of left[t.name]) {
      scenes.push(missionScene({
        id: `buried-left-${b}`,
        eventId: 'buried-still-under-at-the-bell',
        phase: 'lift',
        participants: [b],
        text: `The bell went with ${b} still four feet down. ${t.name} had not reached `
          + `${pronounSlots(b).them}, and ${b} came up afterwards to a churchyard that had stopped digging.`,
        effects: [
          { kind: 'record', player: b, field: 'leftInTheGround', value: true,
            source: `${t.name} did not reach ${b} before the bell` },
          ...t.diggers.slice(0, 2).map(d => ({ kind: 'bond', players: [b, d], delta: -0.3,
            source: `${d} was on the team that left ${b} in the ground` })),
        ],
      }));
    }
    if (!beats.some(x => x.team === t.name)) {
      const who = t.diggers[0];
      beats.push({ team: t.name, player: who, kind: rescued[t.name] ? 'steady' : 'bad', score: mean,
        text: rescued[t.name]
          ? `${who} and ${t.name} got ${rescued[t.name]} up, not cleanly, but up.`
          : `${t.name} never got a coffin onto the grass before the bell.` });
    }
  }

  // THE ONE WHO ASKED FOR MORE TIME, asked about it. Fires only when somebody
  // stayed down, and the asker is a digger from their own team who waited.
  if (stayer) {
    const team = teams.find(t => t.name === stayer.team);
    const pool = team ? team.diggers : [];
    if (pool.length) {
      const asker = weightedPick(rng, pool,
        n => 0.3 + statOf(n, 'intuition') / 8 + statOf(n, 'boldness') / 12);
      scenes.push(missionScene({
        id: 'buried-more-time-raised',
        eventId: 'buried-why-did-you-wait',
        phase: 'lift',
        participants: [asker, stayer.name],
        behaviour: 'suspicious',
        text: `${asker} came up the bank asking why ${stayer.name} had needed more time in a `
          + `box. ${stayer.name} said it was cramp. Not everybody at the graveside believed it.`,
        effects: [
          { kind: 'claim', claimant: asker, about: stayer.name,
            text: `${asker} says ${stayer.name} kept ${stayer.team} waiting at the grave`,
            source: `${stayer.name} told ${stayer.team} to wait while ${asker} was digging` },
          { kind: 'suspicion', observer: asker, subject: stayer.name, delta: 0.22,
            source: `${stayer.name} asked to stay in the coffin while ${asker} waited above` },
          { kind: 'bond', players: [asker, stayer.name], delta: -0.4,
            source: `${asker} raised the wait at the graveside` },
        ],
        confessional: {
          purpose: 'vote-change', speaker: asker,
          text: confessionalVoice(asker, {
            neutral: 'Nobody asks to stay in a coffin. Either they are mad or there was '
              + "something down there worth staying for, and I don't think they're mad.",
            villainous: `${stayer.name} made us wait. I don't need to know why. I only need the `
              + 'table to wonder.',
            nice: `I don't want to think the worst of ${stayer.name}. But we were digging and `
              + 'they told us to stop, and I keep coming back to that.',
          }),
        },
      }));
    }
  }

  const score = t => {
    const d = t.diggers.reduce((s, n) => s + (contrib[n] || 0), 0) / Math.max(1, t.diggers.length);
    const share = rescued[t.name] / Math.max(1, t.buried.length);
    // TIME IN HAND IS THE SPREAD. A team with its people up and ten minutes on
    // the bell had a different afternoon from one that got there at 44:59.
    const spare = clamp01((CLOCK - minutes[t.name]) / CLOCK);
    return clamp01(0.36 * (d / 10) + 0.26 * share + 0.9 * spare);
  };
  return {
    phase: {
      id: 'lift', name: 'The Lift',
      setting: 'Two ropes under each coffin, the whole team on them, and a lip of wet clay '
        + 'that gives way if anybody lets go early.',
      stats: ['physical', 'loyalty'],
      beats: _interleave(beats),
      teams: teams.map(t => ({ name: t.name, score: score(t), rescued: rescued[t.name],
        left: [...left[t.name]] })),
    },
    contrib, scenes, rescued, left, order,
  };
}

const SUMMARY = {
  triumph: [
    'Every coffin was on the grass before the bell, and nobody had to be dug for twice.',
    'They read the ground, dug the right plots and lifted clean. The churchyard gave everybody back.',
    'The bell rang over a row of open graves and nobody in any of them.',
  ],
  solid: [
    'Most of them were standing on the grass when the bell went. One team spent too long on the wrong plot.',
    'An honest afternoon with spades. Not everybody came up in time, and the teams that waited know whose minutes those were.',
    'Enough came up to be paid for. The rest of the afternoon was about who had wasted the clock.',
  ],
  scraped: [
    'The bell went with coffins still in the ground and teams still arguing over the clues.',
    'A wrong plot, a dropped rope and a lot of shouting, and only a few people out in time.',
    'They got some of their own people up in the last minutes, and that was the afternoon.',
  ],
  failed: [
    'The bell rang over a churchyard still full of coffins. Nobody earned a penny.',
    'Wrong plots and slipped ropes all afternoon, and the estate keeps its money.',
    'They dug a great deal of earth and got almost nobody out of it.',
  ],
};

// ══════════════════════════════════════════════════════════════════════

export const buriedAlive = {
  id: 'buried-alive',
  name: 'Buried Alive',
  teams: TEAMS,
  side: [
    { id: 'lay-still', label: 'lie still in the coffin without once knocking early',
      stat: 'temperament' },
    { id: 'dug-alone', label: 'dig a whole plot out single-handed',
      stat: 'physical' },
  ],
  desc: 'A churchyard with a row of freshly turned plots, a coffin for some players from each '
    + 'of three teams, and a spade for everybody else. The buried players are nailed in and '
    + 'lowered into the ground; their teammates dig the clue plots to learn which plot their '
    + 'own people are under, dig down to the lid, knock twice, and lift the coffin out on '
    + 'ropes. Digging the wrong plot spends the minutes it took, and a coffin dropped during '
    + 'the lift goes back to the bottom and has to be lifted again. On a Shield afternoon a '
    + 'riddle is nailed inside every lid, and a buried player who stays down to solve it wins '
    + 'the Shield while their team waits at the graveside. Every player standing on the grass '
    + 'before the forty-five minute bell earns money for the pot; anybody still underground '
    + 'earns nothing.',

  eligibility(ctx) {
    // Three teams with a digger and a coffin each need six people.
    return Array.isArray(ctx?.living) && ctx.living.length >= 6;
  },

  simulate(ctx, rng) {
    const living = [...ctx.living];
    const teams = _threeTeams(living, rng);
    _bury(teams, rng);
    const plots = _plotMap(teams, rng);
    const coffins = plots.filter(p => p.kind === 'coffin').length;
    const shieldOn = missionShieldOffered(ctx);
    const ceremony = _ceremony(plots.length, coffins, shieldOn);

    const clues = _cluePlots(ctx, rng, teams, plots);
    const lids = _underTheLids(ctx, rng, teams, clues.minutes, shieldOn);
    const lift = _lift(ctx, rng, teams, clues.minutes, plots, lids.stayer);

    const phases = [clues.phase, lids.phase, lift.phase];
    const swings = Object.fromEntries(teams.map(t => [t.name, (rng() - 0.5) * PHASE_SWING]));
    const scored = teams.map(t => {
      const parts = phases.map(ph => ph.teams.find(x => x.name === t.name).score);
      return { name: t.name, members: [...t.members], buried: [...t.buried],
        perf: clamp01(parts.reduce((a, b) => a + b, 0) / parts.length + swings[t.name]) };
    });

    const playerScores = {};
    for (const n of living) {
      playerScores[n] = Number(((clues.contrib[n] || 0) + (lids.contrib[n] || 0)
        + (lift.contrib[n] || 0)).toFixed(3));
    }

    const quality = missionQualityOf(scored.map(t => t.perf));
    const holder = lids.stayer && lids.solved ? lids.stayer.name : null;
    const sideObjectives = runSideObjectives(buriedAlive.side, scored, rng, holder);
    const pay = payPot(quality, sideObjectives.reduce((a, o) => a + o.bonus, 0));

    const won = holder ? awardShield(holder, scored, ctx.ep, rng) : null;
    const shieldBlock = {
      offered: shieldOn,
      searcher: lids.stayer ? lids.stayer.name : null,
      found: !!won,
      delay: lids.delay,
      holder: won ? won.holder : null,
      witnesses: won ? [...won.witnesses] : [],
      visibility: won ? won.visibility : null,
      lines: won ? [won.seenLine] : [],
    };
    const scenes = [...clues.scenes, ...lids.scenes, ...lift.scenes];
    if (won) {
      // The Shield as its own scene, so the screen can light the envelope box
      // on exactly the reveal that shows it being won.
      scenes.push(missionScene({
        id: 'buried-shield-won',
        eventId: 'buried-riddle-shield',
        phase: 'coffins',
        participants: [holder],
        behaviour: 'impressive',
        text: `${holder} solved the riddle under the lid and came up out of the ground with a `
          + 'Shield.' + (won.witnesses.length
          ? ` ${won.witnesses.slice(0, 3).join(' and ')} saw the envelope in ${pronounSlots(holder).their} hand.`
          : ' Nobody at the graveside saw what was in the envelope.'),
        effects: [
          { kind: 'shield', player: holder,
            source: `${holder} solved the riddle under the coffin lid` },
          { kind: 'crowd', name: holder, colour: 'masterful', mult: 0.7,
            source: `${holder} solved the coffin riddle and won a Shield` },
        ],
      }));
    }

    const rec = {
      id: 'buried-alive', ep: ctx.ep, name: 'Buried Alive',
      ceremony, briefing: briefingText(ceremony.hostBeats),
      teams: scored,
      phases,
      playerScores,
      placements: placementsFrom(playerScores),
      quality, tier: pay.tier,
      bestTeam: [...scored].sort((a, b) => b.perf - a.perf)[0].name,
      potBefore: pay.potBefore, gross: pay.gross, potEarned: pay.potEarned,
      potAfter: pay.potAfter, earned: pay.potEarned,
      shields: won ? [shieldBlock] : [],
      shield: shieldBlock,
      sideObjectives,
      scenes,
      summary: freshPick(rng, SUMMARY[pay.tier]),
      tally: {
        clock: CLOCK,
        plots: plots.map(p => ({ n: p.n, kind: p.kind, team: p.team, who: p.who,
          dugBy: p.dugBy || null })),
        rescued: { ...lift.rescued },
        left: Object.fromEntries(Object.entries(lift.left).map(([k, v]) => [k, [...v]])),
        wrong: { ...clues.wrong },
        minutes: Object.fromEntries(Object.entries(clues.minutes).map(([k, v]) => [k, Math.min(CLOCK, v)])),
        order: lift.order.map(o => ({ ...o })),
      },
    };
    return validateMissionRecord(rec, ctx);
  },
};

export default buriedAlive;
