// ══════════════════════════════════════════════════════════════════════
// vp-rr-ep/app.js — rr.html: play a Ridonculous Race season, one line per click
// ══════════════════════════════════════════════════════════════════════
//
// Pick a seed and a cast size, and the season is played here in the browser exactly as
// `npm run rr:read` plays it (the same cast draw, the same engine, the same director).
// Then click through an episode: the picture, the box, the side panel. URL parameters
// (?seed=8&teams=12&ep=3&step=40) land on a step, so a link is a moment of the show.
import { setPlayers } from '../core.js';
import { playRaceSeason } from '../rr/season.js';
import { airSeason } from '../rr/episode.js';
import { avatarUrl } from '../avatar-registry.js';
import { castFromRoster, rosterPlayers } from './cast.js';
import { episodeScreens, flatSteps } from './steps.js';
import { createStage } from './stage.js';
import { createSidebar } from './sidebar.js';
import { RR_CSS } from './style.js';

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const style = document.createElement('style'); style.textContent = RR_CSS; document.head.appendChild(style);

let roster = null, season = null, ep = null, flat = [], at = 0, auto = null;
const cache = new Map();
let faces = {};
const faceOf = name => faces[name] || 'assets/avatars/' + String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.png';

const stage = createStage($('rr-stage-holder'), { faceOf });
const side = createSidebar($('rr-side'), { faceOf });

async function loadRoster() {
  if (roster) return roster;
  const r = await fetch('franchise_roster.json');
  roster = rosterPlayers(await r.json());
  return roster;
}

function play(seed, nTeams) {
  const key = `${seed}|${nTeams}`;
  if (cache.has(key)) return cache.get(key);
  const { cast, teams } = castFromRoster(roster, nTeams, seed);
  setPlayers(cast);
  const res = playRaceSeason({ teams, seed });
  const eps = airSeason(res);
  const out = { seed, nTeams, res, eps, cast, built: [] };
  cache.set(key, out);
  return out;
}

function episode(i) {
  if (!season.built[i]) season.built[i] = { ...episodeScreens(season.res, season.eps, i), res: season.res };
  return season.built[i];
}

function status(t) { $('rr-status').textContent = t; }

function show(i, step = 0, fresh = true) {
  ep = episode(i);
  flat = flatSteps(ep.screens);
  at = Math.max(0, Math.min(flat.length - 1, step));
  $('rr-ep').value = String(i);
  draw(fresh);
}

function draw(fresh) {
  const { si, idx } = flat[at];
  stage.paint(ep, si, idx, fresh);
  const s = ep.screens[si];
  side.paint(ep, si, idx, { speaking: s.steps[idx]?.team || null });
  $('rr-stepn').textContent = `Episode ${ep.n} · click ${at + 1} of ${flat.length}`;
  const u = new URL(location.href);
  u.searchParams.set('seed', season.seed); u.searchParams.set('teams', season.nTeams);
  u.searchParams.set('ep', ep.n); u.searchParams.set('step', at);
  history.replaceState(null, '', u);
}

function next() {
  if (at < flat.length - 1) { at++; draw(true); return; }
  const i = ep.n; // the next episode (0-based index = n)
  if (i < season.eps.length) show(i, 0, true);
}
function back() {
  if (at > 0) { at--; draw(false); return; }
  if (ep.n > 1) { const i = ep.n - 2; const e = episode(i); show(i, flatSteps(e.screens).length - 1, false); }
}
function backScene() {
  const { si, idx } = flat[at];
  const target = idx > 0 ? si : Math.max(0, si - 1);
  at = flat.findIndex(f => f.si === target);
  draw(true);
}
function toggleAuto() {
  if (auto) { clearTimeout(auto); auto = null; $('rr-auto').textContent = '▶ Auto'; return; }
  $('rr-auto').textContent = '❚❚ Pause';
  const tick = () => {
    const { si, idx } = flat[at];
    const len = (ep.screens[si].steps[idx]?.text || '').length;
    next();
    auto = setTimeout(tick, 1800 + len * 28);
  };
  auto = setTimeout(tick, 600);
}

