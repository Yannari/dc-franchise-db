// ══════════════════════════════════════════════════════════════════════
// vp-dr/challenge.js — the mini, the brief, the draft, prep, and the maxi
// ══════════════════════════════════════════════════════════════════════
//
// The prose is already written (js/dr/data/challenge-beats.js,
// maxi-events.js, maxi-performance.js) and the engine has already decided
// everything. These screens RENDER; they do not compute. A screen that
// called a simulation function would show tonight's answer on a replay of
// episode four.
//
// ── ONE PANEL PER CHALLENGE TYPE, BECAUSE THE DATA IS DIFFERENT ───────
//
// Every maxi writes its own `detail` block per queen, and they share almost
// nothing:
//
//   snatch-game  { character, rounds[6] }        six answers, one per round
//   ball         { theme, looks[{label,sewn}] }  three walks, one sewn
//   roast        { slot, slotKind, bits[], roomTemp, duds }
//   makeover     { partner, resemblance, ownLook, partnerLook }
//   improv       { premise, froze }
//   acting       { script, part, dropped, needs }
//   girl-group   { verse, teamWon, teamMean }     and music-video, rusical
//
// A generic score card over all of that would throw away everything that
// makes a Snatch Game a Snatch Game. So the dispatch is on
// `row.dr.challenge.id`, and anything unrecognised falls to the generic
// card rather than to a blank — a new challenge type is playable the day
// it is written, and looks plain until somebody gives it a panel.
//
// ── AND THE BRIEF IS DRAWN IN FULL ────────────────────────────────────
//
// `desc` from the catalogue is the ONLY place the viewer is told what the
// queens are physically doing. The narration says what happened, not what
// the rules were, so a truncated desc leaves a result nobody can follow.
// That is a project rule with its own test on the Big Brother side.
import { _shell, _portrait, _icon } from './style.js';
import { _controls } from './reveal.js';
import { maxiById } from '../dr/data/challenges.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const n1 = v => (Number.isFinite(Number(v)) ? Number(v).toFixed(1) : '—');
const epOf = row => ({ num: row?.num ?? row?.dr?.ep ?? 0, format: 'drag-race', dr: row?.dr || {} });

export /* THE TRACK AND WHAT IT SOUNDS LIKE. The girl group's theme reached the row
   and no screen read it — the group names rendered, the song they were
   recording did not, which is the same "computed and drawn nowhere" shape as
   everything else this build has turned up. Drawn on the brief, where the
   queens are actually told what they are making. */
function _trackLine(row) {
  const d = _sceneData(row, 'group-parts');
  if (!d?.track) return '';
  return `<p class="dr-track"><b class="dr-disp">&ldquo;${esc(d.track)}&rdquo;</b>`
    + `${d.sound ? ` &mdash; ${esc(d.sound)}` : ''}`
    + `${(d.teamNames || []).length > 1
      ? `<br><span>${d.teamNames.map(n => esc(n)).join(' vs ')}</span>` : ''}</p>`;
}

/** One scene's data off the row, by kind. */
function _sceneData(ep, kind) {
  return (ep?.dr?.scenes || []).find(sc => sc.kind === kind)?.data || null;
}

