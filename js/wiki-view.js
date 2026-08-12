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

// `short` is the tab label — "TD14", "BB1" — and matches the code js/shows.js
// already declares for each show, so a third show is named consistently
// wherever it appears rather than getting a second abbreviation here.
const SHOW_META = {
  'total-drama': { name: 'Total Drama', short: 'TD', icon: '🎬', accent: '#7d4cff' },
  'big-brother': { name: 'Big Brother', short: 'BB', icon: '📹', accent: '#38bdf8' },
};
const meta = f => SHOW_META[f]
  || { name: f, short: String(f).slice(0, 2).toUpperCase(), icon: '📺', accent: '#7d4cff' };

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
 * TABBED BY SEASON, the way the reference wikis do it — `MH18 | MH7` over one
 * portrait, then a profile block that is true of the person, then one block per
 * season that is true only of that season.
 *
 * The first version was a single flat list, so somebody's fourth season sat in
 * the same column as their first and every row had to be prefixed "Season 14
 * place" to stay unambiguous. Tabs are how the real ones solve that, and they
 * are also the only way a returnee's two very different games can both be
 * stated at full detail.
 *
 * Newest season first and selected: that is the game somebody arriving from a
 * link about a current season is reading about.
 *
 * Every row is omitted when it is unknown rather than printed empty. The
 * reference pages print "TBA" in that spot; a column of them is noise, and the
 * absence says the same thing more honestly.
 */
