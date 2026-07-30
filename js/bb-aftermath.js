// ══════════════════════════════════════════════════════════════════════
// bb-aftermath.js — the eviction interview
// ══════════════════════════════════════════════════════════════════════
//
// Total Drama's aftermath is a scheduled talk show that gathers up several
// eliminations at once. Big Brother's equivalent happens every single week and
// is one person: the houseguest who just walked out sits down with the host
// while the door is still closing, and finds out what was actually happening
// around them.
//
// That last part is the whole point of the segment. A houseguest leaves with a
// theory, the goodbye messages either confirm it or humiliate it, and what they
// take to the jury is whichever version they end up believing. So the interview
// is generated from what really happened in the week — who flipped, whether the
// flip was visible, and who the evictee had already decided to blame.

import { gs, seasonConfig } from './core.js';
import { pronouns, pStats } from './players.js';
import {
  bond, perceived, trusts, grudge, remembers, targetOf, sharesAlliance,
  deFactoAllies, isNice, isVillainous, willScheme,
} from './bb-events/_read.js';

const _pick = (rng, list) => list[Math.min(list.length - 1, Math.floor(rng() * list.length))];

/** Who the evictee walks out believing did it — right or wrong. */
function readOfTheRoom(evictee, week, house) {
  const flippers = (week.ballots || []).filter(b => b.changed && b.evict === evictee).map(b => b.voter);
  const votedAgainst = (week.ballots || []).filter(b => b.evict === evictee).map(b => b.voter);
  const sharp = pStats(evictee).intuition / 10;

  // A perceptive houseguest tends to land on somebody who actually voted
  // against them. A trusting one blames whoever they were already suspicious
  // of, which is frequently the wrong person entirely.
  const blamed = targetOf(evictee)
    || (sharp > 0.55 && votedAgainst.length ? votedAgainst[0] : null)
    || house.find(n => n !== evictee && grudge(evictee, n) >= 2)
    || votedAgainst[0]
    || week.hoh;

  return {
    blamed,
    correct: votedAgainst.includes(blamed),
    flippers,
    betrayedByAlly: votedAgainst.filter(v => trusts(evictee, v, 2.5) || sharesAlliance(evictee, v)),
    margin: Object.values(week.votes || {}).sort((a, b) => b - a),
  };
}

/**
 * What each remaining houseguest recorded for the person leaving.
 *
 * Goodbye messages are the one place in the format where somebody can be
 * completely honest, because the person they are talking to cannot use it. That
 * makes them the cruellest thing in the show and the most informative.
 */
function goodbyeMessages(evictee, house, week, rng) {
  const votedAgainst = new Set((week.ballots || []).filter(b => b.evict === evictee).map(b => b.voter));
  return house.filter(n => n !== evictee).map(name => {
    const p = pronouns(name);
    const against = votedAgainst.has(name);
    const close = bond(name, evictee) >= 3;
    const hidden = against && close;              // voted them out and was close
    const tone = hidden ? 'confession' : against ? 'unapologetic' : close ? 'warm' : 'polite';

    const text = hidden ? _pick(rng, [
      `"I wrote your name down. I've been sitting on that for three days and I couldn't say it to your face, which probably tells you everything about how I'm playing this."`,
      `"You were my closest friend in here and I still did it, and I'd like to say I'm sorry but I think I'd do it again."`,
      `"If you're watching this you already know it was me. I hope you understand it eventually. I'd understand if you didn't."`,
    ]) : against ? _pick(rng, [
      `"It was me. It was always going to be me. You came for me first and you missed."`,
      `"Nothing personal — but you were the biggest problem in here for my game, and now you're not."`,
      `"You played hard. You just played hard at the wrong person."`,
      `"I'd apologise but you'd have done exactly the same, and we both know it."`,
    ]) : close ? _pick(rng, [
      `"I fought for you. I lost. I'm sorry — genuinely, I'm sorry."`,
      `"This house is going to be a lot worse without you in it, and I mean that."`,
      `"I kept my word. For whatever it's worth in here, I kept it."`,
    ]) : _pick(rng, [
      `"Good game. I mean that — you made this a lot harder than it needed to be."`,
      `"I don't think we ever really got each other, but I never had a problem with you."`,
      `"Take care out there. Say hello to the jury for me, if it comes to that."`,
    ]);

    return { name, tone, against, text };
  });
}

