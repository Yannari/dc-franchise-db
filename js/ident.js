// The Blindside Network ident: two seconds of channel identity on the first
// visit of the day.
//
// THE SEQUENCE (about 2.4 s, every beat skippable with a click or a key):
//   0.00  dark. A thin line of light opens across the middle, like a set
//         warming up.
//   0.25  the B rises out of it; its right edge is missing.
//   0.70  the cut piece slams in from the side and sits flush.
//   1.00  THE HIT. It is knocked out of line: a magenta flash, a shockwave,
//         sparks, the colour channels tearing apart for a frame, the screen
//         shaking. BLINDSIDE / NETWORK comes up underneath.
//   1.80  a slash of light crosses the whole screen along the cut's angle,
//         and the screen splits on it: the two halves slide apart and the
//         page is underneath.
//
// THE GATE lives in an inline <script> in each page's <head> (BRAND IDENT_BOOT
// in js/brand.js, written by tools/brand-pages.mjs). It runs before the body
// paints and hides the page, so the ident opens onto the page instead of the
// page flashing up first. That snippet also unhides after four seconds no matter
// what, so a failure here can never leave a blank site. `?ident` forces a replay.
import { brandMark } from './brand.js';

export const IDENT_KEY = 'bs_ident_day';
const today = () => new Date().toDateString();

/** True when the head gate asked for the ident on this load. */
export function identPending(doc = document) {
  return doc.documentElement.classList.contains('bs-ident-on');
}

const CSS = `
.bs-ident{position:fixed;inset:0;z-index:2147483000;pointer-events:auto;cursor:pointer;overflow:hidden}
.bs-ident .half{position:absolute;inset:-10%;background:radial-gradient(120% 90% at 50% 45%,#1d1030 0%,#0b0613 55%,#06030b 100%)}
.bs-ident .scan{position:absolute;inset:0;pointer-events:none;opacity:.35;
  background:repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 3px)}
.bs-ident .line{position:absolute;left:0;right:0;top:50%;height:2px;margin-top:-1px;transform:scaleX(0);
  background:linear-gradient(90deg,transparent,#FF3EA5 20%,#fff 50%,#7B5CFF 80%,transparent);box-shadow:0 0 24px #FF3EA5}
.bs-ident .stage{position:absolute;left:50%;top:50%;display:grid;justify-items:center;gap:2.2vmin;transform:translate(-50%,-56%)}
.bs-ident .mark{width:min(34vmin,260px);height:min(34vmin,260px);color:#F3EEF9;overflow:visible}
.bs-ident .word{display:grid;justify-items:center;line-height:.85;color:#F3EEF9}
.bs-ident .word .n{font-family:"Big Shoulders Display","Arial Narrow",Impact,sans-serif;font-weight:900;
  font-size:min(9vmin,72px);letter-spacing:.06em;display:flex}
.bs-ident .word .n span{display:inline-block;opacity:0}
.bs-ident .word .s{font-family:"Instrument Sans",system-ui,sans-serif;font-weight:600;font-size:min(2.1vmin,16px);
  letter-spacing:.9em;margin-top:1.6vmin;color:#A898BD;opacity:0;padding-left:.9em}
.bs-ident .flash{position:absolute;inset:0;background:radial-gradient(circle at 50% 46%,rgba(255,62,165,.55),rgba(123,92,255,.25) 35%,transparent 70%);opacity:0;pointer-events:none}
.bs-ident .ring{position:absolute;left:50%;top:46%;width:30vmin;height:30vmin;margin:-15vmin 0 0 -15vmin;border-radius:50%;
  border:2px solid #FF3EA5;box-shadow:0 0 30px #FF3EA5,inset 0 0 30px rgba(123,92,255,.6);opacity:0;pointer-events:none}
.bs-ident .spark{position:absolute;left:50%;top:46%;width:7px;height:7px;margin:-3.5px;border-radius:50%;
  background:#FFC23D;box-shadow:0 0 12px #FFC23D;opacity:0;pointer-events:none}
.bs-ident .slash{position:absolute;left:50%;top:50%;width:3px;height:160vmax;margin:-80vmax 0 0 -1.5px;
  transform:rotate(-10.6deg) scaleY(0);background:linear-gradient(180deg,transparent,#fff 30%,#FF3EA5 50%,#fff 70%,transparent);
  box-shadow:0 0 30px 6px rgba(255,62,165,.85);pointer-events:none}
.bs-ident .skip{position:absolute;right:max(18px,env(safe-area-inset-right,0px));bottom:max(18px,env(safe-area-inset-bottom,0px));
  font:600 11px/1 "Instrument Sans",system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:rgba(243,238,249,.45)}
`;

