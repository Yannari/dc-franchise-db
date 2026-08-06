// ══════════════════════════════════════════════════════════════════════
// bb/finale-house.js — the last three days, in a house with nothing in it
// ══════════════════════════════════════════════════════════════════════
//
// Between the final four eviction and finale night, three people live in a
// house built for sixteen. Nothing happens: there is no Head of Household to
// win, no block, no vote, nobody to campaign to. The show fills those days with
// the two things the format has always filled them with, and the simulator did
// neither.
//
// THE MEMORY WALL. They walk the pictures and take the season apart out loud —
// who went, who did it, which week everything turned. Written from THIS
// season's ledger rather than from a bank of nostalgia lines: the weeks are all
// in gs.bb.weeks, so a finalist can stand in front of a specific photograph and
// say the specific thing that happened to that person. A generic "they
// reminisce about the game" beat would be worse than nothing here, because the
// entire point of the scene is that it is their season and no other.
//
// THE STUDYING. Part Three is a quiz about the jury, and in the real house the
// final three spend two days revising for it — who left in what order, who held
// the power, who said what on the way out. How hard somebody revises is a
// decision with a cost: the hours go into the wall or into the person who is
// about to choose who they sit beside, and both of those matter.
//
// The one thing this file does NOT do is score Part Three. That competition
// lives in js/bb-comps/jury-quiz.js, which is another author's, and the study
// figure is recorded here for it to read rather than reached across and applied.
// See gs.bb.finaleStudy at the bottom.

import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { stableRng } from './knowledge.js';
import { seatedJurors } from './jury.js';

const clamp01 = v => Math.max(0, Math.min(1, v));
const archetypeOf = name => players.find(p => p.name === name)?.archetype || 'floater';
const P = name => { try { return pronouns(name); } catch { return { sub: 'they', obj: 'them', posAdj: 'their', Sub: 'They' }; } };

/** A picker that will not repeat itself inside one scene. */
function drawer(rng) {
  const used = new Set();
  return (key, list) => {
    const fresh = list.filter((_, i) => !used.has(`${key}#${i}`));
    const from = fresh.length ? fresh : list;
    const chosen = from[Math.floor(rng() * from.length) % from.length];
    used.add(`${key}#${list.indexOf(chosen)}`);
    return chosen;
  };
}

// Who actually opens the book. An amplifier on a proportional figure, never a
// gate — a goat can revise hard and a mastermind can decide they already know
// it, and both happen.
const REVISES = {
  'perceptive-player': 1.45, mastermind: 1.3, schemer: 1.2, 'loyal-soldier': 1.15,
  hero: 1.05, underdog: 1.15, 'challenge-beast': 0.9, villain: 1.0,
  'social-butterfly': 0.8, showmancer: 0.8, wildcard: 0.85,
  hothead: 0.75, 'chaos-agent': 0.65, floater: 0.9, goat: 0.85,
};

const beat = (tag, cast, text, badgeClass = 'blue') =>
  ({ tag, players: cast.filter(Boolean), text, badgeText: tag, badgeClass });

// ── the wall ──────────────────────────────────────────────────────────

/**
 * What this season actually did, in the order it did it.
 *
 * Every entry is a real week with a real name on it, which is the difference
 * between a memory-wall scene and a paragraph about memories.
 */
function seasonMoments() {
  const weeks = gs.bb?.weeks || [];
  const out = [];
  for (const w of weeks) {
    if (!w?.evicted) continue;
    const against = (w.ballots || []).filter(b => b.evict === w.evicted);
    const total = (w.ballots || []).length;
    out.push({
      week: w.num, name: w.evicted, hoh: w.hoh || null,
      unanimous: total > 0 && against.length === total,
      blowup: w.lastWords?.reveal?.accused || null,
      brokeADeal: (w.dealBreaks || [])[0] || null,
      voters: against.map(b => b.voter),
    });
  }
  return out;
}

