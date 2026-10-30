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
import { seatedJurors, juryOpensAt, evictionSeatsAJuror, weekExits } from './jury.js';
import { reconcileBBJury, believedVoters, stableRng, knowsVote } from './knowledge.js';
import { seedJurorReads, moveRead, readOf, stanceOf } from './jury-sentiment.js';
import { moodOf, newsOf, chooseNight, lensCase, reasonLine, reasonsFor, lensOf } from './jury-house-scenes.js';
import { pronounsOf } from '../pronouns-of.js';

const clamp01 = v => Math.max(0, Math.min(1, v));
const archetypeOf = name => players.find(p => p.name === name)?.archetype || 'floater';
const P = name => { try { return pronouns(name); } catch { return pronounsOf('nb'); } };
// 'is' or 'are' for whoever the pronoun is ('They is not impressed' was printed)
const IS = name => (P(name).sub === 'they' ? 'are' : 'is');
const COUNT_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
// ── the season remembers what it has said ──
// The user, 2026-10-07: "the jury house is super repetitive, always the same sentence". Measured
// over two seasons: a quarter of the lines were a sentence already heard that season. Every pick
// now prefers the version this SEASON has used least (a line is known by its shape: names,
// pronouns and counts blanked), so the pools are walked through before anything comes back. Each
// pick still draws exactly one number from the dice, so no outcome of the season moves.
const PRONOUN = /\b(he|she|they|him|her|them|his|hers|their|theirs|himself|herself|themselves)\b/gi;
const NUMBER = /\b(no|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twice)\b/gi;
let _nameRe = null, _nameKey = '';
function shapeOf(text) {
  const names = (players || []).map(p => p.name).filter(Boolean);
  const key = names.join('|');
  if (key !== _nameKey) { _nameKey = key; _nameRe = names.length ? new RegExp('(' + names.map(n => n.replace(/[.*+?^${}()|[]\]/g, '\$&')).sort((x, y) => y.length - x.length).join('|') + ')', 'g') : null; }
  return String(text).replace(_nameRe || /$^/, 'X').replace(PRONOUN, 'P').replace(NUMBER, 'N');
}
function leastUsed(rng, list, avoid = null) {
  const r = rng();
  const ledger = gs.bb ? (gs.bb.juryShapes ||= {}) : {};
  const shapes = list.map(shapeOf);
  const score = i => (avoid && avoid.has(shapes[i]) ? 1e6 : 0) + (ledger[shapes[i]] || 0);
  let best = Infinity, cands = [];
  list.forEach((_, i) => { const sc = score(i); if (sc < best) { best = sc; cands = [i]; } else if (sc === best) cands.push(i); });
  const i = cands[Math.floor(r * cands.length) % cands.length];
  ledger[shapes[i]] = (ledger[shapes[i]] || 0) + 1;
  if (avoid) avoid.add(shapes[i]);
  return list[i];
}
const pick = (rng, list) => leastUsed(rng, list);

