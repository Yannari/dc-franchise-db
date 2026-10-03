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
import { makeScene } from '../bb/script/scene.js';
import { numberWord } from '../bb/script/inject.js';

// ── shared plumbing ───────────────────────────────────────────────────

/** Deterministic prose pick: a hash of the week, the beat and who is in it. */

/** Least-seen first, weighted toward whoever this week is about. */
const quiet = pool => spotlightOrder((pool || []).filter(Boolean));

const result = (body, players, badgeText, badgeClass) =>
  ({ ...(typeof body === 'string' ? { text: body } : { scene: body }),
    players: (players || []).filter(Boolean), badgeText, badgeClass });

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
    // Whether the confirmation arrives as a favour or as gossip changes the
    // scene, not the verdict. The verdict was always going to be this.
    const kind = source && bond(holder, source) >= 2;

    const scene = makeScene('arc.lie', { a: holder, b: source || null }, { ending: kind ? 'friend' : 'outsider', target: liar }, [], 'pantry');

    api.suspicion(holder, liar, 1.5);
    api.addBond(holder, liar, -1.3);
    api.remember(holder, liar, 'lie-confirmed', 3, { about: what, via: source || null });
    if (source) api.remember(holder, source, 'told-me-something-real', 1, { about: liar });
    return result(scene, [holder, liar, source], 'THE LIE HOLDS NO MORE', 'red');
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
    // Whether it is accepted OUT LOUD is a personality question. Whether it is
    // believed is not a question at all.
    const aloud = nice(wronged) || pStats(wronged).temperament >= 6;

    const scene = makeScene('arc.apology', { a: wronged, b: sorry }, { ending: aloud ? 'aloud' : 'cold' }, [], 'backyard');

    // The bond moves. The trust does not — an apology noted is a data point
    // about how this person handles being caught, and it goes in the file.
    api.addBond(wronged, sorry, aloud ? 0.9 : 0.4);
    api.suspicion(wronged, sorry, 0.5);
    api.remember(wronged, sorry, 'apology-noted', 2, { about: what, aloud });
    return result(scene, [wronged, sorry], aloud ? 'SAYS IT IS FINE' : 'HEARD, NOT BELIEVED',
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

    const scene = makeScene('arc.sides', { a: forHurt, b: forOther || null }, { ending: 'scene', target: hurt, partner: other }, [], 'living-room');

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
    return result(scene, [hurt, other, forHurt, forOther], 'THE ROOM PICKS', 'red');
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
    const promised = entry.promised;
    const cast = entry.cast;
    if (!promised || !cast || promised === cast) continue;
    // ── the person actually promised, when there is one ──
    //
    // `promised` and `cast` both name NOMINEES: who the voter said they would
    // evict and who they wrote down. Neither is automatically the recipient of
    // the promise, which is why this used to nominate a bystander — the
    // highest-intuition houseguest still in the game — as the wronged party.
    // It read fine and it was fiction.
    //
    // The vote operation now records `promisee` whenever a promise was
    // renegotiated by the person on the other side of it, so the scene can be
    // about the two people it actually happened between. The bystander stays
    // as the fallback for the looser cases (a liar, a bandwagon jump), where
    // nobody in particular was promised anything.
    const wronged = entry.promisee && house.includes(entry.promisee) && entry.promisee !== voter
      ? entry.promisee
      : quiet(house.filter(n => n !== voter))
        .sort((a, b) => pStats(b).intuition - pStats(a).intuition || (a < b ? -1 : 1))[0];
    if (!wronged || remembers(wronged, voter, 'broke-word-found-out')) continue;
    return { voter, promisee: wronged, promised, cast, week, direct: wronged === entry.promisee };
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
    const gone = found.week?.evicted;
    // A liar with a story ready is a different scene from one caught flat.
    const ready = pStats(voter).social * 0.5 + pStats(voter).strategic * 0.4
      > pStats(promisee).intuition * 0.7 + 2;

    const scene = makeScene('arc.count', { a: promisee, b: voter }, { ending: ready ? 'smooth' : 'caught', target: promised, partner: cast,
      // the names are quoted only when neither is somebody in the scene
      intent: [promised, cast].some(n => n === promisee || n === voter) ? 'plain' : 'named' }, [], 'kitchen');

    api.remember(promisee, voter, 'broke-word-found-out', 3, { promised, cast });
    api.addBond(promisee, voter, -1.5);
    api.suspicion(promisee, voter, 1.4);
    // Whether it becomes a target is a question of nerve and calculation, not a
    // rule — plenty of people file this and wait.
    const s = pStats(promisee);
    if (rng() < Math.min(0.85, (s.strategic + s.boldness) / 22 + 0.1)) {
      api.setTarget(promisee, voter, `promised me ${promised} and wrote ${cast}`);
    }
    return result(scene, [promisee, voter], ready ? 'A GOOD EXPLANATION' : 'CAUGHT BY THE COUNT', 'red');
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
    // Loyalty plus what they actually feel they owe. A working deal is somebody
    // deciding the debt is a position rather than a feeling.
    const formal = pStats(owes).loyalty * 0.5 + obligationOf(owes, owed) * 0.4 >= 4;

    const scene = makeScene('arc.debt', { a: owes, b: owed, c: critic || null }, { ending: formal ? 'deal' : 'defend' }, [], 'bedroom');

    api.addBond(owes, owed, formal ? 1.4 : 0.8);
    api.remember(owes, owed, 'acted-on-the-debt', formal ? 3 : 2, { defendedFrom: critic || null });
    if (formal) api.sideDeal(owes, owed, 'vote', { about: 'I am not the vote that takes you out' });
    if (critic) api.remember(critic, owes, 'they-are-a-pair', 2, { about: owed });
    return result(scene, [owes, owed, critic], formal ? 'THE DEBT BECOMES A DEAL' : 'QUIETLY DEFENDED',
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
    const off = Math.abs(worst.error || 0);

    const counted = Number.isFinite(worst.believed) && Number.isFinite(worst.truth);
    const scene = makeScene('arc.rewatch', { a: name, b: amused[0] || null, c: amused[1] || null },
      { ending: 'scene', intent: counted ? 'counted' : 'vague', ...(counted ? { had: numberWord(worst.believed), real: numberWord(worst.truth) } : {}) }, [], 'kitchen');

    // Being the person who was most wrong is a story the house tells about you,
    // and stories about you are the only currency that is not votes.
    api.popDelta(name, -1);
    if (amused[0]) {
      api.remember(name, amused[0], 'humiliation', 1, { about: `read the vote ${off} wrong` });
      if (amused[1]) api.addBond(amused[0], amused[1], 0.6);
      else api.addBond(amused[0], name, -0.3);
    }
    return result(scene, [name, ...amused], 'STILL TALKING ABOUT THE VOTE', 'grey');
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

    const said = makeScene('arc.denial', { a: denier, b: doubter }, { ending: lying ? 'lying' : 'truthful', target: losing }, [], 'living-room');

    api.suspicion(doubter, denier, 1.3);
    api.addBond(doubter, denier, -0.5);
    api.remember(doubter, denier, 'denied-the-stray-vote', 2,
      { about: `the vote to keep ${losing}`, believed: false, truthful: !lying });
    return result(said, [denier, doubter], lying ? 'DENIES IT FLATLY' : 'TELLING THE TRUTH BADLY',
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
    // Days later, and with the room having moved on, an accusation nobody
    // withdrew is the only thing still attached to a name.
    const owns = pStats(accuser).temperament >= 6 || nice(accuser);

    const scene = makeScene('arc.wronged', { a: accused, b: accuser }, { ending: owns ? 'retracts' : 'refuses' }, [], 'backyard');

    api.addBond(accused, accuser, owns ? -0.5 : -1.4);
    api.popDelta(accuser, owns ? 1 : -1);
    api.remember(accused, accuser, 'accuser-confronted', owns ? 1 : 3, { retracted: owns });
    if (!owns) api.suspicion(accused, accuser, 1.1);
    return result(scene, [accused, accuser], owns ? 'TAKES IT BACK' : 'NEVER TOOK IT BACK',
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

    const scene = makeScene('arc.threat', { a: voter, b: speaker }, { ending: exposed ? 'exposed' : 'threatened' }, [], 'washroom');

    api.suspicion(voter, speaker, 1.2);
    api.addBond(voter, speaker, -0.9);
    api.remember(voter, speaker, 'cold-shoulder-served', 2, { about: exposed ? 'exposed me live' : 'threatened the room' });
    const s = pStats(voter);
    if (rng() < Math.min(0.8, (s.strategic + s.boldness) / 24 + 0.15)) {
      api.setTarget(voter, speaker, exposed ? 'said my private business on the floor' : 'promised to come for me live');
    }
    return result(scene, [voter, speaker], exposed ? 'NOT FORGOTTEN' : 'THE SPEECH COST SOMETHING', 'red');
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

    const said = makeScene('arc.court', { a: voter, b: better, c: worse }, { ending: 'scene' }, [], 'bedroom');

    api.addBond(voter, better, 1.2);
    api.addBond(voter, worse, -0.4);
    api.remember(voter, better, 'plea', 2, { about: 'the final four campaign' });
    api.remember(better, voter, 'came-to-me', 2, { about: 'the only vote left' });
    return result(said, [voter, better, worse], 'ONE VOTE, TWO CASES', 'gold');
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
    const tier = tierOf(deal) === 'final-two' ? 'final two' : 'final three';
    // Entirely proportional: how much of a planner they are, how dangerous the
    // partner has become, and how much loyalty pulls the other way.
    const s = pStats(actor);
    const pull = Math.max(0.05, Math.min(0.92,
      s.strategic / 14 + dangerOf(actor, partner) * 0.018 - s.loyalty / 26 + 0.08));
    const cutting = rng() < pull;

    const scene = makeScene('arc.cut', { a: actor, b: partner }, { ending: cutting ? 'cutting' : 'keeping', deal: tier }, [], 'diary-room');

    api.remember(actor, partner, cutting ? 'planning-the-cut' : 'resolve', cutting ? 3 : 2,
      { tier, kept: !cutting });
    api.addBond(actor, partner, cutting ? -0.7 : 1.1);
    if (!cutting) api.suspicion(actor, partner, -0.4);
    return result(scene, [actor, partner], cutting ? 'WEIGHING THE CUT' : 'KEEPING IT',
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
    const strong = respectOf(actor, unbeatable) >= 4 || villain(actor);

    const scene = makeScene('arc.favourite', { a: actor, b: third && third !== actor ? third : null }, { ending: strong ? 'blunt' : 'worried', target: unbeatable }, [], 'backyard');

    api.setTarget(actor, unbeatable, `cannot be beaten at the end`);
    api.remember(actor, unbeatable, 'respect', 3, { about: 'wins from any chair' });
    if (third && third !== actor) {
      api.remember(third, unbeatable, 'warning', 2, { from: actor });
      api.suspicion(third, unbeatable, 0.9);
      api.addBond(actor, third, 0.5);
    }
    return result(scene, [actor, unbeatable, third], 'NAMES THE FAVOURITE', 'gold');
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

    const scene = makeScene('arc.compare', { a: one, b: two }, { ending: 'scene', target: suspect }, [], 'bedroom');

    api.suspicion(one, suspect, 1.6);
    api.suspicion(two, suspect, 1.6);
    api.remember(one, suspect, 'overcommitted', 3, { with: two });
    api.remember(two, suspect, 'overcommitted', 3, { with: one });
    api.addBond(one, two, 0.9);
    api.addBond(one, suspect, -1.2);
    api.addBond(two, suspect, -1.2);
    return result(scene, [one, two, suspect], 'THE SAME PROMISE, TWICE', 'red');
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
    const listener = others.find(n => n !== beloved) || beloved;
    const names = jury.slice(-3).join(', ');
    const margin = juryLove(beloved) - juryLove(counter);

    const scene = makeScene('arc.jury', { a: counter, b: listener && listener !== beloved ? listener : null }, { ending: 'scene', target: beloved, jury: names }, [], 'living-room');

    api.remember(counter, beloved, 'watching-who-wants-it', 2, { about: 'the jury likes them' });
    api.addBond(counter, beloved, -0.5);
    if (listener && listener !== beloved) api.remember(listener, beloved, 'warning', 1, { from: counter });
    const s = pStats(counter);
    if (rng() < Math.min(0.9, s.strategic / 12 + 0.15)) {
      api.setTarget(counter, beloved, 'the jury already loves them');
    }
    return result(scene, [counter, beloved, listener], 'COUNTING THE JURY', 'gold');
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