function infobox(dossier, show, root) {
  const m = meta(show.format);
  const bio = dossier.bio || {};

  const rowsOf = pairs => pairs
    .filter(([, v]) => v !== '' && v !== null && v !== undefined)
    .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${v}</td></tr>`).join('');

  // ── the person ──
  const profile = rowsOf([
    ['Gender', bio.gender === 'f' ? 'Female' : bio.gender === 'm' ? 'Male' : bio.gender ? 'Non-binary' : ''],
    ['Age', bio.age ? String(bio.age) : ''],
    ['Nationality', [bio.ethnicity, bio.nationality].filter(Boolean).join(' ')],
    ['Label', bio.archetype],
    ['Seasons', `${show.count} (${m.name})`],
  ]);

  // ── the career, across every season of this show ──
  //
  // Kept alongside the per-season blocks, not replaced by them: "four seasons
  // and eleven competitions" is a different fact from any one season's row, and
  // it is the one a reader skims for. The per-season blocks say whether that
  // came from one dominant run or was spread across all of them.
  const t = show.totals || {};
  const careerPairs = [
    ['Best finish', show.best < 99 ? ordinal(show.best) : ''],
    ['Wins', show.wins ? String(show.wins) : ''],
  ];
  if (show.format === 'big-brother') {
    careerPairs.push(['HOH wins', t.hohWins ? String(t.hohWins) : '']);
    careerPairs.push(['Veto wins', t.vetoWins ? String(t.vetoWins) : '']);
    // Named in full because "BB wins" reads as wins of Big Brother.
    careerPairs.push(['Block Buster wins', t.blockBusterWins ? String(t.blockBusterWins) : '']);
    if (t.bestBlockBusterStreak > 1) {
      careerPairs.push(['Longest arena run', `${t.bestBlockBusterStreak} weeks running`]);
    }
    careerPairs.push(['Times nominated', t.timesNominated ? String(t.timesNominated) : '']);
  } else {
    careerPairs.push(['Challenge wins', t.challengeWins ? String(t.challengeWins) : '']);
  }
  careerPairs.push(['Jury votes', t.juryVotes ? String(t.juryVotes) : '']);
  const career = rowsOf(careerPairs);

  // ── one block per season, newest first ──
  const seasons = show.seasons.slice().sort((a, b) => b.season - a.season);
  const shortOf = s => `${m.short || m.name}${s.season}`;

  const seasonBlock = s => {
    const rec = s.record || {};
    const bb = rec.bb || {};
    const rounds = (s.weekRows || []).length;
    const pairs = [
      ['Status', s.status ? esc(s.status) : ''],
      ['Place', s.placement ? ordinal(s.placement) : ''],
      ['Votes against', rec.votesReceived ? String(rec.votesReceived) : ''],
      ['Votes to win', rec.juryVotes ? String(rec.juryVotes) : ''],
    ];
    // Each show counts its own competitions, and neither one's words fit the
    // other: a camp has no veto and a house has no immunity idol.
    if (show.format === 'big-brother') {
      pairs.push(['HOH wins', bb.hohWins ? String(bb.hohWins) : '']);
      pairs.push(['Veto wins', bb.vetoWins ? String(bb.vetoWins) : '']);
      pairs.push(['Block Buster wins', bb.blockBusterWins ? String(bb.blockBusterWins) : '']);
      pairs.push(['Times nominated', bb.timesNominated ? String(bb.timesNominated) : '']);
    } else {
      pairs.push(['Challenge wins', rec.challengeWins ? String(rec.challengeWins) : '']);
      pairs.push(['Immunity wins', rec.immunityWins ? String(rec.immunityWins) : '']);
      pairs.push(['Idols found', rec.idolsFound ? String(rec.idolsFound) : '']);
      pairs.push(['Team', s.tribe ? esc(s.tribe) : '']);
    }
    pairs.push(['Alliances', (s.alliances || []).map(esc).join(', ')]);
    pairs.push(['Loyalties', (s.loyalties || []).map(esc).join(', ')]);
    pairs.push(['Rivals', (s.rivalries || []).map(esc).join(', ')]);
    // What a real infobox calls Days. Counted in rounds, because rounds are
    // what this simulator measures — a day count would be invented.
    pairs.push([show.format === 'big-brother' ? 'Weeks' : 'Episodes', rounds ? String(rounds) : '']);
    return rowsOf(pairs);
  };

  const tabs = seasons.length > 1 ? `
    <div class="wk-ib-tabs" role="tablist">
      ${seasons.map((s, i) => `<button type="button" class="wk-ib-tab${i === 0 ? ' is-on' : ''}"
        role="tab" data-ibx-tab="${s.season}" aria-selected="${i === 0}">${esc(shortOf(s))}</button>`).join('')}
    </div>` : '';

  return `
  <aside class="wk-infobox" style="--wk-accent:${m.accent}">
    <div class="wk-ib-title">${esc(dossier.name)}</div>
    ${tabs}
    <img class="wk-ib-portrait" src="${root}/assets/avatars/${esc(dossier.id)}.png" alt=""
         onerror="this.style.display='none'">
    ${profile ? `<div class="wk-ib-head">${m.icon} ${esc(m.short || m.name)} Profile</div>
      <table class="wk-ib-table">${profile}</table>` : ''}
    ${career ? `<div class="wk-ib-head">Career</div>
      <table class="wk-ib-table">${career}</table>` : ''}
    ${seasons.map((s, i) => `
      <div class="wk-ib-season${i === 0 ? ' is-on' : ''}" data-ibx-panel="${s.season}">
        <div class="wk-ib-head">${s.title ? esc(s.title) : `${esc(m.name)} ${s.season}`}</div>
        <table class="wk-ib-table">${seasonBlock(s)}</table>
      </div>`).join('')}
  </aside>`;
}

/**
 * The lead: who they are, and what they did, in the two paragraphs a fandom
 * article opens with.
 *
 * The first version was one sentence assembled from counters — "was a
 * contestant on Total Drama, Season 14, winning once" — which is true, reads
 * like a database row, and is nothing like what those pages actually say.
 *
 * The reference shape is two paragraphs doing two different jobs:
 *
 *   1. THE RECORD. Which seasons, in order, and how each one ended. Every
 *      season named and linked, so a returnee's page states their whole career
 *      before it says anything about one game.
 *   2. THE GAME. What they actually did — competitions won, who they were with,
 *      how it ended. Written from the episodes by the wiki fill when it has run
 *      (`story`), and otherwise measured from the record, which is flatter but
 *      never wrong.
 */
function lead(dossier, show, root) {
  const m = meta(show.format);
  const seasons = show.seasons.slice().sort((a, b) => a.season - b.season);
  const link = s => `<a href="${root}/season_ref.html?season=${
    show.format === 'big-brother' ? `bb-${s.season}` : s.season}"><em>${
    esc(s.title || `${m.name} ${s.season}`)}</em></a>`;

  // ── 1. the record ──
  //
  // Written as one sentence per career length rather than one template with
  // clauses bolted on. The template version produced "was the runner-up on
  // Total Drama, who returned for Total Drama 2, finishing 2nd, and later won
  // All-Stars, and later won Heroes VS Villains VS Civilians" — every fact
  // correct and the same three words three times.
  const outcome = s => {
    if (s.placement === 1) return `the winner of ${link(s)}`;
    if (s.placement === 2) return `the runner-up on ${link(s)}`;
    if (s.placement) return `${ordinal(s.placement)} on ${link(s)}`;
    return `a contestant on ${link(s)}`;
  };
  /** "a, b, and c" — with the serial comma the reference pages use. */
  const joinList = xs => {
    if (xs.length <= 1) return xs[0] || '';
    if (xs.length === 2) return `${xs[0]} and ${xs[1]}`;
    return `${xs.slice(0, -1).join(', ')}, and ${xs[xs.length - 1]}`;
  };

  const who = `<strong>${esc(dossier.name)}</strong>`;
  let career;
  if (seasons.length === 1) {
    career = `${who} was ${outcome(seasons[0])}.`;
  } else if (seasons.length === 2) {
    const [a, b] = seasons;
    career = b.placement === 1
      ? `${who} was ${outcome(a)}, and later won ${link(b)}.`
      : `${who} was ${outcome(a)}, and returned for ${link(b)}, finishing ${ordinal(b.placement)}.`;
  } else {
    // Three or more: a count, then the seasons in order. A reader wants the
    // shape of the career before the itinerary, and it stops the sentence
    // turning into a list of identical clauses.
    const wins = seasons.filter(x => x.placement === 1).length;
    const opener = wins
      ? `${who} played ${seasons.length} seasons of ${esc(m.name)}, winning ${
          wins === 1 ? 'once' : `${wins} of them`}`
      : `${who} played ${seasons.length} seasons of ${esc(m.name)}`;
    career = `${opener}: ${joinList(seasons.map(outcome))}.`;
  }

  // ── 2. the game ──
  //
  // The most recent season with prose, because that is the one a reader
  // arriving today is most likely here for; the others have their own sections
  // further down.
  const told = seasons.slice().reverse().find(s => s.story);
  let game = '';
  if (told) {
    game = esc(told.story);
  } else {
    // Measured. Never as good as the written one, and never absent.
    const s = seasons[seasons.length - 1];
    const rec = s.record || {};
    const bb = rec.bb || {};
    const did = [];
    const comps = show.format === 'big-brother'
      ? (bb.hohWins || 0) + (bb.vetoWins || 0) + (bb.blockBusterWins || 0)
      : (rec.challengeWins || 0);
    if (comps) did.push(`won ${comps} competition${comps === 1 ? '' : 's'}`);
    if ((s.alliances || []).length) {
      did.push(`played with ${s.alliances.slice(0, 2).map(esc).join(' and ')}`);
    }
    if (rec.votesReceived) {
      did.push(`took ${rec.votesReceived} vote${rec.votesReceived === 1 ? '' : 's'} against them`);
    }
    if (did.length) {
      game = `On ${s.title ? esc(s.title) : `${esc(m.name)} ${s.season}`}, ${esc(dossier.name)} ${
        did.join(', ')}, finishing ${ordinal(s.placement)}.`;
    }
  }

  return `<p class="wk-lead">${career}</p>${game ? `<p class="wk-lead-game">${game}</p>` : ''}`;
}

/**
 * Make the infobox's season tabs work.
 *
 * Called by the page after the article lands, beside `hydrateGalleries`. The
 * same reason that one exists: a `<script>` inside injected innerHTML never
 * runs, so behaviour is attached from outside or not at all.
 */
export function hydrateInfobox(host) {
  const box = host?.querySelector('.wk-infobox');
  if (!box) return;
  const tabs = [...box.querySelectorAll('[data-ibx-tab]')];
  if (!tabs.length) return;                      // one season needs no tabs
  const panels = [...box.querySelectorAll('[data-ibx-panel]')];
  for (const tab of tabs) {
    tab.onclick = () => {
      const want = tab.getAttribute('data-ibx-tab');
      for (const t of tabs) {
        const on = t === tab;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', String(on));
      }
      for (const p of panels) {
        p.classList.toggle('is-on', p.getAttribute('data-ibx-panel') === want);
      }
    };
  }
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
    // A camp has no block: its round says who they wrote down and who wrote
    // them down, which is the whole of a Total Drama round on the record.
    const isCamp = sn.weekRows.some(w => w.votedFor !== undefined) && !sn.weekRows.some(w => w.hoh || w.onBlock || w.veto);
    const roundWord = isCamp ? 'Episode' : 'Week';
    const cell = w => {
      if (w.hoh) return ['HOH', 'wk-c-hoh'];
      if (w.evicted) return [isCamp ? 'Voted out' : 'Evicted', 'wk-c-out'];
      if (w.arenaWon) return ['Block Buster', 'wk-c-arena'];
      if (w.veto) return ['Veto', 'wk-c-veto'];
      if (w.onBlock) return ['Nominated', 'wk-c-nom'];
      if (w.nominated) return ['Nominated', 'wk-c-nom'];
      return ['', ''];
    };
    const rows = sn.weekRows;
    const title = show.seasons.length > 1
      ? `${roundWord} by ${roundWord.toLowerCase()} — ${sn.title ? esc(sn.title) : `Season ${sn.season}`}`
      : `${roundWord} by ${roundWord.toLowerCase()}`;
    section(`weeks${sn.season}`, title, `
      <div class="wk-scroll">
        <table class="wk-table wk-weeks">
          <thead><tr><th>${roundWord}</th>${rows.map(w => `<th>${w.week}</th>`).join('')}</tr></thead>
          <tbody>
            ${
              // A camp's record holds no power to mark, so this row says one
              // thing: the round it ended. For a winner it says nothing at all,
              // and nineteen blank cells read as a broken table rather than as
              // an unbroken run — so the row is dropped instead of drawn empty.
              (isCamp && !rows.some(w => cell(w)[0])) ? '' : `
            <tr><th>${esc(dossier.name)}</th>${rows.map(w => {
              const [label, cls] = cell(w);
              return `<td class="${cls}">${label}</td>`;
            }).join('')}</tr>`}
            ${isCamp ? `<tr class="wk-weeks-sub"><th>Voted for</th>${rows.map(w =>
              `<td>${esc(w.votedFor || '')}</td>`).join('')}</tr>` : ''}
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
        if (isCamp) {
          const total = rows.reduce((n, w) => n + (w.votesAgainst || 0), 0);
          bits.push(`${rows.length} ${rows.length === 1 ? 'round' : 'rounds'} played`);
          bits.push(total ? `${total} vote${total === 1 ? '' : 's'} cast against them` : 'never had a vote cast against them');
        }
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
      ${lead(dossier, show, root)}
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
/* A note beside a heading is an aside, not part of the title — set at label
   size and weight so "Contestants" reads as the heading and "20 · in the
   order they left" reads as the caption it is. */
