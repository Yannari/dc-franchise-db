// ══════════════════════════════════════════════════════════════════════
// tr/missions/funeral.js — The Funeral
// ══════════════════════════════════════════════════════════════════════
//
// From the wiki (thetraitors.fandom.com/wiki/The_Funeral — UK S2 E7). The
// murder was not revealed at breakfast. The castle walked behind a hearse to
// the murdered player's grave; on the way the host read clues about who was
// safe, and whoever a clue described joined the procession in the carriage.
// The rest stepped into coffins, and the group voted on which of them had been
// murdered. A majority right earned the money. Approved mockup:
// mockup/mockup-tr-funeral.html.
//
// A FOLLOW-UP MISSION. It runs only on the afternoon after a hidden murder
// (murder variant `hidden`, js/tr/murder-variants.js), is forced by
// `runMission` when that night happened, and is not in the random pool or the
// timeline dropdown: an afternoon about a death nobody hid makes no sense.
//
// THE SHIELD IS THE FIRST LILY. Each mourner lays a lily on the coffin they
// believe holds the dead, one at a time. The first lily on the right coffin
// earns a Shield.
//
// WHAT A TRAITOR CAN DO. A Traitor knows which coffin it is. They can lay a
// lily on the wrong one to cost the pot (a nudge, never certain), and because
// they are sure they tend to walk up sooner, which is how somebody ends up
// looking too sure. Nothing here reads a player's role except through
// `ctx.conflicted`.

import {
  briefingText, clamp01, confessionalVoice, freshPick, hostDo, hostSay, PHASE_SWING,
  missionScene, missionShieldOffered, noisyPair, payPot, placementsFrom, pronounSlots,
  splitTeams, statOf, validateMissionRecord, weightedPick,
} from './contract.js';
import { gs } from '../../core.js';
import { getBond } from '../../bonds.js';
import { awardShield } from '../powers.js';
import { hiddenMurderFor } from '../murder-variants.js';

// ONE WORD, LIKE EVERY OTHER MISSION'S TEAMS ('Cinder', 'Bell', 'Ivory').
// 'Left file' read fine on this screen and nowhere else: the castle's
// mission-fallout pool says "{a} asked about {tb}'s half of {mission}", which
// came out as "asked about Right file's half of The Funeral". Two trees that
// belong in a graveyard.
const FILES = ['Willow', 'Cypress'];

// ── CLUES: every one is a true, stored fact about the person it describes ──
function _clueFor(decoy, others, mourners, rng, used = []) {
  const facts = [];
  // A seat at the table, from the fixed seating plan.
  const order = gs.tr?.castOrder || [];
  const i = order.indexOf(decoy);
  if (i >= 0) {
    const around = [order[(i + order.length - 1) % order.length], order[(i + 1) % order.length]]
      .filter(n => mourners.includes(n));
    if (around.length) {
      const nb = around[Math.floor(rng() * around.length)];
      facts.push({ kind: 'seat', text: `The one who is safe sits beside ${nb} at the Round Table.` });
    }
  }
  // Their team at the last mission.
  const prev = (gs.tr?.missions || []).slice(-1)[0];
  const t = prev && (prev.teams || []).find(x => (x.members || []).includes(decoy));
  if (t && prev.name) {
    facts.push({ kind: 'team', text: `The one who is safe was on ${t.name} at ${prev.name}.` });
  }
  // The first letter of their name, when no other missing name shares it.
  const letter = decoy[0].toUpperCase();
  if (!others.some(n => n[0].toUpperCase() === letter)) {
    facts.push({ kind: 'letter', text: `The name of the one who is safe begins with ${letter}.` });
  }
  if (!facts.length) facts.push({ kind: 'plain', text: 'The one who is safe was the last to go up to bed two nights ago.' });
  // Never the same words as an earlier clue: two true clues that read alike
  // point at nobody.
  const fresh = facts.filter(f => !used.includes(f.text));
  const pool = fresh.length ? fresh : facts;
  return pool[Math.floor(rng() * pool.length)];
}

