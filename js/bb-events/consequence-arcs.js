// ══════════════════════════════════════════════════════════════════════
// bb-events/consequence-arcs.js — chapter two of something already told
// ══════════════════════════════════════════════════════════════════════
//
// Nothing in this file invents a situation. Every event here goes looking for a
// moment the house has ALREADY produced — a lie somebody is still carrying, a
// ballot that did not match the promise, a comfort given at two in the morning,
// a threat made on eviction night — and writes the next chapter of it.
//
// Two halves, and they are gated differently.
//
// The nine FOLLOW-UPS read strategic memory and last week's ballots, and they
// all run on a recency window: the point of a follow-up is that the thing is
// still live. A confrontation about a lie from five weeks ago is not a
// follow-up, it is a person who cannot let go, and that is a different event.
// Each one writes a "done" memory so the same pair does not relitigate the same
// moment for the rest of the season.
//
// The five ENDGAME beats only exist at five people and fewer, where the game
// stops being about the week and starts being about the last chair. The engine
// never runs a week below four and the finale is at three, so this is a two or
// three week window per season — small, but the most consequential one there
// is, and until now nothing was written for it.

import { gs } from '../core.js';
import { pronouns } from '../players.js';
import {
  band, bond, pStats, spotlightOrder, memoriesOf, memoryWeek, remembers, grudge,
  worstMemory, obligationOf, dangerOf, respectOf, threat, closestTo,
  isNice, isVillainous, suspicionOf,
} from './_read.js';
import { endgameDealsOf, tierOf } from '../bb/deals.js';
import { seatedJurors } from '../bb/jury.js';

// ── shared plumbing ───────────────────────────────────────────────────

/** Deterministic prose pick: a hash of the week, the beat and who is in it. */
function variant(lines, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let h = 2166136261;
  for (const ch of key) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return lines[h % lines.length];
}

/** Least-seen first, weighted toward whoever this week is about. */
const quiet = pool => spotlightOrder((pool || []).filter(Boolean));

const result = (text, players, badgeText, badgeClass) =>
  ({ text, players: (players || []).filter(Boolean), badgeText, badgeClass });

/**
 * These are conversations, not ceremonies.
 *
 * Nominations, the veto ceremony and the eviction schedule one to three beats
 * and they belong to the moment itself. A follow-up landing in the middle of a
 * ceremony reads as the show losing its place, so it simply does not.
 */
const fit = (ctx, n) =>
  (['nominations', 'veto-ceremony', 'eviction'].includes(ctx?.act) ? 0 : band(n));

/**
 * How long a thing stays live.
 *
 * Three weeks: the week it happened, and the two it keeps mattering. Wider than
 * story-followups.js on purpose — those events are the immediate aftershock of
 * a scene, these are the ones where somebody has had time to check, to hear it
 * from a second person, or to decide they are not letting it go.
 */
const RECENT_WEEKS = 3;

const now = ctx => ctx?.week?.num ?? (gs.episode || 0) + 1;

/**
 * The first live memory of one of these kinds, held by somebody still here
 * about somebody still here, that has not already been answered.
 *
 * Cast order comes from spotlightOrder, so the person who has been quietest
 * gets first refusal on the scene.
 */
function pairFromMemory(house, types, done, ctx, extra = null) {
  if (!Array.isArray(house) || house.length < 2) return null;
  const week = now(ctx);
  for (const a of quiet(house)) {
    for (const m of memoriesOf(a)) {
      const b = m?.subject;
      if (!b || b === a || !house.includes(b)) continue;
      if (!types.includes(m.type)) continue;
      if (done && remembers(a, b, done)) continue;
      const when = memoryWeek(m);
      if (when && week - when > RECENT_WEEKS) continue;
      if (extra && !extra(a, b, m)) continue;
      return { a, b, m };
    }
  }
  return null;
}

/** Last week, only if it is genuinely the week immediately behind this one. */
function prevWeek(ctx) {
  const weeks = gs.bb?.weeks || [];
  const last = weeks[weeks.length - 1];
  if (!last) return null;
  return (ctx?.week?.num || 0) === (last.num || 0) + 1 ? last : null;
}

/** Who the memory says was done to them, in words, for the narration. */
function memoryPhrase(m) {
  const t = m?.type || '';
  const map = {
    deceit: 'the story that did not hold up',
    'lied-to-my-face': 'the denial',
    'made-it-up': 'the thing that was invented',
    'sold-me-something': 'the pitch',
    'swore-it-was-not-them': 'the promise that it had not been them',
    'broke-a-promise': 'the promise',
    'broken-promise': 'the promise',
    betrayal: 'the betrayal',
    'alliance-betrayal': 'the alliance falling apart',
    'broken-final-two': 'the final two that was not one',
    'crossed-me': 'being crossed',
    'chose-them-over-me': 'being second choice',
    'took-my-ally': 'losing an ally',
    'forced-me-up': 'being put on the block',
    'left-me-out': 'being left out of the room',
  };
  return map[t] || 'what happened';
}

const nice = name => { try { return isNice(name); } catch { return false; } };
const villain = name => { try { return isVillainous(name); } catch { return false; } };

/** House size, taken from the pool the scheduler actually handed us. */
const endgame = (house, cap = 5) => Array.isArray(house) && house.length <= cap && house.length >= 3;

/** The endgame deals this person is holding with people still in the house. */
function liveEndgameDeals(name, house) {
  let all = [];
  try { all = endgameDealsOf(name) || []; } catch { return []; }
  return all.filter(d => d && d.active !== false && !d.broken
    && tierOf(d) !== 'working'
    && (d.players || []).every(n => n === name || house.includes(n)));
}

// ══════════════════════════════════════════════════════════════════════
// 1 — the lie, confirmed by somebody who was not part of it
// ══════════════════════════════════════════════════════════════════════

const LIE_TYPES = ['deceit', 'lied-to-my-face', 'made-it-up', 'sold-me-something',
  'swore-it-was-not-them', 'broke-a-promise', 'broken-promise'];

