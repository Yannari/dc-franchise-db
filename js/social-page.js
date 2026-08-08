// social.html — Birdie and ChatAlumni.
//
// The page is a renderer and nothing else. Every decision it draws was made
// somewhere testable: which events an episode contains (social/events.js), what
// the crowd says (social/sampler.js), how many of them say it (social/feed.js),
// who is allowed to hold the microphone (social/hosts.js) and what a show calls
// things (social/adapter.js). Nothing here computes fame, picks hosts, writes a
// post or decides what a blindside is — when a component starts doing that, the
// rule it invents stops matching the rule everything else uses.
//
// Where a feed comes from, in order:
//
//   1. /api/social — what the simulator actually published for the airing
//      season, engagement and all.
//   2. the published season document — the archive path, generated in the
//      browser from the same pure library, seeded so it is identical on every
//      visit.
//   3. neither — an honest empty state that says WHY, rather than an empty feed
//      that reads as a broken page.
import { parseSeasonRef, seasonId, DEFAULT_FORMAT } from './shows.js';
import { words, eventLabel, contextLabel, pollQuestions } from './social/adapter.js';
import { loadSeasonDoc, episodeFeed, episodesOf, trendsFrom, audiencePulse, crowdFromRankings }
  from './social/archive.js';
import { eligibleHosts, seasonPanel, episodeSpeakers, fameTerm } from './social/hosts.js';
import { buildChatMessages } from './social/chat.js';
import { personaByHandle } from './social/personas.js';
import { formatFollowers, followersOfPersona } from './social/crowd.js';
import { EPISODE_MS } from './social/events.js';

const API = 'https://dc-studio.yannari19.workers.dev/api/social';
const ROOT = document.documentElement.getAttribute('data-root') || '.';

// ── page state ────────────────────────────────────────────────────────
const S = {
  format: DEFAULT_FORMAT, season: null, episode: null,
  app: 'birdie', tab: 'for-you', channel: 'main-stage',
  db: {}, doc: null, stored: [], feed: { events: [], posts: [], source: 'archive' },
  hosts: [], panel: [], speakers: [], messages: [],
  // Watch Live: `clock` is where the episode is up to, in ms. Everything after
  // it is unreleased, which is what makes arrivals arrive.
  live: false, clock: EPISODE_MS, speed: 1, timer: null, seen: 0,
  liked: new Set(), tomatoed: new Set(), following: new Set(),
  shown: 30,
  // What the reader has opened: one player's timeline, one thread, one profile.
  // Kept here rather than read back out of the DOM, so leaving for the other app
  // and returning does not quietly drop you somewhere else.
  subject: null, thread: null, persona: null,
};

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const titleCase = s => String(s || '').split('-')
  .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
