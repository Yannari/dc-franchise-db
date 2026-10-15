// ══════════════════════════════════════════════════════════════════════
// vp-ch-ep/debug.js — The Challenge's Debug screen (the user, 2026-10-15: "we need a debug like in
// Total Drama")
// ══════════════════════════════════════════════════════════════════════
//
// The last screen of every episode, after the show: what the engine decided and why, in tabs the viewer
// keeps open between episodes. Everything here is read off the episode's row (ch-run.js challengeRows):
// the daily's order and scores, every ballot with the reason it was cast, the meetings and who said yes,
// the call-outs and their reasons, the duels round by round, the house's bonds, alliances and deals as the
// episode ended (season.js intelSnap), each player's stats and record, and what the director aired.
import { pStats } from '../players.js';
import { players } from '../core.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const TABS = [['episode', 'This episode'], ['votes', 'The vote'], ['players', 'Players'], ['bonds', 'Bonds'], ['allies', 'Alliances & deals'], ['director', 'Director']];
const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const tabNow = () => { try { return localStorage.getItem('ch_debug_tab') || 'episode'; } catch { return 'episode'; } };
const archOf = n => (Array.isArray(players) ? players : []).find(p => p.name === n)?.archetype || '';
const bondCol = v => (v >= 6 ? '#3fae5a' : v >= 3 ? '#2f8fb8' : v > -2 ? '#3a3430' : v > -5 ? '#b8862f' : '#b83a3a');

