// ══════════════════════════════════════════════════════════════════════
// vp-td-ep/stage.js — paint step N of a Total Drama screen (spec 2026-10-06 §6)
// ══════════════════════════════════════════════════════════════════════
//
// Deterministic: the same screen and step always paint the same picture, so Next, Back,
// Reveal all and Restart are trivial. Only the newest step animates (`fresh`).
//
// Three layers, three jobs (ADDING-A-SHOW §18.1):
//   the WORLD  — the painted plate and its live layer (fire, clouds, smoke, water, bulbs,
//                birds, fireflies), rebuilt only when the scene changes, so a flame never
//                restarts on a click;
//   the CAST   — everyone in the scene at the place steps.js gave them, for the whole scene;
//   the HUD    — the place and time, the camp map, the dialogue panel, the ceremony's plate
//                or tally, title cards, and the Intel drawer (what the camp cannot see).
import { TD_MARKS } from './marks.js';
import { plateKey } from './steps.js';
import { playerAvatarUrl } from '../players.js';

export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const SETS = 'assets/sets/td';
export const avatar = (n, host) => (host && /^chris/i.test(n) ? 'assets/avatars/chris-mclean.png' : playerAvatarUrl(n));

// ── the ledger: what is true at step N, folded from the steps ───────────
export function ledgerAt(screen, idx) {
  const L = { scene: null, conf: null, step: screen.steps[idx] || null, side: [], safe: [], read: null, dead: [], tense: false, out: null, idx };
  screen.steps.forEach((s, i) => {
    if (i > idx) return;
    if (s.k === 'scene') { L.scene = s; L.safeAtScene = L.safe.length; }
    L.conf = s.k === 'conf' ? s : null;
    if (s.k === 'safe') L.safe.push(s.who);
    if (s.k === 'read') { L.read = s; if (s.dead && !L.dead.includes(s.vote)) L.dead.push(s.vote); }
    if (s.k === 'out') L.out = s.who;
    L.tense = !!s.tense;
    (s.side || []).forEach(x => L.side.push({ ...x, at: i }));
  });
  return L;
}

// a seeded random per plate: the live layer looks the same every time it is built
function seeded(key) { let h = 2166136261; for (const c of key) h = Math.imul(h ^ c.charCodeAt(0), 16777619); let s = h >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }

