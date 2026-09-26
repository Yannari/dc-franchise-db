// ══════════════════════════════════════════════════════════════════════
// pm/rivalry.js — two after the same one, and the crush that isn't returned
// ══════════════════════════════════════════════════════════════════════
//
// User: "one-sided crushes should be exploited more — fighting for the same
// boy or girl, catty, dramatic … depending on their personalities they can
// all get a different storyline". The love triangle (pm/triangle.js) only
// forms when the one in the middle fancies BOTH; the show's biggest stories
// are mostly the other kind, read from the press and the wiki:
//
//   Two after one (whether the one in the middle is torn or not): Jess and
//   Harriett over Ronnie (UK 11 — days of rows, then "I'm not going to be in
//   competition with another woman"); Siânnise and Rebecca over Luke (UK 6);
//   Meg and Malisha over Dejon (UK 12 — fiery words across the garden, the
//   air cleared the next day, "it has nothing to do with you personally",
//   then Meg interrupting their chat); Harriett telling the villa Ronnie was
//   "trying too hard" loud enough for everyone to hear (UK 11).
//   Going for somebody else's partner, and the villa calling it: Meg "felt
//   violated in front of all of the girls" (UK 12); the "girl code" rows
//   (US 7); Megan kissing Wes in a game (UK 4); Maura and Tommy (UK 5).
//   The crush that isn't returned: Lucie realising she liked Tommy when
//   Molly-Mae took him (UK 5); Yewande asking Danny for more affection, and
//   "what goes around comes around" when he left her (UK 5).
//
// Two stories, each a few steps over episodes, every step changing what the
// recouplings read (attraction, bonds, jealousy, heartbreak, the public):
//
//   RIVALS  [x, y] both want h.
//     rival-shade   [x, y, h]  x on y, behind y's back or to y's face
//     rival-play    [x, h, y]  x goes for h, in front of y
//     code-call     [f, x, y]  f calls x out for going after y's partner
//     rival-row     [x, y, h]  it comes out between them — or they clear the air
//     rival-step-back [x, f, h] x stops competing — to a friend, or to the rival (`of`)
//     rival-won     [w, l, h]  h chose; l takes it well or doesn't
//   CRUSH   a wants b; b doesn't want a back.
//     crush-confide [a, f, b]  a tells a friend; the friend says go for it, or don't
//     crush-watch   [a, b, c]  a watches b with c
//     crush-move    [a, b]     a goes for it; b lets a down, friend-zones, or leads a on
//     crush-plea    [a, b]     a is b's partner, and asks for more
//     crush-over    [a, b]     a lets it go, and says so
//
// PERSONALITY DECIDES THE STORY. Every step is picked from how that islander
// is built — stats, archetype, attachment — in proportion (CLAUDE.md: stats
// are always proportional): the bold and hot-headed confront, the scheming
// throw shade and play the villa, the loyal and the kind play fair or step
// back, the anxious hold on and ask for reassurance, the avoidant act as if
// they never cared. Nice archetypes never scheme (they don't throw shade
// behind a back, or lead anybody on).
import { addBond, getBond } from '../bonds.js';
import { addRelationshipDimension } from '../relationships.js';
import { makeEvent, partnerOf, roomMates } from './events.js';
import { attr, nudgeAttraction, compatible } from './chemistry.js';
import { romance, friendship, schemeEligible } from './feelings.js';
import { feel, jealousOf, breakHeart, attachment } from './emotions.js';

const MAX_RIVALRIES = 2, MAX_CRUSHES = 2;
const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);

const S = (state, n) => state.profiles[n]?.stats || {};
const st = (state, n, k) => (S(state, n)[k] ?? 5) / 10;
const arch = (state, n) => state.profiles[n]?.archetype;
const pop = (...rows) => Object.fromEntries(rows.filter(r => r && r[0]).map(([n, approval, fame]) => [n, { approval, fame }]));

function weighted(rng, opts) {
  const total = opts.reduce((t, o) => t + Math.max(0, o[1]), 0);
  if (total <= 0) return null;
  let r = rng() * total;
  for (const o of opts) if ((r -= Math.max(0, o[1])) < 0) return o[0];
  return opts[opts.length - 1][0];
}

