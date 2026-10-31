// ══════════════════════════════════════════════════════════════════════
// pm/reunion.js — the reunion: what happened since the villa, and the show
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-31: "we need a better reunion, 16 clicks is absolutely
// nothing. I need well written, at least 80 frames covering the whole season:
// drama, romance, are they still together, what happened, are you still
// friends, run by Dior the host. Every player has a dialogue, but the most
// important islanders have more screen time."
//
// Two steps, in this order, the way every scene in this show is made:
//   1. DECIDED. The weeks between the final and the studio happen first
//      (`aftermath`): every couple who left the villa together stays together,
//      gets more serious, or splits (who ended it and why); every feud is made
//      up, still going or worse; every friendship is closer, the same or has
//      drifted; every villa ex is friends, awkward, still hurt or still angry.
//      Each one moves the bond it is about, and the record goes on the row
//      (`row.pm.reunion`) so the export, the wiki and the life after the show
//      all agree with what was said in the studio.
//   2. WRITTEN. The segments are cast from that record and from the season
//      (`segments`), ranked by how much of the season each islander carried,
//      and every islander is put somewhere they speak at least twice.
//
// Proportional, never a threshold, for every outcome (CLAUDE.md): a chance
// that slides with the feeling, drawn on the reunion's own dice.

import { addBond, getBond } from '../bonds.js';
import { romance, friendship } from './feelings.js';
import { broken, splitRecords } from './just-friends.js';
import { streamFor } from '../dr/rng.js';
import { labelFor } from './ledger.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const key = (a, b) => [a, b].sort().join('|');
function weighted(rng, pairs) {
  const total = pairs.reduce((t, [, w]) => t + Math.max(0, w), 0);
  if (total <= 0) return pairs[0]?.[0] ?? null;
  let r = rng() * total;
  for (const [v, w] of pairs) { r -= Math.max(0, w); if (r <= 0) return v; }
  return pairs[pairs.length - 1][0];
}
const stat = (state, n, k) => state.profiles[n]?.stats?.[k] ?? 5;
const both = (a, b) => (romance(a, b) + romance(b, a)) / 2;

// ── who carried the season ──────────────────────────────────────────────
/** How much of the season each islander carried: the scenes they led, their major moments, how far they got. */
export function importance(state) {
  const score = {};
  for (const n of Object.keys(state.profiles)) score[n] = 0;
  for (const e of state.history || []) {
    if (!e.aired) continue;
    for (const n of (e.players || []).slice(0, 3)) if (n in score) score[n] += 1;
    for (const n of e.major || []) if (n in score) score[n] += 3;
  }
  for (const c of state.couples || []) for (const n of c) if (n in score) score[n] += 25;
  for (const n of state.winnersCouple || []) if (n in score) score[n] += 25;
  return score;
}

// ── 1. what happened since the villa ────────────────────────────────────
/**
 * The couples who left together: every couple at the final, and every couple
 * dumped as a couple on the same night (and not split before they went).
 */
function leftTogether(state) {
  const out = [];
  const seen = new Set();
  const add = (a, b, where) => { const k = key(a, b); if (!seen.has(k)) { seen.add(k); out.push({ a, b, where }); } };
  for (const [a, b] of state.couples || []) add(a, b, 'final');
  // Dumped on the same night, paired when they went, and never back in: they left as a couple.
  // (Not a goodbye scene: that is the one who left and whoever saw them off.)
  const last = {};
  for (const g of state.gone || []) last[g.name] = g.ep;
  const stayed = new Set(state.villa || []);
  const byNight = {};
  for (const [n, ep] of Object.entries(last)) if (!stayed.has(n)) (byNight[ep] ||= []).push(n);
  for (const [ep, ns] of Object.entries(byNight)) for (let i = 0; i < ns.length; i++) for (let j = i + 1; j < ns.length; j++) {
    const [a, b] = [ns[i], ns[j]];
    const paired = state.pairedEver?.[key(a, b)];
    if (paired != null && paired >= Number(ep) - 1 && !broken(state, a, b) && !out.some(c => [c.a, c.b].includes(a) || [c.a, c.b].includes(b))) add(a, b, 'left');
  }
  return out;
}

