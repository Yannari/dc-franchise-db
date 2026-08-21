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

import { gs, seasonConfig, players } from './core.js';
import { evictionSeatsAJuror, jurorOrdinalFor } from './bb/jury.js';
import { pronouns, pStats } from './players.js';
import {
  bond, perceived, trusts, grudge, remembers, targetOf, sharesAlliance,
  deFactoAllies, isNice, isVillainous, willScheme, dislikes,
  fearOf, respectOf, trustOf,
} from './bb-events/_read.js';

const _pick = (rng, list) => list[Math.min(list.length - 1, Math.floor(rng() * list.length))];

// Hosts do not play the game, so contestant stats are the wrong vocabulary for
// them. A small editorial profile controls how they ask, press and release.
// The name remains independent: a custom host can be warm, incisive, playful
// or balanced without pretending to have an idol-finding score.
export const BB_HOST_STYLES = {
  balanced: { label: 'Balanced', warmth: 2, pressure: 2, humour: 1 },
  warm:     { label: 'Warm', warmth: 4, pressure: 1, humour: 1 },
  incisive: { label: 'Incisive', warmth: 1, pressure: 4, humour: 0 },
  playful:  { label: 'Playful', warmth: 2, pressure: 2, humour: 4 },
};

function hostStyle() {
  const key = seasonConfig.bbHostStyle || 'balanced';
  return BB_HOST_STYLES[key] ? key : 'balanced';
}

function hostQuestion(style, kind, v, rng) {
  const pools = {
    blindside: {
      balanced: [`"${v.name} — that was a ${v.vote} vote. Did you have any idea?"`, `"When did you first feel that vote moving away from you?"`],
      warm: [`"${v.name}, take a breath. That was a ${v.vote} vote. How surprised are you right now?"`, `"I know that exit happened quickly. When did you realise you might be in trouble?"`],
      incisive: [`"${v.name}, you said you had the votes. You lost ${v.vote}. Where did your read fail?"`, `"That was not close. Who lied to you most convincingly?"`],
      playful: [`"${v.name}, your vote count and the house's vote count were apparently using different maths. What happened?"`, `"That door opened before your face got the memo. How blindsided were you?"`],
    },
    close: {
      balanced: [`"${v.name}, that vote was close. Did you think you had it?"`, `"One vote separated the chairs from the front door. Where did you think it was landing?"`],
      warm: [`"${v.name}, you came within a vote of staying. How certain did you feel before the result?"`, `"That was painfully close. Did you believe you had survived it?"`],
      incisive: [`"${v.name}, you needed one more vote. Whose vote did you miscount?"`, `"Close only matters if you know where the missing vote was. Did you?"`],
      playful: [`"${v.name}, one vote just ruined your evening. Which houseguest owes you an explanation?"`, `"You were one conversation away. Which conversation are you replaying first?"`],
    },
    blame: {
      balanced: ['"Who do you think made this happen?"', '"Whose fingerprints are on this vote?"'],
      warm: ['"You have had only a few seconds to process it, but who do you believe turned the vote?"', '"Who hurts the most to suspect right now?"'],
      incisive: ['"Name the person who outplayed you this week."', '"No qualifiers: who sent you out?"'],
      playful: ['"If I handed you one enormous red marker, whose face are you circling?"', '"Who is getting the first awkward phone call after the season?"'],
    },
    regret: {
      balanced: ['"What would you do differently?"', '"Where did your game actually turn?"'],
      warm: ['"Be fair to yourself—but if you could replay one decision, which one would it be?"', '"What lesson are you taking out of the house with you?"'],
      incisive: ['"What was your fatal mistake?"', '"Strip away the bad luck. What did you do wrong?"'],
      playful: ['"You get one rewind and absolutely no production assistance. Where are you using it?"', '"Which decision is going to make you yell at the television later?"'],
    },
    identity: {
      balanced: ['"What did the house misunderstand about your game?"', '"What part of your game never made it into the room?"'],
      warm: ['"What do you hope the people still inside understood about you?"', '"What are you proudest of, even tonight?"'],
      incisive: ['"What is the strongest argument that you deserved to stay?"', '"Were you underestimated—or correctly identified as a threat?"'],
      playful: ['"Give your game a title. Comedy, tragedy, or an unfinished revenge story?"', '"What will your housemates pretend they miss most tomorrow?"'],
    },
  };
  return _pick(rng, pools[kind]?.[style] || pools[kind]?.balanced || ['"What happened?"']);
}

function evicteeVoice(name) {
  const player = players.find(x => x.name === name) || {};
  const s = pStats(name);
  const archetype = player.archetype || '';
  if (isVillainous(name) || ['villain', 'schemer', 'chaos-agent'].includes(archetype)) return 'defiant';
  if (archetype === 'mastermind' || s.strategic >= 8) return 'analytical';
  if (archetype === 'social-butterfly' || s.social >= 8) return 'social';
  if (archetype === 'underdog') return 'underdog';
  if (archetype === 'hothead' || s.temperament <= 3) return 'volatile';
  if (isNice(name) || ['hero', 'loyal-soldier'].includes(archetype)) return 'sincere';
  return 'guarded';
}

