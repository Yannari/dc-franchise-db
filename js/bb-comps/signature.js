// ══════════════════════════════════════════════════════════════════════
// bb-comps/signature.js — the six competitions the season is remembered for
// ══════════════════════════════════════════════════════════════════════
//
// The rest of the library scores a field once and sorts it. That is the right
// shape for a Tuesday veto, and the wrong shape for the six competitions the
// format is actually known for, because a single sort can only ever produce the
// best player on paper unless the noise is large enough to make the whole thing
// meaningless.
//
// These have STRUCTURE instead:
//
//   • OTEV runs elimination rounds that score INDEPENDENTLY. Six good rounds
//     and one bad one sends the strongest houseguest home third, which is the
//     single most reliable thing OTEV has ever done on television.
//   • The Wall runs hazard waves with accumulating fatigue — surviving is a
//     sequence of separate holds, not one long average.
//   • Pressure Cooker is asymmetric: as people drop, boxes open, and one
//     specific holder is handed a decision nobody else is offered.
//   • Hide and Go Veto is two-phase and adversarial — your hide is scored
//     against everybody else's search, so hiding well beats searching well.
//   • BB Comics runs each houseguest's run separately, and a mistake costs a
//     whole re-zip. One bad memory beat ruins an otherwise winning time.
//   • Before or After eliminates on single wrong answers. One lapse is fatal
//     in a way a slow average never is.
//
// Everything here rolls with a noise floor around 2.5 on top of a 1–10 stat
// aptitude, per round, and the rounds compound. Upsets are the product, not a
// tolerance.
//
// Contract note: the dispatcher's valid types are hoh / veto / arena /
// tiebreaker. There is no 'return' type in this engine, so the three
// return-eligible competitions are registered for the slots that exist.

import { gs } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { aptitude, beat, choose, clamp, makePicker, throwRead, toResult, THROW_LINES, vb } from './_shared.js';
import { bond } from '../bb-events/_read.js';
import { dangerLevel, TOO_DESPERATE_TO_STOP } from '../bb/strategy.js';

// ── shared plumbing ───────────────────────────────────────────────────

/** Symmetric noise of the requested amplitude. 2.5 is this file's floor. */
/**
 * The luck in a competition, optionally recorded as it is rolled.
 *
 * The Debug tab explains a result with two levers, aptitude and luck, and these
 * six competitions reported neither — so a week that drew one of them rendered
 * blank rows and house-visibility's lever test passed or failed on the draw.
 * Passing an accumulator and a name banks the roll against that houseguest;
 * toResult() carries the map out and the dispatcher merges it into the
 * breakdown, so no competition has to remember to write the field itself.
 */
const noiseRoll = (rng, amount = 2.5, acc = null, who = null) => {
  const v = (rng() - 0.5) * amount * 2;
  if (acc && who) acc[who] = (acc[who] || 0) + v;
  return v;
};

const round2 = v => Math.round(v * 100) / 100;

const stat = (name, key) => Number(pStats(name)?.[key]) || 0;

/**
 * Slop and no sleep, the same contract scoreField enforces for the generic
 * library: a have-not competes at a deficit in EVERY competition, structured
 * or not. Rolled once per player — the whole night is played tired, not one
 * round of it — and recorded on the breakdown row, because a penalty the
 * debug screen cannot see is indistinguishable from a label.
 */
function haveNotDrag(participants, context, rng) {
  const drags = {};
  participants.forEach(name => {
    drags[name] = (context?.haveNots || []).includes(name) ? 1.4 + rng() * 1.6 : 0;
  });
  return drags;
}

/** The two breakdown fields the Have-Nots twist reads, from one drag value. */
const hnFields = drag => ({ haveNot: drag > 0, haveNotPenalty: round2(drag) });

/**
 * Scores derived from finishing ORDER rather than from a running total.
 *
 * Structured competitions do not produce a single comparable number — surviving
 * nine rounds of OTEV and posting a fast Comics time are not the same units. The
 * order is the truth; this turns it into the strictly-decreasing numeric field
 * the dispatcher validates, with the competition's own tiebreak riding in the
 * decimals so the debug screen still shows how close it was.
 */
function rankEntries(placements, tiebreaks = {}, threw = {}) {
  const n = placements.length;
  return placements.map((name, idx) => ({
    name,
    score: round2((n - idx) * 10 + clamp(Number(tiebreaks[name]) || 0, 0, 9.9)),
    threw: !!threw[name],
    base: round2(Number(tiebreaks[name]) || 0),
  }));
}

/**
 * What the house has actually done this season, read defensively.
 *
 * OTEV and Before or After both ask questions ABOUT the season, and a question
 * about a season that has not happened yet has to degrade into flavour rather
 * than into the word "undefined" on screen. Weeks are read one field at a time
 * because the week object is built up across a long function and a competition
 * can run before any of it is set.
 */
function seasonFacts() {
  const weeks = Array.isArray(gs?.bb?.weeks) ? gs.bb.weeks : [];
  const facts = [];
  const nameOf = v => (typeof v === 'string' ? v : (v && typeof v.name === 'string' ? v.name : null));
  weeks.forEach((w, i) => {
    const num = Number(w?.num) > 0 ? Number(w.num) : i + 1;
    if (!Number.isFinite(num)) return;
    const evicted = nameOf(w?.evicted);
    const hoh = nameOf(w?.hoh);
    const veto = nameOf(w?.vetoWinner);
    // Two grammars, because the two quizzes need different ones. OTEV asks a
    // question whose ANSWER is the name, so it can never contain the name;
    // Before or After compares two things that already happened, so it needs a
    // noun phrase rather than a clause. Building one and bending it into the
    // other produced "Did C got sent out the door in week 1 BEFORE or AFTER".
    if (evicted) facts.push({ week: num, who: `who got sent out the door in week ${num}`, event: `${evicted}'s eviction in week ${num}` });
    if (hoh) facts.push({ week: num, who: `who took Head of Household in week ${num}`, event: `${hoh}'s Head of Household win in week ${num}` });
    if (veto) facts.push({ week: num, who: `who pulled the veto out of the box in week ${num}`, event: `${veto}'s veto win in week ${num}` });
  });
  return facts;
}

// ══════════════════════════════════════════════════════════════════════
// 1. OTEV
// ══════════════════════════════════════════════════════════════════════

/** The puppet is different every season and rude in every one of them. */
const OTEV_CREATURES = [
  { name: 'OTEV the Malcontent Manatee', bit: 'surfaces in the tank, blows a spout of what everyone hopes is water over the front row, and announces that this is the worst cast of any season ever produced.' },
  { name: 'OTEV the Bitter Badger', bit: 'claws its way out of a fibreglass burrow, squints at the field, and says out loud that it has seen better competitors in the pest control industry.' },
  { name: 'OTEV the Disappointed Dragon', bit: 'unfolds off its rock, exhales a lungful of stage smoke directly into the front row, and explains that it has eaten heroes and would not bother with anybody here.' },
  { name: 'OTEV the Rancid Raccoon', bit: 'tips itself out of a prop bin, refuses to get up, and delivers its opening remarks lying in the trash it arrived in.' },
  { name: 'OTEV the Spiteful Squid', bit: 'unfurls eight animatronic arms over the ramp, points six of them at the field, and uses the other two to mime falling asleep.' },
];

const OTEV_INSULTS = [
  (c, n) => `${c} tells ${n} that the swim back up the ramp was the most graceful thing about that whole attempt, and the swim was not graceful.`,
  (c, n) => `${c} asks ${n} to confirm, for the audience, that ${n} was in fact trying.`,
  (c, n) => `${c} says it would give ${n} a hint, but hints only work on people.`,
  (c, n) => `${c} congratulates ${n} on making the puppet look intelligent, which it says is a full-time job.`,
  (c, n) => `${c} announces it has decided to root against ${n} personally, and that this is nothing to do with the game.`,
];

const OTEV_FALLBACK_QUESTIONS = [
  '"Which of you can tell me who spent the first night crying in the storage room?"',
  '"Which houseguest volunteered for slop and then complained about slop?"',
  '"Who was the first person in this house to say the words trust me and mean none of them?"',
  '"Which of you promised somebody safety this week? Be honest. I already know."',
  '"Who slept through the alarm and then blamed the alarm?"',
];

