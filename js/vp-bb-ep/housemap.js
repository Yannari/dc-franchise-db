// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/housemap.js — House Life as the house you watch (the live feeds)
// ══════════════════════════════════════════════════════════════════════
//
// Spec: docs/superpowers/specs/2026-10-13-bb-house-map-design.md. The user's rules, carried over
// from the Total Drama camp map (vp-td-ep/map.js): the map is the default House Life view, Next
// still walks every conversation in story order, free order inside a time of day, and the clock
// moves on once that time's KEY conversations have been watched.
//
// PURE up to houseMapHtml: a House Life screen in, conversations and rooms out. A conversation
// is a run of the screen's own steps (a scene marker to the step before the next one), so a
// conversation played from the map is exactly the conversation the linear segment plays.
import { esc, img, col, eyeSvg } from './stage.js';
import { plateBase, isNight, PLATE_DIR } from './plates.js';
import { RESORT } from './resort.js';

// The blueprint's rooms, as boxes in % of the map plate (map-house, built from the user's
// Resort_Blueprint), and their cameras. The Diary Room and the HOH suite are not on the blueprint:
// they are tiles in the grass above it ("upstairs" and the Diary Room door).
export const ZONES = {
  pool: { label: 'Pool', cam: 5, box: [12, 3, 50, 41] },
  bar: { label: 'Pool Bar', cam: 6, box: [2, 3, 12, 41] },
  gym: { label: 'Gym', cam: 7, box: [51.5, 11, 71.5, 30] },
  lounge: { label: "Have-Not Room", cam: 11, box: [72.5, 11, 98, 36] },
  hallway: { label: 'Hallway', cam: 12, box: [51.5, 33, 65, 55] },
  bathroom: { label: 'Bathroom', cam: 8, box: [66, 43, 79, 56] },
  wing: { label: 'Bedroom', cam: 9, box: [80.5, 41, 98, 85] },
  kitchen: { label: 'Kitchen', cam: 2, box: [7.5, 43, 29.5, 68] },
  pantry: { label: 'Storage Room', cam: 10, box: [7.5, 69, 17.5, 85] },
  living: { label: 'Living Room', cam: 4, box: [31, 43, 50, 66] },
  foyer: { label: 'Foyer', cam: 13, box: [41.5, 68, 50, 85] },
  dining: { label: 'Dining Room', cam: 3, box: [51.5, 57, 65, 85] },
  library: { label: 'Library', cam: 15, box: [66.5, 57, 79, 85] },
  front: { label: 'Front Lawn', cam: 16, box: [2, 86, 98, 99] },
  hoh: { label: 'HOH Suite', cam: 14, box: [69.5, 1, 83.5, 9], tile: 'Upstairs' },
  dr: { label: 'Diary Room', cam: 1, box: [84.5, 1, 98, 9], tile: 'Diary Room' },
};
// The island (the user, 2026-10-13: "fully use this island"): the map opens here, and the resort is
// the way into the house. Boxes in % of the map-island plate (the user's RR1_Island). The jury lives
// in the red cabins, sequestered: houseguests never go there (the user chose "locked"). The villa
// opens only for a reward; the village at the top is the studio, where the live shows are taped.
export const ISLAND = {
  resort: { label: 'The Resort', box: [37.5, 44, 49, 57], enter: 'house' },
  beach: { label: 'The Beach', cam: 20, box: [23, 76, 58, 88] },
  westdock: { label: 'West Dock', cam: 21, box: [3.5, 57, 20, 75] },
  eastdock: { label: 'The Pier', cam: 22, box: [72, 15, 94, 32] },
  clearing: { label: 'The Clearing', cam: 23, box: [51, 34, 58.5, 52] },
  npond: { label: 'North Pond', cam: 24, box: [36, 37, 43.5, 42.5] },
  epond: { label: 'East Pond', cam: 25, box: [60, 43, 67.5, 49.5] },
  lagoon: { label: 'The Lagoon', cam: 26, box: [27, 64, 45, 73] },
  volcano: { label: 'The Volcano', cam: 27, box: [46.5, 57.5, 56, 71] },
  jury: { label: 'Jury House', cam: 30, box: [70, 48, 82, 58.5], locked: 'Sequestered' },
  villa: { label: 'Reward Villa', cam: 31, box: [62, 53.5, 67, 59.5], locked: 'Rewards only' },
  studio: { label: 'The Studio', cam: 32, box: [46, 15, 62, 24], locked: 'Live shows' },
};
const ALL = { ...ZONES, ...ISLAND };

