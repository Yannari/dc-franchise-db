// ══════════════════════════════════════════════════════════════════════
// bb-comps/duress.js — Punch, Slap, Kick and The Black Box
// ══════════════════════════════════════════════════════════════════════
//
// Two veto-side memory competitions, and the reason they are here is that the
// library had exactly two comps in the `memory` category against ten in mental
// and nine in physical. A season plays about thirty competitions; two of them
// being the only way a good memory ever mattered is a stat that may as well not
// exist.
//
// Both are memory tested through a body rather than at a desk, which is what
// makes them different from the recall quizzes:
//
// PUNCH, SLAP, KICK (wiki: "memorize a series of beatings in order to answer
// questions") — you stand inside a machine that hits you with foam arms and
// have to remember the ORDER while it is happening to you. Composure is not
// flavour here; it is the competition.
//
// THE BLACK BOX (wiki rules, confirmed) — houseguests enter a completely dark
// box, locate specific items in the darkness and return them to designated
// spots; most items in the fastest time wins. Sight is removed, so what is left
// is a mental map and a steady hand.
import { pronouns } from '../players.js';
import { pStats } from '../players.js';
import { aptitude, beat, clamp, makePicker, nightForm, toResult, vb } from './_shared.js';

const round2 = v => Math.round(v * 100) / 100;
const stat = (name, key) => Number(pStats(name)?.[key]) || 0;

// ══════════════════════════════════════════════════════════════════════
// Punch, Slap, Kick
// ══════════════════════════════════════════════════════════════════════

const HITS = ['a punch to the ribs', 'a slap across the shoulder', 'a kick to the backside',
  'a punch to the stomach', 'a slap to the back of the head', 'a kick to the thigh'];

const PSK_HOLD = [
  (n, p) => `${n} counts them out loud through gritted teeth, which is against no rule and looks insane.`,
  (n, p) => `${n} takes the whole sequence without flinching and recites it back flat.`,
  (n, p) => `${n} shuts ${p.posAdj} eyes on the third one and gets every single one anyway.`,
  (n, p) => `${n} is laughing by the end of it, which is either composure or the beginning of a problem.`,
];

const PSK_LOSE = [
  (n, p) => `${n} loses the thread somewhere around the fourth hit and never gets it back.`,
  (n, p) => `${n} gets the order right and the COUNT wrong, which scores exactly the same as knowing nothing.`,
  (n, p) => `${n} swears at the machine. The machine does not care and neither does the scoreboard.`,
  (n, p) => `${n} answers confidently and completely wrongly, having merged two rounds into one.`,
];