/**
 * How an islander fights for somebody, from how they are built. Every option
 * is live for everyone who may take it; the stats set the odds.
 *   confront  says it to your face          boldness, low temperament
 *   shade     digs, loud enough to be heard  low temperament; behind a back only if they may scheme
 *   charm     wins h over instead            social, boldness
 *   fair      plays it straight, no digs     loyalty, temperament
 *   withdraw  won't compete                  low boldness, high temperament, anxious
 */
export function styleOf(state, n, rng) {
  const bold = st(state, n, 'boldness'), temp = st(state, n, 'temperament'), soc = st(state, n, 'social'),
    loyal = st(state, n, 'loyalty'), strat = st(state, n, 'strategic');
  const att = attachment(state.profiles[n]);
  const nice = NICE.has(arch(state, n)), sly = schemeEligible(state.profiles[n]);
  const a = arch(state, n);
  return weighted(rng, [
    ['confront', 1.4 * bold * (1.2 - temp) * (a === 'hothead' ? 1.8 : 1)],
    ['shade', (1.1 - temp) * (sly ? 1.2 + strat : 0.5) * (nice ? 0.25 : 1) * (a === 'villain' || a === 'chaos-agent' ? 1.6 : 1)],
    ['charm', 1.2 * soc * (0.5 + bold) * (a === 'social-butterfly' || a === 'showmancer' ? 1.5 : 1)],
    ['fair', 0.9 * loyal * (0.4 + temp) * (nice ? 1.6 : 1)],
    ['withdraw', 0.9 * (1 - bold) * (0.4 + temp) * (0.6 + att.anxiety)],
  ]);
}

const here = (state, n) => state.villa.includes(n) && !(state.split && state.casa?.includes(n));
const sameRoom = (state, ...ns) => ns.every(n => here(state, n)) || ns.every(n => state.split && state.casa?.includes(n));
const busyIn = state => new Set([
  ...(state.triangles || []).filter(t => !t.over).flatMap(t => [t.h, t.x, t.y]),
  ...(state.rivalries || []).filter(t => !t.over).flatMap(t => [t.h, t.x, t.y]),
  ...(state.crushes || []).filter(t => !t.over).flatMap(t => [t.a, t.b]),
]);
const wants = (state, n, h) => Math.max(romance(n, h), attr(state, n, h) ?? 0);
/** The friend somebody would talk to: their closest in the villa, not one of the story. */
const friendOf = (state, n, not) => roomMates(state, n).filter(f => !not.includes(f))
  .sort((p, q) => getBond(n, q) - getBond(n, p))[0] || null;

// ── forming ───────────────────────────────────────────────────────────
function newRivalry(state, rng) {
  if ((state.rivalries ||= []).filter(t => !t.over).length >= MAX_RIVALRIES) return null;
  const busy = busyIn(state);
  const cands = [];
  for (const h of state.villa) {
    if (busy.has(h)) continue;
    // Everyone who wants h — whether h wants them back or not.
    const suitors = roomMates(state, h).filter(n => !busy.has(n) && compatible(state, n, h) && wants(state, n, h) >= 5)
      .sort((p, q) => wants(state, q, h) - wants(state, p, h));
    if (suitors.length < 2) continue;
    const [x, y] = suitors;
    // A rivalry the recoupling just settled doesn't start again that night:
    // three episodes before the same three can go round again.
    const key = [h, x, y].sort().join('|');
    if (state.ep - (state.rivalDone?.[key] ?? -99) < 3) continue;
    // The triangle's own ground: h fancies both, closely. Leave that to it.
    const ax = attr(state, h, x) ?? 0, ay = attr(state, h, y) ?? 0;
    if (ax >= 4 && ay >= 4 && Math.abs(ax - ay) < 2) continue;
    const heat = (Math.min(wants(state, x, h), wants(state, y, h)) / 10) * (0.6 + 0.4 * Math.max(st(state, x, 'boldness'), st(state, y, 'boldness')));
    cands.push({ h, x, y, w: heat });
  }
  return cands.sort((a, b) => b.w - a.w).find(c => rng() < Math.min(0.5, c.w * 0.9)) || null;
}

