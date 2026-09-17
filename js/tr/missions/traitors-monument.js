// ══════════════════════════════════════════════════════════════════════
// tr/missions/traitors-monument.js — Traitors' Monument
// ══════════════════════════════════════════════════════════════════════
//
// From the wiki (thetraitors.fandom.com/wiki/Traitors'_Monument, UK S2 E11,
// and /wiki/Sacred_Sword). A stone monument covered in pigpen code, ringed by
// hooded figures with symbols on them. The code sends the players to the
// figures; each figure asks a riddle, among them "turn the stone to face me"
// and "name everyone the Traitors have murdered, in order". Solve enough and
// the monument opens. Then the Sacred Sword: the players take turns to pull
// it from a boulder. Approved mockup: mockup/mockup-tr-traitors-monument.html.
//
// THE SHIELD IS THE SWORD'S BARGAIN. On the show the one who drew the sword
// could keep the afternoon's money. Here they choose between a Shield and the
// money: take the Shield and nothing won today reaches the pot, in front of
// everyone.
//
// WHAT A TRAITOR CAN DO. Answer a riddle wrong, fast and sure. A Faithful who
// has simply got it wrong sounds exactly the same. A Traitor who draws the
// sword has no use for a Shield and is a little more likely to leave the money.

import {
  briefingText, clamp01, confessionalVoice, freshPick, hostDo, hostSay, PHASE_SWING,
  missionQuality, missionScene, missionShieldOffered, noisyPair, payPot, placementsFrom,
  pronounSlots, render, splitTeams, statOf, validateMissionRecord, weightedPick,
  runSideObjectives, andList,
} from './contract.js';
import { gs } from '../../core.js';
import { awardShield } from '../powers.js';

const TEAMS = ['Raven', 'Serpent'];
const PANELS = 3;
const OPENS_AT = 2;
const SYMBOLS = ['raven', 'eye', 'key', 'hand', 'moon', 'serpent'];

// Whoever the Traitors have murdered, in order. The roll riddle reads it.
function _fallen() {
  return (gs?.tr?.rounds || []).map(r => r && r.murdered).filter(Boolean);
}

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
function _ceremony(shield) {
  const hostBeats = [
    hostDo('The host lays a gloved hand on the monument.'),
    hostSay('This stone is written in the Traitors\' own code. Read it, and it will tell you which of '
      + 'these figures to go to.'),
    hostDo('The host walks slowly round the ring of hooded figures.'),
    hostSay('Each of them will give you a riddle. Some want the stone turned. One may ask you to name '
      + 'everyone the Traitors have taken, in order.'),
    hostSay('Read the stone wrong, or answer wrong, and that figure turns its back on you for good.'),
    hostSay('Every riddle you answer earns money for the pot, and if enough are answered the stone '
      + 'will open.'),
    hostDo('The host points past the figures to the sword standing in the boulder.'),
    ...(shield ? [
      hostSay('Inside is the Sacred Sword. Whoever draws it can take a Shield.'),
      hostSay('But if they take it, everything you won here today stays in the stone.'),
    ] : [
      hostSay('Inside is the Sacred Sword. Draw it, and the money is yours to keep in the pot.'),
    ]),
    hostSay('You have until the light goes. Begin.'),
  ];
  const at = s => hostBeats.findIndex(b => b.kind === 'say' && b.text.startsWith(s));
  return {
    ceremonyId: 'mission-brief-traitors-monument',
    staging: 'A moor at dusk. A carved stone monument, taller than anyone, covered in a code of lines '
      + 'and dots. Six hooded figures in rust-red robes stand around it, each with a symbol stitched on '
      + 'the chest. Beyond them, a sword in a boulder.',
    hostBeats,
    contestantBeats: [],
    rulePoints: [
      { id: 'task', explainedByBeat: at('Each of them') },
      { id: 'failure', explainedByBeat: at('Read the stone wrong') },
      { id: 'reward', explainedByBeat: at('Every riddle') },
      ...(shield ? [
        { id: 'shield', explainedByBeat: at('Inside is the Sacred Sword') },
        { id: 'cost', explainedByBeat: at('But if they take it') },
      ] : []),
      { id: 'finish', explainedByBeat: at('You have until') },
    ],
    revealBeats: hostBeats.length,
    reminder: 'The host reminds the room that a wrong reading or a wrong answer loses that figure, and '
      + 'that every riddle answered pays.',
  };
}