async function start() {
  const seed = Math.max(1, parseInt($('rr-seed').value, 10) || 8);
  const n = parseInt($('rr-teams').value, 10) || 12;
  status('playing the season…');
  $('rr-loading').style.display = 'flex';
  await new Promise(r => setTimeout(r, 30));
  try {
    await loadRoster();
    season = play(seed, n);
    faces = Object.fromEntries(season.cast.map(p => [p.name, avatarUrl({ slug: p.slug || p.name })]));
    const sel = $('rr-ep');
    sel.innerHTML = season.res.legs.map((l, i) => `<option value="${i}">Leg ${l.n} · ${l.placeName}${l.kind === 'final' ? ' (final)' : l.kind === 'non' ? ' (non-elim)' : ''}</option>`).join('');
    const winner = season.res.winner ? season.res.state.teams[season.res.winner].name : '?';
    status(`seed ${seed} · ${n} teams · ${season.res.legs.length} legs`);
    $('rr-loading').style.display = 'none';
    void winner;
    const want = Math.max(1, Math.min(season.res.legs.length, parseInt(params.get('ep'), 10) || 1)) - 1;
    const step = parseInt(params.get('step'), 10) || 0;
    params.delete('ep'); params.delete('step');
    show(want, step, true);
  } catch (e) {
    console.error(e);
    status('could not play that season: ' + e.message);
    $('rr-loading').textContent = 'Something went wrong: ' + e.message;
  }
}

$('rr-seed').value = params.get('seed') || '8';
$('rr-teams').value = params.get('teams') || '12';
$('rr-play').onclick = start;
$('rr-ep').onchange = e => show(parseInt(e.target.value, 10), 0, true);
$('rr-next').onclick = next;
$('rr-back').onclick = back;
$('rr-scene').onclick = backScene;
$('rr-auto').onclick = toggleAuto;
$('rr-full').onclick = () => { const h = $('rr-stage-holder'); if (document.fullscreenElement) document.exitFullscreen(); else h.requestFullscreen?.(); };
stage.el.addEventListener('click', () => { if (season) next(); });

// Intel: a bar at the stage's edge, closed unless this viewer left it open
const INTEL_KEY = 'rr-vp-intel-open';
function setIntel(open, remember = true) {
  $('rr-wrap').classList.toggle('intel-closed', !open);
  $('rr-tab').textContent = open ? 'INTEL ▸' : 'INTEL ◂';
  $('rr-tab').setAttribute('aria-expanded', String(open));
  if (remember) { try { localStorage.setItem(INTEL_KEY, open ? '1' : '0'); } catch { /* private window: not remembered */ } }
}
let intelOpen = false;
try { intelOpen = localStorage.getItem(INTEL_KEY) === '1'; } catch { intelOpen = false; }
if (params.get('intel')) intelOpen = params.get('intel') === '1';
setIntel(intelOpen, false);
$('rr-tab').onclick = () => setIntel($('rr-wrap').classList.contains('intel-closed'));
addEventListener('keydown', e => {
  if (!season || ['INPUT', 'SELECT'].includes(document.activeElement?.tagName)) return;
  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); next(); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
  else if (e.key === 'PageUp') { e.preventDefault(); backScene(); }
  else if (e.key === 'f') $('rr-full').click();
  else if (e.key === 'a') toggleAuto();
  else if (e.key === 'i' || e.key === 'I') $('rr-tab').click();
});

// for the screenshot harness: jump to a step, find a screen kind
window.__rr = {
  get ep() { return ep; }, get flat() { return flat; }, get at() { return at; },
  goto(i, step) { show(i, step, true); },
  find(pred) { const k = flat.findIndex(f => pred(ep.screens[f.si], ep.screens[f.si].steps[f.idx])); return k; },
  step(k, fresh = true) { at = k; draw(fresh); },
};
start();