const mmss = ms => `${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;

/** "2m" — how long into the episode, the way a timeline shows it. */
/**
 * Enough of a post to recognise it, and no more.
 *
 * The quote above a reply is there to say WHAT is being answered, not to make
 * the reader read it twice — a full-length parent above every reply turns a
 * timeline into the same post printed in pairs.
 */
const snippet = (text, max = 96) => {
  const t = String(text || '').trim();
  return t.length <= max ? t : `${t.slice(0, max).replace(/\s+\S*$/, '')}…`;
};

const stamp = at => at < 60000 ? `${Math.max(1, Math.round(at / 1000))}s` : `${Math.round(at / 60000)}m`;

function announce(msg) {
  const el = $('live-region');
  if (el) el.textContent = msg;
}

// ── URL ───────────────────────────────────────────────────────────────
function readUrl() {
  const q = new URLSearchParams(location.search);
  const showRef = q.get('show');
  if (showRef) {
    const ref = parseSeasonRef(showRef) || null;
    S.format = (ref && ref.format) || (showRef === 'big-brother' || showRef === 'bb'
      ? 'big-brother' : showRef === 'total-drama' || showRef === 'td' ? 'total-drama' : S.format);
  }
  const season = Number(q.get('season'));
  if (season > 0) S.season = season;
  const ep = Number(q.get('episode'));
  if (ep > 0) S.episode = ep;
  if (q.get('app') === 'chatalumni') S.app = 'chatalumni';
  if (q.get('tab')) S.tab = q.get('tab');
  if (q.get('channel')) S.channel = q.get('channel');
}

function writeUrl(replace = true) {
  const q = new URLSearchParams();
  q.set('show', S.format);
  if (S.season) q.set('season', S.season);
  if (S.episode) q.set('episode', S.episode);
  q.set('app', S.app);
  if (S.app === 'birdie') q.set('tab', S.tab); else q.set('channel', S.channel);
  const url = `${location.pathname}?${q}`;
  history[replace ? 'replaceState' : 'pushState']({}, '', url);
}

// ── data ──────────────────────────────────────────────────────────────
async function json(path) {
  try {
    const r = await fetch(`${ROOT}/${path}`);
    return r.ok ? r.json() : null;
  } catch { return null; }
}

/**
 * The airing season's published feed.
 *
 * Failure here is NOT an error state: the overwhelmingly common case is a season
 * nobody has synced, and the archive path covers it. A page that showed a
 * network error for the normal case would train everyone to ignore it.
 */
async function loadStored(format, season) {
  try {
    const r = await fetch(`${API}?format=${encodeURIComponent(format)}&season=${season}`);
    if (!r.ok) return [];
    const j = await r.json();
    return Array.isArray(j.posts) ? j.posts : [];
  } catch { return []; }
}

/** Every season the site can actually show, newest first. */
function seasonOptions(db) {
  return (db.seasons?.seasons || [])
    .map(s => {
      const ref = parseSeasonRef(s.seasonId || s.seasonNumber);
      return ref ? { format: ref.format || DEFAULT_FORMAT, number: ref.number, title: s.title } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.number - a.number);
}

/** Who is playing right now — they cannot host, and they have no alumni status. */
function airingCast(doc) {
  if (!doc) return [];
  return (doc.placements || []).map(p => p.playerSlug || p.name).filter(Boolean);
}

// ── loading one episode ───────────────────────────────────────────────
async function loadEpisode() {
  const { format, season } = S;
  S.doc = await loadSeasonDoc(format, season, { root: ROOT });
  S.stored = await loadStored(format, season);

  const eps = episodesOf(S.doc, format);
  if (!S.episode || !eps.some(e => e.episode === S.episode)) {
    S.episode = eps.length ? eps[eps.length - 1].episode : null;
  }

  const popularity = crowdFromRankings(S.db.rankings);
  S.feed = S.episode
    ? episodeFeed({ doc: S.doc, stored: S.stored, format, season, episode: S.episode, popularity })
    : { events: [], posts: [], source: 'none' };

  // Hosts are derived on every read, never stored: fame decays, and a season
  // finishing turns contestants into alumni without anybody editing a list.
  S.hosts = eligibleHosts({
    players: S.db.players, seasons: S.db.seasons, rankings: S.db.rankings,
    voices: S.db.voices?.profiles || {}, format,
    // Nobody covers the season they are playing. That holds for an archive too:
    // reading Total Drama 14 tonight, the fourteen people in that camp are
    // contestants, not commentators, however famous they became afterwards.
    airingCast: airingCast(S.doc),
  });
  S.panel = seasonPanel(S.hosts, { format });
  S.speakers = episodeSpeakers(S.panel, S.feed.events, { players: S.db.players });
  S.messages = buildChatMessages(S.feed.events, S.speakers, {
    format, season, episode: S.episode || 0, seed: (season * 977) + (S.episode || 0),
  });

  // Opening an episode shows all of it. Watch Live is something you start.
  if (!S.live) { S.clock = EPISODE_MS; S.seen = visible().length; }
  S.shown = 30;
}

// ── the live clock ────────────────────────────────────────────────────
const stream = () => S.app === 'birdie' ? S.feed.posts : S.messages;
/** Everything released so far. Away from the live edge, the rest waits. */
const visible = () => stream().filter(p => p.at <= S.clock);

function startLive(fromZero = true) {
  stopLive();
  S.live = true;
  if (fromZero) { S.clock = 0; S.seen = 0; }
  render();
  S.timer = setInterval(() => {
    S.clock = Math.min(EPISODE_MS, S.clock + 1000 * S.speed);
    if (S.clock >= EPISODE_MS) stopLive();
    paintLive();
  }, 1000);
}

/**
 * Move the night to a point somebody picked.
 *
 * Everything before the new time counts as ALREADY READ — `S.seen` is what
 * separates "released" from "waiting behind the new-posts pill", and dragging
 * to twenty minutes in to see what happened there, only to be told there are
 * four hundred new posts, is not what the handle means.
 *
 * And it PAUSES. Somebody who takes hold of the handle has stopped watching
 * and started looking; leaving the clock running means the thing they dragged
 * to has already moved on by the time they let go. Play picks up from wherever
 * they left it.
 */
function seekTo(ms) {
  const to = Math.max(0, Math.min(EPISODE_MS, Number(ms) || 0));
  stopLive();
  S.clock = to;
  S.seen = visible().length;
  render();
}

function stopLive() {
  if (S.timer) clearInterval(S.timer);
  S.timer = null;
  S.live = false;
}

/**
 * A tick, without redrawing the feed.
 *
 * Rebuilding the list on every second would throw away scroll position, focus
 * and any thread the reader has open — the exact "the page moved while I was
 * reading" failure the spec calls out. Only the clock and the pill change.
 */
function paintLive() {
  const clockEl = $('clock-time');
  if (clockEl) clockEl.textContent = `${mmss(S.clock)} / ${mmss(EPISODE_MS)}`;
  const bar = $('clock-bar');
  // Not while somebody has hold of it. The tick writes the handle back every
  // second, so a drag during playback would be dragged straight back out of
  // the reader's hand — the handle jittering under the cursor instead of
  // following it.
  if (bar && document.activeElement !== bar && !bar.matches(':active')) bar.value = S.clock;

  const waiting = visible().length - S.seen;
  const pill = $('newpill');
  if (waiting > 0) {
    if (pill) {
      pill.textContent = `${waiting} new ${S.app === 'birdie' ? 'posts' : 'messages'} ↓`;
      pill.hidden = false;
    }
    // One polite summary, not one announcement per arrival.
    announce(`${waiting} new ${S.app === 'birdie' ? 'Birdie posts' : 'ChatAlumni messages'}`);
  } else if (pill) {
    pill.hidden = true;
  }
  setConn();
}

function revealNew() {
  const before = S.seen;
  S.seen = visible().length;
  render();
  // Focus lands on the first new row, so a keyboard reader is not dropped at
  // the top of a list they were halfway down.
  const first = document.querySelector(`[data-idx="${before}"]`);
  if (first) {
    first.setAttribute('tabindex', '-1');
    first.focus({ preventScroll: true });
    first.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function setConn() {
  const el = $('conn'), t = $('conn-text');
  if (!el) return;
  const state = !S.doc ? 'PRESEASON'
    : S.live ? 'LIVE'
    : S.clock < EPISODE_MS ? 'REPLAY'
    : S.feed.source === 'published' ? 'CAUGHT UP' : 'ARCHIVE';
  el.dataset.state = state;
  t.textContent = state === 'ARCHIVE' ? 'Archive'
    : state === 'CAUGHT UP' ? 'Caught up'
    : state === 'PRESEASON' ? 'Preseason'
    : state === 'REPLAY' ? 'Replay' : 'Live';
}

// ── shared bits ───────────────────────────────────────────────────────
function avatar(slug, name, cls = 'avatar') {
  const initial = esc((name || '?').trim().charAt(0).toUpperCase());
  if (!slug) return `<div class="${cls}" aria-hidden="true">${initial}</div>`;
  return `<img class="${cls}" loading="lazy" width="48" height="48" alt=""
    src="${ROOT}/assets/avatars/${esc(slug)}.png"
    onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'${cls}',textContent:'${initial}'}))">`;
}

