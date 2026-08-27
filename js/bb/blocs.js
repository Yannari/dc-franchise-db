// ══════════════════════════════════════════════════════════════════════
// bb/blocs.js — the power structures people organise against
// ══════════════════════════════════════════════════════════════════════
//
// The house was full of scenes about groups and empty of consequences for
// them. A showmance could reach the phase where somebody says "one of them has
// to go", pull three people aside about it, and nominate a stranger on
// Thursday — because that event wrote text and nothing else. Alliances were
// worse: they voted as a bloc, protected their own, and were read by the threat
// model as `alliances.length * 0.55`, so belonging to two loose pairs made
// somebody more dangerous than sitting at the centre of a six that had run the
// last four evictions. And nothing anywhere distinguished a secret four from
// one the whole house had been shouting about for weeks.
//
// The missing piece was never more narration. It was that nobody OUTSIDE a
// group ever formed a read on it: what it is, how many votes it has, who in it
// can actually be reached, and who else would help.
//
// So a bloc is the unit. A couple and an alliance are the same object here,
// because they are the same problem to an outsider — a set of people whose
// votes arrive together — and treating them separately is what let the
// showmance layer drift into pure storytelling.
//
// The five things this file knows how to do:
//
//   1. list  — what groups exist, and how strong each actually is
//   2. know  — what a given houseguest BELIEVES exists, which is different
//   3. read  — what they think it is worth, from what they know
//   4. aim   — which member of it they would go after, and why
//   5. tell  — how that belief travels, and why it is so often disbelieved
//
// Knowledge is per observer and never global. A bloc's power over the game is
// real from the day it forms; its power over people's DECISIONS starts at zero
// and grows only from evidence somebody could actually have seen.

import { gs, players } from '../core.js';
import { pStats } from '../players.js';
import { getBond, getPerceivedBond } from '../bonds.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
// ── WHO COUNTS AS IN THE HOUSE, FOR ONE CALCULATION ──
//
// Everything here reads the live roster, which is correct all season and
// wrong at exactly one moment: the alliance board is snapshotted AFTER the
// eviction has been applied, so the person who just left is missing from
// every bloc — and the House Life panels that draw that board play BEFORE
// the vote. The result was that one face in the alliance rows had no number
// under it, every week, and it was always the person about to go home.
//
// `withRoster` lets a caller compute the board over the house as it stood
// during the week. The cache is keyed off house state, so it is dropped on
// the way in and on the way out rather than serving an overridden answer to
// somebody who did not ask for one.
let _rosterOverride = null;
const live = () => _rosterOverride || (gs.activePlayers || []).filter(Boolean);

export function withRoster(names, fn) {
  const prev = _rosterOverride;
  _rosterOverride = Array.isArray(names) && names.length ? [...new Set(names.filter(Boolean))] : prev;
  _cache = {};
  try { return fn(); } finally { _rosterOverride = prev; _cache = {}; }
}
const archetypeOf = name => players.find(p => p.name === name)?.archetype || '';

function ensure() {
  gs.bb ||= {};
  gs.bb.blocs ||= {};
  // observer -> blocId -> 0..1. How sure this person is that the group exists.
  gs.bb.blocs.knowledge ||= {};
  // blocId -> { exposedWeek, how } once it has been said out loud in public.
  gs.bb.blocs.exposed ||= {};
  // Who has already been targeted through which bloc, so the house does not
  // rediscover the same group every week and re-announce it.
  gs.bb.blocs.plans ||= {};
  return gs.bb.blocs;
}

// ── 1. what exists ────────────────────────────────────────────────────

/**
 * Every group in the house, couples included.
 *
 * `power` is what the bloc is actually worth — votes it controls, weighted by
 * whether those votes really arrive together. `loyalty` is that second part on
 * its own, because an outsider deciding where to attack cares less about how
 * big a group is than about whether it holds.
 */
// Rebuilt only when the house changes shape.
//
// Every event's weight() asks what groups exist, for every event, for every
// beat — a season asks this tens of thousands of times, and each answer walks
// every alliance, every showmance and every pair inside them. Unmemoised it
// turned a forty-season probe from ninety seconds into something that did not
// finish. The signature is deliberately cheap and covers everything _measure
// reads: who is alive, which groups exist, and who is in them.
let _cache = { key: '', blocs: null };

