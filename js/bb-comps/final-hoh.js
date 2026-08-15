// ══════════════════════════════════════════════════════════════════════
// bb-comps/final-hoh.js — the two parts nobody watches on finale night
// ══════════════════════════════════════════════════════════════════════
//
// The last Head of Household is three competitions, and until now the simulator
// played it as three draws from the weekly library: an endurance comp, a
// physical comp, and whichever of the three quiz comps came up. Which meant the
// most consequential competition of the season was narrated by the same code
// that narrates week four.
//
// These are the first two parts, written as set pieces. Part three is the jury
// quiz and lives with the jury, not here.
//
// The rules they follow are the real ones:
//
//   PART 1 is endurance and ALL THREE play, the outgoing Head of Household
//   included. The winner goes straight to part three and does not play part two.
//
//   PART 2 is a timed skill run between the two who lost part one. They run it
//   separately against a clock. The winner meets the part one winner.
//
// Two design rules hold the whole thing together.
//
// THE THREE PARTS MUST NOT REWARD THE SAME PERSON. If every part is a stat
// sort, the best all-round player wins all three and the structure is theatre.
// So part one is staying power with nerve as its SPREAD, and part two is speed
// multiplied by whether you read the instructions — which is a different
// person, and is the documented way this competition actually gets lost.
//
// THE WALL IS A NEGOTIATION. Three people hang on a wall for hours with nothing
// to do but talk to each other, and what gets said up there is the last deal of
// the season. Somebody can drop on purpose for a promise, and that promise is a
// real deal object that the final cut then has to honour or break. It is the
// only competition in the format where the losing move can be the right one.
import { gs, seasonConfig } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getBond } from '../bonds.js';
import { makeEndgameDeal, dealBetween } from '../bb/deals.js';
import { beat, choose, clamp, makePicker, toResult, vb } from './_shared.js';

const round2 = v => Math.round(v * 100) / 100;
const stat = (name, key) => Number(pStats(name)?.[key]) || 0;

/**
 * A roll whose WIDTH is set by nerve rather than its level.
 *
 * The library documents this at length in `_shared.js`: low temperament here
 * means volatile, not weak, and folding it into staying power quietly says
 * short fuse = quitter. A calm houseguest lands near their own number; a
 * volatile one is a coin toss between walking off in the first hour and
 * planting themselves out of spite.
 *
 * Unlike `scoreField`, these competitions eliminate round after round, so a
 * wide swing is a pure penalty unless it is paid for — every round is another
 * chance to come up short. The mean lift below is that payment.
 */
function nerveRoll(name, rng, spread = 2.6) {
  const steady = stat(name, 'temperament');
  const width = spread * (0.55 + (10 - steady) * 0.09);
  return (rng() - 0.5) * width * 2 + (width - spread) * 0.5;
}

// ══════════════════════════════════════════════════════════════════════
// Part 1 — the wall
// ══════════════════════════════════════════════════════════════════════

const WALL_HOURS = [
  { at: 1, line: 'One hour. Nobody has said anything for twenty minutes.' },
  { at: 2, line: 'Two hours in. The novelty is gone and the arms have started to report in.' },
  { at: 3, line: 'Three hours. The light over the yard has changed colour and nobody up there noticed.' },
  { at: 4, line: 'Four hours. This has stopped being a competition and started being a question about character.' },
  { at: 5, line: 'Five hours, and the conversation up there has gone somewhere strange and quiet.' },
  { at: 6, line: 'Six hours. Everything hurts, everything is wet, and the wall does not care.' },
  { at: 7, line: 'Seven hours. Somebody up there has started talking to the wall itself.' },
  { at: 8, line: 'Eight hours. Whatever is holding these people on is not in the arms any more.' },
];

/** How long they have been up there, in words the narration can use mid-line. */
const heldFor = hours => {
  const whole = Math.floor(hours);
  if (whole < 1) return 'half an hour';
  const h = `${whole} hour${whole === 1 ? '' : 's'}`;
  return hours % 1 ? `${h} and thirty minutes` : h;
};

const WALL_WEATHER = [
  { label: 'THE TILT', line: 'The wall tips forward and holds there, and three sets of knuckles go white at once.' },
  { label: 'COLD WATER', line: 'The water comes on. It is not warm, it is not brief, and it goes straight down the collar.' },
  { label: 'THE WIND', line: 'The fans come up to full. Nobody can hear anybody now, which changes the negotiations considerably.' },
  { label: 'THE DROP', line: 'The platforms step down an inch, all at once, with no warning and no apology.' },
  { label: 'THE LEAN', line: 'The face rocks back, forward, back, on a rhythm somebody designed specifically to break a person.' },
  { label: 'THE COLD', line: 'The temperature falls and keeps falling, and shivering turns out to use the same muscles as holding on.' },
];