/**
 * Build the interview from the week that just happened.
 *
 * Returns null when there is nothing to interview — no eviction, or the segment
 * is switched off in the season config.
 */
export function generateBBEvictionInterview(ep, week, rng = Math.random) {
  if (seasonConfig.bbEvictionInterview === 'disabled') return null;
  const evictee = ep.eliminated;
  if (!evictee) return null;
  const house = (week.houseAtStart || []).filter(Boolean);
  const read = readOfTheRoom(evictee, week, house);
  const p = pronouns(evictee);
  const host = seasonConfig.host || 'Chris';
  const [top, second] = read.margin;
  const blindsided = (second ?? 0) === 0 || (top - (second ?? 0)) >= Math.max(2, house.length / 3);

  const questions = [];

  questions.push({
    q: blindsided
      ? `"${evictee} — that was a ${top}${second != null ? `–${second}` : ''} vote. Did you have any idea?"`
      : `"${evictee}, that vote was close. Did you think you had it?"`,
    a: blindsided
      ? _pick(rng, [
        `"No. And I counted. I counted this morning and I counted an hour before the vote and I had it."`,
        `"I knew something was wrong when nobody would look at me. I just didn't know how wrong."`,
        `"I've been in that house thirty days and I have never felt more stupid than in the last thirty seconds of it."`,
      ])
      : _pick(rng, [
        `"I thought I had one more. I've thought that before and been right, so — that's the game."`,
        `"I knew it was close. I'd rather lose that way than not be in the conversation at all."`,
        `"One vote. That's what it came down to. I'll be thinking about which one for a while."`,
      ]),
  });

  questions.push({
    q: `"Who do you think did it?"`,
    a: read.correct
      ? _pick(rng, [
        `"${read.blamed}. I know it was ${pronouns(read.blamed).obj}, and I knew before I stood up."`,
        `"${read.blamed}. ${pronouns(read.blamed).Sub} was too comfortable this week. Nobody is that comfortable by accident."`,
      ])
      : _pick(rng, [
        `"${read.blamed}. It has to be ${pronouns(read.blamed).obj}. There isn't anybody else it could be."`,
        `"${read.blamed}, and I'd put money on it. ${pronouns(read.blamed).Sub} has been running that house for a week and nobody has noticed."`,
      ]),
    wrong: !read.correct,
  });

  if (read.betrayedByAlly.length) {
    const traitor = read.betrayedByAlly[0];
    questions.push({
      q: `"You and ${traitor} were close. Would it change anything if ${pronouns(traitor).sub} voted against you?"`,
      a: isNice(evictee)
        ? `"${pronouns(traitor).Sub} wouldn't. I'd want to see it before I believed it."`
        : `"Then ${pronouns(traitor).sub} had better hope ${pronouns(traitor).sub} wins, because I get a vote at the end of this."`,
      loaded: true,
    });
  }

  questions.push({
    q: `"Anything you'd do differently?"`,
    a: pStats(evictee).strategic >= 6
      ? _pick(rng, [
        `"I'd have made a move a week earlier. I sat still because sitting still was working, and sitting still is how you end up here."`,
        `"I trusted a number instead of a person. The number was fine. The person wasn't."`,
      ])
      : _pick(rng, [
        `"I'd have talked to more people. I got comfortable with the ones who were easy to talk to."`,
        `"Honestly? I'd do most of it the same. I just wouldn't do it with ${read.blamed}."`,
      ]),
  });

  return {
    evictee, host, blindsided,
    blamed: read.blamed, blameCorrect: read.correct,
    betrayedBy: read.betrayedByAlly,
    votes: { ...(week.votes || {}) },
    questions,
    goodbyes: goodbyeMessages(evictee, house, week, rng),
    // The evictee's parting shot, which the jury will hear about.
    parting: isVillainous(evictee)
      ? `"Whoever's left — I'm on that jury now, and I remember everything."`
      : isNice(evictee)
        ? `"I'd do it again. All of it. Even this bit."`
        : `"Play hard. That's all I've got."`,
  };
}