// The screen splits on the mark's own cut: 12 units across for 64 down
// (js/brand.js KEEP/SLICE), leaning like a backslash.
const CUT_DEG = Math.atan(12 / 64) * 180 / Math.PI;

/** The two halves' clip paths for this screen, on the cut's angle. */
function splitPaths(w = innerWidth, h = innerHeight) {
  const d = (Math.tan(CUT_DEG * Math.PI / 180) * h / w) * 50;   // % of width, each side of centre
  return [
    `polygon(0 0,${50 - d}% 0,${50 + d}% 100%,0 100%)`,
    `polygon(${50 - d}% 0,100% 0,100% 100%,${50 + d}% 100%)`,
  ];
}

function build() {
  const root = document.createElement('div');
  root.className = 'bs-ident';
  root.setAttribute('role', 'presentation');
  root.innerHTML = `<style>${CSS}</style>`
    + `<div class="half l"></div><div class="half r"></div><div class="scan"></div><div class="line"></div>`
    + `<div class="flash"></div><div class="ring"></div>`
    + Array.from({ length: 14 }, () => '<i class="spark"></i>').join('')
    + `<div class="stage">${brandMark({ id: 'ident', animated: false, attrs: ' class="mark" viewBox="0 0 64 64" aria-hidden="true"' })}`
    + `<div class="word"><span class="n">${[...'BLINDSIDE'].map(c => `<span>${c}</span>`).join('')}</span><span class="s">NETWORK</span></div></div>`
    + `<div class="slash"></div><div class="skip">Click to skip</div>`;
  const [l, r] = splitPaths();
  root.querySelector('.half.l').style.clipPath = l;
  root.querySelector('.half.r').style.clipPath = r;
  return root;
}

/**
 * Play the ident over the page. Resolves when the page is uncovered.
 * `force` plays it even when the gate did not ask (the replay button).
 */
