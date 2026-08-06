// ══════════════════════════════════════════════════════════════════════
// bb/last-words.js — the thing they say on the way out of the door
// ══════════════════════════════════════════════════════════════════════
//
// Total Drama has had this for a long time (checkTribalBlowup in episode.js):
// somebody who has just been voted out stands up and burns the game down on
// their way to the boat, and what they shout is TRUE — it reads the real
// alliance, the real organiser, the real idol. That works there because the
// votes are read out loud, so an evictee genuinely watched who did it.
//
// In this house the vote is secret. Nobody has ever seen a ballot except their
// own. So a houseguest who stands up at the door and names the person who ran
// their eviction is not reporting — they are GUESSING, out of a week of
// campaigning and lies and a count that only adds up so many ways. Sometimes
// they nail it. After a well-run blindside they walk out screaming at the
// person who fought hardest to keep them, which protects the architect and
// destroys an innocent — and that is the correct reward for running a tight
// vote, not a bug to be smoothed over.
//
// The other half is who is listening. There is no roll for "does the house
// believe it", because a house does not believe things collectively. Each
// person weighs it against their trust in the person shouting and their bond
// with the person being named, and the same sentence lands four different ways
// around one sofa: an ally of the accused waves it off, somebody with no read
// files it away, somebody close to BOTH is left stuck, and somebody who already
// suspected it hears a confession. Every one of those is a consequence.
//
// Nothing in here is a threshold. The trigger is a probability, belief is a
// continuous score, and archetype multiplies terms rather than gating them —
// with one exception, which is a rule of the project and not a knob: nice
// archetypes never knowingly fabricate an accusation, because fabricating is
// scheming. They can still be completely wrong, because their beliefs can be.

import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getBond, getPerceivedBond, addBond } from '../bonds.js';
import { believedVoters, believesDeal, believedHunters, learnBBVote,
  recordBBFalseClaim, stableRng } from './knowledge.js';
import { dealBetween } from './deals.js';
import { rememberBBStrategy, setBBTarget } from './shared-strategy.js';
import { seedJurorReads, moveRead } from './jury-sentiment.js';
import { evictionSeatsAJuror } from './jury.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const clamp01 = v => clamp(v, 0, 1);
const archetypeOf = name => players.find(p => p.name === name)?.archetype || 'floater';

// Who fabricates. Not a style preference — the project's archetype rule: a
// villain, mastermind or schemer may invent an accusation for damage; a nice
// archetype never does, and a neutral one only with the strategy and the
// missing loyalty to match.
const FABRICATORS = new Set(['villain', 'mastermind', 'schemer']);
function mayFabricate(name) {
  if (FABRICATORS.has(archetypeOf(name))) return true;
  const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
  if (NICE.has(archetypeOf(name))) return false;
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}

// How loudly each archetype goes out. An amplifier on a probability, never a
// gate — every archetype can blow up, and every archetype can leave quietly.
const RATE = {
  villain: 1.5, mastermind: 1.35, schemer: 1.4, hothead: 1.6, 'chaos-agent': 1.55,
  hero: 1.0, 'loyal-soldier': 1.0, underdog: 1.05, 'social-butterfly': 0.95,
  showmancer: 0.95, 'challenge-beast': 1.0, wildcard: 1.2,
  'perceptive-player': 0.6, goat: 0.5, floater: 0.55,
};

// How much what they say is worth listening to, before the listener's own
// opinion of them. A perceptive player's read is usually right; a hothead's
// usually is not.
const ACCURACY = {
  'perceptive-player': 1.5, mastermind: 1.25, schemer: 1.15, villain: 1.05,
  'loyal-soldier': 1.0, hero: 1.0, 'social-butterfly': 1.0, showmancer: 0.95,
  underdog: 0.95, 'challenge-beast': 0.9, floater: 0.85, goat: 0.8,
  wildcard: 0.8, hothead: 0.7, 'chaos-agent': 0.65,
};

// How hard a listener defends somebody they are close to.
const DEFENDS = {
  'loyal-soldier': 1.5, hero: 1.3, showmancer: 1.3, 'social-butterfly': 1.2,
  underdog: 1.1, goat: 1.1, floater: 1.0, 'challenge-beast': 1.0, hothead: 0.95,
  'perceptive-player': 0.85, wildcard: 0.85, villain: 0.7, schemer: 0.65,
  mastermind: 0.6, 'chaos-agent': 0.6,
};

// How well a listener resists a claim that is not actually true. Intuition
// does most of this work; archetype tilts it.
const SKEPTICISM = {
  'perceptive-player': 1.6, mastermind: 1.3, schemer: 1.25, villain: 1.1,
  hero: 0.95, 'challenge-beast': 0.95, wildcard: 0.9, floater: 0.9,
  'social-butterfly': 0.85, hothead: 0.8, showmancer: 0.8, underdog: 0.8,
  'loyal-soldier': 0.75, goat: 0.7, 'chaos-agent': 0.7,
};

