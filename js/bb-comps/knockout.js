// ══════════════════════════════════════════════════════════════════════
// bb-comps/knockout.js — Knockout
// ══════════════════════════════════════════════════════════════════════
//
// The most-run competition in the format's history: twenty-one seasons across
// the US and Canada since Big Brother 8, under a different name nearly every
// time (Let's Make a Duel, En Garde, and on and on). The rules, verbatim:
//
//   Two people are picked to go up to a podium and are asked a question about
//   a picture. The first player to buzz in with the correct answer eliminates
//   their opponent — and THEY THEN CHOOSE THE NEXT TWO TO FACE OFF. Answer
//   incorrectly and you are eliminated instead and your opponent advances. If
//   nobody buzzes in inside the time limit, both are eliminated. Last player
//   standing is the new Head of Household.
//
// That third sentence is why this one is worth having. Every other competition
// in the library is people being measured; this is people being AIMED. Winning
// a duel hands you a public, unavoidable decision about which two houseguests
// go to the podium next, knowing one of them will not come back from it. You
// can send two threats at each other and guarantee one dies. You can keep
// yourself off the podium for six straight duels and take no risk at all. And
// everybody watches you do it, which is why every pick in here costs bond with
// both people picked, whatever the reason for it was.
//
// It also has the format's only both-players-lose outcome, which is the thing
// that stops a cautious field from freezing: nobody buzzes, and two of them go.
//
// NOTE ON `breakdown`: one key per player — the Debug tab renders keys as rows.
// Duel structure travels in the beats and in per-player fields.
// ══════════════════════════════════════════════════════════════════════

import { pStats, pronouns } from '../players.js';
import { getBond } from '../bonds.js';
import { bbHeat } from '../bb/shared-strategy.js';
import { aptitude, beat, toResult, makePicker, throwRead, clamp, vb } from './_shared.js';

const NEUTRAL = { sub: 'they', obj: 'them', pos: 'theirs', posAdj: 'their', ref: 'themselves', Sub: 'They', Obj: 'Them', PosAdj: 'Their' };
const pron = name => { try { return pronouns(name) || NEUTRAL; } catch { return NEUTRAL; } };
const bondTo = (a, b) => { try { return getBond(a, b) || 0; } catch { return 0; } };
const heat = (a, b) => { try { return bbHeat(a, b) || 0; } catch { return 0; } };
const round2 = v => Math.round(v * 100) / 100;

/** What the picture on the screen is of. The question is always about the house. */
const SUBJECTS = [
  'the nomination ceremony in week one',
  'a veto meeting nobody has mentioned since',
  'the first night in the house',
  'an argument in the kitchen that half of them missed',
  'a competition three weeks ago',
  'the moment somebody found out they were going up',
  'a conversation on the hammock',
  'an eviction night nobody enjoyed',
  'the have-not room, at about four in the morning',
  'a celebration that turned out to be premature',
];

const OPEN_LINES = [
  'Two podiums, two buzzers, and a rule that everybody works out the implications of about four seconds too late.',
  'The picture goes up on the screen behind them. Whoever gets there first gets to choose who goes next, which is the whole competition.',
  'Nobody has to be fast at this. Everybody has to be faster than one specific person.',
  'It is a quiz for as long as it takes somebody to realise it is not a quiz.',
];

const WIN_DUEL = [
  (w, l, p) => `${w} is in before the picture has finished loading and is right. ${l} does not get to answer.`,
  (w, l, p) => `${w} buzzes, says it flatly, and watches ${l} work out what has just happened.`,
  (w, l, p) => `Both hands move. ${w}'s gets there. ${l} is out on somebody else's reflex.`,
  (w, l, p) => `${w} takes ${p.posAdj} time, gets it, and ${l} goes without ever touching the buzzer.`,
];

const WRONG_LINES = [
  (n, o, p) => `${n} buzzes first, says the wrong thing, and eliminates ${p.ref}. ${o} did not have to do anything at all.`,
  (n, o, p) => `${n} is fastest and wrong, which in this competition is the same as being last. ${o} advances without answering.`,
  (n, o, p) => `${n} goes early on a guess. It is a bad guess. ${o} is still standing and ${n} is not.`,
];

