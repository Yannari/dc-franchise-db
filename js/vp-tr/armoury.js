// ══════════════════════════════════════════════════════════════════════
// js/vp-tr/armoury.js — the undercroft, and the door nobody talks about
// ══════════════════════════════════════════════════════════════════════
//
// The screen for `ep.tr.armoury` (js/tr/armoury.js). It draws the one thing
// the format hangs on the room: EVERYBODY WATCHED THESE FOUR GO IN, AND NOBODY
// KNOWS WHICH OF THEM CAME OUT WITH ANYTHING.
//
// ── WHAT THE OBSERVER IS ALLOWED TO SEE ───────────────────────────────
//
// The entrants are PUBLIC — the afternoon's reward, handed out in front of the
// castle — so every observer gets the queue, the doors and the names.
//
// What is behind each door is NOT. Only the AUDIENCE (and a player watching
// their own turn) is shown a find; everybody else gets a closed record: the
// door opens on a niche the screen refuses to describe. That is enforced HERE,
// in `_view`, by never putting `found` on a slot the observer is not entitled
// to — a branch that never receives the fact cannot leak it later, which is the
// same rule js/vp-tr/house-status.js applies to a relic's holder.
//
// ── AND IT IS DRAWN, NOT SUGGESTED ────────────────────────────────────
//
// Built from mockup-tr-armoury.html, kept in the repo as the visual target: an
// ashlar undercroft with a springing vault, two wrought sconces with live
// flame, a rack of polearms and a rack of shields, and cabinets that are real
// STUDDED OAK DOORS — planks, iron straps, rivets, strap hinge, ring pull,
// numeral plate — swinging on the hinge to a stone niche. The leaf stops at 72°
// rather than flat, because edge-on it vanishes at the exact moment of the
// reveal and takes the one object that says "castle" with it.
import { seasonConfig, players } from '../core.js';
import { _portrait } from './conclave.js';

// ── faces ─────────────────────────────────────────────────────────────
function _slugOf(name) {
  const p = (players || []).find(x => x && x.name === name);
  return (p && p.slug) || String(name || '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
function _av(name, size) { return _portrait(_slugOf(name), name, size || 34); }

function _esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];
const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const WORDS = ['nobody', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
function _word(n) { return WORDS[n] || String(n); }

/**
 * A stable 0..1 from a string — every choice on this screen that is not on the
 * record (which door numeral somebody took, which sentence describes it) is
 * hashed rather than drawn, so the screen consumes NO rng and a replay of the
 * same night draws the identical room. Same discipline as `lineFor`.
 */
function _hash01(key) {
  let h = 2166136261;
  const s = String(key);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}
function _pick(pool, key) { return pool[Math.floor(_hash01(key) * pool.length) % pool.length]; }

// ── the sentences ─────────────────────────────────────────────────────
//
// Four pools, all about the WALK and never about the outcome: the screen must
// read the same for a player who found nothing and a player who found the
// Shield, because the castle watching from the bottom of the stair cannot tell
// them apart. That is the whole point of the room, and a line that leaked the
// result through its tone would undo the record's own secrecy.
const APPROACH = [
  '{who} goes up {ord}, does not look back down the stair, and takes door {n} without breaking step.',
  '{who} counts along the wall to {n}, puts a hand flat on the oak, and opens it.',
  '{who} stands in front of the wall for a moment longer than the wall deserves, then chooses {n}.',
  '{who} goes {ord}. Door {n}, no hesitation anybody down there could have measured.',
  'It is {who}’s turn. {They} pick door {n} the way people pick a door they have already decided on.',
  '{who} walks the length of the rack first, comes back, and opens {n}.',
];
const AFTER = [
  '{who} comes back down with {their} hands empty and {their} face doing nothing at all.',
  'Whatever was behind {n}, {who} closes the door on it and says nothing on the way out.',
  '{who} is back down the stair inside a minute, and the castle learns exactly as much as it was going to.',
  '{who} pulls the door to, and the only sound in it is the iron.',
];

function _pron(name) {
  const p = (players || []).find(x => x && x.name === name);
  const g = (p && (p.gender || p.pronouns)) || '';
  const f = /^(f|she|her)/i.test(String(g));
  const m = /^(m|he|him)/i.test(String(g));
  return f ? { they: 'she', They: 'She', their: 'her' }
    : m ? { they: 'he', They: 'He', their: 'his' }
      : { they: 'they', They: 'They', their: 'their' };
}
function _fill(tpl, vars) {
  return String(tpl).replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : vars[k]));
}

/**
 * WHAT THIS OBSERVER IS SHOWN. `found` reaches a slot only when the watcher is
 * entitled to it; otherwise the slot carries `known:false` and the builder has
 * nothing to render but a closed record.
 */
function _view(ep, observer) {
  const rec = ep && ep.tr && ep.tr.armoury;
  if (!rec || !Array.isArray(rec.entrants) || !rec.entrants.length) return null;
  const obs = observer == null ? 'audience' : String(observer);
  const isAudience = obs === 'audience';
  const watcher = obs.indexOf('player:') === 0 ? obs.slice('player:'.length) : null;

  const slots = (rec.slots && rec.slots.length ? rec.slots
    : rec.entrants.map(n => ({ name: n, found: false })))
    .map((s, i) => {
      // A player knows their OWN door and no other. The audience knows all.
      const known = isAudience || (watcher && watcher === s.name);
      return {
        name: s.name,
        i,
        ord: ORDINALS[i] || 'last',
        // The numeral is decoration, not record — hashed off the night and the
        // name so a replay shows the same wall. UNIQUE, because two people
        // cannot open the same door: the hash picks a starting point and the
        // first free numeral from there is taken (the first draw put Brick and
        // Brody both on door II, which reads as a mistake in the room).
        numeral: null,
        known,
        found: known ? !!s.found : null,
      };
    });

  // Hand out the door numerals, deterministically and without collision.
  const taken = new Set();
  for (const s2 of slots) {
    const start = Math.floor(_hash01('am|' + rec.ep + '|' + s2.name) * NUMERALS.length);
    for (let k = 0; k < NUMERALS.length; k++) {
      const cand = NUMERALS[(start + k) % NUMERALS.length];
      if (!taken.has(cand)) { taken.add(cand); s2.numeral = cand; break; }
    }
    if (!s2.numeral) s2.numeral = NUMERALS[0];
  }

  return {
    ep: rec.ep,
    entrants: [...rec.entrants],
    slots,
    count: rec.count || 1,
    isAudience,
    watcher,
    // The answer, for the audience strip only. Never rendered for a player.
    holders: isAudience ? [...(rec.holders || [])] : [],
    missionName: (ep.tr.mission && ep.tr.mission.name) || null,
  };
}