/** Player names in a post body become links to the canonical player page. */
function linkMentions(text, subject) {
  let out = esc(text);
  if (subject) {
    const name = titleCase(subject);
    out = out.replace(new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'),
      `<a class="mention" href="${ROOT}/player.html?player=${encodeURIComponent(subject)}">${esc(name)}</a>`);
  }
  return out;
}

const svgIcon = {
  reply: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a7 7 0 0 1-7 7H8l-4 3v-4a7 7 0 0 1-1-3.5A7 7 0 0 1 10 5h3a7 7 0 0 1 7 7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  like: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.5-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.5-7 9-7 9z" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  tomato: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="14" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 6c1 1 4 1 6 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
};

// ── Birdie ────────────────────────────────────────────────────────────
function birdiePosts() {
  const all = visible().slice(0, S.seen || undefined);
  if (S.thread) {
    const parent = stream().find(p => p.id === S.thread);
    return parent ? [parent, ...stream().filter(p => p.replyTo === S.thread)] : [];
  }
  const list = S.tab === 'following'
    ? all.filter(p => S.following.has(p.handle))
    : S.tab === 'players'
      ? all.filter(p => p.subject && (!S.subject || p.subject === S.subject))
      : all;
  // For You promotes the loudest moments modestly; Latest is strict event time.
  //
  // Reach is part of "loudest" now, because that is what a following DOES: the
  // accounts you recognise sit near the top night after night, and the strangers
  // are found by scrolling. Weighted rather than sorted by, so a stranger with a
  // genuinely huge reaction still surfaces above a big account's throwaway.
  if (S.tab === 'for-you') {
    // No extra thumb on the scale for recurring accounts: reach already gives
    // them one through engagement, and stacking a second on top swept the whole
    // first page — thirty posts, twenty accounts, which is the exact complaint
    // the crowd was built to answer.
    const weight = p => p.likes + p.tomatoes;
    return [...list].sort((a, b) => weight(b) - weight(a) || a.at - b.at).slice(0, S.shown);
  }
  return list.slice(0, S.shown);
}

function postRow(p, i) {
  const parent = p.replyTo ? stream().find(x => x.id === p.replyTo) : null;
  const liked = S.liked.has(p.id), tom = S.tomatoed.has(p.id);
  const likes = (p.likes || 0) + (liked ? 1 : 0);
  const toms = (p.tomatoes || 0) + (tom ? 1 : 0);
  return `
  <article class="post${p.replyTo ? ' is-reply' : ''}" data-idx="${i}" id="post-${esc(p.id)}">
    ${avatar(null, p.name)}
    <div>
      <div class="post-head">
        <a class="post-name" href="#" data-persona="${esc(p.handle)}">${esc(p.name)}</a>
        <span class="post-handle">${esc(p.handle)}</span>
        ${p.recurring ? `<span class="reach" title="${p.followers} followers"
          >${esc(formatFollowers(p.followers))}</span>` : ''}
        <span class="post-time">· ${stamp(p.at)}</span>
        ${p.source === 'ai-featured' ? '<span class="featured">Featured</span>' : ''}
      </div>
      ${parent ? `<p class="replying">Replying to <a href="#" data-thread="${esc(parent.id)}"
        >${esc(parent.handle)}</a></p>
      <blockquote class="quoted" data-thread="${esc(parent.id)}" tabindex="0"
        role="link" aria-label="Show the post ${esc(p.name)} is replying to">
        <span class="quoted-who">${esc(parent.name)} <i>${esc(parent.handle)}</i></span>
        <span class="quoted-text">${esc(snippet(parent.text))}</span>
      </blockquote>` : ''}
      <p class="post-body">${linkMentions(p.text, p.subject)}</p>
      <p class="post-ctx">${esc(contextLabel(S.format, S.season, S.episode))} · ${esc(eventLabel(p.kind, S.format))}</p>
      <div class="acts">
        <button class="act" type="button" data-reply="${esc(p.id)}"
          aria-label="Replies, ${countReplies(p.id)}">${svgIcon.reply}${countReplies(p.id)}</button>
        <button class="act like" type="button" data-like="${esc(p.id)}" aria-pressed="${liked}"
          aria-label="Like, ${likes} likes">${svgIcon.like}${likes}</button>
        <button class="act tom" type="button" data-tomato="${esc(p.id)}" aria-pressed="${tom}"
          aria-label="Throw tomato, ${toms} tomatoes">${svgIcon.tomato}${toms}</button>
      </div>
    </div>
  </article>`;
}

