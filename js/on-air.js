// On Air: the season Blindside Network is airing right now, for a visitor.
//
// WHY THIS PAGE. "Current Season" was the creator's control room -- AI worker
// addresses, a paste box, Sync and Export buttons -- sitting in the public nav,
// so a visitor asking "what is on?" got a form. That room still exists (Studio
// menu, current-season.html). This page answers the visitor's question from
// what "Publish to site" already sends:
//
//   /api/live-season  -- the standings: episode, who is in, out or on the jury
//   /api/live-exits   -- which SHOW it is, its title and air window, and the
//                        exit interviews (the standings carry no format)
//   /api/social       -- what Birdie said about the latest episode
//
// Every word that differs by show comes from js/shows.js (`words`): a Big
// Brother houseguest is evicted, a Total Drama camper is voted off, and Drag
// Race has no vote at all -- so a vote count is never printed for it.
import { SHOWS, DEFAULT_FORMAT } from './shows.js';
import { airLabel, latestAired } from './franchise-calendar.js';
import { seasonWinners } from './records.js';
import { avatarUrl, loadPortraitCatalog } from './avatar-registry.js';

const API = (() => {
  try { return (localStorage.getItem('studio_api_base') || 'https://dc-studio.yannari19.workers.dev').replace(/\/+$/, ''); }
  catch { return 'https://dc-studio.yannari19.workers.dev'; }
})();

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function ordinal(n) {
  const v = n % 100;
  return n + (v >= 11 && v <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'));
}

const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** "3 hours ago", from the worker's UTC "YYYY-MM-DD HH:MM:SS". */
export function agoLabel(stamp, now = Date.now()) {
  const t = Date.parse(String(stamp || '').replace(' ', 'T') + 'Z');
  if (!Number.isFinite(t)) return '';
  const m = Math.max(0, Math.round((now - t) / 60000));
  if (m < 2) return 'just now';
  if (m < 60) return `${m} minutes ago`;
  const h = Math.round(m / 60);
  if (h < 24) return h === 1 ? 'an hour ago' : `${h} hours ago`;
  const d = Math.round(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

/**
 * Everything the page says, decided before anything is drawn.
 *
 * `live` is /api/live-season, `exits` /api/live-exits, `seasons` the
 * seasons_database.json list. Returns { airing: false, ... } with the latest
 * finished season when nothing is on.
 */
export function onAirModel(live, exits, seasons = []) {
  const finished = seasons.filter(s => s && /complete/i.test(s.status || 'Complete'));
  if (!live?.airing || !Array.isArray(live.players) || !live.players.length) {
    const last = latestAired(finished) || finished[finished.length - 1] || null;
    const recent = [...finished].sort((a, b) => (b.airYear || 0) - (a.airYear || 0)).slice(0, 4);
    return { airing: false, last, recent };
  }

  // The show: the exit feed entry filed by the same sync (same number, newest).
  const candidates = (exits?.seasons || []).filter(s => Number(s.seasonNumber) === Number(live.seasonNumber));
  candidates.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  const ex = candidates.find(s => s.updatedAt === live.updatedAt) || candidates[0] || null;
  const format = ex?.format && SHOWS[ex.format] ? ex.format : DEFAULT_FORMAT;
  const show = SHOWS[format];
  const words = show.words || {};
  const hasVotes = show.roundShape !== 'placements';

  const players = live.players.map(p => ({
    name: p.name,
    slug: p.slug || String(p.name).toLowerCase(),
    // Through the resolver, like every other screen: the season's own portrait
    // snapshot first, then this show's default, then the global one.
    portrait: avatarUrl({ slug: p.slug || String(p.name).toLowerCase(), show: format, avatarFile: p.avatarFile }),
    status: p.status || 'in',
    exitEpisode: p.exitEpisode ?? null,
    wins: Number(p.challengeWins || 0),
    votes: hasVotes ? Number(p.votesReceived || 0) : 0,
  }));
  const byWins = (a, b) => b.wins - a.wins || a.name.localeCompare(b.name);
  const stillIn = players.filter(p => p.status === 'in').sort(byWins);
  // Most recent exit first: the person who just left leads the list.
  const out = players.filter(p => p.status !== 'in')
    .sort((a, b) => (b.exitEpisode ?? 0) - (a.exitEpisode ?? 0) || a.name.localeCompare(b.name));

  const interviews = ex?.exitInterviews || [];
  const latest = interviews.length
    ? [...interviews].sort((a, b) => (b.week ?? 0) - (a.week ?? 0) || (a.placement ?? 0) - (b.placement ?? 0))[0]
    : null;

  return {
    airing: true,
    format,
    show,
    words,
    hasVotes,
    title: ex?.title || live.title || `${show.name} ${live.seasonNumber}`,
    seasonNumber: live.seasonNumber,
    episode: live.episode,
    total: live.totalPlayers || players.length,
    stillInCount: live.stillIn ?? stillIn.length,
    window: ex ? airLabel(ex) : '',
    updatedAt: live.updatedAt,
    stillIn,
    out,
    latestExit: latest,
  };
}

/** One sentence about the latest exit, in the show's own words. */
export function exitSentence(x, m) {
  if (!x?.guest) return '';
  const round = m.words.round || 'Episode';
  const how = x.how || m.words.exit || 'out';
  const votes = m.hasVotes && x.votes && Number.isFinite(x.votes.against) && Number.isFinite(x.votes.total) && x.votes.total > 0
    ? ` ${x.votes.against}–${x.votes.total - x.votes.against}` : '';
  const when = x.week != null ? ` in ${round.toLowerCase()} ${x.week}` : '';
  const place = x.placement ? `, finishing ${ordinal(x.placement)}` : '';
  return `${x.guest} was ${how}${votes}${when}${place}.`;
}

// ── drawing ──────────────────────────────────────────────────────────────

const face = p => `<img src="${esc(p.portrait)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'oa-initials',textContent:'${esc(p.name).slice(0, 2).toUpperCase()}'}))">`;

function castCard(p, m) {
  const stats = [];
  if (p.wins) stats.push(`${p.wins} ${p.wins === 1 ? 'win' : 'wins'}`);
  if (m.hasVotes && p.votes) stats.push(`${p.votes} ${p.votes === 1 ? 'vote' : 'votes'}`);
  const tag = p.status === 'in' ? ''
    : `<span class="oa-tag">${p.status === 'jury' ? 'Jury' : cap(m.words.exit || 'Out')}${p.exitEpisode ? ` · ${m.words.round || 'Episode'} ${p.exitEpisode}` : ''}</span>`;
  return `<a class="oa-card${p.status === 'in' ? '' : ' is-out'}" href="player.html?player=${encodeURIComponent(p.slug)}">`
    + `<span class="oa-face">${face(p)}</span>`
    + `<span class="oa-name">${esc(p.name)}</span>`
    + (stats.length ? `<span class="oa-stats">${stats.join(' · ')}</span>` : '')
    + tag + `</a>`;
}

export function renderOnAir(root, m, posts = []) {
  if (!m.airing) {
    const last = m.last;
    const w = last ? seasonWinners(last).map(x => x.name).join(' & ') : '';
    root.innerHTML = `
      <section class="oa-hero is-off">
        <span class="oa-live off"><i></i>Off air</span>
        <h1 class="oa-title">Between seasons</h1>
        <p class="oa-meta">Nothing is airing on Blindside right now. The most recent finale is below.</p>
      </section>
      ${last ? `<section class="oa-block"><h2>Latest finale</h2>
        <a class="oa-finale" href="season_ref.html?season=${encodeURIComponent(last.seasonId || last.seasonNumber)}">
          <b>${esc(last.title || '')}</b><span>${w ? `Won by ${esc(w)}` : ''}${airLabel(last) ? ` · ${esc(airLabel(last))}` : ''}</span>
        </a></section>` : ''}
      ${m.recent.length ? `<section class="oa-block"><h2>Recently on Blindside</h2><div class="oa-recent">${m.recent.map(s => {
        const ww = seasonWinners(s).map(x => x.name).join(' & ');
        return `<a href="season_ref.html?season=${encodeURIComponent(s.seasonId || s.seasonNumber)}"><b>${esc(s.title)}</b><span>${ww ? 'Winner: ' + esc(ww) : ''}</span></a>`;
      }).join('')}</div></section>` : ''}`;
    return;
  }

  const pct = m.total > 1 ? Math.round(((m.total - m.stillInCount) / (m.total - 1)) * 100) : 0;
  const players = m.words.players || 'players';
  const exitLine = exitSentence(m.latestExit, m);
  const topPosts = [...posts].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 4);

  root.innerHTML = `
    <section class="oa-hero" style="--show:${esc(m.show.accent || '#FF3EA5')}">
      <div class="oa-hero-top">
        <span class="oa-live"><i></i>On air</span>
        <span class="oa-show">${esc(m.show.name)}</span>
      </div>
      <h1 class="oa-title">${esc(m.title)}</h1>
      <p class="oa-meta">
        <span>${esc(m.words.round || 'Episode')} ${esc(m.episode)}</span>
        <span>${esc(m.stillInCount)} of ${esc(m.total)} ${esc(players)} still in</span>
        ${m.window ? `<span>${esc(m.window)}</span>` : ''}
        ${m.updatedAt ? `<span>Updated ${esc(agoLabel(m.updatedAt))}</span>` : ''}
      </p>
      <div class="oa-progress" role="img" aria-label="${pct}% of the season played"><i style="width:${pct}%"></i></div>
    </section>

    ${exitLine ? `<section class="oa-block oa-exit">
      <h2>Latest exit</h2>
      <p>${esc(exitLine)}</p>
      <a href="kristal.html">Hear the exit interview on Kristal-talKs</a>
    </section>` : ''}

    <section class="oa-block">
      <h2>Still in <small>${m.stillIn.length}</small></h2>
      <div class="oa-grid">${m.stillIn.map(p => castCard(p, m)).join('')}</div>
    </section>

    ${m.out.length ? `<section class="oa-block">
      <h2>Out of the game <small>${m.out.length}</small></h2>
      <div class="oa-grid">${m.out.map(p => castCard(p, m)).join('')}</div>
    </section>` : ''}

    ${topPosts.length ? `<section class="oa-block">
      <h2>On Birdie</h2>
      <div class="oa-posts">${topPosts.map(p => `<article class="oa-post">
        <header><b>${esc(p.name || p.handle)}</b><span>${esc(p.handle || '')}</span></header>
        <p>${esc(p.text)}</p>
        <footer>${esc(p.likes || 0)} likes</footer>
      </article>`).join('')}</div>
      <a class="oa-more" href="social.html">Read the whole feed</a>
    </section>` : ''}`;
}

/** Fetch, decide, draw. Each source failing on its own leaves the rest. */
export async function mountOnAir(root) {
  const get = url => fetch(url, { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null);
  const [live, exits, sdb] = await Promise.all([
    get(`${API}/api/live-season`), get(`${API}/api/live-exits`), get('seasons_database.json'),
    loadPortraitCatalog().catch(() => null),
  ]);
  const m = onAirModel(live, exits, sdb?.seasons || []);
  let posts = [];
  if (m.airing) {
    const feed = await get(`${API}/api/social?format=${encodeURIComponent(m.format)}&season=${encodeURIComponent(m.seasonNumber)}`);
    const all = feed?.posts || [];
    const lastEp = all.reduce((n, p) => Math.max(n, Number(p.episode) || 0), 0);
    posts = all.filter(p => Number(p.episode) === lastEp && p.text);
  }
  renderOnAir(root, m, posts);
  if (m.airing) document.title = `On Air: ${m.title} · Blindside Network`;
  return m;
}
