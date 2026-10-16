// ══════════════════════════════════════════════════════════════════════
// vp-ch-ep/debug.js — The Challenge's Debug screen
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-15: "we need a debug like in Total Drama", then "fix the debug so it's more like the
// Total Drama debug visually". So it is built from the SAME furniture Total Drama and Big Brother use
// (vp-screens.js dbgShell, dbgPanel, dbgPortraitRow, dbgStatTable: the DEBUG DATA title, the episode
// strip, the tab row, tinted panels, portrait rows). The furniture is passed in as `kit` (vp-screens.js
// imports this file, so importing it back would be a cycle).
//
// Everything is read off the episode's row (ch-run.js challengeRows): the daily's order and scores, every
// ballot with its reason, the meetings, the moves made before the vote, the call-outs and promises, the
// duels round by round, and the house as the episode ended (season.js intelSnap): bonds, alliances, deals,
// minds, needs, plans and each player's word.
import { pStats } from '../players.js';
import { players } from '../core.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const TABS = [['episode', 'This Episode'], ['threats', 'Threats &amp; Heat'], ['votes', 'Vote Commitments'], ['moves', 'Working the Room'],
  ['plans', 'Game Plans'], ['minds', 'Minds'], ['deals', 'Deals &amp; Alliances'], ['bonds', 'Bonds'], ['stats', 'Player Stats'], ['director', 'Director']];
const KEY = 'vp_chdebug_tab';
const tabNow = () => { try { return localStorage.getItem(KEY) || 'episode'; } catch { return 'episode'; } };
const archOf = n => (Array.isArray(players) ? players : []).find(p => p.name === n)?.archetype || '';
const intelOf = row => row.ch?.intel?.end || row.ch?.intel?.start || null;

// small pieces in the same palette as the shared furniture
const C = { grey: '#8b949e', text: '#e6edf3', dim: '#6e7681', red: '#f47067', gold: '#f0883e', amber: '#d29922', green: '#3fb950', blue: '#57a6e8', purple: '#a371f7' };
const pill = (t, col = C.grey) => `<span style="display:inline-block;padding:1px 6px;margin:1px 2px;border-radius:9px;font-size:9px;font-weight:700;letter-spacing:.5px;color:${col};border:1px solid ${col}55;background:${col}18">${t}</span>`;
const cell = (t, col = C.grey, w = 0) => `<div style="font-size:11px;color:${col};${w ? `min-width:${w}px;text-align:right;` : ''}">${t}</div>`;
const meter = (v, col) => `<div style="display:flex;align-items:center;gap:4px;min-width:84px"><div style="flex:1;height:5px;background:rgba(255,255,255,.07);border-radius:3px;overflow:hidden"><div style="width:${Math.max(0, Math.min(10, v)) * 10}%;height:100%;background:${col}"></div></div><span style="font-size:10px;color:${C.grey};min-width:22px;text-align:right">${(+v).toFixed(1)}</span></div>`;
const names = list => list.map(n => `<b style="color:${C.text}">${esc(n)}</b>`).join(', ');