function _signature() {
  const alliances = (gs.namedAlliances || [])
    .filter(a => a.active !== false && !a.dissolved)
    .map(a => `${a.name}:${(a.members || []).join(',')}`).join('|');
  const couples = (gs.showmances || [])
    .filter(sh => sh.phase !== 'broken-up')
    .map(sh => (sh.players || []).join(',')).join('|');
  // Bonds move constantly and feed `loyalty`; the episode number is enough
  // resolution for a read that is only ever used to rank groups.
  return `${(gs.activePlayers || []).join(',')}#${alliances}#${couples}#${gs.episode || 0}`;
}

export function listBlocs() {
  ensure();
  const key = _signature();
  if (_cache.key === key && _cache.blocs) return _cache.blocs;
  const blocs = _buildBlocs();
  _cache = { key, blocs };
  return blocs;
}

function _buildBlocs() {
  const house = live();
  const out = [];

  for (const alliance of gs.namedAlliances || []) {
    if (alliance.active === false || alliance.dissolved) continue;
    const members = (alliance.members || []).filter(name => house.includes(name));
    if (members.length < 2) continue;
    out.push(_measure({
      id: `a:${alliance.name}`, kind: 'alliance', label: alliance.name,
      members, formedWeek: alliance.formedEp || alliance.formed || 0,
    }));
  }

  for (const showmance of gs.showmances || []) {
    if (showmance.phase === 'broken-up') continue;
    const members = (showmance.players || []).filter(name => house.includes(name));
    if (members.length < 2) continue;
    out.push(_measure({
      id: `c:${members.slice().sort().join('+')}`, kind: 'couple',
      label: `${members[0]} and ${members[1]}`,
      members, formedWeek: showmance.sparkEp || 0,
    }));
  }

  return out.sort((a, b) => b.power - a.power);
}

function _measure(bloc) {
  const house = live();
  const pairs = [];
  for (let i = 0; i < bloc.members.length; i++) {
    for (let j = i + 1; j < bloc.members.length; j++) {
      pairs.push(getBond(bloc.members[i], bloc.members[j]));
    }
  }
  // Does it actually hold? A six that dislikes itself is not six votes.
  const warmth = pairs.length ? pairs.reduce((sum, v) => sum + v, 0) / pairs.length : 0;
  const loyalty = clamp(0.35 + warmth / 12, 0.2, 1);
  // A couple is two votes that never come apart — the tightest thing in the
  // house per head, and the reason the format targets them so early.
  const cohesion = bloc.kind === 'couple' ? Math.max(loyalty, 0.85) : loyalty;
  // Votes controlled, as a share of the room. Three of thirteen is noise;
  // three of five is the game.
  const share = house.length ? bloc.members.length / house.length : 0;
  return { ...bloc, warmth, loyalty: cohesion, share, power: share * cohesion * bloc.members.length };
}

export function blocsWith(name) {
  return listBlocs().filter(bloc => bloc.members.includes(name));
}

// ── 1b. who in it is actually staying ─────────────────────────────────
//
// `_measure` answers "does this group hold together", which is a fact about
// the GROUP: average the bonds across every pair and you get a six that likes
// itself or a six that does not. What it cannot tell you is the thing you
// actually want to know watching an alliance — WHICH ONE of them leaves.
//
// A group can measure well and still have one member sitting at the edge of
// it, and that member decides the season. So this is the per-person view: how
// attached is each individual to THIS group, on the evidence that would make
// somebody stay or go.
//
// Four things move it, all proportional and none of them a gate:
//
//   inward     how they feel about these specific people — not the group's
//              average, theirs. A six can average warm and contain one person
//              who cannot stand the other five.
//   the stat   `loyalty` is who they are. It is the difference between two
//              people with identical bonds where one of them still flips.
//   outward    the best relationship they have OUTSIDE the group. Somebody
//              whose closest person in the house is not in the room is not
//              being held by the room.
//   elsewhere  a competing home. Belonging to a stronger second bloc is the
//              most reliable predictor of which way a vote actually lands.
//
// Deliberately NOT wired into `_measure`'s cohesion. That number feeds
// `power`, power feeds targeting and targeting feeds whole seasons; redefining
// it would re-roll every read in the house to make a screen prettier. Both
// figures come off the same bonds, so they agree without being the same
// calculation.
const _mean = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