// Every place's own picture, for its feed when nothing is happening there (the user, 2026-10-13: "make
// sure we're not missing any plate for all the zones"). A place whose plate the user is still making
// names its to-edit folder instead; tests/bb-housemap.test.js holds every zone to one or the other.
export const ZONE_PLATE = {
  pool: 'pool-wide', bar: 'bar-lobby-wide', gym: 'gym-racks', hallway: 'purple-hall', bathroom: 'bathroom', wing: 'bedroom-wide',
  kitchen: 'kitchen-wide', living: 'living-sofas', dining: 'dining-wide', library: 'library-wide', front: 'front', dr: 'confessional',
  beach: 'beach-hut', westdock: 'dock', clearing: 'comp-clearing', resort: 'front',
  hoh: 'hoh-suite', pantry: 'storage', foyer: 'foyer', eastdock: 'pier-east', npond: 'pond-north', epond: 'pond-east',
  lagoon: 'lagoon', volcano: 'volcano-lookout', jury: 'jury-cabins', villa: 'villa', studio: 'studio-arrival', lounge: 'havenot',
};
// a place whose picture the user is still making names its to-edit folder here (none left, 2026-10-13)
export const ZONE_PENDING = {};
/** A zone's place on the island: an island zone is itself; every room of the house is the resort. */
export const islandOf = z => (ISLAND[z] ? z : 'resort');
// where the house hangs out (idle people go here, never into a private conversation's room)
const PUBLIC = ['living', 'kitchen', 'pool', 'gym', 'wing', 'bar', 'library', 'dining', 'beach'];

// a plate's room on the blueprint
const ZONE_OF_PLATE = [[/^living-/, 'living'], [/^library-/, 'library'], [/^confessional$/, 'dr'], [/^(dining-|nom-table$)/, 'dining'],
  [/^kitchen-/, 'kitchen'], [/^bar-/, 'bar'], [/^bedroom-/, 'wing'], [/^(hallway|bathroom)$/, 'bathroom'], [/^purple-hall$/, 'hallway'],
  [/^hoh-/, 'hoh'], [/^storage/, 'pantry'], [/^havenot$/, 'lounge'], [/^foyer$/, 'foyer'], [/^studio-/, 'studio'],
  [/^gym-/, 'gym'], [/^(pool-|patio$|balcony$)/, 'pool'], [/^(lawn-|front)/, 'front'], [/^memory-wall$/, 'living'],
  [/^beach-/, 'beach'], [/^dock$/, 'westdock'], [/^pier/, 'eastdock'], [/^(comp-|forest-night$)/, 'clearing'],
  [/^pond-north/, 'npond'], [/^pond-east/, 'epond'], [/^lagoon/, 'lagoon'], [/^volcano/, 'volcano'], [/^jury-/, 'jury'], [/^villa/, 'villa']];
// a set's room, when the scene has no plate (a room the user has not made yet)
const ZONE_OF_SET = { ceremony: 'living', ceremony3: 'living', dining: 'dining', kitchen: 'kitchen', bedroom: 'wing', hoh: 'hoh', yard: 'pool',
  dr: 'dr', storage: 'pantry', havenot: 'lounge', bathroom: 'bathroom', door: 'foyer' };
export function zoneOf(scene) {
  const p = scene?.plate;
  if (p) for (const [re, z] of ZONE_OF_PLATE) if (re.test(p)) return z;
  return ZONE_OF_SET[scene?.set] || 'living';
}

