// ══════════════════════════════════════════════════════════════════════
// tr/crowd.js — what the country felt about it, and what it merely enjoyed
// ══════════════════════════════════════════════════════════════════════
//
// THIS FILE WRITES `gs.popularity`. IT MUST NEVER RANK ANYBODY WITH IT.
//
// `gs.popularity` is accrued: it is incremented every round somebody is on
// screen, so a total is dominated by how many rounds that was. Measured on Big
// Brother 1 it correlates with FINAL PLACEMENT at -0.952 — asking it who was
// liked returns who lasted. Every consumer that asked was reading the wrong
// thing (both shows' fan-favourite award, the heroes board, the fan-loved tag,
// the audience pulse, the social feed's crowd). The reading that answers "who
// was liked" is `audienceStanding` / `audienceBoard` in js/audience.js, which
// is SHOW-AGNOSTIC BY CONSTRUCTION and which Traitors gets for free. Nothing
// here reimplements any of it and nothing here reads a standing.
//
// ── THE WRINKLE THIS SHOW HAS AND THE OTHER TWO DO NOT ────────────────────
//
// THE AUDIENCE KNOWS WHO THE TRAITORS ARE. They were shown the turret on night
// one; the castle finds out at the reveal, or never. So a Traitor pulling off
// a murder they spent the afternoon engineering is watched by a room that does
// not know and by a country that does — and those two are not having the same
// experience. The country is ENTERTAINED. It is not moved.
//
// Popularity tracks AFFECTION. Left alone it would quietly become a competence
// score for whichever villain the crowd enjoyed most, because a Traitor who is
// good at this generates more television than anybody else in the castle and
// every one of those moments would land in the same column as a Faithful
// taking a bullet for a friend. So there are TWO ledgers:
//
//   gs.popularity[name]     affection — how much the country liked them
//   gs.tr.notoriety[name]   spectacle — how much television they generated
//
// A masterful murder is almost all spectacle. A selfless act is almost all
// affection. They are different columns because they are different feelings,
// and nothing downstream can accidentally read one as the other.
//
// ── WHEN THE CROWD LEARNS WHAT, SAID HONESTLY ─────────────────────────────
//
// Popularity is written DURING the season, and this file conditions it on
// `alignmentAt(name, ep)` — ground truth, at the episode the act happened.
// That is legitimate here and nowhere else in the engine, for one reason:
// popularity is an AUDIENCE quantity, and the audience has known since night
// one. Alignment eras are respected (a player who flips in episode 8 was
// genuinely a Faithful in episode 3, and the crowd watched them be one), which
// is why every entry point takes `ep`.
//
// THE PRICE OF THAT, AND THE RULE IT BUYS: because this reads ground truth,
// NOTHING IN THE GAME MAY EVER READ IT BACK. No belief, no suspicion, no
// target choice, no vote may consult popularity or notoriety — that would be
// alignment leaking into the castle through a side door the belief gate does
// not watch, and Plan 5's lesson (a mechanic whose fiction is "this proves
// someone innocent" hits a wall) is exactly what would come of it. The rule is
// enforced as a rule over the source in tests/tr-audience.test.js: no file
// under js/tr/ but this one may mention `popularity` or `notoriety` at all.
import { gs } from '../core.js';
// The board, so the snapshot below reports the same standing the rest of the
// franchise reads rather than a second version of the formula.
import { audienceBoard } from '../audience.js';
import { outcomeSense, heatAt } from './threads.js';
import { alignmentAt } from './roles.js';