// ══════════════════════════════════════════════════════════════════════
// THE ROOM
// ══════════════════════════════════════════════════════════════════════

/** The undercroft: ashlar, vault, sconces, weapon rack, banners, flagstones. */
function _room() {
  return '<svg class="am-svg-fixed" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">'
    + '<defs>'
    + '<linearGradient id="amStone" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0" stop-color="#3a3125"/><stop offset="1" stop-color="#191510"/></linearGradient>'
    + '<linearGradient id="amStoneLit" x1="0" y1="0" x2="1" y2="1">'
    + '<stop offset="0" stop-color="#4b3f2e"/><stop offset="1" stop-color="#2a2318"/></linearGradient>'
    + '<radialGradient id="amTorch" cx="50%" cy="50%">'
    + '<stop offset="0" stop-color="#ffd79a" stop-opacity=".85"/>'
    + '<stop offset="1" stop-color="#ff9b3d" stop-opacity="0"/></radialGradient>'
    + '<linearGradient id="amIron" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0" stop-color="#5b636e"/><stop offset=".5" stop-color="#2a3038"/>'
    + '<stop offset="1" stop-color="#171b21"/></linearGradient>'
    + '<linearGradient id="amBlade" x1="0" y1="0" x2="1" y2="0">'
    + '<stop offset="0" stop-color="#39414b"/><stop offset=".45" stop-color="#98a6b6"/>'
    + '<stop offset=".55" stop-color="#6d7986"/><stop offset="1" stop-color="#2b3138"/></linearGradient>'
    + '<linearGradient id="amBanner" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0" stop-color="#6d1620"/><stop offset="1" stop-color="#2b0a0f"/></linearGradient>'
    + '<filter id="amSoft"><feGaussianBlur stdDeviation="9"/></filter>'
    + '<filter id="amFlame" x="-60%" y="-60%" width="220%" height="220%">'
    + '<feGaussianBlur stdDeviation="1.6"/></filter>'
    + '<pattern id="amAshlar" width="240" height="96" patternUnits="userSpaceOnUse">'
    + '<rect width="240" height="96" fill="url(#amStone)"/>'
    + '<g stroke="#0d0b07" stroke-width="3" opacity=".8">'
    + '<line x1="0" y1="48" x2="240" y2="48"/><line x1="0" y1="96" x2="240" y2="96"/>'
    + '<line x1="70" y1="0" x2="70" y2="48"/><line x1="185" y1="0" x2="185" y2="48"/>'
    + '<line x1="0" y1="48" x2="0" y2="96"/><line x1="128" y1="48" x2="128" y2="96"/></g>'
    + '<g fill="#ffffff" opacity=".030">'
    + '<rect x="3" y="3" width="64" height="42"/><rect x="74" y="3" width="107" height="42"/>'
    + '<rect x="3" y="51" width="121" height="42"/><rect x="132" y="51" width="105" height="42"/></g>'
    + '</pattern></defs>'
    + '<rect width="1440" height="900" fill="url(#amAshlar)" opacity=".95"/>'
    + '<rect width="1440" height="900" fill="#0a0805" opacity=".45"/>'
    // the vault
    + '<g fill="none" stroke="#0c0a07" stroke-width="26" opacity=".85">'
    + '<path d="M-40 300 Q 250 -40 540 300"/><path d="M900 300 Q 1190 -40 1480 300"/></g>'
    + '<g fill="none" stroke="url(#amStoneLit)" stroke-width="18" opacity=".85">'
    + '<path d="M-40 300 Q 250 -40 540 300"/><path d="M900 300 Q 1190 -40 1480 300"/></g>'
    + '<g opacity=".9"><rect x="672" y="120" width="96" height="780" fill="url(#amStoneLit)"/>'
    + '<rect x="660" y="96" width="120" height="30" fill="url(#amStoneLit)"/>'
    + '<rect x="660" y="96" width="120" height="30" fill="#000" opacity=".25"/>'
    + '<g stroke="#0d0b07" stroke-width="3" opacity=".7">'
    + '<line x1="672" y1="200" x2="768" y2="200"/><line x1="672" y1="296" x2="768" y2="296"/>'
    + '<line x1="672" y1="392" x2="768" y2="392"/><line x1="672" y1="488" x2="768" y2="488"/></g></g>'
    // the weapon rack
    + '<g opacity=".62" transform="translate(74,236)">'
    + '<rect x="-14" y="330" width="330" height="16" fill="#241c12"/>'
    + '<rect x="-14" y="132" width="330" height="12" fill="#241c12"/>'
    + '<g transform="translate(16,0)"><rect x="7" y="0" width="7" height="342" fill="#3a2c1b"/>'
    + '<path d="M10 8 L10 -34 L16 -22 Z" fill="url(#amBlade)"/>'
    + '<path d="M14 6 q 34 -12 30 -40 q -22 16 -30 22 Z" fill="url(#amBlade)"/>'
    + '<path d="M7 12 q -22 -4 -24 -22 q 14 4 24 12 Z" fill="url(#amBlade)"/></g>'
    + '<g transform="translate(84,10)"><rect x="7" y="0" width="6" height="330" fill="#3a2c1b"/>'
    + '<path d="M10 -2 L2 -30 L10 -56 L18 -30 Z" fill="url(#amBlade)"/></g>'
    + '<g transform="translate(150,22)"><rect x="7" y="0" width="7" height="316" fill="#3a2c1b"/>'
    + '<path d="M12 4 q 40 6 40 42 q -28 -8 -40 -6 Z" fill="url(#amBlade)"/>'
    + '<path d="M9 4 q -26 6 -26 34 q 18 -8 26 -8 Z" fill="url(#amBlade)" opacity=".8"/></g>'
    + '<g transform="translate(226,40)"><rect x="6" y="26" width="9" height="250" rx="3" fill="url(#amBlade)"/>'
    + '<rect x="-14" y="14" width="49" height="9" rx="3" fill="#5b636e"/>'
    + '<rect x="4" y="-14" width="13" height="30" rx="5" fill="#43331f"/>'
    + '<circle cx="10" cy="-18" r="8" fill="#6b5a3c"/>'
    + '<path d="M6 276 L10.5 292 L15 276 Z" fill="url(#amBlade)"/></g></g>'
    // the shield rack
    + '<g opacity=".5" transform="translate(1052,268)">'
    + '<rect x="-16" y="250" width="308" height="15" fill="#241c12"/>'
    + '<g transform="translate(6,60)"><path d="M46 0 L92 16 V72 C92 118 70 142 46 152 C22 142 0 118 0 72 V16 Z"'
    + ' fill="#2c333c" stroke="#59616c" stroke-width="3"/>'
    + '<circle cx="46" cy="72" r="13" fill="#59616c" opacity=".8"/></g>'
    + '<g transform="translate(126,74) scale(.92)"><path d="M46 0 L92 16 V72 C92 118 70 142 46 152 C22 142 0 118 0 72 V16 Z"'
    + ' fill="#332a20" stroke="#6b5a3c" stroke-width="3"/>'
    + '<path d="M0 60 H92 M46 0 V152" stroke="#6b5a3c" stroke-width="4" opacity=".7"/></g>'
    + '<g transform="translate(238,52) scale(.86)"><path d="M46 0 L92 16 V72 C92 118 70 142 46 152 C22 142 0 118 0 72 V16 Z"'
    + ' fill="#2c333c" stroke="#59616c" stroke-width="3"/>'
    + '<circle cx="46" cy="72" r="13" fill="#59616c" opacity=".8"/></g></g>'
    // banners
    + '<g opacity=".72">' + [556, 788].map(x =>
      '<g transform="translate(' + x + ',86)"><rect x="-6" y="0" width="104" height="9" fill="#4a3a22"/>'
      + '<path d="M0 9 H92 V212 L46 186 L0 212 Z" fill="url(#amBanner)"/>'
      + '<path d="M46 52 L70 62 V96 C70 118 58 130 46 136 C34 130 22 118 22 96 V62 Z"'
      + ' fill="none" stroke="#d8b46a" stroke-width="3" opacity=".8"/></g>').join('') + '</g>'
    // sconces
    + _sconce(232, 120, false) + _sconce(1208, 150, true)
    // floor
    + '<g opacity=".8"><path d="M0 760 H1440 V900 H0 Z" fill="#12100b"/>'
    + '<g stroke="#241f16" stroke-width="3" opacity=".9">'
    + '<line x1="0" y1="800" x2="1440" y2="800"/><line x1="0" y1="850" x2="1440" y2="850"/>'
    + '<line x1="180" y1="760" x2="90" y2="900"/><line x1="480" y1="760" x2="430" y2="900"/>'
    + '<line x1="780" y1="760" x2="810" y2="900"/><line x1="1080" y1="760" x2="1160" y2="900"/>'
    + '</g></g></svg>';
}

