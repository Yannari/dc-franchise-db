// ══════════════════════════════════════════════════════════════════════
// social-status.js — dynamic camp hierarchy (#8).
//
// Status is NOT a stat. It is a changing set of ROLES each contestant occupies,
// derived from observable behavior in the systems we already built (bonds,
// relationship dimensions, alliances, intentions, knowledge, camp work,
// challenges, showmances). Two layers:
//   1. OBJECTIVE evidence — what the game can see a player actually doing.
//   2. PERCEIVED status — what each observer believes, gated by what they could
//      plausibly know. Public roles spread fast; hidden strategic roles do not.
//
// Roles develop gradually: evidence decays and hysteresis holds a role until it
// clearly lapses, so nobody flips role weekly. Each episode is snapshotted and
// FROZEN before it can influence the next (no circular feedback).
//
// SELF-CONTAINED: reads stable APIs, writes only gs.socialStatus /
// gs.socialPerception. Consumers (camp access, pitches, alliances, relationship
// events, surfacing) read the frozen snapshot — they never recompute it.
// ══════════════════════════════════════════════════════════════════════
import { gs, players } from './core.js';
import { getBond } from './bonds.js';
import { getRelationshipDimensions } from './relationships.js';
import { getIntentions } from './intentions.js';

export const SOCIAL_ROLES = [
  'social-center', 'information-broker', 'provider', 'challenge-leader', 'outsider',
  'shield', 'goat', 'swing-vote', 'trusted-lieutenant', 'irritating-but-useful', 'power-couple',
];
// Public roles are visible from camp/challenges and spread widely; hidden roles
// are strategic reads only some observers can make.
const HIDDEN_ROLES = new Set(['information-broker', 'shield', 'goat', 'swing-vote', 'trusted-lieutenant']);
// Softer audience-facing labels; the raw id stays internal / in Debug.
export const ROLE_PUBLIC_LABEL = {
  'social-center': 'social hub', 'information-broker': 'information broker', 'provider': 'camp provider',
  'challenge-leader': 'challenge threat', 'outsider': 'on the outs', 'shield': 'a shield',
  'goat': 'endgame passenger', 'swing-vote': 'the swing', 'trusted-lieutenant': 'trusted lieutenant',
  'irritating-but-useful': 'abrasive but useful', 'power-couple': 'half of a power pair',
};
// Hysteresis: cross ENTER to gain a role, fall below EXIT to lose it.
const ENTER = 6, EXIT = 4;

const clamp10 = n => Math.max(0, Math.min(10, n));
const r1 = n => Math.round(n * 10) / 10;
function statsOf(n) { return players.find(p => p.name === n)?.stats || {}; }
function archOf(n) { return players.find(p => p.name === n)?.archetype || ''; }
function activeCast() { return gs.activePlayers || players.map(p => p.name); }
export function socialGroupFor(name, active = activeCast()) {
  if (gs.isMerged) return [...active];
  const tribe = (gs.tribes || []).find(t => (t.members || []).includes(name));
  return (tribe?.members || []).filter(n => active.includes(n));
}
export function sharesSocialCamp(a, b) {
  if (!a || !b || a === b) return false;
  if (gs.isMerged) return activeCast().includes(a) && activeCast().includes(b);
  return (gs.tribes || []).some(t => (t.members || []).includes(a) && (t.members || []).includes(b));
}
function threatProxy(n) { const s = statsOf(n); return (s.strategic || 5) * 0.42 + (s.social || 5) * 0.3 + Math.max(s.physical || 5, s.endurance || 5) * 0.18 + (s.boldness || 5) * 0.1; }
function activeAlliances() { return (gs.namedAlliances || []).filter(a => a.active !== false && Array.isArray(a.members)); }
function alliancesOf(n) { return activeAlliances().filter(a => a.members.includes(n)); }
// Blocs a player can plausibly reach: alliances they're in, or where they hold a
// positive bond with a member.
function reachableBlocs(n) {
  return activeAlliances().filter(a => a.members.includes(n) || a.members.some(m => m !== n && getBond(n, m) >= 2));
}

