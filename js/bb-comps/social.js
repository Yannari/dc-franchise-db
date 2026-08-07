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
import { breakQuizTie, optionsFor } from './_recall.js';
import { endgameDealsOf, tierOf } from '../bb/deals.js';

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
 * What the season can actually make fun of somebody for.
 *
 * Read once per houseguest, out of the ledger rather than out of stats wherever
 * the ledger has it: what they have won, what they have never won, how often
 * they have sat on that block, how many people they have promised the end to,
 * who they are attached to, and how many of their own votes went with the room.
 */
function roastProfile(name) {
  const st = gs.bb?.stats?.[name] || {};
  const ws = weeksOf();
  const hohWins = st.hohWins || 0;
  const vetoWins = st.vetoWins || 0;
  const blocked = st.timesOnTheBlock || st.timesNominated || 0;
  const saved = st.timesSaved || 0;
  const weeksIn = ws.filter(w => (w.houseAtStart || []).includes(name)).length;
  const hohWeeks = ws.filter(w => w.hoh === name).map(w => w.num);
  const vetoWeeks = ws.filter(w => w.vetoWinner === name).map(w => w.num);
  // Only weeks that actually recorded an eviction. A week with ballots and no
  // evictee — a ledger still being written, a cancelled night — counted as a
  // vote AGAINST the house for everybody, and the robot told a whole cast they
  // had never once been in the majority.
  const ballots = ws.filter(w => w.evicted).flatMap(w => (w.ballots || [])
    .filter(b => b.voter === name)
    .map(b => ({ week: w.num, evict: b.evict, evicted: w.evicted })));
  const withTheHouse = ballots.filter(b => b.evict === b.evicted).length;
  const againstTheHouse = ballots.length - withTheHouse;
  const showmance = (gs.showmances || []).find(sh => (sh.players || []).includes(name));
  const partner = showmance ? (showmance.players || []).find(n => n !== name) : null;
  let finalTwos = 0;
  try { finalTwos = endgameDealsOf(name).filter(d => tierOf(d) === 'final-two').length; } catch { finalTwos = 0; }
  const evictedByThem = ws.filter(w => w.hoh === name && w.evicted).map(w => w.evicted);
  const nomWeeks = ws.filter(w => (w.nominees || []).includes(name)
    || (w.finalNominees || []).includes(name)).map(w => w.num);
  const slop = ws.filter(w => (w.haveNots || []).includes(name)).length;
  const pop = Number(gs.popularity?.[name]) || 0;
  return {
    name, hohWins, vetoWins, wins: hohWins + vetoWins, blocked, saved, weeksIn,
    hohWeeks, vetoWeeks, votes: ballots.length, withTheHouse, againstTheHouse,
    showmance: !!showmance, broken: !!showmance?.broken, partner, finalTwos,
    evictedByThem, nomWeeks, slop, pop,
  };
}

/**
 * The zings, as TEMPLATES rather than as finished sentences.
 *
 * This is the fix for a roast that read like one joke told nine times. The
 * first version rendered each houseguest's options with their name already
 * inside them, so the non-repeating picker — which dedupes on the item it is
 * handed — saw nine completely different strings and cheerfully used the same
 * joke five times. Templates are shared objects, so a picker can tell that the
 * mailing-list one has already been told.
 *
 * `when` is the condition, and the list is ordered SPECIFIC FIRST: a zing about
 * the four vetoes somebody has actually won beats a zing about houseguests in
 * general, and the ones at the bottom only fire when the season has handed the
 * robot nothing to work with.
 */
