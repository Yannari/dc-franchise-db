// ══════════════════════════════════════════════════════════════════════
// vp-dr/room-stage.js — the werk room, Untucked and the way out, staged
// ══════════════════════════════════════════════════════════════════════
//
//   roomStage  a wall of mirror stations, one per queen, above the cards.
//              The queens in the scene being read light up and step into
//              the middle; two of them are joined by a line the colour of
//              what the scene did to them, with the change on it. A fight
//              shakes the room, a real bond gets a banner, a confessional
//              cuts to camera, and every queen the night has reached keeps
//              a glow, so by the last click you can see who it forgot.
//              Lit cold for the werk room and warm purple for Untucked.
//   exitStage  a dark corridor with a lit door at the end. The queen who
//              lost walks down it one step per card, the door closes on
//              her, and her mirror message is written on the glass.
//
// The frame is the kit in js/vp-dr/finale-stage.js. One state per step;
// nothing at rest says anything the cards have not.
import { _portrait } from './style.js';
import { FINALE_STAGE_CSS, shell, engine, face, quoteHtml } from './finale-stage.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
/** Cut at a word, with an ellipsis; the whole line is on its card. */
const clip = (t, n) => {
  const s = String(t || '');
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), n - 20)).trimEnd()}…`;
};

export const ROOM_STAGE_CSS = `${FINALE_STAGE_CSS}
.rmx-cards .dr-step{scroll-margin-top:440px}
/* ══ THE WALL ══ */
.rmx-wall{display:flex;justify-content:center;gap:6px;flex-wrap:wrap;margin-top:8px;padding:8px 8px 10px;border-radius:12px;
  background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(0,0,0,.25));border-bottom:6px solid rgba(255,255,255,.06)}
.rmx-st{position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;width:58px;padding:5px 3px 4px;border-radius:8px;
  background:rgba(0,0,0,.35);transition:transform .4s,filter .4s,box-shadow .4s;filter:brightness(.55) saturate(.7)}
.rmx-st::before{content:'';position:absolute;inset:0;border-radius:8px;pointer-events:none;
  background:radial-gradient(circle,#fff6d8 0 1.6px,transparent 2.2px) 0 0/10px 10px;
  -webkit-mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);
  padding:2px;opacity:.15;transition:opacity .4s}
