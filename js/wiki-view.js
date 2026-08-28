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

import { parseInterview } from './casting-interview.js';
import { airLabel, ageAt, airKey } from './franchise-calendar.js';

import { SHOWS, DEFAULT_FORMAT, seasonId, showName, showShort, showIcon, showAccent, showWords, exitVerbs }
  from './shows.js';

// `short` is the tab label — "TD14", "BB1". These came out of a copy of the
// show list kept here; they now come from js/shows.js, so a show is named,
// abbreviated and coloured the same wherever it appears.
//
// The unregistered case still draws something rather than nothing, because a
// blank tab is unclickable — but it is deliberately generic, not the default
// show's clapperboard.
const meta = f => ({
  name: showName(f),
  short: showShort(f) || String(f).slice(0, 2).toUpperCase(),
  icon: showIcon(f) || '📺',
  accent: showAccent(f),
});

const esc = s => String(s ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const ordinal = n => {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  const s = ['th', 'st', 'nd', 'rd'][(v % 100 - v % 10 !== 10) * 1 && v % 10 < 4 ? v % 10 : 0];
  return `${v}${s || 'th'}`;
};

// Escapes anything a title or a name can contain — an apostrophe, a colon,
// a hyphen — without a character class of its own to get wrong.
const rxEsc = t => String(t).replace(/[^A-Za-z0-9 ]/g, c => String.fromCharCode(92) + c);

/**
 * THE THING THAT MAKES IT READ LIKE A WIKI: everything is a link.
 *
 * A fandom article does not say "Misha voted with Jules" in flat text. Every
 * season it names goes to that season's page and every castmate it names goes
 * to theirs, in the prose as well as in the tables — that is most of the
 * difference between an encyclopedia entry and a report, and this article had
 * the links only ever inside its tables. The lead linked its seasons because
 * the lead built them by hand; the Summary, the key moments, the quotes, the
 * trivia and the life log were plain strings.
 *
 * So one linkifier, applied to every piece of prose on the page. It works on
 * RAW text and escapes as it goes — escaping first and matching afterwards
 * would need the pattern to know what `&amp;` used to be.
 *
 * Boundaries are alphanumeric only, deliberately: "Jules" inside "Jules's" is
 * a mention and should link, "Jane" inside "Janet" is not and must not.
 *
 * Every occurrence, not just the first. Real articles link the first mention
 * per section and this page is read in pieces — a reader who lands on Trivia
 * should not have to scroll up to find the link.
 */
function _linker(dossier, root) {
  const targets = new Map();          // matched text -> href

  // ── the seasons ──
  const seasonHref = id => `${root}/season_ref.html?season=${encodeURIComponent(id)}`;
  const addSeason = (title, id) => {
    if (!title || !id) return;
    targets.set(String(title), seasonHref(id));
    // "Big Brother 1: The Room Decided" is written in half the prose as "Big
    // Brother 1". Both are the same season and both should go there.
    const head = String(title).split(/\s*[:—–]\s*/)[0];
    if (head && head !== title && head.length > 4 && !targets.has(head)) {
      targets.set(head, seasonHref(id));
    }
  };
  for (const l of dossier.seasonLinks || []) addSeason(l.title, l.id);
  for (const c of dossier.career || []) {
    for (const x of c.seasons || []) {
      const id = x.seasonId || (c.format === 'big-brother' ? `bb-${x.season}` : x.season);
      addSeason(x.title, id);
      addSeason(`${meta(c.format).name} ${x.season}`, id);
    }
  }

  // ── the people ──
  const slugs = new Map();
  const addPerson = (name, slug) => {
    if (!name || !slug || name === dossier.name) return;
    if (!slugs.has(name)) slugs.set(name, slug);
  };
  for (const c of dossier.career || []) {
    for (const x of c.seasons || []) for (const p of x.cast || []) addPerson(p.name, p.slug);
  }
  for (const p of dossier.people || []) addPerson(p.name, p.slug);
  const playerHref = slug => `${root}/player.html?player=${encodeURIComponent(slug)}`;
  for (const [name, slug] of slugs) {
    // One-word names only get linked when they are a whole word; the boundary
    // test below is what enforces that. A name shorter than three letters is
    // left alone — "Al" would light up half the prose on the page.
    if (name.length >= 3) targets.set(name, playerHref(slug));
  }

  // Longest first, so "Big Brother 1: The Room Decided" wins over "Big
  // Brother 1" and "Jane Doe" over "Jane".
  const keys = [...targets.keys()].sort((a, b) => b.length - a.length);
  const rx = keys.length ? new RegExp(keys.map(rxEsc).join('|'), 'g') : null;
  const isWord = ch => ch && /[A-Za-z0-9]/.test(ch);
  // ── A NAME INSIDE A PLACE NAME IS NOT A PERSON ─────────────────────
  //
  // "San Diego" is a city and Diego is a houseguest, and the boundary test
  // cannot tell them apart: the character before "Diego" is a space either way.
  // So a bio that said somebody met their partner in a San Diego bar linked the
  // bar to a cast member's page.
  //
  // The fix is the word BEFORE the match. These prefixes only ever start a place
  // name, so a capitalised name following one is part of it — "San Diego",
  // "Santa Rosa", "New Jersey", "Mount Sierra", "Lake Georgia". Nothing else is
  // blocked: "and Diego", "with Diego", "Diego said" all still link.
  const PLACE_PREFIX = /(?:^|[\s(\["'“])(?:San|Santa|Sao|São|Los|Las|New|Fort|Ft\.|Saint|St\.|Ste\.|Port|Lake|Mount|Mt\.|Rio|Cape|El|La|Le|North|South|East|West|Upper|Lower|Grand|Old|Nova|Villa)\s+$/;
  const inPlaceName = (str, i) => PLACE_PREFIX.test(str.slice(Math.max(0, i - 14), i));

  const text = raw => {
    const str = String(raw ?? '');
    if (!str || !rx) return esc(str);
    let out = '', last = 0, m;
    rx.lastIndex = 0;
    while ((m = rx.exec(str))) {
      const i = m.index;
      const word = m[0];
      if (isWord(str[i - 1]) || isWord(str[i + word.length]) || inPlaceName(str, i)) {
        rx.lastIndex = i + 1;
        continue;
      }
      out += esc(str.slice(last, i))
        + `<a class="wk-link" href="${targets.get(word)}">${esc(word)}</a>`;
      last = i + word.length;
      rx.lastIndex = last;
    }
    return out + esc(str.slice(last));
  };

  const slugOfName = name => slugs.get(name) || slugOf(name);

  /** A face. 152 of them exist as files and the article drew none. */
  const avatar = (name, cls = '') => (name
    ? `<img class="wk-av ${cls}" src="${root}/assets/avatars/${esc(slugOfName(name))}.png"
         alt="" loading="lazy" onerror="this.classList.add('is-off')">`
    : '');

  /** A name, as a face and a link — the chip the tables and lists use. */
  const person = (name, { face = true } = {}) => {
    if (!name) return '';
    const inner = `${face ? avatar(name) : ''}<span>${esc(name)}</span>`;
    return slugs.has(name)
      ? `<a class="wk-person" href="${playerHref(slugOfName(name))}">${inner}</a>`
      : `<span class="wk-person">${inner}</span>`;
  };

  /** A season, always as a link when the page knows where it lives. */
  const season = (x, fmt) => {
    const label = x.title || `${meta(fmt || x.format).name} ${x.season}`;
    const id = x.seasonId || (fmt === 'big-brother' ? `bb-${x.season}` : x.season);
    return `<a href="${seasonHref(id)}">${esc(label)}</a>`;
  };

  return { text, person, avatar, season, slugOfName, knows: name => slugs.has(name) };
}

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
function infobox(dossier, show, root, L) {
  const m = meta(show.format);
  const bio = dossier.bio || {};

  const rowsOf = pairs => pairs
    .filter(([, v]) => v !== '' && v !== null && v !== undefined)
    .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${v}</td></tr>`).join('');

  // ── the person ──
  //
  // BORN / HOMETOWN / OCCUPATION LIVE HERE, UNDER THE PORTRAIT.
  //
  // They were briefly a definition list at the top of the Biography section,
  // which put a labelled fact block in the body and left the panel beside it
  // holding four rows — the reference pages do the opposite. On those, the
  // panel under the picture IS the fact sheet (Born, Hometown, Occupation,
  // Label) and the body is prose. Facts belong where a reader skims for them.
  const born = bio.birthdate
    ? `${new Date(`${bio.birthdate}T00:00:00Z`).toLocaleDateString('en-US',
      { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}${
      bio.age != null ? ` (age ${bio.age})` : ''}`
    : '';
  const profile = rowsOf([
    ['Born', born],
    // Only when there is no date to carry it, so the age is never stated twice.
    ['Age', !born && bio.age ? String(bio.age) : ''],
    ['Hometown', bio.hometown],
    ['Occupation', bio.occupation],
    ['Gender', bio.gender === 'f' ? 'Female' : bio.gender === 'm' ? 'Male' : bio.gender ? 'Non-binary' : ''],
    ['Nationality', [bio.ethnicity, bio.nationality].filter(Boolean).join(' ')],
    ['Label', bio.archetype],
    ['Also', bio.descriptor],
    // Blank rather than "0 (Total Drama)" for somebody who has not finished
    // one; rowsOf drops an empty value, so the row simply is not there.
    ['Seasons', show.count ? `${show.count} (${m.name})` : ''],
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
    // NOT "the camp's rows". The rows this SHOW declares — the else branch of
    // a two-show ternary is a particular show, and every third show got the
    // camp's numbers under the camp's names.
    for (const [label, v] of _statRows(show.format, 'career', t)) {
      careerPairs.push([label, v ? String(v) : '']);
    }
  }
  // A jury votes only where there is one. A castle's last table is a decision
  // by the people still sitting at it.
  if (SHOWS[show.format]?.hasJury) {
    careerPairs.push(['Jury votes', t.juryVotes ? String(t.juryVotes) : '']);
  }
  const career = rowsOf(careerPairs);

  // ── one block per season, newest first ──
  const seasons = show.seasons.slice().sort((a, b) => b.season - a.season);
  const shortOf = s => `${m.short || m.name}${s.season}`;

  const seasonBlock = s => {
    const rec = s.record || {};
    const bb = rec.bb || {};
    const rounds = (s.weekRows || []).length;
    const pairs = [
      // WHEN, and HOW OLD THEY WERE THEN.
      //
      // A real article says how old somebody was on the season being read, not
      // how old they are today — and until the franchise had a calendar this
      // page could only ever say the latter. Both are blank for a season nobody
      // has placed yet rather than guessed at.
      ['Aired', airLabel(s.air || {})],
      ['Age then', (() => {
        const a = ageAt(bio.birthdate, s.air || {});
        return a == null ? '' : String(a);
      })()],
      ['Status', s.status ? esc(s.status) : ''],
      ['Place', s.placement ? ordinal(s.placement) : ''],
      ['Votes against', rec.votesReceived ? String(rec.votesReceived) : ''],
      ...(SHOWS[show.format]?.hasJury
        ? [['Votes to win', rec.juryVotes ? String(rec.juryVotes) : '']] : []),
    ];
    // Each show counts its own competitions, and neither one's words fit the
    // other: a camp has no veto and a house has no immunity idol.
    if (show.format === 'big-brother') {
      pairs.push(['HOH wins', bb.hohWins ? String(bb.hohWins) : '']);
      pairs.push(['Veto wins', bb.vetoWins ? String(bb.vetoWins) : '']);
      pairs.push(['Block Buster wins', bb.blockBusterWins ? String(bb.blockBusterWins) : '']);
      pairs.push(['Times nominated', bb.timesNominated ? String(bb.timesNominated) : '']);
    } else {
      for (const [label, v] of _statRows(show.format, 'season', rec)) {
        pairs.push([label, v ? String(v) : '']);
      }
      pairs.push(['Team', s.tribe ? esc(s.tribe) : '']);
    }
    // The three rows that are nothing but other people's names, and the three
    // that printed them as plain text on a page whose whole business is links.
    const faces = list => (list || []).length
      ? `<span class="wk-ib-people">${list.map(n => L.person(n)).join('')}</span>` : '';
    pairs.push(['Alliances', (s.alliances || []).map(esc).join(', ')]);
    pairs.push(['Loyalties', faces(s.loyalties)]);
    pairs.push(['Rivals', faces(s.rivalries)]);
    pairs.push(['Showmance', s.showmance ? L.person(s.showmance) : '']);
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
    ${profile ? `<div class="wk-ib-head">${show.count
      ? `${m.icon} ${esc(m.short || m.name)} Profile`
      // Same reason the lead names no show: with no season on record, `format`
      // is the page's default and "TD Profile" is a guess printed as a fact.
      : 'Profile'}</div>
      <table class="wk-ib-table">${profile}</table>` : ''}
    ${career ? `<div class="wk-ib-head">Career</div>
      <table class="wk-ib-table">${career}</table>` : ''}
    ${seasons.map((s, i) => `
      <div class="wk-ib-season${i === 0 ? ' is-on' : ''}" data-ibx-panel="${s.season}">
        <div class="wk-ib-head">${L.season(s, show.format)}</div>
        <table class="wk-ib-table">${seasonBlock(s)}</table>
      </div>`).join('')}
  </aside>`;
}

/**
 * The final vote, as two numbers.
 *
 * The winner block writes it as prose — "Wayne 4 — Priya 3 — Zee 0" for the
 * house, "6-3" for a camp — because it is written for a reader. The lead needs
 * the margin to say "a 4 to 3 decision", and whether it was close enough to
 * call it one.
 */
function _finalTally(vote, winnerName) {
  const raw = String(vote || '');
  if (!raw.trim()) return null;
  const nums = (raw.match(/\d+/g) || []).map(Number);
  if (nums.length < 2) return null;
  const sorted = [...nums].sort((a, b) => b - a);
  const [a, b] = sorted;
  if (!a && !b) return null;
  return { a, b, close: a - b <= 1 };
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
function lead(dossier, show, root, L) {
  const m = meta(show.format);
  const seasons = show.seasons.slice().sort((a, b) => a.season - b.season);
  // A bare integer is Total Drama and stays one, because every bookmark on the
  // site is `?season=7`. Every other show is prefixed — and it was the `=== 'big-
  // brother'` test here that would have linked a third show's season 5 straight
  // at Total Drama 5, an existing page, so nothing would have looked wrong.
  const ref = s => show.format === DEFAULT_FORMAT
    ? String(s.season) : seasonId(show.format, s.season);
  const link = s => `<a href="${root}/season_ref.html?season=${ref(s)}"><em>${
    esc(s.title || `${m.name} ${s.season}`)}</em></a>`;

  // ── 1. the record ──
  //
  // Written as one sentence per career length rather than one template with
  // clauses bolted on. The template version produced "was the runner-up on
  // Total Drama, who returned for Total Drama 2, finishing 2nd, and later won
  // All-Stars, and later won Heroes VS Villains VS Civilians" — every fact
  // correct and the same three words three times.
  const outcome = s => {
    // "THE winner" IS A CLAIM ABOUT EVERYBODY ELSE. Season 8 crowned two, and
    // The Traitors splits the pot between as many as are left standing — so a
    // page saying "the winner of" over a shared win is writing one champion
    // out of their own season. `coWinners` counts the record, and the article
    // says which kind of win it was rather than picking.
    if (s.placement === 1) {
      // UNKNOWN IS NOT ONE. `coWinners` is null until the season document is
      // loaded, and the page paints once before that on purpose — so the
      // first paint used to call a co-winner "the winner". "A champion of" is
      // true of a shared win and of a sole one, and needs no count; it drops
      // into the lead's "X was ..." exactly where the others do.
      if (s.coWinners == null) return `a champion of ${link(s)}`;
      return `${s.coWinners > 1 ? 'a co-winner of' : 'the winner of'} ${link(s)}`;
    }
    if (s.placement === 2) return `the runner-up on ${link(s)}`;
    if (s.placement) return `${ordinal(s.placement)} on ${link(s)}`;
    return `a ${showWords(show.format).player} on ${link(s)}`;
  };
  /** "a, b, and c" — with the serial comma the reference pages use. */
  const joinList = xs => {
    if (xs.length <= 1) return xs[0] || '';
    if (xs.length === 2) return `${xs[0]} and ${xs[1]}`;
    return `${xs.slice(0, -1).join(', ')}, and ${xs[xs.length - 1]}`;
  };

  const who = `<strong>${esc(dossier.name)}</strong>`;
  let career;
  if (!seasons.length) {
    // ── NO FINISHED SEASON YET ──
    //
    // Written from the bio instead of the record, because the bio is the only
    // thing there is. The counter-driven sentence below produces "played 0
    // seasons of Total Drama: ." for this case, which is how it was found.
    //
    // A real entry opens by saying what somebody IS before what they did, so
    // the occupation and hometown carry the sentence and the missing record is
    // stated plainly rather than dressed up.
    // NOTHING HERE NAMES THE SHOW.
    //
    // It cannot know it. `format` for somebody with no career is whatever the
    // page defaulted to, and the first draft of this sentence read "Natasha is
    // a law student from California, and a contestant on Total Drama" over a
    // backstory that calls her a HOUSEGUEST and says she entered the HOUSE.
    // That is the bug class this project keeps hitting, printed by a sentence
    // written to fix a different one.
    //
    // The bio is show-agnostic and true, so the lead is built from the bio and
    // stops there.
    const b = dossier.bio || {};
    const from = [b.occupation && `a ${esc(b.occupation).toLowerCase()}`,
      b.hometown && `from ${esc(b.hometown)}`].filter(Boolean).join(' ');
    career = from ? `${who} is ${from}.` : `${who} is a member of the cast pool.`;
    career += ' No completed season is on record yet, so this page fills itself'
      + ' in the moment one exports.';
    return `<p class="wk-lead">${career}</p>`;
  }
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
  // PROSE, NOT A LIST OF COUNTERS.
  //
  // The first version printed the season's narrative, which the Summary
  // section also prints, so the article said it twice. The second version
  // fixed the duplication and replaced it with "won 3 challenges, played with
  // The Anchor, The Power Couple, and The Double Edge, and took 10 votes
  // against them" — accurate, and a comma-list rather than a paragraph.
  //
  // The reference reads:
  //
  //   "During his time on the show, Jesse proved to be a formidable and
  //    versatile competitor in Mad House 7, winning six competitions and
  //    forming a dominant alliance with Kasey Tate, Leo Li, and Lydia
  //    Prescott, his showmance. Despite being consistently perceived as a
  //    major threat, he strategically navigated the game … In a close final
  //    vote, he emerged victorious with a 4 to 3 decision."
  //
  // Four sentences that each do one job: what kind of competitor, what they
  // had to survive, how far they got, and how it ended. Every clause below is
  // driven by a number the record actually holds — the adjectives change with
  // the counts rather than decorating them — so nothing here is a claim the
  // season cannot support.
  const notable = seasons.find(s => s.placement === 1)
    || seasons.slice().sort((a, b) => (a.placement || 99) - (b.placement || 99))[0]
    || seasons[seasons.length - 1];

  // WRITTEN IF THE FILL HAS RUN.
  //
  // The measured paragraph below is assembled from counters, and it reads like
  // it: correct, and never quite prose. The wiki fill writes this one from the
  // episodes and the record together, in the register of the reference pages,
  // and it wins whenever it exists.
  const written = (seasons.find(s => s.placement === 1) || seasons[seasons.length - 1] || {}).lead
    || seasons.slice().reverse().find(s => s.lead)?.lead || '';

  let game = '';
  if (written) {
    game = L.text(written);
  } else if (notable) {
    const rec = notable.record || {};
    const bb = rec.bb || {};
    const g = (dossier.bio || {}).gender;
    // They/them unless the roster says otherwise: a wrong guess misgenders a
    // character on their own page, and the neutral never does.
    const P = g === 'f' ? { sub: 'she', obj: 'her', pos: 'her' }
      : g === 'm' ? { sub: 'he', obj: 'him', pos: 'his' }
      : { sub: 'they', obj: 'them', pos: 'their' };
    const Cap = w => w.charAt(0).toUpperCase() + w.slice(1);
    const was = P.sub === 'they' ? 'were' : 'was';
    const has = P.sub === 'they' ? 'have' : 'has';
    const name = esc(dossier.name);
    const first = name.split(/\s+/)[0];

    const comps = show.format === 'big-brother'
      ? (bb.hohWins || 0) + (bb.vetoWins || 0) + (bb.blockBusterWins || 0)
      : (rec.challengeWins || 0) + (rec.tr?.missionsWon || 0);
    /* THE SHOW'S OWN WORD, not the other-of-two. A two-way ternary had every
       Traitors lead reading "played The Traitors 1 without winning a
       challenge" about somebody who won four missions. `showWords` is already
       imported by this file and used for every other word on the page. */
    const compWord = showWords(show.format).comp;
    // Spelled out to nine, the way prose does it and a scoreboard does not.
    const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const num = n => (n < WORDS.length ? WORDS[n] : String(n));

    const sentences = [];

    // 1. WHAT KIND OF COMPETITOR. The adjective is the count's, not mine.
    const calibre = comps >= 6 ? 'a formidable and versatile competitor'
      : comps >= 4 ? 'a genuine threat in the competitions'
      : comps >= 2 ? 'a capable competitor'
      : comps === 1 ? 'a competitor who picked their moment'
      : '';
    // NAMES ARE LINKS HERE TOO. This paragraph names an alliance's members and
    // a showmance and the person they beat in the final, and it built all of
    // them with esc() — the one paragraph on the page most likely to be read.
    const mates = (notable.loyalties || []).slice(0, 3).map(x => L.person(x, { face: false }));
    const named = (notable.alliances || []).slice(0, 3).map(x => `<em>${esc(x)}</em>`);
    const allianceBit = named.length === 1
      ? `forming a dominant alliance in ${named[0]}${mates.length ? ` with ${joinList(mates)}` : ''}`
      : named.length
        ? `playing through ${joinList(named)}${mates.length ? ` alongside ${joinList(mates)}` : ''}`
        : (mates.length ? `building ${P.pos} game around ${joinList(mates)}` : '');
    const showmanceBit = notable.showmance
      ? `${(notable.loyalties || []).includes(notable.showmance) ? ''
        : `, with ${L.person(notable.showmance, { face: false })} as ${P.pos} showmance`}`
      : '';

    const opener = [];
    if (calibre) {
      opener.push(`${first} proved to be ${calibre} in ${link(notable)}, winning ${
        num(comps)} ${compWord}${comps === 1 ? '' : 's'}`);
    } else {
      opener.push(`${first} played ${link(notable)} without winning a ${compWord}`);
    }
    if (allianceBit) opener.push(allianceBit);
    sentences.push(`During ${P.pos} time on the show, ${opener.join(' and ')}${showmanceBit}.`);

    // 2. WHAT THEY HAD TO SURVIVE. A season nobody voted for is a different
    //    season from one somebody survived, and the record knows which it was.
    const against = rec.votesReceived || 0;
    const noms = bb.timesNominated || 0;
    const survived = [];
    if (noms >= 3) survived.push(`nominated ${num(noms)} times`);
    if (bb.timesSaved) survived.push(`saved by the veto ${bb.timesSaved === 1 ? 'once' : `${num(bb.timesSaved)} times`}`);
    if (bb.blockBusterWins) survived.push(`winning ${P.pos} way off the block ${bb.blockBusterWins === 1 ? 'once' : `${num(bb.blockBusterWins)} times`}`);
    if (rec.idolsFound) survived.push(`finding ${rec.idolsFound === 1 ? 'an idol' : `${num(rec.idolsFound)} idols`}`);
    if (survived.length) {
      sentences.push(`${Cap(P.sub)} ${was} ${joinList(survived)}${
        against ? `, taking ${num(against)} vote${against === 1 ? '' : 's'} along the way` : ''}.`);
    } else if (against >= 5) {
      sentences.push(`Read as a threat for most of the season, ${P.sub} still absorbed ${
        num(against)} votes without ever being sent home early.`);
    } else if (against) {
      sentences.push(`Only ${num(against)} vote${against === 1 ? ' was' : 's were'} ever cast against ${P.obj}.`);
    }

    // 3 & 4. HOW IT ENDED. The tally when there is one — "a 4 to 3 decision"
    //    is the sentence those pages are remembered for.
    const tally = _finalTally(notable.finalVote, dossier.name);
    if (notable.placement === 1) {
      const beat = notable.runnerUp
        ? ` over ${L.person(String(notable.runnerUp).split(' & ')[0], { face: false })}` : '';
      sentences.push(tally
        ? `In ${tally.close ? 'a close final vote' : 'the final vote'}, ${P.sub} emerged victorious with a ${
            tally.a} to ${tally.b} decision${beat}.`
        : `${Cap(P.sub)} won the season${beat}.`);
    } else if (notable.placement === 2) {
      sentences.push(`${Cap(P.sub)} reached the end and finished as the runner-up.`);
    } else if (notable.placement) {
      /* ── A STATUS IS NOT ALWAYS A NOUN ─────────────────────────────
         This sentence assumes one: "finished 5th as a juror", "as a
         finalist". A show whose statuses are its exit VERBS -- Banished,
         Murdered, which is exactly what makes them right on that show --
         produced "He finished 5th as a murdered." The registry knows which
         words are verbs, so the sentence is built to fit the word instead of
         the word being forced into the sentence. */
      const st = String(notable.status || '').trim();
      const isVerb = exitVerbs(show.format).some(v => v.toLowerCase() === st.toLowerCase());
      sentences.push(isVerb
        ? `${Cap(P.sub)} ${was} ${esc(st.toLowerCase())} and finished ${ordinal(notable.placement)}.`
        : `${Cap(P.sub)} finished ${ordinal(notable.placement)}${
          st ? ` as ${/^[aeiou]/i.test(st) ? 'an' : 'a'} ${esc(st.toLowerCase())}` : ''}.`);
    }

    // The rest of a career, so the paragraph is about the person and not only
    // their best season.
    const others = seasons.filter(s => s !== notable);
    if (others.length) {
      const wonOthers = others.filter(s => s.placement === 1);
      sentences.push(wonOthers.length
        ? `${first} went on to win ${joinList(wonOthers.map(link))} as well.`
        : `${first} also played ${joinList(others.map(link))}.`);
    }

    game = sentences.join(' ');
  }

  // ── WHO THEY WERE, IN THE LEAD ─────────────────────────────────────
  //
  // The AI writes a paragraph per season describing how somebody played it.
  // That used to be the Personality section, one heading per season — which is
  // not how the reference pages are built. On those, Personality holds the
  // casting questionnaire and NO prose at all; the character narrative is in
  // the lead, above the contents box, as one paragraph about the person.
  //
  // So it comes here, and Personality becomes the single authored description.
  //
  // The notable season's, because that is the season the paragraph below is
  // about and two paragraphs describing different seasons would disagree. If
  // the notable one has none, the most recent season that does. A returnee with
  // written paragraphs for SEVERAL seasons therefore shows one of them, not all
  // — deliberate, since the lead is a lead and not a chapter.
  const persona = notable?.personality
    || seasons.slice().reverse().find(s => s.personality)?.personality || '';

  return `<p class="wk-lead">${career}</p>`
    + (persona ? `<p class="wk-lead-persona">${L.text(persona)}</p>` : '')
    + (game ? `<p class="wk-lead-game">${game}</p>` : '');
}

/**
 * Make the infobox's season tabs work.
 *
 * Called by the page after the article lands, beside `hydrateGalleries`. The
 * same reason that one exists: a `<script>` inside injected innerHTML never
 * runs, so behaviour is attached from outside or not at all.
 */
/**
 * A number off a record, by the dotted path the registry names it with.
 *
 * `bb.hohWins` and `tr.missionsWon` live in a per-show block; `challengeWins`
 * sits at the top. One reader for all of them, so a show declares WHERE its
 * numbers are instead of a screen knowing.
 */
function _statAt(obj, path) {
  return String(path).split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}

/** The rows this show's article shows, in the section asked for. */
function _statRows(format, section, source) {
  const spec = SHOWS[format]?.articleStats?.[section]
    || SHOWS[DEFAULT_FORMAT].articleStats[section];
  return spec.map(([path, label]) => [label, _statAt(source, path)]);
}

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
      if (!images.length) { dropSection(host, box); continue; }
      box.innerHTML = images.map(o => `<a class="wk-gitem"
          href="${base}/gallery/${encodeURIComponent(slug)}/${o.file}" target="_blank" rel="noopener">
          <img src="${base}/gallery/${encodeURIComponent(slug)}/${o.file}?v=${o.size}" alt="" loading="lazy">
        </a>`).join('');
    } catch {
      dropSection(host, box);
    }
  }
}

/**
 * Remove a section AND its line in the Contents.
 *
 * The contents box is rendered from the section tree before the pictures are
 * fetched, so a gallery that turns out to be empty used to leave "3 Gallery"
 * in the contents pointing at an anchor that no longer existed — a link that
 * silently does nothing, on a page whose whole job is to be navigable.
 */
function dropSection(host, box) {
  const section = box.closest('section');
  const id = section?.id;
  section?.remove();
  if (id) host?.querySelector(`.wk-contents a[href="#${id}"]`)?.closest('li')?.remove();
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
  // ── A DEBUT CAST MEMBER STILL HAS AN ARTICLE ───────────────────────
  //
  // "Has never played X, so there is nothing to write" is the right answer for
  // a Total Drama veteran's Big Brother page. It is the wrong answer for
  // somebody in their FIRST season: everything authored about them — born,
  // hometown, occupation, backstory, personality — exists and is exactly what
  // an encyclopedia entry opens with. The record is what is missing, not the
  // person.
  //
  // So the bail is kept for a career that skips this show, and lifted for a
  // career that has not started. `debut` is deliberately "no career on ANY
  // show" rather than "none on this one" — a veteran must keep the honest
  // empty page for the show they never played.
  const played = (dossier.career || []).find(c => c.format === format);
  const hasSeasons = !!(played && played.seasons.length);
  const debut = !(dossier.career || []).length;
  const b = dossier.bio || {};
  const authored = !!(dossier.backstory || dossier.personality
    || b.occupation || b.hometown || b.birthdate);
  if (!hasSeasons && !(debut && authored)) {
    return emptyArticle(dossier, format, allShows, root);
  }
  // Every section below reads the show through this object, so a career that
  // has not started is an EMPTY one rather than a missing one. `best: 99` is
  // the same "no finish yet" sentinel the totals use.
  const show = hasSeasons ? played
    : { format, seasons: [], count: 0, wins: 0, best: 99, totals: {} };

  const m = meta(format);
  // Every season and every castmate this article can name, as links and faces.
  // Built once and handed to everything below, including the infobox and the
  // lead, so a name is a link wherever it appears.
  const L = _linker(dossier, root);
  // ── THE SECTION TREE ───────────────────────────────────────────────
  //
  // A fandom article is not a flat list of sections: a season is a heading
  // with the season's own sub-headings under it — Summary, Have/Have-Not
  // History, Voting History, Competition history — and the contents box
  // numbers them 2.1, 2.2, 2.3. Flat, every one of those had to carry the
  // season's name in its own title to stay unambiguous, which is how the
  // article ended up with "Week by week — Total Drama All-Stars" as a
  // top-level heading beside "Competition history".
  //
  // `section` opens a top-level one and returns a handle; `sub` hangs a
  // subsection off it. Both ignore empty content, so a season with nothing
  // recorded contributes no heading at all.
  const tree = [];
  const section = (id, title, html, titleHtml) => {
    if (!html && html !== null) return null;
    const node = { id, title, html: html || '', subs: [], titleHtml: titleHtml || '' };
    tree.push(node);
    return node;
  };
  const sub = (node, id, title, html) => {
    if (!node || !html) return;
    node.subs.push({ id, title, html });
  };

  // ── BIOGRAPHY ──────────────────────────────────────────────────────
  //
  // The section every encyclopedia entry opens with, and the one this article
  // did not have: it began at Personality, so everything authored about who
  // somebody IS — where they are from, what they do, who they were before the
  // door shut — had nowhere to appear no matter how much of it was written.
  //
  // PROSE ONLY. Born / Hometown / Occupation are rows in the infobox under the
  // portrait, where the reference pages keep them and where a reader skims for
  // a fact. This section held both for a while, which left the panel beside it
  // nearly empty and the labelled block in the body doing the panel's job.
  {
    if (dossier.backstory) {
      // Authored prose arrives with paragraph breaks; keep them.
      section('biography', 'Biography', String(dossier.backstory).split(/\n\s*\n/)
        .map(par => `<p>${L.text(par.trim())}</p>`).join(''));
    }
  }

  // ── PERSONALITY ────────────────────────────────────────────────────
  //
  // Per season when the episodes have been read, and the voice profile only
  // as a fallback. Those are different things: a voice profile says how
  // somebody TALKS and exists so the episode writer has a voice to write in;
  // this section is meant to say how they were in the house, which only the
  // screenplay knows.
  //
  // ONE DESCRIPTION OF THE PERSON, NOT ONE PER SEASON.
  //
  // This used to render a heading per season from the AI's per-season
  // paragraphs. The reference pages do not: their Personality section holds the
  // casting questionnaire and no prose, and the character narrative sits in the
  // LEAD, above the contents box, as one paragraph. So the per-season prose
  // moved to lead() and this became what it says on the heading — the
  // description of the person, authored in the Studio, falling back to the
  // voice profile when nobody has written one.
  //
  // Under it, the CASTING INTERVIEW — collapsed, the way the reference pages
  // carry it. On those it IS the Personality section: a shut table headed
  // "<Name> Biography" holding the questionnaire they filled in before playing.
  // Ours keeps the description above it, because that is the thing a reader
  // came for; the tape is what they open when they want the voice.
  //
  // Their box repeats Age / Hometown / Occupation at the top. Ours does not:
  // those are infobox rows two inches to the right, and a hand-edited wiki can
  // afford a duplicate that we would have to keep in sync.
  {
    const rows = parseInterview(dossier.castingInterview);
    const bits = [];
    if (dossier.personality) bits.push(`<p>${L.text(dossier.personality)}</p>`);
    if (rows.length) {
      bits.push(`<details class="wk-iv">
        <summary class="wk-iv-sum">${esc(dossier.name)} Biography</summary>
        <dl class="wk-iv-body">${rows.map(r => `
          <dt>${esc(r.q)}</dt><dd>${L.text(r.a)}</dd>`).join('')}</dl>
      </details>`);
    }
    if (bits.length) section('personality', 'Personality', bits.join(''));
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
        <blockquote>&ldquo;${L.text(typeof q === 'string' ? q : q.text)}&rdquo;</blockquote>
        ${typeof q === 'object' && q.context ? `<cite>${L.text(q.context)}</cite>` : ''}
      </li>`).join('')}</ul>`).join(''));
  }

  // ── ONE SECTION PER SEASON ─────────────────────────────────────────
  //
  // The shape the reference pages use: "The Mad House 7" as a heading, and
  // everything about that season underneath it. A returnee gets one of these
  // per season, so their two games are never interleaved.
  const isHouse = show.format === 'big-brother';
  // `isHouse` still gates the BIG BROTHER-ONLY columns below — have-nots, the
  // HOH/veto totals row — which are features of that game and not vocabulary.
  // Words are a different question, and answering it with the same boolean is
  // what printed "Voted out" over a banishment: everything that was not Big
  // Brother got Total Drama's noun.
  const words = showWords(show.format);
  const roundWord = words.round;
  const _cap = t => String(t || '').replace(/^./, c => c.toUpperCase());
  /* ── ONE WORD PER SHOW IS ONE WORD TOO FEW ─────────────────────────
     `words.exit` is the show's DEFAULT verb -- the vote -- and a season with
     a second door has rounds this is simply not true of. A single `exitWord`
     over every cell reads "Banished" on the night somebody was murdered,
     which is the exact bug this file's own comment three lines up is about.
     The row carries the verb the ROUND recorded (js/wiki.js), and the default
     is what a one-door show falls back to. */
  const exitWord = w => _cap(w?.exitVerb || words.exit);

  for (const s2 of show.seasons) {
    // The reference wiki writes "The Mad House 7" because its season titles are
    // bare numbers. Ours already carry the show's name, so the article prefix
    // produced "The Total Drama All-Stars". The title stands on its own.
    // The heading links to the season, the way every heading on a fandom
    // article that names one does. It was the only place the article printed a
    // season's title and did not.
    const node = section(`s${s2.season}`,
      s2.title || `${m.name} ${s2.season}`, null,
      L.season(s2, show.format));

    // 2.1 Summary — the season's narrative, and the moments that made it.
    const summary = [];
    if (s2.story) summary.push(`<p>${L.text(s2.story)}</p>`);
    if (s2.keyMoments?.length) {
      summary.push(`<ul class="wk-list">${s2.keyMoments.map(x => `<li>${L.text(x)}</li>`).join('')}</ul>`);
    }
    if (!summary.length) {
      summary.push(`<p class="wk-thin">Placed ${ordinal(s2.placement)}${
        s2.status ? ` · ${esc(s2.status)}` : ''}. No narrative has been written for this season yet.</p>`);
    }
    sub(node, `s${s2.season}-summary`, 'Summary', summary.join(''));

    const rows = s2.weekRows || [];

    // 2.2 Have/Have-Not History — the house only, and only when the season
    // recorded it. A season exported before have-nots were carried has none,
    // and an empty grid would read as "never a have-not", which is a claim.
    if (isHouse && rows.some(w => w.haveNot)) {
      sub(node, `s${s2.season}-havenot`, 'Have/Have-Not History', `
        <div class="wk-scroll">
          <table class="wk-table wk-weeks">
            <thead><tr><th>Week</th>${rows.map(w => `<th>${w.week}</th>`).join('')}</tr></thead>
            <tbody><tr><th>${L.avatar(dossier.name)}${esc(dossier.name)}</th>${rows.map(w =>
              `<td class="${w.haveNot ? 'wk-c-out' : ''}">${w.haveNot ? 'Have-Not' : 'Have'}</td>`).join('')}</tr></tbody>
          </table>
        </div>
        <p class="wk-thin">${rows.filter(w => w.haveNot).length} week${
          rows.filter(w => w.haveNot).length === 1 ? '' : 's'} on slop.</p>`);
    }

    // 2.3 Voting History — the grid, and the ballot they cast.
    if (rows.length) {
      // ── THE CELL SAYS WHERE THEY ENDED THE WEEK ────────────────────
      //
      // The first version was a priority list — HOH, evicted, arena, veto,
      // nominated — and one label per cell, which meant every week said only
      // its highest-ranked fact. A houseguest nominated on Sunday who won the
      // veto and took himself off read as a bare "Veto", identical to the
      // houseguest who won it from the sofa and never had anything to fear.
      // The only rescue that showed at all was the Block Buster.
      //
      // So the cell is now the FINAL BLOCK — where they actually were when the
      // house voted — plus the marks that got them there. "Nominated" is
      // reserved for somebody still sitting there at the vote; anybody who came
      // off says how, and a week that was both (HOH one week, block the next)
      // can no longer hide half of itself.
      const cell = w => {
        if (w.evicted) return { label: exitWord(w), cls: 'wk-c-out', marks: [] };
        // Out of the house between two evictions, and the week nobody went
        // home: two states that are not "safe" and were both drawn as blank.
        if (w.notYet) return { label: 'Not in', cls: 'wk-c-away', marks: [] };
        if (w.away) return { label: 'Out', cls: 'wk-c-away', marks: [] };
        if (w.noEviction) return { label: '—', cls: 'wk-c-none', marks: [] };
        const marks = [];
        if (w.hoh) marks.push(['H', 'Head of Household']);
        if (w.veto) marks.push(['V', w.vetoOnSelf ? 'Won the veto and used it on themselves' : 'Won the Power of Veto']);
        if (w.arenaWon) marks.push(['B', 'Won the Block Buster']);
        let label = '', cls = '';
        if (w.onBlock) {
          label = 'Nominated'; cls = 'wk-c-nom';
        } else if (w.vetoOnSelf) {
          label = 'Saved'; cls = 'wk-c-veto';        // won the veto, used it on themselves
        } else if (w.arenaWon) {
          label = 'Won arena'; cls = 'wk-c-arena';
        } else if (w.savedByVeto) {
          label = 'Taken off'; cls = 'wk-c-veto';     // somebody else's veto
        } else if (w.hoh) {
          label = 'HOH'; cls = 'wk-c-hoh';
        } else if (w.veto) {
          label = 'Veto'; cls = 'wk-c-veto';
        } else if (w.nominated) {
          // Nominated, off the block, and not by a veto or the arena — the
          // week was voided, or the record only knows half of it. Said
          // plainly rather than dropped.
          label = 'Nominated'; cls = 'wk-c-nom';
        }
        return { label, cls, marks };
      };
      const drawn = rows.map(cell);
      const marked = drawn.some(c => c.label || c.marks.length);
      const votedAny = rows.some(w => w.votedFor);
      sub(node, `s${s2.season}-votes`, 'Voting History', `
        <div class="wk-scroll">
          <table class="wk-table wk-weeks">
            <thead><tr><th>${roundWord}</th>${rows.map(w => `<th>${w.week}</th>`).join('')}</tr></thead>
            <tbody>
              ${marked ? `<tr><th>${L.avatar(dossier.name)}${esc(dossier.name)}</th>${drawn.map(c =>
                `<td class="${c.cls}">${c.marks.length ? `<span class="wk-marks">${c.marks.map(([ch, tip]) =>
                  `<i class="wk-m wk-m-${ch}" title="${esc(tip)}">${ch}</i>`).join('')}</span>` : ''}${
                  c.label ? `<span class="wk-cell-l">${esc(c.label)}</span>` : ''}</td>`).join('')}</tr>` : ''}
              ${votedAny ? `<tr class="wk-weeks-sub"><th>Voted to ${esc(words.exitAction)}</th>${rows.map(w =>
                // WITH THE FACE. A grid of thirteen names is a grid a reader
                // has to read; a row of faces is one they can scan, which is
                // the whole reason the reference pages carry portraits here.
                `<td>${w.votedFor
                  ? `<span class="wk-ballot">${L.avatar(w.votedFor)}${L.person(w.votedFor, { face: false })}</span>`
                  : ''}</td>`).join('')}</tr>` : ''}
              <tr class="wk-weeks-sub"><th>Votes against</th>${rows.map(w =>
                `<td>${w.votesAgainst || ''}</td>`).join('')}</tr>
            </tbody>
          </table>
        </div>
        <p class="wk-thin">${(() => {
          const bits = [];
          const n = f => rows.filter(f).length;
          if (n(w => w.hoh)) bits.push(`${n(w => w.hoh)}x Head of Household`);
          if (n(w => w.veto)) bits.push(`${n(w => w.veto)}x Power of Veto`);
          if (n(w => w.vetoOnSelf)) bits.push(`saved themselves with it ${n(w => w.vetoOnSelf)}x`);
          if (n(w => w.arenaPlayed)) bits.push(`in the Block Buster ${n(w => w.arenaPlayed)}x, winning ${n(w => w.arenaWon)}`);
          if (n(w => w.nominated)) bits.push(`nominated ${n(w => w.nominated)}x`);
          if (n(w => w.onBlock)) bits.push(`on the block at the vote ${n(w => w.onBlock)}x`);
          const against = rows.reduce((t, w) => t + (w.votesAgainst || 0), 0);
          const played = rows.filter(w => !w.away && !w.notYet && !w.noEviction).length;
          bits.push(`${played} ${played === 1 ? roundWord.toLowerCase() : `${roundWord.toLowerCase()}s`} played`);
          bits.push(against ? `${against} vote${against === 1 ? '' : 's'} cast against them`
            : 'never had a vote cast against them');
          return esc(bits.join(' · '));
        })()}</p>`);
    }

    // 2.4 Competition history — this season's record, on its own.
    const r = s2.record || {};
    const b = r.bb || {};
    const comp = isHouse
      ? [['HOH wins', b.hohWins], ['Veto wins', b.vetoWins],
         ['Block Buster wins', b.blockBusterWins], ['Times nominated', b.timesNominated],
         ['Times on the block', b.timesOnBlock], ['Saved by the veto', b.timesSaved]]
      : _statRows(show.format, 'comps', r);
    const compRows = comp.filter(([, v]) => v);
    if (compRows.length) {
      sub(node, `s${s2.season}-comps`, 'Competition history', `
        <table class="wk-table">
          <tbody>${compRows.map(([k, v]) =>
            `<tr><th>${esc(k)}</th><td>${v}</td></tr>`).join('')}</tbody>
        </table>`);
    }
  }

  // ── THE CAREER TABLES ──────────────────────────────────────────────
  //
  // Only for somebody who played more than once: for a single season they
  // would repeat what the section above just said, row for row.
  if (show.seasons.length > 1) {
    section('appearances', 'Appearances', `
      <table class="wk-table">
        <thead><tr><th>Season</th><th>Aired</th><th>Placement</th><th>Status</th><th>Team</th></tr></thead>
        <tbody>${show.seasons.map(x => `<tr>
          <td><a href="${root}/season_ref.html?season=${esc(x.seasonId || x.season)}">${
            x.title ? esc(x.title) : `Season ${x.season}`}</a></td>
          <td>${esc(airLabel(x.air || {})) || '—'}</td>
          <td>${ordinal(x.placement)}</td>
          <td>${esc(x.status || '—')}</td>
          <td>${esc(x.tribe || '—')}</td>
        </tr>`).join('')}</tbody>
      </table>`);

    const t = show.totals || {};
    const head = isHouse
      ? ['Season', 'HOH', 'Veto', 'Block Buster', 'Nominated', 'Votes against']
      // The show's own word for what they won, and a jury column only where
      // the show HAS a jury -- a castle's last table is a decision by the
      // people still sitting at it, and a "Jury votes" column over it is a
      // heading about a body that never met.
      : ['Season', `${_cap(words.comp)} wins`, 'Votes against',
        ...(SHOWS[show.format]?.hasJury ? ['Jury votes'] : [])];
    const n = v => (v ? String(v) : '—');
    const rows = show.seasons.map(x => {
      const rr = x.record || {};
      const bb = rr.bb || {};
      const label = `<a href="${root}/season_ref.html?season=${esc(x.seasonId || x.season)}">${
        x.title ? esc(x.title) : `Season ${x.season}`}</a>`;
      // The arena cell says how often they went in as well as how often they
      // came out — "3 of 4" is a different player from "3 of 8" — and a run of
      // them in consecutive weeks is the thing a season gets remembered for.
      const arena = bb.blockBusterWins
        ? `${bb.blockBusterWins}${bb.blockBusterPlayed ? ` of ${bb.blockBusterPlayed}` : ''}${
            bb.blockBusterStreak > 1 ? ` <em>(${bb.blockBusterStreak} in a row)</em>` : ''}`
        : (bb.blockBusterPlayed ? `0 of ${bb.blockBusterPlayed}` : '—');
      return isHouse
        ? `<tr><td>${label}</td><td>${n(bb.hohWins)}</td><td>${n(bb.vetoWins)}</td>
             <td>${arena}</td><td>${n(bb.timesNominated)}</td>
             <td>${n(rr.votesReceived)}</td></tr>`
        : `<tr><td>${label}</td><td>${n((rr.challengeWins || 0) + (rr.tr?.missionsWon || 0))}</td>
             <td>${n(rr.votesReceived)}</td>${
               SHOWS[show.format]?.hasJury ? `<td>${n(rr.juryVotes)}</td>` : ''}</tr>`;
    });
    const totalRow = isHouse
      ? `<tr class="wk-total"><td>Total</td><td>${t.hohWins || 0}</td><td>${t.vetoWins || 0}</td>
         <td>${t.blockBusterWins || 0}</td><td>${t.timesNominated || 0}</td><td></td></tr>`
      : `<tr class="wk-total"><td>Total</td><td>${(t.challengeWins || 0) + (t.missionsWon || 0)}</td><td></td>${
        SHOWS[show.format]?.hasJury ? `<td>${t.juryVotes || 0}</td>` : ''}</tr>`;
    section('competition', 'Competition history', `
      <table class="wk-table wk-comp">
        <thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${rows.join('')}${totalRow}</tbody>
      </table>`);
  }

  // Relationships, when any are on record for this show.
  const rel = dossier.relationships || {};
  const relBits = [];
  // WITH FACES. This section is entirely about other people and it was a list
  // of bare names, only one of which was even a link.
  const people = (list, label, cls) => (list.length
    ? `<div class="wk-rel"><div class="wk-rel-k">${esc(label)}</div>
        <div class="wk-rel-v ${cls}">${list.map(n => L.person(n)).join('')}</div></div>`
    : '');
  if (dossier.couple) {
    relBits.push(`<div class="wk-rel"><div class="wk-rel-k">${
      dossier.couple.together ? 'Together with' : 'Was with'}</div>
      <div class="wk-rel-v">${L.person(dossier.couple.partner)}
        <span class="wk-rel-note">${dossier.couple.together
          ? `together since ${esc(m.name)} ${esc(String(dossier.couple.since))}`
          : `ended in ${esc(m.name)} ${esc(String(dossier.couple.season))}${
            dossier.couple.endedBy ? ` at the ${esc(dossier.couple.endedBy)}` : ''}`}</span>
      </div></div>`);
  }
  relBits.push(people((rel.bonds || []).map(b => b.name), 'Closest to', ''));
  if (rel.alliances?.length) {
    relBits.push(`<div class="wk-rel"><div class="wk-rel-k">Alliances</div>
      <div class="wk-rel-v">${rel.alliances.map(a =>
        `<span class="wk-tag">${esc(a.name)}</span>`).join('')}</div></div>`);
  }
  relBits.push(people((rel.rivalries || []).map(r => r.rival).filter(Boolean), 'Rivals', 'is-rival'));
  section('relationships', 'Relationships', relBits.join(''));

  // ── LIFE OUTSIDE THE GAME ──────────────────────────────────────────
  //
  // The reference pages call this "Post <show>" and fill it with what happened
  // once the season was over: a relationship that started after the finale, an
  // engagement, a wedding, a podcast, a public falling-out.
  //
  // Accrued data — see js/life-events.js. Only APPROVED events reach here; a
  // proposal is a suggestion and must not be able to change what a page says
  // about somebody. Dated by the franchise calendar rather than by the order
  // they were written, since a two-person event is stored once and carries the
  // sequence number of whichever side it was written from.
  {
    const life = dossier.life || [];
    /* ── THE OTHER SHOWS BELONG IN THE TIMELINE ────────────────────────
       "Life outside the game" listed weddings, jobs and moves and said nothing
       about the biggest thing that happens to any of these people between
       seasons of THIS show, which is playing another one. It was on the page —
       in a section of its own, further down — so a reader working through
       somebody's life in order hit a two-year gap with nothing in it.

       Derived from the career rather than stored: nothing has to be written,
       it cannot go stale, and it is dated off the same calendar the rest of
       the log is sorted on. */
    const elsewhere = (dossier.career || [])
      .filter(c => c.format !== format)
      .flatMap(c => (c.seasons || []).map(x => ({
        when: airLabel(x.air || {}),
        key: seasonSort(x),
        show: true,
        html: `${esc(dossier.name)} ${x.placement === 1 ? 'won' : 'competed on'} ${
          L.season(x, c.format)}${x.placement && x.placement !== 1
            ? `, finishing ${ordinal(x.placement)}` : ''}.`,
      })));
    const rows = [
      ...life.map(e => ({
        when: e.when, key: e.rank ?? Number.MAX_SAFE_INTEGER, show: false,
        html: `${L.text(e.line)}${e.detail ? ` ${L.text(e.detail)}` : ''}`,
      })),
      ...elsewhere,
    // Both sources on one spine. Undated rows keep the order they arrived in,
    // at the end, which is what an unplaced season means everywhere else.
    ].sort((a, b) => a.key - b.key);
    if (rows.length) {
      section('life', 'Life outside the game', `<ul class="wk-list">${rows.map(r =>
        `<li${r.show ? ' class="wk-life-show"' : ''}>${
          r.when ? `<em>${esc(r.when)}</em> — ` : ''}${r.html}</li>`).join('')}</ul>`);
    }
  }

  // ── THE OTHER SHOWS ────────────────────────────────────────────────
  //
  // The reference pages carry this as a heading per show — "Big Brother (US)",
  // "Charm School" — under a "Post <show>" banner, saying what somebody did
  // once their season was over.
  //
  // Ours is scoped to one show on purpose: a character's Big Brother article
  // and their Total Drama article are different articles. But that scoping
  // created a hole. Eighteen players have now played both, effectively the
  // whole Big Brother season 1 cast, and their Total Drama pages said nothing
  // about it — the other career existed, on the same dossier, and was rendered
  // nowhere.
  //
  // Written from the record rather than authored: every clause below is a
  // field. What the reference ALSO carries here — talk show appearances,
  // hosting a later season's competition, an engagement after the finale — is
  // a different kind of data this project does not have, and inventing it is
  // exactly what the derived half exists to avoid.
  {
    const others = (dossier.career || [])
      .filter(c => c.format !== format && c.seasons?.length);
    for (const other of others) {
      const om = meta(other.format);
      const outcome = x => {
        if (x.placement === 1) return 'winning the season';
        if (x.placement === 2) return 'finishing as the runner-up';
        // "as a member of the jury" is the reference's phrasing and the record
        // holds it; the jury NUMBER would need the rest of that season's cast,
        // which this article does not have and will not guess at.
        const jury = /jur/i.test(x.status || '') ? ' as a member of the jury' : '';
        return x.placement ? `finishing ${ordinal(x.placement)}${jury}` : 'competing';
      };
      const sentences = other.seasons.slice().sort((a, b) => a.season - b.season).map(x => {
        const label = `<a href="${root}/season_ref.html?season=${esc(x.seasonId || x.season)}"><em>${
          x.title ? esc(x.title) : `${esc(om.name)} ${x.season}`}</em></a>`;
        return `<li>${esc(dossier.name)} competed on ${label}, ${outcome(x)}.</li>`;
      });
      section(`elsewhere-${other.format}`, om.name, `
        <ul class="wk-list">${sentences.join('')}</ul>
        <p><button type="button" class="wk-btn" data-wiki-show="${esc(other.format)}">${
          om.icon} Read the ${esc(om.name)} article</button></p>`);
    }
  }


  // Trivia — records held, and the facts worth knowing.
  const trivia = (dossier.records || [])
    .filter(r => !r.show || r.show === m.name)
    .map(r => `<li>${esc(r.category)} — ${L.text(r.stat)}</li>`);
  // ── COMPUTED, NOT WRITTEN ──
  //
  // "the fourth contestant to win the game, following Lindsay, Duncan and
  // Emma" is a query across every season, not a sentence anyone should be
  // typing or generating: written by hand it goes stale the next time somebody
  // wins, and written by a model it comes out the right shape with the wrong
  // number. Derived, it is right forever and gets richer every season.
  //
  // js/player-trivia.js declines to state anything its sample cannot support,
  // so a first season contributes almost nothing here. That is correct.
  for (const t of dossier.computedTrivia?.[format] || []) trivia.push(`<li>${L.text(t)}</li>`);
  // Facts the episodes support, which is where the interesting ones are: a
  // record table can say somebody won two vetoes and never that they did it
  // in the same shirt both times.
  for (const s2 of show.seasons) {
    for (const t of s2.trivia || []) trivia.push(`<li>${L.text(t)}</li>`);
  }
  if (show.wins) trivia.push(`<li>Won ${show.wins === 1 ? 'a season' : `${show.wins} seasons`} of ${esc(m.name)}.</li>`);
  // "Played 4 seasons" is not written here any more: the computed line above
  // says it and adds the best finish, so both together read as a stutter.
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

  // A section with neither content nor subsections is a heading over nothing.
  const drawn = tree.filter(node => node.html || node.subs.length);

  const bodyHtml = drawn.map(node => `
    <section class="wk-section" id="wk-${node.id}">
      <h2>${node.titleHtml || esc(node.title)}</h2>
      ${node.html}
      ${node.subs.map(x => `<section class="wk-subsection" id="wk-${x.id}">
        <h3>${esc(x.title)}</h3>${x.html}</section>`).join('')}
    </section>`).join('');

  const contentsHtml = drawn.map(node => `<li><a href="#wk-${node.id}">${esc(node.title)}</a>${
    node.subs.length ? `<ol>${node.subs.map(x =>
      `<li><a href="#wk-${x.id}">${esc(x.title)}</a></li>`).join('')}</ol>` : ''}</li>`).join('');

  return `
  <article class="wk-article" style="--wk-accent:${m.accent}">
    ${infobox(dossier, show, root, L)}
    <div class="wk-main">
      ${lead(dossier, show, root, L)}
      ${drawn.length > 2 ? `<nav class="wk-contents"><b>Contents</b><ol>${contentsHtml}</ol></nav>` : ''}
      ${bodyHtml}
    </div>
  </article>`;
}

/**
 * A season's place on the franchise calendar, as one sortable number.
 *
 * `airKey` and nothing else: the life log is already ordered by it upstream,
 * and a second scale invented here would interleave the two sources almost
 * correctly, which is the worst of the three outcomes.
 */
const seasonSort = x => (airKey(x?.air || {}) ?? Number.MAX_SAFE_INTEGER);

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
/* Nested contents: 2.1, 2.2 under 2. Numbered by the browser so the numbers
   cannot disagree with the order they are drawn in. */
.wk-contents ol{ counter-reset:wk-toc; list-style:none; padding-left:18px; }
.wk-contents li{ counter-increment:wk-toc; }
.wk-contents li::before{ content:counters(wk-toc, '.') '  '; opacity:.45; font-variant-numeric:tabular-nums; }
.wk-contents > ol{ padding-left:4px; }
.wk-contents ol ol{ margin:2px 0 4px; font-size:13.5px; opacity:.92; }
/* A subsection inside a season. */
.wk-subsection{ margin:14px 0 0; }
.wk-subsection h3{
  font-size:14px; margin:0 0 8px; letter-spacing:.02em;
  padding-bottom:4px; border-bottom:1px solid var(--stroke);
}
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
/* Evicted and not back yet — hatched, because blank is what a week they were
   never part of looks like. */
.wk-c-away{ background:repeating-linear-gradient(45deg,rgba(255,255,255,.05) 0 4px,
  transparent 4px 8px); color:rgba(255,255,255,.4); font-size:10px; }
/* The week where nobody goes home. */
.wk-c-none{ background:rgba(148,163,184,.09); color:rgba(255,255,255,.35); }
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
/* A season of another show, inside the life timeline — the one line in there
   that is about the game rather than about the life around it. */
.wk-life-show{ list-style:'\\25B8  '; }
.wk-life-show a{ font-weight:700; }
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
/* The AI's description of how they played, in the lead where the reference
   pages put it. Same weight as the game paragraph beside it — it is narrative,
   not a pull quote. */
.wk-lead-persona{ margin:0 0 14px; font-size:14.5px; line-height:1.7; opacity:.9; }
/* The casting interview. Shut by default, like the reference — it is eleven
   answers and it would otherwise be the longest thing on the page, sitting
   above every season they played. The question is the label and the answer is
   the voice, so the two are weighted apart rather than run together. */
.wk-iv{ border:1px solid var(--stroke,rgba(255,255,255,.12)); border-radius:10px;
  background:rgba(255,255,255,.02); margin:14px 0 0; }
.wk-iv-sum{ cursor:pointer; padding:11px 14px; font-weight:700; font-size:13.5px;
  font-style:italic; list-style:none; display:flex; gap:9px; align-items:center; }
.wk-iv-sum::-webkit-details-marker{ display:none; }
.wk-iv-sum::before{ content:'\\25b8'; transition:transform .15s; opacity:.6;
  font-style:normal; }
.wk-iv[open] .wk-iv-sum::before{ transform:rotate(90deg); }
.wk-iv-body{ margin:0; padding:0 16px 14px; }
.wk-iv-body dt{ font-weight:700; font-size:13.5px; margin:12px 0 3px; }
.wk-iv-body dt:first-child{ margin-top:0; }
.wk-iv-body dd{ margin:0; font-size:14px; line-height:1.65; opacity:.85;
  white-space:pre-line; }
@media(prefers-reduced-motion:reduce){ .wk-iv-sum::before{ transition:none; } }
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

/* ── LINKS AND FACES ─────────────────────────────────────────────────
   A wiki links, and this article's prose did not: every season it named and
   every castmate it named was flat text. The linker turns both into these. */
.wk-main a{ color:var(--wk-accent); }
.wk-link{ text-decoration:none; border-bottom:1px solid color-mix(in srgb, var(--wk-accent) 40%, transparent); }
.wk-link:hover{ border-bottom-color:var(--wk-accent); }
/* A face. 18px, round, and it removes itself when there is no file rather than
   leaving a broken-image box in the middle of a sentence. */
.wk-av{
  width:18px; height:18px; border-radius:50%; object-fit:cover; flex:0 0 auto;
  background:rgba(255,255,255,.07); vertical-align:-4px; margin-right:5px;
}
.wk-av.is-off{ display:none; }
.wk-person{
  display:inline-flex; align-items:center; gap:0; text-decoration:none;
  color:var(--wk-accent); font-weight:600; white-space:nowrap;
}
.wk-person:hover span{ text-decoration:underline; }
.wk-ballot{ display:inline-flex; align-items:center; }
.wk-ib-people{ display:flex; flex-wrap:wrap; gap:4px 10px; }
/* The relationships block: a label and a row of faces, not a paragraph. */
.wk-rel{ display:flex; gap:12px; align-items:baseline; margin:0 0 10px; flex-wrap:wrap; }
.wk-rel-k{
  flex:0 0 96px; font-size:11.5px; letter-spacing:.07em; text-transform:uppercase;
  opacity:.55; font-weight:700;
}
.wk-rel-v{ display:flex; flex-wrap:wrap; gap:6px 14px; align-items:center; font-size:14px; }
.wk-rel-v.is-rival .wk-person{ color:#fca5a5; }
.wk-rel-note{ opacity:.6; font-size:12.5px; font-weight:500; }
.wk-tag{
  padding:3px 9px; border-radius:999px; font-size:12px; font-weight:700;
  border:1px solid color-mix(in srgb, var(--wk-accent) 35%, transparent);
  background:color-mix(in srgb, var(--wk-accent) 12%, transparent);
}
/* The marks inside a week cell — H, V, B — above the word for where that week
   left them. One cell can now say "won the veto AND was still nominated",
   which the single-label version could never do. */
.wk-marks{ display:flex; gap:3px; justify-content:center; margin-bottom:2px; }
.wk-m{
  width:15px; height:15px; border-radius:4px; font-style:normal; font-size:9.5px;
  font-weight:900; display:inline-flex; align-items:center; justify-content:center;
  color:#0b0a14;
}
.wk-m-H{ background:#facc15; }
.wk-m-V{ background:#38bdf8; }
.wk-m-B{ background:#4fbf8b; }
.wk-cell-l{ display:block; }
.wk-weeks td{ vertical-align:middle; }
.wk-weeks tbody th .wk-av{ vertical-align:-5px; }
/* A season title inside the coloured plate keeps the plate's colour. */
.wk-ib-head a{ color:inherit; text-decoration:none; }
.wk-ib-head a:hover{ text-decoration:underline; }
/* A linked season heading is still a heading. */
.wk-section h2 a{ color:inherit; text-decoration:none;
  border-bottom:2px solid color-mix(in srgb, var(--wk-accent) 45%, transparent); }
.wk-section h2 a:hover{ border-bottom-color:var(--wk-accent); }

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