const CHAL_CSS = `
.dr-perf-line{margin:9px 0 0;color:#f4e3ed;line-height:1.55;text-wrap:pretty}
.dr-track{margin-top:10px;color:#FFC83D;font-size:13px;line-height:1.5}
.dr-track span{color:#C9A6BC}
.dr-brief{padding:18px 22px;margin-bottom:14px;
  background:linear-gradient(180deg,rgba(0,229,255,.10),rgba(10,2,7,.6));
  border:1px solid rgba(0,229,255,.4)}
.dr-brief h3{margin:0 0 8px;font-size:26px;text-wrap:balance}
.dr-brief p{margin:0;color:#eaf7fb;font-size:15px;line-height:1.6;text-wrap:pretty}
.dr-brief .dr-fmt{display:inline-block;font-size:9px;letter-spacing:.2em;text-transform:uppercase;
  padding:3px 10px;margin-bottom:8px;border:1px solid rgba(0,229,255,.6);color:#00E5FF}

.dr-row{display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;
  padding:13px 16px 13px 20px}
.dr-row h3{margin:0;font-size:17px}
.dr-row .dr-sub{font-size:11px;letter-spacing:.1em;color:#C9A6BC}
.dr-score{font-size:22px;font-variant-numeric:tabular-nums;padding:5px 12px;
  border:1px solid currentColor;color:#00E5FF}
.dr-score.dr-hot{color:#FFC83D}
.dr-score.dr-cold{color:#FF294B}

/* A bar of per-round marks — Snatch Game's six, the Ball's three, a roast set. */
.dr-marks{display:flex;gap:5px;margin-top:9px;flex-wrap:wrap}
.dr-mark{min-width:34px;text-align:center;font-size:11px;font-weight:700;padding:4px 6px;
  font-variant-numeric:tabular-nums;background:rgba(255,255,255,.08);
  border-bottom:2px solid var(--m,#00E5FF)}
.dr-mark small{display:block;font-size:8px;letter-spacing:.08em;color:#C9A6BC;font-weight:400}

.dr-tag{display:inline-block;font-size:9px;letter-spacing:.14em;text-transform:uppercase;
  padding:2px 8px;margin-left:6px;border:1px solid currentColor}
.dr-t-warn{color:#FF294B}.dr-t-good{color:#3BE08A}.dr-t-note{color:#FFC83D}

/* The draft board: what is still on it, and who took what. */
.dr-board{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:12px}
.dr-chip-lg{padding:6px 12px;font-size:12px;border:1px solid rgba(255,255,255,.28)}
.dr-chip-lg.dr-taken{opacity:.32;text-decoration:line-through}

/* Teams, side by side. */
.dr-teams{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.dr-team{padding:12px 14px;border:1px solid rgba(255,255,255,.16)}
.dr-team h4{margin:0 0 8px;font-size:12px;letter-spacing:.2em;color:#FFC83D}
.dr-team.dr-won{border-color:rgba(255,200,61,.7);background:rgba(255,200,61,.07)}
.dr-member{display:flex;align-items:center;gap:8px;padding:4px 0;font-size:13px}
.dr-role{margin-left:auto;font-size:9px;letter-spacing:.12em;color:#C9A6BC;text-transform:uppercase}

/* The roast's room temperature, moving down the running order. */
.dr-temp{height:6px;background:rgba(255,255,255,.12);margin-top:8px;overflow:hidden}
.dr-temp i{display:block;height:100%;background:linear-gradient(90deg,#00E5FF,#FFC83D,#FF294B)}
`;

/* ── the pieces ─────────────────────────────────────────────────── */

function marks(list, labels = []) {
  if (!Array.isArray(list) || !list.length) return '';
  return `<div class="dr-marks">${list.map((v, i) => {
    const num = Number(v);
    const hue = num >= 8 ? '#3BE08A' : num >= 6 ? '#00E5FF' : num >= 4 ? '#FFC83D' : '#FF294B';
    return `<span class="dr-mark" style="--m:${hue}">${n1(num)}${
      labels[i] ? `<small>${esc(labels[i])}</small>` : ''}</span>`;
  }).join('')}</div>`;
}

const scoreClass = p => (p >= 8.5 ? 'dr-hot' : p <= 4.5 ? 'dr-cold' : '');

/**
 * The per-type body for one queen's performance.
 *
 * Returns '' for a type with no panel yet, and the caller falls back to the
 * generic card — so a challenge nobody has designed a panel for still plays
 * and still reads, it simply looks plain.
 */