// Archetype controls cadence; stats control what the evictee talks about.
// Each stat becomes a concrete decision or relationship, never an on-screen
// label such as "my Social stat was low."
function statFlavoredLines(name, topic, ctx = {}) {
  const s = pStats(name);
  const lines = [];
  const blamed = ctx.blamed;
  const traitor = ctx.traitor;
  const bp = blamed ? pronouns(blamed) : null;
  const tp = traitor ? pronouns(traitor) : null;

  if (topic === 'reaction') {
    if (s.temperament <= 3) lines.push(`"I'm angry. I know everybody wants an explanation, but I'm still trying not to say something I'll regret."`);
    if (s.temperament >= 8) lines.push(`"It hurts, but losing my composure won't put me back in the house. I want to understand what happened."`);
    if (s.intuition >= 8) lines.push(`"I felt the house change after the veto meeting. I noticed it and still convinced myself it wasn't about me."`);
    if (s.intuition <= 3) lines.push(`"I had no idea. People were talking to me normally right up until the vote."`);
    if (s.social >= 8) lines.push(`"I thought the relationships would matter when people voted. Most of them did—just not enough of them."`);
    if (s.social <= 3) lines.push(`"I knew I hadn't built enough relationships. Tonight is what that looks like when it finally catches up with you."`);
  }

  if (topic === 'blame' && blamed) {
    if (ctx.correct && s.intuition >= 7) lines.push(`"${blamed}. Our conversations stopped being specific. Every answer became 'we'll see,' and that was the answer."`);
    if (!ctx.correct && s.intuition <= 4) lines.push(`"My first answer is ${blamed}, but clearly my read hasn't been very good tonight. I could be wrong."`);
    if (s.boldness >= 8) lines.push(`"${blamed}. I took a shot at ${bp.obj}, ${bp.sub} got there first, and I'm not going to pretend it was anything else."`);
    if (s.temperament <= 3) lines.push(`"${blamed}. That's the name in my head, and I need some time before I can talk about ${bp.obj} calmly."`);
  }

  if (topic === 'betrayal' && traitor) {
    if (s.loyalty >= 8) lines.push(`"I would've kept ${traitor}. I wasn't asking ${tp.obj} for something I wouldn't have done myself. That's why it hurts."`);
    if (s.loyalty <= 3) lines.push(`"I can't act offended that ${traitor} chose ${tp.posAdj} game. I would've voted ${tp.obj} out if I thought I needed to."`);
    if (s.temperament <= 3) lines.push(`"Then I'm glad you're telling me while there's a locked door between us."`);
    if (s.temperament >= 8) lines.push(`"Then I want to hear ${tp.posAdj} reason before I decide what happens to that relationship."`);
    if (s.strategic >= 8) lines.push(`"Then ${traitor} saw that keeping me no longer helped ${tp.obj}. I understand the move. That doesn't make it feel better."`);
  }

  if (topic === 'regret') {
    if (s.strategic >= 8) lines.push(`"After the veto meeting, I stopped checking because the plan still made sense on paper. I should've checked whether the people were still with it."`);
    if (s.strategic <= 3) lines.push(`"I didn't have a backup plan. Once the vote moved, all I could do was ask the same people to change their minds."`);
    if (s.social >= 8) lines.push(`"I confused people liking me with people being willing to risk their games for me. Those aren't the same thing."`);
    if (s.social <= 3) lines.push(`"I stayed with the same few people every day. When I needed other votes, I hadn't given anyone a reason to help me."`);
    if (s.intuition >= 8) lines.push(`"I noticed people pulling away and talked myself out of trusting that feeling. Next time, I act on it."`);
    if (s.intuition <= 3) lines.push(`"I missed every warning sign. I needed to ask direct questions instead of assuming silence meant I was safe."`);
    if (s.loyalty >= 8) lines.push(`"I protected people because I gave them my word, even after keeping them stopped helping me."`);
    if (s.loyalty <= 3) lines.push(`"I changed sides too often. Eventually everybody had a reason to think I'd do it to them next."`);
    if (s.boldness >= 8) lines.push(`"I pushed my target too openly. Once people knew exactly what I wanted, it was easy to organise against me."`);
    if (s.boldness <= 3) lines.push(`"I waited for somebody else to start the move I needed. Nobody did, and I ran out of time."`);
    if (s.temperament <= 3) lines.push(`"I let one argument become the story of my whole week. After that, people voted based on how I made them feel."`);
  }

  if (topic === 'identity') {
    if (s.strategic >= 8) lines.push(`"I was thinking several votes ahead, but I didn't always explain enough to make people comfortable following me."`);
    if (s.social >= 8) lines.push(`"The conversations people thought were just personal were how I stayed informed. My social game was my strategy."`);
    if (s.loyalty >= 8) lines.push(`"They treated my loyalty like I had no options. I had options. I kept choosing the people I promised to protect."`);
    if (s.loyalty <= 3) lines.push(`"They thought every deal I made was supposed to last forever. I made the deal I needed that week, then adjusted."`);
    if (s.boldness >= 8) lines.push(`"People thought I acted without thinking because I acted quickly. I knew the risk; I just preferred it to waiting."`);
    if (s.boldness <= 3) lines.push(`"I was more involved than people realised. I just didn't need credit for every conversation."`);
    if (s.intuition >= 8) lines.push(`"I usually knew when something was changing before anyone said it. This week I knew too, and I didn't trust myself."`);
    if (s.temperament <= 3) lines.push(`"They saw the arguments and decided that was my whole personality. They didn't see how much I held back first."`);
    if (s.temperament >= 8) lines.push(`"Because I stayed calm, people assumed I wasn't worried or wasn't playing. I just don't process things out loud."`);
  }
  if (topic === 'parting') {
    if (s.loyalty >= 8) lines.push(`"I kept my word in there. I can leave disappointed without being embarrassed about how I played."`);
    if (s.loyalty <= 3) lines.push(`"I made the deals I needed to make. Some worked, some didn't, and now I get to own all of them."`);
    if (s.boldness >= 8) lines.push(`"I played hard and made myself visible. Sitting back might've lasted longer, but it wouldn't have been my game."`);
    if (s.boldness <= 3) lines.push(`"I waited too long to put my name on a move. That's the part I don't want to repeat."`);
    if (s.temperament <= 3) lines.push(`"I'm leaving angry. Maybe tomorrow I'll have a better answer, but tonight that's the honest one."`);
    if (s.temperament >= 8) lines.push(`"I lost tonight. I don't need to turn that into something uglier than it is."`);
    if (s.strategic >= 8 && ctx.joinsJury) lines.push(`"Now I get to watch what they do without me and decide whose game actually holds together."`);
  }
  return lines;
}

