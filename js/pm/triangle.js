// ══════════════════════════════════════════════════════════════════════
// pm/triangle.js — the love triangle, as a story over several episodes
// ══════════════════════════════════════════════════════════════════════
//
// User: "love triangles — not as a story; they happen by accident, but
// nothing follows them over episodes". The real show runs them for weeks
// (UK 6: "Siannise and Rebecca go head to head over their SECOND love
// triangle"). Two islanders fall for the same one, who fancies both — and
// every stage moves the feelings the recoupling will read:
//
//   triangle-torn      [h, f]      the one in the middle tells friend f: both
//   triangle-rivals    [x, y, h]   the two size each other up, or clash
//   triangle-case      [x, h, y]   x makes their case to h (y is the other one)
//   triangle-ultimatum [x, h, y]   x says choose. `of`: chose-x · chose-y · not-yet
//   triangle-teams     [h, x, y]   the villa takes sides (extra.teams)
//   triangle-choice    [h, w, l]   h picked w over l. `of`: pick · default (l went home)
//
// Forming is in proportion to how hard both have fallen and how evenly the
// one in the middle is split; every stage after is a chance, not a schedule.
import { addBond, getBond } from '../bonds.js';
import { makeEvent, partnerOf } from './events.js';
import { attr, nudgeAttraction, compatible } from './chemistry.js';
import { romance } from './feelings.js';
import { feel, jealousOf, breakHeart } from './emotions.js';
import { closedness } from './ladder.js';

const MAX_ACTIVE = 2;

const triInfo = (state, t) => ({ h: t.h, x: t.x, y: t.y,
  ax: Math.round((attr(state, t.h, t.x) ?? 0) * 10) / 10, ay: Math.round((attr(state, t.h, t.y) ?? 0) * 10) / 10 });
const open = state => (state.triangles ||= []).filter(t => !t.over);

/**
 * BEHIND A PARTNER'S BACK (user, of "Me or Carrie?" / "You. It's you." from an
 * islander coupled with somebody else: "there should be some change … more of
 * a secret, that can be used in photos and movie night"). When one of the
 * two in a private triangle scene has a partner outside it, the scene is a
 * secret from that partner, exactly as a pull is (events.js): it goes on
 * state.secrets for the photos and movie night to find, it weighs on the one
 * keeping it, and the scene's lines know the partner exists (`behind`).
 */
// Which of the pairs [who, with, kind, severity] are behind somebody's back:
// a partner OUTSIDE the triangle. Coupled with one of the two is the ordinary
// triangle, played in front of the villa.
const behindOf = (state, t, pairs) => pairs.filter(([who]) => { const p = partnerOf(state, who); return p && ![t.h, t.x, t.y].includes(p); });
// Whose secret the scene's lines speak to: the one in the middle's, if theirs,
// else the one asking's ('mid' reads {pb}, 'asker' {pa}).
const whose = (bb, h) => bb.some(([who]) => who === h) ? 'mid' : 'asker';
// Kept, once the scene exists (the secret points at it).
function keepSecrets(state, e, pairs) {
  for (const [who, other, kind, sev] of pairs) {
    const p = partnerOf(state, who);
    state.secrets.push({ id: `sec${state.secrets.length + 1}`, who, partner: p, with: other, kind, severity: sev,
      ep: state.ep, witnesses: [], known: false, eventId: e.id, casa: !!state.split });
    feel(state, who, 'guilt', 1.5 * sev * closedness(state, who, p));
  }
}

function detect(state, rng) {
  if (open(state).length >= MAX_ACTIVE) return null;
  const busy = new Set(open(state).flatMap(t => [t.h, t.x, t.y]));
  const cands = [];
  for (const h of state.villa) {
    if (busy.has(h)) continue;
    const suitors = state.villa.filter(n => n !== h && !busy.has(n) && compatible(state, n, h) && compatible(state, h, n)
      && (!state.split || state.casa.includes(n) === state.casa.includes(h))
      && romance(n, h) >= 3 && (attr(state, h, n) ?? 0) >= 4);
    if (suitors.length < 2) continue;
    suitors.sort((p, q) => romance(q, h) - romance(p, h));
    const [x, y] = suitors;
    // How torn: both pulls close together, and both real.
    const ax = attr(state, h, x) ?? 0, ay = attr(state, h, y) ?? 0;
    const split = 1 - Math.abs(ax - ay) / 10;
    const heat = (Math.min(romance(x, h), romance(y, h)) / 10) * split * (Math.min(ax, ay) / 10);
    cands.push({ h, x, y, w: heat });
  }
  const pick = cands.sort((a, b) => b.w - a.w).find(c => rng() < Math.min(0.45, c.w * 1.0));
  return pick || null;
}

