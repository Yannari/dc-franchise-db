// ══════════════════════════════════════════════════════════════════════
// ci/alliances.js — named alliances and their group chats
// ══════════════════════════════════════════════════════════════════════
//
// User (2026-10-01): "do we even have alliances here, like in the real game?
// alliances were a big part of it"; "they have group chats with the name of
// their alliance". The transcripts: 377 mentions in 77 episodes, from day one
// ("I feel like we can form a real connection and work together in an
// alliance till the end", 1x01), and about one group chat opened an episode.
//
//   forming    a strategic, liked player opens a group chat with the two or
//              three people they trust most and pitches it; whoever trusts
//              them enough joins; the group gets a name
//   belonging  members rate each other up (ratings.js voterScore `alliance`),
//              an Influencer shields their own in the Hangout (hangout.js),
//              and the group checks in: shares what it has heard, and agrees
//              on someone to rate low (`plan`)
//   breaking   an Influencer who blocks one of their own breaks it: a
//              betrayal the rest resent; a group down to one is over
//
// All proportional: who founds, who is asked and who says yes come from the
// stats and the bonds, never a threshold on a stat.
import { rel, bump, S, clamp, addScene } from './state.js';
import { feel } from './mind.js';
import { learn, passOnWeight } from './claims.js';

export const ALLIANCE_PULL = 4;   // how far an ally climbs a member's ballot (x the voter's loyalty)
export const PLAN_PUSH = 3;       // how far an agreed target falls on a member's ballot
export const ALLY_SHIELD = 4;     // an Influencer's reluctance to block their own (hangout.js)
export const FORM_CHANCE = 0.45;  // a day on which somebody tries to start one
export const CHECK_CHANCE = 0.35; // a day on which a standing alliance checks in
export const MAX_GROUPS = 2;      // alliances one player can be in at once

// What players call their alliance (the show's are jokes, puns and in-jokes).
const NAMES = ['The Circle Squad', 'The Inner Circle', 'Team Real', 'The Night Owls', 'The Ride or Dies', 'The Snack Pack',
  'The Day Ones', 'Group Chat Gang', 'The Underdogs', 'The Fam', 'The Triple Threat', 'The Safe House', 'The Pajama Gang',
  'Coffee Club', 'The Truth Squad', 'The Heart Emojis', 'The Real Ones', 'The Dream Team', 'The Brain Trust', 'The Vault'];

export const activeAlliances = state => (state.alliances || []).filter(a => a.status === 'active');
export const alliancesOf = (state, h) => activeAlliances(state).filter(a => a.members.includes(h));
export const allied = (state, x, y) => x !== y && activeAlliances(state).some(a => a.members.includes(x) && a.members.includes(y));
/** The target an alliance of `voter` agreed to rate low, if any, still fresh. */
export function planAgainst(state, voter, target) {
  return activeAlliances(state).some(a => a.members.includes(voter) && a.plan?.target === target && state.day - a.plan.day <= 1);
}

const bond = (state, a, b) => rel(a, b, 'trust') + rel(a, b, 'affection');