function pickLayeredAnswer(rng, statLines, archetypeLines) {
  // Stats should be audible most of the time, while archetype still supplies
  // broader voice and keeps two similarly rated people from sounding cloned.
  if (statLines.length && rng() < 0.72) return _pick(rng, statLines);
  return _pick(rng, archetypeLines);
}

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
  // ── a goodbye can only claim the vote its author actually had ──
  //
  // "I fought for you. I lost." was sayable by anybody who didn't write the
  // name down — including the Head of Household and the other nominee, who
  // never held a ballot at all. At a final four with one voter, that meant
  // three people claiming a fight they were constitutionally barred from
  // joining. Vote-claiming lines now require a KEEP ballot; the people who
  // couldn't vote get lines about the seat they were actually in.
  const voters = new Set((week.ballots || []).map(b => b.voter));
  const keptThem = name => voters.has(name) && !votedAgainst.has(name);
  const blockmate = name => (week.finalNominees || []).includes(name)
    && (week.finalNominees || []).includes(evictee) && name !== evictee;
  const vetoRewrote = !!week.vetoWinner
    && JSON.stringify(week.initialNominees || []) !== JSON.stringify(week.finalNominees || []);
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
    const betrayedAFriend = against && close;     // voted them out and was close
    const tone = betrayedAFriend ? 'confession' : against ? 'unapologetic' : close ? 'warm' : 'polite';
    const cameForMe = targetOf(evictee) === name;
    const ranVote = plan?.organizer === name;

    // ── who these two were to each other ──
    //
    // Four tones is the shape of a goodbye; it is not the CONTENT of one. Every
    // message in the pools below was written to be sayable by anybody, which
    // meant the segment could play six of them without once mentioning that
    // two of these people were in an alliance, or in a showmance, or had spent
    // a month openly loathing each other. These are the facts the house
    // actually has, and each one earns its own lines.
    const allied = sharesAlliance(name, evictee);
    const showmance = (gs.showmances || []).some(sh => sh.phase !== 'broken-up' && !sh.broken
      && (sh.players || []).includes(name) && (sh.players || []).includes(evictee));
    const enemy = dislikes(name, evictee);
    // They trusted this person more than this person deserved: the gap between
    // the real bond and the one on display.
    // Thresholds measured off played seasons rather than assumed. These
    // dimensions do not run 0-10: across 576 live pairs `fearOf` sat at 0.24
    // in the median and topped out at 3.06, and `respectOf` peaked at 6.03.
    // The first pass asked for 5 of each, which meant the frightened line and
    // the admiring line could not fire at all. These sit around the 97th
    // percentile — rare enough to feel like a specific thing to say about a
    // specific person, common enough to actually happen.
    const neverSawIt = bond(name, evictee) - perceived(name, evictee) >= 1.5;
    const scaredOf = fearOf(name, evictee) >= 1.5;
    const rated = respectOf(name, evictee) >= 3;
    const arch = players.find(x => x.name === name)?.archetype || '';
    const nice = isNice(name);
    const villainous = isVillainous(name);
    const toJury = evictionSeatsAJuror(house.length);

    const unapologetic = [
      `"I voted to evict you because keeping you gave me one more person I couldn't trust and one fewer path to the end. You were good at this game. That was the problem."`,
      `"I didn't write your name down because you played badly. I wrote it down because another week with you in this house was worse for my game than a week without you."`,
      `"We never found a way to work together, and eventually that stops being awkward and starts being dangerous. Tonight I chose my game over yours."`,
      `"You made people change their plans around you. I wasn't giving you another week to make me change mine."`,
      `"I'm not going to call it personal. I wanted a house where you had less influence, and voting you out was the cleanest way to get one."`,
    ];
    if (cameForMe) unapologetic.push(
      `"You put my name into the game, took a shot and left me here to answer it. This vote was the answer."`,
      `"You decided I was somebody you could come after and survive. I voted to make sure you were wrong about the second part."`,
    );
    if (ranVote) unapologetic.push(
      `"I helped put this vote together. You were too connected, too difficult to control and too dangerous to leave for next week. I own all of it."`,
      `"This wasn't a vote I followed. I wanted you out, I found the numbers, and I made sure they stayed there. You deserved the truth before I asked for your jury vote."`,
    );
    if (enemy) unapologetic.push(
      `"Neither of us is going to pretend. You didn't like me, I didn't like you, and one of us was always going to get to do this first."`,
      `"I'd tell you this was nothing personal, but you'd know I was lying and I'd know you knew."`,
      `"You wanted me gone since about week two. You just weren't as good at it."`,
    );
    if (scaredOf) unapologetic.push(
      `"I was frightened of you. That's the whole message. Every week you were still here was a week I spent working out what you were doing."`,
      `"I never once felt safe with you in this house, and I have thirty-odd days of not sleeping to prove it."`,
    );
    if (rated && !enemy) unapologetic.push(
      `"You're the best player I've sat in a room with. That is not a compliment I can afford to keep paying past tonight."`,
      `"If I let you keep going, you win this. I'm not going to sit here and pretend I don't know that."`,
    );
    if (allied) unapologetic.push(
      `"We were on the same side of this house, right up until the side got too crowded. I picked the version of it that had me in it."`,
      `"An alliance is four people agreeing about a fifth. Eventually you run out of fifths, and tonight we ran out."`,
    );
    if (villainous) unapologetic.push(
      `"I'd apologise, but you'd only use it against me on the jury, and I'd deserve that."`,
      `"You'd have done it to me. The difference between us is about four days and one competition."`,
    );
    if (toJury) unapologetic.push(
      `"You get a vote at the end of this, and I'd rather you cast it hating me for something I actually did than for a version somebody else tells you about."`,
    );

    const confession = [
      `"I wrote your name down. I've been sitting on that for three days and I couldn't say it to your face, which probably tells you everything about how I'm playing this."`,
      `"You were my closest friend in here and I still did it, and I'd like to say I'm sorry but I think I'd do it again."`,
      `"If you're watching this you already know it was me. I hope you understand it eventually. I'd understand if you didn't."`,
    ];
    if (allied) confession.push(
      `"We built something in here and I took it apart from the inside, in a room you weren't in, with people you trusted less than you trusted me."`,
      `"The alliance was real. I want you to know it was real, because it would be easier for you if it hadn't been, and easier for me if you believed that."`,
    );
    if (showmance) confession.push(
      `"There is no version of this where I come out of it well. I know what we were. I did it anyway and I'm going to have to watch this back one day."`,
      `"I'm going to see you in about four weeks and neither of us knows what that conversation is yet. I'm sorry. I did it and I'm sorry."`,
    );
    if (neverSawIt) confession.push(
      `"You never saw it coming and that was the point. I worked at that. Sitting here saying it out loud is the first honest thing I've done all week."`,
      `"I let you keep telling me the plan right up to the last hour. I could have stopped you. Stopping you would have cost me the vote."`,
    );
    if (nice) confession.push(
      `"I don't like who I was this week. I did it anyway, so I don't get to say that and have it mean much."`,
      `"I'm going to be honest because you've earned it: I have felt sick about this since the moment I decided."`,
    );
    if (ranVote) confession.push(
      `"It was mine. Not the house's, not the numbers', mine. I counted it, I built it, and I let you hug me on the way to the chair."`,
    );

    const warm = [
      `"This house is going to be a lot worse without you in it, and I mean that."`,
      `"You made this house feel less like a set. I'm going to miss that more than I can say on camera."`,
      `"Watch my season for me. Yell at the screen when I do something stupid. You'll know when."`,
    ];
    if (keptThem(name)) warm.push(
      `"I fought for you. I lost. I'm sorry — genuinely, I'm sorry."`,
      `"I kept my word. For whatever it's worth in here, I kept it."`,
    );
    if (blockmate(name)) warm.push(
      `"I was in the other chair. I couldn't fight for you — we needed the same vote, and it could only save one of us. I hate that it saved me."`,
      `"No ballot, no say — just the seat next to yours. I'm sorry it was you, and I can't even pretend I'm sorry it wasn't me. You'd see through that."`,
    );
    if (name === week.hoh) warm.push(
      vetoRewrote
        ? `"This is not the week I built. The veto came down and it stopped being mine. I want you to know the version with my name on it looked different."`
        : `"I set the week up and then I had to sit on my hands while the house finished it. That is the worst seat in the building when it's someone you like."`,
    );
    if (allied) warm.push(
      `"I voted with you, for you, and against the room, and I'd do it again tomorrow with worse numbers."`,
      `"Whatever this alliance did or didn't do, you never once made me doubt where you were. That is rarer in here than winning anything."`,
    );
    if (showmance) warm.push(
      `"I'm going to be useless for about a week. Then I'm going to play for both of us. That's the deal, alright?"`,
      `"None of this was strategy. I know how that sounds on television. I don't care how it sounds."`,
    );
    if (rated) warm.push(
      `"You were better at this than me and you never made me feel it. Do you know how hard that is?"`,
    );
    if (toJury) warm.push(
      `"Go and be brilliant on that jury. Ask the questions I won't be there to ask."`,
    );

    const polite = [
      `"Good game. I mean that — you made this a lot harder than it needed to be."`,
      `"I don't think we ever really got each other, but I never had a problem with you."`,
      `"Take care out there. Say hello to the jury for me, if it comes to that."`,
      `"We never got our chapter, did we. Maybe outside the walls."`,
      `"You always kept your area of the kitchen clean, and honestly that is more than most."`,
    ];
    if (rated) polite.push(
      `"We barely spoke and I still spent half my week thinking about what you were doing. Take that as the compliment it is."`,
    );
    if (enemy) polite.push(
      `"We were never going to be friends. I'd still rather have played against you than most of the people left in here."`,
    );
    if (enemy && keptThem(name)) polite.push(
      `"I didn't vote for you to go, which I suspect surprises you as much as it surprises me."`,
    );
    if (arch === 'floater' || arch === 'goat') polite.push(
      `"I've been quiet in here. You were one of about three people who talked to me like that wasn't a problem."`,
    );
    if (scaredOf) polite.push(
      `"You were the one I was watching. I don't think you ever noticed me at all, and that was probably my best week in here."`,
    );

    const text = betrayedAFriend ? pickFresh(confession)
      : against ? pickFresh(unapologetic)
        : close ? pickFresh(warm)
          : pickFresh(polite);

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
/**
 * @param {string} [who] which evictee to interview. Defaults to the episode's
 *   headline eviction — but a Split House and a Double Eviction both send TWO
 *   people out on the same night, and the second one was walking past the
 *   chair. Passing the name explicitly is how they get sat in it.
 */