function detailFor(id, perf) {
  const d = perf?.detail || {};
  switch (id) {
    case 'snatch-game':
      return `<div class="dr-sub">as <b>${esc(d.character || '—')}</b>${
        d.dying ? '<span class="dr-tag dr-t-warn">dying</span>' : ''}${
        d.doubleAct ? '<span class="dr-tag dr-t-good">double act</span>' : ''}</div>
        ${marks(d.rounds || [], (d.rounds || []).map((_, i) => `R${i + 1}`))}`;
    case 'ball':
      return `<div class="dr-sub">${esc(d.theme || 'the ball')}</div>
        ${marks((d.looks || []).map(l => l.score), (d.looks || []).map(l =>
    `${l.label}${l.sewn ? ' ✂' : ''}`))}`;
    case 'roast':
      return `<div class="dr-sub">slot ${esc(d.slot ?? '—')} · ${esc(d.slotKind || '')}${
        d.duds ? `<span class="dr-tag dr-t-warn">${esc(d.duds)} dud${d.duds === 1 ? '' : 's'}</span>` : ''}</div>
        ${marks(d.bits || [], (d.bits || []).map((_, i) => `bit ${i + 1}`))}
        ${d.roomTemp !== undefined ? `<div class="dr-temp"><i style="width:${
    Math.max(0, Math.min(100, 50 + Number(d.roomTemp) * 12))}%"></i></div>` : ''}`;
    case 'makeover':
      return `<div class="dr-sub">with <b>${esc(d.partner || '—')}</b></div>
        ${marks([d.resemblance, d.ownLook, d.partnerLook], ['likeness', 'her look', 'theirs'])}`;
    case 'improv':
      return `<div class="dr-sub">${esc(d.premise || '')}${
        d.froze ? '<span class="dr-tag dr-t-warn">froze</span>' : ''}</div>`;
    case 'acting':
      return `<div class="dr-sub"><b>${esc(d.part || '—')}</b> in ${esc(d.script || '')}${
        d.dropped ? '<span class="dr-tag dr-t-warn">dropped a line</span>' : ''}</div>`;
    case 'girl-group': case 'music-video': case 'rusical': case 'singing': case 'rumix':
      return `<div class="dr-sub">${perf.role ? `${esc(perf.role)} · ` : ''}${
        d.teamWon ? '<span class="dr-tag dr-t-good">winning team</span>' : 'team'}</div>
        ${marks([d.verse, d.teamMean], ['her verse', 'the team'])}`;

    /* ── THE NINE THAT HAD NO PANEL ──
       Ten types were rendered and nine were not, and every one of those nine
       carries real detail the engine had already computed — the product she
       was selling, the fabric she was handed, the formation she blew. Their
       cards drew a portrait, a score bar and no words at all.
       It surfaced on `stand-up` alone, and only because a late episode with
       four queens left produced a screen short enough to trip a
       text-length check: the others were padded over the threshold by the
       scenes around them. One instance of a nine-way gap. */
    case 'stand-up':
      return `<div class="dr-sub">slot ${esc(d.slot ?? '—')}${d.slotKind ? ` · ${esc(d.slotKind)}` : ''}${
        d.duds ? `<span class="dr-tag dr-t-warn">${esc(d.duds)} dud${d.duds === 1 ? '' : 's'}</span>` : ''}</div>
        ${marks(d.bits || [], (d.bits || []).map((_, i) => `bit ${i + 1}`))}`;
    case 'photoshoot':
      return `<div class="dr-sub">${esc(d.hazard || 'the shoot')}${
        d.best !== undefined ? `<span class="dr-tag dr-t-good">best ${Number(d.best).toFixed(1)}</span>` : ''}</div>
        ${marks(d.frames || [], (d.frames || []).map((_, i) => `frame ${i + 1}`))}`;
    case 'design':
      return `<div class="dr-sub">out of <b>${esc(d.material || '—')}</b>${
        d.difficulty !== undefined ? ` · difficulty ${esc(d.difficulty)}` : ''}</div>
        ${marks([d.buildQuality], ['the build'])}`;
    case 'talent-show':
      return `<div class="dr-sub"><b>${esc(d.talent || '—')}</b>${
        d.landed === false ? '<span class="dr-tag dr-t-warn">did not land</span>'
    : d.landed ? '<span class="dr-tag dr-t-good">landed it</span>' : ''}</div>`;
    case 'runway-challenge':
      return `<div class="dr-sub">${(d.cats || []).map(c => esc(c)).join(' · ') || 'three looks'}${
        d.repeated ? '<span class="dr-tag dr-t-warn">repeated a look</span>' : ''}</div>
        ${marks(d.walks || [], (d.walks || []).map((_, i) => `look ${i + 1}`))}`;
    case 'lipsync-challenge':
      return `<div class="dr-sub">${esc(d.wins ?? 0)}W &ndash; ${esc(d.losses ?? 0)}L${
        (d.wins || 0) >= 3 ? '<span class="dr-tag dr-t-good">assassin</span>' : ''}</div>`;
    case 'commercial':
      return `<div class="dr-sub">selling <b>${esc(d.product || '—')}</b>${
        d.foundAngle ? '<span class="dr-tag dr-t-good">found the angle</span>'
    : '<span class="dr-tag dr-t-warn">never found the angle</span>'}</div>`;
    case 'choreography':
      return `<div class="dr-sub">${d.solo ? 'took the solo' : 'in the line'}${
        d.blewFormation ? '<span class="dr-tag dr-t-warn">blew the formation</span>' : ''}</div>`;
    default:
      return '';
  }
}

