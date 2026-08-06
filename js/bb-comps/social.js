// ══════════════════════════════════════════════════════════════════════
// bb-comps/social.js — the Zingbot, and To Drink or to Bluff
// ══════════════════════════════════════════════════════════════════════
//
// The library had no competition scored primarily on `social`, in a simulator
// where social decides nominations, votes, alliances, deals and the jury. Every
// competition was a test of the body or the memory, so the best social player
// in the house had exactly one arena — the one everywhere else — and none in
// the yard.
//
// These two are the fix, and they are different kinds of social.
//
// THE ZINGBOT is the only competition in the library that CHANGES THE HOUSE.
// The zings are built from what each houseguest has actually done this season,
// they are delivered on camera in front of everybody, and they land differently
// depending on who is taking one — a volatile houseguest wears it much worse
// than a calm one. Then the competition is about the roast itself: who was that
// zing about? So the material is the joke and the joke has consequences.
//
// TO DRINK OR TO BLUFF (wiki: a recurring HOH and Power of Veto competition,
// "houseguests guess who drank the 'poisoned' drink", BB5, BB27, BB28, BBCAN11,
// Celebrity Big Brother Quebec 4 — its Rules section on the wiki is EMPTY, so
// the round structure below is ours) is scored on the SOCIAL GRAPH. You read
// people you are close to more accurately, and you accuse people you already
// distrust whether or not they did it. The house's own paranoia decides it,
// which is not true of any other competition here.
import { gs } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getBond, getPerceivedBond } from '../bonds.js';
import { beat, choose, clamp, makePicker, toResult, vb } from './_shared.js';
import { optionsFor } from './_recall.js';

const round2 = v => Math.round(v * 100) / 100;
const stat = (name, key) => Number(pStats(name)?.[key]) || 0;
const weeksOf = () => (Array.isArray(gs?.bb?.weeks) ? gs.bb.weeks : []);

// ══════════════════════════════════════════════════════════════════════
// The Zingbot
// ══════════════════════════════════════════════════════════════════════

const ZING_ARRIVAL = [
  'The back door opens and the Zingbot rolls out with one wheel squeaking, which somehow makes it worse.',
  'The Zingbot is wheeled into the yard under a sheet, and the sheet comes off about four seconds too late for anybody to prepare.',
  'A noise like a fax machine dying announces the Zingbot, who has come a very long way to be rude.',
  'The Zingbot arrives already talking, having apparently started the set in the storage room.',
];

/**
 * Every zing is built from something the season actually recorded.
 *
 * A generic insult is a line of flavour text. A zing about the three
 * competitions somebody has lost, or the deal they broke in week five, is the
 * house being read back to itself — and it is the reason this lands hard enough
 * to be worth a bond and a popularity hit.
 */
function zingFor(name, rng) {
  const st = gs.bb?.stats?.[name] || {};
  const wins = (st.hohWins || 0) + (st.vetoWins || 0);
  const blocked = st.timesOnTheBlock || st.timesNominated || 0;
  const p = pronouns(name);
  const showmance = (gs.showmances || []).find(sh => !sh.broken && (sh.players || []).includes(name));
  const partner = showmance ? (showmance.players || []).find(n => n !== name) : null;
  const evictedWeek = weeksOf().find(w => w?.hoh === name)?.num || null;

  const options = [];
  if (wins === 0) {
    options.push(`"${name}! I ran the numbers on your competition record and my calculator asked to be excused. Zero wins. ZERO. Even the house plant is disappointed, and it can't move. ZING!"`);
  }
  if (wins >= 2) {
    options.push(`"${name}, ${wins} wins! Congratulations! You've made yourself the biggest threat in this house, which is a bit like winning a race by tying an anvil to your own leg. ZING!"`);
  }
  if (blocked >= 2) {
    options.push(`"${name} has been on that block ${blocked} times. At this point the block isn't a punishment, it's ${p.posAdj} address. I've had ${p.posAdj} mail forwarded. ZING!"`);
  }
  if (partner) {
    options.push(`"${name} and ${partner}! A showmance! Nothing says 'I'm here to win half a million dollars' like handing someone else a vote and calling it love. ZING!"`);
  }
  if (evictedWeek) {
    options.push(`"${name} was Head of Household in week ${evictedWeek} and spent the entire reign telling everybody it was 'a really hard decision'. It was two people. Out of a house. ZING!"`);
  }
  options.push(`"${name}! I've been watching the feeds and I have to ask — is the strategy 'lie very still and hope'? Because it's working, and that's the saddest part. ZING!"`);
  options.push(`"${name}, you talk about your game a LOT for somebody whose game is mostly walking into rooms other people are already talking in. ZING!"`);
  return choose(rng, options);
}