const OTEV_WRONG = [
  (n, p) => `${n} comes back up the ramp holding the wrong answer entirely, and knows it before ${p.sub} ${vb(p, 'reaches', 'reach')} the top.`,
  (n, p) => `${n} grabs a name off the pile without reading it, which turns out to be exactly as bad an idea as it sounds.`,
  (n, p) => `${n} has the right answer in ${p.posAdj} head and the wrong one in ${p.posAdj} hand.`,
  (n, p) => `${n} second-guesses ${p.ref} at the bottom of the ramp, switches, and switches to the wrong one.`,
];

const OTEV_SLOW = [
  (n, p) => `${n} has the answer and cannot get up the ramp with it — three runs, three slides back down, and the round is gone.`,
  (n, p) => `${n} loses a shoe in the foam and spends the round competing barefoot on a surface designed by somebody who hates feet.`,
  (n, p) => `${n} is a full body length from the top when the horn goes. ${p.Sub} ${vb(p, 'finishes', 'finish')} the climb anyway, for pride.`,
  (n, p) => `${n} is quick to the pile and slow off it, and slow off it is the half that counts.`,
];

export const otev = {
  id: 'bb-sig-otev',
  name: 'OTEV',
  category: 'mental',
  types: ['veto'],
  weight: () => 1.3,
  desc: 'A foul-tempered animatronic asks a question about the season. Houseguests slide down into the pit, search a scattered pile for the correct answer and race back up a soaked ramp. The last player up the ramp each round — or anyone carrying the wrong answer — is eliminated, and the last houseguest standing wins the Power of Veto.',
  stats: { mental: 0.26, intuition: 0.20, physical: 0.28, endurance: 0.16, boldness: 0.10 },
  simulate(participants, context, api, rng) {
    const luck = {};   // banked by noiseRoll, merged into the breakdown downstream
    const say = makePicker(rng);
    const askedBefore = makePicker(rng);
    const creature = choose(rng, OTEV_CREATURES);
    const facts = seasonFacts();
    const beats = [];
    const breakdown = {};
    const hn = haveNotDrag(participants, context, rng);

    beats.push(beat(`${creature.name} ${creature.bit}`, participants.slice(0, 3), 'OTEV', 'challenge'));

    let field = participants.map(name => ({ name }));
    const out = [];      // first eliminated first
    const tiebreaks = {};
    let round = 0;

    // Every round is scored from scratch. Nothing carries over except who is
    // still standing, which is the entire reason this competition produces
    // winners a single sort never would.
    while (field.length > 1 && round < participants.length + 2) {
      round++;
      const question = facts.length
        ? `"${choose(rng, ['Which of you clowns remembers', 'Somebody in this pit can tell me', 'For a point and my continued contempt —'])} ${choose(rng, facts).who}?"`
        : askedBefore(OTEV_FALLBACK_QUESTIONS);

      const rolls = field.map(f => {
        const recall = (stat(f.name, 'mental') * 0.55 + stat(f.name, 'intuition') * 0.45) + noiseRoll(rng, 3.2, luck, f.name);
        const scramble = (stat(f.name, 'physical') * 0.6 + stat(f.name, 'endurance') * 0.4) + noiseRoll(rng, 2.8, luck, f.name);
        const wrong = recall < 3.4;
        const total = recall * 0.5 + scramble * 0.5 - (wrong ? 4.5 : 0) - hn[f.name];
        return { ...f, recall, scramble, wrong, total };
      });
      rolls.sort((a, b) => a.total - b.total);
      const loser = rolls[0];
      const p = pronouns(loser.name);

      beats.push(beat(
        `${creature.name} asks: ${question} ${loser.wrong ? say(OTEV_WRONG)(loser.name, p) : say(OTEV_SLOW)(loser.name, p)} ${say(OTEV_INSULTS)(creature.name, loser.name)}`,
        [loser.name],
        round === 1 ? 'FIRST OUT' : field.length === 2 ? 'RUNNER-UP' : `ROUND ${round}`,
        field.length === 2 ? 'red' : 'challenge'));

      tiebreaks[loser.name] = clamp(loser.total / 2, 0, 9.9);
      breakdown[loser.name] = {
        roundsSurvived: round - 1, eliminatedRound: round, wrongAnswer: loser.wrong,
        recall: round2(loser.recall), scramble: round2(loser.scramble), score: round2(loser.total), threw: false,
        ...hnFields(hn[loser.name]),
      };
      out.push(loser.name);
      field = rolls.slice(1).map(({ name }) => ({ name }));

      if (field.length === 2) {
        beats.push(beat(
          `Two left in the pit. ${field[0].name} and ${field[1].name} go down the slide on the same horn, and ${creature.name} stops insulting people long enough to watch.`,
          field.map(f => f.name), 'FINAL TWO', 'gold'));
      }
    }

    // Anyone still standing when the cap trips (a very large field) is ranked
    // above everyone already eliminated, in the order they were left in.
    const survivors = field.map(f => f.name);
    survivors.forEach((name, i) => {
      tiebreaks[name] = 6 - i;
      breakdown[name] ||= { roundsSurvived: round, eliminatedRound: null, wrongAnswer: false, score: round2(6 - i), threw: false, ...hnFields(hn[name]) };
    });

    const placements = [...survivors, ...out.reverse()];
    const winner = placements[0];
    const wp = pronouns(winner);
    beats.push(beat(
      `${winner} comes up the ramp with the right answer and nobody behind ${wp.obj}. ${creature.name} announces that ${winner} is still terrible, and hands over the veto anyway.`,
      [winner], 'VETO', 'gold'));
    api.popDelta(winner, 2);
    api.record(winner, 'otev-win', { rounds: round, creature: creature.name });

    const entries = rankEntries(placements, tiebreaks);
    return toResult(entries, {
      luck,
      beats, breakdown, variant: 'otev',
      text: `${winner} survives ${round} rounds of ${creature.name} and wins the Power of Veto.`,
    });
  },
};

// ══════════════════════════════════════════════════════════════════════
// 2. The Wall
// ══════════════════════════════════════════════════════════════════════

const WALL_HAZARDS = [
  { label: 'THE TILT', line: 'The wall tips forward another six degrees and holds there.' },
  { label: 'COLD WATER', line: 'The water comes on. It is not warm and it is not brief.' },
  { label: 'SLIME', line: 'Green slime pours over the top edge and finds every grip on the way down.' },
  { label: 'THE SHIFT', line: 'The platforms shudder and step down an inch, all at once, without warning.' },
  { label: 'WIND', line: 'The fans come up to full and stay there, and nobody can hear anybody now.' },
  { label: 'THE LEAN', line: 'The whole face rocks back, then forward, then back, on a rhythm designed to break one.' },
];

const WALL_GO = [
  (n, p) => `${n} goes on the wave — hands open before ${p.sub} ${vb(p, 'has', 'have')} decided anything, which is how it always happens.`,
  (n, p) => `${n} skids a foot, corrects, skids the other, and is in the padding before the correction finishes.`,
  (n, p) => `${n} holds through the whole wave and then lets go in the calm afterwards, which everybody watching finds harder to look at.`,
  (n, p) => `${n} announces ${p.sub} ${vb(p, 'is', 'are')} fine roughly four seconds before ${p.sub} ${vb(p, 'is', 'are')} not fine.`,
  (n, p) => `${n} loses the wall slowly, in three separate instalments, each one worse to watch than the last.`,
];

// Coming off a wall because you are DONE is a different scene from being
// thrown off it, and it is the one the format actually turns on — almost
// nobody is prised off a wall, they climb down.
const WALL_DOWN = [
  (n, p) => `${n} does not fall. ${p.Sub} ${vb(p, 'looks', 'look')} at the padding for a while, says "yeah, I'm done", and ${vb(p, 'climbs', 'climb')} down while the wave is still coming.`,
  (n, p) => `${n} could hold this. ${p.Sub} ${vb(p, 'has', 'have')} decided ${p.sub} ${vb(p, 'does', 'do')} not want to, which takes about six seconds to say and four hours to arrive at.`,
  (n, p) => `${n} steps off between waves, in the quiet, with nothing dramatic happening at all. That is how most of these end.`,
  (n, p) => `The cold gets to the part of ${n} that makes decisions before it gets to ${p.posAdj} hands. ${p.Sub} ${vb(p, 'is', 'are')} on the ground and apologising to nobody in particular.`,
  (n, p) => `${n} asks how long it has been. Somebody tells ${p.obj}. ${p.Sub} ${vb(p, 'comes', 'come')} down on the next wave.`,
  // Not every voluntary exit is a quiet one. Coming off angry is still coming
  // off, and it is the exit a short fuse gets.
  (n, p) => `${n} takes one more wave of slime in the face, says something short into the noise, and ${vb(p, 'is', 'are')} off the wall before anybody works out what it was.`,
  (n, p) => `Somebody laughs at the wrong moment. ${n} is down in ten seconds and it is very clear that the wall had nothing to do with it.`,
];