// ══════════════════════════════════════════════════════════════════════
// PROSE
// ══════════════════════════════════════════════════════════════════════
const READ_GOOD = [
  '{who} worked out which half of the alphabet the dots meant and read the panel straight off.',
  '{who} read the {sym} panel before anyone else had found the first letter.',
  '{who} traced the lines with a finger and read the panel out loud, right first time.',
];
const READ_BAD = [
  '{who} read the panel upside down, and the figure with the {sym} turned its back.',
  '{who} swapped two letters, sent {team} to the wrong figure, and lost the {sym}.',
  '{who} was sure of the panel and wrong about it. The figure with the {sym} turned away.',
];
const RIDDLES = {
  turn: { ask: 'Face me to the one who never speaks.',
    good: '{who} worked out which figure never spoke and put {their} shoulder to the stone until it faced it.',
    bad: '{who} turned the stone the wrong way round, and the figure with the {sym} turned its back.' },
  liar: { ask: 'Which of us is lying?',
    good: '{who} listened to all three figures twice and named the liar.',
    bad: '{who} named the wrong figure as the liar, and the figure with the {sym} turned away.' },
  count: { ask: 'How many of you started, and how many are left?',
    good: '{who} counted the empty chairs from breakfast and gave both numbers.',
    bad: '{who} got the first number right and the second one wrong.' },
  weight: { ask: 'What is heavier the less you say?',
    good: '{who} said "a secret" before the figure had finished asking.',
    bad: '{who} said "a promise". The figure with the {sym} turned its back.' },
  roll: { ask: 'Name everyone they have taken, in order.',
    good: '{who} named them all, first night to last: {names}.',
    bad: '{who} got the names right and the order wrong, and the figure with the {sym} turned away.' },
};
const PULL_FAIL = [
  '{who} pulled until {their} feet came off the ground. The sword stayed put.',
  '{who} braced a boot on the boulder and heaved. Nothing moved.',
  '{who} tried twice, the second time with both hands. The sword did not move.',
];
const SUMMARY = {
  triumph: ['Nearly every figure dropped its hood, and the stone opened for them.',
    'The code read, the riddles answered, and the monument gave up the sword.',
    'Five or six riddles, a stone standing open, and a good afternoon for the pot.'],
  solid: ['Enough of the figures answered to open the stone.',
    'Some panels misread and some riddles lost, but the monument opened.',
    'A few figures turned away, and the rest were enough.'],
  scraped: ['Most of the figures turned their backs, and the stone stayed shut.',
    'A riddle or two answered, and the monument kept the sword.',
    'The code beat most of them, and the pot got little.'],
  failed: ['Every figure turned away. The stone stayed shut and the pot got nothing.',
    'Not a riddle answered. The moor kept its sword.',
    'Nothing read, nothing answered, nothing earned.'],
  taken: ['The monument opened, and the money went back into the stone for one Shield.',
    'A good afternoon on the moor, and then the sword was drawn and the money stayed in the stone.',
    'Riddles answered and a sword drawn, and nothing reached the pot.'],
};

// ══════════════════════════════════════════════════════════════════════

