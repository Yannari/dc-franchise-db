// ══════════════════════════════════════════════════════════════════════
// ss/hidden-groups.js — the ones who started somewhere else
// ══════════════════════════════════════════════════════════════════════
//
// Twist family 1, F1.3 (docs/superpowers/specs/2026-10-28-secret-story-hidden-spaces-design.md). One engine
// for the season signatures where part of the cast does not walk into the house on launch night:
//
//   'secret-box'    S6   three in a tinted cube in the living room; each must find one secret to get out,
//                        and the housemate they expose is nominated;
//   'intruders'     S3   three in a second house through a tunnel; they spy, steal clues, and come in one a
//                        week as "new housemates"; if the house finds the tunnel, the rest come in nominated;
//   'crystal-house' S13  three in a glass house in the garden; every prime the main house votes to rescue one;
//   'hotel'         S10  three in the hotel next door; the house hunts their faces among two hundred portraits,
//                        and whoever it identifies comes in nominated;
//   'yacht'         S14  four on a yacht at the pier; they investigate the house from the deck, and every
//                        secret they get right puts its holder up; they come aboard the house after two weeks.
//
// One rule for everybody hidden (js/ss/hidden.js, the Twin Twist bug class): off the house list (no
// nominations, no competitions, no house life), off the eliminated list, put back at a prime with
// `gs.activePlayers`. Pure: state + ctx; the adapter (js/bb/secret-story.js, js/bb/week.js) moves the lists.

import { addEvidence, secretOf } from './hunt.js';
import { mint } from './kitty.js';

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

/** The variants: their space (a plate), how many, how long at most, and what they are after. */
export const GROUPS = {
  'secret-box': { name: 'The Secret Box', space: 'ss-box-inside', outside: 'ss-box', size: 3, weeks: 3, goal: 'secret', from: 'S6' },
  intruders: { name: 'The Intruders', space: 'ss-intruders', outside: 'ss-tunnel', size: 3, weeks: 3, goal: 'unseen', from: 'S3' },
  'crystal-house': { name: 'The Crystal House', space: 'ss-crystal', outside: 'ss-crystal', size: 3, weeks: 3, goal: 'rescue', from: 'S13' },
  hotel: { name: 'The Hotel of Secrets', space: 'ss-hotel-lobby', outside: 'ss-hotel-gallery', size: 3, weeks: 2, goal: 'identity', from: 'S10' },
  yacht: { name: 'The Yacht of Secrets', space: 'ss-yacht-deck', outside: 'ss-yacht-cabin', size: 4, weeks: 2, goal: 'investigate', from: 'S14' },
};
export const isGroupSignature = id => !!GROUPS[id];

const rulesOf = state => (state.rules ||= { log: [], dOffice: {}, extraVotes: {}, house: {} });
// (one nominee a week from the group's business, at most: the real seasons put one or two up, never the whole space)
const dOffice = (state, wk, n) => {
  const g = state.group;
  if (g) { g.nominated ||= {}; if (g.nominated[wk]) return false; g.nominated[wk] = n; }
  const r = rulesOf(state); (r.dOffice[wk] ||= []).includes(n) || r.dOffice[wk].push(n);
  return true;
};

/**
 * Launch night: who goes to the hidden space instead of the house. The bold and the curious, never a
 * pair who share a secret split between the house and the space. Returns the names, or [].
 */
export function startGroup(state, ctx, { signature = null, house = [] } = {}) {
  const G = GROUPS[signature];
  if (!G || house.length < G.size + 8) return [];
  const rng = ctx.rng || Math.random;
  const S = (n, k) => Number(ctx.stat(n, k)) || 5;
  const pairOf = n => (secretOf(state, n)?.holders || []).filter(h => h !== n);
  const pool = house.slice().sort((a, b) => (S(b, 'boldness') + S(b, 'intuition') + rng() * 6) - (S(a, 'boldness') + S(a, 'intuition') + rng() * 6));
  const members = [];
  for (const n of pool) {
    if (members.length >= G.size) break;
    if (members.includes(n) || pairOf(n).length) continue;
    members.push(n);
  }
  if (members.length < 2) return [];
  state.group = { id: signature, name: G.name, space: G.space, outside: G.outside, goal: G.goal, members, out: [], from: 1, until: 1 + G.weeks,
    found: {}, identified: [], tunnelFound: false, log: [] };
  return members;
}

/** Who is still in the hidden space. */
export const groupHidden = state => (state?.group ? state.group.members.filter(n => !state.group.out.includes(n)) : []);

/**
 * The week in the hidden space, run before the nominations. What they saw, what they tried, who comes in at
 * this week's prime (`entering`, with how), and the nominations it writes. Returns null when nobody is hidden.
 */