/**
 * How firmly one member is held by one bloc, 0–10, with the reason.
 *
 * 10 is somebody who would go down with it. 0 is somebody already gone in
 * everything but the announcement.
 */
export function memberLoyalty(name, bloc) {
  const others = (bloc?.members || []).filter(n => n !== name);
  if (!others.length) return { name, loyalty: 5, reason: 'has nobody in here to be loyal to' };

  const inward = _mean(others.map(other => getBond(name, other)));
  const stat = pStats(name).loyalty ?? 5;
  const outsiders = live().filter(n => n !== name && !bloc.members.includes(n));
  const outward = outsiders.length ? Math.max(...outsiders.map(n => getBond(name, n))) : -10;
  // ── A COMPETING HOME IS A COMPARISON, NOT A HEADCOUNT ──
  //
  // This summed the ABSOLUTE power of every other bloc and subtracted 0.16 of
  // it from a score capped at 1.0. But `power` is `share x cohesion x size` —
  // a six in a house of twelve is about 1.8, and it climbs as the house
  // shrinks — so the term was never on the scale the coefficient was written
  // for. Measured over eight seasons: with no other bloc the mean reading is
  // 7.2 and nobody sits at zero; with three, the mean is 0.6 and 75% of
  // members read exactly 0.0; with four, all of them do. Being in more rooms
  // zeroed you even when THIS was the strongest room you were in — and 0.0 is
  // documented above as somebody already gone in everything but the
  // announcement, which is not what a well-connected houseguest is.
  //
  // The reason string this function prints has always said "has a second home
  // that is doing better than this one". That is the right idea and the code
  // never did it. It does now: the strongest rival home, measured against this
  // one, so a member of the best bloc in the house is not punished for also
  // being in a weak side deal.
  const rivals = blocsWith(name).filter(b => b.id !== bloc.id);
  const here = Number(bloc?.power) || 0;
  const rival = rivals.length ? Math.max(...rivals.map(b => Number(b.power) || 0)) : 0;
  // Unmeasured bloc (no power on it) — there is nothing to compare against, so
  // the term stays out rather than dividing by a fallback and inventing one.
  const elsewhere = here > 0 ? clamp((rival - here) / Math.max(here, 0.5), 0, 1) : 0;
  // Belonging to several rooms still dilutes a little, because attention is
  // finite — but it is worth a few tenths, not the whole reading.
  const spread = Math.min(0.12, Math.max(0, rivals.length - 1) * 0.05);

  // A better relationship outside only counts for the amount it BEATS the
  // group by — a well-liked houseguest with friends everywhere is not
  // disloyal, they are just popular.
  const pullAway = Math.max(0, outward - inward);

  const score = clamp(
    0.42
    + inward * 0.045
    + stat * 0.030
    - pullAway * 0.035
    - elsewhere * 0.30
    - spread,
    0, 1);

  // Whichever term is doing the most work, said in words.
  const reason = elsewhere > 0.3
    ? `has a second home that is doing better than this one`
    : pullAway > 3
      ? `is closer to somebody outside this than to anybody in it`
      : inward < 0
        ? `does not actually like these people`
        : stat >= 7 && inward > 2
          ? `would go down with this group`
          : inward > 4
            ? `is held by the room`
            : `is in it for now`;

  return {
    name,
    loyalty: Math.round(score * 100) / 10,
    reason,
    inward: Math.round(inward * 10) / 10,
    outward: Math.round(outward * 10) / 10,
    elsewhere: Math.round(elsewhere * 100) / 100,
  };
}

/**
 * The whole membership of a bloc, sorted firmest-first, with the crack named.
 *
 * `weakest` is the member most likely to leave it — and it is only reported as
 * a CRACK when there is a real gap between them and the next one up. An
 * alliance where everybody is equally committed does not have a weak link just
 * because somebody has to be last in the sort.
 */
