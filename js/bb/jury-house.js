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
// 'is' or 'are' for whoever the pronoun is ('They is not impressed' was printed)
const IS = name => (P(name).sub === 'they' ? 'are' : 'is');
const COUNT_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
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
  // What happened to them, as the house saw it: who held the key, and the count (both said out
  // loud on eviction night). The user, 2026-10-07: "the dialogue is really boring, not deep."
  const wk = (gs.bb?.weeks || []).find(w => w.num === week) || out.weekObj || null;
  const hohOf = wk?.hoh && wk.hoh !== newcomer ? wk.hoh : null;
  const ev = (wk?.acts || []).find(x => x?.type === 'eviction');
  const ballots = [...new Map((ev?.ballots || []).filter(b => b?.voter && b.evict).map(b => [b.voter, b])).values()];
  const against = ballots.filter(b => b.evict === newcomer).length;
  const tie = ballots.length && against * 2 === ballots.length;
  const count = tie ? `It was a tie${wk?.hoh ? `, and ${wk.hoh} broke it` : ''}` : ballots.length && against < ballots.length ? `${Cap(NUM(against))} to ${NUM(ballots.length - against)}` : ballots.length ? 'Every single vote went against me' : null;
  if (greeter) {
    beats.push(beat('THE DOOR', [greeter, newcomer], pick(rng, [
      `${greeter} is at the door before it shuts. "You're here. Come in, sit down. What happened?"`,
      `${greeter} gets to ${newcomer} first and hugs ${P(newcomer).obj} for a long time. "I'm so sorry. Sit down and tell me everything."`,
      `${greeter} pours ${newcomer} a drink without asking. "Okay. From the start. What happened in there?"`,
    ])));
    beats.push(beat('THE NEWS', [newcomer, hohOf].filter(Boolean), hohOf
      ? pick(rng, [
        `${newcomer} sits down heavily. "${hohOf} won HOH and put me up.${count ? ` ${count}. It wasn't even close.` : ''}"`,
        `"${hohOf} had the key," ${newcomer} says. "${hohOf} put me on the block, and the house went along with it.${count ? ` ${count}.` : ''}"`,
      ])
      : `"I don't even know where to start," ${newcomer} says. "${count ? `${count}. ` : ''}I thought I had the numbers."`));
  } else {
    beats.push(beat('THE DOOR', [newcomer], `${newcomer} walks into an empty lodge, the first juror, and stands in the quiet for a long time. Nobody here to tell what happened. Nobody to ask.`));
    beats.push(beat('THE NEWS', [newcomer], `${newcomer} talks to the empty room anyway. "${hohOf ? `${hohOf} put me up.` : 'I went up.'}${count ? ` ${count}.` : ''} And I didn't see it coming."`));
  }

  // What they believe, said out loud to a room that will argue with it.
  const believed = believedVoters(newcomer, newcomer);
  const accusedByBlowup = lastWords?.reveal?.accused;
  const story = accusedByBlowup || believed[0] || null;
  if (story) {
    const why = story === hohOf ? `${story} had the key and used it on me.` : `${story} told me I had ${P(story).posAdj} vote. I didn't.`;
    beats.push(beat('THE STORY', [newcomer, story], lastWords
      ? pick(rng, [
        `${newcomer} has not stopped saying it since the door. "It was ${story}. ${why} I said it on my way out and I'll say it in here."`,
        `"You saw what I said on my way out?" ${newcomer} asks. "I meant it. It was ${story}. ${why}"`,
      ])
      : greeter ? pick(rng, [
        `${greeter} asks the question everybody asks. "Who got you?" ${newcomer} doesn't hesitate. "${story}. ${why}"`,
        `"Who do you think flipped?" ${greeter} asks. "${story}," ${newcomer} says. "${why} I've gone over it a hundred times."`,
      ]) : `"It was ${story}," ${newcomer} says to nobody. "${why}"`));

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
          `${corrector} tries. "It wasn't ${story}. ${story} was on your side." ${newcomer} shakes ${P(newcomer).posAdj} head. "You weren't there at the end. I was."`,
          `"I don't think it was ${story}," ${corrector} says. ${newcomer} isn't having it. "Then who? Because I know what ${story} told me, and I know how I left."`,
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
        `${juror} and ${enemy} end up washing dishes side by side. "I was so angry with you in there," ${juror} says. "Out here it's hard to stay angry. You were playing, same as me."`,
        `${enemy} finds ${juror} on the porch. "I'm sorry. Properly sorry. Not for the vote, for how I did it." ${juror} looks at ${enemy} for a long time. "Okay. Thank you."`,
        `"Can we just talk about it?" ${enemy} asks. ${juror} sighs. "Fine. You put me in a bad spot, and I took it personally. I don't think I will out here."`,
      ])
      : draw('grudge', [
        `${enemy} has tried all week to get a word out of ${juror}. At dinner, one more try. "Can you pass the salt?" ${juror} passes it without looking up.`,
        `${enemy} tries to start a conversation. "I'm not ready," ${juror} says. "You sent me here. Give me a few more days before you want to be friends."`,
        `${juror} leaves the room every time ${enemy} walks in. "It's not about the game," ${juror} tells the others. "It's about how ${enemy} lied to my face."`,
        `"You could at least look at me," ${enemy} says. "I could," ${juror} says, "but I'd rather not. You know what you did."`,
      ])));
  }

  // And the ones with nobody to fight, sitting with it.
  for (const juror of residents) {
    if (seen.has(juror)) continue;
    seen.add(juror);
    beats.push(beat('THE LONG DAYS', [juror], draw('long2', [
      `${juror} keeps replaying the week ${P(juror).sub} went home. "I keep thinking, if I'd talked to one more person, I'd still be in there."`,
      `${juror} sits by the fire with the others. "The worst part isn't losing. It's not knowing what's happening in there right now."`,
      `"I miss it," ${juror} admits at dinner. "Even the bad days. Out here there's nothing to do but think about what I got wrong."`,
      `${juror} is up early again, out on the porch. "I still wake up waiting for the house alarm," ${P(juror).sub} says. "Then I remember I'm done."`,
      `${juror} has been quiet all evening. "I've stopped being angry. Now I'm just trying to work out who actually deserves to win. It's harder than I thought."`,
      `${juror} reads the same page of a book for an hour. "I can't concentrate. All I can think about is who's going to be sitting in those two chairs."`,
        ])));
  }
  return beats;
}