// ── Objective evidence per role (0..10) from what the game can observe ──
export function computeEvidence(name, active = null) {
  const peers = active ? active.filter(p => p !== name) : socialGroupFor(name);
  if (!peers.length) return {};
  const s = statsOf(name);
  const arch = archOf(name);
  const myAlliances = alliancesOf(name);
  const threat = threatProxy(name);
  const facts = Object.values(gs.knowledge || {});
  const ev = {};

  // Social center — liked by many, connected, wide alliance reach.
  const posBonds = peers.filter(p => getBond(name, p) >= 2).length;
  const incomingAffection = peers.reduce((a, p) => a + Math.max(0, getRelationshipDimensions(p, name).affection || 0), 0) / peers.length;
  ev['social-center'] = clamp10((posBonds / peers.length) * 6 + Math.min(2.4, myAlliances.length * 0.9) + Math.min(2, incomingAffection * 0.3));

  // Information broker — holds rare knowledge and is the source others cite.
  let unique = 0, sourced = 0;
  facts.forEach(f => {
    const bs = f.beliefs || {};
    const mine = bs[name];
    if (mine && Number(mine.confidence || 0) >= 0.4) {
      const others = Object.keys(bs).filter(k => k !== name && Number(bs[k]?.confidence || 0) >= 0.4).length;
      if (others <= 2) unique++;
    }
    sourced += Object.values(bs).filter(b => b?.source === name).length;
  });
  ev['information-broker'] = clamp10(Math.min(6, unique * 1.1) + Math.min(4, sourced * 0.5));

  // Provider — camp work over the season.
  const cutoff = Math.max(1, (gs.episode || 0) - 4);
  const recentProvider = Array.isArray(gs.providerEpisodes?.[name])
    ? gs.providerEpisodes[name].filter(e => e >= cutoff).length
    : Math.min(5, gs.providerHistory?.[name] || 0); // migration/tests only
  ev['provider'] = clamp10(recentProvider * 2);

  // Challenge leader — recent individual immunity + overall wins.
  const recentImm = (gs.episodeHistory || []).slice(-4).filter(e => e.immunityWinner === name).length;
  const wins = Number(gs.chalRecord?.[name]?.wins || 0);
  ev['challenge-leader'] = clamp10(recentImm * 3 + Math.min(4, wins * 0.8));

  // Outsider — no alliance coverage, few bonds, and a target on their back.
  const targetedBy = activeAlliances().filter(a => a.target === name).length;
  ev['outsider'] = clamp10((myAlliances.length === 0 ? 5 : 0) + (posBonds <= 1 ? 3 : 0) + Math.min(3, targetedBy * 1.5));

  // Shield — a real threat that at least one player's plan keeps ahead of them.
  const shieldedByCount = peers.filter(p => getIntentions(p)?.shield === name).length;
  ev['shield'] = shieldedByCount ? clamp10(3.5 + threat * 0.5 + shieldedByCount) : 0;

  // Goat — repeatedly named as an endgame passenger, low danger.
  const draggedBy = peers.filter(p => getIntentions(p)?.goat === name).length;
  ev['goat'] = draggedBy ? clamp10(draggedBy * 2.6 + Math.max(0, 6 - threat)) : 0;

  // Swing vote — sits between competing blocs with independence to choose.
  const currentPlans = (gs._socialVotePlans || []).filter(plan => plan?.target && Array.isArray(plan.members));
  const reachablePlans = currentPlans.filter(plan => plan.members.some(m => m === name || getBond(name, m) >= 2));
  const distinctTargets = new Set(reachablePlans.map(plan => plan.target)).size;
  const blocs = reachableBlocs(name).filter(a => a.members.some(m => peers.includes(m))).length;
  const independence = (10 - (s.loyalty || 5)) * 0.28;
  ev['swing-vote'] = distinctTargets >= 2
    ? clamp10(4 + Math.min(3, reachablePlans.length) + independence)
    : (blocs >= 2 && myAlliances.length <= 1 ? clamp10(2 + blocs * 0.7 + independence) : 0);

  // Trusted lieutenant — a reliable #2 to a higher-reach ally in the same bloc.
  let lt = 0;
  myAlliances.forEach(a => {
    const lead = a.members.filter(m => m !== name)
      .sort((x, y) => (alliancesOf(y).length + threatProxy(y)) - (alliancesOf(x).length + threatProxy(x)))[0];
    if (!lead) return;
    const d = getRelationshipDimensions(name, lead);
    if ((d.trust || 0) >= 5 && threatProxy(lead) >= threat) {
      lt = Math.max(lt, 3 + (d.trust || 0) * 0.4 + (d.obligation || 0) * 0.3);
    }
  });
  ev['trusted-lieutenant'] = clamp10(lt);

  // Irritating but useful — resented by the room yet demonstrably valuable.
  const incomingResent = peers.reduce((a, p) => a + (getRelationshipDimensions(p, name).resentment || 0), 0) / peers.length;
  const value = Math.max(ev['provider'], ev['challenge-leader'], ev['information-broker'], (s.strategic || 5));
  ev['irritating-but-useful'] = incomingResent >= 3 ? clamp10(Math.min(6, incomingResent * 1.2) + Math.min(4, value * 0.4)) : 0;

  // Power couple — an unbroken showmance whose combined reach is consequential.
  const sm = (gs.showmances || []).find(m => !m.broken && m.phase !== 'broken-up'
    && Array.isArray(m.players) && m.players.includes(name) && m.players.every(p => active.includes(p)));
  if (sm) {
    const partner = sm.players.find(p => p !== name);
    const combined = ((s.social || 5) + (statsOf(partner).social || 5) + (s.strategic || 5) + (statsOf(partner).strategic || 5)) / 4;
    ev['power-couple'] = clamp10(3 + combined * 0.6 + Math.min(2, (alliancesOf(name).length + alliancesOf(partner).length) * 0.5));
  } else ev['power-couple'] = 0;

  // Villain/schemer archetypes lean broker; social archetypes lean center — a
  // gentle nudge, never a guarantee.
  if ((arch === 'social-butterfly' || arch === 'showmancer') && ev['social-center'] > 0) ev['social-center'] = clamp10(ev['social-center'] + 0.6);
  if ((arch === 'mastermind' || arch === 'schemer') && ev['information-broker'] > 0) ev['information-broker'] = clamp10(ev['information-broker'] + 0.6);
  return ev;
}

