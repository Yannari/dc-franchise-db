// ══════════════════════════════════════════════════════════════════════
// bb-events/schemes.js — Total Drama's social schemes, played in a house
// ══════════════════════════════════════════════════════════════════════
//
// The other simulator already has a deep social-manipulation layer: forged
// notes with a belief check against the reader's mental and intuition, lies
// that can trigger a confrontation, whisper campaigns that seed doubt with
// half the cast, a false vote plan that actually steers a ballot and gets
// traced back the following week, and the two reaction events — somebody
// catching a schemer, somebody comforting the victim — that make the whole
// thing a system rather than a text generator.
//
// None of it was reachable from a Big Brother season, and rewriting it here
// would have been the same nine events built twice, drifting apart forever.
// This is a bridge, not a reimplementation: the generators in
// js/social-manipulation.js do the work and apply their own consequences
// through the shared bond, memory and vote-planning modules, and this file
// decides who schemes, when, and in which room.
//
// The one scheme deliberately left behind is the challenge-throw accusation,
// which is structurally Total Drama — it needs a tribe that lost a challenge.
//
// The only adaptation is vocabulary. The generators say "the tribe" because
// they were written for one; a house is a house.

import { gs, seasonConfig } from '../core.js';
import { pronouns, romanticCompat } from '../players.js';
import {
  _generateForgeNote, _generateSpreadLies, _generateKissTrap,
  _generateWhisperCampaign, _generateCampaignRally, _generateFalseMajority,
  _generateExposeSchemer, _generateComfortVictim,
} from '../social-manipulation.js';
import { getBond } from '../bonds.js';
import { endgameDealsOf, tierOf } from '../bb/deals.js';
import {
  pStats, band, furthestFrom, willScheme, isNice, beatsInvolving, spotlightOrder,
} from './_read.js';

// ── helpers ───────────────────────────────────────────────────────────

/**
 * Who this person has actually promised the end to.
 *
 * The one fact in the exposure pool that can be true or false, so it gets
 * looked up rather than asserted. Two or more standing final-two promises is
 * the thing worth telling the house about; one is just a game.
 */
function doubleDealPartners(name) {
  if (!name) return [];
  let deals = [];
  try { deals = endgameDealsOf(name) || []; } catch { return []; }
  return deals
    .filter(deal => deal.active !== false && tierOf(deal) === 'final-two')
    .flatMap(deal => (deal.players || []).filter(other => other !== name))
    .filter((other, i, all) => other && all.indexOf(other) === i
      && (gs.activePlayers || []).includes(other));
}

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
/** Least-seen first, weighted toward whoever this week is about. */
const _quiet = pool => spotlightOrder(pool);
const _listNames = names => (names.length <= 1 ? (names[0] || 'nobody')
  : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);
const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
const _textPick = (lines, result, salt = '') => {
  const key = `${salt}|${(result.players || []).join('|')}|${result.text || ''}|${result.badgeText || ''}`;
  let hash = 2166136261;
  for (const ch of key) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619) >>> 0;
  return lines[hash % lines.length];
};

/** A house is not a tribe. The only thing these events need translating. */
const _house = text => String(text || '')
  .replace(/\bThe tribe\b/g, 'The house')
  .replace(/\bthe tribe\b/g, 'the house')
  .replace(/\btribe\b/g, 'house')
  .replace(/\bTribe\b/g, 'House')
  .replace(/\bthe camp\b/g, 'the house')
  .replace(/\bcamp\b/g, 'the house')
  .replace(/\b(He|She) weren't\b/g, '$1 wasn\'t')
  .replace(/\b(he|she) weren't\b/g, '$1 wasn\'t');

/**
 * The shared generators return mechanics receipts written for Total Drama.
 * Big Brother can receive several receipts from one scheme, so each one gets
 * a plain connective scene here instead of gluing unrelated narration into a
 * single paragraph.
 */