function newCrush(state, rng) {
  if ((state.crushes ||= []).filter(t => !t.over).length >= MAX_CRUSHES) return null;
  const busy = busyIn(state);
  const cands = [];
  for (const a of state.villa) {
    if (busy.has(a)) continue;
    for (const b of roomMates(state, a)) {
      if (busy.has(b) || !compatible(state, a, b)) continue;
      // Told no, or let go: that one is over. It only comes back if b has
      // since come round a little (a let-down twice in two episodes read as a bug).
      const done = state.crushDone?.[`${a}>${b}`];
      if (done != null && (attr(state, b, a) ?? 0) <= done + 1) continue;
      const mine = wants(state, a, b), theirs = attr(state, b, a) ?? 0;
      // Properly keen, and not wanted back.
      if (mine < 5.5 || theirs > 3.5 || mine - theirs < 2.5) continue;
      cands.push({ a, b, w: ((mine - theirs) / 10) * (partnerOf(state, a) === b ? 1.2 : 1) });
    }
  }
  return cands.sort((p, q) => q.w - p.w).find(c => rng() < Math.min(0.45, c.w)) || null;
}

// ── the stories ───────────────────────────────────────────────────────
export function rivalries(state, rng, entry = null) {
  if (entry && ['final', 'reunion', 'semi-final'].includes(entry.moment)) return [];
  const out = [];
  const ev = (kind, players, extra, major = []) => {
    out.push(makeEvent(state, rng, { phase: 'rivals', kind, players, aired: true, major, extra: { pop: {}, ...extra } }));
  };
  const recoupled = ['recoupling', 'stick-or-twist', 'first-coupling'].includes(entry?.moment);

  // ── RIVALS ──
  for (const t of (state.rivalries || []).filter(r => !r.over)) {
    const { h, x, y } = t;
    if (!here(state, h) || (!here(state, x) && !here(state, y))) { t.over = true; continue; }
    // One of them went home: the other has h to themselves.
    if (!here(state, x) || !here(state, y)) { t.over = true; continue; }
    // A recoupling decided it: h is now with one of them.
    const p = partnerOf(state, h);
    if (p && (p === x || p === y) && (p !== t.partnerAt || recoupled) && t.ep !== state.ep) {
      const w = p, l = p === x ? y : x;
      t.over = true;
      (state.rivalDone ||= {})[[h, x, y].sort().join('|')] = state.ep;
      const bitter = rng() < 0.2 + 0.6 * (1 - st(state, l, 'temperament')) * (NICE.has(arch(state, l)) ? 0.5 : 1);
      breakHeart(state, l, h, 3 * wants(state, l, h) / 10);
      if (bitter) { addBond(l, w, -1); addRelationshipDimension(l, w, 'resentment', 1); feel(state, l, 'stress', 0.6); }
      else { addBond(l, w, 0.4); }
      ev('rival-won', [w, l, h], { of: bitter ? 'bitter' : 'gracious', pop: pop([l, bitter ? -0.4 : 1, 1.5], [w, 0.2, 1]) }, bitter ? [l] : []);
      continue;
    }
    if (t.ep === state.ep) continue;
    for (let k = 0; k < 2 && !t.over; k++) if (rng() < 0.7) stepRivalry(state, rng, t, ev);
  }
  const r = newRivalry(state, rng);
  if (r) {
    const t = { ...r, ep: state.ep, stage: 0, over: false, partnerAt: partnerOf(state, r.h) || null };
    state.rivalries.push(t);
    stepRivalry(state, rng, t, ev);
  }

  // ── CRUSHES ──
  const ended = t => { (state.crushDone ||= {})[`${t.a}>${t.b}`] = attr(state, t.b, t.a) ?? 0; };
  for (const t of (state.crushes || []).filter(c => !c.over)) {
    const { a, b } = t;
    if (!here(state, a) || !here(state, b)) { t.over = true; continue; }
    // It came good: b wants a back now (a slow burn), and the story is theirs.
    if ((attr(state, b, a) ?? 0) >= 5) { t.over = true; continue; }
    if (t.ep === state.ep) continue;
    if (rng() < 0.75) stepCrush(state, rng, t, ev);
    if (t.over) ended(t);
  }
  const c = newCrush(state, rng);
  if (c) {
    const t = { ...c, ep: state.ep, stage: 0, over: false, inCouple: partnerOf(state, c.a) === c.b };
    state.crushes.push(t);
    stepCrush(state, rng, t, ev);
    if (t.over) ended(t);
  }
  return out;
}