/**
 * THE COLOURS, and the two numbers that separate entertaining from admirable.
 *
 * `affection` moves `gs.popularity`; `spectacle` moves `gs.tr.notoriety`. The
 * ratio between them IS the design content of this file, so they are named
 * constants in one table rather than magic numbers at eleven call sites.
 *
 * The four the project's standing rule names — heroic, villainous, cowardly,
 * selfless — are all here; `cruel` is the villainous one. The other three
 * exist because this format produces moments the four cannot describe:
 *
 *   masterful  A Traitor doing precisely what a Traitor is there to do, and
 *              doing it well. THE SHOW IS FOR THIS. The crowd is delighted and
 *              does not like them any better for it: 8x the spectacle of a
 *              heroic act and a sixth of its affection, before damping.
 *   exposed    The villain caught sweating. Enormous television, and the crowd
 *              warms slightly — being bad at lying is endearing in a way being
 *              good at it is not.
 *   selfish    Breaking away from the group for a personal prize while the
 *              afternoon's money suffers for it. Not villainy. Just nobody's
 *              favourite thing to watch somebody do.
 *   wronged     NOT AN ACT AT ALL, and the only colour here that is not. A
 *              Faithful the room banished on nothing, protesting their
 *              innocence with the country already knowing they were telling
 *              the truth, is the single most sympathetic thing this format
 *              produces — and it is the ONLY large payment that lands on
 *              somebody the week they leave. That matters structurally as well
 *              as dramatically: every other colour accrues, so without this
 *              one the ledger would once again be a table of who lasted.
 */
export const CROWD_COLOURS = {
  heroic:     { affection:  3.0, spectacle: 1.0 },
  selfless:   { affection:  4.0, spectacle: 0.5 },
  kind:       { affection:  1.5, spectacle: 0.2 },
  cowardly:   { affection: -2.5, spectacle: 0.5 },
  cruel:      { affection: -3.0, spectacle: 1.5 },
  masterful:  { affection:  0.5, spectacle: 4.0 },
  exposed:    { affection:  1.0, spectacle: 3.0 },
  selfish:    { affection: -1.5, spectacle: 1.0 },
  wronged:    { affection:  3.5, spectacle: 2.0 },

  /* ── HOW A STORY ENDED, which is not the same as what somebody did ──
     Every colour above is an ACT: a name argued for, a friend cut, a nerve
     lost. These two are the end of an ARC, and they are deliberately weak in
     affection and strong in spectacle, because being in a storyline is
     television and not virtue. The country's affection still comes from
     behaviour; what a resolved arc buys is being WATCHED.

     Getting this wrong is measurable and was measured. Paying arcs at the
     warmth of an act (`wronged`, 3.5) tripled the correlation between the
     round-normalised standing and final placement, from 0.16 to 0.48 — arcs
     resolve for people who are still there to resolve them, so a generous
     arc payout is a survival bonus wearing a story's clothes. That is the
     -0.952 accrual bug this file exists to keep out, arriving through a new
     door. See tr-audience.test.js. */
  vindicated: { affection:  0.5, spectacle: 2.5 },
  unmasked:   { affection: -1.2, spectacle: 3.5 },
  courted:    { affection:  0.6, spectacle: 1.5 },
};

/**
 * How much of a Traitor's good behaviour the country is willing to believe.
 *
 * Applied to POSITIVE affection only, and only when the actor was in a cloak
 * at the time. It is not a penalty for being a villain — a Traitor's cowardice
 * costs them exactly what anybody's does, and their spectacle is undamped —
 * it is the fact that the audience cannot read a Traitor's kindness as
 * kindness, because they watched the same person choose a name at midnight.
 *
 * 0.25 rather than 0: a well-played villain IS somewhat liked, and zeroing it
 * would make popularity a Faithfuls-only ledger, which is a different and
 * equally wrong measure. With this in place a Faithful's heroic act pays 3.0
 * of affection and a Traitor's masterful one pays 0.125 — a factor of 24, and
 * the separation the format needs.
 */
export const TRAITOR_AFFECTION_DAMPING = 0.25;

/** Test-only observation seam. Same contract as `_setEndgameWatch`. */
let _watch = null;
export function _setCrowdWatch(fn = null) {
  const prev = _watch;
  _watch = fn;
  return () => { _watch = prev; };
}

/**
 * Start a season's two ledgers, with every player already on both.
 *
 * Seeded at zero for the WHOLE cast rather than created on first moment,
 * because `audienceBoard()` with no `eligible` list builds itself from the
 * keys of `gs.popularity` — so a player nothing ever happened to would simply
 * not be on the board, and "nobody had a moment" would read as "was not in the
 * season". Zero affection is a real answer and has to be representable.
 */
export function initCrowd(cast = []) {
  if (!gs) return;
  gs.popularity = {};
  if (gs.tr) gs.tr.notoriety = {};
  for (const n of cast) {
    gs.popularity[n] = 0;
    if (gs.tr) gs.tr.notoriety[n] = 0;
  }
}

