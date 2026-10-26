// ══════════════════════════════════════════════════════════════════════
// pm/movie-night.js — Movie Night, as the show plays it
// ══════════════════════════════════════════════════════════════════════
//
// User: "with its own look … real new images with reactions and drama, I
// want to be glued to my chair — but don't invent things". Everything on the
// screen HAPPENED: a clip is a real scene from this season, replayed in its
// own words, that the partner in the audience never saw. The show's real
// Movie Night (UK 2021, 2022…) is where its biggest rows start — Faye and
// Teddy's drew the most Ofcom complaints the show has ever had — so the
// night does not end when the screen goes dark.
//
//   movie-text   [a, (b)]       the text: it's Movie Night
//   movie-seat   [a, b]         a couple finds a seat, nervous or not
//   movie-clip   [clip's own]   the replay: its script IS the original lines
//   movie-react  [a, b, (c)]    `of`: hurt · fury · relief · smug · gasp
//                               a is the partner watching, b is on screen
//   movie-row    [a, b]         `of`: own-it · deny · walk-off — a confronts b
//   movie-split  [a, b]         a ends it with b, there and then
//   movie-callout [a, b]        a was talked about on screen, and finds b after.
//                               `of`: sorry · stands-by · deny
//   movie-after  [a, b, c]      two friends, once the cinema empties, on c — who came off worst
//
// The reel (rebuilt 2026-10-26, user: "just 29 frames and 1 or 2 videos"):
// everything since the last Movie Night, not three episodes; Casa Amor's
// moments the photos left out (the real Movie Night is mostly Casa); up to
// five betrayals, two things said behind somebody's back, a loyal moment,
// something sweet, and something to laugh at first.
//
// What a clip can be, strongest first: a pull or a kiss behind the partner's
// back (a secret); what was said about the partner in a debrief (`said`); a
// two-faced beach hut; and, as the show always mixes in, one loyal moment —
// somebody turning a pull down, with the partner watching it for the first
// time.
import { addBond, getBond } from '../bonds.js';
import { addRelationshipDimension } from '../relationships.js';
import { makeEvent, partnerOf, airLater } from './events.js';
import { romance, revealTruth, schemeEligible } from './feelings.js';
import { emo, feel, jealousyHit, breakHeart } from './emotions.js';
import { BETRAYAL } from './ledger.js';
import { noteBreakup } from './exes.js';
import { recordSplit } from './breakups.js';

const MAX_BAD = 5;           // betrayals on the reel
const MAX_SAID = 2;          // things said behind somebody's back
// Each clip gets a title card, as the show's Movie Night does — a name for
// the scene, never a word about it that the scene does not show.
const TITLES = {
  pull: ['Behind Your Back', 'Caught Out', 'Crossing the Line', 'The Chat', 'Mixed Signals'],
  rebuffed: ['Knocked Back', 'Not Interested', 'Shot Down'],
  kiss: ['The Kiss', 'Lip Service', 'Caught in the Act'], hideaway: ['After Dark', 'Behind Closed Doors'],
  'head-turned': ['Wandering Eyes', 'Second Thoughts'], 'challenge-kiss': ['Game On', 'Just a Game?'],
  date: ['The Date', 'Table for Two'], debrief: ['What They Said', 'Off the Record', 'Loose Lips'],
  hut: ['Confessions', 'Two Faces', 'Straight to Camera'], loyalty: ['The Loyal One', 'Faithful', 'Hands Off'],
  promise: ['Big Plans', 'See You Outside', 'Future Talk'],
  said: ['Not to Your Face', 'What They Really Think', 'Said Out Loud'], funny: ['Outtakes', 'Villa Life', 'The Blooper Reel'],
  sweet: ['Love Story', 'The Sweet Bit', 'Meant Every Word'],
};
function titleFor(c, used) {
  const pool = TITLES[c.e.extra?.rebuffed ? 'rebuffed' : c.what] || ['Unseen'];
  const t = pool.find(x => !used.has(x)) || pool[0];
  used.add(t);
  return t;
}

/**
 * The clip's own words, as they were said: the only thing Movie Night shows.
 * A whole conversation (pm/talk/, since the 2026-10-22 rebuild) is clipped to
 * where it lands: its last few lines and its closing beat (the kiss, the
 * promise, the no), never "Can I grab you for a chat?" from its opening.
 */