function _bbResultText(result, salt = '') {
  const p = result.players || [];
  switch (result.type) {
    case 'forgeNote': {
      const [schemer, reader, alleged] = p;
      if (result.badgeText === 'EXPOSED') {
        return _textPick([
          `${reader} compares the handwriting with a note ${schemer} left in the kitchen. When ${reader} asks about the match, ${schemer} has no answer.`,
          `${reader} notices the note uses a phrase ${schemer} says all the time. ${reader} brings both the note and ${schemer} into the living room and asks everyone to listen.`,
          `${reader} asks ${alleged || 'the person named in the note'} about the message. Their stories line up immediately, and both turn to ${schemer}.`,
          `${reader} checks one detail in the note with another houseguest. It is wrong. A second detail is wrong too. By dinner, ${reader} has traced it back to ${schemer}.`,
          `${reader} finds an indentation from the forged message on a pad in ${schemer}'s things. ${reader} confronts ${schemer} with both pages.`,
          `${reader} reads the note aloud. ${schemer} corrects a detail that was never mentioned, then realizes everyone heard the mistake.`,
          `${reader} pretends to believe the note and asks ${schemer} to explain the plan again. The story changes on the second telling.`,
          `${reader} recognizes that the note is trying too hard to sound like ${alleged || 'someone else'}. ${reader} asks who benefits from the lie, and the room lands on ${schemer}.`,
        ], result, salt);
      }
      if (!alleged) return _house(result.text);
      const doubt = String(result.consequences || '').includes('seed of doubt');
      return doubt
        ? _textPick([
          `${schemer} slips a note into ${reader}'s drawer claiming ${alleged} has been sharing private conversations with ${reader}. ${reader} does not believe all of it, but stops speaking freely around ${alleged}.`,
          `${reader} finds a handwritten vote count with ${alleged}'s name beside a plan they never discussed. The handwriting looks wrong, but the numbers bother ${reader} anyway.`,
          `${schemer} leaves ${reader} an unsigned warning about ${alleged}. ${reader} keeps the note and quietly checks whether anyone else heard the same story.`,
          `${reader} finds a note suggesting ${alleged} has another final two. ${reader} suspects a setup, but still asks ${alleged} several pointed questions that night.`,
          `${schemer} plants a short message saying ${alleged} wants ${reader} nominated. ${reader} cannot verify it and decides not to show ${alleged} the note yet.`,
          `${reader} finds what looks like a message from ${alleged} arranging a private meeting. One detail is off. ${reader} watches the meeting place anyway.`,
          `${schemer} leaves a fake alliance list where ${reader} will see it. ${alleged} is on the list and ${reader} is not. ${reader} calls it suspicious, then folds it into a pocket.`,
          `${reader} receives a note accusing ${alleged} of leaking information. ${reader} doubts the source more than the accusation, but trust between ${reader} and ${alleged} still cools.`,
        ], result, salt)
        : _textPick([
          `${schemer} hides a note in ${reader}'s suitcase claiming ${alleged} has been pushing ${reader}'s name. ${reader} reads it twice and decides not to warn ${alleged}.`,
          `${reader} finds a fake vote tally showing ${alleged} organizing the numbers against ${pronouns(reader).obj}. The count looks convincing, and ${reader} starts planning a response.`,
          `${schemer} leaves an unsigned message saying ${alleged} repeated something personal about ${reader}. ${reader} believes it and goes looking for an explanation.`,
          `${reader} finds what appears to be ${alleged}'s list of allies and targets. ${reader}'s name is underlined in the wrong column.`,
          `${schemer} plants a note suggesting ${alleged} promised the same deal to several people. ${reader} recognizes enough real names to trust the rest.`,
          `${reader} discovers a message saying ${alleged} wants ${pronouns(reader).obj} used as a pawn. ${reader} pockets it before anyone else enters the room.`,
          `${schemer} leaves a note that looks like a private message from ${alleged} to another ally. ${reader} believes the message was never meant for ${pronouns(reader).obj}.`,
          `${reader} finds a warning that ${alleged} plans to blame ${pronouns(reader).obj} if the vote flips. ${reader} immediately stops sharing information with ${alleged}.`,
          `${schemer} plants a fake final-three proposal bearing ${alleged}'s name. ${reader} reads it as proof that ${pronouns(reader).posAdj} own deal with ${alleged} was never exclusive.`,
          `${reader} finds a folded note beside ${pronouns(reader).posAdj} bed claiming ${alleged} has been laughing about ${pronouns(reader).obj}. The accusation feels personal enough to be true.`,
        ], result, salt);
    }
    case 'spreadLies': {
      const [first, second, third] = p;
      if (result.badgeText === 'CONFRONTATION') {
        return _textPick([
          `${first} confronts ${second} in the kitchen: somebody said ${second} was pushing ${first}'s name. ${second} denies it, asks who started the story and gets no answer.`,
          `${first} waits until everyone is in the living room, then asks ${second} to repeat the comment directly to ${first}. ${second} says the comment never happened.`,
          `${first} corners ${second} near the storage room. Both start talking over each other, and several houseguests come inside to hear what started it.`,
          `${first} asks ${second} one calm question. ${second}'s confused answer makes it clear they have heard two completely different versions of the same conversation.`,
          `${first} accuses ${second} of spreading their name. ${second} demands names and times; ${first} only has the story they were given.`,
          `${second} is halfway through denying the rumor when ${first} raises their voice. The argument moves from the bedroom into the hallway and becomes public.`,
        ], result, salt);
      }
      if (result.badgeText === 'WARNED') {
        return _textPick([
          `${first} finds ${second} afterward and repeats exactly what was said. ${second} asks them not to correct the rumor yet; they want to see who else brings it up.`,
          `${first} warns ${second} that somebody is using their name. ${second} is angry, but thanks ${first} for coming directly to them.`,
          `${first} pulls ${second} into the pantry and explains the story before it spreads further. Together they compare who could have started it.`,
          `${first} tells ${second} about the accusation and names the source. ${second} asks one question, then heads straight for the source.`,
          `${first} repeats the rumor to ${second} word for word. ${second} recognizes which real conversation was twisted to create it.`,
          `${first} lets ${second} know their name is circulating. ${second} decides to act unaware while checking the story with everyone involved.`,
        ], result, salt);
      }
      if (third) {
        return _textPick([
          `${first} tells ${second} that ${third} has been pushing their name in private. ${second} believes it and begins comparing notes with other people.`,
          `${first} claims ${third} mocked ${second} after they left the room. ${second} takes it personally and goes looking for ${third}.`,
          `${first} warns ${second} that ${third} offered them up as an easy nominee. ${second} believes the warning and stops sharing plans with ${third}.`,
          `${first} tells ${second} that ${third} called their alliance fake. ${second} asks who else heard it, and ${first} supplies just enough detail.`,
          `${first} says ${third} has been promising safety to everyone except ${second}. The story fits what ${second} already fears.`,
          `${first} tells ${second} that ${third} leaked their final-two deal. ${second} believes it and starts preparing for the relationship to break.`,
          `${first} claims ${third} wants ${second} blamed for a possible vote flip. ${second} decides to confront ${third} before the plan can spread.`,
          `${first} tells ${second} that ${third} laughed at the idea of taking them seriously. ${second} remembers every earlier slight and believes the rest.`,
        ], result, salt);
      }
      return _textPick([
        `${first} tries to convince ${second} that another houseguest is targeting them. ${second} asks for details, catches two contradictions and stops the conversation.`,
        `${second} listens to ${first}'s warning, then checks it with the person supposedly involved. The story falls apart immediately.`,
        `${first} brings ${second} a rumor with no names, no time and no witnesses. ${second} asks why ${first} is the only person saying it.`,
        `${second} lets ${first} finish the story, then says, “That doesn't sound like them.” ${first} changes the subject.`,
        `${first} pushes too hard for ${second} to believe the rumor. ${second} leaves the conversation more worried about ${first} than the alleged target.`,
        `${second} notices that every part of ${first}'s story benefits ${first}. Instead of reacting, ${second} files away the attempted manipulation.`,
      ], result, salt);
    }
    case 'comfortVictim': {
      const [comforter, victim] = p;
      return _textPick([
        `${comforter} checks on ${victim} after the confrontation and asks for ${victim}'s side before offering an opinion.`,
        `${comforter} finds ${victim} alone in the bedroom, brings water and stays while ${victim} goes over what happened.`,
        `${comforter} tells ${victim} that not everyone believes the story being spread. ${victim} finally stops trying to defend ${pronouns(victim).ref} for a moment.`,
        `${comforter} sits with ${victim} after the argument and helps separate what was actually said from what somebody added later.`,
        `${comforter} asks ${victim} whether advice or company would help more. ${victim} chooses company, and ${comforter} stays.`,
        `${comforter} finds ${victim} in the storage room and lets ${pronouns(victim).obj} vent without turning the conversation into another vote pitch.`,
        `${comforter} makes sure ${victim} eats after the confrontation, then listens while ${victim} decides what to do next.`,
        `${comforter} tells ${victim} exactly who defended ${pronouns(victim).obj} when the rumor spread. It is the first useful information ${victim} has heard all night.`,
      ], result, salt);
    }
    case 'exposeSchemer': {
      const [exposer, schemer] = p;
      // Everything here is a claim about what the schemer did, and one of these
      // used to be a claim about something CHECKABLE: that they had promised
      // several people a final two, with two of them confirming it on the spot.
      // It was in the pool unconditionally, so the house announced a specific,
      // verifiable fact about somebody who very often had exactly one deal or
      // none at all — and then two people confirmed a thing that had not
      // happened. The rest of these describe contradictions in what was said,
      // which the exposure firing at all already establishes. This one names a
      // number, so it has to earn it.
      const partners = doubleDealPartners(schemer);
      const lines = [
        `${exposer} compares what ${schemer} told different people and brings the contradictions to the group. When everyone asks ${schemer} for an explanation, the stories do not match.`,
        `${exposer} asks three houseguests to repeat what ${schemer} told them. Each heard a different target, a different deal and the same promise of secrecy.`,
        `${exposer} confronts ${schemer} in front of the people named in the rumor. ${schemer} tries to answer them one at a time, but they stop allowing private conversations.`,
        `${exposer} lays out a timeline of ${schemer}'s conversations on the kitchen table. The gaps disappear as other houseguests add what they heard.`,
        `${exposer} catches ${schemer} repeating a story that was already disproved. Instead of arguing privately, ${exposer} calls everyone into the room and asks ${schemer} to tell it again. With the whole house listening, the story changes almost immediately.`,
      ];
      if (partners.length >= 2) {
        lines.push(`${exposer} tells the house that ${schemer} has promised a final two to ${partners.length} different people. ${partners[0]} and ${partners[1]} confirm it in the same breath, and neither knew about the other.`);
      }
      return _textPick(lines, result, salt);
    }
    case 'whisperCampaignExposed': {
      const [target, schemer] = p;
      return _textPick([
        `${target} compares what people have been asking about ${pronouns(target).obj} and finds the same phrasing in three different rooms. The questions all trace back to ${schemer}.`,
        `${target} asks who first raised ${pronouns(target).posAdj} name. One person says ${schemer}; then another does. By dinner the “independent concerns” have a common source.`,
        `${target} catches ${schemer} making the same careful suggestion to somebody else. Instead of confronting ${schemer} privately, ${target} asks the room who heard it first.`,
        `${target} puts the conversations in order: a warning at breakfast, the same doubt in the backyard, the same name before bed. ${schemer} is at the beginning of all three.`,
      ], result, salt);
    }
    case 'whisperCampaign': {
      const [schemer, target] = p;
      return _textPick([
        `${schemer} spends the day pulling people aside and raising the same doubts about ${target}. By evening, several houseguests are repeating the concerns as their own.`,
        `${schemer} asks different people the same question: “What happens if ${target} wins next week?” Nobody is told what to think, but everyone leaves thinking about it.`,
        `${schemer} mentions ${target}'s closest deals in one room and their competition record in another. The arguments change; the name stays the same.`,
        `${schemer} never directly says to target ${target}. Instead, every private conversation ends with somebody else saying it.`,
        `${schemer} spends breakfast wondering aloud whether ${target} is too well connected, then lets the house carry the conversation for the rest of the day.`,
        `${schemer} quietly tells half the house that ${target} named them as a future nominee. By night, people who never compared notes share the same concern.`,
      ], result, salt);
    }
    case 'campaignRally': {
      const [rallier, target] = p;
      return _textPick([
        `${rallier} goes from room to room making the case against ${target}. Some people agree immediately; others begin checking whether the votes are there.`,
        `${rallier} gathers several voters in the bedroom and says splitting up over ${target} only helps ${target}. The group begins counting together.`,
        `${rallier} makes the case against ${target} at the kitchen table instead of whispering it. The direct approach forces everyone present to react.`,
        `${rallier} reminds each voter of a different reason to evict ${target}: a broken promise, a competition win, a deal that excludes them.`,
        `${rallier} asks everyone who feels safe with ${target} still in the house. The silence becomes the start of a campaign.`,
        `${rallier} stops pitching the move as a favor and starts pitching it as the only way several people reach next week. More voters stay to listen.`,
      ], result, salt);
    }
    case 'falseMajority': {
      const [schemer, victim] = p;
      return _textPick([
        `${schemer} tells ${victim} the house has already settled on a vote and walks through the supposed numbers. ${victim} believes the plan and agrees to keep quiet.`,
        `${schemer} catches ${victim} alone before bed and says the vote changed an hour ago. The list of names sounds complete enough that ${victim} stops asking around.`,
        `${schemer} sketches a vote count for ${victim} using cereal pieces on the table. Every piece is in the right place; none of the promises behind them are real.`,
        `${schemer} tells ${victim} they are the last person being brought into a unanimous plan. Relieved not to be excluded, ${victim} promises not to upset it.`,
        `${schemer} gives ${victim} a specific voter-by-voter count and warns that checking it could make the group nervous. ${victim} follows the instruction.`,
        `${schemer} claims the HOH and both nominees already know where the vote is going. ${victim} decides there is no reason to risk being the lone holdout.`,
        `${schemer} tells ${victim} the alliance changed its target during a meeting ${victim} missed. ${victim} is embarrassed enough to pretend the story makes sense.`,
      ], result, salt);
    }
    case 'falseMajorityResisted': {
      const [schemer, victim] = p;
      return _textPick([
        `${schemer} tells ${victim} the vote is already decided. ${victim} checks with one other person, discovers the numbers are false and confronts ${schemer}.`,
        `${victim} asks ${schemer} to name the supposed majority. One name is impossible, and ${victim} refuses the plan on the spot.`,
        `${schemer} gives ${victim} a clean vote count. ${victim} immediately checks the messiest voter on the list and learns there was never an agreement.`,
        `${victim} listens to ${schemer}'s plan, then asks why nobody else has mentioned it all day. ${schemer}'s answer changes twice.`,
        `${schemer} warns ${victim} not to verify the numbers. That warning is exactly why ${victim} walks into the next room and verifies them.`,
        `${victim} notices ${schemer} counted one voter who cannot vote this week. The rest of the fake majority collapses with the mistake.`,
        `${schemer} says the vote flipped minutes ago. ${victim} finds the alleged swing voter, who laughs and says they have not spoken to ${schemer} all day.`,
      ], result, salt);
    }
    case 'kissTrap': {
      if (String(result.consequences || '').includes('failed')) {
        const [schemer, kissTarget] = p;
        return _textPick([
          `${schemer} tries to get ${kissTarget} alone, but ${kissTarget} recognizes the setup and leaves before anything happens.`,
          `${kissTarget} notices that people keep trying to clear the room for ${schemer}. ${kissTarget} calls it out, and the plan ends there.`,
          `${schemer} makes a move on ${kissTarget} at exactly the wrong moment. ${kissTarget} steps back and asks who put ${schemer} up to this.`,
          `${schemer}'s accomplice gives the signal too early. ${kissTarget} sees the exchange, realizes the private conversation is staged and walks away.`,
        ], result, salt);
      }
      if (result.badgeText === 'SHOWMANCE DESTROYED') {
        const [witness, partner] = p;
        return `${witness} tells ${partner} the relationship is over. ${partner} asks to explain one more time, but ${witness} leaves the room.`;
      }
      if (p.length >= 4) {
        const [schemer, accomplice, kissTarget, witness] = p;
        return _textPick([
          `${accomplice} draws ${witness} out of the room while ${schemer} makes a move on ${kissTarget}. ${witness} returns early and demands to know what happened.`,
          `${accomplice} asks ${witness} for help in the storage room. When ${witness} comes back, ${schemer} and ${kissTarget} are standing much closer than before.`,
          `${schemer} waits until ${accomplice} gets ${witness} into the backyard, then corners ${kissTarget} in the bedroom. ${witness} returns before either hears the door.`,
          `${accomplice} keeps ${witness} busy with a fake problem while ${schemer} flirts openly with ${kissTarget}. Another houseguest sends ${witness} back inside.`,
          `${schemer} asks ${kissTarget} for a private talk after ${accomplice} leads ${witness} away. ${witness} comes back and catches the end of it.`,
          `${accomplice} asks ${witness} to help carry laundry in from the backyard. By the time ${witness} realizes the job could have waited, ${schemer} is alone with ${kissTarget}.`,
        ], result, salt);
      }
      const [witness, partner] = p;
      return _textPick([
        `${witness} confronts ${partner} in front of the house. ${partner} tries to explain, but ${witness} no longer knows what to believe.`,
        `${witness} asks ${partner} whether the moment was planned. ${partner} says no, then hesitates when asked why they stayed.`,
        `${witness} refuses to talk privately and makes ${partner} explain what happened in front of everyone who helped set it up.`,
        `${partner} follows ${witness} through two rooms trying to explain. ${witness} finally turns around and asks whether the relationship was ever real.`,
        `${witness} goes quiet after seeing ${partner} with someone else. When ${partner} reaches for ${pronouns(witness).obj}, ${witness} steps away.`,
        `${witness} asks ${partner} for the truth once. The answer takes too long, and ${witness} ends the conversation.`,
      ], result, salt);
    }
    default:
      return _house(result.text);
  }
}