const countReplies = id => stream().filter(p => p.replyTo === id).length;

/**
 * One chip per player the audience talked about tonight.
 *
 * Drawn from the FEED rather than from the cast list, so every chip opens on
 * something. A name with no posts behind it is a dead end that reads as a bug.
 * Order comes from the season's own placements, so the people still in are first.
 */
function playerChips() {
  const talked = [...new Set(S.feed.posts.map(p => p.subject).filter(Boolean))];
  if (!talked.length) return '';
  const place = new Map((S.doc?.placements || [])
    .map(p => [p.playerSlug || p.name, Number(p.placement) || 99]));
  const sorted = talked.sort((a, b) => (place.get(a) ?? 99) - (place.get(b) ?? 99));
  return `<div class="chips" role="group" aria-label="Players">
    ${S.subject ? '<button type="button" class="chip" data-subject="">All players</button>' : ''}
    ${sorted.map(sub => `<button type="button" class="chip" data-subject="${esc(sub)}"
      aria-pressed="${S.subject === sub}">${esc(titleCase(sub))}</button>`).join('')}
  </div>`;
}

/** The thread you opened, and the way back out of it. */
function threadHeader() {
  return `<div class="thread-head">
    <button type="button" id="thread-back">&larr; Back to the timeline</button>
    <span>Thread &middot; ${countReplies(S.thread)} replies</span>
  </div>`;
}

/**
 * A fan's profile.
 *
 * Their history is real: personas.js gives each of them a season they started
 * watching and how they feel about specific players, and those feelings are what
 * the sampler has been writing from all along. Follower counts are deliberately
 * absent — invented, they would be the only number on this page meaning nothing.
 */
function personaCard() {
  const p = personaByHandle(S.persona);
  if (!p) return '';
  const mine = S.feed.posts.filter(x => x.handle === p.handle);
  const best = [...mine].sort((a, b) => (b.likes + b.tomatoes) - (a.likes + a.tomatoes))[0];
  const feelings = Object.entries(p.feelings || {});
  const loves = feelings.filter(([, f]) => (f.affection || 0) > 0.5).map(([n]) => titleCase(n));
  const hates = feelings.filter(([, f]) => (f.affection || 0) < -0.5).map(([n]) => titleCase(n));
  const following = S.following.has(p.handle);

  return `<div class="persona-card">
    <div class="persona-top">
      <div>
        <strong>${esc(p.name)}</strong> <span class="post-handle">${esc(p.handle)}</span>
        <p class="post-ctx" style="margin:4px 0 0">${esc(p.archetype)} &middot; watching since season ${p.since}</p>
      </div>
      <button type="button" class="follow" data-follow="${esc(p.handle)}" aria-pressed="${following}">
        ${following ? 'Following' : 'Follow'}</button>
    </div>
    <p style="margin:8px 0 0;font-size:14px">
      <strong>${esc(formatFollowers(followersOfPersona(p, { currentSeason: S.season })))}</strong> followers &middot;
      ${mine.length} post${mine.length === 1 ? '' : 's'} this ${esc(words(S.format).episode)}${
        loves.length ? ` &middot; loves ${esc(loves.slice(0, 2).join(' and '))}` : ''}${
        hates.length ? ` &middot; cannot stand ${esc(hates.slice(0, 2).join(' and '))}` : ''}</p>
    ${best ? `<p style="margin:6px 0 0;font-size:14px;opacity:.75">Most reacted to: &ldquo;${esc(best.text.slice(0, 110))}&rdquo;</p>` : ''}
    <p style="margin:8px 0 0;font-size:12px;opacity:.6">Following is kept in this browser. There is no account behind it.</p>
  </div>`;
}

function renderBirdie() {
  const posts = birdiePosts();
  const total = visible().slice(0, S.seen || undefined).length;
  const tabs = [['for-you', 'For You'], ['latest', 'Latest'], ['following', 'Following'], ['players', 'Players']];

  return `
  <div class="birdie">
    <div class="birdie-head">
      <div class="birdie-mark">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 15c4-1 6-4 7-7 1 3 4 5 8 5-1 4-5 7-9 7H4l2-3z" fill="#1c7ed6"/></svg>
        Birdie
      </div>
      <div class="b-tabs" role="tablist" aria-label="Timeline">
        ${tabs.map(([id, label]) => `<button role="tab" id="tab-${id}" data-tab="${id}"
          aria-selected="${S.tab === id}" aria-controls="birdie-feed">${label}</button>`).join('')}
      </div>
    </div>
    ${clockBar()}
    <button class="newpill" id="newpill" hidden type="button"></button>
    <h2 class="sr-only">${esc(contextLabel(S.format, S.season, S.episode))} timeline</h2>
    ${S.thread ? threadHeader() : ''}
    ${!S.thread && S.tab === 'players' ? playerChips() : ''}
    ${!S.thread && S.persona ? personaCard() : ''}
    <div id="birdie-feed" role="tabpanel" aria-labelledby="tab-${S.tab}">
      ${posts.length
        ? posts.map(postRow).join('')
        : emptyFeed()}
    </div>
    ${posts.length < total
      ? `<button class="loadmore" type="button" id="loadmore">Load earlier posts (${total - posts.length} more)</button>`
      : ''}
  </div>`;
}

