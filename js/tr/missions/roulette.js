// ══════════════════════════════════════════════════════════════════════
// tr/missions/roulette.js — The Roulette
// ══════════════════════════════════════════════════════════════════════
//
// From the wiki (thetraitors.fandom.com/wiki/Missions, /wiki/Dinner_Party):
// "There is usually one Mission per elimination cycle, although sometimes a
// Bonus Mission for more prize money is offered as well (the Roulette and
// Dinner Party Missions are the most common of these)." The Dinner Party page
// describes a lavish, boozy dinner held instead of a Round Table and used to
// spring a twist. Roulette has no page of its own, so this is the bonus night
// built out of what the two have in common: money on the table, and a room
// that has to agree what to do with it. Approved mockup:
// mockup/mockup-tr-roulette.html.
//
// WHAT IS AT STAKE IS THE NIGHT'S OWN MONEY, not the castle's savings. The
// host puts the evening's purse on the table; every spin stakes a share of
// what is left of it, a win pays that share back doubled into what they keep,
// and a loss burns it. So the room can go to bed with nothing extra, and never
// with less than it had — which is the pot contract in js/tr/missions/
// contract.js, and the only honest way to run a gamble inside it.
//
// THE SHIELD IS THE GREEN POCKET. One pocket pays no money at all: whoever
// argued the stake up that spin takes a Shield instead.
//
// WHAT A TRAITOR CAN DO. Argue for the big stake, warmly, at a table that has
// had a drink. A bold Faithful does exactly the same thing, and the table
// remembers whose idea it was either way.

import {
  briefingText, clamp01, confessionalVoice, freshPick, hostDo, hostSay, PHASE_SWING,
  missionScene, missionShieldOffered, noisyPair, payPot, placementsFrom, pronounSlots,
  render, splitTeams, statOf, validateMissionRecord, weightedPick, MISSION_MAX,
} from './contract.js';
import { getBond } from '../../bonds.js';
import { awardShield } from '../powers.js';

const TABLE = ['The Head', 'The Foot'];
const SPINS = 4;
// How much of what is left goes on the table when the room is talked into it.
const SIZES = [
  { id: 'small', share: 0.35, word: 'a third of what is left' },
  { id: 'half', share: 0.6, word: 'most of it' },
  { id: 'big', share: 0.95, word: 'every note on the table' },
];
const _gbp = n => '£' + Math.round(n).toLocaleString('en-GB');

// ══════════════════════════════════════════════════════════════════════
// THE BRIEFING
// ══════════════════════════════════════════════════════════════════════
function _ceremony(shield, purse) {
  const hostBeats = [
    hostDo('The host taps a glass with a knife until the room is quiet.'),
    hostSay(`There is ${_gbp(purse)} on this table tonight, and it is not yours yet.`),
    hostSay(`Four spins. Before each one you decide together how much of what is left goes on the wheel: `
      + 'raise your glass to stake, a hand flat over it to hold, and the majority carries.'),
    hostDo('The host sets the ball in the rim and does not spin it.'),
    hostSay('If the ball lands on the castle\'s colour, that stake comes back to you doubled. If it does '
      + 'not, it stays with me, and there is that much less to play with.'),
    ...(shield ? [
      hostSay('One pocket is green. It pays no money at all — whoever argued the stake up that spin takes '
        + 'a Shield instead.'),
      hostSay('And everybody at this table will remember who wanted the big bet.'),
    ] : []),
    hostDo('The host steps back from the trolley and lets the room look at it.'),
    hostSay('Whatever you are still holding when the wheel stops for the last time goes into the pot. Eat '
      + 'first. Then we spin.'),
  ];
  const at = s => hostBeats.findIndex(b => b.kind === 'say' && b.text.startsWith(s));
  return {
    ceremonyId: 'mission-brief-roulette',
    staging: 'A long table laid for dinner in the great hall: crystal, candles and a place for everyone '
      + 'left. Halfway through the second course a roulette wheel is pushed in on a trolley and set at '
      + 'the head of the table.',
    hostBeats,
    contestantBeats: [],
    rulePoints: [
      { id: 'task', explainedByBeat: at('Four spins') },
      { id: 'failure', explainedByBeat: at('If the ball lands') },
      { id: 'reward', explainedByBeat: at('Whatever you are still holding') },
      ...(shield ? [
        { id: 'shield', explainedByBeat: at('One pocket is green') },
        { id: 'cost', explainedByBeat: at('And everybody at this table') },
      ] : []),
      { id: 'finish', explainedByBeat: at('Whatever you are still holding') },
    ],
    revealBeats: hostBeats.length,
    reminder: 'The host reminds the table that a lost spin is money gone, and that whatever they are '
      + 'still holding at the end goes into the pot.',
  };
}

