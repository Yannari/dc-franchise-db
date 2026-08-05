// ══════════════════════════════════════════════════════════════════════
// bb/capsule-challenges.js — what is actually happening in that room
// ══════════════════════════════════════════════════════════════════════
//
// The capsule used to be one hidden dice roll. A houseguest walked through a
// door, a number was compared to a threshold, and they came out holding a
// power or wearing a costume — and nobody watching had the faintest idea what
// they had just failed to do.
//
// That is the thing the challenge rules in CLAUDE.md exist to prevent. A
// challenge has to say four things: what is in the room, what they physically
// do, what goes wrong, and how you win. Then the run has to be watchable —
// stage by stage, with the clock burning and the misses visible — because
// "they did not beat it" is a result and not a scene.
//
// Six of them, each asking for a different pair of stats, so the capsule is not
// secretly the same competition every week and the same houseguest is not
// quietly favoured all season.
import { pStats, pronouns } from '../players.js';
import { aptitude } from '../bb-comps/_shared.js';

/**
 * A capsule challenge.
 *
 *   stats   the mix, per the proportional rule — never a threshold
 *   stages  how many attempts the run is broken into. More stages means a
 *           steadier run: one bad roll cannot sink a five-stage challenge the
 *           way it sinks a three-stage one, which is what makes the physical
 *           ones swingier than the mental ones without saying so anywhere.
 *   target  total needed across all stages to come out holding something
 *   verb    what one stage attempt is called, for the play-by-play
 */
export const CAPSULE_CHALLENGES = [
  {
    id: 'shelf-of-seasons',
    name: 'The Shelf of Seasons',
    stats: { mental: 0.44, intuition: 0.28, temperament: 0.28 },
    stages: 5, target: 27.5, verb: 'box',
    desc: 'The capsule is lined floor to ceiling with numbered boxes, one for every season the show has run, and each box holds a single object from that year — a key, a costume piece, a veto medallion. A voice reads out a moment and the houseguest has to pull the box it belongs to, then hold the object up to the scanner before the voice starts the next one. Pull the wrong box and it locks for thirty seconds, which is long enough to lose the next moment as well, so one mistake usually costs two. Five correct objects before the timer runs out and the shelf opens.',
  },
  {
    id: 'the-vault-crawl',
    name: 'The Vault Crawl',
    stats: { physical: 0.42, endurance: 0.34, temperament: 0.24 },
    stages: 3, target: 16.5, verb: 'crawl',
    desc: 'The floor of the capsule is a low crawlspace of steel shelving with a hatch at the far end, and the ceiling drops by a foot every time the buzzer sounds. The houseguest crawls the length of it carrying a sealed canister in one hand, which means one arm to pull with and no way to brace. The buzzer is on a timer they cannot see, and anybody caught upright when it goes has to reverse to the start and set off again with the ceiling lower than it was. Three lengths with the canister still sealed opens the hatch.',
  },
  {
    id: 'the-tape-wall',
    name: 'The Tape Wall',
    stats: { intuition: 0.40, mental: 0.32, social: 0.28 },
    stages: 4, target: 22, verb: 'tape',
    desc: 'One wall of the capsule is a grid of unlabelled tape reels, each holding a few seconds of audio from a past season, and a single reel somewhere in the grid is a houseguest saying the phrase printed on the door. The player threads a reel, listens, and either commits to it or pulls it and threads another — but the machine only takes twelve reels before it jams for good. Threading is slow and listening is slower, so the guessing has to be done before the hands move. Find the phrase inside twelve reels and the wall lifts.',
  },
  {
    id: 'cold-storage',
    name: 'Cold Storage',
    stats: { endurance: 0.46, temperament: 0.30, physical: 0.24 },
    stages: 4, target: 22, verb: 'minute',
    desc: 'The capsule drops to just above freezing and a dial on the far wall has to be held at a fixed mark with both hands, which sounds simple until the cold sets in and the shaking starts. Every minute the dial drifts and has to be corrected; let it swing past the mark in either direction and the timer on the wall resets to the start of that minute. There is a coat hanging by the door and taking it costs a minute of the clock, which is the whole decision. Hold the dial through four clean minutes and the room warms up.',
  },
  {
    id: 'the-ballot-box',
    name: 'The Ballot Box',
    stats: { mental: 0.38, strategic: 0.34, intuition: 0.28 },
    stages: 5, target: 27.5, verb: 'ballot',
    desc: 'A sealed box in the middle of the capsule spits out ballots from evictions the house has already held this season, one at a time, with the voter\'s name blacked out. The houseguest reads the vote and posts the ballot into one of the slots along the wall, each labelled with a houseguest, guessing who cast it. A correct post lights the slot green and a wrong one jams it shut for the rest of the run, so the easy names have to be spent carefully or there is nowhere left to put the hard ones. Five green slots opens the box.',
  },
  {
    id: 'the-long-hallway',
    name: 'The Long Hallway',
    stats: { physical: 0.40, mental: 0.32, endurance: 0.28 },
    stages: 4, target: 22, verb: 'run',
    desc: 'The capsule opens onto a hallway lined with doors, all of them locked except one, and a four-digit code is projected on the wall behind the player for two seconds at the start of every run. They sprint the hallway, try the code on a door, and sprint back to the projector when it fails — and the code changes each time, so the memory has to survive the running. A wrong code locks that door permanently and shortens the hallway\'s remaining options. Get through a door in four runs and the hallway ends.',
  },
];