/**
 * One thing the country watched somebody do.
 *
 * `mult` scales the moment, not the colour: driving the only correct vote in a
 * room of eighteen is a bigger version of the same act as agreeing with a
 * majority that had already worked it out.
 *
 * Returns the record it applied (the value under test, so a test never has to
 * recompute the rule to check it) or null when there is nothing to score.
 */
export function crowdMoment(name, colour, ep, { mult = 1, reason = null } = {}) {
  const spec = CROWD_COLOURS[colour];
  if (!name || !spec || !gs) return null;
  const traitor = alignmentAt(name, ep) === 'traitor';
  // Damping is on the UPSIDE only. See TRAITOR_AFFECTION_DAMPING.
  const damp = (traitor && spec.affection > 0) ? TRAITOR_AFFECTION_DAMPING : 1;
  const affection = spec.affection * mult * damp;
  const spectacle = spec.spectacle * mult;

  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + affection;
  if (gs.tr) {
    if (!gs.tr.notoriety) gs.tr.notoriety = {};
    gs.tr.notoriety[name] = (gs.tr.notoriety[name] || 0) + spectacle;
  }

  const rec = { name, colour, ep, mult, traitor, affection, spectacle, reason };
  if (_watch) _watch(rec);
  return rec;
}

// ══════════════════════════════════════════════════════════════════════
// THE BEATS
// ══════════════════════════════════════════════════════════════════════
//
// Each of these takes a record the engine has ALREADY WRITTEN and reads the
// moment off it. None of them re-simulates anything, none takes an rng draw,
// and none is allowed to change what the castle believes — so wiring them into
// the season loop leaves every murder, ballot and belief bit-identical, which
// is what keeps the replay guards meaningful.

/**
 * The night. Who argued for the name that died, and what it cost the victim.
 *
 * Every Traitor whose argument carried the conclave gets `masterful` — this is
 * the play the show exists for. The one whose argument LOST gets nothing: they
 * were overruled, the country watched them lose an argument, and there is no
 * television in it. Killing somebody the murderer was genuinely close to is
 * `cruel` on top, because the crowd saw the friendship.
 *
 * A blocked night still scores, at half: the Traitors did everything they did
 * and a Shield they could not see about happened to be in the way. What the
 * country watched was the same evening.
 */
export function scoreNight(ep, night, { bondOf = null } = {}) {
  const out = [];
  const target = night?.murderTarget || night?.murdered;
  if (!target) return out;
  const blocked = !!night?.blocked && !night?.murdered;
  const mult = blocked ? 0.5 : 1;
  const carried = (night?.murderBallots || []).filter(b => b.voted === target);
  for (const b of carried) {
    out.push(crowdMoment(b.voter, 'masterful', ep, { mult, reason: `murder:${target}` }));
    // The friendship the audience had been watching all season, ended by the
    // person who was in it. Read off the bond the engine already holds rather
    // than re-derived: the caller passes the reader so this file imports no
    // bond machinery it would then be tempted to write with.
    const bond = bondOf ? bondOf(b.voter, target) : 0;
    if (bond >= 4) {
      out.push(crowdMoment(b.voter, 'cruel', ep, { mult, reason: `murdered-a-friend:${target}` }));
    }
  }
  // THE VICTIM, and only when there is one. Being murdered is not an act, but
  // the conclave picks the well-liked and hard-to-banish (formPreference), so
  // this is the country having its own view confirmed on screen — smaller than
  // a wrongful banishment because there is no protest and no last word, just an
  // empty chair at breakfast.
  //
  // NOT PAID TO A MURDERED TRAITOR, and the case is real: the forced-sacrifice
  // variant makes the conclave kill one of its own, and 21 of 1,732 `wronged`
  // payments over 100 seasons were landing on somebody in a cloak. Nobody
  // watching that scene feels a person was wronged; they feel the faction eat
  // itself, which is already paid to the killers as spectacle.
  if (night?.murdered && alignmentAt(night.murdered, ep) !== 'traitor') {
    out.push(crowdMoment(night.murdered, 'wronged', ep, { mult: 0.6, reason: 'murdered' }));
  }
  return out.filter(Boolean);
}