function wallBeats(finalists, rng, draw) {
  const moments = seasonMoments();
  const beats = [];
  if (!moments.length) return beats;

  // The first one out, which is always the one nobody can believe was this
  // season, and the most recent, which is the one still in the room.
  const first = moments[0];
  const last = moments[moments.length - 1];
  const teller = finalists[Math.floor(rng() * finalists.length) % finalists.length];

  beats.push(beat('THE WALL', [teller, first.name], draw('first', [
    `${teller} stops at ${first.name}'s photograph. "Week one. That feels like a different show. I don't think I said four words to ${P(first.name).obj}."`,
    `"${first.name} went first," ${teller} says, mostly to ${P(teller).ref}. "I remember thinking the whole thing was going to be over in a fortnight."`,
    `${teller} counts the greyed-out pictures backwards and gets to ${first.name} before running out of wall.`,
  ])));

  // A moment somebody in this room caused. The wall is uncomfortable precisely
  // because the people looking at it are the reason most of it is grey.
  const theirs = moments.filter(m => finalists.includes(m.hoh) && m.name && !finalists.includes(m.name)
    && m.week !== first.week);
  if (theirs.length) {
    const m = theirs[Math.floor(rng() * theirs.length) % theirs.length];
    const b = beat('THE ONE THEY DID', [m.hoh, m.name], draw('theirs', [
      `${m.hoh} does not say much in front of ${m.name}'s photograph. Week ${m.week} was ${P(m.hoh).posAdj} week, and everybody standing there knows it.`,
      `"That one was me," ${m.hoh} says, at ${m.name}'s picture. "I'd do it again. I'd just do it kinder."`,
      `Somebody points out that ${m.name} went home in ${m.hoh}'s week. ${m.hoh} says "yes" and nothing else.`,
    ]));
    b._week = m.week;
    beats.push(b);
  }

  // And the night the season turned, which is the one they will all be asked
  // about at the end. A different week from the one just discussed — the wall
  // has eleven photographs on it and two beats in a row about week eleven read
  // as the scene forgetting what it had already said.
  const spent = new Set([first.week, ...beats.map(b => b._week).filter(Boolean)]);
  const fresh = moments.filter(m => !spent.has(m.week));
  const from = fresh.length ? fresh : moments;
  const loud = from.find(m => m.blowup) || from.find(m => m.brokeADeal) || from[from.length - 1] || last;
  if (loud) {
    beats.push(beat('THE WEEK IT TURNED', finalists.slice(0, 2).concat(loud.name), draw('turn', [
      loud.blowup
        ? `They get to week ${loud.week} and all three of them start talking at once. ${loud.name} went out of that door shouting ${loud.blowup}'s name, and the house has not really been the same house since.`
        : loud.brokeADeal
          ? `Week ${loud.week} comes up and the room goes quiet. That was the one where ${loud.brokeADeal.breaker} wrote ${loud.brokeADeal.victim}'s name down after promising not to.`
          : `They argue about week ${loud.week} for twenty minutes and do not agree about a single detail of it.`,
      `Week ${loud.week} takes half an hour on its own. Three people who were in the same house that night remember three different weeks.`,
    ])));
  }
  return beats;
}

// ── the revision ──────────────────────────────────────────────────────

/**
 * How ready each finalist is for a quiz about seven people.
 *
 * Proportional and continuous. Wits set the ceiling, effort decides how much of
 * it gets used, and effort is a real trade: hours at the wall are hours not
 * spent on the person who is about to choose who they sit next to. Somebody
 * whose whole game is social will keep talking, and it will cost them at the
 * quiz and pay them at the cut.
 */
function studyPhase(finalists, rng, draw) {
  const beats = [];
  const study = {};

  for (const name of finalists) {
    const s = pStats(name);
    const wits = (s.mental * 0.5 + s.strategic * 0.5) / 10;
    // The pull the other way: a sociable finalist spends the evening talking.
    const sociable = (s.social / 10) * 0.5;
    const effort = clamp01((wits * 0.75 + 0.25 - sociable * 0.35)
      * (REVISES[archetypeOf(name)] ?? 1) + (rng() - 0.5) * 0.18);
    study[name] = Number(effort.toFixed(3));

    const hard = effort > 0.62;
    const light = effort < 0.34;
    beats.push(beat(hard ? 'REVISING' : light ? 'NOT REVISING' : 'GOING OVER IT',
      [name],
      hard
        ? draw('hard', [
          `${name} has the whole season written out on the back of a shopping list — order, week, who held the power — and tests ${P(name).ref} on it until ${P(name).sub} can do it backwards.`,
          `${name} walks the wall four times before lunch, saying the names out loud in order like a times table.`,
          `${name} is not pretending to be relaxed about Part Three. ${P(name).Sub} has a system and ${P(name).sub} is working it.`,
          `Somebody finds ${name} at two in the morning reciting eviction votes to an empty kitchen.`,
        ])
        : light
          ? draw('light', [
            `${name} says ${P(name).sub} either knows it or ${P(name).sub} does not, and goes to lie in the sun.`,
            `${name} makes a start, gets as far as week four, and ends up telling a story about week four instead.`,
            `${name} would rather spend the afternoon with the person holding the decision than with a wall of photographs.`,
            `${name} has decided that overthinking it is how people lose, which is a very comfortable thing to decide.`,
          ])
          : draw('mid', [
            `${name} goes over the order twice, gets most of it, and decides that will do.`,
            `${name} revises in the way people revise when they are also listening to a conversation in the next room.`,
            `${name} keeps mixing up two of the middle weeks and keeps meaning to sort it out.`,
          ]),
      hard ? 'gold' : light ? 'grey' : 'blue'));
  }
  return { beats, study };
}

// ── the three of them ─────────────────────────────────────────────────

