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
const STUDIO = new Set(['studio', 'studio-wide', 'finale', 'finale-jury']);
const platesOf = set => Object.keys(RESORT.plates).filter(id => built(id) && (RESORT.plates[id].sets || []).includes(set));
const WORDS = {};
const named = (id, text) => {
  const w = RESORT.plates[id].words;
  if (!w || !text) return false;
  WORDS[id] ||= new RegExp(String.raw`\b(?:${w})`, 'i');
  return WORDS[id].test(text);
};

/**
 * A House Life scene's plate: one the lines name, else one for the moment (`use`), by a hash
 * of the scene's key. Null when the set has no plate yet.
 */
export function pickPlate(set, key, text = '', use = 'house') {
  const all = platesOf(set);
  if (!all.length) return null;
  const said = all.filter(id => named(id, text));
  // a plate that is only ever chosen by name (the gym is not where every backyard talk happens);
  // a private talk (`secret`) can also slip off to the island's hidden spots (pier, ponds, lagoon, volcano)
  const free = all.filter(id => {
    const u = RESORT.plates[id].use || [];
    return u.includes(use) || ((use === 'house' || use === 'secret') && u.includes('quiet'));
  });
  if (!said.length && !free.length && use === 'secret') return pickPlate(set, key, text, 'house');
  const pool = said.length ? said : free.length ? free : all;
  return pool[hashOf(key) % pool.length];
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
export function plateHtml(S, theme) {
  const id = plateFor(S);
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
