// ══════════════════════════════════════════════════════════════════════
// bb/care-package.js — the country picks a favourite, out loud
// ══════════════════════════════════════════════════════════════════════
//
// BB18's America's Care Package, and it is the exact opposite of every other
// twist in this catalogue.
//
// The Hacker, Roadkill, Pandora's Box, the App Store, the Coin — all of them
// hand somebody an advantage and hide either the power or the holder. This one
// hides NOTHING. The contents are announced before the vote, the vote is the
// audience's, and the recipient is named in front of the entire house. There
// is no hunt, no paranoia, no wrong door.
//
// What it produces instead is worse, and it is the reason this belongs in a
// season alongside the secret ones: the house is told, on camera, who the
// country likes best. Everybody in that room now knows they are not it. A
// public gift is a public verdict on everybody who did not get one, and the
// only defence against being the audience's favourite is to stop being liked.
//
// Rules, per the wiki:
//   · one package a week, contents announced BEFORE the vote
//   · the audience votes; nobody in the house can earn or refuse it
//   · the recipient is announced publicly
//   · a houseguest may receive ONE package all season, then leaves the pool
//
// The five, in the order the show ran them.
import { gs } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getPerceivedBond } from '../bonds.js';
import { makePicker, clamp } from '../bb-comps/_shared.js';

const beat = (text, players, badgeText, badgeClass = 'gold') =>
  ({ text, players: [...players].filter(Boolean), badgeText, badgeClass });

/**
 * The shelf.
 *
 *   effect  which hook in week.js reads it. The rules delta is per-PACKAGE,
 *           not per-twist, which is why this twist declares an empty rules
 *           block in the contract: 'super-safety' changes who may be
 *           nominated and 'bribe' changes a ballot, and no single static
 *           descriptor covers both.
 *   catch   the limitation, because four of these five are weaker than they
 *           sound and the fifth costs the recipient their whole edit.
 */
export const CARE_PACKAGES = [
  {
    id: 'never-not', name: 'The Never-Not Pass', effect: 'never-not',
    blurb: 'The recipient can never be a Have-Not again for the rest of the season.',
    catch: 'It does nothing about the block. It is comfort, handed out in a game that evicts people.',
  },
  {
    id: 'vote-block', name: 'Eliminate Two Eviction Votes', effect: 'vote-block',
    blurb: 'The recipient names two houseguests who will not be allowed to vote at this eviction.',
    catch: 'They name them out loud. Unlike the Hacker, both silenced houseguests know exactly whose hand did it.',
  },
  {
    id: 'super-safety', name: 'Super Safety', effect: 'super-safety',
    blurb: 'The recipient cannot be nominated or named as a replacement this week.',
    catch: 'They have to wear the costume all week, so every single person in the house is reminded daily who the audience chose.',
  },
  {
    id: 'co-hoh', name: 'Co-Head of Household', effect: 'co-hoh',
    blurb: 'The recipient becomes Co-Head of Household: safe for the week, and names one of the two nominees.',
    catch: 'The Head of Household won a competition for this and now shares it with somebody who won a popularity vote.',
  },
  {
    id: 'bribe', name: 'The BB Bribe', effect: 'bribe',
    blurb: 'The recipient is given $5,000 to offer another houseguest in exchange for a vote.',
    catch: 'The money is announced. Who took it is not — so the whole house spends the week knowing somebody in it was bought.',
  },
];

const store = () => { gs.bb ||= {}; gs.bb.carePackages ||= []; return gs.bb.carePackages; };
/** Season-long, and the only care package effect that outlives its week. */
export const neverNots = () => { gs.bb ||= {}; gs.bb.neverNots ||= []; return gs.bb.neverNots; };

const DELIVERY = [
  (n, pkg) => `The package is for ${n}. Not chosen by anybody in this house, not won, not earned — voted for by people none of them have ever met.`,
  (n, pkg) => `"${n}." The name is read out in front of everybody, and eleven other people stand there hearing that the country picked somebody else.`,
  (n, pkg) => `${pkg} goes to ${n}, publicly, with the whole house watching the box get handed over.`,
  (n, pkg) => `${n} is called to collect ${pkg}. There is applause, and some of it is real.`,
];