const WALL_HOLD = [
  (n, p) => `${n} resets ${p.posAdj} feet, finds the grip again, and settles back in like ${p.sub} ${vb(p, 'has', 'have')} nowhere else to be.`,
  (n, p) => `${n} slips a full hand's width, catches it, and does not let ${p.ref} look down afterwards.`,
  (n, p) => `${n} rides it out with ${p.posAdj} eyes shut and ${p.posAdj} jaw locked, which is the only technique left at this point.`,
  (n, p) => `${n} laughs at something nobody else heard and keeps holding.`,
  (n, p) => `${n} goes very still, the way people do when moving has become the expensive option.`,
  (n, p) => `${n} loses the footplate entirely and hangs off ${p.posAdj} arms for nine seconds before getting it back.`,
];

const WALL_FALL = [
  (n, p) => `${n} goes on the wave — hands open before ${p.sub} ${vb(p, 'has', 'have')} decided anything, which is how it always happens.`,
  (n, p) => `${n} holds through the whole hazard and then lets go in the calm afterwards, which is much harder to watch.`,
  (n, p) => `${n} says ${p.sub} ${vb(p, 'is', 'are')} fine about four seconds before ${p.sub} ${vb(p, 'is', 'are')} very obviously not fine.`,
  (n, p) => `${n} comes off in three separate instalments, each one worse than the last, and lands looking furious.`,
  (n, p) => `${n} slides, corrects, slides the other way, and is in the padding before the correction has finished.`,
  (n, p) => `${n} lets go, and the sound ${p.sub} ${vb(p, 'makes', 'make')} on the way down is not about the fall.`,
];

// What gets said up there. Not decoration — every one of these moves a bond,
// and the offer moves a deal.
const WALL_TAUNT = [
  (n, t) => `${n} starts listing, out loud and in order, every promise ${t} made to somebody who is now on the jury.`,
  (n, t) => `${n} asks ${t}, conversationally, how the speech is going to go — because ${t} is going to need one.`,
  (n, t) => `${n} points out that ${t} has not won anything all season and is not about to start at the worst possible moment.`,
  (n, t) => `${n} tells ${t} that the two of them both know who the third person up here is actually loyal to.`,
];

const WALL_SOLIDARITY = [
  (a, b) => `${a} and ${b} work out a rhythm for shifting their weight together, and for a while the wall is a two-person job.`,
  (a, b) => `${a} talks ${b} through a bad patch in a voice nobody has heard ${a} use before.`,
  (a, b) => `${a} tells ${b} to breathe out on the tilt, which is genuinely good advice and costs ${a} nothing to give.`,
  (a, b) => `${a} and ${b} spend a full hazard talking about home, and neither of them mentions the game once.`,
];

const WALL_OFFER = [
  (o, t) => `${o} says it plainly, into the wind, where the third person can hear every word: come down, and ${o} takes ${t} to the two.`,
  (o, t) => `${o} makes ${t} an offer with a number of hours attached to it. Drop now, and there is a seat at the end with ${t}'s name on it.`,
  (o, t) => `${o} tells ${t} there is no version of tonight where all three of them are happy, and exactly one where two of them are.`,
  (o, t) => `${o} asks ${t} what ${t} thinks the third person up here is going to do with this if they win it, and then lets the question sit.`,
];

const WALL_ACCEPT = [
  (t, o, p) => `${t} looks at ${o} for a long moment, says "you'd better mean it", and opens ${p.posAdj} hands.`,
  (t, o, p) => `${t} takes the deal. ${p.Sub} ${vb(p, 'drops', 'drop')} clean, lands on ${p.posAdj} feet, and does not look back up.`,
  (t, o, p, held) => `${t} says ${p.sub} ${vb(p, 'has', 'have')} been up here ${held} to be told something ${p.sub} already knew, and lets go.`,
  (t, o, p) => `${t} shakes on it one-handed, which should not be possible at this height, and comes down.`,
  (t, o, p, held) => `${t} holds on for another few seconds — long enough that everybody thinks the answer is no — and then, ${held} in, ${p.sub} ${vb(p, 'steps', 'step')} off.`,
];