// ══════════════════════════════════════════════════════════════════════
// THE WORLD
// ══════════════════════════════════════════════════════════════════════
// venues whose plates have a 4K render (tools/td-camp/camp.py ... hd)
const HD_VENUES = new Set(['hosted-camp', 'film-lot', 'world-tour', 'survival-island', 'carnival']);
export function worldKey(screen, L) {
  if (L.conf) return `${screen.venue}/confessional`;
  return L.scene?.plate || `${screen.venue}/none`;
}
export function worldHtml(screen, L) {
  // the islands have no booth: a confessional there is shot on location
  const key = L.conf ? (plateKey(screen.venue, 'confessional', /-night$/.test(L.scene?.plate || '') ? 'night' : 'day') || L.scene?.plate) : L.scene?.plate;
  if (!key) return `<div class="tdx-plate tdx-noplate"></div>`;
  const M = TD_MARKS[key] || { h: .5, m: [] };
  const spot = key.split('/')[1].replace(/-(day|night)$/, '');
  const nightFrame = /-night$/.test(key);
  const indoor = ['mess-hall', 'cabin-inside', 'washroom', 'confessional', 'soundstage-corridor', 'prop-storage', 'economy', 'aisle', 'galley', 'cargo-hold', 'first-class', 'shelter', 'theater-tent', 'big-top', 'ceremony', 'trailer-inside', 'boathouse', 'aftermath-studio', 'craft-services'].includes(spot)
    && !(spot === 'ceremony' && ['hosted-camp', 'survival-island', 'carnival', 'film-lot'].includes(screen.venue)) && !(spot === 'shelter' && screen.venue === 'survival-island');
  const r = seeded(key);
  const p = (x, n = 2) => `${(x * 100).toFixed(n)}%`;
  // the 4K render of the same frame, faded in when the camera closes on a conversation
  const hd = HD_VENUES.has(screen.venue) && !L.conf ? `<div class="tdx-plate hd" style="background-image:url('${SETS}/${key}-hd.webp')"></div>` : '';
  const of = k => M.m.filter(m => m.kind === k);
  // the day's weather (the islands keep their own rain)
  const island = /^islands\//.test(key);
  const wx = island || spot === 'confessional' ? null : wxOf(screen, L);
  const wet = wx === 'rain' || wx === 'storm';
  // a plate built from the show's own frame moves by its motion map (glplate.js): wind, water, heat.
  // It is drawn once, by day, and graded for the hour and the weather: a night scene at a day frame
  // is that frame by moonlight, its painted fires and lights still burning.
  const motion = of('motion')[0];
  const night = nightFrame || (!!motion && L.scene?.tod === 'night');
  const grade = !motion ? null : night ? (nightFrame ? (wet ? 'nightrain' : 'none') : 'night') : indoor ? (wet ? 'dim' : 'day')
    : wx === 'storm' ? 'storm' : wx === 'rain' ? 'rain' : wx === 'overcast' ? 'overcast' : wx === 'fog' ? 'fog' : wx === 'hot' ? 'hot'
    : ['morning', 'day', 'dusk'][partOfDay(L.scene?.time)];
  const gl = motion ? `<canvas class="tdx-gl" data-src="${SETS}/${key}" data-grade="${grade}"${HD_VENUES.has(screen.venue) && !L.conf ? ' data-hd="1"' : ''}></canvas>` : '';
  // under a living plate, the sky is a layer of its own: clouds and birds pass behind every tree and roof
  // (the shader leaves the plate see-through only where the frame shows open sky)
  let h = `<div class="tdx-plate" style="background-image:url('${SETS}/${key}.webp')"></div>${hd}<!--sky-->${gl}<div class="tdx-live">`, sky = '';
  const skyward = x => { if (gl) sky += x; else h += x; };
  if (of('lightning').length) h += `<i class="tdx-lightning"></i>`;
  of('cloud').forEach((m, i) => {
    // a cloud lifted out of a traced frame (tools/td-camp/live.py) carries its own width
    const w = m.w != null ? m.w : m.s * m.size * 2.0 * 2.2 * 9 / 16;
    skyward(`<div class="tdx-cloud" style="left:${p(m.u)};top:${p(m.v)};width:${p(w)};--d:${60 + i * 17}s;--dx:${3 + i * 1.5}%"><img src="${SETS}/sprites/${m.sprite}.webp" alt=""></div>`);
  });
  of('fire').forEach((m, i) => {
    const hh = m.hh != null ? m.hh : Math.max(m.s * m.size * 1.25, .012), w = hh * 9 / 16;
    h += `<div class="tdx-glow" style="left:${p(m.u)};top:${p(m.v - (m.hh != null ? m.hh * .35 : m.s * m.size * .4))};width:${p(w * 4.5)}"></div>`;
    if (!m.painted) h += `<div class="tdx-flame" style="left:${p(m.u)};top:${p(m.v)};width:${p(w)};height:${p(hh)}"><img src="${SETS}/sprites/flame.webp" alt="" style="animation-delay:-${(i * .37).toFixed(2)}s"><img src="${SETS}/sprites/flame.webp" alt="" style="animation-delay:-${(i * .21).toFixed(2)}s"></div>`;
    if (m.hh != null ? m.hh > .08 : m.size > .6) {
      for (let e = 0; e < 7; e++) h += `<i class="tdx-ember" style="left:${p(m.u + (r() - .5) * w * .6)};top:${p(m.v - m.s * .5)};--d:${(1.8 + r() * 1.6).toFixed(2)}s;--dl:${(r() * 2).toFixed(2)}s;--ex:${((r() - .5) * 60).toFixed(0)}px"></i>`;
      for (let q = 0; q < 3; q++) h += `<i class="tdx-puff" style="left:${p(m.u)};top:${p(m.v - m.s * 1.4)};width:${p(w * .7)};--d:${4 + q}s;--dl:${q * 1.3}s;--ex:${20 + q * 10}px"></i>`;
    }
  });
  of('smoke').forEach((m, i) => { for (let q = 0; q < 4; q++) h += `<i class="tdx-puff" style="left:${p(m.u)};top:${p(m.v)};width:3%;--d:${5 + q}s;--dl:${q * 1.4 + i}s;--ex:${30 + q * 8}px"></i>`; });
  of('bulb').forEach((m, i) => { h += `<i class="tdx-bulb" style="left:${p(m.u)};top:${p(m.v)};--c:${esc(m.col || '#ffd27a')};--d:${(1.2 + (i % 5) * .4).toFixed(1)}s;--dl:${(i * .17).toFixed(2)}s"></i>`; });
  // traced plates (tools/td-camp/traced): the moving parts of the show's own frame, as regions
  // given in the frame's fractions. A waterfall: streaks running down it, mist at its foot.
  if (!gl) of('fall').forEach((m, i) => {         // (a living plate's waterfall runs in the shader)
    const w = m.u1 - m.u0, hgt = m.v1 - m.v0;
    h += `<div class="tdx-fall" style="left:${p(m.u0)};top:${p(m.v0)};width:${p(w)};height:${p(hgt)};--d:${(1.4 + i * .3).toFixed(1)}s"></div>`;
    for (let q = 0; q < 5; q++) h += `<i class="tdx-puff" style="left:${p(m.u0 + w * (.15 + q * .17))};top:${p(m.v1 - .02)};width:${p(Math.max(w * .5, .03))};--d:${(3 + q * .6).toFixed(1)}s;--dl:${(q * .7).toFixed(1)}s;--ex:${(12 + q * 6)}px"></i>`;
  });
  // still water (a lagoon, a lake, the sea): glints sliding across it, the odd fish. On a living plate
  // they are held to the water's own pixels, so a glint never crosses the hut standing in the sea.
  if (motion?.water) h += `<div class="tdx-water" style="-webkit-mask-image:url('${SETS}/${key}-water.webp');mask-image:url('${SETS}/${key}-water.webp')">`;
  of('pool').forEach((m, i) => {
    const w = m.u1 - m.u0, hgt = m.v1 - m.v0;
    for (let q = 0; q < Math.round(6 + w * 30); q++) h += `<i class="tdx-shimmer" style="left:${p(m.u0 + r() * w * .9)};top:${p(m.v0 + r() * hgt)};width:${p(.015 + r() * .04)};--d:${(3 + r() * 4).toFixed(1)}s;--dl:${(r() * 5).toFixed(1)}s;--ex:${(15 + r() * 40).toFixed(0)}px"></i>`;
    if (m.fish && !night) h += `<i class="tdx-fish" style="left:${p(m.u0 + w * (.2 + r() * .6))};top:${p(m.v0 + hgt * .5)};--d:${(7 + r() * 5).toFixed(1)}s;--dl:${(r() * 6).toFixed(1)}s"></i>`;
  });
  if (motion?.water) h += '</div>';
  // a band of low fog lying across part of the set
  of('mist').forEach((m, i) => { for (let q = 0; q < 3; q++) h += `<i class="tdx-mist band" style="top:${p(m.v0 + q * (m.v1 - m.v0) / 3)};--d:${50 + q * 17 + i * 9}s;--dl:-${q * 11}s"></i>`; });
  // butterflies over a sunny jungle clearing
  of('flutter').forEach((m) => { if (!night) for (let q = 0; q < (m.n || 3); q++) h += `<i class="tdx-butterfly" style="left:${p(m.u0 + r() * (m.u1 - m.u0))};top:${p(m.v0 + r() * (m.v1 - m.v0))};--c:${['#f2c83a', '#e84a8a', '#4ab8e8', '#f28a3a'][q % 4]};--d:${(6 + r() * 4).toFixed(1)}s;--dl:-${(r() * 6).toFixed(1)}s"></i>`; });
  const water = of('water')[0];
  if (water) { const top = M.h + .01, bot = Math.min(water.v, 1); for (let i = 0; i < 16; i++) h += `<i class="tdx-shimmer" style="left:${p(.05 + r() * .85)};top:${p(top + r() * Math.max(bot - top, .04))};width:${p(.02 + r() * .05)};--d:${(3 + r() * 4).toFixed(1)}s;--dl:${(r() * 5).toFixed(1)}s;--ex:${(20 + r() * 50).toFixed(0)}px"></i>`; }
  // the day's weather, painted over the set (a living plate is graded in its shader instead of greyed)
  if (wx && !indoor) {
    const aerial = spot === 'map';
    if ((wx === 'sunny' || wx === 'hot') && !night && !aerial) h += `<i class="tdx-rays${wx === 'hot' ? ' hot' : ''}"></i>`;
    if (wx === 'hot' && !night && !aerial) h += '<i class="tdx-haze"></i>';
    if ((wx === 'overcast' || wet) && !gl) h += `<i class="tdx-grey${wx === 'storm' ? ' storm' : ''}${night ? ' night' : ''}"></i>`;
    if (wet) for (let i = 0; i < (wx === 'storm' ? 110 : 60); i++) h += `<i class="tdx-rain${wx === 'storm' ? ' hard' : ''}" style="left:${p(r() * 1.15 - .1)};--d:${((wx === 'storm' ? .35 : .55) + r() * .3).toFixed(2)}s;--dl:-${(r() * 1).toFixed(2)}s;opacity:${(.25 + r() * .45).toFixed(2)}"></i>`;
    if (wet) for (let i = 0; i < 10; i++) h += `<i class="tdx-splash" style="left:${p(.05 + r() * .9)};top:${p(Math.max(M.h + .1, .62) + r() * .3)};--dl:-${(r() * 1.2).toFixed(2)}s"></i>`;
    if (wx === 'storm') h += '<i class="tdx-flash"></i>';
    if (wx === 'fog') for (let i = 0; i < 4; i++) h += `<i class="tdx-mist" style="top:${p(M.h - .08 + i * .12)};--d:${40 + i * 13}s;--dl:-${i * 9}s"></i>`;
    if (wx === 'breezy' || wx === 'storm') for (let i = 0; i < 10; i++) h += `<i class="tdx-leaf gust" style="left:${p(.05 + r() * .9)};top:${p(.05 + r() * .5)};--d:${(4 + r() * 3).toFixed(1)}s;--dl:${(r() * 6).toFixed(1)}s;--ex:${(-260 + r() * 80).toFixed(0)}px;--c:${['#c8902e', '#d8a83a', '#7a9a4a'][i % 3]}"></i>`;
  }
  if (wx && indoor && wet) h += `<i class="tdx-grey indoor"></i>${wx === 'storm' ? '<i class="tdx-flash soft"></i>' : ''}`;
  if (!indoor && !night && !wet && wx !== 'fog' && wx !== 'overcast') {
    for (let i = 0; i < 3; i++) skyward(`<div class="tdx-bird" style="top:${8 + i * 6}%;--d:${16 + i * 7}s;--dl:${i * 6 - 4}s"><svg viewBox="0 0 20 8"><path d="M1 6c3-4 6-4 9 0 3-4 6-4 9 0" stroke="#2a2a3a" stroke-width="1.6" fill="none"/></svg></div>`);
    if (['cabins', 'campfire', 'forest-trail', 'communal-grounds', 'forest-edge', 'campsite', 'corn-maze'].includes(spot))
      for (let i = 0; i < 6; i++) h += `<i class="tdx-leaf" style="left:${p(.1 + r() * .8)};top:${p(.05 + r() * .2)};--d:${(8 + r() * 6).toFixed(1)}s;--dl:${(r() * 10).toFixed(1)}s;--ex:${(-80 + r() * 60).toFixed(0)}px;--c:${['#c8902e', '#d8a83a', '#b8742a'][i % 3]}"></i>`;
  }
  if (!indoor && night) for (let i = 0; i < 12; i++) h += `<i class="tdx-fly" style="left:${p(.05 + r() * .9)};top:${p(M.h + .05 + r() * .4)};--d:${(5 + r() * 6).toFixed(1)}s;--dl:-${(r() * 6).toFixed(1)}s"></i>`;
  if (indoor && spot !== 'confessional') for (let i = 0; i < 14; i++) h += `<i class="tdx-mote" style="left:${p(.1 + r() * .8)};top:${p(.15 + r() * .6)};--d:${(10 + r() * 8).toFixed(1)}s"></i>`;
  if (spot === 'confessional') for (let i = 0; i < 6; i++) h += `<i class="tdx-gnat" style="left:${30 + i * 8}%;top:${20 + (i % 3) * 12}%;--dl:-${(i * .45).toFixed(2)}s;--gd:${(2 + (i % 3) * .7).toFixed(1)}s"></i>`;
  if (/^islands\/rescue-/.test(key)) {
    for (let i = 0; i < 70; i++) h += `<i class="tdx-rain" style="left:${p(r() * 1.1 - .05)};--d:${(.45 + r() * .35).toFixed(2)}s;--dl:-${(r() * 1).toFixed(2)}s;opacity:${(.25 + r() * .4).toFixed(2)}"></i>`;
    h += '<i class="tdx-flash"></i>';
  }
  h += `</div>${night && !indoor && !gl ? '<div class="tdx-wash"></div>' : ''}`;
  // the sky behind a living plate takes the hour and the weather: stars and a moon, storm cloud, dusk
  const moon = grade === 'night' ? '<i class="tdx-moon"></i>' : '';
  return h.replace('<!--sky-->', gl ? `<div class="tdx-sky g-${grade}">${moon}${sky}</div>` : '');
}
// Each venue's climate: the weathers its days are drawn from, the commoner ones listed more than once.
// A northern lake camp gets sun, wind, cloud, rain, a storm and morning fog; a tropical island is hot,
// with sudden storms; a film lot in the sun; a carnival in the autumn woods, grey and foggy.
const CLIMATE = {
  'hosted-camp': ['sunny', 'sunny', 'calm', 'calm', 'breezy', 'overcast', 'rain', 'storm', 'fog'],
  'survival-island': ['sunny', 'hot', 'hot', 'calm', 'breezy', 'rain', 'storm', 'sunny'],
  'film-lot': ['sunny', 'sunny', 'hot', 'calm', 'overcast', 'breezy', 'fog'],
  'world-tour': ['sunny', 'calm', 'breezy', 'overcast', 'rain', 'fog', 'hot'],
  carnival: ['overcast', 'overcast', 'fog', 'breezy', 'calm', 'rain', 'storm', 'sunny'],
};
export const WEATHER_LABEL = { sunny: 'Sunny', calm: 'Clear', breezy: 'Windy', overcast: 'Overcast', rain: 'Rain', storm: 'Storm', fog: 'Fog', hot: 'Heatwave' };
/** The day's weather at a venue: one per episode, the same on every replay. */
// The day's weather has an arc (the user: "make sure the weather moves too"): the morning fog
// burns off by midday, a grey morning turns to rain by the evening, a storm builds through the
// afternoon and breaks before the vote, a hot day starts merely sunny. Keyed to the clock on the
// scene, so the same scene always has the same sky.
const ARC = {
  sunny: ['calm', 'sunny', 'sunny'], hot: ['sunny', 'hot', 'calm'], calm: ['calm', 'calm', 'calm'], breezy: ['breezy', 'breezy', 'calm'],
  overcast: ['overcast', 'overcast', 'rain'], rain: ['overcast', 'rain', 'rain'], storm: ['overcast', 'breezy', 'storm'], fog: ['fog', 'calm', 'overcast'],
};
/** Which part of the day a scene's clock is in: 0 morning (before 9), 1 the day, 2 the evening (from 4:30). */
export function partOfDay(time) {
  const m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(String(time || ''));
  if (!m) return 1;
  let h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12;
  const mins = h * 60 + +m[2];
  return mins < 9 * 60 ? 0 : mins < 16 * 60 + 30 ? 1 : 2;
}
/** The weather at one scene: the day's weather, where its arc has got to by the scene's clock. */
export function weatherAt(venue, ep, time) { const day = weatherOf(venue, ep); return (ARC[day] || [day, day, day])[partOfDay(time)]; }
const wxOf = (screen, L) => weatherAt(screen.venue, screen.ep, L?.scene?.time || (/-night$/.test(L?.scene?.plate || '') ? '9:00 PM' : ''));
export function weatherOf(venue, ep) {
  const c = CLIMATE[venue] || CLIMATE['hosted-camp'];
  let h = 2166136261; for (const ch of `${venue}|${ep}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return c[(h >>> 0) % c.length];
}
/** What the live layer is made of, for the ambience (sound.js). */
export function worldSound(screen, L) {
  const key = L.conf ? (plateKey(screen.venue, 'confessional', /-night$/.test(L.scene?.plate || '') ? 'night' : 'day') || L.scene?.plate) : L.scene?.plate;
  const M = (key && TD_MARKS[key]) || { m: [] };
  const spot = String(key || '').split('/')[1]?.replace(/-(day|night)$/, '') || '';
  const indoor = /mess-hall|cabin-inside|washroom|confessional|corridor|storage|economy|aisle|galley|cargo|first-class|theater|big-top|trailer-inside|boathouse|aftermath|craft-services/.test(spot) || (spot === 'ceremony' && screen.venue === 'world-tour') || (spot === 'shelter' && screen.venue === 'carnival');
  const night = /-night$/.test(key || ''), island = /^islands\//.test(key || '');
  // the venue's own soundscape, and the day's weather in it (the same day, the same weather)
  const scape = island || spot === 'confessional' ? null
    : { venue: screen.venue, night, open: !indoor, shore: M.m.some(m => m.kind === 'water'), weather: wxOf(screen, L) };
  const wx = scape?.weather, wet = wx === 'rain' || wx === 'storm';
  const isleRain = /^islands\/rescue-/.test(key || '');
  return { rain: isleRain || (wet && !indoor), storm: isleRain || (wx === 'storm' && !indoor), fire: M.m.filter(m => m.kind === 'fire').length, water: M.m.some(m => m.kind === 'water') && !scape,
    outdoor: !indoor && !scape, night, indoor, flies: spot === 'confessional', crowd: screen.venue === 'carnival' && /midway|entrance|big-top/.test(spot), scape };
}

// ══════════════════════════════════════════════════════════════════════
// THE CAST — everyone in the scene, where steps.js put them
// ══════════════════════════════════════════════════════════════════════
const BUSY_ICON = {
  fish: '<path d="M3 12c4-5 10-5 14 0-4 5-10 5-14 0zM17 12l4-3v6z" fill="#7ad0e8"/>',
  read: '<path d="M3 5h7a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H3zM21 5h-7a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h7z" fill="#f2e2b0"/>',
  eat: '<path d="M3 12h18a9 6 0 0 1-18 0zM8 4v5M12 3v6M16 4v5" stroke="#f2e2b0" stroke-width="2" fill="#c8a06a"/>',
  stretch: '<circle cx="12" cy="5" r="2.5" fill="#ffc23a"/><path d="M4 9l8 2 8-2M12 11v5l-4 5M12 16l4 5" stroke="#ffc23a" stroke-width="2.2" fill="none" stroke-linecap="round"/>',
  nap: '<path d="M5 6h7l-7 8h7M14 12h5l-5 6h5" stroke="#c8d8ff" stroke-width="2.2" fill="none" stroke-linejoin="round"/>',
  sweep: '<path d="M14 3l-6 12M5 15h8l2 6H3z" stroke="#e8c87a" stroke-width="2" fill="#c8a050"/>',
  whittle: '<path d="M4 20l9-9M13 11l6-6 2 2-6 6z" stroke="#e8d0a0" stroke-width="2" fill="none"/>',
  fetch: '<path d="M6 8h12l-2 12H8zM6 8c0-3 12-3 12 0" stroke="#9ad8e8" stroke-width="2" fill="#5ab0c8"/>',
};
export const BUSY_LABEL = { fish: 'fishing', read: 'reading', eat: 'eating', stretch: 'warming up', nap: 'napping', sweep: 'sweeping up', whittle: 'whittling', fetch: 'fetching water' };

/** Who is on stage at step N, and how: a list of tokens. Never loses a person mid-scene. */
export function castAt(screen, L) {
  const s = L.step || {};
  if (L.conf) return [{ n: L.conf.by, u: .5, v: .8, h: 50, speak: true, conf: true }];
  const sc = L.scene; if (!sc) return [];
  const speaker = (s.k === 'say' || s.k === 'conf') ? s.by : (s.k === 'safe' ? s.who : null);
  const focus = s.focus || null;
  const toks = [];
  for (const [n, pl] of Object.entries(sc.places || {})) {
    if (sc.exit && n !== sc.exit && !pl.host) continue;
    const bg = (sc.bg || []).find(b => b.n === n);
    const busy = !bg && sc.acts?.[n] && !(focus || []).includes(n) && n !== speaker ? sc.acts[n] : null;
    const sit = !!pl.sit;
    const h = pl.host ? Math.max(Math.min(pl.s * 125, 30), 16) : sit ? Math.max(Math.min(pl.s * 95, 24), 13) : Math.max(Math.min(pl.s * 125, sc.exit ? 30 : 34), bg ? 11 : 16);
    toks.push({ n, u: pl.u, v: pl.v, h, sit, host: !!pl.host, act: bg?.act || busy || null,
      speak: n === speaker || (pl.host && s.host), dim: !!(focus && focus.length && !focus.includes(n) && !pl.host && n !== speaker),
      bg: !!bg, safe: L.safe.includes(n), out: L.out === n });
  }
  return toks;
}
/**
 * The camera (the user, 2026-10-07: "zoom like in the traitors when someone talks"). Who is in
 * the shot: the people in this conversation (the scene's focus), leaning toward whoever is
 * talking. A scene's opening, a stage direction with nobody in it, the host at a ceremony and
 * the confessional stay wide. Returns { k, x, y, who }: scale, and the world's offset as a
 * fraction of the frame (transform-origin 0 0), clamped so the set always fills the frame.
 */
export function shotOf(screen, L, toks) {
  const s = L.step || {};
  const wide = { k: 1, x: 0, y: 0, who: [] };
  if (L.conf || !L.scene || s.k === 'scene' || s.k === 'title' || s.k === 'found' || s.k === 'ballots') return wide;
  const speaker = s.k === 'say' ? s.by : s.k === 'safe' ? s.who : s.k === 'read' ? null : null;
  const ceremony = !!L.scene.ceremony;
  if (s.host && ceremony) return wide;
  if (ceremony && !speaker && !(s.focus || []).length) return wide;
  const near = toks.filter(t => !t.bg && !t.host);
  let group = ceremony ? [speaker, ...(s.focus || [])] : [...(L.scene.focus || []), speaker, ...(s.focus || [])];
  group = [...new Set(group.filter(Boolean))].filter(n => near.some(t => t.n === n));
  if (s.host && !ceremony) group = [...new Set([...group, ...toks.filter(t => t.host).map(t => t.n)])];
  if (!group.length || group.length > 4) return wide;
  const box = n => { const t = toks.find(x => x.n === n); const w = t.h * 9 / 16 / 100, h = t.h / 100; return { x0: t.u - w / 2, x1: t.u + w / 2, y0: t.v - h, y1: t.v + h * 0.12, cx: t.u, cy: t.v - h / 2 }; };
  const bs = group.map(box);
  const x0 = Math.min(...bs.map(b => b.x0)), x1 = Math.max(...bs.map(b => b.x1)), y0 = Math.min(...bs.map(b => b.y0)), y1 = Math.max(...bs.map(b => b.y1));
  // a stage direction frames everyone in it a little looser than a line
  const fill = s.k === 'beat' ? 0.78 : 0.66;
  let k = Math.min(fill / Math.max(x1 - x0, 0.05), (fill * 0.95) / Math.max(y1 - y0, 0.05));
  k = Math.max(1, Math.min(k, group.length === 1 ? 2.1 : 1.9));
  if (k < 1.12) return wide;
  let cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const sp = speaker && group.includes(speaker) && group.length > 1 ? box(speaker) : null;
  if (sp) { cx = cx * 0.55 + sp.cx * 0.45; }
  // the people sit above the dialogue panel
  let x = 0.5 - k * cx, y = 0.4 - k * cy;
  x = Math.min(0, Math.max(1 - k, x)); y = Math.min(0, Math.max(1 - k, y));
  return { k: +k.toFixed(3), x: +x.toFixed(4), y: +y.toFixed(4), who: group };
}

export function tokHtml(t, fresh) {
  const w = t.h * 9 / 16;
  const busy = t.act ? `${t.act === 'fish' ? '<div class="tdx-rod"><i></i></div>' : ''}${t.act === 'nap' ? '<b class="tdx-zzz">z</b>' : ''}<div class="tdx-busy" title="${esc(BUSY_LABEL[t.act] || '')}"><svg viewBox="0 0 24 24">${BUSY_ICON[t.act] || ''}</svg></div>` : '';
  const cls = ['tdx-tok', t.speak && 'speak', t.dim && 'dim', t.bg && 'bg', t.sit && 'sit', t.host && 'host', t.conf && 'conf', t.out && 'out', t.act && `act-${t.act}`].filter(Boolean).join(' ');
  return `<div class="${cls}" data-n="${esc(t.n)}" style="left:${t.u * 100}%;top:${t.v * 100}%;height:${t.h}%;width:${w}%;z-index:${Math.round(t.v * 100) + (t.speak ? 50 : 0)}"><div class="body"><div class="shadow"></div><div class="face"><img src="${esc(avatar(t.n, t.host))}" alt="" onerror="this.style.visibility='hidden'"></div><div class="tag">${esc(t.host ? t.n + ' · host' : t.n)}</div>${t.safe ? '<i class="tdx-got"></i>' : ''}${busy}</div></div>`;
}

// ══════════════════════════════════════════════════════════════════════
// THE HUD
// ══════════════════════════════════════════════════════════════════════
const ICON = {
  dock: '<path d="M2 15h20M5 15v5M10 15v5M14 15v5M19 15v5M4 11l8-6 8 6" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
  fire: '<path d="M12 3c2 3 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-8z" stroke="currentColor" stroke-width="2.2" fill="none"/>',
  home: '<path d="M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linejoin="round"/>',
  tree: '<path d="M12 2l6 9h-4l5 7H5l5-7H6zM12 18v4" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linejoin="round"/>',
  cam: '<path d="M3 7h12v10H3zM15 10l6-3v10l-6-3" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linejoin="round"/>',
  food: '<path d="M5 3v8a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 0-3 3-3 6s1 3 3 3v9" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
  water: '<path d="M2 14c3-3 5 3 8 0s5 3 8 0 3 0 4 0M2 19c3-3 5 3 8 0s5 3 8 0" stroke="currentColor" stroke-width="2.2" fill="none"/>',
  star: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/>',
  exit: '<path d="M3 17h18l-3 4H6zM12 3v12M12 4l6 7h-6" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linejoin="round"/>',
};
const iconFor = spot => /crossroads/.test(spot) ? ICON.fire : /exile|rescue|redemption/.test(spot) ? ICON.water : /dock|exit|shore|beach|lake|water|fishing/.test(spot) ? (spot === 'exit' ? ICON.exit : spot === 'dock' ? ICON.dock : ICON.water)
  : /fire|ceremony|trial/.test(spot) ? ICON.fire : /mess|craft|galley|midway/.test(spot) ? ICON.food : /trail|forest|jungle|maze|edge/.test(spot) ? ICON.tree
  : /confessional/.test(spot) ? ICON.cam : /stage|lot|top|theater|carnival|first/.test(spot) ? ICON.star : ICON.home;

export function hudHtml(screen, L, fresh, o = {}) {
  const s = L.step || {};
  const sc = L.scene || {};
  let h = '';
  if (L.conf) h += `<div class="tdx-cvig"></div><div class="tdx-grain"></div><div class="tdx-rec">Confessional</div>`;
  const place = L.conf ? 'The Confession Cam' : (sc.place || '');
  const freshLoc = fresh && (s.k === 'scene' || (s.k === 'conf' && L.idx > 0 && screen.steps[L.idx - 1]?.k !== 'conf'));
  h += `<div class="tdx-loc${freshLoc ? ' fresh' : ''}"><div class="ic"><svg viewBox="0 0 24 24">${iconFor(L.conf ? 'confessional' : (sc.spot || ''))}</svg></div><div class="txt"><div class="place">${esc(place)}</div><div class="when"><b>Episode ${esc(screen.ep)}</b>${sc.time && !L.conf ? ' · ' + esc(sc.time) : ''}${sc.cut && !L.conf ? ' · meanwhile' : ''}</div></div></div>`;
  // the day's weather, as a chip: the same weather the set shows and the sound plays
  const wx = !L.conf && sc.plate && !/^islands\//.test(sc.plate) ? wxOf(screen, L) : null;
  const clearNight = /-night$/.test(sc.plate || '') && ['calm', 'sunny', 'hot'].includes(wx);
  if (wx) h += `<div class="tdx-wx"><svg viewBox="0 0 24 24">${WX_ICON[clearNight ? 'night' : wx] || ''}</svg>${esc(clearNight ? 'Clear night' : WEATHER_LABEL[wx])}</div>`;
  if (screen.team && !L.conf) h += `<div class="tdx-team" style="--tc:${esc(o.teamColor || '#4fb84a')}">${esc(screen.team)}</div>`;
  if (screen.kind === 'tribal' && !sc.exit) {
    if (VENUE_ITEM[screen.venue]) {
      const total = (L.scene?.seated || []).length - 1;
      const got = L.safe.length;
      h += `<div class="tdx-plateh">${esc(VENUE_ITEM[screen.venue])} ${Array.from({ length: Math.max(total, 0) }, (_, i) => `<i class="${i < got ? 'gone' : ''}"></i>`).join('')}</div>`;
    } else if (L.read) {
      const t = L.read.tally || {};
      h += `<div class="tdx-tally">${Object.entries(t).sort((a, b) => b[1] - a[1]).map(([n, c]) => `<span><img src="${esc(avatar(n))}" alt="">${esc(n)} <b>${c}</b></span>`).join('')}${L.read.dead ? '<span class="void">Does not count</span>' : ''}</div>`;
    }
  }
  if (L.tense) h += `<div class="tdx-chop">On the chopping block</div>`;
  if (s.k === 'title') h += `<div class="tdx-title${fresh ? ' fresh' : ''}${s.tone ? ' ' + esc(s.tone) : ''}${s.vs ? ' vs' : ''}"><div class="band"></div><div class="inner"><div class="kicker">${esc(s.kicker)}</div><div class="big">${esc(s.name)}</div></div><div class="faces">${(s.faces || []).map((n, i) => `${s.vs && i ? '<b class="vsx">VS</b>' : ''}<img src="${esc(avatar(n))}" alt="">`).join('')}</div></div>`;
  if (s.k === 'found') h += foundHtml(s, fresh);
  if (s.k === 'ballots') h += `<div class="tdx-title tdx-ballots${fresh ? ' fresh' : ''}"><div class="band"></div><div class="inner"><div class="kicker">The vote</div><div class="big">${esc(s.text)}</div></div><div class="faces">${(s.who || []).map((n, i) => `<span style="--i:${i}"><img src="${esc(avatar(n))}" alt=""><b>✓</b></span>`).join('')}</div></div>`;
  if (s.k === 'idol') h += `<div class="tdx-idol${fresh ? ' fresh' : ''}"><div class="rays"></div><div class="totem"><svg viewBox="0 0 60 90"><path d="M18 10h24l4 18-6 8 6 10-4 34H18l-4-34 6-10-6-8z" fill="#c89a3a" stroke="#3a2210" stroke-width="3"/><circle cx="24" cy="24" r="4" fill="#3a2210"/><circle cx="36" cy="24" r="4" fill="#3a2210"/><path d="M22 34h16M24 56h12M22 66h16" stroke="#3a2210" stroke-width="3"/></svg></div><div class="lbl">Hidden Immunity Idol</div><div class="for"><img src="${esc(avatar(s.by))}" alt="">${s.for !== s.by ? `<span>→</span><img src="${esc(avatar(s.for))}" alt="">` : ''}</div></div>`;
  if (s.k === 'out') h += `<div class="tdx-outcard${fresh ? ' fresh' : ''}"><img src="${esc(avatar(s.who))}" alt=""><div>${esc(s.who)}</div><span>${s.island ? 'Voted out' : 'Eliminated'}</span></div>`;
  return h;
}
const WX_ICON = {
  sunny: '<circle cx="12" cy="12" r="5" fill="#ffc23a"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4M4 4l3 3M17 17l3 3M4 20l3-3M17 7l3-3" stroke="#ffc23a" stroke-width="2" stroke-linecap="round"/>',
  hot: '<circle cx="12" cy="10" r="5" fill="#ff8a1f"/><path d="M4 19c2-2 4 2 6 0s4 2 6 0 4 2 4 0" stroke="#ff8a1f" stroke-width="2" fill="none"/>',
  calm: '<circle cx="9" cy="9" r="4" fill="#ffd27a"/><path d="M8 18a4 4 0 0 1 0-8 5 5 0 0 1 9.5 1.5A3.5 3.5 0 0 1 17 18z" fill="#eef3fb"/>',
  night: '<path d="M15 3a8 8 0 1 0 6 13A7 7 0 0 1 15 3z" fill="#f4f0d8"/>',
  breezy: '<path d="M3 8h11a3 3 0 1 0-3-3M3 13h16a3 3 0 1 1-3 3M3 18h8" stroke="#bfe6ff" stroke-width="2" fill="none" stroke-linecap="round"/>',
  overcast: '<path d="M6 19a5 5 0 0 1 0-10 7 7 0 0 1 13 2 4 4 0 0 1 0 8z" fill="#b8c0d0"/>',
  rain: '<path d="M6 14a4 4 0 0 1 0-8 6 6 0 0 1 11 1.5A3.5 3.5 0 0 1 17 14z" fill="#b8c0d0"/><path d="M8 17l-1 4M12 17l-1 4M16 17l-1 4" stroke="#8ac8ff" stroke-width="2" stroke-linecap="round"/>',
  storm: '<path d="M6 13a4 4 0 0 1 0-8 6 6 0 0 1 11 1.5A3.5 3.5 0 0 1 17 13z" fill="#8a92a8"/><path d="M12 13l-3 5h3l-2 5 5-7h-3l2-3z" fill="#ffd23a"/>',
  fog: '<path d="M3 8h18M5 12h14M3 16h18M7 20h10" stroke="#d8dde6" stroke-width="2.2" stroke-linecap="round"/>',
};
// what was found, held up to the camera: the idol a totem, an amulet a pendant, a vote a scroll
const ITEM_ART = {
  idol: '<path d="M18 10h24l4 18-6 8 6 10-4 34H18l-4-34 6-10-6-8z" fill="#c89a3a" stroke="#3a2210" stroke-width="3"/><circle cx="24" cy="24" r="4" fill="#3a2210"/><circle cx="36" cy="24" r="4" fill="#3a2210"/><path d="M22 34h16M24 56h12M22 66h16" stroke="#3a2210" stroke-width="3"/>',
  amulet: '<path d="M14 8q16 22 32 0" stroke="#d8c890" stroke-width="3" fill="none"/><circle cx="30" cy="48" r="20" fill="#3ab0a0" stroke="#10302a" stroke-width="3"/><circle cx="30" cy="48" r="9" fill="#8af0e0" stroke="#10302a" stroke-width="2.5"/><path d="M30 20v8" stroke="#d8c890" stroke-width="3"/>',
  scroll: '<rect x="12" y="16" width="36" height="56" rx="4" fill="#f2e2b0" stroke="#3a2a10" stroke-width="3"/><rect x="8" y="10" width="44" height="10" rx="5" fill="#c8a060" stroke="#3a2a10" stroke-width="3"/><rect x="8" y="68" width="44" height="10" rx="5" fill="#c8a060" stroke="#3a2a10" stroke-width="3"/><path d="M20 32h20M20 42h20M20 52h14" stroke="#7a5a30" stroke-width="3"/>',
  clue: '<path d="M10 14h40v60H10z" fill="#e8dcc0" stroke="#3a2a10" stroke-width="3" transform="rotate(-6 30 44)"/><path d="M18 30h22M18 40h16M18 50h22" stroke="#7a5a30" stroke-width="3" transform="rotate(-6 30 44)"/><path d="M34 56l8 8M42 56l-8 8" stroke="#c8302a" stroke-width="4"/>',
  none: '<circle cx="30" cy="46" r="22" fill="none" stroke="#9aa4b8" stroke-width="4" stroke-dasharray="6 6"/><path d="M22 38l16 16M38 38L22 54" stroke="#9aa4b8" stroke-width="4"/>',
};
const artFor = item => !item ? 'none' : /idol/.test(item) ? 'idol' : /amulet|secondLife/i.test(item) ? 'amulet' : item === 'clue' ? 'clue' : 'scroll';
function foundHtml(s, fresh) {
  const art = artFor(s.item);
  return `<div class="tdx-idol tdx-found ${art}${fresh ? ' fresh' : ''}">${s.item ? '<div class="rays"></div>' : ''}<div class="totem"><svg viewBox="0 0 60 90">${ITEM_ART[art]}</svg></div><div class="lbl">${esc(s.item ? s.label + ' found' : 'Nothing found')}</div><div class="for"><img src="${esc(avatar(s.who))}" alt=""></div></div>`;
}
const VENUE_ITEM = { 'hosted-camp': 'Marshmallows', 'film-lot': 'Gilded Chrises', 'world-tour': 'Barf bags' };

// ── the dialogue panel ────────────────────────────────────────────────
export function dialogue(screen, L) {
  const s = L.step || {};
  const host = screen.host || 'Chris';
  if (s.k === 'say') return { name: s.by, cls: s.host ? 'host' : '', text: s.text, cut: s.host ? null : s.by, hostCut: s.host ? s.by : null };
  if (s.k === 'conf') return { name: s.by, cls: 'conf', text: s.text, quote: true };
  if (s.k === 'beat') return { name: '', cls: 'dir', text: s.text, badge: s.badge };
  if (s.k === 'safe') return { name: host, cls: 'host', text: s.immune ? `${s.who}, you won immunity.` : `${s.who}.`, hostCut: host };
  if (s.k === 'read') return { name: host, cls: 'host', text: s.dead ? `${s.vote}. Does not count.` : s.revote ? `${s.vote}.` : s.deciding ? `${s.vote}. That's enough.` : `${s.vote}.`, hostCut: host };
  if (s.k === 'out') return { name: '', cls: 'dir', text: `${s.who} is ${s.island ? 'voted out' : 'eliminated'}.` };
  if (s.k === 'found') return s.text ? { name: '', cls: 'dir', text: s.text, badge: s.item ? { text: s.label.toUpperCase(), cls: 'gold' } : null } : { name: '', cls: 'dir hidden', text: '' };
  if (s.k === 'idol') return { name: '', cls: 'dir', text: `${s.by} stands up and plays a Hidden Immunity Idol${s.for !== s.by ? ` for ${s.for}` : ''}.` };
  if (s.k === 'ballots' || s.k === 'title') return { name: '', cls: 'dir hidden', text: '' };
  return { name: '', cls: 'dir hidden', text: '' };
}

// ── the Intel drawer ──────────────────────────────────────────────────
const TABS = {
  camp: [['log', 'Camp log'], ['allies', 'Alliances'], ['secrets', 'Secrets']],
  tribal: [['room', 'The room'], ['tally', 'Tally'], ['why', 'Why']],
  island: [['residents', 'Who is here'], ['log', 'Island log'], ['secrets', 'Secrets']],
};
export function intelHtml(screen, L, tab, fresh) {
  const tabs = TABS[screen.kind] || TABS.camp;
  if (!tabs.some(t => t[0] === tab)) tab = tabs[0][0];
  const items = L.side;
  let h = `<div class="tdx-ihead"><b>Intel</b><span>${screen.kind === 'tribal' ? 'Only the viewer sees the votes.' : screen.kind === 'island' ? 'Out of sight of the game.' : 'What the camp doesn’t know yet.'}</span></div><div class="tdx-itabs">`;
  for (const [k, l] of tabs) h += `<button type="button" class="${k === tab ? 'on' : ''}" data-tab="${k}">${esc(l)}${items.some(x => x.tab === k && x.at === L.idx) && k !== tab ? '<i></i>' : ''}</button>`;
  h += '</div><div class="tdx-ilist">';
  const mine = items.filter(x => x.tab === tab), fr = x => (fresh && x.at === L.idx ? ' fresh' : '');
  if (tab === 'allies') mine.forEach(x => { h += `<div class="tdx-ic${fr(x)}"><b>${esc(x.name)}</b><div class="minis">${(x.who || []).map(n => `<img src="${esc(avatar(n))}" alt="" title="${esc(n)}">`).join('')}</div></div>`; });
  else if (tab === 'tally') {
    const by = {}; mine.forEach(x => (by[x.target] ||= []).push(x));
    Object.entries(by).sort((a, b) => b[1].filter(v => !v.void).length - a[1].filter(v => !v.void).length).forEach(([t, vs]) => {
      h += `<div class="tdx-ic tally${vs.some(v => v.at === L.idx) && fresh ? ' fresh' : ''}"><img src="${esc(avatar(t))}" alt=""><div><b>${esc(t)}</b><br><small>${vs.map(v => esc(v.voter) + (v.void ? ' (void)' : '')).join(', ')}</small></div><span>${vs.filter(v => !v.void).length}</span></div>`;
    });
  } else if (tab === 'why') mine.forEach(x => { h += `<div class="tdx-ic${fr(x)}"><b>${esc(x.voter)}</b> <span class="k">→ ${esc(x.target)}</span><br><small>${esc(x.text)}</small></div>`; });
  else mine.forEach(x => { h += `<div class="tdx-ic${fr(x)}">${esc(x.text)}</div>`; });
  if (!mine.length) h += `<div class="tdx-iempty">${screen.kind === 'tribal' && tab !== 'room' ? 'After the result.' : 'Nothing yet.'}</div>`;
  return h + '</div>';
}

/** The whole step as one string (tests, and the first paint). */
export function stageHtml(screen, idx, fresh = false, o = {}) {
  const L = ledgerAt(screen, idx);
  const toks = castAt(screen, L);
  const d = dialogue(screen, L);
  return { L, html: `<div class="tdx-world">${worldHtml(screen, L)}<div class="tdx-cast">${toks.map(t => tokHtml(t, fresh)).join('')}</div><div class="tdx-fx"></div></div><div class="tdx-hud">${hudHtml(screen, L, fresh, o)}</div>`, toks, d };
}
