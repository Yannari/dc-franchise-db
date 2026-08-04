// ══════════════════════════════════════════════════════════════════════
// bb-comps/slippery-slope.js — Slippery Slope
// ══════════════════════════════════════════════════════════════════════
//
// A recurring Head of Household, Have/Have-Not and Power of Veto competition
// since Big Brother 8 — thirteen seasons across the US and Canada, which makes
// it one of the most-run competitions the format has. The rules:
//
//   One heavily greased, sloped lane each. A barrel of liquid at one end, a
//   container with a ping-pong ball in it at the other. Scoop, run, try not to
//   fall, pour. As the container fills the ball rises, and the first houseguest
//   who can reach in and pull their ball out wins.
//
//   There is also a smaller container in every lane. Fill that one instead and
//   you collect a lesser prize — but doing it takes you out of the main
//   competition entirely.
//
// That side container is why this one is worth building properly. It is a
// genuine decision with a genuine cost, taken under pressure by somebody who
// can see how far behind they are, and the house watches them take it. A player
// in danger who peels off for a cash prize has told everybody exactly how much
// they rate their own chances.
//
// It replaces a comp whose "round-by-round elimination order" was the sorted
// score list reversed — rounds that were narrated but never simulated.
//
// DELIBERATELY NOT OFFERED: safety for the week. The real competition sometimes
// puts it in the small container, but the week engine has no hook for a
// mid-competition safety grant, and awarding one here would be a rule nothing
// downstream honours. Cash and comfort prizes are self-contained, so those are
// the ones on the table.
//
// NOTE ON `breakdown`: one key per player — the Debug tab renders keys as rows.
// ══════════════════════════════════════════════════════════════════════

import { pStats, pronouns } from '../players.js';
import { dangerLevel, TOO_DESPERATE_TO_STOP } from '../bb/strategy.js';
import { getBond } from '../bonds.js';
import { aptitude, beat, toResult, makePicker, throwRead, clamp, THROW_LINES, vb } from './_shared.js';

const NEUTRAL = { sub: 'they', obj: 'them', pos: 'theirs', posAdj: 'their', ref: 'themselves', Sub: 'They', Obj: 'Them', PosAdj: 'Their' };
const pron = name => { try { return pronouns(name) || NEUTRAL; } catch { return NEUTRAL; } };
const round1 = v => Math.round(v * 10) / 10;

/** What is in the small container this week. No safety — see the header. */
/**
 * What is in the small container, and what taking it actually does.
 *
 * The prize used to be a line of text and a flat one point of popularity, so
 * quitting a competition for it was a shrug: nothing about the house was
 * different afterwards and nothing about the decision was interesting. Each
 * one now pays out differently in the only currency this game has, which is
 * what the rest of the house thinks of you:
 *
 *   · Something you keep for yourself reads as taking money over the game, and
 *     the people who were counting on you to win feel it.
 *   · Something you share buys real goodwill — you fed the house, and walking
 *     off the lane is forgiven at the table that night.
 *   · A letter from home is neither. Nobody in that house will hold it against
 *     anybody, and watching somebody read one changes how they are seen.
 *
 * `worth` is the net value of taking it, in the currency that actually decides
 * anything: bonds, which is what nominations are chosen on. Popularity is
 * almost inert in this format, so a prize priced off popularity is priced off
 * nothing. Two of these are worth LESS than nothing — you quit a competition
 * and end up likelier to be nominated — and that is deliberate. They are not
 * traps the engine springs on people at random; see the appeal term below.
 *
 * `line` is a bare noun phrase because it is dropped mid-sentence into the
 * take lines; anything editorial goes in `sting`, which gets its own beat.
 * The previous copy carried a trailing clause and produced "takes a luxury
 * budget for the whole house, claimed by one person who has to explain why
 * they stopped and walks off the lane".
 */