// ══════════════════════════════════════════════════════════════════════
// THE BRIEFING
// ══════════════════════════════════════════════════════════════════════
function _ceremony(shield, missing, clues) {
  const nWord = ['no', 'one', 'two', 'three', 'four', 'five', 'six'][missing] || String(missing);
  const hostBeats = [
    hostDo('The host stands beside the hearse in a black coat.'),
    hostSay(`${nWord[0].toUpperCase() + nWord.slice(1)} of your friends were not at breakfast. One of them was murdered last night. The others are alive, and waiting.`),
    ...(clues ? [
      hostSay('As we walk, I will read you clues. Each one describes somebody who is safe. Work out who, and they will join us in the carriage.'),
      hostDo('The host walks to the head of the procession.'),
      hostSay('Get a clue wrong, and whoever it described stays in a coffin with the dead.'),
    ] : [
      hostDo('The host walks to the head of the procession.'),
      hostSay('There are no clues today. Choose wrong at the grave and the money stays in the ground.'),
    ]),
    hostSay('At the grave, each of you will lay a lily on the coffin you believe holds the murdered. If most of you are right, the money earns its place in the pot.'),
    ...(shield ? [
      hostSay('The first lily laid on the right coffin earns a Shield.'),
      hostSay('Lay it too quickly, and the others may wonder how you were so sure.'),
    ] : []),
    hostSay('Walk slowly. Begin.'),
  ];
  const at = s => hostBeats.findIndex(b => b.kind === 'say' && b.text.startsWith(s));
  return {
    ceremonyId: 'mission-brief-funeral',
    staging: 'A long avenue of yews. A glass hearse drawn by black horses, an empty carriage behind '
      + `it, and at the far end, beside an open grave, ${missing} coffins on trestles.`,
    hostBeats,
    contestantBeats: [],
    rulePoints: [
      { id: 'task', explainedByBeat: clues ? at('As we walk') : at('At the grave') },
      { id: 'failure', explainedByBeat: clues ? at('Get a clue wrong') : at('There are no clues') },
      { id: 'reward', explainedByBeat: at('At the grave') },
      ...(shield ? [
        { id: 'shield', explainedByBeat: at('The first lily') },
        { id: 'cost', explainedByBeat: at('Lay it too quickly') },
      ] : []),
      { id: 'finish', explainedByBeat: at('Walk slowly') },
    ],
    revealBeats: hostBeats.length,
    reminder: 'The host reminds the procession that a wrong clue keeps somebody in a coffin, and that '
      + 'the money comes only if most of the lilies are on the right one.',
  };
}

// ══════════════════════════════════════════════════════════════════════
// PROSE
// ══════════════════════════════════════════════════════════════════════
const SUMMARY = {
  triumph: ['Every clue answered, and most of the lilies on the right lid.',
    'The procession cleared everyone it could, and the castle knew its dead.',
    'A clean walk and a right answer at the grave.'],
  solid: ['A clue missed and a coffin too many, but most of the lilies found the right lid.',
    'Not every clue, but the right coffin when it mattered.',
    'The castle got there at the graveside, after a slow walk.'],
  scraped: ['Most of the lilies on the wrong coffin. The clues were the only money.',
    'The castle buried the wrong friend in its head, and got paid only for the walk.',
    'Right about who was safe, wrong about who was dead.'],
  failed: ['Nothing solved on the walk and the wrong coffin at the end.',
    'The money stayed in the ground.',
    'A long walk, a wrong answer, and nothing for the pot.'],
};

// ══════════════════════════════════════════════════════════════════════

