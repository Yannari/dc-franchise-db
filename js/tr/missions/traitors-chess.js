// ══════════════════════════════════════════════════════════════════════
// tr/missions/traitors-chess.js — The Traitors' Chess
// ══════════════════════════════════════════════════════════════════════
//
// From the wiki (thetraitors.fandom.com/wiki/Chess — UK S3 ep 10). The night
// before, the Traitors answered five questions about the players. On a board
// with everybody's name on it, the group puts each question's piece on the
// name it thinks the Traitors chose. Right: the statue knocks the piece over
// (money). Wrong: the statue stands on the name the Traitors wrote. Approved
// mockup: mockup/mockup-tr-traitors-chess.html.
//
// ONE ROOM, TWO HALVES. The show plays it as one group; the contract scores
// two to four teams, so the room argues in two halves and settles each answer
// together. Both halves share every answer.
//
// THE DILEMMA IS THE TRAITORS'. They know the answers. A Traitor who PRESSES
// steers the room right and may be seen being too sure; one who HOLDS back
// costs the room and may be seen going quiet. A Faithful who happens to be
// sure, or quiet, reads exactly the same, which is where the false positives
// come from. Nudges, never switches.
//
// THE SHIELD IS THE GAMBIT. Once, one player may take the lamb question from
// the room and answer it alone. Right: the money and a Shield. Wrong: that
// money is gone. A Traitor who takes it knows the answer, and is not certain
// to give it: winning a Shield in front of everybody is its own tell.
//
// THE TIER FOLLOWS THE BOARD: five right is a triumph, three or four solid,
// one or two scraped, none failed. The summary cannot contradict the count.

import {
  briefingText, clamp01, confessionalVoice, freshPick, hostDo, hostSay, PHASE_SWING,
  missionQuality, missionScene, missionShieldOffered, noisyPair, payPot, placementsFrom,
  pronounSlots, render, splitTeams, statOf, validateMissionRecord, weightedPick,
  runSideObjectives, shieldCostOf,
} from './contract.js';
import { awardShield } from '../powers.js';

const TEAMS = ['Ivory', 'Obsidian'];

/** The five questions, what each asks, and what the Traitors lean on to answer it. */
const QUESTIONS = [
  { piece: 'wolf', ask: 'Who leads the pack?', label: 'pack', phase: 'pack',
    lean: n => statOf(n, 'social') + statOf(n, 'boldness') },
  { piece: 'fox', ask: 'Who is the most cunning?', label: 'cunning', phase: 'pack',
    lean: n => statOf(n, 'strategic') * 2 },
  { piece: 'owl', ask: 'Who notices the most?', label: 'watchful', phase: 'owl',
    lean: n => statOf(n, 'intuition') * 2 },
  { piece: 'lamb', ask: 'Who would you never suspect?', label: 'innocent', phase: 'owl',
    lean: n => (10 - statOf(n, 'boldness')) + statOf(n, 'loyalty') },
  { piece: 'crown', ask: 'Who will win?', label: 'winner', phase: 'crown',
    lean: n => statOf(n, 'strategic') + statOf(n, 'social') },
];

// ══════════════════════════════════════════════════════════════════════
// THE BRIEFING
// ══════════════════════════════════════════════════════════════════════
function _ceremony(shield) {
  const hostBeats = [
    hostDo('The host walks the length of the board and stops beside the hooded statue.'),
    hostSay('Last night, while you slept, the Traitors answered five questions about you.'),
    hostSay('For each question you will choose one of these pieces and put it on the square of the '
      + 'person you think they named. You decide together, and one of you moves it.'),
    hostDo('The host rests a hand on the statue\'s shoulder.'),
    hostSay('Then this moves. If you are right, it knocks your piece over. If you are wrong, it '
      + 'stands on the name the Traitors actually wrote. Every right answer earns money for the pot.'),
    ...(shield ? [
      hostSay('Once, and only once, one of you may step onto the board and take a question from the '
        + 'rest of you to answer alone.'),
      hostSay('Answer it right and the money goes to the pot and a Shield is yours to keep. Answer it '
        + 'wrong and that money is gone.'),
    ] : []),
    hostDo('The host steps back off the board.'),
    hostSay('The Traitors among you already know every answer. Watch who seems to. Begin.'),
  ];
  const at = s => hostBeats.findIndex(b => b.kind === 'say' && b.text.startsWith(s));
  return {
    ceremonyId: 'mission-brief-traitors-chess',
    staging: 'A long hall with a chessboard for a floor. Every square has a player\'s name on it, and '
      + 'at the far end, on the black side, stands a hooded bronze figure.',
    hostBeats,
    contestantBeats: [],
    rulePoints: [
      { id: 'task', explainedByBeat: at('For each question') },
      { id: 'failure', explainedByBeat: at('Then this moves') },
      { id: 'reward', explainedByBeat: at('Then this moves') },
      ...(shield ? [
        { id: 'shield', explainedByBeat: at('Once, and only once') },
        { id: 'cost', explainedByBeat: at('Answer it right') },
      ] : []),
      { id: 'finish', explainedByBeat: at('The Traitors among you') },
    ],
    revealBeats: hostBeats.length,
    reminder: 'The host reminds the room that the statue knocks a right piece over and stands on the '
      + 'true name when they are wrong, and that the Traitors already know every answer.',
  };
}