const SIDE_PRIZES = [
  {
    key: 'cash', label: 'FIVE THOUSAND DOLLARS',
    line: 'five thousand dollars',
    gives: n => `${n} gets five thousand dollars. In this house it buys nothing at all — no food, no safety, not one vote — and every person still on a lane knows exactly what it was worth to ${n} to stop.`,
    sting: n => `Nobody out there is rich enough to sneer at it. Two of them do anyway, once ${n} is out of the room.`,
    shared: false, pop: -2.5, allies: -0.9, house: 0, worth: -0.5,
  },
  {
    key: 'letter', label: 'A LETTER FROM HOME',
    line: 'a letter from home',
    gives: n => `${n} gets twenty minutes alone with a letter from home. It changes nothing about the game and it is the only thing in that container anybody would have swapped a competition for.`,
    sting: n => `${n} reads it twice on the lane and once more in the lounge, out loud, and the house is very quiet for it.`,
    shared: false, pop: 3, allies: 0.3, house: 0.5, worth: 0.6,
  },
  {
    key: 'feast', label: 'A NIGHT OFF SLOP',
    line: 'a proper meal and a night off slop',
    gives: n => `${n} gets a proper meal and a night out of the slop room, eaten alone while eleven people who are still on it listen to that happen.`,
    sting: n => `${n} eats it in front of everybody, which is the part the house actually minds.`,
    shared: false, pop: -1, allies: -0.5, house: -0.2, worth: -0.2,
  },
  {
    key: 'shopping', label: 'A LUXURY BUDGET FOR THE HOUSE',
    line: 'a luxury budget for the whole house',
    gives: n => `The whole house gets the luxury budget, on ${n}'s money. Everybody eats for a week off the back of one person's decision to stop, and everybody knows whose decision it was.`,
    sting: n => `It is everybody's, and everybody knows who bought it. ${n} does not have to explain the stopping to a single person.`,
    shared: true, pop: 2, allies: 0.4, house: 0.9, worth: 1,
  },
];

const OPEN_LINES = [
  p => `The lanes are greased, the slope is real, and the ${p} is sitting in a box at the halfway point where everybody has to run past it.`,
  () => 'Scoop, run, fall, get up, pour whatever survived the trip. Repeat until somebody can reach their ball.',
  () => 'Nobody stays upright for the first thirty seconds. Nobody stays upright for the last thirty either.',
  p => `Two containers per lane. The big one wins the competition. The small one holds ${p} and ends your night.`,
];

const SPILL_LINES = [
  (n, p) => `${n} goes down hard about four steps in and arrives at the container holding an empty scoop and a lot of dignity questions.`,
  (n, p) => `${n} tries to run it rather than walk it, and the lane collects ${p.obj} for the third time.`,
  (n, p) => `Most of what ${n} is carrying ends up on ${p.posAdj} own back.`,
  (n, p) => `${n} slides the last two metres on ${p.posAdj} front, arms up, saving maybe a third of the scoop.`,
  // Carried over from the competition this one replaces — the lines were good
  // and the lane they describe is the same lane.
  (n, p) => `${n} goes down the slope face first, which is fast and, as ${p.sub} ${vb(p, 'discovers', 'discover')}, unsteerable.`,
  (n) => `${n} hits the bottom, comes up unrecognisable, and gets the yard's only cheer of the night.`,
  (n, p) => `${n} loses a shoe somewhere on the slope and finishes the competition without it.`,
];

const FUMBLE_LINES = [
  (n, p) => `${n} gets a hand into the container, closes it around the ball, and loses it. The whole thing sloshes back down and ${p.sub} ${vb(p, 'has', 'have')} to start pouring again.`,
  (n, p) => `${n} is there. ${p.Sub} ${vb(p, 'reaches', 'reach')} in with an arm that has been carrying a scoop for ten minutes, and the ball squirts out of ${p.posAdj} fingers.`,
  (n, p) => `The ball is right at the top and ${n} cannot hold it. Half the container goes over the side in the attempt.`,
  (n) => `${n} touches it, loses it, and says something the edit will have to cover with a horn.`,
  (n, p) => `${n} has the ball between two fingers for most of a second. ${p.Sub} ${vb(p, 'does', 'do')} not have it for the rest of the second.`,
  (n, p) => `${n} goes in too fast, wears the top third of ${p.posAdj} own container, and watches the ball settle back down out of reach.`,
  (n, p) => `Everybody on the yard sees ${n} get a hand to it. ${p.Sub} ${vb(p, 'comes', 'come')} up holding nothing and does not look at anybody.`,
];

const GRIND_LINES = [
  (n, p) => `${n} has worked out that slow and boring beats fast and horizontal, and is quietly filling.`,
  (n) => `${n} stops trying to look good doing it, which is when ${n} starts gaining.`,
  (n, p) => `${n} takes the slope on ${p.posAdj} heels, one careful step at a time, and the ball keeps rising.`,
  (n) => `${n} is not fast. ${n} has also not fallen over in four trips.`,
];