// ── the roundtable ────────────────────────────────────────────────────

// What the room can argue from about somebody still playing (the user, 2026-10-07: "the dialogue
// is really boring, not deep"). Only what a juror could know: competition wins, nominations, whose
// HOH week sent whom out of the door (all of it said out loud on the show), and, for the ballots
// that are secret, what each juror BELIEVES (believedVoters), which can be wrong.
const NUM = n => COUNT_WORDS[n] || String(n);
const Cap = t => String(t).charAt(0).toUpperCase() + String(t).slice(1);
function resumeOf(player, residents) {
  const st = gs.bb?.stats?.[player] || {};
  const weeks = gs.bb?.weeks || [];
  const hoh = st.hohWins || 0, veto = st.vetoWins || 0, bb = st.blockBusterWins || 0;
  const wins = hoh + veto + bb;
  const noms = st.timesNominated || 0;
  // jurors at this table who left on this player's Head of Household week
  const sentHome = residents.filter(j => weeks.some(w => w.hoh === player && w.evicted === j));
  // jurors who believe this player wrote their name
  const blamedBy = residents.filter(j => { try { return believedVoters(j, j).includes(player); } catch { return false; } });
  const winList = [hoh && `${NUM(hoh)} HOH${hoh > 1 ? 's' : ''}`, veto && `${NUM(veto)} veto${veto > 1 ? 'es' : ''}`, bb && `${NUM(bb)} Block Buster${bb > 1 ? 's' : ''}`].filter(Boolean);
  const say = winList.length > 1 ? `${winList.slice(0, -1).join(', ')} and ${winList.at(-1)}` : winList[0] || '';
  return { hoh, veto, bb, wins, noms, sentHome, blamedBy, winSay: say, weeks: weeks.length };
}

/**
 * One finalist argued over, as a conversation: the case for, from the strongest thing on the
 * record; the case against, from the doubter's own reason; the answer to it; whoever left on
 * that player's week saying so; and a third juror saying where they stand.
 */