function stepRivalry(state, rng, t, ev) {
  const { h, x, y } = t;
  if (!sameRoom(state, h, x, y)) return;
  t.stage++;
  // Who moves this step: the one who wants h more, most of the time.
  const [m, o] = rng() < 0.5 + (wants(state, x, h) - wants(state, y, h)) / 20 ? [x, y] : [y, x];
  const style = styleOf(state, m, rng);
  jealousOf(state, m, o, 0.6); jealousOf(state, o, m, 0.6);
  const hp = partnerOf(state, h);

  if (style === 'withdraw' && t.stage >= 2) {
    // "I'm not going to be in competition with another woman in this villa."
    const f = friendOf(state, m, [h, o]);
    nudgeAttraction(state, m, h, -1.5); feel(state, m, 'stress', -0.4);
    t.over = true;
    (state.rivalDone ||= {})[[h, x, y].sort().join('|')] = state.ep;
    return ev('rival-step-back', [m, f || o, h], { of: f ? 'friend' : 'to-rival', pop: pop([m, 0.8, 1.2]) });
  }
  if (style === 'shade' || (style === 'confront' && t.stage === 1)) {
    // Said behind o's back needs somebody who may scheme; to o's face is anyone's.
    const behind = style === 'shade' && schemeEligible(state.profiles[m]);
    addBond(m, o, -0.8); addBond(o, m, behind ? -0.3 : -0.8);
    addRelationshipDimension(o, m, 'resentment', behind ? 0.4 : 0.8);
    // h hears it: the catty one loses a little with h unless h already sides with them.
    nudgeAttraction(state, h, m, getBond(h, m) > getBond(h, o) ? 0 : -0.2);
    return ev('rival-shade', [m, o, h], { of: behind ? 'behind' : 'face', style, pop: pop([m, behind ? -0.3 : -0.2, 1.5], [o, 0.2, 0.8]) });
  }
  if (style === 'confront' || (t.stage >= 3 && rng() < 0.5)) {
    // It comes out between them. The calm clear the air; the hot-headed don't.
    const calm = (st(state, m, 'temperament') + st(state, o, 'temperament')) / 2;
    if (rng() < 0.15 + 0.6 * calm) {
      addBond(m, o, 0.6); addBond(o, m, 0.6); feel(state, m, 'stress', -0.3); feel(state, o, 'stress', -0.3);
      return ev('rival-row', [m, o, h], { of: 'clear-air', pop: pop([m, 0.5, 1], [o, 0.5, 1]) });
    }
    addBond(m, o, -1.2); addBond(o, m, -1.2); feel(state, m, 'stress', 0.8); feel(state, o, 'stress', 0.8);
    addRelationshipDimension(m, o, 'resentment', 0.8); addRelationshipDimension(o, m, 'resentment', 0.8);
    return ev('rival-row', [m, o, h], { of: 'row', pop: pop([m, -0.3, 2], [o, -0.1, 1.5]) }, [m, o]);
  }
  // charm / fair: make the play for h, in front of o — and if h is o's
  // partner, somebody close to o may call it.
  const pull = (st(state, m, 'social') + st(state, m, 'boldness')) / 2;
  const moved = 0.2 + 0.7 * pull * rng();
  nudgeAttraction(state, h, m, moved);
  jealousOf(state, o, m, 1);
  const interrupt = style === 'charm' && st(state, m, 'boldness') > 0.5 && rng() < 0.5;
  ev('rival-play', [m, h, o], { of: interrupt ? 'interrupt' : style === 'fair' ? 'fair' : 'play', pop: pop([m, style === 'fair' ? 0.3 : 0, 1.2]) });
  if (hp === o) {
    const g = n => state.profiles[n]?.gender;
    const f = roomMates(state, o).filter(n => n !== m && n !== h && g(n) === g(m) && getBond(n, o) >= 2)
      .sort((p, q) => getBond(q, o) - getBond(p, o))[0];
    // The bold call it; the rest let it go. A fair play is harder to call.
    if (f && rng() < (0.3 + 0.8 * st(state, f, 'boldness')) * (style === 'fair' ? 0.5 : 1)) {
      addBond(f, m, -0.8); addBond(m, f, -0.5);
      for (const n of roomMates(state, o)) if (n !== m && getBond(n, o) >= 3) addBond(n, m, -0.2);
      ev('code-call', [f, m, o], { pop: pop([m, -0.5, 1.5], [f, 0.4, 1]) });
    }
  }
}

