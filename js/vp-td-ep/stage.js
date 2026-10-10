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
const HD_VENUES = new Set(['hosted-camp', 'film-lot', 'world-tour', 'survival-island', 'carnival', 'redemption']);
export function worldKey(screen, L) {
  if (L.conf) return L.conf.plate || `${screen.venue}/confessional`;
  return L.scene?.plate || `${screen.venue}/none`;
}
const CRITTER = {"crab": "<svg viewBox=\"0 0 40 24\"><g stroke=\"#5a1a0a\" stroke-width=\"1.6\" fill=\"#e8552e\"><ellipse cx=\"20\" cy=\"15\" rx=\"10\" ry=\"6\"/><path d=\"M10 13l-6-6 3 8M30 13l6-6-3 8\" fill=\"none\"/><path d=\"M12 19l-5 4M15 20l-3 4M25 20l3 4M28 19l5 4\" fill=\"none\"/></g><circle cx=\"17\" cy=\"10\" r=\"1.6\" fill=\"#111\"/><circle cx=\"23\" cy=\"10\" r=\"1.6\" fill=\"#111\"/></svg>", "duck": "<svg viewBox=\"0 0 44 30\"><path d=\"M6 20c0-7 8-10 16-8 3-8 13-8 14-1 1 4-2 6-5 7 5 3 3 10-8 10H14C9 28 6 25 6 20z\" fill=\"#f4f0e6\" stroke=\"#2a2a3a\" stroke-width=\"1.6\"/><path d=\"M36 13l7 1-6 3z\" fill=\"#f2a43a\" stroke=\"#2a2a3a\" stroke-width=\"1.2\"/><circle cx=\"31\" cy=\"11\" r=\"1.6\" fill=\"#111\"/></svg>", "squirrel": "<svg viewBox=\"0 0 44 34\"><path d=\"M6 30c-6-10 0-24 10-22 6 1 5 9 0 10 8 0 12 4 12 12z\" fill=\"#b8742a\" stroke=\"#4a2a10\" stroke-width=\"1.6\"/><path d=\"M24 30c0-8 4-12 9-12 4-6 10-4 10 1 0 4-3 5-5 6 0 3-1 5-4 5z\" fill=\"#c9843a\" stroke=\"#4a2a10\" stroke-width=\"1.6\"/><circle cx=\"38\" cy=\"17\" r=\"1.4\" fill=\"#111\"/></svg>", "parrot": "<svg viewBox=\"0 0 44 30\"><path d=\"M4 16c8-10 22-12 30-6l8-2-5 6c-6 9-22 12-33 2z\" fill=\"#e23b3b\" stroke=\"#3a1010\" stroke-width=\"1.5\"/><path d=\"M14 14l10-10 6 8z\" fill=\"#2a8ad8\" stroke=\"#3a1010\" stroke-width=\"1.4\"/><path d=\"M8 18l-6 8 10-4z\" fill=\"#f2c83a\" stroke=\"#3a1010\" stroke-width=\"1.2\"/><circle cx=\"33\" cy=\"12\" r=\"1.5\" fill=\"#111\"/></svg>", "frog": "<svg viewBox=\"0 0 40 26\"><path d=\"M4 22c0-8 7-14 16-14s16 6 16 14z\" fill=\"#4fb84a\" stroke=\"#1a4a1a\" stroke-width=\"1.6\"/><circle cx=\"13\" cy=\"9\" r=\"5\" fill=\"#4fb84a\" stroke=\"#1a4a1a\" stroke-width=\"1.6\"/><circle cx=\"27\" cy=\"9\" r=\"5\" fill=\"#4fb84a\" stroke=\"#1a4a1a\" stroke-width=\"1.6\"/><circle cx=\"13\" cy=\"9\" r=\"2\" fill=\"#111\"/><circle cx=\"27\" cy=\"9\" r=\"2\" fill=\"#111\"/></svg>", "seagull": "<svg viewBox=\"0 0 44 26\"><path d=\"M8 18c4-6 14-8 22-6l8-3-3 6c-2 6-14 9-27 3z\" fill=\"#f4f4f4\" stroke=\"#2a2a3a\" stroke-width=\"1.5\"/><path d=\"M14 13l6-9 6 7z\" fill=\"#c8ccd4\" stroke=\"#2a2a3a\" stroke-width=\"1.3\"/><path d=\"M38 9l5 1-4 2z\" fill=\"#f2a43a\"/><circle cx=\"34\" cy=\"10\" r=\"1.4\" fill=\"#111\"/><path d=\"M18 21v4M24 21v4\" stroke=\"#f2a43a\" stroke-width=\"1.6\"/></svg>", "raccoon": "<svg viewBox=\"0 0 48 32\"><path d=\"M8 26c0-9 8-14 18-14s14 4 14 10v4z\" fill=\"#8a8a92\" stroke=\"#2a2a32\" stroke-width=\"1.6\"/><path d=\"M2 20c2-4 6-5 8-3l-2 8c-4 0-6-2-6-5z\" fill=\"#6a6a72\" stroke=\"#2a2a32\" stroke-width=\"1.4\"/><path d=\"M36 14c3-6 11-5 11 2 0 5-4 7-9 6z\" fill=\"#9a9aa2\" stroke=\"#2a2a32\" stroke-width=\"1.6\"/><path d=\"M37 15h9\" stroke=\"#222\" stroke-width=\"3\"/><circle cx=\"40\" cy=\"15\" r=\"1.2\" fill=\"#fff\"/><circle cx=\"44\" cy=\"15\" r=\"1.2\" fill=\"#fff\"/></svg>"};
const POWER_ICON = {"extraVote": "<rect x=\"10\" y=\"22\" width=\"34\" height=\"44\" rx=\"4\" fill=\"#f4ecd8\" stroke=\"#3a2210\" stroke-width=\"3\"/><rect x=\"20\" y=\"12\" width=\"34\" height=\"44\" rx=\"4\" fill=\"#fff8e6\" stroke=\"#3a2210\" stroke-width=\"3\"/><path d=\"M27 28h20M27 36h20M27 44h12\" stroke=\"#3a2210\" stroke-width=\"3\"/><circle cx=\"50\" cy=\"62\" r=\"12\" fill=\"#2fbf71\" stroke=\"#3a2210\" stroke-width=\"3\"/><path d=\"M50 55v14M43 62h14\" stroke=\"#fff\" stroke-width=\"4\"/>", "voteSteal": "<rect x=\"14\" y=\"14\" width=\"34\" height=\"44\" rx=\"4\" fill=\"#fff8e6\" stroke=\"#3a2210\" stroke-width=\"3\"/><path d=\"M21 28h20M21 36h20\" stroke=\"#3a2210\" stroke-width=\"3\"/><path d=\"M30 58c6-8 18-10 26-4l4 10c-6 8-18 10-26 4z\" fill=\"#e8b48a\" stroke=\"#3a2210\" stroke-width=\"3\"/>", "voteBlock": "<rect x=\"14\" y=\"12\" width=\"34\" height=\"46\" rx=\"4\" fill=\"#fff8e6\" stroke=\"#3a2210\" stroke-width=\"3\"/><path d=\"M21 26h20M21 34h20\" stroke=\"#3a2210\" stroke-width=\"3\"/><circle cx=\"31\" cy=\"44\" r=\"20\" fill=\"none\" stroke=\"#e23b3b\" stroke-width=\"6\"/><path d=\"M17 58l28-28\" stroke=\"#e23b3b\" stroke-width=\"6\"/>", "kip": "<path d=\"M4 40q28-30 56 0q-28 30-56 0z\" fill=\"#fff8e6\" stroke=\"#3a2210\" stroke-width=\"3\"/><circle cx=\"32\" cy=\"40\" r=\"11\" fill=\"#5b7bd8\" stroke=\"#3a2210\" stroke-width=\"3\"/><circle cx=\"32\" cy=\"40\" r=\"4\" fill=\"#111\"/>", "soleVote": "<rect x=\"15\" y=\"12\" width=\"34\" height=\"46\" rx=\"4\" fill=\"#fff8e6\" stroke=\"#3a2210\" stroke-width=\"3\"/><path d=\"M32 22l4 9 10 1-8 7 3 10-9-5-9 5 3-10-8-7 10-1z\" fill=\"#f2c83a\" stroke=\"#3a2210\" stroke-width=\"2\"/>", "safetyNoPower": "<rect x=\"16\" y=\"8\" width=\"32\" height=\"56\" rx=\"3\" fill=\"#a8622e\" stroke=\"#3a2210\" stroke-width=\"3\"/><rect x=\"22\" y=\"14\" width=\"20\" height=\"44\" fill=\"#1a1a22\"/><circle cx=\"38\" cy=\"38\" r=\"2.5\" fill=\"#f2c83a\"/>", "teamSwap": "<path d=\"M12 28h34l-8-8M52 44H18l8 8\" fill=\"none\" stroke=\"#3a2210\" stroke-width=\"5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>", "legacy": "<path d=\"M32 8l20 10v18c0 14-10 22-20 26-10-4-20-12-20-26V18z\" fill=\"#c89a3a\" stroke=\"#3a2210\" stroke-width=\"3\"/><path d=\"M32 22v24M22 32h20\" stroke=\"#3a2210\" stroke-width=\"4\"/>"};
export function worldHtml(screen, L) {
  // the islands have no booth: a confessional there is shot on location
  const key = L.conf ? (L.conf.plate || plateKey(screen.venue, 'confessional', /-night$/.test(L.scene?.plate || '') ? 'night' : 'day') || L.scene?.plate) : L.scene?.plate;
  if (!key) return `<div class="tdx-plate tdx-noplate"></div>`;
  const M = TD_MARKS[key] || { h: .5, m: [] };
  const spot = key.split('/')[1].replace(/-(day|night)$/, '');
  const nightFrame = /-night$/.test(key);
  const indoor = ['limo-in', 'summit', 'mess-hall', 'cabin-inside', 'washroom', 'confessional', 'soundstage-corridor', 'prop-storage', 'economy', 'aisle', 'galley', 'cargo-hold', 'first-class', 'shelter', 'theater-tent', 'big-top', 'ceremony', 'trailer-inside', 'boathouse', 'aftermath-studio', 'craft-services', 'chris-quarters', 'cockpit', 'kitchen'].includes(spot)
    && !(spot === 'ceremony' && ['hosted-camp', 'survival-island', 'carnival', 'film-lot'].includes(screen.venue)) && !(spot === 'shelter' && screen.venue === 'survival-island');
  const r = seeded(key);
  const p = (x, n = 2) => `${(x * 100).toFixed(n)}%`;
  // the 4K render of the same frame, faded in when the camera closes on a conversation
  const hd = HD_VENUES.has(screen.venue) && !L.conf ? `<div class="tdx-plate hd" style="background-image:url('${SETS}/${key}-hd.webp')"></div>` : '';
  const of = k => M.m.filter(m => m.kind === k);
  // the day's weather (the islands keep their own rain)
  const island = /^islands\//.test(key);
  // no weather on board the jet: only on the ground outside it
  const aboard = screen.venue === 'world-tour' && !['destination-staging', 'map'].includes(spot);
  const wx = island || aboard || spot === 'confessional' ? null : wxOf(screen, L);
  const wet = wx === 'rain' || wx === 'storm';
  // a plate built from the show's own frame moves by its motion map (glplate.js): wind, water, heat.
  // It is drawn once, by day, and graded for the hour and the weather: a night scene at a day frame
  // is that frame by moonlight, its painted fires and lights still burning.
  const motion = of('motion')[0];
  const night = nightFrame || (!!motion && L.scene?.tod === 'night');
  const grade = !motion ? null : night ? (nightFrame ? (wet ? 'nightrain' : 'none') : indoor ? 'dim' : 'night') : indoor ? (wet ? 'dim' : 'day')
    : wx === 'storm' ? 'storm' : wx === 'rain' ? 'rain' : wx === 'overcast' ? 'overcast' : wx === 'fog' ? 'fog' : wx === 'hot' ? 'hot'
    : ['day', 'day', 'dusk'][partOfDay(L.scene?.wxTime || L.scene?.time)];   // (the user: no morning haze; day, sunset, night)
  // a place the show painted at this hour (sunrise, sunset, a hot afternoon) shows that painting, ungraded
  const painted = motion?.variants && !night ? String(motion.variants).split(',').find(v => v === grade) : null;
  const vkey = painted ? `${key}~${painted}` : key;
  const gl = motion ? `<canvas class="tdx-gl" data-src="${SETS}/${vkey}" data-mot="${SETS}/${key}"${motion?.flow ? ' data-flow="1"' : ''}${L.scene?.bobAmp ? ` data-bobamp="${L.scene.bobAmp}"` : ''} data-grade="${painted ? 'day' : grade}"${HD_VENUES.has(screen.venue) && !L.conf ? ' data-hd="1"' : ''}></canvas>` : '';
  // under a living plate, the sky is a layer of its own: clouds and birds pass behind every tree and roof
  // (the shader leaves the plate see-through only where the frame shows open sky)
  let h = `<div class="tdx-plate" style="background-image:url('${SETS}/${vkey}.webp')"></div>${hd.replace(`${key}-hd`, `${vkey}-hd`)}<!--sky-->${gl}<div class="tdx-live">`, sky = '';
  const skyward = x => { if (gl) sky += x; else h += x; };
  if (of('lightning').length) h += `<i class="tdx-lightning"></i>`;
  of('cloud').forEach((m, i) => {
    // a cloud lifted out of a traced frame (tools/td-camp/live.py) carries its own width
    const w = m.w != null ? m.w : m.s * m.size * 2.0 * 2.2 * 9 / 16;
    // a flowing cloud (the jet in flight) sails past and round again, from where the artist drew it
    const flow = m.flow ? ` flow" style="left:0;top:${p(m.v)};width:${p(w)};--d:${(26 + (i % 4) * 7)}s;--dl:-${(((m.u * 100 + 30) / 140) * (26 + (i % 4) * 7)).toFixed(1)}s` : `" style="left:${p(m.u)};top:${p(m.v)};width:${p(w)};--d:${60 + i * 17}s;--dx:${3 + i * 1.5}%`;
    skyward(`<div class="tdx-cloud${flow}"><img src="${SETS}/sprites/${m.sprite}.webp" alt=""></div>`);
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
    for (let q = 0; q < Math.round((6 + w * 30) * (night ? .35 : 1)); q++) h += `<i class="tdx-shimmer${night ? ' night' : ''}" style="left:${p(m.u0 + r() * w * .9)};top:${p(m.v0 + r() * hgt)};width:${p(.015 + r() * .04)};--d:${(3 + r() * 4).toFixed(1)}s;--dl:${(r() * 5).toFixed(1)}s;--ex:${(15 + r() * 40).toFixed(0)}px"></i>`;
    if (m.fish && !night) h += `<i class="tdx-fish" style="left:${p(m.u0 + w * (.2 + r() * .6))};top:${p(m.v0 + hgt * .5)};--d:${(7 + r() * 5).toFixed(1)}s;--dl:${(r() * 6).toFixed(1)}s"></i>`;
  });
  if (motion?.water) h += '</div>';
  // a band of low fog lying across part of the set
  of('mist').forEach((m, i) => { for (let q = 0; q < 3; q++) h += `<i class="tdx-mist band" style="top:${p(m.v0 + q * (m.v1 - m.v0) / 3)};--d:${50 + q * 17 + i * 9}s;--dl:-${q * 11}s"></i>`; });
  // butterflies over a sunny jungle clearing
  // wildlife passing through the place: it walks (or flies, or hops) across its band, then comes back
  of('critter').forEach((m, i) => { if (night && !['frog', 'raccoon'].includes(m.what)) return; const fly = ['parrot', 'seagull'].includes(m.what) && (i % 2 === 0);
    h += `<i class="tdx-critter ${esc(m.what)}${fly ? ' fly' : ''}" style="left:${p(m.u0)};top:${p(m.v0 + r() * (m.v1 - m.v0))};--w:${p(m.u1 - m.u0)};--d:${(16 + r() * 14).toFixed(1)}s;--dl:-${(r() * 20).toFixed(1)}s">${CRITTER[m.what] || ''}</i>`; });
  of('flutter').forEach((m) => { if (!night) for (let q = 0; q < (m.n || 3); q++) h += `<i class="tdx-butterfly" style="left:${p(m.u0 + r() * (m.u1 - m.u0))};top:${p(m.v0 + r() * (m.v1 - m.v0))};--c:${['#f2c83a', '#e84a8a', '#4ab8e8', '#f28a3a'][q % 4]};--d:${(6 + r() * 4).toFixed(1)}s;--dl:-${(r() * 6).toFixed(1)}s"></i>`; });
  const water = of('water')[0];
  if (water) { const top = M.h + .01, bot = Math.min(water.v, 1); for (let i = 0; i < 16; i++) h += `<i class="tdx-shimmer" style="left:${p(.05 + r() * .85)};top:${p(top + r() * Math.max(bot - top, .04))};width:${p(.02 + r() * .05)};--d:${(3 + r() * 4).toFixed(1)}s;--dl:${(r() * 5).toFixed(1)}s;--ex:${(20 + r() * 50).toFixed(0)}px"></i>`; }
  // the day's weather, painted over the set (a living plate is graded in its shader instead of greyed)
  if (wx && !indoor) {
    const aerial = spot === 'map';
    if ((wx === 'sunny' || wx === 'hot') && !night && !aerial && !gl) h += `<i class="tdx-rays${wx === 'hot' ? ' hot' : ''}"></i>`;
    if (wx === 'hot' && !night && !aerial && !gl) h += '<i class="tdx-haze"></i>';
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
  if (!indoor && night && !(spot === 'exit' && screen.venue === 'world-tour')) for (let i = 0; i < 12; i++) h += `<i class="tdx-fly" style="left:${p(.05 + r() * .9)};top:${p(M.h + .05 + r() * .4)};--d:${(5 + r() * 6).toFixed(1)}s;--dl:-${(r() * 6).toFixed(1)}s"></i>`;
  if (indoor && spot !== 'confessional') for (let i = 0; i < 14; i++) h += `<i class="tdx-mote" style="left:${p(.1 + r() * .8)};top:${p(.15 + r() * .6)};--d:${(10 + r() * 8).toFixed(1)}s"></i>`;
  if (spot === 'confessional') for (let i = 0; i < 6; i++) h += `<i class="tdx-gnat" style="left:${30 + i * 8}%;top:${20 + (i % 3) * 12}%;--dl:-${(i * .45).toFixed(2)}s;--gd:${(2 + (i % 3) * .7).toFixed(1)}s"></i>`;
  if (/^islands\/rescue-/.test(key)) {
    for (let i = 0; i < 70; i++) h += `<i class="tdx-rain" style="left:${p(r() * 1.1 - .05)};--d:${(.45 + r() * .35).toFixed(2)}s;--dl:-${(r() * 1).toFixed(2)}s;opacity:${(.25 + r() * .4).toFixed(2)}"></i>`;
    h += '<i class="tdx-flash"></i>';
  }
  h += `</div>${night && !indoor && !gl ? '<div class="tdx-wash"></div>' : ''}`;
  // the sky behind a living plate takes the hour and the weather: stars and a moon, storm cloud, dusk
  const moon = grade === 'night' ? '<i class="tdx-moon"></i>' : '';
  return h.replace('<!--sky-->', gl ? `<div class="tdx-sky g-${grade}">${moon}${sky}</div>` : '') + flagsHtml(L) + signsHtml(L);
}
// Each venue's climate: the weathers its days are drawn from, the commoner ones listed more than once.
// A northern lake camp gets sun, wind, cloud, rain, a storm and morning fog; a tropical island is hot,
// with sudden storms; a film lot in the sun; a carnival in the autumn woods, grey and foggy.
const CLIMATE = {
  // (the user, 2026-10-07: "some weather should be rarer like fog, the normal weather is more common")
  'hosted-camp': [...Array(7).fill('sunny'), ...Array(6).fill('calm'), 'breezy', 'breezy', 'overcast', 'overcast', 'rain', 'storm', 'fog'],
  'survival-island': [...Array(7).fill('sunny'), ...Array(5).fill('calm'), 'hot', 'hot', 'hot', 'breezy', 'breezy', 'rain', 'storm'],
  'film-lot': [...Array(8).fill('sunny'), ...Array(6).fill('calm'), 'hot', 'hot', 'breezy', 'overcast', 'overcast', 'fog'],
  'world-tour': [...Array(8).fill('sunny'), ...Array(6).fill('calm'), 'breezy', 'breezy', 'hot', 'overcast', 'rain', 'fog'],
  // Boney Island (Redemption / Rescue Island): a cursed rock in a grey lake; fog rolls in off the water,
  // storms break over the skull (the user, 2026-10-09: "fog moving, a lightning storm, some weather sometimes")
  redemption: [...Array(4).fill('calm'), 'overcast', 'overcast', 'overcast', 'breezy', 'breezy', 'fog', 'fog', 'fog', 'rain', 'rain', 'storm', 'storm'],
  carnival: [...Array(6).fill('calm'), ...Array(5).fill('sunny'), 'overcast', 'overcast', 'overcast', 'breezy', 'breezy', 'rain', 'storm', 'fog'],
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
const wxOf = (screen, L) => weatherAt(screen.venue, screen.ep, L?.scene?.wxTime || L?.scene?.time || (/-night$/.test(L?.scene?.plate || '') ? '9:00 PM' : ''));
export function weatherOf(venue, ep) {
  const c = CLIMATE[venue] || CLIMATE['hosted-camp'];
  let h = 2166136261; for (const ch of `${venue}|${ep}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return c[(h >>> 0) % c.length];
}
/** What the live layer is made of, for the ambience (sound.js). */
export function worldSound(screen, L) {
  const key = L.conf ? (L.conf.plate || plateKey(screen.venue, 'confessional', /-night$/.test(L.scene?.plate || '') ? 'night' : 'day') || L.scene?.plate) : L.scene?.plate;
  const M = (key && TD_MARKS[key]) || { m: [] };
  const spot = String(key || '').split('/')[1]?.replace(/-(day|night)$/, '') || '';
  const indoor = /limo-in|summit|mess-hall|cabin-inside|washroom|confessional|corridor|storage|economy|aisle|galley|cargo|first-class|theater|big-top|trailer-inside|boathouse|aftermath|craft-services|chris-quarters|cockpit|kitchen/.test(spot) || (spot === 'ceremony' && screen.venue === 'world-tour') || (spot === 'shelter' && screen.venue === 'carnival');
  const night = /-night$/.test(key || ''), island = /^islands\//.test(key || '');
  // the venue's own soundscape, and the day's weather in it (the same day, the same weather)
  const scape = island || spot === 'confessional' ? null
    : { venue: screen.venue, night, open: !indoor, shore: M.m.some(m => m.kind === 'water'), weather: wxOf(screen, L) };
  const wx = scape?.weather, wet = wx === 'rain' || wx === 'storm';
  const isleRain = /^islands\/rescue-/.test(key || '');
  return { rain: isleRain || (wet && !indoor), storm: isleRain || (wx === 'storm' && !indoor), fire: M.m.filter(m => m.kind === 'fire').length, water: M.m.some(m => m.kind === 'water') && !scape,
    outdoor: !indoor && !scape, night, indoor, flies: spot === 'confessional', crowd: (screen.venue === 'carnival' && /midway|entrance|big-top/.test(spot)) || spot === 'aftermath-studio', scape };
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
/** A scene's team flags (placeTeams): a pole, the team's colour waving, the name on a plate. */
export function signsHtml(L) {
  // a painted sign the viewer fills with a team's colour (Wawanakwa's challenge platform)
  return (L.scene?.signs || []).map(g => `<div class="tdx-sign" style="left:${(g.x0 * 100).toFixed(2)}%;top:${(g.y0 * 100).toFixed(2)}%;width:${((g.x1 - g.x0) * 100).toFixed(2)}%;height:${((g.y1 - g.y0) * 100).toFixed(2)}%;--fc:${esc(g.color)}">${g.name ? `<b>${esc(g.name)}</b>` : ''}</div>`).join('');
}
export function flagsHtml(L) {
  return (L.scene?.flags || []).map(f => `<div class="tdx-flag" style="left:${(f.u * 100).toFixed(2)}%;top:${(f.v * 100).toFixed(2)}%;height:${(f.h || 24).toFixed(1)}%;--fc:${esc(f.color || '#e8433f')}"><svg viewBox="0 0 60 100" preserveAspectRatio="xMidYMax meet"><rect x="8" y="4" width="5" height="96" rx="2" fill="#6b4a2a" stroke="#2a1a0a" stroke-width="1.5"/><circle cx="10.5" cy="5" r="4" fill="#f2c83a" stroke="#2a1a0a" stroke-width="1.5"/><path class="cloth" d="M13 10 Q30 4 44 11 T58 12 L58 40 Q44 34 30 40 T13 38 Z" fill="var(--fc)" stroke="#111" stroke-width="2"/></svg><b>${esc(f.name)}</b></div>`).join('');
}
export function castAt(screen, L) {
  const s = L.step || {};
  // the confessional: the camper sits low in the frame, the text bar in front of them
  if (L.conf) return [{ n: L.conf.by, u: .5, v: .9, h: 62, speak: true, conf: true }];
  const sc = L.scene; if (!sc) return [];
  // the voting booth is shot like a confessional: the voter alone, close, square to the camera
  if (sc.spot === 'voting-booth' && !sc.ceremony && (sc.focus || [])[0]) return [{ n: sc.focus[0], u: .5, v: .84, h: 46, speak: s.k === 'say', conf: true }];
  const speaker = (s.k === 'say' || s.k === 'conf') ? s.by : (s.k === 'safe' ? s.who : null);
  const focus = s.focus || null;
  const toks = [];
  // where someone has walked to in this scene (the Summit: up to the gift they take) they stay
  const moved = {};
  for (let i = L.idx; i >= 0; i--) { const x = screen.steps[i]; if (!x || x.k === 'scene') break; if (x.act?.kind === 'pick' && i < L.idx) for (const n of x.act.who || []) if (!(n in moved)) moved[n] = x.act.tu; }
  // who holds an idol or a power tonight glows (only the viewer can see it), until they play it
  let glow = {};
  for (let i = L.idx; i >= 0; i--) { const x = screen.steps[i]; if (x?.glow) { glow = { ...x.glow }; break; } }
  for (let i = 0; i < L.idx; i++) { const x = screen.steps[i]; if ((x.k === 'idol' || x.k === 'power') && x.by && glow[x.by] && (x.k === 'idol' || glow[x.by] !== 'idol')) delete glow[x.by]; }
  for (const [n, pl0] of Object.entries(sc.places || {})) {
    const pl = n in moved ? { ...pl0, u: moved[n] } : pl0;
    // the walk out: the one leaving and the host, and whoever came to say goodbye (sc.exitWith)
    if (sc.exit && n !== sc.exit && !pl.host && n !== sc.exitWith) continue;
    const bg = (sc.bg || []).find(b => b.n === n);
    const busy = !bg && sc.acts?.[n] && !(focus || []).includes(n) && n !== speaker ? sc.acts[n] : null;
    const sit = !!pl.sit;
    const h = pl.h || (pl.host ? Math.max(Math.min(pl.s * 125, 30), 16) : sit ? Math.max(Math.min(pl.s * 95, 24), 13) : Math.max(Math.min(pl.s * 125, sc.exit ? 30 : 34), bg ? 11 : 16));
    toks.push({ n, u: pl.u, v: pl.v, h, sit, host: !!pl.host, act: bg?.act || busy || null,
      speak: n === speaker || (pl.host && s.host), dim: !!(focus && focus.length && !focus.includes(n) && !pl.host && n !== speaker),
      bg: !!bg, safe: L.safe.includes(n), out: L.out === n, conf: !!pl.close, aboard: !!pl.aboard, glow: glow[n] || null, crowd: !!pl.crowd, feel: s.feel?.[n] || null });
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
  // the walk to the torch is shot wide: the sign, the torch and the walk all in frame
  if (['torch', 'park', 'depart', 'hop', 'jump'].includes(s.act?.kind) || L.scene?.wide) return wide;
  if (L.conf || !L.scene || s.k === 'scene' || s.k === 'title' || s.k === 'ballot' || s.k === 'intro' || s.k === 'found' || s.k === 'ballots') return wide;
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
  // the camera closes in, but a person never grows past the size the set can hold (the user, 2026-10-07:
  // "the avatar often don't fit well with the bg, sometimes too big")
  const tallest = Math.max(...group.map(n => toks.find(x => x.n === n).h));
  k = Math.max(1, Math.min(k, 44 / Math.max(tallest, 1)));
  // a ceremony is a crowd on its seats: the camera leans in, it never fills the frame with the front row
  // (the user, 2026-10-07: "the ceremony is too cluttered")
  if (ceremony) k = Math.min(k, 1.3);
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
  const cls = ['tdx-tok', t.speak && 'speak', t.dim && 'dim', t.bg && 'bg', t.sit && 'sit', t.host && 'host', t.conf && 'conf', t.aboard && 'aboard', t.glow && `glow-${t.glow}`, t.out && 'out', t.act && `act-${t.act}`, t.feel && `feel-${t.feel}`].filter(Boolean).join(' ');
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
  if (s.k === 'ballot') h += ballotHtml(s, fresh);
  if (s.k === 'intro') h += introHtml(s, fresh);
  if (s.k === 'title') h += `<div class="tdx-title${fresh ? ' fresh' : ''}${s.tone ? ' ' + esc(s.tone) : ''}${s.vs ? ' vs' : ''}"><div class="band"></div><div class="inner"><div class="kicker">${esc(s.kicker)}</div><div class="big">${esc(s.name)}</div></div><div class="faces">${(s.faces || []).map((n, i) => `${s.vs && i ? '<b class="vsx">VS</b>' : ''}<img src="${esc(avatar(n))}" alt="">`).join('')}</div></div>`;
  if (s.k === 'found') h += foundHtml(s, fresh);
  if (s.k === 'ballots') h += `<div class="tdx-title tdx-ballots${fresh ? ' fresh' : ''}"><div class="band"></div><div class="inner"><div class="kicker">The vote</div><div class="big">${esc(s.text)}</div></div><div class="faces">${(s.who || []).map((n, i) => `<span style="--i:${i}"><img src="${esc(avatar(n))}" alt=""><b>✓</b></span>`).join('')}</div></div>`;
  // a power played before the vote: its card, the player, and whoever it lands on
  if (s.k === 'power') h += `<div class="tdx-idol power${fresh ? ' fresh' : ''}"><div class="rays"></div><div class="totem"><svg viewBox="0 0 64 80">${POWER_ICON[s.type] || POWER_ICON.legacy}</svg></div><div class="lbl">${esc(s.name)}</div><div class="for"><img src="${esc(avatar(s.by))}" alt="">${s.on ? `<span>→</span><img src="${esc(avatar(s.on))}" alt="">` : ''}</div></div>`;
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
  if (s.k === 'read') return { name: host, cls: 'host', text: s.line || (s.dead ? `${s.vote}. Does not count.` : s.revote ? `${s.vote}.` : s.deciding ? `${s.vote}. That's enough.` : `${s.vote}.`), hostCut: host };
  if (s.k === 'out') return { name: '', cls: 'dir', text: `${s.who} is ${s.island ? 'voted out' : 'eliminated'}.` };
  if (s.k === 'found') return s.text ? { name: '', cls: 'dir', text: s.text, badge: s.item ? { text: s.label.toUpperCase(), cls: 'gold' } : null } : { name: '', cls: 'dir hidden', text: '' };
  if (s.k === 'power') return { name: '', cls: 'dir', text: `${s.by} stands up and plays ${s.the || s.name}${s.on ? ` on ${s.on}` : ''}.` };
  if (s.k === 'idol') return { name: '', cls: 'dir', text: `${s.by} stands up and plays a Hidden Immunity Idol${s.for !== s.by ? ` for ${s.for}` : ''}.` };
  if (s.k === 'ballots' || s.k === 'title' || s.k === 'ballot' || s.k === 'intro') return { name: '', cls: 'dir hidden', text: '' };
  return { name: '', cls: 'dir hidden', text: '' };
}

// ── the Intel drawer ──────────────────────────────────────────────────
const TABS = {
  camp: [['mind', 'In their heads'], ['bonds', 'Just now'], ['log', 'Camp log'], ['people', 'Relationships'], ['allies', 'Alliances'], ['powers', 'Powers'], ['secrets', 'Secrets']],
  tribal: [['room', 'The room'], ['plans', 'Plans'], ['tally', 'Tally'], ['why', 'Why'], ['people', 'Relationships'], ['allies', 'Alliances'], ['powers', 'Powers']],
  island: [['residents', 'Who is here'], ['log', 'Island log'], ['secrets', 'Secrets'], ['people', 'Relationships'], ['powers', 'Powers']],
  jury: [['residents', 'The motel'], ['lean', 'Leanings'], ['log', 'Motel log'], ['people', 'Relationships']],
  aftermath: [['log', 'Show notes'], ['secrets', 'Receipts'], ['people', 'Relationships'], ['allies', 'Alliances'], ['powers', 'Powers']],
};
// the season as it stood after this episode (its snapshot): who is still playing, by team, every bond,
// the romances, the alliances, the powers. The tabs a viewer keeps open to read the game.
const BOND_WORD = v => v >= 6 ? 'Close' : v >= 3 ? 'Friends' : v > -2 ? 'Neutral' : v > -5 ? 'Tension' : 'Enemies';
const POWER_NAME = { idol: 'Idol', superIdol: 'Super Idol', extraVote: 'Extra Vote', voteSteal: 'Steal a Vote', voteBlock: 'Block a Vote', kip: 'Knowledge is Power',
  soleVote: 'Sole Vote', safetyNoPower: 'Safety Without Power', teamSwap: 'Team Swap', legacy: 'Legacy Advantage', amulet: 'Amulet', idolNullifier: 'Idol Nullifier' };
function seasonAt(screen) {
  const E = (globalThis.gs?.episodeHistory || []).find(e => e.num === +screen.ep);
  const S = E?.gsSnapshot; if (!S) return null;
  const players = [...new Set([...(S.activePlayers || []), ...(E.eliminated && E.eliminated !== 'No elimination' ? [E.eliminated] : [])])];
  // a screen that names its own people (the Jury House: the motel, and who is still playing)
  if (screen.people) { const all = screen.people.flatMap(t => t.members); players.splice(0, players.length, ...all); }
  const tribes = screen.people ? screen.people : (E.tribesAtStart?.length ? E.tribesAtStart : S.tribes || []).map(t => ({ name: t.name, members: (t.members || []).filter(n => players.includes(n)) })).filter(t => t.members.length);
  const teams = tribes.length ? tribes : [{ name: S.mergeName || 'Everyone', members: players }];
  const bond = (a, b) => S.bonds?.[a <= b ? `${a}||${b}` : `${b}||${a}`] ?? 0;
  const love = (a, b) => {
    const sh = (S.showmances || []).find(x => x.players?.includes(a) && x.players?.includes(b));
    if (sh) return sh.breakupEp ? 'Broke up' : 'Showmance';
    const sp = (S.romanticSparks || []).find(x => x.players?.includes(a) && x.players?.includes(b));
    return sp ? 'Spark' : null;
  };
  return { players, teams, bond, love, alliances: S.namedAlliances || [], gone: S.dissolvedAlliances || [], powers: (S.advantages || []).filter(a => players.includes(a.holder)), num: E.num };
}
export function intelHtml(screen, L, tab, fresh, who = null) {
  const tabs = TABS[screen.kind] || TABS.camp;
  if (!tabs.some(t => t[0] === tab)) tab = tabs[0][0];
  const items = L.side;
  let h = `<div class="tdx-ihead"><button type="button" class="tdx-iclose" data-close aria-label="Close Intel" title="Close">&times;</button><b>Intel</b><span>${screen.kind === 'tribal' ? 'Only the viewer sees the votes.' : screen.kind === 'island' || screen.kind === 'jury' ? 'Out of sight of the game.' : 'What the camp doesn’t know yet.'}</span></div><div class="tdx-itabs">`;
  for (const [k, l] of tabs) h += `<button type="button" class="${k === tab ? 'on' : ''}" data-tab="${k}">${esc(l)}${items.some(x => x.tab === k && x.at === L.idx) && k !== tab ? '<i></i>' : ''}</button>`;
  h += '</div><div class="tdx-ilist">';
  // a night with two votes: the tally, the reasons and the plans are the vote being read now
  const round = Math.max(0, ...items.filter(x => x.tab === tab && x.round).map(x => x.round));
  const mine = items.filter(x => x.tab === tab && (!round || (x.round || 0) === round)), fr = x => (fresh && x.at === L.idx ? ' fresh' : '');
  if (tab === 'allies') mine.forEach(x => { h += `<div class="tdx-ic${fr(x)}"><b>${esc(x.name)}</b><div class="minis">${(x.who || []).map(n => `<img src="${esc(avatar(n))}" alt="" title="${esc(n)}">`).join('')}</div></div>`; });
  else if (tab === 'tally') {
    const by = {}; mine.forEach(x => (by[x.target] ||= []).push(x));
    Object.entries(by).sort((a, b) => b[1].filter(v => !v.void).length - a[1].filter(v => !v.void).length).forEach(([t, vs]) => {
      h += `<div class="tdx-ic tally${vs.some(v => v.at === L.idx) && fresh ? ' fresh' : ''}"><img src="${esc(avatar(t))}" alt=""><div><b>${esc(t)}</b><div class="minis">${vs.map(v => `<img src="${esc(avatar(v.voter))}" alt="" title="${esc(v.voter)}${v.void ? ' (void)' : ''}"${v.void ? ' style="opacity:.35"' : ''}>`).join('')}</div></div><span>${vs.filter(v => !v.void).length}</span></div>`;
    });
  } else if (tab === 'bonds') {
    // the latest change for each pair, newest first: what the conversation just did
    const seen = new Set();
    [...mine].reverse().forEach(x => {
      const k = [x.a, x.b].sort().join('|'); if (seen.has(k)) return; seen.add(k);
      const up = x.d > 0;
      h += `<div class="tdx-ic bond${fr(x)}"><span class="minis"><img src="${esc(avatar(x.a))}" alt="" title="${esc(x.a)}"><img src="${esc(avatar(x.b))}" alt="" title="${esc(x.b)}"></span><b>${esc(x.a)} &amp; ${esc(x.b)}</b> <span class="k" style="color:${up ? '#4fb84a' : '#f85149'}">${up ? '▲' : '▼'} ${up ? '+' : ''}${x.d}</span><br><small>${esc(x.word)} (${x.now > 0 ? '+' : ''}${x.now})</small></div>`;
    });
  } else if (tab === 'why') mine.forEach(x => {
    h += `<div class="tdx-ic why${fr(x)}${x.betray ? ' betray' : ''}"><div class="vrow"><img src="${esc(avatar(x.voter))}" alt=""><b>${esc(x.voter)}</b> <span class="k">→</span> <img src="${esc(avatar(x.target))}" alt=""><b>${esc(x.target)}</b></div>`
      + (x.bloc ? `<div class="chips"><span class="chip ally">${esc(x.bloc)}</span>${(x.with || []).length ? `<span class="chip">with ${esc(x.with.join(', '))}</span>` : `<span class="chip">alone in it</span>`}</div>` : '<div class="chips"><span class="chip">no alliance vote</span></div>')
      + (x.betray ? `<div class="bet">BETRAYAL · ${esc(x.betray)}</div>` : '')
      + ((x.tags || []).length ? `<div class="chips">${x.tags.map(t => `<span class="chip tag">${esc(t)}</span>`).join('')}</div>` : '')
      + `<small>${esc(x.text)}</small></div>`; });
  else if (tab === 'lean') mine.forEach(x => { h += `<div class="tdx-ic why${fr(x)}"><div class="vrow"><img src="${esc(avatar(x.juror))}" alt=""><b>${esc(x.juror)}</b> <span class="k">${esc(x.word)}</span> <img src="${esc(avatar(x.target))}" alt=""><b>${esc(x.target)}</b></div><small>${esc(x.text)}</small></div>`; });
  else if (tab === 'plans') mine.forEach(x => { h += `<div class="tdx-ic${fr(x)}"><b>${esc(x.name)}</b> <span class="k">plans to vote</span> <b>${esc(x.target || '?')}</b><div class="minis">${(x.who || []).map(n => `<img src="${esc(avatar(n))}" alt="" title="${esc(n)}">`).join('')}</div></div>`; });
  else mine.forEach(x => { h += `<div class="tdx-ic${fr(x)}">${esc(x.text)}</div>`; });
  const W = ['people', 'allies', 'powers'].includes(tab) ? seasonAt(screen) : null;
  const face = n => `<img src="${esc(avatar(n))}" alt="" title="${esc(n)}">`;
  if (tab === 'people' && W) {
    const sel = W.players.includes(who) ? who : ((L.step?.focus || []).find(n => W.players.includes(n)) || W.players[0]);
    h += `<div class="tdx-rpick">${W.teams.map(t => `<div class="team"><small>${esc(t.name)}</small><div>${t.members.map(n => `<button type="button" data-rel="${esc(n)}" class="${n === sel ? 'on' : ''}" title="${esc(n)}">${face(n)}</button>`).join('')}</div></div>`).join('')}</div>`;
    h += `<div class="tdx-rhead">${face(sel)}<b>${esc(sel)}</b></div>`;
    W.players.filter(n => n !== sel).map(n => [n, W.bond(sel, n), W.love(sel, n)]).sort((a, b) => (b[2] ? 1 : 0) - (a[2] ? 1 : 0) || b[1] - a[1]).forEach(([n, v, l]) => {
      const pct = Math.round(Math.abs(v) * 5), col = v >= 0 ? '#3fb950' : '#f85149';
      h += `<div class="tdx-rrow">${face(n)}<span class="nm">${esc(n)}</span>${l ? `<span class="chip love${l === 'Broke up' ? ' off' : ''}">${esc(l)}</span>` : ''}<span class="bar"><i style="${v >= 0 ? 'left:50%' : `right:50%`};width:${pct}%;background:${col}"></i></span><span class="k">${esc(BOND_WORD(v))} ${v > 0 ? '+' : ''}${(+v).toFixed(1)}</span></div>`;
    });
    return h + '</div>';
  }
  if (tab === 'allies' && W) {
    // no named alliance yet: tonight's voting blocs are the alliances that exist
    if (!W.alliances.length) for (const a of (globalThis.gs?.episodeHistory || []).find(e => e.num === W.num)?.alliances || []) if (a.type !== 'solo' && (a.members || []).length >= 2)
      h += `<div class="tdx-ic"><b>${esc(a.label || 'A voting bloc')}</b> <span class="chip">voting bloc</span><div class="minis">${a.members.map(face).join('')}</div>${a.target ? `<small>Aiming at ${esc(a.target)}</small>` : ''}</div>`;
    for (const a of W.alliances) h += `<div class="tdx-ic"><b>${esc(a.name)}</b>${(a.betrayals || []).length ? ` <span class="chip bad">${a.betrayals.length} betrayal${a.betrayals.length > 1 ? 's' : ''}</span>` : ''}<div class="minis">${(a.members || []).filter(n => W.players.includes(n)).map(face).join('')}</div><small>Since episode ${esc(a.formed ?? '?')}</small></div>`;
    for (const a of W.gone.filter(x => (x.members || []).some(n => W.players.includes(n)))) h += `<div class="tdx-ic dim"><b>${esc(a.name)}</b> <span class="chip">broken up</span><div class="minis">${(a.members || []).map(face).join('')}</div></div>`;
  }
  if (tab === 'powers' && W) {
    for (const t of W.teams) {
      const ps = W.powers.filter(a => t.members.includes(a.holder));
      h += `<div class="tdx-ic"><b style="display:block">${esc(t.name)}</b>${ps.length ? ps.map(a => `<div class="prow">${face(a.holder)}<span>${esc(a.holder)}</span><span class="chip pw">${esc(POWER_NAME[a.type] || a.type)}</span>${a.foundEp === W.num ? '<span class="chip">new</span>' : ''}</div>`).join('') : '<small>Nothing known.</small>'}</div>`;
    }
    return h + '</div>';
  }
  if (!mine.length && !(tab === 'allies' && W && (W.alliances.length || W.gone.length || h.includes('voting bloc')))) h += `<div class="tdx-iempty">${screen.kind === 'tribal' && tab === 'tally' ? 'As the votes are read.' : screen.kind === 'tribal' && tab === 'why' ? 'Once the votes are in.' : 'Nothing yet.'}</div>`;
  return h + '</div>';
}

/** The whole step as one string (tests, and the first paint). */
export function stageHtml(screen, idx, fresh = false, o = {}) {
  const L = ledgerAt(screen, idx);
  const toks = castAt(screen, L);
  const d = dialogue(screen, L);
  return { L, html: `<div class="tdx-world">${worldHtml(screen, L)}<div class="tdx-cast">${toks.map(t => tokHtml(t, fresh)).join('')}</div><div class="tdx-fx"></div></div><div class="tdx-hud">${hudHtml(screen, L, fresh, o)}</div>`, toks, d };
}

// ══════════════════════════════════════════════════════════════════════
// THE BALLOT — a vote written by hand, in each venue's own way
// ══════════════════════════════════════════════════════════════════════
// The user (2026-10-07): "a writing name animation for all the venues, it needs to be wow". The voter's
// pick is written on the venue's own ballot, stroke by stroke under a moving pen, then dropped into
// the venue's urn (or stamped, on the jet: World Tour votes with passport stamps).
const BALLOT = {
  'hosted-camp': { cls: 'camp', head: 'Camp Wawanakwa · Vote', urn: 'tin' },
  'film-lot': { cls: 'slate', head: 'Gilded Chris Awards · Take 1', urn: 'can' },
  'world-tour': { cls: 'passport', head: 'Total Drama Jumbo Jet · Passport', urn: 'stamp' },
  'survival-island': { cls: 'bamboo', head: 'Soluna · Elimination Trial', urn: 'tiki' },
  carnival: { cls: 'ticket', head: 'Stawaki Carnival · Admit One', urn: 'clown' },
};
const URN = {
  tin: '<svg viewBox="0 0 120 110"><path d="M10 16v80c0 7 22 12 50 12s50-5 50-12V16" fill="#8a7458" stroke="#3b2f22" stroke-width="4"/><ellipse cx="60" cy="16" rx="50" ry="12" fill="#2a2018" stroke="#3b2f22" stroke-width="4"/><path d="M22 40h76M22 70h76" stroke="#6b5a44" stroke-width="5"/><circle cx="34" cy="56" r="4" fill="#a3542e"/><circle cx="84" cy="84" r="5" fill="#a3542e"/></svg>',
  can: '<svg viewBox="0 0 120 110"><path d="M6 28v44c0 9 24 16 54 16s54-7 54-16V28" fill="#3a3a46" stroke="#111" stroke-width="4"/><ellipse cx="60" cy="28" rx="54" ry="16" fill="#0c0c10" stroke="#111" stroke-width="4"/><circle cx="60" cy="60" r="10" fill="#d4af37"/></svg>',
  tiki: '<svg viewBox="0 0 120 120"><path d="M30 14h60l-6 96H36z" fill="#9a5a2a" stroke="#3b2210" stroke-width="4"/><rect x="24" y="6" width="72" height="14" rx="4" fill="#6b3a18" stroke="#3b2210" stroke-width="4"/><ellipse cx="46" cy="50" rx="10" ry="12" fill="#f2d16b" stroke="#3b2210" stroke-width="3"/><ellipse cx="74" cy="50" rx="10" ry="12" fill="#f2d16b" stroke="#3b2210" stroke-width="3"/><circle cx="46" cy="52" r="4" fill="#111"/><circle cx="74" cy="52" r="4" fill="#111"/><path d="M42 80q18 14 36 0v10q-18 12-36 0z" fill="#3b2210"/><path d="M36 30h48" stroke="#e8823a" stroke-width="4"/></svg>',
  clown: '<svg viewBox="0 0 120 120"><path d="M28 30h64l-4 82H32z" fill="#f4efe6" stroke="#2a2a3a" stroke-width="4"/><rect x="22" y="20" width="76" height="14" rx="6" fill="#d33a3a" stroke="#2a2a3a" stroke-width="4"/><path d="M40 56l10-8 10 8M60 56l10-8 10 8" stroke="#2a5bd3" stroke-width="5" fill="none"/><circle cx="60" cy="72" r="9" fill="#e23b3b" stroke="#2a2a3a" stroke-width="3"/><path d="M42 92q18 12 36 0" stroke="#e23b3b" stroke-width="6" fill="none"/><circle cx="34" cy="16" r="9" fill="#2a5bd3"/><circle cx="86" cy="16" r="9" fill="#f2c83a"/></svg>',
};
// handwriting faces (Google Fonts, loaded in style.js TDX_FONTS) and how big each writes
const HANDS = [
  { f: "Caveat,cursive", w: 700, k: 1 }, { f: "'Indie Flower',cursive", k: .9 }, { f: "'Shadows Into Light',cursive", k: .95 },
  { f: "'Gochi Hand',cursive", k: .9 }, { f: "'Rock Salt',cursive", k: .62 }, { f: "'Reenie Beanie',cursive", k: 1.15 },
  { f: "'Nothing You Could Do',cursive", k: .7 }, { f: "'Homemade Apple',cursive", k: .6 }, { f: "Kalam,cursive", w: 700, k: .85 },
  { f: "'Gloria Hallelujah',cursive", k: .75 }, { f: "'Covered By Your Grace',cursive", k: 1.05 }, { f: "'Just Another Hand',cursive", k: 1.2 },
];
const hashStr = t => { let h = 2166136261; for (const c of String(t)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
export function ballotHtml(s, fresh) {
  const B = BALLOT[s.venue] || BALLOT['hosted-camp'];
  const name = String(s.voted || '');
  // World Tour: nobody writes. The voter stamps the passport of the one they want gone.
  if (B.urn === 'stamp') return `<div class="tdx-ballot passport${fresh ? ' fresh' : ''}"><div class="glow"></div>
    <div class="card"><div class="hd">${esc(B.head)}</div>
      <div class="pp"><img src="${esc(avatar(name))}" alt=""><div class="pf"><span>Surname / Given name</span><b>${esc(name)}</b><span>Nationality</span><b>Total Drama</b></div></div>
      <div class="by"><img src="${esc(avatar(s.voter))}" alt=""><span>${esc(s.voter)} votes</span></div>
      <div class="stampx">VOTED<small>OFF</small></div></div></div>`;
  // everyone has their own hand: a font, a slant and a pen weight that are theirs all season (seeded on
  // the voter), and every letter a little off its neighbour's line, the way nobody writes in a straight row
  const H = HANDS[hashStr(s.voter) % HANDS.length], r = seeded(`${s.voter}|${name}`);
  const fs = Math.round(Math.min(120, 980 / Math.max(name.length, 4)) * H.k);
  const half = Math.round(fs * name.length * .27);
  const slant = (hashStr(s.voter + 'slant') % 9) - 5, weight = (1.6 + (hashStr(s.voter + 'w') % 5) * .5).toFixed(1);
  const letters = [...name].map((ch, i) => `<tspan dy="${i ? ((r() - .5) * fs * .09).toFixed(1) : 0}" rotate="${((r() - .5) * 9).toFixed(1)}">${esc(ch)}</tspan>`).join('');
  return `<div class="tdx-ballot ${B.cls}${fresh ? ' fresh' : ''}">
    <div class="glow"></div>
    <div class="card"><div class="hd">${esc(B.head)}</div>
      <svg class="ink" viewBox="0 0 1000 220"><text x="500" y="${Math.round(150 + (120 - fs) / 3)}" text-anchor="middle" font-size="${fs}" style="font-family:${H.f};font-weight:${H.w || 400};stroke-width:${weight}" transform="rotate(${slant} 500 120) skewX(${-slant})">${letters}</text><path class="ul" d="M${500 - half} 185 q ${half} 16 ${half * 2} -6"/></svg>
      <div class="by"><img src="${esc(avatar(s.voter))}" alt=""><span>${esc(s.voter)} votes</span></div></div>
  </div>`;
}

// ══════════════════════════════════════════════════════════════════════
// THE INTRO CARD — a newcomer's character-select card on arrival day (arrival.js)
// ══════════════════════════════════════════════════════════════════════
// a returnee's last season in a line (td/past.js): 'Winner · Season 1', '4th · Season 1 · blindsided by Minnie Skurr'
const pastLine = p => p.kind === 'won' ? `Winner · ${p.where}`
  : `${p.placeWord} · ${p.where}${p.kind === 'final' ? ' · finalist' : p.kind === 'early' ? ' · out early' : p.kind === 'blindsided' && p.by ? ` · blindsided by ${p.by}` : ''}`;
export function introHtml(s, fresh) {
  const facts = [s.age ? `${s.age}` : '', s.job || '', s.home || ''].filter(Boolean);
  const bars = (s.stats || []).map((x, i) => `<div class="st" style="--i:${i}"><span>${esc(x.k)}</span><i><b style="width:${Math.max(8, Math.min(100, x.v * 10))}%"></b></i></div>`).join('');
  return `<div class="tdx-intro${fresh ? ' fresh' : ''}">
    <div class="sweep"></div><div class="streaks"></div>
    <div class="port"><img src="${esc(avatar(s.who))}" alt=""></div>
    <div class="info">
      <div class="num">Contestant ${s.n} / ${s.of}${s.returnee ? ' · Returning' : ''}</div>
      <div class="nm">${esc(s.who)}</div>
      ${s.tag ? `<div class="tag">${esc(s.tag)}</div>` : ''}
      ${s.past ? `<div class="past${s.past.kind === 'won' ? ' won' : ''}">${esc(pastLine(s.past))}</div>` : ''}
      ${facts.length ? `<div class="facts">${facts.map(f => `<span>${esc(f)}</span>`).join('')}</div>` : ''}
      <div class="stats">${bars}</div>
    </div></div>`;
}
