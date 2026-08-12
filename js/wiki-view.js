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

  // The competition record, which every real character infobox carries and
  // this one did not — so the panel could say somebody played four seasons of
  // Big Brother and never once say whether they were any good at it.
  const t = show.totals || {};
  if (show.format === 'big-brother') {
    row('HOH wins', t.hohWins ? String(t.hohWins) : '');
    row('Veto wins', t.vetoWins ? String(t.vetoWins) : '');
    // Named in full because "BB wins" reads as wins of Big Brother.
    row('Block Buster wins', t.blockBusterWins ? String(t.blockBusterWins) : '');
    if (t.bestBlockBusterStreak > 1) {
      row('Longest arena run', `${t.bestBlockBusterStreak} weeks running`);
    }
    row('Times nominated', t.timesNominated ? String(t.timesNominated) : '');
  } else {
    row('Challenge wins', t.challengeWins ? String(t.challengeWins) : '');
  }
  row('Jury votes', t.juryVotes ? String(t.juryVotes) : '');

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

/**
 * Fill any gallery placeholders in a rendered article.
 *
 * Called by the page after `renderArticle` lands in the DOM. Silent on
 * failure: a wiki article without pictures is an article, and an error box
 * where the pictures should be is worse than the space.
 */
export async function hydrateGalleries(host, { base = '' } = {}) {
  const boxes = [...(host?.querySelectorAll('[data-wk-gallery]') || [])];
  for (const box of boxes) {
    const slug = box.getAttribute('data-wk-gallery');
    if (!slug) continue;
    try {
      const res = await fetch(`${base}/api/gallery/${encodeURIComponent(slug)}`);
      const json = await res.json();
      const images = (json.images || []).slice(0, 8);
      if (!images.length) { box.closest('section')?.remove(); continue; }
      box.innerHTML = images.map(o => `<a class="wk-gitem"
          href="${base}/gallery/${encodeURIComponent(slug)}/${o.file}" target="_blank" rel="noopener">
          <img src="${base}/gallery/${encodeURIComponent(slug)}/${o.file}?v=${o.size}" alt="" loading="lazy">
        </a>`).join('');
    } catch {
      box.closest('section')?.remove();
    }
  }
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

  // ── PERSONALITY ────────────────────────────────────────────────────
  //
  // Per season when the episodes have been read, and the voice profile only
  // as a fallback. Those are different things: a voice profile says how
  // somebody TALKS and exists so the episode writer has a voice to write in;
  // this section is meant to say how they were in the house, which only the
  // screenplay knows.
  //
  // One heading per season rather than one for the person, because people do
  // not play the same way twice and a returnee described once is described
  // wrong for at least one of their seasons.
  const written = show.seasons.filter(s2 => s2.personality);
  if (written.length) {
    section('personality', 'Personality', written.map(s2 => `
      ${show.seasons.length > 1
        ? `<h3 class="wk-sub">${s2.title ? esc(s2.title) : `Season ${s2.season}`}</h3>` : ''}
      <p>${esc(s2.personality)}</p>`).join(''));
  } else if (dossier.personality) {
    section('personality', 'Personality', `<p>${esc(dossier.personality)}</p>`);
  }

  // ── QUOTES ─────────────────────────────────────────────────────────
  //
  // Every fandom character page has these and nothing in this project could
  // produce them until the screenplay was readable: the engine knows somebody
  // was nominated, it does not know what they said about it.
  const quoted = show.seasons.filter(s2 => s2.quotes?.length);
  if (quoted.length) {
    section('quotes', 'Quotes', quoted.map(s2 => `
      <ul class="wk-quotes">${s2.quotes.map(q => `<li>
        <blockquote>&ldquo;${esc(typeof q === 'string' ? q : q.text)}&rdquo;</blockquote>
        ${typeof q === 'object' && q.context ? `<cite>${esc(q.context)}</cite>` : ''}
      </li>`).join('')}</ul>`).join(''));
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

  // ── COMPETITION HISTORY ────────────────────────────────────────────
  //
  // The table half of a character article, and the half that was missing. A
  // fandom page does not describe a season and stop; it prints what the
  // person won, how often they were on the block, and how they got off it.
  //
  // Big Brother and Total Drama get different columns because they are
  // different games — one has a block and the other has a tribal council, and
  // a shared table would have to call both of them "wins".
  const anyRecord = show.seasons.some(x => x.record
    && (x.record.challengeWins || x.record.bb));
  if (anyRecord) {
    const bb = show.format === 'big-brother';
    const head = bb
      ? ['Season', 'HOH', 'Veto', 'Block Buster', 'Nominated', 'On the block', 'Saved', 'Votes against']
      : ['Season', 'Challenge wins', 'Votes against', 'Jury votes'];
    const rows = show.seasons.map(x => {
      const r = x.record || {};
      const b = r.bb || {};
      const label = `<a href="${root}/season_ref.html?season=${esc(x.seasonId || x.season)}">${
        x.title ? esc(x.title) : `Season ${x.season}`}</a>`;
      // A cell that is zero is a fact — they played and won none — so it is a
      // dash rather than a 0, which reads as "not recorded".
      const n = v => (v ? String(v) : '—');
      return bb
        ? `<tr><td>${label}</td><td>${n(b.hohWins)}</td><td>${n(b.vetoWins)}</td>
             <td>${b.blockBusterWins
               ? `${b.blockBusterWins}${b.blockBusterPlayed ? ` of ${b.blockBusterPlayed}` : ''}${
                 b.blockBusterStreak > 1 ? ` <em>(${b.blockBusterStreak} in a row)</em>` : ''}`
               : (b.blockBusterPlayed ? `0 of ${b.blockBusterPlayed}` : '—')}</td>
             <td>${n(b.timesNominated)}</td><td>${n(b.timesOnBlock)}</td>
             <td>${n(b.timesSaved)}</td><td>${n(r.votesReceived)}</td></tr>`
        : `<tr><td>${label}</td><td>${n(r.challengeWins)}</td>
             <td>${n(r.votesReceived)}</td><td>${n(r.juryVotes)}</td></tr>`;
    });
    const t = show.totals || {};
    const totalRow = bb
      ? `<tr class="wk-total"><td>Total</td><td>${t.hohWins || 0}</td><td>${t.vetoWins || 0}</td>
         <td>${t.blockBusterWins || 0}</td><td>${t.timesNominated || 0}</td><td></td><td></td><td></td></tr>`
      : `<tr class="wk-total"><td>Total</td><td>${t.challengeWins || 0}</td><td></td><td>${t.juryVotes || 0}</td></tr>`;
    section('competition', 'Competition history', `
      <table class="wk-table wk-comp">
        <thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${rows.join('')}${show.seasons.length > 1 ? totalRow : ''}</tbody>
      </table>`);
  }

  // ── WEEK BY WEEK ───────────────────────────────────────────────────
  //
  // The most characteristic thing on a fandom character page: a row of weeks
  // with what happened to this person in each. It is the table people screenshot
  // and argue about, and it is what turns a placement into a game.
  //
  // One cell per week, and the cell says the STRONGEST thing that happened —
  // winning the arena outranks being nominated, because being nominated is how
  // you get into the arena. A week with nothing in it is left blank rather
  // than filled with "safe", so the grid reads as a shape.
  for (const sn of show.seasons) {
    if (!sn.weekRows?.length) continue;
    const cell = w => {
      if (w.hoh) return ['HOH', 'wk-c-hoh'];
      if (w.evicted) return ['Evicted', 'wk-c-out'];
      if (w.arenaWon) return ['Block Buster', 'wk-c-arena'];
      if (w.veto) return ['Veto', 'wk-c-veto'];
      if (w.onBlock) return ['Nominated', 'wk-c-nom'];
      if (w.nominated) return ['Nominated', 'wk-c-nom'];
      return ['', ''];
    };
    const rows = sn.weekRows;
    const title = show.seasons.length > 1
      ? `Week by week — ${sn.title ? esc(sn.title) : `Season ${sn.season}`}`
      : 'Week by week';
    section(`weeks${sn.season}`, title, `
      <div class="wk-scroll">
        <table class="wk-table wk-weeks">
          <thead><tr><th>Week</th>${rows.map(w => `<th>${w.week}</th>`).join('')}</tr></thead>
          <tbody>
            <tr><th>${esc(dossier.name)}</th>${rows.map(w => {
              const [label, cls] = cell(w);
              return `<td class="${cls}">${label}</td>`;
            }).join('')}</tr>
            <tr class="wk-weeks-sub"><th>Votes against</th>${rows.map(w =>
              `<td>${w.votesAgainst || ''}</td>`).join('')}</tr>
          </tbody>
        </table>
      </div>
      <p class="wk-thin">${(() => {
        const arena = rows.filter(w => w.arenaPlayed).length;
        const won = rows.filter(w => w.arenaWon).length;
        const bits = [];
        if (rows.filter(w => w.hoh).length) bits.push(`${rows.filter(w => w.hoh).length}x Head of Household`);
        if (rows.filter(w => w.veto).length) bits.push(`${rows.filter(w => w.veto).length}x Power of Veto`);
        if (arena) bits.push(`in the Block Buster ${arena}x, winning ${won}`);
        const nominated = rows.filter(w => w.nominated).length;
        if (nominated) bits.push(`nominated ${nominated}x`);
        return bits.length ? esc(bits.join(' · ')) : '';
      })()}</p>`);
  }

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
  // Facts the episodes support, which is where the interesting ones are: a
  // record table can say somebody won two vetoes and never that they did it
  // in the same shirt both times.
  for (const s2 of show.seasons) {
    for (const t of s2.trivia || []) trivia.push(`<li>${esc(t)}</li>`);
  }
  if (show.wins) trivia.push(`<li>Won ${show.wins === 1 ? 'a season' : `${show.wins} seasons`} of ${esc(m.name)}.</li>`);
  if (show.count > 1) trivia.push(`<li>Played ${show.count} seasons of ${esc(m.name)}.</li>`);
  section('trivia', 'Trivia', trivia.length ? `<ul class="wk-list">${trivia.join('')}</ul>` : '');

  // ── GALLERY ────────────────────────────────────────────────────────
  //
  // Listed in this file's own header as part of the layout since it was
  // written, and never built — so an article ended on trivia while 1,444
  // images sat in the bucket the profile tab was already reading.
  //
  // Loaded from the listing rather than probed: the endpoint exists now, and
  // guessing 1.png/1.jpg/1.webp per slot is forty-eight requests to find out
  // there are three pictures. Filled after render, because an article should
  // not wait on the network to draw its text.
  section('gallery', 'Gallery',
    `<div class="wk-gallery" data-wk-gallery="${esc(dossier.id)}"></div>`);

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
/* The competition table: the reference half of the article. Numbers align so
   a column can be read down, which is the only reason a table beats a
   sentence. */
.wk-comp td, .wk-comp th{ text-align:center; }
.wk-comp td:first-child, .wk-comp th:first-child{ text-align:left; }
/* A season called "Big Brother Season 1: The House That Kept Receipts" was
   wrapping one word per line in a 60px column and pushing the row eight lines
   tall. The title gets the room; the numbers do not need it. */
.wk-comp td:first-child{ min-width:200px; }
.wk-comp{ table-layout:auto; }
.wk-comp td{ font-variant-numeric:tabular-nums; }
.wk-comp em{ opacity:.75; font-style:normal; font-size:11px; }
.wk-total td{ font-weight:700; border-top:2px solid rgba(255,255,255,.16); }
/* The week grid scrolls sideways on its own rather than pushing the article
   wide — a seventeen-week season is a lot of columns on a phone. */
.wk-scroll{ overflow-x:auto; margin-bottom:8px; }
.wk-weeks{ min-width:max-content; }
.wk-weeks th, .wk-weeks td{ text-align:center; white-space:nowrap; font-size:12px; padding:5px 8px; }
.wk-weeks tbody th{ text-align:left; position:sticky; left:0; background:#151226; }
.wk-weeks-sub td, .wk-weeks-sub th{ opacity:.65; font-size:11px; }
.wk-c-hoh{ background:rgba(250,204,21,.16); color:#fde68a; font-weight:700; }
.wk-c-veto{ background:rgba(56,189,248,.16); color:#bae6fd; font-weight:700; }
.wk-c-arena{ background:rgba(79,191,139,.18); color:#a7f3d0; font-weight:700; }
.wk-c-nom{ background:rgba(248,113,113,.14); color:#fecaca; }
.wk-c-out{ background:rgba(248,113,113,.3); color:#fff; font-weight:700; }
.wk-sub{ font-size:15px; margin:14px 0 6px; opacity:.9; }
.wk-quotes{ list-style:none; margin:0; padding:0; }
.wk-quotes li{ margin:0 0 14px; }
.wk-quotes blockquote{ margin:0; padding:8px 0 8px 14px; border-left:3px solid var(--wk-accent);
  font-size:16px; line-height:1.6; font-style:italic; }
.wk-quotes cite{ display:block; margin-top:4px; padding-left:17px; font-size:12px;
  opacity:.6; font-style:normal; }
.wk-gallery{ display:grid; grid-template-columns:repeat(auto-fill,minmax(120px,1fr)); gap:8px; }
.wk-gitem{ display:block; aspect-ratio:3/4; overflow:hidden; border-radius:6px;
  border:1px solid rgba(255,255,255,.1); background:rgba(255,255,255,.03); }
.wk-gitem img{ width:100%; height:100%; object-fit:cover; display:block;
  transition:transform .25s; }
.wk-gitem:hover img{ transform:scale(1.05); }
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