const WALL_GRIND = [
  (n, p) => `${n} has stopped talking. ${p.Sub} ${vb(p, 'has', 'have')} been in the same position for forty minutes and the position is not a good one.`,
  (n, p) => `${n} works ${p.posAdj} feet back onto the ledge an inch at a time and buys another hour with it.`,
  (n, p) => `Somebody offers ${n} a deal from the ground. ${n} does not look down.`,
  (n, p) => `${n} is shaking in a way that has nothing to do with the cold and everything to do with how long ${p.sub} ${vb(p, 'has', 'have')} been up there.`,
];

export const theWall = {
  id: 'bb-sig-the-wall',
  name: 'The Wall',
  category: 'endurance',
  types: ['hoh', 'tiebreaker', 'return'],
  weight: () => 1.3,
  desc: 'Houseguests stand on narrow platforms bolted to a wall that tilts further forward as the night goes on, while timed waves of cold water, slime and moving platforms hit the field. Anyone who falls or steps down is out, and the last houseguest still on the wall wins Head of Household.',
  // Boldness is gone. Nothing on this wall is a wager — there is no prize
  // offer, no hold-or-drop gamble, nothing being risked for a reward — so it
  // was 14% of the weight on a stat with no mechanism behind it. (Slippery
  // Slope keeps its boldness because that competition really does ask a
  // question; it asks it at the prize, not on the climb.)
  //
  // Temperament stays, but NOT as a grit stat, which is the trap. In this
  // simulator low temperament means volatile — angry, impulsive, quick to
  // snap — and that is not the same as weak-willed. Plenty of hotheads have
  // stayed on a wall out of pure spite, and reading temperament as "willing to
  // suffer" quietly turns every short fuse into a quitter.
  //
  // So temperament does not set the LEVEL here, it sets the SPREAD. How long
  // somebody is prepared to stay up there comes from endurance; how
  // PREDICTABLE that is comes from temperament. A calm houseguest performs
  // near their own number every time. A volatile one is a coin toss between
  // storming down at hour two and planting themselves out of stubbornness
  // until everybody else has gone — same average, wildly different night.
  stats: { endurance: 0.46, physical: 0.30, temperament: 0.24 },
  roles: {
    // What the body can do. One check, not two — an earlier version rolled
    // "grip" and "resolve" separately and took the worse, which sounded right
    // and measured terribly: with temperament moved out of resolve's average,
    // resolve was just grip again, so the same endurance number got checked
    // twice and one houseguest took 75% of the competition.
    capacity: { endurance: 0.61, physical: 0.39 },
    // And the dial for how far from that number the night actually lands.
    steadiness: { temperament: 1 },
  },
  simulate(participants, context, api, rng) {
    const luck = {};   // banked by noiseRoll, merged into the breakdown downstream
    const say = makePicker(rng);
    const grind = makePicker(rng);
    const down = makePicker(rng);
    const beats = [];
    const breakdown = {};
    const hn = haveNotDrag(participants, context, rng);

    const holders = participants.map(name => {
      const t = throwRead(name, context, rng);
      // Steadiness 10 swings by about 2; steadiness 1 swings by about 6, in
      // both directions — the volatile houseguest is as likely to outlast the
      // field on stubbornness as to walk off in the third hour.
      const steady = aptitude(name, this.roles.steadiness);
      const swing = 2.4 + (10 - steady) * 0.42;
      // Variance is not free in a competition that eliminates every wave, and
      // measuring proved it: each wave is another chance to roll under the bar,
      // while rolling high only buys survival, which is capped. Left alone, a
      // wide swing simply loses — and the screen would once again be saying
      // short fuse = quitter, which is the thing being fixed.
      //
      // So the swing buys something real: stubbornness. A volatile houseguest
      // holds a higher line on the nights they decide to, which is exactly how
      // it looks from the sofa — the person nobody expected is still up there
      // at hour nine, right up until the week they walk off at hour two.
      const spite = (swing - 2.4) * 0.55;
      return { name, apt: aptitude(name, this.stats),
        capacity: aptitude(name, this.roles.capacity) + spite,
        steady,
        // Calm houseguests land near their own number every time; volatile
        // ones are a coin toss between storming down early and planting
        // themselves out of stubbornness. Same average, different night.
        swing,
        threw: t.threw, threwChance: t.chance, waves: 0, last: 0 };
    });

    beats.push(beat(
      `The wall starts level. It stays level for about four minutes, and then the hydraulics take the whole face forward and nobody on it is standing up straight again tonight.`,
      participants.slice(0, 3), 'THE WALL', 'challenge'));

    let standing = [...holders];
    const out = [];
    const tiebreaks = {};
    const threwMap = {};
    let wave = 0;
    const maxWaves = participants.length + 8;

    // Waves score independently, but fatigue accumulates — which is what makes
    // this different from one endurance sort. A houseguest can survive nine
    // waves on nerve alone and then lose the tenth to a bad roll.
    while (standing.length > 2 && wave < maxWaves) {
      wave++;
      const hazard = WALL_HAZARDS[(wave - 1) % WALL_HAZARDS.length];
      const fatigue = wave * 0.42;
      const bar = 2.6 + wave * 0.34;

      const rolls = standing.map(h => {
        const throwDrag = h.threw && wave >= 2 ? 5 + rng() * 3 : 0;
        // Two ways off. GRIP is whether the body holds the platform through
        // the hazard; RESOLVE is whether the person is still willing to be up
        // there at all. Misery compounds faster than fatigue does — hour six
        // is not twice as hard as hour three, it is worse than that — so
        // resolve carries the steeper multiplier.
        // Named apart from h.grip / h.resolve deliberately: these are THIS
        // wave's rolls, and writing them back over the base stats would carry
        // the fatigue forward and charge it again next wave.
        // One roll, on the width temperament sets. This is where the stat
        // earns its 24%: it does not decide how long somebody CAN stay up
        // there, it decides how far tonight lands from that.
        const hold = h.capacity - fatigue - throwDrag - hn[h.name]
          + noiseRoll(rng, h.swing, luck, h.name);
        // And then HOW they came off, which is a separate question with a
        // separate answer. Most people leave a wall on their own legs, and the
        // shorter the fuse the likelier the exit was a decision rather than a
        // slip — an angry houseguest is not less determined, they are just
        // more likely to be done in a way everybody hears.
        const quit = rng() < clamp(0.30 + (10 - h.steady) * 0.045, 0.2, 0.78);
        return { ...h, hold, quit };
      }).sort((a, b) => a.hold - b.hold);

      // Everyone under the bar goes, but never the whole wall at once, and at
      // least one person goes every wave so the competition cannot stall.
      let falling = rolls.filter(r => r.hold < bar);
      if (!falling.length) falling = [rolls[0]];
      falling = falling.slice(0, Math.max(1, Math.min(falling.length, standing.length - 2)));

      const stillUp = rolls.filter(r => !falling.includes(r));
      if (falling.length) {
        const names = falling.map(f => f.name);
        const listed = names.length > 2
          ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
          : names.join(' and ');
        const verb = names.length === 1 ? 'takes it badly'
          : names.length === 2 ? 'both take it badly' : 'all take it badly';
        beats.push(beat(
          `${hazard.line} ${listed} ${verb}, with ${stillUp.length} still up there.`,
          names, hazard.label, 'challenge'));
      }

      falling.forEach(f => {
        const p = pronouns(f.name);
        beats.push(beat(
          f.threw ? say(THROW_LINES)(f.name)
            : f.quit ? down(WALL_DOWN)(f.name, p) : say(WALL_GO)(f.name, p),
          [f.name],
          f.threw ? 'THREW IT'
            : f.quit ? 'STEPS DOWN' : out.length === 0 ? 'FIRST DOWN' : 'DROPS',
          f.threw ? 'grey' : 'challenge'));
        tiebreaks[f.name] = clamp(wave * 0.4 + f.hold / 4, 0, 9.9);
        threwMap[f.name] = f.threw;
        breakdown[f.name] = {
          wavesSurvived: wave - 1, fellOnWave: wave, hazard: hazard.label,
          // Which of the two gave out, and by how much — the Debug tab was
          // reporting one aptitude for a competition with two ways to lose.
          leftBy: f.quit ? 'stepped down' : 'lost the wall',
          capacity: round2(f.capacity), swing: round2(f.swing),
          aptitude: round2(f.apt), hold: round2(f.hold), threwChance: f.threwChance, threw: f.threw, score: round2(f.hold),
          ...hnFields(hn[f.name]),
        };
        out.push(f.name);
        if (wave >= 4) api.popDelta(f.name, 1);
      });

      // grip and resolve travel with them: dropping the fields here left the
      // next wave rolling both checks against undefined.
      standing = stillUp.map(({ name, apt, capacity, steady, swing, threw, threwChance }) =>
        ({ name, apt, capacity, steady, swing, threw, threwChance }));

      if (wave === 3 || wave === 7) {
        const grinder = standing[Math.floor(rng() * standing.length)];
        if (grinder) beats.push(beat(grind(WALL_GRIND)(grinder.name, pronouns(grinder.name)), [grinder.name], 'STILL UP', 'grey'));
      }
    }

    // The last two. Sorted by one more independent hold, and then negotiated.
    // The last two, asked once more on their own widths.
    const finalTwo = standing.map(h => ({ ...h,
      hold: h.capacity - wave * 0.42 - hn[h.name] + noiseRoll(rng, h.swing, luck, h.name)
        - (h.threw ? 6 : 0) }))
      .sort((a, b) => b.hold - a.hold);
    let [champ, second] = finalTwo;

    if (second) {
      const close = bond(champ.name, second.name);
      if (close >= 3) {
        // Allies do not stand on a wall arguing for another four hours. One of
        // them comes down on a promise, and the promise is real state.
        beats.push(beat(
          `${champ.name} and ${second.name} are the only two left and they are on the same side of everything. It takes about two minutes of talking nobody else can hear before ${second.name} steps down on a promise of safety.`,
          [champ.name, second.name], 'DEAL STRUCK', 'green'));
        api.addBond(champ.name, second.name, 1);
        api.record(second.name, 'stepped-down-for-ally', { ally: champ.name, wave });
        api.record(champ.name, 'owes-safety', { to: second.name });
      } else {
        beats.push(beat(
          `${champ.name} and ${second.name} refuse each other three separate deals, and then ${second.name} runs out of hands. Hour ${Math.max(2, Math.round(wave * 0.7))}, and no arrangement.`,
          [champ.name, second.name], 'NO DEAL', 'red'));
      }
      tiebreaks[second.name] = clamp(9 + second.hold / 100, 0, 9.9);
      threwMap[second.name] = second.threw;
      breakdown[second.name] = { wavesSurvived: wave, fellOnWave: null, aptitude: round2(second.apt), hold: round2(second.hold), threwChance: second.threwChance, threw: second.threw, score: round2(second.hold), ...hnFields(hn[second.name]) };
    }

    tiebreaks[champ.name] = 9.9;
    threwMap[champ.name] = false;
    breakdown[champ.name] = { wavesSurvived: wave, fellOnWave: null, aptitude: round2(champ.apt), hold: round2(champ.hold), threwChance: champ.threwChance, threw: false, score: round2(champ.hold), ...hnFields(hn[champ.name]) };

    const cp = pronouns(champ.name);
    beats.push(beat(
      `${champ.name} is the last one on the wall, ${wave} waves and most of a night after it started, and ${cp.sub} ${vb(cp, 'has', 'have')} to be helped down.`,
      [champ.name], context.type === 'veto' ? 'VETO' : 'HOH', 'gold'));
    api.popDelta(champ.name, 2);
    api.record(champ.name, 'endurance-win', { waves: wave, competition: 'the-wall' });

    const placements = [champ.name, ...(second ? [second.name] : []), ...out.reverse()];
    const entries = rankEntries(placements, tiebreaks, threwMap);
    return toResult(entries, {
      luck,
      beats, breakdown, variant: 'the-wall',
      text: `${champ.name} outlasts ${participants.length - 1} houseguests on the wall through ${wave} hazard waves.`,
    });
  },
};