function perfCard(name, perf, i, suffix, ep, id) {
  const body = detailFor(id, perf);
  return `<div class="dr-step" id="dr-step-${suffix}-${i}">
    <div class="dr-panel dr-a-score dr-row">
      ${_portrait(name, ep, { size: 54, station: true })}
      <div><h3 class="dr-disp">${esc(name)}${
    perf?.moment ? '<span class="dr-tag dr-t-note">moment</span>' : ''}</h3>${body}</div>
      <span class="dr-score dr-disp ${scoreClass(perf?.perf)}">${n1(perf?.perf)}</span>
    </div></div>`;
}

/* ── the screens ────────────────────────────────────────────────── */

/** The mini: who won it and what the win buys. */
export function rpBuildMini(row) {
  const ep = epOf(row);
  const m = row?.dr?.mini;
  if (!m) return '';
  const scenes = (row.dr.scenes || []).filter(s => s.step === 'mini' && s.text);
  const BUYS = {
    'first-pick': 'first pick of the draft',
    captain: 'she picks the teams',
    immunity: 'immunity from tonight',
    advantage: 'an advantage in the maxi',
  };
  const lead = `<div class="dr-brief">
    <span class="dr-fmt">Mini challenge</span>
    <h3 class="dr-disp">${esc(m.name)}</h3>
    <p><b>${esc(m.winner)}</b> takes it — and with it, ${esc(BUYS[m.buys] || m.buys || 'the bragging rights')}.</p>
  </div>`;
  const steps = scenes.map((sc, i) => {
    const who = (sc.data?.players || [])[0];
    return `<div class="dr-step" id="dr-step-mini-${i}">
      <div class="dr-panel dr-a-score dr-row">
        ${who ? _portrait(who, ep, { size: 46 }) : '<span></span>'}
        <div>${who ? `<h3 class="dr-disp">${esc(who)}</h3>` : ''}
          <p style="margin:4px 0 0;color:#f4e3ed">${esc(sc.text)}</p></div>
        <span></span>
      </div></div>`;
  }).join('');
  if (typeof window !== 'undefined') {
    window._drSidebar = window._drSidebar || {};
    window._drSidebar.mini = scenes.map(() =>
      `<h4 class="dr-disp">The mini</h4><p style="font-size:13px">${esc(m.name)}<br>
       Won by <b>${esc(m.winner)}</b></p>`);
  }
  return `<style>${CHAL_CSS}</style>${_shell(lead + steps, ep, {
    phase: 'werk', title: 'The Mini Challenge', subtitle: esc(m.name),
    sidebar: `<h4 class="dr-disp">The mini</h4><p style="font-size:13px">${esc(m.name)}</p>`,
  })}${_controls('mini', Math.max(1, scenes.length), ep.num)}`;
}

/**
 * The brief. The catalogue's `desc` IN FULL — it is the only place the
 * viewer learns what the queens are physically doing.
 */