const rateOf = n => RATE[archetypeOf(n)] ?? 1;
const accuracyOf = n => ACCURACY[archetypeOf(n)] ?? 1;
const defendsOf = n => DEFENDS[archetypeOf(n)] ?? 1;
const skepticOf = n => SKEPTICISM[archetypeOf(n)] ?? 1;

function suspicionOf(observer, subject) {
  const key = `${observer}→${subject}`;
  return Number(gs.bb?.house?.suspicion?.[key]) || 0;
}
function bumpSuspicion(observer, subject, delta) {
  if (!observer || !subject || observer === subject) return;
  gs.bb ||= {}; gs.bb.house ||= {}; gs.bb.house.suspicion ||= {};
  const key = `${observer}→${subject}`;
  gs.bb.house.suspicion[key] = clamp((gs.bb.house.suspicion[key] || 0) + Number(delta || 0), 0, 10);
}

// ── the trigger ───────────────────────────────────────────────────────

/**
 * How badly this blindsided them.
 *
 * Not the raw margin. Being voted out nine to nothing by a house that never
 * liked you is a result; being voted out five to four by two people you trusted
 * is the thing that makes somebody stand up. So the votes against are weighted
 * by how close the evictee was to whoever cast them, and knowing it was coming
 * takes the surprise back out.
 */
function blindsideOf(week, evictee) {
  const ballots = (week.ballots || []).filter(b => b.evict === evictee);
  const total = (week.ballots || []).length || 1;
  const betrayal = ballots.reduce((sum, b) =>
    sum + Math.max(0, getBond(evictee, b.voter)) / 10, 0) / total;
  const margin = ballots.length / total;
  // They saw it coming if they believed somebody was hunting them.
  const foreknowledge = clamp01(believedHunters(evictee).length / 3);
  return clamp01(betrayal * 1.3 + margin * 0.35 - foreknowledge * 0.5);
}

/**
 * Whether they go off, and in which register.
 *
 * Boldness is a decision — "I have something to say before I go". Low
 * temperament is a failure to hold it in. Both scale, both are multiplied by
 * how blindsided they were, and which term dominated only chooses the words.
 */
function triggerOf(week, evictee, rng) {
  const s = pStats(evictee);
  const bold = (s.boldness / 10) * 0.62;
  const heat = ((10 - s.temperament) / 10) * 0.62;
  const blindside = blindsideOf(week, evictee);
  const chance = clamp01((bold + heat) * blindside * rateOf(evictee));
  const roll = rng();
  return {
    fires: roll < chance,
    chance, roll, blindside,
    register: heat > bold ? 'explosion' : 'callout',
  };
}

// ── what they think they know ─────────────────────────────────────────

/**
 * A last go at working out the count.
 *
 * Standing at the door with a number in their head, they try to make the
 * arithmetic name somebody. Deduction is already a first-class way to learn a
 * ballot in this house (learnBBVote records it as `deduced`, below being told),
 * and how good somebody is at it is exactly what mental and intuition are for.
 * It can also produce a confident wrong answer, which is the point.
 */
function deduceVotes(week, evictee, rng) {
  const s = pStats(evictee);
  const skill = clamp01((s.mental / 10) * 0.5 + (s.intuition / 10) * 0.6);
  for (const ballot of week.ballots || []) {
    if (ballot.voter === evictee) continue;
    if (rng() < skill * 0.55) {
      try { learnBBVote(evictee, ballot.voter, evictee, week.num || 0, rng); } catch { /* stays a mystery */ }
    }
  }
}

/**
 * Every accusation this person could honestly make, drawn from belief.
 *
 * Each candidate carries what it would cost the accused and how sure the
 * speaker is, so the pick can prefer the thing they are angriest and most
 * certain about without ever consulting whether it is true.
 */
function candidateReveals(week, evictee) {
  const house = (gs.activePlayers || []).filter(n => n !== evictee);
  const out = [];

  // Who ran it. Whoever they believe wrote their name and was closest to them
  // is the one that hurts enough to say out loud.
  const believed = believedVoters(evictee, evictee).filter(n => house.includes(n));
  if (believed.length) {
    const named = believed.slice().sort((a, b) =>
      (getBond(evictee, b) + suspicionOf(evictee, b) * 0.5)
      - (getBond(evictee, a) + suspicionOf(evictee, a) * 0.5))[0];
    out.push({ type: 'organizer', accused: named, weight: 3.2, confidence: 0.9 });
  }

  // Somebody who said one thing and did another. They heard the promise; the
  // ballot is the part they are guessing at.
  for (const ballot of week.ballots || []) {
    if (!ballot.stated || ballot.stated === ballot.evict) continue;
    if (ballot.evict !== evictee || !house.includes(ballot.voter)) continue;
    if (!believed.includes(ballot.voter)) continue;
    out.push({ type: 'flipper', accused: ballot.voter, weight: 3.0, confidence: 0.85 });
  }

  // A group they think has been a group for weeks.
  for (const alliance of gs.namedAlliances || []) {
    if (alliance.active === false) continue;
    const members = (alliance.members || []).filter(n => house.includes(n));
    if (members.length < 2) continue;
    const suspicion = members.reduce((sum, m) => sum + suspicionOf(evictee, m), 0) / members.length;
    if (suspicion <= 0.4) continue;
    out.push({ type: 'alliance', accused: members[0], members, label: alliance.name,
      weight: 2.4 + suspicion * 0.2, confidence: clamp01(suspicion / 6) });
  }

  // A promise about the end that they were never supposed to hear about.
  for (const a of house) {
    for (const b of house) {
      if (a >= b) continue;
      if (!believesDeal(evictee, a, b)) continue;
      out.push({ type: 'deal', accused: a, partner: b, weight: 3.4, confidence: 0.8 });
    }
  }

  // And the version with no strategy in it at all, which is always available.
  const closest = house.slice().sort((x, y) => getBond(evictee, y) - getBond(evictee, x))[0];
  if (closest) out.push({ type: 'personal', accused: closest, weight: 1.4, confidence: 1 });

  return out;
}