export function blocRoster(bloc) {
  const rows = (bloc?.members || []).map(name => memberLoyalty(name, bloc))
    .sort((a, b) => b.loyalty - a.loyalty);
  const weakest = rows[rows.length - 1] || null;
  const nextUp = rows[rows.length - 2] || null;
  // Somebody always sorts last. A crack is not "the lowest number" — it is a
  // member who is actually loose, and a flag that fires on every group tells
  // you nothing. Three rules, all of which have to hold:
  //
  //   - they must be genuinely uncommitted (a 7.4 is not leaving, whatever the
  //     person above them scores). This was reporting "CRACK: Millie — is held
  //     by the room", which contradicts itself in the same sentence.
  //   - the GAP rule needs three or more members. In a pair, one of the two is
  //     always the lower one and a point-and-a-half between them is ordinary.
  //   - a really low number stands on its own, whatever the rest look like.
  const loose = !!weakest && weakest.loyalty <= 5;
  const gapped = !!(nextUp && rows.length >= 3 && nextUp.loyalty - weakest.loyalty >= 1.5);
  const cracking = loose && (weakest.loyalty <= 3.5 || gapped);
  return {
    id: bloc?.id, name: bloc?.name, kind: bloc?.kind,
    members: rows,
    average: Math.round(_mean(rows.map(r => r.loyalty)) * 10) / 10,
    weakest: cracking ? weakest : null,
    cracking,
  };
}

// ── 2. what somebody believes exists ──────────────────────────────────

let _knowVersion = 0;
let _viewCache = new Map();

/**
 * Everything cached off knowledge is now stale.
 *
 * Called from every write, including the ones that do not go through
 * learnAbout. Exposure is exactly that case: it sets the exposed flag first, so
 * learnAbout then reads knowledge as already 1, sees no change, and skips the
 * invalidation — leaving a group that the whole house just watched get named
 * still priced at zero threat for the rest of the week.
 */
function _invalidateKnowledge() {
  _knowVersion++;
  _viewCache = new Map();
}

export function knowledgeOf(observer, blocId) {
  const state = ensure();
  if (state.exposed[blocId]?.everybody) return 1;
  return clamp(Number(state.knowledge[observer]?.[blocId]) || 0, 0, 1);
}

/**
 * Learn something, or fail to.
 *
 * Everything that raises knowledge routes through here so there is exactly one
 * answer to "how did they find out", and the receipt travels with it.
 */
export function learnAbout(observer, bloc, amount, how = 'noticed') {
  if (!observer || !bloc || bloc.members.includes(observer)) return 0;
  const state = ensure();
  const before = knowledgeOf(observer, bloc.id);
  const after = clamp(before + Number(amount || 0), 0, 1);
  (state.knowledge[observer] ||= {})[bloc.id] = after;
  if (after !== before) _invalidateKnowledge();
  if (after > before) {
    (state.knowledge[observer]._how ||= {})[bloc.id] = how;
  }
  return after - before;
}

/**
 * A week of watching the house.
 *
 * Nobody is told anything here. This is what a person picks up by living in the
 * same building: who keeps ending up in the same room, who goes quiet when they
 * walk in. Intuition decides how much of it lands, and a group that has been
 * together for weeks is harder to miss than one formed on Tuesday.
 *
 * Couples are the exception and are visible almost immediately — two people
 * cannot hide it, which is exactly why the format eats them first.
 */
export function observeBlocs({ house = live(), rng = Math.random } = {}) {
  const blocs = listBlocs();
  const learned = [];
  for (const bloc of blocs) {
    for (const observer of house) {
      if (bloc.members.includes(observer)) continue;
      const stats = pStats(observer);
      const sharp = (stats.intuition * 0.6 + stats.social * 0.4) / 10;
      // Bigger groups leak more: more people, more conversations to walk in on.
      const leak = bloc.kind === 'couple' ? 0.15 : 0.02 + bloc.members.length * 0.022;
      // And somebody with a friend inside hears things without being told.
      const insider = bloc.members.some(m => getBond(observer, m) >= 3) ? 1.6 : 1;
      const gain = leak * (0.4 + sharp) * insider * (0.5 + rng());
      const moved = learnAbout(observer, bloc, gain, 'watched them');
      if (moved > 0.02) learned.push({ observer, bloc, gain: moved });
    }
  }
  return learned;
}

