// ══════════════════════════════════════════════════════════════════════
// vp-tr/seer-stage.js — the Seer, played: the draw or the auction, the
// private room, the card, the flame
// ══════════════════════════════════════════════════════════════════════
//
// The words are the page's (seer.js), read by the shared line reader. The
// room is its own: a candle-lit table in the dark (the conclave's table plate,
// with no turret round it), the room's faces in a row while the power is won,
// then only the two of them across the table while the answer is given, on a
// card that turns over and then burns. Like every other file in this
// directory it imports no engine state.
import { seerStageData } from './seer.js';
import { trsStageShell as stageShell, trsFold, trsReg as reg, trsEsc as esc, trsFace as face } from './castle-stage.js';
import { beatLines } from './stage-lines.js';
import { footCard, playCard, CARD_CSS } from './stage-cards.js';
import { trPlay } from './sfx.js';

const hash = s => { let h = 7; for (const c of String(s)) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0; return h; };
const TABLE = 'assets/sets/traitors/conclave-table.webp';

export function seerStageScreen(ep, observer, pageHtml) {
  if (!pageHtml) return pageHtml;
  const init = () => {
    const data = seerStageData(ep, observer);
    if (!data) return { steps: [] };
    const steps = beatLines(data.beats, (n, part) => {
      if (part === 'envs' || part === 'bids') return [];
      if (part === 'cardreveal') return [{ t: 'narr', tag: 'The answer', text: (n.textContent || '').trim(), card: true }];
      return null;
    });
    return { data, steps };
  };
  const uid = 'tse-' + String(ep.num) + '-' + (hash(observer) % 1e6);
  reg()[uid] = { uid, steps: null, init, idx: -1, title: 'The Seer', eyebrow: 'The Traitors · The Endgame', noClock: true,
    day: (ep.tr && ep.tr.ep) || ep.num, pot: null, timers: [], painter: paint };
  if (typeof queueMicrotask === 'function' && typeof window !== 'undefined' && window.trStageMountAll) {
    queueMicrotask(window.trStageMountAll);
  }
  return trsFold(stageShell(uid, '<div class="tse"></div><div class="trs-corner"></div><div class="trs-start"></div>', CARD_CSS + CSS), pageHtml);
}