/** One wrought sconce with a live flame in it. */
function _sconce(x, y, flip) {
  return '<g transform="translate(' + x + ',' + y + ')' + (flip ? ' scale(-1,1)' : '') + '">'
    + '<path d="M0 0 h10 v52 q0 22 22 26 l26 6" fill="none" stroke="url(#amIron)" stroke-width="9"/>'
    + '<path d="M46 78 q18 -2 26 10 q-16 10 -30 6 Z" fill="#2a3038"/>'
    + '<ellipse cx="66" cy="86" rx="20" ry="8" fill="#20242a"/>'
    + '<circle cx="66" cy="70" r="66" fill="url(#amTorch)" filter="url(#amSoft)" opacity=".8"/>'
    + '<g class="am-flame' + (flip ? ' b' : '') + '" filter="url(#amFlame)">'
    + '<path d="M66 82 q-16 -22 -4 -40 q4 12 10 16 q-2 -20 8 -30 q-2 22 10 34 q10 12 -2 24 Z" fill="#ff9b3d"/>'
    + '<path d="M66 80 q-9 -14 -2 -26 q3 8 7 11 q0 -13 6 -20 q0 15 6 23 q6 8 -2 16 Z" fill="#ffe0a3"/>'
    + '</g></g>';
}

/**
 * The niche behind a door.
 *
 * THREE STATES, and the third is the one the format needs: a find, an empty
 * bracket, and NOT ENTITLED TO KNOW — which is what every Faithful sees on
 * somebody else's door. The unknown niche is not a blanked-out find; it is a
 * door that opens on a dark the screen never resolves.
 */