/** Is the thing they just shouted actually true? */
function evaluateTruth(week, reveal) {
  const against = (week.ballots || []).filter(b => b.evict === week.evicted);
  switch (reveal.type) {
    case 'organizer':
      return against.some(b => b.voter === reveal.accused);
    case 'flipper': {
      const ballot = (week.ballots || []).find(b => b.voter === reveal.accused);
      return !!ballot && !!ballot.stated && ballot.stated !== ballot.evict;
    }
    case 'alliance': {
      const alliance = (gs.namedAlliances || []).find(a => a.name === reveal.label);
      return !!alliance && alliance.active !== false;
    }
    case 'deal':
      return !!dealBetween(reveal.accused, reveal.partner);
    default:
      return null; // a personal parting shot has nothing to be right about
  }
}

/**
 * The accusation a fabricator invents.
 *
 * Villain archetypes only (and neutrals with the strategy and without the
 * loyalty). They are not reporting a belief — they are picking the person whose
 * game is most worth wrecking and saying whatever will do it.
 */
function fabricate(week, evictee) {
  const house = (gs.activePlayers || []).filter(n => n !== evictee);
  if (house.length < 2) return null;
  const scored = house.map(n => {
    const s = pStats(n);
    // Trusted and dangerous is the ideal thing to poison.
    const standing = house.reduce((sum, other) => sum + Math.max(0, getBond(other, n)), 0) / house.length;
    return { n, score: standing * 1.2 + (s.strategic + s.social) / 10 };
  }).sort((a, b) => b.score - a.score);
  const accused = scored[0].n;
  const partner = scored.slice(1).sort((a, b) => getBond(b.n, accused) - getBond(a.n, accused))[0]?.n;
  if (!partner) return null;
  return { type: 'deal', accused, partner, weight: 4, confidence: 1, fabricated: true };
}

// ── the room ──────────────────────────────────────────────────────────

/**
 * What one listener makes of it.
 *
 * Trust in the person shouting, weighed against closeness to the person being
 * named, plus whatever they already suspected. Everything is continuous; the
 * label at the end is for choosing a sentence and nothing else.
 */
function resolveBelief(listener, speaker, reveal, isTrue, rng) {
  const trust = getPerceivedBond(listener, speaker) / 10;
  const speakerStats = pStats(speaker);
  const credibility = (speakerStats.social / 10) * 0.55 + accuracyOf(speaker) * 0.55;
  const closeness = getBond(listener, reveal.accused) / 10;
  const prior = suspicionOf(listener, reveal.accused) / 10;
  const listenerStats = pStats(listener);

  // Somebody sharp is harder to sell something false to, and slightly readier
  // to accept something true — the same term either way, signed by the facts.
  const nose = (listenerStats.intuition / 10) * skepticOf(listener);
  const smell = isTrue === false ? -nose * 0.9 : isTrue === true ? nose * 0.35 : 0;

  const forTerm = trust * credibility * 1.6 * reveal.confidence;
  const againstTerm = closeness * defendsOf(listener) * 1.4;
  const belief = forTerm - againstTerm + prior * 1.2 + smell + (rng() - 0.5) * 0.9;

  // "Conflicted" is not a fifth outcome. It is what this formula produces when
  // both terms are big: somebody they trust has named somebody they love.
  const conflicted = forTerm > 0.55 && againstTerm > 0.55;
  // The label picks the SENTENCE, and it has to agree with the number, because
  // the screen groups people by the number. It did not: a listener over the
  // line with no prior suspicion fell through to 'doubt-planted' and ended up
  // filed under BOUGHT IT while saying something noncommittal — so a band
  // reading "six people bought it" quoted a shrug. Prior suspicion now chooses
  // BETWEEN two convinced registers instead of demoting one of them out of
  // being convinced at all.
  const label = conflicted ? 'conflicted'
    : belief > 0.55 ? 'confirmed'
      : belief < -0.25 ? 'dismissed' : 'doubt-planted';
  return { belief, label, forTerm, againstTerm, conflicted, prior };
}