export const punchSlapKick = {
  id: 'bb-duress-punch-slap-kick',
  name: 'Punch, Slap, Kick',
  category: 'memory',
  types: ['veto', 'tiebreaker'],
  variant: 'punch-slap-kick',
  weight: () => 1,
  desc: 'One at a time the houseguests are strapped into a padded contraption surrounded by mechanical arms, and the machine delivers a sequence of foam punches, slaps and kicks while they stand there and take it. The moment the sequence ends they are asked to recite it back in the exact order it was delivered, and each round the machine adds another hit to the sequence, so the thing being remembered gets longer while the person remembering it gets more rattled. A single wrong answer ends that houseguest\'s run on the spot and their score is the last sequence they got through cleanly. The houseguest who recites the longest sequence correctly wins the Power of Veto.',
  // Temperament is the SPREAD here, not the level.
  //
  // Standing in a machine being hit is a test of whether you will keep
  // counting, and that is willingness rather than calm — a hothead can be
  // ferociously stubborn about it. Boldness and endurance carry the staying
  // power, mental carries the recall, and temperament decides only how
  // CONSISTENT a run is: a volatile houseguest either goes out on the first
  // sequence or goes a very long way.
  stats: { mental: 0.38, endurance: 0.24, boldness: 0.22, intuition: 0.16 },
  spreadStat: 'temperament',
  simulate(participants, context, api, rng) {
    const luck = {};
    const say = makePicker(rng);
    const hitPick = makePicker(rng);
    const beats = [];
    const breakdown = {};

    const survived = {};
    for (const name of participants) {
      const p = pronouns(name);
      // Recall under a beating. Temperament is not a flavour term here — a
      // houseguest who rattles loses the sequence they already had.
      // The declared profile, read straight off the competition — through
      // aptitude() rather than hand-summed, so this sits on the same compressed
      // scale as the rest of the library, plus the night. Nine rounds of
      // re-rolled nerve average out to nothing across a field: the sequence
      // everybody reaches was falling out in strict order of the stat line and
      // the best in the yard was taking this 45% of the time.
      const apt = aptitude(name, punchSlapKick.stats) + nightForm(rng, 1.6);
      const recall = stat(name, 'mental') * 0.55 + stat(name, 'intuition') * 0.15;
      const composure = stat(name, 'endurance') * 0.55 + stat(name, 'boldness') * 0.45;
      let round = 0;
      let out = false;
      while (!out && round < 9) {
        round++;
        // Each round is longer, so the same person fails eventually — the
        // question is only ever how far they get.
        const difficulty = 2.2 + round * 0.62;
        // Nerve widens the swing instead of raising the score — the library's
        // documented rule, and the reason a hothead is unpredictable here
        // rather than simply worse.
        const width = 3.4 * (0.55 + (10 - stat(name, 'temperament')) * 0.09);
        const roll = (rng() - 0.5) * width + (width - 3.4) * 0.25;
        luck[name] = round2((luck[name] || 0) + roll);
        // No halving. `recall` and `composure` are already weighted averages on
        // the 0-10 stat scale, and dividing their blend by two put the whole
        // field under the first round's threshold — measured, every houseguest
        // went out on sequence one or two and the veto was decided by a coin
        // flip between people who had all failed.
        const held = apt + roll > difficulty;
        if (!held) out = true;
      }
      survived[name] = round - 1;
      breakdown[name] = {
        sequence: survived[name], recall: round2(recall), composure: round2(composure),
        score: round2(survived[name]), threw: false,
      };
      beats.push(beat(
        `${name} takes ${hitPick(HITS)}, then another, then another. `
        + (survived[name] >= 4 ? say(PSK_HOLD)(name, p) : say(PSK_LOSE)(name, p))
        + ` ${survived[name] === 0 ? `${p.Sub} ${vb(p, 'goes', 'go')} out on the first sequence.` : `Longest clean sequence: ${survived[name]}.`}`,
        [name],
        // The badge is the number, not a verdict. Everybody goes out of this
        // competition eventually — that is the format — so badging every run
        // "OUT" described the one thing all five runs had in common and none
        // of the thing that separated them.
        survived[name] === 0 ? 'OUT ON THE FIRST' : `${survived[name]} IN A ROW`,
        survived[name] >= 4 ? 'challenge' : survived[name] === 0 ? 'red' : 'grey'));
    }

    const placements = [...participants].sort((a, b) => survived[b] - survived[a]);
    const entries = placements.map((name, idx) => ({
      name, score: round2((placements.length - idx) * 10 + clamp(survived[name], 0, 9.9)),
      threw: false, base: round2(survived[name]),
    }));
    const winner = entries[0]?.name;
    if (winner) {
      beats.push(beat(
        `${winner} got through ${survived[winner]} and takes the veto out of a machine designed to make that impossible.`,
        [winner], 'VETO', 'gold'));
      api.popDelta(winner, 2);
      api.record(winner, 'punch-slap-kick-win', { sequence: survived[winner] });
    }

    return toResult(entries, {
      luck, beats, breakdown, variant: 'punch-slap-kick',
      detail: { runs: participants.map(n => ({ name: n, sequence: survived[n] })) },
      text: winner ? `${winner} recites a ${survived[winner]}-hit sequence and wins the Power of Veto.` : '',
    });
  },
};

// ══════════════════════════════════════════════════════════════════════
// The Black Box
// ══════════════════════════════════════════════════════════════════════

const BOX_ITEMS = ['a rubber duck', 'a house key on a ribbon', 'a tin cup', 'a folded flag',
  'a plastic pineapple', 'a picture frame', 'a boot', 'a wind-up alarm clock'];

const BOX_GOOD = [
  (n, p, item) => `${n} finds ${item} almost immediately and gets it to the right marker without a wrong turn.`,
  (n, p, item) => `${n} works the wall with one hand and the floor with the other, and comes up with ${item}.`,
  (n, p, item) => `${n} has clearly mapped the room in ${p.posAdj} head — ${item}, straight to the marker, no groping about.`,
];

const BOX_BAD = [
  (n, p, item) => `${n} finds ${item}, puts it on the wrong marker, and loses a good twenty seconds working out why the buzzer went.`,
  (n, p, item) => `${n} walks into something solid and spends a while establishing that it was a table.`,
  (n, p, item) => `${n} has ${item} in ${p.posAdj} hand for a full ten seconds without knowing what it is.`,
  (n, p, item) => `${n} goes round the same corner three times. In the dark it is a different corner every time.`,
];