const lieDisprovedLater = {
  id: 'arc-lie-disproved-later',
  category: 'deals',
  location: 'storage',
  weight(house, ctx) {
    const pair = pairFromMemory(house, LIE_TYPES, 'lie-confirmed', ctx);
    if (!pair) return 0;
    // A third person has to exist to be the corroboration.
    if (house.length < 3) return 0;
    return fit(ctx, 4.6 + Math.min(3, grudge(pair.a, pair.b) * 0.3));
  },
  fire(house, ctx, api) {
    const { a: holder, b: liar, m } = pairFromMemory(house, LIE_TYPES, 'lie-confirmed', ctx)
      || { a: house[0], b: house[1], m: null };
    const source = quiet(house.filter(n => n !== holder && n !== liar))[0] || house.find(n => n !== holder && n !== liar);
    const what = memoryPhrase(m);
    const p = pronouns(holder);
    // Whether the confirmation arrives as a favour or as gossip changes the
    // scene, not the verdict. The verdict was always going to be this.
    const kind = source && bond(holder, source) >= 2;

    const text = kind ? variant([
      `${source} does not make a moment of it. "${liar} told me the same thing ${p.sub} told you, except the dates were different." ${holder} had spent a week deciding to let ${what} go, and does not any more.`,
      `${holder} asks ${source} a question about last week purely to change the subject, and gets an answer that lines up with ${what} exactly wrong. ${liar}'s version cannot survive both accounts and ${holder} knows it by the end of the sentence.`,
      `"You already knew, right?" ${source} says it apologetically, halfway into the storage room, and only realises from ${holder}'s face that ${p.sub} did not. What ${liar} said is now a thing with two witnesses and one liar.`,
      `${source} repeats a conversation ${liar} had on the other side of the house, without any idea what it confirms. ${holder} thanks ${p.obj} for nothing in particular and stands in the storage room for a while afterwards.`,
    ], ctx, holder, liar, source) : variant([
      `${source} brings it up to be interesting rather than to be helpful, and it is both: ${liar} said one thing to ${holder} and a different thing to the room. ${what} stops being a suspicion.`,
      `The confirmation arrives sideways, from ${source}, who has no reason to protect either of them. ${holder} does not react in front of ${pronouns(source).obj} — but ${holder} has stopped listening to the rest of what ${source} is saying.`,
      `${holder} has been treating ${what} as possibly a misunderstanding. ${source} destroys that possibility in one sentence and then asks what everybody wants for dinner.`,
      `${source} mentions, casually, the version ${liar} gave everybody else. ${holder} counts backwards through the week and finds the seam. There is no innocent reading of it left.`,
    ], ctx, holder, liar, source);

    api.suspicion(holder, liar, 1.5);
    api.addBond(holder, liar, -1.3);
    api.remember(holder, liar, 'lie-confirmed', 3, { about: what, via: source || null });
    if (source) api.remember(holder, source, 'told-me-something-real', 1, { about: liar });
    return result(text, [holder, liar, source], 'THE LIE HOLDS NO MORE', 'red');
  },
};

// ══════════════════════════════════════════════════════════════════════
// 2 — the apology that is heard and not believed
// ══════════════════════════════════════════════════════════════════════

const BETRAYAL_TYPES = ['betrayal', 'alliance-betrayal', 'broken-final-two', 'crossed-me',
  'chose-them-over-me', 'took-my-ally', 'forced-me-up', 'left-me-out'];

const apologyWithoutTrust = {
  id: 'arc-apology-without-trust',
  category: 'social',
  location: 'backyard',
  weight(house, ctx) {
    const pair = pairFromMemory(house, BETRAYAL_TYPES, 'apology-noted', ctx);
    return pair ? fit(ctx, 4.4) : 0;
  },
  fire(house, ctx, api) {
    const { a: wronged, b: sorry, m } = pairFromMemory(house, BETRAYAL_TYPES, 'apology-noted', ctx)
      || { a: house[0], b: house[1], m: null };
    const what = memoryPhrase(m);
    const p = pronouns(wronged);
    // Whether it is accepted OUT LOUD is a personality question. Whether it is
    // believed is not a question at all.
    const aloud = nice(wronged) || pStats(wronged).temperament >= 6;

    const text = aloud ? variant([
      `${sorry} apologises for ${what} properly, without a single "but", and ${wronged} says it is fine and means the sentence rather than the thing underneath it. They talk about something else for twenty minutes and it is almost comfortable.`,
      `"I should not have done it that way." ${wronged} accepts the apology from ${sorry} the way ${p.sub} would accept a parcel — takes it, says thank you, does not open it.`,
      `${wronged} lets ${sorry} finish the whole apology in the backyard without interrupting once, which ${sorry} reads as forgiveness. It is not that. It is ${wronged} listening for the part where ${sorry} explains what ${p.sub} would do differently, and that part never comes.`,
      `${sorry} says sorry for ${what} and ${wronged} says, "I know why you did it," which sounds like absolution and is in fact a full description of the problem. Both of them leave the conversation happy with different things.`,
    ], ctx, wronged, sorry, aloud) : variant([
      `${sorry} apologises for ${what}. ${wronged} looks at ${pronouns(sorry).obj} long enough for it to be a decision, then says, "Okay," and goes inside. Nothing about the week is repaired and both of them know exactly how much.`,
      `"I am not going to pretend that was not what it was," ${sorry} says. ${wronged} answers that ${p.sub} appreciates the honesty and does not offer any of ${p.posAdj} own in return.`,
      `The apology is real and ${wronged} does not want it. "You are allowed to be sorry," ${p.sub} tells ${sorry} in the backyard. "I am allowed to still count."`,
      `${sorry} gets most of the way through before ${wronged} interrupts to ask whether the apology comes with the vote. It does not. ${wronged} nods as if that had settled something, because it had.`,
    ], ctx, wronged, sorry, aloud);

    // The bond moves. The trust does not — an apology noted is a data point
    // about how this person handles being caught, and it goes in the file.
    api.addBond(wronged, sorry, aloud ? 0.9 : 0.4);
    api.suspicion(wronged, sorry, 0.5);
    api.remember(wronged, sorry, 'apology-noted', 2, { about: what, aloud });
    return result(text, [wronged, sorry], aloud ? 'SAYS IT IS FINE' : 'HEARD, NOT BELIEVED',
      aloud ? 'blue' : 'grey');
  },
};

// ══════════════════════════════════════════════════════════════════════
// 3 — the fight the rest of the house has to have an opinion about
// ══════════════════════════════════════════════════════════════════════

const FIGHT_TYPES = ['threatened-me-live', 'humiliation', 'would-not-let-it-go', 'saw-them-fight'];

