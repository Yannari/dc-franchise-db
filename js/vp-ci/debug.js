// ══════════════════════════════════════════════════════════════════════
// vp-ci/debug.js — the Circle's numbers, at the end of the episode
// ══════════════════════════════════════════════════════════════════════
//
// User (2026-10-01): "fill Debug too, check the debug of the other sims to see
// what's necessary ... make sure we have popularity and it works". Like
// Perfect Match's and the castle's: behind the `vp_debug` switch, after
// everything else, and NOT a viewer's screen — it answers "what is actually
// on the row", which no player knows.
//
// Every number comes from the row (ci/snapshot.js `end`, the aired ratings'
// ballots), never from the engine; a field that is missing says so instead of
// throwing — a debug tab that can crash cannot be opened on the episode that
// broke.
import { esc, nameOf, realOf, isCatfish, ringOf } from './parts.js';

const MIND = ['loneliness', 'paranoia', 'stress', 'guilt', 'elation', 'homesick'];
const DIMS = [['affection', 0, '#3fd8ff'], ['attraction', 1, '#ff4fb4'], ['resentment', 2, '#ff4a6a'], ['trust', 3, '#3fbf7a']];

function gauge(v, lo, hi, color) {
  const pct = Math.max(0, Math.min(100, (v - lo) / (hi - lo) * 100));
  const zero = lo < 0 ? (0 - lo) / (hi - lo) * 100 : 0;
  const left = Math.min(pct, zero), width = Math.abs(pct - zero);
  return `<span class="cdb-g"><i style="left:${left}%;width:${width}%;background:${color}"></i>${lo < 0 ? `<b style="left:${zero}%"></b>` : ''}</span>`;
}