/**
 * Two days in a house with one decision left in it.
 *
 * Nobody can be voted out and nobody can win anything until finale night, so
 * the only currency is the seat next to whoever wins Part Three — and all three
 * of them spend the time working on it without ever saying so.
 */
function lastDaysBeats(finalists, rng, draw) {
  const beats = [];
  if (finalists.length < 3) return beats;
  const [a, b, c] = finalists;
  // Whoever is closest to whom, since that is the pair the third has to break.
  const pairs = [[a, b], [a, c], [b, c]].sort((x, y) => getBond(y[0], y[1]) - getBond(x[0], x[1]));
  const tight = pairs[0];
  const odd = finalists.find(n => !tight.includes(n));

  beats.push(beat('THE ODD ONE OUT', [odd, ...tight], draw('odd', [
    `${odd} knows exactly what ${tight[0]} and ${tight[1]} are to each other, and spends two days being useful to both of them.`,
    `Nobody says the words "final two" out loud all week, which is how everybody knows ${tight[0]} and ${tight[1]} have one.`,
    `${odd} needs to win Part Three. ${P(odd).Sub} has known that since the moment the house went down to three.`,
  ]), 'red'));

  beats.push(beat('THE LAST QUIET DAYS', finalists, draw('quiet', [
    `Three people cook one meal and eat it at a table built for sixteen. Nobody mentions how loud the room is.`,
    `The house is spotless, the fridge is full and there is nothing whatsoever to do, which none of them have experienced here before.`,
    `They spend an hour listing every houseguest who ever slept in the room they are sitting in, and get two of them wrong.`,
    `Somebody says out loud that in three days one of them will have won this, and the sentence just sits there.`,
  ])));
  return beats;
}

// ── the act ───────────────────────────────────────────────────────────

/**
 * The final three's days, as an act on the finale record.
 *
 * @returns {object|null} the act, or null when there is no final three
 */
export function generateBBFinaleHouse(week, rngIn) {
  const finalists = [...(gs.activePlayers || [])].filter(Boolean);
  if (finalists.length < 2) return null;
  const rng = rngIn || stableRng('finale-house', week?.num || 0, finalists.join());
  const draw = drawer(rng);

  const wall = wallBeats(finalists, rng, draw);
  const { beats: revision, study } = studyPhase(finalists, rng, draw);
  const last = lastDaysBeats(finalists, rng, draw);

  // Consequences. Going through a whole season together is the one thing these
  // three have that nobody else is left to share, and it moves them closer even
  // as they work out which of them is getting cut.
  for (let i = 0; i < finalists.length; i++) {
    for (let j = i + 1; j < finalists.length; j++) {
      addBond(finalists[i], finalists[j], 0.6);
    }
  }
  // And the trade is real: whoever spent the days revising rather than talking
  // gains less of that.
  for (const name of finalists) {
    const others = finalists.filter(n => n !== name);
    if (study[name] > 0.62) others.forEach(other => addBond(name, other, -0.35));
  }
  if (seasonConfig.popularityEnabled !== false) {
    gs.popularity ||= {};
    for (const name of finalists) {
      gs.popularity[name] = (gs.popularity[name] || 0) + (study[name] > 0.62 ? 0.2 : 0.35);
    }
  }

  // Recorded for the quiz to read. Part Three is a test about the jury, and how
  // hard somebody revised for it belongs in the score — but that competition is
  // another author's file, so the number is published here rather than applied
  // from here. Nothing in this module scores anything.
  gs.bb ||= {};
  gs.bb.finaleStudy = { ...study };

  const acts = [
    wall.length ? { title: 'The Memory Wall', beats: wall } : null,
    revision.length ? { title: 'Studying for Part Three', beats: revision } : null,
    last.length ? { title: 'The Last Quiet Days', beats: last } : null,
  ].filter(Boolean);
  if (!acts.length) return null;

  return {
    type: 'finale-house', num: week?.num || 0,
    finalists: [...finalists], jury: seatedJurors(),
    study: { ...study }, acts,
    beats: acts.flatMap(a => a.beats),
    socialBeats: [],
  };
}

/**
 * The last days, for both transcripts.
 *
 * Same reason juryLines and lastWordsLines live in their leaves: two writers
 * describing one scene differently is how a reader ends up with two seasons.
 */
export function finaleHouseLines(act, line) {
  if (!act) return;
  line('');
  line('THE FINAL THREE');
  line(`  ${act.finalists.join(', ')} — three days, and nothing to play for until finale night.`);
  for (const a of act.acts || []) {
    line('');
    line(`  ${a.title.toUpperCase()}`);
    for (const b of a.beats || []) line(`    · ${b.text}`);
  }
  const ranked = Object.entries(act.study || {}).sort((x, y) => y[1] - x[1]);
  if (ranked.length) {
    line('');
    line(`  Revision: ${ranked.map(([n, v]) => `${n} ${Math.round(v * 100)}%`).join(', ')}.`);
  }
}