/**
 * And what that does to them.
 *
 * Every listener gets the same KIND of outcome, scaled by how far their belief
 * landed from zero. Nobody crosses a line into a different category of
 * consequence — the dismissive one defends harder, the convinced one starts
 * building a week around it, and the difference between them is a magnitude.
 */
function applyReaction(listener, speaker, reveal, reaction, week, rng) {
  const size = Math.abs(reaction.belief);
  const accused = reveal.accused;
  if (listener === accused) return;

  if (reaction.belief > 0) {
    bumpSuspicion(listener, accused, size * 1.6);
    addBond(listener, accused, -size * 0.8);
    try {
      rememberBBStrategy(listener, accused, 'named-on-the-way-out', Math.min(4, size * 2.5),
        { by: speaker, kind: reveal.type }, { week });
    } catch { /* the suspicion still stands */ }
    // Whether it becomes a plan is a roll against how convinced they are, not
    // a threshold anybody crosses.
    if (rng() < clamp01(size * 0.45)) {
      try { setBBTarget(listener, accused, `named by ${speaker} on the way out`, { week }); } catch { /* no plan */ }
    }
    if (reaction.conflicted) {
      // Torn, and it does not resolve tonight. The strain is real in both
      // directions and the jury house is where it gets settled.
      addBond(listener, accused, size * 0.3); // pulled back toward the friend
    }
  } else {
    // Waved off — and defending somebody out loud brings you closer to them.
    addBond(listener, accused, size * 0.5);
    bumpSuspicion(listener, accused, -size * 0.4);
  }
}

// ── the words ─────────────────────────────────────────────────────────

const pick = (rng, list) => list[Math.floor(rng() * list.length) % list.length];

/**
 * A picker that will not say the same thing twice in one scene.
 *
 * Ten people react to one blowup, and a plain pick() over three variants put
 * the identical sentence on five of them — a room of strangers agreeing word
 * for word, which reads as a bug even though every line was fine on its own.
 * Exhaust the pool and it starts reusing rather than running out of room to
 * react in.
 */
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
const P = name => { try { return pronouns(name); } catch { return { sub: 'they', obj: 'them', posAdj: 'their', Sub: 'They' }; } };

function speechFor(reveal, speaker, register, rng) {
  const a = reveal.accused;
  if (reveal.type === 'organizer') {
    return register === 'explosion' ? pick(rng, [
      `"Are you KIDDING me? ${a}! It was ${a}, it has been ${a} every single week, and every one of you just does what ${P(a).sub} says!"`,
      `"Oh, I'm going? Fine. ${a} is sitting right there laughing at all of you. ALL of you."`,
      `"Don't — don't hug me. ${a} ran this. ${P(a).Sub} ran it and you all held the door open."`,
    ]) : pick(rng, [
      `"Before I go. ${a} has been calling every vote in this house, and half of you don't know you're playing ${P(a).posAdj} game."`,
      `"One thing. Whatever ${a} told you tonight — ${P(a).sub} told me the opposite this afternoon. Work out why."`,
      `"You'll all figure out it was ${a}. I'd just rather you figured it out now."`,
    ]);
  }
  if (reveal.type === 'flipper') {
    return register === 'explosion' ? pick(rng, [
      `"${a}! You looked me in the face this morning! You SAID it! And you wrote my name anyway!"`,
      `"I want everyone to watch ${a}'s face right now. Go on. Watch it."`,
    ]) : pick(rng, [
      `"${a} promised me that vote to my face. Remember that the next time ${P(a).sub} promises you one."`,
      `"I'm not angry about the vote. I'm telling you what ${a}'s word is worth, because you'll need to know."`,
    ]);
  }
  if (reveal.type === 'alliance') {
    const names = (reveal.members || [a]).join(', ');
    return register === 'explosion' ? pick(rng, [
      `"${names}. That's it. That's the whole house. You've been a group since week two and the rest of you are furniture!"`,
      `"Count them! ${names}! How do you think the votes keep landing the same way?"`,
    ]) : pick(rng, [
      `"Look at who's left. ${names} have been working together for weeks. Whoever isn't in that list — you're next."`,
      `"There's a group in this house: ${names}. I'd start counting if I were the rest of you."`,
    ]);
  }
  if (reveal.type === 'deal') {
    return register === 'explosion' ? pick(rng, [
      `"Ask ${a} about the final two with ${reveal.partner}! Go on, ASK ${P(a).obj}!"`,
      `"${a} and ${reveal.partner} have been going to the end together this whole time and you're all fighting over the scraps!"`,
    ]) : pick(rng, [
      `"One piece of information, free. ${a} and ${reveal.partner} have a final two. Everything either of them has told you was built on that."`,
      `"Before the door — ${a} and ${reveal.partner} are going to the end together. Do what you like with it."`,
    ]);
  }
  return register === 'explosion' ? pick(rng, [
    `"${a}, I actually cared about you in here. That's the part I'm taking with me."`,
    `"I don't care about the game. I care that it was ${a}."`,
  ]) : pick(rng, [
    `"${a} — I hope it was worth it. I really do."`,
    `"No speech. I just want ${a} to know that I know."`,
  ]);
}