const WALL_REFUSE = [
  (t, o, p) => `${t} does not answer ${o} at all, which is an answer.`,
  (t, o, p) => `${t} says ${p.sub} ${vb(p, 'has', 'have')} taken enough promises this season to know what they weigh, and re-grips.`,
  (t, o, p) => `${t} tells ${o} that if the seat is real ${o} can hand it over after winning fairly, and settles in.`,
  (t, o, p) => `${t} laughs — actually laughs — and asks ${o} to make it a better offer.`,
];

/**
 * Does this houseguest take the offer?
 *
 * Weighted by how badly the wall is already going for them, what the promise is
 * worth given who is making it, and how much of a gambler they are. Nobody
 * sensible drops in the first hour, so the read is gated on having been up
 * there long enough to be honest about the arms.
 */
function offerRead(target, offerer, { hours, grip, rng }) {
  const bond = getBond(target, offerer);
  const existing = dealBetween(target, offerer);
  const loyalty = stat(target, 'loyalty');
  const bold = stat(target, 'boldness');
  const strategic = stat(target, 'strategic');
  // How much of a chance they think they still have. Low grip = the offer is
  // the best thing on the table.
  const failing = clamp((4.5 - grip) / 5, 0, 1);
  const trust = clamp((bond + 4) / 12, 0, 1) * (existing ? 1.35 : 1);
  const chance = clamp(
    0.06
    + failing * 0.34
    + trust * 0.30
    + (loyalty / 10) * 0.12
    + (hours >= 4 ? 0.10 : 0)
    - (bold / 10) * 0.16
    - (strategic / 10) * 0.10,
    0, 0.72);
  return { chance, took: rng() < chance, failing: round2(failing), trust: round2(trust) };
}