const ZINGS = [
  // ── competition record ──
  { when: f => f.wins >= 4,
    say: f => `${f.name}! ${f.wins} competition wins. You have made yourself the biggest threat in this house, which means every single person out here has quietly agreed to take you out the first week you cannot save yourself. Enjoy the trophies. ZING!` },
  { when: f => f.vetoWins >= 3,
    say: f => `${f.name} has won ${f.vetoWins} vetoes. ${f.vetoWins} separate chances to change a week, and ${f.vetoWins} times you used it on the most important person in this house — you. ZING!` },
  { when: f => f.wins === 0 && f.weeksIn >= 4,
    say: f => `${f.name}. ${f.weeksIn} weeks in this house, zero wins. Zero. At this point the competitions are just a weekly ceremony to remind everybody you got here by accident. ZING!` },
  { when: f => f.hohWins >= 2 && f.vetoWins === 0,
    say: f => `${f.name} has ${f.hohWins} Head of Household wins and not one veto. Brilliant at seizing power, hopeless at keeping yourself out of trouble. That is not a game, that is a personality. ZING!` },
  { when: f => f.hohWins === 0 && f.vetoWins >= 2,
    say: f => `${f.name} has ${f.vetoWins} vetoes and has never once won a Head of Household. You are the most decorated passenger this show has ever carried. ZING!` },
  // ── the block ──
  { when: f => f.blocked >= 3,
    say: f => `${f.name} has been on that block ${f.blocked} times. That is not a chair any more, that is an address. I have had your post forwarded. ZING!` },
  { when: f => f.blocked >= 2 && f.saved >= 1,
    say: f => `${f.name} has been nominated ${f.blocked} times and pulled off that block by somebody else's veto. You are not playing this game, you are being carried through it by people who feel awkward. ZING!` },
  { when: f => f.blocked === 0 && f.weeksIn >= 5 && f.wins === 0,
    say: f => `${f.name} has never won anything and has never been nominated. Do you know what that makes you? Furniture. Lovely furniture. Nobody moves the sofa. ZING!` },
  { when: f => f.nomWeeks.length >= 2,
    say: f => `${f.name} sat on that block in week ${f.nomWeeks[0]}, and again in week ${f.nomWeeks[f.nomWeeks.length - 1]}. Twice this house looked at everybody available and said 'no, the same one again'. ZING!` },
  // ── the reign ──
  { when: f => f.hohWeeks.length >= 1 && f.evictedByThem.length >= 1,
    say: f => `${f.name} ran week ${f.hohWeeks[0]} and sent ${f.evictedByThem[0]} out of that door, and has told everybody how hard that decision was roughly four hundred times since. It was two people. Out of a house. ZING!` },
  { when: f => f.hohWeeks.length >= 2,
    say: f => `${f.name} has run this house in weeks ${f.hohWeeks.join(' and ')}, and on both occasions the entire place did exactly what somebody else had already decided. Congratulations on the bedroom. ZING!` },
  // ── the voting record ──
  { when: f => f.votes >= 4 && f.againstTheHouse === 0,
    say: f => `${f.name} has cast ${f.votes} votes and been on the winning side of every one. That is not loyalty. That is waiting to see which way the room leans and then leaning harder. ZING!` },
  { when: f => f.votes >= 3 && f.withTheHouse === 0,
    say: f => `${f.name} has voted ${f.votes} times and been in the minority every single time. You are not an independent thinker, you are a weather vane facing the wrong way. ZING!` },
  // ── deals and showmances ──
  { when: f => f.finalTwos >= 3,
    say: f => `${f.name} is currently holding ${f.finalTwos} separate final twos. That is not a strategy, that is a mailing list, and at least ${f.finalTwos - 1} people in this yard are going to feel extremely silly. ZING!` },
  { when: f => f.finalTwos === 2,
    say: f => `${f.name} has shaken on the final two with two different people. One of you is a genius and two of you are about to be very badly hurt. ZING!` },
  { when: f => f.showmance && !f.broken && !!f.partner,
    say: f => `${f.name} and ${f.partner}. Nothing says 'I came here to win half a million dollars' quite like handing somebody else a vote and calling it romance. ZING!` },
  { when: f => f.broken && !!f.partner,
    say: f => `${f.name} and ${f.partner} are finished, which this house worked out from the way ${f.name} started doing the washing up alone at one in the morning. ZING!` },
  // ── conditions ──
  { when: f => f.slop >= 2,
    say: f => `${f.name} has done ${f.slop} weeks on slop. That is not a punishment any more, that is a lifestyle, and it is showing up in the competition results. ZING!` },
  { when: f => f.pop <= -3,
    say: f => `${f.name}. I asked the audience for one nice thing about your game and the pause was long enough that we had to cut away to the fish. ZING!` },
  { when: f => f.pop >= 6 && f.wins <= 1,
    say: f => `${f.name} is adored out there, which is lovely, because it is the only place you are currently winning anything. ZING!` },
  { when: f => f.weeksIn >= 7 && f.wins <= 1,
    say: f => `${f.name} has survived ${f.weeksIn} weeks on one win and an enormous quantity of nodding. Genuinely impressive. Profoundly boring. ZING!` },
  // ── the fallbacks, which still have to be about somebody ──
  { generic: true, when: () => true,
    say: f => `${f.name}. I have been watching the feeds and I have to ask — is the strategy 'lie very still and hope'? Because it is working, and that is the saddest part. ZING!` },
  { generic: true, when: () => true,
    say: f => `${f.name}, you talk about your game an awful lot for somebody whose game is mostly walking into rooms other people are already talking in. ZING!` },
  { generic: true, when: () => true,
    say: f => `${f.name}. Every week you tell that camera you are about to make a big move. At this rate the move is going to be out the front door. ZING!` },
  { generic: true, when: () => true,
    say: f => `${f.name}, I asked four houseguests to describe your game and three of them described somebody else's. ZING!` },
  { generic: true, when: () => true,
    say: f => `${f.name}, your enormous strategic insight this week was that somebody has to go home. Groundbreaking. ZING!` },
  { generic: true, when: () => true,
    say: f => `${f.name}. I love the way you say 'trust me' with your whole chest and then check the floor. The floor knows. ZING!` },
  { generic: true, when: () => true,
    say: f => `${f.name} is playing a beautifully quiet game. Nobody in this house can hear it. Nobody at home can either. ZING!` },
  { generic: true, when: () => true,
    say: f => `${f.name}, you have the strategic instincts of a smoke alarm. Very loud, always three minutes late, and about something that is already burning. ZING!` },
];