const fightSplitsTheRoom = {
  id: 'arc-fight-splits-the-room',
  category: 'social',
  location: 'living-room',
  weight(house, ctx) {
    if (!Array.isArray(house) || house.length < 4) return 0;
    const pair = pairFromMemory(house, FIGHT_TYPES, 'house-picked-sides', ctx);
    if (!pair) return 0;
    // A fight only splits a room if both of them are still angry.
    const heat = grudge(pair.a, pair.b) + grudge(pair.b, pair.a);
    return fit(ctx, 4 + Math.min(4, heat * 0.4));
  },
  fire(house, ctx, api) {
    const pair = pairFromMemory(house, FIGHT_TYPES, 'house-picked-sides', ctx)
      || { a: house[0], b: house[1] };
    const { a: hurt, b: other } = pair;
    const rest = quiet(house.filter(n => n !== hurt && n !== other));
    const forHurt = closestTo(hurt, rest) || rest[0];
    const forOther = closestTo(other, rest.filter(n => n !== forHurt)) || rest.find(n => n !== forHurt) || rest[1];

    const text = variant([
      `Nobody calls it taking sides. ${forHurt} starts sitting where ${hurt} sits and ${forOther} stops coming into that room, and by the next afternoon the living room has split into two obvious halves.`,
      `${forHurt} says the argument was one-sided and ${forOther} says it certainly was, and the two of them realise about a beat too late that they are describing different sides. ${hurt} and ${other} are not even in the room.`,
      `The house does the arithmetic it always does after a fight: who was louder, who was right, and who is more useful. ${forHurt} lands on ${hurt}. ${forOther} lands on ${other}. Neither of them says so out loud and everybody can see it anyway.`,
      `${forOther} defends ${other}'s version of the fight in the living room and finds ${forHurt} looking at ${pronouns(forOther).obj} the way you look at somebody who has just picked. Which is what has happened.`,
      `It takes two days and one conversation about the dishes for the room to divide. ${forHurt} is with ${hurt}; ${forOther} is with ${other}; and the people left in the middle spend the evening being extremely pleasant to everybody.`,
    ], ctx, hurt, other, forHurt, forOther);

    if (forHurt) {
      api.addBond(forHurt, hurt, 0.9);
      api.suspicion(forHurt, other, 0.8);
    }
    if (forOther) {
      api.addBond(forOther, other, 0.9);
      api.suspicion(forOther, hurt, 0.8);
    }
    if (forHurt && forOther) api.addBond(forHurt, forOther, -0.6);
    api.remember(hurt, other, 'house-picked-sides', 2, { with: forHurt || null, against: forOther || null });
    return result(text, [hurt, other, forHurt, forOther], 'THE ROOM PICKS', 'red');
  },
};

// ══════════════════════════════════════════════════════════════════════
// 4 — the count says what the promise did not
// ══════════════════════════════════════════════════════════════════════

/**
 * Last week's broken word, if the people involved are still here.
 *
 * `week.voteBroken` is the strict read — a ballot that contradicts the stated
 * position AND a recorded commitment — and it is almost never populated,
 * because the commitment map only holds people the vote operation formally
 * approached. The ballot itself carries the same story in a looser form:
 * `stated` is the position the house was given and `evict` is what was
 * actually written, and a gap between them is a person who said one thing in
 * the kitchen and did another in the Diary Room. That is the scene.
 */
function brokenWord(house, ctx) {
  const week = prevWeek(ctx);
  if (!week) return null;
  const strict = Array.isArray(week.voteBroken) ? week.voteBroken : [];
  const loose = (week.ballots || [])
    .filter(b => b?.stated && b.evict && b.stated !== b.evict)
    .map(b => ({ voter: b.voter, promised: b.stated, cast: b.evict }));
  const broken = strict.length ? strict : loose;
  if (!broken.length) return null;
  for (const entry of broken) {
    const voter = entry?.voter;
    if (!voter || !house.includes(voter)) continue;
    // The person they promised to keep. If that person went home, it is the
    // ally who was counting on the vote who finds out instead.
    const kept = entry.cast;
    const promisee = house.includes(kept) ? kept
      : closestTo(kept, house.filter(n => n !== voter));
    if (!promisee || promisee === voter) continue;
    if (remembers(promisee, voter, 'broke-word-found-out')) continue;
    return { voter, promisee, promised: entry.promised, cast: kept, week };
  }
  return null;
}

const promiseExposedByCount = {
  id: 'arc-promise-exposed-by-count',
  category: 'deals',
  location: 'kitchen',
  weight(house, ctx) {
    return brokenWord(house, ctx) ? fit(ctx, 5.4) : 0;
  },
  fire(house, ctx, api, rng = () => 0.5) {
    const found = brokenWord(house, ctx);
    if (!found) {
      // Unreachable while weight() gates on the same read, but a beat that
      // cannot narrate must still narrate.
      const a = house[0], b = house[1];
      api.suspicion(a, b, 0.4);
      return result(`Nobody can make last week's numbers add up.`, [a], 'THE COUNT IS OFF', 'grey');
    }
    const { voter, promisee, promised, cast } = found;
    const p = pronouns(promisee);
    const gone = found.week?.evicted;
    // A liar with a story ready is a different scene from one caught flat.
    const ready = pStats(voter).social * 0.5 + pStats(voter).strategic * 0.4
      > pStats(promisee).intuition * 0.7 + 2;

    const text = ready ? variant([
      `${promisee} works the vote backwards over breakfast and there is exactly one arrangement of it that works, and it has ${voter} writing ${cast} down after saying ${promised} all week. ${voter} has an explanation ready and delivers it well. ${promisee} lets ${pronouns(voter).obj} finish.`,
      `"The numbers were ${promised === cast ? 'fine' : 'nine to one on paper'}." ${promisee} does not need ${voter} to confess. The eviction count already did that${gone ? ` when ${gone} left` : ''}; this conversation is only about whether ${voter} will say it.`,
      `${voter} explains that the room moved late and there was no time to come and find ${promisee}. It is a good explanation. It is also the third good explanation ${voter} has produced this month, and ${promisee} has started keeping them in order.`,
      `${promisee} asks ${voter} one question in the kitchen — not accusing, just counting out loud — and ${voter} answers it smoothly enough that ${p.sub} ${p.sub === 'they' ? 'know' : 'knows'} the answer was prepared before the question existed.`,
    ], ctx, promisee, voter, cast) : variant([
      `${promisee} says the count out loud and watches ${voter}'s face do the arithmetic a half second too slowly. That half second is the whole conversation.`,
      `"You told me ${promised}." ${voter} starts a sentence three separate times in the kitchen. ${promisee} waits through all three and then leaves before the fourth.`,
      `The vote came back and one number was wrong, and only one person had promised ${promisee} anything. ${voter} does not deny it so much as stop talking, which in this house is the same thing.`,
      `${promisee} does not shout. ${p.Sub} simply repeats what ${voter} promised before the vote, then what the eviction count revealed, and lets the kitchen hold the gap between them.`,
    ], ctx, promisee, voter, cast);

    api.remember(promisee, voter, 'broke-word-found-out', 3, { promised, cast });
    api.addBond(promisee, voter, -1.5);
    api.suspicion(promisee, voter, 1.4);
    // Whether it becomes a target is a question of nerve and calculation, not a
    // rule — plenty of people file this and wait.
    const s = pStats(promisee);
    if (rng() < Math.min(0.85, (s.strategic + s.boldness) / 22 + 0.1)) {
      api.setTarget(promisee, voter, `promised me ${promised} and wrote ${cast}`);
    }
    return result(text, [promisee, voter], ready ? 'A GOOD EXPLANATION' : 'CAUGHT BY THE COUNT', 'red');
  },
};

// ══════════════════════════════════════════════════════════════════════
// 5 — a kindness, collected on
// ══════════════════════════════════════════════════════════════════════