/**
 * The vote is the tell nobody can hide.
 *
 * A group can be careful in the kitchen for a month and then put four votes on
 * the same name twice, and the arithmetic does the rest. This is the strongest
 * evidence in the game and the only one that needs no trust in anybody: the
 * house watched it happen.
 */
export function readVoteTells(ballots = [], house = live()) {
  if (!Array.isArray(ballots) || ballots.length < 3) return [];
  const blocs = listBlocs();
  const tells = [];
  for (const bloc of blocs) {
    const cast = bloc.members.map(name => ballots.find(b => b.voter === name)).filter(Boolean);
    if (cast.length < 2) continue;
    const together = cast.every(b => b.evict === cast[0].evict);
    if (!together) {
      // A group that split in public is a group that looks less like one.
      for (const observer of house) {
        if (!bloc.members.includes(observer)) learnAbout(observer, bloc, -0.12, 'they split');
      }
      continue;
    }
    for (const observer of house) {
      if (bloc.members.includes(observer)) continue;
      // Counting votes is a skill. Everybody sees the same tally; not everybody
      // draws the same line through it.
      const sharp = (pStats(observer).intuition * 0.5 + pStats(observer).strategic * 0.5) / 10;
      const gain = (0.12 + cast.length * 0.09) * (0.45 + sharp);
      if (learnAbout(observer, bloc, gain, 'they voted as one') > 0.03) {
        tells.push({ observer, bloc, votes: cast.length });
      }
    }
  }
  return tells;
}

/**
 * Telling somebody, and whether they believe you.
 *
 * This is the part the user asked for and the part most simulations skip. A
 * true thing said by somebody untrusted does not become knowledge; it becomes a
 * reason to wonder what the teller is up to. Belief needs three things and none
 * of them is the truth of the claim: do I trust you, does it match what I had
 * already half-noticed, and are you the sort of person who says things to get
 * something.
 *
 * @returns {{believed:boolean, gain:number, why:string}}
 */
export function tellAbout(teller, listener, bloc) {
  if (!teller || !listener || teller === listener || !bloc) {
    return { believed: false, gain: 0, why: 'nobody to tell' };
  }
  if (bloc.members.includes(listener)) {
    return { believed: false, gain: 0, why: 'they are in it' };
  }
  const trust = getPerceivedBond(listener, teller);
  const prior = knowledgeOf(listener, bloc.id);
  const stats = pStats(listener);
  // A schemer's word is worth less, and everybody knows which houseguests those
  // are by about week three.
  const shady = ['villain', 'mastermind', 'schemer', 'chaos-agent'].includes(archetypeOf(teller));
  // The default answer to a strategic claim is no. In a house where everybody
  // has a reason to want you looking somewhere else, being told something is
  // weak evidence on its own — it has to arrive from somebody worth believing,
  // or land on something already half-seen. Without this floor the layer ran at
  // a 93% belief rate, which is a house of people who take each other at their
  // word, and that is not the game.
  const skepticism = -0.2;
  const credibility = (pStats(teller).social * 0.04) + (shady ? -0.45 : 0.08)
    + clamp(trust, -4, 6) * 0.2;
  // Corroboration does most of the work. Telling somebody what they already
  // suspected is easy; telling them something from nothing is not.
  const corroboration = prior * 0.7;
  // And a suspicious mind resists being handed a conclusion.
  const resistance = (stats.intuition * 0.035) + (stats.loyalty >= 7 && trust < 0 ? 0.3 : 0);
  const score = skepticism + credibility + corroboration - resistance;
  const believed = score > 0.25;

  if (believed) {
    const gain = clamp(0.3 + credibility * 0.4, 0.15, 0.75);
    learnAbout(listener, bloc, gain, `${teller} told them`);
    return { believed: true, gain, why: prior > 0.3 ? 'it matched what they had already seen' : 'they trust the source' };
  }
  return {
    believed: false, gain: 0,
    why: trust < 0 ? 'they do not trust the person saying it'
      : shady ? 'the messenger is the problem'
      : 'it came out of nowhere and sounded like a move',
  };
}