/**
 * Fold a generator's results into one renderable beat.
 *
 * A scheme can produce several results — a forged note that gets detected
 * also produces the exposure — and the scheduler takes one beat per fire.
 * The consequences have already been applied by the generator either way, so
 * this is purely presentation: the texts read as one moment because that is
 * what they are.
 */
function _fold(results, badgeText, badgeClass, salt = '') {
  const list = (results || []).filter(r => r && r.text)
    // Some shared generators append the triggering action after its detection
    // result. A house cannot expose a whisper campaign before it happens.
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const after = r => (r.type === 'exposeSchemer' || r.type === 'whisperCampaignExposed')
        ? 1 : r.type === 'comfortVictim' ? 2 : 0;
      return after(a.item) - after(b.item) || a.index - b.index;
    })
    .map(({ item }) => item);
  if (!list.length) return null;
  // The badge names the PRIMARY action, not the last thing that happened as a
  // consequence of it — a kiss trap that ends with somebody being consoled is
  // still a kiss trap, and labelling it COMFORTED buries the event.
  const first = list[0];
  return {
    text: list.map((result, index) => _bbResultText(result, `${salt}|${index}`)).join(' '),
    players: [...new Set(list.flatMap(r => r.players || []))].filter(Boolean),
    badgeText: first.badgeText || badgeText,
    badgeClass: first.badgeClass || badgeClass,
  };
}

