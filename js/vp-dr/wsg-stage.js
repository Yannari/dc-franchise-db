// ══════════════════════════════════════════════════════════════════════
// vp-dr/wsg-stage.js — "Who should go home tonight, and why?"
// ══════════════════════════════════════════════════════════════════════
//
// User (2026-10-06): "the who should go home twist should have its own well
// made screen, wow and dramatic, and the result should port in Untucked."
// It used to be a run of small cards at the bottom of the critiques.
//
// The stage: the main stage lit red, the queens on the line. Every answer is
// three clicks — the host asks her (she steps into the light), she says the
// name (a red line to the queen she named, who shakes and takes a mark over
// her head), and the named queen answers back (stamped NAMED). Then the
// board: the most-named queen in the spotlight, the rest ranked, the host's
// last line. js/dr/critiques.js decided every answer; the words are
// js/dr/data/wsg-lines.js, picked by who, whom and the episode, so Untucked
// throws back the same sentence the stage said.
import { _shell, _portrait, _judgePortrait } from './style.js';
import { _controls, _state } from './reveal.js';
import { FINALE_STAGE_CSS, shell, engine, face, wireStage } from './finale-stage.js';
import { wsgScript } from '../dr/data/wsg-lines.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* What she said it about: the reason as the screen names it. The real
   answers come from a small vocabulary (tools/dr-real-who-should-go.py). */
export const WSG_REASON = {
  challenge: 'her performance in the challenge',
  runway: 'her runway look',
  season: 'her track record',
  critiques: 'what the judges just said',
  leader: 'her role as team leader',
  threat: 'she is my biggest competition',
  immunity: 'she has immunity anyway',
  herself: 'she named herself',
};