/**
 * Said out loud, in front of everybody.
 *
 * The blowup case. There is no belief check because nobody is relying on a
 * messenger — the house is standing there. This is the version that usually
 * ends a group, and it is deliberately hard to reach: it takes a fight, not a
 * conversation.
 */
export function exposeBloc(bloc, { everybody = true, witnesses = [], week = 0, how = 'blowup' } = {}) {
  if (!bloc) return false;
  const state = ensure();
  if (everybody) {
    state.exposed[bloc.id] = { everybody: true, week, how };
    _invalidateKnowledge();
    for (const observer of live()) {
      if (!bloc.members.includes(observer)) learnAbout(observer, bloc, 1, how);
    }
    return true;
  }
  // The quiet version: whoever was in the room knows, and it spreads from there
  // through the normal telling — with the normal chance of being disbelieved.
  witnesses.filter(w => !bloc.members.includes(w))
    .forEach(w => learnAbout(w, bloc, 0.7, how));
  return true;
}

// ── 3. what they think it is worth ────────────────────────────────────

/**
 * An outsider's read of a bloc's power — never the true number.
 *
 * Scaled by how sure they are it exists, so a secret group is not merely
 * unmentioned, it is genuinely not being priced in by anybody's decisions. That
 * is what "secret groups remain protected until exposed" has to mean if it is
 * going to mean anything.
 */
export function readPower(observer, bloc) {
  const known = knowledgeOf(observer, bloc.id);
  if (known < 0.25) return 0;
  const house = live().length || 1;
  // Only the members this observer has actually connected to the group.
  const visibleMembers = bloc.members.length * clamp(known, 0, 1);
  const share = visibleMembers / house;
  // Do they read it as solid or as a convenience? Their own read of the bonds
  // inside it, not the true ones.
  const seenLoyalty = clamp(0.3 + bloc.warmth / 12, 0.2, 1);
  // A bloc one vote from a majority is a different object from a big one that
  // is not — this is the cliff outsiders actually respond to.
  const majority = share >= 0.5 ? 1.7 : share >= 0.4 ? 1.3 : 1;
  return share * seenLoyalty * bloc.members.length * majority * known;
}

/**
 * How central somebody looks, for the threat model.
 *
 * Replaces `alliances.length * 0.55`. Two things change. Size counts, because
 * being one of six who vote together is not the same as being one of two. And
 * every bloc is weighted by how visible it is, so a houseguest quietly running
 * a secret alliance reads as no more dangerous than anybody else — which is the
 * entire reward for keeping it quiet, and was previously worth nothing.
 */
export function visibleCentrality(name) {
  // bbThreatProfile calls this for every houseguest every time anything asks
  // how dangerous anybody looks, which in a week is thousands of times. Same
  // cache discipline as the per-observer view: house shape plus knowledge
  // version, both of which change rarely compared to how often this is read.
  const key = `vc|${name}|${_signature()}|${_knowVersion}`;
  const hit = _viewCache.get(key);
  if (hit !== undefined) return hit;
  const value = _computeCentrality(name);
  _viewCache.set(key, value);
  return value;
}

function _computeCentrality(name) {
  const house = live();
  const others = house.filter(n => n !== name);
  if (!others.length) return 0;
  let total = 0;
  for (const bloc of blocsWith(name)) {
    // Averaged over everybody who is not in it: a group two people have worked
    // out is not yet a reputation.
    const outsiders = others.filter(n => !bloc.members.includes(n));
    if (!outsiders.length) continue;
    const seen = outsiders.reduce((sum, n) => sum + knowledgeOf(n, bloc.id), 0) / outsiders.length;
    total += bloc.power * seen * 0.9;
  }
  return total;
}

// ── 4. where they would attack ────────────────────────────────────────

/**
 * Which member of a bloc to go after.
 *
 * Not the strongest — the one you can actually get. Three things decide it, and
 * they are the three things people say out loud on the show: who is least
 * protected elsewhere, who nobody would fight to keep, and who hurts the group
 * most if they go. A member sitting in three other alliances is somebody else's
 * problem to remove; the one whose only protection is this group is the one who
 * goes up.
 */
