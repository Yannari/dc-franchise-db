// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/plates.js — which Reality Resort plate a Big Brother screen plays on
// ══════════════════════════════════════════════════════════════════════
//
// The house is the user's cleaned Reality Resort frames (tools/bb-resort, spec
// docs/superpowers/specs/2026-10-13-bb-resort-plates-design.md). Every stage set
// (ROOM_SET in steps.js) has a list of plates; a House Life scene takes one by a
// hash of its id, so it stays put between renders. A place the lines NAME wins
// ("by the pool" is the pool): the writing is the authority, as in house-events.
// A ceremony plays on the plate that has its seats. A set with no plate built
// yet keeps its Blender room, so nothing is lost while the user's edits arrive.
import { RESORT } from './resort.js';

export const PLATE_DIR = 'assets/sets/bb/resort';
const hashOf = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const built = id => !!RESORT.have.default?.[id];
/** Whether a plate has been built (the writer may name a spot before the user has made it). */
export const plateBuilt = built;
const STUDIO = new Set(['studio', 'studio-wide', 'finale', 'finale-jury', 'comp']);
const platesOf = set => Object.keys(RESORT.plates).filter(id => built(id) && (RESORT.plates[id].sets || []).includes(set));
const WORDS = {};
// how specifically the lines name a plate: the length of the longest of its words they say (0: not named)
const named = (id, text) => {
  const w = RESORT.plates[id].words;
  if (!w || !text) return 0;
  WORDS[id] ||= new RegExp(String.raw`\b(?:${w})`, 'gi');
  let best = 0;
  for (const m of String(text).matchAll(WORDS[id])) best = Math.max(best, m[0].length);
  return best;
};

/**
 * A House Life scene's plate: one the lines name, else one for the moment (`use`), by a hash
 * of the scene's key. Null when the set has no plate yet.
 */
export function pickPlate(set, key, text = '', use = 'house') {
  const all = platesOf(set);
  if (!all.length) return null;
  // the place the lines name most specifically ("the edge of the pool" is the pool edge, not the beach's "the water")
  const score = Object.fromEntries(all.map(id => [id, named(id, text)]));
  const top = Math.max(0, ...Object.values(score));
  const tied = top ? all.filter(id => score[id] === top) : [];
  // two plates named as well as each other ("by the pool"): the wide one, the room at its best
  const wide = tied.filter(id => (RESORT.plates[id].use || []).length);
  const said = wide.length ? wide : tied;
  // a plate that is only ever chosen by name (the gym is not where every backyard talk happens);
  // a private talk (`secret`) can also slip off to the island's hidden spots (pier, ponds, lagoon, volcano)
  const free = all.filter(id => {
    const u = RESORT.plates[id].use || [];
    return u.includes(use) || ((use === 'house' || use === 'secret') && u.includes('quiet'));
  });
  if (!said.length && !free.length && use === 'secret') return pickPlate(set, key, text, 'house');
  // an ordinary house scene plays on the room's own wide plates most of the time, and on a quiet
  // corner of the island (the beach, the dock) now and then (the user, 2026-10-14: show the house at its best)
  if (!said.length && use === 'house') {
    const own = free.filter(id => (RESORT.plates[id].use || []).includes('house'));
    const quiet = free.filter(id => !own.includes(id));
    if (own.length && quiet.length) return (hashOf(`${key}|room`) % 3 ? own : quiet)[hashOf(key) % (hashOf(`${key}|room`) % 3 ? own : quiet).length];
  }
  const pool = said.length ? said : free.length ? free : all;
  return pool[hashOf(key) % pool.length];
}

// The corners of the big rooms (the user, 2026-10-14: "multiple people can talk in multiple sides of
// the same room"): every view of the living room, kitchen and dining room is one corner of it, a place
// of its own on the house map (housemap.js), and two conversations at the same time of day in the same
// room take different corners.
export const CORNER = {
  'living-screens': 'living', 'living-screens-wide': 'living', 'living-screens-close': 'living',
  'living-sofas': 'lsofas', 'living-sofas-2': 'lsofas', 'living-reverse': 'lsofas', 'living-console': 'lconsole',
  'kitchen-wide': 'kitchen', 'kitchen-stove': 'kstove',
  'dining-wide': 'dining', 'dining-camera': 'dtable', 'dining-meal': 'dtable', 'dining-meal-2': 'dtable',
  'dining-breakfast': 'dtable', 'dining-noms': 'dtable', 'nom-table': 'dtable',
};
// each corner's camera (housemap.js ZONES carries the same numbers), so a scene at the stove is on its own feed
export const CORNER_CAM = { living: 4, lsofas: 18, lconsole: 19, kitchen: 2, kstove: 17, dining: 3, dtable: 28 };
/** A house plate of the set in a corner nobody is using yet (`taken`: corner ids), by the key's hash; null if none. */
export function cornerPlate(set, taken, key) {
  const free = platesOf(set).filter(id => CORNER[id] && !taken.has(CORNER[id]) && (RESORT.plates[id].use || []).includes('house'));
  return free.length ? free[hashOf(key) % free.length] : null;
}

