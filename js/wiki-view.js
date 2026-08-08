// The Wiki tab, laid out the way a fandom article actually is.
//
// Modelled on the real thing rather than on a guess — the section order below
// is the one totaldrama.fandom.com uses for a character:
//
//     infobox (portrait, per-show placement, eliminated in, team,
//              relationships, friends)
//     lead paragraph
//     Personality
//     one section PER SEASON, in order        <- the biography
//     Appearances (a table)
//     Trivia
//     Gallery
//
// TWO THINGS THIS GETS RIGHT THAT THE FIRST ATTEMPT DID NOT.
//
// It is SCOPED TO ONE SHOW. A character's Big Brother article and their Total
// Drama article are different articles, and jamming both into one page was the
// confusion — every heading had to be read twice to work out which show it was
// about. The show switcher picks; the other show is a click away.
//
// And a show with nothing to say gets an EMPTY STATE, not an empty page. If
// somebody has never played Big Brother, that article says so with an icon and
// a way back, rather than rendering a set of headings with nothing under them.
//
// Returns HTML. Takes a dossier from js/wiki.js and nothing else.

const SHOW_META = {
  'total-drama': { name: 'Total Drama', icon: '🎬', accent: '#7d4cff' },
  'big-brother': { name: 'Big Brother', icon: '📹', accent: '#38bdf8' },
};
const meta = f => SHOW_META[f] || { name: f, icon: '📺', accent: '#7d4cff' };