/**
 * A refused ultimatum, and the body it leaves.
 *
 * Two different acts and they are scored as two. Accepting the cloak is a
 * TURN — the biggest single piece of television a Faithful can generate — and
 * it is scored AFTER `recordAlignment`, so the new era is already live and the
 * damping already applies: from the moment the cloak goes on, the country
 * reads this person as a Traitor, which is exactly right. `cruel` is undamped
 * beside it, so a turn nets NEGATIVE affection and enormous spectacle. That is
 * the shape the moment actually has.
 *
 * Refusing costs them their life and the country respects it in full.
 */
export function scoreRecruitment(ep, recruited) {
  const out = [];
  if (!recruited?.target) return out;
  if (recruited.accepted) {
    out.push(crowdMoment(recruited.target, 'masterful', ep,
      { mult: 1.5, reason: 'turned' }));
    out.push(crowdMoment(recruited.target, 'cruel', ep,
      { mult: 0.5, reason: 'turned' }));
  } else if (recruited.executed) {
    out.push(crowdMoment(recruited.executed, 'heroic', ep,
      { mult: 1.5, reason: 'refused-the-ultimatum' }));
  }
  return out.filter(Boolean);
}

/**
 * The table. Who was right, who turned on their own, and who took the easy
 * name.
 *
 * ONE MOMENT PER VOTER, chosen by what their ballot actually was:
 *
 *   a Faithful who named the Traitor who went    heroic, scaled by how few
 *                                                agreed — the lone correct
 *                                                voice is the whole point of
 *                                                the show
 *   a Traitor who named a Faithful who went      masterful — they steered it
 *   a Traitor who named a fellow Traitor         cruel AND masterful — the
 *                                                turn, and it is read off
 *                                                `round.betrayals`, which the
 *                                                engine already computed with
 *                                                the era rules applied
 *   a Faithful who named a Faithful who went     nothing. It is the commonest
 *                                                thing that happens at this
 *                                                table and it is not a moral
 *                                                act, it is being wrong.
 *
 * `cowardly` is the voter who names somebody they were close to, on a night
 * they were not close to being at risk themselves — the crowd can see the
 * friendship and can see who abandoned it.
 */
export function scoreTable(ep, round, { bondOf = null } = {}) {
  const out = [];
  const gone = round?.banished;
  if (!gone) return out;
  const wasTraitor = !!round.banishedWasTraitor;
  const ballots = round.ballots || [];
  const named = ballots.filter(b => b.voted === gone);
  // How lonely being right was. A room that all saw it pays 1x; one voice in
  // eighteen pays 2x.
  const share = ballots.length ? named.length / ballots.length : 1;
  const rightMult = 1 + (1 - share);
  const turned = new Set((round.betrayals || []).map(t => t.voter));

  for (const b of named) {
    const voterIsTraitor = alignmentAt(b.voter, ep) === 'traitor';
    if (turned.has(b.voter)) {
      out.push(crowdMoment(b.voter, 'cruel', ep, { reason: `turned-on:${gone}` }));
      out.push(crowdMoment(b.voter, 'masterful', ep, { reason: `turned-on:${gone}` }));
      continue;
    }
    if (!voterIsTraitor && wasTraitor) {
      out.push(crowdMoment(b.voter, 'heroic', ep,
        { mult: rightMult, reason: `banished-a-traitor:${gone}` }));
      continue;
    }
    if (voterIsTraitor && !wasTraitor) {
      out.push(crowdMoment(b.voter, 'masterful', ep,
        { mult: 0.75, reason: `steered-a-banishment:${gone}` }));
      continue;
    }
    // Wrong, and ordinary. The only thing left to notice is whether they did
    // it to somebody they had been sitting next to all season.
    const bond = bondOf ? bondOf(b.voter, gone) : 0;
    if (bond >= 4) {
      out.push(crowdMoment(b.voter, 'cowardly', ep, { reason: `voted-out-a-friend:${gone}` }));
    }
  }

  // ── THE PERSON WHO LEFT ────────────────────────────────────────────────
  //
  // A Faithful banished on nothing is `wronged`, and it is the biggest single
  // payment in this file. A Traitor banished is `exposed`: the room finally got
  // one, the cloak comes off in front of everybody, and the country enjoys it
  // enormously without warming to them much.
  out.push(crowdMoment(gone, wasTraitor ? 'exposed' : 'wronged', ep,
    { reason: wasTraitor ? 'caught' : 'banished-innocent' }));

  // ── THE DEBATE ─────────────────────────────────────────────────────────
  //
  // Every speaker names their top read out loud, which is the only beat of the
  // week that touches most of the cast — without it the ledger reaches about a
  // third of the room and everybody else finishes the season on exactly zero,
  // which is not "the country had no view of them", it is the measurement not
  // covering them. Small multipliers on purpose: saying a name is a much
  // smaller act than casting the vote, and it must not swamp the ballot.
  //
  // Being RIGHT is the whole of it. A Faithful who says the name of an actual
  // Traitor, in a room that mostly has not worked it out, is doing the thing
  // the audience is shouting at the screen — and being wrong is not a moral
  // failure, it is the ordinary condition of everybody on this show, so it
  // scores nothing at all.
  const accusations = round.accusations || [];
  const pileOn = {};
  for (const a of accusations) {
    if (!a?.accuser || !a?.target) continue;
    const accuserIsTraitor = alignmentAt(a.accuser, ep) === 'traitor';
    const targetIsTraitor = alignmentAt(a.target, ep) === 'traitor';
    if (!accuserIsTraitor && targetIsTraitor) {
      out.push(crowdMoment(a.accuser, 'heroic', ep, { mult: 0.35, reason: `named:${a.target}` }));
    }
    if (accuserIsTraitor && !targetIsTraitor) {
      out.push(crowdMoment(a.accuser, 'masterful', ep, { mult: 0.3, reason: `deflected-onto:${a.target}` }));
    }
    if (!targetIsTraitor) pileOn[a.target] = (pileOn[a.target] || 0) + 1;
  }
  // Two or more names thrown at somebody who has done nothing, in front of the
  // room, is the other thing the country reliably feels about this show.
  for (const [name, n] of Object.entries(pileOn)) {
    if (n >= 2 && name !== gone) {
      out.push(crowdMoment(name, 'wronged', ep, { mult: 0.3, reason: `piled-on-by-${n}` }));
    }
  }
  return out.filter(Boolean);
}