/** The day's triangle scenes: a new one may form; each open one moves a step. */
export function triangles(state, rng, entry = null) {
  if (entry && (entry.moment === 'final' || entry.moment === 'reunion')) return [];
  const out = [];
  // Every triangle scene carries the three of them and how the one in the
  // middle feels about each, for the diagram on the stage (vp-pm/stage.js).
  const ev = (kind, players, extra, major = [], tri = null) => {
    const e = makeEvent(state, rng, { phase: 'triangle', kind, players, aired: true, major,
      extra: { pop: {}, ...extra, ...(tri ? { tri: triInfo(state, tri) } : {}) } });
    out.push(e); return e;
  };
  // Resolve what the night already decided: a recoupling, or somebody gone.
  for (const t of open(state)) {
    const here = n => state.villa.includes(n);
    if (!here(t.h)) { t.over = true; continue; }
    if (!here(t.x) || !here(t.y)) {
      const [w, l] = here(t.x) ? [t.x, t.y] : [t.y, t.x];
      t.over = true;
      if (here(w) && !(state.split && state.casa.includes(w) !== state.casa.includes(t.h))) ev('triangle-choice', [t.h, w, l], { of: 'default', pop: {} }, [], t);
      continue;
    }
    const p = partnerOf(state, t.h);
    // A recoupling decides it — staying with the same one is a choice too.
    const recoupled = ['recoupling', 'semi-final', 'stick-or-twist'].includes(entry?.moment);
    if (p && (p === t.x || p === t.y) && (p !== t.partnerAt || recoupled)) {
      const w = p, l = p === t.x ? t.y : t.x;
      t.over = true;
      breakHeart(state, l, t.h, 5 * romance(l, t.h) / 10);
      feel(state, w, 'security', 1.5);
      ev('triangle-choice', [t.h, w, l], { of: 'pick', pop: { [t.h]: { approval: 0, fame: 2 }, [l]: { approval: 1.5, fame: 2 } } }, [t.h, w, l], t);
    }
  }
  // A new one.
  const f = detect(state, rng);
  if (f) {
    const t = { ...f, ep: state.ep, stage: 0, over: false, partnerAt: partnerOf(state, f.h) || null };
    state.triangles.push(t);
    const g = n => state.profiles[n]?.gender;
    const friend = state.villa.filter(n => n !== t.h && n !== t.x && n !== t.y && g(n) === g(t.h))
      .sort((p, q) => getBond(t.h, q) - getBond(t.h, p))[0];
    feel(state, t.h, 'stress', 0.8);
    if (friend) ev('triangle-torn', [t.h, friend], { pop: { [t.h]: { approval: 0, fame: 1.5 } } }, [], t);
    // The rivals often clock each other the same day (measured: half the
    // triangles were settled by the next recoupling before they had one scene).
    if (rng() < 0.6) advance(state, rng, t, ev);
    return out;
  }
  // Each open triangle moves up to two steps an episode, or holds — and holds
  // while Casa Amor has them in different villas (read, season 21: Nadia, in
  // Casa, cornered Callum in the main villa with "Me or Mia?").
  const together = t => !state.split || [t.x, t.y].every(n => state.casa.includes(n) === state.casa.includes(t.h));
  for (const t of open(state)) {
    if (t.ep === state.ep || !together(t)) continue;
    for (let k = 0; k < 2 && !t.over; k++) if (rng() >= 0.3) advance(state, rng, t, ev);
  }
  return out;
}

