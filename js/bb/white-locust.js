// ══════════════════════════════════════════════════════════════════════
// THE WHITE LOCUST RESORT — check in together, leave one behind
// ══════════════════════════════════════════════════════════════════════
//
// BB27, Week 9, and the first of the Mastermind's three sacrifices. The house
// checked into a resort run by a returning fan favourite, and the wiki is blunt
// about how the stay ended: "by the end of their stay, one houseguest would not
// be checking out". The rest of the week then ran as normal and evicted a
// second person, which is why this is a SPECIAL elimination rather than a
// replacement for the eviction.
//
// The mechanic is the Call Out Chain, carried over from Reindeer Games:
//
//   1. Everybody plays for safety. The winner is safe and starts the chain.
//   2. The safe player CALLS SOMEBODY OUT.
//   3. That person has a set time to complete a task. Fail and they are gone,
//      on the spot, no vote.
//   4. Survive and they call out the next person — with LESS time.
//   5. It runs until somebody fails.
//   6. Of everybody who survived a turn, the fastest is the new Head of
//      Household.
//
// What makes it worth simulating rather than narrating is that the choosing is
// the game. Calling somebody out is a public act with two motives pulling
// against each other — send the person you want gone, or send the person most
// likely to fail — and they are frequently not the same person. A strong player
// called out early usually survives and then gets to aim the chain at you.
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { addBond, getBond, getPerceivedBond } from '../bonds.js';
import { stableRng } from './knowledge.js';

/** The task each round asks for, and the two stats it leans on. */
const TASKS = [
  { name: 'the luggage run', a: 'physical', b: 'endurance',
    doing: 'hauling a stack of resort suitcases up the service stairs and stacking them by room number' },
  { name: 'the room service order', a: 'mental', b: 'intuition',
    doing: 'memorising a room service order for eleven rooms and reciting it back without the ticket' },
  { name: 'the ice bucket ladder', a: 'physical', b: 'boldness',
    doing: 'carrying a full ice bucket up a swaying ladder to the top of the cabana' },
  { name: 'the guest book', a: 'mental', b: 'social',
    doing: 'matching every guest photograph in the resort book to the room they checked into' },
  { name: 'the towel fold', a: 'mental', b: 'temperament',
    doing: 'folding towels into the shapes on the card, in order, while the tannoy counts down' },
  { name: 'the pool skim', a: 'endurance', b: 'physical',
    doing: 'skimming every leaf out of the resort pool with a net two sizes too small' },
];

const stat = (name, key) => {
  try { return Number(pStats(name)?.[key]) || 5; } catch { return 5; }
};
const P = name => {
  try { return pronouns(name); } catch {
    return { sub: 'they', obj: 'them', posAdj: 'their', Sub: 'They' };
  }
};

/**
 * How long this houseguest takes, in seconds. Lower is better.
 *
 * Proportional to the two stats the task leans on, never a threshold, and
 * carrying enough noise that a strong player can genuinely blow it — the whole
 * night is worthless if the callout choice is a calculator.
 */
function attemptTime(name, task, rng) {
  const skill = (stat(name, task.a) * 0.6 + stat(name, task.b) * 0.4) / 10;   // 0.1 – 1.0
  const base = 96 - skill * 46;                    // ~50s for a specialist, ~86s for a poor fit
  const noise = (rng() - 0.5) * 34;                // enough to upset the order
  return Math.max(18, Math.round((base + noise) * 10) / 10);
}

/**
 * Who does the person holding the pin send up?
 *
 * Two motives, weighted against each other, and both are legible on screen:
 * somebody you want out of the house, and somebody you think will fail. A
 * caller who only ever picked the weakest would make this a stats readout; one
 * who only ever picked an enemy would ignore the clock entirely.
 */
function chooseTarget(caller, pool, task, timeLimit, rng) {
  let best = null;
  let bestScore = -Infinity;
  for (const name of pool) {
    const skill = (stat(name, task.a) * 0.6 + stat(name, task.b) * 0.4) / 10;
    // How likely this one is to run out of clock, roughly.
    const expected = 96 - skill * 46;
    const failLean = (expected - timeLimit) / 30;
    let bond = 0;
    try { bond = getPerceivedBond(caller, name); } catch { bond = 0; }
    const score = failLean * 1.15                    // send somebody who might fail
      + (-bond / 10) * 1.0                           // send somebody you dislike
      + (rng() - 0.5) * 0.7;                         // and never be entirely predictable
    if (score > bestScore) { bestScore = score; best = name; }
  }
  return best;
}

/**
 * Run the resort week's special elimination.
 *
 * Returns `{ act, evicted, hoh }`, or null when the house is too small for the
 * chain to mean anything. The caller owns removing the evicted houseguest —
 * this decides, it does not mutate the roster.
 */
