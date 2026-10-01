// ══════════════════════════════════════════════════════════════════════
// vp-dr/reunion.js — the reunion as a talk show
// ══════════════════════════════════════════════════════════════════════
//
// The reunion was eight prose cards on the generic renderer. It is a talk
// show now: a lit sofa across the top with the whole cast on it (the queen
// in the seat lifted and lit, the queen answering from the sofa glowing),
// segment title cards, the host on his own card, every queen speaking from a
// bubble with her face beside it, and the stat and award plates in gold —
// the Golden Boot in gold that is not really a compliment.
//
// The rail follows the segments: who has had the seat, and the awards as
// they are handed out — built per step, so it never shows an award early.
import { _shell, _portrait } from './style.js';
import { _controls } from './reveal.js';
import { tagStep } from './music.js';
import { hostCard, HOST_CARD_CSS } from './host-card.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/* Her words bright, the staging around them soft — the host card's rule. */
const said = t => esc(t).replace(/&quot;([^]*?)&quot;/g, '<span class="ru-said">&quot;$1&quot;</span>');

/* The Golden Boot, drawn: an ankle boot on a heel. */
const BOOT = `<svg viewBox="0 0 40 40" width="38" height="38" aria-hidden="true"><path d="M13 4h10v17c0 2 1 3 3 4l7 3c2 1 3 3 3 5v2H22l-3-4-3 4h-4l1-9-2-8z" fill="#FFD66B" stroke="#8a6a1a" stroke-width="1.2" stroke-linejoin="round"/><path d="M12 35h4l1-5" fill="none" stroke="#8a6a1a" stroke-width="1.2"/></svg>`;

const SEG_ICON = {
  open: '✦', numbers: '#', early: '◐', seat: '●', room: '?', feud: '⚡', bonds: '♥', double: '✦✦', awards: '★', winner: '♛', close: '✦',
};