/**
 * One zing, from the sharpest thing the season can actually prove.
 *
 * `used` is shared across the whole roast and holds TEMPLATES, so the same joke
 * cannot be told twice even though every rendering is different — which is
 * precisely what went wrong before.
 */
function zingFor(name, rng, used) {
  const facts = roastProfile(name);
  const eligible = ZINGS.filter(z => z.when(facts));
  const fresh = eligible.filter(z => !used.has(z));
  const pool = fresh.length ? fresh : eligible;
  // A generic zing is the LAST resort, never a co-equal option.
  //
  // Taking the sharpest third of everything eligible sounds right and is not:
  // a houseguest with three specific hooks has eight fallbacks in the same
  // pool, so the top third still contained filler and a man with four
  // competition wins got told he lies very still and hopes.
  const specific = pool.filter(z => !z.generic);
  const from = specific.length ? specific : pool;
  const sharp = from.slice(0, Math.max(1, Math.ceil(from.length / 2)));
  const chosen = sharp[Math.floor(rng() * sharp.length)];
  used.add(chosen);
  return { text: `"${chosen.say(facts)}"`, facts };
}

// Deep on purpose. A roast runs once per houseguest, so a pool of three across
// a house of twelve prints the same reaction four times and makes the whole
// segment read like a loop.
const ZING_REACTION_GOOD = [
  (n, p) => `${n} laughs harder than anybody, which is the correct play and also completely genuine.`,
  (n, p) => `${n} takes it on the chin, applauds the robot, and gets a bigger cheer than the joke did.`,
  (n, p) => `${n} shouts "that's FAIR" over the laughing and means it.`,
  (n, p) => `${n} puts both hands up, concedes the point, and asks the robot to do it again.`,
  (n, p) => `${n} is laughing so hard ${p.sub} ${vb(p, 'has', 'have')} to sit down on the grass for a second.`,
  (n, p) => `${n} looks straight down the camera and mouths "it's true", which gets a bigger laugh than the zing.`,
  (n, p) => `${n} high-fives the person next to ${p.obj}, who was not expecting to be involved.`,
  (n, p) => `${n} says "I've been waiting all season for that one" and sounds like ${p.sub} ${vb(p, 'means', 'mean')} it.`,
];