// ── ChatAlumni ────────────────────────────────────────────────────────
function hostOf(slug) { return S.hosts.find(h => h.slug === slug) || null; }

/**
 * How many eligible hosts have actually played THIS show.
 *
 * Stated separately from the total because it is the honest number: a format
 * that has never finished a season has none of its own, and covering its
 * premiere with visiting alumni is a fact worth showing rather than hiding
 * behind one combined count.
 */
const nativeCount = () => S.hosts.filter(h => h.native).length;

function messageRow(m, i, prev) {
  const host = hostOf(m.authorSlug);
  const clustered = prev && prev.authorSlug === m.authorSlug && (m.at - prev.at) < 4 * 60 * 1000;
  const stars = '★'.repeat(Math.max(0, Math.round(m.stars || 0)));
  return `
  <li class="msg${clustered ? ' clustered' : ''}" data-idx="${i}">
    ${avatar(m.authorSlug, m.author, 'msg-avatar')}
    <div>
      <div class="msg-head">
        <a class="msg-name" href="${ROOT}/player.html?player=${encodeURIComponent(m.authorSlug)}">${esc(m.author)}</a>
        ${stars ? `<span class="msg-stars" title="${esc(fameTerm(m.stars))}">${stars}</span>` : ''}
        ${host && !host.native ? '<span class="visiting">Cross-format host</span>' : ''}
        <span class="msg-time">${stamp(m.at)}</span>
      </div>
      <p class="msg-body">${linkMentions(m.text, m.subject)}</p>
      <div class="msg-foot">
        <button type="button" data-like="${esc(m.id)}" aria-label="Like, ${m.likes} likes">♥ ${m.likes}</button>
        <span>${m.commentCount} comments</span>
        ${m.hostReplied ? '<span class="host-replied">Host replied</span>' : ''}
      </div>
      ${m.comments?.length ? `<div class="comments">${m.comments.map(c =>
        `<p class="comment"><b>${esc(c.author)}</b> ${esc(c.text)}</p>`).join('')}</div>` : ''}
    </div>
  </li>`;
}

function renderChat() {
  const tabs = [['main-stage', 'Main Stage'], ['watch-party', 'Watch Party'],
    ['predictions', 'Predictions'], ['hosts', 'Hosts']];
  const head = `
    <div class="chat-head">
      <div class="chat-mark">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z" fill="#b8862b"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4" stroke="#f6efdc" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
        ChatAlumni
      </div>
      <p class="chat-sub">${S.speakers.length} host${S.speakers.length === 1 ? '' : 's'} covering
        ${esc(contextLabel(S.format, S.season, S.episode))} ·
        ${nativeCount()} ${esc(words(S.format).short)} alumni${
          S.hosts.length - nativeCount() > 0
            ? ` · ${S.hosts.length - nativeCount()} visiting from another show` : ''}</p>
    </div>
    <div class="c-tabs" role="tablist" aria-label="Channels">
      ${tabs.map(([id, label]) => `<button role="tab" id="ctab-${id}" data-channel="${id}"
        aria-selected="${S.channel === id}" aria-controls="chat-panel">${label}</button>`).join('')}
    </div>`;

  let body;
  if (S.channel === 'hosts') body = renderHosts();
  else if (S.channel === 'predictions') body = renderPredictions();
  else {
    const msgs = visible().slice(0, S.seen || undefined);
    body = msgs.length ? `
      <p class="pinned"><b>Pinned</b> ${esc(words(S.format).Episode)} ${S.episode} watch party —
        ${S.speakers.map(s => esc(s.name)).join(', ')}</p>
      ${clockBar()}
      <button class="newpill c" id="newpill" hidden type="button"></button>
      <p class="divider">${esc(contextLabel(S.format, S.season, S.episode))}</p>
      <ol style="list-style:none;margin:0;padding:0">
        ${msgs.map((m, i) => messageRow(m, i, msgs[i - 1])).join('')}
      </ol>` : emptyFeed();
  }

  return `<div class="chat">${head}<div id="chat-panel" role="tabpanel" aria-labelledby="ctab-${S.channel}">${body}</div></div>`;
}

function renderHosts() {
  const onMic = S.speakers[0];
  const row = h => `
    <div class="hostrow">
      ${avatar(h.slug, h.name)}
      <div>
        <div class="h-name">${esc(h.name)}</div>
        <div class="h-meta">${'★'.repeat(Math.max(0, Math.round(h.stars)))} ${esc(h.fameTerm)} ·
          ${h.shows.map(s => esc(words(s).short)).join('/')} ·
          ${esc(h.expertise.slice(0, 2).join(', '))}${h.native ? '' : ' · visiting'}</div>
      </div>
      <a href="${ROOT}/player.html?player=${encodeURIComponent(h.slug)}"
         style="font-size:13px;opacity:.7">Profile</a>
    </div>`;

  return `
    <p class="divider">Hosts · ${S.hosts.length} eligible alumni</p>
    ${onMic ? `<p class="divider">On the mic</p>${row(onMic)}` : ''}
    <p class="divider">Hosting this season</p>
    ${S.panel.slice(0, 12).map(row).join('')}
    <p class="divider">All eligible alumni</p>
    ${S.hosts.slice(0, S.shown).map(row).join('')}
    ${S.hosts.length > S.shown
      ? `<button class="loadmore" type="button" id="loadmore">Show more alumni (${S.hosts.length - S.shown} more)</button>` : ''}`;
}

