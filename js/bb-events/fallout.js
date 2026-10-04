// ══════════════════════════════════════════════════════════════════════
// bb-events/fallout.js — the Friday morning after a Thursday eviction
// ══════════════════════════════════════════════════════════════════════
//
// Everything here fires in the quiet at the top of a week, before the Head of
// Household competition, and everything here reads the ballots that were
// actually cast rather than a general sense that somebody left.
//
// The two halves matter equally. Grief without consequence is a sad scene; the
// consequence is that a person who loses a friend goes looking for who did it,
// gets it right or gets it badly wrong, and carries that for weeks. And a
// houseguest who quietly kept somebody's ally has bought goodwill they do not
// know they have until it surfaces.
//
// Nobody in this house can see a ballot, which is the whole design: blame is a
// reconstruction assembled from who put them up, who could have saved them, who
// gained, and whichever group the mourner had already decided was running the
// place. Sometimes that lands on the right person.

import { gs } from '../core.js';
import {
  pStats, bond, perceived, band, closestTo, beatsInvolving, spotlightOrder, archetype, isNice, suspicionOf,
} from './_read.js';
import {
  lastCompletedWeek, reactionsTo, chiefMourner, assignBlame, keptThem,
  wroteTheName, votedAgainst, evictionCount, minorityVoters,
} from '../bb/fallout.js';
import { knowsVote } from '../bb/knowledge.js';
import { believes, factId, learn } from '../knowledge.js';
import { makeScene } from '../bb/script/scene.js';
import { numberWord } from '../bb/script/inject.js';

/** Which room a scene happens in: by hash, never a die. */
function _room(rooms, ctx, ...people) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${people.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return rooms[hash % rooms.length];
}
/** Least-seen first, weighted toward whoever this week is about. */
const _quiet = pool => spotlightOrder(pool);

/**
 * The morning after, and only the morning after.
 *
 * These belong in the empty hours before the Head of Household competition. By
 * the time nominations are being decided the house has moved on, and a grief
 * scene during a ceremony reads as the show losing its place.
 */
const _morning = (ctx, value) => {
  const early = ctx?.phase === 'pre-hoh' || ctx?.act === 'house' || ctx?.act === 'hoh';
  return early ? band(value) : 0;
};

/**
 * Once per eviction, not once per beat.
 *
 * The morning after a vote is one morning. Without this the house act — which
 * draws twenty-odd beats — would run the same reckoning two or three times, and
 * a mourner would work out who did it, then work it out again an hour later.
 * Measured at 225 blame scenes across 110 weeks before the guard.
 */
// Marked on the WEEK, not on gs.bb. A global map keyed by week number survives
// anything that rebuilds gs.bb without clearing it, so replaying the same seed
// found every event already spent and produced a different season — which is
// the determinism guarantee, broken by a bookkeeping detail. The week object is
// new every week and dies with it.
function _spent(id, ctx) {
  return !!ctx?.week?._falloutFired?.[id];
}
function _spend(id, ctx) {
  if (!ctx?.week) return;
  (ctx.week._falloutFired ||= {})[id] = true;
}

/** Is there a fresh eviction to react to at all? */
const _fresh = ctx => {
  const week = lastCompletedWeek();
  if (!week) return null;
  // Only the week immediately after. Week-old grief is a different event.
  return (ctx?.week?.num || 0) === (week.num || 0) + 1 ? week : null;
};

// ── grief, and the performance of it ──────────────────────────────────

const mourning = {
  id: 'fallout-grief',
  category: 'house-life',
  location: 'bedroom',
  weight(house, ctx) {
    const week = _fresh(ctx);
    if (!week) return 0;
    if (_spent('fallout-grief', ctx)) return 0;
    const mourner = chiefMourner(week);
    return mourner && !mourner.hypocrisy ? _morning(ctx, 9) : 0;
  },
  fire(house, ctx, api) {
    const week = _fresh(ctx);
    _spend(this.id, ctx);
    const mourner = chiefMourner(week);
    const gone = week.evicted;
    const comfort = closestTo(mourner.name, house.filter(n => n !== mourner.name));

    const scene = makeScene('fallout.grief', { a: mourner.name, b: comfort || null },
      { ending: 'scene', intent: comfort ? 'held' : 'alone', gone }, [], 'bedroom');
    api.popDelta(mourner.name, 1);
    if (comfort) {
      api.addBond(mourner.name, comfort, 0.8);
      api.remember(mourner.name, comfort, 'was-there', 1, { about: `after ${gone} left` });
    }
    return { scene, players: [mourner.name, comfort].filter(Boolean),
      badgeText: 'DOWN A FRIEND', badgeClass: 'blue' };
  },
};