const NOBUZZ_LINES = [
  (a, b) => `Neither ${a} nor ${b} touches the buzzer. The horn goes, and the house watches two people leave the competition at once for the crime of being careful.`,
  (a, b) => `${a} waits for ${b}. ${b} waits for ${a}. The clock does not wait for either of them, and both are out.`,
  (a, b) => `Nobody buzzes. Nobody wants to be wrong. Both of them are gone anyway.`,
];

const PICK_LINES = [
  (c, a, b, p) => `${c} does not hesitate: ${a} and ${b} to the podiums. ${p.Sub} ${vb(p, 'has', 'have')} just guaranteed that one of them is finished, and both of them know who arranged it.`,
  (c, a, b, p) => `${c} looks around the room longer than ${p.sub} ${vb(p, 'needs', 'need')} to, then sends ${a} and ${b} up. Nobody in this house is going to forget being chosen.`,
  (c, a, b, p) => `${c} picks ${a} and ${b}, which is the safest thing ${p.sub} could have done and the most expensive.`,
  (c, a, b, p) => `${a} and ${b}, says ${c}, and does not explain it. The explanation is obvious to everybody standing there.`,
];

const SELF_PICK_LINES = [
  (c, o, p) => `${c} puts ${p.ref} back up, against ${o}. Nobody asked ${p.obj} to and it is not clear ${p.sub} could explain why.`,
  (c, o, p) => `${c} chooses ${p.ref} and ${o}. It is either confidence or impatience and ${p.sub} ${vb(p, 'does', 'do')} not say which.`,
];