/** An island spot's own name and camera ({ name, cam }), or null for a room of the house. */
export function placeOf(id) {
  const p = id && RESORT.plates[id]?.place;
  return p ? { name: p[0], cam: p[1] } : null;
}

/** The plate a screen plays on: a ceremony's plate has its seats; a scene keeps its own pick. */
export function plateFor(S) {
  // the studio (interview, arrivals, finale) plays on its plates once the user's sets are built;
  // a competition's arena never does
  if (!S || S.built || (S.arena && !(STUDIO.has(S.set) && platesOf(S.set).length))) return null;
  if (S.seated) {
    const id = platesOf(S.set).find(p => RESORT.plates[p].anchors);
    return id || null;
  }
  if (S.plate && built(S.plate)) return S.plate;
  const use = S.set === 'dining' ? (S.kind === 'nominations' ? 'nominations' : 'meal') : 'house';
  return pickPlate(S.set, S.id || S.set, '', use);
}

/** The seats of a screen's plate (anchors.js units), or null for a Blender room. */
export function plateAnchors(S) {
  const id = plateFor(S);
  return (id && RESORT.plates[id].anchors) || null;
}

/** Night from eight in the evening to six in the morning; a live show is at night. */
export function isNight(time) {
  if (!time) return false;
  if (/LIVE/i.test(time)) return true;
  const m = String(time).match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return false;
  let h = Number(m[1]) % 24;
  if (m[3]) h = (h % 12) + (/PM/i.test(m[3]) ? 12 : 0);
  return h >= 20 || h < 6;
}

/** The plate's file base (no extension) for a theme and an hour, falling back to what exists. */
export function plateBase(id, theme, night) {
  const t = RESORT.have[theme]?.[id] ? theme : 'default';
  const tods = RESORT.have[t]?.[id] || [];
  const tod = night && tods.includes('night') ? 'night' : tods.includes('day') ? 'day' : tods[0];
  return `${PLATE_DIR}/${t}/${id}-${tod}`;
}

/** The plate's depth map, for the shader to move it in depth (the theme's own, else the default house's: same room). */
export function depthAttr(id, theme = 'default') {
  const t = (RESORT.depth?.[theme] || []).includes(id) ? theme : (RESORT.depth?.default || []).includes(id) ? 'default' : null;
  return t ? ` data-depth="${PLATE_DIR}/${t}/${id}-depth.webp?v=${RESORT.v}"` : '';
}

/** The stage's painted room: the plate under its moving copy (js/vp-td-ep/glplate.js reads the canvas). */
/**
 * In a themed season, the angle a scene picked may have no themed copy (the user decorated the room's
 * main view, not every corner): a room the theme HAS plays in the theme, on one of its themed views,
 * rather than cutting to the default house's colours. A room the theme does not have (the pool, the
 * island, the gym) keeps its default plate, and a ceremony's seated plate is never swapped.
 */
export function themedFor(id, S, theme) {
  if (!id || !theme || theme === 'default' || RESORT.have[theme]?.[id]) return id;
  const P = RESORT.plates[id];
  if (!P || P.anchors || P.place) return id;
  const alts = Object.keys(RESORT.have[theme] || {}).filter(x => {
    const Q = RESORT.plates[x];
    return Q && !Q.anchors && (Q.sets || []).includes(S?.set) && (Q.use || []).some(u => u === 'house' || u === 'quiet' || (P.use || []).includes(u));
  });
  return alts.length ? alts[hashOf(S?.id || id) % alts.length] : id;
}

export function plateHtml(S, theme) {
  const id = themedFor(plateFor(S), S, theme);
  if (!id) return '';
  const base = plateBase(id, theme, isNight(S.time));
  return `<div class="set set-${S.set} photo plate" data-plate="${id}" style="background-image:url('${base}.webp?v=${RESORT.v}')">`
    + `<canvas class="tdx-gl bbx-gl" data-src="${base}" data-grade="none" data-hd="1"${depthAttr(id, theme)}></canvas></div>`;
}

/** The host's screen on the plate's wall (the big teal screen in the living room), as CSS. */
export function plateTv(S) {
  const tv = plateAnchors(S)?.tv;
  return tv ? `left:${tv.x}%;bottom:${tv.y}%;top:auto;width:${tv.w}%;height:${tv.h}%;aspect-ratio:auto;border-radius:1.2cqw` : '';
}