/** Scandals the reunion is about to air, by the pair they hurt: they come out tonight and cost the couple. */
function exposedPairs(clips) {
  const hurt = new Set();
  for (const c of clips) if (c.partner && c.who) hurt.add(key(c.who, c.partner));
  return hurt;
}

/**
 * Decide the weeks since the final. `clips` are the hidden scenes the reunion
 * will air ({ who, with, partner }). Returns the record; moves the bonds.
 */
export function aftermath(state, clips = []) {
  const rng = streamFor(state.seed ?? 1, `reunion:${state.epSalt || ''}`);
  const exposed = exposedPairs(clips);
  const winners = state.winnersCouple || [];
  const env = state.envelope || null;
  const couples = leftTogether(state).map(({ a, b, where }) => {
    const r = both(a, b);
    const won = winners.includes(a) && winners.includes(b);
    // Two friends at the final are friends, not a couple to split (just-friends.js).
    if (broken(state, a, b)) return { a, b, where, won, fate: 'friends', ender: null, why: null };
    // The prize kept by one of them ends it, whatever they felt (pm/public-vote.js splitOrSteal).
    if (won && env?.choice === 'steal') {
      const holder = env.holder;
      return { a: holder, b: holder === a ? b : a, where, won, fate: 'split', ender: holder, why: 'money' };
    }
    const scandal = exposed.has(key(a, b));
    const pSplit = clamp(0.62 - 0.06 * r - (won ? 0.06 : 0) + (where === 'left' ? 0.1 : 0) + (scandal ? 0.3 : 0), 0.06, 0.85);
    if (rng() < pSplit) {
      // The one who felt less ends it, more often than not.
      const ender = weighted(rng, [[a, 11 - romance(a, b)], [b, 11 - romance(b, a)]]);
      const why = scandal ? 'trust' : weighted(rng, [['faded', 11 - r], ['distance', 3], ['different', 2]]);
      return { a: ender, b: ender === a ? b : a, where, won, fate: 'split', ender, why };
    }
    const pMore = clamp((r - 4) * 0.12, 0.02, 0.7);
    return { a, b, where, won, fate: rng() < pMore ? 'stronger' : 'together', ender: null, why: null };
  });
  for (const c of couples) addBond(c.a, c.b, c.fate === 'split' ? (c.why === 'money' || c.why === 'trust' ? -4 : -2) : c.fate === 'stronger' ? 1.5 : 0.5);

  // The feuds: the pairs who fought the most and like each other least.
  const fights = {};
  for (const e of state.history || []) {
    if (!/^(enemy-|feud-|grudge-|rival-row|blowup|argument|camp-clash|told-confront|jealous-confront)/.test(e.kind)) continue;
    const [a, b] = e.players || [];
    if (!a || !b || a === b) continue;
    const k = key(a, b);
    const f = (fights[k] ||= { a, b, n: 0, aired: 0, grudge: null });
    f.n += 1;
    if (e.aired) f.aired += 1;
    // The grudge is held by the scene's {a}: they face the one it is against.
    if (e.extra?.grudge) { f.grudge = e.extra.grudge; f.holder = a; }
  }
  // A couple's fights are the couple's story (and an ex's are the exes'), not a feud.
  const together = new Set([...couples.map(c => key(c.a, c.b)), ...splitRecords(state).map(r => key(r.by, r.left))]);
  const feuds = Object.values(fights)
    .filter(f => getBond(f.a, f.b) < 0 && f.aired >= 1 && !together.has(key(f.a, f.b)))
    .map(f => ({ ...f, heat: f.n + f.aired - getBond(f.a, f.b) }))
    .sort((x, y) => y.heat - x.heat).slice(0, 4)
    .map(f => {
      const calm = (stat(state, f.a, 'temperament') + stat(state, f.b, 'temperament')) / 2;
      const pMade = clamp(0.25 + (calm - 5) * 0.07 + (getBond(f.a, f.b) + 10) / 60, 0.05, 0.7);
      const pWorse = clamp(0.12 + (5 - calm) * 0.03, 0.04, 0.3);
      const now = weighted(rng, [['made-up', pMade], ['worse', pWorse], ['still', 1 - pMade - pWorse]]);
      addBond(f.a, f.b, now === 'made-up' ? 4 : now === 'worse' ? -2 : 0);
      const [a, b] = f.holder === f.b ? [f.b, f.a] : [f.a, f.b];
      return { a, b, grudge: f.grudge || 'clash', now, heat: f.heat };
    });

  // The friendships: the strongest that were never a romance.
  const names = Object.keys(state.profiles);
  const pairs = [];
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
    const a = names[i], b = names[j];
    const fr = (friendship(a, b) + friendship(b, a)) / 2;
    if (fr < 4 || both(a, b) >= 3) continue;
    if (feuds.some(f => key(f.a, f.b) === key(a, b))) continue;
    pairs.push({ a, b, fr });
  }
  const used = new Set();
  const friends = pairs.sort((x, y) => y.fr - x.fr).filter(p => {
    if (used.has(p.a) || used.has(p.b)) return false;
    used.add(p.a); used.add(p.b); return true;
  }).slice(0, 4).map(p => {
    const pCloser = clamp(0.3 + (p.fr - 5) * 0.05, 0.1, 0.6);
    const now = weighted(rng, [['closer', pCloser], ['drifted', 0.16], ['same', 1 - pCloser - 0.16]]);
    addBond(p.a, p.b, now === 'closer' ? 1.5 : now === 'drifted' ? -2 : 0.3);
    return { a: p.a, b: p.b, now };
  });

  // The villa's exes: every break-up that stands, as it is now.
  const exes = splitRecords(state).filter(r => r.by && r.left).map(r => {
    const now = r.mood === 'friends' ? weighted(rng, [['friends', 0.8], ['awkward', 0.2]])
      : r.mood === 'hurt' ? weighted(rng, [['hurt', 0.45], ['friends', 0.35], ['awkward', 0.2]])
        : weighted(rng, [['still', 0.6], ['awkward', 0.3], ['friends', 0.1]]);
    addBond(r.by, r.left, now === 'friends' ? 1 : now === 'still' ? -1 : 0);
    return { a: r.by, b: r.left, cause: r.cause, now, ep: r.ep };
  });

  return { couples, feuds, friends, exes };
}