export const finalWall = {
  id: 'bb-final-part-one',
  // Renamed off "The Wall", which is what the weekly endurance competition in
  // signature.js is called. Two competitions sharing a literal name is worse
  // than two sharing a mechanic: every transcript line, badge, timeline pill
  // and picker dropdown prints a name, and a reader had no way of telling
  // which one they were looking at. `finalRole` exists as a workaround for
  // exactly this and only helped the code, never the reader. The id is
  // unchanged, so pinned weeks and recorded seasons still resolve.
  name: 'Nowhere Else to Be',
  category: 'endurance',
  types: ['final'],
  // Which of the two slots this can serve. The finale draws part one from every
  // endurance competition the library has plus the set pieces written for it —
  // the wall is one of the things part one can be, not what part one is.
  finalRole: 'endurance',
  weight: () => 1,
  desc: 'The last three houseguests stand on narrow footplates bolted to a wall angled out over the yard, holding a grip bar with nothing under them but padding. Every few minutes the wall tilts further, the water and the wind come on, and the platforms drop an inch without warning, so the only way to stay on is to keep re-setting your feet while soaked and freezing. Anybody whose hands open is out and cannot return, the three of them can talk to each other the entire time — including about deals to come down — and the last houseguest left on the wall wins the first part of the final Head of Household.',
  stats: { endurance: 0.46, physical: 0.20, temperament: 0.16, boldness: 0.10, loyalty: 0.08 },
  simulate(participants, context, api, rng) {
    const say = makePicker(rng);
    const weather = makePicker(rng);
    // A wall runs for hours and narrates the same category of thing every half
    // hour, so a picker alone is not enough: once its pool is exhausted it
    // starts reusing, and with a large field two rounds can assemble the same
    // sentence. `line()` guarantees the beat text has not been printed before
    // by scanning the pool for an unused rendering when the pick collides.
    const luck = {};   // banked per player, merged into the breakdown downstream
    const printed = new Set();
    const line = (prefix, pool, ...args) => {
      for (const candidate of [say(pool), ...pool]) {
        const text = `${prefix}${candidate(...args)}`;
        if (!printed.has(text)) { printed.add(text); return text; }
      }
      const fallback = `${prefix}${pool[0](...args)}`;
      printed.add(fallback);
      return fallback;
    };
    const beats = [];
    const breakdown = {};
    const week = context?.week || null;
    const weekNum = Number(week?.num) || (gs.bb?.weeks?.length || 0) + 1;

    beats.push(beat(
      `Three houseguests, one wall, and no time limit. The last one holding on plays part three — and does not have to play part two at all.`,
      participants, 'PART ONE', 'gold'));

    let field = participants.map(name => ({
      name,
      // Staying power. Nerve is deliberately absent: it sets the spread below.
      hold: stat(name, 'endurance') * 0.58 + stat(name, 'physical') * 0.26 + stat(name, 'loyalty') * 0.06,
      fatigue: 0,
    }));
    const out = [];          // first off the wall, first in the list
    const tiebreaks = {};
    const deals = [];
    let hours = 0;
    let round = 0;
    let offerMade = false;

    // The wall runs in half-hour rounds, up to eight hours.
    //
    // Attrition is deliberately slow. The first cut of this fell apart in three
    // rounds — a final three wall that was over in ninety minutes, which is not
    // a wall, and left the narration announcing the one-hour mark two beats
    // before somebody won it. The last competition of the season has to be able
    // to run all night, so the fall threshold starts well below anybody's grip
    // and fatigue takes real time to catch up with it.
    while (field.length > 1 && round < 16) {
      round++;
      hours = round * 0.5;

      const hazard = weather(WALL_WEATHER);
      const hourMark = WALL_HOURS.find(h => h.at === hours);
      const rolls = field.map(f => {
        f.fatigue += 0.21 + rng() * 0.15;
        const swing = nerveRoll(f.name, rng);
        // Banked for the Debug tab: how much the night's nerve swing gave or
        // took across the whole wall. Every competition owes the panel an
        // aptitude and a luck figure, and one that reports neither renders a
        // blank row next to the ones that do.
        luck[f.name] = round2((luck[f.name] || 0) + swing);
        const grip = f.hold + swing - f.fatigue;
        return { ...f, grip };
      });
      rolls.sort((a, b) => a.grip - b.grip);

      // ── what gets said between hazards ──
      // Guaranteed from the second round: three people on a wall in silence for
      // six hours is not what happens, and every one of these has a consequence.
      if (field.length > 1 && round >= 2) {
        const weakest = rolls[0];
        const strongest = rolls[rolls.length - 1];
        // ONE offer a wall.
        //
        // Rolling the read every half hour compounded it into a near-certainty:
        // measured at 83% of walls ending in a bought exit, which makes the
        // most dramatic thing this competition can do the ordinary way it ends.
        // The offer is a moment somebody chooses, not a tax on staying up there,
        // so it gets made once — after two hours, when the weakest has been on
        // the wall long enough for the answer to mean something.
        const offerable = rolls.length >= 2 && hours >= 2 && !offerMade
          && weakest.name !== strongest.name;
        const read = offerable
          ? offerRead(weakest.name, strongest.name, { hours, grip: weakest.grip, rng })
          : { took: false, chance: 0 };

        if (offerable) offerMade = true;

        if (offerable && read.took) {
          const p = pronouns(weakest.name);
          beats.push(beat(
            `${choose(rng, WALL_OFFER)(strongest.name, weakest.name)} ${choose(rng, WALL_ACCEPT)(weakest.name, strongest.name, p, heldFor(hours))}`,
            [strongest.name, weakest.name], 'DEAL ON THE WALL', 'gold'));
          // A real deal, not a line. The final cut reads exactly this object and
          // has to decide whether to honour it in front of the jury.
          let deal = null;
          try {
            // `week` here is the week OBJECT — makeEndgameDeal reads `week.num`
            // off it, and handing it the number instead files the promise as
            // having been made in week NaN.
            deal = makeEndgameDeal(strongest.name, weakest.name, 'final-two',
              { week: week || { num: weekNum }, about: 'a promise made on the wall' });
          } catch { /* the drop still happened */ }
          deals.push({ from: strongest.name, to: weakest.name, tier: 'final-two', made: !!deal });
          api.addBond(strongest.name, weakest.name, 1.4);
          // Coming down on purpose reads as a deal to everybody watching, and
          // the audience has never liked being asked to applaud a surrender.
          api.popDelta(weakest.name, -2);
          api.popDelta(strongest.name, 1);
          api.record(weakest.name, 'wall-deal-drop', { with: strongest.name, hours });
          api.record(strongest.name, 'wall-deal-offer', { with: weakest.name, hours });

          tiebreaks[weakest.name] = clamp(weakest.grip / 2 + 2, 0, 9.9);
          breakdown[weakest.name] = {
            hoursHeld: hours, droppedDeliberately: true, dealWith: strongest.name,
            offerChance: round2(read.chance), grip: round2(weakest.grip), score: round2(weakest.grip), threw: false,
          };
          out.push(weakest.name);
          field = rolls.filter(r => r.name !== weakest.name).map(({ name, hold, fatigue }) => ({ name, hold, fatigue }));
          continue;
        }

        if (offerable && read.chance > 0.12) {
          const p = pronouns(weakest.name);
          beats.push(beat(
            `${choose(rng, WALL_OFFER)(strongest.name, weakest.name)} ${choose(rng, WALL_REFUSE)(weakest.name, strongest.name, p)}`,
            [strongest.name, weakest.name], 'OFFER REFUSED', 'red'));
          // Being turned down in front of the third person costs something.
          api.addBond(strongest.name, weakest.name, -0.8);
          api.popDelta(weakest.name, 2);
        } else if (rng() < 0.5) {
          const pair = [rolls[0].name, rolls[1].name];
          beats.push(beat(line('', WALL_SOLIDARITY, pair[0], pair[1]), pair, 'UP THERE TOGETHER', 'green'));
          api.addBond(pair[0], pair[1], 0.6);
        } else {
          const target = rolls[0].name === strongest.name ? rolls[1].name : rolls[0].name;
          beats.push(beat(line('', WALL_TAUNT, strongest.name, target), [strongest.name, target], 'MIND GAMES', 'red'));
          api.addBond(strongest.name, target, -1);
          api.popDelta(strongest.name, -1);
        }
      }

      // ── the hazard itself ──
      const faller = rolls[0];
      // Coming off is a threshold, not a ranking: everybody can survive a round.
      const falls = faller.grip < 0.4 + round * 0.2;
      const p = pronouns(faller.name);
      if (falls && field.length > 1) {
        beats.push(beat(
          line(`${hourMark ? `${hourMark.line} ` : ''}${hazard.line} `, WALL_FALL, faller.name, p),
          [faller.name],
          // Somebody leaving the last competition of their season is not a
          // weather report, and badging it with the hazard read as one.
          field.length === 2 ? 'SECOND OUT' : 'FIRST OUT',
          field.length === 2 ? 'red' : 'challenge'));
        tiebreaks[faller.name] = clamp(faller.grip / 2 + 2, 0, 9.9);
        breakdown[faller.name] = {
          hoursHeld: hours, droppedDeliberately: false, grip: round2(faller.grip),
          fatigue: round2(faller.fatigue), score: round2(faller.grip), threw: false,
        };
        out.push(faller.name);
        field = rolls.slice(1).map(({ name, hold, fatigue }) => ({ name, hold, fatigue }));
      } else {
        beats.push(beat(
          line(`${hourMark ? `${hourMark.line} ` : ''}${hazard.line} `, WALL_HOLD, faller.name, p),
          [faller.name], hazard.label, 'challenge'));
        field = rolls.map(({ name, hold, fatigue }) => ({ name, hold, fatigue }));
      }
    }

    const survivors = field.map(f => f.name);
    survivors.forEach((name, i) => {
      tiebreaks[name] = 9.5 - i;
      breakdown[name] ||= { hoursHeld: hours, droppedDeliberately: false, score: round2(9.5 - i), threw: false };
      breakdown[name].hoursHeld = hours;
    });

    const placements = [...survivors, ...out.reverse()];
    const winner = placements[0];
    const wp = pronouns(winner);
    const held = heldFor(hours);
    beats.push(beat(
      `After ${held}, ${winner} is the only one still on the wall. ${wp.Sub} ${vb(wp, 'has', 'have')} the first seat in part three, and ${wp.sub} ${vb(wp, 'watches', 'watch')} part two from the sofa like everybody else.`,
      [winner], 'WINS PART ONE', 'gold'));
    api.popDelta(winner, 3);
    api.record(winner, 'final-wall-win', { hours, deliberateDrops: deals.length });

    const entries = placements.map((name, idx) => ({
      name,
      score: round2((placements.length - idx) * 10 + clamp(Number(tiebreaks[name]) || 0, 0, 9.9)),
      threw: false,
      base: round2(Number(tiebreaks[name]) || 0),
    }));

    // The deal is NOT pushed to `events`: the dispatcher validates that array as
    // renderable beats and would reject a record with no text of its own. It
    // reaches the finale on the breakdown row instead (`droppedDeliberately`,
    // `dealWith`), which is where a reader looking for why somebody in a final
    // three came off a wall at four hours would go anyway.
    return toResult(entries, {
      luck,
      beats, breakdown, variant: 'final-wall',
      text: `${winner} holds the wall for ${held} and takes part one of the final Head of Household.`
        + (deals.length ? ` ${deals[0].to} came down on a promise from ${deals[0].from}.` : ''),
    });
  },
};