// ══════════════════════════════════════════════════════════════════════
// 3. Pressure Cooker
// ══════════════════════════════════════════════════════════════════════

const COOKER_PRIZES = [
  { label: 'a wrapped card promising a phone call home', pull: 3.2 },
  { label: 'five thousand dollars in a briefcase, counted out on camera', pull: 2.8 },
  { label: 'a week of safety, signed and dated', pull: 4.0 },
  { label: 'a hamper of real food and a hot shower', pull: 2.2 },
  { label: 'a letter, unopened, with handwriting on it everybody in the box can see from here', pull: 3.6 },
];

const COOKER_PUNISHMENTS = [
  { label: 'the heat', line: 'goes up eight degrees inside the box and stays there', bite: 0.9 },
  { label: 'the noise', line: 'starts — a single tone at a volume chosen by somebody with a grudge', bite: 0.7 },
  { label: 'the lights', line: 'strobe, on a pattern that makes the walls appear to move', bite: 0.8 },
  { label: 'the cold', line: 'comes on instead, which after the heat is worse than the heat was', bite: 0.85 },
];

const COOKER_HOLD = [
  (n, p) => `${n} has ${p.posAdj} forehead against the glass and ${p.posAdj} thumb still on the button, and has not said a word in an hour.`,
  (n, p) => `${n} is counting out loud to stay awake. The count has been wrong for a while and nobody in the box has the energy to say so.`,
  (n, p) => `${n} switches hands, which is allowed, and nearly loses the button doing it, which is not survivable twice.`,
  (n, p) => `${n} keeps looking at the boxes instead of the button. That is how they get you and ${p.sub} ${vb(p, 'knows', 'know')} it.`,
];

const COOKER_CRACK = [
  (n, p) => `${n} lifts ${p.posAdj} thumb, deliberately, and sits down on the floor of the box before anybody can talk ${p.obj} out of it.`,
  (n, p) => `${n} loses the button falling asleep standing up, and wakes up to the horn already going.`,
  (n, p) => `${n} says ${p.sub} cannot feel ${p.posAdj} arm any more, waits for somebody to argue, and lets go when nobody does.`,
  (n, p) => `${n} slides down the glass slowly with the button still pressed, and then not pressed.`,
];

