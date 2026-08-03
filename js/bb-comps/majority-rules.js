// ══════════════════════════════════════════════════════════════════════
// bb-comps/majority-rules.js — Majority Rules
// ══════════════════════════════════════════════════════════════════════
//
// A recurring Head of Household competition since Big Brother 4 (eight seasons
// across the US and Canada). Played quiz-style, and the twist in the rules is
// the whole competition:
//
//   Julie reads a superlative and two names. You do NOT answer who you think
//   fits it. You answer who you think THE MAJORITY OF THE HOUSE thinks fits it.
//   Everybody locks in; the majority survives; the minority is eliminated. A
//   dead-even split eliminates nobody. When the questions or the houseguests
//   run out, a tiebreaker decides it.
//
// Which makes this the only competition in the library that is not really a
// test of the player at all — it is a test of whether they know what room they
// are standing in. So the house's answer is not rolled: it is TALLIED, one
// opinion at a time, out of state the house actually holds — perceived bonds,
// suspicion, threat, the competition record, who is in an alliance with whom. A
// houseguest who has spent six weeks inside a bubble with two allies gets this
// competition wrong, and gets it wrong for a reason the viewer can read.
//
// That also moves the stat mix off `mental`. Reading a room is intuition and
// social, and this is the comp a social player is finally supposed to win.
//
// NOTE ON `breakdown`: the Debug tab renders Object.entries(scoreBreakdown) as
// one row per houseguest, so every key in here must be a player name. Round and
// tiebreaker structure travels in the beats and in per-player fields, never as
// a sidecar key.
// ══════════════════════════════════════════════════════════════════════

import { gs } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getPerceivedBond } from '../bonds.js';
import { bbThreat } from '../bb/shared-strategy.js';
import { aptitude, beat, toResult, makePicker, throwRead, clamp, vb } from './_shared.js';

const NEUTRAL = { sub: 'they', obj: 'them', pos: 'theirs', posAdj: 'their', ref: 'themselves', Sub: 'They', Obj: 'Them', PosAdj: 'Their' };
const pron = name => { try { return pronouns(name) || NEUTRAL; } catch { return NEUTRAL; } };

/** Everything the house can see about somebody, from the week's record. */
const rec = name => gs.bb?.stats?.[name] || {};
const comps = name => (rec(name).hohWins || 0) + (rec(name).vetoWins || 0) + (rec(name).blockBusterWins || 0);
const suspicionOf = (voter, target) => gs.bb?.house?.suspicion?.[`${voter}→${target}`] || 0;
const bond = (voter, target) => { try { return getPerceivedBond(voter, target) || 0; } catch { return 0; } };
const threat = name => { try { return bbThreat(name) || 0; } catch { return 0; } };

/** How many named alliances somebody sits in — the house's read on "connected". */
const allianceCount = name =>
  (gs.namedAlliances || []).filter(a => a.active !== false && (a.members || []).includes(name)).length;

/**
 * The superlatives.
 *
 * Each is an axis the house can actually observe, scored from the point of view
 * of ONE voter — because "what does the house think" is a tally of separate
 * opinions, not a global fact. Two houseguests looking at the same pair have to
 * be able to disagree, or the competition has no content in it.
 */
const SUPERLATIVES = [
  { key: 'threat', text: 'the biggest threat to win this game',
    score: (v, t) => threat(t) },
  { key: 'comps', text: 'the strongest competitor in this house',
    score: (v, t) => comps(t) * 2 + pStats(t).physical * 0.12 },
  { key: 'floater', text: 'floating through this game instead of playing it',
    score: (v, t) => 6 - comps(t) * 1.6 - allianceCount(t) * 1.1 },
  { key: 'trust', text: 'the one person here you would trust with a secret',
    score: (v, t) => bond(v, t) + pStats(t).loyalty * 0.1 },
  { key: 'liar', text: 'the biggest liar in this house',
    score: (v, t) => suspicionOf(v, t) * 1.4 - bond(v, t) * 0.4 },
  { key: 'runs', text: 'really running this house',
    score: (v, t) => allianceCount(t) * 1.5 + (rec(t).hohWins || 0) * 1.2 + pStats(t).strategic * 0.1 },
  { key: 'flip', text: 'the most likely to flip on their own alliance',
    score: (v, t) => suspicionOf(v, t) + (10 - pStats(t).loyalty) * 0.12 },
  { key: 'crack', text: 'the first one here to crack under pressure',
    score: (v, t) => (10 - pStats(t).temperament) * 0.16 + (rec(t).timesOnTheBlock || 0) * 0.5 },
  { key: 'safe', text: 'the safest person in this house right now',
    score: (v, t) => allianceCount(t) * 1.2 + bond(v, t) * 0.5 - (rec(t).timesNominated || 0) * 0.9 },
  { key: 'win', text: 'the most likely to win the whole thing',
    score: (v, t) => threat(t) * 0.6 + comps(t) * 1.1 + allianceCount(t) },
  { key: 'blindside', text: 'the most likely to get blindsided',
    score: (v, t) => 5 - pStats(t).intuition * 0.32 + (rec(t).timesSaved || 0) * 0.4 },
  { key: 'loyal', text: 'the most loyal person in this house',
    score: (v, t) => pStats(t).loyalty * 0.16 + bond(v, t) * 0.3 - suspicionOf(v, t) },
];