export const funeral = {
  id: 'funeral',
  name: 'The Funeral',
  teams: FILES,
  followUp: true,
  side: [],
  desc: 'After a hidden murder, the castle walks behind a glass hearse along an avenue of yews to an '
    + 'open grave where the missing wait in coffins. On the way the host reads clues, each describing '
    + 'one of the missing who is safe; the players work out who it is, and that person joins the '
    + 'procession in the carriage. A wrong answer leaves that person in a coffin. At the grave each '
    + 'player lays a lily on the coffin they believe holds the murdered, and if most of the lilies '
    + 'are on the right one the afternoon pays into the pot; a wrong majority earns nothing for the '
    + 'lilies, and only the clues count.',

  eligibility(ctx) {
    return !!hiddenMurderFor(ctx?.ep) && Array.isArray(ctx?.living) && ctx.living.length >= 4;
  },

  simulate(ctx, rng) {
    const hidden = hiddenMurderFor(ctx.ep);
    if (!hidden) throw new Error('The Funeral runs only after a hidden murder');
    const living = [...ctx.living];
    const { victim } = hidden;
    const decoys = hidden.decoys.filter(n => living.includes(n));
    const mourners = living.filter(n => !decoys.includes(n));
    const teams = splitTeams(mourners, rng, FILES);
    const fileOf = n => teams.find(t => t.members.includes(n))?.name || FILES[0];
    const shieldOn = missionShieldOffered(ctx);
    const nClues = Math.max(1, decoys.length - 2);
    const ceremony = _ceremony(shieldOn, decoys.length + 1, nClues);
    const contrib = Object.fromEntries(living.map(n => [n, 0]));
    const scenes = [];
    const beats = { procession: [], lilies: [], opening: [] };
    const teamScore = Object.fromEntries(FILES.map(f => [f, { procession: 0, lilies: 0, opening: 0 }]));

    // ── PHASE I: THE PROCESSION ──────────────────────────────────────
    const order = [...decoys].sort(() => rng() - 0.5);
    const clues = [];
    let glanced = false;
    for (let k = 0; k < nClues && k < order.length; k++) {
      const about = order[k];
      const file = teams[k % teams.length];
      const solver = weightedPick(rng, file.members, n => 0.4 + statOf(n, 'intuition') / 5);
      // A clue never names the person answering it.
      const clue = _clueFor(about, decoys.filter(n => n !== about), mourners.filter(n => n !== solver),
        rng, clues.map(c => c.text));
      const v = noisyPair(rng, solver, 'intuition', 'mental', 3.0);
      const nudge = ctx.conflicted(solver) ? 0.08 : 0;
      const solved = rng() < clamp01(0.35 + 0.06 * v - nudge);
      const still = hidden.coffins.filter(n => !clues.some(c => c.solved && c.about === n));
      const wrongPool = decoys.filter(n => n !== about && still.includes(n));
      const guess = solved ? about : (wrongPool[Math.floor(rng() * wrongPool.length)] || about);
      // THE WALK ARGUES FIRST. One or two of the file call out a name before
      // the one who answers; their guesses are wrong, or they would have
      // answered.
      const voices = [];
      const others = file.members.filter(n => n !== solver);
      const nVoices = Math.min(others.length, 1 + Math.floor(rng() * 2));
      const pool = still.filter(n => n !== about && n !== guess);
      for (let j = 0; j < nVoices && pool.length; j++) {
        const by = others.splice(Math.floor(rng() * others.length), 1)[0];
        voices.push({ by, name: pool[Math.floor(rng() * pool.length)] });
      }
      clues.push({ about, kind: clue.kind, text: clue.text, solved, by: solver, file: file.name, guess, voices });
      contrib[solver] += solved ? 1.2 : -0.3;
      teamScore[file.name].procession += solved ? 1 : 0;
      beats.procession.push({
        team: file.name, player: solver, kind: solved ? 'good' : 'bad', score: v,
        text: `"${clue.text}" `
          + voices.map((g, j) => (j === 0 ? `${g.by} thought it was ${g.name}. ` : `${g.by} said ${g.name}. `)).join('')
          + (solved
            ? `${solver} said ${about}, and the carriage door opened.`
            : `${solver} was sure it meant ${guess}. It meant ${about}, who stays in a coffin.`),
      });
      // Somebody reacted too fast to a wrong guess, and somebody saw it.
      if (!solved && !glanced) {
        const others = mourners.filter(n => n !== solver);
        const reactor = weightedPick(rng, others, n => 0.3 + statOf(n, 'boldness') / 8
          + (ctx.conflicted(n) ? 0.6 : 0));
        const watcher = weightedPick(rng, others.filter(n => n !== reactor), n => 0.3 + statOf(n, 'intuition') / 5);
        if (reactor && watcher && rng() < clamp01(0.25 + 0.05 * statOf(watcher, 'intuition'))) {
          glanced = true;
          scenes.push(missionScene({
            id: 'funeral-head-shake', eventId: 'funeral-shook-head-too-soon', phase: 'procession',
            participants: [watcher, reactor], behaviour: 'suspicious',
            text: `When ${solver} said ${guess}, ${reactor} shook ${pronounSlots(reactor).their} head before anyone else could. ${watcher} saw it.`,
            effects: [
              { kind: 'claim', claimant: watcher, about: reactor,
                text: `${watcher} says ${reactor} knew ${guess} was alive`,
                source: `${reactor} shook their head at ${guess}'s name before the host did` },
              { kind: 'suspicion', observer: watcher, subject: reactor, delta: 0.2,
                source: `${reactor} seemed to know who was alive` },
            ],
            confessional: { purpose: 'belief-change', speaker: watcher,
              text: confessionalVoice(watcher, {
                neutral: `${reactor} knew it wasn't ${guess}. How would you know that?`,
                villainous: `${reactor} flinched. I'm keeping that for the table.`,
                nice: `Maybe ${reactor} just guessed. I'd really like it to be a guess.`,
              }) },
          }));
        }
      }
    }
    const cleared = clues.filter(c => c.solved).map(c => c.about);
    const coffins = hidden.coffins.filter(n => n === victim || (decoys.includes(n) && !cleared.includes(n)));

    // Somebody who will not walk to the open grave.
    const shyCand = [...mourners].sort((a, b) => statOf(a, 'boldness') - statOf(b, 'boldness'))[0];
    const shy = shyCand && mourners.length > 3 && rng() < clamp01(0.35 - 0.04 * statOf(shyCand, 'boldness'))
      ? shyCand : null;
    if (shy) {
      scenes.push(missionScene({
        id: 'funeral-would-not-look', eventId: 'funeral-stayed-at-the-gate', phase: 'procession',
        participants: [shy], behaviour: 'cowardly',
        text: `${shy} stopped at the cemetery gate and would not walk the last hundred yards to the coffins until somebody went back for ${pronounSlots(shy).them}.`,
        effects: [{ kind: 'crowd', name: shy, colour: 'cowardly', mult: 0.4, source: `${shy} would not walk up to the coffins` }],
        confessional: { purpose: 'emotional-turn', speaker: shy,
          text: confessionalVoice(shy, {
            nice: "One of those boxes has a friend in it. I couldn't be the first to look.",
            villainous: 'Let the others do the walking. I will do the watching.',
            neutral: "Coffins. Open grave. No. Give me a minute.",
          }) },
      }));
    }

    // ── PHASE II: THE LILIES ─────────────────────────────────────────
    const k = coffins.length;
    const lilies = [];
    const queue = [...mourners];
    let first = null;
    while (queue.length) {
      const who = weightedPick(rng, queue, n => 0.4 + statOf(n, 'boldness') / 6
        + (ctx.conflicted(n) ? 0.8 : 0));
      queue.splice(queue.indexOf(who), 1);
      const v = noisyPair(rng, who, 'strategic', 'social', 3.0);
      let on;
      if (ctx.conflicted(who)) {
        // They know. Most lay it true; some lay it wrong to cost the pot.
        on = rng() < 0.7 ? victim : coffins.filter(n => n !== victim)[Math.floor(rng() * (k - 1))] || victim;
      } else {
        const pRight = clamp01(1 / k + 0.07 * (v - 4));
        on = rng() < pRight ? victim : coffins.filter(n => n !== victim)[Math.floor(rng() * (k - 1))] || victim;
      }
      lilies.push({ by: who, on, order: lilies.length });
      const right = on === victim;
      contrib[who] += right ? 1 : 0;
      teamScore[fileOf(who)].lilies += right ? 1 : 0;
      if (right && !first) first = who;
    }
    const rightCount = lilies.filter(l => l.on === victim).length;
    const majority = rightCount * 2 > lilies.length;
    const tallyOn = Object.fromEntries(coffins.map(n => [n, lilies.filter(l => l.on === n).length]));
    // Not the first lily's owner: their own scene would hide this card.
    const counter = mourners.find(n => n !== first) || mourners[0];
    beats.lilies.push({
      team: fileOf(counter), player: counter, kind: 'steady', score: 5,
      text: `${lilies.length} mourners lined up at the graveside with a lily each, facing ${k} closed coffins.`,
    });

    let won = null;
    if (first) {
      contrib[first] += 1;
      if (shieldOn) won = awardShield(first, teams, ctx.ep, rng);
      const rank = lilies.findIndex(l => l.by === first);
      scenes.push(missionScene({
        id: 'funeral-first-lily', eventId: shieldOn ? 'funeral-first-lily-shield' : 'funeral-first-lily',
        phase: 'lilies', participants: [first], behaviour: 'impressive',
        text: `${first} walked ${rank === 0 ? 'straight' : 'up'} to ${victim}'s coffin and laid a lily on it`
          + (rank === 0 ? ' before anybody else had moved.' : `, the first of the lilies on that lid.`)
          + (shieldOn ? ' The host nodded, once, and handed over a Shield.' : ''),
        effects: [
          { kind: 'record', player: first, field: 'laidTheFirstLily', value: true,
            source: `${first} laid the first lily on the right coffin` },
          ...(won ? [{ kind: 'shield', player: first, source: `${first} laid the first lily on the right coffin` }] : []),
          { kind: 'crowd', name: first, colour: 'masterful', mult: 0.6, source: `${first} knew which coffin it was` },
        ],
        confessional: { purpose: 'hidden-intent', speaker: first,
          text: confessionalVoice(first, {
            neutral: "If you were them, who would you want quiet? It wasn't hard.",
            villainous: "Sure? Of course I was sure. Look how that reads now.",
            nice: "I hoped I was wrong the whole way up. I wasn't.",
          }) },
      }));
      // Too sure, too soon: somebody noticed.
      if (rank <= 1) {
        const watcher = weightedPick(rng, mourners.filter(n => n !== first), n => 0.3 + statOf(n, 'intuition') / 5);
        if (watcher && !glanced && rng() < clamp01(0.15 + 0.04 * statOf(watcher, 'intuition'))) {
          glanced = true;
          scenes.push(missionScene({
            id: 'funeral-too-sure', eventId: 'funeral-too-sure', phase: 'lilies',
            participants: [watcher, first], behaviour: 'suspicious',
            text: `${watcher} watched ${first} walk to ${victim}'s coffin without looking at the others once.`,
            effects: [
              { kind: 'suspicion', observer: watcher, subject: first, delta: 0.18,
                source: `${first} knew ${victim}'s coffin without looking at the others` },
            ],
            confessional: { purpose: 'belief-change', speaker: watcher,
              text: confessionalVoice(watcher, {
                neutral: `${first} didn't even look at the other coffins. Not once.`,
                villainous: `That was a very confident walk. I'll remember it.`,
                nice: `I want to believe ${first} just worked it out quicker than me.`,
              }) },
          }));
        }
      }
    }

    // Two mourners who chose different coffins, and said so.
    const splitPairs = [];
    for (const a of lilies) for (const b of lilies) {
      if (a.by < b.by && a.on !== b.on) splitPairs.push([a, b]);
    }
    if (splitPairs.length && rng() < 0.75) {
      splitPairs.sort((x, y) => getBond(x[0].by, x[1].by) - getBond(y[0].by, y[1].by));
      const [a, b] = splitPairs[Math.floor(rng() * Math.min(3, splitPairs.length))];
      scenes.push(missionScene({
        id: 'funeral-argument', eventId: 'funeral-argued-at-the-grave', phase: 'lilies',
        participants: [a.by, b.by],
        text: `${a.by} and ${b.by} stood between two coffins and argued in whispers. ${a.by} was sure it was ${a.on}. ${b.by} would not move from ${b.on}.`,
        effects: [{ kind: 'bond', players: [a.by, b.by], delta: -0.3, source: `${a.by} and ${b.by} argued over whose coffin it was` }],
        confessional: { purpose: 'belief-change', speaker: a.by,
          text: confessionalVoice(a.by, {
            neutral: `${b.by} dug in. I don't know if that's stubborn or something worse.`,
            villainous: `Let ${b.by} be wrong in public. It costs me nothing.`,
            nice: `I hope I'm the one who's wrong. I really do.`,
          }) },
      }));
    }
    // Where the lilies went, counted aloud, before any lid moves.
    const tallyText = coffins.map(n => `${tallyOn[n]} on ${n}`).join(', ');
    // Not the line-up card's player: a one-person scene hides their card.
    const teller = mourners.find(n => n !== counter && n !== first) || counter;
    scenes.push(missionScene({
      id: 'funeral-lilies-counted', eventId: 'funeral-lilies-counted', phase: 'lilies',
      participants: [teller],
      text: `The lilies went down one at a time. When the last was laid there were ${tallyText}, and nobody would say which lid they were most afraid of.`,
      effects: [{ kind: 'record', player: teller, field: 'countedTheLilies', value: tallyText,
        source: `the lilies were counted at the grave` }],
    }));

    // ── PHASE III: THE OPENING ───────────────────────────────────────
    const alive = coffins.filter(n => n !== victim);
    for (const d of alive) {
      beats.opening.push({ team: '', player: d, kind: 'good', score: 5,
        text: `${d}'s lid came off, and ${d} climbed out${tallyOn[d] ? `, looking at the ${tallyOn[d] === 1 ? 'lily' : 'lilies'} on the lid` : ''}.` });
    }
    // A decoy who was voted dead hands a lily back.
    const votedDead = alive.filter(d => tallyOn[d] > 0);
    if (votedDead.length) {
      const d = votedDead[Math.floor(rng() * votedDead.length)];
      const giver = lilies.find(l => l.on === d).by;
      scenes.push(missionScene({
        id: 'funeral-lily-back', eventId: 'funeral-lily-handed-back', phase: 'opening',
        participants: [d, giver], behaviour: 'selfish',
        text: `${d} picked ${giver}'s lily off the lid and handed it back without a word.`,
        effects: [{ kind: 'bond', players: [d, giver], delta: -0.4, source: `${giver} laid a lily on ${d}'s coffin` }],
        confessional: { purpose: 'emotional-turn', speaker: d,
          text: confessionalVoice(d, {
            neutral: `${giver} had me dead and buried. Good to know.`,
            villainous: `${giver} wanted me in the ground. Noted, and kept.`,
            nice: 'It was a guess. I know it was a guess. It still felt like something.',
          }) },
      }));
    }
    const closest = [...mourners].sort((a, b) => (getBond(b, victim) - getBond(a, victim)) || (a < b ? -1 : 1))[0];
    scenes.push(missionScene({
      id: 'funeral-the-dead', eventId: majority ? 'funeral-right-coffin' : 'funeral-wrong-coffin', phase: 'opening',
      participants: [closest],
      text: `The last lid came off on ${victim}'s portrait. The lilies had gone `
        + coffins.map(n => `${tallyOn[n]} on ${n}`).join(', ') + `, so ${rightCount} of ${lilies.length} were on the right coffin`
        + (majority ? ', and the money goes into the pot.' : ', not enough, and the lilies earned nothing.'),
      effects: [{ kind: 'record', player: closest, field: 'lostAFriend', value: victim,
        source: `${victim} was the one in the coffin` }],
    }));
    if (closest && getBond(closest, victim) >= 0 && rng() < clamp01(0.35 + 0.1 * getBond(closest, victim))) {
      scenes.push(missionScene({
        id: 'funeral-graveside', eventId: 'funeral-stayed-at-the-grave', phase: 'opening',
        participants: [closest], behaviour: 'heroic',
        text: `${closest} stayed at the graveside after the others had walked back, and laid a second lily for ${victim}.`,
        effects: [{ kind: 'crowd', name: closest, colour: 'kind', mult: 0.5, source: `${closest} stayed behind for ${victim}` }],
        confessional: { purpose: 'emotional-turn', speaker: closest,
          text: confessionalVoice(closest, {
            nice: `${victim} would have hated the fuss. And liked that somebody stayed.`,
            villainous: `Someone should stand there. Better it looks like me.`,
            neutral: `I wasn't ready to walk back yet. That's all.`,
          }) },
      }));
    }

    // SCORING
    for (const n of living) contrib[n] += clamp01(noisyPair(rng, n, 'temperament', 'loyalty', 3.0) / 10) * 2;
    if (!beats.opening.length) {
      beats.opening.push({ team: FILES[0], player: closest, kind: 'steady', score: 5,
        text: `Only ${victim}'s coffin was left to open.` });
    }
    const solvedN = clues.filter(c => c.solved).length;
    const allSolved = solvedN === clues.length;
    // THE LILIES AND THE CLUES DECIDE THE TIER.
    const quality = majority
      ? (allSolved ? 0.62 + 0.1 * (rightCount / lilies.length) : 0.42 + 0.1 * (rightCount / lilies.length))
      : (solvedN ? 0.18 + 0.1 * (solvedN / clues.length) : 0.05);
    const phases = [
      { id: 'procession', name: 'The Procession', stats: ['intuition', 'mental'],
        setting: 'A slow walk behind a glass hearse, and a clue at every hundred yards.',
        beats: beats.procession },
      { id: 'lilies', name: 'The Lilies', stats: ['strategic', 'social'],
        setting: `${k} closed coffins beside an open grave, and a lily in every hand.`,
        beats: beats.lilies },
      { id: 'opening', name: 'The Opening', stats: ['temperament', 'loyalty'],
        setting: 'The lids come off one at a time, and the living climb out.',
        beats: beats.opening },
    ].map(ph => ({ ...ph,
      teams: teams.map(t => ({ name: t.name,
        score: clamp01(ph.id === 'procession' ? teamScore[t.name].procession / Math.max(1, clues.length)
          : ph.id === 'lilies' ? teamScore[t.name].lilies / Math.max(1, t.members.length)
            : 0.5 + (majority ? 0.3 : 0)) })) }));
    const scored = teams.map(t => {
      const parts = phases.map(ph => ph.teams.find(x => x.name === t.name).score);
      return { name: t.name, members: [...t.members],
        perf: clamp01(parts.reduce((a, b) => a + b, 0) / parts.length + (rng() - 0.5) * PHASE_SWING) };
    });
    const pay = payPot(quality, 0);

    const playerScores = {};
    for (const n of living) playerScores[n] = Number((contrib[n] || 0).toFixed(3));
    const block = {
      offered: shieldOn, searcher: first, found: !!won, cost: 0,
      holder: won ? won.holder : null, witnesses: won ? [...won.witnesses] : [],
      visibility: won ? won.visibility : null, lines: won ? [won.seenLine] : [],
    };
    const ord = { procession: 0, lilies: 1, opening: 2 };
    scenes.sort((a, b) => ord[a.phase] - ord[b.phase]);

    const rec = {
      id: 'funeral', ep: ctx.ep, name: 'The Funeral',
      ceremony, briefing: briefingText(ceremony.hostBeats),
      teams: scored,
      phases,
      playerScores,
      placements: placementsFrom(playerScores),
      quality, tier: pay.tier,
      bestTeam: scored[0].perf >= scored[1].perf ? scored[0].name : scored[1].name,
      potBefore: pay.potBefore, gross: pay.gross, potEarned: pay.potEarned,
      potAfter: pay.potAfter, earned: pay.potEarned,
      shields: won ? [block] : [],
      shield: block,
      sideObjectives: [],
      scenes,
      summary: freshPick(rng, SUMMARY[pay.tier]),
      tally: {
        offered: shieldOn, victim, missing: [...hidden.coffins], decoys: [...decoys],
        mourners: [...mourners], clues, coffins: [...coffins], lilies,
        first, rightCount, majority, voters: lilies.length,
      },
    };
    return validateMissionRecord(rec, ctx);
  },
};

export default funeral;