/** Something renderable when a scheme's cast does not come together. */
const _quietBeat = (text, players) => ({
  text, players: players.filter(Boolean), badgeText: 'NOTHING COMES OF IT', badgeClass: 'grey',
});

/**
 * Run a generator and keep what it leaves behind.
 *
 * The generators read only `ep.num`, but they also WRITE three scratch fields
 * naming who schemed and who was lied about — which is exactly what the two
 * reaction events need to find. Passing a throwaway object dropped them on the
 * floor and would leave "expose the schemer" permanently unreachable, so they
 * are lifted onto shared state here.
 *
 * Always returns a renderable beat: a scheme whose cast fell through at the
 * last moment must not hand the scheduler a null, which throws and takes the
 * whole week with it.
 */
function _run(ctx, generate, badgeText, badgeClass, quiet, rng) {
  const ep = { num: ctx?.week?.num || gs.episode || 1 };
  // The Total Drama generators reach for Math.random directly — they predate
  // the seeded scheduler and are shared with a simulator that does not need
  // one. Pointing Math.random at the week's own rng for the length of the call
  // keeps a seeded season reproducible without rewriting nine events that work.
  const real = Math.random;
  if (typeof rng === 'function') Math.random = rng;
  // Same reason the rng is swapped: these are Total Drama generators, and they
  // write gs.popularity directly rather than through the house's api — which
  // walked straight past the season's own popularity switch.
  const popOff = seasonConfig.popularityEnabled === false;
  const popBefore = popOff ? { ...(gs.popularity || {}) } : null;
  let results;
  try { results = generate(ep) || []; } finally {
    Math.random = real;
    if (popOff) gs.popularity = popBefore;
  }
  if (ep._socialSchemer) gs._lastBBSchemer = ep._socialSchemer;
  if (ep._socialVictim) gs._lastBBVictim = ep._socialVictim;
  if (ep._socialVictimTarget) gs._lastBBVictimTarget = ep._socialVictimTarget;
  return _fold(results, badgeText, badgeClass, `${ctx?.week?.num || 0}|${ctx?.act || ''}`) || quiet;
}