export const WSG_CSS = `${FINALE_STAGE_CSS}
.fsx.th-wsg{--fx:#ff2d55;--fx2:#ffd66b;background:#14000a;box-shadow:0 30px 80px -30px #000,inset 0 0 0 1px rgba(255,45,85,.3)}
.fsx.th-wsg .fsx-bg::before{background-image:linear-gradient(180deg,rgba(20,0,8,.42),rgba(20,0,8,.66) 55%,rgba(20,0,8,.9)),url(assets/sets/dr/lipsync.webp);filter:saturate(.85)}
.fsx.th-wsg .fsx-rays{background:radial-gradient(60% 50% at 50% 0,rgba(255,45,85,.32),transparent 70%);animation:wsx-pulse 3s ease-in-out infinite}
@keyframes wsx-pulse{50%{opacity:.5}}
.fsx.th-wsg .fsx-title{color:#fff;text-shadow:0 0 6px #ff2d55,0 0 22px #ff2d55,0 0 40px rgba(255,45,85,.55);animation:wsx-flick 5s infinite}
@keyframes wsx-flick{0%,94%,100%{opacity:1}95%{opacity:.45}96.5%{opacity:1}97.5%{opacity:.65}}
.wsx-stage{position:relative;height:300px;margin-top:6px}
.wsx-line{position:absolute;left:2%;right:2%;bottom:20px;display:flex;justify-content:space-around;align-items:flex-end}
.wsx-q{position:relative;display:flex;flex-direction:column;align-items:center;gap:5px;min-width:0;flex:1;transition:transform .6s cubic-bezier(.2,1.3,.4,1),filter .5s,opacity .5s}
.wsx-q .fsx-face{width:clamp(54px,7vw,86px);height:clamp(54px,7vw,86px);box-shadow:0 0 0 3px rgba(255,255,255,.22),0 12px 30px rgba(0,0,0,.7);transition:box-shadow .4s}
.wsx-q b{font:400 clamp(11px,1.3vw,15px)/1 'Anton','Impact',sans-serif;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}
.wsx-stage.live .wsx-q{filter:brightness(.42) saturate(.6)}
.wsx-stage.live .wsx-q.up,.wsx-stage.live .wsx-q.hit{filter:none}
.wsx-q.up{transform:translateY(-30px) scale(1.2);z-index:3}
.wsx-q.up .fsx-face{box-shadow:0 0 0 4px #fff,0 0 40px 8px rgba(255,255,255,.5)}
.wsx-q.up::before{content:'';position:absolute;bottom:-40px;left:50%;width:220px;height:380px;transform:translateX(-50%);z-index:-1;pointer-events:none;
  background:linear-gradient(180deg,rgba(255,255,255,.26),rgba(255,255,255,0) 80%);clip-path:polygon(43% 0,57% 0,100% 100%,0 100%)}
.wsx-q.hit .fsx-face{box-shadow:0 0 0 4px #ff2d55,0 0 40px 8px rgba(255,45,85,.7)}
.wsx-q.hit.jolt{animation:wsx-hit .45s 2}
@keyframes wsx-hit{25%{transform:translateX(-7px)}75%{transform:translateX(7px)}}
.wsx-pips{position:absolute;top:-18px;display:flex;gap:3px}
.wsx-pips i{width:10px;height:10px;border-radius:2px;background:#ff2d55;box-shadow:0 0 8px #ff2d55;transform:rotate(45deg)}
.wsx-pips i.new{animation:wsx-pip .5s backwards}
@keyframes wsx-pip{from{transform:rotate(45deg) scale(3);opacity:0}}
.wsx-tag{position:absolute;top:-46px;padding:3px 10px;border:3px solid #ff2d55;border-radius:6px;color:#ff2d55;background:rgba(0,0,0,.6);
  font:400 15px/1 'Anton','Impact',sans-serif;letter-spacing:.12em;transform:rotate(-8deg);opacity:0}
.wsx-q.tagged .wsx-tag{opacity:1;animation:wsx-stamp .45s cubic-bezier(.2,1.6,.4,1) backwards}
.wsx-tag.self{border-color:#ffd66b;color:#ffd66b}
@keyframes wsx-stamp{from{transform:rotate(-8deg) scale(2.6);opacity:0}}
svg.wsx-laser{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4;overflow:visible}
svg.wsx-laser path{stroke:#ff2d55;stroke-width:4;fill:none;filter:drop-shadow(0 0 6px #ff2d55);stroke-dasharray:1400;stroke-dashoffset:0}
svg.wsx-laser path.draw{stroke-dashoffset:1400;animation:wsx-draw .7s .15s forwards}
@keyframes wsx-draw{to{stroke-dashoffset:0}}
.wsx-say{position:relative;margin:4px auto 0;max-width:760px;min-height:76px;padding:12px 18px;border-radius:14px;background:rgba(10,0,6,.86);
  border:1px solid rgba(255,45,85,.45);box-shadow:0 0 30px rgba(255,45,85,.22);display:flex;gap:12px;align-items:center}
.wsx-say:empty{visibility:hidden}
.wsx-say .who{font:600 10px/1 system-ui,sans-serif;letter-spacing:.3em;color:#ff9db3;text-transform:uppercase}
.wsx-say p{margin:5px 0 0;font:500 clamp(14px,1.6vw,18px)/1.35 Georgia,'Playfair Display',serif;color:#fff}
.wsx-say .chip{display:inline-block;margin-top:7px;padding:3px 10px;border-radius:99px;background:#ff2d55;font:700 9.5px system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase}
.wsx-say.fresh{animation:wsx-in .45s cubic-bezier(.2,1,.3,1)}
@keyframes wsx-in{from{transform:translateY(10px);opacity:0}}
.wsx-board{position:absolute;inset:4px 4% 4px;display:none;grid-template-columns:minmax(150px,210px) 1fr;gap:28px;align-items:center}
.fsx[data-phase=board] .wsx-board{display:grid}
.fsx[data-phase=board] .wsx-line,.fsx[data-phase=board] .wsx-laser{display:none}
.wsx-top{text-align:center}
.wsx-top .fsx-face,.wsx-top .fsx-face img,.wsx-top .fsx-face>*{border-radius:50%;overflow:hidden}
.wsx-top .fsx-face{display:inline-block;width:150px;height:150px;box-shadow:0 0 0 5px #ff2d55,0 0 60px 14px rgba(255,45,85,.6)}
.wsx-top b{display:block;margin-top:8px;font:400 24px/1 'Anton','Impact',sans-serif;letter-spacing:.06em;text-transform:uppercase}
.wsx-top span{font:400 58px/1 'Anton','Impact',sans-serif;color:#ff2d55;text-shadow:0 0 20px #ff2d55}
.wsx-rows{display:flex;flex-direction:column;gap:9px}
.wsx-row{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center}
.wsx-row .fsx-face{width:38px;height:38px}
.wsx-row .bar{height:13px;border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden}
.wsx-row .bar i{display:block;height:100%;width:var(--w);background:linear-gradient(90deg,#a3002a,#ff2d55);box-shadow:0 0 12px #ff2d55;animation:wsx-bar .8s var(--dl) backwards}
@keyframes wsx-bar{from{width:0}}
.wsx-row b{font:400 18px/1 'Anton','Impact',sans-serif}
.wsx-row small{grid-column:2/4;margin-top:-6px;font-size:11px;color:#ffb3c4}
@media (max-width:760px){.wsx-stage{height:250px}.wsx-board{grid-template-columns:1fr;gap:10px}.wsx-top .fsx-face{width:90px;height:90px}.wsx-top span{font-size:36px}}
@media (prefers-reduced-motion:reduce){.fsx.th-wsg .fsx-title,.fsx.th-wsg .fsx-rays,.wsx-q.hit.jolt,svg.wsx-laser path.draw{animation:none}}
/* the cards under the stage: the text of the night */
.dr-wsgq{display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;padding:12px 16px}
.dr-wsgq .dr-sub{display:block;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#ff9db3}
.dr-wsgq-name{margin:4px 0 2px;font-family:'Playfair Display',Georgia,serif;font-size:17px;color:#fff;line-height:1.4}
.dr-wsgq-why{margin:0;font-size:12px;color:#C9A6BC;font-style:italic}
.dr-wsg-self{font-size:9.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#ffd66b;border:1px solid #ffd66b;border-radius:99px;padding:3px 8px}
.dr-wsg{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:start;padding:14px 16px}
.dr-wsg-q{margin:6px 0 12px;font-family:'Playfair Display',Georgia,serif;font-size:16px;color:#fff}
.dr-wsg-board{display:flex;flex-direction:column;gap:6px}
.dr-wsg-row{display:grid;grid-template-columns:auto 1fr auto auto;gap:11px;align-items:center;padding:6px 8px;border-radius:9px;background:rgba(255,255,255,.03)}
.dr-wsg-top{background:linear-gradient(90deg,rgba(255,41,75,.16),rgba(255,41,75,.04))}
.dr-wsg-who{min-width:0}
.dr-wsg-who b{display:block;font-size:13.5px;color:#fff;letter-spacing:.02em}
.dr-wsg-who span{display:block;font-size:11px;color:#C9A6BC;margin-top:2px}
.dr-wsg-who i{display:block;font-size:10.5px;font-style:italic;color:#9E86A8;margin-top:2px}
.dr-wsg-n{font-family:'Space Mono',ui-monospace,monospace;font-size:15px;color:#ff5a6e}
`;