// ══════════════════════════════════════════════════════════════════════
// Part 2 — the run
// ══════════════════════════════════════════════════════════════════════

// `noun` is what the section is called INSIDE a sentence, which is not what it
// is called on a badge. Feeding the badge text back into the narration produced
// "clears the buzzer at a pace that looks unsustainable", where the buzzer is a
// button at the end of a sprint and cannot be cleared at any pace at all.
const RUN_SEGMENTS = [
  { key: 'haul', label: 'THE HAUL', noun: 'the crates',
    line: n => `${n} drags the first crate out of the sand and gets it moving.`,
    mix: { physical: 0.62, endurance: 0.30, boldness: 0.08 }, base: 78 },
  { key: 'sort', label: 'THE SORT', noun: 'the board',
    line: n => `${n} hits the sorting board and starts matching faces to the weeks they left in.`,
    mix: { mental: 0.55, intuition: 0.30, temperament: 0.15 }, base: 96 },
  { key: 'climb', label: 'THE CLIMB', noun: 'the net',
    line: n => `${n} takes the cargo net with the crate up on one shoulder.`,
    mix: { physical: 0.45, endurance: 0.45, temperament: 0.10 }, base: 84 },
  { key: 'balance', label: 'THE BEAM', noun: 'the beam',
    line: n => `${n} steps onto the beam and stops rushing, which is the whole trick.`,
    mix: { temperament: 0.50, intuition: 0.30, physical: 0.20 }, base: 70 },
  { key: 'finish', label: 'THE BUZZER', noun: 'the home straight',
    line: n => `${n} comes off the beam onto the home straight with everything left.`,
    mix: { physical: 0.50, endurance: 0.34, boldness: 0.16 }, base: 62 },
];

