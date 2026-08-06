// ══════════════════════════════════════════════════════════════════════
// bb/jury-house.js — the room where the season is actually decided
// ══════════════════════════════════════════════════════════════════════
//
// The jury was seated and then nothing happened to it. Seven people who had
// each been removed from the game by somebody still in it sat in a lodge for
// two months, compared no notes, changed no minds, and arrived at the finale
// with the opinion they walked in with. The vote was then computed out of stats
// at the last minute, which meant the most consequential conversation in the
// format was the one the simulator never held.
//
// Total Drama already had the shape of this — generateInterludeLife builds four
// acts with a Roundtable centrepiece, and it is a good shape. What it cannot be
// is copied, for one structural reason: in that show the votes are read out
// loud, so its jury argues from facts. Here the vote is secret and a juror
// arrives believing whatever they managed to work out on the way to the door,
// which is frequently wrong. So the load-bearing rule of this room is:
//
//   Jurors argue from BELIEFS, and beliefs can be wrong.
//
// A finalist can lose a vote for a move they did not make. A finalist can win
// one because the jury credits them with somebody else's. Both happen in the
// real show constantly and neither was reachable here before.
//
// Size follows the calendar rather than the drama: every week gets an arrival,
// because somebody walking through that door with new information is the engine
// of the whole room, and every third week — plus the week before finale night —
// gets the full four acts. Running four acts every week for seven weeks would
// turn the best room in the format into a chore.

import { gs, players } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getBond, getPerceivedBond, addBond } from '../bonds.js';
import { seatedJurors, juryOpensAt, evictionSeatsAJuror } from './jury.js';
import { reconcileBBJury, believedVoters, stableRng, knowsVote } from './knowledge.js';
import { seedJurorReads, moveRead, readOf, stanceOf } from './jury-sentiment.js';

const clamp01 = v => Math.max(0, Math.min(1, v));
const archetypeOf = name => players.find(p => p.name === name)?.archetype || 'floater';
const P = name => { try { return pronouns(name); } catch { return { sub: 'they', obj: 'them', posAdj: 'their', Sub: 'They' }; } };
const pick = (rng, list) => list[Math.floor(rng() * list.length) % list.length];

/** A picker that will not repeat itself inside one scene. See last-words.js. */
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

// Who lobbies. The project's archetype rule, applied to a room where the only
// currency left is other people's votes: villains work it freely, neutrals only
// with the strategy and without the loyalty, nice archetypes never — they argue
// their honest opinion, which is a different thing and has its own beat.
const SCHEMERS = new Set(['villain', 'mastermind', 'schemer']);
const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
function mayLobby(name) {
  const arch = archetypeOf(name);
  if (SCHEMERS.has(arch)) return true;
  if (NICE.has(arch)) return false;
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}

// How much weight one juror's argument carries with another. Trust does most
// of it; being the sort of person who is usually right does the rest.
const AUTHORITY = {
  'perceptive-player': 1.45, mastermind: 1.2, schemer: 1.1, 'loyal-soldier': 1.15,
  hero: 1.1, 'social-butterfly': 1.05, villain: 0.95, 'challenge-beast': 0.95,
  underdog: 0.95, showmancer: 0.9, floater: 0.85, wildcard: 0.8,
  hothead: 0.75, goat: 0.75, 'chaos-agent': 0.7,
};

function credibility(listener, speaker) {
  const trust = getPerceivedBond(listener, speaker) / 10;
  const authority = AUTHORITY[archetypeOf(speaker)] ?? 1;
  const social = pStats(speaker).social / 10;
  // Never zero and never enormous: somebody you dislike can still say something
  // that lands, they just have to work harder for it.
  return clamp01(0.25 + trust * 0.5 + authority * 0.25 + social * 0.2);
}

const beat = (tag, playersIn, text) => ({ tag, players: playersIn.filter(Boolean), text });

// ── the arrival ───────────────────────────────────────────────────────