function episodeTab(row, K) {
  const ch = row.ch || {};
  let h = '';
  const d = ch.daily;
  if (d) {
    const sc = d.scores || {};
    const unitScore = u => u.reduce((a, n) => a + (sc[n] || 0), 0) / Math.max(1, u.length);
    h += K.dbgPanel(`THE DAILY — ${esc(d.name).toUpperCase()} <span style="color:${C.grey};font-weight:600">(${esc(d.mode || '')})</span>`, 'gold',
      (d.order || []).map((u, i) => {
        const won = (d.winners || []).some(w => u.includes(w)), last = (d.last || []).some(w => u.includes(w));
        const threw = (d.throws || []).filter(w => u.includes(w));
        const tag = u.length > 1 ? ` <span style="color:${C.grey};font-weight:400">&amp; ${esc(u.slice(1).join(' & '))}</span>` : '';
        return K.dbgPortraitRow(u[0], cell(`#${i + 1}`, C.grey, 26) + cell(unitScore(u).toFixed(2), C.text, 40)
          + `<div style="min-width:120px;text-align:right">${won ? pill('WON', C.green) : ''}${last ? pill('LAST', C.red) : ''}${threw.length ? pill(`THREW: ${esc(threw.join(', '))}`, C.amber) : ''}</div>`, { tag });
      }).join('')
      + ((d.caught || []).length ? K.dbgNote(`Caught throwing: ${d.caught.map(c => `${esc(c.thrower)} (seen by ${esc(c.by)})`).join(' · ')}`) : '')
      + ((d.moments || []).length ? K.dbgNote(`Moments: ${d.moments.map(m => `${esc(m.kind)} (${esc([].concat(m.who || []).join(', '))})`).join(' · ')}`) : '')
      + ((d.injuries || []).length ? K.dbgNote(`Injured: ${esc(d.injuries.join(', '))}`) : ''));
  }
  for (const c of ch.callouts || []) {
    const prom = c.promise === 'kept' ? pill('KEPT THE THREAT', C.green) : c.promise === 'broken' ? pill(`BROKE A THREAT TO ${esc(c.promisedAt)}`, C.red) : '';
    h += K.dbgPanel(`THE CALL-OUT — ${esc(c.by).toUpperCase()}`, 'amber',
      K.dbgPortraitRow(c.by, `<div style="font-size:11px;color:${C.grey}">calls out</div>` + cell(`<b style="color:${C.text}">${esc(c.opponent)}</b>`) + `<div style="min-width:150px;text-align:right">${pill(esc(c.reason || ''), C.amber)}${prom}</div>`)
      + ((c.ranked || []).length ? K.dbgNote(`How ${esc(c.by)} scored the options: ${c.ranked.map(r => `${esc(r.name)} ${r.total}`).join(' · ')}`) : ''));
  }
  for (const x of ch.duels || []) {
    const flags = [x.upset && pill('UPSET', C.purple), x.comeback && pill('COMEBACK', C.blue), x.volunteer && pill('VOLUNTEER', C.amber)].filter(Boolean).join('');
    h += K.dbgPanel(`THE ARENA — ${esc(x.name).toUpperCase()}`, 'red',
      K.dbgPortraitRow(x.winner, `${pill('WON', C.green)}${flags}`) + K.dbgPortraitRow(x.loser, pill('WENT HOME', C.red), { dim: true })
      + (x.beats || []).map((b, i) => K.dbgRow(`${i + 1}. ${esc(b.kind)}${b.n ? ` ${b.n}` : ''}`,
        b.score ? esc(Object.entries(b.score).map(([n, v]) => `${n} ${v}`).join(' – ')) + (b.winner ? ` → <b>${esc(b.winner)}</b>` : '')
          : b.ahead ? `${esc(b.ahead)} ahead (margin ${b.margin})` : b.winner ? `<b>${esc(b.winner)}</b> finishes first` : '')).join(''));
  }
  const exits = row.exits || [];
  if (exits.length) h += K.dbgPanel('OUT THIS EPISODE', 'grey', exits.map(e => K.dbgPortraitRow(e.name || e, cell(esc(e.verb || e.channel || '')) + cell(e.by ? `by ${esc(e.by)}` : ''), { dim: true })).join(''));
  return h || K.dbgEmpty('Nothing recorded.');
}

function threatsTab(row, K) {
  const I = intelOf(row);
  if (!I) return K.dbgEmpty('This episode was saved without its record.');
  const ch = row.ch || {};
  const votes = {};
  for (const v of ch.votes || []) for (const b of v.ballots || []) votes[b.target] = (votes[b.target] || 0) + 1;
  const aimed = {};
  for (const [n, p] of Object.entries(I.plans || {})) for (const [t] of p?.targets || []) (aimed[t] ||= []).push(n);
  const list = [...I.players].sort((a, b) => ((aimed[b] || []).length * 2 + (votes[b] || 0)) - ((aimed[a] || []).length * 2 + (votes[a] || 0)));
  return K.dbgPanel('WHO THE HOUSE IS AIMING AT', 'red', list.map(n => {
    const r = I.rec?.[n] || {};
    const w = I.word?.[n];
    return K.dbgPortraitRow(n, cell(`${(aimed[n] || []).length} target${(aimed[n] || []).length === 1 ? '' : 's'}`, (aimed[n] || []).length >= 3 ? C.red : C.grey, 64)
      + cell(`${votes[n] || 0} vote${votes[n] === 1 ? '' : 's'} today`, votes[n] ? C.amber : C.dim, 78)
      + cell(`Arena ${r.arenaW || 0}-${r.arenaL || 0}`, r.arenaW ? C.green : C.grey, 64)
      + cell(`in ${r.votedIn || 0}×`, C.grey, 40)
      + `<div style="min-width:90px;text-align:right">${w ? pill(`WORD ${w > 0 ? '+' : ''}${w}`, w > 0 ? C.green : C.red) : ''}</div>`)
      + ((aimed[n] || []).length ? K.dbgNote(`Targeted by ${esc(aimed[n].join(', '))}`) : '');
  }).join(''));
}