export function runCallOutChain(week, house, { rng = Math.random } = {}) {
  const pool = (house || []).filter(Boolean);
  // Below six the chain is two names and a coin toss, and taking somebody out
  // before a normal eviction would gut the week.
  if (pool.length < 6) return null;

  const r = stableRng('white-locust', gs?.bb?.seasonSalt || 0, week.num);
  const draw = () => r();

  // ── the safety competition ──
  const safetyTask = TASKS[Math.floor(draw() * TASKS.length)];
  const safetyTimes = pool.map(name => ({ name, t: attemptTime(name, safetyTask, draw) }))
    .sort((a, b) => a.t - b.t);
  const safe = safetyTimes[0].name;

  // ── the chain ──
  const rounds = [];
  const survivors = [];           // everybody who completed a turn, with their time
  const remaining = pool.filter(n => n !== safe);
  let caller = safe;
  let limit = 78;                 // generous, and it does not stay that way
  let evicted = null;

  while (remaining.length && !evicted) {
    const task = TASKS[Math.floor(draw() * TASKS.length)];
    const target = chooseTarget(caller, remaining, task, limit, draw);
    remaining.splice(remaining.indexOf(target), 1);
    const time = attemptTime(target, task, draw);
    const made = time <= limit;
    let bond = 0;
    try { bond = getBond(caller, target); } catch { bond = 0; }
    rounds.push({
      caller, target, task: task.name, doing: task.doing,
      limit: Math.round(limit), time, made,
      // Was this an ally being sent up? The room can see that too.
      betrayal: bond >= 3,
    });
    if (made) {
      survivors.push({ name: target, time });
      caller = target;            // survive and the pin is yours
      limit = Math.max(30, Math.round(limit * 0.86));  // and it gets shorter
    } else {
      evicted = target;
    }
  }

  // Nobody failed — the chain ran out of people. The last one standing has
  // still not been called out, and the resort does not let everybody leave.
  if (!evicted && rounds.length) {
    const worst = [...survivors].sort((a, b) => b.time - a.time)[0];
    if (worst) {
      evicted = worst.name;
      survivors.splice(survivors.findIndex(s => s.name === worst.name), 1);
      rounds.push({ caller: null, target: worst.name, task: 'the last check-out',
        doing: 'standing in the lobby while the resort decides who is not leaving with the others',
        limit: 0, time: worst.time, made: false, betrayal: false, sweep: true });
    }
  }
  if (!evicted) return null;

  // ── the crown ──
  // "Of the players who completed the competition and survived, the person to
  // do so in the fastest time would be made the new HOH." The safety winner is
  // eligible too — they completed a turn, they simply did it first.
  const eligible = [{ name: safe, time: safetyTimes[0].t }, ...survivors];
  const hoh = [...eligible].sort((a, b) => a.time - b.time)[0].name;

  // ── consequences ──
  //
  // Being called out is not free for the caller. Naming somebody in a room and
  // sending them up to play for their life is the most public thing anybody
  // does all season, and the person who survives it remembers who sent them.
  for (const round of rounds) {
    if (!round.caller) continue;
    try {
      addBond(round.caller, round.target, round.made ? -1.4 : -2.2);
      if (round.betrayal) addBond(round.caller, round.target, -0.8);
    } catch { /* one of them has already left */ }
  }
  if (seasonConfig?.popularityEnabled !== false) {
    gs.popularity ||= {};
    // Surviving a call-out is the resort's one heroic act.
    for (const s of survivors) {
      gs.popularity[s.name] = Math.round(((gs.popularity[s.name] || 0) + 1.5) * 100) / 100;
    }
    // Sending an ally up is the villainous one.
    for (const round of rounds.filter(x => x.betrayal)) {
      gs.popularity[round.caller] = Math.round(((gs.popularity[round.caller] || 0) - 2) * 100) / 100;
    }
  }

  const p = P(evicted);
  return {
    evicted,
    hoh,
    act: {
      type: 'white-locust',
      safe, safetyTask: safetyTask.name, safetyTime: safetyTimes[0].t,
      rounds, evicted, hoh,
      survivors: survivors.map(s => ({ ...s })),
      beats: [{
        text: `<strong>${evicted}</strong> does not check out. The chain reached ${p.obj} with `
          + `${rounds[rounds.length - 1].limit} seconds on the clock and ${p.sub} `
          + `${p.sub === 'they' ? 'were' : 'was'} still ${rounds[rounds.length - 1].doing.split(' ').slice(0, 4).join(' ')} `
          + `when it ran out. There is no vote and nothing to campaign against.`,
        players: [evicted], badgeText: 'DID NOT CHECK OUT', badgeClass: 'red',
        eventId: 'white-locust-eliminated', category: 'twist', location: 'living-room',
      }],
    },
  };
}