export function generateBBEvictionInterview(ep, week, rng = Math.random, who = null) {
  if (seasonConfig.bbEvictionInterview === 'disabled') return null;
  const evictee = who || ep.eliminated;
  if (!evictee) return null;
  const house = (week.houseAtStart || []).filter(Boolean);
  const read = readOfTheRoom(evictee, week, house);
  const p = pronouns(evictee);
  // Big Brother's host is Don, not Chris. seasonConfig.host is the Total
  // Drama setting and defaults to Chris, so inheriting it put the wrong man in
  // the interview chair; the house gets its own knob and its own default.
  const host = seasonConfig.host || 'Don';
  const style = hostStyle();
  const voice = evicteeVoice(evictee);
  const stats = pStats(evictee);
  const [top, second] = read.margin;
  const blindsided = (second ?? 0) === 0 || (top - (second ?? 0)) >= Math.max(2, house.length / 3);

  // One episode is one week. The first boot has been in the house seven
  // days, not the hardcoded thirty a later draft assumed — an exit interview
  // that misremembers how long its own guest was inside breaks the whole
  // illusion in one sentence.
  const weeksIn = Math.max(1, week.num || 1);
  // How many ballots there actually were. Late-season evictions are decided
  // by one or two people, and an interview that rails about "the whole house"
  // over a 1–0 vote has not watched its own show.
  const voteCount = (week.ballots || []).length;
  const soleVoter = voteCount === 1 ? week.ballots[0]?.voter : null;
  const timeIn = weeksIn === 1 ? 'seven days' : weeksIn === 2 ? 'two weeks' : `${weeksIn} weeks`;

  const questions = [];

  const firstAnswers = blindsided ? {
    analytical: [
      `"No. I had a structure in my head and every piece of it was real except the votes. That is a fairly important exception."`,
      `"I saw the warning signs and explained every one of them away. That is worse than not seeing them."`,
      `"My count was internally consistent and completely fictional. Somebody did excellent work."`,
    ],
    defiant: [
      `"Blindsided, yes. Beaten? For tonight. Those are different things."`,
      voteCount === 1
        ? `"One vote. ${soleVoter || 'One person'} got to do alone what the whole house spent a season failing to do. I hope it felt heavy."`
        : voteCount === 2
          ? `"Two votes in the room, and both of them knew exactly who I was. That is a different kind of door than the house showing you out."`
          : `"They needed the whole house to do it and half of them still could not look at me. I can live with that."`,
      `"I hope they enjoy the quiet. I was the only interesting problem they had."`,
    ],
    social: [
      `"I knew the conversations felt wrong. I just thought the relationships underneath them were still real."`,
      `"The hard part is not the vote. It is realising how many people hugged me after they had decided."`,
      `"I trusted affection as evidence. In that house, apparently, it is just excellent camouflage."`,
    ],
    volatile: [
      `"I am trying very hard not to answer that while I can still hear them celebrating through the wall."`,
      `"No. Not even slightly. Give me ten minutes and a less expensive microphone."`,
      `"Everybody was brave once the vote was anonymous. Fantastic."`,
    ],
    underdog: [
      `"I knew I was climbing every week. I thought I had one more rung."`,
      `"Part of me expected it all season. That does not make the door feel any lighter."`,
      `"I survived enough close calls that I started mistaking survival for safety."`,
    ],
    sincere: [
      `"No. I believed people I cared about. I do not regret caring; I regret forgetting where we were."`,
      `"I felt something shift, but I wanted to believe the promises more than the silence."`,
      `"I am hurt. That is the honest answer. The game answer can come after I sleep."`,
    ],
    guarded: [
      `"No. And I counted this morning, then counted again before the vote. I had it both times."`,
      `"I knew something was wrong when nobody would look at me. I did not know how wrong."`,
      `"Apparently I was the last person in the house to receive the weekly update."`,
    ],
  } : {
    analytical: [`"I knew the range. I just assigned the swing vote to the wrong side."`, `"I had two paths and prepared for the one that did not happen."`],
    defiant: [`"I thought I had it because keeping me was the smarter move. That was my mistake: assuming everybody wanted the smarter move."`, `"I knew it was close. Somebody made a choice they will have to defend later."`],
    social: [`"I thought one relationship would hold. Most of them did. One was enough."`, `"I could feel both sides pulling. I believed the person who sounded most like a friend."`],
    volatile: [`"I had one more vote until somebody discovered courage at the last possible second."`, `"Close is a lovely word for losing by one."`],
    underdog: [`"I thought I had scraped together one more week. I have been doing that all season."`, `"I knew it could break either way. I let myself hope."`],
    sincere: [`"I believed I had one more. I cannot be angry that somebody played for themselves."`, `"I knew it was close. I just hoped trust would be the tiebreaker."`],
    guarded: [`"I thought I had one more. I have thought that before and been right."`, `"One vote. I will be thinking about which one for a while."`],
  };

  questions.push({
    q: hostQuestion(style, blindsided ? 'blindside' : 'close', {
      name: evictee, vote: `${top}${second != null ? `–${second}` : ''}`,
    }, rng),
    a: pickLayeredAnswer(rng,
      statFlavoredLines(evictee, 'reaction', { blindsided }),
      firstAnswers[voice] || firstAnswers.guarded)
      .replace('{time}', timeIn),
  });

  // A 1–0 eviction is not a mystery to unpick; it is one relationship read
  // wrong, and the interview should sit in that instead of the usual
  // who-ran-the-house sweep.
  if (voteCount === 1 && soleVoter) {
    questions.push({
      q: style === 'warm'
        ? `"It came down to one vote. ${soleVoter}'s. Did you know where it was going?"`
        : style === 'incisive'
          ? `"One ballot in the box, and it was ${soleVoter}'s. Where did you think it was going?"`
          : style === 'playful'
            ? `"The maths at the end is brutal — one voter, one vote, ${soleVoter}. Any idea which way it was headed?"`
            : `"It was one vote — ${soleVoter}'s. Did you know where it was going?"`,
      a: pickLayeredAnswer(rng,
        statFlavoredLines(evictee, 'reaction', { blindsided }),
        voice === 'analytical'
          ? [`"I thought I did. I had ${soleVoter} read down to the sentence, and the sentence was wrong."`,
            `"I knew it was ${soleVoter}'s decision by Tuesday. I spent the rest of the week convincing myself I had already made it for ${pronouns(soleVoter).obj}."`]
          : voice === 'volatile'
            ? [`"I thought I did. Apparently not."`,
              `"${soleVoter} looked me in the eye an hour before the vote. So no. No, I did not."`]
            : voice === 'sincere'
              ? [`"I believed I did. Not because of the game — because of who I thought we were in there. That is the part that stings."`,
                `"I thought I knew ${soleVoter}. One vote is a very efficient way to find out."`]
              : [`"I thought I did. Apparently not."`,
                `"Everything that week ran through ${soleVoter}, and I still called it wrong. That one is mine."`]),
      loaded: true,
    });
  }

  const blameBase = read.correct
    ? [
      `"${read.blamed}. I know it was ${pronouns(read.blamed).obj}, and I knew before I stood up."`,
      `"${read.blamed}. ${pronouns(read.blamed).Sub} was too comfortable this week. Nobody is that comfortable by accident."`,
    ]
    : [
      `"${read.blamed}. It has to be ${pronouns(read.blamed).obj}. There isn't anybody else it could be."`,
      `"${read.blamed}, and I'd put money on it. ${pronouns(read.blamed).Sub} has been running that house for a week and nobody has noticed."`,
    ];
  questions.push({
    q: hostQuestion(style, 'blame', { name: evictee }, rng),
    a: pickLayeredAnswer(rng,
      statFlavoredLines(evictee, 'blame', { blamed: read.blamed, correct: read.correct }),
      blameBase),
    wrong: !read.correct,
  });

  if (read.betrayedByAlly.length) {
    const traitor = read.betrayedByAlly[0];
    questions.push({
      q: style === 'warm'
        ? `"I need to ask you something difficult. You trusted ${traitor}. What would it mean if ${pronouns(traitor).sub} voted against you?"`
        : style === 'incisive'
          ? `"You are protecting ${traitor}. ${pronouns(traitor).Sub} voted you out. What do you say to ${pronouns(traitor).obj} now?"`
          : style === 'playful'
            ? `"You keep leaving ${traitor} off the suspect board. Should I lend you my notes?"`
            : `"You and ${traitor} were close. Would it change anything if ${pronouns(traitor).sub} voted against you?"`,
      a: pickLayeredAnswer(rng,
        statFlavoredLines(evictee, 'betrayal', { traitor }),
        voice === 'sincere'
          ? [`"I would want to hear why before I decided what it means. That relationship was bigger than one vote to me."`]
          : voice === 'analytical'
            ? [`"Then ${pronouns(traitor).sub} identified the moment our interests separated before I did. I can respect the move before I forgive it."`]
            : voice === 'volatile'
              ? [`"Then it is lucky there is a wall between us right now."`]
              : isNice(evictee)
                ? [`"${pronouns(traitor).Sub} wouldn't. I would need to see it before I believed it."`]
                : [`"Then ${pronouns(traitor).sub} had better hope ${pronouns(traitor).sub} wins, because I may get a vote at the end of this."`]),
      loaded: true,
    });
  }

  questions.push({
    q: hostQuestion(style, 'regret', { name: evictee }, rng),
    a: pickLayeredAnswer(rng,
      statFlavoredLines(evictee, 'regret', { blamed: read.blamed }),
      stats.strategic >= 6
      ? [
        `"I should've made my move a week earlier. I thought I was safe enough to wait, and I wasn't."`,
        `"I spent too much time counting votes and not enough time asking why people were avoiding me. I should've known something had changed."`,
        `"After the veto meeting, I let people tell me I was safe and stopped checking. I needed to keep having those conversations right up to the vote."`,
        `"I kept talking to the same people because they were giving me the answers I wanted. I should've gone to the people I wasn't comfortable with."`,
      ]
      : [
        `"I'd have talked to more people. I got comfortable with the ones who were easy to talk to."`,
        `"Honestly, I'd do most of it the same. I just wouldn't have trusted ${read.blamed} as much as I did."`,
        `"I would've asked more direct questions. I kept hoping people would volunteer the truth, and nobody does that in there."`,
      ]),
  });

  const identityAnswers = {
    analytical: [`"People saw the plans. They did not see how often I abandoned a better one because the room was not ready."`, `"That I was not cold. I was precise. There is a difference, even if it looks identical on television."`],
    defiant: [`"They thought being loud meant being careless. I knew exactly whose nerves I was touching."`, voteCount <= 2 ? `"They understood me perfectly. That is why they waited until there was almost nobody left to ask."` : `"They understood me perfectly. That is why it took all of them."`],
    social: [`"They thought the relationships were decoration. They were the game I was playing."`, `"That listening was strategy. I learned more over coffee than most people learned in meetings."`],
    volatile: [`"That every reaction was random. Some of them were extremely well earned."`, `"They kept calling me emotional when what they meant was inconveniently honest."`],
    underdog: [`"They mistook needing help for having no agency. I was still choosing every hand I took."`, `"That surviving is a move when the whole house has agreed you are supposed to disappear."`],
    sincere: [`"That loyalty was not weakness. It was a choice, and I knew the cost."`, `"I meant what I said in there. Maybe that made me easier to beat, but it did not make me fake."`],
    guarded: [`"They thought quiet meant comfortable. I was working; I just did not announce every shift."`, `"Probably nothing. If they misunderstood me, I gave them the material."`],
  };
  questions.push({
    q: hostQuestion(style, 'identity', { name: evictee }, rng),
    a: pickLayeredAnswer(rng,
      statFlavoredLines(evictee, 'identity'),
      identityAnswers[voice] || identityAnswers.guarded),
    personality: voice,
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
  // Who is in the chair, because the same message lands differently on
  // different people. Temperament decided the confession reaction and nothing
  // else was read at all: a villain, a hero and a goat all watched somebody
  // betray them and produced the same four lines.
  const evArch = players.find(x => x.name === evictee)?.archetype || '';
  const evVillain = isVillainous(evictee);
  const evNice = isNice(evictee);
  const goodbyes = goodbyeMessages(evictee, house, week, rng).map(g => {
    if (g.tone === 'montage') return { ...g, react: null };
    const withThem = bond(g.name, evictee);
    const wereAllied = sharesAlliance(g.name, evictee);

    const confessionReacts = temperVal <= 4
      ? [
        `${evictee} stands halfway up out of the chair before remembering there is nowhere to go with it.`,
        `"Play it again." Nobody plays it again. ${evictee} watches the dark screen anyway.`,
        `${evictee} points at the monitor and starts a sentence three different ways. None of them finish.`,
        `The audience reacts before ${evictee} does. Then ${evictee} does, and the host lets it run.`,
      ]
      : [
        `${evictee} watches the whole thing without blinking, then exhales like somebody setting down a heavy thing.`,
        `A slow nod. "Okay. Okay." The word means about nine different things.`,
        `${evictee} looks away from the screen exactly once, right at the word that costs the most.`,
        `"That's the one that gets me." Quietly, to nobody in particular.`,
        `${evictee} says "I know" to the screen, twice, and it is not clear ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} talking to the screen.`,
        `A long breath in. A longer one out. ${evictee} gestures at the monitor as if to say what would you like me to do with that.`,
        `${evictee} folds both arms and watches it the way you watch weather you have already been caught in.`,
        `"Yeah." That is all of it. ${evictee} does not add anything and the host does not ask.`,
      ];
    if (wereAllied) confessionReacts.push(
      `"We had an ALLIANCE." ${evictee} says it to the room, not the screen, and the room has no answer.`,
      `${evictee} counts something off on ${p.posAdj} fingers — weeks, probably — and then stops counting.`,
    );
    if (withThem >= 6) confessionReacts.push(
      `${evictee} says the name once, softly, the way you say a name you are going to keep saying for a while.`,
    );
    if (evVillain) confessionReacts.push(
      `${evictee} laughs — genuinely, warmly — and says "good" out loud. It is not clear ${p.sub} ${p.sub === 'they' ? 'mean' : 'means'} it kindly.`,
      `"There it is." ${evictee} looks almost relieved to have been right about somebody.`,
    );
    if (evNice) confessionReacts.push(
      `${evictee} nods along like ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} taking notes, then quietly says "that's alright" to a screen that has already gone dark.`,
    );

    const unapologeticReacts = [
      `${evictee} smiles at the screen with no warmth in it whatsoever. The jury exists, and both of them know it.`,
      `"Noted," ${evictee} says, in the voice people use for lists they intend to keep.`,
      `${evictee} applauds — three slow claps, precisely as sincere as the message.`,
      `An eyebrow, nothing else. Some messages answer themselves.`,
      `"Well, that's honest." ${evictee} says it like a scoreline rather than a compliment.`,
      `${evictee} mouths the last four words along with the screen, having apparently guessed them.`,
      `A short laugh with nothing funny in it. ${evictee} sits back and lets the tape finish alone.`,
      `${evictee} looks straight down the barrel of the camera instead of at the monitor. The message was not really the point.`,
    ];
    if (evVillain) unapologeticReacts.push(
      `"Good." ${evictee} means it. Somebody finally played the game at ${p.obj} properly.`,
      `${evictee} points at the screen and tells the host, flatly, "that one can win it. The rest of them can't."`,
    );
    if (temperVal <= 3) unapologeticReacts.push(
      `${evictee} is talking over the message before it finishes and does not stop when it does.`,
    );
    if (evArch === 'goat' || evArch === 'floater') unapologeticReacts.push(
      `${evictee} shrugs at the monitor. "Fair enough." It is the least dramatic thing anybody has said tonight.`,
    );
    if (withThem <= -4) unapologeticReacts.push(
      `${evictee} was already nodding before the sentence started. No surprises there, and no hard feelings either — they were hard a long time ago.`,
    );

    const warmReacts = [
      `${evictee} presses ${p.posAdj} sleeve to ${p.posAdj} eyes and waves at the screen like the screen can see.`,
      `That one lands. ${evictee} needs a second, and the host gives it.`,
      `"Oh, don't—" ${evictee} laughs and cries at the same time, which is the correct response.`,
      `${evictee} mouths a thank-you at the monitor. The friendship was real; the game just happened around it.`,
      `${evictee} puts a hand flat on the desk and leaves it there until the message has finished.`,
      `"I love ${p.obj === 'them' ? 'them' : p.obj}." Said to the studio, to the camera, to nobody, entirely without embarrassment.`,
      `${evictee} points at the screen, unable to speak for a moment, and the audience fills the gap.`,
      `A wet laugh. "They're going to be furious with me for crying at this."`,
    ];
    if (wereAllied) warmReacts.push(
      `"That's my person." ${evictee} says it to the audience, and the audience says it back.`,
    );
    if (evVillain) warmReacts.push(
      `${evictee} goes very still for a moment, which from ${p.obj} is the same as anybody else falling apart.`,
    );
    if (temperVal <= 4) warmReacts.push(
      `${evictee} makes a noise nobody was ready for and covers ${p.posAdj} whole face with both hands.`,
    );

    const politeReacts = [
      `${evictee} nods politely at the screen, filing the message under people who were never really in the story.`,
      `A small smile, nothing behind it. Some goodbyes are just administration.`,
      `${evictee} tilts a head at the screen — genuinely unsure, for a second, who that was.`,
      `Polite applause from the audience. ${evictee} matches it exactly.`,
      `"That's kind." ${evictee} means it and will not think about it again.`,
      `${evictee} gives the monitor a thumbs up. The monitor, being a monitor, does not respond.`,
      `A nod, a beat, and ${evictee} is already looking at the next screen.`,
      `${evictee} says the name back out loud, the way you do when you are making sure you have it right.`,
    ];
    if (withThem <= -4) politeReacts.push(
      `${evictee} raises both eyebrows at the sheer politeness of it, and lets the silence do the rest.`,
    );
    if (evArch === 'social-butterfly' || evArch === 'showmancer') politeReacts.push(
      `${evictee} says "aw" at somebody ${p.sub} spoke to maybe four times, and means it anyway.`,
    );

    return {
      ...g,
      react: g.tone === 'confession' ? freshReact(confessionReacts)
        : g.tone === 'unapologetic' ? freshReact(unapologeticReacts)
          : g.tone === 'warm' ? freshReact(warmReacts)
            : freshReact(politeReacts),
    };
  });

  // ── Where the car goes. ──
  //
  // This used to do the arithmetic again inline, off the post-eviction count,
  // and declared jury one eviction early: a seven-person jury was announced
  // from ten houseguests when the timeline had promised nine. The seating was
  // never affected — the finale clamps to jurySize — so the only symptom was
  // the tenth boot being told they were a juror on the way out the door.
  const joinsJury = evictionSeatsAJuror(house.length);
  const juryNumber = jurorOrdinalFor(house.length);

  const hostLines = {
    truth: _pick(rng, {
      balanced: ['"Before the goodbyes, there are a couple of things you should know."', '"Let me show you the part of the week you could not see."'],
      warm: ['"Some of this may be hard to hear, but you deserve to leave with the truth."', '"Before the messages, I want to give you the missing pieces."'],
      incisive: ['"Your read was incomplete. Here is what actually happened."', '"You named the move. Now let us name the people who made it."'],
      playful: ['"We have checked the tapes, and the tapes brought receipts."', '"Time for the least enjoyable answer key in television."'],
    }[style]),
    goodbyes: _pick(rng, {
      balanced: ['"Your housemates recorded some messages in case tonight went this way."', '"The people still inside had a chance to say goodbye."'],
      warm: ['"Some people in that house care about you very much. Let us hear from them."', '"Your housemates left messages for you. Take all the time you need."'],
      incisive: ['"You have heard their promises. Now hear what they recorded after making their decisions."', '"These messages were recorded after the votes began to settle."'],
      playful: ['"Your housemates recorded messages—some kinder than their ballots."', '"The house has prepared a farewell montage and, inevitably, several explanations."'],
    }[style]),
  };

  const partingPools = {
    analytical: joinsJury
      ? [`"I have better information now. Everybody left should be worried about what I do with it."`, `"The game is over for me. The evaluation is not."`]
      : [`"I lost the week before I lost the vote. I can admit that now."`, `"Good move. I would still like to see whether it was the right one."`],
    defiant: joinsJury
      ? [`"I am on the jury now. They wanted my vote more than they wanted me in the house—so they can earn it."`, `"They got me out. They did not get the last word."`]
      : [`"Tell them congratulations. Make sure they hear it in my voice."`, `"The house wanted peace and quiet. I give it three days."`],
    // Every voice gets a jury version, not just the two that had one.
    //
    // Walking out with a vote is the single biggest change that can happen to a
    // houseguest, and five of these seven used to leave saying exactly what
    // they would have said in week two. The phrasing stays theirs — the social
    // player thinks about the people, the volatile one is still furious, the
    // underdog still cannot quite believe the run — but all of them now know
    // what they are carrying out of the door.
    social: joinsJury
      ? [`"I am not out of this. I am just watching it from a different room, with a vote in my pocket."`, `"Every one of them was nice to me on the way out. They are going to need me to remember which ones meant it."`]
      : [`"The game ended. The relationships did not all end with it. I will sort out which are which."`, `"I walked in wanting people. I am leaving knowing exactly what people can do."`],
    volatile: joinsJury
      ? [`"They should be glad I have a few weeks to calm down before I have to write anybody's name on anything."`, `"I have several last words and now I have somewhere to spend them."`]
      : [`"I have several last words. Production has requested one."`, `"Ask me again after I stop hearing that vote in my head."`],
    underdog: joinsJury
      ? [`"Nobody thought I would make jury. Now they have to come and ask me for something."`, `"I was not supposed to be here long enough to matter at the end. Somebody miscounted."`]
      : [`"I was not supposed to last this long. I just wish I had stopped believing that sentence."`, `"They finally got me. It took them long enough."`],
    sincere: joinsJury
      ? [`"I want to give this vote to somebody who earned it. That is the only job I have left and I intend to do it properly."`, `"I lost the game tonight. I would still like to help decide who wins it."`]
      : [`"I would do it again. All of it. I might just ask better questions."`, `"I lost a game. I do not want to lose the good parts with it."`],
    guarded: joinsJury
      ? [`"I will be watching. That is all anybody needs to know."`, `"They will find out what I think about it at the end, same as everybody else."`]
      : [`"Play hard. That is all I have got."`, `"I will know what I think when I have seen what actually happened."`],
  };

  return {
    evictee, host, hostStyle: style, hostProfile: BB_HOST_STYLES[style], hostLines, evicteeVoice: voice, blindsided,
    blamed: read.blamed, blameCorrect: read.correct,
    betrayedBy: read.betrayedByAlly,
    votes: { ...(week.votes || {}) },
    walkout,
    questions,
    truth,
    goodbyes,
    joinsJury,
    // Which juror they are, so the broadcast can say FIRST MEMBER OF THE JURY
    // and then count rather than repeating the same sentence for all seven.
    juryNumber,
    // The evictee's parting shot, which the jury will hear about.
    parting: pickLayeredAnswer(rng,
      statFlavoredLines(evictee, 'parting', { joinsJury }),
      partingPools[voice] || partingPools.guarded),
  };
}