function votesTab(row, K) {
  const ch = row.ch || {};
  let h = '';
  for (const m of ch.meetings || []) {
    const col = r => (r === 'yes' || r === 'organiser' ? C.green : r === 'refuses' ? C.red : r === 'false-yes' ? C.purple : C.amber);
    h += K.dbgPanel(`MEETING — ${esc(m.name || 'an alliance').toUpperCase()} → ${esc(m.target).toUpperCase()}`, 'purple',
      Object.entries(m.responses || {}).map(([n, r]) => K.dbgPortraitRow(n, pill(esc(r).toUpperCase(), col(r)))).join(''));
  }
  for (const p of ch.pitches || []) h += K.dbgRow(`${esc(p.by)} asks ${esc(p.to)}`, `vote ${esc(p.target)} — <b>${esc(p.answer)}</b>`);
  for (const v of ch.votes || []) {
    const tb = v.tiebreak ? ` <span style="color:${C.grey}">(tie${v.tiebreak.by?.length ? `, broken by ${esc(v.tiebreak.by.join(', '))}` : ', drawn'})</span>` : '';
    h += K.dbgPanel(`THE VOTE — ${esc(v.votedIn || '?').toUpperCase()} GOES IN${tb}`, 'gold',
      (v.ballots || []).map(b => K.dbgPortraitRow(b.voter,
        cell(`→ <b style="color:${C.text}">${esc(b.target)}</b>`, C.grey, 0)
        + `<div style="min-width:220px;text-align:right">${b.wanted && b.wanted !== b.target ? pill(`WANTED ${esc(b.wanted)}`, C.blue) : ''}${b.asked && b.asked !== b.target ? pill(`ASKED ${esc(b.asked)}`, C.amber) : ''}${pill(esc(b.why || ''), b.flip ? C.red : C.grey)}${b.flip ? pill('FLIP', C.red) : ''}</div>`)).join('')
      + K.dbgNote(`Tally: ${Object.entries(v.tally || {}).sort((a, b) => b[1] - a[1]).map(([n, c]) => `${esc(n)} ${c}`).join(' · ')}`));
  }
  if (ch.volunteer) h += K.dbgPanel('A VOLUNTEER', 'amber', K.dbgPortraitRow(ch.volunteer.name, cell(ch.volunteer.target ? `wants ${esc(ch.volunteer.target)}` : 'no target named')));
  return h || K.dbgEmpty('No vote this episode.');
}

const MOVE = {
  threat: c => [`threatens <b>${esc(c.at)}</b>`, c.bluff ? pill('BLUFF', C.amber) : '', pill(`CREDIBLE ${c.credible}`, c.credible >= 0.6 ? C.red : C.grey), c.doubted ? pill('DOUBTED', C.red) : ''],
  counter: c => [`puts up <b>${esc(c.alt)}</b> instead`, c.moved?.length ? pill(`MOVED ${esc(c.moved.join(', '))}`, C.green) : '', c.held?.length ? pill(`HELD ${esc(c.held.join(', '))}`, C.grey) : ''],
  spare: c => [`offers <b>${esc(c.to)}</b> a deal`, pill(esc(c.answer).toUpperCase(), c.answer === 'accepted' ? C.green : c.answer === 'false' ? C.purple : C.red)],
  plea: c => [`pleads with <b>${esc(c.to)}</b>`, pill(c.moved ? 'MOVED' : 'HELD', c.moved ? C.green : C.grey)],
  outing: c => ['outs the alliance hunting them', pill('PUBLIC', C.red)],
};
function movesTab(row, K) {
  const list = row.ch?.campaigns || [];
  if (!list.length) return K.dbgEmpty('Nobody worked the room this episode.');
  const by = {};
  for (const c of list) (by[c.from] ||= []).push(c);
  return Object.entries(by).map(([n, cs]) => K.dbgPanel(`${esc(n).toUpperCase()} — ${cs.length} MOVE${cs.length > 1 ? 'S' : ''}`, 'purple',
    cs.map(c => { const [t, ...p] = (MOVE[c.kind] || (() => [esc(c.kind)]))(c); return K.dbgPortraitRow(n, cell(t, C.text) + `<div style="min-width:200px;text-align:right">${p.join('')}</div>`); }).join(''))).join('')
    + K.dbgNote('A threat is a promise: at the call-out it pulls toward the person threatened; breaking it costs the player their word.');
}