export const pressureCooker = {
  id: 'bb-sig-pressure-cooker',
  name: 'Pressure Cooker',
  category: 'endurance',
  types: ['hoh', 'tiebreaker', 'return'],
  weight: () => 1.3,
  desc: 'Houseguests are sealed in a glass box, each holding a button down with one hand. Lifting a thumb eliminates that player, and every elimination opens a mystery box — some hold prizes offered to the players still holding on, some hold punishments applied to everyone left inside. The last houseguest still on the button wins Head of Household.',
  // Two abilities live in this competition and they were being mixed into one
  // number. The MAIN score is only ever "can this houseguest keep holding" —
  // endurance, the mental discipline to keep holding, and enough physical to
  // stand there with a thumb down. Boldness belongs to the other question, and
  // it now lives entirely in the prize offer below, where it is actually
  // deciding something.
  //
  // And the same correction the wall needed: at 35% this was the heaviest
  // temperament weight in the library, all of it read as "the mental
  // discipline to keep holding" — which is determination, not composure. A
  // volatile houseguest is not less able to hold a button down; they are less
  // PREDICTABLE about how long they will choose to. So temperament sets the
  // spread around somebody's holding power rather than the holding power.
  stats: { endurance: 0.60, temperament: 0.25, physical: 0.15 },
  roles: {
    capacity: { endurance: 0.78, physical: 0.22 },
    steadiness: { temperament: 1 },
  },
  simulate(participants, context, api, rng) {
    const luck = {};   // banked by noiseRoll, merged into the breakdown downstream
    const say = makePicker(rng);
    const hold = makePicker(rng);
    const beats = [];
    const breakdown = {};
    const hn = haveNotDrag(participants, context, rng);

    let inside = participants.map(name => {
      const t = throwRead(name, context, rng);
      // A have-not walks into the box already dragging — slop is a head start
      // for everyone else, applied through the same fatigue the boxes add.
      // Holding power, and the width of the night around it. The spite term
      // exists for the same reason it does everywhere else: in a competition
      // that eliminates on every box, a wider swing with no matching ceiling
      // is just a penalty for having a temper.
      const steady = aptitude(name, this.roles.steadiness);
      const swing = 0.62 + (10 - steady) * 0.085;
      return { name, apt: aptitude(name, this.roles.capacity) + (swing - 1) * 1.6,
        steady, swing,
        threw: t.threw, threwChance: t.chance, drag: hn[name], tempted: 0 };
    });

    beats.push(beat(
      `The door of the box seals with ${participants.length} houseguests inside it and one button each. The clock on the outside wall starts at zero and nobody in there is going to like where it finishes.`,
      participants.slice(0, 3), 'SEALED IN', 'challenge'));

    const out = [];
    const tiebreaks = {};
    const threwMap = {};
    let hours = 0;
    let box = 0;
    const cap = participants.length + 6;

    while (inside.length > 1 && box < cap) {
      box++;
      hours = round2(0.75 + box * 1.15);
      const bar = 2.2 + box * 0.30;

      const rolls = inside.map(h => {
        const throwDrag = h.threw && box >= 2 ? 5 + rng() * 3 : 0;
        // Width per houseguest, not per competition: the calm one lands near
        // their own number, the volatile one is a different person each box.
        const grip = h.apt - h.drag - throwDrag - box * 0.30
          + noiseRoll(rng, 2.7 * h.swing, luck, h.name);
        return { ...h, grip };
      }).sort((a, b) => a.grip - b.grip);

      let dropping = rolls.filter(r => r.grip < bar);
      if (!dropping.length) dropping = [rolls[0]];
      dropping = dropping.slice(0, Math.max(1, Math.min(dropping.length, inside.length - 1)));

      dropping.forEach(d => {
        const p = pronouns(d.name);
        beats.push(beat(
          `Hour ${hours}. ${d.threw ? say(THROW_LINES)(d.name) : say(COOKER_CRACK)(d.name, p)}`,
          [d.name], d.threw ? 'THREW IT' : out.length === 0 ? 'FIRST OFF' : 'BUTTON RELEASED', d.threw ? 'grey' : 'challenge'));
        tiebreaks[d.name] = clamp(box * 0.5 + d.grip / 4, 0, 9.9);
        threwMap[d.name] = d.threw;
        breakdown[d.name] = {
          hoursHeld: hours, boxesOpened: box, aptitude: round2(d.apt), fatigueDrag: round2(d.drag),
          grip: round2(d.grip), tempted: d.tempted, threwChance: d.threwChance, threw: d.threw, score: round2(d.grip),
          ...hnFields(hn[d.name]),
        };
        out.push(d.name);
        if (box >= 3) api.popDelta(d.name, 1);
      });

      inside = rolls.filter(r => !dropping.includes(r))
        .map(({ name, apt, steady, swing, threw, threwChance, drag, tempted }) =>
          ({ name, apt, steady, swing, threw, threwChance, drag, tempted }));
      if (inside.length <= 1) break;

      // A box opens for every houseguest who leaves. Half of them are offers
      // made to ONE specific holder — which is the asymmetry: everyone else in
      // that box is playing a completely different game for the next minute.
      if (rng() < 0.55) {
        const prize = choose(rng, COOKER_PRIZES);
        const mark = inside[Math.floor(rng() * inside.length)];
        const p = pronouns(mark.name);
        // Taking the offer is a different question from holding on, and it is
        // the one boldness answers. Low temperament belongs here too: coming
        // off the button for a prize is an impulse, and the houseguest who
        // cannot sit with a want is the one who takes it. Strategic pulls the
        // other way — the cost of the room is obvious to anybody counting.
        // How much trouble they are in, on the model the whole library shares.
        // It is a multiplier rather than a term because it is not one factor
        // among several: a houseguest who believes they are going home does
        // not come off the button for a prize at any price, and the offer is
        // only interesting to somebody who can afford to say yes.
        const danger = dangerLevel(mark.name, context);
        const temptation =
          (stat(mark.name, 'boldness') * 0.25
            + (10 - stat(mark.name, 'temperament')) * 0.35
            + (10 - stat(mark.name, 'strategic')) * 0.25
            + mark.drag * 0.15) + prize.pull;
        const greed = (temptation / 14) * (1 - danger) * (1 - danger);
        // A hard floor, not a nudge: winning this competition is the escape,
        // so anybody who needs the escape does not trade it for a prize.
        const takes = danger < TOO_DESPERATE_TO_STOP
          && rng() < clamp(greed, 0.04, 0.62) && inside.length > 2;
        if (takes) {
          beats.push(beat(
            `Box ${box} opens on ${prize.label}, and it is offered to ${mark.name} alone. ${p.Sub} ${vb(p, 'looks', 'look')} at it for eleven seconds and then takes ${p.posAdj} thumb off the button to go and get it.`,
            [mark.name], 'TOOK THE PRIZE', 'gold'));
          tiebreaks[mark.name] = clamp(box * 0.5 + 1, 0, 9.9);
          threwMap[mark.name] = mark.threw;
          breakdown[mark.name] = {
            hoursHeld: hours, boxesOpened: box, aptitude: round2(mark.apt), tookPrize: prize.label,
            tempted: mark.tempted + 1, threwChance: mark.threwChance, threw: mark.threw, score: round2(mark.apt),
            ...hnFields(hn[mark.name]),
          };
          out.push(mark.name);
          inside = inside.filter(h => h.name !== mark.name);
          api.popDelta(mark.name, -1);
          api.record(mark.name, 'took-the-prize', { prize: prize.label, hours });
        } else {
          beats.push(beat(
            `Box ${box} opens on ${prize.label}, and it is offered to ${mark.name} alone. ${p.Sub} ${vb(p, 'says', 'say')} no out loud, twice, mostly to ${p.ref}.`,
            [mark.name], 'REFUSED THE PRIZE', 'green'));
          mark.tempted += 1;
          mark.drag += 0.25;
          api.popDelta(mark.name, 1);
          api.record(mark.name, 'refused-the-prize', { prize: prize.label, hours });
        }
      } else {
        const pun = choose(rng, COOKER_PUNISHMENTS);
        beats.push(beat(
          `Box ${box} opens on nothing anybody wants. ${pun.line[0].toUpperCase()}${pun.line.slice(1)}, for the ${inside.length} still holding on.`,
          inside.map(h => h.name).slice(0, 4), 'PUNISHMENT', 'red'));
        inside.forEach(h => { h.drag += pun.bite; });
      }

      if (inside.length > 1 && box % 3 === 0) {
        const grinder = inside[Math.floor(rng() * inside.length)];
        beats.push(beat(`Hour ${round2(hours + 0.5)}. ${hold(COOKER_HOLD)(grinder.name, pronouns(grinder.name))}`,
          [grinder.name], 'STILL HOLDING', 'grey'));
      }
    }

    const champ = inside[0] || { name: out.pop(), apt: 0, drag: 0, tempted: 0, threwChance: 0 };
    tiebreaks[champ.name] = 9.9;
    threwMap[champ.name] = false;
    breakdown[champ.name] = {
      hoursHeld: hours, boxesOpened: box, aptitude: round2(champ.apt || 0), fatigueDrag: round2(champ.drag || 0),
      tempted: champ.tempted || 0, threwChance: champ.threwChance || 0, threw: false, score: round2(champ.apt || 0),
      ...hnFields(hn[champ.name] || 0),
    };

    const cp = pronouns(champ.name);
    beats.push(beat(
      `${round2(hours + 1)} hours after the door sealed, ${champ.name} is the only thumb still down. ${cp.Sub} cannot straighten ${cp.posAdj} hand for the rest of the night and does not appear to care.`,
      [champ.name], context.type === 'veto' ? 'VETO' : 'HOH', 'gold'));
    api.popDelta(champ.name, 2);
    api.record(champ.name, 'endurance-win', { hours, competition: 'pressure-cooker' });

    const placements = [champ.name, ...out.reverse()];
    const entries = rankEntries(placements, tiebreaks, threwMap);
    return toResult(entries, {
      luck,
      beats, breakdown, variant: 'pressure-cooker',
      text: `${champ.name} holds the button for ${round2(hours + 1)} hours and wins Head of Household.`,
    });
  },
};

// ══════════════════════════════════════════════════════════════════════
// 4. Hide and Go Veto
// ══════════════════════════════════════════════════════════════════════

const HIDING_PLACES = [
  'inside the lining of a beanbag in the lounge', 'taped under the lip of the kitchen island',
  'in the pocket of somebody else\'s jacket', 'behind the false back of the pantry shelving',
  'zipped into a pillow in the have-not room', 'under the tray of the laundry hamper',
  'wedged in the frame of the memory wall', 'inside a boot nobody has worn all season',
  'buried in the ice of the chest freezer', 'in the dirt of the fake plant by the diary room',
];

const HIDE_LINES = [
  (n, p, w) => `${n} spends nine of ${p.posAdj} ten minutes walking around not hiding anything, and the last one putting the card ${w}.`,
  (n, p, w) => `${n} hides the card ${w}, stands back, decides it is too obvious, and puts it back exactly where it was.`,
  (n, p, w) => `${n} goes straight for the spot ${p.sub} picked out on day four and puts the card ${w} without breaking stride.`,
  (n, p, w) => `${n} hides ${p.posAdj} card ${w} and then hides a decoy somewhere stupid, which is either brilliant or a waste of ten minutes.`,
];