function tableTalk(player, backer, doubter, residents, draw) {
  const r = resumeOf(player, residents);
  const pp = P(player);
  const out = [];
  const sayBy = (by, t) => out.push({ by, t });
  // the case for
  const victim0 = r.sentHome.find(j => j !== backer);
  const victim = r.wins >= 2 ? null : victim0;
  if (r.wins >= 2) sayBy(backer, draw('for-wins', [
    `${player} has won ${r.winSay}. When ${player} needed a win, ${pp.sub} went and got one. That's how you get to the end.`,
    `Look at the record: ${r.winSay}. Nobody else left in that house comes close.`,
    `${player} has won ${r.winSay}. Every time the house came for ${pp.obj}, ${pp.sub} won ${pp.posAdj} way out of it.`,
  ]));
  else if (victim) sayBy(backer, draw('for-move', [
    `${player} was HOH the week ${victim} went home. That was ${player}'s plan, and it worked. That's a real move.`,
    `${player} took out ${victim}. ${player} had the key, picked the target, and got it done. That's playing.`,
  ]));
  else if (r.noms === 0) sayBy(backer, draw('for-safe', [
    `${player} has never been on the block. Not once. You don't get that lucky in this house. That's social game.`,
    `Name one week anyone wanted ${player} gone badly enough to nominate ${pp.obj}. You can't. That's a skill.`,
  ]));
  else if (r.noms >= 2) sayBy(backer, draw('for-survive', [
    `${player} has been on the block ${r.noms === 2 ? 'twice' : `${NUM(r.noms)} times`} and is still in that house. Every time, ${pp.sub} found the votes to stay.`,
    `${Cap(NUM(r.noms))} nominations. ${Cap(NUM(r.noms))}! And ${player} is still there, and we're all here. Think about that.`,
  ]));
  else sayBy(backer, draw('for-social', [
    `${player} is the one person in that house nobody here has a bad word for. That's how you win a jury.`,
    `${player} talked to every single one of us like a person, not a vote. I noticed. I think we all did.`,
  ]));
  // whoever left on that player's week has something to say about it
  if (victim && victim !== doubter) sayBy(victim, draw('victim', [
    `I'm sitting right here, you know.`,
    `It worked on me. I can't really argue with that, much as I'd like to.`,
    `I was there for that week. Believe me, I remember it.`,
  ]));
  // the case against, from the doubter's own reason
  let reason;
  if (r.sentHome.includes(doubter)) {
    reason = 'sent';
    sayBy(doubter, draw('against-sent', [
      `${player} put me on the block and sent me home. I'll be honest, I'm not the most neutral person to ask about ${player}.`,
      `It was ${player}'s HOH that got me out. So no, I'm not jumping to hand ${pp.obj} the money.`,
    ]));
  } else if (r.blamedBy.includes(doubter)) {
    reason = 'voted';
    sayBy(doubter, draw('against-voted', [
      `${player} voted me out. I know it. I'm not going to pretend that doesn't matter to me.`,
      `I'm pretty sure ${player} wrote my name. You'll forgive me if I don't stand up and clap.`,
    ]));
  } else if (r.wins === 0) {
    reason = 'nowins';
    sayBy(doubter, draw('against-nowins', [
      `${player} hasn't won a single competition. Not one. Somebody else has been doing the heavy lifting.`,
      `Zero wins. If ${player} is in the final, it's because other people kept ${pp.obj} there.`,
    ]));
  } else if (r.noms === 0 && r.wins >= 2) {
    reason = 'safewins';
    sayBy(doubter, draw('against-safewins', [
      `Winning HOH is easy when nobody's coming for you. ${player} was never on the block. I want to know what ${pp.sub} did with all that power.`,
      `${player} won when it was safe to win. Never nominated, never fighting for ${pp.posAdj} life. That's a different game from the one we played.`,
    ]));
  } else if (r.noms === 0) {
    reason = 'floated';
    sayBy(doubter, draw('against-floated', [
      `Never on the block means nobody ever thought ${player} was a threat. Why would I reward that?`,
      `${player} was never nominated because ${player} was never in anybody's way. That's not a strategy. That's a hiding place.`,
    ]));
  } else {
    reason = 'nomove';
    sayBy(doubter, draw('against-nomove', [
      `I like ${player}. I do. I just can't name one big move ${player} made on ${pp.posAdj} own.`,
      `What did ${player} actually decide? Not survive. Decide. I'm still waiting for an answer.`,
    ]));
  }
  // the answer to it
  sayBy(backer, draw(`rebut-${reason}`, {
    sent: [`That's fair. But it's the game. You'd have done exactly the same with the key.`, `You're bitter, and you're allowed to be. It was still a good move.`],
    voted: [`That's the game. Everybody here voted somebody out. You can't hold that against ${pp.obj} at the end.`, `If voting somebody out rules you out, nobody in that house gets a vote from you.`],
    nowins: [`Competitions aren't everything. ${player} is still in that house and we're sitting in a lodge.`, `Winning comps makes you a target. Not winning them and still being there is the harder thing.`],
    safewins: [`Using power without making enemies is the hardest thing in that house. ${player} did it.`, `Nobody came for ${pp.obj} because ${pp.sub} kept winning. That's the point.`],
    floated: [`Staying off the block for that long is a strategy. It's just a quiet one.`, `Being in nobody's way is how you get to the end. And ${pp.sub}'s nearly there.`],
    nomove: [`Then name somebody in that house who made more.`, `Not every game is loud. Some of the best ones aren't.`],
  }[reason]));
  return out;
}