// ══════════════════════════════════════════════════════════════════════
// PROSE
// ══════════════════════════════════════════════════════════════════════
const ARGUE_RIGHT = [
  '“{ask}” {who} said the Traitors would name {guess}, and made the case well enough that nobody argued. The {piece} went on {guess}.',
  '“{ask}” {who} kept coming back to {guess} until the others stopped arguing. The {piece} went on {guess}.',
  '“{ask}” {who} called {guess} straight away and the room went with it. The {piece} went on {guess}.',
];
const ARGUE_WRONG = [
  '“{ask}” {who} argued for {guess} for five minutes and the room gave in to make {them} stop. The {piece} went on {guess}.',
  '“{ask}” {who} was certain it was {guess}, and certain was enough for the room. The {piece} went on {guess}.',
  '“{ask}” {who} talked the room past three better names and onto {guess}. The {piece} went on {guess}.',
];
const REVEAL_RIGHT = [
  'The statue turned, slid across the board, and knocked the {piece} off {truth}\'s square.',
  'The statue stopped at {truth} and tipped the {piece} over. Right.',
];
const REVEAL_WRONG = [
  'The statue passed {guess}\'s square and stood on {truth}\'s. Wrong. The Traitors meant {truth}, and {truth} heard it in front of the whole board.',
  'The {piece} stayed standing on {guess}. The statue stood on {truth} instead.',
];
const SUMMARY = {
  triumph: ['Five of five. The room read the Traitors perfectly, which is its own kind of worrying.',
    'Every piece knocked over. Somebody in that room knew a lot, and everybody noticed.',
    'A clean board and a full payout, and a room that now wonders how.'],
  solid: ['More right than wrong, money for the pot, and two or three people now watching the ones who seemed to know.',
    'A decent board. The wrong answers said more about the Traitors than the right ones did.',
    'Enough right to be paid, and enough wrong that the statue named names.'],
  scraped: ['Mostly wrong. The statue spent the afternoon standing on the names the room had not thought of.',
    'A poor board and a little money, and a lot of people told what the Traitors think of them.',
    'The room could not think like its murderers, which is almost reassuring.'],
  failed: ['Not one right. The statue stood on a different name every time.',
    'Five pieces, five wrong squares, nothing for the pot.',
    'The room did not read the Traitors once. Somebody may have made sure of that.'],
};

// ══════════════════════════════════════════════════════════════════════

