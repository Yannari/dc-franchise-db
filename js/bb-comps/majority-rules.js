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
/** Guessing a headcount is estimation: how well you read the room, in numbers. */
const TIEBREAK_MIX = { intuition: 0.6, social: 0.4 };

function readAccuracy(name, obviousness, haveNotDrag = 0) {
  // The declared profile, not a second copy of it. This had drifted to
  // 40/30/18/12 against a declared 36/28/20/16.
  const skill = aptitude(name, majorityRules.stats) / 10;
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

/**
 * A houseguest eliminated on the minority side. Safe whatever the round did —
 * none of these claim anything about how many other people went with them.
 */
const OUT_LINES = [
  (n, p) => `${n} answers what ${p.sub} actually believes instead of what the house believes, which is the exact mistake this competition exists to punish.`,
  (n) => `${n} reads the room badly. It is a small thing to be wrong about and it ends ${n}'s competition.`,
  (n, p) => `${n} changes ${p.posAdj} answer at the last second, away from the one the house gave.`,
  (n, p) => `${n} goes with ${p.posAdj} gut. ${p.PosAdj} gut has not been in the same conversations as everybody else's.`,
  (n, p) => `${n} had a reason for that board. The reason was about ${n}, and the question was about everybody else.`,
];

/**
 * ONLY for a round where exactly one board was in the minority.
 *
 * "The minority is Tobias, alone" ran on a round that eliminated Tobias AND
 * Jules, one beat after the other, each written as though the other were not
 * standing there. A line that counts the room may only be picked when the
 * count is checked first.
 */
const SOLO_OUT_LINES = [
  (n, p) => `The minority is ${n}, alone, holding up a board ${p.sub} ${vb(p, 'was', 'were')} completely sure about.`,
  (n, p) => `${n} is on the wrong side of it by ${p.ref === 'themselves' ? 'themself' : p.ref}, which is the loneliest way this competition ends.`,
  (n) => `One board out of the whole room disagrees, and it belongs to ${n}.`,
];

/** Small counts read as words in a sentence and as digits on a scoreboard. */
const WORD = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const spell = k => WORD[k] || String(k);

/** Two or more boards going out together, named in one breath. */
const GROUP_OUT_LINES = [
  (names, k) => `${names} all read it the same wrong way. ${Spell(k)} boards go down at once and the room gets noticeably smaller.`,
  (names, k) => `The minority is ${spell(k)} strong — ${names} — and being wrong together is still being wrong.`,
  (names, k) => `${names} are out on the same question. There is a strange comfort in ${spell(k)} people making an identical mistake, and it lasts about a second.`,
  (names, k) => `${Spell(k)} boards on the losing side: ${names}. They agreed with each other and with nobody else.`,
];
const Spell = k => { const w = spell(k); return w.charAt(0).toUpperCase() + w.slice(1); };

// Both of these end up suffixed with their own question number, which is what
// actually guarantees uniqueness — a competition may not print the same
// sentence twice, and a 6-6 split can otherwise recur word for word.
const TIE_LINES = [
  (a, b, x, y) => `The room splits clean down the middle, ${x}–${y}, and cannot separate them.`,
  (a, b, x, y) => `${x}–${y}. Half this house thinks one thing about ${a} and half of it thinks the same thing about ${b}.`,
  (a, b, x, y) => `Dead level at ${x}–${y}, which tells everybody rather more about the house than the question did.`,
  (a, b, x, y) => `Nobody can separate ${a} from ${b} — ${x}–${y}, and the boards stay up.`,
];

/**
 * The verdict on a round nobody was eliminated on BECAUSE EVERY BOARD AGREED.
 *
 * These may only be printed when the minority is genuinely empty. They used to
 * run on every survey round, which is how a round that split five to four came
 * to be narrated as "Every board in the room says Natasha. Nobody is in the
 * minority" directly above a board showing four people who said Felipe.
 */
const SAFE_LINES = [
  m => `Every board in the room says ${m}. Nobody is in the minority, so nobody goes out — and the house has just told itself something about ${m} out loud.`,
  m => `Unanimous for ${m}. There is a small silence afterwards while ${m} works out what that means.`,
  m => `The whole room lands on ${m} together, which is the most dangerous kind of agreement there is.`,
  m => `Not one board disagrees about ${m}.`,
];

/**
 * The verdict on a SURVEY round that split.
 *
 * Nobody goes home, but somebody was wrong, and the screen colours those
 * boards red where a transcript cannot. So the sentence names them: it is the
 * only record of why four particular people are about to lose the cut, and
 * without it that cut arrives out of nowhere.
 */
const SURVEY_LINES = [
  (m, maj, min, names) => `${m} takes it, ${maj}–${min}. ${names} read the room the other way, and the board remembers.`,
  (m, maj, min, names) => `${maj} boards to ${min} for ${m}. On the wrong side of it: ${names} — safe tonight, marked all the same.`,
  (m, maj, min, names) => `The house says ${m} by ${maj}–${min}. ${names} guessed against the room and nobody goes home for it yet.`,
  (m, maj, min, names) => `${m}, ${maj}–${min}. Nobody is eliminated on the survey, but ${names} are now behind on a board they cannot see.`,
];

/** A survey round that came down to a single board. */
const SURVEY_CLOSE_LINES = [
  (m, maj, min, names) => `${m} by one board, ${maj}–${min}. ${names} missed it by the narrowest margin this competition has.`,
  (m, maj, min, names) => `${maj}–${min}. A single board separates the house, and it leaves ${names} on the wrong side of it.`,
];

/** Everybody but one or two: the room agreeing loudly at somebody's expense. */
const SURVEY_LOPSIDED_LINES = [
  (m, maj, min, names) => `${maj}–${min} for ${m}, which is as close to unanimous as this house gets. ${names} did not see it coming.`,
  (m, maj, min, names) => `${m} runs away with it, ${maj}–${min}. ${names} alone read the room differently, and everybody can see who.`,
];

export const majorityRules = {
  id: 'bb-mental-quiz',
  name: 'Majority Rules',
  category: 'quiz',
  types: ['hoh', 'veto', 'tiebreaker'],
  desc: 'Every houseguest gets a board and a marker. Each round they are read a superlative and two names, and asked not who they think fits it but who they think the MAJORITY of the house would pick — then everybody reveals at once. The opening questions are the survey: nobody is eliminated, but every board is marked right or wrong, and when the survey ends the houseguests who read the room worst are cut on that score alone. From there it is sudden death, and the smaller side of every question goes out on the spot. Answer honestly instead of predictively and you are gone on a question you knew the true answer to; a dead-even split eliminates nobody and two of those in a row ends the questions. Last houseguest standing wins, or if the questions run out first, the closest answer to a final count-the-room tiebreaker takes it.',
  stats: { intuition: 0.36, social: 0.28, strategic: 0.20, mental: 0.16 },
  weight: () => 1.1,
  simulate(participants, context, api, rng) {
    const beats = [];
    const breakdown = {};
    const out = makePicker(rng);
    const tie = makePicker(rng);
    const safe = makePicker(rng);
    // Keyed by the line itself, so one picker spans all three survey pools
    // without ever repeating a sentence.
    const survey = makePicker(rng);

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
    let deadStreak = 0;

    // ── why this competition needed a first half ──
    //
    // The majority that decides a round is the majority of the LOCK-INS, so
    // the side that goes home is always the smaller one — which means the
    // field halves on every single question. Eight houseguests is therefore
    // three questions and a tiebreaker, arithmetically, however many
    // superlatives sit in the bank: eight to five to three to two. A
    // competition that is over in three answers is not a competition.
    //
    // So the elimination rounds are now the SECOND half. The first half is a
    // survey: the same questions and the same read-the-room problem, but
    // nobody goes home and everybody is quietly being marked. It gives the
    // segment a body, it gives the house a board to look at, and it means the
    // people who reach the cut got there over five questions rather than one.
    //
    // The screen needs nothing for it. A survey round ends on the ALL SAFE
    // verdict the rules already produce whenever a question sends nobody home.
    const surveyLen = field.length > 3
      ? Math.min(5, Math.max(3, Math.floor(supPool.length / 2)))
      : 0;

    /**
     * Ask one question and record every lock-in.
     *
     * Shared by both halves, so the survey and the sudden death cannot drift
     * into being two different competitions.
     */
    const askQuestion = () => {
      if (!supPool.length) return null;
      const sup = supPool.splice(Math.floor(rng() * supPool.length), 1)[0];

      // ── the question a producer would actually ask ──
      //
      // Drawn at random, the pair keeps landing on two people the room already
      // agrees about: everybody reads it correctly, nobody is in the minority,
      // and the round eliminates nobody. So several pairs are considered and
      // the most CONTESTED one is asked — the question the house is closest to
      // evenly split on. That is both the harder question and the one a show
      // would pick.
      let a = null, b = null, tally = null;
      for (let attempt = 0; attempt < 6; attempt++) {
        const pool = house.length >= 2 ? [...house] : [...participants];
        const x = pool.splice(Math.floor(rng() * pool.length), 1)[0];
        const y = pool.splice(Math.floor(rng() * pool.length), 1)[0];
        if (!x || !y || x === y) continue;
        const t = tallyHouse(sup, x, y, house, rng);
        if (!tally || t.split < tally.split) { a = x; b = y; tally = t; }
        if (tally.split <= 1) break;               // close enough to ask
      }
      if (!a || !b || !tally) return null;

      round++;
      // `tally` is the PRIOR, not the answer — it is what a houseguest is
      // trying to read when they look around the room.
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

      // The majority that matters is the majority of the LOCK-INS, not of the
      // house survey: the wiki is explicit that those who answered with the
      // majority remain and those with the minority go out.
      const forA = field.filter(f => f.pick === a).length;
      const forB = field.length - forA;
      const roomMajority = forA === forB ? null : (forA > forB ? a : b);

      field.forEach(f => {
        const right = roomMajority ? f.pick === roomMajority : null;
        f.picks.push(f.pick);
        // The pair travels with the answer. Deriving it from the answers alone
        // cannot work: a unanimous round holds only one distinct name, and the
        // screen drew the question as "Wayne or Wayne".
        breakdown[f.name].picks.push({ q: round, pair: [a, b], pick: f.pick, majority: roomMajority, right });
        if (right) { f.correct++; breakdown[f.name].correct++; }
      });

      return { a, b, forA, forB, roomMajority };
    };

    // ══ THE SURVEY ══ nobody goes home; everybody is being marked.
    for (let i = 0; i < surveyLen && field.length > 2; i++) {
      const q = askQuestion();
      if (!q) break;
      if (!q.roomMajority) {
        beats.push(beat(`${tie(TIE_LINES)(q.a, q.b, q.forA, q.forB)} A dead split scores nobody anything.`,
          [q.a, q.b], 'DEAD EVEN', 'grey'));
        continue;
      }
      // Who was actually wrong. The screen prints these boards in red; a
      // transcript has no red, so the sentence has to carry them.
      const minority = field.filter(f => f.pick !== q.roomMajority).map(f => f.name);
      const maj = field.length - minority.length;
      if (!minority.length) {
        beats.push(beat(
          `${safe(SAFE_LINES)(q.roomMajority)} Nobody goes home on the survey — the board is only keeping score.`,
          [q.roomMajority], `SURVEY ${maj}–0`, 'grey'));
        continue;
      }
      const names = minority.length === 1 ? minority[0]
        : `${minority.slice(0, -1).join(', ')} and ${minority[minority.length - 1]}`;
      const pool = minority.length === 1 || maj - minority.length >= field.length - 2
        ? SURVEY_LOPSIDED_LINES
        : maj - minority.length === 1 ? SURVEY_CLOSE_LINES : SURVEY_LINES;
      beats.push(beat(
        survey(pool)(q.roomMajority, maj, minority.length, names),
        [q.roomMajority, ...minority], `SURVEY ${maj}–${minority.length}`, 'grey'));
    }

    // ══ THE CUT ══ the survey board decides who is still playing.
    if (surveyLen && field.length > 3) {
      const keep = Math.max(3, Math.ceil(field.length / 2));
      const ranked = [...field].sort((x, y) => (y.correct - x.correct) || (y.luck - x.luck));
      const cut = ranked.slice(keep);
      if (cut.length && cut.length < field.length) {
        /* The scores, not just the names. A cut that says only "these four
           finish at the bottom" is asking to be taken on trust — the survey
           rounds are right there above it and the reader should be able to
           check the arithmetic. */
        const score = f => `${f.name} (${f.correct}/${round})`;
        const kept = ranked.slice(0, keep);
        const line = cut.length === 1
          ? `${score(cut[0])} read this house worst of anybody over ${round} questions and is out of it.`
          : `${cut.map(score).join(', ')} finish the survey at the bottom of the board and are out of it.`;
        beats.push(beat(
          `${line} ${kept.map(score).join(', ')} carry on, and from here the minority goes home every question.`,
          cut.map(f => f.name), 'THE CUT', 'red'));
        cut.forEach(f => {
          f.outRound = round;
          breakdown[f.name].outRound = round;
          breakdown[f.name].cutAtSurvey = true;
          eliminationOrder.push(f.name);
        });
        field = field.filter(f => !f.outRound);
      }
    }

    // ══ SUDDEN DEATH ══ the real rule: the minority is eliminated.
    const maxRounds = round + Math.max(3, participants.length);
    while (field.length > 2 && round < maxRounds && supPool.length) {
      const q = askQuestion();
      if (!q) break;
      const { a, b, forA, forB, roomMajority } = q;

      if (!roomMajority) {
        beats.push(beat(
          `${tie(TIE_LINES)(a, b, forA, forB)} Question ${round} eliminates nobody.`,
          [a, b], 'DEAD EVEN', 'grey'));
        // A round that eliminates nobody is legal and interesting once. Two in
        // a row ends the questions and sends it to the tiebreaker, which is
        // one of the two endings the rules already give this competition.
        if (++deadStreak >= 2) break;
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
        });

        /* One board out is a personal story and gets one. Several going down
           together is a single event and reads as one — told individually,
           each line describes a room the next line contradicts. */
        if (wrong.length === 1) {
          const f = wrong[0];
          const p = pron(f.name);
          beats.push(beat(
            f.threw
              ? `${f.name} answers what ${p.sub} ${vb(p, 'thinks', 'think')} rather than what the house thinks, and goes out on a round ${p.sub} could have read with ${p.posAdj} eyes shut.`
              : out(rng() < 0.45 ? SOLO_OUT_LINES : OUT_LINES)(f.name, p),
            [f.name], 'MINORITY', 'grey'));
        } else {
          const names = `${wrong.slice(0, -1).map(f => f.name).join(', ')} and ${wrong[wrong.length - 1].name}`;
          const threw = wrong.filter(f => f.threw).map(f => f.name);
          beats.push(beat(
            `${out(GROUP_OUT_LINES)(names, wrong.length)}${threw.length
              ? ` ${threw.join(' and ')} answered honestly rather than predictively, which is the one way to lose this knowing the true answer.`
              : ''}`,
            wrong.map(f => f.name), `MINORITY ${wrong.length} OUT`, 'grey'));
        }
        field = field.filter(f => !f.outRound);
        deadStreak = 0;
      } else {
        beats.push(beat(
          `${safe(SAFE_LINES)(roomMajority)} Question ${round} eliminates nobody.`,
          [roomMajority], 'ALL SAFE', 'grey'));
        if (++deadStreak >= 2) break;
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
          // The two on the board never get a vote on themselves, which is why
          // the number asked about is short of the house — say so, or it reads
          // as a miscount to anybody following along.
          ? `Tiebreaker. The house was polled on ${sup.text}, everybody except the two named: ${tally.voters.length} houseguests. How many of them said ${a} rather than ${b}? Closest answer takes it.`
          : `Tiebreaker. One question, closest answer takes it.`,
        field.map(f => f.name), 'TIEBREAKER'));

      field.forEach(f => {
        // The tiebreaker is a different question from the rounds. Those ask
        // which way the house went; this asks HOW MANY went that way, which
        // is estimation rather than reading — so it gets its own declared mix
        // rather than the headline profile or a hand-written copy of one.
        const err = Math.abs((rng() - 0.5) * 2) * (11 - aptitude(f.name, TIEBREAK_MIX)) * 0.55
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