// ══════════════════════════════════════════════════════════════════════
// PROSE
// ══════════════════════════════════════════════════════════════════════
const DINNER_GOOD = [
  '{who} kept the table talking through two courses and never once looked at the wheel.',
  '{who} poured for everybody else first and asked {their} neighbour a question nobody had asked all week.',
  '{who} made the toast, and the room needed one.',
];
const DINNER_BAD = [
  '{who} had one more glass than the evening wanted and said something about the pot that did not land.',
  '{who} spent the fish course staring at the trolley and answering nobody.',
  '{who} pushed {their} plate away and said {they} could not eat with that thing in the room.',
];
const WIN_LINE = [
  'The ball came up on the castle\'s colour. {stake} came back as {back}.',
  'The wheel paid. {stake} on the table, {back} off it.',
  'It landed where they wanted it. {stake} doubled to {back}.',
];
const LOSE_LINE = [
  'The ball went into the pocket beside the castle\'s. {stake} stayed with the host.',
  'It landed wrong. {stake} gone, and the table went quiet in a way dinner had not been.',
  'The wheel took it. {stake} off the table and nothing back.',
];
const SUMMARY = {
  triumph: ['Four spins, and the table kept nearly all of it.',
    'The wheel paid and paid, and the castle went to bed richer than the afternoon left it.',
    'A bonus night that was actually a bonus.'],
  solid: ['Some won, some burned, and a decent share of the purse went into the pot.',
    'The table got out with most of what it could have lost.',
    'Two good spins carried a bad one.'],
  scraped: ['More burned than kept. The pot took the scraps.',
    'The wheel had the better of the evening.',
    'A long dinner and very little to show for it.'],
  failed: ['Every spin lost. Nothing on the table by the end.',
    'The purse went back to the host, all of it.',
    'They bet it, and the wheel took it, and that was the evening.'],
};

// ══════════════════════════════════════════════════════════════════════