.rmx-st .fsx-face{width:38px;height:38px;border-radius:6px}
.rmx-st b{font-size:9px;letter-spacing:.04em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.rmx-st.seen{filter:brightness(.85)}
.rmx-st.seen::before{opacity:.5}
.rmx-st.on{filter:none;transform:translateY(-4px);box-shadow:0 0 18px var(--fx)}
.rmx-st.on::before{opacity:1}
.rmx-st.gone{filter:grayscale(1) brightness(.3)}
.rmx-st.gone::after{content:'×';position:absolute;top:6px;left:0;right:0;text-align:center;font:400 34px/1 'Anton','Impact',sans-serif;color:#ff5a6e}
/* ══ THE MIDDLE OF THE ROOM ══ */
.rmx-focus{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:128px;margin-top:8px}
.rmx-duo{display:flex;align-items:center;justify-content:center;gap:12px;animation:rmx-in .5s cubic-bezier(.2,1.3,.4,1)}
@keyframes rmx-in{from{transform:translateY(16px);opacity:0}}
.rmx-one{display:flex;flex-direction:column;align-items:center;gap:4px}
.rmx-one .fsx-face{width:84px;height:84px;box-shadow:0 0 0 3px var(--fx),0 0 30px rgba(0,0,0,.6)}
.rmx-one b{font:400 15px/1 'Anton','Impact',sans-serif;letter-spacing:.05em;text-transform:uppercase}
.rmx-tie{display:flex;flex-direction:column;align-items:center;gap:4px;width:120px}
.rmx-tie svg{width:120px;height:18px}
.rmx-tie path{stroke-width:4;stroke-linecap:round;fill:none;stroke-dasharray:130;stroke-dashoffset:130;animation:rmx-draw .7s .2s forwards}
@keyframes rmx-draw{to{stroke-dashoffset:0}}
.rmx-tie.warm path{stroke:#3be08a}.rmx-tie.cold path{stroke:#ff294b;stroke-dasharray:10 8;animation:rmx-jitter .3s steps(2) 6}
@keyframes rmx-jitter{50%{transform:translateY(2px)}}
.rmx-tie.flat path{stroke:rgba(255,255,255,.3)}
.rmx-tie b{font:700 13px/1 ui-monospace,Menlo,monospace}
.rmx-tie.warm b{color:#3be08a}.rmx-tie.cold b{color:#ff5a6e}
.rmx-note{padding:2px 10px;border-radius:99px;font-size:10px;letter-spacing:.18em;
  text-transform:uppercase;background:rgba(255,255,255,.08);color:var(--fx);white-space:nowrap;max-width:90%;overflow:hidden;text-overflow:ellipsis}
.rmx-pop{display:flex;gap:6px;justify-content:center;margin-top:2px}
.rmx-pop span{font:700 11px/1 ui-monospace,Menlo,monospace;padding:2px 6px;border-radius:6px;background:rgba(59,224,138,.18);color:#3be08a}
.rmx-pop span.dn{background:rgba(255,41,75,.18);color:#ff8fa3}
.rmx-temp{display:flex;align-items:center;gap:8px;justify-content:center;margin-top:8px;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#bda9c8}
.rmx-temp .bar{position:relative;width:min(260px,60%);height:8px;border-radius:99px;background:linear-gradient(90deg,#ff294b,rgba(255,255,255,.12) 50%,#3be08a)}
.rmx-temp .bar i{position:absolute;top:50%;left:50%;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;background:#fff;box-shadow:0 0 12px #fff;transition:left .7s cubic-bezier(.2,1.4,.4,1)}
.rmx-band{font:400 11px/1 'Anton','Impact',sans-serif;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.35)}
.fsx.th-lounge .rmx-wall{background:linear-gradient(180deg,rgba(201,162,255,.06),rgba(0,0,0,.25));border-bottom-color:rgba(120,40,90,.6)}

/* ══ THE WAY OUT ══ */
.exx-hall{position:relative;height:210px;margin-top:8px;border-radius:14px;overflow:hidden;perspective:420px;background:#050205}
.exx-walls{position:absolute;inset:0;background:
  linear-gradient(90deg,#1a0612 0,#0a0308 18%,transparent 38%,transparent 62%,#0a0308 82%,#1a0612 100%)}
.exx-floor{position:absolute;left:50%;bottom:-30px;width:260px;height:320px;margin-left:-130px;transform-origin:50% 100%;transform:rotateX(64deg);
  background:repeating-linear-gradient(0deg,#1c0a14 0 26px,#120610 26px 52px)}
.exx-door{position:absolute;left:50%;top:22px;width:62px;height:104px;margin-left:-31px;border-radius:4px 4px 0 0;
  background:linear-gradient(180deg,#fff6d8,#ffd6a8);box-shadow:0 0 60px 20px rgba(255,230,190,.45);transition:transform 1s,box-shadow 1s,background 1s}
.exx-door::after{content:'';position:absolute;inset:0;background:#2a0a18;transform:scaleX(0);transform-origin:left;transition:transform .9s cubic-bezier(.6,0,.3,1)}
.fsx[data-shut="1"] .exx-door{box-shadow:0 0 10px 2px rgba(255,230,190,.15)}
.fsx[data-shut="1"] .exx-door::after{transform:scaleX(1)}
.exx-q{position:absolute;left:50%;bottom:10px;display:flex;flex-direction:column;align-items:center;gap:4px;
  transform:translate(-50%,0) scale(1);transform-origin:50% 100%;transition:transform 1.4s cubic-bezier(.4,0,.2,1),opacity 1.2s}
.exx-q .fsx-face{width:96px;height:96px;box-shadow:0 0 0 3px #ff5a6e}
.exx-q b{font:400 17px/1 'Anton','Impact',sans-serif;letter-spacing:.05em;text-transform:uppercase}
.exx-stamp{position:absolute;right:14px;top:14px;padding:5px 12px;border:4px solid #ff294b;border-radius:8px;color:#ff294b;
  font:400 24px/1 'Anton','Impact',sans-serif;letter-spacing:.08em;text-transform:uppercase;transform:rotate(8deg) scale(2.4);opacity:0;background:rgba(10,2,5,.6)}
.fsx.stamped .exx-stamp{animation:exx-slam .45s cubic-bezier(.5,0,.3,1.4) forwards}
@keyframes exx-slam{to{transform:rotate(8deg) scale(1);opacity:1}}
.exx-mirror{position:absolute;left:14px;top:14px;width:min(44%,260px);min-height:70px;padding:10px 12px;border-radius:10px;
  background:linear-gradient(135deg,rgba(220,230,255,.18),rgba(255,255,255,.04));border:2px solid rgba(255,255,255,.25);
  font:400 italic 17px/1.25 'Brush Script MT','Segoe Script',cursive;color:#ff3d6e;text-shadow:0 0 6px rgba(255,61,110,.4);opacity:0;transition:opacity .6s}
.exx-mirror.on{opacity:1}
.exx-mirror small{display:block;font:600 9px/1 system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#cfd8ff;margin-bottom:5px}

@media (max-width:640px){
  .rmx-st{width:48px}.rmx-st .fsx-face{width:30px;height:30px}
  .rmx-one .fsx-face{width:62px;height:62px}.rmx-tie{width:80px}.rmx-tie svg{width:80px}
  .exx-mirror{position:static;width:auto;margin:6px}
}
/* Last, so it wins over the base sizes above. */
@media (max-height: 999px){
  .rmx-wall{padding:5px 6px 6px;margin-top:4px}.rmx-st{width:50px;padding:3px 2px}.rmx-st .fsx-face{width:30px;height:30px}
  .rmx-focus{min-height:96px;margin-top:6px}.rmx-one .fsx-face{width:62px;height:62px}
  .exx-hall{height:170px}.exx-q .fsx-face{width:70px;height:70px}.exx-door{top:14px;width:50px;height:84px;margin-left:-25px}
  .rmx-cards .dr-step{scroll-margin-top:320px}
}
`;

const TIE = `<svg viewBox="0 0 120 18" aria-hidden="true"><path d="M4 9 Q30 1 60 9 T116 9"/></svg>`;

/**
 * `scenes`: [{ players, confess, bond, pop: { name: d }, note, text, band }].
 * `room`: the queens in the room tonight. `gone`: stations left empty.
 */
export function roomStage(row, scenes, { ep, room = [], gone = [], theme = 'werk', title, sub, uid = 'x', bands = {}, hostChip = false } = {}) {
  const seen = new Set();
  let heat = 0;
  const states = scenes.map(s => {
    const who = (s.players || []).filter(Boolean);
    who.forEach(n => seen.add(n));
    heat += Number(s.bond) || 0;
    const st = {
      phase: 'scene', on: who, seen: [...seen], heat, hostOn: !!s.hostOn,
      band: bands[s.band] || '', focus: '', mood: '',
    };
    if (s.confess) {
      st.phase = 'quote';
      st.quote = quoteHtml({ name: who[0], ep, label: `Confessional · ${who[0] || ''}`, text: s.text });
      return st;
    }
    const d = Number(s.bond) || 0;
    const pops = Object.entries(s.pop || {}).filter(([, v]) => Number(v))
      .map(([n, v]) => `<span class="${v < 0 ? 'dn' : ''}">${esc(n)} ${v > 0 ? '+' : ''}${Number(v).toFixed(1)}</span>`).join('');
    const one = n => `<div class="rmx-one">${face(n, ep, 84)}<b>${esc(n)}</b></div>`;
    st.focus = `<div class="rmx-duo">${who.length > 1
      ? `${one(who[0])}<div class="rmx-tie ${d > 0.15 ? 'warm' : d < -0.15 ? 'cold' : 'flat'}">${TIE}<b>${d ? `${d > 0 ? '+' : ''}${d.toFixed(1)}` : ''}</b></div>${one(who[1])}`
      : who.length ? one(who[0]) : ''}</div>${pops ? `<div class="rmx-pop">${pops}</div>` : ''}`;
    st.note = s.note || '';
    if (d <= -1.5) {
      st.mood = 'red'; st.shake = true;
      st.banner = { text: s.loud ? 'It kicks off' : 'Drama', sub: who.join(' vs '), red: true };
    } else if (d >= 1.5) {
      st.mood = 'gold'; st.stars = true;
      st.banner = { text: 'Bonding', sub: who.join(' & ') };
    } else if (s.loud) {
      st.shake = true; st.mood = 'red';
    }
    return st;
  });
  const wall = room.concat(gone.filter(g => !room.includes(g))).map(n =>
    `<div class="rmx-st${gone.includes(n) ? ' gone' : ''}" data-q="${esc(n)}">${face(n, ep, 38)}<b>${esc(n)}</b></div>`).join(' ');
  const body = `<div class="rmx-wall">${wall}</div>
    <div class="rmx-focus"><span class="rmx-note" data-note hidden></span><div data-focus></div><span class="rmx-band" data-band></span></div>
    <div class="rmx-temp"><span>apart</span><div class="bar"><i data-heat></i></div><span>together</span></div>`;
  const html = shell({ id: `rmx-${uid}`, title, sub, body, theme, hostChip });
  let shown = null;
  const apply = engine(`rmx-${uid}`, states, (el, st) => {
    for (const s of el.querySelectorAll('.rmx-st')) {
      const n = s.dataset.q;
      s.classList.toggle('on', !!st && st.on.includes(n));
      s.classList.toggle('seen', !!st && st.seen.includes(n));
    }
    const f = el.querySelector('[data-focus]');
    const html = st?.focus || '';
    if (html !== shown) { f.innerHTML = html; shown = html; }
    const note = el.querySelector('[data-note]');
    note.hidden = !st?.note;
    note.textContent = st?.note || '';
    el.querySelector('[data-band]').textContent = st?.band || '';
    el.querySelector('[data-heat]').style.left = `${clamp(50 + (st?.heat || 0) * 12, 4, 96)}%`;
  });
  return { html, apply, states };
}

/**
 * The sashay. `steps`: one per card, `{ kind }`; `gone` is who leaves,
 * `verb` the word the show uses, `message` her mirror message.
 */
export function exitStage(row, steps, { ep, gone, verb = 'Sashay away', message = '', uid = 'x' } = {}) {
  const n = steps.length;
  const states = steps.map((s, i) => {
    const last = i === n - 1;
    return {
      phase: 'walk', walk: n > 1 ? i / (n - 1) : 1, shut: last,
      mood: 'red', stamp: i === 0,
      banner: i === 0 ? { text: verb, sub: gone, red: true } : null,
      mirror: last && !!message,
    };
  });
  const body = `<div class="exx-hall"><div class="exx-walls"></div><div class="exx-floor"></div><div class="exx-door"></div>
      <div class="exx-q" data-q>${face(gone, ep, 96)}<b>${esc(gone)}</b></div>
      <div class="exx-mirror" data-mirror><small>Written on the mirror</small>${esc(clip(message, 120))}</div>
      <div class="exx-stamp">${esc(verb)}</div></div>`;
  const html = shell({ id: `exx-${uid}`, title: 'The way out', sub: gone, body, theme: 'stage', hostChip: false });
  const apply = engine(`exx-${uid}`, states, (el, st, fresh) => {
    const q = el.querySelector('[data-q]');
    const w = st ? st.walk : 0;
    // Down the corridor: smaller and higher as she nears the door.
    q.style.transform = `translate(-50%, ${-w * 92}px) scale(${1 - w * 0.62})`;
    q.style.opacity = st?.shut ? '0' : '1';
    el.dataset.shut = st?.shut ? '1' : '0';
    el.querySelector('[data-mirror]').classList.toggle('on', !!st?.mirror);
    el.classList.toggle('stamped', !!st);
    if (st?.stamp && fresh) { el.classList.remove('stamped'); void el.offsetWidth; el.classList.add('stamped'); }
  });
  return { html, apply, states };
}

export { _portrait };
