// ══════════════════════════════════════════════════════════════════════
// vp-dr/night-stage.js — the weekly main stage, staged
// ══════════════════════════════════════════════════════════════════════
//
// The main stage, the runway and the critiques get the same pinned stage the
// lip sync, the call, the save and the finale have: one state per reveal
// step, built from the screen's own step list, applied through
// `_drRevealExtra[suffix]`. The frame (background, header, banner, confetti,
// the cut to camera) is the kit in js/vp-dr/finale-stage.js, lit pink for
// the main stage.
//
//   mainStageStage  the panel at its desk, the host at the podium, the
//                   category card and the queens walking in; whoever is
//                   speaking is in the light.
//   runwayStage     a catwalk running away from you between two banks of
//                   photographers. Each queen walks to the end of it, the
//                   pit goes off for a look that deserves it, her score
//                   fills, and the queens who have walked line up below.
//   critiquesStage  the panel's desk above the queen being read. Each judge
//                   who speaks lights up in the colour of what she said, a
//                   split panel gets called out, the safe queens walk off,
//                   "who should go home" is answered name by name, and the
//                   panel deliberates over an empty stage.
//
// Nothing at rest names a result. Reduced motion shows end states.
import { _portrait, _judgePortrait } from './style.js';
import { FINALE_STAGE_CSS, shell, engine, face, quoteHtml } from './finale-stage.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export const NIGHT_STAGE_CSS = `${FINALE_STAGE_CSS}
/* The cards under a weekly stage reserve the room the stage takes. */
.nsx-cards .dr-step{scroll-margin-top:500px}
/* ══ THE PANEL'S DESK ══ (main stage and critiques) */
.nsx-desk{position:relative;display:flex;justify-content:center;align-items:flex-end;gap:clamp(8px,2vw,22px);flex-wrap:wrap;
  margin-top:8px;padding:6px 10px 14px}