function plansTab(row, K) {
  const I = intelOf(row);
  if (!I?.plans) return K.dbgEmpty('This episode was saved without its plans.');
  const STYLE = { architect: C.purple, structured: C.blue, reactive: C.grey };
  return K.dbgPanel('WHAT EACH OF THEM IS TRYING TO DO', 'blue', I.players.map(n => {
    const p = I.plans[n];
    if (!p) return K.dbgPortraitRow(n, cell('no plan', C.dim));
    return K.dbgPortraitRow(n, `<div style="min-width:80px;text-align:right">${pill(esc(p.style).toUpperCase(), STYLE[p.style] || C.grey)}</div>`)
      + K.dbgNote([p.targets.length && `<span style="color:${C.red}">targets</span> ${p.targets.map(([t, why]) => `<b style="color:${C.text}">${esc(t)}</b>${why ? ` <i>(${esc(why)})</i>` : ''}`).join(', ')}`,
        p.core.length && `<span style="color:${C.green}">trusts</span> ${names(p.core)}`,
        p.shield && `<span style="color:${C.blue}">shield</span> ${names([p.shield])}`,
        p.revenge.length && `<span style="color:${C.amber}">revenge</span> ${names(p.revenge)}`,
        p.finalWith.length && `<span style="color:${C.purple}">final with</span> ${names(p.finalWith)}`].filter(Boolean).join(' · ') || 'nothing yet');
  }).join(''));
}

function mindsTab(row, K) {
  const I = intelOf(row);
  if (!I?.mind) return K.dbgEmpty('This episode was saved without its minds.');
  const M = [['energy', C.green], ['confidence', C.blue], ['paranoia', C.red], ['morale', C.gold], ['homesick', C.purple]];
  const head = `<div style="display:flex;gap:8px;padding:2px 8px 6px 34px;font-size:9px;font-weight:800;letter-spacing:1px;color:${C.grey}"><div style="flex:1"></div>${M.map(([k, col]) => `<div style="min-width:84px;color:${col}">${k.toUpperCase()}</div>`).join('')}<div style="min-width:80px;text-align:right">NEED</div></div>`;
  return K.dbgPanel('HOW THEY FEEL, AS THE EPISODE ENDED', 'green', head + I.players.map(n => {
    const m = I.mind[n] || {};
    return K.dbgPortraitRow(n, M.map(([k, col]) => meter(m[k] ?? 0, col)).join('') + `<div style="min-width:80px;text-align:right">${I.psyche?.[n] ? pill(esc(I.psyche[n]).toUpperCase(), C.amber) : ''}</div>`);
  }).join('')) + K.dbgNote('Energy and confidence scale every performance; paranoia, morale and homesickness drive fights, quits and votes.');
}

function dealsTab(row, K) {
  const I = intelOf(row);
  if (!I) return K.dbgEmpty('This episode was saved without its record.');
  let h = I.alliances.length ? I.alliances.map(a => K.dbgPanel(`ALLIANCE — ${esc(a.name).toUpperCase()}`, 'purple',
    a.members.map(n => K.dbgPortraitRow(n, n === a.leader ? pill('LEADER', C.gold) : '')).join(''))).join('') : K.dbgPanel('ALLIANCES', 'purple', K.dbgEmpty('None standing.'));
  if (I.gone?.length) h += K.dbgNote(`Broken up: ${esc(I.gone.join(', '))}`);
  h += K.dbgPanel('DEALS', 'amber', I.deals.length ? I.deals.map(d => K.dbgPortraitRow(d.a, cell(`&amp; <b style="color:${C.text}">${esc(d.b)}</b>`) + `<div style="min-width:80px;text-align:right">${pill(esc(d.tier).toUpperCase(), d.tier === 'spare' ? C.purple : C.amber)}</div>`)).join('') : K.dbgEmpty('None standing.'));
  if (I.broken?.length) h += K.dbgNote(`Broken: ${esc(I.broken.map(d => `${d.a} & ${d.b}`).join(', '))}`);
  h += K.dbgPanel('COUPLES', 'red', I.couples.length ? I.couples.map(([a, b]) => K.dbgPortraitRow(a, cell(`&amp; <b style="color:${C.text}">${esc(b)}</b>`))).join('') : K.dbgEmpty('None.'));
  return h;
}