export function pointOfAttack(observer, bloc) {
  const candidates = bloc.members.filter(name => name !== observer);
  if (!candidates.length) return null;
  const scored = candidates.map(name => {
    // Protection from everywhere ELSE. This is the reason a six-person alliance
    // loses its most loosely-connected member first.
    const elsewhere = blocsWith(name).filter(b => b.id !== bloc.id)
      .reduce((sum, b) => sum + b.power, 0);
    const closeness = Math.max(0, getPerceivedBond(observer, name));
    const record = gs.bb?.stats?.[name] || {};
    const wins = (record.hohWins || 0) + (record.vetoWins || 0) + (record.blockBusterWins || 0);
    // Cutting the couple's stronger half is the move that actually breaks it.
    const anchor = bloc.kind === 'couple' ? wins * 0.5 : 0;
    return {
      name,
      score: wins * 0.8 + anchor - elsewhere * 1.4 - closeness * 0.7
        + (pStats(name).social / 10) * 0.6,
      elsewhere, wins, closeness,
    };
  }).sort((a, b) => b.score - a.score);

  const pick = scored[0];
  const why = pick.elsewhere < 0.4
    ? `${pick.name} has nobody outside that group — take ${pick.name} and there is nowhere for the rest to hide it`
    : pick.wins >= 2
      ? `${pick.name} keeps winning, and a competitor inside a bloc is the one who carries it to the end`
      : `${pick.name} is the half of it that can actually be reached`;
  return { target: pick.name, why, ...pick };
}

/**
 * The whole read, start to finish: which group frightens this person most, and
 * what they intend to do about it.
 *
 * Returns null when nobody has worked anything out, which is the correct answer
 * for most of week one and was previously indistinguishable from the layer not
 * existing.
 */
export function chooseBlocTarget(observer, { minPower = 0.9 } = {}) {
  if (!observer) return null;
  const threats = listBlocs()
    .filter(bloc => !bloc.members.includes(observer))
    .map(bloc => ({ bloc, read: readPower(observer, bloc) }))
    .filter(entry => entry.read >= minPower)
    .sort((a, b) => b.read - a.read);
  if (!threats.length) return null;
  const { bloc, read } = threats[0];
  const aim = pointOfAttack(observer, bloc);
  if (!aim) return null;
  return {
    bloc, target: aim.target, read, why: aim.why,
    reason: bloc.kind === 'couple'
      ? `${bloc.label} vote together every week`
      : `${bloc.label} has the numbers`,
  };
}

/** Who else would want this group gone — the recruitment pool. */
export function outsidersTo(bloc, observer) {
  return live().filter(name => name !== observer && !bloc.members.includes(name));
}

/** Has this observer already committed to a plan against this bloc? */
export function hasPlanAgainst(observer, blocId) {
  return !!ensure().plans[`${observer}|${blocId}`];
}

export function recordPlanAgainst(observer, blocId, week = 0) {
  ensure().plans[`${observer}|${blocId}`] = { week };
}

/** For the screens: what does this person think is going on in the house? */
export function knownBlocsFor(observer) {
  // Cached against the house shape and the knowledge version together: every
  // bloc event's weight() calls this once per houseguest, for every beat, and a
  // season runs tens of thousands of beats. Uncached it made the test suite
  // four times slower on its own.
  const key = `${observer}|${_signature()}|${_knowVersion}`;
  const hit = _viewCache.get(key);
  if (hit) return hit;
  const view = listBlocs()
    .filter(bloc => !bloc.members.includes(observer))
    .map(bloc => ({ bloc, known: knowledgeOf(observer, bloc.id), read: readPower(observer, bloc) }))
    .filter(entry => entry.known > 0.15)
    .sort((a, b) => b.read - a.read);
  _viewCache.set(key, view);
  return view;
}

/** For the screens: how exposed is each group, averaged over everybody outside it? */
export function blocExposure(bloc) {
  const outsiders = live().filter(name => !bloc.members.includes(name));
  if (!outsiders.length) return 1;
  const sum = outsiders.reduce((total, name) => total + knowledgeOf(name, bloc.id), 0);
  return sum / outsiders.length;
}
