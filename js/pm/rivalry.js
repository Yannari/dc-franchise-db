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
//   THE VILLA TAKES SIDES (user: "a storyline with a lot of people involved,
//   not a lone event gone in the wind … arguments with people on different
//   sides taking the back of x and y, ongoing over multiple episodes"). The
//   rest of the villa leans to whichever rival they are closer to, and the
//   camps move as the bonds do. The girls rallying round Anna, Curtis telling
//   Maura and Maura telling Anna (UK 5); Rosie gathering the villa to watch
//   (UK 4); Zara throwing herself between Kady and Malia (UK 2).
//     camp-rally    [v, f, x]    f rallies round v after x went for v
//     camp-confront [f, x, v]    f goes at x on v's behalf. `of`: hot · calm
//     camp-clash    [f, g, x, v] g, from x's side, steps in: the two sides go at it
//     camp-lobby    [f, h, s]    f talks to h about s. `of`: for · against (against: schemers only)
//     camp-split    [x, y, h]    the villa divided, at dinner, in front of everyone
//     camp-switch   [f, n, o]    f has changed sides, from o's to n's
//     camp-after    [l, f, w]    after the choice, f is there for l. `of`: comfort · snipe (at w)
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
  return cands.sort((a, b) => b.w - a.w).find(c => rng() < Math.min(0.6, c.w * 1.2)) || null;
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
    // Somebody went home: it's over (the other has h to themselves). Casa
    // Amor only pauses it — every rivalry with someone across the villas used
    // to end the night Casa opened.
    if (![h, x, y].every(n => state.villa.includes(n))) { t.over = true; t.why = 'gone'; continue; }
    if (!sameRoom(state, h, x, y)) continue;
    // A recoupling decided it: h is now with one of them.
    const p = partnerOf(state, h);
    if (p && (p === x || p === y) && (p !== t.partnerAt || recoupled) && t.ep !== state.ep) {
      const w = p, l = p === x ? y : x;
      // Losing one recoupling doesn't end it: the one who lost fights on
      // (Siannise and Rebecca went round "multiple recouplings" over Luke, UK 6)
      // unless they have gone off h, or this is the second time h has chosen.
      t.decided = (t.decided || 0) + 1;
      t.partnerAt = p;
      nudgeAttraction(state, l, h, -0.8);
      if (t.decided >= 2 || wants(state, l, h) < 4 || (styleOf(state, l, rng) === 'withdraw' && rng() < 0.5)) {
        t.over = true; t.why = 'decided';
        (state.rivalDone ||= {})[[h, x, y].sort().join('|')] = state.ep;
      }
      const bitter = rng() < 0.2 + 0.6 * (1 - st(state, l, 'temperament')) * (NICE.has(arch(state, l)) ? 0.5 : 1);
      breakHeart(state, l, h, 3 * wants(state, l, h) / 10);
      if (bitter) { addBond(l, w, -1); addRelationshipDimension(l, w, 'resentment', 1); feel(state, l, 'stress', 0.6); }
      else { addBond(l, w, 0.4); }
      ev('rival-won', [w, l, h], { of: bitter ? 'bitter' : 'gracious', pop: pop([l, bitter ? -0.4 : 1, 1.5], [w, 0.2, 1]) }, bitter ? [l] : []);
      // …and l's side is there for l, and some of them have words for w.
      const side = campsOf(state, t)[l === x ? 'X' : 'Y'];
      const f = side[0];
      if (f && rng() < 0.8) {
        const snipe = ['shade', 'confront'].includes(styleOf(state, f, rng)) && !NICE.has(arch(state, f));
        addBond(l, f, 0.4); feel(state, l, 'stress', -0.3);
        if (snipe) { addBond(f, w, -0.6); addBond(w, f, -0.4); }
        ev('camp-after', [l, f, w], { of: snipe ? 'snipe' : 'comfort', sides: sidesOf(state, t), pop: pop([f, snipe ? -0.1 : 0.3, 0.8]) });
      }
      continue;
    }
    if (t.ep === state.ep) continue;
    // The rivals' own move, then the villa's — a second villa step after a
    // row or a dig, when everyone has something to say about it.
    if (rng() < 0.8) stepRivalry(state, rng, t, ev);
    if (!t.over && rng() < 0.95) stepCamp(state, rng, t, ev);
    if (!t.over && ['shade', 'row', 'interrupt', 'code'].includes(t.last?.kind) && rng() < 0.7) stepCamp(state, rng, t, ev);
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
    if (!state.villa.includes(a) || !state.villa.includes(b)) { t.over = true; continue; }
    if (!sameRoom(state, a, b)) continue;
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
    t.over = true; t.why = 'stepped-back';
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
    t.last = { kind: 'shade', by: m, at: o };
    return ev('rival-shade', [m, o, h], { of: behind ? 'behind' : 'face', style, pop: pop([m, behind ? -0.3 : -0.2, 1.5], [o, 0.2, 0.8]) });
  }
  if (style === 'confront' || (t.stage >= 3 && rng() < 0.5)) {
    // It comes out between them. The calm clear the air; the hot-headed don't.
    const calm = (st(state, m, 'temperament') + st(state, o, 'temperament')) / 2;
    if (rng() < 0.15 + 0.6 * calm) {
      addBond(m, o, 0.6); addBond(o, m, 0.6); feel(state, m, 'stress', -0.3); feel(state, o, 'stress', -0.3);
      t.last = { kind: 'clear-air', by: m, at: o };
      return ev('rival-row', [m, o, h], { of: 'clear-air', pop: pop([m, 0.5, 1], [o, 0.5, 1]) });
    }
    addBond(m, o, -1.2); addBond(o, m, -1.2); feel(state, m, 'stress', 0.8); feel(state, o, 'stress', 0.8);
    addRelationshipDimension(m, o, 'resentment', 0.8); addRelationshipDimension(o, m, 'resentment', 0.8);
    t.last = { kind: 'row', by: m, at: o };
    return ev('rival-row', [m, o, h], { of: 'row', sides: sidesOf(state, t), pop: pop([m, -0.3, 2], [o, -0.1, 1.5]) }, [m, o]);
  }
  // charm / fair: make the play for h, in front of o — and if h is o's
  // partner, somebody close to o may call it.
  const pull = (st(state, m, 'social') + st(state, m, 'boldness')) / 2;
  const moved = 0.2 + 0.7 * pull * rng();
  nudgeAttraction(state, h, m, moved);
  jealousOf(state, o, m, 1);
  const interrupt = style === 'charm' && st(state, m, 'boldness') > 0.5 && rng() < 0.5;
  t.last = { kind: interrupt ? 'interrupt' : 'play', by: m, at: o };
  ev('rival-play', [m, h, o], { of: interrupt ? 'interrupt' : style === 'fair' ? 'fair' : 'play', pop: pop([m, style === 'fair' ? 0.3 : 0, 1.2]) });
  if (hp === o) {
    const g = n => state.profiles[n]?.gender;
    const f = roomMates(state, o).filter(n => n !== m && n !== h && g(n) === g(m) && getBond(n, o) >= 2)
      .sort((p, q) => getBond(q, o) - getBond(p, o))[0];
    // The bold call it; the rest let it go. A fair play is harder to call.
    if (f && rng() < (0.3 + 0.8 * st(state, f, 'boldness')) * (style === 'fair' ? 0.5 : 1)) {
      addBond(f, m, -0.8); addBond(m, f, -0.5);
      for (const n of roomMates(state, o)) if (n !== m && getBond(n, o) >= 3) addBond(n, m, -0.2);
      t.last = { kind: 'code', by: m, at: o };
      ev('code-call', [f, m, o], { sides: sidesOf(state, t), pop: pop([m, -0.5, 1.5], [f, 0.4, 1]) });
    }
  }
}