function advance(state, rng, t, ev) {
  {
    const { h, x, y } = t;
    const S = n => state.profiles[n]?.stats || {};
    t.stage++;
    if (t.stage === 1) {
      // The two of them, face to face.
      addBond(x, y, -1); addBond(y, x, -1);
      jealousOf(state, x, y, 1.2); jealousOf(state, y, x, 1.2);
      const clash = rng() < ((10 - (S(x).temperament ?? 5)) + (10 - (S(y).temperament ?? 5))) / 22;
      ev('triangle-rivals', [x, y, h], { of: clash ? 'clash' : 'size-up', pop: { [x]: { approval: clash ? -0.5 : 0, fame: 1.5 }, [y]: { approval: clash ? -0.5 : 0, fame: 1.5 } } }, clash ? [x, y] : [], t);
    } else if (t.stage === 2) {
      // Each makes the case; the more persuasive one moves the one in the middle.
      for (const [a, other] of [[x, y], [y, x]]) {
        const pull = ((S(a).social ?? 5) + (S(a).boldness ?? 5)) / 20;
        nudgeAttraction(state, h, a, 0.2 + 0.6 * pull * rng());
        const bb = behindOf(state, t, [[h, a, 'pull', 0.7], [a, h, 'pull', 0.7]]);
        const e = ev('triangle-case', [a, h, other], { ...(bb.length ? { behind: whose(bb, h) } : {}), pop: { [a]: { approval: 0.2, fame: 1 } } }, [], t);
        keepSecrets(state, e, bb);
      }
      feel(state, h, 'stress', 0.6);
    } else if (t.stage === 3) {
      // The villa takes sides.
      const teams = { X: [], Y: [] };
      for (const n of state.villa) {
        if ([h, x, y].includes(n)) continue;
        const lean = getBond(n, x) - getBond(n, y);
        if (lean > 1) teams.X.push(n); else if (lean < -1) teams.Y.push(n);
      }
      for (const n of teams.X) addBond(n, y, -0.2);
      for (const n of teams.Y) addBond(n, x, -0.2);
      ev('triangle-teams', [h, x, y], { teams }, [], t);
    } else {
      // The ultimatum: the boldest, most jealous one says choose.
      const push = n => (S(n).boldness ?? 5) / 10 + Math.min(1, (state.emo?.[n]?.jealousy?.[n === x ? y : x] || 0) / 5);
      const a = push(x) >= push(y) ? x : y, b = a === x ? y : x;
      if (rng() < 0.3 + 0.3 * push(a)) {
        const ra = attr(state, h, a) ?? 0, rb = attr(state, h, b) ?? 0;
        // Answered from the feelings, plus the pressure of being asked.
        const r = rng();
        const pA = Math.max(0.1, Math.min(0.8, 0.35 + (ra - rb) / 10));
        const of = r < pA * 0.8 ? 'chose-x' : r < pA * 0.8 + (1 - pA) * 0.6 ? 'chose-y' : 'not-yet';
        if (of === 'chose-x') { nudgeAttraction(state, h, a, 0.8); nudgeAttraction(state, h, b, -0.6); breakHeart(state, b, h, 3 * romance(b, h) / 10); }
        if (of === 'chose-y') { nudgeAttraction(state, h, b, 0.8); nudgeAttraction(state, h, a, -0.8); breakHeart(state, a, h, 3 * romance(a, h) / 10); }
        if (of === 'not-yet') { addBond(a, h, -0.6); feel(state, a, 'stress', 0.8); }
        // Choosing someone while coupled with somebody else is a promise made
        // behind that partner's back; asking for it while coupled is a pull.
        const chosen = of === 'chose-x' ? a : of === 'chose-y' ? b : null;
        const bb = behindOf(state, t, [[h, chosen || a, chosen ? 'promise' : 'pull', chosen ? 1.2 : 0.6], [a, h, 'pull', 0.8]]);
        const e = ev('triangle-ultimatum', [a, h, b], { of, ...(bb.length ? { behind: whose(bb, h) } : {}), pop: { [a]: { approval: of === 'chose-x' ? 1 : -0.3, fame: 2 }, [h]: { approval: of === 'not-yet' ? -0.8 : 0, fame: 2 } } }, [a, h], t);
        keepSecrets(state, e, bb);
        // A clear answer is the end of the triangle as a triangle.
        if (of !== 'not-yet') t.over = true;
      }
    }
  }
}