export function rpBuildMaxiAnnounce(row) {
  const ep = epOf(row);
  const ch = row?.dr?.challenge;
  if (!ch) return '';
  const cat = maxiById(ch.id) || {};
  const a = row?.dr?.assignment || {};
  const scenes = (row.dr.scenes || []).filter(s => s.step === 'maxi-announce' && s.text);

  const lead = `<div class="dr-brief">
    <span class="dr-fmt">${esc(cat.format || ch.format || 'maxi challenge')}</span>
    <h3 class="dr-disp">${esc(ch.name)}</h3>
    <p>${esc(cat.desc || 'The brief is on the table.')}</p>
    ${(a.teams || []).length > 1
    ? `<p style="margin-top:10px;color:#C9A6BC;font-size:13px">${a.teams.length} teams.</p>` : ''}
    ${_trackLine(row)}
  </div>`;
  const steps = scenes.map((sc, i) => `<div class="dr-step" id="dr-step-announce-${i}">
    <div class="dr-panel dr-a-room" style="padding:14px 16px 14px 20px">
      <p style="margin:0;color:#f4e3ed">${esc(sc.text)}</p></div></div>`).join('');
  return `<style>${CHAL_CSS}</style>${_shell(lead + steps, ep, {
    phase: 'werk', title: 'The Maxi Challenge', subtitle: 'the brief',
  })}${_controls('announce', Math.max(1, scenes.length), ep.num)}`;
}

/** The draft: pick order, what came off the board, and the collisions. */
export function rpBuildChoice(row) {
  const ep = epOf(row);
  const a = row?.dr?.assignment || {};
  const scenes = (row.dr.scenes || []).filter(s => s.step === 'choice' && s.text);
  const picks = Object.entries(a.picks || {});
  if (!picks.length && !scenes.length) return '';

  const board = picks.length ? `<div class="dr-board">${picks.map(([who, p]) =>
    `<span class="dr-chip-lg dr-taken">${esc(p?.name || p?.role || who)}</span>`).join('')}</div>` : '';

  const steps = scenes.map((sc, i) => {
    const who = (sc.data?.players || [])[0];
    return `<div class="dr-step" id="dr-step-choice-${i}">
      <div class="dr-panel dr-a-bond dr-row">
        ${who ? _portrait(who, ep, { size: 46 }) : '<span></span>'}
        <div>${who ? `<h3 class="dr-disp">${esc(who)}</h3>` : ''}
          <p style="margin:4px 0 0;color:#f4e3ed">${esc(sc.text)}</p></div>
        <span></span>
      </div></div>`;
  }).join('');
  return `<style>${CHAL_CSS}</style>${_shell(board + steps, ep, {
    phase: 'werk', title: 'The Draft', subtitle: 'who takes what',
  })}${_controls('choice', Math.max(1, scenes.length), ep.num)}`;
}

/** Prep: the room at work, and the host's walkthrough. */
export function rpBuildPrep(row) {
  const ep = epOf(row);
  const scenes = (row.dr.scenes || []).filter(s => s.step === 'prep' && s.text);
  if (!scenes.length) return '';
  const steps = scenes.map((sc, i) => {
    const players = sc.data?.players || [];
    const host = /walkthrough|host/.test(sc.kind || '');
    return `<div class="dr-step" id="dr-step-prep-${i}">
      <div class="dr-panel ${host ? 'dr-a-score' : 'dr-a-room'} dr-row">
        ${players.length ? _portrait(players[0], ep, { size: 46, station: !host }) : _icon('sewing')}
        <div>${players.length ? `<h3 class="dr-disp">${esc(players.join(' & '))}</h3>` : ''}
          ${host ? '<span class="dr-sub">the walkthrough</span>' : ''}
          <p style="margin:4px 0 0;color:#f4e3ed">${esc(sc.text)}</p></div>
        <span></span>
      </div></div>`;
  }).join('');
  return `<style>${CHAL_CSS}</style>${_shell(steps, ep, {
    phase: 'werk', title: 'The Work Room', subtitle: 'building it',
  })}${_controls('prep', scenes.length, ep.num)}`;
}