function _niche(slot, uid) {
  const g = 'n' + uid;
  const head = '<svg viewBox="0 0 210 280"><defs>'
    + '<linearGradient id="' + g + 'b" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0" stop-color="#14110c"/><stop offset="1" stop-color="#050403"/></linearGradient>'
    + '<linearGradient id="' + g + 'm" x1="0" y1="0" x2="1" y2="1">'
    + '<stop offset="0" stop-color="#eafff8"/><stop offset=".45" stop-color="#8fe0c4"/>'
    + '<stop offset=".62" stop-color="#3f8f78"/><stop offset="1" stop-color="#9fe8cf"/></linearGradient>'
    + '<radialGradient id="' + g + 'g" cx="50%" cy="50%">'
    + '<stop offset="0" stop-color="#8fe0c4" stop-opacity=".55"/>'
    + '<stop offset="1" stop-color="#8fe0c4" stop-opacity="0"/></radialGradient>'
    + '</defs><rect width="210" height="280" fill="url(#' + g + 'b)"/>'
    + '<g stroke="#221c14" stroke-width="2" opacity=".85">'
    + '<line x1="0" y1="70" x2="210" y2="70"/><line x1="0" y1="140" x2="210" y2="140"/>'
    + '<line x1="0" y1="210" x2="210" y2="210"/>'
    + '<line x1="88" y1="0" x2="88" y2="70"/><line x1="132" y1="70" x2="132" y2="140"/>'
    + '<line x1="66" y1="140" x2="66" y2="210"/><line x1="146" y1="210" x2="146" y2="280"/></g>'
    + '<rect width="210" height="280" fill="#000" opacity=".28"/>';

  if (!slot.known) {
    return head
      + '<text x="105" y="150" text-anchor="middle" font-family="IM Fell English,Georgia,serif"'
      + ' font-style="italic" font-size="17" fill="#4b4234">not yours to see</text></svg>';
  }
  if (slot.found) {
    return head
      + '<circle cx="105" cy="140" r="92" fill="url(#' + g + 'g)"/>'
      + '<g transform="translate(105,138)">'
      + '<path d="M0 -64 L46 -48 V6 C46 44 26 62 0 72 C-26 62 -46 44 -46 6 V-48 Z"'
      + ' fill="url(#' + g + 'm)" stroke="#dcfff4" stroke-width="3"/>'
      + '<path d="M0 -64 L46 -48 V6 C46 44 26 62 0 72" fill="#ffffff" opacity=".14"/>'
      + '<circle cx="0" cy="0" r="13" fill="#dcfff4" opacity=".95"/>'
      + '<circle cx="0" cy="0" r="13" fill="none" stroke="#2f6d5b" stroke-width="2"/>'
      + '<g fill="#2f6d5b" opacity=".85"><circle cx="-30" cy="-34" r="3.4"/>'
      + '<circle cx="30" cy="-34" r="3.4"/><circle cx="-30" cy="30" r="3.4"/>'
      + '<circle cx="30" cy="30" r="3.4"/></g></g></svg>';
  }
  return head
    + '<g transform="translate(105,150)" opacity=".55">'
    + '<path d="M-34 0 h68" stroke="#3b3227" stroke-width="7" stroke-linecap="round"/>'
    + '<path d="M-34 0 q0 -16 12 -22 M34 0 q0 -16 -12 -22" stroke="#3b3227" stroke-width="6"'
    + ' fill="none" stroke-linecap="round"/>'
    + '<ellipse cx="0" cy="14" rx="42" ry="7" fill="#0a0806"/></g>'
    + '<text x="105" y="228" text-anchor="middle" font-family="IM Fell English,Georgia,serif"'
    + ' font-style="italic" font-size="17" fill="#5c5140">empty</text></svg>';
}

/** The door leaf: oak planks, iron straps, rivets, strap hinge, ring, numeral. */
function _leaf(numeral, uid) {
  const g = 'l' + uid;
  return '<svg viewBox="0 0 210 280"><defs>'
    + '<linearGradient id="' + g + 'o" x1="0" y1="0" x2="1" y2="0">'
    + '<stop offset="0" stop-color="#2e2113"/><stop offset=".08" stop-color="#42301c"/>'
    + '<stop offset=".5" stop-color="#5a4227"/><stop offset="1" stop-color="#332514"/></linearGradient>'
    + '<linearGradient id="' + g + 'i" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0" stop-color="#666e79"/><stop offset=".5" stop-color="#2d333b"/>'
    + '<stop offset="1" stop-color="#191d23"/></linearGradient></defs>'
    + '<rect x="2" y="2" width="206" height="276" rx="2" fill="url(#' + g + 'o)"'
    + ' stroke="#241a0e" stroke-width="3"/>'
    + '<g stroke="#2a1d10" stroke-width="3" opacity=".9">'
    + '<line x1="54" y1="4" x2="54" y2="276"/><line x1="106" y1="4" x2="106" y2="276"/>'
    + '<line x1="158" y1="4" x2="158" y2="276"/></g>'
    + '<g stroke="#ffffff" stroke-width="1" opacity=".045" fill="none">'
    + '<path d="M26 10 q6 60 0 130 q-5 70 2 132"/><path d="M80 8 q-6 70 2 140 q5 62 -2 126"/>'
    + '<path d="M132 12 q7 66 -1 128 q-6 66 3 130"/><path d="M184 8 q-5 62 3 132 q6 62 -2 128"/></g>'
    + '<g><rect x="0" y="44" width="210" height="26" fill="url(#' + g + 'i)"/>'
    + '<rect x="0" y="210" width="210" height="26" fill="url(#' + g + 'i)"/>'
    + '<g fill="#8b939d"><circle cx="22" cy="57" r="4"/><circle cx="76" cy="57" r="4"/>'
    + '<circle cx="132" cy="57" r="4"/><circle cx="188" cy="57" r="4"/>'
    + '<circle cx="22" cy="223" r="4"/><circle cx="76" cy="223" r="4"/>'
    + '<circle cx="132" cy="223" r="4"/><circle cx="188" cy="223" r="4"/></g></g>'
    + '<g fill="url(#' + g + 'i)"><path d="M0 40 h86 q16 6 0 12 h-86 Z"/>'
    + '<path d="M0 214 h86 q16 6 0 12 h-86 Z"/>'
    + '<circle cx="8" cy="46" r="9"/><circle cx="8" cy="220" r="9"/></g>'
    + '<g transform="translate(172,140)">'
    + '<circle cx="0" cy="0" r="15" fill="none" stroke="url(#' + g + 'i)" stroke-width="7"/>'
    + '<circle cx="0" cy="-16" r="6" fill="#3a424c"/>'
    + '<path d="M-4 20 h8 v10 h-8 Z" fill="#2d333b"/>'
    + '<circle cx="0" cy="20" r="6" fill="#12161b"/></g>'
    + '<g transform="translate(105,150)">'
    + '<rect x="-30" y="-26" width="60" height="52" rx="3" fill="#1d222a" stroke="#59616c" stroke-width="2"/>'
    + '<text x="0" y="8" text-anchor="middle" font-family="Fraunces,Georgia,serif" font-weight="900"'
    + ' font-size="26" fill="#9aa7b6">' + _esc(numeral) + '</text></g>'
    + '<rect x="2" y="2" width="206" height="276" fill="#000" opacity=".18"/></svg>';
}