function reactionText(listener, speaker, reveal, reaction, draw) {
  const a = reveal.accused;
  switch (reaction.label) {
    case 'dismissed': return draw('dismissed', [
      `${listener} does not even look up. "${P(speaker).Sub} would say anything right now."`,
      `${listener} scoffs and moves closer to ${a}. Whatever that was, it was not evidence.`,
      `"That's a bitter person talking," ${listener} says, loud enough for ${a} to hear it and be grateful.`,
      `${listener} rolls ${P(listener).posAdj} eyes at the ceiling and mouths something to ${a} that looks a lot like "ignore it".`,
      `${listener} is already talking over the end of it. Nothing said on the way out of a door has ever been true in ${P(listener).posAdj} experience.`,
      `${listener} puts a hand on ${a}'s shoulder without saying anything, which says it.`,
      `"People say things when they lose," ${listener} offers, to nobody, in the flattest voice available.`,
      `${listener} laughs once, sharply, and goes to get a glass of water.`,
    ]);
    // Two registers, because being convinced arrives two different ways. The
    // person who already suspected it hears a confirmation; the person who did
    // not hears news. Quoting an "I knew it" line at somebody with no prior
    // suspicion was the other half of the band-versus-sentence mismatch.
    case 'confirmed': return (reaction.prior || 0) > 0.35
      ? draw('confirmed-knew', [
        `${listener} goes very still. It is not news — it is the first time somebody else has said it out loud.`,
        `${listener} nods once at the floor. ${P(listener).Sub} has thought that about ${a} for two weeks.`,
        `${listener} looks straight at ${a} and does not look away. That was a confession as far as ${P(listener).sub} is concerned.`,
        `${listener} mouths "I knew it" at the wall, where no camera is supposed to be.`,
        `${listener} files it under confirmed, and starts counting the votes for next Thursday before the door has shut.`,
        `"Right," says ${listener}, very quietly, and does not elaborate for anybody.`,
      ])
      : draw('confirmed-new', [
        `Something settles behind ${listener}'s face. The last piece of a week ${P(listener).sub} could not make add up.`,
        `${listener} had no opinion about ${a} an hour ago. ${P(listener).Sub} has a very firm one now.`,
        `${listener} believes it immediately, and is visibly annoyed at how obvious it suddenly looks.`,
        `${listener} turns to look at ${a} for the first time all night, and keeps looking.`,
        `"Huh," says ${listener}, in the tone of somebody rearranging the entire week.`,
        `${listener} does not react at all, which for ${P(listener).obj} is the loudest available reaction.`,
      ]);
    case 'conflicted': return draw('conflicted', [
      `${listener} is caught between two people ${P(listener).sub} trusts, and there is nowhere to put ${P(listener).posAdj} face.`,
      `${listener} glances at ${a}, then at the door, then at nothing. Both of those people were supposed to be safe.`,
      `${listener} says nothing at all, which everybody in the room notices.`,
      `${listener} starts a sentence in ${a}'s defence and does not finish it.`,
      `${listener} wants very badly for that to be a lie, and cannot quite get there.`,
      `${listener} keeps looking at ${a} out of the side of ${P(listener).posAdj} eye for the rest of the night.`,
      `${listener} has just been asked to choose between two people, by somebody who will not be here to see which way it went.`,
      `${listener} folds ${P(listener).posAdj} arms and stares at the carpet like it owes ${P(listener).obj} an answer.`,
    ]);
    default: return draw('doubt', [
      `${listener} files it away without a word. It might be nothing. It might not.`,
      `${listener} tilts ${P(listener).posAdj} head slightly. Not convinced — but not un-convinced either.`,
      `${listener} keeps clapping the way you do when you are thinking about something else entirely.`,
      `${listener} does the maths on ${P(listener).posAdj} fingers, discreetly, against ${P(listener).posAdj} leg.`,
      `${listener} looks at ${a} for slightly too long and then looks away, having decided nothing.`,
      `${listener} will not act on that tonight. ${P(listener).Sub} will remember it on Thursday.`,
      `${listener} makes a note of it the way you note a name you keep hearing.`,
      `${listener} shrugs, but the shrug takes a moment too long to arrive.`,
      `Whatever ${listener} thinks of it stays behind ${P(listener).posAdj} face, where it is no use to anybody.`,
    ]);
  }
}