function renderPredictions() {
  const preseason = !S.doc;
  const qs = pollQuestions(S.format, { preseason });
  const cast = (S.doc?.placements || []).slice(0, 6).map(p => p.name);
  return `
    <p class="divider">Predictions</p>
    ${qs.map(q => `
      <div style="padding:16px 20px;border-bottom:1px solid var(--linec)">
        <p style="font-size:17px;margin:0 0 10px">${esc(q.text)}</p>
        ${cast.length ? cast.slice(0, 4).map((name, i) => {
          const pct = [42, 27, 19, 12][i];
          return `<div style="display:flex;gap:10px;align-items:center;margin:6px 0;font-family:system-ui,sans-serif;font-size:14px">
            <span style="flex:1">${esc(name)}</span>
            <span style="width:120px;height:8px;background:rgba(0,0,0,.1);border-radius:4px;overflow:hidden">
              <span style="display:block;height:100%;width:${pct}%;background:var(--bottle)"></span></span>
            <span style="width:38px;text-align:right;font-variant-numeric:tabular-nums">${pct}%</span>
          </div>`;
        }).join('') : '<p style="opacity:.7">Opens when a cast is announced.</p>'}
      </div>`).join('')}
    <p style="padding:14px 20px;font-size:13px;opacity:.7;font-family:system-ui,sans-serif">
      Simulated audience. These totals are generated from the season's own records —
      they are not votes cast by visitors, and real votes would be shown separately.</p>`;
}

// ── the clock ─────────────────────────────────────────────────────────
function clockBar() {
  if (!S.doc || !S.episode) return '';
  return `
  <div class="clock">
    <button type="button" id="btn-live" aria-pressed="${S.live}">${S.live ? '⏸ Pause' : '▶ Watch Live'}</button>
    <span class="time" id="clock-time">${mmss(S.clock)} / ${mmss(EPISODE_MS)}</span>
    <label class="sr-only" for="clock-bar">Episode progress — drag to move through the night</label>
    <input type="range" id="clock-bar" class="clock-scrub" min="0" max="${EPISODE_MS}"
      step="1000" value="${S.clock}" aria-valuetext="${mmss(S.clock)} of ${mmss(EPISODE_MS)}">
    ${[1, 2, 5].map(x => `<button type="button" data-speed="${x}"
      aria-pressed="${S.live && S.speed === x}">${x}×</button>`).join('')}
    <button type="button" data-speed="instant" aria-pressed="${S.clock >= EPISODE_MS && !S.live}">Instant</button>
  </div>`;
}

// ── empty and preseason states ────────────────────────────────────────
function emptyFeed() {
  const w = words(S.format);
  if (!S.doc) {
    // The honest preseason state: no fake weeks, no invented alumni, and it says
    // what WOULD be here and when.
    const visitors = S.panel.slice(0, 6).map(h => h.name).join(', ');
    return `<div class="state-card">
      <h2>${esc(w.name)} ${esc(String(S.season))}</h2>
      <p>The ${esc(w.home)} has not opened yet. There is no ${esc(w.episode)} to react to,
         so there is nothing here — rather than a feed of things that never happened.</p>
      <p><strong>Birdie:</strong> preseason talk begins when a cast is announced.<br>
         <strong>ChatAlumni:</strong> ${visitors ? esc(visitors) + ' are booked to cover the new format.' : 'hosts are being booked.'}</p>
      <div class="state-actions">
        <button type="button" data-goto-channel="hosts">Meet the hosts</button>
        <a href="?show=total-drama&amp;season=14&amp;app=${esc(S.app)}">Go to Total Drama 14</a>
      </div>
    </div>`;
  }
  if (!S.episode) {
    // NOT the same as "it has not aired". Seasons 1-5 finished years ago; their
    // published documents simply predate any per-episode record, so there is
    // nothing for an audience to react to. Saying "nothing aired yet" about a
    // season with a winner would be the page contradicting the rest of the site.
    return `<div class="state-card"><h2>No ${esc(w.episode)}-by-${esc(w.episode)} record</h2>
      <p>This season is published, but its records do not say what happened in any
         single ${esc(w.episode)} — so there is nothing here to react to.</p>
      <div class="state-actions">
        <a href="${ROOT}/season_ref.html?season=${S.season}">See the season page</a>
      </div></div>`;
  }
  if (S.tab === 'following') {
    return `<div class="state-card"><h2>You are not following anybody yet</h2>
      <p>Following is kept in this browser only — there is no account behind it.
         Tap a name on any post to follow that account.</p></div>`;
  }
  return `<div class="state-card"><h2>No reactions to this ${esc(w.episode)}</h2>
    <p>Its record contains no moment the audience argues about. That is a quiet
       ${esc(w.episode)}, not a failure to load.</p></div>`;
}