// ══════════════════════════════════════════════════════════════════════
// THE SCREEN
// ══════════════════════════════════════════════════════════════════════

export function rpBuildArmoury(ep, observer = 'audience') {
  const v = _view(ep, observer);
  if (!v) return '';
  const suffix = 'armoury';
  const epNum = ep.num || v.ep || 0;
  const total = v.slots.length + 2;          // intro + one per turn + the silence
  const st = _state(epNum, total);

  const queue = v.slots.map(s =>
    '<div class="am-q">' + _av(s.name, 62)
    + '<div class="am-q-nm">' + _esc(s.name) + '</div>'
    + '<div class="am-q-ord">' + _esc(s.ord) + '</div></div>').join('');

  const turns = v.slots.map((s, i) => {
    const p = _pron(s.name);
    const key = 'am|' + v.ep + '|' + s.name;
    const approach = _fill(_pick(APPROACH, key + '|a'),
      { who: _esc(s.name), ord: s.ord, n: s.numeral, They: p.They, they: p.they, their: p.their });
    const after = _fill(_pick(AFTER, key + '|b'),
      { who: _esc(s.name), n: s.numeral, their: p.their, they: p.they, They: p.They });
    // The badge only exists where the observer is entitled to an outcome.
    const badge = s.known
      ? '<span class="am-turn-out" data-f="' + (s.found ? 1 : 0) + '">'
        + (s.found ? 'Shield' : 'Nothing') + '</span>'
      : '<span class="am-turn-out" data-f="0">Said nothing</span>';
    return '<div class="am-step" id="am-step-' + suffix + '-' + (i + 1) + '"'
      + (i <= st.idx - 1 ? ' data-was="1"' : '') + '>'
      + '<div class="am-turn">'
      + '<div class="am-door' + (s.known && s.found ? ' found' : '') + '" id="am-door-' + suffix + '-' + i + '">'
      + '<div class="am-halo"></div>'
      + '<div class="am-niche">' + _niche(s, suffix + '-' + i) + '</div>'
      + '<div class="am-leaf">' + _leaf(s.numeral, suffix + '-' + i) + '</div>'
      + '</div>'
      + '<div class="am-turn-body"><div class="am-turn-who">'
      + '<span class="am-turn-nm">' + _esc(s.name) + '</span>'
      + '<span class="am-turn-ord">goes up ' + _esc(s.ord) + ', and opens door ' + _esc(s.numeral) + '</span>'
      + badge + '</div>'
      + '<div class="am-beat">' + approach + '</div>'
      + '<div class="am-beat am-beat-2">' + after + '</div>'
      + '</div></div></div>';
  }).join('');

  const lineup = v.slots.map(s =>
    '<div class="am-l">' + _av(s.name, 68)
    + '<div class="am-l-nm">' + _esc(s.name) + '</div>'
    + '<div class="am-l-q">?</div></div>').join('');

  const n = v.slots.length;
  const truth = v.isAudience && v.holders.length
    ? '<div class="am-truth"><span class="am-truth-tag">You only &middot; audience</span>'
      + '<span class="am-truth-txt">'
      + _esc(v.holders.join(' and ')) + (v.holders.length > 1 ? ' opened the loaded doors. They cannot'
        : ' opened the loaded door. ' + _esc(v.holders[0]) + ' cannot')
      + ' be murdered tonight, and ' + (v.holders.length > 1 ? 'have' : 'has') + ' not told a soul.'
      + '</span></div>'
    : '';

  return '<div class="am-root" id="am-root-' + suffix + '">' + _css()
    + '<div class="am-scenery" aria-hidden="true">' + _room()
    + '<div class="am-glow l"></div><div class="am-glow r"></div>'
    + '<div class="am-vig"></div><div class="am-grain"></div></div>'
    + '<div class="am-body">'
    + '<div class="am-hero">'
    + '<div class="am-eyebrow">The Traitors &middot; Night ' + _esc(String(v.ep)) + '</div>'
    + '<h1 class="am-title">THE ARMOURY</h1>'
    + '<div class="am-rule"><i></i>'
    + '<svg width="34" height="38" viewBox="0 0 46 52">'
    + '<path d="M23 2 L44 9 V27 C44 41 34 48 23 50 C12 48 2 41 2 27 V9 Z"'
    + ' fill="rgba(216,180,106,.12)" stroke="#d8b46a" stroke-width="2.6"/>'
    + '<circle cx="23" cy="26" r="6" fill="#d8b46a" opacity=".9"/></svg><i></i></div>'
    + '<p class="am-sub">' + _word(n).replace(/^./, c => c.toUpperCase())
    + ' of them won the afternoon. They come down here one at a time, and each one opens a '
    + 'single door. Behind ' + (v.count > 1 ? _word(v.count) + ' of them are shields'
      : 'one of them is a shield') + '.</p></div>'
    + '<div class="am-earned">'
    + '<div class="am-earned-h">Who earned it &middot; the whole castle watched this</div>'
    + '<p class="am-earned-p">'
    + (v.missionName ? _esc(v.missionName) + ' went well, and it went well because of these '
      + _word(n) + '. ' : 'The afternoon went well, and it went well because of these '
      + _word(n) + '. ')
    + 'They were told to wait at the bottom of the stair and go up in turn.</p>'
    + '<div class="am-queue">' + queue + '</div></div>'
    + '<div class="am-wallrow"><div class="am-wall-h"><b>The wall</b>'
    + '<span>A dozen doors, ' + _word(n) + ' turns, '
    + (v.count > 1 ? _word(v.count) + ' shields' : 'one shield') + '.</span></div>'
    + '<div class="am-doors">' + turns + '</div></div>'
    + '<div class="am-step" id="am-step-' + suffix + '-' + (n + 1) + '">'
    + '<div class="am-silence">'
    + '<div class="am-silence-h">Nobody said a word on the way out</div>'
    + '<p class="am-silence-p">All ' + _word(n) + ' came back down the stair with their hands '
    + 'empty and their faces doing nothing at all. The castle knows exactly who went up there. '
    + 'It will not be told which of them is safe tonight, and neither will the Traitors.</p>'
    + '<div class="am-lineup">' + lineup + '</div>'
    + '<div class="am-note">'
    + (v.count > 1 ? _word(v.count) + ' shields between ' + _word(n) + ' people is '
      : 'One shield between ' + _word(n) + ' people is ')
    + _word(n) + ' people the pact cannot touch without spending the night on a wall.</div>'
    + '</div>' + truth + '</div>'
    + '</div>'
    + '<div class="am-controls" id="am-controls-' + suffix + '">'
    + '<button class="am-btn" onclick="trArmouryRevealNext(\'' + suffix + '\',' + total + ','
    + epNum + ')">&rsaquo; Continue</button>'
    + '<span class="am-counter" id="am-counter-' + suffix + '">'
    + (st.idx + 1) + ' / ' + total + '</span>'
    + '<button class="am-btn" onclick="trArmouryRevealAll(\'' + suffix + '\',' + total + ','
    + epNum + ')">Reveal all</button>'
    + '</div></div>';
}

