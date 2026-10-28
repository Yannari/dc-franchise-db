// ══════════════════════════════════════════════════════════════════════
// bb/story/sstalk.js — what a Secret Story house talks about
// ══════════════════════════════════════════════════════════════════════
//
// Part 3. In a Secret Story season the director does not air Big Brother's
// game talk (the Head of Household's week, the campaign, the vote): none of it
// exists here. It airs this instead, read from what the week really did
// (docs/research/secret-story-transcripts.md §2, the dailies):
//
//   ss.hunt.share       a tells b who they think c is, and what c is hiding
//   ss.hunt.tell        a has noticed something c keeps doing
//   ss.hunt.fish.close  a fishes c, and is right: c is scared
//   ss.hunt.fish.wrong  a fishes c, and is wrong: c is delighted
//   ss.pair.check       the two who share a secret, alone for a minute
//   ss.buzz.wrong       the morning after somebody wrongly buzzed a (c buzzed)
//   ss.buzz.found       the morning after a's secret was found (c found it)
//   ss.noms.morning     a nominee's morning, and a friend rallying them
//   ss.noms.whisper     two allies whispering about the nominations (forbidden)
//   ss.public           a nominee wondering what the public thinks
//   ss.kitty.rich       the richest, and why they keep quiet about it
//   ss.kitty.poor       the poorest, and the buzz they can't afford
//   ss.core             two who trust each other: "you're in my core"
//   ss.burden           the weight of keeping a secret
//
// Pools: bb/story/lines/sstalk.js. Words only: nothing here moves the game.

import { gs } from '../../core.js';
import { getBond } from '../../bonds.js';
import { stableRng } from '../knowledge.js';

const bond = (a, b) => { try { return getBond(a, b) || 0; } catch { return 0; } };