function responseFor(reveal, accused, kind, rng) {
  if (kind === 'own') return pick(rng, [
    `${accused} does not blink. "Yes. It was me. That's the game — I'd rather you heard it from me than argued about it for a week."`,
    `"Every word of that is true," ${accused} says to the room. "And I'd do it again on Thursday."`,
  ]);
  if (kind === 'deflect') return pick(rng, [
    `${accused} lets out a long breath. "That's a hard night talking. I'm not going to fight with somebody on their way out of the door."`,
    `${accused} shakes ${P(accused).posAdj} head slowly, sadly, at nobody in particular — a performance of being above it.`,
  ]);
  return pick(rng, [
    `"That is not true," ${accused} says flatly, to everybody and nobody. "That is not what happened."`,
    `${accused} is already talking before the door shuts. "I did not do that. I'm not letting that be the last thing anybody hears."`,
  ]);
}

// ── the confrontation ─────────────────────────────────────────────────
//
// Without this the room reacts and the night ends. Fourteen people privately
// update their opinion of somebody and not one of them does anything about it,
// which is why even a good reaction card reads as texture rather than as an
// event. A confrontation is the thing that turns the split into something that
// happened.
//
// The person who starts it is NOT the most convinced — it is the most
// BETRAYED. Somebody who believed the accusation and was close to the accused
// an hour ago has had something taken from them; somebody who believed it about
// a person they never liked has merely had a suspicion confirmed, and confirmed
// suspicions do not make anybody stand up in a living room.
//
// It has to stay rare. If every blowup ends in a shouting match then the
// shouting stops meaning anything, so the roll is deliberately hard to pass and
// only the top candidate ever gets to make it.

// Who raises their voice. An amplifier on a probability, not a gate: a
// loyal-soldier who feels genuinely betrayed can absolutely start one.
const CONFRONTS = {
  hothead: 1.7, 'chaos-agent': 1.45, villain: 1.3, wildcard: 1.25,
  'challenge-beast': 1.15, mastermind: 1.0, schemer: 1.0, hero: 1.05,
  'loyal-soldier': 1.1, underdog: 0.95, 'social-butterfly': 0.9,
  showmancer: 0.9, 'perceptive-player': 0.75, floater: 0.5, goat: 0.4,
};

/**
 * Somebody says it out loud.
 *
 * @returns {object|null} the scene, or null if the room stays civil
 */