function stepCrush(state, rng, t, ev) {
  const { a, b } = t;
  t.stage++;
  const bold = st(state, a, 'boldness'), att = attachment(state.profiles[a]);
  const bp = partnerOf(state, b);
  // Inside a couple: a asks for more (Yewande and Danny, UK 5) — not every
  // night: the same ask three episodes running played as a loop.
  if (t.inCouple && partnerOf(state, a) === b) {
    if (t.lastPlea != null && state.ep - t.lastPlea < 2) { t.stage--; return; }
    t.lastPlea = state.ep;
    // b warms to it in proportion to b's loyalty and what spark b has for a.
    const warm = rng() < 0.15 + 0.5 * st(state, b, 'loyalty') * (0.5 + (attr(state, b, a) ?? 0) / 10);
    if (warm) { nudgeAttraction(state, b, a, 0.4); feel(state, a, 'security', 0.6); }
    else { feel(state, a, 'security', -0.8); breakHeart(state, a, b, 1); }
    if (!warm && t.stage >= 3) t.over = true;
    return ev('crush-plea', [a, b], { of: warm ? 'warmer' : 'colder', pop: pop([a, 0.4, 1], [b, warm ? 0.2 : -0.3, 1]) });
  }
  // Early on it's said to a friend; the bold get to the move sooner.
  if (t.stage === 1 && rng() > 0.3 * bold) {
    const f = friendOf(state, a, [b]);
    if (f) {
      const push = st(state, f, 'boldness') > 0.55 && rng() < 0.7;
      t.pushed = push;
      addBond(a, f, 0.3);
      return ev('crush-confide', [a, f, b], { of: push ? 'go-for-it' : 'careful', pop: pop([a, 0.2, 0.8]) });
    }
  }
  // Watching b with somebody else.
  const other = bp || null;
  if (other && other !== a && rng() < 0.4) {
    jealousOf(state, a, other, 1.2); feel(state, a, 'stress', 0.4);
    // The catty ones take it out on the other one.
    const catty = styleOf(state, a, rng) === 'shade';
    if (catty) { addBond(a, other, -0.8); addRelationshipDimension(other, a, 'resentment', 0.4); }
    return ev('crush-watch', [a, b, other], { of: catty ? 'catty' : 'hurt', pop: pop([a, catty ? -0.3 : 0.3, 1]) });
  }
  // The move: the bold make it, the pushed make it, the anxious wait.
  if (rng() < 0.3 + 0.5 * bold + (t.pushed ? 0.2 : 0) - 0.2 * att.anxiety || t.stage >= 3) {
    const theirs = (attr(state, b, a) ?? 0) / 10;
    // b's answer is b's personality: the kind let a down gently, a schemer
    // who enjoys being wanted leads a on, and a spark that's there grows.
    const answer = weighted(rng, [
      ['let-down', 0.6 + st(state, b, 'temperament')],
      ['friend-zone', 0.4 + Math.max(0, friendship(b, a)) / 8],
      ['leads-on', schemeEligible(state.profiles[b]) ? 0.8 * (1 - st(state, b, 'loyalty')) : 0],
      ['maybe', 2 * theirs],
    ]);
    if (answer === 'maybe') { nudgeAttraction(state, b, a, 0.8); feel(state, a, 'confidence', 0.6); }
    else if (answer === 'leads-on') { nudgeAttraction(state, a, b, 0.4); feel(state, a, 'security', 0.3); t.led = true; }
    else {
      breakHeart(state, a, b, 2.5 * wants(state, a, b) / 10);
      nudgeAttraction(state, a, b, -1.2);
      if (answer === 'friend-zone') addBond(a, b, 0.2);
      t.over = true;
    }
    return ev('crush-move', [a, b], { of: answer, pop: pop([a, answer === 'maybe' ? 0.4 : 0.6, 1.5], [b, answer === 'leads-on' ? -0.5 : 0.1, 1]) }, answer === 'maybe' ? [] : [a]);
  }
  // Letting it go, in their own time: the secure sooner, the anxious later.
  if (t.stage >= 2 && rng() < 0.2 + 0.4 * att.secure) {
    nudgeAttraction(state, a, b, -1.5); feel(state, a, 'stress', -0.3);
    t.over = true;
    return ev('crush-over', [a, b], { of: t.led ? 'led-on' : 'moving-on', pop: pop([a, 0.5, 1], ...(t.led ? [[b, -0.4, 1]] : [])) });
  }
}