const ZING_REACTION_GOOD = [
  (n, p) => `${n} laughs harder than anybody, which is the correct play and also completely genuine.`,
  (n, p) => `${n} takes it on the chin, applauds the robot, and gets a bigger cheer than the joke did.`,
  (n, p) => `${n} shouts "that's FAIR" over the laughing and means it.`,
];

const ZING_REACTION_BAD = [
  (n, p) => `${n} laughs about a half-second late and stops about a half-second early, and everybody in the yard clocks both.`,
  (n, p) => `${n} does not laugh. ${p.Sub} ${vb(p, 'looks', 'look')} at the robot the way you look at somebody who has read your diary.`,
  (n, p) => `${n} says "okay" quietly, twice, and the second one is not to anybody.`,
];

export const zingbot = {
  id: 'bb-social-zingbot',
  name: 'Zingbot Competition',
  category: 'quiz',
  types: ['hoh', 'veto', 'tiebreaker'],
  variant: 'zingbot',
  weight: () => 1.1,
  desc: 'The Zingbot is wheeled into the yard and delivers one personalised insult — a zing — about every houseguest in turn, each one built from what that person has actually done this season, and the whole house has to stand there and take it. Once the roast is over the competition begins: the zings are read back with the names removed and the houseguests must identify which houseguest each one was aimed at, writing an answer for every zing in the set. A wrong name scores nothing and nobody is eliminated for it, so the only cost of a bad round is the round. Whoever correctly matches the most zings to their targets wins the power.',
  stats: { mental: 0.34, social: 0.28, intuition: 0.24, temperament: 0.14 },
  simulate(participants, context, api, rng) {
    const luck = {};
    const say = makePicker(rng);
    const arrival = makePicker(rng);
    const beats = [];
    const breakdown = {};
    const score = Object.fromEntries(participants.map(n => [n, 0]));
    participants.forEach(n => { luck[n] = 0; });

    // Everybody in the house gets zinged, not only the people competing — the
    // roast is the house's night, and the competition is the second half of it.
    const house = [...new Set([...(context?.house || participants), ...participants])];
    beats.push(beat(arrival(ZING_ARRIVAL), house.slice(0, 4), 'THE ZINGBOT', 'gold'));

    const zings = [];
    for (const target of house) {
      const text = zingFor(target, rng);
      const p = pronouns(target);
      // How hard it lands. A volatile houseguest wears a public roast much
      // worse than a calm one, and the audience likes somebody who can take it.
      const composure = stat(target, 'temperament') * 0.6 + stat(target, 'social') * 0.4;
      const tookItWell = composure + (rng() - 0.5) * 4 > 5;
      zings.push({ target, text, tookItWell });
      beats.push(beat(
        `${text} ${(tookItWell ? say(ZING_REACTION_GOOD) : say(ZING_REACTION_BAD))(target, p)}`,
        [target], tookItWell ? 'TOOK IT WELL' : 'THAT ONE LANDED', tookItWell ? 'green' : 'red'));
      // Consequences, because a joke everybody heard is not a cosmetic event.
      api.popDelta(target, tookItWell ? 2 : -1);
      if (!tookItWell) {
        // Being humiliated in front of the room costs something with the people
        // who watched it happen — a small, real dent, spread thin.
        for (const witness of house) {
          if (witness !== target) api.addBond(target, witness, -0.15);
        }
        api.record(target, 'zinged-badly', { week: context?.week?.num || 0 });
      }
    }

    // ── the competition: whose zing was that? ──
    const asked = [];
    const rounds = Math.min(5, zings.length);
    const used = new Set();
    for (let r = 0; r < rounds; r++) {
      const fresh = zings.filter(z => !used.has(z.target));
      if (!fresh.length) break;
      const zing = fresh[Math.floor(rng() * fresh.length)];
      used.add(zing.target);
      const { options, truthIndex } = optionsFor(zing.target, house, rng);
      if (options.length < 2) continue;

      const answers = {};
      participants.forEach(name => {
        // Reading the room is the skill: who knows this house well enough to
        // know which of them the robot was describing.
        const read = clamp((stat(name, 'social') * 0.4 + stat(name, 'mental') * 0.35
          + stat(name, 'intuition') * 0.25) / 10, 0, 1);
        // You always know your own.
        const mine = name === zing.target;
        const chance = mine ? 0.97 : clamp(1 / options.length + read * 0.55, 0, 0.9);
        const roll = rng();
        luck[name] = round2((luck[name] || 0) + (chance - roll));
        const right = roll < chance;
        answers[name] = { right, given: right ? truthIndex : (truthIndex + 1) % options.length };
        if (right) score[name]++;
      });
      asked.push({ zing: zing.text, target: zing.target, options, truthIndex, answers });

      const spotlight = participants[Math.floor(rng() * participants.length)];
      beats.push(beat(
        `The zing goes back up with the name blanked out. ${spotlight} `
        + (spotlight === zing.target
          ? `writes ${zing.target} without hesitating, on the grounds that ${spotlight} has been thinking about very little else since it was read out.`
          : answers[spotlight].right
            ? `writes ${zing.target} straight away — that one was never going to be hard for anybody who was listening.`
            : `writes ${options[answers[spotlight].given]}, and the Zingbot makes a noise about it.`),
        [spotlight, zing.target], `ZING ${r + 1}`, 'challenge'));
    }

    participants.forEach(name => {
      breakdown[name] = { correct: score[name], asked: asked.length, score: round2(score[name]), threw: false };
    });

    const placements = [...participants].sort((a, b) => (score[b] || 0) - (score[a] || 0));
    const entries = placements.map((name, idx) => ({
      name, score: round2((placements.length - idx) * 10 + clamp(score[name] || 0, 0, 9.9)),
      threw: false, base: round2(score[name] || 0),
    }));
    const winner = entries[0]?.name;
    if (winner) {
      beats.push(beat(
        `${winner} matched ${score[winner]} of ${asked.length} and takes it. The Zingbot congratulates ${winner} on knowing exactly how bad everybody else's game is.`,
        [winner], 'WINS IT', 'gold'));
      api.popDelta(winner, 1);
      api.record(winner, 'zingbot-win', { correct: score[winner] });
    }

    return toResult(entries, {
      luck, beats, breakdown, variant: 'zingbot',
      detail: { zings, rounds: asked },
      text: winner ? `${winner} matches ${score[winner]} of ${asked.length} zings to their targets and takes the power.` : '',
    });
  },
};

