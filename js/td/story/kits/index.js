// td/story/kits/index.js — every character kit (td/story/kits.js), by name; kits-deep.js adds the
// parts the pair scenes use (defend, deep), kits-solo.js the solo scene (alone, solo)
//
// And a kit written in the Studio (the user, 2026-10-10: "how in cast setup / character creation can
// I build a kit"): the roster row's own `kit`, for anybody without a hand-written one here. Looked up
// by name at read time, so a character saved in the Studio has their kit in the very next episode.
import kits1 from './kits1.js';
import kits2 from './kits2.js';
import kits3 from './kits3.js';
import deep from './kits-deep.js';
import solo from './kits-solo.js';

const BUILT = Object.assign({}, kits1, kits2, kits3);
for (const [n, k] of [...Object.entries(deep), ...Object.entries(solo)]) if (BUILT[n]) Object.assign(BUILT[n], k);

const PARTS = ['bit', 'tease', 'reply', 'home', 'want', 'conf', 'askHome', 'askWant', 'defend', 'deep', 'solo'];
const studioCache = new Map();
/** The Studio kit on the roster row, in the shape kits.js reads, or null. */
function studioKit(name) {
  if (typeof name !== 'string') return null;
  const roster = (typeof globalThis !== 'undefined' && Array.isArray(globalThis.FRANCHISE_ROSTER)) ? globalThis.FRANCHISE_ROSTER : null;
  const raw = roster?.find(r => r && r.name === name)?.kit;
  if (!raw) return null;
  const sig = typeof raw === 'string' ? raw : JSON.stringify(raw);
  const hit = studioCache.get(name);
  if (hit && hit.sig === sig) return hit.kit;
  let k = raw;
  if (typeof k === 'string') { try { k = JSON.parse(k); } catch { k = null; } }
  let kit = null;
  if (k && typeof k === 'object' && !Array.isArray(k)) {
    kit = {};
    if (typeof k.thing === 'string' && k.thing.trim()) kit.thing = k.thing.trim();
    if (typeof k.alone === 'string' && k.alone.trim()) kit.alone = k.alone.trim();
    for (const p of PARTS) kit[p] = Array.isArray(k[p]) ? k[p].filter(x => typeof x === 'string' && x.trim()) : [];
    // a bit, its tease and its reply are one exchange: keep only whole ones
    const n = Math.min(kit.bit.length, kit.tease.length, kit.reply.length);
    for (const p of ['bit', 'tease', 'reply']) kit[p] = kit[p].slice(0, n);
    if (!kit.thing) kit.thing = 'the way they are';
    if (!PARTS.some(p => kit[p].length)) kit = null;
  }
  studioCache.set(name, { sig, kit });
  return kit;
}

// The hand-written kit first; a Studio kit for everybody else. Keys (Object.keys) stay the
// hand-written ones, which is what tests/td-kits.test.js checks.
const KITS = new Proxy(BUILT, {
  get(t, name) { return t[name] || studioKit(name) || undefined; },
  has(t, name) { return name in t || !!studioKit(name); },
});
export default KITS;