const REUNION_CSS = `
.ru-wrap{position:relative;display:flex;flex-direction:column;gap:14px}
/* THE SOFA: the whole cast, lit by the segment. */
.ru-sofa{position:sticky;top:0;z-index:3;contain:inline-size;padding:10px 10px 8px;border-radius:18px;
  background:radial-gradient(90% 140% at 50% 0%,rgba(123,47,247,.35),transparent 70%),linear-gradient(180deg,#1d0c2a,#12081a);
  border:1px solid rgba(190,140,255,.22);box-shadow:0 14px 30px rgba(0,0,0,.45)}
.ru-sofa-row{display:flex;flex-wrap:wrap;justify-content:center;gap:6px 6px}
.ru-q{display:flex;flex-direction:column;align-items:center;gap:2px;width:52px;transition:transform .35s,opacity .35s,filter .35s}
.ru-q .dr-por{border-radius:50%;border:2px solid rgba(255,255,255,.18)}
.ru-q small{font:600 9px/1.15 system-ui,sans-serif;color:#cdb8d8;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:52px}
.ru-q.ru-crown .dr-por{border-color:#FFD66B;box-shadow:0 0 14px rgba(255,214,107,.55)}
.ru-q.ru-crown small::before{content:"♛ ";color:#FFD66B}
.ru-sofa[data-live] .ru-q{opacity:.42;filter:saturate(.5)}
.ru-sofa .ru-q.ru-on{opacity:1;filter:none;transform:translateY(-6px) scale(1.12)}
.ru-sofa .ru-q.ru-on .dr-por{border-color:#FF3D9A;box-shadow:0 0 0 3px rgba(255,61,154,.35),0 0 20px rgba(255,61,154,.5)}
.ru-sofa .ru-q.ru-talk{opacity:1;filter:none}
.ru-sofa .ru-q.ru-talk .dr-por{border-color:#9be7ff;box-shadow:0 0 16px rgba(155,231,255,.5)}
/* On a phone the sofa is one row you can swipe, not three rows of faces. */
@media (max-width:640px){.ru-sofa-row{flex-wrap:nowrap;justify-content:flex-start;overflow-x:auto;scrollbar-width:none;padding-top:6px}
  .ru-q{flex:0 0 auto}}
.ru-sofa-seg{margin:8px 0 0;text-align:center;font:700 10px/1 system-ui,sans-serif;letter-spacing:.3em;text-transform:uppercase;color:#bfa6ff}
/* A SEGMENT'S TITLE CARD. */
.ru-seg{position:relative;padding:22px 20px;border-radius:16px;text-align:center;overflow:hidden;
  background:linear-gradient(135deg,#3b0f4d,#170922 60%,#2b0b24);border:1px solid rgba(255,61,154,.3)}
.ru-seg::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 22px,rgba(255,255,255,.03) 22px 23px)}
.ru-seg-ic{display:block;font-size:22px;color:#FF3D9A;margin-bottom:6px}
.ru-seg h3{margin:0;font:800 clamp(20px,4.4vw,30px)/1.1 'Anton','Impact',system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#fff}
.ru-seg p{margin:6px 0 0;color:#f3b9d6;font-size:14px}
.ru-seg .ru-seg-pors{display:flex;justify-content:center;gap:10px;margin-top:12px}
.ru-seg .ru-seg-pors .dr-por{border-radius:50%;border:3px solid #FF3D9A;box-shadow:0 0 22px rgba(255,61,154,.5)}
.dr-step.dr-vis .ru-seg{animation:ruSegIn .6s cubic-bezier(.2,1.3,.3,1) both}
@keyframes ruSegIn{0%{opacity:0;transform:scale(.92);letter-spacing:.3em}100%{opacity:1;transform:none}}
/* A QUEEN SPEAKS. */
.ru-talk{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:start}
.ru-talk.ru-right{grid-template-columns:1fr auto}
.ru-talk.ru-right .ru-who{order:2}
.ru-who{display:flex;flex-direction:column;align-items:center;gap:4px;width:66px}
.ru-who .dr-por{border-radius:50%;border:2px solid rgba(255,255,255,.3)}
.ru-who small{font:700 10px/1.15 system-ui,sans-serif;color:#f7c9dd;text-align:center}
.ru-bubble{position:relative;padding:13px 16px;border-radius:16px;background:#221327;border:1px solid rgba(255,255,255,.1);
  color:#c9b3c2;font-size:15.5px;line-height:1.55;text-wrap:pretty}
.ru-bubble .ru-said{color:#fff;font-weight:500}
.ru-talk:not(.ru-right) .ru-bubble{border-top-left-radius:4px}
.ru-talk.ru-right .ru-bubble{border-top-right-radius:4px;background:#1a1a2c}
.ru-talk.ru-hot .ru-bubble{border-color:rgba(255,61,154,.45);background:linear-gradient(135deg,#34122b,#1f0c1c)}
.ru-talk.ru-warm .ru-bubble{border-color:rgba(59,224,138,.35)}
/* The room: a wide stage direction. */
.ru-room{padding:12px 18px;border-left:3px solid #7B2FF7;background:rgba(123,47,247,.08);border-radius:0 12px 12px 0;
  color:#d9c9ea;font-size:15px;line-height:1.55;font-style:italic}
.ru-room .ru-said{font-style:normal;color:#fff}
/* A NUMBER, AN AWARD. */
.ru-plate{display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;padding:14px 18px;border-radius:14px;
  background:linear-gradient(135deg,#2a2210,#140f06);border:1px solid rgba(255,214,107,.35)}
.ru-plate .dr-por{border-radius:50%;border:2px solid #FFD66B}
.ru-plate-k{font:700 10px/1 system-ui,sans-serif;letter-spacing:.24em;text-transform:uppercase;color:#FFD66B}
.ru-plate-n{margin-top:4px;font:800 19px/1.15 system-ui,sans-serif;color:#fff}
.ru-plate-d{margin-top:3px;color:#d9c79b;font-size:13px}
.ru-plate-v{font:800 30px/1 'Anton','Impact',system-ui,sans-serif;color:#FFD66B}
.ru-award{background:radial-gradient(120% 160% at 100% 0%,rgba(255,214,107,.28),transparent 55%),linear-gradient(135deg,#33260a,#140f06)}
.ru-award .ru-plate-v{font-size:34px}
.ru-award.ru-boot{background:linear-gradient(135deg,#2a1d10,#120d08);border-style:dashed}
.dr-step.dr-vis .ru-award{animation:ruAward .9s ease-out both}
@keyframes ruAward{0%{opacity:0;transform:translateY(12px) scale(.96)}55%{box-shadow:0 0 0 0 rgba(255,214,107,.55)}100%{opacity:1;transform:none;box-shadow:0 0 0 18px rgba(255,214,107,0)}}
@container (max-width:420px){.ru-talk,.ru-talk.ru-right{grid-template-columns:1fr}.ru-talk.ru-right .ru-who{order:0}.ru-who{flex-direction:row;width:auto}}
.dr-step:has(> .ru-talk){container-type:inline-size}
.ru-rail-seg{font:700 10px/1 system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#bfa6ff;margin:10px 0 6px}
.ru-rail-aw{display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12px;color:#f3e2b0}
.ru-rail-aw b{color:#FFD66B;font-weight:700}
`;

