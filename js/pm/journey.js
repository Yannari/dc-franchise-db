// ══════════════════════════════════════════════════════════════════════
// pm/journey.js — the final dates: each couple watches their own story
// ══════════════════════════════════════════════════════════════════════
//
// User: "a recap of the adventure of each couple, with real moments, ups and
// downs, everything … long enough, with their actual story, with narration
// and their reaction while watching, structured but all different from each
// other, depending on their run in the show."
//
// The real show, before the vote: every finalist couple has a final date,
// and is shown their time in the villa — on the UK show a film of their
// journey, on the US one a walk through photographs of it ("many of the
// photos featured the couples' early kisses, others captured hilarious
// moments from challenges"; today.com, US 8). Then the declarations, then
// the ceremony. (Fans complained when the 2026 UK final dropped the final
// dates and the declarations: heatworld.)
//
// THE STORY IS THE RECORD. Every chapter is an event that happened and aired
// — how they met, the coupling that made them a couple, their first real
// kiss, the date, the row and what it was about, the test (a pull, Casa, the
// photos), the split and the way back, the night they were at risk, the "I
// love you". Nothing is written that the record does not hold: a couple who
// never rowed has no row in their film, and a couple who met at Casa starts
// there. Each chapter plays as the narrator over the footage, a line from it,
// and the two of them watching it back.
import { addBond } from '../bonds.js';
import { gs } from '../core.js';
import { makeEvent } from './events.js';
import { romance } from './feelings.js';
import { feel } from './emotions.js';

const COUPLING = new Set(['recouple-pick', 'step-forward', 'step-choose', 'step-last', 'kiss-pick', 'lady-luck-pick', 'profile-pick',
  'public-couple', 'ranking-couple', 'stand-up-pick', 'bombshell-save', 'public-match', 'steal', 'casa-return']);
const NIGHT_ONE = new Set(['first-look', 'step-forward', 'step-choose', 'step-last', 'kiss-pick', 'lady-luck-pick', 'lady-luck-kiss',
  'icebreaker', 'profile-pick', 'public-couple', 'ranking-couple', 'first-arrival', 'arrival-chat']);
const LOVE = new Set(['love-said', 'official-ask', 'exclusive-ask']);
const TEST = new Set(['pull', 'head-turned', 'bed-share', 'kiss', 'date', 'hideaway']);
const CHALLENGE = new Set(['knowing-me', 'couple-goals', 'lip-race', 'blind-run', 'course-pick', 'snogger-kiss', 'talent-act', 'baby-doll', 'tower-q']);
const MAX_CHAPTERS = 8;

const both = (e, a, b) => e.players.includes(a) && e.players.includes(b);

/** The chapters of one couple's story, in the order they happened. */
export function storyOf(state, a, b) {
  const seen = (state.history || []).filter(e => e.aired && e.ep != null);
  const found = [];
  const add = (type, e, about = null) => { if (e && !found.some(c => c.event.id === e.id)) found.push({ type, event: e, about }); };
  // How they met: the first scene the two share.
  const met = seen.find(e => both(e, a, b));
  if (met) add(met.ep === 1 && NIGHT_ONE.has(met.kind) ? 'night-one' : met.kind === 'date' ? 'date-met' : 'met', met);
  // The coupling that first made them a couple.
  const coupled = seen.find(e => COUPLING.has(e.kind) && both(e, a, b));
  add('coupled', coupled !== met ? coupled : null);
  // What tests a couple comes after they were one — by the order it
  // happened, not only the day (season 41: a pull that happened before their
  // coupling, the same day, was in their film as "the test"). A row, a test,
  // Casa, the photos, a night at risk: all after.
  const at = e => seen.indexOf(e);
  const from = at(coupled || met);
  const after = e => at(e) > from;
  // Their first real kiss.
  add('first-kiss', seen.find(e => e.kind === 'kiss' && both(e, a, b) && e.extra?.firstKiss) || seen.find(e => e.kind === 'kiss' && both(e, a, b)));
  // A date, or a night in the hideaway.
  add('date', seen.find(e => (e.kind === 'date' || e.kind === 'hideaway') && both(e, a, b) && e !== met));
  // The row, and what it was about.
  add('row', seen.find(e => (e.kind === 'argument' || e.kind === 'blowup') && both(e, a, b) && after(e)));
  // The test: one of them with somebody else, in front of the villa.
  // Only once they were a couple: before it, a pull is just the villa.
  const tested = seen.find(e => after(e) && TEST.has(e.kind) && (e.players.includes(a) !== e.players.includes(b)) && e.players.length >= 2
    && e.players.some(n => n !== a && n !== b));
  if (tested) add('tested', tested, tested.players.find(n => n !== a && n !== b));
  // Casa Amor and the photos.
  // Casa Amor, only when it was about them: one of them coming back to the other.
  add('casa', seen.find(e => e.kind === 'casa-return' && both(e, a, b)));
  add('photos', seen.find(e => e.kind === 'photos' && both(e, a, b) && after(e)));
  // The split, and the way back.
  const split = seen.find(e => (e.kind === 'movie-split' || e.kind === 'photo-split') && both(e, a, b));
  if (split) { add('split', split); add('back', seen.find(e => e.kind === 'reunite' && both(e, a, b) && e.ep >= split.ep)); }
  // The night they were at risk, and survived it.
  add('at-risk', seen.find(e => e.kind === 'dump-buildup' && both(e, a, b) && after(e)));
  // The "I love you", or making it official.
  add('love', seen.find(e => LOVE.has(e.kind) && both(e, a, b)));
  // A challenge they did together.
  add('challenge', seen.find(e => CHALLENGE.has(e.kind) && both(e, a, b)));
  // In order, the beginning always kept, and no more than the film has room for.
  found.sort((x, y) => at(x.event) - at(y.event));
  if (found.length > MAX_CHAPTERS) {
    const keep = new Set(['night-one', 'met', 'date-met', 'coupled', 'first-kiss', 'love', 'split', 'back']);
    const must = found.filter(c => keep.has(c.type));
    const rest = found.filter(c => !keep.has(c.type)).slice(0, Math.max(0, MAX_CHAPTERS - must.length));
    return found.filter(c => must.includes(c) || rest.includes(c)).slice(0, MAX_CHAPTERS);
  }
  return found;
}