/** Somebody may start an alliance today: the group chat that founds it. */
export function formAlliance(state, rng) {
  if (rng() >= FORM_CHANCE) return null;
  const act = state.active;
  if (act.length < 5) return null;
  const options = act.filter(f => alliancesOf(state, f).length < MAX_GROUPS).map(f => {
    const asked = act.filter(o => o !== f && !allied(state, f, o) && alliancesOf(state, o).length < MAX_GROUPS)
      .map(o => [o, bond(state, f, o)]).filter(([, w]) => w > 2).sort((a, b) => b[1] - a[1]).map(([o]) => o);
    const want = (S(state, f, 'strategic') + S(state, f, 'social')) / 20;
    return { f, asked, w: want * (asked.slice(0, 3).reduce((n, o) => n + bond(state, f, o), 0) / 3) * (0.5 + rng()) };
  }).filter(x => x.asked.length >= 2).sort((a, b) => b.w - a.w);
  const pick = options[0];
  if (!pick || pick.w <= 0) return null;
  const { f } = pick;
  const asked = pick.asked.slice(0, rng() < 0.5 ? 2 : 3);
  const accepted = [], declined = [];
  for (const o of asked) {
    const p = clamp(0.25 + bond(state, o, f) / 20 + S(state, o, 'loyalty') / 25 - alliancesOf(state, o).length * 0.2, 0.05, 0.95);
    (rng() < p ? accepted : declined).push(o);
  }
  const used = new Set((state.alliances || []).map(a => a.name));
  const free = NAMES.filter(n => !used.has(n));
  const name = (free.length ? free : NAMES)[Math.floor(rng() * (free.length || NAMES.length))];
  const members = [f, ...accepted];
  const alliance = members.length >= 2 ? { id: `al${(state.alliances || []).length + 1}`, name, members, founder: f, day: state.day, status: 'active', plan: null } : null;
  if (alliance) {
    (state.alliances ||= []).push(alliance);
    for (const a of members) for (const b of members) if (a !== b) { bump(a, b, 'trust', 1); bump(a, b, 'affection', 0.5); }
    for (const h of members) feel(state, h, 'loneliness', -1);
  }
  // Saying no stings a little, and the one who said no knows the group exists.
  for (const o of declined) { bump(f, o, 'trust', -0.6); feel(state, f, 'stress', 0.3); }
  return addScene(state, 'group-chat', [f, ...asked], { name, alliance: alliance?.id || null, formed: !!alliance, accepted, declined }, [f, ...asked]);
}

/** A standing alliance checks in: they share what they've heard and pick a target. */
export function checkIn(state, rng) {
  const due = activeAlliances(state).filter(a => a.day < state.day && a.members.filter(h => state.active.includes(h)).length >= 2);
  const out = [];
  for (const a of due) {
    if (rng() >= CHECK_CHANCE) continue;
    const here = a.members.filter(h => state.active.includes(h));
    const sc = addScene(state, 'group-chat', here, { name: a.name, alliance: a.id, formed: false, shared: [], plan: null }, here);
    // Each passes on the juiciest thing the others haven't heard.
    for (const x of here) {
      const best = state.claims.filter(c => state.know[x]?.[c.id]).map(c => [c, Math.max(...here.filter(y => y !== x).map(y => passOnWeight(state, x, c, y)))])
        .sort((p, q) => q[1] - p[1])[0];
      if (!best || best[1] <= 0) continue;
      for (const y of here) if (y !== x && learn(state, y, best[0], x, sc)) sc.data.shared.push({ by: x, claim: best[0].id });
    }
    // Who do they agree to rate low? The outsider they resent and fear most, together.
    const outsiders = state.active.filter(h => !here.includes(h));
    const target = outsiders.map(t => [t, here.reduce((n, m) => n + rel(m, t, 'resentment') - rel(m, t, 'affection') * 0.3, 0)])
      .sort((p, q) => q[1] - p[1])[0];
    if (target && target[1] > 0) { a.plan = { target: target[0], day: state.day }; sc.data.plan = target[0]; }
    for (const x of here) for (const y of here) if (x !== y) bump(x, y, 'trust', 0.3);
    out.push(sc);
  }
  return out;
}

/** A player is blocked: their alliances lose them; one of their own blocking them is a betrayal. */
export function onBlocked(state, h, by = [], scene = null) {
  const broken = [];
  for (const a of activeAlliances(state).filter(x => x.members.includes(h))) {
    const traitors = by.filter(i => a.members.includes(i));
    a.members = a.members.filter(m => m !== h);
    if (traitors.length) {
      a.status = 'broken'; a.brokenBy = traitors; a.brokenDay = state.day;
      for (const m of a.members) for (const t of traitors) if (m !== t) { bump(m, t, 'resentment', 2); bump(m, t, 'trust', -3); }
      broken.push({ name: a.name, betrayer: traitors[0], members: a.members.filter(m => !traitors.includes(m)) });
    } else if (a.members.length < 2) a.status = 'over';
  }
  if (scene && broken.length) scene.data.betrayed = broken;
  return broken;
}