// ══════════════════════════════════════════════════════════════════════
// To Drink or to Bluff
// ══════════════════════════════════════════════════════════════════════

const DRINKS = [
  'something green with a head on it',
  'a glass of what the crew are calling "the smoothie"',
  'a shot of cold fish stock',
  'a pint of warm slop, thinned out',
  'something that was described as "mostly vinegar"',
  'a glass of unlabelled brown liquid with bits in it',
];

const BLUFF_HOLD = [
  (n, p) => `${n} drinks it, sets the glass down, and says nothing at all — which is either enormous discipline or nothing to hide.`,
  (n, p) => `${n} does not blink. ${p.Sub} ${vb(p, 'holds', 'hold')} the room's eye for a full three seconds and ${vb(p, 'smiles', 'smile')}.`,
  (n, p) => `${n} makes a face at the taste, which everybody does, and gives away exactly nothing else.`,
  (n, p) => `${n} finishes first and immediately starts asking other people how theirs was.`,
];

const BLUFF_TELL = [
  (n, p) => `${n} swallows and then swallows again, and half the yard writes ${p.posAdj} name down on the spot.`,
  (n, p) => `${n} laughs at nothing. Nobody was talking. That is the tell and everybody sees it.`,
  (n, p) => `${n} puts the glass down a lot more carefully than anybody else does.`,
  (n, p) => `${n} says "that was fine" before ${p.sub} ${vb(p, 'is', 'are')} asked, which is the single most incriminating thing available.`,
];

const ACCUSE = [
  (a, t) => `${a} points at ${t} and does not explain why.`,
  (a, t) => `${a} says ${t}'s name quietly, like it costs something.`,
  (a, t) => `${a} goes with ${t}, and glances at ${t} afterwards to see what that did.`,
  (a, t) => `"${t}." ${a} does not elaborate and nobody asks ${a} to.`,
  (a, t) => `${a} accuses ${t} with the air of somebody who decided this before the glasses came out.`,
];

