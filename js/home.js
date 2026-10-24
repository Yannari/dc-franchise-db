// The Blindside Network front page.
//
// Everything on it is read from the data, never typed into the page. The old
// home kept a hand-written list of 68 Total Drama names for its cast wall and
// carousel, so a player added in any season -- and every other show -- never
// appeared on the front of the site. Now:
//   - the cast wall and the carousel are players_database.json, every show
//   - "on air" is the same model the On Air page draws (js/on-air.js)
//   - the shows, their counts and latest winners are seasons_database.json
//   - the headline numbers are counted from those two files, here, once
import { SHOWS, DEFAULT_FORMAT } from './shows.js';
import { airKey, airLabel } from './franchise-calendar.js';
import { seasonWinners } from './records.js';
import { loadPortraitCatalog, avatarUrl } from './avatar-registry.js';
import { onAirModel, loadAiring, airingModels, exitSentence } from './on-air.js';
import { snapshot, mountDigest } from './digest.js';
import { mountToday } from './today.js';

const API = (() => {
  try { return (localStorage.getItem('studio_api_base') || 'https://dc-studio.yannari19.workers.dev').replace(/\/+$/, ''); }
  catch { return 'https://dc-studio.yannari19.workers.dev'; }
})();

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function shuffle(arr, rand = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const initials = name => String(name).split(/[\s-]+/).filter(Boolean)
  .map(w => w[0]).join('').slice(0, 2).toUpperCase();

/** Seasons that have finished, oldest first by air date (undated last). */
function finished(seasons) {
  return seasons.filter(s => s && /complete/i.test(s.status || 'Complete'))
    .sort((a, b) => (airKey(a) ?? Infinity) - (airKey(b) ?? Infinity));
}

/**
 * The front page's facts, counted once from the two databases.
 * `shows` lists every show in the registry: `seasons` > 0 means it has aired.
 */
export function homeModel(players = [], seasons = []) {
  const done = finished(seasons);
  const shows = Object.entries(SHOWS).map(([format, show]) => {
    const own = done.filter(s => (s.format || DEFAULT_FORMAT) === format);
    const latest = own[own.length - 1] || null;
    return {
      format, name: show.name, accent: show.accent, seasons: own.length,
      latest, winner: latest ? seasonWinners(latest)[0] || null : null,
    };
  });
  return {
    counts: {
      seasons: done.length,
      players: players.length,
      episodes: done.reduce((n, s) => n + (Number(s.episodeCount) || 0), 0),
      shows: shows.filter(s => s.seasons).length,
    },
    aired: shows.filter(s => s.seasons),
    upcoming: shows.filter(s => !s.seasons),
    recent: done.slice(-4).reverse(),
  };
}

// ── the cast wall ──

function buildWall(el, people) {
  if (!el || !people.length) return;
  const rows = 6, perRow = 18;
  el.innerHTML = '';
  let k = 0;
  for (let r = 0; r < rows; r++) {
    const row = document.createElement('div');
    row.className = 'heroRow';
    row.dataset.dir = r % 2 ? 'r' : 'l';
    row.dataset.speed = r % 3 ? 'slow' : 'fast';
    const tiles = [];
    for (let i = 0; i < perRow + r; i++) {
      const p = people[k++ % people.length];
      const tile = document.createElement('div');
      tile.className = 'heroTile';
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.alt = '';
      img.src = p.portrait;
      img.onerror = () => { tile.style.opacity = '.18'; img.remove(); };
      tile.appendChild(img);
      tiles.push(tile);
      row.appendChild(tile);
    }
    // The marquee loops by sliding exactly one copy's width.
    tiles.forEach(t => row.appendChild(t.cloneNode(true)));
    el.appendChild(row);
  }
}

// ── the carousel ──

function buildDock(track, people) {
  track.innerHTML = people.map(p => `<a class="dockItem" href="player.html?player=${encodeURIComponent(p.id)}">`
    + `<div class="dockCard"><div class="dockAvatar"><img loading="lazy" alt="" src="${esc(p.portrait)}" `
    + `onerror="this.closest('.dockItem').classList.add('is-missing')"><span class="dockInitials">${esc(initials(p.name))}</span></div>`
    + `<div class="dockName">${esc(p.name)}</div></div></a>`).join('');
}

function coverflow(track) {
  const center = track.scrollLeft + track.clientWidth / 2;
  for (const it of track.querySelectorAll('.dockItem')) {
    const w = it.offsetWidth || 1;
    const d = Math.max(-2.2, Math.min(2.2, (it.offsetLeft + w / 2 - center) / w));
    it.style.transform = `translateY(${Math.abs(d) * 8}px) translateZ(${(1.8 - Math.abs(d)) * 48}px) `
      + `rotateY(${d * -18}deg) scale(${1 - Math.min(0.22, Math.abs(d) * 0.09)})`;
  }
}

function runDock(track, controls) {
  let auto = !reduceMotion();
  const step = () => {
    if (auto) {
      track.scrollLeft += 0.3;
      if (track.scrollLeft >= track.scrollWidth - track.clientWidth - 2) track.scrollLeft = 0;
    }
    coverflow(track);
    requestAnimationFrame(step);
  };
  track.addEventListener('scroll', () => coverflow(track), { passive: true });
  for (const ev of ['mouseenter', 'focusin', 'touchstart']) track.addEventListener(ev, () => { auto = false; }, { passive: true });
  track.addEventListener('mouseleave', () => { auto = !reduceMotion(); });
  controls.prev?.addEventListener('click', () => { auto = false; track.scrollBy({ left: -260, behavior: 'smooth' }); });
  controls.next?.addEventListener('click', () => { auto = false; track.scrollBy({ left: 260, behavior: 'smooth' }); });
  requestAnimationFrame(() => { track.scrollLeft = (track.scrollWidth - track.clientWidth) * 0.2; step(); });
}

// ── the sections ──

function onAirCard(m, nav = '') {
  if (m.airing) {
    return `<a class="hm-onair" href="on-air.html?show=${encodeURIComponent(m.format)}" style="--show:${esc(m.show.accent)}">${nav}
      <span class="hm-live"><i></i>On air now</span>
      <span class="hm-onair-show">${esc(m.show.name)}</span>
      <b>${esc(m.title)}</b>
      <span>${esc(m.words.round || 'Episode')} ${esc(m.episode)} · ${esc(m.stillInCount)} of ${esc(m.total)} ${esc(m.words.players || 'players')} still in</span>
      <em>Follow the season</em>
    </a>`;
  }
  const w = m.last ? seasonWinners(m.last).map(x => x.name).join(' & ') : '';
  return `<a class="hm-onair is-off" href="on-air.html">
    <span class="hm-live off"><i></i>Between seasons</span>
    <b>${esc(m.last?.title || 'Nothing on air')}</b>
    <span>${w ? `Won by ${esc(w)}` : ''}</span>
    <em>See what aired last</em>
  </a>`;
}

function showsHtml(model) {
  const tile = s => {
    const w = s.winner;
    return `<a class="hm-show" href="seasons.html?show=${encodeURIComponent(s.format)}" style="--c:${esc(s.accent)}">
      <span class="hm-show-name">${esc(s.name)}</span>
      <span class="hm-show-count">${s.seasons} ${s.seasons === 1 ? 'season' : 'seasons'}</span>
      ${w ? `<span class="hm-show-winner"><img src="${esc(avatarUrl({ slug: w.playerSlug, show: s.format }))}" alt="" loading="lazy" onerror="this.remove()">Latest winner <b>${esc(w.name)}</b></span>` : ''}
    </a>`;
  };
  return `<div class="hm-shows">${model.aired.map(tile).join('')}</div>`
    + (model.upcoming.length ? `<p class="hm-upcoming">In production: ${model.upcoming.map(s => esc(s.name)).join(', ')}.</p>` : '');
}

function finalesHtml(model) {
  return `<div class="hm-finales">${model.recent.map(s => {
    const ws = seasonWinners(s);
    const w = ws[0];
    return `<a class="hm-finale" href="season_ref.html?season=${encodeURIComponent(s.seasonId || s.seasonNumber)}">
      ${w ? `<img src="${esc(avatarUrl({ slug: w.playerSlug, show: s.format }))}" alt="" loading="lazy" onerror="this.remove()">` : ''}
      <span><b>${esc(s.title)}</b><small>${ws.length ? `Won by ${esc(ws.map(x => x.name).join(' & '))}` : ''}${airLabel(s) ? ` · ${esc(airLabel(s))}` : ''}</small></span>
    </a>`;
  }).join('')}</div>`;
}

export async function mountHome() {
  const get = url => fetch(url, { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null);
  const [pdb, sdb, rdb] = await Promise.all([get('players_database.json'), get('seasons_database.json'),
    get('rankings_database.json'), loadPortraitCatalog().catch(() => null)]);
  const players = (pdb?.players || []).filter(p => p?.id && p?.name);
  const seasons = sdb?.seasons || [];
  const model = homeModel(players, seasons);
  const people = shuffle(players).map(p => ({ id: p.id, name: p.name, portrait: avatarUrl(p.id) }));

  buildWall(document.getElementById('heroWall'), people);

  const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
  set('hmCounts', [
    [model.counts.shows, model.counts.shows === 1 ? 'show' : 'shows'],
    [model.counts.seasons, 'seasons'],
    [model.counts.episodes, 'episodes'],
    [model.counts.players, 'players'],
  ].map(([n, l]) => `<div><b>${n}</b><span>${l}</span></div>`).join(''));
  set('hmShows', showsHtml(model));
  set('hmFinales', finalesHtml(model));
  mountToday(document.getElementById('hmToday'), { players, seasons, rankings: rdb?.rankings || [] });
  set('hmPlayersLink', `Browse all ${model.counts.players} players`);

  const track = document.getElementById('coverflowTrack');
  if (track && people.length) {
    buildDock(track, people);
    runDock(track, { prev: document.getElementById('dockPrev'), next: document.getElementById('dockNext') });
  }

  // On air last: it is the one section waiting on the network.
  // Every show on the air, one card each, with arrows between them -- two
  // shows can air in the same slot, and the card used to know only one.
  const [entries, exits] = await Promise.all([loadAiring(), get(`${API}/api/live-exits`)]);
  const models = airingModels(entries, exits, seasons);

  // What changed since this browser last looked, above everything else.
  mountDigest(document.getElementById('hmDigest'),
    snapshot({ models, exits, seasons, players: players.length }),
    { models, exits, seasons, exitSentence, seasonWinners, showOf: f => SHOWS[f || DEFAULT_FORMAT] });

  const mount = document.getElementById('hmOnAir');
  if (!mount) return;
  if (!models.length) { mount.innerHTML = onAirCard(onAirModel(null, exits, seasons)); return; }
  let at = 0, timer = null;
  const draw = () => {
    const nav = models.length > 1
      ? `<span class="hm-onair-nav" aria-hidden="false"><span>${at + 1} / ${models.length}</span>`
        + `<button type="button" data-step="-1" aria-label="Previous show on air">&#8249;</button>`
        + `<button type="button" data-step="1" aria-label="Next show on air">&#8250;</button></span>` : '';
    mount.innerHTML = onAirCard(models[at], nav);
    mount.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      at = (at + Number(b.dataset.step) + models.length) % models.length;
      clearInterval(timer); timer = null;
      draw();
    }));
  };
  draw();
  // A slow rotation when nobody is touching it, so both shows get seen.
  if (models.length > 1 && !reduceMotion()) {
    timer = setInterval(() => { at = (at + 1) % models.length; draw(); }, 7000);
    mount.addEventListener('mouseenter', () => { clearInterval(timer); timer = null; }, { once: true });
  }
}