function table(head, rows) {
  return `<table class="chd-t"><thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function episodeTab(row) {
  const ch = row.ch || {};
  let h = '';
  const d = ch.daily;
  if (d) {
    h += `<h4>The daily: ${esc(d.name)} <small>${esc(d.mode || '')}</small></h4>`;
    h += table(['Place', 'Who', 'Note'], (d.order || []).map((u, i) => [String(i + 1), esc(u.join(' & ')),
      [(d.winners || []).some(w => u.includes(w)) ? '<b class="chd-w">WON</b>' : '', (d.last || []).some(w => u.includes(w)) ? '<b class="chd-l">LAST</b>' : '',
        (d.throws || []).some(w => u.includes(w)) ? '<b class="chd-l">THREW</b>' : ''].join(' ')]));
    if (d.moments?.length) h += `<div class="chd-n">Moments: ${d.moments.map(m => `${esc(m.kind)} (${esc([].concat(m.who || []).join(', '))})`).join(' · ')}</div>`;
    if (d.injuries?.length) h += `<div class="chd-n">Injured: ${esc(d.injuries.join(', '))}</div>`;
  }
  if (ch.callouts?.length) {
    h += '<h4>The call-outs</h4>' + table(['Voted in', 'Called out', 'Why'], ch.callouts.map(c => [esc(c.by), esc(c.opponent), esc(c.reason || '')]));
  }
  if (ch.duels?.length) {
    h += '<h4>The Arena</h4>';
    for (const x of ch.duels) {
      h += `<div class="chd-duel"><b>${esc(x.name)}</b>: ${esc(x.a)} vs ${esc(x.b)}, <b class="chd-w">${esc(x.winner)}</b> wins${x.upset ? ' <i>(upset)</i>' : ''}${x.comeback ? ' <i>(comeback)</i>' : ''}${x.volunteer ? ' <i>(volunteer)</i>' : ''}</div>`;
      h += `<div class="chd-n">${(x.beats || []).map((b, i) => `${i + 1}. ${esc(b.kind)}${b.score ? ` ${esc(Object.entries(b.score).map(([n, v]) => `${n} ${v}`).join(' – '))}` : ''}${b.winner ? ` → ${esc(b.winner)}` : ''}`).join('<br>')}</div>`;
    }
  }
  const exits = row.exits || [];
  if (exits.length) h += '<h4>Out this episode</h4>' + table(['Who', 'How', 'By'], exits.map(e => [esc(e.name || e), esc(e.how || ''), esc(e.by || e.victim || '')]));
  return h || '<div class="chd-n">Nothing recorded.</div>';
}

function votesTab(row) {
  const ch = row.ch || {};
  let h = '';
  if (ch.meetings?.length) {
    h += '<h4>The meetings</h4>' + table(['Group', 'Organiser', 'Target', 'Answers'], ch.meetings.map(m => [esc(m.name || '(no name)'), esc(m.organiser), esc(m.target),
      Object.entries(m.responses || {}).map(([n, r]) => `${esc(n)}: <b class="${r === 'yes' || r === 'organiser' ? 'chd-w' : r === 'refuses' ? 'chd-l' : 'chd-m'}">${esc(r)}</b>`).join(', ')]));
  }
  for (const v of ch.votes || []) {
    h += `<h4>The vote: ${esc(v.votedIn)} goes in${v.tied ? ` <small>(tie, broken by ${esc(v.tiebreak || '?')})</small>` : ''}</h4>`;
    h += table(['Voter', 'Said', 'Wanted', 'Asked to', 'Told', 'Why', ''], (v.ballots || []).map(b => [esc(b.voter), `<b>${esc(b.target)}</b>`, esc(b.wanted || ''), esc(b.asked || ''), esc(b.told || ''), esc(b.why || ''), b.flip ? '<b class="chd-l">FLIP</b>' : '']));
    h += `<div class="chd-n">Tally: ${Object.entries(v.tally || {}).sort((a, b) => b[1] - a[1]).map(([n, c]) => `${esc(n)} ${c}`).join(' · ')}</div>`;
  }
  return h || '<div class="chd-n">No vote this episode.</div>';
}

function playersTab(row) {
  const I = row.ch?.intel?.end || row.ch?.intel?.start;
  const names = I?.players || row.ch?.house || [];
  return table(['Player', 'Archetype', ...STATS.map(s => s.slice(0, 4)), 'Dailies', 'Arena', 'In', 'Votes'], names.map(n => {
    const s = (() => { try { return pStats(n) || {}; } catch { return {}; } })();
    const r = I?.rec?.[n] || {};
    return [esc(n), esc(archOf(n)), ...STATS.map(k => String(s[k] ?? '–')), String(r.daily ?? '–'), `${r.arenaW ?? 0}-${r.arenaL ?? 0}`, String(r.votedIn ?? '–'), String(r.votes ?? '–')];
  }));
}

function bondsTab(row) {
  const I = row.ch?.intel?.end || row.ch?.intel?.start;
  if (!I) return '<div class="chd-n">This episode was saved without its record.</div>';
  const P = I.players;
  const b = (x, y) => I.bonds[x <= y ? `${x}||${y}` : `${y}||${x}`] || 0;
  const short = n => esc(String(n).split(' ')[0].slice(0, 6));
  return `<div class="chd-scroll"><table class="chd-t chd-m"><thead><tr><th></th>${P.map(n => `<th title="${esc(n)}">${short(n)}</th>`).join('')}</tr></thead><tbody>`
    + P.map(x => `<tr><th>${esc(x)}</th>${P.map(y => (x === y ? '<td class="chd-self"></td>' : `<td style="background:${bondCol(b(x, y))}" title="${esc(x)} – ${esc(y)}: ${b(x, y)}">${b(x, y).toFixed(1)}</td>`)).join('')}</tr>`).join('')
    + '</tbody></table></div><div class="chd-n">As the episode ended. Green close, blue friends, brown tension, red enemies.</div>';
}

function alliesTab(row) {
  const I = row.ch?.intel?.end || row.ch?.intel?.start;
  if (!I) return '<div class="chd-n">This episode was saved without its record.</div>';
  let h = '<h4>Alliances</h4>' + (I.alliances.length ? table(['Name', 'Leader', 'Members'], I.alliances.map(a => [esc(a.name), esc(a.leader), esc(a.members.join(', '))])) : '<div class="chd-n">None.</div>');
  if (I.gone?.length) h += `<div class="chd-n">Broken up: ${esc(I.gone.join(', '))}</div>`;
  h += '<h4>Deals</h4>' + (I.deals.length ? table(['Between', 'Kind'], I.deals.map(d => [esc(`${d.a} & ${d.b}`), esc(d.tier)])) : '<div class="chd-n">None standing.</div>');
  if (I.broken?.length) h += `<div class="chd-n">Broken: ${esc(I.broken.map(d => `${d.a} & ${d.b}`).join(', '))}</div>`;
  h += '<h4>Couples</h4>' + (I.couples.length ? `<div class="chd-n">${esc(I.couples.map(c => c.join(' & ')).join(' · '))}</div>` : '<div class="chd-n">None.</div>');
  return h;
}

function directorTab(row) {
  const aired = row.ch?.aired || [];
  return table(['#', 'Day', 'Kind', 'Who', 'Where', 'Lines'], aired.map((a, i) => [String(i + 1), String(a.day ?? ''), esc(a.kind), esc((a.who || []).slice(0, 5).join(', ')), esc(a.spot || ''), String((a.lines || []).length)]))
    + `<div class="chd-n">${aired.length} scenes aired, ${aired.reduce((n, a) => n + (a.lines || []).length, 0)} lines.</div>`;
}

const BUILD = { episode: episodeTab, votes: votesTab, players: playersTab, bonds: bondsTab, allies: alliesTab, director: directorTab };

/** The Debug screen's HTML for an episode row (every tab built; the buttons show one). */
export function chDebugHtml(row) {
  const on = BUILD[tabNow()] ? tabNow() : 'episode';
  return `<style>${CSS}</style><div class="chd" data-ep="${esc(row.num)}">
    <div class="chd-head"><b>Debug</b><span>Episode ${esc(row.num)} · what the engine decided, and why</span></div>
    <div class="chd-tabs">${TABS.map(([k, l]) => `<button type="button" class="${k === on ? 'on' : ''}" onclick="chxDebugTab(this,'${k}')">${esc(l)}</button>`).join('')}</div>
    ${TABS.map(([k]) => `<div class="chd-pane" data-pane="${k}" style="${k === on ? '' : 'display:none'}">${(() => { try { return BUILD[k](row); } catch (e) { return `<div class="chd-n">Could not build: ${esc(e.message)}</div>`; } })()}</div>`).join('')}
  </div>`;
}
export function chxDebugTab(btn, k) {
  try { localStorage.setItem('ch_debug_tab', k); } catch { /* per viewer */ }
  const root = btn.closest('.chd'); if (!root) return;
  root.querySelectorAll('.chd-tabs button').forEach(b => b.classList.toggle('on', b === btn));
  root.querySelectorAll('.chd-pane').forEach(p => { p.style.display = p.dataset.pane === k ? '' : 'none'; });
}
if (typeof window !== 'undefined') window.chxDebugTab = chxDebugTab;

const CSS = `
.chd{background:#0f0d0c;color:#f2ece6;font:600 14px/1.4 'Barlow Condensed',system-ui,sans-serif;padding:14px;border:1px solid #34302c}
.chd-head{display:flex;gap:12px;align-items:baseline;margin-bottom:10px}.chd-head b{font:400 22px 'Anton';color:#ff6a1a;letter-spacing:.04em;text-transform:uppercase}
.chd-head span{color:#9c9188}
.chd-tabs{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px}
.chd-tabs button{border:1px solid #34302c;background:#1a1716;color:#9c9188;padding:6px 12px;font:700 13px 'Barlow Condensed';letter-spacing:.06em;text-transform:uppercase;cursor:pointer}
.chd-tabs button.on{background:#ff6a1a;color:#140c08;border-color:#ff6a1a}
.chd h4{font:400 16px 'Anton';letter-spacing:.04em;text-transform:uppercase;color:#ffd21a;margin:14px 0 6px}.chd h4 small{color:#9c9188;font:600 12px 'Barlow Condensed'}
.chd-t{border-collapse:collapse;width:100%;font-size:13px}.chd-t th,.chd-t td{border:1px solid #2a2622;padding:3px 6px;text-align:left;vertical-align:top}
.chd-t th{background:#1a1716;color:#9c9188;font-weight:700;text-transform:uppercase;font-size:11px;letter-spacing:.06em}
.chd-m td{text-align:center;font-size:11px;color:#fff;min-width:30px}.chd-m th{font-size:10px}.chd-self{background:#111}
.chd-scroll{overflow:auto;max-height:70vh}
.chd-n{color:#b7ab9f;font-size:13px;margin:6px 0}
.chd-w{color:#7fe07f}.chd-l{color:#ff7a6e}.chd-m{color:#ffc94a}
.chd-duel{margin:6px 0 2px}
`;