export function playIdent({ force = false } = {}) {
  const html = document.documentElement;
  if (!force && !identPending()) return Promise.resolve(false);
  try { localStorage.setItem(IDENT_KEY, today()); } catch { /* a private window simply sees it again */ }

  const root = build();
  document.body.appendChild(root);
  const $ = s => root.querySelector(s);
  const body = $('.bs-body'), slice = $('.bs-slice'), stage = $('.stage'), mark = $('.mark');
  const E = { easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' };
  const anims = [];
  const at = (el, frames, opts) => { if (el) anims.push(el.animate(frames, { ...E, ...opts })); };

  // 0.00 -- the set warms up
  at($('.line'), [{ transform: 'scaleX(0)', opacity: 1 }, { transform: 'scaleX(1)', opacity: 1, offset: .7 }, { transform: 'scaleX(1)', opacity: 0 }], { duration: 700 });
  // 0.25 -- the B rises, its edge missing
  // fill 'both' on each element's FIRST animation: it holds its opening frame
  // through the delay. Later ones are 'forwards', or they would override it.
  at(body, [{ transform: 'translateY(10px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, delay: 250, fill: 'both' });
  // 0.70 -- the cut piece slams in and sits flush
  at(slice, [
    { transform: 'translate(46px,-6px) skewX(-18deg)', opacity: 0 },
    { transform: 'translate(0,0)', opacity: 1, offset: .8 },
    { transform: 'translate(0,0)', opacity: 1 },
  ], { duration: 300, delay: 600, easing: 'cubic-bezier(.6,0,.9,.4)', fill: 'both' });
  // 1.00 -- the hit
  at(slice, [
    { transform: 'translate(0,0)' },
    { transform: 'translate(9px,11px)', offset: .35 },
    { transform: 'translate(2.8px,3.6px)', offset: .7 },
    { transform: 'translate(3.5px,4.5px)' },
  ], { duration: 520, delay: 1000, easing: 'cubic-bezier(.15,.9,.25,1)' });
  at(body, [{ transform: 'none' }, { transform: 'translate(-3px,0)', offset: .3 }, { transform: 'none' }], { duration: 380, delay: 1000 });
  at(mark, [
    { filter: 'drop-shadow(0 0 0 transparent)' },
    { filter: 'drop-shadow(-7px 0 0 #ff2a6d) drop-shadow(7px 0 0 #3ad1ff)', offset: .12 },
    { filter: 'drop-shadow(-2px 0 0 #ff2a6d) drop-shadow(2px 0 0 #3ad1ff)', offset: .5 },
    { filter: 'drop-shadow(0 0 22px rgba(255,62,165,.45))' },
  ], { duration: 600, delay: 1000 });
  at(stage, [
    { transform: 'translate(-50%,-56%)' }, { transform: 'translate(calc(-50% + 9px),calc(-56% - 5px))', offset: .15 },
    { transform: 'translate(calc(-50% - 7px),calc(-56% + 4px))', offset: .35 }, { transform: 'translate(calc(-50% + 3px),-56%)', offset: .6 },
    { transform: 'translate(-50%,-56%)' },
  ], { duration: 420, delay: 1000, easing: 'linear' });
  at($('.flash'), [{ opacity: 0 }, { opacity: 1, offset: .12 }, { opacity: 0 }], { duration: 700, delay: 1000, easing: 'ease-out' });
  at($('.ring'), [{ transform: 'scale(.2)', opacity: 1 }, { transform: 'scale(3.2)', opacity: 0 }], { duration: 800, delay: 1000, easing: 'cubic-bezier(.1,.7,.3,1)' });
  root.querySelectorAll('.spark').forEach((s, i) => {
    const a = (i / 14) * Math.PI * 2 + Math.random() * .4, d = 120 + Math.random() * 220;
    at(s, [{ transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(.2)`, opacity: 0 }],
    { duration: 650 + Math.random() * 350, delay: 1010, easing: 'cubic-bezier(.1,.8,.3,1)' });
  });
  // the wordmark comes up under it
  root.querySelectorAll('.word .n span').forEach((c, i) => at(c,
    [{ transform: 'translateY(40%)', opacity: 0 }, { transform: 'none', opacity: 1 }],
    { duration: 360, delay: 1120 + i * 28, fill: 'both' }));
  at($('.word .s'), [{ opacity: 0, letterSpacing: '.4em' }, { opacity: 1, letterSpacing: '.9em' }], { duration: 600, delay: 1350, fill: 'both' });

  // 1.80 -- the slash, and the split
  const SPLIT = 1850;
  return new Promise(resolve => {
    let done = false;
    const open = (fast = false) => {
      if (done) return;
      done = true;
      const t = fast ? 0 : SPLIT;
      const slash = $('.slash');
      at(slash, [{ transform: `rotate(${-CUT_DEG}deg) scaleY(0)`, opacity: 1 }, { transform: `rotate(${-CUT_DEG}deg) scaleY(1)`, opacity: 1, offset: .6 }, { transform: `rotate(${-CUT_DEG}deg) scaleY(1)`, opacity: 0 }],
        { duration: fast ? 260 : 360, delay: t - (fast ? 0 : 120) });
      setTimeout(() => html.classList.remove('bs-ident-on'), t + 60);
      at(stage, [{ opacity: 1 }, { opacity: 0, transform: 'translate(-50%,-56%) scale(1.06)' }], { duration: 260, delay: t + 40, easing: 'ease-in' });
      at($('.scan'), [{ opacity: .35 }, { opacity: 0 }], { duration: 200, delay: t });
      at($('.half.l'), [{ transform: 'none' }, { transform: 'translate(-62vw,-11vw)' }], { duration: 720, delay: t + 80, easing: 'cubic-bezier(.7,0,.2,1)' });
      at($('.half.r'), [{ transform: 'none' }, { transform: 'translate(62vw,11vw)' }], { duration: 720, delay: t + 80, easing: 'cubic-bezier(.7,0,.2,1)' });
      setTimeout(() => { removeEventListener('keydown', skip); root.remove(); resolve(true); }, t + 860);
    };
    // Skipping jumps everything to its end (the halves apart, the page shown)
    // and fades what is left.
    const skip = () => {
      removeEventListener('keydown', skip);
      anims.forEach(a => { try { a.finish(); } catch {} });
      html.classList.remove('bs-ident-on');
      const fade = root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' });
      fade.onfinish = () => { root.remove(); resolve(true); };
    };
    root.addEventListener('click', skip, { once: true });
    addEventListener('keydown', skip, { once: true });
    open(false);
  });
}

// ── self-start ──
if (typeof document !== 'undefined' && identPending()) {
  const go = () => playIdent().catch(() => document.documentElement.classList.remove('bs-ident-on'));
  if (document.body) go(); else addEventListener('DOMContentLoaded', go, { once: true });
}