/**
 * The afternoon. Clutch side objectives, and the hour somebody spent on
 * themselves.
 *
 * The side objective is one person taking the hard job alone with the pot
 * riding on it, so landing it is `heroic` and missing it is nothing — failing
 * at something difficult is not a moral act. The Reliquary searcher breaks
 * away for a personal prize and the record already carries what that cost the
 * castle in credits, so `selfish` is scaled by the real number rather than
 * flat: an hour that cost nothing costs no affection either.
 */
export function scoreMission(ep, mission) {
  const out = [];
  if (!mission) return out;
  for (const o of mission.sideObjectives || []) {
    if (o.achieved) {
      out.push(crowdMoment(o.player, 'heroic', ep, { mult: 0.75, reason: `side:${o.id}` }));
    }
  }
  const hunt = mission.shield || mission.dagger;
  if (hunt?.searcher && hunt.cost > 0) {
    // MEAN COST IS ~1,100 CREDITS (the record's own note), so the mean hunt
    // scores about 1x and a cheap one much less. Capped, because a single
    // catastrophic afternoon should not outweigh a season of behaviour.
    const mult = Math.min(1.5, hunt.cost / 1100);
    out.push(crowdMoment(hunt.searcher, 'selfish', ep, { mult, reason: 'broke-away' }));
  }
  return out.filter(Boolean);
}

/**
 * The final table, where the private question is asked.
 *
 * A Traitor who answers "banish" with a fellow still in the room is cutting
 * the only other person who knows what they are, for money, in silence. It is
 * the single most-watched act the format produces and it is scored as the
 * biggest: `masterful` at 2x, and `cruel` at 2x beside it, because the crowd
 * both loves it and does not forgive it.
 *
 * A Traitor who answers "end" with a fellow beside them has just split the pot
 * with somebody they could have taken it all from. That is `kind`, and it is
 * the only warm thing a cloak can do at that table.
 *
 * Scored off `endgame.ballots`, the record of the choices themselves, so the
 * fact being read is the decision and not its consequence — a betrayal that
 * the room then failed to carry out is still a betrayal that was chosen, and
 * `endgameChoice` is the only place that fact exists.
 */