// ── right rail ────────────────────────────────────────────────────────
function renderRail() {
  if (!S.doc || !S.feed.posts.length) return '';
  const w = words(S.format);
  const trends = trendsFrom(S.feed.posts);
  const pulse = audiencePulse(S.feed.posts);
  const nameOf = s => titleCase(s || '');

  return `
    <section class="panel-card">
      <h2>Trending in ${esc(w.short)} ${esc(String(S.season))}</h2>
      ${trends.map((t, i) => `<div class="trend">
        <span class="n">${i + 1}</span>
        <span class="t">${esc(nameOf(t.subject))} ${esc(eventLabel(t.kind, S.format).toLowerCase())}</span>
        <span class="c">${t.count}</span>
      </div>`).join('') || '<p style="opacity:.6">Nothing yet.</p>'}
    </section>
    <section class="panel-card">
      <h2>Audience pulse</h2>
      ${pulse.rising ? `<div class="pulse-row"><span class="lab">Rising</span>
        <span>${esc(nameOf(pulse.rising.subject))} <span aria-hidden="true">↑</span>
        <span class="sr-only">up</span></span></div>` : ''}
      ${pulse.falling && pulse.falling !== pulse.rising ? `<div class="pulse-row"><span class="lab">Falling</span>
        <span>${esc(nameOf(pulse.falling.subject))} <span aria-hidden="true">↓</span>
        <span class="sr-only">down</span></span></div>` : ''}
      ${pulse.divided ? `<div class="pulse-row"><span class="lab">Most divided</span>
        <span>${esc(nameOf(pulse.divided.subject))}</span></div>` : ''}
      <p style="font-size:11.5px;opacity:.55;margin:10px 0 0">
        Relative movement across this ${esc(w.episode)}, from how the audience reacted.</p>
    </section>
    <section class="panel-card">
      <h2>This ${esc(w.episode)}</h2>
      ${S.feed.events.filter(e => e.kind !== 'episode-aired').slice(0, 8).map(e =>
        `<div class="trend"><span class="t">${esc(eventLabel(e.kind, S.format))}</span>
         <span class="c">${esc(titleCase(e.subject || ''))}</span></div>`).join('')
        || '<p style="opacity:.6">A quiet one.</p>'}
      <p style="font-size:11.5px;opacity:.55;margin:10px 0 0">
        ${S.feed.source === 'published'
          ? 'Published from the season as it aired.'
          : 'Reconstructed from this season’s published records.'}</p>
    </section>`;
}

function renderNav() {
  const items = S.app === 'birdie'
    ? [['for-you', 'For You'], ['latest', 'Latest'], ['following', 'Following'], ['players', 'Players']]
    : [['main-stage', 'Main Stage'], ['watch-party', 'Watch Party'], ['predictions', 'Predictions'], ['hosts', 'Hosts']];
  const current = S.app === 'birdie' ? S.tab : S.channel;
  return items.map(([id, label]) => `<button type="button" data-${S.app === 'birdie' ? 'tab' : 'channel'}="${id}"
    aria-current="${current === id ? 'page' : 'false'}">${label}</button>`).join('');
}

// ── render ────────────────────────────────────────────────────────────
function render() {
  $('ctx-chip').textContent = `${words(S.format).name} ${S.season}`
    + (S.episode ? ` · ${words(S.format).Episode} ${S.episode}` : ' · Preseason');
  $('pick-birdie').setAttribute('aria-pressed', String(S.app === 'birdie'));
  $('pick-chat').setAttribute('aria-pressed', String(S.app === 'chatalumni'));
  $('rail-nav').innerHTML = renderNav();
  $('soc-main').innerHTML = S.app === 'birdie' ? renderBirdie() : renderChat();
  $('rail-right').innerHTML = renderRail();
  setConn();
  document.title = `${S.app === 'birdie' ? 'Birdie' : 'ChatAlumni'} — ${words(S.format).name} ${S.season}`;
}