// the day, from a scene's clock
export const WINDOWS = [
  { id: 'morning', label: 'Morning', until: 12 },
  { id: 'afternoon', label: 'Afternoon', until: 17 },
  { id: 'evening', label: 'Evening', until: 21 },
  { id: 'night', label: 'Late night', until: 99 },
];
export function hourOf(time) {
  const m = String(time || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return 12;
  let h = Number(m[1]) % 24;
  if (m[3]) h = (h % 12) + (/PM/i.test(m[3]) ? 12 : 0);
  // after midnight is still the night before
  return (h < 5 ? h + 24 : h) + Number(m[2]) / 60;
}
export const windowOf = time => WINDOWS.findIndex(w => hourOf(time) < w.until);

// What the week turns on: a storyline step that is not house life, a campaign pitch, an engine
// moment, a whole-house set piece, the HOH's week. Style chat, bond vents and life are colour.
const KEY_TYPES = new Set(['alliance', 'target', 'scheme', 'feud', 'showmance', 'campaign', 'event', 'set']);
export function isKeyScene(scene) {
  if (!scene) return false;
  if (KEY_TYPES.has(scene.type)) return true;
  return scene.type === 'talk' && /^(hohweek\.|bb\.hoh|prejury|jury\.|endgame)/.test(scene.step || '');
}

/**
 * The conversations of a House Life screen: each scene marker to the step before the next one;
 * the steps before the first marker (a departure, the first night) open the first conversation.
 */
export function conversationsOf(S) {
  const steps = S?.steps || [];
  const starts = [];
  steps.forEach((st, i) => { if (st.scene && st.scene !== steps[i - 1]?.scene) starts.push(i); });
  if (!starts.length) return [];
  const out = starts.map((from, k) => {
    const to = (k + 1 < starts.length ? starts[k + 1] : steps.length) - 1;
    const scene = steps[from].scene;
    const cast = (scene.cast || []).map(c => (Array.isArray(c) ? c[0] : c)).filter(Boolean);
    const said = new Set(steps.slice(from, to + 1).map(s => s.by).filter(Boolean));
    return { k, from: k === 0 ? 0 : from, to, scene, cast: cast.length ? cast : [...said], zone: zoneOf(scene),
      time: scene.time || '', window: Math.max(0, windowOf(scene.time)), key: isKeyScene(scene),
      title: scene.room || ALL[zoneOf(scene)].label, dr: steps.slice(from, to + 1).every(s => s.k === 'dr' || s.k === 'beat') };
  });
  // the clock never runs backwards (the scenes are already in the day's order; a late scene
  // listed early keeps the later window for everything after it)
  for (let i = 1; i < out.length; i++) out[i].window = Math.max(out[i].window, out[i - 1].window);
  return out;
}

/** The time of day the viewer is in: the first one whose key conversations are not all watched. */
export function openWindow(convs, watched) {
  for (let w = 0; w < WINDOWS.length; w++) {
    const keys = convs.filter(c => c.window === w && c.key);
    if (keys.some(c => !watched.has(c.k))) return w;
  }
  return WINDOWS.length - 1;
}
export const unlocked = (c, convs, watched) => c.window <= openWindow(convs, watched);
/** Next in story order: the first conversation not yet watched, if its time has come. */
export function nextConv(convs, watched) {
  return convs.find(c => !watched.has(c.k) && unlocked(c, convs, watched)) || null;
}

/**
 * Who is where in a time of day: everyone in a conversation is in its room; everyone else in the
 * house is somewhere public with no conversation in it then (seen living, never a witness).
 */
export function whereAt(convs, w, house = []) {
  const at = {};
  const busy = new Set();
  for (const c of convs.filter(x => x.window === w)) {
    if (c.zone === 'dr') continue;          // a confessional takes one person away for a minute
    for (const n of c.cast) if (!busy.has(n)) { (at[c.zone] ||= []).push(n); busy.add(n); }
  }
  const taken = new Set(convs.filter(x => x.window === w).map(c => c.zone));
  const free = PUBLIC.filter(z => !taken.has(z));
  const spots = free.length ? free : PUBLIC;
  for (const n of house) {
    if (busy.has(n)) continue;
    let h = 7 + w * 13; for (const ch of String(n)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    (at[spots[h % spots.length]] ||= []).push(n);
  }
  return at;
}

// ── drawing ─────────────────────────────────────────────────────────────
const LOCK = '<svg viewBox="0 0 16 16"><rect x="3" y="7" width="10" height="8" rx="1.6" fill="currentColor"/><path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
const CHECK = '<svg viewBox="0 0 16 16"><path d="M3 8.5l3.2 3.2L13 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const STAR = '<svg viewBox="0 0 16 16"><path d="M8 1.5l1.9 4.1 4.5.5-3.4 3 1 4.4L8 11.3l-4 2.2 1-4.4-3.4-3 4.5-.5z" fill="currentColor"/></svg>';
const camTag = z => (ALL[z].cam ? `CAM ${String(ALL[z].cam).padStart(2, '0')}` : 'RESORT');
const face = (n, cls = '') => `<i class="hm-face ${cls}" style="--c:${col(n)}" title="${esc(n)}">${img(n)}<b>${esc(String(n)[0])}</b></i>`;

function bubble(uid, c, convs, watched, now) {
  const done = watched.has(c.k);
  const open = unlocked(c, convs, watched);
  const cls = `hm-bub ${c.key ? 'key' : ''} ${done ? 'done' : ''} ${open ? '' : 'locked'} ${now && now.k === c.k ? 'next' : ''}`;
  const icon = done ? CHECK : !open ? LOCK : c.key ? STAR : '';
  const who = c.cast.slice(0, 3).map(n => face(n, 'sm')).join('');
  const act = open ? `onclick="event.stopPropagation();bbxMapPlay('${uid}',${c.k})"` : '';
  return `<button type="button" class="${cls}" ${act} title="${esc(c.title)} · ${esc(c.cast.join(', '))}${open ? '' : ' (later)'}">${who}<span class="hm-ic">${icon}</span></button>`;
}

/** The resort's conversations, as one bubble on the island: how many, and whether one is key. */
function resortBubble(uid, here, convs, watched, now) {
  const open = here.filter(c => !watched.has(c.k) && unlocked(c, convs, watched));
  const key = open.some(c => c.key);
  const cls = `hm-bub hm-sum ${key ? 'key' : ''} ${open.length ? '' : 'done'} ${now && here.some(c => c.k === now.k) ? 'next' : ''}`;
  return `<button type="button" class="${cls}" onclick="event.stopPropagation();bbxMapLevel('${uid}','house')" title="Inside the resort">${open.length ? `<b>${open.length}</b> inside` : `<span class="hm-ic">${CHECK}</span>`}${key ? `<span class="hm-ic">${STAR}</span>` : ''}</button>`;
}

/**
 * The map, from above, at one of its two levels: the island (the resort is one place on it) or
 * the house inside the resort. Each place: its camera, who is there, a bubble per conversation.
 */
export function houseMapHtml(uid, S, st) {
  const convs = st.convs;
  const island = st.level !== 'house';
  const zones = island ? ISLAND : ZONES;
  const w = openWindow(convs, st.watched);
  const view = st.window ?? w;
  const now = nextConv(convs, st.watched);
  const at0 = whereAt(convs, view, S.house || []);
  const at = {};
  for (const [z, ppl] of Object.entries(at0)) (at[island ? islandOf(z) : z] ||= []).push(...ppl);
  if (island) at.jury = [...(S.jury || [])];
  const night = view >= 3;
  const plate = `${PLATE_DIR}/default/${island ? 'map-island' : 'map-house'}-day`;
  // the island moves: the sea ripples and the palms sway (vp-td-ep/glplate.js)
  const gl = island ? `<canvas class="tdx-gl bbx-gl" data-src="${plate}" data-grade="none"></canvas>` : '';
  let h = `<div class="hm ${island ? 'hm-island' : ''} ${night ? 'night' : ''}" onclick="event.stopPropagation()"><div class="hm-plate" style="background-image:url('${plate}.webp?v=${RESORT.v}')">${gl}</div><div class="hm-scan"></div>`;
  for (const [z, Z] of Object.entries(zones)) {
    const [x0, y0, x1, y1] = Z.box;
    const here = convs.filter(c => (island ? islandOf(c.zone) : c.zone) === z && c.window === view);
    const live = here.some(c => !st.watched.has(c.k) && unlocked(c, convs, st.watched));
    const people = (at[z] || []);
    const max = Z.tile ? 3 : island && z !== 'resort' ? 4 : 6;
    const click = Z.enter ? `bbxMapLevel('${uid}','${Z.enter}')` : `bbxMapRoom('${uid}','${z}')`;
    h += `<div data-z="${z}" class="hm-room ${Z.tile ? 'hm-tile' : ''} ${Z.locked ? 'hm-lockz' : ''} ${Z.enter ? 'hm-enter' : ''} ${live ? 'hm-live' : ''} ${here.length ? 'hm-has' : ''}" style="left:${x0}%;top:${y0}%;width:${x1 - x0}%;height:${y1 - y0}%" onclick="event.stopPropagation();${click}">
      <span class="hm-cam">${live ? '<i class="hm-rec"></i>' : ''}${camTag(z)}${Z.tile ? ` · ${esc(Z.tile)}` : ''}</span>${Z.tile ? `<b class="hm-tname">${esc(Z.label)}</b>` : ''}
      ${island ? `<b class="hm-pname">${Z.locked ? `<span class="hm-ic">${LOCK}</span>` : ''}${esc(Z.label)}${Z.locked ? `<small>${esc(Z.locked)}</small>` : ''}</b>` : ''}
      ${people.length ? `<span class="hm-ppl">${people.slice(0, max).map(n => face(n)).join('')}${people.length > max ? `<em>+${people.length - max}</em>` : ''}</span>` : ''}
      ${here.length ? `<span class="hm-bubs">${island && z === 'resort' ? resortBubble(uid, here, convs, st.watched, now) : here.map(c => bubble(uid, c, convs, st.watched, now)).join('')}</span>` : ''}
    </div>`;
  }
  const left = convs.filter(c => !st.watched.has(c.k)).length;
  h += `<div class="hm-top"><span class="hm-eye">${eyeSvg('hm-eyesvg')}</span><b>LIVE FEEDS</b><span class="hm-day">Day ${esc(S.day ?? '')}</span>${island ? '<span class="hm-where">The Island</span>' : `<button type="button" class="hm-up" onclick="event.stopPropagation();bbxMapLevel('${uid}','island')">◀ Island</button>`}</div>
    <div class="hm-tabs">${WINDOWS.map((W, i) => {
      const n = convs.filter(c => c.window === i).length;
      const state = i < w ? 'past' : i === w ? 'now' : 'later';
      return `<button type="button" class="hm-tab ${state} ${i === view ? 'on' : ''}" ${i <= w ? `onclick="event.stopPropagation();bbxMapWindow('${uid}',${i})"` : 'disabled'}>${W.label}${n ? `<em>${n}</em>` : ''}</button>`;
    }).join('')}</div>`;
  h += `<div class="hm-foot">${now ? `<button type="button" class="hm-next" onclick="event.stopPropagation();bbxMapPlay('${uid}',${now.k})">▶ Next: <b>${esc(now.title)}</b> · ${esc(now.cast.slice(0, 3).join(', '))}${now.key ? ' <i>★</i>' : ''}</button>` : `<span class="hm-done">Every feed watched${left ? '' : ' · Next for the rest of the week'}</span>`}
    <span class="hm-legend"><i class="k">${STAR}</i>key · <i class="d">${CHECK}</i>watched · <i class="l">${LOCK}</i>later</span></div></div>`;
  return h;
}

/** One room's feed: its plate, the people in it, and its conversations as feed cards. */
export function houseFeedHtml(uid, S, st, zone) {
  const Z = ALL[zone];
  const convs = st.convs;
  const view = st.window ?? openWindow(convs, st.watched);
  const here = convs.filter(c => c.zone === zone && c.window === view);
  const plate = here[0]?.scene?.plate || convs.find(c => c.zone === zone && c.scene?.plate)?.scene?.plate || ZONE_PLATE[zone];
  const bg = plate ? `${plateBase(plate, 'default', isNight(here[0]?.time || (WINDOWS[view].id === 'night' ? '11:00 PM' : '2:00 PM')))}.webp?v=${RESORT.v}` : '';
  // everyone in this room's conversations, then whoever is idling here
  const people = zone === 'jury' ? [...(S.jury || [])] : [...new Set([...here.flatMap(c => c.cast), ...(whereAt(convs, view, S.house || [])[zone] || [])])];
  const cards = here.map(c => {
    const done = st.watched.has(c.k), open = unlocked(c, convs, st.watched);
    return `<button type="button" class="hmf-card ${c.key ? 'key' : ''} ${done ? 'done' : ''} ${open ? '' : 'locked'}" ${open ? `onclick="event.stopPropagation();bbxMapPlay('${uid}',${c.k})"` : 'disabled'}>
      <span class="hmf-who">${c.cast.slice(0, 4).map(n => face(n, 'sm')).join('')}</span>
      <span class="hmf-t"><b>${esc(c.cast.slice(0, 3).join(', '))}</b><small>${esc(c.time)}${c.key ? ' · ★ key' : ''}${done ? ' · watched' : ''}${open ? '' : ' · later'}</small></span></button>`;
  }).join('');
  return `<div class="hmf" onclick="event.stopPropagation()">${bg ? `<div class="hmf-plate" style="background-image:url('${bg}')"></div>` : '<div class="hmf-plate none"></div>'}
    <div class="hmf-top"><span class="hm-cam big"><i class="hm-rec"></i>${camTag(zone)} · ${esc(Z.label.toUpperCase())}</span><span class="hmf-clock">${esc(WINDOWS[view].label)}</span>
      <button type="button" class="hmf-back" onclick="event.stopPropagation();bbxMapBack('${uid}')">◀ ${ISLAND[zone] ? 'Island' : 'House'}</button></div>
    ${Z.locked ? `<div class="hmf-lock"><span class="hm-ic">${LOCK}</span>${zone === 'jury' ? 'The jury is sequestered: no houseguest goes in, and nothing from the house gets out.' : zone === 'villa' ? 'Only a reward opens the villa.' : 'The studio comes alive on live nights.'}</div>` : ''}
    ${people.length ? `<div class="hmf-ppl">${people.map(n => `<span class="hmf-p">${face(n)}<b>${esc(n)}</b></span>`).join('')}</div>` : '<div class="hmf-empty">Nobody in here right now.</div>'}
    <div class="hmf-cards">${cards || '<span class="hmf-none">No conversation in here at this time of day.</span>'}</div></div>`;
}

export const HM_CSS = `
.bbx .hm{transition:transform .55s cubic-bezier(.65,0,.25,1),filter .55s;will-change:transform}
.bbx .hm.hm-fly{transform:scale(var(--fz,3));filter:brightness(1.15) saturate(1.1)}
.bbx .hm.hm-fly .hm-top,.bbx .hm.hm-fly .hm-foot,.bbx .hm.hm-fly .hm-tabs,.bbx .hm.hm-fly .hm-bubs,.bbx .hm.hm-fly .hm-ppl,.bbx .hm.hm-fly .hm-pname{opacity:0;transition:opacity .2s}
.bbx .stage.arrive .hm,.bbx .stage.arrive .hmf,.bbx .stage.arrive .lens{animation:hmArrive .85s cubic-bezier(.2,.7,.2,1) both}
@keyframes hmArrive{from{transform:scale(1.22);filter:blur(.35cqw) brightness(1.25);opacity:.2}to{transform:none;filter:none;opacity:1}}
.bbx .stage.leave .hm{animation:hmLeave .7s cubic-bezier(.2,.7,.2,1) both}
@keyframes hmLeave{from{transform:scale(2.4);filter:blur(.3cqw);opacity:.3}to{transform:none;filter:none;opacity:1}}
.bbx .hm,.bbx .hmf{position:absolute;inset:0;overflow:hidden;font-family:'Chakra Petch',system-ui,sans-serif;color:#eaf6ff;cursor:default}
.bbx .hm-plate,.bbx .hmf-plate{position:absolute;inset:0;background-size:cover;background-position:center;transition:filter .6s}
.bbx .hm.night .hm-plate{filter:brightness(.45) saturate(.75) hue-rotate(-12deg)}
.bbx .hm-scan{position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,10,20,.07) 0 .12cqw,transparent .12cqw .36cqw),radial-gradient(ellipse at center,transparent 60%,rgba(0,6,14,.45))}
.bbx .hm-room{position:absolute;border-radius:.5cqw;cursor:pointer;transition:background .25s,box-shadow .25s}
.bbx .hm-room:hover{background:rgba(34,225,255,.12);box-shadow:inset 0 0 0 .18cqw rgba(34,225,255,.7)}
.bbx .hm-room.hm-live{box-shadow:inset 0 0 0 .14cqw rgba(255,46,77,.55)}
.bbx .hm.night .hm-room.hm-has{background:rgba(255,200,120,.10)}
.bbx .hm-room.hm-tile{background:rgba(5,12,24,.82);box-shadow:inset 0 0 0 .14cqw #22e1ff55;display:flex;align-items:center}
.bbx .hm-cam{position:absolute;left:.35cqw;top:.3cqw;display:flex;align-items:center;gap:.3cqw;background:rgba(3,8,16,.78);color:#9fe9ff;font:700 .72cqw/1 'Chakra Petch',monospace;letter-spacing:.08em;padding:.22cqw .4cqw;border-radius:.25cqw;white-space:nowrap}
.bbx .hm-tname{position:absolute;left:.5cqw;bottom:.35cqw;font:800 1.15cqw/1 'Chakra Petch';letter-spacing:.06em;color:#eaf6ff;text-transform:uppercase}
.bbx .hm-island .hm-room{border-radius:1.2cqw}
.bbx .hm-island .hm-room:hover{background:rgba(34,225,255,.16)}
.bbx .hm-pname{position:absolute;left:50%;top:-1.5cqw;transform:translateX(-50%);display:flex;align-items:center;gap:.3cqw;white-space:nowrap;font:800 .95cqw/1 'Chakra Petch';letter-spacing:.05em;color:#fff;background:rgba(3,8,16,.78);padding:.28cqw .55cqw;border-radius:.3cqw;text-transform:uppercase}
.bbx .hm-pname small{font:600 .68cqw 'Chakra Petch';color:#ffcf6b;text-transform:none;margin-left:.3cqw}
.bbx .hm-pname .hm-ic{color:#ffcf6b}
.bbx .hm-island .hm-cam{display:none}
.bbx .hm-island .hm-room.hm-live .hm-cam{display:flex;top:auto;bottom:-1.4cqw;left:50%;transform:translateX(-50%)}
.bbx .hm-lockz{background:repeating-linear-gradient(135deg,rgba(255,207,107,.10) 0 .5cqw,transparent .5cqw 1cqw)}
.bbx .hm-enter{box-shadow:inset 0 0 0 .18cqw rgba(255,255,255,.65);background:rgba(255,255,255,.06)}
.bbx .hm-enter:hover{background:rgba(34,225,255,.22)!important}
.bbx .hm-sum{font:700 .85cqw 'Chakra Petch';gap:.3cqw}
.bbx .hm-up{pointer-events:auto;border:1px solid #22e1ff;background:rgba(5,14,26,.85);color:#22e1ff;font:700 .8cqw 'Chakra Petch';padding:.3cqw .6cqw;border-radius:.3cqw;cursor:pointer}
.bbx .hm-where{color:#ffcf6b;font-size:.8cqw}
.bbx .hm-plate .bbx-gl{position:absolute;inset:0}
.bbx .hmf-lock{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);display:flex;align-items:center;gap:.6cqw;max-width:60%;background:rgba(3,8,16,.85);border:1px solid #ffcf6b;color:#ffe9b8;padding:.8cqw 1.2cqw;border-radius:.6cqw;font:600 1.05cqw 'Chakra Petch';z-index:2}
.bbx .hmf-lock .hm-ic{width:1.3cqw;height:1.3cqw;color:#ffcf6b;flex:none}
.bbx .hm-tile .hm-bubs{flex-direction:row;top:auto;bottom:-2.3cqw;right:0}
.bbx .hm-tile .hm-ppl{left:auto;right:.35cqw;bottom:.3cqw}
.bbx .hm-cam.big{position:static;font-size:1.05cqw;padding:.4cqw .7cqw}
.bbx .hm-rec{width:.55cqw;height:.55cqw;border-radius:50%;background:#ff2e4d;box-shadow:0 0 .6cqw #ff2e4d;animation:hmRec 1.1s steps(2) infinite}
@keyframes hmRec{50%{opacity:.25}}
.bbx .hm-ppl{position:absolute;left:.35cqw;bottom:.35cqw;display:flex;flex-wrap:wrap;gap:.18cqw;max-width:96%}
.bbx .hm-ppl em{font:700 .7cqw/1.9cqw 'Chakra Petch';color:#fff;background:rgba(3,8,16,.7);border-radius:1cqw;padding:0 .35cqw}
.bbx .hm-face{position:relative;display:inline-block;width:1.9cqw;height:1.9cqw;border-radius:50%;overflow:hidden;background:var(--c);box-shadow:0 0 0 .12cqw #fff,0 .15cqw .4cqw rgba(0,0,0,.5);animation:hmBob 3.2s ease-in-out infinite}
.bbx .hm-face img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%}
.bbx .hm-face b{position:absolute;inset:0;display:grid;place-items:center;font:800 .8cqw 'Chakra Petch';color:#fff}
.bbx .hm-face img+b{display:none}
.bbx .hm-face.sm{width:1.45cqw;height:1.45cqw;margin-left:-.35cqw;animation:none}
.bbx .hm-face.sm:first-child{margin-left:0}
@keyframes hmBob{50%{transform:translateY(-.12cqw)}}
.bbx .hm-bubs{position:absolute;right:.35cqw;top:.3cqw;display:flex;flex-direction:column;align-items:flex-end;gap:.25cqw}
.bbx .hm-bub{position:relative;display:flex;align-items:center;gap:.25cqw;padding:.22cqw .45cqw .22cqw .3cqw;border:0;border-radius:1cqw 1cqw 1cqw .25cqw;background:#f4fbff;color:#0b1a2a;cursor:pointer;box-shadow:0 .2cqw .6cqw rgba(0,0,0,.45);animation:hmPop .5s cubic-bezier(.3,1.6,.5,1) both}
.bbx .hm-bub:hover{transform:translateY(-.1cqw) scale(1.06)}
.bbx .hm-bub.key{background:linear-gradient(135deg,#fff3c4,#f5c542);box-shadow:0 0 0 .1cqw #b8860b,0 .2cqw .8cqw rgba(245,197,66,.55)}
.bbx .hm-bub.next{outline:.16cqw solid #22e1ff;outline-offset:.14cqw;animation:hmPop .5s cubic-bezier(.3,1.6,.5,1) both,hmPulse 1.4s ease-in-out .5s infinite}
.bbx .hm-bub.done{background:#cfe6dc;opacity:.78}
.bbx .hm-bub.locked{background:#3a4658;color:#9fb0c6;cursor:not-allowed;opacity:.7}
.bbx .hm-ic{display:inline-flex;width:.95cqw;height:.95cqw}
.bbx .hm-ic svg{width:100%;height:100%}
.bbx .hm-bub.key .hm-ic{color:#8a5a00}.bbx .hm-bub.done .hm-ic{color:#178a52}
@keyframes hmPop{from{transform:scale(.3);opacity:0}}
@keyframes hmPulse{50%{outline-color:transparent}}
.bbx .hm-top{position:absolute;left:51%;top:1%;border-radius:.4cqw;display:flex;align-items:center;gap:.8cqw;padding:.45cqw 1cqw;background:rgba(3,8,16,.88);font-size:1cqw;letter-spacing:.12em;pointer-events:none}
.bbx .hm-top b{font-weight:700;color:#fff}
.bbx .hm-eyesvg{width:2.6cqw;display:block}
.bbx .hm-day{color:#9fe9ff;font-size:.85cqw}
.bbx .hm-tabs{position:absolute;left:50%;bottom:.6cqw;transform:translateX(-50%);display:flex;gap:.3cqw;z-index:3}
.bbx .hm-tab{border:1px solid #22e1ff55;background:rgba(5,14,26,.85);color:#9fb6cc;font:700 .78cqw/1 'Chakra Petch';letter-spacing:.06em;padding:.38cqw .6cqw;border-radius:.3cqw;cursor:pointer}
.bbx .hm-tab em{font-style:normal;margin-left:.35cqw;color:#22e1ff}
.bbx .hm-tab.on{background:#22e1ff;color:#03111d}.bbx .hm-tab.on em{color:#03111d}
.bbx .hm-tab.later{opacity:.45;cursor:not-allowed}
.bbx .hm-foot{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;gap:1cqw;padding:.55cqw 1cqw;background:linear-gradient(0deg,rgba(3,8,16,.92),rgba(3,8,16,.5) 70%,transparent)}
.bbx .hm-next{border:0;background:#22e1ff;color:#03111d;font:700 .95cqw/1 'Chakra Petch';padding:.5cqw .9cqw;border-radius:.35cqw;cursor:pointer;box-shadow:0 0 1.2cqw rgba(34,225,255,.45)}
.bbx .hm-next i{font-style:normal;color:#8a5a00}
.bbx .hm-done{font-size:.95cqw;color:#9fe9ff}
.bbx .hm-legend{margin-left:auto;display:flex;align-items:center;gap:.35cqw;font-size:.75cqw;color:#9fb6cc}
.bbx .hm-legend i{display:inline-flex;width:.9cqw;height:.9cqw}.bbx .hm-legend i svg{width:100%;height:100%}
.bbx .hm-legend .k{color:#f5c542}.bbx .hm-legend .d{color:#3ddc97}.bbx .hm-legend .l{color:#9fb0c6}
.bbx .hmf-plate.none{background:radial-gradient(ellipse at center,#14243a,#03070d)}
.bbx .hmf::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,10,20,.06) 0 .12cqw,transparent .12cqw .36cqw);box-shadow:inset 0 0 0 .25cqw rgba(34,225,255,.35)}
.bbx .hmf-top{position:absolute;left:0;right:0;top:0;display:flex;align-items:center;gap:1cqw;padding:.7cqw 1cqw;background:linear-gradient(180deg,rgba(3,8,16,.85),transparent);z-index:2}
.bbx .hmf-clock{color:#9fe9ff;font-size:.95cqw;letter-spacing:.12em}
.bbx .hmf-back{margin-left:auto;border:1px solid #22e1ff;background:rgba(5,14,26,.85);color:#22e1ff;font:700 .9cqw 'Chakra Petch';padding:.4cqw .8cqw;border-radius:.3cqw;cursor:pointer}
.bbx .hmf-ppl{position:absolute;left:0;right:0;bottom:9.5cqw;display:flex;justify-content:center;flex-wrap:wrap;gap:1.2cqw;z-index:2}
.bbx .hmf-p{display:flex;flex-direction:column;align-items:center;gap:.3cqw;font:700 .85cqw 'Chakra Petch';text-shadow:0 .1cqw .4cqw #000}
.bbx .hmf-p .hm-face{width:5.2cqw;height:5.2cqw;border-radius:1cqw}
.bbx .hmf-empty{position:absolute;left:0;right:0;bottom:11cqw;text-align:center;font-size:1.1cqw;color:#cfe9ff;text-shadow:0 .1cqw .4cqw #000;z-index:2}
.bbx .hmf-cards{position:absolute;left:1cqw;right:1cqw;bottom:1cqw;display:flex;gap:.7cqw;overflow-x:auto;z-index:2}
.bbx .hmf-card{display:flex;align-items:center;gap:.6cqw;min-width:17cqw;border:1px solid #22e1ff66;background:rgba(4,12,22,.88);color:#eaf6ff;padding:.6cqw .8cqw;border-radius:.5cqw;cursor:pointer;text-align:left;font-family:'Chakra Petch'}
.bbx .hmf-card.key{border-color:#f5c542;box-shadow:0 0 1cqw rgba(245,197,66,.3)}
.bbx .hmf-card.done{opacity:.6}.bbx .hmf-card.locked{opacity:.45;cursor:not-allowed}
.bbx .hmf-t{display:flex;flex-direction:column;gap:.2cqw}.bbx .hmf-t b{font-size:.95cqw}.bbx .hmf-t small{font-size:.75cqw;color:#9fb6cc}
.bbx .hmf-none{font-size:1cqw;color:#9fb6cc;padding:.6cqw}
`;