/** The night as data: one entry per click, in order (js/dr/data/wsg-lines.js wsgScript). */
export function wsgSteps(row) {
  const t = row?.dr?.critiqueTwist;
  if (t?.kind !== 'who-should-go' || !t.votes) return [];
  return wsgScript(t.votes, row?.num ?? row?.dr?.ep ?? 0);
}

export function wsgStage(row, steps, { ep, uid = 'x' } = {}) {
  const line = [...new Set(steps.flatMap(s => [s.voter, s.target]).filter(Boolean))];
  const states = steps.map(s => ({
    ...s,
    phase: s.t === 'board' ? 'board' : 'live',
    mood: 'red', hostOn: s.t === 'ask' || s.t === 'board',
    shake: s.t === 'name' && !s.self,
    banner: s.t === 'board' ? { text: 'The room has answered', sub: 'who should go home', red: true }
      : s.t === 'name' && s.self ? { text: 'She named herself', sub: s.voter } : null,
  }));
  const tally = steps.find(s => s.t === 'board')?.tally || {};
  const ranked = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...Object.values(tally));
  const whyOf = n => {
    const c = {};
    for (const s of steps) if (s.t === 'name' && s.target === n) c[s.reason] = (c[s.reason] || 0) + 1;
    const top = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
    return top ? WSG_REASON[top[0]] || '' : '';
  };
  const body = `<div class="wsx-stage">
      <div class="wsx-line">${line.map(n => `<div class="wsx-q" data-q="${esc(n)}"><span class="wsx-pips" data-pips></span>
        <span class="wsx-tag">NAMED</span>${face(n, ep, 86)}<b>${esc(n)}</b></div>`).join('')}</div>
      <svg class="wsx-laser" data-laser></svg>
      <div class="wsx-board">
        ${ranked[0] ? `<div class="wsx-top">${face(ranked[0][0], ep, 150)}<b>${esc(ranked[0][0])}</b><span>${ranked[0][1]}</span></div>` : '<div></div>'}
        <div class="wsx-rows">${ranked.map(([n, k], j) => `<div class="wsx-row">${face(n, ep, 38)}
          <div class="bar"><i style="--w:${Math.round(k / max * 100)}%;--dl:${(j * 0.15).toFixed(2)}s"></i></div><b>${k}</b>
          <small>${esc(whyOf(n))}</small></div>`).join('')}</div>
      </div>
    </div>
    <div class="wsx-say" data-say></div>`;
  const html = shell({ id: `wsx-${uid}`, title: 'Who should go home?', sub: 'the host asks the room, out loud', body, theme: 'wsg' });
  const apply = engine(`wsx-${uid}`, states, (el, st, fresh) => {
    const stage = el.querySelector('.wsx-stage');
    stage.classList.toggle('live', !!st && st.phase === 'live');
    const up = st ? (st.t === 'react' ? st.target : st.voter) : null;
    const hit = st && st.t !== 'ask' && !st.self ? st.target : null;
    const counts = st?.tally || {};
    for (const q of el.querySelectorAll('.wsx-q')) {
      const n = q.dataset.q;
      q.classList.toggle('up', n === up);
      q.classList.toggle('hit', n === hit && n !== up);
      q.classList.toggle('jolt', !!fresh && st?.t === 'name' && n === hit);
      q.classList.toggle('tagged', !!st && st.t === 'react' && n === st.target);
      q.querySelector('.wsx-tag').className = `wsx-tag${st?.self ? ' self' : ''}`;
      q.querySelector('.wsx-tag').textContent = st?.self ? 'HERSELF' : 'NAMED';
      const k = counts[n] || 0;
      const pips = q.querySelector('[data-pips]');
      const isNew = !!fresh && st?.t === 'name' && n === st.target;
      pips.innerHTML = Array.from({ length: k }, (_, i) => `<i${isNew && i === k - 1 ? ' class="new"' : ''}></i>`).join('');
    }
    // The red line from the queen who said it to the queen she named.
    const svg = el.querySelector('[data-laser]');
    svg.innerHTML = '';
    if (st && st.t === 'name' && !st.self) {
      const a = el.querySelector(`.wsx-q[data-q="${CSS.escape(st.voter)}"] .fsx-face`);
      const b = el.querySelector(`.wsx-q[data-q="${CSS.escape(st.target)}"] .fsx-face`);
      const box = stage.getBoundingClientRect();
      if (a && b && box.width) {
        const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        const x1 = ra.left + ra.width / 2 - box.left, y1 = ra.top - box.top;
        const x2 = rb.left + rb.width / 2 - box.left, y2 = rb.top - box.top;
        const lift = Math.min(160, 50 + Math.abs(x2 - x1) * 0.35);
        svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
        svg.innerHTML = `<path class="${fresh ? 'draw' : ''}" d="M${x1} ${y1} Q ${(x1 + x2) / 2} ${Math.min(y1, y2) - lift} ${x2} ${y2}"/>`;
      }
    }
    // Who is speaking, and what.
    const say = el.querySelector('[data-say]');
    if (!st) { say.innerHTML = ''; return; }
    const host = st.t === 'ask' || st.t === 'board';
    const who = host ? 'The host' : st.t === 'react' && !st.self ? st.target : st.t === 'react' ? 'The room' : st.voter;
    const pic = host ? _judgePortrait('rupaul', { stage: true, size: 46 }) : st.t === 'react' && st.self ? '' : _portrait(who, ep, { size: 46 });
    const quoted = !(st.t === 'react' && st.self);
    say.innerHTML = `${pic}<div><div class="who">${esc(who)}</div><p>${quoted ? '&ldquo;' : ''}${esc(st.text)}${quoted ? '&rdquo;' : ''}</p>${
      st.t === 'name' ? `<span class="chip">${esc(WSG_REASON[st.reason] || '')}</span>` : ''}</div>`;
    if (fresh) { say.classList.remove('fresh'); void say.offsetWidth; say.classList.add('fresh'); }
  });
  return { html, apply, states };
}