/** A picker that will not repeat itself inside one scene, and prefers what the season has not heard. */
function drawer(rng) {
  const used = new Set();
  return (key, list) => leastUsed(rng, list, used);
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
 *
 * ONE conversation, in the order it happens (the user, 2026-10-30, of a night with two arrivals: "it doesnt flow",
 * "they talk like bots", "super repetitive"). It used to be four writers stacked: an entrance (already on the couch),
 * then the door (opened by somebody else), then up to three friends each running to that door to hug them, then the
 * news, and the second arrival of the night got the same hugs and the same questions word for word. Now: the door,
 * opened by one person; how they take it; what happened, said plainly; who they blame and whether the room agrees;
 * one or two others who have something to say to them; the news from the house, once a night; and their vote, with a
 * reason that is true of the person they name. `night` carries what tonight has already said.
 */
function arrivalScene(newcomer, residents, week, out, night, lastWords = null, late = false) {
  const beats = [];
  const say = list => leastUsed(night.rng, list, night.used);
  const p = P(newcomer);
  const sub = p.sub, Sub = p.Sub, is = IS(newcomer);
  const greeter = residents.slice().sort((a, b) => getBond(newcomer, b) - getBond(newcomer, a))[0] || null;
  // What happened to them, as the house saw it: who held the key, and the count (both said out loud on eviction
  // night). The user, 2026-10-07: "the dialogue is really boring, not deep."
  const wk = (gs.bb?.weeks || []).find(w => w.num === week) || out.weekObj || null;
  const hohOf = wk?.hoh && wk.hoh !== newcomer ? wk.hoh : null;
  const ev = (wk?.acts || []).find(x => x?.type === 'eviction');
  const ballots = [...new Map((ev?.ballots || []).filter(b => b?.voter && b.evict).map(b => [b.voter, b])).values()];
  const against = ballots.filter(b => b.evict === newcomer).length, others = ballots.length - against;
  const count = !ballots.length ? null
    : against * 2 === ballots.length ? `It was a tie${hohOf ? `, and ${hohOf} broke it` : ''}.`
      : !others ? 'Every single vote went against me.'
        : against - others === 1 ? `It was ${NUM(against)} to ${NUM(others)}. One vote.`
          : `${Cap(NUM(against))} votes to ${NUM(others)}.`;
  // a replacement nominee went up at the veto meeting, not at the nominations
  const replaced = (wk?.initialNominees || []).length && !wk.initialNominees.includes(newcomer) && (wk.finalNominees || []).includes(newcomer);
  // Out on the White Locust's clock, not a vote: no HOH put them up and nobody wrote their name (the user, 2026-10-29)
  const chain = wk?.resortEvicted === newcomer ? (wk.acts || []).find(x => x?.type === 'white-locust') : null;
  const caller = chain ? (chain.rounds || []).find(r => r && !r.made && r.target === newcomer)?.caller || null : null;
  const mood = moodOf(newcomer);
  // a true reason for somebody, the least said tonight and this season (jury-house-scenes.js reasonsFor)
  const why = (juror, n) => lensOf(juror) === 'grudge' ? reasonLine(juror, n)
    : say(reasonsFor(lensOf(juror), n, gs.activePlayers || [], juror).map(Cap));

  // ── the door ──
  if (night.arrived) beats.push(beat('ANOTHER CAR', [], say([
    'Another car pulls up outside.', 'Headlights again. A second car is coming up the drive.', 'They hear another car door outside.'])));
  night.arrived = true;
  if (!greeter) {
    beats.push(beat('THE DOOR', [newcomer], `${newcomer} walks into an empty lodge. ${Sub} ${is} the first juror, and there is nobody here to tell what happened.`));
  } else {
    const gp = P(greeter), bond = getBond(newcomer, greeter);
    beats.push(beat('THE DOOR', [greeter, newcomer], late ? say([
      `${greeter} opens the door. "${newcomer}? We didn't know you'd gone. Come in."`,
      `${greeter} opens the door and stares. "${newcomer}? Nobody told us anything. Come in, sit down."`,
    ]) : chain ? say([
      `${greeter} opens the door. "${newcomer}? There hasn't even been a vote yet. What happened?"`,
      `${greeter} gets up when the car pulls in. "It's too early for an eviction." Then ${newcomer} walks in.`,
    ]) : bond >= 3 ? say([
      `${greeter} is at the door before ${newcomer} can knock, and hugs ${p.obj}. "Oh no. I'm so sorry. Come in."`,
      `${greeter} opens the door and pulls ${newcomer} straight into a hug. "Not you. Come here."`,
      `${greeter} sees who it is and puts ${gp.posAdj} hands over ${gp.posAdj} face. "No. Not you. Come in."`,
    ]) : bond <= -2 ? say([
      `${greeter} opens the door. For a second neither of them says anything. "Well," ${greeter} says. "Come in, then."`,
      `${greeter} opens the door, sees who it is, and steps back to let ${newcomer} in without a word.`,
    ]) : say([
      `${greeter} opens the door. "${newcomer}. Come in. Are you okay?"`,
      `${greeter} opens the door. "Hey. Come in, put your bag down."`,
      `${greeter} gets the door. "${newcomer}! Come in. We've been waiting all night to see who it would be."`,
    ])));
    beats.push(beat('ARRIVES', [newcomer], say({
      angry: [`${newcomer} drops ${p.posAdj} bag by the door. "Don't ask me if I'm okay. I'm not."`,
        `"I'm fine," ${newcomer} says, in a voice that isn't fine. "I'm just really angry right now."`],
      analytic: [`${newcomer} sits down. "I'm okay. Honestly, I saw it coming."`,
        `"I'm fine," ${newcomer} says. "I knew it was coming. I just couldn't stop it."`],
      emotional: [`${newcomer} starts crying as soon as ${sub} ${is} inside. "Sorry. I held it together the whole way here."`,
        `${newcomer} stands in the middle of the room for a second. "I really thought I was going to make it."`],
      easy: [`${newcomer} drops onto the couch. "Well. That's that, then."`,
        `${newcomer} shrugs. "I'm okay. Honestly, it's a bit of a relief. That house was exhausting."`],
    }[mood])));
  }

  // ── what happened ──
  const asker = greeter;
  if (asker) beats.push(beat('ASKED', [asker], say([`"What happened?" ${asker} asks.`, `${asker} sits down next to ${p.obj}. "Tell us what happened."`, `"So what happened in there?" ${asker} asks.`])));
  const tail = mood === 'emotional' ? ' I really thought I had the votes.' : mood === 'angry' ? ' And I knew it was coming.' : '';
  const what = chain
    ? caller ? say([
      `"${caller} called me up in the chain," ${newcomer} says. "I had to finish my task before the time ran out, and I didn't. I was gone before the vote even happened."`,
      `"It was the chain," ${newcomer} says. "${caller} picked me, I ran out of time, and that was it. I didn't even get to campaign."`,
    ]) : `"The resort sent home whoever was slowest," ${newcomer} says. "That was me. There wasn't even a vote."`
    : replaced && hohOf ? `"I wasn't even on the block until the veto meeting," ${newcomer} says. "${hohOf} put me up as the replacement.${count ? ` ${count}` : ''}"`
      : hohOf ? say([
        `"${hohOf} put me up," ${newcomer} says. "${count || 'And the house went along with it.'}${tail}"`,
        `"${hohOf} won HOH and nominated me," ${newcomer} says. "${count || 'That was it.'}${tail}"`,
      ]) : `"I went up, and I couldn't get off the block," ${newcomer} says.${count ? ` "${count}"` : ''}`;
  beats.push(beat('WHAT HAPPENED', [newcomer, hohOf || caller].filter(Boolean), what));

  // ── who they blame, and whether the room agrees ──
  const believed = believedVoters(newcomer, newcomer);
  const story = lastWords?.reveal?.accused || believed[0] || null;
  if (story && !chain) {
    const why = story === hohOf ? `${story} put me on the block. I don't need anybody else to blame.` : `${story} told me I had ${P(story).posAdj} vote. I don't think I did.`;
    beats.push(beat('THE STORY', [newcomer, story], lastWords ? say([
      `"You saw what I said on my way out?" ${newcomer} says. "I meant it. It was ${story}. ${why}"`,
      `${newcomer} hasn't stopped thinking about it since the door. "It was ${story}. ${why}"`,
    ]) : asker ? say([
      `"Who do you think did it?" ${asker} asks. "${story}," ${newcomer} says. "${why}"`,
      `"Do you know who turned on you?" ${asker} asks. ${newcomer} nods. "${story}. ${why}"`,
    ]) : `"It was ${story}," ${newcomer} says to nobody. "${why}"`));
    // Somebody who actually knows how that ballot went can settle it. Failing that, somebody close to the accused
    // will argue the other way — which is not knowledge, just loyalty, and lands or does not on that basis.
    const knower = residents.find(r => knowsVote(r, story, newcomer));
    // (nobody argues the HOH out of it: the nomination is on the record. "No. Axel was trying to keep you" was said of
    // the HOH who nominated her and broke the tie)
    const corrector = knower || story === hohOf ? null : residents.find(r => !knowsVote(r, story, newcomer) && getBond(r, story) > 2);
    if (knower) {
      moveRead(newcomer, story, { strength: -1.6, credibility: credibility(newcomer, knower), kind: 'confirmed',
        week, text: `${knower} confirmed it: ${story} voted ${newcomer} out.` });
      beats.push(beat('CONFIRMED', [knower, newcomer, story], say([
        `${knower} nods. "You're right. It was ${story}. I knew before I left."`,
        `"I wasn't going to be the one to tell you," ${knower} says. "But yes. It was ${story}."`,
        `${knower} puts down ${P(knower).posAdj} mug. "You're right about ${story}. I know how that vote was going."`,
      ])));
    } else if (corrector) {
      const moved = moveRead(newcomer, story, { strength: 1.4, credibility: credibility(newcomer, corrector), kind: 'corrected',
        week, text: `${corrector} argued ${newcomer} off ${story}.` });
      beats.push(beat('CORRECTED', [corrector, newcomer, story], Math.abs(moved) > 0.35 ? say([
        `${corrector} shakes ${P(corrector).posAdj} head. "No. ${story} was trying to keep you. I'm sure of it." ${newcomer} goes quiet.`,
        `"It wasn't ${story}," ${corrector} says. "${story} was on your side." ${newcomer} looks at ${P(corrector).obj} for a long time. "Then who was it?"`,
      ]) : say([
        `"It wasn't ${story}," ${corrector} says. ${newcomer} shakes ${p.posAdj} head. "You weren't there at the end. I was."`,
        `${corrector} tries to defend ${story}. "I know you like ${story}," ${newcomer} says. "That's why you can't see it."`,
      ])));
    }
  }
  // The blowup follows them in, and the people who were in the room when it happened arrive later carrying their
  // own opinion of it.
  if (lastWords) out.blowupsRelitigated.push({ juror: newcomer, accused: lastWords.reveal.accused, isTrue: lastWords.isTrue });

  // ── the others in the room who have something to say to them ──
  beats.push(...reunionBeats(newcomer, residents.filter(r => r !== greeter), say));

  // ── the news from the house: once a night (a second arrival comes from the same house, the same night) ──
  const alive = (gs.activePlayers || []).filter(n => n !== newcomer);
  if (!alive.length) return beats;
  const news = newsOf(newcomer, alive);
  if (asker && news && !night.newsTold) {
    night.newsTold = true;
    // the true reasons rotate: the same fact about the same leader every week was the same scene every week
    news.why = say(news.whys);
    beats.push(beat('THE NEWS', [asker, newcomer, news.name], say([
      `"So who's running things in there now?" ${asker} asks. "${news.name}," ${newcomer} says. "${news.why}"`,
      `"Who's the one to beat?" ${asker} asks. ${newcomer} doesn't have to think. "${news.name}. ${news.why}"`,
      `"Okay. What's it like in there now?" ${asker} asks. "It's ${news.name}'s house," ${newcomer} says. "${news.why}"`,
    ])));
    let pair = null;
    for (const a of alive) for (const b of alive) if (a < b && (!pair || getBond(a, b) > getBond(pair[0], pair[1]))) pair = [a, b];
    if (pair && getBond(pair[0], pair[1]) >= 4 && !pair.includes(news.name)) beats.push(beat('THE PAIR', [newcomer, ...pair], say([
      `"And ${pair[0]} and ${pair[1]} are basically a pair now," ${newcomer} adds. "Nobody's tried to split them up."`,
      `"Watch ${pair[0]} and ${pair[1]}," ${newcomer} says. "They'll take each other to the end if nobody stops them."`,
    ])));
  }

  // ── their vote, tonight ──
  const fav = favourite(newcomer), least = leastFavourite(newcomer);
  if (!fav) return beats;
  const voteAsker = residents.find(r => r !== asker && r !== greeter) || asker;
  if (voteAsker) {
    const mine = fav === news?.name && night.newsTold && beats.some(b => b.tag === 'THE NEWS')
      ? `"${fav}," ${newcomer} says. "For the same reason."`
      : `"${fav}," ${newcomer} says. "${why(newcomer, fav)}"`;
    beats.push(beat('THE QUESTION', [voteAsker, newcomer, fav], `${say([
      `"If you had to vote tonight, who would it be?" ${voteAsker} asks.`,
      `"Who are you voting for?" ${voteAsker} asks.`,
      `"Who do you want to win?" ${voteAsker} asks.`,
    ])} ${mine}`));
    // somebody in the room sees it differently: once a night
    // somebody in the room sees it differently: once a night, and never the same juror for the same player twice in
    // a season (Dana's "It's Hicks for me" came back every week)
    const heard = gs.bb ? (gs.bb.juryNewsSaid ||= {}) : {};
    const other = !night.disagreed && residents.find(j => j !== voteAsker && j !== newcomer && favourite(j) && favourite(j) !== fav && !heard[`${j}|${favourite(j)}`]);
    if (other) {
      night.disagreed = true;
      const theirs = favourite(other);
      heard[`${other}|${theirs}`] = true;
      beats.push(beat('DISAGREE', [other, fav, theirs], say([
        `"${fav}?" ${other} says. "No. I'm voting for ${theirs}. ${why(other, theirs)}"`,
        `${other} shakes ${P(other).posAdj} head. "Not me. It's ${theirs} for me. ${why(other, theirs)}"`,
      ])));
    }
  } else {
    beats.push(beat('ALONE', [newcomer, fav], `${newcomer} sits by the fire on ${p.posAdj} own. If ${sub} had to vote tonight, it would be ${fav}. "${why(newcomer, fav)}"`));
  }
  if (least && least !== fav && !night.grudge && readOf(newcomer, least) < -0.8) {
    night.grudge = true;
    beats.push(beat('THE GRUDGE', [newcomer, least], say([
      `"And ${least} isn't getting my vote," ${newcomer} says. "Not after how ${P(least).sub} treated me."`,
      `"I'll tell you now, it won't be ${least}," ${newcomer} says. "Whatever ${least} says at the end."`,
    ])));
  }
  return beats;
}

// ── the room meets the newcomer ───────────────────────────────────────
// The user, 2026-10-07: "they don't really talk about each other in the jury house. Are they happy
// or sad to see the new one? Arguments, hugs, sadness... 'what was your strategy exactly, you were
// floating and you got rid of me, your only ally'." The residents with the most history with the newcomer
// (not the one who opened the door: they have had their moment) say so, from the record: who nominated whom
// (said out loud at every ceremony), the alliances they shared, how close they were, and who each believes
// wrote their name. Two at most: three in a row was a queue, not a room.
function reunionBeats(newcomer, residents, say) {
  const weeks = gs.bb?.weeks || [];
  const nominated = (by, who) => weeks.some(w => w.hoh === by && (w.acts || []).some(a => a?.type === 'nominations' && (a.nominees || []).includes(who)));
  const shared = (a, b) => (gs.namedAlliances || []).filter(al => (al.members || []).includes(a) && (al.members || []).includes(b)).map(al => al.name);
  const believes = (j, n) => { try { return believedVoters(j, j).includes(n); } catch { return false; } };
  const wins = n => { const st = gs.bb?.stats?.[n] || {}; return (st.hohWins || 0) + (st.vetoWins || 0) + (st.blockBusterWins || 0); };
  const pn = P(newcomer);
  const rows = residents.map(j => {
    const put = nominated(newcomer, j), wrote = believes(j, newcomer), al = shared(j, newcomer), bond = getBond(j, newcomer);
    let kind = null;
    if ((put || wrote) && al.length) kind = 'ally-betrayed';
    else if (put) kind = 'nominated-me';
    else if (wrote) kind = 'voted-me';
    else if (bond >= 4) kind = 'friend';
    else if (bond <= -3) kind = 'cold';
    else if (wins(newcomer) === 0 && (gs.bb?.stats?.[newcomer]?.timesNominated || 0) <= 1) kind = 'floater';
    const heat = { 'ally-betrayed': 5, 'nominated-me': 4, 'voted-me': 3, friend: 2, cold: 2, floater: 1 }[kind] || 0;
    return { j, kind, al: al[0], heat };
  }).filter(r => r.kind).sort((a, b) => b.heat - a.heat).slice(0, 2);
  const beats = [];
  for (const { j, kind, al } of rows) {
    const pj = P(j);
    if (kind === 'ally-betrayed') beats.push(beat('BETRAYED', [j, newcomer], say([
      `${j} doesn't get up. "We were in ${al} together, and you sent me here. Why?" ${newcomer} sits down across from ${pj.obj}. "Because you were a bigger threat to me than anyone. I'm sorry."`,
      `${j} speaks before anyone else can. "Hi, partner. Remember ${al}? I think about it every day out here." ${newcomer} closes ${pn.posAdj} eyes. "I deserve that."`,
      `${j} stays on the couch. "I was in ${al} with you. I trusted you, and you got rid of me. So I'm not getting up to hug you."`,
    ])));
    else if (kind === 'nominated-me') beats.push(beat('THE KEY', [j, newcomer], say([
      `${j} raises a glass from across the room. "To the person who put me on the block. Welcome." ${newcomer} laughs a little. "Fair enough."`,
      `${j} looks at ${newcomer} for a moment. "You nominated me. I understood it. I didn't like it." ${newcomer} nods. "That's fair."`,
      `${j} folds ${pj.posAdj} arms. "You put me on the block, and now you're here too." ${newcomer} sits down across from ${pj.obj}. "I know. I'm still sorry it was you."`,
    ])));
    else if (kind === 'voted-me') beats.push(beat('THE BALLOT', [j, newcomer], say([
      `${j} is waiting. "Before you sit down. Did you vote me out?" ${newcomer} hesitates a second too long, and ${j} has the answer.`,
      `${j} doesn't stand up. "I know you voted me out. I'm not angry any more. I just want you to say it." ${newcomer} takes a breath. "Okay. I did."`,
      `"So," ${j} says. "Did you vote me out?" ${newcomer} sighs. "Can I put my bag down first?"`,
    ])));
    else if (kind === 'friend') beats.push(beat('FRIEND', [j, newcomer], say([
      `${j} gets up and hugs ${newcomer}. "I'm so sorry. I really wanted you to win."`,
      `${j} is crying a little. "I was hoping it wouldn't be you. I really was."`,
      `"I'm happy to see you," ${j} says, "but I hate that it's here."`,
      `${j} squeezes ${newcomer}'s hand. "You deserved to go a lot further than this."`,
    ])));
    else if (kind === 'cold') beats.push(beat('COLD', [j, newcomer], say([
      `${j} doesn't look away from the fire. "Of course it's you."`,
      `${j} gets up and leaves the room when ${newcomer} walks in. Everybody notices. Nobody says anything.`,
      `${j} barely looks up. "Welcome to the jury. Don't expect me to make room on the couch."`,
    ])));
    else if (kind === 'floater') beats.push(beat('THE STRATEGY', [j, newcomer], say([
      `"Honest question," ${j} says. "What was your strategy? From out here it looked like you were floating." ${newcomer} bristles. "Staying off the block is a strategy. I lasted longer than you did."`,
      `${j} is blunt. "You never won anything. How did you last this long?" ${newcomer} shrugs. "I didn't make enemies. Somebody still wanted me out, though."`,
    ])));
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
      `${juror} brings ${enemy} a coffee on the porch. "Peace offering." ${enemy} takes it. "I'll accept. I'm too tired to hate you any more."`,
      `${enemy} and ${juror} end up playing cards late at night. "I still think you were wrong," ${enemy} says. ${juror} deals the next hand. "I know. Your turn."`,
        `${juror} and ${enemy} end up washing dishes side by side. "I was so angry with you in there," ${juror} says. "Out here it's hard to stay angry. You were playing, same as me."`,
        `${enemy} finds ${juror} on the porch. "I'm sorry. Properly sorry. Not for the vote, for how I did it." ${juror} looks at ${enemy} for a long time. "Okay. Thank you."`,
        `"Can we just talk about it?" ${enemy} asks. ${juror} sighs. "Fine. You put me in a bad spot, and I took it personally. I don't think I will out here."`,
      ])
      : draw('grudge', [
      `${enemy} asks ${juror} a question across the dinner table. ${juror} answers someone else instead. The table goes very quiet.`,
      `${juror} and ${enemy} end up in the kitchen at the same time. Neither leaves first. Neither speaks. The kettle is the loudest thing in the room.`,
        `${enemy} has tried all week to get a word out of ${juror}. At dinner, one more try. "Can you pass the salt?" ${juror} passes it without looking up.`,
        `${enemy} tries to start a conversation. "I'm not ready," ${juror} says. "You sent me here. Give me a few more days before you want to be friends."`,
        `${juror} leaves the room every time ${enemy} walks in. "It's not about the game," ${juror} tells the others. "It's about how ${enemy} lied to my face."`,
        `${enemy} sits down next to ${juror}. "You could at least look at me." ${juror} keeps staring at the fire. "I could. I'd rather not. You know what you did."`,
      ])));
  }

  // And the ones with nobody to fight, sitting with it.
  for (const juror of residents) {
    if (seen.has(juror)) continue;
    seen.add(juror);
    beats.push(beat('THE LONG DAYS', [juror], draw('long2', [
      `${juror} spends the afternoon walking circles around the yard. "I keep replaying the vote. If I'd done one thing differently, I'd still be in there."`,
      `${juror} sits on the porch steps at sunset. "It's so quiet out here. In the house there was always somebody plotting. I miss that, which is weird."`,
      `${juror} admits it over breakfast. "I dreamed I was back in the house last night, and I woke up relieved. Then I woke up properly and I wasn't."`,
      `${juror} keeps checking the door. "I just want to know who's next. I want news. Any news."`,
      `${juror} keeps replaying the week ${P(juror).sub} went home. "I keep thinking, if I'd talked to one more person, I'd still be in there."`,
      `${juror} sits by the fire with the others. "The worst part isn't losing. It's not knowing what's happening in there right now."`,
      `At dinner, ${juror} finally admits it. "I miss it. Even the bad days. Out here there's nothing to do but think about what I got wrong."`,
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
  const out = tableTalkBase(player, backer, doubter, residents, draw);
  // what each speaker values decides their argument (the user, 2026-10-07: "they always keep the
  // one with the most comp wins as the one winning"); the record's version stays when the
  // speaker's lens has nothing true to say about this player
  const forL = lensCase(backer, player, 'for'), agL = lensCase(doubter, player, 'against');
  const bi = out.findIndex(t => t.by === backer), di = out.findIndex(t => t.by === doubter);
  if (forL && bi >= 0) {
    out[bi] = { by: backer, t: forL };
    // the juror sent home on that week only answers the move it was about
    const vi = out.findIndex((t, i) => i > bi && i < (di < 0 ? out.length : di) && t.by !== backer && t.by !== doubter);
    if (vi >= 0 && !forL.includes(out[vi].by)) out.splice(vi, 1);
  }
  const di2 = out.findIndex(t => t.by === doubter);
  if (agL && di2 >= 0) {
    out[di2] = { by: doubter, t: agL };
    const ri = out.findIndex((t, i) => i > di2 && t.by === backer);
    const R = [`Then tell me who played better. Because I don't see it.`, `That's one way to look at it. It isn't the only one.`, `You're judging the game you wanted to see, not the one ${player} played.`, `Fair. I still think you're wrong.`, `I hear you. I just don't think the rest of the jury will.`];
    const h = [...(player + doubter + backer)].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) >>> 0, 7);
    if (ri >= 0) out[ri] = { by: backer, t: R[h % R.length].replace('${player}', player) };
  }
  return out;
}
function tableTalkBase(player, backer, doubter, residents, draw) {
  const r = resumeOf(player, residents);
  const pp = P(player);
  const out = [];
  const sayBy = (by, t) => out.push({ by, t });
  // the case for
  const victim0 = r.sentHome.find(j => j !== backer);
  const victim = r.wins >= 2 ? null : victim0;
  if (r.wins >= 2) sayBy(backer, draw('for-wins', [
      `${player} won ${r.winSay}. You can't argue with that. When it counted, ${pp.sub} delivered.`,
      `Every time ${player} was in danger, ${pp.sub} won something. ${r.winSay.replace(/^./, c => c.toUpperCase())}. That's not luck.`,
    `${player} has won ${r.winSay}. When ${player} needed a win, ${pp.sub} went and got one. That's how you get to the end.`,
    `Look at the record: ${r.winSay}. Nobody else left in that house comes close.`,
    `${player} has won ${r.winSay}. Every time the house came for ${pp.obj}, ${pp.sub} won ${pp.posAdj} way out of it.`,
  ]));
  else if (victim) sayBy(backer, draw('for-move', [
      `${player} sent ${victim} home on ${pp.posAdj} own HOH. Clean, planned, done. That's the kind of move a winner makes.`,
      `Say what you like about ${player}, but ${pp.sub} got ${victim} out. Nobody else had the nerve.`,
    `${player} was HOH the week ${victim} went home. That was ${player}'s plan, and it worked. That's a real move.`,
    `${player} took out ${victim}. ${player} had the key, picked the target, and got it done. That's playing.`,
  ]));
  else if (r.noms === 0) sayBy(backer, draw('for-safe', [
      `${player} has never sat on the block. Do you know how hard that is in that house? Everybody likes ${pp.obj}, and that is the whole game.`,
      `${player} made it this far without one nomination. That isn't an accident. That's people choosing not to put ${pp.obj} up, week after week.`,
    `${player} has never been on the block. Not once. You don't get that lucky in this house. That's social game.`,
    `Name one week anyone wanted ${player} gone badly enough to nominate ${pp.obj}. You can't. That's a skill.`,
  ]));
  else if (r.noms >= 2) sayBy(backer, draw('for-survive', [
      `${player} has been nominated ${r.noms === 2 ? 'twice' : `${NUM(r.noms)} times`}, and every time ${pp.sub} talked ${pp.posAdj} way out of it. That takes real skill.`,
      `How many of us got sent home the first time we went up? ${player} keeps going up and keeps coming back.`,
    `${player} has been on the block ${r.noms === 2 ? 'twice' : `${NUM(r.noms)} times`} and is still in that house. Every time, ${pp.sub} found the votes to stay.`,
    `${Cap(NUM(r.noms))} nominations. ${Cap(NUM(r.noms))}! And ${player} is still there, and we're all here. Think about that.`,
  ]));
  else sayBy(backer, draw('for-social', [
      `${player} made every person in that house feel like ${pp.sub} was on their side. Including half of us. That's a strategy.`,
      `Nobody in this room can say ${player} was cruel to them. That's going to matter at the end more than anyone thinks.`,
    `${player} is the one person in that house nobody here has a bad word for. That's how you win a jury.`,
    `${player} talked to every single one of us like a person, not a vote. I noticed. I think we all did.`,
  ]));
  // whoever left on that player's week has something to say about it
  if (victim && victim !== doubter) sayBy(victim, draw('victim', [
      `That was my week, by the way. I remember every second of it.`,
      `I'm the move you're talking about. Just so everybody knows.`,
    `I'm sitting right here, you know.`,
    `It worked on me. I can't really argue with that, much as I'd like to.`,
    `I was there for that week. Believe me, I remember it.`,
  ]));
  // the case against, from the doubter's own reason
  let reason;
  if (r.sentHome.includes(doubter)) {
    reason = 'sent';
    sayBy(doubter, draw('against-sent', [
      `${player} sent me home. I'll try to be fair, but I'm telling you now, it's hard.`,
      `I'm going to say it: ${player} put me up and got me out. I don't think I'm ever voting for ${pp.obj}.`,
      `${player} put me on the block and sent me home. I'll be honest, I'm not the most neutral person to ask about ${player}.`,
      `It was ${player}'s HOH that got me out. So no, I'm not jumping to hand ${pp.obj} the money.`,
    ]));
  } else if (r.blamedBy.includes(doubter)) {
    reason = 'voted';
    sayBy(doubter, draw('against-voted', [
      `${player} voted me out. I know it. It's going to take a lot for ${pp.obj} to win me back.`,
      `${player} looked me in the eye that week and then voted me out. I haven't forgotten.`,
      `${player} voted me out. I know it. I'm not going to pretend that doesn't matter to me.`,
      `I'm pretty sure ${player} voted me out. You'll forgive me if I don't stand up and clap.`,
    ]));
  } else if (r.wins === 0) {
    reason = 'nowins';
    sayBy(doubter, draw('against-nowins', [
      `${player} has won nothing. Nothing! I can't reward somebody who never won a single thing.`,
      `Name one competition ${player} won. You can't, because there aren't any.`,
      `${player} hasn't won a single competition. Not one. Somebody else has been doing the heavy lifting.`,
      `Zero wins. If ${player} is in the final, it's because other people kept ${pp.obj} there.`,
    ]));
  } else if (r.noms === 0 && r.wins >= 2) {
    reason = 'safewins';
    sayBy(doubter, draw('against-safewins', [
      `${player} only ever won when there was nothing on the line. Show me the week ${pp.sub} was really in danger.`,
      `Winning HOH is easy when nobody's coming for you. ${player} was never on the block. I want to know what ${pp.sub} did with all that power.`,
      `${player} won when it was safe to win. Never nominated, never fighting for ${pp.posAdj} life. That's a different game from the one we played.`,
    ]));
  } else if (r.noms === 0) {
    reason = 'floated';
    sayBy(doubter, draw('against-floated', [
      `${player} floated. ${pp.Sub} just went wherever the votes were going. I can't reward that.`,
      `Ask yourself what ${player} actually did. I think ${pp.sub} just stayed out of the way and let everyone else fight.`,
      `Never on the block means nobody ever thought ${player} was a threat. Why would I reward that?`,
      `${player} was never nominated because ${player} was never in anybody's way. That's not a strategy. That's a hiding place.`,
    ]));
  } else {
    reason = 'nomove';
    sayBy(doubter, draw('against-nomove', [
      `${player} is lovely. I'd have a drink with ${pp.obj} any day. But I can't name one decision ${pp.sub} made.`,
      `Everything ${player} did, somebody else planned. ${pp.Sub} just went along with it.`,
      `I like ${player}. I do. I just can't name one big move ${player} made on ${pp.posAdj} own.`,
      `What did ${player} actually decide? Not survive. Decide. I'm still waiting for an answer.`,
    ]));
  }
  // the answer to it
  sayBy(backer, draw(`rebut-${reason}`, {
    sent: [`Then don't vote for ${pp.obj}. But don't pretend it wasn't a good move.`, `Everybody in this room got sent home by someone. You can't vote against all of them.`, `That's fair. But it's the game. You'd have done exactly the same with the key.`, `You're bitter, and you're allowed to be. It was still a good move.`],
    voted: [`You'd have voted ${pp.obj} out too if you'd had the chance.`, `The jury isn't about who hurt you. It's about who played best.`, `That's the game. Everybody here voted somebody out. You can't hold that against ${pp.obj} at the end.`, `If voting somebody out rules you out, nobody in that house gets a vote from you.`],
    nowins: [`You don't need to win comps if nobody ever puts you on the block.`, `Some of the best players never won a thing. They didn't need to.`, `Competitions aren't everything. ${player} is still in that house and we're sitting in a lodge.`, `Winning comps makes you a target. Not winning them and still being there is the harder thing.`],
    safewins: [`Winning without making enemies is the hardest thing in that house.`, `${pp.Sub} won and nobody turned on ${pp.obj}. That's twice as impressive.`, `Using power without making enemies is the hardest thing in that house. ${player} did it.`, `Nobody came for ${pp.obj} because ${pp.sub} kept winning. That's the point.`],
    floated: [`Calling it floating doesn't make it easy. Try staying off the block that long.`, `Quiet isn't the same as lazy. ${pp.Sub} picked every side carefully.`, `Staying off the block for that long is a strategy. It's just a quiet one.`, `Being in nobody's way is how you get to the end. And ${pp.sub}'s nearly there.`],
    nomove: [`Maybe the big moves just weren't ${pp.posAdj} name on them. That's smart too.`, `You don't see the moves because ${pp.sub} made them in private.`, `Then name somebody in that house who made more.`, `Not every game is loud. Some of the best ones aren't.`],
  }[reason]));
  return out;
}

/** Where one juror stands on a player, said in their own words to the table. */
function standLine(juror, player, draw) {
  const read = readOf(juror, player);
  // somebody who said the same thing about the same player at an earlier table says it AS a
  // repeat, not as news (the same verdict, word for word, every week was the complaint)
  const stance = read > 0.6 ? 'yes' : read < -0.6 ? 'no' : 'maybe';
  const said = gs.bb ? (gs.bb.juryStances ||= {}) : {};
  const before = said[`${juror}|${player}`];
  said[`${juror}|${player}`] = stance;
  if (before === stance) return draw(`still-${stance}`, {
    yes: [`Same as last time. ${player} has my vote.`, `Nothing's changed for me. Still ${player}.`, `You all know where I stand on ${player}. That hasn't moved.`, `Still ${player}. Every week I'm more sure.`],
    no: [`I said it before and I'll say it again: not ${player}.`, `Still no on ${player}. Sorry.`, `${player} hasn't done anything to change my mind since last time.`, `My answer on ${player} is the same as it was.`],
    maybe: [`I'm still stuck on ${player}. I go back and forth every day.`, `Still undecided about ${player}. Honestly.`, `I keep changing my mind about ${player}. Tonight didn't help.`, `I thought I'd know about ${player} by now. I don't.`],
  }[stance]);
  if (before && before !== stance) return draw(`turn-${stance}`, {
    yes: [`I have to admit it: I've come round on ${player}. I'd vote for ${P(player).obj} now.`, `A few weeks ago I'd have said no to ${player}. Not any more.`],
    no: [`I was leaning toward ${player}. After tonight, I'm not.`, `I've changed my mind about ${player}. I can't vote for ${P(player).obj}.`],
    maybe: [`I was sure about ${player}. Now I'm really not.`, `Tonight shook me on ${player}. I need to think.`],
  }[stance]);
  if (read > 0.6) return draw('stand-yes', [
      `I'll say it now: ${player} has my vote.`,
      `If it's ${player} at the end, I know what I'm doing.`,
      `${player}. That's my vote, and nothing tonight has changed it.`,
    `For what it's worth, if ${player} is sitting at the end, ${player} has my vote.`,
    `I'm with that. ${player} has my vote unless something changes.`,
  ]);
  if (read < -0.6) return draw('stand-no', [
      `I'm not voting for ${player}. I've known that for weeks.`,
      `${player} has a lot of work to do to get my vote, and not much time to do it.`,
      `Not ${player}. Sorry. Not for me.`,
    `${player} would have to give the speech of a lifetime to get my vote.`,
    `I'm sorry, but ${player} isn't getting my vote. I've made my mind up.`,
  ]);
  return draw('stand-maybe', [
      `I'm still on the fence about ${player}. Everything you've both said makes sense.`,
      `I want to believe in ${player}. I'm just not there yet.`,
      `Ask me again on finale night. ${player} could still win me over.`,
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
      `${lobbyist} sits next to ${target} after dinner. "Can I make my case for ${favourite_}? Just hear me out. Then I'll leave you alone."`,
      `${lobbyist} gets ${target} alone in the yard. "If ${against} wins, every one of us got played and rewarded it. Think about that."`,
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
  // Everybody who left this week and is a juror arrives tonight: the White Locust's loser too, who went out before
  // the vote (the user, 2026-10-29: "nina wasnt in that jury house ... its like she was erased")
  const opening = (week?.houseAtStart || []).length;
  const tonight = weekExits(week).filter((x, i) => evictionSeatsAJuror(opening - i)).map(x => x.name);
  const residents = [...seated, ...tonight.filter(n => !seated.includes(n))];
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
  /** @type {any[]} */
  const acts = [];
  // Where the room stood before tonight, so the screen can show the board
  // moving instead of only where it ended up. Without this the reads panel
  // would be a spoiler: the final numbers sitting there while the audience is
  // still on the first card of the argument that produced them.
  const snapshot = () => Object.fromEntries(residents.map(j => [j,
    Object.fromEntries((gs.activePlayers || []).map(p => [p, Number(readOf(j, p).toFixed(2))]))]));
  const readsBefore = snapshot();

  // Everybody who arrives tonight, in the order they left: the White Locust's loser was out at the start of the
  // week and is already on the sofa when the week's evictee walks in (only the evictee carries a parting shot).
  // A juror whose own exit week had a jury house that never showed them walking in arrives now, first: a season saved
  // before 2026-10-29 seated the White Locust's loser without a door (the user: "nina wasnt in the jury at ep11 after
  // the fix would she be in it at ep12?"). Keyed to the exit week's own act, so a season with no jury house yet is untouched.
  const weeks = gs.bb?.weeks || [];
  const exitWeekOf = new Map(weeks.flatMap(w => weekExits(w).map(x => [x.name, w])));
  const late = seated.filter(n => {
    const w = exitWeekOf.get(n);
    if (!w || w === week || tonight.includes(n)) return false;
    const shown = weeks.filter(x => Number(x.num) >= Number(w.num) && x !== week)
      .map(x => (x.acts || []).find(a => a?.type === 'jury-house')).filter(Boolean);
    return shown.length > 0 && !shown.some(a => (a.residents || []).includes(n));
  });
  const arrivingTonight = [...new Set([...late, ...tonight.filter(n => n !== newcomer && residents.includes(n)), newcomer].filter(Boolean))];
  const arrivals = [];
  // what tonight has already said, across every arrival: its own dice, so the words move nothing else
  const said = { rng: stableRng('jharrival', num, residents.join('|')), used: new Set(), arrived: false, newsTold: false, disagreed: false, grudge: false };
  arrivingTonight.forEach((who, i) => {
    const later = arrivingTonight.slice(i + 1);
    const rest = residents.filter(n => n !== who && !later.includes(n));
    const isLate = late.includes(who);
    arrivals.push(...arrivalScene(who, rest, isLate ? Number(exitWeekOf.get(who).num) : num, out, said,
      who === week?.evicted ? (week.lastWords || null) : null, isLate));
  });
  if (arrivals.length) acts.push({ title: 'The Door Opens', beats: arrivals });

  // What the room passes between itself, whether or not tonight is a big one.
  try {
    reconcileBBJury(residents, { week: num, rng: stableRng('reconcile', num, residents.join()) });
  } catch { /* nothing moves */ }

  // The roundtable is the room's real business, so it sits every week there are three to argue
  // (the user, 2026-10-07: "where's the round table?"); off the full weeks it is a shorter sitting
  // and moves the room less, so a season of them weighs about what the old every-third-week did.
  // The night itself: two to four scenes chosen from what is live this week, never the same shape
  // twice running (jury-house-scenes.js chooseNight). The grudges the long week rolls (which move
  // bonds) are still rolled on a full night, and air only when the night picks them.
  const lastKinds = gs.bb?.juryNightKinds || [];
  let grudgeBeats = [];
  const others0 = residents.filter(n => n !== newcomer);
  if (full) grudgeBeats = longWeekBeats(others0.length ? others0 : residents, num, rng);
  const night = chooseNight({ week, residents, newcomer, full, lastKinds, grudgeBeats });
  acts.push(...night.acts);
  if (gs.bb) gs.bb.juryNightKinds = night.kinds;
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

    const table = roundtable(residents, num, rng);
    if (table) acts.push({ title: 'The Roundtable', beats: [], roundtable: table });

    const lobby = lobbyBeats(residents, num, rng);
    const closing = [...lobby];
    const speaker = residents[Math.floor(rng() * residents.length) % residents.length];
    closing.push(beat('BEFORE FINALE NIGHT', [speaker], pick(rng, [
      `${speaker} looks around the fire at all of them. "Whatever happens, we owe it to ourselves to vote for whoever actually played the best. Not whoever we like most."`,
      `${speaker} raises a glass. "To the people who sent us here. One of them is about to get very rich, and we decide which."`,
      `${speaker} says what the room has been circling all week. "Our vote is the last bit of power any of us has in this game. I'm not wasting mine on a grudge."`,
      `${speaker} looks around the room. "Every one of us got here because of somebody still in that house. And now we get to decide which of them wins."`,
      `${speaker} goes quiet, then speaks. "It's real now. A few more days and we're sitting in front of them, deciding."`,
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
