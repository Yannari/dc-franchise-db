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
//
// What a clip can be, strongest first: a pull or a kiss behind the partner's
// back (a secret); what was said about the partner in a debrief (`said`); a
// two-faced beach hut; and, as the show always mixes in, one loyal moment —
// somebody turning a pull down, with the partner watching it for the first
// time.
import { addBond, getBond } from '../bonds.js';
import { addRelationshipDimension } from '../relationships.js';
import { makeEvent, partnerOf, airLater } from './events.js';
import { romance, revealTruth } from './feelings.js';
import { emo, feel, jealousyHit, breakHeart } from './emotions.js';
import { BETRAYAL } from './ledger.js';
import { noteBreakup } from './exes.js';

const LOOKBACK = 3;          // episodes of footage the producers pick from
const MAX_CLIPS = 4;
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
};
function titleFor(c, used) {
  const pool = TITLES[c.e.extra?.rebuffed ? 'rebuffed' : c.what] || ['Unseen'];
  const t = pool.find(x => !used.has(x)) || pool[0];
  used.add(t);
  return t;
}

/** The clip's own words, as they were said: the only thing Movie Night shows. */
function footage(e, hutOnly) {
  const src = hutOnly ? e.hut?.script : e.script;
  const lines = (src?.lines || []).map(l => ({ who: l.who, text: l.text, ...(l.action ? { action: true } : {}) }));
  return { lines, stage: hutOnly ? null : src?.stage || null, beat: hutOnly ? null : src?.beat || null };
}

function candidates(state) {
  const out = [];
  const shown = new Set(state.shownClips || []);
  const recent = state.history.filter(e => e.ep >= state.ep - LOOKBACK && !shown.has(e.id));
  for (const [x, p] of state.couples.flatMap(c => [c, [c[1], c[0]]])) {
    if (!state.villa.includes(x) || !state.villa.includes(p)) continue;
    for (const e of recent) {
      if (!e.players.includes(x) || e.players.includes(p)) continue;
      const sec = state.secrets.find(s => s.eventId === e.id && s.who === x && s.partner === p && !s.known);
      // A secret: the pull, the kiss, the night in the hideaway.
      if (sec) out.push({ e, x, p, sev: sec.severity, what: sec.kind === 'kiss' ? 'kiss' : sec.kind === 'bed' ? 'hideaway' : sec.kind === 'said' ? 'debrief' : sec.kind === 'promise' ? 'promise' : e.kind, sec, rival: sec.with });
      // What was said in a debrief, about the partner in the audience.
      else if (e.kind === 'debrief' && e.players[0] === x && ['meh', 'bomb-fancy', 'rather'].includes(e.extra?.of) && partnerOf(state, x) === p)
        out.push({ e, x, p, sev: 0.7, what: 'debrief', rival: e.players[2] || null });
      // A beach hut, two-faced, about any scene of theirs.
      else if (e.hut?.who === x && e.hut.stance === 'two-faced') out.push({ e, x, p, sev: 0.5, what: 'hut', hut: true, rival: null });
      // Turning a pull down: the good clip.
      else if (e.kind === 'loyalty' && e.players[0] === x) out.push({ e, x, p, sev: 0, what: 'loyalty', good: true, rival: e.players[1] });
    }
  }
  return out;
}

/** Movie Night's events, in the order the villa lives them. */
export function movieNight(state, rng) {
  const cands = candidates(state);
  const bad = cands.filter(c => !c.good).sort((a, b) => b.sev - a.sev || (b.e.aired ? 0 : 1) - (a.e.aired ? 0 : 1));
  const picked = [], subjects = new Set();
  for (const c of bad) {
    if (picked.length >= MAX_CLIPS - 1) break;
    if (subjects.has(c.x) || subjects.has(c.p)) continue;
    picked.push(c); subjects.add(c.x);
  }
  const good = cands.find(c => c.good && !subjects.has(c.x));
  if (good) picked.push(good);
  if (!picked.length) return [];
  state.shownClips = [...(state.shownClips || []), ...picked.map(c => c.e.id)];

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
  const nervous = picked.filter(c => !c.good).map(c => c.x);
  const seat = nervous[0] || picked[0].x;
  ev('movie-seat', [seat, partnerOf(state, seat) || picked[0].p], { of: nervous.length ? 'guilty' : 'easy' });

  const usedTitles = new Set();
  for (const c of picked) {
    const { e, x, p } = c;
    const title = titleFor(c, usedTitles);
    // The clip: the scene itself, in its own words.
    const clip = footage(e, !!c.hut);
    const shownE = ev('movie-clip', c.hut ? [x] : [...e.players], {
      of: c.what, title, clipOf: e.id, clipEp: e.ep, clipDay: e.day ?? null, audience: [p, x],
      pop: c.good ? { [x]: { approval: 2.5, fame: 2 } } : { [x]: { approval: -BETRAYAL.movieNight * Math.min(1, 0.5 + c.sev), fame: 2 } } },
      [x, p]);
    shownE.script = { id: `clip:${e.id}`, stage: `Now showing: ${title}.`, lines: clip.lines, beat: null };
    if (!e.aired) airLater(state, e);
    // What it does to the one watching.
    let of;
    if (c.good) {
      addBond(p, x, 0.8); addRelationshipDimension(p, x, 'trust', 1.2); feel(state, p, 'security', 1);
      of = 'relief';
    } else {
      revealTruth(state, p, x);
      if (c.sec) c.sec.known = true;
      for (const s of state.secrets) if (s.who === x && s.partner === p && s.said && !s.known && c.what === 'debrief') s.known = true;
      jealousyHit(state, p, x, c.rival || x, (c.hut ? 3 : 5) * Math.max(0.5, c.sev), { confirmed: true });
      addRelationshipDimension(p, x, 'trust', -1.5 * Math.max(0.5, c.sev));
      addBond(p, x, -1.2 * Math.max(0.5, c.sev));
      // Hurt or fury: the watcher's own temper, in proportion.
      const temper = state.profiles[p]?.stats?.temperament ?? 5;
      of = rng() < (10 - temper) / 12 ? 'fury' : 'hurt';
    }
    const gasp = state.villa.find(n => n !== p && n !== x && getBond(n, p) > 0);
    ev('movie-react', gasp && !c.good ? [p, x, gasp] : [p, x], { of,
      pop: { [p]: { approval: c.good ? 0.5 : 1.5, fame: 1.5 } } }, c.good ? [] : [p]);
  }

  // After the screen goes dark: the rows (user: "big fights … let it stem from
  // jealousy, cheating").
  for (const c of picked.filter(k => !k.good)) {
    if (partnerOf(state, c.x) !== c.p) continue;
    events.push(...confrontation(state, rng, { p: c.p, x: c.x, sev: c.sev, rowKind: 'movie-row', splitKind: 'movie-split', phase: 'cinema' }));
  }
  return events;
}

/**
 * The row after a betrayal comes out (Movie Night, the photos, Casa Amor):
 * the one caught owns it, denies it or is walked away from — their own
 * loyalty and temper against their strategy — and the one hurt may end it
 * there: what they found out, against what they feel.
 */
export function confrontation(state, rng, { p, x, sev, rowKind, splitKind, phase, split = true }) {
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
    breakHeart(state, x, p, 3 * romance(x, p) / 10);
    out.push(makeEvent(state, rng, { phase, kind: splitKind, players: [p, x], aired: true, major: [p, x],
      extra: { pop: { [p]: { approval: 2, fame: 2.5 }, [x]: { approval: -1.5, fame: 2.5 } } } }));
  }
  return out;
}