/** One to three Secret Story talks for this stretch of the week. */
export function ssTalkFor(week, ctx, { stretch = 0, talked = new Set() } = {}) {
  const st = gs.bb?.secretStory;
  if (!st) return [];
  const house = (ctx.present || []).filter(Boolean);
  if (house.length < 3) return [];
  const rng = stableRng(gs.bb?.seasonSalt || 0, 'sstalk', week.num || 0, stretch);
  const acts = week.acts || [];
  const inHouse = n => house.includes(n);
  const secretOf = n => (st.secrets || []).find(s => (s.holders || []).includes(n));
  const hidden = n => !!secretOf(n) && !secretOf(n).found;
  const closest = (n, not = []) => house.filter(x => x !== n && !not.includes(x)).sort((a, b) => bond(n, b) - bond(n, a))[0] || null;
  const out = [];
  const add = t => { if (t && !talked.has(t.kind) && !out.some(o => o.kind === t.kind)) out.push(t); };
  const nominees = (ctx.nominees || []).filter(inHouse);

  // ── the hunt: what the week's watching and talking turned up (js/ss/hunt.js moments) ──
  const moments = acts.filter(a => a?.type === 'ss-hunt').flatMap(a => a.moments || [])
    .filter(m => inHouse(m.who) && inHouse(m.about) && hidden(m.about));
  const share = moments.filter(m => m.kind === 'talk' && m.to && inHouse(m.to) && m.theory)[stretch];
  if (share) add({ kind: 'ss.hunt.share', who: { a: share.who, b: share.to, c: share.about }, data: { guess: share.theory } });
  const tell = moments.filter(m => m.kind === 'tell' && m.tell)[stretch];
  if (tell) { const b = closest(tell.who, [tell.about]); if (b) add({ kind: 'ss.hunt.tell', who: { a: tell.who, b, c: tell.about }, data: { tell: tell.tell } }); }
  // fishing: the surest theory anybody holds about somebody still hiding
  let best = null;
  for (const [n, ths] of Object.entries(st.theories || {})) {
    if (!inHouse(n)) continue;
    for (const [t, th] of Object.entries(ths || {})) {
      if (!inHouse(t) || !hidden(t) || !th || th.conf < 0.4 || !th.text) continue;
      if (!best || th.conf > best.th.conf) best = { a: n, c: t, th };
    }
  }
  if (best && (stretch + (week.num || 0)) % 2 === 0) add({ kind: best.th.right ? 'ss.hunt.fish.close' : 'ss.hunt.fish.wrong', who: { a: best.a, c: best.c }, data: { guess: best.th.text } });

  // ── a shared secret: its two, alone for a minute ──
  const pairs = (st.secrets || []).filter(s => !s.found && (s.holders || []).length === 2 && s.holders.every(inHouse));
  if (pairs.length && stretch === 1) {
    const p = pairs[Math.floor(rng() * pairs.length)];
    add({ kind: 'ss.pair.check', who: { a: p.holders[0], b: p.holders[1] }, data: {} });
  }

  // ── the morning after a buzz ──
  for (const b of acts.filter(a => a?.type === 'ss-buzz' && a.outcome !== 'withdrawn')) {
    if (!inHouse(b.target) || !inHouse(b.by)) continue;
    const friend = closest(b.target, [b.by]);
    if (!friend) continue;
    add({ kind: b.outcome === 'right' ? 'ss.buzz.found' : 'ss.buzz.wrong', who: { a: b.target, b: friend, c: b.by }, data: {} });
    break;
  }

  // ── the nominations: the morning after, the whisper, the public ──
  if (nominees.length && stretch >= 1) {
    const n0 = nominees[(week.num || 0) % nominees.length];
    const f0 = closest(n0, nominees);
    if (f0) add({ kind: 'ss.noms.morning', who: { a: n0, b: f0 }, data: {} });
    const n1 = nominees.find(n => n !== n0);
    if (n1) { const f1 = closest(n1, nominees); if (f1) add({ kind: 'ss.public', who: { a: n1, b: f1 }, data: {} }); }
    // two allies who named somebody this week, whispering about it (a commandment, broken quietly)
    const ballots = acts.find(a => a?.secretStory)?.secretStory?.ballots || [];
    const whisper = ballots.find(b => inHouse(b.voter) && (b.picks || []).some(inHouse));
    if (whisper && rng() < 0.6) {
      const ally = closest(whisper.voter, nominees);
      const named = (whisper.picks || []).find(inHouse);
      if (ally && named && ally !== named) add({ kind: 'ss.noms.whisper', who: { a: whisper.voter, b: ally, c: named }, data: {} });
    }
  }

  // ── the money ──
  const ranked = house.map(n => [n, Number(st.kitty?.[n]) || 0]).sort((a, b) => b[1] - a[1]);
  if (stretch === 0 && ranked.length >= 4 && (week.num || 0) >= 2) {
    const [rich, richAmt] = ranked[0];
    const [poor, poorAmt] = ranked[ranked.length - 1];
    if (richAmt >= 15000 && rng() < 0.5) { const b = closest(rich); if (b) add({ kind: 'ss.kitty.rich', who: { a: rich, b }, data: {} }); }
    else if (poorAmt <= 5000) { const b = closest(poor); if (b) add({ kind: 'ss.kitty.poor', who: { a: poor, b }, data: {} }); }
  }

  // ── the core, and the weight of a secret ──
  if (stretch === 2 || out.length < 2) {
    let pair = null;
    for (let i = 0; i < house.length && !pair; i++) for (let j = i + 1; j < house.length; j++) {
      if (bond(house[i], house[j]) >= 5 && rng() < 0.35) { pair = [house[i], house[j]]; break; }
    }
    if (pair) add({ kind: 'ss.core', who: { a: pair[0], b: pair[1] }, data: {} });
    const keeper = house.filter(hidden)[Math.floor(rng() * house.filter(hidden).length)];
    if (keeper && out.length < 2) { const b = closest(keeper); if (b) add({ kind: 'ss.burden', who: { a: keeper, b }, data: {} }); }
  }
  return out.slice(0, 3);
}