const TAKE_LINES = [
  (n, p, prize, pct) => `${n} looks at ${p.posAdj} own container, sitting at ${pct}%, then at the small one. ${p.Sub} ${vb(p, 'takes', 'take')} ${prize} and walks off the lane while the competition is still running.`,
  (n, p, prize, pct) => `At ${pct}% full and a long way back, ${n} makes the call nobody wants to be seen making, and fills the small container for ${prize}.`,
  (n, p, prize, pct) => `${n} stops. Everybody sees ${p.obj} stop. ${p.Sub} ${vb(p, 'pours', 'pour')} into the small box, takes ${prize}, and is out of the competition by ${p.posAdj} own hand.`,
  (n, p, prize, pct) => `${n} does the arithmetic at ${pct}% — the lead, the trips left, the slope — and decides it does not come out. The scoop goes into the small container for ${prize}.`,
  (n, p, prize, pct) => `Nobody talks ${n} out of it, because nobody tries. ${p.Sub} ${vb(p, 'walks', 'walk')} the last scoop to the small box, takes ${prize}, and leaves the lane at ${pct}%.`,
  (n, p, prize) => `${n} has been beaten since the fourth trip and is the only one who has admitted it. ${prize.charAt(0).toUpperCase()}${prize.slice(1)}, and out.`,
];

