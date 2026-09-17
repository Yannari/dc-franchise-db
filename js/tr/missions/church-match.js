// ══════════════════════════════════════════════════════════════════════
// tr/missions/church-match.js — Church Match
// ══════════════════════════════════════════════════════════════════════
//
// From the wiki (thetraitors.fandom.com/wiki/Church_Match — UK, US, Australia
// S2, Canada S1, Germany S1). Two teams send a reader into a double
// confessional; through the grille the host gives a page and a paragraph in the
// Book of Traitors, and the paragraph hides a riddle about an item worn by one
// of a masked congregation. The rest of the team finds it in the pews without
// touching anybody. Approved mockup: mockup/mockup-tr-church-match.html.
//
// THE SHIELD IS THE KNEELING. The show sent the best team to the Armoury;
// here the team that names the most kneels at the altar and each member writes
// one name. The name with the most votes receives the Shield. Votes follow
// bonds, and a player with little loyalty and a lot of nerve writes their own.
// Whoever did the most and was passed over remembers it.
//
// WHAT A TRAITOR CAN DO. As a runner, walk past the right mask. A Faithful who
// simply did not see the feather does exactly the same thing.

import {
  briefingText, clamp01, confessionalVoice, freshPick, hostDo, hostSay, PHASE_SWING,
  missionQuality, missionScene, missionShieldOffered, noisyPair, payPot, placementsFrom,
  pronounSlots, render, splitTeams, statOf, validateMissionRecord, weightedPick,
  runSideObjectives, shieldCostOf,
} from './contract.js';
import { getBond } from '../../bonds.js';
import { awardShield } from '../powers.js';

const TEAMS = ['Candle', 'Bell'];

// The screen shows the first few beats of a phase; alternate the teams so
// both are in them.
function _interleave(beats) {
  const by = {};
  for (const b of beats) (by[b.team] = by[b.team] || []).push(b);
  const lists = Object.values(by);
  const out = [];
  for (let i = 0; out.length < beats.length; i++) for (const l of lists) if (l[i]) out.push(l[i]);
  return out;
}
const PER_TEAM = 6;

const RIDDLES = [
  { item: 'the silver key brooch', riddle: 'I open nothing, yet I am worn over the heart.' },
  { item: 'the feather in a hat', riddle: 'A feather that never flew.' },
  { item: 'the gold ring on a gloved hand', riddle: 'A circle hidden under a second skin.' },
  { item: 'the pocket watch', riddle: 'I keep time for someone who cannot see it.' },
  { item: 'the rosary', riddle: 'Fifty-nine promises on a single string.' },
  { item: 'the silver thimble', riddle: 'A helmet for the smallest soldier.' },
  { item: 'the ivory comb', riddle: 'I have teeth and never bite.' },
  { item: 'the black pearl earring', riddle: 'A drop of night that the sea gave up.' },
  { item: 'the lace fan', riddle: 'I make a breeze and never leave the hand.' },
  { item: 'the wax seal ring', riddle: 'I sign my name without a pen.' },
  { item: 'the pressed flower in a buttonhole', riddle: 'I bloomed once and am still pretending.' },
  { item: 'the tiny brass bell', riddle: 'I would ring for mass if anybody let me.' },
];