function paint(root, S, fresh) {
  const view = root.querySelector('.trs-view'), el = root.querySelector('.tse');
  const W = view.clientWidth;
  if (!W) return;
  const R = S.data.S, H = R.seer, SU = R.subject;
  const award = R.award || { method: 'draw' };
  const start = root.querySelector('.trs-start');
  const st = S.idx >= 0 ? S.steps[S.idx] : null;
  const kind = st ? st.kind : 'award';
  const speaker = st && st.t === 'say' ? st.who : null;
  // within this beat, has the winner been shown yet?
  const beatSteps = st ? S.steps.slice(0, S.idx + 1).filter(x => x.beat === st.beat) : [];
  const won = kind !== 'award' || beatSteps.some(x => x.who === H || (x.t === 'narr' && x.text && x.text.includes(H)));
  let h = '<div class="tse-room"><div class="tse-glow"></div><img class="tse-table" src="' + TABLE + '" alt="" draggable="false">';

  if (kind === 'meeting') {
    // the two of them, across the table, and the card between them
    const cardStep = S.steps.findIndex(x => x.beat === st.beat && x.card);
    const shown = cardStep >= 0 && S.idx >= cardStep;
    const burned = shown && beatSteps.some(x => x.t === 'narr' && /flame|candle|ash/.test(x.text || '') && S.steps.indexOf(x) > cardStep);
    const seat = (n, side) => `<div class="tse-p tse-${side}${n === speaker ? ' tse-speak' : (speaker ? ' tse-quiet' : '')}"><div class="tse-av">${face(n)}</div><div class="tse-nm">${esc(n)}</div></div>`;
    h += seat(H, 'l') + seat(SU, 'r');
    const truth = R.truth === 'traitor' ? 'traitor' : 'faithful';
    h += `<div class="tse-card${shown ? ' tse-shown' : ''}${burned ? ' tse-burn' : ''}" data-truth="${truth}"><div class="tse-card-in">`
      + `<div class="tse-back">?</div><div class="tse-front">${truth === 'traitor' ? 'Traitor' : 'Faithful'}</div></div><i class="tse-fire"></i></div>`;
  } else {
    // the room, in a row: an envelope or a sealed bid under each, the winner lit
    const room = (award.room || R.room || []);
    const bids = new Map((award.bids || []).map(b => [b.name, b.amount]));
    const n = room.length;
    room.forEach((name, i) => {
      const x = n === 1 ? 50 : 12 + (76 * i) / (n - 1);
      const lit = (won && name === H) || (kind === 'choose' && name === SU && S.idx > 0);
      const cls = ['tse-q', name === speaker ? 'tse-speak' : (speaker ? 'tse-quiet' : ''), lit ? 'tse-lit' : ''].join(' ');
      const under = award.method === 'auction'
        ? `<b class="tse-amt${won ? ' tse-open' : ''}">${won ? '£' + Math.round(bids.get(name) || 0).toLocaleString('en-GB') : 'sealed'}</b>`
        : `<i class="tse-env${won && name === H ? ' tse-eye' : ''}${won ? ' tse-open' : ''}"></i>`;
      h += `<div class="${cls}" style="left:${x}%"><div class="tse-av">${face(name)}</div><div class="tse-nm">${esc(name)}</div>${kind === 'award' ? under : ''}</div>`;
    });
  }
  h += '</div>';
  if (S.idx === 0 && fresh) h += '<div class="tse-title" data-a="The Seer" data-b="One question, once"></div>';
  if (!st) {
    el.innerHTML = h;
    start.innerHTML = `<b>The Seer</b><span>${award.method === 'auction' ? 'Auctioned from the prize fund' : 'Won in a draw'} · press Next, or click the room</span>`;
    start.classList.add('trs-in');
    root.querySelector('.trs-corner').classList.remove('trs-in');
    return;
  }
  start.classList.remove('trs-in');
  h += footCard(st, S.data.host || { name: '', slug: null });
  el.innerHTML = h;
  playCard(el, st, S, fresh);
  if (fresh && st.card) trPlay('tr-slate');
  const corner = root.querySelector('.trs-corner');
  corner.innerHTML = 'The Seer · <b>' + esc(kind === 'award' ? (award.method === 'auction' ? 'The auction' : 'The draw')
    : kind === 'choose' ? 'The choice' : kind === 'meeting' ? 'The meeting' : 'Back in the room') + '</b>';
  corner.classList.add('trs-in');
}