// ── Perception: who believes which roles, gated by what they could know ──
function updatePerception(active) {
  if (!gs.socialPerception) gs.socialPerception = {};
  const per = gs.socialPerception;
  active.forEach(observer => {
    const view = per[observer] || (per[observer] = {});
    active.forEach(subject => {
      if (subject === observer) return;
      const roles = gs.socialStatus[subject] || {};
      const sv = view[subject] || (view[subject] = {});
      if (!sharesSocialCamp(observer, subject)) {
        SOCIAL_ROLES.forEach(role => { sv[role] = Math.max(0, (sv[role] || 0) - 0.1); });
        return;
      }
      const sharesBloc = reachableBlocs(observer).some(b => b.members.includes(subject));
      const oS = statsOf(observer);
      const sharp = ((oS.intuition || 5) + (oS.strategic || 5)) / 2;
      SOCIAL_ROLES.forEach(role => {
        const active2 = roles[role]?.active;
        // How readable is this role to THIS observer right now?
        let gain = 0;
        if (active2) {
          if (!HIDDEN_ROLES.has(role)) gain = 0.4;                          // public: spreads fast
          else if (sharesBloc) gain = 0.28;                                 // hidden: allies see it
          else if (sharp >= 7 && getBond(observer, subject) >= 1) gain = 0.15; // sharp, close reads
        }
        const prev = sv[role] || 0;
        sv[role] = active2 ? Math.min(0.95, prev + gain) : Math.max(0, prev - 0.25); // fades when role lapses
      });
    });
  });
}