export const slipperySlope = {
  id: 'bb-physical-slide',
  name: 'Slippery Slope',
  category: 'physical',
  types: ['veto', 'arena', 'hoh'],
  desc: 'One greased, sloping lane each, a barrel of liquid at the top and a container at the bottom with a ping-pong ball floating in it. Houseguests carry what they can in a scoop, fall over most of the way, and pour in whatever survives. The first to fill their container high enough to pull the ball out wins — but a smaller container in every lane holds a lesser prize for anyone willing to quit the competition to take it.',
  // No boldness. It was being counted twice: once here, deciding how well
  // somebody carries a scoop up a greased slope, and again in the temptation
  // formula below, deciding whether they walk off for the prize. The second
  // one is where it belongs — nerve is about the CHOICE, not the climbing —
  // so its weight is redistributed across the three stats that do the work.
  stats: { physical: 0.36, endurance: 0.30, temperament: 0.20, intuition: 0.14 },
  weight: () => 1.2,
  simulate(participants, context, api, rng) {
    const beats = [];
    const breakdown = {};
    const spill = makePicker(rng);
    const fumbleSay = makePicker(rng);
    const grind = makePicker(rng);
    const take = makePicker(rng);
    const threwSay = makePicker(rng);

    const prize = SIDE_PRIZES[Math.floor(rng() * SIDE_PRIZES.length)];
    beats.push(beat(
      OPEN_LINES[Math.floor(rng() * OPEN_LINES.length)](prize.line),
      participants.slice(0, 3), 'THE LANES'));

    const nominees = new Set(context.nominees || []);
    const state = participants.map(name => {
      const t = throwRead(name, context, rng);
      // Read off the declared profile rather than restating it — written out
      // twice, the two copies drift the moment either is retuned.
      const carry = aptitude(name, slipperySlope.stats) / 10;
      return {
        name, carry, fill: 0, trips: 0, spills: 0, fatigue: 0, log: [], hnCost: 0, luck: 0,
        base: Math.round(aptitude(name, slipperySlope.stats) * 100) / 100,
        threw: t.threw, threwChance: t.chance,
        haveNot: (context.haveNots || []).includes(name),
        // Somebody on the block has a reason to keep running and a reason to
        // grab something certain. Both pull, in opposite directions.
        inDanger: nominees.has(name),
        // How much trouble they are in, resolved ONCE.
        //
        // It does not change while the competition runs, and dangerLevel is
        // not cheap — it walks the house twice per call doing perceived-bond
        // and alliance lookups. Calling it from the per-trip, per-player
        // temptation check meant roughly a hundred and fifty of those per
        // competition, which is what made a week noticeably slower to play.
        danger: dangerLevel(name, context),
        tookPrize: false, out: false,
      };
    });

    const FULL = 100;
    let champ = null;
    let trip = 0;
    const MAX_TRIPS = 14;

    while (!champ && trip < MAX_TRIPS) {
      trip++;
      for (const p of state) {
        if (p.out || champ) continue;
        p.trips++;
        p.fatigue = clamp(p.fatigue + 0.55 - p.carry * 0.22, 0, 3.2);

        // How much survives the lane. Falling is common but not constant — at
        // the old rate every houseguest posted nine to twelve falls and the
        // event stopped being an event.
        const slipped = rng() < clamp(0.44 - p.carry * 0.30 + p.fatigue * 0.09, 0.06, 0.66);
        // And the carry has to be big enough that somebody actually reaches the
        // ball: at the old rate nobody filled a container inside fourteen trips
        // and every single competition ended on levels, which meant the small
        // container never came up and the best mechanic never fired.
        const noise = (rng() - 0.5) * 9;
        p.luck += noise;
        let got = clamp(p.carry * 24 + noise - p.fatigue * 1.6, 0.8, 30);
        if (slipped) { got *= 0.28 + rng() * 0.3; p.spills++; }
        if (p.haveNot) { const before = got; got *= 0.86; p.hnCost += before - got; }
        if (p.threw) got *= 0.45;

        p.fill = clamp(p.fill + got, 0, FULL);
        p.log.push({ trip, got: round1(got), slipped, fill: Math.round(p.fill) });

        // ── the grab ──
        //
        // The ball still has to come out, and reaching into a full container
        // while soaked and shaking is its own event: in the real competition
        // people get a hand to it and lose it more than once.
        //
        // It is also what stops this being a foregone conclusion. A race whose
        // progress is purely additive is decided by the stat profile and
        // nothing else — the per-trip luck averages out over eight trips while
        // the carry advantage compounds on every one of them, and measured
        // across sixty competitions the same three houseguests won all of them.
        // Widening the noise and flattening the slip did nothing, because the
        // problem was the shape and not the numbers. Putting a real failure
        // right at the decisive moment gives the field a way back in.
        if (p.fill >= FULL) {
          p.grabs = (p.grabs || 0) + 1;
          const sure = clamp(0.30 + p.carry * 0.10 - p.fatigue * 0.06 + p.grabs * 0.12, 0.15, 0.9);
          if (rng() < sure) { champ = p; break; }
          p.fumbles = (p.fumbles || 0) + 1;
          p.fill = clamp(p.fill - (5 + rng() * 9), 0, FULL);
          p.log.push({ trip, got: 0, slipped: false, fumbled: true, fill: Math.round(p.fill) });
          beats.push(beat(fumbleSay(FUMBLE_LINES)(p.name, pron(p.name)),
            [p.name], 'LOST THE BALL', 'grey'));
        }
      }
      if (champ) break;

      // ── the small container ──
      //
      // Offered once the field has separated: it is only a decision when you
      // can already see you are losing. Boldness keeps somebody running;
      // strategy and being behind push them towards taking the certain thing.
      if (trip >= 3) {
        const live = state.filter(p => !p.out);
        const lead = Math.max(...live.map(p => p.fill));
        for (const p of live) {
          if (p.tookPrize || p === champ) continue;
          const behind = clamp((lead - p.fill) / FULL, 0, 1);
          const s = pStats(p.name);
          // How much trouble they are in, on the same model the whole library
          // uses. This is the dominant term, not a flat nudge: somebody who
          // believes they are going home on Thursday does not walk off a
          // competition that could save them, and no prize is worth enough to
          // change that. A flat `inDanger ? -0.1 : 0.06` was letting nominees
          // stroll off the lane for a letter.
          const danger = p.danger;
          const nerve = (10 - s.boldness) / 10;          // low nerve stops sooner

          // How good this prize looks TO THIS PERSON.
          //
          // Two of the four are worth less than nothing: you quit a
          // competition and finish likelier to be nominated. Before this,
          // every houseguest was equally liable to take one, so a quarter of
          // the field was being made to play badly by a coin flip — which is
          // not a temptation, it is the engine choosing wrong for them.
          //
          // Strategic sense is what reads the trade. A houseguest who has it
          // sees the prize at its real worth and will not stop for a bad one.
          // A houseguest who does not sees a prize, full stop — so the cash
          // still gets taken, by exactly the person whose game that is. The
          // bad prizes become characterisation instead of a design hole.
          const sense = clamp(s.strategic / 10, 0, 1);
          const appeal = prize.worth * sense + (1 - sense) * 0.55;

          const temptation = (behind * 0.55 + nerve * 0.22 + (p.threw ? 0.25 : 0) + 0.06)
            * (1 - danger) * (1 - danger) * appeal;
          if (appeal > 0 && behind > 0.28 && danger < TOO_DESPERATE_TO_STOP
            // Tuned to how often this should be a story rather than a habit:
            // roughly one or two people in a field of twelve, not a quarter of
            // it. Raising this to compensate for the appeal term pushed it the
            // wrong way — appeal is meant to make takes rarer and better
            // motivated, not to be bought back out.
            && rng() < temptation * 0.15) {
            p.tookPrize = true; p.out = true;
            p.prizeTrip = trip;
            const pr = pron(p.name);
            beats.push(beat(
              take(TAKE_LINES)(p.name, pr, prize.line, Math.round(p.fill)),
              [p.name], 'TOOK THE PRIZE', 'grey'));
            // What the prize actually buys. A visible surrender is a visible
            // surrender either way, but the house does not react the same to
            // somebody who took money and somebody who fed them.
            // What they actually walked away with, said plainly. The screen used
            // to name the prize and never once say what it did for them.
            beats.push(beat(prize.gives(p.name), [p.name], `TAKES: ${prize.label}`,
              prize.shared ? 'green' : 'gold'));
            beats.push(beat(prize.sting(p.name), [p.name], prize.label, prize.shared ? 'green' : 'grey'));
            api.popDelta(p.name, prize.pop);
            api.record(p.name, 'slippery-side-prize',
              { prize: prize.key, shared: prize.shared, fill: Math.round(p.fill), trip });
            for (const other of live) {
              if (other === p) continue;
              // Everybody left on a lane feels it a little; the people who were
              // counting on this person feel it properly.
              if (prize.house) { try { api.addBond(p.name, other.name, prize.house); } catch { /* no bond */ } }
              try { if (getBond(p.name, other.name) >= 3) api.addBond(p.name, other.name, prize.allies); } catch { /* no bond, no fallout */ }
            }
            break;   // one defection per trip, so the yard reacts to each one
          }
        }
      }
    }

    // Nobody filled it inside the time: the fullest container takes it. The
    // beat is held back rather than pushed now, because announcing the result
    // before anybody's run has been narrated reads the week backwards.
    let onLevels = false;
    if (!champ) {
      const live = state.filter(p => !p.out);
      champ = (live.length ? live : state).sort((a, b) => b.fill - a.fill)[0];
      onLevels = true;
    }

    // Everybody's run, narrated once.
    state.forEach(p => {
      const pr = pron(p.name);
      if (p.tookPrize) { /* already narrated at the moment it happened */ }
      else if (p.threw) beats.push(beat(threwSay(THROW_LINES)(p.name), [p.name], 'THREW IT', 'grey'));
      else if (p.spills >= Math.max(2, Math.floor(p.trips * 0.6))) {
        beats.push(beat(spill(SPILL_LINES)(p.name, pr), [p.name], `${p.spills} FALLS`, 'grey'));
      } else if (p !== champ) {
        beats.push(beat(grind(GRIND_LINES)(p.name, pr), [p.name], `${Math.round(p.fill)}% FULL`));
      }
    // The Debug tab reports the levers behind every score — aptitude and the
    // luck that moved it. This competition spreads its randomness across many
    // small rolls rather than one, so `roll` is the accumulated deviation,
    // signed so that positive always means luck helped.
      breakdown[p.name] = {
        base: p.base, roll: Math.round(p.luck * 100) / 100,
        fill: Math.round(p.fill), trips: p.trips, spills: p.spills, log: p.log,
        tookPrize: p.tookPrize, prize: p.tookPrize ? prize.key : null, prizeTrip: p.prizeTrip || null,
        threw: p.threw, threwChance: p.threwChance,
        // Reported, not merely applied — the have-not twist is verified by
        // reading this field back off the competition.
        haveNot: p.haveNot, haveNotPenalty: round1(p.hnCost),
        fumbles: p.fumbles || 0,
        score: Math.round(p.fill) + (p.tookPrize ? -25 : 0),
      };
    });

    if (onLevels) {
      beats.push(beat(
        `The horn goes before anybody's ball is high enough to grab. It is decided on the levels, and ${champ.name}'s is the highest at ${Math.round(champ.fill)}%.`,
        [champ.name], 'ON THE LEVELS'));
    }

    const cp = pron(champ.name);
    beats.push(beat(
      champ.fill >= FULL
        ? `${champ.name} gets a hand into the container, closes it around the ball, and holds it up. ${cp.Sub} ${vb(cp, 'is', 'are')} soaked through and has stopped caring.`
        : `${champ.name} finishes with the fullest container in the yard.`,
      [champ.name], context.type === 'veto' ? 'VETO' : 'HOH', 'gold'));
    api.popDelta(champ.name, 2);
    api.record(champ.name, 'slippery-win', { fill: Math.round(champ.fill), trips: champ.trips });

    // Placements: whoever pulled the ball, then everybody by level. Taking the
    // small container costs real position — it is a competition you quit.
    const others = state.filter(p => p !== champ)
      .sort((a, b) => (a.tookPrize === b.tookPrize ? b.fill - a.fill : (a.tookPrize ? 1 : -1)));
    const ordered = [champ, ...others];

    const entries = ordered.map((p, i) => ({
      name: p.name,
      score: Math.round(p.fill) + (ordered.length - i) * 0.01 - (p.tookPrize ? 25 : 0),
      threw: p.threw,
    }));

    return toResult(entries, {
      beats, breakdown, variant: 'knockout',
      text: `${champ.name} wins Slippery Slope${champ.fill >= FULL ? '' : ' on levels'}.`,
    });
  },
};