/** Who is willing to scheme, least-seen first so it is not always one player. */
const _schemer = house => _quiet(house).filter(n => willScheme(n))[0] || null;

/** Schemes are a house's real currency, but not every second beat. */
// Nobody runs a play in the first hours of a season. The scheme archetypes'
// eligibility is deterministic — a villain is ALWAYS willing — and at a flat
// rate from day one that made week one identical across seasons: the same
// three schemers generated the same suspicion before the first nomination
// and topped the target ranking every single time. The ramp is the feeling-
// out period the real show has: quarter speed in week one, full speed by
// week four. Proportional, never a gate — a villain can still open the
// season with a forged note, it is just no longer guaranteed.
const _ramp = ctx => {
  const week = ctx?.week?.num || gs.episode || 1;
  return Math.min(1, 0.25 + (week - 1) * 0.25);
};
const _w = (base, ctx) => band((ctx?.act === 'eviction' ? base * 0.4 : base) * _ramp(ctx));

// ── the schemes ───────────────────────────────────────────────────────

const forgeNote = {
  id: 'scheme-forge-note',
  category: 'deals',
  location: 'bedroom',
  weight(house, ctx) { return house.length >= 4 && _schemer(house) ? _w(4.5, ctx) : 0; },
  fire(house, ctx, api, rng) {
    const schemer = _schemer(house);
    const rest = _others(house, schemer);
    const reader = _quiet(rest)[0];
    const alleged = furthestFrom(reader, _others(rest, reader)) || _others(rest, reader)[0];
    if (!reader || !alleged) {
      return _quietBeat(`${schemer} starts writing something, thinks better of it, and pockets it.`, [schemer]);
    }
    return _run(ctx, ep => _generateForgeNote(schemer, { a: reader, b: alleged }, house, ep, _pick),
      'FORGED NOTE', 'red',
      _quietBeat(`${schemer} plants a note and nobody ever finds it.`, [schemer]), rng);
  },
};