/** Who is SPEAKING a queen card: an explicit name, else the seat's queen. */
const speakerOf = sc => sc.data?.speakerName || (sc.data?.players || [])[0] || null;

export function rpBuildReunion(row) {
  const ep = { num: row?.num ?? row?.dr?.ep ?? 0, format: 'drag-race', dr: row?.dr || {} };
  const ru = row?.dr?.reunion;
  const scenes = (row?.dr?.scenes || []).filter(sc => sc.kind !== 'reunion-open');
  if (!ru) return '';
  const cast = ru.cast || [];
  const winners = ru.winners || [];

  let side = 0;   // alternate the bubbles, so a conversation reads as two people
  let lastSpeaker = null;
  const card = (sc, i) => {
    const d = sc.data || {};
    const id = `dr-step-reunion-${i}`;
    if (d.speaker === 'segment') {
      const pors = (d.players || []).map(n => _portrait(n, ep, { size: 64 })).join('');
      return `<div class="dr-step" id="${id}"><div class="ru-seg"><span class="ru-seg-ic">${SEG_ICON[d.seg] || '✦'}</span>
        <h3>${esc(d.title)}</h3>${d.sub ? `<p>${esc(d.sub)}</p>` : ''}${pors ? `<div class="ru-seg-pors">${pors}</div>` : ''}</div></div>`;
    }
    if (d.speaker === 'host') return hostCard({ id, ep, text: sc.text, tone: d.seg === 'close' ? 'big' : 'plain' });
    if (d.speaker === 'room') return `<div class="dr-step" id="${id}"><div class="ru-room">${said(sc.text)}</div></div>`;
    if (d.speaker === 'stat' || d.speaker === 'award') {
      const n = (d.players || [])[0];
      const award = d.speaker === 'award';
      return `<div class="dr-step" id="${id}"><div class="ru-plate${award ? ' ru-award' : ''}${d.boot ? ' ru-boot' : ''}">
        ${n ? _portrait(n, ep, { size: 52 }) : '<span></span>'}
        <div><div class="ru-plate-k">${esc(award ? d.award : d.stat)}</div><div class="ru-plate-n">${esc(n || '')}</div>
          ${d.detail ? `<div class="ru-plate-d">${esc(d.detail)}</div>` : ''}</div>
        <span class="ru-plate-v">${award ? (d.boot ? BOOT : '★') : esc(d.value ?? '')}</span></div></div>`;
    }
    // A queen speaks.
    const who = speakerOf(sc);
    if (who !== lastSpeaker) side ^= 1;
    lastSpeaker = who;
    const mood = /feud|shade/.test(d.key || '') ? ' ru-hot' : /ally|friend|romance|cools/.test(d.key || '') ? ' ru-warm' : '';
    return `<div class="dr-step" id="${id}"><div class="ru-talk${side ? '' : ' ru-right'}${mood}">
      <div class="ru-who">${who ? _portrait(who, ep, { size: 54 }) : ''}<small>${esc(who || '')}</small></div>
      <div class="ru-bubble">${said(sc.text)}</div></div></div>`;
  };

  /* THE MUSIC: Bring Back My Girls under all of it (the reunion's own song),
     with the awards and the winner's segment under the win's music. */
  const musicOf = sc => sc.data?.seg === 'awards' || sc.data?.seg === 'winner' ? 'the-win'
    : sc.data?.seg === 'close' ? 'outro' : 'reunion';
  const steps = scenes.map((sc, i) => tagStep(card(sc, i), musicOf(sc))).join('');

  const sofa = `<!--dr-chrome--><div class="ru-sofa" id="ru-sofa"><div class="ru-sofa-row">${
    cast.map(n => `<div class="ru-q${winners.includes(n) ? ' ru-crown' : ''}" data-q="${esc(n)}">${_portrait(n, ep, { size: 34 })}<small>${esc(n)}</small></div>`).join('')
  }</div><p class="ru-sofa-seg" id="ru-sofa-seg">The Reunion</p></div><!--/dr-chrome-->`;

  /* THE SOFA FOLLOWS THE CONVERSATION: the queen in the seat lifts, the queen
     talking glows, the segment's name under the row. Per step. */
  const segTitle = { open: 'The Reunion', numbers: 'The season in numbers', early: 'The first ones out', seat: 'The hot seat', room: 'Ask the room', feud: 'The feuds',
    bonds: 'Friends, sisters and more', double: 'Shantay, you both stay', awards: 'The awards', winner: 'The winner', close: 'Goodnight' };
  const lights = scenes.map(sc => {
    const d = sc.data || {};
    const on = d.speaker === 'segment' ? (d.players || []) : d.seg === 'seat' || d.seg === 'early' || d.seg === 'feud' || d.seg === 'bonds' || d.seg === 'double' || d.seg === 'winner' ? (d.players || []).slice(0, d.seg === 'seat' ? 1 : 2) : (d.players || []).slice(0, 1);
    const talk = d.speaker === 'queen' ? [speakerOf(sc)] : [];
    return { on, talk, seg: segTitle[d.seg] || 'The Reunion' };
  });
  const railHtml = (seated, awards) => `<h4 class="dr-disp">The sofa · ${cast.length}</h4>${
    winners.map(n => `<div class="dr-slot">${_portrait(n, ep, { size: 30 })}<div><div class="dr-nm">${esc(n)}</div></div><span class="dr-up" style="color:#FFD66B">crowned</span></div>`).join('')}
    <div class="ru-rail-seg">In the seat · ${seated.length}</div>${
    seated.map(n => `<div class="dr-slot">${_portrait(n, ep, { size: 26 })}<div><div class="dr-nm">${esc(n)}</div></div><span></span></div>`).join('')}${
    awards.length ? `<div class="ru-rail-seg">The awards</div>${awards.map(([a, n]) => `<div class="ru-rail-aw"><b>${esc(a)}</b> ${esc(n || '')}</div>`).join('')}` : ''}`;
  if (typeof window !== 'undefined') {
    const apply = idx => {
      const sofaEl = document.getElementById('ru-sofa');
      if (!sofaEl) return;
      const L = lights[Math.max(0, Math.min(idx, lights.length - 1))];
      if (!L || idx < 0) { sofaEl.removeAttribute('data-live'); return; }
      sofaEl.setAttribute('data-live', '');
      for (const el of sofaEl.querySelectorAll('.ru-q')) {
        const n = el.getAttribute('data-q');
        el.classList.toggle('ru-on', L.on.includes(n));
        el.classList.toggle('ru-talk', L.talk.includes(n) && !L.on.includes(n));
      }
      const segEl = document.getElementById('ru-sofa-seg');
      if (segEl) segEl.textContent = L.seg;
    };
    window._drRevealExtra = window._drRevealExtra || {};
    window._drRevealExtra.reunion = idx => apply(idx);

    /* THE RAIL: who has had the seat, and the awards handed out so far. */
    window._drSidebar = window._drSidebar || {};
    const seated = [];
    const awards = [];
    window._drSidebar.reunion = scenes.map(sc => {
      const d = sc.data || {};
      if (d.speaker === 'segment' && d.seg === 'seat' && d.players?.[0]) seated.push(d.players[0]);
      if (d.speaker === 'award') awards.push([d.award, d.players?.[0]]);
      return railHtml(seated, awards);
    });
  }

  return `<style>${HOST_CARD_CSS}${REUNION_CSS}</style>${_shell(
    `<div class="ru-wrap">${sofa}${steps}</div>`, ep, {
      phase: 'untucked', title: 'The Reunion', subtitle: 'the whole season, back on one stage',
      sidebar: railHtml([], []),
    })}${_controls('reunion', Math.max(1, scenes.length), ep.num)}`;
}