const esc = s => String(s ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const ordinal = n => {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  const s = ['th', 'st', 'nd', 'rd'][(v % 100 - v % 10 !== 10) * 1 && v % 10 < 4 ? v % 10 : 0];
  return `${v}${s || 'th'}`;
};

/**
 * The infobox: the panel a fandom article opens with.
 *
 * Every row is omitted when it is unknown rather than printed empty — the real
 * ones do the same, and a column of dashes is what made the first version look
 * like a broken table.
 */
function infobox(dossier, show, root) {
  const m = meta(show.format);
  const rows = [];
  const row = (label, value) => { if (value) rows.push([label, value]); };

  const bio = dossier.bio || {};
  row('Gender', bio.gender === 'f' ? 'Female' : bio.gender === 'm' ? 'Male' : bio.gender ? 'Non-binary' : '');
  row('Age', bio.age ? String(bio.age) : '');
  row('Nationality', [bio.ethnicity, bio.nationality].filter(Boolean).join(' '));
  row('Archetype', bio.archetype);
  row('Seasons', `${show.count} (${m.name})`);
  row('Best finish', show.best < 99 ? ordinal(show.best) : '');
  row('Wins', show.wins ? String(show.wins) : '');

  // Per-season placement, the way a real infobox lists them.
  for (const s of show.seasons) {
    row(`Season ${s.season} place`, `${ordinal(s.placement)}${s.status ? ` · ${esc(s.status)}` : ''}`);
    if (s.tribe) row(`Season ${s.season} team`, esc(s.tribe));
  }

  const rel = dossier.relationships || {};
  if (dossier.couple) {
    row('Relationship', `${esc(dossier.couple.partner)}${dossier.couple.together ? '' : ' (ended)'}`);
  }
  if (rel.bonds?.length) {
    row('Friends', rel.bonds.slice(0, 5).map(b => esc(b.name)).join(', '));
  }
  if (rel.rivalries?.length) {
    row('Rivals', rel.rivalries.map(r => esc(r.rival)).join(', '));
  }

  return `
  <aside class="wk-infobox" style="--wk-accent:${m.accent}">
    <div class="wk-ib-title">${esc(dossier.name)}</div>
    <img class="wk-ib-portrait" src="${root}/assets/avatars/${esc(dossier.id)}.png" alt=""
         onerror="this.style.display='none'">
    <div class="wk-ib-show">${m.icon} ${esc(m.name)}</div>
    <table class="wk-ib-table">
      ${rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${v}</td></tr>`).join('')}
    </table>
  </aside>`;
}

/** The opening paragraph: who they are, in one sentence of fact. */
function lead(dossier, show) {
  const m = meta(show.format);
  const bits = [];
  bits.push(`<strong>${esc(dossier.name)}</strong> was a contestant on <em>${esc(m.name)}</em>`);
  bits.push(show.count === 1 ? `Season ${show.seasons[0].season}` : `${show.count} seasons`);
  if (show.wins) bits.push(`winning ${show.wins === 1 ? 'once' : `${show.wins} times`}`);
  else if (show.best < 99) bits.push(`finishing as high as ${ordinal(show.best)}`);
  return `<p class="wk-lead">${bits.join(', ')}.</p>`;
}

/** A show this character has never played. Said plainly, with a way out. */
export function emptyArticle(dossier, format, otherShows, root) {
  const m = meta(format);
  const others = otherShows.filter(f => f !== format);
  return `
  <div class="wk-empty">
    <div class="wk-empty-icon">${m.icon}</div>
    <h2>No ${esc(m.name)} article</h2>
    <p>${esc(dossier.name)} has never played ${esc(m.name)}, so there is nothing to write.
       This page fills itself in the moment they do.</p>
    ${others.length ? `<div class="wk-empty-actions">${others.map(f =>
      `<button type="button" class="wk-btn" data-wiki-show="${f}">${meta(f).icon} Read the ${esc(meta(f).name)} article</button>`
    ).join('')}</div>` : ''}
  </div>`;
}

/**
 * One character's article for one show.
 *
 * `dossier` comes from js/wiki.js. `format` is the show being read.
 */
export function renderArticle(dossier, format, { root = '.', allShows = [] } = {}) {
  if (!dossier) return '';
  const show = (dossier.career || []).find(c => c.format === format);
  if (!show || !show.seasons.length) {
    return emptyArticle(dossier, format, allShows, root);
  }

  const m = meta(format);
  const contents = [];
  const body = [];
  const section = (id, title, html) => {
    if (!html) return;
    contents.push([id, title]);
    body.push(`<section class="wk-section" id="wk-${id}"><h2>${esc(title)}</h2>${html}</section>`);
  };

  // Personality — the voice profile, which is a description of the person.
  if (dossier.personality) {
    section('personality', 'Personality', `<p>${esc(dossier.personality)}</p>`);
  }

  // The biography: one heading per season, in order, exactly as a fandom page
  // does it. This is the separation that was missing.
  for (const s of show.seasons) {
    const title = s.title ? `Season ${s.season}: ${s.title}` : `Season ${s.season}`;
    const parts = [];
    if (s.story) parts.push(`<p>${esc(s.story)}</p>`);
    if (s.keyMoments?.length) {
      parts.push(`<ul class="wk-list">${s.keyMoments.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`);
    }
    if (!parts.length) {
      parts.push(`<p class="wk-thin">Placed ${ordinal(s.placement)}${s.status ? ` · ${esc(s.status)}` : ''}. No episode-by-episode record was published for this season.</p>`);
    }
    section(`s${s.season}`, title, parts.join(''));
  }

  // Appearances — the table a fandom article closes its biography with.
  section('appearances', 'Appearances', `
    <table class="wk-table">
      <thead><tr><th>Season</th><th>Placement</th><th>Status</th><th>Team</th></tr></thead>
      <tbody>${show.seasons.map(s => `<tr>
        <td><a href="${root}/season_ref.html?season=${esc(s.seasonId || s.season)}">${
          s.title ? esc(s.title) : `Season ${s.season}`}</a></td>
        <td>${ordinal(s.placement)}</td>
        <td>${esc(s.status || '—')}</td>
        <td>${esc(s.tribe || '—')}</td>
      </tr>`).join('')}</tbody>
    </table>`);

  // Relationships, when any are on record for this show.
  const rel = dossier.relationships || {};
  const relBits = [];
  if (dossier.couple) {
    relBits.push(`<p><strong>${esc(dossier.couple.partner)}</strong> — ${
      dossier.couple.together
        ? `together since season ${dossier.couple.since}`
        : `ended in season ${dossier.couple.season}${dossier.couple.endedBy ? ` at the ${esc(dossier.couple.endedBy)}` : ''}`}</p>`);
  }
  if (rel.bonds?.length) {
    relBits.push(`<p><em>Closest to:</em> ${rel.bonds.map(b =>
      `<a href="${root}/player.html?player=${esc(slugOf(b.name))}">${esc(b.name)}</a>`).join(', ')}</p>`);
  }
  if (rel.alliances?.length) {
    relBits.push(`<p><em>Alliances:</em> ${rel.alliances.map(a => esc(a.name)).join(', ')}</p>`);
  }
  if (rel.rivalries?.length) {
    relBits.push(`<p><em>Rivals:</em> ${rel.rivalries.map(r => esc(r.rival)).join(', ')}</p>`);
  }
  section('relationships', 'Relationships', relBits.join(''));

  // Trivia — records held, and the facts worth knowing.
  const trivia = (dossier.records || [])
    .filter(r => !r.show || r.show === m.name)
    .map(r => `<li>${esc(r.category)} — ${esc(r.stat)}</li>`);
  if (show.wins) trivia.push(`<li>Won ${show.wins === 1 ? 'a season' : `${show.wins} seasons`} of ${esc(m.name)}.</li>`);
  if (show.count > 1) trivia.push(`<li>Played ${show.count} seasons of ${esc(m.name)}.</li>`);
  section('trivia', 'Trivia', trivia.length ? `<ul class="wk-list">${trivia.join('')}</ul>` : '');

  return `
  <article class="wk-article" style="--wk-accent:${m.accent}">
    ${infobox(dossier, show, root)}
    <div class="wk-main">
      ${lead(dossier, show)}
      ${contents.length > 2 ? `<nav class="wk-contents"><b>Contents</b><ol>${
        contents.map(([id, t]) => `<li><a href="#wk-${id}">${esc(t)}</a></li>`).join('')}</ol></nav>` : ''}
      ${body.join('')}
    </div>
  </article>`;
}

const slugOf = n => String(n || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

/** The stylesheet. Kept with the markup so the two cannot drift apart. */
export const WIKI_CSS = `
.wk-article{
  display:grid; grid-template-columns:minmax(0,1fr) 300px; gap:26px;
  align-items:start; margin-top:6px;
}
@media(max-width:900px){ .wk-article{ grid-template-columns:minmax(0,1fr); } }

.wk-main{ min-width:0; }
.wk-lead{ font-size:16.5px; line-height:1.7; margin:0 0 16px; }
.wk-lead strong{ color:var(--wk-accent); }

.wk-contents{
  display:inline-block; min-width:220px; padding:12px 18px 12px 14px; margin:0 0 22px;
  border:1px solid var(--stroke); border-radius:10px; background:var(--panel2);
}
.wk-contents b{ display:block; font-size:12px; letter-spacing:.09em; text-transform:uppercase; opacity:.6; margin-bottom:6px; }
.wk-contents ol{ margin:0; padding-left:20px; }
.wk-contents li{ margin:3px 0; font-size:14px; }
.wk-contents a{ color:var(--wk-accent); text-decoration:none; }
.wk-contents a:hover{ text-decoration:underline; }

.wk-section{ margin:0 0 26px; }
.wk-section h2{
  font-size:20px; margin:0 0 10px; padding-bottom:6px;
  border-bottom:2px solid var(--stroke); font-weight:800;
}
.wk-section p{ margin:0 0 10px; line-height:1.72; font-size:15px; }
.wk-thin{ opacity:.65; font-style:italic; }
.wk-list{ margin:8px 0 0; padding-left:20px; }
.wk-list li{ margin:5px 0; line-height:1.6; font-size:14.5px; }

.wk-table{ width:100%; border-collapse:collapse; font-size:14px; }
.wk-table th, .wk-table td{ padding:8px 10px; text-align:left; border-bottom:1px solid var(--stroke); }
.wk-table thead th{
  font-size:11.5px; letter-spacing:.08em; text-transform:uppercase; opacity:.6; font-weight:700;
}
.wk-table a{ color:var(--wk-accent); text-decoration:none; font-weight:600; }
.wk-table a:hover{ text-decoration:underline; }

/* The infobox: the panel every fandom article opens with. */
.wk-infobox{
  order:2; border:1px solid var(--stroke); border-radius:12px; overflow:hidden;
  background:var(--panel2); position:sticky; top:16px;
}
@media(max-width:900px){ .wk-infobox{ position:static; order:-1; } }
.wk-ib-title{
  background:var(--wk-accent); color:#fff; font-weight:800; font-size:17px;
  padding:10px 14px; text-align:center;
}
.wk-ib-portrait{ display:block; width:100%; aspect-ratio:1; object-fit:cover; }
.wk-ib-show{
  padding:8px 12px; text-align:center; font-size:12.5px; font-weight:700;
  letter-spacing:.05em; text-transform:uppercase; opacity:.75;
  border-bottom:1px solid var(--stroke);
}
.wk-ib-table{ width:100%; border-collapse:collapse; font-size:13px; }
.wk-ib-table th{
  width:44%; text-align:left; padding:7px 12px; vertical-align:top;
  font-weight:700; opacity:.65; border-bottom:1px solid var(--stroke);
}
.wk-ib-table td{ padding:7px 12px; border-bottom:1px solid var(--stroke); }
.wk-ib-table tr:last-child th, .wk-ib-table tr:last-child td{ border-bottom:0; }

/* A show they never played. */
.wk-empty{ text-align:center; padding:64px 24px; }
.wk-empty-icon{ font-size:48px; opacity:.5; margin-bottom:10px; }
.wk-empty h2{ margin:0 0 8px; font-size:21px; }
.wk-empty p{ margin:0 auto; max-width:44ch; line-height:1.6; opacity:.7; }
.wk-empty-actions{ display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:20px; }
.wk-btn{
  min-height:44px; padding:10px 18px; border-radius:10px; cursor:pointer;
  border:1px solid var(--stroke); background:var(--panel); color:var(--text);
  font:inherit; font-weight:700;
}
.wk-btn:hover{ border-color:var(--wk-accent); }

/* The tab strip that chooses Profile or Wiki. */
.pp-viewtabs{ display:flex; gap:6px; margin:18px 0 4px; border-bottom:1px solid var(--stroke); }
.pp-viewtab{
  padding:11px 22px; border-radius:10px 10px 0 0; cursor:pointer; font-weight:800;
  font-size:15px; border:1px solid transparent; border-bottom:none; margin-bottom:-1px;
  background:none; color:var(--muted); font-family:inherit;
}
.pp-viewtab[aria-selected="true"]{
  color:var(--text); background:var(--panel); border-color:var(--stroke);
}
`;