const spreadLies = {
  id: 'scheme-spread-lies',
  category: 'deals',
  location: 'pantry',
  weight(house, ctx) { return house.length >= 4 && _schemer(house) ? _w(5, ctx) : 0; },
  fire(house, ctx, api, rng) {
    const schemer = _schemer(house);
    const rest = _others(house, schemer);
    const listener = _quiet(rest)[0];
    const accused = furthestFrom(listener, _others(rest, listener)) || _others(rest, listener)[0];
    if (!listener || !accused) {
      return _quietBeat(`${schemer} has a story ready and nobody to tell it to.`, [schemer]);
    }
    return _run(ctx, ep => _generateSpreadLies(schemer, { a: listener, b: accused }, house, ep, _pick),
      'SPREADING LIES', 'red',
      _quietBeat(`${schemer} tries a line on ${listener} and it goes nowhere.`, [schemer, listener]), rng);
  },
};

const whisperCampaign = {
  id: 'scheme-whisper-campaign',
  category: 'deals',
  location: 'backyard',
  weight(house, ctx) { return house.length >= 6 && _schemer(house) ? _w(4, ctx) : 0; },
  fire(house, ctx, api, rng) {
    const schemer = _schemer(house);
    const target = furthestFrom(schemer, _others(house, schemer));
    if (!target) {
      return _quietBeat(`${schemer} does a lap of the house and says nothing worth repeating.`, [schemer]);
    }
    return _run(ctx, ep => _generateWhisperCampaign(schemer, target, house, ep, _pick),
      'WHISPER CAMPAIGN', 'red',
      _quietBeat(`${schemer} plants a doubt about ${target} that does not take.`, [schemer, target]), rng);
  },
};

const campaignRally = {
  id: 'scheme-campaign-rally',
  category: 'deals',
  location: 'living-room',
  weight(house, ctx) {
    // A rally is social muscle rather than villainy — anybody persuasive can.
    return house.length >= 5 && _quiet(house).some(n => pStats(n).social >= 6) ? _w(4, ctx) : 0;
  },
  fire(house, ctx, api, rng) {
    const rallier = _quiet(house).find(n => pStats(n).social >= 6) || house[0];
    const target = furthestFrom(rallier, _others(house, rallier));
    if (!target) {
      return _quietBeat(`${rallier} works the room without ever naming anybody.`, [rallier]);
    }
    return _run(ctx, ep => _generateCampaignRally(rallier, target, house, ep, _pick),
      'RALLY', 'red',
      _quietBeat(`${rallier} tries to move the house against ${target} and cannot.`, [rallier, target]), rng);
  },
};

/**
 * The fake vote plan.
 *
 * The richest of them: the victim's ballot is genuinely steered toward the
 * decoy at the vote, and the following week an intuitive victim can trace it
 * back. It works unchanged in a house because a house votes too.
 */
const falseMajority = {
  id: 'scheme-false-majority',
  category: 'deals',
  location: 'pantry',
  weight(house, ctx) {
    if (house.length < 5 || gs._falseMajorityPlot) return 0;
    // Only worth selling once the vote is close enough to be believable.
    const late = ['post-noms', 'post-veto', 'campaign'].includes(ctx?.phase);
    return late && _schemer(house) ? _w(5, ctx) : 0;
  },
  fire(house, ctx, api, rng) {
    const schemer = _schemer(house);
    const rest = _others(house, schemer);
    const victim = _quiet(rest)[0];
    const decoy = furthestFrom(victim, _others(rest, victim)) || _others(rest, victim)[0];
    if (!victim || !decoy) {
      return _quietBeat(`${schemer} works out there is nobody left to sell a plan to.`, [schemer]);
    }
    return _run(ctx, ep => _generateFalseMajority(schemer, victim, decoy, house, ep, _pick),
      'FALSE MAJORITY', 'red',
      _quietBeat(`${schemer} floats a fake plan at ${victim}, who does not bite.`, [schemer, victim]), rng);
  },
};

/**
 * The kiss trap — the rarest, and the only one with a hard prerequisite.
 *
 * Needs a real showmance to break and an accomplice who is romantically
 * plausible, which the shared romance rules decide rather than this file.
 */
/**
 * The kiss trap — the rarest, and the only one with hard prerequisites.
 *
 * The generator derives the roles itself from the showmance: the lower-mental
 * partner is the witness, the other is the one who gets kissed. It needs the
 * schemer to be romantically plausible with THAT partner, and an accomplice
 * who both trusts the schemer and is socially capable. The gate here checks
 * the same three things rather than guessing, because an event whose weight
 * says yes and whose fire says nothing is just a wasted beat.
 */
const kissTrap = {
  id: 'scheme-kiss-trap',
  category: 'social',
  location: 'bedroom',
  weight(house, ctx) {
    // Weighted high on purpose. Four conditions have to align for this to be
    // possible at all — a live showmance, a willing schemer who is plausible
    // with the partner the generator picks, and a trusted accomplice — so
    // when they do, eligibility should decide it rather than a second lottery
    // against ninety other events.
    return house.length >= 5 && _kissSetup(house) ? _w(16, ctx) : 0;
  },
  fire(house, ctx, api, rng) {
    const setup = _kissSetup(house);
    if (!setup) {
      return _quietBeat(`Somebody in this house is looking for a couple to break, and cannot find the angle.`, []);
    }
    return _run(ctx, ep => _generateKissTrap(setup.schemer, { showmance: setup.showmance }, house, ep, _pick),
      'KISS TRAP', 'red',
      _quietBeat(`${setup.schemer} sets something up around ${setup.kissTarget}, and it does not happen.`,
        [setup.schemer, setup.kissTarget]), rng);
  },
};

/**
 * The exact conditions the generator will accept, checked once and reused by
 * both weight() and fire() so the two can never disagree.
 *
 * Searches every willing schemer against every live showmance rather than
 * picking one schemer and hoping they fit. The generator kisses the
 * higher-mental partner and needs the schemer to be plausible with THAT one
 * plus a trusted, socially capable accomplice — four conditions that almost
 * never align for an arbitrarily chosen pair, which is why this event fired
 * exactly never across twenty seasons before the search was widened.
 */