/**
 * Deliver this week's package.
 *
 * Which package: the show ran them in a fixed order, one a week, so this
 * counts what has already been delivered rather than reading the week number —
 * a season that schedules the twist on weeks 2, 5 and 9 still gets the Pass,
 * then the vote block, then Super Safety.
 *
 * Who: the audience, which in this simulator means popularity — the same
 * currency the App Store spends. The floor keeps an invisible houseguest a
 * long shot rather than an impossibility, and previous recipients are out of
 * the pool entirely, which is the rule that makes the last package in a season
 * a genuinely different vote from the first.
 *
 * @returns {object|null} the act, or null when there is nobody left to give to
 */
export function runCarePackage({ week, house, hoh, rng = Math.random, forced = null } = {}) {
  const room = (house || []).filter(Boolean);
  if (room.length < 4) return null;
  const delivered = store();
  const pkg = (forced && CARE_PACKAGES.find(p => p.id === forced))
    || CARE_PACKAGES[delivered.length % CARE_PACKAGES.length];
  const say = makePicker(rng);

  // One each. When everybody has had one — a long season, a small house — the
  // pool reopens rather than the twist silently doing nothing.
  const had = new Set(delivered.map(d => d.recipient));
  let pool = room.filter(n => !had.has(n));
  const poolReopened = !pool.length;
  if (poolReopened) pool = [...room];

  const weights = pool.map(name => ({
    name, weight: Math.max(0.6, 3 + (gs.popularity?.[name] || 0)),
  }));
  const total = weights.reduce((sum, c) => sum + c.weight, 0);
  let roll = rng() * total;
  let picked = weights[weights.length - 1];
  for (const c of weights) { roll -= c.weight; if (roll <= 0) { picked = c; break; } }
  const recipient = picked.name;

  const beats = [beat(say(DELIVERY)(recipient, pkg.name), [recipient],
    'AMERICA CHOSE', 'gold')];
  beats.push(beat(
    `${pkg.name}: ${pkg.blurb} ${pkg.catch}`,
    [recipient], 'WHAT IS IN IT', 'blue'));
  // The people who did not get it, which is everybody, and one of them is
  // taking it personally enough to say so.
  const stung = room.filter(n => n !== recipient)
    .sort((a, b) => pStats(a).temperament - pStats(b).temperament)[0];
  if (stung) {
    const p = pronouns(stung);
    beats.push(beat(
      `${stung} claps along and does the arithmetic anyway: every week this happens, the house is handed a ranking `
        + `of who the country actually likes, and ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} not been at the top of one yet.`,
      [stung], 'NOT CHOSEN', 'grey'));
  }
  if (pkg.effect === 'never-not' && !neverNots().includes(recipient)) neverNots().push(recipient);

  const act = {
    type: 'care-package', week: week?.num || 0, secret: false,
    packageId: pkg.id, package: pkg.name, blurb: pkg.blurb, catch: pkg.catch,
    effect: pkg.effect, recipient, hoh: hoh || null, poolReopened,
    ineligible: [...had].filter(n => room.includes(n)),
    blocked: [], bribe: null, coNominee: null, beats,
  };
  delivered.push({ week: week?.num || 0, package: pkg.id, recipient });
  return act;
}

/**
 * Super Safety and Co-HOH both make their holder unnominatable for the WEEK —
 * not for one ceremony, which is the Cloud's job and the difference between
 * the two powers.
 */
export const carePackageProtects = act =>
  (act && (act.effect === 'super-safety' || act.effect === 'co-hoh')) ? act.recipient : null;

/**
 * The Co-HOH's nominee. Read off their own game, not the Head of Household's,
 * which is the entire complaint the HOH is about to have.
 */
export function coHohNominee({ act, house, hoh, untouchable = [], rng = Math.random }) {
  if (!act || act.effect !== 'co-hoh') return null;
  const bond = (a, b) => { try { return getPerceivedBond(a, b); } catch { return 0; } };
  const pool = (house || []).filter(n => n !== hoh && n !== act.recipient && !untouchable.includes(n));
  if (!pool.length) return null;
  const named = [...pool].sort((a, b) =>
    (bond(act.recipient, a) + rng() * 2.2) - (bond(act.recipient, b) + rng() * 2.2))[0];
  act.coNominee = named;
  act.beats.push(beat(
    `${act.recipient} names ${named}, and ${hoh} has to stand there while somebody who won a popularity vote `
      + 'fills half of a block they won a competition for.',
    [act.recipient, named, hoh], 'THE SECOND KEY', 'red'));
  return named;
}