const cryingOverAName = {
  id: 'fallout-hypocrisy',
  category: 'house-life',
  weight(house, ctx) {
    const week = _fresh(ctx);
    if (!week) return 0;
    if (_spent('fallout-hypocrisy', ctx)) return 0;
    return reactionsTo(week).some(r => r.hypocrisy > 0) ? _morning(ctx, 8) : 0;
  },
  fire(house, ctx, api) {
    const week = _fresh(ctx);
    _spend(this.id, ctx);
    const faker = reactionsTo(week).find(r => r.hypocrisy > 0);
    const gone = week.evicted;
    // Whoever is sharp enough to notice what they are watching.
    const witness = _quiet(house.filter(n => n !== faker.name))
      .find(n => pStats(n).intuition >= 6) || house.find(n => n !== faker.name);

    const scene = makeScene('fallout.hypocrisy', { a: faker.name, b: witness }, { ending: 'scene', gone }, [],
      _room(['kitchen', 'living-room', 'backyard', 'bedroom'], ctx, faker.name, witness));
    api.suspicion(witness, faker.name, 1.1);
    api.remember(witness, faker.name, 'two-faced', 2, { about: `mourned ${gone} after voting them out` });
    api.popDelta(faker.name, -2);
    return { scene, players: [faker.name, witness],
      badgeText: 'MOURNS THE NAME THEY WROTE', badgeClass: 'orange' };
  },
};

const goodRiddance = {
  id: 'fallout-relief',
  category: 'house-life',
  weight(house, ctx) {
    const week = _fresh(ctx);
    if (!week) return 0;
    if (_spent('fallout-relief', ctx)) return 0;
    return reactionsTo(week).some(r => r.relief >= 1.5) ? _morning(ctx, 7) : 0;
  },
  fire(house, ctx, api) {
    const week = _fresh(ctx);
    _spend(this.id, ctx);
    const relieved = reactionsTo(week).filter(r => r.relief >= 1.5);
    const who = relieved[0];
    const gone = week.evicted;
    const loud = pStats(who.name).temperament <= 5 || !isNice(who.name);
    const mourner = reactionsTo(week).find(r => r.grief >= 2);

    const seen = loud && mourner ? mourner.name : null;
    const scene = makeScene('fallout.relief', { a: who.name, b: seen },
      { ending: loud ? 'loud' : 'quiet', intent: seen ? 'seen' : 'alone', gone }, [],
      _room(['kitchen', 'living-room', 'backyard', 'bedroom'], ctx, who.name));
    if (loud && mourner) {
      api.addBond(mourner.name, who.name, -0.9);
      api.suspicion(mourner.name, who.name, 0.7);
      api.popDelta(who.name, -1);
    }
    return { scene, players: [who.name, loud && mourner ? mourner.name : null].filter(Boolean),
      badgeText: loud ? 'NOT EVEN HIDING IT' : 'QUIETLY RELIEVED',
      badgeClass: loud ? 'orange' : 'grey' };
  },
};

// ── who did it ────────────────────────────────────────────────────────

const findingTheCulprit = {
  id: 'fallout-blame',
  category: 'deals',
  weight(house, ctx) {
    const week = _fresh(ctx);
    if (!week) return 0;
    if (_spent('fallout-blame', ctx)) return 0;
    const mourner = chiefMourner(week);
    if (!mourner) return 0;
    return assignBlame(mourner.name, week) ? _morning(ctx, 12) : 0;
  },
  fire(house, ctx, api) {
    const week = _fresh(ctx);
    _spend(this.id, ctx);
    const mourner = chiefMourner(week);
    const verdict = assignBlame(mourner.name, week);
    const gone = week.evicted;
    if (!verdict) {
      return { scene: makeScene('fallout.noanswer', { a: mourner.name }, { ending: 'scene', gone }, [], 'diary-room'),
        location: 'diary-room', players: [mourner.name], badgeText: 'NO ANSWER', badgeClass: 'grey' };
    }
    const { blamed, correct, why } = verdict;

    const scene = makeScene('fallout.blame', { a: mourner.name, b: blamed },
      { ending: correct ? 'correct' : 'wrong', gone }, [], _room(['kitchen', 'living-room', 'backyard', 'bedroom'], ctx, mourner.name, blamed));
    api.setTarget(mourner.name, blamed, `holds ${blamed} responsible for ${gone} going home`);
    api.remember(mourner.name, blamed, 'took-my-ally', 3, { about: gone });
    api.suspicion(mourner.name, blamed, 2);
    api.addBond(mourner.name, blamed, -1.6);
    return { scene, players: [mourner.name, blamed],
      badgeText: correct ? 'THEY WORKED IT OUT' : 'WRONG PERSON',
      badgeClass: correct ? 'red' : 'orange' };
  },
};

