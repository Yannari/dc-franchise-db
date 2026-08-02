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
  // The show curates. Thirteen goodbye messages is a table read, not a
  // segment: the broadcast plays the ones with something in them — the
  // organiser, the friend who did it anyway, the people who actually
  // mattered — and the rest of the house waves from a montage.
  const plan = (week.voteOperation?.plans || []).find(pl => pl.target === evictee) || null;
  const weight = name => {
    const against = votedAgainst.has(name);
    const close = bond(name, evictee) >= 3;
    let w = Math.abs(bond(name, evictee)) * 0.6;
    if (plan?.organizer === name) w += 10;
    if (against && close) w += 6;
    if ((gs.showmances || []).some(sh => sh.phase !== 'broken-up' && !sh.broken
      && (sh.players || []).includes(name) && (sh.players || []).includes(evictee))) w += 8;
    if (against && !close) w += 1.5;
    return w;
  };
  const everyone = house.filter(n => n !== evictee).sort((a, b) => weight(b) - weight(a));
  const featured = everyone.slice(0, 6);
  const montage = everyone.slice(6);
  // Never the same sentence twice in one segment — a small pool over a big
  // cast repeats fast, and a repeated goodbye reads as copy-paste, which is
  // the one thing a farewell must never be.
  const used = new Set();
  const pickFresh = pool => {
    const fresh = pool.filter(line => !used.has(line));
    const line = _pick(rng, fresh.length ? fresh : pool);
    used.add(line);
    return line;
  };
  const messages = featured.map(name => {
    const p = pronouns(name);
    const against = votedAgainst.has(name);
    const close = bond(name, evictee) >= 3;
    const hidden = against && close;              // voted them out and was close
    const tone = hidden ? 'confession' : against ? 'unapologetic' : close ? 'warm' : 'polite';

    const text = hidden ? pickFresh([
      `"I wrote your name down. I've been sitting on that for three days and I couldn't say it to your face, which probably tells you everything about how I'm playing this."`,
      `"You were my closest friend in here and I still did it, and I'd like to say I'm sorry but I think I'd do it again."`,
      `"If you're watching this you already know it was me. I hope you understand it eventually. I'd understand if you didn't."`,
    ]) : against ? pickFresh([
      `"It was me. It was always going to be me. You came for me first and you missed."`,
      `"Nothing personal — but you were the biggest problem in here for my game, and now you're not."`,
      `"You played hard. You just played hard at the wrong person."`,
      `"I'd apologise but you'd have done exactly the same, and we both know it."`,
      `"Somebody had to go, and my week went a lot smoother once it was you."`,
      `"You'll be great on the outside. That's not a compliment about the inside."`,
    ]) : close ? pickFresh([
      `"I fought for you. I lost. I'm sorry — genuinely, I'm sorry."`,
      `"This house is going to be a lot worse without you in it, and I mean that."`,
      `"I kept my word. For whatever it's worth in here, I kept it."`,
      `"You made this house feel less like a set. I'm going to miss that more than I can say on camera."`,
      `"Watch my season for me. Yell at the screen when I do something stupid. You'll know when."`,
    ]) : pickFresh([
      `"Good game. I mean that — you made this a lot harder than it needed to be."`,
      `"I don't think we ever really got each other, but I never had a problem with you."`,
      `"Take care out there. Say hello to the jury for me, if it comes to that."`,
      `"We never got our chapter, did we. Maybe outside the walls."`,
      `"You always kept your area of the kitchen clean, and honestly that is more than most."`,
    ]);

    return { name, tone, against, text };
  });
  if (montage.length) {
    messages.push({
      name: null, tone: 'montage', against: false,
      montage: montage.slice(),
      text: `The rest of the house goes by in a montage — ${montage.slice(0, 3).join(', ')}${montage.length > 3 ? ` and ${montage.length - 3} more` : ''} — waves, half-jokes, one blown kiss. Nothing anybody will quote tomorrow.`,
    });
  }
  return messages;
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
  // Big Brother's host is Don, not Chris. seasonConfig.host is the Total
  // Drama setting and defaults to Chris, so inheriting it put the wrong man in
  // the interview chair; the house gets its own knob and its own default.
  const host = seasonConfig.bbHost || 'Don';
  const [top, second] = read.margin;
  const blindsided = (second ?? 0) === 0 || (top - (second ?? 0)) >= Math.max(2, house.length / 3);

  // One episode is one week. The first boot has been in the house seven
  // days, not the hardcoded thirty a later draft assumed — an exit interview
  // that misremembers how long its own guest was inside breaks the whole
  // illusion in one sentence.
  const weeksIn = Math.max(1, week.num || 1);
  const timeIn = weeksIn === 1 ? 'seven days' : weeksIn === 2 ? 'two weeks' : `${weeksIn} weeks`;

  const questions = [];

  questions.push({
    q: blindsided
      ? `"${evictee} — that was a ${top}${second != null ? `–${second}` : ''} vote. Did you have any idea?"`
      : `"${evictee}, that vote was close. Did you think you had it?"`,
    a: blindsided
      ? _pick(rng, [
        `"No. And I counted. I counted this morning and I counted an hour before the vote and I had it."`,
        `"I knew something was wrong when nobody would look at me. I just didn't know how wrong."`,
        `"I've been in that house ${timeIn} and I have never felt more stupid than in the last thirty seconds of it."`,
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

  // ── The walk-out. The audience's first verdict, before a word is said. ──
  const walkout = {
    crowd: blindsided ? 'stunned' : isVillainous(evictee) ? 'split' : 'warm',
    line: blindsided
      ? _pick(rng, [
        `The doors open on a face that has not caught up yet. The audience is on its feet before ${evictee} is through the frame.`,
        `${evictee} walks out carrying a bag packed by somebody who believed they were staying. The applause has that stunned edge a blindside leaves.`,
        `The crowd noise hits ${evictee} like weather. ${p.Sub} stops for half a second in the doorway — the first person to tell ${p.obj} the truth all week was the vote itself.`,
      ])
      : _pick(rng, [
        `${evictee} comes through the doors already waving, because whatever else this is, it is over, and over has its own relief.`,
        `The audience gives ${evictee} the send-off of somebody they enjoyed watching. ${p.Sub} takes it in like the first fresh air since the doors closed.`,
        `${evictee} hugs the doorframe of the house on the way out, which gets a laugh, which was the point.`,
      ]),
  };

  // ── The truth panel: what the interview exists to reveal. The host has
  // watched everything; the evictee has watched a version of it. ──
  const evictionAct = (week.acts || []).find(a => a.type === 'eviction');
  const ballots = evictionAct?.ballots || week.ballots || [];
  const plan = (week.voteOperation?.plans || []).find(pl => pl.target === evictee) || null;
  const liars = ballots.filter(b => b.lied && b.evict === evictee).map(b => b.voter);
  const truth = (plan || liars.length) ? {
    organizer: plan?.organizer || null,
    alliance: plan?.alliance || null,
    expected: plan?.expected ?? null,
    majority: plan?.majority ?? null,
    actual: (week.votes || {})[evictee] ?? null,
    liars,
    reaction: plan && plan.organizer !== read.blamed
      ? _pick(rng, [
        `"${plan.organizer}? I sat across from ${pronouns(plan.organizer).obj} at breakfast this morning." The sentence just stops there.`,
        `${evictee} laughs once — the wrong kind of laugh. "I named the wrong person on live television, didn't I."`,
        `"Huh." A long pause. "That's... actually, that's good. That's a good game. I hate it."`,
      ])
      : _pick(rng, [
        `"I knew it. I KNEW it." Being right is worth nothing now, and ${evictee}'s face knows both halves of that.`,
        `${evictee} nods slowly, the way people nod at news that is only new officially.`,
        `"At least I read the room right on the way out." It is somewhere between pride and an autopsy.`,
      ]),
  } : null;

  // ── Goodbye reactions: the camera stays on the person watching. ──
  const temperVal = pStats(evictee).temperament ?? 5;
  const usedReacts = new Set();
  const freshReact = pool => {
    const fresh = pool.filter(line => !usedReacts.has(line));
    const line = _pick(rng, fresh.length ? fresh : pool);
    usedReacts.add(line);
    return line;
  };
  const goodbyes = goodbyeMessages(evictee, house, week, rng).map(g => g.tone === 'montage' ? { ...g, react: null } : ({
    ...g,
    react: g.tone === 'confession'
      ? (temperVal <= 4
        ? freshReact([
          `${evictee} stands halfway up out of the chair before remembering there is nowhere to go with it.`,
          `"Play it again." Nobody plays it again. ${evictee} watches the dark screen anyway.`,
          `${evictee} points at the monitor and starts a sentence three different ways. None of them finish.`,
          `The audience reacts before ${evictee} does. Then ${evictee} does, and the host lets it run.`,
        ])
        : freshReact([
          `${evictee} watches the whole thing without blinking, then exhales like somebody setting down a heavy thing.`,
          `A slow nod. "Okay. Okay." The word means about nine different things.`,
          `${evictee} looks away from the screen exactly once, right at the word that costs the most.`,
          `"That's the one that gets me." Quietly, to nobody in particular.`,
        ]))
      : g.tone === 'unapologetic'
        ? freshReact([
          `${evictee} smiles at the screen with no warmth in it whatsoever. The jury exists, and both of them know it.`,
          `"Noted," ${evictee} says, in the voice people use for lists they intend to keep.`,
          `${evictee} applauds — three slow claps, precisely as sincere as the message.`,
          `An eyebrow, nothing else. Some messages answer themselves.`,
        ])
        : g.tone === 'warm'
          ? freshReact([
            `${evictee} presses ${p.posAdj} sleeve to ${p.posAdj} eyes and waves at the screen like the screen can see.`,
            `That one lands. ${evictee} needs a second, and the host gives it.`,
            `"Oh, don't—" ${evictee} laughs and cries at the same time, which is the correct response.`,
            `${evictee} mouths a thank-you at the monitor. The friendship was real; the game just happened around it.`,
          ])
          : freshReact([
            `${evictee} nods politely at the screen, filing the message under people who were never really in the story.`,
            `A small smile, nothing behind it. Some goodbyes are just administration.`,
            `${evictee} tilts a head at the screen — genuinely unsure, for a second, who that was.`,
            `Polite applause from the audience. ${evictee} matches it exactly.`,
          ]),
  }));

  // ── Where the car goes. ──
  const remaining = house.length - 1;
  const jurySeats = Number(seasonConfig.jurySize) || 0;
  const joinsJury = jurySeats > 0 && (remaining - 3) < jurySeats;

  return {
    evictee, host, blindsided,
    blamed: read.blamed, blameCorrect: read.correct,
    betrayedBy: read.betrayedByAlly,
    votes: { ...(week.votes || {}) },
    walkout,
    questions,
    truth,
    goodbyes,
    joinsJury,
    // The evictee's parting shot, which the jury will hear about.
    parting: isVillainous(evictee)
      ? (joinsJury ? `"Whoever's left — I'm on that jury now, and I remember everything."`
        : `"Tell them I said congratulations. Make sure they hear it in my voice."`)
      : isNice(evictee)
        ? `"I'd do it again. All of it. Even this bit."`
        : `"Play hard. That's all I've got."`,
  };
}