/**
 * A STORY THE COUNTRY FOLLOWED TO ITS END.
 *
 * ── WHY STORYLINES PAY, AND WHY THEY PAY ON CLOSING ───────────────────
 *
 * Everything else in this file scores a single act: a name argued for, a
 * mission thrown, a fellow cut at the last table. But the audience of this
 * format does not watch acts, it follows STORIES -- somebody was doubted for
 * four episodes and turned out to be clean, somebody was defended by their
 * closest ally right up until they were not. None of that reached either
 * ledger, so a player could carry the season's most-watched arc and finish on
 * the popularity of somebody who was never discussed.
 *
 * It pays ON CLOSING, not per beat. A story pays when it RESOLVES because
 * that is when the audience learns what it was watching: paying per beat
 * would drip affection into everybody who was ever in a scene, which is both
 * untrue to how an audience works and the fastest way to flatten a ledger
 * into a participation count.
 *
 * IT PAYS BY SENSE, NOT BY OUTCOME STRING. `outcomeSense` is the same fork
 * the events branch on (spec 5.5), so a twelfth outcome added later gets
 * scored the moment it is mapped there, rather than falling off the end of a
 * list of known cases in this file.
 *
 *   walked   the room came for them and they came out the other side:
 *            `vindicated`, a little warmth and a lot of television.
 *   cracked  the room came for them and something came out: `unmasked`,
 *            which COSTS affection. A reveal is the best television the
 *            format makes and it is not a good look, and the negative sign
 *            matters for more than flavour -- arcs resolve for people still
 *            in the castle, so an all-positive arc payout is a survival
 *            bonus in disguise.
 *   coupled  it was a romance: `kind`, warm and quiet. A break-up pays the
 *            same word at half, because the audience takes a side and the
 *            format does not tell us whose.
 *
 * SCALED BY HOW MUCH STORY THERE WAS. A thread with one beat is an incident;
 * one with five is the thing the season was about, and they must not pay the
 * same. Capped at 1.0 so no single arc can outweigh a season of behaviour --
 * the same reasoning as the hunt cap in `scoreMission`.
 *
 * Read off threads this episode CLOSED, which the engine has already written,
 * so this takes no rng draw and changes no belief.
 */
export const STORY_SENSE_COLOUR = {
  walked: 'vindicated',
  cracked: 'unmasked',
  coupled: 'courted',
};

/** A one-beat arc is an incident; a five-beat one is the season. */
export function storyWeight(thread) {
  const beats = (thread?.beats || []).length;
  return Math.min(1, 0.3 + beats * 0.175);
}

export function scoreStories(ep, { threads = null } = {}) {
  const out = [];
  const all = threads || gs?.tr?.threads || [];
  for (const t of all) {
    // Closed IN THIS EPISODE. `lastEp` is stamped by `closeThread`, so a
    // thread cannot be scored twice however often the season loop runs.
    if (!t || t.state !== 'closed' || t.lastEp !== ep) continue;
    const sense = outcomeSense(t.outcome);
    if (!sense) continue;
    const broke = t.outcome === 'broken-up';
    const colour = STORY_SENSE_COLOUR[sense];
    if (!colour) continue;
    const mult = storyWeight(t) * (broke ? 0.5 : 1);
    for (const name of t.parties || []) {
      out.push(crowdMoment(name, colour, ep,
        { mult, reason: `story:${t.kind}:${t.outcome}` }));
    }
  }
  return out.filter(Boolean);
}

export function scoreEndgame(endgame) {
  const out = [];
  for (const ask of endgame?.ballots || []) {
    for (const c of ask.choices || []) {
      if (c.role !== 'traitor' || !c.fellows?.length) continue;
      if (c.choice === 'banish') {
        out.push(crowdMoment(c.name, 'masterful', ask.ep, { mult: 2, reason: 'final-betrayal' }));
        out.push(crowdMoment(c.name, 'cruel', ask.ep, { mult: 2, reason: 'final-betrayal' }));
      } else {
        out.push(crowdMoment(c.name, 'kind', ask.ep, { reason: 'split-it' }));
      }
    }
  }
  return out.filter(Boolean);
}