export const blackBox = {
  id: 'bb-duress-black-box',
  name: 'The Black Box',
  category: 'memory',
  types: ['hoh', 'veto', 'tiebreaker'],
  variant: 'black-box',
  weight: () => 1,
  desc: 'One at a time the houseguests are shut inside a sealed box in total darkness, given a list of objects to find and a set of marked spots to return them to, and then the lights go out for real. They have to feel their way around a room they cannot see, identify each object by touch alone and get it onto the correct marker, with a buzzer telling them only that something is wrong and never what. Anything left on the wrong marker scores nothing at all. Whoever places the most objects correctly wins, and if two houseguests place the same number the faster time takes it.',
  // Feeling for something you cannot see is instinct and a mental map, with
  // hands to do it. Temperament moved to the spread — a jumpy houseguest in a
  // pitch-dark box is erratic rather than worse — and physical was declared at
  // 0.14 and never read at all.
  stats: { intuition: 0.40, mental: 0.30, physical: 0.20, boldness: 0.10 },
  spreadStat: 'temperament',
  simulate(participants, context, api, rng) {
    const luck = {};
    const say = makePicker(rng);
    const items = makePicker(rng);
    const beats = [];
    const breakdown = {};

    const found = {};
    const times = {};
    for (const name of participants) {
      const p = pronouns(name);
      // Same two corrections as Punch, Slap, Kick above: read the declared
      // profile through aptitude() instead of a hand-summed copy, and roll the
      // night once. Five attempts of independent nerve cancel out, which is why
      // widening them (see the note below) never moved this — what decides the
      // box is whether a houseguest can map it at all tonight.
      const feel = aptitude(name, blackBox.stats) + nightForm(rng, 1.5);
      let placed = 0;
      let seconds = 0;
      const attempts = 5;
      for (let i = 0; i < attempts; i++) {
        // Wide on purpose. Moving temperament out of the level made the read a
        // cleaner stat sort, and the upset guard measured one houseguest taking
        // 73% of the wins — a dark room where the best player always finds the
        // most objects is not a dark room.
        const width = 5.4 * (0.55 + (10 - stat(name, 'temperament')) * 0.09);
        const roll = (rng() - 0.5) * width + (width - 5.4) * 0.25;
        luck[name] = round2((luck[name] || 0) + roll);
        // 6.4, not 4.6. At the lower threshold essentially everybody placed all
        // five — a twelve-person field where every single run read "5 of 5" —
        // which killed the object count as a dimension and quietly turned the
        // wiki's "most objects, then fastest time" into a stopwatch. Finding a
        // thing you cannot see has to be able to go wrong.
        const ok = feel + roll > 6.0;
        if (ok) { placed++; seconds += 22 + rng() * 16; }
        else seconds += 38 + rng() * 26;
      }
      found[name] = placed;
      times[name] = Math.round(seconds);
      breakdown[name] = { placed, seconds: times[name], feel: round2(feel), score: round2(placed), threw: false };
      const item = items(BOX_ITEMS);
      beats.push(beat(
        `The door shuts on ${name} and the box goes properly black. `
        + (placed >= 3 ? say(BOX_GOOD)(name, p, item) : say(BOX_BAD)(name, p, item))
        + ` ${placed} of ${attempts} on the right markers, in ${Math.floor(times[name] / 60)}:${String(times[name] % 60).padStart(2, '0')}.`,
        [name], placed >= 3 ? `${placed} PLACED` : `ONLY ${placed}`, placed >= 3 ? 'challenge' : 'grey'));
    }

    // Most placed, then the faster time — the wiki's tiebreak, not a stat sort.
    const placements = [...participants].sort((a, b) => (found[b] - found[a]) || (times[a] - times[b]));
    const entries = placements.map((name, idx) => ({
      name, score: round2((placements.length - idx) * 10 + clamp(found[name] + (1 - times[name] / 400), 0, 9.9)),
      threw: false, base: round2(found[name]),
    }));
    const winner = entries[0]?.name;
    if (winner) {
      beats.push(beat(
        `${winner} comes out blinking with ${found[winner]} on the markers and the fastest clock of anybody who managed that many.`,
        [winner], 'WINS IT', 'gold'));
      api.popDelta(winner, 1);
      api.record(winner, 'black-box-win', { placed: found[winner], seconds: times[winner] });
    }

    return toResult(entries, {
      luck, beats, breakdown, variant: 'black-box',
      detail: { runs: participants.map(n => ({ name: n, placed: found[n], seconds: times[n] })) },
      text: winner ? `${winner} places ${found[winner]} objects in the dark and wins.` : '',
    });
  },
};

export const DURESS_COMPS = [punchSlapKick, blackBox];
export default DURESS_COMPS;