export const roulette = {
  id: 'roulette',
  name: 'The Roulette',
  teams: TABLE,
  side: [
    { id: 'never-covered', label: 'raise a glass on every spin', stat: 'boldness' },
    { id: 'held-the-room', label: 'keep the table talking through the dinner', stat: 'social' },
  ],
  desc: 'A bonus night. The castle sits down to a long dinner in the great hall and a roulette wheel is '
    + 'pushed in on a trolley with the evening\'s purse stacked beside it. Four times the table decides '
    + 'together how much of the money still on it goes on the wheel — each player raises a glass to '
    + 'stake or covers it to hold, and the majority carries — and then the ball is spun. A winning spin '
    + 'pays that stake back doubled, and a losing spin burns it, so the purse shrinks as the evening '
    + 'goes on. Whatever the table is still holding when the wheel stops for the last time is what goes '
    + 'into the shared pot; on a Shield night one green pocket pays no money at all and hands a Shield '
    + 'to whoever argued that stake up.',

  eligibility(ctx) {
    return Array.isArray(ctx?.living) && ctx.living.length >= 5;
  },

  simulate(ctx, rng) {
    const living = [...ctx.living];
    const teams = splitTeams(living, rng, TABLE);
    const shieldOn = missionShieldOffered(ctx);
    const purse = MISSION_MAX;
    const ceremony = _ceremony(shieldOn, purse);
    const contrib = Object.fromEntries(living.map(n => [n, 0]));
    const scenes = [];
    const beats = { dinner: [], wheel: [], reckoning: [] };

    // ── PHASE I: THE DINNER ──────────────────────────────────────────
    for (const t of teams) {
      for (const who of t.members.slice(0, 3)) {
        const v = noisyPair(rng, who, 'social', 'temperament', 3.0);
        const good = rng() < clamp01(0.35 + 0.05 * v);
        contrib[who] += good ? 0.8 : -0.2;
        beats.dinner.push({ team: t.name, player: who, kind: good ? 'good' : 'bad', score: v,
          text: render(freshPick(rng, good ? DINNER_GOOD : DINNER_BAD), pronounSlots(who)) });
      }
    }
    // Somebody who will not touch it at all.
    const shy = [...living].sort((a, b) => statOf(a, 'boldness') - statOf(b, 'boldness'))[0];
    if (shy && rng() < clamp01(0.4 - 0.04 * statOf(shy, 'boldness'))) {
      scenes.push(missionScene({
        id: 'roulette-covered', eventId: 'roulette-covered-the-glass', phase: 'dinner',
        participants: [shy], behaviour: 'cowardly',
        text: `${shy} laid a hand flat across ${pronounSlots(shy).their} glass before the host had finished explaining the wheel, and left it there all evening.`,
        effects: [{ kind: 'crowd', name: shy, colour: 'cowardly', mult: 0.3, source: `${shy} would not stake anything at all` }],
        confessional: { purpose: 'emotional-turn', speaker: shy,
          text: confessionalVoice(shy, {
            nice: "That money's everybody's. I'm not putting it on a wheel because the wine says so.",
            villainous: "Let them gamble. I'll be the one who didn't.",
            neutral: "I don't bet. Not with my money, and definitely not with theirs.",
          }) },
      }));
    }

    // ── PHASE II: THE WHEEL ──────────────────────────────────────────
    let left = purse;      // still on the table
    let kept = 0;          // safely won
    const spins = [];
    let greenDone = false;
    let quarrel = false;
    for (let k = 0; k < SPINS && left >= 1; k++) {
      // WHO ARGUES IT UP. Bold players, and a conflicted one a little oftener:
      // the big stake is the one that can burn the night.
      const advocate = weightedPick(rng, living, n => 0.3 + statOf(n, 'boldness') / 5
        + (ctx.conflicted(n) ? 0.7 : 0));
      const av = noisyPair(rng, advocate, 'boldness', 'strategic', 3.0);
      // WHAT THEY ASK FOR. A conflicted advocate asks big more than half the
      // time; an ordinary bold one asks big about one time in six.
      const r0 = rng();
      const wants = SIZES[ctx.conflicted(advocate)
        ? (r0 < 0.42 ? 2 : r0 < 0.88 ? 1 : 0)
        : (av > 5.5 ? (r0 < 0.3 ? 2 : r0 < 0.75 ? 1 : 0) : (r0 < 0.12 ? 2 : r0 < 0.5 ? 1 : 0))];
      // THE TABLE VOTES. Bond with the advocate, nerve, and how much is left.
      const votes = {};
      for (const n of living) {
        const p = clamp01(0.54 + 0.05 * (statOf(n, 'boldness') - 5) + getBond(n, advocate) / 22
          + (ctx.conflicted(n) ? 0.2 : 0) - (wants.share > 0.5 ? 0.14 : 0));
        votes[n] = rng() < p;
      }
      const up = living.filter(n => votes[n]).length;
      const carried = up * 2 > living.length;
      // A table that will not have it still puts something on: half the small
      // stake, and the argument is on the record either way.
      const size = carried ? wants : SIZES[0];
      const stake = Math.round(left * size.share * (carried ? 1 : 0.5));
      // THE WHEEL. A green pocket once a night at most, and only with Shields on.
      const roll = rng();
      // THE HOUSE EDGE IS THE POINT. A spin pays even money and lands the
      // castle's way 49 times in 100, so the big stake is the bad bet — which
      // is what makes arguing for it a thing a Traitor can do — but not so bad
      // that an ordinary night comes home with nothing.
      const green = shieldOn && !greenDone && roll < 0.07;
      const won = !green && roll < 0.56;
      if (green) greenDone = true;
      else if (won) { kept += stake * 2; left -= stake; } else { left -= stake; }
      spins.push({ n: k + 1, advocate, size: size.id, word: size.word, stake, up,
        carried, result: green ? 'green' : won ? 'win' : 'lose', left, kept,
        stakers: living.filter(n => votes[n]) });
      contrib[advocate] += won ? 1.2 : green ? 0.6 : -0.8;
      for (const n of living) if (votes[n] === won) contrib[n] += 0.3;
      const slots = { stake: _gbp(stake), back: _gbp(stake * 2) };
      beats.wheel.push({ team: teams[k % teams.length].name, player: advocate,
        kind: green ? 'steady' : won ? 'good' : 'bad', score: av,
        text: `${advocate} argued for ${size.word}, and `
          + (carried ? `${up} glasses went up. ` : `the table talked it down to ${_gbp(stake)}. `)
          + (green ? 'The ball dropped into the green, and no money moved at all.'
            : render(freshPick(rng, won ? WIN_LINE : LOSE_LINE), slots)) });
      // The green pocket hands a Shield to whoever argued it up.
      if (green) {
        const shieldRec = awardShield(advocate, teams, ctx.ep, rng);
        scenes.push(missionScene({
          id: 'roulette-green', eventId: 'roulette-green-pocket', phase: 'wheel',
          participants: [advocate], behaviour: 'impressive',
          text: `The ball came to rest in the green pocket. No money moved. The host put a Shield on the cloth in front of ${advocate}, who had just talked the table into ${size.word}.`,
          effects: [
            { kind: 'record', player: advocate, field: 'tookTheGreenPocket', value: true,
              source: `${advocate} argued the stake up on the green spin` },
            { kind: 'shield', player: advocate, source: `the green pocket paid ${advocate} a Shield` },
            { kind: 'crowd', name: advocate, colour: 'masterful', mult: 0.6, source: `${advocate} came out of the spin with a Shield` },
          ],
          confessional: { purpose: 'hidden-intent', speaker: advocate,
            text: confessionalVoice(advocate, {
              nice: "I wanted the money for us and I've come away with a Shield for me. I know how that looks.",
              villainous: "I asked for the biggest bet in the room and the room's handed me a Shield for it.",
              neutral: "Green. Of all the pockets. I'm not giving it back.",
            }) },
        }));
        spins[spins.length - 1].shield = shieldRec ? shieldRec.holder : advocate;
      }
      // Somebody who voted the other way says so, once a night.
      if (!quarrel && !won && !green && carried) {
        const against = living.filter(n => !votes[n] && n !== advocate);
        if (against.length) {
          quarrel = true;
          const cross = weightedPick(rng, against, n => 0.3 + statOf(n, 'strategic') / 6);
          scenes.push(missionScene({
            id: 'roulette-quarrel', eventId: 'roulette-argued-the-stake-up', phase: 'wheel',
            participants: [cross, advocate], behaviour: 'suspicious',
            text: `${cross} had kept a hand flat over ${pronounSlots(cross).their} glass and said so afterwards: ${advocate} had argued ${_gbp(stake)} onto the wheel and it had gone.`,
            effects: [
              { kind: 'claim', claimant: cross, about: advocate,
                text: `${cross} says ${advocate} pushed the stake that burned ${_gbp(stake)}`,
                source: `${advocate} talked the table into ${size.word} and the spin lost` },
              { kind: 'suspicion', observer: cross, subject: advocate, delta: 0.18,
                source: `${advocate} wanted the big bet with the castle's money` },
              { kind: 'bond', players: [cross, advocate], delta: -0.5,
                source: `${advocate} lost ${_gbp(stake)} that ${cross} did not want staked` },
            ],
            confessional: { purpose: 'belief-change', speaker: cross,
              text: confessionalVoice(cross, {
                neutral: `${advocate} argued for that like it wasn't anybody's money. It's all of ours.`,
                villainous: `${advocate}'s just handed me a name for the table. Generous.`,
                nice: `I don't think ${advocate} meant it. I keep telling myself that.`,
              }) },
          }));
        }
      }
    }

    // ── PHASE III: THE RECKONING ─────────────────────────────────────
    // THE PURSE IS THE CEILING. A winning spin buys back what earlier spins
    // burned; it cannot conjure money the host never put on the table.
    const finalKept = Math.min(purse, kept + left);
    const lost = purse - finalKept;
    const biggest = spins.reduce((a, s) => (a && a.stake >= s.stake ? a : s), null);
    beats.reckoning.push({ team: TABLE[0], player: living[0], kind: finalKept > purse / 2 ? 'good' : 'bad', score: 5,
      text: `${_gbp(finalKept)} of the ${_gbp(purse)} on the table went into the pot`
        + (lost > 0 ? `. ${_gbp(lost)} stayed with the host.` : ', every note of it.') });
    const loudest = spins.filter(s => s.result === 'lose')
      .sort((a, b) => b.stake - a.stake)[0];
    if (loudest) {
      const mourner = weightedPick(rng, living.filter(n => n !== loudest.advocate),
        n => 0.3 + statOf(n, 'loyalty') / 6);
      if (mourner && rng() < 0.7) {
        scenes.push(missionScene({
          id: 'roulette-stood-by', eventId: 'roulette-stood-by-the-bet', phase: 'reckoning',
          participants: [mourner, loudest.advocate], behaviour: 'heroic',
          text: `${mourner} said out loud that ${loudest.advocate} should not carry the ${_gbp(loudest.stake)} spin alone, and that every glass that went up went up on its own.`,
          effects: [
            { kind: 'bond', players: [mourner, loudest.advocate], delta: 0.5,
              source: `${mourner} stood by ${loudest.advocate} after the losing spin` },
            { kind: 'crowd', name: mourner, colour: 'kind', mult: 0.5, source: `${mourner} took the blame off ${loudest.advocate}` },
          ],
        }));
      }
    }
    // THE NIGHT'S BIGGEST SPIN always gets its scene: every other one here is
    // optional, and a mission with no scenes at all is not a night.
    if (biggest) {
      const watchers = living.filter(n => n !== biggest.advocate);
      const closest = watchers.sort((a, b) => getBond(b, biggest.advocate) - getBond(a, biggest.advocate))[0];
      scenes.push(missionScene({
        id: 'roulette-biggest', eventId: 'roulette-the-big-spin', phase: 'reckoning',
        participants: closest ? [biggest.advocate, closest] : [biggest.advocate],
        behaviour: biggest.result === 'win' ? 'impressive' : 'selfish',
        text: `The biggest bet of the night was ${biggest.advocate}'s: ${_gbp(biggest.stake)} on one spin, `
          + `with ${biggest.up} glasses up for it. It ${biggest.result === 'win' ? 'came back doubled'
            : biggest.result === 'green' ? 'landed in the green and paid nothing' : 'went to the host'}.`,
        effects: [
          { kind: 'crowd', name: biggest.advocate,
            colour: biggest.result === 'win' ? 'masterful' : 'selfish',
            mult: 0.5, source: `${biggest.advocate} argued ${_gbp(biggest.stake)} onto the wheel` },
          { kind: 'record', player: biggest.advocate, field: 'theBiggestBet', value: biggest.stake,
            source: `${biggest.advocate} pushed the night's biggest stake` },
        ],
        confessional: { purpose: 'hidden-intent', speaker: biggest.advocate,
          text: confessionalVoice(biggest.advocate, {
            neutral: "Somebody's got to say a number. I said a number.",
            villainous: "I said a number. The glasses went up on their own, and that's what I'll be saying at the table.",
            nice: "I thought we needed it. If that's wrong, it was wrong out loud.",
          }) },
      }));
    }
    const tallyUp = Object.fromEntries(living.map(n => [n, spins.filter(s => s.stakers.includes(n)).length]));
    const boldest = living.filter(n => tallyUp[n] === spins.length);
    if (boldest.length) {
      const who = boldest[Math.floor(rng() * boldest.length)];
      scenes.push(missionScene({
        id: 'roulette-every-glass', eventId: 'roulette-raised-every-glass', phase: 'reckoning',
        participants: [who],
        text: `${who} had raised a glass on all ${spins.length} spins, and said at the end that ${pronounSlots(who).they} would do it again tomorrow.`,
        effects: [{ kind: 'record', player: who, field: 'raisedEveryGlass', value: true,
          source: `${who} staked on every spin of the night` }],
      }));
    }

    // SCORING
    for (const n of living) contrib[n] += clamp01(noisyPair(rng, n, 'loyalty', 'intuition', 3.0) / 10) * 2;
    const share = clamp01(finalKept / purse);
    const phases = [
      { id: 'dinner', name: 'The Dinner', stats: ['social', 'temperament'],
        setting: 'Two courses, a lot of wine, and a wheel nobody can stop looking at.',
        beats: beats.dinner },
      { id: 'wheel', name: 'The Wheel', stats: ['boldness', 'strategic'],
        setting: 'Four spins, and a show of glasses before each one.',
        beats: beats.wheel },
      { id: 'reckoning', name: 'The Reckoning', stats: ['loyalty', 'intuition'],
        setting: 'The trolley wheeled out, the glasses refilled, and a table doing arithmetic it does not like.',
        beats: beats.reckoning },
    ].map(ph => ({ ...ph,
      teams: teams.map(t => ({ name: t.name,
        score: clamp01(ph.id === 'wheel' ? share
          : 0.4 + 0.2 * (t.members.reduce((a, n) => a + (contrib[n] || 0), 0) / Math.max(1, t.members.length))) })) }));
    const scored = teams.map(t => {
      const parts = phases.map(ph => ph.teams.find(x => x.name === t.name).score);
      return { name: t.name, members: [...t.members],
        perf: clamp01(parts.reduce((a, b) => a + b, 0) / parts.length + (rng() - 0.5) * PHASE_SWING) };
    });
    // THE MONEY IS THE MONEY. The night's quality is the share of the purse the
    // table is still holding, not a stat blend: the wheel decided it in public.
    const quality = clamp01(share);
    const pay = payPot(quality, 0);

    const playerScores = {};
    for (const n of living) playerScores[n] = Number((contrib[n] || 0).toFixed(3));
    const greenSpin = spins.find(s => s.result === 'green');
    const holder = greenSpin ? greenSpin.shield : null;
    const block = {
      offered: shieldOn, searcher: holder, found: !!holder, cost: 0,
      holder, witnesses: [], visibility: holder ? 'all' : null, lines: [],
    };
    const ord = { dinner: 0, wheel: 1, reckoning: 2 };
    scenes.sort((a, b) => ord[a.phase] - ord[b.phase]);

    const rec = {
      id: 'roulette', ep: ctx.ep, name: 'The Roulette',
      ceremony, briefing: briefingText(ceremony.hostBeats),
      teams: scored,
      phases,
      playerScores,
      placements: placementsFrom(playerScores),
      quality, tier: pay.tier,
      bestTeam: scored[0].perf >= scored[1].perf ? scored[0].name : scored[1].name,
      potBefore: pay.potBefore, gross: pay.gross, potEarned: pay.potEarned,
      potAfter: pay.potAfter, earned: pay.potEarned,
      shields: holder ? [block] : [],
      shield: block,
      sideObjectives: [],
      scenes,
      summary: freshPick(rng, SUMMARY[pay.tier]),
      tally: {
        offered: shieldOn, purse, spins, kept: finalKept, burned: lost,
        table: living.map(n => ({ n, up: tallyUp[n] })),
        green: greenSpin ? greenSpin.n : null, holder,
      },
    };
    return validateMissionRecord(rec, ctx);
  },
};

export default roulette;