/**
 * Somebody walks in, and everything they think they know walks in with them.
 *
 * This is the only channel by which the jury learns anything at all — the room
 * has no feeds and no visitors. It is also where a wrong story either gets
 * corrected or hardens into the thing the room believes for the rest of the
 * season, and which of those happens depends on how much the residents rate
 * the person telling it.
 */
function arrivalBeats(newcomer, residents, week, rng, out, lastWords = null) {
  const beats = [];

  const greeter = residents.slice().sort((a, b) => getBond(newcomer, b) - getBond(newcomer, a))[0];
  beats.push(beat('THE DOOR', [newcomer, greeter], greeter
    ? pick(rng, [
      `${newcomer} comes through the door still in eviction clothes, and ${greeter} is up before it shuts. "You're here. Okay. Okay — sit down, tell me everything."`,
      `The lodge goes quiet, then loud. ${greeter} gets to ${newcomer} first and holds on a beat too long. "I'm sorry. I'm so glad it's you."`,
      `${newcomer} drops a bag by the door and stands there. ${greeter} pours a drink without being asked and pushes it across the counter.`,
      `"Well," says ${greeter}, "that makes ${residents.length + 1} of us." ${newcomer} manages about half a laugh.`,
    ])
    : `${newcomer} walks into an empty lodge, first one out here, and listens to how quiet a house is without fifteen people in it.`));

  // What they believe, said out loud to a room that will argue with it.
  const believed = believedVoters(newcomer, newcomer);
  const accusedByBlowup = lastWords?.reveal?.accused;
  const story = accusedByBlowup || believed[0] || null;
  if (story) {
    beats.push(beat('THE STORY', [newcomer, story], lastWords
      ? pick(rng, [
        `${newcomer} has not stopped saying it since the door. "It was ${story}. I said it on my way out and I'll say it in here."`,
        `${newcomer} tells the room the version ${P(newcomer).sub} shouted at the house. ${story}'s name is in every sentence of it.`,
        `"You saw it, right? Tell me you saw it." ${newcomer} is still arguing with a room ${P(newcomer).sub} cannot reach.`,
      ])
      : pick(rng, [
        `${newcomer} works through the count out loud, three times, and lands on ${story} every time.`,
        `"I've had two hours to think about it," ${newcomer} says. "It has to have been ${story}."`,
        `${newcomer} lays the week out on the kitchen table like evidence, and the name at the end of it is ${story}.`,
      ])));

    // The room corrects them, or does not. A resident who actually knows how
    // that vote went can say so — and whether it takes depends on how much the
    // newcomer rates them, which is the same machinery as the door.
    // Somebody who actually knows how that ballot went can settle it. Failing
    // that, somebody close to the accused will argue the other way — which is
    // not knowledge, just loyalty, and lands or does not on that basis.
    const knower = residents.find(r => knowsVote(r, story, newcomer));
    const corrector = knower ? null
      : residents.find(r => !knowsVote(r, story, newcomer) && getBond(r, story) > 2);
    if (knower) {
      const weight = credibility(newcomer, knower);
      moveRead(newcomer, story, { strength: -1.6, credibility: weight, kind: 'confirmed',
        week, text: `${knower} confirmed it: ${story} wrote ${newcomer}'s name.` });
      beats.push(beat('CONFIRMED', [knower, newcomer, story], pick(rng, [
        `${knower} does not enjoy saying it. "You're right. I know you're right, because I know how that vote went."`,
        `"I wasn't going to be the one to tell you," ${knower} says. "But yes. It was ${story}."`,
        `${knower} nods slowly, and the last bit of doubt goes out of ${newcomer}'s face.`,
      ])));
    } else if (corrector) {
      const weight = credibility(newcomer, corrector);
      const moved = moveRead(newcomer, story, { strength: 1.4, credibility: weight, kind: 'corrected',
        week, text: `${corrector} argued ${newcomer} off ${story}.` });
      beats.push(beat('CORRECTED', [corrector, newcomer, story], Math.abs(moved) > 0.35
        ? pick(rng, [
          `${corrector} pushes back hard. "It wasn't ${story}. I'd bet the vote on it — ${P(story).sub} fought for you." ${newcomer} does not want to hear it, and hears it anyway.`,
          `"You've got the wrong person," ${corrector} says, and keeps saying it until ${newcomer} stops arguing.`,
          `${corrector} walks ${newcomer} through the week from the other side of it. By the end ${newcomer} is much less sure.`,
        ])
        : pick(rng, [
          `${corrector} tries. "It wasn't ${story}." ${newcomer} smiles the way you smile at somebody who was not in the room.`,
          `"You weren't there at the end," ${newcomer} says, and that is where the conversation stops.`,
        ])));
    }
  }

  // The blowup follows them in, and the people who were in the room when it
  // happened arrive later carrying their own opinion of it.
  if (lastWords) {
    out.blowupsRelitigated.push({ juror: newcomer, accused: lastWords.reveal.accused, isTrue: lastWords.isTrue });
  }
  return beats;
}