const FOUND_LINES = [
  (f, o, p) => `${f} finds ${o}'s card in under a minute and holds it up without saying anything. ${o} watches ${p.posAdj} own name go on the board.`,
  (f, o) => `${f} pulls ${o}'s card out on the third guess. ${o} does not react, which takes visible effort.`,
  (f, o, p) => `${f} tears a room apart, finds nothing, comes back to it and finds ${o}'s card exactly where ${p.sub} first looked.`,
  (f, o) => `${f} says out loud that ${o} would hide it somewhere clever, then looks somewhere stupid, and is right.`,
];

const MISS_LINES = [
  (n, p) => `${n} searches the same room twice and comes out with dust on ${p.posAdj} knees and nothing else.`,
  (n, p) => `${n} runs out of clock halfway through a cupboard and has to leave it open for whoever is next.`,
  (n, p) => `${n} finds a decoy, celebrates for four seconds, and reads it.`,
  (n, p) => `${n} spends ${p.posAdj} whole turn on a hunch. The hunch is not correct.`,
];

export const hideAndGoVeto = {
  id: 'bb-sig-hide-and-go-veto',
  name: 'Hide and Go Veto',
  category: 'mental',
  types: ['veto'],
  weight: () => 1.3,
  desc: 'Every player hides a veto card somewhere in the house, then searches in timed turns while the others wait outside. Every card that is found goes up on the board and its owner is eliminated, and the houseguest whose card is never found wins the Power of Veto.',
  stats: { intuition: 0.34, mental: 0.30, strategic: 0.24, physical: 0.12 },
  simulate(participants, context, api, rng) {
    const luck = {};   // banked by noiseRoll, merged into the breakdown downstream
    const say = makePicker(rng);
    const missed = makePicker(rng);
    const places = makePicker(rng);
    const beats = [];
    const breakdown = {};
    const hn = haveNotDrag(participants, context, rng);

    beats.push(beat(
      `Ten minutes each, alone in the house, one card to hide. The other ${participants.length - 1} wait in the backyard and try to work out from the sound of it which room ${participants.length > 2 ? 'everybody' : 'the other one'} is in.`,
      participants.slice(0, 3), 'HIDE PHASE', 'challenge'));

    // Phase one is scored against nothing. It only matters later, which is the
    // asymmetry: a bad searcher who hid brilliantly beats a good searcher who
    // did not, and the competition never tells anyone which they were.
    const cards = participants.map(name => {
      // Half the drag lands on the hide, half on the search below — a week of
      // slop dulls both halves of this competition, not one.
      const quality = (stat(name, 'intuition') * 0.45 + stat(name, 'strategic') * 0.35 + stat(name, 'mental') * 0.20) + noiseRoll(rng, 3.0, luck, name) - hn[name] * 0.5;
      return { owner: name, quality, found: false, where: places(HIDING_PLACES) };
    });
    cards.slice(0, Math.min(4, cards.length)).forEach(c => {
      beats.push(beat(say(HIDE_LINES)(c.owner, pronouns(c.owner), c.where), [c.owner], 'HIDDEN', 'grey'));
    });

    const mess = Object.fromEntries(participants.map(n => [n, 0]));
    const out = [];
    const tiebreaks = {};
    let turn = 0;

    while (cards.filter(c => !c.found).length > 1 && turn < participants.length * 2 + 4) {
      turn++;
      const searchers = cards.filter(c => !c.found).map(c => c.owner);
      let foundThisTurn = 0;

      for (const searcher of searchers) {
        const targets = cards.filter(c => !c.found && c.owner !== searcher);
        if (targets.length <= 0) break;
        if (cards.filter(c => !c.found).length <= 1) break;

        // Cards get easier to find as the clock and the wreckage grow.
        const power = (stat(searcher, 'mental') * 0.40 + stat(searcher, 'intuition') * 0.40 + stat(searcher, 'physical') * 0.20)
          + noiseRoll(rng, 2.6, luck, searcher) + turn * 0.9 - hn[searcher] * 0.5;
        mess[searcher] += 1 + rng();

        const target = targets.reduce((a, b) => (a.quality <= b.quality ? a : b));
        if (power > target.quality) {
          target.found = true;
          foundThisTurn++;
          beats.push(beat(say(FOUND_LINES)(searcher, target.owner, pronouns(target.owner)),
            [searcher, target.owner], 'CARD ON THE BOARD', 'red'));
          tiebreaks[target.owner] = clamp(turn + target.quality / 5, 0, 9.9);
          breakdown[target.owner] = {
            hideQuality: round2(target.quality), hidingPlace: target.where, foundBy: searcher,
            foundOnTurn: turn, threw: false, score: round2(target.quality),
            ...hnFields(hn[target.owner]),
          };
          out.push(target.owner);
        } else if (rng() < 0.5) {
          beats.push(beat(missed(MISS_LINES)(searcher, pronouns(searcher)), [searcher], 'NOTHING', 'grey'));
        }
      }

      // A turn where nobody finds anything and nobody can is a stalled comp.
      if (!foundThisTurn && turn >= participants.length + 2) {
        const weakest = cards.filter(c => !c.found).reduce((a, b) => (a.quality <= b.quality ? a : b));
        if (cards.filter(c => !c.found).length > 1) {
          weakest.found = true;
          beats.push(beat(
            `With the clock nearly gone, ${weakest.owner}'s card turns up ${weakest.where} — the one place four people had already searched.`,
            [weakest.owner], 'CARD ON THE BOARD', 'red'));
          tiebreaks[weakest.owner] = clamp(turn + weakest.quality / 5, 0, 9.9);
          breakdown[weakest.owner] = { hideQuality: round2(weakest.quality), hidingPlace: weakest.where, foundBy: null, foundOnTurn: turn, threw: false, score: round2(weakest.quality), ...hnFields(hn[weakest.owner]) };
          out.push(weakest.owner);
        }
      }
    }

    // The house is destroyed, and somebody is responsible for most of it.
    const messiest = participants.reduce((a, b) => (mess[a] >= mess[b] ? a : b));
    const victimPool = participants.filter(n => n !== messiest);
    const victim = victimPool.length ? victimPool[Math.floor(rng() * victimPool.length)] : null;
    if (victim) {
      beats.push(beat(
        `The house looks like a search warrant was executed on it. ${messiest} did most of that, including tipping ${victim}'s mattress off the frame and leaving it there, and ${victim} finds out at two in the morning.`,
        [messiest, victim], 'HOUSE WRECKED', 'red'));
      api.popDelta(messiest, -1);
      api.addBond(messiest, victim, -0.8);
      api.record(victim, 'bed-flipped', { by: messiest });
    }

    const survivors = cards.filter(c => !c.found);
    survivors.forEach((c, i) => {
      tiebreaks[c.owner] = clamp(9.9 - i * 0.3, 0, 9.9);
      breakdown[c.owner] = { hideQuality: round2(c.quality), hidingPlace: c.where, foundBy: null, foundOnTurn: null, threw: false, score: round2(c.quality), ...hnFields(hn[c.owner]) };
    });

    const placements = [...survivors.map(c => c.owner), ...out.reverse()];
    const winner = placements[0];
    const winning = cards.find(c => c.owner === winner);
    const wp = pronouns(winner);
    beats.push(beat(
      `Time. One card never made it to the board — ${winner} hid it ${winning ? winning.where : 'somewhere the house never thought to look'}, and ${wp.sub} ${vb(wp, 'walks', 'walk')} past the wreckage to collect the veto.`,
      [winner], 'VETO', 'gold'));
    api.popDelta(winner, 2);
    api.record(winner, 'hide-and-go-veto-win', { where: winning ? winning.where : null });

    const entries = rankEntries(placements, tiebreaks);
    return toResult(entries, {
      luck,
      beats, breakdown, variant: 'hide-and-go-veto',
      text: `${winner} is the last houseguest whose card is never found, and wins the Power of Veto.`,
    });
  },
};

// ══════════════════════════════════════════════════════════════════════
// 5. BB Comics
// ══════════════════════════════════════════════════════════════════════