/** The shape of a story, for what they say at the end of it and in the declarations. */
export function shapeOf(chapters, state, a, b) {
  const has = t => chapters.some(c => c.type === t);
  if (has('split')) return 'way-back';
  // One row is a couple; two hard moments are a rocky road (season 41 called
  // all four finalist couples rocky on a row each).
  if (['row', 'tested', 'photos', 'casa', 'at-risk'].filter(has).length >= 2) return 'rocky';
  const start = chapters[0]?.event.ep ?? 1;
  if (start > (state.ep || 1) * 0.5) return 'late';
  return 'steady';
}

/** How each of them felt about the other, episode by episode: the line on the chart. */
function curveOf(a, b) {
  return (gs.episodeHistory || []).filter(r => r?.pm?.relationships).map(r => {
    const rel = r.pm.relationships;
    return [r.num, rel[`${a}→${b}`]?.[0] ?? null, rel[`${b}→${a}`]?.[0] ?? null];
  }).filter(([, x, y]) => x != null || y != null);
}

/**
 * One couple's final date: the date, their film — every chapter the
 * narrator over the footage and the two of them watching — and what they
 * say when it ends. Watching it back brings them closer, in proportion to
 * how much they already feel.
 */
export function finalDate(state, rng, [a, b], n) {
  const events = [];
  const chapters = storyOf(state, a, b);
  const shape = shapeOf(chapters, state, a, b);
  const pop = (x, y) => ({ [a]: { approval: x, fame: y }, [b]: { approval: x, fame: y } });
  events.push(makeEvent(state, rng, { phase: 'final-date', kind: 'final-date', players: [a, b], aired: true,
    extra: { of: ['sunset', 'yacht', 'picnic', 'rooftop'][n % 4], pop: pop(0.2, 1.5) } }));
  events.push(makeEvent(state, rng, { phase: 'final-date', kind: 'journey-open', players: [a, b], aired: true,
    extra: { of: shape, pop: pop(0, 0.5) } }));
  chapters.forEach((c, i) => {
    const day = state.epDay?.[c.event.ep] ?? null;
    events.push(makeEvent(state, rng, { phase: 'final-date', kind: 'journey-clip', players: c.about ? [a, b, c.about] : [a, b], aired: true,
      extra: { of: c.type, clip: c.event.id, clipEp: c.event.ep, day, about: c.about, first: i === 0, pop: pop(0, 0.4) } }));
    // Watching it back: warmer for the good moments, a wince for the bad.
    const sore = ['row', 'tested', 'casa', 'photos', 'split', 'at-risk'].includes(c.type);
    feel(state, a, sore ? 'stress' : 'security', 0.2); feel(state, b, sore ? 'stress' : 'security', 0.2);
    addBond(a, b, sore ? 0.1 : 0.25);
    events.push(makeEvent(state, rng, { phase: 'final-date', kind: 'journey-react', players: [a, b], aired: true,
      extra: { of: c.type, about: c.about, pop: pop(0.1, 0.4) } }));
  });
  const warmth = (romance(a, b) + romance(b, a)) / 20;
  feel(state, a, 'security', 0.8 * warmth); feel(state, b, 'security', 0.8 * warmth);
  events.push(makeEvent(state, rng, { phase: 'final-date', kind: 'journey-end', players: [a, b], aired: true,
    extra: { of: shape, curve: curveOf(a, b), chapters: chapters.length, pop: pop(0.3, 1) } }));
  return { events, shape, chapters };
}

// What a declaration can point back to, best first: the moments a speech is made of.
const SPEAKS_OF = ['back', 'casa', 'photos', 'split', 'at-risk', 'row', 'love', 'first-kiss', 'night-one', 'date-met', 'coupled', 'met'];
/** The chapter each of them talks about in their speech: never the same one twice. */
export function speechChapters(chapters) {
  const ranked = SPEAKS_OF.map(t => chapters.find(c => c.type === t)).filter(Boolean);
  return [ranked[0] || null, ranked[1] || ranked[0] || null];
}
