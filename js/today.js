// Today on Blindside: three things on the front page that change every day.
//
//   - a player of the day, from every show, with the career in one line
//   - a season from the vault, with its winner
//   - a head-to-head: two neighbours in the franchise rankings, and you say
//     who played the better game before the page tells you what the rankings
//     think
//
// Picked from the date, so everybody who opens the site today sees the same
// three, and tomorrow is different: the reason to look again tomorrow. Your
// answer to the head-to-head is kept for the day in this browser.

import { SHOWS, DEFAULT_FORMAT } from './shows.js';
import { seasonWinners } from './records.js';
import { airLabel } from './franchise-calendar.js';
import { avatarUrl } from './avatar-registry.js';

const VOTE_KEY = 'bs_today_vote_v1';

/** The day's key: the visitor's own calendar date. */
export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** A small deterministic generator seeded from a string (mulberry32 over a string hash). */
export function seeded(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ordinal = n => {
  const v = n % 100;
  return `${n}${['th', 'st', 'nd', 'rd'][(v - 20) % 10] || ['th', 'st', 'nd', 'rd'][v] || 'th'}`;
};

/** The day's three, decided from the databases and the date. */
export function todayPicks({ players = [], seasons = [], rankings = [] }, day = dayKey()) {
  const rand = seeded(`blindside:${day}`);
  const pick = list => (list.length ? list[Math.floor(rand() * list.length)] : null);

  const played = players.filter(p => p?.id && (p.seasonsPlayed || p.totalSeasons || 0) > 0);
  const player = pick(played);
  const rank = player ? rankings.find(r => r.playerId === player.id) || null : null;

  const done = seasons.filter(s => s && /complete/i.test(s.status || 'Complete') && seasonWinners(s).length);
  const season = pick(done);

  // Neighbours in the rankings: close enough that the answer is a matter of
  // opinion, never #1 against #150.
  const ranked = rankings.filter(r => r?.playerId && Number.isFinite(r.rank)).sort((a, b) => a.rank - b.rank);
  let duel = null;
  if (ranked.length >= 2) {
    const i = Math.floor(rand() * (ranked.length - 1));
    const j = Math.min(ranked.length - 1, i + 1 + Math.floor(rand() * 4));
    const pair = rand() < 0.5 ? [ranked[i], ranked[j]] : [ranked[j], ranked[i]];
    duel = { a: pair[0], b: pair[1] };
  }
  return { day, player, rank, season, duel };
}

/** The career in a line, in the words of the shows it was played on. */
export function careerLine(p) {
  if (!p) return '';
  const shows = Object.keys(typeof p.byShow === 'object' && p.byShow ? p.byShow : {})
    .map(f => SHOWS[f]?.name).filter(Boolean);
  const n = p.seasonsPlayed || p.totalSeasons || 0;
  const bits = [`${n} ${n === 1 ? 'season' : 'seasons'}${shows.length ? ` of ${shows.join(' and ')}` : ''}`];
  if (p.wins) bits.push(p.wins === 1 ? 'a winner' : `${p.wins}-time winner`);
  else if (p.bestPlacement) bits.push(`best finish ${ordinal(p.bestPlacement)}`);
  if (p.totalChallengeWins) bits.push(`${p.totalChallengeWins} challenge ${p.totalChallengeWins === 1 ? 'win' : 'wins'}`);
  return bits.join(' · ');
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const img = (src, cls = '') => `<img class="${cls}" src="${esc(src)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`;

function playerCard(t) {
  const p = t.player;
  if (!p) return '';
  return `<a class="td-card td-player" href="player.html?player=${encodeURIComponent(p.id)}">
    <span class="td-kicker">Player of the day</span>
    ${img(avatarUrl(p.id), 'td-face')}
    <b class="td-name">${esc(p.name)}</b>
    ${t.rank?.title ? `<span class="td-title">${esc(t.rank.title)}</span>` : ''}
    <span class="td-line">${esc(careerLine(p))}</span>
    ${t.rank ? `<span class="td-rank">#${esc(t.rank.rank)} in the rankings · tier ${esc(t.rank.tier)}</span>` : ''}
  </a>`;
}

function seasonCard(t) {
  const s = t.season;
  if (!s) return '';
  const ws = seasonWinners(s);
  const format = s.format || DEFAULT_FORMAT;
  const when = airLabel(s);
  return `<a class="td-card td-season" href="season_ref.html?season=${encodeURIComponent(s.seasonId || s.seasonNumber)}" style="--show:${esc(SHOWS[format]?.accent || '#B9A7FF')}">
    <span class="td-kicker">From the vault</span>
    <span class="td-show">${esc(SHOWS[format]?.name || '')}</span>
    <b class="td-name">${esc(s.title)}</b>
    <span class="td-winners">${ws.map(w => img(avatarUrl({ slug: w.playerSlug, show: format }), 'td-face sm')).join('')}
      <span>Won by <b>${esc(ws.map(w => w.name).join(' & '))}</b></span></span>
    <span class="td-line">${[when, s.castSize ? `${s.castSize} players` : '', s.episodeCount ? `${s.episodeCount} episodes` : ''].filter(Boolean).map(esc).join(' · ')}</span>
  </a>`;
}

function duelCard(t, vote) {
  const d = t.duel;
  if (!d) return '';
  const side = (r, key) => `<button type="button" class="td-side${vote === key ? ' is-mine' : ''}" data-vote="${key}" ${vote ? 'disabled' : ''}>
      ${img(avatarUrl(r.playerId), 'td-face')}<b>${esc(r.name)}</b>
      ${vote ? `<span class="td-verdict">#${esc(r.rank)} · ${esc(r.title || `tier ${r.tier}`)}</span>` : ''}</button>`;
  let result = '';
  if (vote) {
    const mine = vote === 'a' ? d.a : d.b;
    const higher = d.a.rank < d.b.rank ? d.a : d.b;
    result = `<p class="td-result">${mine === higher
      ? `The rankings agree with you: <b>${esc(higher.name)}</b> sits higher.`
      : `The rankings disagree: they have <b>${esc(higher.name)}</b> higher. Come back tomorrow for another.`}</p>`;
  }
  return `<div class="td-card td-duel">
    <span class="td-kicker">Head to head</span>
    <b class="td-q">Who played the better game?</b>
    <div class="td-sides">${side(d.a, 'a')}<span class="td-vs">vs</span>${side(d.b, 'b')}</div>
    ${result}
  </div>`;
}

export function todayHtml(t, vote = null, date = new Date()) {
  const label = date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  return `<div class="hm-head"><h2 id="hmTodayTitle">Today on Blindside</h2><span class="td-date">${esc(label)}</span></div>
    <div class="td-grid">${playerCard(t)}${seasonCard(t)}${duelCard(t, vote)}</div>`;
}

function readVote(day) {
  try { const v = JSON.parse(localStorage.getItem(VOTE_KEY) || 'null'); return v?.day === day ? v.pick : null; } catch { return null; }
}

/** Draw the section into `mount` and wire the head-to-head. */
export function mountToday(mount, data) {
  if (!mount) return;
  const t = todayPicks(data);
  if (!t.player && !t.season && !t.duel) return;
  let vote = readVote(t.day);
  const draw = () => {
    mount.innerHTML = todayHtml(t, vote);
    mount.querySelectorAll('[data-vote]').forEach(b => b.addEventListener('click', () => {
      vote = b.dataset.vote;
      try { localStorage.setItem(VOTE_KEY, JSON.stringify({ day: t.day, pick: vote })); } catch { /* blocked: kept for the visit */ }
      draw();
    }));
  };
  draw();
}