const RUN_FAST = [
  (n, p, s) => `${n} takes ${s} without a wasted movement and is gone before the clock has caught up.`,
  (n, p, s) => `${n} goes through ${s} at a pace that looks unsustainable and turns out not to be.`,
  (n, p, s) => `${n} gets ${p.posAdj} whole body into ${s} and buys back time nobody thought was available.`,
  (n, p, s) => `${n} is quick and tidy at ${s}, which is a rarer combination than quick.`,
  (n, p, s) => `${n} has clearly walked ${s} through in ${p.posAdj} head already, and it shows in every decision.`,
  (n, p, s) => `${n} does not stop moving once at ${s}. Not once.`,
  (n, p, s) => `${n} makes ${s} look like the easy part of the course, which it is not.`,
  (n, p, s) => `${n} is through ${s} while the voice on the speaker is still explaining it.`,
];

const RUN_SLOW = [
  (n, p, s) => `${n} loses grip halfway through ${s} and has to start that section again from the mark.`,
  (n, p, s) => `${n} gets ${p.posAdj} feet wrong at ${s}, goes down hard, and takes a moment ${p.sub} ${vb(p, 'does', 'do')} not have.`,
  (n, p, s) => `${n} rushes ${s}, knocks the whole run of it over, and has to reset every piece by hand.`,
  (n, p, s) => `${n} stalls at ${s} — not tired, just suddenly unable to make the decision — and the clock keeps going.`,
  (n, p, s) => `${n} tries to carry too much through ${s} at once, drops half of it, and goes back for the half.`,
  // Deliberately phrased so the section noun is never a sentence's subject:
  // some of them are plural ("the crates") and a template that conjugates a
  // verb onto them prints "the crates is winning".
  (n, p, s) => `${n} is fighting ${s} rather than running it, and losing.`,
  (n, p, s) => `${n} finishes ${s}, looks at it, and knows before the buzzer that it cost too long.`,
  (n, p, s) => `Something goes wrong for ${n} at ${s} that nobody watching can identify, ${p.ref} included.`,
];

const RUN_MISREAD = [
  (n, p) => `${n} has been building it in the wrong order since the horn. The rules were on the board at the start of the course and ${p.sub} ${vb(p, 'walked', 'walk')} straight past them. Every piece comes back off.`,
  (n, p) => `${n} finishes the whole section, steps back, and finds out from a very patient voice on the speaker that the sequence was supposed to run the other way. ${p.Sub} ${vb(p, 'starts', 'start')} it again.`,
  (n, p) => `${n} skipped a line of the instructions — one line — and that line was the one about carrying the crate back. ${p.Sub} ${vb(p, 'has', 'have')} to go and get it.`,
  (n, p) => `${n} did the hard part perfectly and the easy part wrong, and the easy part is the one with a penalty attached.`,
];

const RUN_LEAD = [
  (a, b, m) => `${a} is up on ${b} by ${m} at the split and running like somebody who has not been told.`,
  (a, b, m) => `${m} between them at the halfway mark, ${a} ahead, and the yard has gone quiet.`,
  (a, b, m) => `${a} leads by ${m}. It sounds like a lot. It is about to matter whether ${a} read the board.`,
];