// ── the long week ─────────────────────────────────────────────────────

/**
 * Life in a house where nothing can be done about anything.
 *
 * The jury house is not a strategy room — nobody in it has a move left. What it
 * has is time, resentment, and the person who put you there sitting across the
 * table eating cereal. Every resident gets at least one beat per full
 * interlude, because a juror who never appears is a juror the audience forgets
 * is voting.
 */
function longWeekBeats(residents, week, rng) {
  const beats = [];
  const seen = new Set();
  const draw = drawer(rng);

  // Grudges, hashed out between people who removed each other.
  for (const juror of residents) {
    const enemy = residents.find(other => other !== juror && getBond(juror, other) <= -2 && !seen.has(other));
    if (!enemy || seen.has(juror)) continue;
    seen.add(juror); seen.add(enemy);
    const mended = getBond(juror, enemy) + (rng() - 0.3) * 3 > -1;
    if (mended) addBond(juror, enemy, 1.2);
    beats.push(beat(mended ? 'CLOSURE' : 'GRUDGE', [juror, enemy], mended
      ? draw('closure', [
        `${juror} and ${enemy} end up doing dishes at the same sink and, forty minutes later, are laughing about the week it all went wrong.`,
        `"I hated you in there," ${juror} tells ${enemy}. "Out here you're just a person who did a thing." It is not forgiveness exactly, but it will do.`,
        `${enemy} apologises properly, without qualifying it. ${juror} was not expecting that and has to sit down.`,
      ])
      : draw('grudge', [
        `${juror} and ${enemy} manage a full day in a shared house without addressing a single word to each other.`,
        `${enemy} tries to start something. ${juror} takes ${P(juror).posAdj} plate outside and eats standing up.`,
        `Somebody suggests a game of cards. ${juror} looks at ${enemy} and says ${P(juror).sub} is going for a walk.`,
        `${juror} has worked out the exact route through the lodge that never passes ${enemy}, and walks it about nine times a day.`,
        `${enemy} says good morning. ${juror} says nothing, for long enough that somebody else fills the silence.`,
        `They are both very polite about the washing-up rota, which is somehow worse than shouting.`,
      ])));
  }

  // And the ones with nobody to fight, sitting with it.
  for (const juror of residents) {
    if (seen.has(juror)) continue;
    seen.add(juror);
    beats.push(beat('THE LONG DAYS', [juror], draw('long', [
      `${juror} has watched the same stretch of ceiling for three days and rerun the same conversation about eight hundred times.`,
      `${juror} keeps a running list of what ${P(juror).sub} would have done differently. It is on page two.`,
      `${juror} is sleeping properly for the first time in six weeks and is furious about how good it feels.`,
      `${juror} asks nobody in particular whether it counts as playing the game if you are still thinking about it this hard.`,
      `${juror} has learned to cook one thing extremely well and will not be taking questions about why.`,
      `${juror} still wakes at the hour the house used to get its wake-up call, and lies there remembering there is nowhere to be.`,
      `${juror} has started narrating ${P(juror).posAdj} own afternoons to a camera that is not there.`,
      `Somebody finds ${juror} out on the porch at two in the morning, doing the numbers again.`,
      `${juror} swore ${P(juror).sub} would not care by now. ${P(juror).Sub} cares.`,
    ])));
  }
  return beats;
}