const DEBT_TYPES = ['debt', 'favour', 'saved-me', 'was-there', 'emotional-support', 'kindness',
  'stood-up-for-me', 'shared-hardship', 'made-it-right', 'late-night-trust', 'final-plea-saved-me'];

const comfortBecomesLoyalty = {
  id: 'arc-comfort-becomes-loyalty',
  category: 'deals',
  location: 'bedroom',
  weight(house, ctx) {
    if (!Array.isArray(house) || house.length < 3) return 0;
    const pair = pairFromMemory(house, DEBT_TYPES, 'acted-on-the-debt', ctx);
    if (!pair) return 0;
    return fit(ctx, 4.2 + Math.min(3, obligationOf(pair.a, pair.b) * 0.35));
  },
  fire(house, ctx, api) {
    const pair = pairFromMemory(house, DEBT_TYPES, 'acted-on-the-debt', ctx)
      || { a: house[0], b: house[1] };
    const { a: owes, b: owed } = pair;
    const critic = quiet(house.filter(n => n !== owes && n !== owed))[0]
      || house.find(n => n !== owes && n !== owed);
    const p = pronouns(owes);
    // Loyalty plus what they actually feel they owe. A working deal is somebody
    // deciding the debt is a position rather than a feeling.
    const formal = pStats(owes).loyalty * 0.5 + obligationOf(owes, owed) * 0.4 >= 4;

    const text = formal ? variant([
      `${critic} floats ${owed}'s name in the bedroom and ${owes} kills it immediately — not with an argument, with a flat "no". ${critic} has never heard ${owes} be flat about anything before.`,
      `"${owed} sat with me when nobody else would." ${owes} says it once, to ${critic}, and then makes it a position: whatever the house does this week, it does not do it to ${owed}. They shake on it before the lights go out.`,
      `${owes} has been quiet all season about who ${p.sub} is with. ${critic} finds out in the bedroom, by naming ${owed} as an option and watching the conversation stop.`,
      `${critic} expects ${owes} to be flexible, because ${owes} has been flexible about everything. Instead ${owes} says ${p.sub} owes ${owed} a week, and would like to pay it now while it is still worth something.`,
    ], ctx, owes, owed, critic) : variant([
      `${critic} says something small and unkind about ${owed}. ${owes} does not argue — just does not laugh, and lets the silence sit there until ${critic} moves on to somebody else.`,
      `${owes} corrects ${critic}'s version of ${owed} in the bedroom, quietly, on one detail. It is the smallest possible defence and ${critic} files it anyway.`,
      `Nobody asks ${owes} to defend ${owed}, which is exactly why ${p.sub} does. ${critic} notices that the room now has a person in it who cannot be recruited against ${owed}.`,
      `"I would not put ${owed} up." ${owes} offers no reason, and ${critic}, who has been counting who is soft on whom, writes it down mentally and changes the subject.`,
    ], ctx, owes, owed, critic);

    api.addBond(owes, owed, formal ? 1.4 : 0.8);
    api.remember(owes, owed, 'acted-on-the-debt', formal ? 3 : 2, { defendedFrom: critic || null });
    if (formal) api.sideDeal(owes, owed, 'vote', { about: 'I am not the vote that takes you out' });
    if (critic) api.remember(critic, owes, 'they-are-a-pair', 2, { about: owed });
    return result(text, [owes, owed, critic], formal ? 'THE DEBT BECOMES A DEAL' : 'QUIETLY DEFENDED',
      formal ? 'green' : 'blue');
  },
};

// ══════════════════════════════════════════════════════════════════════
// 6 — the house rewatches the blindside
// ══════════════════════════════════════════════════════════════════════

/** The person who read last week's room worst, if they are still here. */
function wrongestRead(house, ctx) {
  const week = prevWeek(ctx);
  const plans = week?.votePlans;
  if (!Array.isArray(plans) || plans.length < 3) return null;
  const wrong = plans.filter(p => p?.wrong && house.includes(p.voter));
  if (wrong.length < 2) return null;
  const worst = wrong.slice().sort((a, b) =>
    Math.abs(b.error || 0) - Math.abs(a.error || 0))[0];
  return worst ? { worst, wrong, week } : null;
}

const blindsideRewatch = {
  id: 'arc-blindside-rewatch',
  category: 'house-life',
  location: 'kitchen',
  weight(house, ctx) {
    if (!Array.isArray(house) || house.length < 4) return 0;
    return wrongestRead(house, ctx) ? fit(ctx, 4.8) : 0;
  },
  fire(house, ctx, api) {
    const found = wrongestRead(house, ctx);
    if (!found) {
      const a = house[0], b = house[1];
      api.popDelta(a, -1);
      return result(`Nobody wants to talk about the last eviction.`, [a, b], 'LET IT LIE', 'grey');
    }
    const { worst, wrong, week } = found;
    const name = worst.voter;
    const gone = week?.evicted;
    const amused = quiet(house.filter(n => n !== name)).slice(0, 2);
    const p = pronouns(name);
    const off = Math.abs(worst.error || 0);

    const text = variant([
      `The house retells the eviction for the fourth time and it is still ${name}'s face that carries it. ${p.Sub} had the count at ${worst.believed} and the count was ${worst.truth}${gone ? `, and ${gone} was gone before ${p.sub} finished turning around` : ''}. ${amused[0]} does the face. Everybody laughs, including ${name}, slightly late.`,
      `"Say it again. Say how many you thought you had." ${amused[0]} has made this a bit, and ${name} has decided the only way through it is to be a good sport, which is working less well each time.`,
      `${amused[0]} and ${amused[1] || 'the kitchen'} reconstruct the vote out loud, beat by beat, purely to arrive at the moment ${name} was ${off} votes wrong about ${p.posAdj} own side of the house.`,
      `Somebody starts it as a genuine question — how did nobody see it — and it becomes, within about a minute, a very specific question about ${name}. ${p.Sub} answers it honestly, which makes it funnier and worse.`,
      `${name} maintains that the room changed at the last minute. ${amused[0]} points out, gently, that ${name} was the last minute.`,
    ], ctx, name, amused[0], gone);

    // Being the person who was most wrong is a story the house tells about you,
    // and stories about you are the only currency that is not votes.
    api.popDelta(name, -1);
    if (amused[0]) {
      api.remember(name, amused[0], 'humiliation', 1, { about: `read the vote ${off} wrong` });
      if (amused[1]) api.addBond(amused[0], amused[1], 0.6);
      else api.addBond(amused[0], name, -0.3);
    }
    return result(text, [name, ...amused], 'STILL TALKING ABOUT THE VOTE', 'grey');
  },
};

// ══════════════════════════════════════════════════════════════════════
// 7 — "it wasn't me", said to a room that is counting
// ══════════════════════════════════════════════════════════════════════

