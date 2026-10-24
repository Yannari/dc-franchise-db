// "Since you were last here": what happened on the network while you were away.
//
// The home page keeps a small picture of the network as you last saw it --
// which exits had aired, how far each airing season had got, which seasons
// had finished, how many players there were -- in this browser only. Next
// visit, the difference is the first thing on the page: who left, how far each
// show moved, what finished and who won. A first visit stores the picture and
// says nothing, because "everything is new" is not news.
//
// The card is worked out once per browser session: reloading the home page,
// or coming back to it from another page, shows the same list rather than
// "nothing new" after the first look already moved the picture forward.

const SNAP_KEY = 'bs_last_seen_v1';
const SESSION_KEY = 'bs_digest_v1';

/** The network as it is now, small enough to keep. */
export function snapshot({ models = [], exits = null, seasons = [], players = 0, now = Date.now() } = {}) {
  const done = seasons.filter(s => s && /complete/i.test(s.status || 'Complete'))
    .map(s => String(s.seasonId || s.seasonNumber));
  const exitIds = (exits?.seasons || []).flatMap(s => (s.exitInterviews || [])
    .map(x => x.id || `${s.format}-${s.seasonNumber}-${x.week}-${x.guest}`));
  const airing = Object.fromEntries(models.map(m => [`${m.format}:${m.seasonNumber}`, Number(m.episode) || 0]));
  return { at: now, done, exitIds, airing, players };
}

/**
 * The lines worth telling, newest story first: what finished, what started,
 * who left, how far a season moved, who joined. `ctx` supplies the readers --
 * { models, exits, seasons, exitSentence, seasonWinners, showOf } -- so this
 * stays a pure function of two snapshots.
 */
export function digestLines(prev, now, ctx) {
  if (!prev) return [];
  const lines = [];
  const { models = [], exits = null, seasons = [], exitSentence, seasonWinners, showOf } = ctx;
  const was = new Set(prev.done || []);
  for (const s of seasons) {
    const id = String(s.seasonId || s.seasonNumber);
    if (!now.done.includes(id) || was.has(id)) continue;
    const w = seasonWinners ? seasonWinners(s).map(x => x.name).join(' & ') : '';
    const show = showOf(s.format);
    lines.push({ kind: 'finale', accent: show?.accent, label: s.title,
      text: `${s.title} has finished${w ? ` — won by ${w}` : ''}.`,
      href: `season_ref.html?season=${encodeURIComponent(id)}` });
  }
  const seenExit = new Set(prev.exitIds || []);
  for (const m of models) {
    const key = `${m.format}:${m.seasonNumber}`;
    const href = `on-air.html?show=${encodeURIComponent(m.format)}`;
    const round = m.words?.round || 'Episode';
    if (!(key in (prev.airing || {}))) {
      lines.push({ kind: 'premiere', accent: m.show?.accent, label: m.title, href,
        text: `${m.title} is on the air — ${round.toLowerCase()} ${m.episode} so far.` });
    } else if ((now.airing[key] || 0) > (prev.airing[key] || 0)) {
      const from = prev.airing[key];
      lines.push({ kind: 'progress', accent: m.show?.accent, label: m.title, href,
        text: from
          ? `${m.title} moved from ${round.toLowerCase()} ${from} to ${round.toLowerCase()} ${now.airing[key]}.`
          : `${m.title} reached ${round.toLowerCase()} ${now.airing[key]}.` });
    }
    const season = (exits?.seasons || []).find(s => s.format === m.format && Number(s.seasonNumber) === Number(m.seasonNumber));
    const fresh = (season?.exitInterviews || [])
      .filter(x => !seenExit.has(x.id || `${season.format}-${season.seasonNumber}-${x.week}-${x.guest}`))
      .sort((a, b) => (a.week ?? 0) - (b.week ?? 0) || (b.placement ?? 0) - (a.placement ?? 0));
    for (const x of fresh) {
      const text = exitSentence ? exitSentence(x, m) : '';
      if (text) lines.push({ kind: 'exit', accent: m.show?.accent, label: m.title, href, text });
    }
  }
  const joined = (now.players || 0) - (prev.players || 0);
  if (prev.players && joined > 0) {
    lines.push({ kind: 'players', label: 'Players', href: 'devotees.html',
      text: `${joined} new ${joined === 1 ? 'player has' : 'players have'} joined the network.` });
  }
  return lines;
}

/** "3 days ago", for the last visit. */
export function sinceLabel(at, now = Date.now()) {
  const m = Math.max(0, Math.round((now - at) / 60000));
  if (m < 60) return m <= 1 ? 'a minute ago' : `${m} minutes ago`;
  const h = Math.round(m / 60);
  if (h < 24) return h === 1 ? 'an hour ago' : `${h} hours ago`;
  const d = Math.round(h / 24);
  if (d < 14) return d === 1 ? 'yesterday' : `${d} days ago`;
  const w = Math.round(d / 7);
  return `${w} weeks ago`;
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ICON = { finale: '★', premiere: '●', progress: '▶', exit: '✕', players: '+' };

export function digestHtml(lines, since) {
  return `<section class="hm-digest" aria-labelledby="hmDigestTitle">
    <div class="hm-digest-head">
      <div><span class="hm-digest-kicker">Since you were last here${since ? ` · ${esc(since)}` : ''}</span>
      <h2 id="hmDigestTitle">${lines.length === 1 ? 'One thing happened' : `${lines.length} things happened`}</h2></div>
      <button type="button" class="hm-digest-x" aria-label="Dismiss">&times;</button>
    </div>
    <ol class="hm-digest-list">${lines.map((l, i) => `<li style="--show:${esc(l.accent || '#B9A7FF')};--i:${i}">
      <a href="${esc(l.href)}"><i aria-hidden="true">${ICON[l.kind] || '•'}</i><span>${esc(l.text)}</span></a></li>`).join('')}</ol>
  </section>`;
}

/** Work out (once a session) and draw the card into `mount`; move the picture forward. */
export function mountDigest(mount, now, ctx) {
  if (!mount) return;
  let shown = null;
  try { shown = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { /* blocked */ }
  if (!shown) {
    let prev = null;
    try { prev = JSON.parse(localStorage.getItem(SNAP_KEY) || 'null'); } catch { /* blocked */ }
    shown = { lines: digestLines(prev, now, ctx), since: prev ? sinceLabel(prev.at, now.at) : '' };
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(shown));
      localStorage.setItem(SNAP_KEY, JSON.stringify(now));
    } catch { /* blocked storage: the card simply never appears */ }
  }
  if (!shown.lines?.length || shown.dismissed) return;
  mount.innerHTML = digestHtml(shown.lines.slice(0, 8), shown.since);
  mount.querySelector('.hm-digest-x')?.addEventListener('click', () => {
    mount.innerHTML = '';
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...shown, dismissed: true })); } catch { /* blocked */ }
  });
}