const CLIP_LINES = 8;
function footage(e, hutOnly) {
  const src = hutOnly ? e.hut?.script : e.script;
  let lines = (src?.lines || []).map(l => ({ who: l.who, text: l.text, ...(l.action ? { action: true } : {}) }));
  if (!hutOnly && lines.length > CLIP_LINES) {
    let at = lines.length - CLIP_LINES;
    while (at < lines.length - 1 && lines[at].action) at++;   // start on somebody speaking
    lines = lines.slice(at);
  }
  if (!hutOnly && src?.beat) lines.push({ who: '', text: src.beat, action: true });
  return { lines, stage: hutOnly ? null : src?.stage || null, beat: null };
}

function candidates(state) {
  const out = [];
  const shown = new Set(state.shownClips || []);
  // Everything since the last Movie Night (the whole season, the first time):
  // three episodes of footage found two clips on season 1's night.
  const since = state.lastMovieNight ?? 0;
  const recent = state.history.filter(e => e.ep > since && !shown.has(e.id));
  const here = n => !!n && state.villa.includes(n);
  for (const [x, p] of state.couples.flatMap(c => [c, [c[1], c[0]]])) {
    if (!here(x) || !here(p)) continue;
    for (const e of recent) {
      if (!e.players.includes(x) || e.players.includes(p)) continue;
      // Casa Amor's secrets are the photos' to show (moments.js photos), until
      // they have been; the ones the photos left out are Movie Night's. (The
      // real Movie Night comes after Casa, and Casa is most of its footage.)
      const sec = state.secrets.find(s => s.eventId === e.id && s.who === x && s.partner === p && !s.known && (!s.casa || state.photosShown));
      // A secret: the pull, the kiss, the night in the hideaway.
      if (sec) out.push({ e, x, p, sev: sec.severity, what: sec.kind === 'kiss' ? 'kiss' : sec.kind === 'bed' ? 'hideaway' : sec.kind === 'said' ? 'debrief' : sec.kind === 'promise' ? 'promise' : e.kind, sec, rival: sec.with });
      // What was said in a debrief, about the partner in the audience.
      else if (e.kind === 'debrief' && e.players[0] === x && ['meh', 'bomb-fancy', 'rather'].includes(e.extra?.of) && partnerOf(state, x) === p)
        out.push({ e, x, p, sev: 0.7, what: 'debrief', rival: e.players[2] || null });
      // A beach hut, two-faced, about any scene of theirs.
      // …that says something about the partner watching: "Confessions" once played
      // "I agreed with whatever was said", and Jordan blew up over it (season read 2026-10-25).
      else if (e.hut?.who === x && e.hut.stance === 'two-faced' && (e.hut.script?.lines || []).some(l => l.text.includes(p)))
        out.push({ e, x, p, sev: 0.5, what: 'hut', hut: true, rival: null });
      // Turning a pull down: the good clip.
      else if (e.kind === 'loyalty' && e.players[0] === x) out.push({ e, x, p, sev: 0, what: 'loyalty', good: true, rival: e.players[1] });
    }
  }
  for (const e of recent) {
    // What somebody said ABOUT somebody else, not to their face: the debrief
    // after a steal, a dumping, a bombshell (debrief.js) — watched by the one
    // it was about, who is not a partner. The villa's feuds start here.
    if (e.kind === 'debrief' && SAID.has(e.extra?.of) && here(e.players[0]) && here(e.players[2]) && e.players[0] !== e.players[2])
      out.push({ e, x: e.players[0], p: e.players[2], sev: 0.6, what: 'said', said: true, rival: null });
    // The show always plays something to laugh at, and something sweet.
    else if (e.kind === 'comedy' && e.aired && e.players.filter(here).length >= 2)
      out.push({ e, x: e.players[0], p: e.players.find((n, i) => i > 0 && here(n)), sev: 0, what: 'funny', light: true });
    else if (SWEET.has(e.kind) && here(e.players[0]) && here(e.players[1]) && partnerOf(state, e.players[0]) === e.players[1])
      out.push({ e, x: e.players[0], p: e.players[1], sev: 0, what: 'sweet', light: true, good: true });
  }
  // A clip is its own words: a scene with none (never written out) shows an
  // empty screen, and a 'said' clip has to say the name of the one watching.
  return out.filter(c => {
    const lines = footage(c.e, !!c.hut).lines.filter(l => !l.action);
    if (lines.length < (c.hut ? 1 : 2)) return false;
    return !c.said || lines.some(l => l.who === c.x && l.text.includes(c.p));
  });
}
const SAID = new Set(['robbed', 'blame', 'bomb-threat']);
const SWEET = new Set(['love-said', 'exclusive-ask', 'official-ask', 'declaration']);