/** The minority side of last week's vote, and somebody still here to deny it. */
function strayVoteScene(house, ctx) {
  const week = prevWeek(ctx);
  const ballots = week?.ballots;
  if (!Array.isArray(ballots) || ballots.length < 4) return null;
  const tally = {};
  for (const b of ballots) if (b?.evict) tally[b.evict] = (tally[b.evict] || 0) + 1;
  const names = Object.keys(tally);
  if (names.length < 2) return null;           // unanimous; nothing to deny
  const losing = names.sort((a, b) => tally[a] - tally[b])[0];
  const strays = ballots.filter(b => b.evict === losing).map(b => b.voter)
    .filter(n => house.includes(n));
  const voters = ballots.map(b => b.voter).filter(n => house.includes(n));
  if (voters.length < 3) return null;
  // The denier is a stray if one is still here — a lie is better television
  // than the truth — otherwise somebody in the majority getting ahead of it.
  const denier = quiet(strays)[0] || quiet(voters)[0];
  if (!denier) return null;
  const doubter = quiet(house.filter(n => n !== denier))
    .slice()
    .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  if (!doubter) return null;
  return { denier, doubter, lying: strays.includes(denier), losing, week };
}

const rogueVoteDenial = {
  id: 'arc-rogue-vote-denial',
  category: 'deals',
  location: 'living-room',
  weight(house, ctx) {
    if (!Array.isArray(house) || house.length < 4) return 0;
    const scene = strayVoteScene(house, ctx);
    if (!scene) return 0;
    if (remembers(scene.doubter, scene.denier, 'denied-the-stray-vote')) return 0;
    return fit(ctx, 5);
  },
  fire(house, ctx, api) {
    const scene = strayVoteScene(house, ctx);
    if (!scene) {
      const a = house[0], b = house[1];
      api.suspicion(a, b, 0.4);
      return result(`The stray vote goes unclaimed for another day.`, [a, b], 'NOBODY OWNS IT', 'grey');
    }
    const { denier, doubter, lying, losing, week } = scene;
    const gone = week?.evicted;
    const p = pronouns(denier);

    const text = lying ? variant([
      `"It was not me, and I am tired of the question." ${denier} says it to the living room rather than to any one person, which is the tell ${doubter} has been waiting for — nobody addresses a room unless they are worried about a specific chair in it.`,
      `${denier} volunteers the denial before anybody has asked ${p.obj} anything. ${doubter} watches it land, agrees warmly that of course it was not, and adds a name to a list.`,
      `${denier} explains ${p.posAdj} vote for ${gone || 'the majority'} in a level of detail nobody requested. ${doubter} listens to all of it and thinks about how much easier the truth is to describe.`,
      `"Whoever it was, they should just say." ${denier} is extremely comfortable with this conversation, which ${doubter} finds interesting, given the arithmetic.`,
    ], ctx, denier, doubter) : variant([
      `${denier} denies being the stray vote and is telling the truth, which does not help at all — ${doubter} has decided otherwise on grounds that have nothing to do with the ballot.`,
      `"I voted with the house." ${denier} did. ${doubter} nods at ${p.obj} in a way ${denier} spends the rest of the evening trying to interpret.`,
      `${denier} gets in front of it in the living room and finds ${doubter} already there, already sceptical, already asking why ${denier} felt the need to raise it.`,
      `The one person who did not cast the stray vote is the one person defending ${pronouns(denier).ref || 'themselves'} about it, and ${doubter} thinks that is exactly the kind of thing a guilty person would do.`,
    ], ctx, denier, doubter);

    api.suspicion(doubter, denier, 1.3);
    api.addBond(doubter, denier, -0.5);
    api.remember(doubter, denier, 'denied-the-stray-vote', 2,
      { about: `the vote to keep ${losing}`, believed: false, truthful: !lying });
    return result(text, [denier, doubter], lying ? 'DENIES IT FLATLY' : 'TELLING THE TRUTH BADLY',
      lying ? 'red' : 'grey');
  },
};

// ══════════════════════════════════════════════════════════════════════
// 8 — the accusation nobody took back
// ══════════════════════════════════════════════════════════════════════

const ACCUSED_TYPES = ['wrongly-accused', 'made-it-up', 'petty', 'nobody-would-speak'];

const wrongPersonBlamedLingers = {
  id: 'arc-wrong-person-blamed-lingers',
  category: 'social',
  location: 'backyard',
  weight(house, ctx) {
    const pair = pairFromMemory(house, ACCUSED_TYPES, 'accuser-confronted', ctx);
    return pair ? fit(ctx, 4.5 + Math.min(2.5, grudge(pair.a, pair.b) * 0.25)) : 0;
  },
  fire(house, ctx, api) {
    const { a: accused, b: accuser } = pairFromMemory(house, ACCUSED_TYPES, 'accuser-confronted', ctx)
      || { a: house[0], b: house[1] };
    const p = pronouns(accused);
    // Days later, and with the room having moved on, an accusation nobody
    // withdrew is the only thing still attached to a name.
    const owns = pStats(accuser).temperament >= 6 || nice(accuser);

    const text = owns ? variant([
      `${accused} waits until the backyard is empty and asks ${accuser} to say, once, that it was not ${p.obj}. ${accuser} does, and adds that ${pronouns(accuser).sub} should have said it a week ago when it would have cost something.`,
      `"You told the whole house it was me." ${accuser} does not argue the point. ${pronouns(accuser).Sub} explains what ${pronouns(accuser).sub} thought ${pronouns(accuser).sub} knew, agrees it was thin, and takes it back out loud to the two people who mattered.`,
      `${accused} has been carrying it for days and it comes out badly, in the middle of a conversation about laundry. ${accuser} lets ${p.obj} finish and then apologises properly, which ${accused} was not prepared for.`,
      `${accuser} retracts it — genuinely, in the backyard, without an audience. It does not undo the week ${accused} spent being looked at, and ${accuser} says so before ${accused} has to.`,
    ], ctx, accused, accuser, owns) : variant([
      `${accused} asks ${accuser} to name one thing that made it ${p.obj}. ${accuser} names a conversation that did not happen and then a feeling, and the backyard goes very quiet.`,
      `"You were wrong about me and you have not said so once." ${accuser} answers that ${pronouns(accuser).sub} never actually accused anybody, which is not what the house heard and not what ${accused} heard either.`,
      `Days later, ${accused} is still the person it was probably. ${p.Sub} says that out loud to ${accuser}, who calls it dramatic, which is precisely the word ${accused} needed to stop being reasonable.`,
      `${accuser} tries to move the conversation to what the house believes now. ${accused} keeps it exactly where it is: on the sentence ${accuser} said, to those people, on that day.`,
    ], ctx, accused, accuser, owns);

    api.addBond(accused, accuser, owns ? -0.5 : -1.4);
    api.popDelta(accuser, owns ? 1 : -1);
    api.remember(accused, accuser, 'accuser-confronted', owns ? 1 : 3, { retracted: owns });
    if (!owns) api.suspicion(accused, accuser, 1.1);
    return result(text, [accused, accuser], owns ? 'TAKES IT BACK' : 'NEVER TOOK IT BACK',
      owns ? 'blue' : 'red');
  },
};