// ── the villa takes sides ─────────────────────────────────────────────
/** Who is on whose side: everyone else leans to the rival they are closer to. */
export function campsOf(state, t) {
  const { h, x, y } = t;
  const lean = n => getBond(n, x) - getBond(n, y) + (Math.max(0, friendship(n, x)) - Math.max(0, friendship(n, y))) / 4;
  const others = roomMates(state, x).filter(n => n !== h && n !== y);
  const X = others.filter(n => lean(n) >= 0.8).sort((p, q) => lean(q) - lean(p)).slice(0, 3);
  const Y = others.filter(n => lean(n) <= -0.8).sort((p, q) => lean(p) - lean(q)).slice(0, 3);
  return { X, Y };
}
const sidesOf = (state, t) => { const c = campsOf(state, t); return { A: [t.x, ...c.X], B: [t.y, ...c.Y] }; };

function stepCamp(state, rng, t, ev) {
  const { h, x, y } = t;
  const camps = campsOf(state, t);
  const prev = t.camps || { X: [], Y: [] };
  t.camps = camps;
  const sides = { A: [x, ...camps.X], B: [y, ...camps.Y] };
  const sideOf = n => (camps.X.includes(n) ? x : camps.Y.includes(n) ? y : null);
  const campFor = r => (r === x ? camps.X : camps.Y);

  // Somebody changed sides since last time — the bonds moved them.
  const moved = [...prev.X.filter(n => camps.Y.includes(n)), ...prev.Y.filter(n => camps.X.includes(n))];
  if (moved.length && rng() < 0.7) {
    const f = moved[0], now = sideOf(f), was = now === x ? y : x;
    addBond(f, now, 0.4); addBond(f, was, -0.4); addBond(was, f, -0.5);
    return ev('camp-switch', [f, now, was], { sides, pop: pop([f, 0, 1]) });
  }

  // Who was wronged last (the one the dig, the row, the steal attempt was at).
  const hostile = ['shade', 'row', 'interrupt', 'code'].includes(t.last?.kind);
  const v = hostile ? t.last.at : (rng() < 0.5 ? x : y), agg = v === x ? y : x;
  const mine = campFor(v), theirs = campFor(agg);
  const opts = [];
  if (mine.length) opts.push(['rally', hostile ? 1.3 : 0.4]);
  if (mine.length) opts.push(['confront', (hostile ? 1.3 : 0.5) * Math.max(...mine.map(n => st(state, n, 'boldness')))]);
  if (camps.X.length + camps.Y.length) opts.push(['lobby', 0.8]);
  if (camps.X.length >= 2 && camps.Y.length >= 2 && t.stage >= 2 && !t.split) opts.push(['split', 1.4]);
  const move = weighted(rng, opts);
  if (!move) return;

  if (move === 'rally') {
    const f = mine[0];
    addBond(v, f, 0.3); addBond(f, agg, -0.3); feel(state, v, 'stress', -0.3);
    for (const n of mine.slice(1)) addBond(n, agg, -0.15);
    return ev('camp-rally', [v, f, agg], { sides, pop: pop([f, 0.3, 0.8]) });
  }
  if (move === 'confront') {
    // The boldest of v's side goes and says it — hot or calm, as they are built.
    const f = [...mine].sort((p, q) => st(state, q, 'boldness') - st(state, p, 'boldness'))[0];
    const hot = ['confront', 'shade'].includes(styleOf(state, f, rng));
    addBond(f, agg, hot ? -0.9 : -0.4); addBond(agg, f, hot ? -0.7 : -0.3);
    addRelationshipDimension(agg, f, 'resentment', hot ? 0.6 : 0.2);
    feel(state, agg, 'stress', hot ? 0.5 : 0.2);
    ev('camp-confront', [f, agg, v], { of: hot ? 'hot' : 'calm', sides, pop: pop([f, hot ? 0 : 0.3, 1.2], [agg, -0.2, 1]) }, hot ? [f, agg] : []);
    // …and somebody from the other side steps in: now it's the two sides.
    const g = theirs.find(n => rng() < 0.25 + 0.6 * st(state, n, 'boldness'));
    if (g && hot) {
      addBond(f, g, -1); addBond(g, f, -1); feel(state, f, 'stress', 0.5); feel(state, g, 'stress', 0.5);
      addRelationshipDimension(f, g, 'resentment', 0.5); addRelationshipDimension(g, f, 'resentment', 0.5);
      ev('camp-clash', [f, g, agg, v], { sides, pop: pop([f, -0.2, 1.8], [g, -0.2, 1.8]) }, [f, g]);
    }
    return;
  }
  if (move === 'lobby') {
    // A friend works on the one in the middle: for their friend, or — if
    // they may scheme — against the other one.
    const f = weighted(rng, [...camps.X, ...camps.Y].map(n => [n, 0.3 + st(state, n, 'social')]));
    const s1 = sideOf(f), s2 = s1 === x ? y : x;
    const against = schemeEligible(state.profiles[f]) && rng() < 0.5;
    const sway = (0.15 + 0.35 * st(state, f, 'social')) * (0.5 + Math.max(0, getBond(h, f)) / 10);
    if (against) { nudgeAttraction(state, h, s2, -sway); addBond(s2, f, -0.3); }
    else nudgeAttraction(state, h, s1, sway);
    return ev('camp-lobby', [f, h, against ? s2 : s1], { of: against ? 'against' : 'for', sides, pop: pop([f, against ? -0.2 : 0.1, 0.8]) });
  }
  // The villa divided: every pair across the line cools a little.
  t.split = true;
  for (const a of sides.A) for (const b of sides.B) { addBond(a, b, -0.2); addBond(b, a, -0.2); }
  for (const n of [...sides.A, ...sides.B, h]) feel(state, n, 'stress', 0.3);
  return ev('camp-split', [x, y, h], { sides, pop: pop([x, 0, 1.5], [y, 0, 1.5], [h, -0.1, 1.5]) }, [x, y]);
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
  // (Not two episodes running: "watching them, hurt" three nights in a row was a loop.)
  if (other && other !== a && state.ep - (t.lastWatch ?? -9) >= 2 && rng() < 0.4) {
    t.lastWatch = state.ep;
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