/** The screen: the stage pinned on top, one card a click under it, the tally live in the rail. */
export function rpBuildWhoShouldGo(row) {
  const steps = wsgSteps(row);
  if (!steps.length) return '';
  const ep = { num: row?.num ?? row?.dr?.ep ?? 0, format: 'drag-race', dr: row?.dr || {} };
  const st = wsgStage(row, steps, { ep, uid: `w${ep.num}` });
  wireStage('wsg', st, ep, _state);
  const tally = steps.at(-1).tally;
  const most = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0];
  const cards = steps.map((s, i) => {
    const id = `dr-step-wsg-${i}`;
    if (s.t === 'ask') {
      return `<div class="dr-step" id="${id}"><div class="dr-panel dr-a-room dr-wsgq">
        ${_judgePortrait('rupaul', { stage: true, size: 44 })}
        <div><span class="dr-sub">the host asks ${esc(s.voter)}</span><p class="dr-wsgq-ask">&ldquo;${esc(s.text)}&rdquo;</p></div><span></span></div></div>`;
    }
    if (s.t === 'name') {
      return `<div class="dr-step" id="${id}"><div class="dr-panel dr-a-room dr-wsgq">
        ${_portrait(s.voter, ep, { size: 44 })}
        <div><span class="dr-sub">${esc(s.voter)} answers</span>
          <p class="dr-wsgq-name">&ldquo;${esc(s.text)}&rdquo;</p>
          <p class="dr-wsgq-why">${esc(WSG_REASON[s.reason] || 'she did not say')}</p></div>
        ${s.self ? '<span class="dr-wsg-self">named herself</span>' : ''}</div></div>`;
    }
    if (s.t === 'react') {
      return `<div class="dr-step" id="${id}"><div class="dr-panel dr-a-bond dr-wsgq">
        ${_portrait(s.target, ep, { size: 44 })}
        <div><span class="dr-sub">${s.self ? 'the room' : `${esc(s.target)}, named by ${esc(s.voter)}`}</span>
          <p class="dr-wsgq-react">${s.self ? esc(s.text) : `&ldquo;${esc(s.text)}&rdquo;`}</p></div><span></span></div></div>`;
    }
    // The board: most named first; who said it, and what they held against her.
    const names = Object.keys(s.tally).sort((a, b) => (s.tally[b] || 0) - (s.tally[a] || 0));
    const board = names.map(n => {
      const by = steps.filter(x => x.t === 'name' && x.target === n).map(x => x.voter);
      const why = {};
      for (const x of steps) if (x.t === 'name' && x.target === n) why[x.reason] = (why[x.reason] || 0) + 1;
      const top = Object.entries(why).sort((a, b) => b[1] - a[1])[0];
      return `<div class="dr-wsg-row${n === most ? ' dr-wsg-top' : ''}">
        ${_portrait(n, ep, { size: 38 })}
        <div class="dr-wsg-who"><b>${esc(n)}</b><span>${by.map(esc).join(', ')}</span>${top ? `<i>${esc(WSG_REASON[top[0]] || '')}</i>` : ''}</div>
        ${by.includes(n) ? '<span class="dr-wsg-self">named herself</span>' : '<span></span>'}
        <span class="dr-wsg-n">${s.tally[n] || 0}</span></div>`;
    }).join('');
    return `<div class="dr-step" id="${id}"><div class="dr-panel dr-a-room dr-wsg">
      ${_judgePortrait('rupaul', { stage: true, size: 44 })}
      <div><span class="dr-sub">the room has answered</span>
        <p class="dr-wsg-q">&ldquo;Who should go home tonight, and why?&rdquo;</p>
        <div class="dr-wsg-board">${board}</div>
        <p class="dr-wsgq-why" style="margin-top:10px">&ldquo;${esc(s.text)}&rdquo;</p></div></div></div>`;
  }).join('');
  /* The rail: the tally so far, gated to the click — never ahead of the stage. */
  if (typeof window !== 'undefined') {
    window._drSidebar = window._drSidebar || {};
    window._drSidebar.wsg = steps.map(s => {
      const t = s.tally || {};
      const rows = Object.entries(t).sort((a, b) => b[1] - a[1]);
      return `<h4 class="dr-disp">Named so far</h4>${rows.length ? rows.map(([n, k]) =>
        `<div class="dr-slot">${_portrait(n, ep, { size: 32 })}<div><div class="dr-nm">${esc(n)}</div></div>
          <span class="dr-chip dr-c-btm">${k}</span></div>`).join('')
        : '<p style="margin:8px 0 0;font-size:11px;color:#C9A6BC">Nobody has answered yet.</p>'}`;
    });
  }
  return `<style>${WSG_CSS}</style>${_shell(`${st.html}<div class="dr-hallwrap rmx-cards">${cards}</div>`, ep, {
    phase: 'stage', title: 'Who Should Go Home?', subtitle: 'the host asks the room',
  })}${_controls('wsg', steps.length, ep.num)}`;
}