const HERO_TITLES = [
  n => `Captain ${n}`, n => `The Incredible ${n}`, n => `${n}-Man`, n => `Doctor ${n}`,
  n => `The Amazing ${n}`, n => `${n} the Unstoppable`, n => `Ultra-${n}`, n => `The Mighty ${n}`,
  n => `${n}: Night Warden`, n => `Lady ${n}`, n => `${n}-Girl`, n => `Sergeant ${n}`,
];

const COMICS_CLEAN = [
  (n, p, t) => `${n} runs it clean. ${t} is the fourth cover on the wall and ${p.sub} never once looks down at the harness.`,
  (n, p, t) => `${n} calls the whole order out loud on the zip, ending on ${t}, and lands the last cover with the buzzer already going.`,
  (n, p, t) => `${n} has the wall memorised by the second pass — ${t} included, which is the one everybody else misreads.`,
  (n, p, t) => `${n} does not hesitate once. ${t} goes up in the right slot and so does everything either side of it.`,
];

const COMICS_MISTAKE = [
  (n, p, t) => `${n} puts ${t} one slot too early, hears the buzzer, and has to zip all the way back to the platform to start the run again.`,
  (n, p, t) => `${n} confuses ${t} with the cover next to it — same colour scheme, entirely different position — and eats the re-zip.`,
  (n, p, t) => `${n} is three covers from done when ${p.sub} ${vb(p, 'realises', 'realise')} ${t} is in the wrong place, and there is no fixing it from down here.`,
  (n, p, t) => `${n} loses the whole sequence at ${t} and stands there for a second doing the arithmetic on how much that just cost ${p.obj}.`,
];

const COMICS_MELT = [
  (n, p) => `${n} zips back for the fourth time and does not bother pretending any more.`,
  (n, p) => `${n} has now spent longer on the wire than on the wall, which is not the intended ratio.`,
  (n, p) => `The clock passes four minutes on ${n} and ${p.sub} ${vb(p, 'is', 'are')} still rearranging the middle of the wall.`,
  (n, p) => `${n} finishes eventually. The time is read out. ${p.Sub} ${vb(p, 'laughs', 'laugh')} at it, once, without any humour in it.`,
];

export const bbComics = {
  id: 'bb-sig-bb-comics',
  name: 'BB Comics',
  category: 'mental',
  // The wiki has this as a recurring Power of Veto AND Head of Household
  // competition — it has run as both, so it is eligible for both slots.
  types: ['veto', 'hoh'],
  weight: () => 1.3,
  desc: 'One at a time and against the clock, each houseguest zips across the yard to a wall of comic book covers — one for every player in the house — and rebuilds the order they were shown. Every misplaced cover means zipping back to the platform and running it again, and the fastest completed time wins.',
  stats: { mental: 0.40, endurance: 0.26, physical: 0.20, intuition: 0.14 },
  simulate(participants, context, api, rng) {
    const luck = {};   // banked by noiseRoll, merged into the breakdown downstream
    const clean = makePicker(rng);
    const flub = makePicker(rng);
    const melt = makePicker(rng);
    const bail = makePicker(rng);
    const beats = [];
    const breakdown = {};
    const hn = haveNotDrag(participants, context, rng);

    const titleFor = {};
    const pool = [...HERO_TITLES];
    participants.forEach(name => {
      const idx = Math.floor(rng() * pool.length);
      const maker = pool.length ? pool.splice(idx, 1)[0] : HERO_TITLES[0];
      titleFor[name] = maker(name);
    });

    beats.push(beat(
      `The wall goes up with ${participants.length} covers on it — ${participants.slice(0, 3).map(n => titleFor[n]).join(', ')} and the rest of the roster, all drawn by somebody who was clearly given the photos an hour ago. The house gets thirty seconds to memorise the order.`,
      participants.slice(0, 3), 'THE WALL OF COVERS', 'challenge'));

    const runs = participants.map(name => {
      const p = pronouns(name);
      const covers = Math.max(4, Math.min(9, participants.length));
      const speed = (stat(name, 'physical') * 0.6 + stat(name, 'endurance') * 0.4);
      // Slop drag lands where this comp lives: seconds on the wire, and a
      // duller recall on every cover check below.
      let time = 62 - speed * 2.2 + hn[name] * 2.5 + noiseRoll(rng, 5, luck, name);
      let mistakes = 0;
      // BB Comics runs as a Head of Household competition as often as it runs
      // as a veto, and an HOH nobody wants has to be losable on purpose. A
      // thrown run is the easiest throw in the house to hide: put one cover in
      // the wrong slot, take the re-zip, and look furious about it.
      const t = throwRead(name, context, rng);
      if (t.threw) { time += 26 + rng() * 14; mistakes += 1; }
      // The cover that broke the run is the FIRST one missed, and never the
      // player's own — "H realises The Incredible H is in the wrong place" is
      // not a sentence about a competition.
      const otherCovers = participants.filter(other => other !== name);
      let worstCover = null;

      // Each cover is its own check. A strong memory does not immunise anybody
      // from the one lapse that costs a whole re-zip, which is why the best
      // player on paper regularly posts the fourth-best time.
      for (let i = 0; i < covers; i++) {
        // Wide per-cover noise and a bar high enough that a clean run is a
        // genuine achievement rather than the default for anybody with mental
        // over seven. At a 3.1 bar the same houseguest ran clean in 24 of 40
        // seeded runs, which is a sort with a zipline attached to it.
        const recall = (stat(name, 'mental') * 0.55 + stat(name, 'intuition') * 0.30 + stat(name, 'temperament') * 0.15)
          + noiseRoll(rng, 3.4, luck, name) - i * 0.30 - mistakes * 0.6 - hn[name] * 0.3;
        if (recall < 3.9) {
          mistakes++;
          time += 21 + rng() * 9;
          if (worstCover === null && otherCovers.length) worstCover = titleFor[otherCovers[i % otherCovers.length]];
        }
      }
      return { name, p, time: round2(time), mistakes, worstCover, covers, threw: t.threw, threwChance: t.chance };
    }).sort((a, b) => a.time - b.time);

    // Every houseguest is seen running. Nobody teleports to a leaderboard.
    [...runs].sort((a, b) => participants.indexOf(a.name) - participants.indexOf(b.name)).forEach(r => {
      const cover = r.worstCover || titleFor[r.name];
      if (r.threw) {
        beats.push(beat(`${bail(THROW_LINES)(r.name)} ${r.time} seconds, ${r.mistakes} re-zip${r.mistakes === 1 ? '' : 's'}, and a cover in the wrong slot that ${r.name} looked at twice.`,
          [r.name], 'THREW IT', 'grey'));
      } else if (r.mistakes === 0) {
        beats.push(beat(`${clean(COMICS_CLEAN)(r.name, r.p, titleFor[r.name])} ${r.time} seconds.`,
          [r.name], 'CLEAN RUN', 'green'));
      } else if (r.mistakes >= 3) {
        beats.push(beat(`${flub(COMICS_MISTAKE)(r.name, r.p, cover)} ${melt(COMICS_MELT)(r.name, r.p)} ${r.time} seconds, ${r.mistakes} re-zips.`,
          [r.name], 'FALLS APART', 'red'));
      } else {
        beats.push(beat(`${flub(COMICS_MISTAKE)(r.name, r.p, cover)} ${r.time} seconds off ${r.mistakes} re-zip${r.mistakes > 1 ? 's' : ''}.`,
          [r.name], 'RE-ZIP', 'challenge'));
      }
      breakdown[r.name] = {
        hero: titleFor[r.name], covers: r.covers, mistakes: r.mistakes,
        time: r.time, score: round2(200 - r.time), threw: r.threw, threwChance: r.threwChance,
        ...hnFields(hn[r.name]),
      };
    });

    const winner = runs[0];
    const second = runs[1];
    // This one serves both slots, so it must not narrate itself as a veto on an
    // HOH night — the sibling signature comps already read context.type for
    // exactly this and BB Comics was the one that hardcoded the prize.
    const isVeto = context.type === 'veto';
    const prize = isVeto ? 'the veto' : 'the room';
    if (second) {
      beats.push(beat(
        `${winner.name} posts ${winner.time} and ${second.name} posts ${second.time}, and the gap between ${prize} and nothing is ${round2(second.time - winner.time)} seconds.`,
        [winner.name, second.name], 'THE MARGIN', 'gold'));
    }
    beats.push(beat(
      `${titleFor[winner.name]} takes it. ${winner.name} gets handed the cover with ${winner.p.posAdj} own face on it as well as ${prize}, and keeps both.`,
      [winner.name], isVeto ? 'VETO' : 'HOH', 'gold'));
    api.popDelta(winner.name, 2);
    api.record(winner.name, 'bb-comics-win', { time: winner.time, mistakes: winner.mistakes });

    const placements = runs.map(r => r.name);
    const tiebreaks = Object.fromEntries(runs.map(r => [r.name, clamp(9.9 - r.mistakes, 0, 9.9)]));
    const threwMap = Object.fromEntries(runs.map(r => [r.name, !!r.threw]));
    const entries = rankEntries(placements, tiebreaks, threwMap);
    return toResult(entries, {
      luck,
      beats, breakdown, variant: 'bb-comics',
      text: `${winner.name} runs BB Comics in ${winner.time} seconds and wins ${isVeto ? 'the Power of Veto' : 'Head of Household'}.`,
    });
  },
};