// ── reveal machinery: DOM-only, never a rebuild ───────────────────────
const _tvState = {};
function _key(epNum) { return 'armoury-' + (epNum || 0); }
function _state(epNum, total) {
  const k = _key(epNum);
  if (!_tvState[k]) _tvState[k] = { idx: 0, total };
  _tvState[k].total = total;
  return _tvState[k];
}

function _reapply(suffix, upToIdx, total) {
  const scroller = document.querySelector('.rp-main');
  const top = scroller ? scroller.scrollTop : 0;
  for (let i = 1; i < total; i++) {
    const el = document.getElementById('am-step-' + suffix + '-' + i);
    if (!el) continue;
    if (i <= upToIdx) {
      el.classList.add('am-vis');
      const d = document.getElementById('am-door-' + suffix + '-' + (i - 1));
      if (d) d.classList.add('open');
    } else {
      el.classList.remove('am-vis');
      const d = document.getElementById('am-door-' + suffix + '-' + (i - 1));
      if (d) d.classList.remove('open');
    }
  }
  const counter = document.getElementById('am-counter-' + suffix);
  if (counter) counter.textContent = Math.min(upToIdx + 1, total) + ' / ' + total;
  const controls = document.getElementById('am-controls-' + suffix);
  if (controls) {
    const done = upToIdx >= total - 1;
    controls.querySelectorAll('.am-btn').forEach(b => b.classList.toggle('am-dim', done));
  }
  if (scroller) scroller.scrollTop = top;
}