const itWasNotMe = {
  id: 'fallout-denial',
  category: 'deals',
  weight(house, ctx) {
    const week = _fresh(ctx);
    if (!week) return 0;
    if (_spent('fallout-denial', ctx)) return 0;
    const mourner = chiefMourner(week);
    if (!mourner) return 0;
    // Somebody who wrote the name down and would rather this person did not
    // find that out.
    return wroteTheName(week).some(n => n !== mourner.name && bond(n, mourner.name) > -2)
      ? _morning(ctx, 10) : 0;
  },
  fire(house, ctx, api) {
    const week = _fresh(ctx);
    _spend(this.id, ctx);
    const mourner = chiefMourner(week);
    const liar = _quiet(wroteTheName(week).filter(n => n !== mourner.name
      && bond(n, mourner.name) > -2))[0];
    const gone = week.evicted;
    if (!liar) {
      return { scene: makeScene('fallout.silence', { a: mourner.name }, { ending: 'scene', gone }, [], 'diary-room'),
        location: 'diary-room', players: [mourner.name], badgeText: 'SILENCE', badgeClass: 'grey' };
    }
    // ── THE COUNT IS PUBLIC, AND ARITHMETIC BEATS CHARM ──
    //
    // The vote total is read out at the eviction, so "I voted to keep them"
    // is only TELLABLE when somebody actually did. On a unanimous vote there
    // is no keep-vote to claim: Joel told Tobias he voted to keep Jane over a
    // 2–0 that Tobias heard announced from the block. No trust roll survives
    // that — the lie fails on math, not on intuition, and it fails harder,
    // because a provable lie is a different offence from a plausible one.
    const keepVotes = minorityVoters(week).length;
    const against = wroteTheName(week).length;
    if (!keepVotes) {
      const scene = makeScene('fallout.denial', { a: mourner.name, b: liar },
        { ending: 'caught', gone, votes: numberWord(against) }, [], _room(['kitchen', 'living-room', 'backyard', 'bedroom'], ctx, mourner.name, liar));
      api.suspicion(mourner.name, liar, 2.2);
      api.addBond(mourner.name, liar, -1.6);
      api.remember(mourner.name, liar, 'lied-to-my-face', 3, { about: gone, provable: true });
      return { scene, players: [mourner.name, liar],
        badgeText: 'THE MATH DOES NOT LIE', badgeClass: 'red' };
    }
    // Same shape as every other claim in this house: it lands on trust, not on
    // truth. Here the truth is that they are lying, which makes being believed
    // the bad outcome for everybody except the liar.
    const trust = perceived(mourner.name, liar);
    const believed = trust + (pStats(liar).social - 5) * 0.25
      - pStats(mourner.name).intuition * 0.18 > -0.4;

    const scene = makeScene('fallout.denial', { a: mourner.name, b: liar },
      { ending: believed ? 'believed' : 'doubted', gone }, [], _room(['kitchen', 'living-room', 'backyard', 'bedroom'], ctx, mourner.name, liar));
    if (believed) {
      api.addBond(mourner.name, liar, 0.5);
      api.remember(mourner.name, liar, 'swore-it-was-not-them', 2, { about: gone });
    } else {
      api.suspicion(mourner.name, liar, 1.6);
      api.addBond(mourner.name, liar, -1.1);
      api.remember(mourner.name, liar, 'lied-to-my-face', 2, { about: gone });
    }
    return { scene, players: [mourner.name, liar],
      badgeText: believed ? 'TAKEN AT THEIR WORD' : 'NOT BUYING IT',
      badgeClass: believed ? 'grey' : 'red' };
  },
};