/** The performance itself, with the panel this challenge type deserves. */
export function rpBuildMaxi(row) {
  const ep = epOf(row);
  const ch = row?.dr?.challenge;
  const perfs = row?.dr?.performances || {};
  const names = Object.keys(perfs);
  if (!ch || !names.length) return '';
  const a = row?.dr?.assignment || {};
  const order = (a.order || []).filter(n => perfs[n]);
  const running = order.length ? order : names;

  /* THE GROUP'S OWN NAME. These read "Team 1" and "Team 2" — the girl group
     challenge had no theme at all, so the track was nameless and two identical
     groups performed the same nothing every time it came up. The theme now
     names the night's sound and each group falls out of it. Falls back to the
     number for any challenge that genuinely has unnamed teams. */
  const teamNames = a.teamNames || _sceneData(ep, 'group-parts')?.teamNames || [];
  const teams = (a.teams || []).length > 1 ? `<div class="dr-teams">${
    a.teams.map((team, ti) => {
      const won = team.some(n => perfs[n]?.detail?.teamWon);
      const label = teamNames[ti] || `Team ${ti + 1}`;
      return `<div class="dr-team ${won ? 'dr-won' : ''}">
        <h4 class="dr-disp">${esc(label)}${won ? ' — took it' : ''}</h4>
        ${team.map(n => `<div class="dr-member">${_portrait(n, ep, { size: 30 })}
          ${esc(n)}<span class="dr-role">${esc(perfs[n]?.role || '')}</span></div>`).join('')}
      </div>`;
    }).join('')}</div>` : '';

  /* AND THE NIGHT AS IT WAS WRITTEN. This drew a card per queen — portrait,
     score bar, a detail panel — and dropped every word of the challenge:
     9,452 characters of narration on the row against 657 on the screen. The
     maxi is the longest part of an episode and it was the emptiest.
     Her own lines sit with her card; anything about the room rather than one
     queen (the taping, a bit stolen, the whole cast reacting) runs between
     the cards in the order it happened. */
  const maxiScenes = (row.dr.scenes || []).filter(sc => sc.text
    && /^(perform:|maxi:|chal:performance)/.test(sc.kind || ''));
  const usedScene = new Set();
  const linesFor = name => maxiScenes.filter(sc => {
    if (usedScene.has(sc)) return false;
    const players = sc.data?.players || [];
    if (players[0] !== name) return false;
    usedScene.add(sc);
    return true;
  });

  const steps = running.map((name, i) => {
    const said = linesFor(name)
      .map(sc => `<p class="dr-perf-line">${esc(sc.text)}</p>`).join('');
    const card = perfCard(name, perfs[name], i, 'maxi', ep, ch.id);
    return said
      ? card.replace(/<\/div><\/div>$/, `${said}</div></div>`)
      : card;
  }).join('');

  // Whatever was about the room rather than one queen, after the cards.
  const room = maxiScenes.filter(sc => !usedScene.has(sc))
    .map((sc, i) => `<div class="dr-step" id="dr-step-maxi-room-${i}">
      <div class="dr-panel dr-a-room dr-scene">
        ${(sc.data?.players || []).length
    ? `<span class="dr-who">${(sc.data.players || []).slice(0, 2)
      .map(n => _portrait(n, ep, { size: 42 })).join('')}</span>` : ''}
        <div class="dr-scene-body">${esc(sc.text)}</div>
      </div></div>`).join('');

  /* THE RUNNING ORDER, GATED. The rail shows the queens up to the step the
     viewer has reached and nobody after — a panel carrying a score she has
     not been shown is the spoiler this screen exists to avoid. */
  if (typeof window !== 'undefined') {
    window._drSidebar = window._drSidebar || {};
    window._drSidebar.maxi = running.map((_, i) => `<h4 class="dr-disp">So far</h4>${
      running.slice(0, i + 1)
        .map(n => ({ n, p: Number(perfs[n]?.perf) || 0 }))
        .sort((x, y) => y.p - x.p)
        .map(({ n, p }) => `<div class="dr-slot">${_portrait(n, ep, { size: 32 })}
          <div><div class="dr-nm">${esc(n)}</div></div>
          <span class="dr-chip ${p >= 8 ? 'dr-c-win' : p >= 6 ? 'dr-c-high' : p >= 4 ? 'dr-c-safe' : 'dr-c-low'}">${n1(p)}</span>
        </div>`).join('')}`);
  }

  return `<style>${CHAL_CSS}</style>${_shell(teams + steps + room, ep, {
    phase: 'stage', title: ch.name, subtitle: 'tape rolls',
    sidebar: '<h4 class="dr-disp">So far</h4>',
  })}${_controls('maxi', running.length, ep.num)}`;
}