/**
 * Tally the house.
 *
 * One opinion per houseguest, excluding the two being compared — nobody is
 * asked to rate themselves against somebody else. A small deterministic wobble
 * per voter stops a lopsided pair from being unanimous every single time, which
 * is how a real one of these produces the split nobody saw coming.
 */
function tallyHouse(sup, a, b, house, rng) {
  let aVotes = 0, bVotes = 0;
  const voters = [];
  for (const v of house) {
    if (v === a || v === b) continue;
    const diff = sup.score(v, a) - sup.score(v, b) + (rng() - 0.5) * 1.6;
    const pick = diff >= 0 ? a : b;
    if (pick === a) aVotes++; else bVotes++;
    voters.push({ voter: v, pick });
  }
  return { aVotes, bVotes, voters, split: Math.abs(aVotes - bVotes),
    majority: aVotes === bVotes ? null : (aVotes > bVotes ? a : b) };
}

/**
 * How well one houseguest reads the room.
 *
 * A close split is genuinely hard to call and a lopsided one is nearly free, so
 * accuracy scales with how obvious the answer was — which is what makes an
 * upset round an actual upset rather than a dice roll.
 */
function readAccuracy(name, obviousness, haveNotDrag = 0) {
  const s = pStats(name);
  const skill = (s.intuition * 0.40 + s.social * 0.30 + s.strategic * 0.18 + s.mental * 0.12) / 10;
  return clamp(0.30 + skill * 0.45 + obviousness * 0.26 - haveNotDrag, 0.16, 0.94);
}

// A week of slop and no sleep costs you the fine reading this competition is
// entirely made of. Every competition in the library applies the have-not
// penalty and REPORTS it in the breakdown — the twist is verified by reading
// the number back off the result, so applying it silently is not enough.
const HAVE_NOT_DRAG = 0.09;

const OPEN_LINES = [
  'The rules get read out twice, because every season somebody plays the first question wrong on purpose by accident.',
  'Nobody is being asked what is true. Everybody is being asked what the room believes, which is a different game and a much worse one to be bad at.',
  'The board lights up with two names and a sentence, and the house has to decide what the house thinks.',
  'It looks like a quiz for about forty seconds. Then the first answers go up and it stops looking like a quiz.',
];

const OUT_LINES = [
  (n, p) => `${n} answers what ${p.sub} actually believes instead of what the house believes, which is the exact mistake this competition exists to punish.`,
  (n, p) => `${n} is on the wrong side of it by one, and ${p.sub} ${vb(p, 'knows', 'know')} it before the count even finishes.`,
  (n) => `${n} reads the room badly. It is a small thing to be wrong about and it ends ${n}'s competition.`,
  (n, p) => `${n} changes ${p.posAdj} answer at the last second, away from the one the house gave.`,
  (n, p) => `The minority is ${n}, alone, holding up a board ${p.sub} ${vb(p, 'was', 'were')} completely sure about.`,
  (n, p) => `${n} goes with ${p.posAdj} gut. ${p.PosAdj} gut has not been in the same conversations as everybody else's.`,
];

// Both of these end up suffixed with their own question number, which is what
// actually guarantees uniqueness — a competition may not print the same
// sentence twice, and a 6-6 split can otherwise recur word for word.
const TIE_LINES = [
  (a, b, x, y) => `The room splits clean down the middle, ${x}–${y}, and cannot separate them.`,
  (a, b, x, y) => `${x}–${y}. Half this house thinks one thing about ${a} and half of it thinks the same thing about ${b}.`,
  (a, b, x, y) => `Dead level at ${x}–${y}, which tells everybody rather more about the house than the question did.`,
  (a, b, x, y) => `Nobody can separate ${a} from ${b} — ${x}–${y}, and the boards stay up.`,
];

const SAFE_LINES = [
  m => `Every board in the room says ${m}. Nobody is in the minority, so nobody goes out — and the house has just told itself something about ${m} out loud.`,
  m => `Unanimous for ${m}. There is a small silence afterwards while ${m} works out what that means.`,
  m => `The whole room lands on ${m} together, which is the most dangerous kind of agreement there is.`,
  m => `Not one board disagrees about ${m}.`,
];