.wk-section h2 .wk-count{
  font-size:11.5px; font-weight:600; letter-spacing:.06em; text-transform:uppercase;
  opacity:.55; margin-left:8px; vertical-align:middle;
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
/* Season tabs, sitting under the name plate the way the reference wikis do:
   one portrait, and the stat block below it changes. */
.wk-ib-tabs{ display:flex; border-bottom:1px solid var(--stroke); background:var(--panel); }
.wk-ib-tab{
  flex:1; padding:7px 4px; font:inherit; font-size:11.5px; font-weight:800;
  letter-spacing:.05em; text-transform:uppercase; cursor:pointer;
  background:transparent; color:inherit; opacity:.5; border:0;
  border-bottom:2px solid transparent;
}
.wk-ib-tab:hover{ opacity:.8; }
.wk-ib-tab.is-on{ opacity:1; border-bottom-color:var(--wk-accent); }
.wk-ib-tab:focus-visible{ outline:2px solid var(--wk-accent); outline-offset:-2px; }
/* A section heading inside the box: "Profile", then the season's own title. */
.wk-ib-head{
  padding:6px 12px; text-align:center; font-size:11.5px; font-weight:800;
  letter-spacing:.05em; text-transform:uppercase; opacity:.8;
  background:color-mix(in srgb, var(--wk-accent) 16%, transparent);
  border-top:1px solid var(--stroke); border-bottom:1px solid var(--stroke);
}
/* Only the selected season's block is shown; the rest stay in the DOM so the
   tabs are a class toggle rather than a rebuild. */
.wk-ib-season{ display:none; }
.wk-ib-season.is-on{ display:block; }
/* The lead's second paragraph — the game, as opposed to the record. */
.wk-lead-game{ margin:0 0 14px; font-size:14.5px; line-height:1.7; opacity:.9; }
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