function _kissSetup(house) {
  const live = (gs.showmances || []).filter(sh => sh.phase !== 'broken-up'
    && (sh.players || []).length === 2 && sh.players.every(n => house.includes(n)));
  if (!live.length) return null;
  const schemers = _quiet(house).filter(n => willScheme(n));
  for (const schemer of schemers) {
    for (const showmance of live) {
      const [p1, p2] = showmance.players;
      const witness = pStats(p1).mental <= pStats(p2).mental ? p1 : p2;
      const kissTarget = witness === p1 ? p2 : p1;
      if (schemer === witness || schemer === kissTarget) continue;
      if (!romanticCompat(schemer, kissTarget)) continue;
      const accomplice = house.find(n => n !== schemer && n !== witness && n !== kissTarget
        && getBond(n, schemer) >= 2 && pStats(n).social >= 5);
      if (!accomplice) continue;
      return { schemer, showmance, witness, kissTarget, accomplice };
    }
  }
  return null;
}

// ── the reactions ─────────────────────────────────────────────────────
// A scheme layer without these is a one-way street: people lie and nobody
// ever notices, and nobody ever sits with the person who was lied about.

const exposeSchemer = {
  id: 'scheme-exposed',
  category: 'social',
  location: 'living-room',
  weight(house, ctx) {
    const schemer = gs._lastBBSchemer;
    if (!schemer || !house.includes(schemer) || house.length < 4) return 0;
    // Somebody has to be sharp enough to catch it.
    return house.some(n => n !== schemer && pStats(n).intuition >= 6) ? _w(6, ctx) : 0;
  },
  fire(house, ctx, api, rng) {
    const schemer = gs._lastBBSchemer;
    const exposer = _others(house, schemer)
      .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
    const victim = (gs._lastBBVictim && house.includes(gs._lastBBVictim))
      ? gs._lastBBVictim : _others(house, schemer, exposer)[0];
    if (!exposer || !victim) {
      return _quietBeat(`Somebody in this house is lying and nobody can prove which one.`, []);
    }
    const beat = _run(ctx, ep => [_generateExposeSchemer(exposer, schemer, victim, house, ep, _pick)],
      'EXPOSED', 'gold',
      _quietBeat(`${exposer} is almost sure about ${schemer}, and almost is not enough to say out loud.`, [exposer, schemer]), rng);
    // This is explicitly a public exposure, and the shared generator changes
    // every houseguest's relationship with the schemer. Show the room that
    // witnessed it instead of making those consequences appear off-screen.
    if (beat.badgeText !== 'NOTHING COMES OF IT') beat.players = [...house];
    return beat;
  },
};

const comfortVictim = {
  id: 'scheme-comfort-victim',
  category: 'social',
  location: 'bedroom',
  weight(house, ctx) {
    const victim = gs._lastBBVictim;
    if (!victim || !house.includes(victim) || house.length < 3) return 0;
    return house.some(n => n !== victim && isNice(n)) ? _w(5, ctx) : 0;
  },
  fire(house, ctx, api, rng) {
    const victim = gs._lastBBVictim;
    return _run(ctx, ep => [_generateComfortVictim(victim, house, ep, _pick)],
      'COMFORTED', 'green',
      _quietBeat(`${victim} sits with it alone, and nobody comes to find ${victim}.`, [victim]), rng);
  },
};

// ── the accusation that is not true ───────────────────────────────────
//
// Saying somebody is double-dealing is the single most effective thing you can
// say about another houseguest, which is exactly why people say it about
// houseguests who are not. The exposure above only fires on a real scheme and
// only names a number it can prove; this is the other half — the same
// accusation deployed as a weapon, marked as false where it is false, and
// carrying the risk that makes it a gamble rather than a free shot.
//
// The two are deliberately symmetrical. A true exposure damages the schemer. A
// false one damages the schemer too, right up until the people supposedly
// promised a final two talk to each other.