// ══════════════════════════════════════════════════════════════════════
// 6. Before or After
// ══════════════════════════════════════════════════════════════════════

const BOA_FALLBACK = [
  'Did the first alliance in this house form BEFORE or AFTER the first person cried in the diary room?',
  'Did the have-nots get named BEFORE or AFTER the first nomination ceremony?',
  'Did the first showmance get noticed BEFORE or AFTER the house voted somebody out unanimously?',
  'Did the storage room argument happen BEFORE or AFTER the veto was used for the first time?',
  'Did the first person promise safety to somebody BEFORE or AFTER they broke a different promise?',
];

const BOA_WRONG = [
  (n, p) => `${n} locks in BEFORE with real confidence. It was after. ${p.Sub} ${vb(p, 'does', 'do')} not look at the board again.`,
  (n, p) => `${n} changes ${p.posAdj} answer with two seconds left, from the right one.`,
  (n, p) => `${n} is still counting weeks on ${p.posAdj} fingers when the lock-in horn goes, and the finger ${p.sub} ${vb(p, 'lands', 'land')} on is wrong.`,
  (n, p) => `${n} gets it wrong and immediately explains, at length, the reasoning that got ${p.obj} there. The reasoning is also wrong.`,
];

const BOA_RIGHT = [
  (n, p) => `${n} answers before the question finishes and is right, which two people find genuinely alarming.`,
  (n, p) => `${n} gets it, holds up the board, and does not celebrate — ${p.sub} ${vb(p, 'is', 'are')} counting who else got it.`,
  (n, p) => `${n} takes the whole clock and lands on the right side of it.`,
  (n, p) => `${n} is right again. Somebody down the line says the word "photographic" and does not mean it kindly.`,
];

export const beforeOrAfter = {
  id: 'bb-sig-before-or-after',
  name: 'Before or After',
  category: 'mental',
  // Head of Household since Big Brother 5's final four, and a Power of Veto
  // competition since Big Brother 11 — it has always served both slots.
  types: ['hoh', 'veto', 'tiebreaker', 'return'],
  weight: () => 1.3,
  desc: 'Houseguests are asked whether one thing that happened in this house came before or after another. In a full field a wrong answer is a strike and two strikes eliminate; once the field is small a single wrong answer eliminates outright. The last houseguest still in wins.',
  stats: { mental: 0.44, intuition: 0.26, strategic: 0.18, temperament: 0.12 },
  simulate(participants, context, api, rng) {
    const luck = {};   // banked by noiseRoll, merged into the breakdown downstream
    const wrongSay = makePicker(rng);
    const rightSay = makePicker(rng);
    const askedBefore = makePicker(rng);
    const beats = [];
    const breakdown = {};
    const facts = seasonFacts();
    const hn = haveNotDrag(participants, context, rng);

    const strikesAllowed = participants.length > 6 ? 2 : 1;
    let field = participants.map(name => {
      const t = throwRead(name, context, rng);
      return { name, apt: aptitude(name, this.stats), strikes: 0, correct: 0, threw: t.threw, threwChance: t.chance };
    });

    beats.push(beat(
      `${participants.length} houseguests, one board each, and a question format that only works if you were paying attention to a house you were also trying to survive. ${strikesAllowed === 2 ? 'Two strikes and you are out.' : 'One wrong answer and you are out.'}`,
      participants.slice(0, 3), 'BEFORE OR AFTER', 'challenge'));

    const question = () => {
      if (facts.length >= 2) {
        const a = choose(rng, facts);
        const others = facts.filter(f => f.event !== a.event);
        const b = others.length ? choose(rng, others) : facts[0];
        return `Did ${a.event} come BEFORE or AFTER ${b.event}?`;
      }
      return askedBefore(BOA_FALLBACK);
    };

    const out = [];
    const tiebreaks = {};
    const threwMap = {};
    let q = 0;

    while (field.length > 1 && q < participants.length * 3 + 6) {
      q++;
      const difficulty = 3.0 + q * 0.28;
      const asked = question();
      const eliminated = [];

      field.forEach(f => {
        // A thrower gets one wrong on purpose, early, and lets the strikes do
        // the rest — the same shape as bailing off a wall, in a quiz.
        const deliberate = f.threw && q <= 2;
        const answer = f.apt - hn[f.name] + noiseRoll(rng, 3.2, luck, f.name) - (deliberate ? 9 : 0);
        if (answer < difficulty) {
          f.strikes++;
          f.lastWrong = q;
          if (f.strikes >= strikesAllowed) eliminated.push(f);
        } else {
          f.correct++;
        }
      });

      // Nobody can go out on every question in a big field, and the comp cannot
      // stall either: if a round eliminates nobody at all, the worst record goes.
      let goingOut = eliminated;
      if (!goingOut.length && q >= participants.length + 3 && field.length > 1) {
        goingOut = [[...field].sort((a, b) => (a.correct - a.strikes) - (b.correct - b.strikes))[0]];
      }
      if (goingOut.length >= field.length) goingOut = goingOut.slice(0, field.length - 1);

      if (goingOut.length) {
        goingOut.forEach(f => {
          const p = pronouns(f.name);
          beats.push(beat(
            `Question ${q}: ${asked} ${f.threw ? wrongSay(THROW_LINES)(f.name) : wrongSay(BOA_WRONG)(f.name, p)}`,
            [f.name], f.threw ? 'THREW IT' : field.length === 2 ? 'RUNNER-UP' : 'ELIMINATED',
            f.threw ? 'grey' : field.length === 2 ? 'red' : 'challenge'));
          tiebreaks[f.name] = clamp(f.correct + q * 0.2, 0, 9.9);
          threwMap[f.name] = f.threw;
          breakdown[f.name] = {
            questionsCorrect: f.correct, strikes: f.strikes, eliminatedOn: q,
            aptitude: round2(f.apt), threwChance: f.threwChance, threw: f.threw, score: f.correct,
            ...hnFields(hn[f.name]),
          };
          out.push(f.name);
        });
        field = field.filter(f => !goingOut.includes(f));
      } else if (q % 2 === 1 && field.length) {
        const star = field[Math.floor(rng() * field.length)];
        beats.push(beat(`Question ${q}: ${asked} ${rightSay(BOA_RIGHT)(star.name, pronouns(star.name))}`,
          [star.name], 'CORRECT', 'green'));
      }
    }

    const champ = field[0] || { name: out.pop(), correct: 0, strikes: 0, apt: 0, threwChance: 0 };
    tiebreaks[champ.name] = 9.9;
    threwMap[champ.name] = false;
    breakdown[champ.name] = {
      questionsCorrect: champ.correct || 0, strikes: champ.strikes || 0, eliminatedOn: null,
      aptitude: round2(champ.apt || 0), threwChance: champ.threwChance || 0, threw: false, score: champ.correct || 0,
      ...hnFields(hn[champ.name] || 0),
    };

    const cp = pronouns(champ.name);
    beats.push(beat(
      `${champ.name} is the last board still up, ${champ.correct || 0} correct across ${q} questions, and ${cp.sub} ${vb(cp, 'spends', 'spend')} the walk to the key thinking about which two names ${cp.sub} just became responsible for.`,
      [champ.name], context.type === 'veto' ? 'VETO' : 'HOH', 'gold'));
    api.popDelta(champ.name, 2);
    api.record(champ.name, 'quiz-win', { correct: champ.correct || 0, questions: q, competition: 'before-or-after' });

    const placements = [champ.name, ...out.reverse()];
    const entries = rankEntries(placements, tiebreaks, threwMap);
    return toResult(entries, {
      luck,
      beats, breakdown, variant: 'before-or-after',
      text: `${champ.name} is the last houseguest standing in Before or After.`,
    });
  },
};

export const SIGNATURE_COMPS = [otev, theWall, pressureCooker, hideAndGoVeto, bbComics, beforeOrAfter];
export default SIGNATURE_COMPS;