/** Seconds, said the way a competition clock says them. */
const clock = secs => {
  const s = Math.max(0, Math.round(secs));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const gapWords = secs => {
  const s = Math.round(Math.abs(secs));
  // Two runs can land inside the same second, and "0 seconds in it, and 0
  // seconds is all it needs to be" is not a sentence anybody should read.
  if (s < 1) return 'under a second';
  if (s < 60) return `${s} second${s === 1 ? '' : 's'}`;
  const m = Math.floor(s / 60);
  return `${m} minute${m === 1 ? '' : 's'}${s % 60 ? ` and ${s % 60} seconds` : ''}`;
};

export const finalRun = {
  id: 'bb-final-part-two',
  name: 'The Run',
  category: 'physical',
  types: ['final'],
  finalRole: 'skill',
  weight: () => 1,
  desc: 'The two houseguests who lost part one run the same course alone, against a clock, with nobody watching the other one go. They haul crates out of the sand, match evicted houseguests to the weeks they left in on a sorting board, climb a cargo net carrying a crate, cross a beam and sprint the home straight to a buzzer. The full instructions are posted once at the start and never repeated, so a section built in the wrong order has to be taken apart and rebuilt with the clock running — which is how a commanding lead gets lost. The faster of the two times wins part two and goes through to face the part one winner.',
  stats: { physical: 0.34, mental: 0.24, endurance: 0.18, intuition: 0.14, temperament: 0.10 },
  simulate(participants, context, api, rng) {
    const say = makePicker(rng);
    const luck = {};   // banked per player, merged into the breakdown downstream
    const beats = [];
    const breakdown = {};
    // One step per beat, carrying the state of the course at that moment.
    //
    // The narration alone cannot drive a screen that draws two runs against
    // each other: it says what happened to one houseguest at one section, and
    // the interesting thing is where the OTHER one was at the same point. The
    // splits already exist, so this is the same data indexed by card. Nothing
    // here changes a single outcome.
    const steps = [];
    // Every houseguest handed to it runs, rather than the first two.
    //
    // The finale only ever sends the two who lost the wall, so slicing to two
    // was true and fragile: the library smoke-tests every competition with a
    // full house, and one that silently drops ten of the twelve people given to
    // it is a single scheduling mistake away from doing that in a real week.
    const runners = [...participants];

    beats.push(beat(
      runners.length === 2
        ? `${runners[0]} and ${runners[1]} run this one alone. Same course, same clock, and neither of them gets to see the other one do it.`
        : `${runners.length} houseguests run this one alone, one at a time. Same course, same clock, and nobody watches anybody else do it.`,
      runners, 'PART TWO', 'gold'));
    steps.push({ kind: 'open', runners: [...runners] });

    const runs = runners.map(name => {
      const p = pronouns(name);
      const splits = [];
      let total = 0;
      let misread = null;

      // Which section they get wrong, decided before the run so the narration
      // and the penalty can never disagree about where it happened.
      const care = stat(name, 'mental') * 0.52 + stat(name, 'intuition') * 0.28 + stat(name, 'temperament') * 0.20;
      const misreadChance = clamp(0.46 - care * 0.042, 0.05, 0.44);
      const willMisread = rng() < misreadChance;
      const misreadAt = willMisread ? Math.floor(rng() * RUN_SEGMENTS.length) : -1;

      RUN_SEGMENTS.forEach((seg, i) => {
        const apt = Object.entries(seg.mix).reduce((sum, [k, w]) => sum + stat(name, k) * w, 0);
        // Ten stat points is worth about 45% of the base time, so a strong
        // houseguest is meaningfully faster without the weak one being lapped.
        const wobble = (rng() - 0.5) * seg.base * 0.16;
        // Banked in seconds, summed across the course: what the run gave or
        // cost this houseguest that their stats did not account for.
        luck[name] = round2((luck[name] || 0) - wobble);
        let secs = seg.base * (1.28 - (apt / 10) * 0.52) + wobble;
        const stumbled = rng() < clamp(0.30 - apt * 0.02, 0.04, 0.30);
        if (stumbled) secs += seg.base * (0.28 + rng() * 0.34);

        let penalty = 0;
        if (i === misreadAt) {
          // The signature failure of this competition: a rules error, not a
          // fitness one, and big enough to erase a lead built on legs.
          penalty = 52 + rng() * 74;
          secs += penalty;
          misread = { segment: seg.label, penalty: Math.round(penalty) };
        }

        total += secs;
        splits.push({ segment: seg.label, key: seg.key, seconds: Math.round(secs), stumbled, penalty: Math.round(penalty) });

        const line = i === misreadAt
          ? say(RUN_MISREAD)(name, p)
          : stumbled ? say(RUN_SLOW)(name, p, seg.noun)
            : say(RUN_FAST)(name, p, seg.noun);
        beats.push(beat(`${seg.line(name)} ${line}`, [name],
          i === misreadAt ? 'PENALTY' : seg.label, i === misreadAt ? 'red' : 'challenge'));
        steps.push({
          kind: 'segment', who: name, key: seg.key, label: seg.label, index: i,
          seconds: Math.round(secs), stumbled, penalty: Math.round(penalty),
          elapsed: Math.round(total),
        });
      });

      breakdown[name] = {
        totalSeconds: Math.round(total), splits, misread,
        misreadChance: round2(misreadChance), care: round2(care),
        score: round2(1000 - total), threw: false,
      };
      return { name, total, splits, misread, p };
    });

    // The lead at the split, said out loud, because the whole point of this
    // competition is that a lead is not a result.
    const half = runs.map(r => ({ name: r.name, at: r.splits.slice(0, 3).reduce((s, x) => s + x.seconds, 0) }));
    half.sort((a, b) => a.at - b.at);
    if (half.length === 2 && half[1].at - half[0].at > 12) {
      beats.push(beat(choose(rng, RUN_LEAD)(half[0].name, half[1].name, gapWords(half[1].at - half[0].at)),
        [half[0].name, half[1].name], 'AT THE SPLIT', 'grey'));
      steps.push({ kind: 'split', ahead: half[0].name, behind: half[1].name,
        gap: Math.round(half[1].at - half[0].at) });
    }

    runs.sort((a, b) => a.total - b.total);
    const winner = runs[0];
    const loser = runs[1] || null;
    const wp = winner.p;

    if (loser) {
      const margin = loser.total - winner.total;
      const stolen = !!loser.misread && !winner.misread && margin < loser.misread.penalty;
      beats.push(beat(
        stolen
          ? `${winner.name} posts ${clock(winner.total)}. ${loser.name} posts ${clock(loser.total)} — and the ${loser.misread.penalty} seconds ${loser.p.sub} ${vb(loser.p, 'spent', 'spend')} rebuilding ${loser.p.posAdj} own mistake at ${loser.misread.segment.toLowerCase()} is more than the ${gapWords(margin)} that separates them. ${loser.p.Sub} ${vb(loser.p, 'was', 'were')} the faster houseguest tonight and it does not count for anything.`
          : `${winner.name} posts ${clock(winner.total)} to ${loser.name}'s ${clock(loser.total)} — ${gapWords(margin)} in it, and ${gapWords(margin)} is all it needs to be.`,
        [winner.name, loser.name], stolen ? 'LOST ON THE RULES' : 'THE TIMES', stolen ? 'red' : 'gold'));
      steps.push({ kind: 'times', who: winner.name, other: loser.name, stolen,
        margin: Math.round(margin), winnerTotal: Math.round(winner.total),
        loserTotal: Math.round(loser.total) });
      if (stolen) {
        // Losing a final HOH to your own reading is a specific kind of public,
        // and the house watches the tape with you.
        api.popDelta(loser.name, -1);
        api.record(loser.name, 'final-run-misread', { segment: loser.misread.segment, penalty: loser.misread.penalty });
      }
    }

    beats.push(beat(
      `${winner.name} takes part two and goes through to face the wall winner. ${wp.Sub} ${vb(wp, 'gets', 'get')} one night to think about the questions.`,
      [winner.name], 'WINS PART TWO', 'gold'));
    steps.push({ kind: 'win', who: winner.name, seconds: Math.round(winner.total) });
    api.popDelta(winner.name, 2);
    api.record(winner.name, 'final-run-win', { seconds: Math.round(winner.total) });

    const entries = runs.map((r, idx) => ({
      name: r.name,
      score: round2((runs.length - idx) * 10 + clamp(9.9 - (r.total - runs[0].total) / 40, 0, 9.9)),
      threw: false,
      base: round2(r.total),
    }));

    return toResult(entries, {
      luck,
      beats, breakdown, variant: 'final-run',
      detail: {
        steps,
        segments: RUN_SEGMENTS.map(seg => ({ key: seg.key, label: seg.label, base: seg.base })),
        runners: [...runners],
        finished: 'timed',
      },
      text: `${winner.name} runs ${clock(winner.total)} and takes part two of the final Head of Household.`,
    });
  },
};

export const FINAL_HOH_COMPS = [finalWall, finalRun];
export default FINAL_HOH_COMPS;