// ── the roundtable ────────────────────────────────────────────────────

/**
 * The centrepiece: the jury argues about the people still playing.
 *
 * A backer and a doubter per remaining houseguest, and — the part that makes it
 * this show rather than Total Drama's — the arguer is chosen by what they
 * BELIEVE, so somebody can passionately defend a finalist for keeping them when
 * that finalist voted them out and they have not found out yet. Everybody
 * listening moves, scaled by how much they rate the person talking and how hard
 * their own read already is.
 */
function roundtable(residents, week, rng) {
  const contenders = (gs.activePlayers || []).slice();
  if (!contenders.length || residents.length < 2) return null;
  const lines = [];
  // Six people argued over in one sitting used the same four sentences, so the
  // same objection landed on three different finalists in the same scene.
  const draw = drawer(rng);
  const backerUse = {}, doubterUse = {};

  for (const player of contenders) {
    const ranked = residents.map(n => ({ n, read: readOf(n, player) }));
    const leastUsed = (pool, use) => pool.slice()
      .sort((a, b) => ((use[a.n] || 0) - (use[b.n] || 0)) || (rng() - 0.5))[0]?.n;
    const positives = ranked.filter(x => x.read >= 0);
    const negatives = ranked.filter(x => x.read < 0);
    const backer = leastUsed(positives.length ? positives : ranked, backerUse);
    const doubter = leastUsed((negatives.length ? negatives : ranked).filter(x => x.n !== backer), doubterUse)
      || residents.find(n => n !== backer);
    if (!backer || !doubter) continue;
    backerUse[backer] = (backerUse[backer] || 0) + 1;
    doubterUse[doubter] = (doubterUse[doubter] || 0) + 1;

    const backText = draw('back', [
      `${backer} makes the case for ${player}. "${P(player).Sub} has been making decisions since week one. Everybody else in there is reacting to ${P(player).obj}."`,
      `"I'll say it," ${backer} says. "${player} is the only person in that house actually playing. The rest are surviving."`,
      `${backer} keeps coming back to ${player}. "${P(player).Sub} looked me in the eye and told me the truth when a lie was easier. That counts."`,
      `${backer} lays out ${player}'s week-by-week. Halfway through, the room realises how much of the season has ${player}'s hands on it.`,
      `"${player} got me out and I'm sitting here arguing for ${P(player).obj}," ${backer} says. "That should tell you something."`,
      `${backer} points out that every single person in this lodge was removed by a plan ${player} was standing in the middle of.`,
      `"Name one week ${player} was not in danger and did something about it," ${backer} says. Nobody manages it quickly.`,
      `${backer} has stopped being angry about it. "${P(player).Sub} beat me. I'd rather lose to somebody who was trying."`,
    ]);
    const doubtText = draw('doubt', [
      `${doubter} is not having it. "${player} has been carried by other people's numbers all season and we're calling it a résumé?"`,
      `"${player} never took a shot ${P(player).sub} could lose," ${doubter} says. "That's not a game, that's a seat."`,
      `${doubter} shakes ${P(doubter).posAdj} head. "Every one of us is out here because somebody made a hard call. ${player} has never made one."`,
      `"You're all describing somebody who was in the room when things happened," ${doubter} says. "That isn't the same as doing them."`,
      `"${player} has been safe for six weeks," ${doubter} says. "Ask yourselves who arranged that, because it was not ${P(player).obj}."`,
      `${doubter} wants a single decision named that cost ${player} anything. The room offers a few. ${P(doubter).Sub} is not impressed by any of them.`,
      `"I liked ${player}," says ${doubter}. "I'm not paying somebody for being pleasant to me on the way to the door."`,
      `${doubter} has heard this speech about ${player} three times now and it gets shorter every week.`,
    ]);

    // Everybody in the room hears both, and moves.
    for (const juror of residents) {
      if (juror !== backer) {
        moveRead(juror, player, { strength: 0.55, credibility: credibility(juror, backer),
          kind: 'roundtable', week, text: `${backer} argued for ${player}.` });
      }
      if (juror !== doubter) {
        moveRead(juror, player, { strength: -0.55, credibility: credibility(juror, doubter),
          kind: 'roundtable', week, text: `${doubter} argued against ${player}.` });
      }
    }
    lines.push({ player, backer, doubter, backText, doubtText,
      stances: Object.fromEntries(residents.map(j => [j, stanceOf(j, player)])) });
  }
  return { contenders, lines };
}