const CSS = `
.tse{position:absolute;inset:0;overflow:hidden;background:#030407}
.tse-room{position:absolute;inset:0}
.tse-glow{position:absolute;inset:0;background:radial-gradient(42% 46% at 50% 66%,rgba(255,190,110,.32),rgba(120,70,30,.08) 55%,transparent 75%),
  radial-gradient(60% 50% at 50% 20%,rgba(80,120,180,.12),transparent 70%);animation:tseFlick 3.2s ease-in-out infinite}
@keyframes tseFlick{0%,100%{opacity:1}45%{opacity:.86}60%{opacity:.95}}
.tse-table{position:absolute;left:50%;bottom:-6%;width:86%;transform:translateX(-50%);pointer-events:none}
.tse-q{position:absolute;top:30%;transform:translate(-50%,0);display:flex;flex-direction:column;align-items:center;gap:4px;width:9%;max-width:96px;transition:transform .45s,filter .45s}
.tse-av{position:relative;width:100%;aspect-ratio:1/1.12;overflow:hidden;border-radius:50% 50% 12% 12%/44% 44% 9% 9%;background:#0b0e14;
  box-shadow:0 0 0 2px rgba(200,215,240,.25),0 8px 18px rgba(0,0,0,.85)}
.tse-av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%}
.tse-nm{padding:1px 6px;white-space:nowrap;font-family:var(--v-display);font-weight:700;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#dfe6f2;background:rgba(4,5,8,.78)}
.tse-quiet{filter:brightness(.5) saturate(.7)}
.tse-speak{transform:translate(-50%,-8%) scale(1.25)}
.tse-lit .tse-av{box-shadow:0 0 0 2px #9ad1ff,0 0 26px rgba(154,209,255,.7),0 8px 18px rgba(0,0,0,.85)}
.tse-lit{transform:translate(-50%,-6%) scale(1.18)}
.tse-env{display:block;width:70%;aspect-ratio:3/2;margin-top:4px;background:linear-gradient(160deg,#e9e1cf,#c9bfa8);border-radius:2px;position:relative;box-shadow:0 4px 10px rgba(0,0,0,.6)}
.tse-env::after{content:"";position:absolute;left:0;right:0;top:0;height:55%;background:linear-gradient(180deg,#d8cfb9,#bfb49b);clip-path:polygon(0 0,100% 0,50% 100%);transition:transform .5s;transform-origin:top}
.tse-env.tse-open::after{transform:scaleY(-1)}
.tse-env.tse-eye{background:radial-gradient(circle at 50% 62%,#9ad1ff 0 12%,#1b2a44 13% 24%,#e9e1cf 25%)}
.tse-amt{margin-top:4px;padding:2px 6px;font-size:12px;color:#7f8aa0;background:rgba(10,12,18,.8);border:1px solid rgba(154,209,255,.2)}
.tse-amt.tse-open{color:#cfe6ff}
.tse-p{position:absolute;top:22%;width:15%;max-width:170px;display:flex;flex-direction:column;align-items:center;gap:6px;transition:transform .45s,filter .45s}
.tse-p.tse-l{left:16%}.tse-p.tse-r{right:16%}
.tse-p.tse-speak{transform:scale(1.1)}
.tse-card{position:absolute;left:50%;top:30%;width:15%;max-width:180px;aspect-ratio:5/7;transform:translateX(-50%);perspective:900px}
.tse-card-in{position:absolute;inset:0;transform-style:preserve-3d;transition:transform 1s cubic-bezier(.2,.8,.2,1)}
.tse-shown .tse-card-in{transform:rotateY(180deg)}
.tse-back,.tse-front{position:absolute;inset:0;display:grid;place-items:center;backface-visibility:hidden;border-radius:6px;
  font-family:var(--v-display);font-weight:900;letter-spacing:.2em;text-transform:uppercase;box-shadow:0 14px 30px rgba(0,0,0,.7)}
.tse-back{background:linear-gradient(160deg,#1b2a44,#0c1220);color:#9ad1ff;font-size:44px;border:2px solid rgba(154,209,255,.4)}
.tse-front{transform:rotateY(180deg);background:linear-gradient(170deg,#f3ecdc,#d9ceb4);color:#1a1410;font-size:clamp(12px,1.5vw,20px);border:3px double #6b5a3a}
.tse-card[data-truth="traitor"] .tse-front{color:#8f1020}
.tse-fire{position:absolute;inset:-10% -10% 0;opacity:0;pointer-events:none;background:radial-gradient(60% 50% at 50% 100%,rgba(255,150,50,.95),rgba(255,80,20,.6) 40%,transparent 70%);filter:blur(4px)}
.tse-burn .tse-fire{animation:tseBurn 2.6s ease-in forwards}
.tse-burn .tse-card-in{animation:tseAsh 2.6s ease-in forwards}
@keyframes tseBurn{0%{opacity:0;transform:scaleY(.3)}30%{opacity:1}100%{opacity:0;transform:scaleY(1.4) translateY(-30%)}}
@keyframes tseAsh{0%{filter:none;opacity:1;transform:rotateY(180deg)}60%{filter:sepia(1) brightness(.4);opacity:.8;transform:rotateY(180deg)}100%{filter:brightness(0);opacity:0;transform:rotateY(180deg) translateY(-12%) scale(.9)}}
.tse-title{position:absolute;inset:0;z-index:3500;display:grid;place-items:center;pointer-events:none;animation:tseTitle 3s ease both}
.tse-title::before{content:attr(data-a);grid-area:1/1;transform:translateY(-18%);font-family:var(--v-display);font-weight:900;font-size:clamp(40px,7vw,100px);
  letter-spacing:.2em;text-transform:uppercase;color:#eaf4ff;text-shadow:0 0 40px rgba(120,190,255,.6),0 8px 0 rgba(0,0,0,.6)}
.tse-title::after{content:attr(data-b);grid-area:1/1;transform:translateY(170%);font-family:var(--v-display);font-weight:700;font-size:13px;letter-spacing:.6em;text-transform:uppercase;color:#9ad1ff}
@keyframes tseTitle{0%{opacity:0;transform:scale(1.6);filter:blur(10px)}14%{opacity:1;transform:none;filter:none}70%{opacity:1}100%{opacity:0;transform:scale(.96)}}
@media (prefers-reduced-motion:reduce){.tse-title,.tse-glow,.tse-burn .tse-fire,.tse-burn .tse-card-in{animation:none!important}}
`;