export const knockout = {
  id: 'bb-mental-knockout',
  name: 'Knockout',
  category: 'memory',
  types: ['hoh', 'veto', 'tiebreaker'],
  weight: () => 1.25,
  desc: 'Two houseguests go to the podiums and are asked a question about a picture from this season. The first to buzz in with the right answer eliminates the other — and then chooses the next two to face off. Buzz in with the wrong answer and you go instead. If neither of them buzzes in time, both are eliminated. The last houseguest standing wins.',
  stats: { mental: 0.34, intuition: 0.26, boldness: 0.22, temperament: 0.18 },
  simulate(participants, context, api, rng) {
    const beats = [];
    const breakdown = {};
    const winSay = makePicker(rng);
    const wrongSay = makePicker(rng);
    const nobuzzSay = makePicker(rng);
    const pickSay = makePicker(rng);
    const selfSay = makePicker(rng);
    const subject = makePicker(rng);

    const field = participants.map(name => {
      const s = pStats(name);
      const t = throwRead(name, context, rng);
      return {
        name,
        // Fast hands: reading the picture and committing before you are sure.
        speed: (s.intuition * 0.42 + s.boldness * 0.34 + s.mental * 0.24) / 10,
        // Being right once you are committed.
        recall: (s.mental * 0.46 + s.intuition * 0.26 + s.temperament * 0.28) / 10,
        threw: t.threw, threwChance: t.chance,
        haveNot: (context.haveNots || []).includes(name),
        duels: 0, wins: 0, picks: 0, outDuel: null, chosenBy: null, luck: 0,
        base: Math.round(aptitude(name, knockout.stats) * 100) / 100,
      };
    });
    const by = name => field.find(f => f.name === name);
    field.forEach(f => {
    // The Debug tab reports the levers behind every score — aptitude and the
    // luck that moved it. This competition spreads its randomness across many
    // small rolls rather than one, so `roll` is the accumulated deviation,
    // signed so that positive always means luck helped.
      breakdown[f.name] = {
        base: f.base, roll: 0,
        duels: 0, wins: 0, picks: 0, outDuel: null, chosenBy: null, eliminatedBy: null,
        threw: f.threw, threwChance: f.threwChance,
        haveNot: f.haveNot, haveNotPenalty: f.haveNot ? round2(0.08) : 0,
        score: 0,
      };
    });

    beats.push(beat(
      OPEN_LINES[Math.floor(rng() * OPEN_LINES.length)],
      participants.slice(0, 3), 'THE PODIUMS'));

    let live = [...field];
    let duelNo = 0;
    let chooser = null;

    // ── who goes up next ──
    //
    // The winner of a duel picks, and the sane pick is two people they want
    // gone, because exactly one of the two survives it. Heat ranks them; a
    // strong bond is close to a veto on being picked, which is what makes this
    // an alliance tool rather than a dice roll.
    const choosePair = () => {
      if (!chooser || live.length <= 2) {
        // No previous winner (the first duel) or nobody left to choose between.
        const bag = [...live];
        const a = bag.splice(Math.floor(rng() * bag.length), 1)[0];
        const b = bag.splice(Math.floor(rng() * bag.length), 1)[0];
        return { a, b, picker: null, self: false };
      }
      const c = chooser;
      const others = live.filter(f => f !== c);
      const ranked = others.map(f => ({
        f,
        want: heat(c.name, f.name) + Math.max(0, -bondTo(c.name, f.name)) * 0.4
          - Math.max(0, bondTo(c.name, f.name)) * 0.9 + (rng() - 0.5) * 1.6,
      })).sort((x, y) => y.want - x.want);

      // A bold houseguest with a good record occasionally puts themselves back
      // up rather than waiting to be the last one forced into it.
      const s = pStats(c.name);
      const selfConfidence = (s.boldness / 10) * 0.22 + (c.wins >= 2 ? 0.12 : 0);
      if (others.length >= 1 && rng() < selfConfidence * 0.35) {
        return { a: c, b: ranked[0].f, picker: c, self: true };
      }
      return { a: ranked[0].f, b: ranked[1] ? ranked[1].f : others[0], picker: c, self: false };
    };

    while (live.length > 1) {
      duelNo++;
      const { a, b, picker, self } = choosePair();
      if (!a || !b) break;

      if (picker) {
        picker.picks++;
        breakdown[picker.name].picks++;
        const pp = pron(picker.name);
        beats.push(beat(
          self ? selfSay(SELF_PICK_LINES)(picker.name, b.name, pp)
            : pickSay(PICK_LINES)(picker.name, a.name, b.name, pp),
          [picker.name, a.name, b.name].filter((v, i, arr) => arr.indexOf(v) === i),
          'THE PICK'));
        // Being sent to the podium is a public act of aggression, whatever the
        // reason. Both people picked know exactly who sent them.
        for (const target of [a, b]) {
          if (target === picker) continue;
          target.chosenBy = picker.name;
          breakdown[target.name].chosenBy = picker.name;
          // Small on purpose. This fires for both people picked in every duel
          // — about twenty-five bond writes in one competition — and at -0.5 it
          // quietly drained the whole house every time Knockout ran, which
          // starved the bond-driven house events that give nominees their
          // screen time and let safe showmances out-screen the block.
          api.addBond(picker.name, target.name, -0.15);
        }
        api.record(picker.name, 'knockout-pick', { sent: [a.name, b.name].filter(n => n !== picker.name), duel: duelNo });
      }

      // The last pair is not chosen by anybody — there is nobody else left to
      // send. Said out loud, because a duel silently appearing with no pick in
      // front of it reads like a missing beat rather than the end of the comp.
      if (!picker && duelNo > 1 && live.length === 2) {
        beats.push(beat(
          `Two left, so there is no choice to make. ${a.name} and ${b.name} go up because there is nobody else to send.`,
          [a.name, b.name], 'NO CHOICE'));
      }

      a.duels++; b.duels++;
      breakdown[a.name].duels++; breakdown[b.name].duels++;

      const ask = `a picture of ${subject(SUBJECTS)}`;
      beats.push(beat(
        `Duel ${duelNo}. ${a.name} and ${b.name} to the podiums, and the screen shows ${ask}.`,
        [a.name, b.name], `DUEL ${duelNo}`));

      // ── the buzz ──
      // Wider spread and a tighter limit than the first cut, which never once
      // produced the format's signature both-players-lose outcome in sixty
      // competitions. Two cautious houseguests now genuinely can both sit there.
      const buzzTime = f => {
        const noise = (rng() - 0.5) * 3.0;
        f.luck -= noise;                     // a faster buzz is better luck
        breakdown[f.name].roll = Math.round(f.luck * 100) / 100;
        let t = 4.2 - f.speed * 3.1 + noise;
        if (f.threw) t += 2.6 + rng() * 2.4;
        if (f.haveNot) t += 0.35;
        return t;
      };
      const ta = buzzTime(a), tb = buzzTime(b);
      const LIMIT = 3.6;

      if (ta > LIMIT && tb > LIMIT) {
        // Nobody committed. The format's one mutual-destruction outcome — but
        // it must never empty the podium, so with two left the faster hand
        // survives it.
        if (live.length <= 2) {
          const surv = ta <= tb ? a : b;
          const gone = surv === a ? b : a;
          gone.outDuel = duelNo;
          breakdown[gone.name].outDuel = duelNo;
          beats.push(beat(
            `Neither of them buzzes, and with only two left somebody has to walk out of here with it. ${surv.name} was a fraction closer to the button than ${gone.name}, and that is the whole margin.`,
            [surv.name, gone.name], 'ON THE BUZZER', 'grey'));
          live = live.filter(f => f !== gone);
          chooser = surv;
        } else {
          a.outDuel = duelNo; b.outDuel = duelNo;
          breakdown[a.name].outDuel = duelNo; breakdown[b.name].outDuel = duelNo;
          beats.push(beat(nobuzzSay(NOBUZZ_LINES)(a.name, b.name), [a.name, b.name], 'BOTH OUT', 'grey'));
          live = live.filter(f => f !== a && f !== b);
          // Nobody won, so nobody picks: the next pair is drawn.
          chooser = null;
        }
        continue;
      }

      const first = ta <= tb ? a : b;
      const other = first === a ? b : a;
      const fp = pron(first.name);

      // Buzzing early is worth it only if you actually knew. Committing ahead
      // of the answer is exactly how this competition eats bold players — but
      // it is a risk, not the norm: the first cut had no base term, which put
      // typical accuracy near 37% and ended EVERY duel in the competition on a
      // wrong answer. Buzzing in and being right is what usually happens.
      const earliness = clamp((LIMIT - Math.min(ta, tb)) / LIMIT, 0, 1);
      const correctChance = clamp(0.50 + first.recall * 0.60 - earliness * 0.22
        - (first.threw ? 0.5 : 0) - (first.haveNot ? 0.05 : 0), 0.15, 0.97);
      const correct = rng() < correctChance;

      const loser = correct ? other : first;
      const victor = correct ? first : other;
      loser.outDuel = duelNo;
      breakdown[loser.name].outDuel = duelNo;
      breakdown[loser.name].eliminatedBy = victor.name;
      victor.wins++;
      breakdown[victor.name].wins++;

      beats.push(beat(
        correct
          ? winSay(WIN_DUEL)(first.name, other.name, fp)
          : wrongSay(WRONG_LINES)(first.name, other.name, fp),
        [victor.name, loser.name], correct ? 'ELIMINATED' : 'WRONG ANSWER', 'grey'));

      // Knocking somebody out yourself is not free, and it costs more when you
      // had something with them.
      if (bondTo(victor.name, loser.name) >= 3) {
        api.addBond(victor.name, loser.name, -0.3);
      } else {
        api.addBond(victor.name, loser.name, -0.1);
      }
      api.popDelta(victor.name, 0.4);

      live = live.filter(f => f !== loser);
      chooser = victor;
    }

    const champ = live[0] || field[0];
    const cp = pron(champ.name);
    beats.push(beat(
      champ.wins >= 2
        ? `${champ.name} took ${cp.posAdj} podium ${champ.duels} times and walked off it ${champ.wins}. Last one standing.`
        : `${champ.name} is the last one left holding a buzzer, having spent most of the competition watching other people be sent to the podium.`,
      [champ.name], context.type === 'veto' ? 'VETO' : 'HOH', 'gold'));
    api.popDelta(champ.name, 2);
    api.record(champ.name, 'knockout-win', { duels: champ.duels, wins: champ.wins, picks: champ.picks });

    // ── placements ──
    //
    // Surviving longer is finishing higher, so the elimination order reversed
    // is the result. Ties inside one duel break on who had won more.
    const ordered = [...field].sort((x, y) => {
      const xo = x.outDuel ?? Infinity, yo = y.outDuel ?? Infinity;
      if (xo !== yo) return yo - xo;
      return (y.wins - x.wins) || (y.duels - x.duels);
    });

    const entries = ordered.map((f, i) => {
      const score = (ordered.length - i) + f.wins * 0.15;
      breakdown[f.name].score = round2(score);
      return { name: f.name, score, threw: f.threw };
    });

    return toResult(entries, {
      beats, breakdown, variant: 'duel',
      text: `${champ.name} is the last houseguest standing in Knockout after ${duelNo} duels.`,
    });
  },
};
