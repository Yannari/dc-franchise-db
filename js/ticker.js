// The network's news ticker: one slim live bar under the header of every page,
// while something is on the air.
//
// It says what a channel's lower third says between programmes: who just left
// and how, who they called on the way out, what the season's leaders have won,
// and the night's loudest post. Every line links to where the story is.
//
// Nothing on the air, no bar -- a ticker crawling last year's finale is a
// channel that forgot to switch it off.
//
// The data is the On Air page's (js/on-air.js), loaded on demand so a page
// with nothing airing never pays for it, and held for a few minutes per tab so
// walking around the site does not refetch it on every page.

const API = (() => {
  try { return (localStorage.getItem('studio_api_base') || 'https://dc-studio.yannari19.workers.dev').replace(/\/+$/, ''); }
  catch { return 'https://dc-studio.yannari19.workers.dev'; }
})();
const CACHE_KEY = 'bs_ticker_v1';
// Collapsed is a choice the reader makes once, so it holds across pages and
// visits until they open the bar again.
const COLLAPSED_KEY = 'bs_ticker_collapsed';
const CACHE_MS = 3 * 60 * 1000;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const clip = (t, n = 110) => {
  const s = String(t || '').replace(/\s+/g, ' ').trim();
  return s.length <= n ? s : `${s.slice(0, n).replace(/\s+\S*$/, '')}…`;
};

/**
 * The lines, decided from On Air models (js/on-air.js) and each show's latest
 * posts. Pure: `helpers` is { exitSentence, statText } from on-air.js.
 * Returns [{ kind, label, accent, text, href }].
 */
export function tickerItems(models, postsByFormat = {}, { exitSentence, statText, picksForExit, exitInterviewHref }) {
  const items = [];
  for (const m of models) {
    const label = m.title;
    const accent = m.show?.accent || '#FF3EA5';
    const show = encodeURIComponent(m.format);
    const x = m.latestExit;
    const line = x ? exitSentence(x, m) : '';
    if (line) items.push({ kind: 'exit', label, accent, text: line, href: `on-air.html?show=${show}` });
    // Quoted from the interview: who goes next when it was asked, else the winner pick.
    const picks = x && picksForExit ? picksForExit(m.format, m.seasonNumber, x) : {};
    const said = picks.next ? `${x.guest} names ${picks.next} to go next.`
      : picks.winner ? `${x.guest} picks ${picks.winner} to win it all.` : '';
    if (said) {
      items.push({ kind: 'call', label, accent, text: said,
        href: exitInterviewHref ? exitInterviewHref(m.format, m.seasonNumber, x) : 'kristal.html' });
    }
    const lead = (m.leaders || [])[0];
    if (lead) items.push({ kind: 'leader', label, accent, text: `${lead.player.name} leads the season: ${statText(lead)}.`, href: `on-air.html?show=${show}` });
    if (!line && m.episode != null) {
      items.push({ kind: 'episode', label, accent, href: `on-air.html?show=${show}`,
        text: `${m.words?.round || 'Episode'} ${m.episode} is in: ${m.stillInCount} of ${m.total} ${m.words?.players || 'players'} still in.` });
    }
    const top = [...(postsByFormat[m.format] || [])].filter(p => p?.text && p.stream !== 'chat')
      .sort((a, b) => (b.likes || 0) - (a.likes || 0))[0];
    if (top) {
      items.push({ kind: 'post', label, accent, text: `“${clip(top.text)}” ${top.handle || ''}`.trim(),
        href: `social.html?show=${show}&season=${encodeURIComponent(m.seasonNumber)}` });
    }
  }
  // Interleave the shows, so two airing shows alternate instead of one
  // show's five lines and then the other's.
  const byShow = new Map();
  for (const it of items) byShow.set(it.label, [...(byShow.get(it.label) || []), it]);
  const lanes = [...byShow.values()];
  const out = [];
  for (let i = 0; lanes.some(l => l[i]); i++) for (const l of lanes) if (l[i]) out.push(l[i]);
  return out;
}

const KIND = { exit: 'Exit', call: 'Kristal-talKs', leader: 'Leader', episode: 'Tonight', post: 'Birdie' };