export function circleDebugScreen(row) {
  const end = row?.ci?.end;
  const name = h => esc(nameOf(row, h));
  const who = h => `<span class="cdb-who" style="--r:${ringOf(row, h)}">${name(h)}${isCatfish(row, h) ? ` <i>(${esc(realOf(row, h))}, catfish)</i>` : ''}</span>`;
  const sec = (title, body, note = '') => `<section><h3>${title}</h3>${note ? `<p class="cdb-note">${note}</p>` : ''}${body || '<p class="cdb-none">nothing recorded</p>'}</section>`;
  if (!end) return { id: 'debug', label: 'Debug', html: `<style>${CDB_CSS}</style><div class="cdb"><h2>Debug</h2><p class="cdb-none">This episode was played before its numbers were kept.</p></div>` };
  const people = end.people || [];
  const everyone = [...people, ...(end.leftToday || [])];

  // The audience (public.js): only what aired makes these numbers.
  const pub = end.public || {};
  const popRows = [...everyone].sort((a, b) => (pub[b]?.approval || 0) - (pub[a]?.approval || 0)).map(h => {
    const p = pub[h] || {};
    return `<tr><td>${who(h)}</td><td class="n">${p.approval ?? '—'}</td><td>${gauge(p.approval || 0, -100, 100, (p.approval || 0) >= 0 ? 'linear-gradient(90deg,#ff7ac0,#ff4fb4)' : '#ff4a6a')}</td><td class="n">${p.fame ?? '—'}</td><td>${esc(p.label || '—')}</td></tr>`;
  }).join('');
  const pop = `<table><tr><th>Profile</th><th>Approval</th><th></th><th>Fame</th><th>The audience thinks</th></tr>${popRows}</table>`;

  // Feelings (mind.js), 0..10.
  const mindRows = people.map(h => `<tr><td>${who(h)}</td>${MIND.map(k => {
    const v = end.mind?.[h]?.[k] ?? 0;
    return `<td class="n" title="${k}">${v}</td><td>${gauge(v, 0, 10, k === 'elation' ? '#3fbf7a' : '#ff9a4a')}</td>`;
  }).join('')}</tr>`).join('');
  const mind = `<table><tr><th></th>${MIND.map(k => `<th colspan="2">${k}</th>`).join('')}</tr>${mindRows}</table>`;

  // Who doubts whom; who looks like a threat to whom.
  const doubts = [], threats = [];
  for (const a of people) for (const b of people) {
    if (a === b) continue;
    const [real, threat] = end.beliefs?.[`${a}>${b}`] || [1, 0];
    if (real < 0.6) doubts.push([a, b, real]);
    threats.push([a, b, threat]);
  }
  doubts.sort((x, y) => x[2] - y[2]);
  const doubtHtml = doubts.slice(0, 14).map(([a, b, r]) => `<div>${who(a)} thinks ${who(b)} is real: <b>${Math.round(r * 100)}%</b>${isCatfish(row, b) ? ' <span class="cdb-ok">✓ right to doubt</span>' : ' <span class="cdb-bad">✗ wrong</span>'}</div>`).join('');
  const topThreat = people.map(a => { const t = threats.filter(x => x[0] === a).sort((x, y) => y[2] - x[2])[0]; return t ? `<div>${who(a)} fears ${who(t[1])} most (${t[2]})</div>` : ''; }).join('');

  // Row feels for column.
  const heat = (idx, color) => `<table class="cdb-heat"><tr><th></th>${people.map(h => `<th class="rot"><span>${name(h)}</span></th>`).join('')}</tr>${people.map(a => `<tr><th>${name(a)}</th>${people.map(b => {
    if (a === b) return '<td class="self"></td>';
    const v = end.rel?.[`${a}>${b}`]?.[idx] ?? 0;
    const alpha = Math.min(0.85, Math.abs(v) / 10);
    return `<td style="background:${v === 0 ? 'transparent' : v > 0 ? color : '#ff4a6a'};--a:${alpha};opacity:${v === 0 ? 1 : 0.25 + alpha}" title="${name(a)} → ${name(b)}: ${v}">${v ? Math.round(v) : ''}</td>`;
  }).join('')}</tr>`).join('')}</table>`;

  // Alliances, pacts.
  const alliances = (end.alliances || []).map(a => `<tr><td><b>${esc(a.name)}</b></td><td>${esc(a.status)}${a.brokenBy ? ` by ${a.brokenBy.map(name).join(', ')}` : ''}</td><td>${a.members.map(name).join(', ') || '—'}</td><td>day ${a.day}</td><td>${a.plan ? `rate ${name(a.plan.target)} low (day ${a.plan.day})` : '—'}</td></tr>`).join('');
  const pacts = (end.pacts || []).map(p => `<tr><td>${esc(p.kind)}</td><td>${name(p.a)} ↔ ${name(p.b)}</td><td>day ${p.day}</td><td>${p.kept.length ? p.kept.map(k => (k ? '✓' : '✗')).join(' ') : 'not tested yet'}</td></tr>`).join('');

  // Tonight's ballots (the aired ratings), with why each top and bottom.
  const rated = (row.ci.aired || []).find(s => (s.kind === 'ratings' || s.kind === 'final-ratings') && s.d?.ballots?.length);
  const ballots = rated ? rated.d.ballots.map(b => `<tr><td>${who(b.voter)}</td><td>${b.order.map((t, i) => `<span class="cdb-place">${i + 1}. ${name(t)}${b.reasons?.[i] && (i === 0 || i === b.order.length - 1) ? ` <i>(${esc(b.reasons[i])})</i>` : ''}</span>`).join(' ')}</td></tr>`).join('') : '';

  // How long they have known each other: the newcomers' handicap (state.js familiarity).
  const fresh = people.filter(h => people.filter(o => o !== h).every(o => (end.history?.[[h, o].sort().join('|')] ?? 1) < 1));
  const night = row.ci.night;

  const html = `<style>${CDB_CSS}</style><div class="cdb">
    <h2>Debug · Episode ${esc(row.num)} · Day ${esc(row.day)}</h2>
    <p class="cdb-note">The engine's numbers at the end of the episode. No player sees any of this; the audience sees only what aired, which is all approval and fame are made of.</p>
    ${sec('The night', night ? `<div>format <b>${esc(night.format)}</b>${night.booked ? ' (booked)' : ''}${night.fellBack ? ` — fell back from ${esc(night.fellBack)}` : ''}</div>` : '<div>no blocking night</div>')}
    ${sec('Popularity · the audience', pop, 'public.js: approval −100..100 from what aired (warm chats, heart-to-hearts, a betrayal, a wrongful block…), fame from screen time. It crowns the Fan Favorite and the public twists.')}
    ${sec('Feelings', mind, 'mind.js, 0..10. Loneliness and stress shape who they message; guilt weighs on a catfish.')}
    ${sec('Who doubts whom', doubtHtml, 'beliefs.js: how real a profile seems, under 60%.')}
    ${sec('The biggest threat to each', topThreat)}
    ${DIMS.map(([k, i, c]) => sec(`${k[0].toUpperCase() + k.slice(1)} · row feels for column`, heat(i, c))).join('')}
    ${sec('Alliances', alliances ? `<table><tr><th>Name</th><th>Status</th><th>Members</th><th>Since</th><th>Plan</th></tr>${alliances}</table>` : '')}
    ${sec('Pacts', pacts ? `<table><tr><th>Kind</th><th>Between</th><th>Made</th><th>Kept at the ratings</th></tr>${pacts}</table>` : '')}
    ${sec('Tonight\'s ballots', ballots ? `<table>${ballots}</table>` : '', 'Each voter\'s order, with the reason for their first and last.')}
    ${sec('Still strangers', fresh.length ? fresh.map(who).join(', ') : 'nobody', 'Known to nobody for a week yet: the room rates them lower and finds them easier to block (state.js familiarity).')}
  </div>`;
  return { id: 'debug', label: 'Debug', html };
}