export const majorityRules = {
  id: 'bb-mental-quiz',
  name: 'Majority Rules',
  category: 'quiz',
  types: ['hoh', 'veto', 'tiebreaker'],
  desc: 'Each round the houseguests are read a superlative and two names, and asked not who they think fits it but who they think the MAJORITY of the house would pick. Everybody locks in at once. The majority survives, the minority is eliminated, and a dead-even split eliminates nobody. The last houseguest standing wins.',
  stats: { intuition: 0.36, social: 0.28, strategic: 0.20, mental: 0.16 },
  weight: () => 1.1,
  simulate(participants, context, api, rng) {
    const beats = [];
    const breakdown = {};
    const out = makePicker(rng);
    const tie = makePicker(rng);
    const safe = makePicker(rng);

    // The room being read: everybody still in the game holds an opinion, not
    // only the people playing. That is the point of the question.
    const house = [...new Set([...(context.house || participants), ...participants])];

    let field = participants.map(name => {
      const t = throwRead(name, context, rng);
      const haveNot = (context.haveNots || []).includes(name);
      breakdown[name] = {
        picks: [], correct: 0, outRound: null, threw: t.threw, threwChance: t.chance,
        haveNot, haveNotPenalty: haveNot ? HAVE_NOT_DRAG : 0, score: 0,
        // See the note by `luck` below.
        base: Math.round(aptitude(name, majorityRules.stats) * 100) / 100, roll: 0,
      };
      return { name, threw: t.threw, haveNot, correct: 0, picks: [], outRound: null, luck: 0 };
    });

    beats.push(beat(
      OPEN_LINES[Math.floor(rng() * OPEN_LINES.length)],
      participants.slice(0, 3), 'MAJORITY RULES'));

    const supPool = [...SUPERLATIVES];
    const eliminationOrder = [];
    let round = 0;
    const maxRounds = Math.min(supPool.length, Math.max(3, participants.length + 2));

    while (field.length > 2 && round < maxRounds && supPool.length) {
      round++;
      const sup = supPool.splice(Math.floor(rng() * supPool.length), 1)[0];
      const pool = house.length >= 2 ? [...house] : [...participants];
      const a = pool.splice(Math.floor(rng() * pool.length), 1)[0];
      const b = pool.splice(Math.floor(rng() * pool.length), 1)[0];
      if (!a || !b) break;

      // What the room genuinely thinks. This is the PRIOR, not the answer —
      // it is what a houseguest is trying to read when they look around.
      const tally = tallyHouse(sup, a, b, house, rng);
      const obviousness = clamp(tally.split / Math.max(1, tally.voters.length), 0, 1);

      beats.push(beat(
        `Round ${round}. Who does the house think is ${sup.text} — ${a} or ${b}?`,
        [a, b], `ROUND ${round}`));

      // Everybody locks in at once, each one aiming at that prior and missing
      // it in proportion to how badly they read this house.
      field.forEach(f => {
        // Throwing here is elegant: answer what you believe rather than what
        // the room believes, and nobody can ever prove you did it on purpose.
        const acc = f.threw ? 0.18 : readAccuracy(f.name, obviousness, f.haveNot ? HAVE_NOT_DRAG : 0);
        const onPrior = rng() < acc;
        // How far the round ran ahead of or behind expectation, accumulated.
        f.luck += (onPrior ? 1 : 0) - acc;
        const aim = tally.majority || (rng() < 0.5 ? a : b);
        f.pick = onPrior ? aim : (aim === a ? b : a);
      });

      // ── and the rule that decides it ──
      //
      // The majority that matters is the majority of the LOCK-INS, not of the
      // house survey: the wiki is explicit that those who voted with the
      // majority remain and those with the minority go out. Which makes the
      // competition self-referential — you are trying to match the room you are
      // actually standing in — and guarantees a round can never eliminate more
      // than half the field, since the bigger side is the side that survives.
      const forA = field.filter(f => f.pick === a).length;
      const forB = field.length - forA;
      const roomMajority = forA === forB ? null : (forA > forB ? a : b);

      field.forEach(f => {
        const right = roomMajority ? f.pick === roomMajority : null;
        f.picks.push(f.pick);
        breakdown[f.name].picks.push({ q: round, pick: f.pick, majority: roomMajority, right });
        if (right) { f.correct++; breakdown[f.name].correct++; }
      });

      if (!roomMajority) {
        beats.push(beat(
          `${tie(TIE_LINES)(a, b, forA, forB)} Question ${round} eliminates nobody.`,
          [a, b], 'DEAD EVEN', 'grey'));
        continue;
      }

      const wrong = field.filter(f => f.pick !== roomMajority);
      // A round that would empty the board eliminates nobody — the competition
      // has to leave somebody standing to win it.
      if (wrong.length && wrong.length < field.length) {
        wrong.forEach(f => {
          f.outRound = round;
          breakdown[f.name].outRound = round;
          eliminationOrder.push(f.name);
          const p = pron(f.name);
          beats.push(beat(
            f.threw
              ? `${f.name} answers what ${p.sub} ${vb(p, 'thinks', 'think')} rather than what the house thinks, and goes out on a round ${p.sub} could have read with ${p.posAdj} eyes shut.`
              : out(OUT_LINES)(f.name, p),
            [f.name], 'MINORITY', 'grey'));
        });
        field = field.filter(f => !f.outRound);
      } else {
        beats.push(beat(
          `${safe(SAFE_LINES)(roomMajority)} Question ${round} eliminates nobody.`,
          [roomMajority], 'ALL SAFE', 'grey'));
      }
    }

    // ── the tiebreaker ──
    //
    // Real rule: whether the questions run out or the field gets down to two, a
    // tiebreaker settles it. Here it is the closest read of one last split.
    if (field.length > 1) {
      const sup = supPool.length
        ? supPool[Math.floor(rng() * supPool.length)]
        : SUPERLATIVES[Math.floor(rng() * SUPERLATIVES.length)];
      const pool = [...house];
      const a = pool.splice(Math.floor(rng() * pool.length), 1)[0];
      const b = pool.splice(Math.floor(rng() * pool.length), 1)[0];
      const tally = a && b ? tallyHouse(sup, a, b, house, rng) : { aVotes: 0, voters: [] };
      const truth = tally.aVotes;

      beats.push(beat(
        a && b
          ? `Tiebreaker. Of the ${tally.voters.length} houseguests asked, how many said ${a} rather than ${b} for ${sup.text}? Closest answer takes it.`
          : `Tiebreaker. One question, closest answer takes it.`,
        field.map(f => f.name), 'TIEBREAKER'));

      field.forEach(f => {
        const s = pStats(f.name);
        const err = Math.abs((rng() - 0.5) * 2) * (11 - (s.intuition * 0.6 + s.social * 0.4)) * 0.55
          + (f.threw ? 2.2 : 0);
        f.guess = Math.round(clamp(truth + (rng() < 0.5 ? -err : err), 0, Math.max(0, tally.voters.length)));
        f.err = Math.abs(f.guess - truth);
        breakdown[f.name].tiebreakGuess = f.guess;
        breakdown[f.name].tiebreakErr = f.err;
      });
      field.sort((x, y) => x.err - y.err || y.correct - x.correct);
      field.forEach((f, i) => {
        beats.push(beat(
          `${f.name} says ${f.guess}. It was ${truth}${i === 0 ? ', and nobody gets closer' : `, so ${f.name} is ${f.err} out`}.`,
          [f.name], i === 0 ? 'CLOSEST' : `OFF BY ${f.err}`, i === 0 ? 'challenge' : 'grey'));
      });
    }

    const champ = field[0];
    const p = pron(champ.name);
    beats.push(beat(
      `${champ.name} read the room better than the room read itself. ${p.Sub} ${vb(p, 'takes', 'take')} it.`,
      [champ.name], context.type === 'veto' ? 'VETO' : 'HOH', 'gold'));
    api.popDelta(champ.name, 2);
    api.record(champ.name, 'majority-rules-win', { correct: champ.correct, rounds: round });
    // Being publicly, visibly good at reading this house is dangerous, and the
    // house just watched somebody do it for twenty minutes.
    field.forEach(f => { if (f !== champ) api.popDelta(f.name, 0.5); });

    // ── placements ──
    // Survivors first, then everybody else in reverse elimination order: the
    // later you went out, the better you did.
    const survivors = field.map(f => f.name);
    const placements = [...survivors];
    [...eliminationOrder].reverse().forEach(n => { if (!placements.includes(n)) placements.push(n); });
    participants.forEach(n => { if (!placements.includes(n)) placements.push(n); });

    const entries = placements.map((name, i) => {
      const score = (placements.length - i) + (breakdown[name]?.correct || 0) * 0.1;
      if (breakdown[name]) {
        breakdown[name].score = score;
        const f = field.find(x => x.name === name);
        breakdown[name].roll = Math.round(((f?.luck) || 0) * 100) / 100;
      }
      return { name, score, threw: !!breakdown[name]?.threw };
    });

    return toResult(entries, {
      beats, breakdown, variant: 'quiz',
      text: `${champ.name} wins Majority Rules${round ? ` after ${round} rounds` : ''}.`,
    });
  },
};
