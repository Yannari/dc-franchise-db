// On Air: what Blindside Network is airing right now, for a visitor.
//
// WHY THIS PAGE. "Current Season" was the creator's control room -- AI worker
// addresses, a paste box, Sync and Export buttons -- sitting in the public nav,
// so a visitor asking "what is on?" got a form. That room still exists (Studio
// menu, current-season.html). This page answers the visitor's question from
// what "Publish to site" already sends:
//
//   /api/live-shows   -- EVERY show on the air, one entry each: the standings,
//                        each player's numbers in the show's own words, their
//                        tribe, the island, and the season's shape (`board`)
//   /api/live-season  -- the single-slot standings, read only when the worker
//                        predates live-shows (then only one show can be known)
//   /api/live-exits   -- the exit interviews, and the air window
//   /api/social       -- what Birdie said about the latest episode
//
// THE SWITCHER DECIDES. With one show picked, the page is that show's season if
// it is on the air, and "between seasons" with its last finale if it is not.
// With all shows, every airing show gets a tab.
//
// Every word that differs by show comes from js/shows.js (`words`, careerStats):
// a Big Brother houseguest is evicted and wins HOHs, a Total Drama camper is
// voted out and wins immunity, and Drag Race has no vote at all -- so a vote
// count is never printed for it.
import { SHOWS, DEFAULT_FORMAT, parseSeasonRef } from './shows.js';
import { airLabel, airKey, latestAired } from './franchise-calendar.js';
import { seasonWinners } from './records.js';
import { avatarUrl, loadPortraitCatalog } from './avatar-registry.js';
import { mediaLogo, ensureMediaCss } from './media-brands.js';
import { currentShow, ALL } from './show-switcher.js';
import { mountCall } from './calls.js';
import { enableTilt } from './card-tilt.js';

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
 * A registry stat label for ONE of something: "vetoes won" -> "veto won",
 * "HOH wins" -> "HOH win", "nominations" -> "nomination".
 */
export function singular(label) {
  return String(label)
    .replace(/\bvetoes\b/, 'veto')
    .replace(/\bwins\b/, 'win')
    .replace(/\b([A-Za-z]+)s won\b/, '$1 won')
    .replace(/\bnominations\b/, 'nomination')
    .replace(/\btimes\b/, 'time')
    .replace(/\bplacements\b/, 'placement')
    .replace(/\bfinishes\b/, 'finish');
}

export const statText = s => `${s.value} ${s.value === 1 ? singular(s.label) : s.label}`;

/** Finished seasons, oldest first by air date. */
function finished(seasons) {
  return (seasons || []).filter(s => s && /complete/i.test(s.status || 'Complete'))
    .sort((a, b) => (airKey(a) ?? Infinity) - (airKey(b) ?? Infinity));
}

/**
 * Everything one airing show's page says, decided before anything is drawn.
 *
 * `live` is one entry of /api/live-shows (or the old /api/live-season), `exits`
 * /api/live-exits. The format is the entry's own when it has one; the old
 * single slot carried none, so it is matched to the exit feed the same sync
 * filed. Returns { airing: false, last, recent } when there is nothing on.
 */