const CDB_CSS = `
.cdb{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11.5px;line-height:1.55;color:#c9d1ff;max-width:1150px;margin:0 auto;padding:18px 20px 60px;background:#06071a}
.cdb h2{font-size:15px;color:#3fd8ff;letter-spacing:.08em;text-transform:uppercase;margin:0 0 4px}
.cdb .cdb-note{color:#8b93c8;margin:0 0 8px}
.cdb section{border:1px solid rgba(63,216,255,.18);border-radius:6px;padding:10px 12px;margin-bottom:10px;background:rgba(139,92,255,.04)}
.cdb section>h3{margin:0 0 6px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#ff7ac0}
.cdb table{border-collapse:collapse;width:100%}
.cdb td,.cdb th{padding:2px 8px 2px 0;text-align:left;vertical-align:middle}
.cdb th{color:#8b93c8;font-weight:600}
.cdb td.n{text-align:right;color:#fff}
.cdb-who{border-left:3px solid var(--r);padding-left:5px;color:#fff}.cdb-who i{color:#ff9ad4;font-style:normal}
.cdb-g{position:relative;display:inline-block;width:120px;height:7px;border-radius:4px;background:rgba(255,255,255,.08);vertical-align:middle}
.cdb-g i{position:absolute;top:0;bottom:0;border-radius:4px}.cdb-g b{position:absolute;top:-2px;bottom:-2px;width:1px;background:rgba(255,255,255,.4)}
.cdb-heat td{width:26px;height:20px;text-align:center;color:#fff;font-size:10px}
.cdb-heat td.self{background:rgba(255,255,255,.05)}
.cdb-heat th{font-size:10px;white-space:nowrap}
.cdb-heat th.rot{height:70px;vertical-align:bottom}.cdb-heat th.rot span{display:inline-block;transform:rotate(-55deg);transform-origin:left bottom;width:16px}
.cdb-ok{color:#3fbf7a}.cdb-bad{color:#ff4a6a}.cdb-none{color:#666b99;font-style:italic}
.cdb-place{display:inline-block;margin-right:8px}.cdb-place i{color:#8b93c8;font-style:normal}
`;