const falseAccusation = {
  id: 'scheme-false-accusation',
  category: 'social',
  location: 'kitchen',
  weight(house, ctx) {
    if (house.length < 5) return 0;
    // Somebody willing to lie, about somebody who is not actually doing it.
    if (ctx?.act === 'eviction') return 0;
    const liar = house.find(n => willScheme(n)
      && _others(house, n).some(mark => doubleDealPartners(mark).length < 2));
    return liar ? _w(5, ctx) : 0;
  },
  fire(house, ctx, api, rng) {
    const liar = _quiet(house.filter(n => willScheme(n)
      && _others(house, n).some(mark => doubleDealPartners(mark).length < 2)))[0];
    const mark = furthestFrom(liar, _others(house, liar)
      .filter(n => doubleDealPartners(n).length < 2)) || _others(house, liar)[0];
    if (!liar || !mark) {
      return _quietBeat('Nobody has anything worth making up today.', []);
    }
    const audience = _quiet(_others(house, liar, mark)).slice(0, 3);
    const p = pronouns(liar);

    // A lie about somebody lands on the teller's standing, not on evidence —
    // there is none, because none exists.
    const convinced = audience.filter(listener => {
      const trust = getBond(listener, liar) * 0.3 + (pStats(liar).social - 5) * 0.28
        - pStats(listener).intuition * 0.16 - getBond(listener, mark) * 0.35;
      return trust > -0.3;
    });

    // _textPick, not _pick: the latter is Math.random and a seeded season has to
    // replay identically. Two events reached for the convenient one and the
    // reproducibility guarantee went with them.
    const seed = { players: [liar, mark], text: `${convinced.length}`, badgeText: 'lie' };
    const text = convinced.length ? _textPick([
      `${liar} tells ${_listNames(audience)} that ${mark} has been offering the same final-two deal all over the house. ${liar} cannot name two actual deals, but ${_listNames(convinced)} ${convinced.length > 1 ? 'believe' : 'believes'} the warning anyway.`,
      `"Ask ${mark} who ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} going to the end with. Then ask somebody else." ${liar} has invented the whole thing and ${_listNames(convinced)} ${convinced.length > 1 ? 'go' : 'goes'} away to check.`,
      `${liar} asks the room how many final-two promises ${mark} has made, then goes quiet and lets everybody supply their own number. There is no evidence behind the question.`,
    ], seed, 'false-accusation') : _textPick([
      `${liar} claims ${mark} has several final-two deals. Somebody asks for one name, then another. ${liar} cannot provide either, and the room moves on.`,
      `“How many people has ${mark} promised?” ${liar} asks. “You brought it up,” somebody answers. “You tell us.” ${liar} has nothing ready.`,
    ], seed, 'false-accusation-flat');

    convinced.forEach(listener => {
      api.suspicion(listener, mark, 1.3);
      api.addBond(listener, mark, -0.7);
      api.remember(listener, liar, 'told-me-about-the-deals', 1, { about: mark, false: true });
    });
    _others(house, liar, mark).filter(n => !convinced.includes(n))
      .forEach(n => api.suspicion(n, liar, 0.6));

    // On the record as a lie, so the house can find out later.
    gs.bb ||= {};
    (gs.bb.falseClaims ||= []).push({
      liar, mark, kind: 'double-dealing', week: ctx?.week?.num || 0,
      believers: [...convinced], exposed: false,
      // How many deals the accused actually had AT THE TIME. A claim is false
      // when it is made, and the house keeps playing: somebody accused of
      // double-dealing in week three can genuinely be doing it by week ten.
      partnersAtClaim: doubleDealPartners(mark).length,
    });
    return { text, players: [liar, mark, ...audience],
      badgeText: convinced.length ? 'A LIE THAT LANDS' : 'NOBODY BUYS IT',
      badgeClass: convinced.length ? 'orange' : 'grey' };
  },
};

const accusationCollapses = {
  id: 'scheme-accusation-collapses',
  category: 'social',
  location: 'living-room',
  weight(house, ctx) {
    // Eviction night belongs to the farewell speech; these two crowded it out.
    if (ctx?.act === 'eviction') return 0;
    const claim = _liveFalseClaim(house, ctx);
    return claim ? _w(7, ctx) : 0;
  },
  fire(house, ctx, api, rng) {
    const claim = _liveFalseClaim(house, ctx);
    if (!claim) return _quietBeat('Nothing gets checked today.', []);
    const { liar, mark } = claim;
    const checker = _quiet(claim.believers.filter(n => house.includes(n)))[0]
      || _others(house, liar, mark)[0];
    claim.exposed = true;
    const p = pronouns(liar);

    const text = _textPick([
      `${checker} asks ${mark} directly, then checks with the people ${liar} implied were involved. There is no web of final-two deals—only a story that traces back to ${liar}.`,
      `${checker} puts the supposed deals side by side. The names and promises do not exist the way ${liar} described them, and everyone involved ends up in the same room comparing notes.`,
      `"Who told you that?" ${mark} asks it calmly and waits, and the answer works its way back to ${liar} in front of everybody.`,
      `${checker} asks enough questions to prove the accusation was invented. Once ${liar}'s name comes up as the source, people start bringing ${p.obj} other stories they want checked.`,
    ], { players: [checker, liar, mark], text: '', badgeText: 'collapse' }, 'collapse');

    // The gamble, collected. A false accuser is worse than a schemer, because
    // the house now has to discount everything they have ever said.
    house.filter(n => n !== liar).forEach(n => {
      api.suspicion(n, liar, 1.4);
      api.addBond(n, liar, -0.8);
      api.remember(n, liar, 'made-it-up', 2, { about: mark });
    });
    api.addBond(mark, liar, -2.2);
    api.setTarget(mark, liar, `invented an accusation about ${mark}`);
    api.popDelta(liar, -3);
    api.popDelta(mark, 1);
    // Everyone hears the correction and every remaining houseguest receives
    // the corresponding suspicion, bond and memory effects.
    return { text, players: [...house],
      badgeText: 'IT WAS NEVER TRUE', badgeClass: 'red' };
  },
};

/** A lie told at least a week ago, still standing, with everybody still here. */
/**
 * A lie told at least a week ago, still standing, and still a lie.
 *
 * That last condition is the one worth stating. An accusation is false when it
 * is made and the season keeps going — a houseguest accused of double-dealing
 * in week three can be doing exactly that by week ten. Collapsing the story
 * then would have the house prove there is no web of deals about somebody who
 * has since built one. The accuser does not get caught for a thing that came
 * true; they simply stop being wrong, which is its own kind of luck.
 */
function _liveFalseClaim(house, ctx) {
  const week = ctx?.week?.num || 0;
  return (gs.bb?.falseClaims || []).find(claim => !claim.exposed
    && claim.week < week
    && house.includes(claim.liar) && house.includes(claim.mark)
    && doubleDealPartners(claim.mark).length < 2
    // Somebody has to still believe it, or there is nothing to correct.
    && claim.believers.some(n => house.includes(n)));
}

export const SCHEME_EVENTS = [
  forgeNote, spreadLies, whisperCampaign, campaignRally,
  falseMajority, kissTrap, exposeSchemer, comfortVictim,
  falseAccusation, accusationCollapses,
];

export default SCHEME_EVENTS;