export function trArmouryRevealNext(suffix, total, epNum) {
  const st = _state(epNum, total);
  if (st.idx >= total - 1) return;
  st.idx++;
  _reapply(suffix, st.idx, total);
  const el = document.getElementById('am-step-' + suffix + '-' + st.idx);
  if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export function trArmouryRevealAll(suffix, total, epNum) {
  const st = _state(epNum, total);
  st.idx = total - 1;
  _reapply(suffix, st.idx, total);
}

// ── the stylesheet, once ──────────────────────────────────────────────
let _cssDone = false;
function _css() {
  if (_cssDone) return '';
  _cssDone = true;
  return '<style>' + ARMOURY_CSS + '</style>';
}
/** Test seam: let a second build in the same process re-emit the CSS. */
export function _resetArmouryCss() { _cssDone = false; }

const ARMOURY_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,400;9..144,600;9..144,700;9..144,900&family=IM+Fell+English:ital@0;1&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&display=swap');
.am-root{--am-torch:#ff9b3d;--am-torch-hot:#ffe0a3;--am-shield:#8fe0c4;--am-shield-hot:#dcfff4;
  --am-display:'Fraunces',Georgia,serif;--am-body:'Cormorant Garamond',Georgia,serif;
  --am-hand:'IM Fell English',Georgia,serif;
  position:relative;min-height:100vh;overflow:hidden;background:#05070a;color:#d6c8ac;
  font-family:var(--am-body);font-size:17px;line-height:1.55}
.am-root *{box-sizing:border-box}
/* THE ROOM IS ONE SCREEN TALL, NOT ONE PAGE TALL. Stretched over the full
   scroll height the slice-fitted SVG zooms until a banner is the size of a
   card and the vault leaves the frame entirely. Sticky at 100vh with a
   negative margin pulls it out of the layout, so it stays a room the reader
   walks down through instead of a mural. */
.am-scenery{position:sticky;top:0;height:100vh;margin-bottom:-100vh;z-index:0;
  pointer-events:none;background:#0b0906;overflow:hidden}
.am-svg-fixed{position:absolute;left:0;right:0;top:0;height:100%;width:100%}
.am-glow{position:absolute;width:760px;height:760px;border-radius:50%;pointer-events:none;
  background:radial-gradient(circle,rgba(255,155,61,.20) 0%,rgba(255,155,61,.07) 34%,transparent 66%);
  animation:am-breathe 7.5s ease-in-out infinite}
.am-glow.l{left:-190px;top:2%}
.am-glow.r{right:-190px;top:26%;animation-delay:-2.3s}
@keyframes am-breathe{0%,100%{opacity:.86;transform:scale(1)}50%{opacity:1;transform:scale(1.02)}}
.am-vig{position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 300px 90px rgba(4,3,2,.95)}
.am-root{isolation:isolate}
.am-grain{position:absolute;inset:0;pointer-events:none;opacity:.07;mix-blend-mode:overlay;
  background-image:radial-gradient(rgba(255,255,255,.6) .5px,transparent .5px);background-size:3px 3px}
/* A FLAME SITTING IN A BRACKET, NOT A SPIRIT: ~4% breathing, no drift. */
.am-flame{transform-origin:50% 100%;animation:am-flick 3.4s ease-in-out infinite}
.am-flame.b{animation-duration:4.3s;animation-delay:-1.6s}
@keyframes am-flick{0%,100%{transform:scaleY(1) scaleX(1)}34%{transform:scaleY(1.045) scaleX(.985)}
  62%{transform:scaleY(.98) scaleX(1.015)}82%{transform:scaleY(1.02) scaleX(.995)}}
.am-body{position:relative;z-index:1;max-width:1120px;margin:0 auto;padding:0 22px 130px}
.am-hero{padding:56px 0 22px;text-align:center;position:relative}
.am-eyebrow{font-family:var(--am-display);font-weight:600;font-size:10px;letter-spacing:.46em;
  text-transform:uppercase;color:#b39b74}
.am-title{font-family:var(--am-display);font-weight:900;font-size:clamp(44px,8vw,84px);
  margin:10px 0 0;letter-spacing:.01em;color:#f3e6cb;transform:scaleX(.86);
  text-shadow:0 0 46px rgba(255,155,61,.32),0 2px 0 #120d07}
.am-rule{display:flex;align-items:center;justify-content:center;gap:16px;margin:14px 0 0}
.am-rule i{height:1px;width:150px;background:linear-gradient(90deg,transparent,rgba(255,206,140,.45),transparent)}
.am-sub{font-family:var(--am-hand);font-style:italic;color:#c0ad8b;max-width:640px;margin:14px auto 0;font-size:19px}
.am-earned{position:relative;margin:32px 0 0;padding:20px 24px 22px;
  background:linear-gradient(176deg,#2a2115 0%,#1d1710 100%);border:1px solid #4a3a22;
  box-shadow:0 18px 40px rgba(0,0,0,.75), inset 0 1px 0 rgba(255,206,140,.09)}
.am-earned::before,.am-earned::after{content:"";position:absolute;top:9px;width:9px;height:9px;
  border-radius:50%;background:radial-gradient(circle at 32% 30%,#8b7a5e,#2b2418);box-shadow:0 1px 2px rgba(0,0,0,.9)}
.am-earned::before{left:10px}.am-earned::after{right:10px}
.am-earned-h{font-family:var(--am-display);font-size:11px;letter-spacing:.3em;text-transform:uppercase;
  color:var(--am-torch);margin-bottom:5px}
.am-earned-p{font-family:var(--am-hand);font-style:italic;color:#b7a486;margin:0 0 16px}
.am-queue{display:flex;gap:20px;flex-wrap:wrap}
.am-q{display:flex;flex-direction:column;align-items:center;gap:6px;width:92px}
/* THE SHARED PORTRAIT, CONTAINED HERE. \`_portrait\` (js/vp-tr/conclave.js) emits
   .cv-av and relies on CONCLAVE_CSS for its size and clipping; this screen does
   not load that sheet, so without these the raw <img> renders at its natural
   size and floods the card. Same drawing, this room's light. */
.am-root .cv-av{position:relative;display:inline-block;overflow:hidden;flex:none;
  vertical-align:middle;border-radius:50% 50% 12% 12% / 44% 44% 9% 9%;
  background:linear-gradient(162deg,#2b2418,#0b0906);
  box-shadow:0 0 0 1px rgba(255,206,140,.32),0 4px 12px rgba(0,0,0,.6)}
.am-root .cv-av img{width:100%;height:100%;object-fit:cover;display:block;position:relative;z-index:2;
  filter:sepia(.30) saturate(.85) contrast(1.1) brightness(.86)}
.am-root .cv-av-ini{position:absolute;inset:0;z-index:1;display:flex;align-items:center;
  justify-content:center;font-family:var(--am-display);font-weight:900;color:rgba(255,206,140,.6)}
.am-q-nm{font-family:var(--am-display);font-weight:600;font-size:13.5px;text-align:center;color:#e8dabb}
.am-q-ord{font-family:var(--am-hand);font-style:italic;font-size:12px;color:#9a8968}
.am-wallrow{margin:38px 0 0}
.am-wall-h{display:flex;align-items:baseline;gap:13px;margin-bottom:6px}
.am-wall-h b{font-family:var(--am-display);font-size:12px;letter-spacing:.3em;text-transform:uppercase;
  color:var(--am-torch);font-weight:600}
.am-wall-h span{font-family:var(--am-hand);font-style:italic;color:#9a8968;font-size:15px}
.am-doors{display:flex;flex-direction:column}
.am-turn{display:grid;grid-template-columns:210px 1fr;gap:30px;align-items:center;padding:26px 0;
  border-bottom:1px solid rgba(255,206,140,.10)}
.am-turn-body{min-width:0}
.am-turn-who{display:flex;align-items:baseline;gap:13px;flex-wrap:wrap}
.am-turn-nm{font-family:var(--am-display);font-weight:700;font-size:26px;color:#f3e6cb}
.am-turn-ord{font-family:var(--am-hand);font-style:italic;color:#9a8968;font-size:15px}
.am-turn-out{margin-left:auto;font-family:var(--am-display);font-weight:700;font-size:11px;
  letter-spacing:.26em;text-transform:uppercase;padding:6px 12px;border:1px solid;
  color:#7d6f58;border-color:rgba(255,206,140,.18)}
.am-turn-out[data-f="1"]{color:var(--am-shield-hot);border-color:rgba(143,224,196,.6);
  background:rgba(143,224,196,.09);box-shadow:0 0 18px rgba(143,224,196,.22)}
.am-beat{border-left:2px solid rgba(255,155,61,.5);padding:8px 0 8px 18px;margin:14px 0 0;
  font-family:var(--am-hand);font-style:italic;color:#c9b795;font-size:18px}
.am-beat-2{border-left-color:rgba(255,155,61,.22);color:#a2937a;font-size:17px;margin-top:9px}
.am-door{position:relative;width:210px;aspect-ratio:3/4;perspective:1100px}
.am-door svg{display:block;width:100%;height:100%}
.am-niche{position:absolute;inset:0}
.am-leaf{position:absolute;inset:0;transform-origin:left center;
  transition:transform 1.05s cubic-bezier(.2,.85,.25,1);filter:drop-shadow(6px 0 16px rgba(0,0,0,.8))}
/* STOPS AT 72°: flat put the leaf edge-on and the door vanished at the reveal. */
.am-door.open .am-leaf{transform:rotateY(-72deg) translateZ(6px)}
.am-door.found .am-halo{opacity:1}
.am-halo{position:absolute;inset:-16px;opacity:0;transition:opacity .9s .35s;pointer-events:none;
  background:radial-gradient(circle at 50% 46%,rgba(143,224,196,.30),transparent 62%)}
.am-silence{margin:46px 0 0;position:relative;padding:30px 26px;
  background:linear-gradient(180deg,rgba(44,12,15,.82),rgba(12,9,7,.9));
  border:1px solid rgba(143,26,38,.55);
  box-shadow:0 20px 50px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,206,140,.07);text-align:center}
.am-silence-h{font-family:var(--am-display);font-weight:900;font-size:29px;color:#f6e4e6}
.am-silence-p{font-family:var(--am-hand);font-style:italic;color:#cbb2b3;max-width:660px;
  margin:11px auto 22px;font-size:18px}
.am-lineup{display:flex;gap:22px;justify-content:center;flex-wrap:wrap}
.am-l{display:flex;flex-direction:column;align-items:center;gap:8px;width:100px}
.am-l-nm{font-family:var(--am-display);font-weight:600;font-size:14px;color:#efe0c2}
.am-l-q{font-family:var(--am-display);font-weight:900;font-size:22px;color:#b8323f;
  text-shadow:0 0 14px rgba(184,50,63,.6)}
.am-note{margin-top:20px;font-family:var(--am-hand);font-style:italic;color:#9c8a86;font-size:15.5px}
.am-truth{margin:22px 0 0;border:1px dashed rgba(143,224,196,.45);padding:15px 17px;
  background:rgba(143,224,196,.055);display:flex;align-items:center;gap:15px}
.am-truth-tag{font-family:var(--am-display);font-weight:700;font-size:10px;letter-spacing:.3em;
  text-transform:uppercase;color:var(--am-shield);white-space:nowrap}
.am-truth-txt{font-family:var(--am-hand);font-style:italic;color:#a9ccc2;font-size:16.5px}
.am-controls{position:sticky;bottom:0;z-index:6;display:flex;gap:14px;align-items:center;
  justify-content:center;padding:14px;
  background:linear-gradient(0deg,rgba(6,5,3,.97),rgba(6,5,3,.6) 70%,transparent)}
.am-btn{font-family:var(--am-display);font-weight:600;font-size:12px;letter-spacing:.22em;
  text-transform:uppercase;color:#e6d5b3;background:linear-gradient(180deg,#2c2418,#191309);
  border:1px solid #5b4a2d;padding:11px 21px;cursor:pointer}
.am-btn:hover{border-color:var(--am-torch);color:var(--am-torch-hot)}
.am-btn.am-dim{opacity:.45}
.am-counter{font-family:var(--am-display);font-weight:700;font-size:13px;letter-spacing:.18em;color:#9a8968}
.am-step{opacity:0;height:0;overflow:hidden;pointer-events:none;transition:opacity .55s}
.am-step.am-vis{opacity:1;height:auto;overflow:visible;pointer-events:auto}
@media(max-width:720px){.am-turn{grid-template-columns:1fr;gap:16px}.am-door{width:186px}}
@media(prefers-reduced-motion:reduce){
  .am-leaf,.am-halo,.am-step{transition:none}.am-glow,.am-flame{animation:none}}
`;