const somebodyStayedLoyal = {
  id: 'fallout-recognition',
  category: 'deals',
  weight(house, ctx) {
    const week = _fresh(ctx);
    if (!week) return 0;
    if (_spent('fallout-recognition', ctx)) return 0;
    const mourner = chiefMourner(week);
    if (!mourner) return 0;
    return keptThem(week).some(n => n !== mourner.name) ? _morning(ctx, 9) : 0;
  },
  fire(house, ctx, api) {
    const week = _fresh(ctx);
    _spend(this.id, ctx);
    const mourner = chiefMourner(week);
    const loyal = _quiet(keptThem(week).filter(n => n !== mourner.name))[0];
    const gone = week.evicted;
    if (!loyal) {
      return { scene: makeScene('fallout.alone', { a: mourner.name }, { ending: 'scene', gone }, [], 'diary-room'),
        location: 'diary-room', players: [mourner.name], badgeText: 'ALONE IN IT', badgeClass: 'grey' };
    }
    // Whether these two were already close decides which story this is, and the
    // copy has to ask rather than assume. One variant called the loyal voter "a
    // stranger at best" without checking, and picked somebody the mourner was
    // already at maximum bond with — where the +2 also silently vanished into
    // the clamp, so the card showed a friendship forming and moved nothing.
    const already = bond(mourner.name, loyal);
    const scene = makeScene('fallout.recognition', { a: mourner.name, b: loyal },
      { ending: already >= 5 ? 'close' : 'new', gone }, [], _room(['kitchen', 'living-room', 'backyard', 'bedroom'], ctx, mourner.name, loyal));
    api.addBond(mourner.name, loyal, already >= 8 ? 0.6 : 2);
    api.remember(mourner.name, loyal, 'stood-by-my-friend', 2, { about: gone });
    api.suspicion(mourner.name, loyal, -0.8);
    return { scene, players: [mourner.name, loyal],
      badgeText: 'THE ONE WHO TRIED', badgeClass: 'green' };
  },
};

// ── the hunt for the rogue votes ──────────────────────────────────────

const rogueHunt = {
  id: 'fallout-rogue-hunt',
  category: 'deals',
  location: 'kitchen',
  weight(house, ctx) {
    const week = _fresh(ctx);
    if (!week) return 0;
    if (_spent('fallout-rogue-hunt', ctx)) return 0;
    const strays = minorityVoters(week).filter(n => house.includes(n));
    const majority = wroteTheName(week).filter(n => house.includes(n));
    // One or two stray votes in a lopsided result. A 5-4 is a divided house
    // and nobody hunts it; a 7-2 is a plan with two defectors, and the first
    // conversation of the morning is "who were the two."
    if (!strays.length || strays.length > 2 || majority.length < strays.length + 3) return 0;
    return _morning(ctx, 11);
  },
  fire(house, ctx, api) {
    const week = _fresh(ctx);
    _spend(this.id, ctx);
    const gone = week.evicted;
    const strays = minorityVoters(week).filter(n => house.includes(n));
    const majority = wroteTheName(week).filter(n => house.includes(n));
    // Whoever ran the majority does the asking: the sharpest of the people who
    // voted with the plan.
    const hunter = _quiet(majority).sort((a, b) =>
      pStats(b).strategic - pStats(a).strategic)[0] || majority[0];
    const n = strays.length;

    // The hunter's read, built from what a houseguest actually has — never the
    // ballots. Somebody the hunter KNOWS voted with the plan is cleared;
    // otherwise suspicion falls on whoever was close to the person who just
    // left, plus whoever the hunter already distrusted. Which is exactly how
    // the wrong person gets accused of a rogue vote in the real show.
    const suspectPool = house.filter(name => name !== hunter
      && (week.ballots || []).some(b => b.voter === name));
    const scored = suspectPool.map(name => {
      let score = 0;
      try { if (knowsVote(hunter, name, gone)) score -= 5; } catch { /* unknown */ }
      try { score += Math.max(0, bond(name, gone)) * 1.1; } catch { /* unknown */ }
      score += suspicionOf(hunter, name) * 0.5;
      return { name, score };
    }).sort((a, b) => b.score - a.score);
    const accused = scored.slice(0, n).map(entry => entry.name);
    const rightCount = accused.filter(name => strays.includes(name)).length;
    const correct = rightCount === n;
    const wrongAccused = accused.filter(name => !strays.includes(name));

    const scene = makeScene('fallout.rogue', { a: hunter, b: accused[0] || null, c: accused[1] || null },
      { ending: correct ? 'correct' : 'wrong', gone }, [], 'kitchen');
    accused.forEach(name => {
      majority.filter(m => m !== name).forEach(m => api.suspicion(m, name, 1));
      api.remember(hunter, name, 'rogue-vote', 2, { about: gone, proven: false });
      api.addBond(name, hunter, -0.8);
    });
    wrongAccused.forEach(name => {
      api.remember(name, hunter, 'wrongly-accused', 2, { about: `the vote for ${gone}` });
      api.setTarget(name, hunter, `accused me of a rogue vote I never cast`);
    });
    if (!correct) strays.forEach(name => api.popDelta(name, 1));
    api.popDelta(hunter, correct ? 1 : -1);
    return { scene, players: [hunter, ...accused].slice(0, 4),
      badgeText: correct ? 'THE STRAYS ARE FOUND' : 'WRONG VOTERS ACCUSED',
      badgeClass: correct ? 'orange' : 'red' };
  },
};