// ── events ────────────────────────────────────────────────────────────
function wire() {
  $('pick-birdie').onclick = () => switchApp('birdie');
  $('pick-chat').onclick = () => switchApp('chatalumni');

  $('pick-season').onchange = async e => {
    const [format, number] = e.target.value.split('|');
    S.format = format; S.season = Number(number); S.episode = null;
    stopLive();
    await reload();
  };
  $('pick-episode').onchange = async e => {
    S.episode = Number(e.target.value);
    stopLive();
    await reload();
  };

  // A range input reports through `input`, so the delegated click handler never
  // sees it. Live so it works for the keyboard too: arrow keys on the handle
  // move the episode exactly as dragging does.
  document.addEventListener('input', ev => {
    if (ev.target?.id === 'clock-bar') seekTo(ev.target.value);
  });

  document.addEventListener('click', ev => {
    const t = ev.target.closest('[data-tab],[data-channel],[data-like],[data-tomato],[data-speed],[data-thread],'
      + '#btn-live,#newpill,#loadmore,[data-goto-channel],[data-reply],[data-subject],'
      + '[data-persona],[data-follow],#thread-back');
    if (!t) return;
    // The author link is a real anchor so it is keyboard-reachable and shows a
    // target; opening the profile in place is what it actually does.
    if (t.dataset.persona !== undefined || t.dataset.subject !== undefined
      || t.dataset.thread !== undefined) ev.preventDefault();

    if (t.dataset.thread) {
      // "Replying to @somebody" used to be dead text, so a reply named a post
      // the reader had no way to reach — the one thing every timeline gives
      // you. Opens the conversation at the post being answered.
      S.thread = t.dataset.thread;
      S.persona = null; S.subject = null; S.shown = 30;
      render();
      const el = document.getElementById(`post-${t.dataset.thread}`);
      if (el) el.scrollIntoView({ block: 'start' });
    }
    else if (t.dataset.tab) { S.tab = t.dataset.tab; S.shown = 30; S.thread = null; writeUrl(); render(); }
    else if (t.dataset.subject !== undefined) { S.subject = t.dataset.subject || null; S.shown = 30; render(); }
    else if (t.dataset.persona !== undefined) {
      S.persona = S.persona === t.dataset.persona ? null : t.dataset.persona;
      render();
    }
    else if (t.dataset.follow) toggle(S.following, t.dataset.follow);
    else if (t.id === 'thread-back') { S.thread = null; render(); }
    else if (t.dataset.channel) { S.channel = t.dataset.channel; S.shown = 30; writeUrl(); render(); }
    else if (t.dataset.gotoChannel) { S.app = 'chatalumni'; S.channel = t.dataset.gotoChannel; writeUrl(); render(); }
    else if (t.id === 'newpill') revealNew();
    else if (t.id === 'loadmore') { S.shown += 30; render(); }
    else if (t.id === 'btn-live') {
      // Pause and play again picks up where it stopped. It used to pass
      // `fromZero: true` unconditionally, so pausing to read something threw
      // away the episode and started it over — the one thing a pause button
      // must never do. Only a finished episode restarts.
      if (S.live) { stopLive(); render(); } else startLive(S.clock >= EPISODE_MS);
    }
    else if (t.dataset.speed) {
      if (t.dataset.speed === 'instant') { stopLive(); S.clock = EPISODE_MS; S.seen = visible().length; render(); }
      else {
        // Setting a speed does not un-pause. A paused player whose transport
        // controls restart it is a player you cannot set up before watching —
        // press play when you want it, at the speed you picked.
        S.speed = Number(t.dataset.speed);
        render();
      }
    }
    else if (t.dataset.like) toggle(S.liked, t.dataset.like);
    else if (t.dataset.tomato) toggle(S.tomatoed, t.dataset.tomato);
    else if (t.dataset.reply) {
      // Open the thread rather than highlight the row: a reply count you cannot
      // click is a number pretending to be a control.
      const has = countReplies(t.dataset.reply);
      S.thread = has ? t.dataset.reply : null;
      S.persona = null;
      render();
      if (!has) announce('That post has no replies yet.');
    }
  });
}

/**
 * A reaction the visitor made.
 *
 * Kept in this browser and nowhere else, and the number shown is the stored
 * count plus your own — never written back. Merging an anonymous click into the
 * published totals would make them untrustworthy for everyone, and there is no
 * account behind it to rate-limit.
 */
function toggle(set, id) {
  set.has(id) ? set.delete(id) : set.add(id);
  render();
}

function switchApp(app) {
  S.app = app;
  S.shown = 30;
  // The episode clock survives the switch: the two apps are two windows on the
  // same night, and losing your place crossing between them would make Watch
  // Live unusable.
  S.seen = visible().length;
  writeUrl();
  render();
}

async function reload() {
  $('soc-main').innerHTML = '<p class="panel-card">Loading…</p>';
  await loadEpisode();
  fillPickers();
  writeUrl();
  render();
}

function fillPickers() {
  const opts = seasonOptions(S.db);
  // A season nobody has published is still a place you can BE — the preseason
  // state exists precisely for it. Without this the picker silently snapped back
  // to the first published season while the page showed Big Brother 2, so the
  // two disagreed about where you were.
  if (!opts.some(o => o.format === S.format && o.number === S.season)) {
    opts.unshift({ format: S.format, number: S.season, title: 'not aired yet' });
  }
  $('pick-season').innerHTML = opts.map(o =>
    `<option value="${o.format}|${o.number}" ${o.format === S.format && o.number === S.season ? 'selected' : ''}>
      ${esc(words(o.format).short)} ${o.number}${o.title ? ' — ' + esc(o.title) : ''}</option>`).join('');

  const eps = episodesOf(S.doc, S.format);
  $('pick-episode').innerHTML = eps.length
    ? eps.map(e => `<option value="${e.episode}" ${e.episode === S.episode ? 'selected' : ''}>
        ${esc(words(S.format).Episode)} ${e.episode}</option>`).join('')
    : `<option>No ${esc(words(S.format).episode)}s yet</option>`;
  $('pick-episode').disabled = !eps.length;
}

// ── boot ──────────────────────────────────────────────────────────────
(async function boot() {
  readUrl();
  const [players, seasons, rankings, voices] = await Promise.all([
    json('players_database.json'), json('seasons_database.json'),
    json('rankings_database.json'), json('voice-profiles.json'),
  ]);
  S.db = { players, seasons, rankings, voices };

  if (!S.season) {
    const opts = seasonOptions(S.db).filter(o => o.format === S.format);
    S.season = opts.length ? opts[0].number : 1;
  }

  wire();
  await reload();
  window.addEventListener('popstate', () => { readUrl(); render(); });
})();