export const traitorsChess = {
  id: 'traitors-chess',
  name: 'The Traitors\' Chess',
  teams: TEAMS,
  side: [
    { id: 'called-it-first', label: 'call a right answer before anybody else spoke', stat: 'intuition' },
    { id: 'moved-the-piece', label: 'walk the piece onto the square with the whole room watching', stat: 'boldness' },
  ],
  desc: 'A long hall has a chessboard for a floor, with every player\'s name on a square and a '
    + 'hooded bronze statue at the far end. The night before, the Traitors answered five questions '
    + 'about the players; the group now argues each question and one player moves that question\'s '
    + 'piece onto the name they think the Traitors chose. If the room is right the statue knocks '
    + 'the piece over and the answer pays into the shared pot; if it is wrong the statue stands on '
    + 'the name the Traitors actually wrote and that answer earns nothing. On a Shield afternoon one '
    + 'player may take a question from the room to answer alone, winning a Shield if right and '
    + 'losing that money if wrong. The Traitors in the room know every answer, and have to decide '
    + 'how much to help without being seen to know.',

  eligibility(ctx) {
    return Array.isArray(ctx?.living) && ctx.living.length >= 5;
  },

  simulate(ctx, rng) {
    const living = [...ctx.living];
    const teams = splitTeams(living, rng, TEAMS);
    const shieldOn = missionShieldOffered(ctx);
    const ceremony = _ceremony(shieldOn);
    const contrib = Object.fromEntries(living.map(n => [n, 0]));
    const scenes = [];
    const beatsBy = { pack: [], owl: [], crown: [] };

    // THE TRAITORS' DILEMMA, decided once each for the afternoon.
    const stance = {};
    for (const n of living) {
      if (!ctx.conflicted(n)) continue;
      const pHold = clamp01(0.35 + 0.5 * (statOf(n, 'strategic') / 10) - 0.3 * (statOf(n, 'boldness') / 10));
      stance[n] = rng() < pHold ? 'held' : 'pressed';
    }
    const pressers = Object.keys(stance).filter(n => stance[n] === 'pressed').length;
    const holders = Object.keys(stance).filter(n => stance[n] === 'held').length;

    // THE ROOM'S READ: its best readers, plus what the Traitors do with it.
    const roomRead = living.reduce((a, n) => a + statOf(n, 'intuition') + statOf(n, 'social'), 0)
      / (living.length * 20);
    // A presser can only nudge the room so far (and pays for it in tells); a
    // holder costs it more, and more holders cost more. Net, a room with
    // Traitors in it reads the Traitors worse than a room without.
    const pRight = clamp01(0.36 + 0.3 * roomRead + Math.min(0.04, 0.02 * pressers)
      - Math.min(0.2, 0.06 * holders));

    // THE GAMBIT, decided before the lamb is argued.
    let gambit = null;
    if (shieldOn) {
      const who = weightedPick(rng, living,
        n => 0.2 + 0.9 * (statOf(n, 'boldness') / 10) * (1 - 0.5 * (statOf(n, 'loyalty') / 10)));
      const steps = rng() < clamp01(0.35 + 0.05 * statOf(who, 'boldness'));
      const knows = ctx.conflicted(who);
      const right = rng() < clamp01(0.25 + 0.04 * statOf(who, 'intuition') + (knows ? 0.3 : 0));
      if (steps) gambit = { who, right };
    }

    const asked = [];
    for (const q of QUESTIONS) {
      // What the Traitors wrote, weighted on what they would lean on.
      const truth = weightedPick(rng, living, n => 1 + q.lean(n));
      const alone = q.piece === 'lamb' && gambit;
      const right = alone ? gambit.right : rng() < pRight;
      const pool = living.filter(n => n !== truth);
      const guess = right ? truth : weightedPick(rng, pool, n => 1 + q.lean(n));
      // Who carried the argument, weighted on boldness; a presser leans in.
      const arguer = alone ? gambit.who
        : weightedPick(rng, living, n => 0.5 + statOf(n, 'boldness') / 5 + (stance[n] === 'pressed' ? 1.2 : 0));
      const phaseKey = q.phase;
      const slots = { ...pronounSlots(arguer), ask: q.ask, guess, truth, piece: q.piece };
      contrib[arguer] += right ? 1.6 : -0.4;
      if (!alone) {
        beatsBy[phaseKey].push({ team: _teamOf(teams, arguer), player: arguer,
          kind: right ? 'strong' : 'weak', score: right ? 7 : 3,
          text: render(freshPick(rng, right ? ARGUE_RIGHT : ARGUE_WRONG), slots) });
        beatsBy[phaseKey].push({ team: _teamOf(teams, truth), player: truth,
          kind: right ? 'right' : 'wrong', score: right ? 7 : 3,
          text: render(freshPick(rng, right ? REVEAL_RIGHT : REVEAL_WRONG), slots) });
      }
      asked.push({ piece: q.piece, ask: q.ask, label: q.label, phase: phaseKey,
        truth, guess, right, by: arguer, gambit: !!alone });
    }

    // THE GAMBIT'S OWN SCENE, and the Shield.
    let won = null;
    const lamb = asked.find(a => a.piece === 'lamb');
    if (gambit) {
      const slots = pronounSlots(gambit.who);
      won = gambit.right ? awardShield(gambit.who, teams, ctx.ep, rng) : null;
      const effects = [
        { kind: 'record', player: gambit.who, field: 'tookTheGambit', value: gambit.right,
          source: `${gambit.who} took the lamb question from the room and answered it alone` },
        { kind: 'crowd', name: gambit.who, colour: gambit.right ? 'masterful' : 'selfish', mult: 0.8,
          source: `${gambit.who} played the Gambit` },
      ];
      if (won) effects.push({ kind: 'shield', player: gambit.who, source: `${gambit.who} won the Gambit` });
      scenes.push(missionScene({
        id: 'chess-gambit', eventId: gambit.right ? 'chess-gambit-won' : 'chess-gambit-lost',
        phase: 'owl', participants: lamb.guess !== gambit.who ? [gambit.who, lamb.guess] : [gambit.who],
        behaviour: gambit.right ? 'impressive' : 'selfish',
        text: `“${lamb.ask}” ${gambit.who} stepped onto the board before anybody had started arguing, `
          + `picked up the lamb, and put it on ${lamb.guess}. `
          + (gambit.right
            ? `The statue knocked it off ${lamb.truth}'s square. The money went to the pot, and the Shield went to ${gambit.who}, in front of everybody.`
            : `The statue stood on ${lamb.truth}. That question's money was gone, and ${gambit.who} had spent it alone.`),
        effects,
        confessional: { purpose: 'hidden-intent', speaker: gambit.who,
          text: gambit.right
            ? confessionalVoice(gambit.who, {
                villainous: "Everyone watched me win it. Let them wonder how I was so sure.",
                nice: "I just had a feeling about it. And now I'm safe for a night, which I needed.",
                neutral: "I backed myself. It paid. That's the game.",
              })
            : confessionalVoice(gambit.who, {
                villainous: "Wrong. Fine. At least nobody can say I knew the answers.",
                nice: "I cost the pot two thousand pounds on a hunch. I feel sick about it.",
                neutral: "High risk, and it didn't come in. I'd still take the swing.",
              }) },
      }));
    }

    // THE TELLS. The surest arguer who was right, read as too sure; the
    // quietest player on a room that talked, read as knowing. One each.
    const rightQs = asked.filter(a => a.right && !a.gambit);
    const byRight = rightQs.map(a => a.by);
    if (byRight.length) {
      const sure = weightedPick(rng, [...new Set(byRight)],
        n => 0.4 + statOf(n, 'boldness') / 8 + (stance[n] === 'pressed' ? 1.5 : 0));
      // Filed under the phase of the answer they were sure of.
      const sureOn = rightQs.find(a => a.by === sure);
      const observers = living.filter(n => n !== sure);
      const obs = weightedPick(rng, observers, n => 0.3 + statOf(n, 'intuition') / 6);
      if (obs && rng() < clamp01(0.35 + 0.05 * statOf(obs, 'intuition'))) {
        scenes.push(missionScene({
          id: 'chess-too-sure', eventId: 'chess-too-sure', phase: sureOn.phase,
          participants: [obs, sure], behaviour: 'suspicious',
          text: `${sure} named ${sureOn.truth} for the ${sureOn.piece} before anybody else had spoken, and held to it through four other names. ${obs} watched ${pronounSlots(sure).them} do it.`,
          effects: [
            { kind: 'claim', claimant: obs, about: sure,
              text: `${obs} says ${sure} knew the Traitors' answers too well`,
              source: `${sure} was sure of an answer only the Traitors could know` },
            { kind: 'suspicion', observer: obs, subject: sure, delta: 0.3,
              source: `${sure} was right too quickly on the chessboard` },
          ],
          confessional: { purpose: 'belief-change', speaker: obs,
            text: confessionalVoice(obs, {
              neutral: "Nobody's that sure about what the Traitors think. Unless they were in the room.",
              villainous: 'Too sure, too fast. I will say that out loud at the table.',
              nice: "Maybe they're just good at reading people. I hope that's all it is.",
            }) },
        }));
      }
    }
    const arguers = new Set(asked.map(a => a.by));
    const quiet = living.filter(n => !arguers.has(n));
    if (quiet.length) {
      const q = weightedPick(rng, quiet, n => 0.4 + (10 - statOf(n, 'boldness')) / 8 + (stance[n] === 'held' ? 1.5 : 0));
      const obs = weightedPick(rng, living.filter(n => n !== q), n => 0.3 + statOf(n, 'intuition') / 6);
      if (obs && rng() < clamp01(0.25 + 0.04 * statOf(obs, 'intuition'))) {
        scenes.push(missionScene({
          id: 'chess-went-quiet', eventId: 'chess-went-quiet', phase: 'crown',
          participants: [obs, q], behaviour: 'suspicious',
          text: `${q} said nothing all afternoon. ${obs} noticed that the one person who never guessed was the one person who never got a guess wrong.`,
          effects: [
            { kind: 'claim', claimant: obs, about: q,
              text: `${obs} says ${q} stayed out of a game only a Traitor could play safely`,
              source: `${q} never guessed on the chessboard` },
            { kind: 'suspicion', observer: obs, subject: q, delta: 0.22,
              source: `${q} kept out of every question on the chessboard` },
          ],
          confessional: { purpose: 'belief-change', speaker: obs,
            text: confessionalVoice(obs, {
              neutral: "If you know the answers, the safest thing to do is not play. They didn't play.",
              villainous: 'Silence is a choice. I will make sure the table hears about that choice.',
              nice: "Some people are just quiet. I'm trying to remember that.",
            }) },
        }));
      }
    }

    // SOMEBODY HELD THE LINE on a right answer against a room that wanted to
    // move it: at most once, and only if they were right.
    const stood = asked.find(a => a.right && !a.gambit && rng() < clamp01(0.3 + 0.04 * statOf(a.by, 'temperament')));
    if (stood) {
      contrib[stood.by] += 0.8;
      scenes.push(missionScene({
        id: 'chess-held-the-line', eventId: 'chess-held-the-line', phase: stood.phase,
        participants: stood.guess !== stood.by ? [stood.by, stood.guess] : [stood.by], behaviour: 'heroic',
        text: `Half the room wanted the ${stood.piece} moved off ${stood.guess}. ${stood.by} stood on the square and would not let them, and the statue proved ${pronounSlots(stood.by).them} right.`,
        effects: [
          { kind: 'crowd', name: stood.by, colour: 'heroic', mult: 0.5,
            source: `${stood.by} kept the ${stood.piece} on ${stood.guess} against the room` },
        ],
      }));
    }

    // NOBODY WANTS TO MOVE THE CROWN, sometimes.
    const crown = asked.find(a => a.piece === 'crown');
    const shy = weightedPick(rng, living.filter(n => n !== crown.by),
      n => 0.3 + (10 - statOf(n, 'boldness')) / 6);
    if (rng() < clamp01(0.3 - 0.02 * statOf(shy, 'boldness'))) {
      scenes.push(missionScene({
        id: 'chess-would-not-move', eventId: 'chess-would-not-move-the-crown', phase: 'crown',
        participants: [shy, crown.by], behaviour: 'cowardly',
        text: `The room asked ${shy} to carry the crown out. ${shy} would not step onto the board, and ${crown.by} had to.`,
        effects: [
          { kind: 'crowd', name: shy, colour: 'cowardly', mult: 0.4, source: `${shy} would not step onto the board with the crown` },
        ],
      }));
    }

    // THE CROWN IS ALWAYS NEWS: whatever the room guessed, everybody now
    // knows who the Traitors think wins.
    scenes.push(missionScene({
      id: 'chess-the-crown', eventId: 'chess-traitors-name-a-winner', phase: 'crown',
      participants: crown.by !== crown.truth ? [crown.truth, crown.by] : [crown.truth],
      text: crown.right
        ? `The crown fell on ${crown.truth}'s square, as the room had guessed. The Traitors think ${crown.truth} wins, and now so does everyone else.`
        : `The statue stood on ${crown.truth}. The Traitors think ${crown.truth} wins. ${crown.truth} laughed longer than the joke deserved.`,
      effects: [
        { kind: 'crowd', name: crown.truth, colour: 'exposed', mult: 0.4,
          source: `the Traitors named ${crown.truth} as the likely winner` },
      ],
    }));

    // SCORING. Each phase: the players' own read plus how the room did on it.
    const phaseDefs = [
      { id: 'pack', name: 'The Pack', stats: ['social', 'intuition'],
        setting: 'The wolf and the fox, and a room trying to think like the people who want it dead.' },
      { id: 'owl', name: 'The Owl and the Lamb', stats: ['mental', 'boldness'],
        setting: 'Two harder questions, and the one the room may not get to answer at all.' },
      { id: 'crown', name: 'The Crown', stats: ['strategic', 'temperament'],
        setting: 'The last piece, and the question nobody wants to be seen answering well.' },
    ];
    const ROLL = {
      pack: n => noisyPair(rng, n, 'social', 'intuition', 3.2),
      owl: n => noisyPair(rng, n, 'mental', 'boldness', 3.2),
      crown: n => noisyPair(rng, n, 'strategic', 'temperament', 3.2),
    };
    const phases = phaseDefs.map(def => {
      const share = asked.filter(a => a.phase === def.id);
      const frac = share.length ? share.filter(a => a.right).length / share.length : 0;
      const pc = {};
      for (const n of living) {
        const v = ROLL[def.id](n);
        pc[n] = clamp01(v / 10) * 10;
        contrib[n] += pc[n];
      }
      const beats = beatsBy[def.id].length ? beatsBy[def.id]
        : [{ team: TEAMS[0], player: living[0], kind: 'steady', score: 5,
          text: 'The room argued this one out together.' }];
      return { ...def, beats,
        teams: teams.map(t => ({ name: t.name,
          score: clamp01(0.4 * t.members.reduce((a, n) => a + pc[n], 0) / Math.max(1, t.members.length) / 10 + 0.6 * frac) })) };
    });

    const base = teams.map(t => {
      const parts = phases.map(ph => ph.teams.find(x => x.name === t.name).score);
      return { name: t.name, members: [...t.members],
        perf: clamp01(parts.reduce((a, b) => a + b, 0) / parts.length + (rng() - 0.5) * PHASE_SWING) };
    });
    const nRight = asked.filter(a => a.right).length;
    const band = q => (nRight === 5 ? Math.max(0.55, q) : nRight >= 3 ? Math.min(0.54, Math.max(0.4, q))
      : nRight >= 1 ? Math.min(0.39, Math.max(0.15, q * 0.8)) : Math.min(0.14, q * 0.3));
    const quality = band(missionQuality(base[0].perf, base[1].perf));
    const sideObjectives = runSideObjectives(traitorsChess.side, base, rng, gambit ? gambit.who : null);
    const pay = payPot(quality, sideObjectives.reduce((a, o) => a + o.bonus, 0));

    const playerScores = {};
    for (const n of living) playerScores[n] = Number((contrib[n] || 0).toFixed(3));

    const block = {
      offered: shieldOn,
      searcher: gambit ? gambit.who : null, found: !!won, cost: 0,
      holder: won ? won.holder : null, witnesses: won ? [...won.witnesses] : [],
      visibility: won ? won.visibility : null, lines: won ? [won.seenLine] : [],
    };
    if (gambit && !gambit.right) block.cost = shieldCostOf(quality, band(missionQuality(base[0].perf, base[1].perf) + 0.08));

    const rec = {
      id: 'traitors-chess', ep: ctx.ep, name: 'The Traitors\' Chess',
      ceremony, briefing: briefingText(ceremony.hostBeats),
      teams: base,
      phases,
      playerScores,
      placements: placementsFrom(playerScores),
      quality, tier: pay.tier,
      bestTeam: base[0].perf >= base[1].perf ? base[0].name : base[1].name,
      potBefore: pay.potBefore, gross: pay.gross, potEarned: pay.potEarned,
      potAfter: pay.potAfter, earned: pay.potEarned,
      shields: won ? [block] : [],
      shield: block,
      sideObjectives,
      scenes,
      summary: freshPick(rng, SUMMARY[pay.tier]),
      tally: {
        offered: shieldOn, right: nRight,
        board: [...living],
        questions: asked.map(a => ({ ...a })),
      },
    };
    return validateMissionRecord(rec, ctx);
  },
};

function _teamOf(teams, name) {
  const t = teams.find(x => x.members.includes(name));
  return t ? t.name : teams[0].name;
}

export default traitorsChess;