// ── 2. the show ────────────────────────────────────────────────────────
// The clips a partner answers (talk/reunion.js ru-clip), by what the clip was.
const CLIP_TALK = { pull: 'pull', said: 'said', promise: 'promise', 'head-turned': 'head-turned', kiss: 'kiss', 'challenge-kiss': 'kiss', bed: 'bed' };

/**
 * The segments, in running order, as [kind, players, extra]. `clips` are the
 * hidden scenes (moments.js picks them) with who is in each; they air in the
 * unseen-footage segment, each followed by the partner having their say.
 */
export function segments(state, after, clips = []) {
  const imp = importance(state);
  const rank = n => imp[n] ?? 0;
  const pairRank = (a, b) => rank(a) + rank(b);
  const cast = Object.keys(state.profiles);
  const spoken = Object.fromEntries(cast.map(n => [n, 0]));
  const out = [];
  // Who is sure to speak in a scene: a clip is footage, and the third in a clip's answer or at Casa may only listen.
  const SURE = { reveal: 0, 'ru-clip': 2, 'ru-casa': 2 };
  const push = (kind, players, extra = {}) => {
    out.push([kind, players, extra]);
    for (const n of players.slice(0, SURE[kind] ?? players.length)) if (n in spoken) spoken[n] += 1;
  };
  const winners = state.winnersCouple || [];
  const isWin = c => winners.includes(c.a) && winners.includes(c.b);

  push('ru-open', [], { of: after.couples.some(c => c.fate === 'split') ? 'splits' : 'plain' });

  // The winners first: how life is since the final.
  const win = after.couples.find(isWin);
  if (win) push('ru-winners', [win.a, win.b], { fate: win.fate, why: win.why, envelope: state.envelope?.choice || null });

  // The first ones out: the earliest two who didn't come back.
  const back = new Set(state.villa || []);
  // By the night they left for GOOD: somebody dumped early who came back and left later is not first out.
  const lastOut = {};
  for (const g of state.gone || []) lastOut[g.name] = g.ep;
  const leftAsCouple = new Set(after.couples.filter(c => c.where === 'left').flatMap(c => [c.a, c.b]));
  const firstOut = Object.keys(lastOut).filter(n => !back.has(n) && !leftAsCouple.has(n)).sort((x, y) => lastOut[x] - lastOut[y]);
  if (firstOut.length >= 2) push('ru-firstout', firstOut.slice(0, 2));

  // Every other couple who left together, finalists by how far they got.
  const place = {};
  const shares = state.finalShares || [];
  [...shares].sort((x, y) => (y.share || 0) - (x.share || 0)).forEach((s, i) => { for (const n of s.couple || []) place[n] = i + 1; });
  for (const c of after.couples.filter(c => !isWin(c)).sort((x, y) => (place[x.a] ?? 9) - (place[y.a] ?? 9) || pairRank(y.a, y.b) - pairRank(x.a, x.b))) {
    push('ru-couple', [c.a, c.b], { fate: c.fate, why: c.why, place: c.where === 'final' ? 'final' : 'left' });
  }

  // How the public saw them: the season's biggest names, one by one, by the label the
  // country gave them (pm/ledger.js). The most screen time goes to who carried the season.
  const seat = [...cast].sort((x, y) => rank(y) - rank(x)).slice(0, 5);
  if (seat.length) push('ru-host', [], { of: 'public' });
  for (const n of seat) push('ru-public', [n], { label: labelFor(state.ledger?.approval?.[n] ?? 0) });

  // The steals: the one who lost their partner, the one who took them, and the partner.
  const steals = [];
  for (const e of state.history || []) {
    if (!e.aired) continue;
    let s = null;
    if (e.kind === 'recouple-pick' && e.extra?.stole) s = { lost: e.players[2] || e.extra.stole, took: e.players[0], partner: e.players[1] };
    if (e.kind === 'steal') s = { lost: e.players[2], took: e.players[0], partner: e.players[1] };
    if (s && s.lost && s.took && s.partner && new Set([s.lost, s.took, s.partner]).size === 3) steals.push(s);
  }
  const lasted = (x, y) => (state.couples || []).some(c => c.includes(x) && c.includes(y));
  const nowOf = (a, b) => { const g = getBond(a, b); return g >= 2 ? 'over' : g <= -3 ? 'cold' : 'hurt'; };
  const stealsShown = steals.sort((x, y) => (rank(y.lost) + rank(y.took)) - (rank(x.lost) + rank(x.took)))
    .filter((s, i, all) => all.findIndex(t => key(t.lost, t.took) === key(s.lost, s.took)) === i).slice(0, 2);
  if (stealsShown.length) push('ru-host', [], { of: 'recouplings' });
  for (const s of stealsShown) push('ru-steal', [s.lost, s.took, s.partner], { now: nowOf(s.lost, s.took), lasted: lasted(s.took, s.partner) });

  // Casa Amor: who brought somebody back, and the one who waited.
  const casa = (state.history || []).filter(e => e.kind === 'casa-return' && e.aired && e.extra?.choice === 'twist' && e.extra?.theirs === 'stick' && e.players.length >= 2);
  const casaShown = casa.map(e => {
    const twister = e.players[0];
    // The partner who waited at the main villa is the one the scene's approval went to (pm/casa.js).
    const waited = Object.keys(e.extra?.pop || {}).find(n => n !== twister && n !== e.players[1]) || null;
    return { twister, waited, brought: e.players[1] };
  }).filter(c => c.waited && c.brought && new Set([c.twister, c.waited, c.brought]).size === 3)
    .sort((x, y) => pairRank(y.twister, y.waited) - pairRank(x.twister, x.waited)).slice(0, 2);
  if (casaShown.length) push('ru-host', [], { of: 'casa' });
  for (const c of casaShown) push('ru-casa', [c.twister, c.waited, c.brought], { now: nowOf(c.waited, c.twister), lasted: lasted(c.twister, c.brought) });

  // The exes, the feuds and the friendships, the biggest first.
  const inSteal = new Set([...stealsShown.map(s => key(s.lost, s.partner)), ...casaShown.map(c => key(c.twister, c.waited))]);
  const exes = after.exes.filter(x => !inSteal.has(key(x.a, x.b)) && !after.couples.some(c => key(c.a, c.b) === key(x.a, x.b)))
    .sort((x, y) => pairRank(y.a, y.b) - pairRank(x.a, x.b)).slice(0, 2);
  if (exes.length) push('ru-host', [], { of: 'exes' });
  for (const x of exes) push('ru-exes', [x.a, x.b], { now: x.now, cause: x.cause });
  // (Not a pair the recouplings or Casa have just been through.)
  const told = new Set([...stealsShown.flatMap(s => [key(s.lost, s.took), key(s.took, s.partner), key(s.lost, s.partner)]),
    ...casaShown.flatMap(c => [key(c.twister, c.waited), key(c.twister, c.brought), key(c.waited, c.brought)])]);
  const feuds = after.feuds.filter(f => !told.has(key(f.a, f.b))).slice(0, 2);
  if (feuds.length) push('ru-host', [], { of: 'feuds' });
  for (const f of feuds) push('ru-feud', [f.a, f.b], { now: f.now, grudge: f.grudge });

  // What they didn't show you: each clip, then the partner has their say.
  if (clips.length) push('ru-host', [], { of: 'clips' });
  for (const c of clips) {
    push('reveal', c.cast, { ...c.extra, major: c.major });
    // The partner has their say about what the clip WAS: a chat, a kiss, a bed, something said about them.
    // (A scandal only: a clip of somebody being let down gently is nobody's betrayal.)
    const what = c.of === 'scandal' ? CLIP_TALK[c.what] : null;
    if (what && c.partner && c.who && c.with && new Set([c.who, c.with, c.partner]).size === 3) {
      const k = after.couples.find(x => key(x.a, x.b) === key(c.who, c.partner));
      const fate = !k || k.fate === 'friends' ? 'over' : k.fate === 'split' ? 'split' : 'together';
      push('ru-clip', [c.who, c.partner, c.with], { what, fate, of: c.of });
    }
  }

  const friends = after.friends.sort((x, y) => pairRank(y.a, y.b) - pairRank(x.a, x.b)).slice(0, 2);
  if (friends.length) push('ru-host', [], { of: 'friends' });
  for (const f of friends) push('ru-friends', [f.a, f.b], { now: f.now });

  // Quick questions: everyone who has not said much yet answers, with the
  // season's biggest names filling a round out. Two rounds at most, five each.
  const howOf = n => {
    // A couple who split since answers as somebody who didn't keep what they found.
    const mine = after.couples.find(c => c.a === n || c.b === n);
    if (mine && mine.fate !== 'together' && mine.fate !== 'stronger') return 'mid';
    if (winners.includes(n)) return 'won';
    if ((state.couples || []).some(c => c.includes(n))) return 'final';
    if ((state.history || []).some(e => e.kind === 'walk' && e.players[0] === n)) return 'walked';
    const g = [...(state.gone || [])].reverse().find(x => x.name === n);
    return g && g.ep <= Math.max(4, Math.round((state.ep || 24) / 3)) ? 'early' : 'mid';
  };
  // Rounds of five, each its own question, until nobody is under two; the
  // season's biggest names fill a short round out, so it is never one voice.
  const QS = ['again', 'learned', 'change', 'home'];
  const answered = {};                     // q -> who has answered it (nobody answers one question twice)
  let r = 0;
  for (; r < 8; r++) {
    const q = QS[r % QS.length];
    const done = (answered[q] ||= new Set());
    const quiet = cast.filter(n => spoken[n] < 2 && !done.has(n)).sort((x, y) => spoken[x] - spoken[y] || rank(y) - rank(x));
    if (!quiet.length && r >= 1) break;
    const round = quiet.slice(0, 5);
    for (const n of cast.filter(x => !round.includes(x) && !done.has(x)).sort((x, y) => rank(y) - rank(x))) {
      if (round.length >= 4) break;
      round.push(n);
    }
    push('ru-ask', [], { q });
    round.forEach(n => { done.add(n); push('ru-quick', [n], { q, how: howOf(n) }); });
  }

  // The winners close it.
  if (win) push('ru-close', [win.a, win.b], { fate: win.fate });
  else push('ru-close', [], { fate: 'none' });
  return out;
}
