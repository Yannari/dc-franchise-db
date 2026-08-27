// Camp events about BEING a coach — not about the sessions.
//
// Thirteen coach event types existed and twelve of them were the training
// ledger wearing different hats: who got a session, who did not, and two
// coaches trading protégés. Nothing was about the thing that actually makes a
// coach strange to live with — that they are a famous former winner sharing a
// beach with people who watched them on television, that they hold no ballot,
// that they are playing for a merge nobody else is playing for, and that the
// card in their pocket changes how the room looks at them.
//
// `aweOf` was computed in exactly two places and produced no event at all: a
// five-star winner walked into camp and nobody on screen ever reacted.
import { gs, players } from './core.js';
import { pStats, pronouns } from './players.js';
import { addBond } from './bonds.js';
import { coachesOf, coachRecord } from './coaches.js';
import { aweOf } from './coach-agenda.js';

const arch = name => players.find(p => p.name === name)?.archetype;
const pop = (name, d) => { if (!gs.popularity) gs.popularity = {}; gs.popularity[name] = (gs.popularity[name] || 0) + d; };
const pickFrom = (arr, roll) => arr[Math.floor(roll() * arr.length)];

/** How far above this contestant the coach's career sits, in their eyes. */
function aweBetween(coachName, contestant) {
  const rec = coachRecord(coachName);
  const st = pStats(contestant);
  if (!rec || !st) return 0;
  return aweOf({ gap: rec.stars ?? 4.5, stats: st, archetype: arch(contestant) });
}

/**
 * One status beat per tribe per episode, chosen proportionally.
 *
 * Every candidate scores its own weight from live state — how starstruck the
 * room is, whether the card is still live, how long the coach has been here —
 * and one fires. A flat rotation would print the same beat every week.
 */