// ══════════════════════════════════════════════════════════════════════
// THE BRIEFING
// ══════════════════════════════════════════════════════════════════════
function _ceremony(shield) {
  const hostBeats = [
    hostDo('The host sits down in the middle of the double confessional, between the two grilles.'),
    hostSay('One of each team sits in here with me. Through this grille I will give you a page and a '
      + 'paragraph in the Book of Traitors.'),
    hostSay('Somewhere in that paragraph is a riddle, and the riddle describes something one of those '
      + 'masked people is wearing. The rest of your team goes into the pews and finds it.'),
    hostDo('The host steps out of the confessional and walks slowly down the aisle, between the masked figures.'),
    hostDo('At the altar, the host turns and nods back toward the silent congregation.'),
    hostSay('You may look. You may not touch. Touch a mask, or name the wrong one, and that riddle is '
      + 'lost to you.'),
    hostSay('Every item you name correctly earns money for the pot.'),
    ...(shield ? [
      hostSay('The team that names the most will kneel at the altar, and choose one of its own to '
        + 'receive a Shield.'),
      hostSay('Only one of you. The rest of you will have to watch who your team chose.'),
    ] : []),
    hostSay(`${PER_TEAM === 6 ? 'Six' : PER_TEAM} riddles each. The candles are lit. Begin.`),
  ];
  const at = s => hostBeats.findIndex(b => b.kind === 'say' && b.text.startsWith(s));
  return {
    ceremonyId: 'mission-brief-church-match',
    staging: 'A candlelit church. At the back, a double confessional with a grille on each side. In the '
      + 'pews, twelve silent figures in black lace masks. On a lectern, the Book of Traitors.',
    hostBeats,
    contestantBeats: [],
    rulePoints: [
      { id: 'task', explainedByBeat: at('Somewhere in that paragraph') },
      { id: 'failure', explainedByBeat: at('You may look') },
      { id: 'reward', explainedByBeat: at('Every item you name') },
      ...(shield ? [
        { id: 'shield', explainedByBeat: at('The team that names the most') },
        { id: 'cost', explainedByBeat: at('Only one of you') },
      ] : []),
      { id: 'finish', explainedByBeat: at(PER_TEAM === 6 ? 'Six riddles' : String(PER_TEAM)) },
    ],
    revealBeats: hostBeats.length,
    reminder: 'The host reminds the room that nobody may touch a mask, that a wrong name loses the '
      + 'riddle, and that every item named pays.',
  };
}

// ══════════════════════════════════════════════════════════════════════
// PROSE
// ══════════════════════════════════════════════════════════════════════
const READ_GOOD = [
  '{who} found every page first time and read the riddles through the grille before the other booth had found the chapter.',
  '{who} read slowly, twice each time, and never sent {team} after the wrong thing.',
];
const READ_BAD = [
  '{who} read paragraph three of the wrong page, twice, and sent {team} into the pews looking for something nobody was wearing.',
  '{who} lost {their} place in the Book and read out a riddle from the page before.',
];
const RUN_GOOD = [
  '{who} found {item} on the third figure and named it without touching anything.',
  '{who} walked the pews once, slowly, and came back with {item}.',
  '{who} named {item} before the reader had finished the riddle.',
  '{who} stood in front of {item} until the host nodded.',
];
const RUN_WRONG = [
  '{who} named the wrong figure for {item}. The riddle was lost.',
  '{who} was sure {item} was on somebody in the front pew. It was two rows back.',
  '{who} pointed at a figure with nothing like {item} on it, and the host said no.',
  '{who} guessed {item} meant the wrong figure, and the riddle was gone.',
];
const RUN_TOUCH = [
  '{who} lifted the edge of a veil to see {item}. The figure turned its head, and the riddle was gone.',
  '{who} brushed a sleeve reaching past a figure, and the host rang the little bell. That riddle was lost.',
];
const SUMMARY = {
  triumph: ['The pews gave up nearly everything, and the confessional barely had to repeat itself.',
    'Both teams read clean and walked soft, and the pot filled from the congregation.',
    'A church full of silent strangers, and the castle read almost every one of them.'],
  solid: ['A good afternoon in the pews, with a couple of riddles lost to wandering hands.',
    'Most of the items named, a few lost, and a Shield decided at the altar.',
    'Enough found to be paid, and enough lost to argue about on the way back.'],
  scraped: ['Wrong pages and wrong masks, and not much to show for an hour in the pews.',
    'The congregation kept most of its secrets.',
    'A few items named, and a lot of riddles lost to guesses and touches.'],
  failed: ['Two items at most, out of twelve. Not enough to pay.',
    'Nearly every riddle misread or lost. The church kept the money.',
    'Hardly an item named. The host blew the candles out on an empty afternoon.'],
};