// ── lobbying ──────────────────────────────────────────────────────────

/**
 * Working the room, for the people whose game does not stop at the door.
 *
 * A villain on the jury is still a villain: they cannot win, so they spend the
 * only currency they have left deciding who does. Nice archetypes are absent
 * from this function on purpose — arguing your honest opinion happens at the
 * roundtable, and this is not that.
 */
function lobbyBeats(residents, week, rng) {
  const beats = [];
  for (const lobbyist of residents.filter(mayLobby)) {
    const favourite_ = favourite(lobbyist);
    const against = leastFavourite(lobbyist);
    if (!favourite_ || !against || favourite_ === against) continue;
    // Work on the juror with the least made-up mind — the same instinct that
    // made them good at this inside the house.
    const target = residents.filter(n => n !== lobbyist)
      .sort((a, b) => Math.abs(readOf(a, favourite_)) - Math.abs(readOf(b, favourite_)))[0];
    if (!target) continue;
    const weight = credibility(target, lobbyist);
    moveRead(target, favourite_, { strength: 0.7, credibility: weight, kind: 'lobbying',
      week, text: `${lobbyist} worked on ${target} for ${favourite_}.` });
    moveRead(target, against, { strength: -0.7, credibility: weight, kind: 'lobbying',
      week, text: `${lobbyist} worked on ${target} against ${against}.` });
    beats.push(beat('WORKING THE ROOM', [lobbyist, target], pick(rng, [
      `${lobbyist} gets ${target} alone by the fire and spends an hour explaining, gently, why ${favourite_} deserves this and ${against} does not.`,
      `${lobbyist} has stopped pretending to be neutral. Every conversation with ${target} ends up at ${favourite_}'s name.`,
      `"I'm not telling you how to vote," ${lobbyist} tells ${target}, before telling ${target} how to vote.`,
      `${lobbyist} cannot win any more, so ${P(lobbyist).sub} has picked a winner instead — and ${target} is the vote ${P(lobbyist).sub} needs.`,
    ])));
  }
  return beats;
}

const favourite = juror => (gs.activePlayers || []).slice()
  .sort((a, b) => readOf(juror, b) - readOf(juror, a))[0];
const leastFavourite = juror => (gs.activePlayers || []).slice()
  .sort((a, b) => readOf(juror, a) - readOf(juror, b))[0];

// ── the interlude ─────────────────────────────────────────────────────

/**
 * A week in the jury house.
 *
 * Every week once the jury is open: the arrival. Every third week, and always
 * the week before finale night: the full four acts, with the roundtable.
 *
 * @returns {object|null} the record, attached to the week as an act
 */