// ══════════════════════════════════════════════════════════════════════
// 9 — what was said on eviction night, remembered on Saturday
// ══════════════════════════════════════════════════════════════════════

const threatenedRemembers = {
  id: 'arc-threatened-remembers',
  category: 'social',
  location: 'bathroom',
  weight(house, ctx) {
    const pair = pairFromMemory(house, ['threatened-me-live', 'exposed-on-live'], 'cold-shoulder-served', ctx);
    return pair ? fit(ctx, 4.7) : 0;
  },
  fire(house, ctx, api, rng = () => 0.5) {
    const pair = pairFromMemory(house, ['threatened-me-live', 'exposed-on-live'], 'cold-shoulder-served', ctx)
      || { a: house[0], b: house[1], m: null };
    const { a: voter, b: speaker, m } = pair;
    const exposed = m?.type === 'exposed-on-live';
    const p = pronouns(voter);

    const text = exposed ? variant([
      `${speaker} used a live plea to say out loud what ${voter} had told ${pronouns(speaker).obj} in private. ${voter} has been perfectly polite ever since, in the way you are polite to a stranger, and ${speaker} has finally noticed the difference.`,
      `${voter} passes ${speaker} in the bathroom doorway and does not move out of the way or into it. ${speaker} says ${p.posAdj} name. ${voter} keeps walking. Whatever ${speaker} bought by saying it on the floor, this is the price.`,
      `"You put my name in your speech." ${voter} says it once, brushing ${p.posAdj} teeth, without looking round, and does not stay for the answer ${speaker} spends the rest of the night preparing.`,
      `${speaker} tries to restart the friendship as though the plea were a thing that happened to both of them. ${voter} agrees pleasantly with every sentence and gives ${pronouns(speaker).obj} nothing at all.`,
    ], ctx, voter, speaker) : variant([
      `${speaker} promised, on the floor, in front of everybody, to come for whoever kept ${pronouns(speaker).obj} here. ${voter} has been counting the days since and has decided ${p.sub} would rather not find out whether ${speaker} meant it.`,
      `${voter} stops telling ${speaker} things. Not dramatically — ${p.sub} just answers questions with the answer and nothing after it, and before the next competition ${speaker} realizes the speech cost ${pronouns(speaker).obj} a person.`,
      `"You said it to the room." ${voter} does not raise ${p.posAdj} voice in the bathroom. "I was in the room." That is the entire conversation and ${speaker} thinks about it all week.`,
      `${speaker} looks for ${voter} to explain that the plea was a plea and not a plan. ${voter} listens, says ${p.sub} understands, and continues doing precisely what ${p.sub} was doing before, which is nothing.`,
    ], ctx, voter, speaker);

    api.suspicion(voter, speaker, 1.2);
    api.addBond(voter, speaker, -0.9);
    api.remember(voter, speaker, 'cold-shoulder-served', 2, { about: exposed ? 'exposed me live' : 'threatened the room' });
    const s = pStats(voter);
    if (rng() < Math.min(0.8, (s.strategic + s.boldness) / 24 + 0.15)) {
      api.setTarget(voter, speaker, exposed ? 'said my private business on the floor' : 'promised to come for me live');
    }
    return result(text, [voter, speaker], exposed ? 'NOT FORGOTTEN' : 'THE SPEECH COST SOMETHING', 'red');
  },
};

// ══════════════════════════════════════════════════════════════════════
// ENDGAME — five and fewer, where the week stops being the point
// ══════════════════════════════════════════════════════════════════════

// 10 — one voter, two nominees, one afternoon

/** At four, exactly one person votes. Find them. */
function soleVoter(house, ctx) {
  if (!Array.isArray(house) || house.length !== 4) return null;
  const noms = (ctx?.nominees || []).filter(n => house.includes(n));
  if (noms.length !== 2) return null;
  const hoh = ctx?.hoh;
  const voters = house.filter(n => n !== hoh && !noms.includes(n));
  if (voters.length !== 1) return null;
  return { voter: voters[0], noms, hoh };
}

const endgameSoleVoterCourt = {
  id: 'arc-endgame-sole-voter-court',
  category: 'deals',
  location: 'hoh-room',
  weight(house, ctx) {
    const scene = soleVoter(house, ctx);
    if (!scene) return 0;
    // This is the whole afternoon at final four.
    return fit(ctx, ctx?.act === 'campaign' ? 9 : 6);
  },
  fire(house, ctx, api, rng = () => 0.5) {
    const scene = soleVoter(house, ctx);
    if (!scene) {
      const a = house[0], b = house[1];
      api.addBond(a, b, 0.3);
      return result(`The last vote in the house has nobody to hear.`, [a, b], 'NO COURT', 'grey');
    }
    const { voter, noms } = scene;
    const score = n => pStats(n).social * 0.35 + bond(voter, n) * 0.5
      + respectOf(voter, n) * 0.1 + (rng() - 0.5) * 2;
    const ranked = noms.slice().sort((a, b) => score(b) - score(a));
    const [better, worse] = ranked;
    const p = pronouns(voter);

    const text = variant([
      `Both of them get ${voter} alone before dinner and both make the same argument: the other person wins at the end. ${better} makes it about what ${voter} needs when the decision arrives. ${worse} makes it about what ${worse} deserves, and that is the whole difference.`,
      `There is one vote left in this house and it belongs to ${voter}, who spends the afternoon being courted in two separate rooms by two people who keep passing each other in the corridor. ${better}'s pitch is the one ${p.sub} is still thinking about at midnight.`,
      `${worse} goes first and talks for a long time. ${better} goes second and asks ${voter} a question instead, which is the first time all week anybody has asked ${p.obj} anything.`,
      `${voter} has never had this much power and does not enjoy it. ${better} makes it easy — lays out the final three, where ${voter} sits in it, and stops talking. ${worse} does not stop talking.`,
      `"You are picking who you sit next to at the end." ${better} says it plainly in the HOH room. ${worse} says the same thing an hour later and it lands differently, because by then ${voter} has already started leaning.`,
    ], ctx, voter, better, worse);

    api.addBond(voter, better, 1.2);
    api.addBond(voter, worse, -0.4);
    api.remember(voter, better, 'plea', 2, { about: 'the final four campaign' });
    api.remember(better, voter, 'came-to-me', 2, { about: 'the only vote left' });
    return result(text, [voter, better, worse], 'ONE VOTE, TWO CASES', 'gold');
  },
};

// 11 — the partner you promised, weighed against the seat