/** Movie Night's events, in the order the villa lives them. */
export function movieNight(state, rng) {
  const cands = candidates(state);
  const bad = cands.filter(c => !c.good && !c.said && !c.light).sort((a, b) => b.sev - a.sev || (b.e.aired ? 0 : 1) - (a.e.aired ? 0 : 1));
  // One scene, one clip: when both of the people in it were coupled to
  // somebody else, the second joins the first's clip and both partners
  // watch it (season 33 showed Callum and Ellie's scene twice, once as
  // "Behind Your Back" for Priya and again as "Crossing the Line" for Reece).
  const picked = [], subjects = new Set(), byScene = new Map();
  for (const c of bad) {
    const same = byScene.get(c.e.id);
    if (same) {
      if (!subjects.has(c.x) && !subjects.has(c.p)) { (same.also ||= []).push(c); subjects.add(c.x); }
      continue;
    }
    if (picked.length >= MAX_BAD) continue;
    if (subjects.has(c.x) || subjects.has(c.p)) continue;
    picked.push(c); subjects.add(c.x); byScene.set(c.e.id, c);
  }
  // What was said behind somebody's back: two at most, never on a scene
  // already showing, and never the same two people twice.
  const pairs = new Set();
  const said = [];
  for (const c of cands.filter(k => k.said).sort(() => rng() - 0.5)) {
    const k = [c.x, c.p].sort().join('|');
    if (said.length >= MAX_SAID || pairs.has(k) || byScene.has(c.e.id)) continue;
    said.push(c); pairs.add(k); byScene.set(c.e.id, c);
  }
  const good = cands.find(c => c.what === 'loyalty' && !subjects.has(c.x));
  const sweet = cands.filter(c => c.what === 'sweet' && !subjects.has(c.x) && !subjects.has(c.p)).sort(() => rng() - 0.5)[0];
  const funny = cands.filter(c => c.what === 'funny').sort(() => rng() - 0.5)[0];
  if (!picked.length && !said.length && !good) return [];
  // The running order, as the show cuts it: something to laugh at first, the
  // worst saved for last, the rest in between.
  const worst = picked.shift();
  const middle = [...picked.reverse()];
  said.forEach((c, i) => middle.splice(Math.min(middle.length, 1 + 2 * i), 0, c));
  for (const c of [good, sweet].filter(Boolean)) middle.splice(Math.floor(middle.length / 2), 0, c);
  const reel = [funny, ...middle, worst].filter(Boolean);
  state.shownClips = [...(state.shownClips || []), ...reel.map(c => c.e.id)];
  state.lastMovieNight = state.ep;

  const events = [];
  const ev = (kind, players, extra = {}, major = []) => {
    const e = makeEvent(state, rng, { phase: 'cinema', kind, players, aired: true, major, extra: { pop: {}, ...extra } });
    events.push(e);
    return e;
  };
  // The text, then the seats.
  const reader = state.villa[Math.floor(rng() * state.villa.length)];
  const other = state.villa.find(n => n !== reader && partnerOf(state, reader) === n) || state.villa.find(n => n !== reader);
  ev('movie-text', other ? [reader, other] : [reader]);
  const nervous = reel.filter(c => !c.good && !c.light && !c.said).map(c => c.x);
  const seat = nervous[0] || reel.find(c => partnerOf(state, c.x))?.x;
  if (seat && partnerOf(state, seat)) ev('movie-seat', [seat, partnerOf(state, seat)], { of: nervous.length ? 'guilty' : 'easy' });

  const usedTitles = new Set();
  const hits = {};               // who came off worst, for the talk after
  for (const c0 of reel) {
    const { e } = c0;
    const title = titleFor(c0, usedTitles);
    const watchers = [c0, ...(c0.also || [])];
    // The clip: the scene itself, in its own words.
    const clip = footage(e, !!c0.hut);
    const clipPop = c0.light ? Object.fromEntries(e.players.filter(n => state.villa.includes(n)).map(n => [n, { approval: c0.what === 'sweet' ? 1.2 : 0.5, fame: 1 }]))
      : Object.fromEntries(watchers.map(w => [w.x, w.good ? { approval: 2.5, fame: 2 } : { approval: -(w.said ? 1 : BETRAYAL.movieNight * Math.min(1, 0.5 + w.sev)), fame: 2 }]));
    const shownE = ev('movie-clip', c0.hut ? [c0.x] : [...e.players], {
      of: c0.what, title, clipOf: e.id, clipEp: e.ep, clipDay: e.day ?? null, audience: c0.light ? [c0.x, c0.p] : watchers.flatMap(w => [w.p, w.x]),
      pop: clipPop }, c0.light ? [] : watchers.flatMap(w => [w.x, w.p]));
    shownE.script = { id: `clip:${e.id}`, stage: `Now showing: ${title}.`, lines: clip.lines, beat: null };
    if (!e.aired) airLater(state, e);
    if (c0.light) {
      // Everyone in it laughs, or goes red; the villa's warmer for it.
      const cast = e.players.filter(n => state.villa.includes(n));
      for (const a of cast) for (const b of cast) if (a < b) addBond(a, b, c0.what === 'sweet' ? 0.6 : 0.3);
      if (c0.what === 'sweet') { feel(state, c0.x, 'security', 1); feel(state, c0.p, 'security', 1); }
      ev('movie-react', [c0.x, c0.p], { of: c0.what === 'sweet' ? 'aww' : 'laugh', pop: {} });
      continue;
    }
    for (const c of watchers) {
      const { x, p } = c;
      // What it does to the one watching.
      let of;
      if (c.good) {
        addBond(p, x, 0.8); addRelationshipDimension(p, x, 'trust', 1.2); feel(state, p, 'security', 1);
        of = 'relief';
      } else if (c.said) {
        // Not a partner: a friend, a rival, the one who stole — finding out
        // what was said about them when they weren't there.
        addBond(p, x, -1.5); addRelationshipDimension(p, x, 'resentment', 1.2); addRelationshipDimension(p, x, 'trust', -1);
        feel(state, p, 'stress', 0.5);
        hits[x] = (hits[x] || 0) + 1;
        of = 'called';
      } else {
        revealTruth(state, p, x);
        if (c.sec) c.sec.known = true;
        for (const s of state.secrets) if (s.who === x && s.partner === p && s.said && !s.known && c.what === 'debrief') s.known = true;
        jealousyHit(state, p, x, c.rival || x, (c.hut ? 3 : 5) * Math.max(0.5, c.sev), { confirmed: true });
        addRelationshipDimension(p, x, 'trust', -1.5 * Math.max(0.5, c.sev));
        addBond(p, x, -1.2 * Math.max(0.5, c.sev));
        hits[x] = (hits[x] || 0) + 1 + c.sev;
        // Hurt or fury: the watcher's own temper, in proportion.
        const temper = state.profiles[p]?.stats?.temperament ?? 5;
        of = rng() < (10 - temper) / 12 ? 'fury' : 'hurt';
      }
      const gasp = state.villa.find(n => n !== p && n !== x && getBond(n, p) > 0);
      ev('movie-react', gasp && !c.good ? [p, x, gasp] : [p, x], { of,
        pop: { [p]: { approval: c.good ? 0.5 : 1.5, fame: 1.5 } } }, c.good ? [] : [p]);
    }
  }

  // After the screen goes dark: the rows (user: "big fights … let it stem from
  // jealousy, cheating").
  for (const c of reel.filter(k => !k.good && !k.light && !k.said).flatMap(k => [k, ...(k.also || [])])) {
    if (partnerOf(state, c.x) !== c.p) continue;
    events.push(...confrontation(state, rng, { p: c.p, x: c.x, sev: c.sev, rowKind: 'movie-row', splitKind: 'movie-split', phase: 'cinema', about: c.rival || null }));
  }
  // …and the ones who were talked about go and find who said it. How it is
  // answered is the speaker's own: the loyal and calm say sorry, the bold
  // stand by it, and only those who may scheme say it was cut (CLAUDE.md).
  for (const c of said) {
    const S = state.profiles[c.x]?.stats || {};
    const of = weightedOf(rng, [
      ['sorry', ((S.loyalty ?? 5) + (S.temperament ?? 5)) / 20],
      ['stands-by', ((S.boldness ?? 5) / 10) * (1 - (S.temperament ?? 5) / 20)],
      ['deny', schemeEligible(state.profiles[c.x]) ? (S.strategic ?? 5) / 15 : 0],
    ]);
    if (of === 'sorry') { addBond(c.p, c.x, 0.7); addRelationshipDimension(c.p, c.x, 'resentment', -0.5); }
    if (of === 'stands-by') { addBond(c.p, c.x, -0.8); addRelationshipDimension(c.p, c.x, 'resentment', 0.8); }
    if (of === 'deny') { addBond(c.p, c.x, -1); addRelationshipDimension(c.p, c.x, 'trust', -1); }
    ev('movie-callout', [c.p, c.x], { of,
      pop: { [c.x]: { approval: of === 'sorry' ? 0.6 : of === 'deny' ? -1.2 : -0.3, fame: 1.5 }, [c.p]: { approval: 0.5, fame: 1 } } }, [c.p, c.x]);
  }
  // The cinema empties, and two friends go over who came off worst.
  const worstOne = Object.entries(hits).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (worstOne && state.villa.includes(worstOne)) {
    const pool = state.villa.filter(n => n !== worstOne && n !== partnerOf(state, worstOne) && getBond(n, worstOne) < 2);
    let best = null;
    for (const a of pool) for (const b of pool) if (a < b && getBond(a, b) > (best?.bond ?? 2)) best = { a, b, bond: getBond(a, b) };
    if (best) {
      addBond(best.a, best.b, 0.3); addBond(best.a, worstOne, -0.4); addBond(best.b, worstOne, -0.4);
      ev('movie-after', [best.a, best.b, worstOne], { pop: { [worstOne]: { approval: -0.5, fame: 1 } } });
    }
  }
  return events;
}