export function generateBBJuryHouse(week, rngIn) {
  const num = week?.num || 0;
  // The week being played is not on the ledger yet — it is appended after
  // maintenance — so seatedJurors() cannot see tonight's evictee, and the
  // person whose arrival this whole act is about was missing from their own
  // scene. Every arrival-only interlude of a season silently produced nothing
  // and only the weeks that happened to be full ever appeared.
  const seated = seatedJurors({ upToWeek: num });
  const seatsTonight = week?.evicted && !week.evictionReversed
    && evictionSeatsAJuror((week.houseAtStart || []).length);
  const residents = seated.includes(week?.evicted) || !seatsTonight
    ? seated : [...seated, week.evicted];
  if (residents.length < 1 || !juryOpensAt()) return null;
  const rng = rngIn || stableRng('juryhouse', num, residents.length);

  // Everybody out there has a read, whether or not they blew up on the way.
  for (const juror of residents) seedJurorReads(juror, num);

  const newcomer = week?.evicted && residents.includes(week.evicted) ? week.evicted : null;
  const remaining = (gs.activePlayers || []).length;
  // Full-size when the room has had time to change, and always on the last
  // night before the finale — the roundtable is the jury's closing argument to
  // itself and it must never be the one that gets skipped.
  const full = residents.length >= 2 && (residents.length % 3 === 0 || remaining <= 4);

  const out = { blowupsRelitigated: [] };
  const acts = [];
  // Where the room stood before tonight, so the screen can show the board
  // moving instead of only where it ended up. Without this the reads panel
  // would be a spoiler: the final numbers sitting there while the audience is
  // still on the first card of the argument that produced them.
  const snapshot = () => Object.fromEntries(residents.map(j => [j,
    Object.fromEntries((gs.activePlayers || []).map(p => [p, Number(readOf(j, p).toFixed(2))]))]));
  const readsBefore = snapshot();

  const arrivals = newcomer
    ? arrivalBeats(newcomer, residents.filter(n => n !== newcomer), num, rng, out,
      week.lastWords || null)
    : [];
  if (arrivals.length) acts.push({ title: 'The Door Opens', beats: arrivals });

  // What the room passes between itself, whether or not tonight is a big one.
  try {
    reconcileBBJury(residents, { week: num, rng: stableRng('reconcile', num, residents.join()) });
  } catch { /* nothing moves */ }

  if (full) {
    const others = residents.filter(n => n !== newcomer);
    const long = longWeekBeats(others.length ? others : residents, num, rng);
    if (long.length) acts.push({ title: 'The Long Week', beats: long });

    const table = roundtable(residents, num, rng);
    if (table) acts.push({ title: 'The Roundtable', beats: [], roundtable: table });

    const lobby = lobbyBeats(residents, num, rng);
    const closing = [...lobby];
    const speaker = residents[Math.floor(rng() * residents.length) % residents.length];
    closing.push(beat('BEFORE FINALE NIGHT', [speaker], pick(rng, [
      `${speaker} says what the room has been circling all week: "Whatever we decide out here — that's the last power any of us has. I'm not wasting mine."`,
      `Somebody counts the chairs and works out how many more are coming. Nobody likes the answer.`,
      `${speaker} starts a sentence with "when we vote" and the whole room hears the change in tense.`,
      `The lodge stays up late. For the first time, they are talking about the end as something close rather than something theoretical.`,
    ])));
    acts.push({ title: 'Before Finale Night', beats: closing });
  }

  if (!acts.length) return null;

  const record = {
    type: 'jury-house', week: num, full, residents: [...residents], newcomer,
    acts, roundtable: acts.find(a => a.roundtable)?.roundtable || null,
    blowupsRelitigated: out.blowupsRelitigated,
    readsBefore, reads: snapshot(),
    socialBeats: [],
  };
  week.juryHouse = record;
  week.acts ||= [];
  week.acts.push(record);
  return record;
}

/**
 * The jury house, for both transcripts.
 *
 * Same reason juryLines lives in jury.js: two copies of this would eventually
 * disagree about what the jury believes, and half the readers only ever see one
 * of the two transcripts.
 */
export function juryHouseLines(record, line) {
  if (!record) return;
  line('');
  line(record.full ? 'THE JURY HOUSE' : 'THE JURY HOUSE — ARRIVAL');
  line(`  Out there: ${record.residents.join(', ')}.`);
  for (const act of record.acts || []) {
    line('');
    line(`  ${act.title.toUpperCase()}`);
    for (const b of act.beats || []) line(`    · ${b.text}`);
    if (act.roundtable) {
      for (const l of act.roundtable.lines || []) {
        line(`    ${l.player}:`);
        line(`      + ${l.backText}`);
        line(`      - ${l.doubtText}`);
      }
    }
  }
}