export function onAirModel(live, exits, seasons = []) {
  const done = finished(seasons);
  if (!live?.airing || !Array.isArray(live.players) || !live.players.length) {
    const last = latestAired(done) || done[done.length - 1] || null;
    return { airing: false, last, recent: done.slice(-4).reverse() };
  }

  const same = (exits?.seasons || []).filter(s => Number(s.seasonNumber) === Number(live.seasonNumber)
    && (!live.format || s.format === live.format));
  same.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  const ex = same.find(s => s.updatedAt === live.updatedAt) || same[0] || null;
  const format = live.format && SHOWS[live.format] ? live.format
    : ex?.format && SHOWS[ex.format] ? ex.format : DEFAULT_FORMAT;
  const show = SHOWS[format];
  const words = show.words || {};
  const hasVotes = show.roundShape !== 'placements';
  const board = live.board || {};

  const players = live.players.map(p => {
    const slug = p.slug || String(p.name).toLowerCase();
    const wins = Number(p.challengeWins || 0);
    const stats = Array.isArray(p.stats) && p.stats.length ? p.stats
      : [{ label: words.comps || 'challenges won', value: wins }];
    return {
      name: p.name,
      slug,
      // Through the resolver, like every other screen: the season's own
      // portrait snapshot first, then this show's default, then the global one.
      portrait: avatarUrl({ slug, show: format, avatarFile: p.avatarFile }),
      status: p.status || 'in',
      island: !!p.island,
      team: p.team || null,
      exitEpisode: p.exitEpisode ?? null,
      wins,
      votes: hasVotes ? Number(p.votesReceived || 0) : 0,
      stats: stats.filter(s => s && typeof s.value === 'number'),
    };
  });
  const byWins = (a, b) => b.wins - a.wins || a.name.localeCompare(b.name);
  const stillIn = players.filter(p => p.status === 'in' && !p.island).sort(byWins);
  const island = players.filter(p => p.status === 'in' && p.island).sort(byWins);
  // Most recent exit first: the person who just left leads the list.
  const byExit = (a, b) => (b.exitEpisode ?? 0) - (a.exitEpisode ?? 0) || a.name.localeCompare(b.name);
  const jury = players.filter(p => p.status === 'jury').sort(byExit);
  const out = players.filter(p => p.status !== 'in' && p.status !== 'jury').sort(byExit);

  // The cast still in, grouped the way the show groups it: by tribe before the
  // merge (in the order the season lists them), as one group after it.
  const teams = (board.teams || []).filter(t => stillIn.some(p => p.team === t.name));
  const groups = !board.merged && teams.length
    ? [...teams.map(t => ({ name: t.name, color: t.color, players: stillIn.filter(p => p.team === t.name) })),
      ...(stillIn.some(p => !p.team || !teams.find(t => t.name === p.team))
        ? [{ name: 'Still in', players: stillIn.filter(p => !p.team || !teams.find(t => t.name === p.team)) }] : [])]
    : [{ name: board.merged && board.mergeName ? board.mergeName : 'Still in', merged: !!board.merged, players: stillIn }];

  // Leaders: the top of each named category, when somebody has one.
  const leaders = [];
  for (const label of [...new Set(players.flatMap(p => p.stats.map(s => s.label)))]) {
    const best = players.map(p => ({ p, v: p.stats.find(s => s.label === label)?.value || 0 }))
      .sort((a, b) => b.v - a.v)[0];
    if (best && best.v > 0) leaders.push({ label, value: best.v, player: best.p });
  }
  if (hasVotes) {
    const hot = [...players].filter(p => p.status === 'in').sort((a, b) => b.votes - a.votes)[0];
    if (hot && hot.votes > 0) leaders.push({ label: 'votes against, still standing', value: hot.votes, player: hot });
  }

  const interviews = ex?.exitInterviews || [];
  const latest = interviews.length
    ? [...interviews].sort((a, b) => (b.week ?? 0) - (a.week ?? 0) || (a.placement ?? 0) - (b.placement ?? 0))[0]
    : null;
  const exitPlayer = latest ? players.find(p => p.name === latest.guest) || null : null;

  return {
    airing: true,
    format,
    show,
    words,
    hasVotes,
    board,
    title: ex?.title || live.title || `${show.name} ${live.seasonNumber}`,
    seasonNumber: live.seasonNumber,
    episode: live.episode,
    total: live.totalPlayers || players.length,
    stillInCount: live.stillIn ?? (stillIn.length + island.length),
    window: ex ? airLabel(ex) : '',
    updatedAt: live.updatedAt,
    players,
    stillIn,
    groups,
    island,
    islandName: board.island || null,
    jury,
    out,
    leaders: leaders.slice(0, 4),
    latestExit: latest,
    exitPlayer,
    // Every exit filed so far: "Call it" scores a call against the next one.
    exits: interviews,
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

/**
 * Which airing shows this view shows: one show, when the switcher has picked
 * one (an empty list means it is not on the air), every show otherwise.
 */
export function showsInView(models, picked) {
  if (picked && picked !== ALL) return models.filter(m => m.format === picked);
  return models;
}

// ── drawing ──────────────────────────────────────────────────────────────

const initials = n => String(n).split(/[\s-]+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
const face = (p, cls = '') => `<span class="oa-face ${cls}"><img src="${esc(p.portrait)}" alt="" loading="lazy" `
  + `onerror="this.replaceWith(Object.assign(document.createElement('b'),{textContent:'${esc(initials(p.name))}'}))"></span>`;

function castCard(p, m) {
  const chips = p.stats.filter(s => s.value > 0).slice(0, 3).map(s => `<span class="oa-chip">${esc(statText(s))}</span>`);
  if (m.hasVotes && p.votes && p.status === 'in') chips.push(`<span class="oa-chip is-heat">${p.votes} ${p.votes === 1 ? 'vote' : 'votes'} against</span>`);
  const round = m.words.round || 'Episode';
  const tag = p.status === 'in' ? ''
    : `<span class="oa-stamp">${p.status === 'jury' ? 'Jury' : esc(cap(m.words.exit || 'Out'))}${p.exitEpisode ? ` · ${esc(round)} ${p.exitEpisode}` : ''}</span>`;
  return `<a class="oa-card${p.status === 'in' ? '' : ' is-out'}" href="player.html?player=${encodeURIComponent(p.slug)}">`
    + face(p) + `<span class="oa-name">${esc(p.name)}</span>`
    + (chips.length ? `<span class="oa-chips">${chips.join('')}</span>` : '')
    + tag + `</a>`;
}

const group = (title, players, m, { color = null, note = '' } = {}) => players.length
  ? `<section class="oa-group"${color ? ` style="--team:${esc(color)}"` : ''}>
      <h3>${color ? '<i class="oa-team-dot"></i>' : ''}${esc(title)} <small>${players.length}</small>${note ? `<em>${esc(note)}</em>` : ''}</h3>
      <div class="oa-grid">${players.map(p => castCard(p, m)).join('')}</div>
    </section>` : '';

function heroHtml(m) {
  const pct = m.total > 1 ? Math.round(((m.total - m.stillInCount) / (m.total - 1)) * 100) : 0;
  const wall = [...m.stillIn, ...m.island, ...m.jury, ...m.out]
    .map(p => `<span class="oa-wall-face${p.status === 'in' ? '' : ' is-out'}" title="${esc(p.name)}">${face(p)}</span>`).join('');
  return `<section class="oa-hero" style="--show:${esc(m.show.accent || '#FF3EA5')}">
    <div class="oa-hero-glow" aria-hidden="true"></div>
    <div class="oa-hero-copy">
      <div class="oa-hero-top">
        <span class="oa-live"><i></i>On air</span>
        <span class="oa-show">${esc(m.show.name)}</span>
      </div>
      <h1 class="oa-title">${esc(m.title)}</h1>
      <p class="oa-meta">
        <span><b>${esc(m.words.round || 'Episode')} ${esc(m.episode)}</b></span>
        <span>${esc(m.stillInCount)} of ${esc(m.total)} ${esc(m.words.players || 'players')} still in</span>
        ${m.board.merged ? `<span>Merged${m.board.mergeName ? `: ${esc(m.board.mergeName)}` : ''}</span>` : ''}
        ${m.window ? `<span>${esc(m.window)}</span>` : ''}
        ${m.updatedAt ? `<span>Updated ${esc(agoLabel(m.updatedAt))}</span>` : ''}
      </p>
      <div class="oa-progress" role="img" aria-label="${pct}% of the season played"><i style="width:${pct}%"></i></div>
    </div>
    <div class="oa-wall" aria-label="The cast">${wall}</div>
  </section>`;
}

function exitHtml(m) {
  const x = m.latestExit;
  const line = exitSentence(x, m);
  if (!line) return '';
  const p = m.exitPlayer;
  const tally = m.hasVotes && x.votes && x.votes.total > 0
    ? `<div class="oa-tally"><b>${x.votes.against}</b><span>–</span><b>${x.votes.total - x.votes.against}</b></div>` : '';
  const verb = (x.how || m.words.exit || 'out').toUpperCase();
  return `<section class="oa-exit">
    ${p ? `<div class="oa-exit-face">${face(p, 'xl')}<span class="oa-exit-stamp">${esc(verb)}</span></div>` : `<span class="oa-exit-stamp is-flat">${esc(verb)}</span>`}
    <div class="oa-exit-copy">
      <span class="oa-kicker">Latest exit</span>
      <h2>${esc(x.guest)}</h2>
      <p>${esc(line)}</p>
      ${x.prediction ? `<p class="oa-predict">On the way out, ${esc(x.guest)} called <b>${esc(x.prediction)}</b> as the next to go.</p>` : ''}
      <a class="oa-kristal" href="kristal.html">${mediaLogo('kristal', { size: 26 })}<span>Watch the exit interview</span></a>
    </div>
    ${tally}
  </section>`;
}

function leadersHtml(m) {
  if (!m.leaders.length) return '';
  return `<section class="oa-leaders" aria-label="Leading the season">${m.leaders.map(l => `
    <a class="oa-leader" href="player.html?player=${encodeURIComponent(l.player.slug)}">
      ${face(l.player)}
      <span><b>${esc(l.value)}</b><small>${esc(l.value === 1 ? singular(l.label) : l.label)}</small><em>${esc(l.player.name)}</em></span>
    </a>`).join('')}</section>`;
}

function birdieHtml(posts) {
  if (!posts.length) return '';
  return `<section class="oa-block oa-birdie">
    <div class="oa-head">${mediaLogo('birdie', { size: 30, link: true })}<span class="oa-head-note">The night's top posts</span>
      <div class="oa-arrows"><button type="button" class="oa-arrow" data-dir="-1" aria-label="Earlier posts">&#8249;</button>
      <button type="button" class="oa-arrow" data-dir="1" aria-label="More posts">&#8250;</button></div></div>
    <div class="oa-posts" tabindex="0">${posts.map(p => `<article class="oa-post">
      <header><span class="oa-avatar">${esc((p.name || p.handle || '?').replace(/^@/, '').slice(0, 1).toUpperCase())}</span>
        <span><b>${esc(p.name || p.handle)}</b><small>${esc(p.handle || '')}</small></span></header>
      <p>${esc(p.text)}</p>
      <footer><span>&#9829; ${esc(Number(p.likes || 0).toLocaleString())}</span>${p.tomatoes ? `<span>&#127813; ${esc(p.tomatoes)}</span>` : ''}</footer>
    </article>`).join('')}</div>
  </section>`;
}

function boardHtml(m) {
  const island = m.island.length ? group(m.islandName || 'The island', m.island, m, { note: 'Still fighting to get back in' }) : '';
  const teams = m.groups.map(g => group(g.name, g.players, m, { color: g.color, note: g.merged ? 'Merged' : '' })).join('');
  const jury = group('The jury', m.jury, m);
  const out = group(m.jury.length ? 'Before the jury' : 'Out of the game', m.out, m);
  return `<section class="oa-block"><div class="oa-head"><h2>The board</h2></div>${teams}${island}${jury}${out}</section>`;
}

function offAirHtml(seasons, format, others) {
  const done = finished(seasons).filter(s => !format || (s.format || DEFAULT_FORMAT) === format);
  const last = done[done.length - 1] || null;
  const w = last ? seasonWinners(last).map(x => x.name).join(' & ') : '';
  const name = format ? SHOWS[format]?.name : null;
  return `<section class="oa-hero is-off" style="--show:${esc(format ? SHOWS[format]?.accent : '#7B5CFF')}">
      <div class="oa-hero-glow" aria-hidden="true"></div>
      <div class="oa-hero-copy">
        <div class="oa-hero-top"><span class="oa-live off"><i></i>Off air</span>${name ? `<span class="oa-show">${esc(name)}</span>` : ''}</div>
        <h1 class="oa-title">${name ? `${esc(name)} is between seasons` : 'Between seasons'}</h1>
        <p class="oa-lede">${last ? `The last finale was <b>${esc(last.title)}</b>${w ? `, won by ${esc(w)}` : ''}.` : 'No season of this show has aired yet.'}</p>
        ${last ? `<a class="oa-cta" href="season_ref.html?season=${encodeURIComponent(last.seasonId || last.seasonNumber)}">Relive the finale</a>` : ''}
      </div>
    </section>
    ${others.length ? `<section class="oa-block"><div class="oa-head"><h2>On the air right now</h2></div><div class="oa-others">${others.map(o => `
      <a class="oa-other" href="on-air.html?show=${encodeURIComponent(o.format)}" style="--show:${esc(o.show.accent)}">
        <span class="oa-live"><i></i>On air</span><b>${esc(o.title)}</b><span>${esc(o.words.round || 'Episode')} ${esc(o.episode)} · ${esc(o.stillInCount)} of ${esc(o.total)} still in</span>
      </a>`).join('')}</div></section>` : ''}`;
}

function tabsHtml(models, active) {
  if (models.length < 2) return '';
  return `<nav class="oa-tabs" role="tablist" aria-label="Shows on the air">${models.map(m => `
    <button type="button" role="tab" class="oa-tab" data-format="${esc(m.format)}" aria-selected="${m.format === active}" style="--show:${esc(m.show.accent)}">
      <i></i><span><b>${esc(m.show.name)}</b><small>${esc(m.title)}</small></span>
    </button>`).join('')}</nav>`;
}

function wireBirdie(root) {
  const track = root.querySelector('.oa-posts');
  if (!track) return;
  root.querySelectorAll('.oa-arrow').forEach(b => b.addEventListener('click', () => {
    track.scrollBy({ left: Number(b.dataset.dir) * Math.max(280, track.clientWidth * 0.85), behavior: 'smooth' });
  }));
}

/** Draw one show's season. */
export function renderShow(root, m, posts = []) {
  const top = [...posts].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 24);
  root.innerHTML = heroHtml(m) + leadersHtml(m) + exitHtml(m) + '<div class="oa-call-slot"></div>'
    + boardHtml(m) + birdieHtml(top);
  wireBirdie(root);
  mountCall(root.querySelector('.oa-call-slot'), m, m.exits);
}

// ── loading ──────────────────────────────────────────────────────────────

const get = url => fetch(url, { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null);

/** Every airing show's raw entry: live-shows, or the single slot on an older worker. */
export async function loadAiring() {
  const many = await get(`${API}/api/live-shows`);
  if (many?.ok && Array.isArray(many.shows)) return many.shows;
  const one = await get(`${API}/api/live-season`);
  return one?.airing ? [one] : [];
}

/**
 * Seasons on the air that only the exit feed knows about.
 *
 * The old worker kept ONE standings slot, so publishing Big Brother 2 wrote
 * over Perfect Match 1 -- and Perfect Match, airing the same summer, vanished
 * from the page while its exits and posts were still up. Each exit interview
 * records who was still in when it happened, so the newest one rebuilds the
 * cast: those names in, every guest so far out. No stats (the exit feed has
 * none), which is the board's honest shape until the show publishes again.
 *
 * `covered` is the models already built; a finished season is not airing.
 */
export function airingFromExits(exits, seasons = [], covered = []) {
  const done = new Set(finished(seasons).map(s => {
    const ref = parseSeasonRef(s.seasonId || s.seasonNumber);
    return ref ? `${ref.format || DEFAULT_FORMAT}:${ref.number}` : '';
  }));
  const have = new Set(covered.map(m => `${m.format}:${m.seasonNumber}`));
  return (exits?.seasons || []).filter(s => SHOWS[s.format] && s.exitInterviews?.length
    && !done.has(`${s.format}:${s.seasonNumber}`) && !have.has(`${s.format}:${s.seasonNumber}`))
    .map(s => {
      const xs = [...s.exitInterviews].sort((a, b) => (a.week ?? 0) - (b.week ?? 0) || (b.placement ?? 0) - (a.placement ?? 0));
      const last = xs[xs.length - 1];
      const gone = new Set(xs.map(x => x.guest));
      const still = (last.stillIn || []).filter(n => !gone.has(n));
      const players = [
        ...still.map(name => ({ name, status: 'in' })),
        ...xs.map(x => ({ name: x.guest, status: x.juror ? 'jury' : 'out', exitEpisode: x.week ?? null })),
      ];
      return {
        format: s.format, seasonNumber: s.seasonNumber, title: s.title, airing: true, fromExits: true,
        episode: last.week ?? null, updatedAt: s.updatedAt, players,
        totalPlayers: players.length, stillIn: still.length,
      };
    });
}

/** Every airing show's model, the standings first and the exit feed filling gaps. */
export function airingModels(entries, exits, seasons = []) {
  const models = entries.map(e => onAirModel(e, exits, seasons)).filter(m => m.airing);
  return models.concat(airingFromExits(exits, seasons, models)
    .map(e => onAirModel(e, exits, seasons)).filter(m => m.airing));
}

const _posts = new Map();
function postsFor(m) {
  const key = `${m.format}:${m.seasonNumber}`;
  if (!_posts.has(key)) {
    _posts.set(key, get(`${API}/api/social?format=${encodeURIComponent(m.format)}&season=${encodeURIComponent(m.seasonNumber)}`)
      .then(feed => {
        const all = feed?.posts || [];
        const lastEp = all.reduce((n, p) => Math.max(n, Number(p.episode) || 0), 0);
        return all.filter(p => Number(p.episode) === lastEp && p.text);
      }));
  }
  return _posts.get(key);
}

/** Fetch, decide, draw; redraws when the switcher or a tab changes. */
export async function mountOnAir(root) {
  ensureMediaCss();
  const [entries, exits, sdb] = await Promise.all([
    loadAiring(), get(`${API}/api/live-exits`), get('seasons_database.json'),
    loadPortraitCatalog().catch(() => null),
  ]);
  const seasons = sdb?.seasons || [];
  const models = airingModels(entries, exits, seasons);
  const picked = () => { try { return currentShow() || ALL; } catch { return ALL; } };
  let active = null;

  const draw = async () => {
    const show = picked();
    const inView = showsInView(models, show);
    if (!inView.length) {
      root.innerHTML = offAirHtml(seasons, show !== ALL ? show : null, models);
      document.title = 'On Air · Blindside Network';
      return;
    }
    const fromHash = decodeURIComponent(location.hash.slice(1));
    const m = inView.find(x => x.format === (active || fromHash)) || inView[0];
    active = m.format;
    root.innerHTML = tabsHtml(inView, m.format) + '<div class="oa-show-body"></div>';
    const body = root.querySelector('.oa-show-body');
    renderShow(body, m, []);
    root.querySelectorAll('.oa-tab').forEach(t => t.addEventListener('click', () => {
      active = t.dataset.format;
      history.replaceState(history.state, '', `#${active}`);
      draw();
    }));
    document.title = `On Air: ${m.title} · Blindside Network`;
    const posts = await postsFor(m);
    if (active === m.format && posts.length) renderShow(body, m, posts);
  };
  addEventListener('showchange', () => { active = null; draw(); });
  // The cast cards tilt like trading cards; a jury or a winner is not foil here.
  enableTilt(root, '.oa-card', { lift: 'translateY(-4px)' });
  await draw();
  return models;
}