/**
 * A castle event's own declaration, applied.
 *
 * Events return `crowd` on their consequences — `{ name, colour, mult }` or an
 * array of them — because the event is the only thing that knows which branch
 * it took and who it was about. Called from `pickEvent` (js/tr/events.js), so
 * an event author declares the moment and never touches either ledger.
 */
export function applyEventCrowd(consequences, ep) {
  const decl = consequences?.crowd;
  if (!decl) return [];
  const list = Array.isArray(decl) ? decl : [decl];
  return list
    .map(d => crowdMoment(d?.name, d?.colour, ep, { mult: d?.mult ?? 1, reason: d?.reason || null }))
    .filter(Boolean);
}

/**
 * WHAT THE COUNTRY MADE OF THEM, AND WHAT STORY THEY ARE IN, tonight.
 *
 * Both of these were computed all season and reachable from no screen. The
 * crowd ledgers live on `gs` and are replaced wholesale by the next season;
 * the threads live on `gs.tr` and are mutated in place, so by the finale the
 * only readable version of episode 3's storylines was episode 3's version of
 * them, which no longer existed. A debug screen that reads live state on a
 * replayed episode is this project's §11.5 bug, so this snapshots.
 *
 * DELIBERATELY SMALL, because a per-episode snapshot of season-wide data is
 * how `gs` got to 19MB the last time (see the Big Brother state-bloat note).
 * Two numbers per player, and only the stories that are actually live or that
 * ended tonight -- an arc closed in episode 2 is on episode 2's row and does
 * not need to be on all fourteen.
 *
 * IT LIVES HERE AND NOT IN THE SEASON LOOP because this file owns the two
 * ledgers: tr-audience.test.js enforces that nothing else under js/tr may so
 * much as name them, on the grounds that popularity is written from ground
 * truth and any engine read of it is alignment reaching the castle through a
 * channel the belief gate does not watch. Snapshotting is a read.
 */
export function crowdSnapshot(ep, living) {
  const board = audienceBoard({});
  const rows = board.map(b => ({
    name: b.name,
    // The two ledgers, kept apart on purpose: affection is who they liked and
    // spectacle is who they watched, and this show's whole point is that those
    // are different people.
    affection: Math.round(b.popularity * 100) / 100,
    spectacle: Math.round((gs.tr?.notoriety?.[b.name] || 0) * 100) / 100,
    // Affection per round present. THE RANKING NUMBER: the accrued total is
    // "how long did they last" and ranking by it is the -0.952 bug.
    standing: Math.round(b.standing * 1000) / 1000,
    rounds: b.rounds,
    out: !(living || []).includes(b.name),
  }));
  /* LIVE STORIES ONLY, plus whatever ended tonight. `heatAt` decays a point
     per round of silence and an event may only continue a thread with heat
     left, so a thread at zero is not a storyline anybody is in -- it is a
     thing that once happened. Including them put 76 rows on episode 5, most
     of them cold, which is both an unreadable table and a per-episode
     snapshot of season-wide data, i.e. exactly the shape that took `gs` to
     19MB on the other show. */
  const stories = (gs.tr?.threads || [])
    .filter(t => t && ((t.state === 'open' && heatAt(t, ep) > 0) || t.lastEp === ep))
    .map(t => ({
      kind: t.kind,
      parties: [...(t.parties || [])],
      state: t.state,
      // Heat AS IT STANDS TONIGHT, not the stored peak: a story nobody has
      // mentioned for three rounds is cold, and the stored number cannot say
      // so. `openThreadsFor` filters on exactly this.
      heat: Math.round(heatAt(t, ep) * 100) / 100,
      beats: (t.beats || []).length,
      act: t.act || null,
      opened: t.beats?.[0]?.ep ?? null,
      lastEp: t.lastEp,
      outcome: t.outcome || null,
      closedTonight: t.state !== 'open' && t.lastEp === ep,
    }))
    .sort((a, b) => b.heat - a.heat);
  /* THE FAVOURITE IS SOMEBODY WHO IS STILL IN IT. The board ranks the whole
     cast, and standing is affection per round, so somebody adored in three
     episodes and murdered outranks everybody who has been there for ten --
     `favourite` naming an eliminated player is true of the ledger and useless
     as a fact about tonight. */
  return { rows, stories, favourite: rows.find(r => !r.out)?.name || null };
}