const endgameCutCalculus = {
  id: 'arc-endgame-cut-calculus',
  category: 'deals',
  location: 'diary-room',
  weight(house, ctx) {
    if (!endgame(house)) return 0;
    for (const name of house) {
      const deals = liveEndgameDeals(name, house);
      if (!deals.length) continue;
      const partner = (deals[0].players || []).find(n => n !== name && house.includes(n));
      if (partner && !remembers(name, partner, 'planning-the-cut')
        && !remembers(name, partner, 'resolve')) return fit(ctx, 7);
    }
    return 0;
  },
  fire(house, ctx, api, rng = () => 0.5) {
    let actor = null, partner = null, deal = null;
    for (const name of quiet(house)) {
      const deals = liveEndgameDeals(name, house);
      const found = deals.find(d => (d.players || []).some(n => n !== name && house.includes(n)));
      if (!found) continue;
      const other = (found.players || []).find(n => n !== name && house.includes(n));
      if (!other) continue;
      if (remembers(name, other, 'planning-the-cut') || remembers(name, other, 'resolve')) continue;
      actor = name; partner = other; deal = found; break;
    }
    if (!actor || !partner) {
      const a = house[0], b = house[1];
      api.addBond(a, b, 0.3);
      return result(`Nobody in this house is holding anything that reaches the end.`,
        [a, b], 'NOTHING TO BREAK', 'grey');
    }
    const p = pronouns(actor);
    const tier = tierOf(deal) === 'final-two' ? 'final two' : 'final three';
    // Entirely proportional: how much of a planner they are, how dangerous the
    // partner has become, and how much loyalty pulls the other way.
    const s = pStats(actor);
    const pull = Math.max(0.05, Math.min(0.92,
      s.strategic / 14 + dangerOf(actor, partner) * 0.018 - s.loyalty / 26 + 0.08));
    const cutting = rng() < pull;

    const text = cutting ? variant([
      `${actor} does the sum in the Diary Room and does not like the answer: the ${tier} with ${partner} was made when there were eleven people to hide behind, and there are ${house.length}. ${p.Sub} does not say the word out loud. ${p.Sub} does not have to.`,
      `"${partner} beats me." ${actor} tries three different ways of arranging the last chairs and ${partner} wins all three. The deal was real when ${p.sub} made it, which is the part that is going to be hard to explain later.`,
      `${actor} has kept every promise ${p.sub} has made in here and is now looking directly at the one ${p.sub} cannot afford to. ${partner} would take ${p.obj} to the end. That is exactly the problem.`,
      `The ${tier} has been ${actor}'s most useful relationship so far, but keeping ${partner} is becoming dangerous. ${p.Sub} starts asking what the next eviction would look like without ${partner}.`,
    ], ctx, actor, partner) : variant([
      `${actor} runs the numbers on cutting ${partner} and finds them fine, and does not care. The ${tier} was made on a night that mattered, and ${p.sub} would rather lose to ${partner} than get to the end without ${pronouns(partner).obj}.`,
      `"I know what everybody would do here." ${actor} says it to the Diary Room and then says the other thing too: that ${p.sub} shook on the ${tier} with ${partner} and intends to be somebody who meant it.`,
      `${actor} weighs the seat against the promise for about a minute, which is longer than ${p.sub} expected to and much shorter than the house would guess. ${partner} is going with ${p.obj}.`,
      `Everybody left is doing this arithmetic. ${actor} does it, arrives at ${partner}, and decides the ${tier} is the only thing ${p.sub} will still be able to describe honestly when this is over.`,
    ], ctx, actor, partner);

    api.remember(actor, partner, cutting ? 'planning-the-cut' : 'resolve', cutting ? 3 : 2,
      { tier, kept: !cutting });
    api.addBond(actor, partner, cutting ? -0.7 : 1.1);
    if (!cutting) api.suspicion(actor, partner, -0.4);
    return result(text, [actor, partner], cutting ? 'WEIGHING THE CUT' : 'KEEPING IT',
      cutting ? 'red' : 'green');
  },
};

// 12 — saying out loud that somebody cannot be beaten

const endgameUnbeatable = {
  id: 'arc-endgame-unbeatable-realization',
  category: 'deals',
  location: 'backyard',
  weight(house, ctx) {
    if (!endgame(house) || house.length < 3) return 0;
    return fit(ctx, 6.5);
  },
  fire(house, ctx, api) {
    const ranked = house.slice().sort((a, b) => threat(b) - threat(a));
    const unbeatable = ranked[0];
    const rest = quiet(house.filter(n => n !== unbeatable));
    const actor = rest[0];
    const third = rest[1] || rest[0];
    if (!actor || !unbeatable || actor === unbeatable) {
      const a = house[0], b = house[1];
      api.suspicion(a, b, 0.4);
      return result(`Nobody wants to name the favourite.`, [a, b], 'UNSAID', 'grey');
    }
    const p = pronouns(actor);
    const strong = respectOf(actor, unbeatable) >= 4 || villain(actor);

    const text = strong ? variant([
      `${actor} says it to ${third} in the backyard like a fact rather than a complaint: nobody sitting next to ${unbeatable} at the end wins, and that includes both of them. It is the first honest sentence either of them has said this week.`,
      `"Name one person on that jury who does not vote for ${unbeatable}." ${third} tries. ${third} cannot. ${actor} lets the silence do the rest of the argument.`,
      `${actor} has been avoiding the thought for two weeks and hands it to ${third} fully formed: ${unbeatable} wins from any chair, against anybody, and there is exactly one week left in which that is a solvable problem.`,
      `${actor} does not dress it up. "${unbeatable} beats me. ${unbeatable} beats you. That is the whole conversation." ${third} does not disagree, which is the same as agreeing to something.`,
    ], ctx, actor, unbeatable, third) : variant([
      `${actor} works up to it slowly, and the thing ${p.sub} eventually says to ${third} is that ${p.sub} does not think ${p.sub} can beat ${unbeatable}, which is a much harder sentence than the strategic version of it.`,
      `"Am I mad, or —" ${actor} does not finish it, and ${third} finishes it for ${p.obj}, with ${unbeatable}'s name. Both of them look slightly ill.`,
      `${actor} counts the jury on ${p.posAdj} fingers for ${third}, in the backyard, quietly, and gets to a number for ${unbeatable} that ends the conversation.`,
      `${third} asks ${actor} who ${p.sub} wants to sit next to at the end. ${actor} answers by listing everybody except ${unbeatable}, and hears how that sounds a second after saying it.`,
    ], ctx, actor, unbeatable, third);

    api.setTarget(actor, unbeatable, `cannot be beaten at the end`);
    api.remember(actor, unbeatable, 'respect', 3, { about: 'wins from any chair' });
    if (third && third !== actor) {
      api.remember(third, unbeatable, 'warning', 2, { from: actor });
      api.suspicion(third, unbeatable, 0.9);
      api.addBond(actor, third, 0.5);
    }
    return result(text, [actor, unbeatable, third], 'NAMES THE FAVOURITE', 'gold');
  },
};