// ── how an alliance comes apart (user: "make sure breaking the alliance is
// possible, as always in all our alliance systems: treason, overlapping
// alliances, etc.") ───────────────────────────────────────────────────
// Four ways, each a scene: an Influencer blocks one of their own (onBlocked,
// above); a member's ratings look like treason and the group votes them out
// (afterRatings); a member is caught in a second alliance (doubleAgents); a
// member's bonds with the group go cold and they walk (drift).
const group = (state, a) => a.members.filter(h => state.active.includes(h));
function event(state, a, kind, data, also = []) {
  const who = [...new Set([...group(state, a), ...also.filter(h => state.active.includes(h))])];
  (a.history ||= []).push({ day: state.day, kind, ...data });
  return addScene(state, 'group-chat', who, { name: a.name, alliance: a.id, formed: false, event: kind, ...data }, who);
}
function remove(state, a, h) {
  a.members = a.members.filter(m => m !== h);
  if (a.members.length < 2) a.status = 'over';
}

/** After the reveal: did an ally rate me low? Enough of the group thinks so, and they're out. */
export const TREASON_SENSE = 0.9;
export function afterRatings(state, rng, row) {
  if (!row || row.hidden || row.final) return [];
  const n = row.targets.length, out = [];
  for (const a of activeAlliances(state)) {
    const here = group(state, a);
    const doubts = {};
    for (const me of here) {
      const r = row.results.find(x => x.profile === me);
      if (!r || r.place <= n / 2) continue;
      for (const p of here.filter(x => x !== me && row.voters.includes(x))) {
        const chance = clamp((r.place - n / 2) / Math.max(1, n / 2) * S(state, me, 'intuition') / 10 * TREASON_SENSE, 0, 0.9);
        if (rng() >= chance) continue;
        bump(me, p, 'trust', -1.5); bump(me, p, 'resentment', 0.8);
        (doubts[p] ||= []).push(me);
      }
    }
    // The group votes them out when most of the rest doubt them.
    const [traitor, by] = Object.entries(doubts).sort((x, y) => y[1].length - x[1].length)[0] || [];
    if (traitor && by.length > (here.length - 1) / 2) {
      const truly = (row.ballots.find(b => b.voter === traitor)?.order || []).slice(-Math.ceil(n / 2)).some(t => by.includes(t));
      remove(state, a, traitor);
      for (const m of by) bump(traitor, m, 'resentment', 1);
      out.push(event(state, a, 'kick', { kicked: traitor, by, right: truly }, [traitor]));
    }
  }
  return out;
}

/** Somebody in two alliances: one of them finds out. */
export const CAUGHT = 0.08;
export function doubleAgents(state, rng) {
  const out = [];
  for (const h of state.active) {
    const mine = alliancesOf(state, h);
    if (mine.length < 2) continue;
    for (const a of mine) {
      const other = mine.find(x => x !== a);
      const watchers = group(state, a).filter(m => m !== h && !other.members.includes(m));
      const odds = watchers.reduce((s, m) => s + S(state, m, 'intuition') / 10 * CAUGHT, 0);
      if (!watchers.length || rng() >= odds) continue;
      for (const m of watchers) { bump(m, h, 'trust', -2); bump(m, h, 'resentment', 1); }
      // Out, unless they still like them more than they mind it (proportional).
      const stay = watchers.reduce((s, m) => s + clamp((rel(m, h, 'affection') + 2) / 12, 0, 1), 0) / watchers.length;
      const kicked = rng() >= stay;
      if (kicked) remove(state, a, h);
      out.push(event(state, a, 'confront', { agent: h, other: other.name, kicked, by: watchers[0] }, [h]));
      break;
    }
  }
  return out;
}

/** A member whose bonds with the group have gone cold walks away. */
export const DRIFT_AT = 1;
export function drift(state, rng) {
  const out = [];
  for (const a of activeAlliances(state)) {
    for (const h of group(state, a)) {
      const rest = group(state, a).filter(m => m !== h);
      if (!rest.length) continue;
      // Warmth, less the grudges: a member who resents the others is halfway out.
      const warmth = rest.reduce((s, m) => s + (rel(h, m, 'affection') + rel(h, m, 'trust')) / 2 - rel(h, m, 'resentment'), 0) / rest.length;
      // The colder it is, the likelier they go (no line: a slope).
      if (warmth >= DRIFT_AT || rng() >= clamp((DRIFT_AT - warmth) / 2, 0, 0.8)) continue;
      remove(state, a, h);
      for (const m of rest) bump(m, h, 'trust', -1);
      out.push(event(state, a, 'leave', { left: h, to: rest[0] }, [h]));
      break;
    }
  }
  return out;
}