function bondsTab(row, K) {
  const I = intelOf(row);
  if (!I) return K.dbgEmpty('This episode was saved without its record.');
  const P = I.players;
  const b = (x, y) => I.bonds[x <= y ? `${x}||${y}` : `${y}||${x}`] || 0;
  const col = v => (v >= 6 ? 'rgba(63,185,80,.55)' : v >= 3 ? 'rgba(87,166,232,.4)' : v > -2 ? 'rgba(255,255,255,.03)' : v > -5 ? 'rgba(210,153,34,.4)' : 'rgba(244,112,103,.55)');
  const short = n => esc(String(n).split(' ')[0].slice(0, 5));
  const grid = `<div style="overflow:auto;max-height:70vh"><table style="border-collapse:collapse;font-size:9px;color:${C.grey}"><tr><th></th>${P.map(n => `<th title="${esc(n)}" style="padding:2px;writing-mode:vertical-rl;transform:rotate(180deg);color:${C.text}">${short(n)}</th>`).join('')}</tr>`
    + P.map(x => `<tr><th style="text-align:right;padding:2px 6px;color:${C.text};white-space:nowrap">${esc(x)}</th>${P.map(y => (x === y ? '<td style="background:#0d1117"></td>' : `<td title="${esc(x)} – ${esc(y)}: ${b(x, y)}" style="background:${col(b(x, y))};text-align:center;min-width:24px;padding:2px;color:${C.text}">${b(x, y) ? b(x, y).toFixed(0) : ''}</td>`)).join('')}</tr>`).join('')
    + '</table></div>';
  return K.dbgPanel('BONDS AS THE EPISODE ENDED', 'blue', grid + K.dbgNote('Green close, blue friends, amber tension, red enemies. Hover a square for the exact number.'));
}

function statsTab(row, K) {
  const I = intelOf(row);
  const list = I?.players || row.ch?.house || [];
  const R = n => I?.rec?.[n] || {};
  return K.dbgPanel('PLAYER STATS', 'grey', K.dbgStatTable(list, [
    { label: 'ARCH', value: n => esc(archOf(n)), small: true },
    { label: 'DAILY', value: n => R(n).daily ?? '–', colour: C.gold },
    { label: 'ARENA', value: n => `${R(n).arenaW ?? 0}-${R(n).arenaL ?? 0}`, colour: C.green, bold: true },
    { label: 'IN', value: n => R(n).votedIn ?? '–', colour: C.amber },
    { label: 'VOTES', value: n => R(n).votes ?? '–', colour: C.red },
    // the stakes (ch/stakes.js)
    { label: 'BANK', value: n => (R(n).bank ? `$${Math.round(R(n).bank / 1000)}k` : '–'), colour: C.green },
    { label: 'SKULL', value: n => R(n).skulls || '–', colour: C.red, bold: true },
    { label: 'HURT', value: n => esc(R(n).hurt || '–'), colour: C.amber, small: true },
  ], n => { try { return pStats(n) || {}; } catch { return {}; } }));
}

function directorTab(row, K) {
  const aired = row.ch?.aired || [];
  const byDay = {};
  for (const a of aired) (byDay[a.day ?? '?'] ||= []).push(a);
  return Object.entries(byDay).map(([day, list]) => K.dbgPanel(`DAY ${esc(day)} — ${list.length} SCENES`, 'grey',
    list.map(a => K.dbgRow(`${esc(a.kind)} <span style="color:#4d545c">${esc(a.spot || '')}</span>`, `${esc((a.who || []).slice(0, 5).join(', '))} <span style="color:${C.dim}">· ${(a.lines || []).length} lines</span>`)).join(''))).join('')
    + K.dbgNote(`${aired.length} scenes aired, ${aired.reduce((n, a) => n + (a.lines || []).length, 0)} lines.`);
}

const BUILD = { episode: episodeTab, threats: threatsTab, votes: votesTab, moves: movesTab, plans: plansTab, minds: mindsTab, deals: dealsTab, bonds: bondsTab, stats: statsTab, director: directorTab };

/** The Debug screen for an episode row, in Total Drama's chrome (`kit` = vp-screens.js's debug furniture). */
export function chDebugHtml(row, kit) {
  const tab = BUILD[tabNow()] ? tabNow() : 'episode';
  let body;
  try { body = BUILD[tab](row, kit); } catch (e) { body = kit.dbgEmpty(`Could not build this tab: ${esc(e.message)}`); }
  return kit.dbgShell({ epNum: row.num, allEps: kit.allEps || [], screenId: 'ch-debug', storageKey: KEY, activeTab: tab,
    unit: 'Ep', eyebrow: `Episode ${row.num}`, tabs: TABS, body });
}