// ── the house talking ─────────────────────────────────────────────────

const wordGetsAround = {
  id: 'fallout-word-gets-around',
  category: 'deals',
  weight(house, ctx) {
    const week = _fresh(ctx);
    if (!week) return 0;
    if (_spent('fallout-word-gets-around', ctx)) return 0;
    return _teller(house, week) ? _morning(ctx, 10) : 0;
  },
  fire(house, ctx, api, rng = Math.random) {
    const week = _fresh(ctx);
    _spend(this.id, ctx);
    const pair = _teller(house, week);
    if (!pair) {
      return { text: `Nobody has anything to trade this morning.`, players: [],
        badgeText: 'NOTHING MOVES', badgeClass: 'grey' };
    }
    const { teller, listener, about } = pair;
    const gone = week.evicted;

    // How the teller knows, read rather than asserted.
    //
    // The knowledge store records the provenance of every belief — whether it
    // was observed, told, or picked up second hand, and by whom. The text used
    // to state one ("they were in the room when it was said out loud"), which
    // is exactly the class of unsupported claim this house keeps producing: it
    // is true for one of the three ways somebody can know this and invented for
    // the other two. Now the sentence matches the record.
    const belief = (() => {
      try { return believes(teller, factId('vote', about, gone)); } catch { return null; }
    })();
    const heardFrom = belief && belief.sourceType !== 'observed' && belief.source
      && belief.source !== 'observation' && belief.source !== about ? belief.source : null;
    const scene = makeScene('fallout.word', { a: teller, b: listener },
      { ending: heardFrom ? 'heard' : 'seen', gone, target: about, source: heardFrom }, [],
      _room(['kitchen', 'living-room', 'backyard', 'bedroom'], ctx, teller, listener));

    // The information itself is the consequence: the listener now genuinely
    // knows, which the blame layer reads directly.
    try {
      // The seeded generator, not Math.random. `told` is a persuasion roll
      // inside learn(), so an unseeded one here means the same seed stops
      // replaying the same season — which is exactly how it broke.
      learn(listener, factId('vote', about, gone),
        { source: teller, sourceType: 'told', confidence: 0.85, from: teller,
          ep: week.num || 0, rng });
    } catch { /* the fact has aged out */ }
    api.addBond(teller, listener, 0.8);
    api.suspicion(listener, about, 1.2);
    api.remember(listener, teller, 'told-me-something-real', 2, { about });
    return { scene, players: [teller, listener, about],
      badgeText: 'WORD GETS AROUND', badgeClass: 'orange' };
  },
};

/**
 * Somebody who knows a vote, and somebody who would want to hear it.
 *
 * Only real knowledge is tradeable: the teller has to actually believe the
 * fact, which in this house means they cast the vote, watched it happen, or
 * were told by somebody they believed.
 */
function _teller(house, week) {
  const gone = week?.evicted;
  if (!gone) return null;
  for (const teller of _quiet(house)) {
    for (const about of house) {
      if (about === teller || !knowsVote(teller, about, gone)) continue;
      const listener = _quiet(house).find(n => n !== teller && n !== about
        && !knowsVote(n, about, gone) && bond(teller, n) >= 1);
      if (listener) return { teller, listener, about };
    }
  }
  return null;
}

export const FALLOUT_EVENTS = [
  mourning, cryingOverAName, goodRiddance, findingTheCulprit, itWasNotMe, somebodyStayedLoyal,
  wordGetsAround, rogueHunt,
];