// 13 — two people compare the promises they are holding

/** Somebody who has promised the end to two different people still in here. */
function doubleDealer(house) {
  for (const suspect of house) {
    const holders = house.filter(n => n !== suspect
      && liveEndgameDeals(n, house).some(d => (d.players || []).includes(suspect)));
    if (holders.length >= 2) return { suspect, holders: holders.slice(0, 2) };
  }
  return null;
}

// ULTRA-RARE: needs two survivors at five-or-fewer who each hold a live endgame
// deal with the SAME third person — a real double game that has survived to the
// end, which the deal cap deliberately makes uncommon.
const endgamePromisesCompared = {
  id: 'arc-endgame-final-three-promises-compared',
  category: 'deals',
  location: 'bedroom',
  weight(house, ctx) {
    if (!endgame(house) || house.length < 3) return 0;
    const found = doubleDealer(house);
    if (!found) return 0;
    if (remembers(found.holders[0], found.suspect, 'overcommitted')) return 0;
    return fit(ctx, 8);
  },
  fire(house, ctx, api) {
    const found = doubleDealer(house);
    if (!found) {
      const a = house[0], b = house[1];
      api.addBond(a, b, 0.3);
      return result(`Nobody compares anything tonight.`, [a, b], 'UNCOMPARED', 'grey');
    }
    const { suspect } = found;
    const [one, two] = quiet(found.holders);
    const p = pronouns(one);

    const text = variant([
      `It comes out sideways, the way it always does: ${one} says "when the three of us get there" and ${two} says "which three", and the answer both of them give has ${suspect} in it and only one of them has the third chair.`,
      `${one} and ${two} compare notes in the bedroom, expecting to find they are on the same page, and find instead that they are on two identical pages ${suspect} wrote separately.`,
      `"${suspect} told you that? Word for word?" ${two} repeats the promise back and ${one} recognises ${p.posAdj} own conversation in somebody else's mouth. Neither of them raises their voice. It is worse than if they had.`,
      `Two houseguests, one bedroom, and the same guarantee from the same person. ${one} and ${two} take a long time to say the obvious thing, and once it is said neither of them can put it back.`,
      `${two} mentions the deal casually, as a thing already settled. ${one} asks ${pronouns(two).obj} to say the date. It is the same date. ${suspect} shook on the end twice in one evening.`,
    ], ctx, one, two, suspect);

    api.suspicion(one, suspect, 1.6);
    api.suspicion(two, suspect, 1.6);
    api.remember(one, suspect, 'overcommitted', 3, { with: two });
    api.remember(two, suspect, 'overcommitted', 3, { with: one });
    api.addBond(one, two, 0.9);
    api.addBond(one, suspect, -1.2);
    api.addBond(two, suspect, -1.2);
    return result(text, [one, two, suspect], 'THE SAME PROMISE, TWICE', 'red');
  },
};

// 14 — counting the jury out loud

const endgameJuryMath = {
  id: 'arc-endgame-jury-math',
  category: 'deals',
  location: 'hoh-room',
  // Both halves read the SAME roster, and it is the real one.
  //
  // This used to count `gs.eliminated.slice(-5)` — a hard-coded five that
  // ignored jurySize entirely, so a season with a jury of three and a season
  // with a jury of nine both had somebody counting the same five names, and
  // pre-jurors who cannot vote were counted among them. The event fired and
  // then reasoned about the wrong room.
  //
  // weight() and fire() must agree or the event fires and finds nothing, so
  // neither derives it separately.
  weight(house, ctx) {
    if (!endgame(house) || house.length < 3) return 0;
    if (seatedJurors().length < 3) return 0;
    return fit(ctx, 6.8);
  },
  fire(house, ctx, api, rng = () => 0.5) {
    const jury = seatedJurors();
    if (jury.length < 3) return null;
    const counter = quiet(house)[0] || house[0];
    const others = house.filter(n => n !== counter);
    const juryLove = n => jury.reduce((sum, j) => sum + bond(n, j), 0);
    const beloved = others.slice().sort((a, b) => juryLove(b) - juryLove(a))[0] || others[0];
    if (!beloved) {
      api.popDelta(counter, -1);
      return result(`${counter} counts the jury and gets a number ${pronouns(counter).sub} does not want.`,
        [counter], 'BAD ARITHMETIC', 'grey');
    }
    const p = pronouns(counter);
    const listener = others.find(n => n !== beloved) || beloved;
    const names = jury.slice(-3).join(', ');
    const margin = juryLove(beloved) - juryLove(counter);

    const text = variant([
      `${counter} lists the jury out loud in the HOH room — ${names} — and stops at the third name, because ${p.sub} has just realised that all three of them liked ${beloved} and none of them owe ${p.obj} anything.`,
      `"Go through them with me." ${counter} makes ${listener} do it one by one, and the exercise produces exactly one conclusion, which is that ${beloved} has been making friends out of everybody ${p.sub} has been beating.`,
      `${counter} has been playing the house. ${beloved} has been playing the people leaving it. Sitting in the HOH room with ${names} written out in ${p.posAdj} head, ${counter} works out which of those two games the last night belongs to.`,
      `The jury is ${jury.length} people now, and ${counter} can name what every one of them thinks of ${pronouns(beloved).obj}. ${p.Sub} cannot name what a single one of them thinks of ${p.obj}, and that gap is roughly ${Math.max(1, Math.round(Math.abs(margin)))} votes wide.`,
      `${counter} tells ${listener} that the game is not the block any more, it is ${names} and whoever else is sitting out there. Then ${p.sub} says ${beloved}'s name, and ${listener} understands it as the plan it is.`,
    ], ctx, counter, beloved, listener);

    api.remember(counter, beloved, 'watching-who-wants-it', 2, { about: 'the jury likes them' });
    api.addBond(counter, beloved, -0.5);
    if (listener && listener !== beloved) api.remember(listener, beloved, 'warning', 1, { from: counter });
    const s = pStats(counter);
    if (rng() < Math.min(0.9, s.strategic / 12 + 0.15)) {
      api.setTarget(counter, beloved, 'the jury already loves them');
    }
    return result(text, [counter, beloved, listener], 'COUNTING THE JURY', 'gold');
  },
};

export const CONSEQUENCE_ARC_EVENTS = [
  lieDisprovedLater,
  apologyWithoutTrust,
  fightSplitsTheRoom,
  promiseExposedByCount,
  comfortBecomesLoyalty,
  blindsideRewatch,
  rogueVoteDenial,
  wrongPersonBlamedLingers,
  threatenedRemembers,
  endgameSoleVoterCourt,
  endgameCutCalculus,
  endgameUnbeatable,
  endgamePromisesCompared,
  endgameJuryMath,
];

export default CONSEQUENCE_ARC_EVENTS;