// ══════════════════════════════════════════════════════════════════════

export const churchMatch = {
  id: 'church-match',
  name: 'Church Match',
  teams: TEAMS,
  side: [
    { id: 'never-looked-back', label: 'name three items in a row without asking the reader again', stat: 'intuition' },
    { id: 'hands-behind', label: 'walk every pew with hands clasped behind the back', stat: 'temperament' },
  ],
  desc: 'A candlelit church holds a double confessional at the back, a lectern with the Book of '
    + 'Traitors, and twelve silent figures in black lace masks in the pews. Each team sends one '
    + 'reader into the confessional, where the host gives a page and a paragraph; the paragraph '
    + 'hides a riddle about an item one masked figure is wearing, and the rest of the team goes '
    + 'into the pews to find that figure and name the item. A misread page sends the runners '
    + 'after the wrong thing, and touching a mask or naming the wrong figure loses that riddle for '
    + 'good. Every item named correctly pays into the shared pot, and on a Shield afternoon the '
    + 'team that names the most kneels at the altar and votes one of its own a Shield.',

  eligibility(ctx) {
    return Array.isArray(ctx?.living) && ctx.living.length >= 4;
  },

  simulate(ctx, rng) {
    const living = [...ctx.living];
    const teams = splitTeams(living, rng, TEAMS);
    const shieldOn = missionShieldOffered(ctx);
    const ceremony = _ceremony(shieldOn);
    const contrib = Object.fromEntries(living.map(n => [n, 0]));
    const scenes = [];
    const beats = { book: [], pews: [], kneel: [] };
    const tally = {};
    const masks = [];
    let riddleAt = 0;
    let caught = false;
    let walkedPast = false;
    let refused = false;

    // ── PHASE I: THE BOOK ────────────────────────────────────────────
    for (const t of teams) {
      const reader = weightedPick(rng, t.members, n => 0.4 + statOf(n, 'mental') / 5);
      const v = noisyPair(rng, reader, 'mental', 'strategic', 3.0);
      contrib[reader] += clamp01(v / 10) * 10;
      const riddles = [];
      let misreads = 0;
      for (let i = 0; i < PER_TEAM; i++) {
        const r = RIDDLES[(riddleAt++) % RIDDLES.length];
        const ok = rng() < clamp01(0.45 + 0.05 * v);
        if (!ok) misreads++;
        riddles.push({ ...r, read: ok, mask: masks.length });
        masks.push({ item: r.item, team: t.name, found: false });
      }
      const slots = { ...pronounSlots(reader), team: t.name };
      beats.book.push({ team: t.name, player: reader, kind: misreads ? 'bad' : 'good', score: v,
        text: render(freshPick(rng, misreads ? READ_BAD : READ_GOOD), slots) });
      // A misread caught by a teammate at the grille: once an afternoon.
      if (misreads && !caught && t.members.length > 1) {
        const helper = weightedPick(rng, t.members.filter(n => n !== reader), n => 0.3 + statOf(n, 'mental') / 6);
        if (rng() < clamp01(0.3 + 0.05 * statOf(helper, 'loyalty'))) {
          caught = true;
          const fixed = riddles.find(x => !x.read);
          fixed.read = true;
          misreads--;
          contrib[helper] += 1;
          scenes.push(missionScene({
            id: `church-caught-${t.name}`, eventId: 'church-page-caught', phase: 'book',
            participants: [helper, reader], behaviour: 'heroic',
            text: `${helper} came back from the pews, listened through the grille, and told ${reader} the page number in ${pronounSlots(reader).their} head was the one before.`,
            effects: [
              { kind: 'bond', players: [helper, reader], delta: 0.6, source: `${helper} caught ${reader}'s misread page` },
              { kind: 'crowd', name: helper, colour: 'kind', mult: 0.6, source: `${helper} fixed ${reader}'s page quietly` },
            ],
            confessional: { purpose: 'emotional-turn', speaker: reader,
              text: confessionalVoice(reader, {
                nice: `${helper} didn't make a thing of it. Just fixed it and went back to the masks.`,
                villainous: `${helper} fixed my page in front of the team. Helpful. Noted.`,
                neutral: 'Wrong page. Somebody spotted it. We moved on.',
              }) },
          }));
        }
      }
      tally[t.name] = { reader, riddles, named: 0, lost: 0 };
    }

    // ── PHASE II: THE CONGREGATION ───────────────────────────────────
    for (const t of teams) {
      const runners = t.members.filter(n => n !== tally[t.name].reader);
      const pool = runners.length ? runners : t.members;
      const runs = {};
      // Somebody who will not go near the masks, once an afternoon.
      let shy = null;
      if (!refused && pool.length > 2) {
        const cand = [...pool].sort((a, b) => statOf(a, 'boldness') - statOf(b, 'boldness'))[0];
        if (rng() < clamp01(0.35 - 0.04 * statOf(cand, 'boldness'))) {
          refused = true;
          shy = cand;
          scenes.push(missionScene({
            id: `church-shy-${t.name}`, eventId: 'church-would-not-walk-the-pews', phase: 'pews',
            participants: [shy], behaviour: 'cowardly',
            text: `${shy} stood at the end of the aisle and would not walk between the masked figures. ${t.name} searched a pair of eyes short.`,
            effects: [{ kind: 'crowd', name: shy, colour: 'cowardly', mult: 0.4, source: `${shy} would not walk among the masks` }],
            confessional: { purpose: 'emotional-turn', speaker: shy,
              text: confessionalVoice(shy, {
                nice: "Twelve people in masks who won't move. I couldn't. I'm sorry.",
                villainous: 'Let the others play hide and seek with the mannequins.',
                neutral: "I don't do masks. Never have.",
              }) },
          }));
        }
      }
      const walkers = pool.filter(n => n !== shy);
      for (const r of tally[t.name].riddles) {
        if (!r.read) { tally[t.name].lost++; continue; }
        const who = weightedPick(rng, walkers.length ? walkers : pool, n => 0.4 + statOf(n, 'intuition') / 5);
        const v = noisyPair(rng, who, 'intuition', 'temperament', 3.0);
        runs[who] = (runs[who] || 0) + 1;
        const nudge = ctx.conflicted(who) ? 0.10 : 0;
        const pTouch = clamp01(0.12 - 0.01 * statOf(who, 'temperament'));
        const roll = rng();
        const slots = { ...pronounSlots(who), item: r.item };
        if (roll < pTouch) {
          tally[t.name].lost++;
          contrib[who] = Math.max(0, contrib[who] - 1);
          beats.pews.push({ team: t.name, player: who, kind: 'bad', score: v, text: render(freshPick(rng, RUN_TOUCH), slots) });
        } else if (rng() < clamp01(0.35 + 0.05 * v - nudge)) {
          tally[t.name].named++;
          masks[r.mask].found = true;
          masks[r.mask].order = masks.filter(m => m.found).length;
          contrib[who] += 1.2;
          beats.pews.push({ team: t.name, player: who, kind: 'good', score: v, text: render(freshPick(rng, RUN_GOOD), slots) });
        } else {
          tally[t.name].lost++;
          contrib[who] = Math.max(0, contrib[who] - 0.6);
          beats.pews.push({ team: t.name, player: who, kind: 'bad', score: v, text: render(freshPick(rng, RUN_WRONG), slots) });
          // Walked past it with a teammate pointing: once an afternoon.
          const pointer = walkers.filter(n => n !== who);
          if (!walkedPast && pointer.length && rng() < 0.5) {
            walkedPast = true;
            const obs = weightedPick(rng, pointer, n => 0.3 + statOf(n, 'intuition') / 6);
            scenes.push(missionScene({
              id: `church-walked-past-${t.name}`, eventId: 'church-walked-past-the-answer', phase: 'pews',
              participants: [obs, who], behaviour: 'suspicious',
              text: `${tally[t.name].reader} read "${r.riddle}" through the grille. ${who} walked past the figure wearing ${r.item} and named the one beside it. ${obs} had been pointing at ${r.item}.`,
              effects: [
                { kind: 'claim', claimant: obs, about: who,
                  text: `${obs} says ${who} walked straight past ${r.item}`,
                  source: `${who} named the wrong figure while ${obs} pointed at the right one` },
                { kind: 'suspicion', observer: obs, subject: who, delta: 0.26,
                  source: `${who} looked at ${r.item} and walked past it` },
                { kind: 'bond', players: [obs, who], delta: -0.5,
                  source: `${obs} watched ${who} lose the riddle` },
              ],
              confessional: { purpose: 'belief-change', speaker: obs,
                text: confessionalVoice(obs, {
                  neutral: 'It was right there. I was pointing at it. They looked at it and walked past it.',
                  villainous: "Walked right past it. I'll be telling that story at the table.",
                  nice: "Maybe they didn't see it. It was dark. I really want it to be that.",
                }) },
            }));
          }
        }
      }
    }

    // ── PHASE III: THE KNEELING ──────────────────────────────────────
    const [a, b] = TEAMS.map(n => tally[n]);
    const winner = a.named !== b.named ? (a.named > b.named ? TEAMS[0] : TEAMS[1])
      : (rng() < 0.5 ? TEAMS[0] : TEAMS[1]);
    const wTeam = teams.find(t => t.name === winner);
    const lTeam = teams.find(t => t.name !== winner);
    const topOf = wTeam.members.map(n => ({ n, c: contrib[n] })).sort((x, y) => y.c - x.c)[0].n;
    scenes.push(missionScene({
      id: 'church-called-forward', eventId: 'church-team-called-forward', phase: 'kneel',
      participants: [topOf],
      text: `${winner} named ${tally[winner].named} items to ${lTeam.name}'s ${tally[lTeam.name].named}. The host rang the sanctus bell and called ${winner} forward. ${topOf} had done more than anybody to get them there.`,
      effects: [{ kind: 'crowd', name: topOf, colour: 'masterful', mult: 0.4, source: `${topOf} carried ${winner} in the church` }],
    }));

    let won = null;
    const votes = {};
    if (shieldOn) {
      const tallyVotes = {};
      for (const voter of wTeam.members) {
        const selfish = clamp01(0.05 + 0.04 * statOf(voter, 'boldness') - 0.03 * statOf(voter, 'loyalty'));
        const pick = rng() < selfish ? voter
          : weightedPick(rng, wTeam.members.filter(n => n !== voter),
            n => Math.max(0.2, 1 + getBond(voter, n) / 3 + statOf(n, 'social') / 10));
        votes[voter] = pick;
        tallyVotes[pick] = (tallyVotes[pick] || 0) + 1;
      }
      const ranked = Object.entries(tallyVotes).sort((x, y) => (y[1] - x[1]) || (x[0] < y[0] ? -1 : 1));
      const holder = ranked[0][0];
      won = awardShield(holder, teams, ctx.ep, rng);
      const voters = Object.keys(votes).filter(v => votes[v] === holder);
      contrib[holder] += 0.5;
      scenes.push(missionScene({
        id: 'church-kneeling', eventId: 'church-kneeling-shield', phase: 'kneel',
        participants: voters.includes(holder) || voters.length === 0 ? [holder] : [holder, voters.find(v => v !== holder)],
        behaviour: 'impressive',
        text: `${winner} knelt and wrote a name each. ${voters.length} of ${wTeam.members.length} wrote ${holder}. The host placed the Shield in ${pronounSlots(holder).their} hands at the altar.`,
        effects: [
          { kind: 'record', player: holder, field: 'wonTheKneeling', value: true,
            source: `${winner} wrote ${holder}'s name at the altar` },
          { kind: 'shield', player: holder, source: `${winner} chose ${holder} for the Shield` },
          ...voters.filter(v => v !== holder).slice(0, 3).map(v => ({ kind: 'bond', players: [holder, v], delta: 0.4,
            source: `${v} wrote ${holder}'s name at the altar` })),
          { kind: 'crowd', name: holder, colour: 'masterful', mult: 0.5, source: `${holder} was chosen at the altar` },
        ],
        confessional: { purpose: 'hidden-intent', speaker: holder,
          text: confessionalVoice(holder, {
            nice: "I didn't ask for it. I think they chose me because I'd have said something if they'd chosen themselves.",
            villainous: 'They handed me a night off from dying. I will make sure they regret nothing. For now.',
            neutral: "My name, most votes. I'm not going to argue with a Shield.",
          }) },
      }));
      // The one who did the most and was passed over.
      const snub = wTeam.members.filter(n => n !== holder)
        .sort((x, y) => contrib[y] - contrib[x])[0];
      if (snub && votes[snub] === snub) {
        scenes.push(missionScene({
          id: 'church-passed-over', eventId: 'church-passed-over', phase: 'kneel',
          participants: [snub, holder], behaviour: 'selfish',
          text: `${snub} did as much as anybody and wrote ${pronounSlots(snub).their} own name. Nobody else did. ${snub} clapped for ${holder} a moment later than everybody else.`,
          effects: [
            { kind: 'bond', players: [snub, holder], delta: -0.5, source: `${snub} was passed over for ${holder} at the altar` },
            { kind: 'crowd', name: snub, colour: 'selfish', mult: 0.4, source: `${snub} voted for ${pronounSlots(snub).them}self at the altar` },
          ],
          confessional: { purpose: 'emotional-turn', speaker: snub,
            text: confessionalVoice(snub, {
              neutral: "I did the work. Fine. It's a Shield, not a medal.",
              villainous: "They chose wrong. I'll remember who wrote what.",
              nice: "I shouldn't have written my own name. I know that. It still stings.",
            }) },
        }));
      }
    }

    // The losing team, somebody consoling the one who lost them the most.
    const worst = [...lTeam.members].sort((x, y) => contrib[x] - contrib[y])[0];
    const comforter = weightedPick(rng, lTeam.members.filter(n => n !== worst), n => 0.3 + statOf(n, 'social') / 6);
    if (comforter && rng() < clamp01(0.3 + 0.05 * statOf(comforter, 'social'))) {
      scenes.push(missionScene({
        id: 'church-consoled', eventId: 'church-consoled-in-the-back-pew', phase: 'kneel',
        participants: [comforter, worst], behaviour: 'heroic',
        text: `${comforter} sat down next to ${worst} in the back pew and said the masks would have fooled anyone.`,
        effects: [{ kind: 'bond', players: [comforter, worst], delta: 0.5, source: `${comforter} consoled ${worst} after the church` }],
      }));
    }

    // SCORING
    const kneelRoll = n => noisyPair(rng, n, 'social', 'loyalty', 3.0);
    for (const n of living) contrib[n] += clamp01(kneelRoll(n) / 10) * 4;
    if (!beats.pews.length) beats.pews.push({ team: TEAMS[0], player: living[0], kind: 'bad', score: 3, text: 'Nobody got as far as the pews with a riddle they could read.' });
    beats.kneel.push({ team: winner, player: topOf, kind: 'good', score: 7,
      text: `${winner} walked to the altar. ${lTeam.name} watched from the pews.` });
    const frac = name => tally[name].named / PER_TEAM;
    const phases = [
      { id: 'book', name: 'The Book', stats: ['mental', 'strategic'],
        setting: 'Two readers behind two grilles, a page reference each, and a book older than the church.',
        beats: beats.book },
      { id: 'pews', name: 'The Congregation', stats: ['intuition', 'temperament'],
        setting: 'Twelve silent figures in black lace, a rule against touching, and one guess per riddle.',
        beats: _interleave(beats.pews) },
      { id: 'kneel', name: 'The Kneeling', stats: ['social', 'loyalty'],
        setting: 'The altar, one kneeler, and a team deciding in front of everyone which of them gets to feel safe.',
        beats: beats.kneel },
    ].map((ph, i) => ({ ...ph,
      teams: teams.map(t => ({ name: t.name,
        score: clamp01(i === 0 ? tally[t.name].riddles.filter(r => r.read).length / PER_TEAM * 0.8
          : i === 1 ? 0.15 + 0.85 * frac(t.name)
            : 0.3 + 0.5 * frac(t.name) + (t.name === winner ? 0.1 : 0)) })) }));
    const scored = teams.map(t => {
      const parts = phases.map(ph => ph.teams.find(x => x.name === t.name).score);
      return { name: t.name, members: [...t.members],
        perf: clamp01(parts.reduce((x, y) => x + y, 0) / parts.length + (rng() - 0.5) * PHASE_SWING) };
    });
    const nNamed = a.named + b.named;
    // THE ITEMS DECIDE THE TIER, so the summary always matches the pews:
    // eight or more named is a triumph, six a solid afternoon, two or fewer a failure.
    const q0 = missionQuality(scored[0].perf, scored[1].perf);
    const quality = nNamed >= 8 ? Math.max(0.55, q0)
      : nNamed >= 6 ? Math.min(0.54, Math.max(0.40, q0))
        : nNamed >= 3 ? Math.min(0.39, Math.max(0.15, q0 * 0.8)) : Math.min(0.14, q0 * 0.25);
    const sideObjectives = runSideObjectives(churchMatch.side, scored, rng, null);
    const pay = payPot(quality, sideObjectives.reduce((x, o) => x + o.bonus, 0));

    const playerScores = {};
    for (const n of living) playerScores[n] = Number((contrib[n] || 0).toFixed(3));
    const block = {
      offered: shieldOn, searcher: won ? won.holder : null, found: !!won, cost: 0,
      holder: won ? won.holder : null, witnesses: won ? [...won.witnesses] : [],
      visibility: won ? won.visibility : null, lines: won ? [won.seenLine] : [],
    };
    // Order the scenes the way the afternoon ran.
    const order = { book: 0, pews: 1, kneel: 2 };
    scenes.sort((x, y) => order[x.phase] - order[y.phase]);

    const rec = {
      id: 'church-match', ep: ctx.ep, name: 'Church Match',
      ceremony, briefing: briefingText(ceremony.hostBeats),
      teams: scored,
      phases,
      playerScores,
      placements: placementsFrom(playerScores),
      quality, tier: pay.tier,
      bestTeam: winner,
      potBefore: pay.potBefore, gross: pay.gross, potEarned: pay.potEarned,
      potAfter: pay.potAfter, earned: pay.potEarned,
      shields: won ? [block] : [],
      shield: block,
      sideObjectives,
      scenes,
      summary: freshPick(rng, SUMMARY[pay.tier]),
      tally: {
        perTeam: PER_TEAM, offered: shieldOn, winner,
        teams: Object.fromEntries(TEAMS.map(n => [n, { reader: tally[n].reader, named: tally[n].named,
          lost: tally[n].lost, read: tally[n].riddles.filter(r => r.read).length }])),
        masks: masks.map(m => ({ ...m })),
        votes: { ...votes },
      },
    };
    return validateMissionRecord(rec, ctx);
  },
};

export default churchMatch;