export function tickerHtml(items) {
  const row = items.map(it => `<a class="bs-tk-item" href="${esc(it.href)}" style="--show:${esc(it.accent)}">`
    + `<b class="bs-tk-show">${esc(it.label)}</b><span class="bs-tk-kind">${esc(KIND[it.kind] || '')}</span>`
    + `<span class="bs-tk-text">${esc(it.text)}</span></a>`).join('<i class="bs-tk-sep" aria-hidden="true"></i>');
  const n = items.length;
  // The row twice, so the crawl loops by sliding exactly one copy's width.
  return `<span class="bs-tk-live"><i></i>Live</span>`
    + `<div class="bs-tk-view" id="bs-tk-view"><div class="bs-tk-track"><div class="bs-tk-row">${row}</div>`
    + `<div class="bs-tk-row" aria-hidden="true" inert>${row}</div></div></div>`
    + `<button type="button" class="bs-tk-toggle" aria-controls="bs-tk-view" aria-expanded="true" aria-label="Hide the news">`
    + `<span class="bs-tk-more">${n} ${n === 1 ? 'story' : 'stories'}</span>`
    + `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
}

export const TICKER_CSS = `
.bs-ticker{position:relative;z-index:40;display:flex;align-items:stretch;height:38px;overflow:hidden;
  background:linear-gradient(90deg,rgba(14,8,24,.96),rgba(26,12,40,.96));border-bottom:1px solid rgba(255,255,255,.08);
  font-family:var(--font-body,system-ui,sans-serif);font-size:13.5px;color:#EDE6F7}
.bs-tk-live{flex:none;display:flex;align-items:center;gap:8px;padding:0 14px 0 16px;font-weight:900;font-size:11.5px;
  letter-spacing:.16em;text-transform:uppercase;color:#fff;background:linear-gradient(90deg,#E5243B,#FF3EA5);
  clip-path:polygon(0 0,100% 0,calc(100% - 10px) 100%,0 100%);padding-right:22px}
.bs-tk-live i{width:7px;height:7px;border-radius:50%;background:#fff;animation:bsTkBlink 1.4s steps(2,start) infinite}
@keyframes bsTkBlink{to{visibility:hidden}}
.bs-tk-view{position:relative;flex:1;min-width:0;overflow:hidden;
  -webkit-mask-image:linear-gradient(90deg,transparent,#000 24px,#000 calc(100% - 40px),transparent);
          mask-image:linear-gradient(90deg,transparent,#000 24px,#000 calc(100% - 40px),transparent)}
.bs-tk-track{display:flex;width:max-content;height:100%;animation:bsTkCrawl var(--bs-tk-dur,60s) linear infinite}
.bs-ticker:hover .bs-tk-track,.bs-ticker:focus-within .bs-tk-track{animation-play-state:paused}
@keyframes bsTkCrawl{to{transform:translateX(-50%)}}
.bs-tk-row{display:flex;align-items:center;height:100%;padding-left:18px}
.bs-tk-item{display:inline-flex;align-items:center;gap:9px;white-space:nowrap;text-decoration:none;color:inherit;padding:0 4px}
.bs-tk-item:hover .bs-tk-text{text-decoration:underline;text-underline-offset:3px}
.bs-tk-item:focus-visible{outline:2px solid var(--show);outline-offset:2px;border-radius:4px}
.bs-tk-show{font-family:var(--font-display,inherit);font-weight:800;text-transform:uppercase;letter-spacing:.04em;
  font-size:14px;color:var(--show)}
.bs-tk-kind{font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;padding:2px 7px;border-radius:5px;
  background:rgba(255,255,255,.08);color:#CFC4DE}
.bs-tk-sep{display:inline-block;width:6px;height:6px;margin:0 20px;transform:rotate(45deg);background:rgba(255,255,255,.28);flex:none}
.bs-tk-toggle{flex:none;display:flex;align-items:center;gap:8px;padding:0 14px;border:0;border-left:1px solid rgba(255,255,255,.1);
  background:rgba(255,255,255,.04);color:#CFC4DE;font:inherit;font-size:12px;font-weight:700;cursor:pointer}
.bs-tk-toggle:hover{color:#fff;background:rgba(255,255,255,.1)}
.bs-tk-toggle:focus-visible{outline:2px solid #FF3EA5;outline-offset:-2px}
.bs-tk-toggle svg{transition:transform .2s ease}
.bs-tk-more{display:none}
.bs-ticker{transition:height .2s ease}
.bs-ticker.is-collapsed{height:28px;background:transparent;border-bottom-color:transparent}
.bs-ticker.is-collapsed .bs-tk-view{display:none}
.bs-ticker.is-collapsed .bs-tk-live{font-size:10.5px;padding-left:12px;padding-right:18px}
.bs-ticker.is-collapsed .bs-tk-toggle{border-left:0;background:rgba(26,12,40,.9);border-radius:0 0 10px 0}
.bs-ticker.is-collapsed .bs-tk-more{display:inline}
.bs-ticker.is-collapsed .bs-tk-toggle svg{transform:rotate(180deg)}
@media(max-width:600px){.bs-ticker{height:34px;font-size:12.5px}.bs-tk-live{padding-left:10px;padding-right:18px}
  .bs-tk-toggle{padding:0 10px}.bs-ticker.is-collapsed{height:26px}}
@media(prefers-reduced-motion:reduce){.bs-ticker,.bs-tk-toggle svg{transition:none}.bs-tk-track{animation:none}.bs-tk-view{overflow-x:auto}.bs-tk-row[aria-hidden]{display:none}}
`;

function readCache() {
  try {
    const c = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
    return c && Date.now() - c.at < CACHE_MS && Array.isArray(c.items) ? c.items : null;
  } catch { return null; }
}
function writeCache(items) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), items })); } catch { /* blocked storage */ }
}

async function fetchItems() {
  const root = document.documentElement.getAttribute('data-root') || '.';
  const get = url => fetch(url, { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null);
  const onAir = await import('./on-air.js');
  const [entries, exits, sdb] = await Promise.all([
    onAir.loadAiring().catch(() => []), get(`${API}/api/live-exits`), get(`${root}/seasons_database.json`),
  ]);
  const models = onAir.airingModels(entries, exits, sdb?.seasons || []);
  const posts = {};
  await Promise.all(models.map(async m => {
    const feed = await get(`${API}/api/social?format=${encodeURIComponent(m.format)}&season=${encodeURIComponent(m.seasonNumber)}`);
    const all = feed?.posts || [];
    const last = all.reduce((n, p) => Math.max(n, Number(p.episode) || 0), 0);
    posts[m.format] = all.filter(p => Number(p.episode) === last);
  }));
  const kx = await import('./kristal-exit.js');
  return tickerItems(models, posts, { ...onAir, picksForExit: kx.picksForExit, exitInterviewHref: kx.exitInterviewHref });
}

/** Put the ticker under the site header, when something is on the air. */
export async function mountTicker(header) {
  if (!header || document.getElementById('bs-ticker')) return;
  let items = readCache();
  if (!items) {
    items = await fetchItems().catch(() => []);
    writeCache(items);
  }
  if (!items.length) return;
  if (!document.getElementById('bs-ticker-css')) {
    const s = document.createElement('style');
    s.id = 'bs-ticker-css';
    s.textContent = TICKER_CSS;
    document.head.appendChild(s);
  }
  const bar = document.createElement('div');
  bar.id = 'bs-ticker';
  bar.className = 'bs-ticker';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Live from the network');
  bar.innerHTML = tickerHtml(items);
  const toggle = bar.querySelector('.bs-tk-toggle');
  const setCollapsed = on => {
    bar.classList.toggle('is-collapsed', on);
    toggle.setAttribute('aria-expanded', String(!on));
    toggle.setAttribute('aria-label', on ? `Show the news, ${items.length} ${items.length === 1 ? 'story' : 'stories'}` : 'Hide the news');
  };
  let collapsed = false;
  try { collapsed = localStorage.getItem(COLLAPSED_KEY) === '1'; } catch { /* blocked storage: open */ }
  setCollapsed(collapsed);
  toggle.addEventListener('click', () => {
    collapsed = !collapsed;
    setCollapsed(collapsed);
    try { localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0'); } catch { /* blocked: holds for this page */ }
  });
  header.insertAdjacentElement('afterend', bar);
  // A steady reading speed whatever the length: ~70px a second. Measured when
  // the row is on screen -- a collapsed bar has no width to measure.
  const measure = () => {
    const w = bar.querySelector('.bs-tk-row')?.scrollWidth || 0;
    if (w) bar.style.setProperty('--bs-tk-dur', `${Math.max(20, Math.round(w / 70))}s`);
  };
  measure();
  toggle.addEventListener('click', () => { if (!collapsed) measure(); });
}