function weightedOf(rng, opts) {
  const total = opts.reduce((s, [, w]) => s + Math.max(0, w), 0);
  let r = rng() * total;
  for (const [k, w] of opts) { r -= Math.max(0, w); if (r <= 0) return k; }
  return opts[0][0];
}

/**
 * The row after a betrayal comes out (Movie Night, the photos, Casa Amor):
 * the one caught owns it, denies it or is walked away from — their own
 * loyalty and temper against their strategy — and the one hurt may end it
 * there: what they found out, against what they feel.
 */
export function confrontation(state, rng, { p, x, sev, rowKind, splitKind, phase, split = true, about = null }) {
  const out = [];
  const S = state.profiles[x]?.stats || {};
  const honest = ((S.loyalty ?? 5) + (S.temperament ?? 5)) / 20;
  const sly = (S.strategic ?? 5) / 10;
  const r = rng();
  const of = r < honest * 0.7 ? 'own-it' : r < honest * 0.7 + sly * 0.5 ? 'deny' : 'walk-off';
  if (of === 'own-it') { addRelationshipDimension(p, x, 'trust', 0.5); addBond(p, x, -0.3); }
  if (of === 'deny') { addRelationshipDimension(p, x, 'trust', -1.0); addBond(p, x, -0.8); }
  if (of === 'walk-off') feel(state, p, 'stress', 1.0);
  out.push(makeEvent(state, rng, { phase, kind: rowKind, players: [p, x], aired: true, major: [p, x],
    extra: { of, pop: { [x]: { approval: of === 'deny' ? -2 : of === 'own-it' ? 0.5 : -0.5, fame: 2 }, [p]: { approval: 0.5, fame: 1.5 } } } }));
  // One couple ends a night, at most: Movie Night and the photos share the
  // same evening, and four break-ups at once (measured) emptied the villa
  // too late for any recoupling to mend it — three-couple finals.
  if (!split || partnerOf(state, x) !== p || state._splitEp === state.ep) return out;
  const jealous = Object.values(emo(state, p).jealousy || {}).reduce((m, v) => Math.max(m, v), 0);
  const pEnd = Math.max(0, Math.min(0.8, 0.1 + 0.35 * sev + 0.03 * jealous + (of === 'deny' ? 0.15 : 0) - 0.05 * romance(p, x)));
  if (rng() < pEnd) {
    state.couples = state.couples.filter(k => !(k.includes(p) && k.includes(x)));
    state._splitEp = state.ep;
    noteBreakup(state, { ender: p, wrong: x, severity: sev, cause: splitKind });
    // Caught on camera: p ends it, x is left (breakups.js).
    const splitRec = recordSplit(state, { by: p, left: x, cause: 'cheated', about });
    breakHeart(state, x, p, 3 * romance(x, p) / 10);
    out.push(makeEvent(state, rng, { phase, kind: splitKind, players: [p, x], aired: true, major: [p, x],
      extra: { splitRec, pop: { [p]: { approval: 2, fame: 2.5 }, [x]: { approval: -1.5, fame: 2.5 } } } }));
  }
  return out;
}