export function coachStatusEvents(ep, tribe, roll = Math.random) {
  const events = [];
  const tribeName = tribe?.name ?? tribe?.tribeName;
  if (!tribeName) return events;
  const coaches = coachesOf(tribeName);
  if (!coaches.length) return events;
  const members = (tribe.members || []).filter(Boolean);
  if (members.length < 2) return events;

  const coach = pickFrom(coaches, roll);
  const rec = coachRecord(coach.name);
  const cStats = pStats(coach.name);
  const cp = pronouns(coach.name);
  const epNum = Number(ep?.num || gs.episode || 0);
  const trained = Object.keys(gs.coachTraining?.[coach.name] || {});
  const has = v => (cp.sub === 'they' ? v[0] : v[1]);

  const byAwe = members.slice().sort((a, b) => aweBetween(coach.name, b) - aweBetween(coach.name, a));
  const mostAwed = byAwe[0];
  const leastAwed = byAwe[byAwe.length - 1];
  const aweHigh = aweBetween(coach.name, mostAwed);
  const aweLow = aweBetween(coach.name, leastAwed);
  const cardLive = rec?.saveCard === 'unused';
  const bold = members.slice().sort((a, b) => pStats(b).boldness - pStats(a).boldness)[0];
  const cautious = members.slice().sort((a, b) => pStats(a).boldness - pStats(b).boldness)[0];
  const held = (gs.advantages || []).filter(a => a.holder === coach.name).length;

  const candidates = [];
  const add = (weight, build) => { if (weight > 0) candidates.push({ weight, build }); };

  // ── FAME ──────────────────────────────────────────────────────────────
  add(aweHigh * 2.2, () => {
    const p = pronouns(mostAwed);
    addBond(coach.name, mostAwed, 0.5);
    pop(coach.name, 1);
    return { type: 'coachStarstruck', players: [mostAwed, coach.name],
      badgeText: 'STARSTRUCK', badgeClass: 'gold',
      text: pickFrom([
        `${mostAwed} still cannot quite talk to ${coach.name} like a person. ${p.Sub} ${p.sub === 'they' ? 'have' : 'has'} watched ${coach.name} do this on television, and it shows in every sentence.`,
        `${coach.name} says something ordinary about the weather and ${mostAwed} treats it like strategy. ${cp.Sub} ${has(['notice', 'notices'])}, and ${has(['do', 'does'])} not correct ${p.obj}.`,
        `${mostAwed} admits to the camera that having ${coach.name} at camp is the strangest part of this so far. "I know how ${cp.posAdj} season ended. I watched it."`,
        `${mostAwed} keeps finding reasons to be wherever ${coach.name} is. Nobody at camp has failed to notice which way that runs.`,
      ], roll) };
  });

  add(Math.max(0, -aweLow) * 2.0, () => {
    const p = pronouns(leastAwed);
    addBond(coach.name, leastAwed, -0.6);
    pop(leastAwed, 1);
    return { type: 'coachUnimpressed', players: [leastAwed, coach.name],
      badgeText: 'NOT IMPRESSED', badgeClass: 'red',
      text: pickFrom([
        `${leastAwed} makes a point of calling ${coach.name} by ${cp.posAdj} first name in front of everyone, flatly, the way you would address anybody else. It is not an accident.`,
        `"${cp.Sub} lost." ${leastAwed} says it once, quietly, and lets it do the work. Half the tribe hears it and nobody argues.`,
        `${leastAwed} refuses to treat ${coach.name} as anything but another person on the beach, and is loud about refusing.`,
        `${p.Sub} ${p.sub === 'they' ? 'are' : 'is'} not interested in ${coach.name}'s record. ${leastAwed} says the game is what happens here, and here nobody has won anything yet.`,
      ], roll) };
  });

  add((rec?.stars ?? 0) * 0.5 * (cStats.social / 10), () => {
    const worked = roll() < cStats.social / 12;
    const pool = members.filter(m => m !== mostAwed);
    const other = pickFrom(pool.length ? pool : members, roll);
    addBond(coach.name, other, worked ? 0.4 : -0.5);
    pop(coach.name, worked ? 1 : -1);
    return { type: 'coachPullsRank', players: [coach.name, other],
      badgeText: worked ? 'RANK PULLED' : 'RANK PULLED, BADLY', badgeClass: worked ? 'gold' : 'red',
      text: worked
        ? pickFrom([
          `${coach.name} settles an argument with ${other} by pointing out how far ${cp.sub} got playing it the other way. It works, and everybody hears it work.`,
          `"I have sat where you are sitting." ${coach.name} does not need to say more than that to ${other}, and does not.`,
          `${coach.name} reaches for the record in front of ${other} and it lands. The room recalibrates a little.`,
          `${other} pushes back at ${coach.name} once, gets reminded who ${cp.sub} is talking to, and does not push twice.`,
        ], roll)
        : pickFrom([
          `${coach.name} reaches for the record in front of ${other}, and ${other} points out that a record is a list of games that already ended.`,
          `"You keep telling us what you did." ${other} does not raise ${pronouns(other).posAdj} voice at ${coach.name}, which somehow makes it worse.`,
          `${coach.name} pulls rank on ${other} and watches it not work. Two people are now looking at ${cp.obj} differently.`,
          `The record comes out and lands on nothing. ${other} waits politely for ${coach.name} to finish, then carries on as before.`,
        ], roll) };
  });

  add(epNum >= 4 ? aweHigh * 1.4 : 0, () => {
    addBond(coach.name, mostAwed, -0.3);
    return { type: 'coachShineWearsOff', players: [mostAwed, coach.name],
      badgeText: 'THE SHINE COMES OFF', badgeClass: 'yellow',
      text: pickFrom([
        `${mostAwed} has been at camp long enough now to see ${coach.name} tired, hungry and wrong about the fire. The television version is gone.`,
        `Somewhere in the last week ${mostAwed} stopped being impressed by ${coach.name} and started measuring ${cp.obj}. It is a quieter feeling and a more dangerous one.`,
        `${coach.name} is still the most decorated person here. ${mostAwed} has simply stopped finding that interesting.`,
        `"${cp.Sub} ${has(['get', 'gets'])} things wrong too." ${mostAwed} sounds almost disappointed saying it about ${coach.name}.`,
      ], roll) };
  });

  // ── NO BALLOT ─────────────────────────────────────────────────────────
  add(2.2, () => {
    const reader = members.slice().sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
    addBond(coach.name, reader, -0.4);
    return { type: 'coachNoBallotWeightless', players: [reader, coach.name],
      badgeText: 'NO VOTE TO BREAK', badgeClass: 'red',
      text: pickFrom([
        `${reader} works it out and says it out loud: ${coach.name} can promise anybody anything, because ${cp.sub} ${has(['do', 'does'])} not have a vote to break.`,
        `"${cp.Sub} cannot vote." ${reader} lets that sit with the others. "So what exactly is ${cp.posAdj} word worth?"`,
        `${reader} points out that every deal ${coach.name} makes costs ${cp.obj} nothing, and watches the tribe re-price everything ${cp.sub} ${has(['have', 'has'])} said.`,
        `${coach.name} gives ${cp.posAdj} word to ${reader}, who thanks ${cp.obj} politely and does not believe a syllable of it.`,
      ], roll) };
  });

  add(1.8, () => {
    const target = pickFrom(members, roll);
    addBond(coach.name, target, roll() < 0.5 ? 0.5 : -0.5);
    pop(coach.name, 1);
    return { type: 'coachSaysTheUnsayable', players: [coach.name, target],
      badgeText: 'NO BALLOT, NO FILTER', badgeClass: 'gold',
      text: pickFrom([
        `${coach.name} says the thing about ${target} that everybody has been carefully not saying. ${cp.Sub} ${has(['have', 'has'])} no vote to protect, and it shows.`,
        `A player would never risk this. ${coach.name} tells ${target} exactly what the tribe thinks of ${pronouns(target).posAdj} game, because there is no ballot to lose over it.`,
        `${coach.name} is the only person at this camp who can afford to be honest, and uses it on ${target} in front of everyone.`,
        `"I can say this because I do not vote." ${coach.name} then says it, and ${target} has to stand there for all of it.`,
      ], roll) };
  });

  // ── THE CARD IN THE ROOM ──────────────────────────────────────────────
  add(cardLive ? 2.6 : 0, () => {
    addBond(coach.name, cautious, 0.3);
    return { type: 'coachCardFlinch', players: [cautious, coach.name],
      badgeText: 'NOBODY WANTS A WASTED NIGHT', badgeClass: 'yellow',
      text: pickFrom([
        `${cautious} talks the others out of going at ${coach.name} this week. The card is still out there, and a wasted tribal is a lost tribal.`,
        `The name ${coach.name} comes up and dies in the same breath. ${cautious} says what everyone is thinking: not while ${cp.sub} can still be saved.`,
        `"We take that shot and it bounces." ${cautious} would rather spend the vote on somebody who cannot survive it.`,
        `Nobody says they are frightened of ${coach.name}. They just keep finding other names, and ${cautious} keeps supplying them.`,
      ], roll) };
  });

  add(cardLive ? pStats(bold).boldness * 0.24 : 0, () => {
    addBond(coach.name, bold, -0.7);
    pop(bold, 2);
    return { type: 'coachCardFlush', players: [bold, coach.name],
      badgeText: 'BURN IT', badgeClass: 'red',
      text: pickFrom([
        `${bold} argues for going at ${coach.name} precisely because of the card. Burn it now, and the next shot is clean.`,
        `"Somebody has to make ${cp.obj} use it." ${bold} volunteers the tribe for the job.`,
        `${bold} is tired of the card deciding what this tribe is allowed to do, and says so where ${coach.name} can hear it.`,
        `The safe play is to leave ${coach.name} alone. ${bold} points out that the safe play is how the card wins without ever being played.`,
      ], roll) };
  });

  // ── THE COACH'S OWN GAME ──────────────────────────────────────────────
  add(held ? 2.4 : 0, () => {
    const fav = trained.length ? pickFrom(trained, roll) : pickFrom(members, roll);
    return { type: 'coachIdleAdvantage', players: [coach.name, fav],
      badgeText: 'HELD, NOT PLAYABLE', badgeClass: 'gold',
      text: pickFrom([
        `${coach.name} has something ${cp.sub} cannot use on ${cp.ref} and cannot bring ${cp.ref} to give away yet. It sits there being useless and valuable at once.`,
        `The advantage in ${cp.posAdj} pocket only works in somebody else's hands. ${coach.name} spends the evening deciding whether ${fav} is that somebody.`,
        `${coach.name} turns the thing over and puts it back. Handing it to ${fav} means never seeing it again, and ${cp.sub} ${has(['are','is'])} not sure ${fav} has earned that yet.`,
        `Everything ${coach.name} has found is worth more to ${fav} than to ${cp.obj}, and that is the whole problem with being a coach.`,
      ], roll) };
  });

  add(2.0, () => {
    const conf = pickFrom(members, roll);
    return { type: 'coachPlayingForTheMerge', players: [coach.name, conf],
      badgeText: 'PLAYING FOR THE MERGE', badgeClass: 'gold',
      text: pickFrom([
        `Nobody else here is playing for the merge. ${coach.name} is playing for nothing else — get there, and ${cp.sub} ${has(['stop', 'stops'])} being staff and ${has(['start', 'starts'])} being a player.`,
        `${coach.name} admits it to ${conf}: every session, every conversation, all of it is about surviving long enough to be allowed to compete.`,
        `"${conf}, you are playing to win. I am playing to be let in." ${coach.name} does not sound bitter about it. ${cp.Sub} ${has(['sound', 'sounds'])} patient, which is worse.`,
        `The merge is a finish line for ${coach.name} and a checkpoint for everyone else. ${cp.Sub} ${cp.sub === 'they' ? 'are' : 'is'} the only one counting days toward it.`,
      ], roll) };
  });

  add(1.6, () => {
    const historian = members.slice().sort((a, b) => pStats(b).mental - pStats(a).mental)[0];
    addBond(coach.name, historian, -0.35);
    return { type: 'coachOwnSeason', players: [historian, coach.name],
      badgeText: 'THEY KNOW HOW IT ENDED', badgeClass: 'yellow',
      text: pickFrom([
        `${historian} knows exactly how ${coach.name}'s season went, and brings up the part ${cp.sub} would rather nobody remembered.`,
        `"You did this before." ${historian} describes ${coach.name}'s own game back to ${cp.obj}, accurately, in front of people.`,
        `${coach.name} has a record, and ${historian} has been studying it. That is a weapon nobody else at this camp is carrying.`,
        `${historian} points out that ${coach.name} has lost exactly this way before. ${cp.Sub} ${has(['do', 'does'])} not enjoy hearing it and cannot say it is untrue.`,
      ], roll) };
  });

  if (!candidates.length) return events;
  const total = candidates.reduce((s, c) => s + c.weight, 0);
  let pin = roll() * total;
  for (const c of candidates) {
    pin -= c.weight;
    if (pin <= 0) { events.push(c.build()); break; }
  }
  return events;
}