// Only sayable once there HAVE been earlier rounds. Kept apart from the pool
// above because a line about a pattern printed in round one is a line about a
// pattern that has not happened.
const ACCUSE_REPEAT = [
  (a, t) => `"${t}," says ${a}. "It's been ${t} every round and everybody's being polite about it."`,
  (a, t) => `${a} names ${t} again, and this time says the round number out loud while doing it.`,
];

export const drinkOrBluff = {
  id: 'bb-social-drink-or-bluff',
  name: 'To Drink or to Bluff',
  category: 'social',
  types: ['hoh', 'veto', 'tiebreaker'],
  variant: 'drink-or-bluff',
  weight: () => 1,
  desc: 'Each round every houseguest is handed an identical glass and told to drink it, but one glass has been poisoned with something considerably worse than the rest and only the person holding it knows. Everybody drinks at the same time, then the house goes round the table and each houseguest accuses somebody of having drawn the bad glass, with a point for a correct accusation and a point to the poisoned houseguest for every person who named somebody else. The poisoned glass moves to a new houseguest every round, so a good bluff one round is worth nothing the next. Whoever has the most points after the last round wins the power.',
  stats: { social: 0.36, intuition: 0.30, boldness: 0.20, temperament: 0.14 },
  simulate(participants, context, api, rng) {
    const luck = {};
    const say = makePicker(rng);
    const pour = makePicker(rng);
    const beats = [];
    const breakdown = {};
    const score = Object.fromEntries(participants.map(n => [n, 0]));
    const falselyAccused = Object.fromEntries(participants.map(n => [n, 0]));
    participants.forEach(n => { luck[n] = 0; });

    // Six rounds where the field allows it. Four was too few for the thing
    // this competition is about to show up over the noise of who happened to
    // draw the bad glass — measured, a houseguest close to the whole table beat
    // a houseguest close to nobody by 2.12 points to 1.93, which is not a
    // competition about reading people.
    const rounds = Math.min(6, Math.max(2, participants.length - 1));
    const played = [];
    const poisonedBefore = new Set();

    for (let r = 0; r < rounds; r++) {
      const eligible = participants.filter(n => !poisonedBefore.has(n));
      const poisoned = (eligible.length ? eligible : participants)[
        Math.floor(rng() * (eligible.length || participants.length))];
      poisonedBefore.add(poisoned);
      const pp = pronouns(poisoned);

      // Can they hold it? Boldness to commit, temperament to stay level, social
      // to run the performance.
      const composure = stat(poisoned, 'boldness') * 0.36 + stat(poisoned, 'temperament') * 0.34
        + stat(poisoned, 'social') * 0.30;
      const held = composure + (rng() - 0.5) * 4.5 > 5.2;
      beats.push(beat(
        `Round ${r + 1}. Everybody gets ${pour(DRINKS)}, and one of these is considerably worse than the others. `
        + (held ? say(BLUFF_HOLD)(poisoned, pp) : say(BLUFF_TELL)(poisoned, pp)),
        [poisoned], `ROUND ${r + 1}`, 'challenge'));

      const accusations = {};
      for (const accuser of participants) {
        if (accuser === poisoned) {
          // The poisoned houseguest accuses too, and picks the most plausible
          // decoy rather than a friend.
          const others = participants.filter(n => n !== accuser);
          const decoy = others.sort((a, b) => getPerceivedBond(accuser, a) - getPerceivedBond(accuser, b))[0];
          accusations[accuser] = decoy;
          continue;
        }
        // THE SOCIAL GRAPH DECIDES THIS COMPETITION.
        //
        // Reading somebody takes knowing them: a real bond is worth more than
        // any stat here. And suspicion is not evidence — a houseguest already
        // distrusted gets accused whether or not they did anything, which is
        // how this competition turns the house's paranoia into a score.
        const skill = clamp((stat(accuser, 'intuition') * 0.55 + stat(accuser, 'social') * 0.45) / 10, 0, 1);
        const closeness = clamp((getBond(accuser, poisoned) + 4) / 12, 0, 1);
        const chance = clamp(
          (held ? 0.06 : 0.26) + skill * 0.30 + closeness * 0.40,
          0.03, 0.88);
        const roll = rng();
        luck[accuser] = round2((luck[accuser] || 0) + (chance - roll));
        if (roll < chance) {
          accusations[accuser] = poisoned;
          score[accuser]++;
        } else {
          // Wrong, and not randomly wrong: the name that comes out is the one
          // this houseguest already believed the worst of.
          const others = participants.filter(n => n !== accuser && n !== poisoned);
          const suspect = others.length
            ? others.sort((a, b) => getPerceivedBond(accuser, a) - getPerceivedBond(accuser, b))[0]
            : poisoned;
          accusations[accuser] = suspect;
          falselyAccused[suspect] = (falselyAccused[suspect] || 0) + 1;
        }
      }

      // What a bluff is worth.
      //
      // Paying the poisoned houseguest a point per fooled accuser made ONE good
      // bluff worth up to five points against a maximum of one per round for
      // reading the table — so the competition was decided by who happened to
      // draw the bad glass, and a houseguest who read every round correctly
      // still lost to somebody who got lucky once. Measured before the fix:
      // being close to the whole house won 26 runs out of 60, barely better
      // than a coin toss.
      //
      // Now it is graded and capped: getting away with it clean is worth two,
      // being caught by a minority is worth one, being caught by the room is
      // worth nothing.
      const caughtBy = participants.filter(n => n !== poisoned && accusations[n] === poisoned).length;
      const voters = Math.max(1, participants.length - 1);
      score[poisoned] += caughtBy === 0 ? 2 : caughtBy <= voters / 2 ? 1 : 0;

      // Narrate two accusations a round rather than twelve.
      const speakers = participants.filter(n => n !== poisoned)
        .sort(() => rng() - 0.5).slice(0, 2);
      for (const accuser of speakers) {
        const target = accusations[accuser];
        const repeat = r >= 2 && played.some(prev => prev.accusations[accuser] === target);
        beats.push(beat(say(repeat ? ACCUSE_REPEAT : ACCUSE)(accuser, target),
          [accuser, target], 'THE ACCUSATION', 'grey'));
      }
      beats.push(beat(
        `It was ${poisoned}. ` + (held
          ? `${pp.Sub} ${vb(pp, 'drank', 'drink')} it, ${vb(pp, 'lied', 'lie')} about it to everybody at that table, and ${vb(pp, 'got', 'get')} away with it.`
          : `Half the yard had already worked it out.`),
        [poisoned], held ? 'GOT AWAY WITH IT' : 'CAUGHT', held ? 'gold' : 'red'));

      played.push({ round: r + 1, poisoned, held, accusations: { ...accusations } });
    }

    // ── consequences ──
    //
    // Nothing here is cosmetic. A houseguest accused round after round by the
    // same table remembers it, and a bluff that worked is a demonstration to
    // everybody watching that this person lies well under pressure.
    for (const [name, count] of Object.entries(falselyAccused)) {
      if (count >= 2) {
        api.popDelta(name, -1);
        for (const other of participants) {
          if (other !== name) api.addBond(name, other, -0.2);
        }
        api.record(name, 'accused-all-night', { times: count });
      }
    }
    for (const r of played) {
      if (r.held) api.record(r.poisoned, 'bluffed-the-house', { round: r.round });
    }

    participants.forEach(name => {
      breakdown[name] = {
        points: score[name], falselyAccused: falselyAccused[name] || 0,
        bluffsHeld: played.filter(r => r.poisoned === name && r.held).length,
        score: round2(score[name]), threw: false,
      };
    });

    const placements = [...participants].sort((a, b) => (score[b] || 0) - (score[a] || 0));
    const entries = placements.map((name, idx) => ({
      name, score: round2((placements.length - idx) * 10 + clamp(score[name] || 0, 0, 9.9)),
      threw: false, base: round2(score[name] || 0),
    }));
    const winner = entries[0]?.name;
    if (winner) {
      beats.push(beat(
        `${winner} finishes on ${score[winner]} and takes the power — read the table better than the table read ${pronouns(winner).obj}.`,
        [winner], 'WINS IT', 'gold'));
      api.popDelta(winner, 2);
      api.record(winner, 'drink-or-bluff-win', { points: score[winner] });
    }

    return toResult(entries, {
      luck, beats, breakdown, variant: 'drink-or-bluff',
      detail: { rounds: played },
      text: winner ? `${winner} wins To Drink or to Bluff on ${score[winner]} points.` : '',
    });
  },
};

export const SOCIAL_COMPS = [zingbot, drinkOrBluff];
export default SOCIAL_COMPS;