export const traitorsMonument = {
  id: 'traitors-monument',
  name: "Traitors' Monument",
  teams: TEAMS,
  side: [
    { id: 'read-it-alone', label: 'read a whole panel without asking for help', stat: 'mental' },
    { id: 'stood-close', label: 'stand within arm\'s length of every figure', stat: 'boldness' },
  ],
  desc: 'On a moor stands a carved stone monument covered in pigpen code, with six hooded figures '
    + 'around it and a sword in a boulder beyond. Each team reads three panels on its own face of '
    + 'the monument; each panel read sends the team to one figure, and that figure asks a riddle, '
    + 'such as turning the stone to face it or naming the murdered in order. A misread panel or a '
    + 'wrong answer and that figure turns its back for good. Every riddle answered pays into the '
    + 'shared pot, and if at least two are answered the monument opens and the players take turns '
    + 'to pull the Sacred Sword. On a Shield afternoon, whoever draws it chooses between a Shield '
    + 'and the money: take the Shield and the afternoon earns nothing.',

  eligibility(ctx) {
    return Array.isArray(ctx?.living) && ctx.living.length >= 4;
  },

  simulate(ctx, rng) {
    const living = [...ctx.living];
    const teams = splitTeams(living, rng, TEAMS);
    const shieldOn = missionShieldOffered(ctx);
    const ceremony = _ceremony(shieldOn);
    const fallen = _fallen().filter(n => !living.includes(n));
    const contrib = Object.fromEntries(living.map(n => [n, 0]));
    const scenes = [];
    const beats = { cipher: [], figures: [], sword: [] };
    const figures = SYMBOLS.map((sym, i) => ({ sym, team: TEAMS[i < PANELS ? 0 : 1], state: 'waiting' }));
    const tally = {};

    // Riddles for the six figures; the roll only if somebody has been murdered.
    const pool = ['turn', 'liar', 'count', 'weight'];
    // Three different riddles per team.
    const kinds = [];
    for (let t = 0; t < 2; t++) {
      const left = [...pool];
      for (let k = 0; k < PANELS; k++) kinds.push(left.splice(Math.floor(rng() * left.length), 1)[0]);
    }
    if (fallen.length) kinds[Math.floor(rng() * 6)] = 'roll';

    // ── PHASE I: THE CIPHER ──────────────────────────────────────────
    let helped = false;
    for (const [ti, t] of teams.entries()) {
      tally[t.name] = { read: 0, misread: 0, answered: 0, lost: 0 };
      for (let k = 0; k < PANELS; k++) {
        const fi = ti * PANELS + k;
        const who = weightedPick(rng, t.members, n => 0.4 + statOf(n, 'mental') / 5);
        const v = noisyPair(rng, who, 'mental', 'intuition', 3.0);
        let ok = rng() < clamp01(0.4 + 0.05 * v);
        let taught = null;
        const slots = { ...pronounSlots(who), team: t.name, sym: SYMBOLS[fi] };
        // A teammate with the chalk, once an afternoon.
        if (!ok && !helped && t.members.length > 1) {
          const helper = weightedPick(rng, t.members.filter(n => n !== who), n => 0.3 + statOf(n, 'mental') / 6);
          if (rng() < clamp01(0.25 + 0.04 * statOf(helper, 'loyalty'))) {
            helped = true;
            ok = true;
            taught = helper;
            contrib[helper] += 1;
            scenes.push(missionScene({
              id: `monument-chalk-${t.name}`, eventId: 'monument-chalk-grid', phase: 'cipher',
              participants: [helper, who], behaviour: 'heroic',
              text: `${helper} took the chalk, drew the code's grid out on the stone for ${who}, and let ${pronounSlots(who).them} read the panel ${pronounSlots(who).them}self.`,
              effects: [
                { kind: 'bond', players: [helper, who], delta: 0.5, source: `${helper} drew the grid for ${who}` },
                { kind: 'crowd', name: helper, colour: 'kind', mult: 0.6, source: `${helper} taught ${who} the code` },
              ],
              confessional: { purpose: 'emotional-turn', speaker: who,
                text: confessionalVoice(who, {
                  nice: `${helper} could have just done it. Made me do it instead. I liked that.`,
                  villainous: `${helper} made a lesson of it in front of everyone. I'll let that go. For now.`,
                  neutral: "Somebody drew the grid. After that it's just reading.",
                }) },
            }));
          }
        }
        if (ok) {
          tally[t.name].read++;
          contrib[who] += 1;
          figures[fi].state = 'open';
        } else {
          tally[t.name].misread++;
          figures[fi].state = 'lost';
          contrib[who] = Math.max(0, contrib[who] - 0.5);
        }
        beats.cipher.push({ team: t.name, player: who, kind: ok ? 'good' : 'bad', score: v,
          text: taught ? `${who} read the ${SYMBOLS[fi]} panel off the grid ${taught} had drawn.`
            : render(freshPick(rng, ok ? READ_GOOD : READ_BAD), slots) });
      }
    }

    // ── PHASE II: THE FIGURES ────────────────────────────────────────
    let blurted = false;
    let shy = false;
    for (const [ti, t] of teams.entries()) {
      for (let k = 0; k < PANELS; k++) {
        const fi = ti * PANELS + k;
        const fig = figures[fi];
        const kind = kinds[fi];
        fig.kind = kind;
        if (fig.state !== 'open') { tally[t.name].lost++; continue; }
        const who = weightedPick(rng, t.members, n => 0.4 + statOf(n, kind === 'turn' ? 'physical' : 'strategic') / 5);
        const v = noisyPair(rng, who, 'strategic', 'social', 3.0);
        const nudge = ctx.conflicted(who) ? 0.10 : 0;
        const hard = kind === 'roll' ? 0.02 * Math.max(0, fallen.length - 3) : 0;
        const ok = rng() < clamp01(0.4 + 0.05 * v - nudge - hard);
        const slots = { ...pronounSlots(who), sym: fig.sym, names: andList(fallen) };
        const r = RIDDLES[kind];
        fig.by = who;
        if (ok) {
          fig.state = 'solved';
          tally[t.name].answered++;
          contrib[who] += 1.2;
          if (kind === 'roll') {
            fig.said = true;
            scenes.push(missionScene({
              id: `monument-roll-${t.name}`, eventId: 'monument-roll-of-the-dead', phase: 'figures',
              participants: [who], behaviour: 'impressive',
              text: `"${r.ask}" ${fallen.length === 1
                ? `${who} said the only name there was to say: ${fallen[0]}.`
                : render(r.good, slots)}`,
              effects: [{ kind: 'crowd', name: who, colour: 'heroic', mult: 0.5, source: `${who} named every murdered player in order` }],
              confessional: { purpose: 'emotional-turn', speaker: who,
                text: confessionalVoice(who, {
                  nice: "You don't forget who you had breakfast with the day they weren't there.",
                  villainous: 'I keep a list. Of course I keep a list.',
                  neutral: `${fallen.length} names. I said them in the order they went. That's all it was.`,
                }) },
            }));
            continue;
          }
        } else {
          fig.state = 'lost';
          tally[t.name].lost++;
          contrib[who] = Math.max(0, contrib[who] - 0.6);
          // Answered fast and wrong, with a teammate who had it: once an afternoon.
          const others = t.members.filter(n => n !== who);
          if (!blurted && others.length && rng() < 0.5) {
            blurted = true;
            const obs = weightedPick(rng, others, n => 0.3 + statOf(n, 'strategic') / 6);
            scenes.push(missionScene({
              id: `monument-blurted-${t.name}`, eventId: 'monument-blurted-wrong', phase: 'figures',
              participants: [obs, who], behaviour: 'suspicious',
              text: `"${r.ask}" ${obs} had the answer worked out. ${who} answered first, sure and wrong, and the figure with the ${fig.sym} turned its back.`,
              effects: [
                { kind: 'claim', claimant: obs, about: who,
                  text: `${obs} says ${who} answered the ${fig.sym} riddle wrong on purpose`,
                  source: `${who} answered over ${obs} and lost the figure with the ${fig.sym}` },
                { kind: 'suspicion', observer: obs, subject: who, delta: 0.26,
                  source: `${who} answered a riddle fast and wrong with ${obs} beside ${pronounSlots(who).them}` },
                { kind: 'bond', players: [obs, who], delta: -0.5,
                  source: `${who} spoke over ${obs} at the monument` },
              ],
              confessional: { purpose: 'belief-change', speaker: obs,
                text: confessionalVoice(obs, {
                  neutral: "They didn't guess. They said it like they'd decided. Why would you decide to be wrong?",
                  villainous: 'Fast and wrong. That goes on the list for the table.',
                  nice: "Maybe they panicked. I'd like it to be panic.",
                }) },
            }));
            continue;
          }
        }
        beats.figures.push({ team: t.name, player: who, kind: ok ? 'good' : 'bad', score: v,
          text: `"${r.ask}" ${render(ok ? r.good : r.bad, slots)}` });
      }
      // Somebody who will not go near a figure, once an afternoon.
      if (!shy && t.members.length > 2) {
        const cand = [...t.members].sort((a, b) => statOf(a, 'boldness') - statOf(b, 'boldness'))[0];
        if (rng() < clamp01(0.35 - 0.04 * statOf(cand, 'boldness'))) {
          shy = true;
          scenes.push(missionScene({
            id: `monument-shy-${t.name}`, eventId: 'monument-would-not-go-close', phase: 'figures',
            participants: [cand], behaviour: 'cowardly',
            text: `A hooded figure asked ${cand} to come close and lift its hood. ${cand} would not go nearer than arm's length.`,
            effects: [{ kind: 'crowd', name: cand, colour: 'cowardly', mult: 0.4, source: `${cand} would not go near the hooded figures` }],
            confessional: { purpose: 'emotional-turn', speaker: cand,
              text: confessionalVoice(cand, {
                nice: "It didn't move. It didn't breathe. I wasn't going to touch it.",
                villainous: 'Let somebody else lift the hood on the ghoul.',
                neutral: 'No. Not a chance. Not for money.',
              }) },
          }));
        }
      }
    }

    // ── PHASE III: THE SWORD ─────────────────────────────────────────
    const answered = tally[TEAMS[0]].answered + tally[TEAMS[1]].answered;
    const opened = answered >= OPENS_AT;
    const pulls = [];
    let drawer = null;
    if (opened) {
      const order = [];
      const rest = [...living];
      while (rest.length && order.length < living.length) {
        const n = weightedPick(rng, rest, x => 0.3 + statOf(x, 'boldness') / 5);
        order.push(n); rest.splice(rest.indexOf(n), 1);
      }
      for (const [i, n] of order.entries()) {
        const v = noisyPair(rng, n, 'physical', 'boldness', 3.0);
        const last = i === order.length - 1;
        pulls.push(n);
        if (last || rng() < clamp01(0.08 + 0.03 * v)) { drawer = n; contrib[n] += 1; break; }
      }
      const opener = Object.entries(contrib).sort((a, b) => (b[1] - a[1]) || (a[0] < b[0] ? -1 : 1))[0][0];
      scenes.push(missionScene({
        id: 'monument-opens', eventId: 'monument-stone-opens', phase: 'sword',
        participants: [opener], behaviour: 'impressive',
        text: `${answered} figures dropped their hoods. The front of the monument slid back, and inside was the hilt of a sword pointing at the boulder. ${opener} had done more than anyone to open it.`,
        effects: [{ kind: 'crowd', name: opener, colour: 'masterful', mult: 0.4, source: `${opener} led the way through the riddles` }],
      }));
      const failed = pulls.filter(n => n !== drawer);
      for (const n of failed.slice(0, 3)) {
        beats.sword.push({ team: teams.find(t => t.members.includes(n)).name, player: n, kind: 'steady', score: 4,
          text: render(freshPick(rng, PULL_FAIL), pronounSlots(n)) });
      }
      if (failed.length > 3) {
        beats.sword.push({ team: teams.find(t => t.members.includes(failed[3])).name, player: failed[3], kind: 'steady', score: 4,
          text: `${andList(failed.slice(3))} tried after that. The sword did not move for any of them.` });
      }
    } else {
      const closest = Object.entries(contrib).sort((a, b) => (b[1] - a[1]) || (a[0] < b[0] ? -1 : 1))[0][0];
      scenes.push(missionScene({
        id: 'monument-shut', eventId: 'monument-stone-stays-shut', phase: 'sword',
        participants: [closest],
        text: `The last figure turned its back and the monument stayed shut. ${closest} stood with a hand on the stone for a long time afterwards.`,
        effects: [{ kind: 'record', player: closest, field: 'stoneStayedShut', value: true,
          source: `the monument stayed shut with ${closest} closest to opening it` }],
      }));
      beats.sword.push({ team: TEAMS[0], player: living[0], kind: 'bad', score: 2,
        text: `Only ${answered} of six figures answered. The monument stayed shut, and nobody got near the sword.` });
    }

    // THE BARGAIN
    let tookShield = false;
    let won = null;
    if (drawer) {
      const lead = teams.find(t => t.members.includes(drawer));
      if (shieldOn) {
        const pTake = clamp01(0.25 + 0.05 * (statOf(drawer, 'boldness') - 5)
          - 0.05 * (statOf(drawer, 'loyalty') - 5) - (ctx.conflicted(drawer) ? 0.15 : 0));
        tookShield = rng() < pTake;
      }
      if (tookShield) {
        won = awardShield(drawer, teams, ctx.ep, rng);
        scenes.push(missionScene({
          id: 'monument-bargain', eventId: 'monument-sword-shield', phase: 'sword',
          participants: [drawer], behaviour: 'selfish',
          text: `${drawer} drew the sword${pulls.length > 1 ? ` after ${pulls.length - 1} others had failed` : ' on the first pull'}. The host asked ${pronounSlots(drawer).them} to choose. ${drawer} took the Shield, and the afternoon's money stayed in the stone.`,
          effects: [
            { kind: 'record', player: drawer, field: 'tookTheSword', value: true,
              source: `${drawer} took the Shield instead of the money` },
            { kind: 'shield', player: drawer, source: `${drawer} traded the afternoon's money for a Shield` },
            { kind: 'crowd', name: drawer, colour: 'selfish', mult: 0.8, source: `${drawer} kept the Shield and cost the pot` },
          ],
          confessional: { purpose: 'hidden-intent', speaker: drawer,
            text: confessionalVoice(drawer, {
              neutral: "Money split between everyone, or not dying tonight. That's not a hard sum.",
              villainous: 'They will hate me for a day. I will be alive for all of it.',
              nice: "I know what it cost. I'll pay it back at the table. I just couldn't go home tonight.",
            }) },
        }));
        // The one who worked hardest for that money.
        const angry = living.filter(n => n !== drawer).sort((a, b) => (contrib[b] - contrib[a]) || (a < b ? -1 : 1))[0];
        if (angry) {
          scenes.push(missionScene({
            id: 'monument-cost', eventId: 'monument-money-lost', phase: 'sword',
            participants: [angry, drawer], behaviour: 'suspicious',
            text: `${angry} had done as much as anyone to earn that money. ${pronounSlots(angry).They} said so, loudly, all the way back.`,
            effects: [
              { kind: 'bond', players: [angry, drawer], delta: -0.8, source: `${drawer} took the Shield ${angry} had helped pay for` },
              { kind: 'suspicion', observer: angry, subject: drawer, delta: 0.12, source: `${drawer} chose a Shield over the pot` },
            ],
          }));
        }
      } else {
        scenes.push(missionScene({
          id: 'monument-bargain', eventId: shieldOn ? 'monument-sword-money' : 'monument-sword-drawn', phase: 'sword',
          participants: [drawer], behaviour: shieldOn ? 'heroic' : 'impressive',
          text: shieldOn
            ? `${drawer} drew the sword. The host held out a Shield. ${drawer} left it, and the money went into the pot.`
            : `${drawer} drew the sword out of the boulder, and ${lead.name} cheered loudest.`,
          effects: [
            { kind: 'crowd', name: drawer, colour: shieldOn ? 'selfless' : 'masterful', mult: shieldOn ? 0.8 : 0.5,
              source: shieldOn ? `${drawer} left the Shield for the pot` : `${drawer} drew the Sacred Sword` },
          ],
          confessional: shieldOn ? { purpose: 'hidden-intent', speaker: drawer,
            text: confessionalVoice(drawer, {
              nice: "Eight people read that stone. I wasn't going to be the one who kept it back.",
              villainous: "Carry that thing into breakfast and everyone looks at you. Let them remember who paid them instead.",
              neutral: "I'd rather be the one who left it. People remember that.",
            }) } : null,
        }));
      }
    }

    // SCORING
    for (const n of living) contrib[n] += clamp01(noisyPair(rng, n, 'physical', 'boldness', 3.0) / 10) * 2;
    if (!beats.cipher.length) beats.cipher.push({ team: TEAMS[0], player: living[0], kind: 'bad', score: 2, text: 'Nobody read a panel.' });
    if (!beats.figures.length) {
      beats.figures.push({ team: TEAMS[0], player: living[0], kind: 'steady', score: 4,
        text: 'The figures waited. What happened with each is below.' });
    }
    if (!beats.sword.length) {
      beats.sword.push({ team: TEAMS[0], player: drawer || living[0], kind: 'steady', score: 5,
        text: 'The first hand on the hilt was the last one needed.' });
    }
    const phases = [
      { id: 'cipher', name: 'The Cipher', stats: ['mental', 'intuition'],
        setting: 'Two faces of carved stone, a code of lines and dots, and a key nobody gave you.',
        beats: _interleave(beats.cipher) },
      { id: 'figures', name: 'The Figures', stats: ['strategic', 'social'],
        setting: 'Six hooded strangers, six riddles, and one answer each before they turn away.',
        beats: _interleave(beats.figures) },
      { id: 'sword', name: 'The Sword', stats: ['physical', 'boldness'],
        setting: 'The monument open, a boulder beyond it, and a sword that only one of them will move.',
        beats: beats.sword },
    ].map((ph, i) => ({ ...ph,
      teams: teams.map(t => ({ name: t.name,
        score: clamp01(i === 0 ? tally[t.name].read / PANELS
          : i === 1 ? 0.1 + 0.9 * tally[t.name].answered / PANELS
            : 0.35 + (drawer && t.members.includes(drawer) ? 0.3 : 0) + 0.1 * tally[t.name].answered) })) }));
    const scored = teams.map(t => {
      const parts = phases.map(ph => ph.teams.find(x => x.name === t.name).score);
      return { name: t.name, members: [...t.members],
        perf: clamp01(parts.reduce((x, y) => x + y, 0) / parts.length + (rng() - 0.5) * PHASE_SWING) };
    });
    // THE RIDDLES DECIDE THE TIER: five or more answered is a triumph, the
    // stone opening (two) is solid from three, none is a failure.
    const q0 = missionQuality(scored[0].perf, scored[1].perf);
    const quality = answered >= 5 ? Math.max(0.55, q0)
      : answered >= 3 ? Math.min(0.54, Math.max(0.40, q0))
        : answered >= 1 ? Math.min(0.39, Math.max(0.15, q0 * 0.8)) : Math.min(0.14, q0 * 0.25);
    const sideObjectives = runSideObjectives(traitorsMonument.side, scored, rng, null);
    const full = payPot(quality, sideObjectives.reduce((x, o) => x + o.bonus, 0));
    // The Shield keeps the whole afternoon in the stone.
    // `payPot` has already banked it, so the bargain takes it back out.
    if (tookShield && gs?.tr) gs.tr.pot = full.potBefore;
    const pay = tookShield
      ? { ...full, potEarned: 0, potAfter: full.potBefore }
      : full;

    const playerScores = {};
    for (const n of living) playerScores[n] = Number((contrib[n] || 0).toFixed(3));
    const block = {
      offered: shieldOn, searcher: drawer, found: !!won, cost: tookShield ? full.potEarned : 0,
      holder: won ? won.holder : null, witnesses: won ? [...won.witnesses] : [],
      visibility: won ? won.visibility : null, lines: won ? [won.seenLine] : [],
    };
    const order = { cipher: 0, figures: 1, sword: 2 };
    scenes.sort((x, y) => order[x.phase] - order[y.phase]);

    const rec = {
      id: 'traitors-monument', ep: ctx.ep, name: "Traitors' Monument",
      ceremony, briefing: briefingText(ceremony.hostBeats),
      teams: scored,
      phases,
      playerScores,
      placements: placementsFrom(playerScores),
      quality, tier: pay.tier,
      bestTeam: tally[TEAMS[0]].answered !== tally[TEAMS[1]].answered
        ? (tally[TEAMS[0]].answered > tally[TEAMS[1]].answered ? TEAMS[0] : TEAMS[1])
        : (scored[0].perf >= scored[1].perf ? TEAMS[0] : TEAMS[1]),
      potBefore: pay.potBefore, gross: pay.gross, potEarned: pay.potEarned,
      potAfter: pay.potAfter, earned: pay.potEarned,
      shields: won ? [block] : [],
      shield: block,
      sideObjectives,
      scenes,
      summary: freshPick(rng, tookShield ? SUMMARY.taken : SUMMARY[pay.tier]),
      tally: {
        offered: shieldOn, opened, answered, fallen: [...fallen],
        teams: Object.fromEntries(TEAMS.map(n => [n, { ...tally[n] }])),
        figures: figures.map(f => ({ ...f })),
        pulls: [...pulls], drawer, tookShield, forfeited: tookShield ? full.potEarned : 0,
      },
    };
    return validateMissionRecord(rec, ctx);
  },
};

export default traitorsMonument;