export function weekInGroup(state, ctx, { house = [] } = {}) {
  const g = state?.group;
  const hid = groupHidden(state);
  if (!g || !hid.length) return null;
  const rng = ctx.rng || Math.random;
  const wk = ctx.week ?? 0;
  const S = (n, k) => Number(ctx.stat(n, k)) || 5;
  const B = (a, b) => Number(ctx.bond(a, b)) || 0;
  const last = wk >= g.until - 1;
  const watched = [];
  const entering = [];
  /** @type {any[]} */ const events = [];
  // everybody hidden watches the house: theories grow (they see what the house can't)
  for (const n of hid) {
    const t = house.filter(h => secretOf(state, h) && !secretOf(state, h).found).sort(() => rng() - 0.5).slice(0, 2);
    for (const h of t) { const th = addEvidence(state, ctx, n, h, { strength: g.goal === 'secret' || g.goal === 'investigate' ? 0.34 : 0.22, how: g.id }); if (th) watched.push({ who: n, about: h, theory: th.text, right: th.right }); }
  }
  if (g.goal === 'secret' || g.goal === 'investigate') {
    // the Secret Box: a member who has it right calls it from the box, gets out, and the exposed is nominated.
    // The yacht: every secret they get right puts its holder up; they all come aboard at the end.
    for (const n of hid) {
      const best = Object.entries(state.theories?.[n] || {}).filter(([t, th]) => house.includes(t) && th.right && (Number(th.conf) || 0) >= 0.42 && !secretOf(state, t)?.found)
        .sort((a, b) => (b[1].conf || 0) - (a[1].conf || 0))[0];
      if (!best) continue;
      const [t] = best;
      const sec = secretOf(state, t);
      if (g.goal === 'secret') { sec.found = true; sec.foundBy = n; sec.week = wk; mint(state, n, 3000, `found ${t}'s secret from the Secret Box`, wk); entering.push({ name: n, how: 'found', on: t }); }
      g.found[n] = t;
      const up = dOffice(state, wk, t);
      events.push({ kind: 'found', who: n, on: t, text: sec?.text || null, nominated: up });
    }
  } else if (g.goal === 'unseen') {
    // the intruders: one comes in a week; the house may find the tunnel first
    const sharp = house.slice().sort((a, b) => S(b, 'intuition') - S(a, 'intuition'))[0];
    const caught = !!sharp && rng() < clamp(0.08 + S(sharp, 'intuition') * 0.025, 0.05, 0.4);
    if (caught && !g.tunnelFound) {
      g.tunnelFound = true;
      events.push({ kind: 'tunnel', who: sharp });
      const up = hid.slice().sort((a, b) => S(a, 'social') - S(b, 'social'))[0];
      const ok = dOffice(state, wk + 1, up);
      for (const n of hid) entering.push({ name: n, how: 'caught', nominated: ok && n === up });
    } else {
      const next = hid.slice().sort((a, b) => S(b, 'social') - S(a, 'social'))[0];
      if (next) entering.push({ name: next, how: 'swap' });
      // the clue they steal from the house's table, every week
      events.push({ kind: 'steal', who: hid[Math.floor(rng() * hid.length)] });
    }
  } else if (g.goal === 'rescue') {
    // the main house votes on who it lets out of the glass house: the one it likes most
    const score = n => house.reduce((t, h) => t + B(h, n), 0) + rng() * 2;
    const saved = hid.slice().sort((a, b) => score(b) - score(a))[0];
    if (saved) { entering.push({ name: saved, how: 'rescued' }); events.push({ kind: 'rescue', who: saved, votes: Math.round(score(saved)) }); }
  } else if (g.goal === 'identity') {
    // the house hunts the hotel's faces among the portraits; whoever it names comes in nominated
    const hunter = house.slice().sort((a, b) => S(b, 'intuition') - S(a, 'intuition'))[0];
    for (const n of hid) if (!g.identified.includes(n) && rng() < clamp(0.12 + S(hunter, 'intuition') * 0.025, 0.08, 0.45)) { g.identified.push(n); events.push({ kind: 'identified', who: n, by: hunter }); }
  }
  // the end of their time apart: whoever is left comes in, nominated if they failed what they were sent for
  if (last) {
    const rest = hid.filter(n => !entering.some(e => e.name === n));
    for (const n of rest) entering.push({ name: n, how: g.goal === 'secret' || g.goal === 'rescue' ? 'last' : 'end' });
    // the one who did worst comes in nominated: the box's weakest theory, the glass house's least wanted, the hotel's first face found
    const worst = g.goal === 'identity' ? g.identified.find(n => entering.some(e => e.name === n))
      : (g.goal === 'secret' || g.goal === 'rescue') ? rest.slice().sort((a, b) => S(a, 'intuition') - S(b, 'intuition'))[0] : null;
    if (worst && dOffice(state, wk + 1, worst)) for (const e of entering) if (e.name === worst) e.nominated = true;
  }
  g.log.push({ week: wk, entering: entering.map(e => e.name), events });
  return { id: g.id, name: g.name, space: g.space, outside: g.outside, goal: g.goal, hidden: hid, watched: watched.slice(0, 4), events, entering, last };
}

/**
 * The prime: those who come in walk into the house. Marks them out of the space; the adapter adds them to
 * `gs.activePlayers`. Returns [{ name, how }].
 */
export function enterFromGroup(state, entering = []) {
  const g = state?.group;
  if (!g) return [];
  const out = [];
  for (const e of entering) if (g.members.includes(e.name) && !g.out.includes(e.name)) { g.out.push(e.name); out.push(e); }
  return out;
}