/** Where one juror stands on a player, said in their own words to the table. */
function standLine(juror, player, draw) {
  const read = readOf(juror, player);
  if (read > 0.6) return draw('stand-yes', [
    `For what it's worth, if ${player} is sitting at the end, ${player} has my vote.`,
    `I'm with that. ${player} has my vote unless something changes.`,
  ]);
  if (read < -0.6) return draw('stand-no', [
    `${player} would have to give the speech of a lifetime to get my vote.`,
    `I'm sorry, but ${player} isn't getting my vote. I've made my mind up.`,
  ]);
  return draw('stand-maybe', [
    `I honestly don't know about ${player} yet. I want to hear what ${P(player).sub} says at the end.`,
    `I can see both sides of that. Ask me after the final speeches.`,
  ]);
}

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
function roundtable(residents, week, rng, weight = 0.55, only = null) {
  const contenders = (only && only.length ? only : gs.activePlayers || []).slice();
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
      `${doubter} wants a single decision named that cost ${player} anything. The room offers a few. ${P(doubter).Sub} ${IS(doubter)} not impressed by any of them.`,
      `"I liked ${player}," says ${doubter}. "I'm not paying somebody for being pleasant to me on the way to the door."`,
      `${doubter} has heard this speech about ${player} three times now and it gets shorter every week.`,
    ]);

    // Everybody in the room hears both, and moves.
    for (const juror of residents) {
      if (juror !== backer) {
        moveRead(juror, player, { strength: weight, credibility: credibility(juror, backer),
          kind: 'roundtable', week, text: `${backer} argued for ${player}.` });
      }
      if (juror !== doubter) {
        moveRead(juror, player, { strength: -weight, credibility: credibility(juror, doubter),
          kind: 'roundtable', week, text: `${doubter} argued against ${player}.` });
      }
    }
    // the conversation itself (tableTalk): the case for, the case against, the answer, the juror
    // who left on that player's week, and a third juror's verdict on the room
    const talk = tableTalk(player, backer, doubter, residents, draw);
    const third = residents.filter(n => n !== backer && n !== doubter && !talk.some(t => t.by === n))
      .sort((a, b) => Math.abs(readOf(b, player)) - Math.abs(readOf(a, player)))[0];
    lines.push({ player, backer, doubter, backText, doubtText, talk, third,
      thirdText: third ? standLine(third, player, draw) : null,
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
      `${lobbyist} sits down next to ${target} by the fire. "I'm not telling you how to vote. I'm just saying ${favourite_} played a real game, and ${against} let everybody else play it for ${P(against).obj}."`,
      `${lobbyist} catches ${target} in the kitchen. "If it's ${favourite_} and ${against} at the end, you know who earned it. It isn't ${against}."`,
      `${lobbyist} brings it up again on the porch. "Think about who actually made the moves that sent us all here. That's ${favourite_}. Not ${against}."`,
      `${lobbyist} has picked a winner, and ${target} is the vote ${P(lobbyist).sub} needs. "${against} is nice," ${lobbyist} says. "Nice doesn't win this game. ${favourite_} does."`,
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

  const out = { blowupsRelitigated: [], weekObj: week };
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

  // The roundtable is the room's real business, so it sits every week there are three to argue
  // (the user, 2026-10-07: "where's the round table?"); off the full weeks it is a shorter sitting
  // and moves the room less, so a season of them weighs about what the old every-third-week did.
  if (!full && residents.length >= 3) {
    // A short sitting is about the week's news, not everybody again (the same five arguments every
    // week): the HOH and the veto winner, whoever the newcomer blames, and the most divisive player.
    const alive = gs.activePlayers || [];
    const blamed = newcomer ? (() => { try { return believedVoters(newcomer, newcomer)[0]; } catch { return null; } })() : null;
    const split = n => { const r = residents.map(j => readOf(j, n)); const m = r.reduce((a, b) => a + b, 0) / r.length; return r.reduce((a, b) => a + (b - m) ** 2, 0); };
    const news = [...new Set([week?.hoh, week?.vetoWinner, blamed, ...alive.slice().sort((a, b) => split(b) - split(a))].filter(n => n && alive.includes(n)))].slice(0, 3);
    const table = roundtable(residents, num, rng, 0.3, news);
    if (table) acts.push({ title: 'The Roundtable', beats: [], roundtable: table });
  }
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
      `${speaker} says what the room has been circling all week. "Our vote is the last bit of power any of us has in this game. I'm not wasting mine on a grudge."`,
      `${speaker} looks around the room. "Every one of us got here because of somebody still in that house. And now we get to decide which of them wins."`,
      `${speaker} says it quietly. "It's real now. A few more days and we're sitting in front of them, deciding."`,
      `The lodge stays up late. "I thought I knew who I was voting for," ${speaker} says. "After tonight, I'm not sure anymore."`,
    ])));
    acts.push({ title: remaining <= 4 ? 'Before Finale Night' : 'Late Night at the Lodge', beats: closing });
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