function checkConfrontation(week, reveal, reactions, rng, isTrue) {
  const accused = reveal.accused;
  if (reveal.type === 'personal' || !(gs.activePlayers || []).includes(accused)) return null;

  const scored = reactions
    .filter(r => r.belief > 0 && r.listener !== accused)
    .map(r => {
      const s = pStats(r.listener);
      // Betrayal, not conviction: belief times how much they had invested in
      // the person who has just been named.
      //
      // The baseline matters. As a bare multiplier this made the whole
      // mechanic UNREACHABLE in any house where the two were not already
      // close — bond 0 meant heat 0 meant no fight was possible however
      // convinced anybody was — and a mechanic that cannot fire is worse than
      // one that fires too often. Betrayal still does most of the work; the
      // floor leaves room for somebody to square up on principle.
      const invested = 0.18 + (Math.max(0, getBond(r.listener, accused)) / 10) * 0.82;
      const nerve = (s.boldness / 10) * 0.6 + ((10 - s.temperament) / 10) * 0.6;
      return { ...r, heat: r.belief * invested * nerve * (CONFRONTS[archetypeOf(r.listener)] ?? 1) };
    })
    .sort((a, b) => b.heat - a.heat);

  const top = scored[0];
  if (!top || top.heat <= 0) return null;
  // Calibrated against measurement rather than intuition. Across ten played
  // seasons the best candidate's heat lands between 0.08 and 0.15 — belief
  // itself is rarely above 0.7 and the other two terms are fractions — so the
  // 0.85 this started with was a one-in-ten chance and produced ZERO fights in
  // twenty-four blowups, which is indistinguishable from a broken feature.
  //
  // At the gain below, measured over the same ten seasons: 7 fights from 28
  // blowups. That is one in four overall and one in two of the ones that can
  // start anything (half are the purely personal kind, which cannot), or about
  // two fights every three seasons — often enough to be part of the format,
  // rare enough that the room going quiet still means something.
  if (rng() >= clamp01(top.heat * 9)) return null;

  const challenger = top.listener;
  const aS = pStats(accused);
  // How the accused plays it, which is the same question the response card
  // asked but with the room now watching a fight rather than a speech.
  const ownIt = isTrue === true && rng() < clamp01((aS.boldness / 10) * 0.5);
  const kind = ownIt ? 'owns' : rng() < clamp01(aS.social / 13) ? 'turns' : 'denies';

  const opener = pick(rng, [
    `"No — say it again." ${challenger} is on ${P(challenger).posAdj} feet before the door has finished closing. "Say it to my face, because I have been defending you for three weeks."`,
    `${challenger} does not wait for the room to settle. "Was that true? Look at me and tell me that was not true."`,
    `"I want to hear it from you," ${challenger} says, and the living room goes very quiet very fast.`,
    `${challenger} puts a glass down harder than ${P(challenger).sub} means to. "That is twice now. Twice I've heard your name and told people they were wrong."`,
  ]);
  const answer = kind === 'owns' ? pick(rng, [
    `"Yes," says ${accused}. "It was me. You'd have done it if you'd had the numbers, and you know that."`,
    `${accused} does not flinch. "It's true. I'm not going to stand here and insult you by pretending it isn't."`,
  ]) : kind === 'turns' ? pick(rng, [
    `"You're doing this now? On the word of somebody who just lost?" ${accused} turns to the room. "Listen to what's actually happening here."`,
    `${accused} does not raise ${P(accused).posAdj} voice, which somehow makes it worse. "I think you wanted a reason. I think you've been waiting for one."`,
  ]) : pick(rng, [
    `"That is a LIE," ${accused} says, over the top of ${P(challenger).obj}. "That is a lie and you are letting somebody play you from the doorway."`,
    `${accused} is shouting now too. "I did not do that! You've known me for six weeks — six weeks — and this is what it takes?"`,
  ]);
  const close = pick(rng, [
    `Somebody says the word bedtime. Nobody moves. It ends the way these end — with both of them still talking and nothing settled.`,
    `Two houseguests get between them. The rest of the room has already started deciding who was right.`,
    `${challenger} walks out to the backyard mid-sentence. ${accused} stays exactly where ${P(accused).sub} is, which the room also notices.`,
    `It stops as suddenly as it started, and everybody in that room understands the week has changed shape.`,
  ]);

  // ── what it costs, and it costs BOTH of them ──
  const size = Math.abs(top.belief);
  addBond(challenger, accused, -(1.6 + size));
  bumpSuspicion(challenger, accused, 1.4 + size);
  try {
    rememberBBStrategy(challenger, accused, 'confronted-in-public', Math.min(5, 2 + size),
      { over: reveal.type }, { week });
  } catch { /* the fight happened anyway */ }
  // Going public on an evictee's word is a bet. If the accusation was false,
  // the challenger has just torched a real relationship over nothing — and the
  // people who waved it off watched them do it.
  for (const r of reactions) {
    if (r.listener === challenger) continue;
    if (r.belief < 0) {
      addBond(r.listener, challenger, -(0.4 + (isTrue === false ? 0.5 : 0)));
      bumpSuspicion(r.listener, challenger, 0.5);
    } else if (r.conflicted) {
      // The fight is exactly the pressure that gets somebody off the fence —
      // and watching it happen pushes them toward the person shouting.
      r.belief += 0.5 * (1 - clamp01(Math.abs(r.belief)));
      bumpSuspicion(r.listener, accused, 0.8);
      r.movedByConfrontation = true;
    }
  }
  if (seasonConfig.popularityEnabled !== false) {
    gs.popularity ||= {};
    gs.popularity[challenger] = (gs.popularity[challenger] || 0) + (isTrue === false ? -0.5 : 0.4);
    gs.popularity[accused] = (gs.popularity[accused] || 0) + (kind === 'owns' ? 0.3 : -0.4);
  }

  return { challenger, accused, kind, opener, answer, close,
    wasTrue: isTrue, heat: Number(top.heat.toFixed(3)) };
}

// ── the event ─────────────────────────────────────────────────────────

/**
 * Last words at the door, and what the room did with them.
 *
 * Attached to the eviction act, so it travels into episode history with
 * everything else the night produced and the screen can draw it in place —
 * between the verdict and the front door, which is where it happens.
 *
 * @returns {object|null} the record, or null if they left quietly
 */