const ZING_REACTION_BAD = [
  (n, p) => `${n} laughs about a half-second late and stops about a half-second early, and everybody in the yard clocks both.`,
  (n, p) => `${n} does not laugh. ${p.Sub} ${vb(p, 'looks', 'look')} at the robot the way you look at somebody who has read your diary.`,
  (n, p) => `${n} says "okay" quietly, twice, and the second one is not to anybody.`,
  (n, p) => `${n} smiles with the bottom half of ${p.posAdj} face only, and holds it far too long.`,
  (n, p) => `${n} starts to answer back, thinks better of it, and stares at the decking instead.`,
  (n, p) => `${n} laughs, then asks — not as a joke — who wrote that one.`,
  (n, p) => `${n} claps twice. It is the loneliest sound in the yard.`,
  (n, p) => `${n} does not move at all, and the person beside ${p.obj} very deliberately does not look over.`,
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
    // One set of templates for the whole roast, so no joke is told twice.
    const usedZings = new Set();
    for (const target of house) {
      const { text } = zingFor(target, rng, usedZings);
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
    const rounds = Math.min(7, zings.length);
    const used = new Set();
    // Rotated, not drawn. A randomly chosen narrator meant a whole quiz could
    // be — and was — narrated by two houseguests while eight were answering.
    const spotOffset = Math.floor(rng() * participants.length);
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
        answers[name] = {
          right,
          given: right ? truthIndex : (truthIndex + 1 + Math.floor(rng() * (options.length - 1))) % options.length,
        };
        if (right) score[name]++;
      });
      // Never the person the zing was about: they are the one houseguest who
      // cannot get it wrong, so narrating them is narrating a free point.
      const eligible = participants.filter(n => n !== zing.target);
      const pool = eligible.length ? eligible : participants;
      const spotlight = pool[(r + spotOffset) % pool.length];
      asked.push({
        zing: zing.text, target: zing.target, options, truthIndex, answers,
        spotlight, given: answers[spotlight].given, right: answers[spotlight].right,
        correct: participants.filter(n => answers[n].right).length,
        field: participants.length,
      });
      beats.push(beat(
        `The zing goes back up with the name blanked out. ${spotlight} `
        + (spotlight === zing.target
          ? `writes ${zing.target} without hesitating, on the grounds that ${spotlight} has been thinking about very little else since it was read out.`
          : answers[spotlight].right
            ? `writes ${zing.target} straight away — that one was never going to be hard for anybody who was listening.`
            : `writes ${options[answers[spotlight].given]}, and the Zingbot makes a noise about it.`),
        [spotlight, zing.target], `ZING ${r + 1}`, 'challenge'));
    }

    const tiebreaks = breakQuizTie({
      participants, score, rng, beats, beat, statOf: n => pStats(n) || {},
    });

    participants.forEach(name => {
      breakdown[name] = {
        correct: Math.floor(score[name]), asked: asked.length,
        wonTiebreak: tiebreaks.some(t => t.winner === name),
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
        `${winner} matched ${Math.floor(score[winner])} of ${asked.length} and takes it. The Zingbot congratulates ${winner} on knowing exactly how bad everybody else's game is.`,
        [winner], 'WINS IT', 'gold'));
      api.popDelta(winner, 1);
      api.record(winner, 'zingbot-win', { correct: score[winner] });
    }

    return toResult(entries, {
      luck, beats, breakdown, variant: 'zingbot',
      detail: { zings, rounds: asked, tiebreaks },
      text: winner ? `${winner} matches ${Math.floor(score[winner])} of ${asked.length} zings to their targets and takes the power.` : '',
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