/**
 * Two ballots, removed by name and in public.
 *
 * The Hacker cancels one ballot anonymously and the silenced voter has to
 * guess. This removes two and tells them who did it, which is a completely
 * different kind of damage — there is nothing to work out and nowhere for the
 * grievance to go except at the person holding the box.
 */
export function carePackageVoteBlock({ act, ballots, nominees, house, rng = Math.random }) {
  if (!act || act.effect !== 'vote-block') return [];
  const room = (ballots || []).map(b => b.voter).filter(n => house.includes(n) && n !== act.recipient);
  if (room.length < 3) return [];              // never silence a house into a tie of one
  const bond = (a, b) => { try { return getPerceivedBond(a, b); } catch { return 0; } };
  // Silence the two voting AGAINST whoever the recipient wants kept, and fall
  // back to their two worst relationships when they have no dog in the vote.
  const ally = [...nominees].sort((a, b) => bond(act.recipient, b) - bond(act.recipient, a))[0];
  const rival = nominees.find(n => n !== ally) || null;
  const against = room.filter(n => {
    const b = ballots.find(x => x.voter === n);
    return b && b.evict === ally;
  });
  const ranked = (against.length >= 2 ? against : room)
    .sort((a, b) => (bond(act.recipient, a) + rng() * 1.5) - (bond(act.recipient, b) + rng() * 1.5));
  const blocked = ranked.slice(0, Math.min(2, Math.max(0, room.length - 2)));
  if (!blocked.length) return [];
  act.blocked = [...blocked];
  act.blockSaved = ally || null;
  act.blockRival = rival;
  for (const name of blocked) {
    const p = pronouns(name);
    act.beats.push(beat(
      `${name} is not voting tonight, and knows precisely who arranged that, because ${act.recipient} said `
        + `${p.posAdj} name out loud in front of the whole house.`,
      [name, act.recipient], 'SILENCED, IN PUBLIC', 'red'));
  }
  return blocked;
}

/**
 * $5,000, offered in private, out of money the whole house watched arrive.
 *
 * Whether it lands is a real question: the price of a vote depends on how
 * badly the buyer is disliked and how loyal the seller is to the room they
 * would be betraying. A refused bribe is the better beat of the two, because
 * the person who refused it now knows something.
 */
export function carePackageBribe({ act, ballots, nominees, house, rng = Math.random }) {
  if (!act || act.effect !== 'bribe') return null;
  const bond = (a, b) => { try { return getPerceivedBond(a, b); } catch { return 0; } };
  const keep = [...nominees].sort((a, b) => bond(act.recipient, b) - bond(act.recipient, a))[0];
  const evict = nominees.find(n => n !== keep);
  if (!keep || !evict) return null;
  // Somebody currently voting the wrong way, who might be moved.
  const wrong = (ballots || []).filter(b => b.evict === keep && b.voter !== act.recipient
    && house.includes(b.voter));
  if (!wrong.length) return null;
  const mark = [...wrong].sort((a, b) =>
    (pStats(a.voter).loyalty - bond(act.recipient, a.voter) + rng() * 2)
    - (pStats(b.voter).loyalty - bond(act.recipient, b.voter) + rng() * 2))[0].voter;
  const st = pStats(mark);
  const chance = clamp(0.52 + (bond(act.recipient, mark) * 0.03)
    + (st.boldness || 5) * 0.02 - (st.loyalty || 5) * 0.05, 0.12, 0.88);
  const taken = rng() < chance;
  const p = pronouns(mark);
  act.bribe = { mark, taken, keep, evict, amount: 5000 };
  if (taken) {
    const ballot = ballots.find(b => b.voter === mark);
    if (ballot) { ballot.evict = evict; ballot.changed = true; ballot.bribed = true; }
    act.beats.push(beat(
      `${mark} takes the money. The house knows there is $5,000 in this building and does not know where it went, `
        + `and ${mark} is going to be standing in the middle of that conversation for the rest of the season.`,
      [mark, act.recipient], 'BOUGHT', 'red'));
  } else {
    act.beats.push(beat(
      `${mark} says no, and then has a much more valuable thing than five thousand dollars: ${p.sub} `
        + `${p.sub === 'they' ? 'know' : 'knows'} exactly who ${act.recipient} is trying to keep, and why.`,
      [mark, act.recipient], 'REFUSED, AND FILED', 'gold'));
  }
  return act.bribe;
}