const pick = (rng, list) => list[Math.floor(rng() * list.length)] || list[0];

const GOOD = [
  (n, c, i) => `${n} takes the ${c.verb} clean and does not celebrate it, which is the right instinct with the clock still going.`,
  (n, c, i) => `Stage ${i}: ${n} gets it first time. The room does not acknowledge it and neither does ${pronouns(n).sub}.`,
  (n, c, i) => `${n} reads it, commits, and is right. That is ${i} down.`,
  (n, c, i) => `A clean ${c.verb} from ${n}. ${pronouns(n).Sub} ${pronouns(n).sub === 'they' ? 'have' : 'has'} found the rhythm of the thing.`,
];
const NEAR = [
  (n, c, i) => `${n} has it, hesitates, and changes ${pronouns(n).posAdj} mind at exactly the wrong moment. It half-counts and the clock does not care.`,
  (n, c, i) => `Stage ${i} goes to ${n} on the second attempt, which is a stage taken and a chunk of the clock gone.`,
  (n, c, i) => `${n} gets there, slowly. Slowly is the expensive way.`,
  (n, c, i) => `Not clean, not a disaster — ${n} takes the ${c.verb} with the timer eating into what is left.`,
];
const BAD = [
  (n, c, i) => `${n} goes wrong on stage ${i} and the penalty lands exactly as the rules promised it would.`,
  (n, c, i) => `A bad ${c.verb} from ${n}. ${pronouns(n).Sub} ${pronouns(n).sub === 'they' ? 'know' : 'knows'} it before the machine tells ${pronouns(n).obj}.`,
  (n, c, i) => `${n} loses stage ${i} to impatience rather than to the challenge, which will be the part ${pronouns(n).sub} ${pronouns(n).sub === 'they' ? 'replay' : 'replays'} later.`,
  (n, c, i) => `Stage ${i} beats ${n} outright. There is no time to be annoyed about it and ${pronouns(n).sub} ${pronouns(n).sub === 'they' ? 'are' : 'is'} annoyed about it.`,
];

/**
 * Run a capsule attempt, stage by stage.
 *
 * Scored proportionally against the challenge's own target rather than a
 * global clock, so a three-stage crawl and a five-stage shelf are equally
 * winnable — roughly 45–55% — and the difference between them is how much the
 * run SWINGS, not how likely it is to be won.
 *
 * @returns {object} { challenge, stages, total, target, won, margin }
 */
export function runCapsuleAttempt(name, rng = Math.random, forcedId = null) {
  const challenge = (forcedId && CAPSULE_CHALLENGES.find(c => c.id === forcedId))
    || pick(rng, CAPSULE_CHALLENGES);
  const base = aptitude(name, challenge.stats);
  const stages = [];
  let total = 0;

  for (let i = 1; i <= challenge.stages; i++) {
    // Per stage: what they bring to ONE stage, plus real noise. Dividing the
    // aptitude across the stages was the original bug — it made every total
    // land near a single houseguest's aptitude (~5.5) while the targets were
    // written as if each stage scored that much, so nobody ever won anything.
    //
    // The noise is deliberately wide. A capsule nobody can lose is a gift with
    // extra steps; a capsule nobody can win is a punishment twist wearing a
    // competition's clothes.
    const roll = base + (rng() - 0.5) * 4.4;
    const par = challenge.target / challenge.stages;
    const grade = roll >= par * 1.08 ? 'good' : roll >= par * 0.82 ? 'near' : 'bad';
    const pool = grade === 'good' ? GOOD : grade === 'near' ? NEAR : BAD;
    stages.push({
      index: i, grade, score: roll,
      text: pick(rng, pool)(name, challenge, i),
    });
    total += roll;
  }

  return {
    challenge: { id: challenge.id, name: challenge.name, desc: challenge.desc,
      stages: challenge.stages, target: challenge.target },
    stages, total, target: challenge.target,
    won: total >= challenge.target,
    margin: total - challenge.target,
  };
}