export function checkBBLastWords(week, rngIn) {
  const evictee = week?.evicted;
  if (!evictee || !(gs.activePlayers || []).length) return null;
  const rng = rngIn || stableRng('lastwords', evictee, week.num || 0);

  const trigger = triggerOf(week, evictee, rng);
  if (!trigger.fires) return null;

  deduceVotes(week, evictee, rng);

  let reveal = null;
  const fabricated = mayFabricate(evictee) && rng() < 0.35;
  if (fabricated) reveal = fabricate(week, evictee);
  if (!reveal) {
    const candidates = candidateReveals(week, evictee);
    if (!candidates.length) return null;
    const total = candidates.reduce((s, c) => s + c.weight, 0);
    let roll = rng() * total;
    reveal = candidates.find(c => (roll -= c.weight) <= 0) || candidates[0];
  }
  if (!reveal?.accused) return null;

  // A fabrication is usually false, but not by construction — a schemer can
  // invent an accusation that happens to be correct, and the house has no way
  // to tell the difference either.
  const isTrue = evaluateTruth(week, reveal);
  const speech = speechFor(reveal, evictee, trigger.register, rng);

  // A fabrication is a lie on the record, so the house can discover it later
  // rather than the simulation quietly agreeing with the liar.
  if (reveal.fabricated && isTrue === false) {
    try { recordBBFalseClaim(evictee, reveal.accused, { week: week.num || 0 }); } catch { /* still said out loud */ }
  }

  // ── the room ──
  const listeners = (gs.activePlayers || []).filter(n => n !== evictee && n !== reveal.accused);
  const reactions = [];
  // One drawer for the whole room, so fourteen people do not react in the same
  // eight words.
  const draw = drawer(rng);
  for (const listener of listeners) {
    const reaction = resolveBelief(listener, evictee, reveal, isTrue, rng);
    applyReaction(listener, evictee, reveal, reaction, week, rng);
    reactions.push({ listener, ...reaction, text: reactionText(listener, evictee, reveal, reaction, draw) });
  }

  // ── the accused answers ──
  let response = null;
  if (reveal.type !== 'personal' && (gs.activePlayers || []).includes(reveal.accused)) {
    const aS = pStats(reveal.accused);
    const ownIt = isTrue === true && rng() < clamp01((aS.boldness / 10) * 0.55);
    const kind = ownIt ? 'own' : rng() < clamp01(aS.social / 14) ? 'deflect' : 'deny';
    response = { kind, text: responseFor(reveal, reveal.accused, kind, rng) };
    // A response works on the people who had not landed anywhere. Somebody
    // already sure is not listening to a denial.
    for (const reaction of reactions) {
      const room = 1 - clamp01(Math.abs(reaction.belief));
      const shift = room * (kind === 'own' ? 0.35 : kind === 'deflect' ? 0.12 : 0.28)
        * (pStats(reveal.accused).social / 10);
      const before = reaction.belief;
      reaction.belief += kind === 'own' ? shift : -shift;
      reaction.movedByResponse = reaction.belief - before;
      if (reaction.belief > 0 && before <= 0) bumpSuspicion(reaction.listener, reveal.accused, 0.4);
      if (reaction.belief < 0 && before >= 0) addBond(reaction.listener, reveal.accused, 0.3);
    }
  }

  // ── and sometimes somebody says it out loud ──
  //
  // After the response, because the accused's denial is part of what the room
  // has heard by the time anybody squares up — and because a confrontation
  // moves the people still on the fence, which the response has just finished
  // adjusting.
  const confrontation = checkConfrontation(week, reveal, reactions, rng, isTrue);

  // ── the audience ──
  if (seasonConfig.popularityEnabled !== false) {
    gs.popularity ||= {};
    const swing = trigger.register === 'explosion' ? -0.6 : 0.5;
    gs.popularity[evictee] = (gs.popularity[evictee] || 0) + swing;
  }

  // ── and they carry it out of the door ──
  const seatsAJuror = evictionSeatsAJuror((week.houseAtStart || []).length);
  if (seatsAJuror) {
    seedJurorReads(evictee, week.num || 0);
    if (reveal.type !== 'personal') {
      moveRead(evictee, reveal.accused, {
        strength: -2.2, credibility: 1, kind: 'blowup', week: week.num || 0,
        text: `${evictee} left the house certain it was ${reveal.accused}.`,
      });
    }
  }

  const record = {
    speaker: evictee, register: trigger.register, chance: trigger.chance,
    blindside: trigger.blindside, reveal: { ...reveal }, isTrue,
    fabricated: !!reveal.fabricated, speech, response, reactions, confrontation,
    week: week.num || 0,
    // Carried so the jury house knows what this juror walked in believing and
    // who in the room already argued against it.
    dismissedBy: reactions.filter(r => r.belief < 0).map(r => r.listener),
    convincedBy: reactions.filter(r => r.belief > 0).map(r => r.listener),
    conflicted: reactions.filter(r => r.conflicted).map(r => r.listener),
  };

  week.lastWords = record;
  const act = [...(week.acts || [])].reverse().find(a => a.type === 'eviction' && a.evicted === evictee);
  if (act) act.lastWords = record;
  return record;
}

/**
 * The blowup, for both transcripts.
 *
 * Lives here so bb-run.js and text-backlog.js cannot end up describing the same
 * scene differently — the lesson from juryLines, which had to be moved into the
 * leaf for exactly that reason.
 */
export function lastWordsLines(record, line) {
  if (!record) return;
  line('');
  line(`  ${record.speaker} stops at the door.`);
  line(`    ${record.speech.replace(/<[^>]*>/g, '')}`);
  if (record.response) line(`    ${record.response.text}`);
  const verdict = record.isTrue === true ? 'and every word of it was true'
    : record.isTrue === false ? 'and it was not true'
      : 'and there was nothing in it to be right or wrong about';
  line(`    (${verdict}.)`);
  for (const reaction of record.reactions) line(`    ${reaction.text}`);
  const c = record.confrontation;
  if (c) {
    line('');
    line(`  ${c.challenger} does not let it go.`);
    line(`    ${c.opener}`);
    line(`    ${c.answer}`);
    line(`    ${c.close}`);
  }
}

/** Was this houseguest's exit a blowup? For screens and tests. */
export function lastWordsOf(week) {
  return week?.lastWords || null;
}