.nsx-desk::after{content:'';position:absolute;left:4%;right:4%;bottom:0;height:16px;border-radius:6px 6px 0 0;
  background:linear-gradient(180deg,#5a1040,#2a0620);box-shadow:0 -1px 0 rgba(255,123,200,.5),0 10px 20px rgba(0,0,0,.6)}
.nsx-j{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:4px;width:clamp(64px,10vw,96px);
  transition:transform .5s cubic-bezier(.2,1.4,.4,1),filter .5s;filter:brightness(.7) saturate(.8)}
.nsx-j .fsx-face{width:clamp(46px,6.4vw,62px);height:clamp(46px,6.4vw,62px)}
.nsx-j b{font-size:10px;letter-spacing:.08em;text-transform:uppercase;text-align:center;line-height:1.1;max-width:100%}
.nsx-j .lamp{width:30px;height:6px;border-radius:99px;background:rgba(255,255,255,.1);transition:background .4s,box-shadow .4s}
.nsx-j.on{filter:none;transform:translateY(-6px)}
.nsx-j.on .fsx-face{box-shadow:0 0 0 3px var(--fx),0 0 30px 6px rgba(255,123,200,.45)}
.nsx-j.host .fsx-face{box-shadow:0 0 0 3px #ffd66b}
.nsx-j[data-tone=praise] .lamp{background:#3be08a;box-shadow:0 0 12px #3be08a}
.nsx-j[data-tone=mixed] .lamp{background:#ffc83d;box-shadow:0 0 12px #ffc83d}
.nsx-j[data-tone=pan] .lamp{background:#ff294b;box-shadow:0 0 12px #ff294b}
.nsx-j[data-tone=praise].on .fsx-face{box-shadow:0 0 0 3px #3be08a,0 0 30px 6px rgba(59,224,138,.45)}
.nsx-j[data-tone=pan].on .fsx-face{box-shadow:0 0 0 3px #ff294b,0 0 30px 6px rgba(255,41,75,.45)}

/* ══ THE MAIN STAGE ══ */
.msx-card{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:6px;padding:6px 14px;border-radius:12px;
  background:rgba(255,255,255,.05);border:1px solid rgba(255,123,200,.2)}
.msx-card small{font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--fx)}
.msx-card b{font:400 20px/1.1 'Anton','Impact',sans-serif;letter-spacing:.04em;text-transform:uppercase}
.msx-line{display:flex;justify-content:center;gap:6px;flex-wrap:wrap;margin-top:8px}
.msx-q{display:flex;flex-direction:column;align-items:center;gap:2px;width:52px;opacity:.45;transform:translateY(10px);
  transition:opacity .5s,transform .5s cubic-bezier(.2,1.4,.4,1)}
.msx-q .fsx-face{width:38px;height:38px}
.msx-q i{font-size:9px;font-style:normal;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.fsx.walked .msx-q{opacity:1;transform:none;transition-delay:var(--dl)}
.msx-q.on{opacity:1}.msx-q.on .fsx-face{box-shadow:0 0 0 3px var(--fx),0 0 20px rgba(255,123,200,.6)}

/* ══ THE RUNWAY ══ */
.rwx-marquee{position:relative;margin-top:8px;padding:8px 14px;border-radius:12px;text-align:center;
  background:linear-gradient(180deg,rgba(255,123,200,.14),rgba(0,0,0,.2));border:1px solid rgba(255,123,200,.3)}
.rwx-marquee small{display:block;font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:var(--fx)}
.rwx-marquee b{font:400 italic clamp(20px,3.4vw,30px)/1.1 Didot,'Bodoni MT',Georgia,serif}
.rwx-bulbs{position:absolute;left:8px;right:8px;display:flex;justify-content:space-between}
.rwx-bulbs.t{top:-4px}.rwx-bulbs.b{bottom:-4px}
.rwx-bulbs i{width:6px;height:6px;border-radius:50%;background:#ffd66b;box-shadow:0 0 8px #ffd66b;animation:rwx-bulb 1.2s steps(2) infinite;animation-delay:var(--dl)}
@keyframes rwx-bulb{50%{background:#5a3a10;box-shadow:none}}
.rwx-hall{position:relative;height:230px;margin-top:10px;border-radius:14px;overflow:hidden;perspective:520px;
  background:radial-gradient(60% 60% at 50% 20%,rgba(255,255,255,.08),transparent 70%),#0a0308}
.rwx-floor{position:absolute;left:50%;bottom:-40px;width:170px;height:420px;margin-left:-85px;transform-origin:50% 100%;
  transform:rotateX(62deg);background:repeating-linear-gradient(0deg,#2a0a20 0 30px,#3a0e2c 30px 60px);
  box-shadow:-6px 0 0 #ff7bc8,6px 0 0 #ff7bc8,0 0 60px rgba(255,123,200,.4)}
.rwx-pit{position:absolute;top:30%;bottom:0;width:22%;display:grid;grid-template-columns:repeat(3,1fr);align-content:end;gap:6px;padding:8px}
.rwx-pit.l{left:0}.rwx-pit.r{right:0}
.rwx-pit i{height:12px;border-radius:3px;background:#1e1016;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)}
.fsx.flash .rwx-pit i{animation:rwx-flash .5s steps(1) 4;animation-delay:var(--dl)}
@keyframes rwx-flash{50%{background:#fff;box-shadow:0 0 22px 8px rgba(255,255,255,.9)}}
.rwx-q{position:absolute;left:50%;top:14px;display:none;flex-direction:column;align-items:center;gap:6px;transform:translateX(-50%)}
.rwx-q.cur{display:flex;animation:rwx-walk 1.1s cubic-bezier(.2,.9,.3,1)}
@keyframes rwx-walk{from{transform:translate(-50%,70px) scale(.55);opacity:0}}
.rwx-q .fsx-face{width:110px;height:110px;box-shadow:0 0 0 4px var(--fx),0 20px 40px rgba(0,0,0,.7)}
.rwx-q b{font:400 20px/1 'Anton','Impact',sans-serif;letter-spacing:.05em;text-transform:uppercase;text-shadow:0 2px 10px #000}
.rwx-meter{width:170px;height:10px;border-radius:99px;background:rgba(255,255,255,.12);overflow:hidden}
.rwx-meter i{display:block;height:100%;width:0;border-radius:99px;background:linear-gradient(90deg,#ff7bc8,#ffd66b);transition:width 1.2s cubic-bezier(.2,1,.3,1) .6s}
.rwx-q.cur .rwx-meter i{width:var(--w)}
.rwx-num{font:700 18px/1 ui-monospace,Menlo,monospace;color:#ffd66b;opacity:0;transition:opacity .4s 1.4s}
.rwx-q.cur .rwx-num{opacity:1}
.rwx-looks{font-size:10px;letter-spacing:.2em;text-transform:uppercase;padding:2px 8px;border-radius:99px;background:rgba(255,214,107,.2);color:#ffd66b}
.rwx-conf{position:absolute;right:10px;top:10px;max-width:31%;padding:8px 10px;border-radius:12px 2px 12px 12px;
  background:rgba(20,8,30,.92);border:1px solid rgba(176,122,255,.55);font-size:12px;line-height:1.35;font-style:italic;
  opacity:0;transform:translateY(8px);transition:opacity .4s 1.6s,transform .4s 1.6s}
.rwx-conf small{display:block;font-style:normal;font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:#cbb3ff;margin-bottom:3px}
.rwx-q.cur ~ .rwx-conf.on,.rwx-conf.on{opacity:1;transform:none}
.rwx-strip{display:flex;justify-content:center;gap:6px;flex-wrap:wrap;margin-top:8px}
.rwx-s{display:flex;flex-direction:column;align-items:center;gap:2px;width:46px;opacity:.35;transition:opacity .4s}
.rwx-s .fsx-face{width:32px;height:32px}
.rwx-s em{font-style:normal;font:700 10px/1 ui-monospace,Menlo,monospace;color:#ffd66b;min-height:10px}
.rwx-s.done{opacity:1}
.rwx-s.now .fsx-face{box-shadow:0 0 0 2px var(--fx)}

/* ══ THE CRITIQUES ══ */
.crx-floor{position:relative;display:flex;justify-content:center;align-items:flex-start;gap:12px;min-height:150px;margin-top:6px;padding-top:8px}
.crx-q{display:none;flex-direction:column;align-items:center;gap:5px;position:relative}
.crx-q.cur{display:flex;animation:crx-step .6s cubic-bezier(.2,1.3,.4,1)}
@keyframes crx-step{from{transform:translateY(20px);opacity:0}}
.crx-q::before{content:'';position:absolute;top:-14px;left:50%;width:180px;height:190px;transform:translateX(-50%);z-index:-1;
  background:linear-gradient(180deg,rgba(255,240,230,.24),transparent 80%);clip-path:polygon(42% 0,58% 0,100% 100%,0 100%)}
.crx-q .fsx-face{width:92px;height:92px}
.crx-q b{font:400 18px/1 'Anton','Impact',sans-serif;letter-spacing:.05em;text-transform:uppercase}
.crx-tally{display:flex;gap:4px}
.crx-tally i{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.12)}
.crx-tally i.praise{background:#3be08a}.crx-tally i.mixed{background:#ffc83d}.crx-tally i.pan{background:#ff294b}
.crx-react{max-width:260px;padding:6px 10px;border-radius:12px;background:rgba(255,248,240,.95);color:#200814;font-size:12px;
  font-style:italic;text-align:center;opacity:0;transform:translateY(6px);transition:opacity .4s .8s,transform .4s .8s}
.crx-q.cur .crx-react{opacity:1;transform:none}
.crx-safe{display:none;gap:12px;flex-wrap:wrap;justify-content:center;align-items:center;padding:6px 0}
.crx-safe.cur{display:flex}
/* THE WRAPPER IS WHAT BROKE IT. Every other stage puts its face straight
   into a flex container, which blockifies it and lets the width apply. These
   faces sit inside a per-queen span (it carries the animation delay), so
   the face element stayed INLINE -- width and height ignored, the portrait
   drawn at its natural 512px, and four of them sliding off the stage.
   Sized here and blockified at both levels. */
.crx-safe > span{display:block;flex:0 0 auto}
.crx-safe .fsx-face{display:block;width:54px;height:54px}
/* ── THEY WALK OFF, THEY DO NOT VANISH ──────────────────────────────
   This ended at opacity 0 and translateX(160px), held by the fill mode, so
   1.6s after the step opened the card was EMPTY: four faces gone, the row
   collapsed to 21px, and a banner reading "4 queens leave the stage" sitting
   over nothing. Worse on the way back — the animation had already finished,
   so returning to the step showed the empty version immediately.
   A screen state has to stay legible after its animation. They drift off to
   the side and settle there, dimmed: the movement still says "leaving", and
   the reader can still see WHO was safe, which is the only information this
   step carries. */
.crx-safe span{animation:crx-leave 1.5s cubic-bezier(.3,0,.2,1) forwards;animation-delay:var(--dl)}
@keyframes crx-leave{
  0%{transform:none;opacity:1;filter:none}
  55%{transform:none;opacity:1;filter:none}
  100%{transform:translateX(26px);opacity:.62;filter:saturate(.7)}
}
.crx-safe.cur ~ .crx-sub,.crx-sub{font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--fx)}
.crx-wsg{display:none;align-items:center;gap:14px}
.crx-wsg.cur{display:flex}
.crx-wsg .fsx-face{width:70px;height:70px}
.crx-wsg .arrow{width:70px;height:20px}
.crx-wsg .arrow path{stroke-dasharray:80;stroke-dashoffset:80;animation:crx-draw .6s .3s forwards}
@keyframes crx-draw{to{stroke-dashoffset:0}}
.crx-wsg .tgt{opacity:0;animation:crx-pop .4s .8s forwards}
@keyframes crx-pop{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}
.crx-wsg small{display:block;text-align:center;font-size:10px;letter-spacing:.14em;text-transform:uppercase;margin-top:3px}
.crx-board{display:none;flex-direction:column;gap:4px;min-width:min(340px,90%)}
.crx-board.cur{display:flex}
.crx-row{display:grid;grid-template-columns:30px 1fr auto;gap:8px;align-items:center}
.crx-row .fsx-face{width:28px;height:28px}
.crx-row .bar{height:10px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden}
.crx-row .bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#ff7bc8,#ff294b);animation:crx-fill 1s forwards;animation-delay:var(--dl)}
@keyframes crx-fill{to{width:var(--w)}}
.crx-row b{font:700 13px/1 ui-monospace,Menlo,monospace}
.fsx[data-phase=delib] .crx-floor::after{content:'the stage is empty';position:absolute;top:60px;font-size:11px;letter-spacing:.3em;
  text-transform:uppercase;color:rgba(255,255,255,.3)}

@media (max-width:640px){
  .rwx-hall{height:190px}.rwx-q .fsx-face{width:80px;height:80px}.rwx-conf{position:static;max-width:none;margin:6px 8px 0;font-size:11px}
  .crx-q .fsx-face{width:70px;height:70px}.crx-wsg .fsx-face{width:52px;height:52px}
  .nsx-j b{display:none}
}
@media (prefers-reduced-motion: reduce){
  .rwx-q.cur .rwx-num,.crx-q.cur .crx-react,.crx-wsg .tgt{opacity:1}
  .crx-row .bar i{width:var(--w)}
}
/* Last, so it wins over the base sizes above. */
@media (max-height: 999px){
  .nsx-desk{padding:2px 8px 12px;margin-top:4px}.nsx-j .fsx-face{width:42px;height:42px}
  .rwx-hall{height:170px;margin-top:6px}.rwx-q{top:6px}.rwx-q .fsx-face{width:76px;height:76px}.rwx-q b{font-size:15px}
  .rwx-marquee{padding:5px 10px}.rwx-marquee b{font-size:20px}
  .crx-floor{min-height:110px}.crx-q .fsx-face{width:66px;height:66px}.crx-q b{font-size:14px}
  .crx-wsg .fsx-face{width:54px;height:54px}.crx-safe .fsx-face{width:42px;height:42px}
  .msx-q .fsx-face{width:30px;height:30px}
  .nsx-cards .dr-step{scroll-margin-top:340px}
}
`;

/** A judge's face: a permanent seat, or the guest from her roster row. */
const judgeFace = (id, ep, guest, size) => (guest && String(id || '').startsWith('guest:')
  ? `<span class="fsx-face">${_portrait(guest.name, ep, { slug: guest.slug, size })}</span>`
  : `<span class="fsx-face">${_judgePortrait(id, { stage: true, size })}</span>`);

const desk = (judges, ep, guest) => `<div class="nsx-desk">${judges.map(j => `<div class="nsx-j${j.host ? ' host' : ''}" data-j="${esc(j.id)}">
    ${judgeFace(j.id, ep, guest, 62)}<b>${esc(j.name)}</b><i class="lamp"></i></div>`).join('')}</div>`;

const paintDesk = (el, on = [], tones = {}) => {
  for (const j of el.querySelectorAll('.nsx-j')) {
    const id = j.dataset.j;
    j.classList.toggle('on', on.includes(id));
    if (tones[id]) j.dataset.tone = tones[id]; else delete j.dataset.tone;
  }
};

// ══════════════════════════════════════════════════════════════════════
//  THE MAIN STAGE
// ══════════════════════════════════════════════════════════════════════

/**
 * `list`: { speaker: 'host'|'judge'|'queen'|'narrator', judge, who } per step.
 * `judges`: [{ id, name, host }], the host first.
 */
export function mainStageStage(row, list, { ep, judges, guest, living = [], category = '', uid = 'x' } = {}) {
  const states = list.map((s, i) => {
    const on = s.speaker === 'host' ? ['rupaul'] : s.speaker === 'judge' && s.judge ? [s.judge] : [];
    return {
      phase: 'talk', on, who: s.speaker === 'queen' ? s.who : null, hostOn: s.speaker === 'host',
      banner: i === 0 ? { text: 'The main stage', sub: category ? `the category is ${category}` : 'the panel takes its seats' } : null,
      stars: i === 0,
    };
  });
  const body = `${desk(judges, ep, guest)}
    ${category ? `<div class="msx-card"><small>The category is</small><b>${esc(category)}</b></div>` : ''}
    <div class="msx-line">${living.map((q, j) => `<span class="msx-q" data-q="${esc(q)}" style="--dl:${(j * 0.08).toFixed(2)}s">${face(q, ep, 38)}<i>${esc(q)}</i></span>`).join('')}</div>`;
  const html = shell({ id: `msx-${uid}`, title: 'The main stage', sub: 'the panel takes its seats', body, theme: 'stage', hostChip: false });
  const apply = engine(`msx-${uid}`, states, (el, st) => {
    el.classList.toggle('walked', !!st);
    paintDesk(el, st?.on || []);
    for (const q of el.querySelectorAll('.msx-q')) q.classList.toggle('on', !!st && st.who === q.dataset.q);
  });
  return { html, apply, states };
}

// ══════════════════════════════════════════════════════════════════════
//  THE RUNWAY
// ══════════════════════════════════════════════════════════════════════

/**
 * `walkers`: [{ who, score, looks, confess: [{ speaker, text }] }] in the
 * order they walk; one step each.
 */
export function runwayStage(row, walkers, { ep, category = '', uid = 'x' } = {}) {
  const done = [];
  const states = walkers.map(w => {
    done.push(w.who);
    const big = w.score >= 8;
    const low = w.score < 4.5;
    return {
      phase: 'walk', cur: w.who, done: [...done], flash: big,
      mood: big ? 'gold' : low ? 'red' : '',
      banner: big ? { text: 'Serving', sub: w.who } : low ? { text: 'Hmm', sub: `${w.who} misses the category`, red: true } : null,
      stars: big, shake: low,
      conf: w.confess?.[0] || null,
    };
  });
  const bulbs = Array.from({ length: 16 }, (_, i) => `<i style="--dl:${(i % 2) * 0.6}s"></i>`).join('');
  const pit = side => `<div class="rwx-pit ${side}">${Array.from({ length: 12 }, (_, i) => `<i style="--dl:${((i * 37) % 10) / 20}s"></i>`).join('')}</div>`;
  const qs = walkers.map(w => `<div class="rwx-q" data-q="${esc(w.who)}" style="--w:${clamp(w.score * 10, 4, 100)}%">
      ${face(w.who, ep, 110)}<b>${esc(w.who)}</b>
      ${w.looks > 1 ? `<span class="rwx-looks">${w.looks} looks</span>` : ''}
      <div class="rwx-meter"><i></i></div><span class="rwx-num" data-v="${w.score.toFixed(1)}"></span></div>`).join('');
  const body = `<div class="rwx-marquee"><div class="rwx-bulbs t">${bulbs}</div><small>Category is</small><b>${esc(category)}</b><div class="rwx-bulbs b">${bulbs}</div></div>
    <div class="rwx-hall"><div class="rwx-floor"></div>${pit('l')}${pit('r')}${qs}<div class="rwx-conf" data-conf></div></div>
    <div class="rwx-strip">${walkers.map(w => `<span class="rwx-s" data-s="${esc(w.who)}">${face(w.who, ep, 32)}<em data-sc="${w.score.toFixed(1)}"></em></span>`).join('')}</div>`;
  const html = shell({ id: `rwx-${uid}`, title: 'The runway', sub: `${walkers.length} looks tonight`, body, theme: 'stage' });
  const apply = engine(`rwx-${uid}`, states, (el, st, fresh) => {
    el.classList.remove('flash');
    for (const q of el.querySelectorAll('.rwx-q')) {
      const cur = !!st && st.cur === q.dataset.q;
      q.classList.toggle('cur', cur);
      const num = q.querySelector('.rwx-num');
      num.textContent = cur ? num.dataset.v : '';
    }
    for (const s of el.querySelectorAll('.rwx-s')) {
      const isDone = !!st && st.done.includes(s.dataset.s);
      s.classList.toggle('done', isDone);
      s.classList.toggle('now', !!st && st.cur === s.dataset.s);
      const em = s.querySelector('em');
      em.textContent = isDone && st.cur !== s.dataset.s ? em.dataset.sc : '';
    }
    const conf = el.querySelector('[data-conf]');
    conf.classList.toggle('on', !!st?.conf);
    conf.innerHTML = st?.conf ? `<small>Confessional · ${esc(st.conf.speaker)}</small>${esc(String(st.conf.text).slice(0, 140))}${String(st.conf.text).length > 140 ? '…' : ''}` : '';
    if (st?.flash && fresh) { void el.offsetWidth; el.classList.add('flash'); }
  });
  return { html, apply, states };
}

// ══════════════════════════════════════════════════════════════════════
//  THE CRITIQUES
// ══════════════════════════════════════════════════════════════════════

/**
 * `list`, one per step:
 *   { t: 'safe', safe: [names] }
 *   { t: 'queen', who, reads: [{ judge, tone, spoke }], split, reaction }
 *   { t: 'wsg', voter, target }
 *   { t: 'board', tally: { name: n } }
 *   { t: 'delib', judge, host }
 */
export function critiquesStage(row, list, { ep, judges, guest, uid = 'x' } = {}) {
  const read = new Set();
  const states = list.map(s => {
    if (s.t === 'safe') {
      return { phase: 'safe', cur: 'safe', on: [], tones: {}, banner: { text: 'Safe', sub: `${s.safe.length} ${s.safe.length === 1 ? 'queen leaves' : 'queens leave'} the stage` } };
    }
    if (s.t === 'queen') {
      read.add(s.who);
      const tones = Object.fromEntries(s.reads.map(r => [r.judge, r.tone]));
      const spoken = s.reads.filter(r => r.spoke);
      const all = s.reads.map(r => r.tone);
      const rave = all.length && all.every(t => t === 'praise');
      const filth = all.length && all.every(t => t === 'pan');
      return {
        phase: 'read', cur: `q:${s.who}`, on: spoken.map(r => r.judge), tones,
        mood: rave ? 'gold' : filth ? 'red' : '',
        banner: s.split ? { text: 'Split panel', sub: `the judges disagree about ${s.who}`, red: true }
          : rave ? { text: 'Rave reviews', sub: s.who } : filth ? { text: 'Read to filth', sub: s.who, red: true } : null,
        stars: rave, shake: filth || s.split,
      };
    }
    if (s.t === 'wsg') {
      return { phase: 'wsg', cur: `w:${s.voter}`, on: [], tones: {}, hostOn: true, mood: 'red', shake: s.voter !== s.target };
    }
    if (s.t === 'board') {
      return { phase: 'wsg', cur: 'board', on: [], tones: {}, hostOn: true, banner: { text: 'The room has answered', sub: 'who should go home', red: true } };
    }
    return {
      phase: 'delib', cur: null, on: s.host ? ['rupaul'] : s.judge ? [s.judge] : [], tones: {}, hostOn: !!s.host,
      banner: s.host ? { text: 'The host decides', sub: 'the queens come back out' } : null,
    };
  });

  const queens = list.filter(s => s.t === 'queen');
  const safe = list.find(s => s.t === 'safe');
  const wsg = list.filter(s => s.t === 'wsg');
  const board = list.find(s => s.t === 'board');
  const arrow = `<svg class="arrow" viewBox="0 0 70 20"><path d="M2 10 H62 M52 3 L64 10 L52 17" fill="none" stroke="#ff5a6e" stroke-width="3" stroke-linecap="round"/></svg>`;
  const floor = `
    ${safe ? `<div class="crx-safe" data-c="safe">${safe.safe.map((q, j) => `<span style="--dl:${(0.3 + j * 0.12).toFixed(2)}s">${face(q, ep, 54)}</span>`).join('')}</div>` : ''}
    ${queens.map(s => `<div class="crx-q" data-c="q:${esc(s.who)}">${face(s.who, ep, 92)}<b>${esc(s.who)}</b>
      <span class="crx-tally">${s.reads.map(r => `<i class="${esc(r.tone)}"></i>`).join('')}</span>
      ${s.reaction ? `<span class="crx-react">She takes it: ${esc(s.reaction)}</span>` : ''}</div>`).join('')}
    ${wsg.map(s => `<div class="crx-wsg" data-c="w:${esc(s.voter)}"><div>${face(s.voter, ep, 70)}<small>${esc(s.voter)}</small></div>${arrow}
      <div class="tgt">${face(s.target, ep, 70)}<small>${s.voter === s.target ? 'herself' : esc(s.target)}</small></div></div>`).join('')}
    ${board ? `<div class="crx-board" data-c="board">${Object.entries(board.tally).sort((a, b) => b[1] - a[1]).map(([n, k], j) => {
    const max = Math.max(1, ...Object.values(board.tally));
    return `<div class="crx-row">${face(n, ep, 28)}<div class="bar"><i style="--w:${Math.round((k / max) * 100)}%;--dl:${(j * 0.15).toFixed(2)}s"></i></div><b>${k}</b></div>`;
  }).join('')}</div>` : ''}`;
  const body = `${desk(judges, ep, guest)}<div class="crx-floor">${floor}</div>`;
  const html = shell({ id: `crx-${uid}`, title: 'The critiques', sub: `${queens.length} queens in front of the panel`, body, theme: 'stage', hostChip: false });
  const apply = engine(`crx-${uid}`, states, (el, st) => {
    paintDesk(el, [...(st?.on || []), ...(st?.hostOn ? ['rupaul'] : [])], st?.tones || {});
    for (const c of el.querySelectorAll('[data-c]')) c.classList.toggle('cur', !!st && st.cur === c.dataset.c);
  });
  return { html, apply, states };
}

export { quoteHtml };