// ── Orchestrator: called once per episode, then FROZEN via the ep snapshot ──
export function updateSocialStatus(ep) {
  const active = activeCast();
  if (active.length < 2) return null;
  if (!gs.socialStatus) gs.socialStatus = {};
  const store = gs.socialStatus;
  active.forEach(name => {
    const fresh = computeEvidence(name, socialGroupFor(name, active));
    const prev = store[name] || {};
    const next = {};
    SOCIAL_ROLES.forEach(role => {
      const pv = prev[role]?.score || 0;
      // History decays; fresh evidence blends in (roles build/fade over episodes).
      const score = clamp10(pv * 0.5 + (fresh[role] || 0) * 0.65);
      const wasActive = prev[role]?.active || false;
      next[role] = { score: r1(score), active: wasActive ? score >= EXIT : score >= ENTER };
    });
    store[name] = next;
  });
  Object.keys(store).forEach(n => { if (!active.includes(n)) delete store[n]; });
  updatePerception(active);
  // Freeze this episode's status/perception onto the ep — consumers next episode
  // read the snapshot, never the live recompute.
  if (ep) {
    ep.socialStatusPostVoteSnapshot = JSON.parse(JSON.stringify(store));
    ep.socialPerceptionPostVoteSnapshot = JSON.parse(JSON.stringify(gs.socialPerception || {}));
    if (!ep.socialStatusSnapshot) ep.socialStatusSnapshot = ep.socialStatusPostVoteSnapshot;
    if (!ep.socialPerceptionSnapshot) ep.socialPerceptionSnapshot = ep.socialPerceptionPostVoteSnapshot;
  }
  return store;
}

// ── Read API (consumers use these, never the internals) ──
// Objective roles a player currently holds (hysteresis-active).
export function socialRoles(name) {
  const roles = gs.socialStatus?.[name] || {};
  return SOCIAL_ROLES.filter(r => roles[r]?.active);
}
export function hasSocialRole(name, role) { return Boolean(gs.socialStatus?.[name]?.[role]?.active); }
export function socialRoleScore(name, role) { return Number(gs.socialStatus?.[name]?.[role]?.score || 0); }
// Publicly-legible roles only (for the normal VP / story view).
export function publicRoles(name) { return socialRoles(name).filter(r => !HIDDEN_ROLES.has(r)); }
// What an observer BELIEVES about a subject (>= confidence threshold).
export function perceivedRoles(observer, subject, minConf = 0.4) {
  const v = gs.socialPerception?.[observer]?.[subject] || {};
  return SOCIAL_ROLES.filter(r => (v[r] || 0) >= minConf);
}
export function resetSocialStatus() { gs.socialStatus = {}; gs.socialPerception = {}; }
export function captureSocialStatusBeforeVote(ep) {
  if (!ep) return;
  ep.socialStatusPreVoteSnapshot = JSON.parse(JSON.stringify(gs.socialStatus || {}));
  ep.socialPerceptionPreVoteSnapshot = JSON.parse(JSON.stringify(gs.socialPerception || {}));
  ep.socialStatusSnapshot = ep.socialStatusPreVoteSnapshot;
  ep.socialPerceptionSnapshot = ep.socialPerceptionPreVoteSnapshot;
}

// ── Surfacing helpers (text backlog / VP / debug read these off a snapshot) ──
export const isHiddenRole = r => HIDDEN_ROLES.has(r);
export function roleLabel(r) { return ROLE_PUBLIC_LABEL[r] || r; }
// The roles a player holds in a given (frozen) snapshot, split public/hidden.
export function standingFromSnapshot(rolesObj = {}) {
  const held = SOCIAL_ROLES.filter(r => rolesObj?.[r]?.active);
  return {
    public: held.filter(r => !HIDDEN_ROLES.has(r)),
    hidden: held.filter(r => HIDDEN_ROLES.has(r)),
    top: held.slice().sort((a, b) => (rolesObj[b]?.score || 0) - (rolesObj[a]?.score || 0))[0] || null,
    scores: Object.fromEntries(SOCIAL_ROLES.map(r => [r, r1(rolesObj?.[r]?.score || 0)])),
  };
}
// What changed between two frozen snapshots — the "recent movement" beats.
export function standingMovement(curSnap = {}, prevSnap = {}) {
  const moves = [];
  Object.keys(curSnap || {}).forEach(name => {
    const cur = new Set(SOCIAL_ROLES.filter(r => curSnap[name]?.[r]?.active));
    const prev = new Set(SOCIAL_ROLES.filter(r => prevSnap?.[name]?.[r]?.active));
    const gained = [...cur].filter(r => !prev.has(r));
    const lost = [...prev].filter(r => !cur.has(r));
    if (gained.length || lost.length) moves.push({ name, gained, lost });
  });
  return moves;
}
